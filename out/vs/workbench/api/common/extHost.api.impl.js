/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/severity", "vs/base/common/uri", "vs/editor/common/config/editorOptions", "vs/editor/common/languageSelector", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/model", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/remote/common/remoteHosts", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/editSessions", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostAiRelatedInformation", "vs/workbench/api/common/extHostApiCommands", "vs/workbench/api/common/extHostApiDeprecationService", "vs/workbench/api/common/extHostAuthentication", "vs/workbench/api/common/extHostBulkEdits", "vs/workbench/api/common/extHostChatAgents2", "vs/workbench/api/common/extHostChatVariables", "vs/workbench/api/common/extHostClipboard", "vs/workbench/api/common/extHostCodeInsets", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostComments", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostCustomEditors", "vs/workbench/api/common/extHostDebugService", "vs/workbench/api/common/extHostDecorations", "vs/workbench/api/common/extHostDiagnostics", "vs/workbench/api/common/extHostDialogs", "vs/workbench/api/common/extHostDocumentContentProviders", "vs/workbench/api/common/extHostDocumentSaveParticipant", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/common/extHostEmbeddingVector", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostFileSystem", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/workbench/api/common/extHostFileSystemEventService", "vs/workbench/api/common/extHostFileSystemInfo", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostInlineChat", "vs/workbench/api/common/extHostInteractive", "vs/workbench/api/common/extHostLabelService", "vs/workbench/api/common/extHostLanguageFeatures", "vs/workbench/api/common/extHostLanguageModels", "vs/workbench/api/common/extHostLanguages", "vs/workbench/api/common/extHostLocalizationService", "vs/workbench/api/common/extHostManagedSockets", "vs/workbench/api/common/extHostMessageService", "vs/workbench/api/common/extHostNotebook", "vs/workbench/api/common/extHostNotebookDocumentSaveParticipant", "vs/workbench/api/common/extHostNotebookDocuments", "vs/workbench/api/common/extHostNotebookEditors", "vs/workbench/api/common/extHostNotebookKernels", "vs/workbench/api/common/extHostNotebookRenderers", "vs/workbench/api/common/extHostOutput", "vs/workbench/api/common/extHostProfileContentHandler", "vs/workbench/api/common/extHostProgress", "vs/workbench/api/common/extHostQuickDiff", "vs/workbench/api/common/extHostQuickOpen", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostSCM", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostSecretState", "vs/workbench/api/common/extHostShare", "vs/workbench/api/common/extHostSpeech", "vs/workbench/api/common/extHostStatusBar", "vs/workbench/api/common/extHostStorage", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/common/extHostTask", "vs/workbench/api/common/extHostTelemetry", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostTerminalShellIntegration", "vs/workbench/api/common/extHostTesting", "vs/workbench/api/common/extHostTextEditors", "vs/workbench/api/common/extHostTheming", "vs/workbench/api/common/extHostTimeline", "vs/workbench/api/common/extHostTreeViews", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostUriOpener", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/common/extHostUrls", "vs/workbench/api/common/extHostWebview", "vs/workbench/api/common/extHostWebviewPanels", "vs/workbench/api/common/extHostWebviewView", "vs/workbench/api/common/extHostWindow", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/searchExtTypes"], function (require, exports, cancellation_1, errors, event_1, lifecycle_1, network_1, severity_1, uri_1, editorOptions_1, languageSelector_1, languageConfiguration, model_1, extensions_1, files, log_1, remoteHosts_1, telemetryUtils_1, editSessions_1, extHost_protocol_1, extHostAiRelatedInformation_1, extHostApiCommands_1, extHostApiDeprecationService_1, extHostAuthentication_1, extHostBulkEdits_1, extHostChatAgents2_1, extHostChatVariables_1, extHostClipboard_1, extHostCodeInsets_1, extHostCommands_1, extHostComments_1, extHostConfiguration_1, extHostCustomEditors_1, extHostDebugService_1, extHostDecorations_1, extHostDiagnostics_1, extHostDialogs_1, extHostDocumentContentProviders_1, extHostDocumentSaveParticipant_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHostEditorTabs_1, extHostEmbeddingVector_1, extHostExtensionService_1, extHostFileSystem_1, extHostFileSystemConsumer_1, extHostFileSystemEventService_1, extHostFileSystemInfo_1, extHostInitDataService_1, extHostInlineChat_1, extHostInteractive_1, extHostLabelService_1, extHostLanguageFeatures_1, extHostLanguageModels_1, extHostLanguages_1, extHostLocalizationService_1, extHostManagedSockets_1, extHostMessageService_1, extHostNotebook_1, extHostNotebookDocumentSaveParticipant_1, extHostNotebookDocuments_1, extHostNotebookEditors_1, extHostNotebookKernels_1, extHostNotebookRenderers_1, extHostOutput_1, extHostProfileContentHandler_1, extHostProgress_1, extHostQuickDiff_1, extHostQuickOpen_1, extHostRpcService_1, extHostSCM_1, extHostSearch_1, extHostSecretState_1, extHostShare_1, extHostSpeech_1, extHostStatusBar_1, extHostStorage_1, extHostStoragePaths_1, extHostTask_1, extHostTelemetry_1, extHostTerminalService_1, extHostTerminalShellIntegration_1, extHostTesting_1, extHostTextEditors_1, extHostTheming_1, extHostTimeline_1, extHostTreeViews_1, extHostTunnelService_1, typeConverters, extHostTypes, extHostUriOpener_1, extHostUriTransformerService_1, extHostUrls_1, extHostWebview_1, extHostWebviewPanels_1, extHostWebviewView_1, extHostWindow_1, extHostWorkspace_1, debug_1, extensionHostProtocol_1, extensions_2, searchExtTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createApiFactoryAndRegisterActors = createApiFactoryAndRegisterActors;
    /**
     * This method instantiates and returns the extension API surface
     */
    function createApiFactoryAndRegisterActors(accessor) {
        // services
        const initData = accessor.get(extHostInitDataService_1.IExtHostInitDataService);
        const extHostFileSystemInfo = accessor.get(extHostFileSystemInfo_1.IExtHostFileSystemInfo);
        const extHostConsumerFileSystem = accessor.get(extHostFileSystemConsumer_1.IExtHostConsumerFileSystem);
        const extensionService = accessor.get(extHostExtensionService_1.IExtHostExtensionService);
        const extHostWorkspace = accessor.get(extHostWorkspace_1.IExtHostWorkspace);
        const extHostTelemetry = accessor.get(extHostTelemetry_1.IExtHostTelemetry);
        const extHostConfiguration = accessor.get(extHostConfiguration_1.IExtHostConfiguration);
        const uriTransformer = accessor.get(extHostUriTransformerService_1.IURITransformerService);
        const rpcProtocol = accessor.get(extHostRpcService_1.IExtHostRpcService);
        const extHostStorage = accessor.get(extHostStorage_1.IExtHostStorage);
        const extensionStoragePaths = accessor.get(extHostStoragePaths_1.IExtensionStoragePaths);
        const extHostLoggerService = accessor.get(log_1.ILoggerService);
        const extHostLogService = accessor.get(log_1.ILogService);
        const extHostTunnelService = accessor.get(extHostTunnelService_1.IExtHostTunnelService);
        const extHostApiDeprecation = accessor.get(extHostApiDeprecationService_1.IExtHostApiDeprecationService);
        const extHostWindow = accessor.get(extHostWindow_1.IExtHostWindow);
        const extHostSecretState = accessor.get(extHostSecretState_1.IExtHostSecretState);
        const extHostEditorTabs = accessor.get(extHostEditorTabs_1.IExtHostEditorTabs);
        const extHostManagedSockets = accessor.get(extHostManagedSockets_1.IExtHostManagedSockets);
        const extHostAuthentication = accessor.get(extHostAuthentication_1.IExtHostAuthentication);
        const extHostLanguageModels = accessor.get(extHostLanguageModels_1.IExtHostLanguageModels);
        // register addressable instances
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostFileSystemInfo, extHostFileSystemInfo);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLogLevelServiceShape, extHostLoggerService);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWorkspace, extHostWorkspace);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostConfiguration, extHostConfiguration);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostExtensionService, extensionService);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostStorage, extHostStorage);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTunnelService, extHostTunnelService);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWindow, extHostWindow);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSecretState, extHostSecretState);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTelemetry, extHostTelemetry);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostEditorTabs, extHostEditorTabs);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostManagedSockets, extHostManagedSockets);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostAuthentication, extHostAuthentication);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostChatProvider, extHostLanguageModels);
        // automatically create and register addressable instances
        const extHostDecorations = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDecorations, accessor.get(extHostDecorations_1.IExtHostDecorations));
        const extHostDocumentsAndEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentsAndEditors, accessor.get(extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors));
        const extHostCommands = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCommands, accessor.get(extHostCommands_1.IExtHostCommands));
        const extHostTerminalService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTerminalService, accessor.get(extHostTerminalService_1.IExtHostTerminalService));
        const extHostTerminalShellIntegration = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTerminalShellIntegration, accessor.get(extHostTerminalShellIntegration_1.IExtHostTerminalShellIntegration));
        const extHostDebugService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDebugService, accessor.get(extHostDebugService_1.IExtHostDebugService));
        const extHostSearch = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSearch, accessor.get(extHostSearch_1.IExtHostSearch));
        const extHostTask = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTask, accessor.get(extHostTask_1.IExtHostTask));
        const extHostOutputService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostOutputService, accessor.get(extHostOutput_1.IExtHostOutputService));
        const extHostLocalization = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLocalization, accessor.get(extHostLocalizationService_1.IExtHostLocalizationService));
        // manually create and register addressable instances
        const extHostUrls = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostUrls, new extHostUrls_1.ExtHostUrls(rpcProtocol));
        const extHostDocuments = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocuments, new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors));
        const extHostDocumentContentProviders = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentContentProviders, new extHostDocumentContentProviders_1.ExtHostDocumentContentProvider(rpcProtocol, extHostDocumentsAndEditors, extHostLogService));
        const extHostDocumentSaveParticipant = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentSaveParticipant, new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(extHostLogService, extHostDocuments, rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadBulkEdits)));
        const extHostNotebook = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebook, new extHostNotebook_1.ExtHostNotebookController(rpcProtocol, extHostCommands, extHostDocumentsAndEditors, extHostDocuments, extHostConsumerFileSystem, extHostSearch));
        const extHostNotebookDocuments = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookDocuments, new extHostNotebookDocuments_1.ExtHostNotebookDocuments(extHostNotebook));
        const extHostNotebookEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookEditors, new extHostNotebookEditors_1.ExtHostNotebookEditors(extHostLogService, extHostNotebook));
        const extHostNotebookKernels = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookKernels, new extHostNotebookKernels_1.ExtHostNotebookKernels(rpcProtocol, initData, extHostNotebook, extHostCommands, extHostLogService));
        const extHostNotebookRenderers = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookRenderers, new extHostNotebookRenderers_1.ExtHostNotebookRenderers(rpcProtocol, extHostNotebook));
        const extHostNotebookDocumentSaveParticipant = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookDocumentSaveParticipant, new extHostNotebookDocumentSaveParticipant_1.ExtHostNotebookDocumentSaveParticipant(extHostLogService, extHostNotebook, rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadBulkEdits)));
        const extHostEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostEditors, new extHostTextEditors_1.ExtHostEditors(rpcProtocol, extHostDocumentsAndEditors));
        const extHostTreeViews = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTreeViews, new extHostTreeViews_1.ExtHostTreeViews(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadTreeViews), extHostCommands, extHostLogService));
        const extHostEditorInsets = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostEditorInsets, new extHostCodeInsets_1.ExtHostEditorInsets(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadEditorInsets), extHostEditors, initData.remote));
        const extHostDiagnostics = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics, new extHostDiagnostics_1.ExtHostDiagnostics(rpcProtocol, extHostLogService, extHostFileSystemInfo, extHostDocumentsAndEditors));
        const extHostLanguages = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguages, new extHostLanguages_1.ExtHostLanguages(rpcProtocol, extHostDocuments, extHostCommands.converter, uriTransformer));
        const extHostLanguageFeatures = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures, new extHostLanguageFeatures_1.ExtHostLanguageFeatures(rpcProtocol, uriTransformer, extHostDocuments, extHostCommands, extHostDiagnostics, extHostLogService, extHostApiDeprecation, extHostTelemetry));
        const extHostFileSystem = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostFileSystem, new extHostFileSystem_1.ExtHostFileSystem(rpcProtocol, extHostLanguageFeatures));
        const extHostFileSystemEvent = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostFileSystemEventService, new extHostFileSystemEventService_1.ExtHostFileSystemEventService(rpcProtocol, extHostLogService, extHostDocumentsAndEditors));
        const extHostQuickOpen = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostQuickOpen, (0, extHostQuickOpen_1.createExtHostQuickOpen)(rpcProtocol, extHostWorkspace, extHostCommands));
        const extHostSCM = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSCM, new extHostSCM_1.ExtHostSCM(rpcProtocol, extHostCommands, extHostDocuments, extHostLogService));
        const extHostQuickDiff = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostQuickDiff, new extHostQuickDiff_1.ExtHostQuickDiff(rpcProtocol, uriTransformer));
        const extHostShare = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostShare, new extHostShare_1.ExtHostShare(rpcProtocol, uriTransformer));
        const extHostComment = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostComments, (0, extHostComments_1.createExtHostComments)(rpcProtocol, extHostCommands, extHostDocuments));
        const extHostProgress = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostProgress, new extHostProgress_1.ExtHostProgress(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadProgress)));
        const extHostLabelService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLabelService, new extHostLabelService_1.ExtHostLabelService(rpcProtocol));
        const extHostTheming = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTheming, new extHostTheming_1.ExtHostTheming(rpcProtocol));
        const extHostTimeline = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTimeline, new extHostTimeline_1.ExtHostTimeline(rpcProtocol, extHostCommands));
        const extHostWebviews = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWebviews, new extHostWebview_1.ExtHostWebviews(rpcProtocol, initData.remote, extHostWorkspace, extHostLogService, extHostApiDeprecation));
        const extHostWebviewPanels = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWebviewPanels, new extHostWebviewPanels_1.ExtHostWebviewPanels(rpcProtocol, extHostWebviews, extHostWorkspace));
        const extHostCustomEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCustomEditors, new extHostCustomEditors_1.ExtHostCustomEditors(rpcProtocol, extHostDocuments, extensionStoragePaths, extHostWebviews, extHostWebviewPanels));
        const extHostWebviewViews = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWebviewViews, new extHostWebviewView_1.ExtHostWebviewViews(rpcProtocol, extHostWebviews));
        const extHostTesting = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTesting, new extHostTesting_1.ExtHostTesting(rpcProtocol, extHostLogService, extHostCommands, extHostDocumentsAndEditors));
        const extHostUriOpeners = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostUriOpeners, new extHostUriOpener_1.ExtHostUriOpeners(rpcProtocol));
        const extHostProfileContentHandlers = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostProfileContentHandlers, new extHostProfileContentHandler_1.ExtHostProfileContentHandlers(rpcProtocol));
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostInteractive, new extHostInteractive_1.ExtHostInteractive(rpcProtocol, extHostNotebook, extHostDocumentsAndEditors, extHostCommands, extHostLogService));
        const extHostInteractiveEditor = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostInlineChat, new extHostInlineChat_1.ExtHostInteractiveEditor(rpcProtocol, extHostCommands, extHostDocuments, extHostLogService));
        const extHostChatAgents2 = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostChatAgents2, new extHostChatAgents2_1.ExtHostChatAgents2(rpcProtocol, extHostLogService, extHostCommands));
        const extHostChatVariables = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostChatVariables, new extHostChatVariables_1.ExtHostChatVariables(rpcProtocol));
        const extHostAiRelatedInformation = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostAiRelatedInformation, new extHostAiRelatedInformation_1.ExtHostRelatedInformation(rpcProtocol));
        const extHostAiEmbeddingVector = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostAiEmbeddingVector, new extHostEmbeddingVector_1.ExtHostAiEmbeddingVector(rpcProtocol));
        const extHostStatusBar = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostStatusBar, new extHostStatusBar_1.ExtHostStatusBar(rpcProtocol, extHostCommands.converter));
        const extHostSpeech = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSpeech, new extHostSpeech_1.ExtHostSpeech(rpcProtocol));
        // Check that no named customers are missing
        const expected = Object.values(extHost_protocol_1.ExtHostContext);
        rpcProtocol.assertRegistered(expected);
        // Other instances
        const extHostBulkEdits = new extHostBulkEdits_1.ExtHostBulkEdits(rpcProtocol, extHostDocumentsAndEditors);
        const extHostClipboard = new extHostClipboard_1.ExtHostClipboard(rpcProtocol);
        const extHostMessageService = new extHostMessageService_1.ExtHostMessageService(rpcProtocol, extHostLogService);
        const extHostDialogs = new extHostDialogs_1.ExtHostDialogs(rpcProtocol);
        // Register API-ish commands
        extHostApiCommands_1.ExtHostApiCommands.register(extHostCommands);
        return function (extension, extensionInfo, configProvider) {
            // Wraps an event with error handling and telemetry so that we know what extension fails
            // handling events. This will prevent us from reporting this as "our" error-telemetry and
            // allows for better blaming
            function _asExtensionEvent(actual) {
                return (listener, thisArgs, disposables) => {
                    const handle = actual(e => {
                        try {
                            listener.call(thisArgs, e);
                        }
                        catch (err) {
                            errors.onUnexpectedExternalError(new Error(`[ExtensionListenerError] Extension '${extension.identifier.value}' FAILED to handle event: ${err.toString()}`, { cause: err }));
                            extHostTelemetry.onExtensionError(extension.identifier, err);
                        }
                    });
                    disposables?.push(handle);
                    return handle;
                };
            }
            // Check document selectors for being overly generic. Technically this isn't a problem but
            // in practice many extensions say they support `fooLang` but need fs-access to do so. Those
            // extension should specify then the `file`-scheme, e.g. `{ scheme: 'fooLang', language: 'fooLang' }`
            // We only inform once, it is not a warning because we just want to raise awareness and because
            // we cannot say if the extension is doing it right or wrong...
            const checkSelector = (function () {
                let done = !extension.isUnderDevelopment;
                function informOnce() {
                    if (!done) {
                        extHostLogService.info(`Extension '${extension.identifier.value}' uses a document selector without scheme. Learn more about this: https://go.microsoft.com/fwlink/?linkid=872305`);
                        done = true;
                    }
                }
                return function perform(selector) {
                    if (Array.isArray(selector)) {
                        selector.forEach(perform);
                    }
                    else if (typeof selector === 'string') {
                        informOnce();
                    }
                    else {
                        const filter = selector; // TODO: microsoft/TypeScript#42768
                        if (typeof filter.scheme === 'undefined') {
                            informOnce();
                        }
                        if (typeof filter.exclusive === 'boolean') {
                            (0, extensions_2.checkProposedApiEnabled)(extension, 'documentFiltersExclusive');
                        }
                    }
                    return selector;
                };
            })();
            const authentication = {
                getSession(providerId, scopes, options) {
                    if (typeof options?.forceNewSession === 'object' && options.forceNewSession.learnMore) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'authLearnMore');
                    }
                    return extHostAuthentication.getSession(extension, providerId, scopes, options);
                },
                getSessions(providerId, scopes) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'authGetSessions');
                    return extHostAuthentication.getSessions(extension, providerId, scopes);
                },
                // TODO: remove this after GHPR and Codespaces move off of it
                async hasSession(providerId, scopes) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'authSession');
                    return !!(await extHostAuthentication.getSession(extension, providerId, scopes, { silent: true }));
                },
                get onDidChangeSessions() {
                    return _asExtensionEvent(extHostAuthentication.onDidChangeSessions);
                },
                registerAuthenticationProvider(id, label, provider, options) {
                    return extHostAuthentication.registerAuthenticationProvider(id, label, provider, options);
                }
            };
            // namespace: commands
            const commands = {
                registerCommand(id, command, thisArgs) {
                    return extHostCommands.registerCommand(true, id, command, thisArgs, undefined, extension);
                },
                registerTextEditorCommand(id, callback, thisArg) {
                    return extHostCommands.registerCommand(true, id, (...args) => {
                        const activeTextEditor = extHostEditors.getActiveTextEditor();
                        if (!activeTextEditor) {
                            extHostLogService.warn('Cannot execute ' + id + ' because there is no active text editor.');
                            return undefined;
                        }
                        return activeTextEditor.edit((edit) => {
                            callback.apply(thisArg, [activeTextEditor, edit, ...args]);
                        }).then((result) => {
                            if (!result) {
                                extHostLogService.warn('Edits from command ' + id + ' were not applied.');
                            }
                        }, (err) => {
                            extHostLogService.warn('An error occurred while running command ' + id, err);
                        });
                    }, undefined, undefined, extension);
                },
                registerDiffInformationCommand: (id, callback, thisArg) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'diffCommand');
                    return extHostCommands.registerCommand(true, id, async (...args) => {
                        const activeTextEditor = extHostDocumentsAndEditors.activeEditor(true);
                        if (!activeTextEditor) {
                            extHostLogService.warn('Cannot execute ' + id + ' because there is no active text editor.');
                            return undefined;
                        }
                        const diff = await extHostEditors.getDiffInformation(activeTextEditor.id);
                        callback.apply(thisArg, [diff, ...args]);
                    }, undefined, undefined, extension);
                },
                executeCommand(id, ...args) {
                    return extHostCommands.executeCommand(id, ...args);
                },
                getCommands(filterInternal = false) {
                    return extHostCommands.getCommands(filterInternal);
                }
            };
            // namespace: env
            const env = {
                get machineId() { return initData.telemetryInfo.machineId; },
                get sessionId() { return initData.telemetryInfo.sessionId; },
                get language() { return initData.environment.appLanguage; },
                get appName() { return initData.environment.appName; },
                get appRoot() { return initData.environment.appRoot?.fsPath ?? ''; },
                get appHost() { return initData.environment.appHost; },
                get uriScheme() { return initData.environment.appUriScheme; },
                get clipboard() { return extHostClipboard.value; },
                get shell() {
                    return extHostTerminalService.getDefaultShell(false);
                },
                get onDidChangeShell() {
                    return _asExtensionEvent(extHostTerminalService.onDidChangeShell);
                },
                get isTelemetryEnabled() {
                    return extHostTelemetry.getTelemetryConfiguration();
                },
                get onDidChangeTelemetryEnabled() {
                    return _asExtensionEvent(extHostTelemetry.onDidChangeTelemetryEnabled);
                },
                get telemetryConfiguration() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'telemetry');
                    return extHostTelemetry.getTelemetryDetails();
                },
                get onDidChangeTelemetryConfiguration() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'telemetry');
                    return _asExtensionEvent(extHostTelemetry.onDidChangeTelemetryConfiguration);
                },
                get isNewAppInstall() {
                    return (0, extHostTelemetry_1.isNewAppInstall)(initData.telemetryInfo.firstSessionDate);
                },
                createTelemetryLogger(sender, options) {
                    extHostTelemetry_1.ExtHostTelemetryLogger.validateSender(sender);
                    return extHostTelemetry.instantiateLogger(extension, sender, options);
                },
                openExternal(uri, options) {
                    return extHostWindow.openUri(uri, {
                        allowTunneling: !!initData.remote.authority,
                        allowContributedOpeners: options?.allowContributedOpeners,
                    });
                },
                async asExternalUri(uri) {
                    if (uri.scheme === initData.environment.appUriScheme) {
                        return extHostUrls.createAppUri(uri);
                    }
                    try {
                        return await extHostWindow.asExternalUri(uri, { allowTunneling: !!initData.remote.authority });
                    }
                    catch (err) {
                        if ((0, network_1.matchesScheme)(uri, network_1.Schemas.http) || (0, network_1.matchesScheme)(uri, network_1.Schemas.https)) {
                            return uri;
                        }
                        throw err;
                    }
                },
                get remoteName() {
                    return (0, remoteHosts_1.getRemoteName)(initData.remote.authority);
                },
                get remoteAuthority() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return initData.remote.authority;
                },
                get uiKind() {
                    return initData.uiKind;
                },
                get logLevel() {
                    return extHostLogService.getLevel();
                },
                get onDidChangeLogLevel() {
                    return _asExtensionEvent(extHostLogService.onDidChangeLogLevel);
                },
                get appQuality() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return initData.quality;
                },
                get appCommit() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return initData.commit;
                },
            };
            if (!initData.environment.extensionTestsLocationURI) {
                // allow to patch env-function when running tests
                Object.freeze(env);
            }
            // namespace: tests
            const tests = {
                createTestController(provider, label, refreshHandler) {
                    return extHostTesting.createTestController(extension, provider, label, refreshHandler);
                },
                createTestObserver() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'testObserver');
                    return extHostTesting.createTestObserver();
                },
                runTests(provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'testObserver');
                    return extHostTesting.runTests(provider);
                },
                get onDidChangeTestResults() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'testObserver');
                    return _asExtensionEvent(extHostTesting.onResultsChanged);
                },
                get testResults() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'testObserver');
                    return extHostTesting.results;
                },
            };
            // namespace: extensions
            const extensionKind = initData.remote.isRemote
                ? extHostTypes.ExtensionKind.Workspace
                : extHostTypes.ExtensionKind.UI;
            const extensions = {
                getExtension(extensionId, includeFromDifferentExtensionHosts) {
                    if (!(0, extensions_2.isProposedApiEnabled)(extension, 'extensionsAny')) {
                        includeFromDifferentExtensionHosts = false;
                    }
                    const mine = extensionInfo.mine.getExtensionDescription(extensionId);
                    if (mine) {
                        return new extHostExtensionService_1.Extension(extensionService, extension.identifier, mine, extensionKind, false);
                    }
                    if (includeFromDifferentExtensionHosts) {
                        const foreign = extensionInfo.all.getExtensionDescription(extensionId);
                        if (foreign) {
                            return new extHostExtensionService_1.Extension(extensionService, extension.identifier, foreign, extensionKind /* TODO@alexdima THIS IS WRONG */, true);
                        }
                    }
                    return undefined;
                },
                get all() {
                    const result = [];
                    for (const desc of extensionInfo.mine.getAllExtensionDescriptions()) {
                        result.push(new extHostExtensionService_1.Extension(extensionService, extension.identifier, desc, extensionKind, false));
                    }
                    return result;
                },
                get allAcrossExtensionHosts() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'extensionsAny');
                    const local = new extensions_1.ExtensionIdentifierSet(extensionInfo.mine.getAllExtensionDescriptions().map(desc => desc.identifier));
                    const result = [];
                    for (const desc of extensionInfo.all.getAllExtensionDescriptions()) {
                        const isFromDifferentExtensionHost = !local.has(desc.identifier);
                        result.push(new extHostExtensionService_1.Extension(extensionService, extension.identifier, desc, extensionKind /* TODO@alexdima THIS IS WRONG */, isFromDifferentExtensionHost));
                    }
                    return result;
                },
                get onDidChange() {
                    if ((0, extensions_2.isProposedApiEnabled)(extension, 'extensionsAny')) {
                        return _asExtensionEvent(event_1.Event.any(extensionInfo.mine.onDidChange, extensionInfo.all.onDidChange));
                    }
                    return _asExtensionEvent(extensionInfo.mine.onDidChange);
                }
            };
            // namespace: languages
            const languages = {
                createDiagnosticCollection(name) {
                    return extHostDiagnostics.createDiagnosticCollection(extension.identifier, name);
                },
                get onDidChangeDiagnostics() {
                    return _asExtensionEvent(extHostDiagnostics.onDidChangeDiagnostics);
                },
                getDiagnostics: (resource) => {
                    return extHostDiagnostics.getDiagnostics(resource);
                },
                getLanguages() {
                    return extHostLanguages.getLanguages();
                },
                setTextDocumentLanguage(document, languageId) {
                    return extHostLanguages.changeLanguage(document.uri, languageId);
                },
                match(selector, document) {
                    const interalSelector = typeConverters.LanguageSelector.from(selector);
                    let notebook;
                    if ((0, languageSelector_1.targetsNotebooks)(interalSelector)) {
                        notebook = extHostNotebook.notebookDocuments.find(value => value.apiNotebook.getCells().find(c => c.document === document))?.apiNotebook;
                    }
                    return (0, languageSelector_1.score)(interalSelector, document.uri, document.languageId, true, notebook?.uri, notebook?.notebookType);
                },
                registerCodeActionsProvider(selector, provider, metadata) {
                    return extHostLanguageFeatures.registerCodeActionProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerDocumentPasteEditProvider(selector, provider, metadata) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'documentPaste');
                    return extHostLanguageFeatures.registerDocumentPasteEditProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerCodeLensProvider(selector, provider) {
                    return extHostLanguageFeatures.registerCodeLensProvider(extension, checkSelector(selector), provider);
                },
                registerDefinitionProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDefinitionProvider(extension, checkSelector(selector), provider);
                },
                registerDeclarationProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDeclarationProvider(extension, checkSelector(selector), provider);
                },
                registerImplementationProvider(selector, provider) {
                    return extHostLanguageFeatures.registerImplementationProvider(extension, checkSelector(selector), provider);
                },
                registerTypeDefinitionProvider(selector, provider) {
                    return extHostLanguageFeatures.registerTypeDefinitionProvider(extension, checkSelector(selector), provider);
                },
                registerHoverProvider(selector, provider) {
                    return extHostLanguageFeatures.registerHoverProvider(extension, checkSelector(selector), provider, extension.identifier);
                },
                registerEvaluatableExpressionProvider(selector, provider) {
                    return extHostLanguageFeatures.registerEvaluatableExpressionProvider(extension, checkSelector(selector), provider, extension.identifier);
                },
                registerInlineValuesProvider(selector, provider) {
                    return extHostLanguageFeatures.registerInlineValuesProvider(extension, checkSelector(selector), provider, extension.identifier);
                },
                registerDocumentHighlightProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentHighlightProvider(extension, checkSelector(selector), provider);
                },
                registerMultiDocumentHighlightProvider(selector, provider) {
                    return extHostLanguageFeatures.registerMultiDocumentHighlightProvider(extension, checkSelector(selector), provider);
                },
                registerLinkedEditingRangeProvider(selector, provider) {
                    return extHostLanguageFeatures.registerLinkedEditingRangeProvider(extension, checkSelector(selector), provider);
                },
                registerReferenceProvider(selector, provider) {
                    return extHostLanguageFeatures.registerReferenceProvider(extension, checkSelector(selector), provider);
                },
                registerRenameProvider(selector, provider) {
                    return extHostLanguageFeatures.registerRenameProvider(extension, checkSelector(selector), provider);
                },
                registerNewSymbolNamesProvider(selector, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'newSymbolNamesProvider');
                    return extHostLanguageFeatures.registerNewSymbolNamesProvider(extension, checkSelector(selector), provider);
                },
                registerDocumentSymbolProvider(selector, provider, metadata) {
                    return extHostLanguageFeatures.registerDocumentSymbolProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerWorkspaceSymbolProvider(provider) {
                    return extHostLanguageFeatures.registerWorkspaceSymbolProvider(extension, provider);
                },
                registerDocumentFormattingEditProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentFormattingEditProvider(extension, checkSelector(selector), provider);
                },
                registerDocumentRangeFormattingEditProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentRangeFormattingEditProvider(extension, checkSelector(selector), provider);
                },
                registerOnTypeFormattingEditProvider(selector, provider, firstTriggerCharacter, ...moreTriggerCharacters) {
                    return extHostLanguageFeatures.registerOnTypeFormattingEditProvider(extension, checkSelector(selector), provider, [firstTriggerCharacter].concat(moreTriggerCharacters));
                },
                registerDocumentSemanticTokensProvider(selector, provider, legend) {
                    return extHostLanguageFeatures.registerDocumentSemanticTokensProvider(extension, checkSelector(selector), provider, legend);
                },
                registerDocumentRangeSemanticTokensProvider(selector, provider, legend) {
                    return extHostLanguageFeatures.registerDocumentRangeSemanticTokensProvider(extension, checkSelector(selector), provider, legend);
                },
                registerSignatureHelpProvider(selector, provider, firstItem, ...remaining) {
                    if (typeof firstItem === 'object') {
                        return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, firstItem);
                    }
                    return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, typeof firstItem === 'undefined' ? [] : [firstItem, ...remaining]);
                },
                registerCompletionItemProvider(selector, provider, ...triggerCharacters) {
                    return extHostLanguageFeatures.registerCompletionItemProvider(extension, checkSelector(selector), provider, triggerCharacters);
                },
                registerInlineCompletionItemProvider(selector, provider, metadata) {
                    if (provider.handleDidShowCompletionItem) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'inlineCompletionsAdditions');
                    }
                    if (provider.handleDidPartiallyAcceptCompletionItem) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'inlineCompletionsAdditions');
                    }
                    if (metadata) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'inlineCompletionsAdditions');
                    }
                    return extHostLanguageFeatures.registerInlineCompletionsProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerInlineEditProvider(selector, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'inlineEdit');
                    return extHostLanguageFeatures.registerInlineEditProvider(extension, checkSelector(selector), provider);
                },
                registerDocumentLinkProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentLinkProvider(extension, checkSelector(selector), provider);
                },
                registerColorProvider(selector, provider) {
                    return extHostLanguageFeatures.registerColorProvider(extension, checkSelector(selector), provider);
                },
                registerFoldingRangeProvider(selector, provider) {
                    return extHostLanguageFeatures.registerFoldingRangeProvider(extension, checkSelector(selector), provider);
                },
                registerSelectionRangeProvider(selector, provider) {
                    return extHostLanguageFeatures.registerSelectionRangeProvider(extension, selector, provider);
                },
                registerCallHierarchyProvider(selector, provider) {
                    return extHostLanguageFeatures.registerCallHierarchyProvider(extension, selector, provider);
                },
                registerTypeHierarchyProvider(selector, provider) {
                    return extHostLanguageFeatures.registerTypeHierarchyProvider(extension, selector, provider);
                },
                setLanguageConfiguration: (language, configuration) => {
                    return extHostLanguageFeatures.setLanguageConfiguration(extension, language, configuration);
                },
                getTokenInformationAtPosition(doc, pos) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tokenInformation');
                    return extHostLanguages.tokenAtPosition(doc, pos);
                },
                registerInlayHintsProvider(selector, provider) {
                    return extHostLanguageFeatures.registerInlayHintsProvider(extension, selector, provider);
                },
                createLanguageStatusItem(id, selector) {
                    return extHostLanguages.createLanguageStatusItem(extension, id, selector);
                },
                registerDocumentDropEditProvider(selector, provider, metadata) {
                    return extHostLanguageFeatures.registerDocumentOnDropEditProvider(extension, selector, provider, (0, extensions_2.isProposedApiEnabled)(extension, 'documentPaste') ? metadata : undefined);
                }
            };
            // namespace: window
            const window = {
                get activeTextEditor() {
                    return extHostEditors.getActiveTextEditor();
                },
                get visibleTextEditors() {
                    return extHostEditors.getVisibleTextEditors();
                },
                get activeTerminal() {
                    return extHostTerminalService.activeTerminal;
                },
                get terminals() {
                    return extHostTerminalService.terminals;
                },
                async showTextDocument(documentOrUri, columnOrOptions, preserveFocus) {
                    if (uri_1.URI.isUri(documentOrUri) && documentOrUri.scheme === network_1.Schemas.vscodeRemote && !documentOrUri.authority) {
                        extHostApiDeprecation.report('workspace.showTextDocument', extension, `A URI of 'vscode-remote' scheme requires an authority.`);
                    }
                    const document = await (uri_1.URI.isUri(documentOrUri)
                        ? Promise.resolve(workspace.openTextDocument(documentOrUri))
                        : Promise.resolve(documentOrUri));
                    return extHostEditors.showTextDocument(document, columnOrOptions, preserveFocus);
                },
                createTextEditorDecorationType(options) {
                    return extHostEditors.createTextEditorDecorationType(extension, options);
                },
                onDidChangeActiveTextEditor(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeActiveTextEditor)(listener, thisArg, disposables);
                },
                onDidChangeVisibleTextEditors(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeVisibleTextEditors)(listener, thisArg, disposables);
                },
                onDidChangeTextEditorSelection(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeTextEditorSelection)(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorOptions(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeTextEditorOptions)(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorVisibleRanges(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeTextEditorVisibleRanges)(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorViewColumn(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeTextEditorViewColumn)(listener, thisArg, disposables);
                },
                onDidCloseTerminal(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTerminalService.onDidCloseTerminal)(listener, thisArg, disposables);
                },
                onDidOpenTerminal(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTerminalService.onDidOpenTerminal)(listener, thisArg, disposables);
                },
                onDidChangeActiveTerminal(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTerminalService.onDidChangeActiveTerminal)(listener, thisArg, disposables);
                },
                onDidChangeTerminalDimensions(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalDimensions');
                    return _asExtensionEvent(extHostTerminalService.onDidChangeTerminalDimensions)(listener, thisArg, disposables);
                },
                onDidChangeTerminalState(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTerminalService.onDidChangeTerminalState)(listener, thisArg, disposables);
                },
                onDidWriteTerminalData(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalDataWriteEvent');
                    return _asExtensionEvent(extHostTerminalService.onDidWriteTerminalData)(listener, thisArg, disposables);
                },
                onDidExecuteTerminalCommand(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalExecuteCommandEvent');
                    return _asExtensionEvent(extHostTerminalService.onDidExecuteTerminalCommand)(listener, thisArg, disposables);
                },
                onDidChangeTerminalShellIntegration(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalShellIntegration');
                    return _asExtensionEvent(extHostTerminalShellIntegration.onDidChangeTerminalShellIntegration)(listener, thisArg, disposables);
                },
                onDidStartTerminalShellExecution(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalShellIntegration');
                    return _asExtensionEvent(extHostTerminalShellIntegration.onDidStartTerminalShellExecution)(listener, thisArg, disposables);
                },
                onDidEndTerminalShellExecution(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalShellIntegration');
                    return _asExtensionEvent(extHostTerminalShellIntegration.onDidEndTerminalShellExecution)(listener, thisArg, disposables);
                },
                get state() {
                    return extHostWindow.getState();
                },
                onDidChangeWindowState(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostWindow.onDidChangeWindowState)(listener, thisArg, disposables);
                },
                showInformationMessage(message, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Info, message, rest[0], rest.slice(1));
                },
                showWarningMessage(message, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Warning, message, rest[0], rest.slice(1));
                },
                showErrorMessage(message, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Error, message, rest[0], rest.slice(1));
                },
                showQuickPick(items, options, token) {
                    return extHostQuickOpen.showQuickPick(extension, items, options, token);
                },
                showWorkspaceFolderPick(options) {
                    return extHostQuickOpen.showWorkspaceFolderPick(options);
                },
                showInputBox(options, token) {
                    return extHostQuickOpen.showInput(options, token);
                },
                showOpenDialog(options) {
                    return extHostDialogs.showOpenDialog(extension, options);
                },
                showSaveDialog(options) {
                    return extHostDialogs.showSaveDialog(options);
                },
                createStatusBarItem(alignmentOrId, priorityOrAlignment, priorityArg) {
                    let id;
                    let alignment;
                    let priority;
                    if (typeof alignmentOrId === 'string') {
                        id = alignmentOrId;
                        alignment = priorityOrAlignment;
                        priority = priorityArg;
                    }
                    else {
                        alignment = alignmentOrId;
                        priority = priorityOrAlignment;
                    }
                    return extHostStatusBar.createStatusBarEntry(extension, id, alignment, priority);
                },
                setStatusBarMessage(text, timeoutOrThenable) {
                    return extHostStatusBar.setStatusBarMessage(text, timeoutOrThenable);
                },
                withScmProgress(task) {
                    extHostApiDeprecation.report('window.withScmProgress', extension, `Use 'withProgress' instead.`);
                    return extHostProgress.withProgress(extension, { location: extHostTypes.ProgressLocation.SourceControl }, (progress, token) => task({ report(n) { } }));
                },
                withProgress(options, task) {
                    return extHostProgress.withProgress(extension, options, task);
                },
                createOutputChannel(name, options) {
                    return extHostOutputService.createOutputChannel(name, options, extension);
                },
                createWebviewPanel(viewType, title, showOptions, options) {
                    return extHostWebviewPanels.createWebviewPanel(extension, viewType, title, showOptions, options);
                },
                createWebviewTextEditorInset(editor, line, height, options) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'editorInsets');
                    return extHostEditorInsets.createWebviewEditorInset(editor, line, height, options, extension);
                },
                createTerminal(nameOrOptions, shellPath, shellArgs) {
                    if (typeof nameOrOptions === 'object') {
                        if ('pty' in nameOrOptions) {
                            return extHostTerminalService.createExtensionTerminal(nameOrOptions);
                        }
                        return extHostTerminalService.createTerminalFromOptions(nameOrOptions);
                    }
                    return extHostTerminalService.createTerminal(nameOrOptions, shellPath, shellArgs);
                },
                registerTerminalLinkProvider(provider) {
                    return extHostTerminalService.registerLinkProvider(provider);
                },
                registerTerminalProfileProvider(id, provider) {
                    return extHostTerminalService.registerProfileProvider(extension, id, provider);
                },
                registerTerminalQuickFixProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalQuickFixProvider');
                    return extHostTerminalService.registerTerminalQuickFixProvider(id, extension.identifier.value, provider);
                },
                registerTreeDataProvider(viewId, treeDataProvider) {
                    return extHostTreeViews.registerTreeDataProvider(viewId, treeDataProvider, extension);
                },
                createTreeView(viewId, options) {
                    return extHostTreeViews.createTreeView(viewId, options, extension);
                },
                registerWebviewPanelSerializer: (viewType, serializer) => {
                    return extHostWebviewPanels.registerWebviewPanelSerializer(extension, viewType, serializer);
                },
                registerCustomEditorProvider: (viewType, provider, options = {}) => {
                    return extHostCustomEditors.registerCustomEditorProvider(extension, viewType, provider, options);
                },
                registerFileDecorationProvider(provider) {
                    return extHostDecorations.registerFileDecorationProvider(provider, extension);
                },
                registerUriHandler(handler) {
                    return extHostUrls.registerUriHandler(extension, handler);
                },
                createQuickPick() {
                    return extHostQuickOpen.createQuickPick(extension);
                },
                createInputBox() {
                    return extHostQuickOpen.createInputBox(extension);
                },
                get activeColorTheme() {
                    return extHostTheming.activeColorTheme;
                },
                onDidChangeActiveColorTheme(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTheming.onDidChangeActiveColorTheme)(listener, thisArg, disposables);
                },
                registerWebviewViewProvider(viewId, provider, options) {
                    return extHostWebviewViews.registerWebviewViewProvider(extension, viewId, provider, options?.webviewOptions);
                },
                get activeNotebookEditor() {
                    return extHostNotebook.activeNotebookEditor;
                },
                onDidChangeActiveNotebookEditor(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostNotebook.onDidChangeActiveNotebookEditor)(listener, thisArgs, disposables);
                },
                get visibleNotebookEditors() {
                    return extHostNotebook.visibleNotebookEditors;
                },
                get onDidChangeVisibleNotebookEditors() {
                    return _asExtensionEvent(extHostNotebook.onDidChangeVisibleNotebookEditors);
                },
                onDidChangeNotebookEditorSelection(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostNotebookEditors.onDidChangeNotebookEditorSelection)(listener, thisArgs, disposables);
                },
                onDidChangeNotebookEditorVisibleRanges(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostNotebookEditors.onDidChangeNotebookEditorVisibleRanges)(listener, thisArgs, disposables);
                },
                showNotebookDocument(document, options) {
                    return extHostNotebook.showNotebookDocument(document, options);
                },
                registerExternalUriOpener(id, opener, metadata) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'externalUriOpener');
                    return extHostUriOpeners.registerExternalUriOpener(extension.identifier, id, opener, metadata);
                },
                registerProfileContentHandler(id, handler) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'profileContentHandlers');
                    return extHostProfileContentHandlers.registerProfileContentHandler(extension, id, handler);
                },
                registerQuickDiffProvider(selector, quickDiffProvider, label, rootUri) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'quickDiffProvider');
                    return extHostQuickDiff.registerQuickDiffProvider(checkSelector(selector), quickDiffProvider, label, rootUri);
                },
                get tabGroups() {
                    return extHostEditorTabs.tabGroups;
                },
                registerShareProvider(selector, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'shareProvider');
                    return extHostShare.registerShareProvider(checkSelector(selector), provider);
                }
            };
            // namespace: workspace
            const workspace = {
                get rootPath() {
                    extHostApiDeprecation.report('workspace.rootPath', extension, `Please use 'workspace.workspaceFolders' instead. More details: https://aka.ms/vscode-eliminating-rootpath`);
                    return extHostWorkspace.getPath();
                },
                set rootPath(value) {
                    throw new errors.ReadonlyError('rootPath');
                },
                getWorkspaceFolder(resource) {
                    return extHostWorkspace.getWorkspaceFolder(resource);
                },
                get workspaceFolders() {
                    return extHostWorkspace.getWorkspaceFolders();
                },
                get name() {
                    return extHostWorkspace.name;
                },
                set name(value) {
                    throw new errors.ReadonlyError('name');
                },
                get workspaceFile() {
                    return extHostWorkspace.workspaceFile;
                },
                set workspaceFile(value) {
                    throw new errors.ReadonlyError('workspaceFile');
                },
                updateWorkspaceFolders: (index, deleteCount, ...workspaceFoldersToAdd) => {
                    return extHostWorkspace.updateWorkspaceFolders(extension, index, deleteCount || 0, ...workspaceFoldersToAdd);
                },
                onDidChangeWorkspaceFolders: function (listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostWorkspace.onDidChangeWorkspace)(listener, thisArgs, disposables);
                },
                asRelativePath: (pathOrUri, includeWorkspace) => {
                    return extHostWorkspace.getRelativePath(pathOrUri, includeWorkspace);
                },
                findFiles: (include, exclude, maxResults, token) => {
                    // Note, undefined/null have different meanings on "exclude"
                    return extHostWorkspace.findFiles(include, exclude, maxResults, extension.identifier, token);
                },
                findFiles2: (filePattern, options, token) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'findFiles2');
                    return extHostWorkspace.findFiles2(filePattern, options, extension.identifier, token);
                },
                findTextInFiles: (query, optionsOrCallback, callbackOrToken, token) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'findTextInFiles');
                    let options;
                    let callback;
                    if (typeof optionsOrCallback === 'object') {
                        options = optionsOrCallback;
                        callback = callbackOrToken;
                    }
                    else {
                        options = {};
                        callback = optionsOrCallback;
                        token = callbackOrToken;
                    }
                    return extHostWorkspace.findTextInFiles(query, options || {}, callback, extension.identifier, token);
                },
                save: (uri) => {
                    return extHostWorkspace.save(uri);
                },
                saveAs: (uri) => {
                    return extHostWorkspace.saveAs(uri);
                },
                saveAll: (includeUntitled) => {
                    return extHostWorkspace.saveAll(includeUntitled);
                },
                applyEdit(edit, metadata) {
                    return extHostBulkEdits.applyWorkspaceEdit(edit, extension, metadata);
                },
                createFileSystemWatcher: (pattern, optionsOrIgnoreCreate, ignoreChange, ignoreDelete) => {
                    let options = undefined;
                    if (typeof optionsOrIgnoreCreate === 'boolean') {
                        options = {
                            ignoreCreateEvents: Boolean(optionsOrIgnoreCreate),
                            ignoreChangeEvents: Boolean(ignoreChange),
                            ignoreDeleteEvents: Boolean(ignoreDelete),
                            correlate: false
                        };
                    }
                    else if (optionsOrIgnoreCreate) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'createFileSystemWatcher');
                        options = {
                            ...optionsOrIgnoreCreate,
                            correlate: true
                        };
                    }
                    return extHostFileSystemEvent.createFileSystemWatcher(extHostWorkspace, extension, pattern, options);
                },
                get textDocuments() {
                    return extHostDocuments.getAllDocumentData().map(data => data.document);
                },
                set textDocuments(value) {
                    throw new errors.ReadonlyError('textDocuments');
                },
                openTextDocument(uriOrFileNameOrOptions) {
                    let uriPromise;
                    const options = uriOrFileNameOrOptions;
                    if (typeof uriOrFileNameOrOptions === 'string') {
                        uriPromise = Promise.resolve(uri_1.URI.file(uriOrFileNameOrOptions));
                    }
                    else if (uri_1.URI.isUri(uriOrFileNameOrOptions)) {
                        uriPromise = Promise.resolve(uriOrFileNameOrOptions);
                    }
                    else if (!options || typeof options === 'object') {
                        uriPromise = extHostDocuments.createDocumentData(options);
                    }
                    else {
                        throw new Error('illegal argument - uriOrFileNameOrOptions');
                    }
                    return uriPromise.then(uri => {
                        if (uri.scheme === network_1.Schemas.vscodeRemote && !uri.authority) {
                            extHostApiDeprecation.report('workspace.openTextDocument', extension, `A URI of 'vscode-remote' scheme requires an authority.`);
                        }
                        return extHostDocuments.ensureDocumentData(uri).then(documentData => {
                            return documentData.document;
                        });
                    });
                },
                onDidOpenTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocuments.onDidAddDocument)(listener, thisArgs, disposables);
                },
                onDidCloseTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocuments.onDidRemoveDocument)(listener, thisArgs, disposables);
                },
                onDidChangeTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocuments.onDidChangeDocument)(listener, thisArgs, disposables);
                },
                onDidSaveTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocuments.onDidSaveDocument)(listener, thisArgs, disposables);
                },
                onWillSaveTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocumentSaveParticipant.getOnWillSaveTextDocumentEvent(extension))(listener, thisArgs, disposables);
                },
                get notebookDocuments() {
                    return extHostNotebook.notebookDocuments.map(d => d.apiNotebook);
                },
                async openNotebookDocument(uriOrType, content) {
                    let uri;
                    if (uri_1.URI.isUri(uriOrType)) {
                        uri = uriOrType;
                        await extHostNotebook.openNotebookDocument(uriOrType);
                    }
                    else if (typeof uriOrType === 'string') {
                        uri = uri_1.URI.revive(await extHostNotebook.createNotebookDocument({ viewType: uriOrType, content }));
                    }
                    else {
                        throw new Error('Invalid arguments');
                    }
                    return extHostNotebook.getNotebookDocument(uri).apiNotebook;
                },
                onDidSaveNotebookDocument(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostNotebookDocuments.onDidSaveNotebookDocument)(listener, thisArg, disposables);
                },
                onDidChangeNotebookDocument(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostNotebookDocuments.onDidChangeNotebookDocument)(listener, thisArg, disposables);
                },
                onWillSaveNotebookDocument(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostNotebookDocumentSaveParticipant.getOnWillSaveNotebookDocumentEvent(extension))(listener, thisArg, disposables);
                },
                get onDidOpenNotebookDocument() {
                    return _asExtensionEvent(extHostNotebook.onDidOpenNotebookDocument);
                },
                get onDidCloseNotebookDocument() {
                    return _asExtensionEvent(extHostNotebook.onDidCloseNotebookDocument);
                },
                registerNotebookSerializer(viewType, serializer, options, registration) {
                    return extHostNotebook.registerNotebookSerializer(extension, viewType, serializer, options, (0, extensions_2.isProposedApiEnabled)(extension, 'notebookLiveShare') ? registration : undefined);
                },
                onDidChangeConfiguration: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(configProvider.onDidChangeConfiguration)(listener, thisArgs, disposables);
                },
                getConfiguration(section, scope) {
                    scope = arguments.length === 1 ? undefined : scope;
                    return configProvider.getConfiguration(section, scope, extension);
                },
                registerTextDocumentContentProvider(scheme, provider) {
                    return extHostDocumentContentProviders.registerTextDocumentContentProvider(scheme, provider);
                },
                registerTaskProvider: (type, provider) => {
                    extHostApiDeprecation.report('window.registerTaskProvider', extension, `Use the corresponding function on the 'tasks' namespace instead`);
                    return extHostTask.registerTaskProvider(extension, type, provider);
                },
                registerFileSystemProvider(scheme, provider, options) {
                    return (0, lifecycle_1.combinedDisposable)(extHostFileSystem.registerFileSystemProvider(extension, scheme, provider, options), extHostConsumerFileSystem.addFileSystemProvider(scheme, provider, options));
                },
                get fs() {
                    return extHostConsumerFileSystem.value;
                },
                registerFileSearchProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'fileSearchProvider');
                    return extHostSearch.registerFileSearchProvider(scheme, provider);
                },
                registerTextSearchProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'textSearchProvider');
                    return extHostSearch.registerTextSearchProvider(scheme, provider);
                },
                registerAITextSearchProvider: (scheme, provider) => {
                    // there are some dependencies on textSearchProvider, so we need to check for both
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'aiTextSearchProvider');
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'textSearchProvider');
                    return extHostSearch.registerAITextSearchProvider(scheme, provider);
                },
                registerRemoteAuthorityResolver: (authorityPrefix, resolver) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return extensionService.registerRemoteAuthorityResolver(authorityPrefix, resolver);
                },
                registerResourceLabelFormatter: (formatter) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return extHostLabelService.$registerResourceLabelFormatter(formatter);
                },
                getRemoteExecServer: (authority) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return extensionService.getRemoteExecServer(authority);
                },
                onDidCreateFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.onDidCreateFile)(listener, thisArg, disposables);
                },
                onDidDeleteFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.onDidDeleteFile)(listener, thisArg, disposables);
                },
                onDidRenameFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.onDidRenameFile)(listener, thisArg, disposables);
                },
                onWillCreateFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.getOnWillCreateFileEvent(extension))(listener, thisArg, disposables);
                },
                onWillDeleteFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.getOnWillDeleteFileEvent(extension))(listener, thisArg, disposables);
                },
                onWillRenameFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.getOnWillRenameFileEvent(extension))(listener, thisArg, disposables);
                },
                openTunnel: (forward) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tunnels');
                    return extHostTunnelService.openTunnel(extension, forward).then(value => {
                        if (!value) {
                            throw new Error('cannot open tunnel');
                        }
                        return value;
                    });
                },
                get tunnels() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tunnels');
                    return extHostTunnelService.getTunnels();
                },
                onDidChangeTunnels: (listener, thisArg, disposables) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tunnels');
                    return _asExtensionEvent(extHostTunnelService.onDidChangeTunnels)(listener, thisArg, disposables);
                },
                registerPortAttributesProvider: (portSelector, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'portsAttributes');
                    return extHostTunnelService.registerPortsAttributesProvider(portSelector, provider);
                },
                registerTunnelProvider: (tunnelProvider, information) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tunnelFactory');
                    return extHostTunnelService.registerTunnelProvider(tunnelProvider, information);
                },
                registerTimelineProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'timeline');
                    return extHostTimeline.registerTimelineProvider(scheme, provider, extension.identifier, extHostCommands.converter);
                },
                get isTrusted() {
                    return extHostWorkspace.trusted;
                },
                requestWorkspaceTrust: (options) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'workspaceTrust');
                    return extHostWorkspace.requestWorkspaceTrust(options);
                },
                onDidGrantWorkspaceTrust: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostWorkspace.onDidGrantWorkspaceTrust)(listener, thisArgs, disposables);
                },
                registerEditSessionIdentityProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'editSessionIdentityProvider');
                    return extHostWorkspace.registerEditSessionIdentityProvider(scheme, provider);
                },
                onWillCreateEditSessionIdentity: (listener, thisArgs, disposables) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'editSessionIdentityProvider');
                    return _asExtensionEvent(extHostWorkspace.getOnWillCreateEditSessionIdentityEvent(extension))(listener, thisArgs, disposables);
                },
                registerCanonicalUriProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'canonicalUriProvider');
                    return extHostWorkspace.registerCanonicalUriProvider(scheme, provider);
                },
                getCanonicalUri: (uri, options, token) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'canonicalUriProvider');
                    return extHostWorkspace.provideCanonicalUri(uri, options, token);
                }
            };
            // namespace: scm
            const scm = {
                get inputBox() {
                    extHostApiDeprecation.report('scm.inputBox', extension, `Use 'SourceControl.inputBox' instead`);
                    return extHostSCM.getLastInputBox(extension); // Strict null override - Deprecated api
                },
                createSourceControl(id, label, rootUri) {
                    return extHostSCM.createSourceControl(extension, id, label, rootUri);
                }
            };
            // namespace: comments
            const comments = {
                createCommentController(id, label) {
                    return extHostComment.createCommentController(extension, id, label);
                }
            };
            // namespace: debug
            const debug = {
                get activeDebugSession() {
                    return extHostDebugService.activeDebugSession;
                },
                get activeDebugConsole() {
                    return extHostDebugService.activeDebugConsole;
                },
                get breakpoints() {
                    return extHostDebugService.breakpoints;
                },
                get activeStackItem() {
                    if (!(0, extensions_2.isProposedApiEnabled)(extension, 'debugFocus')) {
                        return undefined;
                    }
                    return extHostDebugService.activeStackItem;
                },
                registerDebugVisualizationProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'debugVisualization');
                    return extHostDebugService.registerDebugVisualizationProvider(extension, id, provider);
                },
                registerDebugVisualizationTreeProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'debugVisualization');
                    return extHostDebugService.registerDebugVisualizationTree(extension, id, provider);
                },
                onDidStartDebugSession(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidStartDebugSession)(listener, thisArg, disposables);
                },
                onDidTerminateDebugSession(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidTerminateDebugSession)(listener, thisArg, disposables);
                },
                onDidChangeActiveDebugSession(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidChangeActiveDebugSession)(listener, thisArg, disposables);
                },
                onDidReceiveDebugSessionCustomEvent(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidReceiveDebugSessionCustomEvent)(listener, thisArg, disposables);
                },
                onDidChangeBreakpoints(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidChangeBreakpoints)(listener, thisArgs, disposables);
                },
                onDidChangeActiveStackItem(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'debugFocus');
                    return _asExtensionEvent(extHostDebugService.onDidChangeActiveStackItem)(listener, thisArg, disposables);
                },
                registerDebugConfigurationProvider(debugType, provider, triggerKind) {
                    return extHostDebugService.registerDebugConfigurationProvider(debugType, provider, triggerKind || debug_1.DebugConfigurationProviderTriggerKind.Initial);
                },
                registerDebugAdapterDescriptorFactory(debugType, factory) {
                    return extHostDebugService.registerDebugAdapterDescriptorFactory(extension, debugType, factory);
                },
                registerDebugAdapterTrackerFactory(debugType, factory) {
                    return extHostDebugService.registerDebugAdapterTrackerFactory(debugType, factory);
                },
                startDebugging(folder, nameOrConfig, parentSessionOrOptions) {
                    if (!parentSessionOrOptions || (typeof parentSessionOrOptions === 'object' && 'configuration' in parentSessionOrOptions)) {
                        return extHostDebugService.startDebugging(folder, nameOrConfig, { parentSession: parentSessionOrOptions });
                    }
                    return extHostDebugService.startDebugging(folder, nameOrConfig, parentSessionOrOptions || {});
                },
                stopDebugging(session) {
                    return extHostDebugService.stopDebugging(session);
                },
                addBreakpoints(breakpoints) {
                    return extHostDebugService.addBreakpoints(breakpoints);
                },
                removeBreakpoints(breakpoints) {
                    return extHostDebugService.removeBreakpoints(breakpoints);
                },
                asDebugSourceUri(source, session) {
                    return extHostDebugService.asDebugSourceUri(source, session);
                }
            };
            const tasks = {
                registerTaskProvider: (type, provider) => {
                    return extHostTask.registerTaskProvider(extension, type, provider);
                },
                fetchTasks: (filter) => {
                    return extHostTask.fetchTasks(filter);
                },
                executeTask: (task) => {
                    return extHostTask.executeTask(extension, task);
                },
                get taskExecutions() {
                    return extHostTask.taskExecutions;
                },
                onDidStartTask: (listeners, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostTask.onDidStartTask)(listeners, thisArgs, disposables);
                },
                onDidEndTask: (listeners, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostTask.onDidEndTask)(listeners, thisArgs, disposables);
                },
                onDidStartTaskProcess: (listeners, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostTask.onDidStartTaskProcess)(listeners, thisArgs, disposables);
                },
                onDidEndTaskProcess: (listeners, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostTask.onDidEndTaskProcess)(listeners, thisArgs, disposables);
                }
            };
            // namespace: notebook
            const notebooks = {
                createNotebookController(id, notebookType, label, handler, rendererScripts) {
                    return extHostNotebookKernels.createNotebookController(extension, id, notebookType, label, handler, (0, extensions_2.isProposedApiEnabled)(extension, 'notebookMessaging') ? rendererScripts : undefined);
                },
                registerNotebookCellStatusBarItemProvider: (notebookType, provider) => {
                    return extHostNotebook.registerNotebookCellStatusBarItemProvider(extension, notebookType, provider);
                },
                createRendererMessaging(rendererId) {
                    return extHostNotebookRenderers.createRendererMessaging(extension, rendererId);
                },
                createNotebookControllerDetectionTask(notebookType) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookKernelSource');
                    return extHostNotebookKernels.createNotebookControllerDetectionTask(extension, notebookType);
                },
                registerKernelSourceActionProvider(notebookType, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookKernelSource');
                    return extHostNotebookKernels.registerKernelSourceActionProvider(extension, notebookType, provider);
                },
                onDidChangeNotebookCellExecutionState(listener, thisArgs, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookCellExecutionState');
                    return _asExtensionEvent(extHostNotebookKernels.onDidChangeNotebookCellExecutionState)(listener, thisArgs, disposables);
                }
            };
            // namespace: l10n
            const l10n = {
                t(...params) {
                    if (typeof params[0] === 'string') {
                        const key = params.shift();
                        // We have either rest args which are Array<string | number | boolean> or an array with a single Record<string, any>.
                        // This ensures we get a Record<string | number, any> which will be formatted correctly.
                        const argsFormatted = !params || typeof params[0] !== 'object' ? params : params[0];
                        return extHostLocalization.getMessage(extension.identifier.value, { message: key, args: argsFormatted });
                    }
                    return extHostLocalization.getMessage(extension.identifier.value, params[0]);
                },
                get bundle() {
                    return extHostLocalization.getBundle(extension.identifier.value);
                },
                get uri() {
                    return extHostLocalization.getBundleUri(extension.identifier.value);
                }
            };
            // namespace: interactive
            const interactive = {
                // IMPORTANT
                // this needs to be updated whenever the API proposal changes
                _version: 1,
                registerInteractiveEditorSessionProvider(provider, metadata) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'interactive');
                    return extHostInteractiveEditor.registerProvider(extension, provider, metadata);
                },
                transferActiveChat(toWorkspace) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'interactive');
                    return extHostChatAgents2.transferActiveChat(toWorkspace);
                }
            };
            // namespace: ai
            const ai = {
                getRelatedInformation(query, types) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'aiRelatedInformation');
                    return extHostAiRelatedInformation.getRelatedInformation(extension, query, types);
                },
                registerRelatedInformationProvider(type, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'aiRelatedInformation');
                    return extHostAiRelatedInformation.registerRelatedInformationProvider(extension, type, provider);
                },
                registerEmbeddingVectorProvider(model, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'aiRelatedInformation');
                    return extHostAiEmbeddingVector.registerEmbeddingVectorProvider(extension, model, provider);
                }
            };
            // namespace: chat
            const chat = {
                registerChatResponseProvider(id, provider, metadata) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'chatProvider');
                    return extHostLanguageModels.registerLanguageModel(extension, id, provider, metadata);
                },
                registerChatVariableResolver(name, description, resolver) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'chatVariableResolver');
                    return extHostChatVariables.registerVariableResolver(extension, name, description, resolver);
                },
                registerMappedEditsProvider(selector, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'mappedEditsProvider');
                    return extHostLanguageFeatures.registerMappedEditsProvider(extension, selector, provider);
                },
                createChatParticipant(id, handler) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'chatParticipant');
                    return extHostChatAgents2.createChatAgent(extension, id, handler);
                },
                createDynamicChatParticipant(id, name, description, handler) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'chatParticipantAdditions');
                    return extHostChatAgents2.createDynamicChatAgent(extension, id, name, description, handler);
                }
            };
            // namespace: lm
            const lm = {
                get languageModels() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'languageModels');
                    return extHostLanguageModels.getLanguageModelIds();
                },
                onDidChangeLanguageModels: (listener, thisArgs, disposables) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'languageModels');
                    return extHostLanguageModels.onDidChangeProviders(listener, thisArgs, disposables);
                },
                sendChatRequest(languageModel, messages, options, token) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'languageModels');
                    return extHostLanguageModels.sendChatRequest(extension, languageModel, messages, options, token);
                },
                computeTokenLength(languageModel, text, token) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'languageModels');
                    token ??= cancellation_1.CancellationToken.None;
                    return extHostLanguageModels.computeTokenLength(languageModel, text, token);
                },
                getLanguageModelInformation(languageModel) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'languageModels');
                    return extHostLanguageModels.getLanguageModelInfo(languageModel);
                }
            };
            // namespace: speech
            const speech = {
                registerSpeechProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'speech');
                    return extHostSpeech.registerProvider(extension.identifier, id, provider);
                }
            };
            return {
                version: initData.version,
                // namespaces
                ai,
                authentication,
                commands,
                comments,
                chat,
                debug,
                env,
                extensions,
                interactive,
                l10n,
                languages,
                lm,
                notebooks,
                scm,
                speech,
                tasks,
                tests,
                window,
                workspace,
                // types
                Breakpoint: extHostTypes.Breakpoint,
                TerminalOutputAnchor: extHostTypes.TerminalOutputAnchor,
                ChatResultFeedbackKind: extHostTypes.ChatResultFeedbackKind,
                ChatVariableLevel: extHostTypes.ChatVariableLevel,
                ChatCompletionItem: extHostTypes.ChatCompletionItem,
                CallHierarchyIncomingCall: extHostTypes.CallHierarchyIncomingCall,
                CallHierarchyItem: extHostTypes.CallHierarchyItem,
                CallHierarchyOutgoingCall: extHostTypes.CallHierarchyOutgoingCall,
                CancellationError: errors.CancellationError,
                CancellationTokenSource: cancellation_1.CancellationTokenSource,
                CandidatePortSource: extHost_protocol_1.CandidatePortSource,
                CodeAction: extHostTypes.CodeAction,
                CodeActionKind: extHostTypes.CodeActionKind,
                CodeActionTriggerKind: extHostTypes.CodeActionTriggerKind,
                CodeLens: extHostTypes.CodeLens,
                Color: extHostTypes.Color,
                ColorInformation: extHostTypes.ColorInformation,
                ColorPresentation: extHostTypes.ColorPresentation,
                ColorThemeKind: extHostTypes.ColorThemeKind,
                CommentMode: extHostTypes.CommentMode,
                CommentState: extHostTypes.CommentState,
                CommentThreadCollapsibleState: extHostTypes.CommentThreadCollapsibleState,
                CommentThreadState: extHostTypes.CommentThreadState,
                CommentThreadApplicability: extHostTypes.CommentThreadApplicability,
                CompletionItem: extHostTypes.CompletionItem,
                CompletionItemKind: extHostTypes.CompletionItemKind,
                CompletionItemTag: extHostTypes.CompletionItemTag,
                CompletionList: extHostTypes.CompletionList,
                CompletionTriggerKind: extHostTypes.CompletionTriggerKind,
                ConfigurationTarget: extHostTypes.ConfigurationTarget,
                CustomExecution: extHostTypes.CustomExecution,
                DebugAdapterExecutable: extHostTypes.DebugAdapterExecutable,
                DebugAdapterInlineImplementation: extHostTypes.DebugAdapterInlineImplementation,
                DebugAdapterNamedPipeServer: extHostTypes.DebugAdapterNamedPipeServer,
                DebugAdapterServer: extHostTypes.DebugAdapterServer,
                DebugConfigurationProviderTriggerKind: debug_1.DebugConfigurationProviderTriggerKind,
                DebugConsoleMode: extHostTypes.DebugConsoleMode,
                DebugVisualization: extHostTypes.DebugVisualization,
                DecorationRangeBehavior: extHostTypes.DecorationRangeBehavior,
                Diagnostic: extHostTypes.Diagnostic,
                DiagnosticRelatedInformation: extHostTypes.DiagnosticRelatedInformation,
                DiagnosticSeverity: extHostTypes.DiagnosticSeverity,
                DiagnosticTag: extHostTypes.DiagnosticTag,
                Disposable: extHostTypes.Disposable,
                DocumentHighlight: extHostTypes.DocumentHighlight,
                DocumentHighlightKind: extHostTypes.DocumentHighlightKind,
                MultiDocumentHighlight: extHostTypes.MultiDocumentHighlight,
                DocumentLink: extHostTypes.DocumentLink,
                DocumentSymbol: extHostTypes.DocumentSymbol,
                EndOfLine: extHostTypes.EndOfLine,
                EnvironmentVariableMutatorType: extHostTypes.EnvironmentVariableMutatorType,
                EvaluatableExpression: extHostTypes.EvaluatableExpression,
                InlineValueText: extHostTypes.InlineValueText,
                InlineValueVariableLookup: extHostTypes.InlineValueVariableLookup,
                InlineValueEvaluatableExpression: extHostTypes.InlineValueEvaluatableExpression,
                InlineCompletionTriggerKind: extHostTypes.InlineCompletionTriggerKind,
                EventEmitter: event_1.Emitter,
                ExtensionKind: extHostTypes.ExtensionKind,
                ExtensionMode: extHostTypes.ExtensionMode,
                ExternalUriOpenerPriority: extHostTypes.ExternalUriOpenerPriority,
                FileChangeType: extHostTypes.FileChangeType,
                FileDecoration: extHostTypes.FileDecoration,
                FileDecoration2: extHostTypes.FileDecoration,
                FileSystemError: extHostTypes.FileSystemError,
                FileType: files.FileType,
                FilePermission: files.FilePermission,
                FoldingRange: extHostTypes.FoldingRange,
                FoldingRangeKind: extHostTypes.FoldingRangeKind,
                FunctionBreakpoint: extHostTypes.FunctionBreakpoint,
                InlineCompletionItem: extHostTypes.InlineSuggestion,
                InlineCompletionList: extHostTypes.InlineSuggestionList,
                Hover: extHostTypes.Hover,
                VerboseHover: extHostTypes.VerboseHover,
                HoverVerbosityAction: extHostTypes.HoverVerbosityAction,
                IndentAction: languageConfiguration.IndentAction,
                Location: extHostTypes.Location,
                MarkdownString: extHostTypes.MarkdownString,
                OverviewRulerLane: model_1.OverviewRulerLane,
                ParameterInformation: extHostTypes.ParameterInformation,
                PortAutoForwardAction: extHostTypes.PortAutoForwardAction,
                Position: extHostTypes.Position,
                ProcessExecution: extHostTypes.ProcessExecution,
                ProgressLocation: extHostTypes.ProgressLocation,
                QuickInputButtons: extHostTypes.QuickInputButtons,
                Range: extHostTypes.Range,
                RelativePattern: extHostTypes.RelativePattern,
                Selection: extHostTypes.Selection,
                SelectionRange: extHostTypes.SelectionRange,
                SemanticTokens: extHostTypes.SemanticTokens,
                SemanticTokensBuilder: extHostTypes.SemanticTokensBuilder,
                SemanticTokensEdit: extHostTypes.SemanticTokensEdit,
                SemanticTokensEdits: extHostTypes.SemanticTokensEdits,
                SemanticTokensLegend: extHostTypes.SemanticTokensLegend,
                ShellExecution: extHostTypes.ShellExecution,
                ShellQuoting: extHostTypes.ShellQuoting,
                SignatureHelp: extHostTypes.SignatureHelp,
                SignatureHelpTriggerKind: extHostTypes.SignatureHelpTriggerKind,
                SignatureInformation: extHostTypes.SignatureInformation,
                SnippetString: extHostTypes.SnippetString,
                SourceBreakpoint: extHostTypes.SourceBreakpoint,
                StandardTokenType: extHostTypes.StandardTokenType,
                StatusBarAlignment: extHostTypes.StatusBarAlignment,
                SymbolInformation: extHostTypes.SymbolInformation,
                SymbolKind: extHostTypes.SymbolKind,
                SymbolTag: extHostTypes.SymbolTag,
                Task: extHostTypes.Task,
                TaskGroup: extHostTypes.TaskGroup,
                TaskPanelKind: extHostTypes.TaskPanelKind,
                TaskRevealKind: extHostTypes.TaskRevealKind,
                TaskScope: extHostTypes.TaskScope,
                TerminalLink: extHostTypes.TerminalLink,
                TerminalQuickFixTerminalCommand: extHostTypes.TerminalQuickFixCommand,
                TerminalQuickFixOpener: extHostTypes.TerminalQuickFixOpener,
                TerminalLocation: extHostTypes.TerminalLocation,
                TerminalProfile: extHostTypes.TerminalProfile,
                TerminalExitReason: extHostTypes.TerminalExitReason,
                TerminalShellExecutionCommandLineConfidence: extHostTypes.TerminalShellExecutionCommandLineConfidence,
                TextDocumentSaveReason: extHostTypes.TextDocumentSaveReason,
                TextEdit: extHostTypes.TextEdit,
                SnippetTextEdit: extHostTypes.SnippetTextEdit,
                TextEditorCursorStyle: editorOptions_1.TextEditorCursorStyle,
                TextEditorLineNumbersStyle: extHostTypes.TextEditorLineNumbersStyle,
                TextEditorRevealType: extHostTypes.TextEditorRevealType,
                TextEditorSelectionChangeKind: extHostTypes.TextEditorSelectionChangeKind,
                SyntaxTokenType: extHostTypes.SyntaxTokenType,
                TextDocumentChangeReason: extHostTypes.TextDocumentChangeReason,
                ThemeColor: extHostTypes.ThemeColor,
                ThemeIcon: extHostTypes.ThemeIcon,
                TreeItem: extHostTypes.TreeItem,
                TreeItemCheckboxState: extHostTypes.TreeItemCheckboxState,
                TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
                TypeHierarchyItem: extHostTypes.TypeHierarchyItem,
                UIKind: extensionHostProtocol_1.UIKind,
                Uri: uri_1.URI,
                ViewColumn: extHostTypes.ViewColumn,
                WorkspaceEdit: extHostTypes.WorkspaceEdit,
                // proposed api types
                DocumentPasteTriggerKind: extHostTypes.DocumentPasteTriggerKind,
                DocumentDropEdit: extHostTypes.DocumentDropEdit,
                DocumentDropOrPasteEditKind: extHostTypes.DocumentDropOrPasteEditKind,
                DocumentPasteEdit: extHostTypes.DocumentPasteEdit,
                InlayHint: extHostTypes.InlayHint,
                InlayHintLabelPart: extHostTypes.InlayHintLabelPart,
                InlayHintKind: extHostTypes.InlayHintKind,
                RemoteAuthorityResolverError: extHostTypes.RemoteAuthorityResolverError,
                ResolvedAuthority: extHostTypes.ResolvedAuthority,
                ManagedResolvedAuthority: extHostTypes.ManagedResolvedAuthority,
                SourceControlInputBoxValidationType: extHostTypes.SourceControlInputBoxValidationType,
                ExtensionRuntime: extHostTypes.ExtensionRuntime,
                TimelineItem: extHostTypes.TimelineItem,
                NotebookRange: extHostTypes.NotebookRange,
                NotebookCellKind: extHostTypes.NotebookCellKind,
                NotebookCellExecutionState: extHostTypes.NotebookCellExecutionState,
                NotebookCellData: extHostTypes.NotebookCellData,
                NotebookData: extHostTypes.NotebookData,
                NotebookRendererScript: extHostTypes.NotebookRendererScript,
                NotebookCellStatusBarAlignment: extHostTypes.NotebookCellStatusBarAlignment,
                NotebookEditorRevealType: extHostTypes.NotebookEditorRevealType,
                NotebookCellOutput: extHostTypes.NotebookCellOutput,
                NotebookCellOutputItem: extHostTypes.NotebookCellOutputItem,
                NotebookCellStatusBarItem: extHostTypes.NotebookCellStatusBarItem,
                NotebookControllerAffinity: extHostTypes.NotebookControllerAffinity,
                NotebookControllerAffinity2: extHostTypes.NotebookControllerAffinity2,
                NotebookEdit: extHostTypes.NotebookEdit,
                NotebookKernelSourceAction: extHostTypes.NotebookKernelSourceAction,
                NotebookVariablesRequestKind: extHostTypes.NotebookVariablesRequestKind,
                PortAttributes: extHostTypes.PortAttributes,
                LinkedEditingRanges: extHostTypes.LinkedEditingRanges,
                TestResultState: extHostTypes.TestResultState,
                TestRunRequest: extHostTypes.TestRunRequest,
                TestRunRequest2: extHostTypes.TestRunRequest,
                TestMessage: extHostTypes.TestMessage,
                TestTag: extHostTypes.TestTag,
                TestRunProfileKind: extHostTypes.TestRunProfileKind,
                TextSearchCompleteMessageType: searchExtTypes_1.TextSearchCompleteMessageType,
                DataTransfer: extHostTypes.DataTransfer,
                DataTransferItem: extHostTypes.DataTransferItem,
                TestCoverageCount: extHostTypes.TestCoverageCount,
                FileCoverage: extHostTypes.FileCoverage,
                StatementCoverage: extHostTypes.StatementCoverage,
                BranchCoverage: extHostTypes.BranchCoverage,
                DeclarationCoverage: extHostTypes.DeclarationCoverage,
                WorkspaceTrustState: extHostTypes.WorkspaceTrustState,
                LanguageStatusSeverity: extHostTypes.LanguageStatusSeverity,
                QuickPickItemKind: extHostTypes.QuickPickItemKind,
                InputBoxValidationSeverity: extHostTypes.InputBoxValidationSeverity,
                TabInputText: extHostTypes.TextTabInput,
                TabInputTextDiff: extHostTypes.TextDiffTabInput,
                TabInputTextMerge: extHostTypes.TextMergeTabInput,
                TabInputCustom: extHostTypes.CustomEditorTabInput,
                TabInputNotebook: extHostTypes.NotebookEditorTabInput,
                TabInputNotebookDiff: extHostTypes.NotebookDiffEditorTabInput,
                TabInputWebview: extHostTypes.WebviewEditorTabInput,
                TabInputTerminal: extHostTypes.TerminalEditorTabInput,
                TabInputInteractiveWindow: extHostTypes.InteractiveWindowInput,
                TabInputChat: extHostTypes.ChatEditorTabInput,
                TabInputTextMultiDiff: extHostTypes.TextMultiDiffTabInput,
                TelemetryTrustedValue: telemetryUtils_1.TelemetryTrustedValue,
                LogLevel: log_1.LogLevel,
                EditSessionIdentityMatch: editSessions_1.EditSessionIdentityMatch,
                InteractiveSessionVoteDirection: extHostTypes.InteractiveSessionVoteDirection,
                ChatCopyKind: extHostTypes.ChatCopyKind,
                InteractiveEditorResponseFeedbackKind: extHostTypes.InteractiveEditorResponseFeedbackKind,
                DebugStackFrame: extHostTypes.DebugStackFrame,
                DebugThread: extHostTypes.DebugThread,
                RelatedInformationType: extHostTypes.RelatedInformationType,
                SpeechToTextStatus: extHostTypes.SpeechToTextStatus,
                PartialAcceptTriggerKind: extHostTypes.PartialAcceptTriggerKind,
                KeywordRecognitionStatus: extHostTypes.KeywordRecognitionStatus,
                ChatResponseMarkdownPart: extHostTypes.ChatResponseMarkdownPart,
                ChatResponseFileTreePart: extHostTypes.ChatResponseFileTreePart,
                ChatResponseAnchorPart: extHostTypes.ChatResponseAnchorPart,
                ChatResponseProgressPart: extHostTypes.ChatResponseProgressPart,
                ChatResponseReferencePart: extHostTypes.ChatResponseReferencePart,
                ChatResponseTextEditPart: extHostTypes.ChatResponseTextEditPart,
                ChatResponseMarkdownWithVulnerabilitiesPart: extHostTypes.ChatResponseMarkdownWithVulnerabilitiesPart,
                ChatResponseCommandButtonPart: extHostTypes.ChatResponseCommandButtonPart,
                ChatResponseDetectedParticipantPart: extHostTypes.ChatResponseDetectedParticipantPart,
                ChatRequestTurn: extHostTypes.ChatRequestTurn,
                ChatResponseTurn: extHostTypes.ChatResponseTurn,
                ChatLocation: extHostTypes.ChatLocation,
                LanguageModelChatSystemMessage: extHostTypes.LanguageModelChatSystemMessage,
                LanguageModelChatUserMessage: extHostTypes.LanguageModelChatUserMessage,
                LanguageModelChatAssistantMessage: extHostTypes.LanguageModelChatAssistantMessage,
                LanguageModelSystemMessage: extHostTypes.LanguageModelChatSystemMessage, // TODO@jrieken REMOVE
                LanguageModelUserMessage: extHostTypes.LanguageModelChatUserMessage, // TODO@jrieken REMOVE
                LanguageModelAssistantMessage: extHostTypes.LanguageModelChatAssistantMessage, // TODO@jrieken REMOVE
                LanguageModelError: extHostTypes.LanguageModelError,
                NewSymbolName: extHostTypes.NewSymbolName,
                NewSymbolNameTag: extHostTypes.NewSymbolNameTag,
                NewSymbolNameTriggerKind: extHostTypes.NewSymbolNameTriggerKind,
                InlineEdit: extHostTypes.InlineEdit,
                InlineEditTriggerKind: extHostTypes.InlineEditTriggerKind,
            };
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdC5hcGkuaW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3QuYXBpLmltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1SGhHLDhFQXNrREM7SUF6a0REOztPQUVHO0lBQ0gsU0FBZ0IsaUNBQWlDLENBQUMsUUFBMEI7UUFFM0UsV0FBVztRQUNYLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0RBQXVCLENBQUMsQ0FBQztRQUN2RCxNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOENBQXNCLENBQUMsQ0FBQztRQUNuRSxNQUFNLHlCQUF5QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0RBQTBCLENBQUMsQ0FBQztRQUMzRSxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0RBQXdCLENBQUMsQ0FBQztRQUNoRSxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0NBQWlCLENBQUMsQ0FBQztRQUN6RCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0NBQWlCLENBQUMsQ0FBQztRQUN6RCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNENBQXFCLENBQUMsQ0FBQztRQUNqRSxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFEQUFzQixDQUFDLENBQUM7UUFDNUQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzQ0FBa0IsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0NBQWUsQ0FBQyxDQUFDO1FBQ3JELE1BQU0scUJBQXFCLEdBQUcsUUFB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