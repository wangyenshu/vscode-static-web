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
define(["require", "exports", "vs/nls", "vs/workbench/services/remote/common/remoteExplorerService", "vs/base/common/types", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/contrib/remote/browser/remoteExplorer", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle"], function (require, exports, nls, remoteExplorerService_1, types_1, environmentService_1, storage_1, contextkey_1, actions_1, remoteExplorer_1, virtualWorkspace_1, workspace_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwitchRemoteViewItem = exports.SELECTED_REMOTE_IN_EXPLORER = void 0;
    exports.SELECTED_REMOTE_IN_EXPLORER = new contextkey_1.RawContextKey('selectedRemoteInExplorer', '');
    let SwitchRemoteViewItem = class SwitchRemoteViewItem extends lifecycle_1.Disposable {
        constructor(contextKeyService, remoteExplorerService, environmentService, storageService, workspaceContextService) {
            super();
            this.contextKeyService = contextKeyService;
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.workspaceContextService = workspaceContextService;
            this.completedRemotes = this._register(new lifecycle_1.DisposableMap());
            this.selectedRemoteContext = exports.SELECTED_REMOTE_IN_EXPLORER.bindTo(contextKeyService);
            this.switchRemoteMenu = actions_1.MenuId.for('workbench.remote.menu.switchRemoteMenu');
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
                submenu: this.switchRemoteMenu,
                title: nls.localize('switchRemote.label', "Switch Remote"),
                group: 'navigation',
                when: contextkey_1.ContextKeyExpr.equals('viewContainer', remoteExplorer_1.VIEWLET_ID),
                order: 1,
                isSelection: true
            }));
            this._register(remoteExplorerService.onDidChangeTargetType(e => {
                this.select(e);
            }));
        }
        setSelectionForConnection() {
            let isSetForConnection = false;
            if (this.completedRemotes.size > 0) {
                let authority;
                const remoteAuthority = this.environmentService.remoteAuthority;
                let virtualWorkspace;
                if (!remoteAuthority) {
                    virtualWorkspace = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.workspaceContextService.getWorkspace())?.scheme;
                }
                isSetForConnection = true;
                const explorerType = remoteAuthority ? [remoteAuthority.split('+')[0]]
                    : (virtualWorkspace ? [virtualWorkspace]
                        : (this.storageService.get(remoteExplorerService_1.REMOTE_EXPLORER_TYPE_KEY, 1 /* StorageScope.WORKSPACE */)?.split(',') ?? this.storageService.get(remoteExplorerService_1.REMOTE_EXPLORER_TYPE_KEY, 0 /* StorageScope.PROFILE */)?.split(',')));
                if (explorerType !== undefined) {
                    authority = this.getAuthorityForExplorerType(explorerType);
                }
                if (authority) {
                    this.select(authority);
                }
            }
            return isSetForConnection;
        }
        select(authority) {
            this.selectedRemoteContext.set(authority[0]);
            this.remoteExplorerService.targetType = authority;
        }
        getAuthorityForExplorerType(explorerType) {
            let authority;
            for (const option of this.completedRemotes) {
                for (const authorityOption of option[1].authority) {
                    for (const explorerOption of explorerType) {
                        if (authorityOption === explorerOption) {
                            authority = option[1].authority;
                            break;
                        }
                        else if (option[1].virtualWorkspace === explorerOption) {
                            authority = option[1].authority;
                            break;
                        }
                    }
                }
            }
            return authority;
        }
        removeOptionItems(views) {
            for (const view of views) {
                if (view.group && view.group.startsWith('targets') && view.remoteAuthority && (!view.when || this.contextKeyService.contextMatchesRules(view.when))) {
                    const authority = (0, types_1.isStringArray)(view.remoteAuthority) ? view.remoteAuthority : [view.remoteAuthority];
                    this.completedRemotes.deleteAndDispose(authority[0]);
                }
            }
        }
        createOptionItems(views) {
            const startingCount = this.completedRemotes.size;
            for (const view of views) {
                if (view.group && view.group.startsWith('targets') && view.remoteAuthority && (!view.when || this.contextKeyService.contextMatchesRules(view.when))) {
                    const text = view.name;
                    const authority = (0, types_1.isStringArray)(view.remoteAuthority) ? view.remoteAuthority : [view.remoteAuthority];
                    if (this.completedRemotes.has(authority[0])) {
                        continue;
                    }
                    const thisCapture = this;
                    const action = (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                        constructor() {
                            super({
                                id: `workbench.action.remoteExplorer.show.${authority[0]}`,
                                title: text,
                                toggled: exports.SELECTED_REMOTE_IN_EXPLORER.isEqualTo(authority[0]),
                                menu: {
                                    id: thisCapture.switchRemoteMenu
                                }
                            });
                        }
                        async run() {
                            thisCapture.select(authority);
                        }
                    });
                    this.completedRemotes.set(authority[0], { text: text.value, authority, virtualWorkspace: view.virtualWorkspace, dispose: () => action.dispose() });
                }
            }
            if (this.completedRemotes.size > startingCount) {
                this.setSelectionForConnection();
            }
        }
    };
    exports.SwitchRemoteViewItem = SwitchRemoteViewItem;
    exports.SwitchRemoteViewItem = SwitchRemoteViewItem = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, remoteExplorerService_1.IRemoteExplorerService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, storage_1.IStorageService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], SwitchRemoteViewItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJWaWV3SXRlbXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9yZW1vdGUvYnJvd3Nlci9leHBsb3JlclZpZXdJdGVtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQm5GLFFBQUEsMkJBQTJCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLDBCQUEwQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRTlGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFLbkQsWUFDcUIsaUJBQXNELEVBQ2xELHFCQUFxRCxFQUMvQyxrQkFBd0QsRUFDckUsY0FBZ0QsRUFDdkMsdUJBQWtFO1lBRTVGLEtBQUssRUFBRSxDQUFDO1lBTjZCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDMUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUN2Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQ3BELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUN0Qiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBUnJGLHFCQUFnQixHQUE2QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBRSxDQUFDLENBQUM7WUFXeEcsSUFBSSxDQUFDLHFCQUFxQixHQUFHLG1DQUEyQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRW5GLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBTSxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxTQUFTLENBQUMsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxrQkFBa0IsRUFBRTtnQkFDckUsT0FBTyxFQUFFLElBQUksQ0FBQyxnQkFB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