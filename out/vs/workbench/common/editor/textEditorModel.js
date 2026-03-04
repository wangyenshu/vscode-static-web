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
define(["require", "exports", "vs/workbench/common/editor/editorModel", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/base/common/lifecycle", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/common/async", "vs/platform/accessibility/common/accessibility", "vs/nls"], function (require, exports, editorModel_1, language_1, model_1, lifecycle_1, modesRegistry_1, languageDetectionWorkerService_1, async_1, accessibility_1, nls_1) {
    "use strict";
    var BaseTextEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseTextEditorModel = void 0;
    /**
     * The base text editor model leverages the code editor model. This class is only intended to be subclassed and not instantiated.
     */
    let BaseTextEditorModel = class BaseTextEditorModel extends editorModel_1.EditorModel {
        static { BaseTextEditorModel_1 = this; }
        static { this.AUTO_DETECT_LANGUAGE_THROTTLE_DELAY = 600; }
        constructor(modelService, languageService, languageDetectionService, accessibilityService, textEditorModelHandle) {
            super();
            this.modelService = modelService;
            this.languageService = languageService;
            this.languageDetectionService = languageDetectionService;
            this.accessibilityService = accessibilityService;
            this.textEditorModelHandle = undefined;
            this.modelDisposeListener = this._register(new lifecycle_1.MutableDisposable());
            this.autoDetectLanguageThrottler = this._register(new async_1.ThrottledDelayer(BaseTextEditorModel_1.AUTO_DETECT_LANGUAGE_THROTTLE_DELAY));
            this._hasLanguageSetExplicitly = false;
            if (textEditorModelHandle) {
                this.handleExistingModel(textEditorModelHandle);
            }
        }
        handleExistingModel(textEditorModelHandle) {
            // We need the resource to point to an existing model
            const model = this.modelService.getModel(textEditorModelHandle);
            if (!model) {
                throw new Error(`Document with resource ${textEditorModelHandle.toString(true)} does not exist`);
            }
            this.textEditorModelHandle = textEditorModelHandle;
            // Make sure we clean up when this model gets disposed
            this.registerModelDisposeListener(model);
        }
        registerModelDisposeListener(model) {
            this.modelDisposeListener.value = model.onWillDispose(() => {
                this.textEditorModelHandle = undefined; // make sure we do not dispose code editor model again
                this.dispose();
            });
        }
        get textEditorModel() {
            return this.textEditorModelHandle ? this.modelService.getModel(this.textEditorModelHandle) : null;
        }
        isReadonly() {
            return true;
        }
        get hasLanguageSetExplicitly() { return this._hasLanguageSetExplicitly; }
        setLanguageId(languageId, source) {
            // Remember that an explicit language was set
            this._hasLanguageSetExplicitly = true;
            this.setLanguageIdInternal(languageId, source);
        }
        setLanguageIdInternal(languageId, source) {
            if (!this.isResolved()) {
                return;
            }
            if (!languageId || languageId === this.textEditorModel.getLanguageId()) {
                return;
            }
            this.textEditorModel.setLanguage(this.languageService.createById(languageId), source);
        }
        installModelListeners(model) {
            // Setup listener for lower level language changes
            const disposable = this._register(model.onDidChangeLanguage((e) => {
                if (e.source === languageDetectionWorkerService_1.LanguageDetectionLanguageEventSource) {
                    return;
                }
                this._hasLanguageSetExplicitly = true;
                disposable.dispose();
            }));
        }
        getLanguageId() {
            return this.textEditorModel?.getLanguageId();
        }
        autoDetectLanguage() {
            return this.autoDetectLanguageThrottler.trigger(() => this.doAutoDetectLanguage());
        }
        async doAutoDetectLanguage() {
            if (this.hasLanguageSetExplicitly || // skip detection when the user has made an explicit choice on the language
                !this.textEditorModelHandle || // require a URI to run the detection for
                !this.languageDetectionService.isEnabledForLanguage(this.getLanguageId() ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID) // require a valid language that is enlisted for detection
            ) {
                return;
            }
            const lang = await this.languageDetectionService.detectLanguage(this.textEditorModelHandle);
            const prevLang = this.getLanguageId();
            if (lang && lang !== prevLang && !this.isDisposed()) {
                this.setLanguageIdInternal(lang, languageDetectionWorkerService_1.LanguageDetectionLanguageEventSource);
                const languageName = this.languageService.getLanguageName(lang);
                this.accessibilityService.alert((0, nls_1.localize)('languageAutoDetected', "Language {0} was automatically detected and set as the language mode.", languageName ?? lang));
            }
        }
        /**
         * Creates the text editor model with the provided value, optional preferred language
         * (can be comma separated for multiple values) and optional resource URL.
         */
        createTextEditorModel(value, resource, preferredLanguageId) {
            const firstLineText = this.getFirstLineText(value);
            const languageSelection = this.getOrCreateLanguage(resource, this.languageService, preferredLanguageId, firstLineText);
            return this.doCreateTextEditorModel(value, languageSelection, resource);
        }
        doCreateTextEditorModel(value, languageSelection, resource) {
            let model = resource && this.modelService.getModel(resource);
            if (!model) {
                model = this.modelService.createModel(value, languageSelection, resource);
                this.createdEditorModel = true;
                // Make sure we clean up when this model gets disposed
                this.registerModelDisposeListener(model);
            }
            else {
                this.updateTextEditorModel(value, languageSelection.languageId);
            }
            this.textEditorModelHandle = model.uri;
            return model;
        }
        getFirstLineText(value) {
            // text buffer factory
            const textBufferFactory = value;
            if (typeof textBufferFactory.getFirstLineText === 'function') {
                return textBufferFactory.getFirstLineText(1000 /* ModelConstants.FIRST_LINE_DETECTION_LENGTH_LIMIT */);
            }
            // text model
            const textSnapshot = value;
            return textSnapshot.getLineContent(1).substr(0, 1000 /* ModelConstants.FIRST_LINE_DETECTION_LENGTH_LIMIT */);
        }
        /**
         * Gets the language for the given identifier. Subclasses can override to provide their own implementation of this lookup.
         *
         * @param firstLineText optional first line of the text buffer to set the language on. This can be used to guess a language from content.
         */
        getOrCreateLanguage(resource, languageService, preferredLanguage, firstLineText) {
            // lookup language via resource path if the provided language is unspecific
            if (!preferredLanguage || preferredLanguage === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                return languageService.createByFilepathOrFirstLine(resource ?? null, firstLineText);
            }
            // otherwise take the preferred language for granted
            return languageService.createById(preferredLanguage);
        }
        /**
         * Updates the text editor model with the provided value. If the value is the same as the model has, this is a no-op.
         */
        updateTextEditorModel(newValue, preferredLanguageId) {
            if (!this.isResolved()) {
                return;
            }
            // contents
            if (newValue) {
                this.modelService.updateModel(this.textEditorModel, newValue);
            }
            // language (only if specific and changed)
            if (preferredLanguageId && preferredLanguageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID && this.textEditorModel.getLanguageId() !== preferredLanguageId) {
                this.textEditorModel.setLanguage(this.languageService.createById(preferredLanguageId));
            }
        }
        createSnapshot() {
            if (!this.textEditorModel) {
                return null;
            }
            return this.textEditorModel.createSnapshot(true /* preserve BOM */);
        }
        isResolved() {
            return !!this.textEditorModelHandle;
        }
        dispose() {
            this.modelDisposeListener.dispose(); // dispose this first because it will trigger another dispose() otherwise
            if (this.textEditorModelHandle && this.createdEditorModel) {
                this.modelService.destroyModel(this.textEditorModelHandle);
            }
            this.textEditorModelHandle = undefined;
            this.createdEditorModel = false;
            super.dispose();
        }
    };
    exports.BaseTextEditorModel = BaseTextEditorModel;
    exports.BaseTextEditorModel = BaseTextEditorModel = BaseTextEditorModel_1 = __decorate([
        __param(0, model_1.IModelService),
        __param(1, language_1.ILanguageService),
        __param(2, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(3, accessibility_1.IAccessibilityService)
    ], BaseTextEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEVkaXRvck1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9lZGl0b3IvdGV4dEVkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpQmhHOztPQUVHO0lBQ0ksSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSx5QkFBVzs7aUJBRTNCLHdDQUFtQyxHQUFHLEdBQUcsQUFBTixDQUFPO1FBU2xFLFlBQ2dCLFlBQXFDLEVBQ2xDLGVBQTJDLEVBQ2xDLHdCQUFvRSxFQUN4RSxvQkFBNEQsRUFDbkYscUJBQTJCO1lBRTNCLEtBQUssRUFBRSxDQUFDO1lBTmlCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNqQiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQ3ZELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFYMUUsMEJBQXFCLEdBQW9CLFNBQVMsQ0FBQztZQUk1Qyx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELGdDQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBTyxxQkFBbUIsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUM7WUE2QzNJLDhCQUF5QixHQUFZLEtBQUssQ0FBQztZQWxDbEQsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsbUJBQW1CLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNqRCxDQUFDO1FBQ0YsQ0FBQztRQUVPLG1CQUFtQixDQUFDLHFCQUEwQjtZQUVyRCxxREFBcUQ7WUFDckQsTUFBTSxLQUFLLEdBQUcsSUFB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