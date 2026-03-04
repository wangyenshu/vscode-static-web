/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/config/fontMeasurements", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/services/webWorker", "vs/editor/common/config/editorOptions", "vs/editor/common/config/editorZoom", "vs/editor/common/config/fontInfo", "vs/editor/common/editorCommon", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/model", "vs/editor/common/services/model", "vs/editor/common/standalone/standaloneEnums", "vs/editor/standalone/browser/colorizer", "vs/editor/standalone/browser/standaloneCodeEditor", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/standaloneTheme", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/markers/common/markers", "vs/platform/opener/common/opener", "vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidget", "vs/css!./standalone-tokens"], function (require, exports, window_1, lifecycle_1, strings_1, uri_1, fontMeasurements_1, editorExtensions_1, codeEditorService_1, webWorker_1, editorOptions_1, editorZoom_1, fontInfo_1, editorCommon_1, languages, language_1, languageConfigurationRegistry_1, modesRegistry_1, nullTokenize_1, model_1, model_2, standaloneEnums, colorizer_1, standaloneCodeEditor_1, standaloneServices_1, standaloneTheme_1, actions_1, commands_1, contextkey_1, keybinding_1, markers_1, opener_1, multiDiffEditorWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = create;
    exports.onDidCreateEditor = onDidCreateEditor;
    exports.onDidCreateDiffEditor = onDidCreateDiffEditor;
    exports.getEditors = getEditors;
    exports.getDiffEditors = getDiffEditors;
    exports.createDiffEditor = createDiffEditor;
    exports.createMultiFileDiffEditor = createMultiFileDiffEditor;
    exports.addCommand = addCommand;
    exports.addEditorAction = addEditorAction;
    exports.addKeybindingRule = addKeybindingRule;
    exports.addKeybindingRules = addKeybindingRules;
    exports.createModel = createModel;
    exports.setModelLanguage = setModelLanguage;
    exports.setModelMarkers = setModelMarkers;
    exports.removeAllMarkers = removeAllMarkers;
    exports.getModelMarkers = getModelMarkers;
    exports.onDidChangeMarkers = onDidChangeMarkers;
    exports.getModel = getModel;
    exports.getModels = getModels;
    exports.onDidCreateModel = onDidCreateModel;
    exports.onWillDisposeModel = onWillDisposeModel;
    exports.onDidChangeModelLanguage = onDidChangeModelLanguage;
    exports.createWebWorker = createWebWorker;
    exports.colorizeElement = colorizeElement;
    exports.colorize = colorize;
    exports.colorizeModelLine = colorizeModelLine;
    exports.tokenize = tokenize;
    exports.defineTheme = defineTheme;
    exports.setTheme = setTheme;
    exports.remeasureFonts = remeasureFonts;
    exports.registerCommand = registerCommand;
    exports.registerLinkOpener = registerLinkOpener;
    exports.registerEditorOpener = registerEditorOpener;
    exports.createMonacoEditorAPI = createMonacoEditorAPI;
    /**
     * Create a new editor under `domElement`.
     * `domElement` should be empty (not contain other dom nodes).
     * The editor will read the size of `domElement`.
     */
    function create(domElement, options, override) {
        const instantiationService = standaloneServices_1.StandaloneServices.initialize(override || {});
        return instantiationService.createInstance(standaloneCodeEditor_1.StandaloneEditor, domElement, options);
    }
    /**
     * Emitted when an editor is created.
     * Creating a diff editor might cause this listener to be invoked with the two editors.
     * @event
     */
    function onDidCreateEditor(listener) {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.onCodeEditorAdd((editor) => {
            listener(editor);
        });
    }
    /**
     * Emitted when an diff editor is created.
     * @event
     */
    function onDidCreateDiffEditor(listener) {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.onDiffEditorAdd((editor) => {
            listener(editor);
        });
    }
    /**
     * Get all the created editors.
     */
    function getEditors() {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.listCodeEditors();
    }
    /**
     * Get all the created diff editors.
     */
    function getDiffEditors() {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.listDiffEditors();
    }
    /**
     * Create a new diff editor under `domElement`.
     * `domElement` should be empty (not contain other dom nodes).
     * The editor will read the size of `domElement`.
     */
    function createDiffEditor(domElement, options, override) {
        const instantiationService = standaloneServices_1.StandaloneServices.initialize(override || {});
        return instantiationService.createInstance(standaloneCodeEditor_1.StandaloneDiffEditor2, domElement, options);
    }
    function createMultiFileDiffEditor(domElement, override) {
        const instantiationService = standaloneServices_1.StandaloneServices.initialize(override || {});
        return new multiDiffEditorWidget_1.MultiDiffEditorWidget(domElement, {}, instantiationService);
    }
    /**
     * Add a command.
     */
    function addCommand(descriptor) {
        if ((typeof descriptor.id !== 'string') || (typeof descriptor.run !== 'function')) {
            throw new Error('Invalid command descriptor, `id` and `run` are required properties!');
        }
        return commands_1.CommandsRegistry.registerCommand(descriptor.id, descriptor.run);
    }
    /**
     * Add an action to all editors.
     */
    function addEditorAction(descriptor) {
        if ((typeof descriptor.id !== 'string') || (typeof descriptor.label !== 'string') || (typeof descriptor.run !== 'function')) {
            throw new Error('Invalid action descriptor, `id`, `label` and `run` are required properties!');
        }
        const precondition = contextkey_1.ContextKeyExpr.deserialize(descriptor.precondition);
        const run = (accessor, ...args) => {
            return editorExtensions_1.EditorCommand.runEditorCommand(accessor, args, precondition, (accessor, editor, args) => Promise.resolve(descriptor.run(editor, ...args)));
        };
        const toDispose = new lifecycle_1.DisposableStore();
        // Register the command
        toDispose.add(commands_1.CommandsRegistry.registerCommand(descriptor.id, run));
        // Register the context menu item
        if (descriptor.contextMenuGroupId) {
            const menuItem = {
                command: {
                    id: descriptor.id,
                    title: descriptor.label
                },
                when: precondition,
                group: descriptor.contextMenuGroupId,
                order: descriptor.contextMenuOrder || 0
            };
            toDispose.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, menuItem));
        }
        // Register the keybindings
        if (Array.isArray(descriptor.keybindings)) {
            const keybindingService = standaloneServices_1.StandaloneServices.get(keybinding_1.IKeybindingService);
            if (!(keybindingService instanceof standaloneServices_1.StandaloneKeybindingService)) {
                console.warn('Cannot add keybinding because the editor is configured with an unrecognized KeybindingService');
            }
            else {
                const keybindingsWhen = contextkey_1.ContextKeyExpr.and(precondition, contextkey_1.ContextKeyExpr.deserialize(descriptor.keybindingContext));
                toDispose.add(keybindingService.addDynamicKeybindings(descriptor.keybindings.map((keybinding) => {
                    return {
                        keybinding,
                        command: descriptor.id,
                        when: keybindingsWhen
                    };
                })));
            }
        }
        return toDispose;
    }
    /**
     * Add a keybinding rule.
     */
    function addKeybindingRule(rule) {
        return addKeybindingRules([rule]);
    }
    /**
     * Add keybinding rules.
     */
    function addKeybindingRules(rules) {
        const keybindingService = standaloneServices_1.StandaloneServices.get(keybinding_1.IKeybindingService);
        if (!(keybindingService instanceof standaloneServices_1.StandaloneKeybindingService)) {
            console.warn('Cannot add keybinding because the editor is configured with an unrecognized KeybindingService');
            return lifecycle_1.Disposable.None;
        }
        return keybindingService.addDynamicKeybindings(rules.map((rule) => {
            return {
                keybinding: rule.keybinding,
                command: rule.command,
                commandArgs: rule.commandArgs,
                when: contextkey_1.ContextKeyExpr.deserialize(rule.when),
            };
        }));
    }
    /**
     * Create a new editor model.
     * You can specify the language that should be set for this model or let the language be inferred from the `uri`.
     */
    function createModel(value, language, uri) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const languageId = languageService.getLanguageIdByMimeType(language) || language;
        return (0, standaloneCodeEditor_1.createTextModel)(standaloneServices_1.StandaloneServices.get(model_2.IModelService), languageService, value, languageId, uri);
    }
    /**
     * Change the language for a model.
     */
    function setModelLanguage(model, mimeTypeOrLanguageId) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const languageId = languageService.getLanguageIdByMimeType(mimeTypeOrLanguageId) || mimeTypeOrLanguageId || modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
        model.setLanguage(languageService.createById(languageId));
    }
    /**
     * Set the markers for a model.
     */
    function setModelMarkers(model, owner, markers) {
        if (model) {
            const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
            markerService.changeOne(owner, model.uri, markers);
        }
    }
    /**
     * Remove all markers of an owner.
     */
    function removeAllMarkers(owner) {
        const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
        markerService.changeAll(owner, []);
    }
    /**
     * Get markers for owner and/or resource
     *
     * @returns list of markers
     */
    function getModelMarkers(filter) {
        const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
        return markerService.read(filter);
    }
    /**
     * Emitted when markers change for a model.
     * @event
     */
    function onDidChangeMarkers(listener) {
        const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
        return markerService.onMarkerChanged(listener);
    }
    /**
     * Get the model that has `uri` if it exists.
     */
    function getModel(uri) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.getModel(uri);
    }
    /**
     * Get all the created models.
     */
    function getModels() {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.getModels();
    }
    /**
     * Emitted when a model is created.
     * @event
     */
    function onDidCreateModel(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelAdded(listener);
    }
    /**
     * Emitted right before a model is disposed.
     * @event
     */
    function onWillDisposeModel(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelRemoved(listener);
    }
    /**
     * Emitted when a different language is set to a model.
     * @event
     */
    function onDidChangeModelLanguage(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelLanguageChanged((e) => {
            listener({
                model: e.model,
                oldLanguage: e.oldLanguageId
            });
        });
    }
    /**
     * Create a new web worker that has model syncing capabilities built in.
     * Specify an AMD module to load that will `create` an object that will be proxied.
     */
    function createWebWorker(opts) {
        return (0, webWorker_1.createWebWorker)(standaloneServices_1.StandaloneServices.get(model_2.IModelService), standaloneServices_1.StandaloneServices.get(languageConfigurationRegistry_1.ILanguageConfigurationService), opts);
    }
    /**
     * Colorize the contents of `domNode` using attribute `data-lang`.
     */
    function colorizeElement(domNode, options) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        return colorizer_1.Colorizer.colorizeElement(themeService, languageService, domNode, options).then(() => {
            themeService.registerEditorContainer(domNode);
        });
    }
    /**
     * Colorize `text` using language `languageId`.
     */
    function colorize(text, languageId, options) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        themeService.registerEditorContainer(window_1.mainWindow.document.body);
        return colorizer_1.Colorizer.colorize(languageService, text, languageId, options);
    }
    /**
     * Colorize a line in a model.
     */
    function colorizeModelLine(model, lineNumber, tabSize = 4) {
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        themeService.registerEditorContainer(window_1.mainWindow.document.body);
        return colorizer_1.Colorizer.colorizeModelLine(model, lineNumber, tabSize);
    }
    /**
     * @internal
     */
    function getSafeTokenizationSupport(language) {
        const tokenizationSupport = languages.TokenizationRegistry.get(language);
        if (tokenizationSupport) {
            return tokenizationSupport;
        }
        return {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenize)(language, state)
        };
    }
    /**
     * Tokenize `text` using language `languageId`
     */
    function tokenize(text, languageId) {
        // Needed in order to get the mode registered for subsequent look-ups
        languages.TokenizationRegistry.getOrCreate(languageId);
        const tokenizationSupport = getSafeTokenizationSupport(languageId);
        const lines = (0, strings_1.splitLines)(text);
        const result = [];
        let state = tokenizationSupport.getInitialState();
        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i];
            const tokenizationResult = tokenizationSupport.tokenize(line, true, state);
            result[i] = tokenizationResult.tokens;
            state = tokenizationResult.endState;
        }
        return result;
    }
    /**
     * Define a new theme or update an existing theme.
     */
    function defineTheme(themeName, themeData) {
        const standaloneThemeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        standaloneThemeService.defineTheme(themeName, themeData);
    }
    /**
     * Switches to a theme.
     */
    function setTheme(themeName) {
        const standaloneThemeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        standaloneThemeService.setTheme(themeName);
    }
    /**
     * Clears all cached font measurements and triggers re-measurement.
     */
    function remeasureFonts() {
        fontMeasurements_1.FontMeasurements.clearAllFontInfos();
    }
    /**
     * Register a command.
     */
    function registerCommand(id, handler) {
        return commands_1.CommandsRegistry.registerCommand({ id, handler });
    }
    /**
     * Registers a handler that is called when a link is opened in any editor. The handler callback should return `true` if the link was handled and `false` otherwise.
     * The handler that was registered last will be called first when a link is opened.
     *
     * Returns a disposable that can unregister the opener again.
     */
    function registerLinkOpener(opener) {
        const openerService = standaloneServices_1.StandaloneServices.get(opener_1.IOpenerService);
        return openerService.registerOpener({
            async open(resource) {
                if (typeof resource === 'string') {
                    resource = uri_1.URI.parse(resource);
                }
                return opener.open(resource);
            }
        });
    }
    /**
     * Registers a handler that is called when a resource other than the current model should be opened in the editor (e.g. "go to definition").
     * The handler callback should return `true` if the request was handled and `false` otherwise.
     *
     * Returns a disposable that can unregister the opener again.
     *
     * If no handler is registered the default behavior is to do nothing for models other than the currently attached one.
     */
    function registerEditorOpener(opener) {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.registerCodeEditorOpenHandler(async (input, source, sideBySide) => {
            if (!source) {
                return null;
            }
            const selection = input.options?.selection;
            let selectionOrPosition;
            if (selection && typeof selection.endLineNumber === 'number' && typeof selection.endColumn === 'number') {
                selectionOrPosition = selection;
            }
            else if (selection) {
                selectionOrPosition = { lineNumber: selection.startLineNumber, column: selection.startColumn };
            }
            if (await opener.openCodeEditor(source, input.resource, selectionOrPosition)) {
                return source; // return source editor to indicate that this handler has successfully handled the opening
            }
            return null; // fallback to other registered handlers
        });
    }
    /**
     * @internal
     */
    function createMonacoEditorAPI() {
        return {
            // methods
            create: create,
            getEditors: getEditors,
            getDiffEditors: getDiffEditors,
            onDidCreateEditor: onDidCreateEditor,
            onDidCreateDiffEditor: onDidCreateDiffEditor,
            createDiffEditor: createDiffEditor,
            addCommand: addCommand,
            addEditorAction: addEditorAction,
            addKeybindingRule: addKeybindingRule,
            addKeybindingRules: addKeybindingRules,
            createModel: createModel,
            setModelLanguage: setModelLanguage,
            setModelMarkers: setModelMarkers,
            getModelMarkers: getModelMarkers,
            removeAllMarkers: removeAllMarkers,
            onDidChangeMarkers: onDidChangeMarkers,
            getModels: getModels,
            getModel: getModel,
            onDidCreateModel: onDidCreateModel,
            onWillDisposeModel: onWillDisposeModel,
            onDidChangeModelLanguage: onDidChangeModelLanguage,
            createWebWorker: createWebWorker,
            colorizeElement: colorizeElement,
            colorize: colorize,
            colorizeModelLine: colorizeModelLine,
            tokenize: tokenize,
            defineTheme: defineTheme,
            setTheme: setTheme,
            remeasureFonts: remeasureFonts,
            registerCommand: registerCommand,
            registerLinkOpener: registerLinkOpener,
            registerEditorOpener: registerEditorOpener,
            // enums
            AccessibilitySupport: standaloneEnums.AccessibilitySupport,
            ContentWidgetPositionPreference: standaloneEnums.ContentWidgetPositionPreference,
            CursorChangeReason: standaloneEnums.CursorChangeReason,
            DefaultEndOfLine: standaloneEnums.DefaultEndOfLine,
            EditorAutoIndentStrategy: standaloneEnums.EditorAutoIndentStrategy,
            EditorOption: standaloneEnums.EditorOption,
            EndOfLinePreference: standaloneEnums.EndOfLinePreference,
            EndOfLineSequence: standaloneEnums.EndOfLineSequence,
            MinimapPosition: standaloneEnums.MinimapPosition,
            MinimapSectionHeaderStyle: standaloneEnums.MinimapSectionHeaderStyle,
            MouseTargetType: standaloneEnums.MouseTargetType,
            OverlayWidgetPositionPreference: standaloneEnums.OverlayWidgetPositionPreference,
            OverviewRulerLane: standaloneEnums.OverviewRulerLane,
            GlyphMarginLane: standaloneEnums.GlyphMarginLane,
            RenderLineNumbersType: standaloneEnums.RenderLineNumbersType,
            RenderMinimap: standaloneEnums.RenderMinimap,
            ScrollbarVisibility: standaloneEnums.ScrollbarVisibility,
            ScrollType: standaloneEnums.ScrollType,
            TextEditorCursorBlinkingStyle: standaloneEnums.TextEditorCursorBlinkingStyle,
            TextEditorCursorStyle: standaloneEnums.TextEditorCursorStyle,
            TrackedRangeStickiness: standaloneEnums.TrackedRangeStickiness,
            WrappingIndent: standaloneEnums.WrappingIndent,
            InjectedTextCursorStops: standaloneEnums.InjectedTextCursorStops,
            PositionAffinity: standaloneEnums.PositionAffinity,
            ShowLightbulbIconMode: standaloneEnums.ShowLightbulbIconMode,
            // classes
            ConfigurationChangedEvent: editorOptions_1.ConfigurationChangedEvent,
            BareFontInfo: fontInfo_1.BareFontInfo,
            FontInfo: fontInfo_1.FontInfo,
            TextModelResolvedOptions: model_1.TextModelResolvedOptions,
            FindMatch: model_1.FindMatch,
            ApplyUpdateResult: editorOptions_1.ApplyUpdateResult,
            EditorZoom: editorZoom_1.EditorZoom,
            createMultiFileDiffEditor: createMultiFileDiffEditor,
            // vars
            EditorType: editorCommon_1.EditorType,
            EditorOptions: editorOptions_1.EditorOptions
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2Jyb3dzZXIvc3RhbmRhbG9uZUVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTZDaEcsd0JBR0M7SUFPRCw4Q0FLQztJQU1ELHNEQUtDO0lBS0QsZ0NBR0M7SUFLRCx3Q0FHQztJQU9ELDRDQUdDO0lBRUQsOERBR0M7SUFtQkQsZ0NBS0M7SUFLRCwwQ0ErQ0M7SUFlRCw4Q0FFQztJQUtELGdEQWVDO0lBTUQsa0NBVUM7SUFLRCw0Q0FJQztJQUtELDBDQUtDO0lBS0QsNENBR0M7SUFPRCwwQ0FHQztJQU1ELGdEQUdDO0lBS0QsNEJBR0M7SUFLRCw4QkFHQztJQU1ELDRDQUdDO0lBTUQsZ0RBR0M7SUFNRCw0REFRQztJQU1ELDBDQUVDO0lBS0QsMENBTUM7SUFLRCw0QkFLQztJQUtELDhDQUlDO0lBbUJELDRCQWdCQztJQUtELGtDQUdDO0lBS0QsNEJBR0M7SUFLRCx3Q0FFQztJQUtELDBDQUVDO0lBWUQsZ0RBVUM7SUF5QkQsb0RBa0JDO0lBS0Qsc0RBb0ZDO0lBOWhCRDs7OztPQUlHO0lBQ0gsU0FBZ0IsTUFBTSxDQUFDLFVBQXVCLEVBQUUsT0FBOEMsRUFBRSxRQUFrQztRQUNqSSxNQUFNLG9CQUFvQixHQUFHLHVDQUFrQixDQUFDLFVBQVUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0UsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsdUNBQWdCLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ25GLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsUUFBMkM7UUFDNUUsTUFBTSxpQkFBaUIsR0FBRyx1Q0FBa0IsQ0FBQyxHQUFH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