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
define(["require", "exports", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/terminal/browser/terminal", "vs/nls", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/terminal/common/terminal", "vs/base/common/codicons", "vs/base/common/actions", "vs/workbench/browser/labels", "vs/workbench/services/decorations/common/decorations", "vs/platform/hover/browser/hover", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/base/browser/dnd", "vs/base/common/async", "vs/base/browser/ui/list/listView", "vs/base/common/uri", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/functional", "vs/platform/dnd/browser/dnd", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/browser/terminalTooltip", "vs/platform/theme/browser/defaultStyles", "vs/base/common/event", "vs/base/common/network", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/workbench/contrib/terminal/browser/terminalContextMenu"], function (require, exports, listService_1, configuration_1, contextkey_1, keybinding_1, themeService_1, themables_1, terminal_1, nls_1, DOM, instantiation_1, actionbar_1, actions_1, menuEntryActionViewItem_1, terminal_2, codicons_1, actions_2, labels_1, decorations_1, hover_1, severity_1, lifecycle_1, dnd_1, async_1, listView_1, uri_1, terminalIcon_1, contextView_1, inputBox_1, functional_1, dnd_2, terminalStrings_1, lifecycle_2, terminalContextKey_1, terminalUri_1, terminalTooltip_1, defaultStyles_1, event_1, network_1, terminalStatusList_1, terminalContextMenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalTabList = exports.TerminalTabsListSizes = void 0;
    const $ = DOM.$;
    var TerminalTabsListSizes;
    (function (TerminalTabsListSizes) {
        TerminalTabsListSizes[TerminalTabsListSizes["TabHeight"] = 22] = "TabHeight";
        TerminalTabsListSizes[TerminalTabsListSizes["NarrowViewWidth"] = 46] = "NarrowViewWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["WideViewMinimumWidth"] = 80] = "WideViewMinimumWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["DefaultWidth"] = 120] = "DefaultWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["MidpointViewWidth"] = 63] = "MidpointViewWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["ActionbarMinimumWidth"] = 105] = "ActionbarMinimumWidth";
        TerminalTabsListSizes[TerminalTabsListSizes["MaximumWidth"] = 500] = "MaximumWidth";
    })(TerminalTabsListSizes || (exports.TerminalTabsListSizes = TerminalTabsListSizes = {}));
    let TerminalTabList = class TerminalTabList extends listService_1.WorkbenchList {
        constructor(container, contextKeyService, listService, themeService, _configurationService, _terminalService, _terminalGroupService, instantiationService, decorationsService, _themeService, lifecycleService, _hoverService) {
            super('TerminalTabsList', container, {
                getHeight: () => 22 /* TerminalTabsListSizes.TabHeight */,
                getTemplateId: () => 'terminal.tabs'
            }, [instantiationService.createInstance(TerminalTabsRenderer, container, instantiationService.createInstance(labels_1.ResourceLabels, labels_1.DEFAULT_LABELS_CONTAINER), () => this.getSelectedElements())], {
                horizontalScrolling: false,
                supportDynamicHeights: false,
                selectionNavigation: true,
                identityProvider: {
                    getId: e => e?.instanceId
                },
                accessibilityProvider: instantiationService.createInstance(TerminalTabsAccessibilityProvider),
                smoothScrolling: _configurationService.getValue('workbench.list.smoothScrolling'),
                multipleSelectionSupport: true,
                paddingBottom: 22 /* TerminalTabsListSizes.TabHeight */,
                dnd: instantiationService.createInstance(TerminalTabsDragAndDrop),
                openOnSingleClick: true
            }, contextKeyService, listService, _configurationService, instantiationService);
            this._configurationService = _configurationService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._themeService = _themeService;
            this._hoverService = _hoverService;
            const instanceDisposables = [
                this._terminalGroupService.onDidChangeInstances(() => this.refresh()),
                this._terminalGroupService.onDidChangeGroups(() => this.refresh()),
                this._terminalGroupService.onDidShow(() => this.refresh()),
                this._terminalGroupService.onDidChangeInstanceCapability(() => this.refresh()),
                this._terminalService.onAnyInstanceTitleChange(() => this.refresh()),
                this._terminalService.onAnyInstanceIconChange(() => this.refresh()),
                this._terminalService.onAnyInstancePrimaryStatusChange(() => this.refresh()),
                this._terminalService.onDidChangeConnectionState(() => this.refresh()),
                this._themeService.onDidColorThemeChange(() => this.refresh()),
                this._terminalGroupService.onDidChangeActiveInstance(e => {
                    if (e) {
                        const i = this._terminalGroupService.instances.indexOf(e);
                        this.setSelection([i]);
                        this.reveal(i);
                    }
                    this.refresh();
                })
            ];
            // Dispose of instance listeners on shutdown to avoid extra work and so tabs don't disappear
            // briefly
            this.disposables.add(lifecycleService.onWillShutdown(e => {
                (0, lifecycle_1.dispose)(instanceDisposables);
                instanceDisposables.length = 0;
            }));
            this.disposables.add((0, lifecycle_1.toDisposable)(() => {
                (0, lifecycle_1.dispose)(instanceDisposables);
                instanceDisposables.length = 0;
            }));
            this.disposables.add(this.onMouseDblClick(async (e) => {
                const focus = this.getFocus();
                if (focus.length === 0) {
                    const instance = await this._terminalService.createTerminal({ location: terminal_2.TerminalLocation.Panel });
                    this._terminalGroupService.setActiveInstance(instance);
                    await instance.focusWhenReady();
                }
                if (this._terminalService.getEditingTerminal()?.instanceId === e.element?.instanceId) {
                    return;
                }
                if (this._getFocusMode() === 'doubleClick' && this.getFocus().length === 1) {
                    e.element?.focus(true);
                }
            }));
            // on left click, if focus mode = single click, focus the element
            // unless multi-selection is in progress
            this.disposables.add(this.onMouseClick(async (e) => {
                if (this._terminalService.getEditingTerminal()?.instanceId === e.element?.instanceId) {
                    return;
                }
                if (e.browserEvent.altKey && e.element) {
                    await this._terminalService.createTerminal({ location: { parentTerminal: e.element } });
                }
                else if (this._getFocusMode() === 'singleClick') {
                    if (this.getSelection().length <= 1) {
                        e.element?.focus(true);
                    }
                }
            }));
            // on right click, set the focus to that element
            // unless multi-selection is in progress
            this.disposables.add(this.onContextMenu(e => {
                if (!e.element) {
                    this.setSelection([]);
                    return;
                }
                const selection = this.getSelectedElements();
                if (!selection || !selection.find(s => e.element === s)) {
                    this.setFocus(e.index !== undefined ? [e.index] : []);
                }
            }));
            this._terminalTabsSingleSelectedContextKey = terminalContextKey_1.TerminalContextKeys.tabsSingularSelection.bindTo(contextKeyService);
            this._isSplitContextKey = terminalContextKey_1.TerminalContextKeys.splitTerminal.bindTo(contextKeyService);
            this.disposables.add(this.onDidChangeSelection(e => this._updateContextKey()));
            this.disposables.add(this.onDidChangeFocus(() => this._updateContextKey()));
            this.disposables.add(this.onDidOpen(async (e) => {
                const instance = e.element;
                if (!instance) {
                    return;
                }
                this._terminalGroupService.setActiveInstance(instance);
                if (!e.editorOptions.preserveFocus) {
                    await instance.focusWhenReady();
                }
            }));
            if (!this._decorationsProvider) {
                this._decorationsProvider = this.disposables.add(instantiationService.createInstance(TabDecorationsProvider));
                this.disposables.add(decorationsService.registerDecorationsProvider(this._decorationsProvider));
            }
            this.refresh();
        }
        _getFocusMode() {
            return this._configurationService.getValue("terminal.integrated.tabs.focusMode" /* TerminalSettingId.TabsFocusMode */);
        }
        refresh(cancelEditing = true) {
            if (cancelEditing && this._terminalService.isEditable(undefined)) {
                this.domFocus();
            }
            this.splice(0, this.length, this._terminalGroupService.instances.slice());
        }
        focusHover() {
            const instance = this.getSelectedElements()[0];
            if (!instance) {
                return;
            }
            this._hoverService.showHover({
                ...(0, terminalTooltip_1.getInstanceHoverInfo)(instance),
                target: this.getHTMLElement(),
                trapFocus: true
            }, true);
        }
        _updateContextKey() {
            this._terminalTabsSingleSelectedContextKey.set(this.getSelectedElements().length === 1);
            const instance = this.getFocusedElements();
            this._isSplitContextKey.set(instance.length > 0 && this._terminalGroupService.instanceIsSplit(instance[0]));
        }
    };
    exports.TerminalTabList = TerminalTabList;
    exports.TerminalTabList = TerminalTabList = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, listService_1.IListService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, terminal_1.ITerminalService),
        __param(6, terminal_1.ITerminalGroupService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, decorations_1.IDecorationsService),
        __param(9, themeService_1.IThemeService),
        __param(10, lifecycle_2.ILifecycleService),
        __param(11, hover_1.IHoverService)
    ], TerminalTabList);
    let TerminalTabsRenderer = class TerminalTabsRenderer {
        constructor(_container, _labels, _getSelection, _instantiationService, _terminalService, _terminalGroupService, _hoverService, _configurationService, _keybindingService, _listService, _themeService, _contextViewService) {
            this._container = _container;
            this._labels = _labels;
            this._getSelection = _getSelection;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._hoverService = _hoverService;
            this._configurationService = _configurationService;
            this._keybindingService = _keybindingService;
            this._listService = _listService;
            this._themeService = _themeService;
            this._contextViewService = _contextViewService;
            this.templateId = 'terminal.tabs';
        }
        renderTemplate(container) {
            const element = DOM.append(container, $('.terminal-tabs-entry'));
            const context = {};
            const label = this._labels.create(element, {
                supportHighlights: true,
                supportDescriptionHighlights: true,
                supportIcons: true,
                hoverDelegate: {
                    delay: this._configurationService.getValue('workbench.hover.delay'),
                    showHover: options => {
                        return this._hoverService.showHover({
                            ...options,
                            actions: context.hoverActions,
                            persistence: {
                                hideOnHover: true
                            }
                        });
                    }
                }
            });
            const actionsContainer = DOM.append(label.element, $('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionRunner: new terminalContextMenu_1.TerminalContextActionRunner(),
                actionViewItemProvider: (action, options) => action instanceof actions_1.MenuItemAction
                    ? this._instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate })
                    : undefined
            });
            return {
                element,
                label,
                actionBar,
                context,
                elementDisposables: new lifecycle_1.DisposableStore(),
            };
        }
        shouldHideText() {
            return this._container ? this._container.clientWidth < 63 /* TerminalTabsListSizes.MidpointViewWidth */ : false;
        }
        shouldHideActionBar() {
            return this._container ? this._container.clientWidth <= 105 /* TerminalTabsListSizes.ActionbarMinimumWidth */ : false;
        }
        renderElement(instance, index, template) {
            const hasText = !this.shouldHideText();
            const group = this._terminalGroupService.getGroupForInstance(instance);
            if (!group) {
                throw new Error(`Could not find group for instance "${instance.instanceId}"`);
            }
            template.element.classList.toggle('has-text', hasText);
            template.element.classList.toggle('is-active', this._terminalGroupService.activeInstance === instance);
            let prefix = '';
            if (group.terminalInstances.length > 1) {
                const terminalIndex = group.terminalInstances.indexOf(instance);
                if (terminalIndex === 0) {
                    prefix = `┌ `;
                }
                else if (terminalIndex === group.terminalInstances.length - 1) {
                    prefix = `└ `;
                }
                else {
                    prefix = `├ `;
                }
            }
            const hoverInfo = (0, terminalTooltip_1.getInstanceHoverInfo)(instance);
            template.context.hoverActions = hoverInfo.actions;
            const iconId = this._instantiationService.invokeFunction(terminalIcon_1.getIconId, instance);
            const hasActionbar = !this.shouldHideActionBar();
            let label = '';
            if (!hasText) {
                const primaryStatus = instance.statusList.primary;
                // Don't show ignore severity
                if (primaryStatus && primaryStatus.severity > severity_1.default.Ignore) {
                    label = `${prefix}$(${primaryStatus.icon?.id || iconId})`;
                }
                else {
                    label = `${prefix}$(${iconId})`;
                }
            }
            else {
                this.fillActionBar(instance, template);
                label = prefix;
                // Only add the title if the icon is set, this prevents the title jumping around for
                // example when launching with a ShellLaunchConfig.name and no icon
                if (instance.icon) {
                    label += `$(${iconId}) ${instance.title}`;
                }
            }
            if (!hasActionbar) {
                template.actionBar.clear();
            }
            // Kill terminal on middle click
            template.elementDisposables.add(DOM.addDisposableListener(template.element, DOM.EventType.AUXCLICK, e => {
                e.stopImmediatePropagation();
                if (e.button === 1 /*middle*/) {
                    this._terminalService.safeDisposeTerminal(instance);
                }
            }));
            const extraClasses = [];
            const colorClass = (0, terminalIcon_1.getColorClass)(instance);
            if (colorClass) {
                extraClasses.push(colorClass);
            }
            const uriClasses = (0, terminalIcon_1.getUriClasses)(instance, this._themeService.getColorTheme().type);
            if (uriClasses) {
                extraClasses.push(...uriClasses);
            }
            template.label.setResource({
                resource: instance.resource,
                name: label,
                description: hasText ? instance.description : undefined
            }, {
                fileDecorations: {
                    colors: true,
                    badges: hasText
                },
                title: {
                    markdown: hoverInfo.content,
                    markdownNotSupportedFallback: undefined
                },
                extraClasses
            });
            const editableData = this._terminalService.getEditableData(instance);
            template.label.element.classList.toggle('editable-tab', !!editableData);
            if (editableData) {
                template.elementDisposables.add(this._renderInputBox(template.label.element.querySelector('.monaco-icon-label-container'), instance, editableData));
                template.actionBar.clear();
            }
        }
        _renderInputBox(container, instance, editableData) {
            const value = instance.title || '';
            const inputBox = new inputBox_1.InputBox(container, this._contextViewService, {
                validationOptions: {
                    validation: (value) => {
                        const message = editableData.validationMessage(value);
                        if (!message || message.severity !== severity_1.default.Error) {
                            return null;
                        }
                        return {
                            content: message.content,
                            formatContent: true,
                            type: 3 /* MessageType.ERROR */
                        };
                    }
                },
                ariaLabel: (0, nls_1.localize)('terminalInputAriaLabel', "Type terminal name. Press Enter to confirm or Escape to cancel."),
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            });
            inputBox.element.style.height = '22px';
            inputBox.value = value;
            inputBox.focus();
            inputBox.select({ start: 0, end: value.length });
            const done = (0, functional_1.createSingleCallFunction)((success, finishEditing) => {
                inputBox.element.style.display = 'none';
                const value = inputBox.value;
                (0, lifecycle_1.dispose)(toDispose);
                inputBox.element.remove();
                if (finishEditing) {
                    editableData.onFinish(value, success);
                }
            });
            const showInputBoxNotification = () => {
                if (inputBox.isInputValid()) {
                    const message = editableData.validationMessage(inputBox.value);
                    if (message) {
                        inputBox.showMessage({
                            content: message.content,
                            formatContent: true,
                            type: message.severity === severity_1.default.Info ? 1 /* MessageType.INFO */ : message.severity === severity_1.default.Warning ? 2 /* MessageType.WARNING */ : 3 /* MessageType.ERROR */
                        });
                    }
                    else {
                        inputBox.hideMessage();
                    }
                }
            };
            showInputBoxNotification();
            const toDispose = [
                inputBox,
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => {
                    e.stopPropagation();
                    if (e.equals(3 /* KeyCode.Enter */)) {
                        done(inputBox.isInputValid(), true);
                    }
                    else if (e.equals(9 /* KeyCode.Escape */)) {
                        done(false, true);
                    }
                }),
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_UP, (e) => {
                    showInputBoxNotification();
                }),
                DOM.addDisposableListener(inputBox.inputElement, DOM.EventType.BLUR, () => {
                    done(inputBox.isInputValid(), true);
                })
            ];
            return (0, lifecycle_1.toDisposable)(() => {
                done(false, false);
            });
        }
        disposeElement(instance, index, templateData) {
            templateData.elementDisposables.clear();
            templateData.actionBar.clear();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
            templateData.label.dispose();
            templateData.actionBar.dispose();
        }
        fillActionBar(instance, template) {
            // If the instance is within the selection, split all selected
            const actions = [
                new actions_2.Action("workbench.action.terminal.splitActiveTab" /* TerminalCommandId.SplitActiveTab */, terminalStrings_1.terminalStrings.split.short, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitHorizontal), true, async () => {
                    this._runForSelectionOrInstance(instance, async (e) => {
                        this._terminalService.createTerminal({ location: { parentTerminal: e } });
                    });
                }),
                new actions_2.Action("workbench.action.terminal.killActiveTab" /* TerminalCommandId.KillActiveTab */, terminalStrings_1.terminalStrings.kill.short, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.trashcan), true, async () => {
                    this._runForSelectionOrInstance(instance, e => this._terminalService.safeDisposeTerminal(e));
                })
            ];
            // TODO: Cache these in a way that will use the correct instance
            template.actionBar.clear();
            for (const action of actions) {
                template.actionBar.push(action, { icon: true, label: false, keybinding: this._keybindingService.lookupKeybinding(action.id)?.getLabel() });
            }
        }
        _runForSelectionOrInstance(instance, callback) {
            const selection = this._getSelection();
            if (selection.includes(instance)) {
                for (const s of selection) {
                    if (s) {
                        callback(s);
                    }
                }
            }
            else {
                callback(instance);
            }
            this._terminalGroupService.focusTabs();
            this._listService.lastFocusedList?.focusNext();
        }
    };
    TerminalTabsRenderer = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, terminal_1.ITerminalService),
        __param(5, terminal_1.ITerminalGroupService),
        __param(6, hover_1.IHoverService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, listService_1.IListService),
        __param(10, themeService_1.IThemeService),
        __param(11, contextView_1.IContextViewService)
    ], TerminalTabsRenderer);
    let TerminalTabsAccessibilityProvider = class TerminalTabsAccessibilityProvider {
        constructor(_terminalGroupService) {
            this._terminalGroupService = _terminalGroupService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('terminal.tabs', "Terminal tabs");
        }
        getAriaLabel(instance) {
            let ariaLabel = '';
            const tab = this._terminalGroupService.getGroupForInstance(instance);
            if (tab && tab.terminalInstances?.length > 1) {
                const terminalIndex = tab.terminalInstances.indexOf(instance);
                ariaLabel = (0, nls_1.localize)({
                    key: 'splitTerminalAriaLabel',
                    comment: [
                        `The terminal's ID`,
                        `The terminal's title`,
                        `The terminal's split number`,
                        `The terminal group's total split number`
                    ]
                }, "Terminal {0} {1}, split {2} of {3}", instance.instanceId, instance.title, terminalIndex + 1, tab.terminalInstances.length);
            }
            else {
                ariaLabel = (0, nls_1.localize)({
                    key: 'terminalAriaLabel',
                    comment: [
                        `The terminal's ID`,
                        `The terminal's title`
                    ]
                }, "Terminal {0} {1}", instance.instanceId, instance.title);
            }
            return ariaLabel;
        }
    };
    TerminalTabsAccessibilityProvider = __decorate([
        __param(0, terminal_1.ITerminalGroupService)
    ], TerminalTabsAccessibilityProvider);
    let TerminalTabsDragAndDrop = class TerminalTabsDragAndDrop extends lifecycle_1.Disposable {
        constructor(_terminalService, _terminalGroupService) {
            super();
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._autoFocusDisposable = lifecycle_1.Disposable.None;
            this._primaryBackend = this._terminalService.getPrimaryBackend();
        }
        getDragURI(instance) {
            if (this._terminalService.getEditingTerminal()?.instanceId === instance.instanceId) {
                return null;
            }
            return instance.resource.toString();
        }
        getDragLabel(elements, originalEvent) {
            return elements.length === 1 ? elements[0].title : undefined;
        }
        onDragLeave() {
            this._autoFocusInstance = undefined;
            this._autoFocusDisposable.dispose();
            this._autoFocusDisposable = lifecycle_1.Disposable.None;
        }
        onDragStart(data, originalEvent) {
            if (!originalEvent.dataTransfer) {
                return;
            }
            const dndData = data.getData();
            if (!Array.isArray(dndData)) {
                return;
            }
            // Attach terminals type to event
            const terminals = dndData.filter(e => 'instanceId' in e);
            if (terminals.length > 0) {
                originalEvent.dataTransfer.setData("Terminals" /* TerminalDataTransfers.Terminals */, JSON.stringify(terminals.map(e => e.resource.toString())));
            }
        }
        onDragOver(data, targetInstance, targetIndex, targetSector, originalEvent) {
            if (data instanceof listView_1.NativeDragAndDropData) {
                if (!(0, dnd_2.containsDragType)(originalEvent, dnd_1.DataTransfers.FILES, dnd_1.DataTransfers.RESOURCES, "Terminals" /* TerminalDataTransfers.Terminals */, dnd_2.CodeDataTransfers.FILES)) {
                    return false;
                }
            }
            const didChangeAutoFocusInstance = this._autoFocusInstance !== targetInstance;
            if (didChangeAutoFocusInstance) {
                this._autoFocusDisposable.dispose();
                this._autoFocusInstance = targetInstance;
            }
            if (!targetInstance && !(0, dnd_2.containsDragType)(originalEvent, "Terminals" /* TerminalDataTransfers.Terminals */)) {
                return data instanceof listView_1.ElementsDragAndDropData;
            }
            if (didChangeAutoFocusInstance && targetInstance) {
                this._autoFocusDisposable = (0, async_1.disposableTimeout)(() => {
                    this._terminalService.setActiveInstance(targetInstance);
                    this._autoFocusInstance = undefined;
                }, 500, this._store);
            }
            return {
                feedback: targetIndex ? [targetIndex] : undefined,
                accept: true,
                effect: { type: 1 /* ListDragOverEffectType.Move */, position: "drop-target" /* ListDragOverEffectPosition.Over */ }
            };
        }
        async drop(data, targetInstance, targetIndex, targetSector, originalEvent) {
            this._autoFocusDisposable.dispose();
            this._autoFocusInstance = undefined;
            let sourceInstances;
            const promises = [];
            const resources = (0, terminalUri_1.getTerminalResourcesFromDragEvent)(originalEvent);
            if (resources) {
                for (const uri of resources) {
                    const instance = this._terminalService.getInstanceFromResource(uri);
                    if (instance) {
                        sourceInstances = [instance];
                        this._terminalService.moveToTerminalView(instance);
                    }
                    else if (this._primaryBackend) {
                        const terminalIdentifier = (0, terminalUri_1.parseTerminalUri)(uri);
                        if (terminalIdentifier.instanceId) {
                            promises.push(this._primaryBackend.requestDetachInstance(terminalIdentifier.workspaceId, terminalIdentifier.instanceId));
                        }
                    }
                }
            }
            if (promises.length) {
                let processes = await Promise.all(promises);
                processes = processes.filter(p => p !== undefined);
                let lastInstance;
                for (const attachPersistentProcess of processes) {
                    lastInstance = await this._terminalService.createTerminal({ config: { attachPersistentProcess } });
                }
                if (lastInstance) {
                    this._terminalService.setActiveInstance(lastInstance);
                }
                return;
            }
            if (sourceInstances === undefined) {
                if (!(data instanceof listView_1.ElementsDragAndDropData)) {
                    this._handleExternalDrop(targetInstance, originalEvent);
                    return;
                }
                const draggedElement = data.getData();
                if (!draggedElement || !Array.isArray(draggedElement)) {
                    return;
                }
                sourceInstances = [];
                for (const e of draggedElement) {
                    if ('instanceId' in e) {
                        sourceInstances.push(e);
                    }
                }
            }
            if (!targetInstance) {
                this._terminalGroupService.moveGroupToEnd(sourceInstances[0]);
                this._terminalService.setActiveInstance(sourceInstances[0]);
                return;
            }
            let focused = false;
            for (const instance of sourceInstances) {
                this._terminalGroupService.moveGroup(instance, targetInstance);
                if (!focused) {
                    this._terminalService.setActiveInstance(instance);
                    focused = true;
                }
            }
        }
        async _handleExternalDrop(instance, e) {
            if (!instance || !e.dataTransfer) {
                return;
            }
            // Check if files were dragged from the tree explorer
            let resource;
            const rawResources = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
            if (rawResources) {
                resource = uri_1.URI.parse(JSON.parse(rawResources)[0]);
            }
            const rawCodeFiles = e.dataTransfer.getData(dnd_2.CodeDataTransfers.FILES);
            if (!resource && rawCodeFiles) {
                resource = uri_1.URI.file(JSON.parse(rawCodeFiles)[0]);
            }
            if (!resource && e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].path /* Electron only */) {
                // Check if the file was dragged from the filesystem
                resource = uri_1.URI.file(e.dataTransfer.files[0].path);
            }
            if (!resource) {
                return;
            }
            this._terminalService.setActiveInstance(instance);
            instance.focus();
            await instance.sendPath(resource, false);
        }
    };
    TerminalTabsDragAndDrop = __decorate([
        __param(0, terminal_1.ITerminalService),
        __param(1, terminal_1.ITerminalGroupService)
    ], TerminalTabsDragAndDrop);
    let TabDecorationsProvider = class TabDecorationsProvider extends lifecycle_1.Disposable {
        constructor(_terminalService) {
            super();
            this._terminalService = _terminalService;
            this.label = (0, nls_1.localize)('label', "Terminal");
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(this._terminalService.onAnyInstancePrimaryStatusChange(e => this._onDidChange.fire([e.resource])));
        }
        provideDecorations(resource) {
            if (resource.scheme !== network_1.Schemas.vscodeTerminal) {
                return undefined;
            }
            const instance = this._terminalService.getInstanceFromResource(resource);
            if (!instance) {
                return undefined;
            }
            const primaryStatus = instance?.statusList?.primary;
            if (!primaryStatus?.icon) {
                return undefined;
            }
            return {
                color: (0, terminalStatusList_1.getColorForSeverity)(primaryStatus.severity),
                letter: primaryStatus.icon,
                tooltip: primaryStatus.tooltip
            };
        }
    };
    TabDecorationsProvider = __decorate([
        __param(0, terminal_1.ITerminalService)
    ], TabDecorationsProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUYWJzTGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxUYWJzTGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtRGhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsSUFBa0IscUJBUWpCO0lBUkQsV0FBa0IscUJBQXFCO1FBQ3RDLDRFQUFjLENBQUE7UUFDZCx3RkFBb0IsQ0FBQTtRQUNwQixrR0FBeUIsQ0FBQTtRQUN6QixtRkFBa0IsQ0FBQTtRQUNsQiw0RkFBNEcsQ0FBQTtRQUM1RyxxR0FBMkIsQ0FBQTtRQUMzQixtRkFBa0IsQ0FBQTtJQUNuQixDQUFDLEVBUmlCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBUXRDO0lBRU0sSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSwyQkFBZ0M7UUFLcEUsWUFDQyxTQUFzQixFQUNGLGlCQUFxQyxFQUMzQyxXQUF5QixFQUN4QixZQUEyQixFQUNGLHFCQUE0QyxFQUNqRCxnQkFBa0MsRUFDN0IscUJBQTRDLEVBQzdELG9CQUEyQyxFQUM3QyxrQkFBdUMsRUFDNUIsYUFBNEIsRUFDekMsZ0JBQW1DLEVBQ3RCLGFBQTRCO1lBRTVELEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLEVBQ2xDO2dCQUNDLFNBQVMsRUFBRSxHQUFHLEVBQUUseUNBQWdDO2dCQUNoRCxhQUFhLEVBQUUsR0FBRyxFQUFFLENBQUMsZUFBZTthQUNwQyxFQUNELENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsdUJBQWMsRUFBRSxpQ0FBd0IsQ0FBQyxF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