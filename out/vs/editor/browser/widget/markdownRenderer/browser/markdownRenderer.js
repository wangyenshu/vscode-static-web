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
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/base/browser/trustedTypes", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/config/domFontInfo", "vs/editor/common/languages/language", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/textToHtmlTokenizer", "vs/platform/opener/common/opener", "vs/css!./renderedMarkdown"], function (require, exports, markdownRenderer_1, trustedTypes_1, errors_1, event_1, lifecycle_1, domFontInfo_1, language_1, modesRegistry_1, textToHtmlTokenizer_1, opener_1) {
    "use strict";
    var MarkdownRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownRenderer = void 0;
    exports.openLinkFromMarkdown = openLinkFromMarkdown;
    /**
     * Markdown renderer that can render codeblocks with the editor mechanics. This
     * renderer should always be preferred.
     */
    let MarkdownRenderer = class MarkdownRenderer {
        static { MarkdownRenderer_1 = this; }
        static { this._ttpTokenizer = (0, trustedTypes_1.createTrustedTypesPolicy)('tokenizeToString', {
            createHTML(html) {
                return html;
            }
        }); }
        constructor(_options, _languageService, _openerService) {
            this._options = _options;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._onDidRenderAsync = new event_1.Emitter();
            this.onDidRenderAsync = this._onDidRenderAsync.event;
        }
        dispose() {
            this._onDidRenderAsync.dispose();
        }
        render(markdown, options, markedOptions) {
            if (!markdown) {
                const element = document.createElement('span');
                return { element, dispose: () => { } };
            }
            const disposables = new lifecycle_1.DisposableStore();
            const rendered = disposables.add((0, markdownRenderer_1.renderMarkdown)(markdown, { ...this._getRenderOptions(markdown, disposables), ...options }, markedOptions));
            rendered.element.classList.add('rendered-markdown');
            return {
                element: rendered.element,
                dispose: () => disposables.dispose()
            };
        }
        _getRenderOptions(markdown, disposables) {
            return {
                codeBlockRenderer: async (languageAlias, value) => {
                    // In markdown,
                    // it is possible that we stumble upon language aliases (e.g.js instead of javascript)
                    // it is possible no alias is given in which case we fall back to the current editor lang
                    let languageId;
                    if (languageAlias) {
                        languageId = this._languageService.getLanguageIdByLanguageName(languageAlias);
                    }
                    else if (this._options.editor) {
                        languageId = this._options.editor.getModel()?.getLanguageId();
                    }
                    if (!languageId) {
                        languageId = modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                    }
                    const html = await (0, textToHtmlTokenizer_1.tokenizeToString)(this._languageService, value, languageId);
                    const element = document.createElement('span');
                    element.innerHTML = (MarkdownRenderer_1._ttpTokenizer?.createHTML(html) ?? html);
                    // use "good" font
                    if (this._options.editor) {
                        const fontInfo = this._options.editor.getOption(50 /* EditorOption.fontInfo */);
                        (0, domFontInfo_1.applyFontInfo)(element, fontInfo);
                    }
                    else if (this._options.codeBlockFontFamily) {
                        element.style.fontFamily = this._options.codeBlockFontFamily;
                    }
                    if (this._options.codeBlockFontSize !== undefined) {
                        element.style.fontSize = this._options.codeBlockFontSize;
                    }
                    return element;
                },
                asyncRenderCallback: () => this._onDidRenderAsync.fire(),
                actionHandler: {
                    callback: (link) => openLinkFromMarkdown(this._openerService, link, markdown.isTrusted),
                    disposables: disposables
                }
            };
        }
    };
    exports.MarkdownRenderer = MarkdownRenderer;
    exports.MarkdownRenderer = MarkdownRenderer = MarkdownRenderer_1 = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService)
    ], MarkdownRenderer);
    async function openLinkFromMarkdown(openerService, link, isTrusted) {
        try {
            return await openerService.open(link, {
                fromUserGesture: true,
                allowContributedOpeners: true,
                allowCommands: toAllowCommandsOption(isTrusted),
            });
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
            return false;
        }
    }
    function toAllowCommandsOption(isTrusted) {
        if (isTrusted === true) {
            return true; // Allow all commands
        }
        if (isTrusted && Array.isArray(isTrusted.enabledCommands)) {
            return isTrusted.enabledCommands; // Allow subset of commands
        }
        return false; // Block commands
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25SZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9tYXJrZG93blJlbmRlcmVyL2Jyb3dzZXIvbWFya2Rvd25SZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0doRyxvREFXQztJQS9GRDs7O09BR0c7SUFDSSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjs7aUJBRWIsa0JBQWEsR0FBRyxJQUFBLHVDQUF3QixFQUFDLGtCQUFrQixFQUFFO1lBQzNFLFVBQVUsQ0FBQyxJQUFZO2dCQUN0QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7U0FDRCxDQUFDLEFBSjBCLENBSXpCO1FBS0gsWUFDa0IsUUFBa0MsRUFDakMsZ0JBQW1ELEVBQ3JELGNBQStDO1lBRjlDLGFBQVEsR0FBUixRQUFRLENBQTBCO1lBQ2hCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDcEMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBTi9DLHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDaEQscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztRQU1yRCxDQUFDO1FBRUwsT0FBTztZQUNOLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQXFDLEVBQUUsT0FBK0IsRUFBRSxhQUE2QjtZQUMzRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDL0MsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxF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