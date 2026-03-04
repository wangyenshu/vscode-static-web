/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/component", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/types", "vs/base/common/lifecycle", "vs/css!./media/part"], function (require, exports, component_1, dom_1, event_1, types_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiWindowParts = exports.Part = void 0;
    /**
     * Parts are layed out in the workbench and have their own layout that
     * arranges an optional title and mandatory content area to show content.
     */
    class Part extends component_1.Component {
        get dimension() { return this._dimension; }
        get contentPosition() { return this._contentPosition; }
        constructor(id, options, themeService, storageService, layoutService) {
            super(id, themeService, storageService);
            this.options = options;
            this.layoutService = layoutService;
            this._onDidVisibilityChange = this._register(new event_1.Emitter());
            this.onDidVisibilityChange = this._onDidVisibilityChange.event;
            //#region ISerializableView
            this._onDidChange = this._register(new event_1.Emitter());
            this._register(layoutService.registerPart(this));
        }
        onThemeChange(theme) {
            // only call if our create() method has been called
            if (this.parent) {
                super.onThemeChange(theme);
            }
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Called to create title and content area of the part.
         */
        create(parent, options) {
            this.parent = parent;
            this.titleArea = this.createTitleArea(parent, options);
            this.contentArea = this.createContentArea(parent, options);
            this.partLayout = new PartLayout(this.options, this.contentArea);
            this.updateStyles();
        }
        /**
         * Returns the overall part container.
         */
        getContainer() {
            return this.parent;
        }
        /**
         * Subclasses override to provide a title area implementation.
         */
        createTitleArea(parent, options) {
            return undefined;
        }
        /**
         * Returns the title area container.
         */
        getTitleArea() {
            return this.titleArea;
        }
        /**
         * Subclasses override to provide a content area implementation.
         */
        createContentArea(parent, options) {
            return undefined;
        }
        /**
         * Returns the content area container.
         */
        getContentArea() {
            return this.contentArea;
        }
        /**
         * Sets the header area
         */
        setHeaderArea(headerContainer) {
            if (this.headerArea) {
                throw new Error('Header already exists');
            }
            if (!this.parent || !this.titleArea) {
                return;
            }
            (0, dom_1.prepend)(this.parent, headerContainer);
            headerContainer.classList.add('header-or-footer');
            headerContainer.classList.add('header');
            this.headerArea = headerContainer;
            this.partLayout?.setHeaderVisibility(true);
            this.relayout();
        }
        /**
         * Sets the footer area
         */
        setFooterArea(footerContainer) {
            if (this.footerArea) {
                throw new Error('Footer already exists');
            }
            if (!this.parent || !this.titleArea) {
                return;
            }
            this.parent.appendChild(footerContainer);
            footerContainer.classList.add('header-or-footer');
            footerContainer.classList.add('footer');
            this.footerArea = footerContainer;
            this.partLayout?.setFooterVisibility(true);
            this.relayout();
        }
        /**
         * removes the header area
         */
        removeHeaderArea() {
            if (this.headerArea) {
                this.headerArea.remove();
                this.headerArea = undefined;
                this.partLayout?.setHeaderVisibility(false);
                this.relayout();
            }
        }
        /**
         * removes the footer area
         */
        removeFooterArea() {
            if (this.footerArea) {
                this.footerArea.remove();
                this.footerArea = undefined;
                this.partLayout?.setFooterVisibility(false);
                this.relayout();
            }
        }
        relayout() {
            if (this.dimension && this.contentPosition) {
                this.layout(this.dimension.width, this.dimension.height, this.contentPosition.top, this.contentPosition.left);
            }
        }
        /**
         * Layout title and content area in the given dimension.
         */
        layoutContents(width, height) {
            const partLayout = (0, types_1.assertIsDefined)(this.partLayout);
            return partLayout.layout(width, height);
        }
        get onDidChange() { return this._onDidChange.event; }
        layout(width, height, top, left) {
            this._dimension = new dom_1.Dimension(width, height);
            this._contentPosition = { top, left };
        }
        setVisible(visible) {
            this._onDidVisibilityChange.fire(visible);
        }
    }
    exports.Part = Part;
    class PartLayout {
        static { this.HEADER_HEIGHT = 35; }
        static { this.TITLE_HEIGHT = 35; }
        static { this.Footer_HEIGHT = 35; }
        constructor(options, contentArea) {
            this.options = options;
            this.contentArea = contentArea;
            this.headerVisible = false;
            this.footerVisible = false;
        }
        layout(width, height) {
            // Title Size: Width (Fill), Height (Variable)
            let titleSize;
            if (this.options.hasTitle) {
                titleSize = new dom_1.Dimension(width, Math.min(height, PartLayout.TITLE_HEIGHT));
            }
            else {
                titleSize = dom_1.Dimension.None;
            }
            // Header Size: Width (Fill), Height (Variable)
            let headerSize;
            if (this.headerVisible) {
                headerSize = new dom_1.Dimension(width, Math.min(height, PartLayout.HEADER_HEIGHT));
            }
            else {
                headerSize = dom_1.Dimension.None;
            }
            // Footer Size: Width (Fill), Height (Variable)
            let footerSize;
            if (this.footerVisible) {
                footerSize = new dom_1.Dimension(width, Math.min(height, PartLayout.Footer_HEIGHT));
            }
            else {
                footerSize = dom_1.Dimension.None;
            }
            let contentWidth = width;
            if (this.options && typeof this.options.borderWidth === 'function') {
                contentWidth -= this.options.borderWidth(); // adjust for border size
            }
            // Content Size: Width (Fill), Height (Variable)
            const contentSize = new dom_1.Dimension(contentWidth, height - titleSize.height - headerSize.height - footerSize.height);
            // Content
            if (this.contentArea) {
                (0, dom_1.size)(this.contentArea, contentSize.width, contentSize.height);
            }
            return { headerSize, titleSize, contentSize, footerSize };
        }
        setFooterVisibility(visible) {
            this.footerVisible = visible;
        }
        setHeaderVisibility(visible) {
            this.headerVisible = visible;
        }
    }
    class MultiWindowParts extends component_1.Component {
        constructor() {
            super(...arguments);
            this._parts = new Set();
        }
        get parts() { return Array.from(this._parts); }
        registerPart(part) {
            this._parts.add(part);
            return (0, lifecycle_1.toDisposable)(() => this.unregisterPart(part));
        }
        unregisterPart(part) {
            this._parts.delete(part);
        }
        getPart(container) {
            return this.getPartByDocument(container.ownerDocument);
        }
        getPartByDocument(document) {
            if (this._parts.size > 1) {
                for (const part of this._parts) {
                    if (part.element?.ownerDocument === document) {
                        return part;
                    }
                }
            }
            return this.mainPart;
        }
        get activePart() {
            return this.getPartByDocument((0, dom_1.getActiveDocument)());
        }
    }
    exports.MultiWindowParts = MultiWindowParts;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUJoRzs7O09BR0c7SUFDSCxNQUFzQixJQUFLLFNBQVEscUJBQVM7UUFHM0MsSUFBSSxTQUFTLEtBQTRCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFHbEUsSUFBSSxlQUFlLEtBQStCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQVlqRixZQUNDLEVBQVUsRUFDRixPQUFxQixFQUM3QixZQUEyQixFQUMzQixjQUErQixFQUNaLGFBQXNDO1lBRXpELEtBQUssQ0FBQyxFQUFFLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBTGhDLFlBQU8sR0FBUCxPQUFPLENBQWM7WUFHVixrQkFBYSxHQUFiLGFBQWEsQ0FBeUI7WUFmaEQsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVyxDQUFDLENBQUM7WUFDakUsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQWdLbkUsMkJBQTJCO1lBRWpCLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBeUIsQ0FBQyxDQUFDO1lBaEo3RSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRWtCLGFBQWEsQ0FBQyxLQUFrQjtZQUVsRCxtREFBbUQ7WUFDbkQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pCLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIs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