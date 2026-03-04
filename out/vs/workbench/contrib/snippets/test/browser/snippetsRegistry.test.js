/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/snippets/browser/snippetsService", "vs/editor/common/core/position", "vs/base/test/common/utils"], function (require, exports, assert, snippetsService_1, position_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('getNonWhitespacePrefix', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertGetNonWhitespacePrefix(line, column, expected) {
            const model = {
                getLineContent: (lineNumber) => line
            };
            const actual = (0, snippetsService_1.getNonWhitespacePrefix)(model, new position_1.Position(1, column));
            assert.strictEqual(actual, expected);
        }
        test('empty line', () => {
            assertGetNonWhitespacePrefix('', 1, '');
        });
        test('singleWordLine', () => {
            assertGetNonWhitespacePrefix('something', 1, '');
            assertGetNonWhitespacePrefix('something', 2, 's');
            assertGetNonWhitespacePrefix('something', 3, 'so');
            assertGetNonWhitespacePrefix('something', 4, 'som');
            assertGetNonWhitespacePrefix('something', 5, 'some');
            assertGetNonWhitespacePrefix('something', 6, 'somet');
            assertGetNonWhitespacePrefix('something', 7, 'someth');
            assertGetNonWhitespacePrefix('something', 8, 'somethi');
            assertGetNonWhitespacePrefix('something', 9, 'somethin');
            assertGetNonWhitespacePrefix('something', 10, 'something');
        });
        test('two word line', () => {
            assertGetNonWhitespacePrefix('something interesting', 1, '');
            assertGetNonWhitespacePrefix('something interesting', 2, 's');
            assertGetNonWhitespacePrefix('something interesting', 3, 'so');
            assertGetNonWhitespacePrefix('something interesting', 4, 'som');
            assertGetNonWhitespacePrefix('something interesting', 5, 'some');
            assertGetNonWhitespacePrefix('something interesting', 6, 'somet');
            assertGetNonWhitespacePrefix('something interesting', 7, 'someth');
            assertGetNonWhitespacePrefix('something interesting', 8, 'somethi');
            assertGetNonWhitespacePrefix('something interesting', 9, 'somethin');
            assertGetNonWhitespacePrefix('something interesting', 10, 'something');
            assertGetNonWhitespacePrefix('something interesting', 11, '');
            assertGetNonWhitespacePrefix('something interesting', 12, 'i');
            assertGetNonWhitespacePrefix('something interesting', 13, 'in');
            assertGetNonWhitespacePrefix('something interesting', 14, 'int');
            assertGetNonWhitespacePrefix('something interesting', 15, 'inte');
            assertGetNonWhitespacePrefix('something interesting', 16, 'inter');
            assertGetNonWhitespacePrefix('something interesting', 17, 'intere');
            assertGetNonWhitespacePrefix('something interesting', 18, 'interes');
            assertGetNonWhitespacePrefix('something interesting', 19, 'interest');
            assertGetNonWhitespacePrefix('something interesting', 20, 'interesti');
            assertGetNonWhitespacePrefix('something interesting', 21, 'interestin');
            assertGetNonWhitespacePrefix('something interesting', 22, 'interesting');
        });
        test('many separators', () => {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions?redirectlocale=en-US&redirectslug=JavaScript%2FGuide%2FRegular_Expressions#special-white-space
            // \s matches a single white space character, including space, tab, form feed, line feed.
            // Equivalent to [ \f\n\r\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff].
            assertGetNonWhitespacePrefix('something interesting', 22, 'interesting');
            assertGetNonWhitespacePrefix('something\tinteresting', 22, 'interesting');
            assertGetNonWhitespacePrefix('something\finteresting', 22, 'interesting');
            assertGetNonWhitespacePrefix('something\vinteresting', 22, 'interesting');
            assertGetNonWhitespacePrefix('something\u00a0interesting', 22, 'interesting');
            assertGetNonWhitespacePrefix('something\u2000interesting', 22, 'interesting');
            assertGetNonWhitespacePrefix('something\u2028interesting', 22, 'interesting');
            assertGetNonWhitespacePrefix('something\u3000interesting', 22, 'interesting');
            assertGetNonWhitespacePrefix('something\ufeffinteresting', 22, 'interesting');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNSZWdpc3RyeS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc25pcHBldHMvdGVzdC9icm93c2VyL3NuaXBwZXRzUmVnaXN0cnkudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBRXBDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLDRCQUE0QixDQUFDLElBQVksRUFBRSxNQUFjLEVBQUUsUUFBZ0I7WUFDbkYsTUFBTSxLQUFLLEdBQUc7Z0JBQ2IsY0FBYyxFQUFFLENBQUMsVUFBa0IsRUFBRSxFQUFFLENBQUMsSUFBSTthQUM1QyxDQUFDO1lBQ0YsTUFBTSxNQUFNLEdBQUcsSUFBQSx3Q0FBc0IsRUFBQyxLQUFLLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxJQUFJLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUN2Qiw0QkFBNEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMzQiw0QkFBNEIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELDRCQUE0QixDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbEQsNEJBQTRCLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZ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LENBQUMsd0JBQXdCLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzFFLDRCQUE0QixDQUFDLHdCQUF3QixFQUFFLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUMxRSw0QkFBNEIsQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDMUUsNEJBQTRCLENBQUMsNEJBQTRCLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzlFLDRCQUE0QixDQUFDLDRCQUE0QixFQUFFLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUM5RSw0QkFBNEIsQ0FBQyw0QkFBNEIsRUFBRSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDOUUsNEJBQTRCLENBQUMsNEJBQTRCLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzlFLDRCQUE0QixDQUFDLDRCQUE0QixFQUFFLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUUvRSxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=