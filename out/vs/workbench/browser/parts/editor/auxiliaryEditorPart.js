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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/window/common/window", "vs/workbench/browser/parts/editor/editorPart", "vs/workbench/browser/parts/titlebar/windowTitle", "vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/title/browser/titleService"], function (require, exports, browser_1, dom_1, event_1, lifecycle_1, platform_1, configuration_1, contextkey_1, instantiation_1, serviceCollection_1, storage_1, themeService_1, window_1, editorPart_1, windowTitle_1, auxiliaryWindowService_1, editorService_1, host_1, layoutService_1, lifecycle_2, statusbar_1, titleService_1) {
    "use strict";
    var AuxiliaryEditorPart_1, AuxiliaryEditorPartImpl_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryEditorPart = void 0;
    let AuxiliaryEditorPart = class AuxiliaryEditorPart {
        static { AuxiliaryEditorPart_1 = this; }
        static { this.STATUS_BAR_VISIBILITY = 'workbench.statusBar.visible'; }
        constructor(editorPartsView, instantiationService, auxiliaryWindowService, lifecycleService, configurationService, statusbarService, titleService, editorService, layoutService) {
            this.editorPartsView = editorPartsView;
            this.instantiationService = instantiationService;
            this.auxiliaryWindowService = auxiliaryWindowService;
            this.lifecycleService = lifecycleService;
            this.configurationService = configurationService;
            this.statusbarService = statusbarService;
            this.titleService = titleService;
            this.editorService = editorService;
            this.layoutService = layoutService;
        }
        async create(label, options) {
            function computeEditorPartHeightOffset() {
                let editorPartHeightOffset = 0;
                if (statusbarVisible) {
                    editorPartHeightOffset += statusbarPart.height;
                }
                if (titlebarPart && titlebarVisible) {
                    editorPartHeightOffset += titlebarPart.height;
                }
                return editorPartHeightOffset;
            }
            function updateStatusbarVisibility(fromEvent) {
                if (statusbarVisible) {
                    (0, dom_1.show)(statusbarPart.container);
                }
                else {
                    (0, dom_1.hide)(statusbarPart.container);
                }
                if (fromEvent) {
                    auxiliaryWindow.layout();
                }
            }
            function updateTitlebarVisibility(fromEvent) {
                if (!titlebarPart) {
                    return;
                }
                if (titlebarVisible) {
                    (0, dom_1.show)(titlebarPart.container);
                }
                else {
                    (0, dom_1.hide)(titlebarPart.container);
                }
                if (fromEvent) {
                    auxiliaryWindow.layout();
                }
            }
            const disposables = new lifecycle_1.DisposableStore();
            // Auxiliary Window
            const auxiliaryWindow = disposables.add(await this.auxiliaryWindowService.open(options));
            // Editor Part
            const editorPartContainer = document.createElement('div');
            editorPartContainer.classList.add('part', 'editor');
            editorPartContainer.setAttribute('role', 'main');
            editorPartContainer.style.position = 'relative';
            auxiliaryWindow.container.appendChild(editorPartContainer);
            const editorPart = disposables.add(this.instantiationService.createInstance(AuxiliaryEditorPartImpl, auxiliaryWindow.window.vscodeWindowId, this.editorPartsView, options?.state, label));
            disposables.add(this.editorPartsView.registerPart(editorPart));
            editorPart.create(editorPartContainer);
            // Titlebar
            let titlebarPart = undefined;
            let titlebarVisible = false;
            const useCustomTitle = platform_1.isNative && (0, window_1.hasCustomTitlebar)(this.configurationService); // custom title in aux windows only enabled in native
            if (useCustomTitle) {
                titlebarPart = disposables.add(this.titleService.createAuxiliaryTitlebarPart(auxiliaryWindow.container, editorPart));
                titlebarVisible = (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, auxiliaryWindow.window);
                const handleTitleBarVisibilityEvent = () => {
                    const oldTitlebarPartVisible = titlebarVisible;
                    titlebarVisible = (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, auxiliaryWindow.window);
                    if (oldTitlebarPartVisible !== titlebarVisible) {
                        updateTitlebarVisibility(true);
                    }
                };
                disposables.add(titlebarPart.onDidChange(() => auxiliaryWindow.layout()));
                disposables.add(this.layoutService.onDidChangePartVisibility(() => handleTitleBarVisibilityEvent()));
                disposables.add((0, browser_1.onDidChangeFullscreen)(windowId => {
                    if (windowId !== auxiliaryWindow.window.vscodeWindowId) {
                        return; // ignore all but our window
                    }
                    handleTitleBarVisibilityEvent();
                }));
                updateTitlebarVisibility(false);
            }
            else {
                disposables.add(this.instantiationService.createInstance(windowTitle_1.WindowTitle, auxiliaryWindow.window, editorPart));
            }
            // Statusbar
            const statusbarPart = disposables.add(this.statusbarService.createAuxiliaryStatusbarPart(auxiliaryWindow.container));
            let statusbarVisible = this.configurationService.getValue(AuxiliaryEditorPart_1.STATUS_BAR_VISIBILITY) !== false;
            disposables.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(AuxiliaryEditorPart_1.STATUS_BAR_VISIBILITY)) {
                    statusbarVisible = this.configurationService.getValue(AuxiliaryEditorPart_1.STATUS_BAR_VISIBILITY) !== false;
                    updateStatusbarVisibility(true);
                }
            }));
            updateStatusbarVisibility(false);
            // Lifecycle
            const editorCloseListener = disposables.add(event_1.Event.once(editorPart.onWillClose)(() => auxiliaryWindow.window.close()));
            disposables.add(event_1.Event.once(auxiliaryWindow.onUnload)(() => {
                if (disposables.isDisposed) {
                    return; // the close happened as part of an earlier dispose call
                }
                editorCloseListener.dispose();
                editorPart.close();
                disposables.dispose();
            }));
            disposables.add(event_1.Event.once(this.lifecycleService.onDidShutdown)(() => disposables.dispose()));
            disposables.add(auxiliaryWindow.onBeforeUnload(event => {
                for (const group of editorPart.groups) {
                    for (const editor of group.editors) {
                        // Closing an auxiliary window with opened editors
                        // will move the editors to the main window. As such,
                        // we need to validate that we can move and otherwise
                        // prevent the window from closing.
                        const canMoveVeto = editor.canMove(group.id, this.editorPartsView.mainPart.activeGroup.id);
                        if (typeof canMoveVeto === 'string') {
                            group.openEditor(editor);
                            event.veto(canMoveVeto);
                            break;
                        }
                    }
                }
            }));
            // Layout: specifically `onWillLayout` to have a chance
            // to build the aux editor part before other components
            // have a chance to react.
            disposables.add(auxiliaryWindow.onWillLayout(dimension => {
                const titlebarPartHeight = titlebarPart?.height ?? 0;
                titlebarPart?.layout(dimension.width, titlebarPartHeight, 0, 0);
                const editorPartHeight = dimension.height - computeEditorPartHeightOffset();
                editorPart.layout(dimension.width, editorPartHeight, titlebarPartHeight, 0);
                statusbarPart.layout(dimension.width, statusbarPart.height, dimension.height - statusbarPart.height, 0);
            }));
            auxiliaryWindow.layout();
            // Have a InstantiationService that is scoped to the auxiliary window
            const instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([statusbar_1.IStatusbarService, this.statusbarService.createScoped(statusbarPart, disposables)], [editorService_1.IEditorService, this.editorService.createScoped(editorPart, disposables)]));
            return {
                part: editorPart,
                instantiationService,
                disposables
            };
        }
    };
    exports.AuxiliaryEditorPart = AuxiliaryEditorPart;
    exports.AuxiliaryEditorPart = AuxiliaryEditorPart = AuxiliaryEditorPart_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, auxiliaryWindowService_1.IAuxiliaryWindowService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, titleService_1.ITitleService),
        __param(7, editorService_1.IEditorService),
        __param(8, layoutService_1.IWorkbenchLayoutService)
    ], AuxiliaryEditorPart);
    let AuxiliaryEditorPartImpl = class AuxiliaryEditorPartImpl extends editorPart_1.EditorPart {
        static { AuxiliaryEditorPartImpl_1 = this; }
        static { this.COUNTER = 1; }
        constructor(windowId, editorPartsView, state, groupsLabel, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService) {
            const id = AuxiliaryEditorPartImpl_1.COUNTER++;
            super(editorPartsView, `workbench.parts.auxiliaryEditor.${id}`, groupsLabel, windowId, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService);
            this.state = state;
            this._onWillClose = this._register(new event_1.Emitter());
            this.onWillClose = this._onWillClose.event;
        }
        removeGroup(group, preserveFocus) {
            // Close aux window when last group removed
            const groupView = this.assertGroupView(group);
            if (this.count === 1 && this.activeGroup === groupView) {
                this.doRemoveLastGroup(preserveFocus);
            }
            // Otherwise delegate to parent implementation
            else {
                super.removeGroup(group, preserveFocus);
            }
        }
        doRemoveLastGroup(preserveFocus) {
            const restoreFocus = !preserveFocus && this.shouldRestoreFocus(this.container);
            // Activate next group
            const mostRecentlyActiveGroups = this.editorPartsView.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            const nextActiveGroup = mostRecentlyActiveGroups[1]; // [0] will be the current group we are about to dispose
            if (nextActiveGroup) {
                nextActiveGroup.groupsView.activateGroup(nextActiveGroup);
                if (restoreFocus) {
                    nextActiveGroup.focus();
                }
            }
            this.doClose(false /* do not merge any groups to main part */);
        }
        loadState() {
            return this.state;
        }
        saveState() {
            return; // disabled, auxiliary editor part state is tracked outside
        }
        close() {
            return this.doClose(true /* merge all groups to main part */);
        }
        doClose(mergeGroupsToMainPart) {
            let result = true;
            if (mergeGroupsToMainPart) {
                result = this.mergeGroupsToMainPart();
            }
            this._onWillClose.fire();
            return result;
        }
        mergeGroupsToMainPart() {
            if (!this.groups.some(group => group.count > 0)) {
                return true; // skip if we have no editors opened
            }
            // Find the most recent group that is not locked
            let targetGroup = undefined;
            for (const group of this.editorPartsView.mainPart.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (!group.isLocked) {
                    targetGroup = group;
                    break;
                }
            }
            if (!targetGroup) {
                targetGroup = this.editorPartsView.mainPart.addGroup(this.editorPartsView.mainPart.activeGroup, this.partOptions.openSideBySideDirection === 'right' ? 3 /* GroupDirection.RIGHT */ : 1 /* GroupDirection.DOWN */);
            }
            const result = this.mergeAllGroups(targetGroup);
            targetGroup.focus();
            return result;
        }
    };
    AuxiliaryEditorPartImpl = AuxiliaryEditorPartImpl_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, storage_1.IStorageService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, host_1.IHostService),
        __param(10, contextkey_1.IContextKeyService)
    ], AuxiliaryEditorPartImpl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5RWRpdG9yUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9hdXhpbGlhcnlFZGl0b3JQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQ3pGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1COztpQkFFaEIsMEJBQXFCLEdBQUcsNkJBQTZCLEFBQWhDLENBQWlDO1FBRXJFLFlBQ2tCLGVBQWlDLEVBQ1Ysb0JBQTJDLEVBQ3pDLHNCQUErQyxFQUNyRCxnQkFBbUMsRUFDL0Isb0JBQTJDLEVBQy9DLGdCQUFtQyxFQUN2QyxZQUEyQixFQUMxQixhQUE2QixFQUNwQixhQUFzQztZQVIvRCxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDVix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3pDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDckQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQy9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdkMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDMUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUF5QjtRQUVqRixDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFhLEVBQUUsT0FBeUM7WUFFcEUsU0FBUyw2QkFBNkI7Z0JBQ3JDLElBQUksc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO2dCQUUvQixJQUFJLGdCQUFnQixFQUFFLENBQUM7b0JBQ3RCLHNCQUFzQixJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUM7Z0JBQ2hELENBQUM7Z0JBRUQsSUFB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