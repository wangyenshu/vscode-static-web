/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, lifecycle_1, path_1, platform_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toResource = toResource;
    exports.suiteRepeat = suiteRepeat;
    exports.testRepeat = testRepeat;
    exports.assertThrowsAsync = assertThrowsAsync;
    exports.ensureNoDisposablesAreLeakedInTestSuite = ensureNoDisposablesAreLeakedInTestSuite;
    exports.throwIfDisposablesAreLeaked = throwIfDisposablesAreLeaked;
    exports.throwIfDisposablesAreLeakedAsync = throwIfDisposablesAreLeakedAsync;
    function toResource(path) {
        if (platform_1.isWindows) {
            return uri_1.URI.file((0, path_1.join)('C:\\', btoa(this.test.fullTitle()), path));
        }
        return uri_1.URI.file((0, path_1.join)('/', btoa(this.test.fullTitle()), path));
    }
    function suiteRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            suite(`${description} (iteration ${i})`, callback);
        }
    }
    function testRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            test(`${description} (iteration ${i})`, callback);
        }
    }
    async function assertThrowsAsync(block, message = 'Missing expected exception') {
        try {
            await block();
        }
        catch {
            return;
        }
        const err = message instanceof Error ? message : new Error(message);
        throw err;
    }
    /**
     * Use this function to ensure that all disposables are cleaned up at the end of each test in the current suite.
     *
     * Use `markAsSingleton` if disposable singletons are created lazily that are allowed to outlive the test.
     * Make sure that the singleton properly registers all child disposables so that they are excluded too.
     *
     * @returns A {@link DisposableStore} that can optionally be used to track disposables in the test.
     * This will be automatically disposed on test teardown.
    */
    function ensureNoDisposablesAreLeakedInTestSuite() {
        let tracker;
        let store;
        setup(() => {
            store = new lifecycle_1.DisposableStore();
            tracker = new lifecycle_1.DisposableTracker();
            (0, lifecycle_1.setDisposableTracker)(tracker);
        });
        teardown(function () {
            store.dispose();
            (0, lifecycle_1.setDisposableTracker)(null);
            if (this.currentTest?.state !== 'failed') {
                const result = tracker.computeLeakingDisposables();
                if (result) {
                    console.error(result.details);
                    throw new Error(`There are ${result.leaks.length} undisposed disposables!${result.details}`);
                }
            }
        });
        // Wrap store as the suite function is called before it's initialized
        const testContext = {
            add(o) {
                return store.add(o);
            }
        };
        return testContext;
    }
    function throwIfDisposablesAreLeaked(body, logToConsole = true) {
        const tracker = new lifecycle_1.DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(tracker);
        body();
        (0, lifecycle_1.setDisposableTracker)(null);
        computeLeakingDisposables(tracker, logToConsole);
    }
    async function throwIfDisposablesAreLeakedAsync(body) {
        const tracker = new lifecycle_1.DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(tracker);
        await body();
        (0, lifecycle_1.setDisposableTracker)(null);
        computeLeakingDisposables(tracker);
    }
    function computeLeakingDisposables(tracker, logToConsole = true) {
        const result = tracker.computeLeakingDisposables();
        if (result) {
            if (logToConsole) {
                console.error(result.details);
            }
            throw new Error(`There are ${result.leaks.length} undisposed disposables!${result.details}`);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLGdDQU1DO0lBRUQsa0NBSUM7SUFFRCxnQ0FJQztJQUVELDhDQVNDO0lBV0QsMEZBNEJDO0lBRUQsa0VBTUM7SUFFRCw0RUFNQztJQXBGRCxTQUFnQixVQUFVLENBQVksSUFBWTtRQUNqRCxJQUFJLG9CQUFTLEVBQUUsQ0FBQztZQUNmLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsU0FBZ0IsV0FBVyxDQUFDLENBQVMsRUFBRSxXQUFtQixFQUFFLFFBQTZCO1FBQ3hGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM1QixLQUFLLENBQUMsR0FBRyxXQUFXLGVBQWUsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEQsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixVQUFVLENBQUMsQ0FBUyxFQUFFLFdBQW1CLEVBQUUsUUFBNEI7UUFDdEYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMs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