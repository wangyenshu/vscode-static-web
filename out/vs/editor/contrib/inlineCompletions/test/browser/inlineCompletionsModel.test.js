define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsModel", "vs/editor/common/core/textEdit", "vs/editor/test/common/testTextModel", "vs/editor/common/core/range", "vs/base/test/common/utils"], function (require, exports, assert, position_1, inlineCompletionsModel_1, textEdit_1, testTextModel_1, range_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('inlineCompletionModel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getSecondaryEdits - basic', async function () {
            const textModel = (0, testTextModel_1.createTextModel)([
                'function fib(',
                'function fib('
            ].join('\n'));
            const positions = [
                new position_1.Position(1, 14),
                new position_1.Position(2, 14)
            ];
            const primaryEdit = new textEdit_1.SingleTextEdit(new range_1.Range(1, 1, 1, 14), 'function fib() {');
            const secondaryEdits = (0, inlineCompletionsModel_1.getSecondaryEdits)(textModel, positions, primaryEdit);
            assert.deepStrictEqual(secondaryEdits, [new textEdit_1.SingleTextEdit(new range_1.Range(2, 14, 2, 14), ') {')]);
            textModel.dispose();
        });
        test('getSecondaryEdits - cursor not on same line as primary edit 1', async function () {
            const textModel = (0, testTextModel_1.createTextModel)([
                'function fib(',
                '',
                'function fib(',
                ''
            ].join('\n'));
            const positions = [
                new position_1.Position(2, 1),
                new position_1.Position(4, 1)
            ];
            const primaryEdit = new textEdit_1.SingleTextEdit(new range_1.Range(1, 1, 2, 1), [
                'function fib() {',
                '	return 0;',
                '}'
            ].join('\n'));
            const secondaryEdits = (0, inlineCompletionsModel_1.getSecondaryEdits)(textModel, positions, primaryEdit);
            assert.deepStrictEqual(secondaryEdits, [new textEdit_1.SingleTextEdit(new range_1.Range(4, 1, 4, 1), [
                    '	return 0;',
                    '}'
                ].join('\n'))]);
            textModel.dispose();
        });
        test('getSecondaryEdits - cursor not on same line as primary edit 2', async function () {
            const textModel = (0, testTextModel_1.createTextModel)([
                'class A {',
                '',
                'class B {',
                '',
                'function f() {}'
            ].join('\n'));
            const positions = [
                new position_1.Position(2, 1),
                new position_1.Position(4, 1)
            ];
            const primaryEdit = new textEdit_1.SingleTextEdit(new range_1.Range(1, 1, 2, 1), [
                'class A {',
                '	public x: number = 0;',
                '   public y: number = 0;',
                '}'
            ].join('\n'));
            const secondaryEdits = (0, inlineCompletionsModel_1.getSecondaryEdits)(textModel, positions, primaryEdit);
            assert.deepStrictEqual(secondaryEdits, [new textEdit_1.SingleTextEdit(new range_1.Range(4, 1, 4, 1), [
                    '	public x: number = 0;',
                    '   public y: number = 0;',
                    '}'
                ].join('\n'))]);
            textModel.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lQ29tcGxldGlvbnMvdGVzdC9icm93c2VyL2lubGluZUNvbXBsZXRpb25zTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFZQSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsS0FBSztZQUV0QyxNQUFNLFNBQVMsR0FBRyxJQUFBLCtCQUFlLEVBQUM7Z0JBQ2pDLGVBQWU7Z0JBQ2YsZUFBZTthQUNmLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDZCxNQUFNLFNBQVMsR0FBRztnQkFDakIsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ25CLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ25CLENBQUM7WUFDRixNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUFjLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUNuRixNQUFNLGNBQWMsR0FBRyxJQUFBLDBDQUFpQixFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDNUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLHlCQUFjLENBQ3pELElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUN2QixLQUFLLENBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSixT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