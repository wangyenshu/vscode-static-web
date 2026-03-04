/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/process"], function (require, exports, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @deprecated You MUST use `IProductService` if possible.
     */
    let product;
    // Native sandbox environment
    const vscodeGlobal = globalThis.vscode;
    if (typeof vscodeGlobal !== 'undefined' && typeof vscodeGlobal.context !== 'undefined') {
        const configuration = vscodeGlobal.context.configuration();
        if (configuration) {
            product = configuration.product;
        }
        else {
            throw new Error('Sandbox: unable to resolve product configuration from preload script.');
        }
    }
    // _VSCODE environment
    else if (globalThis._VSCODE_PRODUCT_JSON && globalThis._VSCODE_PACKAGE_JSON) {
        // Obtain values from product.json and package.json-data
        product = globalThis._VSCODE_PRODUCT_JSON;
        // Running out of sources
        if (process_1.env['VSCODE_DEV']) {
            Object.assign(product, {
                nameShort: `${product.nameShort} Dev`,
                nameLong: `${product.nameLong} Dev`,
                dataFolderName: `${product.dataFolderName}-dev`,
                serverDataFolderName: product.serverDataFolderName ? `${product.serverDataFolderName}-dev` : undefined
            });
        }
        // Version is added during built time, but we still
        // want to have it running out of sources so we
        // read it from package.json only when we need it.
        if (!product.version) {
            const pkg = globalThis._VSCODE_PACKAGE_JSON;
            Object.assign(product, {
                version: pkg.version
            });
        }
    }
    // Web environment or unknown
    else {
        // Built time configuration (do NOT modify)
        product = { /*BUILD->INSERT_PRODUCT_CONFIGURATION*/};
        // Running out of sources
        if (Object.keys(product).length === 0) {
            Object.assign(product, {
                version: '1.87.0-dev',
                nameShort: 'Code - OSS Dev',
                nameLong: 'Code - OSS Dev',
                applicationName: 'code-oss',
                dataFolderName: '.vscode-oss',
                urlProtocol: 'code-oss',
                reportIssueUrl: 'https://github.com/microsoft/vscode/issues/new',
                licenseName: 'MIT',
                licenseUrl: 'https://github.com/microsoft/vscode/blob/main/LICENSE.txt',
                serverLicenseUrl: 'https://github.com/microsoft/vscode/blob/main/LICENSE.txt'
            });
        }
    }
    /**
     * @deprecated You MUST use `IProductService` if possible.
     */
    exports.default = product;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Byb2R1Y3QvY29tbW9uL3Byb2R1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEc7O09BRUc7SUFDSCxJQUFJLE9BQThCLENBQUM7SUFFbkMsNkJBQTZCO0lBQzdCLE1BQU0sWUFBWSxHQUFJLFVBQWtCLENBQUMsTUFBTSxDQUFDO0lBQ2hELElBQUksT0FBTyxZQUFZLEtBQUssV0FBVyxJQUFJLE9BQU8sWUFBWSxDQUFDLE9BQU8sS0FBSyxXQUFXLEVBQUUsQ0FBQztRQUN4RixNQUFNLGFBQWEsR0FBc0MsWUFBWSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUM5RixJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQ25CLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDO1FBQ2pDLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyx1RUFBdUUsQ0FBQyxDQUFDO1FBQzFGLENBQUM7SUFDRixDQUFDO0lBQ0Qsc0JBQXNCO1NBQ2pCLElBQUksVUFBVSxDQUFDLG9CQUFvQixJQUFJLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzdFLHdEQUF3RDtRQUN4RCxPQUFPLEdBQUcsVUFBVSxDQUFDLG9CQUF3RCxDQUFDO1FBRTlFLHlCQUF5QjtRQUN6QixJQUFJLGFBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO2dCQUN0QixTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsU0FBUyxNQUFNO2dCQUNyQyxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUMsUUFBUSxNQUFNO2dCQUNuQyxjQUFjLEVBQUUsR0FBRyxPQUFPLENBQUMsY0FBYyxNQUFNO2dCQUMvQyxvQkFBb0IsRUFBRSxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDdEcsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELG1EQUFtRDtRQUNuRCwrQ0FBK0M7UUFDL0Msa0RBQWtEO1FBQ2xELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEIsTUFBTSxHQUFHLEdBQUcsVUFBVSxDQUFDLG9CQUEyQyxDQUFDO1lBRW5FLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO2dCQUN0QixPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU87YUFDcEIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztJQUNGLENBQUM7SUFFRCw2QkFBNkI7U0FDeEIsQ0FBQztRQUVMLDJDQUEyQztRQUMzQyxPQUFPLEdBQUcsRUFBRSx1Q0FBdUMsQ0FBMkIsQ0FBQztRQUUvRSx5QkFBeUI7UUFDekIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtnQkFDdEIsT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFNBQVMsRUFBRSxnQkFBZ0I7Z0JBQzNCLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLGVBQWUsRUFBRSxVQUFVO2dCQUMzQixjQUFjLEVBQUUsYUFBYTtnQkFDN0IsV0FBVyxFQUFFLFVBQVU7Z0JBQ3ZCLGNBQWMsRUFBRSxnREFBZ0Q7Z0JBQ2hFLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixVQUFVLEVBQUUsMkRBQTJEO2dCQUN2RSxnQkFBZ0IsRUFBRSwyREFBMkQ7YUFDN0UsQ0FBQyxDQUFDO1FBQ0osQ0FBQztJQUNGLENBQUM7SUFFRDs7T0FFRztJQUNILGtCQUFlLE9BQU8sQ0FBQyJ9