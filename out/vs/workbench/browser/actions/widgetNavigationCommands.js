/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/platform/log/common/log", "vs/platform/configuration/common/configuration"], function (require, exports, contextkey_1, keybindingsRegistry_1, listService_1, lifecycle_1, contributions_1, log_1, configuration_1) {
    "use strict";
    var NavigableContainerManager_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerNavigableContainer = registerNavigableContainer;
    function handleFocusEventsGroup(group, handler, onPartFocusChange) {
        const focusedIndices = new Set();
        return (0, lifecycle_1.combinedDisposable)(...group.map((events, index) => (0, lifecycle_1.combinedDisposable)(events.onDidFocus(() => {
            onPartFocusChange?.(index, 'focus');
            if (!focusedIndices.size) {
                handler(true);
            }
            focusedIndices.add(index);
        }), events.onDidBlur(() => {
            onPartFocusChange?.(index, 'blur');
            focusedIndices.delete(index);
            if (!focusedIndices.size) {
                handler(false);
            }
        }))));
    }
    const NavigableContainerFocusedContextKey = new contextkey_1.RawContextKey('navigableContainerFocused', false);
    let NavigableContainerManager = class NavigableContainerManager {
        static { NavigableContainerManager_1 = this; }
        static { this.ID = 'workbench.contrib.navigableContainerManager'; }
        constructor(contextKeyService, logService, configurationService) {
            this.logService = logService;
            this.configurationService = configurationService;
            this.containers = new Set();
            this.focused = NavigableContainerFocusedContextKey.bindTo(contextKeyService);
            NavigableContainerManager_1.INSTANCE = this;
        }
        dispose() {
            this.containers.clear();
            this.focused.reset();
            NavigableContainerManager_1.INSTANCE = undefined;
        }
        get debugEnabled() {
            return this.configurationService.getValue('workbench.navigibleContainer.enableDebug');
        }
        log(msg, ...args) {
            if (this.debugEnabled) {
                this.logService.debug(msg, ...args);
            }
        }
        static register(container) {
            const instance = this.INSTANCE;
            if (!instance) {
                return lifecycle_1.Disposable.None;
            }
            instance.containers.add(container);
            instance.log('NavigableContainerManager.register', container.name);
            return (0, lifecycle_1.combinedDisposable)(handleFocusEventsGroup(container.focusNotifiers, (isFocus) => {
                if (isFocus) {
                    instance.log('NavigableContainerManager.focus', container.name);
                    instance.focused.set(true);
                    instance.lastContainer = container;
                }
                else {
                    instance.log('NavigableContainerManager.blur', container.name, instance.lastContainer?.name);
                    if (instance.lastContainer === container) {
                        instance.focused.set(false);
                        instance.lastContainer = undefined;
                    }
                }
            }, (index, event) => {
                instance.log('NavigableContainerManager.partFocusChange', container.name, index, event);
            }), (0, lifecycle_1.toDisposable)(() => {
                instance.containers.delete(container);
                instance.log('NavigableContainerManager.unregister', container.name, instance.lastContainer?.name);
                if (instance.lastContainer === container) {
                    instance.focused.set(false);
                    instance.lastContainer = undefined;
                }
            }));
        }
        static getActive() {
            return this.INSTANCE?.lastContainer;
        }
    };
    NavigableContainerManager = NavigableContainerManager_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, log_1.ILogService),
        __param(2, configuration_1.IConfigurationService)
    ], NavigableContainerManager);
    function registerNavigableContainer(container) {
        return NavigableContainerManager.register(container);
    }
    (0, contributions_1.registerWorkbenchContribution2)(NavigableContainerManager.ID, NavigableContainerManager, 1 /* WorkbenchPhase.BlockStartup */);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'widgetNavigation.focusPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(NavigableContainerFocusedContextKey, contextkey_1.ContextKeyExpr.or(listService_1.WorkbenchListFocusContextKey?.negate(), listService_1.WorkbenchListScrollAtTopContextKey)),
        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
        handler: () => {
            const activeContainer = NavigableContainerManager.getActive();
            activeContainer?.focusPreviousWidget();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'widgetNavigation.focusNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(NavigableContainerFocusedContextKey, contextkey_1.ContextKeyExpr.or(listService_1.WorkbenchListFocusContextKey?.negate(), listService_1.WorkbenchListScrollAtBottomContextKey)),
        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
        handler: () => {
            const activeContainer = NavigableContainerManager.getActive();
            activeContainer?.focusNextWidget();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2lkZ2V0TmF2aWdhdGlvbkNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvYWN0aW9ucy93aWRnZXROYXZpZ2F0aW9uQ29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUloRyxnRUFFQztJQW5HRCxTQUFTLHNCQUFzQixDQUFDLEtBQWdDLEVBQUUsT0FBbUMsRUFBRSxpQkFBMEQ7UUFDaEssTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUN6QyxPQUFPLElBQUEsOEJBQWtCLEVBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBQSw4QkFBa0IsRUFDM0UsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDdEIsaUJBQWlCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2YsQ0FBQztZQUNELGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsQ0FBQyxDQUFDLEVBQ0YsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDckIsaUJBQWlCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEIsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sbUNBQW1DLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTNHLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQXlCOztpQkFFZCxPQUFFLEdBQUcsNkNBQTZDLEFBQWhELENBQWlEO1FBU25FLFlBQ3FCLGlCQUFxQyxFQUM1QyxVQUErQixFQUNyQixvQkFBbUQ7WUFEckQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNiLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFSMUQsZUFBVSxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBUzVELElBQUksQ0FBQyxPQUFPLEdBQUcsbUNBQW1DLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDN0UsMkJBQXlCLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUMzQyxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNyQiwyQkFBeUIsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1FBQ2hELENBQUM7UUFFRCxJQUFZLFlBQVk7WUFDdkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFDdkYsQ0FBQztRQUVPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBRyxJQUFXO1lBQ3RDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNyQyxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBOEI7WUFDN0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztZQUN4QixDQUFDO1lBQ0QsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFbkUsT0FBTyxJQUFBLDhCQUFrQixFQUN4QixzQkFBc0IsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQzVELElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2hFLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUMzQixRQUFRLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztnQkFDcEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM3RixJQUFJLFFBQVEsQ0FBQyxhQUFhLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQzFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM1QixRQUFRLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztvQkFDcEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxFQUFFLENBQUMsS0FBYSxFQUFFLEtBQWEsRUFBRSxFQUFFO2dCQUNuQyxRQUFRLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pGLENBQUMsQ0FBQyxFQUNGLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ2pCLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxRQUFRLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbkcsSUFBSSxRQUFRLENBQUMsYUFBYSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUMxQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDNUIsUUFBUSxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUM7Z0JBQ3BDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FDRixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFTO1lBQ2YsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQztRQUNyQyxDQUFDOztJQXhFSSx5QkFBeUI7UUFZNUIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLHFDQUFxQixDQUFBO09BZGxCLHlCQUF5QixDQXlFOUI7SUFFRCxTQUFnQiwwQkFBMEIsQ0FBQyxTQUE4QjtRQUN4RSxPQUFPLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsSUFBQSw4Q0FBOEIsRUFBQyx5QkFBeUIsQ0FBQyxFQUFFLEVBQUUseUJBQXlCLHNDQUE4QixDQUFDO0lBRXJILHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1FBQ3BELEVBQUUsRUFBRSxnQ0FBZ0M7UUFDcEMsTUFBTSw2Q0FBbUM7UUFDekMsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2QixtQ0FBbUMsRUFDbkMsMkJBQWMsQ0FBQyxFQUFFLENBQ2hCLDBDQUE0QixFQUFFLE1BQU0sRUFBRSxFQUN0QyxnREFBa0MsQ0FDbEMsQ0FDRDtRQUNELE9BQU8sRUFBRSxvREFBZ0M7UUFDekMsT0FBTyxFQUFFLEdBQUcsRUFBRTtZQUNiLE1BQU0sZUFBZSxHQUFHLHlCQUF5QixDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzlELGVBQWUsRUFBRSxtQkFBbUIsRUFBRSxDQUFDO1FBQ3hDLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztRQUNwRCxFQUFFLEVBQUUsNEJBQTRCO1FBQ2hDLE1BQU0sNkNBQW1DO1FBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDdkIsbUNBQW1DLEVBQ25DLDJCQUFjLENBQUMsRUFBRSxDQUNoQiwwQ0FBNEIsRUFBRSxNQUFNLEVBQUUsRUFDdEMsbURBQXFDLENBQ3JDLENBQ0Q7UUFDRCxPQUFPLEVBQUUsc0RBQWtDO1FBQzNDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDYixNQUFNLGVBQWUsR0FBRyx5QkFBeUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUM5RCxlQUFlLEVBQUUsZUFBZSxFQUFFLENBQUM7UUFDcEMsQ0FBQztLQUNELENBQUMsQ0FBQyJ9