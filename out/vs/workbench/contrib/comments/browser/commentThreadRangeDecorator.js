/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/editor/common/model/textModel"], function (require, exports, lifecycle_1, languages_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadRangeDecorator = void 0;
    class CommentThreadRangeDecoration {
        get id() {
            return this._decorationId;
        }
        set id(id) {
            this._decorationId = id;
        }
        constructor(range, options) {
            this.range = range;
            this.options = options;
        }
    }
    class CommentThreadRangeDecorator extends lifecycle_1.Disposable {
        static { this.description = 'comment-thread-range-decorator'; }
        constructor(commentService) {
            super();
            this.decorationIds = [];
            this.activeDecorationIds = [];
            this.threadCollapseStateListeners = [];
            const decorationOptions = {
                description: CommentThreadRangeDecorator.description,
                isWholeLine: false,
                zIndex: 20,
                className: 'comment-thread-range',
                shouldFillLineOnLineBreak: true
            };
            this.decorationOptions = textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
            const activeDecorationOptions = {
                description: CommentThreadRangeDecorator.description,
                isWholeLine: false,
                zIndex: 20,
                className: 'comment-thread-range-current',
                shouldFillLineOnLineBreak: true
            };
            this.activeDecorationOptions = textModel_1.ModelDecorationOptions.createDynamic(activeDecorationOptions);
            this._register(commentService.onDidChangeCurrentCommentThread(thread => {
                this.updateCurrent(thread);
            }));
            this._register(commentService.onDidUpdateCommentThreads(() => {
                this.updateCurrent(undefined);
            }));
        }
        updateCurrent(thread) {
            if (!this.editor || (thread?.resource && (thread.resource?.toString() !== this.editor.getModel()?.uri.toString()))) {
                return;
            }
            this.currentThreadCollapseStateListener?.dispose();
            const newDecoration = [];
            if (thread) {
                const range = thread.range;
                if (range && !((range.startLineNumber === range.endLineNumber) && (range.startColumn === range.endColumn))) {
                    if (thread.collapsibleState === languages_1.CommentThreadCollapsibleState.Expanded) {
                        this.currentThreadCollapseStateListener = thread.onDidChangeCollapsibleState(state => {
                            if (state === languages_1.CommentThreadCollapsibleState.Collapsed) {
                                this.updateCurrent(undefined);
                            }
                        });
                        newDecoration.push(new CommentThreadRangeDecoration(range, this.activeDecorationOptions));
                    }
                }
            }
            this.editor.changeDecorations((changeAccessor) => {
                this.activeDecorationIds = changeAccessor.deltaDecorations(this.activeDecorationIds, newDecoration);
                newDecoration.forEach((decoration, index) => decoration.id = this.decorationIds[index]);
            });
        }
        update(editor, commentInfos) {
            const model = editor?.getModel();
            if (!editor || !model) {
                return;
            }
            (0, lifecycle_1.dispose)(this.threadCollapseStateListeners);
            this.editor = editor;
            const commentThreadRangeDecorations = [];
            for (const info of commentInfos) {
                info.threads.forEach(thread => {
                    if (thread.isDisposed) {
                        return;
                    }
                    const range = thread.range;
                    // We only want to show a range decoration when there's the range spans either multiple lines
                    // or, when is spans multiple characters on the sample line
                    if (!range || (range.startLineNumber === range.endLineNumber) && (range.startColumn === range.endColumn)) {
                        return;
                    }
                    this.threadCollapseStateListeners.push(thread.onDidChangeCollapsibleState(() => {
                        this.update(editor, commentInfos);
                    }));
                    if (thread.collapsibleState === languages_1.CommentThreadCollapsibleState.Collapsed) {
                        return;
                    }
                    commentThreadRangeDecorations.push(new CommentThreadRangeDecoration(range, this.decorationOptions));
                });
            }
            editor.changeDecorations((changeAccessor) => {
                this.decorationIds = changeAccessor.deltaDecorations(this.decorationIds, commentThreadRangeDecorations);
                commentThreadRangeDecorations.forEach((decoration, index) => decoration.id = this.decorationIds[index]);
            });
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.threadCollapseStateListeners);
            this.currentThreadCollapseStateListener?.dispose();
            super.dispose();
        }
    }
    exports.CommentThreadRangeDecorator = CommentThreadRangeDecorator;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFRocmVhZFJhbmdlRGVjb3JhdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50VGhyZWFkUmFuZ2VEZWNvcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQU0sNEJBQTRCO1FBR2pDLElBQVcsRUFBRTtZQUNaLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBVyxFQUFFLENBQUMsRUFBc0I7WUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVELFlBQ2lCLEtBQWEsRUFDYixPQUErQjtZQUQvQixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7UUFDaEQsQ0FBQztLQUNEO0lBRUQsTUFBYSwyQkFBNEIsU0FBUSxzQkFBVTtpQkFDM0MsZ0JBQVcsR0FBRyxnQ0FBZ0MsQUFBbkMsQ0FBb0M7UUFTOUQsWUFBWSxjQUErQjtZQUMxQyxLQUFLLEVBQUUsQ0FBQztZQVBELGtCQUFhLEdBQWEsRUFBRSxDQUFDO1lBQzdCLHdCQUFtQixHQUFhLEVBQUUsQ0FBQztZQUVuQyxpQ0FBNEIsR0FBa0IsRUFBRSxDQUFDO1lBS3hELE1BQU0saUJBQWlCLEdBQTRCO2dCQUNsRCxXQUFXLEVBQUUsMkJBQTJCLENBQUMsV0FBVztnQkFDcEQsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxzQkFBc0I7Z0JBQ2pDLHlCQUF5QixFQUFFLElBQUk7YUFDL0IsQ0FBQztZQUVGLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxrQ0FBc0IsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENB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