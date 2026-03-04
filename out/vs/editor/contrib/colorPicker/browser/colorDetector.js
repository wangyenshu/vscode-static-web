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
define(["require", "exports", "vs/base/common/async", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/strings", "vs/editor/browser/editorDom", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/colorPicker/browser/color", "vs/platform/configuration/common/configuration"], function (require, exports, async_1, color_1, errors_1, event_1, lifecycle_1, stopwatch_1, strings_1, editorDom_1, editorExtensions_1, range_1, textModel_1, languageFeatureDebounce_1, languageFeatures_1, color_2, configuration_1) {
    "use strict";
    var ColorDetector_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecoratorLimitReporter = exports.ColorDetector = exports.ColorDecorationInjectedTextMarker = void 0;
    exports.ColorDecorationInjectedTextMarker = Object.create({});
    let ColorDetector = class ColorDetector extends lifecycle_1.Disposable {
        static { ColorDetector_1 = this; }
        static { this.ID = 'editor.contrib.colorDetector'; }
        static { this.RECOMPUTE_TIME = 1000; } // ms
        constructor(_editor, _configurationService, _languageFeaturesService, languageFeatureDebounceService) {
            super();
            this._editor = _editor;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._localToDispose = this._register(new lifecycle_1.DisposableStore());
            this._decorationsIds = [];
            this._colorDatas = new Map();
            this._colorDecoratorIds = this._editor.createDecorationsCollection();
            this._ruleFactory = new editorDom_1.DynamicCssRules(this._editor);
            this._decoratorLimitReporter = new DecoratorLimitReporter();
            this._colorDecorationClassRefs = this._register(new lifecycle_1.DisposableStore());
            this._debounceInformation = languageFeatureDebounceService.for(_languageFeaturesService.colorProvider, 'Document Colors', { min: ColorDetector_1.RECOMPUTE_TIME });
            this._register(_editor.onDidChangeModel(() => {
                this._isColorDecoratorsEnabled = this.isEnabled();
                this.updateColors();
            }));
            this._register(_editor.onDidChangeModelLanguage(() => this.updateColors()));
            this._register(_languageFeaturesService.colorProvider.onDidChange(() => this.updateColors()));
            this._register(_editor.onDidChangeConfiguration((e) => {
                const prevIsEnabled = this._isColorDecoratorsEnabled;
                this._isColorDecoratorsEnabled = this.isEnabled();
                this._isDefaultColorDecoratorsEnabled = this._editor.getOption(147 /* EditorOption.defaultColorDecorators */);
                const updatedColorDecoratorsSetting = prevIsEnabled !== this._isColorDecoratorsEnabled || e.hasChanged(21 /* EditorOption.colorDecoratorsLimit */);
                const updatedDefaultColorDecoratorsSetting = e.hasChanged(147 /* EditorOption.defaultColorDecorators */);
                if (updatedColorDecoratorsSetting || updatedDefaultColorDecoratorsSetting) {
                    if (this._isColorDecoratorsEnabled) {
                        this.updateColors();
                    }
                    else {
                        this.removeAllDecorations();
                    }
                }
            }));
            this._timeoutTimer = null;
            this._computePromise = null;
            this._isColorDecoratorsEnabled = this.isEnabled();
            this._isDefaultColorDecoratorsEnabled = this._editor.getOption(147 /* EditorOption.defaultColorDecorators */);
            this.updateColors();
        }
        isEnabled() {
            const model = this._editor.getModel();
            if (!model) {
                return false;
            }
            const languageId = model.getLanguageId();
            // handle deprecated settings. [languageId].colorDecorators.enable
            const deprecatedConfig = this._configurationService.getValue(languageId);
            if (deprecatedConfig && typeof deprecatedConfig === 'object') {
                const colorDecorators = deprecatedConfig['colorDecorators']; // deprecatedConfig.valueOf('.colorDecorators.enable');
                if (colorDecorators && colorDecorators['enable'] !== undefined && !colorDecorators['enable']) {
                    return colorDecorators['enable'];
                }
            }
            return this._editor.getOption(20 /* EditorOption.colorDecorators */);
        }
        get limitReporter() {
            return this._decoratorLimitReporter;
        }
        static get(editor) {
            return editor.getContribution(this.ID);
        }
        dispose() {
            this.stop();
            this.removeAllDecorations();
            super.dispose();
        }
        updateColors() {
            this.stop();
            if (!this._isColorDecoratorsEnabled) {
                return;
            }
            const model = this._editor.getModel();
            if (!model || !this._languageFeaturesService.colorProvider.has(model)) {
                return;
            }
            this._localToDispose.add(this._editor.onDidChangeModelContent(() => {
                if (!this._timeoutTimer) {
                    this._timeoutTimer = new async_1.TimeoutTimer();
                    this._timeoutTimer.cancelAndSet(() => {
                        this._timeoutTimer = null;
                        this.beginCompute();
                    }, this._debounceInformation.get(model));
                }
            }));
            this.beginCompute();
        }
        async beginCompute() {
            this._computePromise = (0, async_1.createCancelablePromise)(async (token) => {
                const model = this._editor.getModel();
                if (!model) {
                    return [];
                }
                const sw = new stopwatch_1.StopWatch(false);
                const colors = await (0, color_2.getColors)(this._languageFeaturesService.colorProvider, model, token, this._isDefaultColorDecoratorsEnabled);
                this._debounceInformation.update(model, sw.elapsed());
                return colors;
            });
            try {
                const colors = await this._computePromise;
                this.updateDecorations(colors);
                this.updateColorDecorators(colors);
                this._computePromise = null;
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        stop() {
            if (this._timeoutTimer) {
                this._timeoutTimer.cancel();
                this._timeoutTimer = null;
            }
            if (this._computePromise) {
                this._computePromise.cancel();
                this._computePromise = null;
            }
            this._localToDispose.clear();
        }
        updateDecorations(colorDatas) {
            const decorations = colorDatas.map(c => ({
                range: {
                    startLineNumber: c.colorInfo.range.startLineNumber,
                    startColumn: c.colorInfo.range.startColumn,
                    endLineNumber: c.colorInfo.range.endLineNumber,
                    endColumn: c.colorInfo.range.endColumn
                },
                options: textModel_1.ModelDecorationOptions.EMPTY
            }));
            this._editor.changeDecorations((changeAccessor) => {
                this._decorationsIds = changeAccessor.deltaDecorations(this._decorationsIds, decorations);
                this._colorDatas = new Map();
                this._decorationsIds.forEach((id, i) => this._colorDatas.set(id, colorDatas[i]));
            });
        }
        updateColorDecorators(colorData) {
            this._colorDecorationClassRefs.clear();
            const decorations = [];
            const limit = this._editor.getOption(21 /* EditorOption.colorDecoratorsLimit */);
            for (let i = 0; i < colorData.length && decorations.length < limit; i++) {
                const { red, green, blue, alpha } = colorData[i].colorInfo.color;
                const rgba = new color_1.RGBA(Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255), alpha);
                const color = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
                const ref = this._colorDecorationClassRefs.add(this._ruleFactory.createClassNameRef({
                    backgroundColor: color
                }));
                decorations.push({
                    range: {
                        startLineNumber: colorData[i].colorInfo.range.startLineNumber,
                        startColumn: colorData[i].colorInfo.range.startColumn,
                        endLineNumber: colorData[i].colorInfo.range.endLineNumber,
                        endColumn: colorData[i].colorInfo.range.endColumn
                    },
                    options: {
                        description: 'colorDetector',
                        before: {
                            content: strings_1.noBreakWhitespace,
                            inlineClassName: `${ref.className} colorpicker-color-decoration`,
                            inlineClassNameAffectsLetterSpacing: true,
                            attachedData: exports.ColorDecorationInjectedTextMarker
                        }
                    }
                });
            }
            const limited = limit < colorData.length ? limit : false;
            this._decoratorLimitReporter.update(colorData.length, limited);
            this._colorDecoratorIds.set(decorations);
        }
        removeAllDecorations() {
            this._editor.removeDecorations(this._decorationsIds);
            this._decorationsIds = [];
            this._colorDecoratorIds.clear();
            this._colorDecorationClassRefs.clear();
        }
        getColorData(position) {
            const model = this._editor.getModel();
            if (!model) {
                return null;
            }
            const decorations = model
                .getDecorationsInRange(range_1.Range.fromPositions(position, position))
                .filter(d => this._colorDatas.has(d.id));
            if (decorations.length === 0) {
                return null;
            }
            return this._colorDatas.get(decorations[0].id);
        }
        isColorDecoration(decoration) {
            return this._colorDecoratorIds.has(decoration);
        }
    };
    exports.ColorDetector = ColorDetector;
    exports.ColorDetector = ColorDetector = ColorDetector_1 = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, languageFeatureDebounce_1.ILanguageFeatureDebounceService)
    ], ColorDetector);
    class DecoratorLimitReporter {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._computed = 0;
            this._limited = false;
        }
        get computed() {
            return this._computed;
        }
        get limited() {
            return this._limited;
        }
        update(computed, limited) {
            if (computed !== this._computed || limited !== this._limited) {
                this._computed = computed;
                this._limited = limited;
                this._onDidChange.fire();
            }
        }
    }
    exports.DecoratorLimitReporter = DecoratorLimitReporter;
    (0, editorExtensions_1.registerEditorContribution)(ColorDetector.ID, ColorDetector, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JEZXRlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvbG9yUGlja2VyL2Jyb3dzZXIvY29sb3JEZXRlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJuRixRQUFBLGlDQUFpQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFHNUQsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLHNCQUFVOztpQkFFckIsT0FBRSxHQUFXLDhCQUE4QixBQUF6QyxDQUEwQztpQkFFbkQsbUJBQWMsR0FBRyxJQUFJLEFBQVAsQ0FBUSxHQUFDLEtBQUs7UUFtQjVDLFlBQ2tCLE9BQW9CLEVBQ2QscUJBQTZELEVBQzFELHdCQUFtRSxFQUM1RCw4QkFBK0Q7WUFFaEcsS0FBSyxFQUFFLENBQUM7WUFMUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0csMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN6Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBcEI3RSxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUtqRSxvQkFBZSxHQUFhLEVBQUUsQ0FBQztZQUMvQixnQkFBVyxHQUFHLElBQUksR0FBRyxFQUFzQixDQUFDO1lBRW5DLHVCQUFrQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUtoRSxpQkFBWSxHQUFHLElBQUksMkJBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFakQsNEJBQXVCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO1lBbUp2RCw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxD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