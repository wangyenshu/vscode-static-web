define(["require", "exports", "vs/base/common/strings", "./ast", "./length", "./smallImmutableSet", "./tokenizer"], function (require, exports, strings_1, ast_1, length_1, smallImmutableSet_1, tokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageAgnosticBracketTokens = exports.BracketTokens = void 0;
    class BracketTokens {
        static createFromLanguage(configuration, denseKeyProvider) {
            function getId(bracketInfo) {
                return denseKeyProvider.getKey(`${bracketInfo.languageId}:::${bracketInfo.bracketText}`);
            }
            const map = new Map();
            for (const openingBracket of configuration.bracketsNew.openingBrackets) {
                const length = (0, length_1.toLength)(0, openingBracket.bracketText.length);
                const openingTextId = getId(openingBracket);
                const bracketIds = smallImmutableSet_1.SmallImmutableSet.getEmpty().add(openingTextId, smallImmutableSet_1.identityKeyProvider);
                map.set(openingBracket.bracketText, new tokenizer_1.Token(length, 1 /* TokenKind.OpeningBracket */, openingTextId, bracketIds, ast_1.BracketAstNode.create(length, openingBracket, bracketIds)));
            }
            for (const closingBracket of configuration.bracketsNew.closingBrackets) {
                const length = (0, length_1.toLength)(0, closingBracket.bracketText.length);
                let bracketIds = smallImmutableSet_1.SmallImmutableSet.getEmpty();
                const closingBrackets = closingBracket.getOpeningBrackets();
                for (const bracket of closingBrackets) {
                    bracketIds = bracketIds.add(getId(bracket), smallImmutableSet_1.identityKeyProvider);
                }
                map.set(closingBracket.bracketText, new tokenizer_1.Token(length, 2 /* TokenKind.ClosingBracket */, getId(closingBrackets[0]), bracketIds, ast_1.BracketAstNode.create(length, closingBracket, bracketIds)));
            }
            return new BracketTokens(map);
        }
        constructor(map) {
            this.map = map;
            this.hasRegExp = false;
            this._regExpGlobal = null;
        }
        getRegExpStr() {
            if (this.isEmpty) {
                return null;
            }
            else {
                const keys = [...this.map.keys()];
                keys.sort();
                keys.reverse();
                return keys.map(k => prepareBracketForRegExp(k)).join('|');
            }
        }
        /**
         * Returns null if there is no such regexp (because there are no brackets).
        */
        get regExpGlobal() {
            if (!this.hasRegExp) {
                const regExpStr = this.getRegExpStr();
                this._regExpGlobal = regExpStr ? new RegExp(regExpStr, 'gi') : null;
                this.hasRegExp = true;
            }
            return this._regExpGlobal;
        }
        getToken(value) {
            return this.map.get(value.toLowerCase());
        }
        findClosingTokenText(openingBracketIds) {
            for (const [closingText, info] of this.map) {
                if (info.kind === 2 /* TokenKind.ClosingBracket */ && info.bracketIds.intersects(openingBracketIds)) {
                    return closingText;
                }
            }
            return undefined;
        }
        get isEmpty() {
            return this.map.size === 0;
        }
    }
    exports.BracketTokens = BracketTokens;
    function prepareBracketForRegExp(str) {
        let escaped = (0, strings_1.escapeRegExpCharacters)(str);
        // These bracket pair delimiters start or end with letters
        // see https://github.com/microsoft/vscode/issues/132162 https://github.com/microsoft/vscode/issues/150440
        if (/^[\w ]+/.test(str)) {
            escaped = `\\b${escaped}`;
        }
        if (/[\w ]+$/.test(str)) {
            escaped = `${escaped}\\b`;
        }
        return escaped;
    }
    class LanguageAgnosticBracketTokens {
        constructor(denseKeyProvider, getLanguageConfiguration) {
            this.denseKeyProvider = denseKeyProvider;
            this.getLanguageConfiguration = getLanguageConfiguration;
            this.languageIdToBracketTokens = new Map();
        }
        didLanguageChange(languageId) {
            // Report a change whenever the language configuration updates.
            return this.languageIdToBracketTokens.has(languageId);
        }
        getSingleLanguageBracketTokens(languageId) {
            let singleLanguageBracketTokens = this.languageIdToBracketTokens.get(languageId);
            if (!singleLanguageBracketTokens) {
                singleLanguageBracketTokens = BracketTokens.createFromLanguage(this.getLanguageConfiguration(languageId), this.denseKeyProvider);
                this.languageIdToBracketTokens.set(languageId, singleLanguageBracketTokens);
            }
            return singleLanguageBracketTokens;
        }
        getToken(value, languageId) {
            const singleLanguageBracketTokens = this.getSingleLanguageBracketTokens(languageId);
            return singleLanguageBracketTokens.getToken(value);
        }
    }
    exports.LanguageAgnosticBracketTokens = LanguageAgnosticBracketTokens;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvYnJhY2tldFBhaXJzVHJlZS9icmFja2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBWUEsTUFBYSxhQUFhO1FBQ3pCLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxhQUE0QyxFQUFFLGdCQUEwQztZQUNqSCxTQUFTLEtBQUssQ0FBQyxXQUF3QjtnQkFDdEMsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxXQUFXLENBQUMsVUFBVSxNQUFNLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQztZQUNyQyxLQUFLLE1BQU0sY0FBYyxJQUFJLGFBQWEsQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3hFLE1BQU0sTUFBTSxHQUFHLElBQUEsaUJBQVEsRUFBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLFVBQVUsR0FBRyxxQ0FBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLHVDQUFtQixDQUFDLENBQUM7Z0JBQ3hGLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxJQUFJLGlCQUFLLENBQzVDLE1BQU0sb0NBRU4sYUFBYSxFQUNiLFVBQVUsRUFDVixvQkFBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUN6RCxDQUFDLENBQUM7WUFD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