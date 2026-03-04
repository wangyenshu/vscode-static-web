/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "vs/platform/debug/common/extensionHostDebugIpc", "vs/platform/environment/node/argv"], function (require, exports, net_1, extensionHostDebugIpc_1, argv_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronExtensionHostDebugBroadcastChannel = void 0;
    class ElectronExtensionHostDebugBroadcastChannel extends extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel {
        constructor(windowsMainService) {
            super();
            this.windowsMainService = windowsMainService;
        }
        call(ctx, command, arg) {
            if (command === 'openExtensionDevelopmentHostWindow') {
                return this.openExtensionDevelopmentHostWindow(arg[0], arg[1]);
            }
            else {
                return super.call(ctx, command, arg);
            }
        }
        async openExtensionDevelopmentHostWindow(args, debugRenderer) {
            const pargs = (0, argv_1.parseArgs)(args, argv_1.OPTIONS);
            pargs.debugRenderer = debugRenderer;
            const extDevPaths = pargs.extensionDevelopmentPath;
            if (!extDevPaths) {
                return { success: false };
            }
            const [codeWindow] = await this.windowsMainService.openExtensionDevelopmentHostWindow(extDevPaths, {
                context: 5 /* OpenContext.API */,
                cli: pargs,
                forceProfile: pargs.profile,
                forceTempProfile: pargs['profile-temp']
            });
            if (!debugRenderer) {
                return { success: true };
            }
            const win = codeWindow.win;
            if (!win) {
                return { success: true };
            }
            const debug = win.webContents.debugger;
            let listeners = debug.isAttached() ? Infinity : 0;
            const server = (0, net_1.createServer)(listener => {
                if (listeners++ === 0) {
                    debug.attach();
                }
                let closed = false;
                const writeMessage = (message) => {
                    if (!closed) { // in case sendCommand promises settle after closed
                        listener.write(JSON.stringify(message) + '\0'); // null-delimited, CDP-compatible
                    }
                };
                const onMessage = (_event, method, params, sessionId) => writeMessage(({ method, params, sessionId }));
                win.on('close', () => {
                    debug.removeListener('message', onMessage);
                    listener.end();
                    closed = true;
                });
                debug.addListener('message', onMessage);
                let buf = Buffer.alloc(0);
                listener.on('data', data => {
                    buf = Buffer.concat([buf, data]);
                    for (let delimiter = buf.indexOf(0); delimiter !== -1; delimiter = buf.indexOf(0)) {
                        let data;
                        try {
                            const contents = buf.slice(0, delimiter).toString('utf8');
                            buf = buf.slice(delimiter + 1);
                            data = JSON.parse(contents);
                        }
                        catch (e) {
                            console.error('error reading cdp line', e);
                        }
                        // depends on a new API for which electron.d.ts has not been updated:
                        // @ts-ignore
                        debug.sendCommand(data.method, data.params, data.sessionId)
                            .then((result) => writeMessage({ id: data.id, sessionId: data.sessionId, result }))
                            .catch((error) => writeMessage({ id: data.id, sessionId: data.sessionId, error: { code: 0, message: error.message } }));
                    }
                });
                listener.on('error', err => {
                    console.error('error on cdp pipe:', err);
                });
                listener.on('close', () => {
                    closed = true;
                    if (--listeners === 0) {
                        debug.detach();
                    }
                });
            });
            await new Promise(r => server.listen(0, r));
            win.on('close', () => server.close());
            return { rendererDebugPort: server.address().port, success: true };
        }
    }
    exports.ElectronExtensionHostDebugBroadcastChannel = ElectronExtensionHostDebugBroadcastChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdERlYnVnSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZGVidWcvZWxlY3Ryb24tbWFpbi9leHRlbnNpb25Ib3N0RGVidWdJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsMENBQXFELFNBQVEsMERBQTRDO1FBRXJILFlBQ1Msa0JBQXVDO1lBRS9DLEtBQUssRUFBRSxDQUFDO1lBRkEsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtRQUdoRCxDQUFDO1FBRVEsSUFBSSxDQUFDLEdBQWEsRUFBRSxPQUFlLEVBQUUsR0FBUztZQUN0RCxJQUFJLE9BQU8sS0FBSyxvQ0FBb0MsRUFBRSxDQUFDO2dCQUN0RCxPQUFPLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLGtDQUFrQyxDQUFDLElBQWMsRUFBRSxhQUFzQjtZQUN0RixNQUFNLEtBQUssR0FBRyxJQUFBLGdCQUFTLEVBQUMsSUFBSSxFQUFFLGNBQU8sQ0FBQyxDQUFDO1lBQ3ZDLEtBQUssQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBRXBDLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQztZQUNuRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFDM0IsQ0FBQztZQUVELE1BQU0s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