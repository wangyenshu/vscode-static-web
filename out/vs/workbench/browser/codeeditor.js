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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/browser/editorBrowser", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/model/textModel", "vs/platform/actions/browser/floatingMenu", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/editor/common/editorService"], function (require, exports, event_1, lifecycle_1, resources_1, editorBrowser_1, embeddedCodeEditorWidget_1, textModel_1, floatingMenu_1, actions_1, contextkey_1, instantiation_1, keybinding_1, editorService_1) {
    "use strict";
    var RangeHighlightDecorations_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FloatingEditorClickMenu = exports.FloatingEditorClickWidget = exports.RangeHighlightDecorations = void 0;
    let RangeHighlightDecorations = class RangeHighlightDecorations extends lifecycle_1.Disposable {
        static { RangeHighlightDecorations_1 = this; }
        constructor(editorService) {
            super();
            this.editorService = editorService;
            this._onHighlightRemoved = this._register(new event_1.Emitter());
            this.onHighlightRemoved = this._onHighlightRemoved.event;
            this.rangeHighlightDecorationId = null;
            this.editor = null;
            this.editorDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        removeHighlightRange() {
            if (this.editor && this.rangeHighlightDecorationId) {
                const decorationId = this.rangeHighlightDecorationId;
                this.editor.changeDecorations((accessor) => {
                    accessor.removeDecoration(decorationId);
                });
                this._onHighlightRemoved.fire();
            }
            this.rangeHighlightDecorationId = null;
        }
        highlightRange(range, editor) {
            editor = editor ?? this.getEditor(range);
            if ((0, editorBrowser_1.isCodeEditor)(editor)) {
                this.doHighlightRange(editor, range);
            }
            else if ((0, editorBrowser_1.isCompositeEditor)(editor) && (0, editorBrowser_1.isCodeEditor)(editor.activeCodeEditor)) {
                this.doHighlightRange(editor.activeCodeEditor, range);
            }
        }
        doHighlightRange(editor, selectionRange) {
            this.removeHighlightRange();
            editor.changeDecorations((changeAccessor) => {
                this.rangeHighlightDecorationId = changeAccessor.addDecoration(selectionRange.range, this.createRangeHighlightDecoration(selectionRange.isWholeLine));
            });
            this.setEditor(editor);
        }
        getEditor(resourceRange) {
            const resource = this.editorService.activeEditor?.resource;
            if (resource && (0, resources_1.isEqual)(resource, resourceRange.resource) && (0, editorBrowser_1.isCodeEditor)(this.editorService.activeTextEditorControl)) {
                return this.editorService.activeTextEditorControl;
            }
            return undefined;
        }
        setEditor(editor) {
            if (this.editor !== editor) {
                this.editorDisposables.clear();
                this.editor = editor;
                this.editorDisposables.add(this.editor.onDidChangeCursorPosition((e) => {
                    if (e.reason === 0 /* CursorChangeReason.NotSet */
                        || e.reason === 3 /* CursorChangeReason.Explicit */
                        || e.reason === 5 /* CursorChangeReason.Undo */
                        || e.reason === 6 /* CursorChangeReason.Redo */) {
                        this.removeHighlightRange();
                    }
                }));
                this.editorDisposables.add(this.editor.onDidChangeModel(() => { this.removeHighlightRange(); }));
                this.editorDisposables.add(this.editor.onDidDispose(() => {
                    this.removeHighlightRange();
                    this.editor = null;
                }));
            }
        }
        static { this._WHOLE_LINE_RANGE_HIGHLIGHT = textModel_1.ModelDecorationOptions.register({
            description: 'codeeditor-range-highlight-whole',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'rangeHighlight',
            isWholeLine: true
        }); }
        static { this._RANGE_HIGHLIGHT = textModel_1.ModelDecorationOptions.register({
            description: 'codeeditor-range-highlight',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'rangeHighlight'
        }); }
        createRangeHighlightDecoration(isWholeLine = true) {
            return (isWholeLine ? RangeHighlightDecorations_1._WHOLE_LINE_RANGE_HIGHLIGHT : RangeHighlightDecorations_1._RANGE_HIGHLIGHT);
        }
        dispose() {
            super.dispose();
            if (this.editor?.getModel()) {
                this.removeHighlightRange();
                this.editor = null;
            }
        }
    };
    exports.RangeHighlightDecorations = RangeHighlightDecorations;
    exports.RangeHighlightDecorations = RangeHighlightDecorations = RangeHighlightDecorations_1 = __decorate([
        __param(0, editorService_1.IEditorService)
    ], RangeHighlightDecorations);
    let FloatingEditorClickWidget = class FloatingEditorClickWidget extends floatingMenu_1.FloatingClickWidget {
        constructor(editor, label, keyBindingAction, keybindingService) {
            super(keyBindingAction && keybindingService.lookupKeybinding(keyBindingAction)
                ? `${label} (${keybindingService.lookupKeybinding(keyBindingAction).getLabel()})`
                : label);
            this.editor = editor;
        }
        getId() {
            return 'editor.overlayWidget.floatingClickWidget';
        }
        getPosition() {
            return {
                preference: 1 /* OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER */
            };
        }
        render() {
            super.render();
            this.editor.addOverlayWidget(this);
        }
        dispose() {
            this.editor.removeOverlayWidget(this);
            super.dispose();
        }
    };
    exports.FloatingEditorClickWidget = FloatingEditorClickWidget;
    exports.FloatingEditorClickWidget = FloatingEditorClickWidget = __decorate([
        __param(3, keybinding_1.IKeybindingService)
    ], FloatingEditorClickWidget);
    let FloatingEditorClickMenu = class FloatingEditorClickMenu extends floatingMenu_1.AbstractFloatingClickMenu {
        static { this.ID = 'editor.contrib.floatingClickMenu'; }
        constructor(editor, instantiationService, menuService, contextKeyService) {
            super(actions_1.MenuId.EditorContent, menuService, contextKeyService);
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.render();
        }
        createWidget(action) {
            return this.instantiationService.createInstance(FloatingEditorClickWidget, this.editor, action.label, action.id);
        }
        isVisible() {
            return !(this.editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) && this.editor?.hasModel() && !this.editor.getOption(61 /* EditorOption.inDiffEditor */);
        }
        getActionArg() {
            return this.editor.getModel()?.uri;
        }
    };
    exports.FloatingEditorClickMenu = FloatingEditorClickMenu;
    exports.FloatingEditorClickMenu = FloatingEditorClickMenu = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService)
    ], FloatingEditorClickMenu);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZWVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2NvZGVlZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTRCekYsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTs7UUFTeEQsWUFBNEIsYUFBOEM7WUFDekUsS0FBSyxFQUFFLENBQUM7WUFEb0Msa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBUHpELHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2xFLHVCQUFrQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFFckQsK0JBQTBCLEdBQWtCLElBQUksQ0FBQztZQUNqRCxXQUFNLEdBQXVCLElBQUksQ0FBQztZQUN6QixzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7UUFJM0UsQ0FBQztRQUVELG9CQUFvQjtZQUNuQixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ3BELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQztnQkFDckQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO29CQUMxQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3pDLENBQUMsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1lBRUQsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FB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