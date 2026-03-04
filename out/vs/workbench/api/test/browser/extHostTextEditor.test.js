define(["require", "exports", "assert", "vs/base/common/lazy", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/common/config/editorOptions", "vs/platform/log/common/log", "vs/workbench/api/common/extHostDocumentData", "vs/workbench/api/common/extHostTextEditor", "vs/workbench/api/common/extHostTypes"], function (require, exports, assert, lazy_1, uri_1, mock_1, utils_1, editorOptions_1, log_1, extHostDocumentData_1, extHostTextEditor_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostTextEditor', () => {
        let editor;
        const doc = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
            'aaaa bbbb+cccc abc'
        ], '\n', 1, 'text', false);
        setup(() => {
            editor = new extHostTextEditor_1.ExtHostTextEditor('fake', null, new log_1.NullLogService(), new lazy_1.Lazy(() => doc.document), [], { cursorStyle: editorOptions_1.TextEditorCursorStyle.Line, insertSpaces: true, lineNumbers: 1, tabSize: 4, indentSize: 4, originalIndentSize: 'tabSize' }, [], 1);
        });
        test('disposed editor', () => {
            assert.ok(editor.value.document);
            editor._acceptViewColumn(3);
            assert.strictEqual(3, editor.value.viewColumn);
            editor.dispose();
            assert.throws(() => editor._acceptViewColumn(2));
            assert.strictEqual(3, editor.value.viewColumn);
            assert.ok(editor.value.document);
            assert.throws(() => editor._acceptOptions(null));
            assert.throws(() => editor._acceptSelections([]));
        });
        test('API [bug]: registerTextEditorCommand clears redo stack even if no edits are made #55163', async function () {
            let applyCount = 0;
            const editor = new extHostTextEditor_1.ExtHostTextEditor('edt1', new class extends (0, mock_1.mock)() {
                $tryApplyEdits() {
                    applyCount += 1;
                    return Promise.resolve(true);
                }
            }, new log_1.NullLogService(), new lazy_1.Lazy(() => doc.document), [], { cursorStyle: editorOptions_1.TextEditorCursorStyle.Line, insertSpaces: true, lineNumbers: 1, tabSize: 4, indentSize: 4, originalIndentSize: 'tabSize' }, [], 1);
            await editor.value.edit(edit => { });
            assert.strictEqual(applyCount, 0);
            await editor.value.edit(edit => { edit.setEndOfLine(1); });
            assert.strictEqual(applyCount, 1);
            await editor.value.edit(edit => { edit.delete(new extHostTypes_1.Range(0, 0, 1, 1)); });
            assert.strictEqual(applyCount, 2);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    suite('ExtHostTextEditorOptions', () => {
        let opts;
        let calls = [];
        setup(() => {
            calls = [];
            const mockProxy = {
                dispose: undefined,
                $trySetOptions: (id, options) => {
                    assert.strictEqual(id, '1');
                    calls.push(options);
                    return Promise.resolve(undefined);
                },
                $tryShowTextDocument: undefined,
                $registerTextEditorDecorationType: undefined,
                $removeTextEditorDecorationType: undefined,
                $tryShowEditor: undefined,
                $tryHideEditor: undefined,
                $trySetDecorations: undefined,
                $trySetDecorationsFast: undefined,
                $tryRevealRange: undefined,
                $trySetSelections: undefined,
                $tryApplyEdits: undefined,
                $tryInsertSnippet: undefined,
                $getDiffInformation: undefined
            };
            opts = new extHostTextEditor_1.ExtHostTextEditorOptions(mockProxy, '1', {
                tabSize: 4,
                indentSize: 4,
                originalIndentSize: 'tabSize',
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            }, new log_1.NullLogService());
        });
        teardown(() => {
            opts = null;
            calls = null;
        });
        function assertState(opts, expected) {
            const actual = {
                tabSize: opts.value.tabSize,
                indentSize: opts.value.indentSize,
                insertSpaces: opts.value.insertSpaces,
                cursorStyle: opts.value.cursorStyle,
                lineNumbers: opts.value.lineNumbers
            };
            assert.deepStrictEqual(actual, expected);
        }
        test('can set tabSize to the same value', () => {
            opts.value.tabSize = 4;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('can change tabSize to positive integer', () => {
            opts.value.tabSize = 1;
            assertState(opts, {
                tabSize: 1,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ tabSize: 1 }]);
        });
        test('can change tabSize to positive float', () => {
            opts.value.tabSize = 2.3;
            assertState(opts, {
                tabSize: 2,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ tabSize: 2 }]);
        });
        test('can change tabSize to a string number', () => {
            opts.value.tabSize = '2';
            assertState(opts, {
                tabSize: 2,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ tabSize: 2 }]);
        });
        test('tabSize can request indentation detection', () => {
            opts.value.tabSize = 'auto';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ tabSize: 'auto' }]);
        });
        test('ignores invalid tabSize 1', () => {
            opts.value.tabSize = null;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('ignores invalid tabSize 2', () => {
            opts.value.tabSize = -5;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('ignores invalid tabSize 3', () => {
            opts.value.tabSize = 'hello';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('ignores invalid tabSize 4', () => {
            opts.value.tabSize = '-17';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('can set indentSize to the same value', () => {
            opts.value.indentSize = 4;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ indentSize: 4 }]);
        });
        test('can change indentSize to positive integer', () => {
            opts.value.indentSize = 1;
            assertState(opts, {
                tabSize: 4,
                indentSize: 1,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ indentSize: 1 }]);
        });
        test('can change indentSize to positive float', () => {
            opts.value.indentSize = 2.3;
            assertState(opts, {
                tabSize: 4,
                indentSize: 2,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ indentSize: 2 }]);
        });
        test('can change indentSize to a string number', () => {
            opts.value.indentSize = '2';
            assertState(opts, {
                tabSize: 4,
                indentSize: 2,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ indentSize: 2 }]);
        });
        test('indentSize can request to use tabSize', () => {
            opts.value.indentSize = 'tabSize';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ indentSize: 'tabSize' }]);
        });
        test('indentSize cannot request indentation detection', () => {
            opts.value.indentSize = 'auto';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('ignores invalid indentSize 1', () => {
            opts.value.indentSize = null;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('ignores invalid indentSize 2', () => {
            opts.value.indentSize = -5;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('ignores invalid indentSize 3', () => {
            opts.value.indentSize = 'hello';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('ignores invalid indentSize 4', () => {
            opts.value.indentSize = '-17';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('can set insertSpaces to the same value', () => {
            opts.value.insertSpaces = false;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('can set insertSpaces to boolean', () => {
            opts.value.insertSpaces = true;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ insertSpaces: true }]);
        });
        test('can set insertSpaces to false string', () => {
            opts.value.insertSpaces = 'false';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('can set insertSpaces to truey', () => {
            opts.value.insertSpaces = 'hello';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ insertSpaces: true }]);
        });
        test('insertSpaces can request indentation detection', () => {
            opts.value.insertSpaces = 'auto';
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ insertSpaces: 'auto' }]);
        });
        test('can set cursorStyle to same value', () => {
            opts.value.cursorStyle = editorOptions_1.TextEditorCursorStyle.Line;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('can change cursorStyle', () => {
            opts.value.cursorStyle = editorOptions_1.TextEditorCursorStyle.Block;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Block,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ cursorStyle: editorOptions_1.TextEditorCursorStyle.Block }]);
        });
        test('can set lineNumbers to same value', () => {
            opts.value.lineNumbers = extHostTypes_1.TextEditorLineNumbersStyle.On;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, []);
        });
        test('can change lineNumbers', () => {
            opts.value.lineNumbers = extHostTypes_1.TextEditorLineNumbersStyle.Off;
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 0 /* RenderLineNumbersType.Off */
            });
            assert.deepStrictEqual(calls, [{ lineNumbers: 0 /* RenderLineNumbersType.Off */ }]);
        });
        test('can do bulk updates 0', () => {
            opts.assign({
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: extHostTypes_1.TextEditorLineNumbersStyle.On
            });
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ indentSize: 4 }]);
        });
        test('can do bulk updates 1', () => {
            opts.assign({
                tabSize: 'auto',
                insertSpaces: true
            });
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ tabSize: 'auto', insertSpaces: true }]);
        });
        test('can do bulk updates 2', () => {
            opts.assign({
                tabSize: 3,
                insertSpaces: 'auto'
            });
            assertState(opts, {
                tabSize: 3,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Line,
                lineNumbers: 1 /* RenderLineNumbersType.On */
            });
            assert.deepStrictEqual(calls, [{ tabSize: 3, insertSpaces: 'auto' }]);
        });
        test('can do bulk updates 3', () => {
            opts.assign({
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Block,
                lineNumbers: extHostTypes_1.TextEditorLineNumbersStyle.Relative
            });
            assertState(opts, {
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                cursorStyle: editorOptions_1.TextEditorCursorStyle.Block,
                lineNumbers: 2 /* RenderLineNumbersType.Relative */
            });
            assert.deepStrictEqual(calls, [{ cursorStyle: editorOptions_1.TextEditorCursorStyle.Block, lineNumbers: 2 /* RenderLineNumbersType.Relative */ }]);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRleHRFZGl0b3IudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3RUZXh0RWRpdG9yLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBZ0JBLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFFL0IsSUFBSSxNQUF5QixDQUFDO1FBQzlCLE1BQU0sR0FBRyxHQUFHLElBQUkseUNBQW1CLENBQUMsU0FBVSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDN0Qsb0JBQW9CO1NBQ3BCLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFM0IsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE1BQU0sR0FBRyxJQUFJLHFDQUFpQixDQUFDLE1BQU0sRUFBRSxJQUFLLEVBQUUsSUFBSSxvQkFBYyxFQUFFLEVBQUUsSUFBSSxXQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxxQ0FBcUIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDelAsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1lBRTVCLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMs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