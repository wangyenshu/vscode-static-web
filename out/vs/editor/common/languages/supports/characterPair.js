/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages/languageConfiguration"], function (require, exports, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharacterPairSupport = void 0;
    class CharacterPairSupport {
        static { this.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_QUOTES = ';:.,=}])> \n\t'; }
        static { this.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_BRACKETS = '\'"`;:.,=}])> \n\t'; }
        static { this.DEFAULT_AUTOCLOSE_BEFORE_WHITESPACE = ' \n\t'; }
        constructor(config) {
            if (config.autoClosingPairs) {
                this._autoClosingPairs = config.autoClosingPairs.map(el => new languageConfiguration_1.StandardAutoClosingPairConditional(el));
            }
            else if (config.brackets) {
                this._autoClosingPairs = config.brackets.map(b => new languageConfiguration_1.StandardAutoClosingPairConditional({ open: b[0], close: b[1] }));
            }
            else {
                this._autoClosingPairs = [];
            }
            if (config.__electricCharacterSupport && config.__electricCharacterSupport.docComment) {
                const docComment = config.__electricCharacterSupport.docComment;
                // IDocComment is legacy, only partially supported
                this._autoClosingPairs.push(new languageConfiguration_1.StandardAutoClosingPairConditional({ open: docComment.open, close: docComment.close || '' }));
            }
            this._autoCloseBeforeForQuotes = typeof config.autoCloseBefore === 'string' ? config.autoCloseBefore : CharacterPairSupport.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_QUOTES;
            this._autoCloseBeforeForBrackets = typeof config.autoCloseBefore === 'string' ? config.autoCloseBefore : CharacterPairSupport.DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_BRACKETS;
            this._surroundingPairs = config.surroundingPairs || this._autoClosingPairs;
        }
        getAutoClosingPairs() {
            return this._autoClosingPairs;
        }
        getAutoCloseBeforeSet(forQuotes) {
            return (forQuotes ? this._autoCloseBeforeForQuotes : this._autoCloseBeforeForBrackets);
        }
        getSurroundingPairs() {
            return this._surroundingPairs;
        }
    }
    exports.CharacterPairSupport = CharacterPairSupport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyUGFpci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL3N1cHBvcnRzL2NoYXJhY3RlclBhaXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLE1BQWEsb0JBQW9CO2lCQUVoQixxREFBZ0QsR0FBRyxnQkFBZ0IsQ0FBQztpQkFDcEUsdURBQWtELEdBQUcsb0JBQW9CLENBQUM7aUJBQzFFLHdDQUFtQyxHQUFHLE9BQU8sQ0FBQztRQU85RCxZQUFZLE1BQTZCO1lBQ3hDLElBQUksTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSwwREFBa0MsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hHLENBQUM7aUJBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksMERBQWtDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEgsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7WUFDN0IsQ0FBQztZQUVELElBQUksTUFBTSxDQUFDLDBCQUEwQixJQUFJLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdkYsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQztnQkFDaEUsa0RBQWtEO2dCQUNsRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksMERBQWtDLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0gsQ0FBQztZQUVELElBQUksQ0FBQyx5QkFBeUIsR0FBRyxPQUFPLE1BQU0sQ0FBQyxlQUFlLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxnREFBZ0QsQ0FBQztZQUM3SyxJQUFJLENBQUMsMkJBQTJCLEdBQUcsT0FBTyxNQUFNLENBQUMsZUFBZSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsa0RBQWtELENBQUM7WUFFakwsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDNUUsQ0FBQztRQUVNLG1CQUFtQjtZQUN6QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUMvQixDQUFDO1FBRU0scUJBQXFCLENBQUMsU0FBa0I7WUFDOUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRU0sbUJBQW1CO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQy9CLENBQUM7O0lBMUNGLG9EQTJDQyJ9