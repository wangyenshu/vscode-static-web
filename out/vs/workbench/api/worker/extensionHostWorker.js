/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/api/common/extensionHostMain", "vs/workbench/services/extensions/worker/polyfillNestedWorker", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/network", "vs/base/common/uri", "vs/workbench/api/common/extHost.common.services", "vs/workbench/api/worker/extHost.worker.services"], function (require, exports, buffer_1, event_1, extensionHostProtocol_1, extensionHostMain_1, polyfillNestedWorker_1, path, performance, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = create;
    const nativeClose = self.close.bind(self);
    self.close = () => console.trace(`'close' has been blocked`);
    const nativePostMessage = postMessage.bind(self);
    self.postMessage = () => console.trace(`'postMessage' has been blocked`);
    function shouldTransformUri(uri) {
        // In principle, we could convert any URI, but we have concerns
        // that parsing https URIs might end up decoding escape characters
        // and result in an unintended transformation
        return /^(file|vscode-remote):/i.test(uri);
    }
    const nativeFetch = fetch.bind(self);
    function patchFetching(asBrowserUri) {
        self.fetch = async function (input, init) {
            if (input instanceof Request) {
                // Request object - massage not supported
                return nativeFetch(input, init);
            }
            if (shouldTransformUri(String(input))) {
                input = (await asBrowserUri(uri_1.URI.parse(String(input)))).toString(true);
            }
            return nativeFetch(input, init);
        };
        self.XMLHttpRequest = class extends XMLHttpRequest {
            open(method, url, async, username, password) {
                (async () => {
                    if (shouldTransformUri(url.toString())) {
                        url = (await asBrowserUri(uri_1.URI.parse(url.toString()))).toString(true);
                    }
                    super.open(method, url, async ?? true, username, password);
                })();
            }
        };
    }
    self.importScripts = () => { throw new Error(`'importScripts' has been blocked`); };
    // const nativeAddEventListener = addEventListener.bind(self);
    self.addEventListener = () => console.trace(`'addEventListener' has been blocked`);
    self['AMDLoader'] = undefined;
    self['NLSLoaderPlugin'] = undefined;
    self['define'] = undefined;
    self['require'] = undefined;
    self['webkitRequestFileSystem'] = undefined;
    self['webkitRequestFileSystemSync'] = undefined;
    self['webkitResolveLocalFileSystemSyncURL'] = undefined;
    self['webkitResolveLocalFileSystemURL'] = undefined;
    if (self.Worker) {
        // make sure new Worker(...) always uses blob: (to maintain current origin)
        const _Worker = self.Worker;
        Worker = function (stringUrl, options) {
            if (/^file:/i.test(stringUrl.toString())) {
                stringUrl = network_1.FileAccess.uriToBrowserUri(uri_1.URI.parse(stringUrl.toString())).toString(true);
            }
            else if (/^vscode-remote:/i.test(stringUrl.toString())) {
                // Supporting transformation of vscode-remote URIs requires an async call to the main thread,
                // but we cannot do this call from within the embedded Worker, and the only way out would be
                // to use templating instead of a function in the web api (`resourceUriProvider`)
                throw new Error(`Creating workers from remote extensions is currently not supported.`);
            }
            // IMPORTANT: bootstrapFn is stringified and injected as worker blob-url. Because of that it CANNOT
            // have dependencies on other functions or variables. Only constant values are supported. Due to
            // that logic of FileAccess.asBrowserUri had to be copied, see `asWorkerBrowserUrl` (below).
            const bootstrapFnSource = (function bootstrapFn(workerUrl) {
                function asWorkerBrowserUrl(url) {
                    if (typeof url === 'string' || url instanceof URL) {
                        return String(url).replace(/^file:\/\//i, 'vscode-file://vscode-app');
                    }
                    return url;
                }
                const nativeFetch = fetch.bind(self);
                self.fetch = function (input, init) {
                    if (input instanceof Request) {
                        // Request object - massage not supported
                        return nativeFetch(input, init);
                    }
                    return nativeFetch(asWorkerBrowserUrl(input), init);
                };
                self.XMLHttpRequest = class extends XMLHttpRequest {
                    open(method, url, async, username, password) {
                        return super.open(method, asWorkerBrowserUrl(url), async ?? true, username, password);
                    }
                };
                const nativeImportScripts = importScripts.bind(self);
                self.importScripts = (...urls) => {
                    nativeImportScripts(...urls.map(asWorkerBrowserUrl));
                };
                nativeImportScripts(workerUrl);
            }).toString();
            const js = `(${bootstrapFnSource}('${stringUrl}'))`;
            options = options || {};
            options.name = `${name} -> ${options.name || path.basename(stringUrl.toString())}`;
            const blob = new Blob([js], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            return new _Worker(blobUrl, options);
        };
    }
    else {
        self.Worker = class extends polyfillNestedWorker_1.NestedWorker {
            constructor(stringOrUrl, options) {
                super(nativePostMessage, stringOrUrl, { name: path.basename(stringOrUrl.toString()), ...options });
            }
        };
    }
    //#endregion ---
    const hostUtil = new class {
        constructor() {
            this.pid = undefined;
        }
        exit(_code) {
            nativeClose();
        }
    };
    class ExtensionWorker {
        constructor() {
            const channel = new MessageChannel();
            const emitter = new event_1.Emitter();
            let terminating = false;
            // send over port2, keep port1
            nativePostMessage(channel.port2, [channel.port2]);
            channel.port1.onmessage = event => {
                const { data } = event;
                if (!(data instanceof ArrayBuffer)) {
                    console.warn('UNKNOWN data received', data);
                    return;
                }
                const msg = buffer_1.VSBuffer.wrap(new Uint8Array(data, 0, data.byteLength));
                if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 2 /* MessageType.Terminate */)) {
                    // handle terminate-message right here
                    terminating = true;
                    onTerminate('received terminate message from renderer');
                    return;
                }
                // emit non-terminate messages to the outside
                emitter.fire(msg);
            };
            this.protocol = {
                onMessage: emitter.event,
                send: vsbuf => {
                    if (!terminating) {
                        const data = vsbuf.buffer.buffer.slice(vsbuf.buffer.byteOffset, vsbuf.buffer.byteOffset + vsbuf.buffer.byteLength);
                        channel.port1.postMessage(data, [data]);
                    }
                }
            };
        }
    }
    function connectToRenderer(protocol) {
        return new Promise(resolve => {
            const once = protocol.onMessage(raw => {
                once.dispose();
                const initData = JSON.parse(raw.toString());
                protocol.send((0, extensionHostProtocol_1.createMessageOfType)(0 /* MessageType.Initialized */));
                resolve({ protocol, initData });
            });
            protocol.send((0, extensionHostProtocol_1.createMessageOfType)(1 /* MessageType.Ready */));
        });
    }
    let onTerminate = (reason) => nativeClose();
    function isInitMessage(a) {
        return !!a && typeof a === 'object' && a.type === 'vscode.init' && a.data instanceof Map;
    }
    function create() {
        performance.mark(`code/extHost/willConnectToRenderer`);
        const res = new ExtensionWorker();
        return {
            onmessage(message) {
                if (!isInitMessage(message)) {
                    return; // silently ignore foreign messages
                }
                connectToRenderer(res.protocol).then(data => {
                    performance.mark(`code/extHost/didWaitForInitData`);
                    const extHostMain = new extensionHostMain_1.ExtensionHostMain(data.protocol, data.initData, hostUtil, null, message.data);
                    patchFetching(uri => extHostMain.asBrowserUri(uri));
                    onTerminate = (reason) => extHostMain.terminate(reason);
                });
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFdvcmtlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvd29ya2VyL2V4dGVuc2lvbkhvc3RXb3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5T2hHLHdCQTBCQztJQS9ORCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUU3RCxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakQsSUFBSSxDQUFDLFdBQVcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFFekUsU0FBUyxrQkFBa0IsQ0FBQyxHQUFXO1FBQ3RDLCtEQUErRDtRQUMvRCxrRUFBa0U7UUFDbEUsNkNBQTZDO1FBQzdDLE9BQU8seUJBQXlCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLFNBQVMsYUFBYSxDQUFDLFlBQXdDO1FBQzlELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxXQUFXLEtBQUssRUFBRSxJQUFJO1lBQ3ZDLElBQUksS0FBSyxZQUFZLE9BQU8sRUFBRSxDQUFDO2dCQUM5Qix5Q0FBeUM7Z0JBQ3pDLE9BQU8sV0FBVyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqQyxDQUFDO1lBQ0QsSUFBSSxrQkFBa0Is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