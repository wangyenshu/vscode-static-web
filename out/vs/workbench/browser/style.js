/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/base/common/platform", "vs/base/browser/dom", "vs/base/browser/browser", "vs/platform/theme/common/colorRegistry", "vs/base/browser/window", "vs/css!./media/style"], function (require, exports, themeService_1, theme_1, platform_1, dom_1, browser_1, colorRegistry_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Background (helps for subpixel-antialiasing on Windows)
        const workbenchBackground = (0, theme_1.WORKBENCH_BACKGROUND)(theme);
        collector.addRule(`.monaco-workbench { background-color: ${workbenchBackground}; }`);
        // Selection (do NOT remove - https://github.com/microsoft/vscode/issues/169662)
        const windowSelectionBackground = theme.getColor(colorRegistry_1.selectionBackground);
        if (windowSelectionBackground) {
            collector.addRule(`.monaco-workbench ::selection { background-color: ${windowSelectionBackground}; }`);
        }
        // Update <meta name="theme-color" content=""> based on selected theme
        if (platform_1.isWeb) {
            const titleBackground = theme.getColor(theme_1.TITLE_BAR_ACTIVE_BACKGROUND);
            if (titleBackground) {
                const metaElementId = 'monaco-workbench-meta-theme-color';
                let metaElement = window_1.mainWindow.document.getElementById(metaElementId);
                if (!metaElement) {
                    metaElement = (0, dom_1.createMetaElement)();
                    metaElement.name = 'theme-color';
                    metaElement.id = metaElementId;
                }
                metaElement.content = titleBackground.toString();
            }
        }
        // We disable user select on the root element, however on Safari this seems
        // to prevent any text selection in the monaco editor. As a workaround we
        // allow to select text in monaco editor instances.
        if (browser_1.isSafari) {
            collector.addRule(`
			body.web {
				touch-action: none;
			}
			.monaco-workbench .monaco-editor .view-lines {
				user-select: text;
				-webkit-user-select: text;
			}
		`);
        }
        // Update body background color to ensure the home indicator area looks similar to the workbench
        if (platform_1.isIOS && (0, browser_1.isStandalone)()) {
            collector.addRule(`body { background-color: ${workbenchBackground}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9zdHlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxJQUFBLHlDQUEwQixFQUFDLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO1FBRS9DLDBEQUEwRDtRQUMxRCxNQUFNLG1CQUFtQixHQUFHLElBQUEsNEJBQW9CLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEQsU0FBUyxDQUFDLE9BQU8sQ0FBQyx5Q0FBeUMsbUJBQW1CLEtBQUssQ0FBQyxDQUFDO1FBRXJGLGdGQUFnRjtRQUNoRixNQUFNLHlCQUF5QixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsbUNBQW1CLENBQUMsQ0FBQztRQUN0RSxJQUFJLHlCQUF5QixFQUFFLENBQUM7WUFDL0IsU0FBUyxDQUFDLE9BQU8sQ0FBQyxxREFBcUQseUJBQXlCLEtBQUssQ0FBQyxDQUFDO1FBQ3hHLENBQUM7UUFFRCxzRUFBc0U7UUFDdEUsSUFBSSxnQkFBSyxFQUFFLENBQUM7WUFDWCxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLG1DQUEyQixDQUFDLENBQUM7WUFDcEUsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxhQUFhLEdBQUcsbUNBQW1DLENBQUM7Z0JBQzFELElBQUksV0FBVyxHQUFHLG1CQUFVLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQTJCLENBQUM7Z0JBQzlGLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDbEIsV0FBVyxHQUFHLElBQUEsdUJBQWlCLEdBQUUsQ0FBQztvQkFDbEMsV0FBVyxDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7b0JBQ2pDLFdBQVcsQ0FBQyxFQUFFLEdBQUcsYUFBYSxDQUFDO2dCQUNoQyxDQUFDO2dCQUVELFdBQVcsQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xELENBQUM7UUFDRixDQUFDO1FBRUQsMkVBQTJFO1FBQzNFLHlFQUF5RTtRQUN6RSxtREFBbUQ7UUFDbkQsSUFBSSxrQkFBUSxFQUFFLENBQUM7WUFDZCxTQUFTLENBQUMsT0FBTyxDQUFDOzs7Ozs7OztHQVFqQixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsZ0dBQWdHO1FBQ2hHLElBQUksZ0JBQUssSUFBSSxJQUFBLHNCQUFZLEdBQUUsRUFBRSxDQUFDO1lBQzdCLFNBQVMsQ0FBQyxPQUFPLENBQUMsNEJBQTRCLG1CQUFtQixLQUFLLENBQUMsQ0FBQztRQUN6RSxDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUMifQ==