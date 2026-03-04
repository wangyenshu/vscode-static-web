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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverWidget", "vs/base/common/arraysFind", "vs/base/common/assert", "vs/base/common/cancellation", "vs/base/common/htmlContent", "vs/base/common/keyCodes", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/themables", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/contrib/hover/browser/hoverOperation", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/testCoverageService", "vs/workbench/contrib/testing/common/testingContextKeys"], function (require, exports, dom, hoverWidget_1, arraysFind_1, assert_1, cancellation_1, htmlContent_1, keyCodes_1, lazy_1, lifecycle_1, observable_1, themables_1, markdownRenderer_1, position_1, range_1, model_1, hoverOperation_1, nls_1, actionCommonCategories_1, actions_1, instantiation_1, keybinding_1, log_1, icons_1, testCoverageService_1, testingContextKeys_1) {
    "use strict";
    var CodeCoverageDecorations_1, LineHoverWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CoverageDetailsModel = exports.CodeCoverageDecorations = void 0;
    const MAX_HOVERED_LINES = 30;
    const CLASS_HIT = 'coverage-deco-hit';
    const CLASS_MISS = 'coverage-deco-miss';
    const TOGGLE_INLINE_COMMAND_TEXT = (0, nls_1.localize)('testing.toggleInlineCoverage', 'Toggle Inline Coverage');
    const TOGGLE_INLINE_COMMAND_ID = 'testing.toggleInlineCoverage';
    const BRANCH_MISS_INDICATOR_CHARS = 4;
    let CodeCoverageDecorations = class CodeCoverageDecorations extends lifecycle_1.Disposable {
        static { CodeCoverageDecorations_1 = this; }
        static { this.showInline = (0, observable_1.observableValue)('inlineCoverage', false); }
        static { this.fileCoverageDecorations = new WeakMap(); }
        constructor(editor, instantiationService, coverage, log) {
            super();
            this.editor = editor;
            this.log = log;
            this.displayedStore = this._register(new lifecycle_1.DisposableStore());
            this.hoveredStore = this._register(new lifecycle_1.DisposableStore());
            this.decorationIds = new Map();
            this.lineHoverWidget = new lazy_1.Lazy(() => this._register(instantiationService.createInstance(LineHoverWidget, this.editor)));
            const modelObs = (0, observable_1.observableFromEvent)(editor.onDidChangeModel, () => editor.getModel());
            const configObs = (0, observable_1.observableFromEvent)(editor.onDidChangeConfiguration, i => i);
            const fileCoverage = (0, observable_1.derived)(reader => {
                const report = coverage.selected.read(reader);
                if (!report) {
                    return;
                }
                const model = modelObs.read(reader);
                if (!model) {
                    return;
                }
                const file = report.getUri(model.uri);
                if (file) {
                    return file;
                }
                report.didAddCoverage.read(reader); // re-read if changes when there's no report
                return undefined;
            });
            this._register((0, observable_1.autorun)(reader => {
                const c = fileCoverage.read(reader);
                if (c) {
                    this.apply(editor.getModel(), c, CodeCoverageDecorations_1.showInline.read(reader));
                }
                else {
                    this.clear();
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                const c = fileCoverage.read(reader);
                if (c) {
                    const evt = configObs.read(reader);
                    if (evt?.hasChanged(67 /* EditorOption.lineHeight */) !== false) {
                        this.updateEditorStyles();
                    }
                }
            }));
            this._register(editor.onMouseMove(e => {
                const model = editor.getModel();
                if (e.target.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */ && model) {
                    this.hoverLineNumber(editor.getModel(), e.target.position.lineNumber);
                }
                else if (this.lineHoverWidget.hasValue && this.lineHoverWidget.value.getDomNode().contains(e.target.element)) {
                    // don't dismiss the hover
                }
                else if (CodeCoverageDecorations_1.showInline.get() && e.target.type === 6 /* MouseTargetType.CONTENT_TEXT */ && model) {
                    this.hoverInlineDecoration(model, e.target.position);
                }
                else {
                    this.hoveredStore.clear();
                }
            }));
            this._register(editor.onWillChangeModel(() => {
                const model = editor.getModel();
                if (!this.details || !model) {
                    return;
                }
                // Decorations adjust to local changes made in-editor, keep them synced in case the file is reopened:
                for (const decoration of model.getAllDecorations()) {
                    const own = this.decorationIds.get(decoration.id);
                    if (own) {
                        own.detail.range = decoration.range;
                    }
                }
            }));
        }
        updateEditorStyles() {
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            const { style } = this.editor.getContainerDomNode();
            style.setProperty('--vscode-testing-coverage-lineHeight', `${lineHeight}px`);
        }
        hoverInlineDecoration(model, position) {
            const allDecorations = model.getDecorationsInRange(range_1.Range.fromPositions(position));
            const decoration = (0, arraysFind_1.mapFindFirst)(allDecorations, ({ id }) => this.decorationIds.has(id) ? { id, deco: this.decorationIds.get(id) } : undefined);
            if (decoration === this.hoveredSubject) {
                return;
            }
            this.hoveredStore.clear();
            this.hoveredSubject = decoration;
            if (!decoration) {
                return;
            }
            model.changeDecorations(e => {
                e.changeDecorationOptions(decoration.id, {
                    ...decoration.deco.options,
                    className: `${decoration.deco.options.className} coverage-deco-hovered`,
                });
            });
            this.hoveredStore.add((0, lifecycle_1.toDisposable)(() => {
                this.hoveredSubject = undefined;
                model.changeDecorations(e => {
                    e.changeDecorationOptions(decoration.id, decoration.deco.options);
                });
            }));
        }
        hoverLineNumber(model, lineNumber) {
            if (lineNumber === this.hoveredSubject || !this.details) {
                return;
            }
            this.hoveredStore.clear();
            this.hoveredSubject = lineNumber;
            const todo = [{ line: lineNumber, dir: 0 }];
            const toEnable = new Set();
            const inlineEnabled = CodeCoverageDecorations_1.showInline.get();
            if (!CodeCoverageDecorations_1.showInline.get()) {
                for (let i = 0; i < todo.length && i < MAX_HOVERED_LINES; i++) {
                    const { line, dir } = todo[i];
                    let found = false;
                    for (const decoration of model.getLineDecorations(line)) {
                        if (this.decorationIds.has(decoration.id)) {
                            toEnable.add(decoration.id);
                            found = true;
                        }
                    }
                    if (found) {
                        if (dir <= 0) {
                            todo.push({ line: line - 1, dir: -1 });
                        }
                        if (dir >= 0) {
                            todo.push({ line: line + 1, dir: 1 });
                        }
                    }
                }
                model.changeDecorations(e => {
                    for (const id of toEnable) {
                        const { applyHoverOptions, options } = this.decorationIds.get(id);
                        const dup = { ...options };
                        applyHoverOptions(dup);
                        e.changeDecorationOptions(id, dup);
                    }
                });
            }
            if (toEnable.size || inlineEnabled) {
                this.lineHoverWidget.value.startShowingAt(lineNumber);
            }
            this.hoveredStore.add(this.editor.onMouseLeave(() => {
                this.hoveredStore.clear();
            }));
            this.hoveredStore.add((0, lifecycle_1.toDisposable)(() => {
                this.lineHoverWidget.value.hide();
                this.hoveredSubject = undefined;
                model.changeDecorations(e => {
                    for (const id of toEnable) {
                        const deco = this.decorationIds.get(id);
                        if (deco) {
                            e.changeDecorationOptions(id, deco.options);
                        }
                    }
                });
            }));
        }
        async apply(model, coverage, showInlineByDefault) {
            const details = this.details = await this.loadDetails(coverage, model);
            if (!details) {
                return this.clear();
            }
            this.displayedStore.clear();
            model.changeDecorations(e => {
                for (const detailRange of details.ranges) {
                    const { metadata: { detail, description }, range, primary } = detailRange;
                    if (detail.type === 2 /* DetailType.Branch */) {
                        const hits = detail.detail.branches[detail.branch].count;
                        const cls = hits ? CLASS_HIT : CLASS_MISS;
                        // don't bother showing the miss indicator if the condition wasn't executed at all:
                        const showMissIndicator = !hits && range.isEmpty() && detail.detail.branches.some(b => b.count);
                        const options = {
                            showIfCollapsed: showMissIndicator, // only avoid collapsing if we want to show the miss indicator
                            description: 'coverage-gutter',
                            lineNumberClassName: `coverage-deco-gutter ${cls}`,
                        };
                        const applyHoverOptions = (target) => {
                            target.hoverMessage = description;
                            if (showMissIndicator) {
                                target.after = {
                                    content: '\xa0'.repeat(BRANCH_MISS_INDICATOR_CHARS), // nbsp
                                    inlineClassName: `coverage-deco-branch-miss-indicator ${themables_1.ThemeIcon.asClassName(icons_1.testingCoverageMissingBranch)}`,
                                    inlineClassNameAffectsLetterSpacing: true,
                                    cursorStops: model_1.InjectedTextCursorStops.None,
                                };
                            }
                            else {
                                target.className = `coverage-deco-inline ${cls}`;
                                if (primary && typeof hits === 'number') {
                                    target.before = countBadge(hits);
                                }
                            }
                        };
                        if (showInlineByDefault) {
                            applyHoverOptions(options);
                        }
                        this.decorationIds.set(e.addDecoration(range, options), { options, applyHoverOptions, detail: detailRange });
                    }
                    else if (detail.type === 1 /* DetailType.Statement */) {
                        const cls = detail.count ? CLASS_HIT : CLASS_MISS;
                        const options = {
                            showIfCollapsed: false,
                            description: 'coverage-inline',
                            lineNumberClassName: `coverage-deco-gutter ${cls}`,
                        };
                        const applyHoverOptions = (target) => {
                            target.className = `coverage-deco-inline ${cls}`;
                            target.hoverMessage = description;
                            if (primary && typeof detail.count === 'number') {
                                target.before = countBadge(detail.count);
                            }
                        };
                        if (showInlineByDefault) {
                            applyHoverOptions(options);
                        }
                        this.decorationIds.set(e.addDecoration(range, options), { options, applyHoverOptions, detail: detailRange });
                    }
                }
            });
            this.displayedStore.add((0, lifecycle_1.toDisposable)(() => {
                model.changeDecorations(e => {
                    for (const decoration of this.decorationIds.keys()) {
                        e.removeDecoration(decoration);
                    }
                    this.decorationIds.clear();
                });
            }));
        }
        clear() {
            this.loadingCancellation?.cancel();
            this.loadingCancellation = undefined;
            this.displayedStore.clear();
            this.hoveredStore.clear();
        }
        async loadDetails(coverage, textModel) {
            const existing = CodeCoverageDecorations_1.fileCoverageDecorations.get(coverage);
            if (existing) {
                return existing;
            }
            const cts = this.loadingCancellation = new cancellation_1.CancellationTokenSource();
            this.displayedStore.add(this.loadingCancellation);
            try {
                const details = await coverage.details(this.loadingCancellation.token);
                if (cts.token.isCancellationRequested) {
                    return;
                }
                const model = CodeCoverageDecorations_1.fileCoverageDecorations.get(coverage)
                    || new CoverageDetailsModel(details, textModel);
                CodeCoverageDecorations_1.fileCoverageDecorations.set(coverage, model);
                return model;
            }
            catch (e) {
                this.log.error('Error loading coverage details', e);
            }
            return undefined;
        }
    };
    exports.CodeCoverageDecorations = CodeCoverageDecorations;
    exports.CodeCoverageDecorations = CodeCoverageDecorations = CodeCoverageDecorations_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, testCoverageService_1.ITestCoverageService),
        __param(3, log_1.ILogService)
    ], CodeCoverageDecorations);
    const countBadge = (count) => {
        if (count === 0) {
            return undefined;
        }
        return {
            content: `${count > 99 ? '99+' : count}x`,
            cursorStops: model_1.InjectedTextCursorStops.None,
            inlineClassName: `coverage-deco-inline-count`,
            inlineClassNameAffectsLetterSpacing: true,
        };
    };
    class CoverageDetailsModel {
        constructor(details, textModel) {
            this.details = details;
            this.ranges = [];
            //#region decoration generation
            // Coverage from a provider can have a range that contains smaller ranges,
            // such as a function declaration that has nested statements. In this we
            // make sequential, non-overlapping ranges for each detail for display in
            // the editor without ugly overlaps.
            const detailRanges = details.map(detail => ({
                range: tidyLocation(detail.location),
                primary: true,
                metadata: { detail, description: this.describe(detail, textModel) }
            }));
            for (const { range, metadata: { detail } } of detailRanges) {
                if (detail.type === 1 /* DetailType.Statement */ && detail.branches) {
                    for (let i = 0; i < detail.branches.length; i++) {
                        const branch = { type: 2 /* DetailType.Branch */, branch: i, detail };
                        detailRanges.push({
                            range: tidyLocation(detail.branches[i].location || range_1.Range.fromPositions(range.getEndPosition())),
                            primary: true,
                            metadata: {
                                detail: branch,
                                description: this.describe(branch, textModel),
                            },
                        });
                    }
                }
            }
            // type ordering is done so that function declarations come first on a tie so that
            // single-statement functions (`() => foo()` for example) get inline decorations.
            detailRanges.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range) || a.metadata.detail.type - b.metadata.detail.type);
            const stack = [];
            const result = this.ranges = [];
            const pop = () => {
                const next = stack.pop();
                const prev = stack[stack.length - 1];
                if (prev) {
                    prev.range = prev.range.setStartPosition(next.range.endLineNumber, next.range.endColumn);
                }
                result.push(next);
            };
            for (const item of detailRanges) {
                // 1. Ensure that any ranges in the stack that ended before this are flushed
                const start = item.range.getStartPosition();
                while (stack[stack.length - 1]?.range.containsPosition(start) === false) {
                    pop();
                }
                // Empty ranges (usually representing missing branches) can be added
                // without worry about overlay.
                if (item.range.isEmpty()) {
                    result.push(item);
                    continue;
                }
                // 2. Take the last (overlapping) item in the stack, push range before
                // the `item.range` into the result and modify its stack to push the start
                // until after the `item.range` ends.
                const prev = stack[stack.length - 1];
                if (prev) {
                    const primary = prev.primary;
                    const si = prev.range.setEndPosition(start.lineNumber, start.column);
                    prev.range = prev.range.setStartPosition(item.range.endLineNumber, item.range.endColumn);
                    prev.primary = false;
                    // discard the previous range if it became empty, e.g. a nested statement
                    if (prev.range.isEmpty()) {
                        stack.pop();
                    }
                    result.push({ range: si, primary, metadata: prev.metadata });
                }
                stack.push(item);
            }
            while (stack.length) {
                pop();
            }
            //#endregion
        }
        /** Gets the markdown description for the given detail */
        describe(detail, model) {
            if (detail.type === 0 /* DetailType.Declaration */) {
                return namedDetailLabel(detail.name, detail);
            }
            else if (detail.type === 1 /* DetailType.Statement */) {
                const text = wrapName(model.getValueInRange(tidyLocation(detail.location)).trim() || `<empty statement>`);
                if (detail.branches?.length) {
                    const covered = detail.branches.filter(b => !!b.count).length;
                    return new htmlContent_1.MarkdownString().appendMarkdown((0, nls_1.localize)('coverage.branches', '{0} of {1} of branches in {2} were covered.', covered, detail.branches.length, text));
                }
                else {
                    return namedDetailLabel(text, detail);
                }
            }
            else if (detail.type === 2 /* DetailType.Branch */) {
                const text = wrapName(model.getValueInRange(tidyLocation(detail.detail.location)).trim() || `<empty statement>`);
                const { count, label } = detail.detail.branches[detail.branch];
                const label2 = label ? wrapInBackticks(label) : `#${detail.branch + 1}`;
                if (!count) {
                    return new htmlContent_1.MarkdownString().appendMarkdown((0, nls_1.localize)('coverage.branchNotCovered', 'Branch {0} in {1} was not covered.', label2, text));
                }
                else if (count === true) {
                    return new htmlContent_1.MarkdownString().appendMarkdown((0, nls_1.localize)('coverage.branchCoveredYes', 'Branch {0} in {1} was executed.', label2, text));
                }
                else {
                    return new htmlContent_1.MarkdownString().appendMarkdown((0, nls_1.localize)('coverage.branchCovered', 'Branch {0} in {1} was executed {2} time(s).', label2, text, count));
                }
            }
            (0, assert_1.assertNever)(detail);
        }
    }
    exports.CoverageDetailsModel = CoverageDetailsModel;
    function namedDetailLabel(name, detail) {
        return new htmlContent_1.MarkdownString().appendMarkdown(!detail.count // 0 or false
            ? (0, nls_1.localize)('coverage.declExecutedNo', '`{0}` was not executed.', name)
            : typeof detail.count === 'number'
                ? (0, nls_1.localize)('coverage.declExecutedCount', '`{0}` was executed {1} time(s).', name, detail.count)
                : (0, nls_1.localize)('coverage.declExecutedYes', '`{0}` was executed.', name));
    }
    // 'tidies' the range by normalizing it into a range and removing leading
    // and trailing whitespace.
    function tidyLocation(location) {
        if (location instanceof position_1.Position) {
            return range_1.Range.fromPositions(location, new position_1.Position(location.lineNumber, 0x7FFFFFFF));
        }
        return location;
    }
    let LineHoverComputer = class LineHoverComputer {
        constructor(keybindingService) {
            this.keybindingService = keybindingService;
            this.line = -1;
        }
        /** @inheritdoc */
        computeSync() {
            const strs = [];
            const s = new htmlContent_1.MarkdownString().appendMarkdown(`[${TOGGLE_INLINE_COMMAND_TEXT}](command:${TOGGLE_INLINE_COMMAND_ID})`);
            s.isTrusted = true;
            const binding = this.keybindingService.lookupKeybinding(TOGGLE_INLINE_COMMAND_ID);
            if (binding) {
                s.appendText(` (${binding.getLabel()})`);
            }
            strs.push(s);
            return strs;
        }
    };
    LineHoverComputer = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], LineHoverComputer);
    function wrapInBackticks(str) {
        return '`' + str.replace(/[\n\r`]/g, '') + '`';
    }
    function wrapName(functionNameOrCode) {
        if (functionNameOrCode.length > 50) {
            functionNameOrCode = functionNameOrCode.slice(0, 40) + '...';
        }
        return wrapInBackticks(functionNameOrCode);
    }
    let LineHoverWidget = class LineHoverWidget extends lifecycle_1.Disposable {
        static { LineHoverWidget_1 = this; }
        static { this.ID = 'editor.contrib.testingCoverageLineHoverWidget'; }
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.hover = this._register(new hoverWidget_1.HoverWidget());
            this.renderDisposables = this._register(new lifecycle_1.DisposableStore());
            this.computer = instantiationService.createInstance(LineHoverComputer);
            this.markdownRenderer = this._register(instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, { editor: this.editor }));
            this.hoverOperation = this._register(new hoverOperation_1.HoverOperation(this.editor, this.computer));
            this.hover.containerDomNode.classList.add('hidden');
            this.hoverOperation.onResult(result => {
                if (result.value.length) {
                    this.render(result.value);
                }
                else {
                    this.hide();
                }
            });
            this.editor.addOverlayWidget(this);
        }
        /** @inheritdoc */
        getId() {
            return LineHoverWidget_1.ID;
        }
        /** @inheritdoc */
        getDomNode() {
            return this.hover.containerDomNode;
        }
        /** @inheritdoc */
        getPosition() {
            return null;
        }
        /** @inheritdoc */
        dispose() {
            this.editor.removeOverlayWidget(this);
            super.dispose();
        }
        /** Shows the hover widget at the given line */
        startShowingAt(lineNumber) {
            this.hide();
            const textModel = this.editor.getModel();
            if (!textModel) {
                return;
            }
            this.computer.line = lineNumber;
            this.hoverOperation.start(0 /* HoverStartMode.Delayed */);
        }
        /** Hides the hover widget */
        hide() {
            this.hoverOperation.cancel();
            this.hover.containerDomNode.classList.add('hidden');
        }
        render(elements) {
            const { hover: h, editor: editor } = this;
            const fragment = document.createDocumentFragment();
            for (const msg of elements) {
                const markdownHoverElement = dom.$('div.hover-row.markdown-hover');
                const hoverContentsElement = dom.append(markdownHoverElement, dom.$('div.hover-contents'));
                const renderedContents = this.renderDisposables.add(this.markdownRenderer.render(msg));
                hoverContentsElement.appendChild(renderedContents.element);
                fragment.appendChild(markdownHoverElement);
            }
            dom.clearNode(h.contentsDomNode);
            h.contentsDomNode.appendChild(fragment);
            h.containerDomNode.classList.remove('hidden');
            const editorLayout = editor.getLayoutInfo();
            const topForLineNumber = editor.getTopForLineNumber(this.computer.line);
            const editorScrollTop = editor.getScrollTop();
            const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
            const nodeHeight = h.containerDomNode.clientHeight;
            const top = topForLineNumber - editorScrollTop - ((nodeHeight - lineHeight) / 2);
            const left = editorLayout.lineNumbersLeft + editorLayout.lineNumbersWidth;
            h.containerDomNode.style.left = `${left}px`;
            h.containerDomNode.style.top = `${Math.max(Math.round(top), 0)}px`;
        }
    };
    LineHoverWidget = LineHoverWidget_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], LineHoverWidget);
    (0, actions_1.registerAction2)(class ToggleInlineCoverage extends actions_1.Action2 {
        constructor() {
            super({
                id: TOGGLE_INLINE_COMMAND_ID,
                title: (0, nls_1.localize2)('coverage.toggleInline', "Toggle Inline Coverage"),
                category: actionCommonCategories_1.Categories.Test,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */),
                },
                precondition: testingContextKeys_1.TestingContextKeys.isTestCoverageOpen,
            });
        }
        run() {
            CodeCoverageDecorations.showInline.set(!CodeCoverageDecorations.showInline.get(), undefined);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUNvdmVyYWdlRGVjb3JhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvY29kZUNvdmVyYWdlRGVjb3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtDaEcsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLENBQUM7SUFDN0IsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUM7SUFDdEMsTUFBTSxVQUFVLEdBQUcsb0JBQW9CLENBQUM7SUFDeEMsTUFBTSwwQkFBMEIsR0FBRyxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO0lBQ3RHLE1BQU0sd0JBQXdCLEdBQUcsOEJBQThCLENBQUM7SUFDaEUsTUFBTSwyQkFBMkIsR0FBRyxDQUFDLENBQUM7SUFFL0IsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTs7aUJBQ3hDLGVBQVUsR0FBRyxJQUFBLDRCQUFlLEVBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLEFBQTNDLENBQTRDO2lCQUM1Qyw0QkFBdUIsR0FBRyxJQUFJLE9BQU8sRUFBc0MsQUFBcEQsQ0FBcUQ7UUFjcEcsWUFDa0IsTUFBbUIsRUFDYixvQkFBMkMsRUFDNUMsUUFBOEIsRUFDdkMsR0FBaUM7WUFFOUMsS0FBSyxFQUFFLENBQUM7WUFMUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBR04sUUFBRyxHQUFILEdBQUcsQ0FBYTtZQWY5QixtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUN2RCxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FB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