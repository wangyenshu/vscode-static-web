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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/workbench/services/environment/common/environmentService", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/remoteAgentEnvironmentChannel", "vs/base/common/event", "vs/platform/sign/common/sign", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/remote/common/remoteSocketFactoryService"], function (require, exports, lifecycle_1, ipc_1, environmentService_1, remoteAgentConnection_1, remoteAuthorityResolver_1, remoteAgentEnvironmentChannel_1, event_1, sign_1, log_1, productService_1, userDataProfile_1, remoteSocketFactoryService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractRemoteAgentService = void 0;
    let AbstractRemoteAgentService = class AbstractRemoteAgentService extends lifecycle_1.Disposable {
        constructor(remoteSocketFactoryService, userDataProfileService, _environmentService, productService, _remoteAuthorityResolverService, signService, logService) {
            super();
            this.remoteSocketFactoryService = remoteSocketFactoryService;
            this.userDataProfileService = userDataProfileService;
            this._environmentService = _environmentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            if (this._environmentService.remoteAuthority) {
                this._connection = this._register(new RemoteAgentConnection(this._environmentService.remoteAuthority, productService.commit, productService.quality, this.remoteSocketFactoryService, this._remoteAuthorityResolverService, signService, logService));
            }
            else {
                this._connection = null;
            }
            this._environment = null;
        }
        getConnection() {
            return this._connection;
        }
        getEnvironment() {
            return this.getRawEnvironment().then(undefined, () => null);
        }
        getRawEnvironment() {
            if (!this._environment) {
                this._environment = this._withChannel(async (channel, connection) => {
                    const env = await remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getEnvironmentData(channel, connection.remoteAuthority, this.userDataProfileService.currentProfile.isDefault ? undefined : this.userDataProfileService.currentProfile.id);
                    this._remoteAuthorityResolverService._setAuthorityConnectionToken(connection.remoteAuthority, env.connectionToken);
                    return env;
                }, null);
            }
            return this._environment;
        }
        getExtensionHostExitInfo(reconnectionToken) {
            return this._withChannel((channel, connection) => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getExtensionHostExitInfo(channel, connection.remoteAuthority, reconnectionToken), null);
        }
        getDiagnosticInfo(options) {
            return this._withChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getDiagnosticInfo(channel, options), undefined);
        }
        updateTelemetryLevel(telemetryLevel) {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.updateTelemetryLevel(channel, telemetryLevel), undefined);
        }
        logTelemetry(eventName, data) {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.logTelemetry(channel, eventName, data), undefined);
        }
        flushTelemetry() {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.flushTelemetry(channel), undefined);
        }
        getRoundTripTime() {
            return this._withTelemetryChannel(async (channel) => {
                const start = Date.now();
                await remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.ping(channel);
                return Date.now() - start;
            }, undefined);
        }
        _withChannel(callback, fallback) {
            const connection = this.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel('remoteextensionsenvironment', (channel) => callback(channel, connection));
        }
        _withTelemetryChannel(callback, fallback) {
            const connection = this.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel('telemetry', (channel) => callback(channel, connection));
        }
    };
    exports.AbstractRemoteAgentService = AbstractRemoteAgentService;
    exports.AbstractRemoteAgentService = AbstractRemoteAgentService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, productService_1.IProductService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(5, sign_1.ISignService),
        __param(6, log_1.ILogService)
    ], AbstractRemoteAgentService);
    class RemoteAgentConnection extends lifecycle_1.Disposable {
        constructor(remoteAuthority, _commit, _quality, _remoteSocketFactoryService, _remoteAuthorityResolverService, _signService, _logService) {
            super();
            this._commit = _commit;
            this._quality = _quality;
            this._remoteSocketFactoryService = _remoteSocketFactoryService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._signService = _signService;
            this._logService = _logService;
            this._onReconnecting = this._register(new event_1.Emitter());
            this.onReconnecting = this._onReconnecting.event;
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.onDidStateChange = this._onDidStateChange.event;
            this.remoteAuthority = remoteAuthority;
            this._connection = null;
        }
        getChannel(channelName) {
            return (0, ipc_1.getDelayedChannel)(this._getOrCreateConnection().then(c => c.getChannel(channelName)));
        }
        withChannel(channelName, callback) {
            const channel = this.getChannel(channelName);
            const result = callback(channel);
            return result;
        }
        registerChannel(channelName, channel) {
            this._getOrCreateConnection().then(client => client.registerChannel(channelName, channel));
        }
        async getInitialConnectionTimeMs() {
            try {
                await this._getOrCreateConnection();
            }
            catch {
                // ignored -- time is measured even if connection fails
            }
            return this._initialConnectionMs;
        }
        _getOrCreateConnection() {
            if (!this._connection) {
                this._connection = this._createConnection();
            }
            return this._connection;
        }
        async _createConnection() {
            let firstCall = true;
            const options = {
                commit: this._commit,
                quality: this._quality,
                addressProvider: {
                    getAddress: async () => {
                        if (firstCall) {
                            firstCall = false;
                        }
                        else {
                            this._onReconnecting.fire(undefined);
                        }
                        const { authority } = await this._remoteAuthorityResolverService.resolveAuthority(this.remoteAuthority);
                        return { connectTo: authority.connectTo, connectionToken: authority.connectionToken };
                    }
                },
                remoteSocketFactoryService: this._remoteSocketFactoryService,
                signService: this._signService,
                logService: this._logService,
                ipcLogger: false ? new ipc_1.IPCLogger(`Local \u2192 Remote`, `Remote \u2192 Local`) : null
            };
            let connection;
            const start = Date.now();
            try {
                connection = this._register(await (0, remoteAgentConnection_1.connectRemoteAgentManagement)(options, this.remoteAuthority, `renderer`));
            }
            finally {
                this._initialConnectionMs = Date.now() - start;
            }
            connection.protocol.onDidDispose(() => {
                connection.dispose();
            });
            this._register(connection.onDidStateChange(e => this._onDidStateChange.fire(e)));
            return connection.client;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RSZW1vdGVBZ2VudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcmVtb3RlL2NvbW1vbi9hYnN0cmFjdFJlbW90ZUFnZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQWUsMEJBQTBCLEdBQXpDLE1BQWUsMEJBQTJCLFNBQVEsc0JBQVU7UUFPbEUsWUFDK0MsMEJBQXVELEVBQzNELHNCQUErQyxFQUN4QyxtQkFBaUQsRUFDakYsY0FBK0IsRUFDRSwrQkFBZ0UsRUFDcEcsV0FBeUIsRUFDMUIsVUFBdUI7WUFFcEMsS0FBSyxFQUFFLENBQUM7WUFSc0MsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUMzRCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQ3hDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFFaEQsb0NBQStCLEdBQS9CLCtCQUErQixDQUFpQztZQUtsSCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxjQUFjLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLDBCQUEwQixFQUFFLElBQUksQ0FBQywrQkFBK0IsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN2UCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDekIsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcs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