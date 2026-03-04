/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataProfilesManifestMerge"], function (require, exports, assert, uri_1, utils_1, userDataProfile_1, userDataProfilesManifestMerge_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UserDataProfilesManifestMerge', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('merge returns local profiles if remote does not exist', () => {
            const localProfiles = [
                (0, userDataProfile_1.toUserDataProfile)('1', '1', uri_1.URI.file('1'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('2', '2', uri_1.URI.file('2'), uri_1.URI.file('cache')),
            ];
            const actual = (0, userDataProfilesManifestMerge_1.merge)(localProfiles, null, null, []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual(actual.remote?.added, localProfiles);
            assert.deepStrictEqual(actual.remote?.updated, []);
            assert.deepStrictEqual(actual.remote?.removed, []);
        });
        test('merge returns local profiles if remote does not exist with ignored profiles', () => {
            const localProfiles = [
                (0, userDataProfile_1.toUserDataProfile)('1', '1', uri_1.URI.file('1'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('2', '2', uri_1.URI.file('2'), uri_1.URI.file('cache')),
            ];
            const actual = (0, userDataProfilesManifestMerge_1.merge)(localProfiles, null, null, ['2']);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual(actual.remote?.added, [localProfiles[0]]);
            assert.deepStrictEqual(actual.remote?.updated, []);
            assert.deepStrictEqual(actual.remote?.removed, []);
        });
        test('merge local and remote profiles when there is no base', () => {
            const localProfiles = [
                (0, userDataProfile_1.toUserDataProfile)('1', '1', uri_1.URI.file('1'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('2', '2', uri_1.URI.file('2'), uri_1.URI.file('cache')),
            ];
            const remoteProfiles = [
                { id: '1', name: 'changed', collection: '1' },
                { id: '3', name: '3', collection: '3' },
            ];
            const actual = (0, userDataProfilesManifestMerge_1.merge)(localProfiles, remoteProfiles, null, []);
            assert.deepStrictEqual(actual.local.added, [remoteProfiles[1]]);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [remoteProfiles[0]]);
            assert.deepStrictEqual(actual.remote?.added, [localProfiles[1]]);
            assert.deepStrictEqual(actual.remote?.updated, []);
            assert.deepStrictEqual(actual.remote?.removed, []);
        });
        test('merge local and remote profiles when there is base', () => {
            const localProfiles = [
                (0, userDataProfile_1.toUserDataProfile)('1', 'changed 1', uri_1.URI.file('1'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('3', '3', uri_1.URI.file('3'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('4', 'changed local', uri_1.URI.file('4'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('5', '5', uri_1.URI.file('5'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('6', '6', uri_1.URI.file('6'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('8', '8', uri_1.URI.file('8'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('10', '10', uri_1.URI.file('8'), uri_1.URI.file('cache'), { useDefaultFlags: { tasks: true } }),
                (0, userDataProfile_1.toUserDataProfile)('11', '11', uri_1.URI.file('1'), uri_1.URI.file('cache'), { useDefaultFlags: { keybindings: true } }),
            ];
            const base = [
                { id: '1', name: '1', collection: '1' },
                { id: '2', name: '2', collection: '2' },
                { id: '3', name: '3', collection: '3' },
                { id: '4', name: '4', collection: '4' },
                { id: '5', name: '5', collection: '5' },
                { id: '6', name: '6', collection: '6' },
                { id: '10', name: '10', collection: '10', useDefaultFlags: { tasks: true } },
                { id: '11', name: '11', collection: '11' },
            ];
            const remoteProfiles = [
                { id: '1', name: '1', collection: '1' },
                { id: '2', name: '2', collection: '2' },
                { id: '3', name: '3', collection: '3', shortName: 'short 3' },
                { id: '4', name: 'changed remote', collection: '4' },
                { id: '5', name: '5', collection: '5' },
                { id: '7', name: '7', collection: '7' },
                { id: '9', name: '9', collection: '9', useDefaultFlags: { snippets: true } },
                { id: '10', name: '10', collection: '10' },
                { id: '11', name: '11', collection: '11' },
            ];
            const actual = (0, userDataProfilesManifestMerge_1.merge)(localProfiles, remoteProfiles, base, []);
            assert.deepStrictEqual(actual.local.added, [remoteProfiles[5], remoteProfiles[6]]);
            assert.deepStrictEqual(actual.local.removed, [localProfiles[4]]);
            assert.deepStrictEqual(actual.local.updated, [remoteProfiles[2], remoteProfiles[3], remoteProfiles[7]]);
            assert.deepStrictEqual(actual.remote?.added, [localProfiles[5]]);
            assert.deepStrictEqual(actual.remote?.updated, [localProfiles[0], localProfiles[7]]);
            assert.deepStrictEqual(actual.remote?.removed, [remoteProfiles[1]]);
        });
        test('merge local and remote profiles when there is base with ignored profiles', () => {
            const localProfiles = [
                (0, userDataProfile_1.toUserDataProfile)('1', 'changed 1', uri_1.URI.file('1'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('3', '3', uri_1.URI.file('3'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('4', 'changed local', uri_1.URI.file('4'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('5', '5', uri_1.URI.file('5'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('6', '6', uri_1.URI.file('6'), uri_1.URI.file('cache')),
                (0, userDataProfile_1.toUserDataProfile)('8', '8', uri_1.URI.file('8'), uri_1.URI.file('cache')),
            ];
            const base = [
                { id: '1', name: '1', collection: '1' },
                { id: '2', name: '2', collection: '2' },
                { id: '3', name: '3', collection: '3' },
                { id: '4', name: '4', collection: '4' },
                { id: '5', name: '5', collection: '5' },
                { id: '6', name: '6', collection: '6' },
            ];
            const remoteProfiles = [
                { id: '1', name: '1', collection: '1' },
                { id: '2', name: '2', collection: '2' },
                { id: '3', name: 'changed 3', collection: '3' },
                { id: '4', name: 'changed remote', collection: '4' },
                { id: '5', name: '5', collection: '5' },
                { id: '7', name: '7', collection: '7' },
            ];
            const actual = (0, userDataProfilesManifestMerge_1.merge)(localProfiles, remoteProfiles, base, ['4', '8']);
            assert.deepStrictEqual(actual.local.added, [remoteProfiles[5]]);
            assert.deepStrictEqual(actual.local.removed, [localProfiles[4]]);
            assert.deepStrictEqual(actual.local.updated, [remoteProfiles[2]]);
            assert.deepStrictEqual(actual.remote?.added, []);
            assert.deepStrictEqual(actual.remote?.updated, [localProfiles[0]]);
            assert.deepStrictEqual(actual.remote?.removed, [remoteProfiles[1]]);
        });
        test('merge when there are no remote changes', () => {
            const localProfiles = [
                (0, userDataProfile_1.toUserDataProfile)('1', '1', uri_1.URI.file('1'), uri_1.URI.file('cache')),
            ];
            const base = [
                { id: '1', name: '1', collection: '1' },
            ];
            const remoteProfiles = [
                { id: '1', name: 'name changed', collection: '1' },
            ];
            const actual = (0, userDataProfilesManifestMerge_1.merge)(localProfiles, remoteProfiles, base, []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [remoteProfiles[0]]);
            assert.strictEqual(actual.remote, null);
        });
        test('merge when there are no local and remote changes', () => {
            const localProfiles = [
                (0, userDataProfile_1.toUserDataProfile)('1', '1', uri_1.URI.file('1'), uri_1.URI.file('cache')),
            ];
            const base = [
                { id: '1', name: '1', collection: '1' },
            ];
            const remoteProfiles = [
                { id: '1', name: '1', collection: '1' },
            ];
            const actual = (0, userDataProfilesManifestMerge_1.merge)(localProfiles, remoteProfiles, base, []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.strictEqual(actual.remote, null);
        });
        test('merge when profile is removed locally, but not exists in remote', () => {
            const localProfiles = [
                (0, userDataProfile_1.toUserDataProfile)('1', '1', uri_1.URI.file('1'), uri_1.URI.file('cache')),
            ];
            const base = [
                { id: '1', name: '1', collection: '1' },
                { id: '2', name: '2', collection: '2' },
            ];
            const remoteProfiles = [
                { id: '1', name: '3', collection: '1' },
            ];
            const actual = (0, userDataProfilesManifestMerge_1.merge)(localProfiles, remoteProfiles, base, []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, remoteProfiles);
            assert.strictEqual(actual.remote, null);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlc01hbmlmZXN0TWVyZ2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy90ZXN0L2NvbW1vbi91c2VyRGF0YVByb2ZpbGVzTWFuaWZlc3RNZXJnZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7UUFFM0MsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx1REFBdUQsRUFBRSxHQUFHLEVBQUU7WUFDbEUsTUFBTSxhQUFhLEdBQXVCO2dCQUN6QyxJQUFBLG1DQUFpQixFQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM3RCxJQUFBLG1DQUFpQixFQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQzdELENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxJQUFBLHFDQUFLLEVBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFcEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxP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QUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDdkMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDdkMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQzVFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7YUFDMUMsQ0FBQztZQUNGLE1BQU0sY0FBYyxHQUEyQjtnQkFDOUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDdkMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDdkMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFO2dCQUM3RCxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ3BELEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ3ZDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ3ZDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLEVBQUUsUUFBUSxFQUFFLElB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