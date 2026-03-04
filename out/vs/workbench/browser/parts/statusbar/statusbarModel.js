/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/browser/dom", "vs/base/common/event"], function (require, exports, lifecycle_1, statusbar_1, dom_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusbarViewModel = void 0;
    class StatusbarViewModel extends lifecycle_1.Disposable {
        static { this.HIDDEN_ENTRIES_KEY = 'workbench.statusbar.hidden'; }
        get entries() { return this._entries.slice(0); }
        get lastFocusedEntry() {
            return this._lastFocusedEntry && !this.isHidden(this._lastFocusedEntry.id) ? this._lastFocusedEntry : undefined;
        }
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this._onDidChangeEntryVisibility = this._register(new event_1.Emitter());
            this.onDidChangeEntryVisibility = this._onDidChangeEntryVisibility.event;
            this._entries = []; // Intentionally not using a map here since multiple entries can have the same ID
            this.hidden = new Set();
            this.restoreState();
            this.registerListeners();
        }
        restoreState() {
            const hiddenRaw = this.storageService.get(StatusbarViewModel.HIDDEN_ENTRIES_KEY, 0 /* StorageScope.PROFILE */);
            if (hiddenRaw) {
                try {
                    this.hidden = new Set(JSON.parse(hiddenRaw));
                }
                catch (error) {
                    // ignore parsing errors
                }
            }
        }
        registerListeners() {
            this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, StatusbarViewModel.HIDDEN_ENTRIES_KEY, this._register(new lifecycle_1.DisposableStore()))(() => this.onDidStorageValueChange()));
        }
        onDidStorageValueChange() {
            // Keep current hidden entries
            const currentlyHidden = new Set(this.hidden);
            // Load latest state of hidden entries
            this.hidden.clear();
            this.restoreState();
            const changed = new Set();
            // Check for each entry that is now visible
            for (const id of currentlyHidden) {
                if (!this.hidden.has(id)) {
                    changed.add(id);
                }
            }
            // Check for each entry that is now hidden
            for (const id of this.hidden) {
                if (!currentlyHidden.has(id)) {
                    changed.add(id);
                }
            }
            // Update visibility for entries have changed
            if (changed.size > 0) {
                for (const entry of this._entries) {
                    if (changed.has(entry.id)) {
                        this.updateVisibility(entry.id, true);
                        changed.delete(entry.id);
                    }
                }
            }
        }
        add(entry) {
            // Add to set of entries
            this._entries.push(entry);
            // Update visibility directly
            this.updateVisibility(entry, false);
            // Sort according to priority
            this.sort();
            // Mark first/last visible entry
            this.markFirstLastVisibleEntry();
        }
        remove(entry) {
            const index = this._entries.indexOf(entry);
            if (index >= 0) {
                // Remove from entries
                this._entries.splice(index, 1);
                // Re-sort entries if this one was used
                // as reference from other entries
                if (this._entries.some(otherEntry => (0, statusbar_1.isStatusbarEntryLocation)(otherEntry.priority.primary) && otherEntry.priority.primary.id === entry.id)) {
                    this.sort();
                }
                // Mark first/last visible entry
                this.markFirstLastVisibleEntry();
            }
        }
        isHidden(id) {
            return this.hidden.has(id);
        }
        hide(id) {
            if (!this.hidden.has(id)) {
                this.hidden.add(id);
                this.updateVisibility(id, true);
                this.saveState();
            }
        }
        show(id) {
            if (this.hidden.has(id)) {
                this.hidden.delete(id);
                this.updateVisibility(id, true);
                this.saveState();
            }
        }
        findEntry(container) {
            return this._entries.find(entry => entry.container === container);
        }
        getEntries(alignment) {
            return this._entries.filter(entry => entry.alignment === alignment);
        }
        focusNextEntry() {
            this.focusEntry(+1, 0);
        }
        focusPreviousEntry() {
            this.focusEntry(-1, this.entries.length - 1);
        }
        isEntryFocused() {
            return !!this.getFocusedEntry();
        }
        getFocusedEntry() {
            return this._entries.find(entry => (0, dom_1.isAncestorOfActiveElement)(entry.container));
        }
        focusEntry(delta, restartPosition) {
            const getVisibleEntry = (start) => {
                let indexToFocus = start;
                let entry = (indexToFocus >= 0 && indexToFocus < this._entries.length) ? this._entries[indexToFocus] : undefined;
                while (entry && this.isHidden(entry.id)) {
                    indexToFocus += delta;
                    entry = (indexToFocus >= 0 && indexToFocus < this._entries.length) ? this._entries[indexToFocus] : undefined;
                }
                return entry;
            };
            const focused = this.getFocusedEntry();
            if (focused) {
                const entry = getVisibleEntry(this._entries.indexOf(focused) + delta);
                if (entry) {
                    this._lastFocusedEntry = entry;
                    entry.labelContainer.focus();
                    return;
                }
            }
            const entry = getVisibleEntry(restartPosition);
            if (entry) {
                this._lastFocusedEntry = entry;
                entry.labelContainer.focus();
            }
        }
        updateVisibility(arg1, trigger) {
            // By identifier
            if (typeof arg1 === 'string') {
                const id = arg1;
                for (const entry of this._entries) {
                    if (entry.id === id) {
                        this.updateVisibility(entry, trigger);
                    }
                }
            }
            // By entry
            else {
                const entry = arg1;
                const isHidden = this.isHidden(entry.id);
                // Use CSS to show/hide item container
                if (isHidden) {
                    (0, dom_1.hide)(entry.container);
                }
                else {
                    (0, dom_1.show)(entry.container);
                }
                if (trigger) {
                    this._onDidChangeEntryVisibility.fire({ id: entry.id, visible: !isHidden });
                }
                // Mark first/last visible entry
                this.markFirstLastVisibleEntry();
            }
        }
        saveState() {
            if (this.hidden.size > 0) {
                this.storageService.store(StatusbarViewModel.HIDDEN_ENTRIES_KEY, JSON.stringify(Array.from(this.hidden.values())), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            }
            else {
                this.storageService.remove(StatusbarViewModel.HIDDEN_ENTRIES_KEY, 0 /* StorageScope.PROFILE */);
            }
        }
        sort() {
            // Split up entries into 2 buckets:
            // - those with `priority: number` that can be compared
            // - those with `priority: string` that must be sorted
            //   relative to another entry if possible
            const mapEntryWithNumberedPriorityToIndex = new Map();
            const mapEntryWithRelativePriority = new Map();
            for (let i = 0; i < this._entries.length; i++) {
                const entry = this._entries[i];
                if (typeof entry.priority.primary === 'number') {
                    mapEntryWithNumberedPriorityToIndex.set(entry, i);
                }
                else {
                    let entries = mapEntryWithRelativePriority.get(entry.priority.primary.id);
                    if (!entries) {
                        entries = [];
                        mapEntryWithRelativePriority.set(entry.priority.primary.id, entries);
                    }
                    entries.push(entry);
                }
            }
            // Sort the entries with `priority: number` according to that
            const sortedEntriesWithNumberedPriority = Array.from(mapEntryWithNumberedPriorityToIndex.keys());
            sortedEntriesWithNumberedPriority.sort((entryA, entryB) => {
                if (entryA.alignment === entryB.alignment) {
                    // Sort by primary/secondary priority: higher values move towards the left
                    if (entryA.priority.primary !== entryB.priority.primary) {
                        return Number(entryB.priority.primary) - Number(entryA.priority.primary);
                    }
                    if (entryA.priority.secondary !== entryB.priority.secondary) {
                        return entryB.priority.secondary - entryA.priority.secondary;
                    }
                    // otherwise maintain stable order (both values known to be in map)
                    return mapEntryWithNumberedPriorityToIndex.get(entryA) - mapEntryWithNumberedPriorityToIndex.get(entryB);
                }
                if (entryA.alignment === 0 /* StatusbarAlignment.LEFT */) {
                    return -1;
                }
                if (entryB.alignment === 0 /* StatusbarAlignment.LEFT */) {
                    return 1;
                }
                return 0;
            });
            let sortedEntries;
            // Entries with location: sort in accordingly
            if (mapEntryWithRelativePriority.size > 0) {
                sortedEntries = [];
                for (const entry of sortedEntriesWithNumberedPriority) {
                    const relativeEntries = mapEntryWithRelativePriority.get(entry.id);
                    // Fill relative entries to LEFT
                    if (relativeEntries) {
                        sortedEntries.push(...relativeEntries.filter(entry => (0, statusbar_1.isStatusbarEntryLocation)(entry.priority.primary) && entry.priority.primary.alignment === 0 /* StatusbarAlignment.LEFT */));
                    }
                    // Fill referenced entry
                    sortedEntries.push(entry);
                    // Fill relative entries to RIGHT
                    if (relativeEntries) {
                        sortedEntries.push(...relativeEntries.filter(entry => (0, statusbar_1.isStatusbarEntryLocation)(entry.priority.primary) && entry.priority.primary.alignment === 1 /* StatusbarAlignment.RIGHT */));
                    }
                    // Delete from map to mark as handled
                    mapEntryWithRelativePriority.delete(entry.id);
                }
                // Finally, just append all entries that reference another entry
                // that does not exist to the end of the list
                for (const [, entries] of mapEntryWithRelativePriority) {
                    sortedEntries.push(...entries);
                }
            }
            // No entries with relative priority: take sorted entries as is
            else {
                sortedEntries = sortedEntriesWithNumberedPriority;
            }
            // Take over as new truth of entries
            this._entries = sortedEntries;
        }
        markFirstLastVisibleEntry() {
            this.doMarkFirstLastVisibleStatusbarItem(this.getEntries(0 /* StatusbarAlignment.LEFT */));
            this.doMarkFirstLastVisibleStatusbarItem(this.getEntries(1 /* StatusbarAlignment.RIGHT */));
        }
        doMarkFirstLastVisibleStatusbarItem(entries) {
            let firstVisibleItem;
            let lastVisibleItem;
            for (const entry of entries) {
                // Clear previous first
                entry.container.classList.remove('first-visible-item', 'last-visible-item');
                const isVisible = !this.isHidden(entry.id);
                if (isVisible) {
                    if (!firstVisibleItem) {
                        firstVisibleItem = entry;
                    }
                    lastVisibleItem = entry;
                }
            }
            // Mark: first visible item
            firstVisibleItem?.container.classList.add('first-visible-item');
            // Mark: last visible item
            lastVisibleItem?.container.classList.add('last-visible-item');
        }
    }
    exports.StatusbarViewModel = StatusbarViewModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9zdGF0dXNiYXIvc3RhdHVzYmFyTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFhLGtCQUFtQixTQUFRLHNCQUFVO2lCQUV6Qix1QkFBa0IsR0FBRyw0QkFBNEIsQUFBL0IsQ0FBZ0M7UUFNMUUsSUFBSSxPQUFPLEtBQWlDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRzVFLElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ2pILENBQUM7UUFJRCxZQUE2QixjQUErQjtZQUMzRCxLQUFLLEVBQUUsQ0FBQztZQURvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFiM0MsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBb0MsQ0FBQyxDQUFDO1lBQ3RHLCtCQUEwQixHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxLQUFLLENBQUM7WUFFckUsYUFBUSxHQUErQixFQUFFLENBQUMsQ0FBQyxpRkFBaUY7WUFRNUgsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFLbEMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxZQUFZO1lBQ25CLE1B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