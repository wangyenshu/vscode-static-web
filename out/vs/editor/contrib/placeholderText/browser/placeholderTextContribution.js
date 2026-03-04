/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/equals", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/editorExtensions", "vs/editor/browser/observableUtilities", "vs/editor/common/core/range", "vs/editor/common/model", "vs/css!./placeholderText"], function (require, exports, equals_1, lifecycle_1, observable_1, editorExtensions_1, observableUtilities_1, range_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PlaceholderTextContribution = void 0;
    class PlaceholderTextContribution extends lifecycle_1.Disposable {
        static get(editor) {
            return editor.getContribution(PlaceholderTextContribution.ID);
        }
        static { this.ID = 'editor.contrib.placeholderText'; }
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._editorObs = (0, observableUtilities_1.obsCodeEditor)(this._editor);
            this._placeholderText = (0, observable_1.observableValue)(this, undefined);
            this._decorationOptions = (0, observable_1.derivedOpts)({ owner: this, equalsFn: equals_1.structuralEquals }, reader => {
                const p = this._placeholderText.read(reader);
                if (!p) {
                    return undefined;
                }
                if (!this._editorObs.valueIsEmpty.read(reader)) {
                    return undefined;
                }
                return { placeholder: p };
            });
            this._decorations = (0, observable_1.derived)(this, (reader) => {
                const options = this._decorationOptions.read(reader);
                if (!options) {
                    return [];
                }
                return [{
                        range: new range_1.Range(1, 1, 1, 1),
                        options: {
                            description: 'placeholder',
                            showIfCollapsed: true,
                            after: {
                                content: options.placeholder,
                                cursorStops: model_1.InjectedTextCursorStops.None,
                                inlineClassName: 'placeholder-text'
                            }
                        }
                    }];
            });
            this._register(this._editorObs.setDecorations(this._decorations));
        }
        setPlaceholderText(placeholder) {
            this._placeholderText.set(placeholder, undefined);
        }
    }
    exports.PlaceholderTextContribution = PlaceholderTextContribution;
    (0, editorExtensions_1.registerEditorContribution)(PlaceholderTextContribution.ID, PlaceholderTextContribution, 4 /* EditorContributionInstantiation.Lazy */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhY2Vob2xkZXJUZXh0Q29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvcGxhY2Vob2xkZXJUZXh0L2Jyb3dzZXIvcGxhY2Vob2xkZXJUZXh0Q29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLDJCQUE0QixTQUFRLHNCQUFVO1FBQ25ELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUE4QiwyQkFBMkIsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUM3RixDQUFDO2lCQUVzQixPQUFFLEdBQUcsZ0NBQWdDLEFBQW5DLENBQW9DO1FBK0I3RCxZQUNrQixPQUFvQjtZQUVyQyxLQUFLLEVBQUUsQ0FBQztZQUZTLFlBQU8sR0FBUCxPQUFPLENBQWE7WUEvQnJCLGVBQVUsR0FBRyxJQUFBLG1DQUFhLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXpDLHFCQUFnQixHQUFHLElBQUEsNEJBQWUsRUFBcUIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXhFLHVCQUFrQixHQUFHLElBQUEsd0JBQVcsRUFBc0MsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSx5QkFBZ0IsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUM1SSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQUMsT0FBTyxTQUFTLENBQUM7Z0JBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUFDLE9BQU8sU0FBUyxDQUFDO2dCQUFDLENBQUM7Z0JBRXJFLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUM7WUFFYyxpQkFBWSxHQUFHLElBQUEsb0JBQU8sRUFBMEIsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2pGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFBQyxPQUFPLEVBQUUsQ0FBQztnQkFBQyxDQUFDO2dCQUU1QixPQUFPLENBQUM7d0JBQ1AsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDNUIsT0FBTyxFQUFFOzRCQUNSLFdBQVcsRUFBRSxhQUFhOzRCQUMxQixlQUFlLEVBQUUsSUFBSTs0QkFDckIsS0FBSyxFQUFFO2dDQUNOLE9BQU8sRUFBRSxPQUFPLENBQUMsV0FBVztnQ0FDNUIsV0FBVyxFQUFFLCtCQUF1QixDQUFDLElBQUk7Z0NBQ3pDLGVBQWUsRUFBRSxrQkFBa0I7NkJBQ25DO3lCQUNEO3FCQUNELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBT0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRU0sa0JBQWtCLENBQUMsV0FBbUI7WUFDNUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkQsQ0FBQzs7SUE5Q0Ysa0VBK0NDO0lBRUQsSUFBQSw2Q0FBMEIsRUFBQywyQkFBMkIsQ0FBQyxFQUFFLEVBQUUsMkJBQTJCLCtDQUF1QyxDQUFDIn0=