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
define(["require", "exports", "vs/nls", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/base/common/types", "vs/base/browser/browser", "vs/base/common/errors", "vs/workbench/common/editor/sideBySideEditorInput", "vs/platform/actions/browser/toolbar", "vs/platform/dnd/browser/dnd", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/platform", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/serviceCollection", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/editortabscontrol"], function (require, exports, nls_1, dnd_1, dom_1, mouseEvent_1, actionbar_1, actions_1, lifecycle_1, menuEntryActionViewItem_1, actions_2, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, quickInput_1, colorRegistry_1, themeService_1, dnd_2, editorPane_1, editor_1, contextkeys_1, types_1, browser_1, errors_1, sideBySideEditorInput_1, toolbar_1, dnd_3, editorResolverService_1, editorCommands_1, platform_1, host_1, serviceCollection_1, hoverDelegateFactory_1) {
    "use strict";
    var EditorTabsControl_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorTabsControl = exports.EditorCommandsContextActionRunner = void 0;
    class EditorCommandsContextActionRunner extends actions_1.ActionRunner {
        constructor(context) {
            super();
            this.context = context;
        }
        run(action, context) {
            // Even though we have a fixed context for editor commands,
            // allow to preserve the context that is given to us in case
            // it applies.
            let mergedContext = this.context;
            if (context?.preserveFocus) {
                mergedContext = {
                    ...this.context,
                    preserveFocus: true
                };
            }
            return super.run(action, mergedContext);
        }
    }
    exports.EditorCommandsContextActionRunner = EditorCommandsContextActionRunner;
    let EditorTabsControl = class EditorTabsControl extends themeService_1.Themable {
        static { EditorTabsControl_1 = this; }
        static { this.EDITOR_TAB_HEIGHT = {
            normal: 35,
            compact: 22
        }; }
        constructor(parent, editorPartsView, groupsView, groupView, tabsModel, contextMenuService, instantiationService, contextKeyService, keybindingService, notificationService, quickInputService, themeService, editorResolverService, hostService) {
            super(themeService);
            this.parent = parent;
            this.editorPartsView = editorPartsView;
            this.groupsView = groupsView;
            this.groupView = groupView;
            this.tabsModel = tabsModel;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.quickInputService = quickInputService;
            this.editorResolverService = editorResolverService;
            this.hostService = hostService;
            this.editorTransfer = dnd_3.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_3.LocalSelectionTransfer.getInstance();
            this.treeItemsTransfer = dnd_3.LocalSelectionTransfer.getInstance();
            this.editorActionsToolbarDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorActionsDisposables = this._register(new lifecycle_1.DisposableStore());
            this.contextMenuContextKeyService = this._register(this.contextKeyService.createScoped(parent));
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextMenuContextKeyService]));
            this.resourceContext = this._register(scopedInstantiationService.createInstance(contextkeys_1.ResourceContextKey));
            this.editorPinnedContext = contextkeys_1.ActiveEditorPinnedContext.bindTo(this.contextMenuContextKeyService);
            this.editorIsFirstContext = contextkeys_1.ActiveEditorFirstInGroupContext.bindTo(this.contextMenuContextKeyService);
            this.editorIsLastContext = contextkeys_1.ActiveEditorLastInGroupContext.bindTo(this.contextMenuContextKeyService);
            this.editorStickyContext = contextkeys_1.ActiveEditorStickyContext.bindTo(this.contextMenuContextKeyService);
            this.editorAvailableEditorIds = contextkeys_1.ActiveEditorAvailableEditorIdsContext.bindTo(this.contextMenuContextKeyService);
            this.editorCanSplitInGroupContext = contextkeys_1.ActiveEditorCanSplitInGroupContext.bindTo(this.contextMenuContextKeyService);
            this.sideBySideEditorContext = contextkeys_1.SideBySideEditorActiveContext.bindTo(this.contextMenuContextKeyService);
            this.groupLockedContext = contextkeys_1.ActiveEditorGroupLockedContext.bindTo(this.contextMenuContextKeyService);
            this.renderDropdownAsChildElement = false;
            this.tabsHoverDelegate = (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
            this.create(parent);
        }
        create(parent) {
            this.updateTabHeight();
        }
        get editorActionsEnabled() {
            return this.groupsView.partOptions.editorActionsLocation === 'default' && this.groupsView.partOptions.showTabs !== 'none';
        }
        createEditorActionsToolBar(parent, classes) {
            this.editorActionsToolbarContainer = document.createElement('div');
            this.editorActionsToolbarContainer.classList.add(...classes);
            parent.appendChild(this.editorActionsToolbarContainer);
            this.handleEditorActionToolBarVisibility(this.editorActionsToolbarContainer);
        }
        handleEditorActionToolBarVisibility(container) {
            const editorActionsEnabled = this.editorActionsEnabled;
            const editorActionsVisible = !!this.editorActionsToolbar;
            // Create toolbar if it is enabled (and not yet created)
            if (editorActionsEnabled && !editorActionsVisible) {
                this.doCreateEditorActionsToolBar(container);
            }
            // Remove toolbar if it is not enabled (and is visible)
            else if (!editorActionsEnabled && editorActionsVisible) {
                this.editorActionsToolbar?.getElement().remove();
                this.editorActionsToolbar = undefined;
                this.editorActionsToolbarDisposables.clear();
                this.editorActionsDisposables.clear();
            }
            container.classList.toggle('hidden', !editorActionsEnabled);
        }
        doCreateEditorActionsToolBar(container) {
            const context = { groupId: this.groupView.id };
            // Toolbar Widget
            this.editorActionsToolbar = this.editorActionsToolbarDisposables.add(this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, container, {
                actionViewItemProvider: (action, options) => this.actionViewItemProvider(action, options),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                ariaLabel: (0, nls_1.localize)('ariaLabelEditorActions', "Editor actions"),
                getKeyBinding: action => this.getKeybinding(action),
                actionRunner: this.editorActionsToolbarDisposables.add(new EditorCommandsContextActionRunner(context)),
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */,
                renderDropdownAsChildElement: this.renderDropdownAsChildElement,
                telemetrySource: 'editorPart',
                resetMenu: actions_2.MenuId.EditorTitle,
                overflowBehavior: { maxItems: 9, exempted: editorCommands_1.EDITOR_CORE_NAVIGATION_COMMANDS },
                highlightToggledItems: true
            }));
            // Context
            this.editorActionsToolbar.context = context;
            // Action Run Handling
            this.editorActionsToolbarDisposables.add(this.editorActionsToolbar.actionRunner.onDidRun(e => {
                // Notify for Error
                if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                    this.notificationService.error(e.error);
                }
            }));
        }
        actionViewItemProvider(action, options) {
            const activeEditorPane = this.groupView.activeEditorPane;
            // Check Active Editor
            if (activeEditorPane instanceof editorPane_1.EditorPane) {
                const result = activeEditorPane.getActionViewItem(action, options);
                if (result) {
                    return result;
                }
            }
            // Check extensions
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, { ...options, menuAsChild: this.renderDropdownAsChildElement });
        }
        updateEditorActionsToolbar() {
            if (!this.editorActionsEnabled) {
                return;
            }
            this.editorActionsDisposables.clear();
            const editorActions = this.groupView.createEditorActions(this.editorActionsDisposables);
            this.editorActionsDisposables.add(editorActions.onDidChange(() => this.updateEditorActionsToolbar()));
            const editorActionsToolbar = (0, types_1.assertIsDefined)(this.editorActionsToolbar);
            const { primary, secondary } = this.prepareEditorActions(editorActions.actions);
            editorActionsToolbar.setActions((0, actionbar_1.prepareActions)(primary), (0, actionbar_1.prepareActions)(secondary));
        }
        getEditorPaneAwareContextKeyService() {
            return this.groupView.activeEditorPane?.scopedContextKeyService ?? this.contextKeyService;
        }
        clearEditorActionsToolbar() {
            if (!this.editorActionsEnabled) {
                return;
            }
            const editorActionsToolbar = (0, types_1.assertIsDefined)(this.editorActionsToolbar);
            editorActionsToolbar.setActions([], []);
        }
        onGroupDragStart(e, element) {
            if (e.target !== element) {
                return false; // only if originating from tabs container
            }
            const isNewWindowOperation = this.isNewWindowOperation(e);
            // Set editor group as transfer
            this.groupTransfer.setData([new dnd_2.DraggedEditorGroupIdentifier(this.groupView.id)], dnd_2.DraggedEditorGroupIdentifier.prototype);
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'copyMove';
            }
            // Drag all tabs of the group if tabs are enabled
            let hasDataTransfer = false;
            if (this.groupsView.partOptions.showTabs === 'multiple') {
                hasDataTransfer = this.doFillResourceDataTransfers(this.groupView.getEditors(1 /* EditorsOrder.SEQUENTIAL */), e, isNewWindowOperation);
            }
            // Otherwise only drag the active editor
            else {
                if (this.groupView.activeEditor) {
                    hasDataTransfer = this.doFillResourceDataTransfers([this.groupView.activeEditor], e, isNewWindowOperation);
                }
            }
            // Firefox: requires to set a text data transfer to get going
            if (!hasDataTransfer && browser_1.isFirefox) {
                e.dataTransfer?.setData(dnd_1.DataTransfers.TEXT, String(this.groupView.label));
            }
            // Drag Image
            if (this.groupView.activeEditor) {
                let label = this.groupView.activeEditor.getName();
                if (this.groupsView.partOptions.showTabs === 'multiple' && this.groupView.count > 1) {
                    label = (0, nls_1.localize)('draggedEditorGroup', "{0} (+{1})", label, this.groupView.count - 1);
                }
                (0, dnd_1.applyDragImage)(e, label, 'monaco-editor-group-drag-image', this.getColor(colorRegistry_1.listActiveSelectionBackground), this.getColor(colorRegistry_1.listActiveSelectionForeground));
            }
            return isNewWindowOperation;
        }
        async onGroupDragEnd(e, previousDragEvent, element, isNewWindowOperation) {
            this.groupTransfer.clearData(dnd_2.DraggedEditorGroupIdentifier.prototype);
            if (e.target !== element ||
                !isNewWindowOperation ||
                (0, dnd_2.isWindowDraggedOver)()) {
                return; // drag to open in new window is disabled
            }
            const auxiliaryEditorPart = await this.maybeCreateAuxiliaryEditorPartAt(e, element);
            if (!auxiliaryEditorPart) {
                return;
            }
            const targetGroup = auxiliaryEditorPart.activeGroup;
            this.groupsView.mergeGroup(this.groupView, targetGroup.id, {
                mode: this.isMoveOperation(previousDragEvent ?? e, targetGroup.id) ? 1 /* MergeGroupMode.MOVE_EDITORS */ : 0 /* MergeGroupMode.COPY_EDITORS */
            });
            targetGroup.focus();
        }
        async maybeCreateAuxiliaryEditorPartAt(e, offsetElement) {
            const { point, display } = await this.hostService.getCursorScreenPoint() ?? { point: { x: e.screenX, y: e.screenY } };
            const window = (0, dom_1.getActiveWindow)();
            if (window.document.visibilityState === 'visible' && window.document.hasFocus()) {
                if (point.x >= window.screenX && point.x <= window.screenX + window.outerWidth && point.y >= window.screenY && point.y <= window.screenY + window.outerHeight) {
                    return; // refuse to create as long as the mouse was released over active focused window to reduce chance of opening by accident
                }
            }
            const offsetX = offsetElement.offsetWidth / 2;
            const offsetY = 30 /* take title bar height into account (approximation) */ + offsetElement.offsetHeight / 2;
            const bounds = {
                x: point.x - offsetX,
                y: point.y - offsetY
            };
            if (display) {
                if (bounds.x < display.x) {
                    bounds.x = display.x; // prevent overflow to the left
                }
                if (bounds.y < display.y) {
                    bounds.y = display.y; // prevent overflow to the top
                }
            }
            return this.editorPartsView.createAuxiliaryEditorPart({ bounds });
        }
        isNewWindowOperation(e) {
            if (this.groupsView.partOptions.dragToOpenWindow) {
                return !e.altKey;
            }
            return e.altKey;
        }
        isMoveOperation(e, sourceGroup, sourceEditor) {
            if (sourceEditor?.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
                return true; // Singleton editors cannot be split
            }
            const isCopy = (e.ctrlKey && !platform_1.isMacintosh) || (e.altKey && platform_1.isMacintosh);
            return (!isCopy || sourceGroup === this.groupView.id);
        }
        doFillResourceDataTransfers(editors, e, disableStandardTransfer) {
            if (editors.length) {
                this.instantiationService.invokeFunction(dnd_2.fillEditorsDragData, editors.map(editor => ({ editor, groupId: this.groupView.id })), e, { disableStandardTransfer });
                return true;
            }
            return false;
        }
        onTabContextMenu(editor, e, node) {
            // Update contexts based on editor picked and remember previous to restore
            this.resourceContext.set(editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }));
            this.editorPinnedContext.set(this.tabsModel.isPinned(editor));
            this.editorIsFirstContext.set(this.tabsModel.isFirst(editor));
            this.editorIsLastContext.set(this.tabsModel.isLast(editor));
            this.editorStickyContext.set(this.tabsModel.isSticky(editor));
            this.groupLockedContext.set(this.tabsModel.isLocked);
            this.editorCanSplitInGroupContext.set(editor.hasCapability(32 /* EditorInputCapabilities.CanSplitInGroup */));
            this.sideBySideEditorContext.set(editor.typeId === sideBySideEditorInput_1.SideBySideEditorInput.ID);
            (0, contextkeys_1.applyAvailableEditorIds)(this.editorAvailableEditorIds, editor, this.editorResolverService);
            // Find target anchor
            let anchor = node;
            if ((0, dom_1.isMouseEvent)(e)) {
                anchor = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(node), e);
            }
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                menuId: actions_2.MenuId.EditorTitleContext,
                menuActionOptions: { shouldForwardArgs: true, arg: this.resourceContext.get() },
                contextKeyService: this.contextMenuContextKeyService,
                getActionsContext: () => ({ groupId: this.groupView.id, editorIndex: this.groupView.getIndexOfEditor(editor) }),
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id, this.contextMenuContextKeyService),
                onHide: () => this.groupsView.activeGroup.focus() // restore focus to active group
            });
        }
        getKeybinding(action) {
            return this.keybindingService.lookupKeybinding(action.id, this.getEditorPaneAwareContextKeyService());
        }
        getKeybindingLabel(action) {
            const keybinding = this.getKeybinding(action);
            return keybinding ? keybinding.getLabel() ?? undefined : undefined;
        }
        get tabHeight() {
            return this.groupsView.partOptions.tabHeight !== 'compact' ? EditorTabsControl_1.EDITOR_TAB_HEIGHT.normal : EditorTabsControl_1.EDITOR_TAB_HEIGHT.compact;
        }
        getHoverTitle(editor) {
            return editor.getTitle(2 /* Verbosity.LONG */);
        }
        getHoverDelegate() {
            return this.tabsHoverDelegate;
        }
        updateTabHeight() {
            this.parent.style.setProperty('--editor-group-tab-height', `${this.tabHeight}px`);
        }
        updateOptions(oldOptions, newOptions) {
            // Update tab height
            if (oldOptions.tabHeight !== newOptions.tabHeight) {
                this.updateTabHeight();
            }
            // Update Editor Actions Toolbar
            if (oldOptions.editorActionsLocation !== newOptions.editorActionsLocation ||
                oldOptions.showTabs !== newOptions.showTabs) {
                if (this.editorActionsToolbarContainer) {
                    this.handleEditorActionToolBarVisibility(this.editorActionsToolbarContainer);
                    this.updateEditorActionsToolbar();
                }
            }
        }
    };
    exports.EditorTabsControl = EditorTabsControl;
    exports.EditorTabsControl = EditorTabsControl = EditorTabsControl_1 = __decorate([
        __param(5, contextView_1.IContextMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, themeService_1.IThemeService),
        __param(12, editorResolverService_1.IEditorResolverService),
        __param(13, host_1.IHostService)
    ], EditorTabsControl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yVGFic0NvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yVGFic0NvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStDaEcsTUFBYSxpQ0FBa0MsU0FBUSxzQkFBWTtRQUVsRSxZQUNTLE9BQStCO1lBRXZDLEtBQUssRUFBRSxDQUFDO1lBRkEsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7UUFHeEMsQ0FBQztRQUVRLEdBQUcsQ0FBQyxNQUFlLEVBQUUsT0FBcUM7WUFFbEUsMkRBQTJEO1lBQzNELDREQUE0RDtZQUM1RCxjQUFjO1lBRWQsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNqQyxJQUFJLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQztnQkFDNUIsYUFBYSxHQUFHO29CQUNmLEdBQUcsSUFBSSxDQUFDLE9BQU87b0JBQ2YsYUFBYSxFQUFFLElBQUk7aUJBQ25CLENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN6QyxDQUFDO0tBQ0Q7SUF4QkQsOEVBd0JDO0lBb0JNLElBQWUsaUJBQWlCLEdBQWhDLE1BQWUsaUJBQWtCLFNBQVEsdUJBQVE7O2lCQU0vQixzQkFBaUIsR0FBRztZQUMzQyxNQUFNLEVBQUUsRUFBVztZQUNuQixPQUFPLEVBQUUsRUFBVztTQUNwQixBQUh3QyxDQUd2QztRQXlCRixZQUNvQixNQUFtQixFQUNuQixlQUFpQyxFQUNqQyxVQUE2QixFQUM3QixTQUEyQixFQUMzQixTQUFvQyxFQUNsQyxrQkFBMEQsRUFDeEQsb0JBQXFELEVBQ3hELGlCQUF3RCxFQUN4RCxpQkFB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