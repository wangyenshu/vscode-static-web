/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "http", "https", "tls", "net", "vs/base/common/uri", "vs/platform/log/common/log", "@vscode/proxy-agent"], function (require, exports, http, https, tls, net, uri_1, log_1, proxy_agent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connectProxyResolver = connectProxyResolver;
    const systemCertificatesV2Default = false;
    function connectProxyResolver(extHostWorkspace, configProvider, extensionService, extHostLogService, mainThreadTelemetry, initData) {
        const useHostProxy = initData.environment.useHostProxy;
        const doUseHostProxy = typeof useHostProxy === 'boolean' ? useHostProxy : !initData.remote.isRemote;
        const params = {
            resolveProxy: url => extHostWorkspace.resolveProxy(url),
            lookupProxyAuthorization: lookupProxyAuthorization.bind(undefined, extHostLogService, mainThreadTelemetry, configProvider, {}, initData.remote.isRemote),
            getProxyURL: () => configProvider.getConfiguration('http').get('proxy'),
            getProxySupport: () => configProvider.getConfiguration('http').get('proxySupport') || 'off',
            addCertificatesV1: () => certSettingV1(configProvider),
            addCertificatesV2: () => certSettingV2(configProvider),
            log: extHostLogService,
            getLogLevel: () => {
                const level = extHostLogService.getLevel();
                switch (level) {
                    case log_1.LogLevel.Trace: return proxy_agent_1.LogLevel.Trace;
                    case log_1.LogLevel.Debug: return proxy_agent_1.LogLevel.Debug;
                    case log_1.LogLevel.Info: return proxy_agent_1.LogLevel.Info;
                    case log_1.LogLevel.Warning: return proxy_agent_1.LogLevel.Warning;
                    case log_1.LogLevel.Error: return proxy_agent_1.LogLevel.Error;
                    case log_1.LogLevel.Off: return proxy_agent_1.LogLevel.Off;
                    default: return never(level);
                }
                function never(level) {
                    extHostLogService.error('Unknown log level', level);
                    return proxy_agent_1.LogLevel.Debug;
                }
            },
            proxyResolveTelemetry: () => { },
            useHostProxy: doUseHostProxy,
            loadAdditionalCertificates: async () => {
                const promises = [];
                if (initData.remote.isRemote) {
                    promises.push((0, proxy_agent_1.loadSystemCertificates)({ log: extHostLogService }));
                }
                if (doUseHostProxy) {
                    extHostLogService.trace('ProxyResolver#loadAdditionalCertificates: Loading certificates from main process');
                    const certs = extHostWorkspace.loadCertificates(); // Loading from main process to share cache.
                    certs.then(certs => extHostLogService.trace('ProxyResolver#loadAdditionalCertificates: Loaded certificates from main process', certs.length));
                    promises.push(certs);
                }
                return (await Promise.all(promises)).flat();
            },
            env: process.env,
        };
        const resolveProxy = (0, proxy_agent_1.createProxyResolver)(params);
        const lookup = createPatchedModules(params, resolveProxy);
        return configureModuleLoading(extensionService, lookup);
    }
    function createPatchedModules(params, resolveProxy) {
        return {
            http: Object.assign(http, (0, proxy_agent_1.createHttpPatch)(params, http, resolveProxy)),
            https: Object.assign(https, (0, proxy_agent_1.createHttpPatch)(params, https, resolveProxy)),
            net: Object.assign(net, (0, proxy_agent_1.createNetPatch)(params, net)),
            tls: Object.assign(tls, (0, proxy_agent_1.createTlsPatch)(params, tls))
        };
    }
    function certSettingV1(configProvider) {
        const http = configProvider.getConfiguration('http');
        return !http.get('experimental.systemCertificatesV2', systemCertificatesV2Default) && !!http.get('systemCertificates');
    }
    function certSettingV2(configProvider) {
        const http = configProvider.getConfiguration('http');
        return !!http.get('experimental.systemCertificatesV2', systemCertificatesV2Default) && !!http.get('systemCertificates');
    }
    const modulesCache = new Map();
    function configureModuleLoading(extensionService, lookup) {
        return extensionService.getExtensionPathIndex()
            .then(extensionPaths => {
            const node_module = globalThis._VSCODE_NODE_MODULES.module;
            const original = node_module._load;
            node_module._load = function load(request, parent, isMain) {
                if (request === 'net') {
                    return lookup.net;
                }
                if (request === 'tls') {
                    return lookup.tls;
                }
                if (request !== 'http' && request !== 'https') {
                    return original.apply(this, arguments);
                }
                const ext = extensionPaths.findSubstr(uri_1.URI.file(parent.filename));
                let cache = modulesCache.get(ext);
                if (!cache) {
                    modulesCache.set(ext, cache = {});
                }
                if (!cache[request]) {
                    const mod = lookup[request];
                    cache[request] = { ...mod }; // Copy to work around #93167.
                }
                return cache[request];
            };
        });
    }
    async function lookupProxyAuthorization(extHostLogService, mainThreadTelemetry, configProvider, proxyAuthenticateCache, isRemote, proxyURL, proxyAuthenticate, state) {
        const cached = proxyAuthenticateCache[proxyURL];
        if (proxyAuthenticate) {
            proxyAuthenticateCache[proxyURL] = proxyAuthenticate;
        }
        extHostLogService.trace('ProxyResolver#lookupProxyAuthorization callback', `proxyURL:${proxyURL}`, `proxyAuthenticate:${proxyAuthenticate}`, `proxyAuthenticateCache:${cached}`);
        const header = proxyAuthenticate || cached;
        const authenticate = Array.isArray(header) ? header : typeof header === 'string' ? [header] : [];
        sendTelemetry(mainThreadTelemetry, authenticate, isRemote);
        if (authenticate.some(a => /^(Negotiate|Kerberos)( |$)/i.test(a)) && !state.kerberosRequested) {
            try {
                state.kerberosRequested = true;
                const kerberos = await new Promise((resolve_1, reject_1) => { require(['kerberos'], resolve_1, reject_1); });
                const url = new URL(proxyURL);
                const spn = configProvider.getConfiguration('http').get('proxyKerberosServicePrincipal')
                    || (process.platform === 'win32' ? `HTTP/${url.hostname}` : `HTTP@${url.hostname}`);
                extHostLogService.debug('ProxyResolver#lookupProxyAuthorization Kerberos authentication lookup', `proxyURL:${proxyURL}`, `spn:${spn}`);
                const client = await kerberos.initializeClient(spn);
                const response = await client.step('');
                return 'Negotiate ' + response;
            }
            catch (err) {
                extHostLogService.error('ProxyResolver#lookupProxyAuthorization Kerberos authentication failed', err);
            }
        }
        return undefined;
    }
    let telemetrySent = false;
    function sendTelemetry(mainThreadTelemetry, authenticate, isRemote) {
        if (telemetrySent || !authenticate.length) {
            return;
        }
        telemetrySent = true;
        mainThreadTelemetry.$publicLog2('proxyAuthenticationRequest', {
            authenticationType: authenticate.map(a => a.split(' ')[0]).join(','),
            extensionHostType: isRemote ? 'remote' : 'local',
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHlSZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9wcm94eVJlc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyxvREFzREM7SUF4REQsTUFBTSwyQkFBMkIsR0FBRyxLQUFLLENBQUM7SUFFMUMsU0FBZ0Isb0JBQW9CLENBQ25DLGdCQUEyQyxFQUMzQyxjQUFxQyxFQUNyQyxnQkFBeUMsRUFDekMsaUJBQThCLEVBQzlCLG1CQUE2QyxFQUM3QyxRQUFnQztRQUVoQyxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQztRQUN2RCxNQUFNLGNBQWMsR0FBRyxPQUFPLFlBQVksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNwRyxNQUFNLE1BQU0sR0FBcUI7WUFDaEMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQztZQUN2RCx3QkFBd0IsRUFBRSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDeEosV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ3ZFLGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFzQixjQUFjLENB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