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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages/textToHtmlTokenizer", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/view/renderers/webviewPreloads", "vs/workbench/contrib/notebook/browser/view/renderers/webviewThemeMapping", "vs/workbench/contrib/notebook/browser/viewModel/markupCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookLoggingService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewWindowDragMonitor", "vs/workbench/contrib/webview/common/webview", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService"], function (require, exports, dom_1, arrays_1, async_1, buffer_1, event_1, mime_1, network_1, objects_1, osPath, platform_1, resources_1, uri_1, UUID, languages_1, language_1, tokenization_1, textToHtmlTokenizer_1, nls, actions_1, configuration_1, contextkey_1, contextView_1, dialogs_1, files_1, opener_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, workspace_1, workspaceTrust_1, notebookBrowser_1, notebookCellList_1, webviewPreloads_1, webviewThemeMapping_1, markupCellViewModel_1, notebookCommon_1, notebookLoggingService_1, notebookService_1, webview_1, webviewWindowDragMonitor_1, webview_2, editorGroupsService_1, environmentService_1, pathService_1) {
    "use strict";
    var BackLayerWebView_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackLayerWebView = void 0;
    const LINE_COLUMN_REGEX = /:([\d]+)(?::([\d]+))?$/;
    const LineQueryRegex = /line=(\d+)$/;
    const FRAGMENT_REGEX = /^(.*)#([^#]*)$/;
    let BackLayerWebView = class BackLayerWebView extends themeService_1.Themable {
        static { BackLayerWebView_1 = this; }
        static getOriginStore(storageService) {
            this._originStore ??= new webview_1.WebviewOriginStore('notebook.backlayerWebview.origins', storageService);
            return this._originStore;
        }
        constructor(notebookEditor, id, notebookViewType, documentUri, options, rendererMessaging, webviewService, openerService, notebookService, contextService, environmentService, fileDialogService, fileService, contextMenuService, contextKeyService, workspaceTrustManagementService, configurationService, languageService, workspaceContextService, editorGroupService, storageService, pathService, notebookLogService, themeService, telemetryService) {
            super(themeService);
            this.notebookEditor = notebookEditor;
            this.id = id;
            this.notebookViewType = notebookViewType;
            this.documentUri = documentUri;
            this.options = options;
            this.rendererMessaging = rendererMessaging;
            this.webviewService = webviewService;
            this.openerService = openerService;
            this.notebookService = notebookService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.fileDialogService = fileDialogService;
            this.fileService = fileService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.configurationService = configurationService;
            this.languageService = languageService;
            this.workspaceContextService = workspaceContextService;
            this.editorGroupService = editorGroupService;
            this.storageService = storageService;
            this.pathService = pathService;
            this.notebookLogService = notebookLogService;
            this.telemetryService = telemetryService;
            this.webview = undefined;
            this.insetMapping = new Map();
            this.pendingWebviewIdleCreationRequest = new Map();
            this.pendingWebviewIdleInsetMapping = new Map();
            this.reversedPendingWebviewIdleInsetMapping = new Map();
            this.markupPreviewMapping = new Map();
            this.hiddenInsetMapping = new Set();
            this.reversedInsetMapping = new Map();
            this.localResourceRootsCache = undefined;
            this._onMessage = this._register(new event_1.Emitter());
            this._preloadsCache = new Set();
            this.onMessage = this._onMessage.event;
            this._disposed = false;
            this.firstInit = true;
            this.nonce = UUID.generateUuid();
            this._logRendererDebugMessage('Creating backlayer webview for notebook');
            this.element = document.createElement('div');
            this.element.style.height = '1400px';
            this.element.style.position = 'absolute';
            if (rendererMessaging) {
                this._register(rendererMessaging);
                rendererMessaging.receiveMessageHandler = (rendererId, message) => {
                    if (!this.webview || this._disposed) {
                        return Promise.resolve(false);
                    }
                    this._sendMessageToWebview({
                        __vscode_notebook_message: true,
                        type: 'customRendererMessage',
                        rendererId: rendererId,
                        message: message
                    });
                    return Promise.resolve(true);
                };
            }
            this._register(workspaceTrustManagementService.onDidChangeTrust(e => {
                const baseUrl = this.asWebviewUri(this.getNotebookBaseUri(), undefined);
                const htmlContent = this.generateContent(baseUrl.toString());
                this.webview?.setHtml(htmlContent);
            }));
            this._register(languages_1.TokenizationRegistry.onDidChange(() => {
                this._sendMessageToWebview({
                    type: 'tokenizedStylesChanged',
                    css: getTokenizationCss(),
                });
            }));
        }
        updateOptions(options) {
            this.options = options;
            this._updateStyles();
            this._updateOptions();
        }
        _logRendererDebugMessage(msg) {
            this.notebookLogService.debug('BacklayerWebview', `${this.documentUri} (${this.id}) - ${msg}`);
        }
        _updateStyles() {
            this._sendMessageToWebview({
                type: 'notebookStyles',
                styles: this._generateStyles()
            });
        }
        _updateOptions() {
            this._sendMessageToWebview({
                type: 'notebookOptions',
                options: {
                    dragAndDropEnabled: this.options.dragAndDropEnabled
                },
                renderOptions: {
                    lineLimit: this.options.outputLineLimit,
                    outputScrolling: this.options.outputScrolling,
                    outputWordWrap: this.options.outputWordWrap,
                    linkifyFilePaths: this.options.outputLinkifyFilePaths,
                    minimalError: this.options.minimalError
                }
            });
        }
        _generateStyles() {
            return {
                'notebook-output-left-margin': `${this.options.leftMargin + this.options.runGutter}px`,
                'notebook-output-width': `calc(100% - ${this.options.leftMargin + this.options.rightMargin + this.options.runGutter}px)`,
                'notebook-output-node-padding': `${this.options.outputNodePadding}px`,
                'notebook-run-gutter': `${this.options.runGutter}px`,
                'notebook-preview-node-padding': `${this.options.previewNodePadding}px`,
                'notebook-markdown-left-margin': `${this.options.markdownLeftMargin}px`,
                'notebook-output-node-left-padding': `${this.options.outputNodeLeftPadding}px`,
                'notebook-markdown-min-height': `${this.options.previewNodePadding * 2}px`,
                'notebook-markup-font-size': typeof this.options.markupFontSize === 'number' && this.options.markupFontSize > 0 ? `${this.options.markupFontSize}px` : `calc(${this.options.fontSize}px * 1.2)`,
                'notebook-cell-output-font-size': `${this.options.outputFontSize || this.options.fontSize}px`,
                'notebook-cell-output-line-height': `${this.options.outputLineHeight}px`,
                'notebook-cell-output-max-height': `${this.options.outputLineHeight * this.options.outputLineLimit}px`,
                'notebook-cell-output-font-family': this.options.outputFontFamily || this.options.fontFamily,
                'notebook-cell-markup-empty-content': nls.localize('notebook.emptyMarkdownPlaceholder', "Empty markdown cell, double-click or press enter to edit."),
                'notebook-cell-renderer-not-found-error': nls.localize({
                    key: 'notebook.error.rendererNotFound',
                    comment: ['$0 is a placeholder for the mime type']
                }, "No renderer found for '$0'"),
                'notebook-cell-renderer-fallbacks-exhausted': nls.localize({
                    key: 'notebook.error.rendererFallbacksExhausted',
                    comment: ['$0 is a placeholder for the mime type']
                }, "Could not render content for '$0'"),
            };
        }
        generateContent(baseUrl) {
            const renderersData = this.getRendererData();
            const preloadsData = this.getStaticPreloadsData();
            const renderOptions = {
                lineLimit: this.options.outputLineLimit,
                outputScrolling: this.options.outputScrolling,
                outputWordWrap: this.options.outputWordWrap,
                linkifyFilePaths: this.options.outputLinkifyFilePaths,
                minimalError: this.options.minimalError
            };
            const preloadScript = (0, webviewPreloads_1.preloadsScriptStr)({
                ...this.options,
                tokenizationCss: getTokenizationCss(),
            }, { dragAndDropEnabled: this.options.dragAndDropEnabled }, renderOptions, renderersData, preloadsData, this.workspaceTrustManagementService.isWorkspaceTrusted(), this.nonce);
            const enableCsp = this.configurationService.getValue('notebook.experimental.enableCsp');
            const currentHighlight = this.getColor(colorRegistry_1.editorFindMatch);
            const findMatchHighlight = this.getColor(colorRegistry_1.editorFindMatchHighlight);
            return /* html */ `
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<base href="${baseUrl}/" />
				${enableCsp ?
                `<meta http-equiv="Content-Security-Policy" content="
					default-src 'none';
					script-src ${webview_2.webviewGenericCspSource} 'unsafe-inline' 'unsafe-eval';
					style-src ${webview_2.webviewGenericCspSource} 'unsafe-inline';
					img-src ${webview_2.webviewGenericCspSource} https: http: data:;
					font-src ${webview_2.webviewGenericCspSource} https:;
					connect-src https:;
					child-src https: data:;
				">` : ''}
				<style nonce="${this.nonce}">
					::highlight(find-highlight) {
						background-color: var(--vscode-editor-findMatchBackground, ${findMatchHighlight});
					}

					::highlight(current-find-highlight) {
						background-color: var(--vscode-editor-findMatchHighlightBackground, ${currentHighlight});
					}

					#container .cell_container {
						width: 100%;
					}

					#container .output_container {
						width: 100%;
					}

					#container > div > div > div.output {
						font-size: var(--notebook-cell-output-font-size);
						width: var(--notebook-output-width);
						margin-left: var(--notebook-output-left-margin);
						background-color: var(--theme-notebook-output-background);
						padding-top: var(--notebook-output-node-padding);
						padding-right: var(--notebook-output-node-padding);
						padding-bottom: var(--notebook-output-node-padding);
						padding-left: var(--notebook-output-node-left-padding);
						box-sizing: border-box;
						border-top: none;
					}

					/* markdown */
					#container div.preview {
						width: 100%;
						padding-right: var(--notebook-preview-node-padding);
						padding-left: var(--notebook-markdown-left-margin);
						padding-top: var(--notebook-preview-node-padding);
						padding-bottom: var(--notebook-preview-node-padding);

						box-sizing: border-box;
						white-space: nowrap;
						overflow: hidden;
						white-space: initial;

						font-size: var(--notebook-markup-font-size);
						color: var(--theme-ui-foreground);
					}

					#container div.preview.draggable {
						user-select: none;
						-webkit-user-select: none;
						-ms-user-select: none;
						cursor: grab;
					}

					#container div.preview.selected {
						background: var(--theme-notebook-cell-selected-background);
					}

					#container div.preview.dragging {
						background-color: var(--theme-background);
						opacity: 0.5 !important;
					}

					.monaco-workbench.vs-dark .notebookOverlay .cell.markdown .latex img,
					.monaco-workbench.vs-dark .notebookOverlay .cell.markdown .latex-block img {
						filter: brightness(0) invert(1)
					}

					#container .markup > div.nb-symbolHighlight {
						background-color: var(--theme-notebook-symbol-highlight-background);
					}

					#container .nb-symbolHighlight .output_container .output {
						background-color: var(--theme-notebook-symbol-highlight-background);
					}

					#container .nb-chatGenerationHighlight .output_container .output {
						background-color: var(--vscode-notebook-selectedCellBackground);
					}

					#container > div.nb-cellDeleted .output_container {
						background-color: var(--theme-notebook-diff-removed-background);
					}

					#container > div.nb-cellAdded .output_container {
						background-color: var(--theme-notebook-diff-inserted-background);
					}

					#container > div > div:not(.preview) > div {
						overflow-x: auto;
					}

					#container .no-renderer-error {
						color: var(--vscode-editorError-foreground);
					}

					body {
						padding: 0px;
						height: 100%;
						width: 100%;
					}

					table, thead, tr, th, td, tbody {
						border: none !important;
						border-color: transparent;
						border-spacing: 0;
						border-collapse: collapse;
					}

					table, th, tr {
						vertical-align: middle;
						text-align: right;
					}

					thead {
						font-weight: bold;
						background-color: rgba(130, 130, 130, 0.16);
					}

					th, td {
						padding: 4px 8px;
					}

					tr:nth-child(even) {
						background-color: rgba(130, 130, 130, 0.08);
					}

					tbody th {
						font-weight: normal;
					}

					.find-match {
						background-color: var(--vscode-editor-findMatchHighlightBackground);
					}

					.current-find-match {
						background-color: var(--vscode-editor-findMatchBackground);
					}

					#_defaultColorPalatte {
						color: var(--vscode-editor-findMatchHighlightBackground);
						background-color: var(--vscode-editor-findMatchBackground);
					}
				</style>
			</head>
			<body style="overflow: hidden;">
				<div id='findStart' tabIndex=-1></div>
				<div id='container' class="widgetarea" style="position: absolute;width:100%;top: 0px"></div>
				<div id="_defaultColorPalatte"></div>
				<script type="module">${preloadScript}</script>
			</body>
		</html>`;
        }
        getRendererData() {
            return this.notebookService.getRenderers().map((renderer) => {
                const entrypoint = {
                    extends: renderer.entrypoint.extends,
                    path: this.asWebviewUri(renderer.entrypoint.path, renderer.extensionLocation).toString()
                };
                return {
                    id: renderer.id,
                    entrypoint,
                    mimeTypes: renderer.mimeTypes,
                    messaging: renderer.messaging !== "never" /* RendererMessagingSpec.Never */,
                    isBuiltin: renderer.isBuiltin
                };
            });
        }
        getStaticPreloadsData() {
            return Array.from(this.notebookService.getStaticPreloads(this.notebookViewType), preload => {
                return { entrypoint: this.asWebviewUri(preload.entrypoint, preload.extensionLocation).toString().toString() };
            });
        }
        asWebviewUri(uri, fromExtension) {
            return (0, webview_2.asWebviewUri)(uri, fromExtension?.scheme === network_1.Schemas.vscodeRemote ? { isRemote: true, authority: fromExtension.authority } : undefined);
        }
        postKernelMessage(message) {
            this._sendMessageToWebview({
                __vscode_notebook_message: true,
                type: 'customKernelMessage',
                message,
            });
        }
        resolveOutputId(id) {
            const output = this.reversedInsetMapping.get(id);
            if (!output) {
                return;
            }
            const cellInfo = this.insetMapping.get(output).cellInfo;
            return { cellInfo, output };
        }
        isResolved() {
            return !!this.webview;
        }
        createWebview(targetWindow) {
            const baseUrl = this.asWebviewUri(this.getNotebookBaseUri(), undefined);
            const htmlContent = this.generateContent(baseUrl.toString());
            return this._initialize(htmlContent, targetWindow);
        }
        getNotebookBaseUri() {
            if (this.documentUri.scheme === network_1.Schemas.untitled) {
                const folder = this.workspaceContextService.getWorkspaceFolder(this.documentUri);
                if (folder) {
                    return folder.uri;
                }
                const folders = this.workspaceContextService.getWorkspace().folders;
                if (folders.length) {
                    return folders[0].uri;
                }
            }
            return (0, resources_1.dirname)(this.documentUri);
        }
        getBuiltinLocalResourceRoots() {
            // Python notebooks assume that requirejs is a global.
            // For all other notebooks, they need to provide their own loader.
            if (!this.documentUri.path.toLowerCase().endsWith('.ipynb')) {
                return [];
            }
            if (platform_1.isWeb) {
                return []; // script is inlined
            }
            return [
                (0, resources_1.dirname)(network_1.FileAccess.asFileUri('vs/loader.js')),
            ];
        }
        _initialize(content, targetWindow) {
            if (!(0, dom_1.getWindow)(this.element).document.body.contains(this.element)) {
                throw new Error('Element is already detached from the DOM tree');
            }
            this.webview = this._createInset(this.webviewService, content);
            this.webview.mountTo(this.element, targetWindow);
            this._register(this.webview);
            this._register(new webviewWindowDragMonitor_1.WebviewWindowDragMonitor(targetWindow, () => this.webview));
            const initializePromise = new async_1.DeferredPromise();
            this._register(this.webview.onFatalError(e => {
                initializePromise.error(new Error(`Could not initialize webview: ${e.message}}`));
            }));
            this._register(this.webview.onMessage(async (message) => {
                const data = message.message;
                if (this._disposed) {
                    return;
                }
                if (!data.__vscode_notebook_message) {
                    return;
                }
                switch (data.type) {
                    case 'initialized': {
                        initializePromise.complete();
                        this.initializeWebViewState();
                        break;
                    }
                    case 'initializedMarkup': {
                        if (this.initializeMarkupPromise?.requestId === data.requestId) {
                            this.initializeMarkupPromise?.p.complete();
                            this.initializeMarkupPromise = undefined;
                        }
                        break;
                    }
                    case 'dimension': {
                        for (const update of data.updates) {
                            const height = update.height;
                            if (update.isOutput) {
                                const resolvedResult = this.resolveOutputId(update.id);
                                if (resolvedResult) {
                                    const { cellInfo, output } = resolvedResult;
                                    this.notebookEditor.updateOutputHeight(cellInfo, output, height, !!update.init, 'webview#dimension');
                                    this.notebookEditor.scheduleOutputHeightAck(cellInfo, update.id, height);
                                }
                                else if (update.init) {
                                    // might be idle render request's ack
                                    const outputRequest = this.reversedPendingWebviewIdleInsetMapping.get(update.id);
                                    if (outputRequest) {
                                        const inset = this.pendingWebviewIdleInsetMapping.get(outputRequest);
                                        // clear the pending mapping
                                        this.pendingWebviewIdleCreationRequest.delete(outputRequest);
                                        this.pendingWebviewIdleCreationRequest.delete(outputRequest);
                                        const cellInfo = inset.cellInfo;
                                        this.reversedInsetMapping.set(update.id, outputRequest);
                                        this.insetMapping.set(outputRequest, inset);
                                        this.notebookEditor.updateOutputHeight(cellInfo, outputRequest, height, !!update.init, 'webview#dimension');
                                        this.notebookEditor.scheduleOutputHeightAck(cellInfo, update.id, height);
                                    }
                                    this.reversedPendingWebviewIdleInsetMapping.delete(update.id);
                                }
                                {
                                    if (!update.init) {
                                        continue;
                                    }
                                    const output = this.reversedInsetMapping.get(update.id);
                                    if (!output) {
                                        continue;
                                    }
                                    const inset = this.insetMapping.get(output);
                                    inset.initialized = true;
                                }
                            }
                            else {
                                this.notebookEditor.updateMarkupCellHeight(update.id, height, !!update.init);
                            }
                        }
                        break;
                    }
                    case 'mouseenter': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsHovered = true;
                            }
                        }
                        break;
                    }
                    case 'mouseleave': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsHovered = false;
                            }
                        }
                        break;
                    }
                    case 'outputFocus': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsFocused = true;
                                this.notebookEditor.focusNotebookCell(latestCell, 'output', { outputId: resolvedResult.output.model.outputId, skipReveal: true, outputWebviewFocused: true });
                            }
                        }
                        break;
                    }
                    case 'outputBlur': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsFocused = false;
                                latestCell.inputInOutputIsFocused = false;
                            }
                        }
                        break;
                    }
                    case 'scroll-ack': {
                        // const date = new Date();
                        // const top = data.data.top;
                        // console.log('ack top ', top, ' version: ', data.version, ' - ', date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds());
                        break;
                    }
                    case 'scroll-to-reveal': {
                        this.notebookEditor.setScrollTop(data.scrollTop - notebookCellList_1.NOTEBOOK_WEBVIEW_BOUNDARY);
                        break;
                    }
                    case 'did-scroll-wheel': {
                        this.notebookEditor.triggerScroll({
                            ...data.payload,
                            preventDefault: () => { },
                            stopPropagation: () => { }
                        });
                        break;
                    }
                    case 'focus-editor': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            if (data.focusNext) {
                                this.notebookEditor.focusNextNotebookCell(cell, 'editor');
                            }
                            else {
                                await this.notebookEditor.focusNotebookCell(cell, 'editor');
                            }
                        }
                        break;
                    }
                    case 'clicked-data-url': {
                        this._onDidClickDataLink(data);
                        break;
                    }
                    case 'clicked-link': {
                        if ((0, network_1.matchesScheme)(data.href, network_1.Schemas.command)) {
                            const uri = uri_1.URI.parse(data.href);
                            if (uri.path === 'workbench.action.openLargeOutput') {
                                const outputId = uri.query;
                                const group = this.editorGroupService.activeGroup;
                                if (group) {
                                    if (group.activeEditor) {
                                        group.pinEditor(group.activeEditor);
                                    }
                                }
                                this.openerService.open(notebookCommon_1.CellUri.generateCellOutputUri(this.documentUri, outputId));
                                return;
                            }
                            if (uri.path === 'cellOutput.enableScrolling') {
                                const outputId = uri.query;
                                const cell = this.reversedInsetMapping.get(outputId);
                                if (cell) {
                                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: 'notebook.cell.toggleOutputScrolling', from: 'inlineLink' });
                                    cell.cellViewModel.outputsViewModels.forEach((vm) => {
                                        if (vm.model.metadata) {
                                            vm.model.metadata['scrollable'] = true;
                                            vm.resetRenderer();
                                        }
                                    });
                                }
                                return;
                            }
                            // We allow a very limited set of commands
                            this.openerService.open(data.href, {
                                fromUserGesture: true,
                                fromWorkspace: true,
                                allowCommands: [
                                    'github-issues.authNow',
                                    'workbench.extensions.search',
                                    'workbench.action.openSettings',
                                    '_notebook.selectKernel',
                                    // TODO@rebornix explore open output channel with name command
                                    'jupyter.viewOutput'
                                ],
                            });
                            return;
                        }
                        if ((0, network_1.matchesSomeScheme)(data.href, network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.mailto)) {
                            this.openerService.open(data.href, { fromUserGesture: true, fromWorkspace: true });
                        }
                        else if ((0, network_1.matchesScheme)(data.href, network_1.Schemas.vscodeNotebookCell)) {
                            const uri = uri_1.URI.parse(data.href);
                            await this._handleNotebookCellResource(uri);
                        }
                        else if (!/^[\w\-]+:/.test(data.href)) {
                            // Uri without scheme, such as a file path
                            await this._handleResourceOpening(tryDecodeURIComponent(data.href));
                        }
                        else {
                            // uri with scheme
                            if (osPath.isAbsolute(data.href)) {
                                this._openUri(uri_1.URI.file(data.href));
                            }
                            else {
                                this._openUri(uri_1.URI.parse(data.href));
                            }
                        }
                        break;
                    }
                    case 'customKernelMessage': {
                        this._onMessage.fire({ message: data.message });
                        break;
                    }
                    case 'customRendererMessage': {
                        this.rendererMessaging?.postMessage(data.rendererId, data.message);
                        break;
                    }
                    case 'clickMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            if (data.shiftKey || (platform_1.isMacintosh ? data.metaKey : data.ctrlKey)) {
                                // Modify selection
                                this.notebookEditor.toggleNotebookCellSelection(cell, /* fromPrevious */ data.shiftKey);
                            }
                            else {
                                // Normal click
                                await this.notebookEditor.focusNotebookCell(cell, 'container', { skipReveal: true });
                            }
                        }
                        break;
                    }
                    case 'contextMenuMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            // Focus the cell first
                            await this.notebookEditor.focusNotebookCell(cell, 'container', { skipReveal: true });
                            // Then show the context menu
                            const webviewRect = this.element.getBoundingClientRect();
                            this.contextMenuService.showContextMenu({
                                menuId: actions_1.MenuId.NotebookCellTitle,
                                contextKeyService: this.contextKeyService,
                                getAnchor: () => ({
                                    x: webviewRect.x + data.clientX,
                                    y: webviewRect.y + data.clientY
                                })
                            });
                        }
                        break;
                    }
                    case 'toggleMarkupPreview': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell && !this.notebookEditor.creationOptions.isReadOnly) {
                            this.notebookEditor.setMarkupCellEditState(data.cellId, notebookBrowser_1.CellEditState.Editing);
                            await this.notebookEditor.focusNotebookCell(cell, 'editor', { skipReveal: true });
                        }
                        break;
                    }
                    case 'mouseEnterMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.cellIsHovered = true;
                        }
                        break;
                    }
                    case 'mouseLeaveMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.cellIsHovered = false;
                        }
                        break;
                    }
                    case 'cell-drag-start': {
                        this.notebookEditor.didStartDragMarkupCell(data.cellId, data);
                        break;
                    }
                    case 'cell-drag': {
                        this.notebookEditor.didDragMarkupCell(data.cellId, data);
                        break;
                    }
                    case 'cell-drop': {
                        this.notebookEditor.didDropMarkupCell(data.cellId, {
                            dragOffsetY: data.dragOffsetY,
                            ctrlKey: data.ctrlKey,
                            altKey: data.altKey,
                        });
                        break;
                    }
                    case 'cell-drag-end': {
                        this.notebookEditor.didEndDragMarkupCell(data.cellId);
                        break;
                    }
                    case 'renderedMarkup': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.renderedHtml = data.html;
                        }
                        this._handleHighlightCodeBlock(data.codeBlocks);
                        break;
                    }
                    case 'renderedCellOutput': {
                        this._handleHighlightCodeBlock(data.codeBlocks);
                        break;
                    }
                    case 'outputResized': {
                        this.notebookEditor.didResizeOutput(data.cellId);
                        break;
                    }
                    case 'getOutputItem': {
                        const resolvedResult = this.resolveOutputId(data.outputId);
                        const output = resolvedResult?.output.model.outputs.find(output => output.mime === data.mime);
                        this._sendMessageToWebview({
                            type: 'returnOutputItem',
                            requestId: data.requestId,
                            output: output ? { mime: output.mime, valueBytes: output.data.buffer } : undefined,
                        });
                        break;
                    }
                    case 'logRendererDebugMessage': {
                        this._logRendererDebugMessage(`${data.message}${data.data ? ' ' + JSON.stringify(data.data, null, 4) : ''}`);
                        break;
                    }
                    case 'notebookPerformanceMessage': {
                        this.notebookEditor.updatePerformanceMetadata(data.cellId, data.executionId, data.duration, data.rendererId);
                        if (data.mimeType && data.outputSize && data.rendererId === 'vscode.builtin-renderer') {
                            this._sendPerformanceData(data.mimeType, data.outputSize, data.duration);
                        }
                        break;
                    }
                    case 'outputInputFocus': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.inputInOutputIsFocused = data.inputFocused;
                            }
                        }
                        this.notebookEditor.didFocusOutputInputChange(data.inputFocused);
                    }
                }
            }));
            return initializePromise.p;
        }
        _sendPerformanceData(mimeType, outputSize, renderTime) {
            const telemetryData = {
                mimeType,
                outputSize,
                renderTime
            };
            this.telemetryService.publicLog2('NotebookCellOutputRender', telemetryData);
        }
        _handleNotebookCellResource(uri) {
            const notebookResource = uri.path.length > 0 ? uri : this.documentUri;
            const lineMatch = /(?:^|&)line=([^&]+)/.exec(uri.query);
            let editorOptions = undefined;
            if (lineMatch) {
                const parsedLineNumber = parseInt(lineMatch[1], 10);
                if (!isNaN(parsedLineNumber)) {
                    const lineNumber = parsedLineNumber;
                    editorOptions = {
                        selection: { startLineNumber: lineNumber, startColumn: 1 }
                    };
                }
            }
            const executionMatch = /(?:^|&)execution_count=([^&]+)/.exec(uri.query);
            if (executionMatch) {
                const executionCount = parseInt(executionMatch[1], 10);
                if (!isNaN(executionCount)) {
                    const notebookModel = this.notebookService.getNotebookTextModel(notebookResource);
                    // multiple cells with the same execution count can exist if the kernel is restarted
                    // so look for the most recently added cell with the matching execution count.
                    // Somewhat more likely to be correct in notebooks, an much more likely for the interactive window
                    const cell = notebookModel?.cells.slice().reverse().find(cell => {
                        return cell.internalMetadata.executionOrder === executionCount;
                    });
                    if (cell?.uri) {
                        return this.openerService.open(cell.uri, {
                            fromUserGesture: true,
                            fromWorkspace: true,
                            editorOptions: editorOptions
                        });
                    }
                }
            }
            // URLs built by the jupyter extension put the line query param in the fragment
            // They also have the cell fragment pre-calculated
            const fragmentLineMatch = /\?line=(\d+)$/.exec(uri.fragment);
            if (fragmentLineMatch) {
                const parsedLineNumber = parseInt(fragmentLineMatch[1], 10);
                if (!isNaN(parsedLineNumber)) {
                    const lineNumber = parsedLineNumber + 1;
                    const fragment = uri.fragment.substring(0, fragmentLineMatch.index);
                    // open the uri with selection
                    const editorOptions = {
                        selection: { startLineNumber: lineNumber, startColumn: 1, endLineNumber: lineNumber, endColumn: 1 }
                    };
                    return this.openerService.open(notebookResource.with({ fragment }), {
                        fromUserGesture: true,
                        fromWorkspace: true,
                        editorOptions: editorOptions
                    });
                }
            }
            return this.openerService.open(notebookResource, { fromUserGesture: true, fromWorkspace: true });
        }
        async _handleResourceOpening(href) {
            let linkToOpen = undefined;
            let fragment = undefined;
            // Separate out the fragment so that the subsequent calls
            // to URI.joinPath() don't URL encode it. This allows opening
            // links with both paths and fragments.
            const hrefWithFragment = FRAGMENT_REGEX.exec(href);
            if (hrefWithFragment) {
                href = hrefWithFragment[1];
                fragment = hrefWithFragment[2];
            }
            if (href.startsWith('/')) {
                linkToOpen = await this.pathService.fileURI(href);
                const folders = this.workspaceContextService.getWorkspace().folders;
                if (folders.length) {
                    linkToOpen = linkToOpen.with({
                        scheme: folders[0].uri.scheme,
                        authority: folders[0].uri.authority
                    });
                }
            }
            else if (href.startsWith('~')) {
                const userHome = await this.pathService.userHome();
                if (userHome) {
                    linkToOpen = uri_1.URI.joinPath(userHome, href.substring(2));
                }
            }
            else {
                if (this.documentUri.scheme === network_1.Schemas.untitled) {
                    const folders = this.workspaceContextService.getWorkspace().folders;
                    if (!folders.length) {
                        return;
                    }
                    linkToOpen = uri_1.URI.joinPath(folders[0].uri, href);
                }
                else {
                    // Resolve relative to notebook document
                    linkToOpen = uri_1.URI.joinPath((0, resources_1.dirname)(this.documentUri), href);
                }
            }
            if (linkToOpen) {
                // Re-attach fragment now that we have the full file path.
                if (fragment) {
                    linkToOpen = linkToOpen.with({ fragment });
                }
                this._openUri(linkToOpen);
            }
        }
        _openUri(uri) {
            let lineNumber = undefined;
            let column = undefined;
            const lineCol = LINE_COLUMN_REGEX.exec(uri.path);
            if (lineCol) {
                uri = uri.with({
                    path: uri.path.slice(0, lineCol.index),
                    fragment: `L${lineCol[0].slice(1)}`
                });
                lineNumber = parseInt(lineCol[1], 10);
                column = parseInt(lineCol[2], 10);
            }
            //#region error renderer migration, remove once done
            const lineMatch = LineQueryRegex.exec(uri.query);
            if (lineMatch) {
                const parsedLineNumber = parseInt(lineMatch[1], 10);
                if (!isNaN(parsedLineNumber)) {
                    lineNumber = parsedLineNumber + 1;
                    column = 1;
                    uri = uri.with({ fragment: `L${lineNumber}` });
                }
            }
            uri = uri.with({
                query: null
            });
            //#endregion
            let match = undefined;
            for (const group of this.editorGroupService.groups) {
                const editorInput = group.editors.find(editor => editor.resource && (0, resources_1.isEqual)(editor.resource, uri, true));
                if (editorInput) {
                    match = { group, editor: editorInput };
                    break;
                }
            }
            if (match) {
                match.group.openEditor(match.editor, lineNumber !== undefined && column !== undefined ? { selection: { startLineNumber: lineNumber, startColumn: column } } : undefined);
            }
            else {
                this.openerService.open(uri, { fromUserGesture: true, fromWorkspace: true });
            }
        }
        _handleHighlightCodeBlock(codeBlocks) {
            for (const { id, value, lang } of codeBlocks) {
                // The language id may be a language aliases (e.g.js instead of javascript)
                const languageId = this.languageService.getLanguageIdByLanguageName(lang);
                if (!languageId) {
                    continue;
                }
                (0, textToHtmlTokenizer_1.tokenizeToString)(this.languageService, value, languageId).then((html) => {
                    if (this._disposed) {
                        return;
                    }
                    this._sendMessageToWebview({
                        type: 'tokenizedCodeBlock',
                        html,
                        codeBlockId: id
                    });
                });
            }
        }
        async _onDidClickDataLink(event) {
            if (typeof event.data !== 'string') {
                return;
            }
            const [splitStart, splitData] = event.data.split(';base64,');
            if (!splitData || !splitStart) {
                return;
            }
            const defaultDir = (0, resources_1.extname)(this.documentUri) === '.interactive' ?
                this.workspaceContextService.getWorkspace().folders[0]?.uri ?? await this.fileDialogService.defaultFilePath() :
                (0, resources_1.dirname)(this.documentUri);
            let defaultName;
            if (event.downloadName) {
                defaultName = event.downloadName;
            }
            else {
                const mimeType = splitStart.replace(/^data:/, '');
                const candidateExtension = mimeType && (0, mime_1.getExtensionForMimeType)(mimeType);
                defaultName = candidateExtension ? `download${candidateExtension}` : 'download';
            }
            const defaultUri = (0, resources_1.joinPath)(defaultDir, defaultName);
            const newFileUri = await this.fileDialogService.showSaveDialog({
                defaultUri
            });
            if (!newFileUri) {
                return;
            }
            const buff = (0, buffer_1.decodeBase64)(splitData);
            await this.fileService.writeFile(newFileUri, buff);
            await this.openerService.open(newFileUri);
        }
        _createInset(webviewService, content) {
            this.localResourceRootsCache = this._getResourceRootsCache();
            const webview = webviewService.createWebviewElement({
                origin: BackLayerWebView_1.getOriginStore(this.storageService).getOrigin(this.notebookViewType, undefined),
                title: nls.localize('webview title', "Notebook webview content"),
                options: {
                    purpose: "notebookRenderer" /* WebviewContentPurpose.NotebookRenderer */,
                    enableFindWidget: false,
                    transformCssVariables: webviewThemeMapping_1.transformWebviewThemeVars,
                },
                contentOptions: {
                    allowMultipleAPIAcquire: true,
                    allowScripts: true,
                    localResourceRoots: this.localResourceRootsCache,
                },
                extension: undefined,
                providedViewType: 'notebook.output'
            });
            webview.setHtml(content);
            webview.setContextKeyService(this.contextKeyService);
            return webview;
        }
        _getResourceRootsCache() {
            const workspaceFolders = this.contextService.getWorkspace().folders.map(x => x.uri);
            const notebookDir = this.getNotebookBaseUri();
            return [
                this.notebookService.getNotebookProviderResourceRoots(),
                this.notebookService.getRenderers().map(x => (0, resources_1.dirname)(x.entrypoint.path)),
                ...Array.from(this.notebookService.getStaticPreloads(this.notebookViewType), x => [
                    (0, resources_1.dirname)(x.entrypoint),
                    ...x.localResourceRoots,
                ]),
                workspaceFolders,
                notebookDir,
                this.getBuiltinLocalResourceRoots()
            ].flat();
        }
        initializeWebViewState() {
            this._preloadsCache.clear();
            if (this._currentKernel) {
                this._updatePreloadsFromKernel(this._currentKernel);
            }
            for (const [output, inset] of this.insetMapping.entries()) {
                this._sendMessageToWebview({ ...inset.cachedCreation, initiallyHidden: this.hiddenInsetMapping.has(output) });
            }
            if (this.initializeMarkupPromise?.isFirstInit) {
                // On first run the contents have already been initialized so we don't need to init them again
                // no op
            }
            else {
                const mdCells = [...this.markupPreviewMapping.values()];
                this.markupPreviewMapping.clear();
                this.initializeMarkup(mdCells);
            }
            this._updateStyles();
            this._updateOptions();
        }
        shouldUpdateInset(cell, output, cellTop, outputOffset) {
            if (this._disposed) {
                return false;
            }
            if ('isOutputCollapsed' in cell && cell.isOutputCollapsed) {
                return false;
            }
            if (this.hiddenInsetMapping.has(output)) {
                return true;
            }
            const outputCache = this.insetMapping.get(output);
            if (!outputCache) {
                return false;
            }
            if (outputOffset === outputCache.cachedCreation.outputOffset && cellTop === outputCache.cachedCreation.cellTop) {
                return false;
            }
            return true;
        }
        ackHeight(updates) {
            this._sendMessageToWebview({
                type: 'ack-dimension',
                updates
            });
        }
        updateScrollTops(outputRequests, markupPreviews) {
            if (this._disposed) {
                return;
            }
            const widgets = (0, arrays_1.coalesce)(outputRequests.map((request) => {
                const outputCache = this.insetMapping.get(request.output);
                if (!outputCache) {
                    return;
                }
                if (!request.forceDisplay && !this.shouldUpdateInset(request.cell, request.output, request.cellTop, request.outputOffset)) {
                    return;
                }
                const id = outputCache.outputId;
                outputCache.cachedCreation.cellTop = request.cellTop;
                outputCache.cachedCreation.outputOffset = request.outputOffset;
                this.hiddenInsetMapping.delete(request.output);
                return {
                    cellId: request.cell.id,
                    outputId: id,
                    cellTop: request.cellTop,
                    outputOffset: request.outputOffset,
                    forceDisplay: request.forceDisplay,
                };
            }));
            if (!widgets.length && !markupPreviews.length) {
                return;
            }
            this._sendMessageToWebview({
                type: 'view-scroll',
                widgets: widgets,
                markupCells: markupPreviews,
            });
        }
        async createMarkupPreview(initialization) {
            if (this._disposed) {
                return;
            }
            if (this.markupPreviewMapping.has(initialization.cellId)) {
                console.error('Trying to create markup preview that already exists');
                return;
            }
            this.markupPreviewMapping.set(initialization.cellId, initialization);
            this._sendMessageToWebview({
                type: 'createMarkupCell',
                cell: initialization
            });
        }
        async showMarkupPreview(newContent) {
            if (this._disposed) {
                return;
            }
            const entry = this.markupPreviewMapping.get(newContent.cellId);
            if (!entry) {
                return this.createMarkupPreview(newContent);
            }
            const sameContent = newContent.content === entry.content;
            const sameMetadata = ((0, objects_1.equals)(newContent.metadata, entry.metadata));
            if (!sameContent || !sameMetadata || !entry.visible) {
                this._sendMessageToWebview({
                    type: 'showMarkupCell',
                    id: newContent.cellId,
                    handle: newContent.cellHandle,
                    // If the content has not changed, we still want to make sure the
                    // preview is visible but don't need to send anything over
                    content: sameContent ? undefined : newContent.content,
                    top: newContent.offset,
                    metadata: sameMetadata ? undefined : newContent.metadata
                });
            }
            entry.metadata = newContent.metadata;
            entry.content = newContent.content;
            entry.offset = newContent.offset;
            entry.visible = true;
        }
        async hideMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            const cellsToHide = [];
            for (const cellId of cellIds) {
                const entry = this.markupPreviewMapping.get(cellId);
                if (entry) {
                    if (entry.visible) {
                        cellsToHide.push(cellId);
                        entry.visible = false;
                    }
                }
            }
            if (cellsToHide.length) {
                this._sendMessageToWebview({
                    type: 'hideMarkupCells',
                    ids: cellsToHide
                });
            }
        }
        async unhideMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            const toUnhide = [];
            for (const cellId of cellIds) {
                const entry = this.markupPreviewMapping.get(cellId);
                if (entry) {
                    if (!entry.visible) {
                        entry.visible = true;
                        toUnhide.push(cellId);
                    }
                }
                else {
                    console.error(`Trying to unhide a preview that does not exist: ${cellId}`);
                }
            }
            this._sendMessageToWebview({
                type: 'unhideMarkupCells',
                ids: toUnhide,
            });
        }
        async deleteMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            for (const id of cellIds) {
                if (!this.markupPreviewMapping.has(id)) {
                    console.error(`Trying to delete a preview that does not exist: ${id}`);
                }
                this.markupPreviewMapping.delete(id);
            }
            if (cellIds.length) {
                this._sendMessageToWebview({
                    type: 'deleteMarkupCell',
                    ids: cellIds
                });
            }
        }
        async updateMarkupPreviewSelections(selectedCellsIds) {
            if (this._disposed) {
                return;
            }
            this._sendMessageToWebview({
                type: 'updateSelectedMarkupCells',
                selectedCellIds: selectedCellsIds.filter(id => this.markupPreviewMapping.has(id)),
            });
        }
        async initializeMarkup(cells) {
            if (this._disposed) {
                return;
            }
            this.initializeMarkupPromise?.p.complete();
            const requestId = UUID.generateUuid();
            this.initializeMarkupPromise = { p: new async_1.DeferredPromise(), requestId, isFirstInit: this.firstInit };
            this.firstInit = false;
            for (const cell of cells) {
                this.markupPreviewMapping.set(cell.cellId, cell);
            }
            this._sendMessageToWebview({
                type: 'initializeMarkup',
                cells,
                requestId,
            });
            return this.initializeMarkupPromise.p.p;
        }
        /**
         * Validate if cached inset is out of date and require a rerender
         * Note that it doesn't account for output content change.
         */
        _cachedInsetEqual(cachedInset, content) {
            if (content.type === 1 /* RenderOutputType.Extension */) {
                // Use a new renderer
                return cachedInset.renderer?.id === content.renderer.id;
            }
            else {
                // The new renderer is the default HTML renderer
                return cachedInset.cachedCreation.type === 'html';
            }
        }
        requestCreateOutputWhenWebviewIdle(cellInfo, content, cellTop, offset) {
            if (this._disposed) {
                return;
            }
            if (this.insetMapping.has(content.source)) {
                return;
            }
            if (this.pendingWebviewIdleCreationRequest.has(content.source)) {
                return;
            }
            if (this.pendingWebviewIdleInsetMapping.has(content.source)) {
                // handled in renderer process, waiting for webview to process it when idle
                return;
            }
            this.pendingWebviewIdleCreationRequest.set(content.source, (0, async_1.runWhenGlobalIdle)(() => {
                const { message, renderer, transfer: transferable } = this._createOutputCreationMessage(cellInfo, content, cellTop, offset, true, true);
                this._sendMessageToWebview(message, transferable);
                this.pendingWebviewIdleInsetMapping.set(content.source, { outputId: message.outputId, versionId: content.source.model.versionId, cellInfo: cellInfo, renderer, cachedCreation: message });
                this.reversedPendingWebviewIdleInsetMapping.set(message.outputId, content.source);
                this.pendingWebviewIdleCreationRequest.delete(content.source);
            }));
        }
        createOutput(cellInfo, content, cellTop, offset) {
            if (this._disposed) {
                return;
            }
            const cachedInset = this.insetMapping.get(content.source);
            // we now request to render the output immediately, so we can remove the pending request
            // dispose the pending request in renderer process if it exists
            this.pendingWebviewIdleCreationRequest.get(content.source)?.dispose();
            this.pendingWebviewIdleCreationRequest.delete(content.source);
            // if request has already been sent out, we then remove it from the pending mapping
            this.pendingWebviewIdleInsetMapping.delete(content.source);
            if (cachedInset) {
                this.reversedPendingWebviewIdleInsetMapping.delete(cachedInset.outputId);
            }
            if (cachedInset && this._cachedInsetEqual(cachedInset, content)) {
                this.hiddenInsetMapping.delete(content.source);
                this._sendMessageToWebview({
                    type: 'showOutput',
                    cellId: cachedInset.cellInfo.cellId,
                    outputId: cachedInset.outputId,
                    cellTop: cellTop,
                    outputOffset: offset
                });
                return;
            }
            // create new output
            const { message, renderer, transfer: transferable } = this._createOutputCreationMessage(cellInfo, content, cellTop, offset, false, false);
            this._sendMessageToWebview(message, transferable);
            this.insetMapping.set(content.source, { outputId: message.outputId, versionId: content.source.model.versionId, cellInfo: cellInfo, renderer, cachedCreation: message });
            this.hiddenInsetMapping.delete(content.source);
            this.reversedInsetMapping.set(message.outputId, content.source);
        }
        createMetadata(output, mimeType) {
            if (mimeType.startsWith('image')) {
                const buffer = output.outputs.find(out => out.mime === 'text/plain')?.data.buffer;
                if (buffer?.length && buffer?.length > 0) {
                    const altText = new TextDecoder().decode(buffer);
                    return { ...output.metadata, vscode_altText: altText };
                }
            }
            return output.metadata;
        }
        _createOutputCreationMessage(cellInfo, content, cellTop, offset, createOnIdle, initiallyHidden) {
            const messageBase = {
                type: 'html',
                executionId: cellInfo.executionId,
                cellId: cellInfo.cellId,
                cellTop: cellTop,
                outputOffset: offset,
                left: 0,
                requiredPreloads: [],
                createOnIdle: createOnIdle
            };
            const transfer = [];
            let message;
            let renderer;
            if (content.type === 1 /* RenderOutputType.Extension */) {
                const output = content.source.model;
                renderer = content.renderer;
                const first = output.outputs.find(op => op.mime === content.mimeType);
                const metadata = this.createMetadata(output, content.mimeType);
                const valueBytes = copyBufferIfNeeded(first.data.buffer, transfer);
                message = {
                    ...messageBase,
                    outputId: output.outputId,
                    rendererId: content.renderer.id,
                    content: {
                        type: 1 /* RenderOutputType.Extension */,
                        outputId: output.outputId,
                        metadata: metadata,
                        output: {
                            mime: first.mime,
                            valueBytes,
                        },
                        allOutputs: output.outputs.map(output => ({ mime: output.mime })),
                    },
                    initiallyHidden: initiallyHidden
                };
            }
            else {
                message = {
                    ...messageBase,
                    outputId: UUID.generateUuid(),
                    content: {
                        type: content.type,
                        htmlContent: content.htmlContent,
                    },
                    initiallyHidden: initiallyHidden
                };
            }
            return {
                message,
                renderer,
                transfer,
            };
        }
        updateOutput(cellInfo, content, cellTop, offset) {
            if (this._disposed) {
                return;
            }
            if (!this.insetMapping.has(content.source)) {
                this.createOutput(cellInfo, content, cellTop, offset);
                return;
            }
            const outputCache = this.insetMapping.get(content.source);
            if (outputCache.versionId === content.source.model.versionId) {
                // already sent this output version to the renderer
                return;
            }
            this.hiddenInsetMapping.delete(content.source);
            let updatedContent = undefined;
            const transfer = [];
            if (content.type === 1 /* RenderOutputType.Extension */) {
                const output = content.source.model;
                const firstBuffer = output.outputs.find(op => op.mime === content.mimeType);
                const appenededData = output.appendedSinceVersion(outputCache.versionId, content.mimeType);
                const appended = appenededData ? { valueBytes: appenededData.buffer, previousVersion: outputCache.versionId } : undefined;
                const valueBytes = copyBufferIfNeeded(firstBuffer.data.buffer, transfer);
                updatedContent = {
                    type: 1 /* RenderOutputType.Extension */,
                    outputId: outputCache.outputId,
                    metadata: output.metadata,
                    output: {
                        mime: content.mimeType,
                        valueBytes,
                        appended: appended
                    },
                    allOutputs: output.outputs.map(output => ({ mime: output.mime }))
                };
            }
            this._sendMessageToWebview({
                type: 'showOutput',
                cellId: outputCache.cellInfo.cellId,
                outputId: outputCache.outputId,
                cellTop: cellTop,
                outputOffset: offset,
                content: updatedContent
            }, transfer);
            outputCache.versionId = content.source.model.versionId;
            return;
        }
        async copyImage(output) {
            this._sendMessageToWebview({
                type: 'copyImage',
                outputId: output.model.outputId,
                altOutputId: output.model.alternativeOutputId
            });
        }
        removeInsets(outputs) {
            if (this._disposed) {
                return;
            }
            for (const output of outputs) {
                const outputCache = this.insetMapping.get(output);
                if (!outputCache) {
                    continue;
                }
                const id = outputCache.outputId;
                this._sendMessageToWebview({
                    type: 'clearOutput',
                    rendererId: outputCache.cachedCreation.rendererId,
                    cellUri: outputCache.cellInfo.cellUri.toString(),
                    outputId: id,
                    cellId: outputCache.cellInfo.cellId
                });
                this.insetMapping.delete(output);
                this.pendingWebviewIdleCreationRequest.get(output)?.dispose();
                this.pendingWebviewIdleCreationRequest.delete(output);
                this.pendingWebviewIdleInsetMapping.delete(output);
                this.reversedPendingWebviewIdleInsetMapping.delete(id);
                this.reversedInsetMapping.delete(id);
            }
        }
        hideInset(output) {
            if (this._disposed) {
                return;
            }
            const outputCache = this.insetMapping.get(output);
            if (!outputCache) {
                return;
            }
            this.hiddenInsetMapping.add(output);
            this._sendMessageToWebview({
                type: 'hideOutput',
                outputId: outputCache.outputId,
                cellId: outputCache.cellInfo.cellId,
            });
        }
        focusWebview() {
            if (this._disposed) {
                return;
            }
            this.webview?.focus();
        }
        selectOutputContents(cell) {
            if (this._disposed) {
                return;
            }
            const output = cell.outputsViewModels.find(o => o.model.outputId === cell.focusedOutputId);
            const outputId = output ? this.insetMapping.get(output)?.outputId : undefined;
            this._sendMessageToWebview({
                type: 'select-output-contents',
                cellOrOutputId: outputId || cell.id
            });
        }
        selectInputContents(cell) {
            if (this._disposed) {
                return;
            }
            const output = cell.outputsViewModels.find(o => o.model.outputId === cell.focusedOutputId);
            const outputId = output ? this.insetMapping.get(output)?.outputId : undefined;
            this._sendMessageToWebview({
                type: 'select-input-contents',
                cellOrOutputId: outputId || cell.id
            });
        }
        focusOutput(cellOrOutputId, alternateId, viewFocused) {
            if (this._disposed) {
                return;
            }
            if (!viewFocused) {
                this.webview?.focus();
            }
            this._sendMessageToWebview({
                type: 'focus-output',
                cellOrOutputId: cellOrOutputId,
                alternateId: alternateId
            });
        }
        blurOutput() {
            if (this._disposed) {
                return;
            }
            this._sendMessageToWebview({
                type: 'blur-output'
            });
        }
        async find(query, options) {
            if (query === '') {
                this._sendMessageToWebview({
                    type: 'findStop',
                    ownerID: options.ownerID
                });
                return [];
            }
            const p = new Promise(resolve => {
                const sub = this.webview?.onMessage(e => {
                    if (e.message.type === 'didFind') {
                        resolve(e.message.matches);
                        sub?.dispose();
                    }
                });
            });
            this._sendMessageToWebview({
                type: 'find',
                query: query,
                options
            });
            const ret = await p;
            return ret;
        }
        findStop(ownerID) {
            this._sendMessageToWebview({
                type: 'findStop',
                ownerID
            });
        }
        async findHighlightCurrent(index, ownerID) {
            const p = new Promise(resolve => {
                const sub = this.webview?.onMessage(e => {
                    if (e.message.type === 'didFindHighlightCurrent') {
                        resolve(e.message.offset);
                        sub?.dispose();
                    }
                });
            });
            this._sendMessageToWebview({
                type: 'findHighlightCurrent',
                index,
                ownerID
            });
            const ret = await p;
            return ret;
        }
        async findUnHighlightCurrent(index, ownerID) {
            this._sendMessageToWebview({
                type: 'findUnHighlightCurrent',
                index,
                ownerID
            });
        }
        deltaCellContainerClassNames(cellId, added, removed) {
            this._sendMessageToWebview({
                type: 'decorations',
                cellId,
                addedClassNames: added,
                removedClassNames: removed
            });
        }
        updateOutputRenderers() {
            if (!this.webview) {
                return;
            }
            const renderersData = this.getRendererData();
            this.localResourceRootsCache = this._getResourceRootsCache();
            const mixedResourceRoots = [
                ...(this.localResourceRootsCache || []),
                ...(this._currentKernel ? [this._currentKernel.localResourceRoot] : []),
            ];
            this.webview.localResourcesRoot = mixedResourceRoots;
            this._sendMessageToWebview({
                type: 'updateRenderers',
                rendererData: renderersData
            });
        }
        async updateKernelPreloads(kernel) {
            if (this._disposed || kernel === this._currentKernel) {
                return;
            }
            const previousKernel = this._currentKernel;
            this._currentKernel = kernel;
            if (previousKernel && previousKernel.preloadUris.length > 0) {
                this.webview?.reload(); // preloads will be restored after reload
            }
            else if (kernel) {
                this._updatePreloadsFromKernel(kernel);
            }
        }
        _updatePreloadsFromKernel(kernel) {
            const resources = [];
            for (const preload of kernel.preloadUris) {
                const uri = this.environmentService.isExtensionDevelopment && (preload.scheme === 'http' || preload.scheme === 'https')
                    ? preload : this.asWebviewUri(preload, undefined);
                if (!this._preloadsCache.has(uri.toString())) {
                    resources.push({ uri: uri.toString(), originalUri: preload.toString() });
                    this._preloadsCache.add(uri.toString());
                }
            }
            if (!resources.length) {
                return;
            }
            this._updatePreloads(resources);
        }
        _updatePreloads(resources) {
            if (!this.webview) {
                return;
            }
            const mixedResourceRoots = [
                ...(this.localResourceRootsCache || []),
                ...(this._currentKernel ? [this._currentKernel.localResourceRoot] : []),
            ];
            this.webview.localResourcesRoot = mixedResourceRoots;
            this._sendMessageToWebview({
                type: 'preload',
                resources: resources,
            });
        }
        _sendMessageToWebview(message, transfer) {
            if (this._disposed) {
                return;
            }
            this.webview?.postMessage(message, transfer);
        }
        dispose() {
            this._disposed = true;
            this.webview?.dispose();
            this.webview = undefined;
            this.notebookEditor = null;
            this.insetMapping.clear();
            this.pendingWebviewIdleCreationRequest.clear();
            super.dispose();
        }
    };
    exports.BackLayerWebView = BackLayerWebView;
    exports.BackLayerWebView = BackLayerWebView = BackLayerWebView_1 = __decorate([
        __param(6, webview_1.IWebviewService),
        __param(7, opener_1.IOpenerService),
        __param(8, notebookService_1.INotebookService),
        __param(9, workspace_1.IWorkspaceContextService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, dialogs_1.IFileDialogService),
        __param(12, files_1.IFileService),
        __param(13, contextView_1.IContextMenuService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(16, configuration_1.IConfigurationService),
        __param(17, language_1.ILanguageService),
        __param(18, workspace_1.IWorkspaceContextService),
        __param(19, editorGroupsService_1.IEditorGroupsService),
        __param(20, storage_1.IStorageService),
        __param(21, pathService_1.IPathService),
        __param(22, notebookLoggingService_1.INotebookLoggingService),
        __param(23, themeService_1.IThemeService),
        __param(24, telemetry_1.ITelemetryService)
    ], BackLayerWebView);
    function copyBufferIfNeeded(buffer, transfer) {
        if (buffer.byteLength === buffer.buffer.byteLength) {
            // No copy needed but we can't transfer either
            return buffer;
        }
        else {
            // The buffer is smaller than its backing array buffer.
            // Create a copy to avoid sending the entire array buffer.
            const valueBytes = new Uint8Array(buffer);
            transfer.push(valueBytes.buffer);
            return valueBytes;
        }
    }
    function getTokenizationCss() {
        const colorMap = languages_1.TokenizationRegistry.getColorMap();
        const tokenizationCss = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
        return tokenizationCss;
    }
    function tryDecodeURIComponent(uri) {
        try {
            return decodeURIComponent(uri);
        }
        catch {
            return uri;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja0xheWVyV2ViVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9yZW5kZXJlcnMvYmFja0xheWVyV2ViVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeURoRyxNQUFNLGlCQUFpQixHQUFHLHdCQUF3QixDQUFDO0lBQ25ELE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQztJQUNyQyxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQztJQStEakMsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBNEMsU0FBUSx1QkFBUTs7UUFJaEUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxjQUErQjtZQUM1RCxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksNEJBQWtCLENBQUMsbUNBQW1DLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbEcsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUF3QkQsWUFDUSxjQUEyQyxFQUNqQyxFQUFVLEVBQ1gsZ0JBQXdCLEVBQ3hCLFdBQWdCLEVBQ3hCLE9BQWdDLEVBQ3ZCLGlCQUF1RCxFQUN2RCxjQUFnRCxFQUNqRCxhQUE4QyxFQUM1QyxlQUFrRCxFQUMxQyxjQUF5RCxFQUNyRCxrQkFBaUUsRUFDM0UsaUJBQXNELEVBQzVELFdBQTBDLEVBQ25DLGtCQUF3RCxFQUN6RCxpQkFBc0QsRUFDeEMsK0JBQWtGLEVBQzdGLG9CQUE0RCxFQUNqRSxlQUFrRCxFQUMxQyx1QkFBa0UsRUFDdEUsa0JBQXlELEVBQzlELGNBQWdELEVBQ25ELFdBQTBDLEVBQy9CLGtCQUE0RCxFQUN0RSxZQUEyQixFQUN2QixnQkFBb0Q7WUFFdkUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBMUJi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