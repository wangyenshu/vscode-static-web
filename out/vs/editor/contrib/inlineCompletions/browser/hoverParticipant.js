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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry"], function (require, exports, dom, htmlContent_1, lifecycle_1, observable_1, range_1, language_1, hoverTypes_1, inlineCompletionsController_1, inlineCompletionsHintsWidget_1, markdownRenderer_1, nls, accessibility_1, instantiation_1, opener_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionsHoverParticipant = exports.InlineCompletionsHover = void 0;
    class InlineCompletionsHover {
        constructor(owner, range, controller) {
            this.owner = owner;
            this.range = range;
            this.controller = controller;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.InlineCompletionsHover = InlineCompletionsHover;
    let InlineCompletionsHoverParticipant = class InlineCompletionsHoverParticipant {
        constructor(_editor, _languageService, _openerService, accessibilityService, _instantiationService, _telemetryService) {
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this.accessibilityService = accessibilityService;
            this._instantiationService = _instantiationService;
            this._telemetryService = _telemetryService;
            this.hoverOrdinal = 4;
        }
        suggestHoverAnchor(mouseEvent) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(this._editor);
            if (!controller) {
                return null;
            }
            const target = mouseEvent.target;
            if (target.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */) {
                // handle the case where the mouse is over the view zone
                const viewZoneData = target.detail;
                if (controller.shouldShowHoverAtViewZone(viewZoneData.viewZoneId)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, range_1.Range.fromPositions(this._editor.getModel().validatePosition(viewZoneData.positionBefore || viewZoneData.position)), mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            if (target.type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                // handle the case where the mouse is over the empty portion of a line following ghost text
                if (controller.shouldShowHoverAt(target.range)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, target.range, mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            if (target.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                // handle the case where the mouse is directly over ghost text
                const mightBeForeignElement = target.detail.mightBeForeignElement;
                if (mightBeForeignElement && controller.shouldShowHoverAt(target.range)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, target.range, mouseEvent.event.posx, mouseEvent.event.posy, false);
                }
            }
            return null;
        }
        computeSync(anchor, lineDecorations) {
            if (this._editor.getOption(62 /* EditorOption.inlineSuggest */).showToolbar !== 'onHover') {
                return [];
            }
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(this._editor);
            if (controller && controller.shouldShowHoverAt(anchor.range)) {
                return [new InlineCompletionsHover(this, anchor.range, controller)];
            }
            return [];
        }
        renderHoverParts(context, hoverParts) {
            const disposableStore = new lifecycle_1.DisposableStore();
            const part = hoverParts[0];
            this._telemetryService.publicLog2('inlineCompletionHover.shown');
            if (this.accessibilityService.isScreenReaderOptimized() && !this._editor.getOption(8 /* EditorOption.screenReaderAnnounceInlineSuggestion */)) {
                this.renderScreenReaderText(context, part, disposableStore);
            }
            const model = part.controller.model.get();
            const w = this._instantiationService.createInstance(inlineCompletionsHintsWidget_1.InlineSuggestionHintsContentWidget, this._editor, false, (0, observable_1.constObservable)(null), model.selectedInlineCompletionIndex, model.inlineCompletionsCount, model.activeCommands);
            context.fragment.appendChild(w.getDomNode());
            model.triggerExplicitly();
            disposableStore.add(w);
            return disposableStore;
        }
        renderScreenReaderText(context, part, disposableStore) {
            const $ = dom.$;
            const markdownHoverElement = $('div.hover-row.markdown-hover');
            const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents', { ['aria-live']: 'assertive' }));
            const renderer = disposableStore.add(new markdownRenderer_1.MarkdownRenderer({ editor: this._editor }, this._languageService, this._openerService));
            const render = (code) => {
                disposableStore.add(renderer.onDidRenderAsync(() => {
                    hoverContentsElement.className = 'hover-contents code-hover-contents';
                    context.onContentsChanged();
                }));
                const inlineSuggestionAvailable = nls.localize('inlineSuggestionFollows', "Suggestion:");
                const renderedContents = disposableStore.add(renderer.render(new htmlContent_1.MarkdownString().appendText(inlineSuggestionAvailable).appendCodeblock('text', code)));
                hoverContentsElement.replaceChildren(renderedContents.element);
            };
            disposableStore.add((0, observable_1.autorun)(reader => {
                /** @description update hover */
                const ghostText = part.controller.model.read(reader)?.primaryGhostText.read(reader);
                if (ghostText) {
                    const lineText = this._editor.getModel().getLineContent(ghostText.lineNumber);
                    render(ghostText.renderForScreenReader(lineText));
                }
                else {
                    dom.reset(hoverContentsElement);
                }
            }));
            context.fragment.appendChild(markdownHoverElement);
        }
    };
    exports.InlineCompletionsHoverParticipant = InlineCompletionsHoverParticipant;
    exports.InlineCompletionsHoverParticipant = InlineCompletionsHoverParticipant = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService),
        __param(3, accessibility_1.IAccessibilityService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, telemetry_1.ITelemetryService)
    ], InlineCompletionsHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJQYXJ0aWNpcGFudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUNvbXBsZXRpb25zL2Jyb3dzZXIvaG92ZXJQYXJ0aWNpcGFudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQmhHLE1BQWEsc0JBQXNCO1FBQ2xDLFlBQ2lCLEtBQXNELEVBQ3RELEtBQVksRUFDWixVQUF1QztZQUZ2QyxVQUFLLEdBQUwsS0FBSyxDQUFpRDtZQUN0RCxVQUFLLEdBQUwsS0FBSyxDQUFPO1lBQ1osZUFBVSxHQUFWLFVBQVUsQ0FBNkI7UUFDcEQsQ0FBQztRQUVFLHFCQUFxQixDQUFDLE1BQW1CO1lBQy9DLE9BQU8sQ0FDTixNQUFNLENBQUMsSUFBSSxrQ0FBMEI7bUJBQ2xDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVzttQkFDbEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQ2pELENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFkRCx3REFjQztJQUVNLElBQU0saUNBQWlDLEdBQXZDLE1BQU0saUNBQWlDO1FBSTdDLFlBQ2tCLE9BQW9CLEVBQ25CLGdCQUFtRCxFQUNyRCxjQUErQyxFQUN4QyxvQkFBNEQsRUFDNUQscUJBQTZELEVBQ2pFLGlCQUFxRDtZQUx2RCxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0YscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNwQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDdkIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2hELHNCQUFpQixHQUFq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