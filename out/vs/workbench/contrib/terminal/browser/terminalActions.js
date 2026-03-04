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
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/keyCodes", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalQuickAccess", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/terminal/common/terminalProfiles", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/history/common/history", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/editor/common/editorService", "vs/base/common/path", "vs/workbench/services/configurationResolver/common/variableResolver", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/common/history", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/base/common/cancellation", "vs/base/common/resources", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/iterator", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/contrib/terminal/browser/terminalContextMenu"], function (require, exports, canIUse_1, actions_1, codicons_1, keyCodes_1, network_1, platform_1, types_1, uri_1, codeEditorService_1, nls_1, accessibility_1, actions_2, commands_1, configuration_1, contextkey_1, label_1, listService_1, notification_1, opener_1, quickInput_1, terminal_1, workspace_1, workspaceCommands_1, editorCommands_1, terminal_2, terminalQuickAccess_1, terminal_3, terminalContextKey_1, terminalProfiles_1, terminalStrings_1, configurationResolver_1, environmentService_1, history_1, preferences_1, remoteAgentService_1, editorService_1, path_1, variableResolver_1, themeService_1, terminalIcon_1, history_2, model_1, language_1, cancellation_1, resources_1, getIconClasses_1, files_1, clipboardService_1, terminalIcons_1, editorGroupsService_1, iterator_1, accessibilityConfiguration_1, dom_1, editorGroupColumn_1, terminalContextMenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLaunchHelpAction = exports.terminalSendSequenceCommand = exports.switchTerminalShowTabsTitle = exports.switchTerminalActionViewItemSeparator = void 0;
    exports.getCwdForSplit = getCwdForSplit;
    exports.registerTerminalAction = registerTerminalAction;
    exports.registerContextualInstanceAction = registerContextualInstanceAction;
    exports.registerActiveInstanceAction = registerActiveInstanceAction;
    exports.registerActiveXtermAction = registerActiveXtermAction;
    exports.registerTerminalActions = registerTerminalActions;
    exports.validateTerminalName = validateTerminalName;
    exports.refreshTerminalActions = refreshTerminalActions;
    exports.shrinkWorkspaceFolderCwdPairs = shrinkWorkspaceFolderCwdPairs;
    exports.switchTerminalActionViewItemSeparator = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
    exports.switchTerminalShowTabsTitle = (0, nls_1.localize)('showTerminalTabs', "Show Tabs");
    const category = terminalStrings_1.terminalStrings.actionCategory;
    // Some terminal context keys get complicated. Since normalizing and/or context keys can be
    // expensive this is done once per context key and shared.
    const sharedWhenClause = (() => {
        const terminalAvailable = contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated);
        return {
            terminalAvailable,
            terminalAvailable_and_opened: contextkey_1.ContextKeyExpr.and(terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            terminalAvailable_and_editorActive: contextkey_1.ContextKeyExpr.and(terminalAvailable, terminalContextKey_1.TerminalContextKeys.terminalEditorActive),
            terminalAvailable_and_singularSelection: contextkey_1.ContextKeyExpr.and(terminalAvailable, terminalContextKey_1.TerminalContextKeys.tabsSingularSelection),
            focusInAny_and_normalBuffer: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.altBufferActive.negate())
        };
    })();
    async function getCwdForSplit(instance, folders, commandService, configService) {
        switch (configService.config.splitCwd) {
            case 'workspaceRoot':
                if (folders !== undefined && commandService !== undefined) {
                    if (folders.length === 1) {
                        return folders[0].uri;
                    }
                    else if (folders.length > 1) {
                        // Only choose a path when there's more than 1 folder
                        const options = {
                            placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                        };
                        const workspace = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                        if (!workspace) {
                            // Don't split the instance if the workspace picker was canceled
                            return undefined;
                        }
                        return Promise.resolve(workspace.uri);
                    }
                }
                return '';
            case 'initial':
                return instance.getInitialCwd();
            case 'inherited':
                return instance.getCwd();
        }
    }
    const terminalSendSequenceCommand = async (accessor, args) => {
        const instance = accessor.get(terminal_2.ITerminalService).activeInstance;
        if (instance) {
            const text = (0, types_1.isObject)(args) && 'text' in args ? toOptionalString(args.text) : undefined;
            if (!text) {
                return;
            }
            const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const historyService = accessor.get(history_1.IHistoryService);
            const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(instance.isRemote ? network_1.Schemas.vscodeRemote : network_1.Schemas.file);
            const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
            const resolvedText = await configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, text);
            instance.sendText(resolvedText, false);
        }
    };
    exports.terminalSendSequenceCommand = terminalSendSequenceCommand;
    let TerminalLaunchHelpAction = class TerminalLaunchHelpAction extends actions_1.Action {
        constructor(_openerService) {
            super('workbench.action.terminal.launchHelp', (0, nls_1.localize)('terminalLaunchHelp', "Open Help"));
            this._openerService = _openerService;
        }
        async run() {
            this._openerService.open('https://aka.ms/vscode-troubleshoot-terminal-launch');
        }
    };
    exports.TerminalLaunchHelpAction = TerminalLaunchHelpAction;
    exports.TerminalLaunchHelpAction = TerminalLaunchHelpAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], TerminalLaunchHelpAction);
    /**
     * A wrapper function around registerAction2 to help make registering terminal actions more concise.
     * The following default options are used if undefined:
     *
     * - `f1`: true
     * - `category`: Terminal
     * - `precondition`: TerminalContextKeys.processSupported
     */
    function registerTerminalAction(options) {
        // Set defaults
        options.f1 = options.f1 ?? true;
        options.category = options.category ?? category;
        options.precondition = options.precondition ?? terminalContextKey_1.TerminalContextKeys.processSupported;
        // Remove run function from options so it's not passed through to registerAction2
        const runFunc = options.run;
        const strictOptions = options;
        delete strictOptions['run'];
        // Register
        return (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super(strictOptions);
            }
            run(accessor, args, args2) {
                return runFunc(getTerminalServices(accessor), accessor, args, args2);
            }
        });
    }
    function parseActionArgs(args) {
        if (Array.isArray(args)) {
            if (args.every(e => e instanceof terminalContextMenu_1.InstanceContext)) {
                return args;
            }
        }
        else if (args instanceof terminalContextMenu_1.InstanceContext) {
            return [args];
        }
        return undefined;
    }
    /**
     * A wrapper around {@link registerTerminalAction} that runs a callback for all currently selected
     * instances provided in the action context. This falls back to the active instance if there are no
     * contextual instances provided.
     */
    function registerContextualInstanceAction(options) {
        const originalRun = options.run;
        return registerTerminalAction({
            ...options,
            run: async (c, accessor, focusedInstanceArgs, allInstanceArgs) => {
                let instances = getSelectedInstances2(accessor, allInstanceArgs);
                if (!instances) {
                    const activeInstance = (options.activeInstanceType === 'view'
                        ? c.groupService
                        : options.activeInstanceType === 'editor' ?
                            c.editorService
                            : c.service).activeInstance;
                    if (!activeInstance) {
                        return;
                    }
                    instances = [activeInstance];
                }
                const results = [];
                for (const instance of instances) {
                    results.push(originalRun(instance, c, accessor, focusedInstanceArgs));
                }
                await Promise.all(results);
                if (options.runAfter) {
                    options.runAfter(instances, c, accessor, focusedInstanceArgs);
                }
            }
        });
    }
    /**
     * A wrapper around {@link registerTerminalAction} that ensures an active instance exists and
     * provides it to the run function.
     */
    function registerActiveInstanceAction(options) {
        const originalRun = options.run;
        return registerTerminalAction({
            ...options,
            run: (c, accessor, args) => {
                const activeInstance = c.service.activeInstance;
                if (activeInstance) {
                    return originalRun(activeInstance, c, accessor, args);
                }
            }
        });
    }
    /**
     * A wrapper around {@link registerTerminalAction} that ensures an active terminal
     * exists and provides it to the run function.
     *
     * This includes detached xterm terminals that are not managed by an {@link ITerminalInstance}.
     */
    function registerActiveXtermAction(options) {
        const originalRun = options.run;
        return registerTerminalAction({
            ...options,
            run: (c, accessor, args) => {
                const activeDetached = iterator_1.Iterable.find(c.service.detachedInstances, d => d.xterm.isFocused);
                if (activeDetached) {
                    return originalRun(activeDetached.xterm, accessor, activeDetached, args);
                }
                const activeInstance = c.service.activeInstance;
                if (activeInstance?.xterm) {
                    return originalRun(activeInstance.xterm, accessor, activeInstance, args);
                }
            }
        });
    }
    function getTerminalServices(accessor) {
        return {
            service: accessor.get(terminal_2.ITerminalService),
            configService: accessor.get(terminal_2.ITerminalConfigurationService),
            groupService: accessor.get(terminal_2.ITerminalGroupService),
            instanceService: accessor.get(terminal_2.ITerminalInstanceService),
            editorService: accessor.get(terminal_2.ITerminalEditorService),
            profileService: accessor.get(terminal_3.ITerminalProfileService),
            profileResolverService: accessor.get(terminal_3.ITerminalProfileResolverService)
        };
    }
    function registerTerminalActions() {
        registerTerminalAction({
            id: "workbench.action.terminal.newInActiveWorkspace" /* TerminalCommandId.NewInActiveWorkspace */,
            title: (0, nls_1.localize2)('workbench.action.terminal.newInActiveWorkspace', 'Create New Terminal (In Active Workspace)'),
            run: async (c) => {
                if (c.service.isProcessSupportRegistered) {
                    const instance = await c.service.createTerminal({ location: c.service.defaultLocation });
                    if (!instance) {
                        return;
                    }
                    c.service.setActiveInstance(instance);
                }
                await c.groupService.showPanel(true);
            }
        });
        // Register new with profile command
        refreshTerminalActions([]);
        registerTerminalAction({
            id: "workbench.action.createTerminalEditor" /* TerminalCommandId.CreateTerminalEditor */,
            title: (0, nls_1.localize2)('workbench.action.terminal.createTerminalEditor', 'Create New Terminal in Editor Area'),
            run: async (c, _, args) => {
                const options = ((0, types_1.isObject)(args) && 'location' in args) ? args : { location: terminal_1.TerminalLocation.Editor };
                const instance = await c.service.createTerminal(options);
                await instance.focusWhenReady();
            }
        });
        registerTerminalAction({
            id: "workbench.action.createTerminalEditorSameGroup" /* TerminalCommandId.CreateTerminalEditorSameGroup */,
            title: (0, nls_1.localize2)('workbench.action.terminal.createTerminalEditor', 'Create New Terminal in Editor Area'),
            f1: false,
            run: async (c, accessor, args) => {
                // Force the editor into the same editor group if it's locked. This command is only ever
                // called when a terminal is the active editor
                const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const instance = await c.service.createTerminal({
                    location: { viewColumn: (0, editorGroupColumn_1.editorGroupToColumn)(editorGroupsService, editorGroupsService.activeGroup) }
                });
                await instance.focusWhenReady();
            }
        });
        registerTerminalAction({
            id: "workbench.action.createTerminalEditorSide" /* TerminalCommandId.CreateTerminalEditorSide */,
            title: (0, nls_1.localize2)('workbench.action.terminal.createTerminalEditorSide', 'Create New Terminal in Editor Area to the Side'),
            run: async (c) => {
                const instance = await c.service.createTerminal({
                    location: { viewColumn: editorService_1.SIDE_GROUP }
                });
                await instance.focusWhenReady();
            }
        });
        registerContextualInstanceAction({
            id: "workbench.action.terminal.moveToEditor" /* TerminalCommandId.MoveToEditor */,
            title: terminalStrings_1.terminalStrings.moveToEditor,
            precondition: sharedWhenClause.terminalAvailable_and_opened,
            activeInstanceType: 'view',
            run: (instance, c) => c.service.moveToEditor(instance),
            runAfter: (instances) => instances.at(-1)?.focus()
        });
        registerContextualInstanceAction({
            id: "workbench.action.terminal.moveIntoNewWindow" /* TerminalCommandId.MoveIntoNewWindow */,
            title: terminalStrings_1.terminalStrings.moveIntoNewWindow,
            precondition: sharedWhenClause.terminalAvailable_and_opened,
            run: (instance, c) => c.service.moveIntoNewEditor(instance),
            runAfter: (instances) => instances.at(-1)?.focus()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.moveToTerminalPanel" /* TerminalCommandId.MoveToTerminalPanel */,
            title: terminalStrings_1.terminalStrings.moveToTerminalPanel,
            precondition: sharedWhenClause.terminalAvailable_and_editorActive,
            run: (c, _, args) => {
                const source = toOptionalUri(args) ?? c.editorService.activeInstance;
                if (source) {
                    c.service.moveToTerminalView(source);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusPreviousPane" /* TerminalCommandId.FocusPreviousPane */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focusPreviousPane', 'Focus Previous Terminal in Terminal Group'),
            keybinding: {
                primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
                mac: {
                    primary: 512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
                    secondary: [512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
                },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c) => {
                c.groupService.activeGroup?.focusPreviousPane();
                await c.groupService.showPanel(true);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusNextPane" /* TerminalCommandId.FocusNextPane */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focusNextPane', 'Focus Next Terminal in Terminal Group'),
            keybinding: {
                primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
                mac: {
                    primary: 512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */,
                    secondary: [512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
                },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c) => {
                c.groupService.activeGroup?.focusNextPane();
                await c.groupService.showPanel(true);
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */,
            title: (0, nls_1.localize2)('workbench.action.terminal.runRecentCommand', 'Run Recent Command...'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: [
                {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */,
                    when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */)))),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */ },
                    when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            ],
            run: async (activeInstance, c) => {
                await activeInstance.runRecent('command');
                if (activeInstance?.target === terminal_1.TerminalLocation.Editor) {
                    await c.editorService.revealActiveEditor();
                }
                else {
                    await c.groupService.showPanel(false);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.copyLastCommand" /* TerminalCommandId.CopyLastCommand */,
            title: (0, nls_1.localize2)('workbench.action.terminal.copyLastCommand', "Copy Last Command"),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (instance, c, accessor) => {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const commands = instance.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.commands;
                if (!commands || commands.length === 0) {
                    return;
                }
                const command = commands[commands.length - 1];
                if (!command.command) {
                    return;
                }
                await clipboardService.writeText(command.command);
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.copyLastCommandOutput" /* TerminalCommandId.CopyLastCommandOutput */,
            title: (0, nls_1.localize2)('workbench.action.terminal.copyLastCommandOutput', "Copy Last Command Output"),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (instance, c, accessor) => {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const commands = instance.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.commands;
                if (!commands || commands.length === 0) {
                    return;
                }
                const command = commands[commands.length - 1];
                if (!command?.hasOutput()) {
                    return;
                }
                const output = command.getOutput();
                if ((0, types_1.isString)(output)) {
                    await clipboardService.writeText(output);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.copyLastCommandAndLastCommandOutput" /* TerminalCommandId.CopyLastCommandAndLastCommandOutput */,
            title: (0, nls_1.localize2)('workbench.action.terminal.copyLastCommandAndOutput', "Copy Last Command and Output"),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (instance, c, accessor) => {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const commands = instance.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.commands;
                if (!commands || commands.length === 0) {
                    return;
                }
                const command = commands[commands.length - 1];
                if (!command?.hasOutput()) {
                    return;
                }
                const output = command.getOutput();
                if ((0, types_1.isString)(output)) {
                    await clipboardService.writeText(`${command.command !== '' ? command.command + '\n' : ''}${output}`);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.goToRecentDirectory" /* TerminalCommandId.GoToRecentDirectory */,
            title: (0, nls_1.localize2)('workbench.action.terminal.goToRecentDirectory', 'Go to Recent Directory...'),
            metadata: {
                description: (0, nls_1.localize2)('goToRecentDirectory.metadata', 'Goes to a recent folder'),
            },
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */,
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            run: async (activeInstance, c) => {
                await activeInstance.runRecent('cwd');
                if (activeInstance?.target === terminal_1.TerminalLocation.Editor) {
                    await c.editorService.revealActiveEditor();
                }
                else {
                    await c.groupService.showPanel(false);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.resizePaneLeft" /* TerminalCommandId.ResizePaneLeft */,
            title: (0, nls_1.localize2)('workbench.action.terminal.resizePaneLeft', 'Resize Terminal Left'),
            keybinding: {
                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */ },
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 15 /* KeyCode.LeftArrow */ },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.activeGroup?.resizePane(0 /* Direction.Left */)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.resizePaneRight" /* TerminalCommandId.ResizePaneRight */,
            title: (0, nls_1.localize2)('workbench.action.terminal.resizePaneRight', 'Resize Terminal Right'),
            keybinding: {
                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */ },
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 17 /* KeyCode.RightArrow */ },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.activeGroup?.resizePane(1 /* Direction.Right */)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.resizePaneUp" /* TerminalCommandId.ResizePaneUp */,
            title: (0, nls_1.localize2)('workbench.action.terminal.resizePaneUp', 'Resize Terminal Up'),
            keybinding: {
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 16 /* KeyCode.UpArrow */ },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.activeGroup?.resizePane(2 /* Direction.Up */)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.resizePaneDown" /* TerminalCommandId.ResizePaneDown */,
            title: (0, nls_1.localize2)('workbench.action.terminal.resizePaneDown', 'Resize Terminal Down'),
            keybinding: {
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 18 /* KeyCode.DownArrow */ },
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.activeGroup?.resizePane(3 /* Direction.Down */)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focus" /* TerminalCommandId.Focus */,
            title: terminalStrings_1.terminalStrings.focus,
            keybinding: {
                when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, accessibilityConfiguration_1.accessibleViewOnLastLine, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */)),
                primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c) => {
                const instance = c.service.activeInstance || await c.service.createTerminal({ location: terminal_1.TerminalLocation.Panel });
                if (!instance) {
                    return;
                }
                c.service.setActiveInstance(instance);
                focusActiveTerminal(instance, c);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusTabs" /* TerminalCommandId.FocusTabs */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focus.tabsView', 'Focus Terminal Tabs View'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 93 /* KeyCode.Backslash */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.tabsFocus, terminalContextKey_1.TerminalContextKeys.focus),
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (c) => c.groupService.focusTabs()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusNext" /* TerminalCommandId.FocusNext */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focusNext', 'Focus Next Terminal Group'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */
                },
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.editorFocus.negate()),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            run: async (c) => {
                c.groupService.setActiveGroupToNext();
                await c.groupService.showPanel(true);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusPrevious" /* TerminalCommandId.FocusPrevious */,
            title: (0, nls_1.localize2)('workbench.action.terminal.focusPrevious', 'Focus Previous Terminal Group'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 92 /* KeyCode.BracketLeft */
                },
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.editorFocus.negate()),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            run: async (c) => {
                c.groupService.setActiveGroupToPrevious();
                await c.groupService.showPanel(true);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.runSelectedText" /* TerminalCommandId.RunSelectedText */,
            title: (0, nls_1.localize2)('workbench.action.terminal.runSelectedText', 'Run Selected Text In Active Terminal'),
            run: async (c, accessor) => {
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const editor = codeEditorService.getActiveCodeEditor();
                if (!editor || !editor.hasModel()) {
                    return;
                }
                const instance = await c.service.getActiveOrCreateInstance({ acceptsInput: true });
                const selection = editor.getSelection();
                let text;
                if (selection.isEmpty()) {
                    text = editor.getModel().getLineContent(selection.selectionStartLineNumber).trim();
                }
                else {
                    const endOfLinePreference = platform_1.isWindows ? 1 /* EndOfLinePreference.LF */ : 2 /* EndOfLinePreference.CRLF */;
                    text = editor.getModel().getValueInRange(selection, endOfLinePreference);
                }
                instance.sendText(text, true, true);
                await c.service.revealActiveTerminal(true);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.runActiveFile" /* TerminalCommandId.RunActiveFile */,
            title: (0, nls_1.localize2)('workbench.action.terminal.runActiveFile', 'Run Active File In Active Terminal'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c, accessor) => {
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const workbenchEnvironmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
                const editor = codeEditorService.getActiveCodeEditor();
                if (!editor || !editor.hasModel()) {
                    return;
                }
                const instance = await c.service.getActiveOrCreateInstance({ acceptsInput: true });
                const isRemote = instance ? instance.isRemote : (workbenchEnvironmentService.remoteAuthority ? true : false);
                const uri = editor.getModel().uri;
                if ((!isRemote && uri.scheme !== network_1.Schemas.file && uri.scheme !== network_1.Schemas.vscodeUserData) || (isRemote && uri.scheme !== network_1.Schemas.vscodeRemote)) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.runActiveFile.noFile', 'Only files on disk can be run in the terminal'));
                    return;
                }
                // TODO: Convert this to ctrl+c, ctrl+v for pwsh?
                await instance.sendPath(uri, true);
                return c.groupService.showPanel();
            }
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollDown" /* TerminalCommandId.ScrollDownLine */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollDown', 'Scroll Down (Line)'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollDownLine()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollDownPage" /* TerminalCommandId.ScrollDownPage */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollDownPage', 'Scroll Down (Page)'),
            keybinding: {
                primary: 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */,
                mac: { primary: 12 /* KeyCode.PageDown */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollDownPage()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollToBottom" /* TerminalCommandId.ScrollToBottom */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollToBottom', 'Scroll to Bottom'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                linux: { primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollToBottom()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollUp" /* TerminalCommandId.ScrollUpLine */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollUp', 'Scroll Up (Line)'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollUpLine()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollUpPage" /* TerminalCommandId.ScrollUpPage */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollUpPage', 'Scroll Up (Page)'),
            f1: true,
            category,
            keybinding: {
                primary: 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */,
                mac: { primary: 11 /* KeyCode.PageUp */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollUpPage()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.scrollToTop" /* TerminalCommandId.ScrollToTop */,
            title: (0, nls_1.localize2)('workbench.action.terminal.scrollToTop', 'Scroll to Top'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                linux: { primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */ },
                when: sharedWhenClause.focusInAny_and_normalBuffer,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => xterm.scrollToTop()
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.clearSelection" /* TerminalCommandId.ClearSelection */,
            title: (0, nls_1.localize2)('workbench.action.terminal.clearSelection', 'Clear Selection'),
            keybinding: {
                primary: 9 /* KeyCode.Escape */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.textSelected, terminalContextKey_1.TerminalContextKeys.notFindVisible),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (xterm) => {
                if (xterm.hasSelection()) {
                    xterm.clearSelection();
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.changeIcon" /* TerminalCommandId.ChangeIcon */,
            title: terminalStrings_1.terminalStrings.changeIcon,
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, _, args) => getResourceOrActiveInstance(c, args)?.changeIcon()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.changeIconActiveTab" /* TerminalCommandId.ChangeIconActiveTab */,
            title: terminalStrings_1.terminalStrings.changeIcon,
            f1: false,
            precondition: sharedWhenClause.terminalAvailable_and_singularSelection,
            run: async (c, accessor, args) => {
                let icon;
                if (c.groupService.lastAccessedMenu === 'inline-tab') {
                    getResourceOrActiveInstance(c, args)?.changeIcon();
                    return;
                }
                for (const terminal of getSelectedInstances(accessor) ?? []) {
                    icon = await terminal.changeIcon(icon);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.changeColor" /* TerminalCommandId.ChangeColor */,
            title: terminalStrings_1.terminalStrings.changeColor,
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, _, args) => getResourceOrActiveInstance(c, args)?.changeColor()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.changeColorActiveTab" /* TerminalCommandId.ChangeColorActiveTab */,
            title: terminalStrings_1.terminalStrings.changeColor,
            f1: false,
            precondition: sharedWhenClause.terminalAvailable_and_singularSelection,
            run: async (c, accessor, args) => {
                let color;
                let i = 0;
                if (c.groupService.lastAccessedMenu === 'inline-tab') {
                    getResourceOrActiveInstance(c, args)?.changeColor();
                    return;
                }
                for (const terminal of getSelectedInstances(accessor) ?? []) {
                    const skipQuickPick = i !== 0;
                    // Always show the quickpick on the first iteration
                    color = await terminal.changeColor(color, skipQuickPick);
                    i++;
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.rename" /* TerminalCommandId.Rename */,
            title: terminalStrings_1.terminalStrings.rename,
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, accessor, args) => renameWithQuickPick(c, accessor, args)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.renameActiveTab" /* TerminalCommandId.RenameActiveTab */,
            title: terminalStrings_1.terminalStrings.rename,
            f1: false,
            keybinding: {
                primary: 60 /* KeyCode.F2 */,
                mac: {
                    primary: 3 /* KeyCode.Enter */
                },
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.tabsFocus),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable_and_singularSelection,
            run: async (c, accessor) => {
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const instances = getSelectedInstances(accessor);
                const firstInstance = instances?.[0];
                if (!firstInstance) {
                    return;
                }
                if (terminalGroupService.lastAccessedMenu === 'inline-tab') {
                    return renameWithQuickPick(c, accessor, firstInstance);
                }
                c.service.setEditingTerminal(firstInstance);
                c.service.setEditable(firstInstance, {
                    validationMessage: value => validateTerminalName(value),
                    onFinish: async (value, success) => {
                        // Cancel editing first as instance.rename will trigger a rerender automatically
                        c.service.setEditable(firstInstance, null);
                        c.service.setEditingTerminal(undefined);
                        if (success) {
                            const promises = [];
                            for (const instance of instances) {
                                promises.push((async () => {
                                    await instance.rename(value);
                                })());
                            }
                            try {
                                await Promise.all(promises);
                            }
                            catch (e) {
                                notificationService.error(e);
                            }
                        }
                    }
                });
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.detachSession" /* TerminalCommandId.DetachSession */,
            title: (0, nls_1.localize2)('workbench.action.terminal.detachSession', 'Detach Session'),
            run: (activeInstance) => activeInstance.detachProcessAndDispose(terminal_1.TerminalExitReason.User)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.attachToSession" /* TerminalCommandId.AttachToSession */,
            title: (0, nls_1.localize2)('workbench.action.terminal.attachToSession', 'Attach to Session'),
            run: async (c, accessor) => {
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const labelService = accessor.get(label_1.ILabelService);
                const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const remoteAuthority = remoteAgentService.getConnection()?.remoteAuthority ?? undefined;
                const backend = await accessor.get(terminal_2.ITerminalInstanceService).getBackend(remoteAuthority);
                if (!backend) {
                    throw new Error(`No backend registered for remote authority '${remoteAuthority}'`);
                }
                const terms = await backend.listProcesses();
                backend.reduceConnectionGraceTime();
                const unattachedTerms = terms.filter(term => !c.service.isAttachedToTerminal(term));
                const items = unattachedTerms.map(term => {
                    const cwdLabel = labelService.getUriLabel(uri_1.URI.file(term.cwd));
                    return {
                        label: term.title,
                        detail: term.workspaceName ? `${term.workspaceName} \u2E31 ${cwdLabel}` : cwdLabel,
                        description: term.pid ? String(term.pid) : '',
                        term
                    };
                });
                if (items.length === 0) {
                    notificationService.info((0, nls_1.localize)('noUnattachedTerminals', 'There are no unattached terminals to attach to'));
                    return;
                }
                const selected = await quickInputService.pick(items, { canPickMany: false });
                if (selected) {
                    const instance = await c.service.createTerminal({
                        config: { attachPersistentProcess: selected.term }
                    });
                    c.service.setActiveInstance(instance);
                    await focusActiveTerminal(instance, c);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.quickOpenTerm" /* TerminalCommandId.QuickOpenTerm */,
            title: (0, nls_1.localize2)('quickAccessTerminal', 'Switch Active Terminal'),
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, accessor) => accessor.get(quickInput_1.IQuickInputService).quickAccess.show(terminalQuickAccess_1.TerminalQuickAccessProvider.PREFIX)
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.scrollToPreviousCommand" /* TerminalCommandId.ScrollToPreviousCommand */,
            title: terminalStrings_1.terminalStrings.scrollToPreviousCommand,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            icon: codicons_1.Codicon.arrowUp,
            menu: [
                {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    order: 4,
                    when: contextkey_1.ContextKeyExpr.equals('view', terminal_3.TERMINAL_VIEW_ID),
                    isHiddenByDefault: true
                }
            ],
            run: (activeInstance) => activeInstance.xterm?.markTracker.scrollToPreviousMark(undefined, undefined, activeInstance.capabilities.has(2 /* TerminalCapability.CommandDetection */))
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.scrollToNextCommand" /* TerminalCommandId.ScrollToNextCommand */,
            title: terminalStrings_1.terminalStrings.scrollToNextCommand,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            icon: codicons_1.Codicon.arrowDown,
            menu: [
                {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    order: 4,
                    when: contextkey_1.ContextKeyExpr.equals('view', terminal_3.TERMINAL_VIEW_ID),
                    isHiddenByDefault: true
                }
            ],
            run: (activeInstance) => {
                activeInstance.xterm?.markTracker.scrollToNextMark();
                activeInstance.focus();
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.selectToPreviousCommand" /* TerminalCommandId.SelectToPreviousCommand */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectToPreviousCommand', 'Select To Previous Command'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (activeInstance) => {
                activeInstance.xterm?.markTracker.selectToPreviousMark();
                activeInstance.focus();
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.selectToNextCommand" /* TerminalCommandId.SelectToNextCommand */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectToNextCommand', 'Select To Next Command'),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                when: terminalContextKey_1.TerminalContextKeys.focus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: (activeInstance) => {
                activeInstance.xterm?.markTracker.selectToNextMark();
                activeInstance.focus();
            }
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.selectToPreviousLine" /* TerminalCommandId.SelectToPreviousLine */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectToPreviousLine', 'Select To Previous Line'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (xterm, _, instance) => {
                xterm.markTracker.selectToPreviousLine();
                // prefer to call focus on the TerminalInstance for additional accessibility triggers
                (instance || xterm).focus();
            }
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.selectToNextLine" /* TerminalCommandId.SelectToNextLine */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectToNextLine', 'Select To Next Line'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (xterm, _, instance) => {
                xterm.markTracker.selectToNextLine();
                // prefer to call focus on the TerminalInstance for additional accessibility triggers
                (instance || xterm).focus();
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.sendSequence" /* TerminalCommandId.SendSequence */,
            title: terminalStrings_1.terminalStrings.sendSequence,
            f1: false,
            metadata: {
                description: terminalStrings_1.terminalStrings.sendSequence.value,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            required: ['text'],
                            properties: {
                                text: {
                                    description: (0, nls_1.localize)('sendSequence', "The sequence of text to send to the terminal"),
                                    type: 'string'
                                }
                            },
                        }
                    }]
            },
            run: (c, accessor, args) => (0, exports.terminalSendSequenceCommand)(accessor, args)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.newWithCwd" /* TerminalCommandId.NewWithCwd */,
            title: terminalStrings_1.terminalStrings.newWithCwd,
            metadata: {
                description: terminalStrings_1.terminalStrings.newWithCwd.value,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            required: ['cwd'],
                            properties: {
                                cwd: {
                                    description: (0, nls_1.localize)('workbench.action.terminal.newWithCwd.cwd', "The directory to start the terminal at"),
                                    type: 'string'
                                }
                            },
                        }
                    }]
            },
            run: async (c, _, args) => {
                const cwd = (0, types_1.isObject)(args) && 'cwd' in args ? toOptionalString(args.cwd) : undefined;
                const instance = await c.service.createTerminal({ cwd });
                if (!instance) {
                    return;
                }
                c.service.setActiveInstance(instance);
                await focusActiveTerminal(instance, c);
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.renameWithArg" /* TerminalCommandId.RenameWithArgs */,
            title: terminalStrings_1.terminalStrings.renameWithArgs,
            metadata: {
                description: terminalStrings_1.terminalStrings.renameWithArgs.value,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                                name: {
                                    description: (0, nls_1.localize)('workbench.action.terminal.renameWithArg.name', "The new name for the terminal"),
                                    type: 'string',
                                    minLength: 1
                                }
                            }
                        }
                    }]
            },
            precondition: sharedWhenClause.terminalAvailable,
            run: async (activeInstance, c, accessor, args) => {
                const notificationService = accessor.get(notification_1.INotificationService);
                const name = (0, types_1.isObject)(args) && 'name' in args ? toOptionalString(args.name) : undefined;
                if (!name) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.renameWithArg.noName', "No name argument provided"));
                    return;
                }
                activeInstance.rename(name);
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.relaunch" /* TerminalCommandId.Relaunch */,
            title: (0, nls_1.localize2)('workbench.action.terminal.relaunch', 'Relaunch Active Terminal'),
            run: (activeInstance) => activeInstance.relaunch()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
            title: terminalStrings_1.terminalStrings.split,
            precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */,
                    secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */]
                },
                when: terminalContextKey_1.TerminalContextKeys.focus
            },
            icon: codicons_1.Codicon.splitHorizontal,
            run: async (c, accessor, args) => {
                const optionsOrProfile = (0, types_1.isObject)(args) ? args : undefined;
                const commandService = accessor.get(commands_1.ICommandService);
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const options = convertOptionsOrProfileToOptions(optionsOrProfile);
                const activeInstance = (await c.service.getInstanceHost(options?.location)).activeInstance;
                if (!activeInstance) {
                    return;
                }
                const cwd = await getCwdForSplit(activeInstance, workspaceContextService.getWorkspace().folders, commandService, c.configService);
                if (cwd === undefined) {
                    return;
                }
                const instance = await c.service.createTerminal({ location: { parentTerminal: activeInstance }, config: options?.config, cwd });
                await focusActiveTerminal(instance, c);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.splitActiveTab" /* TerminalCommandId.SplitActiveTab */,
            title: terminalStrings_1.terminalStrings.split,
            f1: false,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */,
                    secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */]
                },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: terminalContextKey_1.TerminalContextKeys.tabsFocus
            },
            run: async (c, accessor) => {
                const instances = getSelectedInstances(accessor);
                if (instances) {
                    const promises = [];
                    for (const t of instances) {
                        promises.push((async () => {
                            await c.service.createTerminal({ location: { parentTerminal: t } });
                            await c.groupService.showPanel(true);
                        })());
                    }
                    await Promise.all(promises);
                }
            }
        });
        registerContextualInstanceAction({
            id: "workbench.action.terminal.unsplit" /* TerminalCommandId.Unsplit */,
            title: terminalStrings_1.terminalStrings.unsplit,
            precondition: sharedWhenClause.terminalAvailable,
            run: async (instance, c) => {
                const group = c.groupService.getGroupForInstance(instance);
                if (group && group?.terminalInstances.length > 1) {
                    c.groupService.unsplitInstance(instance);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.joinActiveTab" /* TerminalCommandId.JoinActiveTab */,
            title: (0, nls_1.localize2)('workbench.action.terminal.joinInstance', 'Join Terminals'),
            precondition: contextkey_1.ContextKeyExpr.and(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.tabsSingularSelection.toNegated()),
            run: async (c, accessor) => {
                const instances = getSelectedInstances(accessor);
                if (instances && instances.length > 1) {
                    c.groupService.joinInstances(instances);
                }
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.join" /* TerminalCommandId.Join */,
            title: (0, nls_1.localize2)('workbench.action.terminal.join', 'Join Terminals...'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c, accessor) => {
                const themeService = accessor.get(themeService_1.IThemeService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const picks = [];
                if (c.groupService.instances.length <= 1) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.join.insufficientTerminals', 'Insufficient terminals for the join action'));
                    return;
                }
                const otherInstances = c.groupService.instances.filter(i => i.instanceId !== c.groupService.activeInstance?.instanceId);
                for (const terminal of otherInstances) {
                    const group = c.groupService.getGroupForInstance(terminal);
                    if (group?.terminalInstances.length === 1) {
                        const iconId = (0, terminalIcon_1.getIconId)(accessor, terminal);
                        const label = `$(${iconId}): ${terminal.title}`;
                        const iconClasses = [];
                        const colorClass = (0, terminalIcon_1.getColorClass)(terminal);
                        if (colorClass) {
                            iconClasses.push(colorClass);
                        }
                        const uriClasses = (0, terminalIcon_1.getUriClasses)(terminal, themeService.getColorTheme().type);
                        if (uriClasses) {
                            iconClasses.push(...uriClasses);
                        }
                        picks.push({
                            terminal,
                            label,
                            iconClasses
                        });
                    }
                }
                if (picks.length === 0) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.join.onlySplits', 'All terminals are joined already'));
                    return;
                }
                const result = await quickInputService.pick(picks, {});
                if (result) {
                    c.groupService.joinInstances([result.terminal, c.groupService.activeInstance]);
                }
            }
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.splitInActiveWorkspace" /* TerminalCommandId.SplitInActiveWorkspace */,
            title: (0, nls_1.localize2)('workbench.action.terminal.splitInActiveWorkspace', 'Split Terminal (In Active Workspace)'),
            run: async (instance, c) => {
                const newInstance = await c.service.createTerminal({ location: { parentTerminal: instance } });
                if (newInstance?.target !== terminal_1.TerminalLocation.Editor) {
                    await c.groupService.showPanel(true);
                }
            }
        });
        registerActiveXtermAction({
            id: "workbench.action.terminal.selectAll" /* TerminalCommandId.SelectAll */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectAll', 'Select All'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: [{
                    // Don't use ctrl+a by default as that would override the common go to start
                    // of prompt shell binding
                    primary: 0,
                    // Technically this doesn't need to be here as it will fall back to this
                    // behavior anyway when handed to xterm.js, having this handled by VS Code
                    // makes it easier for users to see how it works though.
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: terminalContextKey_1.TerminalContextKeys.focusInAny
                }],
            run: (xterm) => xterm.selectAll()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
            title: (0, nls_1.localize2)('workbench.action.terminal.new', 'Create New Terminal'),
            precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
            icon: terminalIcons_1.newTerminalIcon,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 91 /* KeyCode.Backquote */,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 91 /* KeyCode.Backquote */ },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            run: async (c, accessor, args) => {
                let eventOrOptions = (0, types_1.isObject)(args) ? args : undefined;
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const commandService = accessor.get(commands_1.ICommandService);
                const folders = workspaceContextService.getWorkspace().folders;
                if (eventOrOptions && (0, dom_1.isMouseEvent)(eventOrOptions) && (eventOrOptions.altKey || eventOrOptions.ctrlKey)) {
                    await c.service.createTerminal({ location: { splitActiveTerminal: true } });
                    return;
                }
                if (c.service.isProcessSupportRegistered) {
                    eventOrOptions = !eventOrOptions || (0, dom_1.isMouseEvent)(eventOrOptions) ? {} : eventOrOptions;
                    let instance;
                    if (folders.length <= 1) {
                        // Allow terminal service to handle the path when there is only a
                        // single root
                        instance = await c.service.createTerminal(eventOrOptions);
                    }
                    else {
                        const cwd = (await pickTerminalCwd(accessor))?.cwd;
                        if (!cwd) {
                            // Don't create the instance if the workspace picker was canceled
                            return;
                        }
                        eventOrOptions.cwd = cwd;
                        instance = await c.service.createTerminal(eventOrOptions);
                    }
                    c.service.setActiveInstance(instance);
                    await focusActiveTerminal(instance, c);
                }
                else {
                    if (c.profileService.contributedProfiles.length > 0) {
                        commandService.executeCommand("workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */);
                    }
                    else {
                        commandService.executeCommand("workbench.action.terminal.toggleTerminal" /* TerminalCommandId.Toggle */);
                    }
                }
            }
        });
        async function killInstance(c, instance) {
            if (!instance) {
                return;
            }
            await c.service.safeDisposeTerminal(instance);
            if (c.groupService.instances.length > 0) {
                await c.groupService.showPanel(true);
            }
        }
        registerTerminalAction({
            id: "workbench.action.terminal.kill" /* TerminalCommandId.Kill */,
            title: (0, nls_1.localize2)('workbench.action.terminal.kill', 'Kill the Active Terminal Instance'),
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            icon: terminalIcons_1.killTerminalIcon,
            run: async (c) => killInstance(c, c.groupService.activeInstance)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.killViewOrEditor" /* TerminalCommandId.KillViewOrEditor */,
            title: terminalStrings_1.terminalStrings.kill,
            f1: false, // This is an internal command used for context menus
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            run: async (c) => killInstance(c, c.service.activeInstance)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.killAll" /* TerminalCommandId.KillAll */,
            title: (0, nls_1.localize2)('workbench.action.terminal.killAll', 'Kill All Terminals'),
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            icon: codicons_1.Codicon.trash,
            run: async (c) => {
                const disposePromises = [];
                for (const instance of c.service.instances) {
                    disposePromises.push(c.service.safeDisposeTerminal(instance));
                }
                await Promise.all(disposePromises);
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.killEditor" /* TerminalCommandId.KillEditor */,
            title: (0, nls_1.localize2)('workbench.action.terminal.killEditor', 'Kill the Active Terminal in Editor Area'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
                win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.editorFocus)
            },
            run: (c, accessor) => accessor.get(commands_1.ICommandService).executeCommand(editorCommands_1.CLOSE_EDITOR_COMMAND_ID)
        });
        registerTerminalAction({
            id: "workbench.action.terminal.killActiveTab" /* TerminalCommandId.KillActiveTab */,
            title: terminalStrings_1.terminalStrings.kill,
            f1: false,
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            keybinding: {
                primary: 20 /* KeyCode.Delete */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
                    secondary: [20 /* KeyCode.Delete */]
                },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: terminalContextKey_1.TerminalContextKeys.tabsFocus
            },
            run: async (c, accessor) => {
                const disposePromises = [];
                for (const terminal of getSelectedInstances(accessor, true) ?? []) {
                    disposePromises.push(c.service.safeDisposeTerminal(terminal));
                }
                await Promise.all(disposePromises);
                c.groupService.focusTabs();
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.focusHover" /* TerminalCommandId.FocusHover */,
            title: terminalStrings_1.terminalStrings.focusHover,
            precondition: contextkey_1.ContextKeyExpr.or(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.isOpen),
            keybinding: {
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.tabsFocus, terminalContextKey_1.TerminalContextKeys.focus)
            },
            run: (c) => c.groupService.focusHover()
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
            title: (0, nls_1.localize2)('workbench.action.terminal.clear', 'Clear'),
            precondition: sharedWhenClause.terminalAvailable,
            keybinding: [{
                    primary: 0,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */ },
                    // Weight is higher than work workbench contributions so the keybinding remains
                    // highest priority when chords are registered afterwards
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    // Disable the keybinding when accessibility mode is enabled as chords include
                    // important screen reader keybindings such as cmd+k, cmd+i to show the hover
                    when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()), contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, accessibilityConfiguration_1.accessibleViewIsShown, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */))),
                }],
            run: (activeInstance) => activeInstance.clearBuffer()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.selectDefaultShell" /* TerminalCommandId.SelectDefaultProfile */,
            title: (0, nls_1.localize2)('workbench.action.terminal.selectDefaultShell', 'Select Default Profile'),
            run: (c) => c.service.showProfileQuickPick('setDefault')
        });
        registerTerminalAction({
            id: "workbench.action.terminal.openSettings" /* TerminalCommandId.ConfigureTerminalSettings */,
            title: (0, nls_1.localize2)('workbench.action.terminal.openSettings', 'Configure Terminal Settings'),
            precondition: sharedWhenClause.terminalAvailable,
            run: (c, accessor) => accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@feature:terminal' })
        });
        registerActiveInstanceAction({
            id: "workbench.action.terminal.setDimensions" /* TerminalCommandId.SetDimensions */,
            title: (0, nls_1.localize2)('workbench.action.terminal.setFixedDimensions', 'Set Fixed Dimensions'),
            precondition: sharedWhenClause.terminalAvailable_and_opened,
            run: (activeInstance) => activeInstance.setFixedDimensions()
        });
        registerContextualInstanceAction({
            id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
            title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth,
            precondition: sharedWhenClause.terminalAvailable_and_opened,
            keybinding: {
                primary: 512 /* KeyMod.Alt */ | 56 /* KeyCode.KeyZ */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: terminalContextKey_1.TerminalContextKeys.focus
            },
            run: (instance) => instance.toggleSizeToContentWidth()
        });
        registerTerminalAction({
            id: "workbench.action.terminal.clearPreviousSessionHistory" /* TerminalCommandId.ClearPreviousSessionHistory */,
            title: (0, nls_1.localize2)('workbench.action.terminal.clearPreviousSessionHistory', 'Clear Previous Session History'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c, accessor) => {
                (0, history_2.getCommandHistory)(accessor).clear();
                (0, history_2.clearShellFileHistory)();
            }
        });
        registerTerminalAction({
            id: "workbench.action.terminal.toggleStickyScroll" /* TerminalCommandId.ToggleStickyScroll */,
            title: (0, nls_1.localize2)('workbench.action.terminal.toggleStickyScroll', 'Toggle Sticky Scroll'),
            toggled: {
                condition: contextkey_1.ContextKeyExpr.equals('config.terminal.integrated.stickyScroll.enabled', true),
                title: (0, nls_1.localize)('stickyScroll', "Sticky Scroll"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Sticky Scroll"),
            },
            run: (c, accessor) => {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const newValue = !configurationService.getValue("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */);
                return configurationService.updateValue("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */, newValue);
            },
            menu: [
                { id: actions_2.MenuId.TerminalStickyScrollContext }
            ]
        });
        // Some commands depend on platform features
        if (canIUse_1.BrowserFeatures.clipboard.writeText) {
            registerActiveXtermAction({
                id: "workbench.action.terminal.copySelection" /* TerminalCommandId.CopySelection */,
                title: (0, nls_1.localize2)('workbench.action.terminal.copySelection', 'Copy Selection'),
                // TODO: Why is copy still showing up when text isn't selected?
                precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.textSelectedInFocused, contextkey_1.ContextKeyExpr.and(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.textSelected)),
                keybinding: [{
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.textSelected, terminalContextKey_1.TerminalContextKeys.focus), terminalContextKey_1.TerminalContextKeys.textSelectedInFocused)
                    }],
                run: (activeInstance) => activeInstance.copySelection()
            });
            registerActiveXtermAction({
                id: "workbench.action.terminal.copyAndClearSelection" /* TerminalCommandId.CopyAndClearSelection */,
                title: (0, nls_1.localize2)('workbench.action.terminal.copyAndClearSelection', 'Copy and Clear Selection'),
                precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.textSelectedInFocused, contextkey_1.ContextKeyExpr.and(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.textSelected)),
                keybinding: [{
                        win: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.textSelected, terminalContextKey_1.TerminalContextKeys.focus), terminalContextKey_1.TerminalContextKeys.textSelectedInFocused)
                    }],
                run: async (xterm) => {
                    await xterm.copySelection();
                    xterm.clearSelection();
                }
            });
            registerActiveXtermAction({
                id: "workbench.action.terminal.copySelectionAsHtml" /* TerminalCommandId.CopySelectionAsHtml */,
                title: (0, nls_1.localize2)('workbench.action.terminal.copySelectionAsHtml', 'Copy Selection as HTML'),
                f1: true,
                category,
                precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.textSelectedInFocused, contextkey_1.ContextKeyExpr.and(sharedWhenClause.terminalAvailable, terminalContextKey_1.TerminalContextKeys.textSelected)),
                run: (xterm) => xterm.copySelection(true)
            });
        }
        if (canIUse_1.BrowserFeatures.clipboard.readText) {
            registerActiveInstanceAction({
                id: "workbench.action.terminal.paste" /* TerminalCommandId.Paste */,
                title: (0, nls_1.localize2)('workbench.action.terminal.paste', 'Paste into Active Terminal'),
                precondition: sharedWhenClause.terminalAvailable,
                keybinding: [{
                        primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
                        win: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 52 /* KeyCode.KeyV */] },
                        linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 52 /* KeyCode.KeyV */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: terminalContextKey_1.TerminalContextKeys.focus
                    }],
                run: (activeInstance) => activeInstance.paste()
            });
        }
        if (canIUse_1.BrowserFeatures.clipboard.readText && platform_1.isLinux) {
            registerActiveInstanceAction({
                id: "workbench.action.terminal.pasteSelection" /* TerminalCommandId.PasteSelection */,
                title: (0, nls_1.localize2)('workbench.action.terminal.pasteSelection', 'Paste Selection into Active Terminal'),
                precondition: sharedWhenClause.terminalAvailable,
                keybinding: [{
                        linux: { primary: 1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: terminalContextKey_1.TerminalContextKeys.focus
                    }],
                run: (activeInstance) => activeInstance.pasteSelection()
            });
        }
        registerTerminalAction({
            id: "workbench.action.terminal.switchTerminal" /* TerminalCommandId.SwitchTerminal */,
            title: (0, nls_1.localize2)('workbench.action.terminal.switchTerminal', 'Switch Terminal'),
            precondition: sharedWhenClause.terminalAvailable,
            run: async (c, accessor, args) => {
                const item = toOptionalString(args);
                if (!item) {
                    return;
                }
                if (item === exports.switchTerminalActionViewItemSeparator) {
                    c.service.refreshActiveGroup();
                    return;
                }
                if (item === exports.switchTerminalShowTabsTitle) {
                    accessor.get(configuration_1.IConfigurationService).updateValue("terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */, true);
                    return;
                }
                const terminalIndexRe = /^([0-9]+): /;
                const indexMatches = terminalIndexRe.exec(item);
                if (indexMatches) {
                    c.groupService.setActiveGroupByIndex(Number(indexMatches[1]) - 1);
                    return c.groupService.showPanel(true);
                }
                const quickSelectProfiles = c.profileService.availableProfiles;
                // Remove 'New ' from the selected item to get the profile name
                const profileSelection = item.substring(4);
                if (quickSelectProfiles) {
                    const profile = quickSelectProfiles.find(profile => profile.profileName === profileSelection);
                    if (profile) {
                        const instance = await c.service.createTerminal({
                            config: profile
                        });
                        c.service.setActiveInstance(instance);
                    }
                    else {
                        console.warn(`No profile with name "${profileSelection}"`);
                    }
                }
                else {
                    console.warn(`Unmatched terminal item: "${item}"`);
                }
            }
        });
    }
    function getSelectedInstances2(accessor, args) {
        const terminalService = accessor.get(terminal_2.ITerminalService);
        const result = [];
        const context = parseActionArgs(args);
        if (context && context.length > 0) {
            for (const instanceContext of context) {
                const instance = terminalService.getInstanceFromId(instanceContext.instanceId);
                if (instance) {
                    result.push(instance);
                }
            }
            if (result.length > 0) {
                return result;
            }
        }
        return undefined;
    }
    function getSelectedInstances(accessor, args, args2) {
        const listService = accessor.get(listService_1.IListService);
        const terminalService = accessor.get(terminal_2.ITerminalService);
        const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
        const result = [];
        const list = listService.lastFocusedList;
        // Get selected tab list instance(s)
        const selections = list?.getSelection();
        // Get inline tab instance if there are not tab list selections #196578
        if (terminalGroupService.lastAccessedMenu === 'inline-tab' && !selections?.length) {
            const instance = terminalGroupService.activeInstance;
            return instance ? [terminalGroupService.activeInstance] : undefined;
        }
        if (!list || !selections) {
            return undefined;
        }
        const focused = list.getFocus();
        if (focused.length === 1 && !selections.includes(focused[0])) {
            // focused length is always a max of 1
            // if the focused one is not in the selected list, return that item
            result.push(terminalService.getInstanceFromIndex(focused[0]));
            return result;
        }
        // multi-select
        for (const selection of selections) {
            result.push(terminalService.getInstanceFromIndex(selection));
        }
        return result.filter(r => !!r);
    }
    function validateTerminalName(name) {
        if (!name || name.trim().length === 0) {
            return {
                content: (0, nls_1.localize)('emptyTerminalNameInfo', "Providing no name will reset it to the default value"),
                severity: notification_1.Severity.Info
            };
        }
        return null;
    }
    function convertOptionsOrProfileToOptions(optionsOrProfile) {
        if ((0, types_1.isObject)(optionsOrProfile) && 'profileName' in optionsOrProfile) {
            return { config: optionsOrProfile, location: optionsOrProfile.location };
        }
        return optionsOrProfile;
    }
    let newWithProfileAction;
    function refreshTerminalActions(detectedProfiles) {
        const profileEnum = (0, terminalProfiles_1.createProfileSchemaEnums)(detectedProfiles);
        newWithProfileAction?.dispose();
        // TODO: Use new register function
        newWithProfileAction = (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */,
                    title: (0, nls_1.localize2)('workbench.action.terminal.newWithProfile', 'Create New Terminal (With Profile)'),
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
                    metadata: {
                        description: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */,
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['profileName'],
                                    properties: {
                                        profileName: {
                                            description: (0, nls_1.localize)('workbench.action.terminal.newWithProfile.profileName', "The name of the profile to create"),
                                            type: 'string',
                                            enum: profileEnum.values,
                                            markdownEnumDescriptions: profileEnum.markdownDescriptions
                                        },
                                        location: {
                                            description: (0, nls_1.localize)('newWithProfile.location', "Where to create the terminal"),
                                            type: 'string',
                                            enum: ['view', 'editor'],
                                            enumDescriptions: [
                                                (0, nls_1.localize)('newWithProfile.location.view', 'Create the terminal in the terminal view'),
                                                (0, nls_1.localize)('newWithProfile.location.editor', 'Create the terminal in the editor'),
                                            ]
                                        }
                                    }
                                }
                            }]
                    },
                });
            }
            async run(accessor, eventOrOptionsOrProfile, profile) {
                const c = getTerminalServices(accessor);
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const commandService = accessor.get(commands_1.ICommandService);
                let event;
                let options;
                let instance;
                let cwd;
                if ((0, types_1.isObject)(eventOrOptionsOrProfile) && eventOrOptionsOrProfile && 'profileName' in eventOrOptionsOrProfile) {
                    const config = c.profileService.availableProfiles.find(profile => profile.profileName === eventOrOptionsOrProfile.profileName);
                    if (!config) {
                        throw new Error(`Could not find terminal profile "${eventOrOptionsOrProfile.profileName}"`);
                    }
                    options = { config };
                    if ('location' in eventOrOptionsOrProfile) {
                        switch (eventOrOptionsOrProfile.location) {
                            case 'editor':
                                options.location = terminal_1.TerminalLocation.Editor;
                                break;
                            case 'view':
                                options.location = terminal_1.TerminalLocation.Panel;
                                break;
                        }
                    }
                }
                else if ((0, dom_1.isMouseEvent)(eventOrOptionsOrProfile) || (0, dom_1.isPointerEvent)(eventOrOptionsOrProfile) || (0, dom_1.isKeyboardEvent)(eventOrOptionsOrProfile)) {
                    event = eventOrOptionsOrProfile;
                    options = profile ? { config: profile } : undefined;
                }
                else {
                    options = convertOptionsOrProfileToOptions(eventOrOptionsOrProfile);
                }
                // split terminal
                if (event && (event.altKey || event.ctrlKey)) {
                    const parentTerminal = c.service.activeInstance;
                    if (parentTerminal) {
                        await c.service.createTerminal({ location: { parentTerminal }, config: options?.config });
                        return;
                    }
                }
                const folders = workspaceContextService.getWorkspace().folders;
                if (folders.length > 1) {
                    // multi-root workspace, create root picker
                    const options = {
                        placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                    };
                    const workspace = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                    if (!workspace) {
                        // Don't create the instance if the workspace picker was canceled
                        return;
                    }
                    cwd = workspace.uri;
                }
                if (options) {
                    options.cwd = cwd;
                    instance = await c.service.createTerminal(options);
                }
                else {
                    instance = await c.service.showProfileQuickPick('createInstance', cwd);
                }
                if (instance) {
                    c.service.setActiveInstance(instance);
                    await focusActiveTerminal(instance, c);
                }
            }
        });
        return newWithProfileAction;
    }
    function getResourceOrActiveInstance(c, resource) {
        return c.service.getInstanceFromResource(toOptionalUri(resource)) || c.service.activeInstance;
    }
    async function pickTerminalCwd(accessor, cancel) {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const labelService = accessor.get(label_1.ILabelService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const modelService = accessor.get(model_1.IModelService);
        const languageService = accessor.get(language_1.ILanguageService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
        const folders = contextService.getWorkspace().folders;
        if (!folders.length) {
            return;
        }
        const folderCwdPairs = await Promise.all(folders.map(x => resolveWorkspaceFolderCwd(x, configurationService, configurationResolverService)));
        const shrinkedPairs = shrinkWorkspaceFolderCwdPairs(folderCwdPairs);
        if (shrinkedPairs.length === 1) {
            return shrinkedPairs[0];
        }
        const folderPicks = shrinkedPairs.map(pair => {
            const label = pair.folder.name;
            const description = pair.isOverridden
                ? (0, nls_1.localize)('workbench.action.terminal.overriddenCwdDescription', "(Overriden) {0}", labelService.getUriLabel(pair.cwd, { relative: !pair.isAbsolute }))
                : labelService.getUriLabel((0, resources_1.dirname)(pair.cwd), { relative: true });
            return {
                label,
                description: description !== label ? description : undefined,
                pair: pair,
                iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, pair.cwd, files_1.FileKind.ROOT_FOLDER)
            };
        });
        const options = {
            placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal"),
            matchOnDescription: true,
            canPickMany: false,
        };
        const token = cancel || cancellation_1.CancellationToken.None;
        const pick = await quickInputService.pick(folderPicks, options, token);
        return pick?.pair;
    }
    async function resolveWorkspaceFolderCwd(folder, configurationService, configurationResolverService) {
        const cwdConfig = configurationService.getValue("terminal.integrated.cwd" /* TerminalSettingId.Cwd */, { resource: folder.uri });
        if (!(0, types_1.isString)(cwdConfig) || cwdConfig.length === 0) {
            return { folder, cwd: folder.uri, isAbsolute: false, isOverridden: false };
        }
        const resolvedCwdConfig = await configurationResolverService.resolveAsync(folder, cwdConfig);
        return (0, path_1.isAbsolute)(resolvedCwdConfig) || resolvedCwdConfig.startsWith(variableResolver_1.AbstractVariableResolverService.VARIABLE_LHS)
            ? { folder, isAbsolute: true, isOverridden: true, cwd: uri_1.URI.from({ scheme: folder.uri.scheme, path: resolvedCwdConfig }) }
            : { folder, isAbsolute: false, isOverridden: true, cwd: uri_1.URI.joinPath(folder.uri, resolvedCwdConfig) };
    }
    /**
     * Drops repeated CWDs, if any, by keeping the one which best matches the workspace folder. It also preserves the original order.
     */
    function shrinkWorkspaceFolderCwdPairs(pairs) {
        const map = new Map();
        for (const pair of pairs) {
            const key = pair.cwd.toString();
            const value = map.get(key);
            if (!value || key === pair.folder.uri.toString()) {
                map.set(key, pair);
            }
        }
        const selectedPairs = new Set(map.values());
        const selectedPairsInOrder = pairs.filter(x => selectedPairs.has(x));
        return selectedPairsInOrder;
    }
    async function focusActiveTerminal(instance, c) {
        if (instance.target === terminal_1.TerminalLocation.Editor) {
            await c.editorService.revealActiveEditor();
            await instance.focusWhenReady(true);
        }
        else {
            await c.groupService.showPanel(true);
        }
    }
    async function renameWithQuickPick(c, accessor, resource) {
        let instance = resource;
        // Check if the 'instance' does not exist or if 'instance.rename' is not defined
        if (!instance || !instance?.rename) {
            // If not, obtain the resource instance using 'getResourceOrActiveInstance'
            instance = getResourceOrActiveInstance(c, resource);
        }
        if (instance) {
            const title = await accessor.get(quickInput_1.IQuickInputService).input({
                value: instance.title,
                prompt: (0, nls_1.localize)('workbench.action.terminal.rename.prompt', "Enter terminal name"),
            });
            instance.rename(title);
        }
    }
    function toOptionalUri(obj) {
        return uri_1.URI.isUri(obj) ? obj : undefined;
    }
    function toOptionalString(obj) {
        return (0, types_1.isString)(obj) ? obj : undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUZoRyx3Q0E4QkM7SUF3Q0Qsd0RBb0JDO0lBaUJELDRFQTJDQztJQU1ELG9FQWFDO0lBUUQsOERBa0JDO0lBd0JELDBEQXMwQ0M7SUEwREQsb0RBU0M7SUFXRCx3REErR0M7SUFtRUQsc0VBWUM7SUF0MERZLFFBQUEscUNBQXFDLEdBQUcsd0RBQXdELENBQUM7SUFDakcsUUFBQSwyQkFBMkIsR0FBRyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVyRixNQUFNLFFBQVEsR0FBRyxpQ0FBZSxDQUFDLGNBQWMsQ0FBQztJQUVoRCwyRkFBMkY7SUFDM0YsMERBQTBEO0lBQzFELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLEVBQUU7UUFDOUIsTUFBTSxpQkFBaUIsR0FBRywyQkFBYyxDQUFDLEVBQUUsQ0FBQyx3Q0FBbUIsQ0FBQyxnQkFBZ0IsRUFBRSx3Q0FBbUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQzlILE9BQU87WUFDTixpQkFBaUI7WUFDakIsNEJBQTRCLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsd0NBQW1CLENBQUMsTUFBTSxDQUFDO1lBQy9GLGtDQUFrQyxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLHdDQUFtQixDQUFDLG9CQUFvQixDQUFDO1lBQ25ILHVDQUF1QyxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLHdDQUFtQixDQUFDLHFCQUFxQixDQUFD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