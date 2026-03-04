/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/workbench/contrib/testing/common/testingStates"], function (require, exports, iterator_1, testingStates_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.refreshComputedState = void 0;
    const isDurationAccessor = (accessor) => 'getOwnDuration' in accessor;
    /**
     * Gets the computed state for the node.
     * @param force whether to refresh the computed state for this node, even
     * if it was previously set.
     */
    const getComputedState = (accessor, node, force = false) => {
        let computed = accessor.getCurrentComputedState(node);
        if (computed === undefined || force) {
            computed = accessor.getOwnState(node) ?? 0 /* TestResultState.Unset */;
            let childrenCount = 0;
            const stateMap = (0, testingStates_1.makeEmptyCounts)();
            for (const child of accessor.getChildren(node)) {
                const childComputed = getComputedState(accessor, child);
                childrenCount++;
                stateMap[childComputed]++;
                // If all children are skipped, make the current state skipped too if unset (#131537)
                computed = childComputed === 5 /* TestResultState.Skipped */ && computed === 0 /* TestResultState.Unset */
                    ? 5 /* TestResultState.Skipped */ : (0, testingStates_1.maxPriority)(computed, childComputed);
            }
            if (childrenCount > LARGE_NODE_THRESHOLD) {
                largeNodeChildrenStates.set(node, stateMap);
            }
            accessor.setComputedState(node, computed);
        }
        return computed;
    };
    const getComputedDuration = (accessor, node, force = false) => {
        let computed = accessor.getCurrentComputedDuration(node);
        if (computed === undefined || force) {
            const own = accessor.getOwnDuration(node);
            if (own !== undefined) {
                computed = own;
            }
            else {
                computed = undefined;
                for (const child of accessor.getChildren(node)) {
                    const d = getComputedDuration(accessor, child);
                    if (d !== undefined) {
                        computed = (computed || 0) + d;
                    }
                }
            }
            accessor.setComputedDuration(node, computed);
        }
        return computed;
    };
    const LARGE_NODE_THRESHOLD = 64;
    /**
     * Map of how many nodes have in each state. This is used to optimize state
     * computation in large nodes with children above the `LARGE_NODE_THRESHOLD`.
     */
    const largeNodeChildrenStates = new WeakMap();
    /**
     * Refreshes the computed state for the node and its parents. Any changes
     * elements cause `addUpdated` to be called.
     */
    const refreshComputedState = (accessor, node, explicitNewComputedState, refreshDuration = true) => {
        const oldState = accessor.getCurrentComputedState(node);
        const oldPriority = testingStates_1.statePriority[oldState];
        const newState = explicitNewComputedState ?? getComputedState(accessor, node, true);
        const newPriority = testingStates_1.statePriority[newState];
        const toUpdate = new Set();
        if (newPriority !== oldPriority) {
            accessor.setComputedState(node, newState);
            toUpdate.add(node);
            let moveFromState = oldState;
            let moveToState = newState;
            for (const parent of accessor.getParents(node)) {
                const lnm = largeNodeChildrenStates.get(parent);
                if (lnm) {
                    lnm[moveFromState]--;
                    lnm[moveToState]++;
                }
                const prev = accessor.getCurrentComputedState(parent);
                if (newPriority > oldPriority) {
                    // Update all parents to ensure they're at least this priority.
                    if (prev !== undefined && testingStates_1.statePriority[prev] >= newPriority) {
                        break;
                    }
                    if (lnm && lnm[moveToState] > 1) {
                        break;
                    }
                    // moveToState remains the same, the new higher priority node state
                    accessor.setComputedState(parent, newState);
                    toUpdate.add(parent);
                }
                else /* newProirity < oldPriority */ {
                    // Update all parts whose statese might have been based on this one
                    if (prev === undefined || testingStates_1.statePriority[prev] > oldPriority) {
                        break;
                    }
                    if (lnm && lnm[moveFromState] > 0) {
                        break;
                    }
                    moveToState = getComputedState(accessor, parent, true);
                    accessor.setComputedState(parent, moveToState);
                    toUpdate.add(parent);
                }
                moveFromState = prev;
            }
        }
        if (isDurationAccessor(accessor) && refreshDuration) {
            for (const parent of iterator_1.Iterable.concat(iterator_1.Iterable.single(node), accessor.getParents(node))) {
                const oldDuration = accessor.getCurrentComputedDuration(parent);
                const newDuration = getComputedDuration(accessor, parent, true);
                if (oldDuration === newDuration) {
                    break;
                }
                accessor.setComputedDuration(parent, newDuration);
                toUpdate.add(parent);
            }
        }
        return toUpdate;
    };
    exports.refreshComputedState = refreshComputedState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0Q29tcHV0ZWRTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL2dldENvbXB1dGVkU3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUJoRyxNQUFNLGtCQUFrQixHQUFHLENBQUksUUFBbUMsRUFBb0QsRUFBRSxDQUFDLGdCQUFnQixJQUFJLFFBQVEsQ0FBQztJQUV0Sjs7OztPQUlHO0lBRUgsTUFBTSxnQkFBZ0IsR0FBRyxDQUFtQixRQUFtQyxFQUFFLElBQU8sRUFBRSxLQUFLLEdBQUcsS0FBSyxFQUFFLEVBQUU7UUFDMUcsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RELElBQUksUUFBUSxLQUFLLFNBQVMsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNyQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUNBQXlCLENBQUM7WUFFL0QsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sUUFBUSxHQUFHLElBQUEsK0JBQWUsR0FBRSxDQUFDO1lBRW5DLEtBQUssTUFBTSxLQUFLLElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3hELGFBQWEsRUFBRSxDQUFDO2dCQUNoQixRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFFMUIscUZBQXFGO2dCQUNyRixRQUFRLEdBQUcsYUFBYSxvQ0FBNEIsSUFBSSxRQUFRLGtDQUEwQjtvQkFDekYsQ0FBQyxpQ0FBeUIsQ0FBQyxDQUFDLElB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