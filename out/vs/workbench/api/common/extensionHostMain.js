/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/performance", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/rpcProtocol", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/api/common/extHostInitDataService", "vs/platform/instantiation/common/instantiationService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostTelemetry"], function (require, exports, errors, performance, uri_1, extHost_protocol_1, rpcProtocol_1, log_1, extensions_1, serviceCollection_1, extHostInitDataService_1, instantiationService_1, extHostRpcService_1, extHostUriTransformerService_1, extHostExtensionService_1, extHostTelemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostMain = exports.ErrorHandler = void 0;
    class ErrorHandler {
        static async installEarlyHandler(accessor) {
            // increase number of stack frames (from 10, https://github.com/v8/v8/wiki/Stack-Trace-API)
            Error.stackTraceLimit = 100;
            // does NOT dependent of extension information, can be installed immediately, and simply forwards
            // to the log service and main thread errors
            const logService = accessor.get(log_1.ILogService);
            const rpcService = accessor.get(extHostRpcService_1.IExtHostRpcService);
            const mainThreadErrors = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadErrors);
            errors.setUnexpectedErrorHandler(err => {
                logService.error(err);
                const data = errors.transformErrorForSerialization(err);
                mainThreadErrors.$onUnexpectedError(data);
            });
        }
        static async installFullHandler(accessor) {
            // uses extension knowledges to correlate errors with extensions
            const logService = accessor.get(log_1.ILogService);
            const rpcService = accessor.get(extHostRpcService_1.IExtHostRpcService);
            const extensionService = accessor.get(extHostExtensionService_1.IExtHostExtensionService);
            const extensionTelemetry = accessor.get(extHostTelemetry_1.IExtHostTelemetry);
            const mainThreadExtensions = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            const mainThreadErrors = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadErrors);
            const map = await extensionService.getExtensionPathIndex();
            const extensionErrors = new WeakMap();
            // PART 1
            // set the prepareStackTrace-handle and use it as a side-effect to associate errors
            // with extensions - this works by looking up callsites in the extension path index
            function prepareStackTraceAndFindExtension(error, stackTrace) {
                if (extensionErrors.has(error)) {
                    return extensionErrors.get(error).stack;
                }
                let stackTraceMessage = '';
                let extension;
                let fileName;
                for (const call of stackTrace) {
                    stackTraceMessage += `\n\tat ${call.toString()}`;
                    fileName = call.getFileName();
                    if (!extension && fileName) {
                        extension = map.findSubstr(uri_1.URI.file(fileName));
                    }
                }
                const result = `${error.name || 'Error'}: ${error.message || ''}${stackTraceMessage}`;
                extensionErrors.set(error, { extensionIdentifier: extension?.identifier, stack: result });
                return result;
            }
            const _wasWrapped = Symbol('prepareStackTrace wrapped');
            let _prepareStackTrace = prepareStackTraceAndFindExtension;
            Object.defineProperty(Error, 'prepareStackTrace', {
                configurable: false,
                get() {
                    return _prepareStackTrace;
                },
                set(v) {
                    if (v === prepareStackTraceAndFindExtension || !v || v[_wasWrapped]) {
                        _prepareStackTrace = v || prepareStackTraceAndFindExtension;
                        return;
                    }
                    _prepareStackTrace = function (error, stackTrace) {
                        prepareStackTraceAndFindExtension(error, stackTrace);
                        return v.call(Error, error, stackTrace);
                    };
                    Object.assign(_prepareStackTrace, { [_wasWrapped]: true });
                },
            });
            // PART 2
            // set the unexpectedErrorHandler and check for extensions that have been identified as
            // having caused the error. Note that the runtime order is actually reversed, the code
            // below accesses the stack-property which triggers the code above
            errors.setUnexpectedErrorHandler(err => {
                logService.error(err);
                const errorData = errors.transformErrorForSerialization(err);
                const stackData = extensionErrors.get(err);
                if (!stackData?.extensionIdentifier) {
                    mainThreadErrors.$onUnexpectedError(errorData);
                    return;
                }
                mainThreadExtensions.$onExtensionRuntimeError(stackData.extensionIdentifier, errorData);
                const reported = extensionTelemetry.onExtensionError(stackData.extensionIdentifier, err);
                logService.trace('forwarded error to extension?', reported, stackData);
            });
        }
    }
    exports.ErrorHandler = ErrorHandler;
    class ExtensionHostMain {
        constructor(protocol, initData, hostUtils, uriTransformer, messagePorts) {
            this._hostUtils = hostUtils;
            this._rpcProtocol = new rpcProtocol_1.RPCProtocol(protocol, null, uriTransformer);
            // ensure URIs are transformed and revived
            initData = ExtensionHostMain._transform(initData, this._rpcProtocol);
            // bootstrap services
            const services = new serviceCollection_1.ServiceCollection(...(0, extensions_1.getSingletonServiceDescriptors)());
            services.set(extHostInitDataService_1.IExtHostInitDataService, { _serviceBrand: undefined, ...initData, messagePorts });
            services.set(extHostRpcService_1.IExtHostRpcService, new extHostRpcService_1.ExtHostRpcService(this._rpcProtocol));
            services.set(extHostUriTransformerService_1.IURITransformerService, new extHostUriTransformerService_1.URITransformerService(uriTransformer));
            services.set(extHostExtensionService_1.IHostUtils, hostUtils);
            const instaService = new instantiationService_1.InstantiationService(services, true);
            instaService.invokeFunction(ErrorHandler.installEarlyHandler);
            // ugly self - inject
            this._logService = instaService.invokeFunction(accessor => accessor.get(log_1.ILogService));
            performance.mark(`code/extHost/didCreateServices`);
            if (this._hostUtils.pid) {
                this._logService.info(`Extension host with pid ${this._hostUtils.pid} started`);
            }
            else {
                this._logService.info(`Extension host started`);
            }
            this._logService.trace('initData', initData);
            // ugly self - inject
            // must call initialize *after* creating the extension service
            // because `initialize` itself creates instances that depend on it
            this._extensionService = instaService.invokeFunction(accessor => accessor.get(extHostExtensionService_1.IExtHostExtensionService));
            this._extensionService.initialize();
            // install error handler that is extension-aware
            instaService.invokeFunction(ErrorHandler.installFullHandler);
        }
        async asBrowserUri(uri) {
            const mainThreadExtensionsProxy = this._rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            return uri_1.URI.revive(await mainThreadExtensionsProxy.$asBrowserUri(uri));
        }
        terminate(reason) {
            this._extensionService.terminate(reason);
        }
        static _transform(initData, rpcProtocol) {
            initData.extensions.allExtensions.forEach((ext) => {
                ext.extensionLocation = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(ext.extensionLocation));
            });
            initData.environment.appRoot = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.appRoot));
            const extDevLocs = initData.environment.extensionDevelopmentLocationURI;
            if (extDevLocs) {
                initData.environment.extensionDevelopmentLocationURI = extDevLocs.map(url => uri_1.URI.revive(rpcProtocol.transformIncomingURIs(url)));
            }
            initData.environment.extensionTestsLocationURI = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.extensionTestsLocationURI));
            initData.environment.globalStorageHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.globalStorageHome));
            initData.environment.workspaceStorageHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.workspaceStorageHome));
            initData.environment.extensionTelemetryLogResource = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.extensionTelemetryLogResource));
            initData.nlsBaseUrl = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.nlsBaseUrl));
            initData.logsLocation = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.logsLocation));
            initData.workspace = rpcProtocol.transformIncomingURIs(initData.workspace);
            return initData;
        }
    }
    exports.ExtensionHostMain = ExtensionHostMain;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdE1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRlbnNpb25Ib3N0TWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErQmhHLE1BQXNCLFlBQVk7UUFFakMsTUFBTSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxRQUEwQjtZQUUxRCwyRkFBMkY7WUFDM0YsS0FBSyxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUM7WUFFNUIsaUdBQWlHO1lBQ2pHLDRDQUE0QztZQUM1QyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGlCQUFXLENBQUMsQ0FBQztZQUM3QyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHNDQUFrQixDQUFDLENBQUM7WUFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUUzRSxNQUFNLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3RDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEQsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUEwQjtZQUN6RCxnRUFBZ0U7WUFFaEUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxDQUFDLENBQUM7WUFDN0MsTUFBTSxVQUFVLEdBQUcsUUFB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