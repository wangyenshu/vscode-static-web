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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/common/editorCommon", "vs/editor/common/model", "vs/platform/theme/common/themeService"], function (require, exports, dom, event_1, lifecycle_1, linkedList_1, strings, uri_1, editorCommon_1, model_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports._CSS_MAP = exports.GlobalStyleSheet = exports.ModelTransientSettingWatcher = exports.AbstractCodeEditorService = void 0;
    let AbstractCodeEditorService = class AbstractCodeEditorService extends lifecycle_1.Disposable {
        constructor(_themeService) {
            super();
            this._themeService = _themeService;
            this._onWillCreateCodeEditor = this._register(new event_1.Emitter());
            this.onWillCreateCodeEditor = this._onWillCreateCodeEditor.event;
            this._onCodeEditorAdd = this._register(new event_1.Emitter());
            this.onCodeEditorAdd = this._onCodeEditorAdd.event;
            this._onCodeEditorRemove = this._register(new event_1.Emitter());
            this.onCodeEditorRemove = this._onCodeEditorRemove.event;
            this._onWillCreateDiffEditor = this._register(new event_1.Emitter());
            this.onWillCreateDiffEditor = this._onWillCreateDiffEditor.event;
            this._onDiffEditorAdd = this._register(new event_1.Emitter());
            this.onDiffEditorAdd = this._onDiffEditorAdd.event;
            this._onDiffEditorRemove = this._register(new event_1.Emitter());
            this.onDiffEditorRemove = this._onDiffEditorRemove.event;
            this._onDidChangeTransientModelProperty = this._register(new event_1.Emitter());
            this.onDidChangeTransientModelProperty = this._onDidChangeTransientModelProperty.event;
            this._onDecorationTypeRegistered = this._register(new event_1.Emitter());
            this.onDecorationTypeRegistered = this._onDecorationTypeRegistered.event;
            this._decorationOptionProviders = new Map();
            this._editorStyleSheets = new Map();
            this._codeEditorOpenHandlers = new linkedList_1.LinkedList();
            this._transientWatchers = {};
            this._modelProperties = new Map();
            this._codeEditors = Object.create(null);
            this._diffEditors = Object.create(null);
            this._globalStyleSheet = null;
        }
        willCreateCodeEditor() {
            this._onWillCreateCodeEditor.fire();
        }
        addCodeEditor(editor) {
            this._codeEditors[editor.getId()] = editor;
            this._onCodeEditorAdd.fire(editor);
        }
        removeCodeEditor(editor) {
            if (delete this._codeEditors[editor.getId()]) {
                this._onCodeEditorRemove.fire(editor);
            }
        }
        listCodeEditors() {
            return Object.keys(this._codeEditors).map(id => this._codeEditors[id]);
        }
        willCreateDiffEditor() {
            this._onWillCreateDiffEditor.fire();
        }
        addDiffEditor(editor) {
            this._diffEditors[editor.getId()] = editor;
            this._onDiffEditorAdd.fire(editor);
        }
        removeDiffEditor(editor) {
            if (delete this._diffEditors[editor.getId()]) {
                this._onDiffEditorRemove.fire(editor);
            }
        }
        listDiffEditors() {
            return Object.keys(this._diffEditors).map(id => this._diffEditors[id]);
        }
        getFocusedCodeEditor() {
            let editorWithWidgetFocus = null;
            const editors = this.listCodeEditors();
            for (const editor of editors) {
                if (editor.hasTextFocus()) {
                    // bingo!
                    return editor;
                }
                if (editor.hasWidgetFocus()) {
                    editorWithWidgetFocus = editor;
                }
            }
            return editorWithWidgetFocus;
        }
        _getOrCreateGlobalStyleSheet() {
            if (!this._globalStyleSheet) {
                this._globalStyleSheet = this._createGlobalStyleSheet();
            }
            return this._globalStyleSheet;
        }
        _createGlobalStyleSheet() {
            return new GlobalStyleSheet(dom.createStyleSheet());
        }
        _getOrCreateStyleSheet(editor) {
            if (!editor) {
                return this._getOrCreateGlobalStyleSheet();
            }
            const domNode = editor.getContainerDomNode();
            if (!dom.isInShadowDOM(domNode)) {
                return this._getOrCreateGlobalStyleSheet();
            }
            const editorId = editor.getId();
            if (!this._editorStyleSheets.has(editorId)) {
                const refCountedStyleSheet = new RefCountedStyleSheet(this, editorId, dom.createStyleSheet(domNode));
                this._editorStyleSheets.set(editorId, refCountedStyleSheet);
            }
            return this._editorStyleSheets.get(editorId);
        }
        _removeEditorStyleSheets(editorId) {
            this._editorStyleSheets.delete(editorId);
        }
        registerDecorationType(description, key, options, parentTypeKey, editor) {
            let provider = this._decorationOptionProviders.get(key);
            if (!provider) {
                const styleSheet = this._getOrCreateStyleSheet(editor);
                const providerArgs = {
                    styleSheet: styleSheet,
                    key: key,
                    parentTypeKey: parentTypeKey,
                    options: options || Object.create(null)
                };
                if (!parentTypeKey) {
                    provider = new DecorationTypeOptionsProvider(description, this._themeService, styleSheet, providerArgs);
                }
                else {
                    provider = new DecorationSubTypeOptionsProvider(this._themeService, styleSheet, providerArgs);
                }
                this._decorationOptionProviders.set(key, provider);
                this._onDecorationTypeRegistered.fire(key);
            }
            provider.refCount++;
            return {
                dispose: () => {
                    this.removeDecorationType(key);
                }
            };
        }
        listDecorationTypes() {
            return Array.from(this._decorationOptionProviders.keys());
        }
        removeDecorationType(key) {
            const provider = this._decorationOptionProviders.get(key);
            if (provider) {
                provider.refCount--;
                if (provider.refCount <= 0) {
                    this._decorationOptionProviders.delete(key);
                    provider.dispose();
                    this.listCodeEditors().forEach((ed) => ed.removeDecorationsByType(key));
                }
            }
        }
        resolveDecorationOptions(decorationTypeKey, writable) {
            const provider = this._decorationOptionProviders.get(decorationTypeKey);
            if (!provider) {
                throw new Error('Unknown decoration type key: ' + decorationTypeKey);
            }
            return provider.getOptions(this, writable);
        }
        resolveDecorationCSSRules(decorationTypeKey) {
            const provider = this._decorationOptionProviders.get(decorationTypeKey);
            if (!provider) {
                return null;
            }
            return provider.resolveDecorationCSSRules();
        }
        setModelProperty(resource, key, value) {
            const key1 = resource.toString();
            let dest;
            if (this._modelProperties.has(key1)) {
                dest = this._modelProperties.get(key1);
            }
            else {
                dest = new Map();
                this._modelProperties.set(key1, dest);
            }
            dest.set(key, value);
        }
        getModelProperty(resource, key) {
            const key1 = resource.toString();
            if (this._modelProperties.has(key1)) {
                const innerMap = this._modelProperties.get(key1);
                return innerMap.get(key);
            }
            return undefined;
        }
        setTransientModelProperty(model, key, value) {
            const uri = model.uri.toString();
            let w;
            if (this._transientWatchers.hasOwnProperty(uri)) {
                w = this._transientWatchers[uri];
            }
            else {
                w = new ModelTransientSettingWatcher(uri, model, this);
                this._transientWatchers[uri] = w;
            }
            const previousValue = w.get(key);
            if (previousValue !== value) {
                w.set(key, value);
                this._onDidChangeTransientModelProperty.fire(model);
            }
        }
        getTransientModelProperty(model, key) {
            const uri = model.uri.toString();
            if (!this._transientWatchers.hasOwnProperty(uri)) {
                return undefined;
            }
            return this._transientWatchers[uri].get(key);
        }
        getTransientModelProperties(model) {
            const uri = model.uri.toString();
            if (!this._transientWatchers.hasOwnProperty(uri)) {
                return undefined;
            }
            return this._transientWatchers[uri].keys().map(key => [key, this._transientWatchers[uri].get(key)]);
        }
        _removeWatcher(w) {
            delete this._transientWatchers[w.uri];
        }
        async openCodeEditor(input, source, sideBySide) {
            for (const handler of this._codeEditorOpenHandlers) {
                const candidate = await handler(input, source, sideBySide);
                if (candidate !== null) {
                    return candidate;
                }
            }
            return null;
        }
        registerCodeEditorOpenHandler(handler) {
            const rm = this._codeEditorOpenHandlers.unshift(handler);
            return (0, lifecycle_1.toDisposable)(rm);
        }
    };
    exports.AbstractCodeEditorService = AbstractCodeEditorService;
    exports.AbstractCodeEditorService = AbstractCodeEditorService = __decorate([
        __param(0, themeService_1.IThemeService)
    ], AbstractCodeEditorService);
    class ModelTransientSettingWatcher {
        constructor(uri, model, owner) {
            this.uri = uri;
            this._values = {};
            model.onWillDispose(() => owner._removeWatcher(this));
        }
        set(key, value) {
            this._values[key] = value;
        }
        get(key) {
            return this._values[key];
        }
        keys() {
            return Object.keys(this._values);
        }
    }
    exports.ModelTransientSettingWatcher = ModelTransientSettingWatcher;
    class RefCountedStyleSheet {
        get sheet() {
            return this._styleSheet.sheet;
        }
        constructor(parent, editorId, styleSheet) {
            this._parent = parent;
            this._editorId = editorId;
            this._styleSheet = styleSheet;
            this._refCount = 0;
        }
        ref() {
            this._refCount++;
        }
        unref() {
            this._refCount--;
            if (this._refCount === 0) {
                this._styleSheet.parentNode?.removeChild(this._styleSheet);
                this._parent._removeEditorStyleSheets(this._editorId);
            }
        }
        insertRule(selector, rule) {
            dom.createCSSRule(selector, rule, this._styleSheet);
        }
        removeRulesContainingSelector(ruleName) {
            dom.removeCSSRulesContainingSelector(ruleName, this._styleSheet);
        }
    }
    class GlobalStyleSheet {
        get sheet() {
            return this._styleSheet.sheet;
        }
        constructor(styleSheet) {
            this._styleSheet = styleSheet;
        }
        ref() {
        }
        unref() {
        }
        insertRule(selector, rule) {
            dom.createCSSRule(selector, rule, this._styleSheet);
        }
        removeRulesContainingSelector(ruleName) {
            dom.removeCSSRulesContainingSelector(ruleName, this._styleSheet);
        }
    }
    exports.GlobalStyleSheet = GlobalStyleSheet;
    class DecorationSubTypeOptionsProvider {
        constructor(themeService, styleSheet, providerArgs) {
            this._styleSheet = styleSheet;
            this._styleSheet.ref();
            this._parentTypeKey = providerArgs.parentTypeKey;
            this.refCount = 0;
            this._beforeContentRules = new DecorationCSSRules(3 /* ModelDecorationCSSRuleType.BeforeContentClassName */, providerArgs, themeService);
            this._afterContentRules = new DecorationCSSRules(4 /* ModelDecorationCSSRuleType.AfterContentClassName */, providerArgs, themeService);
        }
        getOptions(codeEditorService, writable) {
            const options = codeEditorService.resolveDecorationOptions(this._parentTypeKey, true);
            if (this._beforeContentRules) {
                options.beforeContentClassName = this._beforeContentRules.className;
            }
            if (this._afterContentRules) {
                options.afterContentClassName = this._afterContentRules.className;
            }
            return options;
        }
        resolveDecorationCSSRules() {
            return this._styleSheet.sheet.cssRules;
        }
        dispose() {
            if (this._beforeContentRules) {
                this._beforeContentRules.dispose();
                this._beforeContentRules = null;
            }
            if (this._afterContentRules) {
                this._afterContentRules.dispose();
                this._afterContentRules = null;
            }
            this._styleSheet.unref();
        }
    }
    class DecorationTypeOptionsProvider {
        constructor(description, themeService, styleSheet, providerArgs) {
            this._disposables = new lifecycle_1.DisposableStore();
            this.description = description;
            this._styleSheet = styleSheet;
            this._styleSheet.ref();
            this.refCount = 0;
            const createCSSRules = (type) => {
                const rules = new DecorationCSSRules(type, providerArgs, themeService);
                this._disposables.add(rules);
                if (rules.hasContent) {
                    return rules.className;
                }
                return undefined;
            };
            const createInlineCSSRules = (type) => {
                const rules = new DecorationCSSRules(type, providerArgs, themeService);
                this._disposables.add(rules);
                if (rules.hasContent) {
                    return { className: rules.className, hasLetterSpacing: rules.hasLetterSpacing };
                }
                return null;
            };
            this.className = createCSSRules(0 /* ModelDecorationCSSRuleType.ClassName */);
            const inlineData = createInlineCSSRules(1 /* ModelDecorationCSSRuleType.InlineClassName */);
            if (inlineData) {
                this.inlineClassName = inlineData.className;
                this.inlineClassNameAffectsLetterSpacing = inlineData.hasLetterSpacing;
            }
            this.beforeContentClassName = createCSSRules(3 /* ModelDecorationCSSRuleType.BeforeContentClassName */);
            this.afterContentClassName = createCSSRules(4 /* ModelDecorationCSSRuleType.AfterContentClassName */);
            if (providerArgs.options.beforeInjectedText && providerArgs.options.beforeInjectedText.contentText) {
                const beforeInlineData = createInlineCSSRules(5 /* ModelDecorationCSSRuleType.BeforeInjectedTextClassName */);
                this.beforeInjectedText = {
                    content: providerArgs.options.beforeInjectedText.contentText,
                    inlineClassName: beforeInlineData?.className,
                    inlineClassNameAffectsLetterSpacing: beforeInlineData?.hasLetterSpacing || providerArgs.options.beforeInjectedText.affectsLetterSpacing
                };
            }
            if (providerArgs.options.afterInjectedText && providerArgs.options.afterInjectedText.contentText) {
                const afterInlineData = createInlineCSSRules(6 /* ModelDecorationCSSRuleType.AfterInjectedTextClassName */);
                this.afterInjectedText = {
                    content: providerArgs.options.afterInjectedText.contentText,
                    inlineClassName: afterInlineData?.className,
                    inlineClassNameAffectsLetterSpacing: afterInlineData?.hasLetterSpacing || providerArgs.options.afterInjectedText.affectsLetterSpacing
                };
            }
            this.glyphMarginClassName = createCSSRules(2 /* ModelDecorationCSSRuleType.GlyphMarginClassName */);
            const options = providerArgs.options;
            this.isWholeLine = Boolean(options.isWholeLine);
            this.stickiness = options.rangeBehavior;
            const lightOverviewRulerColor = options.light && options.light.overviewRulerColor || options.overviewRulerColor;
            const darkOverviewRulerColor = options.dark && options.dark.overviewRulerColor || options.overviewRulerColor;
            if (typeof lightOverviewRulerColor !== 'undefined'
                || typeof darkOverviewRulerColor !== 'undefined') {
                this.overviewRuler = {
                    color: lightOverviewRulerColor || darkOverviewRulerColor,
                    darkColor: darkOverviewRulerColor || lightOverviewRulerColor,
                    position: options.overviewRulerLane || model_1.OverviewRulerLane.Center
                };
            }
        }
        getOptions(codeEditorService, writable) {
            if (!writable) {
                return this;
            }
            return {
                description: this.description,
                inlineClassName: this.inlineClassName,
                beforeContentClassName: this.beforeContentClassName,
                afterContentClassName: this.afterContentClassName,
                className: this.className,
                glyphMarginClassName: this.glyphMarginClassName,
                isWholeLine: this.isWholeLine,
                overviewRuler: this.overviewRuler,
                stickiness: this.stickiness,
                before: this.beforeInjectedText,
                after: this.afterInjectedText
            };
        }
        resolveDecorationCSSRules() {
            return this._styleSheet.sheet.rules;
        }
        dispose() {
            this._disposables.dispose();
            this._styleSheet.unref();
        }
    }
    exports._CSS_MAP = {
        color: 'color:{0} !important;',
        opacity: 'opacity:{0};',
        backgroundColor: 'background-color:{0};',
        outline: 'outline:{0};',
        outlineColor: 'outline-color:{0};',
        outlineStyle: 'outline-style:{0};',
        outlineWidth: 'outline-width:{0};',
        border: 'border:{0};',
        borderColor: 'border-color:{0};',
        borderRadius: 'border-radius:{0};',
        borderSpacing: 'border-spacing:{0};',
        borderStyle: 'border-style:{0};',
        borderWidth: 'border-width:{0};',
        fontStyle: 'font-style:{0};',
        fontWeight: 'font-weight:{0};',
        fontSize: 'font-size:{0};',
        fontFamily: 'font-family:{0};',
        textDecoration: 'text-decoration:{0};',
        cursor: 'cursor:{0};',
        letterSpacing: 'letter-spacing:{0};',
        gutterIconPath: 'background:{0} center center no-repeat;',
        gutterIconSize: 'background-size:{0};',
        contentText: 'content:\'{0}\';',
        contentIconPath: 'content:{0};',
        margin: 'margin:{0};',
        padding: 'padding:{0};',
        width: 'width:{0};',
        height: 'height:{0};',
        verticalAlign: 'vertical-align:{0};',
    };
    class DecorationCSSRules {
        constructor(ruleType, providerArgs, themeService) {
            this._theme = themeService.getColorTheme();
            this._ruleType = ruleType;
            this._providerArgs = providerArgs;
            this._usesThemeColors = false;
            this._hasContent = false;
            this._hasLetterSpacing = false;
            let className = CSSNameHelper.getClassName(this._providerArgs.key, ruleType);
            if (this._providerArgs.parentTypeKey) {
                className = className + ' ' + CSSNameHelper.getClassName(this._providerArgs.parentTypeKey, ruleType);
            }
            this._className = className;
            this._unThemedSelector = CSSNameHelper.getSelector(this._providerArgs.key, this._providerArgs.parentTypeKey, ruleType);
            this._buildCSS();
            if (this._usesThemeColors) {
                this._themeListener = themeService.onDidColorThemeChange(theme => {
                    this._theme = themeService.getColorTheme();
                    this._removeCSS();
                    this._buildCSS();
                });
            }
            else {
                this._themeListener = null;
            }
        }
        dispose() {
            if (this._hasContent) {
                this._removeCSS();
                this._hasContent = false;
            }
            if (this._themeListener) {
                this._themeListener.dispose();
                this._themeListener = null;
            }
        }
        get hasContent() {
            return this._hasContent;
        }
        get hasLetterSpacing() {
            return this._hasLetterSpacing;
        }
        get className() {
            return this._className;
        }
        _buildCSS() {
            const options = this._providerArgs.options;
            let unthemedCSS, lightCSS, darkCSS;
            switch (this._ruleType) {
                case 0 /* ModelDecorationCSSRuleType.ClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationClassName(options.dark);
                    break;
                case 1 /* ModelDecorationCSSRuleType.InlineClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationInlineClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationInlineClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationInlineClassName(options.dark);
                    break;
                case 2 /* ModelDecorationCSSRuleType.GlyphMarginClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options.dark);
                    break;
                case 3 /* ModelDecorationCSSRuleType.BeforeContentClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.before);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.before);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.before);
                    break;
                case 4 /* ModelDecorationCSSRuleType.AfterContentClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.after);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.after);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.after);
                    break;
                case 5 /* ModelDecorationCSSRuleType.BeforeInjectedTextClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.beforeInjectedText);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.beforeInjectedText);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.beforeInjectedText);
                    break;
                case 6 /* ModelDecorationCSSRuleType.AfterInjectedTextClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.afterInjectedText);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.afterInjectedText);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.afterInjectedText);
                    break;
                default:
                    throw new Error('Unknown rule type: ' + this._ruleType);
            }
            const sheet = this._providerArgs.styleSheet;
            let hasContent = false;
            if (unthemedCSS.length > 0) {
                sheet.insertRule(this._unThemedSelector, unthemedCSS);
                hasContent = true;
            }
            if (lightCSS.length > 0) {
                sheet.insertRule(`.vs${this._unThemedSelector}, .hc-light${this._unThemedSelector}`, lightCSS);
                hasContent = true;
            }
            if (darkCSS.length > 0) {
                sheet.insertRule(`.vs-dark${this._unThemedSelector}, .hc-black${this._unThemedSelector}`, darkCSS);
                hasContent = true;
            }
            this._hasContent = hasContent;
        }
        _removeCSS() {
            this._providerArgs.styleSheet.removeRulesContainingSelector(this._unThemedSelector);
        }
        /**
         * Build the CSS for decorations styled via `className`.
         */
        getCSSTextForModelDecorationClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            this.collectCSSText(opts, ['backgroundColor'], cssTextArr);
            this.collectCSSText(opts, ['outline', 'outlineColor', 'outlineStyle', 'outlineWidth'], cssTextArr);
            this.collectBorderSettingsCSSText(opts, cssTextArr);
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled via `inlineClassName`.
         */
        getCSSTextForModelDecorationInlineClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            this.collectCSSText(opts, ['fontStyle', 'fontWeight', 'textDecoration', 'cursor', 'color', 'opacity', 'letterSpacing'], cssTextArr);
            if (opts.letterSpacing) {
                this._hasLetterSpacing = true;
            }
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled before or after content.
         */
        getCSSTextForModelDecorationContentClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            if (typeof opts !== 'undefined') {
                this.collectBorderSettingsCSSText(opts, cssTextArr);
                if (typeof opts.contentIconPath !== 'undefined') {
                    cssTextArr.push(strings.format(exports._CSS_MAP.contentIconPath, dom.asCSSUrl(uri_1.URI.revive(opts.contentIconPath))));
                }
                if (typeof opts.contentText === 'string') {
                    const truncated = opts.contentText.match(/^.*$/m)[0]; // only take first line
                    const escaped = truncated.replace(/['\\]/g, '\\$&');
                    cssTextArr.push(strings.format(exports._CSS_MAP.contentText, escaped));
                }
                this.collectCSSText(opts, ['verticalAlign', 'fontStyle', 'fontWeight', 'fontSize', 'fontFamily', 'textDecoration', 'color', 'opacity', 'backgroundColor', 'margin', 'padding'], cssTextArr);
                if (this.collectCSSText(opts, ['width', 'height'], cssTextArr)) {
                    cssTextArr.push('display:inline-block;');
                }
            }
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled via `glyphMarginClassName`.
         */
        getCSSTextForModelDecorationGlyphMarginClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            if (typeof opts.gutterIconPath !== 'undefined') {
                cssTextArr.push(strings.format(exports._CSS_MAP.gutterIconPath, dom.asCSSUrl(uri_1.URI.revive(opts.gutterIconPath))));
                if (typeof opts.gutterIconSize !== 'undefined') {
                    cssTextArr.push(strings.format(exports._CSS_MAP.gutterIconSize, opts.gutterIconSize));
                }
            }
            return cssTextArr.join('');
        }
        collectBorderSettingsCSSText(opts, cssTextArr) {
            if (this.collectCSSText(opts, ['border', 'borderColor', 'borderRadius', 'borderSpacing', 'borderStyle', 'borderWidth'], cssTextArr)) {
                cssTextArr.push(strings.format('box-sizing: border-box;'));
                return true;
            }
            return false;
        }
        collectCSSText(opts, properties, cssTextArr) {
            const lenBefore = cssTextArr.length;
            for (const property of properties) {
                const value = this.resolveValue(opts[property]);
                if (typeof value === 'string') {
                    cssTextArr.push(strings.format(exports._CSS_MAP[property], value));
                }
            }
            return cssTextArr.length !== lenBefore;
        }
        resolveValue(value) {
            if ((0, editorCommon_1.isThemeColor)(value)) {
                this._usesThemeColors = true;
                const color = this._theme.getColor(value.id);
                if (color) {
                    return color.toString();
                }
                return 'transparent';
            }
            return value;
        }
    }
    var ModelDecorationCSSRuleType;
    (function (ModelDecorationCSSRuleType) {
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["ClassName"] = 0] = "ClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["InlineClassName"] = 1] = "InlineClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["GlyphMarginClassName"] = 2] = "GlyphMarginClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["BeforeContentClassName"] = 3] = "BeforeContentClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["AfterContentClassName"] = 4] = "AfterContentClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["BeforeInjectedTextClassName"] = 5] = "BeforeInjectedTextClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["AfterInjectedTextClassName"] = 6] = "AfterInjectedTextClassName";
    })(ModelDecorationCSSRuleType || (ModelDecorationCSSRuleType = {}));
    class CSSNameHelper {
        static getClassName(key, type) {
            return 'ced-' + key + '-' + type;
        }
        static getSelector(key, parentKey, ruleType) {
            let selector = '.monaco-editor .' + this.getClassName(key, ruleType);
            if (parentKey) {
                selector = selector + '.' + this.getClassName(parentKey, ruleType);
            }
            if (ruleType === 3 /* ModelDecorationCSSRuleType.BeforeContentClassName */) {
                selector += '::before';
            }
            else if (ruleType === 4 /* ModelDecorationCSSRuleType.AfterContentClassName */) {
                selector += '::after';
            }
            return selector;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RDb2RlRWRpdG9yU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3NlcnZpY2VzL2Fic3RyYWN0Q29kZUVkaXRvclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFlLHlCQUF5QixHQUF4QyxNQUFlLHlCQUEwQixTQUFRLHNCQUFVO1FBbUNqRSxZQUNnQixhQUE2QztZQUU1RCxLQUFLLEVBQUUsQ0FBQztZQUZ3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQWhDNUMsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDL0QsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztZQUUzRCxxQkFBZ0IsR0FBeUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZSxDQUFDLENBQUM7WUFDckYsb0JBQWUsR0FBdUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUVqRSx3QkFBbUIsR0FBeUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZSxDQUFDLENBQUM7WUFDeEYsdUJBQWtCLEdBQXVCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFFdkUsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDL0QsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztZQUUzRCxxQkFBZ0IsR0FBeUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZSxDQUFDLENBQUM7WUFDckYsb0JBQWUsR0FBdUIs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