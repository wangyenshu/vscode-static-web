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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/model/textModel", "vs/editor/common/languages/languageConfigurationRegistry", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/languageFeatures", "vs/platform/theme/common/colorRegistry", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/css!./linkedEditing"], function (require, exports, arrays, async_1, cancellation_1, color_1, errors_1, event_1, lifecycle_1, strings, uri_1, editorExtensions_1, codeEditorService_1, position_1, range_1, editorContextKeys_1, textModel_1, languageConfigurationRegistry_1, nls, contextkey_1, languageFeatures_1, colorRegistry_1, languageFeatureDebounce_1, stopwatch_1) {
    "use strict";
    var LinkedEditingContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editorLinkedEditingBackground = exports.LinkedEditingAction = exports.LinkedEditingContribution = exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE = void 0;
    exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE = new contextkey_1.RawContextKey('LinkedEditingInputVisible', false);
    const DECORATION_CLASS_NAME = 'linked-editing-decoration';
    let LinkedEditingContribution = class LinkedEditingContribution extends lifecycle_1.Disposable {
        static { LinkedEditingContribution_1 = this; }
        static { this.ID = 'editor.contrib.linkedEditing'; }
        static { this.DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'linked-editing',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            className: DECORATION_CLASS_NAME
        }); }
        static get(editor) {
            return editor.getContribution(LinkedEditingContribution_1.ID);
        }
        constructor(editor, contextKeyService, languageFeaturesService, languageConfigurationService, languageFeatureDebounceService) {
            super();
            this.languageConfigurationService = languageConfigurationService;
            this._syncRangesToken = 0;
            this._localToDispose = this._register(new lifecycle_1.DisposableStore());
            this._editor = editor;
            this._providers = languageFeaturesService.linkedEditingRangeProvider;
            this._enabled = false;
            this._visibleContextKey = exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
            this._debounceInformation = languageFeatureDebounceService.for(this._providers, 'Linked Editing', { max: 200 });
            this._currentDecorations = this._editor.createDecorationsCollection();
            this._languageWordPattern = null;
            this._currentWordPattern = null;
            this._ignoreChangeEvent = false;
            this._localToDispose = this._register(new lifecycle_1.DisposableStore());
            this._rangeUpdateTriggerPromise = null;
            this._rangeSyncTriggerPromise = null;
            this._currentRequestCts = null;
            this._currentRequestPosition = null;
            this._currentRequestModelVersion = null;
            this._register(this._editor.onDidChangeModel(() => this.reinitialize(true)));
            this._register(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(70 /* EditorOption.linkedEditing */) || e.hasChanged(93 /* EditorOption.renameOnType */)) {
                    this.reinitialize(false);
                }
            }));
            this._register(this._providers.onDidChange(() => this.reinitialize(false)));
            this._register(this._editor.onDidChangeModelLanguage(() => this.reinitialize(true)));
            this.reinitialize(true);
        }
        reinitialize(forceRefresh) {
            const model = this._editor.getModel();
            const isEnabled = model !== null && (this._editor.getOption(70 /* EditorOption.linkedEditing */) || this._editor.getOption(93 /* EditorOption.renameOnType */)) && this._providers.has(model);
            if (isEnabled === this._enabled && !forceRefresh) {
                return;
            }
            this._enabled = isEnabled;
            this.clearRanges();
            this._localToDispose.clear();
            if (!isEnabled || model === null) {
                return;
            }
            this._localToDispose.add(event_1.Event.runAndSubscribe(model.onDidChangeLanguageConfiguration, () => {
                this._languageWordPattern = this.languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).getWordDefinition();
            }));
            const rangeUpdateScheduler = new async_1.Delayer(this._debounceInformation.get(model));
            const triggerRangeUpdate = () => {
                this._rangeUpdateTriggerPromise = rangeUpdateScheduler.trigger(() => this.updateRanges(), this._debounceDuration ?? this._debounceInformation.get(model));
            };
            const rangeSyncScheduler = new async_1.Delayer(0);
            const triggerRangeSync = (token) => {
                this._rangeSyncTriggerPromise = rangeSyncScheduler.trigger(() => this._syncRanges(token));
            };
            this._localToDispose.add(this._editor.onDidChangeCursorPosition(() => {
                triggerRangeUpdate();
            }));
            this._localToDispose.add(this._editor.onDidChangeModelContent((e) => {
                if (!this._ignoreChangeEvent) {
                    if (this._currentDecorations.length > 0) {
                        const referenceRange = this._currentDecorations.getRange(0);
                        if (referenceRange && e.changes.every(c => referenceRange.intersectRanges(c.range))) {
                            triggerRangeSync(this._syncRangesToken);
                            return;
                        }
                    }
                }
                triggerRangeUpdate();
            }));
            this._localToDispose.add({
                dispose: () => {
                    rangeUpdateScheduler.dispose();
                    rangeSyncScheduler.dispose();
                }
            });
            this.updateRanges();
        }
        _syncRanges(token) {
            // delayed invocation, make sure we're still on
            if (!this._editor.hasModel() || token !== this._syncRangesToken || this._currentDecorations.length === 0) {
                // nothing to do
                return;
            }
            const model = this._editor.getModel();
            const referenceRange = this._currentDecorations.getRange(0);
            if (!referenceRange || referenceRange.startLineNumber !== referenceRange.endLineNumber) {
                return this.clearRanges();
            }
            const referenceValue = model.getValueInRange(referenceRange);
            if (this._currentWordPattern) {
                const match = referenceValue.match(this._currentWordPattern);
                const matchLength = match ? match[0].length : 0;
                if (matchLength !== referenceValue.length) {
                    return this.clearRanges();
                }
            }
            const edits = [];
            for (let i = 1, len = this._currentDecorations.length; i < len; i++) {
                const mirrorRange = this._currentDecorations.getRange(i);
                if (!mirrorRange) {
                    continue;
                }
                if (mirrorRange.startLineNumber !== mirrorRange.endLineNumber) {
                    edits.push({
                        range: mirrorRange,
                        text: referenceValue
                    });
                }
                else {
                    let oldValue = model.getValueInRange(mirrorRange);
                    let newValue = referenceValue;
                    let rangeStartColumn = mirrorRange.startColumn;
                    let rangeEndColumn = mirrorRange.endColumn;
                    const commonPrefixLength = strings.commonPrefixLength(oldValue, newValue);
                    rangeStartColumn += commonPrefixLength;
                    oldValue = oldValue.substr(commonPrefixLength);
                    newValue = newValue.substr(commonPrefixLength);
                    const commonSuffixLength = strings.commonSuffixLength(oldValue, newValue);
                    rangeEndColumn -= commonSuffixLength;
                    oldValue = oldValue.substr(0, oldValue.length - commonSuffixLength);
                    newValue = newValue.substr(0, newValue.length - commonSuffixLength);
                    if (rangeStartColumn !== rangeEndColumn || newValue.length !== 0) {
                        edits.push({
                            range: new range_1.Range(mirrorRange.startLineNumber, rangeStartColumn, mirrorRange.endLineNumber, rangeEndColumn),
                            text: newValue
                        });
                    }
                }
            }
            if (edits.length === 0) {
                return;
            }
            try {
                this._editor.popUndoStop();
                this._ignoreChangeEvent = true;
                const prevEditOperationType = this._editor._getViewModel().getPrevEditOperationType();
                this._editor.executeEdits('linkedEditing', edits);
                this._editor._getViewModel().setPrevEditOperationType(prevEditOperationType);
            }
            finally {
                this._ignoreChangeEvent = false;
            }
        }
        dispose() {
            this.clearRanges();
            super.dispose();
        }
        clearRanges() {
            this._visibleContextKey.set(false);
            this._currentDecorations.clear();
            if (this._currentRequestCts) {
                this._currentRequestCts.cancel();
                this._currentRequestCts = null;
                this._currentRequestPosition = null;
            }
        }
        get currentUpdateTriggerPromise() {
            return this._rangeUpdateTriggerPromise || Promise.resolve();
        }
        get currentSyncTriggerPromise() {
            return this._rangeSyncTriggerPromise || Promise.resolve();
        }
        async updateRanges(force = false) {
            if (!this._editor.hasModel()) {
                this.clearRanges();
                return;
            }
            const position = this._editor.getPosition();
            if (!this._enabled && !force || this._editor.getSelections().length > 1) {
                // disabled or multicursor
                this.clearRanges();
                return;
            }
            const model = this._editor.getModel();
            const modelVersionId = model.getVersionId();
            if (this._currentRequestPosition && this._currentRequestModelVersion === modelVersionId) {
                if (position.equals(this._currentRequestPosition)) {
                    return; // same position
                }
                if (this._currentDecorations.length > 0) {
                    const range = this._currentDecorations.getRange(0);
                    if (range && range.containsPosition(position)) {
                        return; // just moving inside the existing primary range
                    }
                }
            }
            // Clear existing decorations while we compute new ones
            this.clearRanges();
            this._currentRequestPosition = position;
            this._currentRequestModelVersion = modelVersionId;
            const currentRequestCts = this._currentRequestCts = new cancellation_1.CancellationTokenSource();
            try {
                const sw = new stopwatch_1.StopWatch(false);
                const response = await getLinkedEditingRanges(this._providers, model, position, currentRequestCts.token);
                this._debounceInformation.update(model, sw.elapsed());
                if (currentRequestCts !== this._currentRequestCts) {
                    return;
                }
                this._currentRequestCts = null;
                if (modelVersionId !== model.getVersionId()) {
                    return;
                }
                let ranges = [];
                if (response?.ranges) {
                    ranges = response.ranges;
                }
                this._currentWordPattern = response?.wordPattern || this._languageWordPattern;
                let foundReferenceRange = false;
                for (let i = 0, len = ranges.length; i < len; i++) {
                    if (range_1.Range.containsPosition(ranges[i], position)) {
                        foundReferenceRange = true;
                        if (i !== 0) {
                            const referenceRange = ranges[i];
                            ranges.splice(i, 1);
                            ranges.unshift(referenceRange);
                        }
                        break;
                    }
                }
                if (!foundReferenceRange) {
                    // Cannot do linked editing if the ranges are not where the cursor is...
                    this.clearRanges();
                    return;
                }
                const decorations = ranges.map(range => ({ range: range, options: LinkedEditingContribution_1.DECORATION }));
                this._visibleContextKey.set(true);
                this._currentDecorations.set(decorations);
                this._syncRangesToken++; // cancel any pending syncRanges call
            }
            catch (err) {
                if (!(0, errors_1.isCancellationError)(err)) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                if (this._currentRequestCts === currentRequestCts || !this._currentRequestCts) {
                    // stop if we are still the latest request
                    this.clearRanges();
                }
            }
        }
        // for testing
        setDebounceDuration(timeInMS) {
            this._debounceDuration = timeInMS;
        }
    };
    exports.LinkedEditingContribution = LinkedEditingContribution;
    exports.LinkedEditingContribution = LinkedEditingContribution = LinkedEditingContribution_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService)
    ], LinkedEditingContribution);
    class LinkedEditingAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.linkedEditing',
                label: nls.localize('linkedEditing.label', "Start Linked Editing"),
                alias: 'Start Linked Editing',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasRenameProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 60 /* KeyCode.F2 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        runCommand(accessor, args) {
            const editorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const [uri, pos] = Array.isArray(args) && args || [undefined, undefined];
            if (uri_1.URI.isUri(uri) && position_1.Position.isIPosition(pos)) {
                return editorService.openCodeEditor({ resource: uri }, editorService.getActiveCodeEditor()).then(editor => {
                    if (!editor) {
                        return;
                    }
                    editor.setPosition(pos);
                    editor.invokeWithinContext(accessor => {
                        this.reportTelemetry(accessor, editor);
                        return this.run(accessor, editor);
                    });
                }, errors_1.onUnexpectedError);
            }
            return super.runCommand(accessor, args);
        }
        run(_accessor, editor) {
            const controller = LinkedEditingContribution.get(editor);
            if (controller) {
                return Promise.resolve(controller.updateRanges(true));
            }
            return Promise.resolve();
        }
    }
    exports.LinkedEditingAction = LinkedEditingAction;
    const LinkedEditingCommand = editorExtensions_1.EditorCommand.bindToContribution(LinkedEditingContribution.get);
    (0, editorExtensions_1.registerEditorCommand)(new LinkedEditingCommand({
        id: 'cancelLinkedEditingInput',
        precondition: exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE,
        handler: x => x.clearRanges(),
        kbOpts: {
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    function getLinkedEditingRanges(providers, model, position, token) {
        const orderedByScore = providers.ordered(model);
        // in order of score ask the linked editing range provider
        // until someone response with a good result
        // (good = not null)
        return (0, async_1.first)(orderedByScore.map(provider => async () => {
            try {
                return await provider.provideLinkedEditingRanges(model, position, token);
            }
            catch (e) {
                (0, errors_1.onUnexpectedExternalError)(e);
                return undefined;
            }
        }), result => !!result && arrays.isNonEmptyArray(result?.ranges));
    }
    exports.editorLinkedEditingBackground = (0, colorRegistry_1.registerColor)('editor.linkedEditingBackground', { dark: color_1.Color.fromHex('#f00').transparent(0.3), light: color_1.Color.fromHex('#f00').transparent(0.3), hcDark: color_1.Color.fromHex('#f00').transparent(0.3), hcLight: color_1.Color.white }, nls.localize('editorLinkedEditingBackground', 'Background color when the editor auto renames on type.'));
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeLinkedEditingProvider', (_accessor, model, position) => {
        const { linkedEditingRangeProvider } = _accessor.get(languageFeatures_1.ILanguageFeaturesService);
        return getLinkedEditingRanges(linkedEditingRangeProvider, model, position, cancellation_1.CancellationToken.None);
    });
    (0, editorExtensions_1.registerEditorContribution)(LinkedEditingContribution.ID, LinkedEditingContribution, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorAction)(LinkedEditingAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VkRWRpdGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2xpbmtlZEVkaXRpbmcvYnJvd3Nlci9saW5rZWRFZGl0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFtQ25GLFFBQUEsbUNBQW1DLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWxILE1BQU0scUJBQXFCLEdBQUcsMkJBQTJCLENBQUM7SUFFbkQsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTs7aUJBRWpDLE9BQUUsR0FBRyw4QkFBOEIsQUFBakMsQ0FBa0M7aUJBRW5DLGVBQVUsR0FBRyxrQ0FBc0IsQ0FBQyxRQUFRLENBQUM7WUFDcEUsV0FBVyxFQUFFLGdCQUFnQjtZQUM3QixVQUFVLDZEQUFxRDtZQUMvRCxTQUFTLEVBQUUscUJBQXFCO1NBQ2hDLENBQUMsQUFKZ0MsQ0FJL0I7UUFFSCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBNEIsMkJBQXlCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQTJCRCxZQUNDLE1BQW1CLEVBQ0MsaUJBQXFDLEVBQy9CLHVCQUFpRCxFQUM1Qyw0QkFBNEUsRUFDMUUsOEJBQStEO1lBRWhHLEtBQUssRUFBRSxDQUFDO1lBSHdDLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFacEcscUJBQWdCLEdBQVcsQ0FBQyxDQUFDO1lBTXBCLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBVXhFLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lB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