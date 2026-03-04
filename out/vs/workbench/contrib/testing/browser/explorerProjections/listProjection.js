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
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/workbench/contrib/testing/browser/explorerProjections/display", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/explorerProjections/testingViewState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, iterator_1, lifecycle_1, display_1, index_1, testingViewState_1, testId_1, testResultService_1, testService_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListProjection = void 0;
    /**
     * Test tree element element that groups be hierarchy.
     */
    class ListTestItemElement extends index_1.TestItemTreeElement {
        get description() {
            return this.chain.map(c => c.item.label).join(display_1.flatTestItemDelimiter);
        }
        constructor(test, parent, chain) {
            super({ ...test, item: { ...test.item } }, parent);
            this.chain = chain;
            this.descriptionParts = [];
            this.updateErrorVisibility();
        }
        update(patch) {
            (0, testTypes_1.applyTestItemUpdate)(this.test, patch);
            this.updateErrorVisibility(patch);
            this.fireChange();
        }
        fireChange() {
            this.changeEmitter.fire();
        }
        updateErrorVisibility(patch) {
            if (this.errorChild && (!this.test.item.error || patch?.item?.error)) {
                this.children.delete(this.errorChild);
                this.errorChild = undefined;
            }
            if (this.test.item.error && !this.errorChild) {
                this.errorChild = new index_1.TestTreeErrorMessage(this.test.item.error, this);
                this.children.add(this.errorChild);
            }
        }
    }
    /**
     * Projection that lists tests in their traditional tree view.
     */
    let ListProjection = class ListProjection extends lifecycle_1.Disposable {
        /**
         * Gets root elements of the tree.
         */
        get rootsWithChildren() {
            const rootsIt = iterator_1.Iterable.map(this.testService.collection.rootItems, r => this.items.get(r.item.extId));
            return iterator_1.Iterable.filter(rootsIt, (r) => !!r?.children.size);
        }
        constructor(lastState, testService, results) {
            super();
            this.lastState = lastState;
            this.testService = testService;
            this.results = results;
            this.updateEmitter = new event_1.Emitter();
            this.items = new Map();
            /**
             * @inheritdoc
             */
            this.onUpdate = this.updateEmitter.event;
            this._register(testService.onDidProcessDiff((diff) => this.applyDiff(diff)));
            // when test results are cleared, recalculate all state
            this._register(results.onResultsChanged((evt) => {
                if (!('removed' in evt)) {
                    return;
                }
                for (const inTree of this.items.values()) {
                    // Simple logic here, because we know in this projection states
                    // are never inherited.
                    const lookup = this.results.getStateById(inTree.test.item.extId)?.[1];
                    inTree.duration = lookup?.ownDuration;
                    inTree.state = lookup?.ownComputedState || 0 /* TestResultState.Unset */;
                    inTree.fireChange();
                }
            }));
            // when test states change, reflect in the tree
            this._register(results.onTestChanged(ev => {
                if (ev.reason === 2 /* TestResultItemChangeReason.NewMessage */) {
                    return; // no effect in the tree
                }
                let result = ev.item;
                // if the state is unset, or the latest run is not making the change,
                // double check that it's valid. Retire calls might cause previous
                // emit a state change for a test run that's already long completed.
                if (result.ownComputedState === 0 /* TestResultState.Unset */ || ev.result !== results.results[0]) {
                    const fallback = results.getStateById(result.item.extId);
                    if (fallback) {
                        result = fallback[1];
                    }
                }
                const item = this.items.get(result.item.extId);
                if (!item) {
                    return;
                }
                item.retired = !!result.retired;
                item.state = result.computedState;
                item.duration = result.ownDuration;
                item.fireChange();
            }));
            for (const test of testService.collection.all) {
                this.storeItem(test);
            }
        }
        /**
         * @inheritdoc
         */
        getElementByTestId(testId) {
            return this.items.get(testId);
        }
        /**
         * @inheritdoc
         */
        applyDiff(diff) {
            for (const op of diff) {
                switch (op.op) {
                    case 0 /* TestDiffOpType.Add */: {
                        this.storeItem(op.item);
                        break;
                    }
                    case 1 /* TestDiffOpType.Update */: {
                        this.items.get(op.item.extId)?.update(op.item);
                        break;
                    }
                    case 3 /* TestDiffOpType.Remove */: {
                        for (const [id, item] of this.items) {
                            if (id === op.itemId || testId_1.TestId.isChild(op.itemId, id)) {
                                this.unstoreItem(item);
                            }
                        }
                        break;
                    }
                }
            }
            if (diff.length !== 0) {
                this.updateEmitter.fire();
            }
        }
        /**
         * @inheritdoc
         */
        applyTo(tree) {
            // We don't bother doing a very specific update like we do in the TreeProjection.
            // It's a flat list, so chances are we need to render everything anyway.
            // Let the diffIdentityProvider handle that.
            tree.setChildren(null, (0, index_1.getChildrenForParent)(this.lastState, this.rootsWithChildren, null), {
                diffIdentityProvider: index_1.testIdentityProvider,
                diffDepth: Infinity
            });
        }
        /**
         * @inheritdoc
         */
        expandElement(element, depth) {
            if (!(element instanceof ListTestItemElement)) {
                return;
            }
            if (element.test.expand === 0 /* TestItemExpandState.NotExpandable */) {
                return;
            }
            this.testService.collection.expand(element.test.item.extId, depth);
        }
        unstoreItem(treeElement) {
            this.items.delete(treeElement.test.item.extId);
            treeElement.parent?.children.delete(treeElement);
            const parentId = testId_1.TestId.fromString(treeElement.test.item.extId).parentId;
            if (!parentId) {
                return;
            }
            // create the parent if it's now its own leaf
            for (const id of parentId.idsToRoot()) {
                const parentTest = this.testService.collection.getNodeById(id.toString());
                if (parentTest) {
                    if (parentTest.children.size === 0 && !this.items.has(id.toString())) {
                        this._storeItem(parentId, parentTest);
                    }
                    break;
                }
            }
        }
        _storeItem(testId, item) {
            const displayedParent = testId.isRoot ? null : this.items.get(item.controllerId);
            const chain = [...testId.idsFromRoot()].slice(1, -1).map(id => this.testService.collection.getNodeById(id.toString()));
            const treeElement = new ListTestItemElement(item, displayedParent, chain);
            displayedParent?.children.add(treeElement);
            this.items.set(treeElement.test.item.extId, treeElement);
            if (treeElement.depth === 0 || (0, testingViewState_1.isCollapsedInSerializedTestTree)(this.lastState, treeElement.test.item.extId) === false) {
                this.expandElement(treeElement, Infinity);
            }
            const prevState = this.results.getStateById(treeElement.test.item.extId)?.[1];
            if (prevState) {
                treeElement.retired = !!prevState.retired;
                treeElement.state = prevState.computedState;
                treeElement.duration = prevState.ownDuration;
            }
        }
        storeItem(item) {
            const testId = testId_1.TestId.fromString(item.item.extId);
            // Remove any non-root parent of this item which is no longer a leaf.
            for (const parentId of testId.idsToRoot()) {
                if (!parentId.isRoot) {
                    const prevParent = this.items.get(parentId.toString());
                    if (prevParent) {
                        this.unstoreItem(prevParent);
                        break;
                    }
                }
            }
            this._storeItem(testId, item);
        }
    };
    exports.ListProjection = ListProjection;
    exports.ListProjection = ListProjection = __decorate([
        __param(1, testService_1.ITestService),
        __param(2, testResultService_1.ITestResultService)
    ], ListProjection);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFByb2plY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvZXhwbG9yZXJQcm9qZWN0aW9ucy9saXN0UHJvamVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHOztPQUVHO0lBQ0gsTUFBTSxtQkFBb0IsU0FBUSwyQkFBbUI7UUFLcEQsSUFBb0IsV0FBVztZQUM5QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsK0JBQXFCLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRUQsWUFDQyxJQUFzQixFQUN0QixNQUFrQyxFQUNqQixLQUF5QjtZQUUxQyxLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRmxDLFVBQUssR0FBTCxLQUFLLENBQW9CO1lBVHBDLHFCQUFnQixHQUFhLEVBQUUsQ0FBQztZQVl0QyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRU0sTUFBTSxDQUFDLEtBQXNCO1lBQ25DLElBQUEsK0JBQW1CLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFFTSxVQUFVO1lBQ2hCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENB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