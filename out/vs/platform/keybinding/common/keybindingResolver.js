/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingResolver = exports.NoMatchingKb = exports.ResultKind = void 0;
    //#region resolution-result
    var ResultKind;
    (function (ResultKind) {
        /** No keybinding found this sequence of chords */
        ResultKind[ResultKind["NoMatchingKb"] = 0] = "NoMatchingKb";
        /** There're several keybindings that have the given sequence of chords as a prefix */
        ResultKind[ResultKind["MoreChordsNeeded"] = 1] = "MoreChordsNeeded";
        /** A single keybinding found to be dispatched/invoked */
        ResultKind[ResultKind["KbFound"] = 2] = "KbFound";
    })(ResultKind || (exports.ResultKind = ResultKind = {}));
    // util definitions to make working with the above types easier within this module:
    exports.NoMatchingKb = { kind: 0 /* ResultKind.NoMatchingKb */ };
    const MoreChordsNeeded = { kind: 1 /* ResultKind.MoreChordsNeeded */ };
    function KbFound(commandId, commandArgs, isBubble) {
        return { kind: 2 /* ResultKind.KbFound */, commandId, commandArgs, isBubble };
    }
    //#endregion
    /**
     * Stores mappings from keybindings to commands and from commands to keybindings.
     * Given a sequence of chords, `resolve`s which keybinding it matches
     */
    class KeybindingResolver {
        constructor(
        /** built-in and extension-provided keybindings */
        defaultKeybindings, 
        /** user's keybindings */
        overrides, log) {
            this._log = log;
            this._defaultKeybindings = defaultKeybindings;
            this._defaultBoundCommands = new Map();
            for (const defaultKeybinding of defaultKeybindings) {
                const command = defaultKeybinding.command;
                if (command && command.charAt(0) !== '-') {
                    this._defaultBoundCommands.set(command, true);
                }
            }
            this._map = new Map();
            this._lookupMap = new Map();
            this._keybindings = KeybindingResolver.handleRemovals([].concat(defaultKeybindings).concat(overrides));
            for (let i = 0, len = this._keybindings.length; i < len; i++) {
                const k = this._keybindings[i];
                if (k.chords.length === 0) {
                    // unbound
                    continue;
                }
                // substitute with constants that are registered after startup - https://github.com/microsoft/vscode/issues/174218#issuecomment-1437972127
                const when = k.when?.substituteConstants();
                if (when && when.type === 0 /* ContextKeyExprType.False */) {
                    // when condition is false
                    continue;
                }
                this._addKeyPress(k.chords[0], k);
            }
        }
        static _isTargetedForRemoval(defaultKb, keypress, when) {
            if (keypress) {
                for (let i = 0; i < keypress.length; i++) {
                    if (keypress[i] !== defaultKb.chords[i]) {
                        return false;
                    }
                }
            }
            // `true` means always, as does `undefined`
            // so we will treat `true` === `undefined`
            if (when && when.type !== 1 /* ContextKeyExprType.True */) {
                if (!defaultKb.when) {
                    return false;
                }
                if (!(0, contextkey_1.expressionsAreEqualWithConstantSubstitution)(when, defaultKb.when)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Looks for rules containing "-commandId" and removes them.
         */
        static handleRemovals(rules) {
            // Do a first pass and construct a hash-map for removals
            const removals = new Map();
            for (let i = 0, len = rules.length; i < len; i++) {
                const rule = rules[i];
                if (rule.command && rule.command.charAt(0) === '-') {
                    const command = rule.command.substring(1);
                    if (!removals.has(command)) {
                        removals.set(command, [rule]);
                    }
                    else {
                        removals.get(command).push(rule);
                    }
                }
            }
            if (removals.size === 0) {
                // There are no removals
                return rules;
            }
            // Do a second pass and keep only non-removed keybindings
            const result = [];
            for (let i = 0, len = rules.length; i < len; i++) {
                const rule = rules[i];
                if (!rule.command || rule.command.length === 0) {
                    result.push(rule);
                    continue;
                }
                if (rule.command.charAt(0) === '-') {
                    continue;
                }
                const commandRemovals = removals.get(rule.command);
                if (!commandRemovals || !rule.isDefault) {
                    result.push(rule);
                    continue;
                }
                let isRemoved = false;
                for (const commandRemoval of commandRemovals) {
                    const when = commandRemoval.when;
                    if (this._isTargetedForRemoval(rule, commandRemoval.chords, when)) {
                        isRemoved = true;
                        break;
                    }
                }
                if (!isRemoved) {
                    result.push(rule);
                    continue;
                }
            }
            return result;
        }
        _addKeyPress(keypress, item) {
            const conflicts = this._map.get(keypress);
            if (typeof conflicts === 'undefined') {
                // There is no conflict so far
                this._map.set(keypress, [item]);
                this._addToLookupMap(item);
                return;
            }
            for (let i = conflicts.length - 1; i >= 0; i--) {
                const conflict = conflicts[i];
                if (conflict.command === item.command) {
                    continue;
                }
                // Test if the shorter keybinding is a prefix of the longer one.
                // If the shorter keybinding is a prefix, it effectively will shadow the longer one and is considered a conflict.
                let isShorterKbPrefix = true;
                for (let i = 1; i < conflict.chords.length && i < item.chords.length; i++) {
                    if (conflict.chords[i] !== item.chords[i]) {
                        // The ith step does not conflict
                        isShorterKbPrefix = false;
                        break;
                    }
                }
                if (!isShorterKbPrefix) {
                    continue;
                }
                if (KeybindingResolver.whenIsEntirelyIncluded(conflict.when, item.when)) {
                    // `item` completely overwrites `conflict`
                    // Remove conflict from the lookupMap
                    this._removeFromLookupMap(conflict);
                }
            }
            conflicts.push(item);
            this._addToLookupMap(item);
        }
        _addToLookupMap(item) {
            if (!item.command) {
                return;
            }
            let arr = this._lookupMap.get(item.command);
            if (typeof arr === 'undefined') {
                arr = [item];
                this._lookupMap.set(item.command, arr);
            }
            else {
                arr.push(item);
            }
        }
        _removeFromLookupMap(item) {
            if (!item.command) {
                return;
            }
            const arr = this._lookupMap.get(item.command);
            if (typeof arr === 'undefined') {
                return;
            }
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i] === item) {
                    arr.splice(i, 1);
                    return;
                }
            }
        }
        /**
         * Returns true if it is provable `a` implies `b`.
         */
        static whenIsEntirelyIncluded(a, b) {
            if (!b || b.type === 1 /* ContextKeyExprType.True */) {
                return true;
            }
            if (!a || a.type === 1 /* ContextKeyExprType.True */) {
                return false;
            }
            return (0, contextkey_1.implies)(a, b);
        }
        getDefaultBoundCommands() {
            return this._defaultBoundCommands;
        }
        getDefaultKeybindings() {
            return this._defaultKeybindings;
        }
        getKeybindings() {
            return this._keybindings;
        }
        lookupKeybindings(commandId) {
            const items = this._lookupMap.get(commandId);
            if (typeof items === 'undefined' || items.length === 0) {
                return [];
            }
            // Reverse to get the most specific item first
            const result = [];
            let resultLen = 0;
            for (let i = items.length - 1; i >= 0; i--) {
                result[resultLen++] = items[i];
            }
            return result;
        }
        lookupPrimaryKeybinding(commandId, context) {
            const items = this._lookupMap.get(commandId);
            if (typeof items === 'undefined' || items.length === 0) {
                return null;
            }
            if (items.length === 1) {
                return items[0];
            }
            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                if (context.contextMatchesRules(item.when)) {
                    return item;
                }
            }
            return items[items.length - 1];
        }
        /**
         * Looks up a keybinding trigged as a result of pressing a sequence of chords - `[...currentChords, keypress]`
         *
         * Example: resolving 3 chords pressed sequentially - `cmd+k cmd+p cmd+i`:
         * 	`currentChords = [ 'cmd+k' , 'cmd+p' ]` and `keypress = `cmd+i` - last pressed chord
         */
        resolve(context, currentChords, keypress) {
            const pressedChords = [...currentChords, keypress];
            this._log(`| Resolving ${pressedChords}`);
            const kbCandidates = this._map.get(pressedChords[0]);
            if (kbCandidates === undefined) {
                // No bindings with such 0-th chord
                this._log(`\\ No keybinding entries.`);
                return exports.NoMatchingKb;
            }
            let lookupMap = null;
            if (pressedChords.length < 2) {
                lookupMap = kbCandidates;
            }
            else {
                // Fetch all chord bindings for `currentChords`
                lookupMap = [];
                for (let i = 0, len = kbCandidates.length; i < len; i++) {
                    const candidate = kbCandidates[i];
                    if (pressedChords.length > candidate.chords.length) { // # of pressed chords can't be less than # of chords in a keybinding to invoke
                        continue;
                    }
                    let prefixMatches = true;
                    for (let i = 1; i < pressedChords.length; i++) {
                        if (candidate.chords[i] !== pressedChords[i]) {
                            prefixMatches = false;
                            break;
                        }
                    }
                    if (prefixMatches) {
                        lookupMap.push(candidate);
                    }
                }
            }
            // check there's a keybinding with a matching when clause
            const result = this._findCommand(context, lookupMap);
            if (!result) {
                this._log(`\\ From ${lookupMap.length} keybinding entries, no when clauses matched the context.`);
                return exports.NoMatchingKb;
            }
            // check we got all chords necessary to be sure a particular keybinding needs to be invoked
            if (pressedChords.length < result.chords.length) {
                // The chord sequence is not complete
                this._log(`\\ From ${lookupMap.length} keybinding entries, awaiting ${result.chords.length - pressedChords.length} more chord(s), when: ${printWhenExplanation(result.when)}, source: ${printSourceExplanation(result)}.`);
                return MoreChordsNeeded;
            }
            this._log(`\\ From ${lookupMap.length} keybinding entries, matched ${result.command}, when: ${printWhenExplanation(result.when)}, source: ${printSourceExplanation(result)}.`);
            return KbFound(result.command, result.commandArgs, result.bubble);
        }
        _findCommand(context, matches) {
            for (let i = matches.length - 1; i >= 0; i--) {
                const k = matches[i];
                if (!KeybindingResolver._contextMatchesRules(context, k.when)) {
                    continue;
                }
                return k;
            }
            return null;
        }
        static _contextMatchesRules(context, rules) {
            if (!rules) {
                return true;
            }
            return rules.evaluate(context);
        }
    }
    exports.KeybindingResolver = KeybindingResolver;
    function printWhenExplanation(when) {
        if (!when) {
            return `no when condition`;
        }
        return `${when.serialize()}`;
    }
    function printSourceExplanation(kb) {
        return (kb.extensionId
            ? (kb.isBuiltinExtension ? `built-in extension ${kb.extensionId}` : `user extension ${kb.extensionId}`)
            : (kb.isDefault ? `built-in` : `user`));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ1Jlc29sdmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5YmluZGluZy9jb21tb24va2V5YmluZGluZ1Jlc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRywyQkFBMkI7SUFFM0IsSUFBa0IsVUFTakI7SUFURCxXQUFrQixVQUFVO1FBQzNCLGtEQUFrRDtRQUNsRCwyREFBWSxDQUFBO1FBRVosc0ZBQXNGO1FBQ3RGLG1FQUFnQixDQUFBO1FBRWhCLHlEQUF5RDtRQUN6RCxpREFBTyxDQUFBO0lBQ1IsQ0FBQyxFQVRpQixVQUFVLDBCQUFWLFVBQVUsUUFTM0I7SUFRRCxtRkFBbUY7SUFFdEUsUUFBQSxZQUFZLEdBQXFCLEVBQUUsSUFBSSxpQ0FBeUIsRUFBRSxDQUFDO0lBQ2hGLE1BQU0sZ0JBQWdCLEdBQXFCLEVBQUUsSUFBSSxxQ0FBNkIsRUFBRSxDQUFDO0lBQ2pGLFNBQVMsT0FBTyxDQUFDLFNBQXdCLEVBQUUsV0FBZ0IsRUFBRSxRQUFpQjtRQUM3RSxPQUFPLEVBQUUsSUFBSSw0QkFBb0IsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxZQUFZO0lBRVo7OztPQUdHO0lBQ0gsTUFBYSxrQkFBa0I7UUFROUI7UUFDQyxrREFBa0Q7UUFDbEQsa0JBQTRDO1FBQzVDLHlCQUF5QjtRQUN6QixTQUFtQyxFQUNuQyxHQUEwQjtZQUUxQixJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztZQUNoQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUM7WUFFOUMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO1lBQ3hELEtBQUssTUFBTSxpQkFBaUIsSUFB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