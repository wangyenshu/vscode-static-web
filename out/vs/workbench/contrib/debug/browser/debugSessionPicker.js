define(["require", "exports", "vs/nls", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/common/debug", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/views/common/viewsService", "vs/platform/commands/common/commands"], function (require, exports, nls, filters_1, lifecycle_1, debug_1, quickInput_1, viewsService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showDebugSessionMenu = showDebugSessionMenu;
    async function showDebugSessionMenu(accessor, selectAndStartID) {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const debugService = accessor.get(debug_1.IDebugService);
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const commandService = accessor.get(commands_1.ICommandService);
        const localDisposableStore = new lifecycle_1.DisposableStore();
        const quickPick = quickInputService.createQuickPick();
        localDisposableStore.add(quickPick);
        quickPick.matchOnLabel = quickPick.matchOnDescription = quickPick.matchOnDetail = quickPick.sortByLabel = false;
        quickPick.placeholder = nls.localize('moveFocusedView.selectView', 'Search debug sessions by name');
        const pickItems = _getPicksAndActiveItem(quickPick.value, selectAndStartID, debugService, viewsService, commandService);
        quickPick.items = pickItems.picks;
        quickPick.activeItems = pickItems.activeItems;
        localDisposableStore.add(quickPick.onDidChangeValue(async () => {
            quickPick.items = _getPicksAndActiveItem(quickPick.value, selectAndStartID, debugService, viewsService, commandService).picks;
        }));
        localDisposableStore.add(quickPick.onDidAccept(() => {
            const selectedItem = quickPick.selectedItems[0];
            selectedItem.accept();
            quickPick.hide();
            localDisposableStore.dispose();
        }));
        quickPick.show();
    }
    function _getPicksAndActiveItem(filter, selectAndStartID, debugService, viewsService, commandService) {
        const debugConsolePicks = [];
        const headerSessions = [];
        const currSession = debugService.getViewModel().focusedSession;
        const sessions = debugService.getModel().getSessions(false);
        const activeItems = [];
        sessions.forEach((session) => {
            if (session.compact && session.parentSession) {
                headerSessions.push(session.parentSession);
            }
        });
        sessions.forEach((session) => {
            const isHeader = headerSessions.includes(session);
            if (!session.parentSession) {
                debugConsolePicks.push({ type: 'separator', label: isHeader ? session.name : undefined });
            }
            if (!isHeader) {
                const pick = _createPick(session, filter, debugService, viewsService, commandService);
                if (pick) {
                    debugConsolePicks.push(pick);
                    if (session.getId() === currSession?.getId()) {
                        activeItems.push(pick);
                    }
                }
            }
        });
        if (debugConsolePicks.length) {
            debugConsolePicks.push({ type: 'separator' });
        }
        const createDebugSessionLabel = nls.localize('workbench.action.debug.startDebug', 'Start a New Debug Session');
        debugConsolePicks.push({
            label: `$(plus) ${createDebugSessionLabel}`,
            ariaLabel: createDebugSessionLabel,
            accept: () => commandService.executeCommand(selectAndStartID)
        });
        return { picks: debugConsolePicks, activeItems };
    }
    function _getSessionInfo(session) {
        const label = (!session.configuration.name.length) ? session.name : session.configuration.name;
        const parentName = session.compact ? undefined : session.parentSession?.configuration.name;
        let description = '';
        let ariaLabel = '';
        if (parentName) {
            ariaLabel = nls.localize('workbench.action.debug.spawnFrom', 'Session {0} spawned from {1}', label, parentName);
            description = parentName;
        }
        return { label, description, ariaLabel };
    }
    function _createPick(session, filter, debugService, viewsService, commandService) {
        const pickInfo = _getSessionInfo(session);
        const highlights = (0, filters_1.matchesFuzzy)(filter, pickInfo.label, true);
        if (highlights) {
            return {
                label: pickInfo.label,
                description: pickInfo.description,
                ariaLabel: pickInfo.ariaLabel,
                highlights: { label: highlights },
                accept: () => {
                    debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
                    if (!viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
                        viewsService.openView(debug_1.REPL_VIEW_ID, true);
                    }
                }
            };
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTZXNzaW9uUGlja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kZWJ1Z1Nlc3Npb25QaWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBZ0JBLG9EQTBCQztJQTFCTSxLQUFLLFVBQVUsb0JBQW9CLENBQUMsUUFBMEIsRUFBRSxnQkFBd0I7UUFDOUYsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7UUFDM0QsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQkFBYSxDQUFDLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBYSxDQUFDLENBQUM7UUFDakQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQkFBZSxDQUFDLENBQUM7UUFFckQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUNuRCxNQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxlQUFlLEVBQW9CLENBQUM7UUFDeEUsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDaEgsU0FBUyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLCtCQUErQixDQUFDLENBQUM7UUFFcEcsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3hILFNBQVMsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztRQUNsQyxTQUFTLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFFOUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUM5RCxTQUFTLENBQUMsS0FBSyxHQUFHLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDL0gsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtZQUNuRCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN0QixTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakIsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsQixDQUFDO0lBRUQsU0FBUyxzQkFBc0IsQ0FBQyxNQUFjLEVBQUUsZ0JBQXdCLEVBQUUsWUFBMkIsRUFBRSxZQUEyQixFQUFFLGNBQStCO1FBQ2xLLE1BQU0saUJBQWlCLEdBQWtELEVBQUUsQ0FBQztRQUM1RSxNQUFNLGNBQWMsR0FBb0IsRUFBRSxDQUFDO1FBRTNDLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxjQUFjLENBQUM7UUFDL0QsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1RCxNQUFNLFdBQVcsR0FBNEIsRUFBRSxDQUFDO1FBRWhELFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUM1QixJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUM5QyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM1QyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDNUIsTUFBTSxRQUFRLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUM1QixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDM0YsQ0FBQztZQUVELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUN0RixJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssV0FBVyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7d0JBQzlDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3hCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDOUIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELE1BQU0sdUJBQXVCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQ0FBbUMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1FBQy9HLGlCQUFpQixDQUFDLElBQUksQ0FBQztZQUN0QixLQUFLLEVBQUUsV0FBVyx1QkFBdUIsRUFBRTtZQUMzQyxTQUFTLEVBQUUsdUJBQXVCO1lBQ2xDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDO1NBQzdELENBQUMsQ0FBQztRQUVILE9BQU8sRUFBRSxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDbEQsQ0FBQztJQUdELFNBQVMsZUFBZSxDQUFDLE9BQXNCO1FBQzlDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDL0YsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDM0YsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLFNBQVMsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGtDQUFrQyxFQUFFLDhCQUE4QixFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNoSCxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzFCLENBQUM7UUFFRCxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQsU0FBUyxXQUFXLENBQUMsT0FBc0IsRUFBRSxNQUFjLEVBQUUsWUFBMkIsRUFBRSxZQUEyQixFQUFFLGNBQStCO1FBQ3JKLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQyxNQUFNLFVBQVUsR0FBRyxJQUFBLHNCQUFZLEVBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUQsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNoQixPQUFPO2dCQUNOLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztnQkFDckIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO2dCQUNqQyxTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVM7Z0JBQzdCLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7Z0JBQ2pDLE1BQU0sRUFBRSxHQUFHLEVBQUU7b0JBQ1osWUFBWSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUNoRixJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxvQkFBWSxDQUFDLEVBQUUsQ0FBQzt3QkFDL0MsWUFBWSxDQUFDLFFBQVEsQ0FBQyxvQkFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUMzQyxDQUFDO2dCQUNGLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUMifQ==