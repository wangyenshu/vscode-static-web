/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/node/telemetryUtils"], function (require, exports, telemetry_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveMachineId = resolveMachineId;
    exports.resolveSqmId = resolveSqmId;
    async function resolveMachineId(stateService, logService) {
        // Call the node layers implementation to avoid code duplication
        const machineId = await (0, telemetryUtils_1.resolveMachineId)(stateService, logService);
        stateService.setItem(telemetry_1.machineIdKey, machineId);
        return machineId;
    }
    async function resolveSqmId(stateService, logService) {
        const sqmId = await (0, telemetryUtils_1.resolveSqmId)(stateService, logService);
        stateService.setItem(telemetry_1.sqmIdKey, sqmId);
        return sqmId;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvZWxlY3Ryb24tbWFpbi90ZWxlbWV0cnlVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyw0Q0FLQztJQUVELG9DQUlDO0lBWE0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLFlBQTJCLEVBQUUsVUFBdUI7UUFDMUYsZ0VBQWdFO1FBQ2hFLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSxpQ0FBb0IsRUFBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkUsWUFBWSxDQUFDLE9BQU8sQ0FBQyx3QkFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFTSxLQUFLLFVBQVUsWUFBWSxDQUFDLFlBQTJCLEVBQUUsVUFBdUI7UUFDdEYsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLDZCQUFnQixFQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMvRCxZQUFZLENBQUMsT0FBTyxDQUFDLG9CQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEMsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDIn0=