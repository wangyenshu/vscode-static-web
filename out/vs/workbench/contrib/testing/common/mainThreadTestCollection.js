/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/map", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, iterator_1, map_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTestCollection = void 0;
    class MainThreadTestCollection extends testTypes_1.AbstractIncrementalTestCollection {
        /**
         * @inheritdoc
         */
        get busyProviders() {
            return this.busyControllerCount;
        }
        /**
         * @inheritdoc
         */
        get rootItems() {
            return this.roots;
        }
        /**
         * @inheritdoc
         */
        get all() {
            return this.getIterator();
        }
        get rootIds() {
            return iterator_1.Iterable.map(this.roots.values(), r => r.item.extId);
        }
        constructor(uriIdentityService, expandActual) {
            super(uriIdentityService);
            this.expandActual = expandActual;
            this.testsByUrl = new map_1.ResourceMap();
            this.busyProvidersChangeEmitter = new event_1.Emitter();
            this.expandPromises = new WeakMap();
            this.onBusyProvidersChange = this.busyProvidersChangeEmitter.event;
            this.changeCollector = {
                add: node => {
                    if (!node.item.uri) {
                        return;
                    }
                    const s = this.testsByUrl.get(node.item.uri);
                    if (!s) {
                        this.testsByUrl.set(node.item.uri, new Set([node]));
                    }
                    else {
                        s.add(node);
                    }
                },
                remove: node => {
                    if (!node.item.uri) {
                        return;
                    }
                    const s = this.testsByUrl.get(node.item.uri);
                    if (!s) {
                        return;
                    }
                    s.delete(node);
                    if (s.size === 0) {
                        this.testsByUrl.delete(node.item.uri);
                    }
                },
            };
        }
        /**
         * @inheritdoc
         */
        expand(testId, levels) {
            const test = this.items.get(testId);
            if (!test) {
                return Promise.resolve();
            }
            // simple cache to avoid duplicate/unnecessary expansion calls
            const existing = this.expandPromises.get(test);
            if (existing && existing.pendingLvl >= levels) {
                return existing.prom;
            }
            const prom = this.expandActual(test.item.extId, levels);
            const record = { doneLvl: existing ? existing.doneLvl : -1, pendingLvl: levels, prom };
            this.expandPromises.set(test, record);
            return prom.then(() => {
                record.doneLvl = levels;
            });
        }
        /**
         * @inheritdoc
         */
        getNodeById(id) {
            return this.items.get(id);
        }
        /**
         * @inheritdoc
         */
        getNodeByUrl(uri) {
            return this.testsByUrl.get(uri) || iterator_1.Iterable.empty();
        }
        /**
         * @inheritdoc
         */
        getReviverDiff() {
            const ops = [{ op: 4 /* TestDiffOpType.IncrementPendingExtHosts */, amount: this.pendingRootCount }];
            const queue = [this.rootIds];
            while (queue.length) {
                for (const child of queue.pop()) {
                    const item = this.items.get(child);
                    ops.push({
                        op: 0 /* TestDiffOpType.Add */,
                        item: {
                            controllerId: item.controllerId,
                            expand: item.expand,
                            item: item.item,
                        }
                    });
                    queue.push(item.children);
                }
            }
            return ops;
        }
        /**
         * Applies the diff to the collection.
         */
        apply(diff) {
            const prevBusy = this.busyControllerCount;
            super.apply(diff);
            if (prevBusy !== this.busyControllerCount) {
                this.busyProvidersChangeEmitter.fire(this.busyControllerCount);
            }
        }
        /**
         * Clears everything from the collection, and returns a diff that applies
         * that action.
         */
        clear() {
            const ops = [];
            for (const root of this.roots) {
                ops.push({ op: 3 /* TestDiffOpType.Remove */, itemId: root.item.extId });
            }
            this.roots.clear();
            this.items.clear();
            return ops;
        }
        /**
         * @override
         */
        createItem(internal) {
            return { ...internal, children: new Set() };
        }
        createChangeCollector() {
            return this.changeCollector;
        }
        *getIterator() {
            const queue = [this.rootIds];
            while (queue.length) {
                for (const id of queue.pop()) {
                    const node = this.getNodeById(id);
                    yield node;
                    queue.push(node.children);
                }
            }
        }
    }
    exports.MainThreadTestCollection = MainThreadTestCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRlc3RDb2xsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vbWFpblRocmVhZFRlc3RDb2xsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLHdCQUF5QixTQUFRLDZDQUFnRTtRQVU3Rzs7V0FFRztRQUNILElBQVcsYUFBYTtZQUN2QixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNqQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFXLFNBQVM7WUFDbkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFRDs7V0FFRztRQUNILElBQVcsR0FBRztZQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxJQUFXLE9BQU87WUFDakIsT0FBTyxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBSUQsWUFBWSxrQkFBeUMsRUFBbUIsWUFBMkQ7WUFDbEksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFENkMsaUJBQVksR0FBWixZQUFZLENBQStDO1lBcEMzSCxlQUFVLEdBQUcsSUFBSSxpQkFBVyxFQUFzQyxDQUFDO1lBRW5FLCtCQUEwQixHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7WUFDbkQsbUJBQWMsR0FBRyxJQUFJLE9BQU8sRUFJaEMsQ0FBQztZQTJCVywwQkFBcUIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBd0c3RCxvQkFB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