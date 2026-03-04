/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/editorWorker", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageService", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/services/textResourceConfiguration", "vs/editor/test/browser/config/testConfiguration", "vs/editor/test/browser/editorTestServices", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/test/common/services/testEditorWorkerService", "vs/editor/test/common/services/testTextResourcePropertiesService", "vs/editor/test/common/testTextModel", "vs/platform/accessibility/common/accessibility", "vs/platform/accessibility/test/common/testAccessibilityService", "vs/platform/clipboard/common/clipboardService", "vs/platform/clipboard/test/common/testClipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/opener/common/opener", "vs/platform/opener/test/common/nullOpenerService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService"], function (require, exports, lifecycle_1, mock_1, codeEditorService_1, codeEditorWidget_1, language_1, languageConfigurationRegistry_1, editorWorker_1, languageFeatureDebounce_1, languageFeatures_1, languageFeaturesService_1, languageService_1, model_1, modelService_1, textResourceConfiguration_1, testConfiguration_1, editorTestServices_1, testLanguageConfigurationService_1, testEditorWorkerService_1, testTextResourcePropertiesService_1, testTextModel_1, accessibility_1, testAccessibilityService_1, clipboardService_1, testClipboardService_1, commands_1, configuration_1, testConfigurationService_1, contextkey_1, dialogs_1, testDialogService_1, environment_1, descriptors_1, serviceCollection_1, instantiationServiceMock_1, keybinding_1, mockKeybindingService_1, log_1, notification_1, testNotificationService_1, opener_1, nullOpenerService_1, telemetry_1, telemetryUtils_1, themeService_1, testThemeService_1, undoRedo_1, undoRedoService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestCodeEditor = void 0;
    exports.withTestCodeEditor = withTestCodeEditor;
    exports.withAsyncTestCodeEditor = withAsyncTestCodeEditor;
    exports.createCodeEditorServices = createCodeEditorServices;
    exports.createTestCodeEditor = createTestCodeEditor;
    exports.instantiateTestCodeEditor = instantiateTestCodeEditor;
    class TestCodeEditor extends codeEditorWidget_1.CodeEditorWidget {
        constructor() {
            super(...arguments);
            this._hasTextFocus = false;
        }
        //#region testing overrides
        _createConfiguration(isSimpleWidget, contextMenuId, options) {
            return new testConfiguration_1.TestConfiguration(options);
        }
        _createView(viewModel) {
            // Never create a view
            return [null, false];
        }
        setHasTextFocus(hasTextFocus) {
            this._hasTextFocus = hasTextFocus;
        }
        hasTextFocus() {
            return this._hasTextFocus;
        }
        //#endregion
        //#region Testing utils
        getViewModel() {
            return this._modelData ? this._modelData.viewModel : undefined;
        }
        registerAndInstantiateContribution(id, ctor) {
            const r = this._instantiationService.createInstance(ctor, this);
            this._contributions.set(id, r);
            return r;
        }
        registerDisposable(disposable) {
            this._register(disposable);
        }
    }
    exports.TestCodeEditor = TestCodeEditor;
    class TestEditorDomElement {
        constructor() {
            this.parentElement = null;
            this.ownerDocument = document;
            this.document = document;
        }
        setAttribute(attr, value) { }
        removeAttribute(attr) { }
        hasAttribute(attr) { return false; }
        getAttribute(attr) { return undefined; }
        addEventListener(event) { }
        removeEventListener(event) { }
    }
    function withTestCodeEditor(text, options, callback) {
        return _withTestCodeEditor(text, options, callback);
    }
    async function withAsyncTestCodeEditor(text, options, callback) {
        return _withTestCodeEditor(text, options, callback);
    }
    function isTextModel(arg) {
        return Boolean(arg && arg.uri);
    }
    function _withTestCodeEditor(arg, options, callback) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = createCodeEditorServices(disposables, options.serviceCollection);
        delete options.serviceCollection;
        // create a model if necessary
        let model;
        if (isTextModel(arg)) {
            model = arg;
        }
        else {
            model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, Array.isArray(arg) ? arg.join('\n') : arg));
        }
        const editor = disposables.add(instantiateTestCodeEditor(instantiationService, model, options));
        const viewModel = editor.getViewModel();
        viewModel.setHasFocus(true);
        const result = callback(editor, editor.getViewModel(), instantiationService);
        if (result) {
            return result.then(() => disposables.dispose());
        }
        disposables.dispose();
    }
    function createCodeEditorServices(disposables, services = new serviceCollection_1.ServiceCollection()) {
        const serviceIdentifiers = [];
        const define = (id, ctor) => {
            if (!services.has(id)) {
                services.set(id, new descriptors_1.SyncDescriptor(ctor));
            }
            serviceIdentifiers.push(id);
        };
        const defineInstance = (id, instance) => {
            if (!services.has(id)) {
                services.set(id, instance);
            }
            serviceIdentifiers.push(id);
        };
        define(accessibility_1.IAccessibilityService, testAccessibilityService_1.TestAccessibilityService);
        define(keybinding_1.IKeybindingService, mockKeybindingService_1.MockKeybindingService);
        define(clipboardService_1.IClipboardService, testClipboardService_1.TestClipboardService);
        define(editorWorker_1.IEditorWorkerService, testEditorWorkerService_1.TestEditorWorkerService);
        defineInstance(opener_1.IOpenerService, nullOpenerService_1.NullOpenerService);
        define(notification_1.INotificationService, testNotificationService_1.TestNotificationService);
        define(dialogs_1.IDialogService, testDialogService_1.TestDialogService);
        define(undoRedo_1.IUndoRedoService, undoRedoService_1.UndoRedoService);
        define(language_1.ILanguageService, languageService_1.LanguageService);
        define(languageConfigurationRegistry_1.ILanguageConfigurationService, testLanguageConfigurationService_1.TestLanguageConfigurationService);
        define(configuration_1.IConfigurationService, testConfigurationService_1.TestConfigurationService);
        define(textResourceConfiguration_1.ITextResourcePropertiesService, testTextResourcePropertiesService_1.TestTextResourcePropertiesService);
        define(themeService_1.IThemeService, testThemeService_1.TestThemeService);
        define(log_1.ILogService, log_1.NullLogService);
        define(model_1.IModelService, modelService_1.ModelService);
        define(codeEditorService_1.ICodeEditorService, editorTestServices_1.TestCodeEditorService);
        define(contextkey_1.IContextKeyService, mockKeybindingService_1.MockContextKeyService);
        define(commands_1.ICommandService, editorTestServices_1.TestCommandService);
        define(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryServiceShape);
        define(environment_1.IEnvironmentService, class extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.isBuilt = true;
                this.isExtensionDevelopment = false;
            }
        });
        define(languageFeatureDebounce_1.ILanguageFeatureDebounceService, languageFeatureDebounce_1.LanguageFeatureDebounceService);
        define(languageFeatures_1.ILanguageFeaturesService, languageFeaturesService_1.LanguageFeaturesService);
        const instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService(services, true));
        disposables.add((0, lifecycle_1.toDisposable)(() => {
            for (const id of serviceIdentifiers) {
                const instanceOrDescriptor = services.get(id);
                if (typeof instanceOrDescriptor.dispose === 'function') {
                    instanceOrDescriptor.dispose();
                }
            }
        }));
        return instantiationService;
    }
    function createTestCodeEditor(model, options = {}) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = createCodeEditorServices(disposables, options.serviceCollection);
        delete options.serviceCollection;
        const editor = instantiateTestCodeEditor(instantiationService, model || null, options);
        editor.registerDisposable(disposables);
        return editor;
    }
    function instantiateTestCodeEditor(instantiationService, model, options = {}) {
        const codeEditorWidgetOptions = {
            contributions: []
        };
        const editor = instantiationService.createInstance(TestCodeEditor, new TestEditorDomElement(), options, codeEditorWidgetOptions);
        if (typeof options.hasTextFocus === 'undefined') {
            options.hasTextFocus = true;
        }
        editor.setHasTextFocus(options.hasTextFocus);
        editor.setModel(model);
        const viewModel = editor.getViewModel();
        viewModel?.setHasFocus(options.hasTextFocus);
        return editor;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvZGVFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL3Rlc3RDb2RlRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTBJaEcsZ0RBRUM7SUFFRCwwREFFQztJQWdDRCw0REFvREM7SUFFRCxvREFRQztJQUVELDhEQWtCQztJQWpNRCxNQUFhLGNBQWUsU0FBUSxtQ0FBZ0I7UUFBcEQ7O1lBVVMsa0JBQWEsR0FBRyxLQUFLLENBQUM7UUFxQi9CLENBQUM7UUE3QkEsMkJBQTJCO1FBQ1Isb0JBQW9CLENBQUMsY0FBdUIsRUFBRSxhQUFxQixFQUFFLE9BQWdEO1lBQ3ZJLE9BQU8sSUFBSSxxQ0FBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBQ2tCLFdBQVcsQ0FBQyxTQUFvQjtZQUNsRCxzQkFBc0I7WUFDdEIsT0FBTyxDQUFDLElBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU0sZUFBZSxDQUFDLFlBQXFCO1lBQzNDLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1FBQ25DLENBQUM7UUFDZSxZQUFZO1lBQzNCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBQ0QsWUFBWTtRQUVaLHVCQUF1QjtRQUNoQixZQUFZO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNoRSxDQUFDO1FBQ00sa0NBQWtDLENBQWdDLEVBQVUsRUFBRSxJQUFtRTtZQUN2SixNQUFNLENBQUMsR0FBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJ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