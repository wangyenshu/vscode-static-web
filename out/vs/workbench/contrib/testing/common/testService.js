/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/iterator", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/testing/common/testId"], function (require, exports, cancellation_1, iterator_1, instantiation_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testsUnderUri = exports.testsInFile = exports.expandAndGetTestById = exports.getContextForTestItem = exports.testCollectionIsEmpty = exports.ITestService = void 0;
    exports.ITestService = (0, instantiation_1.createDecorator)('testService');
    const testCollectionIsEmpty = (collection) => !iterator_1.Iterable.some(collection.rootItems, r => r.children.size > 0);
    exports.testCollectionIsEmpty = testCollectionIsEmpty;
    const getContextForTestItem = (collection, id) => {
        if (typeof id === 'string') {
            id = testId_1.TestId.fromString(id);
        }
        if (id.isRoot) {
            return { controller: id.toString() };
        }
        const context = { $mid: 16 /* MarshalledId.TestItemContext */, tests: [] };
        for (const i of id.idsFromRoot()) {
            if (!i.isRoot) {
                const test = collection.getNodeById(i.toString());
                if (test) {
                    context.tests.push(test);
                }
            }
        }
        return context;
    };
    exports.getContextForTestItem = getContextForTestItem;
    /**
     * Ensures the test with the given ID exists in the collection, if possible.
     * If cancellation is requested, or the test cannot be found, it will return
     * undefined.
     */
    const expandAndGetTestById = async (collection, id, ct = cancellation_1.CancellationToken.None) => {
        const idPath = [...testId_1.TestId.fromString(id).idsFromRoot()];
        let expandToLevel = 0;
        for (let i = idPath.length - 1; !ct.isCancellationRequested && i >= expandToLevel;) {
            const id = idPath[i].toString();
            const existing = collection.getNodeById(id);
            if (!existing) {
                i--;
                continue;
            }
            if (i === idPath.length - 1) {
                return existing;
            }
            // expand children only if it looks like it's necessary
            if (!existing.children.has(idPath[i + 1].toString())) {
                await collection.expand(id, 0);
            }
            expandToLevel = i + 1; // avoid an infinite loop if the test does not exist
            i = idPath.length - 1;
        }
        return undefined;
    };
    exports.expandAndGetTestById = expandAndGetTestById;
    /**
     * Waits for the test to no longer be in the "busy" state.
     */
    const waitForTestToBeIdle = (testService, test) => {
        if (!test.item.busy) {
            return;
        }
        return new Promise(resolve => {
            const l = testService.onDidProcessDiff(() => {
                if (testService.collection.getNodeById(test.item.extId)?.item.busy !== true) {
                    resolve(); // removed, or no longer busy
                    l.dispose();
                }
            });
        });
    };
    /**
     * Iterator that expands to and iterates through tests in the file. Iterates
     * in strictly descending order.
     */
    const testsInFile = async function* (testService, ident, uri, waitForIdle = true) {
        for (const test of testService.collection.all) {
            if (!test.item.uri) {
                continue;
            }
            if (ident.extUri.isEqual(uri, test.item.uri)) {
                yield test;
            }
            if (ident.extUri.isEqualOrParent(uri, test.item.uri)) {
                if (test.expand === 1 /* TestItemExpandState.Expandable */) {
                    await testService.collection.expand(test.item.extId, 1);
                }
                if (waitForIdle) {
                    await waitForTestToBeIdle(testService, test);
                }
            }
        }
    };
    exports.testsInFile = testsInFile;
    /**
     * Iterator that iterates to the top-level children of tests under the given
     * the URI.
     */
    const testsUnderUri = async function* (testService, ident, uri, waitForIdle = true) {
        const queue = [testService.collection.rootIds];
        while (queue.length) {
            for (const testId of queue.pop()) {
                const test = testService.collection.getNodeById(testId);
                // Expand tests with URIs that are parent of the item, add tests
                // that are within the URI. Don't add their children, since those
                // tests already encompass their children.
                if (!test) {
                    // no-op
                }
                else if (!test.item.uri) {
                    queue.push(test.children.values());
                    continue;
                }
                else if (ident.extUri.isEqualOrParent(uri, test.item.uri)) {
                    if (test.expand === 1 /* TestItemExpandState.Expandable */) {
                        await testService.collection.expand(test.item.extId, 1);
                    }
                    if (waitForIdle) {
                        await waitForTestToBeIdle(testService, test);
                    }
                    queue.push(test.children.values());
                }
                else if (ident.extUri.isEqualOrParent(test.item.uri, uri)) {
                    yield test;
                }
            }
        }
    };
    exports.testsUnderUri = testsUnderUri;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQm5GLFFBQUEsWUFBWSxHQUFHLElBQUEsK0JBQWUsRUFBZSxhQUFhLENBQUMsQ0FBQztJQThEbEUsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLFVBQXFDLEVBQUUsRUFBRSxDQUM5RSxDQUFDLG1CQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztJQURuRCxRQUFBLHFCQUFxQix5QkFDOEI7SUFFekQsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLFVBQXFDLEVBQUUsRUFBbUIsRUFBRSxFQUFFO1FBQ25HLElBQUksT0FBTyxFQUFFLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDNUIsRUFBRSxHQUFHLGVBQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2YsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQXFCLEVBQUUsSUFBSSx1Q0FBOEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDcEYsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNmLE1BQU0sSUFBSSxH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