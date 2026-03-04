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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, errors_1, event_1, lifecycle_1, uri_1, uuid_1, configuration_1, storage_1, telemetry_1, mainThreadWebviews_1, extHostProtocol, diffEditorInput_1, webview_1, webviewEditorInput_1, webviewWorkbenchService_1, editorGroupColumn_1, editorGroupsService_1, editorService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviewPanels = void 0;
    /**
     * Bi-directional map between webview handles and inputs.
     */
    class WebviewInputStore {
        constructor() {
            this._handlesToInputs = new Map();
            this._inputsToHandles = new Map();
        }
        add(handle, input) {
            this._handlesToInputs.set(handle, input);
            this._inputsToHandles.set(input, handle);
        }
        getHandleForInput(input) {
            return this._inputsToHandles.get(input);
        }
        getInputForHandle(handle) {
            return this._handlesToInputs.get(handle);
        }
        delete(handle) {
            const input = this.getInputForHandle(handle);
            this._handlesToInputs.delete(handle);
            if (input) {
                this._inputsToHandles.delete(input);
            }
        }
        get size() {
            return this._handlesToInputs.size;
        }
        [Symbol.iterator]() {
            return this._handlesToInputs.values();
        }
    }
    class WebviewViewTypeTransformer {
        constructor(prefix) {
            this.prefix = prefix;
        }
        fromExternal(viewType) {
            return this.prefix + viewType;
        }
        toExternal(viewType) {
            return viewType.startsWith(this.prefix)
                ? viewType.substr(this.prefix.length)
                : undefined;
        }
    }
    let MainThreadWebviewPanels = class MainThreadWebviewPanels extends lifecycle_1.Disposable {
        constructor(context, _mainThreadWebviews, _configurationService, _editorGroupService, _editorService, extensionService, storageService, _telemetryService, _webviewWorkbenchService) {
            super();
            this._mainThreadWebviews = _mainThreadWebviews;
            this._configurationService = _configurationService;
            this._editorGroupService = _editorGroupService;
            this._editorService = _editorService;
            this._telemetryService = _telemetryService;
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this.webviewPanelViewType = new WebviewViewTypeTransformer('mainThreadWebview-');
            this._webviewInputs = new WebviewInputStore();
            this._revivers = this._register(new lifecycle_1.DisposableMap());
            this.webviewOriginStore = new webview_1.ExtensionKeyedWebviewOriginStore('mainThreadWebviewPanel.origins', storageService);
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviewPanels);
            this._register(event_1.Event.any(_editorService.onDidActiveEditorChange, _editorService.onDidVisibleEditorsChange, _editorGroupService.onDidAddGroup, _editorGroupService.onDidRemoveGroup, _editorGroupService.onDidMoveGroup)(() => {
                this.updateWebviewViewStates(this._editorService.activeEditor);
            }));
            this._register(_webviewWorkbenchService.onDidChangeActiveWebviewEditor(input => {
                this.updateWebviewViewStates(input);
            }));
            // This reviver's only job is to activate extensions.
            // This should trigger the real reviver to be registered from the extension host side.
            this._register(_webviewWorkbenchService.registerResolver({
                canResolve: (webview) => {
                    const viewType = this.webviewPanelViewType.toExternal(webview.viewType);
                    if (typeof viewType === 'string') {
                        extensionService.activateByEvent(`onWebviewPanel:${viewType}`);
                    }
                    return false;
                },
                resolveWebview: () => { throw new Error('not implemented'); }
            }));
        }
        get webviewInputs() { return this._webviewInputs; }
        addWebviewInput(handle, input, options) {
            this._webviewInputs.add(handle, input);
            this._mainThreadWebviews.addWebview(handle, input.webview, options);
            input.webview.onDidDispose(() => {
                this._proxy.$onDidDisposeWebviewPanel(handle).finally(() => {
                    this._webviewInputs.delete(handle);
                });
            });
        }
        $createWebviewPanel(extensionData, handle, viewType, initData, showOptions) {
            const targetGroup = this.getTargetGroupFromShowOptions(showOptions);
            const mainThreadShowOptions = showOptions ? {
                preserveFocus: !!showOptions.preserveFocus,
                group: targetGroup
            } : {};
            const extension = (0, mainThreadWebviews_1.reviveWebviewExtension)(extensionData);
            const origin = this.webviewOriginStore.getOrigin(viewType, extension.id);
            const webview = this._webviewWorkbenchService.openWebview({
                origin,
                providedViewType: viewType,
                title: initData.title,
                options: reviveWebviewOptions(initData.panelOptions),
                contentOptions: (0, mainThreadWebviews_1.reviveWebviewContentOptions)(initData.webviewOptions),
                extension
            }, this.webviewPanelViewType.fromExternal(viewType), initData.title, mainThreadShowOptions);
            this.addWebviewInput(handle, webview, { serializeBuffersForPostMessage: initData.serializeBuffersForPostMessage });
            const payload = {
                extensionId: extension.id.value,
                viewType
            };
            this._telemetryService.publicLog2('webviews:createWebviewPanel', payload);
        }
        $disposeWebview(handle) {
            const webview = this.tryGetWebviewInput(handle);
            if (!webview) {
                return;
            }
            webview.dispose();
        }
        $setTitle(handle, value) {
            this.tryGetWebviewInput(handle)?.setName(value);
        }
        $setIconPath(handle, value) {
            const webview = this.tryGetWebviewInput(handle);
            if (webview) {
                webview.iconPath = reviveWebviewIcon(value);
            }
        }
        $reveal(handle, showOptions) {
            const webview = this.tryGetWebviewInput(handle);
            if (!webview || webview.isDisposed()) {
                return;
            }
            const targetGroup = this.getTargetGroupFromShowOptions(showOptions);
            this._webviewWorkbenchService.revealWebview(webview, targetGroup, !!showOptions.preserveFocus);
        }
        getTargetGroupFromShowOptions(showOptions) {
            if (typeof showOptions.viewColumn === 'undefined'
                || showOptions.viewColumn === editorService_1.ACTIVE_GROUP
                || (this._editorGroupService.count === 1 && this._editorGroupService.activeGroup.isEmpty)) {
                return editorService_1.ACTIVE_GROUP;
            }
            if (showOptions.viewColumn === editorService_1.SIDE_GROUP) {
                return editorService_1.SIDE_GROUP;
            }
            if (showOptions.viewColumn >= 0) {
                // First check to see if an existing group exists
                const groupInColumn = this._editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[showOptions.viewColumn];
                if (groupInColumn) {
                    return groupInColumn.id;
                }
                // We are dealing with an unknown group and therefore need a new group.
                // Note that the new group's id may not match the one requested. We only allow
                // creating a single new group, so if someone passes in `showOptions.viewColumn = 99`
                // and there are two editor groups open, we simply create a third editor group instead
                // of creating all the groups up to 99.
                const newGroup = this._editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ });
                if (newGroup) {
                    const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this._configurationService);
                    return this._editorGroupService.addGroup(newGroup, direction);
                }
            }
            return editorService_1.ACTIVE_GROUP;
        }
        $registerSerializer(viewType, options) {
            if (this._revivers.has(viewType)) {
                throw new Error(`Reviver for ${viewType} already registered`);
            }
            this._revivers.set(viewType, this._webviewWorkbenchService.registerResolver({
                canResolve: (webviewInput) => {
                    return webviewInput.viewType === this.webviewPanelViewType.fromExternal(viewType);
                },
                resolveWebview: async (webviewInput) => {
                    const viewType = this.webviewPanelViewType.toExternal(webviewInput.viewType);
                    if (!viewType) {
                        webviewInput.webview.setHtml(this._mainThreadWebviews.getWebviewResolvedFailedContent(webviewInput.viewType));
                        return;
                    }
                    const handle = (0, uuid_1.generateUuid)();
                    this.addWebviewInput(handle, webviewInput, options);
                    let state = undefined;
                    if (webviewInput.webview.state) {
                        try {
                            state = JSON.parse(webviewInput.webview.state);
                        }
                        catch (e) {
                            console.error('Could not load webview state', e, webviewInput.webview.state);
                        }
                    }
                    try {
                        await this._proxy.$deserializeWebviewPanel(handle, viewType, {
                            title: webviewInput.getTitle(),
                            state,
                            panelOptions: webviewInput.webview.options,
                            webviewOptions: webviewInput.webview.contentOptions,
                            active: webviewInput === this._editorService.activeEditor,
                        }, (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, webviewInput.group || 0));
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                        webviewInput.webview.setHtml(this._mainThreadWebviews.getWebviewResolvedFailedContent(viewType));
                    }
                }
            }));
        }
        $unregisterSerializer(viewType) {
            if (!this._revivers.has(viewType)) {
                throw new Error(`No reviver for ${viewType} registered`);
            }
            this._revivers.deleteAndDispose(viewType);
        }
        updateWebviewViewStates(activeEditorInput) {
            if (!this._webviewInputs.size) {
                return;
            }
            const viewStates = {};
            const updateViewStatesForInput = (group, topLevelInput, editorInput) => {
                if (!(editorInput instanceof webviewEditorInput_1.WebviewInput)) {
                    return;
                }
                editorInput.updateGroup(group.id);
                const handle = this._webviewInputs.getHandleForInput(editorInput);
                if (handle) {
                    viewStates[handle] = {
                        visible: topLevelInput === group.activeEditor,
                        active: editorInput === activeEditorInput,
                        position: (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, group.id),
                    };
                }
            };
            for (const group of this._editorGroupService.groups) {
                for (const input of group.editors) {
                    if (input instanceof diffEditorInput_1.DiffEditorInput) {
                        updateViewStatesForInput(group, input, input.primary);
                        updateViewStatesForInput(group, input, input.secondary);
                    }
                    else {
                        updateViewStatesForInput(group, input, input);
                    }
                }
            }
            if (Object.keys(viewStates).length) {
                this._proxy.$onDidChangeWebviewPanelViewStates(viewStates);
            }
        }
        tryGetWebviewInput(handle) {
            return this._webviewInputs.getInputForHandle(handle);
        }
    };
    exports.MainThreadWebviewPanels = MainThreadWebviewPanels;
    exports.MainThreadWebviewPanels = MainThreadWebviewPanels = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, editorService_1.IEditorService),
        __param(5, extensions_1.IExtensionService),
        __param(6, storage_1.IStorageService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, webviewWorkbenchService_1.IWebviewWorkbenchService)
    ], MainThreadWebviewPanels);
    function reviveWebviewIcon(value) {
        if (!value) {
            return undefined;
        }
        return {
            light: uri_1.URI.revive(value.light),
            dark: uri_1.URI.revive(value.dark),
        };
    }
    function reviveWebviewOptions(panelOptions) {
        return {
            enableFindWidget: panelOptions.enableFindWidget,
            retainContextWhenHidden: panelOptions.retainContextWhenHidden,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFdlYnZpZXdQYW5lbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFdlYnZpZXdQYW5lbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0JoRzs7T0FFRztJQUNILE1BQU0saUJBQWlCO1FBQXZCO1lBQ2tCLHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO1lBQ25ELHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO1FBOEJyRSxDQUFDO1FBNUJPLEdBQUcsQ0FBQyxNQUFjLEVBQUUsS0FBbUI7WUFDN0MsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVNLGlCQUFpQixDQUFDLEtBQW1CO1lBQzNDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRU0saUJBQWlCLENBQUMsTUFBYztZQUN0QyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVNLE1BQU0sQ0FBQyxNQUFjO1lBQzNCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLGdCQUFnQixD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