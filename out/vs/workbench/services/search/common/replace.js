/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/base/common/search"], function (require, exports, strings, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplacePattern = void 0;
    class ReplacePattern {
        constructor(replaceString, arg2, arg3) {
            this._hasParameters = false;
            this._replacePattern = replaceString;
            let searchPatternInfo;
            let parseParameters;
            if (typeof arg2 === 'boolean') {
                parseParameters = arg2;
                this._regExp = arg3;
            }
            else {
                searchPatternInfo = arg2;
                parseParameters = !!searchPatternInfo.isRegExp;
                this._regExp = strings.createRegExp(searchPatternInfo.pattern, !!searchPatternInfo.isRegExp, { matchCase: searchPatternInfo.isCaseSensitive, wholeWord: searchPatternInfo.isWordMatch, multiline: searchPatternInfo.isMultiline, global: false, unicode: true });
            }
            if (parseParameters) {
                this.parseReplaceString(replaceString);
            }
            if (this._regExp.global) {
                this._regExp = strings.createRegExp(this._regExp.source, true, { matchCase: !this._regExp.ignoreCase, wholeWord: false, multiline: this._regExp.multiline, global: false });
            }
            this._caseOpsRegExp = new RegExp(/([\s\S]*?)((?:\\[uUlL])+?|)(\$[0-9]+)([\s\S]*?)/g);
        }
        get hasParameters() {
            return this._hasParameters;
        }
        get pattern() {
            return this._replacePattern;
        }
        get regExp() {
            return this._regExp;
        }
        /**
        * Returns the replace string for the first match in the given text.
        * If text has no matches then returns null.
        */
        getReplaceString(text, preserveCase) {
            this._regExp.lastIndex = 0;
            const match = this._regExp.exec(text);
            if (match) {
                if (this.hasParameters) {
                    const replaceString = this.replaceWithCaseOperations(text, this._regExp, this.buildReplaceString(match, preserveCase));
                    if (match[0] === text) {
                        return replaceString;
                    }
                    return replaceString.substr(match.index, match[0].length - (text.length - replaceString.length));
                }
                return this.buildReplaceString(match, preserveCase);
            }
            return null;
        }
        /**
         * replaceWithCaseOperations applies case operations to relevant replacement strings and applies
         * the affected $N arguments. It then passes unaffected $N arguments through to string.replace().
         *
         * \u			=> upper-cases one character in a match.
         * \U			=> upper-cases ALL remaining characters in a match.
         * \l			=> lower-cases one character in a match.
         * \L			=> lower-cases ALL remaining characters in a match.
         */
        replaceWithCaseOperations(text, regex, replaceString) {
            // Short-circuit the common path.
            if (!/\\[uUlL]/.test(replaceString)) {
                return text.replace(regex, replaceString);
            }
            // Store the values of the search parameters.
            const firstMatch = regex.exec(text);
            if (firstMatch === null) {
                return text.replace(regex, replaceString);
            }
            let patMatch;
            let newReplaceString = '';
            let lastIndex = 0;
            let lastMatch = '';
            // For each annotated $N, perform text processing on the parameters and perform the substitution.
            while ((patMatch = this._caseOpsRegExp.exec(replaceString)) !== null) {
                lastIndex = patMatch.index;
                const fullMatch = patMatch[0];
                lastMatch = fullMatch;
                let caseOps = patMatch[2]; // \u, \l\u, etc.
                const money = patMatch[3]; // $1, $2, etc.
                if (!caseOps) {
                    newReplaceString += fullMatch;
                    continue;
                }
                const replacement = firstMatch[parseInt(money.slice(1))];
                if (!replacement) {
                    newReplaceString += fullMatch;
                    continue;
                }
                const replacementLen = replacement.length;
                newReplaceString += patMatch[1]; // prefix
                caseOps = caseOps.replace(/\\/g, '');
                let i = 0;
                for (; i < caseOps.length; i++) {
                    switch (caseOps[i]) {
                        case 'U':
                            newReplaceString += replacement.slice(i).toUpperCase();
                            i = replacementLen;
                            break;
                        case 'u':
                            newReplaceString += replacement[i].toUpperCase();
                            break;
                        case 'L':
                            newReplaceString += replacement.slice(i).toLowerCase();
                            i = replacementLen;
                            break;
                        case 'l':
                            newReplaceString += replacement[i].toLowerCase();
                            break;
                    }
                }
                // Append any remaining replacement string content not covered by case operations.
                if (i < replacementLen) {
                    newReplaceString += replacement.slice(i);
                }
                newReplaceString += patMatch[4]; // suffix
            }
            // Append any remaining trailing content after the final regex match.
            newReplaceString += replaceString.slice(lastIndex + lastMatch.length);
            return text.replace(regex, newReplaceString);
        }
        buildReplaceString(matches, preserveCase) {
            if (preserveCase) {
                return (0, search_1.buildReplaceStringWithCasePreserved)(matches, this._replacePattern);
            }
            else {
                return this._replacePattern;
            }
        }
        /**
         * \n => LF
         * \t => TAB
         * \\ => \
         * $0 => $& (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter)
         * everything else stays untouched
         */
        parseReplaceString(replaceString) {
            if (!replaceString || replaceString.length === 0) {
                return;
            }
            let substrFrom = 0, result = '';
            for (let i = 0, len = replaceString.length; i < len; i++) {
                const chCode = replaceString.charCodeAt(i);
                if (chCode === 92 /* CharCode.Backslash */) {
                    // move to next char
                    i++;
                    if (i >= len) {
                        // string ends with a \
                        break;
                    }
                    const nextChCode = replaceString.charCodeAt(i);
                    let replaceWithCharacter = null;
                    switch (nextChCode) {
                        case 92 /* CharCode.Backslash */:
                            // \\ => \
                            replaceWithCharacter = '\\';
                            break;
                        case 110 /* CharCode.n */:
                            // \n => LF
                            replaceWithCharacter = '\n';
                            break;
                        case 116 /* CharCode.t */:
                            // \t => TAB
                            replaceWithCharacter = '\t';
                            break;
                    }
                    if (replaceWithCharacter) {
                        result += replaceString.substring(substrFrom, i - 1) + replaceWithCharacter;
                        substrFrom = i + 1;
                    }
                }
                if (chCode === 36 /* CharCode.DollarSign */) {
                    // move to next char
                    i++;
                    if (i >= len) {
                        // string ends with a $
                        break;
                    }
                    const nextChCode = replaceString.charCodeAt(i);
                    let replaceWithCharacter = null;
                    switch (nextChCode) {
                        case 48 /* CharCode.Digit0 */:
                            // $0 => $&
                            replaceWithCharacter = '$&';
                            this._hasParameters = true;
                            break;
                        case 96 /* CharCode.BackTick */:
                        case 39 /* CharCode.SingleQuote */:
                            this._hasParameters = true;
                            break;
                        default: {
                            // check if it is a valid string parameter $n (0 <= n <= 99). $0 is already handled by now.
                            if (!this.between(nextChCode, 49 /* CharCode.Digit1 */, 57 /* CharCode.Digit9 */)) {
                                break;
                            }
                            if (i === replaceString.length - 1) {
                                this._hasParameters = true;
                                break;
                            }
                            let charCode = replaceString.charCodeAt(++i);
                            if (!this.between(charCode, 48 /* CharCode.Digit0 */, 57 /* CharCode.Digit9 */)) {
                                this._hasParameters = true;
                                --i;
                                break;
                            }
                            if (i === replaceString.length - 1) {
                                this._hasParameters = true;
                                break;
                            }
                            charCode = replaceString.charCodeAt(++i);
                            if (!this.between(charCode, 48 /* CharCode.Digit0 */, 57 /* CharCode.Digit9 */)) {
                                this._hasParameters = true;
                                --i;
                                break;
                            }
                            break;
                        }
                    }
                    if (replaceWithCharacter) {
                        result += replaceString.substring(substrFrom, i - 1) + replaceWithCharacter;
                        substrFrom = i + 1;
                    }
                }
            }
            if (substrFrom === 0) {
                // no replacement occurred
                return;
            }
            this._replacePattern = result + replaceString.substring(substrFrom);
        }
        between(value, from, to) {
            return from <= value && value <= to;
        }
    }
    exports.ReplacePattern = ReplacePattern;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvY29tbW9uL3JlcGxhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsY0FBYztRQVMxQixZQUFZLGFBQXFCLEVBQUUsSUFBUyxFQUFFLElBQVU7WUFOaEQsbUJBQWMsR0FBWSxLQUFLLENBQUM7WUFPdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxhQUFhLENBQUM7WUFDckMsSUFBSSxpQkFBK0IsQ0FBQztZQUNwQyxJQUFJLGVBQXdCLENBQUM7WUFDN0IsSUFBSSxPQUFPLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDL0IsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDdkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFFckIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGlCQUFpQixHQUFHLElBQUksQ0FBQztnQkFDekIsZUFBZSxHQUFHLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsaUJBQWlCLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbFEsQ0FBQztZQUVELElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENB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