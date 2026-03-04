/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/strings", "vs/editor/common/languages/languageConfiguration"], function (require, exports, errors_1, strings, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OnEnterSupport = void 0;
    class OnEnterSupport {
        constructor(opts) {
            opts = opts || {};
            opts.brackets = opts.brackets || [
                ['(', ')'],
                ['{', '}'],
                ['[', ']']
            ];
            this._brackets = [];
            opts.brackets.forEach((bracket) => {
                const openRegExp = OnEnterSupport._createOpenBracketRegExp(bracket[0]);
                const closeRegExp = OnEnterSupport._createCloseBracketRegExp(bracket[1]);
                if (openRegExp && closeRegExp) {
                    this._brackets.push({
                        open: bracket[0],
                        openRegExp: openRegExp,
                        close: bracket[1],
                        closeRegExp: closeRegExp,
                    });
                }
            });
            this._regExpRules = opts.onEnterRules || [];
        }
        onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText) {
            // (1): `regExpRules`
            if (autoIndent >= 3 /* EditorAutoIndentStrategy.Advanced */) {
                for (let i = 0, len = this._regExpRules.length; i < len; i++) {
                    const rule = this._regExpRules[i];
                    const regResult = [{
                            reg: rule.beforeText,
                            text: beforeEnterText
                        }, {
                            reg: rule.afterText,
                            text: afterEnterText
                        }, {
                            reg: rule.previousLineText,
                            text: previousLineText
                        }].every((obj) => {
                        if (!obj.reg) {
                            return true;
                        }
                        obj.reg.lastIndex = 0; // To disable the effect of the "g" flag.
                        return obj.reg.test(obj.text);
                    });
                    if (regResult) {
                        return rule.action;
                    }
                }
            }
            // (2): Special indent-outdent
            if (autoIndent >= 2 /* EditorAutoIndentStrategy.Brackets */) {
                if (beforeEnterText.length > 0 && afterEnterText.length > 0) {
                    for (let i = 0, len = this._brackets.length; i < len; i++) {
                        const bracket = this._brackets[i];
                        if (bracket.openRegExp.test(beforeEnterText) && bracket.closeRegExp.test(afterEnterText)) {
                            return { indentAction: languageConfiguration_1.IndentAction.IndentOutdent };
                        }
                    }
                }
            }
            // (4): Open bracket based logic
            if (autoIndent >= 2 /* EditorAutoIndentStrategy.Brackets */) {
                if (beforeEnterText.length > 0) {
                    for (let i = 0, len = this._brackets.length; i < len; i++) {
                        const bracket = this._brackets[i];
                        if (bracket.openRegExp.test(beforeEnterText)) {
                            return { indentAction: languageConfiguration_1.IndentAction.Indent };
                        }
                    }
                }
            }
            return null;
        }
        static _createOpenBracketRegExp(bracket) {
            let str = strings.escapeRegExpCharacters(bracket);
            if (!/\B/.test(str.charAt(0))) {
                str = '\\b' + str;
            }
            str += '\\s*$';
            return OnEnterSupport._safeRegExp(str);
        }
        static _createCloseBracketRegExp(bracket) {
            let str = strings.escapeRegExpCharacters(bracket);
            if (!/\B/.test(str.charAt(str.length - 1))) {
                str = str + '\\b';
            }
            str = '^\\s*' + str;
            return OnEnterSupport._safeRegExp(str);
        }
        static _safeRegExp(def) {
            try {
                return new RegExp(def);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
                return null;
            }
        }
    }
    exports.OnEnterSupport = OnEnterSupport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25FbnRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL3N1cHBvcnRzL29uRW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRyxNQUFhLGNBQWM7UUFLMUIsWUFBWSxJQUE0QjtZQUN2QyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUk7Z0JBQ2hDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztnQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2FBQ1YsQ0FBQztZQUVGLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ2pDLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkUsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLFVBQVUsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7d0JBQ25CLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO3dCQUNoQixVQUFVLEVBQUUsVUFBVTt3QkFDdEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7d0JBQ2pCLFdBQVcsRUFBRSxXQUFXO3FCQUN4QixDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUMs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