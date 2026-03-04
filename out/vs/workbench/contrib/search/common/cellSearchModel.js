/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/common/model/textModelSearch"], function (require, exports, lifecycle_1, range_1, pieceTreeTextBufferBuilder_1, textModelSearch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellSearchModel = void 0;
    class CellSearchModel extends lifecycle_1.Disposable {
        constructor(_source, _inputTextBuffer, _outputs) {
            super();
            this._source = _source;
            this._inputTextBuffer = _inputTextBuffer;
            this._outputs = _outputs;
            this._outputTextBuffers = undefined;
        }
        _getFullModelRange(buffer) {
            const lineCount = buffer.getLineCount();
            return new range_1.Range(1, 1, lineCount, this._getLineMaxColumn(buffer, lineCount));
        }
        _getLineMaxColumn(buffer, lineNumber) {
            if (lineNumber < 1 || lineNumber > buffer.getLineCount()) {
                throw new Error('Illegal value for lineNumber');
            }
            return buffer.getLineLength(lineNumber) + 1;
        }
        get inputTextBuffer() {
            if (!this._inputTextBuffer) {
                const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
                builder.acceptChunk(this._source);
                const bufferFactory = builder.finish(true);
                const { textBuffer, disposable } = bufferFactory.create(1 /* DefaultEndOfLine.LF */);
                this._inputTextBuffer = textBuffer;
                this._register(disposable);
            }
            return this._inputTextBuffer;
        }
        get outputTextBuffers() {
            if (!this._outputTextBuffers) {
                this._outputTextBuffers = this._outputs.map((output) => {
                    const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
                    builder.acceptChunk(output);
                    const bufferFactory = builder.finish(true);
                    const { textBuffer, disposable } = bufferFactory.create(1 /* DefaultEndOfLine.LF */);
                    this._register(disposable);
                    return textBuffer;
                });
            }
            return this._outputTextBuffers;
        }
        findInInputs(target) {
            const searchParams = new textModelSearch_1.SearchParams(target, false, false, null);
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return [];
            }
            const fullInputRange = this._getFullModelRange(this.inputTextBuffer);
            return this.inputTextBuffer.findMatchesLineByLine(fullInputRange, searchData, true, 5000);
        }
        findInOutputs(target) {
            const searchParams = new textModelSearch_1.SearchParams(target, false, false, null);
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return [];
            }
            return this.outputTextBuffers.map(buffer => {
                const matches = buffer.findMatchesLineByLine(this._getFullModelRange(buffer), searchData, true, 5000);
                if (matches.length === 0) {
                    return undefined;
                }
                return {
                    textBuffer: buffer,
                    matches
                };
            }).filter((item) => !!item);
        }
    }
    exports.CellSearchModel = CellSearchModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFNlYXJjaE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2NvbW1vbi9jZWxsU2VhcmNoTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEsZUFBZ0IsU0FBUSxzQkFBVTtRQUU5QyxZQUFxQixPQUFlLEVBQVUsZ0JBQWlELEVBQVUsUUFBa0I7WUFDMUgsS0FBSyxFQUFFLENBQUM7WUFEWSxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQVUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQztZQUFVLGFBQVEsR0FBUixRQUFRLENBQVU7WUFEbkgsdUJBQWtCLEdBQXNDLFNBQVMsQ0FBQztRQUcxRSxDQUFDO1FBRU8sa0JBQWtCLENBQUMsTUFBMkI7WUFDckQsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3hDLE9BQU8sSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxNQUEyQixFQUFFLFVBQWtCO1lBQ3hFLElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQzFELE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsSUFBSSxlQUFlO1lBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVB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