/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, errors_1, extHostConverter, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookEditor = void 0;
    class ExtHostNotebookEditor {
        static { this.apiEditorsToExtHost = new WeakMap(); }
        constructor(id, _proxy, notebookData, visibleRanges, selections, viewColumn) {
            this.id = id;
            this._proxy = _proxy;
            this.notebookData = notebookData;
            this._selections = [];
            this._visibleRanges = [];
            this._visible = false;
            this._selections = selections;
            this._visibleRanges = visibleRanges;
            this._viewColumn = viewColumn;
        }
        get apiEditor() {
            if (!this._editor) {
                const that = this;
                this._editor = {
                    get notebook() {
                        return that.notebookData.apiNotebook;
                    },
                    get selection() {
                        return that._selections[0];
                    },
                    set selection(selection) {
                        this.selections = [selection];
                    },
                    get selections() {
                        return that._selections;
                    },
                    set selections(value) {
                        if (!Array.isArray(value) || !value.every(extHostTypes.NotebookRange.isNotebookRange)) {
                            throw (0, errors_1.illegalArgument)('selections');
                        }
                        that._selections = value;
                        that._trySetSelections(value);
                    },
                    get visibleRanges() {
                        return that._visibleRanges;
                    },
                    revealRange(range, revealType) {
                        that._proxy.$tryRevealRange(that.id, extHostConverter.NotebookRange.from(range), revealType ?? extHostTypes.NotebookEditorRevealType.Default);
                    },
                    get viewColumn() {
                        return that._viewColumn;
                    },
                };
                ExtHostNotebookEditor.apiEditorsToExtHost.set(this._editor, this);
            }
            return this._editor;
        }
        get visible() {
            return this._visible;
        }
        _acceptVisibility(value) {
            this._visible = value;
        }
        _acceptVisibleRanges(value) {
            this._visibleRanges = value;
        }
        _acceptSelections(selections) {
            this._selections = selections;
        }
        _trySetSelections(value) {
            this._proxy.$trySetSelections(this.id, value.map(extHostConverter.NotebookRange.from));
        }
        _acceptViewColumn(value) {
            this._viewColumn = value;
        }
    }
    exports.ExtHostNotebookEditor = ExtHostNotebookEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdE5vdGVib29rRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLHFCQUFxQjtpQkFFVix3QkFBbUIsR0FBRyxJQUFJLE9BQU8sRUFBZ0QsQUFBOUQsQ0FBK0Q7UUFVekcsWUFDVSxFQUFVLEVBQ0YsTUFBc0MsRUFDOUMsWUFBcUMsRUFDOUMsYUFBcUMsRUFDckMsVUFBa0MsRUFDbEMsVUFBeUM7WUFMaEMsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUNGLFdBQU0sR0FBTixNQUFNLENBQWdDO1lBQzlDLGlCQUFZLEdBQVosWUFBWSxDQUF5QjtZQVh2QyxnQkFBVyxHQUEyQixFQUFFLENBQUM7WUFDekMsbUJBQWMsR0FBMkIsRUFBRSxDQUFDO1lBRzVDLGFBQVEsR0FBWSxLQUFLLENBQUM7WUFZakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLENBQUM7WUFDcEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQUksU0FBUztZQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRztvQkFDZCxJQUFJLFFBQVE7d0JBQ1gsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQztvQkFDdEMsQ0FBQztvQkFDRCxJQUFJLFNBQVM7d0JBQ1osT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixDQUFDO29CQUNELElBQUksU0FBUyxDQUFDLFNBQStCO3dCQUM1QyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQy9CLENBQUM7b0JBQ0QsSUFBSSxVQUFVO3dCQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsQ0FBQztvQkFDRCxJQUFJLFVBQVUsQ0FBQyxLQUE2Qjt3QkFDM0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQzs0QkFDdkYsTUFBTSxJQUFBLHdCQUFlLEVBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ3JDLENBQUM7d0JBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7d0JBQ3pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDL0IsQ0FBQztvQkFDRCxJQUFJLGFBQWE7d0JBQ2hCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztvQkFDNUIsQ0FBQztvQkFDRCxXQUFXLENBQUMsS0FBSyxFQUFFLFVBQVU7d0JBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUMxQixJQUFJLENBQUMsRUFBRSxFQUNQLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQzFDLFVBQVUsSUFBSSxZQUFZLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUMzRCxDQUFDO29CQUNILENBQUM7b0JBQ0QsSUFBSSxVQUFVO3dCQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsQ0FBQztpQkFDRCxDQUFDO2dCQUVGLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsaUJBQWlCLENBQUMsS0FBYztZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN2QixDQUFDO1FBRUQsb0JBQW9CLENBQUMsS0FBNkI7WUFDakQsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDN0IsQ0FBQztRQUVELGlCQUFpQixDQUFDLFVBQWtDO1lBQ25ELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQy9CLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxLQUE2QjtZQUN0RCxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQsaUJBQWlCLENBQUMsS0FBb0M7WUFDckQsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDMUIsQ0FBQzs7SUExRkYsc0RBMkZDIn0=