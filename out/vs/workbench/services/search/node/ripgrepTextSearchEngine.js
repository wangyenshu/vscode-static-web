/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "events", "string_decoder", "vs/base/common/arrays", "vs/base/common/collections", "vs/base/common/glob", "vs/base/common/strings", "vs/base/common/uri", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchExtTypes", "vscode-regexpp", "@vscode/ripgrep", "./ripgrepSearchUtils"], function (require, exports, cp, events_1, string_decoder_1, arrays_1, collections_1, glob_1, strings_1, uri_1, search_1, searchExtTypes_1, vscode_regexpp_1, ripgrep_1, ripgrepSearchUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RipgrepParser = exports.RipgrepTextSearchEngine = void 0;
    exports.getRgArgs = getRgArgs;
    exports.unicodeEscapesToPCRE2 = unicodeEscapesToPCRE2;
    exports.fixRegexNewline = fixRegexNewline;
    exports.fixNewline = fixNewline;
    exports.performBraceExpansionForRipgrep = performBraceExpansionForRipgrep;
    // If @vscode/ripgrep is in an .asar file, then the binary is unpacked.
    const rgDiskPath = ripgrep_1.rgPath.replace(/\bnode_modules\.asar\b/, 'node_modules.asar.unpacked');
    class RipgrepTextSearchEngine {
        constructor(outputChannel) {
            this.outputChannel = outputChannel;
        }
        provideTextSearchResults(query, options, progress, token) {
            this.outputChannel.appendLine(`provideTextSearchResults ${query.pattern}, ${JSON.stringify({
                ...options,
                ...{
                    folder: options.folder.toString()
                }
            })}`);
            return new Promise((resolve, reject) => {
                token.onCancellationRequested(() => cancel());
                const rgArgs = getRgArgs(query, options);
                const cwd = options.folder.fsPath;
                const escapedArgs = rgArgs
                    .map(arg => arg.match(/^-/) ? arg : `'${arg}'`)
                    .join(' ');
                this.outputChannel.appendLine(`${rgDiskPath} ${escapedArgs}\n - cwd: ${cwd}`);
                let rgProc = cp.spawn(rgDiskPath, rgArgs, { cwd });
                rgProc.on('error', e => {
                    console.error(e);
                    this.outputChannel.appendLine('Error: ' + (e && e.message));
                    reject((0, search_1.serializeSearchError)(new search_1.SearchError(e && e.message, search_1.SearchErrorCode.rgProcessError)));
                });
                let gotResult = false;
                const ripgrepParser = new RipgrepParser(options.maxResults, options.folder, options.previewOptions);
                ripgrepParser.on('result', (match) => {
                    gotResult = true;
                    dataWithoutResult = '';
                    progress.report(match);
                });
                let isDone = false;
                const cancel = () => {
                    isDone = true;
                    rgProc?.kill();
                    ripgrepParser?.cancel();
                };
                let limitHit = false;
                ripgrepParser.on('hitLimit', () => {
                    limitHit = true;
                    cancel();
                });
                let dataWithoutResult = '';
                rgProc.stdout.on('data', data => {
                    ripgrepParser.handleData(data);
                    if (!gotResult) {
                        dataWithoutResult += data;
                    }
                });
                let gotData = false;
                rgProc.stdout.once('data', () => gotData = true);
                let stderr = '';
                rgProc.stderr.on('data', data => {
                    const message = data.toString();
                    this.outputChannel.appendLine(message);
                    if (stderr.length + message.length < 1e6) {
                        stderr += message;
                    }
                });
                rgProc.on('close', () => {
                    this.outputChannel.appendLine(gotData ? 'Got data from stdout' : 'No data from stdout');
                    this.outputChannel.appendLine(gotResult ? 'Got result from parser' : 'No result from parser');
                    if (dataWithoutResult) {
                        this.outputChannel.appendLine(`Got data without result: ${dataWithoutResult}`);
                    }
                    this.outputChannel.appendLine('');
                    if (isDone) {
                        resolve({ limitHit });
                    }
                    else {
                        // Trigger last result
                        ripgrepParser.flush();
                        rgProc = null;
                        let searchError;
                        if (stderr && !gotData && (searchError = rgErrorMsgForDisplay(stderr))) {
                            reject((0, search_1.serializeSearchError)(new search_1.SearchError(searchError.message, searchError.code)));
                        }
                        else {
                            resolve({ limitHit });
                        }
                    }
                });
            });
        }
    }
    exports.RipgrepTextSearchEngine = RipgrepTextSearchEngine;
    /**
     * Read the first line of stderr and return an error for display or undefined, based on a list of
     * allowed properties.
     * Ripgrep produces stderr output which is not from a fatal error, and we only want the search to be
     * "failed" when a fatal error was produced.
     */
    function rgErrorMsgForDisplay(msg) {
        const lines = msg.split('\n');
        const firstLine = lines[0].trim();
        if (lines.some(l => l.startsWith('regex parse error'))) {
            return new search_1.SearchError(buildRegexParseError(lines), search_1.SearchErrorCode.regexParseError);
        }
        const match = firstLine.match(/grep config error: unknown encoding: (.*)/);
        if (match) {
            return new search_1.SearchError(`Unknown encoding: ${match[1]}`, search_1.SearchErrorCode.unknownEncoding);
        }
        if (firstLine.startsWith('error parsing glob')) {
            // Uppercase first letter
            return new search_1.SearchError(firstLine.charAt(0).toUpperCase() + firstLine.substr(1), search_1.SearchErrorCode.globParseError);
        }
        if (firstLine.startsWith('the literal')) {
            // Uppercase first letter
            return new search_1.SearchError(firstLine.charAt(0).toUpperCase() + firstLine.substr(1), search_1.SearchErrorCode.invalidLiteral);
        }
        if (firstLine.startsWith('PCRE2: error compiling pattern')) {
            return new search_1.SearchError(firstLine, search_1.SearchErrorCode.regexParseError);
        }
        return undefined;
    }
    function buildRegexParseError(lines) {
        const errorMessage = ['Regex parse error'];
        const pcre2ErrorLine = lines.filter(l => (l.startsWith('PCRE2:')));
        if (pcre2ErrorLine.length >= 1) {
            const pcre2ErrorMessage = pcre2ErrorLine[0].replace('PCRE2:', '');
            if (pcre2ErrorMessage.indexOf(':') !== -1 && pcre2ErrorMessage.split(':').length >= 2) {
                const pcre2ActualErrorMessage = pcre2ErrorMessage.split(':')[1];
                errorMessage.push(':' + pcre2ActualErrorMessage);
            }
        }
        return errorMessage.join('');
    }
    class RipgrepParser extends events_1.EventEmitter {
        constructor(maxResults, root, previewOptions) {
            super();
            this.maxResults = maxResults;
            this.root = root;
            this.previewOptions = previewOptions;
            this.remainder = '';
            this.isDone = false;
            this.hitLimit = false;
            this.numResults = 0;
            this.stringDecoder = new string_decoder_1.StringDecoder();
        }
        cancel() {
            this.isDone = true;
        }
        flush() {
            this.handleDecodedData(this.stringDecoder.end());
        }
        on(event, listener) {
            super.on(event, listener);
            return this;
        }
        handleData(data) {
            if (this.isDone) {
                return;
            }
            const dataStr = typeof data === 'string' ? data : this.stringDecoder.write(data);
            this.handleDecodedData(dataStr);
        }
        handleDecodedData(decodedData) {
            // check for newline before appending to remainder
            let newlineIdx = decodedData.indexOf('\n');
            // If the previous data chunk didn't end in a newline, prepend it to this chunk
            const dataStr = this.remainder + decodedData;
            if (newlineIdx >= 0) {
                newlineIdx += this.remainder.length;
            }
            else {
                // Shortcut
                this.remainder = dataStr;
                return;
            }
            let prevIdx = 0;
            while (newlineIdx >= 0) {
                this.handleLine(dataStr.substring(prevIdx, newlineIdx).trim());
                prevIdx = newlineIdx + 1;
                newlineIdx = dataStr.indexOf('\n', prevIdx);
            }
            this.remainder = dataStr.substring(prevIdx);
        }
        handleLine(outputLine) {
            if (this.isDone || !outputLine) {
                return;
            }
            let parsedLine;
            try {
                parsedLine = JSON.parse(outputLine);
            }
            catch (e) {
                throw new Error(`malformed line from rg: ${outputLine}`);
            }
            if (parsedLine.type === 'match') {
                const matchPath = bytesOrTextToString(parsedLine.data.path);
                const uri = uri_1.URI.joinPath(this.root, matchPath);
                const result = this.createTextSearchMatch(parsedLine.data, uri);
                this.onResult(result);
                if (this.hitLimit) {
                    this.cancel();
                    this.emit('hitLimit');
                }
            }
            else if (parsedLine.type === 'context') {
                const contextPath = bytesOrTextToString(parsedLine.data.path);
                const uri = uri_1.URI.joinPath(this.root, contextPath);
                const result = this.createTextSearchContext(parsedLine.data, uri);
                result.forEach(r => this.onResult(r));
            }
        }
        createTextSearchMatch(data, uri) {
            const lineNumber = data.line_number - 1;
            const fullText = bytesOrTextToString(data.lines);
            const fullTextBytes = Buffer.from(fullText);
            let prevMatchEnd = 0;
            let prevMatchEndCol = 0;
            let prevMatchEndLine = lineNumber;
            // it looks like certain regexes can match a line, but cause rg to not
            // emit any specific submatches for that line.
            // https://github.com/microsoft/vscode/issues/100569#issuecomment-738496991
            if (data.submatches.length === 0) {
                data.submatches.push(fullText.length
                    ? { start: 0, end: 1, match: { text: fullText[0] } }
                    : { start: 0, end: 0, match: { text: '' } });
            }
            const ranges = (0, arrays_1.coalesce)(data.submatches.map((match, i) => {
                if (this.hitLimit) {
                    return null;
                }
                this.numResults++;
                if (this.numResults >= this.maxResults) {
                    // Finish the line, then report the result below
                    this.hitLimit = true;
                }
                const matchText = bytesOrTextToString(match.match);
                const inBetweenText = fullTextBytes.slice(prevMatchEnd, match.start).toString();
                const inBetweenStats = getNumLinesAndLastNewlineLength(inBetweenText);
                const startCol = inBetweenStats.numLines > 0 ?
                    inBetweenStats.lastLineLength :
                    inBetweenStats.lastLineLength + prevMatchEndCol;
                const stats = getNumLinesAndLastNewlineLength(matchText);
                const startLineNumber = inBetweenStats.numLines + prevMatchEndLine;
                const endLineNumber = stats.numLines + startLineNumber;
                const endCol = stats.numLines > 0 ?
                    stats.lastLineLength :
                    stats.lastLineLength + startCol;
                prevMatchEnd = match.end;
                prevMatchEndCol = endCol;
                prevMatchEndLine = endLineNumber;
                return new searchExtTypes_1.Range(startLineNumber, startCol, endLineNumber, endCol);
            }));
            return (0, ripgrepSearchUtils_1.createTextSearchResult)(uri, fullText, ranges, this.previewOptions);
        }
        createTextSearchContext(data, uri) {
            const text = bytesOrTextToString(data.lines);
            const startLine = data.line_number;
            return text
                .replace(/\r?\n$/, '')
                .split('\n')
                .map((line, i) => {
                return {
                    text: line,
                    uri,
                    lineNumber: startLine + i
                };
            });
        }
        onResult(match) {
            this.emit('result', match);
        }
    }
    exports.RipgrepParser = RipgrepParser;
    function bytesOrTextToString(obj) {
        return obj.bytes ?
            Buffer.from(obj.bytes, 'base64').toString() :
            obj.text;
    }
    function getNumLinesAndLastNewlineLength(text) {
        const re = /\n/g;
        let numLines = 0;
        let lastNewlineIdx = -1;
        let match;
        while (match = re.exec(text)) {
            numLines++;
            lastNewlineIdx = match.index;
        }
        const lastLineLength = lastNewlineIdx >= 0 ?
            text.length - lastNewlineIdx - 1 :
            text.length;
        return { numLines, lastLineLength };
    }
    // exported for testing
    function getRgArgs(query, options) {
        const args = ['--hidden', '--no-require-git'];
        args.push(query.isCaseSensitive ? '--case-sensitive' : '--ignore-case');
        const { doubleStarIncludes, otherIncludes } = (0, collections_1.groupBy)(options.includes, (include) => include.startsWith('**') ? 'doubleStarIncludes' : 'otherIncludes');
        if (otherIncludes && otherIncludes.length) {
            const uniqueOthers = new Set();
            otherIncludes.forEach(other => { uniqueOthers.add(other); });
            args.push('-g', '!*');
            uniqueOthers
                .forEach(otherIncude => {
                spreadGlobComponents(otherIncude)
                    .map(ripgrepSearchUtils_1.anchorGlob)
                    .forEach(globArg => {
                    args.push('-g', globArg);
                });
            });
        }
        if (doubleStarIncludes && doubleStarIncludes.length) {
            doubleStarIncludes.forEach(globArg => {
                args.push('-g', globArg);
            });
        }
        options.excludes
            .map(ripgrepSearchUtils_1.anchorGlob)
            .forEach(rgGlob => args.push('-g', `!${rgGlob}`));
        if (options.maxFileSize) {
            args.push('--max-filesize', options.maxFileSize + '');
        }
        if (options.useIgnoreFiles) {
            if (!options.useParentIgnoreFiles) {
                args.push('--no-ignore-parent');
            }
        }
        else {
            // Don't use .gitignore or .ignore
            args.push('--no-ignore');
        }
        if (options.followSymlinks) {
            args.push('--follow');
        }
        if (options.encoding && options.encoding !== 'utf8') {
            args.push('--encoding', options.encoding);
        }
        // Ripgrep handles -- as a -- arg separator. Only --.
        // - is ok, --- is ok, --some-flag is also ok. Need to special case.
        if (query.pattern === '--') {
            query.isRegExp = true;
            query.pattern = '\\-\\-';
        }
        if (query.isMultiline && !query.isRegExp) {
            query.pattern = (0, strings_1.escapeRegExpCharacters)(query.pattern);
            query.isRegExp = true;
        }
        if (options.usePCRE2) {
            args.push('--pcre2');
        }
        // Allow $ to match /r/n
        args.push('--crlf');
        if (query.isRegExp) {
            query.pattern = unicodeEscapesToPCRE2(query.pattern);
            args.push('--engine', 'auto');
        }
        let searchPatternAfterDoubleDashes;
        if (query.isWordMatch) {
            const regexp = (0, strings_1.createRegExp)(query.pattern, !!query.isRegExp, { wholeWord: query.isWordMatch });
            const regexpStr = regexp.source.replace(/\\\//g, '/'); // RegExp.source arbitrarily returns escaped slashes. Search and destroy.
            args.push('--regexp', regexpStr);
        }
        else if (query.isRegExp) {
            let fixedRegexpQuery = fixRegexNewline(query.pattern);
            fixedRegexpQuery = fixNewline(fixedRegexpQuery);
            args.push('--regexp', fixedRegexpQuery);
        }
        else {
            searchPatternAfterDoubleDashes = query.pattern;
            args.push('--fixed-strings');
        }
        args.push('--no-config');
        if (!options.useGlobalIgnoreFiles) {
            args.push('--no-ignore-global');
        }
        args.push('--json');
        if (query.isMultiline) {
            args.push('--multiline');
        }
        if (options.beforeContext) {
            args.push('--before-context', options.beforeContext + '');
        }
        if (options.afterContext) {
            args.push('--after-context', options.afterContext + '');
        }
        // Folder to search
        args.push('--');
        if (searchPatternAfterDoubleDashes) {
            // Put the query after --, in case the query starts with a dash
            args.push(searchPatternAfterDoubleDashes);
        }
        args.push('.');
        return args;
    }
    /**
     * `"foo/*bar/something"` -> `["foo", "foo/*bar", "foo/*bar/something", "foo/*bar/something/**"]`
     */
    function spreadGlobComponents(globComponent) {
        const globComponentWithBraceExpansion = performBraceExpansionForRipgrep(globComponent);
        return globComponentWithBraceExpansion.flatMap((globArg) => {
            const components = (0, glob_1.splitGlobAware)(globArg, '/');
            return components.map((_, i) => components.slice(0, i + 1).join('/'));
        });
    }
    function unicodeEscapesToPCRE2(pattern) {
        // Match \u1234
        const unicodePattern = /((?:[^\\]|^)(?:\\\\)*)\\u([a-z0-9]{4})/gi;
        while (pattern.match(unicodePattern)) {
            pattern = pattern.replace(unicodePattern, `$1\\x{$2}`);
        }
        // Match \u{1234}
        // \u with 5-6 characters will be left alone because \x only takes 4 characters.
        const unicodePatternWithBraces = /((?:[^\\]|^)(?:\\\\)*)\\u\{([a-z0-9]{4})\}/gi;
        while (pattern.match(unicodePatternWithBraces)) {
            pattern = pattern.replace(unicodePatternWithBraces, `$1\\x{$2}`);
        }
        return pattern;
    }
    const isLookBehind = (node) => node.type === 'Assertion' && node.kind === 'lookbehind';
    function fixRegexNewline(pattern) {
        // we parse the pattern anew each tiem
        let re;
        try {
            re = new vscode_regexpp_1.RegExpParser().parsePattern(pattern);
        }
        catch {
            return pattern;
        }
        let output = '';
        let lastEmittedIndex = 0;
        const replace = (start, end, text) => {
            output += pattern.slice(lastEmittedIndex, start) + text;
            lastEmittedIndex = end;
        };
        const context = [];
        const visitor = new vscode_regexpp_1.RegExpVisitor({
            onCharacterEnter(char) {
                if (char.raw !== '\\n') {
                    return;
                }
                const parent = context[0];
                if (!parent) {
                    // simple char, \n -> \r?\n
                    replace(char.start, char.end, '\\r?\\n');
                }
                else if (context.some(isLookBehind)) {
                    // no-op in a lookbehind, see #100569
                }
                else if (parent.type === 'CharacterClass') {
                    if (parent.negate) {
                        // negative bracket expr, [^a-z\n] -> (?![a-z]|\r?\n)
                        const otherContent = pattern.slice(parent.start + 2, char.start) + pattern.slice(char.end, parent.end - 1);
                        if (parent.parent?.type === 'Quantifier') {
                            // If quantified, we can't use a negative lookahead in a quantifier.
                            // But `.` already doesn't match new lines, so we can just use that
                            // (with any other negations) instead.
                            replace(parent.start, parent.end, otherContent ? `[^${otherContent}]` : '.');
                        }
                        else {
                            replace(parent.start, parent.end, '(?!\\r?\\n' + (otherContent ? `|[${otherContent}]` : '') + ')');
                        }
                    }
                    else {
                        // positive bracket expr, [a-z\n] -> (?:[a-z]|\r?\n)
                        const otherContent = pattern.slice(parent.start + 1, char.start) + pattern.slice(char.end, parent.end - 1);
                        replace(parent.start, parent.end, otherContent === '' ? '\\r?\\n' : `(?:[${otherContent}]|\\r?\\n)`);
                    }
                }
                else if (parent.type === 'Quantifier') {
                    replace(char.start, char.end, '(?:\\r?\\n)');
                }
            },
            onQuantifierEnter(node) {
                context.unshift(node);
            },
            onQuantifierLeave() {
                context.shift();
            },
            onCharacterClassRangeEnter(node) {
                context.unshift(node);
            },
            onCharacterClassRangeLeave() {
                context.shift();
            },
            onCharacterClassEnter(node) {
                context.unshift(node);
            },
            onCharacterClassLeave() {
                context.shift();
            },
            onAssertionEnter(node) {
                if (isLookBehind(node)) {
                    context.push(node);
                }
            },
            onAssertionLeave(node) {
                if (context[0] === node) {
                    context.shift();
                }
            },
        });
        visitor.visit(re);
        output += pattern.slice(lastEmittedIndex);
        return output;
    }
    function fixNewline(pattern) {
        return pattern.replace(/\n/g, '\\r?\\n');
    }
    // brace expansion for ripgrep
    /**
     * Split string given first opportunity for brace expansion in the string.
     * - If the brace is prepended by a \ character, then it is escaped.
     * - Does not process escapes that are within the sub-glob.
     * - If two unescaped `{` occur before `}`, then ripgrep will return an error for brace nesting, so don't split on those.
     */
    function getEscapeAwareSplitStringForRipgrep(pattern) {
        let inBraces = false;
        let escaped = false;
        let fixedStart = '';
        let strInBraces = '';
        for (let i = 0; i < pattern.length; i++) {
            const char = pattern[i];
            switch (char) {
                case '\\':
                    if (escaped) {
                        // If we're already escaped, then just leave the escaped slash and the preceeding slash that escapes it.
                        // The two escaped slashes will result in a single slash and whatever processes the glob later will properly process the escape
                        if (inBraces) {
                            strInBraces += '\\' + char;
                        }
                        else {
                            fixedStart += '\\' + char;
                        }
                        escaped = false;
                    }
                    else {
                        escaped = true;
                    }
                    break;
                case '{':
                    if (escaped) {
                        // if we escaped this opening bracket, then it is to be taken literally. Remove the `\` because we've acknowleged it and add the `{` to the appropriate string
                        if (inBraces) {
                            strInBraces += char;
                        }
                        else {
                            fixedStart += char;
                        }
                        escaped = false;
                    }
                    else {
                        if (inBraces) {
                            // ripgrep treats this as attempting to do a nested alternate group, which is invalid. Return with pattern including changes from escaped braces.
                            return { strInBraces: fixedStart + '{' + strInBraces + '{' + pattern.substring(i + 1) };
                        }
                        else {
                            inBraces = true;
                        }
                    }
                    break;
                case '}':
                    if (escaped) {
                        // same as `}`, but for closing bracket
                        if (inBraces) {
                            strInBraces += char;
                        }
                        else {
                            fixedStart += char;
                        }
                        escaped = false;
                    }
                    else if (inBraces) {
                        // we found an end bracket to a valid opening bracket. Return the appropriate strings.
                        return { fixedStart, strInBraces, fixedEnd: pattern.substring(i + 1) };
                    }
                    else {
                        // if we're not in braces and not escaped, then this is a literal `}` character and we're still adding to fixedStart.
                        fixedStart += char;
                    }
                    break;
                default:
                    // similar to the `\\` case, we didn't do anything with the escape, so we should re-insert it into the appropriate string
                    // to be consumed later when individual parts of the glob are processed
                    if (inBraces) {
                        strInBraces += (escaped ? '\\' : '') + char;
                    }
                    else {
                        fixedStart += (escaped ? '\\' : '') + char;
                    }
                    escaped = false;
                    break;
            }
        }
        // we are haven't hit the last brace, so no splitting should occur. Return with pattern including changes from escaped braces.
        return { strInBraces: fixedStart + (inBraces ? ('{' + strInBraces) : '') };
    }
    /**
     * Parses out curly braces and returns equivalent globs. Only supports one level of nesting.
     * Exported for testing.
     */
    function performBraceExpansionForRipgrep(pattern) {
        const { fixedStart, strInBraces, fixedEnd } = getEscapeAwareSplitStringForRipgrep(pattern);
        if (fixedStart === undefined || fixedEnd === undefined) {
            return [strInBraces];
        }
        let arr = (0, glob_1.splitGlobAware)(strInBraces, ',');
        if (!arr.length) {
            // occurs if the braces are empty.
            arr = [''];
        }
        const ends = performBraceExpansionForRipgrep(fixedEnd);
        return arr.flatMap((elem) => {
            const start = fixedStart + elem;
            return ends.map((end) => {
                return start + end;
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcFRleHRTZWFyY2hFbmdpbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL25vZGUvcmlwZ3JlcFRleHRTZWFyY2hFbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK1doRyw4QkEwSEM7SUFlRCxzREFnQkM7SUF5QkQsMENBbUZDO0lBRUQsZ0NBRUM7SUF5RkQsMEVBcUJDO0lBcHRCRCx1RUFBdUU7SUFDdkUsTUFBTSxVQUFVLEdBQUcsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsd0JBQXdCLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUUxRixNQUFhLHVCQUF1QjtRQUVuQyxZQUFvQixhQUE2QjtZQUE3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7UUFBSSxDQUFDO1FBRXRELHdCQUF3QixDQUFDLEtBQXNCLEVBQUUsT0FBMEIsRUFBRSxRQUFvQyxFQUFFLEtBQXdCO1lBQzFJLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLDRCQUE0QixLQUFLLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQzFGLEdBQUcsT0FBTztnQkFDVixHQUFHO29CQUNGLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtpQkFDakM7YUFDRCxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRU4sT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDdEMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBRTlDLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRXpDLE1BQU0sR0FB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