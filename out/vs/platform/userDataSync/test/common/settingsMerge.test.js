/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/userDataSync/common/settingsMerge"], function (require, exports, assert, utils_1, settingsMerge_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const formattingOptions = { eol: '\n', insertSpaces: false, tabSize: 4 };
    suite('SettingsMerge - Merge', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('merge when local and remote are same with one entry', async () => {
            const localContent = stringify({ 'a': 1 });
            const remoteContent = stringify({ 'a': 1 });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when local and remote are same with multiple entries', async () => {
            const localContent = stringify({
                'a': 1,
                'b': 2
            });
            const remoteContent = stringify({
                'a': 1,
                'b': 2
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when local and remote are same with multiple entries in different order', async () => {
            const localContent = stringify({
                'b': 2,
                'a': 1,
            });
            const remoteContent = stringify({
                'a': 1,
                'b': 2
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, localContent);
            assert.strictEqual(actual.remoteContent, remoteContent);
            assert.ok(actual.hasConflicts);
            assert.strictEqual(actual.conflictsSettings.length, 0);
        });
        test('merge when local and remote are same with different base content', async () => {
            const localContent = stringify({
                'b': 2,
                'a': 1,
            });
            const baseContent = stringify({
                'a': 2,
                'b': 1
            });
            const remoteContent = stringify({
                'a': 1,
                'b': 2
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, localContent);
            assert.strictEqual(actual.remoteContent, remoteContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(actual.hasConflicts);
        });
        test('merge when a new entry is added to remote', async () => {
            const localContent = stringify({
                'a': 1,
            });
            const remoteContent = stringify({
                'a': 1,
                'b': 2
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when multiple new entries are added to remote', async () => {
            const localContent = stringify({
                'a': 1,
            });
            const remoteContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when multiple new entries are added to remote from base and local has not changed', async () => {
            const localContent = stringify({
                'a': 1,
            });
            const remoteContent = stringify({
                'b': 2,
                'a': 1,
                'c': 3,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when an entry is removed from remote from base and local has not changed', async () => {
            const localContent = stringify({
                'a': 1,
                'b': 2,
            });
            const remoteContent = stringify({
                'a': 1,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when all entries are removed from base and local has not changed', async () => {
            const localContent = stringify({
                'a': 1,
            });
            const remoteContent = stringify({});
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when an entry is updated in remote from base and local has not changed', async () => {
            const localContent = stringify({
                'a': 1,
            });
            const remoteContent = stringify({
                'a': 2
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when remote has moved forwareded with multiple changes and local stays with base', async () => {
            const localContent = stringify({
                'a': 1,
            });
            const remoteContent = stringify({
                'a': 2,
                'b': 1,
                'c': 3,
                'd': 4,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when remote has moved forwareded with order changes and local stays with base', async () => {
            const localContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
            });
            const remoteContent = stringify({
                'a': 2,
                'd': 4,
                'c': 3,
                'b': 2,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when remote has moved forwareded with comment changes and local stays with base', async () => {
            const localContent = `
{
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 1,
}`;
            const remoteContent = stringify `
{
	// comment b has changed
	"b": 2,
	// this is comment for c
	"c": 1,
}`;
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when remote has moved forwareded with comment and order changes and local stays with base', async () => {
            const localContent = `
{
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 1,
}`;
            const remoteContent = stringify `
{
	// this is comment for c
	"c": 1,
	// comment b has changed
	"b": 2,
}`;
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when a new entries are added to local', async () => {
            const localContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
                'd': 4,
            });
            const remoteContent = stringify({
                'a': 1,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, localContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when multiple new entries are added to local from base and remote is not changed', async () => {
            const localContent = stringify({
                'a': 2,
                'b': 1,
                'c': 3,
                'd': 4,
            });
            const remoteContent = stringify({
                'a': 1,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, remoteContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, localContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when an entry is removed from local from base and remote has not changed', async () => {
            const localContent = stringify({
                'a': 1,
                'c': 2
            });
            const remoteContent = stringify({
                'a': 2,
                'b': 1,
                'c': 3,
                'd': 4,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, remoteContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, localContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when an entry is updated in local from base and remote has not changed', async () => {
            const localContent = stringify({
                'a': 1,
                'c': 2
            });
            const remoteContent = stringify({
                'a': 2,
                'c': 2,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, remoteContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, localContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when local has moved forwarded with multiple changes and remote stays with base', async () => {
            const localContent = stringify({
                'a': 2,
                'b': 1,
                'c': 3,
                'd': 4,
            });
            const remoteContent = stringify({
                'a': 1,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, remoteContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, localContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when local has moved forwarded with order changes and remote stays with base', async () => {
            const localContent = `
{
	"b": 2,
	"c": 1,
}`;
            const remoteContent = stringify `
{
	"c": 1,
	"b": 2,
}`;
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, remoteContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, localContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when local has moved forwarded with comment changes and remote stays with base', async () => {
            const localContent = `
{
	// comment for b has changed
	"b": 2,
	// comment for c
	"c": 1,
}`;
            const remoteContent = stringify `
{
	// comment for b
	"b": 2,
	// comment for c
	"c": 1,
}`;
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, remoteContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, localContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when local has moved forwarded with comment and order changes and remote stays with base', async () => {
            const localContent = `
{
	// comment for c
	"c": 1,
	// comment for b has changed
	"b": 2,
}`;
            const remoteContent = stringify `
{
	// comment for b
	"b": 2,
	// comment for c
	"c": 1,
}`;
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, remoteContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, localContent);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('merge when local and remote with one entry but different value', async () => {
            const localContent = stringify({
                'a': 1
            });
            const remoteContent = stringify({
                'a': 2
            });
            const expectedConflicts = [{ key: 'a', localValue: 1, remoteValue: 2 }];
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, localContent);
            assert.strictEqual(actual.remoteContent, remoteContent);
            assert.ok(actual.hasConflicts);
            assert.deepStrictEqual(actual.conflictsSettings, expectedConflicts);
        });
        test('merge when the entry is removed in remote but updated in local and a new entry is added in remote', async () => {
            const baseContent = stringify({
                'a': 1
            });
            const localContent = stringify({
                'a': 2
            });
            const remoteContent = stringify({
                'b': 2
            });
            const expectedConflicts = [{ key: 'a', localValue: 2, remoteValue: undefined }];
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, stringify({
                'a': 2,
                'b': 2
            }));
            assert.strictEqual(actual.remoteContent, remoteContent);
            assert.ok(actual.hasConflicts);
            assert.deepStrictEqual(actual.conflictsSettings, expectedConflicts);
        });
        test('merge with single entry and local is empty', async () => {
            const baseContent = stringify({
                'a': 1
            });
            const localContent = stringify({});
            const remoteContent = stringify({
                'a': 2
            });
            const expectedConflicts = [{ key: 'a', localValue: undefined, remoteValue: 2 }];
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, localContent);
            assert.strictEqual(actual.remoteContent, remoteContent);
            assert.ok(actual.hasConflicts);
            assert.deepStrictEqual(actual.conflictsSettings, expectedConflicts);
        });
        test('merge when local and remote has moved forwareded with conflicts', async () => {
            const baseContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
                'd': 4,
            });
            const localContent = stringify({
                'a': 2,
                'c': 3,
                'd': 5,
                'e': 4,
                'f': 1,
            });
            const remoteContent = stringify({
                'b': 3,
                'c': 3,
                'd': 6,
                'e': 5,
            });
            const expectedConflicts = [
                { key: 'b', localValue: undefined, remoteValue: 3 },
                { key: 'a', localValue: 2, remoteValue: undefined },
                { key: 'd', localValue: 5, remoteValue: 6 },
                { key: 'e', localValue: 4, remoteValue: 5 },
            ];
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, stringify({
                'a': 2,
                'c': 3,
                'd': 5,
                'e': 4,
                'f': 1,
            }));
            assert.strictEqual(actual.remoteContent, stringify({
                'b': 3,
                'c': 3,
                'd': 6,
                'e': 5,
                'f': 1,
            }));
            assert.ok(actual.hasConflicts);
            assert.deepStrictEqual(actual.conflictsSettings, expectedConflicts);
        });
        test('merge when local and remote has moved forwareded with change in order', async () => {
            const baseContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
                'd': 4,
            });
            const localContent = stringify({
                'a': 2,
                'c': 3,
                'b': 2,
                'd': 4,
                'e': 5,
            });
            const remoteContent = stringify({
                'a': 1,
                'b': 2,
                'c': 4,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, stringify({
                'a': 2,
                'c': 4,
                'b': 2,
                'e': 5,
            }));
            assert.strictEqual(actual.remoteContent, stringify({
                'a': 2,
                'b': 2,
                'e': 5,
                'c': 4,
            }));
            assert.ok(actual.hasConflicts);
            assert.deepStrictEqual(actual.conflictsSettings, []);
        });
        test('merge when local and remote has moved forwareded with comment changes', async () => {
            const baseContent = `
{
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 1
}`;
            const localContent = `
{
	// comment b has changed in local
	"b": 2,
	// this is comment for c
	"c": 1
}`;
            const remoteContent = `
{
	// comment b has changed in remote
	"b": 2,
	// this is comment for c
	"c": 1
}`;
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, localContent);
            assert.strictEqual(actual.remoteContent, remoteContent);
            assert.ok(actual.hasConflicts);
            assert.deepStrictEqual(actual.conflictsSettings, []);
        });
        test('resolve when local and remote has moved forwareded with resolved conflicts', async () => {
            const baseContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
                'd': 4,
            });
            const localContent = stringify({
                'a': 2,
                'c': 3,
                'd': 5,
                'e': 4,
                'f': 1,
            });
            const remoteContent = stringify({
                'b': 3,
                'c': 3,
                'd': 6,
                'e': 5,
            });
            const expectedConflicts = [
                { key: 'd', localValue: 5, remoteValue: 6 },
            ];
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, [], [{ key: 'a', value: 2 }, { key: 'b', value: undefined }, { key: 'e', value: 5 }], formattingOptions);
            assert.strictEqual(actual.localContent, stringify({
                'a': 2,
                'c': 3,
                'd': 5,
                'e': 5,
                'f': 1,
            }));
            assert.strictEqual(actual.remoteContent, stringify({
                'c': 3,
                'd': 6,
                'e': 5,
                'f': 1,
                'a': 2,
            }));
            assert.ok(actual.hasConflicts);
            assert.deepStrictEqual(actual.conflictsSettings, expectedConflicts);
        });
        test('ignored setting is not merged when changed in local and remote', async () => {
            const localContent = stringify({ 'a': 1 });
            const remoteContent = stringify({ 'a': 2 });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, ['a'], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('ignored setting is not merged when changed in local and remote from base', async () => {
            const baseContent = stringify({ 'a': 0 });
            const localContent = stringify({ 'a': 1 });
            const remoteContent = stringify({ 'a': 2 });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, ['a'], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('ignored setting is not merged when added in remote', async () => {
            const localContent = stringify({});
            const remoteContent = stringify({ 'a': 1 });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, ['a'], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('ignored setting is not merged when added in remote from base', async () => {
            const localContent = stringify({ 'b': 2 });
            const remoteContent = stringify({ 'a': 1, 'b': 2 });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, ['a'], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('ignored setting is not merged when removed in remote', async () => {
            const localContent = stringify({ 'a': 1 });
            const remoteContent = stringify({});
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, ['a'], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('ignored setting is not merged when removed in remote from base', async () => {
            const localContent = stringify({ 'a': 2 });
            const remoteContent = stringify({});
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, localContent, ['a'], [], formattingOptions);
            assert.strictEqual(actual.localContent, null);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('ignored setting is not merged with other changes without conflicts', async () => {
            const baseContent = stringify({
                'a': 2,
                'b': 2,
                'c': 3,
                'd': 4,
                'e': 5,
            });
            const localContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
            });
            const remoteContent = stringify({
                'a': 3,
                'b': 3,
                'd': 4,
                'e': 6,
            });
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, ['a', 'e'], [], formattingOptions);
            assert.strictEqual(actual.localContent, stringify({
                'a': 1,
                'b': 3,
            }));
            assert.strictEqual(actual.remoteContent, stringify({
                'a': 3,
                'b': 3,
                'e': 6,
            }));
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
        test('ignored setting is not merged with other changes conflicts', async () => {
            const baseContent = stringify({
                'a': 2,
                'b': 2,
                'c': 3,
                'd': 4,
                'e': 5,
            });
            const localContent = stringify({
                'a': 1,
                'b': 4,
                'c': 3,
                'd': 5,
            });
            const remoteContent = stringify({
                'a': 3,
                'b': 3,
                'e': 6,
            });
            const expectedConflicts = [
                { key: 'd', localValue: 5, remoteValue: undefined },
                { key: 'b', localValue: 4, remoteValue: 3 },
            ];
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, baseContent, ['a', 'e'], [], formattingOptions);
            assert.strictEqual(actual.localContent, stringify({
                'a': 1,
                'b': 4,
                'd': 5,
            }));
            assert.strictEqual(actual.remoteContent, stringify({
                'a': 3,
                'b': 3,
                'e': 6,
            }));
            assert.deepStrictEqual(actual.conflictsSettings, expectedConflicts);
            assert.ok(actual.hasConflicts);
        });
        test('merge when remote has comments and local is empty', async () => {
            const localContent = `
{

}`;
            const remoteContent = stringify `
{
	// this is a comment
	"a": 1,
}`;
            const actual = (0, settingsMerge_1.merge)(localContent, remoteContent, null, [], [], formattingOptions);
            assert.strictEqual(actual.localContent, remoteContent);
            assert.strictEqual(actual.remoteContent, null);
            assert.strictEqual(actual.conflictsSettings.length, 0);
            assert.ok(!actual.hasConflicts);
        });
    });
    suite('SettingsMerge - Compute Remote Content', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('local content is returned when there are no ignored settings', async () => {
            const localContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
            });
            const remoteContent = stringify({
                'a': 3,
                'b': 3,
                'd': 4,
                'e': 6,
            });
            const actual = (0, settingsMerge_1.updateIgnoredSettings)(localContent, remoteContent, [], formattingOptions);
            assert.strictEqual(actual, localContent);
        });
        test('when target content is empty', async () => {
            const remoteContent = stringify({
                'a': 3,
            });
            const actual = (0, settingsMerge_1.updateIgnoredSettings)('', remoteContent, ['a'], formattingOptions);
            assert.strictEqual(actual, '');
        });
        test('when source content is empty', async () => {
            const localContent = stringify({
                'a': 3,
                'b': 3,
            });
            const expected = stringify({
                'b': 3,
            });
            const actual = (0, settingsMerge_1.updateIgnoredSettings)(localContent, '', ['a'], formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('ignored settings are not updated from remote content', async () => {
            const localContent = stringify({
                'a': 1,
                'b': 2,
                'c': 3,
            });
            const remoteContent = stringify({
                'a': 3,
                'b': 3,
                'd': 4,
                'e': 6,
            });
            const expected = stringify({
                'a': 3,
                'b': 2,
                'c': 3,
            });
            const actual = (0, settingsMerge_1.updateIgnoredSettings)(localContent, remoteContent, ['a'], formattingOptions);
            assert.strictEqual(actual, expected);
        });
    });
    suite('SettingsMerge - Add Setting', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Insert after a setting without comments', () => {
            const sourceContent = `
{
	"a": 1,
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"a": 2,
	"d": 3
}`;
            const expected = `
{
	"a": 2,
	"b": 2,
	"d": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting without comments at the end', () => {
            const sourceContent = `
{
	"a": 1,
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"a": 2
}`;
            const expected = `
{
	"a": 2,
	"b": 2
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert between settings without comment', () => {
            const sourceContent = `
{
	"a": 1,
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"a": 1,
	"c": 3
}`;
            const expected = `
{
	"a": 1,
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert between settings and there is a comment in between in source', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"a": 1,
	"c": 3
}`;
            const expected = `
{
	"a": 1,
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting and after a comment at the end', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2
}`;
            const targetContent = `
{
	"a": 1
	// this is comment for b
}`;
            const expected = `
{
	"a": 1,
	// this is comment for b
	"b": 2
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting ending with comma and after a comment at the end', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2
}`;
            const targetContent = `
{
	"a": 1,
	// this is comment for b
}`;
            const expected = `
{
	"a": 1,
	// this is comment for b
	"b": 2
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a comment and there are no settings', () => {
            const sourceContent = `
{
	// this is comment for b
	"b": 2
}`;
            const targetContent = `
{
	// this is comment for b
}`;
            const expected = `
{
	// this is comment for b
	"b": 2
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting and between a comment and setting', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"a": 1,
	// this is comment for b
	"c": 3
}`;
            const expected = `
{
	"a": 1,
	// this is comment for b
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting between two comments and there is a setting after', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const targetContent = `
{
	"a": 1,
	// this is comment for b
	// this is comment for c
	"c": 3
}`;
            const expected = `
{
	"a": 1,
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting between two comments on the same line and there is a setting after', () => {
            const sourceContent = `
{
	"a": 1,
	/* this is comment for b */
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const targetContent = `
{
	"a": 1,
	/* this is comment for b */ // this is comment for c
	"c": 3
}`;
            const expected = `
{
	"a": 1,
	/* this is comment for b */
	"b": 2, // this is comment for c
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting between two line comments on the same line and there is a setting after', () => {
            const sourceContent = `
{
	"a": 1,
	/* this is comment for b */
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const targetContent = `
{
	"a": 1,
	// this is comment for b // this is comment for c
	"c": 3
}`;
            const expected = `
{
	"a": 1,
	// this is comment for b // this is comment for c
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting between two comments and there is no setting after', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2
	// this is a comment
}`;
            const targetContent = `
{
	"a": 1
	// this is comment for b
	// this is a comment
}`;
            const expected = `
{
	"a": 1,
	// this is comment for b
	"b": 2
	// this is a comment
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting with comma and between two comments and there is no setting after', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2
	// this is a comment
}`;
            const targetContent = `
{
	"a": 1,
	// this is comment for b
	// this is a comment
}`;
            const expected = `
{
	"a": 1,
	// this is comment for b
	"b": 2
	// this is a comment
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting without comments', () => {
            const sourceContent = `
{
	"a": 1,
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"d": 2,
	"c": 3
}`;
            const expected = `
{
	"d": 2,
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting without comments at the end', () => {
            const sourceContent = `
{
	"a": 1,
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"c": 3
}`;
            const expected = `
{
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting with comment', () => {
            const sourceContent = `
{
	"a": 1,
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const targetContent = `
{
	// this is comment for c
	"c": 3
}`;
            const expected = `
{
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting and before a comment at the beginning', () => {
            const sourceContent = `
{
	// this is comment for b
	"b": 2,
	"c": 3,
}`;
            const targetContent = `
{
	// this is comment for b
	"c": 3
}`;
            const expected = `
{
	// this is comment for b
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting ending with comma and before a comment at the begninning', () => {
            const sourceContent = `
{
	// this is comment for b
	"b": 2,
	"c": 3,
}`;
            const targetContent = `
{
	// this is comment for b
	"c": 3,
}`;
            const expected = `
{
	// this is comment for b
	"b": 2,
	"c": 3,
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting and between a setting and comment', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"d": 1,
	// this is comment for b
	"c": 3
}`;
            const expected = `
{
	"d": 1,
	// this is comment for b
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting between two comments and there is a setting before', () => {
            const sourceContent = `
{
	"a": 1,
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const targetContent = `
{
	"d": 1,
	// this is comment for b
	// this is comment for c
	"c": 3
}`;
            const expected = `
{
	"d": 1,
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting between two comments on the same line and there is a setting before', () => {
            const sourceContent = `
{
	"a": 1,
	/* this is comment for b */
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const targetContent = `
{
	"d": 1,
	/* this is comment for b */ // this is comment for c
	"c": 3
}`;
            const expected = `
{
	"d": 1,
	/* this is comment for b */
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting between two line comments on the same line and there is a setting before', () => {
            const sourceContent = `
{
	"a": 1,
	/* this is comment for b */
	"b": 2,
	// this is comment for c
	"c": 3
}`;
            const targetContent = `
{
	"d": 1,
	// this is comment for b // this is comment for c
	"c": 3
}`;
            const expected = `
{
	"d": 1,
	"b": 2,
	// this is comment for b // this is comment for c
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting between two comments and there is no setting before', () => {
            const sourceContent = `
{
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 1
}`;
            const targetContent = `
{
	// this is comment for b
	// this is comment for c
	"c": 1
}`;
            const expected = `
{
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 1
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert before a setting with comma and between two comments and there is no setting before', () => {
            const sourceContent = `
{
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 1
}`;
            const targetContent = `
{
	// this is comment for b
	// this is comment for c
	"c": 1,
}`;
            const expected = `
{
	// this is comment for b
	"b": 2,
	// this is comment for c
	"c": 1,
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a setting that is of object type', () => {
            const sourceContent = `
{
	"b": {
		"d": 1
	},
	"a": 2,
	"c": 1
}`;
            const targetContent = `
{
	"b": {
		"d": 1
	},
	"c": 1
}`;
            const actual = (0, settingsMerge_1.addSetting)('a', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, sourceContent);
        });
        test('Insert after a setting that is of array type', () => {
            const sourceContent = `
{
	"b": [
		1
	],
	"a": 2,
	"c": 1
}`;
            const targetContent = `
{
	"b": [
		1
	],
	"c": 1
}`;
            const actual = (0, settingsMerge_1.addSetting)('a', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, sourceContent);
        });
        test('Insert after a comment with comma separator of previous setting and no next nodes ', () => {
            const sourceContent = `
{
	"a": 1
	// this is comment for a
	,
	"b": 2
}`;
            const targetContent = `
{
	"a": 1
	// this is comment for a
	,
}`;
            const expected = `
{
	"a": 1
	// this is comment for a
	,
	"b": 2
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a comment with comma separator of previous setting and there is a setting after ', () => {
            const sourceContent = `
{
	"a": 1
	// this is comment for a
	,
	"b": 2,
	"c": 3
}`;
            const targetContent = `
{
	"a": 1
	// this is comment for a
	,
	"c": 3
}`;
            const expected = `
{
	"a": 1
	// this is comment for a
	,
	"b": 2,
	"c": 3
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
        test('Insert after a comment with comma separator of previous setting and there is a comment after ', () => {
            const sourceContent = `
{
	"a": 1
	// this is comment for a
	,
	"b": 2
	// this is a comment
}`;
            const targetContent = `
{
	"a": 1
	// this is comment for a
	,
	// this is a comment
}`;
            const expected = `
{
	"a": 1
	// this is comment for a
	,
	"b": 2
	// this is a comment
}`;
            const actual = (0, settingsMerge_1.addSetting)('b', sourceContent, targetContent, formattingOptions);
            assert.strictEqual(actual, expected);
        });
    });
    function stringify(value) {
        return JSON.stringify(value, null, '\t');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NNZXJnZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL3Rlc3QvY29tbW9uL3NldHRpbmdzTWVyZ2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxNQUFNLGlCQUFpQixHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUV6RSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMscURBQXFELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEUsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDM0MsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUMsTUFBTSxNQUFNLEdBQUcsSUFBQSxxQkFBSyxFQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFB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