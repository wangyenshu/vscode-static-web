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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/scm/common/scm", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/cancellation", "vs/base/common/themables", "vs/workbench/contrib/scm/common/quickDiff", "vs/base/common/resourceTree", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/base/common/resources"], function (require, exports, uri_1, event_1, lifecycle_1, scm_1, extHost_protocol_1, extHostCustomers_1, cancellation_1, themables_1, quickDiff_1, resourceTree_1, uriIdentity_1, workspace_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSCM = void 0;
    function getIconFromIconDto(iconDto) {
        if (iconDto === undefined) {
            return undefined;
        }
        else if (uri_1.URI.isUri(iconDto)) {
            return uri_1.URI.revive(iconDto);
        }
        else if (themables_1.ThemeIcon.isThemeIcon(iconDto)) {
            return iconDto;
        }
        else {
            const icon = iconDto;
            return { light: uri_1.URI.revive(icon.light), dark: uri_1.URI.revive(icon.dark) };
        }
    }
    class MainThreadSCMResourceGroup {
        get resourceTree() {
            if (!this._resourceTree) {
                const rootUri = this.provider.rootUri ?? uri_1.URI.file('/');
                this._resourceTree = new resourceTree_1.ResourceTree(this, rootUri, this._uriIdentService.extUri);
                for (const resource of this.resources) {
                    this._resourceTree.add(resource.sourceUri, resource);
                }
            }
            return this._resourceTree;
        }
        get hideWhenEmpty() { return !!this.features.hideWhenEmpty; }
        constructor(sourceControlHandle, handle, provider, features, label, id, multiDiffEditorEnableViewChanges, _uriIdentService) {
            this.sourceControlHandle = sourceControlHandle;
            this.handle = handle;
            this.provider = provider;
            this.features = features;
            this.label = label;
            this.id = id;
            this.multiDiffEditorEnableViewChanges = multiDiffEditorEnableViewChanges;
            this._uriIdentService = _uriIdentService;
            this.resources = [];
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._onDidChangeResources = new event_1.Emitter();
            this.onDidChangeResources = this._onDidChangeResources.event;
        }
        toJSON() {
            return {
                $mid: 4 /* MarshalledId.ScmResourceGroup */,
                sourceControlHandle: this.sourceControlHandle,
                groupHandle: this.handle
            };
        }
        splice(start, deleteCount, toInsert) {
            this.resources.splice(start, deleteCount, ...toInsert);
            this._resourceTree = undefined;
            this._onDidChangeResources.fire();
        }
        $updateGroup(features) {
            this.features = { ...this.features, ...features };
            this._onDidChange.fire();
        }
        $updateGroupLabel(label) {
            this.label = label;
            this._onDidChange.fire();
        }
    }
    class MainThreadSCMResource {
        constructor(proxy, sourceControlHandle, groupHandle, handle, sourceUri, resourceGroup, decorations, contextValue, command, multiDiffEditorOriginalUri, multiDiffEditorModifiedUri) {
            this.proxy = proxy;
            this.sourceControlHandle = sourceControlHandle;
            this.groupHandle = groupHandle;
            this.handle = handle;
            this.sourceUri = sourceUri;
            this.resourceGroup = resourceGroup;
            this.decorations = decorations;
            this.contextValue = contextValue;
            this.command = command;
            this.multiDiffEditorOriginalUri = multiDiffEditorOriginalUri;
            this.multiDiffEditorModifiedUri = multiDiffEditorModifiedUri;
        }
        open(preserveFocus) {
            return this.proxy.$executeResourceCommand(this.sourceControlHandle, this.groupHandle, this.handle, preserveFocus);
        }
        toJSON() {
            return {
                $mid: 3 /* MarshalledId.ScmResource */,
                sourceControlHandle: this.sourceControlHandle,
                groupHandle: this.groupHandle,
                handle: this.handle
            };
        }
    }
    class MainThreadSCMHistoryProvider {
        get currentHistoryItemGroup() { return this._currentHistoryItemGroup; }
        set currentHistoryItemGroup(historyItemGroup) {
            this._currentHistoryItemGroup = historyItemGroup;
            this._onDidChangeCurrentHistoryItemGroup.fire();
        }
        constructor(proxy, handle) {
            this.proxy = proxy;
            this.handle = handle;
            this._onDidChangeCurrentHistoryItemGroup = new event_1.Emitter();
            this.onDidChangeCurrentHistoryItemGroup = this._onDidChangeCurrentHistoryItemGroup.event;
        }
        async resolveHistoryItemGroupCommonAncestor(historyItemGroupId1, historyItemGroupId2) {
            return this.proxy.$resolveHistoryItemGroupCommonAncestor(this.handle, historyItemGroupId1, historyItemGroupId2, cancellation_1.CancellationToken.None);
        }
        async provideHistoryItems(historyItemGroupId, options) {
            const historyItems = await this.proxy.$provideHistoryItems(this.handle, historyItemGroupId, options, cancellation_1.CancellationToken.None);
            return historyItems?.map(historyItem => ({ ...historyItem, icon: getIconFromIconDto(historyItem.icon) }));
        }
        async provideHistoryItemSummary(historyItemId, historyItemParentId) {
            const historyItem = await this.proxy.$provideHistoryItemSummary(this.handle, historyItemId, historyItemParentId, cancellation_1.CancellationToken.None);
            return historyItem ? { ...historyItem, icon: getIconFromIconDto(historyItem.icon) } : undefined;
        }
        async provideHistoryItemChanges(historyItemId, historyItemParentId) {
            const changes = await this.proxy.$provideHistoryItemChanges(this.handle, historyItemId, historyItemParentId, cancellation_1.CancellationToken.None);
            return changes?.map(change => ({
                uri: uri_1.URI.revive(change.uri),
                originalUri: change.originalUri && uri_1.URI.revive(change.originalUri),
                modifiedUri: change.modifiedUri && uri_1.URI.revive(change.modifiedUri),
                renameUri: change.renameUri && uri_1.URI.revive(change.renameUri)
            }));
        }
    }
    class MainThreadSCMProvider {
        static { this.ID_HANDLE = 0; }
        get id() { return this._id; }
        get handle() { return this._handle; }
        get label() { return this._label; }
        get rootUri() { return this._rootUri; }
        get inputBoxDocumentUri() { return this._inputBoxDocumentUri; }
        get contextValue() { return this._providerId; }
        get commitTemplate() { return this.features.commitTemplate || ''; }
        get historyProvider() { return this._historyProvider; }
        get acceptInputCommand() { return this.features.acceptInputCommand; }
        get actionButton() { return this.features.actionButton ?? undefined; }
        get statusBarCommands() { return this.features.statusBarCommands; }
        get count() { return this.features.count; }
        get name() { return this._name ?? this._label; }
        get onDidChangeStatusBarCommands() { return this._onDidChangeStatusBarCommands.event; }
        constructor(proxy, _handle, _providerId, _label, _rootUri, _inputBoxDocumentUri, _quickDiffService, _uriIdentService, _workspaceContextService) {
            this.proxy = proxy;
            this._handle = _handle;
            this._providerId = _providerId;
            this._label = _label;
            this._rootUri = _rootUri;
            this._inputBoxDocumentUri = _inputBoxDocumentUri;
            this._quickDiffService = _quickDiffService;
            this._uriIdentService = _uriIdentService;
            this._workspaceContextService = _workspaceContextService;
            this._id = `scm${MainThreadSCMProvider.ID_HANDLE++}`;
            this.groups = [];
            this._onDidChangeResourceGroups = new event_1.Emitter();
            this.onDidChangeResourceGroups = this._onDidChangeResourceGroups.event;
            this._onDidChangeResources = new event_1.Emitter();
            this.onDidChangeResources = this._onDidChangeResources.event;
            this._groupsByHandle = Object.create(null);
            // get groups(): ISequence<ISCMResourceGroup> {
            // 	return {
            // 		elements: this._groups,
            // 		onDidSplice: this._onDidSplice.event
            // 	};
            // 	// return this._groups
            // 	// 	.filter(g => g.resources.elements.length > 0 || !g.features.hideWhenEmpty);
            // }
            this.features = {};
            this._onDidChangeCommitTemplate = new event_1.Emitter();
            this.onDidChangeCommitTemplate = this._onDidChangeCommitTemplate.event;
            this._onDidChangeStatusBarCommands = new event_1.Emitter();
            this._onDidChangeHistoryProvider = new event_1.Emitter();
            this.onDidChangeHistoryProvider = this._onDidChangeHistoryProvider.event;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.isSCM = true;
            if (_rootUri) {
                const folder = this._workspaceContextService.getWorkspaceFolder(_rootUri);
                if (folder?.uri.toString() === _rootUri.toString()) {
                    this._name = folder.name;
                }
                else if (_rootUri.path !== '/') {
                    this._name = (0, resources_1.basename)(_rootUri);
                }
            }
        }
        $updateSourceControl(features) {
            this.features = { ...this.features, ...features };
            this._onDidChange.fire();
            if (typeof features.commitTemplate !== 'undefined') {
                this._onDidChangeCommitTemplate.fire(this.commitTemplate);
            }
            if (typeof features.statusBarCommands !== 'undefined') {
                this._onDidChangeStatusBarCommands.fire(this.statusBarCommands);
            }
            if (features.hasQuickDiffProvider && !this._quickDiff) {
                this._quickDiff = this._quickDiffService.addQuickDiffProvider({
                    label: features.quickDiffLabel ?? this.label,
                    rootUri: this.rootUri,
                    isSCM: this.isSCM,
                    getOriginalResource: (uri) => this.getOriginalResource(uri)
                });
            }
            else if (features.hasQuickDiffProvider === false && this._quickDiff) {
                this._quickDiff.dispose();
                this._quickDiff = undefined;
            }
            if (features.hasHistoryProvider && !this._historyProvider) {
                this._historyProvider = new MainThreadSCMHistoryProvider(this.proxy, this.handle);
                this._onDidChangeHistoryProvider.fire();
            }
            else if (features.hasHistoryProvider === false && this._historyProvider) {
                this._historyProvider = undefined;
                this._onDidChangeHistoryProvider.fire();
            }
        }
        $registerGroups(_groups) {
            const groups = _groups.map(([handle, id, label, features, multiDiffEditorEnableViewChanges]) => {
                const group = new MainThreadSCMResourceGroup(this.handle, handle, this, features, label, id, multiDiffEditorEnableViewChanges, this._uriIdentService);
                this._groupsByHandle[handle] = group;
                return group;
            });
            this.groups.splice(this.groups.length, 0, ...groups);
            this._onDidChangeResourceGroups.fire();
        }
        $updateGroup(handle, features) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            group.$updateGroup(features);
        }
        $updateGroupLabel(handle, label) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            group.$updateGroupLabel(label);
        }
        $spliceGroupResourceStates(splices) {
            for (const [groupHandle, groupSlices] of splices) {
                const group = this._groupsByHandle[groupHandle];
                if (!group) {
                    console.warn(`SCM group ${groupHandle} not found in provider ${this.label}`);
                    continue;
                }
                // reverse the splices sequence in order to apply them correctly
                groupSlices.reverse();
                for (const [start, deleteCount, rawResources] of groupSlices) {
                    const resources = rawResources.map(rawResource => {
                        const [handle, sourceUri, icons, tooltip, strikeThrough, faded, contextValue, command, multiDiffEditorOriginalUri, multiDiffEditorModifiedUri] = rawResource;
                        const [light, dark] = icons;
                        const icon = themables_1.ThemeIcon.isThemeIcon(light) ? light : uri_1.URI.revive(light);
                        const iconDark = (themables_1.ThemeIcon.isThemeIcon(dark) ? dark : uri_1.URI.revive(dark)) || icon;
                        const decorations = {
                            icon: icon,
                            iconDark: iconDark,
                            tooltip,
                            strikeThrough,
                            faded
                        };
                        return new MainThreadSCMResource(this.proxy, this.handle, groupHandle, handle, uri_1.URI.revive(sourceUri), group, decorations, contextValue || undefined, command, uri_1.URI.revive(multiDiffEditorOriginalUri), uri_1.URI.revive(multiDiffEditorModifiedUri));
                    });
                    group.splice(start, deleteCount, resources);
                }
            }
            this._onDidChangeResources.fire();
        }
        $unregisterGroup(handle) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            delete this._groupsByHandle[handle];
            this.groups.splice(this.groups.indexOf(group), 1);
            this._onDidChangeResourceGroups.fire();
        }
        async getOriginalResource(uri) {
            if (!this.features.hasQuickDiffProvider) {
                return null;
            }
            const result = await this.proxy.$provideOriginalResource(this.handle, uri, cancellation_1.CancellationToken.None);
            return result && uri_1.URI.revive(result);
        }
        $onDidChangeHistoryProviderCurrentHistoryItemGroup(currentHistoryItemGroup) {
            if (!this._historyProvider) {
                return;
            }
            this._historyProvider.currentHistoryItemGroup = currentHistoryItemGroup ?? undefined;
        }
        toJSON() {
            return {
                $mid: 5 /* MarshalledId.ScmProvider */,
                handle: this.handle
            };
        }
        dispose() {
            this._quickDiff?.dispose();
        }
    }
    let MainThreadSCM = class MainThreadSCM {
        constructor(extHostContext, scmService, scmViewService, quickDiffService, _uriIdentService, workspaceContextService) {
            this.scmService = scmService;
            this.scmViewService = scmViewService;
            this.quickDiffService = quickDiffService;
            this._uriIdentService = _uriIdentService;
            this.workspaceContextService = workspaceContextService;
            this._repositories = new Map();
            this._repositoryDisposables = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSCM);
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._repositories.values());
            this._repositories.clear();
            (0, lifecycle_1.dispose)(this._repositoryDisposables.values());
            this._repositoryDisposables.clear();
            this._disposables.dispose();
        }
        $registerSourceControl(handle, id, label, rootUri, inputBoxDocumentUri) {
            const provider = new MainThreadSCMProvider(this._proxy, handle, id, label, rootUri ? uri_1.URI.revive(rootUri) : undefined, uri_1.URI.revive(inputBoxDocumentUri), this.quickDiffService, this._uriIdentService, this.workspaceContextService);
            const repository = this.scmService.registerSCMProvider(provider);
            this._repositories.set(handle, repository);
            const disposable = (0, lifecycle_1.combinedDisposable)(event_1.Event.filter(this.scmViewService.onDidFocusRepository, r => r === repository)(_ => this._proxy.$setSelectedSourceControl(handle)), repository.input.onDidChange(({ value }) => this._proxy.$onInputBoxValueChange(handle, value)));
            if (this.scmViewService.focusedRepository === repository) {
                setTimeout(() => this._proxy.$setSelectedSourceControl(handle), 0);
            }
            if (repository.input.value) {
                setTimeout(() => this._proxy.$onInputBoxValueChange(handle, repository.input.value), 0);
            }
            this._repositoryDisposables.set(handle, disposable);
        }
        $updateSourceControl(handle, features) {
            const repository = this._repositories.get(handle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateSourceControl(features);
        }
        $unregisterSourceControl(handle) {
            const repository = this._repositories.get(handle);
            if (!repository) {
                return;
            }
            this._repositoryDisposables.get(handle).dispose();
            this._repositoryDisposables.delete(handle);
            repository.dispose();
            this._repositories.delete(handle);
        }
        $registerGroups(sourceControlHandle, groups, splices) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$registerGroups(groups);
            provider.$spliceGroupResourceStates(splices);
        }
        $updateGroup(sourceControlHandle, groupHandle, features) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateGroup(groupHandle, features);
        }
        $updateGroupLabel(sourceControlHandle, groupHandle, label) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateGroupLabel(groupHandle, label);
        }
        $spliceResourceStates(sourceControlHandle, splices) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$spliceGroupResourceStates(splices);
        }
        $unregisterGroup(sourceControlHandle, handle) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$unregisterGroup(handle);
        }
        $setInputBoxValue(sourceControlHandle, value) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.setValue(value, false);
        }
        $setInputBoxPlaceholder(sourceControlHandle, placeholder) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.placeholder = placeholder;
        }
        $setInputBoxEnablement(sourceControlHandle, enabled) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.enabled = enabled;
        }
        $setInputBoxVisibility(sourceControlHandle, visible) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.visible = visible;
        }
        $showValidationMessage(sourceControlHandle, message, type) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.showValidationMessage(message, type);
        }
        $setValidationProviderIsEnabled(sourceControlHandle, enabled) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            if (enabled) {
                repository.input.validateInput = async (value, pos) => {
                    const result = await this._proxy.$validateInput(sourceControlHandle, value, pos);
                    return result && { message: result[0], type: result[1] };
                };
            }
            else {
                repository.input.validateInput = async () => undefined;
            }
        }
        $onDidChangeHistoryProviderCurrentHistoryItemGroup(sourceControlHandle, historyItemGroup) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$onDidChangeHistoryProviderCurrentHistoryItemGroup(historyItemGroup);
        }
    };
    exports.MainThreadSCM = MainThreadSCM;
    exports.MainThreadSCM = MainThreadSCM = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadSCM),
        __param(1, scm_1.ISCMService),
        __param(2, scm_1.ISCMViewService),
        __param(3, quickDiff_1.IQuickDiffService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], MainThreadSCM);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFNDTS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkU0NNLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CaEcsU0FBUyxrQkFBa0IsQ0FBQyxPQUFtRjtRQUM5RyxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMzQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO2FBQU0sSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDL0IsT0FBTyxTQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLENBQUM7YUFBTSxJQUFJLHFCQUFTLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDM0MsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLElBQUksR0FBRyxPQUF3RCxDQUFDO1lBQ3RFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDdkUsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLDBCQUEwQjtRQUsvQixJQUFJLFlBQVk7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN6QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksMkJBQVks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