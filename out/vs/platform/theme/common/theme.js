/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorScheme = void 0;
    exports.isHighContrast = isHighContrast;
    exports.isDark = isDark;
    /**
     * Color scheme used by the OS and by color themes.
     */
    var ColorScheme;
    (function (ColorScheme) {
        ColorScheme["DARK"] = "dark";
        ColorScheme["LIGHT"] = "light";
        ColorScheme["HIGH_CONTRAST_DARK"] = "hcDark";
        ColorScheme["HIGH_CONTRAST_LIGHT"] = "hcLight";
    })(ColorScheme || (exports.ColorScheme = ColorScheme = {}));
    function isHighContrast(scheme) {
        return scheme === ColorScheme.HIGH_CONTRAST_DARK || scheme === ColorScheme.HIGH_CONTRAST_LIGHT;
    }
    function isDark(scheme) {
        return scheme === ColorScheme.DARK || scheme === ColorScheme.HIGH_CONTRAST_DARK;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90aGVtZS9jb21tb24vdGhlbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLHdDQUVDO0lBRUQsd0JBRUM7SUFoQkQ7O09BRUc7SUFDSCxJQUFZLFdBS1g7SUFMRCxXQUFZLFdBQVc7UUFDdEIsNEJBQWEsQ0FBQTtRQUNiLDhCQUFlLENBQUE7UUFDZiw0Q0FBNkIsQ0FBQTtRQUM3Qiw4Q0FBK0IsQ0FBQTtJQUNoQyxDQUFDLEVBTFcsV0FBVywyQkFBWCxXQUFXLFFBS3RCO0lBRUQsU0FBZ0IsY0FBYyxDQUFDLE1BQW1CO1FBQ2pELE9BQU8sTUFBTSxLQUFLLFdBQVcsQ0FBQyxrQkFBa0IsSUFBSSxNQUFNLEtBQUssV0FBVyxDQUFDLG1CQUFtQixDQUFDO0lBQ2hHLENBQUM7SUFFRCxTQUFnQixNQUFNLENBQUMsTUFBbUI7UUFDekMsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLElBQUksSUFBSSxNQUFNLEtBQUssV0FBVyxDQUFDLGtCQUFrQixDQUFDO0lBQ2pGLENBQUMifQ==