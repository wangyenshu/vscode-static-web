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
define(["require", "exports", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/nls", "vs/platform/notification/common/notification", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/platform/commands/common/commands", "vs/base/common/filters", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugIcons", "vs/base/common/themables"], function (require, exports, pickerQuickAccess_1, nls_1, notification_1, debug_1, workspace_1, commands_1, filters_1, debugCommands_1, debugIcons_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartDebugQuickAccessProvider = void 0;
    let StartDebugQuickAccessProvider = class StartDebugQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(debugService, contextService, commandService, notificationService) {
            super(debugCommands_1.DEBUG_QUICK_ACCESS_PREFIX, {
                noResultsPick: {
                    label: (0, nls_1.localize)('noDebugResults', "No matching launch configurations")
                }
            });
            this.debugService = debugService;
            this.contextService = contextService;
            this.commandService = commandService;
            this.notificationService = notificationService;
        }
        async _getPicks(filter) {
            const picks = [];
            if (!this.debugService.getAdapterManager().hasEnabledDebuggers()) {
                return [];
            }
            picks.push({ type: 'separator', label: 'launch.json' });
            const configManager = this.debugService.getConfigurationManager();
            // Entries: configs
            let lastGroup;
            for (const config of configManager.getAllConfigurations()) {
                const highlights = (0, filters_1.matchesFuzzy)(filter, config.name, true);
                if (highlights) {
                    // Separator
                    if (lastGroup !== config.presentation?.group) {
                        picks.push({ type: 'separator' });
                        lastGroup = config.presentation?.group;
                    }
                    // Launch entry
                    picks.push({
                        label: config.name,
                        description: this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? config.launch.name : '',
                        highlights: { label: highlights },
                        buttons: [{
                                iconClass: themables_1.ThemeIcon.asClassName(debugIcons_1.debugConfigure),
                                tooltip: (0, nls_1.localize)('customizeLaunchConfig', "Configure Launch Configuration")
                            }],
                        trigger: () => {
                            config.launch.openConfigFile({ preserveFocus: false });
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        },
                        accept: async () => {
                            await configManager.selectConfiguration(config.launch, config.name);
                            try {
                                await this.debugService.startDebugging(config.launch, undefined, { startedByUser: true });
                            }
                            catch (error) {
                                this.notificationService.error(error);
                            }
                        }
                    });
                }
            }
            // Entries detected configurations
            const dynamicProviders = await configManager.getDynamicProviders();
            if (dynamicProviders.length > 0) {
                picks.push({
                    type: 'separator', label: (0, nls_1.localize)({
                        key: 'contributed',
                        comment: ['contributed is lower case because it looks better like that in UI. Nothing preceeds it. It is a name of the grouping of debug configurations.']
                    }, "contributed")
                });
            }
            configManager.getRecentDynamicConfigurations().forEach(({ name, type }) => {
                const highlights = (0, filters_1.matchesFuzzy)(filter, name, true);
                if (highlights) {
                    picks.push({
                        label: name,
                        highlights: { label: highlights },
                        buttons: [{
                                iconClass: themables_1.ThemeIcon.asClassName(debugIcons_1.debugRemoveConfig),
                                tooltip: (0, nls_1.localize)('removeLaunchConfig', "Remove Launch Configuration")
                            }],
                        trigger: () => {
                            configManager.removeRecentDynamicConfigurations(name, type);
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        },
                        accept: async () => {
                            await configManager.selectConfiguration(undefined, name, undefined, { type });
                            try {
                                const { launch, getConfig } = configManager.selectedConfiguration;
                                const config = await getConfig();
                                await this.debugService.startDebugging(launch, config, { startedByUser: true });
                            }
                            catch (error) {
                                this.notificationService.error(error);
                            }
                        }
                    });
                }
            });
            dynamicProviders.forEach(provider => {
                picks.push({
                    label: `$(folder) ${provider.label}...`,
                    ariaLabel: (0, nls_1.localize)({ key: 'providerAriaLabel', comment: ['Placeholder stands for the provider label. For example "NodeJS".'] }, "{0} contributed configurations", provider.label),
                    accept: async () => {
                        const pick = await provider.pick();
                        if (pick) {
                            // Use the type of the provider, not of the config since config sometimes have subtypes (for example "node-terminal")
                            await configManager.selectConfiguration(pick.launch, pick.config.name, pick.config, { type: provider.type });
                            this.debugService.startDebugging(pick.launch, pick.config, { startedByUser: true });
                        }
                    }
                });
            });
            // Entries: launches
            const visibleLaunches = configManager.getLaunches().filter(launch => !launch.hidden);
            // Separator
            if (visibleLaunches.length > 0) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('configure', "configure") });
            }
            for (const launch of visibleLaunches) {
                const label = this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ?
                    (0, nls_1.localize)("addConfigTo", "Add Config ({0})...", launch.name) :
                    (0, nls_1.localize)('addConfiguration', "Add Configuration...");
                // Add Config entry
                picks.push({
                    label,
                    description: this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? launch.name : '',
                    highlights: { label: (0, filters_1.matchesFuzzy)(filter, label, true) ?? undefined },
                    accept: () => this.commandService.executeCommand(debugCommands_1.ADD_CONFIGURATION_ID, launch.uri.toString())
                });
            }
            return picks;
        }
    };
    exports.StartDebugQuickAccessProvider = StartDebugQuickAccessProvider;
    exports.StartDebugQuickAccessProvider = StartDebugQuickAccessProvider = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, commands_1.ICommandService),
        __param(3, notification_1.INotificationService)
    ], StartDebugQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvZGVidWdRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBOEIsU0FBUSw2Q0FBaUQ7UUFFbkcsWUFDaUMsWUFBMkIsRUFDaEIsY0FBd0MsRUFDakQsY0FBK0IsRUFDMUIsbUJBQXlDO1lBRWhGLEtBQUssQ0FBQyx5Q0FBeUIsRUFBRTtnQkFDaEMsYUFBYSxFQUFFO29CQUNkLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxtQ0FBbUMsQ0FBQztpQkFDdEU7YUFDRCxDQUFDLENBQUM7WUFUNkIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDaEIsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMxQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1FBT2pGLENBQUM7UUFFUyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQWM7WUFDdkMsTUFBTSxLQUFLLEdBQXdELEVBQUUsQ0FBQztZQUN0RSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQztnQkFDbEUsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFFeEQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBRWxFLG1CQUFtQjtZQUNuQixJQUFJLFNBQTZCLENBQUM7WUFDbEMsS0FBSyxNQUFNLE1BQU0sSUFBSSxhQUFhLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDO2dCQUMzRCxNQUFNLFVBQVUsR0FBRyxJQUFBLHNCQUFZLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNELElBQUksVUFBVSxFQUFFLENBQUM7b0JBRWhCLFlBQVk7b0JBQ1osSUFBSSxTQUFTLEtBQUssTUFBTSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQzt3QkFDOUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO3dCQUNsQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUM7b0JBQ3hDLENBQUM7b0JBRUQsZUFBZTtvQkFDZixLQUFLLENBQUMsSUFBSSxDQUFDO3dCQUNWLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSTt3QkFDbEIsV0FBVyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUscUNBQTZCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUMzRyxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO3dCQUNqQyxPQUFPLEVBQUUsQ0FBQztnQ0FDVCxTQUFTLEVBQUUscUJBQVMsQ0FBQyxXQUFXLENBQUMsMkJBQWMsQ0FBQztnQ0FDaEQsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLGdDQUFnQyxDQUFDOzZCQUM1RSxDQUFDO3dCQUNGLE9BQU8sRUFBRSxHQUFHLEVBQUU7NEJBQ2IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQzs0QkFFdkQsT0FBTyxpQ0FBYSxDQUFDLFlBQVksQ0FBQzt3QkFDbkMsQ0FBQzt3QkFDRCxNQUFNLEVBQUUsS0FBSyxJQUFJLEVBQUU7NEJBQ2xCLE1BQU0sYUFBYSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNwRSxJQUFJLENBQUM7Z0NBQ0osTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDOzRCQUMzRixDQUFDOzRCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0NBQ2hCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ3ZDLENBQUM7d0JBQ0YsQ0FBQztxQkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUM7WUFFRCxrQ0FBa0M7WUFDbEMsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ25FLElBQUksZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxLQUFLLENBQUMsSUFBSSxDQUFDO29CQUNWLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDO3dCQUNsQyxHQUFHLEVBQUUsYUFBYTt3QkFDbEIsT0FBTyxFQUFFLENBQUMsK0lBQStJLENBQUM7cUJBQzFKLEVBQUUsYUFBYSxDQUFDO2lCQUNqQixDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsYUFBYSxDQUFDLDhCQUE4QixFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtnQkFDekUsTUFBTSxVQUFVLEdBQUcsSUFBQSxzQkFBWSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLEtBQUssQ0FBQyxJQUFJLENBQUM7d0JBQ1YsS0FBSyxFQUFFLElBQUk7d0JBQ1gsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRTt3QkFDakMsT0FBTyxFQUFFLENBQUM7Z0NBQ1QsU0FBUyxFQUFFLHFCQUFTLENBQUMsV0FBVyxDQUFDLDhCQUFpQixDQUFDO2dDQUNuRCxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsNkJBQTZCLENBQUM7NkJBQ3RFLENBQUM7d0JBQ0YsT0FBTyxFQUFFLEdBQUcsRUFBRTs0QkFDYixhQUFhLENBQUMsaUNBQWlDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUM1RCxPQUFPLGlDQUFhLENBQUMsWUFBWSxDQUFDO3dCQUNuQyxDQUFDO3dCQUNELE1BQU0sRUFBRSxLQUFLLElBQUksRUFBRTs0QkFDbEIsTUFBTSxhQUFhLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDOzRCQUM5RSxJQUFJLENBQUM7Z0NBQ0osTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxhQUFhLENBQUMscUJBQXFCLENBQUM7Z0NBQ2xFLE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxFQUFFLENBQUM7Z0NBQ2pDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDOzRCQUNqRixDQUFDOzRCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0NBQ2hCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ3ZDLENBQUM7d0JBQ0YsQ0FBQztxQkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDO29CQUNWLEtBQUssRUFBRSxhQUFhLFFBQVEsQ0FBQyxLQUFLLEtBQUs7b0JBQ3ZDLFNBQVMsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxtQkFBbUIsRUFBRSxPQUFPLEVBQUUsQ0FBQyxrRUFBa0UsQ0FBQyxFQUFFLEVBQUUsZ0NBQWdDLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQztvQkFDbEwsTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFO3dCQUNsQixNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDbkMsSUFBSSxJQUFJLEVBQUUsQ0FBQzs0QkFDVixxSEFBcUg7NEJBQ3JILE1BQU0sYUFBYSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQzs0QkFDN0csSUFBSSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7d0JBQ3JGLENBQUM7b0JBQ0YsQ0FBQztpQkFDRCxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUdILG9CQUFvQjtZQUNwQixNQUFNLGVBQWUsR0FBRyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFckYsWUFBWTtZQUNaLElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUUsQ0FBQztZQUVELEtBQUssTUFBTSxNQUFNLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3RDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUscUNBQTZCLENBQUMsQ0FBQztvQkFDbkYsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUM3RCxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO2dCQUV0RCxtQkFBbUI7Z0JBQ25CLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ1YsS0FBSztvQkFDTCxXQUFXLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxxQ0FBNkIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDcEcsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUEsc0JBQVksRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLFNBQVMsRUFBRTtvQkFDckUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLG9DQUFvQixFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7aUJBQzdGLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7S0FDRCxDQUFBO0lBOUlZLHNFQUE2Qjs0Q0FBN0IsNkJBQTZCO1FBR3ZDLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsV0FBQSxtQ0FBb0IsQ0FBQTtPQU5WLDZCQUE2QixDQThJekMifQ==