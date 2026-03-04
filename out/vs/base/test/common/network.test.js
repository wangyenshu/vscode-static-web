/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, network_1, platform_1, resources_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('network', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        (platform_1.isWeb ? test.skip : test)('FileAccess: URI (native)', () => {
            // asCodeUri() & asFileUri(): simple, without authority
            let originalFileUri = uri_1.URI.file('network.test.ts');
            let browserUri = network_1.FileAccess.uriToBrowserUri(originalFileUri);
            assert.ok(browserUri.authority.length > 0);
            let fileUri = network_1.FileAccess.uriToFileUri(browserUri);
            assert.strictEqual(fileUri.authority.length, 0);
            assert((0, resources_1.isEqual)(originalFileUri, fileUri));
            // asCodeUri() & asFileUri(): with authority
            originalFileUri = uri_1.URI.file('network.test.ts').with({ authority: 'test-authority' });
            browserUri = network_1.FileAccess.uriToBrowserUri(originalFileUri);
            assert.strictEqual(browserUri.authority, originalFileUri.authority);
            fileUri = network_1.FileAccess.uriToFileUri(browserUri);
            assert((0, resources_1.isEqual)(originalFileUri, fileUri));
        });
        (platform_1.isWeb ? test.skip : test)('FileAccess: moduleId (native)', () => {
            const browserUri = network_1.FileAccess.asBrowserUri('vs/base/test/node/network.test');
            assert.strictEqual(browserUri.scheme, network_1.Schemas.vscodeFileResource);
            const fileUri = network_1.FileAccess.asFileUri('vs/base/test/node/network.test');
            assert.strictEqual(fileUri.scheme, network_1.Schemas.file);
        });
        (platform_1.isWeb ? test.skip : test)('FileAccess: query and fragment is dropped (native)', () => {
            const originalFileUri = uri_1.URI.file('network.test.ts').with({ query: 'foo=bar', fragment: 'something' });
            const browserUri = network_1.FileAccess.uriToBrowserUri(originalFileUri);
            assert.strictEqual(browserUri.query, '');
            assert.strictEqual(browserUri.fragment, '');
        });
        (platform_1.isWeb ? test.skip : test)('FileAccess: query and fragment is kept if URI is already of same scheme (native)', () => {
            const originalFileUri = uri_1.URI.file('network.test.ts').with({ query: 'foo=bar', fragment: 'something' });
            const browserUri = network_1.FileAccess.uriToBrowserUri(originalFileUri.with({ scheme: network_1.Schemas.vscodeFileResource }));
            assert.strictEqual(browserUri.query, 'foo=bar');
            assert.strictEqual(browserUri.fragment, 'something');
            const fileUri = network_1.FileAccess.uriToFileUri(originalFileUri);
            assert.strictEqual(fileUri.query, 'foo=bar');
            assert.strictEqual(fileUri.fragment, 'something');
        });
        (platform_1.isWeb ? test.skip : test)('FileAccess: web', () => {
            const originalHttpsUri = uri_1.URI.file('network.test.ts').with({ scheme: 'https' });
            const browserUri = network_1.FileAccess.uriToBrowserUri(originalHttpsUri);
            assert.strictEqual(originalHttpsUri.toString(), browserUri.toString());
        });
        test('FileAccess: remote URIs', () => {
            const originalRemoteUri = uri_1.URI.file('network.test.ts').with({ scheme: network_1.Schemas.vscodeRemote });
            const browserUri = network_1.FileAccess.uriToBrowserUri(originalRemoteUri);
            assert.notStrictEqual(originalRemoteUri.scheme, browserUri.scheme);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29yay50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9uZXR3b3JrLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFFckIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLENBQUMsZ0JBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1lBRTNELHVEQUF1RDtZQUN2RCxJQUFJLGVBQWUsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDbEQsSUFBSSxVQUFVLEdBQUcsb0JBQVUsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMzQyxJQUFJLE9BQU8sR0FBRyxvQkFBVSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxJQUFBLG1CQUFPLEVBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFMUMsNENBQTRDO1lBQzVDLGVBQWUsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQztZQUNwRixVQUFVLEdBQUcsb0JBQVUsQ0FBQyxlQUFl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