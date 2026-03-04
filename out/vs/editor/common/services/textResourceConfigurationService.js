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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration"], function (require, exports, event_1, lifecycle_1, position_1, language_1, model_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceConfigurationService = void 0;
    let TextResourceConfigurationService = class TextResourceConfigurationService extends lifecycle_1.Disposable {
        constructor(configurationService, modelService, languageService) {
            super();
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.languageService = languageService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._register(this.configurationService.onDidChangeConfiguration(e => this._onDidChangeConfiguration.fire(this.toResourceConfigurationChangeEvent(e))));
        }
        getValue(resource, arg2, arg3) {
            if (typeof arg3 === 'string') {
                return this._getValue(resource, position_1.Position.isIPosition(arg2) ? arg2 : null, arg3);
            }
            return this._getValue(resource, null, typeof arg2 === 'string' ? arg2 : undefined);
        }
        updateValue(resource, key, value, configurationTarget) {
            const language = this.getLanguage(resource, null);
            const configurationValue = this.configurationService.inspect(key, { resource, overrideIdentifier: language });
            if (configurationTarget === undefined) {
                configurationTarget = this.deriveConfigurationTarget(configurationValue, language);
            }
            const overrideIdentifier = language && configurationValue.overrideIdentifiers?.includes(language) ? language : undefined;
            return this.configurationService.updateValue(key, value, { resource, overrideIdentifier }, configurationTarget);
        }
        deriveConfigurationTarget(configurationValue, language) {
            if (language) {
                if (configurationValue.memory?.override !== undefined) {
                    return 8 /* ConfigurationTarget.MEMORY */;
                }
                if (configurationValue.workspaceFolder?.override !== undefined) {
                    return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
                if (configurationValue.workspace?.override !== undefined) {
                    return 5 /* ConfigurationTarget.WORKSPACE */;
                }
                if (configurationValue.userRemote?.override !== undefined) {
                    return 4 /* ConfigurationTarget.USER_REMOTE */;
                }
                if (configurationValue.userLocal?.override !== undefined) {
                    return 3 /* ConfigurationTarget.USER_LOCAL */;
                }
            }
            if (configurationValue.memory?.value !== undefined) {
                return 8 /* ConfigurationTarget.MEMORY */;
            }
            if (configurationValue.workspaceFolder?.value !== undefined) {
                return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
            }
            if (configurationValue.workspace?.value !== undefined) {
                return 5 /* ConfigurationTarget.WORKSPACE */;
            }
            if (configurationValue.userRemote?.value !== undefined) {
                return 4 /* ConfigurationTarget.USER_REMOTE */;
            }
            return 3 /* ConfigurationTarget.USER_LOCAL */;
        }
        _getValue(resource, position, section) {
            const language = resource ? this.getLanguage(resource, position) : undefined;
            if (typeof section === 'undefined') {
                return this.configurationService.getValue({ resource, overrideIdentifier: language });
            }
            return this.configurationService.getValue(section, { resource, overrideIdentifier: language });
        }
        inspect(resource, position, section) {
            const language = resource ? this.getLanguage(resource, position) : undefined;
            return this.configurationService.inspect(section, { resource, overrideIdentifier: language });
        }
        getLanguage(resource, position) {
            const model = this.modelService.getModel(resource);
            if (model) {
                return position ? model.getLanguageIdAtPosition(position.lineNumber, position.column) : model.getLanguageId();
            }
            return this.languageService.guessLanguageIdByFilepathOrFirstLine(resource);
        }
        toResourceConfigurationChangeEvent(configurationChangeEvent) {
            return {
                affectedKeys: configurationChangeEvent.affectedKeys,
                affectsConfiguration: (resource, configuration) => {
                    const overrideIdentifier = resource ? this.getLanguage(resource, null) : undefined;
                    return configurationChangeEvent.affectsConfiguration(configuration, { resource, overrideIdentifier });
                }
            };
        }
    };
    exports.TextResourceConfigurationService = TextResourceConfigurationService;
    exports.TextResourceConfigurationService = TextResourceConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], TextResourceConfigurationService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFJlc291cmNlQ29uZmlndXJhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL3RleHRSZXNvdXJjZUNvbmZpZ3VyYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLHNCQUFVO1FBTy9ELFlBQ3dCLG9CQUE0RCxFQUNwRSxZQUE0QyxFQUN6QyxlQUFrRDtZQUVwRSxLQUFLLEVBQUUsQ0FBQztZQUpnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ25ELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQU5wRCw4QkFBeUIsR0FBbUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBeUMsQ0FBQyxDQUFDO1lBQ2xKLDZCQUF3QixHQUFpRCxJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxDQUFDO1lBUTdILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUosQ0FBQztRQUlELFFBQVEsQ0FBSSxRQUF5QixFQUFFLElBQVUsRUFBRSxJQUFVO1lBQzVELElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzlCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsbUJBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxD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