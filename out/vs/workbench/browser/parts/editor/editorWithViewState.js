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
define(["require", "exports", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle"], function (require, exports, event_1, editor_1, editorPane_1, storage_1, instantiation_1, telemetry_1, themeService_1, textResourceConfiguration_1, editorGroupsService_1, editorService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractEditorWithViewState = void 0;
    /**
     * Base class of editors that want to store and restore view state.
     */
    let AbstractEditorWithViewState = class AbstractEditorWithViewState extends editorPane_1.EditorPane {
        constructor(id, group, viewStateStorageKey, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService) {
            super(id, group, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.groupListener = this._register(new lifecycle_1.MutableDisposable());
            this.viewState = this.getEditorMemento(editorGroupService, textResourceConfigurationService, viewStateStorageKey, 100);
        }
        setEditorVisible(visible) {
            // Listen to close events to trigger `onWillCloseEditorInGroup`
            this.groupListener.value = this.group.onWillCloseEditor(e => this.onWillCloseEditor(e));
            super.setEditorVisible(visible);
        }
        onWillCloseEditor(e) {
            const editor = e.editor;
            if (editor === this.input) {
                // React to editors closing to preserve or clear view state. This needs to happen
                // in the `onWillCloseEditor` because at that time the editor has not yet
                // been disposed and we can safely persist the view state.
                this.updateEditorViewState(editor);
            }
        }
        clearInput() {
            // Preserve current input view state before clearing
            this.updateEditorViewState(this.input);
            super.clearInput();
        }
        saveState() {
            // Preserve current input view state before shutting down
            this.updateEditorViewState(this.input);
            super.saveState();
        }
        updateEditorViewState(input) {
            if (!input || !this.tracksEditorViewState(input)) {
                return; // ensure we have an input to handle view state for
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // we need a resource
            }
            // If we are not tracking disposed editor view state
            // make sure to clear the view state once the editor
            // is disposed.
            if (!this.tracksDisposedEditorViewState()) {
                if (!this.editorViewStateDisposables) {
                    this.editorViewStateDisposables = new Map();
                }
                if (!this.editorViewStateDisposables.has(input)) {
                    this.editorViewStateDisposables.set(input, event_1.Event.once(input.onWillDispose)(() => {
                        this.clearEditorViewState(resource, this.group);
                        this.editorViewStateDisposables?.delete(input);
                    }));
                }
            }
            // Clear the editor view state if:
            // - the editor view state should not be tracked for disposed editors
            // - the user configured to not restore view state unless the editor is still opened in the group
            if ((input.isDisposed() && !this.tracksDisposedEditorViewState()) ||
                (!this.shouldRestoreEditorViewState(input) && !this.group.contains(input))) {
                this.clearEditorViewState(resource, this.group);
            }
            // Otherwise we save the view state
            else if (!input.isDisposed()) {
                this.saveEditorViewState(resource);
            }
        }
        shouldRestoreEditorViewState(input, context) {
            // new editor: check with workbench.editor.restoreViewState setting
            if (context?.newInGroup) {
                return this.textResourceConfigurationService.getValue(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }), 'workbench.editor.restoreViewState') === false ? false : true /* restore by default */;
            }
            // existing editor: always restore viewstate
            return true;
        }
        getViewState() {
            const input = this.input;
            if (!input || !this.tracksEditorViewState(input)) {
                return; // need valid input for view state
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // need a resource for finding view state
            }
            return this.computeEditorViewState(resource);
        }
        saveEditorViewState(resource) {
            const editorViewState = this.computeEditorViewState(resource);
            if (!editorViewState) {
                return;
            }
            this.viewState.saveEditorState(this.group, resource, editorViewState);
        }
        loadEditorViewState(input, context) {
            if (!input) {
                return undefined; // we need valid input
            }
            if (!this.tracksEditorViewState(input)) {
                return undefined; // not tracking for input
            }
            if (!this.shouldRestoreEditorViewState(input, context)) {
                return undefined; // not enabled for input
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // need a resource for finding view state
            }
            return this.viewState.loadEditorState(this.group, resource);
        }
        moveEditorViewState(source, target, comparer) {
            return this.viewState.moveEditorState(source, target, comparer);
        }
        clearEditorViewState(resource, group) {
            this.viewState.clearEditorState(resource, group);
        }
        dispose() {
            super.dispose();
            if (this.editorViewStateDisposables) {
                for (const [, disposables] of this.editorViewStateDisposables) {
                    disposables.dispose();
                }
                this.editorViewStateDisposables = undefined;
            }
        }
        /**
         * Whether view state should be tracked even when the editor is
         * disposed.
         *
         * Subclasses should override this if the input can be restored
         * from the resource at a later point, e.g. if backed by files.
         */
        tracksDisposedEditorViewState() {
            return false;
        }
    };
    exports.AbstractEditorWithViewState = AbstractEditorWithViewState;
    exports.AbstractEditorWithViewState = AbstractEditorWithViewState = __decorate([
        __param(3, telemetry_1.ITelemetryService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, themeService_1.IThemeService),
        __param(8, editorService_1.IEditorService),
        __param(9, editorGroupsService_1.IEditorGroupsService)
    ], AbstractEditorWithViewState);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yV2l0aFZpZXdTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JXaXRoVmlld1N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCaEc7O09BRUc7SUFDSSxJQUFlLDJCQUEyQixHQUExQyxNQUFlLDJCQUE4QyxTQUFRLHVCQUFVO1FBUXJGLFlBQ0MsRUFBVSxFQUNWLEtBQW1CLEVBQ25CLG1CQUEyQixFQUNSLGdCQUFtQyxFQUMvQixvQkFBOEQsRUFDcEUsY0FBK0IsRUFDYixnQ0FBc0YsRUFDMUcsWUFBMkIsRUFDMUIsYUFBZ0QsRUFDMUMsa0JBQTJEO1lBRWpGLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQVB2Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRS9CLHFDQUFnQyxHQUFoQyxnQ0FBZ0MsQ0FBbUM7WUFFdEYsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFkakUsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBa0J4RSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBSSxrQkFBa0IsRUFBRSxnQ0FBZ0MsRUFBRSxtQkFBbUIsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMzSCxDQUFDO1FBRWtCLGdCQUFnQixDQUFDLE9BQWdCO1lBRW5ELCtEQUErRDtZQUMvRCxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixD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