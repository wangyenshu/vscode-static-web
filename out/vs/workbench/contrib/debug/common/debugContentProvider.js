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
define(["require", "exports", "vs/nls", "vs/editor/common/services/languagesAssociations", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugSource", "vs/editor/common/services/editorWorker", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/base/common/cancellation", "vs/editor/common/languages/modesRegistry", "vs/base/common/errors"], function (require, exports, nls_1, languagesAssociations_1, model_1, language_1, resolverService_1, debug_1, debugSource_1, editorWorker_1, editOperation_1, range_1, cancellation_1, modesRegistry_1, errors_1) {
    "use strict";
    var DebugContentProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugContentProvider = void 0;
    /**
     * Debug URI format
     *
     * a debug URI represents a Source object and the debug session where the Source comes from.
     *
     *       debug:arbitrary_path?session=123e4567-e89b-12d3-a456-426655440000&ref=1016
     *       \___/ \____________/ \__________________________________________/ \______/
     *         |          |                             |                          |
     *      scheme   source.path                    session id            source.reference
     *
     * the arbitrary_path and the session id are encoded with 'encodeURIComponent'
     *
     */
    let DebugContentProvider = class DebugContentProvider {
        static { DebugContentProvider_1 = this; }
        constructor(textModelResolverService, debugService, modelService, languageService, editorWorkerService) {
            this.debugService = debugService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.editorWorkerService = editorWorkerService;
            this.pendingUpdates = new Map();
            textModelResolverService.registerTextModelContentProvider(debug_1.DEBUG_SCHEME, this);
            DebugContentProvider_1.INSTANCE = this;
        }
        dispose() {
            this.pendingUpdates.forEach(cancellationSource => cancellationSource.dispose());
        }
        provideTextContent(resource) {
            return this.createOrUpdateContentModel(resource, true);
        }
        /**
         * Reload the model content of the given resource.
         * If there is no model for the given resource, this method does nothing.
         */
        static refreshDebugContent(resource) {
            DebugContentProvider_1.INSTANCE?.createOrUpdateContentModel(resource, false);
        }
        /**
         * Create or reload the model content of the given resource.
         */
        createOrUpdateContentModel(resource, createIfNotExists) {
            const model = this.modelService.getModel(resource);
            if (!model && !createIfNotExists) {
                // nothing to do
                return null;
            }
            let session;
            if (resource.query) {
                const data = debugSource_1.Source.getEncodedDebugData(resource);
                session = this.debugService.getModel().getSession(data.sessionId);
            }
            if (!session) {
                // fallback: use focused session
                session = this.debugService.getViewModel().focusedSession;
            }
            if (!session) {
                return Promise.reject(new errors_1.ErrorNoTelemetry((0, nls_1.localize)('unable', "Unable to resolve the resource without a debug session")));
            }
            const createErrModel = (errMsg) => {
                this.debugService.sourceIsNotAvailable(resource);
                const languageSelection = this.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
                const message = errMsg
                    ? (0, nls_1.localize)('canNotResolveSourceWithError', "Could not load source '{0}': {1}.", resource.path, errMsg)
                    : (0, nls_1.localize)('canNotResolveSource', "Could not load source '{0}'.", resource.path);
                return this.modelService.createModel(message, languageSelection, resource);
            };
            return session.loadSource(resource).then(response => {
                if (response && response.body) {
                    if (model) {
                        const newContent = response.body.content;
                        // cancel and dispose an existing update
                        const cancellationSource = this.pendingUpdates.get(model.id);
                        cancellationSource?.cancel();
                        // create and keep update token
                        const myToken = new cancellation_1.CancellationTokenSource();
                        this.pendingUpdates.set(model.id, myToken);
                        // update text model
                        return this.editorWorkerService.computeMoreMinimalEdits(model.uri, [{ text: newContent, range: model.getFullModelRange() }]).then(edits => {
                            // remove token
                            this.pendingUpdates.delete(model.id);
                            if (!myToken.token.isCancellationRequested && edits && edits.length > 0) {
                                // use the evil-edit as these models show in readonly-editor only
                                model.applyEdits(edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
                            }
                            return model;
                        });
                    }
                    else {
                        // create text model
                        const mime = response.body.mimeType || (0, languagesAssociations_1.getMimeTypes)(resource)[0];
                        const languageSelection = this.languageService.createByMimeType(mime);
                        return this.modelService.createModel(response.body.content, languageSelection, resource);
                    }
                }
                return createErrModel();
            }, (err) => createErrModel(err.message));
        }
    };
    exports.DebugContentProvider = DebugContentProvider;
    exports.DebugContentProvider = DebugContentProvider = DebugContentProvider_1 = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, debug_1.IDebugService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService),
        __param(4, editorWorker_1.IEditorWorkerService)
    ], DebugContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb250ZW50UHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vZGVidWdDb250ZW50UHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1CaEc7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0ksSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7O1FBTWhDLFlBQ29CLHdCQUEyQyxFQUMvQyxZQUE0QyxFQUM1QyxZQUE0QyxFQUN6QyxlQUFrRCxFQUM5QyxtQkFBMEQ7WUFIaEQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDM0IsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQzdCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFQaEUsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBbUMsQ0FBQztZQVM1RSx3QkFBd0IsQ0FBQyxnQ0FBZ0MsQ0FBQyxvQkFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlFLHNCQUFvQixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDdEMsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBRUQsa0JBQWtCLENBQUMsUUFBYTtZQUMvQixPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVEOzs7V0FHRztRQUNILE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxRQUFhO1lBQ3ZDLHNCQUFvQixDQUFDLFFBQVEsRUFB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