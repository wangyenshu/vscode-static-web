/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/arrays", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/dom", "vs/base/common/resourceTree"], function (require, exports, path, actions_1, actions_2, menuEntryActionViewItem_1, arrays_1, actionViewItems_1, iconLabels_1, dom_1, resourceTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusBarAction = void 0;
    exports.isSCMRepositoryArray = isSCMRepositoryArray;
    exports.isSCMViewService = isSCMViewService;
    exports.isSCMRepository = isSCMRepository;
    exports.isSCMInput = isSCMInput;
    exports.isSCMActionButton = isSCMActionButton;
    exports.isSCMResourceGroup = isSCMResourceGroup;
    exports.isSCMResource = isSCMResource;
    exports.isSCMResourceNode = isSCMResourceNode;
    exports.isSCMHistoryItemGroupTreeElement = isSCMHistoryItemGroupTreeElement;
    exports.isSCMHistoryItemTreeElement = isSCMHistoryItemTreeElement;
    exports.isSCMHistoryItemChangeTreeElement = isSCMHistoryItemChangeTreeElement;
    exports.isSCMHistoryItemChangeNode = isSCMHistoryItemChangeNode;
    exports.isSCMViewSeparator = isSCMViewSeparator;
    exports.toDiffEditorArguments = toDiffEditorArguments;
    exports.connectPrimaryMenu = connectPrimaryMenu;
    exports.connectPrimaryMenuToInlineActionBar = connectPrimaryMenuToInlineActionBar;
    exports.collectContextMenuActions = collectContextMenuActions;
    exports.getActionViewItemProvider = getActionViewItemProvider;
    exports.getProviderKey = getProviderKey;
    function isSCMRepositoryArray(element) {
        return Array.isArray(element) && element.every(r => isSCMRepository(r));
    }
    function isSCMViewService(element) {
        return Array.isArray(element.repositories) && Array.isArray(element.visibleRepositories);
    }
    function isSCMRepository(element) {
        return !!element.provider && !!element.input;
    }
    function isSCMInput(element) {
        return !!element.validateInput && typeof element.value === 'string';
    }
    function isSCMActionButton(element) {
        return element.type === 'actionButton';
    }
    function isSCMResourceGroup(element) {
        return !!element.provider && !!element.resources;
    }
    function isSCMResource(element) {
        return !!element.sourceUri && isSCMResourceGroup(element.resourceGroup);
    }
    function isSCMResourceNode(element) {
        return resourceTree_1.ResourceTree.isResourceNode(element) && isSCMResourceGroup(element.context);
    }
    function isSCMHistoryItemGroupTreeElement(element) {
        return element.type === 'historyItemGroup';
    }
    function isSCMHistoryItemTreeElement(element) {
        return element.type === 'allChanges' ||
            element.type === 'historyItem';
    }
    function isSCMHistoryItemChangeTreeElement(element) {
        return element.type === 'historyItemChange';
    }
    function isSCMHistoryItemChangeNode(element) {
        return resourceTree_1.ResourceTree.isResourceNode(element) && isSCMHistoryItemTreeElement(element.context);
    }
    function isSCMViewSeparator(element) {
        return element.type === 'separator';
    }
    function toDiffEditorArguments(uri, originalUri, modifiedUri) {
        const basename = path.basename(uri.fsPath);
        const originalQuery = JSON.parse(originalUri.query);
        const modifiedQuery = JSON.parse(modifiedUri.query);
        const originalShortRef = originalQuery.ref.substring(0, 8).concat(originalQuery.ref.endsWith('^') ? '^' : '');
        const modifiedShortRef = modifiedQuery.ref.substring(0, 8).concat(modifiedQuery.ref.endsWith('^') ? '^' : '');
        return [originalUri, modifiedUri, `${basename} (${originalShortRef}) ↔ ${basename} (${modifiedShortRef})`, null];
    }
    const compareActions = (a, b) => {
        if (a instanceof actions_1.MenuItemAction && b instanceof actions_1.MenuItemAction) {
            return a.id === b.id && a.enabled === b.enabled && a.hideActions?.isHidden === b.hideActions?.isHidden;
        }
        return a.id === b.id && a.enabled === b.enabled;
    };
    function connectPrimaryMenu(menu, callback, primaryGroup) {
        let cachedPrimary = [];
        let cachedSecondary = [];
        const updateActions = () => {
            const primary = [];
            const secondary = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, { primary, secondary }, primaryGroup);
            if ((0, arrays_1.equals)(cachedPrimary, primary, compareActions) && (0, arrays_1.equals)(cachedSecondary, secondary, compareActions)) {
                return;
            }
            cachedPrimary = primary;
            cachedSecondary = secondary;
            callback(primary, secondary);
        };
        updateActions();
        return menu.onDidChange(updateActions);
    }
    function connectPrimaryMenuToInlineActionBar(menu, actionBar) {
        return connectPrimaryMenu(menu, (primary) => {
            actionBar.clear();
            actionBar.push(primary, { icon: true, label: false });
        }, 'inline');
    }
    function collectContextMenuActions(menu) {
        const primary = [];
        const actions = [];
        (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, { primary, secondary: actions }, 'inline');
        return actions;
    }
    class StatusBarAction extends actions_2.Action {
        constructor(command, commandService) {
            super(`statusbaraction{${command.id}}`, command.title, '', true);
            this.command = command;
            this.commandService = commandService;
            this.tooltip = command.tooltip || '';
        }
        run() {
            return this.commandService.executeCommand(this.command.id, ...(this.command.arguments || []));
        }
    }
    exports.StatusBarAction = StatusBarAction;
    class StatusBarActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action, options) {
            super(null, action, { ...options, icon: false, label: true });
        }
        updateLabel() {
            if (this.options.label && this.label) {
                (0, dom_1.reset)(this.label, ...(0, iconLabels_1.renderLabelWithIcons)(this.action.label));
            }
        }
    }
    function getActionViewItemProvider(instaService) {
        return (action, options) => {
            if (action instanceof StatusBarAction) {
                return new StatusBarActionViewItem(action, options);
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(instaService, action, options);
        };
    }
    function getProviderKey(provider) {
        return `${provider.contextValue}:${provider.label}${provider.rootUri ? `:${provider.rootUri.toString()}` : ''}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NjbS9icm93c2VyL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxvREFFQztJQUVELDRDQUVDO0lBRUQsMENBRUM7SUFFRCxnQ0FFQztJQUVELDhDQUVDO0lBRUQsZ0RBRUM7SUFFRCxzQ0FFQztJQUVELDhDQUVDO0lBRUQsNEVBRUM7SUFFRCxrRUFHQztJQUVELDhFQUVDO0lBRUQsZ0VBRUM7SUFFRCxnREFFQztJQUVELHNEQVNDO0lBVUQsZ0RBdUJDO0lBRUQsa0ZBS0M7SUFFRCw4REFLQztJQThCRCw4REFRQztJQUVELHdDQUVDO0lBdkpELFNBQWdCLG9CQUFvQixDQUFDLE9BQVk7UUFDaEQsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBWTtRQUM1QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUUsT0FBMkIsQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFFLE9BQTJCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUNwSSxDQUFDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLE9BQVk7UUFDM0MsT0FBTyxDQUFDLENBQUUsT0FBMEIsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFFLE9BQTBCLENBQUMsS0FBSyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxTQUFnQixVQUFVLENBQUMsT0FBWTtRQUN0QyxPQUFPLENBQUMsQ0FBRSxPQUFxQixDQUFDLGFBQWEsSUFBSSxPQUFRLE9B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