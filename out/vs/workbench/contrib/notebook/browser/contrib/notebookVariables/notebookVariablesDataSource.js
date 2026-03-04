/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/nls", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, cancellation_1, nls_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVariableDataSource = void 0;
    class NotebookVariableDataSource {
        constructor(notebookKernelService) {
            this.notebookKernelService = notebookKernelService;
            this.cancellationTokenSource = new cancellation_1.CancellationTokenSource();
        }
        hasChildren(element) {
            return element.kind === 'root' || element.hasNamedChildren || element.indexedChildrenCount > 0;
        }
        cancel() {
            this.cancellationTokenSource.cancel();
            this.cancellationTokenSource.dispose();
            this.cancellationTokenSource = new cancellation_1.CancellationTokenSource();
        }
        async getChildren(element) {
            if (element.kind === 'root') {
                return this.getRootVariables(element.notebook);
            }
            else {
                return this.getVariables(element);
            }
        }
        async getVariables(parent) {
            const selectedKernel = this.notebookKernelService.getMatchingKernel(parent.notebook).selected;
            if (selectedKernel && selectedKernel.hasVariableProvider) {
                let children = [];
                if (parent.hasNamedChildren) {
                    const variables = selectedKernel.provideVariables(parent.notebook.uri, parent.extHostId, 'named', 0, this.cancellationTokenSource.token);
                    const childNodes = await variables
                        .map(variable => { return this.createVariableElement(variable, parent.notebook); })
                        .toPromise();
                    children = children.concat(childNodes);
                }
                if (parent.indexedChildrenCount > 0) {
                    const childNodes = await this.getIndexedChildren(parent, selectedKernel);
                    children = children.concat(childNodes);
                }
                return children;
            }
            return [];
        }
        async getIndexedChildren(parent, kernel) {
            const childNodes = [];
            if (parent.indexedChildrenCount > notebookKernelService_1.variablePageSize) {
                const nestedPageSize = Math.floor(Math.max(parent.indexedChildrenCount / notebookKernelService_1.variablePageSize, 100));
                const indexedChildCountLimit = 1_000_000;
                let start = parent.indexStart ?? 0;
                const last = start + Math.min(parent.indexedChildrenCount, indexedChildCountLimit);
                for (; start < last; start += nestedPageSize) {
                    let end = start + nestedPageSize;
                    if (end > last) {
                        end = last;
                    }
                    childNodes.push({
                        kind: 'variable',
                        notebook: parent.notebook,
                        id: parent.id + `${start}`,
                        extHostId: parent.extHostId,
                        name: `[${start}..${end - 1}]`,
                        value: '',
                        indexedChildrenCount: end - start,
                        indexStart: start,
                        hasNamedChildren: false
                    });
                }
                if (parent.indexedChildrenCount > indexedChildCountLimit) {
                    childNodes.push({
                        kind: 'variable',
                        notebook: parent.notebook,
                        id: parent.id + `${last + 1}`,
                        extHostId: parent.extHostId,
                        name: (0, nls_1.localize)('notebook.indexedChildrenLimitReached', "Display limit reached"),
                        value: '',
                        indexedChildrenCount: 0,
                        hasNamedChildren: false
                    });
                }
            }
            else if (parent.indexedChildrenCount > 0) {
                const variables = kernel.provideVariables(parent.notebook.uri, parent.extHostId, 'indexed', parent.indexStart ?? 0, this.cancellationTokenSource.token);
                for await (const variable of variables) {
                    childNodes.push(this.createVariableElement(variable, parent.notebook));
                    if (childNodes.length >= notebookKernelService_1.variablePageSize) {
                        break;
                    }
                }
            }
            return childNodes;
        }
        async getRootVariables(notebook) {
            const selectedKernel = this.notebookKernelService.getMatchingKernel(notebook).selected;
            if (selectedKernel && selectedKernel.hasVariableProvider) {
                const variables = selectedKernel.provideVariables(notebook.uri, undefined, 'named', 0, this.cancellationTokenSource.token);
                return await variables
                    .map(variable => { return this.createVariableElement(variable, notebook); })
                    .toPromise();
            }
            return [];
        }
        createVariableElement(variable, notebook) {
            return {
                ...variable,
                kind: 'variable',
                notebook,
                extHostId: variable.id,
                id: `${variable.id}`
            };
        }
    }
    exports.NotebookVariableDataSource = NotebookVariableDataSource;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZXNEYXRhU291cmNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL25vdGVib29rVmFyaWFibGVzL25vdGVib29rVmFyaWFibGVzRGF0YVNvdXJjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4QmhHLE1BQWEsMEJBQTBCO1FBSXRDLFlBQTZCLHFCQUE2QztZQUE3QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3pFLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7UUFDOUQsQ0FBQztRQUVELFdBQVcsQ0FBQyxPQUFrRDtZQUM3RCxPQUFPLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxPQUFPLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1FBQ2hHLENBQUM7UUFFTSxNQUFNO1lBQ1osSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN2QyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDO1FBQzlELENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQWtEO1lBQ25FLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFD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