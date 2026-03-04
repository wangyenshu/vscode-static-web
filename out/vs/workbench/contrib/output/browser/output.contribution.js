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
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/editor/common/languages/modesRegistry", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/output/browser/outputServices", "vs/workbench/services/output/common/output", "vs/workbench/contrib/output/browser/outputView", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/configuration/common/configurationRegistry", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/platform/action/common/actionCommonCategories", "vs/base/common/lifecycle", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/log/common/log", "vs/workbench/contrib/logs/common/defaultLogLevels"], function (require, exports, nls, keyCodes_1, modesRegistry_1, platform_1, actions_1, extensions_1, outputServices_1, output_1, outputView_1, descriptors_1, contributions_1, views_1, viewsService_1, viewPaneContainer_1, configurationRegistry_1, quickInput_1, editorService_1, types_1, contextkey_1, codicons_1, iconRegistry_1, actionCommonCategories_1, lifecycle_1, filesConfigurationService_1, accessibilitySignalService_1, log_1, defaultLogLevels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register Service
    (0, extensions_1.registerSingleton)(output_1.IOutputService, outputServices_1.OutputService, 1 /* InstantiationType.Delayed */);
    // Register Output Mode
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: output_1.OUTPUT_MODE_ID,
        extensions: [],
        mimetypes: [output_1.OUTPUT_MIME]
    });
    // Register Log Output Mode
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: output_1.LOG_MODE_ID,
        extensions: [],
        mimetypes: [output_1.LOG_MIME]
    });
    // register output container
    const outputViewIcon = (0, iconRegistry_1.registerIcon)('output-view-icon', codicons_1.Codicon.output, nls.localize('outputViewIcon', 'View icon of the output view.'));
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: output_1.OUTPUT_VIEW_ID,
        title: nls.localize2('output', "Output"),
        icon: outputViewIcon,
        order: 1,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [output_1.OUTPUT_VIEW_ID, { mergeViewWithContainerWhenSingleView: true }]),
        storageId: output_1.OUTPUT_VIEW_ID,
        hideIfEmpty: true,
    }, 1 /* ViewContainerLocation.Panel */, { doNotRegisterOpenCommand: true });
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: output_1.OUTPUT_VIEW_ID,
            name: nls.localize2('output', "Output"),
            containerIcon: outputViewIcon,
            canMoveView: true,
            canToggleVisibility: false,
            ctorDescriptor: new descriptors_1.SyncDescriptor(outputView_1.OutputViewPane),
            openCommandActionDescriptor: {
                id: 'workbench.action.output.toggleOutput',
                mnemonicTitle: nls.localize({ key: 'miToggleOutput', comment: ['&& denotes a mnemonic'] }, "&&Output"),
                keybindings: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 51 /* KeyCode.KeyU */,
                    linux: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 38 /* KeyCode.KeyH */) // On Ubuntu Ctrl+Shift+U is taken by some global OS command
                    }
                },
                order: 1,
            }
        }], VIEW_CONTAINER);
    let OutputContribution = class OutputContribution extends lifecycle_1.Disposable {
        constructor(outputService, editorService, fileConfigurationService) {
            super();
            this.outputService = outputService;
            this.editorService = editorService;
            this.fileConfigurationService = fileConfigurationService;
            this.registerActions();
        }
        registerActions() {
            this.registerSwitchOutputAction();
            this.registerShowOutputChannelsAction();
            this.registerClearOutputAction();
            this.registerToggleAutoScrollAction();
            this.registerOpenActiveOutputFileAction();
            this.registerOpenActiveOutputFileInAuxWindowAction();
            this.registerShowLogsAction();
            this.registerOpenLogFileAction();
            this.registerConfigureActiveOutputLogLevelAction();
        }
        registerSwitchOutputAction() {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.output.action.switchBetweenOutputs`,
                        title: nls.localize('switchBetweenOutputs.label', "Switch Output"),
                    });
                }
                async run(accessor, channelId) {
                    if (channelId) {
                        accessor.get(output_1.IOutputService).showChannel(channelId, true);
                    }
                }
            }));
            const switchOutputMenu = new actions_1.MenuId('workbench.output.menu.switchOutput');
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewTitle, {
                submenu: switchOutputMenu,
                title: nls.localize('switchToOutput.label', "Switch Output"),
                group: 'navigation',
                when: contextkey_1.ContextKeyExpr.equals('view', output_1.OUTPUT_VIEW_ID),
                order: 1,
                isSelection: true
            }));
            const registeredChannels = new Map();
            this._register((0, lifecycle_1.toDisposable)(() => (0, lifecycle_1.dispose)(registeredChannels.values())));
            const registerOutputChannels = (channels) => {
                for (const channel of channels) {
                    const title = channel.label;
                    const group = channel.extensionId ? '0_ext_outputchannels' : '1_core_outputchannels';
                    registeredChannels.set(channel.id, (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                        constructor() {
                            super({
                                id: `workbench.action.output.show.${channel.id}`,
                                title,
                                toggled: output_1.ACTIVE_OUTPUT_CHANNEL_CONTEXT.isEqualTo(channel.id),
                                menu: {
                                    id: switchOutputMenu,
                                    group,
                                }
                            });
                        }
                        async run(accessor) {
                            return accessor.get(output_1.IOutputService).showChannel(channel.id, true);
                        }
                    }));
                }
            };
            registerOutputChannels(this.outputService.getChannelDescriptors());
            const outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
            this._register(outputChannelRegistry.onDidRegisterChannel(e => {
                const channel = this.outputService.getChannelDescriptor(e);
                if (channel) {
                    registerOutputChannels([channel]);
                }
            }));
            this._register(outputChannelRegistry.onDidRemoveChannel(e => {
                registeredChannels.get(e)?.dispose();
                registeredChannels.delete(e);
            }));
        }
        registerShowOutputChannelsAction() {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.showOutputChannels',
                        title: nls.localize2('showOutputChannels', "Show Output Channels..."),
                        category: nls.localize2('output', "Output"),
                        f1: true
                    });
                }
                async run(accessor) {
                    const outputService = accessor.get(output_1.IOutputService);
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const extensionChannels = [], coreChannels = [];
                    for (const channel of outputService.getChannelDescriptors()) {
                        if (channel.extensionId) {
                            extensionChannels.push(channel);
                        }
                        else {
                            coreChannels.push(channel);
                        }
                    }
                    const entries = [];
                    for (const { id, label } of extensionChannels) {
                        entries.push({ id, label });
                    }
                    if (extensionChannels.length && coreChannels.length) {
                        entries.push({ type: 'separator' });
                    }
                    for (const { id, label } of coreChannels) {
                        entries.push({ id, label });
                    }
                    const entry = await quickInputService.pick(entries, { placeHolder: nls.localize('selectOutput', "Select Output Channel") });
                    if (entry) {
                        return outputService.showChannel(entry.id);
                    }
                }
            }));
        }
        registerClearOutputAction() {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.output.action.clearOutput`,
                        title: nls.localize2('clearOutput.label', "Clear Output"),
                        category: actionCommonCategories_1.Categories.View,
                        menu: [{
                                id: actions_1.MenuId.ViewTitle,
                                when: contextkey_1.ContextKeyExpr.equals('view', output_1.OUTPUT_VIEW_ID),
                                group: 'navigation',
                                order: 2
                            }, {
                                id: actions_1.MenuId.CommandPalette
                            }, {
                                id: actions_1.MenuId.EditorContext,
                                when: output_1.CONTEXT_IN_OUTPUT
                            }],
                        icon: codicons_1.Codicon.clearAll
                    });
                }
                async run(accessor) {
                    const outputService = accessor.get(output_1.IOutputService);
                    const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
                    const activeChannel = outputService.getActiveChannel();
                    if (activeChannel) {
                        activeChannel.clear();
                        accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
                    }
                }
            }));
        }
        registerToggleAutoScrollAction() {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.output.action.toggleAutoScroll`,
                        title: nls.localize2('toggleAutoScroll', "Toggle Auto Scrolling"),
                        tooltip: nls.localize('outputScrollOff', "Turn Auto Scrolling Off"),
                        menu: {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', output_1.OUTPUT_VIEW_ID)),
                            group: 'navigation',
                            order: 3,
                        },
                        icon: codicons_1.Codicon.lock,
                        toggled: {
                            condition: output_1.CONTEXT_OUTPUT_SCROLL_LOCK,
                            icon: codicons_1.Codicon.unlock,
                            tooltip: nls.localize('outputScrollOn', "Turn Auto Scrolling On")
                        }
                    });
                }
                async run(accessor) {
                    const outputView = accessor.get(viewsService_1.IViewsService).getActiveViewWithId(output_1.OUTPUT_VIEW_ID);
                    outputView.scrollLock = !outputView.scrollLock;
                }
            }));
        }
        registerOpenActiveOutputFileAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.action.openActiveLogOutputFile`,
                        title: nls.localize2('openActiveOutputFile', "Open Output in Editor"),
                        menu: [{
                                id: actions_1.MenuId.ViewTitle,
                                when: contextkey_1.ContextKeyExpr.equals('view', output_1.OUTPUT_VIEW_ID),
                                group: 'navigation',
                                order: 4,
                                isHiddenByDefault: true
                            }],
                        icon: codicons_1.Codicon.goToFile,
                        precondition: output_1.CONTEXT_ACTIVE_FILE_OUTPUT
                    });
                }
                async run() {
                    that.openActiveOutoutFile();
                }
            }));
        }
        registerOpenActiveOutputFileInAuxWindowAction() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.action.openActiveLogOutputFileInNewWindow`,
                        title: nls.localize2('openActiveOutputFileInNewWindow', "Open Output in New Window"),
                        menu: [{
                                id: actions_1.MenuId.ViewTitle,
                                when: contextkey_1.ContextKeyExpr.equals('view', output_1.OUTPUT_VIEW_ID),
                                group: 'navigation',
                                order: 5,
                                isHiddenByDefault: true
                            }],
                        icon: codicons_1.Codicon.emptyWindow,
                        precondition: output_1.CONTEXT_ACTIVE_FILE_OUTPUT
                    });
                }
                async run() {
                    that.openActiveOutoutFile(editorService_1.AUX_WINDOW_GROUP);
                }
            }));
        }
        async openActiveOutoutFile(group) {
            const fileOutputChannelDescriptor = this.getFileOutputChannelDescriptor();
            if (fileOutputChannelDescriptor) {
                await this.fileConfigurationService.updateReadonly(fileOutputChannelDescriptor.file, true);
                await this.editorService.openEditor({
                    resource: fileOutputChannelDescriptor.file,
                    options: {
                        pinned: true,
                    },
                }, group);
            }
        }
        getFileOutputChannelDescriptor() {
            const channel = this.outputService.getActiveChannel();
            if (channel) {
                const descriptor = this.outputService.getChannelDescriptors().filter(c => c.id === channel.id)[0];
                if (descriptor?.file) {
                    return descriptor;
                }
            }
            return null;
        }
        registerConfigureActiveOutputLogLevelAction() {
            const that = this;
            const logLevelMenu = new actions_1.MenuId('workbench.output.menu.logLevel');
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewTitle, {
                submenu: logLevelMenu,
                title: nls.localize('logLevel.label', "Set Log Level..."),
                group: 'navigation',
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', output_1.OUTPUT_VIEW_ID), output_1.CONTEXT_ACTIVE_OUTPUT_LEVEL_SETTABLE),
                icon: codicons_1.Codicon.gear,
                order: 6
            }));
            let order = 0;
            const registerLogLevel = (logLevel) => {
                this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: `workbench.action.output.activeOutputLogLevel.${logLevel}`,
                            title: (0, log_1.LogLevelToLocalizedString)(logLevel).value,
                            toggled: output_1.CONTEXT_ACTIVE_OUTPUT_LEVEL.isEqualTo((0, log_1.LogLevelToString)(logLevel)),
                            menu: {
                                id: logLevelMenu,
                                order: order++,
                                group: '0_level'
                            }
                        });
                    }
                    async run(accessor) {
                        const channel = that.outputService.getActiveChannel();
                        if (channel) {
                            const channelDescriptor = that.outputService.getChannelDescriptor(channel.id);
                            if (channelDescriptor?.log && channelDescriptor.file) {
                                return accessor.get(log_1.ILoggerService).setLogLevel(channelDescriptor.file, logLevel);
                            }
                        }
                    }
                }));
            };
            registerLogLevel(log_1.LogLevel.Trace);
            registerLogLevel(log_1.LogLevel.Debug);
            registerLogLevel(log_1.LogLevel.Info);
            registerLogLevel(log_1.LogLevel.Warning);
            registerLogLevel(log_1.LogLevel.Error);
            registerLogLevel(log_1.LogLevel.Off);
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.action.output.activeOutputLogLevelDefault`,
                        title: nls.localize('logLevelDefault.label', "Set As Default"),
                        menu: {
                            id: logLevelMenu,
                            order,
                            group: '1_default'
                        },
                        precondition: output_1.CONTEXT_ACTIVE_OUTPUT_LEVEL_IS_DEFAULT.negate()
                    });
                }
                async run(accessor) {
                    const channel = that.outputService.getActiveChannel();
                    if (channel) {
                        const channelDescriptor = that.outputService.getChannelDescriptor(channel.id);
                        if (channelDescriptor?.log && channelDescriptor.file) {
                            const logLevel = accessor.get(log_1.ILoggerService).getLogLevel(channelDescriptor.file);
                            return await accessor.get(defaultLogLevels_1.IDefaultLogLevelsService).setDefaultLogLevel(logLevel, channelDescriptor.extensionId);
                        }
                    }
                }
            }));
        }
        registerShowLogsAction() {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.showLogs',
                        title: nls.localize2('showLogs', "Show Logs..."),
                        category: actionCommonCategories_1.Categories.Developer,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                        },
                    });
                }
                async run(accessor) {
                    const outputService = accessor.get(output_1.IOutputService);
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const extensionLogs = [], logs = [];
                    for (const channel of outputService.getChannelDescriptors()) {
                        if (channel.log) {
                            if (channel.extensionId) {
                                extensionLogs.push(channel);
                            }
                            else {
                                logs.push(channel);
                            }
                        }
                    }
                    const entries = [];
                    for (const { id, label } of logs) {
                        entries.push({ id, label });
                    }
                    if (extensionLogs.length && logs.length) {
                        entries.push({ type: 'separator', label: nls.localize('extensionLogs', "Extension Logs") });
                    }
                    for (const { id, label } of extensionLogs) {
                        entries.push({ id, label });
                    }
                    const entry = await quickInputService.pick(entries, { placeHolder: nls.localize('selectlog', "Select Log") });
                    if (entry) {
                        return outputService.showChannel(entry.id);
                    }
                }
            }));
        }
        registerOpenLogFileAction() {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openLogFile',
                        title: nls.localize2('openLogFile', "Open Log File..."),
                        category: actionCommonCategories_1.Categories.Developer,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                        },
                        metadata: {
                            description: 'workbench.action.openLogFile',
                            args: [{
                                    name: 'logFile',
                                    schema: {
                                        markdownDescription: nls.localize('logFile', "The id of the log file to open, for example `\"window\"`. Currently the best way to get this is to get the ID by checking the `workbench.action.output.show.<id>` commands"),
                                        type: 'string'
                                    }
                                }]
                        },
                    });
                }
                async run(accessor, args) {
                    const outputService = accessor.get(output_1.IOutputService);
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const editorService = accessor.get(editorService_1.IEditorService);
                    const fileConfigurationService = accessor.get(filesConfigurationService_1.IFilesConfigurationService);
                    let entry;
                    const argName = args && typeof args === 'string' ? args : undefined;
                    const extensionChannels = [];
                    const coreChannels = [];
                    for (const c of outputService.getChannelDescriptors()) {
                        if (c.file && c.log) {
                            const e = { id: c.id, label: c.label, channel: c };
                            if (c.extensionId) {
                                extensionChannels.push(e);
                            }
                            else {
                                coreChannels.push(e);
                            }
                            if (e.id === argName) {
                                entry = e;
                            }
                        }
                    }
                    if (!entry) {
                        const entries = [...extensionChannels.sort((a, b) => a.label.localeCompare(b.label))];
                        if (entries.length && coreChannels.length) {
                            entries.push({ type: 'separator' });
                            entries.push(...coreChannels.sort((a, b) => a.label.localeCompare(b.label)));
                        }
                        entry = await quickInputService.pick(entries, { placeHolder: nls.localize('selectlogFile', "Select Log File") });
                    }
                    if (entry) {
                        const resource = (0, types_1.assertIsDefined)(entry.channel.file);
                        await fileConfigurationService.updateReadonly(resource, true);
                        await editorService.openEditor({
                            resource,
                            options: {
                                pinned: true,
                            }
                        });
                    }
                }
            }));
        }
    };
    OutputContribution = __decorate([
        __param(0, output_1.IOutputService),
        __param(1, editorService_1.IEditorService),
        __param(2, filesConfigurationService_1.IFilesConfigurationService)
    ], OutputContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(OutputContribution, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'output',
        order: 30,
        title: nls.localize('output', "Output"),
        type: 'object',
        properties: {
            'output.smartScroll.enabled': {
                type: 'boolean',
                description: nls.localize('output.smartScroll.enabled', "Enable/disable the ability of smart scrolling in the output view. Smart scrolling allows you to lock scrolling automatically when you click in the output view and unlocks when you click in the last line."),
                default: true,
                scope: 3 /* ConfigurationScope.WINDOW */,
                tags: ['output']
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL291dHB1dC9icm93c2VyL291dHB1dC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHLG1CQUFtQjtJQUNuQixJQUFBLDhCQUFpQixFQUFDLHVCQUFjLEVBQUUsOEJBQWEsb0NBQTRCLENBQUM7SUFFNUUsdUJBQXVCO0lBQ3ZCLDZCQUFhLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsRUFBRSxFQUFFLHVCQUFjO1FBQ2xCLFVBQVUsRUFBRSxFQUFFO1FBQ2QsU0FBUyxFQUFFLENBQUMsb0JBQVcsQ0FBQztLQUN4QixDQUFDLENBQUM7SUFFSCwyQkFBMkI7SUFDM0IsNkJBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixFQUFFLEVBQUUsb0JBQVc7UUFDZixVQUFVLEVBQUUsRUFBRTtRQUNkLFNBQVMsRUFBRSxDQUFDLGlCQUFRLENBQUM7S0FDckIsQ0FBQyxDQUFDO0lBRUgsNEJBQTRCO0lBQzVCLE1BQU0sY0FBYyxHQUFHLElBQUEsMkJBQVksRUFBQyxrQkFBa0IsRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLCtCQUErQixDQUFDLENBQUMsQ0FBQztJQUN6SSxNQUFNLGNBQWMsR0FBa0IsbUJBQVEsQ0FBQyxFQUFFLENBQTBCLGtCQUF1QixDQUFDLHNCQUFzQixDQUFDLENBQUMscUJBQXFCLENBQUM7UUFDaEosRUFBRSxFQUFFLHVCQUFjO1FBQ2xCLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUM7UUFDeEMsSUFBSSxFQUFFLGNBQWM7UUFDcEIsS0FB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