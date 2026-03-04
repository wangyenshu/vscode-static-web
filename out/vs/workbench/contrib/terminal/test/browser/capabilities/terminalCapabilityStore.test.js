/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/terminal/common/capabilities/terminalCapabilityStore"], function (require, exports, assert_1, lifecycle_1, utils_1, terminalCapabilityStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TerminalCapabilityStore', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let capabilityStore;
        let addEvents;
        let removeEvents;
        setup(() => {
            capabilityStore = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
            store.add(capabilityStore.onDidAddCapabilityType(e => addEvents.push(e)));
            store.add(capabilityStore.onDidRemoveCapabilityType(e => removeEvents.push(e)));
            addEvents = [];
            removeEvents = [];
        });
        teardown(() => capabilityStore.dispose());
        test('should fire events when capabilities are added', () => {
            assertEvents(addEvents, []);
            capabilityStore.add(0 /* TerminalCapability.CwdDetection */, {});
            assertEvents(addEvents, [0 /* TerminalCapability.CwdDetection */]);
        });
        test('should fire events when capabilities are removed', async () => {
            assertEvents(removeEvents, []);
            capabilityStore.add(0 /* TerminalCapability.CwdDetection */, {});
            assertEvents(removeEvents, []);
            capabilityStore.remove(0 /* TerminalCapability.CwdDetection */);
            assertEvents(removeEvents, [0 /* TerminalCapability.CwdDetection */]);
        });
        test('has should return whether a capability is present', () => {
            (0, assert_1.deepStrictEqual)(capabilityStore.has(0 /* TerminalCapability.CwdDetection */), false);
            capabilityStore.add(0 /* TerminalCapability.CwdDetection */, {});
            (0, assert_1.deepStrictEqual)(capabilityStore.has(0 /* TerminalCapability.CwdDetection */), true);
            capabilityStore.remove(0 /* TerminalCapability.CwdDetection */);
            (0, assert_1.deepStrictEqual)(capabilityStore.has(0 /* TerminalCapability.CwdDetection */), false);
        });
        test('items should reflect current state', () => {
            (0, assert_1.deepStrictEqual)(Array.from(capabilityStore.items), []);
            capabilityStore.add(0 /* TerminalCapability.CwdDetection */, {});
            (0, assert_1.deepStrictEqual)(Array.from(capabilityStore.items), [0 /* TerminalCapability.CwdDetection */]);
            capabilityStore.add(1 /* TerminalCapability.NaiveCwdDetection */, {});
            (0, assert_1.deepStrictEqual)(Array.from(capabilityStore.items), [0 /* TerminalCapability.CwdDetection */, 1 /* TerminalCapability.NaiveCwdDetection */]);
            capabilityStore.remove(0 /* TerminalCapability.CwdDetection */);
            (0, assert_1.deepStrictEqual)(Array.from(capabilityStore.items), [1 /* TerminalCapability.NaiveCwdDetection */]);
        });
    });
    suite('TerminalCapabilityStoreMultiplexer', () => {
        let store;
        let multiplexer;
        let store1;
        let store2;
        let addEvents;
        let removeEvents;
        setup(() => {
            store = new lifecycle_1.DisposableStore();
            multiplexer = store.add(new terminalCapabilityStore_1.TerminalCapabilityStoreMultiplexer());
            multiplexer.onDidAddCapabilityType(e => addEvents.push(e));
            multiplexer.onDidRemoveCapabilityType(e => removeEvents.push(e));
            store1 = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
            store2 = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
            addEvents = [];
            removeEvents = [];
        });
        teardown(() => store.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should fire events when capabilities are enabled', async () => {
            assertEvents(addEvents, []);
            multiplexer.add(store1);
            multiplexer.add(store2);
            store1.add(0 /* TerminalCapability.CwdDetection */, {});
            assertEvents(addEvents, [0 /* TerminalCapability.CwdDetection */]);
            store2.add(1 /* TerminalCapability.NaiveCwdDetection */, {});
            assertEvents(addEvents, [1 /* TerminalCapability.NaiveCwdDetection */]);
        });
        test('should fire events when capabilities are disabled', async () => {
            assertEvents(removeEvents, []);
            multiplexer.add(store1);
            multiplexer.add(store2);
            store1.add(0 /* TerminalCapability.CwdDetection */, {});
            store2.add(1 /* TerminalCapability.NaiveCwdDetection */, {});
            assertEvents(removeEvents, []);
            store1.remove(0 /* TerminalCapability.CwdDetection */);
            assertEvents(removeEvents, [0 /* TerminalCapability.CwdDetection */]);
            store2.remove(1 /* TerminalCapability.NaiveCwdDetection */);
            assertEvents(removeEvents, [1 /* TerminalCapability.NaiveCwdDetection */]);
        });
        test('should fire events when stores are added', async () => {
            assertEvents(addEvents, []);
            store1.add(0 /* TerminalCapability.CwdDetection */, {});
            assertEvents(addEvents, []);
            store2.add(1 /* TerminalCapability.NaiveCwdDetection */, {});
            multiplexer.add(store1);
            multiplexer.add(store2);
            assertEvents(addEvents, [0 /* TerminalCapability.CwdDetection */, 1 /* TerminalCapability.NaiveCwdDetection */]);
        });
        test('items should return items from all stores', () => {
            (0, assert_1.deepStrictEqual)(Array.from(multiplexer.items).sort(), [].sort());
            multiplexer.add(store1);
            multiplexer.add(store2);
            store1.add(0 /* TerminalCapability.CwdDetection */, {});
            (0, assert_1.deepStrictEqual)(Array.from(multiplexer.items).sort(), [0 /* TerminalCapability.CwdDetection */].sort());
            store1.add(2 /* TerminalCapability.CommandDetection */, {});
            store2.add(1 /* TerminalCapability.NaiveCwdDetection */, {});
            (0, assert_1.deepStrictEqual)(Array.from(multiplexer.items).sort(), [0 /* TerminalCapability.CwdDetection */, 2 /* TerminalCapability.CommandDetection */, 1 /* TerminalCapability.NaiveCwdDetection */].sort());
            store2.remove(1 /* TerminalCapability.NaiveCwdDetection */);
            (0, assert_1.deepStrictEqual)(Array.from(multiplexer.items).sort(), [0 /* TerminalCapability.CwdDetection */, 2 /* TerminalCapability.CommandDetection */].sort());
        });
        test('has should return whether a capability is present', () => {
            (0, assert_1.deepStrictEqual)(multiplexer.has(0 /* TerminalCapability.CwdDetection */), false);
            multiplexer.add(store1);
            store1.add(0 /* TerminalCapability.CwdDetection */, {});
            (0, assert_1.deepStrictEqual)(multiplexer.has(0 /* TerminalCapability.CwdDetection */), true);
            store1.remove(0 /* TerminalCapability.CwdDetection */);
            (0, assert_1.deepStrictEqual)(multiplexer.has(0 /* TerminalCapability.CwdDetection */), false);
        });
    });
    function assertEvents(actual, expected) {
        (0, assert_1.deepStrictEqual)(actual, expected);
        actual.length = 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDYXBhYmlsaXR5U3RvcmUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci9jYXBhYmlsaXRpZXMvdGVybWluYWxDYXBhYmlsaXR5U3RvcmUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLGVBQXdDLENBQUM7UUFDN0MsSUFBSSxTQUErQixDQUFDO1FBQ3BDLElBQUksWUFBa0MsQ0FBQztRQUV2QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsZUFBZSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxpREFBdUIsRUFBRSxDQUFDLENBQUM7WUFDM0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRSxLQUFLLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDZixZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRTFDLElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVB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