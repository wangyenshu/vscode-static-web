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
define(["require", "exports", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/product/common/productService", "vs/workbench/services/issue/common/issue", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle"], function (require, exports, nls_1, actionCommonCategories_1, actions_1, commands_1, productService_1, issue_1, configuration_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseIssueContribution = void 0;
    const OpenIssueReporterActionId = 'workbench.action.openIssueReporter';
    const OpenIssueReporterApiId = 'vscode.openIssueReporter';
    const OpenIssueReporterCommandMetadata = {
        description: 'Open the issue reporter and optionally prefill part of the form.',
        args: [
            {
                name: 'options',
                description: 'Data to use to prefill the issue reporter with.',
                isOptional: true,
                schema: {
                    oneOf: [
                        {
                            type: 'string',
                            description: 'The extension id to preselect.'
                        },
                        {
                            type: 'object',
                            properties: {
                                extensionId: {
                                    type: 'string'
                                },
                                issueTitle: {
                                    type: 'string'
                                },
                                issueBody: {
                                    type: 'string'
                                }
                            }
                        }
                    ]
                }
            },
        ]
    };
    let BaseIssueContribution = class BaseIssueContribution extends lifecycle_1.Disposable {
        constructor(productService, configurationService) {
            super();
            if (!productService.reportIssueUrl) {
                return;
            }
            this._register(commands_1.CommandsRegistry.registerCommand({
                id: OpenIssueReporterActionId,
                handler: function (accessor, args) {
                    const data = typeof args === 'string'
                        ? { extensionId: args }
                        : Array.isArray(args)
                            ? { extensionId: args[0] }
                            : args ?? {};
                    return accessor.get(issue_1.IWorkbenchIssueService).openReporter(data);
                },
                metadata: OpenIssueReporterCommandMetadata
            }));
            this._register(commands_1.CommandsRegistry.registerCommand({
                id: OpenIssueReporterApiId,
                handler: function (accessor, args) {
                    const data = typeof args === 'string'
                        ? { extensionId: args }
                        : Array.isArray(args)
                            ? { extensionId: args[0] }
                            : args ?? {};
                    return accessor.get(issue_1.IWorkbenchIssueService).openReporter(data);
                },
                metadata: OpenIssueReporterCommandMetadata
            }));
            const reportIssue = {
                id: OpenIssueReporterActionId,
                title: (0, nls_1.localize2)({ key: 'reportIssueInEnglish', comment: ['Translate this to "Report Issue in English" in all languages please!'] }, "Report Issue..."),
                category: actionCommonCategories_1.Categories.Help
            };
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: reportIssue }));
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarHelpMenu, {
                group: '3_feedback',
                command: {
                    id: OpenIssueReporterActionId,
                    title: (0, nls_1.localize)({ key: 'miReportIssue', comment: ['&& denotes a mnemonic', 'Translate this to "Report Issue in English" in all languages please!'] }, "Report &&Issue")
                },
                order: 3
            }));
        }
    };
    exports.BaseIssueContribution = BaseIssueContribution;
    exports.BaseIssueContribution = BaseIssueContribution = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService)
    ], BaseIssueContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWUuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaXNzdWUvY29tbW9uL2lzc3VlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEcsTUFBTSx5QkFBeUIsR0FBRyxvQ0FBb0MsQ0FBQztJQUN2RSxNQUFNLHNCQUFzQixHQUFHLDBCQUEwQixDQUFDO0lBRTFELE1BQU0sZ0NBQWdDLEdBQXFCO1FBQzFELFdBQVcsRUFBRSxrRUFBa0U7UUFDL0UsSUFBSSxFQUFFO1lBQ0w7Z0JBQ0MsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLGlEQUFpRDtnQkFDOUQsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLE1BQU0sRUFBRTtvQkFDUCxLQUFLLEVBQUU7d0JBQ047NEJBQ0MsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLGdDQUFnQzt5QkFDN0M7d0JBQ0Q7NEJBQ0MsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsVUFBVSxFQUFFO2dDQUNYLFdBQVcsRUFBRTtvQ0FDWixJQUFJLEVBQUUsUUFBUTtpQ0FDZDtnQ0FDRCxVQUFVLEVBQUU7b0NBQ1gsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7Z0NBQ0QsU0FBUyxFQUFFO29DQUNWLElBQUksRUFBRSxRQUFRO2lDQUNkOzZCQUNEO3lCQUVEO3FCQUNEO2lCQUNEO2FBQ0Q7U0FDRDtLQUNELENBQUM7SUFTSyxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBQ3BELFlBQ2tCLGNBQStCLEVBQ3pCLG9CQUEyQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQywyQkFBZ0IsQ0FBQyxlQUFlLENBQUM7Z0JBQy9DLEVBQUUsRUFBRSx5QkFBeUI7Z0JBQzdCLE9BQU8sRUFBRSxVQUFVLFFBQVEsRUFBRSxJQUFnRDtvQkFDNUUsTUFBTSxJQUFJLEdBQ1QsT0FBTyxJQUFJLEtBQUssUUFBUTt3QkFDdkIsQ0FBQyxDQUFDLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRTt3QkFDdkIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDOzRCQUNwQixDQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUMxQixDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFFaEIsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFzQixDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoRSxDQUFDO2dCQUNELFFBQVEsRUFBRSxnQ0FBZ0M7YUFDMUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLDJCQUFnQixDQUFDLGVBQWUsQ0FBQztnQkFDL0MsRUFBRSxFQUFFLHNCQUFzQjtnQkFDMUIsT0FBTyxFQUFFLFVBQVUsUUFBUSxFQUFFLElBQWdEO29CQUM1RSxNQUFNLElBQUksR0FDVCxPQUFPLElBQUksS0FBSyxRQUFRO3dCQUN2QixDQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFO3dCQUN2QixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7NEJBQ3BCLENBQUMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7NEJBQzFCLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO29CQUVoQixPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQXNCLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hFLENBQUM7Z0JBQ0QsUUFBUSxFQUFFLGdDQUFnQzthQUMxQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sV0FBVyxHQUFtQjtnQkFDbkMsRUFBRSxFQUFFLHlCQUF5QjtnQkFDN0IsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLHNCQUFzQixFQUFFLE9BQU8sRUFBRSxDQUFDLHNFQUFzRSxDQUFDLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQztnQkFDdkosUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTthQUN6QixDQUFDO1lBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGNBQWMsRUFBRSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFN0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGVBQWUsRUFBRTtnQkFDbEUsS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLE9BQU8sRUFBRTtvQkFDUixFQUFFLEVBQUUseUJBQXlCO29CQUM3QixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixFQUFFLHNFQUFzRSxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQztpQkFDdks7Z0JBQ0QsS0FBSyxFQUFFLENBQUM7YUFDUixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBMURZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBRS9CLFdBQUEsZ0NBQWUsQ0FBQTtRQUNmLFdBQUEscUNBQXFCLENBQUE7T0FIWCxxQkFBcUIsQ0EwRGpDIn0=