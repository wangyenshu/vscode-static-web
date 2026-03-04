/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/tree", "vs/base/common/event", "vs/base/common/iterator", "vs/workbench/contrib/testing/browser/explorerProjections/testingViewState", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, tree_1, event_1, iterator_1, testingViewState_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getChildrenForParent = exports.testIdentityProvider = exports.TestTreeErrorMessage = exports.TestItemTreeElement = void 0;
    let idCounter = 0;
    const getId = () => String(idCounter++);
    class TestItemTreeElement {
        constructor(test, 
        /**
         * Parent tree item. May not actually be the test item who owns this one
         * in a 'flat' projection.
         */
        parent = null) {
            this.test = test;
            this.parent = parent;
            this.changeEmitter = new event_1.Emitter();
            /**
             * Fired whenever the element or test properties change.
             */
            this.onChange = this.changeEmitter.event;
            /**
             * Tree children of this item.
             */
            this.children = new Set();
            /**
             * Unique ID of the element in the tree.
             */
            this.treeId = getId();
            /**
             * Depth of the element in the tree.
             */
            this.depth = this.parent ? this.parent.depth + 1 : 0;
            /**
             * Whether the node's test result is 'retired' -- from an outdated test run.
             */
            this.retired = false;
            /**
             * State to show on the item. This is generally the item's computed state
             * from its children.
             */
            this.state = 0 /* TestResultState.Unset */;
        }
        toJSON() {
            if (this.depth === 0) {
                return { controllerId: this.test.controllerId };
            }
            const context = {
                $mid: 16 /* MarshalledId.TestItemContext */,
                tests: [testTypes_1.InternalTestItem.serialize(this.test)],
            };
            for (let p = this.parent; p && p.depth > 0; p = p.parent) {
                context.tests.unshift(testTypes_1.InternalTestItem.serialize(p.test));
            }
            return context;
        }
    }
    exports.TestItemTreeElement = TestItemTreeElement;
    class TestTreeErrorMessage {
        get description() {
            return typeof this.message === 'string' ? this.message : this.message.value;
        }
        constructor(message, parent) {
            this.message = message;
            this.parent = parent;
            this.treeId = getId();
            this.children = new Set();
        }
    }
    exports.TestTreeErrorMessage = TestTreeErrorMessage;
    exports.testIdentityProvider = {
        getId(element) {
            // For "not expandable" elements, whether they have children is part of the
            // ID so they're rerendered if that changes (#204805)
            const expandComponent = element instanceof TestTreeErrorMessage
                ? 'error'
                : element.test.expand === 0 /* TestItemExpandState.NotExpandable */
                    ? !!element.children.size
                    : element.test.expand;
            return element.treeId + '\0' + expandComponent;
        }
    };
    const getChildrenForParent = (serialized, rootsWithChildren, node) => {
        let it;
        if (node === null) { // roots
            const rootsWithChildrenArr = [...rootsWithChildren];
            if (rootsWithChildrenArr.length === 1) {
                return (0, exports.getChildrenForParent)(serialized, rootsWithChildrenArr, rootsWithChildrenArr[0]);
            }
            it = rootsWithChildrenArr;
        }
        else {
            it = node.children;
        }
        return iterator_1.Iterable.map(it, element => (element instanceof TestTreeErrorMessage
            ? { element }
            : {
                element,
                collapsible: element.test.expand !== 0 /* TestItemExpandState.NotExpandable */,
                collapsed: element.test.item.error
                    ? tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded
                    : ((0, testingViewState_1.isCollapsedInSerializedTestTree)(serialized, element.test.item.extId) ?? element.depth > 0
                        ? tree_1.ObjectTreeElementCollapseState.PreserveOrCollapsed
                        : tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded),
                children: (0, exports.getChildrenForParent)(serialized, rootsWithChildren, element),
            }));
    };
    exports.getChildrenForParent = getChildrenForParent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvZXhwbG9yZXJQcm9qZWN0aW9ucy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnRGhHLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztJQUVsQixNQUFNLEtBQUssR0FBRyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUV4QyxNQUFzQixtQkFBbUI7UUE0Q3hDLFlBQ2lCLElBQXNCO1FBQ3RDOzs7V0FHRztRQUNhLFNBQXFDLElBQUk7WUFMekMsU0FBSSxHQUFKLElBQUksQ0FBa0I7WUFLdEIsV0FBTSxHQUFOLE1BQU0sQ0FBbUM7WUFqRHZDLGtCQUFhLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUV2RDs7ZUFFRztZQUNhLGFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQUVwRDs7ZUFFRztZQUNhLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQUU5RDs7ZUFFRztZQUNhLFdBQU0sR0FBRyxLQUFLLEVBQUUsQ0FBQztZQUVqQzs7ZUFFRztZQUNJLFVBQUssR0FBVyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUvRDs7ZUFFRztZQUNJLFlBQU8sR0FBRyxLQUFLLENBQUM7WUFFdkI7OztlQUdHO1lBQ0ksVUFBSyxpQ0FBeUI7UUFtQmpDLENBQUM7UUFFRSxNQUFNO1lBQ1osSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN0QixPQUFPLEVBQUUs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