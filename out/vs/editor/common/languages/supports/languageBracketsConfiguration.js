/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cache"], function (require, exports, cache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClosingBracketKind = exports.OpeningBracketKind = exports.BracketKindBase = exports.LanguageBracketsConfiguration = void 0;
    /**
     * Captures all bracket related configurations for a single language.
     * Immutable.
    */
    class LanguageBracketsConfiguration {
        constructor(languageId, config) {
            this.languageId = languageId;
            const bracketPairs = config.brackets ? filterValidBrackets(config.brackets) : [];
            const openingBracketInfos = new cache_1.CachedFunction((bracket) => {
                const closing = new Set();
                return {
                    info: new OpeningBracketKind(this, bracket, closing),
                    closing,
                };
            });
            const closingBracketInfos = new cache_1.CachedFunction((bracket) => {
                const opening = new Set();
                const openingColorized = new Set();
                return {
                    info: new ClosingBracketKind(this, bracket, opening, openingColorized),
                    opening,
                    openingColorized,
                };
            });
            for (const [open, close] of bracketPairs) {
                const opening = openingBracketInfos.get(open);
                const closing = closingBracketInfos.get(close);
                opening.closing.add(closing.info);
                closing.opening.add(opening.info);
            }
            // Treat colorized brackets as brackets, and mark them as colorized.
            const colorizedBracketPairs = config.colorizedBracketPairs
                ? filterValidBrackets(config.colorizedBracketPairs)
                // If not configured: Take all brackets except `<` ... `>`
                // Many languages set < ... > as bracket pair, even though they also use it as comparison operator.
                // This leads to problems when colorizing this bracket, so we exclude it if not explicitly configured otherwise.
                // https://github.com/microsoft/vscode/issues/132476
                : bracketPairs.filter((p) => !(p[0] === '<' && p[1] === '>'));
            for (const [open, close] of colorizedBracketPairs) {
                const opening = openingBracketInfos.get(open);
                const closing = closingBracketInfos.get(close);
                opening.closing.add(closing.info);
                closing.openingColorized.add(opening.info);
                closing.opening.add(opening.info);
            }
            this._openingBrackets = new Map([...openingBracketInfos.cachedValues].map(([k, v]) => [k, v.info]));
            this._closingBrackets = new Map([...closingBracketInfos.cachedValues].map(([k, v]) => [k, v.info]));
        }
        /**
         * No two brackets have the same bracket text.
        */
        get openingBrackets() {
            return [...this._openingBrackets.values()];
        }
        /**
         * No two brackets have the same bracket text.
        */
        get closingBrackets() {
            return [...this._closingBrackets.values()];
        }
        getOpeningBracketInfo(bracketText) {
            return this._openingBrackets.get(bracketText);
        }
        getClosingBracketInfo(bracketText) {
            return this._closingBrackets.get(bracketText);
        }
        getBracketInfo(bracketText) {
            return this.getOpeningBracketInfo(bracketText) || this.getClosingBracketInfo(bracketText);
        }
    }
    exports.LanguageBracketsConfiguration = LanguageBracketsConfiguration;
    function filterValidBrackets(bracketPairs) {
        return bracketPairs.filter(([open, close]) => open !== '' && close !== '');
    }
    class BracketKindBase {
        constructor(config, bracketText) {
            this.config = config;
            this.bracketText = bracketText;
        }
        get languageId() {
            return this.config.languageId;
        }
    }
    exports.BracketKindBase = BracketKindBase;
    class OpeningBracketKind extends BracketKindBase {
        constructor(config, bracketText, openedBrackets) {
            super(config, bracketText);
            this.openedBrackets = openedBrackets;
            this.isOpeningBracket = true;
        }
    }
    exports.OpeningBracketKind = OpeningBracketKind;
    class ClosingBracketKind extends BracketKindBase {
        constructor(config, bracketText, 
        /**
         * Non empty array of all opening brackets this bracket closes.
        */
        openingBrackets, openingColorizedBrackets) {
            super(config, bracketText);
            this.openingBrackets = openingBrackets;
            this.openingColorizedBrackets = openingColorizedBrackets;
            this.isOpeningBracket = false;
        }
        /**
         * Checks if this bracket closes the given other bracket.
         * If the bracket infos come from different configurations, this method will return false.
        */
        closes(other) {
            if (other['config'] !== this.config) {
                return false;
            }
            return this.openingBrackets.has(other);
        }
        closesColorized(other) {
            if (other['config'] !== this.config) {
                return false;
            }
            return this.openingColorizedBrackets.has(other);
        }
        getOpeningBrackets() {
            return [...this.openingBrackets];
        }
    }
    exports.ClosingBracketKind = ClosingBracketKind;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VCcmFja2V0c0NvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2xhbmd1YWdlcy9zdXBwb3J0cy9sYW5ndWFnZUJyYWNrZXRzQ29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEc7OztNQUdFO0lBQ0YsTUFBYSw2QkFBNkI7UUFJekMsWUFDaUIsVUFBa0IsRUFDbEMsTUFBNkI7WUFEYixlQUFVLEdBQVYsVUFBVSxDQUFRO1lBR2xDLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2pGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxzQkFBYyxDQUFDLENBQUMsT0FBZSxFQUFFLEVBQUU7Z0JBQ2xFLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFzQixDQUFDO2dCQUU5QyxPQUFPO29CQUNOLElBQUksRUFBRSxJQUFJLGtCQUFrQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDO29CQUNwRCxPQUFPO2lCQUNQLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxzQkFBYyxDQUFDLENBQUMsT0FBZSxFQUFFLEVBQUU7Z0JBQ2xFLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFzQixDQUFDO2dCQUM5QyxNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUFzQixDQUFDO2dCQUN2RCxPQUFPO29CQUNOLElBQUksRUFBRSxJQUFJLGtCQUFrQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixDQUFD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