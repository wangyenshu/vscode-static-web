/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/common/model", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/base/browser/ui/aria/aria"], function (require, exports, functional_1, lifecycle_1, editorBrowser_1, model_1, editorColorRegistry_1, themeService_1, aria_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractEditorNavigationQuickAccessProvider = void 0;
    /**
     * A reusable quick access provider for the editor with support
     * for adding decorations for navigating in the currently active file
     * (for example "Go to line", "Go to symbol").
     */
    class AbstractEditorNavigationQuickAccessProvider {
        constructor(options) {
            this.options = options;
            //#endregion
            //#region Decorations Utils
            this.rangeHighlightDecorationId = undefined;
        }
        //#region Provider methods
        provide(picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // Apply options if any
            picker.canAcceptInBackground = !!this.options?.canAcceptInBackground;
            // Disable filtering & sorting, we control the results
            picker.matchOnLabel = picker.matchOnDescription = picker.matchOnDetail = picker.sortByLabel = false;
            // Provide based on current active editor
            const pickerDisposable = disposables.add(new lifecycle_1.MutableDisposable());
            pickerDisposable.value = this.doProvide(picker, token);
            // Re-create whenever the active editor changes
            disposables.add(this.onDidActiveTextEditorControlChange(() => {
                // Clear old
                pickerDisposable.value = undefined;
                // Add new
                pickerDisposable.value = this.doProvide(picker, token);
            }));
            return disposables;
        }
        doProvide(picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // With text control
            const editor = this.activeTextEditorControl;
            if (editor && this.canProvideWithTextEditor(editor)) {
                const context = { editor };
                // Restore any view state if this picker was closed
                // without actually going to a line
                const codeEditor = (0, editorBrowser_1.getCodeEditor)(editor);
                if (codeEditor) {
                    // Remember view state and update it when the cursor position
                    // changes even later because it could be that the user has
                    // configured quick access to remain open when focus is lost and
                    // we always want to restore the current location.
                    let lastKnownEditorViewState = editor.saveViewState() ?? undefined;
                    disposables.add(codeEditor.onDidChangeCursorPosition(() => {
                        lastKnownEditorViewState = editor.saveViewState() ?? undefined;
                    }));
                    context.restoreViewState = () => {
                        if (lastKnownEditorViewState && editor === this.activeTextEditorControl) {
                            editor.restoreViewState(lastKnownEditorViewState);
                        }
                    };
                    disposables.add((0, functional_1.createSingleCallFunction)(token.onCancellationRequested)(() => context.restoreViewState?.()));
                }
                // Clean up decorations on dispose
                disposables.add((0, lifecycle_1.toDisposable)(() => this.clearDecorations(editor)));
                // Ask subclass for entries
                disposables.add(this.provideWithTextEditor(context, picker, token));
            }
            // Without text control
            else {
                disposables.add(this.provideWithoutTextEditor(picker, token));
            }
            return disposables;
        }
        /**
         * Subclasses to implement if they can operate on the text editor.
         */
        canProvideWithTextEditor(editor) {
            return true;
        }
        gotoLocation({ editor }, options) {
            editor.setSelection(options.range, "code.jump" /* TextEditorSelectionSource.JUMP */);
            editor.revealRangeInCenter(options.range, 0 /* ScrollType.Smooth */);
            if (!options.preserveFocus) {
                editor.focus();
            }
            const model = editor.getModel();
            if (model && 'getLineContent' in model) {
                (0, aria_1.status)(`${model.getLineContent(options.range.startLineNumber)}`);
            }
        }
        getModel(editor) {
            return (0, editorBrowser_1.isDiffEditor)(editor) ?
                editor.getModel()?.modified :
                editor.getModel();
        }
        addDecorations(editor, range) {
            editor.changeDecorations(changeAccessor => {
                // Reset old decorations if any
                const deleteDecorations = [];
                if (this.rangeHighlightDecorationId) {
                    deleteDecorations.push(this.rangeHighlightDecorationId.overviewRulerDecorationId);
                    deleteDecorations.push(this.rangeHighlightDecorationId.rangeHighlightId);
                    this.rangeHighlightDecorationId = undefined;
                }
                // Add new decorations for the range
                const newDecorations = [
                    // highlight the entire line on the range
                    {
                        range,
                        options: {
                            description: 'quick-access-range-highlight',
                            className: 'rangeHighlight',
                            isWholeLine: true
                        }
                    },
                    // also add overview ruler highlight
                    {
                        range,
                        options: {
                            description: 'quick-access-range-highlight-overview',
                            overviewRuler: {
                                color: (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerRangeHighlight),
                                position: model_1.OverviewRulerLane.Full
                            }
                        }
                    }
                ];
                const [rangeHighlightId, overviewRulerDecorationId] = changeAccessor.deltaDecorations(deleteDecorations, newDecorations);
                this.rangeHighlightDecorationId = { rangeHighlightId, overviewRulerDecorationId };
            });
        }
        clearDecorations(editor) {
            const rangeHighlightDecorationId = this.rangeHighlightDecorationId;
            if (rangeHighlightDecorationId) {
                editor.changeDecorations(changeAccessor => {
                    changeAccessor.deltaDecorations([
                        rangeHighlightDecorationId.overviewRulerDecorationId,
                        rangeHighlightDecorationId.rangeHighlightId
                    ], []);
                });
                this.rangeHighlightDecorationId = undefined;
            }
        }
    }
    exports.AbstractEditorNavigationQuickAccessProvider = AbstractEditorNavigationQuickAccessProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yTmF2aWdhdGlvblF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvcXVpY2tBY2Nlc3MvYnJvd3Nlci9lZGl0b3JOYXZpZ2F0aW9uUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0NoRzs7OztPQUlHO0lBQ0gsTUFBc0IsMkNBQTJDO1FBRWhFLFlBQXNCLE9BQTZDO1lBQTdDLFlBQU8sR0FBUCxPQUFPLENBQXNDO1lBOEhuRSxZQUFZO1lBR1osMkJBQTJCO1lBRW5CLCtCQUEwQixHQUFzQyxTQUFTLENBQUM7UUFuSVgsQ0FBQztRQUV4RSwwQkFBMEI7UUFFMUIsT0FBTyxDQUFDLE1BQWtDLEVBQUUsS0FBd0I7WUFDbkUsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsdUJBQXVCO1lBQ3ZCLE1BQU0sQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxxQkFBcUIsQ0FBQztZQUVyRSxzREFBc0Q7WUFDdEQsTUFBTSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUVwRyx5Q0FBeUM7WUFDekMsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLGdCQUFnQixDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV2RCwrQ0FBK0M7WUFDL0MsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0NBQWtDLENBQUMsR0FBRyxF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