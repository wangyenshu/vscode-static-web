/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.inputLatency = void 0;
    var inputLatency;
    (function (inputLatency) {
        const totalKeydownTime = { total: 0, min: Number.MAX_VALUE, max: 0 };
        const totalInputTime = { ...totalKeydownTime };
        const totalRenderTime = { ...totalKeydownTime };
        const totalInputLatencyTime = { ...totalKeydownTime };
        let measurementsCount = 0;
        // The state of each event, this helps ensure the integrity of the measurement and that
        // something unexpected didn't happen that could skew the measurement.
        let EventPhase;
        (function (EventPhase) {
            EventPhase[EventPhase["Before"] = 0] = "Before";
            EventPhase[EventPhase["InProgress"] = 1] = "InProgress";
            EventPhase[EventPhase["Finished"] = 2] = "Finished";
        })(EventPhase || (EventPhase = {}));
        const state = {
            keydown: 0 /* EventPhase.Before */,
            input: 0 /* EventPhase.Before */,
            render: 0 /* EventPhase.Before */,
        };
        /**
         * Record the start of the keydown event.
         */
        function onKeyDown() {
            /** Direct Check C. See explanation in {@link recordIfFinished} */
            recordIfFinished();
            performance.mark('inputlatency/start');
            performance.mark('keydown/start');
            state.keydown = 1 /* EventPhase.InProgress */;
            queueMicrotask(markKeyDownEnd);
        }
        inputLatency.onKeyDown = onKeyDown;
        /**
         * Mark the end of the keydown event.
         */
        function markKeyDownEnd() {
            if (state.keydown === 1 /* EventPhase.InProgress */) {
                performance.mark('keydown/end');
                state.keydown = 2 /* EventPhase.Finished */;
            }
        }
        /**
         * Record the start of the beforeinput event.
         */
        function onBeforeInput() {
            performance.mark('input/start');
            state.input = 1 /* EventPhase.InProgress */;
            /** Schedule Task A. See explanation in {@link recordIfFinished} */
            scheduleRecordIfFinishedTask();
        }
        inputLatency.onBeforeInput = onBeforeInput;
        /**
         * Record the start of the input event.
         */
        function onInput() {
            if (state.input === 0 /* EventPhase.Before */) {
                // it looks like we didn't receive a `beforeinput`
                onBeforeInput();
            }
            queueMicrotask(markInputEnd);
        }
        inputLatency.onInput = onInput;
        function markInputEnd() {
            if (state.input === 1 /* EventPhase.InProgress */) {
                performance.mark('input/end');
                state.input = 2 /* EventPhase.Finished */;
            }
        }
        /**
         * Record the start of the keyup event.
         */
        function onKeyUp() {
            /** Direct Check D. See explanation in {@link recordIfFinished} */
            recordIfFinished();
        }
        inputLatency.onKeyUp = onKeyUp;
        /**
         * Record the start of the selectionchange event.
         */
        function onSelectionChange() {
            /** Direct Check E. See explanation in {@link recordIfFinished} */
            recordIfFinished();
        }
        inputLatency.onSelectionChange = onSelectionChange;
        /**
         * Record the start of the animation frame performing the rendering.
         */
        function onRenderStart() {
            // Render may be triggered during input, but we only measure the following animation frame
            if (state.keydown === 2 /* EventPhase.Finished */ && state.input === 2 /* EventPhase.Finished */ && state.render === 0 /* EventPhase.Before */) {
                // Only measure the first render after keyboard input
                performance.mark('render/start');
                state.render = 1 /* EventPhase.InProgress */;
                queueMicrotask(markRenderEnd);
                /** Schedule Task B. See explanation in {@link recordIfFinished} */
                scheduleRecordIfFinishedTask();
            }
        }
        inputLatency.onRenderStart = onRenderStart;
        /**
         * Mark the end of the animation frame performing the rendering.
         */
        function markRenderEnd() {
            if (state.render === 1 /* EventPhase.InProgress */) {
                performance.mark('render/end');
                state.render = 2 /* EventPhase.Finished */;
            }
        }
        function scheduleRecordIfFinishedTask() {
            // Here we can safely assume that the `setTimeout` will not be
            // artificially delayed by 4ms because we schedule it from
            // event handlers
            setTimeout(recordIfFinished);
        }
        /**
         * Record the input latency sample if input handling and rendering are finished.
         *
         * The challenge here is that we want to record the latency in such a way that it includes
         * also the layout and painting work the browser does during the animation frame task.
         *
         * Simply scheduling a new task (via `setTimeout`) from the animation frame task would
         * schedule the new task at the end of the task queue (after other code that uses `setTimeout`),
         * so we need to use multiple strategies to make sure our task runs before others:
         *
         * We schedule tasks (A and B):
         *    - we schedule a task A (via a `setTimeout` call) when the input starts in `markInputStart`.
         *      If the animation frame task is scheduled quickly by the browser, then task A has a very good
         *      chance of being the very first task after the animation frame and thus will record the input latency.
         *    - however, if the animation frame task is scheduled a bit later, then task A might execute
         *      before the animation frame task. We therefore schedule another task B from `markRenderStart`.
         *
         * We do direct checks in browser event handlers (C, D, E):
         *    - if the browser has multiple keydown events queued up, they will be scheduled before the `setTimeout` tasks,
         *      so we do a direct check in the keydown event handler (C).
         *    - depending on timing, sometimes the animation frame is scheduled even before the `keyup` event, so we
         *      do a direct check there too (E).
         *    - the browser oftentimes emits a `selectionchange` event after an `input`, so we do a direct check there (D).
         */
        function recordIfFinished() {
            if (state.keydown === 2 /* EventPhase.Finished */ && state.input === 2 /* EventPhase.Finished */ && state.render === 2 /* EventPhase.Finished */) {
                performance.mark('inputlatency/end');
                performance.measure('keydown', 'keydown/start', 'keydown/end');
                performance.measure('input', 'input/start', 'input/end');
                performance.measure('render', 'render/start', 'render/end');
                performance.measure('inputlatency', 'inputlatency/start', 'inputlatency/end');
                addMeasure('keydown', totalKeydownTime);
                addMeasure('input', totalInputTime);
                addMeasure('render', totalRenderTime);
                addMeasure('inputlatency', totalInputLatencyTime);
                // console.info(
                // 	`input latency=${performance.getEntriesByName('inputlatency')[0].duration.toFixed(1)} [` +
                // 	`keydown=${performance.getEntriesByName('keydown')[0].duration.toFixed(1)}, ` +
                // 	`input=${performance.getEntriesByName('input')[0].duration.toFixed(1)}, ` +
                // 	`render=${performance.getEntriesByName('render')[0].duration.toFixed(1)}` +
                // 	`]`
                // );
                measurementsCount++;
                reset();
            }
        }
        function addMeasure(entryName, cumulativeMeasurement) {
            const duration = performance.getEntriesByName(entryName)[0].duration;
            cumulativeMeasurement.total += duration;
            cumulativeMeasurement.min = Math.min(cumulativeMeasurement.min, duration);
            cumulativeMeasurement.max = Math.max(cumulativeMeasurement.max, duration);
        }
        /**
         * Clear the current sample.
         */
        function reset() {
            performance.clearMarks('keydown/start');
            performance.clearMarks('keydown/end');
            performance.clearMarks('input/start');
            performance.clearMarks('input/end');
            performance.clearMarks('render/start');
            performance.clearMarks('render/end');
            performance.clearMarks('inputlatency/start');
            performance.clearMarks('inputlatency/end');
            performance.clearMeasures('keydown');
            performance.clearMeasures('input');
            performance.clearMeasures('render');
            performance.clearMeasures('inputlatency');
            state.keydown = 0 /* EventPhase.Before */;
            state.input = 0 /* EventPhase.Before */;
            state.render = 0 /* EventPhase.Before */;
        }
        /**
         * Gets all input latency samples and clears the internal buffers to start recording a new set
         * of samples.
         */
        function getAndClearMeasurements() {
            if (measurementsCount === 0) {
                return undefined;
            }
            // Assemble the result
            const result = {
                keydown: cumulativeToFinalMeasurement(totalKeydownTime),
                input: cumulativeToFinalMeasurement(totalInputTime),
                render: cumulativeToFinalMeasurement(totalRenderTime),
                total: cumulativeToFinalMeasurement(totalInputLatencyTime),
                sampleCount: measurementsCount
            };
            // Clear the cumulative measurements
            clearCumulativeMeasurement(totalKeydownTime);
            clearCumulativeMeasurement(totalInputTime);
            clearCumulativeMeasurement(totalRenderTime);
            clearCumulativeMeasurement(totalInputLatencyTime);
            measurementsCount = 0;
            return result;
        }
        inputLatency.getAndClearMeasurements = getAndClearMeasurements;
        function cumulativeToFinalMeasurement(cumulative) {
            return {
                average: cumulative.total / measurementsCount,
                max: cumulative.max,
                min: cumulative.min,
            };
        }
        function clearCumulativeMeasurement(cumulative) {
            cumulative.total = 0;
            cumulative.min = Number.MAX_VALUE;
            cumulative.max = 0;
        }
    })(inputLatency || (exports.inputLatency = inputLatency = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybWFuY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvcGVyZm9ybWFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHLElBQWlCLFlBQVksQ0EwUTVCO0lBMVFELFdBQWlCLFlBQVk7UUFTNUIsTUFBTSxnQkFBZ0IsR0FBMkIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUM3RixNQUFNLGNBQWMsR0FBMkIsRUFBRSxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDdkUsTUFBTSxlQUFlLEdBQTJCLEVBQUUsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hFLE1BQU0scUJBQXFCLEdBQTJCLEVBQUUsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzlFLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBSTFCLHVGQUF1RjtRQUN2RixzRUFBc0U7UUFDdEUsSUFBVyxVQUlWO1FBSkQsV0FBVyxVQUFVO1lBQ3BCLCtDQUFVLENBQUE7WUFDVix1REFBYyxDQUFBO1lBQ2QsbURBQVksQ0FBQTtRQUNiLENBQUMsRUFKVSxVQUFVLEtBQVYsVUFBVSxRQUlwQjtRQUNELE1BQU0sS0FBSyxHQUFHO1lBQ2IsT0FBTywyQkFBbUI7WUFDMUIsS0FBSywyQkFBbUI7WUFDeEIsTUFBTSwyQkFBbUI7U0FDekIsQ0FBQztRQUVGOztXQUVHO1FBQ0gsU0FBZ0IsU0FBUztZQUN4QixrRUFBa0U7WUFDbEUsZ0JBQWdCLEVBQUUsQ0FBQztZQUNuQixXQUFXLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDdkMsV0FBVyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZ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