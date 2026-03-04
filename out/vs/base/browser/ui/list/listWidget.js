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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/list/splice", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/color", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/platform", "vs/base/common/types", "./list", "./listView", "vs/base/browser/mouseEvent", "vs/base/common/observable", "vs/css!./list"], function (require, exports, dom_1, event_1, keyboardEvent_1, touch_1, aria_1, splice_1, arrays_1, async_1, color_1, decorators_1, event_2, filters_1, lifecycle_1, numbers_1, platform, types_1, list_1, listView_1, mouseEvent_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.List = exports.unthemedListStyles = exports.DefaultStyleController = exports.MouseController = exports.DefaultKeyboardNavigationDelegate = exports.TypeNavigationMode = void 0;
    exports.isInputElement = isInputElement;
    exports.isMonacoEditor = isMonacoEditor;
    exports.isMonacoCustomToggle = isMonacoCustomToggle;
    exports.isActionItem = isActionItem;
    exports.isMonacoTwistie = isMonacoTwistie;
    exports.isStickyScrollElement = isStickyScrollElement;
    exports.isStickyScrollContainer = isStickyScrollContainer;
    exports.isButton = isButton;
    exports.isSelectionSingleChangeEvent = isSelectionSingleChangeEvent;
    exports.isSelectionRangeChangeEvent = isSelectionRangeChangeEvent;
    class TraitRenderer {
        constructor(trait) {
            this.trait = trait;
            this.renderedElements = [];
        }
        get templateId() {
            return `template:${this.trait.name}`;
        }
        renderTemplate(container) {
            return container;
        }
        renderElement(element, index, templateData) {
            const renderedElementIndex = this.renderedElements.findIndex(el => el.templateData === templateData);
            if (renderedElementIndex >= 0) {
                const rendered = this.renderedElements[renderedElementIndex];
                this.trait.unrender(templateData);
                rendered.index = index;
            }
            else {
                const rendered = { index, templateData };
                this.renderedElements.push(rendered);
            }
            this.trait.renderIndex(index, templateData);
        }
        splice(start, deleteCount, insertCount) {
            const rendered = [];
            for (const renderedElement of this.renderedElements) {
                if (renderedElement.index < start) {
                    rendered.push(renderedElement);
                }
                else if (renderedElement.index >= start + deleteCount) {
                    rendered.push({
                        index: renderedElement.index + insertCount - deleteCount,
                        templateData: renderedElement.templateData
                    });
                }
            }
            this.renderedElements = rendered;
        }
        renderIndexes(indexes) {
            for (const { index, templateData } of this.renderedElements) {
                if (indexes.indexOf(index) > -1) {
                    this.trait.renderIndex(index, templateData);
                }
            }
        }
        disposeTemplate(templateData) {
            const index = this.renderedElements.findIndex(el => el.templateData === templateData);
            if (index < 0) {
                return;
            }
            this.renderedElements.splice(index, 1);
        }
    }
    class Trait {
        get name() { return this._trait; }
        get renderer() {
            return new TraitRenderer(this);
        }
        constructor(_trait) {
            this._trait = _trait;
            this.indexes = [];
            this.sortedIndexes = [];
            this._onChange = new event_2.Emitter();
            this.onChange = this._onChange.event;
        }
        splice(start, deleteCount, elements) {
            const diff = elements.length - deleteCount;
            const end = start + deleteCount;
            const sortedIndexes = [];
            let i = 0;
            while (i < this.sortedIndexes.length && this.sortedIndexes[i] < start) {
                sortedIndexes.push(this.sortedIndexes[i++]);
            }
            for (let j = 0; j < elements.length; j++) {
                if (elements[j]) {
                    sortedIndexes.push(j + start);
                }
            }
            while (i < this.sortedIndexes.length && this.sortedIndexes[i] >= end) {
                sortedIndexes.push(this.sortedIndexes[i++] + diff);
            }
            this.renderer.splice(start, deleteCount, elements.length);
            this._set(sortedIndexes, sortedIndexes);
        }
        renderIndex(index, container) {
            container.classList.toggle(this._trait, this.contains(index));
        }
        unrender(container) {
            container.classList.remove(this._trait);
        }
        /**
         * Sets the indexes which should have this trait.
         *
         * @param indexes Indexes which should have this trait.
         * @return The old indexes which had this trait.
         */
        set(indexes, browserEvent) {
            return this._set(indexes, [...indexes].sort(numericSort), browserEvent);
        }
        _set(indexes, sortedIndexes, browserEvent) {
            const result = this.indexes;
            const sortedResult = this.sortedIndexes;
            this.indexes = indexes;
            this.sortedIndexes = sortedIndexes;
            const toRender = disjunction(sortedResult, indexes);
            this.renderer.renderIndexes(toRender);
            this._onChange.fire({ indexes, browserEvent });
            return result;
        }
        get() {
            return this.indexes;
        }
        contains(index) {
            return (0, arrays_1.binarySearch)(this.sortedIndexes, index, numericSort) >= 0;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._onChange);
        }
    }
    __decorate([
        decorators_1.memoize
    ], Trait.prototype, "renderer", null);
    class SelectionTrait extends Trait {
        constructor(setAriaSelected) {
            super('selected');
            this.setAriaSelected = setAriaSelected;
        }
        renderIndex(index, container) {
            super.renderIndex(index, container);
            if (this.setAriaSelected) {
                if (this.contains(index)) {
                    container.setAttribute('aria-selected', 'true');
                }
                else {
                    container.setAttribute('aria-selected', 'false');
                }
            }
        }
    }
    /**
     * The TraitSpliceable is used as a util class to be able
     * to preserve traits across splice calls, given an identity
     * provider.
     */
    class TraitSpliceable {
        constructor(trait, view, identityProvider) {
            this.trait = trait;
            this.view = view;
            this.identityProvider = identityProvider;
        }
        splice(start, deleteCount, elements) {
            if (!this.identityProvider) {
                return this.trait.splice(start, deleteCount, new Array(elements.length).fill(false));
            }
            const pastElementsWithTrait = this.trait.get().map(i => this.identityProvider.getId(this.view.element(i)).toString());
            if (pastElementsWithTrait.length === 0) {
                return this.trait.splice(start, deleteCount, new Array(elements.length).fill(false));
            }
            const pastElementsWithTraitSet = new Set(pastElementsWithTrait);
            const elementsWithTrait = elements.map(e => pastElementsWithTraitSet.has(this.identityProvider.getId(e).toString()));
            this.trait.splice(start, deleteCount, elementsWithTrait);
        }
    }
    function isInputElement(e) {
        return e.tagName === 'INPUT' || e.tagName === 'TEXTAREA';
    }
    function isListElementDescendantOfClass(e, className) {
        if (e.classList.contains(className)) {
            return true;
        }
        if (e.classList.contains('monaco-list')) {
            return false;
        }
        if (!e.parentElement) {
            return false;
        }
        return isListElementDescendantOfClass(e.parentElement, className);
    }
    function isMonacoEditor(e) {
        return isListElementDescendantOfClass(e, 'monaco-editor');
    }
    function isMonacoCustomToggle(e) {
        return isListElementDescendantOfClass(e, 'monaco-custom-toggle');
    }
    function isActionItem(e) {
        return isListElementDescendantOfClass(e, 'action-item');
    }
    function isMonacoTwistie(e) {
        return isListElementDescendantOfClass(e, 'monaco-tl-twistie');
    }
    function isStickyScrollElement(e) {
        return isListElementDescendantOfClass(e, 'monaco-tree-sticky-row');
    }
    function isStickyScrollContainer(e) {
        return e.classList.contains('monaco-tree-sticky-container');
    }
    function isButton(e) {
        if ((e.tagName === 'A' && e.classList.contains('monaco-button')) ||
            (e.tagName === 'DIV' && e.classList.contains('monaco-button-dropdown'))) {
            return true;
        }
        if (e.classList.contains('monaco-list')) {
            return false;
        }
        if (!e.parentElement) {
            return false;
        }
        return isButton(e.parentElement);
    }
    class KeyboardController {
        get onKeyDown() {
            return event_2.Event.chain(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keydown')).event, $ => $.filter(e => !isInputElement(e.target))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e)));
        }
        constructor(list, view, options) {
            this.list = list;
            this.view = view;
            this.disposables = new lifecycle_1.DisposableStore();
            this.multipleSelectionDisposables = new lifecycle_1.DisposableStore();
            this.multipleSelectionSupport = options.multipleSelectionSupport;
            this.disposables.add(this.onKeyDown(e => {
                switch (e.keyCode) {
                    case 3 /* KeyCode.Enter */:
                        return this.onEnter(e);
                    case 16 /* KeyCode.UpArrow */:
                        return this.onUpArrow(e);
                    case 18 /* KeyCode.DownArrow */:
                        return this.onDownArrow(e);
                    case 11 /* KeyCode.PageUp */:
                        return this.onPageUpArrow(e);
                    case 12 /* KeyCode.PageDown */:
                        return this.onPageDownArrow(e);
                    case 9 /* KeyCode.Escape */:
                        return this.onEscape(e);
                    case 31 /* KeyCode.KeyA */:
                        if (this.multipleSelectionSupport && (platform.isMacintosh ? e.metaKey : e.ctrlKey)) {
                            this.onCtrlA(e);
                        }
                }
            }));
        }
        updateOptions(optionsUpdate) {
            if (optionsUpdate.multipleSelectionSupport !== undefined) {
                this.multipleSelectionSupport = optionsUpdate.multipleSelectionSupport;
            }
        }
        onEnter(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.setSelection(this.list.getFocus(), e.browserEvent);
        }
        onUpArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusPrevious(1, false, e.browserEvent);
            const el = this.list.getFocus()[0];
            this.list.setAnchor(el);
            this.list.reveal(el);
            this.view.domNode.focus();
        }
        onDownArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusNext(1, false, e.browserEvent);
            const el = this.list.getFocus()[0];
            this.list.setAnchor(el);
            this.list.reveal(el);
            this.view.domNode.focus();
        }
        onPageUpArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusPreviousPage(e.browserEvent);
            const el = this.list.getFocus()[0];
            this.list.setAnchor(el);
            this.list.reveal(el);
            this.view.domNode.focus();
        }
        onPageDownArrow(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.focusNextPage(e.browserEvent);
            const el = this.list.getFocus()[0];
            this.list.setAnchor(el);
            this.list.reveal(el);
            this.view.domNode.focus();
        }
        onCtrlA(e) {
            e.preventDefault();
            e.stopPropagation();
            this.list.setSelection((0, arrays_1.range)(this.list.length), e.browserEvent);
            this.list.setAnchor(undefined);
            this.view.domNode.focus();
        }
        onEscape(e) {
            if (this.list.getSelection().length) {
                e.preventDefault();
                e.stopPropagation();
                this.list.setSelection([], e.browserEvent);
                this.list.setAnchor(undefined);
                this.view.domNode.focus();
            }
        }
        dispose() {
            this.disposables.dispose();
            this.multipleSelectionDisposables.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], KeyboardController.prototype, "onKeyDown", null);
    var TypeNavigationMode;
    (function (TypeNavigationMode) {
        TypeNavigationMode[TypeNavigationMode["Automatic"] = 0] = "Automatic";
        TypeNavigationMode[TypeNavigationMode["Trigger"] = 1] = "Trigger";
    })(TypeNavigationMode || (exports.TypeNavigationMode = TypeNavigationMode = {}));
    var TypeNavigationControllerState;
    (function (TypeNavigationControllerState) {
        TypeNavigationControllerState[TypeNavigationControllerState["Idle"] = 0] = "Idle";
        TypeNavigationControllerState[TypeNavigationControllerState["Typing"] = 1] = "Typing";
    })(TypeNavigationControllerState || (TypeNavigationControllerState = {}));
    exports.DefaultKeyboardNavigationDelegate = new class {
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                return false;
            }
            return (event.keyCode >= 31 /* KeyCode.KeyA */ && event.keyCode <= 56 /* KeyCode.KeyZ */)
                || (event.keyCode >= 21 /* KeyCode.Digit0 */ && event.keyCode <= 30 /* KeyCode.Digit9 */)
                || (event.keyCode >= 98 /* KeyCode.Numpad0 */ && event.keyCode <= 107 /* KeyCode.Numpad9 */)
                || (event.keyCode >= 85 /* KeyCode.Semicolon */ && event.keyCode <= 95 /* KeyCode.Quote */);
        }
    };
    class TypeNavigationController {
        constructor(list, view, keyboardNavigationLabelProvider, keyboardNavigationEventFilter, delegate) {
            this.list = list;
            this.view = view;
            this.keyboardNavigationLabelProvider = keyboardNavigationLabelProvider;
            this.keyboardNavigationEventFilter = keyboardNavigationEventFilter;
            this.delegate = delegate;
            this.enabled = false;
            this.state = TypeNavigationControllerState.Idle;
            this.mode = TypeNavigationMode.Automatic;
            this.triggered = false;
            this.previouslyFocused = -1;
            this.enabledDisposables = new lifecycle_1.DisposableStore();
            this.disposables = new lifecycle_1.DisposableStore();
            this.updateOptions(list.options);
        }
        updateOptions(options) {
            if (options.typeNavigationEnabled ?? true) {
                this.enable();
            }
            else {
                this.disable();
            }
            this.mode = options.typeNavigationMode ?? TypeNavigationMode.Automatic;
        }
        trigger() {
            this.triggered = !this.triggered;
        }
        enable() {
            if (this.enabled) {
                return;
            }
            let typing = false;
            const onChar = event_2.Event.chain(this.enabledDisposables.add(new event_1.DomEmitter(this.view.domNode, 'keydown')).event, $ => $.filter(e => !isInputElement(e.target))
                .filter(() => this.mode === TypeNavigationMode.Automatic || this.triggered)
                .map(event => new keyboardEvent_1.StandardKeyboardEvent(event))
                .filter(e => typing || this.keyboardNavigationEventFilter(e))
                .filter(e => this.delegate.mightProducePrintableCharacter(e))
                .forEach(e => dom_1.EventHelper.stop(e, true))
                .map(event => event.browserEvent.key));
            const onClear = event_2.Event.debounce(onChar, () => null, 800, undefined, undefined, undefined, this.enabledDisposables);
            const onInput = event_2.Event.reduce(event_2.Event.any(onChar, onClear), (r, i) => i === null ? null : ((r || '') + i), undefined, this.enabledDisposables);
            onInput(this.onInput, this, this.enabledDisposables);
            onClear(this.onClear, this, this.enabledDisposables);
            onChar(() => typing = true, undefined, this.enabledDisposables);
            onClear(() => typing = false, undefined, this.enabledDisposables);
            this.enabled = true;
            this.triggered = false;
        }
        disable() {
            if (!this.enabled) {
                return;
            }
            this.enabledDisposables.clear();
            this.enabled = false;
            this.triggered = false;
        }
        onClear() {
            const focus = this.list.getFocus();
            if (focus.length > 0 && focus[0] === this.previouslyFocused) {
                // List: re-announce element on typing end since typed keys will interrupt aria label of focused element
                // Do not announce if there was a focus change at the end to prevent duplication https://github.com/microsoft/vscode/issues/95961
                const ariaLabel = this.list.options.accessibilityProvider?.getAriaLabel(this.list.element(focus[0]));
                if (typeof ariaLabel === 'string') {
                    (0, aria_1.alert)(ariaLabel);
                }
                else if (ariaLabel) {
                    (0, aria_1.alert)(ariaLabel.get());
                }
            }
            this.previouslyFocused = -1;
        }
        onInput(word) {
            if (!word) {
                this.state = TypeNavigationControllerState.Idle;
                this.triggered = false;
                return;
            }
            const focus = this.list.getFocus();
            const start = focus.length > 0 ? focus[0] : 0;
            const delta = this.state === TypeNavigationControllerState.Idle ? 1 : 0;
            this.state = TypeNavigationControllerState.Typing;
            for (let i = 0; i < this.list.length; i++) {
                const index = (start + i + delta) % this.list.length;
                const label = this.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(this.view.element(index));
                const labelStr = label && label.toString();
                if (this.list.options.typeNavigationEnabled) {
                    if (typeof labelStr !== 'undefined') {
                        // If prefix is found, focus and return early
                        if ((0, filters_1.matchesPrefix)(word, labelStr)) {
                            this.previouslyFocused = start;
                            this.list.setFocus([index]);
                            this.list.reveal(index);
                            return;
                        }
                        const fuzzy = (0, filters_1.matchesFuzzy2)(word, labelStr);
                        if (fuzzy) {
                            const fuzzyScore = fuzzy[0].end - fuzzy[0].start;
                            // ensures that when fuzzy matching, doesn't clash with prefix matching (1 input vs 1+ should be prefix and fuzzy respecitvely). Also makes sure that exact matches are prioritized.
                            if (fuzzyScore > 1 && fuzzy.length === 1) {
                                this.previouslyFocused = start;
                                this.list.setFocus([index]);
                                this.list.reveal(index);
                                return;
                            }
                        }
                    }
                }
                else if (typeof labelStr === 'undefined' || (0, filters_1.matchesPrefix)(word, labelStr)) {
                    this.previouslyFocused = start;
                    this.list.setFocus([index]);
                    this.list.reveal(index);
                    return;
                }
            }
        }
        dispose() {
            this.disable();
            this.enabledDisposables.dispose();
            this.disposables.dispose();
        }
    }
    class DOMFocusController {
        constructor(list, view) {
            this.list = list;
            this.view = view;
            this.disposables = new lifecycle_1.DisposableStore();
            const onKeyDown = event_2.Event.chain(this.disposables.add(new event_1.DomEmitter(view.domNode, 'keydown')).event, $ => $
                .filter(e => !isInputElement(e.target))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e)));
            const onTab = event_2.Event.chain(onKeyDown, $ => $.filter(e => e.keyCode === 2 /* KeyCode.Tab */ && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey));
            onTab(this.onTab, this, this.disposables);
        }
        onTab(e) {
            if (e.target !== this.view.domNode) {
                return;
            }
            const focus = this.list.getFocus();
            if (focus.length === 0) {
                return;
            }
            const focusedDomElement = this.view.domElement(focus[0]);
            if (!focusedDomElement) {
                return;
            }
            const tabIndexElement = focusedDomElement.querySelector('[tabIndex]');
            if (!tabIndexElement || !(tabIndexElement instanceof HTMLElement) || tabIndexElement.tabIndex === -1) {
                return;
            }
            const style = (0, dom_1.getWindow)(tabIndexElement).getComputedStyle(tabIndexElement);
            if (style.visibility === 'hidden' || style.display === 'none') {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            tabIndexElement.focus();
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    function isSelectionSingleChangeEvent(event) {
        return platform.isMacintosh ? event.browserEvent.metaKey : event.browserEvent.ctrlKey;
    }
    function isSelectionRangeChangeEvent(event) {
        return event.browserEvent.shiftKey;
    }
    function isMouseRightClick(event) {
        return (0, dom_1.isMouseEvent)(event) && event.button === 2;
    }
    const DefaultMultipleSelectionController = {
        isSelectionSingleChangeEvent,
        isSelectionRangeChangeEvent
    };
    class MouseController {
        constructor(list) {
            this.list = list;
            this.disposables = new lifecycle_1.DisposableStore();
            this._onPointer = new event_2.Emitter();
            this.onPointer = this._onPointer.event;
            if (list.options.multipleSelectionSupport !== false) {
                this.multipleSelectionController = this.list.options.multipleSelectionController || DefaultMultipleSelectionController;
            }
            this.mouseSupport = typeof list.options.mouseSupport === 'undefined' || !!list.options.mouseSupport;
            if (this.mouseSupport) {
                list.onMouseDown(this.onMouseDown, this, this.disposables);
                list.onContextMenu(this.onContextMenu, this, this.disposables);
                list.onMouseDblClick(this.onDoubleClick, this, this.disposables);
                list.onTouchStart(this.onMouseDown, this, this.disposables);
                this.disposables.add(touch_1.Gesture.addTarget(list.getHTMLElement()));
            }
            event_2.Event.any(list.onMouseClick, list.onMouseMiddleClick, list.onTap)(this.onViewPointer, this, this.disposables);
        }
        updateOptions(optionsUpdate) {
            if (optionsUpdate.multipleSelectionSupport !== undefined) {
                this.multipleSelectionController = undefined;
                if (optionsUpdate.multipleSelectionSupport) {
                    this.multipleSelectionController = this.list.options.multipleSelectionController || DefaultMultipleSelectionController;
                }
            }
        }
        isSelectionSingleChangeEvent(event) {
            if (!this.multipleSelectionController) {
                return false;
            }
            return this.multipleSelectionController.isSelectionSingleChangeEvent(event);
        }
        isSelectionRangeChangeEvent(event) {
            if (!this.multipleSelectionController) {
                return false;
            }
            return this.multipleSelectionController.isSelectionRangeChangeEvent(event);
        }
        isSelectionChangeEvent(event) {
            return this.isSelectionSingleChangeEvent(event) || this.isSelectionRangeChangeEvent(event);
        }
        onMouseDown(e) {
            if (isMonacoEditor(e.browserEvent.target)) {
                return;
            }
            if ((0, dom_1.getActiveElement)() !== e.browserEvent.target) {
                this.list.domFocus();
            }
        }
        onContextMenu(e) {
            if (isInputElement(e.browserEvent.target) || isMonacoEditor(e.browserEvent.target)) {
                return;
            }
            const focus = typeof e.index === 'undefined' ? [] : [e.index];
            this.list.setFocus(focus, e.browserEvent);
        }
        onViewPointer(e) {
            if (!this.mouseSupport) {
                return;
            }
            if (isInputElement(e.browserEvent.target) || isMonacoEditor(e.browserEvent.target)) {
                return;
            }
            if (e.browserEvent.isHandledByList) {
                return;
            }
            e.browserEvent.isHandledByList = true;
            const focus = e.index;
            if (typeof focus === 'undefined') {
                this.list.setFocus([], e.browserEvent);
                this.list.setSelection([], e.browserEvent);
                this.list.setAnchor(undefined);
                return;
            }
            if (this.isSelectionChangeEvent(e)) {
                return this.changeSelection(e);
            }
            this.list.setFocus([focus], e.browserEvent);
            this.list.setAnchor(focus);
            if (!isMouseRightClick(e.browserEvent)) {
                this.list.setSelection([focus], e.browserEvent);
            }
            this._onPointer.fire(e);
        }
        onDoubleClick(e) {
            if (isInputElement(e.browserEvent.target) || isMonacoEditor(e.browserEvent.target)) {
                return;
            }
            if (this.isSelectionChangeEvent(e)) {
                return;
            }
            if (e.browserEvent.isHandledByList) {
                return;
            }
            e.browserEvent.isHandledByList = true;
            const focus = this.list.getFocus();
            this.list.setSelection(focus, e.browserEvent);
        }
        changeSelection(e) {
            const focus = e.index;
            let anchor = this.list.getAnchor();
            if (this.isSelectionRangeChangeEvent(e)) {
                if (typeof anchor === 'undefined') {
                    const currentFocus = this.list.getFocus()[0];
                    anchor = currentFocus ?? focus;
                    this.list.setAnchor(anchor);
                }
                const min = Math.min(anchor, focus);
                const max = Math.max(anchor, focus);
                const rangeSelection = (0, arrays_1.range)(min, max + 1);
                const selection = this.list.getSelection();
                const contiguousRange = getContiguousRangeContaining(disjunction(selection, [anchor]), anchor);
                if (contiguousRange.length === 0) {
                    return;
                }
                const newSelection = disjunction(rangeSelection, relativeComplement(selection, contiguousRange));
                this.list.setSelection(newSelection, e.browserEvent);
                this.list.setFocus([focus], e.browserEvent);
            }
            else if (this.isSelectionSingleChangeEvent(e)) {
                const selection = this.list.getSelection();
                const newSelection = selection.filter(i => i !== focus);
                this.list.setFocus([focus]);
                this.list.setAnchor(focus);
                if (selection.length === newSelection.length) {
                    this.list.setSelection([...newSelection, focus], e.browserEvent);
                }
                else {
                    this.list.setSelection(newSelection, e.browserEvent);
                }
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.MouseController = MouseController;
    class DefaultStyleController {
        constructor(styleElement, selectorSuffix) {
            this.styleElement = styleElement;
            this.selectorSuffix = selectorSuffix;
        }
        style(styles) {
            const suffix = this.selectorSuffix && `.${this.selectorSuffix}`;
            const content = [];
            if (styles.listBackground) {
                content.push(`.monaco-list${suffix} .monaco-list-rows { background: ${styles.listBackground}; }`);
            }
            if (styles.listFocusBackground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listActiveSelectionIconForeground) {
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.selected .codicon { color: ${styles.listActiveSelectionIconForeground}; }`);
            }
            if (styles.listFocusAndSelectionBackground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.selected.focused { background-color: ${styles.listFocusAndSelectionBackground}; }
			`);
            }
            if (styles.listFocusAndSelectionForeground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.selected.focused { color: ${styles.listFocusAndSelectionForeground}; }
			`);
            }
            if (styles.listInactiveFocusForeground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused { color:  ${styles.listInactiveFocusForeground}; }`);
                content.push(`.monaco-list${suffix} .monaco-list-row.focused:hover { color:  ${styles.listInactiveFocusForeground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionIconForeground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused .codicon { color:  ${styles.listInactiveSelectionIconForeground}; }`);
            }
            if (styles.listInactiveFocusBackground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused { background-color:  ${styles.listInactiveFocusBackground}; }`);
                content.push(`.monaco-list${suffix} .monaco-list-row.focused:hover { background-color:  ${styles.listInactiveFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionBackground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { background-color:  ${styles.listInactiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix} .monaco-list-row.selected:hover { background-color:  ${styles.listInactiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionForeground) {
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { color: ${styles.listInactiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list${suffix}:not(.drop-target):not(.dragging) .monaco-list-row:hover:not(.selected):not(.focused) { background-color: ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list${suffix}:not(.drop-target):not(.dragging) .monaco-list-row:hover:not(.selected):not(.focused) { color:  ${styles.listHoverForeground}; }`);
            }
            /**
             * Outlines
             */
            const focusAndSelectionOutline = (0, dom_1.asCssValueWithDefault)(styles.listFocusAndSelectionOutline, (0, dom_1.asCssValueWithDefault)(styles.listSelectionOutline, styles.listFocusOutline ?? ''));
            if (focusAndSelectionOutline) { // default: listFocusOutline
                content.push(`.monaco-list${suffix}:focus .monaco-list-row.focused.selected { outline: 1px solid ${focusAndSelectionOutline}; outline-offset: -1px;}`);
            }
            if (styles.listFocusOutline) { // default: set
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
				.monaco-workbench.context-menu-visible .monaco-list${suffix}.last-focused .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
			`);
            }
            const inactiveFocusAndSelectionOutline = (0, dom_1.asCssValueWithDefault)(styles.listSelectionOutline, styles.listInactiveFocusOutline ?? '');
            if (inactiveFocusAndSelectionOutline) {
                content.push(`.monaco-list${suffix} .monaco-list-row.focused.selected { outline: 1px dotted ${inactiveFocusAndSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listSelectionOutline) { // default: activeContrastBorder
                content.push(`.monaco-list${suffix} .monaco-list-row.selected { outline: 1px dotted ${styles.listSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listInactiveFocusOutline) { // default: null
                content.push(`.monaco-list${suffix} .monaco-list-row.focused { outline: 1px dotted ${styles.listInactiveFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) { // default: activeContrastBorder
                content.push(`.monaco-list${suffix} .monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            if (styles.listDropOverBackground) {
                content.push(`
				.monaco-list${suffix}.drop-target,
				.monaco-list${suffix} .monaco-list-rows.drop-target,
				.monaco-list${suffix} .monaco-list-row.drop-target { background-color: ${styles.listDropOverBackground} !important; color: inherit !important; }
			`);
            }
            if (styles.listDropBetweenBackground) {
                content.push(`
			.monaco-list${suffix} .monaco-list-rows.drop-target-before .monaco-list-row:first-child::before,
			.monaco-list${suffix} .monaco-list-row.drop-target-before::before {
				content: ""; position: absolute; top: 0px; left: 0px; width: 100%; height: 1px;
				background-color: ${styles.listDropBetweenBackground};
			}`);
                content.push(`
			.monaco-list${suffix} .monaco-list-rows.drop-target-after .monaco-list-row:last-child::after,
			.monaco-list${suffix} .monaco-list-row.drop-target-after::after {
				content: ""; position: absolute; bottom: 0px; left: 0px; width: 100%; height: 1px;
				background-color: ${styles.listDropBetweenBackground};
			}`);
            }
            if (styles.tableColumnsBorder) {
                content.push(`
				.monaco-table > .monaco-split-view2,
				.monaco-table > .monaco-split-view2 .monaco-sash.vertical::before,
				.monaco-workbench:not(.reduce-motion) .monaco-table:hover > .monaco-split-view2,
				.monaco-workbench:not(.reduce-motion) .monaco-table:hover > .monaco-split-view2 .monaco-sash.vertical::before {
					border-color: ${styles.tableColumnsBorder};
				}

				.monaco-workbench:not(.reduce-motion) .monaco-table > .monaco-split-view2,
				.monaco-workbench:not(.reduce-motion) .monaco-table > .monaco-split-view2 .monaco-sash.vertical::before {
					border-color: transparent;
				}
			`);
            }
            if (styles.tableOddRowsBackgroundColor) {
                content.push(`
				.monaco-table .monaco-list-row[data-parity=odd]:not(.focused):not(.selected):not(:hover) .monaco-table-tr,
				.monaco-table .monaco-list:not(:focus) .monaco-list-row[data-parity=odd].focused:not(.selected):not(:hover) .monaco-table-tr,
				.monaco-table .monaco-list:not(.focused) .monaco-list-row[data-parity=odd].focused:not(.selected):not(:hover) .monaco-table-tr {
					background-color: ${styles.tableOddRowsBackgroundColor};
				}
			`);
            }
            this.styleElement.textContent = content.join('\n');
        }
    }
    exports.DefaultStyleController = DefaultStyleController;
    exports.unthemedListStyles = {
        listFocusBackground: '#7FB0D0',
        listActiveSelectionBackground: '#0E639C',
        listActiveSelectionForeground: '#FFFFFF',
        listActiveSelectionIconForeground: '#FFFFFF',
        listFocusAndSelectionOutline: '#90C2F9',
        listFocusAndSelectionBackground: '#094771',
        listFocusAndSelectionForeground: '#FFFFFF',
        listInactiveSelectionBackground: '#3F3F46',
        listInactiveSelectionIconForeground: '#FFFFFF',
        listHoverBackground: '#2A2D2E',
        listDropOverBackground: '#383B3D',
        listDropBetweenBackground: '#EEEEEE',
        treeIndentGuidesStroke: '#a9a9a9',
        treeInactiveIndentGuidesStroke: color_1.Color.fromHex('#a9a9a9').transparent(0.4).toString(),
        tableColumnsBorder: color_1.Color.fromHex('#cccccc').transparent(0.2).toString(),
        tableOddRowsBackgroundColor: color_1.Color.fromHex('#cccccc').transparent(0.04).toString(),
        listBackground: undefined,
        listFocusForeground: undefined,
        listInactiveSelectionForeground: undefined,
        listInactiveFocusForeground: undefined,
        listInactiveFocusBackground: undefined,
        listHoverForeground: undefined,
        listFocusOutline: undefined,
        listInactiveFocusOutline: undefined,
        listSelectionOutline: undefined,
        listHoverOutline: undefined,
        treeStickyScrollBackground: undefined,
        treeStickyScrollBorder: undefined,
        treeStickyScrollShadow: undefined
    };
    const DefaultOptions = {
        keyboardSupport: true,
        mouseSupport: true,
        multipleSelectionSupport: true,
        dnd: {
            getDragURI() { return null; },
            onDragStart() { },
            onDragOver() { return false; },
            drop() { },
            dispose() { }
        }
    };
    // TODO@Joao: move these utils into a SortedArray class
    function getContiguousRangeContaining(range, value) {
        const index = range.indexOf(value);
        if (index === -1) {
            return [];
        }
        const result = [];
        let i = index - 1;
        while (i >= 0 && range[i] === value - (index - i)) {
            result.push(range[i--]);
        }
        result.reverse();
        i = index;
        while (i < range.length && range[i] === value + (i - index)) {
            result.push(range[i++]);
        }
        return result;
    }
    /**
     * Given two sorted collections of numbers, returns the intersection
     * between them (OR).
     */
    function disjunction(one, other) {
        const result = [];
        let i = 0, j = 0;
        while (i < one.length || j < other.length) {
            if (i >= one.length) {
                result.push(other[j++]);
            }
            else if (j >= other.length) {
                result.push(one[i++]);
            }
            else if (one[i] === other[j]) {
                result.push(one[i]);
                i++;
                j++;
                continue;
            }
            else if (one[i] < other[j]) {
                result.push(one[i++]);
            }
            else {
                result.push(other[j++]);
            }
        }
        return result;
    }
    /**
     * Given two sorted collections of numbers, returns the relative
     * complement between them (XOR).
     */
    function relativeComplement(one, other) {
        const result = [];
        let i = 0, j = 0;
        while (i < one.length || j < other.length) {
            if (i >= one.length) {
                result.push(other[j++]);
            }
            else if (j >= other.length) {
                result.push(one[i++]);
            }
            else if (one[i] === other[j]) {
                i++;
                j++;
                continue;
            }
            else if (one[i] < other[j]) {
                result.push(one[i++]);
            }
            else {
                j++;
            }
        }
        return result;
    }
    const numericSort = (a, b) => a - b;
    class PipelineRenderer {
        constructor(_templateId, renderers) {
            this._templateId = _templateId;
            this.renderers = renderers;
        }
        get templateId() {
            return this._templateId;
        }
        renderTemplate(container) {
            return this.renderers.map(r => r.renderTemplate(container));
        }
        renderElement(element, index, templateData, height) {
            let i = 0;
            for (const renderer of this.renderers) {
                renderer.renderElement(element, index, templateData[i++], height);
            }
        }
        disposeElement(element, index, templateData, height) {
            let i = 0;
            for (const renderer of this.renderers) {
                renderer.disposeElement?.(element, index, templateData[i], height);
                i += 1;
            }
        }
        disposeTemplate(templateData) {
            let i = 0;
            for (const renderer of this.renderers) {
                renderer.disposeTemplate(templateData[i++]);
            }
        }
    }
    class AccessibiltyRenderer {
        constructor(accessibilityProvider) {
            this.accessibilityProvider = accessibilityProvider;
            this.templateId = 'a18n';
        }
        renderTemplate(container) {
            return { container, disposables: new lifecycle_1.DisposableStore() };
        }
        renderElement(element, index, data) {
            const ariaLabel = this.accessibilityProvider.getAriaLabel(element);
            const observable = (ariaLabel && typeof ariaLabel !== 'string') ? ariaLabel : (0, observable_1.constObservable)(ariaLabel);
            data.disposables.add((0, observable_1.autorun)(reader => {
                this.setAriaLabel(reader.readObservable(observable), data.container);
            }));
            const ariaLevel = this.accessibilityProvider.getAriaLevel && this.accessibilityProvider.getAriaLevel(element);
            if (typeof ariaLevel === 'number') {
                data.container.setAttribute('aria-level', `${ariaLevel}`);
            }
            else {
                data.container.removeAttribute('aria-level');
            }
        }
        setAriaLabel(ariaLabel, element) {
            if (ariaLabel) {
                element.setAttribute('aria-label', ariaLabel);
            }
            else {
                element.removeAttribute('aria-label');
            }
        }
        disposeElement(element, index, templateData, height) {
            templateData.disposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    }
    class ListViewDragAndDrop {
        constructor(list, dnd) {
            this.list = list;
            this.dnd = dnd;
        }
        getDragElements(element) {
            const selection = this.list.getSelectedElements();
            const elements = selection.indexOf(element) > -1 ? selection : [element];
            return elements;
        }
        getDragURI(element) {
            return this.dnd.getDragURI(element);
        }
        getDragLabel(elements, originalEvent) {
            if (this.dnd.getDragLabel) {
                return this.dnd.getDragLabel(elements, originalEvent);
            }
            return undefined;
        }
        onDragStart(data, originalEvent) {
            this.dnd.onDragStart?.(data, originalEvent);
        }
        onDragOver(data, targetElement, targetIndex, targetSector, originalEvent) {
            return this.dnd.onDragOver(data, targetElement, targetIndex, targetSector, originalEvent);
        }
        onDragLeave(data, targetElement, targetIndex, originalEvent) {
            this.dnd.onDragLeave?.(data, targetElement, targetIndex, originalEvent);
        }
        onDragEnd(originalEvent) {
            this.dnd.onDragEnd?.(originalEvent);
        }
        drop(data, targetElement, targetIndex, targetSector, originalEvent) {
            this.dnd.drop(data, targetElement, targetIndex, targetSector, originalEvent);
        }
        dispose() {
            this.dnd.dispose();
        }
    }
    /**
     * The {@link List} is a virtual scrolling widget, built on top of the {@link ListView}
     * widget.
     *
     * Features:
     * - Customizable keyboard and mouse support
     * - Element traits: focus, selection, achor
     * - Accessibility support
     * - Touch support
     * - Performant template-based rendering
     * - Horizontal scrolling
     * - Variable element height support
     * - Dynamic element height support
     * - Drag-and-drop support
     */
    class List {
        get onDidChangeFocus() {
            return event_2.Event.map(this.eventBufferer.wrapEvent(this.focus.onChange), e => this.toListEvent(e), this.disposables);
        }
        get onDidChangeSelection() {
            return event_2.Event.map(this.eventBufferer.wrapEvent(this.selection.onChange), e => this.toListEvent(e), this.disposables);
        }
        get domId() { return this.view.domId; }
        get onDidScroll() { return this.view.onDidScroll; }
        get onMouseClick() { return this.view.onMouseClick; }
        get onMouseDblClick() { return this.view.onMouseDblClick; }
        get onMouseMiddleClick() { return this.view.onMouseMiddleClick; }
        get onPointer() { return this.mouseController.onPointer; }
        get onMouseUp() { return this.view.onMouseUp; }
        get onMouseDown() { return this.view.onMouseDown; }
        get onMouseOver() { return this.view.onMouseOver; }
        get onMouseMove() { return this.view.onMouseMove; }
        get onMouseOut() { return this.view.onMouseOut; }
        get onTouchStart() { return this.view.onTouchStart; }
        get onTap() { return this.view.onTap; }
        /**
         * Possible context menu trigger events:
         * - ContextMenu key
         * - Shift F10
         * - Ctrl Option Shift M (macOS with VoiceOver)
         * - Mouse right click
         */
        get onContextMenu() {
            let didJustPressContextMenuKey = false;
            const fromKeyDown = event_2.Event.chain(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keydown')).event, $ => $.map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(e => didJustPressContextMenuKey = e.keyCode === 58 /* KeyCode.ContextMenu */ || (e.shiftKey && e.keyCode === 68 /* KeyCode.F10 */))
                .map(e => dom_1.EventHelper.stop(e, true))
                .filter(() => false));
            const fromKeyUp = event_2.Event.chain(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keyup')).event, $ => $.forEach(() => didJustPressContextMenuKey = false)
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(e => e.keyCode === 58 /* KeyCode.ContextMenu */ || (e.shiftKey && e.keyCode === 68 /* KeyCode.F10 */))
                .map(e => dom_1.EventHelper.stop(e, true))
                .map(({ browserEvent }) => {
                const focus = this.getFocus();
                const index = focus.length ? focus[0] : undefined;
                const element = typeof index !== 'undefined' ? this.view.element(index) : undefined;
                const anchor = typeof index !== 'undefined' ? this.view.domElement(index) : this.view.domNode;
                return { index, element, anchor, browserEvent };
            }));
            const fromMouse = event_2.Event.chain(this.view.onContextMenu, $ => $.filter(_ => !didJustPressContextMenuKey)
                .map(({ element, index, browserEvent }) => ({ element, index, anchor: new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.view.domNode), browserEvent), browserEvent })));
            return event_2.Event.any(fromKeyDown, fromKeyUp, fromMouse);
        }
        get onKeyDown() { return this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keydown')).event; }
        get onKeyUp() { return this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keyup')).event; }
        get onKeyPress() { return this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'keypress')).event; }
        get onDidFocus() { return event_2.Event.signal(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'focus', true)).event); }
        get onDidBlur() { return event_2.Event.signal(this.disposables.add(new event_1.DomEmitter(this.view.domNode, 'blur', true)).event); }
        constructor(user, container, virtualDelegate, renderers, _options = DefaultOptions) {
            this.user = user;
            this._options = _options;
            this.focus = new Trait('focused');
            this.anchor = new Trait('anchor');
            this.eventBufferer = new event_2.EventBufferer();
            this._ariaLabel = '';
            this.disposables = new lifecycle_1.DisposableStore();
            this._onDidDispose = new event_2.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            const role = this._options.accessibilityProvider && this._options.accessibilityProvider.getWidgetRole ? this._options.accessibilityProvider?.getWidgetRole() : 'list';
            this.selection = new SelectionTrait(role !== 'listbox');
            const baseRenderers = [this.focus.renderer, this.selection.renderer];
            this.accessibilityProvider = _options.accessibilityProvider;
            if (this.accessibilityProvider) {
                baseRenderers.push(new AccessibiltyRenderer(this.accessibilityProvider));
                this.accessibilityProvider.onDidChangeActiveDescendant?.(this.onDidChangeActiveDescendant, this, this.disposables);
            }
            renderers = renderers.map(r => new PipelineRenderer(r.templateId, [...baseRenderers, r]));
            const viewOptions = {
                ..._options,
                dnd: _options.dnd && new ListViewDragAndDrop(this, _options.dnd)
            };
            this.view = this.createListView(container, virtualDelegate, renderers, viewOptions);
            this.view.domNode.setAttribute('role', role);
            if (_options.styleController) {
                this.styleController = _options.styleController(this.view.domId);
            }
            else {
                const styleElement = (0, dom_1.createStyleSheet)(this.view.domNode);
                this.styleController = new DefaultStyleController(styleElement, this.view.domId);
            }
            this.spliceable = new splice_1.CombinedSpliceable([
                new TraitSpliceable(this.focus, this.view, _options.identityProvider),
                new TraitSpliceable(this.selection, this.view, _options.identityProvider),
                new TraitSpliceable(this.anchor, this.view, _options.identityProvider),
                this.view
            ]);
            this.disposables.add(this.focus);
            this.disposables.add(this.selection);
            this.disposables.add(this.anchor);
            this.disposables.add(this.view);
            this.disposables.add(this._onDidDispose);
            this.disposables.add(new DOMFocusController(this, this.view));
            if (typeof _options.keyboardSupport !== 'boolean' || _options.keyboardSupport) {
                this.keyboardController = new KeyboardController(this, this.view, _options);
                this.disposables.add(this.keyboardController);
            }
            if (_options.keyboardNavigationLabelProvider) {
                const delegate = _options.keyboardNavigationDelegate || exports.DefaultKeyboardNavigationDelegate;
                this.typeNavigationController = new TypeNavigationController(this, this.view, _options.keyboardNavigationLabelProvider, _options.keyboardNavigationEventFilter ?? (() => true), delegate);
                this.disposables.add(this.typeNavigationController);
            }
            this.mouseController = this.createMouseController(_options);
            this.disposables.add(this.mouseController);
            this.onDidChangeFocus(this._onFocusChange, this, this.disposables);
            this.onDidChangeSelection(this._onSelectionChange, this, this.disposables);
            if (this.accessibilityProvider) {
                this.ariaLabel = this.accessibilityProvider.getWidgetAriaLabel();
            }
            if (this._options.multipleSelectionSupport !== false) {
                this.view.domNode.setAttribute('aria-multiselectable', 'true');
            }
        }
        createListView(container, virtualDelegate, renderers, viewOptions) {
            return new listView_1.ListView(container, virtualDelegate, renderers, viewOptions);
        }
        createMouseController(options) {
            return new MouseController(this);
        }
        updateOptions(optionsUpdate = {}) {
            this._options = { ...this._options, ...optionsUpdate };
            this.typeNavigationController?.updateOptions(this._options);
            if (this._options.multipleSelectionController !== undefined) {
                if (this._options.multipleSelectionSupport) {
                    this.view.domNode.setAttribute('aria-multiselectable', 'true');
                }
                else {
                    this.view.domNode.removeAttribute('aria-multiselectable');
                }
            }
            this.mouseController.updateOptions(optionsUpdate);
            this.keyboardController?.updateOptions(optionsUpdate);
            this.view.updateOptions(optionsUpdate);
        }
        get options() {
            return this._options;
        }
        splice(start, deleteCount, elements = []) {
            if (start < 0 || start > this.view.length) {
                throw new list_1.ListError(this.user, `Invalid start index: ${start}`);
            }
            if (deleteCount < 0) {
                throw new list_1.ListError(this.user, `Invalid delete count: ${deleteCount}`);
            }
            if (deleteCount === 0 && elements.length === 0) {
                return;
            }
            this.eventBufferer.bufferEvents(() => this.spliceable.splice(start, deleteCount, elements));
        }
        updateWidth(index) {
            this.view.updateWidth(index);
        }
        updateElementHeight(index, size) {
            this.view.updateElementHeight(index, size, null);
        }
        rerender() {
            this.view.rerender();
        }
        element(index) {
            return this.view.element(index);
        }
        indexOf(element) {
            return this.view.indexOf(element);
        }
        indexAt(position) {
            return this.view.indexAt(position);
        }
        get length() {
            return this.view.length;
        }
        get contentHeight() {
            return this.view.contentHeight;
        }
        get contentWidth() {
            return this.view.contentWidth;
        }
        get onDidChangeContentHeight() {
            return this.view.onDidChangeContentHeight;
        }
        get onDidChangeContentWidth() {
            return this.view.onDidChangeContentWidth;
        }
        get scrollTop() {
            return this.view.getScrollTop();
        }
        set scrollTop(scrollTop) {
            this.view.setScrollTop(scrollTop);
        }
        get scrollLeft() {
            return this.view.getScrollLeft();
        }
        set scrollLeft(scrollLeft) {
            this.view.setScrollLeft(scrollLeft);
        }
        get scrollHeight() {
            return this.view.scrollHeight;
        }
        get renderHeight() {
            return this.view.renderHeight;
        }
        get firstVisibleIndex() {
            return this.view.firstVisibleIndex;
        }
        get firstMostlyVisibleIndex() {
            return this.view.firstMostlyVisibleIndex;
        }
        get lastVisibleIndex() {
            return this.view.lastVisibleIndex;
        }
        get ariaLabel() {
            return this._ariaLabel;
        }
        set ariaLabel(value) {
            this._ariaLabel = value;
            this.view.domNode.setAttribute('aria-label', value);
        }
        domFocus() {
            this.view.domNode.focus({ preventScroll: true });
        }
        layout(height, width) {
            this.view.layout(height, width);
        }
        triggerTypeNavigation() {
            this.typeNavigationController?.trigger();
        }
        setSelection(indexes, browserEvent) {
            for (const index of indexes) {
                if (index < 0 || index >= this.length) {
                    throw new list_1.ListError(this.user, `Invalid index ${index}`);
                }
            }
            this.selection.set(indexes, browserEvent);
        }
        getSelection() {
            return this.selection.get();
        }
        getSelectedElements() {
            return this.getSelection().map(i => this.view.element(i));
        }
        setAnchor(index) {
            if (typeof index === 'undefined') {
                this.anchor.set([]);
                return;
            }
            if (index < 0 || index >= this.length) {
                throw new list_1.ListError(this.user, `Invalid index ${index}`);
            }
            this.anchor.set([index]);
        }
        getAnchor() {
            return (0, arrays_1.firstOrDefault)(this.anchor.get(), undefined);
        }
        getAnchorElement() {
            const anchor = this.getAnchor();
            return typeof anchor === 'undefined' ? undefined : this.element(anchor);
        }
        setFocus(indexes, browserEvent) {
            for (const index of indexes) {
                if (index < 0 || index >= this.length) {
                    throw new list_1.ListError(this.user, `Invalid index ${index}`);
                }
            }
            this.focus.set(indexes, browserEvent);
        }
        focusNext(n = 1, loop = false, browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const focus = this.focus.get();
            const index = this.findNextIndex(focus.length > 0 ? focus[0] + n : 0, loop, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        focusPrevious(n = 1, loop = false, browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const focus = this.focus.get();
            const index = this.findPreviousIndex(focus.length > 0 ? focus[0] - n : 0, loop, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        async focusNextPage(browserEvent, filter) {
            let lastPageIndex = this.view.indexAt(this.view.getScrollTop() + this.view.renderHeight);
            lastPageIndex = lastPageIndex === 0 ? 0 : lastPageIndex - 1;
            const currentlyFocusedElementIndex = this.getFocus()[0];
            if (currentlyFocusedElementIndex !== lastPageIndex && (currentlyFocusedElementIndex === undefined || lastPageIndex > currentlyFocusedElementIndex)) {
                const lastGoodPageIndex = this.findPreviousIndex(lastPageIndex, false, filter);
                if (lastGoodPageIndex > -1 && currentlyFocusedElementIndex !== lastGoodPageIndex) {
                    this.setFocus([lastGoodPageIndex], browserEvent);
                }
                else {
                    this.setFocus([lastPageIndex], browserEvent);
                }
            }
            else {
                const previousScrollTop = this.view.getScrollTop();
                let nextpageScrollTop = previousScrollTop + this.view.renderHeight;
                if (lastPageIndex > currentlyFocusedElementIndex) {
                    // scroll last page element to the top only if the last page element is below the focused element
                    nextpageScrollTop -= this.view.elementHeight(lastPageIndex);
                }
                this.view.setScrollTop(nextpageScrollTop);
                if (this.view.getScrollTop() !== previousScrollTop) {
                    this.setFocus([]);
                    // Let the scroll event listener run
                    await (0, async_1.timeout)(0);
                    await this.focusNextPage(browserEvent, filter);
                }
            }
        }
        async focusPreviousPage(browserEvent, filter, getPaddingTop = () => 0) {
            let firstPageIndex;
            const paddingTop = getPaddingTop();
            const scrollTop = this.view.getScrollTop() + paddingTop;
            if (scrollTop === 0) {
                firstPageIndex = this.view.indexAt(scrollTop);
            }
            else {
                firstPageIndex = this.view.indexAfter(scrollTop - 1);
            }
            const currentlyFocusedElementIndex = this.getFocus()[0];
            if (currentlyFocusedElementIndex !== firstPageIndex && (currentlyFocusedElementIndex === undefined || currentlyFocusedElementIndex >= firstPageIndex)) {
                const firstGoodPageIndex = this.findNextIndex(firstPageIndex, false, filter);
                if (firstGoodPageIndex > -1 && currentlyFocusedElementIndex !== firstGoodPageIndex) {
                    this.setFocus([firstGoodPageIndex], browserEvent);
                }
                else {
                    this.setFocus([firstPageIndex], browserEvent);
                }
            }
            else {
                const previousScrollTop = scrollTop;
                this.view.setScrollTop(scrollTop - this.view.renderHeight - paddingTop);
                if (this.view.getScrollTop() + getPaddingTop() !== previousScrollTop) {
                    this.setFocus([]);
                    // Let the scroll event listener run
                    await (0, async_1.timeout)(0);
                    await this.focusPreviousPage(browserEvent, filter, getPaddingTop);
                }
            }
        }
        focusLast(browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const index = this.findPreviousIndex(this.length - 1, false, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        focusFirst(browserEvent, filter) {
            this.focusNth(0, browserEvent, filter);
        }
        focusNth(n, browserEvent, filter) {
            if (this.length === 0) {
                return;
            }
            const index = this.findNextIndex(n, false, filter);
            if (index > -1) {
                this.setFocus([index], browserEvent);
            }
        }
        findNextIndex(index, loop = false, filter) {
            for (let i = 0; i < this.length; i++) {
                if (index >= this.length && !loop) {
                    return -1;
                }
                index = index % this.length;
                if (!filter || filter(this.element(index))) {
                    return index;
                }
                index++;
            }
            return -1;
        }
        findPreviousIndex(index, loop = false, filter) {
            for (let i = 0; i < this.length; i++) {
                if (index < 0 && !loop) {
                    return -1;
                }
                index = (this.length + (index % this.length)) % this.length;
                if (!filter || filter(this.element(index))) {
                    return index;
                }
                index--;
            }
            return -1;
        }
        getFocus() {
            return this.focus.get();
        }
        getFocusedElements() {
            return this.getFocus().map(i => this.view.element(i));
        }
        reveal(index, relativeTop, paddingTop = 0) {
            if (index < 0 || index >= this.length) {
                throw new list_1.ListError(this.user, `Invalid index ${index}`);
            }
            const scrollTop = this.view.getScrollTop();
            const elementTop = this.view.elementTop(index);
            const elementHeight = this.view.elementHeight(index);
            if ((0, types_1.isNumber)(relativeTop)) {
                // y = mx + b
                const m = elementHeight - this.view.renderHeight + paddingTop;
                this.view.setScrollTop(m * (0, numbers_1.clamp)(relativeTop, 0, 1) + elementTop - paddingTop);
            }
            else {
                const viewItemBottom = elementTop + elementHeight;
                const scrollBottom = scrollTop + this.view.renderHeight;
                if (elementTop < scrollTop + paddingTop && viewItemBottom >= scrollBottom) {
                    // The element is already overflowing the viewport, no-op
                }
                else if (elementTop < scrollTop + paddingTop || (viewItemBottom >= scrollBottom && elementHeight >= this.view.renderHeight)) {
                    this.view.setScrollTop(elementTop - paddingTop);
                }
                else if (viewItemBottom >= scrollBottom) {
                    this.view.setScrollTop(viewItemBottom - this.view.renderHeight);
                }
            }
        }
        /**
         * Returns the relative position of an element rendered in the list.
         * Returns `null` if the element isn't *entirely* in the visible viewport.
         */
        getRelativeTop(index, paddingTop = 0) {
            if (index < 0 || index >= this.length) {
                throw new list_1.ListError(this.user, `Invalid index ${index}`);
            }
            const scrollTop = this.view.getScrollTop();
            const elementTop = this.view.elementTop(index);
            const elementHeight = this.view.elementHeight(index);
            if (elementTop < scrollTop + paddingTop || elementTop + elementHeight > scrollTop + this.view.renderHeight) {
                return null;
            }
            // y = mx + b
            const m = elementHeight - this.view.renderHeight + paddingTop;
            return Math.abs((scrollTop + paddingTop - elementTop) / m);
        }
        isDOMFocused() {
            return (0, dom_1.isActiveElement)(this.view.domNode);
        }
        getHTMLElement() {
            return this.view.domNode;
        }
        getScrollableElement() {
            return this.view.scrollableElementDomNode;
        }
        getElementID(index) {
            return this.view.getElementDomId(index);
        }
        getElementTop(index) {
            return this.view.elementTop(index);
        }
        style(styles) {
            this.styleController.style(styles);
        }
        toListEvent({ indexes, browserEvent }) {
            return { indexes, elements: indexes.map(i => this.view.element(i)), browserEvent };
        }
        _onFocusChange() {
            const focus = this.focus.get();
            this.view.domNode.classList.toggle('element-focused', focus.length > 0);
            this.onDidChangeActiveDescendant();
        }
        onDidChangeActiveDescendant() {
            const focus = this.focus.get();
            if (focus.length > 0) {
                let id;
                if (this.accessibilityProvider?.getActiveDescendantId) {
                    id = this.accessibilityProvider.getActiveDescendantId(this.view.element(focus[0]));
                }
                this.view.domNode.setAttribute('aria-activedescendant', id || this.view.getElementDomId(focus[0]));
            }
            else {
                this.view.domNode.removeAttribute('aria-activedescendant');
            }
        }
        _onSelectionChange() {
            const selection = this.selection.get();
            this.view.domNode.classList.toggle('selection-none', selection.length === 0);
            this.view.domNode.classList.toggle('selection-single', selection.length === 1);
            this.view.domNode.classList.toggle('selection-multiple', selection.length > 1);
        }
        dispose() {
            this._onDidDispose.fire();
            this.disposables.dispose();
            this._onDidDispose.dispose();
        }
    }
    exports.List = List;
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onDidChangeFocus", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onDidChangeSelection", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onContextMenu", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onKeyDown", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onKeyUp", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onKeyPress", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onDidFocus", null);
    __decorate([
        decorators_1.memoize
    ], List.prototype, "onDidBlur", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9saXN0L2xpc3RXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBcVBoRyx3Q0FFQztJQWtCRCx3Q0FFQztJQUVELG9EQUVDO0lBRUQsb0NBRUM7SUFFRCwwQ0FFQztJQUVELHNEQUVDO0lBRUQsMERBRUM7SUFFRCw0QkFlQztJQTZWRCxvRUFFQztJQUVELGtFQUVDO0lBcm1CRCxNQUFNLGFBQWE7UUFHbEIsWUFBb0IsS0FBZTtZQUFmLFVBQUssR0FBTCxLQUFLLENBQVU7WUFGM0IscUJBQWdCLEdBQXlCLEVBQUUsQ0FBQztRQUViLENBQUM7UUFFeEMsSUFBSSxVQUFVO1lBQ2IsT0FBTyxZQUFZLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUVELGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQVUsRUFBRSxLQUFhLEVBQUUsWUFBZ0M7WUFDeEUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksS0FBSyxZQUFZLENBQUMsQ0FBQztZQUVyRyxJQUFJLG9CQUFvQixJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMvQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2xDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLENB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