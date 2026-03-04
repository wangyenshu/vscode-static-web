/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, errors_1, lifecycle_1, observable_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColumnRange = void 0;
    exports.getReadonlyEmptyArray = getReadonlyEmptyArray;
    exports.applyObservableDecorations = applyObservableDecorations;
    exports.addPositions = addPositions;
    exports.subtractPositions = subtractPositions;
    const array = [];
    function getReadonlyEmptyArray() {
        return array;
    }
    class ColumnRange {
        constructor(startColumn, endColumnExclusive) {
            this.startColumn = startColumn;
            this.endColumnExclusive = endColumnExclusive;
            if (startColumn > endColumnExclusive) {
                throw new errors_1.BugIndicatingError(`startColumn ${startColumn} cannot be after endColumnExclusive ${endColumnExclusive}`);
            }
        }
        toRange(lineNumber) {
            return new range_1.Range(lineNumber, this.startColumn, lineNumber, this.endColumnExclusive);
        }
        equals(other) {
            return this.startColumn === other.startColumn
                && this.endColumnExclusive === other.endColumnExclusive;
        }
    }
    exports.ColumnRange = ColumnRange;
    function applyObservableDecorations(editor, decorations) {
        const d = new lifecycle_1.DisposableStore();
        const decorationsCollection = editor.createDecorationsCollection();
        d.add((0, observable_1.autorunOpts)({ debugName: () => `Apply decorations from ${decorations.debugName}` }, reader => {
            const d = decorations.read(reader);
            decorationsCollection.set(d);
        }));
        d.add({
            dispose: () => {
                decorationsCollection.clear();
            }
        });
        return d;
    }
    function addPositions(pos1, pos2) {
        return new position_1.Position(pos1.lineNumber + pos2.lineNumber - 1, pos2.lineNumber === 1 ? pos1.column + pos2.column - 1 : pos2.column);
    }
    function subtractPositions(pos1, pos2) {
        return new position_1.Position(pos1.lineNumber - pos2.lineNumber + 1, pos1.lineNumber - pos2.lineNumber === 0 ? pos1.column - pos2.column + 1 : pos1.column);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy9icm93c2VyL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxzREFFQztJQXNCRCxnRUFhQztJQUVELG9DQUVDO0lBRUQsOENBRUM7SUE5Q0QsTUFBTSxLQUFLLEdBQXVCLEVBQUUsQ0FBQztJQUNyQyxTQUFnQixxQkFBcUI7UUFDcEMsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBYSxXQUFXO1FBQ3ZCLFlBQ2lCLFdBQW1CLEVBQ25CLGtCQUEwQjtZQUQxQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQVE7WUFFMUMsSUFBSSxXQUFXLEdBQUcsa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxJQUFJLDJCQUFrQixDQUFDLGVBQWUsV0FBVyx1Q0FBdUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBQ3JILENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxDQUFDLFVBQWtCO1lBQ3pCLE9BQU8sSUFBSSxhQUFLLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBa0I7WUFDeEIsT0FBTyxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssQ0FBQyxXQUFXO21CQUN6QyxJQUFJLENBQUMsa0JBQWtCLEtBQUssS0FBSyxDQUFDLGtCQUFrQixDQUFDO1FBQzFELENBQUM7S0FDRDtJQWxCRCxrQ0FrQkM7SUFFRCxTQUFnQiwwQkFBMEIsQ0FBQyxNQUFtQixFQUFFLFdBQWlEO1FBQ2hILE1BQU0sQ0FBQyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQ2hDLE1BQU0scUJBQXFCLEdBQUcsTUFBTSxDQUFDLDJCQUEyQixFQUFFLENBQUM7UUFDbkUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFXLEVBQUMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsMEJBQTBCLFdBQVcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ2xHLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ0wsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDYixxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMvQixDQUFDO1NBQ0QsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQsU0FBZ0IsWUFBWSxDQUFDLElBQWMsRUFBRSxJQUFjO1FBQzFELE9BQU8sSUFBSSxtQkFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqSSxDQUFDO0lBRUQsU0FBZ0IsaUJBQWlCLENBQUMsSUFBYyxFQUFFLElBQWM7UUFDL0QsT0FBTyxJQUFJLG1CQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkosQ0FBQyJ9