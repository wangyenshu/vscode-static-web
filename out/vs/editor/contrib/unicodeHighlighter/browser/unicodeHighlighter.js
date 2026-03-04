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
define(["require", "exports", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorOptions", "vs/editor/common/model/textModel", "vs/editor/common/services/unicodeTextModelHighlighter", "vs/editor/common/services/editorWorker", "vs/editor/common/languages/language", "vs/editor/common/viewModel/viewModelDecorations", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/unicodeHighlighter/browser/bannerController", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/iconRegistry", "vs/platform/workspace/common/workspaceTrust", "vs/css!./unicodeHighlighter"], function (require, exports, async_1, codicons_1, htmlContent_1, lifecycle_1, platform, strings_1, editorExtensions_1, editorOptions_1, textModel_1, unicodeTextModelHighlighter_1, editorWorker_1, language_1, viewModelDecorations_1, hoverTypes_1, markdownHoverParticipant_1, bannerController_1, nls, configuration_1, instantiation_1, opener_1, quickInput_1, iconRegistry_1, workspaceTrust_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowExcludeOptions = exports.DisableHighlightingOfNonBasicAsciiCharactersAction = exports.DisableHighlightingOfInvisibleCharactersAction = exports.DisableHighlightingOfAmbiguousCharactersAction = exports.DisableHighlightingInStringsAction = exports.DisableHighlightingInCommentsAction = exports.UnicodeHighlighterHoverParticipant = exports.UnicodeHighlighterHover = exports.UnicodeHighlighter = exports.warningIcon = void 0;
    exports.warningIcon = (0, iconRegistry_1.registerIcon)('extensions-warning-message', codicons_1.Codicon.warning, nls.localize('warningIcon', 'Icon shown with a warning message in the extensions editor.'));
    let UnicodeHighlighter = class UnicodeHighlighter extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.unicodeHighlighter'; }
        constructor(_editor, _editorWorkerService, _workspaceTrustService, instantiationService) {
            super();
            this._editor = _editor;
            this._editorWorkerService = _editorWorkerService;
            this._workspaceTrustService = _workspaceTrustService;
            this._highlighter = null;
            this._bannerClosed = false;
            this._updateState = (state) => {
                if (state && state.hasMore) {
                    if (this._bannerClosed) {
                        return;
                    }
                    // This document contains many non-basic ASCII characters.
                    const max = Math.max(state.ambiguousCharacterCount, state.nonBasicAsciiCharacterCount, state.invisibleCharacterCount);
                    let data;
                    if (state.nonBasicAsciiCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyNonBasicAsciiUnicodeCharacters', 'This document contains many non-basic ASCII unicode characters'),
                            command: new DisableHighlightingOfNonBasicAsciiCharactersAction(),
                        };
                    }
                    else if (state.ambiguousCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyAmbiguousUnicodeCharacters', 'This document contains many ambiguous unicode characters'),
                            command: new DisableHighlightingOfAmbiguousCharactersAction(),
                        };
                    }
                    else if (state.invisibleCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyInvisibleUnicodeCharacters', 'This document contains many invisible unicode characters'),
                            command: new DisableHighlightingOfInvisibleCharactersAction(),
                        };
                    }
                    else {
                        throw new Error('Unreachable');
                    }
                    this._bannerController.show({
                        id: 'unicodeHighlightBanner',
                        message: data.message,
                        icon: exports.warningIcon,
                        actions: [
                            {
                                label: data.command.shortLabel,
                                href: `command:${data.command.id}`
                            }
                        ],
                        onClose: () => {
                            this._bannerClosed = true;
                        },
                    });
                }
                else {
                    this._bannerController.hide();
                }
            };
            this._bannerController = this._register(instantiationService.createInstance(bannerController_1.BannerController, _editor));
            this._register(this._editor.onDidChangeModel(() => {
                this._bannerClosed = false;
                this._updateHighlighter();
            }));
            this._options = _editor.getOption(125 /* EditorOption.unicodeHighlighting */);
            this._register(_workspaceTrustService.onDidChangeTrust(e => {
                this._updateHighlighter();
            }));
            this._register(_editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(125 /* EditorOption.unicodeHighlighting */)) {
                    this._options = _editor.getOption(125 /* EditorOption.unicodeHighlighting */);
                    this._updateHighlighter();
                }
            }));
            this._updateHighlighter();
        }
        dispose() {
            if (this._highlighter) {
                this._highlighter.dispose();
                this._highlighter = null;
            }
            super.dispose();
        }
        _updateHighlighter() {
            this._updateState(null);
            if (this._highlighter) {
                this._highlighter.dispose();
                this._highlighter = null;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const options = resolveOptions(this._workspaceTrustService.isWorkspaceTrusted(), this._options);
            if ([
                options.nonBasicASCII,
                options.ambiguousCharacters,
                options.invisibleCharacters,
            ].every((option) => option === false)) {
                // Don't do anything if the feature is fully disabled
                return;
            }
            const highlightOptions = {
                nonBasicASCII: options.nonBasicASCII,
                ambiguousCharacters: options.ambiguousCharacters,
                invisibleCharacters: options.invisibleCharacters,
                includeComments: options.includeComments,
                includeStrings: options.includeStrings,
                allowedCodePoints: Object.keys(options.allowedCharacters).map(c => c.codePointAt(0)),
                allowedLocales: Object.keys(options.allowedLocales).map(locale => {
                    if (locale === '_os') {
                        const osLocale = new Intl.NumberFormat().resolvedOptions().locale;
                        return osLocale;
                    }
                    else if (locale === '_vscode') {
                        return platform.language;
                    }
                    return locale;
                }),
            };
            if (this._editorWorkerService.canComputeUnicodeHighlights(this._editor.getModel().uri)) {
                this._highlighter = new DocumentUnicodeHighlighter(this._editor, highlightOptions, this._updateState, this._editorWorkerService);
            }
            else {
                this._highlighter = new ViewportUnicodeHighlighter(this._editor, highlightOptions, this._updateState);
            }
        }
        getDecorationInfo(decoration) {
            if (this._highlighter) {
                return this._highlighter.getDecorationInfo(decoration);
            }
            return null;
        }
    };
    exports.UnicodeHighlighter = UnicodeHighlighter;
    exports.UnicodeHighlighter = UnicodeHighlighter = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, instantiation_1.IInstantiationService)
    ], UnicodeHighlighter);
    function resolveOptions(trusted, options) {
        return {
            nonBasicASCII: options.nonBasicASCII === editorOptions_1.inUntrustedWorkspace ? !trusted : options.nonBasicASCII,
            ambiguousCharacters: options.ambiguousCharacters,
            invisibleCharacters: options.invisibleCharacters,
            includeComments: options.includeComments === editorOptions_1.inUntrustedWorkspace ? !trusted : options.includeComments,
            includeStrings: options.includeStrings === editorOptions_1.inUntrustedWorkspace ? !trusted : options.includeStrings,
            allowedCharacters: options.allowedCharacters,
            allowedLocales: options.allowedLocales,
        };
    }
    let DocumentUnicodeHighlighter = class DocumentUnicodeHighlighter extends lifecycle_1.Disposable {
        constructor(_editor, _options, _updateState, _editorWorkerService) {
            super();
            this._editor = _editor;
            this._options = _options;
            this._updateState = _updateState;
            this._editorWorkerService = _editorWorkerService;
            this._model = this._editor.getModel();
            this._decorations = this._editor.createDecorationsCollection();
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._update(), 250));
            this._register(this._editor.onDidChangeModelContent(() => {
                this._updateSoon.schedule();
            }));
            this._updateSoon.schedule();
        }
        dispose() {
            this._decorations.clear();
            super.dispose();
        }
        _update() {
            if (this._model.isDisposed()) {
                return;
            }
            if (!this._model.mightContainNonBasicASCII()) {
                this._decorations.clear();
                return;
            }
            const modelVersionId = this._model.getVersionId();
            this._editorWorkerService
                .computedUnicodeHighlights(this._model.uri, this._options)
                .then((info) => {
                if (this._model.isDisposed()) {
                    return;
                }
                if (this._model.getVersionId() !== modelVersionId) {
                    // model changed in the meantime
                    return;
                }
                this._updateState(info);
                const decorations = [];
                if (!info.hasMore) {
                    // Don't show decoration if there are too many.
                    // In this case, a banner is shown.
                    for (const range of info.ranges) {
                        decorations.push({
                            range: range,
                            options: Decorations.instance.getDecorationFromOptions(this._options),
                        });
                    }
                }
                this._decorations.set(decorations);
            });
        }
        getDecorationInfo(decoration) {
            if (!this._decorations.has(decoration)) {
                return null;
            }
            const model = this._editor.getModel();
            if (!(0, viewModelDecorations_1.isModelDecorationVisible)(model, decoration)) {
                return null;
            }
            const text = model.getValueInRange(decoration.range);
            return {
                reason: computeReason(text, this._options),
                inComment: (0, viewModelDecorations_1.isModelDecorationInComment)(model, decoration),
                inString: (0, viewModelDecorations_1.isModelDecorationInString)(model, decoration),
            };
        }
    };
    DocumentUnicodeHighlighter = __decorate([
        __param(3, editorWorker_1.IEditorWorkerService)
    ], DocumentUnicodeHighlighter);
    class ViewportUnicodeHighlighter extends lifecycle_1.Disposable {
        constructor(_editor, _options, _updateState) {
            super();
            this._editor = _editor;
            this._options = _options;
            this._updateState = _updateState;
            this._model = this._editor.getModel();
            this._decorations = this._editor.createDecorationsCollection();
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._update(), 250));
            this._register(this._editor.onDidLayoutChange(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidScrollChange(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidChangeHiddenAreas(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidChangeModelContent(() => {
                this._updateSoon.schedule();
            }));
            this._updateSoon.schedule();
        }
        dispose() {
            this._decorations.clear();
            super.dispose();
        }
        _update() {
            if (this._model.isDisposed()) {
                return;
            }
            if (!this._model.mightContainNonBasicASCII()) {
                this._decorations.clear();
                return;
            }
            const ranges = this._editor.getVisibleRanges();
            const decorations = [];
            const totalResult = {
                ranges: [],
                ambiguousCharacterCount: 0,
                invisibleCharacterCount: 0,
                nonBasicAsciiCharacterCount: 0,
                hasMore: false,
            };
            for (const range of ranges) {
                const result = unicodeTextModelHighlighter_1.UnicodeTextModelHighlighter.computeUnicodeHighlights(this._model, this._options, range);
                for (const r of result.ranges) {
                    totalResult.ranges.push(r);
                }
                totalResult.ambiguousCharacterCount += totalResult.ambiguousCharacterCount;
                totalResult.invisibleCharacterCount += totalResult.invisibleCharacterCount;
                totalResult.nonBasicAsciiCharacterCount += totalResult.nonBasicAsciiCharacterCount;
                totalResult.hasMore = totalResult.hasMore || result.hasMore;
            }
            if (!totalResult.hasMore) {
                // Don't show decorations if there are too many.
                // A banner will be shown instead.
                for (const range of totalResult.ranges) {
                    decorations.push({ range, options: Decorations.instance.getDecorationFromOptions(this._options) });
                }
            }
            this._updateState(totalResult);
            this._decorations.set(decorations);
        }
        getDecorationInfo(decoration) {
            if (!this._decorations.has(decoration)) {
                return null;
            }
            const model = this._editor.getModel();
            const text = model.getValueInRange(decoration.range);
            if (!(0, viewModelDecorations_1.isModelDecorationVisible)(model, decoration)) {
                return null;
            }
            return {
                reason: computeReason(text, this._options),
                inComment: (0, viewModelDecorations_1.isModelDecorationInComment)(model, decoration),
                inString: (0, viewModelDecorations_1.isModelDecorationInString)(model, decoration),
            };
        }
    }
    class UnicodeHighlighterHover {
        constructor(owner, range, decoration) {
            this.owner = owner;
            this.range = range;
            this.decoration = decoration;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.UnicodeHighlighterHover = UnicodeHighlighterHover;
    const configureUnicodeHighlightOptionsStr = nls.localize('unicodeHighlight.configureUnicodeHighlightOptions', 'Configure Unicode Highlight Options');
    let UnicodeHighlighterHoverParticipant = class UnicodeHighlighterHoverParticipant {
        constructor(_editor, _languageService, _openerService) {
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this.hoverOrdinal = 5;
        }
        computeSync(anchor, lineDecorations) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return [];
            }
            const model = this._editor.getModel();
            const unicodeHighlighter = this._editor.getContribution(UnicodeHighlighter.ID);
            if (!unicodeHighlighter) {
                return [];
            }
            const result = [];
            const existedReason = new Set();
            let index = 300;
            for (const d of lineDecorations) {
                const highlightInfo = unicodeHighlighter.getDecorationInfo(d);
                if (!highlightInfo) {
                    continue;
                }
                const char = model.getValueInRange(d.range);
                // text refers to a single character.
                const codePoint = char.codePointAt(0);
                const codePointStr = formatCodePointMarkdown(codePoint);
                let reason;
                switch (highlightInfo.reason.kind) {
                    case 0 /* UnicodeHighlighterReasonKind.Ambiguous */: {
                        if ((0, strings_1.isBasicASCII)(highlightInfo.reason.confusableWith)) {
                            reason = nls.localize('unicodeHighlight.characterIsAmbiguousASCII', 'The character {0} could be confused with the ASCII character {1}, which is more common in source code.', codePointStr, formatCodePointMarkdown(highlightInfo.reason.confusableWith.codePointAt(0)));
                        }
                        else {
                            reason = nls.localize('unicodeHighlight.characterIsAmbiguous', 'The character {0} could be confused with the character {1}, which is more common in source code.', codePointStr, formatCodePointMarkdown(highlightInfo.reason.confusableWith.codePointAt(0)));
                        }
                        break;
                    }
                    case 1 /* UnicodeHighlighterReasonKind.Invisible */:
                        reason = nls.localize('unicodeHighlight.characterIsInvisible', 'The character {0} is invisible.', codePointStr);
                        break;
                    case 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */:
                        reason = nls.localize('unicodeHighlight.characterIsNonBasicAscii', 'The character {0} is not a basic ASCII character.', codePointStr);
                        break;
                }
                if (existedReason.has(reason)) {
                    continue;
                }
                existedReason.add(reason);
                const adjustSettingsArgs = {
                    codePoint: codePoint,
                    reason: highlightInfo.reason,
                    inComment: highlightInfo.inComment,
                    inString: highlightInfo.inString,
                };
                const adjustSettings = nls.localize('unicodeHighlight.adjustSettings', 'Adjust settings');
                const uri = `command:${ShowExcludeOptions.ID}?${encodeURIComponent(JSON.stringify(adjustSettingsArgs))}`;
                const markdown = new htmlContent_1.MarkdownString('', true)
                    .appendMarkdown(reason)
                    .appendText(' ')
                    .appendLink(uri, adjustSettings, configureUnicodeHighlightOptionsStr);
                result.push(new markdownHoverParticipant_1.MarkdownHover(this, d.range, [markdown], false, index++));
            }
            return result;
        }
        renderHoverParts(context, hoverParts) {
            return (0, markdownHoverParticipant_1.renderMarkdownHovers)(context, hoverParts, this._editor, this._languageService, this._openerService);
        }
    };
    exports.UnicodeHighlighterHoverParticipant = UnicodeHighlighterHoverParticipant;
    exports.UnicodeHighlighterHoverParticipant = UnicodeHighlighterHoverParticipant = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService)
    ], UnicodeHighlighterHoverParticipant);
    function codePointToHex(codePoint) {
        return `U+${codePoint.toString(16).padStart(4, '0')}`;
    }
    function formatCodePointMarkdown(codePoint) {
        let value = `\`${codePointToHex(codePoint)}\``;
        if (!strings_1.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
            // Don't render any control characters or any invisible characters, as they cannot be seen anyways.
            value += ` "${`${renderCodePointAsInlineCode(codePoint)}`}"`;
        }
        return value;
    }
    function renderCodePointAsInlineCode(codePoint) {
        if (codePoint === 96 /* CharCode.BackTick */) {
            return '`` ` ``';
        }
        return '`' + String.fromCodePoint(codePoint) + '`';
    }
    function computeReason(char, options) {
        return unicodeTextModelHighlighter_1.UnicodeTextModelHighlighter.computeUnicodeHighlightReason(char, options);
    }
    class Decorations {
        constructor() {
            this.map = new Map();
        }
        static { this.instance = new Decorations(); }
        getDecorationFromOptions(options) {
            return this.getDecoration(!options.includeComments, !options.includeStrings);
        }
        getDecoration(hideInComments, hideInStrings) {
            const key = `${hideInComments}${hideInStrings}`;
            let options = this.map.get(key);
            if (!options) {
                options = textModel_1.ModelDecorationOptions.createDynamic({
                    description: 'unicode-highlight',
                    stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                    className: 'unicode-highlight',
                    showIfCollapsed: true,
                    overviewRuler: null,
                    minimap: null,
                    hideInCommentTokens: hideInComments,
                    hideInStringTokens: hideInStrings,
                });
                this.map.set(key, options);
            }
            return options;
        }
    }
    class DisableHighlightingInCommentsAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingInComments'; }
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingInComments', 'Disable highlighting of characters in comments'),
                alias: 'Disable highlighting of characters in comments',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingInComments.shortLabel', 'Disable Highlight In Comments');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.includeComments, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingInCommentsAction = DisableHighlightingInCommentsAction;
    class DisableHighlightingInStringsAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingInStrings'; }
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingInStrings', 'Disable highlighting of characters in strings'),
                alias: 'Disable highlighting of characters in strings',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingInStrings.shortLabel', 'Disable Highlight In Strings');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.includeStrings, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingInStringsAction = DisableHighlightingInStringsAction;
    class DisableHighlightingOfAmbiguousCharactersAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingOfAmbiguousCharacters'; }
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfAmbiguousCharacters', 'Disable highlighting of ambiguous characters'),
                alias: 'Disable highlighting of ambiguous characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfAmbiguousCharacters.shortLabel', 'Disable Ambiguous Highlight');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.ambiguousCharacters, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfAmbiguousCharactersAction = DisableHighlightingOfAmbiguousCharactersAction;
    class DisableHighlightingOfInvisibleCharactersAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingOfInvisibleCharacters'; }
        constructor() {
            super({
                id: DisableHighlightingOfInvisibleCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfInvisibleCharacters', 'Disable highlighting of invisible characters'),
                alias: 'Disable highlighting of invisible characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfInvisibleCharacters.shortLabel', 'Disable Invisible Highlight');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.invisibleCharacters, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfInvisibleCharactersAction = DisableHighlightingOfInvisibleCharactersAction;
    class DisableHighlightingOfNonBasicAsciiCharactersAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters'; }
        constructor() {
            super({
                id: DisableHighlightingOfNonBasicAsciiCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters', 'Disable highlighting of non basic ASCII characters'),
                alias: 'Disable highlighting of non basic ASCII characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters.shortLabel', 'Disable Non ASCII Highlight');
        }
        async run(accessor, editor, args) {
            const configurationService = accessor?.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.nonBasicASCII, false, 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfNonBasicAsciiCharactersAction = DisableHighlightingOfNonBasicAsciiCharactersAction;
    class ShowExcludeOptions extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.unicodeHighlight.showExcludeOptions'; }
        constructor() {
            super({
                id: ShowExcludeOptions.ID,
                label: nls.localize('action.unicodeHighlight.showExcludeOptions', "Show Exclude Options"),
                alias: 'Show Exclude Options',
                precondition: undefined
            });
        }
        async run(accessor, editor, args) {
            const { codePoint, reason, inString, inComment } = args;
            const char = String.fromCodePoint(codePoint);
            const quickPickService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            function getExcludeCharFromBeingHighlightedLabel(codePoint) {
                if (strings_1.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                    return nls.localize('unicodeHighlight.excludeInvisibleCharFromBeingHighlighted', 'Exclude {0} (invisible character) from being highlighted', codePointToHex(codePoint));
                }
                return nls.localize('unicodeHighlight.excludeCharFromBeingHighlighted', 'Exclude {0} from being highlighted', `${codePointToHex(codePoint)} "${char}"`);
            }
            const options = [];
            if (reason.kind === 0 /* UnicodeHighlighterReasonKind.Ambiguous */) {
                for (const locale of reason.notAmbiguousInLocales) {
                    options.push({
                        label: nls.localize("unicodeHighlight.allowCommonCharactersInLanguage", "Allow unicode characters that are more common in the language \"{0}\".", locale),
                        run: async () => {
                            excludeLocaleFromBeingHighlighted(configurationService, [locale]);
                        },
                    });
                }
            }
            options.push({
                label: getExcludeCharFromBeingHighlightedLabel(codePoint),
                run: () => excludeCharFromBeingHighlighted(configurationService, [codePoint])
            });
            if (inComment) {
                const action = new DisableHighlightingInCommentsAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (inString) {
                const action = new DisableHighlightingInStringsAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            if (reason.kind === 0 /* UnicodeHighlighterReasonKind.Ambiguous */) {
                const action = new DisableHighlightingOfAmbiguousCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (reason.kind === 1 /* UnicodeHighlighterReasonKind.Invisible */) {
                const action = new DisableHighlightingOfInvisibleCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (reason.kind === 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */) {
                const action = new DisableHighlightingOfNonBasicAsciiCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else {
                expectNever(reason);
            }
            const result = await quickPickService.pick(options, { title: configureUnicodeHighlightOptionsStr });
            if (result) {
                await result.run();
            }
        }
    }
    exports.ShowExcludeOptions = ShowExcludeOptions;
    async function excludeCharFromBeingHighlighted(configurationService, charCodes) {
        const existingValue = configurationService.getValue(editorOptions_1.unicodeHighlightConfigKeys.allowedCharacters);
        let value;
        if ((typeof existingValue === 'object') && existingValue) {
            value = existingValue;
        }
        else {
            value = {};
        }
        for (const charCode of charCodes) {
            value[String.fromCodePoint(charCode)] = true;
        }
        await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.allowedCharacters, value, 2 /* ConfigurationTarget.USER */);
    }
    async function excludeLocaleFromBeingHighlighted(configurationService, locales) {
        const existingValue = configurationService.inspect(editorOptions_1.unicodeHighlightConfigKeys.allowedLocales).user?.value;
        let value;
        if ((typeof existingValue === 'object') && existingValue) {
            // Copy value, as the existing value is read only
            value = Object.assign({}, existingValue);
        }
        else {
            value = {};
        }
        for (const locale of locales) {
            value[locale] = true;
        }
        await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.allowedLocales, value, 2 /* ConfigurationTarget.USER */);
    }
    function expectNever(value) {
        throw new Error(`Unexpected value: ${value}`);
    }
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfAmbiguousCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfInvisibleCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfNonBasicAsciiCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(ShowExcludeOptions);
    (0, editorExtensions_1.registerEditorContribution)(UnicodeHighlighter.ID, UnicodeHighlighter, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    hoverTypes_1.HoverParticipantRegistry.register(UnicodeHighlighterHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pY29kZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvdW5pY29kZUhpZ2hsaWdodGVyL2Jyb3dzZXIvdW5pY29kZUhpZ2hsaWdodGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdDbkYsUUFBQSxXQUFXLEdBQUcsSUFBQSwyQkFBWSxFQUFDLDRCQUE0QixFQUFFLGtCQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLDZEQUE2RCxDQUFDLENBQUMsQ0FBQztJQUU1SyxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO2lCQUMxQixPQUFFLEdBQUcsbUNBQW1DLEFBQXRDLENBQXVDO1FBUWhFLFlBQ2tCLE9BQW9CLEVBQ2Ysb0JBQTJELEVBQy9DLHNCQUF5RSxFQUNwRixvQkFBMkM7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFMUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0UseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUM5QiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQWtDO1lBVHBHLGlCQUFZLEdBQW1FLElBQUksQ0FBQztZQUlwRixrQkFBYSxHQUFZLEtBQUssQ0FBQztZQXlDdEIsaUJBQVksR0FBRyxDQUFDLEtBQXNDLEVBQVEsRUFBRTtnQkFDaEYsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUM1QixJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDeEIsT0FBTztvQkFDUixDQUFDO29CQUVELDBEQUEwRDtvQkFDMUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUs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