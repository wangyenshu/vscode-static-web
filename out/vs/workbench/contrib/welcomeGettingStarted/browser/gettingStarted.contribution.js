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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/editor", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedInput", "vs/workbench/common/contributions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/platform", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/welcomeGettingStarted/browser/startupPage", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/platform/action/common/actionCommonCategories", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedIcons"], function (require, exports, nls_1, gettingStarted_1, platform_1, editor_1, actions_1, instantiation_1, contextkey_1, editorService_1, editor_2, descriptors_1, gettingStartedService_1, gettingStartedInput_1, contributions_1, configurationRegistry_1, configuration_1, editorGroupsService_1, commands_1, quickInput_1, remoteAgentService_1, platform_2, extensionManagement_1, extensions_1, startupPage_1, extensionsInput_1, actionCommonCategories_1, icons) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacePlatform = exports.icons = void 0;
    exports.icons = icons;
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openWalkthrough',
                title: (0, nls_1.localize2)('miWelcome', 'Welcome'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '1_welcome',
                    order: 1,
                },
                metadata: {
                    description: (0, nls_1.localize2)('minWelcomeDescription', 'Opens a Walkthrough to help you get started in VS Code.')
                }
            });
        }
        run(accessor, walkthroughID, toSide) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const commandService = accessor.get(commands_1.ICommandService);
            if (walkthroughID) {
                const selectedCategory = typeof walkthroughID === 'string' ? walkthroughID : walkthroughID.category;
                const selectedStep = typeof walkthroughID === 'string' ? undefined : walkthroughID.category + '#' + walkthroughID.step;
                // We're trying to open the welcome page from the Help menu
                if (!selectedCategory && !selectedStep) {
                    editorService.openEditor({
                        resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                        options: { preserveFocus: toSide ?? false }
                    }, toSide ? editorService_1.SIDE_GROUP : undefined);
                    return;
                }
                // Try first to select the walkthrough on an active welcome page with no selected walkthrough
                for (const group of editorGroupsService.groups) {
                    if (group.activeEditor instanceof gettingStartedInput_1.GettingStartedInput) {
                        group.activeEditorPane.makeCategoryVisibleWhenAvailable(selectedCategory, selectedStep);
                        return;
                    }
                }
                // Otherwise, try to find a welcome input somewhere with no selected walkthrough, and open it to this one.
                const result = editorService.findEditors({ typeId: gettingStartedInput_1.GettingStartedInput.ID, editorId: undefined, resource: gettingStartedInput_1.GettingStartedInput.RESOURCE });
                for (const { editor, groupId } of result) {
                    if (editor instanceof gettingStartedInput_1.GettingStartedInput) {
                        const group = editorGroupsService.getGroup(groupId);
                        if (!editor.selectedCategory && group) {
                            editor.selectedCategory = selectedCategory;
                            editor.selectedStep = selectedStep;
                            group.openEditor(editor, { revealIfOpened: true });
                            return;
                        }
                    }
                }
                const activeEditor = editorService.activeEditor;
                // If the walkthrough is already open just reveal the step
                if (selectedStep && activeEditor instanceof gettingStartedInput_1.GettingStartedInput && activeEditor.selectedCategory === selectedCategory) {
                    commandService.executeCommand('walkthroughs.selectStep', selectedStep);
                    return;
                }
                // If it's the extension install page then lets replace it with the getting started page
                if (activeEditor instanceof extensionsInput_1.ExtensionsInput) {
                    const activeGroup = editorGroupsService.activeGroup;
                    activeGroup.replaceEditors([{
                            editor: activeEditor,
                            replacement: instantiationService.createInstance(gettingStartedInput_1.GettingStartedInput, { selectedCategory: selectedCategory, selectedStep: selectedStep })
                        }]);
                }
                else {
                    // else open respecting toSide
                    editorService.openEditor({
                        resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                        options: { selectedCategory: selectedCategory, selectedStep: selectedStep, preserveFocus: toSide ?? false }
                    }, toSide ? editorService_1.SIDE_GROUP : undefined).then((editor) => {
                        editor?.makeCategoryVisibleWhenAvailable(selectedCategory, selectedStep);
                    });
                }
            }
            else {
                editorService.openEditor({
                    resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                    options: { preserveFocus: toSide ?? false }
                }, toSide ? editorService_1.SIDE_GROUP : undefined);
            }
        }
    });
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(gettingStartedInput_1.GettingStartedInput.ID, gettingStarted_1.GettingStartedInputSerializer);
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(gettingStarted_1.GettingStartedPage, gettingStarted_1.GettingStartedPage.ID, (0, nls_1.localize)('welcome', "Welcome")), [
        new descriptors_1.SyncDescriptor(gettingStartedInput_1.GettingStartedInput)
    ]);
    const category = (0, nls_1.localize2)('welcome', "Welcome");
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.goBack',
                title: (0, nls_1.localize2)('welcome.goBack', 'Go Back'),
                category,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                    when: gettingStarted_1.inWelcomeContext
                },
                precondition: contextkey_1.ContextKeyExpr.equals('activeEditor', 'gettingStartedPage'),
                f1: true
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorPane = editorService.activeEditorPane;
            if (editorPane instanceof gettingStarted_1.GettingStartedPage) {
                editorPane.escape();
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'walkthroughs.selectStep',
        handler: (accessor, stepID) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorPane = editorService.activeEditorPane;
            if (editorPane instanceof gettingStarted_1.GettingStartedPage) {
                editorPane.selectStepLoose(stepID);
            }
            else {
                console.error('Cannot run walkthroughs.selectStep outside of walkthrough context');
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.markStepComplete',
                title: (0, nls_1.localize)('welcome.markStepComplete', "Mark Step Complete"),
                category,
            });
        }
        run(accessor, arg) {
            if (!arg) {
                return;
            }
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            gettingStartedService.progressStep(arg);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.markStepIncomplete',
                title: (0, nls_1.localize)('welcome.markStepInomplete', "Mark Step Incomplete"),
                category,
            });
        }
        run(accessor, arg) {
            if (!arg) {
                return;
            }
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            gettingStartedService.deprogressStep(arg);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.showAllWalkthroughs',
                title: (0, nls_1.localize2)('welcome.showAllWalkthroughs', 'Open Walkthrough...'),
                category,
                f1: true,
            });
        }
        async getQuickPickItems(contextService, gettingStartedService) {
            const categories = await gettingStartedService.getWalkthroughs();
            return categories
                .filter(c => contextService.contextMatchesRules(c.when))
                .map(x => ({
                id: x.id,
                label: x.title,
                detail: x.description,
                description: x.source,
            }));
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            const contextService = accessor.get(contextkey_1.IContextKeyService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            const extensionService = accessor.get(extensions_1.IExtensionService);
            const quickPick = quickInputService.createQuickPick();
            quickPick.canSelectMany = false;
            quickPick.matchOnDescription = true;
            quickPick.matchOnDetail = true;
            quickPick.placeholder = (0, nls_1.localize)('pickWalkthroughs', 'Select a walkthrough to open');
            quickPick.items = await this.getQuickPickItems(contextService, gettingStartedService);
            quickPick.busy = true;
            quickPick.onDidAccept(() => {
                const selection = quickPick.selectedItems[0];
                if (selection) {
                    commandService.executeCommand('workbench.action.openWalkthrough', selection.id);
                }
                quickPick.hide();
            });
            quickPick.onDidHide(() => quickPick.dispose());
            await extensionService.whenInstalledExtensionsRegistered();
            gettingStartedService.onDidAddWalkthrough(async () => {
                quickPick.items = await this.getQuickPickItems(contextService, gettingStartedService);
            });
            quickPick.show();
            quickPick.busy = false;
        }
    });
    exports.WorkspacePlatform = new contextkey_1.RawContextKey('workspacePlatform', undefined, (0, nls_1.localize)('workspacePlatform', "The platform of the current workspace, which in remote or serverless contexts may be different from the platform of the UI"));
    let WorkspacePlatformContribution = class WorkspacePlatformContribution {
        static { this.ID = 'workbench.contrib.workspacePlatform'; }
        constructor(extensionManagementServerService, remoteAgentService, contextService) {
            this.extensionManagementServerService = extensionManagementServerService;
            this.remoteAgentService = remoteAgentService;
            this.contextService = contextService;
            this.remoteAgentService.getEnvironment().then(env => {
                const remoteOS = env?.os;
                const remotePlatform = remoteOS === 2 /* OS.Macintosh */ ? 'mac'
                    : remoteOS === 1 /* OS.Windows */ ? 'windows'
                        : remoteOS === 3 /* OS.Linux */ ? 'linux'
                            : undefined;
                if (remotePlatform) {
                    exports.WorkspacePlatform.bindTo(this.contextService).set(remotePlatform);
                }
                else if (this.extensionManagementServerService.localExtensionManagementServer) {
                    if (platform_2.isMacintosh) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('mac');
                    }
                    else if (platform_2.isLinux) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('linux');
                    }
                    else if (platform_2.isWindows) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('windows');
                    }
                }
                else if (this.extensionManagementServerService.webExtensionManagementServer) {
                    exports.WorkspacePlatform.bindTo(this.contextService).set('webworker');
                }
                else {
                    console.error('Error: Unable to detect workspace platform');
                }
            });
        }
    };
    WorkspacePlatformContribution = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementServerService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, contextkey_1.IContextKeyService)
    ], WorkspacePlatformContribution);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        ...configuration_1.workbenchConfigurationNodeBase,
        properties: {
            'workbench.welcomePage.walkthroughs.openOnInstall': {
                scope: 2 /* ConfigurationScope.MACHINE */,
                type: 'boolean',
                default: true,
                description: (0, nls_1.localize)('workbench.welcomePage.walkthroughs.openOnInstall', "When enabled, an extension's walkthrough will open upon install of the extension.")
            },
            'workbench.startupEditor': {
                'scope': 4 /* ConfigurationScope.RESOURCE */,
                'type': 'string',
                'enum': ['none', 'welcomePage', 'readme', 'newUntitledFile', 'welcomePageInEmptyWorkbench', 'terminal'],
                'enumDescriptions': [
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.none' }, "Start without an editor."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePage' }, "Open the Welcome page, with content to aid in getting started with VS Code and extensions."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.readme' }, "Open the README when opening a folder that contains one, fallback to 'welcomePage' otherwise. Note: This is only observed as a global configuration, it will be ignored if set in a workspace or folder configuration."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.newUntitledFile' }, "Open a new untitled text file (only applies when opening an empty window)."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePageInEmptyWorkbench' }, "Open the Welcome page when opening an empty workbench."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.terminal' }, "Open a new terminal in the editor area."),
                ],
                'default': 'welcomePage',
                'description': (0, nls_1.localize)('workbench.startupEditor', "Controls which editor is shown at startup, if none are restored from the previous session.")
            },
            'workbench.welcomePage.preferReducedMotion': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'boolean',
                default: false,
                deprecationMessage: (0, nls_1.localize)('deprecationMessage', "Deprecated, use the global `workbench.reduceMotion`."),
                description: (0, nls_1.localize)('workbench.welcomePage.preferReducedMotion', "When enabled, reduce motion in welcome page.")
            }
        }
    });
    (0, contributions_1.registerWorkbenchContribution2)(WorkspacePlatformContribution.ID, WorkspacePlatformContribution, 3 /* WorkbenchPhase.AfterRestored */);
    (0, contributions_1.registerWorkbenchContribution2)(startupPage_1.StartupPageEditorResolverContribution.ID, startupPage_1.StartupPageEditorResolverContribution, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(startupPage_1.StartupPageRunnerContribution.ID, startupPage_1.StartupPageRunnerContribution, 3 /* WorkbenchPhase.AfterRestored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWQuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZUdldHRpbmdTdGFydGVkL2Jyb3dzZXIvZ2V0dGluZ1N0YXJ0ZWQuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThCaEcsc0JBQWdHO0lBRWhHLElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGtDQUFrQztnQkFDdEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLFdBQVcsRUFBRSxTQUFTLENBQUM7Z0JBQ3hDLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLElBQUk7Z0JBQ3pCLEVBQUUsRUFBRSxJQUFJO2dCQUNSLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlO29CQUMxQixLQUFLLEVBQUUsV0FBVztvQkFDbEIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7Z0JBQ0QsUUFBUSxFQUFFO29CQUNULFdBQVcsRUFBRSxJQUFBLGVBQVMsRUFBQyx1QkFBdUIsRUFBRSx5REFBeUQsQ0FBQztpQkFDMUc7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sR0FBRyxDQUNULFFBQTBCLEVBQzFCLGFBQXNFLEVBQ3RFLE1BQTJCO1lBRTNCLE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQ0FBb0IsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFD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