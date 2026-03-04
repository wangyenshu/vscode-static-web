/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/performance", "vs/base/common/uri", "vs/workbench/api/node/uriTransformer", "vs/base/common/uriIpc", "vs/base/node/ps", "vs/platform/diagnostics/node/diagnosticsService", "vs/base/common/path", "vs/base/common/resources"], function (require, exports, platform, performance, uri_1, uriTransformer_1, uriIpc_1, ps_1, diagnosticsService_1, path_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentEnvironmentChannel = void 0;
    class RemoteAgentEnvironmentChannel {
        static { this._namePool = 1; }
        constructor(_connectionToken, _environmentService, _userDataProfilesService, _extensionHostStatusService) {
            this._connectionToken = _connectionToken;
            this._environmentService = _environmentService;
            this._userDataProfilesService = _userDataProfilesService;
            this._extensionHostStatusService = _extensionHostStatusService;
        }
        async call(_, command, arg) {
            switch (command) {
                case 'getEnvironmentData': {
                    const args = arg;
                    const uriTransformer = (0, uriTransformer_1.createURITransformer)(args.remoteAuthority);
                    let environmentData = await this._getEnvironmentData(args.profile);
                    environmentData = (0, uriIpc_1.transformOutgoingURIs)(environmentData, uriTransformer);
                    return environmentData;
                }
                case 'getExtensionHostExitInfo': {
                    const args = arg;
                    return this._extensionHostStatusService.getExitInfo(args.reconnectionToken);
                }
                case 'getDiagnosticInfo': {
                    const options = arg;
                    const diagnosticInfo = {
                        machineInfo: (0, diagnosticsService_1.getMachineInfo)()
                    };
                    const processesPromise = options.includeProcesses ? (0, ps_1.listProcesses)(process.pid) : Promise.resolve();
                    let workspaceMetadataPromises = [];
                    const workspaceMetadata = {};
                    if (options.folders) {
                        // only incoming paths are transformed, so remote authority is unneeded.
                        const uriTransformer = (0, uriTransformer_1.createURITransformer)('');
                        const folderPaths = options.folders
                            .map(folder => uri_1.URI.revive(uriTransformer.transformIncoming(folder)))
                            .filter(uri => uri.scheme === 'file');
                        workspaceMetadataPromises = folderPaths.map(folder => {
                            return (0, diagnosticsService_1.collectWorkspaceStats)(folder.fsPath, ['node_modules', '.git'])
                                .then(stats => {
                                workspaceMetadata[(0, path_1.basename)(folder.fsPath)] = stats;
                            });
                        });
                    }
                    return Promise.all([processesPromise, ...workspaceMetadataPromises]).then(([processes, _]) => {
                        diagnosticInfo.processes = processes || undefined;
                        diagnosticInfo.workspaceMetadata = options.folders ? workspaceMetadata : undefined;
                        return diagnosticInfo;
                    });
                }
            }
            throw new Error(`IPC Command ${command} not found`);
        }
        listen(_, event, arg) {
            throw new Error('Not supported');
        }
        async _getEnvironmentData(profile) {
            if (profile && !this._userDataProfilesService.profiles.some(p => p.id === profile)) {
                await this._userDataProfilesService.createProfile(profile, profile);
            }
            let isUnsupportedGlibc = false;
            if (process.platform === 'linux') {
                const glibcVersion = process.glibcVersion;
                const minorVersion = glibcVersion ? parseInt(glibcVersion.split('.')[1]) : 28;
                isUnsupportedGlibc = (minorVersion <= 27);
            }
            return {
                pid: process.pid,
                connectionToken: (this._connectionToken.type !== 0 /* ServerConnectionTokenType.None */ ? this._connectionToken.value : ''),
                appRoot: uri_1.URI.file(this._environmentService.appRoot),
                settingsPath: this._environmentService.machineSettingsResource,
                logsPath: this._environmentService.logsHome,
                extensionHostLogsPath: (0, resources_1.joinPath)(this._environmentService.logsHome, `exthost${RemoteAgentEnvironmentChannel._namePool++}`),
                globalStorageHome: this._userDataProfilesService.defaultProfile.globalStorageHome,
                workspaceStorageHome: this._environmentService.workspaceStorageHome,
                localHistoryHome: this._environmentService.localHistoryHome,
                userHome: this._environmentService.userHome,
                os: platform.OS,
                arch: process.arch,
                marks: performance.getMarks(),
                useHostProxy: !!this._environmentService.args['use-host-proxy'],
                profiles: {
                    home: this._userDataProfilesService.profilesHome,
                    all: [...this._userDataProfilesService.profiles].map(profile => ({ ...profile }))
                },
                isUnsupportedGlibc
            };
        }
    }
    exports.RemoteAgentEnvironmentChannel = RemoteAgentEnvironmentChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRFbnZpcm9ubWVudEltcGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9yZW1vdGVBZ2VudEVudmlyb25tZW50SW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxQmhHLE1BQWEsNkJBQTZCO2lCQUUxQixjQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRTdCLFlBQ2tCLGdCQUF1QyxFQUN2QyxtQkFBOEMsRUFDOUMsd0JBQWtELEVBQ2xELDJCQUF3RDtZQUh4RCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQXVCO1lBQ3ZDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBMkI7WUFDOUMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUNsRCxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1FBRTFFLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQU0sRUFBRSxPQUFlLEVBQUUsR0FBUztZQUM1QyxRQUFRLE9BQU8sRUFBRSxDQUFDO2dCQUVqQixLQUFLLG9CQUFvQixDQUFDLENBQUMsQ0FBQztvQkFDM0IsTUFBTSxJQUFJLEdBQWlDLEdBQUcsQ0FBQztvQkFDL0MsTUFBTSxjQUFjLEdBQUcsSUFBQSxxQ0FBb0IsRUFBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBRWxFLElBQUksZUFBZSxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDbkUsZUFBZSxHQUFHLElBQUEsOEJBQXFCLEVBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDO29CQUV6RSxPQUFPLGVBQWUsQ0FBQztnQkFDeEIsQ0FBQztnQkFFRCxLQUFLLDBCQUEwQixDQUFDLENBQUMsQ0FBQztvQkFDakMsTUFBTSxJQUFJLEdBQXVD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