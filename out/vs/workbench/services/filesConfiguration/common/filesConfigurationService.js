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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/base/common/objects", "vs/base/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/common/resources", "vs/base/common/async", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/environment/common/environment", "vs/base/common/map", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor", "vs/platform/markers/common/markers", "vs/editor/common/services/textResourceConfiguration"], function (require, exports, nls_1, instantiation_1, extensions_1, event_1, lifecycle_1, contextkey_1, configuration_1, files_1, objects_1, platform_1, workspace_1, resources_1, async_1, uriIdentity_1, environment_1, map_1, editorInput_1, editor_1, markers_1, textResourceConfiguration_1) {
    "use strict";
    var FilesConfigurationService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilesConfigurationService = exports.IFilesConfigurationService = exports.AutoSaveDisabledReason = exports.AutoSaveMode = exports.AutoSaveAfterShortDelayContext = void 0;
    exports.AutoSaveAfterShortDelayContext = new contextkey_1.RawContextKey('autoSaveAfterShortDelayContext', false, true);
    var AutoSaveMode;
    (function (AutoSaveMode) {
        AutoSaveMode[AutoSaveMode["OFF"] = 0] = "OFF";
        AutoSaveMode[AutoSaveMode["AFTER_SHORT_DELAY"] = 1] = "AFTER_SHORT_DELAY";
        AutoSaveMode[AutoSaveMode["AFTER_LONG_DELAY"] = 2] = "AFTER_LONG_DELAY";
        AutoSaveMode[AutoSaveMode["ON_FOCUS_CHANGE"] = 3] = "ON_FOCUS_CHANGE";
        AutoSaveMode[AutoSaveMode["ON_WINDOW_CHANGE"] = 4] = "ON_WINDOW_CHANGE";
    })(AutoSaveMode || (exports.AutoSaveMode = AutoSaveMode = {}));
    var AutoSaveDisabledReason;
    (function (AutoSaveDisabledReason) {
        AutoSaveDisabledReason[AutoSaveDisabledReason["SETTINGS"] = 1] = "SETTINGS";
        AutoSaveDisabledReason[AutoSaveDisabledReason["OUT_OF_WORKSPACE"] = 2] = "OUT_OF_WORKSPACE";
        AutoSaveDisabledReason[AutoSaveDisabledReason["ERRORS"] = 3] = "ERRORS";
        AutoSaveDisabledReason[AutoSaveDisabledReason["DISABLED"] = 4] = "DISABLED";
    })(AutoSaveDisabledReason || (exports.AutoSaveDisabledReason = AutoSaveDisabledReason = {}));
    exports.IFilesConfigurationService = (0, instantiation_1.createDecorator)('filesConfigurationService');
    let FilesConfigurationService = class FilesConfigurationService extends lifecycle_1.Disposable {
        static { FilesConfigurationService_1 = this; }
        static { this.DEFAULT_AUTO_SAVE_MODE = platform_1.isWeb ? files_1.AutoSaveConfiguration.AFTER_DELAY : files_1.AutoSaveConfiguration.OFF; }
        static { this.DEFAULT_AUTO_SAVE_DELAY = 1000; }
        static { this.READONLY_MESSAGES = {
            providerReadonly: { value: (0, nls_1.localize)('providerReadonly', "Editor is read-only because the file system of the file is read-only."), isTrusted: true },
            sessionReadonly: { value: (0, nls_1.localize)({ key: 'sessionReadonly', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change', '{Locked="](command:{0})"}'] }, "Editor is read-only because the file was set read-only in this session. [Click here](command:{0}) to set writeable.", 'workbench.action.files.setActiveEditorWriteableInSession'), isTrusted: true },
            configuredReadonly: { value: (0, nls_1.localize)({ key: 'configuredReadonly', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change', '{Locked="](command:{0})"}'] }, "Editor is read-only because the file was set read-only via settings. [Click here](command:{0}) to configure.", `workbench.action.openSettings?${encodeURIComponent('["files.readonly"]')}`), isTrusted: true },
            fileLocked: { value: (0, nls_1.localize)({ key: 'fileLocked', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change', '{Locked="](command:{0})"}'] }, "Editor is read-only because of file permissions. [Click here](command:{0}) to set writeable anyway.", 'workbench.action.files.setActiveEditorWriteableInSession'), isTrusted: true },
            fileReadonly: { value: (0, nls_1.localize)('fileReadonly', "Editor is read-only because the file is read-only."), isTrusted: true }
        }; }
        constructor(contextKeyService, configurationService, contextService, environmentService, uriIdentityService, fileService, markerService, textResourceConfigurationService) {
            super();
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.markerService = markerService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this._onDidChangeAutoSaveConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeAutoSaveConfiguration = this._onDidChangeAutoSaveConfiguration.event;
            this._onDidChangeAutoSaveDisabled = this._register(new event_1.Emitter());
            this.onDidChangeAutoSaveDisabled = this._onDidChangeAutoSaveDisabled.event;
            this._onDidChangeFilesAssociation = this._register(new event_1.Emitter());
            this.onDidChangeFilesAssociation = this._onDidChangeFilesAssociation.event;
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            this.autoSaveConfigurationCache = new map_1.LRUCache(1000);
            this.autoSaveDisabledOverrides = new map_1.ResourceMap();
            this.autoSaveAfterShortDelayContext = exports.AutoSaveAfterShortDelayContext.bindTo(this.contextKeyService);
            this.readonlyIncludeMatcher = this._register(new async_1.GlobalIdleValue(() => this.createReadonlyMatcher(files_1.FILES_READONLY_INCLUDE_CONFIG)));
            this.readonlyExcludeMatcher = this._register(new async_1.GlobalIdleValue(() => this.createReadonlyMatcher(files_1.FILES_READONLY_EXCLUDE_CONFIG)));
            this.sessionReadonlyOverrides = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            const configuration = configurationService.getValue();
            this.currentGlobalAutoSaveConfiguration = this.computeAutoSaveConfiguration(undefined, configuration.files);
            this.currentFilesAssociationConfiguration = configuration?.files?.associations;
            this.currentHotExitConfiguration = configuration?.files?.hotExit || files_1.HotExitConfiguration.ON_EXIT;
            this.onFilesConfigurationChange(configuration, false);
            this.registerListeners();
        }
        createReadonlyMatcher(config) {
            const matcher = this._register(new resources_1.ResourceGlobMatcher(resource => this.configurationService.getValue(config, { resource }), event => event.affectsConfiguration(config), this.contextService, this.configurationService));
            this._register(matcher.onExpressionChange(() => this._onDidChangeReadonly.fire()));
            return matcher;
        }
        isReadonly(resource, stat) {
            // if the entire file system provider is readonly, we respect that
            // and do not allow to change readonly. we take this as a hint that
            // the provider has no capabilities of writing.
            const provider = this.fileService.getProvider(resource.scheme);
            if (provider && (0, files_1.hasReadonlyCapability)(provider)) {
                return provider.readOnlyMessage ?? FilesConfigurationService_1.READONLY_MESSAGES.providerReadonly;
            }
            // session override always wins over the others
            const sessionReadonlyOverride = this.sessionReadonlyOverrides.get(resource);
            if (typeof sessionReadonlyOverride === 'boolean') {
                return sessionReadonlyOverride === true ? FilesConfigurationService_1.READONLY_MESSAGES.sessionReadonly : false;
            }
            if (this.uriIdentityService.extUri.isEqualOrParent(resource, this.environmentService.userRoamingDataHome) ||
                this.uriIdentityService.extUri.isEqual(resource, this.contextService.getWorkspace().configuration ?? undefined)) {
                return false; // explicitly exclude some paths from readonly that we need for configuration
            }
            // configured glob patterns win over stat information
            if (this.readonlyIncludeMatcher.value.matches(resource)) {
                return !this.readonlyExcludeMatcher.value.matches(resource) ? FilesConfigurationService_1.READONLY_MESSAGES.configuredReadonly : false;
            }
            // check if file is locked and configured to treat as readonly
            if (this.configuredReadonlyFromPermissions && stat?.locked) {
                return FilesConfigurationService_1.READONLY_MESSAGES.fileLocked;
            }
            // check if file is marked readonly from the file system provider
            if (stat?.readonly) {
                return FilesConfigurationService_1.READONLY_MESSAGES.fileReadonly;
            }
            return false;
        }
        async updateReadonly(resource, readonly) {
            if (readonly === 'toggle') {
                let stat = undefined;
                try {
                    stat = await this.fileService.resolve(resource, { resolveMetadata: true });
                }
                catch (error) {
                    // ignore
                }
                readonly = !this.isReadonly(resource, stat);
            }
            if (readonly === 'reset') {
                this.sessionReadonlyOverrides.delete(resource);
            }
            else {
                this.sessionReadonlyOverrides.set(resource, readonly);
            }
            this._onDidChangeReadonly.fire();
        }
        registerListeners() {
            // Files configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('files')) {
                    this.onFilesConfigurationChange(this.configurationService.getValue(), true);
                }
            }));
        }
        onFilesConfigurationChange(configuration, fromEvent) {
            // Auto Save
            this.currentGlobalAutoSaveConfiguration = this.computeAutoSaveConfiguration(undefined, configuration.files);
            this.autoSaveConfigurationCache.clear();
            this.autoSaveAfterShortDelayContext.set(this.getAutoSaveMode(undefined).mode === 1 /* AutoSaveMode.AFTER_SHORT_DELAY */);
            if (fromEvent) {
                this._onDidChangeAutoSaveConfiguration.fire();
            }
            // Check for change in files associations
            const filesAssociation = configuration?.files?.associations;
            if (!(0, objects_1.equals)(this.currentFilesAssociationConfiguration, filesAssociation)) {
                this.currentFilesAssociationConfiguration = filesAssociation;
                if (fromEvent) {
                    this._onDidChangeFilesAssociation.fire();
                }
            }
            // Hot exit
            const hotExitMode = configuration?.files?.hotExit;
            if (hotExitMode === files_1.HotExitConfiguration.OFF || hotExitMode === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                this.currentHotExitConfiguration = hotExitMode;
            }
            else {
                this.currentHotExitConfiguration = files_1.HotExitConfiguration.ON_EXIT;
            }
            // Readonly
            const readonlyFromPermissions = Boolean(configuration?.files?.readonlyFromPermissions);
            if (readonlyFromPermissions !== Boolean(this.configuredReadonlyFromPermissions)) {
                this.configuredReadonlyFromPermissions = readonlyFromPermissions;
                if (fromEvent) {
                    this._onDidChangeReadonly.fire();
                }
            }
        }
        getAutoSaveConfiguration(resourceOrEditor) {
            const resource = this.toResource(resourceOrEditor);
            if (resource) {
                let resourceAutoSaveConfiguration = this.autoSaveConfigurationCache.get(resource);
                if (!resourceAutoSaveConfiguration) {
                    resourceAutoSaveConfiguration = this.computeAutoSaveConfiguration(resource, this.textResourceConfigurationService.getValue(resource, 'files'));
                    this.autoSaveConfigurationCache.set(resource, resourceAutoSaveConfiguration);
                }
                return resourceAutoSaveConfiguration;
            }
            return this.currentGlobalAutoSaveConfiguration;
        }
        computeAutoSaveConfiguration(resource, filesConfiguration) {
            let autoSave;
            let autoSaveDelay;
            let autoSaveWorkspaceFilesOnly;
            let autoSaveWhenNoErrors;
            let isOutOfWorkspace;
            let isShortAutoSaveDelay;
            switch (filesConfiguration.autoSave ?? FilesConfigurationService_1.DEFAULT_AUTO_SAVE_MODE) {
                case files_1.AutoSaveConfiguration.AFTER_DELAY: {
                    autoSave = 'afterDelay';
                    autoSaveDelay = typeof filesConfiguration.autoSaveDelay === 'number' && filesConfiguration.autoSaveDelay >= 0 ? filesConfiguration.autoSaveDelay : FilesConfigurationService_1.DEFAULT_AUTO_SAVE_DELAY;
                    isShortAutoSaveDelay = autoSaveDelay <= FilesConfigurationService_1.DEFAULT_AUTO_SAVE_DELAY;
                    break;
                }
                case files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE:
                    autoSave = 'onFocusChange';
                    break;
                case files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE:
                    autoSave = 'onWindowChange';
                    break;
            }
            if (filesConfiguration.autoSaveWorkspaceFilesOnly === true) {
                autoSaveWorkspaceFilesOnly = true;
                if (resource && !this.contextService.isInsideWorkspace(resource)) {
                    isOutOfWorkspace = true;
                    isShortAutoSaveDelay = undefined; // out of workspace file are not auto saved with this configuration
                }
            }
            if (filesConfiguration.autoSaveWhenNoErrors === true) {
                autoSaveWhenNoErrors = true;
                isShortAutoSaveDelay = undefined; // this configuration disables short auto save delay
            }
            return {
                autoSave,
                autoSaveDelay,
                autoSaveWorkspaceFilesOnly,
                autoSaveWhenNoErrors,
                isOutOfWorkspace,
                isShortAutoSaveDelay
            };
        }
        toResource(resourceOrEditor) {
            if (resourceOrEditor instanceof editorInput_1.EditorInput) {
                return editor_1.EditorResourceAccessor.getOriginalUri(resourceOrEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            }
            return resourceOrEditor;
        }
        hasShortAutoSaveDelay(resourceOrEditor) {
            const resource = this.toResource(resourceOrEditor);
            if (this.getAutoSaveConfiguration(resource).isShortAutoSaveDelay) {
                return !resource || !this.autoSaveDisabledOverrides.has(resource);
            }
            return false;
        }
        getAutoSaveMode(resourceOrEditor, saveReason) {
            const resource = this.toResource(resourceOrEditor);
            if (resource && this.autoSaveDisabledOverrides.has(resource)) {
                return { mode: 0 /* AutoSaveMode.OFF */, reason: 4 /* AutoSaveDisabledReason.DISABLED */ };
            }
            const autoSaveConfiguration = this.getAutoSaveConfiguration(resource);
            if (typeof autoSaveConfiguration.autoSave === 'undefined') {
                return { mode: 0 /* AutoSaveMode.OFF */, reason: 1 /* AutoSaveDisabledReason.SETTINGS */ };
            }
            if (typeof saveReason === 'number') {
                if ((autoSaveConfiguration.autoSave === 'afterDelay' && saveReason !== 2 /* SaveReason.AUTO */) ||
                    (autoSaveConfiguration.autoSave === 'onFocusChange' && saveReason !== 3 /* SaveReason.FOCUS_CHANGE */ && saveReason !== 4 /* SaveReason.WINDOW_CHANGE */) ||
                    (autoSaveConfiguration.autoSave === 'onWindowChange' && saveReason !== 4 /* SaveReason.WINDOW_CHANGE */)) {
                    return { mode: 0 /* AutoSaveMode.OFF */, reason: 1 /* AutoSaveDisabledReason.SETTINGS */ };
                }
            }
            if (resource) {
                if (autoSaveConfiguration.autoSaveWorkspaceFilesOnly && autoSaveConfiguration.isOutOfWorkspace) {
                    return { mode: 0 /* AutoSaveMode.OFF */, reason: 2 /* AutoSaveDisabledReason.OUT_OF_WORKSPACE */ };
                }
                if (autoSaveConfiguration.autoSaveWhenNoErrors && this.markerService.read({ resource, take: 1, severities: markers_1.MarkerSeverity.Error }).length > 0) {
                    return { mode: 0 /* AutoSaveMode.OFF */, reason: 3 /* AutoSaveDisabledReason.ERRORS */ };
                }
            }
            switch (autoSaveConfiguration.autoSave) {
                case 'afterDelay':
                    if (typeof autoSaveConfiguration.autoSaveDelay === 'number' && autoSaveConfiguration.autoSaveDelay <= FilesConfigurationService_1.DEFAULT_AUTO_SAVE_DELAY) {
                        // Explicitly mark auto save configurations as long running
                        // if they are configured to not run when there are errors.
                        // The rationale here is that errors may come in after auto
                        // save has been scheduled and then further delay the auto
                        // save until resolved.
                        return { mode: autoSaveConfiguration.autoSaveWhenNoErrors ? 2 /* AutoSaveMode.AFTER_LONG_DELAY */ : 1 /* AutoSaveMode.AFTER_SHORT_DELAY */ };
                    }
                    return { mode: 2 /* AutoSaveMode.AFTER_LONG_DELAY */ };
                case 'onFocusChange':
                    return { mode: 3 /* AutoSaveMode.ON_FOCUS_CHANGE */ };
                case 'onWindowChange':
                    return { mode: 4 /* AutoSaveMode.ON_WINDOW_CHANGE */ };
            }
        }
        async toggleAutoSave() {
            const currentSetting = this.configurationService.getValue('files.autoSave');
            let newAutoSaveValue;
            if ([files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE].some(setting => setting === currentSetting)) {
                newAutoSaveValue = files_1.AutoSaveConfiguration.OFF;
            }
            else {
                newAutoSaveValue = files_1.AutoSaveConfiguration.AFTER_DELAY;
            }
            return this.configurationService.updateValue('files.autoSave', newAutoSaveValue);
        }
        disableAutoSave(resourceOrEditor) {
            const resource = this.toResource(resourceOrEditor);
            if (!resource) {
                return lifecycle_1.Disposable.None;
            }
            const counter = this.autoSaveDisabledOverrides.get(resource) ?? 0;
            this.autoSaveDisabledOverrides.set(resource, counter + 1);
            if (counter === 0) {
                this._onDidChangeAutoSaveDisabled.fire(resource);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                const counter = this.autoSaveDisabledOverrides.get(resource) ?? 0;
                if (counter <= 1) {
                    this.autoSaveDisabledOverrides.delete(resource);
                    this._onDidChangeAutoSaveDisabled.fire(resource);
                }
                else {
                    this.autoSaveDisabledOverrides.set(resource, counter - 1);
                }
            });
        }
        get isHotExitEnabled() {
            if (this.contextService.getWorkspace().transient) {
                // Transient workspace: hot exit is disabled because
                // transient workspaces are not restored upon restart
                return false;
            }
            return this.currentHotExitConfiguration !== files_1.HotExitConfiguration.OFF;
        }
        get hotExitConfiguration() {
            return this.currentHotExitConfiguration;
        }
        preventSaveConflicts(resource, language) {
            return this.configurationService.getValue('files.saveConflictResolution', { resource, overrideIdentifier: language }) !== 'overwriteFileOnDisk';
        }
    };
    exports.FilesConfigurationService = FilesConfigurationService;
    exports.FilesConfigurationService = FilesConfigurationService = FilesConfigurationService_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, files_1.IFileService),
        __param(6, markers_1.IMarkerService),
        __param(7, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], FilesConfigurationService);
    (0, extensions_1.registerSingleton)(exports.IFilesConfigurationService, FilesConfigurationService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXNDb25maWd1cmF0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9maWxlc0NvbmZpZ3VyYXRpb24vY29tbW9uL2ZpbGVzQ29uZmlndXJhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBCbkYsUUFBQSw4QkFBOEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsZ0NBQWdDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBbUJ4SCxJQUFrQixZQU1qQjtJQU5ELFdBQWtCLFlBQVk7UUFDN0IsNkNBQUcsQ0FBQTtRQUNILHlFQUFpQixDQUFBO1FBQ2pCLHVFQUFnQixDQUFBO1FBQ2hCLHFFQUFlLENBQUE7UUFDZix1RUFBZ0IsQ0FBQTtJQUNqQixDQUFDLEVBTmlCLFlBQVksNEJBQVosWUFBWSxRQU03QjtJQUVELElBQWtCLHNCQUtqQjtJQUxELFdBQWtCLHNCQUFzQjtRQUN2QywyRUFBWSxDQUFBO1FBQ1osMkZBQWdCLENBQUE7UUFDaEIsdUVBQU0sQ0FBQTtRQUNOLDJFQUFRLENBQUE7SUFDVCxDQUFDLEVBTGlCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBS3ZDO0lBYVksUUFBQSwwQkFBMEIsR0FBRyxJQUFBLCtCQUFlLEVBQTZCLDJCQUEyQixDQUFDLENBQUM7SUEyQzVHLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7O2lCQUloQywyQkFBc0IsR0FBRyxnQkFBSyxDQUFDLENBQUMsQ0FBQyw2QkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLDZCQUFxQixDQUFDLEdBQUcsQUFBeEUsQ0FBeUU7aUJBQy9GLDRCQUF1QixHQUFHLElBQUksQUFBUCxDQUFRO2lCQUUvQixz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