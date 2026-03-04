/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setBaseLayerHoverDelegate = setBaseLayerHoverDelegate;
    exports.getBaseLayerHoverDelegate = getBaseLayerHoverDelegate;
    let baseHoverDelegate = {
        showHover: () => undefined,
        hideHover: () => undefined,
        showAndFocusLastHover: () => undefined,
        setupUpdatableHover: () => null,
    };
    /**
     * Sets the hover delegate for use **only in the `base/` layer**.
     */
    function setBaseLayerHoverDelegate(hoverDelegate) {
        baseHoverDelegate = hoverDelegate;
    }
    /**
     * Gets the hover delegate for use **only in the `base/` layer**.
     *
     * Since the hover service depends on various platform services, this delegate essentially bypasses
     * the standard dependency injection mechanism by injecting a global hover service at start up. The
     * only reason this should be used is if `IHoverService` is not available.
     */
    function getBaseLayerHoverDelegate() {
        return baseHoverDelegate;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJEZWxlZ2F0ZTIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvaG92ZXIvaG92ZXJEZWxlZ2F0ZTIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsOERBRUM7SUFTRCw4REFFQztJQXZCRCxJQUFJLGlCQUFpQixHQUFvQjtRQUN4QyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztRQUMxQixTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztRQUMxQixxQkFBcUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO1FBQ3RDLG1CQUFtQixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUs7S0FDaEMsQ0FBQztJQUVGOztPQUVHO0lBQ0gsU0FBZ0IseUJBQXlCLENBQUMsYUFBOEI7UUFDdkUsaUJBQWlCLEdBQUcsYUFBYSxDQUFDO0lBQ25DLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxTQUFnQix5QkFBeUI7UUFDeEMsT0FBTyxpQkFBaUIsQ0FBQztJQUMxQixDQUFDIn0=