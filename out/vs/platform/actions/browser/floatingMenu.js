/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry"], function (require, exports, dom_1, widget_1, event_1, lifecycle_1, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FloatingClickMenu = exports.AbstractFloatingClickMenu = exports.FloatingClickWidget = void 0;
    class FloatingClickWidget extends widget_1.Widget {
        constructor(label) {
            super();
            this.label = label;
            this._onClick = this._register(new event_1.Emitter());
            this.onClick = this._onClick.event;
            this._domNode = (0, dom_1.$)('.floating-click-widget');
            this._domNode.style.padding = '6px 11px';
            this._domNode.style.borderRadius = '2px';
            this._domNode.style.cursor = 'pointer';
            this._domNode.style.zIndex = '1';
        }
        getDomNode() {
            return this._domNode;
        }
        render() {
            (0, dom_1.clearNode)(this._domNode);
            this._domNode.style.backgroundColor = (0, colorRegistry_1.asCssVariableWithDefault)(colorRegistry_1.buttonBackground, (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorBackground));
            this._domNode.style.color = (0, colorRegistry_1.asCssVariableWithDefault)(colorRegistry_1.buttonForeground, (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorForeground));
            this._domNode.style.border = `1px solid ${(0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder)}`;
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('')).textContent = this.label;
            this.onclick(this._domNode, () => this._onClick.fire());
        }
    }
    exports.FloatingClickWidget = FloatingClickWidget;
    let AbstractFloatingClickMenu = class AbstractFloatingClickMenu extends lifecycle_1.Disposable {
        constructor(menuId, menuService, contextKeyService) {
            super();
            this.renderEmitter = new event_1.Emitter();
            this.onDidRender = this.renderEmitter.event;
            this.menu = this._register(menuService.createMenu(menuId, contextKeyService));
        }
        /** Should be called in implementation constructors after they initialized */
        render() {
            const menuDisposables = this._register(new lifecycle_1.DisposableStore());
            const renderMenuAsFloatingClickBtn = () => {
                menuDisposables.clear();
                if (!this.isVisible()) {
                    return;
                }
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { renderShortTitle: true, shouldForwardArgs: true }, actions);
                if (actions.length === 0) {
                    return;
                }
                // todo@jrieken find a way to handle N actions, like showing a context menu
                const [first] = actions;
                const widget = this.createWidget(first, menuDisposables);
                menuDisposables.add(widget);
                menuDisposables.add(widget.onClick(() => first.run(this.getActionArg())));
                widget.render();
            };
            this._register(this.menu.onDidChange(renderMenuAsFloatingClickBtn));
            renderMenuAsFloatingClickBtn();
        }
        getActionArg() {
            return undefined;
        }
        isVisible() {
            return true;
        }
    };
    exports.AbstractFloatingClickMenu = AbstractFloatingClickMenu;
    exports.AbstractFloatingClickMenu = AbstractFloatingClickMenu = __decorate([
        __param(1, actions_1.IMenuService),
        __param(2, contextkey_1.IContextKeyService)
    ], AbstractFloatingClickMenu);
    let FloatingClickMenu = class FloatingClickMenu extends AbstractFloatingClickMenu {
        constructor(options, instantiationService, menuService, contextKeyService) {
            super(options.menuId, menuService, contextKeyService);
            this.options = options;
            this.instantiationService = instantiationService;
            this.render();
        }
        createWidget(action, disposable) {
            const w = this.instantiationService.createInstance(FloatingClickWidget, action.label);
            const node = w.getDomNode();
            this.options.container.appendChild(node);
            disposable.add((0, lifecycle_1.toDisposable)(() => this.options.container.removeChild(node)));
            return w;
        }
        getActionArg() {
            return this.options.getActionArg();
        }
    };
    exports.FloatingClickMenu = FloatingClickMenu;
    exports.FloatingClickMenu = FloatingClickMenu = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService)
    ], FloatingClickMenu);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvYXRpbmdNZW51LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWN0aW9ucy9icm93c2VyL2Zsb2F0aW5nTWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhaEcsTUFBYSxtQkFBb0IsU0FBUSxlQUFNO1FBTzlDLFlBQW9CLEtBQWE7WUFDaEMsS0FBSyxFQUFFLENBQUM7WUFEVyxVQUFLLEdBQUwsS0FBSyxDQUFRO1lBTGhCLGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN2RCxZQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFPdEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLE9BQUMsRUFBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7WUFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUN6QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDbEMsQ0FBQztRQUVELFVBQVU7WUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFBLGVBQVMsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLElBQUEsd0NBQXdCLEVBQUMsZ0NBQWdCLEVBQUUsSUFBQSw2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