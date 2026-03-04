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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/terminal/browser/terminalGroup", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey"], function (require, exports, async_1, event_1, lifecycle_1, contextkey_1, instantiation_1, views_1, viewsService_1, terminalGroup_1, terminalUri_1, terminal_1, terminalContextKey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalGroupService = void 0;
    let TerminalGroupService = class TerminalGroupService extends lifecycle_1.Disposable {
        get instances() {
            return this.groups.reduce((p, c) => p.concat(c.terminalInstances), []);
        }
        constructor(_contextKeyService, _instantiationService, _viewsService, _viewDescriptorService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._viewsService = _viewsService;
            this._viewDescriptorService = _viewDescriptorService;
            this.groups = [];
            this.activeGroupIndex = -1;
            this.lastAccessedMenu = 'inline-tab';
            this._onDidChangeActiveGroup = this._register(new event_1.Emitter());
            this.onDidChangeActiveGroup = this._onDidChangeActiveGroup.event;
            this._onDidDisposeGroup = this._register(new event_1.Emitter());
            this.onDidDisposeGroup = this._onDidDisposeGroup.event;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this._onDidShow = this._register(new event_1.Emitter());
            this.onDidShow = this._onDidShow.event;
            this._onDidDisposeInstance = this._register(new event_1.Emitter());
            this.onDidDisposeInstance = this._onDidDisposeInstance.event;
            this._onDidFocusInstance = this._register(new event_1.Emitter());
            this.onDidFocusInstance = this._onDidFocusInstance.event;
            this._onDidChangeActiveInstance = this._register(new event_1.Emitter());
            this.onDidChangeActiveInstance = this._onDidChangeActiveInstance.event;
            this._onDidChangeInstances = this._register(new event_1.Emitter());
            this.onDidChangeInstances = this._onDidChangeInstances.event;
            this._onDidChangeInstanceCapability = this._register(new event_1.Emitter());
            this.onDidChangeInstanceCapability = this._onDidChangeInstanceCapability.event;
            this._onDidChangePanelOrientation = this._register(new event_1.Emitter());
            this.onDidChangePanelOrientation = this._onDidChangePanelOrientation.event;
            this._terminalGroupCountContextKey = terminalContextKey_1.TerminalContextKeys.groupCount.bindTo(this._contextKeyService);
            this._register(this.onDidDisposeGroup(group => this._removeGroup(group)));
            this._register(this.onDidChangeGroups(() => this._terminalGroupCountContextKey.set(this.groups.length)));
            this._register(event_1.Event.any(this.onDidChangeActiveGroup, this.onDidChangeInstances)(() => this.updateVisibility()));
        }
        hidePanel() {
            // Hide the panel if the terminal is in the panel and it has no sibling views
            const panel = this._viewDescriptorService.getViewContainerByViewId(terminal_1.TERMINAL_VIEW_ID);
            if (panel && this._viewDescriptorService.getViewContainerModel(panel).activeViewDescriptors.length === 1) {
                this._viewsService.closeView(terminal_1.TERMINAL_VIEW_ID);
                terminalContextKey_1.TerminalContextKeys.tabsMouse.bindTo(this._contextKeyService).set(false);
            }
        }
        get activeGroup() {
            if (this.activeGroupIndex < 0 || this.activeGroupIndex >= this.groups.length) {
                return undefined;
            }
            return this.groups[this.activeGroupIndex];
        }
        set activeGroup(value) {
            if (value === undefined) {
                // Setting to undefined is not possible, this can only be done when removing the last group
                return;
            }
            const index = this.groups.findIndex(e => e === value);
            this.setActiveGroupByIndex(index);
        }
        get activeInstance() {
            return this.activeGroup?.activeInstance;
        }
        setActiveInstance(instance) {
            this.setActiveInstanceByIndex(this._getIndexFromId(instance.instanceId));
        }
        _getIndexFromId(terminalId) {
            const terminalIndex = this.instances.findIndex(e => e.instanceId === terminalId);
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        setContainer(container) {
            this._container = container;
            this.groups.forEach(group => group.attachToElement(container));
        }
        async focusTabs() {
            if (this.instances.length === 0) {
                return;
            }
            await this.showPanel(true);
            const pane = this._viewsService.getActiveViewWithId(terminal_1.TERMINAL_VIEW_ID);
            pane?.terminalTabbedView?.focusTabs();
        }
        async focusHover() {
            if (this.instances.length === 0) {
                return;
            }
            const pane = this._viewsService.getActiveViewWithId(terminal_1.TERMINAL_VIEW_ID);
            pane?.terminalTabbedView?.focusHover();
        }
        async focusActiveInstance() {
            return this.showPanel(true);
        }
        createGroup(slcOrInstance) {
            const group = this._instantiationService.createInstance(terminalGroup_1.TerminalGroup, this._container, slcOrInstance);
            // TODO: Move panel orientation change into this file so it's not fired many times
            group.onPanelOrientationChanged((orientation) => this._onDidChangePanelOrientation.fire(orientation));
            this.groups.push(group);
            group.addDisposable(group.onDidDisposeInstance(this._onDidDisposeInstance.fire, this._onDidDisposeInstance));
            group.addDisposable(group.onDidFocusInstance(this._onDidFocusInstance.fire, this._onDidFocusInstance));
            group.addDisposable(group.onDidChangeActiveInstance(e => {
                if (group === this.activeGroup) {
                    this._onDidChangeActiveInstance.fire(e);
                }
            }));
            group.addDisposable(group.onDidChangeInstanceCapability(this._onDidChangeInstanceCapability.fire, this._onDidChangeInstanceCapability));
            group.addDisposable(group.onInstancesChanged(this._onDidChangeInstances.fire, this._onDidChangeInstances));
            group.addDisposable(group.onDisposed(this._onDidDisposeGroup.fire, this._onDidDisposeGroup));
            if (group.terminalInstances.length > 0) {
                this._onDidChangeInstances.fire();
            }
            if (this.instances.length === 1) {
                // It's the first instance so it should be made active automatically, this must fire
                // after onInstancesChanged so consumers can react to the instance being added first
                this.setActiveInstanceByIndex(0);
            }
            this._onDidChangeGroups.fire();
            return group;
        }
        async showPanel(focus) {
            const pane = this._viewsService.getActiveViewWithId(terminal_1.TERMINAL_VIEW_ID)
                ?? await this._viewsService.openView(terminal_1.TERMINAL_VIEW_ID, focus);
            pane?.setExpanded(true);
            if (focus) {
                // Do the focus call asynchronously as going through the
                // command palette will force editor focus
                await (0, async_1.timeout)(0);
                const instance = this.activeInstance;
                if (instance) {
                    // HACK: Ensure the panel is still visible at this point as there may have been
                    // a request since it was opened to show a different panel
                    if (pane && !pane.isVisible()) {
                        await this._viewsService.openView(terminal_1.TERMINAL_VIEW_ID, focus);
                    }
                    await instance.focusWhenReady(true);
                }
            }
            this._onDidShow.fire();
        }
        getInstanceFromResource(resource) {
            return (0, terminalUri_1.getInstanceFromResource)(this.instances, resource);
        }
        _removeGroup(group) {
            // Get the index of the group and remove it from the list
            const activeGroup = this.activeGroup;
            const wasActiveGroup = group === activeGroup;
            const index = this.groups.indexOf(group);
            if (index !== -1) {
                this.groups.splice(index, 1);
                this._onDidChangeGroups.fire();
            }
            if (wasActiveGroup) {
                // Adjust focus if the group was active
                if (this.groups.length > 0) {
                    const newIndex = index < this.groups.length ? index : this.groups.length - 1;
                    this.setActiveGroupByIndex(newIndex, true);
                    this.activeInstance?.focus(true);
                }
            }
            else {
                // Adjust the active group if the removed group was above the active group
                if (this.activeGroupIndex > index) {
                    this.setActiveGroupByIndex(this.activeGroupIndex - 1);
                }
            }
            // Ensure the active group is still valid, this should set the activeGroupIndex to -1 if
            // there are no groups
            if (this.activeGroupIndex >= this.groups.length) {
                this.setActiveGroupByIndex(this.groups.length - 1);
            }
            this._onDidChangeInstances.fire();
            this._onDidChangeGroups.fire();
            if (wasActiveGroup) {
                this._onDidChangeActiveGroup.fire(this.activeGroup);
                this._onDidChangeActiveInstance.fire(this.activeInstance);
            }
        }
        /**
         * @param force Whether to force the group change, this should be used when the previous active
         * group has been removed.
         */
        setActiveGroupByIndex(index, force) {
            // Unset active group when the last group is removed
            if (index === -1 && this.groups.length === 0) {
                if (this.activeGroupIndex !== -1) {
                    this.activeGroupIndex = -1;
                    this._onDidChangeActiveGroup.fire(this.activeGroup);
                    this._onDidChangeActiveInstance.fire(this.activeInstance);
                }
                return;
            }
            // Ensure index is valid
            if (index < 0 || index >= this.groups.length) {
                return;
            }
            // Fire group/instance change if needed
            const oldActiveGroup = this.activeGroup;
            this.activeGroupIndex = index;
            if (force || oldActiveGroup !== this.activeGroup) {
                this._onDidChangeActiveGroup.fire(this.activeGroup);
                this._onDidChangeActiveInstance.fire(this.activeInstance);
            }
        }
        _getInstanceLocation(index) {
            let currentGroupIndex = 0;
            while (index >= 0 && currentGroupIndex < this.groups.length) {
                const group = this.groups[currentGroupIndex];
                const count = group.terminalInstances.length;
                if (index < count) {
                    return {
                        group,
                        groupIndex: currentGroupIndex,
                        instance: group.terminalInstances[index],
                        instanceIndex: index
                    };
                }
                index -= count;
                currentGroupIndex++;
            }
            return undefined;
        }
        setActiveInstanceByIndex(index) {
            const activeInstance = this.activeInstance;
            const instanceLocation = this._getInstanceLocation(index);
            const newActiveInstance = instanceLocation?.group.terminalInstances[instanceLocation.instanceIndex];
            if (!instanceLocation || activeInstance === newActiveInstance) {
                return;
            }
            const activeInstanceIndex = instanceLocation.instanceIndex;
            this.activeGroupIndex = instanceLocation.groupIndex;
            this._onDidChangeActiveGroup.fire(this.activeGroup);
            instanceLocation.group.setActiveInstanceByIndex(activeInstanceIndex, true);
        }
        setActiveGroupToNext() {
            if (this.groups.length <= 1) {
                return;
            }
            let newIndex = this.activeGroupIndex + 1;
            if (newIndex >= this.groups.length) {
                newIndex = 0;
            }
            this.setActiveGroupByIndex(newIndex);
        }
        setActiveGroupToPrevious() {
            if (this.groups.length <= 1) {
                return;
            }
            let newIndex = this.activeGroupIndex - 1;
            if (newIndex < 0) {
                newIndex = this.groups.length - 1;
            }
            this.setActiveGroupByIndex(newIndex);
        }
        moveGroup(source, target) {
            const sourceGroup = this.getGroupForInstance(source);
            const targetGroup = this.getGroupForInstance(target);
            // Something went wrong
            if (!sourceGroup || !targetGroup) {
                return;
            }
            // The groups are the same, rearrange within the group
            if (sourceGroup === targetGroup) {
                const index = sourceGroup.terminalInstances.indexOf(target);
                if (index !== -1) {
                    sourceGroup.moveInstance(source, index);
                }
                return;
            }
            // The groups differ, rearrange groups
            const sourceGroupIndex = this.groups.indexOf(sourceGroup);
            const targetGroupIndex = this.groups.indexOf(targetGroup);
            this.groups.splice(sourceGroupIndex, 1);
            this.groups.splice(targetGroupIndex, 0, sourceGroup);
            this._onDidChangeInstances.fire();
        }
        moveGroupToEnd(source) {
            const sourceGroup = this.getGroupForInstance(source);
            if (!sourceGroup) {
                return;
            }
            const sourceGroupIndex = this.groups.indexOf(sourceGroup);
            this.groups.splice(sourceGroupIndex, 1);
            this.groups.push(sourceGroup);
            this._onDidChangeInstances.fire();
        }
        moveInstance(source, target, side) {
            const sourceGroup = this.getGroupForInstance(source);
            const targetGroup = this.getGroupForInstance(target);
            if (!sourceGroup || !targetGroup) {
                return;
            }
            // Move from the source group to the target group
            if (sourceGroup !== targetGroup) {
                // Move groups
                sourceGroup.removeInstance(source);
                targetGroup.addInstance(source);
            }
            // Rearrange within the target group
            const index = targetGroup.terminalInstances.indexOf(target) + (side === 'after' ? 1 : 0);
            targetGroup.moveInstance(source, index);
        }
        unsplitInstance(instance) {
            const oldGroup = this.getGroupForInstance(instance);
            if (!oldGroup || oldGroup.terminalInstances.length < 2) {
                return;
            }
            oldGroup.removeInstance(instance);
            this.createGroup(instance);
        }
        joinInstances(instances) {
            const group = this.getGroupForInstance(instances[0]);
            if (group) {
                let differentGroups = true;
                for (let i = 1; i < group.terminalInstances.length; i++) {
                    if (group.terminalInstances.includes(instances[i])) {
                        differentGroups = false;
                        break;
                    }
                }
                if (!differentGroups && group.terminalInstances.length === instances.length) {
                    return;
                }
            }
            // Find the group of the first instance that is the only instance in the group, if one exists
            let candidateInstance = undefined;
            let candidateGroup = undefined;
            for (const instance of instances) {
                const group = this.getGroupForInstance(instance);
                if (group?.terminalInstances.length === 1) {
                    candidateInstance = instance;
                    candidateGroup = group;
                    break;
                }
            }
            // Create a new group if needed
            if (!candidateGroup) {
                candidateGroup = this.createGroup();
            }
            const wasActiveGroup = this.activeGroup === candidateGroup;
            // Unsplit all other instances and add them to the new group
            for (const instance of instances) {
                if (instance === candidateInstance) {
                    continue;
                }
                const oldGroup = this.getGroupForInstance(instance);
                if (!oldGroup) {
                    // Something went wrong, don't join this one
                    continue;
                }
                oldGroup.removeInstance(instance);
                candidateGroup.addInstance(instance);
            }
            // Set the active terminal
            this.setActiveInstance(instances[0]);
            // Fire events
            this._onDidChangeInstances.fire();
            if (!wasActiveGroup) {
                this._onDidChangeActiveGroup.fire(this.activeGroup);
            }
        }
        instanceIsSplit(instance) {
            const group = this.getGroupForInstance(instance);
            if (!group) {
                return false;
            }
            return group.terminalInstances.length > 1;
        }
        getGroupForInstance(instance) {
            return this.groups.find(group => group.terminalInstances.includes(instance));
        }
        getGroupLabels() {
            return this.groups.filter(group => group.terminalInstances.length > 0).map((group, index) => {
                return `${index + 1}: ${group.title ? group.title : ''}`;
            });
        }
        /**
         * Visibility should be updated in the following cases:
         * 1. Toggle `TERMINAL_VIEW_ID` visibility
         * 2. Change active group
         * 3. Change instances in active group
         */
        updateVisibility() {
            const visible = this._viewsService.isViewVisible(terminal_1.TERMINAL_VIEW_ID);
            this.groups.forEach((g, i) => g.setVisible(visible && i === this.activeGroupIndex));
        }
    };
    exports.TerminalGroupService = TerminalGroupService;
    exports.TerminalGroupService = TerminalGroupService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, viewsService_1.IViewsService),
        __param(3, views_1.IViewDescriptorService)
    ], TerminalGroupService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxHcm91cFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsR3JvdXBTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQUtuRCxJQUFJLFNBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUF5QixDQUFDLENBQUM7UUFDL0YsQ0FBQztRQStCRCxZQUNxQixrQkFBOEMsRUFDM0MscUJBQTZELEVBQ3JFLGFBQTZDLEVBQ3BDLHNCQUErRDtZQUV2RixLQUFLLEVBQUUsQ0FBQztZQUxvQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzFCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDcEQsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDbkIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQXZDeEYsV0FBTSxHQUFxQixFQUFFLENBQUM7WUFDOUIscUJBQWdCLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFLOUIscUJBQWdCLEdBQThCLFlBQVksQ0FBQztZQU0xQyw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE4QixDQUFDLENBQUM7WUFDNUYsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztZQUNwRCx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxD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