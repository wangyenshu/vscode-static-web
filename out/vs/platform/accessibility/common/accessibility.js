/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ACCESSIBLE_VIEW_SHOWN_STORAGE_PREFIX = exports.CONTEXT_ACCESSIBILITY_MODE_ENABLED = exports.AccessibilitySupport = exports.IAccessibilityService = void 0;
    exports.isAccessibilityInformation = isAccessibilityInformation;
    exports.IAccessibilityService = (0, instantiation_1.createDecorator)('accessibilityService');
    var AccessibilitySupport;
    (function (AccessibilitySupport) {
        /**
         * This should be the browser case where it is not known if a screen reader is attached or no.
         */
        AccessibilitySupport[AccessibilitySupport["Unknown"] = 0] = "Unknown";
        AccessibilitySupport[AccessibilitySupport["Disabled"] = 1] = "Disabled";
        AccessibilitySupport[AccessibilitySupport["Enabled"] = 2] = "Enabled";
    })(AccessibilitySupport || (exports.AccessibilitySupport = AccessibilitySupport = {}));
    exports.CONTEXT_ACCESSIBILITY_MODE_ENABLED = new contextkey_1.RawContextKey('accessibilityModeEnabled', false);
    function isAccessibilityInformation(obj) {
        return obj && typeof obj === 'object'
            && typeof obj.label === 'string'
            && (typeof obj.role === 'undefined' || typeof obj.role === 'string');
    }
    exports.ACCESSIBLE_VIEW_SHOWN_STORAGE_PREFIX = 'ACCESSIBLE_VIEW_SHOWN_';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjY2Vzc2liaWxpdHkvY29tbW9uL2FjY2Vzc2liaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUNoRyxnRUFJQztJQXZDWSxRQUFBLHFCQUFxQixHQUFHLElBQUEsK0JBQWUsRUFBd0Isc0JBQXNCLENBQUMsQ0FBQztJQWlCcEcsSUFBa0Isb0JBU2pCO0lBVEQsV0FBa0Isb0JBQW9CO1FBQ3JDOztXQUVHO1FBQ0gscUVBQVcsQ0FBQTtRQUVYLHVFQUFZLENBQUE7UUFFWixxRUFBVyxDQUFBO0lBQ1osQ0FBQyxFQVRpQixvQkFBb0Isb0NBQXBCLG9CQUFvQixRQVNyQztJQUVZLFFBQUEsa0NBQWtDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBT2hILFNBQWdCLDBCQUEwQixDQUFDLEdBQVE7UUFDbEQsT0FBTyxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtlQUNqQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUTtlQUM3QixDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFWSxRQUFBLG9DQUFvQyxHQUFHLHdCQUF3QixDQUFDIn0=