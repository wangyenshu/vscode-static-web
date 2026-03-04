/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/editor/browser/view/viewPart", "vs/platform/theme/common/themeService"], function (require, exports, dom, fastDomNode_1, scrollableElement_1, viewPart_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorScrollbar = void 0;
    class EditorScrollbar extends viewPart_1.ViewPart {
        constructor(context, linesContent, viewDomNode, overflowGuardDomNode) {
            super(context);
            const options = this._context.configuration.options;
            const scrollbar = options.get(103 /* EditorOption.scrollbar */);
            const mouseWheelScrollSensitivity = options.get(75 /* EditorOption.mouseWheelScrollSensitivity */);
            const fastScrollSensitivity = options.get(40 /* EditorOption.fastScrollSensitivity */);
            const scrollPredominantAxis = options.get(106 /* EditorOption.scrollPredominantAxis */);
            const scrollbarOptions = {
                listenOnDomNode: viewDomNode.domNode,
                className: 'editor-scrollable' + ' ' + (0, themeService_1.getThemeTypeSelector)(context.theme.type),
                useShadows: false,
                lazyRender: true,
                vertical: scrollbar.vertical,
                horizontal: scrollbar.horizontal,
                verticalHasArrows: scrollbar.verticalHasArrows,
                horizontalHasArrows: scrollbar.horizontalHasArrows,
                verticalScrollbarSize: scrollbar.verticalScrollbarSize,
                verticalSliderSize: scrollbar.verticalSliderSize,
                horizontalScrollbarSize: scrollbar.horizontalScrollbarSize,
                horizontalSliderSize: scrollbar.horizontalSliderSize,
                handleMouseWheel: scrollbar.handleMouseWheel,
                alwaysConsumeMouseWheel: scrollbar.alwaysConsumeMouseWheel,
                arrowSize: scrollbar.arrowSize,
                mouseWheelScrollSensitivity: mouseWheelScrollSensitivity,
                fastScrollSensitivity: fastScrollSensitivity,
                scrollPredominantAxis: scrollPredominantAxis,
                scrollByPage: scrollbar.scrollByPage,
            };
            this.scrollbar = this._register(new scrollableElement_1.SmoothScrollableElement(linesContent.domNode, scrollbarOptions, this._context.viewLayout.getScrollable()));
            viewPart_1.PartFingerprints.write(this.scrollbar.getDomNode(), 6 /* PartFingerprint.ScrollableElement */);
            this.scrollbarDomNode = (0, fastDomNode_1.createFastDomNode)(this.scrollbar.getDomNode());
            this.scrollbarDomNode.setPosition('absolute');
            this._setLayout();
            // When having a zone widget that calls .focus() on one of its dom elements,
            // the browser will try desperately to reveal that dom node, unexpectedly
            // changing the .scrollTop of this.linesContent
            const onBrowserDesperateReveal = (domNode, lookAtScrollTop, lookAtScrollLeft) => {
                const newScrollPosition = {};
                if (lookAtScrollTop) {
                    const deltaTop = domNode.scrollTop;
                    if (deltaTop) {
                        newScrollPosition.scrollTop = this._context.viewLayout.getCurrentScrollTop() + deltaTop;
                        domNode.scrollTop = 0;
                    }
                }
                if (lookAtScrollLeft) {
                    const deltaLeft = domNode.scrollLeft;
                    if (deltaLeft) {
                        newScrollPosition.scrollLeft = this._context.viewLayout.getCurrentScrollLeft() + deltaLeft;
                        domNode.scrollLeft = 0;
                    }
                }
                this._context.viewModel.viewLayout.setScrollPosition(newScrollPosition, 1 /* ScrollType.Immediate */);
            };
            // I've seen this happen both on the view dom node & on the lines content dom node.
            this._register(dom.addDisposableListener(viewDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(viewDomNode.domNode, true, true)));
            this._register(dom.addDisposableListener(linesContent.domNode, 'scroll', (e) => onBrowserDesperateReveal(linesContent.domNode, true, false)));
            this._register(dom.addDisposableListener(overflowGuardDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(overflowGuardDomNode.domNode, true, false)));
            this._register(dom.addDisposableListener(this.scrollbarDomNode.domNode, 'scroll', (e) => onBrowserDesperateReveal(this.scrollbarDomNode.domNode, true, false)));
        }
        dispose() {
            super.dispose();
        }
        _setLayout() {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this.scrollbarDomNode.setLeft(layoutInfo.contentLeft);
            const minimap = options.get(73 /* EditorOption.minimap */);
            const side = minimap.side;
            if (side === 'right') {
                this.scrollbarDomNode.setWidth(layoutInfo.contentWidth + layoutInfo.minimap.minimapWidth);
            }
            else {
                this.scrollbarDomNode.setWidth(layoutInfo.contentWidth);
            }
            this.scrollbarDomNode.setHeight(layoutInfo.height);
        }
        getOverviewRulerLayoutInfo() {
            return this.scrollbar.getOverviewRulerLayoutInfo();
        }
        getDomNode() {
            return this.scrollbarDomNode;
        }
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this.scrollbar.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        delegateScrollFromMouseWheelEvent(browserEvent) {
            this.scrollbar.delegateScrollFromMouseWheelEvent(browserEvent);
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            if (e.hasChanged(103 /* EditorOption.scrollbar */)
                || e.hasChanged(75 /* EditorOption.mouseWheelScrollSensitivity */)
                || e.hasChanged(40 /* EditorOption.fastScrollSensitivity */)) {
                const options = this._context.configuration.options;
                const scrollbar = options.get(103 /* EditorOption.scrollbar */);
                const mouseWheelScrollSensitivity = options.get(75 /* EditorOption.mouseWheelScrollSensitivity */);
                const fastScrollSensitivity = options.get(40 /* EditorOption.fastScrollSensitivity */);
                const scrollPredominantAxis = options.get(106 /* EditorOption.scrollPredominantAxis */);
                const newOpts = {
                    vertical: scrollbar.vertical,
                    horizontal: scrollbar.horizontal,
                    verticalScrollbarSize: scrollbar.verticalScrollbarSize,
                    horizontalScrollbarSize: scrollbar.horizontalScrollbarSize,
                    scrollByPage: scrollbar.scrollByPage,
                    handleMouseWheel: scrollbar.handleMouseWheel,
                    mouseWheelScrollSensitivity: mouseWheelScrollSensitivity,
                    fastScrollSensitivity: fastScrollSensitivity,
                    scrollPredominantAxis: scrollPredominantAxis
                };
                this.scrollbar.updateOptions(newOpts);
            }
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                this._setLayout();
            }
            return true;
        }
        onScrollChanged(e) {
            return true;
        }
        onThemeChanged(e) {
            this.scrollbar.updateClassName('editor-scrollable' + ' ' + (0, themeService_1.getThemeTypeSelector)(this._context.theme.type));
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to do
        }
        render(ctx) {
            this.scrollbar.renderNow();
        }
    }
    exports.EditorScrollbar = EditorScrollbar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2Nyb2xsYmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL2VkaXRvclNjcm9sbGJhci9lZGl0b3JTY3JvbGxiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsZUFBZ0IsU0FBUSxtQkFBUTtRQUs1QyxZQUNDLE9BQW9CLEVBQ3BCLFlBQXNDLEVBQ3RDLFdBQXFDLEVBQ3JDLG9CQUE4QztZQUU5QyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFHZixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDcEQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsa0NBQXdCLENBQUM7WUFDdEQsTUFBTSwyQkFBMkIsR0FBRyxPQUFPLENBQUMsR0FBRyxtREFBMEMsQ0FBQztZQUMxRixNQUFNLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyxHQUFHLDZDQUFvQyxDQUFDO1lBQzlFLE1BQU0scUJBQXFCLEdBQUcsT0FBTyxDQUFDLEdBQUcsOENBQW9DLENBQUM7WUFFOUUsTUFBTSxnQkFBZ0IsR0FBcUM7Z0JBQzFELGVBQWUsRUFBRSxXQUFXLENBQUMsT0FBTztnQkFDcEMsU0FBUyxFQUFFLG1CQUFtQixHQUFHLEdBQUcsR0FBRyxJQUFBLG1DQUFvQixFQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUMvRSxVQUFVLEVBQUUsS0FBSztnQkFDakIsVUFBVSxFQUFFLElBQUk7Z0JBRWhCLFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUTtnQkFDNUIsVUFBVSxFQUFFLFNBQVMsQ0FBQyxVQUFVO2dCQUNoQyxpQkFBaUIsRUFBRSxTQUFTLENBQUMsaUJBQWlCO2dCQUM5Qyxt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