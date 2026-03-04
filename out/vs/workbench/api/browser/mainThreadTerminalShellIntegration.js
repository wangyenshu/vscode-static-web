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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/common/extHostTypes"], function (require, exports, event_1, lifecycle_1, uri_1, extHost_protocol_1, terminal_1, environmentService_1, extHostCustomers_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTerminalShellIntegration = void 0;
    let MainThreadTerminalShellIntegration = class MainThreadTerminalShellIntegration extends lifecycle_1.Disposable {
        constructor(extHostContext, _terminalService, workbenchEnvironmentService) {
            super();
            this._terminalService = _terminalService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTerminalShellIntegration);
            const instanceDataListeners = new Map();
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const listener of instanceDataListeners.values()) {
                    listener.dispose();
                }
            }));
            // onDidChangeTerminalShellIntegration
            const onDidAddCommandDetection = this._store.add(this._terminalService.createOnInstanceEvent(instance => {
                return event_1.Event.map(event_1.Event.filter(instance.capabilities.onDidAddCapabilityType, e => {
                    return e === 2 /* TerminalCapability.CommandDetection */;
                }), () => instance);
            })).event;
            this._store.add(onDidAddCommandDetection(e => this._proxy.$shellIntegrationChange(e.instanceId)));
            // onDidStartTerminalShellExecution
            const commandDetectionStartEvent = this._store.add(this._terminalService.createOnInstanceCapabilityEvent(2 /* TerminalCapability.CommandDetection */, e => e.onCommandExecuted));
            let currentCommand;
            this._store.add(commandDetectionStartEvent.event(e => {
                // Prevent duplicate events from being sent in case command detection double fires the
                // event
                if (e.data === currentCommand) {
                    return;
                }
                // String paths are not exposed in the extension API
                currentCommand = e.data;
                const instanceId = e.instance.instanceId;
                this._proxy.$shellExecutionStart(instanceId, e.data.command, convertToExtHostCommandLineConfidence(e.data), e.data.isTrusted, this._convertCwdToUri(e.data.cwd));
                // TerminalShellExecution.createDataStream
                // Debounce events to reduce the message count - when this listener is disposed the events will be flushed
                instanceDataListeners.get(instanceId)?.dispose();
                instanceDataListeners.set(instanceId, event_1.Event.accumulate(e.instance.onData, 50, this._store)(events => this._proxy.$shellExecutionData(instanceId, events.join())));
            }));
            // onDidEndTerminalShellExecution
            const commandDetectionEndEvent = this._store.add(this._terminalService.createOnInstanceCapabilityEvent(2 /* TerminalCapability.CommandDetection */, e => e.onCommandFinished));
            this._store.add(commandDetectionEndEvent.event(e => {
                currentCommand = undefined;
                const instanceId = e.instance.instanceId;
                instanceDataListeners.get(instanceId)?.dispose();
                // Send end in a microtask to ensure the data events are sent first
                setTimeout(() => {
                    this._proxy.$shellExecutionEnd(instanceId, e.data.command, convertToExtHostCommandLineConfidence(e.data), e.data.isTrusted, e.data.exitCode);
                });
            }));
            // onDidChangeTerminalShellIntegration via cwd
            const cwdChangeEvent = this._store.add(this._terminalService.createOnInstanceCapabilityEvent(0 /* TerminalCapability.CwdDetection */, e => e.onDidChangeCwd));
            this._store.add(cwdChangeEvent.event(e => {
                this._proxy.$cwdChange(e.instance.instanceId, this._convertCwdToUri(e.data));
            }));
            // Clean up after dispose
            this._store.add(this._terminalService.onDidDisposeInstance(e => this._proxy.$closeTerminal(e.instanceId)));
        }
        $executeCommand(terminalId, commandLine) {
            this._terminalService.getInstanceFromId(terminalId)?.runCommand(commandLine, true);
        }
        _convertCwdToUri(cwd) {
            return cwd ? uri_1.URI.file(cwd) : undefined;
        }
    };
    exports.MainThreadTerminalShellIntegration = MainThreadTerminalShellIntegration;
    exports.MainThreadTerminalShellIntegration = MainThreadTerminalShellIntegration = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTerminalShellIntegration),
        __param(1, terminal_1.ITerminalService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], MainThreadTerminalShellIntegration);
    function convertToExtHostCommandLineConfidence(command) {
        switch (command.commandLineConfidence) {
            case 'high':
                return extHostTypes_1.TerminalShellExecutionCommandLineConfidence.High;
            case 'medium':
                return extHostTypes_1.TerminalShellExecutionCommandLineConfidence.Medium;
            case 'low':
            default:
                return extHostTypes_1.TerminalShellExecutionCommandLineConfidence.Low;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRlcm1pbmFsU2hlbGxJbnRlZ3JhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkVGVybWluYWxTaGVsbEludGVncmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLGtDQUFrQyxHQUF4QyxNQUFNLGtDQUFtQyxTQUFRLHNCQUFVO1FBR2pFLFlBQ0MsY0FBK0IsRUFDSSxnQkFBa0MsRUFDdkMsMkJBQXlEO1lBRXZGLEtBQUssRUFBRSxDQUFDO1lBSDJCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFLckUsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsK0JBQStCLENBQUMsQ0FBQztZQUV0RixNQUFNLHFCQUFxQixHQUE2QixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2xFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDaEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUN2RCxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3BCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosc0NBQXNDO1lBQ3RDLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN2RyxPQUFPLGFBQUssQ0FBQyxHQUFHLENBQ2YsYUFBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLHNCQUFzQixFQUFF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