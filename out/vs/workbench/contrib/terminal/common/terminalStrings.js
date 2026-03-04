/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.terminalStrings = void 0;
    /**
     * An object holding strings shared by multiple parts of the terminal
     */
    exports.terminalStrings = {
        terminal: (0, nls_1.localize)('terminal', "Terminal"),
        new: (0, nls_1.localize)('terminal.new', "New Terminal"),
        doNotShowAgain: (0, nls_1.localize)('doNotShowAgain', 'Do Not Show Again'),
        currentSessionCategory: (0, nls_1.localize)('currentSessionCategory', 'current session'),
        previousSessionCategory: (0, nls_1.localize)('previousSessionCategory', 'previous session'),
        typeTask: (0, nls_1.localize)('task', "Task"),
        typeLocal: (0, nls_1.localize)('local', "Local"),
        actionCategory: (0, nls_1.localize2)('terminalCategory', "Terminal"),
        focus: (0, nls_1.localize2)('workbench.action.terminal.focus', "Focus Terminal"),
        focusAndHideAccessibleBuffer: (0, nls_1.localize2)('workbench.action.terminal.focusAndHideAccessibleBuffer', "Focus Terminal and Hide Accessible Buffer"),
        kill: {
            ...(0, nls_1.localize2)('killTerminal', "Kill Terminal"),
            short: (0, nls_1.localize)('killTerminal.short', "Kill"),
        },
        moveToEditor: (0, nls_1.localize2)('moveToEditor', "Move Terminal into Editor Area"),
        moveIntoNewWindow: (0, nls_1.localize2)('moveIntoNewWindow', "Move Terminal into New Window"),
        moveToTerminalPanel: (0, nls_1.localize2)('workbench.action.terminal.moveToTerminalPanel', "Move Terminal into Panel"),
        changeIcon: (0, nls_1.localize2)('workbench.action.terminal.changeIcon', "Change Icon..."),
        changeColor: (0, nls_1.localize2)('workbench.action.terminal.changeColor', "Change Color..."),
        split: {
            ...(0, nls_1.localize2)('splitTerminal', "Split Terminal"),
            short: (0, nls_1.localize)('splitTerminal.short', "Split"),
        },
        unsplit: (0, nls_1.localize2)('unsplitTerminal', "Unsplit Terminal"),
        rename: (0, nls_1.localize2)('workbench.action.terminal.rename', "Rename..."),
        toggleSizeToContentWidth: (0, nls_1.localize2)('workbench.action.terminal.sizeToContentWidthInstance', "Toggle Size to Content Width"),
        focusHover: (0, nls_1.localize2)('workbench.action.terminal.focusHover', "Focus Hover"),
        sendSequence: (0, nls_1.localize2)('workbench.action.terminal.sendSequence', "Send Custom Sequence To Terminal"),
        newWithCwd: (0, nls_1.localize2)('workbench.action.terminal.newWithCwd', "Create New Terminal Starting in a Custom Working Directory"),
        renameWithArgs: (0, nls_1.localize2)('workbench.action.terminal.renameWithArg', "Rename the Currently Active Terminal"),
        stickyScroll: (0, nls_1.localize2)('stickyScroll', "Sticky Scroll"),
        scrollToPreviousCommand: (0, nls_1.localize2)('workbench.action.terminal.scrollToPreviousCommand', "Scroll To Previous Command"),
        scrollToNextCommand: (0, nls_1.localize2)('workbench.action.terminal.scrollToNextCommand', "Scroll To Next Command")
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdHJpbmdzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvY29tbW9uL3Rlcm1pbmFsU3RyaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEc7O09BRUc7SUFDVSxRQUFBLGVBQWUsR0FBRztRQUM5QixRQUFRLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztRQUMxQyxHQUFHLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQztRQUM3QyxjQUFjLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsbUJBQW1CLENBQUM7UUFDL0Qsc0JBQXNCLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsaUJBQWlCLENBQUM7UUFDN0UsdUJBQXVCLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsa0JBQWtCLENBQUM7UUFDaEYsUUFBUSxFQUFFLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUM7UUFDbEMsU0FBUyxFQUFFLElBQUEsY0FBUSxFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7UUFDckMsY0FBYyxFQUFFLElBQUEsZUFBUyxFQUFDLGtCQUFrQixFQUFFLFVBQVUsQ0FBQztRQUN6RCxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsaUNBQWlDLEVBQUUsZ0JBQWdCLENBQUM7UUFDckUsNEJBQTRCLEVBQUUsSUFBQSxlQUFTLEVBQUMsd0RBQXdELEVBQUUsMkNBQTJDLENBQUM7UUFDOUksSUFBSSxFQUFFO1lBQ0wsR0FBRyxJQUFBLGVBQVMsRUFBQyxjQUFjLEVBQUUsZUFBZSxDQUFDO1lBQzdDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUM7U0FDN0M7UUFDRCxZQUFZLEVBQUUsSUFBQSxlQUFTLEVBQUMsY0FBYyxFQUFFLGdDQUFnQyxDQUFDO1FBQ3pFLGlCQUFpQixFQUFFLElBQUEsZUFBUyxFQUFDLG1CQUFtQixFQUFFLCtCQUErQixDQUFDO1FBQ2xGLG1CQUFtQixFQUFFLElBQUEsZUFBUyxFQUFDLCtDQUErQyxFQUFFLDBCQUEwQixDQUFDO1FBQzNHLFVBQVUsRUFBRSxJQUFBLGVBQVMsRUFBQyxzQ0FBc0MsRUFBRSxnQkFBZ0IsQ0FBQztRQUMvRSxXQUFXLEVBQUUsSUFBQSxlQUFTLEVBQUMsdUNBQXVDLEVBQUUsaUJBQWlCLENBQUM7UUFDbEYsS0FBSyxFQUFFO1lBQ04sR0FBRyxJQUFBLGVBQVMsRUFBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUM7WUFDL0MsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLE9BQU8sQ0FBQztTQUMvQztRQUNELE9BQU8sRUFBRSxJQUFBLGVBQVMsRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQztRQUN6RCxNQUFNLEVBQUUsSUFBQSxlQUFTLEVBQUMsa0NBQWtDLEVBQUUsV0FBVyxDQUFDO1FBQ2xFLHdCQUF3QixFQUFFLElBQUEsZUFBUyxFQUFDLHNEQUFzRCxFQUFFLDhCQUE4QixDQUFDO1FBQzNILFVBQVUsRUFBRSxJQUFBLGVBQVMsRUFBQyxzQ0FBc0MsRUFBRSxhQUFhLENBQUM7UUFDNUUsWUFBWSxFQUFFLElBQUEsZUFBUyxFQUFDLHdDQUF3QyxFQUFFLGtDQUFrQyxDQUFDO1FBQ3JHLFVBQVUsRUFBRSxJQUFBLGVBQVMsRUFBQyxzQ0FBc0MsRUFBRSw0REFBNEQsQ0FBQztRQUMzSCxjQUFjLEVBQUUsSUFBQSxlQUFTLEVBQUMseUNBQXlDLEVBQUUsc0NBQXNDLENBQUM7UUFDNUcsWUFBWSxFQUFFLElBQUEsZUFBUyxFQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7UUFDeEQsdUJBQXVCLEVBQUUsSUFBQSxlQUFTLEVBQUMsbURBQW1ELEVBQUUsNEJBQTRCLENBQUM7UUFDckgsbUJBQW1CLEVBQUUsSUFBQSxlQUFTLEVBQUMsK0NBQStDLEVBQUUsd0JBQXdCLENBQUM7S0FDekcsQ0FBQyJ9