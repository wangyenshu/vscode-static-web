/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/css!./iconSelectBox"], function (require, exports, dom, aria_1, inputBox_1, scrollableElement_1, event_1, lifecycle_1, themables_1, nls_1, highlightedLabel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IconSelectBox = void 0;
    class IconSelectBox extends lifecycle_1.Disposable {
        static { this.InstanceCount = 0; }
        constructor(options) {
            super();
            this.options = options;
            this.domId = `icon_select_box_id_${++IconSelectBox.InstanceCount}`;
            this._onDidSelect = this._register(new event_1.Emitter());
            this.onDidSelect = this._onDidSelect.event;
            this.renderedIcons = [];
            this.focusedItemIndex = 0;
            this.numberOfElementsPerRow = 1;
            this.iconContainerWidth = 36;
            this.iconContainerHeight = 36;
            this.domNode = dom.$('.icon-select-box');
            this._register(this.create());
        }
        create() {
            const disposables = new lifecycle_1.DisposableStore();
            const iconSelectBoxContainer = dom.append(this.domNode, dom.$('.icon-select-box-container'));
            iconSelectBoxContainer.style.margin = '10px 15px';
            const iconSelectInputContainer = dom.append(iconSelectBoxContainer, dom.$('.icon-select-input-container'));
            iconSelectInputContainer.style.paddingBottom = '10px';
            this.inputBox = disposables.add(new inputBox_1.InputBox(iconSelectInputContainer, undefined, {
                placeholder: (0, nls_1.localize)('iconSelect.placeholder', "Search icons"),
                inputBoxStyles: this.options.inputBoxStyles,
            }));
            const iconsContainer = this.iconsContainer = dom.$('.icon-select-icons-container', { id: `${this.domId}_icons` });
            iconsContainer.role = 'listbox';
            iconsContainer.tabIndex = 0;
            this.scrollableElement = disposables.add(new scrollableElement_1.DomScrollableElement(iconsContainer, {
                useShadows: false,
                horizontal: 2 /* ScrollbarVisibility.Hidden */,
            }));
            dom.append(iconSelectBoxContainer, this.scrollableElement.getDomNode());
            if (this.options.showIconInfo) {
                this.iconIdElement = this._register(new highlightedLabel_1.HighlightedLabel(dom.append(dom.append(iconSelectBoxContainer, dom.$('.icon-select-id-container')), dom.$('.icon-select-id-label'))));
            }
            const iconsDisposables = disposables.add(new lifecycle_1.MutableDisposable());
            iconsDisposables.value = this.renderIcons(this.options.icons, [], iconsContainer);
            this.scrollableElement.scanDomNode();
            disposables.add(this.inputBox.onDidChange(value => {
                const icons = [], matches = [];
                for (const icon of this.options.icons) {
                    const match = this.matchesContiguous(value, icon.id);
                    if (match) {
                        icons.push(icon);
                        matches.push(match);
                    }
                }
                if (icons.length) {
                    iconsDisposables.value = this.renderIcons(icons, matches, iconsContainer);
                    this.scrollableElement?.scanDomNode();
                }
            }));
            this.inputBox.inputElement.role = 'combobox';
            this.inputBox.inputElement.ariaHasPopup = 'menu';
            this.inputBox.inputElement.ariaAutoComplete = 'list';
            this.inputBox.inputElement.ariaExpanded = 'true';
            this.inputBox.inputElement.setAttribute('aria-controls', iconsContainer.id);
            return disposables;
        }
        renderIcons(icons, matches, container) {
            const disposables = new lifecycle_1.DisposableStore();
            dom.clearNode(container);
            const focusedIcon = this.renderedIcons[this.focusedItemIndex]?.icon;
            let focusedIconIndex = 0;
            const renderedIcons = [];
            if (icons.length) {
                for (let index = 0; index < icons.length; index++) {
                    const icon = icons[index];
                    const iconContainer = dom.append(container, dom.$('.icon-container', { id: `${this.domId}_icons_${index}` }));
                    iconContainer.style.width = `${this.iconContainerWidth}px`;
                    iconContainer.style.height = `${this.iconContainerHeight}px`;
                    iconContainer.title = icon.id;
                    iconContainer.role = 'button';
                    iconContainer.setAttribute('aria-setsize', `${icons.length}`);
                    iconContainer.setAttribute('aria-posinset', `${index + 1}`);
                    dom.append(iconContainer, dom.$(themables_1.ThemeIcon.asCSSSelector(icon)));
                    renderedIcons.push({ icon, element: iconContainer, highlightMatches: matches[index] });
                    disposables.add(dom.addDisposableListener(iconContainer, dom.EventType.CLICK, (e) => {
                        e.stopPropagation();
                        this.setSelection(index);
                    }));
                    if (icon === focusedIcon) {
                        focusedIconIndex = index;
                    }
                }
            }
            else {
                const noResults = (0, nls_1.localize)('iconSelect.noResults', "No results");
                dom.append(container, dom.$('.icon-no-results', undefined, noResults));
                (0, aria_1.alert)(noResults);
            }
            this.renderedIcons.splice(0, this.renderedIcons.length, ...renderedIcons);
            this.focusIcon(focusedIconIndex);
            return disposables;
        }
        focusIcon(index) {
            const existing = this.renderedIcons[this.focusedItemIndex];
            if (existing) {
                existing.element.classList.remove('focused');
            }
            this.focusedItemIndex = index;
            const renderedItem = this.renderedIcons[index];
            if (renderedItem) {
                renderedItem.element.classList.add('focused');
            }
            if (this.inputBox) {
                if (renderedItem) {
                    this.inputBox.inputElement.setAttribute('aria-activedescendant', renderedItem.element.id);
                }
                else {
                    this.inputBox.inputElement.removeAttribute('aria-activedescendant');
                }
            }
            if (this.iconIdElement) {
                if (renderedItem) {
                    this.iconIdElement.set(renderedItem.icon.id, renderedItem.highlightMatches);
                }
                else {
                    this.iconIdElement.set('');
                }
            }
            this.reveal(index);
        }
        reveal(index) {
            if (!this.scrollableElement) {
                return;
            }
            if (index < 0 || index >= this.renderedIcons.length) {
                return;
            }
            const element = this.renderedIcons[index].element;
            if (!element) {
                return;
            }
            const { height } = this.scrollableElement.getScrollDimensions();
            const { scrollTop } = this.scrollableElement.getScrollPosition();
            if (element.offsetTop + this.iconContainerHeight > scrollTop + height) {
                this.scrollableElement.setScrollPosition({ scrollTop: element.offsetTop + this.iconContainerHeight - height });
            }
            else if (element.offsetTop < scrollTop) {
                this.scrollableElement.setScrollPosition({ scrollTop: element.offsetTop });
            }
        }
        matchesContiguous(word, wordToMatchAgainst) {
            const matchIndex = wordToMatchAgainst.toLowerCase().indexOf(word.toLowerCase());
            if (matchIndex !== -1) {
                return [{ start: matchIndex, end: matchIndex + word.length }];
            }
            return null;
        }
        layout(dimension) {
            this.domNode.style.width = `${dimension.width}px`;
            this.domNode.style.height = `${dimension.height}px`;
            const iconsContainerWidth = dimension.width - 30;
            this.numberOfElementsPerRow = Math.floor(iconsContainerWidth / this.iconContainerWidth);
            if (this.numberOfElementsPerRow === 0) {
                throw new Error('Insufficient width');
            }
            const extraSpace = iconsContainerWidth % this.iconContainerWidth;
            const iconElementMargin = Math.floor(extraSpace / this.numberOfElementsPerRow);
            for (const { element } of this.renderedIcons) {
                element.style.marginRight = `${iconElementMargin}px`;
            }
            const containerPadding = extraSpace % this.numberOfElementsPerRow;
            if (this.iconsContainer) {
                this.iconsContainer.style.paddingLeft = `${Math.floor(containerPadding / 2)}px`;
                this.iconsContainer.style.paddingRight = `${Math.ceil(containerPadding / 2)}px`;
            }
            if (this.scrollableElement) {
                this.scrollableElement.getDomNode().style.height = `${this.iconIdElement ? dimension.height - 80 : dimension.height - 40}px`;
                this.scrollableElement.scanDomNode();
            }
        }
        getFocus() {
            return [this.focusedItemIndex];
        }
        setSelection(index) {
            if (index < 0 || index >= this.renderedIcons.length) {
                throw new Error(`Invalid index ${index}`);
            }
            this.focusIcon(index);
            this._onDidSelect.fire(this.renderedIcons[index].icon);
        }
        clearInput() {
            if (this.inputBox) {
                this.inputBox.value = '';
            }
        }
        focus() {
            this.inputBox?.focus();
            this.focusIcon(0);
        }
        focusNext() {
            this.focusIcon((this.focusedItemIndex + 1) % this.renderedIcons.length);
        }
        focusPrevious() {
            this.focusIcon((this.focusedItemIndex - 1 + this.renderedIcons.length) % this.renderedIcons.length);
        }
        focusNextRow() {
            let nextRowIndex = this.focusedItemIndex + this.numberOfElementsPerRow;
            if (nextRowIndex >= this.renderedIcons.length) {
                nextRowIndex = (nextRowIndex + 1) % this.numberOfElementsPerRow;
                nextRowIndex = nextRowIndex >= this.renderedIcons.length ? 0 : nextRowIndex;
            }
            this.focusIcon(nextRowIndex);
        }
        focusPreviousRow() {
            let previousRowIndex = this.focusedItemIndex - this.numberOfElementsPerRow;
            if (previousRowIndex < 0) {
                const numberOfRows = Math.floor(this.renderedIcons.length / this.numberOfElementsPerRow);
                previousRowIndex = this.focusedItemIndex + (this.numberOfElementsPerRow * numberOfRows) - 1;
                previousRowIndex = previousRowIndex < 0
                    ? this.renderedIcons.length - 1
                    : previousRowIndex >= this.renderedIcons.length
                        ? previousRowIndex - this.numberOfElementsPerRow
                        : previousRowIndex;
            }
            this.focusIcon(previousRowIndex);
        }
        getFocusedIcon() {
            return this.renderedIcons[this.focusedItemIndex].icon;
        }
    }
    exports.IconSelectBox = IconSelectBox;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvblNlbGVjdEJveC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9pY29ucy9pY29uU2VsZWN0Qm94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJCaEcsTUFBYSxhQUFjLFNBQVEsc0JBQVU7aUJBRTdCLGtCQUFhLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFvQmpDLFlBQ2tCLE9BQThCO1lBRS9DLEtBQUssRUFBRSxDQUFDO1lBRlMsWUFBTyxHQUFQLE9BQU8sQ0FBdUI7WUFwQnZDLFVBQUssR0FBRyxzQkFBc0IsRUFBRSxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUM7WUFJL0QsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFhLENBQUMsQ0FBQztZQUN2RCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBRXZDLGtCQUFhLEdBQXdCLEVBQUUsQ0FBQztZQUV4QyxxQkFBZ0IsR0FBVyxDQUFDLENBQUM7WUFDN0IsMkJBQXNCLEdBQVcsQ0FBQyxDQUFDO1lBTTFCLHVCQUFrQixHQUFHLEVBQUUsQ0FBQztZQUN4Qix3QkFBbUIsR0FBRyxFQUFFLENBQUM7WUFNekMsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU8sTUFBTTtZQUNiLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFD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