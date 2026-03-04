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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/base/common/codicons", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/window"], function (require, exports, nls, lifecycle_1, editorExtensions_1, codeEditorService_1, actions_1, contextkey_1, editorContextKeys_1, codicons_1, contributions_1, editorService_1, event_1, dom_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writeTransientState = writeTransientState;
    exports.readTransientState = readTransientState;
    const transientWordWrapState = 'transientWordWrapState';
    const isWordWrapMinifiedKey = 'isWordWrapMinified';
    const isDominatedByLongLinesKey = 'isDominatedByLongLines';
    const CAN_TOGGLE_WORD_WRAP = new contextkey_1.RawContextKey('canToggleWordWrap', false, true);
    const EDITOR_WORD_WRAP = new contextkey_1.RawContextKey('editorWordWrap', false, nls.localize('editorWordWrap', 'Whether the editor is currently using word wrapping.'));
    /**
     * Store (in memory) the word wrap state for a particular model.
     */
    function writeTransientState(model, state, codeEditorService) {
        codeEditorService.setTransientModelProperty(model, transientWordWrapState, state);
    }
    /**
     * Read (in memory) the word wrap state for a particular model.
     */
    function readTransientState(model, codeEditorService) {
        return codeEditorService.getTransientModelProperty(model, transientWordWrapState);
    }
    const TOGGLE_WORD_WRAP_ID = 'editor.action.toggleWordWrap';
    class ToggleWordWrapAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: TOGGLE_WORD_WRAP_ID,
                label: nls.localize('toggle.wordwrap', "View: Toggle Word Wrap"),
                alias: 'View: Toggle Word Wrap',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 512 /* KeyMod.Alt */ | 56 /* KeyCode.KeyZ */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            if (!canToggleWordWrap(codeEditorService, editor)) {
                return;
            }
            const model = editor.getModel();
            // Read the current state
            const transientState = readTransientState(model, codeEditorService);
            // Compute the new state
            let newState;
            if (transientState) {
                newState = null;
            }
            else {
                const actualWrappingInfo = editor.getOption(146 /* EditorOption.wrappingInfo */);
                const wordWrapOverride = (actualWrappingInfo.wrappingColumn === -1 ? 'on' : 'off');
                newState = { wordWrapOverride };
            }
            // Write the new state
            // (this will cause an event and the controller will apply the state)
            writeTransientState(model, newState, codeEditorService);
            // if we are in a diff editor, update the other editor (if possible)
            const diffEditor = findDiffEditorContainingCodeEditor(editor, codeEditorService);
            if (diffEditor) {
                const originalEditor = diffEditor.getOriginalEditor();
                const modifiedEditor = diffEditor.getModifiedEditor();
                const otherEditor = (originalEditor === editor ? modifiedEditor : originalEditor);
                if (canToggleWordWrap(codeEditorService, otherEditor)) {
                    writeTransientState(otherEditor.getModel(), newState, codeEditorService);
                    diffEditor.updateOptions({});
                }
            }
        }
    }
    /**
     * If `editor` is the original or modified editor of a diff editor, it returns it.
     * It returns null otherwise.
     */
    function findDiffEditorContainingCodeEditor(editor, codeEditorService) {
        if (!editor.getOption(61 /* EditorOption.inDiffEditor */)) {
            return null;
        }
        for (const diffEditor of codeEditorService.listDiffEditors()) {
            const originalEditor = diffEditor.getOriginalEditor();
            const modifiedEditor = diffEditor.getModifiedEditor();
            if (originalEditor === editor || modifiedEditor === editor) {
                return diffEditor;
            }
        }
        return null;
    }
    let ToggleWordWrapController = class ToggleWordWrapController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.toggleWordWrapController'; }
        constructor(_editor, _contextKeyService, _codeEditorService) {
            super();
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._codeEditorService = _codeEditorService;
            const options = this._editor.getOptions();
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const isWordWrapMinified = this._contextKeyService.createKey(isWordWrapMinifiedKey, wrappingInfo.isWordWrapMinified);
            const isDominatedByLongLines = this._contextKeyService.createKey(isDominatedByLongLinesKey, wrappingInfo.isDominatedByLongLines);
            let currentlyApplyingEditorConfig = false;
            this._register(_editor.onDidChangeConfiguration((e) => {
                if (!e.hasChanged(146 /* EditorOption.wrappingInfo */)) {
                    return;
                }
                const options = this._editor.getOptions();
                const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
                isWordWrapMinified.set(wrappingInfo.isWordWrapMinified);
                isDominatedByLongLines.set(wrappingInfo.isDominatedByLongLines);
                if (!currentlyApplyingEditorConfig) {
                    // I am not the cause of the word wrap getting changed
                    ensureWordWrapSettings();
                }
            }));
            this._register(_editor.onDidChangeModel((e) => {
                ensureWordWrapSettings();
            }));
            this._register(_codeEditorService.onDidChangeTransientModelProperty(() => {
                ensureWordWrapSettings();
            }));
            const ensureWordWrapSettings = () => {
                if (!canToggleWordWrap(this._codeEditorService, this._editor)) {
                    return;
                }
                const transientState = readTransientState(this._editor.getModel(), this._codeEditorService);
                // Apply the state
                try {
                    currentlyApplyingEditorConfig = true;
                    this._applyWordWrapState(transientState);
                }
                finally {
                    currentlyApplyingEditorConfig = false;
                }
            };
        }
        _applyWordWrapState(state) {
            const wordWrapOverride2 = state ? state.wordWrapOverride : 'inherit';
            this._editor.updateOptions({
                wordWrapOverride2: wordWrapOverride2
            });
        }
    };
    ToggleWordWrapController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], ToggleWordWrapController);
    let DiffToggleWordWrapController = class DiffToggleWordWrapController extends lifecycle_1.Disposable {
        static { this.ID = 'diffeditor.contrib.toggleWordWrapController'; }
        constructor(_diffEditor, _codeEditorService) {
            super();
            this._diffEditor = _diffEditor;
            this._codeEditorService = _codeEditorService;
            this._register(this._diffEditor.onDidChangeModel(() => {
                this._ensureSyncedWordWrapToggle();
            }));
        }
        _ensureSyncedWordWrapToggle() {
            const originalEditor = this._diffEditor.getOriginalEditor();
            const modifiedEditor = this._diffEditor.getModifiedEditor();
            if (!originalEditor.hasModel() || !modifiedEditor.hasModel()) {
                return;
            }
            const originalTransientState = readTransientState(originalEditor.getModel(), this._codeEditorService);
            const modifiedTransientState = readTransientState(modifiedEditor.getModel(), this._codeEditorService);
            if (originalTransientState && !modifiedTransientState && canToggleWordWrap(this._codeEditorService, originalEditor)) {
                writeTransientState(modifiedEditor.getModel(), originalTransientState, this._codeEditorService);
                this._diffEditor.updateOptions({});
            }
            if (!originalTransientState && modifiedTransientState && canToggleWordWrap(this._codeEditorService, modifiedEditor)) {
                writeTransientState(originalEditor.getModel(), modifiedTransientState, this._codeEditorService);
                this._diffEditor.updateOptions({});
            }
        }
    };
    DiffToggleWordWrapController = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService)
    ], DiffToggleWordWrapController);
    function canToggleWordWrap(codeEditorService, editor) {
        if (!editor) {
            return false;
        }
        if (editor.isSimpleWidget) {
            // in a simple widget...
            return false;
        }
        // Ensure correct word wrap settings
        const model = editor.getModel();
        if (!model) {
            return false;
        }
        if (editor.getOption(61 /* EditorOption.inDiffEditor */)) {
            // this editor belongs to a diff editor
            for (const diffEditor of codeEditorService.listDiffEditors()) {
                if (diffEditor.getOriginalEditor() === editor && !diffEditor.renderSideBySide) {
                    // this editor is the left side of an inline diff editor
                    return false;
                }
            }
        }
        return true;
    }
    let EditorWordWrapContextKeyTracker = class EditorWordWrapContextKeyTracker extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.editorWordWrapContextKeyTracker'; }
        constructor(_editorService, _codeEditorService, _contextService) {
            super();
            this._editorService = _editorService;
            this._codeEditorService = _codeEditorService;
            this._contextService = _contextService;
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(window, 'focus', () => this._update(), true));
                disposables.add((0, dom_1.addDisposableListener)(window, 'blur', () => this._update(), true));
            }, { window: window_1.mainWindow, disposables: this._store }));
            this._editorService.onDidActiveEditorChange(() => this._update());
            this._canToggleWordWrap = CAN_TOGGLE_WORD_WRAP.bindTo(this._contextService);
            this._editorWordWrap = EDITOR_WORD_WRAP.bindTo(this._contextService);
            this._activeEditor = null;
            this._activeEditorListener = new lifecycle_1.DisposableStore();
            this._update();
        }
        _update() {
            const activeEditor = this._codeEditorService.getFocusedCodeEditor() || this._codeEditorService.getActiveCodeEditor();
            if (this._activeEditor === activeEditor) {
                // no change
                return;
            }
            this._activeEditorListener.clear();
            this._activeEditor = activeEditor;
            if (activeEditor) {
                this._activeEditorListener.add(activeEditor.onDidChangeModel(() => this._updateFromCodeEditor()));
                this._activeEditorListener.add(activeEditor.onDidChangeConfiguration((e) => {
                    if (e.hasChanged(146 /* EditorOption.wrappingInfo */)) {
                        this._updateFromCodeEditor();
                    }
                }));
                this._updateFromCodeEditor();
            }
        }
        _updateFromCodeEditor() {
            if (!canToggleWordWrap(this._codeEditorService, this._activeEditor)) {
                return this._setValues(false, false);
            }
            else {
                const wrappingInfo = this._activeEditor.getOption(146 /* EditorOption.wrappingInfo */);
                this._setValues(true, wrappingInfo.wrappingColumn !== -1);
            }
        }
        _setValues(canToggleWordWrap, isWordWrap) {
            this._canToggleWordWrap.set(canToggleWordWrap);
            this._editorWordWrap.set(isWordWrap);
        }
    };
    EditorWordWrapContextKeyTracker = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, contextkey_1.IContextKeyService)
    ], EditorWordWrapContextKeyTracker);
    (0, contributions_1.registerWorkbenchContribution2)(EditorWordWrapContextKeyTracker.ID, EditorWordWrapContextKeyTracker, 3 /* WorkbenchPhase.AfterRestored */);
    (0, editorExtensions_1.registerEditorContribution)(ToggleWordWrapController.ID, ToggleWordWrapController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to change the editor word wrap configuration
    (0, editorExtensions_1.registerDiffEditorContribution)(DiffToggleWordWrapController.ID, DiffToggleWordWrapController);
    (0, editorExtensions_1.registerEditorAction)(ToggleWordWrapAction);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize('unwrapMinified', "Disable wrapping for this file"),
            icon: codicons_1.Codicon.wordWrap
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(isDominatedByLongLinesKey), contextkey_1.ContextKeyExpr.has(isWordWrapMinifiedKey))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize('wrapMinified', "Enable wrapping for this file"),
            icon: codicons_1.Codicon.wordWrap
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.inDiffEditor.negate(), contextkey_1.ContextKeyExpr.has(isDominatedByLongLinesKey), contextkey_1.ContextKeyExpr.not(isWordWrapMinifiedKey))
    });
    // View menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize({ key: 'miToggleWordWrap', comment: ['&& denotes a mnemonic'] }, "&&Word Wrap"),
            toggled: EDITOR_WORD_WRAP,
            precondition: CAN_TOGGLE_WORD_WRAP
        },
        order: 1,
        group: '5_editor'
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlV29yZFdyYXAuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2Jyb3dzZXIvdG9nZ2xlV29yZFdyYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFzQ2hHLGtEQUVDO0lBS0QsZ0RBRUM7SUF6QkQsTUFBTSxzQkFBc0IsR0FBRyx3QkFBd0IsQ0FBQztJQUN4RCxNQUFNLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDO0lBQ25ELE1BQU0seUJBQXlCLEdBQUcsd0JBQXdCLENBQUM7SUFDM0QsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGdCQUFnQixFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLHNEQUFzRCxDQUFDLENBQUMsQ0FBQztJQVNySzs7T0FFRztJQUNILFNBQWdCLG1CQUFtQixDQUFDLEtBQWlCLEVBQUUsS0FBcUMsRUFBRSxpQkFBcUM7UUFDbEksaUJBQWlCLENBQUMseUJBQXlCLENBQUMsS0FBSyxFQUFFLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25GLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLGtCQUFrQixDQUFDLEtBQWlCLEVBQUUsaUJBQXFDO1FBQzFGLE9BQU8saUJBQWlCLENBQUMseUJBQXlCLENBQUMsS0FBSyxFQUFFLHNCQUFzQixDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVELE1BQU0sbUJBQW1CLEdBQUcsOEJBQThCLENBQUM7SUFDM0QsTUFBTSxvQkFBcUIsU0FBUSwrQkFBWTtRQUU5QztZQUNDLEtB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