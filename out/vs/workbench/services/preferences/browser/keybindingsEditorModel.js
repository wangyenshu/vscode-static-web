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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/platform", "vs/base/common/filters", "vs/base/common/keybindingLabels", "vs/platform/actions/common/actions", "vs/workbench/common/editor/editorModel", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/workbench/services/keybinding/browser/unboundCommands", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensions/common/extensions", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, arrays_1, strings, platform_1, filters_1, keybindingLabels_1, actions_1, editorModel_1, keybinding_1, resolvedKeybindingItem_1, unboundCommands_1, types_1, extensions_1, extensions_2, contextkey_1) {
    "use strict";
    var KeybindingsEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditorModel = exports.KEYBINDING_ENTRY_TEMPLATE_ID = void 0;
    exports.createKeybindingCommandQuery = createKeybindingCommandQuery;
    exports.KEYBINDING_ENTRY_TEMPLATE_ID = 'keybinding.entry.template';
    const SOURCE_SYSTEM = (0, nls_1.localize)('default', "System");
    const SOURCE_EXTENSION = (0, nls_1.localize)('extension', "Extension");
    const SOURCE_USER = (0, nls_1.localize)('user', "User");
    function createKeybindingCommandQuery(commandId, when) {
        const whenPart = when ? ` +when:${when}` : '';
        return `@command:${commandId}${whenPart}`;
    }
    const wordFilter = (0, filters_1.or)(filters_1.matchesPrefix, filters_1.matchesWords, filters_1.matchesContiguousSubString);
    const COMMAND_REGEX = /@command:\s*([^\+]+)/i;
    const WHEN_REGEX = /\+when:\s*(.+)/i;
    const SOURCE_REGEX = /@source:\s*(user|default|system|extension)/i;
    const EXTENSION_REGEX = /@ext:\s*((".+")|([^\s]+))/i;
    const KEYBINDING_REGEX = /@keybinding:\s*((\".+\")|(\S+))/i;
    let KeybindingsEditorModel = KeybindingsEditorModel_1 = class KeybindingsEditorModel extends editorModel_1.EditorModel {
        constructor(os, keybindingsService, extensionService) {
            super();
            this.keybindingsService = keybindingsService;
            this.extensionService = extensionService;
            this._keybindingItems = [];
            this._keybindingItemsSortedByPrecedence = [];
            this.modifierLabels = {
                ui: keybindingLabels_1.UILabelProvider.modifierLabels[os],
                aria: keybindingLabels_1.AriaLabelProvider.modifierLabels[os],
                user: keybindingLabels_1.UserSettingsLabelProvider.modifierLabels[os]
            };
        }
        fetch(searchValue, sortByPrecedence = false) {
            let keybindingItems = sortByPrecedence ? this._keybindingItemsSortedByPrecedence : this._keybindingItems;
            // @command:COMMAND_ID
            const commandIdMatches = COMMAND_REGEX.exec(searchValue);
            if (commandIdMatches && commandIdMatches[1]) {
                const command = commandIdMatches[1].trim();
                let filteredKeybindingItems = keybindingItems.filter(k => k.command === command);
                // +when:WHEN_EXPRESSION
                if (filteredKeybindingItems.length) {
                    const whenMatches = WHEN_REGEX.exec(searchValue);
                    if (whenMatches && whenMatches[1]) {
                        const whenValue = whenMatches[1].trim();
                        filteredKeybindingItems = this.filterByWhen(filteredKeybindingItems, command, whenValue);
                    }
                }
                return filteredKeybindingItems.map(keybindingItem => ({ id: KeybindingsEditorModel_1.getId(keybindingItem), keybindingItem, templateId: exports.KEYBINDING_ENTRY_TEMPLATE_ID }));
            }
            // @source:SOURCE
            if (SOURCE_REGEX.test(searchValue)) {
                keybindingItems = this.filterBySource(keybindingItems, searchValue);
                searchValue = searchValue.replace(SOURCE_REGEX, '');
            }
            else {
                // @ext:EXTENSION_ID
                const extensionMatches = EXTENSION_REGEX.exec(searchValue);
                if (extensionMatches && (extensionMatches[2] || extensionMatches[3])) {
                    const extensionId = extensionMatches[2] ? extensionMatches[2].substring(1, extensionMatches[2].length - 1) : extensionMatches[3];
                    keybindingItems = this.filterByExtension(keybindingItems, extensionId);
                    searchValue = searchValue.replace(EXTENSION_REGEX, '');
                }
                else {
                    // @keybinding:KEYBINDING
                    const keybindingMatches = KEYBINDING_REGEX.exec(searchValue);
                    if (keybindingMatches && (keybindingMatches[2] || keybindingMatches[3])) {
                        searchValue = keybindingMatches[2] || `"${keybindingMatches[3]}"`;
                    }
                }
            }
            searchValue = searchValue.trim();
            if (!searchValue) {
                return keybindingItems.map(keybindingItem => ({ id: KeybindingsEditorModel_1.getId(keybindingItem), keybindingItem, templateId: exports.KEYBINDING_ENTRY_TEMPLATE_ID }));
            }
            return this.filterByText(keybindingItems, searchValue);
        }
        filterBySource(keybindingItems, searchValue) {
            if (/@source:\s*default/i.test(searchValue) || /@source:\s*system/i.test(searchValue)) {
                return keybindingItems.filter(k => k.source === SOURCE_SYSTEM);
            }
            if (/@source:\s*user/i.test(searchValue)) {
                return keybindingItems.filter(k => k.source === SOURCE_USER);
            }
            if (/@source:\s*extension/i.test(searchValue)) {
                return keybindingItems.filter(k => !(0, types_1.isString)(k.source) || k.source === SOURCE_EXTENSION);
            }
            return keybindingItems;
        }
        filterByExtension(keybindingItems, extension) {
            extension = extension.toLowerCase().trim();
            return keybindingItems.filter(k => !(0, types_1.isString)(k.source) && (extensions_2.ExtensionIdentifier.equals(k.source.identifier, extension) || k.source.displayName?.toLowerCase() === extension.toLowerCase()));
        }
        filterByText(keybindingItems, searchValue) {
            const quoteAtFirstChar = searchValue.charAt(0) === '"';
            const quoteAtLastChar = searchValue.charAt(searchValue.length - 1) === '"';
            const completeMatch = quoteAtFirstChar && quoteAtLastChar;
            if (quoteAtFirstChar) {
                searchValue = searchValue.substring(1);
            }
            if (quoteAtLastChar) {
                searchValue = searchValue.substring(0, searchValue.length - 1);
            }
            searchValue = searchValue.trim();
            const result = [];
            const words = searchValue.split(' ');
            const keybindingWords = this.splitKeybindingWords(words);
            for (const keybindingItem of keybindingItems) {
                const keybindingMatches = new KeybindingItemMatches(this.modifierLabels, keybindingItem, searchValue, words, keybindingWords, completeMatch);
                if (keybindingMatches.commandIdMatches
                    || keybindingMatches.commandLabelMatches
                    || keybindingMatches.commandDefaultLabelMatches
                    || keybindingMatches.sourceMatches
                    || keybindingMatches.whenMatches
                    || keybindingMatches.keybindingMatches
                    || keybindingMatches.extensionIdMatches
                    || keybindingMatches.extensionLabelMatches) {
                    result.push({
                        id: KeybindingsEditorModel_1.getId(keybindingItem),
                        templateId: exports.KEYBINDING_ENTRY_TEMPLATE_ID,
                        commandLabelMatches: keybindingMatches.commandLabelMatches || undefined,
                        commandDefaultLabelMatches: keybindingMatches.commandDefaultLabelMatches || undefined,
                        keybindingItem,
                        keybindingMatches: keybindingMatches.keybindingMatches || undefined,
                        commandIdMatches: keybindingMatches.commandIdMatches || undefined,
                        sourceMatches: keybindingMatches.sourceMatches || undefined,
                        whenMatches: keybindingMatches.whenMatches || undefined,
                        extensionIdMatches: keybindingMatches.extensionIdMatches || undefined,
                        extensionLabelMatches: keybindingMatches.extensionLabelMatches || undefined
                    });
                }
            }
            return result;
        }
        filterByWhen(keybindingItems, command, when) {
            if (keybindingItems.length === 0) {
                return [];
            }
            // Check if a keybinding with the same command id and when clause exists
            const keybindingItemsWithWhen = keybindingItems.filter(k => k.when === when);
            if (keybindingItemsWithWhen.length) {
                return keybindingItemsWithWhen;
            }
            // Create a new entry with the when clause which does not live in the model
            // We can reuse some of the properties from the same command with different when clause
            const commandLabel = keybindingItems[0].commandLabel;
            const keybindingItem = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, command, null, contextkey_1.ContextKeyExpr.deserialize(when), false, null, false);
            const actionLabels = new Map([[command, commandLabel]]);
            return [KeybindingsEditorModel_1.toKeybindingEntry(command, keybindingItem, actionLabels, this.getExtensionsMapping())];
        }
        splitKeybindingWords(wordsSeparatedBySpaces) {
            const result = [];
            for (const word of wordsSeparatedBySpaces) {
                result.push(...(0, arrays_1.coalesce)(word.split('+')));
            }
            return result;
        }
        async resolve(actionLabels = new Map()) {
            const extensions = this.getExtensionsMapping();
            this._keybindingItemsSortedByPrecedence = [];
            const boundCommands = new Map();
            for (const keybinding of this.keybindingsService.getKeybindings()) {
                if (keybinding.command) { // Skip keybindings without commands
                    this._keybindingItemsSortedByPrecedence.push(KeybindingsEditorModel_1.toKeybindingEntry(keybinding.command, keybinding, actionLabels, extensions));
                    boundCommands.set(keybinding.command, true);
                }
            }
            const commandsWithDefaultKeybindings = this.keybindingsService.getDefaultKeybindings().map(keybinding => keybinding.command);
            for (const command of (0, unboundCommands_1.getAllUnboundCommands)(boundCommands)) {
                const keybindingItem = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, command, null, undefined, commandsWithDefaultKeybindings.indexOf(command) === -1, null, false);
                this._keybindingItemsSortedByPrecedence.push(KeybindingsEditorModel_1.toKeybindingEntry(command, keybindingItem, actionLabels, extensions));
            }
            this._keybindingItemsSortedByPrecedence = (0, arrays_1.distinct)(this._keybindingItemsSortedByPrecedence, keybindingItem => KeybindingsEditorModel_1.getId(keybindingItem));
            this._keybindingItems = this._keybindingItemsSortedByPrecedence.slice(0).sort((a, b) => KeybindingsEditorModel_1.compareKeybindingData(a, b));
            return super.resolve();
        }
        static getId(keybindingItem) {
            return keybindingItem.command + (keybindingItem?.keybinding?.getAriaLabel() ?? '') + keybindingItem.when + ((0, types_1.isString)(keybindingItem.source) ? keybindingItem.source : keybindingItem.source.identifier.value);
        }
        getExtensionsMapping() {
            const extensions = new extensions_2.ExtensionIdentifierMap();
            for (const extension of this.extensionService.extensions) {
                extensions.set(extension.identifier, extension);
            }
            return extensions;
        }
        static compareKeybindingData(a, b) {
            if (a.keybinding && !b.keybinding) {
                return -1;
            }
            if (b.keybinding && !a.keybinding) {
                return 1;
            }
            if (a.commandLabel && !b.commandLabel) {
                return -1;
            }
            if (b.commandLabel && !a.commandLabel) {
                return 1;
            }
            if (a.commandLabel && b.commandLabel) {
                if (a.commandLabel !== b.commandLabel) {
                    return a.commandLabel.localeCompare(b.commandLabel);
                }
            }
            if (a.command === b.command) {
                return a.keybindingItem.isDefault ? 1 : -1;
            }
            return a.command.localeCompare(b.command);
        }
        static toKeybindingEntry(command, keybindingItem, actions, extensions) {
            const menuCommand = actions_1.MenuRegistry.getCommand(command);
            const editorActionLabel = actions.get(command);
            let source = SOURCE_USER;
            if (keybindingItem.isDefault) {
                const extensionId = keybindingItem.extensionId ?? (keybindingItem.resolvedKeybinding ? undefined : menuCommand?.source?.id);
                source = extensionId ? extensions.get(extensionId) ?? SOURCE_EXTENSION : SOURCE_SYSTEM;
            }
            return {
                keybinding: keybindingItem.resolvedKeybinding,
                keybindingItem,
                command,
                commandLabel: KeybindingsEditorModel_1.getCommandLabel(menuCommand, editorActionLabel),
                commandDefaultLabel: KeybindingsEditorModel_1.getCommandDefaultLabel(menuCommand),
                when: keybindingItem.when ? keybindingItem.when.serialize() : '',
                source
            };
        }
        static getCommandDefaultLabel(menuCommand) {
            if (!platform_1.Language.isDefaultVariant()) {
                if (menuCommand && menuCommand.title && menuCommand.title.original) {
                    const category = menuCommand.category ? menuCommand.category.original : undefined;
                    const title = menuCommand.title.original;
                    return category ? (0, nls_1.localize)('cat.title', "{0}: {1}", category, title) : title;
                }
            }
            return null;
        }
        static getCommandLabel(menuCommand, editorActionLabel) {
            if (menuCommand) {
                const category = menuCommand.category ? typeof menuCommand.category === 'string' ? menuCommand.category : menuCommand.category.value : undefined;
                const title = typeof menuCommand.title === 'string' ? menuCommand.title : menuCommand.title.value;
                return category ? (0, nls_1.localize)('cat.title', "{0}: {1}", category, title) : title;
            }
            if (editorActionLabel) {
                return editorActionLabel;
            }
            return '';
        }
    };
    exports.KeybindingsEditorModel = KeybindingsEditorModel;
    exports.KeybindingsEditorModel = KeybindingsEditorModel = KeybindingsEditorModel_1 = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, extensions_1.IExtensionService)
    ], KeybindingsEditorModel);
    class KeybindingItemMatches {
        constructor(modifierLabels, keybindingItem, searchValue, words, keybindingWords, completeMatch) {
            this.modifierLabels = modifierLabels;
            this.commandIdMatches = null;
            this.commandLabelMatches = null;
            this.commandDefaultLabelMatches = null;
            this.sourceMatches = null;
            this.whenMatches = null;
            this.keybindingMatches = null;
            this.extensionIdMatches = null;
            this.extensionLabelMatches = null;
            if (!completeMatch) {
                this.commandIdMatches = this.matches(searchValue, keybindingItem.command, (0, filters_1.or)(filters_1.matchesWords, filters_1.matchesCamelCase), words);
                this.commandLabelMatches = keybindingItem.commandLabel ? this.matches(searchValue, keybindingItem.commandLabel, (word, wordToMatchAgainst) => (0, filters_1.matchesWords)(word, keybindingItem.commandLabel, true), words) : null;
                this.commandDefaultLabelMatches = keybindingItem.commandDefaultLabel ? this.matches(searchValue, keybindingItem.commandDefaultLabel, (word, wordToMatchAgainst) => (0, filters_1.matchesWords)(word, keybindingItem.commandDefaultLabel, true), words) : null;
                this.whenMatches = keybindingItem.when ? this.matches(null, keybindingItem.when, (0, filters_1.or)(filters_1.matchesWords, filters_1.matchesCamelCase), words) : null;
                if ((0, types_1.isString)(keybindingItem.source)) {
                    this.sourceMatches = this.matches(searchValue, keybindingItem.source, (word, wordToMatchAgainst) => (0, filters_1.matchesWords)(word, keybindingItem.source, true), words);
                }
                else {
                    this.extensionLabelMatches = keybindingItem.source.displayName ? this.matches(searchValue, keybindingItem.source.displayName, (word, wordToMatchAgainst) => (0, filters_1.matchesWords)(word, keybindingItem.commandLabel, true), words) : null;
                }
            }
            this.keybindingMatches = keybindingItem.keybinding ? this.matchesKeybinding(keybindingItem.keybinding, searchValue, keybindingWords, completeMatch) : null;
        }
        matches(searchValue, wordToMatchAgainst, wordMatchesFilter, words) {
            let matches = searchValue ? wordFilter(searchValue, wordToMatchAgainst) : null;
            if (!matches) {
                matches = this.matchesWords(words, wordToMatchAgainst, wordMatchesFilter);
            }
            if (matches) {
                matches = this.filterAndSort(matches);
            }
            return matches;
        }
        matchesWords(words, wordToMatchAgainst, wordMatchesFilter) {
            let matches = [];
            for (const word of words) {
                const wordMatches = wordMatchesFilter(word, wordToMatchAgainst);
                if (wordMatches) {
                    matches = [...(matches || []), ...wordMatches];
                }
                else {
                    matches = null;
                    break;
                }
            }
            return matches;
        }
        filterAndSort(matches) {
            return (0, arrays_1.distinct)(matches, (a => a.start + '.' + a.end)).filter(match => !matches.some(m => !(m.start === match.start && m.end === match.end) && (m.start <= match.start && m.end >= match.end))).sort((a, b) => a.start - b.start);
        }
        matchesKeybinding(keybinding, searchValue, words, completeMatch) {
            const [firstPart, chordPart] = keybinding.getChords();
            const userSettingsLabel = keybinding.getUserSettingsLabel();
            const ariaLabel = keybinding.getAriaLabel();
            const label = keybinding.getLabel();
            if ((userSettingsLabel && strings.compareIgnoreCase(searchValue, userSettingsLabel) === 0)
                || (ariaLabel && strings.compareIgnoreCase(searchValue, ariaLabel) === 0)
                || (label && strings.compareIgnoreCase(searchValue, label) === 0)) {
                return {
                    firstPart: this.createCompleteMatch(firstPart),
                    chordPart: this.createCompleteMatch(chordPart)
                };
            }
            const firstPartMatch = {};
            let chordPartMatch = {};
            const matchedWords = [];
            const firstPartMatchedWords = [];
            let chordPartMatchedWords = [];
            let matchFirstPart = true;
            for (let index = 0; index < words.length; index++) {
                const word = words[index];
                let firstPartMatched = false;
                let chordPartMatched = false;
                matchFirstPart = matchFirstPart && !firstPartMatch.keyCode;
                let matchChordPart = !chordPartMatch.keyCode;
                if (matchFirstPart) {
                    firstPartMatched = this.matchPart(firstPart, firstPartMatch, word, completeMatch);
                    if (firstPartMatch.keyCode) {
                        for (const cordPartMatchedWordIndex of chordPartMatchedWords) {
                            if (firstPartMatchedWords.indexOf(cordPartMatchedWordIndex) === -1) {
                                matchedWords.splice(matchedWords.indexOf(cordPartMatchedWordIndex), 1);
                            }
                        }
                        chordPartMatch = {};
                        chordPartMatchedWords = [];
                        matchChordPart = false;
                    }
                }
                if (matchChordPart) {
                    chordPartMatched = this.matchPart(chordPart, chordPartMatch, word, completeMatch);
                }
                if (firstPartMatched) {
                    firstPartMatchedWords.push(index);
                }
                if (chordPartMatched) {
                    chordPartMatchedWords.push(index);
                }
                if (firstPartMatched || chordPartMatched) {
                    matchedWords.push(index);
                }
                matchFirstPart = matchFirstPart && this.isModifier(word);
            }
            if (matchedWords.length !== words.length) {
                return null;
            }
            if (completeMatch) {
                if (!this.isCompleteMatch(firstPart, firstPartMatch)) {
                    return null;
                }
                if (!(0, types_1.isEmptyObject)(chordPartMatch) && !this.isCompleteMatch(chordPart, chordPartMatch)) {
                    return null;
                }
            }
            return this.hasAnyMatch(firstPartMatch) || this.hasAnyMatch(chordPartMatch) ? { firstPart: firstPartMatch, chordPart: chordPartMatch } : null;
        }
        matchPart(chord, match, word, completeMatch) {
            let matched = false;
            if (this.matchesMetaModifier(chord, word)) {
                matched = true;
                match.metaKey = true;
            }
            if (this.matchesCtrlModifier(chord, word)) {
                matched = true;
                match.ctrlKey = true;
            }
            if (this.matchesShiftModifier(chord, word)) {
                matched = true;
                match.shiftKey = true;
            }
            if (this.matchesAltModifier(chord, word)) {
                matched = true;
                match.altKey = true;
            }
            if (this.matchesKeyCode(chord, word, completeMatch)) {
                match.keyCode = true;
                matched = true;
            }
            return matched;
        }
        matchesKeyCode(chord, word, completeMatch) {
            if (!chord) {
                return false;
            }
            const ariaLabel = chord.keyAriaLabel || '';
            if (completeMatch || ariaLabel.length === 1 || word.length === 1) {
                if (strings.compareIgnoreCase(ariaLabel, word) === 0) {
                    return true;
                }
            }
            else {
                if ((0, filters_1.matchesContiguousSubString)(word, ariaLabel)) {
                    return true;
                }
            }
            return false;
        }
        matchesMetaModifier(chord, word) {
            if (!chord) {
                return false;
            }
            if (!chord.metaKey) {
                return false;
            }
            return this.wordMatchesMetaModifier(word);
        }
        matchesCtrlModifier(chord, word) {
            if (!chord) {
                return false;
            }
            if (!chord.ctrlKey) {
                return false;
            }
            return this.wordMatchesCtrlModifier(word);
        }
        matchesShiftModifier(chord, word) {
            if (!chord) {
                return false;
            }
            if (!chord.shiftKey) {
                return false;
            }
            return this.wordMatchesShiftModifier(word);
        }
        matchesAltModifier(chord, word) {
            if (!chord) {
                return false;
            }
            if (!chord.altKey) {
                return false;
            }
            return this.wordMatchesAltModifier(word);
        }
        hasAnyMatch(keybindingMatch) {
            return !!keybindingMatch.altKey ||
                !!keybindingMatch.ctrlKey ||
                !!keybindingMatch.metaKey ||
                !!keybindingMatch.shiftKey ||
                !!keybindingMatch.keyCode;
        }
        isCompleteMatch(chord, match) {
            if (!chord) {
                return true;
            }
            if (!match.keyCode) {
                return false;
            }
            if (chord.metaKey && !match.metaKey) {
                return false;
            }
            if (chord.altKey && !match.altKey) {
                return false;
            }
            if (chord.ctrlKey && !match.ctrlKey) {
                return false;
            }
            if (chord.shiftKey && !match.shiftKey) {
                return false;
            }
            return true;
        }
        createCompleteMatch(chord) {
            const match = {};
            if (chord) {
                match.keyCode = true;
                if (chord.metaKey) {
                    match.metaKey = true;
                }
                if (chord.altKey) {
                    match.altKey = true;
                }
                if (chord.ctrlKey) {
                    match.ctrlKey = true;
                }
                if (chord.shiftKey) {
                    match.shiftKey = true;
                }
            }
            return match;
        }
        isModifier(word) {
            if (this.wordMatchesAltModifier(word)) {
                return true;
            }
            if (this.wordMatchesCtrlModifier(word)) {
                return true;
            }
            if (this.wordMatchesMetaModifier(word)) {
                return true;
            }
            if (this.wordMatchesShiftModifier(word)) {
                return true;
            }
            return false;
        }
        wordMatchesAltModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase((0, nls_1.localize)('option', "option"), word)) {
                return true;
            }
            return false;
        }
        wordMatchesCtrlModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.ctrlKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.ctrlKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.ctrlKey, word)) {
                return true;
            }
            return false;
        }
        wordMatchesMetaModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase((0, nls_1.localize)('meta', "meta"), word)) {
                return true;
            }
            return false;
        }
        wordMatchesShiftModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.shiftKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.shiftKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.shiftKey, word)) {
                return true;
            }
            return false;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wcmVmZXJlbmNlcy9icm93c2VyL2tleWJpbmRpbmdzRWRpdG9yTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlDaEcsb0VBR0M7SUFmWSxRQUFBLDRCQUE0QixHQUFHLDJCQUEyQixDQUFDO0lBRXhFLE1BQU0sYUFBYSxHQUFHLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM1RCxNQUFNLFdBQVcsR0FBRyxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFRN0MsU0FBZ0IsNEJBQTRCLENBQUMsU0FBaUIsRUFBRSxJQUFhO1FBQzVFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzlDLE9BQU8sWUFBWSxTQUFTLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDM0MsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLElBQUEsWUFBRSxFQUFDLHVCQUFhLEVBQUUsc0JBQVksRUFBRSxvQ0FBMEIsQ0FBQyxDQUFDO0lBQy9FLE1BQU0sYUFBYSxHQUFHLHVCQUF1QixDQUFDO0lBQzlDLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDO0lBQ3JDLE1BQU0sWUFBWSxHQUFHLDZDQUE2QyxDQUFDO0lBQ25FLE1BQU0sZUFBZSxHQUFHLDRCQUE0QixDQUFDO0lBQ3JELE1BQU0sZ0JBQWdCLEdBQUcsa0NBQWtDLENB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