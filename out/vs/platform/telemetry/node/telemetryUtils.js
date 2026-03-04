/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/node/id", "vs/platform/telemetry/common/telemetry"], function (require, exports, platform_1, id_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveMachineId = resolveMachineId;
    exports.resolveSqmId = resolveSqmId;
    async function resolveMachineId(stateService, logService) {
        // We cache the machineId for faster lookups
        // and resolve it only once initially if not cached or we need to replace the macOS iBridge device
        let machineId = stateService.getItem(telemetry_1.machineIdKey);
        if (typeof machineId !== 'string' || (platform_1.isMacintosh && machineId === '6c9d2bc8f91b89624add29c0abeae7fb42bf539fa1cdb2e3e57cd668fa9bcead')) {
            machineId = await (0, id_1.getMachineId)(logService.error.bind(logService));
        }
        return machineId;
    }
    async function resolveSqmId(stateService, logService) {
        let sqmId = stateService.getItem(telemetry_1.sqmIdKey);
        if (typeof sqmId !== 'string') {
            sqmId = await (0, id_1.getSqmMachineId)(logService.error.bind(logService));
        }
        return sqmId;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvbm9kZS90ZWxlbWV0cnlVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyw0Q0FTQztJQUVELG9DQU9DO0lBbEJNLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxZQUErQixFQUFFLFVBQXVCO1FBQzlGLDRDQUE0QztRQUM1QyxrR0FBa0c7UUFDbEcsSUFBSSxTQUFTLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBUyx3QkFBWSxDQUFDLENBQUM7UUFDM0QsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLElBQUksQ0FBQyxzQkFBVyxJQUFJLFNBQVMsS0FBSyxrRUFBa0UsQ0FBQyxFQUFFLENBQUM7WUFDeEksU0FBUyxHQUFHLE1BQU0sSUFBQSxpQkFBWSxFQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFTSxLQUFLLFVBQVUsWUFBWSxDQUFDLFlBQStCLEVBQUUsVUFBdUI7UUFDMUYsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBUyxvQkFBUSxDQUFDLENBQUM7UUFDbkQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMvQixLQUFLLEdBQUcsTUFBTSxJQUFBLG9CQUFlLEVBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDIn0=