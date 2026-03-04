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
define(["require", "exports", "./extHostTypes", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTerminalService", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/async"], function (require, exports, extHostTypes_1, lifecycle_1, instantiation_1, extHost_protocol_1, extHostRpcService_1, extHostTerminalService_1, event_1, uri_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTerminalShellIntegration = exports.IExtHostTerminalShellIntegration = void 0;
    exports.IExtHostTerminalShellIntegration = (0, instantiation_1.createDecorator)('IExtHostTerminalShellIntegration');
    let ExtHostTerminalShellIntegration = class ExtHostTerminalShellIntegration extends lifecycle_1.Disposable {
        constructor(extHostRpc, _extHostTerminalService) {
            super();
            this._extHostTerminalService = _extHostTerminalService;
            this._activeShellIntegrations = new Map();
            this._onDidChangeTerminalShellIntegration = new event_1.Emitter();
            this.onDidChangeTerminalShellIntegration = this._onDidChangeTerminalShellIntegration.event;
            this._onDidStartTerminalShellExecution = new event_1.Emitter();
            this.onDidStartTerminalShellExecution = this._onDidStartTerminalShellExecution.event;
            this._onDidEndTerminalShellExecution = new event_1.Emitter();
            this.onDidEndTerminalShellExecution = this._onDidEndTerminalShellExecution.event;
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTerminalShellIntegration);
            // Clean up listeners
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const [_, integration] of this._activeShellIntegrations) {
                    integration.dispose();
                }
                this._activeShellIntegrations.clear();
            }));
            // Convenient test code:
            // this.onDidChangeTerminalShellIntegration(e => {
            // 	console.log('*** onDidChangeTerminalShellIntegration', e);
            // });
            // this.onDidStartTerminalShellExecution(async e => {
            // 	console.log('*** onDidStartTerminalShellExecution', e);
            // 	// new Promise<void>(r => {
            // 	// 	(async () => {
            // 	// 		for await (const d of e.execution.read()) {
            // 	// 			console.log('data2', d);
            // 	// 		}
            // 	// 	})();
            // 	// });
            // 	for await (const d of e.execution.read()) {
            // 		console.log('data', d);
            // 	}
            // });
            // this.onDidEndTerminalShellExecution(e => {
            // 	console.log('*** onDidEndTerminalShellExecution', e);
            // });
            // setTimeout(() => {
            // 	console.log('before executeCommand(\"echo hello\")');
            // 	Array.from(this._activeShellIntegrations.values())[0].value.executeCommand('echo hello');
            // 	console.log('after executeCommand(\"echo hello\")');
            // }, 4000);
        }
        $shellIntegrationChange(instanceId) {
            const terminal = this._extHostTerminalService.getTerminalById(instanceId);
            if (!terminal) {
                return;
            }
            const apiTerminal = terminal.value;
            let shellIntegration = this._activeShellIntegrations.get(instanceId);
            if (!shellIntegration) {
                shellIntegration = new InternalTerminalShellIntegration(terminal.value, this._onDidStartTerminalShellExecution);
                this._activeShellIntegrations.set(instanceId, shellIntegration);
                shellIntegration.store.add(terminal.onWillDispose(() => this._activeShellIntegrations.get(instanceId)?.dispose()));
                shellIntegration.store.add(shellIntegration.onDidRequestShellExecution(commandLine => this._proxy.$executeCommand(instanceId, commandLine)));
                shellIntegration.store.add(shellIntegration.onDidRequestEndExecution(e => this._onDidEndTerminalShellExecution.fire(e)));
                shellIntegration.store.add(shellIntegration.onDidRequestChangeShellIntegration(e => this._onDidChangeTerminalShellIntegration.fire(e)));
                terminal.shellIntegration = shellIntegration.value;
            }
            this._onDidChangeTerminalShellIntegration.fire({
                terminal: apiTerminal,
                shellIntegration: shellIntegration.value
            });
        }
        $shellExecutionStart(instanceId, commandLineValue, commandLineConfidence, isTrusted, cwd) {
            // Force shellIntegration creation if it hasn't been created yet, this could when events
            // don't come through on startup
            if (!this._activeShellIntegrations.has(instanceId)) {
                this.$shellIntegrationChange(instanceId);
            }
            const commandLine = {
                value: commandLineValue,
                confidence: commandLineConfidence,
                isTrusted
            };
            this._activeShellIntegrations.get(instanceId)?.startShellExecution(commandLine, cwd);
        }
        $shellExecutionEnd(instanceId, commandLineValue, commandLineConfidence, isTrusted, exitCode) {
            const commandLine = {
                value: commandLineValue,
                confidence: commandLineConfidence,
                isTrusted
            };
            this._activeShellIntegrations.get(instanceId)?.endShellExecution(commandLine, exitCode);
        }
        $shellExecutionData(instanceId, data) {
            this._activeShellIntegrations.get(instanceId)?.emitData(data);
        }
        $cwdChange(instanceId, cwd) {
            this._activeShellIntegrations.get(instanceId)?.setCwd((0, uri_1.isUriComponents)(cwd) ? uri_1.URI.revive(cwd) : cwd);
        }
        $closeTerminal(instanceId) {
            this._activeShellIntegrations.get(instanceId)?.dispose();
            this._activeShellIntegrations.delete(instanceId);
        }
    };
    exports.ExtHostTerminalShellIntegration = ExtHostTerminalShellIntegration;
    exports.ExtHostTerminalShellIntegration = ExtHostTerminalShellIntegration = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostTerminalService_1.IExtHostTerminalService)
    ], ExtHostTerminalShellIntegration);
    class InternalTerminalShellIntegration extends lifecycle_1.Disposable {
        get currentExecution() { return this._currentExecution; }
        constructor(_terminal, _onDidStartTerminalShellExecution) {
            super();
            this._terminal = _terminal;
            this._onDidStartTerminalShellExecution = _onDidStartTerminalShellExecution;
            this._ignoreNextExecution = false;
            this.store = this._register(new lifecycle_1.DisposableStore());
            this._onDidRequestChangeShellIntegration = this._register(new event_1.Emitter());
            this.onDidRequestChangeShellIntegration = this._onDidRequestChangeShellIntegration.event;
            this._onDidRequestShellExecution = this._register(new event_1.Emitter());
            this.onDidRequestShellExecution = this._onDidRequestShellExecution.event;
            this._onDidRequestEndExecution = this._register(new event_1.Emitter());
            this.onDidRequestEndExecution = this._onDidRequestEndExecution.event;
            const that = this;
            this.value = {
                get cwd() {
                    return that._cwd;
                },
                // executeCommand(commandLine: string): vscode.TerminalShellExecution;
                // executeCommand(executable: string, args: string[]): vscode.TerminalShellExecution;
                executeCommand(commandLineOrExecutable, args) {
                    let commandLineValue = commandLineOrExecutable;
                    if (args) {
                        commandLineValue += ` "${args.map(e => `${e.replaceAll('"', '\\"')}`).join('" "')}"`;
                    }
                    that._onDidRequestShellExecution.fire(commandLineValue);
                    // Fire the event in a microtask to allow the extension to use the execution before
                    // the start event fires
                    const commandLine = {
                        value: commandLineValue,
                        confidence: extHostTypes_1.TerminalShellExecutionCommandLineConfidence.High,
                        isTrusted: true
                    };
                    const execution = that.startShellExecution(commandLine, that._cwd, true).value;
                    that._ignoreNextExecution = true;
                    return execution;
                }
            };
        }
        startShellExecution(commandLine, cwd, fireEventInMicrotask) {
            if (this._ignoreNextExecution && this._currentExecution) {
                this._ignoreNextExecution = false;
            }
            else {
                if (this._currentExecution) {
                    this._currentExecution.endExecution(undefined);
                    this._onDidRequestEndExecution.fire({ terminal: this._terminal, shellIntegration: this.value, execution: this._currentExecution.value, exitCode: undefined });
                }
                const currentExecution = this._currentExecution = new InternalTerminalShellExecution(commandLine, cwd);
                if (fireEventInMicrotask) {
                    queueMicrotask(() => this._onDidStartTerminalShellExecution.fire({ terminal: this._terminal, shellIntegration: this.value, execution: currentExecution.value }));
                }
                else {
                    this._onDidStartTerminalShellExecution.fire({ terminal: this._terminal, shellIntegration: this.value, execution: this._currentExecution.value });
                }
            }
            return this._currentExecution;
        }
        emitData(data) {
            this.currentExecution?.emitData(data);
        }
        endShellExecution(commandLine, exitCode) {
            if (this._currentExecution) {
                this._currentExecution.endExecution(commandLine);
                this._onDidRequestEndExecution.fire({ terminal: this._terminal, shellIntegration: this.value, execution: this._currentExecution.value, exitCode });
                this._currentExecution = undefined;
            }
        }
        setCwd(cwd) {
            let wasChanged = false;
            if (uri_1.URI.isUri(this._cwd)) {
                wasChanged = !uri_1.URI.isUri(cwd) || this._cwd.toString() !== cwd.toString();
            }
            else if (this._cwd !== cwd) {
                wasChanged = true;
            }
            if (wasChanged) {
                this._cwd = cwd;
                this._onDidRequestChangeShellIntegration.fire({ terminal: this._terminal, shellIntegration: this.value });
            }
        }
    }
    class InternalTerminalShellExecution {
        constructor(_commandLine, cwd) {
            this._commandLine = _commandLine;
            this.cwd = cwd;
            this._ended = false;
            const that = this;
            this.value = {
                get commandLine() {
                    return that._commandLine;
                },
                get cwd() {
                    return that.cwd;
                },
                read() {
                    return that._createDataStream();
                }
            };
        }
        _createDataStream() {
            if (!this._dataStream) {
                if (this._ended) {
                    return async_1.AsyncIterableObject.EMPTY;
                }
                this._dataStream = new ShellExecutionDataStream();
            }
            return this._dataStream.createIterable();
        }
        emitData(data) {
            this._dataStream?.emitData(data);
        }
        endExecution(commandLine) {
            if (commandLine) {
                this._commandLine = commandLine;
            }
            this._dataStream?.endExecution();
            this._dataStream = undefined;
            this._ended = true;
        }
    }
    class ShellExecutionDataStream extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._emitters = [];
        }
        createIterable() {
            if (!this._barrier) {
                this._barrier = new async_1.Barrier();
            }
            const barrier = this._barrier;
            const iterable = new async_1.AsyncIterableObject(async (emitter) => {
                this._emitters.push(emitter);
                await barrier.wait();
            });
            return iterable;
        }
        emitData(data) {
            for (const emitter of this._emitters) {
                emitter.emitOne(data);
            }
        }
        endExecution() {
            this._barrier?.open();
            this._barrier = undefined;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlcm1pbmFsU2hlbGxJbnRlZ3JhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RUZXJtaW5hbFNoZWxsSW50ZWdyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JuRixRQUFBLGdDQUFnQyxHQUFHLElBQUEsK0JBQWUsRUFBbUMsa0NBQWtDLENBQUMsQ0FBQztJQUUvSCxJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLHNCQUFVO1FBZTlELFlBQ3FCLFVBQThCLEVBQ3pCLHVCQUFpRTtZQUUxRixLQUFLLEVBQUUsQ0FBQztZQUZrQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBWG5GLDZCQUF3QixHQUFnRSxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRXZGLHlDQUFvQyxHQUFHLElBQUksZUFBTyxFQUE4QyxDQUFDO1lBQzNHLHdDQUFtQyxHQUFHLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxLQUFLLENBQUM7WUFDNUUsc0NBQWlDLEdBQUcsSUFBSSxlQUFPLEVBQTJDLENBQUM7WUFDckcscUNBQWdDLEdBQUcsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEtBQUssQ0FBQztZQUN0RSxvQ0FBK0IsR0FBRyxJQUFJLGVBQU8sRUFBeUMsQ0FBQztZQUNqRyxtQ0FBOEIsR0FBRyxJQUFJLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDO1lBUXBGLElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7WUFFbEYscUJBQXFCO1lBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDaEMsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxJQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO29CQUM5RCxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZCLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3ZDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSix3QkFBd0I7WUFDeEIsa0RBQWtEO1lBQ2xELDhEQUE4RDtZQUM5RCxNQUFNO1lBQ04scURBQXFEO1lBQ3JELDJEQUEyRDtZQUMzRCwrQkFBK0I7WUFDL0Isc0JBQXNCO1lBQ3RCLG9EQUFvRDtZQUNwRCxrQ0FBa0M7WUFDbEMsVUFBVTtZQUNWLGFBQWE7WUFDYixVQUFVO1lBQ1YsK0NBQStDO1lBQy9DLDRCQUE0QjtZQUM1QixLQUFLO1lBQ0wsTUFBTTtZQUNOLDZDQUE2QztZQUM3Qyx5REFBeUQ7WUFDekQsTUFBTTtZQUNOLHFCQUFxQjtZQUNyQix5REFBeUQ7WUFDekQsNkZBQTZGO1lBQzdGLHdEQUF3RDtZQUN4RCxZQUFZO1FBQ2IsQ0FBQztRQUVNLHVCQUF1QixDQUFDLFVBQWtCO1lBQ2hELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztZQUNuQyxJQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZCLGdCQUFnQixHQUFHLElBQUksZ0NBQWdDLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQztnQkFDaEgsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztnQkFDaEUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuSCxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLDBCQUEwQixDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0ksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6SCxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hJLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7WUFDcEQsQ0FBQztZQUNELElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxJQUFJLENBQUM7Z0JBQzlDLFFBQVEsRUFBRSxXQUFXO2dCQUNyQixnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQyxLQUFLO2FBQ3hDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxVQUFrQixFQUFFLGdCQUF3QixFQUFFLHFCQUFrRSxFQUFFLFNBQWtCLEVBQUUsR0FBb0I7WUFDckwsd0ZBQXdGO1lBQ3hGLGdDQUFnQztZQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUNELE1BQU0sV0FBVyxHQUE2QztnQkFDN0QsS0FBSyxFQUFFLGdCQUFnQjtnQkFDdkIsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsU0FBUzthQUNULENBQUM7WUFDRixJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBRU0sa0JBQWtCLENBQUMsVUFBa0IsRUFBRSxnQkFBd0IsRUFBRSxxQkFBa0UsRUFBRSxTQUFrQixFQUFFLFFBQTRCO1lBQzNMLE1BQU0sV0FBVyxHQUE2QztnQkFDN0QsS0FBSyxFQUFFLGdCQUFnQjtnQkFDdkIsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsU0FBUzthQUNULENBQUM7WUFDRixJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRU0sbUJBQW1CLENBQUMsVUFBa0IsRUFBRSxJQUFZO1lBQzFELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFTSxVQUFVLENBQUMsVUFBa0IsRUFBRSxHQUFvQjtZQUN6RCxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFBLHFCQUFlLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JHLENBQUM7UUFFTSxjQUFjLENBQUMsVUFBa0I7WUFDdkMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUN6RCxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWxELENBQUM7S0FDRCxDQUFBO0lBckhZLDBFQUErQjs4Q0FBL0IsK0JBQStCO1FBZ0J6QyxXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsZ0RBQXVCLENBQUE7T0FqQmIsK0JBQStCLENBcUgzQztJQUVELE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7UUFFeEQsSUFBSSxnQkFBZ0IsS0FBaUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBZ0JyRyxZQUNrQixTQUEwQixFQUMxQixpQ0FBbUY7WUFFcEcsS0FBSyxFQUFFLENBQUM7WUFIUyxjQUFTLEdBQVQsU0FBUyxDQUFpQjtZQUMxQixzQ0FBaUMsR0FBakMsaUNBQWlDLENBQWtEO1lBaEI3Rix5QkFBb0IsR0FBWSxLQUFLLENBQUM7WUFHckMsVUFBSyxHQUFvQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFJckQsd0NBQW1DLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBOEMsQ0FBQyxDQUFDO1lBQzFILHVDQUFrQyxHQUFHLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxLQUFLLENBQUM7WUFDMUUsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDOUUsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQztZQUMxRCw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF5QyxDQUFDLENBQUM7WUFDM0csNkJBQXdCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztZQVF4RSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRztnQkFDWixJQUFJLEdBQUc7b0JBQ04sT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNsQixDQUFDO2dCQUNELHNFQUFzRTtnQkFDdEUscUZBQXFGO2dCQUNyRixjQUFjLENBQUMsdUJBQStCLEVBQUUsSUFBZTtvQkFDOUQsSUFBSSxnQkFBZ0IsR0FBVyx1QkFBdUIsQ0FBQztvQkFDdkQsSUFBSSxJQUFJLEVBQUUsQ0FBQzt3QkFDVixnQkFBZ0IsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztvQkFDdEYsQ0FBQztvQkFFRCxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ3hELG1GQUFtRjtvQkFDbkYsd0JBQXdCO29CQUN4QixNQUFNLFdBQVcsR0FBNkM7d0JBQzdELEtBQUssRUFBRSxnQkFBZ0I7d0JBQ3ZCLFVBQVUsRUFBRSwwREFBMkMsQ0FBQyxJQUFJO3dCQUM1RCxTQUFTLEVBQUUsSUFBSTtxQkFDZixDQUFDO29CQUNGLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUM7b0JBQy9FLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7b0JBQ2pDLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxXQUFxRCxFQUFFLEdBQW9CLEVBQUUsb0JBQThCO1lBQzlILElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN6RCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1lBQ25DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUM1QixJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztnQkFDL0osQ0FBQztnQkFDRCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLDhCQUE4QixDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDdkcsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO29CQUMxQixjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEssQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDbEosQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUMvQixDQUFDO1FBRUQsUUFBUSxDQUFDLElBQVk7WUFDcEIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsaUJBQWlCLENBQUMsV0FBaUUsRUFBRSxRQUE0QjtZQUNoSCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNuSixJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTSxDQUFDLEdBQW9CO1lBQzFCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLFVBQVUsR0FBRyxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDekUsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQzlCLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDbkIsQ0FBQztZQUNELElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO2dCQUNoQixJQUFJLENBQUMsbUNBQW1DLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDM0csQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELE1BQU0sOEJBQThCO1FBT25DLFlBQ1MsWUFBc0QsRUFDckQsR0FBb0I7WUFEckIsaUJBQVksR0FBWixZQUFZLENBQTBDO1lBQ3JELFFBQUcsR0FBSCxHQUFHLENBQWlCO1lBTnRCLFdBQU0sR0FBWSxLQUFLLENBQUM7WUFRL0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxLQUFLLEdBQUc7Z0JBQ1osSUFBSSxXQUFXO29CQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztnQkFDMUIsQ0FBQztnQkFDRCxJQUFJLEdBQUc7b0JBQ04sT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUNqQixDQUFDO2dCQUNELElBQUk7b0JBQ0gsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDakMsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNqQixPQUFPLDJCQUFtQixDQUFDLEtBQUssQ0FBQztnQkFDbEMsQ0FBQztnQkFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksd0JBQXdCLEVBQUUsQ0FBQztZQUNuRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzFDLENBQUM7UUFFRCxRQUFRLENBQUMsSUFBWTtZQUNwQixJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsWUFBWSxDQUFDLFdBQWlFO1lBQzdFLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1lBQ2pDLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLENBQUM7S0FDRDtJQUVELE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFBakQ7O1lBRVMsY0FBUyxHQUFtQyxFQUFFLENBQUM7UUF3QnhELENBQUM7UUF0QkEsY0FBYztZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxlQUFPLEVBQUUsQ0FBQztZQUMvQixDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLDJCQUFtQixDQUFTLEtBQUssRUFBQyxPQUFPLEVBQUMsRUFBRTtnQkFDaEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLE1BQU0sT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3RCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVELFFBQVEsQ0FBQyxJQUFZO1lBQ3BCLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBRUQsWUFBWTtZQUNYLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFDM0IsQ0FBQztLQUNEIn0=