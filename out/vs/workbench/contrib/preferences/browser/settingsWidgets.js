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
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/platform/hover/browser/hover", "vs/css!./media/settingsWidgets"], function (require, exports, canIUse_1, DOM, actionbar_1, button_1, toggle_1, inputBox_1, selectBox_1, async_1, codicons_1, event_1, lifecycle_1, platform_1, types_1, nls_1, contextView_1, themeService_1, themables_1, preferencesIcons_1, settingsEditorColorRegistry_1, defaultStyles_1, hoverDelegateFactory_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectSettingCheckboxWidget = exports.ObjectSettingDropdownWidget = exports.IncludeSettingWidget = exports.ExcludeSettingWidget = exports.ListSettingWidget = exports.AbstractListSettingWidget = exports.ListSettingListModel = void 0;
    const $ = DOM.$;
    class ListSettingListModel {
        get items() {
            const items = this._dataItems.map((item, i) => {
                const editing = typeof this._editKey === 'number' && this._editKey === i;
                return {
                    ...item,
                    editing,
                    selected: i === this._selectedIdx || editing
                };
            });
            if (this._editKey === 'create') {
                items.push({
                    editing: true,
                    selected: true,
                    ...this._newDataItem,
                });
            }
            return items;
        }
        constructor(newItem) {
            this._dataItems = [];
            this._editKey = null;
            this._selectedIdx = null;
            this._newDataItem = newItem;
        }
        setEditKey(key) {
            this._editKey = key;
        }
        setValue(listData) {
            this._dataItems = listData;
        }
        select(idx) {
            this._selectedIdx = idx;
        }
        getSelected() {
            return this._selectedIdx;
        }
        selectNext() {
            if (typeof this._selectedIdx === 'number') {
                this._selectedIdx = Math.min(this._selectedIdx + 1, this._dataItems.length - 1);
            }
            else {
                this._selectedIdx = 0;
            }
        }
        selectPrevious() {
            if (typeof this._selectedIdx === 'number') {
                this._selectedIdx = Math.max(this._selectedIdx - 1, 0);
            }
            else {
                this._selectedIdx = 0;
            }
        }
    }
    exports.ListSettingListModel = ListSettingListModel;
    let AbstractListSettingWidget = class AbstractListSettingWidget extends lifecycle_1.Disposable {
        get domNode() {
            return this.listElement;
        }
        get items() {
            return this.model.items;
        }
        get inReadMode() {
            return this.model.items.every(item => !item.editing);
        }
        constructor(container, themeService, contextViewService) {
            super();
            this.container = container;
            this.themeService = themeService;
            this.contextViewService = contextViewService;
            this.rowElements = [];
            this._onDidChangeList = this._register(new event_1.Emitter());
            this.model = new ListSettingListModel(this.getEmptyItem());
            this.listDisposables = this._register(new lifecycle_1.DisposableStore());
            this.onDidChangeList = this._onDidChangeList.event;
            this.listElement = DOM.append(container, $('div'));
            this.listElement.setAttribute('role', 'list');
            this.getContainerClasses().forEach(c => this.listElement.classList.add(c));
            DOM.append(container, this.renderAddButton());
            this.renderList();
            this._register(DOM.addDisposableListener(this.listElement, DOM.EventType.POINTER_DOWN, e => this.onListClick(e)));
            this._register(DOM.addDisposableListener(this.listElement, DOM.EventType.DBLCLICK, e => this.onListDoubleClick(e)));
            this._register(DOM.addStandardDisposableListener(this.listElement, 'keydown', (e) => {
                if (e.equals(16 /* KeyCode.UpArrow */)) {
                    this.selectPreviousRow();
                }
                else if (e.equals(18 /* KeyCode.DownArrow */)) {
                    this.selectNextRow();
                }
                else {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
            }));
        }
        setValue(listData) {
            this.model.setValue(listData);
            this.renderList();
        }
        renderHeader() {
            return;
        }
        isAddButtonVisible() {
            return true;
        }
        renderList() {
            const focused = DOM.isAncestorOfActiveElement(this.listElement);
            DOM.clearNode(this.listElement);
            this.listDisposables.clear();
            const newMode = this.model.items.some(item => !!(item.editing && this.isItemNew(item)));
            this.container.classList.toggle('setting-list-hide-add-button', !this.isAddButtonVisible() || newMode);
            if (this.model.items.length) {
                this.listElement.tabIndex = 0;
            }
            else {
                this.listElement.removeAttribute('tabIndex');
            }
            const header = this.renderHeader();
            if (header) {
                this.listElement.appendChild(header);
            }
            this.rowElements = this.model.items.map((item, i) => this.renderDataOrEditItem(item, i, focused));
            this.rowElements.forEach(rowElement => this.listElement.appendChild(rowElement));
        }
        createBasicSelectBox(value) {
            const selectBoxOptions = value.options.map(({ value, description }) => ({ text: value, description }));
            const selected = value.options.findIndex(option => value.data === option.value);
            const styles = (0, defaultStyles_1.getSelectBoxStyles)({
                selectBackground: settingsEditorColorRegistry_1.settingsSelectBackground,
                selectForeground: settingsEditorColorRegistry_1.settingsSelectForeground,
                selectBorder: settingsEditorColorRegistry_1.settingsSelectBorder,
                selectListBorder: settingsEditorColorRegistry_1.settingsSelectListBorder
            });
            const selectBox = new selectBox_1.SelectBox(selectBoxOptions, selected, this.contextViewService, styles, {
                useCustomDrawn: !(platform_1.isIOS && canIUse_1.BrowserFeatures.pointerEvents)
            });
            return selectBox;
        }
        editSetting(idx) {
            this.model.setEditKey(idx);
            this.renderList();
        }
        cancelEdit() {
            this.model.setEditKey('none');
            this.renderList();
        }
        handleItemChange(originalItem, changedItem, idx) {
            this.model.setEditKey('none');
            this._onDidChangeList.fire({
                originalItem,
                item: changedItem,
                targetIndex: idx,
            });
            this.renderList();
        }
        renderDataOrEditItem(item, idx, listFocused) {
            const rowElement = item.editing ?
                this.renderEdit(item, idx) :
                this.renderDataItem(item, idx, listFocused);
            rowElement.setAttribute('role', 'listitem');
            return rowElement;
        }
        renderDataItem(item, idx, listFocused) {
            const rowElementGroup = this.renderItem(item, idx);
            const rowElement = rowElementGroup.rowElement;
            rowElement.setAttribute('data-index', idx + '');
            rowElement.setAttribute('tabindex', item.selected ? '0' : '-1');
            rowElement.classList.toggle('selected', item.selected);
            const actionBar = new actionbar_1.ActionBar(rowElement);
            this.listDisposables.add(actionBar);
            actionBar.push(this.getActionsForItem(item, idx), { icon: true, label: true });
            this.addTooltipsToRow(rowElementGroup, item);
            if (item.selected && listFocused) {
                (0, async_1.disposableTimeout)(() => rowElement.focus(), undefined, this.listDisposables);
            }
            this.listDisposables.add(DOM.addDisposableListener(rowElement, 'click', (e) => {
                // There is a parent list widget, which is the one that holds the list of settings.
                // Prevent the parent widget from trying to interpret this click event.
                e.stopPropagation();
            }));
            return rowElement;
        }
        renderAddButton() {
            const rowElement = $('.setting-list-new-row');
            const startAddButton = this._register(new button_1.Button(rowElement, defaultStyles_1.defaultButtonStyles));
            startAddButton.label = this.getLocalizedStrings().addButtonLabel;
            startAddButton.element.classList.add('setting-list-addButton');
            this._register(startAddButton.onDidClick(() => {
                this.model.setEditKey('create');
                this.renderList();
            }));
            return rowElement;
        }
        onListClick(e) {
            const targetIdx = this.getClickedItemIndex(e);
            if (targetIdx < 0) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            if (this.model.getSelected() === targetIdx) {
                return;
            }
            this.selectRow(targetIdx);
        }
        onListDoubleClick(e) {
            const targetIdx = this.getClickedItemIndex(e);
            if (targetIdx < 0) {
                return;
            }
            const item = this.model.items[targetIdx];
            if (item) {
                this.editSetting(targetIdx);
                e.preventDefault();
                e.stopPropagation();
            }
        }
        getClickedItemIndex(e) {
            if (!e.target) {
                return -1;
            }
            const actionbar = DOM.findParentWithClass(e.target, 'monaco-action-bar');
            if (actionbar) {
                // Don't handle doubleclicks inside the action bar
                return -1;
            }
            const element = DOM.findParentWithClass(e.target, 'setting-list-row');
            if (!element) {
                return -1;
            }
            const targetIdxStr = element.getAttribute('data-index');
            if (!targetIdxStr) {
                return -1;
            }
            const targetIdx = parseInt(targetIdxStr);
            return targetIdx;
        }
        selectRow(idx) {
            this.model.select(idx);
            this.rowElements.forEach(row => row.classList.remove('selected'));
            const selectedRow = this.rowElements[this.model.getSelected()];
            selectedRow.classList.add('selected');
            selectedRow.focus();
        }
        selectNextRow() {
            this.model.selectNext();
            this.selectRow(this.model.getSelected());
        }
        selectPreviousRow() {
            this.model.selectPrevious();
            this.selectRow(this.model.getSelected());
        }
    };
    exports.AbstractListSettingWidget = AbstractListSettingWidget;
    exports.AbstractListSettingWidget = AbstractListSettingWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, contextView_1.IContextViewService)
    ], AbstractListSettingWidget);
    let ListSettingWidget = class ListSettingWidget extends AbstractListSettingWidget {
        setValue(listData, options) {
            this.keyValueSuggester = options?.keySuggester;
            this.showAddButton = options?.showAddButton ?? true;
            super.setValue(listData);
        }
        constructor(container, themeService, contextViewService, hoverService) {
            super(container, themeService, contextViewService);
            this.hoverService = hoverService;
            this.showAddButton = true;
        }
        getEmptyItem() {
            return {
                value: {
                    type: 'string',
                    data: ''
                }
            };
        }
        isAddButtonVisible() {
            return this.showAddButton;
        }
        getContainerClasses() {
            return ['setting-list-widget'];
        }
        getActionsForItem(item, idx) {
            return [
                {
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon),
                    enabled: true,
                    id: 'workbench.action.editListItem',
                    tooltip: this.getLocalizedStrings().editActionTooltip,
                    run: () => this.editSetting(idx)
                },
                {
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsRemoveIcon),
                    enabled: true,
                    id: 'workbench.action.removeListItem',
                    tooltip: this.getLocalizedStrings().deleteActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                }
            ];
        }
        getDragImage(item) {
            const dragImage = $('.monaco-drag-image');
            dragImage.textContent = item.value.data;
            return dragImage;
        }
        renderItem(item, idx) {
            const rowElement = $('.setting-list-row');
            const valueElement = DOM.append(rowElement, $('.setting-list-value'));
            const siblingElement = DOM.append(rowElement, $('.setting-list-sibling'));
            valueElement.textContent = item.value.data.toString();
            siblingElement.textContent = item.sibling ? `when: ${item.sibling}` : null;
            this.addDragAndDrop(rowElement, item, idx);
            return { rowElement, keyElement: valueElement, valueElement: siblingElement };
        }
        addDragAndDrop(rowElement, item, idx) {
            if (this.inReadMode) {
                rowElement.draggable = true;
                rowElement.classList.add('draggable');
            }
            else {
                rowElement.draggable = false;
                rowElement.classList.remove('draggable');
            }
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_START, (ev) => {
                this.dragDetails = {
                    element: rowElement,
                    item,
                    itemIndex: idx
                };
                if (ev.dataTransfer) {
                    ev.dataTransfer.dropEffect = 'move';
                    const dragImage = this.getDragImage(item);
                    rowElement.ownerDocument.body.appendChild(dragImage);
                    ev.dataTransfer.setDragImage(dragImage, -10, -10);
                    setTimeout(() => rowElement.ownerDocument.body.removeChild(dragImage), 0);
                }
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_OVER, (ev) => {
                if (!this.dragDetails) {
                    return false;
                }
                ev.preventDefault();
                if (ev.dataTransfer) {
                    ev.dataTransfer.dropEffect = 'move';
                }
                return true;
            }));
            let counter = 0;
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_ENTER, (ev) => {
                counter++;
                rowElement.classList.add('drag-hover');
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_LEAVE, (ev) => {
                counter--;
                if (!counter) {
                    rowElement.classList.remove('drag-hover');
                }
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DROP, (ev) => {
                // cancel the op if we dragged to a completely different setting
                if (!this.dragDetails) {
                    return false;
                }
                ev.preventDefault();
                counter = 0;
                if (this.dragDetails.element !== rowElement) {
                    this._onDidChangeList.fire({
                        originalItem: this.dragDetails.item,
                        sourceIndex: this.dragDetails.itemIndex,
                        item,
                        targetIndex: idx
                    });
                }
                return true;
            }));
            this.listDisposables.add(DOM.addDisposableListener(rowElement, DOM.EventType.DRAG_END, (ev) => {
                counter = 0;
                rowElement.classList.remove('drag-hover');
                ev.dataTransfer?.clearData();
                if (this.dragDetails) {
                    this.dragDetails = undefined;
                }
            }));
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row');
            let valueInput;
            let currentDisplayValue;
            let currentEnumOptions;
            if (this.keyValueSuggester) {
                const enumData = this.keyValueSuggester(this.model.items.map(({ value: { data } }) => data), idx);
                item = {
                    ...item,
                    value: {
                        type: 'enum',
                        data: item.value.data,
                        options: enumData ? enumData.options : []
                    }
                };
            }
            switch (item.value.type) {
                case 'string':
                    valueInput = this.renderInputBox(item.value, rowElement);
                    break;
                case 'enum':
                    valueInput = this.renderDropdown(item.value, rowElement);
                    currentEnumOptions = item.value.options;
                    if (item.value.options.length) {
                        currentDisplayValue = this.isItemNew(item) ?
                            currentEnumOptions[0].value : item.value.data;
                    }
                    break;
            }
            const updatedInputBoxItem = () => {
                const inputBox = valueInput;
                return {
                    value: {
                        type: 'string',
                        data: inputBox.value
                    },
                    sibling: siblingInput?.value
                };
            };
            const updatedSelectBoxItem = (selectedValue) => {
                return {
                    value: {
                        type: 'enum',
                        data: selectedValue,
                        options: currentEnumOptions ?? []
                    }
                };
            };
            const onKeyDown = (e) => {
                if (e.equals(3 /* KeyCode.Enter */)) {
                    this.handleItemChange(item, updatedInputBoxItem(), idx);
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    this.cancelEdit();
                    e.preventDefault();
                }
                rowElement?.focus();
            };
            if (item.value.type !== 'string') {
                const selectBox = valueInput;
                this.listDisposables.add(selectBox.onDidSelect(({ selected }) => {
                    currentDisplayValue = selected;
                }));
            }
            else {
                const inputBox = valueInput;
                this.listDisposables.add(DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            }
            let siblingInput;
            if (!(0, types_1.isUndefinedOrNull)(item.sibling)) {
                siblingInput = new inputBox_1.InputBox(rowElement, this.contextViewService, {
                    placeholder: this.getLocalizedStrings().siblingInputPlaceholder,
                    inputBoxStyles: (0, defaultStyles_1.getInputBoxStyle)({
                        inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                        inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                        inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
                    })
                });
                siblingInput.element.classList.add('setting-list-siblingInput');
                this.listDisposables.add(siblingInput);
                siblingInput.value = item.sibling;
                this.listDisposables.add(DOM.addStandardDisposableListener(siblingInput.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            }
            else if (valueInput instanceof inputBox_1.InputBox) {
                valueInput.element.classList.add('no-sibling');
            }
            const okButton = this._register(new button_1.Button(rowElement, defaultStyles_1.defaultButtonStyles));
            okButton.label = (0, nls_1.localize)('okButton', "OK");
            okButton.element.classList.add('setting-list-ok-button');
            this.listDisposables.add(okButton.onDidClick(() => {
                if (item.value.type === 'string') {
                    this.handleItemChange(item, updatedInputBoxItem(), idx);
                }
                else {
                    this.handleItemChange(item, updatedSelectBoxItem(currentDisplayValue), idx);
                }
            }));
            const cancelButton = this._register(new button_1.Button(rowElement, { secondary: true, ...defaultStyles_1.defaultButtonStyles }));
            cancelButton.label = (0, nls_1.localize)('cancelButton', "Cancel");
            cancelButton.element.classList.add('setting-list-cancel-button');
            this.listDisposables.add(cancelButton.onDidClick(() => this.cancelEdit()));
            this.listDisposables.add((0, async_1.disposableTimeout)(() => {
                valueInput.focus();
                if (valueInput instanceof inputBox_1.InputBox) {
                    valueInput.select();
                }
            }));
            return rowElement;
        }
        isItemNew(item) {
            return item.value.data === '';
        }
        addTooltipsToRow(rowElementGroup, { value, sibling }) {
            const title = (0, types_1.isUndefinedOrNull)(sibling)
                ? (0, nls_1.localize)('listValueHintLabel', "List item `{0}`", value.data)
                : (0, nls_1.localize)('listSiblingHintLabel', "List item `{0}` with sibling `${1}`", value.data, sibling);
            const { rowElement } = rowElementGroup;
            this.listDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), rowElement, title));
            rowElement.setAttribute('aria-label', title);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                inputPlaceholder: (0, nls_1.localize)('itemInputPlaceholder', "Item..."),
                siblingInputPlaceholder: (0, nls_1.localize)('listSiblingInputPlaceholder', "Sibling..."),
            };
        }
        renderInputBox(value, rowElement) {
            const valueInput = new inputBox_1.InputBox(rowElement, this.contextViewService, {
                placeholder: this.getLocalizedStrings().inputPlaceholder,
                inputBoxStyles: (0, defaultStyles_1.getInputBoxStyle)({
                    inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                    inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                    inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
                })
            });
            valueInput.element.classList.add('setting-list-valueInput');
            this.listDisposables.add(valueInput);
            valueInput.value = value.data.toString();
            return valueInput;
        }
        renderDropdown(value, rowElement) {
            if (value.type !== 'enum') {
                throw new Error('Valuetype must be enum.');
            }
            const selectBox = this.createBasicSelectBox(value);
            const wrapper = $('.setting-list-object-list-row');
            selectBox.render(wrapper);
            rowElement.appendChild(wrapper);
            return selectBox;
        }
    };
    exports.ListSettingWidget = ListSettingWidget;
    exports.ListSettingWidget = ListSettingWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, contextView_1.IContextViewService),
        __param(3, hover_1.IHoverService)
    ], ListSettingWidget);
    class ExcludeSettingWidget extends ListSettingWidget {
        getContainerClasses() {
            return ['setting-list-include-exclude-widget'];
        }
        addDragAndDrop(rowElement, item, idx) {
            return;
        }
        addTooltipsToRow(rowElementGroup, { value, sibling }) {
            const title = (0, types_1.isUndefinedOrNull)(sibling)
                ? (0, nls_1.localize)('excludePatternHintLabel', "Exclude files matching `{0}`", value.data)
                : (0, nls_1.localize)('excludeSiblingHintLabel', "Exclude files matching `{0}`, only when a file matching `{1}` is present", value.data, sibling);
            const { rowElement } = rowElementGroup;
            this.listDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), rowElement, title));
            rowElement.setAttribute('aria-label', title);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeExcludeItem', "Remove Exclude Item"),
                editActionTooltip: (0, nls_1.localize)('editExcludeItem', "Edit Exclude Item"),
                addButtonLabel: (0, nls_1.localize)('addPattern', "Add Pattern"),
                inputPlaceholder: (0, nls_1.localize)('excludePatternInputPlaceholder', "Exclude Pattern..."),
                siblingInputPlaceholder: (0, nls_1.localize)('excludeSiblingInputPlaceholder', "When Pattern Is Present..."),
            };
        }
    }
    exports.ExcludeSettingWidget = ExcludeSettingWidget;
    class IncludeSettingWidget extends ListSettingWidget {
        getContainerClasses() {
            return ['setting-list-include-exclude-widget'];
        }
        addDragAndDrop(rowElement, item, idx) {
            return;
        }
        addTooltipsToRow(rowElementGroup, { value, sibling }) {
            const title = (0, types_1.isUndefinedOrNull)(sibling)
                ? (0, nls_1.localize)('includePatternHintLabel', "Include files matching `{0}`", value.data)
                : (0, nls_1.localize)('includeSiblingHintLabel', "Include files matching `{0}`, only when a file matching `{1}` is present", value.data, sibling);
            const { rowElement } = rowElementGroup;
            this.listDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), rowElement, title));
            rowElement.setAttribute('aria-label', title);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeIncludeItem', "Remove Include Item"),
                editActionTooltip: (0, nls_1.localize)('editIncludeItem', "Edit Include Item"),
                addButtonLabel: (0, nls_1.localize)('addPattern', "Add Pattern"),
                inputPlaceholder: (0, nls_1.localize)('includePatternInputPlaceholder', "Include Pattern..."),
                siblingInputPlaceholder: (0, nls_1.localize)('includeSiblingInputPlaceholder', "When Pattern Is Present..."),
            };
        }
    }
    exports.IncludeSettingWidget = IncludeSettingWidget;
    let ObjectSettingDropdownWidget = class ObjectSettingDropdownWidget extends AbstractListSettingWidget {
        constructor(container, themeService, contextViewService, hoverService) {
            super(container, themeService, contextViewService);
            this.hoverService = hoverService;
            this.currentSettingKey = '';
            this.showAddButton = true;
            this.keySuggester = () => undefined;
            this.valueSuggester = () => undefined;
        }
        setValue(listData, options) {
            this.showAddButton = options?.showAddButton ?? this.showAddButton;
            this.keySuggester = options?.keySuggester ?? this.keySuggester;
            this.valueSuggester = options?.valueSuggester ?? this.valueSuggester;
            if ((0, types_1.isDefined)(options) && options.settingKey !== this.currentSettingKey) {
                this.model.setEditKey('none');
                this.model.select(null);
                this.currentSettingKey = options.settingKey;
            }
            super.setValue(listData);
        }
        isItemNew(item) {
            return item.key.data === '' && item.value.data === '';
        }
        isAddButtonVisible() {
            return this.showAddButton;
        }
        getEmptyItem() {
            return {
                key: { type: 'string', data: '' },
                value: { type: 'string', data: '' },
                removable: true,
            };
        }
        getContainerClasses() {
            return ['setting-list-object-widget'];
        }
        getActionsForItem(item, idx) {
            const actions = [
                {
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon),
                    enabled: true,
                    id: 'workbench.action.editListItem',
                    tooltip: this.getLocalizedStrings().editActionTooltip,
                    run: () => this.editSetting(idx)
                },
            ];
            if (item.removable) {
                actions.push({
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsRemoveIcon),
                    enabled: true,
                    id: 'workbench.action.removeListItem',
                    tooltip: this.getLocalizedStrings().deleteActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                });
            }
            else {
                actions.push({
                    class: themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsDiscardIcon),
                    enabled: true,
                    id: 'workbench.action.resetListItem',
                    tooltip: this.getLocalizedStrings().resetActionTooltip,
                    run: () => this._onDidChangeList.fire({ originalItem: item, item: undefined, targetIndex: idx })
                });
            }
            return actions;
        }
        renderHeader() {
            const header = $('.setting-list-row-header');
            const keyHeader = DOM.append(header, $('.setting-list-object-key'));
            const valueHeader = DOM.append(header, $('.setting-list-object-value'));
            const { keyHeaderText, valueHeaderText } = this.getLocalizedStrings();
            keyHeader.textContent = keyHeaderText;
            valueHeader.textContent = valueHeaderText;
            return header;
        }
        renderItem(item, idx) {
            const rowElement = $('.setting-list-row');
            rowElement.classList.add('setting-list-object-row');
            const keyElement = DOM.append(rowElement, $('.setting-list-object-key'));
            const valueElement = DOM.append(rowElement, $('.setting-list-object-value'));
            keyElement.textContent = item.key.data;
            valueElement.textContent = item.value.data.toString();
            return { rowElement, keyElement, valueElement };
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row.setting-list-object-row');
            const changedItem = { ...item };
            const onKeyChange = (key) => {
                changedItem.key = key;
                okButton.enabled = key.data !== '';
                const suggestedValue = this.valueSuggester(key.data) ?? item.value;
                if (this.shouldUseSuggestion(item.value, changedItem.value, suggestedValue)) {
                    onValueChange(suggestedValue);
                    renderLatestValue();
                }
            };
            const onValueChange = (value) => {
                changedItem.value = value;
            };
            let keyWidget;
            let keyElement;
            if (this.showAddButton) {
                if (this.isItemNew(item)) {
                    const suggestedKey = this.keySuggester(this.model.items.map(({ key: { data } }) => data));
                    if ((0, types_1.isDefined)(suggestedKey)) {
                        changedItem.key = suggestedKey;
                        const suggestedValue = this.valueSuggester(changedItem.key.data);
                        onValueChange(suggestedValue ?? changedItem.value);
                    }
                }
                const { widget, element } = this.renderEditWidget(changedItem.key, {
                    idx,
                    isKey: true,
                    originalItem: item,
                    changedItem,
                    update: onKeyChange,
                });
                keyWidget = widget;
                keyElement = element;
            }
            else {
                keyElement = $('.setting-list-object-key');
                keyElement.textContent = item.key.data;
            }
            let valueWidget;
            const valueContainer = $('.setting-list-object-value-container');
            const renderLatestValue = () => {
                const { widget, element } = this.renderEditWidget(changedItem.value, {
                    idx,
                    isKey: false,
                    originalItem: item,
                    changedItem,
                    update: onValueChange,
                });
                valueWidget = widget;
                DOM.clearNode(valueContainer);
                valueContainer.append(element);
            };
            renderLatestValue();
            rowElement.append(keyElement, valueContainer);
            const okButton = this._register(new button_1.Button(rowElement, defaultStyles_1.defaultButtonStyles));
            okButton.enabled = changedItem.key.data !== '';
            okButton.label = (0, nls_1.localize)('okButton', "OK");
            okButton.element.classList.add('setting-list-ok-button');
            this.listDisposables.add(okButton.onDidClick(() => this.handleItemChange(item, changedItem, idx)));
            const cancelButton = this._register(new button_1.Button(rowElement, { secondary: true, ...defaultStyles_1.defaultButtonStyles }));
            cancelButton.label = (0, nls_1.localize)('cancelButton', "Cancel");
            cancelButton.element.classList.add('setting-list-cancel-button');
            this.listDisposables.add(cancelButton.onDidClick(() => this.cancelEdit()));
            this.listDisposables.add((0, async_1.disposableTimeout)(() => {
                const widget = keyWidget ?? valueWidget;
                widget.focus();
                if (widget instanceof inputBox_1.InputBox) {
                    widget.select();
                }
            }));
            return rowElement;
        }
        renderEditWidget(keyOrValue, options) {
            switch (keyOrValue.type) {
                case 'string':
                    return this.renderStringEditWidget(keyOrValue, options);
                case 'enum':
                    return this.renderEnumEditWidget(keyOrValue, options);
                case 'boolean':
                    return this.renderEnumEditWidget({
                        type: 'enum',
                        data: keyOrValue.data.toString(),
                        options: [{ value: 'true' }, { value: 'false' }],
                    }, options);
            }
        }
        renderStringEditWidget(keyOrValue, { idx, isKey, originalItem, changedItem, update }) {
            const wrapper = $(isKey ? '.setting-list-object-input-key' : '.setting-list-object-input-value');
            const inputBox = new inputBox_1.InputBox(wrapper, this.contextViewService, {
                placeholder: isKey
                    ? (0, nls_1.localize)('objectKeyInputPlaceholder', "Key")
                    : (0, nls_1.localize)('objectValueInputPlaceholder', "Value"),
                inputBoxStyles: (0, defaultStyles_1.getInputBoxStyle)({
                    inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                    inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                    inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
                })
            });
            inputBox.element.classList.add('setting-list-object-input');
            this.listDisposables.add(inputBox);
            inputBox.value = keyOrValue.data;
            this.listDisposables.add(inputBox.onDidChange(value => update({ ...keyOrValue, data: value })));
            const onKeyDown = (e) => {
                if (e.equals(3 /* KeyCode.Enter */)) {
                    this.handleItemChange(originalItem, changedItem, idx);
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    this.cancelEdit();
                    e.preventDefault();
                }
            };
            this.listDisposables.add(DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, onKeyDown));
            return { widget: inputBox, element: wrapper };
        }
        renderEnumEditWidget(keyOrValue, { isKey, changedItem, update }) {
            const selectBox = this.createBasicSelectBox(keyOrValue);
            const changedKeyOrValue = isKey ? changedItem.key : changedItem.value;
            this.listDisposables.add(selectBox.onDidSelect(({ selected }) => update(changedKeyOrValue.type === 'boolean'
                ? { ...changedKeyOrValue, data: selected === 'true' ? true : false }
                : { ...changedKeyOrValue, data: selected })));
            const wrapper = $('.setting-list-object-input');
            wrapper.classList.add(isKey ? 'setting-list-object-input-key' : 'setting-list-object-input-value');
            selectBox.render(wrapper);
            // Switch to the first item if the user set something invalid in the json
            const selected = keyOrValue.options.findIndex(option => keyOrValue.data === option.value);
            if (selected === -1 && keyOrValue.options.length) {
                update(changedKeyOrValue.type === 'boolean'
                    ? { ...changedKeyOrValue, data: true }
                    : { ...changedKeyOrValue, data: keyOrValue.options[0].value });
            }
            else if (changedKeyOrValue.type === 'boolean') {
                // https://github.com/microsoft/vscode/issues/129581
                update({ ...changedKeyOrValue, data: keyOrValue.data === 'true' });
            }
            return { widget: selectBox, element: wrapper };
        }
        shouldUseSuggestion(originalValue, previousValue, newValue) {
            // suggestion is exactly the same
            if (newValue.type !== 'enum' && newValue.type === previousValue.type && newValue.data === previousValue.data) {
                return false;
            }
            // item is new, use suggestion
            if (originalValue.data === '') {
                return true;
            }
            if (previousValue.type === newValue.type && newValue.type !== 'enum') {
                return false;
            }
            // check if all enum options are the same
            if (previousValue.type === 'enum' && newValue.type === 'enum') {
                const previousEnums = new Set(previousValue.options.map(({ value }) => value));
                newValue.options.forEach(({ value }) => previousEnums.delete(value));
                // all options are the same
                if (previousEnums.size === 0) {
                    return false;
                }
            }
            return true;
        }
        addTooltipsToRow(rowElementGroup, item) {
            const { keyElement, valueElement, rowElement } = rowElementGroup;
            const accessibleDescription = (0, nls_1.localize)('objectPairHintLabel', "The property `{0}` is set to `{1}`.", item.key.data, item.value.data);
            const keyDescription = this.getEnumDescription(item.key) ?? item.keyDescription ?? accessibleDescription;
            this.listDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), keyElement, keyDescription));
            const valueDescription = this.getEnumDescription(item.value) ?? accessibleDescription;
            this.listDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), valueElement, valueDescription));
            rowElement.setAttribute('aria-label', accessibleDescription);
        }
        getEnumDescription(keyOrValue) {
            const enumDescription = keyOrValue.type === 'enum'
                ? keyOrValue.options.find(({ value }) => keyOrValue.data === value)?.description
                : undefined;
            return enumDescription;
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                resetActionTooltip: (0, nls_1.localize)('resetItem', "Reset Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                keyHeaderText: (0, nls_1.localize)('objectKeyHeader', "Item"),
                valueHeaderText: (0, nls_1.localize)('objectValueHeader', "Value"),
            };
        }
    };
    exports.ObjectSettingDropdownWidget = ObjectSettingDropdownWidget;
    exports.ObjectSettingDropdownWidget = ObjectSettingDropdownWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, contextView_1.IContextViewService),
        __param(3, hover_1.IHoverService)
    ], ObjectSettingDropdownWidget);
    let ObjectSettingCheckboxWidget = class ObjectSettingCheckboxWidget extends AbstractListSettingWidget {
        constructor(container, themeService, contextViewService, hoverService) {
            super(container, themeService, contextViewService);
            this.hoverService = hoverService;
            this.currentSettingKey = '';
        }
        setValue(listData, options) {
            if ((0, types_1.isDefined)(options) && options.settingKey !== this.currentSettingKey) {
                this.model.setEditKey('none');
                this.model.select(null);
                this.currentSettingKey = options.settingKey;
            }
            super.setValue(listData);
        }
        isItemNew(item) {
            return !item.key.data && !item.value.data;
        }
        getEmptyItem() {
            return {
                key: { type: 'string', data: '' },
                value: { type: 'boolean', data: false },
                removable: false
            };
        }
        getContainerClasses() {
            return ['setting-list-object-widget'];
        }
        getActionsForItem(item, idx) {
            return [];
        }
        isAddButtonVisible() {
            return false;
        }
        renderHeader() {
            return undefined;
        }
        renderDataOrEditItem(item, idx, listFocused) {
            const rowElement = this.renderEdit(item, idx);
            rowElement.setAttribute('role', 'listitem');
            return rowElement;
        }
        renderItem(item, idx) {
            // Return just the containers, since we always render in edit mode anyway
            const rowElement = $('.blank-row');
            const keyElement = $('.blank-row-key');
            return { rowElement, keyElement };
        }
        renderEdit(item, idx) {
            const rowElement = $('.setting-list-edit-row.setting-list-object-row.setting-item-bool');
            const changedItem = { ...item };
            const onValueChange = (newValue) => {
                changedItem.value.data = newValue;
                this.handleItemChange(item, changedItem, idx);
            };
            const checkboxDescription = item.keyDescription ? `${item.keyDescription} (${item.key.data})` : item.key.data;
            const { element, widget: checkbox } = this.renderEditWidget(changedItem.value.data, checkboxDescription, onValueChange);
            rowElement.appendChild(element);
            const valueElement = DOM.append(rowElement, $('.setting-list-object-value'));
            valueElement.textContent = checkboxDescription;
            // We add the tooltips here, because the method is not called by default
            // for widgets in edit mode
            const rowElementGroup = { rowElement, keyElement: valueElement, valueElement: checkbox.domNode };
            this.addTooltipsToRow(rowElementGroup, item);
            this._register(DOM.addDisposableListener(valueElement, DOM.EventType.MOUSE_DOWN, e => {
                const targetElement = e.target;
                if (targetElement.tagName.toLowerCase() !== 'a') {
                    checkbox.checked = !checkbox.checked;
                    onValueChange(checkbox.checked);
                }
                DOM.EventHelper.stop(e);
            }));
            return rowElement;
        }
        renderEditWidget(value, checkboxDescription, onValueChange) {
            const checkbox = new toggle_1.Toggle({
                icon: codicons_1.Codicon.check,
                actionClassName: 'setting-value-checkbox',
                isChecked: value,
                title: checkboxDescription,
                ...toggle_1.unthemedToggleStyles
            });
            this.listDisposables.add(checkbox);
            const wrapper = $('.setting-list-object-input');
            wrapper.classList.add('setting-list-object-input-key-checkbox');
            checkbox.domNode.classList.add('setting-value-checkbox');
            wrapper.appendChild(checkbox.domNode);
            this._register(DOM.addDisposableListener(wrapper, DOM.EventType.MOUSE_DOWN, e => {
                checkbox.checked = !checkbox.checked;
                onValueChange(checkbox.checked);
                // Without this line, the settings editor assumes
                // we lost focus on this setting completely.
                e.stopImmediatePropagation();
            }));
            return { widget: checkbox, element: wrapper };
        }
        addTooltipsToRow(rowElementGroup, item) {
            const accessibleDescription = (0, nls_1.localize)('objectPairHintLabel', "The property `{0}` is set to `{1}`.", item.key.data, item.value.data);
            const title = item.keyDescription ?? accessibleDescription;
            const { rowElement, keyElement, valueElement } = rowElementGroup;
            this.listDisposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), keyElement, title));
            valueElement.setAttribute('aria-label', accessibleDescription);
            rowElement.setAttribute('aria-label', accessibleDescription);
        }
        getLocalizedStrings() {
            return {
                deleteActionTooltip: (0, nls_1.localize)('removeItem', "Remove Item"),
                resetActionTooltip: (0, nls_1.localize)('resetItem', "Reset Item"),
                editActionTooltip: (0, nls_1.localize)('editItem', "Edit Item"),
                addButtonLabel: (0, nls_1.localize)('addItem', "Add Item"),
                keyHeaderText: (0, nls_1.localize)('objectKeyHeader', "Item"),
                valueHeaderText: (0, nls_1.localize)('objectValueHeader', "Value"),
            };
        }
    };
    exports.ObjectSettingCheckboxWidget = ObjectSettingCheckboxWidget;
    exports.ObjectSettingCheckboxWidget = ObjectSettingCheckboxWidget = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, contextView_1.IContextViewService),
        __param(3, hover_1.IHoverService)
    ], ObjectSettingCheckboxWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NXaWRnZXRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcHJlZmVyZW5jZXMvYnJvd3Nlci9zZXR0aW5nc1dpZGdldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNkJoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBZWhCLE1BQWEsb0JBQW9CO1FBTWhDLElBQUksS0FBSztZQUNSLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM3QyxNQUFNLE9BQU8sR0FBRyxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDO2dCQUN6RSxPQUFPO29CQUNOLEdBQUcsSUFBSTtvQkFDUCxPQUFPO29CQUNQLFFBQVEsRUFBRSxDQUFDLEtBQUssSUFBSSxDQUFDLFlBQVksSUFBSSxPQUFPO2lCQUM1QyxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ1YsT0FBTyxFQUFFLElBQUk7b0JBQ2IsUUFBUSxFQUFFLElBQUk7b0JBQ2QsR0FBRyxJQUFJLENBQUMsWUFBWTtpQkFDcEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELFlBQVksT0FBa0I7WUExQnBCLGVBQVUsR0FBZ0IsRUFBRSxDQUFDO1lBQy9CLGFBQVEsR0FBbUIsSUFBSSxDQUFDO1lBQ2hDLGlCQUFZLEdBQWtCLElBQUksQ0FB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