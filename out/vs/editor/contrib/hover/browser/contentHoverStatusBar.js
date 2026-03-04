var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverWidget", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding"], function (require, exports, dom, hoverWidget_1, lifecycle_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorHoverStatusBar = void 0;
    const $ = dom.$;
    let EditorHoverStatusBar = class EditorHoverStatusBar extends lifecycle_1.Disposable {
        get hasContent() {
            return this._hasContent;
        }
        constructor(_keybindingService) {
            super();
            this._keybindingService = _keybindingService;
            this._hasContent = false;
            this.hoverElement = $('div.hover-row.status-bar');
            this.hoverElement.tabIndex = 0;
            this.actionsElement = dom.append(this.hoverElement, $('div.actions'));
        }
        addAction(actionOptions) {
            const keybinding = this._keybindingService.lookupKeybinding(actionOptions.commandId);
            const keybindingLabel = keybinding ? keybinding.getLabel() : null;
            this._hasContent = true;
            return this._register(hoverWidget_1.HoverAction.render(this.actionsElement, actionOptions, keybindingLabel));
        }
        append(element) {
            const result = dom.append(this.actionsElement, element);
            this._hasContent = true;
            return result;
        }
    };
    exports.EditorHoverStatusBar = EditorHoverStatusBar;
    exports.EditorHoverStatusBar = EditorHoverStatusBar = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], EditorHoverStatusBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudEhvdmVyU3RhdHVzQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaG92ZXIvYnJvd3Nlci9jb250ZW50SG92ZXJTdGF0dXNCYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQVVBLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFVCxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBTW5ELElBQVcsVUFBVTtZQUNwQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVELFlBQ3FCLGtCQUF1RDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQUY2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBUHBFLGdCQUFXLEdBQVksS0FBSyxDQUFDO1lBVXBDLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFTSxTQUFTLENBQ2YsYUFJQztZQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckYsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNsRSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMseUJBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBRU0sTUFBTSxDQUFDLE9BQW9CO1lBQ2pDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7S0FDRCxDQUFBO0lBckNZLG9EQUFvQjttQ0FBcEIsb0JBQW9CO1FBVzlCLFdBQUEsK0JBQWtCLENBQUE7T0FYUixvQkFBb0IsQ0FxQ2hDIn0=