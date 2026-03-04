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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/storage/common/storage", "vs/workbench/services/environment/browser/environmentService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/editor/browser/services/codeEditorService", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/contrib/welcomeDialog/browser/welcomeWidget", "vs/platform/telemetry/common/telemetry", "vs/platform/opener/common/opener", "vs/platform/configuration/common/configurationRegistry", "vs/nls", "vs/workbench/common/configuration", "vs/base/common/async", "vs/workbench/services/editor/common/editorService"], function (require, exports, platform_1, contributions_1, storage_1, environmentService_1, configuration_1, lifecycle_1, contextkey_1, codeEditorService_1, instantiation_1, commands_1, welcomeWidget_1, telemetry_1, opener_1, configurationRegistry_1, nls_1, configuration_2, async_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configurationKey = 'workbench.welcome.experimental.dialog';
    let WelcomeDialogContribution = class WelcomeDialogContribution extends lifecycle_1.Disposable {
        constructor(storageService, environmentService, configurationService, contextService, codeEditorService, instantiationService, commandService, telemetryService, openerService, editorService) {
            super();
            this.isRendered = false;
            if (!storageService.isNew(-1 /* StorageScope.APPLICATION */)) {
                return; // do not show if this is not the first session
            }
            const setting = configurationService.inspect(configurationKey);
            if (!setting.value) {
                return;
            }
            const welcomeDialog = environmentService.options?.welcomeDialog;
            if (!welcomeDialog) {
                return;
            }
            this._register(editorService.onDidActiveEditorChange(() => {
                if (!this.isRendered) {
                    const codeEditor = codeEditorService.getActiveCodeEditor();
                    if (codeEditor?.hasModel()) {
                        const scheduler = new async_1.RunOnceScheduler(() => {
                            const notificationsVisible = contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize('notificationCenterVisible')) ||
                                contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize('notificationToastsVisible'));
                            if (codeEditor === codeEditorService.getActiveCodeEditor() && !notificationsVisible) {
                                this.isRendered = true;
                                const welcomeWidget = new welcomeWidget_1.WelcomeWidget(codeEditor, instantiationService, commandService, telemetryService, openerService);
                                welcomeWidget.render(welcomeDialog.title, welcomeDialog.message, welcomeDialog.buttonText, welcomeDialog.buttonCommand);
                            }
                        }, 3000);
                        this._register(codeEditor.onDidChangeModelContent((e) => {
                            if (!this.isRendered) {
                                scheduler.schedule();
                            }
                        }));
                    }
                }
            }));
        }
    };
    WelcomeDialogContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, commands_1.ICommandService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, opener_1.IOpenerService),
        __param(9, editorService_1.IEditorService)
    ], WelcomeDialogContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WelcomeDialogContribution, 4 /* LifecyclePhase.Eventually */);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        ...configuration_2.applicationConfigurationNodeBase,
        properties: {
            'workbench.welcome.experimental.dialog': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'boolean',
                default: false,
                tags: ['experimental'],
                description: (0, nls_1.localize)('workbench.welcome.dialog', "When enabled, a welcome widget is shown in the editor")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VsY29tZURpYWxvZy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lRGlhbG9nL2Jyb3dzZXIvd2VsY29tZURpYWxvZy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFzQmhHLE1BQU0sZ0JBQWdCLEdBQUcsdUNBQXVDLENBQUM7SUFFakUsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTtRQUlqRCxZQUNrQixjQUErQixFQUNYLGtCQUF1RCxFQUNyRSxvQkFBMkMsRUFDOUMsY0FBa0MsRUFDbEMsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUNqRCxjQUErQixFQUM3QixnQkFBbUMsRUFDdEMsYUFBNkIsRUFDN0IsYUFBNkI7WUFFN0MsS0FBSyxFQUFFLENBQUM7WUFkRCxlQUFVLEdBQUcsS0FBSyxDQUFDO1lBZ0IxQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssbUNBQTBCLEVBQUUsQ0FBQztnQkFDckQsT0FBTyxDQUFDLCtDQUErQztZQUN4RCxDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxDQUFVLGdCQUFnQixDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDcEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDO1lBQ2hFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDcEIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3pELElB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