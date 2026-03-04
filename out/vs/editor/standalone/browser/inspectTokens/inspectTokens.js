/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/languages", "vs/editor/common/encodedTokenAttributes", "vs/editor/common/languages/nullTokenize", "vs/editor/common/languages/language", "vs/editor/standalone/common/standaloneTheme", "vs/editor/common/standaloneStrings", "vs/css!./inspectTokens"], function (require, exports, dom_1, color_1, lifecycle_1, editorExtensions_1, languages_1, encodedTokenAttributes_1, nullTokenize_1, language_1, standaloneTheme_1, standaloneStrings_1) {
    "use strict";
    var InspectTokensController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let InspectTokensController = class InspectTokensController extends lifecycle_1.Disposable {
        static { InspectTokensController_1 = this; }
        static { this.ID = 'editor.contrib.inspectTokens'; }
        static get(editor) {
            return editor.getContribution(InspectTokensController_1.ID);
        }
        constructor(editor, standaloneColorService, languageService) {
            super();
            this._editor = editor;
            this._languageService = languageService;
            this._widget = null;
            this._register(this._editor.onDidChangeModel((e) => this.stop()));
            this._register(this._editor.onDidChangeModelLanguage((e) => this.stop()));
            this._register(languages_1.TokenizationRegistry.onDidChange((e) => this.stop()));
            this._register(this._editor.onKeyUp((e) => e.keyCode === 9 /* KeyCode.Escape */ && this.stop()));
        }
        dispose() {
            this.stop();
            super.dispose();
        }
        launch() {
            if (this._widget) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            this._widget = new InspectTokensWidget(this._editor, this._languageService);
        }
        stop() {
            if (this._widget) {
                this._widget.dispose();
                this._widget = null;
            }
        }
    };
    InspectTokensController = InspectTokensController_1 = __decorate([
        __param(1, standaloneTheme_1.IStandaloneThemeService),
        __param(2, language_1.ILanguageService)
    ], InspectTokensController);
    class InspectTokens extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inspectTokens',
                label: standaloneStrings_1.InspectTokensNLS.inspectTokensAction,
                alias: 'Developer: Inspect Tokens',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const controller = InspectTokensController.get(editor);
            controller?.launch();
        }
    }
    function renderTokenText(tokenText) {
        let result = '';
        for (let charIndex = 0, len = tokenText.length; charIndex < len; charIndex++) {
            const charCode = tokenText.charCodeAt(charIndex);
            switch (charCode) {
                case 9 /* CharCode.Tab */:
                    result += '\u2192'; // &rarr;
                    break;
                case 32 /* CharCode.Space */:
                    result += '\u00B7'; // &middot;
                    break;
                default:
                    result += String.fromCharCode(charCode);
            }
        }
        return result;
    }
    function getSafeTokenizationSupport(languageIdCodec, languageId) {
        const tokenizationSupport = languages_1.TokenizationRegistry.get(languageId);
        if (tokenizationSupport) {
            return tokenizationSupport;
        }
        const encodedLanguageId = languageIdCodec.encodeLanguageId(languageId);
        return {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenize)(languageId, state),
            tokenizeEncoded: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenizeEncoded)(encodedLanguageId, state)
        };
    }
    class InspectTokensWidget extends lifecycle_1.Disposable {
        static { this._ID = 'editor.contrib.inspectTokensWidget'; }
        constructor(editor, languageService) {
            super();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._editor = editor;
            this._languageService = languageService;
            this._model = this._editor.getModel();
            this._domNode = document.createElement('div');
            this._domNode.className = 'tokens-inspect-widget';
            this._tokenizationSupport = getSafeTokenizationSupport(this._languageService.languageIdCodec, this._model.getLanguageId());
            this._compute(this._editor.getPosition());
            this._register(this._editor.onDidChangeCursorPosition((e) => this._compute(this._editor.getPosition())));
            this._editor.addContentWidget(this);
        }
        dispose() {
            this._editor.removeContentWidget(this);
            super.dispose();
        }
        getId() {
            return InspectTokensWidget._ID;
        }
        _compute(position) {
            const data = this._getTokensAtLine(position.lineNumber);
            let token1Index = 0;
            for (let i = data.tokens1.length - 1; i >= 0; i--) {
                const t = data.tokens1[i];
                if (position.column - 1 >= t.offset) {
                    token1Index = i;
                    break;
                }
            }
            let token2Index = 0;
            for (let i = (data.tokens2.length >>> 1); i >= 0; i--) {
                if (position.column - 1 >= data.tokens2[(i << 1)]) {
                    token2Index = i;
                    break;
                }
            }
            const lineContent = this._model.getLineContent(position.lineNumber);
            let tokenText = '';
            if (token1Index < data.tokens1.length) {
                const tokenStartIndex = data.tokens1[token1Index].offset;
                const tokenEndIndex = token1Index + 1 < data.tokens1.length ? data.tokens1[token1Index + 1].offset : lineContent.length;
                tokenText = lineContent.substring(tokenStartIndex, tokenEndIndex);
            }
            (0, dom_1.reset)(this._domNode, (0, dom_1.$)('h2.tm-token', undefined, renderTokenText(tokenText), (0, dom_1.$)('span.tm-token-length', undefined, `${tokenText.length} ${tokenText.length === 1 ? 'char' : 'chars'}`)));
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('hr.tokens-inspect-separator', { 'style': 'clear:both' }));
            const metadata = (token2Index << 1) + 1 < data.tokens2.length ? this._decodeMetadata(data.tokens2[(token2Index << 1) + 1]) : null;
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('table.tm-metadata-table', undefined, (0, dom_1.$)('tbody', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'language'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? metadata.languageId : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'token type'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? this._tokenTypeToString(metadata.tokenType) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'font style'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? this._fontStyleToString(metadata.fontStyle) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'foreground'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? color_1.Color.Format.CSS.formatHex(metadata.foreground) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'background'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? color_1.Color.Format.CSS.formatHex(metadata.background) : '-?-'}`)))));
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('hr.tokens-inspect-separator'));
            if (token1Index < data.tokens1.length) {
                (0, dom_1.append)(this._domNode, (0, dom_1.$)('span.tm-token-type', undefined, data.tokens1[token1Index].type));
            }
            this._editor.layoutContentWidget(this);
        }
        _decodeMetadata(metadata) {
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const languageId = encodedTokenAttributes_1.TokenMetadata.getLanguageId(metadata);
            const tokenType = encodedTokenAttributes_1.TokenMetadata.getTokenType(metadata);
            const fontStyle = encodedTokenAttributes_1.TokenMetadata.getFontStyle(metadata);
            const foreground = encodedTokenAttributes_1.TokenMetadata.getForeground(metadata);
            const background = encodedTokenAttributes_1.TokenMetadata.getBackground(metadata);
            return {
                languageId: this._languageService.languageIdCodec.decodeLanguageId(languageId),
                tokenType: tokenType,
                fontStyle: fontStyle,
                foreground: colorMap[foreground],
                background: colorMap[background]
            };
        }
        _tokenTypeToString(tokenType) {
            switch (tokenType) {
                case 0 /* StandardTokenType.Other */: return 'Other';
                case 1 /* StandardTokenType.Comment */: return 'Comment';
                case 2 /* StandardTokenType.String */: return 'String';
                case 3 /* StandardTokenType.RegEx */: return 'RegEx';
                default: return '??';
            }
        }
        _fontStyleToString(fontStyle) {
            let r = '';
            if (fontStyle & 1 /* FontStyle.Italic */) {
                r += 'italic ';
            }
            if (fontStyle & 2 /* FontStyle.Bold */) {
                r += 'bold ';
            }
            if (fontStyle & 4 /* FontStyle.Underline */) {
                r += 'underline ';
            }
            if (fontStyle & 8 /* FontStyle.Strikethrough */) {
                r += 'strikethrough ';
            }
            if (r.length === 0) {
                r = '---';
            }
            return r;
        }
        _getTokensAtLine(lineNumber) {
            const stateBeforeLine = this._getStateBeforeLine(lineNumber);
            const tokenizationResult1 = this._tokenizationSupport.tokenize(this._model.getLineContent(lineNumber), true, stateBeforeLine);
            const tokenizationResult2 = this._tokenizationSupport.tokenizeEncoded(this._model.getLineContent(lineNumber), true, stateBeforeLine);
            return {
                startState: stateBeforeLine,
                tokens1: tokenizationResult1.tokens,
                tokens2: tokenizationResult2.tokens,
                endState: tokenizationResult1.endState
            };
        }
        _getStateBeforeLine(lineNumber) {
            let state = this._tokenizationSupport.getInitialState();
            for (let i = 1; i < lineNumber; i++) {
                const tokenizationResult = this._tokenizationSupport.tokenize(this._model.getLineContent(i), true, state);
                state = tokenizationResult.endState;
            }
            return state;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                position: this._editor.getPosition(),
                preference: [2 /* ContentWidgetPositionPreference.BELOW */, 1 /* ContentWidgetPositionPreference.ABOVE */]
            };
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(InspectTokensController.ID, InspectTokensController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(InspectTokens);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdFRva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2Jyb3dzZXIvaW5zcGVjdFRva2Vucy9pbnNwZWN0VG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCaEcsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTs7aUJBRXhCLE9BQUUsR0FBRyw4QkFBOEIsQUFBakMsQ0FBa0M7UUFFcEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTBCLHlCQUF1QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFNRCxZQUNDLE1BQW1CLEVBQ00sc0JBQStDLEVBQ3RELGVBQWlDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUN4QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUVwQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxTQUFTLENBQUMsZ0NBQW9CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLDJCQUFtQixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1osS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFTSxNQUFNO1lBQ1osSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRU0sSUFBSTtZQUNWLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNyQixDQUFDO1FBQ0YsQ0FBQzs7SUFoREksdUJBQXVCO1FBYzFCLFdBQUEseUNBQXVCLENBQUE7UUFDdkIsV0FBQSwyQkFBZ0IsQ0FBQTtPQWZiLHVCQUF1QixDQWlENUI7SUFFRCxNQUFNLGFBQWMsU0FBUSwrQkFBWTtRQUV2QztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsNkJBQTZCO2dCQUNqQyxLQUFLLEVBQUUsb0NBQWdCLENBQUMsbUJBQW1CO2dCQUMzQyxLQUFLLEVBQUUsMkJBQTJCO2dCQUNsQyxZQUFZLEVBQUUsU0FBUzthQUN2QixDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDekQsTUFBTSxVQUFVLEdBQUcsdUJBQXVCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZELFVBQVUsRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUN0QixDQUFDO0tBQ0Q7SUFpQkQsU0FBUyxlQUFlLENBQUMsU0FBaUI7UUFDekMsSUFBSSxNQUFNLEdBQVcsRUFBRSxDQUFDO1FBQ3hCLEtBQUssSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLFNBQVMsR0FBRyxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQztZQUM5RSxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELFFBQVEsUUFBUSxFQUFFLENBQUM7Z0JBQ2xCO29CQUNDLE1BQU0sSUFBSSxRQUFRLENBQUMsQ0FBQyxTQUFTO29CQUM3QixNQUFNO2dCQUVQO29CQUNDLE1BQU0sSUFBSSxRQUFRLENBQUMsQ0FBQyxXQUFXO29CQUMvQixNQUFNO2dCQUVQO29CQUNDLE1BQU0sSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUywwQkFBMEIsQ0FBQyxlQUFpQyxFQUFFLFVBQWtCO1FBQ3hGLE1BQU0sbUJBQW1CLEdBQUcsZ0NBQW9CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2pFLElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQUN6QixPQUFPLG1CQUFtQixDQUFDO1FBQzVCLENBQUM7UUFDRCxNQUFNLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2RSxPQUFPO1lBQ04sZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLHdCQUFTO1lBQ2hDLFFBQVEsRUFBRSxDQUFDLElBQVksRUFBRSxNQUFlLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxJQUFBLDJCQUFZLEVBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQztZQUMzRixlQUFlLEVBQUUsQ0FBQyxJQUFZLEVBQUUsTUFBZSxFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsSUFBQSxrQ0FBbUIsRUFBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUM7U0FDaEgsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLG1CQUFvQixTQUFRLHNCQUFVO2lCQUVuQixRQUFHLEdBQUcsb0NBQW9DLEFBQXZDLENBQXdDO1FBV25FLFlBQ0MsTUFBeUIsRUFDekIsZUFBaUM7WUFFakMsS0FBSyxFQUFFLENBQUM7WUFiVCw0Q0FBNEM7WUFDckMsd0JBQW1CLEdBQUcsSUFBSSxDQUFDO1lBYWpDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7WUFDeEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQztZQUNsRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsMEJBQTBCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDM0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRWUsT0FBTztZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRU0sS0FBSztZQUNYLE9BQU8sbUJBQW1CLENBQUMsR0FBRyxDQUFDO1FBQ2hDLENBQUM7UUFFTyxRQUFRLENBQUMsUUFBa0I7WUFDbEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV4RCxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7WUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDckMsV0FBVyxHQUFHLENBQUMsQ0FBQztvQkFDaEIsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztZQUNwQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNuRCxXQUFXLEdBQUcsQ0FBQyxDQUFDO29CQUNoQixNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BFLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNuQixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDekQsTUFBTSxhQUFhLEdBQUcsV0FBVyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO2dCQUN4SCxTQUFTLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDbkUsQ0FBQztZQUNELElBQUEsV0FBSyxFQUFDLElBQUksQ0FBQyxRQUFRLEVBQ2xCLElBQUEsT0FBQyxFQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsZUFBZSxDQUFDLFNBQVMsQ0FBQyxFQUNyRCxJQUFBLE9BQUMsRUFBQyxzQkFBc0IsRUFBRSxTQUFTLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdHLElBQUEsWUFBTSxFQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBQSxPQUFDLEVBQUMsNkJBQTZCLEVBQUUsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRW5GLE1BQU0sUUFBUSxHQUFHLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNsSSxJQUFBLFlBQU0sRUFBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUEsT0FBQyxFQUFDLHlCQUF5QixFQUFFLFNBQVMsRUFDM0QsSUFBQSxPQUFDLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFDbkIsSUFBQSxPQUFDLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFDaEIsSUFBQSxPQUFDLEVBQUMsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxFQUM5QyxJQUFBLE9BQUMsRUFBQyxzQkFBc0IsRUFBRSxTQUFTLEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQ2pGLEVBQ0QsSUFBQSxPQUFDLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFDaEIsSUFBQSxPQUFDLEVBQUMsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLFlBQXNCLENBQUMsRUFDMUQsSUFBQSxPQUFDLEVBQUMsc0JBQXNCLEVBQUUsU0FBUyxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUN6RyxFQUNELElBQUEsT0FBQyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQ2hCLElBQUEsT0FBQyxFQUFDLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxZQUFzQixDQUFDLEVBQzFELElBQUEsT0FBQyxFQUFDLHNCQUFzQixFQUFFLFNBQVMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FDekcsRUFDRCxJQUFBLE9BQUMsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUNoQixJQUFBLE9BQUMsRUFBQyxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsWUFBWSxDQUFDLEVBQ2hELElBQUEsT0FBQyxFQUFDLHNCQUFzQixFQUFFLFNBQVMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FDN0csRUFDRCxJQUFBLE9BQUMsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUNoQixJQUFBLE9BQUMsRUFBQyxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsWUFBWSxDQUFDLEVBQ2hELElBQUEsT0FBQyxFQUFDLHNCQUFzQixFQUFFLFNBQVMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FDN0csQ0FDRCxDQUNELENBQUMsQ0FBQztZQUNILElBQUEsWUFBTSxFQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBQSxPQUFDLEVBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1lBRXhELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3ZDLElBQUEsWUFBTSxFQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBQSxPQUFDLEVBQUMsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMzRixDQUFDO1lBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRU8sZUFBZSxDQUFDLFFBQWdCO1lBQ3ZDLE1BQU0sUUFBUSxHQUFHLGdDQUFvQixDQUFDLFdBQVcsRUFBRyxDQUFDO1lBQ3JELE1BQU0sVUFBVSxHQUFHLHNDQUFhLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sU0FBUyxHQUFHLHNDQUFhLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sU0FBUyxHQUFHLHNDQUFhLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sVUFBVSxHQUFHLHNDQUFhLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sVUFBVSxHQUFHLHNDQUFhLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pELE9BQU87Z0JBQ04sVUFBVSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDO2dCQUM5RSxTQUFTLEVBQUUsU0FBUztnQkFDcEIsU0FBUyxFQUFFLFNBQVM7Z0JBQ3BCLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDO2dCQUNoQyxVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQzthQUNoQyxDQUFDO1FBQ0gsQ0FBQztRQUVPLGtCQUFrQixDQUFDLFNBQTRCO1lBQ3RELFFBQVEsU0FBUyxFQUFFLENBQUM7Z0JBQ25CLG9DQUE0QixDQUFDLENBQUMsT0FBTyxPQUFPLENBQUM7Z0JBQzdDLHNDQUE4QixDQUFDLENBQUMsT0FBTyxTQUFTLENBQUM7Z0JBQ2pELHFDQUE2QixDQUFDLENBQUMsT0FBTyxRQUFRLENBQUM7Z0JBQy9DLG9DQUE0QixDQUFDLENBQUMsT0FBTyxPQUFPLENBQUM7Z0JBQzdDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBRU8sa0JBQWtCLENBQUMsU0FBb0I7WUFDOUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1gsSUFBSSxTQUFTLDJCQUFtQixFQUFFLENBQUM7Z0JBQ2xDLENBQUMsSUFBSSxTQUFTLENBQUM7WUFDaEIsQ0FBQztZQUNELElBQUksU0FBUyx5QkFBaUIsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLElBQUksT0FBTyxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksU0FBUyw4QkFBc0IsRUFBRSxDQUFDO2dCQUNyQyxDQUFDLElBQUksWUFBWSxDQUFDO1lBQ25CLENBQUM7WUFDRCxJQUFJLFNBQVMsa0NBQTBCLEVBQUUsQ0FBQztnQkFDekMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO1lBQ3ZCLENBQUM7WUFDRCxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3BCLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsVUFBa0I7WUFDMUMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTdELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDOUgsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztZQUVySSxPQUFPO2dCQUNOLFVBQVUsRUFBRSxlQUFlO2dCQUMzQixPQUFPLEVBQUUsbUJBQW1CLENBQUMsTUFBTTtnQkFDbkMsT0FBTyxFQUFFLG1CQUFtQixDQUFDLE1BQU07Z0JBQ25DLFFBQVEsRUFBRSxtQkFBbUIsQ0FBQyxRQUFRO2FBQ3RDLENBQUM7UUFDSCxDQUFDO1FBRU8sbUJBQW1CLENBQUMsVUFBa0I7WUFDN0MsSUFBSSxLQUFLLEdBQVcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsRUFBRSxDQUFDO1lBRWhFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDMUcsS0FBSyxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztZQUNyQyxDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVNLFdBQVc7WUFDakIsT0FBTztnQkFDTixRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BDLFVBQVUsRUFBRSw4RkFBOEU7YUFDMUYsQ0FBQztRQUNILENBQUM7O0lBR0YsSUFBQSw2Q0FBMEIsRUFBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsdUJBQXVCLCtDQUF1QyxDQUFDO0lBQ3RILElBQUEsdUNBQW9CLEVBQUMsYUFBYSxDQUFDLENBQUMifQ==