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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/common/memento", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/browser/actions/chatClear", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParticipantContribTypes"], function (require, exports, contextkey_1, instantiation_1, serviceCollection_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, editorPane_1, memento_1, chatEditorInput_1, chatWidget_1, chatClear_1, chatAgents_1, chatParticipantContribTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatEditor = void 0;
    let ChatEditor = class ChatEditor extends editorPane_1.EditorPane {
        get scopedContextKeyService() {
            return this._scopedContextKeyService;
        }
        constructor(group, telemetryService, themeService, instantiationService, storageService, contextKeyService) {
            super(chatEditorInput_1.ChatEditorInput.EditorID, group, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.contextKeyService = contextKeyService;
        }
        async clear() {
            return this.instantiationService.invokeFunction(chatClear_1.clearChatEditor);
        }
        createEditor(parent) {
            this._scopedContextKeyService = this._register(this.contextKeyService.createScoped(parent));
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService]));
            this.widget = this._register(scopedInstantiationService.createInstance(chatWidget_1.ChatWidget, chatAgents_1.ChatAgentLocation.Panel, { resource: true }, { supportsFileReferences: true }, {
                listForeground: colorRegistry_1.editorForeground,
                listBackground: colorRegistry_1.editorBackground,
                inputEditorBackground: colorRegistry_1.inputBackground,
                resultEditorBackground: colorRegistry_1.editorBackground
            }));
            this._register(this.widget.onDidClear(() => this.clear()));
            this.widget.render(parent);
            this.widget.setVisible(true);
        }
        focus() {
            super.focus();
            this.widget?.focusInput();
        }
        clearInput() {
            this.saveState();
            super.clearInput();
        }
        async setInput(input, options, context, token) {
            super.setInput(input, options, context, token);
            const editorModel = await input.resolve();
            if (!editorModel) {
                throw new Error(`Failed to get model for chat editor. id: ${input.sessionId}`);
            }
            if (!this.widget) {
                throw new Error('ChatEditor lifecycle issue: no editor widget');
            }
            this.updateModel(editorModel.model, options?.viewState ?? input.options.viewState);
        }
        updateModel(model, viewState) {
            this._memento = new memento_1.Memento('interactive-session-editor-' + chatParticipantContribTypes_1.CHAT_PROVIDER_ID, this.storageService);
            this._viewState = viewState ?? this._memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            this.widget.setModel(model, { ...this._viewState });
        }
        saveState() {
            this.widget?.saveState();
            if (this._memento && this._viewState) {
                const widgetViewState = this.widget.getViewState();
                this._viewState.inputValue = widgetViewState.inputValue;
                this._memento.saveMemento();
            }
        }
        layout(dimension, position) {
            if (this.widget) {
                this.widget.layout(dimension.height, dimension.width);
            }
        }
    };
    exports.ChatEditor = ChatEditor;
    exports.ChatEditor = ChatEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, contextkey_1.IContextKeyService)
    ], ChatEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0RWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxVQUFVLEdBQWhCLE1BQU0sVUFBVyxTQUFRLHVCQUFVO1FBSXpDLElBQWEsdUJBQXVCO1lBQ25DLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDO1FBQ3RDLENBQUM7UUFLRCxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ0Ysb0JBQTJDLEVBQ2pELGNBQStCLEVBQzVCLGlCQUFxQztZQUUxRSxLQUFLLENBQUMsaUNBQWUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUovQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUM1QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1FBRzNFLENBQUM7UUFFTSxLQUFLLENBQUMsS0FBSztZQUNqQixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkJBQWUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFa0IsWUFBWSxDQUFDLE1BQW1CO1lBQ2xELElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUM1RixNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLCtCQUFrQixFQUFFLElBQUks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