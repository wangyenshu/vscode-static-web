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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/base/common/themables", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/workbench/contrib/notebook/browser/controller/coreActions"], function (require, exports, arrays_1, async_1, cancellation_1, codicons_1, event_1, lifecycle_1, strings_1, nls_1, commands_1, label_1, log_1, productService_1, quickInput_1, themables_1, extensions_1, notebookBrowser_1, notebookIcons_1, notebookKernelService_1, extensions_2, panecomposite_1, uri_1, opener_1, coreActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KernelPickerMRUStrategy = void 0;
    function isKernelPick(item) {
        return 'kernel' in item;
    }
    function isGroupedKernelsPick(item) {
        return 'kernels' in item;
    }
    function isSourcePick(item) {
        return 'action' in item;
    }
    function isInstallExtensionPick(item) {
        return item.id === 'installSuggested' && 'extensionIds' in item;
    }
    function isSearchMarketplacePick(item) {
        return item.id === 'install';
    }
    function isKernelSourceQuickPickItem(item) {
        return 'command' in item;
    }
    function supportAutoRun(item) {
        return 'autoRun' in item && !!item.autoRun;
    }
    const KERNEL_PICKER_UPDATE_DEBOUNCE = 200;
    function toKernelQuickPick(kernel, selected) {
        const res = {
            kernel,
            picked: kernel.id === selected?.id,
            label: kernel.label,
            description: kernel.description,
            detail: kernel.detail
        };
        if (kernel.id === selected?.id) {
            if (!res.description) {
                res.description = (0, nls_1.localize)('current1', "Currently Selected");
            }
            else {
                res.description = (0, nls_1.localize)('current2', "{0} - Currently Selected", res.description);
            }
        }
        return res;
    }
    class KernelPickerStrategyBase {
        constructor(_notebookKernelService, _productService, _quickInputService, _labelService, _logService, _paneCompositePartService, _extensionWorkbenchService, _extensionService, _commandService) {
            this._notebookKernelService = _notebookKernelService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._labelService = _labelService;
            this._logService = _logService;
            this._paneCompositePartService = _paneCompositePartService;
            this._extensionWorkbenchService = _extensionWorkbenchService;
            this._extensionService = _extensionService;
            this._commandService = _commandService;
        }
        async showQuickPick(editor, wantedId, skipAutoRun) {
            const notebook = editor.textModel;
            const scopedContextKeyService = editor.scopedContextKeyService;
            const matchResult = this._getMatchingResult(notebook);
            const { selected, all } = matchResult;
            let newKernel;
            if (wantedId) {
                for (const candidate of all) {
                    if (candidate.id === wantedId) {
                        newKernel = candidate;
                        break;
                    }
                }
                if (!newKernel) {
                    this._logService.warn(`wanted kernel DOES NOT EXIST, wanted: ${wantedId}, all: ${all.map(k => k.id)}`);
                    return false;
                }
            }
            if (newKernel) {
                this._selecteKernel(notebook, newKernel);
                return true;
            }
            const quickPick = this._quickInputService.createQuickPick();
            const quickPickItems = this._getKernelPickerQuickPickItems(notebook, matchResult, this._notebookKernelService, scopedContextKeyService);
            if (quickPickItems.length === 1 && supportAutoRun(quickPickItems[0]) && !skipAutoRun) {
                return await this._handleQuickPick(editor, quickPickItems[0], quickPickItems);
            }
            quickPick.items = quickPickItems;
            quickPick.canSelectMany = false;
            quickPick.placeholder = selected
                ? (0, nls_1.localize)('prompt.placeholder.change', "Change kernel for '{0}'", this._labelService.getUriLabel(notebook.uri, { relative: true }))
                : (0, nls_1.localize)('prompt.placeholder.select', "Select kernel for '{0}'", this._labelService.getUriLabel(notebook.uri, { relative: true }));
            quickPick.busy = this._notebookKernelService.getKernelDetectionTasks(notebook).length > 0;
            const kernelDetectionTaskListener = this._notebookKernelService.onDidChangeKernelDetectionTasks(() => {
                quickPick.busy = this._notebookKernelService.getKernelDetectionTasks(notebook).length > 0;
            });
            // run extension recommendataion task if quickPickItems is empty
            const extensionRecommendataionPromise = quickPickItems.length === 0
                ? (0, async_1.createCancelablePromise)(token => this._showInstallKernelExtensionRecommendation(notebook, quickPick, this._extensionWorkbenchService, token))
                : undefined;
            const kernelChangeEventListener = event_1.Event.debounce(event_1.Event.any(this._notebookKernelService.onDidChangeSourceActions, this._notebookKernelService.onDidAddKernel, this._notebookKernelService.onDidRemoveKernel, this._notebookKernelService.onDidChangeNotebookAffinity), (last, _current) => last, KERNEL_PICKER_UPDATE_DEBOUNCE)(async () => {
                // reset quick pick progress
                quickPick.busy = false;
                extensionRecommendataionPromise?.cancel();
                const currentActiveItems = quickPick.activeItems;
                const matchResult = this._getMatchingResult(notebook);
                const quickPickItems = this._getKernelPickerQuickPickItems(notebook, matchResult, this._notebookKernelService, scopedContextKeyService);
                quickPick.keepScrollPosition = true;
                // recalcuate active items
                const activeItems = [];
                for (const item of currentActiveItems) {
                    if (isKernelPick(item)) {
                        const kernelId = item.kernel.id;
                        const sameItem = quickPickItems.find(pi => isKernelPick(pi) && pi.kernel.id === kernelId);
                        if (sameItem) {
                            activeItems.push(sameItem);
                        }
                    }
                    else if (isSourcePick(item)) {
                        const sameItem = quickPickItems.find(pi => isSourcePick(pi) && pi.action.action.id === item.action.action.id);
                        if (sameItem) {
                            activeItems.push(sameItem);
                        }
                    }
                }
                quickPick.items = quickPickItems;
                quickPick.activeItems = activeItems;
            }, this);
            const pick = await new Promise((resolve, reject) => {
                quickPick.onDidAccept(() => {
                    const item = quickPick.selectedItems[0];
                    if (item) {
                        resolve({ selected: item, items: quickPick.items });
                    }
                    else {
                        resolve({ selected: undefined, items: quickPick.items });
                    }
                    quickPick.hide();
                });
                quickPick.onDidHide(() => {
                    kernelDetectionTaskListener.dispose();
                    kernelChangeEventListener.dispose();
                    quickPick.dispose();
                    resolve({ selected: undefined, items: quickPick.items });
                });
                quickPick.show();
            });
            if (pick.selected) {
                return await this._handleQuickPick(editor, pick.selected, pick.items);
            }
            return false;
        }
        _getMatchingResult(notebook) {
            return this._notebookKernelService.getMatchingKernel(notebook);
        }
        async _handleQuickPick(editor, pick, quickPickItems) {
            if (isKernelPick(pick)) {
                const newKernel = pick.kernel;
                this._selecteKernel(editor.textModel, newKernel);
                return true;
            }
            // actions
            if (isSearchMarketplacePick(pick)) {
                await this._showKernelExtension(this._paneCompositePartService, this._extensionWorkbenchService, this._extensionService, editor.textModel.viewType, []);
                // suggestedExtension must be defined for this option to be shown, but still check to make TS happy
            }
            else if (isInstallExtensionPick(pick)) {
                await this._showKernelExtension(this._paneCompositePartService, this._extensionWorkbenchService, this._extensionService, editor.textModel.viewType, pick.extensionIds, this._productService.quality !== 'stable');
            }
            else if (isSourcePick(pick)) {
                // selected explicilty, it should trigger the execution?
                pick.action.runAction();
            }
            return true;
        }
        _selecteKernel(notebook, kernel) {
            this._notebookKernelService.selectKernelForNotebook(kernel, notebook);
        }
        async _showKernelExtension(paneCompositePartService, extensionWorkbenchService, extensionService, viewType, extIds, isInsiders) {
            // If extension id is provided attempt to install the extension as the user has requested the suggested ones be installed
            const extensionsToInstall = [];
            const extensionsToEnable = [];
            for (const extId of extIds) {
                const extension = (await extensionWorkbenchService.getExtensions([{ id: extId }], cancellation_1.CancellationToken.None))[0];
                if (extension.enablementState === 6 /* EnablementState.DisabledGlobally */ || extension.enablementState === 7 /* EnablementState.DisabledWorkspace */ || extension.enablementState === 2 /* EnablementState.DisabledByEnvironment */) {
                    extensionsToEnable.push(extension);
                }
                else {
                    const canInstall = await extensionWorkbenchService.canInstall(extension);
                    if (canInstall) {
                        extensionsToInstall.push(extension);
                    }
                }
            }
            if (extensionsToInstall.length || extensionsToEnable.length) {
                await Promise.all([...extensionsToInstall.map(async (extension) => {
                        await extensionWorkbenchService.install(extension, {
                            installPreReleaseVersion: isInsiders ?? false,
                            context: { skipWalkthrough: true }
                        }, 15 /* ProgressLocation.Notification */);
                    }), ...extensionsToEnable.map(async (extension) => {
                        switch (extension.enablementState) {
                            case 7 /* EnablementState.DisabledWorkspace */:
                                await extensionWorkbenchService.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
                                return;
                            case 6 /* EnablementState.DisabledGlobally */:
                                await extensionWorkbenchService.setEnablement([extension], 8 /* EnablementState.EnabledGlobally */);
                                return;
                            case 2 /* EnablementState.DisabledByEnvironment */:
                                await extensionWorkbenchService.setEnablement([extension], 3 /* EnablementState.EnabledByEnvironment */);
                                return;
                            default:
                                break;
                        }
                    })]);
                await extensionService.activateByEvent(`onNotebook:${viewType}`);
                return;
            }
            const viewlet = await paneCompositePartService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const view = viewlet?.getViewPaneContainer();
            const pascalCased = viewType.split(/[^a-z0-9]/ig).map(strings_1.uppercaseFirstLetter).join('');
            view?.search(`@tag:notebookKernel${pascalCased}`);
        }
        async _showInstallKernelExtensionRecommendation(notebookTextModel, quickPick, extensionWorkbenchService, token) {
            quickPick.busy = true;
            const newQuickPickItems = await this._getKernelRecommendationsQuickPickItems(notebookTextModel, extensionWorkbenchService);
            quickPick.busy = false;
            if (token.isCancellationRequested) {
                return;
            }
            if (newQuickPickItems && quickPick.items.length === 0) {
                quickPick.items = newQuickPickItems;
            }
        }
        async _getKernelRecommendationsQuickPickItems(notebookTextModel, extensionWorkbenchService) {
            const quickPickItems = [];
            const language = this.getSuggestedLanguage(notebookTextModel);
            const suggestedExtension = language ? this.getSuggestedKernelFromLanguage(notebookTextModel.viewType, language) : undefined;
            if (suggestedExtension) {
                await extensionWorkbenchService.queryLocal();
                const extensions = extensionWorkbenchService.installed.filter(e => (e.enablementState === 3 /* EnablementState.EnabledByEnvironment */ || e.enablementState === 8 /* EnablementState.EnabledGlobally */ || e.enablementState === 9 /* EnablementState.EnabledWorkspace */)
                    && suggestedExtension.extensionIds.includes(e.identifier.id));
                if (extensions.length === suggestedExtension.extensionIds.length) {
                    // it's installed but might be detecting kernels
                    return undefined;
                }
                // We have a suggested kernel, show an option to install it
                quickPickItems.push({
                    id: 'installSuggested',
                    description: suggestedExtension.displayName ?? suggestedExtension.extensionIds.join(', '),
                    label: `$(${codicons_1.Codicon.lightbulb.id}) ` + (0, nls_1.localize)('installSuggestedKernel', 'Install/Enable suggested extensions'),
                    extensionIds: suggestedExtension.extensionIds
                });
            }
            // there is no kernel, show the install from marketplace
            quickPickItems.push({
                id: 'install',
                label: (0, nls_1.localize)('searchForKernels', "Browse marketplace for kernel extensions"),
            });
            return quickPickItems;
        }
        /**
         * Examine the most common language in the notebook
         * @param notebookTextModel The notebook text model
         * @returns What the suggested language is for the notebook. Used for kernal installing
         */
        getSuggestedLanguage(notebookTextModel) {
            const metaData = notebookTextModel.metadata;
            let suggestedKernelLanguage = metaData?.metadata?.language_info?.name;
            // TODO how do we suggest multi language notebooks?
            if (!suggestedKernelLanguage) {
                const cellLanguages = notebookTextModel.cells.map(cell => cell.language).filter(language => language !== 'markdown');
                // Check if cell languages is all the same
                if (cellLanguages.length > 1) {
                    const firstLanguage = cellLanguages[0];
                    if (cellLanguages.every(language => language === firstLanguage)) {
                        suggestedKernelLanguage = firstLanguage;
                    }
                }
            }
            return suggestedKernelLanguage;
        }
        /**
         * Given a language and notebook view type suggest a kernel for installation
         * @param language The language to find a suggested kernel extension for
         * @returns A recommednation object for the recommended extension, else undefined
         */
        getSuggestedKernelFromLanguage(viewType, language) {
            const recommendation = notebookBrowser_1.KERNEL_RECOMMENDATIONS.get(viewType)?.get(language);
            return recommendation;
        }
    }
    let KernelPickerMRUStrategy = class KernelPickerMRUStrategy extends KernelPickerStrategyBase {
        constructor(_notebookKernelService, _productService, _quickInputService, _labelService, _logService, _paneCompositePartService, _extensionWorkbenchService, _extensionService, _commandService, _notebookKernelHistoryService, _openerService) {
            super(_notebookKernelService, _productService, _quickInputService, _labelService, _logService, _paneCompositePartService, _extensionWorkbenchService, _extensionService, _commandService);
            this._notebookKernelHistoryService = _notebookKernelHistoryService;
            this._openerService = _openerService;
        }
        _getKernelPickerQuickPickItems(notebookTextModel, matchResult, notebookKernelService, scopedContextKeyService) {
            const quickPickItems = [];
            if (matchResult.selected) {
                const kernelItem = toKernelQuickPick(matchResult.selected, matchResult.selected);
                quickPickItems.push(kernelItem);
            }
            matchResult.suggestions.filter(kernel => kernel.id !== matchResult.selected?.id).map(kernel => toKernelQuickPick(kernel, matchResult.selected))
                .forEach(kernel => {
                quickPickItems.push(kernel);
            });
            const shouldAutoRun = quickPickItems.length === 0;
            if (quickPickItems.length > 0) {
                quickPickItems.push({
                    type: 'separator'
                });
            }
            // select another kernel quick pick
            quickPickItems.push({
                id: 'selectAnother',
                label: (0, nls_1.localize)('selectAnotherKernel.more', "Select Another Kernel..."),
                autoRun: shouldAutoRun
            });
            return quickPickItems;
        }
        _selecteKernel(notebook, kernel) {
            const currentInfo = this._notebookKernelService.getMatchingKernel(notebook);
            if (currentInfo.selected) {
                // there is already a selected kernel
                this._notebookKernelHistoryService.addMostRecentKernel(currentInfo.selected);
            }
            super._selecteKernel(notebook, kernel);
            this._notebookKernelHistoryService.addMostRecentKernel(kernel);
        }
        _getMatchingResult(notebook) {
            const { selected, all } = this._notebookKernelHistoryService.getKernels(notebook);
            const matchingResult = this._notebookKernelService.getMatchingKernel(notebook);
            return {
                selected: selected,
                all: matchingResult.all,
                suggestions: all,
                hidden: []
            };
        }
        async _handleQuickPick(editor, pick, items) {
            if (pick.id === 'selectAnother') {
                return this.displaySelectAnotherQuickPick(editor, items.length === 1 && items[0] === pick);
            }
            return super._handleQuickPick(editor, pick, items);
        }
        async displaySelectAnotherQuickPick(editor, kernelListEmpty) {
            const notebook = editor.textModel;
            const disposables = new lifecycle_1.DisposableStore();
            const quickPick = this._quickInputService.createQuickPick();
            const quickPickItem = await new Promise(resolve => {
                // select from kernel sources
                quickPick.title = kernelListEmpty ? (0, nls_1.localize)('select', "Select Kernel") : (0, nls_1.localize)('selectAnotherKernel', "Select Another Kernel");
                quickPick.placeholder = (0, nls_1.localize)('selectKernel.placeholder', "Type to choose a kernel source");
                quickPick.busy = true;
                quickPick.buttons = [this._quickInputService.backButton];
                quickPick.show();
                disposables.add(quickPick.onDidTriggerButton(button => {
                    if (button === this._quickInputService.backButton) {
                        resolve(button);
                    }
                }));
                quickPick.onDidTriggerItemButton(async (e) => {
                    if (isKernelSourceQuickPickItem(e.item) && e.item.documentation !== undefined) {
                        const uri = uri_1.URI.isUri(e.item.documentation) ? uri_1.URI.parse(e.item.documentation) : await this._commandService.executeCommand(e.item.documentation);
                        void this._openerService.open(uri, { openExternal: true });
                    }
                });
                disposables.add(quickPick.onDidAccept(async () => {
                    resolve(quickPick.selectedItems[0]);
                }));
                disposables.add(quickPick.onDidHide(() => {
                    resolve(undefined);
                }));
                this._calculdateKernelSources(editor).then(quickPickItems => {
                    quickPick.items = quickPickItems;
                    if (quickPick.items.length > 0) {
                        quickPick.busy = false;
                    }
                });
                disposables.add(event_1.Event.debounce(event_1.Event.any(this._notebookKernelService.onDidChangeSourceActions, this._notebookKernelService.onDidAddKernel, this._notebookKernelService.onDidRemoveKernel), (last, _current) => last, KERNEL_PICKER_UPDATE_DEBOUNCE)(async () => {
                    quickPick.busy = true;
                    const quickPickItems = await this._calculdateKernelSources(editor);
                    quickPick.items = quickPickItems;
                    quickPick.busy = false;
                }));
            });
            quickPick.hide();
            disposables.dispose();
            if (quickPickItem === this._quickInputService.backButton) {
                return this.showQuickPick(editor, undefined, true);
            }
            if (quickPickItem) {
                const selectedKernelPickItem = quickPickItem;
                if (isKernelSourceQuickPickItem(selectedKernelPickItem)) {
                    try {
                        const selectedKernelId = await this._executeCommand(notebook, selectedKernelPickItem.command);
                        if (selectedKernelId) {
                            const { all } = await this._getMatchingResult(notebook);
                            const kernel = all.find(kernel => kernel.id === `ms-toolsai.jupyter/${selectedKernelId}`);
                            if (kernel) {
                                await this._selecteKernel(notebook, kernel);
                                return true;
                            }
                            return true;
                        }
                        else {
                            return this.displaySelectAnotherQuickPick(editor, false);
                        }
                    }
                    catch (ex) {
                        return false;
                    }
                }
                else if (isKernelPick(selectedKernelPickItem)) {
                    await this._selecteKernel(notebook, selectedKernelPickItem.kernel);
                    return true;
                }
                else if (isGroupedKernelsPick(selectedKernelPickItem)) {
                    await this._selectOneKernel(notebook, selectedKernelPickItem.label, selectedKernelPickItem.kernels);
                    return true;
                }
                else if (isSourcePick(selectedKernelPickItem)) {
                    // selected explicilty, it should trigger the execution?
                    try {
                        await selectedKernelPickItem.action.runAction();
                        return true;
                    }
                    catch (ex) {
                        return false;
                    }
                }
                else if (isSearchMarketplacePick(selectedKernelPickItem)) {
                    await this._showKernelExtension(this._paneCompositePartService, this._extensionWorkbenchService, this._extensionService, editor.textModel.viewType, []);
                    return true;
                }
                else if (isInstallExtensionPick(selectedKernelPickItem)) {
                    await this._showKernelExtension(this._paneCompositePartService, this._extensionWorkbenchService, this._extensionService, editor.textModel.viewType, selectedKernelPickItem.extensionIds, this._productService.quality !== 'stable');
                    return this.displaySelectAnotherQuickPick(editor, false);
                }
            }
            return false;
        }
        async _calculdateKernelSources(editor) {
            const notebook = editor.textModel;
            const sourceActionCommands = this._notebookKernelService.getSourceActions(notebook, editor.scopedContextKeyService);
            const actions = await this._notebookKernelService.getKernelSourceActions2(notebook);
            const matchResult = this._getMatchingResult(notebook);
            if (sourceActionCommands.length === 0 && matchResult.all.length === 0 && actions.length === 0) {
                return await this._getKernelRecommendationsQuickPickItems(notebook, this._extensionWorkbenchService) ?? [];
            }
            const others = matchResult.all.filter(item => item.extension.value !== notebookBrowser_1.JUPYTER_EXTENSION_ID);
            const quickPickItems = [];
            // group controllers by extension
            for (const group of (0, arrays_1.groupBy)(others, (a, b) => a.extension.value === b.extension.value ? 0 : 1)) {
                const extension = this._extensionService.extensions.find(extension => extension.identifier.value === group[0].extension.value);
                const source = extension?.displayName ?? extension?.description ?? group[0].extension.value;
                if (group.length > 1) {
                    quickPickItems.push({
                        label: source,
                        kernels: group
                    });
                }
                else {
                    quickPickItems.push({
                        label: group[0].label,
                        kernel: group[0]
                    });
                }
            }
            const validActions = actions.filter(action => action.command);
            quickPickItems.push(...validActions.map(action => {
                const buttons = action.documentation ? [{
                        iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info),
                        tooltip: (0, nls_1.localize)('learnMoreTooltip', 'Learn More'),
                    }] : [];
                return {
                    id: typeof action.command === 'string' ? action.command : action.command.id,
                    label: action.label,
                    description: action.description,
                    command: action.command,
                    documentation: action.documentation,
                    buttons
                };
            }));
            for (const sourceAction of sourceActionCommands) {
                const res = {
                    action: sourceAction,
                    picked: false,
                    label: sourceAction.action.label,
                    tooltip: sourceAction.action.tooltip
                };
                quickPickItems.push(res);
            }
            return quickPickItems;
        }
        async _selectOneKernel(notebook, source, kernels) {
            const quickPickItems = kernels.map(kernel => toKernelQuickPick(kernel, undefined));
            const quickPick = this._quickInputService.createQuickPick();
            quickPick.items = quickPickItems;
            quickPick.canSelectMany = false;
            quickPick.title = (0, nls_1.localize)('selectKernelFromExtension', "Select Kernel from {0}", source);
            quickPick.onDidAccept(async () => {
                if (quickPick.selectedItems && quickPick.selectedItems.length > 0 && isKernelPick(quickPick.selectedItems[0])) {
                    await this._selecteKernel(notebook, quickPick.selectedItems[0].kernel);
                }
                quickPick.hide();
                quickPick.dispose();
            });
            quickPick.onDidHide(() => {
                quickPick.dispose();
            });
            quickPick.show();
        }
        async _executeCommand(notebook, command) {
            const id = typeof command === 'string' ? command : command.id;
            const args = typeof command === 'string' ? [] : command.arguments ?? [];
            if (typeof command === 'string' || !command.arguments || !Array.isArray(command.arguments) || command.arguments.length === 0) {
                args.unshift({
                    uri: notebook.uri,
                    $mid: 14 /* MarshalledId.NotebookActionContext */
                });
            }
            if (typeof command === 'string') {
                return this._commandService.executeCommand(id);
            }
            else {
                return this._commandService.executeCommand(id, ...args);
            }
        }
        static updateKernelStatusAction(notebook, action, notebookKernelService, notebookKernelHistoryService) {
            const detectionTasks = notebookKernelService.getKernelDetectionTasks(notebook);
            if (detectionTasks.length) {
                const info = notebookKernelService.getMatchingKernel(notebook);
                action.enabled = true;
                action.class = themables_1.ThemeIcon.asClassName(themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin'));
                if (info.selected) {
                    action.label = info.selected.label;
                    const kernelInfo = info.selected.description ?? info.selected.detail;
                    action.tooltip = kernelInfo
                        ? (0, nls_1.localize)('kernels.selectedKernelAndKernelDetectionRunning', "Selected Kernel: {0} (Kernel Detection Tasks Running)", kernelInfo)
                        : (0, nls_1.localize)('kernels.detecting', "Detecting Kernels");
                }
                else {
                    action.label = (0, nls_1.localize)('kernels.detecting', "Detecting Kernels");
                }
                return;
            }
            const runningActions = notebookKernelService.getRunningSourceActions(notebook);
            const updateActionFromSourceAction = (sourceAction, running) => {
                const sAction = sourceAction.action;
                action.class = running ? themables_1.ThemeIcon.asClassName(themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin')) : themables_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
                action.label = sAction.label;
                action.enabled = true;
            };
            if (runningActions.length) {
                return updateActionFromSourceAction(runningActions[0] /** TODO handle multiple actions state */, true);
            }
            const { selected } = notebookKernelHistoryService.getKernels(notebook);
            if (selected) {
                action.label = selected.label;
                action.class = themables_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
                action.tooltip = selected.description ?? selected.detail ?? '';
            }
            else {
                action.label = (0, nls_1.localize)('select', "Select Kernel");
                action.class = themables_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon);
                action.tooltip = '';
            }
        }
        static async resolveKernel(notebook, notebookKernelService, notebookKernelHistoryService, commandService) {
            const alreadySelected = notebookKernelHistoryService.getKernels(notebook);
            if (alreadySelected.selected) {
                return alreadySelected.selected;
            }
            await commandService.executeCommand(coreActions_1.SELECT_KERNEL_ID);
            const { selected } = notebookKernelHistoryService.getKernels(notebook);
            return selected;
        }
    };
    exports.KernelPickerMRUStrategy = KernelPickerMRUStrategy;
    exports.KernelPickerMRUStrategy = KernelPickerMRUStrategy = __decorate([
        __param(0, notebookKernelService_1.INotebookKernelService),
        __param(1, productService_1.IProductService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, label_1.ILabelService),
        __param(4, log_1.ILogService),
        __param(5, panecomposite_1.IPaneCompositePartService),
        __param(6, extensions_1.IExtensionsWorkbenchService),
        __param(7, extensions_2.IExtensionService),
        __param(8, commands_1.ICommandService),
        __param(9, notebookKernelService_1.INotebookKernelHistoryService),
        __param(10, opener_1.IOpenerService)
    ], KernelPickerMRUStrategy);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxRdWlja1BpY2tTdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld1BhcnRzL25vdGVib29rS2VybmVsUXVpY2tQaWNrU3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUNoRyxTQUFTLFlBQVksQ0FBQyxJQUFvQztRQUN6RCxPQUFPLFFBQVEsSUFBSSxJQUFJLENBQUM7SUFDekIsQ0FBQztJQUVELFNBQVMsb0JBQW9CLENBQUMsSUFBb0M7UUFDakUsT0FBTyxTQUFTLElBQUksSUFBSSxDQUFDO0lBQzFCLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFvQztRQUN6RCxPQUFPLFFBQVEsSUFBSSxJQUFJLENBQUM7SUFDekIsQ0FBQztJQUVELFNBQVMsc0JBQXNCLENBQUMsSUFBb0M7UUFDbkUsT0FBTyxJQUFJLENBQUMsRUFBRSxLQUFLLGtCQUFrQixJQUFJLGNBQWMsSUFBSSxJQUFJLENBQUM7SUFDakUsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUMsSUFBb0M7UUFDcEUsT0FBTyxJQUFJLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQztJQUM5QixDQUFDO0lBR0QsU0FBUywyQkFBMkIsQ0FBQyxJQUFvQjtRQUN4RCxPQUFPLFNBQVMsSUFBSSxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFDLElBQW9DO1FBQzNELE9BQU8sU0FBUyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUM1QyxDQUFDO0lBRUQsTUFBTSw2QkFBNkIsR0FBRyxHQUFHLENBQUM7SUFZMUMsU0FBUyxpQkFBaUIsQ0FBQyxNQUF1QixF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