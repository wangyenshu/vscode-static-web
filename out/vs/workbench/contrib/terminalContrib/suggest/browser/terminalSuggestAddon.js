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
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/services/suggest/browser/simpleCompletionItem", "vs/workbench/services/suggest/browser/simpleCompletionModel", "vs/workbench/services/suggest/browser/simpleSuggestWidget", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/contrib/suggest/browser/suggestWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/browser/defaultStyles"], function (require, exports, dom, simpleCompletionItem_1, simpleCompletionModel_1, simpleSuggestWidget_1, codicons_1, event_1, lifecycle_1, suggestWidget_1, instantiation_1, storage_1, colorRegistry_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestAddon = void 0;
    var VSCodeOscPt;
    (function (VSCodeOscPt) {
        VSCodeOscPt["Completions"] = "Completions";
        VSCodeOscPt["CompletionsBash"] = "CompletionsBash";
        VSCodeOscPt["CompletionsBashFirstWord"] = "CompletionsBashFirstWord";
    })(VSCodeOscPt || (VSCodeOscPt = {}));
    /**
     * A map of the pwsh result type enum's value to the corresponding icon to use in completions.
     *
     * | Value | Name              | Description
     * |-------|-------------------|------------
     * | 0     | Text              | An unknown result type, kept as text only
     * | 1     | History           | A history result type like the items out of get-history
     * | 2     | Command           | A command result type like the items out of get-command
     * | 3     | ProviderItem      | A provider item
     * | 4     | ProviderContainer | A provider container
     * | 5     | Property          | A property result type like the property items out of get-member
     * | 6     | Method            | A method result type like the method items out of get-member
     * | 7     | ParameterName     | A parameter name result type like the Parameters property out of get-command items
     * | 8     | ParameterValue    | A parameter value result type
     * | 9     | Variable          | A variable result type like the items out of get-childitem variable:
     * | 10    | Namespace         | A namespace
     * | 11    | Type              | A type name
     * | 12    | Keyword           | A keyword
     * | 13    | DynamicKeyword    | A dynamic keyword
     *
     * @see https://docs.microsoft.com/en-us/dotnet/api/system.management.automation.completionresulttype?view=powershellsdk-7.0.0
     */
    const pwshTypeToIconMap = {
        0: codicons_1.Codicon.symbolText,
        1: codicons_1.Codicon.history,
        2: codicons_1.Codicon.symbolMethod,
        3: codicons_1.Codicon.symbolFile,
        4: codicons_1.Codicon.folder,
        5: codicons_1.Codicon.symbolProperty,
        6: codicons_1.Codicon.symbolMethod,
        7: codicons_1.Codicon.symbolVariable,
        8: codicons_1.Codicon.symbolValue,
        9: codicons_1.Codicon.symbolVariable,
        10: codicons_1.Codicon.symbolNamespace,
        11: codicons_1.Codicon.symbolInterface,
        12: codicons_1.Codicon.symbolKeyword,
        13: codicons_1.Codicon.symbolKeyword
    };
    let SuggestAddon = class SuggestAddon extends lifecycle_1.Disposable {
        constructor(_capabilities, _terminalSuggestWidgetVisibleContextKey, _instantiationService) {
            super();
            this._capabilities = _capabilities;
            this._terminalSuggestWidgetVisibleContextKey = _terminalSuggestWidgetVisibleContextKey;
            this._instantiationService = _instantiationService;
            this._promptInputModelSubscriptions = this._register(new lifecycle_1.MutableDisposable());
            this._enableWidget = true;
            this._cursorIndexDelta = 0;
            this._onBell = this._register(new event_1.Emitter());
            this.onBell = this._onBell.event;
            this._onAcceptedCompletion = this._register(new event_1.Emitter());
            this.onAcceptedCompletion = this._onAcceptedCompletion.event;
            // TODO: These aren't persisted across reloads
            // TODO: Allow triggering anywhere in the first word based on the cached completions
            this._cachedBashAliases = new Set();
            this._cachedBashBuiltins = new Set();
            this._cachedBashCommands = new Set();
            this._cachedBashKeywords = new Set();
            this._register(event_1.Event.runAndSubscribe(event_1.Event.any(this._capabilities.onDidAddCapabilityType, this._capabilities.onDidRemoveCapabilityType), () => {
                const commandDetection = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
                if (commandDetection) {
                    if (this._promptInputModel !== commandDetection.promptInputModel) {
                        this._promptInputModel = commandDetection.promptInputModel;
                        this._promptInputModelSubscriptions.value = (0, lifecycle_1.combinedDisposable)(this._promptInputModel.onDidChangeInput(e => this._sync(e)), this._promptInputModel.onDidFinishInput(() => this.hideSuggestWidget()));
                    }
                }
                else {
                    this._promptInputModel = undefined;
                }
            }));
        }
        activate(xterm) {
            this._terminal = xterm;
            this._register(xterm.parser.registerOscHandler(633 /* ShellIntegrationOscPs.VSCode */, data => {
                return this._handleVSCodeSequence(data);
            }));
        }
        setPanel(panel) {
            this._panel = panel;
        }
        setScreen(screen) {
            this._screen = screen;
        }
        _sync(promptInputState) {
            this._mostRecentPromptInputState = promptInputState;
            if (!this._promptInputModel || !this._terminal || !this._suggestWidget || !this._initialPromptInputState) {
                return;
            }
            this._currentPromptInputState = promptInputState;
            // Hide the widget if the cursor moves to the left of the initial position as the
            // completions are no longer valid
            if (this._currentPromptInputState.cursorIndex < this._initialPromptInputState.cursorIndex) {
                this.hideSuggestWidget();
                return;
            }
            if (this._terminalSuggestWidgetVisibleContextKey.get()) {
                const inputBeforeCursor = this._currentPromptInputState.value.substring(0, this._currentPromptInputState.cursorIndex);
                this._cursorIndexDelta = this._currentPromptInputState.cursorIndex - this._initialPromptInputState.cursorIndex;
                this._suggestWidget.setLineContext(new simpleCompletionModel_1.LineContext(inputBeforeCursor, this._cursorIndexDelta));
            }
            // Hide and clear model if there are no more items
            if (!this._suggestWidget.hasCompletions()) {
                this.hideSuggestWidget();
                // TODO: Don't request every time; refine completions
                // this._onAcceptedCompletion.fire('\x1b[24~e');
                return;
            }
            // TODO: Expose on xterm.js
            const dimensions = this._getTerminalDimensions();
            if (!dimensions.width || !dimensions.height) {
                return;
            }
            // TODO: What do frozen and auto do?
            const xtermBox = this._screen.getBoundingClientRect();
            const panelBox = this._panel.offsetParent.getBoundingClientRect();
            this._suggestWidget.showSuggestions(0, false, false, {
                left: (xtermBox.left - panelBox.left) + this._terminal.buffer.active.cursorX * dimensions.width,
                top: (xtermBox.top - panelBox.top) + this._terminal.buffer.active.cursorY * dimensions.height,
                height: dimensions.height
            });
        }
        _handleVSCodeSequence(data) {
            if (!this._terminal) {
                return false;
            }
            // Pass the sequence along to the capability
            const [command, ...args] = data.split(';');
            switch (command) {
                case "Completions" /* VSCodeOscPt.Completions */:
                    this._handleCompletionsSequence(this._terminal, data, command, args);
                    return true;
                case "CompletionsBash" /* VSCodeOscPt.CompletionsBash */:
                    this._handleCompletionsBashSequence(this._terminal, data, command, args);
                    return true;
                case "CompletionsBashFirstWord" /* VSCodeOscPt.CompletionsBashFirstWord */:
                    return this._handleCompletionsBashFirstWordSequence(this._terminal, data, command, args);
            }
            // Unrecognized sequence
            return false;
        }
        _handleCompletionsSequence(terminal, data, command, args) {
            // Nothing to handle if the terminal is not attached
            if (!terminal.element || !this._enableWidget) {
                return;
            }
            const replacementIndex = parseInt(args[0]);
            const replacementLength = parseInt(args[1]);
            if (!args[3]) {
                this._onBell.fire();
                return;
            }
            let completionList = JSON.parse(data.slice(command.length + args[0].length + args[1].length + args[2].length + 4 /*semi-colons*/));
            if (!Array.isArray(completionList)) {
                completionList = [completionList];
            }
            const completions = completionList.map((e) => {
                return new simpleCompletionItem_1.SimpleCompletionItem({
                    label: e.CompletionText,
                    icon: pwshTypeToIconMap[e.ResultType],
                    detail: e.ToolTip
                });
            });
            this._leadingLineContent = completions[0].completion.label.slice(0, replacementLength);
            this._cursorIndexDelta = 0;
            const model = new simpleCompletionModel_1.SimpleCompletionModel(completions, new simpleCompletionModel_1.LineContext(this._leadingLineContent, replacementIndex), replacementIndex, replacementLength);
            if (completions.length === 1) {
                const insertText = completions[0].completion.label.substring(replacementLength);
                if (insertText.length === 0) {
                    this._onBell.fire();
                    return;
                }
            }
            this._handleCompletionModel(model);
        }
        _handleCompletionsBashFirstWordSequence(terminal, data, command, args) {
            const type = args[0];
            const completionList = data.slice(command.length + type.length + 2 /*semi-colons*/).split(';');
            let set;
            switch (type) {
                case 'alias':
                    set = this._cachedBashAliases;
                    break;
                case 'builtin':
                    set = this._cachedBashBuiltins;
                    break;
                case 'command':
                    set = this._cachedBashCommands;
                    break;
                case 'keyword':
                    set = this._cachedBashKeywords;
                    break;
                default: return false;
            }
            set.clear();
            const distinctLabels = new Set();
            for (const label of completionList) {
                distinctLabels.add(label);
            }
            for (const label of distinctLabels) {
                set.add(new simpleCompletionItem_1.SimpleCompletionItem({
                    label,
                    icon: codicons_1.Codicon.symbolString,
                    detail: type
                }));
            }
            // Invalidate compound list cache
            this._cachedFirstWord = undefined;
            return true;
        }
        _handleCompletionsBashSequence(terminal, data, command, args) {
            // Nothing to handle if the terminal is not attached
            if (!terminal.element) {
                return;
            }
            let replacementIndex = parseInt(args[0]);
            const replacementLength = parseInt(args[1]);
            if (!args[2]) {
                this._onBell.fire();
                return;
            }
            const completionList = data.slice(command.length + args[0].length + args[1].length + args[2].length + 4 /*semi-colons*/).split(';');
            // TODO: Create a trigger suggest command which encapsulates sendSequence and uses cached if available
            let completions;
            // TODO: This 100 is a hack just for the prototype, this should get it based on some terminal input model
            if (replacementIndex !== 100 && completionList.length > 0) {
                completions = completionList.map(label => {
                    return new simpleCompletionItem_1.SimpleCompletionItem({
                        label: label,
                        icon: codicons_1.Codicon.symbolProperty
                    });
                });
            }
            else {
                replacementIndex = 0;
                if (!this._cachedFirstWord) {
                    this._cachedFirstWord = [
                        ...this._cachedBashAliases,
                        ...this._cachedBashBuiltins,
                        ...this._cachedBashCommands,
                        ...this._cachedBashKeywords
                    ];
                    this._cachedFirstWord.sort((a, b) => {
                        const aCode = a.completion.label.charCodeAt(0);
                        const bCode = b.completion.label.charCodeAt(0);
                        const isANonAlpha = aCode < 65 || aCode > 90 && aCode < 97 || aCode > 122 ? 1 : 0;
                        const isBNonAlpha = bCode < 65 || bCode > 90 && bCode < 97 || bCode > 122 ? 1 : 0;
                        if (isANonAlpha !== isBNonAlpha) {
                            return isANonAlpha - isBNonAlpha;
                        }
                        return a.completion.label.localeCompare(b.completion.label);
                    });
                }
                completions = this._cachedFirstWord;
            }
            if (completions.length === 0) {
                return;
            }
            this._leadingLineContent = completions[0].completion.label.slice(0, replacementLength);
            const model = new simpleCompletionModel_1.SimpleCompletionModel(completions, new simpleCompletionModel_1.LineContext(this._leadingLineContent, replacementIndex), replacementIndex, replacementLength);
            if (completions.length === 1) {
                const insertText = completions[0].completion.label.substring(replacementLength);
                if (insertText.length === 0) {
                    this._onBell.fire();
                    return;
                }
            }
            this._handleCompletionModel(model);
        }
        _getTerminalDimensions() {
            return {
                width: this._terminal._core._renderService.dimensions.css.cell.width,
                height: this._terminal._core._renderService.dimensions.css.cell.height,
            };
        }
        _handleCompletionModel(model) {
            if (model.items.length === 0 || !this._terminal?.element || !this._promptInputModel) {
                return;
            }
            const suggestWidget = this._ensureSuggestWidget(this._terminal);
            const dimensions = this._getTerminalDimensions();
            if (!dimensions.width || !dimensions.height) {
                return;
            }
            // TODO: What do frozen and auto do?
            const xtermBox = this._screen.getBoundingClientRect();
            const panelBox = this._panel.offsetParent.getBoundingClientRect();
            this._initialPromptInputState = {
                value: this._promptInputModel.value,
                cursorIndex: this._promptInputModel.cursorIndex,
                ghostTextIndex: this._promptInputModel.ghostTextIndex
            };
            suggestWidget.setCompletionModel(model);
            suggestWidget.showSuggestions(0, false, false, {
                left: (xtermBox.left - panelBox.left) + this._terminal.buffer.active.cursorX * dimensions.width,
                top: (xtermBox.top - panelBox.top) + this._terminal.buffer.active.cursorY * dimensions.height,
                height: dimensions.height
            });
        }
        _ensureSuggestWidget(terminal) {
            this._terminalSuggestWidgetVisibleContextKey.set(true);
            if (!this._suggestWidget) {
                this._suggestWidget = this._register(this._instantiationService.createInstance(simpleSuggestWidget_1.SimpleSuggestWidget, this._panel, this._instantiationService.createInstance(PersistedWidgetSize), {}));
                this._suggestWidget.list.style((0, defaultStyles_1.getListStyles)({
                    listInactiveFocusBackground: suggestWidget_1.editorSuggestWidgetSelectedBackground,
                    listInactiveFocusOutline: colorRegistry_1.activeContrastBorder
                }));
                this._suggestWidget.onDidSelect(async (e) => this.acceptSelectedSuggestion(e));
                this._suggestWidget.onDidHide(() => this._terminalSuggestWidgetVisibleContextKey.set(false));
                this._suggestWidget.onDidShow(() => {
                    this._initialPromptInputState = {
                        value: this._promptInputModel.value,
                        cursorIndex: this._promptInputModel.cursorIndex,
                        ghostTextIndex: this._promptInputModel.ghostTextIndex
                    };
                    this._terminalSuggestWidgetVisibleContextKey.set(true);
                });
            }
            return this._suggestWidget;
        }
        selectPreviousSuggestion() {
            this._suggestWidget?.selectPrevious();
        }
        selectPreviousPageSuggestion() {
            this._suggestWidget?.selectPreviousPage();
        }
        selectNextSuggestion() {
            this._suggestWidget?.selectNext();
        }
        selectNextPageSuggestion() {
            this._suggestWidget?.selectNextPage();
        }
        acceptSelectedSuggestion(suggestion) {
            if (!suggestion) {
                suggestion = this._suggestWidget?.getFocusedItem();
            }
            const initialPromptInputState = this._initialPromptInputState ?? this._mostRecentPromptInputState;
            if (!suggestion || !initialPromptInputState) {
                return;
            }
            this._suggestWidget?.hide();
            const currentPromptInputState = this._currentPromptInputState ?? initialPromptInputState;
            const additionalInput = currentPromptInputState.value.substring(initialPromptInputState.cursorIndex, currentPromptInputState.cursorIndex);
            // Get the final completion on the right side of the cursor
            const initialInput = initialPromptInputState.value.substring(0, initialPromptInputState.cursorIndex);
            const lastSpaceIndex = initialInput.lastIndexOf(' ');
            const finalCompletionRightSide = suggestion.item.completion.label.substring(initialPromptInputState.cursorIndex - (lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1));
            // Get the final completion on the right side of the cursor if it differs from the initial
            // propmt input state
            let finalCompletionLeftSide = suggestion.item.completion.label.substring(0, initialPromptInputState.cursorIndex - (lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1));
            if (initialInput.endsWith(finalCompletionLeftSide)) {
                finalCompletionLeftSide = '';
            }
            // Send the completion
            this._onAcceptedCompletion.fire([
                // Disable suggestions
                '\x1b[24~y',
                // Backspace to remove all additional input
                '\x7F'.repeat(additionalInput.length),
                // Backspace to remove left side of completion
                '\x7F'.repeat(finalCompletionLeftSide.length),
                // Write the left side of the completion if it differed
                finalCompletionLeftSide,
                // Write the completion
                finalCompletionRightSide,
                // Enable suggestions
                '\x1b[24~z',
            ].join(''));
            this.hideSuggestWidget();
        }
        hideSuggestWidget() {
            this._initialPromptInputState = undefined;
            this._currentPromptInputState = undefined;
            this._suggestWidget?.hide();
        }
    };
    exports.SuggestAddon = SuggestAddon;
    exports.SuggestAddon = SuggestAddon = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], SuggestAddon);
    let PersistedWidgetSize = class PersistedWidgetSize {
        constructor(_storageService) {
            this._storageService = _storageService;
            this._key = "terminal.integrated.suggestSize" /* TerminalStorageKeys.TerminalSuggestSize */;
        }
        restore() {
            const raw = this._storageService.get(this._key, 0 /* StorageScope.PROFILE */) ?? '';
            try {
                const obj = JSON.parse(raw);
                if (dom.Dimension.is(obj)) {
                    return dom.Dimension.lift(obj);
                }
            }
            catch {
                // ignore
            }
            return undefined;
        }
        store(size) {
            this._storageService.store(this._key, JSON.stringify(size), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        reset() {
            this._storageService.remove(this._key, 0 /* StorageScope.PROFILE */);
        }
    };
    PersistedWidgetSize = __decorate([
        __param(0, storage_1.IStorageService)
    ], PersistedWidgetSize);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdWdnZXN0QWRkb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3Rlcm1pbmFsU3VnZ2VzdEFkZG9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCaEcsSUFBVyxXQUlWO0lBSkQsV0FBVyxXQUFXO1FBQ3JCLDBDQUEyQixDQUFBO1FBQzNCLGtEQUFtQyxDQUFBO1FBQ25DLG9FQUFxRCxDQUFBO0lBQ3RELENBQUMsRUFKVSxXQUFXLEtBQVgsV0FBVyxRQUlyQjtJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FxQkc7SUFDSCxNQUFNLGlCQUFpQixHQUE4QztRQUNwRSxDQUFDLEVBQUUsa0JBQU8sQ0FBQyxVQUFVO1FBQ3JCLENBQUMsRUFBRSxrQkFBTyxDQUFDLE9BQU87UUFDbEIsQ0FBQyxFQUFFLGtCQUFPLENBQUMsWUFBWTtRQUN2QixDQUFDLEVBQUUsa0JBQU8sQ0FBQyxVQUFVO1FBQ3JCLENBQUMsRUFBRSxrQkFBTyxDQUFDLE1BQU07UUFDakIsQ0FBQyxFQUFFLGtCQUFPLENBQUMsY0FBYztRQUN6QixDQUFDLEVBQUUsa0JBQU8sQ0FBQyxZQUFZO1FBQ3ZCLENBQUMsRUFBRSxrQkFBTyxDQUFDLGNBQWM7UUFDekIsQ0FBQyxFQUFFLGtCQUFPLENBQUMsV0FBVztRQUN0QixDQUFDLEVBQUUsa0JBQU8sQ0FBQyxjQUFjO1FBQ3pCLEVBQUUsRUFBRSxrQkFBTyxDQUFDLGVBQWU7UUFDM0IsRUFBRSxFQUFFLGtCQUFPLENBQUMsZUFBZTtRQUMzQixFQUFFLEVBQUUsa0JBQU8sQ0FBQyxhQUFhO1FBQ3pCLEVBQUUsRUFBRSxrQkFBTyxDQUFDLGFBQWE7S0FDekIsQ0FBQztJ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