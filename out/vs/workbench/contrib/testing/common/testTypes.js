/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/workbench/contrib/testing/common/testId"], function (require, exports, uri_1, position_1, range_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractIncrementalTestCollection = exports.TestsDiffOp = exports.TestDiffOpType = exports.IStatementCoverage = exports.IDeclarationCoverage = exports.IBranchCoverage = exports.CoverageDetails = exports.DetailType = exports.KEEP_N_LAST_COVERAGE_REPORTS = exports.IFileCoverage = exports.ICoverageCount = exports.TestResultItem = exports.applyTestItemUpdate = exports.ITestItemUpdate = exports.InternalTestItem = exports.TestItemExpandState = exports.ITestItem = exports.denamespaceTestTag = exports.namespaceTestTag = exports.ITestTaskState = exports.ITestMessage = exports.ITestOutputMessage = exports.getMarkId = exports.ITestErrorMessage = exports.TestMessageType = exports.IRichLocation = exports.isStartControllerTests = exports.testRunProfileBitsetList = exports.TestRunProfileBitset = exports.ExtTestRunProfileKind = exports.testResultStateToContextValues = exports.TestResultState = void 0;
    var TestResultState;
    (function (TestResultState) {
        TestResultState[TestResultState["Unset"] = 0] = "Unset";
        TestResultState[TestResultState["Queued"] = 1] = "Queued";
        TestResultState[TestResultState["Running"] = 2] = "Running";
        TestResultState[TestResultState["Passed"] = 3] = "Passed";
        TestResultState[TestResultState["Failed"] = 4] = "Failed";
        TestResultState[TestResultState["Skipped"] = 5] = "Skipped";
        TestResultState[TestResultState["Errored"] = 6] = "Errored";
    })(TestResultState || (exports.TestResultState = TestResultState = {}));
    exports.testResultStateToContextValues = {
        [0 /* TestResultState.Unset */]: 'unset',
        [1 /* TestResultState.Queued */]: 'queued',
        [2 /* TestResultState.Running */]: 'running',
        [3 /* TestResultState.Passed */]: 'passed',
        [4 /* TestResultState.Failed */]: 'failed',
        [5 /* TestResultState.Skipped */]: 'skipped',
        [6 /* TestResultState.Errored */]: 'errored',
    };
    /** note: keep in sync with TestRunProfileKind in vscode.d.ts */
    var ExtTestRunProfileKind;
    (function (ExtTestRunProfileKind) {
        ExtTestRunProfileKind[ExtTestRunProfileKind["Run"] = 1] = "Run";
        ExtTestRunProfileKind[ExtTestRunProfileKind["Debug"] = 2] = "Debug";
        ExtTestRunProfileKind[ExtTestRunProfileKind["Coverage"] = 3] = "Coverage";
    })(ExtTestRunProfileKind || (exports.ExtTestRunProfileKind = ExtTestRunProfileKind = {}));
    var TestRunProfileBitset;
    (function (TestRunProfileBitset) {
        TestRunProfileBitset[TestRunProfileBitset["Run"] = 2] = "Run";
        TestRunProfileBitset[TestRunProfileBitset["Debug"] = 4] = "Debug";
        TestRunProfileBitset[TestRunProfileBitset["Coverage"] = 8] = "Coverage";
        TestRunProfileBitset[TestRunProfileBitset["HasNonDefaultProfile"] = 16] = "HasNonDefaultProfile";
        TestRunProfileBitset[TestRunProfileBitset["HasConfigurable"] = 32] = "HasConfigurable";
        TestRunProfileBitset[TestRunProfileBitset["SupportsContinuousRun"] = 64] = "SupportsContinuousRun";
    })(TestRunProfileBitset || (exports.TestRunProfileBitset = TestRunProfileBitset = {}));
    /**
     * List of all test run profile bitset values.
     */
    exports.testRunProfileBitsetList = [
        2 /* TestRunProfileBitset.Run */,
        4 /* TestRunProfileBitset.Debug */,
        8 /* TestRunProfileBitset.Coverage */,
        16 /* TestRunProfileBitset.HasNonDefaultProfile */,
        32 /* TestRunProfileBitset.HasConfigurable */,
        64 /* TestRunProfileBitset.SupportsContinuousRun */,
    ];
    const isStartControllerTests = (t) => 'runId' in t;
    exports.isStartControllerTests = isStartControllerTests;
    var IRichLocation;
    (function (IRichLocation) {
        IRichLocation.serialize = (location) => ({
            range: location.range.toJSON(),
            uri: location.uri.toJSON(),
        });
        IRichLocation.deserialize = (uriIdentity, location) => ({
            range: range_1.Range.lift(location.range),
            uri: uriIdentity.asCanonicalUri(uri_1.URI.revive(location.uri)),
        });
    })(IRichLocation || (exports.IRichLocation = IRichLocation = {}));
    var TestMessageType;
    (function (TestMessageType) {
        TestMessageType[TestMessageType["Error"] = 0] = "Error";
        TestMessageType[TestMessageType["Output"] = 1] = "Output";
    })(TestMessageType || (exports.TestMessageType = TestMessageType = {}));
    var ITestErrorMessage;
    (function (ITestErrorMessage) {
        ITestErrorMessage.serialize = (message) => ({
            message: message.message,
            type: 0 /* TestMessageType.Error */,
            expected: message.expected,
            actual: message.actual,
            contextValue: message.contextValue,
            location: message.location && IRichLocation.serialize(message.location),
        });
        ITestErrorMessage.deserialize = (uriIdentity, message) => ({
            message: message.message,
            type: 0 /* TestMessageType.Error */,
            expected: message.expected,
            actual: message.actual,
            contextValue: message.contextValue,
            location: message.location && IRichLocation.deserialize(uriIdentity, message.location),
        });
    })(ITestErrorMessage || (exports.ITestErrorMessage = ITestErrorMessage = {}));
    /**
     * Gets the TTY marker ID for either starting or ending
     * an ITestOutputMessage.marker of the given ID.
     */
    const getMarkId = (marker, start) => `${start ? 's' : 'e'}${marker}`;
    exports.getMarkId = getMarkId;
    var ITestOutputMessage;
    (function (ITestOutputMessage) {
        ITestOutputMessage.serialize = (message) => ({
            message: message.message,
            type: 1 /* TestMessageType.Output */,
            offset: message.offset,
            length: message.length,
            location: message.location && IRichLocation.serialize(message.location),
        });
        ITestOutputMessage.deserialize = (uriIdentity, message) => ({
            message: message.message,
            type: 1 /* TestMessageType.Output */,
            offset: message.offset,
            length: message.length,
            location: message.location && IRichLocation.deserialize(uriIdentity, message.location),
        });
    })(ITestOutputMessage || (exports.ITestOutputMessage = ITestOutputMessage = {}));
    var ITestMessage;
    (function (ITestMessage) {
        ITestMessage.serialize = (message) => message.type === 0 /* TestMessageType.Error */ ? ITestErrorMessage.serialize(message) : ITestOutputMessage.serialize(message);
        ITestMessage.deserialize = (uriIdentity, message) => message.type === 0 /* TestMessageType.Error */ ? ITestErrorMessage.deserialize(uriIdentity, message) : ITestOutputMessage.deserialize(uriIdentity, message);
    })(ITestMessage || (exports.ITestMessage = ITestMessage = {}));
    var ITestTaskState;
    (function (ITestTaskState) {
        ITestTaskState.serializeWithoutMessages = (state) => ({
            state: state.state,
            duration: state.duration,
            messages: [],
        });
        ITestTaskState.serialize = (state) => ({
            state: state.state,
            duration: state.duration,
            messages: state.messages.map(ITestMessage.serialize),
        });
        ITestTaskState.deserialize = (uriIdentity, state) => ({
            state: state.state,
            duration: state.duration,
            messages: state.messages.map(m => ITestMessage.deserialize(uriIdentity, m)),
        });
    })(ITestTaskState || (exports.ITestTaskState = ITestTaskState = {}));
    const testTagDelimiter = '\0';
    const namespaceTestTag = (ctrlId, tagId) => ctrlId + testTagDelimiter + tagId;
    exports.namespaceTestTag = namespaceTestTag;
    const denamespaceTestTag = (namespaced) => {
        const index = namespaced.indexOf(testTagDelimiter);
        return { ctrlId: namespaced.slice(0, index), tagId: namespaced.slice(index + 1) };
    };
    exports.denamespaceTestTag = denamespaceTestTag;
    var ITestItem;
    (function (ITestItem) {
        ITestItem.serialize = (item) => ({
            extId: item.extId,
            label: item.label,
            tags: item.tags,
            busy: item.busy,
            children: undefined,
            uri: item.uri?.toJSON(),
            range: item.range?.toJSON() || null,
            description: item.description,
            error: item.error,
            sortText: item.sortText
        });
        ITestItem.deserialize = (uriIdentity, serialized) => ({
            extId: serialized.extId,
            label: serialized.label,
            tags: serialized.tags,
            busy: serialized.busy,
            children: undefined,
            uri: serialized.uri ? uriIdentity.asCanonicalUri(uri_1.URI.revive(serialized.uri)) : undefined,
            range: serialized.range ? range_1.Range.lift(serialized.range) : null,
            description: serialized.description,
            error: serialized.error,
            sortText: serialized.sortText
        });
    })(ITestItem || (exports.ITestItem = ITestItem = {}));
    var TestItemExpandState;
    (function (TestItemExpandState) {
        TestItemExpandState[TestItemExpandState["NotExpandable"] = 0] = "NotExpandable";
        TestItemExpandState[TestItemExpandState["Expandable"] = 1] = "Expandable";
        TestItemExpandState[TestItemExpandState["BusyExpanding"] = 2] = "BusyExpanding";
        TestItemExpandState[TestItemExpandState["Expanded"] = 3] = "Expanded";
    })(TestItemExpandState || (exports.TestItemExpandState = TestItemExpandState = {}));
    var InternalTestItem;
    (function (InternalTestItem) {
        InternalTestItem.serialize = (item) => ({
            expand: item.expand,
            item: ITestItem.serialize(item.item)
        });
        InternalTestItem.deserialize = (uriIdentity, serialized) => ({
            // the `controllerId` is derived from the test.item.extId. It's redundant
            // in the non-serialized InternalTestItem too, but there just because it's
            // checked against in many hot paths.
            controllerId: testId_1.TestId.root(serialized.item.extId),
            expand: serialized.expand,
            item: ITestItem.deserialize(uriIdentity, serialized.item)
        });
    })(InternalTestItem || (exports.InternalTestItem = InternalTestItem = {}));
    var ITestItemUpdate;
    (function (ITestItemUpdate) {
        ITestItemUpdate.serialize = (u) => {
            let item;
            if (u.item) {
                item = {};
                if (u.item.label !== undefined) {
                    item.label = u.item.label;
                }
                if (u.item.tags !== undefined) {
                    item.tags = u.item.tags;
                }
                if (u.item.busy !== undefined) {
                    item.busy = u.item.busy;
                }
                if (u.item.uri !== undefined) {
                    item.uri = u.item.uri?.toJSON();
                }
                if (u.item.range !== undefined) {
                    item.range = u.item.range?.toJSON();
                }
                if (u.item.description !== undefined) {
                    item.description = u.item.description;
                }
                if (u.item.error !== undefined) {
                    item.error = u.item.error;
                }
                if (u.item.sortText !== undefined) {
                    item.sortText = u.item.sortText;
                }
            }
            return { extId: u.extId, expand: u.expand, item };
        };
        ITestItemUpdate.deserialize = (u) => {
            let item;
            if (u.item) {
                item = {};
                if (u.item.label !== undefined) {
                    item.label = u.item.label;
                }
                if (u.item.tags !== undefined) {
                    item.tags = u.item.tags;
                }
                if (u.item.busy !== undefined) {
                    item.busy = u.item.busy;
                }
                if (u.item.range !== undefined) {
                    item.range = u.item.range ? range_1.Range.lift(u.item.range) : null;
                }
                if (u.item.description !== undefined) {
                    item.description = u.item.description;
                }
                if (u.item.error !== undefined) {
                    item.error = u.item.error;
                }
                if (u.item.sortText !== undefined) {
                    item.sortText = u.item.sortText;
                }
            }
            return { extId: u.extId, expand: u.expand, item };
        };
    })(ITestItemUpdate || (exports.ITestItemUpdate = ITestItemUpdate = {}));
    const applyTestItemUpdate = (internal, patch) => {
        if (patch.expand !== undefined) {
            internal.expand = patch.expand;
        }
        if (patch.item !== undefined) {
            internal.item = internal.item ? Object.assign(internal.item, patch.item) : patch.item;
        }
    };
    exports.applyTestItemUpdate = applyTestItemUpdate;
    var TestResultItem;
    (function (TestResultItem) {
        TestResultItem.serializeWithoutMessages = (original) => ({
            ...InternalTestItem.serialize(original),
            ownComputedState: original.ownComputedState,
            computedState: original.computedState,
            tasks: original.tasks.map(ITestTaskState.serializeWithoutMessages),
        });
        TestResultItem.serialize = (original) => ({
            ...InternalTestItem.serialize(original),
            ownComputedState: original.ownComputedState,
            computedState: original.computedState,
            tasks: original.tasks.map(ITestTaskState.serialize),
        });
        TestResultItem.deserialize = (uriIdentity, serialized) => ({
            ...InternalTestItem.deserialize(uriIdentity, serialized),
            ownComputedState: serialized.ownComputedState,
            computedState: serialized.computedState,
            tasks: serialized.tasks.map(m => ITestTaskState.deserialize(uriIdentity, m)),
            retired: true,
        });
    })(TestResultItem || (exports.TestResultItem = TestResultItem = {}));
    var ICoverageCount;
    (function (ICoverageCount) {
        ICoverageCount.empty = () => ({ covered: 0, total: 0 });
        ICoverageCount.sum = (target, src) => {
            target.covered += src.covered;
            target.total += src.total;
        };
    })(ICoverageCount || (exports.ICoverageCount = ICoverageCount = {}));
    var IFileCoverage;
    (function (IFileCoverage) {
        IFileCoverage.serialize = (original) => ({
            id: original.id,
            statement: original.statement,
            branch: original.branch,
            declaration: original.declaration,
            uri: original.uri.toJSON(),
        });
        IFileCoverage.deserialize = (uriIdentity, serialized) => ({
            id: serialized.id,
            statement: serialized.statement,
            branch: serialized.branch,
            declaration: serialized.declaration,
            uri: uriIdentity.asCanonicalUri(uri_1.URI.revive(serialized.uri)),
        });
    })(IFileCoverage || (exports.IFileCoverage = IFileCoverage = {}));
    function serializeThingWithLocation(serialized) {
        return {
            ...serialized,
            location: serialized.location?.toJSON(),
        };
    }
    function deserializeThingWithLocation(serialized) {
        serialized.location = serialized.location ? (position_1.Position.isIPosition(serialized.location) ? position_1.Position.lift(serialized.location) : range_1.Range.lift(serialized.location)) : undefined;
        return serialized;
    }
    /** Number of recent runs in which coverage reports should be retained. */
    exports.KEEP_N_LAST_COVERAGE_REPORTS = 3;
    var DetailType;
    (function (DetailType) {
        DetailType[DetailType["Declaration"] = 0] = "Declaration";
        DetailType[DetailType["Statement"] = 1] = "Statement";
        DetailType[DetailType["Branch"] = 2] = "Branch";
    })(DetailType || (exports.DetailType = DetailType = {}));
    var CoverageDetails;
    (function (CoverageDetails) {
        CoverageDetails.serialize = (original) => original.type === 0 /* DetailType.Declaration */ ? IDeclarationCoverage.serialize(original) : IStatementCoverage.serialize(original);
        CoverageDetails.deserialize = (serialized) => serialized.type === 0 /* DetailType.Declaration */ ? IDeclarationCoverage.deserialize(serialized) : IStatementCoverage.deserialize(serialized);
    })(CoverageDetails || (exports.CoverageDetails = CoverageDetails = {}));
    var IBranchCoverage;
    (function (IBranchCoverage) {
        IBranchCoverage.serialize = serializeThingWithLocation;
        IBranchCoverage.deserialize = deserializeThingWithLocation;
    })(IBranchCoverage || (exports.IBranchCoverage = IBranchCoverage = {}));
    var IDeclarationCoverage;
    (function (IDeclarationCoverage) {
        IDeclarationCoverage.serialize = serializeThingWithLocation;
        IDeclarationCoverage.deserialize = deserializeThingWithLocation;
    })(IDeclarationCoverage || (exports.IDeclarationCoverage = IDeclarationCoverage = {}));
    var IStatementCoverage;
    (function (IStatementCoverage) {
        IStatementCoverage.serialize = (original) => ({
            ...serializeThingWithLocation(original),
            branches: original.branches?.map(IBranchCoverage.serialize),
        });
        IStatementCoverage.deserialize = (serialized) => ({
            ...deserializeThingWithLocation(serialized),
            branches: serialized.branches?.map(IBranchCoverage.deserialize),
        });
    })(IStatementCoverage || (exports.IStatementCoverage = IStatementCoverage = {}));
    var TestDiffOpType;
    (function (TestDiffOpType) {
        /** Adds a new test (with children) */
        TestDiffOpType[TestDiffOpType["Add"] = 0] = "Add";
        /** Shallow-updates an existing test */
        TestDiffOpType[TestDiffOpType["Update"] = 1] = "Update";
        /** Ranges of some tests in a document were synced, so it should be considered up-to-date */
        TestDiffOpType[TestDiffOpType["DocumentSynced"] = 2] = "DocumentSynced";
        /** Removes a test (and all its children) */
        TestDiffOpType[TestDiffOpType["Remove"] = 3] = "Remove";
        /** Changes the number of controllers who are yet to publish their collection roots. */
        TestDiffOpType[TestDiffOpType["IncrementPendingExtHosts"] = 4] = "IncrementPendingExtHosts";
        /** Retires a test/result */
        TestDiffOpType[TestDiffOpType["Retire"] = 5] = "Retire";
        /** Add a new test tag */
        TestDiffOpType[TestDiffOpType["AddTag"] = 6] = "AddTag";
        /** Remove a test tag */
        TestDiffOpType[TestDiffOpType["RemoveTag"] = 7] = "RemoveTag";
    })(TestDiffOpType || (exports.TestDiffOpType = TestDiffOpType = {}));
    var TestsDiffOp;
    (function (TestsDiffOp) {
        TestsDiffOp.deserialize = (uriIdentity, u) => {
            if (u.op === 0 /* TestDiffOpType.Add */) {
                return { op: u.op, item: InternalTestItem.deserialize(uriIdentity, u.item) };
            }
            else if (u.op === 1 /* TestDiffOpType.Update */) {
                return { op: u.op, item: ITestItemUpdate.deserialize(u.item) };
            }
            else if (u.op === 2 /* TestDiffOpType.DocumentSynced */) {
                return { op: u.op, uri: uriIdentity.asCanonicalUri(uri_1.URI.revive(u.uri)), docv: u.docv };
            }
            else {
                return u;
            }
        };
        TestsDiffOp.serialize = (u) => {
            if (u.op === 0 /* TestDiffOpType.Add */) {
                return { op: u.op, item: InternalTestItem.serialize(u.item) };
            }
            else if (u.op === 1 /* TestDiffOpType.Update */) {
                return { op: u.op, item: ITestItemUpdate.serialize(u.item) };
            }
            else {
                return u;
            }
        };
    })(TestsDiffOp || (exports.TestsDiffOp = TestsDiffOp = {}));
    /**
     * Maintains tests in this extension host sent from the main thread.
     */
    class AbstractIncrementalTestCollection {
        constructor(uriIdentity) {
            this.uriIdentity = uriIdentity;
            this._tags = new Map();
            /**
             * Map of item IDs to test item objects.
             */
            this.items = new Map();
            /**
             * ID of test root items.
             */
            this.roots = new Set();
            /**
             * Number of 'busy' controllers.
             */
            this.busyControllerCount = 0;
            /**
             * Number of pending roots.
             */
            this.pendingRootCount = 0;
            /**
             * Known test tags.
             */
            this.tags = this._tags;
        }
        /**
         * Applies the diff to the collection.
         */
        apply(diff) {
            const changes = this.createChangeCollector();
            for (const op of diff) {
                switch (op.op) {
                    case 0 /* TestDiffOpType.Add */:
                        this.add(InternalTestItem.deserialize(this.uriIdentity, op.item), changes);
                        break;
                    case 1 /* TestDiffOpType.Update */:
                        this.update(ITestItemUpdate.deserialize(op.item), changes);
                        break;
                    case 3 /* TestDiffOpType.Remove */:
                        this.remove(op.itemId, changes);
                        break;
                    case 5 /* TestDiffOpType.Retire */:
                        this.retireTest(op.itemId);
                        break;
                    case 4 /* TestDiffOpType.IncrementPendingExtHosts */:
                        this.updatePendingRoots(op.amount);
                        break;
                    case 6 /* TestDiffOpType.AddTag */:
                        this._tags.set(op.tag.id, op.tag);
                        break;
                    case 7 /* TestDiffOpType.RemoveTag */:
                        this._tags.delete(op.id);
                        break;
                }
            }
            changes.complete?.();
        }
        add(item, changes) {
            const parentId = testId_1.TestId.parentId(item.item.extId)?.toString();
            let created;
            if (!parentId) {
                created = this.createItem(item);
                this.roots.add(created);
                this.items.set(item.item.extId, created);
            }
            else if (this.items.has(parentId)) {
                const parent = this.items.get(parentId);
                parent.children.add(item.item.extId);
                created = this.createItem(item, parent);
                this.items.set(item.item.extId, created);
            }
            else {
                console.error(`Test with unknown parent ID: ${JSON.stringify(item)}`);
                return;
            }
            changes.add?.(created);
            if (item.expand === 2 /* TestItemExpandState.BusyExpanding */) {
                this.busyControllerCount++;
            }
            return created;
        }
        update(patch, changes) {
            const existing = this.items.get(patch.extId);
            if (!existing) {
                return;
            }
            if (patch.expand !== undefined) {
                if (existing.expand === 2 /* TestItemExpandState.BusyExpanding */) {
                    this.busyControllerCount--;
                }
                if (patch.expand === 2 /* TestItemExpandState.BusyExpanding */) {
                    this.busyControllerCount++;
                }
            }
            (0, exports.applyTestItemUpdate)(existing, patch);
            changes.update?.(existing);
            return existing;
        }
        remove(itemId, changes) {
            const toRemove = this.items.get(itemId);
            if (!toRemove) {
                return;
            }
            const parentId = testId_1.TestId.parentId(toRemove.item.extId)?.toString();
            if (parentId) {
                const parent = this.items.get(parentId);
                parent.children.delete(toRemove.item.extId);
            }
            else {
                this.roots.delete(toRemove);
            }
            const queue = [[itemId]];
            while (queue.length) {
                for (const itemId of queue.pop()) {
                    const existing = this.items.get(itemId);
                    if (existing) {
                        queue.push(existing.children);
                        this.items.delete(itemId);
                        changes.remove?.(existing, existing !== toRemove);
                        if (existing.expand === 2 /* TestItemExpandState.BusyExpanding */) {
                            this.busyControllerCount--;
                        }
                    }
                }
            }
        }
        /**
         * Called when the extension signals a test result should be retired.
         */
        retireTest(testId) {
            // no-op
        }
        /**
         * Updates the number of test root sources who are yet to report. When
         * the total pending test roots reaches 0, the roots for all controllers
         * will exist in the collection.
         */
        updatePendingRoots(delta) {
            this.pendingRootCount += delta;
        }
        /**
         * Called before a diff is applied to create a new change collector.
         */
        createChangeCollector() {
            return {};
        }
    }
    exports.AbstractIncrementalTestCollection = AbstractIncrementalTestCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFR5cGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdFR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxJQUFrQixlQVFqQjtJQVJELFdBQWtCLGVBQWU7UUFDaEMsdURBQVMsQ0FBQTtRQUNULHlEQUFVLENBQUE7UUFDViwyREFBVyxDQUFBO1FBQ1gseURBQVUsQ0FBQTtRQUNWLHlEQUFVLENBQUE7UUFDViwyREFBVyxDQUFBO1FBQ1gsMkRBQVcsQ0FBQTtJQUNaLENBQUMsRUFSaUIsZUFBZSwrQkFBZixlQUFlLFFBUWhDO0lBRVksUUFBQSw4QkFBOEIsR0FBdUM7UUFDakYsK0JBQXVCLEVBQUUsT0FBTztRQUNoQyxnQ0FBd0IsRUFBRSxRQUFRO1FBQ2xDLGlDQUF5QixFQUFFLFNBQVM7UUFDcEMsZ0NBQXdCLEVBQUUsUUFBUTtRQUNsQyxnQ0FBd0IsRUFBRSxRQUFRO1FBQ2xDLGlDQUF5QixFQUFFLFNBQVM7UUFDcEMsaUNBQXlCLEVBQUUsU0FBUztLQUNwQyxDQUFDO0lBRUYsZ0VBQWdFO0lBQ2hFLElBQWtCLHFCQUlqQjtJQUpELFdBQWtCLHFCQUFxQjtRQUN0QywrREFBTyxDQUFBO1FBQ1AsbUVBQVMsQ0FBQTtRQUNULHlFQUFZLENBQUE7SUFDYixDQUFDLEVBSmlCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBSXRDO0lBRUQsSUFBa0Isb0JBT2pCO0lBUEQsV0FBa0Isb0JBQW9CO1FBQ3JDLDZEQUFZLENBQUE7UUFDWixpRUFBYyxDQUFBO1FBQ2QsdUVBQWlCLENBQUE7UUFDakIsZ0dBQTZCLENBQUE7UUFDN0Isc0ZBQXdCLENBQUE7UUFDeEIsa0dBQThCLENBQUE7SUFDL0IsQ0FBQyxFQVBpQixvQkFBb0Is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