/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneServicesNLS = exports.ToggleHighContrastNLS = exports.StandaloneCodeEditorNLS = exports.QuickOutlineNLS = exports.QuickCommandNLS = exports.QuickHelpNLS = exports.GoToLineNLS = exports.InspectTokensNLS = exports.AccessibilityHelpNLS = void 0;
    var AccessibilityHelpNLS;
    (function (AccessibilityHelpNLS) {
        AccessibilityHelpNLS.accessibilityHelpTitle = nls.localize('accessibilityHelpTitle', "Accessibility Help");
        AccessibilityHelpNLS.openingDocs = nls.localize("openingDocs", "Opening the Accessibility documentation page.");
        AccessibilityHelpNLS.readonlyDiffEditor = nls.localize("readonlyDiffEditor", "You are in a read-only pane of a diff editor.");
        AccessibilityHelpNLS.editableDiffEditor = nls.localize("editableDiffEditor", "You are in a pane of a diff editor.");
        AccessibilityHelpNLS.readonlyEditor = nls.localize("readonlyEditor", "You are in a read-only code editor.");
        AccessibilityHelpNLS.editableEditor = nls.localize("editableEditor", "You are in a code editor.");
        AccessibilityHelpNLS.changeConfigToOnMac = nls.localize("changeConfigToOnMac", "Configure the application to be optimized for usage with a Screen Reader (Command+E).");
        AccessibilityHelpNLS.changeConfigToOnWinLinux = nls.localize("changeConfigToOnWinLinux", "Configure the application to be optimized for usage with a Screen Reader (Control+E).");
        AccessibilityHelpNLS.auto_on = nls.localize("auto_on", "The application is configured to be optimized for usage with a Screen Reader.");
        AccessibilityHelpNLS.auto_off = nls.localize("auto_off", "The application is configured to never be optimized for usage with a Screen Reader.");
        AccessibilityHelpNLS.screenReaderModeEnabled = nls.localize("screenReaderModeEnabled", "Screen Reader Optimized Mode enabled.");
        AccessibilityHelpNLS.screenReaderModeDisabled = nls.localize("screenReaderModeDisabled", "Screen Reader Optimized Mode disabled.");
        AccessibilityHelpNLS.tabFocusModeOnMsg = nls.localize("tabFocusModeOnMsg", "Pressing Tab in the current editor will move focus to the next focusable element. Toggle this behavior {0}.");
        AccessibilityHelpNLS.tabFocusModeOnMsgNoKb = nls.localize("tabFocusModeOnMsgNoKb", "Pressing Tab in the current editor will move focus to the next focusable element. The command {0} is currently not triggerable by a keybinding.");
        AccessibilityHelpNLS.stickScrollKb = nls.localize("stickScrollKb", "Focus Sticky Scroll ({0}) to focus the currently nested scopes.");
        AccessibilityHelpNLS.stickScrollNoKb = nls.localize("stickScrollNoKb", "Focus Sticky Scroll to focus the currently nested scopes. It is currently not triggerable by a keybinding.");
        AccessibilityHelpNLS.tabFocusModeOffMsg = nls.localize("tabFocusModeOffMsg", "Pressing Tab in the current editor will insert the tab character. Toggle this behavior {0}.");
        AccessibilityHelpNLS.tabFocusModeOffMsgNoKb = nls.localize("tabFocusModeOffMsgNoKb", "Pressing Tab in the current editor will insert the tab character. The command {0} is currently not triggerable by a keybinding.");
        AccessibilityHelpNLS.showAccessibilityHelpAction = nls.localize("showAccessibilityHelpAction", "Show Accessibility Help");
        AccessibilityHelpNLS.listSignalSounds = nls.localize("listSignalSoundsCommand", "Run the command: List Signal Sounds for an overview of all sounds and their current status.");
        AccessibilityHelpNLS.listAlerts = nls.localize("listAnnouncementsCommand", "Run the command: List Signal Announcements for an overview of announcements and their current status.");
        AccessibilityHelpNLS.quickChat = nls.localize("quickChatCommand", "Toggle quick chat ({0}) to open or close a chat session.");
        AccessibilityHelpNLS.quickChatNoKb = nls.localize("quickChatCommandNoKb", "Toggle quick chat is not currently triggerable by a keybinding.");
        AccessibilityHelpNLS.startInlineChat = nls.localize("startInlineChatCommand", "Start inline chat ({0}) to create an in editor chat session.");
        AccessibilityHelpNLS.startInlineChatNoKb = nls.localize("startInlineChatCommandNoKb", "The command: Start inline chat is not currentlyt riggerable by a keybinding.");
    })(AccessibilityHelpNLS || (exports.AccessibilityHelpNLS = AccessibilityHelpNLS = {}));
    var InspectTokensNLS;
    (function (InspectTokensNLS) {
        InspectTokensNLS.inspectTokensAction = nls.localize('inspectTokens', "Developer: Inspect Tokens");
    })(InspectTokensNLS || (exports.InspectTokensNLS = InspectTokensNLS = {}));
    var GoToLineNLS;
    (function (GoToLineNLS) {
        GoToLineNLS.gotoLineActionLabel = nls.localize('gotoLineActionLabel', "Go to Line/Column...");
    })(GoToLineNLS || (exports.GoToLineNLS = GoToLineNLS = {}));
    var QuickHelpNLS;
    (function (QuickHelpNLS) {
        QuickHelpNLS.helpQuickAccessActionLabel = nls.localize('helpQuickAccess', "Show all Quick Access Providers");
    })(QuickHelpNLS || (exports.QuickHelpNLS = QuickHelpNLS = {}));
    var QuickCommandNLS;
    (function (QuickCommandNLS) {
        QuickCommandNLS.quickCommandActionLabel = nls.localize('quickCommandActionLabel', "Command Palette");
        QuickCommandNLS.quickCommandHelp = nls.localize('quickCommandActionHelp', "Show And Run Commands");
    })(QuickCommandNLS || (exports.QuickCommandNLS = QuickCommandNLS = {}));
    var QuickOutlineNLS;
    (function (QuickOutlineNLS) {
        QuickOutlineNLS.quickOutlineActionLabel = nls.localize('quickOutlineActionLabel', "Go to Symbol...");
        QuickOutlineNLS.quickOutlineByCategoryActionLabel = nls.localize('quickOutlineByCategoryActionLabel', "Go to Symbol by Category...");
    })(QuickOutlineNLS || (exports.QuickOutlineNLS = QuickOutlineNLS = {}));
    var StandaloneCodeEditorNLS;
    (function (StandaloneCodeEditorNLS) {
        StandaloneCodeEditorNLS.editorViewAccessibleLabel = nls.localize('editorViewAccessibleLabel', "Editor content");
        StandaloneCodeEditorNLS.accessibilityHelpMessage = nls.localize('accessibilityHelpMessage', "Press Alt+F1 for Accessibility Options.");
    })(StandaloneCodeEditorNLS || (exports.StandaloneCodeEditorNLS = StandaloneCodeEditorNLS = {}));
    var ToggleHighContrastNLS;
    (function (ToggleHighContrastNLS) {
        ToggleHighContrastNLS.toggleHighContrast = nls.localize('toggleHighContrast', "Toggle High Contrast Theme");
    })(ToggleHighContrastNLS || (exports.ToggleHighContrastNLS = ToggleHighContrastNLS = {}));
    var StandaloneServicesNLS;
    (function (StandaloneServicesNLS) {
        StandaloneServicesNLS.bulkEditServiceSummary = nls.localize('bulkEditServiceSummary', "Made {0} edits in {1} files");
    })(StandaloneServicesNLS || (exports.StandaloneServicesNLS = StandaloneServicesNLS = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVN0cmluZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3N0YW5kYWxvbmVTdHJpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxJQUFpQixvQkFBb0IsQ0EwQnBDO0lBMUJELFdBQWlCLG9CQUFvQjtRQUN2QiwyQ0FBc0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDdEYsZ0NBQVcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO1FBQzNGLHVDQUFrQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsK0NBQStDLENBQUMsQ0FBQztRQUN6Ryx1Q0FBa0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLHFDQUFxQyxDQUFDLENBQUM7UUFDL0YsbUNBQWMsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLHFDQUFxQyxDQUFDLENBQUM7UUFDdkYsbUNBQWMsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLDJCQUEyQixDQUFDLENBQUM7UUFDN0Usd0NBQW1CLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSx1RkFBdUYsQ0FBQyxDQUFDO1FBQ25KLDZDQUF3QixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsdUZBQXVGLENBQUMsQ0FBQztRQUM3Siw0QkFBTyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLCtFQUErRSxDQUFDLENBQUM7UUFDbkgsNkJBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxxRkFBcUYsQ0FBQyxDQUFDO1FBQzNILDRDQUF1QixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMseUJBQXlCLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztRQUMzRyw2Q0FBd0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFLHdDQUF3QyxDQUFDLENBQUM7UUFDOUcsc0NBQWlCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSw2R0FBNkcsQ0FBQyxDQUFDO1FBQ3JLLDBDQUFxQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsaUpBQWlKLENBQUMsQ0FBQztRQUNqTixrQ0FBYSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLGlFQUFpRSxDQUFDLENBQUM7UUFDakgsb0NBQWUsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLDRHQUE0RyxDQUFDLENBQUM7UUFDaEssdUNBQWtCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSw2RkFBNkYsQ0FBQyxDQUFDO1FBQ3ZKLDJDQUFzQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEVBQUUsaUlBQWlJLENBQUMsQ0FBQztRQUNuTSxnREFBMkIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDZCQUE2QixFQUFFLHlCQUF5QixDQUFDLENBQUM7UUFDckcscUNBQWdCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSw2RkFBNkYsQ0FBQyxDQUFDO1FBQzFKLCtCQUFVLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSx1R0FBdUcsQ0FBQyxDQUFDO1FBQy9KLDhCQUFTLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSwwREFBMEQsQ0FBQyxDQUFDO1FBQ3pHLGtDQUFhLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxpRUFBaUUsQ0FBQyxDQUFDO1FBQ3hILG9DQUFlLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSw4REFBOEQsQ0FBQyxDQUFDO1FBQ3pILHdDQUFtQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsOEVBQThFLENBQUMsQ0FBQztJQUMvSixDQUFDLEVBMUJnQixvQkFBb0Isb0NBQXBCLG9CQUFvQixRQTBCcEM7SUFFRCxJQUFpQixnQkFBZ0IsQ0FFaEM7SUFGRCxXQUFpQixnQkFBZ0I7UUFDbkIsb0NBQW1CLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztJQUMvRixDQUFDLEVBRmdCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBRWhDO0lBRUQsSUFBaUIsV0FBVyxDQUUzQjtJQUZELFdBQWlCLFdBQVc7UUFDZCwrQkFBbUIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLHNCQUFzQixDQUFDLENBQUM7SUFDaEcsQ0FBQyxFQUZnQixXQUFXLDJCQUFYLFdBQVcsUUFFM0I7SUFFRCxJQUFpQixZQUFZLENBRTVCO0lBRkQsV0FBaUIsWUFBWTtRQUNmLHVDQUEwQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztJQUM5RyxDQUFDLEVBRmdCLFlBQVksNEJBQVosWUFBWSxRQUU1QjtJQUVELElBQWlCLGVBQWUsQ0FHL0I7SUFIRCxXQUFpQixlQUFlO1FBQ2xCLHVDQUF1QixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMseUJBQXlCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNyRixnQ0FBZ0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLHVCQUF1QixDQUFDLENBQUM7SUFDakcsQ0FBQyxFQUhnQixlQUFlLCtCQUFmLGVBQWUsUUFHL0I7SUFFRCxJQUFpQixlQUFlLENBRy9CO0lBSEQsV0FBaUIsZUFBZTtRQUNsQix1Q0FBdUIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDckYsaURBQWlDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQ0FBbUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ25JLENBQUMsRUFIZ0IsZUFBZSwrQkFBZixlQUFlLFFBRy9CO0lBRUQsSUFBaUIsdUJBQXVCLENBR3ZDO0lBSEQsV0FBaUIsdUJBQXVCO1FBQzFCLGlEQUF5QixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RixnREFBd0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFLHlDQUF5QyxDQUFDLENBQUM7SUFDN0gsQ0FBQyxFQUhnQix1QkFBdUIsdUNBQXZCLHVCQUF1QixRQUd2QztJQUVELElBQWlCLHFCQUFxQixDQUVyQztJQUZELFdBQWlCLHFCQUFxQjtRQUN4Qix3Q0FBa0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFDcEcsQ0FBQyxFQUZnQixxQkFBcUIscUNBQXJCLHFCQUFxQixRQUVyQztJQUVELElBQWlCLHFCQUFxQixDQUVyQztJQUZELFdBQWlCLHFCQUFxQjtRQUN4Qiw0Q0FBc0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDN0csQ0FBQyxFQUZnQixxQkFBcUIscUNBQXJCLHFCQUFxQixRQUVyQyJ9