/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/search/common/search"], function (require, exports, assert, utils_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('extractRangeFromFilter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('basics', async function () {
            assert.ok(!(0, search_1.extractRangeFromFilter)(''));
            assert.ok(!(0, search_1.extractRangeFromFilter)('/some/path'));
            assert.ok(!(0, search_1.extractRangeFromFilter)('/some/path/file.txt'));
            for (const lineSep of [':', '#', '(', ':line ']) {
                for (const colSep of [':', '#', ',']) {
                    const base = '/some/path/file.txt';
                    let res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20`);
                    assert.strictEqual(res?.filter, base);
                    assert.strictEqual(res?.range.startLineNumber, 20);
                    assert.strictEqual(res?.range.startColumn, 1);
                    res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20${colSep}`);
                    assert.strictEqual(res?.filter, base);
                    assert.strictEqual(res?.range.startLineNumber, 20);
                    assert.strictEqual(res?.range.startColumn, 1);
                    res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20${colSep}3`);
                    assert.strictEqual(res?.filter, base);
                    assert.strictEqual(res?.range.startLineNumber, 20);
                    assert.strictEqual(res?.range.startColumn, 3);
                }
            }
        });
        test('allow space after path', async function () {
            const res = (0, search_1.extractRangeFromFilter)('/some/path/file.txt (19,20)');
            assert.strictEqual(res?.filter, '/some/path/file.txt');
            assert.strictEqual(res?.range.startLineNumber, 19);
            assert.strictEqual(res?.range.startColumn, 20);
        });
        suite('unless', function () {
            const testSpecs = [
                // alpha-only symbol after unless
                { filter: '/some/path/file.txt@alphasymbol', unless: ['@'], result: undefined },
                // unless as first char
                { filter: '@/some/path/file.txt (19,20)', unless: ['@'], result: undefined },
                // unless as last char
                { filter: '/some/path/file.txt (19,20)@', unless: ['@'], result: undefined },
                // unless before ,
                {
                    filter: '/some/@path/file.txt (19,20)', unless: ['@'], result: {
                        filter: '/some/@path/file.txt',
                        range: {
                            endColumn: 20,
                            endLineNumber: 19,
                            startColumn: 20,
                            startLineNumber: 19
                        }
                    }
                },
                // unless before :
                {
                    filter: '/some/@path/file.txt:19:20', unless: ['@'], result: {
                        filter: '/some/@path/file.txt',
                        range: {
                            endColumn: 20,
                            endLineNumber: 19,
                            startColumn: 20,
                            startLineNumber: 19
                        }
                    }
                },
                // unless before #
                {
                    filter: '/some/@path/file.txt#19', unless: ['@'], result: {
                        filter: '/some/@path/file.txt',
                        range: {
                            endColumn: 1,
                            endLineNumber: 19,
                            startColumn: 1,
                            startLineNumber: 19
                        }
                    }
                },
            ];
            for (const { filter, unless, result } of testSpecs) {
                test(`${filter} - ${JSON.stringify(unless)}`, () => {
                    assert.deepStrictEqual((0, search_1.extractRangeFromFilter)(filter, unless), result);
                });
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdFJhbmdlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvdGVzdC9jb21tb24vZXh0cmFjdFJhbmdlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUVwQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLO1lBQ25CLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFBLCtCQUFzQixFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUEsK0JBQXNCLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBQSwrQkFBc0IsRUFBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFFMUQsS0FBSyxNQUFNLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pELEtBQUssTUFBTSxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3RDLE1BQU0sSUFBSSxHQUFHLHFCQUFxQixDQUFDO29CQUVuQyxJQUFJLEdBQUcsR0FBRyxJQUFBLCtCQUFzQixFQUFDLEdBQUcsSUFBSSxHQUFHLE9BQU8sSUFBSSxDQUFDLENBQUM7b0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FB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