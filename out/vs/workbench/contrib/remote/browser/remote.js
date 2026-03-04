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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/uri", "vs/workbench/services/layout/browser/layoutService", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/contrib/remote/browser/remoteExplorer", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/commands/common/commands", "vs/platform/progress/common/progress", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/workbench/browser/actions/windowActions", "vs/base/common/lifecycle", "vs/workbench/contrib/remote/browser/explorerViewItems", "vs/base/common/types", "vs/workbench/services/remote/common/remoteExplorerService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/browser/parts/views/viewPane", "vs/platform/list/browser/listService", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/remote/browser/remoteIcons", "vs/platform/log/common/log", "vs/workbench/services/timer/browser/timerService", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/base/common/network", "vs/base/browser/window", "vs/platform/hover/browser/hover", "vs/css!./media/remoteViewlet"], function (require, exports, nls, dom, uri_1, layoutService_1, telemetry_1, workspace_1, storage_1, configuration_1, instantiation_1, themeService_1, themables_1, contextView_1, extensions_1, viewsViewlet_1, remoteExplorer_1, contextkey_1, views_1, platform_1, opener_1, quickInput_1, commands_1, progress_1, remoteAgentService_1, dialogs_1, severity_1, windowActions_1, lifecycle_1, explorerViewItems_1, types_1, remoteExplorerService_1, environmentService_1, viewPane_1, listService_1, keybinding_1, event_1, descriptors_1, icons, log_1, timerService_1, remoteHosts_1, virtualWorkspace_1, gettingStartedService_1, network_1, window_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentConnectionStatusListener = exports.RemoteMarkers = void 0;
    class HelpTreeVirtualDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return 'HelpItemTemplate';
        }
    }
    class HelpTreeRenderer {
        constructor() {
            this.templateId = 'HelpItemTemplate';
        }
        renderTemplate(container) {
            container.classList.add('remote-help-tree-node-item');
            const icon = dom.append(container, dom.$('.remote-help-tree-node-item-icon'));
            const parent = container;
            return { parent, icon };
        }
        renderElement(element, index, templateData, height) {
            const container = templateData.parent;
            dom.append(container, templateData.icon);
            templateData.icon.classList.add(...element.element.iconClasses);
            const labelContainer = dom.append(container, dom.$('.help-item-label'));
            labelContainer.innerText = element.element.label;
        }
        disposeTemplate(templateData) {
        }
    }
    class HelpDataSource {
        hasChildren(element) {
            return element instanceof HelpModel;
        }
        getChildren(element) {
            if (element instanceof HelpModel && element.items) {
                return element.items;
            }
            return [];
        }
    }
    class HelpModel {
        constructor(viewModel, openerService, quickInputService, commandService, remoteExplorerService, environmentService, workspaceContextService, walkthroughsService) {
            this.viewModel = viewModel;
            this.openerService = openerService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.workspaceContextService = workspaceContextService;
            this.walkthroughsService = walkthroughsService;
            this.updateItems();
            viewModel.onDidChangeHelpInformation(() => this.updateItems());
        }
        createHelpItemValue(info, infoKey) {
            return new HelpItemValue(this.commandService, this.walkthroughsService, info.extensionDescription, (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName, info.virtualWorkspace, info[infoKey]);
        }
        updateItems() {
            const helpItems = [];
            const getStarted = this.viewModel.helpInformation.filter(info => info.getStarted);
            if (getStarted.length) {
                const helpItemValues = getStarted.map((info) => this.createHelpItemValue(info, 'getStarted'));
                const getStartedHelpItem = this.items?.find(item => item.icon === icons.getStartedIcon) ?? new GetStartedHelpItem(icons.getStartedIcon, nls.localize('remote.help.getStarted', "Get Started"), helpItemValues, this.quickInputService, this.environmentService, this.openerService, this.remoteExplorerService, this.workspaceContextService, this.commandService);
                getStartedHelpItem.values = helpItemValues;
                helpItems.push(getStartedHelpItem);
            }
            const documentation = this.viewModel.helpInformation.filter(info => info.documentation);
            if (documentation.length) {
                const helpItemValues = documentation.map((info) => this.createHelpItemValue(info, 'documentation'));
                const documentationHelpItem = this.items?.find(item => item.icon === icons.documentationIcon) ?? new HelpItem(icons.documentationIcon, nls.localize('remote.help.documentation', "Read Documentation"), helpItemValues, this.quickInputService, this.environmentService, this.openerService, this.remoteExplorerService, this.workspaceContextService);
                documentationHelpItem.values = helpItemValues;
                helpItems.push(documentationHelpItem);
            }
            const issues = this.viewModel.helpInformation.filter(info => info.issues);
            if (issues.length) {
                const helpItemValues = issues.map((info) => this.createHelpItemValue(info, 'issues'));
                const reviewIssuesHelpItem = this.items?.find(item => item.icon === icons.reviewIssuesIcon) ?? new HelpItem(icons.reviewIssuesIcon, nls.localize('remote.help.issues', "Review Issues"), helpItemValues, this.quickInputService, this.environmentService, this.openerService, this.remoteExplorerService, this.workspaceContextService);
                reviewIssuesHelpItem.values = helpItemValues;
                helpItems.push(reviewIssuesHelpItem);
            }
            if (helpItems.length) {
                const helpItemValues = this.viewModel.helpInformation.map(info => this.createHelpItemValue(info, 'reportIssue'));
                const issueReporterItem = this.items?.find(item => item.icon === icons.reportIssuesIcon) ?? new IssueReporterItem(icons.reportIssuesIcon, nls.localize('remote.help.report', "Report Issue"), helpItemValues, this.quickInputService, this.environmentService, this.commandService, this.openerService, this.remoteExplorerService, this.workspaceContextService);
                issueReporterItem.values = helpItemValues;
                helpItems.push(issueReporterItem);
            }
            if (helpItems.length) {
                this.items = helpItems;
            }
        }
    }
    class HelpItemValue {
        constructor(commandService, walkthroughService, extensionDescription, remoteAuthority, virtualWorkspace, urlOrCommandOrId) {
            this.commandService = commandService;
            this.walkthroughService = walkthroughService;
            this.extensionDescription = extensionDescription;
            this.remoteAuthority = remoteAuthority;
            this.virtualWorkspace = virtualWorkspace;
            this.urlOrCommandOrId = urlOrCommandOrId;
        }
        get description() {
            return this.getUrl().then(() => this._description);
        }
        get url() {
            return this.getUrl();
        }
        async getUrl() {
            if (this._url === undefined) {
                if (typeof this.urlOrCommandOrId === 'string') {
                    const url = uri_1.URI.parse(this.urlOrCommandOrId);
                    if (url.authority) {
                        this._url = this.urlOrCommandOrId;
                    }
                    else {
                        const urlCommand = this.commandService.executeCommand(this.urlOrCommandOrId).then((result) => {
                            // if executing this command times out, cache its value whenever it eventually resolves
                            this._url = result;
                            return this._url;
                        });
                        // We must be defensive. The command may never return, meaning that no help at all is ever shown!
                        const emptyString = new Promise(resolve => setTimeout(() => resolve(''), 500));
                        this._url = await Promise.race([urlCommand, emptyString]);
                    }
                }
                else if (this.urlOrCommandOrId?.id) {
                    try {
                        const walkthroughId = `${this.extensionDescription.id}#${this.urlOrCommandOrId.id}`;
                        const walkthrough = await this.walkthroughService.getWalkthrough(walkthroughId);
                        this._description = walkthrough.title;
                        this._url = walkthroughId;
                    }
                    catch { }
                }
            }
            if (this._url === undefined) {
                this._url = '';
            }
            return this._url;
        }
    }
    class HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, remoteExplorerService, workspaceContextService) {
            this.icon = icon;
            this.label = label;
            this.values = values;
            this.quickInputService = quickInputService;
            this.environmentService = environmentService;
            this.remoteExplorerService = remoteExplorerService;
            this.workspaceContextService = workspaceContextService;
            this.iconClasses = [];
            this.iconClasses.push(...themables_1.ThemeIcon.asClassNameArray(icon));
            this.iconClasses.push('remote-help-tree-node-item-icon');
        }
        async getActions() {
            return (await Promise.all(this.values.map(async (value) => {
                return {
                    label: value.extensionDescription.displayName || value.extensionDescription.identifier.value,
                    description: await value.description ?? await value.url,
                    url: await value.url,
                    extensionDescription: value.extensionDescription
                };
            }))).filter(item => item.description);
        }
        async handleClick() {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (remoteAuthority) {
                for (let i = 0; i < this.remoteExplorerService.targetType.length; i++) {
                    if (remoteAuthority.startsWith(this.remoteExplorerService.targetType[i])) {
                        for (const value of this.values) {
                            if (value.remoteAuthority) {
                                for (const authority of value.remoteAuthority) {
                                    if (remoteAuthority.startsWith(authority)) {
                                        await this.takeAction(value.extensionDescription, await value.url);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                const virtualWorkspace = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.workspaceContextService.getWorkspace())?.scheme;
                if (virtualWorkspace) {
                    for (let i = 0; i < this.remoteExplorerService.targetType.length; i++) {
                        for (const value of this.values) {
                            if (value.virtualWorkspace && value.remoteAuthority) {
                                for (const authority of value.remoteAuthority) {
                                    if (this.remoteExplorerService.targetType[i].startsWith(authority) && virtualWorkspace.startsWith(value.virtualWorkspace)) {
                                        await this.takeAction(value.extensionDescription, await value.url);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (this.values.length > 1) {
                const actions = await this.getActions();
                if (actions.length) {
                    const action = await this.quickInputService.pick(actions, { placeHolder: nls.localize('pickRemoteExtension', "Select url to open") });
                    if (action) {
                        await this.takeAction(action.extensionDescription, action.url);
                    }
                }
            }
            else {
                await this.takeAction(this.values[0].extensionDescription, await this.values[0].url);
            }
        }
    }
    class GetStartedHelpItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, openerService, remoteExplorerService, workspaceContextService, commandService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService, workspaceContextService);
            this.openerService = openerService;
            this.commandService = commandService;
        }
        async takeAction(extensionDescription, urlOrWalkthroughId) {
            if ([network_1.Schemas.http, network_1.Schemas.https].includes(uri_1.URI.parse(urlOrWalkthroughId).scheme)) {
                this.openerService.open(urlOrWalkthroughId, { allowCommands: true });
                return;
            }
            this.commandService.executeCommand('workbench.action.openWalkthrough', urlOrWalkthroughId);
        }
    }
    class HelpItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, openerService, remoteExplorerService, workspaceContextService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService, workspaceContextService);
            this.openerService = openerService;
        }
        async takeAction(extensionDescription, url) {
            await this.openerService.open(uri_1.URI.parse(url), { allowCommands: true });
        }
    }
    class IssueReporterItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, commandService, openerService, remoteExplorerService, workspaceContextService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService, workspaceContextService);
            this.commandService = commandService;
            this.openerService = openerService;
        }
        async getActions() {
            return Promise.all(this.values.map(async (value) => {
                return {
                    label: value.extensionDescription.displayName || value.extensionDescription.identifier.value,
                    description: '',
                    url: await value.url,
                    extensionDescription: value.extensionDescription
                };
            }));
        }
        async takeAction(extensionDescription, url) {
            if (!url) {
                await this.commandService.executeCommand('workbench.action.openIssueReporter', [extensionDescription.identifier.value]);
            }
            else {
                await this.openerService.open(uri_1.URI.parse(url));
            }
        }
    }
    let HelpPanel = class HelpPanel extends viewPane_1.ViewPane {
        static { this.ID = '~remote.helpPanel'; }
        static { this.TITLE = nls.localize2('remote.help', "Help and feedback"); }
        constructor(viewModel, options, keybindingService, contextMenuService, contextKeyService, configurationService, instantiationService, viewDescriptorService, openerService, quickInputService, commandService, remoteExplorerService, environmentService, themeService, telemetryService, hoverService, workspaceContextService, walkthroughsService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService);
            this.viewModel = viewModel;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.workspaceContextService = workspaceContextService;
            this.walkthroughsService = walkthroughsService;
        }
        renderBody(container) {
            super.renderBody(container);
            container.classList.add('remote-help');
            const treeContainer = document.createElement('div');
            treeContainer.classList.add('remote-help-content');
            container.appendChild(treeContainer);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'RemoteHelp', treeContainer, new HelpTreeVirtualDelegate(), [new HelpTreeRenderer()], new HelpDataSource(), {
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        return item.label;
                    },
                    getWidgetAriaLabel: () => nls.localize('remotehelp', "Remote Help")
                }
            });
            const model = new HelpModel(this.viewModel, this.openerService, this.quickInputService, this.commandService, this.remoteExplorerService, this.environmentService, this.workspaceContextService, this.walkthroughsService);
            this.tree.setInput(model);
            this._register(event_1.Event.debounce(this.tree.onDidOpen, (last, event) => event, 75, true)(e => {
                e.element?.handleClick();
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
    };
    HelpPanel = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, opener_1.IOpenerService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, commands_1.ICommandService),
        __param(11, remoteExplorerService_1.IRemoteExplorerService),
        __param(12, environmentService_1.IWorkbenchEnvironmentService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, hover_1.IHoverService),
        __param(16, workspace_1.IWorkspaceContextService),
        __param(17, gettingStartedService_1.IWalkthroughsService)
    ], HelpPanel);
    class HelpPanelDescriptor {
        constructor(viewModel) {
            this.id = HelpPanel.ID;
            this.name = HelpPanel.TITLE;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.group = 'help@50';
            this.order = -10;
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(HelpPanel, [viewModel]);
        }
    }
    let RemoteViewPaneContainer = class RemoteViewPaneContainer extends viewsViewlet_1.FilterViewPaneContainer {
        constructor(layoutService, telemetryService, contextService, storageService, configurationService, instantiationService, themeService, contextMenuService, extensionService, remoteExplorerService, viewDescriptorService) {
            super(remoteExplorer_1.VIEWLET_ID, remoteExplorerService.onDidChangeTargetType, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService, viewDescriptorService);
            this.remoteExplorerService = remoteExplorerService;
            this.helpPanelDescriptor = new HelpPanelDescriptor(this);
            this.helpInformation = [];
            this._onDidChangeHelpInformation = new event_1.Emitter();
            this.onDidChangeHelpInformation = this._onDidChangeHelpInformation.event;
            this.hasRegisteredHelpView = false;
            this.addConstantViewDescriptors([this.helpPanelDescriptor]);
            this._register(this.remoteSwitcher = this.instantiationService.createInstance(explorerViewItems_1.SwitchRemoteViewItem));
            this.remoteExplorerService.onDidChangeHelpInformation(extensions => {
                this._setHelpInformation(extensions);
            });
            this._setHelpInformation(this.remoteExplorerService.helpInformation);
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.remoteSwitcher.createOptionItems(viewsRegistry.getViews(this.viewContainer));
            this._register(viewsRegistry.onViewsRegistered(e => {
                const remoteViews = [];
                for (const view of e) {
                    if (view.viewContainer.id === remoteExplorer_1.VIEWLET_ID) {
                        remoteViews.push(...view.views);
                    }
                }
                if (remoteViews.length > 0) {
                    this.remoteSwitcher.createOptionItems(remoteViews);
                }
            }));
            this._register(viewsRegistry.onViewsDeregistered(e => {
                if (e.viewContainer.id === remoteExplorer_1.VIEWLET_ID) {
                    this.remoteSwitcher.removeOptionItems(e.views);
                }
            }));
        }
        _setHelpInformation(extensions) {
            const helpInformation = [];
            for (const extension of extensions) {
                this._handleRemoteInfoExtensionPoint(extension, helpInformation);
            }
            this.helpInformation = helpInformation;
            this._onDidChangeHelpInformation.fire();
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            if (this.helpInformation.length && !this.hasRegisteredHelpView) {
                const view = viewsRegistry.getView(this.helpPanelDescriptor.id);
                if (!view) {
                    viewsRegistry.registerViews([this.helpPanelDescriptor], this.viewContainer);
                }
                this.hasRegisteredHelpView = true;
            }
            else if (this.hasRegisteredHelpView) {
                viewsRegistry.deregisterViews([this.helpPanelDescriptor], this.viewContainer);
                this.hasRegisteredHelpView = false;
            }
        }
        _handleRemoteInfoExtensionPoint(extension, helpInformation) {
            if (!(0, extensions_1.isProposedApiEnabled)(extension.description, 'contribRemoteHelp')) {
                return;
            }
            if (!extension.value.documentation && !extension.value.getStarted && !extension.value.issues) {
                return;
            }
            helpInformation.push({
                extensionDescription: extension.description,
                getStarted: extension.value.getStarted,
                documentation: extension.value.documentation,
                reportIssue: extension.value.reportIssue,
                issues: extension.value.issues,
                remoteName: extension.value.remoteName,
                virtualWorkspace: extension.value.virtualWorkspace
            });
        }
        getFilterOn(viewDescriptor) {
            return (0, types_1.isStringArray)(viewDescriptor.remoteAuthority) ? viewDescriptor.remoteAuthority[0] : viewDescriptor.remoteAuthority;
        }
        setFilter(viewDescriptor) {
            this.remoteExplorerService.targetType = (0, types_1.isStringArray)(viewDescriptor.remoteAuthority) ? viewDescriptor.remoteAuthority : [viewDescriptor.remoteAuthority];
        }
        getTitle() {
            const title = nls.localize('remote.explorer', "Remote Explorer");
            return title;
        }
    };
    RemoteViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, extensions_1.IExtensionService),
        __param(9, remoteExplorerService_1.IRemoteExplorerService),
        __param(10, views_1.IViewDescriptorService)
    ], RemoteViewPaneContainer);
    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: remoteExplorer_1.VIEWLET_ID,
        title: nls.localize2('remote.explorer', "Remote Explorer"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(RemoteViewPaneContainer),
        hideIfEmpty: true,
        viewOrderDelegate: {
            getOrder: (group) => {
                if (!group) {
                    return;
                }
                let matches = /^targets@(\d+)$/.exec(group);
                if (matches) {
                    return -1000;
                }
                matches = /^details(@(\d+))?$/.exec(group);
                if (matches) {
                    return -500 + Number(matches[2]);
                }
                matches = /^help(@(\d+))?$/.exec(group);
                if (matches) {
                    return -10;
                }
                return;
            }
        },
        icon: icons.remoteExplorerViewIcon,
        order: 4
    }, 0 /* ViewContainerLocation.Sidebar */);
    let RemoteMarkers = class RemoteMarkers {
        constructor(remoteAgentService, timerService) {
            remoteAgentService.getEnvironment().then(remoteEnv => {
                if (remoteEnv) {
                    timerService.setPerformanceMarks('server', remoteEnv.marks);
                }
            });
        }
    };
    exports.RemoteMarkers = RemoteMarkers;
    exports.RemoteMarkers = RemoteMarkers = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, timerService_1.ITimerService)
    ], RemoteMarkers);
    class VisibleProgress {
        get lastReport() {
            return this._lastReport;
        }
        constructor(progressService, location, initialReport, buttons, onDidCancel) {
            this.location = location;
            this._isDisposed = false;
            this._lastReport = initialReport;
            this._currentProgressPromiseResolve = null;
            this._currentProgress = null;
            this._currentTimer = null;
            const promise = new Promise((resolve) => this._currentProgressPromiseResolve = resolve);
            progressService.withProgress({ location: location, buttons: buttons }, (progress) => { if (!this._isDisposed) {
                this._currentProgress = progress;
            } return promise; }, (choice) => onDidCancel(choice, this._lastReport));
            if (this._lastReport) {
                this.report();
            }
        }
        dispose() {
            this._isDisposed = true;
            if (this._currentProgressPromiseResolve) {
                this._currentProgressPromiseResolve();
                this._currentProgressPromiseResolve = null;
            }
            this._currentProgress = null;
            if (this._currentTimer) {
                this._currentTimer.dispose();
                this._currentTimer = null;
            }
        }
        report(message) {
            if (message) {
                this._lastReport = message;
            }
            if (this._lastReport && this._currentProgress) {
                this._currentProgress.report({ message: this._lastReport });
            }
        }
        startTimer(completionTime) {
            this.stopTimer();
            this._currentTimer = new ReconnectionTimer(this, completionTime);
        }
        stopTimer() {
            if (this._currentTimer) {
                this._currentTimer.dispose();
                this._currentTimer = null;
            }
        }
    }
    class ReconnectionTimer {
        constructor(parent, completionTime) {
            this._parent = parent;
            this._completionTime = completionTime;
            this._renderInterval = dom.disposableWindowInterval(window_1.mainWindow, () => this._render(), 1000);
            this._render();
        }
        dispose() {
            this._renderInterval.dispose();
        }
        _render() {
            const remainingTimeMs = this._completionTime - Date.now();
            if (remainingTimeMs < 0) {
                return;
            }
            const remainingTime = Math.ceil(remainingTimeMs / 1000);
            if (remainingTime === 1) {
                this._parent.report(nls.localize('reconnectionWaitOne', "Attempting to reconnect in {0} second...", remainingTime));
            }
            else {
                this._parent.report(nls.localize('reconnectionWaitMany', "Attempting to reconnect in {0} seconds...", remainingTime));
            }
        }
    }
    /**
     * The time when a prompt is shown to the user
     */
    const DISCONNECT_PROMPT_TIME = 40 * 1000; // 40 seconds
    let RemoteAgentConnectionStatusListener = class RemoteAgentConnectionStatusListener extends lifecycle_1.Disposable {
        constructor(remoteAgentService, progressService, dialogService, commandService, quickInputService, logService, environmentService, telemetryService) {
            super();
            this._reloadWindowShown = false;
            const connection = remoteAgentService.getConnection();
            if (connection) {
                let quickInputVisible = false;
                quickInputService.onShow(() => quickInputVisible = true);
                quickInputService.onHide(() => quickInputVisible = false);
                let visibleProgress = null;
                let reconnectWaitEvent = null;
                let disposableListener = null;
                function showProgress(location, buttons, initialReport = null) {
                    if (visibleProgress) {
                        visibleProgress.dispose();
                        visibleProgress = null;
                    }
                    if (!location) {
                        location = quickInputVisible ? 15 /* ProgressLocation.Notification */ : 20 /* ProgressLocation.Dialog */;
                    }
                    return new VisibleProgress(progressService, location, initialReport, buttons.map(button => button.label), (choice, lastReport) => {
                        // Handle choice from dialog
                        if (typeof choice !== 'undefined' && buttons[choice]) {
                            buttons[choice].callback();
                        }
                        else {
                            if (location === 20 /* ProgressLocation.Dialog */) {
                                visibleProgress = showProgress(15 /* ProgressLocation.Notification */, buttons, lastReport);
                            }
                            else {
                                hideProgress();
                            }
                        }
                    });
                }
                function hideProgress() {
                    if (visibleProgress) {
                        visibleProgress.dispose();
                        visibleProgress = null;
                    }
                }
                let reconnectionToken = '';
                let lastIncomingDataTime = 0;
                let reconnectionAttempts = 0;
                const reconnectButton = {
                    label: nls.localize('reconnectNow', "Reconnect Now"),
                    callback: () => {
                        reconnectWaitEvent?.skipWait();
                    }
                };
                const reloadButton = {
                    label: nls.localize('reloadWindow', "Reload Window"),
                    callback: () => {
                        telemetryService.publicLog2('remoteReconnectionReload', {
                            remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                            reconnectionToken: reconnectionToken,
                            millisSinceLastIncomingData: Date.now() - lastIncomingDataTime,
                            attempt: reconnectionAttempts
                        });
                        commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                    }
                };
                // Possible state transitions:
                // ConnectionGain      -> ConnectionLost
                // ConnectionLost      -> ReconnectionWait, ReconnectionRunning
                // ReconnectionWait    -> ReconnectionRunning
                // ReconnectionRunning -> ConnectionGain, ReconnectionPermanentFailure
                connection.onDidStateChange((e) => {
                    visibleProgress?.stopTimer();
                    if (disposableListener) {
                        disposableListener.dispose();
                        disposableListener = null;
                    }
                    switch (e.type) {
                        case 0 /* PersistentConnectionEventType.ConnectionLost */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = 0;
                            telemetryService.publicLog2('remoteConnectionLost', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                            });
                            if (visibleProgress || e.millisSinceLastIncomingData > DISCONNECT_PROMPT_TIME) {
                                if (!visibleProgress) {
                                    visibleProgress = showProgress(null, [reconnectButton, reloadButton]);
                                }
                                visibleProgress.report(nls.localize('connectionLost', "Connection Lost"));
                            }
                            break;
                        case 1 /* PersistentConnectionEventType.ReconnectionWait */:
                            if (visibleProgress) {
                                reconnectWaitEvent = e;
                                visibleProgress = showProgress(null, [reconnectButton, reloadButton]);
                                visibleProgress.startTimer(Date.now() + 1000 * e.durationSeconds);
                            }
                            break;
                        case 2 /* PersistentConnectionEventType.ReconnectionRunning */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteReconnectionRunning', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt
                            });
                            if (visibleProgress || e.millisSinceLastIncomingData > DISCONNECT_PROMPT_TIME) {
                                visibleProgress = showProgress(null, [reloadButton]);
                                visibleProgress.report(nls.localize('reconnectionRunning', "Disconnected. Attempting to reconnect..."));
                                // Register to listen for quick input is opened
                                disposableListener = quickInputService.onShow(() => {
                                    // Need to move from dialog if being shown and user needs to type in a prompt
                                    if (visibleProgress && visibleProgress.location === 20 /* ProgressLocation.Dialog */) {
                                        visibleProgress = showProgress(15 /* ProgressLocation.Notification */, [reloadButton], visibleProgress.lastReport);
                                    }
                                });
                            }
                            break;
                        case 3 /* PersistentConnectionEventType.ReconnectionPermanentFailure */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteReconnectionPermanentFailure', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt,
                                handled: e.handled
                            });
                            hideProgress();
                            if (e.handled) {
                                logService.info(`Error handled: Not showing a notification for the error.`);
                                console.log(`Error handled: Not showing a notification for the error.`);
                            }
                            else if (!this._reloadWindowShown) {
                                this._reloadWindowShown = true;
                                dialogService.confirm({
                                    type: severity_1.default.Error,
                                    message: nls.localize('reconnectionPermanentFailure', "Cannot reconnect. Please reload the window."),
                                    primaryButton: nls.localize({ key: 'reloadWindow.dialog', comment: ['&& denotes a mnemonic'] }, "&&Reload Window")
                                }).then(result => {
                                    if (result.confirmed) {
                                        commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                                    }
                                });
                            }
                            break;
                        case 4 /* PersistentConnectionEventType.ConnectionGain */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteConnectionGain', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt
                            });
                            hideProgress();
                            break;
                    }
                });
            }
        }
    };
    exports.RemoteAgentConnectionStatusListener = RemoteAgentConnectionStatusListener;
    exports.RemoteAgentConnectionStatusListener = RemoteAgentConnectionStatusListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, progress_1.IProgressService),
        __param(2, dialogs_1.IDialogService),
        __param(3, commands_1.ICommandService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, log_1.ILogService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, telemetry_1.ITelemetryService)
    ], RemoteAgentConnectionStatusListener);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2Jyb3dzZXIvcmVtb3RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTREaEcsTUFBTSx1QkFBdUI7UUFDNUIsU0FBUyxDQUFDLE9BQWtCO1lBQzNCLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUFrQjtZQUMvQixPQUFPLGtCQUFrQixDQUFDO1FBQzNCLENBQUM7S0FDRDtJQU9ELE1BQU0sZ0JBQWdCO1FBQXRCO1lBQ0MsZUFBVSxHQUFXLGtCQUFrQixDQUFDO1FBb0J6QyxDQUFDO1FBbEJBLGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUN6QixPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDO1FBQ3pCLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBd0MsRUFBRSxLQUFhLEVBQUUsWUFBbUMsRUFBRSxNQUEwQjtZQUNySSxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO1lBQ3RDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxD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