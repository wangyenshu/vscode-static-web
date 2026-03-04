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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/common/editor", "vs/base/common/controlFlow", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, lifecycle_1, nls_1, actionCommonCategories_1, actions_1, keybinding_1, sideBySideEditor_1, editor_1, controlFlow_1, editorService_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SyncScroll = void 0;
    let SyncScroll = class SyncScroll extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.syncScrolling'; }
        constructor(editorService, statusbarService) {
            super();
            this.editorService = editorService;
            this.statusbarService = statusbarService;
            this.paneInitialScrollTop = new Map();
            this.syncScrollDispoasbles = this._register(new lifecycle_1.DisposableStore());
            this.paneDisposables = new lifecycle_1.DisposableStore();
            this.statusBarEntry = this._register(new lifecycle_1.MutableDisposable());
            this.isActive = false;
            // makes sure that the onDidEditorPaneScroll is not called multiple times for the same event
            this._reentrancyBarrier = new controlFlow_1.ReentrancyBarrier();
            this.registerActions();
        }
        registerActiveListeners() {
            this.syncScrollDispoasbles.add(this.editorService.onDidVisibleEditorsChange(() => this.trackVisiblePanes()));
        }
        activate() {
            this.registerActiveListeners();
            this.trackVisiblePanes();
        }
        toggle() {
            if (this.isActive) {
                this.deactivate();
            }
            else {
                this.activate();
            }
            this.isActive = !this.isActive;
            this.toggleStatusbarItem(this.isActive);
        }
        trackVisiblePanes() {
            this.paneDisposables.clear();
            this.paneInitialScrollTop.clear();
            for (const pane of this.getAllVisiblePanes()) {
                if (!(0, editor_1.isEditorPaneWithScrolling)(pane)) {
                    continue;
                }
                this.paneInitialScrollTop.set(pane, pane.getScrollPosition());
                this.paneDisposables.add(pane.onDidChangeScroll(() => this._reentrancyBarrier.runExclusivelyOrSkip(() => {
                    this.onDidEditorPaneScroll(pane);
                })));
            }
        }
        onDidEditorPaneScroll(scrolledPane) {
            const scrolledPaneInitialOffset = this.paneInitialScrollTop.get(scrolledPane);
            if (scrolledPaneInitialOffset === undefined) {
                throw new Error('Scrolled pane not tracked');
            }
            if (!(0, editor_1.isEditorPaneWithScrolling)(scrolledPane)) {
                throw new Error('Scrolled pane does not support scrolling');
            }
            const scrolledPaneCurrentPosition = scrolledPane.getScrollPosition();
            const scrolledFromInitial = {
                scrollTop: scrolledPaneCurrentPosition.scrollTop - scrolledPaneInitialOffset.scrollTop,
                scrollLeft: scrolledPaneCurrentPosition.scrollLeft !== undefined && scrolledPaneInitialOffset.scrollLeft !== undefined ? scrolledPaneCurrentPosition.scrollLeft - scrolledPaneInitialOffset.scrollLeft : undefined,
            };
            for (const pane of this.getAllVisiblePanes()) {
                if (pane === scrolledPane) {
                    continue;
                }
                if (!(0, editor_1.isEditorPaneWithScrolling)(pane)) {
                    continue;
                }
                const initialOffset = this.paneInitialScrollTop.get(pane);
                if (initialOffset === undefined) {
                    throw new Error('Could not find initial offset for pane');
                }
                const currentPanePosition = pane.getScrollPosition();
                const newPaneScrollPosition = {
                    scrollTop: initialOffset.scrollTop + scrolledFromInitial.scrollTop,
                    scrollLeft: initialOffset.scrollLeft !== undefined && scrolledFromInitial.scrollLeft !== undefined ? initialOffset.scrollLeft + scrolledFromInitial.scrollLeft : undefined,
                };
                if (currentPanePosition.scrollTop === newPaneScrollPosition.scrollTop && currentPanePosition.scrollLeft === newPaneScrollPosition.scrollLeft) {
                    continue;
                }
                pane.setScrollPosition(newPaneScrollPosition);
            }
        }
        getAllVisiblePanes() {
            const panes = [];
            for (const pane of this.editorService.visibleEditorPanes) {
                if (pane instanceof sideBySideEditor_1.SideBySideEditor) {
                    const primaryPane = pane.getPrimaryEditorPane();
                    const secondaryPane = pane.getSecondaryEditorPane();
                    if (primaryPane) {
                        panes.push(primaryPane);
                    }
                    if (secondaryPane) {
                        panes.push(secondaryPane);
                    }
                    continue;
                }
                panes.push(pane);
            }
            return panes;
        }
        deactivate() {
            this.paneDisposables.clear();
            this.syncScrollDispoasbles.clear();
            this.paneInitialScrollTop.clear();
        }
        // Actions & Commands
        toggleStatusbarItem(active) {
            if (active) {
                if (!this.statusBarEntry.value) {
                    const text = (0, nls_1.localize)('mouseScrolllingLocked', 'Scrolling Locked');
                    const tooltip = (0, nls_1.localize)('mouseLockScrollingEnabled', 'Lock Scrolling Enabled');
                    this.statusBarEntry.value = this.statusbarService.addEntry({
                        name: text,
                        text,
                        tooltip,
                        ariaLabel: text,
                        command: {
                            id: 'workbench.action.toggleLockedScrolling',
                            title: ''
                        },
                        kind: 'prominent',
                        showInAllWindows: true
                    }, 'status.scrollLockingEnabled', 1 /* StatusbarAlignment.RIGHT */, 102);
                }
            }
            else {
                this.statusBarEntry.clear();
            }
        }
        registerActions() {
            const $this = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.toggleLockedScrolling',
                        title: {
                            ...(0, nls_1.localize2)('toggleLockedScrolling', "Toggle Locked Scrolling Across Editors"),
                            mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleLockedScrolling', comment: ['&& denotes a mnemonic'] }, "Locked Scrolling"),
                        },
                        category: actionCommonCategories_1.Categories.View,
                        f1: true,
                        metadata: {
                            description: (0, nls_1.localize)('synchronizeScrolling', "Synchronize Scrolling Editors"),
                        }
                    });
                }
                run() {
                    $this.toggle();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.holdLockedScrolling',
                        title: {
                            ...(0, nls_1.localize2)('holdLockedScrolling', "Hold Locked Scrolling Across Editors"),
                            mnemonicTitle: (0, nls_1.localize)({ key: 'miHoldLockedScrolling', comment: ['&& denotes a mnemonic'] }, "Locked Scrolling"),
                        },
                        category: actionCommonCategories_1.Categories.View,
                    });
                }
                run(accessor) {
                    const keybindingService = accessor.get(keybinding_1.IKeybindingService);
                    // Enable Sync Scrolling while pressed
                    $this.toggle();
                    const holdMode = keybindingService.enableKeybindingHoldMode('workbench.action.holdLockedScrolling');
                    if (!holdMode) {
                        return;
                    }
                    holdMode.finally(() => {
                        $this.toggle();
                    });
                }
            }));
        }
        dispose() {
            this.deactivate();
            super.dispose();
        }
    };
    exports.SyncScroll = SyncScroll;
    exports.SyncScroll = SyncScroll = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService)
    ], SyncScroll);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsTG9ja2luZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Njcm9sbExvY2tpbmcvYnJvd3Nlci9zY3JvbGxMb2NraW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFXLFNBQVEsc0JBQVU7aUJBRXpCLE9BQUUsR0FBRyxpQ0FBaUMsQUFBcEMsQ0FBcUM7UUFXdkQsWUFDaUIsYUFBOEMsRUFDM0MsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBSHlCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMxQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBWHZELHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUFzRCxDQUFDO1lBRXJGLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUM5RCxvQkFBZSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRXhDLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUEyQixDQUFDLENBQUM7WUFFM0YsYUFBUSxHQUFZLEtBQUssQ0FBQztZQWlDbEMsNEZBQTRGO1lBQ3BGLHVCQUFrQixHQUFHLElBQUksK0JBQWlCLEVBQUUsQ0FBQztZQTFCcEQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFTyx1QkFBdUI7WUFDOUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RyxD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