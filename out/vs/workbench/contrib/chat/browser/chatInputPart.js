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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fonts", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/toggle/toggle", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/history", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/services/model", "vs/editor/contrib/hover/browser/hoverController", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/chat/browser/actions/chatExecuteActions", "vs/workbench/contrib/chat/browser/chatFollowups", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions"], function (require, exports, dom, fonts_1, aria, toggle_1, codicons_1, event_1, history_1, lifecycle_1, platform_1, uri_1, editorExtensions_1, codeEditorWidget_1, model_1, hoverController_1, nls_1, accessibility_1, dropdownWithPrimaryActionViewItem_1, menuEntryActionViewItem_1, toolbar_1, actions_1, configuration_1, contextkey_1, contextView_1, contextScopedHistoryWidget_1, instantiation_1, serviceCollection_1, keybinding_1, notification_1, defaultStyles_1, colorRegistry_1, themeService_1, chatExecuteActions_1, chatFollowups_1, chatAgents_1, chatContextKeys_1, chatWidgetHistoryService_1, simpleEditorOptions_1) {
    "use strict";
    var ChatInputPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatInputPart = void 0;
    const $ = dom.$;
    const INPUT_EDITOR_MAX_HEIGHT = 250;
    let ChatInputPart = class ChatInputPart extends lifecycle_1.Disposable {
        static { ChatInputPart_1 = this; }
        static { this.INPUT_SCHEME = 'chatSessionInput'; }
        static { this._counter = 0; }
        get implicitContextEnabled() {
            return this.implicitContextCheckbox.checked;
        }
        get inputPartHeight() {
            return this._inputPartHeight;
        }
        get inputEditor() {
            return this._inputEditor;
        }
        constructor(
        // private readonly editorOptions: ChatEditorOptions, // TODO this should be used
        location, options, historyService, modelService, instantiationService, contextKeyService, configurationService, keybindingService, accessibilityService) {
            super();
            this.location = location;
            this.options = options;
            this.historyService = historyService;
            this.modelService = modelService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.accessibilityService = accessibilityService;
            this._onDidLoadInputState = this._register(new event_1.Emitter());
            this.onDidLoadInputState = this._onDidLoadInputState.event;
            this._onDidChangeHeight = this._register(new event_1.Emitter());
            this.onDidChangeHeight = this._onDidChangeHeight.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidAcceptFollowup = this._register(new event_1.Emitter());
            this.onDidAcceptFollowup = this._onDidAcceptFollowup.event;
            this.inputEditorHeight = 0;
            this.followupsDisposables = this._register(new lifecycle_1.DisposableStore());
            this.implicitContextSettingEnabled = false;
            this._inputPartHeight = 0;
            this.onHistoryEntry = false;
            this.inHistoryNavigation = false;
            this.inputUri = uri_1.URI.parse(`${ChatInputPart_1.INPUT_SCHEME}:input-${ChatInputPart_1._counter++}`);
            this.inputEditorHasText = chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT.bindTo(contextKeyService);
            this.chatCursorAtTop = chatContextKeys_1.CONTEXT_CHAT_INPUT_CURSOR_AT_TOP.bindTo(contextKeyService);
            this.inputEditorHasFocus = chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_FOCUS.bindTo(contextKeyService);
            this.history = new history_1.HistoryNavigator([], 5);
            this._register(this.historyService.onDidClearHistory(() => this.history.clear()));
            this.implicitContextSettingEnabled = this.configurationService.getValue('chat.experimental.implicitContext');
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */)) {
                    this.inputEditor.updateOptions({ ariaLabel: this._getAriaLabel() });
                }
                if (e.affectsConfiguration('chat.experimental.implicitContext')) {
                    this.implicitContextSettingEnabled = this.configurationService.getValue('chat.experimental.implicitContext');
                }
            }));
        }
        _getAriaLabel() {
            const verbose = this.configurationService.getValue("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */);
            if (verbose) {
                const kbLabel = this.keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */)?.getLabel();
                return kbLabel ? (0, nls_1.localize)('actions.chat.accessibiltyHelp', "Chat Input,  Type to ask questions or type / for topics, press enter to send out the request. Use {0} for Chat Accessibility Help.", kbLabel) : (0, nls_1.localize)('chatInput.accessibilityHelpNoKb', "Chat Input,  Type code here and press Enter to run. Use the Chat Accessibility Help command for more information.");
            }
            return (0, nls_1.localize)('chatInput', "Chat Input");
        }
        setState(inputValue) {
            const history = this.historyService.getHistory();
            this.history = new history_1.HistoryNavigator(history, 50);
            if (typeof inputValue === 'string') {
                this.setValue(inputValue);
            }
        }
        get element() {
            return this.container;
        }
        showPreviousValue() {
            this.navigateHistory(true);
        }
        showNextValue() {
            this.navigateHistory(false);
        }
        navigateHistory(previous) {
            const historyEntry = (previous ?
                (this.history.previous() ?? this.history.first()) : this.history.next())
                ?? { text: '' };
            this.onHistoryEntry = previous || this.history.current() !== null;
            aria.status(historyEntry.text);
            this.inHistoryNavigation = true;
            this.setValue(historyEntry.text);
            this.inHistoryNavigation = false;
            this._onDidLoadInputState.fire(historyEntry.state);
            if (previous) {
                this._inputEditor.setPosition({ lineNumber: 1, column: 1 });
            }
            else {
                const model = this._inputEditor.getModel();
                if (!model) {
                    return;
                }
                this._inputEditor.setPosition(getLastPosition(model));
            }
        }
        setValue(value) {
            this.inputEditor.setValue(value);
            // always leave cursor at the end
            this.inputEditor.setPosition({ lineNumber: 1, column: value.length + 1 });
        }
        focus() {
            this._inputEditor.focus();
        }
        hasFocus() {
            return this._inputEditor.hasWidgetFocus();
        }
        /**
         * Reset the input and update history.
         * @param userQuery If provided, this will be added to the history. Followups and programmatic queries should not be passed.
         */
        async acceptInput(userQuery, inputState) {
            if (userQuery) {
                let element = this.history.getHistory().find(candidate => candidate.text === userQuery);
                if (!element) {
                    element = { text: userQuery, state: inputState };
                }
                else {
                    element.state = inputState;
                }
                this.history.add(element);
            }
            if (this.accessibilityService.isScreenReaderOptimized() && platform_1.isMacintosh) {
                this._acceptInputForVoiceover();
            }
            else {
                this._inputEditor.focus();
                this._inputEditor.setValue('');
            }
        }
        _acceptInputForVoiceover() {
            const domNode = this._inputEditor.getDomNode();
            if (!domNode) {
                return;
            }
            // Remove the input editor from the DOM temporarily to prevent VoiceOver
            // from reading the cleared text (the request) to the user.
            this._inputEditorElement.removeChild(domNode);
            this._inputEditor.setValue('');
            this._inputEditorElement.appendChild(domNode);
            this._inputEditor.focus();
        }
        render(container, initialValue, widget) {
            this.container = dom.append(container, $('.interactive-input-part'));
            this.container.classList.toggle('compact', this.options.renderStyle === 'compact');
            this.followupsContainer = dom.append(this.container, $('.interactive-input-followups'));
            this.implicitContextContainer = dom.append(this.container, $('.chat-implicit-context'));
            this.initImplicitContext(this.implicitContextContainer);
            const inputAndSideToolbar = dom.append(this.container, $('.interactive-input-and-side-toolbar'));
            const inputContainer = dom.append(inputAndSideToolbar, $('.interactive-input-and-execute-toolbar'));
            const inputScopedContextKeyService = this._register(this.contextKeyService.createScoped(inputContainer));
            chatContextKeys_1.CONTEXT_IN_CHAT_INPUT.bindTo(inputScopedContextKeyService).set(true);
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, inputScopedContextKeyService]));
            const { historyNavigationBackwardsEnablement, historyNavigationForwardsEnablement } = this._register((0, contextScopedHistoryWidget_1.registerAndCreateHistoryNavigationContext)(inputScopedContextKeyService, this));
            this.historyNavigationBackwardsEnablement = historyNavigationBackwardsEnablement;
            this.historyNavigationForewardsEnablement = historyNavigationForwardsEnablement;
            const options = (0, simpleEditorOptions_1.getSimpleEditorOptions)(this.configurationService);
            options.overflowWidgetsDomNode = this.options.editorOverflowWidgetsDomNode;
            options.readOnly = false;
            options.ariaLabel = this._getAriaLabel();
            options.fontFamily = fonts_1.DEFAULT_FONT_FAMILY;
            options.fontSize = 13;
            options.lineHeight = 20;
            options.padding = this.options.renderStyle === 'compact' ? { top: 2, bottom: 2 } : { top: 8, bottom: 8 };
            options.cursorWidth = 1;
            options.wrappingStrategy = 'advanced';
            options.bracketPairColorization = { enabled: false };
            options.suggest = {
                showIcons: false,
                showSnippets: false,
                showWords: true,
                showStatusBar: false,
                insertMode: 'replace',
            };
            options.scrollbar = { ...(options.scrollbar ?? {}), vertical: 'hidden' };
            this._inputEditorElement = dom.append(inputContainer, $('.interactive-input-editor'));
            const editorOptions = (0, simpleEditorOptions_1.getSimpleCodeEditorWidgetOptions)();
            editorOptions.contributions?.push(...editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([hoverController_1.HoverController.ID]));
            this._inputEditor = this._register(scopedInstantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._inputEditorElement, options, editorOptions));
            this._register(this._inputEditor.onDidChangeModelContent(() => {
                const currentHeight = Math.min(this._inputEditor.getContentHeight(), INPUT_EDITOR_MAX_HEIGHT);
                if (currentHeight !== this.inputEditorHeight) {
                    this.inputEditorHeight = currentHeight;
                    this._onDidChangeHeight.fire();
                }
                // Only allow history navigation when the input is empty.
                // (If this model change happened as a result of a history navigation, this is canceled out by a call in this.navigateHistory)
                const model = this._inputEditor.getModel();
                const inputHasText = !!model && model.getValue().trim().length > 0;
                this.inputEditorHasText.set(inputHasText);
                // If the user is typing on a history entry, then reset the onHistoryEntry flag so that history navigation can be disabled
                if (!this.inHistoryNavigation) {
                    this.onHistoryEntry = false;
                }
                if (!this.onHistoryEntry) {
                    this.historyNavigationForewardsEnablement.set(!inputHasText);
                    this.historyNavigationBackwardsEnablement.set(!inputHasText);
                }
            }));
            this._register(this._inputEditor.onDidFocusEditorText(() => {
                this.inputEditorHasFocus.set(true);
                this._onDidFocus.fire();
                inputContainer.classList.toggle('focused', true);
            }));
            this._register(this._inputEditor.onDidBlurEditorText(() => {
                this.inputEditorHasFocus.set(false);
                inputContainer.classList.toggle('focused', false);
                this._onDidBlur.fire();
            }));
            this._register(this._inputEditor.onDidChangeCursorPosition(e => {
                const model = this._inputEditor.getModel();
                if (!model) {
                    return;
                }
                const atTop = e.position.column === 1 && e.position.lineNumber === 1;
                this.chatCursorAtTop.set(atTop);
                if (this.onHistoryEntry) {
                    this.historyNavigationBackwardsEnablement.set(atTop);
                    this.historyNavigationForewardsEnablement.set(e.position.equals(getLastPosition(model)));
                }
            }));
            this.toolbar = this._register(this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, inputContainer, this.options.menus.executeToolbar, {
                telemetrySource: this.options.menus.telemetrySource,
                menuOptions: {
                    shouldForwardArgs: true
                },
                hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */, // keep it lean when hiding items and avoid a "..." overflow menu
                actionViewItemProvider: (action, options) => {
                    if (this.location === chatAgents_1.ChatAgentLocation.Panel) {
                        if ((action.id === chatExecuteActions_1.SubmitAction.ID || action.id === chatExecuteActions_1.CancelAction.ID) && action instanceof actions_1.MenuItemAction) {
                            const dropdownAction = this.instantiationService.createInstance(actions_1.MenuItemAction, { id: 'chat.moreExecuteActions', title: (0, nls_1.localize)('notebook.moreExecuteActionsLabel', "More..."), icon: codicons_1.Codicon.chevronDown }, undefined, undefined, undefined, undefined);
                            return this.instantiationService.createInstance(ChatSubmitDropdownActionItem, action, dropdownAction);
                        }
                    }
                    return undefined;
                }
            }));
            this.toolbar.getElement().classList.add('interactive-execute-toolbar');
            this.toolbar.context = { widget };
            this._register(this.toolbar.onDidChangeMenuItems(() => {
                if (this.cachedDimensions && typeof this.cachedToolbarWidth === 'number' && this.cachedToolbarWidth !== this.toolbar.getItemsWidth()) {
                    this.layout(this.cachedDimensions.height, this.cachedDimensions.width);
                }
            }));
            if (this.options.menus.inputSideToolbar) {
                const toolbarSide = this._register(this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, inputAndSideToolbar, this.options.menus.inputSideToolbar, {
                    telemetrySource: this.options.menus.telemetrySource,
                    menuOptions: {
                        shouldForwardArgs: true
                    }
                }));
                this.inputSideToolbarContainer = toolbarSide.getElement();
                toolbarSide.getElement().classList.add('chat-side-toolbar');
                toolbarSide.context = { widget };
            }
            let inputModel = this.modelService.getModel(this.inputUri);
            if (!inputModel) {
                inputModel = this.modelService.createModel('', null, this.inputUri, true);
                this._register(inputModel);
            }
            this.inputModel = inputModel;
            this.inputModel.updateOptions({ bracketColorizationOptions: { enabled: false, independentColorPoolPerBracketType: false } });
            this._inputEditor.setModel(this.inputModel);
            if (initialValue) {
                this.inputModel.setValue(initialValue);
                const lineNumber = this.inputModel.getLineCount();
                this._inputEditor.setPosition({ lineNumber, column: this.inputModel.getLineMaxColumn(lineNumber) });
            }
        }
        initImplicitContext(container) {
            this.implicitContextCheckbox = new toggle_1.Checkbox('#selection', true, { ...defaultStyles_1.defaultCheckboxStyles, checkboxBorder: (0, colorRegistry_1.asCssVariableWithDefault)(colorRegistry_1.checkboxBorder, colorRegistry_1.inputBackground) });
            container.append(this.implicitContextCheckbox.domNode);
            this.implicitContextLabel = dom.append(container, $('span.chat-implicit-context-label'));
            this.implicitContextLabel.textContent = '#selection';
        }
        setImplicitContextKinds(kinds) {
            dom.setVisibility(this.implicitContextSettingEnabled && kinds.length > 0, this.implicitContextContainer);
            this.implicitContextLabel.textContent = (0, nls_1.localize)('use', "Use") + ' ' + kinds.map(k => `#${k}`).join(', ');
        }
        async renderFollowups(items, response) {
            if (!this.options.renderFollowups) {
                return;
            }
            this.followupsDisposables.clear();
            dom.clearNode(this.followupsContainer);
            if (items && items.length > 0) {
                this.followupsDisposables.add(this.instantiationService.createInstance(chatFollowups_1.ChatFollowups, this.followupsContainer, items, this.location, undefined, followup => this._onDidAcceptFollowup.fire({ followup, response })));
            }
        }
        get contentHeight() {
            const data = this.getLayoutData();
            return data.followupsHeight + data.inputPartEditorHeight + data.inputPartVerticalPadding + data.inputEditorBorder + data.implicitContextHeight;
        }
        layout(height, width) {
            this.cachedDimensions = new dom.Dimension(width, height);
            return this._layout(height, width);
        }
        _layout(height, width, allowRecurse = true) {
            const data = this.getLayoutData();
            const inputEditorHeight = Math.min(data.inputPartEditorHeight, height - data.followupsHeight - data.inputPartVerticalPadding);
            this._inputPartHeight = data.followupsHeight + inputEditorHeight + data.inputPartVerticalPadding + data.inputEditorBorder + data.implicitContextHeight;
            const initialEditorScrollWidth = this._inputEditor.getScrollWidth();
            const newEditorWidth = width - data.inputPartHorizontalPadding - data.editorBorder - data.editorPadding - data.executeToolbarWidth - data.sideToolbarWidth - data.toolbarPadding;
            const newDimension = { width: newEditorWidth, height: inputEditorHeight };
            if (!this.previousInputEditorDimension || (this.previousInputEditorDimension.width !== newDimension.width || this.previousInputEditorDimension.height !== newDimension.height)) {
                // This layout call has side-effects that are hard to understand. eg if we are calling this inside a onDidChangeContent handler, this can trigger the next onDidChangeContent handler
                // to be invoked, and we have a lot of these on this editor. Only doing a layout this when the editor size has actually changed makes it much easier to follow.
                this._inputEditor.layout(newDimension);
                this.previousInputEditorDimension = newDimension;
            }
            if (allowRecurse && initialEditorScrollWidth < 10) {
                // This is probably the initial layout. Now that the editor is layed out with its correct width, it should report the correct contentHeight
                return this._layout(height, width, false);
            }
        }
        getLayoutData() {
            return {
                inputEditorBorder: 2,
                followupsHeight: this.followupsContainer.offsetHeight,
                inputPartEditorHeight: Math.min(this._inputEditor.getContentHeight(), INPUT_EDITOR_MAX_HEIGHT),
                inputPartHorizontalPadding: this.options.renderStyle === 'compact' ? 8 : 40,
                inputPartVerticalPadding: this.options.renderStyle === 'compact' ? 12 : 24,
                implicitContextHeight: this.implicitContextContainer.offsetHeight,
                editorBorder: 2,
                editorPadding: 12,
                toolbarPadding: 4,
                executeToolbarWidth: this.cachedToolbarWidth = this.toolbar.getItemsWidth(),
                sideToolbarWidth: this.inputSideToolbarContainer ? dom.getTotalWidth(this.inputSideToolbarContainer) + 4 /*gap*/ : 0,
            };
        }
        saveState() {
            const inputHistory = this.history.getHistory();
            this.historyService.saveHistory(inputHistory);
        }
    };
    exports.ChatInputPart = ChatInputPart;
    exports.ChatInputPart = ChatInputPart = ChatInputPart_1 = __decorate([
        __param(2, chatWidgetHistoryService_1.IChatWidgetHistoryService),
        __param(3, model_1.IModelService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, accessibility_1.IAccessibilityService)
    ], ChatInputPart);
    function getLastPosition(model) {
        return { lineNumber: model.getLineCount(), column: model.getLineLength(model.getLineCount()) + 1 };
    }
    // This does seems like a lot just to customize an item with dropdown. This whole class exists just because we need an
    // onDidChange listener on the submenu, which is apparently not needed in other cases.
    let ChatSubmitDropdownActionItem = class ChatSubmitDropdownActionItem extends dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem {
        constructor(action, dropdownAction, menuService, contextMenuService, chatAgentService, contextKeyService, keybindingService, notificationService, themeService, accessibilityService) {
            super(action, dropdownAction, [], '', contextMenuService, {
                getKeyBinding: (action) => keybindingService.lookupKeybinding(action.id, contextKeyService)
            }, keybindingService, notificationService, contextKeyService, themeService, accessibilityService);
            const menu = menuService.createMenu(actions_1.MenuId.ChatExecuteSecondary, contextKeyService);
            const setActions = () => {
                const secondary = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, secondary);
                const secondaryAgent = chatAgentService.getSecondaryAgent();
                if (secondaryAgent) {
                    secondary.forEach(a => {
                        if (a.id === chatExecuteActions_1.ChatSubmitSecondaryAgentAction.ID) {
                            a.label = (0, nls_1.localize)('chat.submitToSecondaryAgent', "Send to @{0}", secondaryAgent.name);
                        }
                        return a;
                    });
                }
                this.update(dropdownAction, secondary);
            };
            setActions();
            this._register(menu.onDidChange(() => setActions()));
        }
    };
    ChatSubmitDropdownActionItem = __decorate([
        __param(2, actions_1.IMenuService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, chatAgents_1.IChatAgentService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, notification_1.INotificationService),
        __param(8, themeService_1.IThemeService),
        __param(9, accessibility_1.IAccessibilityService)
    ], ChatSubmitDropdownActionItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdElucHV0UGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0SW5wdXRQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFtRGhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsTUFBTSx1QkFBdUIsR0FBRyxHQUFHLENBQUM7SUFhN0IsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLHNCQUFVOztpQkFDNUIsaUJBQVksR0FBRyxrQkFBa0IsQUFBckIsQ0FBc0I7aUJBQ25DLGFBQVEsR0FBRyxDQUFDLEFBQUosQ0FBSztRQTZCNUIsSUFBSSxzQkFBc0I7WUFDekIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDO1FBQzdDLENBQUM7UUFHRCxJQUFJLGVBQWU7WUFDbEIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQU9ELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBaUJEO1FBQ0MsaUZBQWlGO1FBQ2hFLFFBQTJCLEVBQzNCLE9BQThCLEVBQ3BCLGNBQTBELEVBQ3RFLFlBQTRDLEVBQ3BDLG9CQUE0RCxFQUMvRCxpQkFBc0QsRUFDbkQsb0JBQTRELEVBQy9ELGlCQUFzRCxFQUNuRCxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFWUyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixZQUFPLEdBQVAsT0FBTyxDQUF1QjtZQUNILG1CQUFjLEdBQWQsY0FBYyxDQUEyQjtZQUNyRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNuQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzlDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM5QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2xDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUF0RTVFLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQU8sQ0FBQyxDQUFDO1lBQ3pELHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFFdkQsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDeEQsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUVuRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2pELGVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUVyQyxlQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDaEQsY0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBRW5DLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTZFLENBQUMsQ0FBQztZQUMvSCx3QkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRXZELHNCQUFpQixHQUFHLENBQUMsQ0FBQztZQU1iLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUt0RSxrQ0FBNkIsR0FBRyxLQUFLLENBQUM7WUFLdEMscUJBQWdCLEdBQVcsQ0FBQyxDQUFDO1lBaUI3QixtQkFBYyxHQUFHLEtBQUssQ0FBQztZQUN2Qix3QkFBbUIsR0FBRyxLQUFLLENBQUM7WUFTM0IsYUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxlQUFhLENBQUMsWUFBWSxVQUFVLGVBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFnQmhHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyw2Q0FBMkIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsZUFBZSxHQUFHLGtEQUFnQyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2xGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyw4Q0FBNEIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUVsRixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksMEJBQWdCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVsRixJQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxtQ0FBbUMsQ0FBQyxDQUFDO1lBQ3RILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyRSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsZ0ZBQXNDLEVBQUUsQ0FBQztvQkFDbEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDckUsQ0FBQztnQkFFRCxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxtQ0FBbUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2pFLElBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFVLG1DQUFtQyxDQUFDLENBQUM7Z0JBQ3ZILENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGFBQWE7WUFDcEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsZ0ZBQStDLENBQUM7WUFDbEcsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLHNGQUE4QyxFQUFFLFFBQVEsRUFBRSxDQUFDO2dCQUNsSCxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsK0JBQStCLEVBQUUsb0lBQW9JLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLG1IQUFtSCxDQUFDLENBQUM7WUFDOVcsQ0FBQztZQUNELE9BQU8sSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxRQUFRLENBQUMsVUFBOEI7WUFDdEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNqRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksMEJBQWdCLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRWpELElBQUksT0FBTyxVQUFVLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkIsQ0FBQztRQUVELGlCQUFpQjtZQUNoQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxhQUFhO1lBQ1osSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRU8sZUFBZSxDQUFDLFFBQWlCO1lBQ3hDLE1BQU0sWUFBWSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQy9CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7bUJBQ3JFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBRWpCLElBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxDQUFDO1lBRWxFLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRS9CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDaEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEtBQUssQ0FBQztZQUVqQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuRCxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM3RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNaLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RCxDQUFDO1FBQ0YsQ0FBQztRQUVELFFBQVEsQ0FBQyxLQUFhO1lBQ3JCLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pDLGlDQUFpQztZQUNqQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELFFBQVE7WUFDUCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDM0MsQ0FBQztRQUVEOzs7V0FHRztRQUNILEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBa0IsRUFBRSxVQUFnQjtZQUNyRCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQztnQkFDeEYsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNkLE9BQU8sR0FBRyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDO2dCQUNsRCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUM7Z0JBQzVCLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLHVCQUF1QixFQUFFLElBQUksc0JBQVcsRUFBRSxDQUFDO2dCQUN4RSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNqQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFTyx3QkFBd0I7WUFDL0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMvQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTztZQUNSLENBQUM7WUFDRCx3RUFBd0U7WUFDeEUsMkRBQTJEO1lBQzNELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxNQUFNLENBQUMsU0FBc0IsRUFBRSxZQUFvQixFQUFFLE1BQW1CO1lBQ3ZFLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQyxDQUFDO1lBRW5GLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQztZQUN4RixJQUFJLENBQUMsd0JBQXdCLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7WUFDeEYsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDLENBQUM7WUFDakcsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsd0NBQXdDLENBQUMsQ0FBQyxDQUFDO1lBRXBHLE1BQU0sNEJBQTRCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDekcsdUNBQXFCLENBQUMsTUFBTSxDQUFDLDRCQUE0QixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLHFDQUFpQixDQUFDLENBQUMsK0JBQWtCLEVBQUUsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFcEosTUFBTSxFQUFFLG9DQUFvQyxFQUFFLG1DQUFtQyxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHNFQUF5QyxFQUFDLDRCQUE0QixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEwsSUFBSSxDQUFDLG9DQUFvQyxHQUFHLG9DQUFvQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxvQ0FBb0MsR0FBRyxtQ0FBbUMsQ0FBQztZQUVoRixNQUFNLE9BQU8sR0FBK0IsSUFBQSw0Q0FBc0IsRUFBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUM5RixPQUFPLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQztZQUMzRSxPQUFPLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN6QixPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN6QyxPQUFPLENBQUMsVUFBVSxHQUFHLDJCQUFtQixDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ3pHLE9BQU8sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLENBQUM7WUFDdEMsT0FBTyxDQUFDLHVCQUF1QixHQUFHLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ3JELE9BQU8sQ0FBQyxPQUFPLEdBQUc7Z0JBQ2pCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixZQUFZLEVBQUUsS0FBSztnQkFDbkIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsYUFBYSxFQUFFLEtBQUs7Z0JBQ3BCLFVBQVUsRUFBRSxTQUFTO2FBQ3JCLENBQUM7WUFDRixPQUFPLENBQUMsU0FBUyxHQUFHLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBRXpFLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sYUFBYSxHQUFHLElBQUEsc0RBQWdDLEdBQUUsQ0FBQztZQUN6RCxhQUFhLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxHQUFHLDJDQUF3QixDQUFDLDBCQUEwQixDQUFDLENBQUMsaUNBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEgsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyxtQ0FBZ0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFFbEosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRTtnQkFDN0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztnQkFDOUYsSUFBSSxhQUFhLEtBQUssSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQzlDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxhQUFhLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQztnQkFFRCx5REFBeUQ7Z0JBQ3pELDhIQUE4SDtnQkFDOUgsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFFMUMsMEhBQTBIO2dCQUMxSCxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQy9CLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO2dCQUM3QixDQUFDO2dCQUVELElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQzFCLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxHQUFHLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDN0QsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM5RCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQzFELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRTtnQkFDekQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDcEMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUVsRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzlELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDWixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQztnQkFDckUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRWhDLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsb0NBQW9DLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNyRCxJQUFJLENBQUMsb0NBQW9DLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsOEJBQW9CLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRTtnQkFDL0ksZUFBZSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWU7Z0JBQ25ELFdBQVcsRUFBRTtvQkFDWixpQkFBaUIsRUFBRSxJQUFJO2lCQUN2QjtnQkFDRCxrQkFBa0IsbUNBQTJCLEVBQUUsaUVBQWlFO2dCQUNoSCxzQkFBc0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRTtvQkFDM0MsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLDhCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxpQ0FBWSxDQUFDLEVBQUUsSUFBSSxNQUFNLENBQUMsRUFBRSxLQUFLLGlDQUFZLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxZQUFZLHdCQUFjLEVBQUUsQ0FBQzs0QkFDMUcsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx3QkFBYyxFQUFFLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxrQ0FBa0MsRUFBRSxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQzs0QkFDMVAsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDRCQUE0QixFQUFFLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQzt3QkFDdkcsQ0FBQztvQkFDRixDQUFDO29CQUVELE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztZQUN2RSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxFQUFFLE1BQU0sRUFBc0MsQ0FBQztZQUN0RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFO2dCQUNyRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxPQUFPLElBQUksQ0FBQyxrQkFBa0IsS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLGtCQUFrQixLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQztvQkFDdEksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEUsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw4QkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDM0osZUFBZSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWU7b0JBQ25ELFdBQVcsRUFBRTt3QkFDWixpQkFBaUIsRUFBRSxJQUFJO3FCQUN2QjtpQkFDRCxDQUFDLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMseUJBQXlCLEdBQUcsV0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUMxRCxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUM1RCxXQUFXLENBQUMsT0FBTyxHQUFHLEVBQUUsTUFBTSxFQUFzQyxDQUFDO1lBQ3RFLENBQUM7WUFFRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMxRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFLDBCQUEwQixFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN2QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDckcsQ0FBQztRQUNGLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxTQUFzQjtZQUNqRCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxpQkFBUSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLHFDQUFxQixFQUFFLGNBQWMsRUFBRSxJQUFBLHdDQUF3QixFQUFDLDhCQUFjLEVBQUUsK0JBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN6SyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxHQUFHLFlBQVksQ0FBQztRQUN0RCxDQUFDO1FBRUQsdUJBQXVCLENBQUMsS0FBZTtZQUN0QyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUN6RyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxHQUFHLElBQUEsY0FBUSxFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0csQ0FBQztRQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBa0MsRUFBRSxRQUE0QztZQUNyRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDbkMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbEMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUV2QyxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQW9FLDZCQUFhLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDelIsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLGFBQWE7WUFDaEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUM7UUFDaEosQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFjLEVBQUUsS0FBYTtZQUNuQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUV6RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFHTyxPQUFPLENBQUMsTUFBYyxFQUFFLEtBQWEsRUFBRSxZQUFZLEdBQUcsSUFBSTtZQUVqRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFbEMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUU5SCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGVBQWUsR0FBRyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztZQUV2SixNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEUsTUFBTSxjQUFjLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQ2pMLE1BQU0sWUFBWSxHQUFHLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQztZQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLDRCQUE0QixJQUFJLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssS0FBSyxZQUFZLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxNQUFNLEtBQUssWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ2hMLHFMQUFxTDtnQkFDckwsK0pBQStKO2dCQUMvSixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLDRCQUE0QixHQUFHLFlBQVksQ0FBQztZQUNsRCxDQUFDO1lBRUQsSUFBSSxZQUFZLElBQUksd0JBQXdCLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELDJJQUEySTtnQkFDM0ksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0MsQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhO1lBQ3BCLE9BQU87Z0JBQ04saUJBQWlCLEVBQUUsQ0FBQztnQkFDcEIsZUFBZSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZO2dCQUNyRCxxQkFBcUIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSx1QkFBdUIsQ0FBQztnQkFDOUYsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzNFLHdCQUF3QixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMxRSxxQkFBcUIsRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsWUFBWTtnQkFDakUsWUFBWSxFQUFFLENBQUM7Z0JBQ2YsYUFBYSxFQUFFLEVBQUU7Z0JBQ2pCLGNBQWMsRUFBRSxDQUFDO2dCQUNqQixtQkFBbUIsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7Z0JBQzNFLGdCQUFnQixFQUFFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BILENBQUM7UUFDSCxDQUFDO1FBRUQsU0FBUztZQUNSLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDL0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDL0MsQ0FBQzs7SUEzYVcsc0NBQWE7NEJBQWIsYUFBYTtRQW9FdkIsV0FBQSxvREFBeUIsQ0FBQTtRQUN6QixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEscUNBQXFCLENBQUE7T0ExRVgsYUFBYSxDQTRhekI7SUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFpQjtRQUN6QyxPQUFPLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztJQUNwRyxDQUFDO0lBRUQsc0hBQXNIO0lBQ3RILHNGQUFzRjtJQUN0RixJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHFFQUFpQztRQUMzRSxZQUNDLE1BQXNCLEVBQ3RCLGNBQXVCLEVBQ1QsV0FBeUIsRUFDbEIsa0JBQXVDLEVBQ3pDLGdCQUFtQyxFQUNsQyxpQkFBcUMsRUFDckMsaUJBQXFDLEVBQ25DLG1CQUF5QyxFQUNoRCxZQUEyQixFQUNuQixvQkFBMkM7WUFFbEUsS0FBSyxDQUNKLE1BQU0sRUFDTixjQUFjLEVBQ2QsRUFBRSxFQUNGLEVBQUUsRUFDRixrQkFBa0IsRUFDbEI7Z0JBQ0MsYUFBYSxFQUFFLENBQUMsTUFBZSxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGlCQUFpQixDQUFDO2FBQ3BHLEVBQ0QsaUJBQWlCLEVBQ2pCLG1CQUFtQixFQUNuQixpQkFBaUIsRUFDakIsWUFBWSxFQUNaLG9CQUFvQixDQUFDLENBQUM7WUFDdkIsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxnQkFBTSxDQUFDLG9CQUFvQixFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDcEYsTUFBTSxVQUFVLEdBQUcsR0FBRyxFQUFFO2dCQUN2QixNQUFNLFNBQVMsR0FBYyxFQUFFLENBQUM7Z0JBQ2hDLElBQUEseURBQStCLEVBQUMsSUFBSSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzlFLE1BQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzVELElBQUksY0FBYyxFQUFFLENBQUM7b0JBQ3BCLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ3JCLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxtREFBOEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQzs0QkFDaEQsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUN4RixDQUFDO3dCQUVELE9BQU8sQ0FBQyxDQUFDO29CQUNWLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDO1lBQ0YsVUFBVSxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7S0FDRCxDQUFBO0lBL0NLLDRCQUE0QjtRQUkvQixXQUFBLHNCQUFZLENBQUE7UUFDWixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSxxQ0FBcUIsQ0FBQTtPQVhsQiw0QkFBNEIsQ0ErQ2pDIn0=