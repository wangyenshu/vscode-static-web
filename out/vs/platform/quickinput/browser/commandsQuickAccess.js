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
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/filters", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/tfIdf", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry"], function (require, exports, errorMessage_1, errors_1, filters_1, functional_1, lifecycle_1, map_1, tfIdf_1, nls_1, commands_1, configuration_1, dialogs_1, instantiation_1, keybinding_1, log_1, pickerQuickAccess_1, storage_1, telemetry_1) {
    "use strict";
    var AbstractCommandsQuickAccessProvider_1, CommandsHistory_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandsHistory = exports.AbstractCommandsQuickAccessProvider = void 0;
    let AbstractCommandsQuickAccessProvider = class AbstractCommandsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { AbstractCommandsQuickAccessProvider_1 = this; }
        static { this.PREFIX = '>'; }
        static { this.TFIDF_THRESHOLD = 0.5; }
        static { this.TFIDF_MAX_RESULTS = 5; }
        static { this.WORD_FILTER = (0, filters_1.or)(filters_1.matchesPrefix, filters_1.matchesWords, filters_1.matchesContiguousSubString); }
        constructor(options, instantiationService, keybindingService, commandService, telemetryService, dialogService) {
            super(AbstractCommandsQuickAccessProvider_1.PREFIX, options);
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.commandService = commandService;
            this.telemetryService = telemetryService;
            this.dialogService = dialogService;
            this.commandsHistory = this._register(this.instantiationService.createInstance(CommandsHistory));
            this.options = options;
        }
        async _getPicks(filter, _disposables, token, runOptions) {
            // Ask subclass for all command picks
            const allCommandPicks = await this.getCommandPicks(token);
            if (token.isCancellationRequested) {
                return [];
            }
            const runTfidf = (0, functional_1.createSingleCallFunction)(() => {
                const tfidf = new tfIdf_1.TfIdfCalculator();
                tfidf.updateDocuments(allCommandPicks.map(commandPick => ({
                    key: commandPick.commandId,
                    textChunks: [this.getTfIdfChunk(commandPick)]
                })));
                const result = tfidf.calculateScores(filter, token);
                return (0, tfIdf_1.normalizeTfIdfScores)(result)
                    .filter(score => score.score > AbstractCommandsQuickAccessProvider_1.TFIDF_THRESHOLD)
                    .slice(0, AbstractCommandsQuickAccessProvider_1.TFIDF_MAX_RESULTS);
            });
            // Filter
            const filteredCommandPicks = [];
            for (const commandPick of allCommandPicks) {
                const labelHighlights = AbstractCommandsQuickAccessProvider_1.WORD_FILTER(filter, commandPick.label) ?? undefined;
                const aliasHighlights = commandPick.commandAlias ? AbstractCommandsQuickAccessProvider_1.WORD_FILTER(filter, commandPick.commandAlias) ?? undefined : undefined;
                // Add if matching in label or alias
                if (labelHighlights || aliasHighlights) {
                    commandPick.highlights = {
                        label: labelHighlights,
                        detail: this.options.showAlias ? aliasHighlights : undefined
                    };
                    filteredCommandPicks.push(commandPick);
                }
                // Also add if we have a 100% command ID match
                else if (filter === commandPick.commandId) {
                    filteredCommandPicks.push(commandPick);
                }
                // Handle tf-idf scoring for the rest if there's a filter
                else if (filter.length >= 3) {
                    const tfidf = runTfidf();
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    // Add if we have a tf-idf score
                    const tfidfScore = tfidf.find(score => score.key === commandPick.commandId);
                    if (tfidfScore) {
                        commandPick.tfIdfScore = tfidfScore.score;
                        filteredCommandPicks.push(commandPick);
                    }
                }
            }
            // Add description to commands that have duplicate labels
            const mapLabelToCommand = new Map();
            for (const commandPick of filteredCommandPicks) {
                const existingCommandForLabel = mapLabelToCommand.get(commandPick.label);
                if (existingCommandForLabel) {
                    commandPick.description = commandPick.commandId;
                    existingCommandForLabel.description = existingCommandForLabel.commandId;
                }
                else {
                    mapLabelToCommand.set(commandPick.label, commandPick);
                }
            }
            // Sort by MRU order and fallback to name otherwise
            filteredCommandPicks.sort((commandPickA, commandPickB) => {
                // If a result came from tf-idf, we want to put that towards the bottom
                if (commandPickA.tfIdfScore && commandPickB.tfIdfScore) {
                    if (commandPickA.tfIdfScore === commandPickB.tfIdfScore) {
                        return commandPickA.label.localeCompare(commandPickB.label); // prefer lexicographically smaller command
                    }
                    return commandPickB.tfIdfScore - commandPickA.tfIdfScore; // prefer higher tf-idf score
                }
                else if (commandPickA.tfIdfScore) {
                    return 1; // first command has a score but other doesn't so other wins
                }
                else if (commandPickB.tfIdfScore) {
                    return -1; // other command has a score but first doesn't so first wins
                }
                const commandACounter = this.commandsHistory.peek(commandPickA.commandId);
                const commandBCounter = this.commandsHistory.peek(commandPickB.commandId);
                if (commandACounter && commandBCounter) {
                    return commandACounter > commandBCounter ? -1 : 1; // use more recently used command before older
                }
                if (commandACounter) {
                    return -1; // first command was used, so it wins over the non used one
                }
                if (commandBCounter) {
                    return 1; // other command was used so it wins over the command
                }
                if (this.options.suggestedCommandIds) {
                    const commandASuggestion = this.options.suggestedCommandIds.has(commandPickA.commandId);
                    const commandBSuggestion = this.options.suggestedCommandIds.has(commandPickB.commandId);
                    if (commandASuggestion && commandBSuggestion) {
                        return 0; // honor the order of the array
                    }
                    if (commandASuggestion) {
                        return -1; // first command was suggested, so it wins over the non suggested one
                    }
                    if (commandBSuggestion) {
                        return 1; // other command was suggested so it wins over the command
                    }
                }
                // both commands were never used, so we sort by name
                return commandPickA.label.localeCompare(commandPickB.label);
            });
            const commandPicks = [];
            let addOtherSeparator = false;
            let addSuggestedSeparator = true;
            let addCommonlyUsedSeparator = !!this.options.suggestedCommandIds;
            for (let i = 0; i < filteredCommandPicks.length; i++) {
                const commandPick = filteredCommandPicks[i];
                // Separator: recently used
                if (i === 0 && this.commandsHistory.peek(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('recentlyUsed', "recently used") });
                    addOtherSeparator = true;
                }
                if (addSuggestedSeparator && commandPick.tfIdfScore !== undefined) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('suggested', "similar commands") });
                    addSuggestedSeparator = false;
                }
                // Separator: commonly used
                if (addCommonlyUsedSeparator && commandPick.tfIdfScore === undefined && !this.commandsHistory.peek(commandPick.commandId) && this.options.suggestedCommandIds?.has(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('commonlyUsed', "commonly used") });
                    addOtherSeparator = true;
                    addCommonlyUsedSeparator = false;
                }
                // Separator: other commands
                if (addOtherSeparator && commandPick.tfIdfScore === undefined && !this.commandsHistory.peek(commandPick.commandId) && !this.options.suggestedCommandIds?.has(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('morecCommands', "other commands") });
                    addOtherSeparator = false;
                }
                // Command
                commandPicks.push(this.toCommandPick(commandPick, runOptions));
            }
            if (!this.hasAdditionalCommandPicks(filter, token)) {
                return commandPicks;
            }
            return {
                picks: commandPicks,
                additionalPicks: (async () => {
                    const additionalCommandPicks = await this.getAdditionalCommandPicks(allCommandPicks, filteredCommandPicks, filter, token);
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    const commandPicks = additionalCommandPicks.map(commandPick => this.toCommandPick(commandPick, runOptions));
                    // Basically, if we haven't already added a separator, we add one before the additional picks so long
                    // as one hasn't been added to the start of the array.
                    if (addSuggestedSeparator && commandPicks[0]?.type !== 'separator') {
                        commandPicks.unshift({ type: 'separator', label: (0, nls_1.localize)('suggested', "similar commands") });
                    }
                    return commandPicks;
                })()
            };
        }
        toCommandPick(commandPick, runOptions) {
            if (commandPick.type === 'separator') {
                return commandPick;
            }
            const keybinding = this.keybindingService.lookupKeybinding(commandPick.commandId);
            const ariaLabel = keybinding ?
                (0, nls_1.localize)('commandPickAriaLabelWithKeybinding', "{0}, {1}", commandPick.label, keybinding.getAriaLabel()) :
                commandPick.label;
            return {
                ...commandPick,
                ariaLabel,
                detail: this.options.showAlias && commandPick.commandAlias !== commandPick.label ? commandPick.commandAlias : undefined,
                keybinding,
                accept: async () => {
                    // Add to history
                    this.commandsHistory.push(commandPick.commandId);
                    // Telementry
                    this.telemetryService.publicLog2('workbenchActionExecuted', {
                        id: commandPick.commandId,
                        from: runOptions?.from ?? 'quick open'
                    });
                    // Run
                    try {
                        commandPick.args?.length
                            ? await this.commandService.executeCommand(commandPick.commandId, ...commandPick.args)
                            : await this.commandService.executeCommand(commandPick.commandId);
                    }
                    catch (error) {
                        if (!(0, errors_1.isCancellationError)(error)) {
                            this.dialogService.error((0, nls_1.localize)('canNotRun', "Command '{0}' resulted in an error", commandPick.label), (0, errorMessage_1.toErrorMessage)(error));
                        }
                    }
                }
            };
        }
        // TF-IDF string to be indexed
        getTfIdfChunk({ label, commandAlias, commandDescription }) {
            let chunk = label;
            if (commandAlias && commandAlias !== label) {
                chunk += ` - ${commandAlias}`;
            }
            if (commandDescription && commandDescription.value !== label) {
                // If the original is the same as the value, don't add it
                chunk += ` - ${commandDescription.value === commandDescription.original ? commandDescription.value : `${commandDescription.value} (${commandDescription.original})`}`;
            }
            return chunk;
        }
    };
    exports.AbstractCommandsQuickAccessProvider = AbstractCommandsQuickAccessProvider;
    exports.AbstractCommandsQuickAccessProvider = AbstractCommandsQuickAccessProvider = AbstractCommandsQuickAccessProvider_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, commands_1.ICommandService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, dialogs_1.IDialogService)
    ], AbstractCommandsQuickAccessProvider);
    let CommandsHistory = class CommandsHistory extends lifecycle_1.Disposable {
        static { CommandsHistory_1 = this; }
        static { this.DEFAULT_COMMANDS_HISTORY_LENGTH = 50; }
        static { this.PREF_KEY_CACHE = 'commandPalette.mru.cache'; }
        static { this.PREF_KEY_COUNTER = 'commandPalette.mru.counter'; }
        static { this.counter = 1; }
        static { this.hasChanges = false; }
        constructor(storageService, configurationService, logService) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.configuredCommandsHistoryLength = 0;
            this.updateConfiguration();
            this.load();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.updateConfiguration(e)));
            this._register(this.storageService.onWillSaveState(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    // Commands history is very dynamic and so we limit impact
                    // on storage to only save on shutdown. This helps reduce
                    // the overhead of syncing this data across machines.
                    this.saveState();
                }
            }));
        }
        updateConfiguration(e) {
            if (e && !e.affectsConfiguration('workbench.commandPalette.history')) {
                return;
            }
            this.configuredCommandsHistoryLength = CommandsHistory_1.getConfiguredCommandHistoryLength(this.configurationService);
            if (CommandsHistory_1.cache && CommandsHistory_1.cache.limit !== this.configuredCommandsHistoryLength) {
                CommandsHistory_1.cache.limit = this.configuredCommandsHistoryLength;
                CommandsHistory_1.hasChanges = true;
            }
        }
        load() {
            const raw = this.storageService.get(CommandsHistory_1.PREF_KEY_CACHE, 0 /* StorageScope.PROFILE */);
            let serializedCache;
            if (raw) {
                try {
                    serializedCache = JSON.parse(raw);
                }
                catch (error) {
                    this.logService.error(`[CommandsHistory] invalid data: ${error}`);
                }
            }
            const cache = CommandsHistory_1.cache = new map_1.LRUCache(this.configuredCommandsHistoryLength, 1);
            if (serializedCache) {
                let entries;
                if (serializedCache.usesLRU) {
                    entries = serializedCache.entries;
                }
                else {
                    entries = serializedCache.entries.sort((a, b) => a.value - b.value);
                }
                entries.forEach(entry => cache.set(entry.key, entry.value));
            }
            CommandsHistory_1.counter = this.storageService.getNumber(CommandsHistory_1.PREF_KEY_COUNTER, 0 /* StorageScope.PROFILE */, CommandsHistory_1.counter);
        }
        push(commandId) {
            if (!CommandsHistory_1.cache) {
                return;
            }
            CommandsHistory_1.cache.set(commandId, CommandsHistory_1.counter++); // set counter to command
            CommandsHistory_1.hasChanges = true;
        }
        peek(commandId) {
            return CommandsHistory_1.cache?.peek(commandId);
        }
        saveState() {
            if (!CommandsHistory_1.cache) {
                return;
            }
            if (!CommandsHistory_1.hasChanges) {
                return;
            }
            const serializedCache = { usesLRU: true, entries: [] };
            CommandsHistory_1.cache.forEach((value, key) => serializedCache.entries.push({ key, value }));
            this.storageService.store(CommandsHistory_1.PREF_KEY_CACHE, JSON.stringify(serializedCache), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            this.storageService.store(CommandsHistory_1.PREF_KEY_COUNTER, CommandsHistory_1.counter, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            CommandsHistory_1.hasChanges = false;
        }
        static getConfiguredCommandHistoryLength(configurationService) {
            const config = configurationService.getValue();
            const configuredCommandHistoryLength = config.workbench?.commandPalette?.history;
            if (typeof configuredCommandHistoryLength === 'number') {
                return configuredCommandHistoryLength;
            }
            return CommandsHistory_1.DEFAULT_COMMANDS_HISTORY_LENGTH;
        }
        static clearHistory(configurationService, storageService) {
            const commandHistoryLength = CommandsHistory_1.getConfiguredCommandHistoryLength(configurationService);
            CommandsHistory_1.cache = new map_1.LRUCache(commandHistoryLength);
            CommandsHistory_1.counter = 1;
            CommandsHistory_1.hasChanges = true;
        }
    };
    exports.CommandsHistory = CommandsHistory;
    exports.CommandsHistory = CommandsHistory = CommandsHistory_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService)
    ], CommandsHistory);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHNRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvYnJvd3Nlci9jb21tYW5kc1F1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1Q3pGLElBQWUsbUNBQW1DLEdBQWxELE1BQWUsbUNBQW9DLFNBQVEsNkNBQTRDOztpQkFFdEcsV0FBTSxHQUFHLEdBQUcsQUFBTixDQUFPO2lCQUVJLG9CQUFlLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBQ3RCLHNCQUFpQixHQUFHLENBQUMsQUFBSixDQUFLO2lCQUUvQixnQkFBVyxHQUFHLElBQUEsWUFBRSxFQUFDLHVCQUFhLEVBQUUsc0JBQVksRUFBRSxvQ0FBMEIsQ0FBQyxBQUE5RCxDQUErRDtRQU16RixZQUNDLE9BQW9DLEVBQ2Isb0JBQTRELEVBQy9ELGlCQUF3RCxFQUMzRCxjQUFnRCxFQUM5QyxnQkFBb0QsRUFDdkQsYUFBOEM7WUFFOUQsS0FBSyxDQUFDLHFDQUFtQyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQU5uQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzVDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDMUMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzdCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBVjlDLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFjNUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDeEIsQ0FBQztRQUVTLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBYyxFQUFFLFlBQTZCLEVBQUUsS0FBd0IsRUFBRSxVQUEyQztZQUU3SSxxQ0FBcUM7WUFDckMsTUFBTSxlQUFlLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFELElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ25DLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUEscUNBQXdCLEVBQUMsR0FBRyxFQUFFO2dCQUM5QyxNQUFNLEtBQUssR0FBRyxJQUFJLHVCQUFlLEVBQUUsQ0FBQztnQkFDcEMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDekQsR0FBRyxFQUFFLFdBQVcsQ0FBQyxTQUFTO29CQUMxQixVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2lCQUM3QyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNMLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUVwRCxPQUFPLElBQUEsNEJBQW9CLEVBQUMsTUFBTSxDQUFDO3FCQUNqQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLHFDQUFtQyxDQUFDLGVBQWUsQ0FBQztxQkFDbEYsS0FBSyxDQUFDLENBQUMsRUFBRSxxQ0FBbUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ25FLENBQUMsQ0FBQyxDQUFDO1lBRUgsU0FBUztZQUNULE1BQU0sb0JBQW9CLEdBQXdCLEVBQUUsQ0FBQztZQUNyRCxLQUFLLE1BQU0sV0FBVyxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLGVBQWUsR0FBRyxxQ0FBbUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxTQUFTLENBQUM7Z0JBQ2hILE1BQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLHFDQUFtQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUU5SixvQ0FBb0M7Z0JBQ3BDLElBQUksZUFBZSxJQUFJLGVBQWUsRUFBRSxDQUFDO29CQUN4QyxXQUFXLENBQUMsVUFBVSxHQUFHO3dCQUN4QixLQUFLLEVBQUUsZUFBZTt3QkFDdEIsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFNBQVM7cUJBQzVELENBQUM7b0JBRUYsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO2dCQUVELDhDQUE4QztxQkFDekMsSUFBSSxNQUFNLEtBQUssV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUMzQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7Z0JBRUQseURBQXlEO3FCQUNwRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzdCLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO29CQUN6QixJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNuQyxPQUFPLEVBQUUsQ0FBQztvQkFDWCxDQUFDO29CQUVELGdDQUFnQztvQkFDaEMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1RSxJQUFJLFVBQVUsRUFBRSxDQUFDO3dCQUNoQixXQUFXLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7d0JBQzFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDeEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELHlEQUF5RDtZQUN6RCxNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO1lBQy9ELEtBQUssTUFBTSxXQUFXLElBQUksb0JBQW9CLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSx1QkFBdUIsR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLHVCQUF1QixFQUFFLENBQUM7b0JBQzdCLFdBQVcsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQztvQkFDaEQsdUJBQXVCLENBQUMsV0FBVyxHQUFHLHVCQUF1QixDQUFDLFNBQVMsQ0FBQztnQkFDekUsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUN2RCxDQUFDO1lBQ0YsQ0FBQztZQUVELG1EQUFtRDtZQUNuRCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLEVBQUU7Z0JBQ3hELHVFQUF1RTtnQkFDdkUsSUFBSSxZQUFZLENBQUMsVUFBVSxJQUFJLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDeEQsSUFBSSxZQUFZLENBQUMsVUFBVSxLQUFLLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDekQsT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQywyQ0FBMkM7b0JBQ3pHLENBQUM7b0JBQ0QsT0FBTyxZQUFZLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyw2QkFBNkI7Z0JBQ3hGLENBQUM7cUJBQU0sSUFBSSxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3BDLE9BQU8sQ0FBQyxDQUFDLENBQUMsNERBQTREO2dCQUN2RSxDQUFDO3FCQUFNLElBQUksWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNwQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsNERBQTREO2dCQUN4RSxDQUFDO2dCQUVELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUUxRSxJQUFJLGVBQWUsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDeEMsT0FBTyxlQUFlLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsOENBQThDO2dCQUNsRyxDQUFDO2dCQUVELElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3JCLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQywyREFBMkQ7Z0JBQ3ZFLENBQUM7Z0JBRUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDckIsT0FBTyxDQUFDLENBQUMsQ0FBQyxxREFBcUQ7Z0JBQ2hFLENBQUM7Z0JBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQ3RDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUN4RixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDeEYsSUFBSSxrQkFBa0IsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO3dCQUM5QyxPQUFPLENBQUMsQ0FBQyxDQUFDLCtCQUErQjtvQkFDMUMsQ0FBQztvQkFFRCxJQUFJLGtCQUFrQixFQUFFLENBQUM7d0JBQ3hCLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxxRUFBcUU7b0JBQ2pGLENBQUM7b0JBRUQsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO3dCQUN4QixPQUFPLENBQUMsQ0FBQyxDQUFDLDBEQUEwRDtvQkFDckUsQ0FBQztnQkFDRixDQUFDO2dCQUVELG9EQUFvRDtnQkFDcEQsT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0QsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLFlBQVksR0FBbUQsRUFBRSxDQUFDO1lBRXhFLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQzlCLElBQUkscUJBQXFCLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLElBQUksd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUM7WUFDbEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxNQUFNLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFNUMsMkJBQTJCO2dCQUMzQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7b0JBQ2pFLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMzRixpQkFBaUIsR0FBRyxJQUFJLENBQUM7Z0JBQzFCLENBQUM7Z0JBRUQsSUFBSSxxQkFBcUIsSUFBSSxXQUFXLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUNuRSxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMzRixxQkFBcUIsR0FBRyxLQUFLLENBQUM7Z0JBQy9CLENBQUM7Z0JBRUQsMkJBQTJCO2dCQUMzQixJQUFJLHdCQUF3QixJQUFJLFdBQVcsQ0FBQyxVQUFVLEtBQUssU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUMzTCxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDM0YsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO29CQUN6Qix3QkFBd0IsR0FBRyxLQUFLLENBQUM7Z0JBQ2xDLENBQUM7Z0JBRUQsNEJBQTRCO2dCQUM1QixJQUFJLGlCQUFpQixJQUFJLFdBQVcsQ0FBQyxVQUFVLEtBQUssU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7b0JBQ3JMLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzdGLGlCQUFpQixHQUFHLEtBQUssQ0FBQztnQkFDM0IsQ0FBQztnQkFFRCxVQUFVO2dCQUNWLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNoRSxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsT0FBTyxZQUFZLENBQUM7WUFDckIsQ0FBQztZQUVELE9BQU87Z0JBQ04sS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLGVBQWUsRUFBRSxDQUFDLEtBQUssSUFBdUMsRUFBRTtvQkFDL0QsTUFBTSxzQkFBc0IsR0FBRyxNQUFNLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxlQUFlLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUMxSCxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNuQyxPQUFPLEVBQUUsQ0FBQztvQkFDWCxDQUFDO29CQUVELE1BQU0sWUFBWSxHQUFtRCxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUM1SixxR0FBcUc7b0JBQ3JHLHNEQUFzRDtvQkFDdEQsSUFBSSxxQkFBcUIsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO3dCQUNwRSxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMvRixDQUFDO29CQUNELE9BQU8sWUFBWSxDQUFDO2dCQUNyQixDQUFDLENBQUMsRUFBRTthQUNKLENBQUM7UUFDSCxDQUFDO1FBRU8sYUFBYSxDQUFDLFdBQW9ELEVBQUUsVUFBMkM7WUFDdEgsSUFBSSxXQUFXLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLFdBQVcsQ0FBQztZQUNwQixDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRixNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsQ0FBQztnQkFDN0IsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUcsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUVuQixPQUFPO2dCQUNOLEdBQUcsV0FBVztnQkFDZCxTQUFTO2dCQUNULE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxXQUFXLENBQUMsWUFBWSxLQUFLLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQ3ZILFVBQVU7Z0JBQ1YsTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFO29CQUVsQixpQkFBaUI7b0JBQ2pCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFFakQsYUFBYTtvQkFDYixJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFzRSx5QkFBeUIsRUFBRTt3QkFDaEksRUFBRSxFQUFFLFdBQVcsQ0FBQyxTQUFTO3dCQUN6QixJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksSUFBSSxZQUFZO3FCQUN0QyxDQUFDLENBQUM7b0JBRUgsTUFBTTtvQkFDTixJQUFJLENBQUM7d0JBQ0osV0FBVyxDQUFDLElBQUksRUFBRSxNQUFNOzRCQUN2QixDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQzs0QkFDdEYsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNwRSxDQUFDO29CQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7d0JBQ2hCLElBQUksQ0FBQyxJQUFBLDRCQUFtQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7NEJBQ2pDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxvQ0FBb0MsRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ2pJLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFRCw4QkFBOEI7UUFDdEIsYUFBYSxDQUFDLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxrQkFBa0IsRUFBcUI7WUFDbkYsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ2xCLElBQUksWUFBWSxJQUFJLFlBQVksS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDNUMsS0FBSyxJQUFJLE1BQU0sWUFBWSxFQUFFLENBQUM7WUFDL0IsQ0FBQztZQUNELElBQUksa0JBQWtCLElBQUksa0JBQWtCLENBQUMsS0FBSyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUM5RCx5REFBeUQ7Z0JBQ3pELEtBQUssSUFBSSxNQUFNLGtCQUFrQixDQUFDLEtBQUssS0FBSyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLEtBQUssa0JBQWtCLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUN2SyxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDOztJQWhRb0Isa0ZBQW1DO2tEQUFuQyxtQ0FBbUM7UUFldEQsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsMEJBQWUsQ0FBQTtRQUNmLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSx3QkFBYyxDQUFBO09BbkJLLG1DQUFtQyxDQXNReEQ7SUFnQk0sSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTs7aUJBRTlCLG9DQUErQixHQUFHLEVBQUUsQUFBTCxDQUFNO2lCQUU3QixtQkFBYyxHQUFHLDBCQUEwQixBQUE3QixDQUE4QjtpQkFDNUMscUJBQWdCLEdBQUcsNEJBQTRCLEFBQS9CLENBQWdDO2lCQUd6RCxZQUFPLEdBQUcsQ0FBQyxBQUFKLENBQUs7aUJBQ1osZUFBVSxHQUFHLEtBQUssQUFBUixDQUFTO1FBSWxDLFlBQ2tCLGNBQWdELEVBQzFDLG9CQUE0RCxFQUN0RSxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQUowQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDekIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBTDlDLG9DQUErQixHQUFHLENBQUMsQ0FBQztZQVMzQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFWixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0RCxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssNkJBQW1CLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQy9DLDBEQUEwRDtvQkFDMUQseURBQXlEO29CQUN6RCxxREFBcUQ7b0JBQ3JELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDbEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sbUJBQW1CLENBQUMsQ0FBNkI7WUFDeEQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsRUFBRSxDQUFDO2dCQUN0RSxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQywrQkFBK0IsR0FBRyxpQkFBZSxDQUFDLGlDQUFpQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRXBILElBQUksaUJBQWUsQ0FBQyxLQUFLLElBQUksaUJBQWUsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO2dCQUNuRyxpQkFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLCtCQUErQixDQUFDO2dCQUNuRSxpQkFBZSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDbkMsQ0FBQztRQUNGLENBQUM7UUFFTyxJQUFJO1lBQ1gsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsaUJBQWUsQ0FBQyxjQUFjLCtCQUF1QixDQUFDO1lBQzFGLElBQUksZUFBc0QsQ0FBQztZQUMzRCxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNULElBQUksQ0FBQztvQkFDSixlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDbkUsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxpQkFBZSxDQUFDLEtBQUssR0FBRyxJQUFJLGNBQVEsQ0FBaUIsSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVHLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksT0FBeUMsQ0FBQztnQkFDOUMsSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzdCLE9BQU8sR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDO2dCQUNuQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JFLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM3RCxDQUFDO1lBRUQsaUJBQWUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsaUJBQWUsQ0FBQyxnQkFBZ0IsZ0NBQXdCLGlCQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUksQ0FBQztRQUVELElBQUksQ0FBQyxTQUFpQjtZQUNyQixJQUFJLENBQUMsaUJBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDNUIsT0FBTztZQUNSLENBQUM7WUFFRCxpQkFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLGlCQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLHlCQUF5QjtZQUMxRixpQkFBZSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDbkMsQ0FBQztRQUVELElBQUksQ0FBQyxTQUFpQjtZQUNyQixPQUFPLGlCQUFlLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRU8sU0FBUztZQUNoQixJQUFJLENBQUMsaUJBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDNUIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsaUJBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakMsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGVBQWUsR0FBOEIsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUNsRixpQkFBZSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFNUYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsaUJBQWUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsMkRBQTJDLENBQUM7WUFDckksSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsaUJBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBZSxDQUFDLE9BQU8sMkRBQTJDLENBQUM7WUFDL0gsaUJBQWUsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxNQUFNLENBQUMsaUNBQWlDLENBQUMsb0JBQTJDO1lBQ25GLE1BQU0sTUFBTSxHQUFzQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUVsRixNQUFNLDhCQUE4QixHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLE9BQU8sQ0FBQztZQUNqRixJQUFJLE9BQU8sOEJBQThCLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sOEJBQThCLENBQUM7WUFDdkMsQ0FBQztZQUVELE9BQU8saUJBQWUsQ0FBQywrQkFBK0IsQ0FBQztRQUN4RCxDQUFDO1FBRUQsTUFBTSxDQUFDLFlBQVksQ0FBQyxvQkFBMkMsRUFBRSxjQUErQjtZQUMvRixNQUFNLG9CQUFvQixHQUFHLGlCQUFlLENBQUMsaUNBQWlDLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNyRyxpQkFBZSxDQUFDLEtBQUssR0FBRyxJQUFJLGNBQVEsQ0FBaUIsb0JBQW9CLENBQUMsQ0FBQztZQUMzRSxpQkFBZSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFFNUIsaUJBQWUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ25DLENBQUM7O0lBM0hXLDBDQUFlOzhCQUFmLGVBQWU7UUFjekIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlCQUFXLENBQUE7T0FoQkQsZUFBZSxDQTRIM0IifQ==