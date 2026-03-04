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
define(["require", "exports", "vs/base/common/collections", "vs/base/common/event", "vs/base/common/types", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, collections_1, event_1, types_1, uri_1, instantiation_1, extHost_protocol_1, extHostRpcService_1, typeConverters, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostEditorTabs = exports.IExtHostEditorTabs = void 0;
    exports.IExtHostEditorTabs = (0, instantiation_1.createDecorator)('IExtHostEditorTabs');
    class ExtHostEditorTab {
        constructor(dto, parentGroup, activeTabIdGetter) {
            this._activeTabIdGetter = activeTabIdGetter;
            this._parentGroup = parentGroup;
            this.acceptDtoUpdate(dto);
        }
        get apiObject() {
            if (!this._apiObject) {
                // Don't want to lose reference to parent `this` in the getters
                const that = this;
                const obj = {
                    get isActive() {
                        // We use a getter function here to always ensure at most 1 active tab per group and prevent iteration for being required
                        return that._dto.id === that._activeTabIdGetter();
                    },
                    get label() {
                        return that._dto.label;
                    },
                    get input() {
                        return that._input;
                    },
                    get isDirty() {
                        return that._dto.isDirty;
                    },
                    get isPinned() {
                        return that._dto.isPinned;
                    },
                    get isPreview() {
                        return that._dto.isPreview;
                    },
                    get group() {
                        return that._parentGroup.apiObject;
                    }
                };
                this._apiObject = Object.freeze(obj);
            }
            return this._apiObject;
        }
        get tabId() {
            return this._dto.id;
        }
        acceptDtoUpdate(dto) {
            this._dto = dto;
            this._input = this._initInput();
        }
        _initInput() {
            switch (this._dto.input.kind) {
                case 1 /* TabInputKind.TextInput */:
                    return new extHostTypes_1.TextTabInput(uri_1.URI.revive(this._dto.input.uri));
                case 2 /* TabInputKind.TextDiffInput */:
                    return new extHostTypes_1.TextDiffTabInput(uri_1.URI.revive(this._dto.input.original), uri_1.URI.revive(this._dto.input.modified));
                case 3 /* TabInputKind.TextMergeInput */:
                    return new extHostTypes_1.TextMergeTabInput(uri_1.URI.revive(this._dto.input.base), uri_1.URI.revive(this._dto.input.input1), uri_1.URI.revive(this._dto.input.input2), uri_1.URI.revive(this._dto.input.result));
                case 6 /* TabInputKind.CustomEditorInput */:
                    return new extHostTypes_1.CustomEditorTabInput(uri_1.URI.revive(this._dto.input.uri), this._dto.input.viewType);
                case 7 /* TabInputKind.WebviewEditorInput */:
                    return new extHostTypes_1.WebviewEditorTabInput(this._dto.input.viewType);
                case 4 /* TabInputKind.NotebookInput */:
                    return new extHostTypes_1.NotebookEditorTabInput(uri_1.URI.revive(this._dto.input.uri), this._dto.input.notebookType);
                case 5 /* TabInputKind.NotebookDiffInput */:
                    return new extHostTypes_1.NotebookDiffEditorTabInput(uri_1.URI.revive(this._dto.input.original), uri_1.URI.revive(this._dto.input.modified), this._dto.input.notebookType);
                case 8 /* TabInputKind.TerminalEditorInput */:
                    return new extHostTypes_1.TerminalEditorTabInput();
                case 9 /* TabInputKind.InteractiveEditorInput */:
                    return new extHostTypes_1.InteractiveWindowInput(uri_1.URI.revive(this._dto.input.uri), uri_1.URI.revive(this._dto.input.inputBoxUri));
                case 10 /* TabInputKind.ChatEditorInput */:
                    return new extHostTypes_1.ChatEditorTabInput();
                case 11 /* TabInputKind.MultiDiffEditorInput */:
                    return new extHostTypes_1.TextMultiDiffTabInput(this._dto.input.diffEditors.map(diff => new extHostTypes_1.TextDiffTabInput(uri_1.URI.revive(diff.original), uri_1.URI.revive(diff.modified))));
                default:
                    return undefined;
            }
        }
    }
    class ExtHostEditorTabGroup {
        constructor(dto, activeGroupIdGetter) {
            this._tabs = [];
            this._activeTabId = '';
            this._dto = dto;
            this._activeGroupIdGetter = activeGroupIdGetter;
            // Construct all tabs from the given dto
            for (const tabDto of dto.tabs) {
                if (tabDto.isActive) {
                    this._activeTabId = tabDto.id;
                }
                this._tabs.push(new ExtHostEditorTab(tabDto, this, () => this.activeTabId()));
            }
        }
        get apiObject() {
            if (!this._apiObject) {
                // Don't want to lose reference to parent `this` in the getters
                const that = this;
                const obj = {
                    get isActive() {
                        // We use a getter function here to always ensure at most 1 active group and prevent iteration for being required
                        return that._dto.groupId === that._activeGroupIdGetter();
                    },
                    get viewColumn() {
                        return typeConverters.ViewColumn.to(that._dto.viewColumn);
                    },
                    get activeTab() {
                        return that._tabs.find(tab => tab.tabId === that._activeTabId)?.apiObject;
                    },
                    get tabs() {
                        return Object.freeze(that._tabs.map(tab => tab.apiObject));
                    }
                };
                this._apiObject = Object.freeze(obj);
            }
            return this._apiObject;
        }
        get groupId() {
            return this._dto.groupId;
        }
        get tabs() {
            return this._tabs;
        }
        acceptGroupDtoUpdate(dto) {
            this._dto = dto;
        }
        acceptTabOperation(operation) {
            // In the open case we add the tab to the group
            if (operation.kind === 0 /* TabModelOperationKind.TAB_OPEN */) {
                const tab = new ExtHostEditorTab(operation.tabDto, this, () => this.activeTabId());
                // Insert tab at editor index
                this._tabs.splice(operation.index, 0, tab);
                if (operation.tabDto.isActive) {
                    this._activeTabId = tab.tabId;
                }
                return tab;
            }
            else if (operation.kind === 1 /* TabModelOperationKind.TAB_CLOSE */) {
                const tab = this._tabs.splice(operation.index, 1)[0];
                if (!tab) {
                    throw new Error(`Tab close updated received for index ${operation.index} which does not exist`);
                }
                if (tab.tabId === this._activeTabId) {
                    this._activeTabId = '';
                }
                return tab;
            }
            else if (operation.kind === 3 /* TabModelOperationKind.TAB_MOVE */) {
                if (operation.oldIndex === undefined) {
                    throw new Error('Invalid old index on move IPC');
                }
                // Splice to remove at old index and insert at new index === moving the tab
                const tab = this._tabs.splice(operation.oldIndex, 1)[0];
                if (!tab) {
                    throw new Error(`Tab move updated received for index ${operation.oldIndex} which does not exist`);
                }
                this._tabs.splice(operation.index, 0, tab);
                return tab;
            }
            const tab = this._tabs.find(extHostTab => extHostTab.tabId === operation.tabDto.id);
            if (!tab) {
                throw new Error('INVALID tab');
            }
            if (operation.tabDto.isActive) {
                this._activeTabId = operation.tabDto.id;
            }
            else if (this._activeTabId === operation.tabDto.id && !operation.tabDto.isActive) {
                // Events aren't guaranteed to be in order so if we receive a dto that matches the active tab id
                // but isn't active we mark the active tab id as empty. This prevent onDidActiveTabChange from
                // firing incorrectly
                this._activeTabId = '';
            }
            tab.acceptDtoUpdate(operation.tabDto);
            return tab;
        }
        // Not a getter since it must be a function to be used as a callback for the tabs
        activeTabId() {
            return this._activeTabId;
        }
    }
    let ExtHostEditorTabs = class ExtHostEditorTabs {
        constructor(extHostRpc) {
            this._onDidChangeTabs = new event_1.Emitter();
            this._onDidChangeTabGroups = new event_1.Emitter();
            this._extHostTabGroups = [];
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadEditorTabs);
        }
        get tabGroups() {
            if (!this._apiObject) {
                const that = this;
                const obj = {
                    // never changes -> simple value
                    onDidChangeTabGroups: that._onDidChangeTabGroups.event,
                    onDidChangeTabs: that._onDidChangeTabs.event,
                    // dynamic -> getters
                    get all() {
                        return Object.freeze(that._extHostTabGroups.map(group => group.apiObject));
                    },
                    get activeTabGroup() {
                        const activeTabGroupId = that._activeGroupId;
                        const activeTabGroup = (0, types_1.assertIsDefined)(that._extHostTabGroups.find(candidate => candidate.groupId === activeTabGroupId)?.apiObject);
                        return activeTabGroup;
                    },
                    close: async (tabOrTabGroup, preserveFocus) => {
                        const tabsOrTabGroups = Array.isArray(tabOrTabGroup) ? tabOrTabGroup : [tabOrTabGroup];
                        if (!tabsOrTabGroups.length) {
                            return true;
                        }
                        // Check which type was passed in and call the appropriate close
                        // Casting is needed as typescript doesn't seem to infer enough from this
                        if (isTabGroup(tabsOrTabGroups[0])) {
                            return this._closeGroups(tabsOrTabGroups, preserveFocus);
                        }
                        else {
                            return this._closeTabs(tabsOrTabGroups, preserveFocus);
                        }
                    },
                    // move: async (tab: vscode.Tab, viewColumn: ViewColumn, index: number, preserveFocus?: boolean) => {
                    // 	const extHostTab = this._findExtHostTabFromApi(tab);
                    // 	if (!extHostTab) {
                    // 		throw new Error('Invalid tab');
                    // 	}
                    // 	this._proxy.$moveTab(extHostTab.tabId, index, typeConverters.ViewColumn.from(viewColumn), preserveFocus);
                    // 	return;
                    // }
                };
                this._apiObject = Object.freeze(obj);
            }
            return this._apiObject;
        }
        $acceptEditorTabModel(tabGroups) {
            const groupIdsBefore = new Set(this._extHostTabGroups.map(group => group.groupId));
            const groupIdsAfter = new Set(tabGroups.map(dto => dto.groupId));
            const diff = (0, collections_1.diffSets)(groupIdsBefore, groupIdsAfter);
            const closed = this._extHostTabGroups.filter(group => diff.removed.includes(group.groupId)).map(group => group.apiObject);
            const opened = [];
            const changed = [];
            this._extHostTabGroups = tabGroups.map(tabGroup => {
                const group = new ExtHostEditorTabGroup(tabGroup, () => this._activeGroupId);
                if (diff.added.includes(group.groupId)) {
                    opened.push(group.apiObject);
                }
                else {
                    changed.push(group.apiObject);
                }
                return group;
            });
            // Set the active tab group id
            const activeTabGroupId = (0, types_1.assertIsDefined)(tabGroups.find(group => group.isActive === true)?.groupId);
            if (activeTabGroupId !== undefined && this._activeGroupId !== activeTabGroupId) {
                this._activeGroupId = activeTabGroupId;
            }
            this._onDidChangeTabGroups.fire(Object.freeze({ opened, closed, changed }));
        }
        $acceptTabGroupUpdate(groupDto) {
            const group = this._extHostTabGroups.find(group => group.groupId === groupDto.groupId);
            if (!group) {
                throw new Error('Update Group IPC call received before group creation.');
            }
            group.acceptGroupDtoUpdate(groupDto);
            if (groupDto.isActive) {
                this._activeGroupId = groupDto.groupId;
            }
            this._onDidChangeTabGroups.fire(Object.freeze({ changed: [group.apiObject], opened: [], closed: [] }));
        }
        $acceptTabOperation(operation) {
            const group = this._extHostTabGroups.find(group => group.groupId === operation.groupId);
            if (!group) {
                throw new Error('Update Tabs IPC call received before group creation.');
            }
            const tab = group.acceptTabOperation(operation);
            // Construct the tab change event based on the operation
            switch (operation.kind) {
                case 0 /* TabModelOperationKind.TAB_OPEN */:
                    this._onDidChangeTabs.fire(Object.freeze({
                        opened: [tab.apiObject],
                        closed: [],
                        changed: []
                    }));
                    return;
                case 1 /* TabModelOperationKind.TAB_CLOSE */:
                    this._onDidChangeTabs.fire(Object.freeze({
                        opened: [],
                        closed: [tab.apiObject],
                        changed: []
                    }));
                    return;
                case 3 /* TabModelOperationKind.TAB_MOVE */:
                case 2 /* TabModelOperationKind.TAB_UPDATE */:
                    this._onDidChangeTabs.fire(Object.freeze({
                        opened: [],
                        closed: [],
                        changed: [tab.apiObject]
                    }));
                    return;
            }
        }
        _findExtHostTabFromApi(apiTab) {
            for (const group of this._extHostTabGroups) {
                for (const tab of group.tabs) {
                    if (tab.apiObject === apiTab) {
                        return tab;
                    }
                }
            }
            return;
        }
        _findExtHostTabGroupFromApi(apiTabGroup) {
            return this._extHostTabGroups.find(candidate => candidate.apiObject === apiTabGroup);
        }
        async _closeTabs(tabs, preserveFocus) {
            const extHostTabIds = [];
            for (const tab of tabs) {
                const extHostTab = this._findExtHostTabFromApi(tab);
                if (!extHostTab) {
                    throw new Error('Tab close: Invalid tab not found!');
                }
                extHostTabIds.push(extHostTab.tabId);
            }
            return this._proxy.$closeTab(extHostTabIds, preserveFocus);
        }
        async _closeGroups(groups, preserverFoucs) {
            const extHostGroupIds = [];
            for (const group of groups) {
                const extHostGroup = this._findExtHostTabGroupFromApi(group);
                if (!extHostGroup) {
                    throw new Error('Group close: Invalid group not found!');
                }
                extHostGroupIds.push(extHostGroup.groupId);
            }
            return this._proxy.$closeGroup(extHostGroupIds, preserverFoucs);
        }
    };
    exports.ExtHostEditorTabs = ExtHostEditorTabs;
    exports.ExtHostEditorTabs = ExtHostEditorTabs = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostEditorTabs);
    //#region Utils
    function isTabGroup(obj) {
        const tabGroup = obj;
        if (tabGroup.tabs !== undefined) {
            return true;
        }
        return false;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEVkaXRvclRhYnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0RWRpdG9yVGFicy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQm5GLFFBQUEsa0JBQWtCLEdBQUcsSUFBQSwrQkFBZSxFQUFxQixvQkFBb0IsQ0FBQyxDQUFDO0lBSTVGLE1BQU0sZ0JBQWdCO1FBT3JCLFlBQVksR0FBa0IsRUFBRSxXQUFrQyxFQUFFLGlCQUErQjtZQUNsRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsaUJBQWlCLENBQUM7WUFDNUMsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7WUFDaEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdEIsK0RBQStEO2dCQUMvRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLE1BQU0sR0FBRyxHQUFlO29CQUN2QixJQUFJLFFBQVE7d0JBQ1gseUhBQXlIO3dCQUN6SCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUNuRCxDQUFDO29CQUNELElBQUksS0FBSzt3QkFDUixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO29CQUN4QixDQUFDO29CQUNELElBQUksS0FBSzt3QkFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7b0JBQ3BCLENBQUM7b0JBQ0QsSUFBSSxPQUFPO3dCQUNWLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7b0JBQzFCLENB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