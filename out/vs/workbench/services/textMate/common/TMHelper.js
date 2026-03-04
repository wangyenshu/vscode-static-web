/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeRule = void 0;
    exports.findMatchingThemeRule = findMatchingThemeRule;
    function findMatchingThemeRule(theme, scopes, onlyColorRules = true) {
        for (let i = scopes.length - 1; i >= 0; i--) {
            const parentScopes = scopes.slice(0, i);
            const scope = scopes[i];
            const r = findMatchingThemeRule2(theme, scope, parentScopes, onlyColorRules);
            if (r) {
                return r;
            }
        }
        return null;
    }
    function findMatchingThemeRule2(theme, scope, parentScopes, onlyColorRules) {
        let result = null;
        // Loop backwards, to ensure the last most specific rule wins
        for (let i = theme.tokenColors.length - 1; i >= 0; i--) {
            const rule = theme.tokenColors[i];
            if (onlyColorRules && !rule.settings.foreground) {
                continue;
            }
            let selectors;
            if (typeof rule.scope === 'string') {
                selectors = rule.scope.split(/,/).map(scope => scope.trim());
            }
            else if (Array.isArray(rule.scope)) {
                selectors = rule.scope;
            }
            else {
                continue;
            }
            for (let j = 0, lenJ = selectors.length; j < lenJ; j++) {
                const rawSelector = selectors[j];
                const themeRule = new ThemeRule(rawSelector, rule.settings);
                if (themeRule.matches(scope, parentScopes)) {
                    if (themeRule.isMoreSpecific(result)) {
                        result = themeRule;
                    }
                }
            }
        }
        return result;
    }
    class ThemeRule {
        constructor(rawSelector, settings) {
            this.rawSelector = rawSelector;
            this.settings = settings;
            const rawSelectorPieces = this.rawSelector.split(/ /);
            this.scope = rawSelectorPieces[rawSelectorPieces.length - 1];
            this.parentScopes = rawSelectorPieces.slice(0, rawSelectorPieces.length - 1);
        }
        matches(scope, parentScopes) {
            return ThemeRule._matches(this.scope, this.parentScopes, scope, parentScopes);
        }
        static _cmp(a, b) {
            if (a === null && b === null) {
                return 0;
            }
            if (a === null) {
                // b > a
                return -1;
            }
            if (b === null) {
                // a > b
                return 1;
            }
            if (a.scope.length !== b.scope.length) {
                // longer scope length > shorter scope length
                return a.scope.length - b.scope.length;
            }
            const aParentScopesLen = a.parentScopes.length;
            const bParentScopesLen = b.parentScopes.length;
            if (aParentScopesLen !== bParentScopesLen) {
                // more parents > less parents
                return aParentScopesLen - bParentScopesLen;
            }
            for (let i = 0; i < aParentScopesLen; i++) {
                const aLen = a.parentScopes[i].length;
                const bLen = b.parentScopes[i].length;
                if (aLen !== bLen) {
                    return aLen - bLen;
                }
            }
            return 0;
        }
        isMoreSpecific(other) {
            return (ThemeRule._cmp(this, other) > 0);
        }
        static _matchesOne(selectorScope, scope) {
            const selectorPrefix = selectorScope + '.';
            if (selectorScope === scope || scope.substring(0, selectorPrefix.length) === selectorPrefix) {
                return true;
            }
            return false;
        }
        static _matches(selectorScope, selectorParentScopes, scope, parentScopes) {
            if (!this._matchesOne(selectorScope, scope)) {
                return false;
            }
            let selectorParentIndex = selectorParentScopes.length - 1;
            let parentIndex = parentScopes.length - 1;
            while (selectorParentIndex >= 0 && parentIndex >= 0) {
                if (this._matchesOne(selectorParentScopes[selectorParentIndex], parentScopes[parentIndex])) {
                    selectorParentIndex--;
                }
                parentIndex--;
            }
            if (selectorParentIndex === -1) {
                return true;
            }
            return false;
        }
    }
    exports.ThemeRule = ThemeRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVE1IZWxwZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dE1hdGUvY29tbW9uL1RNSGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsc0RBVUM7SUFWRCxTQUFnQixxQkFBcUIsQ0FBQyxLQUFrQixFQUFFLE1BQWdCLEVBQUUsaUJBQTBCLElBQUk7UUFDekcsS0FBSyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxHQUFHLHNCQUFzQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ1AsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsc0JBQXNCLENBQUMsS0FBa0IsRUFBRSxLQUFhLEVBQUUsWUFBc0IsRUFBRSxjQUF1QjtRQUNqSCxJQUFJLE1BQU0sR0FBcUIsSUFBSSxDQUFDO1FBRXBDLDZEQUE2RDtRQUM3RCxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDeEQsTUFBTSxJQUFJLEdBQUcs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