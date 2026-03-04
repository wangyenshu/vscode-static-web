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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/platform", "vs/nls", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/testing/common/getComputedState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, async_1, buffer_1, event_1, lazy_1, lifecycle_1, observable_1, platform_1, nls_1, telemetry_1, getComputedState_1, testId_1, testingStates_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HydratedTestResult = exports.LiveTestResult = exports.TestResultItemChangeReason = exports.maxCountPriority = exports.resultItemParents = exports.TaskRawOutput = void 0;
    const emptyRawOutput = {
        buffers: [],
        length: 0,
        onDidWriteData: event_1.Event.None,
        endPromise: Promise.resolve(),
        getRange: () => buffer_1.VSBuffer.alloc(0),
        getRangeIter: () => [],
    };
    class TaskRawOutput {
        constructor() {
            this.writeDataEmitter = new event_1.Emitter();
            this.endDeferred = new async_1.DeferredPromise();
            this.offset = 0;
            /** @inheritdoc */
            this.onDidWriteData = this.writeDataEmitter.event;
            /** @inheritdoc */
            this.endPromise = this.endDeferred.p;
            /** @inheritdoc */
            this.buffers = [];
        }
        /** @inheritdoc */
        get length() {
            return this.offset;
        }
        /** @inheritdoc */
        getRange(start, length) {
            const buf = buffer_1.VSBuffer.alloc(length);
            let bufLastWrite = 0;
            for (const chunk of this.getRangeIter(start, length)) {
                buf.buffer.set(chunk.buffer, bufLastWrite);
                bufLastWrite += chunk.byteLength;
            }
            return bufLastWrite < length ? buf.slice(0, bufLastWrite) : buf;
        }
        /** @inheritdoc */
        *getRangeIter(start, length) {
            let soFar = 0;
            let internalLastRead = 0;
            for (const b of this.buffers) {
                if (internalLastRead + b.byteLength <= start) {
                    internalLastRead += b.byteLength;
                    continue;
                }
                const bstart = Math.max(0, start - internalLastRead);
                const bend = Math.min(b.byteLength, bstart + length - soFar);
                yield b.slice(bstart, bend);
                soFar += bend - bstart;
                internalLastRead += b.byteLength;
                if (soFar === length) {
                    break;
                }
            }
        }
        /**
         * Appends data to the output, returning the byte range where the data can be found.
         */
        append(data, marker) {
            const offset = this.offset;
            let length = data.byteLength;
            if (marker === undefined) {
                this.push(data);
                return { offset, length };
            }
            // Bytes that should be 'trimmed' off the end of data. This is done because
            // selections in the terminal are based on the entire line, and commonly
            // the interesting marked range has a trailing new line. We don't want to
            // select the trailing line (which might have other data)
            // so we place the marker before all trailing trimbytes.
            let TrimBytes;
            (function (TrimBytes) {
                TrimBytes[TrimBytes["CR"] = 13] = "CR";
                TrimBytes[TrimBytes["LF"] = 10] = "LF";
            })(TrimBytes || (TrimBytes = {}));
            const start = buffer_1.VSBuffer.fromString(getMarkCode(marker, true));
            const end = buffer_1.VSBuffer.fromString(getMarkCode(marker, false));
            length += start.byteLength + end.byteLength;
            this.push(start);
            let trimLen = data.byteLength;
            for (; trimLen > 0; trimLen--) {
                const last = data.buffer[trimLen - 1];
                if (last !== 13 /* TrimBytes.CR */ && last !== 10 /* TrimBytes.LF */) {
                    break;
                }
            }
            this.push(data.slice(0, trimLen));
            this.push(end);
            this.push(data.slice(trimLen));
            return { offset, length };
        }
        push(data) {
            if (data.byteLength === 0) {
                return;
            }
            this.buffers.push(data);
            this.writeDataEmitter.fire(data);
            this.offset += data.byteLength;
        }
        /** Signals the output has ended. */
        end() {
            this.endDeferred.complete();
        }
    }
    exports.TaskRawOutput = TaskRawOutput;
    const resultItemParents = function* (results, item) {
        for (const id of testId_1.TestId.fromString(item.item.extId).idsToRoot()) {
            yield results.getStateById(id.toString());
        }
    };
    exports.resultItemParents = resultItemParents;
    const maxCountPriority = (counts) => {
        for (const state of testingStates_1.statesInOrder) {
            if (counts[state] > 0) {
                return state;
            }
        }
        return 0 /* TestResultState.Unset */;
    };
    exports.maxCountPriority = maxCountPriority;
    const getMarkCode = (marker, start) => `\x1b]633;SetMark;Id=${(0, testTypes_1.getMarkId)(marker, start)};Hidden\x07`;
    const itemToNode = (controllerId, item, parent) => ({
        controllerId,
        expand: 0 /* TestItemExpandState.NotExpandable */,
        item: { ...item },
        children: [],
        tasks: [],
        ownComputedState: 0 /* TestResultState.Unset */,
        computedState: 0 /* TestResultState.Unset */,
    });
    var TestResultItemChangeReason;
    (function (TestResultItemChangeReason) {
        TestResultItemChangeReason[TestResultItemChangeReason["ComputedStateChange"] = 0] = "ComputedStateChange";
        TestResultItemChangeReason[TestResultItemChangeReason["OwnStateChange"] = 1] = "OwnStateChange";
        TestResultItemChangeReason[TestResultItemChangeReason["NewMessage"] = 2] = "NewMessage";
    })(TestResultItemChangeReason || (exports.TestResultItemChangeReason = TestResultItemChangeReason = {}));
    /**
     * Results of a test. These are created when the test initially started running
     * and marked as "complete" when the run finishes.
     */
    let LiveTestResult = class LiveTestResult extends lifecycle_1.Disposable {
        /**
         * @inheritdoc
         */
        get completedAt() {
            return this._completedAt;
        }
        /**
         * @inheritdoc
         */
        get tests() {
            return this.testById.values();
        }
        constructor(id, persist, request, telemetry) {
            super();
            this.id = id;
            this.persist = persist;
            this.request = request;
            this.telemetry = telemetry;
            this.completeEmitter = this._register(new event_1.Emitter());
            this.newTaskEmitter = this._register(new event_1.Emitter());
            this.endTaskEmitter = this._register(new event_1.Emitter());
            this.changeEmitter = this._register(new event_1.Emitter());
            /** todo@connor4312: convert to a WellDefinedPrefixTree */
            this.testById = new Map();
            this.testMarkerCounter = 0;
            this.startedAt = Date.now();
            this.onChange = this.changeEmitter.event;
            this.onComplete = this.completeEmitter.event;
            this.onNewTask = this.newTaskEmitter.event;
            this.onEndTask = this.endTaskEmitter.event;
            this.tasks = [];
            this.name = (0, nls_1.localize)('runFinished', 'Test run at {0}', new Date().toLocaleString(platform_1.language));
            /**
             * @inheritdoc
             */
            this.counts = (0, testingStates_1.makeEmptyCounts)();
            this.computedStateAccessor = {
                getOwnState: i => i.ownComputedState,
                getCurrentComputedState: i => i.computedState,
                setComputedState: (i, s) => i.computedState = s,
                getChildren: i => i.children,
                getParents: i => {
                    const { testById: testByExtId } = this;
                    return (function* () {
                        const parentId = testId_1.TestId.fromString(i.item.extId).parentId;
                        if (parentId) {
                            for (const id of parentId.idsToRoot()) {
                                yield testByExtId.get(id.toString());
                            }
                        }
                    })();
                },
            };
            this.doSerialize = new lazy_1.Lazy(() => ({
                id: this.id,
                completedAt: this.completedAt,
                tasks: this.tasks.map(t => ({ id: t.id, name: t.name })),
                name: this.name,
                request: this.request,
                items: [...this.testById.values()].map(testTypes_1.TestResultItem.serializeWithoutMessages),
            }));
            this.doSerializeWithMessages = new lazy_1.Lazy(() => ({
                id: this.id,
                completedAt: this.completedAt,
                tasks: this.tasks.map(t => ({ id: t.id, name: t.name })),
                name: this.name,
                request: this.request,
                items: [...this.testById.values()].map(testTypes_1.TestResultItem.serialize),
            }));
        }
        /**
         * @inheritdoc
         */
        getStateById(extTestId) {
            return this.testById.get(extTestId);
        }
        /**
         * Appends output that occurred during the test run.
         */
        appendOutput(output, taskId, location, testId) {
            const preview = output.byteLength > 100 ? output.slice(0, 100).toString() + '…' : output.toString();
            let marker;
            // currently, the UI only exposes jump-to-message from tests or locations,
            // so no need to mark outputs that don't come from either of those.
            if (testId || location) {
                marker = this.testMarkerCounter++;
            }
            const index = this.mustGetTaskIndex(taskId);
            const task = this.tasks[index];
            const { offset, length } = task.output.append(output, marker);
            const message = {
                location,
                message: preview,
                offset,
                length,
                marker,
                type: 1 /* TestMessageType.Output */,
            };
            const test = testId && this.testById.get(testId);
            if (test) {
                test.tasks[index].messages.push(message);
                this.changeEmitter.fire({ item: test, result: this, reason: 2 /* TestResultItemChangeReason.NewMessage */, message });
            }
            else {
                task.otherMessages.push(message);
            }
        }
        /**
         * Adds a new run task to the results.
         */
        addTask(task) {
            this.tasks.push({ ...task, coverage: (0, observable_1.observableValue)(this, undefined), otherMessages: [], output: new TaskRawOutput() });
            for (const test of this.tests) {
                test.tasks.push({ duration: undefined, messages: [], state: 0 /* TestResultState.Unset */ });
            }
            this.newTaskEmitter.fire(this.tasks.length - 1);
        }
        /**
         * Add the chain of tests to the run. The first test in the chain should
         * be either a test root, or a previously-known test.
         */
        addTestChainToRun(controllerId, chain) {
            let parent = this.testById.get(chain[0].extId);
            if (!parent) { // must be a test root
                parent = this.addTestToRun(controllerId, chain[0], null);
            }
            for (let i = 1; i < chain.length; i++) {
                parent = this.addTestToRun(controllerId, chain[i], parent.item.extId);
            }
            return undefined;
        }
        /**
         * Updates the state of the test by its internal ID.
         */
        updateState(testId, taskId, state, duration) {
            const entry = this.testById.get(testId);
            if (!entry) {
                return;
            }
            const index = this.mustGetTaskIndex(taskId);
            const oldTerminalStatePrio = testingStates_1.terminalStatePriorities[entry.tasks[index].state];
            const newTerminalStatePrio = testingStates_1.terminalStatePriorities[state];
            // Ignore requests to set the state from one terminal state back to a
            // "lower" one, e.g. from failed back to passed:
            if (oldTerminalStatePrio !== undefined &&
                (newTerminalStatePrio === undefined || newTerminalStatePrio < oldTerminalStatePrio)) {
                return;
            }
            this.fireUpdateAndRefresh(entry, index, state, duration);
        }
        /**
         * Appends a message for the test in the run.
         */
        appendMessage(testId, taskId, message) {
            const entry = this.testById.get(testId);
            if (!entry) {
                return;
            }
            entry.tasks[this.mustGetTaskIndex(taskId)].messages.push(message);
            this.changeEmitter.fire({ item: entry, result: this, reason: 2 /* TestResultItemChangeReason.NewMessage */, message });
        }
        /**
         * Marks the task in the test run complete.
         */
        markTaskComplete(taskId) {
            const index = this.mustGetTaskIndex(taskId);
            const task = this.tasks[index];
            task.running = false;
            task.output.end();
            this.setAllToState(0 /* TestResultState.Unset */, taskId, t => t.state === 1 /* TestResultState.Queued */ || t.state === 2 /* TestResultState.Running */);
            this.endTaskEmitter.fire(index);
        }
        /**
         * Notifies the service that all tests are complete.
         */
        markComplete() {
            if (this._completedAt !== undefined) {
                throw new Error('cannot complete a test result multiple times');
            }
            for (const task of this.tasks) {
                if (task.running) {
                    this.markTaskComplete(task.id);
                }
            }
            this._completedAt = Date.now();
            this.completeEmitter.fire();
            this.telemetry.publicLog2('test.outcomes', {
                failures: this.counts[6 /* TestResultState.Errored */] + this.counts[4 /* TestResultState.Failed */],
                passes: this.counts[3 /* TestResultState.Passed */],
                controller: this.request.targets.map(t => t.controllerId).join(',')
            });
        }
        /**
         * Marks the test and all of its children in the run as retired.
         */
        markRetired(testIds) {
            for (const [id, test] of this.testById) {
                if (!test.retired && (!testIds || testIds.hasKeyOrParent(testId_1.TestId.fromString(id).path))) {
                    test.retired = true;
                    this.changeEmitter.fire({ reason: 0 /* TestResultItemChangeReason.ComputedStateChange */, item: test, result: this });
                }
            }
        }
        /**
         * @inheritdoc
         */
        toJSON() {
            return this.completedAt && this.persist ? this.doSerialize.value : undefined;
        }
        toJSONWithMessages() {
            return this.completedAt && this.persist ? this.doSerializeWithMessages.value : undefined;
        }
        /**
         * Updates all tests in the collection to the given state.
         */
        setAllToState(state, taskId, when) {
            const index = this.mustGetTaskIndex(taskId);
            for (const test of this.testById.values()) {
                if (when(test.tasks[index], test)) {
                    this.fireUpdateAndRefresh(test, index, state);
                }
            }
        }
        fireUpdateAndRefresh(entry, taskIndex, newState, newOwnDuration) {
            const previousOwnComputed = entry.ownComputedState;
            const previousOwnDuration = entry.ownDuration;
            const changeEvent = {
                item: entry,
                result: this,
                reason: 1 /* TestResultItemChangeReason.OwnStateChange */,
                previousState: previousOwnComputed,
                previousOwnDuration: previousOwnDuration,
            };
            entry.tasks[taskIndex].state = newState;
            if (newOwnDuration !== undefined) {
                entry.tasks[taskIndex].duration = newOwnDuration;
                entry.ownDuration = Math.max(entry.ownDuration || 0, newOwnDuration);
            }
            const newOwnComputed = (0, testingStates_1.maxPriority)(...entry.tasks.map(t => t.state));
            if (newOwnComputed === previousOwnComputed) {
                if (newOwnDuration !== previousOwnDuration) {
                    this.changeEmitter.fire(changeEvent); // fire manually since state change won't do it
                }
                return;
            }
            entry.ownComputedState = newOwnComputed;
            this.counts[previousOwnComputed]--;
            this.counts[newOwnComputed]++;
            (0, getComputedState_1.refreshComputedState)(this.computedStateAccessor, entry).forEach(t => this.changeEmitter.fire(t === entry ? changeEvent : {
                item: t,
                result: this,
                reason: 0 /* TestResultItemChangeReason.ComputedStateChange */,
            }));
        }
        addTestToRun(controllerId, item, parent) {
            const node = itemToNode(controllerId, item, parent);
            this.testById.set(item.extId, node);
            this.counts[0 /* TestResultState.Unset */]++;
            if (parent) {
                this.testById.get(parent)?.children.push(node);
            }
            if (this.tasks.length) {
                for (let i = 0; i < this.tasks.length; i++) {
                    node.tasks.push({ duration: undefined, messages: [], state: 0 /* TestResultState.Unset */ });
                }
            }
            return node;
        }
        mustGetTaskIndex(taskId) {
            const index = this.tasks.findIndex(t => t.id === taskId);
            if (index === -1) {
                throw new Error(`Unknown task ${taskId} in updateState`);
            }
            return index;
        }
    };
    exports.LiveTestResult = LiveTestResult;
    exports.LiveTestResult = LiveTestResult = __decorate([
        __param(3, telemetry_1.ITelemetryService)
    ], LiveTestResult);
    /**
     * Test results hydrated from a previously-serialized test run.
     */
    class HydratedTestResult {
        /**
         * @inheritdoc
         */
        get tests() {
            return this.testById.values();
        }
        constructor(identity, serialized, persist = true) {
            this.serialized = serialized;
            this.persist = persist;
            /**
             * @inheritdoc
             */
            this.counts = (0, testingStates_1.makeEmptyCounts)();
            this.testById = new Map();
            this.id = serialized.id;
            this.completedAt = serialized.completedAt;
            this.tasks = serialized.tasks.map((task, i) => ({
                id: task.id,
                name: task.name,
                running: false,
                coverage: (0, observable_1.observableValue)(this, undefined),
                output: emptyRawOutput,
                otherMessages: []
            }));
            this.name = serialized.name;
            this.request = serialized.request;
            for (const item of serialized.items) {
                const de = testTypes_1.TestResultItem.deserialize(identity, item);
                this.counts[de.ownComputedState]++;
                this.testById.set(item.item.extId, de);
            }
        }
        /**
         * @inheritdoc
         */
        getStateById(extTestId) {
            return this.testById.get(extTestId);
        }
        /**
         * @inheritdoc
         */
        toJSON() {
            return this.persist ? this.serialized : undefined;
        }
        /**
         * @inheritdoc
         */
        toJSONWithMessages() {
            return this.toJSON();
        }
    }
    exports.HydratedTestResult = HydratedTestResult;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFJlc3VsdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RSZXN1bHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUdoRyxNQUFNLGNBQWMsR0FBbUI7UUFDdEMsT0FBTyxFQUFFLEVBQUU7UUFDWCxNQUFNLEVBQUUsQ0FBQztRQUNULGNBQWMsRUFBRSxhQUFLLENBQUMsSUFBSTtRQUMxQixVQUFVLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRTtRQUM3QixRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO0tBQ3RCLENBQUM7SUFFRixNQUFhLGFBQWE7UUFBMUI7WUFDa0IscUJBQWdCLEdBQUcsSUFBSSxlQUFPLEVBQVksQ0FBQztZQUMzQyxnQkFBVyxHQUFHLElBQUksdUJBQWUsRUFBUSxDQUFDO1lBQ25ELFdBQU0sR0FBRyxDQUFDLENBQUM7WUFFbkIsa0JBQWtCO1lBQ0YsbUJBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBRTdELGtCQUFrQjtZQUNGLGVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUVoRCxrQkFBa0I7WUFDRixZQUFPLEdBQWUsRUFBRSxDQUFDO1FBa0cxQyxDQUFDO1FBaEdBLGtCQUFrQjtRQUNsQixJQUFXLE1BQU07WUFDaEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxrQkFBa0I7UUFDbEIsUUFBUSxDQUFDLEtBQWEsRUFBRSxNQUFjO1lBQ3JDLE1BQU0sR0FBRyxHQUFHLGlCQUFRLENB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