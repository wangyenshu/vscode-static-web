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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/arrays", "vs/base/common/event", "vs/editor/browser/services/codeEditorService", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService"], function (require, exports, dom, window_1, arrays_1, event_1, codeEditorService_1, extensions_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorScopedLayoutService = void 0;
    let StandaloneLayoutService = class StandaloneLayoutService {
        get mainContainer() {
            return (0, arrays_1.firstOrDefault)(this._codeEditorService.listCodeEditors())?.getContainerDomNode() ?? window_1.mainWindow.document.body;
        }
        get activeContainer() {
            const activeCodeEditor = this._codeEditorService.getFocusedCodeEditor() ?? this._codeEditorService.getActiveCodeEditor();
            return activeCodeEditor?.getContainerDomNode() ?? this.mainContainer;
        }
        get mainContainerDimension() {
            return dom.getClientArea(this.mainContainer);
        }
        get activeContainerDimension() {
            return dom.getClientArea(this.activeContainer);
        }
        get containers() {
            return (0, arrays_1.coalesce)(this._codeEditorService.listCodeEditors().map(codeEditor => codeEditor.getContainerDomNode()));
        }
        getContainer() {
            return this.activeContainer;
        }
        whenContainerStylesLoaded() { return undefined; }
        focus() {
            this._codeEditorService.getFocusedCodeEditor()?.focus();
        }
        constructor(_codeEditorService) {
            this._codeEditorService = _codeEditorService;
            this.onDidLayoutMainContainer = event_1.Event.None;
            this.onDidLayoutActiveContainer = event_1.Event.None;
            this.onDidLayoutContainer = event_1.Event.None;
            this.onDidChangeActiveContainer = event_1.Event.None;
            this.onDidAddContainer = event_1.Event.None;
            this.mainContainerOffset = { top: 0, quickPickTop: 0 };
            this.activeContainerOffset = { top: 0, quickPickTop: 0 };
        }
    };
    StandaloneLayoutService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], StandaloneLayoutService);
    let EditorScopedLayoutService = class EditorScopedLayoutService extends StandaloneLayoutService {
        get mainContainer() {
            return this._container;
        }
        constructor(_container, codeEditorService) {
            super(codeEditorService);
            this._container = _container;
        }
    };
    exports.EditorScopedLayoutService = EditorScopedLayoutService;
    exports.EditorScopedLayoutService = EditorScopedLayoutService = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService)
    ], EditorScopedLayoutService);
    (0, extensions_1.registerSingleton)(layoutService_1.ILayoutService, StandaloneLayoutService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUxheW91dFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3Ivc3RhbmRhbG9uZS9icm93c2VyL3N0YW5kYWxvbmVMYXlvdXRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVoRyxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQVM1QixJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFBLHVCQUFjLEVBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxtQkFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDckgsQ0FBQztRQUVELElBQUksZUFBZTtZQUNsQixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBRXpILE9BQU8sZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQ3RFLENBQUM7UUFFRCxJQUFJLHNCQUFzQjtZQUN6QixPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFJLHdCQUF3QjtZQUMzQixPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFLRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUEsaUJBQVEsRUFBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hILENBQUM7UUFFRCxZQUFZO1lBQ1gsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFFRCx5QkFBeUIsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFFakQsS0FBSztZQUNKLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQ3pELENBQUM7UUFFRCxZQUNxQixrQkFBOEM7WUFBdEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQTFDMUQsNkJBQXdCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUN0QywrQkFBMEIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hDLHlCQUFvQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDbEMsK0JBQTBCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUN4QyxzQkFBaUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBb0IvQix3QkFBbUIsR0FBc0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNyRSwwQkFBcUIsR0FBc0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLEVBQUUsQ0FBQztRQWtCNUUsQ0FBQztLQUVMLENBQUE7SUFoREssdUJBQXVCO1FBNkMxQixXQUFBLHNDQUFrQixDQUFBO09BN0NmLHVCQUF1QixDQWdENUI7SUFFTSxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHVCQUF1QjtRQUNyRSxJQUFhLGFBQWE7WUFDekIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFDRCxZQUNTLFVBQXVCLEVBQ1gsaUJBQXFDO1lBRXpELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBSGpCLGVBQVUsR0FBVixVQUFVLENBQWE7UUFJaEMsQ0FBQztLQUNELENBQUE7SUFWWSw4REFBeUI7d0NBQXpCLHlCQUF5QjtRQU1uQyxXQUFBLHNDQUFrQixDQUFBO09BTlIseUJBQXlCLENBVXJDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyw4QkFBYyxFQUFFLHVCQUF1QixvQ0FBNEIsQ0FBQyJ9