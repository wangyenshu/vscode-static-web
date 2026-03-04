/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/cursor/cursorWordOperations", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/wordOperations/browser/wordOperations", "vs/platform/commands/common/commands"], function (require, exports, editorExtensions_1, cursorWordOperations_1, range_1, editorContextKeys_1, wordOperations_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorWordPartRightSelect = exports.CursorWordPartRight = exports.WordPartRightCommand = exports.CursorWordPartLeftSelect = exports.CursorWordPartLeft = exports.WordPartLeftCommand = exports.DeleteWordPartRight = exports.DeleteWordPartLeft = void 0;
    class DeleteWordPartLeft extends wordOperations_1.DeleteWordCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'deleteWordPartLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _delete(ctx, wordNavigationType) {
            const r = cursorWordOperations_1.WordPartOperations.deleteWordPartLeft(ctx);
            if (r) {
                return r;
            }
            return new range_1.Range(1, 1, 1, 1);
        }
    }
    exports.DeleteWordPartLeft = DeleteWordPartLeft;
    class DeleteWordPartRight extends wordOperations_1.DeleteWordCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'deleteWordPartRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _delete(ctx, wordNavigationType) {
            const r = cursorWordOperations_1.WordPartOperations.deleteWordPartRight(ctx);
            if (r) {
                return r;
            }
            const lineCount = ctx.model.getLineCount();
            const maxColumn = ctx.model.getLineMaxColumn(lineCount);
            return new range_1.Range(lineCount, maxColumn, lineCount, maxColumn);
        }
    }
    exports.DeleteWordPartRight = DeleteWordPartRight;
    class WordPartLeftCommand extends wordOperations_1.MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordPartOperations.moveWordPartLeft(wordSeparators, model, position);
        }
    }
    exports.WordPartLeftCommand = WordPartLeftCommand;
    class CursorWordPartLeft extends WordPartLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordPartLeft',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartLeft = CursorWordPartLeft;
    // Register previous id for compatibility purposes
    commands_1.CommandsRegistry.registerCommandAlias('cursorWordPartStartLeft', 'cursorWordPartLeft');
    class CursorWordPartLeftSelect extends WordPartLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordPartLeftSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartLeftSelect = CursorWordPartLeftSelect;
    // Register previous id for compatibility purposes
    commands_1.CommandsRegistry.registerCommandAlias('cursorWordPartStartLeftSelect', 'cursorWordPartLeftSelect');
    class WordPartRightCommand extends wordOperations_1.MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordPartOperations.moveWordPartRight(wordSeparators, model, position);
        }
    }
    exports.WordPartRightCommand = WordPartRightCommand;
    class CursorWordPartRight extends WordPartRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordPartRight',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartRight = CursorWordPartRight;
    class CursorWordPartRightSelect extends WordPartRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordPartRightSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordPartRightSelect = CursorWordPartRightSelect;
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordPartLeft());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordPartRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartLeft());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartLeftSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordPartRightSelect());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZFBhcnRPcGVyYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvd29yZFBhcnRPcGVyYXRpb25zL2Jyb3dzZXIvd29yZFBhcnRPcGVyYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFhLGtCQUFtQixTQUFRLGtDQUFpQjtRQUN4RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxvQkFBb0IsRUFBRSxJQUFJO2dCQUMxQixrQkFBa0Isc0NBQThCO2dCQUNoRCxFQUFFLEVBQUUsb0JBQW9CO2dCQUN4QixZQUFZLEVBQUUscUNBQWlCLENBQUMsUUFBUTtnQkFDeEMsTUFBTSxFQUFFO29CQUNQLE1BQU0sRUFBRSxxQ0FBaUIsQ0FBQyxjQUFjO29CQUN4QyxPQUFPLEVBQUUsQ0FBQztvQkFDVixHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsK0NBQTJCLDRCQUFvQixFQUFFO29CQUNqRSxNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVMsT0FBTyxDQUFDLEdBQXNCLEVBQUUsa0JBQXNDO1lBQy9FLE1BQU0sQ0FBQyxHQUFHLHlDQUFrQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ1AsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsT0FBTyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QixDQUFDO0tBQ0Q7SUF2QkQsZ0RBdUJDO0lBRUQsTUFBYSxtQkFBb0IsU0FBUSxrQ0FBaUI7UUFDekQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsb0JBQW9CLEVBQUUsSUFBSTtnQkFDMUIsa0JBQWtCLG9DQUE0QjtnQkFDOUMsRUFBRSxFQUFFLHFCQUFxQjtnQkFDekIsWUFBWSxFQUFFLHFDQUFpQixDQUFDLFFBQVE7Z0JBQ3hDLE1BQU0sRUFBRTtvQkFDUCxNQUFNLEVBQUUscUNBQWlCLENBQUMsY0FBYztvQkFDeEMsT0FBTyxFQUFFLENBQUM7b0JBQ1YsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLCtDQUEyQiwwQkFBaUIsRUFBRTtvQkFDOUQsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVTLE9BQU8sQ0FBQyxHQUFzQixFQUFFLGtCQUFzQztZQUMvRSxNQUFNLENBQUMsR0FBRyx5Q0FBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNQLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDM0MsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4RCxPQUFPLElBQUksYUFBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELENBQUM7S0FDRDtJQXpCRCxrREF5QkM7SUFFRCxNQUFhLG1CQUFvQixTQUFRLGdDQUFlO1FBQzdDLEtBQUssQ0FBQyxjQUF1QyxFQUFFLEtBQWlCLEVBQUUsUUFBa0IsRUFBRSxrQkFBc0M7WUFDckksT0FBTyx5Q0FBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdFLENBQUM7S0FDRDtJQUpELGtEQUlDO0lBQ0QsTUFBYSxrQkFBbUIsU0FBUSxtQkFBbUI7UUFDMUQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLGtCQUFrQixzQ0FBOEI7Z0JBQ2hELEVBQUUsRUFBRSxvQkFBb0I7Z0JBQ3hCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLHFDQUFpQixDQUFDLGNBQWM7b0JBQ3hDLE9BQU8sRUFBRSxDQUFDO29CQUNWLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSwrQ0FBMkIsNkJBQW9CLEVBQUU7b0JBQ2pFLE1BQU0sMENBQWdDO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQWZELGdEQWVDO0lBQ0Qsa0RBQWtEO0lBQ2xELDJCQUFnQixDQUFDLG9CQUFvQixDQUFDLHlCQUF5QixFQUFFLG9CQUFvQixDQUFDLENBQUM7SUFFdkYsTUFBYSx3QkFBeUIsU0FBUSxtQkFBbUI7UUFDaEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGtCQUFrQixzQ0FBOEI7Z0JBQ2hELEVBQUUsRUFBRSwwQkFBMEI7Z0JBQzlCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLHFDQUFpQixDQUFDLGNBQWM7b0JBQ3hDLE9BQU8sRUFBRSxDQUFDO29CQUNWLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSwrQ0FBMkIsMEJBQWUsNkJBQW9CLEVBQUU7b0JBQ2hGLE1BQU0sMENBQWdDO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQWZELDREQWVDO0lBQ0Qsa0RBQWtEO0lBQ2xELDJCQUFnQixDQUFDLG9CQUFvQixDQUFDLCtCQUErQixFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFFbkcsTUFBYSxvQkFBcUIsU0FBUSxnQ0FBZTtRQUM5QyxLQUFLLENBQUMsY0FBdUMsRUFBRSxLQUFpQixFQUFFLFFBQWtCLEVBQUUsa0JBQXNDO1lBQ3JJLE9BQU8seUNBQWtCLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5RSxDQUFDO0tBQ0Q7SUFKRCxvREFJQztJQUNELE1BQWEsbUJBQW9CLFNBQVEsb0JBQW9CO1FBQzVEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixrQkFBa0Isb0NBQTRCO2dCQUM5QyxFQUFFLEVBQUUscUJBQXFCO2dCQUN6QixZQUFZLEVBQUUsU0FBUztnQkFDdkIsTUFBTSxFQUFFO29CQUNQLE1BQU0sRUFBRSxxQ0FBaUIsQ0FBQyxjQUFjO29CQUN4QyxPQUFPLEVBQUUsQ0FBQztvQkFDVixHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsK0NBQTJCLDhCQUFxQixFQUFFO29CQUNsRSxNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFmRCxrREFlQztJQUNELE1BQWEseUJBQTBCLFNBQVEsb0JBQW9CO1FBQ2xFO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLGVBQWUsRUFBRSxJQUFJO2dCQUNyQixrQkFBa0Isb0NBQTRCO2dCQUM5QyxFQUFFLEVBQUUsMkJBQTJCO2dCQUMvQixZQUFZLEVBQUUsU0FBUztnQkFDdkIsTUFBTSxFQUFFO29CQUNQLE1BQU0sRUFBRSxxQ0FBaUIsQ0FBQyxjQUFjO29CQUN4QyxPQUFPLEVBQUUsQ0FBQztvQkFDVixHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsK0NBQTJCLDBCQUFlLDhCQUFxQixFQUFFO29CQUNqRixNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFmRCw4REFlQztJQUdELElBQUEsd0NBQXFCLEVBQUMsSUFBSSxrQkFBa0IsRUFBRSxDQUFDLENBQUM7SUFDaEQsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLG1CQUFtQixFQUFFLENBQUMsQ0FBQztJQUNqRCxJQUFBLHdDQUFxQixFQUFDLElBQUksa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELElBQUEsd0NBQXFCLEVBQUMsSUFBSSx3QkFBd0IsRUFBRSxDQUFDLENBQUM7SUFDdEQsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLG1CQUFtQixFQUFFLENBQUMsQ0FBQztJQUNqRCxJQUFBLHdDQUFxQixFQUFDLElBQUkseUJBQXlCLEVBQUUsQ0FBQyxDQUFDIn0=