/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, serviceMachineId_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveMarketplaceHeaders = resolveMarketplaceHeaders;
    async function resolveMarketplaceHeaders(version, productService, environmentService, configurationService, fileService, storageService, telemetryService) {
        const headers = {
            'X-Market-Client-Id': `VSCode ${version}`,
            'User-Agent': `VSCode ${version} (${productService.nameShort})`
        };
        if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService) && (0, telemetryUtils_1.getTelemetryLevel)(configurationService) === 3 /* TelemetryLevel.USAGE */) {
            const serviceMachineId = await (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService);
            headers['X-Market-User-Id'] = serviceMachineId;
            // Send machineId as VSCode-SessionId so we can correlate telemetry events across different services
            // machineId can be undefined sometimes (eg: when launching from CLI), so send serviceMachineId instead otherwise
            // Marketplace will reject the request if there is no VSCode-SessionId header
            headers['VSCode-SessionId'] = telemetryService.machineId || serviceMachineId;
        }
        return headers;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2V0cGxhY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlcm5hbFNlcnZpY2VzL2NvbW1vbi9tYXJrZXRwbGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyw4REF1QkM7SUF2Qk0sS0FBSyxVQUFVLHlCQUF5QixDQUFDLE9BQWUsRUFDOUQsY0FBK0IsRUFDL0Isa0JBQXVDLEVBQ3ZDLG9CQUEyQyxFQUMzQyxXQUF5QixFQUN6QixjQUEyQyxFQUMzQyxnQkFBbUM7UUFFbkMsTUFBTSxPQUFPLEdBQWE7WUFDekIsb0JBQW9CLEVBQUUsVUFBVSxPQUFPLEVBQUU7WUFDekMsWUFBWSxFQUFFLFVBQVUsT0FBTyxLQUFLLGNBQWMsQ0FBQyxTQUFTLEdBQUc7U0FDL0QsQ0FBQztRQUVGLElBQUksSUFBQSxrQ0FBaUIsRUFBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxJQUFBLGtDQUFpQixFQUFDLG9CQUFvQixDQUFDLGlDQUF5QixFQUFFLENBQUM7WUFDL0gsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLElBQUEsc0NBQW1CLEVBQUMsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3BHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLGdCQUFnQixDQUFDO1lBQy9DLG9HQUFvRztZQUNwRyxpSEFBaUg7WUFDakgsNkVBQTZFO1lBQzdFLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQztRQUM5RSxDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQyJ9