/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.makeEmptyCounts = exports.terminalStatePriorities = exports.statesInOrder = exports.maxPriority = exports.cmpPriority = exports.stateNodes = exports.isStateWithResult = exports.isFailedState = exports.statePriority = void 0;
    /**
     * List of display priorities for different run states. When tests update,
     * the highest-priority state from any of their children will be the state
     * reflected in the parent node.
     */
    exports.statePriority = {
        [2 /* TestResultState.Running */]: 6,
        [6 /* TestResultState.Errored */]: 5,
        [4 /* TestResultState.Failed */]: 4,
        [1 /* TestResultState.Queued */]: 3,
        [3 /* TestResultState.Passed */]: 2,
        [0 /* TestResultState.Unset */]: 0,
        [5 /* TestResultState.Skipped */]: 1,
    };
    const isFailedState = (s) => s === 6 /* TestResultState.Errored */ || s === 4 /* TestResultState.Failed */;
    exports.isFailedState = isFailedState;
    const isStateWithResult = (s) => s === 6 /* TestResultState.Errored */ || s === 4 /* TestResultState.Failed */ || s === 3 /* TestResultState.Passed */;
    exports.isStateWithResult = isStateWithResult;
    exports.stateNodes = Object.entries(exports.statePriority).reduce((acc, [stateStr, priority]) => {
        const state = Number(stateStr);
        acc[state] = { statusNode: true, state, priority };
        return acc;
    }, {});
    const cmpPriority = (a, b) => exports.statePriority[b] - exports.statePriority[a];
    exports.cmpPriority = cmpPriority;
    const maxPriority = (...states) => {
        switch (states.length) {
            case 0:
                return 0 /* TestResultState.Unset */;
            case 1:
                return states[0];
            case 2:
                return exports.statePriority[states[0]] > exports.statePriority[states[1]] ? states[0] : states[1];
            default: {
                let max = states[0];
                for (let i = 1; i < states.length; i++) {
                    if (exports.statePriority[max] < exports.statePriority[states[i]]) {
                        max = states[i];
                    }
                }
                return max;
            }
        }
    };
    exports.maxPriority = maxPriority;
    exports.statesInOrder = Object.keys(exports.statePriority).map(s => Number(s)).sort(exports.cmpPriority);
    /**
     * Some states are considered terminal; once these are set for a given test run, they
     * are not reset back to a non-terminal state, or to a terminal state with lower
     * priority.
     */
    exports.terminalStatePriorities = {
        [3 /* TestResultState.Passed */]: 0,
        [5 /* TestResultState.Skipped */]: 1,
        [4 /* TestResultState.Failed */]: 2,
        [6 /* TestResultState.Errored */]: 3,
    };
    const makeEmptyCounts = () => {
        // shh! don't tell anyone this is actually an array!
        return new Uint32Array(exports.statesInOrder.length);
    };
    exports.makeEmptyCounts = makeEmptyCounts;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ1N0YXRlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RpbmdTdGF0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHOzs7O09BSUc7SUFDVSxRQUFBLGFBQWEsR0FBdUM7UUFDaEUsaUNBQXlCLEVBQUUsQ0FBQztRQUM1QixpQ0FBeUIsRUFBRSxDQUFDO1FBQzVCLGdDQUF3QixFQUFFLENBQUM7UUFDM0IsZ0NBQXdCLEVBQUUsQ0FBQztRQUMzQixnQ0FBd0IsRUFBRSxDQUFDO1FBQzNCLCtCQUF1QixFQUFFLENBQUM7UUFDMUIsaUNBQXlCLEVBQUUsQ0FBQztLQUM1QixDQUFDO0lBRUssTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDLG9DQUE0QixJQUFJLENBQUMsbUNBQTJCLENBQUM7SUFBdEcsUUFBQSxhQUFhLGlCQUF5RjtJQUM1RyxNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxvQ0FBNEIsSUFBSSxDQUFDLG1DQUEyQixJQUFJLENBQUMsbUNBQTJCLENBQUM7SUFBMUksUUFBQSxpQkFBaUIscUJBQXlIO0lBRTFJLFFBQUEsVUFBVSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMscUJBQWEsQ0FBQyxDQUFDLE1BQU0sQ0FDN0QsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRTtRQUM3QixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFvQixDQUFDO1FBQ2xELEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDO1FBQ25ELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQyxFQUFFLEVBQStDLENBQ2xELENBQUM7SUFFSyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQWtCLEVBQUUsQ0FBa0IsRUFBRSxFQUFFLENBQUMscUJBQWEsQ0FBQyxDQUFDLENBQUMsR0FBRyxxQkFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQTlGLFFBQUEsV0FBVyxlQUFtRjtJQUVwRyxNQUFNLFdBQVcsR0FBRyxDQUFDLEdBQUcsTUFBeUIsRUFBRSxFQUFFO1FBQzNELFFBQVEsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQztnQkFDTCxxQ0FBNkI7WUFDOUIsS0FBSyxDQUFDO2dCQUNMLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLEtBQUssQ0FBQztnQkFDTCxPQUFPLHFCQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcscUJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEYsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDVCxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3hDLElBQUkscUJBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxxQkFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ25ELEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pCLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQyxDQUFDO0lBbkJXLFFBQUEsV0FBVyxlQW1CdEI7SUFFVyxRQUFBLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFvQixDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFXLENBQUMsQ0FBQztJQUVqSDs7OztPQUlHO0lBQ1UsUUFBQSx1QkFBdUIsR0FBMEM7UUFDN0UsZ0NBQXdCLEVBQUUsQ0FBQztRQUMzQixpQ0FBeUIsRUFBRSxDQUFDO1FBQzVCLGdDQUF3QixFQUFFLENBQUM7UUFDM0IsaUNBQXlCLEVBQUUsQ0FBQztLQUM1QixDQUFDO0lBT0ssTUFBTSxlQUFlLEdBQUcsR0FBbUIsRUFBRTtRQUNuRCxvREFBb0Q7UUFDcEQsT0FBTyxJQUFJLFdBQVcsQ0FBQyxxQkFBYSxDQUFDLE1BQU0sQ0FBOEMsQ0FBQztJQUMzRixDQUFDLENBQUM7SUFIVyxRQUFBLGVBQWUsbUJBRzFCIn0=