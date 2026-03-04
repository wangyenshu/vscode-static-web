/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "path", "vs/base/test/common/utils", "vs/base/test/node/testUtils", "vs/server/node/serverConnectionToken"], function (require, exports, assert, fs, os, path, utils_1, testUtils_1, serverConnectionToken_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('parseServerConnectionToken', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function isError(r) {
            return (r instanceof serverConnectionToken_1.ServerConnectionTokenParseError);
        }
        function assertIsError(r) {
            assert.strictEqual(isError(r), true);
        }
        test('no arguments generates a token that is mandatory', async () => {
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({}, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 2 /* ServerConnectionTokenType.Mandatory */);
        });
        test('--without-connection-token', async () => {
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'without-connection-token': true }, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 0 /* ServerConnectionTokenType.None */);
        });
        test('--without-connection-token --connection-token results in error', async () => {
            assertIsError(await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'without-connection-token': true, 'connection-token': '0' }, async () => 'defaultTokenValue'));
        });
        test('--without-connection-token --connection-token-file results in error', async () => {
            assertIsError(await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'without-connection-token': true, 'connection-token-file': '0' }, async () => 'defaultTokenValue'));
        });
        test('--connection-token-file --connection-token results in error', async () => {
            assertIsError(await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'connection-token-file': '0', 'connection-token': '0' }, async () => 'defaultTokenValue'));
        });
        test('--connection-token-file', async function () {
            this.timeout(10000);
            const testDir = (0, testUtils_1.getRandomTestPath)(os.tmpdir(), 'vsctests', 'server-connection-token');
            fs.mkdirSync(testDir, { recursive: true });
            const filename = path.join(testDir, 'connection-token-file');
            const connectionToken = `12345-123-abc`;
            fs.writeFileSync(filename, connectionToken);
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'connection-token-file': filename }, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 2 /* ServerConnectionTokenType.Mandatory */);
            assert.strictEqual(result.value, connectionToken);
            fs.rmSync(testDir, { recursive: true, force: true });
        });
        test('--connection-token', async () => {
            const connectionToken = `12345-123-abc`;
            const result = await (0, serverConnectionToken_1.parseServerConnectionToken)({ 'connection-token': connectionToken }, async () => 'defaultTokenValue');
            assert.ok(!(result instanceof serverConnectionToken_1.ServerConnectionTokenParseError));
            assert.ok(result.type === 2 /* ServerConnectionTokenType.Mandatory */);
            assert.strictEqual(result.value, connectionToken);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyQ29ubmVjdGlvblRva2VuLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvdGVzdC9ub2RlL3NlcnZlckNvbm5lY3Rpb25Ub2tlbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsT0FBTyxDQUFDLENBQTBEO1lBQzFFLE9BQU8sQ0FBQyxDQUFDLFlBQVksdURBQStCLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsU0FBUyxhQUFhLENBQUMsQ0FBMEQ7WUFDaEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELElBQUksQ0FBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNuRSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsa0RBQTBCLEVBQUMsRUFBc0IsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDekcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxZQUFZLHVEQUErQixDQUFDLENBQUMsQ0FBQztZQUNoRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLGdEQUF3QyxDQUFDLENBQUM7UUFDaEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGtEQUEwQixFQUFDLEVBQUUsMEJBQTBCLEVBQUUsSUFBSSxFQUFzQixFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMs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