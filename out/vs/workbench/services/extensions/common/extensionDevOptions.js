/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseExtensionDevOptions = parseExtensionDevOptions;
    function parseExtensionDevOptions(environmentService) {
        // handle extension host lifecycle a bit special when we know we are developing an extension that runs inside
        const isExtensionDevHost = environmentService.isExtensionDevelopment;
        let debugOk = true;
        const extDevLocs = environmentService.extensionDevelopmentLocationURI;
        if (extDevLocs) {
            for (const x of extDevLocs) {
                if (x.scheme !== network_1.Schemas.file) {
                    debugOk = false;
                }
            }
        }
        const isExtensionDevDebug = debugOk && typeof environmentService.debugExtensionHost.port === 'number';
        const isExtensionDevDebugBrk = debugOk && !!environmentService.debugExtensionHost.break;
        const isExtensionDevTestFromCli = isExtensionDevHost && !!environmentService.extensionTestsLocationURI && !environmentService.debugExtensionHost.debugId;
        return {
            isExtensionDevHost,
            isExtensionDevDebug,
            isExtensionDevDebugBrk,
            isExtensionDevTestFromCli
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRGV2T3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25EZXZPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLDREQXVCQztJQXZCRCxTQUFnQix3QkFBd0IsQ0FBQyxrQkFBdUM7UUFDL0UsNkdBQTZHO1FBQzdHLE1BQU0sa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsc0JBQXNCLENBQUM7UUFFckUsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ25CLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLCtCQUErQixDQUFDO1FBQ3RFLElBQUksVUFBVSxFQUFFLENBQUM7WUFDaEIsS0FBSyxNQUFNLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQy9CLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ2pCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sbUJBQW1CLEdBQUcsT0FBTyxJQUFJLE9BQU8sa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztRQUN0RyxNQUFNLHNCQUFzQixHQUFHLE9BQU8sSUFBSSxDQUFDLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1FBQ3hGLE1BQU0seUJBQXlCLEdBQUcsa0JBQWtCLElBQUksQ0FBQyxDQUFDLGtCQUFrQixDQUFDLHlCQUF5QixJQUFJLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDO1FBQ3pKLE9BQU87WUFDTixrQkFBa0I7WUFDbEIsbUJBQW1CO1lBQ25CLHNCQUFzQjtZQUN0Qix5QkFBeUI7U0FDekIsQ0FBQztJQUNILENBQUMifQ==