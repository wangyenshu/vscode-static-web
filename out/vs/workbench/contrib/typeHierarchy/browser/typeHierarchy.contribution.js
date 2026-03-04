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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/typeHierarchy/browser/typeHierarchyPeek", "vs/workbench/contrib/typeHierarchy/common/typeHierarchy"], function (require, exports, cancellation_1, codicons_1, errors_1, event_1, lifecycle_1, editorExtensions_1, codeEditorService_1, range_1, peekView_1, nls_1, actions_1, contextkey_1, instantiation_1, storage_1, typeHierarchyPeek_1, typeHierarchy_1) {
    "use strict";
    var TypeHierarchyController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const _ctxHasTypeHierarchyProvider = new contextkey_1.RawContextKey('editorHasTypeHierarchyProvider', false, (0, nls_1.localize)('editorHasTypeHierarchyProvider', 'Whether a type hierarchy provider is available'));
    const _ctxTypeHierarchyVisible = new contextkey_1.RawContextKey('typeHierarchyVisible', false, (0, nls_1.localize)('typeHierarchyVisible', 'Whether type hierarchy peek is currently showing'));
    const _ctxTypeHierarchyDirection = new contextkey_1.RawContextKey('typeHierarchyDirection', undefined, { type: 'string', description: (0, nls_1.localize)('typeHierarchyDirection', 'whether type hierarchy shows super types or subtypes') });
    function sanitizedDirection(candidate) {
        return candidate === "subtypes" /* TypeHierarchyDirection.Subtypes */ || candidate === "supertypes" /* TypeHierarchyDirection.Supertypes */
            ? candidate
            : "subtypes" /* TypeHierarchyDirection.Subtypes */;
    }
    let TypeHierarchyController = class TypeHierarchyController {
        static { TypeHierarchyController_1 = this; }
        static { this.Id = 'typeHierarchy'; }
        static get(editor) {
            return editor.getContribution(TypeHierarchyController_1.Id);
        }
        static { this._storageDirectionKey = 'typeHierarchy/defaultDirection'; }
        constructor(_editor, _contextKeyService, _storageService, _editorService, _instantiationService) {
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._ctxHasProvider = _ctxHasTypeHierarchyProvider.bindTo(this._contextKeyService);
            this._ctxIsVisible = _ctxTypeHierarchyVisible.bindTo(this._contextKeyService);
            this._ctxDirection = _ctxTypeHierarchyDirection.bindTo(this._contextKeyService);
            this._disposables.add(event_1.Event.any(_editor.onDidChangeModel, _editor.onDidChangeModelLanguage, typeHierarchy_1.TypeHierarchyProviderRegistry.onDidChange)(() => {
                this._ctxHasProvider.set(_editor.hasModel() && typeHierarchy_1.TypeHierarchyProviderRegistry.has(_editor.getModel()));
            }));
            this._disposables.add(this._sessionDisposables);
        }
        dispose() {
            this._disposables.dispose();
        }
        // Peek
        async startTypeHierarchyFromEditor() {
            this._sessionDisposables.clear();
            if (!this._editor.hasModel()) {
                return;
            }
            const document = this._editor.getModel();
            const position = this._editor.getPosition();
            if (!typeHierarchy_1.TypeHierarchyProviderRegistry.has(document)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const model = typeHierarchy_1.TypeHierarchyModel.create(document, position, cts.token);
            const direction = sanitizedDirection(this._storageService.get(TypeHierarchyController_1._storageDirectionKey, 0 /* StorageScope.PROFILE */, "subtypes" /* TypeHierarchyDirection.Subtypes */));
            this._showTypeHierarchyWidget(position, direction, model, cts);
        }
        _showTypeHierarchyWidget(position, direction, model, cts) {
            this._ctxIsVisible.set(true);
            this._ctxDirection.set(direction);
            event_1.Event.any(this._editor.onDidChangeModel, this._editor.onDidChangeModelLanguage)(this.endTypeHierarchy, this, this._sessionDisposables);
            this._widget = this._instantiationService.createInstance(typeHierarchyPeek_1.TypeHierarchyTreePeekWidget, this._editor, position, direction);
            this._widget.showLoading();
            this._sessionDisposables.add(this._widget.onDidClose(() => {
                this.endTypeHierarchy();
                this._storageService.store(TypeHierarchyController_1._storageDirectionKey, this._widget.direction, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }));
            this._sessionDisposables.add({ dispose() { cts.dispose(true); } });
            this._sessionDisposables.add(this._widget);
            model.then(model => {
                if (cts.token.isCancellationRequested) {
                    return; // nothing
                }
                if (model) {
                    this._sessionDisposables.add(model);
                    this._widget.showModel(model);
                }
                else {
                    this._widget.showMessage((0, nls_1.localize)('no.item', "No results"));
                }
            }).catch(err => {
                if ((0, errors_1.isCancellationError)(err)) {
                    this.endTypeHierarchy();
                    return;
                }
                this._widget.showMessage((0, nls_1.localize)('error', "Failed to show type hierarchy"));
            });
        }
        async startTypeHierarchyFromTypeHierarchy() {
            if (!this._widget) {
                return;
            }
            const model = this._widget.getModel();
            const typeItem = this._widget.getFocused();
            if (!typeItem || !model) {
                return;
            }
            const newEditor = await this._editorService.openCodeEditor({ resource: typeItem.item.uri }, this._editor);
            if (!newEditor) {
                return;
            }
            const newModel = model.fork(typeItem.item);
            this._sessionDisposables.clear();
            TypeHierarchyController_1.get(newEditor)?._showTypeHierarchyWidget(range_1.Range.lift(newModel.root.selectionRange).getStartPosition(), this._widget.direction, Promise.resolve(newModel), new cancellation_1.CancellationTokenSource());
        }
        showSupertypes() {
            this._widget?.updateDirection("supertypes" /* TypeHierarchyDirection.Supertypes */);
            this._ctxDirection.set("supertypes" /* TypeHierarchyDirection.Supertypes */);
        }
        showSubtypes() {
            this._widget?.updateDirection("subtypes" /* TypeHierarchyDirection.Subtypes */);
            this._ctxDirection.set("subtypes" /* TypeHierarchyDirection.Subtypes */);
        }
        endTypeHierarchy() {
            this._sessionDisposables.clear();
            this._ctxIsVisible.set(false);
            this._editor.focus();
        }
    };
    TypeHierarchyController = TypeHierarchyController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, instantiation_1.IInstantiationService)
    ], TypeHierarchyController);
    (0, editorExtensions_1.registerEditorContribution)(TypeHierarchyController.Id, TypeHierarchyController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to define a context key
    // Peek
    (0, actions_1.registerAction2)(class PeekTypeHierarchyAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showTypeHierarchy',
                title: (0, nls_1.localize2)('title', 'Peek Type Hierarchy'),
                menu: {
                    id: actions_1.MenuId.EditorContextPeek,
                    group: 'navigation',
                    order: 1000,
                    when: contextkey_1.ContextKeyExpr.and(_ctxHasTypeHierarchyProvider, peekView_1.PeekContext.notInPeekEditor),
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxHasTypeHierarchyProvider, peekView_1.PeekContext.notInPeekEditor),
                f1: true
            });
        }
        async runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.startTypeHierarchyFromEditor();
        }
    });
    // actions for peek widget
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showSupertypes',
                title: (0, nls_1.localize2)('title.supertypes', 'Show Supertypes'),
                icon: codicons_1.Codicon.typeHierarchySuper,
                precondition: contextkey_1.ContextKeyExpr.and(_ctxTypeHierarchyVisible, _ctxTypeHierarchyDirection.isEqualTo("subtypes" /* TypeHierarchyDirection.Subtypes */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxTypeHierarchyDirection.isEqualTo("subtypes" /* TypeHierarchyDirection.Subtypes */),
                    order: 1,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.showSupertypes();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showSubtypes',
                title: (0, nls_1.localize2)('title.subtypes', 'Show Subtypes'),
                icon: codicons_1.Codicon.typeHierarchySub,
                precondition: contextkey_1.ContextKeyExpr.and(_ctxTypeHierarchyVisible, _ctxTypeHierarchyDirection.isEqualTo("supertypes" /* TypeHierarchyDirection.Supertypes */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxTypeHierarchyDirection.isEqualTo("supertypes" /* TypeHierarchyDirection.Supertypes */),
                    order: 1,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.showSubtypes();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.refocusTypeHierarchy',
                title: (0, nls_1.localize2)('title.refocusTypeHierarchy', 'Refocus Type Hierarchy'),
                precondition: _ctxTypeHierarchyVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 3 /* KeyCode.Enter */
                }
            });
        }
        async runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.startTypeHierarchyFromTypeHierarchy();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.closeTypeHierarchy',
                title: (0, nls_1.localize)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: _ctxTypeHierarchyVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                    primary: 9 /* KeyCode.Escape */,
                    when: contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    order: 1000
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return TypeHierarchyController.get(editor)?.endTypeHierarchy();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZUhpZXJhcmNoeS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90eXBlSGllcmFyY2h5L2Jyb3dzZXIvdHlwZUhpZXJhcmNoeS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxNQUFNLDRCQUE0QixHQUFHLElBQUksMEJBQWEsQ0FBVSxnQ0FBZ0MsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO0lBQ3ZNLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHNCQUFzQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxrREFBa0QsQ0FBQyxDQUFDLENBQUM7SUFDakwsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLDBCQUFhLENBQVMsd0JBQXdCLEVBQUUsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsc0RBQXNELENBQUMsRUFBRSxDQUFDLENBQUM7SUFFL04sU0FBUyxrQkFBa0IsQ0FBQyxTQUFpQjtRQUM1QyxPQUFPLFNBQVMscURBQW9DLElBQUksU0FBUyx5REFBc0M7WUFDdEcsQ0FBQyxDQUFDLFNBQVM7WUFDWCxDQUFDLGlEQUFnQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1Qjs7aUJBQ1osT0FBRSxHQUFHLGVBQWUsQUFBbEIsQ0FBbUI7UUFFckMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUM3QixPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTBCLHlCQUF1QixD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