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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/base/browser/keyboardEvent", "vs/base/common/platform", "vs/base/common/decorators", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/theme", "vs/base/common/uri", "vs/platform/quickinput/browser/quickInputUtils", "vs/base/common/lazy", "vs/base/common/iconLabels", "vs/base/common/comparers", "vs/base/common/strings", "vs/base/browser/ui/tree/abstractTree", "vs/base/common/async", "vs/base/common/errors"], function (require, exports, dom, event_1, nls_1, instantiation_1, listService_1, themeService_1, lifecycle_1, keyboardEvent_1, platform_1, decorators_1, iconLabel_1, keybindingLabel_1, actionbar_1, theme_1, uri_1, quickInputUtils_1, lazy_1, iconLabels_1, comparers_1, strings_1, abstractTree_1, async_1, errors_1) {
    "use strict";
    var QuickPickItemElementRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputTree = exports.QuickInputListFocus = void 0;
    const $ = dom.$;
    var QuickInputListFocus;
    (function (QuickInputListFocus) {
        QuickInputListFocus[QuickInputListFocus["First"] = 1] = "First";
        QuickInputListFocus[QuickInputListFocus["Second"] = 2] = "Second";
        QuickInputListFocus[QuickInputListFocus["Last"] = 3] = "Last";
        QuickInputListFocus[QuickInputListFocus["Next"] = 4] = "Next";
        QuickInputListFocus[QuickInputListFocus["Previous"] = 5] = "Previous";
        QuickInputListFocus[QuickInputListFocus["NextPage"] = 6] = "NextPage";
        QuickInputListFocus[QuickInputListFocus["PreviousPage"] = 7] = "PreviousPage";
        QuickInputListFocus[QuickInputListFocus["NextSeparator"] = 8] = "NextSeparator";
        QuickInputListFocus[QuickInputListFocus["PreviousSeparator"] = 9] = "PreviousSeparator";
    })(QuickInputListFocus || (exports.QuickInputListFocus = QuickInputListFocus = {}));
    class BaseQuickPickItemElement {
        constructor(index, hasCheckbox, mainItem) {
            this.index = index;
            this.hasCheckbox = hasCheckbox;
            this._hidden = false;
            this._init = new lazy_1.Lazy(() => {
                const saneLabel = mainItem.label ?? '';
                const saneSortLabel = (0, iconLabels_1.parseLabelWithIcons)(saneLabel).text.trim();
                const saneAriaLabel = mainItem.ariaLabel || [saneLabel, this.saneDescription, this.saneDetail]
                    .map(s => (0, iconLabels_1.getCodiconAriaLabel)(s))
                    .filter(s => !!s)
                    .join(', ');
                return {
                    saneLabel,
                    saneSortLabel,
                    saneAriaLabel
                };
            });
            this._saneDescription = mainItem.description;
            this._saneTooltip = mainItem.tooltip;
        }
        // #region Lazy Getters
        get saneLabel() {
            return this._init.value.saneLabel;
        }
        get saneSortLabel() {
            return this._init.value.saneSortLabel;
        }
        get saneAriaLabel() {
            return this._init.value.saneAriaLabel;
        }
        get element() {
            return this._element;
        }
        set element(value) {
            this._element = value;
        }
        get hidden() {
            return this._hidden;
        }
        set hidden(value) {
            this._hidden = value;
        }
        get saneDescription() {
            return this._saneDescription;
        }
        set saneDescription(value) {
            this._saneDescription = value;
        }
        get saneDetail() {
            return this._saneDetail;
        }
        set saneDetail(value) {
            this._saneDetail = value;
        }
        get saneTooltip() {
            return this._saneTooltip;
        }
        set saneTooltip(value) {
            this._saneTooltip = value;
        }
        get labelHighlights() {
            return this._labelHighlights;
        }
        set labelHighlights(value) {
            this._labelHighlights = value;
        }
        get descriptionHighlights() {
            return this._descriptionHighlights;
        }
        set descriptionHighlights(value) {
            this._descriptionHighlights = value;
        }
        get detailHighlights() {
            return this._detailHighlights;
        }
        set detailHighlights(value) {
            this._detailHighlights = value;
        }
    }
    class QuickPickItemElement extends BaseQuickPickItemElement {
        constructor(index, hasCheckbox, fireButtonTriggered, _onChecked, item, _separator) {
            super(index, hasCheckbox, item);
            this.fireButtonTriggered = fireButtonTriggered;
            this._onChecked = _onChecked;
            this.item = item;
            this._separator = _separator;
            this._checked = false;
            this.onChecked = hasCheckbox
                ? event_1.Event.map(event_1.Event.filter(this._onChecked.event, e => e.element === this), e => e.checked)
                : event_1.Event.None;
            this._saneDetail = item.detail;
            this._labelHighlights = item.highlights?.label;
            this._descriptionHighlights = item.highlights?.description;
            this._detailHighlights = item.highlights?.detail;
        }
        get separator() {
            return this._separator;
        }
        set separator(value) {
            this._separator = value;
        }
        get checked() {
            return this._checked;
        }
        set checked(value) {
            if (value !== this._checked) {
                this._checked = value;
                this._onChecked.fire({ element: this, checked: value });
            }
        }
        get checkboxDisabled() {
            return !!this.item.disabled;
        }
    }
    var QuickPickSeparatorFocusReason;
    (function (QuickPickSeparatorFocusReason) {
        /**
         * No item is hovered or active
         */
        QuickPickSeparatorFocusReason[QuickPickSeparatorFocusReason["NONE"] = 0] = "NONE";
        /**
         * Some item within this section is hovered
         */
        QuickPickSeparatorFocusReason[QuickPickSeparatorFocusReason["MOUSE_HOVER"] = 1] = "MOUSE_HOVER";
        /**
         * Some item within this section is active
         */
        QuickPickSeparatorFocusReason[QuickPickSeparatorFocusReason["ACTIVE_ITEM"] = 2] = "ACTIVE_ITEM";
    })(QuickPickSeparatorFocusReason || (QuickPickSeparatorFocusReason = {}));
    class QuickPickSeparatorElement extends BaseQuickPickItemElement {
        constructor(index, fireSeparatorButtonTriggered, separator) {
            super(index, false, separator);
            this.fireSeparatorButtonTriggered = fireSeparatorButtonTriggered;
            this.separator = separator;
            this.children = new Array();
            /**
             * If this item is >0, it means that there is some item in the list that is either:
             * * hovered over
             * * active
             */
            this.focusInsideSeparator = QuickPickSeparatorFocusReason.NONE;
        }
    }
    class QuickInputItemDelegate {
        getHeight(element) {
            if (element instanceof QuickPickSeparatorElement) {
                return 30;
            }
            return element.saneDetail ? 44 : 22;
        }
        getTemplateId(element) {
            if (element instanceof QuickPickItemElement) {
                return QuickPickItemElementRenderer.ID;
            }
            else {
                return QuickPickSeparatorElementRenderer.ID;
            }
        }
    }
    class QuickInputAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('quickInput', "Quick Input");
        }
        getAriaLabel(element) {
            return element.separator?.label
                ? `${element.saneAriaLabel}, ${element.separator.label}`
                : element.saneAriaLabel;
        }
        getWidgetRole() {
            return 'listbox';
        }
        getRole(element) {
            return element.hasCheckbox ? 'checkbox' : 'option';
        }
        isChecked(element) {
            if (!element.hasCheckbox || !(element instanceof QuickPickItemElement)) {
                return undefined;
            }
            return {
                get value() { return element.checked; },
                onDidChange: e => element.onChecked(() => e()),
            };
        }
    }
    class BaseQuickInputListRenderer {
        constructor(hoverDelegate) {
            this.hoverDelegate = hoverDelegate;
        }
        // TODO: only do the common stuff here and have a subclass handle their specific stuff
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDisposeElement = new lifecycle_1.DisposableStore();
            data.toDisposeTemplate = new lifecycle_1.DisposableStore();
            data.entry = dom.append(container, $('.quick-input-list-entry'));
            // Checkbox
            const label = dom.append(data.entry, $('label.quick-input-list-label'));
            data.toDisposeTemplate.add(dom.addStandardDisposableListener(label, dom.EventType.CLICK, e => {
                if (!data.checkbox.offsetParent) { // If checkbox not visible:
                    e.preventDefault(); // Prevent toggle of checkbox when it is immediately shown afterwards. #91740
                }
            }));
            data.checkbox = dom.append(label, $('input.quick-input-list-checkbox'));
            data.checkbox.type = 'checkbox';
            // Rows
            const rows = dom.append(label, $('.quick-input-list-rows'));
            const row1 = dom.append(rows, $('.quick-input-list-row'));
            const row2 = dom.append(rows, $('.quick-input-list-row'));
            // Label
            data.label = new iconLabel_1.IconLabel(row1, { supportHighlights: true, supportDescriptionHighlights: true, supportIcons: true, hoverDelegate: this.hoverDelegate });
            data.toDisposeTemplate.add(data.label);
            data.icon = dom.prepend(data.label.element, $('.quick-input-list-icon'));
            // Keybinding
            const keybindingContainer = dom.append(row1, $('.quick-input-list-entry-keybinding'));
            data.keybinding = new keybindingLabel_1.KeybindingLabel(keybindingContainer, platform_1.OS);
            data.toDisposeTemplate.add(data.keybinding);
            // Detail
            const detailContainer = dom.append(row2, $('.quick-input-list-label-meta'));
            data.detail = new iconLabel_1.IconLabel(detailContainer, { supportHighlights: true, supportIcons: true, hoverDelegate: this.hoverDelegate });
            data.toDisposeTemplate.add(data.detail);
            // Separator
            data.separator = dom.append(data.entry, $('.quick-input-list-separator'));
            // Actions
            data.actionBar = new actionbar_1.ActionBar(data.entry, this.hoverDelegate ? { hoverDelegate: this.hoverDelegate } : undefined);
            data.actionBar.domNode.classList.add('quick-input-list-entry-action-bar');
            data.toDisposeTemplate.add(data.actionBar);
            return data;
        }
        disposeTemplate(data) {
            data.toDisposeElement.dispose();
            data.toDisposeTemplate.dispose();
        }
        disposeElement(_element, _index, data) {
            data.toDisposeElement.clear();
            data.actionBar.clear();
        }
    }
    let QuickPickItemElementRenderer = class QuickPickItemElementRenderer extends BaseQuickInputListRenderer {
        static { QuickPickItemElementRenderer_1 = this; }
        static { this.ID = 'quickpickitem'; }
        constructor(hoverDelegate, themeService) {
            super(hoverDelegate);
            this.themeService = themeService;
            // Follow what we do in the separator renderer
            this._itemsWithSeparatorsFrequency = new Map();
        }
        get templateId() {
            return QuickPickItemElementRenderer_1.ID;
        }
        renderTemplate(container) {
            const data = super.renderTemplate(container);
            data.toDisposeTemplate.add(dom.addStandardDisposableListener(data.checkbox, dom.EventType.CHANGE, e => {
                data.element.checked = data.checkbox.checked;
            }));
            return data;
        }
        renderElement(node, index, data) {
            const element = node.element;
            data.element = element;
            element.element = data.entry ?? undefined;
            const mainItem = element.item;
            data.checkbox.checked = element.checked;
            data.toDisposeElement.add(element.onChecked(checked => data.checkbox.checked = checked));
            data.checkbox.disabled = element.checkboxDisabled;
            const { labelHighlights, descriptionHighlights, detailHighlights } = element;
            // Icon
            if (mainItem.iconPath) {
                const icon = (0, theme_1.isDark)(this.themeService.getColorTheme().type) ? mainItem.iconPath.dark : (mainItem.iconPath.light ?? mainItem.iconPath.dark);
                const iconUrl = uri_1.URI.revive(icon);
                data.icon.className = 'quick-input-list-icon';
                data.icon.style.backgroundImage = dom.asCSSUrl(iconUrl);
            }
            else {
                data.icon.style.backgroundImage = '';
                data.icon.className = mainItem.iconClass ? `quick-input-list-icon ${mainItem.iconClass}` : '';
            }
            // Label
            let descriptionTitle;
            // if we have a tooltip, that will be the hover,
            // with the saneDescription as fallback if it
            // is defined
            if (!element.saneTooltip && element.saneDescription) {
                descriptionTitle = {
                    markdown: {
                        value: element.saneDescription,
                        supportThemeIcons: true
                    },
                    markdownNotSupportedFallback: element.saneDescription
                };
            }
            const options = {
                matches: labelHighlights || [],
                // If we have a tooltip, we want that to be shown and not any other hover
                descriptionTitle,
                descriptionMatches: descriptionHighlights || [],
                labelEscapeNewLines: true
            };
            options.extraClasses = mainItem.iconClasses;
            options.italic = mainItem.italic;
            options.strikethrough = mainItem.strikethrough;
            data.entry.classList.remove('quick-input-list-separator-as-item');
            data.label.setLabel(element.saneLabel, element.saneDescription, options);
            // Keybinding
            data.keybinding.set(mainItem.keybinding);
            // Detail
            if (element.saneDetail) {
                let title;
                // If we have a tooltip, we want that to be shown and not any other hover
                if (!element.saneTooltip) {
                    title = {
                        markdown: {
                            value: element.saneDetail,
                            supportThemeIcons: true
                        },
                        markdownNotSupportedFallback: element.saneDetail
                    };
                }
                data.detail.element.style.display = '';
                data.detail.setLabel(element.saneDetail, undefined, {
                    matches: detailHighlights,
                    title,
                    labelEscapeNewLines: true
                });
            }
            else {
                data.detail.element.style.display = 'none';
            }
            // Separator
            if (element.separator?.label) {
                data.separator.textContent = element.separator.label;
                data.separator.style.display = '';
                this.addItemWithSeparator(element);
            }
            else {
                data.separator.style.display = 'none';
            }
            data.entry.classList.toggle('quick-input-list-separator-border', !!element.separator);
            // Actions
            const buttons = mainItem.buttons;
            if (buttons && buttons.length) {
                data.actionBar.push(buttons.map((button, index) => (0, quickInputUtils_1.quickInputButtonToAction)(button, `id-${index}`, () => element.fireButtonTriggered({ button, item: element.item }))), { icon: true, label: false });
                data.entry.classList.add('has-actions');
            }
            else {
                data.entry.classList.remove('has-actions');
            }
        }
        disposeElement(element, _index, data) {
            this.removeItemWithSeparator(element.element);
            super.disposeElement(element, _index, data);
        }
        isItemWithSeparatorVisible(item) {
            return this._itemsWithSeparatorsFrequency.has(item);
        }
        addItemWithSeparator(item) {
            this._itemsWithSeparatorsFrequency.set(item, (this._itemsWithSeparatorsFrequency.get(item) || 0) + 1);
        }
        removeItemWithSeparator(item) {
            const frequency = this._itemsWithSeparatorsFrequency.get(item) || 0;
            if (frequency > 1) {
                this._itemsWithSeparatorsFrequency.set(item, frequency - 1);
            }
            else {
                this._itemsWithSeparatorsFrequency.delete(item);
            }
        }
    };
    QuickPickItemElementRenderer = QuickPickItemElementRenderer_1 = __decorate([
        __param(1, themeService_1.IThemeService)
    ], QuickPickItemElementRenderer);
    class QuickPickSeparatorElementRenderer extends BaseQuickInputListRenderer {
        constructor() {
            super(...arguments);
            // This is a frequency map because sticky scroll re-uses the same renderer to render a second
            // instance of the same separator.
            this._visibleSeparatorsFrequency = new Map();
        }
        static { this.ID = 'quickpickseparator'; }
        get templateId() {
            return QuickPickSeparatorElementRenderer.ID;
        }
        get visibleSeparators() {
            return [...this._visibleSeparatorsFrequency.keys()];
        }
        isSeparatorVisible(separator) {
            return this._visibleSeparatorsFrequency.has(separator);
        }
        renderElement(node, index, data) {
            const element = node.element;
            data.element = element;
            element.element = data.entry ?? undefined;
            element.element.classList.toggle('focus-inside', !!element.focusInsideSeparator);
            const mainItem = element.separator;
            const { labelHighlights, descriptionHighlights, detailHighlights } = element;
            // Icon
            data.icon.style.backgroundImage = '';
            data.icon.className = '';
            // Label
            let descriptionTitle;
            // if we have a tooltip, that will be the hover,
            // with the saneDescription as fallback if it
            // is defined
            if (!element.saneTooltip && element.saneDescription) {
                descriptionTitle = {
                    markdown: {
                        value: element.saneDescription,
                        supportThemeIcons: true
                    },
                    markdownNotSupportedFallback: element.saneDescription
                };
            }
            const options = {
                matches: labelHighlights || [],
                // If we have a tooltip, we want that to be shown and not any other hover
                descriptionTitle,
                descriptionMatches: descriptionHighlights || [],
                labelEscapeNewLines: true
            };
            data.entry.classList.add('quick-input-list-separator-as-item');
            data.label.setLabel(element.saneLabel, element.saneDescription, options);
            // Detail
            if (element.saneDetail) {
                let title;
                // If we have a tooltip, we want that to be shown and not any other hover
                if (!element.saneTooltip) {
                    title = {
                        markdown: {
                            value: element.saneDetail,
                            supportThemeIcons: true
                        },
                        markdownNotSupportedFallback: element.saneDetail
                    };
                }
                data.detail.element.style.display = '';
                data.detail.setLabel(element.saneDetail, undefined, {
                    matches: detailHighlights,
                    title,
                    labelEscapeNewLines: true
                });
            }
            else {
                data.detail.element.style.display = 'none';
            }
            // Separator
            data.separator.style.display = 'none';
            data.entry.classList.add('quick-input-list-separator-border');
            // Actions
            const buttons = mainItem.buttons;
            if (buttons && buttons.length) {
                data.actionBar.push(buttons.map((button, index) => (0, quickInputUtils_1.quickInputButtonToAction)(button, `id-${index}`, () => element.fireSeparatorButtonTriggered({ button, separator: element.separator }))), { icon: true, label: false });
                data.entry.classList.add('has-actions');
            }
            else {
                data.entry.classList.remove('has-actions');
            }
            this.addSeparator(element);
        }
        disposeElement(element, _index, data) {
            this.removeSeparator(element.element);
            if (!this.isSeparatorVisible(element.element)) {
                element.element.element?.classList.remove('focus-inside');
            }
            super.disposeElement(element, _index, data);
        }
        addSeparator(separator) {
            this._visibleSeparatorsFrequency.set(separator, (this._visibleSeparatorsFrequency.get(separator) || 0) + 1);
        }
        removeSeparator(separator) {
            const frequency = this._visibleSeparatorsFrequency.get(separator) || 0;
            if (frequency > 1) {
                this._visibleSeparatorsFrequency.set(separator, frequency - 1);
            }
            else {
                this._visibleSeparatorsFrequency.delete(separator);
            }
        }
    }
    let QuickInputTree = class QuickInputTree extends lifecycle_1.Disposable {
        constructor(parent, hoverDelegate, linkOpenerDelegate, id, instantiationService) {
            super();
            this.parent = parent;
            this.hoverDelegate = hoverDelegate;
            this.linkOpenerDelegate = linkOpenerDelegate;
            this._onKeyDown = new event_1.Emitter();
            /**
             * Event that is fired when the tree receives a keydown.
            */
            this.onKeyDown = this._onKeyDown.event;
            this._onLeave = new event_1.Emitter();
            /**
             * Event that is fired when the tree would no longer have focus.
            */
            this.onLeave = this._onLeave.event;
            this._onChangedAllVisibleChecked = new event_1.Emitter();
            this.onChangedAllVisibleChecked = this._onChangedAllVisibleChecked.event;
            this._onChangedCheckedCount = new event_1.Emitter();
            this.onChangedCheckedCount = this._onChangedCheckedCount.event;
            this._onChangedVisibleCount = new event_1.Emitter();
            this.onChangedVisibleCount = this._onChangedVisibleCount.event;
            this._onChangedCheckedElements = new event_1.Emitter();
            this.onChangedCheckedElements = this._onChangedCheckedElements.event;
            this._onButtonTriggered = new event_1.Emitter();
            this.onButtonTriggered = this._onButtonTriggered.event;
            this._onSeparatorButtonTriggered = new event_1.Emitter();
            this.onSeparatorButtonTriggered = this._onSeparatorButtonTriggered.event;
            this._onTriggerEmptySelectionOrFocus = new event_1.Emitter();
            this._elementChecked = new event_1.Emitter();
            this._inputElements = new Array();
            this._elementTree = new Array();
            this._itemElements = new Array();
            // Elements that apply to the current set of elements
            this._elementDisposable = this._register(new lifecycle_1.DisposableStore());
            // This is used to prevent setting the checked state of a single element from firing the checked events
            // so that we can batch them together. This can probably be improved by handling events differently,
            // but this works for now. An observable would probably be ideal for this.
            this._shouldFireCheckedEvents = true;
            this._matchOnDescription = false;
            this._matchOnDetail = false;
            this._matchOnLabel = true;
            this._matchOnLabelMode = 'fuzzy';
            this._matchOnMeta = true;
            this._sortByLabel = true;
            this._container = dom.append(this.parent, $('.quick-input-list'));
            this._separatorRenderer = new QuickPickSeparatorElementRenderer(hoverDelegate);
            this._itemRenderer = instantiationService.createInstance(QuickPickItemElementRenderer, hoverDelegate);
            this._tree = this._register(instantiationService.createInstance((listService_1.WorkbenchObjectTree), 'QuickInput', this._container, new QuickInputItemDelegate(), [this._itemRenderer, this._separatorRenderer], {
                accessibilityProvider: new QuickInputAccessibilityProvider(),
                setRowLineHeight: false,
                multipleSelectionSupport: false,
                hideTwistiesOfChildlessElements: true,
                renderIndentGuides: abstractTree_1.RenderIndentGuides.None,
                findWidgetEnabled: false,
                indent: 0,
                horizontalScrolling: false,
                allowNonCollapsibleParents: true,
                identityProvider: {
                    getId: element => {
                        // always prefer item over separator because if item is defined, it must be the main item type
                        const mainItem = element.item || element.separator;
                        if (mainItem === undefined) {
                            return '';
                        }
                        // always prefer a defined id if one was specified and use "label + description + detail" as a fallback
                        if (mainItem.id !== undefined) {
                            return mainItem.id;
                        }
                        let id = `label:${mainItem.label}`;
                        id += `$$description:${mainItem.description}`;
                        if (mainItem.type !== 'separator') {
                            id += `$$detail:${mainItem.detail}`;
                        }
                        return id;
                    },
                },
                alwaysConsumeMouseWheel: true
            }));
            this._tree.getHTMLElement().id = id;
            this._registerListeners();
        }
        //#region public getters/setters
        get onDidChangeFocus() {
            return event_1.Event.map(event_1.Event.any(this._tree.onDidChangeFocus, this._onTriggerEmptySelectionOrFocus.event), e => e.elements.filter((e) => e instanceof QuickPickItemElement).map(e => e.item));
        }
        get onDidChangeSelection() {
            return event_1.Event.map(event_1.Event.any(this._tree.onDidChangeSelection, this._onTriggerEmptySelectionOrFocus.event), e => ({
                items: e.elements.filter((e) => e instanceof QuickPickItemElement).map(e => e.item),
                event: e.browserEvent
            }));
        }
        get scrollTop() {
            return this._tree.scrollTop;
        }
        set scrollTop(scrollTop) {
            this._tree.scrollTop = scrollTop;
        }
        get ariaLabel() {
            return this._tree.ariaLabel;
        }
        set ariaLabel(label) {
            this._tree.ariaLabel = label ?? '';
        }
        set enabled(value) {
            this._tree.getHTMLElement().style.pointerEvents = value ? '' : 'none';
        }
        get matchOnDescription() {
            return this._matchOnDescription;
        }
        set matchOnDescription(value) {
            this._matchOnDescription = value;
        }
        get matchOnDetail() {
            return this._matchOnDetail;
        }
        set matchOnDetail(value) {
            this._matchOnDetail = value;
        }
        get matchOnLabel() {
            return this._matchOnLabel;
        }
        set matchOnLabel(value) {
            this._matchOnLabel = value;
        }
        get matchOnLabelMode() {
            return this._matchOnLabelMode;
        }
        set matchOnLabelMode(value) {
            this._matchOnLabelMode = value;
        }
        get matchOnMeta() {
            return this._matchOnMeta;
        }
        set matchOnMeta(value) {
            this._matchOnMeta = value;
        }
        get sortByLabel() {
            return this._sortByLabel;
        }
        set sortByLabel(value) {
            this._sortByLabel = value;
        }
        //#endregion
        //#region register listeners
        _registerListeners() {
            this._registerOnKeyDown();
            this._registerOnContainerClick();
            this._registerOnMouseMiddleClick();
            this._registerOnElementChecked();
            this._registerOnContextMenu();
            this._registerHoverListeners();
            this._registerSelectionChangeListener();
            this._registerSeparatorActionShowingListeners();
        }
        _registerOnKeyDown() {
            // TODO: Should this be added at a higher level?
            this._register(this._tree.onKeyDown(e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                switch (event.keyCode) {
                    case 10 /* KeyCode.Space */:
                        this.toggleCheckbox();
                        break;
                    case 31 /* KeyCode.KeyA */:
                        if (platform_1.isMacintosh ? e.metaKey : e.ctrlKey) {
                            this._tree.setFocus(this._itemElements);
                        }
                        break;
                    // When we hit the top of the tree, we fire the onLeave event.
                    case 16 /* KeyCode.UpArrow */: {
                        const focus1 = this._tree.getFocus();
                        if (focus1.length === 1 && focus1[0] === this._itemElements[0]) {
                            this._onLeave.fire();
                        }
                        break;
                    }
                    // When we hit the bottom of the tree, we fire the onLeave event.
                    case 18 /* KeyCode.DownArrow */: {
                        const focus2 = this._tree.getFocus();
                        if (focus2.length === 1 && focus2[0] === this._itemElements[this._itemElements.length - 1]) {
                            this._onLeave.fire();
                        }
                        break;
                    }
                }
                this._onKeyDown.fire(event);
            }));
        }
        _registerOnContainerClick() {
            this._register(dom.addDisposableListener(this._container, dom.EventType.CLICK, e => {
                if (e.x || e.y) { // Avoid 'click' triggered by 'space' on checkbox.
                    this._onLeave.fire();
                }
            }));
        }
        _registerOnMouseMiddleClick() {
            this._register(dom.addDisposableListener(this._container, dom.EventType.AUXCLICK, e => {
                if (e.button === 1) {
                    this._onLeave.fire();
                }
            }));
        }
        _registerOnElementChecked() {
            this._register(this._elementChecked.event(_ => this._fireCheckedEvents()));
        }
        _registerOnContextMenu() {
            this._register(this._tree.onContextMenu(e => {
                if (e.element) {
                    e.browserEvent.preventDefault();
                    // we want to treat a context menu event as
                    // a gesture to open the item at the index
                    // since we do not have any context menu
                    // this enables for example macOS to Ctrl-
                    // click on an item to open it.
                    this._tree.setSelection([e.element]);
                }
            }));
        }
        _registerHoverListeners() {
            const delayer = this._register(new async_1.ThrottledDelayer(this.hoverDelegate.delay));
            this._register(this._tree.onMouseOver(async (e) => {
                // If we hover over an anchor element, we don't want to show the hover because
                // the anchor may have a tooltip that we want to show instead.
                if (e.browserEvent.target instanceof HTMLAnchorElement) {
                    delayer.cancel();
                    return;
                }
                if (
                // anchors are an exception as called out above so we skip them here
                !(e.browserEvent.relatedTarget instanceof HTMLAnchorElement) &&
                    // check if the mouse is still over the same element
                    dom.isAncestor(e.browserEvent.relatedTarget, e.element?.element)) {
                    return;
                }
                try {
                    await delayer.trigger(async () => {
                        if (e.element instanceof QuickPickItemElement) {
                            this.showHover(e.element);
                        }
                    });
                }
                catch (e) {
                    // Ignore cancellation errors due to mouse out
                    if (!(0, errors_1.isCancellationError)(e)) {
                        throw e;
                    }
                }
            }));
            this._register(this._tree.onMouseOut(e => {
                // onMouseOut triggers every time a new element has been moused over
                // even if it's on the same list item. We only want one event, so we
                // check if the mouse is still over the same element.
                if (dom.isAncestor(e.browserEvent.relatedTarget, e.element?.element)) {
                    return;
                }
                delayer.cancel();
            }));
        }
        /**
         * Register's focus change and mouse events so that we can track when items inside of a
         * separator's section are focused or hovered so that we can display the separator's actions
         */
        _registerSeparatorActionShowingListeners() {
            this._register(this._tree.onDidChangeFocus(e => {
                const parent = e.elements[0]
                    ? this._tree.getParentElement(e.elements[0])
                    // treat null as focus lost and when we have no separators
                    : null;
                for (const separator of this._separatorRenderer.visibleSeparators) {
                    const value = separator === parent;
                    // get bitness of ACTIVE_ITEM and check if it changed
                    const currentActive = !!(separator.focusInsideSeparator & QuickPickSeparatorFocusReason.ACTIVE_ITEM);
                    if (currentActive !== value) {
                        if (value) {
                            separator.focusInsideSeparator |= QuickPickSeparatorFocusReason.ACTIVE_ITEM;
                        }
                        else {
                            separator.focusInsideSeparator &= ~QuickPickSeparatorFocusReason.ACTIVE_ITEM;
                        }
                        this._tree.rerender(separator);
                    }
                }
            }));
            this._register(this._tree.onMouseOver(e => {
                const parent = e.element
                    ? this._tree.getParentElement(e.element)
                    : null;
                for (const separator of this._separatorRenderer.visibleSeparators) {
                    if (separator !== parent) {
                        continue;
                    }
                    const currentMouse = !!(separator.focusInsideSeparator & QuickPickSeparatorFocusReason.MOUSE_HOVER);
                    if (!currentMouse) {
                        separator.focusInsideSeparator |= QuickPickSeparatorFocusReason.MOUSE_HOVER;
                        this._tree.rerender(separator);
                    }
                }
            }));
            this._register(this._tree.onMouseOut(e => {
                const parent = e.element
                    ? this._tree.getParentElement(e.element)
                    : null;
                for (const separator of this._separatorRenderer.visibleSeparators) {
                    if (separator !== parent) {
                        continue;
                    }
                    const currentMouse = !!(separator.focusInsideSeparator & QuickPickSeparatorFocusReason.MOUSE_HOVER);
                    if (currentMouse) {
                        separator.focusInsideSeparator &= ~QuickPickSeparatorFocusReason.MOUSE_HOVER;
                        this._tree.rerender(separator);
                    }
                }
            }));
        }
        _registerSelectionChangeListener() {
            // When the user selects a separator, the separator will move to the top and focus will be
            // set to the first element after the separator.
            this._register(this._tree.onDidChangeSelection(e => {
                const elementsWithoutSeparators = e.elements.filter((e) => e instanceof QuickPickItemElement);
                if (elementsWithoutSeparators.length !== e.elements.length) {
                    if (e.elements.length === 1 && e.elements[0] instanceof QuickPickSeparatorElement) {
                        this._tree.setFocus([e.elements[0].children[0]]);
                        this._tree.reveal(e.elements[0], 0);
                    }
                    this._tree.setSelection(elementsWithoutSeparators);
                }
            }));
        }
        //#endregion
        //#region public methods
        getAllVisibleChecked() {
            return this._allVisibleChecked(this._itemElements, false);
        }
        getCheckedCount() {
            return this._itemElements.filter(element => element.checked).length;
        }
        getVisibleCount() {
            return this._itemElements.filter(e => !e.hidden).length;
        }
        setAllVisibleChecked(checked) {
            try {
                this._shouldFireCheckedEvents = false;
                this._itemElements.forEach(element => {
                    if (!element.hidden && !element.checkboxDisabled) {
                        // Would fire an event if we didn't have the flag set
                        element.checked = checked;
                    }
                });
            }
            finally {
                this._shouldFireCheckedEvents = true;
                this._fireCheckedEvents();
            }
        }
        setElements(inputElements) {
            this._elementDisposable.clear();
            this._inputElements = inputElements;
            const hasCheckbox = this.parent.classList.contains('show-checkboxes');
            let currentSeparatorElement;
            this._itemElements = new Array();
            this._elementTree = inputElements.reduce((result, item, index) => {
                let element;
                if (item.type === 'separator') {
                    if (!item.buttons) {
                        // This separator will be rendered as a part of the list item
                        return result;
                    }
                    currentSeparatorElement = new QuickPickSeparatorElement(index, (event) => this.fireSeparatorButtonTriggered(event), item);
                    element = currentSeparatorElement;
                }
                else {
                    const previous = index > 0 ? inputElements[index - 1] : undefined;
                    let separator;
                    if (previous && previous.type === 'separator' && !previous.buttons) {
                        // Found an inline separator so we clear out the current separator element
                        currentSeparatorElement = undefined;
                        separator = previous;
                    }
                    const qpi = new QuickPickItemElement(index, hasCheckbox, (event) => this.fireButtonTriggered(event), this._elementChecked, item, separator);
                    this._itemElements.push(qpi);
                    if (currentSeparatorElement) {
                        currentSeparatorElement.children.push(qpi);
                        return result;
                    }
                    element = qpi;
                }
                result.push(element);
                return result;
            }, new Array());
            const elements = new Array();
            let visibleCount = 0;
            for (const element of this._elementTree) {
                if (element instanceof QuickPickSeparatorElement) {
                    elements.push({
                        element,
                        collapsible: false,
                        collapsed: false,
                        children: element.children.map(e => ({
                            element: e,
                            collapsible: false,
                            collapsed: false,
                        })),
                    });
                    visibleCount += element.children.length + 1; // +1 for the separator itself;
                }
                else {
                    elements.push({
                        element,
                        collapsible: false,
                        collapsed: false,
                    });
                    visibleCount++;
                }
            }
            this._tree.setChildren(null, elements);
            this._onChangedVisibleCount.fire(visibleCount);
        }
        getElementsCount() {
            return this._inputElements.length;
        }
        getFocusedElements() {
            return this._tree.getFocus()
                .filter((e) => !!e)
                .map(e => e.item)
                .filter((e) => !!e);
        }
        setFocusedElements(items) {
            const elements = items.map(item => this._itemElements.find(e => e.item === item))
                .filter((e) => !!e);
            this._tree.setFocus(elements);
            if (items.length > 0) {
                const focused = this._tree.getFocus()[0];
                if (focused) {
                    this._tree.reveal(focused);
                }
            }
        }
        getActiveDescendant() {
            return this._tree.getHTMLElement().getAttribute('aria-activedescendant');
        }
        getSelectedElements() {
            return this._tree.getSelection()
                .filter((e) => !!e && !!e.item)
                .map(e => e.item);
        }
        setSelectedElements(items) {
            const elements = items.map(item => this._itemElements.find(e => e.item === item))
                .filter((e) => !!e);
            this._tree.setSelection(elements);
        }
        getCheckedElements() {
            return this._itemElements.filter(e => e.checked)
                .map(e => e.item);
        }
        setCheckedElements(items) {
            try {
                this._shouldFireCheckedEvents = false;
                const checked = new Set();
                for (const item of items) {
                    checked.add(item);
                }
                for (const element of this._itemElements) {
                    // Would fire an event if we didn't have the flag set
                    element.checked = checked.has(element.item);
                }
            }
            finally {
                this._shouldFireCheckedEvents = true;
                this._fireCheckedEvents();
            }
        }
        focus(what) {
            if (!this._itemElements.length) {
                return;
            }
            if (what === QuickInputListFocus.Second && this._itemElements.length < 2) {
                what = QuickInputListFocus.First;
            }
            switch (what) {
                case QuickInputListFocus.First:
                    this._tree.scrollTop = 0;
                    this._tree.focusFirst(undefined, (e) => e.element instanceof QuickPickItemElement);
                    break;
                case QuickInputListFocus.Second:
                    this._tree.scrollTop = 0;
                    this._tree.setFocus([this._itemElements[1]]);
                    break;
                case QuickInputListFocus.Last:
                    this._tree.scrollTop = this._tree.scrollHeight;
                    this._tree.setFocus([this._itemElements[this._itemElements.length - 1]]);
                    break;
                case QuickInputListFocus.Next:
                    this._tree.focusNext(undefined, true, undefined, (e) => {
                        if (!(e.element instanceof QuickPickItemElement)) {
                            return false;
                        }
                        this._tree.reveal(e.element);
                        return true;
                    });
                    break;
                case QuickInputListFocus.Previous:
                    this._tree.focusPrevious(undefined, true, undefined, (e) => {
                        if (!(e.element instanceof QuickPickItemElement)) {
                            return false;
                        }
                        const parent = this._tree.getParentElement(e.element);
                        if (parent === null || parent.children[0] !== e.element) {
                            this._tree.reveal(e.element);
                        }
                        else {
                            // Only if we are the first child of a separator do we reveal the separator
                            this._tree.reveal(parent);
                        }
                        return true;
                    });
                    break;
                case QuickInputListFocus.NextPage:
                    this._tree.focusNextPage(undefined, (e) => {
                        if (!(e.element instanceof QuickPickItemElement)) {
                            return false;
                        }
                        this._tree.reveal(e.element);
                        return true;
                    });
                    break;
                case QuickInputListFocus.PreviousPage:
                    this._tree.focusPreviousPage(undefined, (e) => {
                        if (!(e.element instanceof QuickPickItemElement)) {
                            return false;
                        }
                        const parent = this._tree.getParentElement(e.element);
                        if (parent === null || parent.children[0] !== e.element) {
                            this._tree.reveal(e.element);
                        }
                        else {
                            this._tree.reveal(parent);
                        }
                        return true;
                    });
                    break;
                case QuickInputListFocus.NextSeparator: {
                    let foundSeparatorAsItem = false;
                    const before = this._tree.getFocus()[0];
                    this._tree.focusNext(undefined, true, undefined, (e) => {
                        if (foundSeparatorAsItem) {
                            // This should be the index right after the separator so it
                            // is the item we want to focus.
                            return true;
                        }
                        if (e.element instanceof QuickPickSeparatorElement) {
                            foundSeparatorAsItem = true;
                            // If the separator is visible, then we should just reveal its first child so it's not as jarring.
                            if (this._separatorRenderer.isSeparatorVisible(e.element)) {
                                this._tree.reveal(e.element.children[0]);
                            }
                            else {
                                // If the separator is not visible, then we should
                                // push it up to the top of the list.
                                this._tree.reveal(e.element, 0);
                            }
                        }
                        else if (e.element instanceof QuickPickItemElement) {
                            if (e.element.separator) {
                                if (this._itemRenderer.isItemWithSeparatorVisible(e.element)) {
                                    this._tree.reveal(e.element);
                                }
                                else {
                                    this._tree.reveal(e.element, 0);
                                }
                                return true;
                            }
                            else if (e.element === this._elementTree[0]) {
                                // We should stop at the first item in the list if it's a regular item.
                                this._tree.reveal(e.element, 0);
                                return true;
                            }
                        }
                        return false;
                    });
                    const after = this._tree.getFocus()[0];
                    if (before === after) {
                        // If we didn't move, then we should just move to the end
                        // of the list.
                        this._tree.scrollTop = this._tree.scrollHeight;
                        this._tree.setFocus([this._itemElements[this._itemElements.length - 1]]);
                    }
                    break;
                }
                case QuickInputListFocus.PreviousSeparator: {
                    let focusElement;
                    // If we are already sitting on an inline separator, then we
                    // have already found the _current_ separator and need to
                    // move to the previous one.
                    let foundSeparator = !!this._tree.getFocus()[0]?.separator;
                    this._tree.focusPrevious(undefined, true, undefined, (e) => {
                        if (e.element instanceof QuickPickSeparatorElement) {
                            if (foundSeparator) {
                                if (!focusElement) {
                                    if (this._separatorRenderer.isSeparatorVisible(e.element)) {
                                        this._tree.reveal(e.element);
                                    }
                                    else {
                                        this._tree.reveal(e.element, 0);
                                    }
                                    focusElement = e.element.children[0];
                                }
                            }
                            else {
                                foundSeparator = true;
                            }
                        }
                        else if (e.element instanceof QuickPickItemElement) {
                            if (!focusElement) {
                                if (e.element.separator) {
                                    if (this._itemRenderer.isItemWithSeparatorVisible(e.element)) {
                                        this._tree.reveal(e.element);
                                    }
                                    else {
                                        this._tree.reveal(e.element, 0);
                                    }
                                    focusElement = e.element;
                                }
                                else if (e.element === this._elementTree[0]) {
                                    // We should stop at the first item in the list if it's a regular item.
                                    this._tree.reveal(e.element, 0);
                                    return true;
                                }
                            }
                        }
                        return false;
                    });
                    if (focusElement) {
                        this._tree.setFocus([focusElement]);
                    }
                    break;
                }
            }
        }
        clearFocus() {
            this._tree.setFocus([]);
        }
        domFocus() {
            this._tree.domFocus();
        }
        layout(maxHeight) {
            this._tree.getHTMLElement().style.maxHeight = maxHeight ? `${
            // Make sure height aligns with list item heights
            Math.floor(maxHeight / 44) * 44
                // Add some extra height so that it's clear there's more to scroll
                + 6}px` : '';
            this._tree.layout();
        }
        filter(query) {
            if (!(this._sortByLabel || this._matchOnLabel || this._matchOnDescription || this._matchOnDetail)) {
                this._tree.layout();
                return false;
            }
            const queryWithWhitespace = query;
            query = query.trim();
            // Reset filtering
            if (!query || !(this.matchOnLabel || this.matchOnDescription || this.matchOnDetail)) {
                this._itemElements.forEach(element => {
                    element.labelHighlights = undefined;
                    element.descriptionHighlights = undefined;
                    element.detailHighlights = undefined;
                    element.hidden = false;
                    const previous = element.index && this._inputElements[element.index - 1];
                    if (element.item) {
                        element.separator = previous && previous.type === 'separator' && !previous.buttons ? previous : undefined;
                    }
                });
            }
            // Filter by value (since we support icons in labels, use $(..) aware fuzzy matching)
            else {
                let currentSeparator;
                this._elementTree.forEach(element => {
                    let labelHighlights;
                    if (this.matchOnLabelMode === 'fuzzy') {
                        labelHighlights = this.matchOnLabel ? (0, iconLabels_1.matchesFuzzyIconAware)(query, (0, iconLabels_1.parseLabelWithIcons)(element.saneLabel)) ?? undefined : undefined;
                    }
                    else {
                        labelHighlights = this.matchOnLabel ? matchesContiguousIconAware(queryWithWhitespace, (0, iconLabels_1.parseLabelWithIcons)(element.saneLabel)) ?? undefined : undefined;
                    }
                    const descriptionHighlights = this.matchOnDescription ? (0, iconLabels_1.matchesFuzzyIconAware)(query, (0, iconLabels_1.parseLabelWithIcons)(element.saneDescription || '')) ?? undefined : undefined;
                    const detailHighlights = this.matchOnDetail ? (0, iconLabels_1.matchesFuzzyIconAware)(query, (0, iconLabels_1.parseLabelWithIcons)(element.saneDetail || '')) ?? undefined : undefined;
                    if (labelHighlights || descriptionHighlights || detailHighlights) {
                        element.labelHighlights = labelHighlights;
                        element.descriptionHighlights = descriptionHighlights;
                        element.detailHighlights = detailHighlights;
                        element.hidden = false;
                    }
                    else {
                        element.labelHighlights = undefined;
                        element.descriptionHighlights = undefined;
                        element.detailHighlights = undefined;
                        element.hidden = element.item ? !element.item.alwaysShow : true;
                    }
                    // Ensure separators are filtered out first before deciding if we need to bring them back
                    if (element.item) {
                        element.separator = undefined;
                    }
                    else if (element.separator) {
                        element.hidden = true;
                    }
                    // we can show the separator unless the list gets sorted by match
                    if (!this.sortByLabel) {
                        const previous = element.index && this._inputElements[element.index - 1];
                        currentSeparator = previous && previous.type === 'separator' ? previous : currentSeparator;
                        if (currentSeparator && !element.hidden) {
                            element.separator = currentSeparator;
                            currentSeparator = undefined;
                        }
                    }
                });
            }
            const shownElements = this._elementTree.filter(element => !element.hidden);
            // Sort by value
            if (this.sortByLabel && query) {
                const normalizedSearchValue = query.toLowerCase();
                shownElements.sort((a, b) => {
                    return compareEntries(a, b, normalizedSearchValue);
                });
            }
            let currentSeparator;
            const finalElements = shownElements.reduce((result, element, index) => {
                if (element instanceof QuickPickItemElement) {
                    if (currentSeparator) {
                        currentSeparator.children.push(element);
                    }
                    else {
                        result.push(element);
                    }
                }
                else if (element instanceof QuickPickSeparatorElement) {
                    element.children = [];
                    currentSeparator = element;
                    result.push(element);
                }
                return result;
            }, new Array());
            const elements = new Array();
            for (const element of finalElements) {
                if (element instanceof QuickPickSeparatorElement) {
                    elements.push({
                        element,
                        collapsible: false,
                        collapsed: false,
                        children: element.children.map(e => ({
                            element: e,
                            collapsible: false,
                            collapsed: false,
                        })),
                    });
                }
                else {
                    elements.push({
                        element,
                        collapsible: false,
                        collapsed: false,
                    });
                }
            }
            const before = this._tree.getFocus().length;
            this._tree.setChildren(null, elements);
            // Temporary fix until we figure out why the tree doesn't fire an event when focus & selection
            // get changed to empty arrays.
            if (before > 0 && elements.length === 0) {
                this._onTriggerEmptySelectionOrFocus.fire({
                    elements: []
                });
            }
            this._tree.layout();
            this._onChangedAllVisibleChecked.fire(this.getAllVisibleChecked());
            this._onChangedVisibleCount.fire(shownElements.length);
            return true;
        }
        toggleCheckbox() {
            try {
                this._shouldFireCheckedEvents = false;
                const elements = this._tree.getFocus().filter((e) => e instanceof QuickPickItemElement);
                const allChecked = this._allVisibleChecked(elements);
                for (const element of elements) {
                    if (!element.checkboxDisabled) {
                        // Would fire an event if we didn't have the flag set
                        element.checked = !allChecked;
                    }
                }
            }
            finally {
                this._shouldFireCheckedEvents = true;
                this._fireCheckedEvents();
            }
        }
        display(display) {
            this._container.style.display = display ? '' : 'none';
        }
        isDisplayed() {
            return this._container.style.display !== 'none';
        }
        style(styles) {
            this._tree.style(styles);
        }
        toggleHover() {
            const focused = this._tree.getFocus()[0];
            if (!focused?.saneTooltip || !(focused instanceof QuickPickItemElement)) {
                return;
            }
            // if there's a hover already, hide it (toggle off)
            if (this._lastHover && !this._lastHover.isDisposed) {
                this._lastHover.dispose();
                return;
            }
            // If there is no hover, show it (toggle on)
            this.showHover(focused);
            const store = new lifecycle_1.DisposableStore();
            store.add(this._tree.onDidChangeFocus(e => {
                if (e.elements[0] instanceof QuickPickItemElement) {
                    this.showHover(e.elements[0]);
                }
            }));
            if (this._lastHover) {
                store.add(this._lastHover);
            }
            this._elementDisposable.add(store);
        }
        //#endregion
        //#region private methods
        _allVisibleChecked(elements, whenNoneVisible = true) {
            for (let i = 0, n = elements.length; i < n; i++) {
                const element = elements[i];
                if (!element.hidden) {
                    if (!element.checked) {
                        return false;
                    }
                    else {
                        whenNoneVisible = true;
                    }
                }
            }
            return whenNoneVisible;
        }
        _fireCheckedEvents() {
            if (!this._shouldFireCheckedEvents) {
                return;
            }
            this._onChangedAllVisibleChecked.fire(this.getAllVisibleChecked());
            this._onChangedCheckedCount.fire(this.getCheckedCount());
            this._onChangedCheckedElements.fire(this.getCheckedElements());
        }
        fireButtonTriggered(event) {
            this._onButtonTriggered.fire(event);
        }
        fireSeparatorButtonTriggered(event) {
            this._onSeparatorButtonTriggered.fire(event);
        }
        /**
         * Disposes of the hover and shows a new one for the given index if it has a tooltip.
         * @param element The element to show the hover for
         */
        showHover(element) {
            if (this._lastHover && !this._lastHover.isDisposed) {
                this.hoverDelegate.onDidHideHover?.();
                this._lastHover?.dispose();
            }
            if (!element.element || !element.saneTooltip) {
                return;
            }
            this._lastHover = this.hoverDelegate.showHover({
                content: element.saneTooltip,
                target: element.element,
                linkHandler: (url) => {
                    this.linkOpenerDelegate(url);
                },
                appearance: {
                    showPointer: true,
                },
                container: this._container,
                position: {
                    hoverPosition: 1 /* HoverPosition.RIGHT */
                }
            }, false);
        }
    };
    exports.QuickInputTree = QuickInputTree;
    __decorate([
        decorators_1.memoize
    ], QuickInputTree.prototype, "onDidChangeFocus", null);
    __decorate([
        decorators_1.memoize
    ], QuickInputTree.prototype, "onDidChangeSelection", null);
    exports.QuickInputTree = QuickInputTree = __decorate([
        __param(4, instantiation_1.IInstantiationService)
    ], QuickInputTree);
    function matchesContiguousIconAware(query, target) {
        const { text, iconOffsets } = target;
        // Return early if there are no icon markers in the word to match against
        if (!iconOffsets || iconOffsets.length === 0) {
            return matchesContiguous(query, text);
        }
        // Trim the word to match against because it could have leading
        // whitespace now if the word started with an icon
        const wordToMatchAgainstWithoutIconsTrimmed = (0, strings_1.ltrim)(text, ' ');
        const leadingWhitespaceOffset = text.length - wordToMatchAgainstWithoutIconsTrimmed.length;
        // match on value without icon
        const matches = matchesContiguous(query, wordToMatchAgainstWithoutIconsTrimmed);
        // Map matches back to offsets with icon and trimming
        if (matches) {
            for (const match of matches) {
                const iconOffset = iconOffsets[match.start + leadingWhitespaceOffset] /* icon offsets at index */ + leadingWhitespaceOffset /* overall leading whitespace offset */;
                match.start += iconOffset;
                match.end += iconOffset;
            }
        }
        return matches;
    }
    function matchesContiguous(word, wordToMatchAgainst) {
        const matchIndex = wordToMatchAgainst.toLowerCase().indexOf(word.toLowerCase());
        if (matchIndex !== -1) {
            return [{ start: matchIndex, end: matchIndex + word.length }];
        }
        return null;
    }
    function compareEntries(elementA, elementB, lookFor) {
        const labelHighlightsA = elementA.labelHighlights || [];
        const labelHighlightsB = elementB.labelHighlights || [];
        if (labelHighlightsA.length && !labelHighlightsB.length) {
            return -1;
        }
        if (!labelHighlightsA.length && labelHighlightsB.length) {
            return 1;
        }
        if (labelHighlightsA.length === 0 && labelHighlightsB.length === 0) {
            return 0;
        }
        return (0, comparers_1.compareAnything)(elementA.saneSortLabel, elementB.saneSortLabel, lookFor);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dFRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9xdWlja2lucHV0L2Jyb3dzZXIvcXVpY2tJbnB1dFRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFDaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVoQixJQUFZLG1CQVVYO0lBVkQsV0FBWSxtQkFBbUI7UUFDOUIsK0RBQVMsQ0FBQTtRQUNULGlFQUFNLENBQUE7UUFDTiw2REFBSSxDQUFBO1FBQ0osNkRBQUksQ0FBQTtRQUNKLHFFQUFRLENBQUE7UUFDUixxRUFBUSxDQUFBO1FBQ1IsNkVBQVksQ0FBQTtRQUNaLCtFQUFhLENBQUE7UUFDYix1RkFBaUIsQ0FBQTtJQUNsQixDQUFDLEVBVlcsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFVOUI7SUFxQ0QsTUFBTSx3QkFBd0I7UUFHN0IsWUFDVSxLQUFhLEVBQ2IsV0FBb0IsRUFDN0IsUUFBdUI7WUFGZCxVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsZ0JBQVcsR0FBWCxXQUFXLENBQVM7WUE4Q3RCLFlBQU8sR0FBRyxLQUFLLENBQUM7WUEzQ3ZCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxXQUFJLENBQUMsR0FBRyxFQUFFO2dCQUMxQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxhQUFhLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRWpFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxTQUFTLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDO3FCQUM1RixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLGdDQUFtQixFQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNoQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRWIsT0FBTztvQkFDTixTQUFTO29CQUNULGFBQWE7b0JBQ2IsYUFBYTtpQkFDYixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQztZQUM3QyxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEMsQ0FBQztRQUVELHVCQUF1QjtRQUV2QixJQUFJLFNBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUNuQyxDQUFDO1FBQ0QsSUFBSSxhQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO1FBQ3ZDLENBQUM7UUFDRCxJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7UUFDdkMsQ0FBQztRQU9ELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBQ0QsSUFBSSxPQUFPLENBQUMsS0FBOEI7WUFDekMsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDdkIsQ0FBQztRQUdELElBQUksTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsS0FBYztZQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUN0QixDQUFDO1FBR0QsSUFBSSxlQUFlO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQzlCLENBQUM7UUFDRCxJQUFJLGVBQWUsQ0FBQyxLQUF5QjtZQUM1QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1FBQy9CLENBQUM7UUFHRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUNELElBQUksVUFBVSxDQUFDLEtBQXlCO1lBQ3ZDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1FBQzFCLENBQUM7UUFHRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUNELElBQUksV0FBVyxDQUFDLEtBQXlEO1lBQ3hFLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzNCLENBQUM7UUFHRCxJQUFJLGVBQWU7WUFDbEIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQUNELElBQUksZUFBZSxDQUFDLEtBQTJCO1lBQzlDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7UUFDL0IsQ0FBQztRQUdELElBQUkscUJBQXFCO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDO1FBQ3BDLENBQUM7UUFDRCxJQUFJLHFCQUFxQixDQUFDLEtBQTJCO1lBQ3BELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUdELElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQy9CLENBQUM7UUFDRCxJQUFJLGdCQUFnQixDQUFDLEtBQTJCO1lBQy9DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDaEMsQ0FBQztLQUNEO0lBRUQsTUFBTSxvQkFBcUIsU0FBUSx3QkFBd0I7UUFHMUQsWUFDQyxLQUFhLEVBQ2IsV0FBb0IsRUFDWCxtQkFBK0UsRUFDaEYsVUFBcUUsRUFDcEUsSUFBb0IsRUFDckIsVUFBMkM7WUFFbkQsS0FBSyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFMdkIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUE0RDtZQUNoRixlQUFVLEdBQVYsVUFBVSxDQUEyRDtZQUNwRSxTQUFJLEdBQUosSUFBSSxDQUFnQjtZQUNyQixlQUFVLEdBQVYsVUFBVSxDQUFpQztZQXFCNUMsYUFBUSxHQUFHLEtBQUssQ0FBQztZQWpCeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxXQUFXO2dCQUMzQixDQUFDLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsTUFBTSxDQUFtRCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUMzSSxDQUFDLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQztZQUVkLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUMvQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUM7WUFDL0MsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDO1lBQzNELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQztRQUNsRCxDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFDRCxJQUFJLFNBQVMsQ0FBQyxLQUFzQztZQUNuRCxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN6QixDQUFDO1FBR0QsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxLQUFjO1lBQ3pCLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUN6RCxDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQzdCLENBQUM7S0FDRDtJQUVELElBQUssNkJBYUo7SUFiRCxXQUFLLDZCQUE2QjtRQUNqQzs7V0FFRztRQUNILGlGQUFRLENBQUE7UUFDUjs7V0FFRztRQUNILCtGQUFlLENBQUE7UUFDZjs7V0FFRztRQUNILCtGQUFlLENBQUE7SUFDaEIsQ0FBQyxFQWJJLDZCQUE2QixLQUE3Qiw2QkFBNkIsUUFhakM7SUFFRCxNQUFNLHlCQUEwQixTQUFRLHdCQUF3QjtRQVMvRCxZQUNDLEtBQWEsRUFDSiw0QkFBNkUsRUFDN0UsU0FBOEI7WUFFdkMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFIdEIsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUFpRDtZQUM3RSxjQUFTLEdBQVQsU0FBUyxDQUFxQjtZQVh4QyxhQUFRLEdBQUcsSUFBSSxLQUFLLEVBQXdCLENBQUM7WUFDN0M7Ozs7ZUFJRztZQUNILHlCQUFvQixHQUFHLDZCQUE2QixDQUFDLElBQUksQ0FBQztRQVExRCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLHNCQUFzQjtRQUMzQixTQUFTLENBQUMsT0FBMEI7WUFFbkMsSUFBSSxPQUFPLFlBQVkseUJBQXlCLEVBQUUsQ0FBQztnQkFDbEQsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQTBCO1lBQ3ZDLElBQUksT0FBTyxZQUFZLG9CQUFvQixFQUFFLENBQUM7Z0JBQzdDLE9BQU8sNEJBQTRCLENBQUMsRUFBRSxDQUFDO1lBQ3hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLGlDQUFpQyxDQUFDLEVBQUUsQ0FBQztZQUM3QyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsTUFBTSwrQkFBK0I7UUFFcEMsa0JBQWtCO1lBQ2pCLE9BQU8sSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxZQUFZLENBQUMsT0FBMEI7WUFDdEMsT0FBTyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUs7Z0JBQzlCLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxhQUFhLEtBQUssT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7Z0JBQ3hELENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBQzFCLENBQUM7UUFFRCxhQUFhO1lBQ1osT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELE9BQU8sQ0FBQyxPQUEwQjtZQUNqQyxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQ3BELENBQUM7UUFFRCxTQUFTLENBQUMsT0FBMEI7WUFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLE9BQU8sWUFBWSxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hFLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPO2dCQUNOLElBQUksS0FBSyxLQUFLLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7YUFDOUMsQ0FBQztRQUNILENBQUM7S0FDRDtJQUVELE1BQWUsMEJBQTBCO1FBR3hDLFlBQ2tCLGFBQXlDO1lBQXpDLGtCQUFhLEdBQWIsYUFBYSxDQUE0QjtRQUN2RCxDQUFDO1FBRUwsc0ZBQXNGO1FBQ3RGLGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxNQUFNLElBQUksR0FBZ0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQy9DLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztZQUVqRSxXQUFXO1lBQ1gsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUM1RixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLDJCQUEyQjtvQkFDN0QsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsNkVBQTZFO2dCQUNsRyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxRQUFRLEdBQXFCLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUM7WUFDMUYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO1lBRWhDLE9BQU87WUFDUCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7WUFDMUQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztZQUUxRCxRQUFRO1lBQ1IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLHFCQUFTLENBQUMsSUFBSSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLDRCQUE0QixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUN6SixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsSUFBSSxHQUFxQixHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7WUFFM0YsYUFBYTtZQUNiLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksaUNBQWUsQ0FBQyxtQkFBbUIsRUFBRSxhQUFFLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU1QyxTQUFTO1lBQ1QsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUkscUJBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDakksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFeEMsWUFBWTtZQUNaLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUM7WUFFMUUsVUFBVTtZQUNWLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxxQkFBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuSCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFM0MsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsZUFBZSxDQUFDLElBQWlDO1lBQ2hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVELGNBQWMsQ0FBQyxRQUE0QyxFQUFFLE1BQWMsRUFBRSxJQUFpQztZQUM3RyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN4QixDQUFDO0tBSUQ7SUFFRCxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLDBCQUFnRDs7aUJBQzFFLE9BQUUsR0FBRyxlQUFlLEFBQWxCLENBQW1CO1FBS3JDLFlBQ0MsYUFBeUMsRUFDMUIsWUFBNEM7WUFFM0QsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRlcsaUJBQVksR0FBWixZQUFZLENBQWU7WUFMNUQsOENBQThDO1lBQzdCLGtDQUE2QixHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1FBT3pGLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLDhCQUE0QixDQUFDLEVBQUUsQ0FBQztRQUN4QyxDQUFDO1FBRVEsY0FBYyxDQUFDLFNBQXNCO1lBQzdDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFN0MsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDcEcsSUFBSSxDQUFDLE9BQWdDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQ3hFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxhQUFhLENBQUMsSUFBMkMsRUFBRSxLQUFhLEVBQUUsSUFBaUM7WUFDMUcsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDO1lBQzFDLE1BQU0sUUFBUSxHQUFtQixPQUFPLENBQUMsSUFBSSxDQUFDO1lBRTlDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDeEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7WUFFbEQsTUFBTSxFQUFFLGVBQWUsRUFBRSxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUU3RSxPQUFPO1lBQ1AsSUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sSUFBSSxHQUFHLElBQUEsY0FBTSxFQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNJLE1BQU0sT0FBTyxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLHVCQUF1QixDQUFDO2dCQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMseUJBQXlCLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQy9GLENBQUM7WUFFRCxRQUFRO1lBQ1IsSUFBSSxnQkFBa0UsQ0FBQztZQUN2RSxnREFBZ0Q7WUFDaEQsNkNBQTZDO1lBQzdDLGFBQWE7WUFDYixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3JELGdCQUFnQixHQUFHO29CQUNsQixRQUFRLEVBQUU7d0JBQ1QsS0FBSyxFQUFFLE9BQU8sQ0FBQyxlQUFlO3dCQUM5QixpQkFBaUIsRUFBRSxJQUFJO3FCQUN2QjtvQkFDRCw0QkFBNEIsRUFBRSxPQUFPLENBQUMsZUFBZTtpQkFDckQsQ0FBQztZQUNILENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBMkI7Z0JBQ3ZDLE9BQU8sRUFBRSxlQUFlLElBQUksRUFBRTtnQkFDOUIseUVBQXlFO2dCQUN6RSxnQkFBZ0I7Z0JBQ2hCLGtCQUFrQixFQUFFLHFCQUFxQixJQUFJLEVBQUU7Z0JBQy9DLG1CQUFtQixFQUFFLElBQUk7YUFDekIsQ0FBQztZQUNGLE9BQU8sQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQztZQUM1QyxPQUFPLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDakMsT0FBTyxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDO1lBQy9DLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUV6RSxhQUFhO1lBQ2IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXpDLFNBQVM7WUFDVCxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxLQUF1RCxDQUFDO2dCQUM1RCx5RUFBeUU7Z0JBQ3pFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQzFCLEtBQUssR0FBRzt3QkFDUCxRQUFRLEVBQUU7NEJBQ1QsS0FBSyxFQUFFLE9BQU8sQ0FBQyxVQUFVOzRCQUN6QixpQkFBaUIsRUFBRSxJQUFJO3lCQUN2Qjt3QkFDRCw0QkFBNEIsRUFBRSxPQUFPLENBQUMsVUFBVTtxQkFDaEQsQ0FBQztnQkFDSCxDQUFDO2dCQUNELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRTtvQkFDbkQsT0FBTyxFQUFFLGdCQUFnQjtvQkFDekIsS0FBSztvQkFDTCxtQkFBbUIsRUFBRSxJQUFJO2lCQUN6QixDQUFDLENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDNUMsQ0FBQztZQUVELFlBQVk7WUFDWixJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdkMsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXRGLFVBQVU7WUFDVixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQ2pDLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUEsMENBQXdCLEVBQzFFLE1BQU0sRUFDTixNQUFNLEtBQUssRUFBRSxFQUNiLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQ2pFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN6QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDRixDQUFDO1FBRVEsY0FBYyxDQUFDLE9BQThDLEVBQUUsTUFBYyxFQUFFLElBQWlDO1lBQ3hILElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCwwQkFBMEIsQ0FBQyxJQUEwQjtZQUNwRCxPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVPLG9CQUFvQixDQUFDLElBQTBCO1lBQ3RELElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2RyxDQUFDO1FBRU8sdUJBQXVCLENBQUMsSUFBMEI7WUFDekQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM3RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqRCxDQUFDO1FBQ0YsQ0FBQzs7SUFuSkksNEJBQTRCO1FBUS9CLFdBQUEsNEJBQWEsQ0FBQTtPQVJWLDRCQUE0QixDQW9KakM7SUFFRCxNQUFNLGlDQUFrQyxTQUFRLDBCQUFxRDtRQUFyRzs7WUFHQyw2RkFBNkY7WUFDN0Ysa0NBQWtDO1lBQ2pCLGdDQUEyQixHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO1FBa0g3RixDQUFDO2lCQXRIZ0IsT0FBRSxHQUFHLG9CQUFvQixBQUF2QixDQUF3QjtRQU0xQyxJQUFJLFVBQVU7WUFDYixPQUFPLGlDQUFpQyxDQUFDLEVBQUUsQ0FBQztRQUM3QyxDQUFDO1FBRUQsSUFBSSxpQkFBaUI7WUFDcEIsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELGtCQUFrQixDQUFDLFNBQW9DO1lBQ3RELE9BQU8sSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRVEsYUFBYSxDQUFDLElBQWdELEVBQUUsS0FBYSxFQUFFLElBQWlDO1lBQ3hILE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQztZQUMxQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNqRixNQUFNLFFBQVEsR0FBd0IsT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUV4RCxNQUFNLEVBQUUsZUFBZSxFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLEdBQUcsT0FBTyxDQUFDO1lBRTdFLE9BQU87WUFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUV6QixRQUFRO1lBQ1IsSUFBSSxnQkFBa0UsQ0FBQztZQUN2RSxnREFBZ0Q7WUFDaEQsNkNBQTZDO1lBQzdDLGFBQWE7WUFDYixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3JELGdCQUFnQixHQUFHO29CQUNsQixRQUFRLEVBQUU7d0JBQ1QsS0FBSyxFQUFFLE9BQU8sQ0FBQyxlQUFlO3dCQUM5QixpQkFBaUIsRUFBRSxJQUFJO3FCQUN2QjtvQkFDRCw0QkFBNEIsRUFBRSxPQUFPLENBQUMsZUFBZTtpQkFDckQsQ0FBQztZQUNILENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBMkI7Z0JBQ3ZDLE9BQU8sRUFBRSxlQUFlLElBQUksRUFBRTtnQkFDOUIseUVBQXlFO2dCQUN6RSxnQkFBZ0I7Z0JBQ2hCLGtCQUFrQixFQUFFLHFCQUFxQixJQUFJLEVBQUU7Z0JBQy9DLG1CQUFtQixFQUFFLElBQUk7YUFDekIsQ0FBQztZQUNGLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUV6RSxTQUFTO1lBQ1QsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksS0FBdUQsQ0FBQztnQkFDNUQseUVBQXlFO2dCQUN6RSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUMxQixLQUFLLEdBQUc7d0JBQ1AsUUFBUSxFQUFFOzRCQUNULEtBQUssRUFBRSxPQUFPLENBQUMsVUFBVTs0QkFDekIsaUJBQWlCLEVBQUUsSUFBSTt5QkFDdkI7d0JBQ0QsNEJBQTRCLEVBQUUsT0FBTyxDQUFDLFVBQVU7cUJBQ2hELENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUU7b0JBQ25ELE9BQU8sRUFBRSxnQkFBZ0I7b0JBQ3pCLEtBQUs7b0JBQ0wsbUJBQW1CLEVBQUUsSUFBSTtpQkFDekIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQzVDLENBQUM7WUFFRCxZQUFZO1lBQ1osSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztZQUU5RCxVQUFVO1lBQ1YsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUNqQyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFBLDBDQUF3QixFQUMxRSxNQUFNLEVBQ04sTUFBTSxLQUFLLEVBQUUsRUFDYixHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsNEJBQTRCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUNwRixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRVEsY0FBYyxDQUFDLE9BQW1ELEVBQUUsTUFBYyxFQUFFLElBQWlDO1lBQzdILElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDM0QsQ0FBQztZQUNELEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRU8sWUFBWSxDQUFDLFNBQW9DO1lBQ3hELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3RyxDQUFDO1FBRU8sZUFBZSxDQUFDLFNBQW9DO1lBQzNELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsMkJBQTJCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEQsQ0FBQztRQUNGLENBQUM7O0lBR0ssSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBa0Q3QyxZQUNTLE1BQW1CLEVBQ25CLGFBQTZCLEVBQzdCLGtCQUE2QyxFQUNyRCxFQUFVLEVBQ2Esb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBTkEsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDN0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUEyQjtZQW5EckMsZUFBVSxHQUFHLElBQUksZUFBTyxFQUF5QixDQUFDO1lBQ25FOztjQUVFO1lBQ08sY0FBUyxHQUFpQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUV4RCxhQUFRLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNoRDs7Y0FFRTtZQUNPLFlBQU8sR0FBZ0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFFbkMsZ0NBQTJCLEdBQUcsSUFBSSxlQUFPLEVBQVcsQ0FBQztZQUN0RSwrQkFBMEIsR0FBbUIsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQztZQUVuRSwyQkFBc0IsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBQ2hFLDBCQUFxQixHQUFrQixJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBRXhELDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7WUFDaEUsMEJBQXFCLEdBQWtCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFFeEQsOEJBQXlCLEdBQUcsSUFBSSxlQUFPLEVBQW9CLENBQUM7WUFDN0UsNkJBQXdCLEdBQTRCLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUM7WUFFeEUsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQTZDLENBQUM7WUFDL0Ysc0JBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUVqQyxnQ0FBMkIsR0FBRyxJQUFJLGVBQU8sRUFBa0MsQ0FBQztZQUM3RiwrQkFBMEIsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsS0FBSyxDQUFDO1lBRW5ELG9DQUErQixHQUFHLElBQUksZUFBTyxFQUF3QyxDQUFDO1lBTXRGLG9CQUFlLEdBQUcsSUFBSSxlQUFPLEVBQW9ELENBQUM7WUFDM0YsbUJBQWMsR0FBRyxJQUFJLEtBQUssRUFBaUIsQ0FBQztZQUM1QyxpQkFBWSxHQUFHLElBQUksS0FBSyxFQUFxQixDQUFDO1lBQzlDLGtCQUFhLEdBQUcsSUFBSSxLQUFLLEVBQXdCLENBQUM7WUFDMUQscURBQXFEO1lBQ3BDLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUU1RSx1R0FBdUc7WUFDdkcsb0dBQW9HO1lBQ3BHLDBFQUEwRTtZQUNsRSw2QkFBd0IsR0FBRyxJQUFJLENBQUM7WUErRmhDLHdCQUFtQixHQUFHLEtBQUssQ0FBQztZQVE1QixtQkFBYyxHQUFHLEtBQUssQ0FBQztZQVF2QixrQkFBYSxHQUFHLElBQUksQ0FBQztZQVFyQixzQkFBaUIsR0FBMkIsT0FBTyxDQUFDO1lBUXBELGlCQUFZLEdBQUcsSUFBSSxDQUFDO1lBUXBCLGlCQUFZLEdBQUcsSUFBSSxDQUFDO1lBN0gzQixJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLGlDQUFpQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxhQUFhLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDRCQUE0QixFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3RHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQzlELENBQUEsaUNBQTRDLENBQUEsRUFDNUMsWUFBWSxFQUNaLElBQUksQ0FBQyxVQUFVLEVBQ2YsSUFBSSxzQkFBc0IsRUFBRSxFQUM1QixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQzdDO2dCQUNDLHFCQUFxQixFQUFFLElBQUksK0JBQStCLEVBQUU7Z0JBQzVELGdCQUFnQixFQUFFLEtBQUs7Z0JBQ3ZCLHdCQUF3QixFQUFFLEtBQUs7Z0JBQy9CLCtCQUErQixFQUFFLElBQUk7Z0JBQ3JDLGtCQUFrQixFQUFFLGlDQUFrQixDQUFDLElBQUk7Z0JBQzNDLGlCQUFpQixFQUFFLEtBQUs7Z0JBQ3hCLE1BQU0sRUFBRSxDQUFDO2dCQUNULG1CQUFtQixFQUFFLEtBQUs7Z0JBQzFCLDBCQUEwQixFQUFFLElBQUk7Z0JBQ2hDLGdCQUFnQixFQUFFO29CQUNqQixLQUFLLEVBQUUsT0FBTyxDQUFDLEVBQUU7d0JBQ2hCLDhGQUE4Rjt3QkFDOUYsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDO3dCQUNuRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQzs0QkFDNUIsT0FBTyxFQUFFLENBQUM7d0JBQ1gsQ0FBQzt3QkFDRCx1R0FBdUc7d0JBQ3ZHLElBQUksUUFBUSxDQUFDLEVBQUUsS0FBSyxTQUFTLEVBQUUsQ0FBQzs0QkFDL0IsT0FBTyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUNwQixDQUFDO3dCQUNELElBQUksRUFBRSxHQUFHLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNuQyxFQUFFLElBQUksaUJBQWlCLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDOUMsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDOzRCQUNuQyxFQUFFLElBQUksWUFBWSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3JDLENBQUM7d0JBQ0QsT0FBTyxFQUFFLENBQUM7b0JBQ1gsQ0FBQztpQkFDRDtnQkFDRCx1QkFBdUIsRUFBRSxJQUFJO2FBQzdCLENBQ0QsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxnQ0FBZ0M7UUFHaEMsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUNmLGFBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDLEVBQ2xGLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQTZCLEVBQUUsQ0FBQyxDQUFDLFlBQVksb0JBQW9CLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQzVHLENBQUM7UUFDSCxDQUFDO1FBR0QsSUFBSSxvQkFBb0I7WUFDdkIsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUNmLGFBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDLEVBQ3RGLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDTCxLQUFLLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQTZCLEVBQUUsQ0FBQyxDQUFDLFlBQVksb0JBQW9CLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUM5RyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFlBQVk7YUFDckIsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUM3QixDQUFDO1FBRUQsSUFBSSxTQUFTLENBQUMsU0FBaUI7WUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxJQUFJLFNBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQzdCLENBQUM7UUFFRCxJQUFJLFNBQVMsQ0FBQyxLQUFvQjtZQUNqQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxLQUFjO1lBQ3pCLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3ZFLENBQUM7UUFHRCxJQUFJLGtCQUFrQjtZQUNyQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsSUFBSSxrQkFBa0IsQ0FBQyxLQUFjO1lBQ3BDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxLQUFLLENBQUM7UUFDbEMsQ0FBQztRQUdELElBQUksYUFBYTtZQUNoQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQUNELElBQUksYUFBYSxDQUFDLEtBQWM7WUFDL0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDN0IsQ0FBQztRQUdELElBQUksWUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBQ0QsSUFBSSxZQUFZLENBQUMsS0FBYztZQUM5QixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUM1QixDQUFDO1FBR0QsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksZ0JBQWdCLENBQUMsS0FBNkI7WUFDakQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztRQUNoQyxDQUFDO1FBR0QsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFDRCxJQUFJLFdBQVcsQ0FBQyxLQUFjO1lBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzNCLENBQUM7UUFHRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUNELElBQUksV0FBVyxDQUFDLEtBQWM7WUFDN0IsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDM0IsQ0FBQztRQUVELFlBQVk7UUFFWiw0QkFBNEI7UUFFcEIsa0JBQWtCO1lBQ3pCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQ25DLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQy9CLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxDQUFDO1FBQ2pELENBQUM7UUFFTyxrQkFBa0I7WUFDekIsZ0RBQWdEO1lBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3ZDLE1BQU0sS0FBSyxHQUFHLElBQUkscUNBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLFFBQVEsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN2Qjt3QkFDQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQ3RCLE1BQU07b0JBQ1A7d0JBQ0MsSUFBSSxzQkFBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7NEJBQ3pDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDekMsQ0FBQzt3QkFDRCxNQUFNO29CQUNQLDhEQUE4RDtvQkFDOUQsNkJBQW9CLENBQUMsQ0FBQyxDQUFDO3dCQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNyQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ3RCLENBQUM7d0JBQ0QsTUFBTTtvQkFDUCxDQUFDO29CQUNELGlFQUFpRTtvQkFDakUsK0JBQXNCLENBQUMsQ0FBQyxDQUFDO3dCQUN4QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNyQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQzVGLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ3RCLENBQUM7d0JBQ0QsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyx5QkFBeUI7WUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDbEYsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGtEQUFrRDtvQkFDbkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sMkJBQTJCO1lBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JGLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8seUJBQXlCO1lBQ2hDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUVPLHNCQUFzQjtZQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMzQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZixDQUFDLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUVoQywyQ0FBMkM7b0JBQzNDLDBDQUEwQztvQkFDMUMsd0NBQXdDO29CQUN4QywwQ0FBMEM7b0JBQzFDLCtCQUErQjtvQkFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sdUJBQXVCO1lBQzlCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLEVBQUU7Z0JBQy9DLDhFQUE4RTtnQkFDOUUsOERBQThEO2dCQUM5RCxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxZQUFZLGlCQUFpQixFQUFFLENBQUM7b0JBQ3hELE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDakIsT0FBTztnQkFDUixDQUFDO2dCQUNEO2dCQUNDLG9FQUFvRTtnQkFDcEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxZQUFZLGlCQUFpQixDQUFDO29CQUM1RCxvREFBb0Q7b0JBQ3BELEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxhQUFxQixFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsT0FBZSxDQUFDLEVBQy9FLENBQUM7b0JBQ0YsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksQ0FBQztvQkFDSixNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUU7d0JBQ2hDLElBQUksQ0FBQyxDQUFDLE9BQU8sWUFBWSxvQkFBb0IsRUFBRSxDQUFDOzRCQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDM0IsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1osOENBQThDO29CQUM5QyxJQUFJLENBQUMsSUFBQSw0QkFBbUIsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM3QixNQUFNLENBQUMsQ0FBQztvQkFDVCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDeEMsb0VBQW9FO2dCQUNwRSxvRUFBb0U7Z0JBQ3BFLHFEQUFxRDtnQkFDckQsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBcUIsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQWUsQ0FBQyxFQUFFLENBQUM7b0JBQ3RGLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRDs7O1dBR0c7UUFDSyx3Q0FBd0M7WUFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM5QyxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBOEI7b0JBQ3pFLDBEQUEwRDtvQkFDMUQsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDUixLQUFLLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUNuRSxNQUFNLEtBQUssR0FBRyxTQUFTLEtBQUssTUFBTSxDQUFDO29CQUNuQyxxREFBcUQ7b0JBQ3JELE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsR0FBRyw2QkFBNkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDckcsSUFBSSxhQUFhLEtBQUssS0FBSyxFQUFFLENBQUM7d0JBQzdCLElBQUksS0FBSyxFQUFFLENBQUM7NEJBQ1gsU0FBUyxDQUFDLG9CQUFvQixJQUFJLDZCQUE2QixDQUFDLFdBQVcsQ0FBQzt3QkFDN0UsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLFNBQVMsQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLDZCQUE2QixDQUFDLFdBQVcsQ0FBQzt3QkFDOUUsQ0FBQzt3QkFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3pDLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxPQUFPO29CQUN2QixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUE4QjtvQkFDckUsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDUixLQUFLLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUNuRSxJQUFJLFNBQVMsS0FBSyxNQUFNLEVBQUUsQ0FBQzt3QkFDMUIsU0FBUztvQkFDVixDQUFDO29CQUNELE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsR0FBRyw2QkFBNkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDcEcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUNuQixTQUFTLENBQUMsb0JBQW9CLElBQUksNkJBQTZCLENBQUMsV0FBVyxDQUFDO3dCQUM1RSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3hDLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxPQUFPO29CQUN2QixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUE4QjtvQkFDckUsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDUixLQUFLLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUNuRSxJQUFJLFNBQVMsS0FBSyxNQUFNLEVBQUUsQ0FBQzt3QkFDMUIsU0FBUztvQkFDVixDQUFDO29CQUNELE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsR0FBRyw2QkFBNkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDcEcsSUFBSSxZQUFZLEVBQUUsQ0FBQzt3QkFDbEIsU0FBUyxDQUFDLG9CQUFvQixJQUFJLENBQUMsNkJBQTZCLENBQUMsV0FBVyxDQUFDO3dCQUM3RSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxnQ0FBZ0M7WUFDdkMsMEZBQTBGO1lBQzFGLGdEQUFnRDtZQUNoRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2xELE1BQU0seUJBQXlCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQTZCLEVBQUUsQ0FBQyxDQUFDLFlBQVksb0JBQW9CLENBQUMsQ0FBQztnQkFDekgsSUFBSSx5QkFBeUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDNUQsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSx5QkFBeUIsRUFBRSxDQUFDO3dCQUNuRixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDakQsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDckMsQ0FBQztvQkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxZQUFZO1FBRVosd0JBQXdCO1FBRXhCLG9CQUFvQjtZQUNuQixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxlQUFlO1lBQ2QsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDckUsQ0FBQztRQUVELGVBQWU7WUFDZCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3pELENBQUM7UUFFRCxvQkFBb0IsQ0FBQyxPQUFnQjtZQUNwQyxJQUFJLENBQUM7Z0JBQ0osSUFBSSxDQUFDLHdCQUF3QixHQUFHLEtBQUssQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7d0JBQ2xELHFEQUFxRDt3QkFDckQsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7b0JBQzNCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztnQkFDckMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7UUFFRCxXQUFXLENBQUMsYUFBOEI7WUFDekMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO1lBQ3BDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3RFLElBQUksdUJBQThELENBQUM7WUFDbkUsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEtBQUssRUFBd0IsQ0FBQztZQUN2RCxJQUFJLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNoRSxJQUFJLE9BQTBCLENBQUM7Z0JBQy9CLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUUsQ0FBQztvQkFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDbkIsNkRBQTZEO3dCQUM3RCxPQUFPLE1BQU0sQ0FBQztvQkFDZixDQUFDO29CQUNELHVCQUF1QixHQUFHLElBQUkseUJBQXlCLENBQ3RELEtBQUssRUFDTCxDQUFDLEtBQXFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsRUFDbkYsSUFBSSxDQUNKLENBQUM7b0JBQ0YsT0FBTyxHQUFHLHVCQUF1QixDQUFDO2dCQUNuQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxRQUFRLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUNsRSxJQUFJLFNBQTBDLENBQUM7b0JBQy9DLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNwRSwwRUFBMEU7d0JBQzFFLHVCQUF1QixHQUFHLFNBQVMsQ0FBQzt3QkFDcEMsU0FBUyxHQUFHLFFBQVEsQ0FBQztvQkFDdEIsQ0FBQztvQkFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLG9CQUFvQixDQUNuQyxLQUFLLEVBQ0wsV0FBVyxFQUNYLENBQUMsS0FBZ0QsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxFQUNyRixJQUFJLENBQUMsZUFBZSxFQUNwQixJQUFJLEVBQ0osU0FBUyxDQUNULENBQUM7b0JBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRTdCLElBQUksdUJBQXVCLEVBQUUsQ0FBQzt3QkFDN0IsdUJBQXVCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDM0MsT0FBTyxNQUFNLENBQUM7b0JBQ2YsQ0FBQztvQkFDRCxPQUFPLEdBQUcsR0FBRyxDQUFDO2dCQUNmLENBQUM7Z0JBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDckIsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLEVBQUUsSUFBSSxLQUFLLEVBQXFCLENBQUMsQ0FBQztZQUVuQyxNQUFNLFFBQVEsR0FBRyxJQUFJLEtBQUssRUFBeUMsQ0FBQztZQUNwRSxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7WUFDckIsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3pDLElBQUksT0FBTyxZQUFZLHlCQUF5QixFQUFFLENBQUM7b0JBQ2xELFFBQVEsQ0FBQyxJQUFJLENBQUM7d0JBQ2IsT0FBTzt3QkFDUCxXQUFXLEVBQUUsS0FBSzt3QkFDbEIsU0FBUyxFQUFFLEtBQUs7d0JBQ2hCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7NEJBQ3BDLE9BQU8sRUFBRSxDQUFDOzRCQUNWLFdBQVcsRUFBRSxLQUFLOzRCQUNsQixTQUFTLEVBQUUsS0FBSzt5QkFDaEIsQ0FBQyxDQUFDO3FCQUNILENBQUMsQ0FBQztvQkFDSCxZQUFZLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsK0JBQStCO2dCQUM3RSxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsUUFBUSxDQUFDLElBQUksQ0FBQzt3QkFDYixPQUFPO3dCQUNQLFdBQVcsRUFBRSxLQUFLO3dCQUNsQixTQUFTLEVBQUUsS0FBSztxQkFDaEIsQ0FBQyxDQUFDO29CQUNILFlBQVksRUFBRSxDQUFDO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxnQkFBZ0I7WUFDZixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO1FBQ25DLENBQUM7UUFFRCxrQkFBa0I7WUFDakIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtpQkFDMUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDMUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDaEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUF1QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxLQUF1QjtZQUN6QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDO2lCQUMvRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQTZCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUIsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxtQkFBbUI7WUFDbEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLFlBQVksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFRCxtQkFBbUI7WUFDbEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRTtpQkFDOUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUUsQ0FBMEIsQ0FBQyxJQUFJLENBQUM7aUJBQ2hGLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsbUJBQW1CLENBQUMsS0FBdUI7WUFDMUMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztpQkFDL0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUE2QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxrQkFBa0I7WUFDakIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7aUJBQzlDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsa0JBQWtCLENBQUMsS0FBdUI7WUFDekMsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxLQUFLLENBQUM7Z0JBQ3RDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQzFCLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ25CLENBQUM7Z0JBQ0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzFDLHFEQUFxRDtvQkFDckQsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0MsQ0FBQztZQUNGLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUF5QjtZQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzFFLElBQUksR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFDbEMsQ0FBQztZQUVELFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQ2QsS0FBSyxtQkFBbUIsQ0FBQyxLQUFLO29CQUM3QixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sWUFBWSxvQkFBb0IsQ0FBQyxDQUFDO29CQUNuRixNQUFNO2dCQUNQLEtBQUssbUJBQW1CLENBQUMsTUFBTTtvQkFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO29CQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM3QyxNQUFNO2dCQUNQLEtBQUssbUJBQW1CLENBQUMsSUFBSTtvQkFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7b0JBQy9DLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3pFLE1BQU07Z0JBQ1AsS0FBSyxtQkFBbUIsQ0FBQyxJQUFJO29CQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO3dCQUN0RCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxZQUFZLG9CQUFvQixDQUFDLEVBQUUsQ0FBQzs0QkFDbEQsT0FBTyxLQUFLLENBQUM7d0JBQ2QsQ0FBQzt3QkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzdCLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUMsQ0FBQyxDQUFDO29CQUNILE1BQU07Z0JBQ1AsS0FBSyxtQkFBbUIsQ0FBQyxRQUFRO29CQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO3dCQUMxRCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxZQUFZLG9CQUFvQixDQUFDLEVBQUUsQ0FBQzs0QkFDbEQsT0FBTyxLQUFLLENBQUM7d0JBQ2QsQ0FBQzt3QkFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDdEQsSUFBSSxNQUFNLEtBQUssSUFBSSxJQUFLLE1BQW9DLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDeEYsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUM5QixDQUFDOzZCQUFNLENBQUM7NEJBQ1AsMkVBQTJFOzRCQUMzRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDM0IsQ0FBQzt3QkFDRCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDLENBQUMsQ0FBQztvQkFDSCxNQUFNO2dCQUNQLEtBQUssbUJBQW1CLENBQUMsUUFBUTtvQkFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7d0JBQ3pDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLFlBQVksb0JBQW9CLENBQUMsRUFBRSxDQUFDOzRCQUNsRCxPQUFPLEtBQUssQ0FBQzt3QkFDZCxDQUFDO3dCQUNELElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDN0IsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsTUFBTTtnQkFDUCxLQUFLLG1CQUFtQixDQUFDLFlBQVk7b0JBQ3BDLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7d0JBQzdDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLFlBQVksb0JBQW9CLENBQUMsRUFBRSxDQUFDOzRCQUNsRCxPQUFPLEtBQUssQ0FBQzt3QkFDZCxDQUFDO3dCQUNELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUN0RCxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUssTUFBb0MsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDOzRCQUN4RixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzlCLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDM0IsQ0FBQzt3QkFDRCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDLENBQUMsQ0FBQztvQkFDSCxNQUFNO2dCQUNQLEtBQUssbUJBQW1CLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxvQkFBb0IsR0FBRyxLQUFLLENBQUM7b0JBQ2pDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7d0JBQ3RELElBQUksb0JBQW9CLEVBQUUsQ0FBQzs0QkFDMUIsMkRBQTJEOzRCQUMzRCxnQ0FBZ0M7NEJBQ2hDLE9BQU8sSUFBSSxDQUFDO3dCQUNiLENBQUM7d0JBRUQsSUFBSSxDQUFDLENBQUMsT0FBTyxZQUFZLHlCQUF5QixFQUFFLENBQUM7NEJBQ3BELG9CQUFvQixHQUFHLElBQUksQ0FBQzs0QkFDNUIsa0dBQWtHOzRCQUNsRyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQ0FDM0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDMUMsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLGtEQUFrRDtnQ0FDbEQscUNBQXFDO2dDQUNyQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUNqQyxDQUFDO3dCQUNGLENBQUM7NkJBQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxZQUFZLG9CQUFvQixFQUFFLENBQUM7NEJBQ3RELElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQ0FDekIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29DQUM5RCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0NBQzlCLENBQUM7cUNBQU0sQ0FBQztvQ0FDUCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dDQUNqQyxDQUFDO2dDQUNELE9BQU8sSUFBSSxDQUFDOzRCQUNiLENBQUM7aUNBQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQ0FDL0MsdUVBQXVFO2dDQUN2RSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dDQUNoQyxPQUFPLElBQUksQ0FBQzs0QkFDYixDQUFDO3dCQUNGLENBQUM7d0JBQ0QsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7d0JBQ3RCLHlEQUF5RDt3QkFDekQsZUFBZTt3QkFDZixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQzt3QkFDL0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUUsQ0FBQztvQkFDRCxNQUFNO2dCQUNQLENBQUM7Z0JBQ0QsS0FBSyxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLElBQUksWUFBMkMsQ0FBQztvQkFDaEQsNERBQTREO29CQUM1RCx5REFBeUQ7b0JBQ3pELDRCQUE0QjtvQkFDNUIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDO29CQUMzRCxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO3dCQUMxRCxJQUFJLENBQUMsQ0FBQyxPQUFPLFlBQVkseUJBQXlCLEVBQUUsQ0FBQzs0QkFDcEQsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQ0FDcEIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29DQUNuQixJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3Q0FDM0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29DQUM5QixDQUFDO3lDQUFNLENBQUM7d0NBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztvQ0FDakMsQ0FBQztvQ0FDRCxZQUFZLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ3RDLENBQUM7NEJBQ0YsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLGNBQWMsR0FBRyxJQUFJLENBQUM7NEJBQ3ZCLENBQUM7d0JBQ0YsQ0FBQzs2QkFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLFlBQVksb0JBQW9CLEVBQUUsQ0FBQzs0QkFDdEQsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dDQUNuQixJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7b0NBQ3pCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3Q0FDOUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29DQUM5QixDQUFDO3lDQUFNLENBQUM7d0NBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztvQ0FDakMsQ0FBQztvQ0FFRCxZQUFZLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQ0FDMUIsQ0FBQztxQ0FBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29DQUMvQyx1RUFBdUU7b0NBQ3ZFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0NBQ2hDLE9BQU8sSUFBSSxDQUFDO2dDQUNiLENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO3dCQUNELE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUMsQ0FBQyxDQUFDO29CQUNILElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ2xCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztvQkFDckMsQ0FBQztvQkFDRCxNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELFVBQVU7WUFDVCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBRUQsUUFBUTtZQUNQLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFrQjtZQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHO1lBQzVELGlEQUFpRDtZQUNqRCxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFO2dCQUMvQixrRUFBa0U7a0JBQ2hFLENBQ0YsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDWCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBYTtZQUNuQixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO2dCQUNuRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNwQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQztZQUNsQyxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXJCLGtCQUFrQjtZQUNsQixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFDckYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ3BDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO29CQUNwQyxPQUFPLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO29CQUMxQyxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO29CQUNyQyxPQUFPLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztvQkFDdkIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3pFLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNsQixPQUFPLENBQUMsU0FBUyxHQUFHLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUMzRyxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELHFGQUFxRjtpQkFDaEYsQ0FBQztnQkFDTCxJQUFJLGdCQUFpRCxDQUFDO2dCQUN0RCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDbkMsSUFBSSxlQUFxQyxDQUFDO29CQUMxQyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxPQUFPLEVBQUUsQ0FBQzt3QkFDdkMsZUFBZSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUEsa0NBQXFCLEVBQUMsS0FBSyxFQUFFLElBQUEsZ0NBQW1CLEVBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBQ3JJLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxlQUFlLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsMEJBQTBCLENBQUMsbUJBQW1CLEVBQUUsSUFBQSxnQ0FBbUIsRUFBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDeEosQ0FBQztvQkFDRCxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBQSxrQ0FBcUIsRUFBQyxLQUFLLEVBQUUsSUFBQSxnQ0FBbUIsRUFBQyxPQUFPLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBQ2xLLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBQSxrQ0FBcUIsRUFBQyxLQUFLLEVBQUUsSUFBQSxnQ0FBbUIsRUFBQyxPQUFPLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBRW5KLElBQUksZUFBZSxJQUFJLHFCQUFxQixJQUFJLGdCQUFnQixFQUFFLENBQUM7d0JBQ2xFLE9BQU8sQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO3dCQUMxQyxPQUFPLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7d0JBQ3RELE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQzt3QkFDNUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7b0JBQ3hCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxPQUFPLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQzt3QkFDcEMsT0FBTyxDQUFDLHFCQUFxQixHQUFHLFNBQVMsQ0FBQzt3QkFDMUMsT0FBTyxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQzt3QkFDckMsT0FBTyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ2pFLENBQUM7b0JBRUQseUZBQXlGO29CQUN6RixJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDbEIsT0FBTyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7b0JBQy9CLENBQUM7eUJBQU0sSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQzlCLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO29CQUN2QixDQUFDO29CQUVELGlFQUFpRTtvQkFDakUsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDdkIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ3pFLGdCQUFnQixHQUFHLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQzt3QkFDM0YsSUFBSSxnQkFBZ0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDekMsT0FBTyxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQzs0QkFDckMsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO3dCQUM5QixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUzRSxnQkFBZ0I7WUFDaEIsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMvQixNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEQsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDM0IsT0FBTyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxJQUFJLGdCQUF1RCxDQUFDO1lBQzVELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNyRSxJQUFJLE9BQU8sWUFBWSxvQkFBb0IsRUFBRSxDQUFDO29CQUM3QyxJQUFJLGdCQUFnQixFQUFFLENBQUM7d0JBQ3RCLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3pDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN0QixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxPQUFPLFlBQVkseUJBQXlCLEVBQUUsQ0FBQztvQkFDekQsT0FBTyxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7b0JBQ3RCLGdCQUFnQixHQUFHLE9BQU8sQ0FBQztvQkFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdEIsQ0FBQztnQkFDRCxPQUFPLE1BQU0sQ0FBQztZQUNmLENBQUMsRUFBRSxJQUFJLEtBQUssRUFBcUIsQ0FBQyxDQUFDO1lBRW5DLE1BQU0sUUFBUSxHQUFHLElBQUksS0FBSyxFQUF5QyxDQUFDO1lBQ3BFLEtBQUssTUFBTSxPQUFPLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksT0FBTyxZQUFZLHlCQUF5QixFQUFFLENBQUM7b0JBQ2xELFFBQVEsQ0FBQyxJQUFJLENBQUM7d0JBQ2IsT0FBTzt3QkFDUCxXQUFXLEVBQUUsS0FBSzt3QkFDbEIsU0FBUyxFQUFFLEtBQUs7d0JBQ2hCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7NEJBQ3BDLE9BQU8sRUFBRSxDQUFDOzRCQUNWLFdBQVcsRUFBRSxLQUFLOzRCQUNsQixTQUFTLEVBQUUsS0FBSzt5QkFDaEIsQ0FBQyxDQUFDO3FCQUNILENBQUMsQ0FBQztnQkFDSixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsUUFBUSxDQUFDLElBQUksQ0FBQzt3QkFDYixPQUFPO3dCQUNQLFdBQVcsRUFBRSxLQUFLO3dCQUNsQixTQUFTLEVBQUUsS0FBSztxQkFDaEIsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDNUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZDLDhGQUE4RjtZQUM5RiwrQkFBK0I7WUFDL0IsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUM7b0JBQ3pDLFFBQVEsRUFBRSxFQUFFO2lCQUNaLENBQUMsQ0FBQztZQUNKLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRXBCLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV2RCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxjQUFjO1lBQ2IsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxLQUFLLENBQUM7Z0JBQ3RDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUE2QixFQUFFLENBQUMsQ0FBQyxZQUFZLG9CQUFvQixDQUFDLENBQUM7Z0JBQ25ILE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDckQsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO3dCQUMvQixxREFBcUQ7d0JBQ3JELE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUM7b0JBQy9CLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sQ0FBQyxPQUFnQjtZQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUN2RCxDQUFDO1FBRUQsV0FBVztZQUNWLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLE1BQU0sQ0FBQztRQUNqRCxDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQW1CO1lBQ3hCLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxXQUFXO1lBQ1YsTUFBTSxPQUFPLEdBQTZCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLE9BQU8sRUFBRSxXQUFXLElBQUksQ0FBQyxDQUFDLE9BQU8sWUFBWSxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pFLE9BQU87WUFDUixDQUFDO1lBRUQsbURBQW1EO1lBQ25ELElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzFCLE9BQU87WUFDUixDQUFDO1lBRUQsNENBQTRDO1lBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN6QyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFlBQVksb0JBQW9CLEVBQUUsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFDRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxZQUFZO1FBRVoseUJBQXlCO1FBRWpCLGtCQUFrQixDQUFDLFFBQWdDLEVBQUUsZUFBZSxHQUFHLElBQUk7WUFDbEYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ3RCLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxlQUFlLEdBQUcsSUFBSSxDQUFDO29CQUN4QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxlQUFlLENBQUM7UUFDeEIsQ0FBQztRQUVPLGtCQUFrQjtZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxLQUFnRDtZQUMzRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFTyw0QkFBNEIsQ0FBQyxLQUFxQztZQUN6RSxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRDs7O1dBR0c7UUFDSyxTQUFTLENBQUMsT0FBNkI7WUFDOUMsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzVCLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDOUMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDO2dCQUM5QyxPQUFPLEVBQUUsT0FBTyxDQUFDLFdBQVc7Z0JBQzVCLE1BQU0sRUFBRSxPQUFPLENBQUMsT0FBTztnQkFDdkIsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7b0JBQ3BCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxVQUFVLEVBQUU7b0JBQ1gsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNELFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDMUIsUUFBUSxFQUFFO29CQUNULGFBQWEsNkJBQXFCO2lCQUNsQzthQUNELEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDWCxDQUFDO0tBQ0QsQ0FBQTtJQXo5Qlksd0NBQWM7SUEwRzFCO1FBREMsb0JBQU87MERBTVA7SUFHRDtRQURDLG9CQUFPOzhEQVFQOzZCQXpIVyxjQUFjO1FBdUR4QixXQUFBLHFDQUFxQixDQUFBO09BdkRYLGNBQWMsQ0F5OUIxQjtJQUVELFNBQVMsMEJBQTBCLENBQUMsS0FBYSxFQUFFLE1BQTZCO1FBRS9FLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEdBQUcsTUFBTSxDQUFDO1FBRXJDLHlFQUF5RTtRQUN6RSxJQUFJLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDOUMsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELCtEQUErRDtRQUMvRCxrREFBa0Q7UUFDbEQsTUFBTSxxQ0FBcUMsR0FBRyxJQUFBLGVBQUssRUFBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDL0QsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLHFDQUFxQyxDQUFDLE1BQU0sQ0FBQztRQUUzRiw4QkFBOEI7UUFDOUIsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLHFDQUFxQyxDQUFDLENBQUM7UUFFaEYscURBQXFEO1FBQ3JELElBQUksT0FBTyxFQUFFLENBQUM7WUFDYixLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyx1QkFBdUIsQ0FBQyxDQUFDLDJCQUEyQixHQUFHLHVCQUF1QixDQUFDLHVDQUF1QyxDQUFDO2dCQUNwSyxLQUFLLENBQUMsS0FBSyxJQUFJLFVBQVUsQ0FBQztnQkFDMUIsS0FBSyxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsa0JBQTBCO1FBQ2xFLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNoRixJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsUUFBMkIsRUFBRSxRQUEyQixFQUFFLE9BQWU7UUFFaEcsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQztRQUN4RCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFDO1FBQ3hELElBQUksZ0JBQWdCLENBQUMsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDekQsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVELElBQUksZ0JBQWdCLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDcEUsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBRUQsT0FBTyxJQUFBLDJCQUFlLEVBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2pGLENBQUMifQ==