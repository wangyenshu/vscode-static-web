/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/grid/gridview", "vs/base/common/event"], function (require, exports, assert, gridview_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestView = void 0;
    exports.nodesToArrays = nodesToArrays;
    class TestView {
        get minimumWidth() { return this._minimumWidth; }
        set minimumWidth(size) { this._minimumWidth = size; this._onDidChange.fire(undefined); }
        get maximumWidth() { return this._maximumWidth; }
        set maximumWidth(size) { this._maximumWidth = size; this._onDidChange.fire(undefined); }
        get minimumHeight() { return this._minimumHeight; }
        set minimumHeight(size) { this._minimumHeight = size; this._onDidChange.fire(undefined); }
        get maximumHeight() { return this._maximumHeight; }
        set maximumHeight(size) { this._maximumHeight = size; this._onDidChange.fire(undefined); }
        get element() { this._onDidGetElement.fire(); return this._element; }
        get width() { return this._width; }
        get height() { return this._height; }
        get top() { return this._top; }
        get left() { return this._left; }
        get size() { return [this.width, this.height]; }
        constructor(_minimumWidth, _maximumWidth, _minimumHeight, _maximumHeight) {
            this._minimumWidth = _minimumWidth;
            this._maximumWidth = _maximumWidth;
            this._minimumHeight = _minimumHeight;
            this._maximumHeight = _maximumHeight;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._element = document.createElement('div');
            this._onDidGetElement = new event_1.Emitter();
            this.onDidGetElement = this._onDidGetElement.event;
            this._width = 0;
            this._height = 0;
            this._top = 0;
            this._left = 0;
            this._onDidLayout = new event_1.Emitter();
            this.onDidLayout = this._onDidLayout.event;
            this._onDidFocus = new event_1.Emitter();
            this.onDidFocus = this._onDidFocus.event;
            assert(_minimumWidth <= _maximumWidth, 'gridview view minimum width must be <= maximum width');
            assert(_minimumHeight <= _maximumHeight, 'gridview view minimum height must be <= maximum height');
        }
        layout(width, height, top, left) {
            this._width = width;
            this._height = height;
            this._top = top;
            this._left = left;
            this._onDidLayout.fire({ width, height, top, left });
        }
        focus() {
            this._onDidFocus.fire();
        }
        dispose() {
            this._onDidChange.dispose();
            this._onDidGetElement.dispose();
            this._onDidLayout.dispose();
            this._onDidFocus.dispose();
        }
    }
    exports.TestView = TestView;
    function nodesToArrays(node) {
        if ((0, gridview_1.isGridBranchNode)(node)) {
            return node.children.map(nodesToArrays);
        }
        else {
            return node.view;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9icm93c2VyL3VpL2dyaWQvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnRmhHLHNDQU1DO0lBL0VELE1BQWEsUUFBUTtRQUtwQixJQUFJLFlBQVksS0FBYSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ3pELElBQUksWUFBWSxDQUFDLElBQVksSUFBSSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVoRyxJQUFJLFlBQVksS0FBYSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ3pELElBQUksWUFBWSxDQUFDLElBQVksSUFBSSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVoRyxJQUFJLGFBQWEsS0FBYSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQzNELElBQUksYUFBYSxDQUFDLElBQVksSUFBSSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVsRyxJQUFJLGFBQWEsS0FBYSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQzNELElBQUksYUFBYSxDQUFDLElBQVksSUFBSSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMs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