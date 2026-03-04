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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model/textModel", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "./snippetParser", "./snippetVariables", "vs/css!./snippetSession"], function (require, exports, arrays_1, lifecycle_1, strings_1, editOperation_1, range_1, selection_1, languageConfigurationRegistry_1, textModel_1, label_1, workspace_1, snippetParser_1, snippetVariables_1) {
    "use strict";
    var SnippetSession_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetSession = exports.OneSnippet = void 0;
    class OneSnippet {
        static { this._decor = {
            active: textModel_1.ModelDecorationOptions.register({ description: 'snippet-placeholder-1', stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, className: 'snippet-placeholder' }),
            inactive: textModel_1.ModelDecorationOptions.register({ description: 'snippet-placeholder-2', stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, className: 'snippet-placeholder' }),
            activeFinal: textModel_1.ModelDecorationOptions.register({ description: 'snippet-placeholder-3', stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, className: 'finish-snippet-placeholder' }),
            inactiveFinal: textModel_1.ModelDecorationOptions.register({ description: 'snippet-placeholder-4', stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, className: 'finish-snippet-placeholder' }),
        }; }
        constructor(_editor, _snippet, _snippetLineLeadingWhitespace) {
            this._editor = _editor;
            this._snippet = _snippet;
            this._snippetLineLeadingWhitespace = _snippetLineLeadingWhitespace;
            this._offset = -1;
            this._nestingLevel = 1;
            this._placeholderGroups = (0, arrays_1.groupBy)(_snippet.placeholders, snippetParser_1.Placeholder.compareByIndex);
            this._placeholderGroupsIdx = -1;
        }
        initialize(textChange) {
            this._offset = textChange.newPosition;
        }
        dispose() {
            if (this._placeholderDecorations) {
                this._editor.removeDecorations([...this._placeholderDecorations.values()]);
            }
            this._placeholderGroups.length = 0;
        }
        _initDecorations() {
            if (this._offset === -1) {
                throw new Error(`Snippet not initialized!`);
            }
            if (this._placeholderDecorations) {
                // already initialized
                return;
            }
            this._placeholderDecorations = new Map();
            const model = this._editor.getModel();
            this._editor.changeDecorations(accessor => {
                // create a decoration for each placeholder
                for (const placeholder of this._snippet.placeholders) {
                    const placeholderOffset = this._snippet.offset(placeholder);
                    const placeholderLen = this._snippet.fullLen(placeholder);
                    const range = range_1.Range.fromPositions(model.getPositionAt(this._offset + placeholderOffset), model.getPositionAt(this._offset + placeholderOffset + placeholderLen));
                    const options = placeholder.isFinalTabstop ? OneSnippet._decor.inactiveFinal : OneSnippet._decor.inactive;
                    const handle = accessor.addDecoration(range, options);
                    this._placeholderDecorations.set(placeholder, handle);
                }
            });
        }
        move(fwd) {
            if (!this._editor.hasModel()) {
                return [];
            }
            this._initDecorations();
            // Transform placeholder text if necessary
            if (this._placeholderGroupsIdx >= 0) {
                const operations = [];
                for (const placeholder of this._placeholderGroups[this._placeholderGroupsIdx]) {
                    // Check if the placeholder has a transformation
                    if (placeholder.transform) {
                        const id = this._placeholderDecorations.get(placeholder);
                        const range = this._editor.getModel().getDecorationRange(id);
                        const currentValue = this._editor.getModel().getValueInRange(range);
                        const transformedValueLines = placeholder.transform.resolve(currentValue).split(/\r\n|\r|\n/);
                        // fix indentation for transformed lines
                        for (let i = 1; i < transformedValueLines.length; i++) {
                            transformedValueLines[i] = this._editor.getModel().normalizeIndentation(this._snippetLineLeadingWhitespace + transformedValueLines[i]);
                        }
                        operations.push(editOperation_1.EditOperation.replace(range, transformedValueLines.join(this._editor.getModel().getEOL())));
                    }
                }
                if (operations.length > 0) {
                    this._editor.executeEdits('snippet.placeholderTransform', operations);
                }
            }
            let couldSkipThisPlaceholder = false;
            if (fwd === true && this._placeholderGroupsIdx < this._placeholderGroups.length - 1) {
                this._placeholderGroupsIdx += 1;
                couldSkipThisPlaceholder = true;
            }
            else if (fwd === false && this._placeholderGroupsIdx > 0) {
                this._placeholderGroupsIdx -= 1;
                couldSkipThisPlaceholder = true;
            }
            else {
                // the selection of the current placeholder might
                // not acurate any more -> simply restore it
            }
            const newSelections = this._editor.getModel().changeDecorations(accessor => {
                const activePlaceholders = new Set();
                // change stickiness to always grow when typing at its edges
                // because these decorations represent the currently active
                // tabstop.
                // Special case #1: reaching the final tabstop
                // Special case #2: placeholders enclosing active placeholders
                const selections = [];
                for (const placeholder of this._placeholderGroups[this._placeholderGroupsIdx]) {
                    const id = this._placeholderDecorations.get(placeholder);
                    const range = this._editor.getModel().getDecorationRange(id);
                    selections.push(new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn));
                    // consider to skip this placeholder index when the decoration
                    // range is empty but when the placeholder wasn't. that's a strong
                    // hint that the placeholder has been deleted. (all placeholder must match this)
                    couldSkipThisPlaceholder = couldSkipThisPlaceholder && this._hasPlaceholderBeenCollapsed(placeholder);
                    accessor.changeDecorationOptions(id, placeholder.isFinalTabstop ? OneSnippet._decor.activeFinal : OneSnippet._decor.active);
                    activePlaceholders.add(placeholder);
                    for (const enclosingPlaceholder of this._snippet.enclosingPlaceholders(placeholder)) {
                        const id = this._placeholderDecorations.get(enclosingPlaceholder);
                        accessor.changeDecorationOptions(id, enclosingPlaceholder.isFinalTabstop ? OneSnippet._decor.activeFinal : OneSnippet._decor.active);
                        activePlaceholders.add(enclosingPlaceholder);
                    }
                }
                // change stickness to never grow when typing at its edges
                // so that in-active tabstops never grow
                for (const [placeholder, id] of this._placeholderDecorations) {
                    if (!activePlaceholders.has(placeholder)) {
                        accessor.changeDecorationOptions(id, placeholder.isFinalTabstop ? OneSnippet._decor.inactiveFinal : OneSnippet._decor.inactive);
                    }
                }
                return selections;
            });
            return !couldSkipThisPlaceholder ? newSelections ?? [] : this.move(fwd);
        }
        _hasPlaceholderBeenCollapsed(placeholder) {
            // A placeholder is empty when it wasn't empty when authored but
            // when its tracking decoration is empty. This also applies to all
            // potential parent placeholders
            let marker = placeholder;
            while (marker) {
                if (marker instanceof snippetParser_1.Placeholder) {
                    const id = this._placeholderDecorations.get(marker);
                    const range = this._editor.getModel().getDecorationRange(id);
                    if (range.isEmpty() && marker.toString().length > 0) {
                        return true;
                    }
                }
                marker = marker.parent;
            }
            return false;
        }
        get isAtFirstPlaceholder() {
            return this._placeholderGroupsIdx <= 0 || this._placeholderGroups.length === 0;
        }
        get isAtLastPlaceholder() {
            return this._placeholderGroupsIdx === this._placeholderGroups.length - 1;
        }
        get hasPlaceholder() {
            return this._snippet.placeholders.length > 0;
        }
        /**
         * A snippet is trivial when it has no placeholder or only a final placeholder at
         * its very end
         */
        get isTrivialSnippet() {
            if (this._snippet.placeholders.length === 0) {
                return true;
            }
            if (this._snippet.placeholders.length === 1) {
                const [placeholder] = this._snippet.placeholders;
                if (placeholder.isFinalTabstop) {
                    if (this._snippet.rightMostDescendant === placeholder) {
                        return true;
                    }
                }
            }
            return false;
        }
        computePossibleSelections() {
            const result = new Map();
            for (const placeholdersWithEqualIndex of this._placeholderGroups) {
                let ranges;
                for (const placeholder of placeholdersWithEqualIndex) {
                    if (placeholder.isFinalTabstop) {
                        // ignore those
                        break;
                    }
                    if (!ranges) {
                        ranges = [];
                        result.set(placeholder.index, ranges);
                    }
                    const id = this._placeholderDecorations.get(placeholder);
                    const range = this._editor.getModel().getDecorationRange(id);
                    if (!range) {
                        // one of the placeholder lost its decoration and
                        // therefore we bail out and pretend the placeholder
                        // (with its mirrors) doesn't exist anymore.
                        result.delete(placeholder.index);
                        break;
                    }
                    ranges.push(range);
                }
            }
            return result;
        }
        get activeChoice() {
            if (!this._placeholderDecorations) {
                return undefined;
            }
            const placeholder = this._placeholderGroups[this._placeholderGroupsIdx][0];
            if (!placeholder?.choice) {
                return undefined;
            }
            const id = this._placeholderDecorations.get(placeholder);
            if (!id) {
                return undefined;
            }
            const range = this._editor.getModel().getDecorationRange(id);
            if (!range) {
                return undefined;
            }
            return { range, choice: placeholder.choice };
        }
        get hasChoice() {
            let result = false;
            this._snippet.walk(marker => {
                result = marker instanceof snippetParser_1.Choice;
                return !result;
            });
            return result;
        }
        merge(others) {
            const model = this._editor.getModel();
            this._nestingLevel *= 10;
            this._editor.changeDecorations(accessor => {
                // For each active placeholder take one snippet and merge it
                // in that the placeholder (can be many for `$1foo$1foo`). Because
                // everything is sorted by editor selection we can simply remove
                // elements from the beginning of the array
                for (const placeholder of this._placeholderGroups[this._placeholderGroupsIdx]) {
                    const nested = others.shift();
                    console.assert(nested._offset !== -1);
                    console.assert(!nested._placeholderDecorations);
                    // Massage placeholder-indicies of the nested snippet to be
                    // sorted right after the insertion point. This ensures we move
                    // through the placeholders in the correct order
                    const indexLastPlaceholder = nested._snippet.placeholderInfo.last.index;
                    for (const nestedPlaceholder of nested._snippet.placeholderInfo.all) {
                        if (nestedPlaceholder.isFinalTabstop) {
                            nestedPlaceholder.index = placeholder.index + ((indexLastPlaceholder + 1) / this._nestingLevel);
                        }
                        else {
                            nestedPlaceholder.index = placeholder.index + (nestedPlaceholder.index / this._nestingLevel);
                        }
                    }
                    this._snippet.replace(placeholder, nested._snippet.children);
                    // Remove the placeholder at which position are inserting
                    // the snippet and also remove its decoration.
                    const id = this._placeholderDecorations.get(placeholder);
                    accessor.removeDecoration(id);
                    this._placeholderDecorations.delete(placeholder);
                    // For each *new* placeholder we create decoration to monitor
                    // how and if it grows/shrinks.
                    for (const placeholder of nested._snippet.placeholders) {
                        const placeholderOffset = nested._snippet.offset(placeholder);
                        const placeholderLen = nested._snippet.fullLen(placeholder);
                        const range = range_1.Range.fromPositions(model.getPositionAt(nested._offset + placeholderOffset), model.getPositionAt(nested._offset + placeholderOffset + placeholderLen));
                        const handle = accessor.addDecoration(range, OneSnippet._decor.inactive);
                        this._placeholderDecorations.set(placeholder, handle);
                    }
                }
                // Last, re-create the placeholder groups by sorting placeholders by their index.
                this._placeholderGroups = (0, arrays_1.groupBy)(this._snippet.placeholders, snippetParser_1.Placeholder.compareByIndex);
            });
        }
        getEnclosingRange() {
            let result;
            const model = this._editor.getModel();
            for (const decorationId of this._placeholderDecorations.values()) {
                const placeholderRange = model.getDecorationRange(decorationId) ?? undefined;
                if (!result) {
                    result = placeholderRange;
                }
                else {
                    result = result.plusRange(placeholderRange);
                }
            }
            return result;
        }
    }
    exports.OneSnippet = OneSnippet;
    const _defaultOptions = {
        overwriteBefore: 0,
        overwriteAfter: 0,
        adjustWhitespace: true,
        clipboardText: undefined,
        overtypingCapturer: undefined
    };
    let SnippetSession = SnippetSession_1 = class SnippetSession {
        static adjustWhitespace(model, position, adjustIndentation, snippet, filter) {
            const line = model.getLineContent(position.lineNumber);
            const lineLeadingWhitespace = (0, strings_1.getLeadingWhitespace)(line, 0, position.column - 1);
            // the snippet as inserted
            let snippetTextString;
            snippet.walk(marker => {
                // all text elements that are not inside choice
                if (!(marker instanceof snippetParser_1.Text) || marker.parent instanceof snippetParser_1.Choice) {
                    return true;
                }
                // check with filter (iff provided)
                if (filter && !filter.has(marker)) {
                    return true;
                }
                const lines = marker.value.split(/\r\n|\r|\n/);
                if (adjustIndentation) {
                    // adjust indentation of snippet test
                    // -the snippet-start doesn't get extra-indented (lineLeadingWhitespace), only normalized
                    // -all N+1 lines get extra-indented and normalized
                    // -the text start get extra-indented and normalized when following a linebreak
                    const offset = snippet.offset(marker);
                    if (offset === 0) {
                        // snippet start
                        lines[0] = model.normalizeIndentation(lines[0]);
                    }
                    else {
                        // check if text start is after a linebreak
                        snippetTextString = snippetTextString ?? snippet.toString();
                        const prevChar = snippetTextString.charCodeAt(offset - 1);
                        if (prevChar === 10 /* CharCode.LineFeed */ || prevChar === 13 /* CharCode.CarriageReturn */) {
                            lines[0] = model.normalizeIndentation(lineLeadingWhitespace + lines[0]);
                        }
                    }
                    for (let i = 1; i < lines.length; i++) {
                        lines[i] = model.normalizeIndentation(lineLeadingWhitespace + lines[i]);
                    }
                }
                const newValue = lines.join(model.getEOL());
                if (newValue !== marker.value) {
                    marker.parent.replace(marker, [new snippetParser_1.Text(newValue)]);
                    snippetTextString = undefined;
                }
                return true;
            });
            return lineLeadingWhitespace;
        }
        static adjustSelection(model, selection, overwriteBefore, overwriteAfter) {
            if (overwriteBefore !== 0 || overwriteAfter !== 0) {
                // overwrite[Before|After] is compute using the position, not the whole
                // selection. therefore we adjust the selection around that position
                const { positionLineNumber, positionColumn } = selection;
                const positionColumnBefore = positionColumn - overwriteBefore;
                const positionColumnAfter = positionColumn + overwriteAfter;
                const range = model.validateRange({
                    startLineNumber: positionLineNumber,
                    startColumn: positionColumnBefore,
                    endLineNumber: positionLineNumber,
                    endColumn: positionColumnAfter
                });
                selection = selection_1.Selection.createWithDirection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn, selection.getDirection());
            }
            return selection;
        }
        static createEditsAndSnippetsFromSelections(editor, template, overwriteBefore, overwriteAfter, enforceFinalTabstop, adjustWhitespace, clipboardText, overtypingCapturer, languageConfigurationService) {
            const edits = [];
            const snippets = [];
            if (!editor.hasModel()) {
                return { edits, snippets };
            }
            const model = editor.getModel();
            const workspaceService = editor.invokeWithinContext(accessor => accessor.get(workspace_1.IWorkspaceContextService));
            const modelBasedVariableResolver = editor.invokeWithinContext(accessor => new snippetVariables_1.ModelBasedVariableResolver(accessor.get(label_1.ILabelService), model));
            const readClipboardText = () => clipboardText;
            // know what text the overwrite[Before|After] extensions
            // of the primary curser have selected because only when
            // secondary selections extend to the same text we can grow them
            const firstBeforeText = model.getValueInRange(SnippetSession_1.adjustSelection(model, editor.getSelection(), overwriteBefore, 0));
            const firstAfterText = model.getValueInRange(SnippetSession_1.adjustSelection(model, editor.getSelection(), 0, overwriteAfter));
            // remember the first non-whitespace column to decide if
            // `keepWhitespace` should be overruled for secondary selections
            const firstLineFirstNonWhitespace = model.getLineFirstNonWhitespaceColumn(editor.getSelection().positionLineNumber);
            // sort selections by their start position but remeber
            // the original index. that allows you to create correct
            // offset-based selection logic without changing the
            // primary selection
            const indexedSelections = editor.getSelections()
                .map((selection, idx) => ({ selection, idx }))
                .sort((a, b) => range_1.Range.compareRangesUsingStarts(a.selection, b.selection));
            for (const { selection, idx } of indexedSelections) {
                // extend selection with the `overwriteBefore` and `overwriteAfter` and then
                // compare if this matches the extensions of the primary selection
                let extensionBefore = SnippetSession_1.adjustSelection(model, selection, overwriteBefore, 0);
                let extensionAfter = SnippetSession_1.adjustSelection(model, selection, 0, overwriteAfter);
                if (firstBeforeText !== model.getValueInRange(extensionBefore)) {
                    extensionBefore = selection;
                }
                if (firstAfterText !== model.getValueInRange(extensionAfter)) {
                    extensionAfter = selection;
                }
                // merge the before and after selection into one
                const snippetSelection = selection
                    .setStartPosition(extensionBefore.startLineNumber, extensionBefore.startColumn)
                    .setEndPosition(extensionAfter.endLineNumber, extensionAfter.endColumn);
                const snippet = new snippetParser_1.SnippetParser().parse(template, true, enforceFinalTabstop);
                // adjust the template string to match the indentation and
                // whitespace rules of this insert location (can be different for each cursor)
                // happens when being asked for (default) or when this is a secondary
                // cursor and the leading whitespace is different
                const start = snippetSelection.getStartPosition();
                const snippetLineLeadingWhitespace = SnippetSession_1.adjustWhitespace(model, start, adjustWhitespace || (idx > 0 && firstLineFirstNonWhitespace !== model.getLineFirstNonWhitespaceColumn(selection.positionLineNumber)), snippet);
                snippet.resolveVariables(new snippetVariables_1.CompositeSnippetVariableResolver([
                    modelBasedVariableResolver,
                    new snippetVariables_1.ClipboardBasedVariableResolver(readClipboardText, idx, indexedSelections.length, editor.getOption(79 /* EditorOption.multiCursorPaste */) === 'spread'),
                    new snippetVariables_1.SelectionBasedVariableResolver(model, selection, idx, overtypingCapturer),
                    new snippetVariables_1.CommentBasedVariableResolver(model, selection, languageConfigurationService),
                    new snippetVariables_1.TimeBasedVariableResolver,
                    new snippetVariables_1.WorkspaceBasedVariableResolver(workspaceService),
                    new snippetVariables_1.RandomBasedVariableResolver,
                ]));
                // store snippets with the index of their originating selection.
                // that ensures the primiary cursor stays primary despite not being
                // the one with lowest start position
                edits[idx] = editOperation_1.EditOperation.replace(snippetSelection, snippet.toString());
                edits[idx].identifier = { major: idx, minor: 0 }; // mark the edit so only our undo edits will be used to generate end cursors
                edits[idx]._isTracked = true;
                snippets[idx] = new OneSnippet(editor, snippet, snippetLineLeadingWhitespace);
            }
            return { edits, snippets };
        }
        static createEditsAndSnippetsFromEdits(editor, snippetEdits, enforceFinalTabstop, adjustWhitespace, clipboardText, overtypingCapturer, languageConfigurationService) {
            if (!editor.hasModel() || snippetEdits.length === 0) {
                return { edits: [], snippets: [] };
            }
            const edits = [];
            const model = editor.getModel();
            const parser = new snippetParser_1.SnippetParser();
            const snippet = new snippetParser_1.TextmateSnippet();
            // snippet variables resolver
            const resolver = new snippetVariables_1.CompositeSnippetVariableResolver([
                editor.invokeWithinContext(accessor => new snippetVariables_1.ModelBasedVariableResolver(accessor.get(label_1.ILabelService), model)),
                new snippetVariables_1.ClipboardBasedVariableResolver(() => clipboardText, 0, editor.getSelections().length, editor.getOption(79 /* EditorOption.multiCursorPaste */) === 'spread'),
                new snippetVariables_1.SelectionBasedVariableResolver(model, editor.getSelection(), 0, overtypingCapturer),
                new snippetVariables_1.CommentBasedVariableResolver(model, editor.getSelection(), languageConfigurationService),
                new snippetVariables_1.TimeBasedVariableResolver,
                new snippetVariables_1.WorkspaceBasedVariableResolver(editor.invokeWithinContext(accessor => accessor.get(workspace_1.IWorkspaceContextService))),
                new snippetVariables_1.RandomBasedVariableResolver,
            ]);
            //
            snippetEdits = snippetEdits.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
            let offset = 0;
            for (let i = 0; i < snippetEdits.length; i++) {
                const { range, template } = snippetEdits[i];
                // gaps between snippet edits are appended as text nodes. this
                // ensures placeholder-offsets are later correct
                if (i > 0) {
                    const lastRange = snippetEdits[i - 1].range;
                    const textRange = range_1.Range.fromPositions(lastRange.getEndPosition(), range.getStartPosition());
                    const textNode = new snippetParser_1.Text(model.getValueInRange(textRange));
                    snippet.appendChild(textNode);
                    offset += textNode.value.length;
                }
                const newNodes = parser.parseFragment(template, snippet);
                SnippetSession_1.adjustWhitespace(model, range.getStartPosition(), true, snippet, new Set(newNodes));
                snippet.resolveVariables(resolver);
                const snippetText = snippet.toString();
                const snippetFragmentText = snippetText.slice(offset);
                offset = snippetText.length;
                // make edit
                const edit = editOperation_1.EditOperation.replace(range, snippetFragmentText);
                edit.identifier = { major: i, minor: 0 }; // mark the edit so only our undo edits will be used to generate end cursors
                edit._isTracked = true;
                edits.push(edit);
            }
            //
            parser.ensureFinalTabstop(snippet, enforceFinalTabstop, true);
            return {
                edits,
                snippets: [new OneSnippet(editor, snippet, '')]
            };
        }
        constructor(_editor, _template, _options = _defaultOptions, _languageConfigurationService) {
            this._editor = _editor;
            this._template = _template;
            this._options = _options;
            this._languageConfigurationService = _languageConfigurationService;
            this._templateMerges = [];
            this._snippets = [];
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._snippets);
        }
        _logInfo() {
            return `template="${this._template}", merged_templates="${this._templateMerges.join(' -> ')}"`;
        }
        insert() {
            if (!this._editor.hasModel()) {
                return;
            }
            // make insert edit and start with first selections
            const { edits, snippets } = typeof this._template === 'string'
                ? SnippetSession_1.createEditsAndSnippetsFromSelections(this._editor, this._template, this._options.overwriteBefore, this._options.overwriteAfter, false, this._options.adjustWhitespace, this._options.clipboardText, this._options.overtypingCapturer, this._languageConfigurationService)
                : SnippetSession_1.createEditsAndSnippetsFromEdits(this._editor, this._template, false, this._options.adjustWhitespace, this._options.clipboardText, this._options.overtypingCapturer, this._languageConfigurationService);
            this._snippets = snippets;
            this._editor.executeEdits('snippet', edits, _undoEdits => {
                // Sometimes, the text buffer will remove automatic whitespace when doing any edits,
                // so we need to look only at the undo edits relevant for us.
                // Our edits have an identifier set so that's how we can distinguish them
                const undoEdits = _undoEdits.filter(edit => !!edit.identifier);
                for (let idx = 0; idx < snippets.length; idx++) {
                    snippets[idx].initialize(undoEdits[idx].textChange);
                }
                if (this._snippets[0].hasPlaceholder) {
                    return this._move(true);
                }
                else {
                    return undoEdits
                        .map(edit => selection_1.Selection.fromPositions(edit.range.getEndPosition()));
                }
            });
            this._editor.revealRange(this._editor.getSelections()[0]);
        }
        merge(template, options = _defaultOptions) {
            if (!this._editor.hasModel()) {
                return;
            }
            this._templateMerges.push([this._snippets[0]._nestingLevel, this._snippets[0]._placeholderGroupsIdx, template]);
            const { edits, snippets } = SnippetSession_1.createEditsAndSnippetsFromSelections(this._editor, template, options.overwriteBefore, options.overwriteAfter, true, options.adjustWhitespace, options.clipboardText, options.overtypingCapturer, this._languageConfigurationService);
            this._editor.executeEdits('snippet', edits, _undoEdits => {
                // Sometimes, the text buffer will remove automatic whitespace when doing any edits,
                // so we need to look only at the undo edits relevant for us.
                // Our edits have an identifier set so that's how we can distinguish them
                const undoEdits = _undoEdits.filter(edit => !!edit.identifier);
                for (let idx = 0; idx < snippets.length; idx++) {
                    snippets[idx].initialize(undoEdits[idx].textChange);
                }
                // Trivial snippets have no placeholder or are just the final placeholder. That means they
                // are just text insertions and we don't need to merge the nested snippet into the existing
                // snippet
                const isTrivialSnippet = snippets[0].isTrivialSnippet;
                if (!isTrivialSnippet) {
                    for (const snippet of this._snippets) {
                        snippet.merge(snippets);
                    }
                    console.assert(snippets.length === 0);
                }
                if (this._snippets[0].hasPlaceholder && !isTrivialSnippet) {
                    return this._move(undefined);
                }
                else {
                    return undoEdits.map(edit => selection_1.Selection.fromPositions(edit.range.getEndPosition()));
                }
            });
        }
        next() {
            const newSelections = this._move(true);
            this._editor.setSelections(newSelections);
            this._editor.revealPositionInCenterIfOutsideViewport(newSelections[0].getPosition());
        }
        prev() {
            const newSelections = this._move(false);
            this._editor.setSelections(newSelections);
            this._editor.revealPositionInCenterIfOutsideViewport(newSelections[0].getPosition());
        }
        _move(fwd) {
            const selections = [];
            for (const snippet of this._snippets) {
                const oneSelection = snippet.move(fwd);
                selections.push(...oneSelection);
            }
            return selections;
        }
        get isAtFirstPlaceholder() {
            return this._snippets[0].isAtFirstPlaceholder;
        }
        get isAtLastPlaceholder() {
            return this._snippets[0].isAtLastPlaceholder;
        }
        get hasPlaceholder() {
            return this._snippets[0].hasPlaceholder;
        }
        get hasChoice() {
            return this._snippets[0].hasChoice;
        }
        get activeChoice() {
            return this._snippets[0].activeChoice;
        }
        isSelectionWithinPlaceholders() {
            if (!this.hasPlaceholder) {
                return false;
            }
            const selections = this._editor.getSelections();
            if (selections.length < this._snippets.length) {
                // this means we started snippet mode with N
                // selections and have M (N > M) selections.
                // So one snippet is without selection -> cancel
                return false;
            }
            const allPossibleSelections = new Map();
            for (const snippet of this._snippets) {
                const possibleSelections = snippet.computePossibleSelections();
                // for the first snippet find the placeholder (and its ranges)
                // that contain at least one selection. for all remaining snippets
                // the same placeholder (and their ranges) must be used.
                if (allPossibleSelections.size === 0) {
                    for (const [index, ranges] of possibleSelections) {
                        ranges.sort(range_1.Range.compareRangesUsingStarts);
                        for (const selection of selections) {
                            if (ranges[0].containsRange(selection)) {
                                allPossibleSelections.set(index, []);
                                break;
                            }
                        }
                    }
                }
                if (allPossibleSelections.size === 0) {
                    // return false if we couldn't associate a selection to
                    // this (the first) snippet
                    return false;
                }
                // add selections from 'this' snippet so that we know all
                // selections for this placeholder
                allPossibleSelections.forEach((array, index) => {
                    array.push(...possibleSelections.get(index));
                });
            }
            // sort selections (and later placeholder-ranges). then walk both
            // arrays and make sure the placeholder-ranges contain the corresponding
            // selection
            selections.sort(range_1.Range.compareRangesUsingStarts);
            for (const [index, ranges] of allPossibleSelections) {
                if (ranges.length !== selections.length) {
                    allPossibleSelections.delete(index);
                    continue;
                }
                ranges.sort(range_1.Range.compareRangesUsingStarts);
                for (let i = 0; i < ranges.length; i++) {
                    if (!ranges[i].containsRange(selections[i])) {
                        allPossibleSelections.delete(index);
                        continue;
                    }
                }
            }
            // from all possible selections we have deleted those
            // that don't match with the current selection. if we don't
            // have any left, we don't have a selection anymore
            return allPossibleSelections.size > 0;
        }
        getEnclosingRange() {
            let result;
            for (const snippet of this._snippets) {
                const snippetRange = snippet.getEnclosingRange();
                if (!result) {
                    result = snippetRange;
                }
                else {
                    result = result.plusRange(snippetRange);
                }
            }
            return result;
        }
    };
    exports.SnippetSession = SnippetSession;
    exports.SnippetSession = SnippetSession = SnippetSession_1 = __decorate([
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], SnippetSession);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFNlc3Npb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zbmlwcGV0L2Jyb3dzZXIvc25pcHBldFNlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXVCaEcsTUFBYSxVQUFVO2lCQVFFLFdBQU0sR0FBRztZQUNoQyxNQUFNLEVBQUUsa0NBQXNCLENBQUMsUUFBUSxDQUFDLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixFQUFFLFVBQVUsNkRBQXFELEVBQUUsU0FBUyxFQUFFLHFCQUFxQixFQUFFLENBQUM7WUFDcEwsUUFBUSxFQUFFLGtDQUFzQixDQUFDLFFBQVEsQ0FBQyxFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxVQUFVLDREQUFvRCxFQUFFLFNBQVMsRUFBRSxxQkFBcUIsRUFBRSxDQUFDO1lBQ3JMLFdBQVcsRUFBRSxrQ0FBc0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSw0REFBb0QsRUFBRSxTQUFTLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQztZQUMvTCxhQUFhLEVBQUUsa0NBQXNCLENBQUMsUUFBUSxDQUFDLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixFQUFFLFVBQVUsNERBQW9ELEVBQUUsU0FBUyxFQUFFLDRCQUE0QixFQUFFLENBQUM7U0FDak0sQUFMNkIsQ0FLNUI7UUFFRixZQUNrQixPQUEwQixFQUMxQixRQUF5QixFQUN6Qiw2QkFBcUM7WUFGckMsWUFBTyxHQUFQLE9BQU8sQ0FBbUI7WUFDMUIsYUFBUSxHQUFSLFFBQVEsQ0FBaUI7WUFDekIsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFRO1lBZC9DLFlBQU8sR0FBVyxDQUFDLENBQUMsQ0FBQztZQUU3QixrQkFBYSxHQUFXLENBQUMs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