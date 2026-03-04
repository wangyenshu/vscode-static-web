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
define(["require", "exports", "vs/base/common/strings", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/event", "vs/base/common/keybindings", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/common/services/textResourceConfiguration", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/label/common/label", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/layout/browser/layoutService", "vs/editor/common/standaloneStrings", "vs/base/common/resources", "vs/editor/browser/services/codeEditorService", "vs/platform/log/common/log", "vs/platform/workspace/common/workspaceTrust", "vs/platform/contextview/browser/contextView", "vs/platform/contextview/browser/contextViewService", "vs/editor/common/services/languageService", "vs/platform/contextview/browser/contextMenuService", "vs/platform/instantiation/common/extensions", "vs/editor/browser/services/openerService", "vs/editor/common/services/editorWorker", "vs/editor/browser/services/editorWorkerService", "vs/editor/common/languages/language", "vs/editor/common/services/markerDecorationsService", "vs/editor/common/services/markerDecorations", "vs/editor/common/services/modelService", "vs/editor/standalone/browser/quickInput/standaloneQuickInputService", "vs/editor/standalone/browser/standaloneThemeService", "vs/editor/standalone/common/standaloneTheme", "vs/platform/accessibility/browser/accessibilityService", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/actions/common/menuService", "vs/platform/clipboard/browser/clipboardService", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/list/browser/listService", "vs/platform/markers/common/markers", "vs/platform/markers/common/markerService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configurations", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/log/common/logService", "vs/editor/common/editorFeatures", "vs/base/common/errors", "vs/platform/environment/common/environment", "vs/base/browser/window", "vs/base/common/map", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/standalone/browser/standaloneCodeEditorService", "vs/editor/standalone/browser/standaloneLayoutService", "vs/platform/undoRedo/common/undoRedoService", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/semanticTokensStylingService", "vs/editor/common/services/languageFeaturesService", "vs/editor/browser/services/hoverService/hoverService"], function (require, exports, strings, dom, keyboardEvent_1, event_1, keybindings_1, lifecycle_1, platform_1, severity_1, uri_1, bulkEditService_1, editorConfigurationSchema_1, editOperation_1, position_1, range_1, model_1, resolverService_1, textResourceConfiguration_1, commands_1, configuration_1, configurationModels_1, contextkey_1, dialogs_1, instantiation_1, abstractKeybindingService_1, keybinding_1, keybindingResolver_1, keybindingsRegistry_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, label_1, notification_1, progress_1, telemetry_1, workspace_1, layoutService_1, standaloneStrings_1, resources_1, codeEditorService_1, log_1, workspaceTrust_1, contextView_1, contextViewService_1, languageService_1, contextMenuService_1, extensions_1, openerService_1, editorWorker_1, editorWorkerService_1, language_1, markerDecorationsService_1, markerDecorations_1, modelService_1, standaloneQuickInputService_1, standaloneThemeService_1, standaloneTheme_1, accessibilityService_1, accessibility_1, actions_1, menuService_1, clipboardService_1, clipboardService_2, contextKeyService_1, descriptors_1, instantiationService_1, serviceCollection_1, listService_1, markers_1, markerService_1, opener_1, quickInput_1, storage_1, configurations_1, accessibilitySignalService_1, logService_1, editorFeatures_1, errors_1, environment_1, window_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneServices = exports.StandaloneConfigurationService = exports.StandaloneKeybindingService = exports.StandaloneCommandService = exports.StandaloneNotificationService = void 0;
    exports.updateConfigurationService = updateConfigurationService;
    class SimpleModel {
        constructor(model) {
            this.disposed = false;
            this.model = model;
            this._onWillDispose = new event_1.Emitter();
        }
        get onWillDispose() {
            return this._onWillDispose.event;
        }
        resolve() {
            return Promise.resolve();
        }
        get textEditorModel() {
            return this.model;
        }
        createSnapshot() {
            return this.model.createSnapshot();
        }
        isReadonly() {
            return false;
        }
        dispose() {
            this.disposed = true;
            this._onWillDispose.fire();
        }
        isDisposed() {
            return this.disposed;
        }
        isResolved() {
            return true;
        }
        getLanguageId() {
            return this.model.getLanguageId();
        }
    }
    let StandaloneTextModelService = class StandaloneTextModelService {
        constructor(modelService) {
            this.modelService = modelService;
        }
        createModelReference(resource) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return Promise.reject(new Error(`Model not found`));
            }
            return Promise.resolve(new lifecycle_1.ImmortalReference(new SimpleModel(model)));
        }
        registerTextModelContentProvider(scheme, provider) {
            return {
                dispose: function () { }
            };
        }
        canHandleResource(resource) {
            return false;
        }
    };
    StandaloneTextModelService = __decorate([
        __param(0, model_1.IModelService)
    ], StandaloneTextModelService);
    class StandaloneEditorProgressService {
        static { this.NULL_PROGRESS_RUNNER = {
            done: () => { },
            total: () => { },
            worked: () => { }
        }; }
        show() {
            return StandaloneEditorProgressService.NULL_PROGRESS_RUNNER;
        }
        async showWhile(promise, delay) {
            await promise;
        }
    }
    class StandaloneProgressService {
        withProgress(_options, task, onDidCancel) {
            return task({
                report: () => { },
            });
        }
    }
    class StandaloneEnvironmentService {
        constructor() {
            this.stateResource = uri_1.URI.from({ scheme: 'monaco', authority: 'stateResource' });
            this.userRoamingDataHome = uri_1.URI.from({ scheme: 'monaco', authority: 'userRoamingDataHome' });
            this.keyboardLayoutResource = uri_1.URI.from({ scheme: 'monaco', authority: 'keyboardLayoutResource' });
            this.argvResource = uri_1.URI.from({ scheme: 'monaco', authority: 'argvResource' });
            this.untitledWorkspacesHome = uri_1.URI.from({ scheme: 'monaco', authority: 'untitledWorkspacesHome' });
            this.workspaceStorageHome = uri_1.URI.from({ scheme: 'monaco', authority: 'workspaceStorageHome' });
            this.localHistoryHome = uri_1.URI.from({ scheme: 'monaco', authority: 'localHistoryHome' });
            this.cacheHome = uri_1.URI.from({ scheme: 'monaco', authority: 'cacheHome' });
            this.userDataSyncHome = uri_1.URI.from({ scheme: 'monaco', authority: 'userDataSyncHome' });
            this.sync = undefined;
            this.continueOn = undefined;
            this.editSessionId = undefined;
            this.debugExtensionHost = { port: null, break: false };
            this.isExtensionDevelopment = false;
            this.disableExtensions = false;
            this.enableExtensions = undefined;
            this.extensionDevelopmentLocationURI = undefined;
            this.extensionDevelopmentKind = undefined;
            this.extensionTestsLocationURI = undefined;
            this.logsHome = uri_1.URI.from({ scheme: 'monaco', authority: 'logsHome' });
            this.logLevel = undefined;
            this.extensionLogLevel = undefined;
            this.verbose = false;
            this.isBuilt = false;
            this.disableTelemetry = false;
            this.serviceMachineIdResource = uri_1.URI.from({ scheme: 'monaco', authority: 'serviceMachineIdResource' });
            this.policyFile = undefined;
        }
    }
    class StandaloneDialogService {
        constructor() {
            this.onWillShowDialog = event_1.Event.None;
            this.onDidShowDialog = event_1.Event.None;
        }
        async confirm(confirmation) {
            const confirmed = this.doConfirm(confirmation.message, confirmation.detail);
            return {
                confirmed,
                checkboxChecked: false // unsupported
            };
        }
        doConfirm(message, detail) {
            let messageText = message;
            if (detail) {
                messageText = messageText + '\n\n' + detail;
            }
            return window_1.mainWindow.confirm(messageText);
        }
        async prompt(prompt) {
            let result = undefined;
            const confirmed = this.doConfirm(prompt.message, prompt.detail);
            if (confirmed) {
                const promptButtons = [...(prompt.buttons ?? [])];
                if (prompt.cancelButton && typeof prompt.cancelButton !== 'string' && typeof prompt.cancelButton !== 'boolean') {
                    promptButtons.push(prompt.cancelButton);
                }
                result = await promptButtons[0]?.run({ checkboxChecked: false });
            }
            return { result };
        }
        async info(message, detail) {
            await this.prompt({ type: severity_1.default.Info, message, detail });
        }
        async warn(message, detail) {
            await this.prompt({ type: severity_1.default.Warning, message, detail });
        }
        async error(message, detail) {
            await this.prompt({ type: severity_1.default.Error, message, detail });
        }
        input() {
            return Promise.resolve({ confirmed: false }); // unsupported
        }
        about() {
            return Promise.resolve(undefined);
        }
    }
    class StandaloneNotificationService {
        constructor() {
            this.onDidAddNotification = event_1.Event.None;
            this.onDidRemoveNotification = event_1.Event.None;
            this.onDidChangeFilter = event_1.Event.None;
        }
        static { this.NO_OP = new notification_1.NoOpNotification(); }
        info(message) {
            return this.notify({ severity: severity_1.default.Info, message });
        }
        warn(message) {
            return this.notify({ severity: severity_1.default.Warning, message });
        }
        error(error) {
            return this.notify({ severity: severity_1.default.Error, message: error });
        }
        notify(notification) {
            switch (notification.severity) {
                case severity_1.default.Error:
                    console.error(notification.message);
                    break;
                case severity_1.default.Warning:
                    console.warn(notification.message);
                    break;
                default:
                    console.log(notification.message);
                    break;
            }
            return StandaloneNotificationService.NO_OP;
        }
        prompt(severity, message, choices, options) {
            return StandaloneNotificationService.NO_OP;
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
        setFilter(filter) { }
        getFilter(source) {
            return notification_1.NotificationsFilter.OFF;
        }
        getFilters() {
            return [];
        }
        removeFilter(sourceId) { }
    }
    exports.StandaloneNotificationService = StandaloneNotificationService;
    let StandaloneCommandService = class StandaloneCommandService {
        constructor(instantiationService) {
            this._onWillExecuteCommand = new event_1.Emitter();
            this._onDidExecuteCommand = new event_1.Emitter();
            this.onWillExecuteCommand = this._onWillExecuteCommand.event;
            this.onDidExecuteCommand = this._onDidExecuteCommand.event;
            this._instantiationService = instantiationService;
        }
        executeCommand(id, ...args) {
            const command = commands_1.CommandsRegistry.getCommand(id);
            if (!command) {
                return Promise.reject(new Error(`command '${id}' not found`));
            }
            try {
                this._onWillExecuteCommand.fire({ commandId: id, args });
                const result = this._instantiationService.invokeFunction.apply(this._instantiationService, [command.handler, ...args]);
                this._onDidExecuteCommand.fire({ commandId: id, args });
                return Promise.resolve(result);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    };
    exports.StandaloneCommandService = StandaloneCommandService;
    exports.StandaloneCommandService = StandaloneCommandService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], StandaloneCommandService);
    let StandaloneKeybindingService = class StandaloneKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
        constructor(contextKeyService, commandService, telemetryService, notificationService, logService, codeEditorService) {
            super(contextKeyService, commandService, telemetryService, notificationService, logService);
            this._cachedResolver = null;
            this._dynamicKeybindings = [];
            this._domNodeListeners = [];
            const addContainer = (domNode) => {
                const disposables = new lifecycle_1.DisposableStore();
                // for standard keybindings
                disposables.add(dom.addDisposableListener(domNode, dom.EventType.KEY_DOWN, (e) => {
                    const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    const shouldPreventDefault = this._dispatch(keyEvent, keyEvent.target);
                    if (shouldPreventDefault) {
                        keyEvent.preventDefault();
                        keyEvent.stopPropagation();
                    }
                }));
                // for single modifier chord keybindings (e.g. shift shift)
                disposables.add(dom.addDisposableListener(domNode, dom.EventType.KEY_UP, (e) => {
                    const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    const shouldPreventDefault = this._singleModifierDispatch(keyEvent, keyEvent.target);
                    if (shouldPreventDefault) {
                        keyEvent.preventDefault();
                    }
                }));
                this._domNodeListeners.push(new DomNodeListeners(domNode, disposables));
            };
            const removeContainer = (domNode) => {
                for (let i = 0; i < this._domNodeListeners.length; i++) {
                    const domNodeListeners = this._domNodeListeners[i];
                    if (domNodeListeners.domNode === domNode) {
                        this._domNodeListeners.splice(i, 1);
                        domNodeListeners.dispose();
                    }
                }
            };
            const addCodeEditor = (codeEditor) => {
                if (codeEditor.getOption(61 /* EditorOption.inDiffEditor */)) {
                    return;
                }
                addContainer(codeEditor.getContainerDomNode());
            };
            const removeCodeEditor = (codeEditor) => {
                if (codeEditor.getOption(61 /* EditorOption.inDiffEditor */)) {
                    return;
                }
                removeContainer(codeEditor.getContainerDomNode());
            };
            this._register(codeEditorService.onCodeEditorAdd(addCodeEditor));
            this._register(codeEditorService.onCodeEditorRemove(removeCodeEditor));
            codeEditorService.listCodeEditors().forEach(addCodeEditor);
            const addDiffEditor = (diffEditor) => {
                addContainer(diffEditor.getContainerDomNode());
            };
            const removeDiffEditor = (diffEditor) => {
                removeContainer(diffEditor.getContainerDomNode());
            };
            this._register(codeEditorService.onDiffEditorAdd(addDiffEditor));
            this._register(codeEditorService.onDiffEditorRemove(removeDiffEditor));
            codeEditorService.listDiffEditors().forEach(addDiffEditor);
        }
        addDynamicKeybinding(command, keybinding, handler, when) {
            return (0, lifecycle_1.combinedDisposable)(commands_1.CommandsRegistry.registerCommand(command, handler), this.addDynamicKeybindings([{
                    keybinding,
                    command,
                    when
                }]));
        }
        addDynamicKeybindings(rules) {
            const entries = rules.map((rule) => {
                const keybinding = (0, keybindings_1.decodeKeybinding)(rule.keybinding, platform_1.OS);
                return {
                    keybinding,
                    command: rule.command ?? null,
                    commandArgs: rule.commandArgs,
                    when: rule.when,
                    weight1: 1000,
                    weight2: 0,
                    extensionId: null,
                    isBuiltinExtension: false
                };
            });
            this._dynamicKeybindings = this._dynamicKeybindings.concat(entries);
            this.updateResolver();
            return (0, lifecycle_1.toDisposable)(() => {
                // Search the first entry and remove them all since they will be contiguous
                for (let i = 0; i < this._dynamicKeybindings.length; i++) {
                    if (this._dynamicKeybindings[i] === entries[0]) {
                        this._dynamicKeybindings.splice(i, entries.length);
                        this.updateResolver();
                        return;
                    }
                }
            });
        }
        updateResolver() {
            this._cachedResolver = null;
            this._onDidUpdateKeybindings.fire();
        }
        _getResolver() {
            if (!this._cachedResolver) {
                const defaults = this._toNormalizedKeybindingItems(keybindingsRegistry_1.KeybindingsRegistry.getDefaultKeybindings(), true);
                const overrides = this._toNormalizedKeybindingItems(this._dynamicKeybindings, false);
                this._cachedResolver = new keybindingResolver_1.KeybindingResolver(defaults, overrides, (str) => this._log(str));
            }
            return this._cachedResolver;
        }
        _documentHasFocus() {
            return window_1.mainWindow.document.hasFocus();
        }
        _toNormalizedKeybindingItems(items, isDefault) {
            const result = [];
            let resultLen = 0;
            for (const item of items) {
                const when = item.when || undefined;
                const keybinding = item.keybinding;
                if (!keybinding) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault, null, false);
                }
                else {
                    const resolvedKeybindings = usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, platform_1.OS);
                    for (const resolvedKeybinding of resolvedKeybindings) {
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault, null, false);
                    }
                }
            }
            return result;
        }
        resolveKeybinding(keybinding) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, platform_1.OS);
        }
        resolveKeyboardEvent(keyboardEvent) {
            const chord = new keybindings_1.KeyCodeChord(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding([chord], platform_1.OS);
        }
        resolveUserBinding(userBinding) {
            return [];
        }
        _dumpDebugInfo() {
            return '';
        }
        _dumpDebugInfoJSON() {
            return '';
        }
        registerSchemaContribution(contribution) {
            // noop
        }
        /**
         * not yet supported
         */
        enableKeybindingHoldMode(commandId) {
            return undefined;
        }
    };
    exports.StandaloneKeybindingService = StandaloneKeybindingService;
    exports.StandaloneKeybindingService = StandaloneKeybindingService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, codeEditorService_1.ICodeEditorService)
    ], StandaloneKeybindingService);
    class DomNodeListeners extends lifecycle_1.Disposable {
        constructor(domNode, disposables) {
            super();
            this.domNode = domNode;
            this._register(disposables);
        }
    }
    function isConfigurationOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifier || typeof thing.overrideIdentifier === 'string')
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    let StandaloneConfigurationService = class StandaloneConfigurationService {
        constructor(logService) {
            this.logService = logService;
            this._onDidChangeConfiguration = new event_1.Emitter();
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            const defaultConfiguration = new configurations_1.DefaultConfiguration(logService);
            this._configuration = new configurationModels_1.Configuration(defaultConfiguration.reload(), configurationModels_1.ConfigurationModel.createEmptyModel(logService), configurationModels_1.ConfigurationModel.createEmptyModel(logService), configurationModels_1.ConfigurationModel.createEmptyModel(logService), configurationModels_1.ConfigurationModel.createEmptyModel(logService), configurationModels_1.ConfigurationModel.createEmptyModel(logService), new map_1.ResourceMap(), configurationModels_1.ConfigurationModel.createEmptyModel(logService), new map_1.ResourceMap(), logService);
            defaultConfiguration.dispose();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = isConfigurationOverrides(arg1) ? arg1 : isConfigurationOverrides(arg2) ? arg2 : {};
            return this._configuration.getValue(section, overrides, undefined);
        }
        updateValues(values) {
            const previous = { data: this._configuration.toData() };
            const changedKeys = [];
            for (const entry of values) {
                const [key, value] = entry;
                if (this.getValue(key) === value) {
                    continue;
                }
                this._configuration.updateValue(key, value);
                changedKeys.push(key);
            }
            if (changedKeys.length > 0) {
                const configurationChangeEvent = new configurationModels_1.ConfigurationChangeEvent({ keys: changedKeys, overrides: [] }, previous, this._configuration, undefined, this.logService);
                configurationChangeEvent.source = 8 /* ConfigurationTarget.MEMORY */;
                this._onDidChangeConfiguration.fire(configurationChangeEvent);
            }
            return Promise.resolve();
        }
        updateValue(key, value, arg3, arg4) {
            return this.updateValues([[key, value]]);
        }
        inspect(key, options = {}) {
            return this._configuration.inspect(key, options, undefined);
        }
        keys() {
            return this._configuration.keys(undefined);
        }
        reloadConfiguration() {
            return Promise.resolve(undefined);
        }
        getConfigurationData() {
            const emptyModel = {
                contents: {},
                keys: [],
                overrides: []
            };
            return {
                defaults: emptyModel,
                policy: emptyModel,
                application: emptyModel,
                user: emptyModel,
                workspace: emptyModel,
                folders: []
            };
        }
    };
    exports.StandaloneConfigurationService = StandaloneConfigurationService;
    exports.StandaloneConfigurationService = StandaloneConfigurationService = __decorate([
        __param(0, log_1.ILogService)
    ], StandaloneConfigurationService);
    let StandaloneResourceConfigurationService = class StandaloneResourceConfigurationService {
        constructor(configurationService, modelService, languageService) {
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.languageService = languageService;
            this._onDidChangeConfiguration = new event_1.Emitter();
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.configurationService.onDidChangeConfiguration((e) => {
                this._onDidChangeConfiguration.fire({ affectedKeys: e.affectedKeys, affectsConfiguration: (resource, configuration) => e.affectsConfiguration(configuration) });
            });
        }
        getValue(resource, arg2, arg3) {
            const position = position_1.Position.isIPosition(arg2) ? arg2 : null;
            const section = position ? (typeof arg3 === 'string' ? arg3 : undefined) : (typeof arg2 === 'string' ? arg2 : undefined);
            const language = resource ? this.getLanguage(resource, position) : undefined;
            if (typeof section === 'undefined') {
                return this.configurationService.getValue({
                    resource,
                    overrideIdentifier: language
                });
            }
            return this.configurationService.getValue(section, {
                resource,
                overrideIdentifier: language
            });
        }
        inspect(resource, position, section) {
            const language = resource ? this.getLanguage(resource, position) : undefined;
            return this.configurationService.inspect(section, { resource, overrideIdentifier: language });
        }
        getLanguage(resource, position) {
            const model = this.modelService.getModel(resource);
            if (model) {
                return position ? model.getLanguageIdAtPosition(position.lineNumber, position.column) : model.getLanguageId();
            }
            return this.languageService.guessLanguageIdByFilepathOrFirstLine(resource);
        }
        updateValue(resource, key, value, configurationTarget) {
            return this.configurationService.updateValue(key, value, { resource }, configurationTarget);
        }
    };
    StandaloneResourceConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], StandaloneResourceConfigurationService);
    let StandaloneResourcePropertiesService = class StandaloneResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n';
        }
    };
    StandaloneResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], StandaloneResourcePropertiesService);
    class StandaloneTelemetryService {
        constructor() {
            this.telemetryLevel = 0 /* TelemetryLevel.NONE */;
            this.sessionId = 'someValue.sessionId';
            this.machineId = 'someValue.machineId';
            this.sqmId = 'someValue.sqmId';
            this.firstSessionDate = 'someValue.firstSessionDate';
            this.sendErrorTelemetry = false;
        }
        setEnabled() { }
        setExperimentProperty() { }
        publicLog() { }
        publicLog2() { }
        publicLogError() { }
        publicLogError2() { }
    }
    class StandaloneWorkspaceContextService {
        static { this.SCHEME = 'inmemory'; }
        constructor() {
            this._onDidChangeWorkspaceName = new event_1.Emitter();
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onWillChangeWorkspaceFolders = new event_1.Emitter();
            this.onWillChangeWorkspaceFolders = this._onWillChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceFolders = new event_1.Emitter();
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkbenchState = new event_1.Emitter();
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            const resource = uri_1.URI.from({ scheme: StandaloneWorkspaceContextService.SCHEME, authority: 'model', path: '/' });
            this.workspace = { id: workspace_1.STANDALONE_EDITOR_WORKSPACE_ID, folders: [new workspace_1.WorkspaceFolder({ uri: resource, name: '', index: 0 })] };
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            if (this.workspace) {
                if (this.workspace.configuration) {
                    return 3 /* WorkbenchState.WORKSPACE */;
                }
                return 2 /* WorkbenchState.FOLDER */;
            }
            return 1 /* WorkbenchState.EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return resource && resource.scheme === StandaloneWorkspaceContextService.SCHEME ? this.workspace.folders[0] : null;
        }
        isInsideWorkspace(resource) {
            return resource && resource.scheme === StandaloneWorkspaceContextService.SCHEME;
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            return true;
        }
    }
    function updateConfigurationService(configurationService, source, isDiffEditor) {
        if (!source) {
            return;
        }
        if (!(configurationService instanceof StandaloneConfigurationService)) {
            return;
        }
        const toUpdate = [];
        Object.keys(source).forEach((key) => {
            if ((0, editorConfigurationSchema_1.isEditorConfigurationKey)(key)) {
                toUpdate.push([`editor.${key}`, source[key]]);
            }
            if (isDiffEditor && (0, editorConfigurationSchema_1.isDiffEditorConfigurationKey)(key)) {
                toUpdate.push([`diffEditor.${key}`, source[key]]);
            }
        });
        if (toUpdate.length > 0) {
            configurationService.updateValues(toUpdate);
        }
    }
    let StandaloneBulkEditService = class StandaloneBulkEditService {
        constructor(_modelService) {
            this._modelService = _modelService;
            //
        }
        hasPreviewHandler() {
            return false;
        }
        setPreviewHandler() {
            return lifecycle_1.Disposable.None;
        }
        async apply(editsIn, _options) {
            const edits = Array.isArray(editsIn) ? editsIn : bulkEditService_1.ResourceEdit.convert(editsIn);
            const textEdits = new Map();
            for (const edit of edits) {
                if (!(edit instanceof bulkEditService_1.ResourceTextEdit)) {
                    throw new Error('bad edit - only text edits are supported');
                }
                const model = this._modelService.getModel(edit.resource);
                if (!model) {
                    throw new Error('bad edit - model not found');
                }
                if (typeof edit.versionId === 'number' && model.getVersionId() !== edit.versionId) {
                    throw new Error('bad state - model changed in the meantime');
                }
                let array = textEdits.get(model);
                if (!array) {
                    array = [];
                    textEdits.set(model, array);
                }
                array.push(editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.textEdit.range), edit.textEdit.text));
            }
            let totalEdits = 0;
            let totalFiles = 0;
            for (const [model, edits] of textEdits) {
                model.pushStackElement();
                model.pushEditOperations([], edits, () => []);
                model.pushStackElement();
                totalFiles += 1;
                totalEdits += edits.length;
            }
            return {
                ariaSummary: strings.format(standaloneStrings_1.StandaloneServicesNLS.bulkEditServiceSummary, totalEdits, totalFiles),
                isApplied: totalEdits > 0
            };
        }
    };
    StandaloneBulkEditService = __decorate([
        __param(0, model_1.IModelService)
    ], StandaloneBulkEditService);
    class StandaloneUriLabelService {
        constructor() {
            this.onDidChangeFormatters = event_1.Event.None;
        }
        getUriLabel(resource, options) {
            if (resource.scheme === 'file') {
                return resource.fsPath;
            }
            return resource.path;
        }
        getUriBasenameLabel(resource) {
            return (0, resources_1.basename)(resource);
        }
        getWorkspaceLabel(workspace, options) {
            return '';
        }
        getSeparator(scheme, authority) {
            return '/';
        }
        registerFormatter(formatter) {
            throw new Error('Not implemented');
        }
        registerCachedFormatter(formatter) {
            return this.registerFormatter(formatter);
        }
        getHostLabel() {
            return '';
        }
        getHostTooltip() {
            return undefined;
        }
    }
    let StandaloneContextViewService = class StandaloneContextViewService extends contextViewService_1.ContextViewService {
        constructor(layoutService, _codeEditorService) {
            super(layoutService);
            this._codeEditorService = _codeEditorService;
        }
        showContextView(delegate, container, shadowRoot) {
            if (!container) {
                const codeEditor = this._codeEditorService.getFocusedCodeEditor() || this._codeEditorService.getActiveCodeEditor();
                if (codeEditor) {
                    container = codeEditor.getContainerDomNode();
                }
            }
            return super.showContextView(delegate, container, shadowRoot);
        }
    };
    StandaloneContextViewService = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], StandaloneContextViewService);
    class StandaloneWorkspaceTrustManagementService {
        constructor() {
            this._neverEmitter = new event_1.Emitter();
            this.onDidChangeTrust = this._neverEmitter.event;
            this.onDidChangeTrustedFolders = this._neverEmitter.event;
            this.workspaceResolved = Promise.resolve();
            this.workspaceTrustInitialized = Promise.resolve();
            this.acceptsOutOfWorkspaceFiles = true;
        }
        isWorkspaceTrusted() {
            return true;
        }
        isWorkspaceTrustForced() {
            return false;
        }
        canSetParentFolderTrust() {
            return false;
        }
        async setParentFolderTrust(trusted) {
            // noop
        }
        canSetWorkspaceTrust() {
            return false;
        }
        async setWorkspaceTrust(trusted) {
            // noop
        }
        getUriTrustInfo(uri) {
            throw new Error('Method not supported.');
        }
        async setUrisTrust(uri, trusted) {
            // noop
        }
        getTrustedUris() {
            return [];
        }
        async setTrustedUris(uris) {
            // noop
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            throw new Error('Method not supported.');
        }
    }
    class StandaloneLanguageService extends languageService_1.LanguageService {
        constructor() {
            super();
        }
    }
    class StandaloneLogService extends logService_1.LogService {
        constructor() {
            super(new log_1.ConsoleLogger());
        }
    }
    let StandaloneContextMenuService = class StandaloneContextMenuService extends contextMenuService_1.ContextMenuService {
        constructor(telemetryService, notificationService, contextViewService, keybindingService, menuService, contextKeyService) {
            super(telemetryService, notificationService, contextViewService, keybindingService, menuService, contextKeyService);
            this.configure({ blockMouse: false }); // we do not want that in the standalone editor
        }
    };
    StandaloneContextMenuService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService),
        __param(2, contextView_1.IContextViewService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_1.IMenuService),
        __param(5, contextkey_1.IContextKeyService)
    ], StandaloneContextMenuService);
    class StandaloneAccessbilitySignalService {
        async playSignal(cue, options) {
        }
        async playSignals(cues) {
        }
        getEnabledState(signal, userGesture, modality) {
            return event_1.ValueWithChangeEvent.const(false);
        }
        isSoundEnabled(cue) {
            return false;
        }
        isAnnouncementEnabled(cue) {
            return false;
        }
        onSoundEnabledChanged(cue) {
            return event_1.Event.None;
        }
        async playSound(cue, allowManyInParallel) {
        }
        playSignalLoop(cue) {
            return (0, lifecycle_1.toDisposable)(() => { });
        }
    }
    (0, extensions_1.registerSingleton)(log_1.ILogService, StandaloneLogService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(configuration_1.IConfigurationService, StandaloneConfigurationService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(textResourceConfiguration_1.ITextResourceConfigurationService, StandaloneResourceConfigurationService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(textResourceConfiguration_1.ITextResourcePropertiesService, StandaloneResourcePropertiesService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(workspace_1.IWorkspaceContextService, StandaloneWorkspaceContextService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(label_1.ILabelService, StandaloneUriLabelService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(telemetry_1.ITelemetryService, StandaloneTelemetryService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(dialogs_1.IDialogService, StandaloneDialogService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(environment_1.IEnvironmentService, StandaloneEnvironmentService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(notification_1.INotificationService, StandaloneNotificationService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(markers_1.IMarkerService, markerService_1.MarkerService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(language_1.ILanguageService, StandaloneLanguageService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(standaloneTheme_1.IStandaloneThemeService, standaloneThemeService_1.StandaloneThemeService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(model_1.IModelService, modelService_1.ModelService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(markerDecorations_1.IMarkerDecorationsService, markerDecorationsService_1.MarkerDecorationsService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(contextkey_1.IContextKeyService, contextKeyService_1.ContextKeyService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(progress_1.IProgressService, StandaloneProgressService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(progress_1.IEditorProgressService, StandaloneEditorProgressService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(storage_1.IStorageService, storage_1.InMemoryStorageService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(editorWorker_1.IEditorWorkerService, editorWorkerService_1.EditorWorkerService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(bulkEditService_1.IBulkEditService, StandaloneBulkEditService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(workspaceTrust_1.IWorkspaceTrustManagementService, StandaloneWorkspaceTrustManagementService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(resolverService_1.ITextModelService, StandaloneTextModelService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(accessibility_1.IAccessibilityService, accessibilityService_1.AccessibilityService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(listService_1.IListService, listService_1.ListService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(commands_1.ICommandService, StandaloneCommandService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(keybinding_1.IKeybindingService, StandaloneKeybindingService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(quickInput_1.IQuickInputService, standaloneQuickInputService_1.StandaloneQuickInputService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(contextView_1.IContextViewService, StandaloneContextViewService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(opener_1.IOpenerService, openerService_1.OpenerService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(clipboardService_2.IClipboardService, clipboardService_1.BrowserClipboardService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(contextView_1.IContextMenuService, StandaloneContextMenuService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(actions_1.IMenuService, menuService_1.MenuService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(accessibilitySignalService_1.IAccessibilitySignalService, StandaloneAccessbilitySignalService, 0 /* InstantiationType.Eager */);
    /**
     * We don't want to eagerly instantiate services because embedders get a one time chance
     * to override services when they create the first editor.
     */
    var StandaloneServices;
    (function (StandaloneServices) {
        const serviceCollection = new serviceCollection_1.ServiceCollection();
        for (const [id, descriptor] of (0, extensions_1.getSingletonServiceDescriptors)()) {
            serviceCollection.set(id, descriptor);
        }
        const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
        serviceCollection.set(instantiation_1.IInstantiationService, instantiationService);
        function get(serviceId) {
            if (!initialized) {
                initialize({});
            }
            const r = serviceCollection.get(serviceId);
            if (!r) {
                throw new Error('Missing service ' + serviceId);
            }
            if (r instanceof descriptors_1.SyncDescriptor) {
                return instantiationService.invokeFunction((accessor) => accessor.get(serviceId));
            }
            else {
                return r;
            }
        }
        StandaloneServices.get = get;
        let initialized = false;
        const onDidInitialize = new event_1.Emitter();
        function initialize(overrides) {
            if (initialized) {
                return instantiationService;
            }
            initialized = true;
            // Add singletons that were registered after this module loaded
            for (const [id, descriptor] of (0, extensions_1.getSingletonServiceDescriptors)()) {
                if (!serviceCollection.get(id)) {
                    serviceCollection.set(id, descriptor);
                }
            }
            // Initialize the service collection with the overrides, but only if the
            // service was not instantiated in the meantime.
            for (const serviceId in overrides) {
                if (overrides.hasOwnProperty(serviceId)) {
                    const serviceIdentifier = (0, instantiation_1.createDecorator)(serviceId);
                    const r = serviceCollection.get(serviceIdentifier);
                    if (r instanceof descriptors_1.SyncDescriptor) {
                        serviceCollection.set(serviceIdentifier, overrides[serviceId]);
                    }
                }
            }
            // Instantiate all editor features
            const editorFeatures = (0, editorFeatures_1.getEditorFeatures)();
            for (const feature of editorFeatures) {
                try {
                    instantiationService.createInstance(feature);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            onDidInitialize.fire();
            return instantiationService;
        }
        StandaloneServices.initialize = initialize;
        /**
         * Executes callback once services are initialized.
         */
        function withServices(callback) {
            if (initialized) {
                return callback();
            }
            const disposable = new lifecycle_1.DisposableStore();
            const listener = disposable.add(onDidInitialize.event(() => {
                listener.dispose();
                disposable.add(callback());
            }));
            return disposable;
        }
        StandaloneServices.withServices = withServices;
    })(StandaloneServices || (exports.StandaloneServices = StandaloneServices = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9zdGFuZGFsb25lU2VydmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeTFCaEcsZ0VBbUJDO0lBN3dCRCxNQUFNLFdBQVc7UUFLaEIsWUFBWSxLQUFpQjtZQXlCckIsYUFBUSxHQUFHLEtBQUssQ0FBQztZQXhCeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1FBQzNDLENBQUM7UUFFRCxJQUFXLGFBQWE7WUFDdkIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztRQUNsQyxDQUFDO1FBRU0sT0FBTztZQUNiLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFRCxJQUFXLGVBQWU7WUFDekIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFTSxjQUFjO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFHTSxPQUFPO1lBQ2IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFFckIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVNLFVBQVU7WUFDaEIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU0sYUFBYTtZQUNuQixP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