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
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/explorerProjections/testingViewState", "vs/workbench/contrib/testing/common/getComputedState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, iterator_1, lifecycle_1, index_1, testingViewState_1, getComputedState_1, testId_1, testResultService_1, testService_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeProjection = void 0;
    const computedStateAccessor = {
        getOwnState: i => i instanceof index_1.TestItemTreeElement ? i.ownState : 0 /* TestResultState.Unset */,
        getCurrentComputedState: i => i.state,
        setComputedState: (i, s) => i.state = s,
        getCurrentComputedDuration: i => i.duration,
        getOwnDuration: i => i instanceof index_1.TestItemTreeElement ? i.ownDuration : undefined,
        setComputedDuration: (i, d) => i.duration = d,
        getChildren: i => iterator_1.Iterable.filter(i.children.values(), (t) => t instanceof TreeTestItemElement),
        *getParents(i) {
            for (let parent = i.parent; parent; parent = parent.parent) {
                yield parent;
            }
        },
    };
    /**
     * Test tree element element that groups be hierarchy.
     */
    class TreeTestItemElement extends index_1.TestItemTreeElement {
        get description() {
            return this.test.item.description;
        }
        constructor(test, parent, addedOrRemoved) {
            super({ ...test, item: { ...test.item } }, parent);
            this.addedOrRemoved = addedOrRemoved;
            /**
             * Own, non-computed state.
             * @internal
             */
            this.ownState = 0 /* TestResultState.Unset */;
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
                this.addedOrRemoved(this);
                this.children.delete(this.errorChild);
                this.errorChild = undefined;
            }
            if (this.test.item.error && !this.errorChild) {
                this.errorChild = new index_1.TestTreeErrorMessage(this.test.item.error, this);
                this.children.add(this.errorChild);
                this.addedOrRemoved(this);
            }
        }
    }
    /**
     * Projection that lists tests in their traditional tree view.
     */
    let TreeProjection = class TreeProjection extends lifecycle_1.Disposable {
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
            this.changedParents = new Set();
            this.resortedParents = new Set();
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
                for (const inTree of [...this.items.values()].sort((a, b) => b.depth - a.depth)) {
                    const lookup = this.results.getStateById(inTree.test.item.extId)?.[1];
                    inTree.ownDuration = lookup?.ownDuration;
                    (0, getComputedState_1.refreshComputedState)(computedStateAccessor, inTree, lookup?.ownComputedState ?? 0 /* TestResultState.Unset */).forEach(i => i.fireChange());
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
                // Skip refreshing the duration if we can trivially tell it didn't change.
                const refreshDuration = ev.reason === 1 /* TestResultItemChangeReason.OwnStateChange */ && ev.previousOwnDuration !== result.ownDuration;
                // For items without children, always use the computed state. They are
                // either leaves (for which it's fine) or nodes where we haven't expanded
                // children and should trust whatever the result service gives us.
                const explicitComputed = item.children.size ? undefined : result.computedState;
                item.retired = !!result.retired;
                item.ownState = result.ownComputedState;
                item.ownDuration = result.ownDuration;
                item.fireChange();
                (0, getComputedState_1.refreshComputedState)(computedStateAccessor, item, explicitComputed, refreshDuration).forEach(i => i.fireChange());
            }));
            for (const test of testService.collection.all) {
                this.storeItem(this.createItem(test));
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
                        const item = this.createItem(op.item);
                        this.storeItem(item);
                        break;
                    }
                    case 1 /* TestDiffOpType.Update */: {
                        const patch = op.item;
                        const existing = this.items.get(patch.extId);
                        if (!existing) {
                            break;
                        }
                        // parent needs to be re-rendered on an expand update, so that its
                        // children are rewritten.
                        const needsParentUpdate = existing.test.expand === 0 /* TestItemExpandState.NotExpandable */ && patch.expand;
                        existing.update(patch);
                        if (needsParentUpdate) {
                            this.changedParents.add(existing.parent);
                        }
                        else {
                            this.resortedParents.add(existing.parent);
                        }
                        break;
                    }
                    case 3 /* TestDiffOpType.Remove */: {
                        const toRemove = this.items.get(op.itemId);
                        if (!toRemove) {
                            break;
                        }
                        // The first element will cause the root to be hidden
                        const parent = toRemove.parent;
                        const affectsRootElement = toRemove.depth === 1 && parent?.children.size === 1;
                        this.changedParents.add(affectsRootElement ? null : parent);
                        const queue = [[toRemove]];
                        while (queue.length) {
                            for (const item of queue.pop()) {
                                if (item instanceof TreeTestItemElement) {
                                    queue.push(this.unstoreItem(item));
                                }
                            }
                        }
                        if (parent instanceof TreeTestItemElement) {
                            (0, getComputedState_1.refreshComputedState)(computedStateAccessor, parent, undefined, !!parent.duration).forEach(i => i.fireChange());
                        }
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
            for (const parent of this.changedParents) {
                if (!parent || tree.hasElement(parent)) {
                    tree.setChildren(parent, (0, index_1.getChildrenForParent)(this.lastState, this.rootsWithChildren, parent), { diffIdentityProvider: index_1.testIdentityProvider });
                }
            }
            for (const parent of this.resortedParents) {
                if (!parent || tree.hasElement(parent)) {
                    tree.resort(parent, false);
                }
            }
            this.changedParents.clear();
            this.resortedParents.clear();
        }
        /**
         * @inheritdoc
         */
        expandElement(element, depth) {
            if (!(element instanceof TreeTestItemElement)) {
                return;
            }
            if (element.test.expand === 0 /* TestItemExpandState.NotExpandable */) {
                return;
            }
            this.testService.collection.expand(element.test.item.extId, depth);
        }
        createItem(item) {
            const parentId = testId_1.TestId.parentId(item.item.extId);
            const parent = parentId ? this.items.get(parentId) : null;
            return new TreeTestItemElement(item, parent, n => this.changedParents.add(n));
        }
        unstoreItem(treeElement) {
            const parent = treeElement.parent;
            parent?.children.delete(treeElement);
            this.items.delete(treeElement.test.item.extId);
            return treeElement.children;
        }
        storeItem(treeElement) {
            treeElement.parent?.children.add(treeElement);
            this.items.set(treeElement.test.item.extId, treeElement);
            // The first element will cause the root to be shown. The first element of
            // a parent may need to re-render it for #204805.
            const affectsParent = treeElement.parent?.children.size === 1;
            const affectedParent = affectsParent ? treeElement.parent.parent : treeElement.parent;
            this.changedParents.add(affectedParent);
            if (affectedParent?.depth === 0) {
                this.changedParents.add(null);
            }
            if (treeElement.depth === 0 || (0, testingViewState_1.isCollapsedInSerializedTestTree)(this.lastState, treeElement.test.item.extId) === false) {
                this.expandElement(treeElement, 0);
            }
            const prevState = this.results.getStateById(treeElement.test.item.extId)?.[1];
            if (prevState) {
                treeElement.retired = !!prevState.retired;
                treeElement.ownState = prevState.computedState;
                treeElement.ownDuration = prevState.ownDuration;
                (0, getComputedState_1.refreshComputedState)(computedStateAccessor, treeElement, undefined, !!treeElement.ownDuration).forEach(i => i.fireChange());
            }
        }
    };
    exports.TreeProjection = TreeProjection;
    exports.TreeProjection = TreeProjection = __decorate([
        __param(1, testService_1.ITestService),
        __param(2, testResultService_1.ITestResultService)
    ], TreeProjection);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVByb2plY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvZXhwbG9yZXJQcm9qZWN0aW9ucy90cmVlUHJvamVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHLE1BQU0scUJBQXFCLEdBQTJEO1FBQ3JGLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSwyQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLDhCQUFzQjtRQUN2Rix1QkFBdUIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLO1FBQ3JDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO1FBRXZDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVE7UUFDM0MsY0FBYyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLDJCQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTO1FBQ2pGLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDO1FBRTdDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLG1CQUFRLENBQUMsTUFBTSxDQUNoQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUNuQixDQUFDLENBQUMsRUFBNEIsRUFBRSxDQUFDLENBQUMsWUFBWSxtQkFBbUIsQ0FDakU7UUFDRCxDQUFDLFVB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