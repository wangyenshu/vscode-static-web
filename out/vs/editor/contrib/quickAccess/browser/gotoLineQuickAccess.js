/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/contrib/quickAccess/browser/editorNavigationQuickAccess", "vs/nls"], function (require, exports, lifecycle_1, editorBrowser_1, editorNavigationQuickAccess_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractGotoLineQuickAccessProvider = void 0;
    class AbstractGotoLineQuickAccessProvider extends editorNavigationQuickAccess_1.AbstractEditorNavigationQuickAccessProvider {
        static { this.PREFIX = ':'; }
        constructor() {
            super({ canAcceptInBackground: true });
        }
        provideWithoutTextEditor(picker) {
            const label = (0, nls_1.localize)('cannotRunGotoLine', "Open a text editor first to go to a line.");
            picker.items = [{ label }];
            picker.ariaLabel = label;
            return lifecycle_1.Disposable.None;
        }
        provideWithTextEditor(context, picker, token) {
            const editor = context.editor;
            const disposables = new lifecycle_1.DisposableStore();
            // Goto line once picked
            disposables.add(picker.onDidAccept(event => {
                const [item] = picker.selectedItems;
                if (item) {
                    if (!this.isValidLineNumber(editor, item.lineNumber)) {
                        return;
                    }
                    this.gotoLocation(context, { range: this.toRange(item.lineNumber, item.column), keyMods: picker.keyMods, preserveFocus: event.inBackground });
                    if (!event.inBackground) {
                        picker.hide();
                    }
                }
            }));
            // React to picker changes
            const updatePickerAndEditor = () => {
                const position = this.parsePosition(editor, picker.value.trim().substr(AbstractGotoLineQuickAccessProvider.PREFIX.length));
                const label = this.getPickLabel(editor, position.lineNumber, position.column);
                // Picker
                picker.items = [{
                        lineNumber: position.lineNumber,
                        column: position.column,
                        label
                    }];
                // ARIA Label
                picker.ariaLabel = label;
                // Clear decorations for invalid range
                if (!this.isValidLineNumber(editor, position.lineNumber)) {
                    this.clearDecorations(editor);
                    return;
                }
                // Reveal
                const range = this.toRange(position.lineNumber, position.column);
                editor.revealRangeInCenter(range, 0 /* ScrollType.Smooth */);
                // Decorate
                this.addDecorations(editor, range);
            };
            updatePickerAndEditor();
            disposables.add(picker.onDidChangeValue(() => updatePickerAndEditor()));
            // Adjust line number visibility as needed
            const codeEditor = (0, editorBrowser_1.getCodeEditor)(editor);
            if (codeEditor) {
                const options = codeEditor.getOptions();
                const lineNumbers = options.get(68 /* EditorOption.lineNumbers */);
                if (lineNumbers.renderType === 2 /* RenderLineNumbersType.Relative */) {
                    codeEditor.updateOptions({ lineNumbers: 'on' });
                    disposables.add((0, lifecycle_1.toDisposable)(() => codeEditor.updateOptions({ lineNumbers: 'relative' })));
                }
            }
            return disposables;
        }
        toRange(lineNumber = 1, column = 1) {
            return {
                startLineNumber: lineNumber,
                startColumn: column,
                endLineNumber: lineNumber,
                endColumn: column
            };
        }
        parsePosition(editor, value) {
            // Support line-col formats of `line,col`, `line:col`, `line#col`
            const numbers = value.split(/,|:|#/).map(part => parseInt(part, 10)).filter(part => !isNaN(part));
            const endLine = this.lineCount(editor) + 1;
            return {
                lineNumber: numbers[0] > 0 ? numbers[0] : endLine + numbers[0],
                column: numbers[1]
            };
        }
        getPickLabel(editor, lineNumber, column) {
            // Location valid: indicate this as picker label
            if (this.isValidLineNumber(editor, lineNumber)) {
                if (this.isValidColumn(editor, lineNumber, column)) {
                    return (0, nls_1.localize)('gotoLineColumnLabel', "Go to line {0} and character {1}.", lineNumber, column);
                }
                return (0, nls_1.localize)('gotoLineLabel', "Go to line {0}.", lineNumber);
            }
            // Location invalid: show generic label
            const position = editor.getPosition() || { lineNumber: 1, column: 1 };
            const lineCount = this.lineCount(editor);
            if (lineCount > 1) {
                return (0, nls_1.localize)('gotoLineLabelEmptyWithLimit', "Current Line: {0}, Character: {1}. Type a line number between 1 and {2} to navigate to.", position.lineNumber, position.column, lineCount);
            }
            return (0, nls_1.localize)('gotoLineLabelEmpty', "Current Line: {0}, Character: {1}. Type a line number to navigate to.", position.lineNumber, position.column);
        }
        isValidLineNumber(editor, lineNumber) {
            if (!lineNumber || typeof lineNumber !== 'number') {
                return false;
            }
            return lineNumber > 0 && lineNumber <= this.lineCount(editor);
        }
        isValidColumn(editor, lineNumber, column) {
            if (!column || typeof column !== 'number') {
                return false;
            }
            const model = this.getModel(editor);
            if (!model) {
                return false;
            }
            const positionCandidate = { lineNumber, column };
            return model.validatePosition(positionCandidate).equals(positionCandidate);
        }
        lineCount(editor) {
            return this.getModel(editor)?.getLineCount() ?? 0;
        }
    }
    exports.AbstractGotoLineQuickAccessProvider = AbstractGotoLineQuickAccessProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290b0xpbmVRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3F1aWNrQWNjZXNzL2Jyb3dzZXIvZ290b0xpbmVRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBc0IsbUNBQW9DLFNBQVEseUVBQTJDO2lCQUVyRyxXQUFNLEdBQUcsR0FBRyxDQUFDO1FBRXBCO1lBQ0MsS0FBSyxDQUFDLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRVMsd0JBQXdCLENBQUMsTUFBMEM7WUFDNUUsTUFBTSxLQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztZQUV6RixNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBRXpCLE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUM7UUFDeEIsQ0FBQztRQUVTLHFCQUFxQixDQUFDLE9BQXNDLEVBQUUsTUFBMEMsRUFBRSxLQUF3QjtZQUMzSSxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzlCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLHdCQUF3QjtZQUN4QixXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO2dCQUNwQyxJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlC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