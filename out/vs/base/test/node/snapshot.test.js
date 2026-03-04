/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/test/node/testUtils", "vs/base/node/pfs", "vs/base/test/common/snapshot", "vs/base/common/uri", "path", "vs/base/test/common/utils"], function (require, exports, os_1, testUtils_1, pfs_1, snapshot_1, uri_1, path, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tests for snapshot are in Node so that we can use native FS operations to
    // set up and validate things.
    //
    // Uses snapshots for testing snapshots. It's snapception!
    suite('snapshot', () => {
        let testDir;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(function () {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'snapshot');
            return pfs_1.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(function () {
            return pfs_1.Promises.rm(testDir);
        });
        const makeContext = (test) => {
            return new class extends snapshot_1.SnapshotContext {
                constructor() {
                    super(test);
                    this.snapshotsDir = uri_1.URI.file(testDir);
                }
            };
        };
        const snapshotFileTree = async () => {
            let str = '';
            const printDir = async (dir, indent) => {
                const children = await pfs_1.Promises.readdir(dir);
                for (const child of children) {
                    const p = path.join(dir, child);
                    if ((await pfs_1.Promises.stat(p)).isFile()) {
                        const content = await pfs_1.Promises.readFile(p, 'utf-8');
                        str += `${' '.repeat(indent)}${child}:\n`;
                        for (const line of content.split('\n')) {
                            str += `${' '.repeat(indent + 2)}${line}\n`;
                        }
                    }
                    else {
                        str += `${' '.repeat(indent)}${child}/\n`;
                        await printDir(p, indent + 2);
                    }
                }
            };
            await printDir(testDir, 0);
            await (0, snapshot_1.assertSnapshot)(str);
        };
        test('creates a snapshot', async () => {
            const ctx = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            await ctx.assert({ cool: true });
            await snapshotFileTree();
        });
        test('validates a snapshot', async () => {
            const ctx1 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            await ctx1.assert({ cool: true });
            const ctx2 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            // should pass:
            await ctx2.assert({ cool: true });
            const ctx3 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            // should fail:
            await (0, utils_1.assertThrowsAsync)(() => ctx3.assert({ cool: false }));
        });
        test('cleans up old snapshots', async () => {
            const ctx1 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            await ctx1.assert({ cool: true });
            await ctx1.assert({ nifty: true });
            await ctx1.assert({ customName: 1 }, { name: 'thirdTest', extension: 'txt' });
            await ctx1.assert({ customName: 2 }, { name: 'fourthTest' });
            await snapshotFileTree();
            const ctx2 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            await ctx2.assert({ cool: true });
            await ctx2.assert({ customName: 1 }, { name: 'thirdTest' });
            await ctx2.removeOldSnapshots();
            await snapshotFileTree();
        });
        test('formats object nicely', async () => {
            const circular = {};
            circular.a = circular;
            await (0, snapshot_1.assertSnapshot)([
                1,
                true,
                undefined,
                null,
                123n,
                Symbol('heyo'),
                'hello',
                { hello: 'world' },
                circular,
                new Map([['hello', 1], ['goodbye', 2]]),
                new Set([1, 2, 3]),
                function helloWorld() { },
                /hello/g,
                new Array(10).fill('long string'.repeat(10)),
                { [Symbol.for('debug.description')]() { return `Range [1 -> 5]`; } },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25hcHNob3QudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9ub2RlL3NuYXBzaG90LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsNEVBQTRFO0lBQzVFLDhCQUE4QjtJQUM5QixFQUFFO0lBQ0YsMERBQTBEO0lBRTFELEtBQUssQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQ3RCLElBQUksT0FBZSxDQUFDO1FBRXBCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUM7WUFDTCxPQUFPLEdBQUcsSUFBQSw2QkFBaUIsRUFBQyxJQUFBLFdBQU0sR0FBRSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM5RCxPQUFPLGNBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUM7WUFDUixPQUFPLGNBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLFdBQVcsR0FBRyxDQUFDLElBQXFDLEVBQUUsRUFBRTtZQUM3RCxPQUFPLElBQUksS0FBTSxTQUFRLDBCQUFlO2dCQUN2QztvQkFDQyxLQUFLLENBQUMsSUFBa0IsQ0FBQyxDQUFDO29CQUMxQixJQUFJLENBQUMsWUFBWSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLElBQUksRUFBRTtZQUNuQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFFYixNQUFNLFFB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