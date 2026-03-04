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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/services/output/common/output", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/contextkey/common/contextkey", "vs/base/common/filters", "vs/base/common/strings", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/debug/common/debug"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, views_1, viewsService_1, output_1, terminal_1, contextkey_1, filters_1, strings_1, keybinding_1, actions_1, actionCommonCategories_1, panecomposite_1, debug_1) {
    "use strict";
    var ViewQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickAccessViewPickerAction = exports.OpenViewPickerAction = exports.ViewQuickAccessProvider = void 0;
    let ViewQuickAccessProvider = class ViewQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { ViewQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'view '; }
        constructor(viewDescriptorService, viewsService, outputService, terminalService, terminalGroupService, debugService, paneCompositeService, contextKeyService) {
            super(ViewQuickAccessProvider_1.PREFIX, {
                noResultsPick: {
                    label: (0, nls_1.localize)('noViewResults', "No matching views"),
                    containerLabel: ''
                }
            });
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.outputService = outputService;
            this.terminalService = terminalService;
            this.terminalGroupService = terminalGroupService;
            this.debugService = debugService;
            this.paneCompositeService = paneCompositeService;
            this.contextKeyService = contextKeyService;
        }
        _getPicks(filter) {
            const filteredViewEntries = this.doGetViewPickItems().filter(entry => {
                if (!filter) {
                    return true;
                }
                // Match fuzzy on label
                entry.highlights = { label: (0, filters_1.matchesFuzzy)(filter, entry.label, true) ?? undefined };
                // Return if we have a match on label or container
                return entry.highlights.label || (0, strings_1.fuzzyContains)(entry.containerLabel, filter);
            });
            // Map entries to container labels
            const mapEntryToContainer = new Map();
            for (const entry of filteredViewEntries) {
                if (!mapEntryToContainer.has(entry.label)) {
                    mapEntryToContainer.set(entry.label, entry.containerLabel);
                }
            }
            // Add separators for containers
            const filteredViewEntriesWithSeparators = [];
            let lastContainer = undefined;
            for (const entry of filteredViewEntries) {
                if (lastContainer !== entry.containerLabel) {
                    lastContainer = entry.containerLabel;
                    // When the entry container has a parent container, set container
                    // label as Parent / Child. For example, `Views / Explorer`.
                    let separatorLabel;
                    if (mapEntryToContainer.has(lastContainer)) {
                        separatorLabel = `${mapEntryToContainer.get(lastContainer)} / ${lastContainer}`;
                    }
                    else {
                        separatorLabel = lastContainer;
                    }
                    filteredViewEntriesWithSeparators.push({ type: 'separator', label: separatorLabel });
                }
                filteredViewEntriesWithSeparators.push(entry);
            }
            return filteredViewEntriesWithSeparators;
        }
        doGetViewPickItems() {
            const viewEntries = [];
            const getViewEntriesForPaneComposite = (paneComposite, viewContainer) => {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                const result = [];
                for (const view of viewContainerModel.allViewDescriptors) {
                    if (this.contextKeyService.contextMatchesRules(view.when)) {
                        result.push({
                            label: view.name.value,
                            containerLabel: viewContainerModel.title,
                            accept: () => this.viewsService.openView(view.id, true)
                        });
                    }
                }
                return result;
            };
            const addPaneComposites = (location, containerLabel) => {
                const paneComposites = this.paneCompositeService.getPaneComposites(location);
                const visiblePaneCompositeIds = this.paneCompositeService.getVisiblePaneCompositeIds(location);
                paneComposites.sort((a, b) => {
                    let aIndex = visiblePaneCompositeIds.findIndex(id => a.id === id);
                    let bIndex = visiblePaneCompositeIds.findIndex(id => b.id === id);
                    if (aIndex < 0) {
                        aIndex = paneComposites.indexOf(a) + visiblePaneCompositeIds.length;
                    }
                    if (bIndex < 0) {
                        bIndex = paneComposites.indexOf(b) + visiblePaneCompositeIds.length;
                    }
                    return aIndex - bIndex;
                });
                for (const paneComposite of paneComposites) {
                    if (this.includeViewContainer(paneComposite)) {
                        const viewContainer = this.viewDescriptorService.getViewContainerById(paneComposite.id);
                        if (viewContainer) {
                            viewEntries.push({
                                label: this.viewDescriptorService.getViewContainerModel(viewContainer).title,
                                containerLabel,
                                accept: () => this.paneCompositeService.openPaneComposite(paneComposite.id, location, true)
                            });
                        }
                    }
                }
            };
            // Viewlets / Panels
            addPaneComposites(0 /* ViewContainerLocation.Sidebar */, (0, nls_1.localize)('views', "Side Bar"));
            addPaneComposites(1 /* ViewContainerLocation.Panel */, (0, nls_1.localize)('panels', "Panel"));
            addPaneComposites(2 /* ViewContainerLocation.AuxiliaryBar */, (0, nls_1.localize)('secondary side bar', "Secondary Side Bar"));
            const addPaneCompositeViews = (location) => {
                const paneComposites = this.paneCompositeService.getPaneComposites(location);
                for (const paneComposite of paneComposites) {
                    const viewContainer = this.viewDescriptorService.getViewContainerById(paneComposite.id);
                    if (viewContainer) {
                        viewEntries.push(...getViewEntriesForPaneComposite(paneComposite, viewContainer));
                    }
                }
            };
            // Side Bar / Panel Views
            addPaneCompositeViews(0 /* ViewContainerLocation.Sidebar */);
            addPaneCompositeViews(1 /* ViewContainerLocation.Panel */);
            addPaneCompositeViews(2 /* ViewContainerLocation.AuxiliaryBar */);
            // Terminals
            this.terminalGroupService.groups.forEach((group, groupIndex) => {
                group.terminalInstances.forEach((terminal, terminalIndex) => {
                    const label = (0, nls_1.localize)('terminalTitle', "{0}: {1}", `${groupIndex + 1}.${terminalIndex + 1}`, terminal.title);
                    viewEntries.push({
                        label,
                        containerLabel: (0, nls_1.localize)('terminals', "Terminal"),
                        accept: async () => {
                            await this.terminalGroupService.showPanel(true);
                            this.terminalService.setActiveInstance(terminal);
                        }
                    });
                });
            });
            // Debug Consoles
            this.debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl()).forEach((session, _) => {
                const label = session.name;
                viewEntries.push({
                    label,
                    containerLabel: (0, nls_1.localize)('debugConsoles', "Debug Console"),
                    accept: async () => {
                        await this.debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
                        if (!this.viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
                            await this.viewsService.openView(debug_1.REPL_VIEW_ID, true);
                        }
                    }
                });
            });
            // Output Channels
            const channels = this.outputService.getChannelDescriptors();
            for (const channel of channels) {
                viewEntries.push({
                    label: channel.label,
                    containerLabel: (0, nls_1.localize)('channels', "Output"),
                    accept: () => this.outputService.showChannel(channel.id)
                });
            }
            return viewEntries;
        }
        includeViewContainer(container) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(container.id);
            if (viewContainer?.hideIfEmpty) {
                return this.viewDescriptorService.getViewContainerModel(viewContainer).activeViewDescriptors.length > 0;
            }
            return true;
        }
    };
    exports.ViewQuickAccessProvider = ViewQuickAccessProvider;
    exports.ViewQuickAccessProvider = ViewQuickAccessProvider = ViewQuickAccessProvider_1 = __decorate([
        __param(0, views_1.IViewDescriptorService),
        __param(1, viewsService_1.IViewsService),
        __param(2, output_1.IOutputService),
        __param(3, terminal_1.ITerminalService),
        __param(4, terminal_1.ITerminalGroupService),
        __param(5, debug_1.IDebugService),
        __param(6, panecomposite_1.IPaneCompositePartService),
        __param(7, contextkey_1.IContextKeyService)
    ], ViewQuickAccessProvider);
    //#region Actions
    class OpenViewPickerAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openView'; }
        constructor() {
            super({
                id: OpenViewPickerAction.ID,
                title: (0, nls_1.localize2)('openView', 'Open View'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        async run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(ViewQuickAccessProvider.PREFIX);
        }
    }
    exports.OpenViewPickerAction = OpenViewPickerAction;
    class QuickAccessViewPickerAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.quickOpenView'; }
        static { this.KEYBINDING = {
            primary: 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */,
            mac: { primary: 256 /* KeyMod.WinCtrl */ | 47 /* KeyCode.KeyQ */ },
            linux: { primary: 0 }
        }; }
        constructor() {
            super({
                id: QuickAccessViewPickerAction.ID,
                title: (0, nls_1.localize2)('quickOpenView', 'Quick Open View'),
                category: actionCommonCategories_1.Categories.View,
                f1: false, // hide quick pickers from command palette to not confuse with the other entry that shows a input field
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: undefined,
                    ...QuickAccessViewPickerAction.KEYBINDING
                }
            });
        }
        async run(accessor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keys = keybindingService.lookupKeybindings(QuickAccessViewPickerAction.ID);
            quickInputService.quickAccess.show(ViewQuickAccessProvider.PREFIX, { quickNavigateConfiguration: { keybindings: keys }, itemActivation: quickInput_1.ItemActivation.FIRST });
        }
    }
    exports.QuickAccessViewPickerAction = QuickAccessViewPickerAction;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1F1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcXVpY2thY2Nlc3MvYnJvd3Nlci92aWV3UXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBCekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSw2Q0FBNkM7O2lCQUVsRixXQUFNLEdBQUcsT0FBTyxBQUFWLENBQVc7UUFFeEIsWUFDMEMscUJBQTZDLEVBQ3RELFlBQTJCLEVBQzFCLGFBQTZCLEVBQzNCLGVBQWlDLEVBQzVCLG9CQUEyQyxFQUNuRCxZQUEyQixFQUNmLG9CQUErQyxFQUN0RCxpQkFBcUM7WUFFMUUsS0FBSyxDQUFDLHlCQUF1QixDQUFDLE1BQU0sRUFBRTtnQkFDckMsYUFBYSxFQUFFO29CQUNkLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsbUJBQW1CLENBQUM7b0JBQ3JELGNBQWMsRUFBRSxFQUFFO2lCQUNsQjthQUNELENBQUMsQ0FBQztZQWRzQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3RELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzFCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDNUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNmLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUFDdEQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtRQVEzRSxDQUFDO1FBRVMsU0FBUyxDQUFDLE1BQWM7WUFDakMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxN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