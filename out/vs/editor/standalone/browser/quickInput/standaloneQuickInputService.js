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
define(["require", "exports", "vs/base/common/event", "vs/editor/browser/editorExtensions", "vs/platform/theme/common/themeService", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/editor/standalone/browser/standaloneLayoutService", "vs/editor/browser/services/codeEditorService", "vs/platform/quickinput/browser/quickInputService", "vs/base/common/functional", "vs/platform/configuration/common/configuration", "vs/css!./standaloneQuickInput"], function (require, exports, event_1, editorExtensions_1, themeService_1, cancellation_1, instantiation_1, contextkey_1, standaloneLayoutService_1, codeEditorService_1, quickInputService_1, functional_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputEditorWidget = exports.QuickInputEditorContribution = exports.StandaloneQuickInputService = void 0;
    let EditorScopedQuickInputService = class EditorScopedQuickInputService extends quickInputService_1.QuickInputService {
        constructor(editor, instantiationService, contextKeyService, themeService, codeEditorService, configurationService) {
            super(instantiationService, contextKeyService, themeService, new standaloneLayoutService_1.EditorScopedLayoutService(editor.getContainerDomNode(), codeEditorService), configurationService);
            this.host = undefined;
            // Use the passed in code editor as host for the quick input widget
            const contribution = QuickInputEditorContribution.get(editor);
            if (contribution) {
                const widget = contribution.widget;
                this.host = {
                    _serviceBrand: undefined,
                    get mainContainer() { return widget.getDomNode(); },
                    getContainer() { return widget.getDomNode(); },
                    whenContainerStylesLoaded() { return undefined; },
                    get containers() { return [widget.getDomNode()]; },
                    get activeContainer() { return widget.getDomNode(); },
                    get mainContainerDimension() { return editor.getLayoutInfo(); },
                    get activeContainerDimension() { return editor.getLayoutInfo(); },
                    get onDidLayoutMainContainer() { return editor.onDidLayoutChange; },
                    get onDidLayoutActiveContainer() { return editor.onDidLayoutChange; },
                    get onDidLayoutContainer() { return event_1.Event.map(editor.onDidLayoutChange, dimension => ({ container: widget.getDomNode(), dimension })); },
                    get onDidChangeActiveContainer() { return event_1.Event.None; },
                    get onDidAddContainer() { return event_1.Event.None; },
                    get mainContainerOffset() { return { top: 0, quickPickTop: 0 }; },
                    get activeContainerOffset() { return { top: 0, quickPickTop: 0 }; },
                    focus: () => editor.focus()
                };
            }
            else {
                this.host = undefined;
            }
        }
        createController() {
            return super.createController(this.host);
        }
    };
    EditorScopedQuickInputService = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, configuration_1.IConfigurationService)
    ], EditorScopedQuickInputService);
    let StandaloneQuickInputService = class StandaloneQuickInputService {
        get activeService() {
            const editor = this.codeEditorService.getFocusedCodeEditor();
            if (!editor) {
                throw new Error('Quick input service needs a focused editor to work.');
            }
            // Find the quick input implementation for the focused
            // editor or create it lazily if not yet created
            let quickInputService = this.mapEditorToService.get(editor);
            if (!quickInputService) {
                const newQuickInputService = quickInputService = this.instantiationService.createInstance(EditorScopedQuickInputService, editor);
                this.mapEditorToService.set(editor, quickInputService);
                (0, functional_1.createSingleCallFunction)(editor.onDidDispose)(() => {
                    newQuickInputService.dispose();
                    this.mapEditorToService.delete(editor);
                });
            }
            return quickInputService;
        }
        get quickAccess() { return this.activeService.quickAccess; }
        get backButton() { return this.activeService.backButton; }
        get onShow() { return this.activeService.onShow; }
        get onHide() { return this.activeService.onHide; }
        constructor(instantiationService, codeEditorService) {
            this.instantiationService = instantiationService;
            this.codeEditorService = codeEditorService;
            this.mapEditorToService = new Map();
        }
        pick(picks, options = {}, token = cancellation_1.CancellationToken.None) {
            return this.activeService /* TS fail */.pick(picks, options, token);
        }
        input(options, token) {
            return this.activeService.input(options, token);
        }
        createQuickPick() {
            return this.activeService.createQuickPick();
        }
        createInputBox() {
            return this.activeService.createInputBox();
        }
        createQuickWidget() {
            return this.activeService.createQuickWidget();
        }
        focus() {
            return this.activeService.focus();
        }
        toggle() {
            return this.activeService.toggle();
        }
        navigate(next, quickNavigate) {
            return this.activeService.navigate(next, quickNavigate);
        }
        accept() {
            return this.activeService.accept();
        }
        back() {
            return this.activeService.back();
        }
        cancel() {
            return this.activeService.cancel();
        }
    };
    exports.StandaloneQuickInputService = StandaloneQuickInputService;
    exports.StandaloneQuickInputService = StandaloneQuickInputService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], StandaloneQuickInputService);
    class QuickInputEditorContribution {
        static { this.ID = 'editor.controller.quickInput'; }
        static get(editor) {
            return editor.getContribution(QuickInputEditorContribution.ID);
        }
        constructor(editor) {
            this.editor = editor;
            this.widget = new QuickInputEditorWidget(this.editor);
        }
        dispose() {
            this.widget.dispose();
        }
    }
    exports.QuickInputEditorContribution = QuickInputEditorContribution;
    class QuickInputEditorWidget {
        static { this.ID = 'editor.contrib.quickInputWidget'; }
        constructor(codeEditor) {
            this.codeEditor = codeEditor;
            this.domNode = document.createElement('div');
            this.codeEditor.addOverlayWidget(this);
        }
        getId() {
            return QuickInputEditorWidget.ID;
        }
        getDomNode() {
            return this.domNode;
        }
        getPosition() {
            return { preference: 2 /* OverlayWidgetPositionPreference.TOP_CENTER */ };
        }
        dispose() {
            this.codeEditor.removeOverlayWidget(this);
        }
    }
    exports.QuickInputEditorWidget = QuickInputEditorWidget;
    (0, editorExtensions_1.registerEditorContribution)(QuickInputEditorContribution.ID, QuickInputEditorContribution, 4 /* EditorContributionInstantiation.Lazy */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVF1aWNrSW5wdXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9xdWlja0lucHV0L3N0YW5kYWxvbmVRdWlja0lucHV0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEscUNBQWlCO1FBSTVELFlBQ0MsTUFBbUIsRUFDSSxvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQzFDLFlBQTJCLEVBQ3RCLGlCQUFxQyxFQUNsQyxvQkFBMkM7WUFFbEUsS0FBSyxDQUNKLG9CQUFvQixFQUNwQixpQkFBaUIsRUFDakIsWUFBWSxFQUNaLElBQUksbURBQXlCLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsaUJBQWlCLENBQUMsRUFDOUUsb0JBQW9CLENBQ3BCLENBQUM7WUFoQkssU0FBSSxHQUEwQyxTQUFTLENBQUM7WUFrQi9ELG1FQUFtRTtZQUNuRSxNQUFNLFlBQVksR0FBRyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUQsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztnQkFDbkMsSUFBSSxDQUFDLElBQUksR0FBRztvQkFDWCxhQUFhLEVBQUUsU0FBUztvQkFDeEIsSUFBSSxhQUFhLEtBQUssT0FBTyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNuRCxZQUFZLEtBQUssT0FBTyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM5Qyx5QkFBeUIsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENB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