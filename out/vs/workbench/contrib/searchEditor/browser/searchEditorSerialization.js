/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/nls", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/services/textfile/common/textfiles", "vs/css!./media/searchEditor"], function (require, exports, arrays_1, range_1, nls_1, searchModel_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseSerializedSearchEditor = exports.parseSavedSearchEditor = exports.serializeSearchResultForEditor = exports.extractSearchQueryFromLines = exports.defaultSearchConfig = exports.extractSearchQueryFromModel = exports.serializeSearchConfiguration = void 0;
    // Using \r\n on Windows inserts an extra newline between results.
    const lineDelimiter = '\n';
    const translateRangeLines = (n) => (range) => new range_1.Range(range.startLineNumber + n, range.startColumn, range.endLineNumber + n, range.endColumn);
    const matchToSearchResultFormat = (match, longestLineNumber) => {
        const getLinePrefix = (i) => `${match.range().startLineNumber + i}`;
        const fullMatchLines = match.fullPreviewLines();
        const results = [];
        fullMatchLines
            .forEach((sourceLine, i) => {
            const lineNumber = getLinePrefix(i);
            const paddingStr = ' '.repeat(longestLineNumber - lineNumber.length);
            const prefix = `  ${paddingStr}${lineNumber}: `;
            const prefixOffset = prefix.length;
            // split instead of replace to avoid creating a new string object
            const line = prefix + (sourceLine.split(/\r?\n?$/, 1)[0] || '');
            const rangeOnThisLine = ({ start, end }) => new range_1.Range(1, (start ?? 1) + prefixOffset, 1, (end ?? sourceLine.length + 1) + prefixOffset);
            const matchRange = match.rangeInPreview();
            const matchIsSingleLine = matchRange.startLineNumber === matchRange.endLineNumber;
            let lineRange;
            if (matchIsSingleLine) {
                lineRange = (rangeOnThisLine({ start: matchRange.startColumn, end: matchRange.endColumn }));
            }
            else if (i === 0) {
                lineRange = (rangeOnThisLine({ start: matchRange.startColumn }));
            }
            else if (i === fullMatchLines.length - 1) {
                lineRange = (rangeOnThisLine({ end: matchRange.endColumn }));
            }
            else {
                lineRange = (rangeOnThisLine({}));
            }
            results.push({ lineNumber: lineNumber, line, ranges: [lineRange] });
        });
        return results;
    };
    function fileMatchToSearchResultFormat(fileMatch, labelFormatter) {
        const textSerializations = fileMatch.textMatches().length > 0 ? matchesToSearchResultFormat(fileMatch.resource, fileMatch.textMatches().sort(searchModel_1.searchMatchComparer), fileMatch.context, labelFormatter) : undefined;
        const cellSerializations = fileMatch.cellMatches().sort((a, b) => a.cellIndex - b.cellIndex).sort().filter(cellMatch => cellMatch.contentMatches.length > 0).map((cellMatch, index) => cellMatchToSearchResultFormat(cellMatch, labelFormatter, index === 0));
        return [textSerializations, ...cellSerializations].filter(x => !!x);
    }
    function matchesToSearchResultFormat(resource, sortedMatches, matchContext, labelFormatter, shouldUseHeader = true) {
        const longestLineNumber = sortedMatches[sortedMatches.length - 1].range().endLineNumber.toString().length;
        const text = shouldUseHeader ? [`${labelFormatter(resource)}:`] : [];
        const matchRanges = [];
        const targetLineNumberToOffset = {};
        const context = [];
        matchContext.forEach((line, lineNumber) => context.push({ line, lineNumber }));
        context.sort((a, b) => a.lineNumber - b.lineNumber);
        let lastLine = undefined;
        const seenLines = new Set();
        sortedMatches.forEach(match => {
            matchToSearchResultFormat(match, longestLineNumber).forEach(match => {
                if (!seenLines.has(match.lineNumber)) {
                    while (context.length && context[0].lineNumber < +match.lineNumber) {
                        const { line, lineNumber } = context.shift();
                        if (lastLine !== undefined && lineNumber !== lastLine + 1) {
                            text.push('');
                        }
                        text.push(`  ${' '.repeat(longestLineNumber - `${lineNumber}`.length)}${lineNumber}  ${line}`);
                        lastLine = lineNumber;
                    }
                    targetLineNumberToOffset[match.lineNumber] = text.length;
                    seenLines.add(match.lineNumber);
                    text.push(match.line);
                    lastLine = +match.lineNumber;
                }
                matchRanges.push(...match.ranges.map(translateRangeLines(targetLineNumberToOffset[match.lineNumber])));
            });
        });
        while (context.length) {
            const { line, lineNumber } = context.shift();
            text.push(`  ${lineNumber}  ${line}`);
        }
        return { text, matchRanges };
    }
    function cellMatchToSearchResultFormat(cellMatch, labelFormatter, shouldUseHeader) {
        return matchesToSearchResultFormat(cellMatch.cell?.uri ?? cellMatch.parent.resource, cellMatch.contentMatches.sort(searchModel_1.searchMatchComparer), cellMatch.context, labelFormatter, shouldUseHeader);
    }
    const contentPatternToSearchConfiguration = (pattern, includes, excludes, contextLines) => {
        return {
            query: pattern.contentPattern.pattern,
            isRegexp: !!pattern.contentPattern.isRegExp,
            isCaseSensitive: !!pattern.contentPattern.isCaseSensitive,
            matchWholeWord: !!pattern.contentPattern.isWordMatch,
            filesToExclude: excludes, filesToInclude: includes,
            showIncludesExcludes: !!(includes || excludes || pattern?.userDisabledExcludesAndIgnoreFiles),
            useExcludeSettingsAndIgnoreFiles: (pattern?.userDisabledExcludesAndIgnoreFiles === undefined ? true : !pattern.userDisabledExcludesAndIgnoreFiles),
            contextLines,
            onlyOpenEditors: !!pattern.onlyOpenEditors,
            notebookSearchConfig: {
                includeMarkupInput: !!pattern.contentPattern.notebookInfo?.isInNotebookMarkdownInput,
                includeMarkupPreview: !!pattern.contentPattern.notebookInfo?.isInNotebookMarkdownPreview,
                includeCodeInput: !!pattern.contentPattern.notebookInfo?.isInNotebookCellInput,
                includeOutput: !!pattern.contentPattern.notebookInfo?.isInNotebookCellOutput,
            }
        };
    };
    const serializeSearchConfiguration = (config) => {
        const removeNullFalseAndUndefined = (a) => a.filter(a => a !== false && a !== null && a !== undefined);
        const escapeNewlines = (str) => str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
        return removeNullFalseAndUndefined([
            `# Query: ${escapeNewlines(config.query ?? '')}`,
            (config.isCaseSensitive || config.matchWholeWord || config.isRegexp || config.useExcludeSettingsAndIgnoreFiles === false)
                && `# Flags: ${(0, arrays_1.coalesce)([
                    config.isCaseSensitive && 'CaseSensitive',
                    config.matchWholeWord && 'WordMatch',
                    config.isRegexp && 'RegExp',
                    config.onlyOpenEditors && 'OpenEditors',
                    (config.useExcludeSettingsAndIgnoreFiles === false) && 'IgnoreExcludeSettings'
                ]).join(' ')}`,
            config.filesToInclude ? `# Including: ${config.filesToInclude}` : undefined,
            config.filesToExclude ? `# Excluding: ${config.filesToExclude}` : undefined,
            config.contextLines ? `# ContextLines: ${config.contextLines}` : undefined,
            ''
        ]).join(lineDelimiter);
    };
    exports.serializeSearchConfiguration = serializeSearchConfiguration;
    const extractSearchQueryFromModel = (model) => (0, exports.extractSearchQueryFromLines)(model.getValueInRange(new range_1.Range(1, 1, 6, 1)).split(lineDelimiter));
    exports.extractSearchQueryFromModel = extractSearchQueryFromModel;
    const defaultSearchConfig = () => ({
        query: '',
        filesToInclude: '',
        filesToExclude: '',
        isRegexp: false,
        isCaseSensitive: false,
        useExcludeSettingsAndIgnoreFiles: true,
        matchWholeWord: false,
        contextLines: 0,
        showIncludesExcludes: false,
        onlyOpenEditors: false,
        notebookSearchConfig: {
            includeMarkupInput: true,
            includeMarkupPreview: false,
            includeCodeInput: true,
            includeOutput: true,
        }
    });
    exports.defaultSearchConfig = defaultSearchConfig;
    const extractSearchQueryFromLines = (lines) => {
        const query = (0, exports.defaultSearchConfig)();
        const unescapeNewlines = (str) => {
            let out = '';
            for (let i = 0; i < str.length; i++) {
                if (str[i] === '\\') {
                    i++;
                    const escaped = str[i];
                    if (escaped === 'n') {
                        out += '\n';
                    }
                    else if (escaped === '\\') {
                        out += '\\';
                    }
                    else {
                        throw Error((0, nls_1.localize)('invalidQueryStringError', "All backslashes in Query string must be escaped (\\\\)"));
                    }
                }
                else {
                    out += str[i];
                }
            }
            return out;
        };
        const parseYML = /^# ([^:]*): (.*)$/;
        for (const line of lines) {
            const parsed = parseYML.exec(line);
            if (!parsed) {
                continue;
            }
            const [, key, value] = parsed;
            switch (key) {
                case 'Query':
                    query.query = unescapeNewlines(value);
                    break;
                case 'Including':
                    query.filesToInclude = value;
                    break;
                case 'Excluding':
                    query.filesToExclude = value;
                    break;
                case 'ContextLines':
                    query.contextLines = +value;
                    break;
                case 'Flags': {
                    query.isRegexp = value.indexOf('RegExp') !== -1;
                    query.isCaseSensitive = value.indexOf('CaseSensitive') !== -1;
                    query.useExcludeSettingsAndIgnoreFiles = value.indexOf('IgnoreExcludeSettings') === -1;
                    query.matchWholeWord = value.indexOf('WordMatch') !== -1;
                    query.onlyOpenEditors = value.indexOf('OpenEditors') !== -1;
                }
            }
        }
        query.showIncludesExcludes = !!(query.filesToInclude || query.filesToExclude || !query.useExcludeSettingsAndIgnoreFiles);
        return query;
    };
    exports.extractSearchQueryFromLines = extractSearchQueryFromLines;
    const serializeSearchResultForEditor = (searchResult, rawIncludePattern, rawExcludePattern, contextLines, labelFormatter, sortOrder, limitHit) => {
        if (!searchResult.query) {
            throw Error('Internal Error: Expected query, got null');
        }
        const config = contentPatternToSearchConfiguration(searchResult.query, rawIncludePattern, rawExcludePattern, contextLines);
        const filecount = searchResult.fileCount() > 1 ? (0, nls_1.localize)('numFiles', "{0} files", searchResult.fileCount()) : (0, nls_1.localize)('oneFile', "1 file");
        const resultcount = searchResult.count() > 1 ? (0, nls_1.localize)('numResults', "{0} results", searchResult.count()) : (0, nls_1.localize)('oneResult', "1 result");
        const info = [
            searchResult.count()
                ? `${resultcount} - ${filecount}`
                : (0, nls_1.localize)('noResults', "No Results"),
        ];
        if (limitHit) {
            info.push((0, nls_1.localize)('searchMaxResultsWarning', "The result set only contains a subset of all matches. Be more specific in your search to narrow down the results."));
        }
        info.push('');
        const matchComparer = (a, b) => (0, searchModel_1.searchMatchComparer)(a, b, sortOrder);
        const allResults = flattenSearchResultSerializations((0, arrays_1.flatten)(searchResult.folderMatches().sort(matchComparer)
            .map(folderMatch => folderMatch.allDownstreamFileMatches().sort(matchComparer)
            .flatMap(fileMatch => fileMatchToSearchResultFormat(fileMatch, labelFormatter)))));
        return {
            matchRanges: allResults.matchRanges.map(translateRangeLines(info.length)),
            text: info.concat(allResults.text).join(lineDelimiter),
            config
        };
    };
    exports.serializeSearchResultForEditor = serializeSearchResultForEditor;
    const flattenSearchResultSerializations = (serializations) => {
        const text = [];
        const matchRanges = [];
        serializations.forEach(serialized => {
            serialized.matchRanges.map(translateRangeLines(text.length)).forEach(range => matchRanges.push(range));
            serialized.text.forEach(line => text.push(line));
            text.push(''); // new line
        });
        return { text, matchRanges };
    };
    const parseSavedSearchEditor = async (accessor, resource) => {
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const text = (await textFileService.read(resource)).value;
        return (0, exports.parseSerializedSearchEditor)(text);
    };
    exports.parseSavedSearchEditor = parseSavedSearchEditor;
    const parseSerializedSearchEditor = (text) => {
        const headerlines = [];
        const bodylines = [];
        let inHeader = true;
        for (const line of text.split(/\r?\n/g)) {
            if (inHeader) {
                headerlines.push(line);
                if (line === '') {
                    inHeader = false;
                }
            }
            else {
                bodylines.push(line);
            }
        }
        return { config: (0, exports.extractSearchQueryFromLines)(headerlines), text: bodylines.join('\n') };
    };
    exports.parseSerializedSearchEditor = parseSerializedSearchEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9yU2VyaWFsaXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaEVkaXRvci9icm93c2VyL3NlYXJjaEVkaXRvclNlcmlhbGl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLGtFQUFrRTtJQUNsRSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUM7SUFFM0IsTUFBTSxtQkFBbUIsR0FDeEIsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUNiLENBQUMsS0FBWSxFQUFFLEVBQUUsQ0FDaEIsSUFBSSxhQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFckcsTUFBTSx5QkFBeUIsR0FBRyxDQUFDLEtBQVksRUFBRSxpQkFBeUIsRUFBMkQsRUFBRTtRQUN0SSxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBRTVFLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBR2hELE1BQU0sT0FBTyxHQUE0RCxFQUFFLENBQUM7UUFFNUUsY0FBYzthQUNaLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQixNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckUsTUFBTSxNQUFNLEdBQUcsS0FBSyxVQUFVLEdBQUcsVUFBVSxJQUFJLENBQUM7WUFDaEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUVuQyxpRUFBaUU7WUFDakUsTUFBTSxJQUFJLEdBQUcsTUFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFFaEUsTUFBTSxlQUFlLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQW9DLEVBQUUsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUM7WUFFMUssTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzFDLE1BQU0saUJBQWlCLEdBQUcsVUFBVSxDQUFDLGVBQWUsS0FBSyxVQUFVLENBQUMsYUFBYSxDQUFDO1lBRWxGLElBQUksU0FBUyxDQUFDO1lBQ2QsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dCQUFDLFNBQVMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQztpQkFDbEgsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQUMsU0FBUyxHQUFHLENBQUMsZUFBZSxDQUFDLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDO2lCQUNsRixJQUFJLENBQUMsS0FBSyxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUFDLFNBQVMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQztpQkFDdEcsQ0FBQztnQkFBQyxTQUFTLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUM7WUFFM0MsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQUMsQ0FBQztRQUVKLE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUMsQ0FBQztJQUlGLFNBQVMsNkJBQTZCLENBQUMsU0FBb0IsRUFBRSxjQUFrQztRQUU5RixNQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUNBQW1CLENBQUMsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDbE4sTUFBTSxrQkFBa0IsR0FBRyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsNkJBQTZCLENBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU5UCxPQUFPLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQWdDLENBQUM7SUFDcEcsQ0FBQztJQUNELFNBQVMsMkJBQTJCLENBQUMsUUFBYSxFQUFFLGFBQXNCLEVBQUUsWUFBaUMsRUFBRSxjQUFrQyxFQUFFLGVBQWUsR0FBRyxJQUFJO1FBQ3hLLE1BQU0saUJBQWlCLEdBQUcsYUFBYSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUUxRyxNQUFNLElBQUksR0FBYSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDL0UsTUFBTSxXQUFXLEdBQVksRUFBRSxDQUFDO1FBRWhDLE1BQU0sd0JBQXdCLEdBQTJCLEVBQUUsQ0FBQztRQUU1RCxNQUFNLE9BQU8sR0FBMkMsRUFBRSxDQUFDO1FBQzNELFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFcEQsSUFBSSxRQUFRLEdBQXVCLFNBQVMsQ0FBQztRQUU3QyxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQ3BDLGFBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDN0IseUJBQXlCLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNuRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztvQkFDdEMsT0FBTyxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7d0JBQ3BFLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRyxDQUFDO3dCQUM5QyxJQUFJLFFBQVEsS0FBSyxTQUFTLElBQUksVUFBVSxLQUFLLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDM0QsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDZixDQUFDO3dCQUNELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsVUFBVSxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsVUFBVSxLQUFLLElBQUksRUFBRSxDQUFDLENBQUM7d0JBQy9GLFFBQVEsR0FBRyxVQUFVLENBQUM7b0JBQ3ZCLENBQUM7b0JBRUQsd0JBQXdCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7b0JBQ3pELFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdEIsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztnQkFDOUIsQ0FBQztnQkFFRCxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hHLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN2QixNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUcsQ0FBQztZQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssVUFBVSxLQUFLLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVELFNBQVMsNkJBQTZCLENBQUMsU0FBb0IsRUFBRSxjQUFrQyxFQUFFLGVBQXdCO1FBQ3hILE9BQU8sMkJBQTJCLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsaUNBQW1CLENBQUMsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUM5TCxDQUFDO0lBRUQsTUFBTSxtQ0FBbUMsR0FBRyxDQUFDLE9BQW1CLEVBQUUsUUFBZ0IsRUFBRSxRQUFnQixFQUFFLFlBQW9CLEVBQXVCLEVBQUU7UUFDbEosT0FBTztZQUNOLEtBQUssRUFBRSxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU87WUFDckMsUUFBUSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVE7WUFDM0MsZUFBZSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLGVBQWU7WUFDekQsY0FBYyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVc7WUFDcEQsY0FBYyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsUUFBUTtZQUNsRCxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksUUFBUSxJQUFJLE9BQU8sRUFBRSxrQ0FBa0MsQ0FBQztZQUM3RixnQ0FBZ0MsRUFBRSxDQUFDLE9BQU8sRUFBRSxrQ0FBa0MsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsa0NBQWtDLENBQUM7WUFDbEosWUFBWTtZQUNaLGVBQWUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWU7WUFDMUMsb0JBQW9CLEVBQUU7Z0JBQ3JCLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSx5QkFBeUI7Z0JBQ3BGLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSwyQkFBMkI7Z0JBQ3hGLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxxQkFBcUI7Z0JBQzlFLGFBQWEsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsc0JBQXNCO2FBQzVFO1NBQ0QsQ0FBQztJQUNILENBQUMsQ0FBQztJQUVLLE1BQU0sNEJBQTRCLEdBQUcsQ0FBQyxNQUFvQyxFQUFVLEVBQUU7UUFDNUYsTUFBTSwyQkFBMkIsR0FBRyxDQUFJLENBQW1DLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLFNBQVMsQ0FBUSxDQUFDO1FBRW5KLE1BQU0sY0FBYyxHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXpGLE9BQU8sMkJBQTJCLENBQUM7WUFDbEMsWUFBWSxjQUFjLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsRUFBRTtZQUVoRCxDQUFDLE1BQU0sQ0FBQyxlQUFlLElBQUksTUFBTSxDQUFDLGNBQWMsSUFBSSxNQUFNLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxnQ0FBZ0MsS0FBSyxLQUFLLENBQUM7bUJBQ3RILFlBQVksSUFBQSxpQkFBUSxFQUFDO29CQUN2QixNQUFNLENBQUMsZUFBZSxJQUFJLGVBQWU7b0JBQ3pDLE1BQU0sQ0FBQyxjQUFjLElBQUksV0FBVztvQkFDcEMsTUFBTSxDQUFDLFFBQVEsSUFBSSxRQUFRO29CQUMzQixNQUFNLENBQUMsZUFBZSxJQUFJLGFBQWE7b0JBQ3ZDLENBQUMsTUFBTSxDQUFDLGdDQUFnQyxLQUFLLEtBQUssQ0FBQyxJQUFJLHVCQUF1QjtpQkFDOUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNkLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7WUFDM0UsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUMzRSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQzFFLEVBQUU7U0FDRixDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3hCLENBQUMsQ0FBQztJQXJCVyxRQUFBLDRCQUE0QixnQ0FxQnZDO0lBRUssTUFBTSwyQkFBMkIsR0FBRyxDQUFDLEtBQWlCLEVBQXVCLEVBQUUsQ0FDckYsSUFBQSxtQ0FBMkIsRUFBQyxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFEbkYsUUFBQSwyQkFBMkIsK0JBQ3dEO0lBRXpGLE1BQU0sbUJBQW1CLEdBQUcsR0FBd0IsRUFBRSxDQUFDLENBQUM7UUFDOUQsS0FBSyxFQUFFLEVBQUU7UUFDVCxjQUFjLEVBQUUsRUFBRTtRQUNsQixjQUFjLEVBQUUsRUFBRTtRQUNsQixRQUFRLEVBQUUsS0FBSztRQUNmLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLGdDQUFnQyxFQUFFLElBQUk7UUFDdEMsY0FBYyxFQUFFLEtBQUs7UUFDckIsWUFBWSxFQUFFLENBQUM7UUFDZixvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLGVBQWUsRUFBRSxLQUFLO1FBQ3RCLG9CQUFvQixFQUFFO1lBQ3JCLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsb0JBQW9CLEVBQUUsS0FBSztZQUMzQixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLGFBQWEsRUFBRSxJQUFJO1NBQ25CO0tBQ0QsQ0FBQyxDQUFDO0lBakJVLFFBQUEsbUJBQW1CLHVCQWlCN0I7SUFFSSxNQUFNLDJCQUEyQixHQUFHLENBQUMsS0FBZSxFQUF1QixFQUFFO1FBRW5GLE1BQU0sS0FBSyxHQUFHLElBQUEsMkJBQW1CLEdBQUUsQ0FBQztRQUVwQyxNQUFNLGdCQUFnQixHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUU7WUFDeEMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3JCLENBQUMsRUFBRSxDQUFDO29CQUNKLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFdkIsSUFBSSxPQUFPLEtBQUssR0FBRyxFQUFFLENBQUM7d0JBQ3JCLEdBQUcsSUFBSSxJQUFJLENBQUM7b0JBQ2IsQ0FBQzt5QkFDSSxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDM0IsR0FBRyxJQUFJLElBQUksQ0FBQztvQkFDYixDQUFDO3lCQUNJLENBQUM7d0JBQ0wsTUFBTSxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsd0RBQXdELENBQUMsQ0FBQyxDQUFDO29CQUM1RyxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNmLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDLENBQUM7UUFFRixNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQztRQUNyQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQzFCLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUFDLFNBQVM7WUFBQyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7WUFDOUIsUUFBUSxHQUFHLEVBQUUsQ0FBQztnQkFDYixLQUFLLE9BQU87b0JBQUUsS0FBSyxDQUFDLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUMzRCxLQUFLLFdBQVc7b0JBQUUsS0FBSyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7b0JBQUMsTUFBTTtnQkFDdEQsS0FBSyxXQUFXO29CQUFFLEtBQUssQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO29CQUFDLE1BQU07Z0JBQ3RELEtBQUssY0FBYztvQkFBRSxLQUFLLENBQUMsWUFBWSxHQUFHLENBQUMsS0FBSyxDQUFDO29CQUFDLE1BQU07Z0JBQ3hELEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDZCxLQUFLLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ2hELEtBQUssQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDOUQsS0FBSyxDQUFDLGdDQUFnQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDdkYsS0FBSyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUN6RCxLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQzdELENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxJQUFJLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUV6SCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUMsQ0FBQztJQWxEVyxRQUFBLDJCQUEyQiwrQkFrRHRDO0lBRUssTUFBTSw4QkFBOEIsR0FDMUMsQ0FBQyxZQUEwQixFQUFFLGlCQUF5QixFQUFFLGlCQUF5QixFQUFFLFlBQW9CLEVBQUUsY0FBa0MsRUFBRSxTQUEwQixFQUFFLFFBQWtCLEVBQWdGLEVBQUU7UUFDNVEsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUFDLE1BQU0sS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFBQyxDQUFDO1FBQ3JGLE1BQU0sTUFBTSxHQUFHLG1DQUFtQyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFM0gsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdJLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUUvSSxNQUFNLElBQUksR0FBRztZQUNaLFlBQVksQ0FBQyxLQUFLLEVBQUU7Z0JBQ25CLENBQUMsQ0FBQyxHQUFHLFdBQVcsTUFBTSxTQUFTLEVBQUU7Z0JBQ2pDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsWUFBWSxDQUFDO1NBQ3RDLENBQUM7UUFDRixJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxtSEFBbUgsQ0FBQyxDQUFDLENBQUM7UUFDckssQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFZCxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQTBCLEVBQUUsQ0FBMEIsRUFBRSxFQUFFLENBQUMsSUFBQSxpQ0FBbUIsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRXZILE1BQU0sVUFBVSxHQUNmLGlDQUFpQyxDQUNoQyxJQUFBLGdCQUFPLEVBQ04sWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7YUFDOUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLHdCQUF3QixFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQzthQUM1RSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV4RixPQUFPO1lBQ04sV0FBVyxFQUFFLFVBQVUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6RSxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztZQUN0RCxNQUFNO1NBQ04sQ0FBQztJQUNILENBQUMsQ0FBQztJQWhDVSxRQUFBLDhCQUE4QixrQ0FnQ3hDO0lBRUgsTUFBTSxpQ0FBaUMsR0FBRyxDQUFDLGNBQTJDLEVBQTZCLEVBQUU7UUFDcEgsTUFBTSxJQUFJLEdBQWEsRUFBRSxDQUFDO1FBQzFCLE1BQU0sV0FBVyxHQUFZLEVBQUUsQ0FBQztRQUVoQyxjQUFjLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ25DLFVBQVUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVztRQUMzQixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDOUIsQ0FBQyxDQUFDO0lBRUssTUFBTSxzQkFBc0IsR0FBRyxLQUFLLEVBQUUsUUFBMEIsRUFBRSxRQUFhLEVBQUUsRUFBRTtRQUN6RixNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFnQixDQUFDLENBQUM7UUFFdkQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLGVBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDMUQsT0FBTyxJQUFBLG1DQUEyQixFQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQztJQUxXLFFBQUEsc0JBQXNCLDBCQUtqQztJQUVLLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTtRQUMzRCxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDdkIsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBRXJCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQztRQUNwQixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUN6QyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZCLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDO29CQUNqQixRQUFRLEdBQUcsS0FBSyxDQUFDO2dCQUNsQixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUEsbUNBQTJCLEVBQUMsV0FBVyxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUN6RixDQUFDLENBQUM7SUFqQlcsUUFBQSwyQkFBMkIsK0JBaUJ0QyJ9