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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/workbench/common/views"], function (require, exports, event_1, lifecycle_1, configuration_1, themeService_1, views_1) {
    "use strict";
    var ChatEditorOptions_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatEditorOptions = void 0;
    let ChatEditorOptions = class ChatEditorOptions extends lifecycle_1.Disposable {
        static { ChatEditorOptions_1 = this; }
        static { this.lineHeightEm = 1.4; }
        get configuration() {
            return this._config;
        }
        static { this.relevantSettingIds = [
            'chat.editor.lineHeight',
            'chat.editor.fontSize',
            'chat.editor.fontFamily',
            'chat.editor.fontWeight',
            'chat.editor.wordWrap',
            'editor.cursorBlinking',
            'editor.fontLigatures',
            'editor.accessibilitySupport',
            'editor.bracketPairColorization.enabled',
            'editor.bracketPairColorization.independentColorPoolPerBracketType',
        ]; }
        constructor(viewId, foreground, inputEditorBackgroundColor, resultEditorBackgroundColor, configurationService, themeService, viewDescriptorService) {
            super();
            this.foreground = foreground;
            this.inputEditorBackgroundColor = inputEditorBackgroundColor;
            this.resultEditorBackgroundColor = resultEditorBackgroundColor;
            this.configurationService = configurationService;
            this.themeService = themeService;
            this.viewDescriptorService = viewDescriptorService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(this.themeService.onDidColorThemeChange(e => this.update()));
            this._register(this.viewDescriptorService.onDidChangeLocation(e => {
                if (e.views.some(v => v.id === viewId)) {
                    this.update();
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (ChatEditorOptions_1.relevantSettingIds.some(id => e.affectsConfiguration(id))) {
                    this.update();
                }
            }));
            this.update();
        }
        update() {
            const editorConfig = this.configurationService.getValue('editor');
            // TODO shouldn't the setting keys be more specific?
            const chatEditorConfig = this.configurationService.getValue('chat')?.editor;
            const accessibilitySupport = this.configurationService.getValue('editor.accessibilitySupport');
            this._config = {
                foreground: this.themeService.getColorTheme().getColor(this.foreground),
                inputEditor: {
                    backgroundColor: this.themeService.getColorTheme().getColor(this.inputEditorBackgroundColor),
                    accessibilitySupport,
                },
                resultEditor: {
                    backgroundColor: this.themeService.getColorTheme().getColor(this.resultEditorBackgroundColor),
                    fontSize: chatEditorConfig.fontSize,
                    fontFamily: chatEditorConfig.fontFamily === 'default' ? editorConfig.fontFamily : chatEditorConfig.fontFamily,
                    fontWeight: chatEditorConfig.fontWeight,
                    lineHeight: chatEditorConfig.lineHeight ? chatEditorConfig.lineHeight : ChatEditorOptions_1.lineHeightEm * chatEditorConfig.fontSize,
                    bracketPairColorization: {
                        enabled: this.configurationService.getValue('editor.bracketPairColorization.enabled'),
                        independentColorPoolPerBracketType: this.configurationService.getValue('editor.bracketPairColorization.independentColorPoolPerBracketType'),
                    },
                    wordWrap: chatEditorConfig.wordWrap,
                    fontLigatures: editorConfig.fontLigatures,
                }
            };
            this._onDidChange.fire();
        }
    };
    exports.ChatEditorOptions = ChatEditorOptions;
    exports.ChatEditorOptions = ChatEditorOptions = ChatEditorOptions_1 = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, views_1.IViewDescriptorService)
    ], ChatEditorOptions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY2hhdE9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStDekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxzQkFBVTs7aUJBQ3hCLGlCQUFZLEdBQUcsR0FBRyxBQUFOLENBQU87UUFNM0MsSUFBVyxhQUFhO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO2lCQUV1Qix1QkFBa0IsR0FBRztZQUM1Qyx3QkFBd0I7WUFDeEIsc0JBQXNCO1lBQ3RCLHdCQUF3QjtZQUN4Qix3QkFBd0I7WUFDeEIsc0JBQXNCO1lBQ3RCLHVCQUF1QjtZQUN2QixzQkFBc0I7WUFDdEIsNkJBQTZCO1lBQzdCLHdDQUF3QztZQUN4QyxtRUFBbUU7U0FDbkUsQUFYeUMsQ0FXeEM7UUFFRixZQUNDLE1BQTBCLEVBQ1QsVUFBa0IsRUFDbEIsMEJBQWtDLEVBQ2xDLDJCQUFtQyxFQUM3QixvQkFBNEQsRUFDcEUsWUFBNEMsRUFDbkMscUJBQThEO1lBRXRGLEtBQUssRUFBRSxDQUFDO1lBUFMsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNsQiwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQVE7WUFDbEMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFRO1lBQ1oseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNsQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBNUJ0RSxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELGdCQUFXLEdB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