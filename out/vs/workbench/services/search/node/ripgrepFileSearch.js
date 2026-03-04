/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/path", "vs/base/common/normalization", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/common/strings", "vs/workbench/services/search/node/ripgrepSearchUtils", "@vscode/ripgrep"], function (require, exports, cp, path, normalization_1, extpath, platform_1, strings, ripgrepSearchUtils_1, ripgrep_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.spawnRipgrepCmd = spawnRipgrepCmd;
    exports.getAbsoluteGlob = getAbsoluteGlob;
    exports.fixDriveC = fixDriveC;
    // If @vscode/ripgrep is in an .asar file, then the binary is unpacked.
    const rgDiskPath = ripgrep_1.rgPath.replace(/\bnode_modules\.asar\b/, 'node_modules.asar.unpacked');
    function spawnRipgrepCmd(config, folderQuery, includePattern, excludePattern) {
        const rgArgs = getRgArgs(config, folderQuery, includePattern, excludePattern);
        const cwd = folderQuery.folder.fsPath;
        return {
            cmd: cp.spawn(rgDiskPath, rgArgs.args, { cwd }),
            rgDiskPath,
            siblingClauses: rgArgs.siblingClauses,
            rgArgs,
            cwd
        };
    }
    function getRgArgs(config, folderQuery, includePattern, excludePattern) {
        const args = ['--files', '--hidden', '--case-sensitive', '--no-require-git'];
        // includePattern can't have siblingClauses
        foldersToIncludeGlobs([folderQuery], includePattern, false).forEach(globArg => {
            const inclusion = (0, ripgrepSearchUtils_1.anchorGlob)(globArg);
            args.push('-g', inclusion);
            if (platform_1.isMacintosh) {
                const normalized = (0, normalization_1.normalizeNFD)(inclusion);
                if (normalized !== inclusion) {
                    args.push('-g', normalized);
                }
            }
        });
        const rgGlobs = foldersToRgExcludeGlobs([folderQuery], excludePattern, undefined, false);
        rgGlobs.globArgs.forEach(globArg => {
            const exclusion = `!${(0, ripgrepSearchUtils_1.anchorGlob)(globArg)}`;
            args.push('-g', exclusion);
            if (platform_1.isMacintosh) {
                const normalized = (0, normalization_1.normalizeNFD)(exclusion);
                if (normalized !== exclusion) {
                    args.push('-g', normalized);
                }
            }
        });
        if (folderQuery.disregardIgnoreFiles !== false) {
            // Don't use .gitignore or .ignore
            args.push('--no-ignore');
        }
        else if (folderQuery.disregardParentIgnoreFiles !== false) {
            args.push('--no-ignore-parent');
        }
        // Follow symlinks
        if (!folderQuery.ignoreSymlinks) {
            args.push('--follow');
        }
        if (config.exists) {
            args.push('--quiet');
        }
        args.push('--no-config');
        if (folderQuery.disregardGlobalIgnoreFiles) {
            args.push('--no-ignore-global');
        }
        return {
            args,
            siblingClauses: rgGlobs.siblingClauses
        };
    }
    function foldersToRgExcludeGlobs(folderQueries, globalExclude, excludesToSkip, absoluteGlobs = true) {
        const globArgs = [];
        let siblingClauses = {};
        folderQueries.forEach(folderQuery => {
            const totalExcludePattern = Object.assign({}, folderQuery.excludePattern || {}, globalExclude || {});
            const result = globExprsToRgGlobs(totalExcludePattern, absoluteGlobs ? folderQuery.folder.fsPath : undefined, excludesToSkip);
            globArgs.push(...result.globArgs);
            if (result.siblingClauses) {
                siblingClauses = Object.assign(siblingClauses, result.siblingClauses);
            }
        });
        return { globArgs, siblingClauses };
    }
    function foldersToIncludeGlobs(folderQueries, globalInclude, absoluteGlobs = true) {
        const globArgs = [];
        folderQueries.forEach(folderQuery => {
            const totalIncludePattern = Object.assign({}, globalInclude || {}, folderQuery.includePattern || {});
            const result = globExprsToRgGlobs(totalIncludePattern, absoluteGlobs ? folderQuery.folder.fsPath : undefined);
            globArgs.push(...result.globArgs);
        });
        return globArgs;
    }
    function globExprsToRgGlobs(patterns, folder, excludesToSkip) {
        const globArgs = [];
        const siblingClauses = {};
        Object.keys(patterns)
            .forEach(key => {
            if (excludesToSkip && excludesToSkip.has(key)) {
                return;
            }
            if (!key) {
                return;
            }
            const value = patterns[key];
            key = trimTrailingSlash(folder ? getAbsoluteGlob(folder, key) : key);
            // glob.ts requires forward slashes, but a UNC path still must start with \\
            // #38165 and #38151
            if (key.startsWith('\\\\')) {
                key = '\\\\' + key.substr(2).replace(/\\/g, '/');
            }
            else {
                key = key.replace(/\\/g, '/');
            }
            if (typeof value === 'boolean' && value) {
                if (key.startsWith('\\\\')) {
                    // Absolute globs UNC paths don't work properly, see #58758
                    key += '**';
                }
                globArgs.push(fixDriveC(key));
            }
            else if (value && value.when) {
                siblingClauses[key] = value;
            }
        });
        return { globArgs, siblingClauses };
    }
    /**
     * Resolves a glob like "node_modules/**" in "/foo/bar" to "/foo/bar/node_modules/**".
     * Special cases C:/foo paths to write the glob like /foo instead - see https://github.com/BurntSushi/ripgrep/issues/530.
     *
     * Exported for testing
     */
    function getAbsoluteGlob(folder, key) {
        return path.isAbsolute(key) ?
            key :
            path.join(folder, key);
    }
    function trimTrailingSlash(str) {
        str = strings.rtrim(str, '\\');
        return strings.rtrim(str, '/');
    }
    function fixDriveC(path) {
        const root = extpath.getRoot(path);
        return root.toLowerCase() === 'c:/' ?
            path.replace(/^c:[/\\]/i, '/') :
            path;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcEZpbGVTZWFyY2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL25vZGUvcmlwZ3JlcEZpbGVTZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLDBDQVVDO0lBbUlELDBDQUlDO0lBT0QsOEJBS0M7SUFoS0QsdUVBQXVFO0lBQ3ZFLE1BQU0sVUFBVSxHQUFHLGdCQUFNLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFFMUYsU0FBZ0IsZUFBZSxDQUFDLE1BQWtCLEVBQUUsV0FBeUIsRUFBRSxjQUFpQyxFQUFFLGNBQWlDO1FBQ2xKLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUM5RSxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUN0QyxPQUFPO1lBQ04sR0FBRyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUMvQyxVQUFVO1lBQ1YsY0FBYyxFQUFFLE1BQU0sQ0FBQyxjQUFjO1lBQ3JDLE1BQU07WUFDTixHQUFHO1NBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxNQUFrQixFQUFFLFdBQXlCLEVBQUUsY0FBaUMsRUFBRSxjQUFpQztRQUNySSxNQUFNLElBQUksR0FBRyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUU3RSwyQ0FBMkM7UUFDM0MscUJBQXFCLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxj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