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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/speech/common/speechService", "vs/base/common/codicons", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/keybinding/common/keybinding", "vs/editor/common/core/editOperation", "vs/editor/common/core/selection", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/platform/actions/common/actions", "vs/base/common/types", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/themables", "vs/css!./editorDictation"], function (require, exports, nls_1, cancellation_1, lifecycle_1, contextkey_1, speechService_1, codicons_1, editorExtensions_1, editorContextKeys_1, keybinding_1, editOperation_1, selection_1, position_1, range_1, actions_1, types_1, actionbar_1, actions_2, themables_1) {
    "use strict";
    var EditorDictation_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorDictation = exports.DictationWidget = exports.EditorDictationStopAction = exports.EditorDictationStartAction = void 0;
    const EDITOR_DICTATION_IN_PROGRESS = new contextkey_1.RawContextKey('editorDictation.inProgress', false);
    const VOICE_CATEGORY = (0, nls_1.localize2)('voiceCategory', "Voice");
    class EditorDictationStartAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'workbench.action.editorDictation.start',
                title: (0, nls_1.localize2)('startDictation', "Start Dictation in Editor"),
                category: VOICE_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, EDITOR_DICTATION_IN_PROGRESS.toNegated(), editorContextKeys_1.EditorContextKeys.readOnly.toNegated()),
                f1: true,
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 52 /* KeyCode.KeyV */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        runEditorCommand(accessor, editor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const holdMode = keybindingService.enableKeybindingHoldMode(this.desc.id);
            if (holdMode) {
                let shouldCallStop = false;
                const handle = setTimeout(() => {
                    shouldCallStop = true;
                }, 500);
                holdMode.finally(() => {
                    clearTimeout(handle);
                    if (shouldCallStop) {
                        EditorDictation.get(editor)?.stop();
                    }
                });
            }
            EditorDictation.get(editor)?.start();
        }
    }
    exports.EditorDictationStartAction = EditorDictationStartAction;
    class EditorDictationStopAction extends editorExtensions_1.EditorAction2 {
        static { this.ID = 'workbench.action.editorDictation.stop'; }
        constructor() {
            super({
                id: EditorDictationStopAction.ID,
                title: (0, nls_1.localize2)('stopDictation', "Stop Dictation in Editor"),
                category: VOICE_CATEGORY,
                precondition: EDITOR_DICTATION_IN_PROGRESS,
                f1: true,
                keybinding: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 100
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            EditorDictation.get(editor)?.stop();
        }
    }
    exports.EditorDictationStopAction = EditorDictationStopAction;
    class DictationWidget extends lifecycle_1.Disposable {
        constructor(editor, keybindingService) {
            super();
            this.editor = editor;
            this.suppressMouseDown = true;
            this.allowEditorOverflow = true;
            this.domNode = document.createElement('div');
            const actionBar = this._register(new actionbar_1.ActionBar(this.domNode));
            const stopActionKeybinding = keybindingService.lookupKeybinding(EditorDictationStopAction.ID)?.getLabel();
            actionBar.push((0, actions_2.toAction)({
                id: EditorDictationStopAction.ID,
                label: stopActionKeybinding ? (0, nls_1.localize)('stopDictationShort1', "Stop Dictation ({0})", stopActionKeybinding) : (0, nls_1.localize)('stopDictationShort2', "Stop Dictation"),
                class: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.micFilled),
                run: () => EditorDictation.get(editor)?.stop()
            }), { icon: true, label: false, keybinding: stopActionKeybinding });
            this.domNode.classList.add('editor-dictation-widget');
            this.domNode.appendChild(actionBar.domNode);
        }
        getId() {
            return 'editorDictation';
        }
        getDomNode() {
            return this.domNode;
        }
        getPosition() {
            if (!this.editor.hasModel()) {
                return null;
            }
            const selection = this.editor.getSelection();
            return {
                position: selection.getPosition(),
                preference: [
                    selection.getPosition().equals(selection.getStartPosition()) ? 1 /* ContentWidgetPositionPreference.ABOVE */ : 2 /* ContentWidgetPositionPreference.BELOW */,
                    0 /* ContentWidgetPositionPreference.EXACT */
                ]
            };
        }
        beforeRender() {
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            const width = this.editor.getLayoutInfo().contentWidth * 0.7;
            this.domNode.style.setProperty('--vscode-editor-dictation-widget-height', `${lineHeight}px`);
            this.domNode.style.setProperty('--vscode-editor-dictation-widget-width', `${width}px`);
            return null;
        }
        show() {
            this.editor.addContentWidget(this);
        }
        layout() {
            this.editor.layoutContentWidget(this);
        }
        active() {
            this.domNode.classList.add('recording');
        }
        hide() {
            this.domNode.classList.remove('recording');
            this.editor.removeContentWidget(this);
        }
    }
    exports.DictationWidget = DictationWidget;
    let EditorDictation = class EditorDictation extends lifecycle_1.Disposable {
        static { EditorDictation_1 = this; }
        static { this.ID = 'editorDictation'; }
        static get(editor) {
            return editor.getContribution(EditorDictation_1.ID);
        }
        constructor(editor, speechService, contextKeyService, keybindingService) {
            super();
            this.editor = editor;
            this.speechService = speechService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.widget = this._register(new DictationWidget(this.editor, this.keybindingService));
            this.editorDictationInProgress = EDITOR_DICTATION_IN_PROGRESS.bindTo(this.contextKeyService);
            this.sessionDisposables = this._register(new lifecycle_1.MutableDisposable());
        }
        async start() {
            const disposables = new lifecycle_1.DisposableStore();
            this.sessionDisposables.value = disposables;
            this.widget.show();
            disposables.add((0, lifecycle_1.toDisposable)(() => this.widget.hide()));
            this.editorDictationInProgress.set(true);
            disposables.add((0, lifecycle_1.toDisposable)(() => this.editorDictationInProgress.reset()));
            const collection = this.editor.createDecorationsCollection();
            disposables.add((0, lifecycle_1.toDisposable)(() => collection.clear()));
            disposables.add(this.editor.onDidChangeCursorPosition(() => this.widget.layout()));
            let previewStart = undefined;
            let lastReplaceTextLength = 0;
            const replaceText = (text, isPreview) => {
                if (!previewStart) {
                    previewStart = (0, types_1.assertIsDefined)(this.editor.getPosition());
                }
                const endPosition = new position_1.Position(previewStart.lineNumber, previewStart.column + text.length);
                this.editor.executeEdits(EditorDictation_1.ID, [
                    editOperation_1.EditOperation.replace(range_1.Range.fromPositions(previewStart, previewStart.with(undefined, previewStart.column + lastReplaceTextLength)), text)
                ], [
                    selection_1.Selection.fromPositions(endPosition)
                ]);
                if (isPreview) {
                    collection.set([
                        {
                            range: range_1.Range.fromPositions(previewStart, previewStart.with(undefined, previewStart.column + text.length)),
                            options: {
                                description: 'editor-dictation-preview',
                                inlineClassName: 'ghost-text-decoration-preview'
                            }
                        }
                    ]);
                }
                else {
                    collection.clear();
                }
                lastReplaceTextLength = text.length;
                if (!isPreview) {
                    previewStart = undefined;
                    lastReplaceTextLength = 0;
                }
                this.editor.revealPositionInCenterIfOutsideViewport(endPosition);
            };
            const cts = new cancellation_1.CancellationTokenSource();
            disposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            const session = await this.speechService.createSpeechToTextSession(cts.token, 'editor');
            disposables.add(session.onDidChange(e => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                switch (e.status) {
                    case speechService_1.SpeechToTextStatus.Started:
                        this.widget.active();
                        break;
                    case speechService_1.SpeechToTextStatus.Stopped:
                        disposables.dispose();
                        break;
                    case speechService_1.SpeechToTextStatus.Recognizing: {
                        if (!e.text) {
                            return;
                        }
                        replaceText(e.text, true);
                        break;
                    }
                    case speechService_1.SpeechToTextStatus.Recognized: {
                        if (!e.text) {
                            return;
                        }
                        replaceText(`${e.text} `, false);
                        break;
                    }
                }
            }));
        }
        stop() {
            this.sessionDisposables.clear();
        }
    };
    exports.EditorDictation = EditorDictation;
    exports.EditorDictation = EditorDictation = EditorDictation_1 = __decorate([
        __param(1, speechService_1.ISpeechService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService)
    ], EditorDictation);
    (0, editorExtensions_1.registerEditorContribution)(EditorDictation.ID, EditorDictation, 4 /* EditorContributionInstantiation.Lazy */);
    (0, actions_1.registerAction2)(EditorDictationStartAction);
    (0, actions_1.registerAction2)(EditorDictationStopAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRGljdGF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL2RpY3RhdGlvbi9lZGl0b3JEaWN0YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTZCaEcsTUFBTSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckcsTUFBTSxjQUFjLEdBQUcsSUFBQSxlQUFTLEVBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRTNELE1BQWEsMEJBQTJCLFNBQVEsZ0NBQWE7UUFFNUQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHdDQUF3QztnQkFDNUMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGdCQUFnQixFQUFFLDJCQUEyQixDQUFDO2dCQUMvRCxRQUFRLEVBQUUsY0FBYztnQkFDeEIsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGlDQUFpQixFQUFFLDRCQUE0QixDQUFDLFNBQVMsRUFBRSxFQUFFLHFDQUFpQixDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckksRUFBRSxFQUFFLElBQUk7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLE9BQU8sRUFBRSxnREFBMkIsd0JBQWU7b0JBQ25ELE1BQU0sNkNBQW1DO2lCQUN6QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxnQkFBZ0IsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3hFLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBRTNELE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLHdCQUF3QixDQUFD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