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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/getIconClasses", "vs/base/common/fuzzyScorer", "vs/base/common/codicons", "vs/base/common/themables", "vs/css!./media/editorquickaccess"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, editorGroupsService_1, editor_1, editorService_1, model_1, language_1, getIconClasses_1, fuzzyScorer_1, codicons_1, themables_1) {
    "use strict";
    var ActiveGroupEditorsByMostRecentlyUsedQuickAccess_1, AllEditorsByAppearanceQuickAccess_1, AllEditorsByMostRecentlyUsedQuickAccess_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AllEditorsByMostRecentlyUsedQuickAccess = exports.AllEditorsByAppearanceQuickAccess = exports.ActiveGroupEditorsByMostRecentlyUsedQuickAccess = exports.BaseEditorQuickAccessProvider = void 0;
    let BaseEditorQuickAccessProvider = class BaseEditorQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(prefix, editorGroupService, editorService, modelService, languageService) {
            super(prefix, {
                canAcceptInBackground: true,
                noResultsPick: {
                    label: (0, nls_1.localize)('noViewResults', "No matching editors"),
                    groupId: -1
                }
            });
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.pickState = new class {
                constructor() {
                    this.scorerCache = Object.create(null);
                    this.isQuickNavigating = undefined;
                }
                reset(isQuickNavigating) {
                    // Caches
                    if (!isQuickNavigating) {
                        this.scorerCache = Object.create(null);
                    }
                    // Other
                    this.isQuickNavigating = isQuickNavigating;
                }
            };
        }
        provide(picker, token) {
            // Reset the pick state for this run
            this.pickState.reset(!!picker.quickNavigate);
            // Start picker
            return super.provide(picker, token);
        }
        _getPicks(filter) {
            const query = (0, fuzzyScorer_1.prepareQuery)(filter);
            // Filtering
            const filteredEditorEntries = this.doGetEditorPickItems().filter(entry => {
                if (!query.normalized) {
                    return true;
                }
                // Score on label and description
                const itemScore = (0, fuzzyScorer_1.scoreItemFuzzy)(entry, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache);
                if (!itemScore.score) {
                    return false;
                }
                // Apply highlights
                entry.highlights = { label: itemScore.labelMatch, description: itemScore.descriptionMatch };
                return true;
            });
            // Sorting
            if (query.normalized) {
                const groups = this.editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).map(group => group.id);
                filteredEditorEntries.sort((entryA, entryB) => {
                    if (entryA.groupId !== entryB.groupId) {
                        return groups.indexOf(entryA.groupId) - groups.indexOf(entryB.groupId); // older groups first
                    }
                    return (0, fuzzyScorer_1.compareItemsByFuzzyScore)(entryA, entryB, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache);
                });
            }
            // Grouping (for more than one group)
            const filteredEditorEntriesWithSeparators = [];
            if (this.editorGroupService.count > 1) {
                let lastGroupId = undefined;
                for (const entry of filteredEditorEntries) {
                    if (typeof lastGroupId !== 'number' || lastGroupId !== entry.groupId) {
                        const group = this.editorGroupService.getGroup(entry.groupId);
                        if (group) {
                            filteredEditorEntriesWithSeparators.push({ type: 'separator', label: group.label });
                        }
                        lastGroupId = entry.groupId;
                    }
                    filteredEditorEntriesWithSeparators.push(entry);
                }
            }
            else {
                filteredEditorEntriesWithSeparators.push(...filteredEditorEntries);
            }
            return filteredEditorEntriesWithSeparators;
        }
        doGetEditorPickItems() {
            const editors = this.doGetEditors();
            const mapGroupIdToGroupAriaLabel = new Map();
            for (const { groupId } of editors) {
                if (!mapGroupIdToGroupAriaLabel.has(groupId)) {
                    const group = this.editorGroupService.getGroup(groupId);
                    if (group) {
                        mapGroupIdToGroupAriaLabel.set(groupId, group.ariaLabel);
                    }
                }
            }
            return this.doGetEditors().map(({ editor, groupId }) => {
                const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                const isDirty = editor.isDirty() && !editor.isSaving();
                const description = editor.getDescription();
                const nameAndDescription = description ? `${editor.getName()} ${description}` : editor.getName();
                return {
                    groupId,
                    resource,
                    label: editor.getName(),
                    ariaLabel: (() => {
                        if (mapGroupIdToGroupAriaLabel.size > 1) {
                            return isDirty ?
                                (0, nls_1.localize)('entryAriaLabelWithGroupDirty', "{0}, unsaved changes, {1}", nameAndDescription, mapGroupIdToGroupAriaLabel.get(groupId)) :
                                (0, nls_1.localize)('entryAriaLabelWithGroup', "{0}, {1}", nameAndDescription, mapGroupIdToGroupAriaLabel.get(groupId));
                        }
                        return isDirty ? (0, nls_1.localize)('entryAriaLabelDirty', "{0}, unsaved changes", nameAndDescription) : nameAndDescription;
                    })(),
                    description,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, resource, undefined, editor.getIcon()).concat(editor.getLabelExtraClasses()),
                    italic: !this.editorGroupService.getGroup(groupId)?.isPinned(editor),
                    buttons: (() => {
                        return [
                            {
                                iconClass: isDirty ? ('dirty-editor ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.closeDirty)) : themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close),
                                tooltip: (0, nls_1.localize)('closeEditor', "Close Editor"),
                                alwaysVisible: isDirty
                            }
                        ];
                    })(),
                    trigger: async () => {
                        const group = this.editorGroupService.getGroup(groupId);
                        if (group) {
                            await group.closeEditor(editor, { preserveFocus: true });
                            if (!group.contains(editor)) {
                                return pickerQuickAccess_1.TriggerAction.REMOVE_ITEM;
                            }
                        }
                        return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                    },
                    accept: (keyMods, event) => this.editorGroupService.getGroup(groupId)?.openEditor(editor, { preserveFocus: event.inBackground }),
                };
            });
        }
    };
    exports.BaseEditorQuickAccessProvider = BaseEditorQuickAccessProvider;
    exports.BaseEditorQuickAccessProvider = BaseEditorQuickAccessProvider = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, editorService_1.IEditorService),
        __param(3, model_1.IModelService),
        __param(4, language_1.ILanguageService)
    ], BaseEditorQuickAccessProvider);
    //#region Active Editor Group Editors by Most Recently Used
    let ActiveGroupEditorsByMostRecentlyUsedQuickAccess = class ActiveGroupEditorsByMostRecentlyUsedQuickAccess extends BaseEditorQuickAccessProvider {
        static { ActiveGroupEditorsByMostRecentlyUsedQuickAccess_1 = this; }
        static { this.PREFIX = 'edt active '; }
        constructor(editorGroupService, editorService, modelService, languageService) {
            super(ActiveGroupEditorsByMostRecentlyUsedQuickAccess_1.PREFIX, editorGroupService, editorService, modelService, languageService);
        }
        doGetEditors() {
            const group = this.editorGroupService.activeGroup;
            return group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).map(editor => ({ editor, groupId: group.id }));
        }
    };
    exports.ActiveGroupEditorsByMostRecentlyUsedQuickAccess = ActiveGroupEditorsByMostRecentlyUsedQuickAccess;
    exports.ActiveGroupEditorsByMostRecentlyUsedQuickAccess = ActiveGroupEditorsByMostRecentlyUsedQuickAccess = ActiveGroupEditorsByMostRecentlyUsedQuickAccess_1 = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService)
    ], ActiveGroupEditorsByMostRecentlyUsedQuickAccess);
    //#endregion
    //#region All Editors by Appearance
    let AllEditorsByAppearanceQuickAccess = class AllEditorsByAppearanceQuickAccess extends BaseEditorQuickAccessProvider {
        static { AllEditorsByAppearanceQuickAccess_1 = this; }
        static { this.PREFIX = 'edt '; }
        constructor(editorGroupService, editorService, modelService, languageService) {
            super(AllEditorsByAppearanceQuickAccess_1.PREFIX, editorGroupService, editorService, modelService, languageService);
        }
        doGetEditors() {
            const entries = [];
            for (const group of this.editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)) {
                for (const editor of group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)) {
                    entries.push({ editor, groupId: group.id });
                }
            }
            return entries;
        }
    };
    exports.AllEditorsByAppearanceQuickAccess = AllEditorsByAppearanceQuickAccess;
    exports.AllEditorsByAppearanceQuickAccess = AllEditorsByAppearanceQuickAccess = AllEditorsByAppearanceQuickAccess_1 = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService)
    ], AllEditorsByAppearanceQuickAccess);
    //#endregion
    //#region All Editors by Most Recently Used
    let AllEditorsByMostRecentlyUsedQuickAccess = class AllEditorsByMostRecentlyUsedQuickAccess extends BaseEditorQuickAccessProvider {
        static { AllEditorsByMostRecentlyUsedQuickAccess_1 = this; }
        static { this.PREFIX = 'edt mru '; }
        constructor(editorGroupService, editorService, modelService, languageService) {
            super(AllEditorsByMostRecentlyUsedQuickAccess_1.PREFIX, editorGroupService, editorService, modelService, languageService);
        }
        doGetEditors() {
            const entries = [];
            for (const editor of this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                entries.push(editor);
            }
            return entries;
        }
    };
    exports.AllEditorsByMostRecentlyUsedQuickAccess = AllEditorsByMostRecentlyUsedQuickAccess;
    exports.AllEditorsByMostRecentlyUsedQuickAccess = AllEditorsByMostRecentlyUsedQuickAccess = AllEditorsByMostRecentlyUsedQuickAccess_1 = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService)
    ], AllEditorsByMostRecentlyUsedQuickAccess);
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXNCekYsSUFBZSw2QkFBNkIsR0FBNUMsTUFBZSw2QkFBOEIsU0FBUSw2Q0FBK0M7UUFtQjFHLFlBQ0MsTUFBYyxFQUNRLGtCQUEyRCxFQUNqRSxhQUFnRCxFQUNqRCxZQUE0QyxFQUN6QyxlQUFrRDtZQUVwRSxLQUFLLENBQUMsTUFBTSxFQUNYO2dCQUNDLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLGFBQWEsRUFBRTtvQkFDZCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLHFCQUFxQixDQUFDO29CQUN2RCxPQUFPLEVBQUUsQ0FBQyxDQUFDO2lCQUNYO2FBQ0QsQ0FDRCxDQUFDO1lBYnVDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDOUMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ2hDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQXRCcEQsY0FBUyxHQUFHLElBQUk7Z0JBQUE7b0JBRWhDLGdCQUFXLEdBQXFCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3BELHNCQUFpQixHQUF3QixTQUFTLENBQUM7Z0JBWXBELENBQUM7Z0JBVkEsS0FBSyxDQUFDLGlCQUEwQjtvQkFFL0IsU0FBUztvQkFDVCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN4QyxDQUFD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