/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/button/button", "vs/base/common/lifecycle", "vs/platform/theme/browser/defaultStyles"], function (require, exports, button_1, lifecycle_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentFormActions = void 0;
    class CommentFormActions {
        constructor(keybindingService, contextKeyService, container, actionHandler, maxActions) {
            this.keybindingService = keybindingService;
            this.contextKeyService = contextKeyService;
            this.container = container;
            this.actionHandler = actionHandler;
            this.maxActions = maxActions;
            this._buttonElements = [];
            this._toDispose = new lifecycle_1.DisposableStore();
            this._actions = [];
        }
        setActions(menu, hasOnlySecondaryActions = false) {
            this._toDispose.clear();
            this._buttonElements.forEach(b => b.remove());
            this._buttonElements = [];
            const groups = menu.getActions({ shouldForwardArgs: true });
            let isPrimary = !hasOnlySecondaryActions;
            for (const group of groups) {
                const [, actions] = group;
                this._actions = actions;
                for (const action of actions) {
                    let keybinding = this.keybindingService.lookupKeybinding(action.id, this.contextKeyService)?.getLabel();
                    if (!keybinding && isPrimary) {
                        keybinding = this.keybindingService.lookupKeybinding("editor.action.submitComment" /* CommentCommandId.Submit */, this.contextKeyService)?.getLabel();
                    }
                    const title = keybinding ? `${action.label} (${keybinding})` : action.label;
                    const button = new button_1.Button(this.container, { secondary: !isPrimary, title, ...defaultStyles_1.defaultButtonStyles });
                    isPrimary = false;
                    this._buttonElements.push(button.element);
                    this._toDispose.add(button);
                    this._toDispose.add(button.onDidClick(() => this.actionHandler(action)));
                    button.enabled = action.enabled;
                    button.label = action.label;
                    if ((this.maxActions !== undefined) && (this._buttonElements.length >= this.maxActions)) {
                        console.warn(`An extension has contributed more than the allowable number of actions to a comments menu.`);
                        return;
                    }
                }
            }
        }
        triggerDefaultAction() {
            if (this._actions.length) {
                const lastAction = this._actions[0];
                if (lastAction.enabled) {
                    return this.actionHandler(lastAction);
                }
            }
        }
        dispose() {
            this._toDispose.dispose();
        }
    }
    exports.CommentFormActions = CommentFormActions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudEZvcm1BY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50Rm9ybUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsa0JBQWtCO1FBSzlCLFlBQ2tCLGlCQUFxQyxFQUNyQyxpQkFBcUMsRUFDOUMsU0FBc0IsRUFDdEIsYUFBd0MsRUFDL0IsVUFBbUI7WUFKbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNyQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzlDLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFDdEIsa0JBQWEsR0FBYixhQUFhLENBQTJCO1lBQy9CLGVBQVUsR0FBVixVQUFVLENBQVM7WUFUN0Isb0JBQWUsR0FBa0IsRUFBRSxDQUFDO1lBQzNCLGVBQVUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUM1QyxhQUFRLEdBQWMsRUFBRSxDQUFDO1FBUTdCLENBQUM7UUFFTCxVQUFVLENBQUMsSUFBVyxFQUFFLDBCQUFtQyxLQUFLO1lBQy9ELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFeEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUUxQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM1RCxJQUFJLFNBQVMsR0FBWSxDQUFDLHVCQUF1QixDQUFDO1lBQ2xELEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFFMUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7Z0JBQ3hCLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQzlCLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDO29CQUN4RyxJQUFJLENBQUMsVUFBVSxJQUFJLFNBQVMsRUFBRSxDQUFDO3dCQUM5QixVQUFVLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQiw4REFBMEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUM7b0JBQ25ILENBQUM7b0JBQ0QsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEtBQUssVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBQzVFLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEdBQUcsbUNBQW1CLEVBQUUsQ0FBQyxDQUFDO29CQUVwRyxTQUFTLEdBQUcsS0FBSyxDQUFDO29CQUNsQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBRTFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUV6RSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7b0JBQ2hDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQzt3QkFDekYsT0FBTyxDQUFDLElBQUksQ0FBQyw0RkFBNEYsQ0FBQyxDQUFDO3dCQUMzRyxPQUFPO29CQUNSLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsb0JBQW9CO1lBQ25CLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFcEMsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3hCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDdkMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztLQUNEO0lBOURELGdEQThEQyJ9