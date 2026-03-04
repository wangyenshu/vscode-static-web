/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/severity", "vs/css!./media/severityIcon"], function (require, exports, codicons_1, themables_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SeverityIcon = void 0;
    var SeverityIcon;
    (function (SeverityIcon) {
        function className(severity) {
            switch (severity) {
                case severity_1.default.Ignore:
                    return 'severity-ignore ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info);
                case severity_1.default.Info:
                    return themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info);
                case severity_1.default.Warning:
                    return themables_1.ThemeIcon.asClassName(codicons_1.Codicon.warning);
                case severity_1.default.Error:
                    return themables_1.ThemeIcon.asClassName(codicons_1.Codicon.error);
                default:
                    return '';
            }
        }
        SeverityIcon.className = className;
    })(SeverityIcon || (exports.SeverityIcon = SeverityIcon = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V2ZXJpdHlJY29uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc2V2ZXJpdHlJY29uL2Jyb3dzZXIvc2V2ZXJpdHlJY29uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFpQixZQUFZLENBZ0I1QjtJQWhCRCxXQUFpQixZQUFZO1FBRTVCLFNBQWdCLFNBQVMsQ0FBQyxRQUFrQjtZQUMzQyxRQUFRLFFBQVEsRUFBRSxDQUFDO2dCQUNsQixLQUFLLGtCQUFRLENBQUMsTUFBTTtvQkFDbkIsT0FBTyxrQkFBa0IsR0FBRyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxrQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLGtCQUFRLENBQUMsSUFBSTtvQkFDakIsT0FBTyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxrQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxLQUFLLGtCQUFRLENBQUMsT0FBTztvQkFDcEIsT0FBTyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxrQkFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQyxLQUFLLGtCQUFRLENBQUMsS0FBSztvQkFDbEIsT0FBTyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxrQkFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QztvQkFDQyxPQUFPLEVBQUUsQ0FBQztZQUNaLENBQUM7UUFDRixDQUFDO1FBYmUsc0JBQVMsWUFheEIsQ0FBQTtJQUNGLENBQUMsRUFoQmdCLFlBQVksNEJBQVosWUFBWSxRQWdCNUIifQ==