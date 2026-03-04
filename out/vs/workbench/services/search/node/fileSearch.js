/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "fs", "vs/base/common/path", "string_decoder", "vs/base/common/arrays", "vs/base/common/errorMessage", "vs/base/common/glob", "vs/base/common/normalization", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/common/stopwatch", "vs/base/common/strings", "vs/base/common/types", "vs/base/node/pfs", "vs/workbench/services/search/common/search", "./ripgrepFileSearch", "vs/base/common/fuzzyScorer"], function (require, exports, childProcess, fs, path, string_decoder_1, arrays, errorMessage_1, glob, normalization, extpath_1, platform, stopwatch_1, strings, types, pfs_1, search_1, ripgrepFileSearch_1, fuzzyScorer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Engine = exports.FileWalker = void 0;
    const killCmds = new Set();
    process.on('exit', () => {
        killCmds.forEach(cmd => cmd());
    });
    class FileWalker {
        constructor(config) {
            this.normalizedFilePatternLowercase = null;
            this.maxFilesize = null;
            this.isCanceled = false;
            this.fileWalkSW = null;
            this.cmdSW = null;
            this.cmdResultCount = 0;
            this.config = config;
            this.filePattern = config.filePattern || '';
            this.includePattern = config.includePattern && glob.parse(config.includePattern);
            this.maxResults = config.maxResults || null;
            this.exists = !!config.exists;
            this.walkedPaths = Object.create(null);
            this.resultCount = 0;
            this.isLimitHit = false;
            this.directoriesWalked = 0;
            this.filesWalked = 0;
            this.errors = [];
            if (this.filePattern) {
                this.normalizedFilePatternLowercase = config.shouldGlobMatchFilePattern ? null : (0, fuzzyScorer_1.prepareQuery)(this.filePattern).normalizedLowercase;
            }
            this.globalExcludePattern = config.excludePattern && glob.parse(config.excludePattern);
            this.folderExcludePatterns = new Map();
            config.folderQueries.forEach(folderQuery => {
                const folderExcludeExpression = Object.assign({}, folderQuery.excludePattern || {}, this.config.excludePattern || {});
                // Add excludes for other root folders
                const fqPath = folderQuery.folder.fsPath;
                config.folderQueries
                    .map(rootFolderQuery => rootFolderQuery.folder.fsPath)
                    .filter(rootFolder => rootFolder !== fqPath)
                    .forEach(otherRootFolder => {
                    // Exclude nested root folders
                    if ((0, extpath_1.isEqualOrParent)(otherRootFolder, fqPath)) {
                        folderExcludeExpression[path.relative(fqPath, otherRootFolder)] = true;
                    }
                });
                this.folderExcludePatterns.set(fqPath, new AbsoluteAndRelativeParsedExpression(folderExcludeExpression, fqPath));
            });
        }
        cancel() {
            this.isCanceled = true;
            killCmds.forEach(cmd => cmd());
        }
        walk(folderQueries, extraFiles, onResult, onMessage, done) {
            this.fileWalkSW = stopwatch_1.StopWatch.create(false);
            // Support that the file pattern is a full path to a file that exists
            if (this.isCanceled) {
                return done(null, this.isLimitHit);
            }
            // For each extra file
            extraFiles.forEach(extraFilePath => {
                const basename = path.basename(extraFilePath.fsPath);
                if (this.globalExcludePattern && this.globalExcludePattern(extraFilePath.fsPath, basename)) {
                    return; // excluded
                }
                // File: Check for match on file pattern and include pattern
                this.matchFile(onResult, { relativePath: extraFilePath.fsPath /* no workspace relative path */, searchPath: undefined });
            });
            this.cmdSW = stopwatch_1.StopWatch.create(false);
            // For each root folder
            this.parallel(folderQueries, (folderQuery, rootFolderDone) => {
                this.call(this.cmdTraversal, this, folderQuery, onResult, onMessage, (err) => {
                    if (err) {
                        const errorMessage = (0, errorMessage_1.toErrorMessage)(err);
                        console.error(errorMessage);
                        this.errors.push(errorMessage);
                        rootFolderDone(err, undefined);
                    }
                    else {
                        rootFolderDone(null, undefined);
                    }
                });
            }, (errors, _result) => {
                this.fileWalkSW.stop();
                const err = errors ? arrays.coalesce(errors)[0] : null;
                done(err, this.isLimitHit);
            });
        }
        parallel(list, fn, callback) {
            const results = new Array(list.length);
            const errors = new Array(list.length);
            let didErrorOccur = false;
            let doneCount = 0;
            if (list.length === 0) {
                return callback(null, []);
            }
            list.forEach((item, index) => {
                fn(item, (error, result) => {
                    if (error) {
                        didErrorOccur = true;
                        results[index] = null;
                        errors[index] = error;
                    }
                    else {
                        results[index] = result;
                        errors[index] = null;
                    }
                    if (++doneCount === list.length) {
                        return callback(didErrorOccur ? errors : null, results);
                    }
                });
            });
        }
        call(fun, that, ...args) {
            try {
                fun.apply(that, args);
            }
            catch (e) {
                args[args.length - 1](e);
            }
        }
        cmdTraversal(folderQuery, onResult, onMessage, cb) {
            const rootFolder = folderQuery.folder.fsPath;
            const isMac = platform.isMacintosh;
            const killCmd = () => cmd && cmd.kill();
            killCmds.add(killCmd);
            let done = (err) => {
                killCmds.delete(killCmd);
                done = () => { };
                cb(err);
            };
            let leftover = '';
            const tree = this.initDirectoryTree();
            const ripgrep = (0, ripgrepFileSearch_1.spawnRipgrepCmd)(this.config, folderQuery, this.config.includePattern, this.folderExcludePatterns.get(folderQuery.folder.fsPath).expression);
            const cmd = ripgrep.cmd;
            const noSiblingsClauses = !Object.keys(ripgrep.siblingClauses).length;
            const escapedArgs = ripgrep.rgArgs.args
                .map(arg => arg.match(/^-/) ? arg : `'${arg}'`)
                .join(' ');
            let rgCmd = `${ripgrep.rgDiskPath} ${escapedArgs}\n - cwd: ${ripgrep.cwd}`;
            if (ripgrep.rgArgs.siblingClauses) {
                rgCmd += `\n - Sibling clauses: ${JSON.stringify(ripgrep.rgArgs.siblingClauses)}`;
            }
            onMessage({ message: rgCmd });
            this.cmdResultCount = 0;
            this.collectStdout(cmd, 'utf8', onMessage, (err, stdout, last) => {
                if (err) {
                    done(err);
                    return;
                }
                if (this.isLimitHit) {
                    done();
                    return;
                }
                // Mac: uses NFD unicode form on disk, but we want NFC
                const normalized = leftover + (isMac ? normalization.normalizeNFC(stdout || '') : stdout);
                const relativeFiles = normalized.split('\n');
                if (last) {
                    const n = relativeFiles.length;
                    relativeFiles[n - 1] = relativeFiles[n - 1].trim();
                    if (!relativeFiles[n - 1]) {
                        relativeFiles.pop();
                    }
                }
                else {
                    leftover = relativeFiles.pop() || '';
                }
                if (relativeFiles.length && relativeFiles[0].indexOf('\n') !== -1) {
                    done(new Error('Splitting up files failed'));
                    return;
                }
                this.cmdResultCount += relativeFiles.length;
                if (noSiblingsClauses) {
                    for (const relativePath of relativeFiles) {
                        this.matchFile(onResult, { base: rootFolder, relativePath, searchPath: this.getSearchPath(folderQuery, relativePath) });
                        if (this.isLimitHit) {
                            killCmd();
                            break;
                        }
                    }
                    if (last || this.isLimitHit) {
                        done();
                    }
                    return;
                }
                // TODO: Optimize siblings clauses with ripgrep here.
                this.addDirectoryEntries(folderQuery, tree, rootFolder, relativeFiles, onResult);
                if (last) {
                    this.matchDirectoryTree(tree, rootFolder, onResult);
                    done();
                }
            });
        }
        /**
         * Public for testing.
         */
        spawnFindCmd(folderQuery) {
            const excludePattern = this.folderExcludePatterns.get(folderQuery.folder.fsPath);
            const basenames = excludePattern.getBasenameTerms();
            const pathTerms = excludePattern.getPathTerms();
            const args = ['-L', '.'];
            if (basenames.length || pathTerms.length) {
                args.push('-not', '(', '(');
                for (const basename of basenames) {
                    args.push('-name', basename);
                    args.push('-o');
                }
                for (const path of pathTerms) {
                    args.push('-path', path);
                    args.push('-o');
                }
                args.pop();
                args.push(')', '-prune', ')');
            }
            args.push('-type', 'f');
            return childProcess.spawn('find', args, { cwd: folderQuery.folder.fsPath });
        }
        /**
         * Public for testing.
         */
        readStdout(cmd, encoding, cb) {
            let all = '';
            this.collectStdout(cmd, encoding, () => { }, (err, stdout, last) => {
                if (err) {
                    cb(err);
                    return;
                }
                all += stdout;
                if (last) {
                    cb(null, all);
                }
            });
        }
        collectStdout(cmd, encoding, onMessage, cb) {
            let onData = (err, stdout, last) => {
                if (err || last) {
                    onData = () => { };
                    this.cmdSW?.stop();
                }
                cb(err, stdout, last);
            };
            let gotData = false;
            if (cmd.stdout) {
                // Should be non-null, but #38195
                this.forwardData(cmd.stdout, encoding, onData);
                cmd.stdout.once('data', () => gotData = true);
            }
            else {
                onMessage({ message: 'stdout is null' });
            }
            let stderr;
            if (cmd.stderr) {
                // Should be non-null, but #38195
                stderr = this.collectData(cmd.stderr);
            }
            else {
                onMessage({ message: 'stderr is null' });
            }
            cmd.on('error', (err) => {
                onData(err);
            });
            cmd.on('close', (code) => {
                // ripgrep returns code=1 when no results are found
                let stderrText;
                if (!gotData && (stderrText = this.decodeData(stderr, encoding)) && rgErrorMsgForDisplay(stderrText)) {
                    onData(new Error(`command failed with error code ${code}: ${this.decodeData(stderr, encoding)}`));
                }
                else {
                    if (this.exists && code === 0) {
                        this.isLimitHit = true;
                    }
                    onData(null, '', true);
                }
            });
        }
        forwardData(stream, encoding, cb) {
            const decoder = new string_decoder_1.StringDecoder(encoding);
            stream.on('data', (data) => {
                cb(null, decoder.write(data));
            });
            return decoder;
        }
        collectData(stream) {
            const buffers = [];
            stream.on('data', (data) => {
                buffers.push(data);
            });
            return buffers;
        }
        decodeData(buffers, encoding) {
            const decoder = new string_decoder_1.StringDecoder(encoding);
            return buffers.map(buffer => decoder.write(buffer)).join('');
        }
        initDirectoryTree() {
            const tree = {
                rootEntries: [],
                pathToEntries: Object.create(null)
            };
            tree.pathToEntries['.'] = tree.rootEntries;
            return tree;
        }
        addDirectoryEntries(folderQuery, { pathToEntries }, base, relativeFiles, onResult) {
            // Support relative paths to files from a root resource (ignores excludes)
            if (relativeFiles.indexOf(this.filePattern) !== -1) {
                this.matchFile(onResult, {
                    base,
                    relativePath: this.filePattern,
                    searchPath: this.getSearchPath(folderQuery, this.filePattern)
                });
            }
            const add = (relativePath) => {
                const basename = path.basename(relativePath);
                const dirname = path.dirname(relativePath);
                let entries = pathToEntries[dirname];
                if (!entries) {
                    entries = pathToEntries[dirname] = [];
                    add(dirname);
                }
                entries.push({
                    base,
                    relativePath,
                    basename,
                    searchPath: this.getSearchPath(folderQuery, relativePath),
                });
            };
            relativeFiles.forEach(add);
        }
        matchDirectoryTree({ rootEntries, pathToEntries }, rootFolder, onResult) {
            const self = this;
            const excludePattern = this.folderExcludePatterns.get(rootFolder);
            const filePattern = this.filePattern;
            function matchDirectory(entries) {
                self.directoriesWalked++;
                const hasSibling = (0, search_1.hasSiblingFn)(() => entries.map(entry => entry.basename));
                for (let i = 0, n = entries.length; i < n; i++) {
                    const entry = entries[i];
                    const { relativePath, basename } = entry;
                    // Check exclude pattern
                    // If the user searches for the exact file name, we adjust the glob matching
                    // to ignore filtering by siblings because the user seems to know what they
                    // are searching for and we want to include the result in that case anyway
                    if (excludePattern.test(relativePath, basename, filePattern !== basename ? hasSibling : undefined)) {
                        continue;
                    }
                    const sub = pathToEntries[relativePath];
                    if (sub) {
                        matchDirectory(sub);
                    }
                    else {
                        self.filesWalked++;
                        if (relativePath === filePattern) {
                            continue; // ignore file if its path matches with the file pattern because that is already matched above
                        }
                        self.matchFile(onResult, entry);
                    }
                    if (self.isLimitHit) {
                        break;
                    }
                }
            }
            matchDirectory(rootEntries);
        }
        getStats() {
            return {
                cmdTime: this.cmdSW.elapsed(),
                fileWalkTime: this.fileWalkSW.elapsed(),
                directoriesWalked: this.directoriesWalked,
                filesWalked: this.filesWalked,
                cmdResultCount: this.cmdResultCount
            };
        }
        doWalk(folderQuery, relativeParentPath, files, onResult, done) {
            const rootFolder = folderQuery.folder;
            // Execute tasks on each file in parallel to optimize throughput
            const hasSibling = (0, search_1.hasSiblingFn)(() => files);
            this.parallel(files, (file, clb) => {
                // Check canceled
                if (this.isCanceled || this.isLimitHit) {
                    return clb(null);
                }
                // Check exclude pattern
                // If the user searches for the exact file name, we adjust the glob matching
                // to ignore filtering by siblings because the user seems to know what they
                // are searching for and we want to include the result in that case anyway
                const currentRelativePath = relativeParentPath ? [relativeParentPath, file].join(path.sep) : file;
                if (this.folderExcludePatterns.get(folderQuery.folder.fsPath).test(currentRelativePath, file, this.config.filePattern !== file ? hasSibling : undefined)) {
                    return clb(null);
                }
                // Use lstat to detect links
                const currentAbsolutePath = [rootFolder.fsPath, currentRelativePath].join(path.sep);
                fs.lstat(currentAbsolutePath, (error, lstat) => {
                    if (error || this.isCanceled || this.isLimitHit) {
                        return clb(null);
                    }
                    // If the path is a link, we must instead use fs.stat() to find out if the
                    // link is a directory or not because lstat will always return the stat of
                    // the link which is always a file.
                    this.statLinkIfNeeded(currentAbsolutePath, lstat, (error, stat) => {
                        if (error || this.isCanceled || this.isLimitHit) {
                            return clb(null);
                        }
                        // Directory: Follow directories
                        if (stat.isDirectory()) {
                            this.directoriesWalked++;
                            // to really prevent loops with links we need to resolve the real path of them
                            return this.realPathIfNeeded(currentAbsolutePath, lstat, (error, realpath) => {
                                if (error || this.isCanceled || this.isLimitHit) {
                                    return clb(null);
                                }
                                realpath = realpath || '';
                                if (this.walkedPaths[realpath]) {
                                    return clb(null); // escape when there are cycles (can happen with symlinks)
                                }
                                this.walkedPaths[realpath] = true; // remember as walked
                                // Continue walking
                                return pfs_1.Promises.readdir(currentAbsolutePath).then(children => {
                                    if (this.isCanceled || this.isLimitHit) {
                                        return clb(null);
                                    }
                                    this.doWalk(folderQuery, currentRelativePath, children, onResult, err => clb(err || null));
                                }, error => {
                                    clb(null);
                                });
                            });
                        }
                        // File: Check for match on file pattern and include pattern
                        else {
                            this.filesWalked++;
                            if (currentRelativePath === this.filePattern) {
                                return clb(null, undefined); // ignore file if its path matches with the file pattern because checkFilePatternRelativeMatch() takes care of those
                            }
                            if (this.maxFilesize && types.isNumber(stat.size) && stat.size > this.maxFilesize) {
                                return clb(null, undefined); // ignore file if max file size is hit
                            }
                            this.matchFile(onResult, {
                                base: rootFolder.fsPath,
                                relativePath: currentRelativePath,
                                searchPath: this.getSearchPath(folderQuery, currentRelativePath),
                            });
                        }
                        // Unwind
                        return clb(null, undefined);
                    });
                });
            }, (error) => {
                const filteredErrors = error ? arrays.coalesce(error) : error; // find any error by removing null values first
                return done(filteredErrors && filteredErrors.length > 0 ? filteredErrors[0] : undefined);
            });
        }
        matchFile(onResult, candidate) {
            if (this.isFileMatch(candidate) && (!this.includePattern || this.includePattern(candidate.relativePath, path.basename(candidate.relativePath)))) {
                this.resultCount++;
                if (this.exists || (this.maxResults && this.resultCount > this.maxResults)) {
                    this.isLimitHit = true;
                }
                if (!this.isLimitHit) {
                    onResult(candidate);
                }
            }
        }
        isFileMatch(candidate) {
            // Check for search pattern
            if (this.filePattern) {
                if (this.filePattern === '*') {
                    return true; // support the all-matching wildcard
                }
                if (this.normalizedFilePatternLowercase) {
                    return (0, search_1.isFilePatternMatch)(candidate, this.normalizedFilePatternLowercase);
                }
                else if (this.filePattern) {
                    return (0, search_1.isFilePatternMatch)(candidate, this.filePattern, false);
                }
            }
            // No patterns means we match all
            return true;
        }
        statLinkIfNeeded(path, lstat, clb) {
            if (lstat.isSymbolicLink()) {
                return fs.stat(path, clb); // stat the target the link points to
            }
            return clb(null, lstat); // not a link, so the stat is already ok for us
        }
        realPathIfNeeded(path, lstat, clb) {
            if (lstat.isSymbolicLink()) {
                return fs.realpath(path, (error, realpath) => {
                    if (error) {
                        return clb(error);
                    }
                    return clb(null, realpath);
                });
            }
            return clb(null, path);
        }
        /**
         * If we're searching for files in multiple workspace folders, then better prepend the
         * name of the workspace folder to the path of the file. This way we'll be able to
         * better filter files that are all on the top of a workspace folder and have all the
         * same name. A typical example are `package.json` or `README.md` files.
         */
        getSearchPath(folderQuery, relativePath) {
            if (folderQuery.folderName) {
                return path.join(folderQuery.folderName, relativePath);
            }
            return relativePath;
        }
    }
    exports.FileWalker = FileWalker;
    class Engine {
        constructor(config) {
            this.folderQueries = config.folderQueries;
            this.extraFiles = config.extraFileResources || [];
            this.walker = new FileWalker(config);
        }
        search(onResult, onProgress, done) {
            this.walker.walk(this.folderQueries, this.extraFiles, onResult, onProgress, (err, isLimitHit) => {
                done(err, {
                    limitHit: isLimitHit,
                    stats: this.walker.getStats(),
                    messages: [],
                });
            });
        }
        cancel() {
            this.walker.cancel();
        }
    }
    exports.Engine = Engine;
    /**
     * This class exists to provide one interface on top of two ParsedExpressions, one for absolute expressions and one for relative expressions.
     * The absolute and relative expressions don't "have" to be kept separate, but this keeps us from having to path.join every single
     * file searched, it's only used for a text search with a searchPath
     */
    class AbsoluteAndRelativeParsedExpression {
        constructor(expression, root) {
            this.expression = expression;
            this.root = root;
            this.init(expression);
        }
        /**
         * Split the IExpression into its absolute and relative components, and glob.parse them separately.
         */
        init(expr) {
            let absoluteGlobExpr;
            let relativeGlobExpr;
            Object.keys(expr)
                .filter(key => expr[key])
                .forEach(key => {
                if (path.isAbsolute(key)) {
                    absoluteGlobExpr = absoluteGlobExpr || glob.getEmptyExpression();
                    absoluteGlobExpr[key] = expr[key];
                }
                else {
                    relativeGlobExpr = relativeGlobExpr || glob.getEmptyExpression();
                    relativeGlobExpr[key] = expr[key];
                }
            });
            this.absoluteParsedExpr = absoluteGlobExpr && glob.parse(absoluteGlobExpr, { trimForExclusions: true });
            this.relativeParsedExpr = relativeGlobExpr && glob.parse(relativeGlobExpr, { trimForExclusions: true });
        }
        test(_path, basename, hasSibling) {
            return (this.relativeParsedExpr && this.relativeParsedExpr(_path, basename, hasSibling)) ||
                (this.absoluteParsedExpr && this.absoluteParsedExpr(path.join(this.root, _path), basename, hasSibling));
        }
        getBasenameTerms() {
            const basenameTerms = [];
            if (this.absoluteParsedExpr) {
                basenameTerms.push(...glob.getBasenameTerms(this.absoluteParsedExpr));
            }
            if (this.relativeParsedExpr) {
                basenameTerms.push(...glob.getBasenameTerms(this.relativeParsedExpr));
            }
            return basenameTerms;
        }
        getPathTerms() {
            const pathTerms = [];
            if (this.absoluteParsedExpr) {
                pathTerms.push(...glob.getPathTerms(this.absoluteParsedExpr));
            }
            if (this.relativeParsedExpr) {
                pathTerms.push(...glob.getPathTerms(this.relativeParsedExpr));
            }
            return pathTerms;
        }
    }
    function rgErrorMsgForDisplay(msg) {
        const lines = msg.trim().split('\n');
        const firstLine = lines[0].trim();
        if (firstLine.startsWith('Error parsing regex')) {
            return firstLine;
        }
        if (firstLine.startsWith('regex parse error')) {
            return strings.uppercaseFirstLetter(lines[lines.length - 1].trim());
        }
        if (firstLine.startsWith('error parsing glob') ||
            firstLine.startsWith('unsupported encoding')) {
            // Uppercase first letter
            return firstLine.charAt(0).toUpperCase() + firstLine.substr(1);
        }
        if (firstLine === `Literal '\\n' not allowed.`) {
            // I won't localize this because none of the Ripgrep error messages are localized
            return `Literal '\\n' currently not supported`;
        }
        if (firstLine.startsWith('Literal ')) {
            // Other unsupported chars
            return firstLine;
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVNlYXJjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvbm9kZS9maWxlU2VhcmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdDaEcsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWMsQ0FBQztJQUN2QyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFDdkIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDaEMsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFhLFVBQVU7UUF1QnRCLFlBQVksTUFBa0I7WUFwQnRCLG1DQUE4QixHQUFrQixJQUFJLENBQUM7WUFJckQsZ0JBQVcsR0FBa0IsSUFBSSxDQUFDO1lBR2xDLGVBQVUsR0FBRyxLQUFLLENBQUM7WUFDbkIsZUFBVSxHQUFxQixJQUFJLENBQUM7WUFJcEMsVUFBSyxHQUFxQixJQUFJLENBQUM7WUFDL0IsbUJBQWMsR0FBVyxDQUFDLENBQUM7WUFRbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztZQUM1QyxJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDakYsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQztZQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzlCLElBQUksQ0FBQyxX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