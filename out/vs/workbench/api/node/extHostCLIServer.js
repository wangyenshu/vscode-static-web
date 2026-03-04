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
define(["require", "exports", "vs/base/parts/ipc/node/ipc.net", "http", "fs", "vs/workbench/api/common/extHostCommands", "vs/base/common/uri", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace"], function (require, exports, ipc_net_1, http, fs, extHostCommands_1, uri_1, log_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CLIServer = exports.CLIServerBase = void 0;
    class CLIServerBase {
        constructor(_commands, logService, _ipcHandlePath) {
            this._commands = _commands;
            this.logService = logService;
            this._ipcHandlePath = _ipcHandlePath;
            this._server = http.createServer((req, res) => this.onRequest(req, res));
            this.setup().catch(err => {
                logService.error(err);
                return '';
            });
        }
        get ipcHandlePath() {
            return this._ipcHandlePath;
        }
        async setup() {
            try {
                this._server.listen(this.ipcHandlePath);
                this._server.on('error', err => this.logService.error(err));
            }
            catch (err) {
                this.logService.error('Could not start open from terminal server.');
            }
            return this._ipcHandlePath;
        }
        onRequest(req, res) {
            const sendResponse = (statusCode, returnObj) => {
                res.writeHead(statusCode, { 'content-type': 'application/json' });
                res.end(JSON.stringify(returnObj || null), (err) => err && this.logService.error(err)); // CodeQL [SM01524] Only the message portion of errors are passed in.
            };
            const chunks = [];
            req.setEncoding('utf8');
            req.on('data', (d) => chunks.push(d));
            req.on('end', async () => {
                try {
                    const data = JSON.parse(chunks.join(''));
                    let returnObj;
                    switch (data.type) {
                        case 'open':
                            returnObj = await this.open(data);
                            break;
                        case 'openExternal':
                            returnObj = await this.openExternal(data);
                            break;
                        case 'status':
                            returnObj = await this.getStatus(data);
                            break;
                        case 'extensionManagement':
                            returnObj = await this.manageExtensions(data);
                            break;
                        default:
                            sendResponse(404, `Unknown message type: ${data.type}`);
                            break;
                    }
                    sendResponse(200, returnObj);
                }
                catch (e) {
                    const message = e instanceof Error ? e.message : JSON.stringify(e);
                    sendResponse(500, message);
                    this.logService.error('Error while processing pipe request', e);
                }
            });
        }
        async open(data) {
            const { fileURIs, folderURIs, forceNewWindow, diffMode, mergeMode, addMode, forceReuseWindow, gotoLineMode, waitMarkerFilePath, remoteAuthority } = data;
            const urisToOpen = [];
            if (Array.isArray(folderURIs)) {
                for (const s of folderURIs) {
                    try {
                        urisToOpen.push({ folderUri: uri_1.URI.parse(s) });
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
            if (Array.isArray(fileURIs)) {
                for (const s of fileURIs) {
                    try {
                        if ((0, workspace_1.hasWorkspaceFileExtension)(s)) {
                            urisToOpen.push({ workspaceUri: uri_1.URI.parse(s) });
                        }
                        else {
                            urisToOpen.push({ fileUri: uri_1.URI.parse(s) });
                        }
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
            const waitMarkerFileURI = waitMarkerFilePath ? uri_1.URI.file(waitMarkerFilePath) : undefined;
            const preferNewWindow = !forceReuseWindow && !waitMarkerFileURI && !addMode;
            const windowOpenArgs = { forceNewWindow, diffMode, mergeMode, addMode, gotoLineMode, forceReuseWindow, preferNewWindow, waitMarkerFileURI, remoteAuthority };
            this._commands.executeCommand('_remoteCLI.windowOpen', urisToOpen, windowOpenArgs);
        }
        async openExternal(data) {
            for (const uriString of data.uris) {
                const uri = uri_1.URI.parse(uriString);
                const urioOpen = uri.scheme === 'file' ? uri : uriString; // workaround for #112577
                await this._commands.executeCommand('_remoteCLI.openExternal', urioOpen);
            }
        }
        async manageExtensions(data) {
            const toExtOrVSIX = (inputs) => inputs?.map(input => /\.vsix$/i.test(input) ? uri_1.URI.parse(input) : input);
            const commandArgs = {
                list: data.list,
                install: toExtOrVSIX(data.install),
                uninstall: toExtOrVSIX(data.uninstall),
                force: data.force
            };
            return await this._commands.executeCommand('_remoteCLI.manageExtensions', commandArgs);
        }
        async getStatus(data) {
            return await this._commands.executeCommand('_remoteCLI.getSystemStatus');
        }
        dispose() {
            this._server.close();
            if (this._ipcHandlePath && process.platform !== 'win32' && fs.existsSync(this._ipcHandlePath)) {
                fs.unlinkSync(this._ipcHandlePath);
            }
        }
    }
    exports.CLIServerBase = CLIServerBase;
    let CLIServer = class CLIServer extends CLIServerBase {
        constructor(commands, logService) {
            super(commands, logService, (0, ipc_net_1.createRandomIPCHandle)());
        }
    };
    exports.CLIServer = CLIServer;
    exports.CLIServer = CLIServer = __decorate([
        __param(0, extHostCommands_1.IExtHostCommands),
        __param(1, log_1.ILogService)
    ], CLIServer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENMSVNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0Q0xJU2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdEaEcsTUFBYSxhQUFhO1FBR3pCLFlBQ2tCLFNBQTRCLEVBQzVCLFVBQXVCLEVBQ3ZCLGNBQXNCO1lBRnRCLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBQzVCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdkIsbUJBQWMsR0FBZCxjQUFjLENBQVE7WUFFdkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN4QixVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQVcsYUFBYTtZQUN2QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQUVPLEtBQUssQ0FBQyxLQUFLO1lBQ2xCLElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0QsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUNyRSxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQzVCLENBQUM7UUFFTyxTQUFTLENBQUMsR0FBeUIsRUFBRSxHQUF3QjtZQUNwRSxNQUFNLFlBQVksR0FBRyxDQUFDLFVBQWtCLEVBQUUsU0FBNkIsRUFBRSxFQUFFO2dCQUMxRSxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFTLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMscUVBQXFFO1lBQ3BLLENBQUMsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztZQUM1QixHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQztvQkFDSixNQUFNLElBQUksR0FBc0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzVELElBQUksU0FBNkIsQ0FBQztvQkFDbEMsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ25CLEtBQUssTUFBTTs0QkFDVixTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNsQyxNQUFNO3dCQUNQLEtBQUssY0FBYzs0QkFDbEIsU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDMUMsTUFBTTt3QkFDUCxLQUFLLFFBQVE7NEJBQ1osU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDdkMsTUFBTTt3QkFDUCxLQUFLLHFCQUFxQjs0QkFDekIsU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUM5QyxNQUFNO3dCQUNQOzRCQUNDLFlBQVksQ0FBQyxHQUFHLEVBQUUseUJBQXlCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDOzRCQUN4RCxNQUFNO29CQUNSLENBQUM7b0JBQ0QsWUFBWSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNaLE1BQU0sT0FBTyxHQUFHLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25FLFlBQVksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQzNCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUF5QjtZQUMzQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxHQUFHLElBQUksQ0FBQztZQUN6SixNQUFNLFVBQVUsR0FBc0IsRUFBRSxDQUFDO1lBQ3pDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUMvQixLQUFLLE1BQU0sQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUM1QixJQUFJLENBQUM7d0JBQ0osVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDOUMsQ0FBQztvQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNaLFNBQVM7b0JBQ1YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM3QixLQUFLLE1BQU0sQ0FBQyxJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUMxQixJQUFJLENBQUM7d0JBQ0osSUFBSSxJQUFBLHFDQUF5QixFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2xDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ2pELENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM1QyxDQUFDO29CQUNGLENBQUM7b0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDWixTQUFTO29CQUNWLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFDRCxNQUFNLGlCQUFpQixHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUN4RixNQUFNLGVBQWUsR0FBRyxDQUFDLGdCQUFnQixJQUFJLENBQUMsaUJBQWlCLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDNUUsTUFBTSxjQUFjLEdBQXVCLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxFQUFFLENBQUM7WUFDakwsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFFTyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQWlDO1lBQzNELEtBQUssTUFBTSxTQUFTLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNuQyxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyx5QkFBeUI7Z0JBQ25GLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMseUJBQXlCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUUsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBaUM7WUFDL0QsTUFBTSxXQUFXLEdBQUcsQ0FBQyxNQUE0QixFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUgsTUFBTSxXQUFXLEdBQUc7Z0JBQ25CLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixPQUFPLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ2xDLFNBQVMsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDdEMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2FBQ2pCLENBQUM7WUFDRixPQUFPLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQXFCLDZCQUE2QixFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzVHLENBQUM7UUFFTyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQW9CO1lBQzNDLE9BQU8sTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBcUIsNEJBQTRCLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFckIsSUFBSSxJQUFJLENBQUMsY0FBYyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBQy9GLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFsSUQsc0NBa0lDO0lBRU0sSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFVLFNBQVEsYUFBYTtRQUMzQyxZQUNtQixRQUEwQixFQUMvQixVQUF1QjtZQUVwQyxLQUFLLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxJQUFBLCtCQUFxQixHQUFFLENBQUMsQ0FBQztRQUN0RCxDQUFDO0tBQ0QsQ0FBQTtJQVBZLDhCQUFTO3dCQUFULFNBQVM7UUFFbkIsV0FBQSxrQ0FBZ0IsQ0FBQTtRQUNoQixXQUFBLGlCQUFXLENBQUE7T0FIRCxTQUFTLENBT3JCIn0=