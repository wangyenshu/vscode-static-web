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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/contrib/hover/browser/hoverActionIds", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/editor/common/services/languageFeatures", "vs/editor/common/languages", "vs/platform/theme/common/iconRegistry", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/errors", "vs/platform/keybinding/common/keybinding", "vs/base/browser/ui/hover/hoverWidget", "vs/platform/hover/browser/hover", "vs/base/common/async", "vs/editor/contrib/hover/browser/getHover"], function (require, exports, dom, arrays_1, cancellation_1, htmlContent_1, lifecycle_1, markdownRenderer_1, hoverActionIds_1, range_1, language_1, nls, configuration_1, opener_1, languageFeatures_1, languages_1, iconRegistry_1, codicons_1, themables_1, errors_1, keybinding_1, hoverWidget_1, hover_1, async_1, getHover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownHoverParticipant = exports.MarkdownHover = void 0;
    exports.renderMarkdownHovers = renderMarkdownHovers;
    const $ = dom.$;
    const increaseHoverVerbosityIcon = (0, iconRegistry_1.registerIcon)('hover-increase-verbosity', codicons_1.Codicon.add, nls.localize('increaseHoverVerbosity', 'Icon for increaseing hover verbosity.'));
    const decreaseHoverVerbosityIcon = (0, iconRegistry_1.registerIcon)('hover-decrease-verbosity', codicons_1.Codicon.remove, nls.localize('decreaseHoverVerbosity', 'Icon for decreasing hover verbosity.'));
    class MarkdownHover {
        constructor(owner, range, contents, isBeforeContent, ordinal, source = undefined) {
            this.owner = owner;
            this.range = range;
            this.contents = contents;
            this.isBeforeContent = isBeforeContent;
            this.ordinal = ordinal;
            this.source = source;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.MarkdownHover = MarkdownHover;
    class HoverSource {
        constructor(hover, hoverProvider, hoverPosition) {
            this.hover = hover;
            this.hoverProvider = hoverProvider;
            this.hoverPosition = hoverPosition;
        }
        supportsVerbosityAction(hoverVerbosityAction) {
            switch (hoverVerbosityAction) {
                case languages_1.HoverVerbosityAction.Increase:
                    return this.hover.canIncreaseVerbosity ?? false;
                case languages_1.HoverVerbosityAction.Decrease:
                    return this.hover.canDecreaseVerbosity ?? false;
            }
        }
    }
    let MarkdownHoverParticipant = class MarkdownHoverParticipant {
        constructor(_editor, _languageService, _openerService, _configurationService, _languageFeaturesService, _keybindingService, _hoverService) {
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._keybindingService = _keybindingService;
            this._hoverService = _hoverService;
            this.hoverOrdinal = 3;
        }
        createLoadingMessage(anchor) {
            return new MarkdownHover(this, anchor.range, [new htmlContent_1.MarkdownString().appendText(nls.localize('modesContentHover.loading', "Loading..."))], false, 2000);
        }
        computeSync(anchor, lineDecorations) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return [];
            }
            const model = this._editor.getModel();
            const lineNumber = anchor.range.startLineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            const result = [];
            let index = 1000;
            const lineLength = model.getLineLength(lineNumber);
            const languageId = model.getLanguageIdAtPosition(anchor.range.startLineNumber, anchor.range.startColumn);
            const stopRenderingLineAfter = this._editor.getOption(117 /* EditorOption.stopRenderingLineAfter */);
            const maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                overrideIdentifier: languageId
            });
            let stopRenderingMessage = false;
            if (stopRenderingLineAfter >= 0 && lineLength > stopRenderingLineAfter && anchor.range.startColumn >= stopRenderingLineAfter) {
                stopRenderingMessage = true;
                result.push(new MarkdownHover(this, anchor.range, [{
                        value: nls.localize('stopped rendering', "Rendering paused for long line for performance reasons. This can be configured via `editor.stopRenderingLineAfter`.")
                    }], false, index++));
            }
            if (!stopRenderingMessage && typeof maxTokenizationLineLength === 'number' && lineLength >= maxTokenizationLineLength) {
                result.push(new MarkdownHover(this, anchor.range, [{
                        value: nls.localize('too many characters', "Tokenization is skipped for long lines for performance reasons. This can be configured via `editor.maxTokenizationLineLength`.")
                    }], false, index++));
            }
            let isBeforeContent = false;
            for (const d of lineDecorations) {
                const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
                const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
                const hoverMessage = d.options.hoverMessage;
                if (!hoverMessage || (0, htmlContent_1.isEmptyMarkdownString)(hoverMessage)) {
                    continue;
                }
                if (d.options.beforeContentClassName) {
                    isBeforeContent = true;
                }
                const range = new range_1.Range(anchor.range.startLineNumber, startColumn, anchor.range.startLineNumber, endColumn);
                result.push(new MarkdownHover(this, range, (0, arrays_1.asArray)(hoverMessage), isBeforeContent, index++));
            }
            return result;
        }
        computeAsync(anchor, lineDecorations, token) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const model = this._editor.getModel();
            const hoverProviderRegistry = this._languageFeaturesService.hoverProvider;
            if (!hoverProviderRegistry.has(model)) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const markdownHovers = this._getMarkdownHovers(hoverProviderRegistry, model, anchor, token);
            return markdownHovers;
        }
        _getMarkdownHovers(hoverProviderRegistry, model, anchor, token) {
            const position = anchor.range.getStartPosition();
            const hoverProviderResults = (0, getHover_1.getHoverProviderResultsAsAsyncIterable)(hoverProviderRegistry, model, position, token);
            const markdownHovers = hoverProviderResults.filter(item => !(0, htmlContent_1.isEmptyMarkdownString)(item.hover.contents))
                .map(item => {
                const range = item.hover.range ? range_1.Range.lift(item.hover.range) : anchor.range;
                const hoverSource = new HoverSource(item.hover, item.provider, position);
                return new MarkdownHover(this, range, item.hover.contents, false, item.ordinal, hoverSource);
            });
            return markdownHovers;
        }
        renderHoverParts(context, hoverParts) {
            this._renderedHoverParts = new MarkdownRenderedHoverParts(hoverParts, context.fragment, this._editor, this._languageService, this._openerService, this._keybindingService, this._hoverService, this._configurationService, context.onContentsChanged);
            return this._renderedHoverParts;
        }
        updateFocusedMarkdownHoverPartVerbosityLevel(action) {
            this._renderedHoverParts?.updateFocusedHoverPartVerbosityLevel(action);
        }
    };
    exports.MarkdownHoverParticipant = MarkdownHoverParticipant;
    exports.MarkdownHoverParticipant = MarkdownHoverParticipant = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, hover_1.IHoverService)
    ], MarkdownHoverParticipant);
    class MarkdownRenderedHoverParts extends lifecycle_1.Disposable {
        constructor(hoverParts, // we own!
        hoverPartsContainer, _editor, _languageService, _openerService, _keybindingService, _hoverService, _configurationService, _onFinishedRendering) {
            super();
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._keybindingService = _keybindingService;
            this._hoverService = _hoverService;
            this._configurationService = _configurationService;
            this._onFinishedRendering = _onFinishedRendering;
            this._hoverFocusInfo = { hoverPartIndex: -1, focusRemains: false };
            this._renderedHoverParts = this._renderHoverParts(hoverParts, hoverPartsContainer, this._onFinishedRendering);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._renderedHoverParts.forEach(renderedHoverPart => {
                    renderedHoverPart.disposables.dispose();
                });
            }));
        }
        _renderHoverParts(hoverParts, hoverPartsContainer, onFinishedRendering) {
            hoverParts.sort((0, arrays_1.compareBy)(hover => hover.ordinal, arrays_1.numberComparator));
            return hoverParts.map((hoverPart, hoverIndex) => {
                const renderedHoverPart = this._renderHoverPart(hoverIndex, hoverPart.contents, hoverPart.source, onFinishedRendering);
                hoverPartsContainer.appendChild(renderedHoverPart.renderedMarkdown);
                return renderedHoverPart;
            });
        }
        _renderHoverPart(hoverPartIndex, hoverContents, hoverSource, onFinishedRendering) {
            const { renderedMarkdown, disposables } = this._renderMarkdownContent(hoverContents, onFinishedRendering);
            if (!hoverSource) {
                return { renderedMarkdown, disposables };
            }
            const canIncreaseVerbosity = hoverSource.supportsVerbosityAction(languages_1.HoverVerbosityAction.Increase);
            const canDecreaseVerbosity = hoverSource.supportsVerbosityAction(languages_1.HoverVerbosityAction.Decrease);
            if (!canIncreaseVerbosity && !canDecreaseVerbosity) {
                return { renderedMarkdown, disposables, hoverSource };
            }
            const actionsContainer = $('div.verbosity-actions');
            renderedMarkdown.prepend(actionsContainer);
            disposables.add(this._renderHoverExpansionAction(actionsContainer, languages_1.HoverVerbosityAction.Increase, canIncreaseVerbosity));
            disposables.add(this._renderHoverExpansionAction(actionsContainer, languages_1.HoverVerbosityAction.Decrease, canDecreaseVerbosity));
            const focusTracker = disposables.add(dom.trackFocus(renderedMarkdown));
            disposables.add(focusTracker.onDidFocus(() => {
                this._hoverFocusInfo = {
                    hoverPartIndex,
                    focusRemains: true
                };
            }));
            disposables.add(focusTracker.onDidBlur(() => {
                if (this._hoverFocusInfo?.focusRemains) {
                    this._hoverFocusInfo.focusRemains = false;
                    return;
                }
            }));
            return { renderedMarkdown, disposables, hoverSource };
        }
        _renderMarkdownContent(markdownContent, onFinishedRendering) {
            const renderedMarkdown = $('div.hover-row');
            renderedMarkdown.tabIndex = 0;
            const renderedMarkdownContents = $('div.hover-row-contents');
            renderedMarkdown.appendChild(renderedMarkdownContents);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(renderMarkdownInContainer(this._editor, renderedMarkdownContents, markdownContent, this._languageService, this._openerService, onFinishedRendering));
            return { renderedMarkdown, disposables };
        }
        _renderHoverExpansionAction(container, action, actionEnabled) {
            const store = new lifecycle_1.DisposableStore();
            const isActionIncrease = action === languages_1.HoverVerbosityAction.Increase;
            const actionElement = dom.append(container, $(themables_1.ThemeIcon.asCSSSelector(isActionIncrease ? increaseHoverVerbosityIcon : decreaseHoverVerbosityIcon)));
            actionElement.tabIndex = 0;
            const hoverDelegate = new hover_1.WorkbenchHoverDelegate('mouse', false, { target: container, position: { hoverPosition: 0 /* HoverPosition.LEFT */ } }, this._configurationService, this._hoverService);
            if (isActionIncrease) {
                const kb = this._keybindingService.lookupKeybinding(hoverActionIds_1.INCREASE_HOVER_VERBOSITY_ACTION_ID);
                store.add(this._hoverService.setupUpdatableHover(hoverDelegate, actionElement, kb ?
                    nls.localize('increaseVerbosityWithKb', "Increase Verbosity ({0})", kb.getLabel()) :
                    nls.localize('increaseVerbosity', "Increase Verbosity")));
            }
            else {
                const kb = this._keybindingService.lookupKeybinding(hoverActionIds_1.DECREASE_HOVER_VERBOSITY_ACTION_ID);
                store.add(this._hoverService.setupUpdatableHover(hoverDelegate, actionElement, kb ?
                    nls.localize('decreaseVerbosityWithKb', "Decrease Verbosity ({0})", kb.getLabel()) :
                    nls.localize('decreaseVerbosity', "Decrease Verbosity")));
            }
            if (!actionEnabled) {
                actionElement.classList.add('disabled');
                return store;
            }
            actionElement.classList.add('enabled');
            const actionFunction = () => this.updateFocusedHoverPartVerbosityLevel(action);
            store.add(new hoverWidget_1.ClickAction(actionElement, actionFunction));
            store.add(new hoverWidget_1.KeyDownAction(actionElement, actionFunction, [3 /* KeyCode.Enter */, 10 /* KeyCode.Space */]));
            return store;
        }
        async updateFocusedHoverPartVerbosityLevel(action) {
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            const hoverFocusedPartIndex = this._hoverFocusInfo.hoverPartIndex;
            const hoverRenderedPart = this._getRenderedHoverPartAtIndex(hoverFocusedPartIndex);
            if (!hoverRenderedPart || !hoverRenderedPart.hoverSource?.supportsVerbosityAction(action)) {
                return;
            }
            const hoverPosition = hoverRenderedPart.hoverSource.hoverPosition;
            const hoverProvider = hoverRenderedPart.hoverSource.hoverProvider;
            const hover = hoverRenderedPart.hoverSource.hover;
            const hoverContext = { verbosityRequest: { action, previousHover: hover } };
            let newHover;
            try {
                newHover = await Promise.resolve(hoverProvider.provideHover(model, hoverPosition, cancellation_1.CancellationToken.None, hoverContext));
            }
            catch (e) {
                (0, errors_1.onUnexpectedExternalError)(e);
            }
            if (!newHover) {
                return;
            }
            const hoverSource = new HoverSource(newHover, hoverProvider, hoverPosition);
            const renderedHoverPart = this._renderHoverPart(hoverFocusedPartIndex, newHover.contents, hoverSource, this._onFinishedRendering);
            this._replaceRenderedHoverPartAtIndex(hoverFocusedPartIndex, renderedHoverPart);
            this._focusOnHoverPartWithIndex(hoverFocusedPartIndex);
            this._onFinishedRendering();
        }
        _replaceRenderedHoverPartAtIndex(index, renderedHoverPart) {
            if (index >= this._renderHoverParts.length || index < 0) {
                return;
            }
            const currentRenderedHoverPart = this._renderedHoverParts[index];
            const currentRenderedMarkdown = currentRenderedHoverPart.renderedMarkdown;
            currentRenderedMarkdown.replaceWith(renderedHoverPart.renderedMarkdown);
            currentRenderedHoverPart.disposables.dispose();
            this._renderedHoverParts[index] = renderedHoverPart;
        }
        _focusOnHoverPartWithIndex(index) {
            this._renderedHoverParts[index].renderedMarkdown.focus();
            this._hoverFocusInfo.focusRemains = true;
        }
        _getRenderedHoverPartAtIndex(index) {
            return this._renderedHoverParts[index];
        }
    }
    function renderMarkdownHovers(context, hoverParts, editor, languageService, openerService) {
        // Sort hover parts to keep them stable since they might come in async, out-of-order
        hoverParts.sort((0, arrays_1.compareBy)(hover => hover.ordinal, arrays_1.numberComparator));
        const disposables = new lifecycle_1.DisposableStore();
        for (const hoverPart of hoverParts) {
            disposables.add(renderMarkdownInContainer(editor, context.fragment, hoverPart.contents, languageService, openerService, context.onContentsChanged));
        }
        return disposables;
    }
    function renderMarkdownInContainer(editor, container, markdownStrings, languageService, openerService, onFinishedRendering) {
        const store = new lifecycle_1.DisposableStore();
        for (const contents of markdownStrings) {
            if ((0, htmlContent_1.isEmptyMarkdownString)(contents)) {
                continue;
            }
            const markdownHoverElement = $('div.markdown-hover');
            const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents'));
            const renderer = store.add(new markdownRenderer_1.MarkdownRenderer({ editor }, languageService, openerService));
            store.add(renderer.onDidRenderAsync(() => {
                hoverContentsElement.className = 'hover-contents code-hover-contents';
                onFinishedRendering();
            }));
            const renderedContents = store.add(renderer.render(contents));
            hoverContentsElement.appendChild(renderedContents.element);
            container.appendChild(markdownHoverElement);
        }
        return store;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25Ib3ZlclBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaG92ZXIvYnJvd3Nlci9tYXJrZG93bkhvdmVyUGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOFloRyxvREF1QkM7SUFwWUQsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNoQixNQUFNLDBCQUEwQixHQUFHLElBQUEsMkJBQVksRUFBQywwQkFBMEIsRUFBRSxrQkFBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLHVDQUF1QyxDQUFDLENBQUMsQ0FBQztJQUMxSyxNQUFNLDBCQUEwQixHQUFHLElBQUEsMkJBQVksRUFBQywwQkFBMEIsRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLHNDQUFzQyxDQUFDLENBQUMsQ0FBQztJQUU1SyxNQUFhLGFBQWE7UUFFekIsWUFDaUIsS0FBNkMsRUFDN0MsS0FBWSxFQUNaLFFBQTJCLEVBQzNCLGVBQXdCLEVBQ3hCLE9BQWUsRUFDZixTQUFrQyxTQUFTO1lBTDNDLFVBQUssR0FBTCxLQUFLLENBQXdDO1lBQzdDLFVBQUssR0FBTCxLQUFLLENBQU87WUFDWixhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBUztZQUN4QixZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2YsV0FBTSxHQUFOLE1BQU0sQ0FBcUM7UUFDeEQsQ0FBQztRQUVFLHFCQUFxQixDQUFDLE1BQW1CO1lBQy9DLE9BQU8sQ0FDTixNQUFNLENBQUMsSUFBSSxrQ0FBMEI7bUJBQ2xDLElBQUksQ0FBQyxL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