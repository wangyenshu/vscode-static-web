/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, cancellation_1, uri_1, nls_1, actions_1, clipboardService_1, notebookKernelService_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COPY_NOTEBOOK_VARIABLE_VALUE_LABEL = exports.COPY_NOTEBOOK_VARIABLE_VALUE_ID = void 0;
    exports.COPY_NOTEBOOK_VARIABLE_VALUE_ID = 'workbench.debug.viewlet.action.copyWorkspaceVariableValue';
    exports.COPY_NOTEBOOK_VARIABLE_VALUE_LABEL = (0, nls_1.localize)('copyWorkspaceVariableValue', "Copy Value");
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.COPY_NOTEBOOK_VARIABLE_VALUE_ID,
                title: exports.COPY_NOTEBOOK_VARIABLE_VALUE_LABEL,
                f1: false,
            });
        }
        run(accessor, context) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            if (context.value) {
                clipboardService.writeText(context.value);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: '_executeNotebookVariableProvider',
                title: (0, nls_1.localize)('executeNotebookVariableProvider', "Execute Notebook Variable Provider"),
                f1: false,
            });
        }
        async run(accessor, resource) {
            if (!resource) {
                return [];
            }
            const uri = uri_1.URI.revive(resource);
            const notebookKernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const notebookTextModel = notebookService.getNotebookTextModel(uri);
            if (!notebookTextModel) {
                return [];
            }
            const selectedKernel = notebookKernelService.getMatchingKernel(notebookTextModel).selected;
            if (selectedKernel && selectedKernel.hasVariableProvider) {
                const variables = selectedKernel.provideVariables(notebookTextModel.uri, undefined, 'named', 0, cancellation_1.CancellationToken.None);
                return await variables
                    .map(variable => { return variable; })
                    .toPromise();
            }
            return [];
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL25vdGVib29rVmFyaWFibGVzL25vdGVib29rVmFyaWFibGVDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZbkYsUUFBQSwrQkFBK0IsR0FBRywyREFBMkQsQ0FBQztJQUM5RixRQUFBLGtDQUFrQyxHQUFHLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3ZHLElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHVDQUErQjtnQkFDbkMsS0FBSyxFQUFFLDBDQUFrQztnQkFDekMsRUFBRSxFQUFFLEtBQUs7YUFDVCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsT0FBdUI7WUFDdEQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG9DQUFpQixDQUFDLENBQUM7WUFFekQsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25CLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFHSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxrQ0FBa0M7Z0JBQ3RDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSxvQ0FBb0MsQ0FBQztnQkFDeEYsRUFBRSxFQUFFLEtBQUs7YUFDVCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLFFBQW1DO1lBQ3hFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4Q0FBc0IsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0NBQWdCLENBQUMsQ0FBQztZQUN2RCxNQUFNLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVwRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsTUFBTSxjQUFjLEdBQUcscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDM0YsSUFBSSxjQUFjLElBQUksY0FBYyxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQzFELE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hILE9BQU8sTUFBTSxTQUFTO3FCQUNwQixHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDckMsU0FBUyxFQUFFLENBQUM7WUFDZixDQUFDO1lBRUQsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO0tBQ0QsQ0FBQyxDQUFDIn0=