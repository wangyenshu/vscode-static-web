/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/resizable/resizable", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/base/browser/dom"], function (require, exports, resizable_1, lifecycle_1, position_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResizableContentWidget = void 0;
    const TOP_HEIGHT = 30;
    const BOTTOM_HEIGHT = 24;
    class ResizableContentWidget extends lifecycle_1.Disposable {
        constructor(_editor, minimumSize = new dom.Dimension(10, 10)) {
            super();
            this._editor = _editor;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this._resizableNode = this._register(new resizable_1.ResizableHTMLElement());
            this._contentPosition = null;
            this._isResizing = false;
            this._resizableNode.domNode.style.position = 'absolute';
            this._resizableNode.minSize = dom.Dimension.lift(minimumSize);
            this._resizableNode.layout(minimumSize.height, minimumSize.width);
            this._resizableNode.enableSashes(true, true, true, true);
            this._register(this._resizableNode.onDidResize(e => {
                this._resize(new dom.Dimension(e.dimension.width, e.dimension.height));
                if (e.done) {
                    this._isResizing = false;
                }
            }));
            this._register(this._resizableNode.onDidWillResize(() => {
                this._isResizing = true;
            }));
        }
        get isResizing() {
            return this._isResizing;
        }
        getDomNode() {
            return this._resizableNode.domNode;
        }
        getPosition() {
            return this._contentPosition;
        }
        get position() {
            return this._contentPosition?.position ? position_1.Position.lift(this._contentPosition.position) : undefined;
        }
        _availableVerticalSpaceAbove(position) {
            const editorDomNode = this._editor.getDomNode();
            const mouseBox = this._editor.getScrolledVisiblePosition(position);
            if (!editorDomNode || !mouseBox) {
                return;
            }
            const editorBox = dom.getDomNodePagePosition(editorDomNode);
            return editorBox.top + mouseBox.top - TOP_HEIGHT;
        }
        _availableVerticalSpaceBelow(position) {
            const editorDomNode = this._editor.getDomNode();
            const mouseBox = this._editor.getScrolledVisiblePosition(position);
            if (!editorDomNode || !mouseBox) {
                return;
            }
            const editorBox = dom.getDomNodePagePosition(editorDomNode);
            const bodyBox = dom.getClientArea(editorDomNode.ownerDocument.body);
            const mouseBottom = editorBox.top + mouseBox.top + mouseBox.height;
            return bodyBox.height - mouseBottom - BOTTOM_HEIGHT;
        }
        _findPositionPreference(widgetHeight, showAtPosition) {
            const maxHeightBelow = Math.min(this._availableVerticalSpaceBelow(showAtPosition) ?? Infinity, widgetHeight);
            const maxHeightAbove = Math.min(this._availableVerticalSpaceAbove(showAtPosition) ?? Infinity, widgetHeight);
            const maxHeight = Math.min(Math.max(maxHeightAbove, maxHeightBelow), widgetHeight);
            const height = Math.min(widgetHeight, maxHeight);
            let renderingAbove;
            if (this._editor.getOption(60 /* EditorOption.hover */).above) {
                renderingAbove = height <= maxHeightAbove ? 1 /* ContentWidgetPositionPreference.ABOVE */ : 2 /* ContentWidgetPositionPreference.BELOW */;
            }
            else {
                renderingAbove = height <= maxHeightBelow ? 2 /* ContentWidgetPositionPreference.BELOW */ : 1 /* ContentWidgetPositionPreference.ABOVE */;
            }
            if (renderingAbove === 1 /* ContentWidgetPositionPreference.ABOVE */) {
                this._resizableNode.enableSashes(true, true, false, false);
            }
            else {
                this._resizableNode.enableSashes(false, true, true, false);
            }
            return renderingAbove;
        }
        _resize(dimension) {
            this._resizableNode.layout(dimension.height, dimension.width);
        }
    }
    exports.ResizableContentWidget = ResizableContentWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXphYmxlQ29udGVudFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2hvdmVyL2Jyb3dzZXIvcmVzaXphYmxlQ29udGVudFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUV6QixNQUFzQixzQkFBdUIsU0FBUSxzQkFBVTtRQVU5RCxZQUNvQixPQUFvQixFQUN2QyxjQUE4QixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUV2RCxLQUFLLEVBQUUsQ0FBQztZQUhXLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFUL0Isd0JBQW1CLEdBQVksSUFBSSxDQUFDO1lBQ3BDLHNCQUFpQixHQUFZLEtBQUssQ0FBQztZQUV6QixtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxnQ0FBb0IsRUFBRSxDQUFDLENBQUM7WUFDckUscUJBQWdCLEdBQWtDLElBQUksQ0FBQztZQUV6RCxnQkFBVyxHQUFZLEtBQUssQ0FBQztZQU9wQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztZQUN4RCxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUs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