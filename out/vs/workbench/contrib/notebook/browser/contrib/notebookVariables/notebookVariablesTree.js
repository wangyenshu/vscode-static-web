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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/nls", "vs/platform/hover/browser/hover", "vs/platform/list/browser/listService", "vs/workbench/contrib/debug/browser/baseDebugView"], function (require, exports, dom, lifecycle_1, nls_1, hover_1, listService_1, baseDebugView_1) {
    "use strict";
    var NotebookVariableRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVariableAccessibilityProvider = exports.NotebookVariableRenderer = exports.NotebookVariablesDelegate = exports.NotebookVariablesTree = void 0;
    const $ = dom.$;
    const MAX_VALUE_RENDER_LENGTH_IN_VIEWLET = 1024;
    class NotebookVariablesTree extends listService_1.WorkbenchObjectTree {
    }
    exports.NotebookVariablesTree = NotebookVariablesTree;
    class NotebookVariablesDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return NotebookVariableRenderer.ID;
        }
    }
    exports.NotebookVariablesDelegate = NotebookVariablesDelegate;
    let NotebookVariableRenderer = class NotebookVariableRenderer {
        static { NotebookVariableRenderer_1 = this; }
        static { this.ID = 'variableElement'; }
        get templateId() {
            return NotebookVariableRenderer_1.ID;
        }
        constructor(_hoverService) {
            this._hoverService = _hoverService;
        }
        renderTemplate(container) {
            const expression = dom.append(container, $('.expression'));
            const name = dom.append(expression, $('span.name'));
            const value = dom.append(expression, $('span.value'));
            const template = { expression, name, value, elementDisposables: new lifecycle_1.DisposableStore() };
            return template;
        }
        renderElement(element, _index, data) {
            const text = element.element.value.trim() !== '' ? `${element.element.name}:` : element.element.name;
            data.name.textContent = text;
            data.name.title = element.element.type ?? '';
            (0, baseDebugView_1.renderExpressionValue)(element.element, data.value, {
                colorize: true,
                hover: data.elementDisposables,
                maxValueLength: MAX_VALUE_RENDER_LENGTH_IN_VIEWLET
            }, this._hoverService);
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
        }
    };
    exports.NotebookVariableRenderer = NotebookVariableRenderer;
    exports.NotebookVariableRenderer = NotebookVariableRenderer = NotebookVariableRenderer_1 = __decorate([
        __param(0, hover_1.IHoverService)
    ], NotebookVariableRenderer);
    class NotebookVariableAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('debugConsole', "Notebook Variables");
        }
        getAriaLabel(element) {
            return (0, nls_1.localize)('notebookVariableAriaLabel', "Variable {0}, value {1}", element.name, element.value);
        }
    }
    exports.NotebookVariableAccessibilityProvider = NotebookVariableAccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZXNUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL25vdGVib29rVmFyaWFibGVzL25vdGVib29rVmFyaWFibGVzVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDaEIsTUFBTSxrQ0FBa0MsR0FBRyxJQUFJLENBQUM7SUFFaEQsTUFBYSxxQkFBc0IsU0FBUSxpQ0FBNkM7S0FBSTtJQUE1RixzREFBNEY7SUFFNUYsTUFBYSx5QkFBeUI7UUFFckMsU0FBUyxDQUFDLE9BQWlDO1lBQzFDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUFpQztZQUM5QyxPQUFPLHdCQUF3QixDQUFDLEVBQUUsQ0FBQztRQUNwQyxDQUFDO0tBQ0Q7SUFURCw4REFTQztJQVNNLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXdCOztpQkFFcEIsT0FBRSxHQUFHLGlCQUFpQixBQUFwQixDQUFxQjtRQUV2QyxJQUFJLFVBQVU7WUFDYixPQUFPLDBCQUF3QixDQUFDLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsWUFDaUMsYUFBNEI7WUFBNUIsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFFN0QsQ0FBQztRQUVELGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUV0RCxNQUFNLFFBQVEsR0FBMEIsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxJQUFJLDJCQUFlLEVBQUUsRUFBRSxDQUFDO1lBRS9HLE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBd0QsRUFBRSxNQUFjLEVBQUUsSUFBMkI7WUFDbEgsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ3JHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7WUFFN0MsSUFBQSxxQ0FBcUIsRUFBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ2xELFFBQVEsRUFBRSxJQUFJO2dCQUNkLEtBQUssRUFBRSxJQUFJLENBQUMsa0JBQWtCO2dCQUM5QixjQUFjLEVBQUUsa0NBQWtDO2FBQ2xELEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFRCxjQUFjLENBQUMsT0FBd0QsRUFBRSxLQUFhLEVBQUUsWUFBbUMsRUFBRSxNQUEwQjtZQUN0SixZQUFZLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekMsQ0FBQztRQUdELGVBQWUsQ0FBQyxZQUFtQztZQUNsRCxZQUFZLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0MsQ0FBQzs7SUExQ1csNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFTbEMsV0FBQSxxQkFBYSxDQUFBO09BVEgsd0JBQXdCLENBMkNwQztJQUVELE1BQWEscUNBQXFDO1FBRWpELGtCQUFrQjtZQUNqQixPQUFPLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxZQUFZLENBQUMsT0FBaUM7WUFDN0MsT0FBTyxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSx5QkFBeUIsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RyxDQUFDO0tBQ0Q7SUFURCxzRkFTQyJ9