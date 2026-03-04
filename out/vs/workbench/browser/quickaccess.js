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
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickInput", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls_1, contextkey_1, keybinding_1, quickInput_1, lifecycle_1, editorBrowser_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PickerEditorState = exports.defaultQuickAccessContext = exports.defaultQuickAccessContextKeyValue = exports.inQuickPickContext = exports.InQuickPickContextKey = exports.inQuickPickContextKeyValue = void 0;
    exports.getQuickNavigateHandler = getQuickNavigateHandler;
    exports.inQuickPickContextKeyValue = 'inQuickOpen';
    exports.InQuickPickContextKey = new contextkey_1.RawContextKey(exports.inQuickPickContextKeyValue, false, (0, nls_1.localize)('inQuickOpen', "Whether keyboard focus is inside the quick open control"));
    exports.inQuickPickContext = contextkey_1.ContextKeyExpr.has(exports.inQuickPickContextKeyValue);
    exports.defaultQuickAccessContextKeyValue = 'inFilesPicker';
    exports.defaultQuickAccessContext = contextkey_1.ContextKeyExpr.and(exports.inQuickPickContext, contextkey_1.ContextKeyExpr.has(exports.defaultQuickAccessContextKeyValue));
    function getQuickNavigateHandler(id, next) {
        return accessor => {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keys = keybindingService.lookupKeybindings(id);
            const quickNavigate = { keybindings: keys };
            quickInputService.navigate(!!next, quickNavigate);
        };
    }
    let PickerEditorState = class PickerEditorState extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupsService) {
            super();
            this.editorService = editorService;
            this.editorGroupsService = editorGroupsService;
            this._editorViewState = undefined;
            this.openedTransientEditors = new Set(); // editors that were opened between set and restore
        }
        set() {
            if (this._editorViewState) {
                return; // return early if already done
            }
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane) {
                this._editorViewState = {
                    group: activeEditorPane.group,
                    editor: activeEditorPane.input,
                    state: (0, editorBrowser_1.getIEditor)(activeEditorPane.getControl())?.saveViewState() ?? undefined,
                };
            }
        }
        /**
         * Open a transient editor such that it may be closed when the state is restored.
         * Note that, when the state is restored, if the editor is no longer transient, it will not be closed.
         */
        async openTransientEditor(editor, group) {
            editor.options = { ...editor.options, transient: true };
            const editorPane = await this.editorService.openEditor(editor, group);
            if (editorPane?.input && editorPane.input !== this._editorViewState?.editor && editorPane.group.isTransient(editorPane.input)) {
                this.openedTransientEditors.add(editorPane.input);
            }
            return editorPane;
        }
        async restore() {
            if (this._editorViewState) {
                for (const editor of this.openedTransientEditors) {
                    if (editor.isDirty()) {
                        continue;
                    }
                    for (const group of this.editorGroupsService.groups) {
                        if (group.isTransient(editor)) {
                            await group.closeEditor(editor, { preserveFocus: true });
                        }
                    }
                }
                await this._editorViewState.group.openEditor(this._editorViewState.editor, {
                    viewState: this._editorViewState.state,
                    preserveFocus: true // important to not close the picker as a result
                });
                this.reset();
            }
        }
        reset() {
            this._editorViewState = undefined;
            this.openedTransientEditors.clear();
        }
        dispose() {
            super.dispose();
            this.reset();
        }
    };
    exports.PickerEditorState = PickerEditorState;
    exports.PickerEditorState = PickerEditorState = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService)
    ], PickerEditorState);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2thY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9xdWlja2FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5Q2hHLDBEQVVDO0lBbkNZLFFBQUEsMEJBQTBCLEdBQUcsYUFBYSxDQUFDO0lBQzNDLFFBQUEscUJBQXFCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGtDQUEwQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUseURBQXlELENBQUMsQ0FBQyxDQUFDO0lBQzFLLFFBQUEsa0JBQWtCLEdBQUcsMkJBQWMsQ0FBQyxHQUFHLENBQUMsa0NBQTBCLENBQUMsQ0FBQztJQUVwRSxRQUFBLGlDQUFpQyxHQUFHLGVBQWUsQ0FBQztJQUNwRCxRQUFBLHlCQUF5QixHQUFHLDJCQUFjLENBQUMsR0FBRyxDQUFDLDBCQUFrQixFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLHlDQUFpQyxDQUFDLENBQUMsQ0FBQztJQW9CdkksU0FBZ0IsdUJBQXVCLENBQUMsRUFBVSxFQUFFLElBQWM7UUFDakUsT0FBTyxRQUFRLENBQUMsRUFBRTtZQUNqQixNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUMzRCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUUzRCxNQUFNLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyRCxNQUFNLGFBQWEsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUU1QyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUM7SUFDSCxDQUFDO0lBQ00sSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxzQkFBVTtRQVNoRCxZQUNpQixhQUE4QyxFQUN4QyxtQkFBMEQ7WUFFaEYsS0FBSyxFQUFFLENBQUM7WUFIeUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFWekUscUJBQWdCLEdBSVIsU0FBUyxDQUFDO1lBRVQsMkJBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQyxDQUFDLG1EQUFtRDtRQU9ySCxDQUFDO1FBRUQsR0FBRztZQUNGLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzNCLE9BQU8sQ0FBQywrQkFBK0I7WUFDeEMsQ0FBQztZQUVELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUM3RCxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRztvQkFDdkIsS0FBSyxFQUFFLGdCQUFnQixDQUFDLEtBQUs7b0JBQzdCLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxLQUFLO29CQUM5QixLQUFLLEVBQUUsSUFBQSwwQkFBVSxFQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLElBQUksU0FBUztpQkFDOUUsQ0FBQztZQUNILENBQUM7UUFFRixDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE1BQWdILEVBQUUsS0FBb0c7WUFDL08sTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFFeEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEUsSUFBSSxVQUFVLEVBQUUsS0FBSyxJQUFJLFVBQVUsQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLGdCQUFnQixFQUFFLE1BQU0sSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0gsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUVELE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTztZQUNaLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzNCLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7b0JBQ2xELElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7d0JBQ3RCLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDckQsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7NEJBQy9CLE1BQU0sS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQzt3QkFDMUQsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFO29CQUMxRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUs7b0JBQ3RDLGFBQWEsRUFBRSxJQUFJLENBQUMsZ0RBQWdEO2lCQUNwRSxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2QsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztZQUNsQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckMsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFaEIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2QsQ0FBQztLQUNELENBQUE7SUFoRlksOENBQWlCO2dDQUFqQixpQkFBaUI7UUFVM0IsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSwwQ0FBb0IsQ0FBQTtPQVhWLGlCQUFpQixDQWdGN0IifQ==