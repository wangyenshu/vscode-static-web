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
define(["require", "exports", "vs/base/common/map", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, map_1, notebookEditorWidget_1, lifecycle_1, editorGroupsService_1, instantiation_1, notebookEditorInput_1, event_1, editorService_1, contextkey_1, notebookContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorWidgetService = void 0;
    let NotebookEditorWidgetService = class NotebookEditorWidgetService {
        constructor(editorGroupService, editorService, contextKeyService) {
            this.editorGroupService = editorGroupService;
            this._tokenPool = 1;
            this._disposables = new lifecycle_1.DisposableStore();
            this._notebookEditors = new Map();
            this._onNotebookEditorAdd = new event_1.Emitter();
            this._onNotebookEditorsRemove = new event_1.Emitter();
            this.onDidAddNotebookEditor = this._onNotebookEditorAdd.event;
            this.onDidRemoveNotebookEditor = this._onNotebookEditorsRemove.event;
            this._borrowableEditors = new Map();
            const groupListener = new Map();
            const onNewGroup = (group) => {
                const { id } = group;
                const listeners = [];
                listeners.push(group.onDidCloseEditor(e => {
                    const widgets = this._borrowableEditors.get(group.id);
                    if (!widgets) {
                        return;
                    }
                    const inputs = e.editor instanceof notebookEditorInput_1.NotebookEditorInput ? [e.editor] : ((0, notebookEditorInput_1.isCompositeNotebookEditorInput)(e.editor) ? e.editor.editorInputs : []);
                    inputs.forEach(input => {
                        const value = widgets.get(input.resource);
                        if (!value) {
                            return;
                        }
                        value.token = undefined;
                        this._disposeWidget(value.widget);
                        widgets.delete(input.resource);
                        value.widget = undefined; // unset the widget so that others that still hold a reference don't harm us
                    });
                }));
                listeners.push(group.onWillMoveEditor(e => {
                    if (e.editor instanceof notebookEditorInput_1.NotebookEditorInput) {
                        this._allowWidgetMove(e.editor, e.groupId, e.target);
                    }
                    if ((0, notebookEditorInput_1.isCompositeNotebookEditorInput)(e.editor)) {
                        e.editor.editorInputs.forEach(input => {
                            this._allowWidgetMove(input, e.groupId, e.target);
                        });
                    }
                }));
                groupListener.set(id, listeners);
            };
            this._disposables.add(editorGroupService.onDidAddGroup(onNewGroup));
            editorGroupService.whenReady.then(() => editorGroupService.groups.forEach(onNewGroup));
            // group removed -> clean up listeners, clean up widgets
            this._disposables.add(editorGroupService.onDidRemoveGroup(group => {
                const listeners = groupListener.get(group.id);
                if (listeners) {
                    listeners.forEach(listener => listener.dispose());
                    groupListener.delete(group.id);
                }
                const widgets = this._borrowableEditors.get(group.id);
                this._borrowableEditors.delete(group.id);
                if (widgets) {
                    for (const value of widgets.values()) {
                        value.token = undefined;
                        this._disposeWidget(value.widget);
                    }
                }
            }));
            const interactiveWindowOpen = notebookContextKeys_1.InteractiveWindowOpen.bindTo(contextKeyService);
            this._disposables.add(editorService.onDidEditorsChange(e => {
                if (e.event.kind === 4 /* GroupModelChangeKind.EDITOR_OPEN */ && !interactiveWindowOpen.get()) {
                    if (editorService.editors.find(editor => editor.editorId === 'interactive')) {
                        interactiveWindowOpen.set(true);
                    }
                }
                else if (e.event.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */ && interactiveWindowOpen.get()) {
                    if (!editorService.editors.find(editor => editor.editorId === 'interactive')) {
                        interactiveWindowOpen.set(false);
                    }
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._onNotebookEditorAdd.dispose();
            this._onNotebookEditorsRemove.dispose();
        }
        // --- group-based editor borrowing...
        _disposeWidget(widget) {
            widget.onWillHide();
            const domNode = widget.getDomNode();
            widget.dispose();
            domNode.remove();
        }
        _allowWidgetMove(input, sourceID, targetID) {
            const sourcePart = this.editorGroupService.getPart(sourceID);
            const targetPart = this.editorGroupService.getPart(targetID);
            if (sourcePart.windowId !== targetPart.windowId) {
                return;
            }
            const targetWidget = this._borrowableEditors.get(targetID)?.get(input.resource);
            if (targetWidget) {
                // not needed
                return;
            }
            const widget = this._borrowableEditors.get(sourceID)?.get(input.resource);
            if (!widget) {
                throw new Error('no widget at source group');
            }
            // don't allow the widget to be retrieved at its previous location any more
            this._borrowableEditors.get(sourceID)?.delete(input.resource);
            // allow the widget to be retrieved at its new location
            let targetMap = this._borrowableEditors.get(targetID);
            if (!targetMap) {
                targetMap = new map_1.ResourceMap();
                this._borrowableEditors.set(targetID, targetMap);
            }
            targetMap.set(input.resource, widget);
        }
        retrieveExistingWidgetFromURI(resource) {
            for (const widgetInfo of this._borrowableEditors.values()) {
                const widget = widgetInfo.get(resource);
                if (widget) {
                    return this._createBorrowValue(widget.token, widget);
                }
            }
            return undefined;
        }
        retrieveAllExistingWidgets() {
            const ret = [];
            for (const widgetInfo of this._borrowableEditors.values()) {
                for (const widget of widgetInfo.values()) {
                    ret.push(this._createBorrowValue(widget.token, widget));
                }
            }
            return ret;
        }
        retrieveWidget(accessor, group, input, creationOptions, initialDimension, codeWindow) {
            let value = this._borrowableEditors.get(group.id)?.get(input.resource);
            if (!value) {
                // NEW widget
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const ctorOptions = creationOptions ?? (0, notebookEditorWidget_1.getDefaultNotebookCreationOptions)();
                const widget = instantiationService.createInstance(notebookEditorWidget_1.NotebookEditorWidget, {
                    ...ctorOptions,
                    codeWindow: codeWindow ?? ctorOptions.codeWindow,
                }, initialDimension);
                const token = this._tokenPool++;
                value = { widget, token };
                let map = this._borrowableEditors.get(group.id);
                if (!map) {
                    map = new map_1.ResourceMap();
                    this._borrowableEditors.set(group.id, map);
                }
                map.set(input.resource, value);
            }
            else {
                // reuse a widget which was either free'ed before or which
                // is simply being reused...
                value.token = this._tokenPool++;
            }
            return this._createBorrowValue(value.token, value);
        }
        _createBorrowValue(myToken, widget) {
            return {
                get value() {
                    return widget.token === myToken ? widget.widget : undefined;
                }
            };
        }
        // --- editor management
        addNotebookEditor(editor) {
            this._notebookEditors.set(editor.getId(), editor);
            this._onNotebookEditorAdd.fire(editor);
        }
        removeNotebookEditor(editor) {
            if (this._notebookEditors.has(editor.getId())) {
                this._notebookEditors.delete(editor.getId());
                this._onNotebookEditorsRemove.fire(editor);
            }
        }
        getNotebookEditor(editorId) {
            return this._notebookEditors.get(editorId);
        }
        listNotebookEditors() {
            return [...this._notebookEditors].map(e => e[1]);
        }
    };
    exports.NotebookEditorWidgetService = NotebookEditorWidgetService;
    exports.NotebookEditorWidgetService = NotebookEditorWidgetService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, contextkey_1.IContextKeyService)
    ], NotebookEditorWidgetService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvc2VydmljZXMvbm90ZWJvb2tFZGl0b3JTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTJCO1FBZ0J2QyxZQUN1QixrQkFBeUQsRUFDL0QsYUFBNkIsRUFDekIsaUJBQXFDO1lBRmxCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFieEUsZUFBVSxHQUFHLENBQUMsQ0FBQztZQUVOLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDckMscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7WUFFdEQseUJBQW9CLEdBQUcsSUFBSSxlQUFPLEVBQW1CLENBQUM7WUFDdEQsNkJBQXdCLEdBQUcsSUFBSSxlQUFPLEVBQW1CLENBQUM7WUFDbEUsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUN6RCw4QkFBeUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1lBRXhELHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUFvRixDQUFDO1lBUWpJLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO1lBQ3ZELE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBbUIsRUFBRSxFQUFFO2dCQUMxQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixNQUFNLFNBQVMsR0FBa0IsRUFBRSxDQUFDO2dCQUNwQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFB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