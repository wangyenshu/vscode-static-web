/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/registry/common/platform"], function (require, exports, buffer_1, errors_1, lifecycle_1, nls_1, configurationRegistry_1, instantiation_1, log_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractRequestService = exports.IRequestService = void 0;
    exports.isSuccess = isSuccess;
    exports.hasNoContent = hasNoContent;
    exports.asText = asText;
    exports.asTextOrError = asTextOrError;
    exports.asJson = asJson;
    exports.updateProxyConfigurationsScope = updateProxyConfigurationsScope;
    exports.IRequestService = (0, instantiation_1.createDecorator)('requestService');
    class LoggableHeaders {
        constructor(original) {
            this.original = original;
        }
        toJSON() {
            if (!this.headers) {
                const headers = Object.create(null);
                for (const key in this.original) {
                    if (key.toLowerCase() === 'authorization' || key.toLowerCase() === 'proxy-authorization') {
                        headers[key] = '*****';
                    }
                    else {
                        headers[key] = this.original[key];
                    }
                }
                this.headers = headers;
            }
            return this.headers;
        }
    }
    class AbstractRequestService extends lifecycle_1.Disposable {
        constructor(loggerService) {
            super();
            this.counter = 0;
            this.logger = loggerService.createLogger('network', {
                name: (0, nls_1.localize)('request', "Network Requests"),
                when: log_1.CONTEXT_LOG_LEVEL.isEqualTo((0, log_1.LogLevelToString)(log_1.LogLevel.Trace)).serialize()
            });
        }
        async logAndRequest(stack, options, request) {
            const prefix = `${stack} #${++this.counter}: ${options.url}`;
            this.logger.trace(`${prefix} - begin`, options.type, new LoggableHeaders(options.headers ?? {}));
            try {
                const result = await request();
                this.logger.trace(`${prefix} - end`, options.type, result.res.statusCode, result.res.headers);
                return result;
            }
            catch (error) {
                this.logger.error(`${prefix} - error`, options.type, (0, errors_1.getErrorMessage)(error));
                throw error;
            }
        }
    }
    exports.AbstractRequestService = AbstractRequestService;
    function isSuccess(context) {
        return (context.res.statusCode && context.res.statusCode >= 200 && context.res.statusCode < 300) || context.res.statusCode === 1223;
    }
    function hasNoContent(context) {
        return context.res.statusCode === 204;
    }
    async function asText(context) {
        if (hasNoContent(context)) {
            return null;
        }
        const buffer = await (0, buffer_1.streamToBuffer)(context.stream);
        return buffer.toString();
    }
    async function asTextOrError(context) {
        if (!isSuccess(context)) {
            throw new Error('Server returned ' + context.res.statusCode);
        }
        return asText(context);
    }
    async function asJson(context) {
        if (!isSuccess(context)) {
            throw new Error('Server returned ' + context.res.statusCode);
        }
        if (hasNoContent(context)) {
            return null;
        }
        const buffer = await (0, buffer_1.streamToBuffer)(context.stream);
        const str = buffer.toString();
        try {
            return JSON.parse(str);
        }
        catch (err) {
            err.message += ':\n' + str;
            throw err;
        }
    }
    function updateProxyConfigurationsScope(scope) {
        registerProxyConfigurations(scope);
    }
    let proxyConfiguration;
    function registerProxyConfigurations(scope) {
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const oldProxyConfiguration = proxyConfiguration;
        proxyConfiguration = {
            id: 'http',
            order: 15,
            title: (0, nls_1.localize)('httpConfigurationTitle', "HTTP"),
            type: 'object',
            scope,
            properties: {
                'http.proxy': {
                    type: 'string',
                    pattern: '^(https?|socks|socks4a?|socks5h?)://([^:]*(:[^@]*)?@)?([^:]+|\\[[:0-9a-fA-F]+\\])(:\\d+)?/?$|^$',
                    markdownDescription: (0, nls_1.localize)('proxy', "The proxy setting to use. If not set, will be inherited from the `http_proxy` and `https_proxy` environment variables."),
                    restricted: true
                },
                'http.proxyStrictSSL': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('strictSSL', "Controls whether the proxy server certificate should be verified against the list of supplied CAs."),
                    restricted: true
                },
                'http.proxyKerberosServicePrincipal': {
                    type: 'string',
                    markdownDescription: (0, nls_1.localize)('proxyKerberosServicePrincipal', "Overrides the principal service name for Kerberos authentication with the HTTP proxy. A default based on the proxy hostname is used when this is not set."),
                    restricted: true
                },
                'http.proxyAuthorization': {
                    type: ['null', 'string'],
                    default: null,
                    markdownDescription: (0, nls_1.localize)('proxyAuthorization', "The value to send as the `Proxy-Authorization` header for every network request."),
                    restricted: true
                },
                'http.proxySupport': {
                    type: 'string',
                    enum: ['off', 'on', 'fallback', 'override'],
                    enumDescriptions: [
                        (0, nls_1.localize)('proxySupportOff', "Disable proxy support for extensions."),
                        (0, nls_1.localize)('proxySupportOn', "Enable proxy support for extensions."),
                        (0, nls_1.localize)('proxySupportFallback', "Enable proxy support for extensions, fall back to request options, when no proxy found."),
                        (0, nls_1.localize)('proxySupportOverride', "Enable proxy support for extensions, override request options."),
                    ],
                    default: 'override',
                    description: (0, nls_1.localize)('proxySupport', "Use the proxy support for extensions."),
                    restricted: true
                },
                'http.systemCertificates': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('systemCertificates', "Controls whether CA certificates should be loaded from the OS. (On Windows and macOS, a reload of the window is required after turning this off.)"),
                    restricted: true
                },
                'http.experimental.systemCertificatesV2': {
                    type: 'boolean',
                    tags: ['experimental'],
                    default: false,
                    description: (0, nls_1.localize)('systemCertificatesV2', "Controls whether experimental loading of CA certificates from the OS should be enabled. This uses a more general approach than the default implemenation."),
                    restricted: true
                }
            }
        };
        configurationRegistry.updateConfigurations({ add: [proxyConfiguration], remove: oldProxyConfiguration ? [oldProxyConfiguration] : [] });
    }
    registerProxyConfigurations(1 /* ConfigurationScope.APPLICATION */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlcXVlc3QvY29tbW9uL3JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0ZoRyw4QkFFQztJQUVELG9DQUVDO0lBRUQsd0JBTUM7SUFFRCxzQ0FLQztJQUVELHdCQWVDO0lBRUQsd0VBRUM7SUEvR1ksUUFBQSxlQUFlLEdBQUcsSUFBQSwrQkFBZSxFQUFrQixnQkFBZ0IsQ0FBQyxDQUFDO0lBV2xGLE1BQU0sZUFBZTtRQUlwQixZQUE2QixRQUFrQjtZQUFsQixhQUFRLEdBQVIsUUFBUSxDQUFVO1FBQUksQ0FBQztRQUVwRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2pDLElBQUksR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLGVBQWUsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUsscUJBQXFCLEVBQUUsQ0FBQzt3QkFDMUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQztvQkFDeEIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNuQyxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDeEIsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO0tBRUQ7SUFFRCxNQUFz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