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
define(["require", "exports", "url", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/shell/node/shellEnv", "vs/platform/log/common/log", "vs/platform/request/common/request", "vs/platform/request/node/proxy", "zlib"], function (require, exports, url_1, async_1, buffer_1, errors_1, types_1, configuration_1, environment_1, shellEnv_1, log_1, request_1, proxy_1, zlib_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestService = void 0;
    exports.nodeRequest = nodeRequest;
    /**
     * This service exposes the `request` API, while using the global
     * or configured proxy settings.
     */
    let RequestService = class RequestService extends request_1.AbstractRequestService {
        constructor(configurationService, environmentService, logService, loggerService) {
            super(loggerService);
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.logService = logService;
            this.configure();
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('http')) {
                    this.configure();
                }
            }));
        }
        configure() {
            const config = this.configurationService.getValue('http');
            this.proxyUrl = config?.proxy;
            this.strictSSL = !!config?.proxyStrictSSL;
            this.authorization = config?.proxyAuthorization;
        }
        async request(options, token) {
            const { proxyUrl, strictSSL } = this;
            let shellEnv = undefined;
            try {
                shellEnv = await (0, shellEnv_1.getResolvedShellEnv)(this.configurationService, this.logService, this.environmentService.args, process.env);
            }
            catch (error) {
                if (!this.shellEnvErrorLogged) {
                    this.shellEnvErrorLogged = true;
                    this.logService.error(`resolving shell environment failed`, (0, errors_1.getErrorMessage)(error));
                }
            }
            const env = {
                ...process.env,
                ...shellEnv
            };
            const agent = options.agent ? options.agent : await (0, proxy_1.getProxyAgent)(options.url || '', env, { proxyUrl, strictSSL });
            options.agent = agent;
            options.strictSSL = strictSSL;
            if (this.authorization) {
                options.headers = {
                    ...(options.headers || {}),
                    'Proxy-Authorization': this.authorization
                };
            }
            return this.logAndRequest(options.isChromiumNetwork ? 'electron' : 'node', options, () => nodeRequest(options, token));
        }
        async resolveProxy(url) {
            return undefined; // currently not implemented in node
        }
        async loadCertificates() {
            const proxyAgent = await new Promise((resolve_1, reject_1) => { require(['@vscode/proxy-agent'], resolve_1, reject_1); });
            return proxyAgent.loadSystemCertificates({ log: this.logService });
        }
    };
    exports.RequestService = RequestService;
    exports.RequestService = RequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, environment_1.INativeEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, log_1.ILoggerService)
    ], RequestService);
    async function getNodeRequest(options) {
        const endpoint = (0, url_1.parse)(options.url);
        const module = endpoint.protocol === 'https:' ? await new Promise((resolve_2, reject_2) => { require(['https'], resolve_2, reject_2); }) : await new Promise((resolve_3, reject_3) => { require(['http'], resolve_3, reject_3); });
        return module.request;
    }
    async function nodeRequest(options, token) {
        return async_1.Promises.withAsyncBody(async (resolve, reject) => {
            const endpoint = (0, url_1.parse)(options.url);
            const rawRequest = options.getRawRequest
                ? options.getRawRequest(options)
                : await getNodeRequest(options);
            const opts = {
                hostname: endpoint.hostname,
                port: endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80),
                protocol: endpoint.protocol,
                path: endpoint.path,
                method: options.type || 'GET',
                headers: options.headers,
                agent: options.agent,
                rejectUnauthorized: (0, types_1.isBoolean)(options.strictSSL) ? options.strictSSL : true
            };
            if (options.user && options.password) {
                opts.auth = options.user + ':' + options.password;
            }
            const req = rawRequest(opts, (res) => {
                const followRedirects = (0, types_1.isNumber)(options.followRedirects) ? options.followRedirects : 3;
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && followRedirects > 0 && res.headers['location']) {
                    nodeRequest({
                        ...options,
                        url: res.headers['location'],
                        followRedirects: followRedirects - 1
                    }, token).then(resolve, reject);
                }
                else {
                    let stream = res;
                    // Responses from Electron net module should be treated as response
                    // from browser, which will apply gzip filter and decompress the response
                    // using zlib before passing the result to us. Following step can be bypassed
                    // in this case and proceed further.
                    // Refs https://source.chromium.org/chromium/chromium/src/+/main:net/url_request/url_request_http_job.cc;l=1266-1318
                    if (!options.isChromiumNetwork && res.headers['content-encoding'] === 'gzip') {
                        stream = res.pipe((0, zlib_1.createGunzip)());
                    }
                    resolve({ res, stream: (0, buffer_1.streamToBufferReadableStream)(stream) });
                }
            });
            req.on('error', reject);
            if (options.timeout) {
                req.setTimeout(options.timeout);
            }
            // Chromium will abort the request if forbidden headers are set.
            // Ref https://source.chromium.org/chromium/chromium/src/+/main:services/network/public/cpp/header_util.cc;l=14-48;
            // for additional context.
            if (options.isChromiumNetwork) {
                req.removeHeader('Content-Length');
            }
            if (options.data) {
                if (typeof options.data === 'string') {
                    req.write(options.data);
                }
            }
            req.end();
            token.onCancellationRequested(() => {
                req.abort();
                reject(new errors_1.CancellationError());
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZXF1ZXN0L25vZGUvcmVxdWVzdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEhoRyxrQ0F5RUM7SUE5SkQ7OztPQUdHO0lBQ0ksSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLGdDQUFzQjtRQVN6RCxZQUN5QyxvQkFBMkMsRUFDdkMsa0JBQTZDLEVBQzNELFVBQXVCLEVBQ3JDLGFBQTZCO1lBRTdDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUxtQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3ZDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBMkI7WUFDM0QsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUlyRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDcEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNsQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxTQUFTO1lBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQWlDLE1BQU0sQ0FBQyxDQUFDO1lBRTFGLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxFQUFFLEtBQUssQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDO1lBQzFDLElBQUksQ0FBQyxhQUFh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