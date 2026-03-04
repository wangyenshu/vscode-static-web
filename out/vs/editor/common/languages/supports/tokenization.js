/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color"], function (require, exports, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeTrieElement = exports.ExternalThemeTrieElement = exports.ThemeTrieElementRule = exports.TokenTheme = exports.ColorMap = exports.ParsedTokenThemeRule = void 0;
    exports.parseTokenTheme = parseTokenTheme;
    exports.toStandardTokenType = toStandardTokenType;
    exports.strcmp = strcmp;
    exports.generateTokensCSSForColorMap = generateTokensCSSForColorMap;
    class ParsedTokenThemeRule {
        constructor(token, index, fontStyle, foreground, background) {
            this._parsedThemeRuleBrand = undefined;
            this.token = token;
            this.index = index;
            this.fontStyle = fontStyle;
            this.foreground = foreground;
            this.background = background;
        }
    }
    exports.ParsedTokenThemeRule = ParsedTokenThemeRule;
    /**
     * Parse a raw theme into rules.
     */
    function parseTokenTheme(source) {
        if (!source || !Array.isArray(source)) {
            return [];
        }
        const result = [];
        let resultLen = 0;
        for (let i = 0, len = source.length; i < len; i++) {
            const entry = source[i];
            let fontStyle = -1 /* FontStyle.NotSet */;
            if (typeof entry.fontStyle === 'string') {
                fontStyle = 0 /* FontStyle.None */;
                const segments = entry.fontStyle.split(' ');
                for (let j = 0, lenJ = segments.length; j < lenJ; j++) {
                    const segment = segments[j];
                    switch (segment) {
                        case 'italic':
                            fontStyle = fontStyle | 1 /* FontStyle.Italic */;
                            break;
                        case 'bold':
                            fontStyle = fontStyle | 2 /* FontStyle.Bold */;
                            break;
                        case 'underline':
                            fontStyle = fontStyle | 4 /* FontStyle.Underline */;
                            break;
                        case 'strikethrough':
                            fontStyle = fontStyle | 8 /* FontStyle.Strikethrough */;
                            break;
                    }
                }
            }
            let foreground = null;
            if (typeof entry.foreground === 'string') {
                foreground = entry.foreground;
            }
            let background = null;
            if (typeof entry.background === 'string') {
                background = entry.background;
            }
            result[resultLen++] = new ParsedTokenThemeRule(entry.token || '', i, fontStyle, foreground, background);
        }
        return result;
    }
    /**
     * Resolve rules (i.e. inheritance).
     */
    function resolveParsedTokenThemeRules(parsedThemeRules, customTokenColors) {
        // Sort rules lexicographically, and then by index if necessary
        parsedThemeRules.sort((a, b) => {
            const r = strcmp(a.token, b.token);
            if (r !== 0) {
                return r;
            }
            return a.index - b.index;
        });
        // Determine defaults
        let defaultFontStyle = 0 /* FontStyle.None */;
        let defaultForeground = '000000';
        let defaultBackground = 'ffffff';
        while (parsedThemeRules.length >= 1 && parsedThemeRules[0].token === '') {
            const incomingDefaults = parsedThemeRules.shift();
            if (incomingDefaults.fontStyle !== -1 /* FontStyle.NotSet */) {
                defaultFontStyle = incomingDefaults.fontStyle;
            }
            if (incomingDefaults.foreground !== null) {
                defaultForeground = incomingDefaults.foreground;
            }
            if (incomingDefaults.background !== null) {
                defaultBackground = incomingDefaults.background;
            }
        }
        const colorMap = new ColorMap();
        // start with token colors from custom token themes
        for (const color of customTokenColors) {
            colorMap.getId(color);
        }
        const foregroundColorId = colorMap.getId(defaultForeground);
        const backgroundColorId = colorMap.getId(defaultBackground);
        const defaults = new ThemeTrieElementRule(defaultFontStyle, foregroundColorId, backgroundColorId);
        const root = new ThemeTrieElement(defaults);
        for (let i = 0, len = parsedThemeRules.length; i < len; i++) {
            const rule = parsedThemeRules[i];
            root.insert(rule.token, rule.fontStyle, colorMap.getId(rule.foreground), colorMap.getId(rule.background));
        }
        return new TokenTheme(colorMap, root);
    }
    const colorRegExp = /^#?([0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?$/;
    class ColorMap {
        constructor() {
            this._lastColorId = 0;
            this._id2color = [];
            this._color2id = new Map();
        }
        getId(color) {
            if (color === null) {
                return 0;
            }
            const match = color.match(colorRegExp);
            if (!match) {
                throw new Error('Illegal value for token color: ' + color);
            }
            color = match[1].toUpperCase();
            let value = this._color2id.get(color);
            if (value) {
                return value;
            }
            value = ++this._lastColorId;
            this._color2id.set(color, value);
            this._id2color[value] = color_1.Color.fromHex('#' + color);
            return value;
        }
        getColorMap() {
            return this._id2color.slice(0);
        }
    }
    exports.ColorMap = ColorMap;
    class TokenTheme {
        static createFromRawTokenTheme(source, customTokenColors) {
            return this.createFromParsedTokenTheme(parseTokenTheme(source), customTokenColors);
        }
        static createFromParsedTokenTheme(source, customTokenColors) {
            return resolveParsedTokenThemeRules(source, customTokenColors);
        }
        constructor(colorMap, root) {
            this._colorMap = colorMap;
            this._root = root;
            this._cache = new Map();
        }
        getColorMap() {
            return this._colorMap.getColorMap();
        }
        /**
         * used for testing purposes
         */
        getThemeTrieElement() {
            return this._root.toExternalThemeTrieElement();
        }
        _match(token) {
            return this._root.match(token);
        }
        match(languageId, token) {
            // The cache contains the metadata without the language bits set.
            let result = this._cache.get(token);
            if (typeof result === 'undefined') {
                const rule = this._match(token);
                const standardToken = toStandardTokenType(token);
                result = (rule.metadata
                    | (standardToken << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)) >>> 0;
                this._cache.set(token, result);
            }
            return (result
                | (languageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)) >>> 0;
        }
    }
    exports.TokenTheme = TokenTheme;
    const STANDARD_TOKEN_TYPE_REGEXP = /\b(comment|string|regex|regexp)\b/;
    function toStandardTokenType(tokenType) {
        const m = tokenType.match(STANDARD_TOKEN_TYPE_REGEXP);
        if (!m) {
            return 0 /* StandardTokenType.Other */;
        }
        switch (m[1]) {
            case 'comment':
                return 1 /* StandardTokenType.Comment */;
            case 'string':
                return 2 /* StandardTokenType.String */;
            case 'regex':
                return 3 /* StandardTokenType.RegEx */;
            case 'regexp':
                return 3 /* StandardTokenType.RegEx */;
        }
        throw new Error('Unexpected match for standard token type!');
    }
    function strcmp(a, b) {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    }
    class ThemeTrieElementRule {
        constructor(fontStyle, foreground, background) {
            this._themeTrieElementRuleBrand = undefined;
            this._fontStyle = fontStyle;
            this._foreground = foreground;
            this._background = background;
            this.metadata = ((this._fontStyle << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
                | (this._foreground << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                | (this._background << 24 /* MetadataConsts.BACKGROUND_OFFSET */)) >>> 0;
        }
        clone() {
            return new ThemeTrieElementRule(this._fontStyle, this._foreground, this._background);
        }
        acceptOverwrite(fontStyle, foreground, background) {
            if (fontStyle !== -1 /* FontStyle.NotSet */) {
                this._fontStyle = fontStyle;
            }
            if (foreground !== 0 /* ColorId.None */) {
                this._foreground = foreground;
            }
            if (background !== 0 /* ColorId.None */) {
                this._background = background;
            }
            this.metadata = ((this._fontStyle << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
                | (this._foreground << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                | (this._background << 24 /* MetadataConsts.BACKGROUND_OFFSET */)) >>> 0;
        }
    }
    exports.ThemeTrieElementRule = ThemeTrieElementRule;
    class ExternalThemeTrieElement {
        constructor(mainRule, children = new Map()) {
            this.mainRule = mainRule;
            if (children instanceof Map) {
                this.children = children;
            }
            else {
                this.children = new Map();
                for (const key in children) {
                    this.children.set(key, children[key]);
                }
            }
        }
    }
    exports.ExternalThemeTrieElement = ExternalThemeTrieElement;
    class ThemeTrieElement {
        constructor(mainRule) {
            this._themeTrieElementBrand = undefined;
            this._mainRule = mainRule;
            this._children = new Map();
        }
        /**
         * used for testing purposes
         */
        toExternalThemeTrieElement() {
            const children = new Map();
            this._children.forEach((element, index) => {
                children.set(index, element.toExternalThemeTrieElement());
            });
            return new ExternalThemeTrieElement(this._mainRule, children);
        }
        match(token) {
            if (token === '') {
                return this._mainRule;
            }
            const dotIndex = token.indexOf('.');
            let head;
            let tail;
            if (dotIndex === -1) {
                head = token;
                tail = '';
            }
            else {
                head = token.substring(0, dotIndex);
                tail = token.substring(dotIndex + 1);
            }
            const child = this._children.get(head);
            if (typeof child !== 'undefined') {
                return child.match(tail);
            }
            return this._mainRule;
        }
        insert(token, fontStyle, foreground, background) {
            if (token === '') {
                // Merge into the main rule
                this._mainRule.acceptOverwrite(fontStyle, foreground, background);
                return;
            }
            const dotIndex = token.indexOf('.');
            let head;
            let tail;
            if (dotIndex === -1) {
                head = token;
                tail = '';
            }
            else {
                head = token.substring(0, dotIndex);
                tail = token.substring(dotIndex + 1);
            }
            let child = this._children.get(head);
            if (typeof child === 'undefined') {
                child = new ThemeTrieElement(this._mainRule.clone());
                this._children.set(head, child);
            }
            child.insert(tail, fontStyle, foreground, background);
        }
    }
    exports.ThemeTrieElement = ThemeTrieElement;
    function generateTokensCSSForColorMap(colorMap) {
        const rules = [];
        for (let i = 1, len = colorMap.length; i < len; i++) {
            const color = colorMap[i];
            rules[i] = `.mtk${i} { color: ${color}; }`;
        }
        rules.push('.mtki { font-style: italic; }');
        rules.push('.mtkb { font-weight: bold; }');
        rules.push('.mtku { text-decoration: underline; text-underline-position: under; }');
        rules.push('.mtks { text-decoration: line-through; }');
        rules.push('.mtks.mtku { text-decoration: underline line-through; text-underline-position: under; }');
        return rules.join('\n');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvc3VwcG9ydHMvdG9rZW5pemF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJDaEcsMENBcURDO0lBb0pELGtEQWdCQztJQUVELHdCQVFDO0lBMElELG9FQVlDO0lBeFpELE1BQWEsb0JBQW9CO1FBYWhDLFlBQ0MsS0FBYSxFQUNiLEtBQWEsRUFDYixTQUFpQixFQUNqQixVQUF5QixFQUN6QixVQUF5QjtZQWpCMUIsMEJBQXFCLEdBQVMsU0FBUyxDQUFDO1lBbUJ2QyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMzQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM5QixDQUFDO0tBQ0Q7SUExQkQsb0RBMEJDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixlQUFlLENBQUMsTUFBeUI7UUFDeEQsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUN2QyxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBMkIsRUFBRSxDQUFDO1FBQzFDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFD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