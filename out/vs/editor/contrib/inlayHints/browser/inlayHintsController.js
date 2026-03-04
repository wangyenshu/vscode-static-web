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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/editorDom", "vs/editor/browser/stableEditorScroll", "vs/editor/common/config/editorOptions", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture", "vs/editor/contrib/inlayHints/browser/inlayHints", "vs/editor/contrib/inlayHints/browser/inlayHintsLocations", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, arrays_1, async_1, cancellation_1, errors_1, lifecycle_1, map_1, types_1, uri_1, editorDom_1, stableEditorScroll_1, editorOptions_1, editOperation_1, range_1, languages, model_1, textModel_1, languageFeatureDebounce_1, languageFeatures_1, resolverService_1, clickLinkGesture_1, inlayHints_1, inlayHintsLocations_1, commands_1, extensions_1, instantiation_1, notification_1, colors, themeService_1) {
    "use strict";
    var InlayHintsController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsController = exports.RenderedInlayHintLabelPart = void 0;
    // --- hint caching service (per session)
    class InlayHintsCache {
        constructor() {
            this._entries = new map_1.LRUCache(50);
        }
        get(model) {
            const key = InlayHintsCache._key(model);
            return this._entries.get(key);
        }
        set(model, value) {
            const key = InlayHintsCache._key(model);
            this._entries.set(key, value);
        }
        static _key(model) {
            return `${model.uri.toString()}/${model.getVersionId()}`;
        }
    }
    const IInlayHintsCache = (0, instantiation_1.createDecorator)('IInlayHintsCache');
    (0, extensions_1.registerSingleton)(IInlayHintsCache, InlayHintsCache, 1 /* InstantiationType.Delayed */);
    // --- rendered label
    class RenderedInlayHintLabelPart {
        constructor(item, index) {
            this.item = item;
            this.index = index;
        }
        get part() {
            const label = this.item.hint.label;
            if (typeof label === 'string') {
                return { label };
            }
            else {
                return label[this.index];
            }
        }
    }
    exports.RenderedInlayHintLabelPart = RenderedInlayHintLabelPart;
    class ActiveInlayHintInfo {
        constructor(part, hasTriggerModifier) {
            this.part = part;
            this.hasTriggerModifier = hasTriggerModifier;
        }
    }
    var RenderMode;
    (function (RenderMode) {
        RenderMode[RenderMode["Normal"] = 0] = "Normal";
        RenderMode[RenderMode["Invisible"] = 1] = "Invisible";
    })(RenderMode || (RenderMode = {}));
    // --- controller
    let InlayHintsController = class InlayHintsController {
        static { InlayHintsController_1 = this; }
        static { this.ID = 'editor.contrib.InlayHints'; }
        static { this._MAX_DECORATORS = 1500; }
        static { this._MAX_LABEL_LEN = 43; }
        static get(editor) {
            return editor.getContribution(InlayHintsController_1.ID) ?? undefined;
        }
        constructor(_editor, _languageFeaturesService, _featureDebounce, _inlayHintsCache, _commandService, _notificationService, _instaService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._inlayHintsCache = _inlayHintsCache;
            this._commandService = _commandService;
            this._notificationService = _notificationService;
            this._instaService = _instaService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._decorationsMetadata = new Map();
            this._ruleFactory = new editorDom_1.DynamicCssRules(this._editor);
            this._activeRenderMode = 0 /* RenderMode.Normal */;
            this._debounceInfo = _featureDebounce.for(_languageFeaturesService.inlayHintsProvider, 'InlayHint', { min: 25 });
            this._disposables.add(_languageFeaturesService.inlayHintsProvider.onDidChange(() => this._update()));
            this._disposables.add(_editor.onDidChangeModel(() => this._update()));
            this._disposables.add(_editor.onDidChangeModelLanguage(() => this._update()));
            this._disposables.add(_editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(141 /* EditorOption.inlayHints */)) {
                    this._update();
                }
            }));
            this._update();
        }
        dispose() {
            this._sessionDisposables.dispose();
            this._removeAllDecorations();
            this._disposables.dispose();
        }
        _update() {
            this._sessionDisposables.clear();
            this._removeAllDecorations();
            const options = this._editor.getOption(141 /* EditorOption.inlayHints */);
            if (options.enabled === 'off') {
                return;
            }
            const model = this._editor.getModel();
            if (!model || !this._languageFeaturesService.inlayHintsProvider.has(model)) {
                return;
            }
            if (options.enabled === 'on') {
                // different "on" modes: always
                this._activeRenderMode = 0 /* RenderMode.Normal */;
            }
            else {
                // different "on" modes: offUnlessPressed, or onUnlessPressed
                let defaultMode;
                let altMode;
                if (options.enabled === 'onUnlessPressed') {
                    defaultMode = 0 /* RenderMode.Normal */;
                    altMode = 1 /* RenderMode.Invisible */;
                }
                else {
                    defaultMode = 1 /* RenderMode.Invisible */;
                    altMode = 0 /* RenderMode.Normal */;
                }
                this._activeRenderMode = defaultMode;
                this._sessionDisposables.add(dom_1.ModifierKeyEmitter.getInstance().event(e => {
                    if (!this._editor.hasModel()) {
                        return;
                    }
                    const newRenderMode = e.altKey && e.ctrlKey && !(e.shiftKey || e.metaKey) ? altMode : defaultMode;
                    if (newRenderMode !== this._activeRenderMode) {
                        this._activeRenderMode = newRenderMode;
                        const model = this._editor.getModel();
                        const copies = this._copyInlayHintsWithCurrentAnchor(model);
                        this._updateHintsDecorators([model.getFullModelRange()], copies);
                        scheduler.schedule(0);
                    }
                }));
            }
            // iff possible, quickly update from cache
            const cached = this._inlayHintsCache.get(model);
            if (cached) {
                this._updateHintsDecorators([model.getFullModelRange()], cached);
            }
            this._sessionDisposables.add((0, lifecycle_1.toDisposable)(() => {
                // cache items when switching files etc
                if (!model.isDisposed()) {
                    this._cacheHintsForFastRestore(model);
                }
            }));
            let cts;
            const watchedProviders = new Set();
            const scheduler = new async_1.RunOnceScheduler(async () => {
                const t1 = Date.now();
                cts?.dispose(true);
                cts = new cancellation_1.CancellationTokenSource();
                const listener = model.onWillDispose(() => cts?.cancel());
                try {
                    const myToken = cts.token;
                    const inlayHints = await inlayHints_1.InlayHintsFragments.create(this._languageFeaturesService.inlayHintsProvider, model, this._getHintsRanges(), myToken);
                    scheduler.delay = this._debounceInfo.update(model, Date.now() - t1);
                    if (myToken.isCancellationRequested) {
                        inlayHints.dispose();
                        return;
                    }
                    // listen to provider changes
                    for (const provider of inlayHints.provider) {
                        if (typeof provider.onDidChangeInlayHints === 'function' && !watchedProviders.has(provider)) {
                            watchedProviders.add(provider);
                            this._sessionDisposables.add(provider.onDidChangeInlayHints(() => {
                                if (!scheduler.isScheduled()) { // ignore event when request is already scheduled
                                    scheduler.schedule();
                                }
                            }));
                        }
                    }
                    this._sessionDisposables.add(inlayHints);
                    this._updateHintsDecorators(inlayHints.ranges, inlayHints.items);
                    this._cacheHintsForFastRestore(model);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                finally {
                    cts.dispose();
                    listener.dispose();
                }
            }, this._debounceInfo.get(model));
            this._sessionDisposables.add(scheduler);
            this._sessionDisposables.add((0, lifecycle_1.toDisposable)(() => cts?.dispose(true)));
            scheduler.schedule(0);
            this._sessionDisposables.add(this._editor.onDidScrollChange((e) => {
                // update when scroll position changes
                // uses scrollTopChanged has weak heuristic to differenatiate between scrolling due to
                // typing or due to "actual" scrolling
                if (e.scrollTopChanged || !scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            }));
            this._sessionDisposables.add(this._editor.onDidChangeModelContent((e) => {
                cts?.cancel();
                // update less aggressive when typing
                const delay = Math.max(scheduler.delay, 1250);
                scheduler.schedule(delay);
            }));
            // mouse gestures
            this._sessionDisposables.add(this._installDblClickGesture(() => scheduler.schedule(0)));
            this._sessionDisposables.add(this._installLinkGesture());
            this._sessionDisposables.add(this._installContextMenu());
        }
        _installLinkGesture() {
            const store = new lifecycle_1.DisposableStore();
            const gesture = store.add(new clickLinkGesture_1.ClickLinkGesture(this._editor));
            // let removeHighlight = () => { };
            const sessionStore = new lifecycle_1.DisposableStore();
            store.add(sessionStore);
            store.add(gesture.onMouseMoveOrRelevantKeyDown(e => {
                const [mouseEvent] = e;
                const labelPart = this._getInlayHintLabelPart(mouseEvent);
                const model = this._editor.getModel();
                if (!labelPart || !model) {
                    sessionStore.clear();
                    return;
                }
                // resolve the item
                const cts = new cancellation_1.CancellationTokenSource();
                sessionStore.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
                labelPart.item.resolve(cts.token);
                // render link => when the modifier is pressed and when there is a command or location
                this._activeInlayHintPart = labelPart.part.command || labelPart.part.location
                    ? new ActiveInlayHintInfo(labelPart, mouseEvent.hasTriggerModifier)
                    : undefined;
                const lineNumber = model.validatePosition(labelPart.item.hint.position).lineNumber;
                const range = new range_1.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber));
                const lineHints = this._getInlineHintsForRange(range);
                this._updateHintsDecorators([range], lineHints);
                sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                    this._activeInlayHintPart = undefined;
                    this._updateHintsDecorators([range], lineHints);
                }));
            }));
            store.add(gesture.onCancel(() => sessionStore.clear()));
            store.add(gesture.onExecute(async (e) => {
                const label = this._getInlayHintLabelPart(e);
                if (label) {
                    const part = label.part;
                    if (part.location) {
                        // location -> execute go to def
                        this._instaService.invokeFunction(inlayHintsLocations_1.goToDefinitionWithLocation, e, this._editor, part.location);
                    }
                    else if (languages.Command.is(part.command)) {
                        // command -> execute it
                        await this._invokeCommand(part.command, label.item);
                    }
                }
            }));
            return store;
        }
        _getInlineHintsForRange(range) {
            const lineHints = new Set();
            for (const data of this._decorationsMetadata.values()) {
                if (range.containsRange(data.item.anchor.range)) {
                    lineHints.add(data.item);
                }
            }
            return Array.from(lineHints);
        }
        _installDblClickGesture(updateInlayHints) {
            return this._editor.onMouseUp(async (e) => {
                if (e.event.detail !== 2) {
                    return;
                }
                const part = this._getInlayHintLabelPart(e);
                if (!part) {
                    return;
                }
                e.event.preventDefault();
                await part.item.resolve(cancellation_1.CancellationToken.None);
                if ((0, arrays_1.isNonEmptyArray)(part.item.hint.textEdits)) {
                    const edits = part.item.hint.textEdits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text));
                    this._editor.executeEdits('inlayHint.default', edits);
                    updateInlayHints();
                }
            });
        }
        _installContextMenu() {
            return this._editor.onContextMenu(async (e) => {
                if (!(e.event.target instanceof HTMLElement)) {
                    return;
                }
                const part = this._getInlayHintLabelPart(e);
                if (part) {
                    await this._instaService.invokeFunction(inlayHintsLocations_1.showGoToContextMenu, this._editor, e.event.target, part);
                }
            });
        }
        _getInlayHintLabelPart(e) {
            if (e.target.type !== 6 /* MouseTargetType.CONTENT_TEXT */) {
                return undefined;
            }
            const options = e.target.detail.injectedText?.options;
            if (options instanceof textModel_1.ModelDecorationInjectedTextOptions && options?.attachedData instanceof RenderedInlayHintLabelPart) {
                return options.attachedData;
            }
            return undefined;
        }
        async _invokeCommand(command, item) {
            try {
                await this._commandService.executeCommand(command.id, ...(command.arguments ?? []));
            }
            catch (err) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    source: item.provider.displayName,
                    message: err
                });
            }
        }
        _cacheHintsForFastRestore(model) {
            const hints = this._copyInlayHintsWithCurrentAnchor(model);
            this._inlayHintsCache.set(model, hints);
        }
        // return inlay hints but with an anchor that reflects "updates"
        // that happened after receiving them, e.g adding new lines before a hint
        _copyInlayHintsWithCurrentAnchor(model) {
            const items = new Map();
            for (const [id, obj] of this._decorationsMetadata) {
                if (items.has(obj.item)) {
                    // an inlay item can be rendered as multiple decorations
                    // but they will all uses the same range
                    continue;
                }
                const range = model.getDecorationRange(id);
                if (range) {
                    // update range with whatever the editor has tweaked it to
                    const anchor = new inlayHints_1.InlayHintAnchor(range, obj.item.anchor.direction);
                    const copy = obj.item.with({ anchor });
                    items.set(obj.item, copy);
                }
            }
            return Array.from(items.values());
        }
        _getHintsRanges() {
            const extra = 30;
            const model = this._editor.getModel();
            const visibleRanges = this._editor.getVisibleRangesPlusViewportAboveBelow();
            const result = [];
            for (const range of visibleRanges.sort(range_1.Range.compareRangesUsingStarts)) {
                const extendedRange = model.validateRange(new range_1.Range(range.startLineNumber - extra, range.startColumn, range.endLineNumber + extra, range.endColumn));
                if (result.length === 0 || !range_1.Range.areIntersectingOrTouching(result[result.length - 1], extendedRange)) {
                    result.push(extendedRange);
                }
                else {
                    result[result.length - 1] = range_1.Range.plusRange(result[result.length - 1], extendedRange);
                }
            }
            return result;
        }
        _updateHintsDecorators(ranges, items) {
            // utils to collect/create injected text decorations
            const newDecorationsData = [];
            const addInjectedText = (item, ref, content, cursorStops, attachedData) => {
                const opts = {
                    content,
                    inlineClassNameAffectsLetterSpacing: true,
                    inlineClassName: ref.className,
                    cursorStops,
                    attachedData
                };
                newDecorationsData.push({
                    item,
                    classNameRef: ref,
                    decoration: {
                        range: item.anchor.range,
                        options: {
                            // className: "rangeHighlight", // DEBUG highlight to see to what range a hint is attached
                            description: 'InlayHint',
                            showIfCollapsed: item.anchor.range.isEmpty(), // "original" range is empty
                            collapseOnReplaceEdit: !item.anchor.range.isEmpty(),
                            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
                            [item.anchor.direction]: this._activeRenderMode === 0 /* RenderMode.Normal */ ? opts : undefined
                        }
                    }
                });
            };
            const addInjectedWhitespace = (item, isLast) => {
                const marginRule = this._ruleFactory.createClassNameRef({
                    width: `${(fontSize / 3) | 0}px`,
                    display: 'inline-block'
                });
                addInjectedText(item, marginRule, '\u200a', isLast ? model_1.InjectedTextCursorStops.Right : model_1.InjectedTextCursorStops.None);
            };
            //
            const { fontSize, fontFamily, padding, isUniform } = this._getLayoutInfo();
            const fontFamilyVar = '--code-editorInlayHintsFontFamily';
            this._editor.getContainerDomNode().style.setProperty(fontFamilyVar, fontFamily);
            let currentLineInfo = { line: 0, totalLen: 0 };
            for (const item of items) {
                if (currentLineInfo.line !== item.anchor.range.startLineNumber) {
                    currentLineInfo = { line: item.anchor.range.startLineNumber, totalLen: 0 };
                }
                if (currentLineInfo.totalLen > InlayHintsController_1._MAX_LABEL_LEN) {
                    continue;
                }
                // whitespace leading the actual label
                if (item.hint.paddingLeft) {
                    addInjectedWhitespace(item, false);
                }
                // the label with its parts
                const parts = typeof item.hint.label === 'string'
                    ? [{ label: item.hint.label }]
                    : item.hint.label;
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    const isFirst = i === 0;
                    const isLast = i === parts.length - 1;
                    const cssProperties = {
                        fontSize: `${fontSize}px`,
                        fontFamily: `var(${fontFamilyVar}), ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`,
                        verticalAlign: isUniform ? 'baseline' : 'middle',
                        unicodeBidi: 'isolate'
                    };
                    if ((0, arrays_1.isNonEmptyArray)(item.hint.textEdits)) {
                        cssProperties.cursor = 'default';
                    }
                    this._fillInColors(cssProperties, item.hint);
                    if ((part.command || part.location) && this._activeInlayHintPart?.part.item === item && this._activeInlayHintPart.part.index === i) {
                        // active link!
                        cssProperties.textDecoration = 'underline';
                        if (this._activeInlayHintPart.hasTriggerModifier) {
                            cssProperties.color = (0, themeService_1.themeColorFromId)(colors.editorActiveLinkForeground);
                            cssProperties.cursor = 'pointer';
                        }
                    }
                    if (padding) {
                        if (isFirst && isLast) {
                            // only element
                            cssProperties.padding = `1px ${Math.max(1, fontSize / 4) | 0}px`;
                            cssProperties.borderRadius = `${(fontSize / 4) | 0}px`;
                        }
                        else if (isFirst) {
                            // first element
                            cssProperties.padding = `1px 0 1px ${Math.max(1, fontSize / 4) | 0}px`;
                            cssProperties.borderRadius = `${(fontSize / 4) | 0}px 0 0 ${(fontSize / 4) | 0}px`;
                        }
                        else if (isLast) {
                            // last element
                            cssProperties.padding = `1px ${Math.max(1, fontSize / 4) | 0}px 1px 0`;
                            cssProperties.borderRadius = `0 ${(fontSize / 4) | 0}px ${(fontSize / 4) | 0}px 0`;
                        }
                        else {
                            cssProperties.padding = `1px 0 1px 0`;
                        }
                    }
                    let textlabel = part.label;
                    currentLineInfo.totalLen += textlabel.length;
                    let tooLong = false;
                    const over = currentLineInfo.totalLen - InlayHintsController_1._MAX_LABEL_LEN;
                    if (over > 0) {
                        textlabel = textlabel.slice(0, -over) + '…';
                        tooLong = true;
                    }
                    addInjectedText(item, this._ruleFactory.createClassNameRef(cssProperties), fixSpace(textlabel), isLast && !item.hint.paddingRight ? model_1.InjectedTextCursorStops.Right : model_1.InjectedTextCursorStops.None, new RenderedInlayHintLabelPart(item, i));
                    if (tooLong) {
                        break;
                    }
                }
                // whitespace trailing the actual label
                if (item.hint.paddingRight) {
                    addInjectedWhitespace(item, true);
                }
                if (newDecorationsData.length > InlayHintsController_1._MAX_DECORATORS) {
                    break;
                }
            }
            // collect all decoration ids that are affected by the ranges
            // and only update those decorations
            const decorationIdsToReplace = [];
            for (const [id, metadata] of this._decorationsMetadata) {
                const range = this._editor.getModel()?.getDecorationRange(id);
                if (range && ranges.some(r => r.containsRange(range))) {
                    decorationIdsToReplace.push(id);
                    metadata.classNameRef.dispose();
                    this._decorationsMetadata.delete(id);
                }
            }
            const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this._editor);
            this._editor.changeDecorations(accessor => {
                const newDecorationIds = accessor.deltaDecorations(decorationIdsToReplace, newDecorationsData.map(d => d.decoration));
                for (let i = 0; i < newDecorationIds.length; i++) {
                    const data = newDecorationsData[i];
                    this._decorationsMetadata.set(newDecorationIds[i], data);
                }
            });
            scrollState.restore(this._editor);
        }
        _fillInColors(props, hint) {
            if (hint.kind === languages.InlayHintKind.Parameter) {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintParameterBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintParameterForeground);
            }
            else if (hint.kind === languages.InlayHintKind.Type) {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintTypeBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintTypeForeground);
            }
            else {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintForeground);
            }
        }
        _getLayoutInfo() {
            const options = this._editor.getOption(141 /* EditorOption.inlayHints */);
            const padding = options.padding;
            const editorFontSize = this._editor.getOption(52 /* EditorOption.fontSize */);
            const editorFontFamily = this._editor.getOption(49 /* EditorOption.fontFamily */);
            let fontSize = options.fontSize;
            if (!fontSize || fontSize < 5 || fontSize > editorFontSize) {
                fontSize = editorFontSize;
            }
            const fontFamily = options.fontFamily || editorFontFamily;
            const isUniform = !padding
                && fontFamily === editorFontFamily
                && fontSize === editorFontSize;
            return { fontSize, fontFamily, padding, isUniform };
        }
        _removeAllDecorations() {
            this._editor.removeDecorations(Array.from(this._decorationsMetadata.keys()));
            for (const obj of this._decorationsMetadata.values()) {
                obj.classNameRef.dispose();
            }
            this._decorationsMetadata.clear();
        }
        // --- accessibility
        getInlayHintsForLine(line) {
            if (!this._editor.hasModel()) {
                return [];
            }
            const set = new Set();
            const result = [];
            for (const deco of this._editor.getLineDecorations(line)) {
                const data = this._decorationsMetadata.get(deco.id);
                if (data && !set.has(data.item.hint)) {
                    set.add(data.item.hint);
                    result.push(data.item);
                }
            }
            return result;
        }
    };
    exports.InlayHintsController = InlayHintsController;
    exports.InlayHintsController = InlayHintsController = InlayHintsController_1 = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(3, IInlayHintsCache),
        __param(4, commands_1.ICommandService),
        __param(5, notification_1.INotificationService),
        __param(6, instantiation_1.IInstantiationService)
    ], InlayHintsController);
    // Prevents the view from potentially visible whitespace
    function fixSpace(str) {
        const noBreakWhitespace = '\xa0';
        return str.replace(/[ \t]/g, noBreakWhitespace);
    }
    commands_1.CommandsRegistry.registerCommand('_executeInlayHintProvider', async (accessor, ...args) => {
        const [uri, range] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(range_1.Range.isIRange(range));
        const { inlayHintsProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const ref = await accessor.get(resolverService_1.ITextModelService).createModelReference(uri);
        try {
            const model = await inlayHints_1.InlayHintsFragments.create(inlayHintsProvider, ref.object.textEditorModel, [range_1.Range.lift(range)], cancellation_1.CancellationToken.None);
            const result = model.items.map(i => i.hint);
            setTimeout(() => model.dispose(), 0); // dispose after sending to ext host
            return result;
        }
        finally {
            ref.dispose();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50c0NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxheUhpbnRzL2Jyb3dzZXIvaW5sYXlIaW50c0NvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1DaEcseUNBQXlDO0lBRXpDLE1BQU0sZUFBZTtRQUFyQjtZQUlrQixhQUFRLEdBQUcsSUFBSSxjQUFRLENBQTBCLEVBQUUsQ0FBQyxDQUFDO1FBZXZFLENBQUM7UUFiQSxHQUFHLENBQUMsS0FBaUI7WUFDcEIsTUFBTSxHQUFHLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxHQUFHLENBQUMsS0FBaUIsRUFBRSxLQUFzQjtZQUM1QyxNQUFNLEdBQUcsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU8sTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFpQjtZQUNwQyxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztRQUMxRCxDQUFDO0tBQ0Q7SUFHRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxJQUFBLDhCQUFpQixFQUFDLGdCQUFnQixFQUFFLGVBQWUsb0NBQTRCLENBQUM7SUFFaEYscUJBQXFCO0lBRXJC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