/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/button/button", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/toggle/toggle", "vs/base/common/event", "vs/base/common/async", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/quickinput/browser/quickInputController", "vs/platform/theme/test/common/testThemeService", "vs/base/test/common/utils", "vs/base/common/lifecycle", "vs/base/browser/window", "vs/platform/quickinput/common/quickInput", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/layout/browser/layoutService", "vs/platform/contextview/browser/contextView", "vs/platform/list/browser/listService", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextViewService"], function (require, exports, assert, inputBox_1, button_1, listWidget_1, toggle_1, event_1, async_1, countBadge_1, keybindingLabel_1, progressbar_1, quickInputController_1, testThemeService_1, utils_1, lifecycle_1, window_1, quickInput_1, instantiationServiceMock_1, themeService_1, configuration_1, testConfigurationService_1, layoutService_1, contextView_1, listService_1, contextkey_1, contextKeyService_1, keybindingResolver_1, keybinding_1, contextViewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Sets up an `onShow` listener to allow us to wait until the quick pick is shown (useful when triggering an `accept()` right after launching a quick pick)
    // kick this off before you launch the picker and then await the promise returned after you launch the picker.
    async function setupWaitTilShownListener(controller) {
        const result = await (0, async_1.raceTimeout)(new Promise(resolve => {
            const event = controller.onShow(_ => {
                event.dispose();
                resolve(true);
            });
        }), 2000);
        if (!result) {
            throw new Error('Cancelled');
        }
    }
    suite('QuickInput', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let controller;
        setup(() => {
            const fixture = document.createElement('div');
            window_1.mainWindow.document.body.appendChild(fixture);
            store.add((0, lifecycle_1.toDisposable)(() => window_1.mainWindow.document.body.removeChild(fixture)));
            const instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            // Stub the services the quick input controller needs to function
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(listService_1.IListService, store.add(new listService_1.ListService()));
            instantiationService.stub(layoutService_1.ILayoutService, { activeContainer: fixture, onDidLayoutContainer: event_1.Event.None });
            instantiationService.stub(contextView_1.IContextViewService, store.add(instantiationService.createInstance(contextViewService_1.ContextViewService)));
            instantiationService.stub(contextkey_1.IContextKeyService, store.add(instantiationService.createInstance(contextKeyService_1.ContextKeyService)));
            instantiationService.stub(keybinding_1.IKeybindingService, {
                mightProducePrintableCharacter() { return false; },
                softDispatch() { return keybindingResolver_1.NoMatchingKb; },
            });
            controller = store.add(instantiationService.createInstance(quickInputController_1.QuickInputController, {
                container: fixture,
                idPrefix: 'testQuickInput',
                ignoreFocusOut() { return true; },
                returnFocus() { },
                backKeybindingLabel() { return undefined; },
                setContextKey() { return undefined; },
                linkOpenerDelegate(content) { },
                hoverDelegate: {
                    showHover(options, focus) {
                        return undefined;
                    },
                    delay: 200
                },
                styles: {
                    button: button_1.unthemedButtonStyles,
                    countBadge: countBadge_1.unthemedCountStyles,
                    inputBox: inputBox_1.unthemedInboxStyles,
                    toggle: toggle_1.unthemedToggleStyles,
                    keybindingLabel: keybindingLabel_1.unthemedKeybindingLabelOptions,
                    list: listWidget_1.unthemedListStyles,
                    progressBar: progressbar_1.unthemedProgressBarOptions,
                    widget: {
                        quickInputBackground: undefined,
                        quickInputForeground: undefined,
                        quickInputTitleBackground: undefined,
                        widgetBorder: undefined,
                        widgetShadow: undefined,
                    },
                    pickerGroup: {
                        pickerGroupBorder: undefined,
                        pickerGroupForeground: undefined,
                    }
                }
            }));
            // initial layout
            controller.layout({ height: 20, width: 40 }, 0);
        });
        test('pick - basecase', async () => {
            const item = { label: 'foo' };
            const wait = setupWaitTilShownListener(controller);
            const pickPromise = controller.pick([item, { label: 'bar' }]);
            await wait;
            controller.accept();
            const pick = await (0, async_1.raceTimeout)(pickPromise, 2000);
            assert.strictEqual(pick, item);
        });
        test('pick - activeItem is honored', async () => {
            const item = { label: 'foo' };
            const wait = setupWaitTilShownListener(controller);
            const pickPromise = controller.pick([{ label: 'bar' }, item], { activeItem: item });
            await wait;
            controller.accept();
            const pick = await pickPromise;
            assert.strictEqual(pick, item);
        });
        test('input - basecase', async () => {
            const wait = setupWaitTilShownListener(controller);
            const inputPromise = controller.input({ value: 'foo' });
            await wait;
            controller.accept();
            const value = await (0, async_1.raceTimeout)(inputPromise, 2000);
            assert.strictEqual(value, 'foo');
        });
        test('onDidChangeValue - gets triggered when .value is set', async () => {
            const quickpick = store.add(controller.createQuickPick());
            let value = undefined;
            store.add(quickpick.onDidChangeValue((e) => value = e));
            // Trigger a change
            quickpick.value = 'changed';
            try {
                assert.strictEqual(value, quickpick.value);
            }
            finally {
                quickpick.dispose();
            }
        });
        test('keepScrollPosition - works with activeItems', async () => {
            const quickpick = store.add(controller.createQuickPick());
            const items = [];
            for (let i = 0; i < 1000; i++) {
                items.push({ label: `item ${i}` });
            }
            quickpick.items = items;
            // setting the active item should cause the quick pick to scroll to the bottom
            quickpick.activeItems = [items[items.length - 1]];
            quickpick.show();
            const cursorTop = quickpick.scrollTop;
            assert.notStrictEqual(cursorTop, 0);
            quickpick.keepScrollPosition = true;
            quickpick.activeItems = [items[0]];
            assert.strictEqual(cursorTop, quickpick.scrollTop);
            quickpick.keepScrollPosition = false;
            quickpick.activeItems = [items[0]];
            assert.strictEqual(quickpick.scrollTop, 0);
        });
        test('keepScrollPosition - works with items', async () => {
            const quickpick = store.add(controller.createQuickPick());
            const items = [];
            for (let i = 0; i < 1000; i++) {
                items.push({ label: `item ${i}` });
            }
            quickpick.items = items;
            // setting the active item should cause the quick pick to scroll to the bottom
            quickpick.activeItems = [items[items.length - 1]];
            quickpick.show();
            const cursorTop = quickpick.scrollTop;
            assert.notStrictEqual(cursorTop, 0);
            quickpick.keepScrollPosition = true;
            quickpick.items = items;
            assert.strictEqual(cursorTop, quickpick.scrollTop);
            quickpick.keepScrollPosition = false;
            quickpick.items = items;
            assert.strictEqual(quickpick.scrollTop, 0);
        });
        test('selectedItems - verify previous selectedItems does not hang over to next set of items', async () => {
            const quickpick = store.add(controller.createQuickPick());
            quickpick.items = [{ label: 'step 1' }];
            quickpick.show();
            void (await new Promise(resolve => {
                store.add(quickpick.onDidAccept(() => {
                    quickpick.canSelectMany = true;
                    quickpick.items = [{ label: 'a' }, { label: 'b' }, { label: 'c' }];
                    resolve();
                }));
                // accept 'step 1'
                controller.accept();
            }));
            // accept in multi-select
            controller.accept();
            // Since we don't select any items, the selected items should be empty
            assert.strictEqual(quickpick.selectedItems.length, 0);
        });
        test('activeItems - verify onDidChangeActive is triggered after setting items', async () => {
            const quickpick = store.add(controller.createQuickPick());
            // Setup listener for verification
            const activeItemsFromEvent = [];
            store.add(quickpick.onDidChangeActive(items => activeItemsFromEvent.push(...items)));
            quickpick.show();
            const item = { label: 'step 1' };
            quickpick.items = [item];
            assert.strictEqual(activeItemsFromEvent.length, 1);
            assert.strictEqual(activeItemsFromEvent[0], item);
            assert.strictEqual(quickpick.activeItems.length, 1);
            assert.strictEqual(quickpick.activeItems[0], item);
        });
        test('activeItems - verify setting itemActivation to None still triggers onDidChangeActive after selection #207832', async () => {
            const quickpick = store.add(controller.createQuickPick());
            const item = { label: 'step 1' };
            quickpick.items = [item];
            quickpick.show();
            assert.strictEqual(quickpick.activeItems[0], item);
            // Setup listener for verification
            const activeItemsFromEvent = [];
            store.add(quickpick.onDidChangeActive(items => activeItemsFromEvent.push(...items)));
            // Trigger a change
            quickpick.itemActivation = quickInput_1.ItemActivation.NONE;
            quickpick.items = [item];
            assert.strictEqual(activeItemsFromEvent.length, 0);
            assert.strictEqual(quickpick.activeItems.length, 0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tpbnB1dC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcXVpY2tpbnB1dC90ZXN0L2Jyb3dzZXIvcXVpY2tpbnB1dC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZ0NoRywySkFBMko7SUFDM0osOEdBQThHO0lBQzlHLEtBQUssVUFBVSx5QkFBeUIsQ0FBQyxVQUFnQztRQUN4RSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUJBQVcsRUFBQyxJQUFJLE9BQU8sQ0FBVSxPQUFPLENBQUMsRUFBRTtZQUMvRCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNuQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDYixNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7SUFDRixDQUFDO0lBRUQsS0FBSyxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7UUFDeEIsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQ3hELElBQUksVUFBZ0MsQ0FBQztRQUVyQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxtQkFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBQSx3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