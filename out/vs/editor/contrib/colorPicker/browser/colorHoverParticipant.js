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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/color", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/contrib/colorPicker/browser/color", "vs/editor/contrib/colorPicker/browser/colorDetector", "vs/editor/contrib/colorPicker/browser/colorPickerModel", "vs/editor/contrib/colorPicker/browser/colorPickerWidget", "vs/platform/theme/common/themeService", "vs/base/browser/dom"], function (require, exports, async_1, cancellation_1, color_1, lifecycle_1, range_1, color_2, colorDetector_1, colorPickerModel_1, colorPickerWidget_1, themeService_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneColorPickerParticipant = exports.StandaloneColorPickerHover = exports.ColorHoverParticipant = exports.ColorHover = void 0;
    class ColorHover {
        constructor(owner, range, model, provider) {
            this.owner = owner;
            this.range = range;
            this.model = model;
            this.provider = provider;
            /**
             * Force the hover to always be rendered at this specific range,
             * even in the case of multiple hover parts.
             */
            this.forceShowAtRange = true;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.ColorHover = ColorHover;
    let ColorHoverParticipant = class ColorHoverParticipant {
        constructor(_editor, _themeService) {
            this._editor = _editor;
            this._themeService = _themeService;
            this.hoverOrdinal = 2;
        }
        computeSync(_anchor, _lineDecorations) {
            return [];
        }
        computeAsync(anchor, lineDecorations, token) {
            return async_1.AsyncIterableObject.fromPromise(this._computeAsync(anchor, lineDecorations, token));
        }
        async _computeAsync(_anchor, lineDecorations, _token) {
            if (!this._editor.hasModel()) {
                return [];
            }
            const colorDetector = colorDetector_1.ColorDetector.get(this._editor);
            if (!colorDetector) {
                return [];
            }
            for (const d of lineDecorations) {
                if (!colorDetector.isColorDecoration(d)) {
                    continue;
                }
                const colorData = colorDetector.getColorData(d.range.getStartPosition());
                if (colorData) {
                    const colorHover = await _createColorHover(this, this._editor.getModel(), colorData.colorInfo, colorData.provider);
                    return [colorHover];
                }
            }
            return [];
        }
        renderHoverParts(context, hoverParts) {
            return renderHoverParts(this, this._editor, this._themeService, hoverParts, context);
        }
    };
    exports.ColorHoverParticipant = ColorHoverParticipant;
    exports.ColorHoverParticipant = ColorHoverParticipant = __decorate([
        __param(1, themeService_1.IThemeService)
    ], ColorHoverParticipant);
    class StandaloneColorPickerHover {
        constructor(owner, range, model, provider) {
            this.owner = owner;
            this.range = range;
            this.model = model;
            this.provider = provider;
        }
    }
    exports.StandaloneColorPickerHover = StandaloneColorPickerHover;
    let StandaloneColorPickerParticipant = class StandaloneColorPickerParticipant {
        constructor(_editor, _themeService) {
            this._editor = _editor;
            this._themeService = _themeService;
            this.hoverOrdinal = 2;
            this._color = null;
        }
        async createColorHover(defaultColorInfo, defaultColorProvider, colorProviderRegistry) {
            if (!this._editor.hasModel()) {
                return null;
            }
            const colorDetector = colorDetector_1.ColorDetector.get(this._editor);
            if (!colorDetector) {
                return null;
            }
            const colors = await (0, color_2.getColors)(colorProviderRegistry, this._editor.getModel(), cancellation_1.CancellationToken.None);
            let foundColorInfo = null;
            let foundColorProvider = null;
            for (const colorData of colors) {
                const colorInfo = colorData.colorInfo;
                if (range_1.Range.containsRange(colorInfo.range, defaultColorInfo.range)) {
                    foundColorInfo = colorInfo;
                    foundColorProvider = colorData.provider;
                }
            }
            const colorInfo = foundColorInfo ?? defaultColorInfo;
            const colorProvider = foundColorProvider ?? defaultColorProvider;
            const foundInEditor = !!foundColorInfo;
            return { colorHover: await _createColorHover(this, this._editor.getModel(), colorInfo, colorProvider), foundInEditor: foundInEditor };
        }
        async updateEditorModel(colorHoverData) {
            if (!this._editor.hasModel()) {
                return;
            }
            const colorPickerModel = colorHoverData.model;
            let range = new range_1.Range(colorHoverData.range.startLineNumber, colorHoverData.range.startColumn, colorHoverData.range.endLineNumber, colorHoverData.range.endColumn);
            if (this._color) {
                await _updateColorPresentations(this._editor.getModel(), colorPickerModel, this._color, range, colorHoverData);
                range = _updateEditorModel(this._editor, range, colorPickerModel);
            }
        }
        renderHoverParts(context, hoverParts) {
            return renderHoverParts(this, this._editor, this._themeService, hoverParts, context);
        }
        set color(color) {
            this._color = color;
        }
        get color() {
            return this._color;
        }
    };
    exports.StandaloneColorPickerParticipant = StandaloneColorPickerParticipant;
    exports.StandaloneColorPickerParticipant = StandaloneColorPickerParticipant = __decorate([
        __param(1, themeService_1.IThemeService)
    ], StandaloneColorPickerParticipant);
    async function _createColorHover(participant, editorModel, colorInfo, provider) {
        const originalText = editorModel.getValueInRange(colorInfo.range);
        const { red, green, blue, alpha } = colorInfo.color;
        const rgba = new color_1.RGBA(Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255), alpha);
        const color = new color_1.Color(rgba);
        const colorPresentations = await (0, color_2.getColorPresentations)(editorModel, colorInfo, provider, cancellation_1.CancellationToken.None);
        const model = new colorPickerModel_1.ColorPickerModel(color, [], 0);
        model.colorPresentations = colorPresentations || [];
        model.guessColorPresentation(color, originalText);
        if (participant instanceof ColorHoverParticipant) {
            return new ColorHover(participant, range_1.Range.lift(colorInfo.range), model, provider);
        }
        else {
            return new StandaloneColorPickerHover(participant, range_1.Range.lift(colorInfo.range), model, provider);
        }
    }
    function renderHoverParts(participant, editor, themeService, hoverParts, context) {
        if (hoverParts.length === 0 || !editor.hasModel()) {
            return lifecycle_1.Disposable.None;
        }
        if (context.setMinimumDimensions) {
            const minimumHeight = editor.getOption(67 /* EditorOption.lineHeight */) + 8;
            context.setMinimumDimensions(new dom_1.Dimension(302, minimumHeight));
        }
        const disposables = new lifecycle_1.DisposableStore();
        const colorHover = hoverParts[0];
        const editorModel = editor.getModel();
        const model = colorHover.model;
        const widget = disposables.add(new colorPickerWidget_1.ColorPickerWidget(context.fragment, model, editor.getOption(143 /* EditorOption.pixelRatio */), themeService, participant instanceof StandaloneColorPickerParticipant));
        context.setColorPicker(widget);
        let editorUpdatedByColorPicker = false;
        let range = new range_1.Range(colorHover.range.startLineNumber, colorHover.range.startColumn, colorHover.range.endLineNumber, colorHover.range.endColumn);
        if (participant instanceof StandaloneColorPickerParticipant) {
            const color = hoverParts[0].model.color;
            participant.color = color;
            _updateColorPresentations(editorModel, model, color, range, colorHover);
            disposables.add(model.onColorFlushed((color) => {
                participant.color = color;
            }));
        }
        else {
            disposables.add(model.onColorFlushed(async (color) => {
                await _updateColorPresentations(editorModel, model, color, range, colorHover);
                editorUpdatedByColorPicker = true;
                range = _updateEditorModel(editor, range, model);
            }));
        }
        disposables.add(model.onDidChangeColor((color) => {
            _updateColorPresentations(editorModel, model, color, range, colorHover);
        }));
        disposables.add(editor.onDidChangeModelContent((e) => {
            if (editorUpdatedByColorPicker) {
                editorUpdatedByColorPicker = false;
            }
            else {
                context.hide();
                editor.focus();
            }
        }));
        return disposables;
    }
    function _updateEditorModel(editor, range, model) {
        const textEdits = [];
        const edit = model.presentation.textEdit ?? { range, text: model.presentation.label, forceMoveMarkers: false };
        textEdits.push(edit);
        if (model.presentation.additionalTextEdits) {
            textEdits.push(...model.presentation.additionalTextEdits);
        }
        const replaceRange = range_1.Range.lift(edit.range);
        const trackedRange = editor.getModel()._setTrackedRange(null, replaceRange, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */);
        editor.executeEdits('colorpicker', textEdits);
        editor.pushUndoStop();
        return editor.getModel()._getTrackedRange(trackedRange) ?? replaceRange;
    }
    async function _updateColorPresentations(editorModel, colorPickerModel, color, range, colorHover) {
        const colorPresentations = await (0, color_2.getColorPresentations)(editorModel, {
            range: range,
            color: {
                red: color.rgba.r / 255,
                green: color.rgba.g / 255,
                blue: color.rgba.b / 255,
                alpha: color.rgba.a
            }
        }, colorHover.provider, cancellation_1.CancellationToken.None);
        colorPickerModel.colorPresentations = colorPresentations || [];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JIb3ZlclBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29sb3JQaWNrZXIvYnJvd3Nlci9jb2xvckhvdmVyUGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJoRyxNQUFhLFVBQVU7UUFRdEIsWUFDaUIsS0FBMEMsRUFDMUMsS0FBWSxFQUNaLEtBQXVCLEVBQ3ZCLFFBQStCO1lBSC9CLFVBQUssR0FBTCxLQUFLLENBQXFDO1lBQzFDLFVBQUssR0FBTCxLQUFLLENBQU87WUFDWixVQUFLLEdBQUwsS0FBSyxDQUFrQjtZQUN2QixhQUFRLEdBQVIsUUFBUSxDQUF1QjtZQVZoRDs7O2VBR0c7WUFDYSxxQkFBZ0IsR0FBWSxJQUFJLENBQUM7UUFPN0MsQ0FBQztRQUVFLHFCQUFxQixDQUFDLE1BQW1CO1lBQy9DLE9BQU8sQ0FDTixNQUFNLENBQUMsSUFBSSxrQ0FBMEI7bUJBQ2xDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVzttQkFDbEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQ2pELENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUF0QkQsZ0NBc0JDO0lBRU0sSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7UUFJakMsWUFDa0IsT0FBb0IsRUFDdEIsYUFBNkM7WUFEM0MsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNMLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBSjdDLGlCQUFZLEdBQVcsQ0FBQyxDQUFDO1FBS3JDLENBQUM7UUFFRSxXQUFXLENBQUMsT0FBb0IsRUFBRSxnQkFBb0M7WUFDNUUsT0FBTyxF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