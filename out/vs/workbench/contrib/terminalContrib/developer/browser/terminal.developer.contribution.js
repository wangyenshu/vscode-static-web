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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/services/statusbar/browser/statusbar", "vs/css!./media/developer"], function (require, exports, buffer_1, lifecycle_1, uri_1, nls_1, actionCommonCategories_1, configuration_1, contextkey_1, files_1, opener_1, quickInput_1, terminal_1, workspace_1, terminalActions_1, terminalExtensions_1, terminalContextKey_1, statusbar_1) {
    "use strict";
    var DevModeContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.showTextureAtlas" /* TerminalCommandId.ShowTextureAtlas */,
        title: (0, nls_1.localize2)('workbench.action.terminal.showTextureAtlas', 'Show Terminal Texture Atlas'),
        category: actionCommonCategories_1.Categories.Developer,
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.isOpen),
        run: async (c, accessor) => {
            const fileService = accessor.get(files_1.IFileService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const bitmap = await c.service.activeInstance?.xterm?.textureAtlas;
            if (!bitmap) {
                return;
            }
            const cwdUri = workspaceContextService.getWorkspace().folders[0].uri;
            const fileUri = uri_1.URI.joinPath(cwdUri, 'textureAtlas.png');
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('bitmaprenderer');
            if (!ctx) {
                return;
            }
            ctx.transferFromImageBitmap(bitmap);
            const blob = await new Promise((res) => canvas.toBlob(res));
            if (!blob) {
                return;
            }
            await fileService.writeFile(fileUri, buffer_1.VSBuffer.wrap(new Uint8Array(await blob.arrayBuffer())));
            openerService.open(fileUri);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.writeDataToTerminal" /* TerminalCommandId.WriteDataToTerminal */,
        title: (0, nls_1.localize2)('workbench.action.terminal.writeDataToTerminal', 'Write Data to Terminal'),
        category: actionCommonCategories_1.Categories.Developer,
        run: async (c, accessor) => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const instance = await c.service.getActiveOrCreateInstance();
            await c.service.revealActiveTerminal();
            await instance.processReady;
            if (!instance.xterm) {
                throw new Error('Cannot write data to terminal if xterm isn\'t initialized');
            }
            const data = await quickInputService.input({
                value: '',
                placeHolder: 'Enter data, use \\x to escape',
                prompt: (0, nls_1.localize)('workbench.action.terminal.writeDataToTerminal.prompt', "Enter data to write directly to the terminal, bypassing the pty"),
            });
            if (!data) {
                return;
            }
            let escapedData = data
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r');
            while (true) {
                const match = escapedData.match(/\\x([0-9a-fA-F]{2})/);
                if (match === null || match.index === undefined || match.length < 2) {
                    break;
                }
                escapedData = escapedData.slice(0, match.index) + String.fromCharCode(parseInt(match[1], 16)) + escapedData.slice(match.index + 4);
            }
            const xterm = instance.xterm;
            xterm._writeText(escapedData);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.restartPtyHost" /* TerminalCommandId.RestartPtyHost */,
        title: (0, nls_1.localize2)('workbench.action.terminal.restartPtyHost', 'Restart Pty Host'),
        category: actionCommonCategories_1.Categories.Developer,
        run: async (c, accessor) => {
            const logService = accessor.get(terminal_1.ITerminalLogService);
            const backends = Array.from(c.instanceService.getRegisteredBackends());
            const unresponsiveBackends = backends.filter(e => !e.isResponsive);
            // Restart only unresponsive backends if there are any
            const restartCandidates = unresponsiveBackends.length > 0 ? unresponsiveBackends : backends;
            for (const backend of restartCandidates) {
                logService.warn(`Restarting pty host for authority "${backend.remoteAuthority}"`);
                backend.restartPtyHost();
            }
        }
    });
    let DevModeContribution = class DevModeContribution extends lifecycle_1.Disposable {
        static { DevModeContribution_1 = this; }
        static { this.ID = 'terminal.devMode'; }
        static get(instance) {
            return instance.getContribution(DevModeContribution_1.ID);
        }
        constructor(_instance, processManager, widgetManager, _configurationService, _statusbarService) {
            super();
            this._instance = _instance;
            this._configurationService = _configurationService;
            this._statusbarService = _statusbarService;
            this._activeDevModeDisposables = new lifecycle_1.MutableDisposable();
            this._currentColor = 0;
            this._statusbarEntryAccessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.developer.devMode" /* TerminalSettingId.DevMode */)) {
                    this._updateDevMode();
                }
            }));
        }
        xtermReady(xterm) {
            this._xterm = xterm;
            this._updateDevMode();
        }
        _updateDevMode() {
            const devMode = this._isEnabled();
            this._xterm?.raw.element?.classList.toggle('dev-mode', devMode);
            const commandDetection = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (devMode) {
                if (commandDetection) {
                    const commandDecorations = new Map();
                    this._activeDevModeDisposables.value = (0, lifecycle_1.combinedDisposable)(
                    // Prompt input
                    this._instance.onDidBlur(() => this._updateDevMode()), this._instance.onDidFocus(() => this._updateDevMode()), commandDetection.promptInputModel.onDidChangeInput(() => this._updateDevMode()), 
                    // Sequence markers
                    commandDetection.onCommandFinished(command => {
                        const colorClass = `color-${this._currentColor}`;
                        const decorations = [];
                        commandDecorations.set(command, decorations);
                        if (command.promptStartMarker) {
                            const d = this._instance.xterm.raw?.registerDecoration({
                                marker: command.promptStartMarker
                            });
                            if (d) {
                                decorations.push(d);
                                d.onRender(e => {
                                    e.textContent = 'A';
                                    e.classList.add('xterm-sequence-decoration', 'top', 'left', colorClass);
                                });
                            }
                        }
                        if (command.marker) {
                            const d = this._instance.xterm.raw?.registerDecoration({
                                marker: command.marker,
                                x: command.startX
                            });
                            if (d) {
                                decorations.push(d);
                                d.onRender(e => {
                                    e.textContent = 'B';
                                    e.classList.add('xterm-sequence-decoration', 'top', 'right', colorClass);
                                });
                            }
                        }
                        if (command.executedMarker) {
                            const d = this._instance.xterm.raw?.registerDecoration({
                                marker: command.executedMarker,
                                x: command.executedX
                            });
                            if (d) {
                                decorations.push(d);
                                d.onRender(e => {
                                    e.textContent = 'C';
                                    e.classList.add('xterm-sequence-decoration', 'bottom', 'left', colorClass);
                                });
                            }
                        }
                        if (command.endMarker) {
                            const d = this._instance.xterm.raw?.registerDecoration({
                                marker: command.endMarker
                            });
                            if (d) {
                                decorations.push(d);
                                d.onRender(e => {
                                    e.textContent = 'D';
                                    e.classList.add('xterm-sequence-decoration', 'bottom', 'right', colorClass);
                                });
                            }
                        }
                        this._currentColor = (this._currentColor + 1) % 2;
                    }), commandDetection.onCommandInvalidated(commands => {
                        for (const c of commands) {
                            const decorations = commandDecorations.get(c);
                            if (decorations) {
                                (0, lifecycle_1.dispose)(decorations);
                            }
                            commandDecorations.delete(c);
                        }
                    }));
                    this._updatePromptInputStatusBar(commandDetection);
                }
                else {
                    this._activeDevModeDisposables.value = this._instance.capabilities.onDidAddCapabilityType(e => {
                        if (e === 2 /* TerminalCapability.CommandDetection */) {
                            this._updateDevMode();
                        }
                    });
                }
            }
            else {
                this._activeDevModeDisposables.clear();
            }
        }
        _isEnabled() {
            return this._configurationService.getValue("terminal.integrated.developer.devMode" /* TerminalSettingId.DevMode */) || false;
        }
        _updatePromptInputStatusBar(commandDetection) {
            const promptInputModel = commandDetection.promptInputModel;
            if (promptInputModel) {
                const name = (0, nls_1.localize)('terminalDevMode', 'Terminal Dev Mode');
                const isExecuting = promptInputModel.cursorIndex === -1;
                this._statusbarEntry = {
                    name,
                    text: `$(${isExecuting ? 'loading~spin' : 'terminal'}) ${promptInputModel.getCombinedString()}`,
                    ariaLabel: name,
                    tooltip: 'The detected terminal prompt input',
                    kind: 'prominent'
                };
                if (!this._statusbarEntryAccessor.value) {
                    this._statusbarEntryAccessor.value = this._statusbarService.addEntry(this._statusbarEntry, `terminal.promptInput.${this._instance.instanceId}`, 0 /* StatusbarAlignment.LEFT */);
                }
                else {
                    this._statusbarEntryAccessor.value.update(this._statusbarEntry);
                }
                this._statusbarService.updateEntryVisibility(`terminal.promptInput.${this._instance.instanceId}`, this._instance.hasFocus);
            }
        }
    };
    DevModeContribution = DevModeContribution_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, statusbar_1.IStatusbarService)
    ], DevModeContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(DevModeContribution.ID, DevModeContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuZGV2ZWxvcGVyLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9kZXZlbG9wZXIvYnJvd3Nlci90ZXJtaW5hbC5kZXZlbG9wZXIuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlCaEcsSUFBQSx3Q0FBc0IsRUFBQztRQUN0QixFQUFFLHVGQUFvQztRQUN0QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsNENBQTRDLEVBQUUsNkJBQTZCLENBQUM7UUFDN0YsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztRQUM5QixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxFQUFFLENBQUMsd0NBQW1CLENBQUMsTUFBTSxDQUFDO1FBQzNELEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFO1lBQzFCLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDO1lBQy9DLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sdUJBQXVCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBd0IsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQztZQUNuRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMs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