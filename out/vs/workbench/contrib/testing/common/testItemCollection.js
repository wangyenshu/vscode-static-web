/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/assert", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testId"], function (require, exports, async_1, event_1, lifecycle_1, assert_1, testTypes_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTestItemChildren = exports.MixedTestItemController = exports.InvalidTestItemError = exports.DuplicateTestItemError = exports.TestItemCollection = exports.TestItemEventOp = void 0;
    var TestItemEventOp;
    (function (TestItemEventOp) {
        TestItemEventOp[TestItemEventOp["Upsert"] = 0] = "Upsert";
        TestItemEventOp[TestItemEventOp["SetTags"] = 1] = "SetTags";
        TestItemEventOp[TestItemEventOp["UpdateCanResolveChildren"] = 2] = "UpdateCanResolveChildren";
        TestItemEventOp[TestItemEventOp["RemoveChild"] = 3] = "RemoveChild";
        TestItemEventOp[TestItemEventOp["SetProp"] = 4] = "SetProp";
        TestItemEventOp[TestItemEventOp["Bulk"] = 5] = "Bulk";
        TestItemEventOp[TestItemEventOp["DocumentSynced"] = 6] = "DocumentSynced";
    })(TestItemEventOp || (exports.TestItemEventOp = TestItemEventOp = {}));
    const strictEqualComparator = (a, b) => a === b;
    const diffableProps = {
        range: (a, b) => {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.equalsRange(b);
        },
        busy: strictEqualComparator,
        label: strictEqualComparator,
        description: strictEqualComparator,
        error: strictEqualComparator,
        sortText: strictEqualComparator,
        tags: (a, b) => {
            if (a.length !== b.length) {
                return false;
            }
            if (a.some(t1 => !b.includes(t1))) {
                return false;
            }
            return true;
        },
    };
    const diffableEntries = Object.entries(diffableProps);
    const diffTestItems = (a, b) => {
        let output;
        for (const [key, cmp] of diffableEntries) {
            if (!cmp(a[key], b[key])) {
                if (output) {
                    output[key] = b[key];
                }
                else {
                    output = { [key]: b[key] };
                }
            }
        }
        return output;
    };
    /**
     * Maintains a collection of test items for a single controller.
     */
    class TestItemCollection extends lifecycle_1.Disposable {
        get root() {
            return this.options.root;
        }
        constructor(options) {
            super();
            this.options = options;
            this.debounceSendDiff = this._register(new async_1.RunOnceScheduler(() => this.flushDiff(), 200));
            this.diffOpEmitter = this._register(new event_1.Emitter());
            this.tree = new Map();
            this.tags = new Map();
            this.diff = [];
            /**
             * Fires when an operation happens that should result in a diff.
             */
            this.onDidGenerateDiff = this.diffOpEmitter.event;
            this.root.canResolveChildren = true;
            this.upsertItem(this.root, undefined);
        }
        /**
         * Handler used for expanding test items.
         */
        set resolveHandler(handler) {
            this._resolveHandler = handler;
            for (const test of this.tree.values()) {
                this.updateExpandability(test);
            }
        }
        get resolveHandler() {
            return this._resolveHandler;
        }
        /**
         * Gets a diff of all changes that have been made, and clears the diff queue.
         */
        collectDiff() {
            const diff = this.diff;
            this.diff = [];
            return diff;
        }
        /**
         * Pushes a new diff entry onto the collected diff list.
         */
        pushDiff(diff) {
            switch (diff.op) {
                case 2 /* TestDiffOpType.DocumentSynced */: {
                    for (const existing of this.diff) {
                        if (existing.op === 2 /* TestDiffOpType.DocumentSynced */ && existing.uri === diff.uri) {
                            existing.docv = diff.docv;
                            return;
                        }
                    }
                    break;
                }
                case 1 /* TestDiffOpType.Update */: {
                    // Try to merge updates, since they're invoked per-property
                    const last = this.diff[this.diff.length - 1];
                    if (last) {
                        if (last.op === 1 /* TestDiffOpType.Update */ && last.item.extId === diff.item.extId) {
                            (0, testTypes_1.applyTestItemUpdate)(last.item, diff.item);
                            return;
                        }
                        if (last.op === 0 /* TestDiffOpType.Add */ && last.item.item.extId === diff.item.extId) {
                            (0, testTypes_1.applyTestItemUpdate)(last.item, diff.item);
                            return;
                        }
                    }
                    break;
                }
            }
            this.diff.push(diff);
            if (!this.debounceSendDiff.isScheduled()) {
                this.debounceSendDiff.schedule();
            }
        }
        /**
         * Expands the test and the given number of `levels` of children. If levels
         * is < 0, then all children will be expanded. If it's 0, then only this
         * item will be expanded.
         */
        expand(testId, levels) {
            const internal = this.tree.get(testId);
            if (!internal) {
                return;
            }
            if (internal.expandLevels === undefined || levels > internal.expandLevels) {
                internal.expandLevels = levels;
            }
            // try to avoid awaiting things if the provider returns synchronously in
            // order to keep everything in a single diff and DOM update.
            if (internal.expand === 1 /* TestItemExpandState.Expandable */) {
                const r = this.resolveChildren(internal);
                return !r.isOpen()
                    ? r.wait().then(() => this.expandChildren(internal, levels - 1))
                    : this.expandChildren(internal, levels - 1);
            }
            else if (internal.expand === 3 /* TestItemExpandState.Expanded */) {
                return internal.resolveBarrier?.isOpen() === false
                    ? internal.resolveBarrier.wait().then(() => this.expandChildren(internal, levels - 1))
                    : this.expandChildren(internal, levels - 1);
            }
        }
        dispose() {
            for (const item of this.tree.values()) {
                this.options.getApiFor(item.actual).listener = undefined;
            }
            this.tree.clear();
            this.diff = [];
            super.dispose();
        }
        onTestItemEvent(internal, evt) {
            switch (evt.op) {
                case 3 /* TestItemEventOp.RemoveChild */:
                    this.removeItem(testId_1.TestId.joinToString(internal.fullId, evt.id));
                    break;
                case 0 /* TestItemEventOp.Upsert */:
                    this.upsertItem(evt.item, internal);
                    break;
                case 5 /* TestItemEventOp.Bulk */:
                    for (const op of evt.ops) {
                        this.onTestItemEvent(internal, op);
                    }
                    break;
                case 1 /* TestItemEventOp.SetTags */:
                    this.diffTagRefs(evt.new, evt.old, internal.fullId.toString());
                    break;
                case 2 /* TestItemEventOp.UpdateCanResolveChildren */:
                    this.updateExpandability(internal);
                    break;
                case 4 /* TestItemEventOp.SetProp */:
                    this.pushDiff({
                        op: 1 /* TestDiffOpType.Update */,
                        item: {
                            extId: internal.fullId.toString(),
                            item: evt.update,
                        }
                    });
                    break;
                case 6 /* TestItemEventOp.DocumentSynced */:
                    this.documentSynced(internal.actual.uri);
                    break;
                default:
                    (0, assert_1.assertNever)(evt);
            }
        }
        documentSynced(uri) {
            if (uri) {
                this.pushDiff({
                    op: 2 /* TestDiffOpType.DocumentSynced */,
                    uri,
                    docv: this.options.getDocumentVersion(uri)
                });
            }
        }
        upsertItem(actual, parent) {
            const fullId = testId_1.TestId.fromExtHostTestItem(actual, this.root.id, parent?.actual);
            // If this test item exists elsewhere in the tree already (exists at an
            // old ID with an existing parent), remove that old item.
            const privateApi = this.options.getApiFor(actual);
            if (privateApi.parent && privateApi.parent !== parent?.actual) {
                this.options.getChildren(privateApi.parent).delete(actual.id);
            }
            let internal = this.tree.get(fullId.toString());
            // Case 1: a brand new item
            if (!internal) {
                internal = {
                    fullId,
                    actual,
                    expandLevels: parent?.expandLevels /* intentionally undefined or 0 */ ? parent.expandLevels - 1 : undefined,
                    expand: 0 /* TestItemExpandState.NotExpandable */, // updated by `connectItemAndChildren`
                };
                actual.tags.forEach(this.incrementTagRefs, this);
                this.tree.set(internal.fullId.toString(), internal);
                this.setItemParent(actual, parent);
                this.pushDiff({
                    op: 0 /* TestDiffOpType.Add */,
                    item: {
                        controllerId: this.options.controllerId,
                        expand: internal.expand,
                        item: this.options.toITestItem(actual),
                    },
                });
                this.connectItemAndChildren(actual, internal, parent);
                return;
            }
            // Case 2: re-insertion of an existing item, no-op
            if (internal.actual === actual) {
                this.connectItem(actual, internal, parent); // re-connect in case the parent changed
                return; // no-op
            }
            // Case 3: upsert of an existing item by ID, with a new instance
            if (internal.actual.uri?.toString() !== actual.uri?.toString()) {
                // If the item has a new URI, re-insert it; we don't support updating
                // URIs on existing test items.
                this.removeItem(fullId.toString());
                return this.upsertItem(actual, parent);
            }
            const oldChildren = this.options.getChildren(internal.actual);
            const oldActual = internal.actual;
            const update = diffTestItems(this.options.toITestItem(oldActual), this.options.toITestItem(actual));
            this.options.getApiFor(oldActual).listener = undefined;
            internal.actual = actual;
            internal.resolveBarrier = undefined;
            internal.expand = 0 /* TestItemExpandState.NotExpandable */; // updated by `connectItemAndChildren`
            if (update) {
                // tags are handled in a special way
                if (update.hasOwnProperty('tags')) {
                    this.diffTagRefs(actual.tags, oldActual.tags, fullId.toString());
                    delete update.tags;
                }
                this.onTestItemEvent(internal, { op: 4 /* TestItemEventOp.SetProp */, update });
            }
            this.connectItemAndChildren(actual, internal, parent);
            // Remove any orphaned children.
            for (const [_, child] of oldChildren) {
                if (!this.options.getChildren(actual).get(child.id)) {
                    this.removeItem(testId_1.TestId.joinToString(fullId, child.id));
                }
            }
            // Re-expand the element if it was previous expanded (#207574)
            const expandLevels = internal.expandLevels;
            if (expandLevels !== undefined) {
                // Wait until a microtask to allow the extension to finish setting up
                // properties of the element and children before we ask it to expand.
                queueMicrotask(() => {
                    if (internal.expand === 1 /* TestItemExpandState.Expandable */) {
                        internal.expandLevels = undefined;
                        this.expand(fullId.toString(), expandLevels);
                    }
                });
            }
            // Mark ranges in the document as synced (#161320)
            this.documentSynced(internal.actual.uri);
        }
        diffTagRefs(newTags, oldTags, extId) {
            const toDelete = new Set(oldTags.map(t => t.id));
            for (const tag of newTags) {
                if (!toDelete.delete(tag.id)) {
                    this.incrementTagRefs(tag);
                }
            }
            this.pushDiff({
                op: 1 /* TestDiffOpType.Update */,
                item: { extId, item: { tags: newTags.map(v => (0, testTypes_1.namespaceTestTag)(this.options.controllerId, v.id)) } }
            });
            toDelete.forEach(this.decrementTagRefs, this);
        }
        incrementTagRefs(tag) {
            const existing = this.tags.get(tag.id);
            if (existing) {
                existing.refCount++;
            }
            else {
                this.tags.set(tag.id, { refCount: 1 });
                this.pushDiff({
                    op: 6 /* TestDiffOpType.AddTag */, tag: {
                        id: (0, testTypes_1.namespaceTestTag)(this.options.controllerId, tag.id),
                    }
                });
            }
        }
        decrementTagRefs(tagId) {
            const existing = this.tags.get(tagId);
            if (existing && !--existing.refCount) {
                this.tags.delete(tagId);
                this.pushDiff({ op: 7 /* TestDiffOpType.RemoveTag */, id: (0, testTypes_1.namespaceTestTag)(this.options.controllerId, tagId) });
            }
        }
        setItemParent(actual, parent) {
            this.options.getApiFor(actual).parent = parent && parent.actual !== this.root ? parent.actual : undefined;
        }
        connectItem(actual, internal, parent) {
            this.setItemParent(actual, parent);
            const api = this.options.getApiFor(actual);
            api.parent = parent?.actual;
            api.listener = evt => this.onTestItemEvent(internal, evt);
            this.updateExpandability(internal);
        }
        connectItemAndChildren(actual, internal, parent) {
            this.connectItem(actual, internal, parent);
            // Discover any existing children that might have already been added
            for (const [_, child] of this.options.getChildren(actual)) {
                this.upsertItem(child, internal);
            }
        }
        /**
         * Updates the `expand` state of the item. Should be called whenever the
         * resolved state of the item changes. Can automatically expand the item
         * if requested by a consumer.
         */
        updateExpandability(internal) {
            let newState;
            if (!this._resolveHandler) {
                newState = 0 /* TestItemExpandState.NotExpandable */;
            }
            else if (internal.resolveBarrier) {
                newState = internal.resolveBarrier.isOpen()
                    ? 3 /* TestItemExpandState.Expanded */
                    : 2 /* TestItemExpandState.BusyExpanding */;
            }
            else {
                newState = internal.actual.canResolveChildren
                    ? 1 /* TestItemExpandState.Expandable */
                    : 0 /* TestItemExpandState.NotExpandable */;
            }
            if (newState === internal.expand) {
                return;
            }
            internal.expand = newState;
            this.pushDiff({ op: 1 /* TestDiffOpType.Update */, item: { extId: internal.fullId.toString(), expand: newState } });
            if (newState === 1 /* TestItemExpandState.Expandable */ && internal.expandLevels !== undefined) {
                this.resolveChildren(internal);
            }
        }
        /**
         * Expands all children of the item, "levels" deep. If levels is 0, only
         * the children will be expanded. If it's 1, the children and their children
         * will be expanded. If it's <0, it's a no-op.
         */
        expandChildren(internal, levels) {
            if (levels < 0) {
                return;
            }
            const expandRequests = [];
            for (const [_, child] of this.options.getChildren(internal.actual)) {
                const promise = this.expand(testId_1.TestId.joinToString(internal.fullId, child.id), levels);
                if ((0, async_1.isThenable)(promise)) {
                    expandRequests.push(promise);
                }
            }
            if (expandRequests.length) {
                return Promise.all(expandRequests).then(() => { });
            }
        }
        /**
         * Calls `discoverChildren` on the item, refreshing all its tests.
         */
        resolveChildren(internal) {
            if (internal.resolveBarrier) {
                return internal.resolveBarrier;
            }
            if (!this._resolveHandler) {
                const b = new async_1.Barrier();
                b.open();
                return b;
            }
            internal.expand = 2 /* TestItemExpandState.BusyExpanding */;
            this.pushExpandStateUpdate(internal);
            const barrier = internal.resolveBarrier = new async_1.Barrier();
            const applyError = (err) => {
                console.error(`Unhandled error in resolveHandler of test controller "${this.options.controllerId}"`, err);
            };
            let r;
            try {
                r = this._resolveHandler(internal.actual === this.root ? undefined : internal.actual);
            }
            catch (err) {
                applyError(err);
            }
            if ((0, async_1.isThenable)(r)) {
                r.catch(applyError).then(() => {
                    barrier.open();
                    this.updateExpandability(internal);
                });
            }
            else {
                barrier.open();
                this.updateExpandability(internal);
            }
            return internal.resolveBarrier;
        }
        pushExpandStateUpdate(internal) {
            this.pushDiff({ op: 1 /* TestDiffOpType.Update */, item: { extId: internal.fullId.toString(), expand: internal.expand } });
        }
        removeItem(childId) {
            const childItem = this.tree.get(childId);
            if (!childItem) {
                throw new Error('attempting to remove non-existent child');
            }
            this.pushDiff({ op: 3 /* TestDiffOpType.Remove */, itemId: childId });
            const queue = [childItem];
            while (queue.length) {
                const item = queue.pop();
                if (!item) {
                    continue;
                }
                this.options.getApiFor(item.actual).listener = undefined;
                for (const tag of item.actual.tags) {
                    this.decrementTagRefs(tag.id);
                }
                this.tree.delete(item.fullId.toString());
                for (const [_, child] of this.options.getChildren(item.actual)) {
                    queue.push(this.tree.get(testId_1.TestId.joinToString(item.fullId, child.id)));
                }
            }
        }
        /**
         * Immediately emits any pending diffs on the collection.
         */
        flushDiff() {
            const diff = this.collectDiff();
            if (diff.length) {
                this.diffOpEmitter.fire(diff);
            }
        }
    }
    exports.TestItemCollection = TestItemCollection;
    class DuplicateTestItemError extends Error {
        constructor(id) {
            super(`Attempted to insert a duplicate test item ID ${id}`);
        }
    }
    exports.DuplicateTestItemError = DuplicateTestItemError;
    class InvalidTestItemError extends Error {
        constructor(id) {
            super(`TestItem with ID "${id}" is invalid. Make sure to create it from the createTestItem method.`);
        }
    }
    exports.InvalidTestItemError = InvalidTestItemError;
    class MixedTestItemController extends Error {
        constructor(id, ctrlA, ctrlB) {
            super(`TestItem with ID "${id}" is from controller "${ctrlA}" and cannot be added as a child of an item from controller "${ctrlB}".`);
        }
    }
    exports.MixedTestItemController = MixedTestItemController;
    const createTestItemChildren = (api, getApi, checkCtor) => {
        let mapped = new Map();
        return {
            /** @inheritdoc */
            get size() {
                return mapped.size;
            },
            /** @inheritdoc */
            forEach(callback, thisArg) {
                for (const item of mapped.values()) {
                    callback.call(thisArg, item, this);
                }
            },
            /** @inheritdoc */
            [Symbol.iterator]() {
                return mapped.entries();
            },
            /** @inheritdoc */
            replace(items) {
                const newMapped = new Map();
                const toDelete = new Set(mapped.keys());
                const bulk = { op: 5 /* TestItemEventOp.Bulk */, ops: [] };
                for (const item of items) {
                    if (!(item instanceof checkCtor)) {
                        throw new InvalidTestItemError(item.id);
                    }
                    const itemController = getApi(item).controllerId;
                    if (itemController !== api.controllerId) {
                        throw new MixedTestItemController(item.id, itemController, api.controllerId);
                    }
                    if (newMapped.has(item.id)) {
                        throw new DuplicateTestItemError(item.id);
                    }
                    newMapped.set(item.id, item);
                    toDelete.delete(item.id);
                    bulk.ops.push({ op: 0 /* TestItemEventOp.Upsert */, item });
                }
                for (const id of toDelete.keys()) {
                    bulk.ops.push({ op: 3 /* TestItemEventOp.RemoveChild */, id });
                }
                api.listener?.(bulk);
                // important mutations come after firing, so if an error happens no
                // changes will be "saved":
                mapped = newMapped;
            },
            /** @inheritdoc */
            add(item) {
                if (!(item instanceof checkCtor)) {
                    throw new InvalidTestItemError(item.id);
                }
                mapped.set(item.id, item);
                api.listener?.({ op: 0 /* TestItemEventOp.Upsert */, item });
            },
            /** @inheritdoc */
            delete(id) {
                if (mapped.delete(id)) {
                    api.listener?.({ op: 3 /* TestItemEventOp.RemoveChild */, id });
                }
            },
            /** @inheritdoc */
            get(itemId) {
                return mapped.get(itemId);
            },
            /** JSON serialization function. */
            toJSON() {
                return Array.from(mapped.values());
            },
        };
    };
    exports.createTestItemChildren = createTestItemChildren;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEl0ZW1Db2xsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdEl0ZW1Db2xsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsSUFBa0IsZUFRakI7SUFSRCxXQUFrQixlQUFlO1FBQ2hDLHlEQUFNLENBQUE7UUFDTiwyREFBTyxDQUFBO1FBQ1AsNkZBQXdCLENBQUE7UUFDeEIsbUVBQVcsQ0FBQTtRQUNYLDJEQUFPLENBQUE7UUFDUCxxREFBSSxDQUFBO1FBQ0oseUVBQWMsQ0FBQTtJQUNmLENBQUMsRUFSaUIsZUFBZSwrQkFBZixlQUFlLFFBUWhDO0lBdUVELE1BQU0scUJBQXFCLEdBQUcsQ0FBSSxDQUFJLEVBQUUsQ0FBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pELE1BQU0sYUFBYSxHQUErRTtRQUNqRyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDZixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxPQUFPLElBQUksQ0FBQztZQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUFDLE9BQU8sS0FBSyxDQUFDO1lBQUMsQ0FBQztZQUMvQixPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUNELElBQUksRUFBRSxxQkFBcUI7UUFDM0IsS0FBSyxFQUFFLHFCQUFxQjtRQUM1QixXQUFXLEVBQUUscUJBQXFCO1FBQ2xDLEtBQUssRUFBRSxxQkFBcUI7UUFDNUIsUUFBUSxFQUFFLHFCQUFxQjtRQUMvQixJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDZCxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7S0FDRCxDQUFDO0lBRUYsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQThELENBQUM7SUFFbkgsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFZLEVBQUUsQ0FBWSxFQUFFLEVBQUU7UUFDcEQsSUFBSSxNQUEyQyxDQUFDO1FBQ2hELEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxlQUFlLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUMxQixJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNaLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLE1BQXdDLENBQUM7SUFDakQsQ0FBQyxDQUFDO0lBY0Y7O09BRUc7SUFDSCxNQUFhLGtCQUE0QyxTQUFRLHNCQUFVO1FBSzFFLElBQVcsSUFBSTtZQUNkLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUIsQ0FBQztRQU9ELFlBQTZCLE9BQXNDO1lBQ2xFLEtBQUssRUFBRSxDQUFDO1lBRG9CLFlBQU8sR0FBUCxPQUFPLENBQStCO1lBYmxELHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNyRixrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWEsQ0FBQyxDQUFDO1lBTzFELFNBQUksR0FBRyxJQUFJLEdBQUcsRUFBK0MsQ0FBQztZQUM3RCxTQUFJLEdBQUcsSUFBSSxHQUFHLEVBQWdELENBQUM7WUFFdEUsU0FBSSxHQUFjLEVBQUUsQ0FBQztZQXNCL0I7O2VBRUc7WUFDYSxzQkFBaUIsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQXJCNUQsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFDcEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRDs7V0FFRztRQUNILElBQVcsY0FBYyxDQUFDLE9BQW9EO1lBQzdFLElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO1lBQy9CLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFXLGNBQWM7WUFDeEIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFPRDs7V0FFRztRQUNJLFdBQVc7WUFDakIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNmLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVEOztXQUVHO1FBQ0ksUUFBUSxDQUFDLElBQWlCO1lBQ2hDLFFBQVEsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqQiwwQ0FBa0MsQ0FBQyxDQUFDLENBQUM7b0JBQ3BDLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNsQyxJQUFJLFFBQVEsQ0FBQyxFQUFFLDBDQUFrQyxJQUFJLFFBQVEsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDOzRCQUNoRixRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7NEJBQzFCLE9BQU87d0JBQ1IsQ0FBQztvQkFDRixDQUFDO29CQUVELE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxrQ0FBMEIsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLDJEQUEyRDtvQkFDM0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDN0MsSUFBSSxJQUFJLEVBQUUsQ0FBQzt3QkFDVixJQUFJLElBQUksQ0FBQyxFQUFFLGtDQUEwQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQzlFLElBQUEsK0JBQW1CLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7NEJBQzFDLE9BQU87d0JBQ1IsQ0FBQzt3QkFFRCxJQUFJLElBQUksQ0FBQyxFQUFFLCtCQUF1QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDOzRCQUNoRixJQUFBLCtCQUFtQixFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUMxQyxPQUFPO3dCQUNSLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFckIsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7UUFFRDs7OztXQUlHO1FBQ0ksTUFBTSxDQUFDLE1BQWMsRUFBRSxNQUFjO1lBQzNDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyxTQUFTLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDM0UsUUFBUSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7WUFDaEMsQ0FBQztZQUVELHdFQUF3RTtZQUN4RSw0REFBNEQ7WUFDNUQsSUFBSSxRQUFRLENBQUMsTUFBTSwyQ0FBbUMsRUFBRSxDQUFDO2dCQUN4RCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN6QyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtvQkFDakIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNoRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzlDLENBQUM7aUJBQU0sSUFBSSxRQUFRLENBQUMsTUFBTSx5Q0FBaUMsRUFBRSxDQUFDO2dCQUM3RCxPQUFPLFFBQVEsQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLEtBQUssS0FBSztvQkFDakQsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDdEYsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM5QyxDQUFDO1FBQ0YsQ0FBQztRQUVlLE9BQU87WUFDdEIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1lBQzFELENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFTyxlQUFlLENBQUMsUUFBMkIsRUFBRSxHQUF5QjtZQUM3RSxRQUFRLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDaEI7b0JBQ0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzlELE1BQU07Z0JBRVA7b0JBQ0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUN6QyxNQUFNO2dCQUVQO29CQUNDLEtBQUssTUFBTSxFQUFFLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUMxQixJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDcEMsQ0FBQztvQkFDRCxNQUFNO2dCQUVQO29CQUNDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDL0QsTUFBTTtnQkFFUDtvQkFDQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ25DLE1BQU07Z0JBRVA7b0JBQ0MsSUFBSSxDQUFDLFFBQVEsQ0FBQzt3QkFDYixFQUFFLCtCQUF1Qjt3QkFDekIsSUFBSSxFQUFFOzRCQUNMLEtBQUssRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTs0QkFDakMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNO3lCQUNoQjtxQkFDRCxDQUFDLENBQUM7b0JBQ0gsTUFBTTtnQkFFUDtvQkFDQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3pDLE1BQU07Z0JBRVA7b0JBQ0MsSUFBQSxvQkFBVyxFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLENBQUM7UUFDRixDQUFDO1FBRU8sY0FBYyxDQUFDLEdBQW9CO1lBQzFDLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1QsSUFBSSxDQUFDLFFBQVEsQ0FBQztvQkFDYixFQUFFLHVDQUErQjtvQkFDakMsR0FBRztvQkFDSCxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUM7aUJBQzFDLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sVUFBVSxDQUFDLE1BQVMsRUFBRSxNQUFxQztZQUNsRSxNQUFNLE1BQU0sR0FBRyxlQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVoRix1RUFBdUU7WUFDdkUseURBQXlEO1lBQ3pELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELElBQUksVUFBVSxDQUFDLE1BQU0sSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDL0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDL0QsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELDJCQUEyQjtZQUMzQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsUUFBUSxHQUFHO29CQUNWLE1BQU07b0JBQ04sTUFBTTtvQkFDTixZQUFZLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7b0JBQzNHLE1BQU0sMkNBQW1DLEVBQUUsc0NBQXNDO2lCQUNqRixDQUFDO2dCQUVGLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxRQUFRLENBQUM7b0JBQ2IsRUFBRSw0QkFBb0I7b0JBQ3RCLElBQUksRUFBRTt3QkFDTCxZQUFZLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZO3dCQUN2QyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07d0JBQ3ZCLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7cUJBQ3RDO2lCQUNELENBQUMsQ0FBQztnQkFFSCxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDdEQsT0FBTztZQUNSLENBQUM7WUFFRCxrREFBa0Q7WUFDbEQsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyx3Q0FBd0M7Z0JBQ3BGLE9BQU8sQ0FBQyxRQUFRO1lBQ2pCLENBQUM7WUFFRCxnRUFBZ0U7WUFDaEUsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ2hFLHFFQUFxRTtnQkFDckUsK0JBQStCO2dCQUMvQixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNuQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLENBQUM7WUFDRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNwRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1lBRXZELFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLFFBQVEsQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO1lBQ3BDLFFBQVEsQ0FBQyxNQUFNLDRDQUFvQyxDQUFDLENBQUMsc0NBQXNDO1lBRTNGLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osb0NBQW9DO2dCQUNwQyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ2pFLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDcEIsQ0FBQztnQkFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsaUNBQXlCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUN6RSxDQUFDO1lBRUQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFdEQsZ0NBQWdDO1lBQ2hDLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDckQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEQsQ0FBQztZQUNGLENBQUM7WUFFRCw4REFBOEQ7WUFDOUQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQztZQUMzQyxJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDaEMscUVBQXFFO2dCQUNyRSxxRUFBcUU7Z0JBQ3JFLGNBQWMsQ0FBQyxHQUFHLEVBQUU7b0JBQ25CLElBQUksUUFBUSxDQUFDLE1BQU0sMkNBQW1DLEVBQUUsQ0FBQzt3QkFDeEQsUUFBUSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUM7d0JBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO29CQUM5QyxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELGtEQUFrRDtZQUNsRCxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVPLFdBQVcsQ0FBQyxPQUE0QixFQUFFLE9BQTRCLEVBQUUsS0FBYTtZQUM1RixNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakQsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQzlCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNiLEVBQUUsK0JBQXVCO2dCQUN6QixJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDRCQUFnQixFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7YUFDcEcsQ0FBQyxDQUFDO1lBRUgsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVPLGdCQUFnQixDQUFDLEdBQWE7WUFDckMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUM7b0JBQ2IsRUFBRSwrQkFBdUIsRUFBRSxHQUFHLEVBQUU7d0JBQy9CLEVBQUUsRUFBRSxJQUFBLDRCQUFnQixFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7cUJBQ3ZEO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsS0FBYTtZQUNyQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxJQUFJLFFBQVEsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsa0NBQTBCLEVBQUUsRUFBRSxFQUFFLElBQUEsNEJBQWdCLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pHLENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYSxDQUFDLE1BQVMsRUFBRSxNQUFxQztZQUNyRSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQzNHLENBQUM7UUFFTyxXQUFXLENBQUMsTUFBUyxFQUFFLFFBQTJCLEVBQUUsTUFBcUM7WUFDaEcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0MsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLEVBQUUsTUFBTSxDQUFDO1lBQzVCLEdBQUcsQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVPLHNCQUFzQixDQUFDLE1BQVMsRUFBRSxRQUEyQixFQUFFLE1BQXFDO1lBQzNHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUzQyxvRUFBb0U7WUFDcEUsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzNELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBRUQ7Ozs7V0FJRztRQUNLLG1CQUFtQixDQUFDLFFBQTJCO1lBQ3RELElBQUksUUFBNkIsQ0FBQztZQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMzQixRQUFRLDRDQUFvQyxDQUFDO1lBQzlDLENBQUM7aUJBQU0sSUFBSSxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3BDLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRTtvQkFDMUMsQ0FBQztvQkFDRCxDQUFDLDBDQUFrQyxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxRQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7b0JBQzVDLENBQUM7b0JBQ0QsQ0FBQywwQ0FBa0MsQ0FBQztZQUN0QyxDQUFDO1lBRUQsSUFBSSxRQUFRLEtBQUssUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQyxPQUFPO1lBQ1IsQ0FBQztZQUVELFFBQVEsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDO1lBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLCtCQUF1QixFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFNUcsSUFBSSxRQUFRLDJDQUFtQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3hGLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFRDs7OztXQUlHO1FBQ0ssY0FBYyxDQUFDLFFBQTJCLEVBQUUsTUFBYztZQUNqRSxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBb0IsRUFBRSxDQUFDO1lBQzNDLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDcEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNwRixJQUFJLElBQUEsa0JBQVUsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUN6QixjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMzQixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUM7UUFDRixDQUFDO1FBRUQ7O1dBRUc7UUFDSyxlQUFlLENBQUMsUUFBMkI7WUFDbEQsSUFBSSxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQztZQUNoQyxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxlQUFPLEVBQUUsQ0FBQztnQkFDeEIsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNULE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUVELFFBQVEsQ0FBQyxNQUFNLDRDQUFvQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVyQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBYyxHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7WUFDeEQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFVLEVBQUUsRUFBRTtnQkFDakMsT0FBTyxDQUFDLEtBQUssQ0FBQyx5REFBeUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzRyxDQUFDLENBQUM7WUFFRixJQUFJLENBQW9DLENBQUM7WUFDekMsSUFBSSxDQUFDO2dCQUNKLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkYsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7WUFFRCxJQUFJLElBQUEsa0JBQVUsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNuQixDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQzdCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUVELE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQztRQUNoQyxDQUFDO1FBRU8scUJBQXFCLENBQUMsUUFBMkI7WUFDeEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsK0JBQXVCLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEgsQ0FBQztRQUVPLFVBQVUsQ0FBQyxPQUFlO1lBQ2pDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQzVELENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSwrQkFBdUIsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUU5RCxNQUFNLEtBQUssR0FBc0MsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3RCxPQUFPLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsU0FBUztnQkFDVixDQUFDO2dCQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO2dCQUV6RCxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQy9CLENBQUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUN6QyxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ2hFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVEOztXQUVHO1FBQ0ksU0FBUztZQUNmLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNoQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7S0FDRDtJQXJkRCxnREFxZEM7SUFjRCxNQUFhLHNCQUF1QixTQUFRLEtBQUs7UUFDaEQsWUFBWSxFQUFVO1lBQ3JCLEtBQUssQ0FBQyxnREFBZ0QsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO0tBQ0Q7SUFKRCx3REFJQztJQUVELE1BQWEsb0JBQXFCLFNBQVEsS0FBSztRQUM5QyxZQUFZLEVBQVU7WUFDckIsS0FBSyxDQUFDLHFCQUFxQixFQUFFLHNFQUFzRSxDQUFDLENBQUM7UUFDdEcsQ0FBQztLQUNEO0lBSkQsb0RBSUM7SUFFRCxNQUFhLHVCQUF3QixTQUFRLEtBQUs7UUFDakQsWUFBWSxFQUFVLEVBQUUsS0FBYSxFQUFFLEtBQWE7WUFDbkQsS0FBSyxDQUFDLHFCQUFxQixFQUFFLHlCQUF5QixLQUFLLGdFQUFnRSxLQUFLLElBQUksQ0FBQyxDQUFDO1FBQ3ZJLENBQUM7S0FDRDtJQUpELDBEQUlDO0lBRU0sTUFBTSxzQkFBc0IsR0FBRyxDQUEwQixHQUFvQixFQUFFLE1BQW9DLEVBQUUsU0FBbUIsRUFBd0IsRUFBRTtRQUN4SyxJQUFJLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBYSxDQUFDO1FBRWxDLE9BQU87WUFDTixrQkFBa0I7WUFDbEIsSUFBSSxJQUFJO2dCQUNQLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQztZQUNwQixDQUFDO1lBRUQsa0JBQWtCO1lBQ2xCLE9BQU8sQ0FBQyxRQUFnRSxFQUFFLE9BQWlCO2dCQUMxRixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNwQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7WUFDRixDQUFDO1lBRUQsa0JBQWtCO1lBQ2xCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztnQkFDaEIsT0FBTyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDekIsQ0FBQztZQUVELGtCQUFrQjtZQUNsQixPQUFPLENBQUMsS0FBa0I7Z0JBQ3pCLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7Z0JBQ3ZDLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLElBQUksR0FBeUIsRUFBRSxFQUFFLDhCQUFzQixFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFFekUsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDMUIsSUFBSSxDQUFDLENBQUMsSUFBSSxZQUFZLFNBQVMsQ0FBQyxFQUFFLENBQUM7d0JBQ2xDLE1BQU0sSUFBSSxvQkFBb0IsQ0FBRSxJQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM1RCxDQUFDO29CQUVELE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUM7b0JBQ2pELElBQUksY0FBYyxLQUFLLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDekMsTUFBTSxJQUFJLHVCQUF1QixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDOUUsQ0FBQztvQkFFRCxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQzVCLE1BQU0sSUFBSSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzNDLENBQUM7b0JBRUQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM3QixRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLGdDQUF3QixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3JELENBQUM7Z0JBRUQsS0FBSyxNQUFNLEVBQUUsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztvQkFDbEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLHFDQUE2QixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3hELENBQUM7Z0JBRUQsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVyQixtRUFBbUU7Z0JBQ25FLDJCQUEyQjtnQkFDM0IsTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUNwQixDQUFDO1lBR0Qsa0JBQWtCO1lBQ2xCLEdBQUcsQ0FBQyxJQUFPO2dCQUNWLElBQUksQ0FBQyxDQUFDLElBQUksWUFBWSxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUNsQyxNQUFNLElBQUksb0JBQW9CLENBQUUsSUFBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztnQkFFRCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzFCLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsZ0NBQXdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN0RCxDQUFDO1lBRUQsa0JBQWtCO1lBQ2xCLE1BQU0sQ0FBQyxFQUFVO2dCQUNoQixJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDdkIsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxxQ0FBNkIsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO1lBQ0YsQ0FBQztZQUVELGtCQUFrQjtZQUNsQixHQUFHLENBQUMsTUFBYztnQkFDakIsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFFRCxtQ0FBbUM7WUFDbkMsTUFBTTtnQkFDTCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDcEMsQ0FBQztTQUNELENBQUM7SUFDSCxDQUFDLENBQUM7SUFyRlcsUUFBQSxzQkFBc0IsMEJBcUZqQyJ9