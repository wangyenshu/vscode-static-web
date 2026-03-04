/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/base/browser/dom", "vs/css!./overlayWidgets"], function (require, exports, fastDomNode_1, viewPart_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewOverlayWidgets = void 0;
    class ViewOverlayWidgets extends viewPart_1.ViewPart {
        constructor(context, viewDomNode) {
            super(context);
            this._viewDomNode = viewDomNode;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._widgets = {};
            this._verticalScrollbarWidth = layoutInfo.verticalScrollbarWidth;
            this._minimapWidth = layoutInfo.minimap.minimapWidth;
            this._horizontalScrollbarHeight = layoutInfo.horizontalScrollbarHeight;
            this._editorHeight = layoutInfo.height;
            this._editorWidth = layoutInfo.width;
            this._viewDomNodeRect = { top: 0, left: 0, width: 0, height: 0 };
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this._domNode, 4 /* PartFingerprint.OverlayWidgets */);
            this._domNode.setClassName('overlayWidgets');
            this.overflowingOverlayWidgetsDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this.overflowingOverlayWidgetsDomNode, 5 /* PartFingerprint.OverflowingOverlayWidgets */);
            this.overflowingOverlayWidgetsDomNode.setClassName('overflowingOverlayWidgets');
        }
        dispose() {
            super.dispose();
            this._widgets = {};
        }
        getDomNode() {
            return this._domNode;
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._verticalScrollbarWidth = layoutInfo.verticalScrollbarWidth;
            this._minimapWidth = layoutInfo.minimap.minimapWidth;
            this._horizontalScrollbarHeight = layoutInfo.horizontalScrollbarHeight;
            this._editorHeight = layoutInfo.height;
            this._editorWidth = layoutInfo.width;
            return true;
        }
        // ---- end view event handlers
        addWidget(widget) {
            const domNode = (0, fastDomNode_1.createFastDomNode)(widget.getDomNode());
            this._widgets[widget.getId()] = {
                widget: widget,
                preference: null,
                domNode: domNode
            };
            // This is sync because a widget wants to be in the dom
            domNode.setPosition('absolute');
            domNode.setAttribute('widgetId', widget.getId());
            if (widget.allowEditorOverflow) {
                this.overflowingOverlayWidgetsDomNode.appendChild(domNode);
            }
            else {
                this._domNode.appendChild(domNode);
            }
            this.setShouldRender();
            this._updateMaxMinWidth();
        }
        setWidgetPosition(widget, preference) {
            const widgetData = this._widgets[widget.getId()];
            if (widgetData.preference === preference) {
                this._updateMaxMinWidth();
                return false;
            }
            widgetData.preference = preference;
            this.setShouldRender();
            this._updateMaxMinWidth();
            return true;
        }
        removeWidget(widget) {
            const widgetId = widget.getId();
            if (this._widgets.hasOwnProperty(widgetId)) {
                const widgetData = this._widgets[widgetId];
                const domNode = widgetData.domNode.domNode;
                delete this._widgets[widgetId];
                domNode.remove();
                this.setShouldRender();
                this._updateMaxMinWidth();
            }
        }
        _updateMaxMinWidth() {
            let maxMinWidth = 0;
            const keys = Object.keys(this._widgets);
            for (let i = 0, len = keys.length; i < len; i++) {
                const widgetId = keys[i];
                const widget = this._widgets[widgetId];
                const widgetMinWidthInPx = widget.widget.getMinContentWidthInPx?.();
                if (typeof widgetMinWidthInPx !== 'undefined') {
                    maxMinWidth = Math.max(maxMinWidth, widgetMinWidthInPx);
                }
            }
            this._context.viewLayout.setOverlayWidgetsMinWidth(maxMinWidth);
        }
        _renderWidget(widgetData) {
            const domNode = widgetData.domNode;
            if (widgetData.preference === null) {
                domNode.setTop('');
                return;
            }
            if (widgetData.preference === 0 /* OverlayWidgetPositionPreference.TOP_RIGHT_CORNER */) {
                domNode.setTop(0);
                domNode.setRight((2 * this._verticalScrollbarWidth) + this._minimapWidth);
            }
            else if (widgetData.preference === 1 /* OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER */) {
                const widgetHeight = domNode.domNode.clientHeight;
                domNode.setTop((this._editorHeight - widgetHeight - 2 * this._horizontalScrollbarHeight));
                domNode.setRight((2 * this._verticalScrollbarWidth) + this._minimapWidth);
            }
            else if (widgetData.preference === 2 /* OverlayWidgetPositionPreference.TOP_CENTER */) {
                domNode.setTop(0);
                domNode.domNode.style.right = '50%';
            }
            else {
                const { top, left } = widgetData.preference;
                const fixedOverflowWidgets = this._context.configuration.options.get(42 /* EditorOption.fixedOverflowWidgets */);
                if (fixedOverflowWidgets && widgetData.widget.allowEditorOverflow) {
                    // top, left are computed relative to the editor and we need them relative to the page
                    const editorBoundingBox = this._viewDomNodeRect;
                    domNode.setTop(top + editorBoundingBox.top);
                    domNode.setLeft(left + editorBoundingBox.left);
                    domNode.setPosition('fixed');
                }
                else {
                    domNode.setTop(top);
                    domNode.setLeft(left);
                    domNode.setPosition('absolute');
                }
            }
        }
        prepareRender(ctx) {
            this._viewDomNodeRect = dom.getDomNodePagePosition(this._viewDomNode.domNode);
        }
        render(ctx) {
            this._domNode.setWidth(this._editorWidth);
            const keys = Object.keys(this._widgets);
            for (let i = 0, len = keys.length; i < len; i++) {
                const widgetId = keys[i];
                this._renderWidget(this._widgets[widgetId]);
            }
        }
    }
    exports.ViewOverlayWidgets = ViewOverlayWidgets;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheVdpZGdldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvb3ZlcmxheVdpZGdldHMvb3ZlcmxheVdpZGdldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUJoRyxNQUFhLGtCQUFtQixTQUFRLG1CQUFRO1FBYS9DLFlBQVksT0FBb0IsRUFBRSxXQUFxQztZQUN0RSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDZixJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUVoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDcEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsbUNBQXlCLENBQUM7WUFFeEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQztZQUNqRSxJQUFJLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDO1lBQ3JELElBQUksQ0FBQywwQkFBMEIsR0FBRyxVQUFVLENBQUMseUJBQXlCLENBQUM7WUFDdkUsSUFBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUNyQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFFakUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLCtC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