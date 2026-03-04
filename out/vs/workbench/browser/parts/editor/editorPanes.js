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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/browser/parts/editor/editor", "vs/base/common/types", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/parts/editor/editorPlaceholder", "vs/platform/editor/common/editor", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/platform/log/common/log", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/host/browser/host"], function (require, exports, nls_1, event_1, severity_1, lifecycle_1, editor_1, dom_1, platform_1, layoutService_1, instantiation_1, progress_1, editor_2, types_1, workspaceTrust_1, editorPlaceholder_1, editor_3, errors_1, errorMessage_1, log_1, dialogs_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorPanes = void 0;
    let EditorPanes = class EditorPanes extends lifecycle_1.Disposable {
        //#endregion
        get minimumWidth() { return this._activeEditorPane?.minimumWidth ?? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width; }
        get minimumHeight() { return this._activeEditorPane?.minimumHeight ?? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height; }
        get maximumWidth() { return this._activeEditorPane?.maximumWidth ?? editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width; }
        get maximumHeight() { return this._activeEditorPane?.maximumHeight ?? editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height; }
        get activeEditorPane() { return this._activeEditorPane; }
        constructor(editorGroupParent, editorPanesParent, groupView, layoutService, instantiationService, editorProgressService, workspaceTrustService, logService, dialogService, hostService) {
            super();
            this.editorGroupParent = editorGroupParent;
            this.editorPanesParent = editorPanesParent;
            this.groupView = groupView;
            this.layoutService = layoutService;
            this.instantiationService = instantiationService;
            this.editorProgressService = editorProgressService;
            this.workspaceTrustService = workspaceTrustService;
            this.logService = logService;
            this.dialogService = dialogService;
            this.hostService = hostService;
            //#region Events
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidChangeSizeConstraints = this._register(new event_1.Emitter());
            this.onDidChangeSizeConstraints = this._onDidChangeSizeConstraints.event;
            this._activeEditorPane = null;
            this.editorPanes = [];
            this.activeEditorPaneDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorOperation = this._register(new progress_1.LongRunningOperation(this.editorProgressService));
            this.editorPanesRegistry = platform_1.Registry.as(editor_1.EditorExtensions.EditorPane);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.workspaceTrustService.onDidChangeTrust(() => this.onDidChangeWorkspaceTrust()));
        }
        onDidChangeWorkspaceTrust() {
            // If the active editor pane requires workspace trust
            // we need to re-open it anytime trust changes to
            // account for it.
            // For that we explicitly call into the group-view
            // to handle errors properly.
            const editor = this._activeEditorPane?.input;
            const options = this._activeEditorPane?.options;
            if (editor?.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */)) {
                this.groupView.openEditor(editor, options);
            }
        }
        async openEditor(editor, options, internalOptions, context = Object.create(null)) {
            try {
                return await this.doOpenEditor(this.getEditorPaneDescriptor(editor), editor, options, internalOptions, context);
            }
            catch (error) {
                // First check if caller instructed us to ignore error handling
                if (options?.ignoreError) {
                    return { error };
                }
                // In case of an error when opening an editor, we still want to show
                // an editor in the desired location to preserve the user intent and
                // view state (e.g. when restoring).
                //
                // For that reason we have place holder editors that can convey a
                // message with actions the user can click on.
                return this.doShowError(error, editor, options, internalOptions, context);
            }
        }
        async doShowError(error, editor, options, internalOptions, context) {
            // Always log the error to figure out what is going on
            this.logService.error(error);
            // Show as modal dialog when explicit user action unless disabled
            let errorHandled = false;
            if (options?.source === editor_3.EditorOpenSource.USER && (!(0, editor_1.isEditorOpenError)(error) || error.allowDialog)) {
                errorHandled = await this.doShowErrorDialog(error, editor);
            }
            // Return early if the user dealt with the error already
            if (errorHandled) {
                return { error };
            }
            // Show as editor placeholder: pass over the error to display
            const editorPlaceholderOptions = { ...options };
            if (!(0, errors_1.isCancellationError)(error)) {
                editorPlaceholderOptions.error = error;
            }
            return {
                ...(await this.doOpenEditor(editorPlaceholder_1.ErrorPlaceholderEditor.DESCRIPTOR, editor, editorPlaceholderOptions, internalOptions, context)),
                error
            };
        }
        async doShowErrorDialog(error, editor) {
            let severity = severity_1.default.Error;
            let message = undefined;
            let detail = (0, errorMessage_1.toErrorMessage)(error);
            let errorActions = undefined;
            if ((0, editor_1.isEditorOpenError)(error)) {
                errorActions = error.actions;
                severity = error.forceSeverity ?? severity_1.default.Error;
                if (error.forceMessage) {
                    message = error.message;
                    detail = undefined;
                }
            }
            if (!message) {
                message = (0, nls_1.localize)('editorOpenErrorDialog', "Unable to open '{0}'", editor.getName());
            }
            const buttons = [];
            if (errorActions && errorActions.length > 0) {
                for (const errorAction of errorActions) {
                    buttons.push({
                        label: errorAction.label,
                        run: () => errorAction
                    });
                }
            }
            else {
                buttons.push({
                    label: (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                    run: () => undefined
                });
            }
            let cancelButton = undefined;
            if (buttons.length === 1) {
                cancelButton = {
                    run: () => {
                        errorHandled = true; // treat cancel as handled and do not show placeholder
                        return undefined;
                    }
                };
            }
            let errorHandled = false; // by default, show placeholder
            const { result } = await this.dialogService.prompt({
                type: severity,
                message,
                detail,
                buttons,
                cancelButton
            });
            if (result) {
                const errorActionResult = result.run();
                if (errorActionResult instanceof Promise) {
                    errorActionResult.catch(error => this.dialogService.error((0, errorMessage_1.toErrorMessage)(error)));
                }
                errorHandled = true; // treat custom error action as handled and do not show placeholder
            }
            return errorHandled;
        }
        async doOpenEditor(descriptor, editor, options, internalOptions, context = Object.create(null)) {
            // Editor pane
            const pane = this.doShowEditorPane(descriptor);
            // Remember current active element for deciding to restore focus later
            const activeElement = (0, dom_1.getActiveElement)();
            // Apply input to pane
            const { changed, cancelled } = await this.doSetInput(pane, editor, options, context);
            // Make sure to pass focus to the pane or otherwise
            // make sure that the pane window is visible unless
            // this has been explicitly disabled.
            if (!cancelled) {
                const focus = !options || !options.preserveFocus;
                if (focus && this.shouldRestoreFocus(activeElement)) {
                    pane.focus();
                }
                else if (!internalOptions?.preserveWindowOrder) {
                    this.hostService.moveTop((0, dom_1.getWindowById)(this.groupView.windowId, true).window);
                }
            }
            return { pane, changed, cancelled };
        }
        shouldRestoreFocus(expectedActiveElement) {
            if (!this.layoutService.isRestored()) {
                return true; // restore focus if we are not restored yet on startup
            }
            if (!expectedActiveElement) {
                return true; // restore focus if nothing was focused
            }
            const activeElement = (0, dom_1.getActiveElement)();
            if (!activeElement || activeElement === expectedActiveElement.ownerDocument.body) {
                return true; // restore focus if nothing is focused currently
            }
            const same = expectedActiveElement === activeElement;
            if (same) {
                return true; // restore focus if same element is still active
            }
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                // This is to avoid regressions from not restoring focus as we used to:
                // Only allow a different input element (or textarea) to remain focused
                // but not other elements that do not accept text input.
                return true;
            }
            if ((0, dom_1.isAncestor)(activeElement, this.editorGroupParent)) {
                return true; // restore focus if active element is still inside our editor group
            }
            return false; // do not restore focus
        }
        getEditorPaneDescriptor(editor) {
            if (editor.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */) && !this.workspaceTrustService.isWorkspaceTrusted()) {
                // Workspace trust: if an editor signals it needs workspace trust
                // but the current workspace is untrusted, we fallback to a generic
                // editor descriptor to indicate this an do NOT load the registered
                // editor.
                return editorPlaceholder_1.WorkspaceTrustRequiredPlaceholderEditor.DESCRIPTOR;
            }
            return (0, types_1.assertIsDefined)(this.editorPanesRegistry.getEditorPane(editor));
        }
        doShowEditorPane(descriptor) {
            // Return early if the currently active editor pane can handle the input
            if (this._activeEditorPane && descriptor.describes(this._activeEditorPane)) {
                return this._activeEditorPane;
            }
            // Hide active one first
            this.doHideActiveEditorPane();
            // Create editor pane
            const editorPane = this.doCreateEditorPane(descriptor);
            // Set editor as active
            this.doSetActiveEditorPane(editorPane);
            // Show editor
            const container = (0, types_1.assertIsDefined)(editorPane.getContainer());
            this.editorPanesParent.appendChild(container);
            (0, dom_1.show)(container);
            // Indicate to editor that it is now visible
            editorPane.setVisible(true);
            // Layout
            if (this.pagePosition) {
                editorPane.layout(new dom_1.Dimension(this.pagePosition.width, this.pagePosition.height), { top: this.pagePosition.top, left: this.pagePosition.left });
            }
            // Boundary sashes
            if (this.boundarySashes) {
                editorPane.setBoundarySashes(this.boundarySashes);
            }
            return editorPane;
        }
        doCreateEditorPane(descriptor) {
            // Instantiate editor
            const editorPane = this.doInstantiateEditorPane(descriptor);
            // Create editor container as needed
            if (!editorPane.getContainer()) {
                const editorPaneContainer = document.createElement('div');
                editorPaneContainer.classList.add('editor-instance');
                // It is cruicial to append the container to its parent before
                // passing on to the create() method of the pane so that the
                // right `window` can be determined in floating window cases.
                this.editorPanesParent.appendChild(editorPaneContainer);
                editorPane.create(editorPaneContainer);
            }
            return editorPane;
        }
        doInstantiateEditorPane(descriptor) {
            // Return early if already instantiated
            const existingEditorPane = this.editorPanes.find(editorPane => descriptor.describes(editorPane));
            if (existingEditorPane) {
                return existingEditorPane;
            }
            // Otherwise instantiate new
            const editorPane = this._register(descriptor.instantiate(this.instantiationService, this.groupView));
            this.editorPanes.push(editorPane);
            return editorPane;
        }
        doSetActiveEditorPane(editorPane) {
            this._activeEditorPane = editorPane;
            // Clear out previous active editor pane listeners
            this.activeEditorPaneDisposables.clear();
            // Listen to editor pane changes
            if (editorPane) {
                this.activeEditorPaneDisposables.add(editorPane.onDidChangeSizeConstraints(e => this._onDidChangeSizeConstraints.fire(e)));
                this.activeEditorPaneDisposables.add(editorPane.onDidFocus(() => this._onDidFocus.fire()));
            }
            // Indicate that size constraints could have changed due to new editor
            this._onDidChangeSizeConstraints.fire(undefined);
        }
        async doSetInput(editorPane, editor, options, context) {
            // If the input did not change, return early and only
            // apply the options unless the options instruct us to
            // force open it even if it is the same
            const inputMatches = editorPane.input?.matches(editor);
            if (inputMatches && !options?.forceReload) {
                editorPane.setOptions(options);
                return { changed: false, cancelled: false };
            }
            // Start a new editor input operation to report progress
            // and to support cancellation. Any new operation that is
            // started will cancel the previous one.
            const operation = this.editorOperation.start(this.layoutService.isRestored() ? 800 : 3200);
            let cancelled = false;
            try {
                // Clear the current input before setting new input
                // This ensures that a slow loading input will not
                // be visible for the duration of the new input to
                // load (https://github.com/microsoft/vscode/issues/34697)
                editorPane.clearInput();
                // Set the input to the editor pane
                await editorPane.setInput(editor, options, context, operation.token);
                if (!operation.isCurrent()) {
                    cancelled = true;
                }
            }
            catch (error) {
                if (!operation.isCurrent()) {
                    cancelled = true;
                }
                else {
                    throw error;
                }
            }
            finally {
                operation.stop();
            }
            return { changed: !inputMatches, cancelled };
        }
        doHideActiveEditorPane() {
            if (!this._activeEditorPane) {
                return;
            }
            // Stop any running operation
            this.editorOperation.stop();
            // Indicate to editor pane before removing the editor from
            // the DOM to give a chance to persist certain state that
            // might depend on still being the active DOM element.
            this.safeRun(() => this._activeEditorPane?.clearInput());
            this.safeRun(() => this._activeEditorPane?.setVisible(false));
            // Remove editor pane from parent
            const editorPaneContainer = this._activeEditorPane.getContainer();
            if (editorPaneContainer) {
                this.editorPanesParent.removeChild(editorPaneContainer);
                (0, dom_1.hide)(editorPaneContainer);
            }
            // Clear active editor pane
            this.doSetActiveEditorPane(null);
        }
        closeEditor(editor) {
            if (this._activeEditorPane?.input && editor.matches(this._activeEditorPane.input)) {
                this.doHideActiveEditorPane();
            }
        }
        setVisible(visible) {
            this.safeRun(() => this._activeEditorPane?.setVisible(visible));
        }
        layout(pagePosition) {
            this.pagePosition = pagePosition;
            this.safeRun(() => this._activeEditorPane?.layout(new dom_1.Dimension(pagePosition.width, pagePosition.height), pagePosition));
        }
        setBoundarySashes(sashes) {
            this.boundarySashes = sashes;
            this.safeRun(() => this._activeEditorPane?.setBoundarySashes(sashes));
        }
        safeRun(fn) {
            // We delegate many calls to the active editor pane which
            // can be any kind of editor. We must ensure that our calls
            // do not throw, for example in `layout()` because that can
            // mess with the grid layout.
            try {
                fn();
            }
            catch (error) {
                this.logService.error(error);
            }
        }
    };
    exports.EditorPanes = EditorPanes;
    exports.EditorPanes = EditorPanes = __decorate([
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, progress_1.IEditorProgressService),
        __param(6, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(7, log_1.ILogService),
        __param(8, dialogs_1.IDialogService),
        __param(9, host_1.IHostService)
    ], EditorPanes);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFuZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yUGFuZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOER6RixJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEsc0JBQVU7UUFVMUMsWUFBWTtRQUVaLElBQUksWUFBWSxLQUFLLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLFlBQVksSUFBSSxzQ0FBNkIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzFHLElBQUksYUFBYSxLQUFLLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLGFBQWEsSUFBSSxzQ0FBNkIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdHLElBQUksWUFBWSxLQUFLLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLFlBQVksSUFBSSxzQ0FBNkIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzFHLElBQUksYUFBYSxLQUFLLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLGFBQWEsSUFBSSxzQ0FBNkIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRzdHLElBQUksZ0JBQWdCLEtBQWdDLE9BQU8sSUFBSSxDQUFDLGlCQUE4QyxDQUFDLENBQUMsQ0FBQztRQVVqSCxZQUNrQixpQkFBOEIsRUFDOUIsaUJBQThCLEVBQzlCLFNBQTJCLEVBQ25CLGFBQXVELEVBQ3pELG9CQUE0RCxFQUMzRCxxQkFBOEQsRUFDcEQscUJBQXdFLEVBQzdGLFVBQXdDLEVBQ3JDLGFBQThDLEVBQ2hELFdBQTBDO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBWFMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFhO1lBQzlCLHNCQUFpQixHQUFq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