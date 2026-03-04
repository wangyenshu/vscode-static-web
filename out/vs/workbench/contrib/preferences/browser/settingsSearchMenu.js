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
define(["require", "exports", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/editor/contrib/suggest/browser/suggestController", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/preferences/common/preferences"], function (require, exports, dropdownActionViewItem_1, suggestController_1, nls_1, contextView_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsSearchFilterDropdownMenuActionViewItem = void 0;
    let SettingsSearchFilterDropdownMenuActionViewItem = class SettingsSearchFilterDropdownMenuActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(action, options, actionRunner, searchWidget, contextMenuService) {
            super(action, { getActions: () => this.getActions() }, contextMenuService, {
                ...options,
                actionRunner,
                classNames: action.class,
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */,
                menuAsChild: true
            });
            this.searchWidget = searchWidget;
            this.suggestController = suggestController_1.SuggestController.get(this.searchWidget.inputWidget);
        }
        render(container) {
            super.render(container);
        }
        doSearchWidgetAction(queryToAppend, triggerSuggest) {
            this.searchWidget.setValue(this.searchWidget.getValue().trimEnd() + ' ' + queryToAppend);
            this.searchWidget.focus();
            if (triggerSuggest && this.suggestController) {
                this.suggestController.triggerSuggest();
            }
        }
        /**
         * The created action appends a query to the search widget search string. It optionally triggers suggestions.
         */
        createAction(id, label, tooltip, queryToAppend, triggerSuggest) {
            return {
                id,
                label,
                tooltip,
                class: undefined,
                enabled: true,
                run: () => { this.doSearchWidgetAction(queryToAppend, triggerSuggest); }
            };
        }
        /**
         * The created action appends a query to the search widget search string, if the query does not exist.
         * Otherwise, it removes the query from the search widget search string.
         * The action does not trigger suggestions after adding or removing the query.
         */
        createToggleAction(id, label, tooltip, queryToAppend) {
            const splitCurrentQuery = this.searchWidget.getValue().split(' ');
            const queryContainsQueryToAppend = splitCurrentQuery.includes(queryToAppend);
            return {
                id,
                label,
                tooltip,
                class: undefined,
                enabled: true,
                checked: queryContainsQueryToAppend,
                run: () => {
                    if (!queryContainsQueryToAppend) {
                        const trimmedCurrentQuery = this.searchWidget.getValue().trimEnd();
                        const newQuery = trimmedCurrentQuery ? trimmedCurrentQuery + ' ' + queryToAppend : queryToAppend;
                        this.searchWidget.setValue(newQuery);
                    }
                    else {
                        const queryWithRemovedTags = this.searchWidget.getValue().split(' ')
                            .filter(word => word !== queryToAppend).join(' ');
                        this.searchWidget.setValue(queryWithRemovedTags);
                    }
                    this.searchWidget.focus();
                }
            };
        }
        getActions() {
            return [
                this.createToggleAction('modifiedSettingsSearch', (0, nls_1.localize)('modifiedSettingsSearch', "Modified"), (0, nls_1.localize)('modifiedSettingsSearchTooltip', "Add or remove modified settings filter"), `@${preferences_1.MODIFIED_SETTING_TAG}`),
                this.createAction('extSettingsSearch', (0, nls_1.localize)('extSettingsSearch', "Extension ID..."), (0, nls_1.localize)('extSettingsSearchTooltip', "Add extension ID filter"), `@${preferences_1.EXTENSION_SETTING_TAG}`, true),
                this.createAction('featuresSettingsSearch', (0, nls_1.localize)('featureSettingsSearch', "Feature..."), (0, nls_1.localize)('featureSettingsSearchTooltip', "Add feature filter"), `@${preferences_1.FEATURE_SETTING_TAG}`, true),
                this.createAction('tagSettingsSearch', (0, nls_1.localize)('tagSettingsSearch', "Tag..."), (0, nls_1.localize)('tagSettingsSearchTooltip', "Add tag filter"), `@${preferences_1.GENERAL_TAG_SETTING_TAG}`, true),
                this.createAction('langSettingsSearch', (0, nls_1.localize)('langSettingsSearch', "Language..."), (0, nls_1.localize)('langSettingsSearchTooltip', "Add language ID filter"), `@${preferences_1.LANGUAGE_SETTING_TAG}`, true),
                this.createToggleAction('onlineSettingsSearch', (0, nls_1.localize)('onlineSettingsSearch', "Online services"), (0, nls_1.localize)('onlineSettingsSearchTooltip', "Show settings for online services"), '@tag:usesOnlineServices'),
                this.createToggleAction('policySettingsSearch', (0, nls_1.localize)('policySettingsSearch', "Policy services"), (0, nls_1.localize)('policySettingsSearchTooltip', "Show settings for policy services"), `@${preferences_1.POLICY_SETTING_TAG}`)
            ];
        }
    };
    exports.SettingsSearchFilterDropdownMenuActionViewItem = SettingsSearchFilterDropdownMenuActionViewItem;
    exports.SettingsSearchFilterDropdownMenuActionViewItem = SettingsSearchFilterDropdownMenuActionViewItem = __decorate([
        __param(4, contextView_1.IContextMenuService)
    ], SettingsSearchFilterDropdownMenuActionViewItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NTZWFyY2hNZW51LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcHJlZmVyZW5jZXMvYnJvd3Nlci9zZXR0aW5nc1NlYXJjaE1lbnUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWXpGLElBQU0sOENBQThDLEdBQXBELE1BQU0sOENBQStDLFNBQVEsbURBQTBCO1FBRzdGLFlBQ0MsTUFBZSxFQUNmLE9BQStCLEVBQy9CLFlBQXVDLEVBQ3RCLFlBQWlDLEVBQzdCLGtCQUF1QztZQUU1RCxLQUFLLENBQUMsTUFBTSxFQUNYLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUN2QyxrQkFBa0IsRUFDbEI7Z0JBQ0MsR0FBRyxPQUFPO2dCQUNWLFlBQVk7Z0JBQ1osVUFBVSxFQUFFLE1BQU0sQ0FBQyxLQUFLO2dCQUN4Qix1QkFBdUIsRUFBRSxHQUFHLEVBQUUsOEJBQXNCO2dCQUNwRCxXQUFXLEVBQUUsSUFBSTthQUNqQixDQUNELENBQUM7WUFiZSxpQkFBWSxHQUFaLFlBQVksQ0FBcUI7WUFlbEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLHFDQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFUSxNQUFNLENBQUMsU0FBc0I7WUFDckMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBRU8sb0JBQW9CLENBQUMsYUFBcUIsRUFBRSxjQUF1QjtZQUMxRSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sRUFB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