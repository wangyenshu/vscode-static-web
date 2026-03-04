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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/speech/common/speechService", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, event_1, lifecycle_1, log_1, extHost_protocol_1, speechService_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSpeech = void 0;
    let MainThreadSpeech = class MainThreadSpeech {
        constructor(extHostContext, speechService, logService) {
            this.speechService = speechService;
            this.logService = logService;
            this.providerRegistrations = new Map();
            this.speechToTextSessions = new Map();
            this.keywordRecognitionSessions = new Map();
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSpeech);
        }
        $registerProvider(handle, identifier, metadata) {
            this.logService.trace('[Speech] extension registered provider', metadata.extension.value);
            const registration = this.speechService.registerSpeechProvider(identifier, {
                metadata,
                createSpeechToTextSession: (token, options) => {
                    if (token.isCancellationRequested) {
                        return {
                            onDidChange: event_1.Event.None
                        };
                    }
                    const disposables = new lifecycle_1.DisposableStore();
                    const session = Math.random();
                    this.proxy.$createSpeechToTextSession(handle, session, options?.language);
                    const onDidChange = disposables.add(new event_1.Emitter());
                    this.speechToTextSessions.set(session, { onDidChange });
                    disposables.add(token.onCancellationRequested(() => {
                        this.proxy.$cancelSpeechToTextSession(session);
                        this.speechToTextSessions.delete(session);
                        disposables.dispose();
                    }));
                    return {
                        onDidChange: onDidChange.event
                    };
                },
                createKeywordRecognitionSession: token => {
                    if (token.isCancellationRequested) {
                        return {
                            onDidChange: event_1.Event.None
                        };
                    }
                    const disposables = new lifecycle_1.DisposableStore();
                    const session = Math.random();
                    this.proxy.$createKeywordRecognitionSession(handle, session);
                    const onDidChange = disposables.add(new event_1.Emitter());
                    this.keywordRecognitionSessions.set(session, { onDidChange });
                    disposables.add(token.onCancellationRequested(() => {
                        this.proxy.$cancelKeywordRecognitionSession(session);
                        this.keywordRecognitionSessions.delete(session);
                        disposables.dispose();
                    }));
                    return {
                        onDidChange: onDidChange.event
                    };
                }
            });
            this.providerRegistrations.set(handle, {
                dispose: () => {
                    registration.dispose();
                }
            });
        }
        $unregisterProvider(handle) {
            const registration = this.providerRegistrations.get(handle);
            if (registration) {
                registration.dispose();
                this.providerRegistrations.delete(handle);
            }
        }
        $emitSpeechToTextEvent(session, event) {
            const providerSession = this.speechToTextSessions.get(session);
            providerSession?.onDidChange.fire(event);
        }
        $emitKeywordRecognitionEvent(session, event) {
            const providerSession = this.keywordRecognitionSessions.get(session);
            providerSession?.onDidChange.fire(event);
        }
        dispose() {
            this.providerRegistrations.forEach(disposable => disposable.dispose());
            this.providerRegistrations.clear();
            this.speechToTextSessions.forEach(session => session.onDidChange.dispose());
            this.speechToTextSessions.clear();
            this.keywordRecognitionSessions.forEach(session => session.onDidChange.dispose());
            this.keywordRecognitionSessions.clear();
        }
    };
    exports.MainThreadSpeech = MainThreadSpeech;
    exports.MainThreadSpeech = MainThreadSpeech = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadSpeech),
        __param(1, speechService_1.ISpeechService),
        __param(2, log_1.ILogService)
    ], MainThreadSpeech);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFNwZWVjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkU3BlZWNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7UUFTNUIsWUFDQyxjQUErQixFQUNmLGFBQThDLEVBQ2pELFVBQXdDO1lBRHBCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNoQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBUnJDLDBCQUFxQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBRXZELHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1lBQzlELCtCQUEwQixHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO1lBTzFGLElBQUksQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxNQUFjLEVBQUUsVUFBa0IsRUFBRSxRQUFpQztZQUN0RixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsVUFBVSxFQUFFO2dCQUMxRSxRQUFRO2dCQUNSLHlCQUF5QixFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO29CQUM3QyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNuQyxPQUFPOzRCQUNOLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSTt5QkFDdkIsQ0FB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