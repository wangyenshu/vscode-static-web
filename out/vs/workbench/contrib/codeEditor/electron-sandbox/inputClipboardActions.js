/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/platform", "vs/base/browser/dom"], function (require, exports, keybindingsRegistry_1, platform, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    if (platform.isMacintosh) {
        // On the mac, cmd+x, cmd+c and cmd+v do not result in cut / copy / paste
        // We therefore add a basic keybinding rule that invokes document.execCommand
        // This is to cover <input>s...
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execCut',
            primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
            handler: bindExecuteCommand('cut'),
            weight: 0,
            when: undefined,
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execCopy',
            primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
            handler: bindExecuteCommand('copy'),
            weight: 0,
            when: undefined,
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execPaste',
            primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
            handler: bindExecuteCommand('paste'),
            weight: 0,
            when: undefined,
        });
        function bindExecuteCommand(command) {
            return () => {
                (0, dom_1.getActiveWindow)().document.execCommand(command);
            };
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRDbGlwYm9hcmRBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9lbGVjdHJvbi1zYW5kYm94L2lucHV0Q2xpcGJvYXJkQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUUxQix5RUFBeUU7UUFDekUsNkVBQTZFO1FBQzdFLCtCQUErQjtRQUUvQix5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztZQUNwRCxFQUFFLEVBQUUsU0FBUztZQUNiLE9BQU8sRUFBRSxpREFBNkI7WUFDdEMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUNsQyxNQUFNLEVBQUUsQ0FBQztZQUNULElBQUksRUFBRSxTQUFTO1NBQ2YsQ0FBQyxDQUFDO1FBQ0gseUNBQW1CLENBQUMsZ0NBQWdDLENBQUM7WUFDcEQsRUFBRSxFQUFFLFVBQVU7WUFDZCxPQUFPLEVBQUUsaURBQTZCO1lBQ3RDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7WUFDbkMsTUFBTSxFQUFFLENBQUM7WUFDVCxJQUFJLEVBQUUsU0FBUztTQUNmLENBQUMsQ0FBQztRQUNILHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1lBQ3BELEVBQUUsRUFBRSxXQUFXO1lBQ2YsT0FBTyxFQUFFLGlEQUE2QjtZQUN0QyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsT0FBTyxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxDQUFDO1lBQ1QsSUFBSSxFQUFFLFNBQVM7U0FDZixDQUFDLENBQUM7UUFFSCxTQUFTLGtCQUFrQixDQUFDLE9BQWlDO1lBQzVELE9BQU8sR0FBRyxFQUFFO2dCQUNYLElBQUEscUJBQWUsR0FBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDO1FBQ0gsQ0FBQztJQUNGLENBQUMifQ==