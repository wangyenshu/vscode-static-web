/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/nls", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, event_1, lifecycle_1, observable_1, nls, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookAccessibilityProvider = void 0;
    class NotebookAccessibilityProvider extends lifecycle_1.Disposable {
        constructor(notebookExecutionStateService, viewModel, keybindingService, configurationService) {
            super();
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.viewModel = viewModel;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this._onDidAriaLabelChange = new event_1.Emitter();
            this.onDidAriaLabelChange = this._onDidAriaLabelChange.event;
            this._register(event_1.Event.debounce(this.notebookExecutionStateService.onDidChangeExecution, (last, e) => this.mergeEvents(last, e), 100)((cellHandles) => {
                const viewModel = this.viewModel();
                if (viewModel) {
                    for (const handle of cellHandles) {
                        const cellModel = viewModel.getCellByHandle(handle);
                        if (cellModel) {
                            this._onDidAriaLabelChange.fire(cellModel);
                        }
                    }
                }
            }, this));
        }
        getAriaLabel(element) {
            const event = event_1.Event.filter(this.onDidAriaLabelChange, e => e === element);
            return (0, observable_1.observableFromEvent)(event, () => {
                const viewModel = this.viewModel();
                if (!viewModel) {
                    return '';
                }
                const index = viewModel.getCellIndex(element);
                if (index >= 0) {
                    return this.getLabel(index, element);
                }
                return '';
            });
        }
        getLabel(index, element) {
            const executionState = this.notebookExecutionStateService.getCellExecution(element.uri)?.state;
            const executionLabel = executionState === notebookCommon_1.NotebookCellExecutionState.Executing
                ? ', executing'
                : executionState === notebookCommon_1.NotebookCellExecutionState.Pending
                    ? ', pending'
                    : '';
            return `Cell ${index}, ${element.cellKind === notebookCommon_1.CellKind.Markup ? 'markdown' : 'code'} cell${executionLabel}`;
        }
        getWidgetAriaLabel() {
            const keybinding = this.keybindingService.lookupKeybinding("editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */)?.getLabel();
            if (this.configurationService.getValue("accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */)) {
                return keybinding
                    ? nls.localize('notebookTreeAriaLabelHelp', "Notebook\nUse {0} for accessibility help", keybinding)
                    : nls.localize('notebookTreeAriaLabelHelpNoKb', "Notebook\nRun the Open Accessibility Help command for more information", keybinding);
            }
            return nls.localize('notebookTreeAriaLabel', "Notebook");
        }
        mergeEvents(last, e) {
            const viewModel = this.viewModel();
            const result = last || [];
            if (viewModel && e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && e.affectsNotebook(viewModel.uri)) {
                if (result.indexOf(e.cellHandle) < 0) {
                    result.push(e.cellHandle);
                }
            }
            return result;
        }
    }
    exports.NotebookAccessibilityProvider = NotebookAccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tBY2Nlc3NpYmlsaXR5UHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL25vdGVib29rQWNjZXNzaWJpbGl0eVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFhLDZCQUE4QixTQUFRLHNCQUFVO1FBSTVELFlBQ2tCLDZCQUE2RCxFQUM3RCxTQUE4QyxFQUM5QyxpQkFBcUMsRUFDckMsb0JBQTJDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBTFMsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQUM3RCxjQUFTLEdBQVQsU0FBUyxDQUFxQztZQUM5QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3JDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFQNUMsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQWlCLENBQUM7WUFDckQseUJBQW9CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQVN4RSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQzVCLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxvQkFBb0IsRUFDdkQsQ0FBQyxJQUEwQixFQUFFLENBQWdFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUMzSCxHQUFHLENBQ0gsQ0FBQyxDQUFDLFdBQXFCLEVBQUUsRUFBRTtnQkFDM0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNmLEtBQUssTUFBTSxNQUFNLElBQUksV0FBVyxFQUFFLENBQUM7d0JBQ2xDLE1B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