/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/model", "vs/workbench/services/search/common/searchHelpers"], function (require, exports, assert, utils_1, range_1, model_1, searchHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SearchHelpers', () => {
        suite('editorMatchesToTextSearchResults', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            const mockTextModel = {
                getLineContent(lineNumber) {
                    return '' + lineNumber;
                }
            };
            function assertRangesEqual(actual, expected) {
                if (!Array.isArray(actual)) {
                    // All of these tests are for arrays...
                    throw new Error('Expected array of ranges');
                }
                assert.strictEqual(actual.length, expected.length);
                // These are sometimes Range, sometimes SearchRange
                actual.forEach((r, i) => {
                    const expectedRange = expected[i];
                    assert.deepStrictEqual({ startLineNumber: r.startLineNumber, startColumn: r.startColumn, endLineNumber: r.endLineNumber, endColumn: r.endColumn }, { startLineNumber: expectedRange.startLineNumber, startColumn: expectedRange.startColumn, endLineNumber: expectedRange.endLineNumber, endColumn: expectedRange.endColumn });
                });
            }
            test('simple', () => {
                const results = (0, searchHelpers_1.editorMatchesToTextSearchResults)([new model_1.FindMatch(new range_1.Range(6, 1, 6, 2), null)], mockTextModel);
                assert.strictEqual(results.length, 1);
                assert.strictEqual(results[0].preview.text, '6\n');
                assertRangesEqual(results[0].preview.matches, [new range_1.Range(0, 0, 0, 1)]);
                assertRangesEqual(results[0].ranges, [new range_1.Range(5, 0, 5, 1)]);
            });
            test('multiple', () => {
                const results = (0, searchHelpers_1.editorMatchesToTextSearchResults)([
                    new model_1.FindMatch(new range_1.Range(6, 1, 6, 2), null),
                    new model_1.FindMatch(new range_1.Range(6, 4, 8, 2), null),
                    new model_1.FindMatch(new range_1.Range(9, 1, 10, 3), null),
                ], mockTextModel);
                assert.strictEqual(results.length, 2);
                assertRangesEqual(results[0].preview.matches, [
                    new range_1.Range(0, 0, 0, 1),
                    new range_1.Range(0, 3, 2, 1),
                ]);
                assertRangesEqual(results[0].ranges, [
                    new range_1.Range(5, 0, 5, 1),
                    new range_1.Range(5, 3, 7, 1),
                ]);
                assert.strictEqual(results[0].preview.text, '6\n7\n8\n');
                assertRangesEqual(results[1].preview.matches, [
                    new range_1.Range(0, 0, 1, 2),
                ]);
                assertRangesEqual(results[1].ranges, [
                    new range_1.Range(8, 0, 9, 2),
                ]);
                assert.strictEqual(results[1].preview.text, '9\n10\n');
            });
        });
        suite('addContextToEditorMatches', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            const MOCK_LINE_COUNT = 100;
            const mockTextModel = {
                getLineContent(lineNumber) {
                    if (lineNumber < 1 || lineNumber > MOCK_LINE_COUNT) {
                        throw new Error(`invalid line count: ${lineNumber}`);
                    }
                    return '' + lineNumber;
                },
                getLineCount() {
                    return MOCK_LINE_COUNT;
                }
            };
            function getQuery(beforeContext, afterContext) {
                return {
                    folderQueries: [],
                    type: 2 /* QueryType.Text */,
                    contentPattern: { pattern: 'test' },
                    beforeContext,
                    afterContext
                };
            }
            test('no context', () => {
                const matches = [{
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(0, 0, 0, 10)
                    }];
                assert.deepStrictEqual((0, searchHelpers_1.getTextSearchMatchWithModelContext)(matches, mockTextModel, getQuery()), matches);
            });
            test('simple', () => {
                const matches = [{
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(1, 0, 1, 10)
                    }];
                assert.deepStrictEqual((0, searchHelpers_1.getTextSearchMatchWithModelContext)(matches, mockTextModel, getQuery(1, 2)), [
                    {
                        text: '1',
                        lineNumber: 1
                    },
                    ...matches,
                    {
                        text: '3',
                        lineNumber: 3
                    },
                    {
                        text: '4',
                        lineNumber: 4
                    },
                ]);
            });
            test('multiple matches next to each other', () => {
                const matches = [
                    {
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(1, 0, 1, 10)
                    },
                    {
                        preview: {
                            text: 'bar',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(2, 0, 2, 10)
                    }
                ];
                assert.deepStrictEqual((0, searchHelpers_1.getTextSearchMatchWithModelContext)(matches, mockTextModel, getQuery(1, 2)), [
                    {
                        text: '1',
                        lineNumber: 1
                    },
                    ...matches,
                    {
                        text: '4',
                        lineNumber: 4
                    },
                    {
                        text: '5',
                        lineNumber: 5
                    },
                ]);
            });
            test('boundaries', () => {
                const matches = [
                    {
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(0, 0, 0, 10)
                    },
                    {
                        preview: {
                            text: 'bar',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(MOCK_LINE_COUNT - 1, 0, MOCK_LINE_COUNT - 1, 10)
                    }
                ];
                assert.deepStrictEqual((0, searchHelpers_1.getTextSearchMatchWithModelContext)(matches, mockTextModel, getQuery(1, 2)), [
                    matches[0],
                    {
                        text: '2',
                        lineNumber: 2
                    },
                    {
                        text: '3',
                        lineNumber: 3
                    },
                    {
                        text: '' + (MOCK_LINE_COUNT - 1),
                        lineNumber: MOCK_LINE_COUNT - 1
                    },
                    matches[1]
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoSGVscGVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC90ZXN0L2NvbW1vbi9zZWFyY2hIZWxwZXJzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDM0IsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7WUFDMUMsTUFBTSxhQUFhLEdBQTJCO2dCQUM3QyxjQUFjLENBQUMsVUFBa0I7b0JBQ2hDLE9BQU8sRUFBRSxHQUFHLFVBQVUsQ0FBQztnQkFDeEIsQ0FBQzthQUNELENBQUM7WUFFRixTQUFTLGlCQUFpQixDQUFDLE1BQXFDLEVBQUUsUUFBd0I7Z0JBQ3pGLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQzVCLHVDQUF1QztvQkFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO2dCQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRW5ELG1EQUFtRDtnQkFDbkQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDdkIsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxNQUFNLENBQUMsZUFBZSxDQUNyQixFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLGFBQWEsRUFBRSxDQUFD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