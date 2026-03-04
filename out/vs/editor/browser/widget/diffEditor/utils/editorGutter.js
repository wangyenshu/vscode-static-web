/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange"], function (require, exports, dom_1, lifecycle_1, observable_1, lineRange_1, offsetRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorGutter = void 0;
    class EditorGutter extends lifecycle_1.Disposable {
        constructor(_editor, _domNode, itemProvider) {
            super();
            this._editor = _editor;
            this._domNode = _domNode;
            this.itemProvider = itemProvider;
            this.scrollTop = (0, observable_1.observableFromEvent)(this._editor.onDidScrollChange, (e) => /** @description editor.onDidScrollChange */ this._editor.getScrollTop());
            this.isScrollTopZero = this.scrollTop.map((scrollTop) => /** @description isScrollTopZero */ scrollTop === 0);
            this.modelAttached = (0, observable_1.observableFromEvent)(this._editor.onDidChangeModel, (e) => /** @description editor.onDidChangeModel */ this._editor.hasModel());
            this.editorOnDidChangeViewZones = (0, observable_1.observableSignalFromEvent)('onDidChangeViewZones', this._editor.onDidChangeViewZones);
            this.editorOnDidContentSizeChange = (0, observable_1.observableSignalFromEvent)('onDidContentSizeChange', this._editor.onDidContentSizeChange);
            this.domNodeSizeChanged = (0, observable_1.observableSignal)('domNodeSizeChanged');
            this.views = new Map();
            this._domNode.className = 'gutter monaco-editor';
            const scrollDecoration = this._domNode.appendChild((0, dom_1.h)('div.scroll-decoration', { role: 'presentation', ariaHidden: 'true', style: { width: '100%' } })
                .root);
            const o = new ResizeObserver(() => {
                (0, observable_1.transaction)(tx => {
                    /** @description ResizeObserver: size changed */
                    this.domNodeSizeChanged.trigger(tx);
                });
            });
            o.observe(this._domNode);
            this._register((0, lifecycle_1.toDisposable)(() => o.disconnect()));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update scroll decoration */
                scrollDecoration.className = this.isScrollTopZero.read(reader) ? '' : 'scroll-decoration';
            }));
            this._register((0, observable_1.autorun)(reader => /** @description EditorGutter.Render */ this.render(reader)));
        }
        dispose() {
            super.dispose();
            (0, dom_1.reset)(this._domNode);
        }
        render(reader) {
            if (!this.modelAttached.read(reader)) {
                return;
            }
            this.domNodeSizeChanged.read(reader);
            this.editorOnDidChangeViewZones.read(reader);
            this.editorOnDidContentSizeChange.read(reader);
            const scrollTop = this.scrollTop.read(reader);
            const visibleRanges = this._editor.getVisibleRanges();
            const unusedIds = new Set(this.views.keys());
            const viewRange = offsetRange_1.OffsetRange.ofStartAndLength(0, this._domNode.clientHeight);
            if (!viewRange.isEmpty) {
                for (const visibleRange of visibleRanges) {
                    const visibleRange2 = new lineRange_1.LineRange(visibleRange.startLineNumber, visibleRange.endLineNumber + 1);
                    const gutterItems = this.itemProvider.getIntersectingGutterItems(visibleRange2, reader);
                    (0, observable_1.transaction)(tx => {
                        /** EditorGutter.render */
                        for (const gutterItem of gutterItems) {
                            if (!gutterItem.range.intersect(visibleRange2)) {
                                continue;
                            }
                            unusedIds.delete(gutterItem.id);
                            let view = this.views.get(gutterItem.id);
                            if (!view) {
                                const viewDomNode = document.createElement('div');
                                this._domNode.appendChild(viewDomNode);
                                const gutterItemObs = (0, observable_1.observableValue)('item', gutterItem);
                                const itemView = this.itemProvider.createView(gutterItemObs, viewDomNode);
                                view = new ManagedGutterItemView(gutterItemObs, itemView, viewDomNode);
                                this.views.set(gutterItem.id, view);
                            }
                            else {
                                view.item.set(gutterItem, tx);
                            }
                            const top = gutterItem.range.startLineNumber <= this._editor.getModel().getLineCount()
                                ? this._editor.getTopForLineNumber(gutterItem.range.startLineNumber, true) - scrollTop
                                : this._editor.getBottomForLineNumber(gutterItem.range.startLineNumber - 1, false) - scrollTop;
                            const bottom = gutterItem.range.isEmpty
                                // Don't trust that `getBottomForLineNumber` for the previous line equals `getTopForLineNumber` for the current one.
                                ? top
                                : (this._editor.getBottomForLineNumber(gutterItem.range.endLineNumberExclusive - 1, true) - scrollTop);
                            const height = bottom - top;
                            view.domNode.style.top = `${top}px`;
                            view.domNode.style.height = `${height}px`;
                            view.gutterItemView.layout(offsetRange_1.OffsetRange.ofStartAndLength(top, height), viewRange);
                        }
                    });
                }
            }
            for (const id of unusedIds) {
                const view = this.views.get(id);
                view.gutterItemView.dispose();
                this._domNode.removeChild(view.domNode);
                this.views.delete(id);
            }
        }
    }
    exports.EditorGutter = EditorGutter;
    class ManagedGutterItemView {
        constructor(item, gutterItemView, domNode) {
            this.item = item;
            this.gutterItemView = gutterItemView;
            this.domNode = domNode;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3V0dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L2RpZmZFZGl0b3IvdXRpbHMvZWRpdG9yR3V0dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLFlBQTBELFNBQVEsc0JBQVU7UUFleEYsWUFDa0IsT0FBeUIsRUFDekIsUUFBcUIsRUFDckIsWUFBb0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFKUyxZQUFPLEdBQVAsT0FBTyxDQUFrQjtZQUN6QixhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQ3JCLGlCQUFZLEdBQVosWUFBWSxDQUF3QjtZQWpCckMsY0FBUyxHQUFHLElBQUEsZ0NBQW1CLEVBQy9DLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQzlCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUMvRSxDQUFDO1lBQ2Usb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsbUNBQW1DLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3pHLGtCQUFhLEdBQUcsSUFBQSxnQ0FBbUIsRUFDbkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFDN0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLDJDQUEyQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQzFFLENBQUM7WUFFZSwrQkFBMEIsR0FBRyxJQUFBLHNDQUF5QixFQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNsSCxpQ0FBNEIsR0FBRyxJQUFBLHNDQUF5QixFQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUN4SCx1QkFBa0IsR0FBRyxJQUFBLDZCQUFnQixFQUFDLG9CQUFvQixDQUFDLENBQUM7WUFxQzVELFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBaUMsQ0FBQztZQTdCakUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsc0JBQXNCLENBQUM7WUFDakQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FDakQsSUFBQSxPQUFDLEVBQUMsdUJBQXVCLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUM7aUJBQ2hHLElBQUksQ0FDTixDQUFDO1lBRUYsTUFBTSxDQUFDLEdBQUcsSUFBSSxjQUFjLENBQUMsR0FBRyxFQUFFO2dCQUNqQyxJQUFBLHdCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQ2hCLGdEQUFnRDtvQkFDaEQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDckMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUNILENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbkQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFPLEVBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQy9CLDRDQUE0QztnQkFDNUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO1lBQzNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsb0JBQU8sRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDLHVDQUF1QyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWhCLElBQUEsV0FBSyxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBSU8sTUFBTSxDQUFDLE1BQWU7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFL0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFOUMsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3RELE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUU3QyxNQUFNLFNBQVMsR0FBRyx5QkFBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTlFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQzFDLE1BQU0sYUFBYSxHQUFHLElBQUkscUJBQVMsQ0FDbEMsWUFBWSxDQUFDLGVBQWUsRUFDNUIsWUFBWSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQzlCLENBQUM7b0JBRUYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQywwQkFBMEIsQ0FDL0QsYUFBYSxFQUNiLE1BQU0sQ0FDTixDQUFDO29CQUVGLElBQUEsd0JBQVcsRUFBQyxFQUFFLENBQUMsRUFBRTt3QkFDaEIsMEJBQTBCO3dCQUUxQixLQUFLLE1BQU0sVUFBVSxJQUFJLFdBQVcsRUFBRSxDQUFDOzRCQUN0QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQ0FDaEQsU0FBUzs0QkFDVixDQUFDOzRCQUVELFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDOzRCQUNoQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7NEJBQ3pDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQ0FDWCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dDQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQ0FDdkMsTUFBTSxhQUFhLEdBQUcsSUFBQSw0QkFBZSxFQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztnQ0FDMUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQzVDLGFBQWEsRUFDYixXQUFXLENBQ1gsQ0FBQztnQ0FDRixJQUFJLEdBQUcsSUFBSSxxQkFBcUIsQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dDQUN2RSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUNyQyxDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDOzRCQUMvQixDQUFDOzRCQUVELE1BQU0sR0FBRyxHQUNSLFVBQVUsQ0FBQyxLQUFLLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFHLENBQUMsWUFBWSxFQUFFO2dDQUMxRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsR0FBRyxTQUFTO2dDQUN0RixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsU0FBUyxDQUFDOzRCQUNqRyxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLE9BQU87Z0NBQ3RDLG9IQUFvSDtnQ0FDcEgsQ0FBQyxDQUFDLEdBQUc7Z0NBQ0wsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQzs0QkFFeEcsTUFBTSxNQUFNLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQzs0QkFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7NEJBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDOzRCQUUxQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyx5QkFBVyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQzt3QkFDbEYsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQztZQUVELEtBQUssTUFBTSxFQUFFLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFsSUQsb0NBa0lDO0lBRUQsTUFBTSxxQkFBcUI7UUFDMUIsWUFDaUIsSUFBMEMsRUFDMUMsY0FBK0IsRUFDL0IsT0FBdUI7WUFGdkIsU0FBSSxHQUFKLElBQUksQ0FBc0M7WUFDMUMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQy9CLFlBQU8sR0FBUCxPQUFPLENBQWdCO1FBQ3BDLENBQUM7S0FDTCJ9