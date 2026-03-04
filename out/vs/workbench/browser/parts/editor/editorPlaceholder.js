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
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/base/common/severity", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/theme/common/themeService", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/commands/common/commands", "vs/platform/workspace/common/workspace", "vs/platform/editor/common/editor", "vs/workbench/browser/editor", "vs/base/browser/ui/button/button", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/platform/files/common/files", "vs/base/common/errorMessage", "vs/platform/dialogs/common/dialogs", "vs/css!./media/editorplaceholder"], function (require, exports, nls_1, strings_1, severity_1, editor_1, editorPane_1, telemetry_1, scrollableElement_1, themeService_1, dom_1, lifecycle_1, storage_1, types_1, commands_1, workspace_1, editor_2, editor_3, button_1, defaultStyles_1, simpleIconLabel_1, files_1, errorMessage_1, dialogs_1) {
    "use strict";
    var EditorPlaceholder_1, WorkspaceTrustRequiredPlaceholderEditor_1, ErrorPlaceholderEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ErrorPlaceholderEditor = exports.WorkspaceTrustRequiredPlaceholderEditor = exports.EditorPlaceholder = void 0;
    let EditorPlaceholder = class EditorPlaceholder extends editorPane_1.EditorPane {
        static { EditorPlaceholder_1 = this; }
        static { this.PLACEHOLDER_LABEL_MAX_LENGTH = 1024; }
        constructor(id, group, telemetryService, themeService, storageService) {
            super(id, group, telemetryService, themeService, storageService);
            this.inputDisposable = this._register(new lifecycle_1.MutableDisposable());
        }
        createEditor(parent) {
            // Container
            this.container = document.createElement('div');
            this.container.className = 'monaco-editor-pane-placeholder';
            this.container.style.outline = 'none';
            this.container.tabIndex = 0; // enable focus support from the editor part (do not remove)
            // Custom Scrollbars
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.container, { horizontal: 1 /* ScrollbarVisibility.Auto */, vertical: 1 /* ScrollbarVisibility.Auto */ }));
            parent.appendChild(this.scrollbar.getDomNode());
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            // Check for cancellation
            if (token.isCancellationRequested) {
                return;
            }
            // Render Input
            this.inputDisposable.value = await this.renderInput(input, options);
        }
        async renderInput(input, options) {
            const [container, scrollbar] = (0, types_1.assertAllDefined)(this.container, this.scrollbar);
            // Reset any previous contents
            (0, dom_1.clearNode)(container);
            // Delegate to implementation for contents
            const disposables = new lifecycle_1.DisposableStore();
            const { icon, label, actions } = await this.getContents(input, options, disposables);
            const truncatedLabel = (0, strings_1.truncate)(label, EditorPlaceholder_1.PLACEHOLDER_LABEL_MAX_LENGTH);
            // Icon
            const iconContainer = container.appendChild((0, dom_1.$)('.editor-placeholder-icon-container'));
            const iconWidget = disposables.add(new simpleIconLabel_1.SimpleIconLabel(iconContainer));
            iconWidget.text = icon;
            // Label
            const labelContainer = container.appendChild((0, dom_1.$)('.editor-placeholder-label-container'));
            const labelWidget = document.createElement('span');
            labelWidget.textContent = truncatedLabel;
            labelContainer.appendChild(labelWidget);
            // ARIA label
            container.setAttribute('aria-label', `${(0, editor_3.computeEditorAriaLabel)(input, undefined, this.group, undefined)}, ${truncatedLabel}`);
            // Buttons
            if (actions.length) {
                const actionsContainer = container.appendChild((0, dom_1.$)('.editor-placeholder-buttons-container'));
                const buttons = disposables.add(new button_1.ButtonBar(actionsContainer));
                for (let i = 0; i < actions.length; i++) {
                    const button = disposables.add(buttons.addButton({
                        ...defaultStyles_1.defaultButtonStyles,
                        secondary: i !== 0
                    }));
                    button.label = actions[i].label;
                    disposables.add(button.onDidClick(e => {
                        if (e) {
                            dom_1.EventHelper.stop(e, true);
                        }
                        actions[i].run();
                    }));
                }
            }
            // Adjust scrollbar
            scrollbar.scanDomNode();
            return disposables;
        }
        clearInput() {
            if (this.container) {
                (0, dom_1.clearNode)(this.container);
            }
            this.inputDisposable.clear();
            super.clearInput();
        }
        layout(dimension) {
            const [container, scrollbar] = (0, types_1.assertAllDefined)(this.container, this.scrollbar);
            // Pass on to Container
            (0, dom_1.size)(container, dimension.width, dimension.height);
            // Adjust scrollbar
            scrollbar.scanDomNode();
            // Toggle responsive class
            container.classList.toggle('max-height-200px', dimension.height <= 200);
        }
        focus() {
            super.focus();
            this.container?.focus();
        }
        dispose() {
            this.container?.remove();
            super.dispose();
        }
    };
    exports.EditorPlaceholder = EditorPlaceholder;
    exports.EditorPlaceholder = EditorPlaceholder = EditorPlaceholder_1 = __decorate([
        __param(2, telemetry_1.ITelemetryService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService)
    ], EditorPlaceholder);
    let WorkspaceTrustRequiredPlaceholderEditor = class WorkspaceTrustRequiredPlaceholderEditor extends EditorPlaceholder {
        static { WorkspaceTrustRequiredPlaceholderEditor_1 = this; }
        static { this.ID = 'workbench.editors.workspaceTrustRequiredEditor'; }
        static { this.LABEL = (0, nls_1.localize)('trustRequiredEditor', "Workspace Trust Required"); }
        static { this.DESCRIPTOR = editor_3.EditorPaneDescriptor.create(WorkspaceTrustRequiredPlaceholderEditor_1, WorkspaceTrustRequiredPlaceholderEditor_1.ID, WorkspaceTrustRequiredPlaceholderEditor_1.LABEL); }
        constructor(group, telemetryService, themeService, commandService, workspaceService, storageService) {
            super(WorkspaceTrustRequiredPlaceholderEditor_1.ID, group, telemetryService, themeService, storageService);
            this.commandService = commandService;
            this.workspaceService = workspaceService;
        }
        getTitle() {
            return WorkspaceTrustRequiredPlaceholderEditor_1.LABEL;
        }
        async getContents() {
            return {
                icon: '$(workspace-untrusted)',
                label: (0, workspace_1.isSingleFolderWorkspaceIdentifier)((0, workspace_1.toWorkspaceIdentifier)(this.workspaceService.getWorkspace())) ?
                    (0, nls_1.localize)('requiresFolderTrustText', "The file is not displayed in the editor because trust has not been granted to the folder.") :
                    (0, nls_1.localize)('requiresWorkspaceTrustText', "The file is not displayed in the editor because trust has not been granted to the workspace."),
                actions: [
                    {
                        label: (0, nls_1.localize)('manageTrust', "Manage Workspace Trust"),
                        run: () => this.commandService.executeCommand('workbench.trust.manage')
                    }
                ]
            };
        }
    };
    exports.WorkspaceTrustRequiredPlaceholderEditor = WorkspaceTrustRequiredPlaceholderEditor;
    exports.WorkspaceTrustRequiredPlaceholderEditor = WorkspaceTrustRequiredPlaceholderEditor = WorkspaceTrustRequiredPlaceholderEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, commands_1.ICommandService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, storage_1.IStorageService)
    ], WorkspaceTrustRequiredPlaceholderEditor);
    let ErrorPlaceholderEditor = class ErrorPlaceholderEditor extends EditorPlaceholder {
        static { ErrorPlaceholderEditor_1 = this; }
        static { this.ID = 'workbench.editors.errorEditor'; }
        static { this.LABEL = (0, nls_1.localize)('errorEditor', "Error Editor"); }
        static { this.DESCRIPTOR = editor_3.EditorPaneDescriptor.create(ErrorPlaceholderEditor_1, ErrorPlaceholderEditor_1.ID, ErrorPlaceholderEditor_1.LABEL); }
        constructor(group, telemetryService, themeService, storageService, fileService, dialogService) {
            super(ErrorPlaceholderEditor_1.ID, group, telemetryService, themeService, storageService);
            this.fileService = fileService;
            this.dialogService = dialogService;
        }
        async getContents(input, options, disposables) {
            const resource = input.resource;
            const error = options.error;
            const isFileNotFound = error?.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */;
            // Error Label
            let label;
            if (isFileNotFound) {
                label = (0, nls_1.localize)('unavailableResourceErrorEditorText', "The editor could not be opened because the file was not found.");
            }
            else if ((0, editor_1.isEditorOpenError)(error) && error.forceMessage) {
                label = error.message;
            }
            else if (error) {
                label = (0, nls_1.localize)('unknownErrorEditorTextWithError', "The editor could not be opened due to an unexpected error: {0}", (0, strings_1.truncateMiddle)((0, errorMessage_1.toErrorMessage)(error), EditorPlaceholder.PLACEHOLDER_LABEL_MAX_LENGTH / 2));
            }
            else {
                label = (0, nls_1.localize)('unknownErrorEditorTextWithoutError', "The editor could not be opened due to an unexpected error.");
            }
            // Error Icon
            let icon = '$(error)';
            if ((0, editor_1.isEditorOpenError)(error)) {
                if (error.forceSeverity === severity_1.default.Info) {
                    icon = '$(info)';
                }
                else if (error.forceSeverity === severity_1.default.Warning) {
                    icon = '$(warning)';
                }
            }
            // Actions
            let actions = undefined;
            if ((0, editor_1.isEditorOpenError)(error) && error.actions.length > 0) {
                actions = error.actions.map(action => {
                    return {
                        label: action.label,
                        run: () => {
                            const result = action.run();
                            if (result instanceof Promise) {
                                result.catch(error => this.dialogService.error((0, errorMessage_1.toErrorMessage)(error)));
                            }
                        }
                    };
                });
            }
            else {
                actions = [
                    {
                        label: (0, nls_1.localize)('retry', "Try Again"),
                        run: () => this.group.openEditor(input, { ...options, source: editor_2.EditorOpenSource.USER /* explicit user gesture */ })
                    }
                ];
            }
            // Auto-reload when file is added
            if (isFileNotFound && resource && this.fileService.hasProvider(resource)) {
                disposables.add(this.fileService.onDidFilesChange(e => {
                    if (e.contains(resource, 1 /* FileChangeType.ADDED */, 0 /* FileChangeType.UPDATED */)) {
                        this.group.openEditor(input, options);
                    }
                }));
            }
            return { icon, label, actions: actions ?? [] };
        }
    };
    exports.ErrorPlaceholderEditor = ErrorPlaceholderEditor;
    exports.ErrorPlaceholderEditor = ErrorPlaceholderEditor = ErrorPlaceholderEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, files_1.IFileService),
        __param(5, dialogs_1.IDialogService)
    ], ErrorPlaceholderEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGxhY2Vob2xkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yUGxhY2Vob2xkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTZDekYsSUFBZSxpQkFBaUIsR0FBaEMsTUFBZSxpQkFBa0IsU0FBUSx1QkFBVTs7aUJBRS9CLGlDQUE0QixHQUFHLElBQUksQUFBUCxDQUFRO1FBTTlELFlBQ0MsRUFBVSxFQUNWLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3pCLGNBQStCO1lBRWhELEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQVRqRCxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7UUFVM0UsQ0FBQztRQUVTLFlBQVksQ0FBQyxNQUFtQjtZQUV6QyxZQUFZO1lBQ1osSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLGdDQUFnQyxDQUFDO1lBQzVELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsNERBQTREO1lBRXpGLG9CQUFvQjtZQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3Q0FBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsVUFBVSxrQ0FBMEIs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