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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "vs/workbench/services/host/browser/host", "vs/base/common/async", "vs/workbench/contrib/speech/common/speechService", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, arrays_1, cancellation_1, event_1, lifecycle_1, contextkey_1, log_1, host_1, async_1, speechService_1, telemetry_1, configuration_1, extensionsRegistry_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpeechService = void 0;
    const speechProvidersExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'speechProviders',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.speechProvider', 'Contributes a Speech Provider'),
            type: 'array',
            items: {
                additionalProperties: false,
                type: 'object',
                defaultSnippets: [{ body: { name: '', description: '' } }],
                required: ['name'],
                properties: {
                    name: {
                        description: (0, nls_1.localize)('speechProviderName', "Unique name for this Speech Provider."),
                        type: 'string'
                    },
                    description: {
                        description: (0, nls_1.localize)('speechProviderDescription', "A description of this Speech Provider, shown in the UI."),
                        type: 'string'
                    }
                }
            }
        }
    });
    let SpeechService = class SpeechService extends lifecycle_1.Disposable {
        get hasSpeechProvider() { return this.providerDescriptors.size > 0 || this.providers.size > 0; }
        constructor(logService, contextKeyService, hostService, telemetryService, configurationService, extensionService) {
            super();
            this.logService = logService;
            this.contextKeyService = contextKeyService;
            this.hostService = hostService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.extensionService = extensionService;
            this._onDidChangeHasSpeechProvider = this._register(new event_1.Emitter());
            this.onDidChangeHasSpeechProvider = this._onDidChangeHasSpeechProvider.event;
            this.providers = new Map();
            this.providerDescriptors = new Map();
            this.hasSpeechProviderContext = speechService_1.HasSpeechProvider.bindTo(this.contextKeyService);
            this._onDidStartSpeechToTextSession = this._register(new event_1.Emitter());
            this.onDidStartSpeechToTextSession = this._onDidStartSpeechToTextSession.event;
            this._onDidEndSpeechToTextSession = this._register(new event_1.Emitter());
            this.onDidEndSpeechToTextSession = this._onDidEndSpeechToTextSession.event;
            this._activeSpeechToTextSession = undefined;
            this.speechToTextInProgress = speechService_1.SpeechToTextInProgress.bindTo(this.contextKeyService);
            this._onDidStartKeywordRecognition = this._register(new event_1.Emitter());
            this.onDidStartKeywordRecognition = this._onDidStartKeywordRecognition.event;
            this._onDidEndKeywordRecognition = this._register(new event_1.Emitter());
            this.onDidEndKeywordRecognition = this._onDidEndKeywordRecognition.event;
            this._activeKeywordRecognitionSession = undefined;
            this.handleAndRegisterSpeechExtensions();
        }
        handleAndRegisterSpeechExtensions() {
            speechProvidersExtensionPoint.setHandler((extensions, delta) => {
                const oldHasSpeechProvider = this.hasSpeechProvider;
                for (const extension of delta.removed) {
                    for (const descriptor of extension.value) {
                        this.providerDescriptors.delete(descriptor.name);
                    }
                }
                for (const extension of delta.added) {
                    for (const descriptor of extension.value) {
                        this.providerDescriptors.set(descriptor.name, descriptor);
                    }
                }
                if (oldHasSpeechProvider !== this.hasSpeechProvider) {
                    this.handleHasSpeechProviderChange();
                }
            });
        }
        registerSpeechProvider(identifier, provider) {
            if (this.providers.has(identifier)) {
                throw new Error(`Speech provider with identifier ${identifier} is already registered.`);
            }
            const oldHasSpeechProvider = this.hasSpeechProvider;
            this.providers.set(identifier, provider);
            if (oldHasSpeechProvider !== this.hasSpeechProvider) {
                this.handleHasSpeechProviderChange();
            }
            return (0, lifecycle_1.toDisposable)(() => {
                const oldHasSpeechProvider = this.hasSpeechProvider;
                this.providers.delete(identifier);
                if (oldHasSpeechProvider !== this.hasSpeechProvider) {
                    this.handleHasSpeechProviderChange();
                }
            });
        }
        handleHasSpeechProviderChange() {
            this.hasSpeechProviderContext.set(this.hasSpeechProvider);
            this._onDidChangeHasSpeechProvider.fire();
        }
        get hasActiveSpeechToTextSession() { return !!this._activeSpeechToTextSession; }
        async createSpeechToTextSession(token, context = 'speech') {
            const provider = await this.getProvider();
            const language = (0, speechService_1.speechLanguageConfigToLanguage)(this.configurationService.getValue(speechService_1.SPEECH_LANGUAGE_CONFIG));
            const session = this._activeSpeechToTextSession = provider.createSpeechToTextSession(token, typeof language === 'string' ? { language } : undefined);
            const sessionStart = Date.now();
            let sessionRecognized = false;
            let sessionError = false;
            let sessionContentLength = 0;
            const disposables = new lifecycle_1.DisposableStore();
            const onSessionStoppedOrCanceled = () => {
                if (session === this._activeSpeechToTextSession) {
                    this._activeSpeechToTextSession = undefined;
                    this.speechToTextInProgress.reset();
                    this._onDidEndSpeechToTextSession.fire();
                    this.telemetryService.publicLog2('speechToTextSession', {
                        context,
                        sessionDuration: Date.now() - sessionStart,
                        sessionRecognized,
                        sessionError,
                        sessionContentLength,
                        sessionLanguage: language
                    });
                }
                disposables.dispose();
            };
            disposables.add(token.onCancellationRequested(() => onSessionStoppedOrCanceled()));
            if (token.isCancellationRequested) {
                onSessionStoppedOrCanceled();
            }
            disposables.add(session.onDidChange(e => {
                switch (e.status) {
                    case speechService_1.SpeechToTextStatus.Started:
                        if (session === this._activeSpeechToTextSession) {
                            this.speechToTextInProgress.set(true);
                            this._onDidStartSpeechToTextSession.fire();
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Recognizing:
                        sessionRecognized = true;
                        break;
                    case speechService_1.SpeechToTextStatus.Recognized:
                        if (typeof e.text === 'string') {
                            sessionContentLength += e.text.length;
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Stopped:
                        onSessionStoppedOrCanceled();
                        break;
                    case speechService_1.SpeechToTextStatus.Error:
                        this.logService.error(`Speech provider error in speech to text session: ${e.text}`);
                        sessionError = true;
                        break;
                }
            }));
            return session;
        }
        async getProvider() {
            // Send out extension activation to ensure providers can register
            await this.extensionService.activateByEvent('onSpeech');
            const provider = (0, arrays_1.firstOrDefault)(Array.from(this.providers.values()));
            if (!provider) {
                throw new Error(`No Speech provider is registered.`);
            }
            else if (this.providers.size > 1) {
                this.logService.warn(`Multiple speech providers registered. Picking first one: ${provider.metadata.displayName}`);
            }
            return provider;
        }
        get hasActiveKeywordRecognition() { return !!this._activeKeywordRecognitionSession; }
        async recognizeKeyword(token) {
            const result = new async_1.DeferredPromise();
            // Send out extension activation to ensure providers can register
            await this.extensionService.activateByEvent('onSpeech');
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(token.onCancellationRequested(() => {
                disposables.dispose();
                result.complete(speechService_1.KeywordRecognitionStatus.Canceled);
            }));
            const recognizeKeywordDisposables = disposables.add(new lifecycle_1.DisposableStore());
            let activeRecognizeKeywordSession = undefined;
            const recognizeKeyword = () => {
                recognizeKeywordDisposables.clear();
                const cts = new cancellation_1.CancellationTokenSource(token);
                recognizeKeywordDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
                const currentRecognizeKeywordSession = activeRecognizeKeywordSession = this.doRecognizeKeyword(cts.token).then(status => {
                    if (currentRecognizeKeywordSession === activeRecognizeKeywordSession) {
                        result.complete(status);
                    }
                }, error => {
                    if (currentRecognizeKeywordSession === activeRecognizeKeywordSession) {
                        result.error(error);
                    }
                });
            };
            disposables.add(this.hostService.onDidChangeFocus(focused => {
                if (!focused && activeRecognizeKeywordSession) {
                    recognizeKeywordDisposables.clear();
                    activeRecognizeKeywordSession = undefined;
                }
                else if (!activeRecognizeKeywordSession) {
                    recognizeKeyword();
                }
            }));
            if (this.hostService.hasFocus) {
                recognizeKeyword();
            }
            let status;
            try {
                status = await result.p;
            }
            finally {
                disposables.dispose();
            }
            this.telemetryService.publicLog2('keywordRecognition', {
                keywordRecognized: status === speechService_1.KeywordRecognitionStatus.Recognized
            });
            return status;
        }
        async doRecognizeKeyword(token) {
            const provider = await this.getProvider();
            const session = this._activeKeywordRecognitionSession = provider.createKeywordRecognitionSession(token);
            this._onDidStartKeywordRecognition.fire();
            const disposables = new lifecycle_1.DisposableStore();
            const onSessionStoppedOrCanceled = () => {
                if (session === this._activeKeywordRecognitionSession) {
                    this._activeKeywordRecognitionSession = undefined;
                    this._onDidEndKeywordRecognition.fire();
                }
                disposables.dispose();
            };
            disposables.add(token.onCancellationRequested(() => onSessionStoppedOrCanceled()));
            if (token.isCancellationRequested) {
                onSessionStoppedOrCanceled();
            }
            disposables.add(session.onDidChange(e => {
                if (e.status === speechService_1.KeywordRecognitionStatus.Stopped) {
                    onSessionStoppedOrCanceled();
                }
            }));
            try {
                return (await event_1.Event.toPromise(session.onDidChange)).status;
            }
            finally {
                onSessionStoppedOrCanceled();
            }
        }
    };
    exports.SpeechService = SpeechService;
    exports.SpeechService = SpeechService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, host_1.IHostService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, extensions_1.IExtensionService)
    ], SpeechService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlZWNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NwZWVjaC9icm93c2VyL3NwZWVjaFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0JoRyxNQUFNLDZCQUE2QixHQUFHLHVDQUFrQixDQUFDLHNCQUFzQixDQUE4QjtRQUM1RyxjQUFjLEVBQUUsaUJBQWlCO1FBQ2pDLFVBQVUsRUFBRTtZQUNYLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2Q0FBNkMsRUFBRSwrQkFBK0IsQ0FBQztZQUNyRyxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRTtnQkFDTixvQkFBb0IsRUFBRSxLQUFLO2dCQUMzQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxlQUFlLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzFELFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztnQkFDbEIsVUFBVSxFQUFFO29CQUNYLElBQUksRUFBRTt3QkFDTCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsdUNBQXVDLENBQUM7d0JBQ3BGLElBQUksRUFBRSxRQUFRO3FCQUNkO29CQUNELFdBQVcsRUFBRTt3QkFDWixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUseURBQXlELENBQUM7d0JBQzdHLElBQUksRUFBRSxRQUFRO3FCQUNkO2lCQUNEO2FBQ0Q7U0FDRDtLQUNELENBQUMsQ0FBQztJQUVJLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxzQkFBVTtRQU81QyxJQUFJLGlCQUFpQixLQUFLLE9BQU8sSUFBSSxD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