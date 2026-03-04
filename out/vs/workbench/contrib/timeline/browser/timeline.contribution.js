/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/workbench/contrib/files/browser/explorerViewlet", "vs/workbench/contrib/timeline/common/timeline", "vs/workbench/contrib/timeline/common/timelineService", "./timelinePane", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/workbench/contrib/files/common/files", "vs/workbench/common/contextkeys", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls_1, descriptors_1, extensions_1, platform_1, views_1, explorerViewlet_1, timeline_1, timelineService_1, timelinePane_1, configurationRegistry_1, contextkey_1, actions_1, commands_1, files_1, contextkeys_1, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimelinePaneDescriptor = void 0;
    const timelineViewIcon = (0, iconRegistry_1.registerIcon)('timeline-view-icon', codicons_1.Codicon.history, (0, nls_1.localize)('timelineViewIcon', 'View icon of the timeline view.'));
    const timelineOpenIcon = (0, iconRegistry_1.registerIcon)('timeline-open', codicons_1.Codicon.history, (0, nls_1.localize)('timelineOpenIcon', 'Icon for the open timeline action.'));
    class TimelinePaneDescriptor {
        constructor() {
            this.id = timeline_1.TimelinePaneId;
            this.name = timelinePane_1.TimelinePane.TITLE;
            this.containerIcon = timelineViewIcon;
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(timelinePane_1.TimelinePane);
            this.order = 2;
            this.weight = 30;
            this.collapsed = true;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.canMoveView = true;
            this.when = timelineService_1.TimelineHasProviderContext;
            this.focusCommand = { id: 'timeline.focus' };
        }
    }
    exports.TimelinePaneDescriptor = TimelinePaneDescriptor;
    // Configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'timeline',
        order: 1001,
        title: (0, nls_1.localize)('timelineConfigurationTitle', "Timeline"),
        type: 'object',
        properties: {
            'timeline.pageSize': {
                type: ['number', 'null'],
                default: null,
                markdownDescription: (0, nls_1.localize)('timeline.pageSize', "The number of items to show in the Timeline view by default and when loading more items. Setting to `null` (the default) will automatically choose a page size based on the visible area of the Timeline view."),
            },
            'timeline.pageOnScroll': {
                type: 'boolean',
                default: false,
                description: (0, nls_1.localize)('timeline.pageOnScroll', "Experimental. Controls whether the Timeline view will load the next page of items when you scroll to the end of the list."),
            },
        }
    });
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([new TimelinePaneDescriptor()], explorerViewlet_1.VIEW_CONTAINER);
    var OpenTimelineAction;
    (function (OpenTimelineAction) {
        OpenTimelineAction.ID = 'files.openTimeline';
        OpenTimelineAction.LABEL = (0, nls_1.localize)('files.openTimeline', "Open Timeline");
        function handler() {
            return (accessor, arg) => {
                const service = accessor.get(timeline_1.ITimelineService);
                return service.setUri(arg);
            };
        }
        OpenTimelineAction.handler = handler;
    })(OpenTimelineAction || (OpenTimelineAction = {}));
    commands_1.CommandsRegistry.registerCommand(OpenTimelineAction.ID, OpenTimelineAction.handler());
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '4_timeline',
        order: 1,
        command: {
            id: OpenTimelineAction.ID,
            title: OpenTimelineAction.LABEL,
            icon: timelineOpenIcon
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, timelineService_1.TimelineHasProviderContext)
    }));
    const timelineFilter = (0, iconRegistry_1.registerIcon)('timeline-filter', codicons_1.Codicon.filter, (0, nls_1.localize)('timelineFilter', 'Icon for the filter timeline action.'));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TimelineTitle, {
        submenu: actions_1.MenuId.TimelineFilterSubMenu,
        title: (0, nls_1.localize)('filterTimeline', "Filter Timeline"),
        group: 'navigation',
        order: 100,
        icon: timelineFilter
    });
    (0, extensions_1.registerSingleton)(timeline_1.ITimelineService, timelineService_1.TimelineService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZWxpbmUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGltZWxpbmUvYnJvd3Nlci90aW1lbGluZS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxNQUFNLGdCQUFnQixHQUFHLElBQUEsMkJBQVksRUFBQyxvQkFBb0IsRUFBRSxrQkFBTyxDQUFDLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDLENBQUM7SUFDOUksTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLDJCQUFZLEVBQUMsZUFBZSxFQUFFLGtCQUFPLENBQUMsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLG9DQUFvQyxDQUFDLENBQUMsQ0FBQztJQUU1SSxNQUFhLHNCQUFzQjtRQUFuQztZQUNVLE9BQUUsR0FBRyx5QkFBYyxDQUFDO1lBQ3BCLFNBQUksR0FBcUIsMkJBQVksQ0FBQyxLQUFLLENBQUM7WUFDNUMsa0JBQWEsR0FBRyxnQkFBZ0IsQ0FBQztZQUNqQyxtQkFBYyxHQUFHLElBQUksNEJBQWMsQ0FBQywyQkFBWSxDQUFDLENBQUM7WUFDbEQsVUFBSyxHQUFHLENBQUMsQ0FBQztZQUNWLFdBQU0sR0FBRyxFQUFFLENBQUM7WUFDWixjQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLHdCQUFtQixHQUFHLElBQUksQ0FBQztZQUMzQixrQkFBYSxHQUFHLEtBQUssQ0FBQztZQUN0QixnQkFBVyxHQUFHLElBQUksQ0FBQztZQUNuQixTQUFJLEdBQUcsNENBQTBCLENBQUM7WUFFM0MsaUJBQVksR0FBRyxFQUFFLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3pDLENBQUM7S0FBQTtJ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