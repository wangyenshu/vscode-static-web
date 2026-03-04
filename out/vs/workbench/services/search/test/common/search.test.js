define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/services/search/common/search"], function (require, exports, assert, utils_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextSearchResult', () => {
        const previewOptions1 = {
            matchLines: 1,
            charsPerLine: 100
        };
        function assertOneLinePreviewRangeText(text, result) {
            assert.strictEqual(result.preview.text.substring(result.preview.matches.startColumn, result.preview.matches.endColumn), text);
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('empty without preview options', () => {
            const range = new search_1.OneLineRange(5, 0, 0);
            const result = new search_1.TextSearchMatch('', range);
            assert.deepStrictEqual(result.ranges, range);
            assertOneLinePreviewRangeText('', result);
        });
        test('empty with preview options', () => {
            const range = new search_1.OneLineRange(5, 0, 0);
            const result = new search_1.TextSearchMatch('', range, previewOptions1);
            assert.deepStrictEqual(result.ranges, range);
            assertOneLinePreviewRangeText('', result);
        });
        test('short without preview options', () => {
            const range = new search_1.OneLineRange(5, 4, 7);
            const result = new search_1.TextSearchMatch('foo bar', range);
            assert.deepStrictEqual(result.ranges, range);
            assertOneLinePreviewRangeText('bar', result);
        });
        test('short with preview options', () => {
            const range = new search_1.OneLineRange(5, 4, 7);
            const result = new search_1.TextSearchMatch('foo bar', range, previewOptions1);
            assert.deepStrictEqual(result.ranges, range);
            assertOneLinePreviewRangeText('bar', result);
        });
        test('leading', () => {
            const range = new search_1.OneLineRange(5, 25, 28);
            const result = new search_1.TextSearchMatch('long text very long text foo', range, previewOptions1);
            assert.deepStrictEqual(result.ranges, range);
            assertOneLinePreviewRangeText('foo', result);
        });
        test('trailing', () => {
            const range = new search_1.OneLineRange(5, 0, 3);
            const result = new search_1.TextSearchMatch('foo long text very long text long text very long text long text very long text long text very long text long text very long text', range, previewOptions1);
            assert.deepStrictEqual(result.ranges, range);
            assertOneLinePreviewRangeText('foo', result);
        });
        test('middle', () => {
            const range = new search_1.OneLineRange(5, 30, 33);
            const result = new search_1.TextSearchMatch('long text very long text long foo text very long text long text very long text long text very long text long text very long text', range, previewOptions1);
            assert.deepStrictEqual(result.ranges, range);
            assertOneLinePreviewRangeText('foo', result);
        });
        test('truncating match', () => {
            const previewOptions = {
                matchLines: 1,
                charsPerLine: 1
            };
            const range = new search_1.OneLineRange(0, 4, 7);
            const result = new search_1.TextSearchMatch('foo bar', range, previewOptions);
            assert.deepStrictEqual(result.ranges, range);
            assertOneLinePreviewRangeText('b', result);
        });
        test('one line of multiline match', () => {
            const previewOptions = {
                matchLines: 1,
                charsPerLine: 10000
            };
            const range = new search_1.SearchRange(5, 4, 6, 3);
            const result = new search_1.TextSearchMatch('foo bar\nfoo bar', range, previewOptions);
            assert.deepStrictEqual(result.ranges, range);
            assert.strictEqual(result.preview.text, 'foo bar\nfoo bar');
            assert.strictEqual(result.preview.matches.startLineNumber, 0);
            assert.strictEqual(result.preview.matches.startColumn, 4);
            assert.strictEqual(result.preview.matches.endLineNumber, 1);
            assert.strictEqual(result.preview.matches.endColumn, 3);
        });
        test('compacts multiple ranges on long lines', () => {
            const previewOptions = {
                matchLines: 1,
                charsPerLine: 10
            };
            const range1 = new search_1.SearchRange(5, 4, 5, 7);
            const range2 = new search_1.SearchRange(5, 133, 5, 136);
            const range3 = new search_1.SearchRange(5, 141, 5, 144);
            const result = new search_1.TextSearchMatch('foo bar 123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890 foo bar baz bar', [range1, range2, range3], previewOptions);
            assert.deepStrictEqual(result.preview.matches, [new search_1.OneLineRange(0, 4, 7), new search_1.OneLineRange(0, 42, 45), new search_1.OneLineRange(0, 50, 53)]);
            assert.strictEqual(result.preview.text, 'foo bar 123456⟪ 117 characters skipped ⟫o bar baz bar');
        });
        test('trims lines endings', () => {
            const range = new search_1.SearchRange(5, 3, 5, 5);
            const previewOptions = {
                matchLines: 1,
                charsPerLine: 10000
            };
            assert.strictEqual(new search_1.TextSearchMatch('foo bar\n', range, previewOptions).preview.text, 'foo bar');
            assert.strictEqual(new search_1.TextSearchMatch('foo bar\r\n', range, previewOptions).preview.text, 'foo bar');
        });
        // test('all lines of multiline match', () => {
        // 	const previewOptions: ITextSearchPreviewOptions = {
        // 		matchLines: 5,
        // 		charsPerLine: 10000
        // 	};
        // 	const range = new SearchRange(5, 4, 6, 3);
        // 	const result = new TextSearchResult('foo bar\nfoo bar', range, previewOptions);
        // 	assert.deepStrictEqual(result.range, range);
        // 	assertPreviewRangeText('bar\nfoo', result);
        // });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL3Rlc3QvY29tbW9uL3NlYXJjaC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVFBLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFFOUIsTUFBTSxlQUFlLEdBQThCO1lBQ2xELFVBQVUsRUFBRSxDQUFDO1lBQ2IsWUFBWSxFQUFFLEdBQUc7U0FDakIsQ0FBQztRQUVGLFNBQVMsNkJBQTZCLENBQUMsSUFBWSxFQUFFLE1BQXVCO1lBQzNFLE1BQU0sQ0FBQyxXQUFXLENBQ2pCLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBZSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQVEsQ0FBQyxXQUFXLEVBQWdCLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBUSxDQUFDLFNBQVMsQ0FBQyxFQUNqSSxJQUFJLENBQUMsQ0FBQztRQUNSLENBQUM7UUFFRCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtZQUMxQyxNQUFNLEtBQUssR0FBRyxJQUFJLHFCQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLHdCQUFlLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3Qyw2QkFBNkIsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1lB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