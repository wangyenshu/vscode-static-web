var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/browser/ui/list/listWidget", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/themables", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/css!./actionWidget"], function (require, exports, dom, keybindingLabel_1, listWidget_1, cancellation_1, codicons_1, lifecycle_1, platform_1, themables_1, nls_1, contextView_1, keybinding_1, defaultStyles_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionList = exports.ActionListItemKind = exports.previewSelectedActionCommand = exports.acceptSelectedActionCommand = void 0;
    exports.acceptSelectedActionCommand = 'acceptSelectedCodeAction';
    exports.previewSelectedActionCommand = 'previewSelectedCodeAction';
    var ActionListItemKind;
    (function (ActionListItemKind) {
        ActionListItemKind["Action"] = "action";
        ActionListItemKind["Header"] = "header";
    })(ActionListItemKind || (exports.ActionListItemKind = ActionListItemKind = {}));
    class HeaderRenderer {
        get templateId() { return "header" /* ActionListItemKind.Header */; }
        renderTemplate(container) {
            container.classList.add('group-header');
            const text = document.createElement('span');
            container.append(text);
            return { container, text };
        }
        renderElement(element, _index, templateData) {
            templateData.text.textContent = element.group?.title ?? '';
        }
        disposeTemplate(_templateData) {
            // noop
        }
    }
    let ActionItemRenderer = class ActionItemRenderer {
        get templateId() { return "action" /* ActionListItemKind.Action */; }
        constructor(_supportsPreview, _keybindingService) {
            this._supportsPreview = _supportsPreview;
            this._keybindingService = _keybindingService;
        }
        renderTemplate(container) {
            container.classList.add(this.templateId);
            const icon = document.createElement('div');
            icon.className = 'icon';
            container.append(icon);
            const text = document.createElement('span');
            text.className = 'title';
            container.append(text);
            const keybinding = new keybindingLabel_1.KeybindingLabel(container, platform_1.OS);
            return { container, icon, text, keybinding };
        }
        renderElement(element, _index, data) {
            if (element.group?.icon) {
                data.icon.className = themables_1.ThemeIcon.asClassName(element.group.icon);
                if (element.group.icon.color) {
                    data.icon.style.color = (0, colorRegistry_1.asCssVariable)(element.group.icon.color.id);
                }
            }
            else {
                data.icon.className = themables_1.ThemeIcon.asClassName(codicons_1.Codicon.lightBulb);
                data.icon.style.color = 'var(--vscode-editorLightBulb-foreground)';
            }
            if (!element.item || !element.label) {
                return;
            }
            data.text.textContent = stripNewlines(element.label);
            data.keybinding.set(element.keybinding);
            dom.setVisibility(!!element.keybinding, data.keybinding.element);
            const actionTitle = this._keybindingService.lookupKeybinding(exports.acceptSelectedActionCommand)?.getLabel();
            const previewTitle = this._keybindingService.lookupKeybinding(exports.previewSelectedActionCommand)?.getLabel();
            data.container.classList.toggle('option-disabled', element.disabled);
            if (element.disabled) {
                data.container.title = element.label;
            }
            else if (actionTitle && previewTitle) {
                if (this._supportsPreview && element.canPreview) {
                    data.container.title = (0, nls_1.localize)({ key: 'label-preview', comment: ['placeholders are keybindings, e.g "F2 to Apply, Shift+F2 to Preview"'] }, "{0} to Apply, {1} to Preview", actionTitle, previewTitle);
                }
                else {
                    data.container.title = (0, nls_1.localize)({ key: 'label', comment: ['placeholder is a keybinding, e.g "F2 to Apply"'] }, "{0} to Apply", actionTitle);
                }
            }
            else {
                data.container.title = '';
            }
        }
        disposeTemplate(_templateData) {
            _templateData.keybinding.dispose();
        }
    };
    ActionItemRenderer = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], ActionItemRenderer);
    class AcceptSelectedEvent extends UIEvent {
        constructor() { super('acceptSelectedAction'); }
    }
    class PreviewSelectedEvent extends UIEvent {
        constructor() { super('previewSelectedAction'); }
    }
    function getKeyboardNavigationLabel(item) {
        // Filter out header vs. action
        if (item.kind === 'action') {
            return item.label;
        }
        return undefined;
    }
    let ActionList = class ActionList extends lifecycle_1.Disposable {
        constructor(user, preview, items, _delegate, _contextViewService, _keybindingService) {
            super();
            this._delegate = _delegate;
            this._contextViewService = _contextViewService;
            this._keybindingService = _keybindingService;
            this._actionLineHeight = 24;
            this._headerLineHeight = 26;
            this.cts = this._register(new cancellation_1.CancellationTokenSource());
            this.domNode = document.createElement('div');
            this.domNode.classList.add('actionList');
            const virtualDelegate = {
                getHeight: element => element.kind === "header" /* ActionListItemKind.Header */ ? this._headerLineHeight : this._actionLineHeight,
                getTemplateId: element => element.kind
            };
            this._list = this._register(new listWidget_1.List(user, this.domNode, virtualDelegate, [
                new ActionItemRenderer(preview, this._keybindingService),
                new HeaderRenderer(),
            ], {
                keyboardSupport: false,
                typeNavigationEnabled: true,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel },
                accessibilityProvider: {
                    getAriaLabel: element => {
                        if (element.kind === "action" /* ActionListItemKind.Action */) {
                            let label = element.label ? stripNewlines(element?.label) : '';
                            if (element.disabled) {
                                label = (0, nls_1.localize)({ key: 'customQuickFixWidget.labels', comment: [`Action widget labels for accessibility.`] }, "{0}, Disabled Reason: {1}", label, element.disabled);
                            }
                            return label;
                        }
                        return null;
                    },
                    getWidgetAriaLabel: () => (0, nls_1.localize)({ key: 'customQuickFixWidget', comment: [`An action widget option`] }, "Action Widget"),
                    getRole: (e) => e.kind === "action" /* ActionListItemKind.Action */ ? 'option' : 'separator',
                    getWidgetRole: () => 'listbox',
                },
            }));
            this._list.style(defaultStyles_1.defaultListStyles);
            this._register(this._list.onMouseClick(e => this.onListClick(e)));
            this._register(this._list.onMouseOver(e => this.onListHover(e)));
            this._register(this._list.onDidChangeFocus(() => this.onFocus()));
            this._register(this._list.onDidChangeSelection(e => this.onListSelection(e)));
            this._allMenuItems = items;
            this._list.splice(0, this._list.length, this._allMenuItems);
            if (this._list.length) {
                this.focusNext();
            }
        }
        focusCondition(element) {
            return !element.disabled && element.kind === "action" /* ActionListItemKind.Action */;
        }
        hide(didCancel) {
            this._delegate.onHide(didCancel);
            this.cts.cancel();
            this._contextViewService.hideContextView();
        }
        layout(minWidth) {
            // Updating list height, depending on how many separators and headers there are.
            const numHeaders = this._allMenuItems.filter(item => item.kind === 'header').length;
            const itemsHeight = this._allMenuItems.length * this._actionLineHeight;
            const heightWithHeaders = itemsHeight + numHeaders * this._headerLineHeight - numHeaders * this._actionLineHeight;
            this._list.layout(heightWithHeaders);
            let maxWidth = minWidth;
            if (this._allMenuItems.length >= 50) {
                maxWidth = 380;
            }
            else {
                // For finding width dynamically (not using resize observer)
                const itemWidths = this._allMenuItems.map((_, index) => {
                    const element = this.domNode.ownerDocument.getElementById(this._list.getElementID(index));
                    if (element) {
                        element.style.width = 'auto';
                        const width = element.getBoundingClientRect().width;
                        element.style.width = '';
                        return width;
                    }
                    return 0;
                });
                // resize observer - can be used in the future since list widget supports dynamic height but not width
                maxWidth = Math.max(...itemWidths, minWidth);
            }
            const maxVhPrecentage = 0.7;
            const height = Math.min(heightWithHeaders, this.domNode.ownerDocument.body.clientHeight * maxVhPrecentage);
            this._list.layout(height, maxWidth);
            this.domNode.style.height = `${height}px`;
            this._list.domFocus();
            return maxWidth;
        }
        focusPrevious() {
            this._list.focusPrevious(1, true, undefined, this.focusCondition);
        }
        focusNext() {
            this._list.focusNext(1, true, undefined, this.focusCondition);
        }
        acceptSelected(preview) {
            const focused = this._list.getFocus();
            if (focused.length === 0) {
                return;
            }
            const focusIndex = focused[0];
            const element = this._list.element(focusIndex);
            if (!this.focusCondition(element)) {
                return;
            }
            const event = preview ? new PreviewSelectedEvent() : new AcceptSelectedEvent();
            this._list.setSelection([focusIndex], event);
        }
        onListSelection(e) {
            if (!e.elements.length) {
                return;
            }
            const element = e.elements[0];
            if (element.item && this.focusCondition(element)) {
                this._delegate.onSelect(element.item, e.browserEvent instanceof PreviewSelectedEvent);
            }
            else {
                this._list.setSelection([]);
            }
        }
        onFocus() {
            const focused = this._list.getFocus();
            if (focused.length === 0) {
                return;
            }
            const focusIndex = focused[0];
            const element = this._list.element(focusIndex);
            this._delegate.onFocus?.(element.item);
        }
        async onListHover(e) {
            const element = e.element;
            if (element && element.item && this.focusCondition(element)) {
                if (this._delegate.onHover && !element.disabled && element.kind === "action" /* ActionListItemKind.Action */) {
                    const result = await this._delegate.onHover(element.item, this.cts.token);
                    element.canPreview = result ? result.canPreview : undefined;
                }
                if (e.index) {
                    this._list.splice(e.index, 1, [element]);
                }
            }
            this._list.setFocus(typeof e.index === 'number' ? [e.index] : []);
        }
        onListClick(e) {
            if (e.element && this.focusCondition(e.element)) {
                this._list.setFocus([]);
            }
        }
    };
    exports.ActionList = ActionList;
    exports.ActionList = ActionList = __decorate([
        __param(4, contextView_1.IContextViewService),
        __param(5, keybinding_1.IKeybindingService)
    ], ActionList);
    function stripNewlines(str) {
        return str.replace(/\r\n|\r|\n/g, ' ');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uTGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjdGlvbldpZGdldC9icm93c2VyL2FjdGlvbkxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQXFCYSxRQUFBLDJCQUEyQixHQUFHLDBCQUEwQixDQUFDO0lBQ3pELFFBQUEsNEJBQTRCLEdBQUcsMkJBQTJCLENBQUM7SUEwQnhFLElBQWtCLGtCQUdqQjtJQUhELFdBQWtCLGtCQUFrQjtRQUNuQyx1Q0FBaUIsQ0FBQTtRQUNqQix1Q0FBaUIsQ0FBQTtJQUNsQixDQUFDLEVBSGlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBR25DO0lBT0QsTUFBTSxjQUFjO1FBRW5CLElBQUksVUFBVSxLQUFhLGdEQUFpQyxDQUFDLENBQUM7UUFFOUQsY0FBYyxDQUFDLFNBQXNCO1lBQ3BDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRXhDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV2QixPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBMkIsRUFBRSxNQUFjLEVBQUUsWUFBaUM7WUFDM0YsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQzVELENBQUM7UUFFRCxlQUFlLENBQUMsYUFBa0M7WUFDakQsT0FBTztRQUNSLENBQUM7S0FDRDtJQUVELElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQWtCO1FBRXZCLElBQUksVUFBVSxL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