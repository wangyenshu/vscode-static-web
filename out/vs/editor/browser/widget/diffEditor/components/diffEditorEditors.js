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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/observableUtilities", "vs/editor/browser/widget/diffEditor/features/overviewRulerFeature", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding"], function (require, exports, event_1, lifecycle_1, observable_1, observableUtilities_1, overviewRulerFeature_1, editorOptions_1, position_1, nls_1, instantiation_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorEditors = void 0;
    let DiffEditorEditors = class DiffEditorEditors extends lifecycle_1.Disposable {
        get onDidContentSizeChange() { return this._onDidContentSizeChange.event; }
        constructor(originalEditorElement, modifiedEditorElement, _options, _argCodeEditorWidgetOptions, _createInnerEditor, _instantiationService, _keybindingService) {
            super();
            this.originalEditorElement = originalEditorElement;
            this.modifiedEditorElement = modifiedEditorElement;
            this._options = _options;
            this._argCodeEditorWidgetOptions = _argCodeEditorWidgetOptions;
            this._createInnerEditor = _createInnerEditor;
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this.original = this._register(this._createLeftHandSideEditor(this._options.editorOptions.get(), this._argCodeEditorWidgetOptions.originalEditor || {}));
            this.modified = this._register(this._createRightHandSideEditor(this._options.editorOptions.get(), this._argCodeEditorWidgetOptions.modifiedEditor || {}));
            this._onDidContentSizeChange = this._register(new event_1.Emitter());
            this.modifiedScrollTop = (0, observable_1.observableFromEvent)(this.modified.onDidScrollChange, () => /** @description modified.getScrollTop */ this.modified.getScrollTop());
            this.modifiedScrollHeight = (0, observable_1.observableFromEvent)(this.modified.onDidScrollChange, () => /** @description modified.getScrollHeight */ this.modified.getScrollHeight());
            this.modifiedModel = (0, observableUtilities_1.obsCodeEditor)(this.modified).model;
            this.modifiedSelections = (0, observable_1.observableFromEvent)(this.modified.onDidChangeCursorSelection, () => this.modified.getSelections() ?? []);
            this.modifiedCursor = (0, observable_1.derivedOpts)({ owner: this, equalsFn: position_1.Position.equals }, reader => this.modifiedSelections.read(reader)[0]?.getPosition() ?? new position_1.Position(1, 1));
            this.originalCursor = (0, observable_1.observableFromEvent)(this.original.onDidChangeCursorPosition, () => this.original.getPosition() ?? new position_1.Position(1, 1));
            this.isOriginalFocused = (0, observableUtilities_1.obsCodeEditor)(this.original).isFocused;
            this.isModifiedFocused = (0, observableUtilities_1.obsCodeEditor)(this.modified).isFocused;
            this.isFocused = (0, observable_1.derived)(this, reader => this.isOriginalFocused.read(reader) || this.isModifiedFocused.read(reader));
            this._argCodeEditorWidgetOptions = null;
            this._register((0, observable_1.autorunHandleChanges)({
                createEmptyChangeSummary: () => ({}),
                handleChange: (ctx, changeSummary) => {
                    if (ctx.didChange(_options.editorOptions)) {
                        Object.assign(changeSummary, ctx.change.changedOptions);
                    }
                    return true;
                }
            }, (reader, changeSummary) => {
                /** @description update editor options */
                _options.editorOptions.read(reader);
                this._options.renderSideBySide.read(reader);
                this.modified.updateOptions(this._adjustOptionsForRightHandSide(reader, changeSummary));
                this.original.updateOptions(this._adjustOptionsForLeftHandSide(reader, changeSummary));
            }));
        }
        _createLeftHandSideEditor(options, codeEditorWidgetOptions) {
            const leftHandSideOptions = this._adjustOptionsForLeftHandSide(undefined, options);
            const editor = this._constructInnerEditor(this._instantiationService, this.originalEditorElement, leftHandSideOptions, codeEditorWidgetOptions);
            editor.setContextValue('isInDiffLeftEditor', true);
            return editor;
        }
        _createRightHandSideEditor(options, codeEditorWidgetOptions) {
            const rightHandSideOptions = this._adjustOptionsForRightHandSide(undefined, options);
            const editor = this._constructInnerEditor(this._instantiationService, this.modifiedEditorElement, rightHandSideOptions, codeEditorWidgetOptions);
            editor.setContextValue('isInDiffRightEditor', true);
            return editor;
        }
        _constructInnerEditor(instantiationService, container, options, editorWidgetOptions) {
            const editor = this._createInnerEditor(instantiationService, container, options, editorWidgetOptions);
            this._register(editor.onDidContentSizeChange(e => {
                const width = this.original.getContentWidth() + this.modified.getContentWidth() + overviewRulerFeature_1.OverviewRulerFeature.ENTIRE_DIFF_OVERVIEW_WIDTH;
                const height = Math.max(this.modified.getContentHeight(), this.original.getContentHeight());
                this._onDidContentSizeChange.fire({
                    contentHeight: height,
                    contentWidth: width,
                    contentHeightChanged: e.contentHeightChanged,
                    contentWidthChanged: e.contentWidthChanged
                });
            }));
            return editor;
        }
        _adjustOptionsForLeftHandSide(_reader, changedOptions) {
            const result = this._adjustOptionsForSubEditor(changedOptions);
            if (!this._options.renderSideBySide.get()) {
                // never wrap hidden editor
                result.wordWrapOverride1 = 'off';
                result.wordWrapOverride2 = 'off';
                result.stickyScroll = { enabled: false };
                // Disable unicode highlighting for the original side in inline mode, as they are not shown anyway.
                result.unicodeHighlight = { nonBasicASCII: false, ambiguousCharacters: false, invisibleCharacters: false };
            }
            else {
                result.unicodeHighlight = this._options.editorOptions.get().unicodeHighlight || {};
                result.wordWrapOverride1 = this._options.diffWordWrap.get();
            }
            result.glyphMargin = this._options.renderSideBySide.get();
            if (changedOptions.originalAriaLabel) {
                result.ariaLabel = changedOptions.originalAriaLabel;
            }
            result.ariaLabel = this._updateAriaLabel(result.ariaLabel);
            result.readOnly = !this._options.originalEditable.get();
            result.dropIntoEditor = { enabled: !result.readOnly };
            result.extraEditorClassName = 'original-in-monaco-diff-editor';
            return result;
        }
        _adjustOptionsForRightHandSide(reader, changedOptions) {
            const result = this._adjustOptionsForSubEditor(changedOptions);
            if (changedOptions.modifiedAriaLabel) {
                result.ariaLabel = changedOptions.modifiedAriaLabel;
            }
            result.ariaLabel = this._updateAriaLabel(result.ariaLabel);
            result.wordWrapOverride1 = this._options.diffWordWrap.get();
            result.revealHorizontalRightPadding = editorOptions_1.EditorOptions.revealHorizontalRightPadding.defaultValue + overviewRulerFeature_1.OverviewRulerFeature.ENTIRE_DIFF_OVERVIEW_WIDTH;
            result.scrollbar.verticalHasArrows = false;
            result.extraEditorClassName = 'modified-in-monaco-diff-editor';
            return result;
        }
        _adjustOptionsForSubEditor(options) {
            const clonedOptions = {
                ...options,
                dimension: {
                    height: 0,
                    width: 0
                },
            };
            clonedOptions.inDiffEditor = true;
            clonedOptions.automaticLayout = false;
            // Clone scrollbar options before changing them
            clonedOptions.scrollbar = { ...(clonedOptions.scrollbar || {}) };
            clonedOptions.folding = false;
            clonedOptions.codeLens = this._options.diffCodeLens.get();
            clonedOptions.fixedOverflowWidgets = true;
            // Clone minimap options before changing them
            clonedOptions.minimap = { ...(clonedOptions.minimap || {}) };
            clonedOptions.minimap.enabled = false;
            if (this._options.hideUnchangedRegions.get()) {
                clonedOptions.stickyScroll = { enabled: false };
            }
            else {
                clonedOptions.stickyScroll = this._options.editorOptions.get().stickyScroll;
            }
            return clonedOptions;
        }
        _updateAriaLabel(ariaLabel) {
            if (!ariaLabel) {
                ariaLabel = '';
            }
            const ariaNavigationTip = (0, nls_1.localize)('diff-aria-navigation-tip', ' use {0} to open the accessibility help.', this._keybindingService.lookupKeybinding('editor.action.accessibilityHelp')?.getAriaLabel());
            if (this._options.accessibilityVerbose.get()) {
                return ariaLabel + ariaNavigationTip;
            }
            else if (ariaLabel) {
                return ariaLabel.replaceAll(ariaNavigationTip, '');
            }
            return '';
        }
    };
    exports.DiffEditorEditors = DiffEditorEditors;
    exports.DiffEditorEditors = DiffEditorEditors = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, keybinding_1.IKeybindingService)
    ], DiffEditorEditors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvckVkaXRvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9jb21wb25lbnRzL2RpZmZFZGl0b3JFZGl0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxzQkFBVTtRQUtoRCxJQUFXLHNCQUFzQixLQUFLLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFpQmxGLFlBQ2tCLHFCQUFrQyxFQUNsQyxxQkFBa0MsRUFDbEMsUUFBMkIsRUFDcEMsMkJBQXlELEVBQ2hELGtCQUErTCxFQUN6TCxxQkFBNkQsRUFDaEUsa0JBQXVEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBUlMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFhO1lBQ2xDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBYTtZQUNsQyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUNwQyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQThCO1lBQ2hELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBNks7WUFDeEssMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBNUI1RCxhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BKLGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUks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