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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/dataTransfer", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/editor/browser/dnd", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/treeViewsDnd", "vs/editor/common/services/treeViewsDndService", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/inlineProgress/browser/inlineProgress", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dnd/browser/dnd", "vs/platform/instantiation/common/instantiation", "./edit", "./postEditWidget"], function (require, exports, arrays_1, async_1, dataTransfer_1, hierarchicalKind_1, lifecycle_1, dnd_1, range_1, languageFeatures_1, treeViewsDnd_1, treeViewsDndService_1, editorState_1, inlineProgress_1, nls_1, configuration_1, contextkey_1, dnd_2, instantiation_1, edit_1, postEditWidget_1) {
    "use strict";
    var DropIntoEditorController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropIntoEditorController = exports.dropWidgetVisibleCtx = exports.changeDropTypeCommandId = exports.defaultProviderConfig = void 0;
    exports.defaultProviderConfig = 'editor.experimental.dropIntoEditor.defaultProvider';
    exports.changeDropTypeCommandId = 'editor.changeDropType';
    exports.dropWidgetVisibleCtx = new contextkey_1.RawContextKey('dropWidgetVisible', false, (0, nls_1.localize)('dropWidgetVisible', "Whether the drop widget is showing"));
    let DropIntoEditorController = class DropIntoEditorController extends lifecycle_1.Disposable {
        static { DropIntoEditorController_1 = this; }
        static { this.ID = 'editor.contrib.dropIntoEditorController'; }
        static get(editor) {
            return editor.getContribution(DropIntoEditorController_1.ID);
        }
        constructor(editor, instantiationService, _configService, _languageFeaturesService, _treeViewsDragAndDropService) {
            super();
            this._configService = _configService;
            this._languageFeaturesService = _languageFeaturesService;
            this._treeViewsDragAndDropService = _treeViewsDragAndDropService;
            this.treeItemsTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this._dropProgressManager = this._register(instantiationService.createInstance(inlineProgress_1.InlineProgressManager, 'dropIntoEditor', editor));
            this._postDropWidgetManager = this._register(instantiationService.createInstance(postEditWidget_1.PostEditWidgetManager, 'dropIntoEditor', editor, exports.dropWidgetVisibleCtx, { id: exports.changeDropTypeCommandId, label: (0, nls_1.localize)('postDropWidgetTitle', "Show drop options...") }));
            this._register(editor.onDropIntoEditor(e => this.onDropIntoEditor(editor, e.position, e.event)));
        }
        clearWidgets() {
            this._postDropWidgetManager.clear();
        }
        changeDropType() {
            this._postDropWidgetManager.tryShowSelector();
        }
        async onDropIntoEditor(editor, position, dragEvent) {
            if (!dragEvent.dataTransfer || !editor.hasModel()) {
                return;
            }
            this._currentOperation?.cancel();
            editor.focus();
            editor.setPosition(position);
            const p = (0, async_1.createCancelablePromise)(async (token) => {
                const tokenSource = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* CodeEditorStateFlag.Value */, undefined, token);
                try {
                    const ourDataTransfer = await this.extractDataTransferData(dragEvent);
                    if (ourDataTransfer.size === 0 || tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    const model = editor.getModel();
                    if (!model) {
                        return;
                    }
                    const providers = this._languageFeaturesService.documentDropEditProvider
                        .ordered(model)
                        .filter(provider => {
                        if (!provider.dropMimeTypes) {
                            // Keep all providers that don't specify mime types
                            return true;
                        }
                        return provider.dropMimeTypes.some(mime => ourDataTransfer.matches(mime));
                    });
                    const edits = await this.getDropEdits(providers, model, position, ourDataTransfer, tokenSource);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    if (edits.length) {
                        const activeEditIndex = this.getInitialActiveEditIndex(model, edits);
                        const canShowWidget = editor.getOption(36 /* EditorOption.dropIntoEditor */).showDropSelector === 'afterDrop';
                        // Pass in the parent token here as it tracks cancelling the entire drop operation
                        await this._postDropWidgetManager.applyEditAndShowIfNeeded([range_1.Range.fromPositions(position)], { activeEditIndex, allEdits: edits }, canShowWidget, async (edit) => edit, token);
                    }
                }
                finally {
                    tokenSource.dispose();
                    if (this._currentOperation === p) {
                        this._currentOperation = undefined;
                    }
                }
            });
            this._dropProgressManager.showWhile(position, (0, nls_1.localize)('dropIntoEditorProgress', "Running drop handlers. Click to cancel"), p);
            this._currentOperation = p;
        }
        async getDropEdits(providers, model, position, dataTransfer, tokenSource) {
            const results = await (0, async_1.raceCancellation)(Promise.all(providers.map(async (provider) => {
                try {
                    const edits = await provider.provideDocumentDropEdits(model, position, dataTransfer, tokenSource.token);
                    return edits?.map(edit => ({ ...edit, providerId: provider.id }));
                }
                catch (err) {
                    console.error(err);
                }
                return undefined;
            })), tokenSource.token);
            const edits = (0, arrays_1.coalesce)(results ?? []).flat();
            return (0, edit_1.sortEditsByYieldTo)(edits);
        }
        getInitialActiveEditIndex(model, edits) {
            const preferredProviders = this._configService.getValue(exports.defaultProviderConfig, { resource: model.uri });
            for (const [configMime, desiredKindStr] of Object.entries(preferredProviders)) {
                const desiredKind = new hierarchicalKind_1.HierarchicalKind(desiredKindStr);
                const editIndex = edits.findIndex(edit => desiredKind.value === edit.providerId
                    && edit.handledMimeType && (0, dataTransfer_1.matchesMimeType)(configMime, [edit.handledMimeType]));
                if (editIndex >= 0) {
                    return editIndex;
                }
            }
            return 0;
        }
        async extractDataTransferData(dragEvent) {
            if (!dragEvent.dataTransfer) {
                return new dataTransfer_1.VSDataTransfer();
            }
            const dataTransfer = (0, dnd_1.toExternalVSDataTransfer)(dragEvent.dataTransfer);
            if (this.treeItemsTransfer.hasData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype)) {
                const data = this.treeItemsTransfer.getData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
                if (Array.isArray(data)) {
                    for (const id of data) {
                        const treeDataTransfer = await this._treeViewsDragAndDropService.removeDragOperationTransfer(id.identifier);
                        if (treeDataTransfer) {
                            for (const [type, value] of treeDataTransfer) {
                                dataTransfer.replace(type, value);
                            }
                        }
                    }
                }
            }
            return dataTransfer;
        }
    };
    exports.DropIntoEditorController = DropIntoEditorController;
    exports.DropIntoEditorController = DropIntoEditorController = DropIntoEditorController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, treeViewsDndService_1.ITreeViewsDnDService)
    ], DropIntoEditorController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcEludG9FZGl0b3JDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZHJvcE9yUGFzdGVJbnRvL2Jyb3dzZXIvZHJvcEludG9FZGl0b3JDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0Qm5GLFFBQUEscUJBQXFCLEdBQUcsb0RBQW9ELENBQUM7SUFFN0UsUUFBQSx1QkFBdUIsR0FBRyx1QkFBdUIsQ0FBQztJQUVsRCxRQUFBLG9CQUFvQixHQUFHLElBQUksMEJBQWEsQ0FBVSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsb0NBQW9DLENBQUMsQ0FBQyxDQUFDO0lBRXpKLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7O2lCQUVoQyxPQUFFLEdBQUcseUNBQXlDLEFBQTVDLENBQTZDO1FBRS9ELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUEyQiwwQkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBU0QsWUFDQyxNQUFtQixFQUNJLG9CQUEyQyxFQUMzQyxjQUFzRCxFQUNuRCx3QkFBbUUsRUFDdkUsNEJBQW1FO1lBRXpGLEtBQUssRUFBRSxDQUFDO1lBSmdDLG1CQUFjLEdBQWQsY0FBYyxDQUF1QjtZQUNsQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3RELGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBc0I7WUFQekUsc0JBQWlCLEdBQUcsNEJBQXNCLENBQUMsV0FBVyxFQUE4QixDQUFDO1lBV3JHLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFD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