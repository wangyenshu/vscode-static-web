/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "./dirtydiffDecorator", "vs/workbench/contrib/scm/common/scm", "vs/platform/actions/common/actions", "./activity", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/scm/common/scmService", "vs/workbench/common/views", "vs/workbench/contrib/scm/browser/scmViewPaneContainer", "vs/platform/instantiation/common/descriptors", "vs/editor/common/languages/modesRegistry", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/contrib/scm/browser/scmViewPane", "vs/workbench/contrib/scm/browser/scmViewService", "vs/workbench/contrib/scm/browser/scmRepositoriesViewPane", "vs/editor/contrib/suggest/browser/suggest", "vs/workbench/contrib/workspace/common/workspace", "vs/workbench/contrib/scm/common/quickDiff", "vs/workbench/contrib/scm/common/quickDiffService", "vs/base/browser/dom", "vs/workbench/contrib/scm/browser/workingSet"], function (require, exports, nls_1, platform_1, contributions_1, dirtydiffDecorator_1, scm_1, actions_1, activity_1, configurationRegistry_1, contextkey_1, commands_1, keybindingsRegistry_1, extensions_1, scmService_1, views_1, scmViewPaneContainer_1, descriptors_1, modesRegistry_1, codicons_1, iconRegistry_1, scmViewPane_1, scmViewService_1, scmRepositoriesViewPane_1, suggest_1, workspace_1, quickDiff_1, quickDiffService_1, dom_1, workingSet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: 'scminput',
        extensions: [],
        aliases: [], // hide from language selector
        mimetypes: ['text/x-scm-input']
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(dirtydiffDecorator_1.DirtyDiffWorkbenchController, 3 /* LifecyclePhase.Restored */);
    const sourceControlViewIcon = (0, iconRegistry_1.registerIcon)('source-control-view-icon', codicons_1.Codicon.sourceControl, (0, nls_1.localize)('sourceControlViewIcon', 'View icon of the Source Control view.'));
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: scm_1.VIEWLET_ID,
        title: (0, nls_1.localize2)('source control', 'Source Control'),
        ctorDescriptor: new descriptors_1.SyncDescriptor(scmViewPaneContainer_1.SCMViewPaneContainer),
        storageId: 'workbench.scm.views.state',
        icon: sourceControlViewIcon,
        alwaysUseContainerInfo: true,
        order: 2,
        hideIfEmpty: true,
    }, 0 /* ViewContainerLocation.Sidebar */, { doNotRegisterOpenCommand: true });
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViewWelcomeContent(scm_1.VIEW_PANE_ID, {
        content: (0, nls_1.localize)('no open repo', "No source control providers registered."),
        when: 'default'
    });
    viewsRegistry.registerViewWelcomeContent(scm_1.VIEW_PANE_ID, {
        content: (0, nls_1.localize)('no open repo in an untrusted workspace', "None of the registered source control providers work in Restricted Mode."),
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('scm.providerCount', 0), workspace_1.WorkspaceTrustContext.IsEnabled, workspace_1.WorkspaceTrustContext.IsTrusted.toNegated())
    });
    viewsRegistry.registerViewWelcomeContent(scm_1.VIEW_PANE_ID, {
        content: `[${(0, nls_1.localize)('manageWorkspaceTrustAction', "Manage Workspace Trust")}](command:${workspace_1.MANAGE_TRUST_COMMAND_ID})`,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('scm.providerCount', 0), workspace_1.WorkspaceTrustContext.IsEnabled, workspace_1.WorkspaceTrustContext.IsTrusted.toNegated())
    });
    viewsRegistry.registerViews([{
            id: scm_1.VIEW_PANE_ID,
            name: (0, nls_1.localize2)('source control', 'Source Control'),
            ctorDescriptor: new descriptors_1.SyncDescriptor(scmViewPane_1.SCMViewPane),
            canToggleVisibility: true,
            canMoveView: true,
            weight: 80,
            order: -999,
            containerIcon: sourceControlViewIcon,
            openCommandActionDescriptor: {
                id: viewContainer.id,
                mnemonicTitle: (0, nls_1.localize)({ key: 'miViewSCM', comment: ['&& denotes a mnemonic'] }, "Source &&Control"),
                keybindings: {
                    primary: 0,
                    win: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */ },
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */ },
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */ },
                },
                order: 2,
            }
        }], viewContainer);
    viewsRegistry.registerViews([{
            id: scm_1.REPOSITORIES_VIEW_PANE_ID,
            name: (0, nls_1.localize2)('source control repositories', "Source Control Repositories"),
            ctorDescriptor: new descriptors_1.SyncDescriptor(scmRepositoriesViewPane_1.SCMRepositoriesViewPane),
            canToggleVisibility: true,
            hideByDefault: true,
            canMoveView: true,
            weight: 20,
            order: -1000,
            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('scm.providerCount'), contextkey_1.ContextKeyExpr.notEquals('scm.providerCount', 0)),
            // readonly when = ContextKeyExpr.or(ContextKeyExpr.equals('config.scm.alwaysShowProviders', true), ContextKeyExpr.and(ContextKeyExpr.notEquals('scm.providerCount', 0), ContextKeyExpr.notEquals('scm.providerCount', 1)));
            containerIcon: sourceControlViewIcon
        }], viewContainer);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(activity_1.SCMActiveResourceContextKeyController, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(activity_1.SCMActiveRepositoryContextKeyController, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(activity_1.SCMStatusController, 3 /* LifecyclePhase.Restored */);
    (0, contributions_1.registerWorkbenchContribution2)(workingSet_1.SCMWorkingSetController.ID, workingSet_1.SCMWorkingSetController, 3 /* WorkbenchPhase.AfterRestored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'scm',
        order: 5,
        title: (0, nls_1.localize)('scmConfigurationTitle', "Source Control"),
        type: 'object',
        scope: 4 /* ConfigurationScope.RESOURCE */,
        properties: {
            'scm.diffDecorations': {
                type: 'string',
                enum: ['all', 'gutter', 'overview', 'minimap', 'none'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.diffDecorations.all', "Show the diff decorations in all available locations."),
                    (0, nls_1.localize)('scm.diffDecorations.gutter', "Show the diff decorations only in the editor gutter."),
                    (0, nls_1.localize)('scm.diffDecorations.overviewRuler', "Show the diff decorations only in the overview ruler."),
                    (0, nls_1.localize)('scm.diffDecorations.minimap', "Show the diff decorations only in the minimap."),
                    (0, nls_1.localize)('scm.diffDecorations.none', "Do not show the diff decorations.")
                ],
                default: 'all',
                description: (0, nls_1.localize)('diffDecorations', "Controls diff decorations in the editor.")
            },
            'scm.diffDecorationsGutterWidth': {
                type: 'number',
                enum: [1, 2, 3, 4, 5],
                default: 3,
                description: (0, nls_1.localize)('diffGutterWidth', "Controls the width(px) of diff decorations in gutter (added & modified).")
            },
            'scm.diffDecorationsGutterVisibility': {
                type: 'string',
                enum: ['always', 'hover'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.diffDecorationsGutterVisibility.always', "Show the diff decorator in the gutter at all times."),
                    (0, nls_1.localize)('scm.diffDecorationsGutterVisibility.hover', "Show the diff decorator in the gutter only on hover.")
                ],
                description: (0, nls_1.localize)('scm.diffDecorationsGutterVisibility', "Controls the visibility of the Source Control diff decorator in the gutter."),
                default: 'always'
            },
            'scm.diffDecorationsGutterAction': {
                type: 'string',
                enum: ['diff', 'none'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.diffDecorationsGutterAction.diff', "Show the inline diff Peek view on click."),
                    (0, nls_1.localize)('scm.diffDecorationsGutterAction.none', "Do nothing.")
                ],
                description: (0, nls_1.localize)('scm.diffDecorationsGutterAction', "Controls the behavior of Source Control diff gutter decorations."),
                default: 'diff'
            },
            'scm.diffDecorationsGutterPattern': {
                type: 'object',
                description: (0, nls_1.localize)('diffGutterPattern', "Controls whether a pattern is used for the diff decorations in gutter."),
                additionalProperties: false,
                properties: {
                    'added': {
                        type: 'boolean',
                        description: (0, nls_1.localize)('diffGutterPatternAdded', "Use pattern for the diff decorations in gutter for added lines."),
                    },
                    'modified': {
                        type: 'boolean',
                        description: (0, nls_1.localize)('diffGutterPatternModifed', "Use pattern for the diff decorations in gutter for modified lines."),
                    },
                },
                default: {
                    'added': false,
                    'modified': true
                }
            },
            'scm.diffDecorationsIgnoreTrimWhitespace': {
                type: 'string',
                enum: ['true', 'false', 'inherit'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.diffDecorationsIgnoreTrimWhitespace.true', "Ignore leading and trailing whitespace."),
                    (0, nls_1.localize)('scm.diffDecorationsIgnoreTrimWhitespace.false', "Do not ignore leading and trailing whitespace."),
                    (0, nls_1.localize)('scm.diffDecorationsIgnoreTrimWhitespace.inherit', "Inherit from `diffEditor.ignoreTrimWhitespace`.")
                ],
                description: (0, nls_1.localize)('diffDecorationsIgnoreTrimWhitespace', "Controls whether leading and trailing whitespace is ignored in Source Control diff gutter decorations."),
                default: 'false'
            },
            'scm.alwaysShowActions': {
                type: 'boolean',
                description: (0, nls_1.localize)('alwaysShowActions', "Controls whether inline actions are always visible in the Source Control view."),
                default: false
            },
            'scm.countBadge': {
                type: 'string',
                enum: ['all', 'focused', 'off'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.countBadge.all', "Show the sum of all Source Control Provider count badges."),
                    (0, nls_1.localize)('scm.countBadge.focused', "Show the count badge of the focused Source Control Provider."),
                    (0, nls_1.localize)('scm.countBadge.off', "Disable the Source Control count badge.")
                ],
                description: (0, nls_1.localize)('scm.countBadge', "Controls the count badge on the Source Control icon on the Activity Bar."),
                default: 'all'
            },
            'scm.providerCountBadge': {
                type: 'string',
                enum: ['hidden', 'auto', 'visible'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.providerCountBadge.hidden', "Hide Source Control Provider count badges."),
                    (0, nls_1.localize)('scm.providerCountBadge.auto', "Only show count badge for Source Control Provider when non-zero."),
                    (0, nls_1.localize)('scm.providerCountBadge.visible', "Show Source Control Provider count badges.")
                ],
                markdownDescription: (0, nls_1.localize)('scm.providerCountBadge', "Controls the count badges on Source Control Provider headers. These headers appear in the Source Control view when there is more than one provider or when the {0} setting is enabled, and in the Source Control Repositories view.", '\`#scm.alwaysShowRepositories#\`'),
                default: 'hidden'
            },
            'scm.defaultViewMode': {
                type: 'string',
                enum: ['tree', 'list'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.defaultViewMode.tree', "Show the repository changes as a tree."),
                    (0, nls_1.localize)('scm.defaultViewMode.list', "Show the repository changes as a list.")
                ],
                description: (0, nls_1.localize)('scm.defaultViewMode', "Controls the default Source Control repository view mode."),
                default: 'list'
            },
            'scm.defaultViewSortKey': {
                type: 'string',
                enum: ['name', 'path', 'status'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.defaultViewSortKey.name', "Sort the repository changes by file name."),
                    (0, nls_1.localize)('scm.defaultViewSortKey.path', "Sort the repository changes by path."),
                    (0, nls_1.localize)('scm.defaultViewSortKey.status', "Sort the repository changes by Source Control status.")
                ],
                description: (0, nls_1.localize)('scm.defaultViewSortKey', "Controls the default Source Control repository changes sort order when viewed as a list."),
                default: 'path'
            },
            'scm.autoReveal': {
                type: 'boolean',
                description: (0, nls_1.localize)('autoReveal', "Controls whether the Source Control view should automatically reveal and select files when opening them."),
                default: true
            },
            'scm.inputFontFamily': {
                type: 'string',
                markdownDescription: (0, nls_1.localize)('inputFontFamily', "Controls the font for the input message. Use `default` for the workbench user interface font family, `editor` for the `#editor.fontFamily#`'s value, or a custom font family."),
                default: 'default'
            },
            'scm.inputFontSize': {
                type: 'number',
                markdownDescription: (0, nls_1.localize)('inputFontSize', "Controls the font size for the input message in pixels."),
                default: 13
            },
            'scm.inputMaxLineCount': {
                type: 'number',
                markdownDescription: (0, nls_1.localize)('inputMaxLines', "Controls the maximum number of lines that the input will auto-grow to."),
                minimum: 1,
                maximum: 50,
                default: 10
            },
            'scm.inputMinLineCount': {
                type: 'number',
                markdownDescription: (0, nls_1.localize)('inputMinLines', "Controls the minimum number of lines that the input will auto-grow from."),
                minimum: 1,
                maximum: 50,
                default: 1
            },
            'scm.alwaysShowRepositories': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('alwaysShowRepository', "Controls whether repositories should always be visible in the Source Control view."),
                default: false
            },
            'scm.repositories.sortOrder': {
                type: 'string',
                enum: ['discovery time', 'name', 'path'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.repositoriesSortOrder.discoveryTime', "Repositories in the Source Control Repositories view are sorted by discovery time. Repositories in the Source Control view are sorted in the order that they were selected."),
                    (0, nls_1.localize)('scm.repositoriesSortOrder.name', "Repositories in the Source Control Repositories and Source Control views are sorted by repository name."),
                    (0, nls_1.localize)('scm.repositoriesSortOrder.path', "Repositories in the Source Control Repositories and Source Control views are sorted by repository path.")
                ],
                description: (0, nls_1.localize)('repositoriesSortOrder', "Controls the sort order of the repositories in the source control repositories view."),
                default: 'discovery time'
            },
            'scm.repositories.visible': {
                type: 'number',
                description: (0, nls_1.localize)('providersVisible', "Controls how many repositories are visible in the Source Control Repositories section. Set to 0, to be able to manually resize the view."),
                default: 10
            },
            'scm.showActionButton': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('showActionButton', "Controls whether an action button can be shown in the Source Control view."),
                default: true
            },
            'scm.showInputActionButton': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('showInputActionButton', "Controls whether an action button can be shown in the Source Control input."),
                default: true
            },
            'scm.showIncomingChanges': {
                type: 'string',
                enum: ['always', 'never', 'auto'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.showIncomingChanges.always', "Always show incoming changes in the Source Control view."),
                    (0, nls_1.localize)('scm.showIncomingChanges.never', "Never show incoming changes in the Source Control view."),
                    (0, nls_1.localize)('scm.showIncomingChanges.auto', "Only show incoming changes in the Source Control view when any exist."),
                ],
                description: (0, nls_1.localize)('scm.showIncomingChanges', "Controls whether incoming changes are shown in the Source Control view."),
                default: 'auto'
            },
            'scm.showOutgoingChanges': {
                type: 'string',
                enum: ['always', 'never', 'auto'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.showOutgoingChanges.always', "Always show outgoing changes in the Source Control view."),
                    (0, nls_1.localize)('scm.showOutgoingChanges.never', "Never show outgoing changes in the Source Control view."),
                    (0, nls_1.localize)('scm.showOutgoingChanges.auto', "Only show outgoing changes in the Source Control view when any exist."),
                ],
                description: (0, nls_1.localize)('scm.showOutgoingChanges', "Controls whether outgoing changes are shown in the Source Control view."),
                default: 'auto'
            },
            'scm.showChangesSummary': {
                type: 'boolean',
                description: (0, nls_1.localize)('scm.showChangesSummary', "Controls whether the All Changes entry is shown for incoming/outgoing changes in the Source Control view."),
                default: true
            },
            'scm.workingSets.enabled': {
                type: 'boolean',
                description: (0, nls_1.localize)('scm.workingSets.enabled', "Controls whether to store editor working sets when switching between source control history item groups."),
                default: false
            },
            'scm.workingSets.default': {
                type: 'string',
                enum: ['empty', 'current'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.workingSets.default.empty', "Use an empty working set when switching to a source control history item group that does not have a working set."),
                    (0, nls_1.localize)('scm.workingSets.default.current', "Use the current working set when switching to a source control history item group that does not have a working set.")
                ],
                description: (0, nls_1.localize)('scm.workingSets.default', "Controls the default working set to use when switching to a source control history item group that does not have a working set."),
                default: 'current'
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'scm.acceptInput',
        metadata: { description: (0, nls_1.localize)('scm accept', "Source Control: Accept Input"), args: [] },
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.has('scmRepository'),
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        handler: accessor => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const context = contextKeyService.getContext((0, dom_1.getActiveElement)());
            const repositoryId = context.getValue('scmRepository');
            if (!repositoryId) {
                return Promise.resolve(null);
            }
            const scmService = accessor.get(scm_1.ISCMService);
            const repository = scmService.getRepository(repositoryId);
            if (!repository?.provider.acceptInputCommand) {
                return Promise.resolve(null);
            }
            const id = repository.provider.acceptInputCommand.id;
            const args = repository.provider.acceptInputCommand.arguments;
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(id, ...(args || []));
        }
    });
    const viewNextCommitCommand = {
        description: { description: (0, nls_1.localize)('scm view next commit', "Source Control: View Next Commit"), args: [] },
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        handler: (accessor) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const scmService = accessor.get(scm_1.ISCMService);
            const context = contextKeyService.getContext((0, dom_1.getActiveElement)());
            const repositoryId = context.getValue('scmRepository');
            const repository = repositoryId ? scmService.getRepository(repositoryId) : undefined;
            repository?.input.showNextHistoryValue();
        }
    };
    const viewPreviousCommitCommand = {
        description: { description: (0, nls_1.localize)('scm view previous commit', "Source Control: View Previous Commit"), args: [] },
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        handler: (accessor) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const scmService = accessor.get(scm_1.ISCMService);
            const context = contextKeyService.getContext((0, dom_1.getActiveElement)());
            const repositoryId = context.getValue('scmRepository');
            const repository = repositoryId ? scmService.getRepository(repositoryId) : undefined;
            repository?.input.showPreviousHistoryValue();
        }
    };
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        ...viewNextCommitCommand,
        id: 'scm.viewNextCommit',
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('scmRepository'), contextkey_1.ContextKeyExpr.has('scmInputIsInLastPosition'), suggest_1.Context.Visible.toNegated()),
        primary: 18 /* KeyCode.DownArrow */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        ...viewPreviousCommitCommand,
        id: 'scm.viewPreviousCommit',
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('scmRepository'), contextkey_1.ContextKeyExpr.has('scmInputIsInFirstPosition'), suggest_1.Context.Visible.toNegated()),
        primary: 16 /* KeyCode.UpArrow */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        ...viewNextCommitCommand,
        id: 'scm.forceViewNextCommit',
        when: contextkey_1.ContextKeyExpr.has('scmRepository'),
        primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        ...viewPreviousCommitCommand,
        id: 'scm.forceViewPreviousCommit',
        when: contextkey_1.ContextKeyExpr.has('scmRepository'),
        primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */
    });
    commands_1.CommandsRegistry.registerCommand('scm.openInIntegratedTerminal', async (accessor, provider) => {
        if (!provider || !provider.rootUri) {
            return;
        }
        const commandService = accessor.get(commands_1.ICommandService);
        await commandService.executeCommand('openInIntegratedTerminal', provider.rootUri);
    });
    commands_1.CommandsRegistry.registerCommand('scm.openInTerminal', async (accessor, provider) => {
        if (!provider || !provider.rootUri) {
            return;
        }
        const commandService = accessor.get(commands_1.ICommandService);
        await commandService.executeCommand('openInTerminal', provider.rootUri);
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMSourceControl, {
        group: '100_end',
        command: {
            id: 'scm.openInTerminal',
            title: (0, nls_1.localize)('open in external terminal', "Open in External Terminal")
        },
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('scmProviderHasRootUri', true), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.terminal.sourceControlRepositoriesKind', 'external'), contextkey_1.ContextKeyExpr.equals('config.terminal.sourceControlRepositoriesKind', 'both')))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMSourceControl, {
        group: '100_end',
        command: {
            id: 'scm.openInIntegratedTerminal',
            title: (0, nls_1.localize)('open in integrated terminal', "Open in Integrated Terminal")
        },
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('scmProviderHasRootUri', true), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.terminal.sourceControlRepositoriesKind', 'integrated'), contextkey_1.ContextKeyExpr.equals('config.terminal.sourceControlRepositoriesKind', 'both')))
    });
    (0, extensions_1.registerSingleton)(scm_1.ISCMService, scmService_1.SCMService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(scm_1.ISCMViewService, scmViewService_1.SCMViewService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(quickDiff_1.IQuickDiffService, quickDiffService_1.QuickDiffService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NjbS9icm93c2VyL3NjbS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQ2hHLDZCQUFhLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsRUFBRSxFQUFFLFVBQVU7UUFDZCxVQUFVLEVBQUUsRUFBRTtRQUNkLE9BQU8sRUFBRSxFQUFFLEVBQUUsOEJBQThCO1FBQzNDLFNBQVMsRUFBRSxDQUFDLGtCQUFrQixDQUFDO0tBQy9CLENBQUMsQ0FBQztJQUVILG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUM7U0FDekUsNkJBQTZCLENBQUMsaURBQTRCLGtDQUEwQixDQUFDO0lBRXZGLE1BQU0scUJBQXFCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLDBCQUEwQixFQUFFLGtCQUFPLENBQUMsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHVDQUF1QyxDQUFDLENBQUMsQ0FBQztJQUUxSyxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBMEIsa0JBQXVCLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQztRQUNoSSxFQUFFLEVBQUUsZ0JBQVU7UUFDZCxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUM7UUFDcEQsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBQywyQ0FBb0IsQ0FBQztRQUN4RCxTQUFTLEVBQUUsMkJBQTJCO1FBQ3RDLElBQUksRUFBRSxxQkFBcUI7UUFDM0Isc0JBQXNCLEVBQUUsSUFBSTtRQUM1QixLQUFLLEVBQUUsQ0FBQztRQUNSLFdBQVcsRUFBRSxJQUFJO0tB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