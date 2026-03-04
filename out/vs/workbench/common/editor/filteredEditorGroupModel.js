/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnstickyEditorGroupModel = exports.StickyEditorGroupModel = void 0;
    class FilteredEditorGroupModel extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this._onDidModelChange = this._register(new event_1.Emitter());
            this.onDidModelChange = this._onDidModelChange.event;
            this._register(this.model.onDidModelChange(e => {
                const candidateOrIndex = e.editorIndex ?? e.editor;
                if (candidateOrIndex !== undefined) {
                    if (!this.filter(candidateOrIndex)) {
                        return; // exclude events for excluded items
                    }
                }
                this._onDidModelChange.fire(e);
            }));
        }
        get id() { return this.model.id; }
        get isLocked() { return this.model.isLocked; }
        get stickyCount() { return this.model.stickyCount; }
        get activeEditor() { return this.model.activeEditor && this.filter(this.model.activeEditor) ? this.model.activeEditor : null; }
        get previewEditor() { return this.model.previewEditor && this.filter(this.model.previewEditor) ? this.model.previewEditor : null; }
        isPinned(editorOrIndex) { return this.model.isPinned(editorOrIndex); }
        isTransient(editorOrIndex) { return this.model.isTransient(editorOrIndex); }
        isSticky(editorOrIndex) { return this.model.isSticky(editorOrIndex); }
        isActive(editor) { return this.model.isActive(editor); }
        isFirst(editor) {
            return this.model.isFirst(editor, this.getEditors(1 /* EditorsOrder.SEQUENTIAL */));
        }
        isLast(editor) {
            return this.model.isLast(editor, this.getEditors(1 /* EditorsOrder.SEQUENTIAL */));
        }
        getEditors(order, options) {
            const editors = this.model.getEditors(order, options);
            return editors.filter(e => this.filter(e));
        }
        findEditor(candidate, options) {
            const result = this.model.findEditor(candidate, options);
            if (!result) {
                return undefined;
            }
            return this.filter(result[1]) ? result : undefined;
        }
    }
    class StickyEditorGroupModel extends FilteredEditorGroupModel {
        get count() { return this.model.stickyCount; }
        getEditors(order, options) {
            if (options?.excludeSticky) {
                return [];
            }
            if (order === 1 /* EditorsOrder.SEQUENTIAL */) {
                return this.model.getEditors(1 /* EditorsOrder.SEQUENTIAL */).slice(0, this.model.stickyCount);
            }
            return super.getEditors(order, options);
        }
        isSticky(editorOrIndex) {
            return true;
        }
        getEditorByIndex(index) {
            return index < this.count ? this.model.getEditorByIndex(index) : undefined;
        }
        indexOf(editor, editors, options) {
            const editorIndex = this.model.indexOf(editor, editors, options);
            if (editorIndex < 0 || editorIndex >= this.model.stickyCount) {
                return -1;
            }
            return editorIndex;
        }
        contains(candidate, options) {
            const editorIndex = this.model.indexOf(candidate, undefined, options);
            return editorIndex >= 0 && editorIndex < this.model.stickyCount;
        }
        filter(candidateOrIndex) {
            return this.model.isSticky(candidateOrIndex);
        }
    }
    exports.StickyEditorGroupModel = StickyEditorGroupModel;
    class UnstickyEditorGroupModel extends FilteredEditorGroupModel {
        get count() { return this.model.count - this.model.stickyCount; }
        get stickyCount() { return 0; }
        isSticky(editorOrIndex) {
            return false;
        }
        getEditors(order, options) {
            if (order === 1 /* EditorsOrder.SEQUENTIAL */) {
                return this.model.getEditors(1 /* EditorsOrder.SEQUENTIAL */).slice(this.model.stickyCount);
            }
            return super.getEditors(order, options);
        }
        getEditorByIndex(index) {
            return index >= 0 ? this.model.getEditorByIndex(index + this.model.stickyCount) : undefined;
        }
        indexOf(editor, editors, options) {
            const editorIndex = this.model.indexOf(editor, editors, options);
            if (editorIndex < this.model.stickyCount || editorIndex >= this.model.count) {
                return -1;
            }
            return editorIndex - this.model.stickyCount;
        }
        contains(candidate, options) {
            const editorIndex = this.model.indexOf(candidate, undefined, options);
            return editorIndex >= this.model.stickyCount && editorIndex < this.model.count;
        }
        filter(candidateOrIndex) {
            return !this.model.isSticky(candidateOrIndex);
        }
    }
    exports.UnstickyEditorGroupModel = UnstickyEditorGroupModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVyZWRFZGl0b3JHcm91cE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9lZGl0b3IvZmlsdGVyZWRFZGl0b3JHcm91cE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFlLHdCQUF5QixTQUFRLHNCQUFVO1FBS3pELFlBQ29CLEtBQWdDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBRlcsVUFBSyxHQUFMLEtBQUssQ0FBMkI7WUFKbkMsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMEIsQ0FBQyxDQUFDO1lBQ2xGLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFPeEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM5QyxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDbkQsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO3dCQUNwQyxPQUFPLENBQUMsb0NBQW9DO29CQUM3QyxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksRUFBRSxLQUFzQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFJLFFBQVEsS0FB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