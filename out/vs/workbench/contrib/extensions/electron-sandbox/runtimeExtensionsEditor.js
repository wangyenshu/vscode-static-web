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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextview/browser/contextView", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/label/common/label", "vs/workbench/contrib/extensions/electron-sandbox/extensionsSlowActions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/contrib/extensions/common/reportExtensionIssueAction", "vs/workbench/contrib/extensions/browser/abstractRuntimeExtensionsEditor", "vs/base/common/buffer", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/profiling/common/profiling", "vs/platform/clipboard/common/clipboardService", "vs/platform/dialogs/common/dialogs", "vs/base/common/network", "vs/base/common/resources", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/hover/browser/hover"], function (require, exports, nls, actions_1, telemetry_1, instantiation_1, extensions_1, themeService_1, extensions_2, contextView_1, notification_1, contextkey_1, storage_1, label_1, extensionsSlowActions_1, environmentService_1, reportExtensionIssueAction_1, abstractRuntimeExtensionsEditor_1, buffer_1, uri_1, files_1, profiling_1, clipboardService_1, dialogs_1, network_1, resources_1, extensionFeatures_1, hover_1) {
    "use strict";
    var StartExtensionHostProfileAction_1, SaveExtensionHostProfileAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveExtensionHostProfileAction = exports.StopExtensionHostProfileAction = exports.StartExtensionHostProfileAction = exports.RuntimeExtensionsEditor = exports.ProfileSessionState = exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED = exports.CONTEXT_PROFILE_SESSION_STATE = exports.IExtensionHostProfileService = void 0;
    exports.IExtensionHostProfileService = (0, instantiation_1.createDecorator)('extensionHostProfileService');
    exports.CONTEXT_PROFILE_SESSION_STATE = new contextkey_1.RawContextKey('profileSessionState', 'none');
    exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED = new contextkey_1.RawContextKey('extensionHostProfileRecorded', false);
    var ProfileSessionState;
    (function (ProfileSessionState) {
        ProfileSessionState[ProfileSessionState["None"] = 0] = "None";
        ProfileSessionState[ProfileSessionState["Starting"] = 1] = "Starting";
        ProfileSessionState[ProfileSessionState["Running"] = 2] = "Running";
        ProfileSessionState[ProfileSessionState["Stopping"] = 3] = "Stopping";
    })(ProfileSessionState || (exports.ProfileSessionState = ProfileSessionState = {}));
    let RuntimeExtensionsEditor = class RuntimeExtensionsEditor extends abstractRuntimeExtensionsEditor_1.AbstractRuntimeExtensionsEditor {
        constructor(group, telemetryService, themeService, contextKeyService, extensionsWorkbenchService, extensionService, notificationService, contextMenuService, instantiationService, storageService, labelService, environmentService, clipboardService, _extensionHostProfileService, extensionFeaturesManagementService, hoverService) {
            super(group, telemetryService, themeService, contextKeyService, extensionsWorkbenchService, extensionService, notificationService, contextMenuService, instantiationService, storageService, labelService, environmentService, clipboardService, extensionFeaturesManagementService, hoverService);
            this._extensionHostProfileService = _extensionHostProfileService;
            this._profileInfo = this._extensionHostProfileService.lastProfile;
            this._extensionsHostRecorded = exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED.bindTo(contextKeyService);
            this._profileSessionState = exports.CONTEXT_PROFILE_SESSION_STATE.bindTo(contextKeyService);
            this._register(this._extensionHostProfileService.onDidChangeLastProfile(() => {
                this._profileInfo = this._extensionHostProfileService.lastProfile;
                this._extensionsHostRecorded.set(!!this._profileInfo);
                this._updateExtensions();
            }));
            this._register(this._extensionHostProfileService.onDidChangeState(() => {
                const state = this._extensionHostProfileService.state;
                this._profileSessionState.set(ProfileSessionState[state].toLowerCase());
            }));
        }
        _getProfileInfo() {
            return this._profileInfo;
        }
        _getUnresponsiveProfile(extensionId) {
            return this._extensionHostProfileService.getUnresponsiveProfile(extensionId);
        }
        _createSlowExtensionAction(element) {
            if (element.unresponsiveProfile) {
                return this._instantiationService.createInstance(extensionsSlowActions_1.SlowExtensionAction, element.description, element.unresponsiveProfile);
            }
            return null;
        }
        _createReportExtensionIssueAction(element) {
            if (element.marketplaceInfo) {
                return this._instantiationService.createInstance(reportExtensionIssueAction_1.ReportExtensionIssueAction, element.description);
            }
            return null;
        }
        _createSaveExtensionHostProfileAction() {
            return this._instantiationService.createInstance(SaveExtensionHostProfileAction, SaveExtensionHostProfileAction.ID, SaveExtensionHostProfileAction.LABEL);
        }
        _createProfileAction() {
            const state = this._extensionHostProfileService.state;
            const profileAction = (state === ProfileSessionState.Running
                ? this._instantiationService.createInstance(StopExtensionHostProfileAction, StopExtensionHostProfileAction.ID, StopExtensionHostProfileAction.LABEL)
                : this._instantiationService.createInstance(StartExtensionHostProfileAction, StartExtensionHostProfileAction.ID, StartExtensionHostProfileAction.LABEL));
            return profileAction;
        }
    };
    exports.RuntimeExtensionsEditor = RuntimeExtensionsEditor;
    exports.RuntimeExtensionsEditor = RuntimeExtensionsEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, extensions_1.IExtensionsWorkbenchService),
        __param(5, extensions_2.IExtensionService),
        __param(6, notification_1.INotificationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, storage_1.IStorageService),
        __param(10, label_1.ILabelService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, clipboardService_1.IClipboardService),
        __param(13, exports.IExtensionHostProfileService),
        __param(14, extensionFeatures_1.IExtensionFeaturesManagementService),
        __param(15, hover_1.IHoverService)
    ], RuntimeExtensionsEditor);
    let StartExtensionHostProfileAction = class StartExtensionHostProfileAction extends actions_1.Action {
        static { StartExtensionHostProfileAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.extensionHostProfile'; }
        static { this.LABEL = nls.localize('extensionHostProfileStart', "Start Extension Host Profile"); }
        constructor(id = StartExtensionHostProfileAction_1.ID, label = StartExtensionHostProfileAction_1.LABEL, _extensionHostProfileService) {
            super(id, label);
            this._extensionHostProfileService = _extensionHostProfileService;
        }
        run() {
            this._extensionHostProfileService.startProfiling();
            return Promise.resolve();
        }
    };
    exports.StartExtensionHostProfileAction = StartExtensionHostProfileAction;
    exports.StartExtensionHostProfileAction = StartExtensionHostProfileAction = StartExtensionHostProfileAction_1 = __decorate([
        __param(2, exports.IExtensionHostProfileService)
    ], StartExtensionHostProfileAction);
    let StopExtensionHostProfileAction = class StopExtensionHostProfileAction extends actions_1.Action {
        static { this.ID = 'workbench.extensions.action.stopExtensionHostProfile'; }
        static { this.LABEL = nls.localize('stopExtensionHostProfileStart', "Stop Extension Host Profile"); }
        constructor(id = StartExtensionHostProfileAction.ID, label = StartExtensionHostProfileAction.LABEL, _extensionHostProfileService) {
            super(id, label);
            this._extensionHostProfileService = _extensionHostProfileService;
        }
        run() {
            this._extensionHostProfileService.stopProfiling();
            return Promise.resolve();
        }
    };
    exports.StopExtensionHostProfileAction = StopExtensionHostProfileAction;
    exports.StopExtensionHostProfileAction = StopExtensionHostProfileAction = __decorate([
        __param(2, exports.IExtensionHostProfileService)
    ], StopExtensionHostProfileAction);
    let SaveExtensionHostProfileAction = class SaveExtensionHostProfileAction extends actions_1.Action {
        static { SaveExtensionHostProfileAction_1 = this; }
        static { this.LABEL = nls.localize('saveExtensionHostProfile', "Save Extension Host Profile"); }
        static { this.ID = 'workbench.extensions.action.saveExtensionHostProfile'; }
        constructor(id = SaveExtensionHostProfileAction_1.ID, label = SaveExtensionHostProfileAction_1.LABEL, _environmentService, _extensionHostProfileService, _fileService, _fileDialogService) {
            super(id, label, undefined, false);
            this._environmentService = _environmentService;
            this._extensionHostProfileService = _extensionHostProfileService;
            this._fileService = _fileService;
            this._fileDialogService = _fileDialogService;
            this._extensionHostProfileService.onDidChangeLastProfile(() => {
                this.enabled = (this._extensionHostProfileService.lastProfile !== null);
            });
        }
        run() {
            return Promise.resolve(this._asyncRun());
        }
        async _asyncRun() {
            const picked = await this._fileDialogService.showSaveDialog({
                title: nls.localize('saveprofile.dialogTitle', "Save Extension Host Profile"),
                availableFileSystems: [network_1.Schemas.file],
                defaultUri: (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), `CPU-${new Date().toISOString().replace(/[\-:]/g, '')}.cpuprofile`),
                filters: [{
                        name: 'CPU Profiles',
                        extensions: ['cpuprofile', 'txt']
                    }]
            });
            if (!picked) {
                return;
            }
            const profileInfo = this._extensionHostProfileService.lastProfile;
            let dataToWrite = profileInfo ? profileInfo.data : {};
            let savePath = picked.fsPath;
            if (this._environmentService.isBuilt) {
                // when running from a not-development-build we remove
                // absolute filenames because we don't want to reveal anything
                // about users. We also append the `.txt` suffix to make it
                // easier to attach these files to GH issues
                dataToWrite = profiling_1.Utils.rewriteAbsolutePaths(dataToWrite, 'piiRemoved');
                savePath = savePath + '.txt';
            }
            return this._fileService.writeFile(uri_1.URI.file(savePath), buffer_1.VSBuffer.fromString(JSON.stringify(profileInfo ? profileInfo.data : {}, null, '\t')));
        }
    };
    exports.SaveExtensionHostProfileAction = SaveExtensionHostProfileAction;
    exports.SaveExtensionHostProfileAction = SaveExtensionHostProfileAction = SaveExtensionHostProfileAction_1 = __decorate([
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, exports.IExtensionHostProfileService),
        __param(4, files_1.IFileService),
        __param(5, dialogs_1.IFileDialogService)
    ], SaveExtensionHostProfileAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZUV4dGVuc2lvbnNFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2VsZWN0cm9uLXNhbmRib3gvcnVudGltZUV4dGVuc2lvbnNFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdDbkYsUUFBQSw0QkFBNEIsR0FBRyxJQUFBLCtCQUFlLEVBQStCLDZCQUE2QixDQUFDLENBQUM7SUFDNUcsUUFBQSw2QkFBNkIsR0FBRyxJQUFJLDBCQUFhLENBQVMscUJBQXFCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekYsUUFBQSx1Q0FBdUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsOEJBQThCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFekgsSUFBWSxtQkFLWDtJQUxELFdBQVksbUJBQW1CO1FBQzlCLDZEQUFRLENBQUE7UUFDUixxRUFBWSxDQUFBO1FBQ1osbUVBQVcsQ0FBQTtRQUNYLHFFQUFZLENBQUE7SUFDYixDQUFDLEVBTFcsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFLOUI7SUFrQk0sSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxpRUFBK0I7UUFNM0UsWUFDQyxLQUFtQixFQUNBLGdCQUFtQyxFQUN2QyxZQUEyQixFQUN0QixpQkFBcUMsRUFDNUIsMEJBQXVELEVBQ2pFLGdCQUFtQyxFQUNoQyxtQkFBeUMsRUFDMUMsa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUNqRCxjQUErQixFQUNqQyxZQUEyQixFQUNaLGtCQUFnRCxFQUMzRCxnQkFBbUMsRUFDUCw0QkFBMEQsRUFDcEUsa0NBQXVFLEVBQzdGLFlBQTJCO1lBRTFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGlC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