/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertHeap = assertHeap;
    let currentTest;
    const snapshotsToAssert = [];
    setup(function () {
        currentTest = this.currentTest;
    });
    suiteTeardown(async () => {
        await Promise.all(snapshotsToAssert.map(async (snap) => {
            const counts = await snap.counts;
            const asserts = Object.entries(snap.opts.classes);
            if (asserts.length !== counts.length) {
                throw new Error(`expected class counts to equal assertions length for ${snap.test}`);
            }
            for (const [i, [name, doAssert]] of asserts.entries()) {
                try {
                    doAssert(counts[i]);
                }
                catch (e) {
                    throw new Error(`Unexpected number of ${name} instances (${counts[i]}) after "${snap.test}":\n\n${e.message}\n\nSnapshot saved at: ${snap.file}`);
                }
            }
        }));
        snapshotsToAssert.length = 0;
    });
    const snapshotMinTime = 20_000;
    /**
     * Takes a heap snapshot, and asserts the state of classes in memory. This
     * works in Node and the Electron sandbox, but is a no-op in the browser.
     * Snapshots are process asynchronously and will report failures at the end of
     * the suite.
     *
     * This method should be used sparingly (e.g. once at the end of a suite to
     * ensure nothing leaked before), as gathering a heap snapshot is fairly
     * slow, at least until V8 11.5.130 (https://v8.dev/blog/speeding-up-v8-heap-snapshots).
     *
     * Takes options containing a mapping of class names, and assertion functions
     * to run on the number of retained instances of that class. For example:
     *
     * ```ts
     * assertSnapshot({
     *	classes: {
     *		ShouldNeverLeak: count => assert.strictEqual(count, 0),
     *		SomeSingleton: count => assert(count <= 1),
     *	}
     *});
     * ```
     */
    async function assertHeap(opts) {
        if (!currentTest) {
            throw new Error('assertSnapshot can only be used when a test is running');
        }
        // snapshotting can take a moment, ensure the test timeout is decently long
        // so it doesn't immediately fail.
        if (currentTest.timeout() < snapshotMinTime) {
            currentTest.timeout(snapshotMinTime);
        }
        if (typeof __analyzeSnapshotInTests === 'undefined') {
            return; // running in browser, no-op
        }
        const { done, file } = await __analyzeSnapshotInTests(currentTest.fullTitle(), Object.keys(opts.classes));
        snapshotsToAssert.push({ counts: done, file, test: currentTest.fullTitle(), opts });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0SGVhcC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vYXNzZXJ0SGVhcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQThEaEcsZ0NBaUJDO0lBMUVELElBQUksV0FBbUMsQ0FBQztJQUV4QyxNQUFNLGlCQUFpQixHQUFnRyxFQUFFLENBQUM7SUFFMUgsS0FBSyxDQUFDO1FBQ0wsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDaEMsQ0FBQyxDQUFDLENBQUM7SUFFSCxhQUFhLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDeEIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsSUFBSSxFQUFDLEVBQUU7WUFDcEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDO1lBRWpDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLHdEQUF3RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN0RixDQUFDO1lBRUQsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7Z0JBQ3ZELElBQUksQ0FBQztvQkFDSixRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JCLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixJQUFJLGVBQWUsTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLE9BQU8sMEJBQTBCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNuSixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLENBQUMsQ0FBQyxDQUFDO0lBTUgsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDO0lBRS9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FxQkc7SUFDSSxLQUFLLFVBQVUsVUFBVSxDQUFDLElBQTRCO1FBQzVELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVELDJFQUEyRTtRQUMzRSxrQ0FBa0M7UUFDbEMsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsZUFBZSxFQUFFLENBQUM7WUFDN0MsV0FBVyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsSUFBSSxPQUFPLHdCQUF3QixLQUFLLFdBQVcsRUFBRSxDQUFDO1lBQ3JELE9BQU8sQ0FBQyw0QkFBNEI7UUFDckMsQ0FBQztRQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUMxRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDckYsQ0FBQyJ9