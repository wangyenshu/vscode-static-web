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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/dataTransfer", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/platform", "vs/base/common/uuid", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/dnd", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/dropOrPasteInto/browser/defaultProviders", "vs/editor/contrib/dropOrPasteInto/browser/edit", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/inlineProgress/browser/inlineProgress", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "./postEditWidget"], function (require, exports, dom_1, arrays_1, async_1, dataTransfer_1, hierarchicalKind_1, lifecycle_1, mime_1, platform, uuid_1, textAreaInput_1, dnd_1, bulkEditService_1, range_1, languages_1, languageFeatures_1, defaultProviders_1, edit_1, editorState_1, inlineProgress_1, messageController_1, nls_1, clipboardService_1, contextkey_1, instantiation_1, progress_1, quickInput_1, postEditWidget_1) {
    "use strict";
    var CopyPasteController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CopyPasteController = exports.pasteWidgetVisibleCtx = exports.changePasteTypeCommandId = void 0;
    exports.changePasteTypeCommandId = 'editor.changePasteType';
    exports.pasteWidgetVisibleCtx = new contextkey_1.RawContextKey('pasteWidgetVisible', false, (0, nls_1.localize)('pasteWidgetVisible', "Whether the paste widget is showing"));
    const vscodeClipboardMime = 'application/vnd.code.copyMetadata';
    let CopyPasteController = class CopyPasteController extends lifecycle_1.Disposable {
        static { CopyPasteController_1 = this; }
        static { this.ID = 'editor.contrib.copyPasteActionController'; }
        static get(editor) {
            return editor.getContribution(CopyPasteController_1.ID);
        }
        constructor(editor, instantiationService, _bulkEditService, _clipboardService, _languageFeaturesService, _quickInputService, _progressService) {
            super();
            this._bulkEditService = _bulkEditService;
            this._clipboardService = _clipboardService;
            this._languageFeaturesService = _languageFeaturesService;
            this._quickInputService = _quickInputService;
            this._progressService = _progressService;
            this._editor = editor;
            const container = editor.getContainerDomNode();
            this._register((0, dom_1.addDisposableListener)(container, 'copy', e => this.handleCopy(e)));
            this._register((0, dom_1.addDisposableListener)(container, 'cut', e => this.handleCopy(e)));
            this._register((0, dom_1.addDisposableListener)(container, 'paste', e => this.handlePaste(e), true));
            this._pasteProgressManager = this._register(new inlineProgress_1.InlineProgressManager('pasteIntoEditor', editor, instantiationService));
            this._postPasteWidgetManager = this._register(instantiationService.createInstance(postEditWidget_1.PostEditWidgetManager, 'pasteIntoEditor', editor, exports.pasteWidgetVisibleCtx, { id: exports.changePasteTypeCommandId, label: (0, nls_1.localize)('postPasteWidgetTitle', "Show paste options...") }));
        }
        changePasteType() {
            this._postPasteWidgetManager.tryShowSelector();
        }
        pasteAs(preferred) {
            this._editor.focus();
            try {
                this._pasteAsActionContext = { preferred };
                (0, dom_1.getActiveDocument)().execCommand('paste');
            }
            finally {
                this._pasteAsActionContext = undefined;
            }
        }
        clearWidgets() {
            this._postPasteWidgetManager.clear();
        }
        isPasteAsEnabled() {
            return this._editor.getOption(85 /* EditorOption.pasteAs */).enabled
                && !this._editor.getOption(91 /* EditorOption.readOnly */);
        }
        async finishedPaste() {
            await this._currentPasteOperation;
        }
        handleCopy(e) {
            if (!this._editor.hasTextFocus()) {
                return;
            }
            if (platform.isWeb) {
                // Explicitly clear the web resources clipboard.
                // This is needed because on web, the browser clipboard is faked out using an in-memory store.
                // This means the resources clipboard is not properly updated when copying from the editor.
                this._clipboardService.writeResources([]);
            }
            if (!e.clipboardData || !this.isPasteAsEnabled()) {
                return;
            }
            const model = this._editor.getModel();
            const selections = this._editor.getSelections();
            if (!model || !selections?.length) {
                return;
            }
            const enableEmptySelectionClipboard = this._editor.getOption(37 /* EditorOption.emptySelectionClipboard */);
            let ranges = selections;
            const wasFromEmptySelection = selections.length === 1 && selections[0].isEmpty();
            if (wasFromEmptySelection) {
                if (!enableEmptySelectionClipboard) {
                    return;
                }
                ranges = [new range_1.Range(ranges[0].startLineNumber, 1, ranges[0].startLineNumber, 1 + model.getLineLength(ranges[0].startLineNumber))];
            }
            const toCopy = this._editor._getViewModel()?.getPlainTextToCopy(selections, enableEmptySelectionClipboard, platform.isWindows);
            const multicursorText = Array.isArray(toCopy) ? toCopy : null;
            const defaultPastePayload = {
                multicursorText,
                pasteOnNewLine: wasFromEmptySelection,
                mode: null
            };
            const providers = this._languageFeaturesService.documentPasteEditProvider
                .ordered(model)
                .filter(x => !!x.prepareDocumentPaste);
            if (!providers.length) {
                this.setCopyMetadata(e.clipboardData, { defaultPastePayload });
                return;
            }
            const dataTransfer = (0, dnd_1.toVSDataTransfer)(e.clipboardData);
            const providerCopyMimeTypes = providers.flatMap(x => x.copyMimeTypes ?? []);
            // Save off a handle pointing to data that VS Code maintains.
            const handle = (0, uuid_1.generateUuid)();
            this.setCopyMetadata(e.clipboardData, {
                id: handle,
                providerCopyMimeTypes,
                defaultPastePayload
            });
            const promise = (0, async_1.createCancelablePromise)(async (token) => {
                const results = (0, arrays_1.coalesce)(await Promise.all(providers.map(async (provider) => {
                    try {
                        return await provider.prepareDocumentPaste(model, ranges, dataTransfer, token);
                    }
                    catch (err) {
                        console.error(err);
                        return undefined;
                    }
                })));
                // Values from higher priority providers should overwrite values from lower priority ones.
                // Reverse the array to so that the calls to `replace` below will do this
                results.reverse();
                for (const result of results) {
                    for (const [mime, value] of result) {
                        dataTransfer.replace(mime, value);
                    }
                }
                return dataTransfer;
            });
            CopyPasteController_1._currentCopyOperation?.dataTransferPromise.cancel();
            CopyPasteController_1._currentCopyOperation = { handle: handle, dataTransferPromise: promise };
        }
        async handlePaste(e) {
            if (!e.clipboardData || !this._editor.hasTextFocus()) {
                return;
            }
            messageController_1.MessageController.get(this._editor)?.closeMessage();
            this._currentPasteOperation?.cancel();
            this._currentPasteOperation = undefined;
            const model = this._editor.getModel();
            const selections = this._editor.getSelections();
            if (!selections?.length || !model) {
                return;
            }
            if (!this.isPasteAsEnabled()
                && !this._pasteAsActionContext // Still enable if paste as was explicitly requested
            ) {
                return;
            }
            const metadata = this.fetchCopyMetadata(e);
            const dataTransfer = (0, dnd_1.toExternalVSDataTransfer)(e.clipboardData);
            dataTransfer.delete(vscodeClipboardMime);
            const allPotentialMimeTypes = [
                ...e.clipboardData.types,
                ...metadata?.providerCopyMimeTypes ?? [],
                // TODO: always adds `uri-list` because this get set if there are resources in the system clipboard.
                // However we can only check the system clipboard async. For this early check, just add it in.
                // We filter providers again once we have the final dataTransfer we will use.
                mime_1.Mimes.uriList,
            ];
            const allProviders = this._languageFeaturesService.documentPasteEditProvider
                .ordered(model)
                .filter(provider => {
                // Filter out providers that don't match the requested paste types
                const preference = this._pasteAsActionContext?.preferred;
                if (preference) {
                    if (provider.providedPasteEditKinds && !this.providerMatchesPreference(provider, preference)) {
                        return false;
                    }
                }
                // And providers that don't handle any of mime types in the clipboard
                return provider.pasteMimeTypes?.some(type => (0, dataTransfer_1.matchesMimeType)(type, allPotentialMimeTypes));
            });
            if (!allProviders.length) {
                if (this._pasteAsActionContext?.preferred) {
                    this.showPasteAsNoEditMessage(selections, this._pasteAsActionContext.preferred);
                }
                return;
            }
            // Prevent the editor's default paste handler from running.
            // Note that after this point, we are fully responsible for handling paste.
            // If we can't provider a paste for any reason, we need to explicitly delegate pasting back to the editor.
            e.preventDefault();
            e.stopImmediatePropagation();
            if (this._pasteAsActionContext) {
                this.showPasteAsPick(this._pasteAsActionContext.preferred, allProviders, selections, dataTransfer, metadata);
            }
            else {
                this.doPasteInline(allProviders, selections, dataTransfer, metadata, e);
            }
        }
        showPasteAsNoEditMessage(selections, preference) {
            messageController_1.MessageController.get(this._editor)?.showMessage((0, nls_1.localize)('pasteAsError', "No paste edits for '{0}' found", preference instanceof hierarchicalKind_1.HierarchicalKind ? preference.value : preference.providerId), selections[0].getStartPosition());
        }
        doPasteInline(allProviders, selections, dataTransfer, metadata, clipboardEvent) {
            const p = (0, async_1.createCancelablePromise)(async (token) => {
                const editor = this._editor;
                if (!editor.hasModel()) {
                    return;
                }
                const model = editor.getModel();
                const tokenSource = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* CodeEditorStateFlag.Value */ | 2 /* CodeEditorStateFlag.Selection */, undefined, token);
                try {
                    await this.mergeInDataFromCopy(dataTransfer, metadata, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    const supportedProviders = allProviders.filter(provider => this.isSupportedPasteProvider(provider, dataTransfer));
                    if (!supportedProviders.length
                        || (supportedProviders.length === 1 && supportedProviders[0] instanceof defaultProviders_1.DefaultTextPasteOrDropEditProvider) // Only our default text provider is active
                    ) {
                        return this.applyDefaultPasteHandler(dataTransfer, metadata, tokenSource.token, clipboardEvent);
                    }
                    const context = {
                        triggerKind: languages_1.DocumentPasteTriggerKind.Automatic,
                    };
                    const providerEdits = await this.getPasteEdits(supportedProviders, dataTransfer, model, selections, context, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    // If the only edit returned is our default text edit, use the default paste handler
                    if (providerEdits.length === 1 && providerEdits[0].provider instanceof defaultProviders_1.DefaultTextPasteOrDropEditProvider) {
                        return this.applyDefaultPasteHandler(dataTransfer, metadata, tokenSource.token, clipboardEvent);
                    }
                    if (providerEdits.length) {
                        const canShowWidget = editor.getOption(85 /* EditorOption.pasteAs */).showPasteSelector === 'afterPaste';
                        return this._postPasteWidgetManager.applyEditAndShowIfNeeded(selections, { activeEditIndex: 0, allEdits: providerEdits }, canShowWidget, async (edit, token) => {
                            const resolved = await edit.provider.resolveDocumentPasteEdit?.(edit, token);
                            if (resolved) {
                                edit.additionalEdit = resolved.additionalEdit;
                            }
                            return edit;
                        }, tokenSource.token);
                    }
                    await this.applyDefaultPasteHandler(dataTransfer, metadata, tokenSource.token, clipboardEvent);
                }
                finally {
                    tokenSource.dispose();
                    if (this._currentPasteOperation === p) {
                        this._currentPasteOperation = undefined;
                    }
                }
            });
            this._pasteProgressManager.showWhile(selections[0].getEndPosition(), (0, nls_1.localize)('pasteIntoEditorProgress', "Running paste handlers. Click to cancel"), p);
            this._currentPasteOperation = p;
        }
        showPasteAsPick(preference, allProviders, selections, dataTransfer, metadata) {
            const p = (0, async_1.createCancelablePromise)(async (token) => {
                const editor = this._editor;
                if (!editor.hasModel()) {
                    return;
                }
                const model = editor.getModel();
                const tokenSource = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* CodeEditorStateFlag.Value */ | 2 /* CodeEditorStateFlag.Selection */, undefined, token);
                try {
                    await this.mergeInDataFromCopy(dataTransfer, metadata, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    // Filter out any providers the don't match the full data transfer we will send them.
                    let supportedProviders = allProviders.filter(provider => this.isSupportedPasteProvider(provider, dataTransfer, preference));
                    if (preference) {
                        // We are looking for a specific edit
                        supportedProviders = supportedProviders.filter(provider => this.providerMatchesPreference(provider, preference));
                    }
                    const context = {
                        triggerKind: languages_1.DocumentPasteTriggerKind.PasteAs,
                        only: preference && preference instanceof hierarchicalKind_1.HierarchicalKind ? preference : undefined,
                    };
                    let providerEdits = await this.getPasteEdits(supportedProviders, dataTransfer, model, selections, context, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    // Filter out any edits that don't match the requested kind
                    if (preference) {
                        providerEdits = providerEdits.filter(edit => {
                            if (preference instanceof hierarchicalKind_1.HierarchicalKind) {
                                return preference.contains(edit.kind);
                            }
                            else {
                                return preference.providerId === edit.provider.id;
                            }
                        });
                    }
                    if (!providerEdits.length) {
                        if (context.only) {
                            this.showPasteAsNoEditMessage(selections, context.only);
                        }
                        return;
                    }
                    let pickedEdit;
                    if (preference) {
                        pickedEdit = providerEdits.at(0);
                    }
                    else {
                        const selected = await this._quickInputService.pick(providerEdits.map((edit) => ({
                            label: edit.title,
                            description: edit.kind?.value,
                            edit,
                        })), {
                            placeHolder: (0, nls_1.localize)('pasteAsPickerPlaceholder', "Select Paste Action"),
                        });
                        pickedEdit = selected?.edit;
                    }
                    if (!pickedEdit) {
                        return;
                    }
                    const combinedWorkspaceEdit = (0, edit_1.createCombinedWorkspaceEdit)(model.uri, selections, pickedEdit);
                    await this._bulkEditService.apply(combinedWorkspaceEdit, { editor: this._editor });
                }
                finally {
                    tokenSource.dispose();
                    if (this._currentPasteOperation === p) {
                        this._currentPasteOperation = undefined;
                    }
                }
            });
            this._progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                title: (0, nls_1.localize)('pasteAsProgress', "Running paste handlers"),
            }, () => p);
        }
        setCopyMetadata(dataTransfer, metadata) {
            dataTransfer.setData(vscodeClipboardMime, JSON.stringify(metadata));
        }
        fetchCopyMetadata(e) {
            if (!e.clipboardData) {
                return;
            }
            // Prefer using the clipboard data we saved off
            const rawMetadata = e.clipboardData.getData(vscodeClipboardMime);
            if (rawMetadata) {
                try {
                    return JSON.parse(rawMetadata);
                }
                catch {
                    return undefined;
                }
            }
            // Otherwise try to extract the generic text editor metadata
            const [_, metadata] = textAreaInput_1.ClipboardEventUtils.getTextData(e.clipboardData);
            if (metadata) {
                return {
                    defaultPastePayload: {
                        mode: metadata.mode,
                        multicursorText: metadata.multicursorText ?? null,
                        pasteOnNewLine: !!metadata.isFromEmptySelection,
                    },
                };
            }
            return undefined;
        }
        async mergeInDataFromCopy(dataTransfer, metadata, token) {
            if (metadata?.id && CopyPasteController_1._currentCopyOperation?.handle === metadata.id) {
                const toMergeDataTransfer = await CopyPasteController_1._currentCopyOperation.dataTransferPromise;
                if (token.isCancellationRequested) {
                    return;
                }
                for (const [key, value] of toMergeDataTransfer) {
                    dataTransfer.replace(key, value);
                }
            }
            if (!dataTransfer.has(mime_1.Mimes.uriList)) {
                const resources = await this._clipboardService.readResources();
                if (token.isCancellationRequested) {
                    return;
                }
                if (resources.length) {
                    dataTransfer.append(mime_1.Mimes.uriList, (0, dataTransfer_1.createStringDataTransferItem)(dataTransfer_1.UriList.create(resources)));
                }
            }
        }
        async getPasteEdits(providers, dataTransfer, model, selections, context, token) {
            const results = await (0, async_1.raceCancellation)(Promise.all(providers.map(async (provider) => {
                try {
                    const edits = await provider.provideDocumentPasteEdits?.(model, selections, dataTransfer, context, token);
                    // TODO: dispose of edits
                    return edits?.edits?.map(edit => ({ ...edit, provider }));
                }
                catch (err) {
                    console.error(err);
                }
                return undefined;
            })), token);
            const edits = (0, arrays_1.coalesce)(results ?? []).flat().filter(edit => {
                return !context.only || context.only.contains(edit.kind);
            });
            return (0, edit_1.sortEditsByYieldTo)(edits);
        }
        async applyDefaultPasteHandler(dataTransfer, metadata, token, clipboardEvent) {
            const textDataTransfer = dataTransfer.get(mime_1.Mimes.text) ?? dataTransfer.get('text');
            const text = (await textDataTransfer?.asString()) ?? '';
            if (token.isCancellationRequested) {
                return;
            }
            const payload = {
                clipboardEvent,
                text,
                pasteOnNewLine: metadata?.defaultPastePayload.pasteOnNewLine ?? false,
                multicursorText: metadata?.defaultPastePayload.multicursorText ?? null,
                mode: null,
            };
            this._editor.trigger('keyboard', "paste" /* Handler.Paste */, payload);
        }
        /**
         * Filter out providers if they:
         * - Don't handle any of the data transfer types we have
         * - Don't match the preferred paste kind
         */
        isSupportedPasteProvider(provider, dataTransfer, preference) {
            if (!provider.pasteMimeTypes?.some(type => dataTransfer.matches(type))) {
                return false;
            }
            return !preference || this.providerMatchesPreference(provider, preference);
        }
        providerMatchesPreference(provider, preference) {
            if (preference instanceof hierarchicalKind_1.HierarchicalKind) {
                if (!provider.providedPasteEditKinds) {
                    return true;
                }
                return provider.providedPasteEditKinds.some(providedKind => preference.contains(providedKind));
            }
            else {
                return provider.id === preference.providerId;
            }
        }
    };
    exports.CopyPasteController = CopyPasteController;
    exports.CopyPasteController = CopyPasteController = CopyPasteController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, bulkEditService_1.IBulkEditService),
        __param(3, clipboardService_1.IClipboardService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, progress_1.IProgressService)
    ], CopyPasteController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weVBhc3RlQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2Ryb3BPclBhc3RlSW50by9icm93c2VyL2NvcHlQYXN0ZUNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9DbkYsUUFBQSx3QkFBd0IsR0FBRyx3QkFBd0IsQ0FBQztJQUVwRCxRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBVSxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUscUNBQXFDLENBQUMsQ0FBQyxDQUFDO0lBRXBLLE1BQU0sbUJBQW1CLEdBQUcsbUNBQW1DLENBQUM7SUFpQnpELElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7O2lCQUUzQixPQUFFLEdBQUcsMENBQTBDLEFBQTdDLENBQThDO1FBRWhFLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUFzQixxQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBc0JELFlBQ0MsTUFBbUIsRUFDSSxvQkFBMkMsRUFDL0IsZ0JBQWtDLEVBQ2pDLGlCQUFvQyxFQUM3Qix3QkFBa0QsRUFDeEQsa0JBQXNDLEVBQ3hDLGdCQUFrQztZQUVyRSxLQUFLLEVBQUUsQ0FBQztZQU4yQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ2pDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDN0IsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUN4RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3hDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFJckUs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