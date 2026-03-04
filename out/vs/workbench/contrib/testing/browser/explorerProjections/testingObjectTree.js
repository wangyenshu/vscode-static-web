/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/list/browser/listService", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/common/testId"], function (require, exports, listService_1, index_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingObjectTree = void 0;
    class TestingObjectTree extends listService_1.WorkbenchObjectTree {
        /**
         * Gets a serialized view state for the tree, optimized for storage.
         *
         * @param updatePreviousState Optional previous state to mutate and update
         * instead of creating a new one.
         */
        getOptimizedViewState(updatePreviousState) {
            const root = updatePreviousState || {};
            /**
             * Recursive builder function. Returns whether the subtree has any non-default
             * value. Adds itself to the parent children if it does.
             */
            const build = (node, parent) => {
                if (!(node.element instanceof index_1.TestItemTreeElement)) {
                    return false;
                }
                const localId = testId_1.TestId.localId(node.element.test.item.extId);
                const inTree = parent.children?.[localId] || {};
                // only saved collapsed state if it's not the default (not collapsed, or a root depth)
                inTree.collapsed = node.depth === 0 || !node.collapsed ? node.collapsed : undefined;
                let hasAnyNonDefaultValue = inTree.collapsed !== undefined;
                if (node.children.length) {
                    for (const child of node.children) {
                        hasAnyNonDefaultValue = build(child, inTree) || hasAnyNonDefaultValue;
                    }
                }
                if (hasAnyNonDefaultValue) {
                    parent.children ??= {};
                    parent.children[localId] = inTree;
                }
                else if (parent.children?.hasOwnProperty(localId)) {
                    delete parent.children[localId];
                }
                return hasAnyNonDefaultValue;
            };
            root.children ??= {};
            // Controller IDs are hidden if there's only a single test controller, but
            // make sure they're added when the tree is built if this is the case, so
            // that the later ID lookup works.
            for (const node of this.getNode().children) {
                if (node.element instanceof index_1.TestItemTreeElement) {
                    if (node.element.test.controllerId === node.element.test.item.extId) {
                        build(node, root);
                    }
                    else {
                        const ctrlNode = root.children[node.element.test.controllerId] ??= { children: {} };
                        build(node, ctrlNode);
                    }
                }
            }
            return root;
        }
    }
    exports.TestingObjectTree = TestingObjectTree;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ09iamVjdFRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvZXhwbG9yZXJQcm9qZWN0aW9ucy90ZXN0aW5nT2JqZWN0VHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxpQkFBc0MsU0FBUSxpQ0FBeUQ7UUFFbkg7Ozs7O1dBS0c7UUFDSSxxQkFBcUIsQ0FBQyxtQkFBc0Q7WUFDbEYsTUFBTSxJQUFJLEdBQXFDLG1CQUFtQixJQUFJLEVBQUUsQ0FBQztZQUV6RTs7O2VBR0c7WUFDSCxNQUFNLEtBQUssR0FBRyxDQUFDLElBQXdELEVBQUUsTUFBd0MsRUFBVyxFQUFFO2dCQUM3SCxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxZQUFZLDJCQUFtQixDQUFDLEVBQUUsQ0FBQztvQkFDcEQsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFFRCxNQUFNLE9BQU8sR0FBRyxlQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEQsc0ZBQXNGO2dCQUN0RixNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUVwRixJQUFJLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDO2dCQUMzRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQzFCLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNuQyxxQkFBcUIsR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLHFCQUFxQixDQUFDO29CQUN2RSxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO29CQUMzQixNQUFNLENBQUMsUUFBUSxLQUFLLEVBQUUsQ0FBQztvQkFDdkIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxNQUFNLENBQUM7Z0JBQ25DLENBQUM7cUJBQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNyRCxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7Z0JBRUQsT0FBTyxxQkFBcUIsQ0FBQztZQUM5QixDQUFDLENBQUM7WUFFRixJQUFJLENBQUMsUUFBUSxLQUFLLEVBQUUsQ0FBQztZQUVyQiwwRUFBMEU7WUFDMUUseUVBQXlFO1lBQ3pFLGtDQUFrQztZQUNsQyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxJQUFJLENBQUMsT0FBTyxZQUFZLDJCQUFtQixFQUFFLENBQUM7b0JBQ2pELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDckUsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDbkIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUM7d0JBQ3BGLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ3ZCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7S0FDRDtJQTVERCw4Q0E0REMifQ==