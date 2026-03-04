/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/editor/browser/editorExtensions", "vs/platform/actions/common/actions"], function (require, exports, commands_1, arrays_1, editorExtensions_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAllUnboundCommands = getAllUnboundCommands;
    function getAllUnboundCommands(boundCommands) {
        const unboundCommands = [];
        const seenMap = new Map();
        const addCommand = (id, includeCommandWithArgs) => {
            if (seenMap.has(id)) {
                return;
            }
            seenMap.set(id, true);
            if (id[0] === '_' || id.indexOf('vscode.') === 0) { // private command
                return;
            }
            if (boundCommands.get(id) === true) {
                return;
            }
            if (!includeCommandWithArgs) {
                const command = commands_1.CommandsRegistry.getCommand(id);
                if (command && typeof command.metadata === 'object'
                    && (0, arrays_1.isNonEmptyArray)(command.metadata.args)) { // command with args
                    return;
                }
            }
            unboundCommands.push(id);
        };
        // Add all commands from Command Palette
        for (const menuItem of actions_1.MenuRegistry.getMenuItems(actions_1.MenuId.CommandPalette)) {
            if ((0, actions_1.isIMenuItem)(menuItem)) {
                addCommand(menuItem.command.id, true);
            }
        }
        // Add all editor actions
        for (const editorAction of editorExtensions_1.EditorExtensionsRegistry.getEditorActions()) {
            addCommand(editorAction.id, true);
        }
        for (const id of commands_1.CommandsRegistry.getCommands().keys()) {
            addCommand(id, false);
        }
        return unboundCommands;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5ib3VuZENvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2tleWJpbmRpbmcvYnJvd3Nlci91bmJvdW5kQ29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsc0RBeUNDO0lBekNELFNBQWdCLHFCQUFxQixDQUFDLGFBQW1DO1FBQ3hFLE1BQU0sZUFBZSxHQUFhLEVBQUUsQ0FBQztRQUNyQyxNQUFNLE9BQU8sR0FBeUIsSUFBSSxHQUFHLEVBQW1CLENBQUM7UUFDakUsTUFBTSxVQUFVLEdBQUcsQ0FBQyxFQUFVLEVBQUUsc0JBQStCLEVBQUUsRUFBRTtZQUNsRSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QixJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQjtnQkFDckUsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzdCLE1BQU0sT0FBTyxHQUFHLDJCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxPQUFPLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVE7dUJBQy9DLElBQUEsd0JBQWUsRUFBb0IsT0FBTyxDQUFDLFFBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsb0JBQW9CO29CQUNyRixPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBQ0QsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUM7UUFFRix3Q0FBd0M7UUFDeEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxzQkFBWSxDQUFDLFlBQVksQ0FBQyxnQkFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7WUFDekUsSUFBSSxJQUFBLHFCQUFXLEVBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7UUFDRixDQUFDO1FBRUQseUJBQXlCO1FBQ3pCLEtBQUssTUFBTSxZQUFZLElBQUksMkNBQXdCLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDO1lBQ3hFLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxLQUFLLE1BQU0sRUFBRSxJQUFJLDJCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7WUFDeEQsVUFBVSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBRUQsT0FBTyxlQUFlLENBQUM7SUFDeEIsQ0FBQyJ9