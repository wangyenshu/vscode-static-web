/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/base/common/themables"], function (require, exports, codicons_1, nls_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showWithPinnedItems = showWithPinnedItems;
    const pinButtonClass = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pin);
    const pinnedButtonClass = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pinned);
    const buttonClasses = [pinButtonClass, pinnedButtonClass];
    /**
     * Initially, adds pin buttons to all @param quickPick items.
     * When pinned, a copy of the item will be moved to the end of the pinned list and any duplicate within the pinned list will
     * be removed if @param filterDupliates has been provided. Pin and pinned button events trigger updates to the underlying storage.
     * Shows the quickpick once formatted.
     */
    async function showWithPinnedItems(storageService, storageKey, quickPick, filterDuplicates) {
        const itemsWithoutPinned = quickPick.items;
        let itemsWithPinned = _formatPinnedItems(storageKey, quickPick, storageService, undefined, filterDuplicates);
        quickPick.onDidTriggerItemButton(async (buttonEvent) => {
            const expectedButton = buttonEvent.button.iconClass && buttonClasses.includes(buttonEvent.button.iconClass);
            if (expectedButton) {
                quickPick.items = itemsWithoutPinned;
                itemsWithPinned = _formatPinnedItems(storageKey, quickPick, storageService, buttonEvent.item, filterDuplicates);
                quickPick.items = quickPick.value ? itemsWithoutPinned : itemsWithPinned;
            }
        });
        quickPick.onDidChangeValue(async (value) => {
            if (quickPick.items === itemsWithPinned && value) {
                quickPick.items = itemsWithoutPinned;
            }
            else if (quickPick.items === itemsWithoutPinned && !value) {
                quickPick.items = itemsWithPinned;
            }
        });
        quickPick.items = quickPick.value ? itemsWithoutPinned : itemsWithPinned;
        quickPick.show();
    }
    function _formatPinnedItems(storageKey, quickPick, storageService, changedItem, filterDuplicates) {
        const formattedItems = [];
        let pinnedItems;
        if (changedItem) {
            pinnedItems = updatePinnedItems(storageKey, changedItem, storageService);
        }
        else {
            pinnedItems = getPinnedItems(storageKey, storageService);
        }
        if (pinnedItems.length) {
            formattedItems.push({ type: 'separator', label: (0, nls_1.localize)("terminal.commands.pinned", 'pinned') });
        }
        const pinnedIds = new Set();
        for (const itemToFind of pinnedItems) {
            const itemToPin = quickPick.items.find(item => itemsMatch(item, itemToFind));
            if (itemToPin) {
                const pinnedItemId = getItemIdentifier(itemToPin);
                const pinnedItem = Object.assign({}, itemToPin);
                if (!filterDuplicates || !pinnedIds.has(pinnedItemId)) {
                    pinnedIds.add(pinnedItemId);
                    updateButtons(pinnedItem, false);
                    formattedItems.push(pinnedItem);
                }
            }
        }
        for (const item of quickPick.items) {
            updateButtons(item, true);
            formattedItems.push(item);
        }
        return formattedItems;
    }
    function getItemIdentifier(item) {
        return item.type === 'separator' ? '' : item.id || `${item.label}${item.description}${item.detail}}`;
    }
    function updateButtons(item, removePin) {
        if (item.type === 'separator') {
            return;
        }
        // remove button classes before adding the new one
        const newButtons = item.buttons?.filter(button => button.iconClass && !buttonClasses.includes(button.iconClass)) ?? [];
        newButtons.unshift({
            iconClass: removePin ? pinButtonClass : pinnedButtonClass,
            tooltip: removePin ? (0, nls_1.localize)('pinCommand', "Pin command") : (0, nls_1.localize)('pinnedCommand', "Pinned command"),
            alwaysVisible: false
        });
        item.buttons = newButtons;
    }
    function itemsMatch(itemA, itemB) {
        return getItemIdentifier(itemA) === getItemIdentifier(itemB);
    }
    function updatePinnedItems(storageKey, changedItem, storageService) {
        const removePin = changedItem.buttons?.find(b => b.iconClass === pinnedButtonClass);
        let items = getPinnedItems(storageKey, storageService);
        if (removePin) {
            items = items.filter(item => getItemIdentifier(item) !== getItemIdentifier(changedItem));
        }
        else {
            items.push(changedItem);
        }
        storageService.store(storageKey, JSON.stringify(items), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        return items;
    }
    function getPinnedItems(storageKey, storageService) {
        const items = storageService.get(storageKey, 1 /* StorageScope.WORKSPACE */);
        return items ? JSON.parse(items) : [];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tQaWNrUGluLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcXVpY2tpbnB1dC9icm93c2VyL3F1aWNrUGlja1Bpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsa0RBcUJDO0lBOUJELE1BQU0sY0FBYyxHQUFHLHFCQUFTLENBQUMsV0FBVyxDQUFDLGtCQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUQsTUFBTSxpQkFBaUIsR0FBRyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxrQkFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hFLE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDMUQ7Ozs7O09BS0c7SUFDSSxLQUFLLFVBQVUsbUJBQW1CLENBQUMsY0FBK0IsRUFBRSxVQUFrQixFQUFFLFNBQXFDLEVBQUUsZ0JBQTBCO1FBQy9KLE1BQU0sa0JBQWtCLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztRQUMzQyxJQUFJLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUM3RyxTQUFTLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFDLFdBQVcsRUFBQyxFQUFFO1lBQ3BELE1BQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1RyxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNwQixTQUFTLENBQUMsS0FBSyxHQUFHLGtCQUFrQixDQUFDO2dCQUNyQyxlQUFlLEdBQUcsa0JBQWtCLENBQUMsVUFBVSxFQUFFLFNB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