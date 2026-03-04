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
define(["require", "exports", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/arrays"], function (require, exports, event_1, editor_1, editorInput_1, sideBySideEditorInput_1, instantiation_1, configuration_1, lifecycle_1, platform_1, arrays_1) {
    "use strict";
    var EditorGroupModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorGroupModel = void 0;
    exports.isSerializedEditorGroupModel = isSerializedEditorGroupModel;
    exports.isGroupEditorChangeEvent = isGroupEditorChangeEvent;
    exports.isGroupEditorOpenEvent = isGroupEditorOpenEvent;
    exports.isGroupEditorMoveEvent = isGroupEditorMoveEvent;
    exports.isGroupEditorCloseEvent = isGroupEditorCloseEvent;
    const EditorOpenPositioning = {
        LEFT: 'left',
        RIGHT: 'right',
        FIRST: 'first',
        LAST: 'last'
    };
    function isSerializedEditorGroupModel(group) {
        const candidate = group;
        return !!(candidate && typeof candidate === 'object' && Array.isArray(candidate.editors) && Array.isArray(candidate.mru));
    }
    function isGroupEditorChangeEvent(e) {
        const candidate = e;
        return candidate.editor && candidate.editorIndex !== undefined;
    }
    function isGroupEditorOpenEvent(e) {
        const candidate = e;
        return candidate.kind === 4 /* GroupModelChangeKind.EDITOR_OPEN */ && candidate.editorIndex !== undefined;
    }
    function isGroupEditorMoveEvent(e) {
        const candidate = e;
        return candidate.kind === 6 /* GroupModelChangeKind.EDITOR_MOVE */ && candidate.editorIndex !== undefined && candidate.oldEditorIndex !== undefined;
    }
    function isGroupEditorCloseEvent(e) {
        const candidate = e;
        return candidate.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */ && candidate.editorIndex !== undefined && candidate.context !== undefined && candidate.sticky !== undefined;
    }
    let EditorGroupModel = class EditorGroupModel extends lifecycle_1.Disposable {
        static { EditorGroupModel_1 = this; }
        static { this.IDS = 0; }
        get id() { return this._id; }
        constructor(labelOrSerializedGroup, instantiationService, configurationService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            //#region events
            this._onDidModelChange = this._register(new event_1.Emitter());
            this.onDidModelChange = this._onDidModelChange.event;
            this.editors = [];
            this.mru = [];
            this.editorListeners = new Set();
            this.locked = false;
            this.preview = null; // editor in preview state
            this.active = null; // editor in active state
            this.sticky = -1; // index of first editor in sticky state
            this.transient = new Set(); // editors in transient state
            if (isSerializedEditorGroupModel(labelOrSerializedGroup)) {
                this._id = this.deserialize(labelOrSerializedGroup);
            }
            else {
                this._id = EditorGroupModel_1.IDS++;
            }
            this.onConfigurationUpdated();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onConfigurationUpdated(e) {
            if (e && !e.affectsConfiguration('workbench.editor.openPositioning') && !e.affectsConfiguration('workbench.editor.focusRecentEditorAfterClose')) {
                return;
            }
            this.editorOpenPositioning = this.configurationService.getValue('workbench.editor.openPositioning');
            this.focusRecentEditorAfterClose = this.configurationService.getValue('workbench.editor.focusRecentEditorAfterClose');
        }
        get count() {
            return this.editors.length;
        }
        get stickyCount() {
            return this.sticky + 1;
        }
        getEditors(order, options) {
            const editors = order === 0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */ ? this.mru.slice(0) : this.editors.slice(0);
            if (options?.excludeSticky) {
                // MRU: need to check for index on each
                if (order === 0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */) {
                    return editors.filter(editor => !this.isSticky(editor));
                }
                // Sequential: simply start after sticky index
                return editors.slice(this.sticky + 1);
            }
            return editors;
        }
        getEditorByIndex(index) {
            return this.editors[index];
        }
        get activeEditor() {
            return this.active;
        }
        isActive(editor) {
            return this.matches(this.active, editor);
        }
        get previewEditor() {
            return this.preview;
        }
        openEditor(candidate, options) {
            const makeSticky = options?.sticky || (typeof options?.index === 'number' && this.isSticky(options.index));
            const makePinned = options?.pinned || options?.sticky;
            const makeTransient = !!options?.transient;
            const makeActive = options?.active || !this.activeEditor || (!makePinned && this.matches(this.preview, this.activeEditor));
            const existingEditorAndIndex = this.findEditor(candidate, options);
            // New editor
            if (!existingEditorAndIndex) {
                const newEditor = candidate;
                const indexOfActive = this.indexOf(this.active);
                // Insert into specific position
                let targetIndex;
                if (options && typeof options.index === 'number') {
                    targetIndex = options.index;
                }
                // Insert to the BEGINNING
                else if (this.editorOpenPositioning === EditorOpenPositioning.FIRST) {
                    targetIndex = 0;
                    // Always make sure targetIndex is after sticky editors
                    // unless we are explicitly told to make the editor sticky
                    if (!makeSticky && this.isSticky(targetIndex)) {
                        targetIndex = this.sticky + 1;
                    }
                }
                // Insert to the END
                else if (this.editorOpenPositioning === EditorOpenPositioning.LAST) {
                    targetIndex = this.editors.length;
                }
                // Insert to LEFT or RIGHT of active editor
                else {
                    // Insert to the LEFT of active editor
                    if (this.editorOpenPositioning === EditorOpenPositioning.LEFT) {
                        if (indexOfActive === 0 || !this.editors.length) {
                            targetIndex = 0; // to the left becoming first editor in list
                        }
                        else {
                            targetIndex = indexOfActive; // to the left of active editor
                        }
                    }
                    // Insert to the RIGHT of active editor
                    else {
                        targetIndex = indexOfActive + 1;
                    }
                    // Always make sure targetIndex is after sticky editors
                    // unless we are explicitly told to make the editor sticky
                    if (!makeSticky && this.isSticky(targetIndex)) {
                        targetIndex = this.sticky + 1;
                    }
                }
                // If the editor becomes sticky, increment the sticky index and adjust
                // the targetIndex to be at the end of sticky editors unless already.
                if (makeSticky) {
                    this.sticky++;
                    if (!this.isSticky(targetIndex)) {
                        targetIndex = this.sticky;
                    }
                }
                // Insert into our list of editors if pinned or we have no preview editor
                if (makePinned || !this.preview) {
                    this.splice(targetIndex, false, newEditor);
                }
                // Handle transient
                if (makeTransient) {
                    this.doSetTransient(newEditor, targetIndex, true);
                }
                // Handle preview
                if (!makePinned) {
                    // Replace existing preview with this editor if we have a preview
                    if (this.preview) {
                        const indexOfPreview = this.indexOf(this.preview);
                        if (targetIndex > indexOfPreview) {
                            targetIndex--; // accomodate for the fact that the preview editor closes
                        }
                        this.replaceEditor(this.preview, newEditor, targetIndex, !makeActive);
                    }
                    this.preview = newEditor;
                }
                // Listeners
                this.registerEditorListeners(newEditor);
                // Event
                const event = {
                    kind: 4 /* GroupModelChangeKind.EDITOR_OPEN */,
                    editor: newEditor,
                    editorIndex: targetIndex
                };
                this._onDidModelChange.fire(event);
                // Handle active
                if (makeActive) {
                    this.doSetActive(newEditor, targetIndex);
                }
                return {
                    editor: newEditor,
                    isNew: true
                };
            }
            // Existing editor
            else {
                const [existingEditor, existingEditorIndex] = existingEditorAndIndex;
                // Update transient (existing editors do not turn transient if they were not before)
                this.doSetTransient(existingEditor, existingEditorIndex, makeTransient === false ? false : this.isTransient(existingEditor));
                // Pin it
                if (makePinned) {
                    this.doPin(existingEditor, existingEditorIndex);
                }
                // Activate it
                if (makeActive) {
                    this.doSetActive(existingEditor, existingEditorIndex);
                }
                // Respect index
                if (options && typeof options.index === 'number') {
                    this.moveEditor(existingEditor, options.index);
                }
                // Stick it (intentionally after the moveEditor call in case
                // the editor was already moved into the sticky range)
                if (makeSticky) {
                    this.doStick(existingEditor, this.indexOf(existingEditor));
                }
                return {
                    editor: existingEditor,
                    isNew: false
                };
            }
        }
        registerEditorListeners(editor) {
            const listeners = new lifecycle_1.DisposableStore();
            this.editorListeners.add(listeners);
            // Re-emit disposal of editor input as our own event
            listeners.add(event_1.Event.once(editor.onWillDispose)(() => {
                const editorIndex = this.editors.indexOf(editor);
                if (editorIndex >= 0) {
                    const event = {
                        kind: 14 /* GroupModelChangeKind.EDITOR_WILL_DISPOSE */,
                        editor,
                        editorIndex
                    };
                    this._onDidModelChange.fire(event);
                }
            }));
            // Re-Emit dirty state changes
            listeners.add(editor.onDidChangeDirty(() => {
                const event = {
                    kind: 13 /* GroupModelChangeKind.EDITOR_DIRTY */,
                    editor,
                    editorIndex: this.editors.indexOf(editor)
                };
                this._onDidModelChange.fire(event);
            }));
            // Re-Emit label changes
            listeners.add(editor.onDidChangeLabel(() => {
                const event = {
                    kind: 8 /* GroupModelChangeKind.EDITOR_LABEL */,
                    editor,
                    editorIndex: this.editors.indexOf(editor)
                };
                this._onDidModelChange.fire(event);
            }));
            // Re-Emit capability changes
            listeners.add(editor.onDidChangeCapabilities(() => {
                const event = {
                    kind: 9 /* GroupModelChangeKind.EDITOR_CAPABILITIES */,
                    editor,
                    editorIndex: this.editors.indexOf(editor)
                };
                this._onDidModelChange.fire(event);
            }));
            // Clean up dispose listeners once the editor gets closed
            listeners.add(this.onDidModelChange(event => {
                if (event.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */ && event.editor?.matches(editor)) {
                    (0, lifecycle_1.dispose)(listeners);
                    this.editorListeners.delete(listeners);
                }
            }));
        }
        replaceEditor(toReplace, replaceWith, replaceIndex, openNext = true) {
            const closeResult = this.doCloseEditor(toReplace, editor_1.EditorCloseContext.REPLACE, openNext); // optimization to prevent multiple setActive() in one call
            // We want to first add the new editor into our model before emitting the close event because
            // firing the close event can trigger a dispose on the same editor that is now being added.
            // This can lead into opening a disposed editor which is not what we want.
            this.splice(replaceIndex, false, replaceWith);
            if (closeResult) {
                const event = {
                    kind: 5 /* GroupModelChangeKind.EDITOR_CLOSE */,
                    ...closeResult
                };
                this._onDidModelChange.fire(event);
            }
        }
        closeEditor(candidate, context = editor_1.EditorCloseContext.UNKNOWN, openNext = true) {
            const closeResult = this.doCloseEditor(candidate, context, openNext);
            if (closeResult) {
                const event = {
                    kind: 5 /* GroupModelChangeKind.EDITOR_CLOSE */,
                    ...closeResult
                };
                this._onDidModelChange.fire(event);
                return closeResult;
            }
            return undefined;
        }
        doCloseEditor(candidate, context, openNext) {
            const index = this.indexOf(candidate);
            if (index === -1) {
                return undefined; // not found
            }
            const editor = this.editors[index];
            const sticky = this.isSticky(index);
            // Active Editor closed
            if (openNext && this.matches(this.active, editor)) {
                // More than one editor
                if (this.mru.length > 1) {
                    let newActive;
                    if (this.focusRecentEditorAfterClose) {
                        newActive = this.mru[1]; // active editor is always first in MRU, so pick second editor after as new active
                    }
                    else {
                        if (index === this.editors.length - 1) {
                            newActive = this.editors[index - 1]; // last editor is closed, pick previous as new active
                        }
                        else {
                            newActive = this.editors[index + 1]; // pick next editor as new active
                        }
                    }
                    this.doSetActive(newActive, this.editors.indexOf(newActive));
                }
                // One Editor
                else {
                    this.active = null;
                }
            }
            // Preview Editor closed
            if (this.matches(this.preview, editor)) {
                this.preview = null;
            }
            // Remove from transient
            this.transient.delete(editor);
            // Remove from arrays
            this.splice(index, true);
            // Event
            return { editor, sticky, editorIndex: index, context };
        }
        moveEditor(candidate, toIndex) {
            // Ensure toIndex is in bounds of our model
            if (toIndex >= this.editors.length) {
                toIndex = this.editors.length - 1;
            }
            else if (toIndex < 0) {
                toIndex = 0;
            }
            const index = this.indexOf(candidate);
            if (index < 0 || toIndex === index) {
                return;
            }
            const editor = this.editors[index];
            const sticky = this.sticky;
            // Adjust sticky index: editor moved out of sticky state into unsticky state
            if (this.isSticky(index) && toIndex > this.sticky) {
                this.sticky--;
            }
            // ...or editor moved into sticky state from unsticky state
            else if (!this.isSticky(index) && toIndex <= this.sticky) {
                this.sticky++;
            }
            // Move
            this.editors.splice(index, 1);
            this.editors.splice(toIndex, 0, editor);
            // Move Event
            const event = {
                kind: 6 /* GroupModelChangeKind.EDITOR_MOVE */,
                editor,
                oldEditorIndex: index,
                editorIndex: toIndex
            };
            this._onDidModelChange.fire(event);
            // Sticky Event (if sticky changed as part of the move)
            if (sticky !== this.sticky) {
                const event = {
                    kind: 12 /* GroupModelChangeKind.EDITOR_STICKY */,
                    editor,
                    editorIndex: toIndex
                };
                this._onDidModelChange.fire(event);
            }
            return editor;
        }
        setActive(candidate) {
            let result = undefined;
            if (!candidate) {
                this.setGroupActive();
            }
            else {
                result = this.setEditorActive(candidate);
            }
            return result;
        }
        setGroupActive() {
            // We do not really keep the `active` state in our model because
            // it has no special meaning to us here. But for consistency
            // we emit a `onDidModelChange` event so that components can
            // react.
            this._onDidModelChange.fire({ kind: 0 /* GroupModelChangeKind.GROUP_ACTIVE */ });
        }
        setEditorActive(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doSetActive(editor, editorIndex);
            return editor;
        }
        doSetActive(editor, editorIndex) {
            if (this.matches(this.active, editor)) {
                return; // already active
            }
            this.active = editor;
            // Bring to front in MRU list
            const mruIndex = this.indexOf(editor, this.mru);
            this.mru.splice(mruIndex, 1);
            this.mru.unshift(editor);
            // Event
            const event = {
                kind: 7 /* GroupModelChangeKind.EDITOR_ACTIVE */,
                editor,
                editorIndex
            };
            this._onDidModelChange.fire(event);
        }
        setIndex(index) {
            // We do not really keep the `index` in our model because
            // it has no special meaning to us here. But for consistency
            // we emit a `onDidModelChange` event so that components can
            // react.
            this._onDidModelChange.fire({ kind: 1 /* GroupModelChangeKind.GROUP_INDEX */ });
        }
        setLabel(label) {
            // We do not really keep the `label` in our model because
            // it has no special meaning to us here. But for consistency
            // we emit a `onDidModelChange` event so that components can
            // react.
            this._onDidModelChange.fire({ kind: 2 /* GroupModelChangeKind.GROUP_LABEL */ });
        }
        pin(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doPin(editor, editorIndex);
            return editor;
        }
        doPin(editor, editorIndex) {
            if (this.isPinned(editor)) {
                return; // can only pin a preview editor
            }
            // Clear Transient
            this.setTransient(editor, false);
            // Convert the preview editor to be a pinned editor
            this.preview = null;
            // Event
            const event = {
                kind: 10 /* GroupModelChangeKind.EDITOR_PIN */,
                editor,
                editorIndex
            };
            this._onDidModelChange.fire(event);
        }
        unpin(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doUnpin(editor, editorIndex);
            return editor;
        }
        doUnpin(editor, editorIndex) {
            if (!this.isPinned(editor)) {
                return; // can only unpin a pinned editor
            }
            // Set new
            const oldPreview = this.preview;
            this.preview = editor;
            // Event
            const event = {
                kind: 10 /* GroupModelChangeKind.EDITOR_PIN */,
                editor,
                editorIndex
            };
            this._onDidModelChange.fire(event);
            // Close old preview editor if any
            if (oldPreview) {
                this.closeEditor(oldPreview, editor_1.EditorCloseContext.UNPIN);
            }
        }
        isPinned(editorOrIndex) {
            let editor;
            if (typeof editorOrIndex === 'number') {
                editor = this.editors[editorOrIndex];
            }
            else {
                editor = editorOrIndex;
            }
            return !this.matches(this.preview, editor);
        }
        stick(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doStick(editor, editorIndex);
            return editor;
        }
        doStick(editor, editorIndex) {
            if (this.isSticky(editorIndex)) {
                return; // can only stick a non-sticky editor
            }
            // Pin editor
            this.pin(editor);
            // Move editor to be the last sticky editor
            const newEditorIndex = this.sticky + 1;
            this.moveEditor(editor, newEditorIndex);
            // Adjust sticky index
            this.sticky++;
            // Event
            const event = {
                kind: 12 /* GroupModelChangeKind.EDITOR_STICKY */,
                editor,
                editorIndex: newEditorIndex
            };
            this._onDidModelChange.fire(event);
        }
        unstick(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doUnstick(editor, editorIndex);
            return editor;
        }
        doUnstick(editor, editorIndex) {
            if (!this.isSticky(editorIndex)) {
                return; // can only unstick a sticky editor
            }
            // Move editor to be the first non-sticky editor
            const newEditorIndex = this.sticky;
            this.moveEditor(editor, newEditorIndex);
            // Adjust sticky index
            this.sticky--;
            // Event
            const event = {
                kind: 12 /* GroupModelChangeKind.EDITOR_STICKY */,
                editor,
                editorIndex: newEditorIndex
            };
            this._onDidModelChange.fire(event);
        }
        isSticky(candidateOrIndex) {
            if (this.sticky < 0) {
                return false; // no sticky editor
            }
            let index;
            if (typeof candidateOrIndex === 'number') {
                index = candidateOrIndex;
            }
            else {
                index = this.indexOf(candidateOrIndex);
            }
            if (index < 0) {
                return false;
            }
            return index <= this.sticky;
        }
        setTransient(candidate, transient) {
            if (!transient && this.transient.size === 0) {
                return; // no transient editor
            }
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doSetTransient(editor, editorIndex, transient);
            return editor;
        }
        doSetTransient(editor, editorIndex, transient) {
            if (transient) {
                if (this.transient.has(editor)) {
                    return;
                }
                this.transient.add(editor);
            }
            else {
                if (!this.transient.has(editor)) {
                    return;
                }
                this.transient.delete(editor);
            }
            // Event
            const event = {
                kind: 11 /* GroupModelChangeKind.EDITOR_TRANSIENT */,
                editor,
                editorIndex
            };
            this._onDidModelChange.fire(event);
        }
        isTransient(editorOrIndex) {
            if (this.transient.size === 0) {
                return false; // no transient editor
            }
            let editor;
            if (typeof editorOrIndex === 'number') {
                editor = this.editors[editorOrIndex];
            }
            else {
                editor = this.findEditor(editorOrIndex)?.[0];
            }
            return !!editor && this.transient.has(editor);
        }
        splice(index, del, editor) {
            const editorToDeleteOrReplace = this.editors[index];
            // Perform on sticky index
            if (del && this.isSticky(index)) {
                this.sticky--;
            }
            // Perform on editors array
            if (editor) {
                this.editors.splice(index, del ? 1 : 0, editor);
            }
            else {
                this.editors.splice(index, del ? 1 : 0);
            }
            // Perform on MRU
            {
                // Add
                if (!del && editor) {
                    if (this.mru.length === 0) {
                        // the list of most recent editors is empty
                        // so this editor can only be the most recent
                        this.mru.push(editor);
                    }
                    else {
                        // we have most recent editors. as such we
                        // put this newly opened editor right after
                        // the current most recent one because it cannot
                        // be the most recently active one unless
                        // it becomes active. but it is still more
                        // active then any other editor in the list.
                        this.mru.splice(1, 0, editor);
                    }
                }
                // Remove / Replace
                else {
                    const indexInMRU = this.indexOf(editorToDeleteOrReplace, this.mru);
                    // Remove
                    if (del && !editor) {
                        this.mru.splice(indexInMRU, 1); // remove from MRU
                    }
                    // Replace
                    else if (del && editor) {
                        this.mru.splice(indexInMRU, 1, editor); // replace MRU at location
                    }
                }
            }
        }
        indexOf(candidate, editors = this.editors, options) {
            let index = -1;
            if (!candidate) {
                return index;
            }
            for (let i = 0; i < editors.length; i++) {
                const editor = editors[i];
                if (this.matches(editor, candidate, options)) {
                    // If we are to support side by side matching, it is possible that
                    // a better direct match is found later. As such, we continue finding
                    // a matching editor and prefer that match over the side by side one.
                    if (options?.supportSideBySide && editor instanceof sideBySideEditorInput_1.SideBySideEditorInput && !(candidate instanceof sideBySideEditorInput_1.SideBySideEditorInput)) {
                        index = i;
                    }
                    else {
                        index = i;
                        break;
                    }
                }
            }
            return index;
        }
        findEditor(candidate, options) {
            const index = this.indexOf(candidate, this.editors, options);
            if (index === -1) {
                return undefined;
            }
            return [this.editors[index], index];
        }
        isFirst(candidate, editors = this.editors) {
            return this.matches(editors[0], candidate);
        }
        isLast(candidate, editors = this.editors) {
            return this.matches(editors[editors.length - 1], candidate);
        }
        contains(candidate, options) {
            return this.indexOf(candidate, this.editors, options) !== -1;
        }
        matches(editor, candidate, options) {
            if (!editor || !candidate) {
                return false;
            }
            if (options?.supportSideBySide && editor instanceof sideBySideEditorInput_1.SideBySideEditorInput && !(candidate instanceof sideBySideEditorInput_1.SideBySideEditorInput)) {
                switch (options.supportSideBySide) {
                    case editor_1.SideBySideEditor.ANY:
                        if (this.matches(editor.primary, candidate, options) || this.matches(editor.secondary, candidate, options)) {
                            return true;
                        }
                        break;
                    case editor_1.SideBySideEditor.BOTH:
                        if (this.matches(editor.primary, candidate, options) && this.matches(editor.secondary, candidate, options)) {
                            return true;
                        }
                        break;
                }
            }
            const strictEquals = editor === candidate;
            if (options?.strictEquals) {
                return strictEquals;
            }
            return strictEquals || editor.matches(candidate);
        }
        get isLocked() {
            return this.locked;
        }
        lock(locked) {
            if (this.isLocked !== locked) {
                this.locked = locked;
                this._onDidModelChange.fire({ kind: 3 /* GroupModelChangeKind.GROUP_LOCKED */ });
            }
        }
        clone() {
            const clone = this.instantiationService.createInstance(EditorGroupModel_1, undefined);
            // Copy over group properties
            clone.editors = this.editors.slice(0);
            clone.mru = this.mru.slice(0);
            clone.preview = this.preview;
            clone.active = this.active;
            clone.sticky = this.sticky;
            // Ensure to register listeners for each editor
            for (const editor of clone.editors) {
                clone.registerEditorListeners(editor);
            }
            return clone;
        }
        serialize() {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            // Serialize all editor inputs so that we can store them.
            // Editors that cannot be serialized need to be ignored
            // from mru, active, preview and sticky if any.
            const serializableEditors = [];
            const serializedEditors = [];
            let serializablePreviewIndex;
            let serializableSticky = this.sticky;
            for (let i = 0; i < this.editors.length; i++) {
                const editor = this.editors[i];
                let canSerializeEditor = false;
                const editorSerializer = registry.getEditorSerializer(editor);
                if (editorSerializer) {
                    const value = editorSerializer.canSerialize(editor) ? editorSerializer.serialize(editor) : undefined;
                    // Editor can be serialized
                    if (typeof value === 'string') {
                        canSerializeEditor = true;
                        serializedEditors.push({ id: editor.typeId, value });
                        serializableEditors.push(editor);
                        if (this.preview === editor) {
                            serializablePreviewIndex = serializableEditors.length - 1;
                        }
                    }
                    // Editor cannot be serialized
                    else {
                        canSerializeEditor = false;
                    }
                }
                // Adjust index of sticky editors if the editor cannot be serialized and is pinned
                if (!canSerializeEditor && this.isSticky(i)) {
                    serializableSticky--;
                }
            }
            const serializableMru = this.mru.map(editor => this.indexOf(editor, serializableEditors)).filter(i => i >= 0);
            return {
                id: this.id,
                locked: this.locked ? true : undefined,
                editors: serializedEditors,
                mru: serializableMru,
                preview: serializablePreviewIndex,
                sticky: serializableSticky >= 0 ? serializableSticky : undefined
            };
        }
        deserialize(data) {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            if (typeof data.id === 'number') {
                this._id = data.id;
                EditorGroupModel_1.IDS = Math.max(data.id + 1, EditorGroupModel_1.IDS); // make sure our ID generator is always larger
            }
            else {
                this._id = EditorGroupModel_1.IDS++; // backwards compatibility
            }
            if (data.locked) {
                this.locked = true;
            }
            this.editors = (0, arrays_1.coalesce)(data.editors.map((e, index) => {
                let editor = undefined;
                const editorSerializer = registry.getEditorSerializer(e.id);
                if (editorSerializer) {
                    const deserializedEditor = editorSerializer.deserialize(this.instantiationService, e.value);
                    if (deserializedEditor instanceof editorInput_1.EditorInput) {
                        editor = deserializedEditor;
                        this.registerEditorListeners(editor);
                    }
                }
                if (!editor && typeof data.sticky === 'number' && index <= data.sticky) {
                    data.sticky--; // if editor cannot be deserialized but was sticky, we need to decrease sticky index
                }
                return editor;
            }));
            this.mru = (0, arrays_1.coalesce)(data.mru.map(i => this.editors[i]));
            this.active = this.mru[0];
            if (typeof data.preview === 'number') {
                this.preview = this.editors[data.preview];
            }
            if (typeof data.sticky === 'number') {
                this.sticky = data.sticky;
            }
            return this._id;
        }
        dispose() {
            (0, lifecycle_1.dispose)(Array.from(this.editorListeners));
            this.editorListeners.clear();
            this.transient.clear();
            super.dispose();
        }
    };
    exports.EditorGroupModel = EditorGroupModel;
    exports.EditorGroupModel = EditorGroupModel = EditorGroupModel_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService)
    ], EditorGroupModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vZWRpdG9yL2VkaXRvckdyb3VwTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStDaEcsb0VBSUM7SUE2Q0QsNERBSUM7SUFPRCx3REFJQztJQWNELHdEQUlDO0lBcUJELDBEQUlDO0lBOUlELE1BQU0scUJBQXFCLEdBQUc7UUFDN0IsSUFBSSxFQUFFLE1BQU07UUFDWixLQUFLLEVBQUUsT0FBTztRQUNkLEtBQUssRUFBRSxPQUFPO1FBQ2QsSUFBSSxFQUFFLE1BQU07S0FDWixDQUFDO0lBOEJGLFNBQWdCLDRCQUE0QixDQUFDLEtBQWU7UUFDM0QsTUFBTSxTQUFTLEdBQUcsS0FBZ0QsQ0FBQztRQUVuRSxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMzSCxDQUFDO0lBNkNELFNBQWdCLHdCQUF3QixDQUFDLENBQXlCO1FBQ2pFLE1BQU0sU0FBUyxHQUFHLENBQTBCLENBQUM7UUFFN0MsT0FBTyxTQUFTLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO0lBQ2hFLENBQUM7SUFPRCxTQUFnQixzQkFBc0IsQ0FBQyxDQUF5QjtRQUMvRCxNQUFNLFNBQVMsR0FBRyxDQUEwQixDQUFDO1FBRTdDLE9BQU8sU0FBUyxDQUFDLElBQUksNkNBQXFDLElBQUksU0FBUyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7SUFDbkcsQ0FBQztJQWNELFNBQWdCLHNCQUFzQixDQUFDLENBQXlCO1FBQy9ELE1BQU0sU0FBUyxHQUFHLENBQTBCLENBQUM7UUFFN0MsT0FBTyxTQUFTLENBQUMsSUFBSSw2Q0FBcUMsSUFBSSxTQUFTLENBQUMsV0FBVyxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsY0FBYyxLQUFLLFNBQVMsQ0FBQztJQUM3SSxDQUFDO0lBcUJELFNBQWdCLHVCQUF1QixDQUFDLENBQXlCO1FBQ2hFLE1BQU0sU0FBUyxHQUFHLENBQTJCLENBQUM7UUFFOUMsT0FBTyxTQUFTLENBQUMsSUFBSSw4Q0FBc0MsSUFBSSxTQUFTLENBQUMsV0FBVyxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQztJQUN6SyxDQUFDO0lBd0NNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7O2lCQUVoQyxRQUFHLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFVdkIsSUFBSSxFQUFFLEtBQXNCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFpQjlDLFlBQ0Msc0JBQStELEVBQ3hDLG9CQUE0RCxFQUM1RCxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFIZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBNUJwRixnQkFBZ0I7WUFFQyxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEwQixDQUFDLENBQUM7WUFDbEYscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQU9qRCxZQUFPLEdBQWtCLEVBQUUsQ0FBQztZQUM1QixRQUFHLEdBQWtCLEVBQUUsQ0FBQztZQUVmLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7WUFFdEQsV0FBTSxHQUFHLEtBQUssQ0FBQztZQUVmLFlBQU8sR0FBdUIsSUFBSSxDQUFDLENBQUMsMEJBQTBCO1lBQzlELFdBQU0sR0FBdUIsSUFBSSxDQUFDLENBQUUseUJBQXlCO1lBQzdELFdBQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFPLHdDQUF3QztZQUMzRCxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQyxDQUFDLDZCQUE2QjtZQVl4RSxJQUFJLDRCQUE0QixDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDckQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxHQUFHLEdBQUcsa0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDbkMsQ0FBQztZQUVELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pHLENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxDQUE2QjtZQUMzRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLDhDQUE4QyxDQUFDLEVBQUUsQ0FBQztnQkFDakosT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ3BHLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLDhDQUE4QyxDQUFDLENBQUM7UUFDdkgsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUVELFVBQVUsQ0FBQyxLQUFtQixFQUFFLE9BQXFDO1lBQ3BFLE1BQU0sT0FBTyxHQUFHLEtBQUssOENBQXNDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4RyxJQUFJLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQztnQkFFNUIsdUNBQXVDO2dCQUN2QyxJQUFJLEtBQUssOENBQXNDLEVBQUUsQ0FBQztvQkFDakQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELENBQUM7Z0JBRUQsOENBQThDO2dCQUM5QyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVELGdCQUFnQixDQUFDLEtBQWE7WUFDN0IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELFFBQVEsQ0FBQyxNQUF5QztZQUNqRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRUQsSUFBSSxhQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsVUFBVSxDQUFDLFNBQXNCLEVBQUUsT0FBNEI7WUFDOUQsTUFBTSxVQUFVLEdBQUcsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFDLE9BQU8sT0FBTyxFQUFFLEtBQUssS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMzRyxNQUFNLFVBQVUsR0FBRyxPQUFPLEVBQUUsTUFBTSxJQUFJLE9BQU8sRUFBRSxNQUFNLENBQUM7WUFDdEQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUM7WUFDM0MsTUFBTSxVQUFVLEdBQUcsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFM0gsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVuRSxhQUFhO1lBQ2IsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzdCLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQztnQkFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRWhELGdDQUFnQztnQkFDaEMsSUFBSSxXQUFtQixDQUFDO2dCQUN4QixJQUFJLE9BQU8sSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ2xELFdBQVcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUM3QixDQUFDO2dCQUVELDBCQUEwQjtxQkFDckIsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUsscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3JFLFdBQVcsR0FBRyxDQUFDLENBQUM7b0JBRWhCLHVEQUF1RDtvQkFDdkQsMERBQTBEO29CQUMxRCxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQzt3QkFDL0MsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUMvQixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsb0JBQW9CO3FCQUNmLElBQUksSUFBSSxDQUFDLHFCQUFxQixLQUFLLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUNwRSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ25DLENBQUM7Z0JBRUQsMkNBQTJDO3FCQUN0QyxDQUFDO29CQUVMLHNDQUFzQztvQkFDdEMsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUsscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQy9ELElBQUksYUFBYSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7NEJBQ2pELFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyw0Q0FBNEM7d0JBQzlELENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxXQUFXLEdBQUcsYUFBYSxDQUFDLENBQUMsK0JBQStCO3dCQUM3RCxDQUFDO29CQUNGLENBQUM7b0JBRUQsdUNBQXVDO3lCQUNsQyxDQUFDO3dCQUNMLFdBQVcsR0FBRyxhQUFhLEdBQUcsQ0FBQyxDQUFDO29CQUNqQyxDQUFDO29CQUVELHVEQUF1RDtvQkFDdkQsMERBQTBEO29CQUMxRCxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQzt3QkFDL0MsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUMvQixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsc0VBQXNFO2dCQUN0RSxxRUFBcUU7Z0JBQ3JFLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFFZCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO3dCQUNqQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztvQkFDM0IsQ0FBQztnQkFDRixDQUFDO2dCQUVELHlFQUF5RTtnQkFDekUsSUFBSSxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUMsQ0FBQztnQkFFRCxtQkFBbUI7Z0JBQ25CLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25CLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztnQkFFRCxpQkFBaUI7Z0JBQ2pCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFFakIsaUVBQWlFO29CQUNqRSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDbEIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ2xELElBQUksV0FBVyxHQUFHLGNBQWMsRUFBRSxDQUFDOzRCQUNsQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLHlEQUF5RDt3QkFDekUsQ0FBQzt3QkFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN2RSxDQUFDO29CQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDO2dCQUMxQixDQUFDO2dCQUVELFlBQVk7Z0JBQ1osSUFBSSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUV4QyxRQUFRO2dCQUNSLE1BQU0sS0FBSyxHQUEwQjtvQkFDcEMsSUFBSSwwQ0FBa0M7b0JBQ3RDLE1BQU0sRUFBRSxTQUFTO29CQUNqQixXQUFXLEVBQUUsV0FBVztpQkFDeEIsQ0FBQztnQkFDRixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVuQyxnQkFBZ0I7Z0JBQ2hCLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUMxQyxDQUFDO2dCQUVELE9BQU87b0JBQ04sTUFBTSxFQUFFLFNBQVM7b0JBQ2pCLEtBQUssRUFBRSxJQUFJO2lCQUNYLENBQUM7WUFDSCxDQUFDO1lBRUQsa0JBQWtCO2lCQUNiLENBQUM7Z0JBQ0wsTUFBTSxDQUFDLGNBQWMsRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLHNCQUFzQixDQUFDO2dCQUVyRSxvRkFBb0Y7Z0JBQ3BGLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLG1CQUFtQixFQUFFLGFBQWEsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUU3SCxTQUFTO2dCQUNULElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2pELENBQUM7Z0JBRUQsY0FBYztnQkFDZCxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO2dCQUN2RCxDQUFDO2dCQUVELGdCQUFnQjtnQkFDaEIsSUFBSSxPQUFPLElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNsRCxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hELENBQUM7Z0JBRUQsNERBQTREO2dCQUM1RCxzREFBc0Q7Z0JBQ3RELElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztnQkFFRCxPQUFPO29CQUNOLE1BQU0sRUFBRSxjQUFjO29CQUN0QixLQUFLLEVBQUUsS0FBSztpQkFDWixDQUFDO1lBQ0gsQ0FBQztRQUNGLENBQUM7UUFFTyx1QkFBdUIsQ0FBQyxNQUFtQjtZQUNsRCxNQUFNLFNBQVMsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVwQyxvREFBb0Q7WUFDcEQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ25ELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLFdBQVcsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDdEIsTUFBTSxLQUFLLEdBQTRCO3dCQUN0QyxJQUFJLG1EQUEwQzt3QkFDOUMsTUFBTTt3QkFDTixXQUFXO3FCQUNYLENBQUM7b0JBQ0YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiw4QkFBOEI7WUFDOUIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUMxQyxNQUFNLEtBQUssR0FBNEI7b0JBQ3RDLElBQUksNENBQW1DO29CQUN2QyxNQUFNO29CQUNOLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7aUJBQ3pDLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosd0JBQXdCO1lBQ3hCLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRTtnQkFDMUMsTUFBTSxLQUFLLEdBQTRCO29CQUN0QyxJQUFJLDJDQUFtQztvQkFDdkMsTUFBTTtvQkFDTixXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO2lCQUN6QyxDQUFDO2dCQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLDZCQUE2QjtZQUM3QixTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pELE1BQU0sS0FBSyxHQUE0QjtvQkFDdEMsSUFBSSxrREFBMEM7b0JBQzlDLE1BQU07b0JBQ04sV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztpQkFDekMsQ0FBQztnQkFDRixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSix5REFBeUQ7WUFDekQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzNDLElBQUksS0FBSyxDQUFDLElBQUksOENBQXNDLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDdkYsSUFBQSxtQkFBTyxFQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNuQixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sYUFBYSxDQUFDLFNBQXNCLEVBQUUsV0FBd0IsRUFBRSxZQUFvQixFQUFFLFFBQVEsR0FBRyxJQUFJO1lBQzVHLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLDJCQUFrQixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLDJEQUEyRDtZQUVwSiw2RkFBNkY7WUFDN0YsMkZBQTJGO1lBQzNGLDBFQUEwRTtZQUMxRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFOUMsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxLQUFLLEdBQTJCO29CQUNyQyxJQUFJLDJDQUFtQztvQkFDdkMsR0FBRyxXQUFXO2lCQUNkLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQyxDQUFDO1FBQ0YsQ0FBQztRQUVELFdBQVcsQ0FBQyxTQUFzQixFQUFFLE9BQU8sR0FBRywyQkFBa0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxHQUFHLElBQUk7WUFDeEYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXJFLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sS0FBSyxHQUEyQjtvQkFDckMsSUFBSSwyQ0FBbUM7b0JBQ3ZDLEdBQUcsV0FBVztpQkFDZCxDQUFDO2dCQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRW5DLE9BQU8sV0FBVyxDQUFDO1lBQ3BCLENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU8sYUFBYSxDQUFDLFNBQXNCLEVBQUUsT0FBMkIsRUFBRSxRQUFpQjtZQUMzRixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sU0FBUyxDQUFDLENBQUMsWUFBWTtZQUMvQixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXBDLHVCQUF1QjtZQUN2QixJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFFbkQsdUJBQXVCO2dCQUN2QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN6QixJQUFJLFNBQXNCLENBQUM7b0JBQzNCLElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7d0JBQ3RDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsa0ZBQWtGO29CQUM1RyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQ3ZDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFEQUFxRDt3QkFDM0YsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlDQUFpQzt3QkFDdkUsQ0FBQztvQkFDRixDQUFDO29CQUVELElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELENBQUM7Z0JBRUQsYUFBYTtxQkFDUixDQUFDO29CQUNMLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixDQUFDO1lBQ0YsQ0FBQztZQUVELHdCQUF3QjtZQUN4QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNyQixDQUFDO1lBRUQsd0JBQXdCO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTlCLHFCQUFxQjtZQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV6QixRQUFRO1lBQ1IsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUN4RCxDQUFDO1FBRUQsVUFBVSxDQUFDLFNBQXNCLEVBQUUsT0FBZTtZQUVqRCwyQ0FBMkM7WUFDM0MsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNuQyxDQUFDO2lCQUFNLElBQUksT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN4QixPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLE9BQU8sS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDcEMsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFM0IsNEVBQTRFO1lBQzVFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZixDQUFDO1lBRUQsMkRBQTJEO2lCQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZixDQUFDO1lBRUQsT0FBTztZQUNQLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXhDLGFBQWE7WUFDYixNQUFNLEtBQUssR0FBMEI7Z0JBQ3BDLElBQUksMENBQWtDO2dCQUN0QyxNQUFNO2dCQUNOLGNBQWMsRUFBRSxLQUFLO2dCQUNyQixXQUFXLEVBQUUsT0FBTzthQUNwQixDQUFDO1lBQ0YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVuQyx1REFBdUQ7WUFDdkQsSUFBSSxNQUFNLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1QixNQUFNLEtBQUssR0FBNEI7b0JBQ3RDLElBQUksNkNBQW9DO29CQUN4QyxNQUFNO29CQUNOLFdBQVcsRUFBRSxPQUFPO2lCQUNwQixDQUFDO2dCQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUVELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELFNBQVMsQ0FBQyxTQUFrQztZQUMzQyxJQUFJLE1BQU0sR0FBNEIsU0FBUyxDQUFDO1lBRWhELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sY0FBYztZQUNyQixnRUFBZ0U7WUFDaEUsNERBQTREO1lBQzVELDREQUE0RDtZQUM1RCxTQUFTO1lBQ1QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksMkNBQW1DLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFTyxlQUFlLENBQUMsU0FBc0I7WUFDN0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxDQUFDLFlBQVk7WUFDckIsQ0FBQztZQUVELE1BQU0sQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBRWxDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRXRDLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLFdBQVcsQ0FBQyxNQUFtQixFQUFFLFdBQW1CO1lBQzNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sQ0FBQyxpQkFBaUI7WUFDMUIsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBRXJCLDZCQUE2QjtZQUM3QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXpCLFFBQVE7WUFDUixNQUFNLEtBQUssR0FBNEI7Z0JBQ3RDLElBQUksNENBQW9DO2dCQUN4QyxNQUFNO2dCQUNOLFdBQVc7YUFDWCxDQUFDO1lBQ0YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsUUFBUSxDQUFDLEtBQWE7WUFDckIseURBQXlEO1lBQ3pELDREQUE0RDtZQUM1RCw0REFBNEQ7WUFDNUQsU0FBUztZQUNULElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLDBDQUFrQyxFQUFFLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsUUFBUSxDQUFDLEtBQWE7WUFDckIseURBQXlEO1lBQ3pELDREQUE0RDtZQUM1RCw0REFBNEQ7WUFDNUQsU0FBUztZQUNULElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLDBDQUFrQyxFQUFFLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsR0FBRyxDQUFDLFNBQXNCO1lBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNWLE9BQU8sQ0FBQyxZQUFZO1lBQ3JCLENBQUM7WUFFRCxNQUFNLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUVsQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVoQyxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxLQUFLLENBQUMsTUFBbUIsRUFBRSxXQUFtQjtZQUNyRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxDQUFDLGdDQUFnQztZQUN6QyxDQUFDO1lBRUQsa0JBQWtCO1lBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWpDLG1EQUFtRDtZQUNuRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUVwQixRQUFRO1lBQ1IsTUFBTSxLQUFLLEdBQTRCO2dCQUN0QyxJQUFJLDBDQUFpQztnQkFDckMsTUFBTTtnQkFDTixXQUFXO2FBQ1gsQ0FBQztZQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELEtBQUssQ0FBQyxTQUFzQjtZQUMzQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixPQUFPLENBQUMsWUFBWTtZQUNyQixDQUFDO1lBRUQsTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUM7WUFFbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFbEMsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sT0FBTyxDQUFDLE1BQW1CLEVBQUUsV0FBbUI7WUFDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsT0FBTyxDQUFDLGlDQUFpQztZQUMxQyxDQUFDO1lBRUQsVUFBVTtZQUNWLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFdEIsUUFBUTtZQUNSLE1BQU0sS0FBSyxHQUE0QjtnQkFDdEMsSUFBSSwwQ0FBaUM7Z0JBQ3JDLE1BQU07Z0JBQ04sV0FBVzthQUNYLENBQUM7WUFDRixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRW5DLGtDQUFrQztZQUNsQyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSwyQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4RCxDQUFDO1FBQ0YsQ0FBQztRQUVELFFBQVEsQ0FBQyxhQUFtQztZQUMzQyxJQUFJLE1BQW1CLENBQUM7WUFDeEIsSUFBSSxPQUFPLGFBQWEsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDdEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sR0FBRyxhQUFhLENBQUM7WUFDeEIsQ0FBQztZQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELEtBQUssQ0FBQyxTQUFzQjtZQUMzQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixPQUFPLENBQUMsWUFBWTtZQUNyQixDQUFDO1lBRUQsTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUM7WUFFbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFbEMsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sT0FBTyxDQUFDLE1BQW1CLEVBQUUsV0FBbUI7WUFDdkQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sQ0FBQyxxQ0FBcUM7WUFDOUMsQ0FBQztZQUVELGFBQWE7WUFDYixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRWpCLDJDQUEyQztZQUMzQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV4QyxzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWQsUUFBUTtZQUNSLE1BQU0sS0FBSyxHQUE0QjtnQkFDdEMsSUFBSSw2Q0FBb0M7Z0JBQ3hDLE1BQU07Z0JBQ04sV0FBVyxFQUFFLGNBQWM7YUFDM0IsQ0FBQztZQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELE9BQU8sQ0FBQyxTQUFzQjtZQUM3QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixPQUFPLENBQUMsWUFBWTtZQUNyQixDQUFDO1lBRUQsTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUM7WUFFbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFcEMsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sU0FBUyxDQUFDLE1BQW1CLEVBQUUsV0FBbUI7WUFDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxDQUFDLG1DQUFtQztZQUM1QyxDQUFDO1lBRUQsZ0RBQWdEO1lBQ2hELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbkMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFeEMsc0JBQXNCO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUVkLFFBQVE7WUFDUixNQUFNLEtBQUssR0FBNEI7Z0JBQ3RDLElBQUksNkNBQW9DO2dCQUN4QyxNQUFNO2dCQUNOLFdBQVcsRUFBRSxjQUFjO2FBQzNCLENBQUM7WUFDRixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxRQUFRLENBQUMsZ0JBQXNDO1lBQzlDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxLQUFLLENBQUMsQ0FBQyxtQkFBbUI7WUFDbEMsQ0FBQztZQUVELElBQUksS0FBYSxDQUFDO1lBQ2xCLElBQUksT0FBTyxnQkFBZ0IsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsS0FBSyxHQUFHLGdCQUFnQixDQUFDO1lBQzFCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7WUFFRCxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDZixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzdCLENBQUM7UUFFRCxZQUFZLENBQUMsU0FBc0IsRUFBRSxTQUFrQjtZQUN0RCxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLENBQUMsc0JBQXNCO1lBQy9CLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixPQUFPLENBQUMsWUFBWTtZQUNyQixDQUFDO1lBRUQsTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUM7WUFFbEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXBELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLGNBQWMsQ0FBQyxNQUFtQixFQUFFLFdBQW1CLEVBQUUsU0FBa0I7WUFDbEYsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBRUQsUUFBUTtZQUNSLE1BQU0sS0FBSyxHQUE0QjtnQkFDdEMsSUFBSSxnREFBdUM7Z0JBQzNDLE1BQU07Z0JBQ04sV0FBVzthQUNYLENBQUM7WUFDRixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxXQUFXLENBQUMsYUFBbUM7WUFDOUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxLQUFLLENBQUMsQ0FBQyxzQkFBc0I7WUFDckMsQ0FBQztZQUVELElBQUksTUFBK0IsQ0FBQztZQUNwQyxJQUFJLE9BQU8sYUFBYSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBRUQsT0FBTyxDQUFDLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFTyxNQUFNLENBQUMsS0FBYSxFQUFFLEdBQVksRUFBRSxNQUFvQjtZQUMvRCxNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFcEQsMEJBQTBCO1lBQzFCLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2YsQ0FBQztZQUVELDJCQUEyQjtZQUMzQixJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFFRCxpQkFBaUI7WUFDakIsQ0FBQztnQkFDQSxNQUFNO2dCQUNOLElBQUksQ0FBQyxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ3BCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQzNCLDJDQUEyQzt3QkFDM0MsNkNBQTZDO3dCQUM3QyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDdkIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLDBDQUEwQzt3QkFDMUMsMkNBQTJDO3dCQUMzQyxnREFBZ0Q7d0JBQ2hELHlDQUF5Qzt3QkFDekMsMENBQTBDO3dCQUMxQyw0Q0FBNEM7d0JBQzVDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBQy9CLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxtQkFBbUI7cUJBQ2QsQ0FBQztvQkFDTCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFbkUsU0FBUztvQkFDVCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0I7b0JBQ25ELENBQUM7b0JBRUQsVUFBVTt5QkFDTCxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtvQkFDbkUsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLENBQUMsU0FBbUQsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUE2QjtZQUNqSCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUUxQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUM5QyxrRUFBa0U7b0JBQ2xFLHFFQUFxRTtvQkFDckUscUVBQXFFO29CQUNyRSxJQUFJLE9BQU8sRUFBRSxpQkFBaUIsSUFBSSxNQUFNLFlBQVksNkNBQXFCLElBQUksQ0FBQyxDQUFDLFNBQVMsWUFBWSw2Q0FBcUIsQ0FBQyxFQUFFLENBQUM7d0JBQzVILEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1gsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLEtBQUssR0FBRyxDQUFDLENBQUM7d0JBQ1YsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsVUFBVSxDQUFDLFNBQTZCLEVBQUUsT0FBNkI7WUFDdEUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM3RCxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNsQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELE9BQU8sQ0FBQyxTQUE2QixFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTztZQUM1RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxNQUFNLENBQUMsU0FBNkIsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU87WUFDM0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxRQUFRLENBQUMsU0FBNEMsRUFBRSxPQUE2QjtZQUNuRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVPLE9BQU8sQ0FBQyxNQUFzQyxFQUFFLFNBQW1ELEVBQUUsT0FBNkI7WUFDekksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLE9BQU8sRUFBRSxpQkFBaUIsSUFBSSxNQUFNLFlBQVksNkNBQXFCLElBQUksQ0FBQyxDQUFDLFNBQVMsWUFBWSw2Q0FBcUIsQ0FBQyxFQUFFLENBQUM7Z0JBQzVILFFBQVEsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQ25DLEtBQUsseUJBQWdCLENBQUMsR0FBRzt3QkFDeEIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQzs0QkFDNUcsT0FBTyxJQUFJLENBQUM7d0JBQ2IsQ0FBQzt3QkFDRCxNQUFNO29CQUNQLEtBQUsseUJBQWdCLENBQUMsSUFBSTt3QkFDekIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQzs0QkFDNUcsT0FBTyxJQUFJLENBQUM7d0JBQ2IsQ0FBQzt3QkFDRCxNQUFNO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxLQUFLLFNBQVMsQ0FBQztZQUUxQyxJQUFJLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxZQUFZLENBQUM7WUFDckIsQ0FBQztZQUVELE9BQU8sWUFBWSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQWU7WUFDbkIsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFFckIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksMkNBQW1DLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSztZQUNKLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsa0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFcEYsNkJBQTZCO1lBQzdCLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEMsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDN0IsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzNCLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUUzQiwrQ0FBK0M7WUFDL0MsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3BDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsU0FBUztZQUNSLE1BQU0sUUFBUSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5Qix5QkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVyRix5REFBeUQ7WUFDekQsdURBQXVEO1lBQ3ZELCtDQUErQztZQUMvQyxNQUFNLG1CQUFtQixHQUFrQixFQUFFLENBQUM7WUFDOUMsTUFBTSxpQkFBaUIsR0FBNkIsRUFBRSxDQUFDO1lBQ3ZELElBQUksd0JBQTRDLENBQUM7WUFDakQsSUFBSSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBRXJDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQztnQkFFL0IsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlELElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdEIsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFFckcsMkJBQTJCO29CQUMzQixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUMvQixrQkFBa0IsR0FBRyxJQUFJLENBQUM7d0JBRTFCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7d0JBQ3JELG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFFakMsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRSxDQUFDOzRCQUM3Qix3QkFBd0IsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUMzRCxDQUFDO29CQUNGLENBQUM7b0JBRUQsOEJBQThCO3lCQUN6QixDQUFDO3dCQUNMLGtCQUFrQixHQUFHLEtBQUssQ0FBQztvQkFDNUIsQ0FBQztnQkFDRixDQUFDO2dCQUVELGtGQUFrRjtnQkFDbEYsSUFBSSxDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDN0Msa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFOUcsT0FBTztnQkFDTixFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ1gsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDdEMsT0FBTyxFQUFFLGlCQUFpQjtnQkFDMUIsR0FBRyxFQUFFLGVBQWU7Z0JBQ3BCLE9BQU8sRUFBRSx3QkFBd0I7Z0JBQ2pDLE1BQU0sRUFBRSxrQkFBa0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQ2hFLENBQUM7UUFDSCxDQUFDO1FBRU8sV0FBVyxDQUFDLElBQWlDO1lBQ3BELE1BQU0sUUFBUSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5Qix5QkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVyRixJQUFJLE9BQU8sSUFBSSxDQUFDLEVBQUUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUVuQixrQkFBZ0IsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxrQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLDhDQUE4QztZQUNuSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLEdBQUcsR0FBRyxrQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQjtZQUM5RCxDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsaUJBQVEsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDckQsSUFBSSxNQUFNLEdBQTRCLFNBQVMsQ0FBQztnQkFFaEQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM1RCxJQUFJLGdCQUFnQixFQUFFLENBQUM7b0JBQ3RCLE1BQU0sa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVGLElBQUksa0JBQWtCLFlBQVkseUJBQVcsRUFBRSxDQUFDO3dCQUMvQyxNQUFNLEdBQUcsa0JBQWtCLENBQUM7d0JBQzVCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDdEMsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUN4RSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxvRkFBb0Y7Z0JBQ3BHLENBQUM7Z0JBRUQsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFBLGlCQUFRLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUIsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0MsQ0FBQztZQUVELElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDM0IsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNqQixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUEsbUJBQU8sRUFBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUV2QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQzs7SUE5K0JXLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBK0IxQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7T0FoQ1gsZ0JBQWdCLENBKytCNUIifQ==