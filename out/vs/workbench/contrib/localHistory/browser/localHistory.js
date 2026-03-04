/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls_1, codicons_1, platform_1, contextkey_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LOCAL_HISTORY_ICON_RESTORE = exports.LOCAL_HISTORY_ICON_ENTRY = exports.LOCAL_HISTORY_MENU_CONTEXT_KEY = exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE = void 0;
    exports.getLocalHistoryDateFormatter = getLocalHistoryDateFormatter;
    let localHistoryDateFormatter = undefined;
    function getLocalHistoryDateFormatter() {
        if (!localHistoryDateFormatter) {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
            let formatter;
            try {
                formatter = new Intl.DateTimeFormat(platform_1.language, options);
            }
            catch (error) {
                formatter = new Intl.DateTimeFormat(undefined, options); // error can happen when language is invalid (https://github.com/microsoft/vscode/issues/147086)
            }
            localHistoryDateFormatter = {
                format: date => formatter.format(date)
            };
        }
        return localHistoryDateFormatter;
    }
    exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE = 'localHistory:item';
    exports.LOCAL_HISTORY_MENU_CONTEXT_KEY = contextkey_1.ContextKeyExpr.equals('timelineItem', exports.LOCAL_HISTORY_MENU_CONTEXT_VALUE);
    exports.LOCAL_HISTORY_ICON_ENTRY = (0, iconRegistry_1.registerIcon)('localHistory-icon', codicons_1.Codicon.circleOutline, (0, nls_1.localize)('localHistoryIcon', "Icon for a local history entry in the timeline view."));
    exports.LOCAL_HISTORY_ICON_RESTORE = (0, iconRegistry_1.registerIcon)('localHistory-restore', codicons_1.Codicon.check, (0, nls_1.localize)('localHistoryRestore', "Icon for restoring contents of a local history entry."));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbG9jYWxIaXN0b3J5L2Jyb3dzZXIvbG9jYWxIaXN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxvRUFpQkM7SUFuQkQsSUFBSSx5QkFBeUIsR0FBMkMsU0FBUyxDQUFDO0lBRWxGLFNBQWdCLDRCQUE0QjtRQUMzQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUNoQyxNQUFNLE9BQU8sR0FBK0IsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUVuSSxJQUFJLFNBQThCLENBQUM7WUFDbkMsSUFBSSxDQUFDO2dCQUNKLFNBQVMsR0FBRyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxnR0FBZ0c7WUFDMUosQ0FBQztZQUVELHlCQUF5QixHQUFHO2dCQUMzQixNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQzthQUN0QyxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8seUJBQXlCLENBQUM7SUFDbEMsQ0FBQztJQUVZLFFBQUEsZ0NBQWdDLEdBQUcsbUJBQW1CLENBQUM7SUFDdkQsUUFBQSw4QkFBOEIsR0FBRywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsd0NBQWdDLENBQUMsQ0FBQztJQUV6RyxRQUFBLHdCQUF3QixHQUFHLElBQUEsMkJBQVksRUFBQyxtQkFBbUIsRUFBRSxrQkFBTyxDQUFDLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxzREFBc0QsQ0FBQyxDQUFDLENBQUM7SUFDMUssUUFBQSwwQkFBMEIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsc0JBQXNCLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsdURBQXVELENBQUMsQ0FBQyxDQUFDIn0=