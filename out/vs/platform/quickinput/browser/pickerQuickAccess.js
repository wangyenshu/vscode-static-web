/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/types"], function (require, exports, async_1, cancellation_1, lifecycle_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PickerQuickAccessProvider = exports.TriggerAction = void 0;
    var TriggerAction;
    (function (TriggerAction) {
        /**
         * Do nothing after the button was clicked.
         */
        TriggerAction[TriggerAction["NO_ACTION"] = 0] = "NO_ACTION";
        /**
         * Close the picker.
         */
        TriggerAction[TriggerAction["CLOSE_PICKER"] = 1] = "CLOSE_PICKER";
        /**
         * Update the results of the picker.
         */
        TriggerAction[TriggerAction["REFRESH_PICKER"] = 2] = "REFRESH_PICKER";
        /**
         * Remove the item from the picker.
         */
        TriggerAction[TriggerAction["REMOVE_ITEM"] = 3] = "REMOVE_ITEM";
    })(TriggerAction || (exports.TriggerAction = TriggerAction = {}));
    function isPicksWithActive(obj) {
        const candidate = obj;
        return Array.isArray(candidate.items);
    }
    function isFastAndSlowPicks(obj) {
        const candidate = obj;
        return !!candidate.picks && candidate.additionalPicks instanceof Promise;
    }
    class PickerQuickAccessProvider extends lifecycle_1.Disposable {
        constructor(prefix, options) {
            super();
            this.prefix = prefix;
            this.options = options;
        }
        provide(picker, token, runOptions) {
            const disposables = new lifecycle_1.DisposableStore();
            // Apply options if any
            picker.canAcceptInBackground = !!this.options?.canAcceptInBackground;
            // Disable filtering & sorting, we control the results
            picker.matchOnLabel = picker.matchOnDescription = picker.matchOnDetail = picker.sortByLabel = false;
            // Set initial picks and update on type
            let picksCts = undefined;
            const picksDisposable = disposables.add(new lifecycle_1.MutableDisposable());
            const updatePickerItems = async () => {
                const picksDisposables = picksDisposable.value = new lifecycle_1.DisposableStore();
                // Cancel any previous ask for picks and busy
                picksCts?.dispose(true);
                picker.busy = false;
                // Create new cancellation source for this run
                picksCts = new cancellation_1.CancellationTokenSource(token);
                // Collect picks and support both long running and short or combined
                const picksToken = picksCts.token;
                let picksFilter = picker.value.substring(this.prefix.length);
                if (!this.options?.shouldSkipTrimPickFilter) {
                    picksFilter = picksFilter.trim();
                }
                const providedPicks = this._getPicks(picksFilter, picksDisposables, picksToken, runOptions);
                const applyPicks = (picks, skipEmpty) => {
                    let items;
                    let activeItem = undefined;
                    if (isPicksWithActive(picks)) {
                        items = picks.items;
                        activeItem = picks.active;
                    }
                    else {
                        items = picks;
                    }
                    if (items.length === 0) {
                        if (skipEmpty) {
                            return false;
                        }
                        // We show the no results pick if we have no input to prevent completely empty pickers #172613
                        if ((picksFilter.length > 0 || picker.hideInput) && this.options?.noResultsPick) {
                            if ((0, types_1.isFunction)(this.options.noResultsPick)) {
                                items = [this.options.noResultsPick(picksFilter)];
                            }
                            else {
                                items = [this.options.noResultsPick];
                            }
                        }
                    }
                    picker.items = items;
                    if (activeItem) {
                        picker.activeItems = [activeItem];
                    }
                    return true;
                };
                const applyFastAndSlowPicks = async (fastAndSlowPicks) => {
                    let fastPicksApplied = false;
                    let slowPicksApplied = false;
                    await Promise.all([
                        // Fast Picks: if `mergeDelay` is configured, in order to reduce
                        // amount of flicker, we race against the slow picks over some delay
                        // and then set the fast picks.
                        // If the slow picks are faster, we reduce the flicker by only
                        // setting the items once.
                        (async () => {
                            if (typeof fastAndSlowPicks.mergeDelay === 'number') {
                                await (0, async_1.timeout)(fastAndSlowPicks.mergeDelay);
                                if (picksToken.isCancellationRequested) {
                                    return;
                                }
                            }
                            if (!slowPicksApplied) {
                                fastPicksApplied = applyPicks(fastAndSlowPicks.picks, true /* skip over empty to reduce flicker */);
                            }
                        })(),
                        // Slow Picks: we await the slow picks and then set them at
                        // once together with the fast picks, but only if we actually
                        // have additional results.
                        (async () => {
                            picker.busy = true;
                            try {
                                const awaitedAdditionalPicks = await fastAndSlowPicks.additionalPicks;
                                if (picksToken.isCancellationRequested) {
                                    return;
                                }
                                let picks;
                                let activePick = undefined;
                                if (isPicksWithActive(fastAndSlowPicks.picks)) {
                                    picks = fastAndSlowPicks.picks.items;
                                    activePick = fastAndSlowPicks.picks.active;
                                }
                                else {
                                    picks = fastAndSlowPicks.picks;
                                }
                                let additionalPicks;
                                let additionalActivePick = undefined;
                                if (isPicksWithActive(awaitedAdditionalPicks)) {
                                    additionalPicks = awaitedAdditionalPicks.items;
                                    additionalActivePick = awaitedAdditionalPicks.active;
                                }
                                else {
                                    additionalPicks = awaitedAdditionalPicks;
                                }
                                if (additionalPicks.length > 0 || !fastPicksApplied) {
                                    // If we do not have any activePick or additionalActivePick
                                    // we try to preserve the currently active pick from the
                                    // fast results. This fixes an issue where the user might
                                    // have made a pick active before the additional results
                                    // kick in.
                                    // See https://github.com/microsoft/vscode/issues/102480
                                    let fallbackActivePick = undefined;
                                    if (!activePick && !additionalActivePick) {
                                        const fallbackActivePickCandidate = picker.activeItems[0];
                                        if (fallbackActivePickCandidate && picks.indexOf(fallbackActivePickCandidate) !== -1) {
                                            fallbackActivePick = fallbackActivePickCandidate;
                                        }
                                    }
                                    applyPicks({
                                        items: [...picks, ...additionalPicks],
                                        active: activePick || additionalActivePick || fallbackActivePick
                                    });
                                }
                            }
                            finally {
                                if (!picksToken.isCancellationRequested) {
                                    picker.busy = false;
                                }
                                slowPicksApplied = true;
                            }
                        })()
                    ]);
                };
                // No Picks
                if (providedPicks === null) {
                    // Ignore
                }
                // Fast and Slow Picks
                else if (isFastAndSlowPicks(providedPicks)) {
                    await applyFastAndSlowPicks(providedPicks);
                }
                // Fast Picks
                else if (!(providedPicks instanceof Promise)) {
                    applyPicks(providedPicks);
                }
                // Slow Picks
                else {
                    picker.busy = true;
                    try {
                        const awaitedPicks = await providedPicks;
                        if (picksToken.isCancellationRequested) {
                            return;
                        }
                        if (isFastAndSlowPicks(awaitedPicks)) {
                            await applyFastAndSlowPicks(awaitedPicks);
                        }
                        else {
                            applyPicks(awaitedPicks);
                        }
                    }
                    finally {
                        if (!picksToken.isCancellationRequested) {
                            picker.busy = false;
                        }
                    }
                }
            };
            disposables.add(picker.onDidChangeValue(() => updatePickerItems()));
            updatePickerItems();
            // Accept the pick on accept and hide picker
            disposables.add(picker.onDidAccept(event => {
                const [item] = picker.selectedItems;
                if (typeof item?.accept === 'function') {
                    if (!event.inBackground) {
                        picker.hide(); // hide picker unless we accept in background
                    }
                    item.accept(picker.keyMods, event);
                }
            }));
            const buttonTrigger = async (button, item) => {
                if (typeof item.trigger !== 'function') {
                    return;
                }
                const buttonIndex = item.buttons?.indexOf(button) ?? -1;
                if (buttonIndex >= 0) {
                    const result = item.trigger(buttonIndex, picker.keyMods);
                    const action = (typeof result === 'number') ? result : await result;
                    if (token.isCancellationRequested) {
                        return;
                    }
                    switch (action) {
                        case TriggerAction.NO_ACTION:
                            break;
                        case TriggerAction.CLOSE_PICKER:
                            picker.hide();
                            break;
                        case TriggerAction.REFRESH_PICKER:
                            updatePickerItems();
                            break;
                        case TriggerAction.REMOVE_ITEM: {
                            const index = picker.items.indexOf(item);
                            if (index !== -1) {
                                const items = picker.items.slice();
                                const removed = items.splice(index, 1);
                                const activeItems = picker.activeItems.filter(activeItem => activeItem !== removed[0]);
                                const keepScrollPositionBefore = picker.keepScrollPosition;
                                picker.keepScrollPosition = true;
                                picker.items = items;
                                if (activeItems) {
                                    picker.activeItems = activeItems;
                                }
                                picker.keepScrollPosition = keepScrollPositionBefore;
                            }
                            break;
                        }
                    }
                }
            };
            // Trigger the pick with button index if button triggered
            disposables.add(picker.onDidTriggerItemButton(({ button, item }) => buttonTrigger(button, item)));
            disposables.add(picker.onDidTriggerSeparatorButton(({ button, separator }) => buttonTrigger(button, separator)));
            return disposables;
        }
    }
    exports.PickerQuickAccessProvider = PickerQuickAccessProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlja2VyUXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9xdWlja2lucHV0L2Jyb3dzZXIvcGlja2VyUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLElBQVksYUFxQlg7SUFyQkQsV0FBWSxhQUFhO1FBRXhCOztXQUVHO1FBQ0gsMkRBQVMsQ0FBQTtRQUVUOztXQUVHO1FBQ0gsaUVBQVksQ0FBQTtRQUVaOztXQUVHO1FBQ0gscUVBQWMsQ0FBQTtRQUVkOztXQUVHO1FBQ0gsK0RBQVcsQ0FBQTtJQUNaLENBQUMsRUFyQlcsYUFBYSw2QkFBYixhQUFhLFFBcUJ4QjtJQW9GRCxTQUFTLGlCQUFpQixDQUFJLEdBQVk7UUFDekMsTUFBTSxTQUFTLEdBQUcsR0FBeUIsQ0FBQztRQUU1QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFJLEdBQVk7UUFDMUMsTUFBTSxTQUFTLEdBQUcsR0FBMEIsQ0FBQztRQUU3QyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQyxlQUFlLFlBQVksT0FBTyxDQUFDO0lBQzFFLENBQUM7SUFFRCxNQUFzQix5QkFBNEQsU0FBUSxzQkFBVTtRQUVuRyxZQUFvQixNQUFjLEVBQVksT0FBOEM7WUFDM0YsS0FBSyxFQUFFLENBQUM7WUFEVyxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQVksWUFBTyxHQUFQLE9BQU8sQ0FBdUM7UUFFNUYsQ0FBQztRQUVELE9BQU8sQ0FBQyxNQUFxQixFQUFFLEtBQXdCLEVBQUUsVUFBMkM7WUFDbkcsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7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