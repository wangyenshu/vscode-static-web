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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/tunnel/common/tunnel", "vs/workbench/services/remote/common/tunnelModel", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, nls, event_1, instantiation_1, extensions_1, storage_1, tunnel_1, tunnelModel_1, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelEditId = exports.TunnelType = exports.PORT_AUTO_SOURCE_SETTING_HYBRID = exports.PORT_AUTO_SOURCE_SETTING_OUTPUT = exports.PORT_AUTO_SOURCE_SETTING_PROCESS = exports.PORT_AUTO_FALLBACK_SETTING = exports.PORT_AUTO_SOURCE_SETTING = exports.PORT_AUTO_FORWARD_SETTING = exports.TUNNEL_VIEW_CONTAINER_ID = exports.TUNNEL_VIEW_ID = exports.REMOTE_EXPLORER_TYPE_KEY = exports.IRemoteExplorerService = void 0;
    exports.IRemoteExplorerService = (0, instantiation_1.createDecorator)('remoteExplorerService');
    exports.REMOTE_EXPLORER_TYPE_KEY = 'remote.explorerType';
    exports.TUNNEL_VIEW_ID = '~remote.forwardedPorts';
    exports.TUNNEL_VIEW_CONTAINER_ID = '~remote.forwardedPortsContainer';
    exports.PORT_AUTO_FORWARD_SETTING = 'remote.autoForwardPorts';
    exports.PORT_AUTO_SOURCE_SETTING = 'remote.autoForwardPortsSource';
    exports.PORT_AUTO_FALLBACK_SETTING = 'remote.autoForwardPortsFallback';
    exports.PORT_AUTO_SOURCE_SETTING_PROCESS = 'process';
    exports.PORT_AUTO_SOURCE_SETTING_OUTPUT = 'output';
    exports.PORT_AUTO_SOURCE_SETTING_HYBRID = 'hybrid';
    var TunnelType;
    (function (TunnelType) {
        TunnelType["Candidate"] = "Candidate";
        TunnelType["Detected"] = "Detected";
        TunnelType["Forwarded"] = "Forwarded";
        TunnelType["Add"] = "Add";
    })(TunnelType || (exports.TunnelType = TunnelType = {}));
    var TunnelEditId;
    (function (TunnelEditId) {
        TunnelEditId[TunnelEditId["None"] = 0] = "None";
        TunnelEditId[TunnelEditId["New"] = 1] = "New";
        TunnelEditId[TunnelEditId["Label"] = 2] = "Label";
        TunnelEditId[TunnelEditId["LocalPort"] = 3] = "LocalPort";
    })(TunnelEditId || (exports.TunnelEditId = TunnelEditId = {}));
    const getStartedWalkthrough = {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                description: nls.localize('getStartedWalkthrough.id', 'The ID of a Get Started walkthrough to open.'),
                type: 'string'
            },
        }
    };
    const remoteHelpExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'remoteHelp',
        jsonSchema: {
            description: nls.localize('RemoteHelpInformationExtPoint', 'Contributes help information for Remote'),
            type: 'object',
            properties: {
                'getStarted': {
                    description: nls.localize('RemoteHelpInformationExtPoint.getStarted', "The url, or a command that returns the url, to your project's Getting Started page, or a walkthrough ID contributed by your project's extension"),
                    oneOf: [
                        { type: 'string' },
                        getStartedWalkthrough
                    ]
                },
                'documentation': {
                    description: nls.localize('RemoteHelpInformationExtPoint.documentation', "The url, or a command that returns the url, to your project's documentation page"),
                    type: 'string'
                },
                'feedback': {
                    description: nls.localize('RemoteHelpInformationExtPoint.feedback', "The url, or a command that returns the url, to your project's feedback reporter"),
                    type: 'string',
                    markdownDeprecationMessage: nls.localize('RemoteHelpInformationExtPoint.feedback.deprecated', "Use {0} instead", '`reportIssue`')
                },
                'reportIssue': {
                    description: nls.localize('RemoteHelpInformationExtPoint.reportIssue', "The url, or a command that returns the url, to your project's issue reporter"),
                    type: 'string'
                },
                'issues': {
                    description: nls.localize('RemoteHelpInformationExtPoint.issues', "The url, or a command that returns the url, to your project's issues list"),
                    type: 'string'
                }
            }
        }
    });
    let RemoteExplorerService = class RemoteExplorerService {
        constructor(storageService, tunnelService, instantiationService) {
            this.storageService = storageService;
            this.tunnelService = tunnelService;
            this._targetType = [];
            this._onDidChangeTargetType = new event_1.Emitter();
            this.onDidChangeTargetType = this._onDidChangeTargetType.event;
            this._onDidChangeHelpInformation = new event_1.Emitter();
            this.onDidChangeHelpInformation = this._onDidChangeHelpInformation.event;
            this._helpInformation = [];
            this._onDidChangeEditable = new event_1.Emitter();
            this.onDidChangeEditable = this._onDidChangeEditable.event;
            this._onEnabledPortsFeatures = new event_1.Emitter();
            this.onEnabledPortsFeatures = this._onEnabledPortsFeatures.event;
            this._portsFeaturesEnabled = false;
            this.namedProcesses = new Map();
            this._tunnelModel = instantiationService.createInstance(tunnelModel_1.TunnelModel);
            remoteHelpExtPoint.setHandler((extensions) => {
                this._helpInformation.push(...extensions);
                this._onDidChangeHelpInformation.fire(extensions);
            });
        }
        get helpInformation() {
            return this._helpInformation;
        }
        set targetType(name) {
            // Can just compare the first element of the array since there are no target overlaps
            const current = this._targetType.length > 0 ? this._targetType[0] : '';
            const newName = name.length > 0 ? name[0] : '';
            if (current !== newName) {
                this._targetType = name;
                this.storageService.store(exports.REMOTE_EXPLORER_TYPE_KEY, this._targetType.toString(), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                this.storageService.store(exports.REMOTE_EXPLORER_TYPE_KEY, this._targetType.toString(), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                this._onDidChangeTargetType.fire(this._targetType);
            }
        }
        get targetType() {
            return this._targetType;
        }
        get tunnelModel() {
            return this._tunnelModel;
        }
        forward(tunnelProperties, attributes) {
            return this.tunnelModel.forward(tunnelProperties, attributes);
        }
        close(remote, reason) {
            return this.tunnelModel.close(remote.host, remote.port, reason);
        }
        setTunnelInformation(tunnelInformation) {
            if (tunnelInformation?.features) {
                this.tunnelService.setTunnelFeatures(tunnelInformation.features);
            }
            this.tunnelModel.addEnvironmentTunnels(tunnelInformation?.environmentTunnels);
        }
        setEditable(tunnelItem, editId, data) {
            if (!data) {
                this._editable = undefined;
            }
            else {
                this._editable = { tunnelItem, data, editId };
            }
            this._onDidChangeEditable.fire(tunnelItem ? { tunnel: tunnelItem, editId } : undefined);
        }
        getEditableData(tunnelItem, editId) {
            return (this._editable &&
                ((!tunnelItem && (tunnelItem === this._editable.tunnelItem)) ||
                    (tunnelItem && (this._editable.tunnelItem?.remotePort === tunnelItem.remotePort) && (this._editable.tunnelItem.remoteHost === tunnelItem.remoteHost)
                        && (this._editable.editId === editId)))) ?
                this._editable.data : undefined;
        }
        setCandidateFilter(filter) {
            if (!filter) {
                return {
                    dispose: () => { }
                };
            }
            this.tunnelModel.setCandidateFilter(filter);
            return {
                dispose: () => {
                    this.tunnelModel.setCandidateFilter(undefined);
                }
            };
        }
        onFoundNewCandidates(candidates) {
            this.tunnelModel.setCandidates(candidates);
        }
        restore() {
            return this.tunnelModel.restoreForwarded();
        }
        enablePortsFeatures() {
            this._portsFeaturesEnabled = true;
            this._onEnabledPortsFeatures.fire();
        }
        get portsFeaturesEnabled() {
            return this._portsFeaturesEnabled;
        }
    };
    RemoteExplorerService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, tunnel_1.ITunnelService),
        __param(2, instantiation_1.IInstantiationService)
    ], RemoteExplorerService);
    (0, extensions_1.registerSingleton)(exports.IRemoteExplorerService, RemoteExplorerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXhwbG9yZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3JlbW90ZS9jb21tb24vcmVtb3RlRXhwbG9yZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCbkYsUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHVCQUF1QixDQUFDLENBQUM7SUFDMUYsUUFBQSx3QkFBd0IsR0FBVyxxQkFBcUIsQ0FBQztJQUN6RCxRQUFBLGNBQWMsR0FBRyx3QkFBd0IsQ0FBQztJQUMxQyxRQUFBLHdCQUF3QixHQUFHLGlDQUFpQyxDQUFDO0lBQzdELFFBQUEseUJBQXlCLEdBQUcseUJBQXlCLENBQUM7SUFDdEQsUUFBQSx3QkFBd0IsR0FBRywrQkFBK0IsQ0FBQztJQUMzRCxRQUFBLDBCQUEwQixHQUFHLGlDQUFpQyxDQUFDO0lBQy9ELFFBQUEsZ0NBQWdDLEdBQUcsU0FBUyxDQUFDO0lBQzdDLFFBQUEsK0JBQStCLEdBQUcsUUFBUSxDQUFDO0lBQzNDLFFBQUEsK0JBQStCLEdBQUcsUUFBUSxDQUFDO0lBRXhELElBQVksVUFLWDtJQUxELFdBQVksVUFBVTtRQUNyQixxQ0FBdUIsQ0FBQTtRQUN2QixtQ0FBcUIsQ0FBQTtRQUNyQixxQ0FBdUIsQ0FBQTtRQUN2Qix5QkFBVyxDQUFBO0lBQ1osQ0FBQyxFQUxXLFVBQVUsMEJBQVYsVUFBVSxRQUtyQjtJQXFCRCxJQUFZLFlBS1g7SUFMRCxXQUFZLFlBQVk7UUFDdkIsK0NBQVEsQ0FBQTtRQUNSLDZDQUFPLENBQUE7UUFDUCxpREFBUyxDQUFBO1FBQ1QseURBQWEsQ0FBQTtJQUNkLENBQUMsRUFMVyxZQUFZLDRCQUFaLFlBQVksUUFLdkI7SUFZRCxNQUFNLHFCQUFx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