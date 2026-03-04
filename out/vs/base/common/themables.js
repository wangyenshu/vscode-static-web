/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons"], function (require, exports, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeIcon = exports.ThemeColor = void 0;
    exports.themeColorFromId = themeColorFromId;
    var ThemeColor;
    (function (ThemeColor) {
        function isThemeColor(obj) {
            return obj && typeof obj === 'object' && typeof obj.id === 'string';
        }
        ThemeColor.isThemeColor = isThemeColor;
    })(ThemeColor || (exports.ThemeColor = ThemeColor = {}));
    function themeColorFromId(id) {
        return { id };
    }
    var ThemeIcon;
    (function (ThemeIcon) {
        ThemeIcon.iconNameSegment = '[A-Za-z0-9]+';
        ThemeIcon.iconNameExpression = '[A-Za-z0-9-]+';
        ThemeIcon.iconModifierExpression = '~[A-Za-z]+';
        ThemeIcon.iconNameCharacter = '[A-Za-z0-9~-]';
        const ThemeIconIdRegex = new RegExp(`^(${ThemeIcon.iconNameExpression})(${ThemeIcon.iconModifierExpression})?$`);
        function asClassNameArray(icon) {
            const match = ThemeIconIdRegex.exec(icon.id);
            if (!match) {
                return asClassNameArray(codicons_1.Codicon.error);
            }
            const [, id, modifier] = match;
            const classNames = ['codicon', 'codicon-' + id];
            if (modifier) {
                classNames.push('codicon-modifier-' + modifier.substring(1));
            }
            return classNames;
        }
        ThemeIcon.asClassNameArray = asClassNameArray;
        function asClassName(icon) {
            return asClassNameArray(icon).join(' ');
        }
        ThemeIcon.asClassName = asClassName;
        function asCSSSelector(icon) {
            return '.' + asClassNameArray(icon).join('.');
        }
        ThemeIcon.asCSSSelector = asCSSSelector;
        function isThemeIcon(obj) {
            return obj && typeof obj === 'object' && typeof obj.id === 'string' && (typeof obj.color === 'undefined' || ThemeColor.isThemeColor(obj.color));
        }
        ThemeIcon.isThemeIcon = isThemeIcon;
        const _regexFromString = new RegExp(`^\\$\\((${ThemeIcon.iconNameExpression}(?:${ThemeIcon.iconModifierExpression})?)\\)$`);
        function fromString(str) {
            const match = _regexFromString.exec(str);
            if (!match) {
                return undefined;
            }
            const [, name] = match;
            return { id: name };
        }
        ThemeIcon.fromString = fromString;
        function fromId(id) {
            return { id };
        }
        ThemeIcon.fromId = fromId;
        function modify(icon, modifier) {
            let id = icon.id;
            const tildeIndex = id.lastIndexOf('~');
            if (tildeIndex !== -1) {
                id = id.substring(0, tildeIndex);
            }
            if (modifier) {
                id = `${id}~${modifier}`;
            }
            return { id };
        }
        ThemeIcon.modify = modify;
        function getModifier(icon) {
            const tildeIndex = icon.id.lastIndexOf('~');
            if (tildeIndex !== -1) {
                return icon.id.substring(tildeIndex + 1);
            }
            return undefined;
        }
        ThemeIcon.getModifier = getModifier;
        function isEqual(ti1, ti2) {
            return ti1.id === ti2.id && ti1.color?.id === ti2.color?.id;
        }
        ThemeIcon.isEqual = isEqual;
    })(ThemeIcon || (exports.ThemeIcon = ThemeIcon = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWFibGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vdGhlbWFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsNENBRUM7SUFSRCxJQUFpQixVQUFVLENBSTFCO0lBSkQsV0FBaUIsVUFBVTtRQUMxQixTQUFnQixZQUFZLENBQUMsR0FBUTtZQUNwQyxPQUFPLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksT0FBb0IsR0FBSSxDQUFDLEVBQUUsS0FBSyxRQUFRLENBQUM7UUFDbkYsQ0FBQztRQUZlLHVCQUFZLGVBRTNCLENBQUE7SUFDRixDQUFDLEVBSmdCLFVBQVUsMEJBQVYsVUFBVSxRQUkxQjtJQUVELFNBQWdCLGdCQUFnQixDQUFDLEVBQW1CO1FBQ25ELE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUNmLENBQUM7SUFRRCxJQUFpQixTQUFTLENBd0V6QjtJQXhFRCxXQUFpQixTQUFTO1FBQ1oseUJBQWUsR0FBRyxjQUFjLENBQUM7UUFDakMsNEJBQWtCLEdBQUcsZUFBZSxDQUFDO1FBQ3JDLGdDQUFzQixHQUFHLFlBQVksQ0FBQztRQUN0QywyQkFBaUIsR0FBRyxlQUFlLENBQUM7UUFFakQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLFVBQUEsa0JBQWtCLEtBQUssVUFBQSxzQkFBc0IsS0FBSyxDQUFDLENBQUM7UUFFN0YsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBZTtZQUMvQyxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLGdCQUFnQixDQUFDLGtCQUFPLENBQUMsS0FBSyxD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