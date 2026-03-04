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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/base", "vs/base/common/scrollable", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/offsetRange", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "./diffEditorItemTemplate", "./objectPool", "vs/css!./style"], function (require, exports, dom_1, scrollableElement_1, arrays_1, arraysFind_1, errors_1, lifecycle_1, observable_1, base_1, scrollable_1, utils_1, offsetRange_1, selection_1, editorContextKeys_1, contextkey_1, instantiation_1, serviceCollection_1, diffEditorItemTemplate_1, objectPool_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffEditorWidgetImpl = void 0;
    let MultiDiffEditorWidgetImpl = class MultiDiffEditorWidgetImpl extends lifecycle_1.Disposable {
        constructor(_element, _dimension, _viewModel, _workbenchUIElementFactory, _parentContextKeyService, _parentInstantiationService) {
            super();
            this._element = _element;
            this._dimension = _dimension;
            this._viewModel = _viewModel;
            this._workbenchUIElementFactory = _workbenchUIElementFactory;
            this._parentContextKeyService = _parentContextKeyService;
            this._parentInstantiationService = _parentInstantiationService;
            this._elements = (0, dom_1.h)('div.monaco-component.multiDiffEditor', [
                (0, dom_1.h)('div@content', {
                    style: {
                        overflow: 'hidden',
                    }
                }),
                (0, dom_1.h)('div.monaco-editor@overflowWidgetsDomNode', {}),
            ]);
            this._sizeObserver = this._register(new utils_1.ObservableElementSizeObserver(this._element, undefined));
            this._objectPool = this._register(new objectPool_1.ObjectPool((data) => {
                const template = this._instantiationService.createInstance(diffEditorItemTemplate_1.DiffEditorItemTemplate, this._elements.content, this._elements.overflowWidgetsDomNode, this._workbenchUIElementFactory);
                template.setData(data);
                return template;
            }));
            this._scrollable = this._register(new scrollable_1.Scrollable({
                forceIntegerValues: false,
                scheduleAtNextAnimationFrame: (cb) => (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this._element), cb),
                smoothScrollDuration: 100,
            }));
            this._scrollableElement = this._register(new scrollableElement_1.SmoothScrollableElement(this._elements.root, {
                vertical: 1 /* ScrollbarVisibility.Auto */,
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                useShadows: false,
            }, this._scrollable));
            this.scrollTop = (0, observable_1.observableFromEvent)(this._scrollableElement.onScroll, () => /** @description scrollTop */ this._scrollableElement.getScrollPosition().scrollTop);
            this.scrollLeft = (0, observable_1.observableFromEvent)(this._scrollableElement.onScroll, () => /** @description scrollLeft */ this._scrollableElement.getScrollPosition().scrollLeft);
            this._viewItemsInfo = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                const vm = this._viewModel.read(reader);
                if (!vm) {
                    return { items: [], getItem: _d => { throw new errors_1.BugIndicatingError(); } };
                }
                const viewModels = vm.items.read(reader);
                const map = new Map();
                const items = viewModels.map(d => {
                    const item = store.add(new VirtualizedViewItem(d, this._objectPool, this.scrollLeft, delta => {
                        this._scrollableElement.setScrollPosition({ scrollTop: this._scrollableElement.getScrollPosition().scrollTop + delta });
                    }));
                    const data = this._lastDocStates?.[item.getKey()];
                    if (data) {
                        (0, base_1.transaction)(tx => {
                            item.setViewState(data, tx);
                        });
                    }
                    map.set(d, item);
                    return item;
                });
                return { items, getItem: d => map.get(d) };
            });
            this._viewItems = this._viewItemsInfo.map(this, items => items.items);
            this._spaceBetweenPx = 0;
            this._totalHeight = this._viewItems.map(this, (items, reader) => items.reduce((r, i) => r + i.contentHeight.read(reader) + this._spaceBetweenPx, 0));
            this.activeControl = (0, observable_1.derived)(this, reader => {
                const activeDiffItem = this._viewModel.read(reader)?.activeDiffItem.read(reader);
                if (!activeDiffItem) {
                    return undefined;
                }
                const viewItem = this._viewItemsInfo.read(reader).getItem(activeDiffItem);
                return viewItem.template.read(reader)?.editor;
            });
            this._contextKeyService = this._register(this._parentContextKeyService.createScoped(this._element));
            this._instantiationService = this._parentInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this._contextKeyService]));
            /** This accounts for documents that are not loaded yet. */
            this._lastDocStates = {};
            this._contextKeyService.createKey(editorContextKeys_1.EditorContextKeys.inMultiDiffEditor.key, true);
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                const viewModel = this._viewModel.read(reader);
                if (viewModel && viewModel.contextKeys) {
                    for (const [key, value] of Object.entries(viewModel.contextKeys)) {
                        const contextKey = this._contextKeyService.createKey(key, undefined);
                        contextKey.set(value);
                        store.add((0, lifecycle_1.toDisposable)(() => contextKey.reset()));
                    }
                }
            }));
            const ctxAllCollapsed = this._parentContextKeyService.createKey(editorContextKeys_1.EditorContextKeys.multiDiffEditorAllCollapsed.key, false);
            this._register((0, observable_1.autorun)((reader) => {
                const viewModel = this._viewModel.read(reader);
                if (viewModel) {
                    const allCollapsed = viewModel.items.read(reader).every(item => item.collapsed.read(reader));
                    ctxAllCollapsed.set(allCollapsed);
                }
            }));
            this._register((0, observable_1.autorun)((reader) => {
                /** @description Update widget dimension */
                const dimension = this._dimension.read(reader);
                this._sizeObserver.observe(dimension);
            }));
            this._elements.content.style.position = 'relative';
            this._register((0, observable_1.autorun)((reader) => {
                /** @description Update scroll dimensions */
                const height = this._sizeObserver.height.read(reader);
                this._elements.root.style.height = `${height}px`;
                const totalHeight = this._totalHeight.read(reader);
                this._elements.content.style.height = `${totalHeight}px`;
                const width = this._sizeObserver.width.read(reader);
                let scrollWidth = width;
                const viewItems = this._viewItems.read(reader);
                const max = (0, arraysFind_1.findFirstMax)(viewItems, (0, arrays_1.compareBy)(i => i.maxScroll.read(reader).maxScroll, arrays_1.numberComparator));
                if (max) {
                    const maxScroll = max.maxScroll.read(reader);
                    scrollWidth = width + maxScroll.maxScroll;
                }
                this._scrollableElement.setScrollDimensions({
                    width: width,
                    height: height,
                    scrollHeight: totalHeight,
                    scrollWidth,
                });
            }));
            _element.replaceChildren(this._scrollableElement.getDomNode());
            this._register((0, lifecycle_1.toDisposable)(() => {
                _element.replaceChildren();
            }));
            this._register(this._register((0, observable_1.autorun)(reader => {
                /** @description Render all */
                (0, base_1.globalTransaction)(tx => {
                    this.render(reader);
                });
            })));
        }
        setScrollState(scrollState) {
            this._scrollableElement.setScrollPosition({ scrollLeft: scrollState.left, scrollTop: scrollState.top });
        }
        reveal(resource, options) {
            const viewItems = this._viewItems.get();
            const index = viewItems.findIndex((item) => item.viewModel.originalUri?.toString() === resource.original?.toString()
                && item.viewModel.modifiedUri?.toString() === resource.modified?.toString());
            if (index === -1) {
                throw new errors_1.BugIndicatingError('Resource not found in diff editor');
            }
            const viewItem = viewItems[index];
            this._viewModel.get().activeDiffItem.setCache(viewItem.viewModel, undefined);
            let scrollTop = 0;
            for (let i = 0; i < index; i++) {
                scrollTop += viewItems[i].contentHeight.get() + this._spaceBetweenPx;
            }
            this._scrollableElement.setScrollPosition({ scrollTop });
            const diffEditor = viewItem.template.get()?.editor;
            const editor = 'original' in resource ? diffEditor?.getOriginalEditor() : diffEditor?.getModifiedEditor();
            if (editor && options?.range) {
                editor.revealRangeInCenter(options.range);
                highlightRange(editor, options.range);
            }
        }
        getViewState() {
            return {
                scrollState: {
                    top: this.scrollTop.get(),
                    left: this.scrollLeft.get(),
                },
                docStates: Object.fromEntries(this._viewItems.get().map(i => [i.getKey(), i.getViewState()])),
            };
        }
        setViewState(viewState) {
            this.setScrollState(viewState.scrollState);
            this._lastDocStates = viewState.docStates;
            (0, base_1.transaction)(tx => {
                /** setViewState */
                if (viewState.docStates) {
                    for (const i of this._viewItems.get()) {
                        const state = viewState.docStates[i.getKey()];
                        if (state) {
                            i.setViewState(state, tx);
                        }
                    }
                }
            });
        }
        tryGetCodeEditor(resource) {
            const item = this._viewItems.get().find(v => v.viewModel.diffEditorViewModel.model.modified.uri.toString() === resource.toString()
                || v.viewModel.diffEditorViewModel.model.original.uri.toString() === resource.toString());
            const editor = item?.template.get()?.editor;
            if (!editor) {
                return undefined;
            }
            if (item.viewModel.diffEditorViewModel.model.modified.uri.toString() === resource.toString()) {
                return { diffEditor: editor, editor: editor.getModifiedEditor() };
            }
            else {
                return { diffEditor: editor, editor: editor.getOriginalEditor() };
            }
        }
        render(reader) {
            const scrollTop = this.scrollTop.read(reader);
            let contentScrollOffsetToScrollOffset = 0;
            let itemHeightSumBefore = 0;
            let itemContentHeightSumBefore = 0;
            const viewPortHeight = this._sizeObserver.height.read(reader);
            const contentViewPort = offsetRange_1.OffsetRange.ofStartAndLength(scrollTop, viewPortHeight);
            const width = this._sizeObserver.width.read(reader);
            for (const v of this._viewItems.read(reader)) {
                const itemContentHeight = v.contentHeight.read(reader);
                const itemHeight = Math.min(itemContentHeight, viewPortHeight);
                const itemRange = offsetRange_1.OffsetRange.ofStartAndLength(itemHeightSumBefore, itemHeight);
                const itemContentRange = offsetRange_1.OffsetRange.ofStartAndLength(itemContentHeightSumBefore, itemContentHeight);
                if (itemContentRange.isBefore(contentViewPort)) {
                    contentScrollOffsetToScrollOffset -= itemContentHeight - itemHeight;
                    v.hide();
                }
                else if (itemContentRange.isAfter(contentViewPort)) {
                    v.hide();
                }
                else {
                    const scroll = Math.max(0, Math.min(contentViewPort.start - itemContentRange.start, itemContentHeight - itemHeight));
                    contentScrollOffsetToScrollOffset -= scroll;
                    const viewPort = offsetRange_1.OffsetRange.ofStartAndLength(scrollTop + contentScrollOffsetToScrollOffset, viewPortHeight);
                    v.render(itemRange, scroll, width, viewPort);
                }
                itemHeightSumBefore += itemHeight + this._spaceBetweenPx;
                itemContentHeightSumBefore += itemContentHeight + this._spaceBetweenPx;
            }
            this._elements.content.style.transform = `translateY(${-(scrollTop + contentScrollOffsetToScrollOffset)}px)`;
        }
    };
    exports.MultiDiffEditorWidgetImpl = MultiDiffEditorWidgetImpl;
    exports.MultiDiffEditorWidgetImpl = MultiDiffEditorWidgetImpl = __decorate([
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService)
    ], MultiDiffEditorWidgetImpl);
    function highlightRange(targetEditor, range) {
        const modelNow = targetEditor.getModel();
        const decorations = targetEditor.createDecorationsCollection([{ range, options: { description: 'symbol-navigate-action-highlight', className: 'symbolHighlight' } }]);
        setTimeout(() => {
            if (targetEditor.getModel() === modelNow) {
                decorations.clear();
            }
        }, 350);
    }
    class VirtualizedViewItem extends lifecycle_1.Disposable {
        constructor(viewModel, _objectPool, _scrollLeft, _deltaScrollVertical) {
            super();
            this.viewModel = viewModel;
            this._objectPool = _objectPool;
            this._scrollLeft = _scrollLeft;
            this._deltaScrollVertical = _deltaScrollVertical;
            this._templateRef = this._register((0, base_1.disposableObservableValue)(this, undefined));
            this.contentHeight = (0, observable_1.derived)(this, reader => this._templateRef.read(reader)?.object.contentHeight?.read(reader) ?? this.viewModel.lastTemplateData.read(reader).contentHeight);
            this.maxScroll = (0, observable_1.derived)(this, reader => this._templateRef.read(reader)?.object.maxScroll.read(reader) ?? { maxScroll: 0, scrollWidth: 0 });
            this.template = (0, observable_1.derived)(this, reader => this._templateRef.read(reader)?.object);
            this._isHidden = (0, observable_1.observableValue)(this, false);
            this._isFocused = (0, observable_1.derived)(this, reader => this.template.read(reader)?.isFocused.read(reader) ?? false);
            this.viewModel.setIsFocused(this._isFocused, undefined);
            this._register((0, observable_1.autorun)((reader) => {
                const scrollLeft = this._scrollLeft.read(reader);
                this._templateRef.read(reader)?.object.setScrollLeft(scrollLeft);
            }));
            this._register((0, observable_1.autorun)(reader => {
                const ref = this._templateRef.read(reader);
                if (!ref) {
                    return;
                }
                const isHidden = this._isHidden.read(reader);
                if (!isHidden) {
                    return;
                }
                const isFocused = ref.object.isFocused.read(reader);
                if (isFocused) {
                    return;
                }
                this._clear();
            }));
        }
        dispose() {
            this._clear();
            super.dispose();
        }
        toString() {
            return `VirtualViewItem(${this.viewModel.entry.value.modified?.uri.toString()})`;
        }
        getKey() {
            return this.viewModel.getKey();
        }
        getViewState() {
            (0, base_1.transaction)(tx => {
                this._updateTemplateData(tx);
            });
            return {
                collapsed: this.viewModel.collapsed.get(),
                selections: this.viewModel.lastTemplateData.get().selections,
            };
        }
        setViewState(viewState, tx) {
            this.viewModel.collapsed.set(viewState.collapsed, tx);
            this._updateTemplateData(tx);
            const data = this.viewModel.lastTemplateData.get();
            const selections = viewState.selections?.map(selection_1.Selection.liftSelection);
            this.viewModel.lastTemplateData.set({
                ...data,
                selections,
            }, tx);
            const ref = this._templateRef.get();
            if (ref) {
                if (selections) {
                    ref.object.editor.setSelections(selections);
                }
            }
        }
        _updateTemplateData(tx) {
            const ref = this._templateRef.get();
            if (!ref) {
                return;
            }
            this.viewModel.lastTemplateData.set({
                contentHeight: ref.object.contentHeight.get(),
                selections: ref.object.editor.getSelections() ?? undefined,
            }, tx);
        }
        _clear() {
            const ref = this._templateRef.get();
            if (!ref) {
                return;
            }
            (0, base_1.transaction)(tx => {
                this._updateTemplateData(tx);
                ref.object.hide();
                this._templateRef.set(undefined, tx);
            });
        }
        hide() {
            this._isHidden.set(true, undefined);
        }
        render(verticalSpace, offset, width, viewPort) {
            this._isHidden.set(false, undefined);
            let ref = this._templateRef.get();
            if (!ref) {
                ref = this._objectPool.getUnusedObj(new diffEditorItemTemplate_1.TemplateData(this.viewModel, this._deltaScrollVertical));
                this._templateRef.set(ref, undefined);
                const selections = this.viewModel.lastTemplateData.get().selections;
                if (selections) {
                    ref.object.editor.setSelections(selections);
                }
            }
            ref.object.render(verticalSpace, width, offset, viewPort);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yV2lkZ2V0SW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9tdWx0aURpZmZFZGl0b3IvbXVsdGlEaWZmRWRpdG9yV2lkZ2V0SW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4QnpGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7UUFpRnhELFlBQ2tCLFFBQXFCLEVBQ3JCLFVBQThDLEVBQzlDLFVBQTZELEVBQzdELDBCQUFzRCxFQUNuRCx3QkFBNkQsRUFDMUQsMkJBQW1FO1lBRTFGLEtBQUssRUFBRSxDQUFDO1lBUFMsYUFBUSxHQUFSLFFBQVEsQ0FBYTtZQUNyQixlQUFVLEdBQVYsVUFBVSxDQUFvQztZQUM5QyxlQUFVLEdBQVYsVUFBVSxDQUFtRDtZQUM3RCwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTRCO1lBQ2xDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBb0I7WUFDekMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUF1QjtZQXRGMUUsY0FBUyxHQUFHLElBQUEsT0FBQyxFQUFDLHNDQUFzQyxFQUFFO2dCQUN0RSxJQUFBLE9BQUMsRUFBQyxhQUFhLEVBQUU7b0JBQ2hCLEtBQUssRUFBRTt3QkFDTixRQUFRLEVBQUUsUUFBUTtxQkFDbEI7aUJBQ0QsQ0FBQztnQkFDRixJQUFBLE9BQUMsRUFBQywwQ0FBMEMsRUFBRSxFQUM3QyxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1lBRWMsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkscUNBQTZCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRTVGLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNB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