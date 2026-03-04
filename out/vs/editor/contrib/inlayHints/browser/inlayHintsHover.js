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
define(["require", "exports", "vs/base/common/async", "vs/base/common/htmlContent", "vs/editor/common/core/position", "vs/editor/common/model/textModel", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/editor/contrib/hover/browser/getHover", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/inlayHints/browser/inlayHintsController", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/editor/common/services/languageFeatures", "vs/nls", "vs/base/common/platform", "vs/editor/contrib/inlayHints/browser/inlayHints", "vs/base/common/arrays", "vs/platform/keybinding/common/keybinding", "vs/platform/hover/browser/hover"], function (require, exports, async_1, htmlContent_1, position_1, textModel_1, hoverTypes_1, language_1, resolverService_1, getHover_1, markdownHoverParticipant_1, inlayHintsController_1, configuration_1, opener_1, languageFeatures_1, nls_1, platform, inlayHints_1, arrays_1, keybinding_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsHover = void 0;
    class InlayHintsHoverAnchor extends hoverTypes_1.HoverForeignElementAnchor {
        constructor(part, owner, initialMousePosX, initialMousePosY) {
            super(10, owner, part.item.anchor.range, initialMousePosX, initialMousePosY, true);
            this.part = part;
        }
    }
    let InlayHintsHover = class InlayHintsHover extends markdownHoverParticipant_1.MarkdownHoverParticipant {
        constructor(editor, languageService, openerService, keybindingService, hoverService, configurationService, _resolverService, languageFeaturesService) {
            super(editor, languageService, openerService, configurationService, languageFeaturesService, keybindingService, hoverService);
            this._resolverService = _resolverService;
            this.hoverOrdinal = 6;
        }
        suggestHoverAnchor(mouseEvent) {
            const controller = inlayHintsController_1.InlayHintsController.get(this._editor);
            if (!controller) {
                return null;
            }
            if (mouseEvent.target.type !== 6 /* MouseTargetType.CONTENT_TEXT */) {
                return null;
            }
            const options = mouseEvent.target.detail.injectedText?.options;
            if (!(options instanceof textModel_1.ModelDecorationInjectedTextOptions && options.attachedData instanceof inlayHintsController_1.RenderedInlayHintLabelPart)) {
                return null;
            }
            return new InlayHintsHoverAnchor(options.attachedData, this, mouseEvent.event.posx, mouseEvent.event.posy);
        }
        computeSync() {
            return [];
        }
        computeAsync(anchor, _lineDecorations, token) {
            if (!(anchor instanceof InlayHintsHoverAnchor)) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            return new async_1.AsyncIterableObject(async (executor) => {
                const { part } = anchor;
                await part.item.resolve(token);
                if (token.isCancellationRequested) {
                    return;
                }
                // (1) Inlay Tooltip
                let itemTooltip;
                if (typeof part.item.hint.tooltip === 'string') {
                    itemTooltip = new htmlContent_1.MarkdownString().appendText(part.item.hint.tooltip);
                }
                else if (part.item.hint.tooltip) {
                    itemTooltip = part.item.hint.tooltip;
                }
                if (itemTooltip) {
                    executor.emitOne(new markdownHoverParticipant_1.MarkdownHover(this, anchor.range, [itemTooltip], false, 0));
                }
                // (1.2) Inlay dbl-click gesture
                if ((0, arrays_1.isNonEmptyArray)(part.item.hint.textEdits)) {
                    executor.emitOne(new markdownHoverParticipant_1.MarkdownHover(this, anchor.range, [new htmlContent_1.MarkdownString().appendText((0, nls_1.localize)('hint.dbl', "Double-click to insert"))], false, 10001));
                }
                // (2) Inlay Label Part Tooltip
                let partTooltip;
                if (typeof part.part.tooltip === 'string') {
                    partTooltip = new htmlContent_1.MarkdownString().appendText(part.part.tooltip);
                }
                else if (part.part.tooltip) {
                    partTooltip = part.part.tooltip;
                }
                if (partTooltip) {
                    executor.emitOne(new markdownHoverParticipant_1.MarkdownHover(this, anchor.range, [partTooltip], false, 1));
                }
                // (2.2) Inlay Label Part Help Hover
                if (part.part.location || part.part.command) {
                    let linkHint;
                    const useMetaKey = this._editor.getOption(78 /* EditorOption.multiCursorModifier */) === 'altKey';
                    const kb = useMetaKey
                        ? platform.isMacintosh
                            ? (0, nls_1.localize)('links.navigate.kb.meta.mac', "cmd + click")
                            : (0, nls_1.localize)('links.navigate.kb.meta', "ctrl + click")
                        : platform.isMacintosh
                            ? (0, nls_1.localize)('links.navigate.kb.alt.mac', "option + click")
                            : (0, nls_1.localize)('links.navigate.kb.alt', "alt + click");
                    if (part.part.location && part.part.command) {
                        linkHint = new htmlContent_1.MarkdownString().appendText((0, nls_1.localize)('hint.defAndCommand', 'Go to Definition ({0}), right click for more', kb));
                    }
                    else if (part.part.location) {
                        linkHint = new htmlContent_1.MarkdownString().appendText((0, nls_1.localize)('hint.def', 'Go to Definition ({0})', kb));
                    }
                    else if (part.part.command) {
                        linkHint = new htmlContent_1.MarkdownString(`[${(0, nls_1.localize)('hint.cmd', "Execute Command")}](${(0, inlayHints_1.asCommandLink)(part.part.command)} "${part.part.command.title}") (${kb})`, { isTrusted: true });
                    }
                    if (linkHint) {
                        executor.emitOne(new markdownHoverParticipant_1.MarkdownHover(this, anchor.range, [linkHint], false, 10000));
                    }
                }
                // (3) Inlay Label Part Location tooltip
                const iterable = await this._resolveInlayHintLabelPartHover(part, token);
                for await (const item of iterable) {
                    executor.emitOne(item);
                }
            });
        }
        async _resolveInlayHintLabelPartHover(part, token) {
            if (!part.part.location) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const { uri, range } = part.part.location;
            const ref = await this._resolverService.createModelReference(uri);
            try {
                const model = ref.object.textEditorModel;
                if (!this._languageFeaturesService.hoverProvider.has(model)) {
                    return async_1.AsyncIterableObject.EMPTY;
                }
                return (0, getHover_1.getHoverProviderResultsAsAsyncIterable)(this._languageFeaturesService.hoverProvider, model, new position_1.Position(range.startLineNumber, range.startColumn), token)
                    .filter(item => !(0, htmlContent_1.isEmptyMarkdownString)(item.hover.contents))
                    .map(item => new markdownHoverParticipant_1.MarkdownHover(this, part.item.anchor.range, item.hover.contents, false, 2 + item.ordinal));
            }
            finally {
                ref.dispose();
            }
        }
    };
    exports.InlayHintsHover = InlayHintsHover;
    exports.InlayHintsHover = InlayHintsHover = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, hover_1.IHoverService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, languageFeatures_1.ILanguageFeaturesService)
    ], InlayHintsHover);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50c0hvdmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5sYXlIaW50cy9icm93c2VyL2lubGF5SGludHNIb3Zlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHLE1BQU0scUJBQXNCLFNBQVEsc0NBQXlCO1FBQzVELFlBQ1UsSUFBZ0MsRUFDekMsS0FBc0IsRUFDdEIsZ0JBQW9DLEVBQ3BDLGdCQUFvQztZQUVwQyxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFMMUUsU0FBSSxHQUFKLElBQUksQ0FBNEI7UUFNMUMsQ0FBQztLQUNEO0lBRU0sSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxtREFBd0I7UUFJNUQsWUFDQyxNQUFtQixFQUNELGVBQWlDLEVBQ25DLGFBQTZCLEVBQ3pCLGlCQUFxQyxFQUMxQyxZQUEyQixFQUNuQixvQkFBMkMsRUFDL0MsZ0JBQW9ELEVBQzdDLHVCQUFpRDtZQUUzRSxLQUFLLENBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsdUJBQXVCLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFIMUYscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVQvQyxpQkFBWSxHQUFXLENBQUMsQ0FBQztRQWFsRCxDQUFDO1FBRUQsa0JBQWtCLENBQUMsVUFBNkI7WUFDL0MsTUFBTSxVQUFVLEdBQUcsMkNBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxRCxJQUFJLENB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