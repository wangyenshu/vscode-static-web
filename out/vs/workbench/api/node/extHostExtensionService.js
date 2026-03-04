/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/performance", "vs/workbench/api/common/extHost.api.impl", "vs/workbench/api/common/extHostRequireInterceptor", "vs/workbench/api/node/proxyResolver", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/node/extHostDownloadService", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/node/extHostCLIServer", "vs/base/node/extpath", "vs/workbench/api/node/extHostConsoleForwarder", "vs/workbench/api/node/extHostDiskFileSystemProvider"], function (require, exports, performance, extHost_api_impl_1, extHostRequireInterceptor_1, proxyResolver_1, extHostExtensionService_1, extHostDownloadService_1, uri_1, network_1, extHostTypes_1, extHostCLIServer_1, extpath_1, extHostConsoleForwarder_1, extHostDiskFileSystemProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostExtensionService = void 0;
    class NodeModuleRequireInterceptor extends extHostRequireInterceptor_1.RequireInterceptor {
        _installInterceptor() {
            const that = this;
            const node_module = globalThis._VSCODE_NODE_MODULES.module;
            const originalLoad = node_module._load;
            node_module._load = function load(request, parent, isMain) {
                request = applyAlternatives(request);
                if (!that._factories.has(request)) {
                    return originalLoad.apply(this, arguments);
                }
                return that._factories.get(request).load(request, uri_1.URI.file((0, extpath_1.realpathSync)(parent.filename)), request => originalLoad.apply(this, [request, parent, isMain]));
            };
            const originalLookup = node_module._resolveLookupPaths;
            node_module._resolveLookupPaths = (request, parent) => {
                return originalLookup.call(this, applyAlternatives(request), parent);
            };
            const applyAlternatives = (request) => {
                for (const alternativeModuleName of that._alternatives) {
                    const alternative = alternativeModuleName(request);
                    if (alternative) {
                        request = alternative;
                        break;
                    }
                }
                return request;
            };
        }
    }
    class ExtHostExtensionService extends extHostExtensionService_1.AbstractExtHostExtensionService {
        constructor() {
            super(...arguments);
            this.extensionRuntime = extHostTypes_1.ExtensionRuntime.Node;
        }
        async _beforeAlmostReadyToRunExtensions() {
            // make sure console.log calls make it to the render
            this._instaService.createInstance(extHostConsoleForwarder_1.ExtHostConsoleForwarder);
            // initialize API and register actors
            const extensionApiFactory = this._instaService.invokeFunction(extHost_api_impl_1.createApiFactoryAndRegisterActors);
            // Register Download command
            this._instaService.createInstance(extHostDownloadService_1.ExtHostDownloadService);
            // Register CLI Server for ipc
            if (this._initData.remote.isRemote && this._initData.remote.authority) {
                const cliServer = this._instaService.createInstance(extHostCLIServer_1.CLIServer);
                process.env['VSCODE_IPC_HOOK_CLI'] = cliServer.ipcHandlePath;
            }
            // Register local file system shortcut
            this._instaService.createInstance(extHostDiskFileSystemProvider_1.ExtHostDiskFileSystemProvider);
            // Module loading tricks
            const interceptor = this._instaService.createInstance(NodeModuleRequireInterceptor, extensionApiFactory, { mine: this._myRegistry, all: this._globalRegistry });
            await interceptor.install();
            performance.mark('code/extHost/didInitAPI');
            // Do this when extension service exists, but extensions are not being activated yet.
            const configProvider = await this._extHostConfiguration.getConfigProvider();
            await (0, proxyResolver_1.connectProxyResolver)(this._extHostWorkspace, configProvider, this, this._logService, this._mainThreadTelemetryProxy, this._initData);
            performance.mark('code/extHost/didInitProxyResolver');
        }
        _getEntryPoint(extensionDescription) {
            return extensionDescription.main;
        }
        async _loadCommonJSModule(extension, module, activationTimesBuilder) {
            if (module.scheme !== network_1.Schemas.file) {
                throw new Error(`Cannot load URI: '${module}', must be of file-scheme`);
            }
            let r = null;
            activationTimesBuilder.codeLoadingStart();
            this._logService.trace(`ExtensionService#loadCommonJSModule ${module.toString(true)}`);
            this._logService.flush();
            const extensionId = extension?.identifier.value;
            if (extension) {
                await this._extHostLocalizationService.initializeLocalizedMessages(extension);
            }
            try {
                if (extensionId) {
                    performance.mark(`code/extHost/willLoadExtensionCode/${extensionId}`);
                }
                r = require.__$__nodeRequire(module.fsPath);
            }
            finally {
                if (extensionId) {
                    performance.mark(`code/extHost/didLoadExtensionCode/${extensionId}`);
                }
                activationTimesBuilder.codeLoadingStop();
            }
            return r;
        }
        async $setRemoteEnvironment(env) {
            if (!this._initData.remote.isRemote) {
                return;
            }
            for (const key in env) {
                const value = env[key];
                if (value === null) {
                    delete process.env[key];
                }
                else {
                    process.env[key] = value;
                }
            }
        }
    }
    exports.ExtHostExtensionService = ExtHostExtensionService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEV4dGVuc2lvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL25vZGUvZXh0SG9zdEV4dGVuc2lvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFNLDRCQUE2QixTQUFRLDhDQUFrQjtRQUVsRCxtQkFBbUI7WUFDNUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLE1BQU0sV0FBVyxHQUFRLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7WUFDaEUsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUN2QyxXQUFXLENBQUMsS0FBSyxHQUFHLFNBQVMsSUFBSSxDQUFDLE9BQWUsRUFBRSxNQUE0QixFQUFFLE1BQWU7Z0JBQy9GLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ25DLE9BQU8sWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzVDLENBQUM7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQyxJQUFJLENBQ3hDLE9BQU8sRUFDUCxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUEsc0JBQVksRUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFDdkMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FDOUQsQ0FBQztZQUNILENBQUMs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