/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/mock", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/api/common/extHostTypes", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, mock_1, extHostEditorTabs_1, testRPCProtocol_1, extHostTypes_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostEditorTabs', function () {
        const defaultTabDto = {
            id: 'uniquestring',
            input: { kind: 1 /* TabInputKind.TextInput */, uri: uri_1.URI.parse('file://abc/def.txt') },
            isActive: true,
            isDirty: true,
            isPinned: true,
            isPreview: false,
            label: 'label1',
        };
        function createTabDto(dto) {
            return { ...defaultTabDto, ...dto };
        }
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Ensure empty model throws when accessing active group', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 0);
            // Active group should never be undefined (there is always an active group). Ensure accessing it undefined throws.
            // TODO @lramos15 Add a throw on the main side when a model is sent without an active group
            assert.throws(() => extHostEditorTabs.tabGroups.activeTabGroup);
        });
        test('single tab', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const [first] = extHostEditorTabs.tabGroups.all;
            assert.ok(first.activeTab);
            assert.strictEqual(first.tabs.indexOf(first.activeTab), 0);
            {
                extHostEditorTabs.$acceptEditorTabModel([{
                        isActive: true,
                        viewColumn: 0,
                        groupId: 12,
                        tabs: [tab]
                    }]);
                assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
                const [first] = extHostEditorTabs.tabGroups.all;
                assert.ok(first.activeTab);
                assert.strictEqual(first.tabs.indexOf(first.activeTab), 0);
            }
        });
        test('Empty tab group', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: []
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const [first] = extHostEditorTabs.tabGroups.all;
            assert.strictEqual(first.activeTab, undefined);
            assert.strictEqual(first.tabs.length, 0);
        });
        test('Ensure tabGroup change events fires', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            let count = 0;
            store.add(extHostEditorTabs.tabGroups.onDidChangeTabGroups(() => count++));
            assert.strictEqual(count, 0);
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: []
                }]);
            assert.ok(extHostEditorTabs.tabGroups.activeTabGroup);
            const activeTabGroup = extHostEditorTabs.tabGroups.activeTabGroup;
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(activeTabGroup.tabs.length, 0);
            assert.strictEqual(count, 1);
        });
        test('Check TabGroupChangeEvent properties', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const group1Data = {
                isActive: true,
                viewColumn: 0,
                groupId: 12,
                tabs: []
            };
            const group2Data = { ...group1Data, groupId: 13 };
            const events = [];
            store.add(extHostEditorTabs.tabGroups.onDidChangeTabGroups(e => events.push(e)));
            // OPEN
            extHostEditorTabs.$acceptEditorTabModel([group1Data]);
            assert.deepStrictEqual(events, [{
                    changed: [],
                    closed: [],
                    opened: [extHostEditorTabs.tabGroups.activeTabGroup]
                }]);
            // OPEN, CHANGE
            events.length = 0;
            extHostEditorTabs.$acceptEditorTabModel([{ ...group1Data, isActive: false }, group2Data]);
            assert.deepStrictEqual(events, [{
                    changed: [extHostEditorTabs.tabGroups.all[0]],
                    closed: [],
                    opened: [extHostEditorTabs.tabGroups.all[1]]
                }]);
            // CHANGE
            events.length = 0;
            extHostEditorTabs.$acceptEditorTabModel([group1Data, { ...group2Data, isActive: false }]);
            assert.deepStrictEqual(events, [{
                    changed: extHostEditorTabs.tabGroups.all,
                    closed: [],
                    opened: []
                }]);
            // CLOSE, CHANGE
            events.length = 0;
            const oldActiveGroup = extHostEditorTabs.tabGroups.activeTabGroup;
            extHostEditorTabs.$acceptEditorTabModel([group2Data]);
            assert.deepStrictEqual(events, [{
                    changed: extHostEditorTabs.tabGroups.all,
                    closed: [oldActiveGroup],
                    opened: []
                }]);
        });
        test('Ensure reference equality for activeTab and activeGroup', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                editorId: 'default',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const [first] = extHostEditorTabs.tabGroups.all;
            assert.ok(first.activeTab);
            assert.strictEqual(first.tabs.indexOf(first.activeTab), 0);
            assert.strictEqual(first.activeTab, first.tabs[0]);
            assert.strictEqual(extHostEditorTabs.tabGroups.activeTabGroup, first);
        });
        test('TextMergeTabInput surfaces in the UI', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab = createTabDto({
                input: {
                    kind: 3 /* TabInputKind.TextMergeInput */,
                    base: uri_1.URI.from({ scheme: 'test', path: 'base' }),
                    input1: uri_1.URI.from({ scheme: 'test', path: 'input1' }),
                    input2: uri_1.URI.from({ scheme: 'test', path: 'input2' }),
                    result: uri_1.URI.from({ scheme: 'test', path: 'result' }),
                }
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const [first] = extHostEditorTabs.tabGroups.all;
            assert.ok(first.activeTab);
            assert.strictEqual(first.tabs.indexOf(first.activeTab), 0);
            assert.ok(first.activeTab.input instanceof extHostTypes_1.TextMergeTabInput);
        });
        test('Ensure reference stability', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tabDto = createTabDto();
            // single dirty tab
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tabDto]
                }]);
            let all = extHostEditorTabs.tabGroups.all.map(group => group.tabs).flat();
            assert.strictEqual(all.length, 1);
            const apiTab1 = all[0];
            assert.ok(apiTab1.input instanceof extHostTypes_1.TextTabInput);
            assert.strictEqual(tabDto.input.kind, 1 /* TabInputKind.TextInput */);
            const dtoResource = tabDto.input.uri;
            assert.strictEqual(apiTab1.input.uri.toString(), uri_1.URI.revive(dtoResource).toString());
            assert.strictEqual(apiTab1.isDirty, true);
            // NOT DIRTY anymore
            const tabDto2 = { ...tabDto, isDirty: false };
            // Accept a simple update
            extHostEditorTabs.$acceptTabOperation({
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                index: 0,
                tabDto: tabDto2,
                groupId: 12
            });
            all = extHostEditorTabs.tabGroups.all.map(group => group.tabs).flat();
            assert.strictEqual(all.length, 1);
            const apiTab2 = all[0];
            assert.ok(apiTab1.input instanceof extHostTypes_1.TextTabInput);
            assert.strictEqual(apiTab1.input.uri.toString(), uri_1.URI.revive(dtoResource).toString());
            assert.strictEqual(apiTab2.isDirty, false);
            assert.strictEqual(apiTab1 === apiTab2, true);
        });
        test('Tab.isActive working', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tabDtoAAA = createTabDto({
                id: 'AAA',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                input: { kind: 1 /* TabInputKind.TextInput */, uri: uri_1.URI.parse('file://abc/AAA.txt') },
                editorId: 'default'
            });
            const tabDtoBBB = createTabDto({
                id: 'BBB',
                isActive: false,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                input: { kind: 1 /* TabInputKind.TextInput */, uri: uri_1.URI.parse('file://abc/BBB.txt') },
                editorId: 'default'
            });
            // single dirty tab
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tabDtoAAA, tabDtoBBB]
                }]);
            const all = extHostEditorTabs.tabGroups.all.map(group => group.tabs).flat();
            assert.strictEqual(all.length, 2);
            const activeTab1 = extHostEditorTabs.tabGroups.activeTabGroup?.activeTab;
            assert.ok(activeTab1?.input instanceof extHostTypes_1.TextTabInput);
            assert.strictEqual(tabDtoAAA.input.kind, 1 /* TabInputKind.TextInput */);
            const dtoAAAResource = tabDtoAAA.input.uri;
            assert.strictEqual(activeTab1?.input?.uri.toString(), uri_1.URI.revive(dtoAAAResource)?.toString());
            assert.strictEqual(activeTab1?.isActive, true);
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: { ...tabDtoBBB, isActive: true } /// BBB is now active
            });
            const activeTab2 = extHostEditorTabs.tabGroups.activeTabGroup?.activeTab;
            assert.ok(activeTab2?.input instanceof extHostTypes_1.TextTabInput);
            assert.strictEqual(tabDtoBBB.input.kind, 1 /* TabInputKind.TextInput */);
            const dtoBBBResource = tabDtoBBB.input.uri;
            assert.strictEqual(activeTab2?.input?.uri.toString(), uri_1.URI.revive(dtoBBBResource)?.toString());
            assert.strictEqual(activeTab2?.isActive, true);
            assert.strictEqual(activeTab1?.isActive, false);
        });
        test('vscode.window.tagGroups is immutable', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            assert.throws(() => {
                // @ts-expect-error write to readonly prop
                extHostEditorTabs.tabGroups.activeTabGroup = undefined;
            });
            assert.throws(() => {
                // @ts-expect-error write to readonly prop
                extHostEditorTabs.tabGroups.all.length = 0;
            });
            assert.throws(() => {
                // @ts-expect-error write to readonly prop
                extHostEditorTabs.tabGroups.onDidChangeActiveTabGroup = undefined;
            });
            assert.throws(() => {
                // @ts-expect-error write to readonly prop
                extHostEditorTabs.tabGroups.onDidChangeTabGroups = undefined;
            });
        });
        test('Ensure close is called with all tab ids', function () {
            const closedTabIds = [];
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
                // override/implement $moveTab or $closeTab
                async $closeTab(tabIds, preserveFocus) {
                    closedTabIds.push(tabIds);
                    return true;
                }
            }));
            const tab = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                editorId: 'default'
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const activeTab = extHostEditorTabs.tabGroups.activeTabGroup?.activeTab;
            assert.ok(activeTab);
            extHostEditorTabs.tabGroups.close(activeTab, false);
            assert.strictEqual(closedTabIds.length, 1);
            assert.deepStrictEqual(closedTabIds[0], ['uniquestring']);
            // Close with array
            extHostEditorTabs.tabGroups.close([activeTab], false);
            assert.strictEqual(closedTabIds.length, 2);
            assert.deepStrictEqual(closedTabIds[1], ['uniquestring']);
        });
        test('Update tab only sends tab change event', async function () {
            const closedTabIds = [];
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
                // override/implement $moveTab or $closeTab
                async $closeTab(tabIds, preserveFocus) {
                    closedTabIds.push(tabIds);
                    return true;
                }
            }));
            const tabDto = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                editorId: 'default'
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tabDto]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 1);
            const tab = extHostEditorTabs.tabGroups.all[0].tabs[0];
            const p = new Promise(resolve => store.add(extHostEditorTabs.tabGroups.onDidChangeTabs(resolve)));
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: { ...tabDto, label: 'NEW LABEL' }
            });
            const changedTab = (await p).changed[0];
            assert.ok(tab === changedTab);
            assert.strictEqual(changedTab.label, 'NEW LABEL');
        });
        test('Active tab', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab1 = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
            });
            const tab2 = createTabDto({
                isActive: false,
                id: 'uniquestring2',
            });
            const tab3 = createTabDto({
                isActive: false,
                id: 'uniquestring3',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab1, tab2, tab3]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            // Active tab is correct
            assert.strictEqual(extHostEditorTabs.tabGroups.activeTabGroup?.activeTab, extHostEditorTabs.tabGroups.activeTabGroup?.tabs[0]);
            // Switching active tab works
            tab1.isActive = false;
            tab2.isActive = true;
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: tab1
            });
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: tab2
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.activeTabGroup?.activeTab, extHostEditorTabs.tabGroups.activeTabGroup?.tabs[1]);
            //Closing tabs out works
            tab3.isActive = true;
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab3]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.activeTabGroup?.activeTab, extHostEditorTabs.tabGroups.activeTabGroup?.tabs[0]);
            // Closing out all tabs returns undefine active tab
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: []
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 0);
            assert.strictEqual(extHostEditorTabs.tabGroups.activeTabGroup?.activeTab, undefined);
        });
        test('Tab operations patches open and close correctly', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab1 = createTabDto({
                id: 'uniquestring',
                isActive: true,
                label: 'label1',
            });
            const tab2 = createTabDto({
                isActive: false,
                id: 'uniquestring2',
                label: 'label2',
            });
            const tab3 = createTabDto({
                isActive: false,
                id: 'uniquestring3',
                label: 'label3',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab1, tab2, tab3]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            // Close tab 2
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                kind: 1 /* TabModelOperationKind.TAB_CLOSE */,
                tabDto: tab2
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 2);
            // Close active tab and update tab 3 to be active
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                kind: 1 /* TabModelOperationKind.TAB_CLOSE */,
                tabDto: tab1
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 1);
            tab3.isActive = true;
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: tab3
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all[0]?.activeTab?.label, 'label3');
            // Open tab 2 back
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                kind: 0 /* TabModelOperationKind.TAB_OPEN */,
                tabDto: tab2
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 2);
            assert.strictEqual(extHostEditorTabs.tabGroups.all[0]?.tabs[1]?.label, 'label2');
        });
        test('Tab operations patches move correctly', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab1 = createTabDto({
                id: 'uniquestring',
                isActive: true,
                label: 'label1',
            });
            const tab2 = createTabDto({
                isActive: false,
                id: 'uniquestring2',
                label: 'label2',
            });
            const tab3 = createTabDto({
                isActive: false,
                id: 'uniquestring3',
                label: 'label3',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab1, tab2, tab3]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            // Move tab 2 to index 0
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                oldIndex: 1,
                kind: 3 /* TabModelOperationKind.TAB_MOVE */,
                tabDto: tab2
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            assert.strictEqual(extHostEditorTabs.tabGroups.all[0]?.tabs[0]?.label, 'label2');
            // Move tab 3 to index 1
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                oldIndex: 2,
                kind: 3 /* TabModelOperationKind.TAB_MOVE */,
                tabDto: tab3
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            assert.strictEqual(extHostEditorTabs.tabGroups.all[0]?.tabs[1]?.label, 'label3');
            assert.strictEqual(extHostEditorTabs.tabGroups.all[0]?.tabs[0]?.label, 'label2');
            assert.strictEqual(extHostEditorTabs.tabGroups.all[0]?.tabs[2]?.label, 'label1');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEVkaXRvclRhYnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3RFZGl0b3JUYWJzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFO1FBRTFCLE1BQU0sYUFBYSxHQUFrQjtZQUNwQyxFQUFFLEVBQUUsY0FBYztZQUNsQixLQUFLLEVBQUUsRUFBRSxJQUFJLGdDQUF3QixFQUFFLEdBQUcsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEVBQUU7WUFDN0UsUUFBUSxFQUFFLElBQUk7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRSxJQUFJO1lBQ2QsU0FBUyxFQUFFLEtBQUs7WUFDaEIsS0FBSyxFQUFFLFFBQVE7U0FDZixDQUFDO1FBRUYsU0FBUyxZQUFZLENBQUMsR0FBNEI7WUFDakQsT0FBTyxFQUFFLEdBQUcsYUFBYSxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDckMsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLENBQUMsdURBQXVELEVBQUU7WUFDN0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHFDQUFpQixDQUM5QyxJQUFBLHdDQUFzQixFQUFDLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUE2QjthQUV6RSxDQUFDLENBQ0YsQ0FBQztZQUVGLE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUQsa0hBQWtIO1lBQ2xILDJGQUEyRjtZQUMzRixNQUFNLENBQUMsTUFBTSxD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