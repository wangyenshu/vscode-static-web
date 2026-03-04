/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/language", "vs/editor/common/services/languageService", "vs/editor/common/services/textResourceConfiguration", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/editor/test/common/services/testTextResourcePropertiesService", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService", "vs/platform/environment/common/environment", "vs/base/test/common/mock"], function (require, exports, lifecycle_1, textModel_1, languageConfigurationRegistry_1, language_1, languageService_1, textResourceConfiguration_1, testLanguageConfigurationService_1, configuration_1, testConfigurationService_1, dialogs_1, testDialogService_1, log_1, notification_1, testNotificationService_1, themeService_1, testThemeService_1, undoRedo_1, undoRedoService_1, testTextResourcePropertiesService_1, model_1, modelService_1, instantiationServiceMock_1, modesRegistry_1, languageFeatureDebounce_1, languageFeatures_1, languageFeaturesService_1, environment_1, mock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.withEditorModel = withEditorModel;
    exports.createTextModel = createTextModel;
    exports.instantiateTextModel = instantiateTextModel;
    exports.createModelServices = createModelServices;
    class TestTextModel extends textModel_1.TextModel {
        registerDisposable(disposable) {
            this._register(disposable);
        }
    }
    function withEditorModel(text, callback) {
        const model = createTextModel(text.join('\n'));
        callback(model);
        model.dispose();
    }
    function resolveOptions(_options) {
        const defaultOptions = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS;
        return {
            tabSize: (typeof _options.tabSize === 'undefined' ? defaultOptions.tabSize : _options.tabSize),
            indentSize: (typeof _options.indentSize === 'undefined' ? defaultOptions.indentSize : _options.indentSize),
            insertSpaces: (typeof _options.insertSpaces === 'undefined' ? defaultOptions.insertSpaces : _options.insertSpaces),
            detectIndentation: (typeof _options.detectIndentation === 'undefined' ? defaultOptions.detectIndentation : _options.detectIndentation),
            trimAutoWhitespace: (typeof _options.trimAutoWhitespace === 'undefined' ? defaultOptions.trimAutoWhitespace : _options.trimAutoWhitespace),
            defaultEOL: (typeof _options.defaultEOL === 'undefined' ? defaultOptions.defaultEOL : _options.defaultEOL),
            isForSimpleWidget: (typeof _options.isForSimpleWidget === 'undefined' ? defaultOptions.isForSimpleWidget : _options.isForSimpleWidget),
            largeFileOptimizations: (typeof _options.largeFileOptimizations === 'undefined' ? defaultOptions.largeFileOptimizations : _options.largeFileOptimizations),
            bracketPairColorizationOptions: (typeof _options.bracketColorizationOptions === 'undefined' ? defaultOptions.bracketPairColorizationOptions : _options.bracketColorizationOptions),
        };
    }
    function createTextModel(text, languageId = null, options = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, uri = null) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = createModelServices(disposables);
        const model = instantiateTextModel(instantiationService, text, languageId, options, uri);
        model.registerDisposable(disposables);
        return model;
    }
    function instantiateTextModel(instantiationService, text, languageId = null, _options = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, uri = null) {
        const options = resolveOptions(_options);
        return instantiationService.createInstance(TestTextModel, text, languageId || modesRegistry_1.PLAINTEXT_LANGUAGE_ID, options, uri);
    }
    function createModelServices(disposables, services = []) {
        return (0, instantiationServiceMock_1.createServices)(disposables, services.concat([
            [notification_1.INotificationService, testNotificationService_1.TestNotificationService],
            [dialogs_1.IDialogService, testDialogService_1.TestDialogService],
            [undoRedo_1.IUndoRedoService, undoRedoService_1.UndoRedoService],
            [language_1.ILanguageService, languageService_1.LanguageService],
            [languageConfigurationRegistry_1.ILanguageConfigurationService, testLanguageConfigurationService_1.TestLanguageConfigurationService],
            [configuration_1.IConfigurationService, testConfigurationService_1.TestConfigurationService],
            [textResourceConfiguration_1.ITextResourcePropertiesService, testTextResourcePropertiesService_1.TestTextResourcePropertiesService],
            [themeService_1.IThemeService, testThemeService_1.TestThemeService],
            [log_1.ILogService, log_1.NullLogService],
            [environment_1.IEnvironmentService, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.isBuilt = true;
                        this.isExtensionDevelopment = false;
                    }
                }],
            [languageFeatureDebounce_1.ILanguageFeatureDebounceService, languageFeatureDebounce_1.LanguageFeatureDebounceService],
            [languageFeatures_1.ILanguageFeaturesService, languageFeaturesService_1.LanguageFeaturesService],
            [model_1.IModelService, modelService_1.ModelService],
        ]));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFRleHRNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi90ZXN0VGV4dE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBd0NoRywwQ0FJQztJQTZCRCwwQ0FNQztJQUVELG9EQUdDO0lBRUQsa0RBbUJDO0lBdkVELE1BQU0sYUFBYyxTQUFRLHFCQUFTO1FBQzdCLGtCQUFrQixDQUFDLFVBQXVCO1lBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLElBQWMsRUFBRSxRQUFvQztRQUNuRixNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQy9DLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQWNELFNBQVMsY0FBYyxDQUFDLFFBQTBDO1FBQ2pFLE1BQU0sY0FBYyxHQUFHLHFCQUFTLENBQUMsd0JBQXdCLENBQUM7UUFDMUQsT0FBTztZQUNOLE9BQU8sRUFBRSxDQUFDLE9BQU8sUUFBUSxDQUFDLE9BQU8sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7WUFDOUYsVUFBVSxFQUFFLENBQUMsT0FBTyxRQUFRLENBQUMsVUFBVSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztZQUMxRyxZQUFZLEVBQUUsQ0FBQyxPQUFPLFFBQVEsQ0FBQyxZQUFZLEtB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