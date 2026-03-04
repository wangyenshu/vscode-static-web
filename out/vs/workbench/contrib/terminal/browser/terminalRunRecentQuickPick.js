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
define(["require", "exports", "vs/base/browser/ui/toggle/toggle", "vs/base/common/platform", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/platform/terminal/common/terminalEnvironment", "vs/platform/theme/common/colorRegistry", "vs/base/common/themables", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/workbench/contrib/terminal/common/history", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/base/common/uri", "vs/base/common/date", "vs/workbench/services/editor/common/editorService", "vs/platform/quickinput/browser/quickPickPin", "vs/platform/storage/common/storage", "vs/workbench/contrib/accessibility/browser/accessibleView"], function (require, exports, toggle_1, platform_1, model_1, resolverService_1, nls_1, instantiation_1, quickInput_1, terminalEnvironment_1, colorRegistry_1, themables_1, terminalIcons_1, history_1, terminalStrings_1, uri_1, date_1, editorService_1, quickPickPin_1, storage_1, accessibleView_1) {
    "use strict";
    var TerminalOutputProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showRunRecentQuickPick = showRunRecentQuickPick;
    async function showRunRecentQuickPick(accessor, instance, terminalInRunCommandPicker, type, filterMode, value) {
        if (!instance.xterm) {
            return;
        }
        const editorService = accessor.get(editorService_1.IEditorService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const storageService = accessor.get(storage_1.IStorageService);
        const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
        const runRecentStorageKey = `${"terminal.pinnedRecentCommands" /* TerminalStorageKeys.PinnedRecentCommandsPrefix */}.${instance.shellType}`;
        let placeholder;
        let items = [];
        const commandMap = new Set();
        const removeFromCommandHistoryButton = {
            iconClass: themables_1.ThemeIcon.asClassName(terminalIcons_1.commandHistoryRemoveIcon),
            tooltip: (0, nls_1.localize)('removeCommand', "Remove from Command History")
        };
        const commandOutputButton = {
            iconClass: themables_1.ThemeIcon.asClassName(terminalIcons_1.commandHistoryOutputIcon),
            tooltip: (0, nls_1.localize)('viewCommandOutput', "View Command Output"),
            alwaysVisible: false
        };
        if (type === 'command') {
            placeholder = platform_1.isMacintosh ? (0, nls_1.localize)('selectRecentCommandMac', 'Select a command to run (hold Option-key to edit the command)') : (0, nls_1.localize)('selectRecentCommand', 'Select a command to run (hold Alt-key to edit the command)');
            const cmdDetection = instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            const commands = cmdDetection?.commands;
            // Current session history
            const executingCommand = cmdDetection?.executingCommand;
            if (executingCommand) {
                commandMap.add(executingCommand);
            }
            function formatLabel(label) {
                return label
                    // Replace new lines with "enter" symbol
                    .replace(/\r?\n/g, '\u23CE')
                    // Replace 3 or more spaces with midline horizontal ellipsis which looks similar
                    // to whitespace in the editor
                    .replace(/\s\s\s+/g, '\u22EF');
            }
            if (commands && commands.length > 0) {
                for (const entry of commands) {
                    // Trim off any whitespace and/or line endings, replace new lines with the
                    // Downwards Arrow with Corner Leftwards symbol
                    const label = entry.command.trim();
                    if (label.length === 0 || commandMap.has(label)) {
                        continue;
                    }
                    let description = (0, terminalEnvironment_1.collapseTildePath)(entry.cwd, instance.userHome, instance.os === 1 /* OperatingSystem.Windows */ ? '\\' : '/');
                    if (entry.exitCode) {
                        // Since you cannot get the last command's exit code on pwsh, just whether it failed
                        // or not, -1 is treated specially as simply failed
                        if (entry.exitCode === -1) {
                            description += ' failed';
                        }
                        else {
                            description += ` exitCode: ${entry.exitCode}`;
                        }
                    }
                    description = description.trim();
                    const buttons = [commandOutputButton];
                    // Merge consecutive commands
                    const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
                    if (lastItem?.type !== 'separator' && lastItem?.label === label) {
                        lastItem.id = entry.timestamp.toString();
                        lastItem.description = description;
                        continue;
                    }
                    items.push({
                        label: formatLabel(label),
                        rawLabel: label,
                        description,
                        id: entry.timestamp.toString(),
                        command: entry,
                        buttons: entry.hasOutput() ? buttons : undefined
                    });
                    commandMap.add(label);
                }
                items = items.reverse();
            }
            if (executingCommand) {
                items.unshift({
                    label: formatLabel(executingCommand),
                    rawLabel: executingCommand,
                    description: cmdDetection.cwd
                });
            }
            if (items.length > 0) {
                items.unshift({ type: 'separator', label: terminalStrings_1.terminalStrings.currentSessionCategory });
            }
            // Gather previous session history
            const history = instantiationService.invokeFunction(history_1.getCommandHistory);
            const previousSessionItems = [];
            for (const [label, info] of history.entries) {
                // Only add previous session item if it's not in this session
                if (!commandMap.has(label) && info.shellType === instance.shellType) {
                    previousSessionItems.unshift({
                        label: formatLabel(label),
                        rawLabel: label,
                        buttons: [removeFromCommandHistoryButton]
                    });
                    commandMap.add(label);
                }
            }
            if (previousSessionItems.length > 0) {
                items.push({ type: 'separator', label: terminalStrings_1.terminalStrings.previousSessionCategory }, ...previousSessionItems);
            }
            // Gather shell file history
            const shellFileHistory = await instantiationService.invokeFunction(history_1.getShellFileHistory, instance.shellType);
            const dedupedShellFileItems = [];
            for (const label of shellFileHistory) {
                if (!commandMap.has(label)) {
                    dedupedShellFileItems.unshift({
                        label: formatLabel(label),
                        rawLabel: label
                    });
                }
            }
            if (dedupedShellFileItems.length > 0) {
                items.push({ type: 'separator', label: (0, nls_1.localize)('shellFileHistoryCategory', '{0} history', instance.shellType) }, ...dedupedShellFileItems);
            }
        }
        else {
            placeholder = platform_1.isMacintosh
                ? (0, nls_1.localize)('selectRecentDirectoryMac', 'Select a directory to go to (hold Option-key to edit the command)')
                : (0, nls_1.localize)('selectRecentDirectory', 'Select a directory to go to (hold Alt-key to edit the command)');
            const cwds = instance.capabilities.get(0 /* TerminalCapability.CwdDetection */)?.cwds || [];
            if (cwds && cwds.length > 0) {
                for (const label of cwds) {
                    items.push({ label, rawLabel: label });
                }
                items = items.reverse();
                items.unshift({ type: 'separator', label: terminalStrings_1.terminalStrings.currentSessionCategory });
            }
            // Gather previous session history
            const history = instantiationService.invokeFunction(history_1.getDirectoryHistory);
            const previousSessionItems = [];
            // Only add previous session item if it's not in this session and it matches the remote authority
            for (const [label, info] of history.entries) {
                if ((info === null || info.remoteAuthority === instance.remoteAuthority) && !cwds.includes(label)) {
                    previousSessionItems.unshift({
                        label,
                        rawLabel: label,
                        buttons: [removeFromCommandHistoryButton]
                    });
                }
            }
            if (previousSessionItems.length > 0) {
                items.push({ type: 'separator', label: terminalStrings_1.terminalStrings.previousSessionCategory }, ...previousSessionItems);
            }
        }
        if (items.length === 0) {
            return;
        }
        const fuzzySearchToggle = new toggle_1.Toggle({
            title: 'Fuzzy search',
            icon: terminalIcons_1.commandHistoryFuzzySearchIcon,
            isChecked: filterMode === 'fuzzy',
            inputActiveOptionBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBorder),
            inputActiveOptionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionForeground),
            inputActiveOptionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBackground)
        });
        fuzzySearchToggle.onChange(() => {
            instantiationService.invokeFunction(showRunRecentQuickPick, instance, terminalInRunCommandPicker, type, fuzzySearchToggle.checked ? 'fuzzy' : 'contiguous', quickPick.value);
        });
        const outputProvider = instantiationService.createInstance(TerminalOutputProvider);
        const quickPick = quickInputService.createQuickPick();
        const originalItems = items;
        quickPick.items = [...originalItems];
        quickPick.sortByLabel = false;
        quickPick.placeholder = placeholder;
        quickPick.matchOnLabelMode = filterMode || 'contiguous';
        quickPick.toggles = [fuzzySearchToggle];
        quickPick.onDidTriggerItemButton(async (e) => {
            if (e.button === removeFromCommandHistoryButton) {
                if (type === 'command') {
                    instantiationService.invokeFunction(history_1.getCommandHistory)?.remove(e.item.label);
                }
                else {
                    instantiationService.invokeFunction(history_1.getDirectoryHistory)?.remove(e.item.label);
                }
            }
            else if (e.button === commandOutputButton) {
                const selectedCommand = e.item.command;
                const output = selectedCommand?.getOutput();
                if (output && selectedCommand?.command) {
                    const textContent = await outputProvider.provideTextContent(uri_1.URI.from({
                        scheme: TerminalOutputProvider.scheme,
                        path: `${selectedCommand.command}... ${(0, date_1.fromNow)(selectedCommand.timestamp, true)}`,
                        fragment: output,
                        query: `terminal-output-${selectedCommand.timestamp}-${instance.instanceId}`
                    }));
                    if (textContent) {
                        await editorService.openEditor({
                            resource: textContent.uri
                        });
                    }
                }
            }
            await instantiationService.invokeFunction(showRunRecentQuickPick, instance, terminalInRunCommandPicker, type, filterMode, value);
        });
        quickPick.onDidChangeValue(async (value) => {
            if (!value) {
                await instantiationService.invokeFunction(showRunRecentQuickPick, instance, terminalInRunCommandPicker, type, filterMode, value);
            }
        });
        let terminalScrollStateSaved = false;
        function restoreScrollState() {
            terminalScrollStateSaved = false;
            instance.xterm?.markTracker.restoreScrollState();
            instance.xterm?.markTracker.clear();
        }
        quickPick.onDidChangeActive(async () => {
            const xterm = instance.xterm;
            if (!xterm) {
                return;
            }
            const [item] = quickPick.activeItems;
            if ('command' in item && item.command && item.command.marker) {
                if (!terminalScrollStateSaved) {
                    xterm.markTracker.saveScrollState();
                    terminalScrollStateSaved = true;
                }
                const promptRowCount = item.command.getPromptRowCount();
                const commandRowCount = item.command.getCommandRowCount();
                xterm.markTracker.revealRange({
                    start: {
                        x: 1,
                        y: item.command.marker.line - (promptRowCount - 1) + 1
                    },
                    end: {
                        x: instance.cols,
                        y: item.command.marker.line + (commandRowCount - 1) + 1
                    }
                });
            }
            else {
                restoreScrollState();
            }
        });
        quickPick.onDidAccept(async () => {
            const result = quickPick.activeItems[0];
            let text;
            if (type === 'cwd') {
                text = `cd ${await instance.preparePathForShell(result.rawLabel)}`;
            }
            else { // command
                text = result.rawLabel;
            }
            quickPick.hide();
            instance.runCommand(text, !quickPick.keyMods.alt);
            if (quickPick.keyMods.alt) {
                instance.focus();
            }
            restoreScrollState();
        });
        quickPick.onDidHide(() => restoreScrollState());
        if (value) {
            quickPick.value = value;
        }
        return new Promise(r => {
            terminalInRunCommandPicker.set(true);
            (0, quickPickPin_1.showWithPinnedItems)(storageService, runRecentStorageKey, quickPick, true);
            quickPick.onDidHide(() => {
                terminalInRunCommandPicker.set(false);
                accessibleViewService.showLastProvider("terminal" /* AccessibleViewProviderId.Terminal */);
                r();
            });
        });
    }
    let TerminalOutputProvider = class TerminalOutputProvider {
        static { TerminalOutputProvider_1 = this; }
        static { this.scheme = 'TERMINAL_OUTPUT'; }
        constructor(textModelResolverService, _modelService) {
            this._modelService = _modelService;
            textModelResolverService.registerTextModelContentProvider(TerminalOutputProvider_1.scheme, this);
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            return this._modelService.createModel(resource.fragment, null, resource, false);
        }
    };
    TerminalOutputProvider = TerminalOutputProvider_1 = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], TerminalOutputProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxSdW5SZWNlbnRRdWlja1BpY2suanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsUnVuUmVjZW50UXVpY2tQaWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTRCaEcsd0RBa1NDO0lBbFNNLEtBQUssVUFBVSxzQkFBc0IsQ0FDM0MsUUFBMEIsRUFDMUIsUUFBMkIsRUFDM0IsMEJBQWdELEVBQ2hELElBQXVCLEVBQ3ZCLFVBQW1DLEVBQ25DLEtBQWM7UUFFZCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7UUFDbkQsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7UUFDakUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7UUFDM0QsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7UUFDckQsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVDQUFzQixDQUFDLENBQUM7UUFFbkUsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLG9GQUE4QyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN0RyxJQUFJLFdBQW1CLENBQUM7UUFFeEIsSUFBSSxLQUFLLEdBQTJFLEVBQUUsQ0FBQztRQUN2RixNQUFNLFVBQVUsR0FBZ0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUUxQyxNQUFNLDhCQUE4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