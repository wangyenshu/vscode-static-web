/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lazy"], function (require, exports, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.winDrivePrefix = void 0;
    exports.removeLinkSuffix = removeLinkSuffix;
    exports.removeLinkQueryString = removeLinkQueryString;
    exports.detectLinkSuffixes = detectLinkSuffixes;
    exports.getLinkSuffix = getLinkSuffix;
    exports.toLinkSuffix = toLinkSuffix;
    exports.detectLinks = detectLinks;
    /**
     * A regex that extracts the link suffix which contains line and column information. The link suffix
     * must terminate at the end of line.
     */
    const linkSuffixRegexEol = new lazy_1.Lazy(() => generateLinkSuffixRegex(true));
    /**
     * A regex that extracts the link suffix which contains line and column information.
     */
    const linkSuffixRegex = new lazy_1.Lazy(() => generateLinkSuffixRegex(false));
    function generateLinkSuffixRegex(eolOnly) {
        let ri = 0;
        let ci = 0;
        let rei = 0;
        let cei = 0;
        function r() {
            return `(?<row${ri++}>\\d+)`;
        }
        function c() {
            return `(?<col${ci++}>\\d+)`;
        }
        function re() {
            return `(?<rowEnd${rei++}>\\d+)`;
        }
        function ce() {
            return `(?<colEnd${cei++}>\\d+)`;
        }
        const eolSuffix = eolOnly ? '$' : '';
        // The comments in the regex below use real strings/numbers for better readability, here's
        // the legend:
        // - Path    = foo
        // - Row     = 339
        // - Col     = 12
        // - RowEnd  = 341
        // - ColEnd  = 789
        //
        // These all support single quote ' in the place of " and [] in the place of ()
        //
        // See the tests for an exhaustive list of all supported formats
        const lineAndColumnRegexClauses = [
            // foo:339
            // foo:339:12
            // foo:339:12-789
            // foo:339:12-341.789
            // foo:339.12
            // foo 339
            // foo 339:12                              [#140780]
            // foo 339.12
            // foo#339
            // foo#339:12                              [#190288]
            // foo#339.12
            // "foo",339
            // "foo",339:12
            // "foo",339.12
            // "foo",339.12-789
            // "foo",339.12-341.789
            `(?::|#| |['"],)${r()}([:.]${c()}(?:-(?:${re()}\\.)?${ce()})?)?` + eolSuffix,
            // The quotes below are optional           [#171652]
            // "foo", line 339                         [#40468]
            // "foo", line 339, col 12
            // "foo", line 339, column 12
            // "foo":line 339
            // "foo":line 339, col 12
            // "foo":line 339, column 12
            // "foo": line 339
            // "foo": line 339, col 12
            // "foo": line 339, column 12
            // "foo" on line 339
            // "foo" on line 339, col 12
            // "foo" on line 339, column 12
            // "foo" line 339 column 12
            // "foo", line 339, character 12           [#171880]
            // "foo", line 339, characters 12-789      [#171880]
            // "foo", lines 339-341                    [#171880]
            // "foo", lines 339-341, characters 12-789 [#178287]
            `['"]?(?:,? |: ?| on )lines? ${r()}(?:-${re()})?(?:,? (?:col(?:umn)?|characters?) ${c()}(?:-${ce()})?)?` + eolSuffix,
            // foo(339)
            // foo(339,12)
            // foo(339, 12)
            // foo (339)
            //   ...
            // foo: (339)
            //   ...
            `:? ?[\\[\\(]${r()}(?:, ?${c()})?[\\]\\)]` + eolSuffix,
        ];
        const suffixClause = lineAndColumnRegexClauses
            // Join all clauses together
            .join('|')
            // Convert spaces to allow the non-breaking space char (ascii 160)
            .replace(/ /g, `[${'\u00A0'} ]`);
        return new RegExp(`(${suffixClause})`, eolOnly ? undefined : 'g');
    }
    /**
     * Removes the optional link suffix which contains line and column information.
     * @param link The link to use.
     */
    function removeLinkSuffix(link) {
        const suffix = getLinkSuffix(link)?.suffix;
        if (!suffix) {
            return link;
        }
        return link.substring(0, suffix.index);
    }
    /**
     * Removes any query string from the link.
     * @param link The link to use.
     */
    function removeLinkQueryString(link) {
        // Skip ? in UNC paths
        const start = link.startsWith('\\\\?\\') ? 4 : 0;
        const index = link.indexOf('?', start);
        if (index === -1) {
            return link;
        }
        return link.substring(0, index);
    }
    function detectLinkSuffixes(line) {
        // Find all suffixes on the line. Since the regex global flag is used, lastIndex will be updated
        // in place such that there are no overlapping matches.
        let match;
        const results = [];
        linkSuffixRegex.value.lastIndex = 0;
        while ((match = linkSuffixRegex.value.exec(line)) !== null) {
            const suffix = toLinkSuffix(match);
            if (suffix === null) {
                break;
            }
            results.push(suffix);
        }
        return results;
    }
    /**
     * Returns the optional link suffix which contains line and column information.
     * @param link The link to parse.
     */
    function getLinkSuffix(link) {
        return toLinkSuffix(linkSuffixRegexEol.value.exec(link));
    }
    function toLinkSuffix(match) {
        const groups = match?.groups;
        if (!groups || match.length < 1) {
            return null;
        }
        return {
            row: parseIntOptional(groups.row0 || groups.row1 || groups.row2),
            col: parseIntOptional(groups.col0 || groups.col1 || groups.col2),
            rowEnd: parseIntOptional(groups.rowEnd0 || groups.rowEnd1 || groups.rowEnd2),
            colEnd: parseIntOptional(groups.colEnd0 || groups.colEnd1 || groups.colEnd2),
            suffix: { index: match.index, text: match[0] }
        };
    }
    function parseIntOptional(value) {
        if (value === undefined) {
            return value;
        }
        return parseInt(value);
    }
    // This defines valid path characters for a link with a suffix, the first `[]` of the regex includes
    // characters the path is not allowed to _start_ with, the second `[]` includes characters not
    // allowed at all in the path. If the characters show up in both regexes the link will stop at that
    // character, otherwise it will stop at a space character.
    const linkWithSuffixPathCharacters = /(?<path>(?:file:\/\/\/)?[^\s\|<>\[\({][^\s\|<>]*)$/;
    function detectLinks(line, os) {
        // 1: Detect all links on line via suffixes first
        const results = detectLinksViaSuffix(line);
        // 2: Detect all links without suffixes and merge non-conflicting ranges into the results
        const noSuffixPaths = detectPathsNoSuffix(line, os);
        binaryInsertList(results, noSuffixPaths);
        return results;
    }
    function binaryInsertList(list, newItems) {
        if (list.length === 0) {
            list.push(...newItems);
        }
        for (const item of newItems) {
            binaryInsert(list, item, 0, list.length);
        }
    }
    function binaryInsert(list, newItem, low, high) {
        if (list.length === 0) {
            list.push(newItem);
            return;
        }
        if (low > high) {
            return;
        }
        // Find the index where the newItem would be inserted
        const mid = Math.floor((low + high) / 2);
        if (mid >= list.length ||
            (newItem.path.index < list[mid].path.index && (mid === 0 || newItem.path.index > list[mid - 1].path.index))) {
            // Check if it conflicts with an existing link before adding
            if (mid >= list.length ||
                (newItem.path.index + newItem.path.text.length < list[mid].path.index && (mid === 0 || newItem.path.index > list[mid - 1].path.index + list[mid - 1].path.text.length))) {
                list.splice(mid, 0, newItem);
            }
            return;
        }
        if (newItem.path.index > list[mid].path.index) {
            binaryInsert(list, newItem, mid + 1, high);
        }
        else {
            binaryInsert(list, newItem, low, mid - 1);
        }
    }
    function detectLinksViaSuffix(line) {
        const results = [];
        // 1: Detect link suffixes on the line
        const suffixes = detectLinkSuffixes(line);
        for (const suffix of suffixes) {
            const beforeSuffix = line.substring(0, suffix.suffix.index);
            const possiblePathMatch = beforeSuffix.match(linkWithSuffixPathCharacters);
            if (possiblePathMatch && possiblePathMatch.index !== undefined && possiblePathMatch.groups?.path) {
                let linkStartIndex = possiblePathMatch.index;
                let path = possiblePathMatch.groups.path;
                // Extract a path prefix if it exists (not part of the path, but part of the underlined
                // section)
                let prefix = undefined;
                const prefixMatch = path.match(/^(?<prefix>['"]+)/);
                if (prefixMatch?.groups?.prefix) {
                    prefix = {
                        index: linkStartIndex,
                        text: prefixMatch.groups.prefix
                    };
                    path = path.substring(prefix.text.length);
                    // Don't allow suffix links to be returned when the link itself is the empty string
                    if (path.trim().length === 0) {
                        continue;
                    }
                    // If there are multiple characters in the prefix, trim the prefix if the _first_
                    // suffix character is the same as the last prefix character. For example, for the
                    // text `echo "'foo' on line 1"`:
                    //
                    // - Prefix='
                    // - Path=foo
                    // - Suffix=' on line 1
                    //
                    // If this fails on a multi-character prefix, just keep the original.
                    if (prefixMatch.groups.prefix.length > 1) {
                        if (suffix.suffix.text[0].match(/['"]/) && prefixMatch.groups.prefix[prefixMatch.groups.prefix.length - 1] === suffix.suffix.text[0]) {
                            const trimPrefixAmount = prefixMatch.groups.prefix.length - 1;
                            prefix.index += trimPrefixAmount;
                            prefix.text = prefixMatch.groups.prefix[prefixMatch.groups.prefix.length - 1];
                            linkStartIndex += trimPrefixAmount;
                        }
                    }
                }
                results.push({
                    path: {
                        index: linkStartIndex + (prefix?.text.length || 0),
                        text: path
                    },
                    prefix,
                    suffix
                });
            }
        }
        return results;
    }
    var RegexPathConstants;
    (function (RegexPathConstants) {
        RegexPathConstants["PathPrefix"] = "(?:\\.\\.?|\\~|file://)";
        RegexPathConstants["PathSeparatorClause"] = "\\/";
        // '":; are allowed in paths but they are often separators so ignore them
        // Also disallow \\ to prevent a catastropic backtracking case #24795
        RegexPathConstants["ExcludedPathCharactersClause"] = "[^\\0<>\\?\\s!`&*()'\":;\\\\]";
        RegexPathConstants["ExcludedStartPathCharactersClause"] = "[^\\0<>\\?\\s!`&*()\\[\\]'\":;\\\\]";
        RegexPathConstants["WinOtherPathPrefix"] = "\\.\\.?|\\~";
        RegexPathConstants["WinPathSeparatorClause"] = "(?:\\\\|\\/)";
        RegexPathConstants["WinExcludedPathCharactersClause"] = "[^\\0<>\\?\\|\\/\\s!`&*()'\":;]";
        RegexPathConstants["WinExcludedStartPathCharactersClause"] = "[^\\0<>\\?\\|\\/\\s!`&*()\\[\\]'\":;]";
    })(RegexPathConstants || (RegexPathConstants = {}));
    /**
     * A regex that matches non-Windows paths, such as `/foo`, `~/foo`, `./foo`, `../foo` and
     * `foo/bar`.
     */
    const unixLocalLinkClause = '(?:(?:' + RegexPathConstants.PathPrefix + '|(?:' + RegexPathConstants.ExcludedStartPathCharactersClause + RegexPathConstants.ExcludedPathCharactersClause + '*))?(?:' + RegexPathConstants.PathSeparatorClause + '(?:' + RegexPathConstants.ExcludedPathCharactersClause + ')+)+)';
    /**
     * A regex clause that matches the start of an absolute path on Windows, such as: `C:`, `c:`,
     * `file:///c:` (uri) and `\\?\C:` (UNC path).
     */
    exports.winDrivePrefix = '(?:\\\\\\\\\\?\\\\|file:\\/\\/\\/)?[a-zA-Z]:';
    /**
     * A regex that matches Windows paths, such as `\\?\c:\foo`, `c:\foo`, `~\foo`, `.\foo`, `..\foo`
     * and `foo\bar`.
     */
    const winLocalLinkClause = '(?:(?:' + `(?:${exports.winDrivePrefix}|${RegexPathConstants.WinOtherPathPrefix})` + '|(?:' + RegexPathConstants.WinExcludedStartPathCharactersClause + RegexPathConstants.WinExcludedPathCharactersClause + '*))?(?:' + RegexPathConstants.WinPathSeparatorClause + '(?:' + RegexPathConstants.WinExcludedPathCharactersClause + ')+)+)';
    function detectPathsNoSuffix(line, os) {
        const results = [];
        const regex = new RegExp(os === 1 /* OperatingSystem.Windows */ ? winLocalLinkClause : unixLocalLinkClause, 'g');
        let match;
        while ((match = regex.exec(line)) !== null) {
            let text = match[0];
            let index = match.index;
            if (!text) {
                // Something matched but does not comply with the given match index, since this would
                // most likely a bug the regex itself we simply do nothing here
                break;
            }
            // Adjust the link range to exclude a/ and b/ if it looks like a git diff
            if (
            // --- a/foo/bar
            // +++ b/foo/bar
            ((line.startsWith('--- a/') || line.startsWith('+++ b/')) && index === 4) ||
                // diff --git a/foo/bar b/foo/bar
                (line.startsWith('diff --git') && (text.startsWith('a/') || text.startsWith('b/')))) {
                text = text.substring(2);
                index += 2;
            }
            results.push({
                path: {
                    index,
                    text
                },
                prefix: undefined,
                suffix: undefined
            });
        }
        return results;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rUGFyc2luZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9saW5rcy9icm93c2VyL3Rlcm1pbmFsTGlua1BhcnNpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUloRyw0Q0FNQztJQU1ELHNEQVFDO0lBRUQsZ0RBY0M7SUFNRCxzQ0FFQztJQUVELG9DQVlDO0lBZUQsa0NBU0M7SUF2TEQ7OztPQUdHO0lBQ0gsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLFdBQUksQ0FBUyxHQUFHLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2pGOztPQUVHO0lBQ0gsTUFBTSxlQUFlLEdBQUcsSUFBSSxXQUFJLENBQVMsR0FBRyxFQUFFLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUUvRSxTQUFTLHVCQUF1QixDQUFDLE9BQWdCO1FBQ2hELElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNaLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNaLFNBQVMsQ0FBQztZQUNULE9BQU8sU0FBUyxFQUFFLEVBQUUsUUFBUSxDQUFDO1FBQzlCLENBQUM7UUFDRCxTQUFTLENBQUM7WUFDVCxPQUFPLFNBQVMsRUFBRSxFQUFFLFFBQVEsQ0FBQztRQUM5QixDQUFDO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsT0FBTyxZQUFZLEdBQUcsRUFBRSxRQUFRLENBQUM7UUFDbEMsQ0FBQztRQUNELFNBQVMsRUFBRTtZQUNWLE9BQU8sWUFBWSxHQUFHLEVBQUUsUUFBUSxDQUFDO1FBQ2xDLENB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