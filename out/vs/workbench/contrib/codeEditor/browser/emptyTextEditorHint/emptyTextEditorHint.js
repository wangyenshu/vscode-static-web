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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/browser/parts/editor/editorStatus", "vs/platform/commands/common/commands", "vs/editor/common/languages/modesRegistry", "vs/base/common/network", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/editor/browser/editorExtensions", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/formattedTextRenderer", "vs/workbench/contrib/snippets/browser/commands/fileTemplateSnippets", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/platform/telemetry/common/telemetry", "vs/platform/product/common/productService", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/platform", "vs/base/browser/ui/aria/aria", "vs/platform/registry/common/platform", "vs/workbench/common/configuration", "vs/workbench/services/output/common/output", "vs/workbench/services/search/common/search", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/platform/hover/browser/hover", "vs/css!./emptyTextEditorHint"], function (require, exports, dom, lifecycle_1, nls_1, editorStatus_1, commands_1, modesRegistry_1, network_1, event_1, configuration_1, editorExtensions_1, keybinding_1, editorGroupsService_1, formattedTextRenderer_1, fileTemplateSnippets_1, inlineChatSessionService_1, inlineChat_1, telemetry_1, productService_1, keybindingLabel_1, platform_1, aria_1, platform_2, configuration_2, output_1, search_1, hoverDelegateFactory_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptyTextEditorHintContribution = exports.emptyTextEditorHintSetting = void 0;
    const $ = dom.$;
    // TODO@joyceerhl remove this after a few iterations
    platform_2.Registry.as(configuration_2.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'workbench.editor.untitled.hint',
            migrateFn: (value, _accessor) => ([
                [exports.emptyTextEditorHintSetting, { value }],
                ['workbench.editor.untitled.hint', { value: undefined }]
            ])
        },
        {
            key: 'accessibility.verbosity.untitledHint',
            migrateFn: (value, _accessor) => ([
                ["accessibility.verbosity.emptyEditorHint" /* AccessibilityVerbositySettingId.EmptyEditorHint */, { value }],
                ['accessibility.verbosity.untitledHint', { value: undefined }]
            ])
        }]);
    exports.emptyTextEditorHintSetting = 'workbench.editor.empty.hint';
    let EmptyTextEditorHintContribution = class EmptyTextEditorHintContribution {
        static { this.ID = 'editor.contrib.emptyTextEditorHint'; }
        constructor(editor, editorGroupsService, commandService, configurationService, hoverService, keybindingService, inlineChatSessionService, inlineChatService, telemetryService, productService) {
            this.editor = editor;
            this.editorGroupsService = editorGroupsService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.hoverService = hoverService;
            this.keybindingService = keybindingService;
            this.inlineChatSessionService = inlineChatSessionService;
            this.inlineChatService = inlineChatService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.toDispose = [];
            this.toDispose.push(this.editor.onDidChangeModel(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeModelLanguage(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeModelContent(() => this.update()));
            this.toDispose.push(this.inlineChatService.onDidChangeProviders(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeModelDecorations(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(91 /* EditorOption.readOnly */)) {
                    this.update();
                }
            }));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.emptyTextEditorHintSetting)) {
                    this.update();
                }
            }));
            this.toDispose.push(inlineChatSessionService.onWillStartSession(editor => {
                if (this.editor === editor) {
                    this.textHintContentWidget?.dispose();
                }
            }));
            this.toDispose.push(inlineChatSessionService.onDidEndSession(e => {
                if (this.editor === e.editor) {
                    this.update();
                }
            }));
        }
        _getOptions() {
            return { clickable: true };
        }
        _shouldRenderHint() {
            const configValue = this.configurationService.getValue(exports.emptyTextEditorHintSetting);
            if (configValue === 'hidden') {
                return false;
            }
            if (this.editor.getOption(91 /* EditorOption.readOnly */)) {
                return false;
            }
            const model = this.editor.getModel();
            const languageId = model?.getLanguageId();
            if (!model || languageId === output_1.OUTPUT_MODE_ID || languageId === output_1.LOG_MODE_ID || languageId === search_1.SEARCH_RESULT_LANGUAGE_ID) {
                return false;
            }
            if (this.inlineChatSessionService.getSession(this.editor, model.uri)) {
                return false;
            }
            if (this.editor.getModel()?.getValueLength()) {
                return false;
            }
            const hasConflictingDecorations = Boolean(this.editor.getLineDecorations(1)?.find((d) => d.options.beforeContentClassName
                || d.options.afterContentClassName
                || d.options.before?.content
                || d.options.after?.content));
            if (hasConflictingDecorations) {
                return false;
            }
            const inlineChatProviders = [...this.inlineChatService.getAllProvider()];
            const shouldRenderDefaultHint = model?.uri.scheme === network_1.Schemas.untitled && languageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID && !inlineChatProviders.length;
            return inlineChatProviders.length > 0 || shouldRenderDefaultHint;
        }
        update() {
            const shouldRenderHint = this._shouldRenderHint();
            if (shouldRenderHint && !this.textHintContentWidget) {
                this.textHintContentWidget = new EmptyTextEditorHintContentWidget(this.editor, this._getOptions(), this.editorGroupsService, this.commandService, this.configurationService, this.hoverService, this.keybindingService, this.inlineChatService, this.telemetryService, this.productService);
            }
            else if (!shouldRenderHint && this.textHintContentWidget) {
                this.textHintContentWidget.dispose();
                this.textHintContentWidget = undefined;
            }
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
            this.textHintContentWidget?.dispose();
        }
    };
    exports.EmptyTextEditorHintContribution = EmptyTextEditorHintContribution;
    exports.EmptyTextEditorHintContribution = EmptyTextEditorHintContribution = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, commands_1.ICommandService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, hover_1.IHoverService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, inlineChatSessionService_1.IInlineChatSessionService),
        __param(7, inlineChat_1.IInlineChatService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, productService_1.IProductService)
    ], EmptyTextEditorHintContribution);
    class EmptyTextEditorHintContentWidget {
        static { this.ID = 'editor.widget.emptyHint'; }
        constructor(editor, options, editorGroupsService, commandService, configurationService, hoverService, keybindingService, inlineChatService, telemetryService, productService) {
            this.editor = editor;
            this.options = options;
            this.editorGroupsService = editorGroupsService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.hoverService = hoverService;
            this.keybindingService = keybindingService;
            this.inlineChatService = inlineChatService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.isVisible = false;
            this.ariaLabel = '';
            this.toDispose = new lifecycle_1.DisposableStore();
            this.toDispose.add(this.editor.onDidChangeConfiguration((e) => {
                if (this.domNode && e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this.editor.applyFontInfo(this.domNode);
                }
            }));
            const onDidFocusEditorText = event_1.Event.debounce(this.editor.onDidFocusEditorText, () => undefined, 500);
            this.toDispose.add(onDidFocusEditorText(() => {
                if (this.editor.hasTextFocus() && this.isVisible && this.ariaLabel && this.configurationService.getValue("accessibility.verbosity.emptyEditorHint" /* AccessibilityVerbositySettingId.EmptyEditorHint */)) {
                    (0, aria_1.status)(this.ariaLabel);
                }
            }));
            this.editor.addContentWidget(this);
        }
        getId() {
            return EmptyTextEditorHintContentWidget.ID;
        }
        _getHintInlineChat(providers) {
            const providerName = (providers.length === 1 ? providers[0].label : undefined) ?? this.productService.nameShort;
            const inlineChatId = 'inlineChat.start';
            let ariaLabel = `Ask ${providerName} something or start typing to dismiss.`;
            const handleClick = () => {
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: 'inlineChat.hintAction',
                    from: 'hint'
                });
                this.commandService.executeCommand(inlineChatId, { from: 'hint' });
            };
            const hintHandler = {
                disposables: this.toDispose,
                callback: (index, _event) => {
                    switch (index) {
                        case '0':
                            handleClick();
                            break;
                    }
                }
            };
            const hintElement = $('empty-hint-text');
            hintElement.style.display = 'block';
            const keybindingHint = this.keybindingService.lookupKeybinding(inlineChatId);
            const keybindingHintLabel = keybindingHint?.getLabel();
            if (keybindingHint && keybindingHintLabel) {
                const actionPart = (0, nls_1.localize)('emptyHintText', 'Press {0} to ask {1} to do something. ', keybindingHintLabel, providerName);
                const [before, after] = actionPart.split(keybindingHintLabel).map((fragment) => {
                    if (this.options.clickable) {
                        const hintPart = $('a', undefined, fragment);
                        hintPart.style.fontStyle = 'italic';
                        hintPart.style.cursor = 'pointer';
                        this.toDispose.add(dom.addDisposableListener(hintPart, dom.EventType.CLICK, handleClick));
                        return hintPart;
                    }
                    else {
                        const hintPart = $('span', undefined, fragment);
                        hintPart.style.fontStyle = 'italic';
                        return hintPart;
                    }
                });
                hintElement.appendChild(before);
                const label = hintHandler.disposables.add(new keybindingLabel_1.KeybindingLabel(hintElement, platform_1.OS));
                label.set(keybindingHint);
                label.element.style.width = 'min-content';
                label.element.style.display = 'inline';
                if (this.options.clickable) {
                    label.element.style.cursor = 'pointer';
                    this.toDispose.add(dom.addDisposableListener(label.element, dom.EventType.CLICK, handleClick));
                }
                hintElement.appendChild(after);
                const typeToDismiss = (0, nls_1.localize)('emptyHintTextDismiss', 'Start typing to dismiss.');
                const textHint2 = $('span', undefined, typeToDismiss);
                textHint2.style.fontStyle = 'italic';
                hintElement.appendChild(textHint2);
                ariaLabel = actionPart.concat(typeToDismiss);
            }
            else {
                const hintMsg = (0, nls_1.localize)({
                    key: 'inlineChatHint',
                    comment: [
                        'Preserve double-square brackets and their order',
                    ]
                }, '[[Ask {0} to do something]] or start typing to dismiss.', providerName);
                const rendered = (0, formattedTextRenderer_1.renderFormattedText)(hintMsg, { actionHandler: hintHandler });
                hintElement.appendChild(rendered);
            }
            return { ariaLabel, hintHandler, hintElement };
        }
        _getHintDefault() {
            const hintHandler = {
                disposables: this.toDispose,
                callback: (index, event) => {
                    switch (index) {
                        case '0':
                            languageOnClickOrTap(event.browserEvent);
                            break;
                        case '1':
                            snippetOnClickOrTap(event.browserEvent);
                            break;
                        case '2':
                            chooseEditorOnClickOrTap(event.browserEvent);
                            break;
                        case '3':
                            dontShowOnClickOrTap();
                            break;
                    }
                }
            };
            // the actual command handlers...
            const languageOnClickOrTap = async (e) => {
                e.stopPropagation();
                // Need to focus editor before so current editor becomes active and the command is properly executed
                this.editor.focus();
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: editorStatus_1.ChangeLanguageAction.ID,
                    from: 'hint'
                });
                await this.commandService.executeCommand(editorStatus_1.ChangeLanguageAction.ID, { from: 'hint' });
                this.editor.focus();
            };
            const snippetOnClickOrTap = async (e) => {
                e.stopPropagation();
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: fileTemplateSnippets_1.ApplyFileSnippetAction.Id,
                    from: 'hint'
                });
                await this.commandService.executeCommand(fileTemplateSnippets_1.ApplyFileSnippetAction.Id);
            };
            const chooseEditorOnClickOrTap = async (e) => {
                e.stopPropagation();
                const activeEditorInput = this.editorGroupsService.activeGroup.activeEditor;
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: 'welcome.showNewFileEntries',
                    from: 'hint'
                });
                const newEditorSelected = await this.commandService.executeCommand('welcome.showNewFileEntries', { from: 'hint' });
                // Close the active editor as long as it is untitled (swap the editors out)
                if (newEditorSelected && activeEditorInput !== null && activeEditorInput.resource?.scheme === network_1.Schemas.untitled) {
                    this.editorGroupsService.activeGroup.closeEditor(activeEditorInput, { preserveFocus: true });
                }
            };
            const dontShowOnClickOrTap = () => {
                this.configurationService.updateValue(exports.emptyTextEditorHintSetting, 'hidden');
                this.dispose();
                this.editor.focus();
            };
            const hintMsg = (0, nls_1.localize)({
                key: 'message',
                comment: [
                    'Preserve double-square brackets and their order',
                    'language refers to a programming language'
                ]
            }, '[[Select a language]], or [[fill with template]], or [[open a different editor]] to get started.\nStart typing to dismiss or [[don\'t show]] this again.');
            const hintElement = (0, formattedTextRenderer_1.renderFormattedText)(hintMsg, {
                actionHandler: hintHandler,
                renderCodeSegments: false,
            });
            hintElement.style.fontStyle = 'italic';
            // ugly way to associate keybindings...
            const keybindingsLookup = [editorStatus_1.ChangeLanguageAction.ID, fileTemplateSnippets_1.ApplyFileSnippetAction.Id, 'welcome.showNewFileEntries'];
            const keybindingLabels = keybindingsLookup.map((id) => this.keybindingService.lookupKeybinding(id)?.getLabel() ?? id);
            const ariaLabel = (0, nls_1.localize)('defaultHintAriaLabel', 'Execute {0} to select a language, execute {1} to fill with template, or execute {2} to open a different editor and get started. Start typing to dismiss.', ...keybindingLabels);
            for (const anchor of hintElement.querySelectorAll('a')) {
                anchor.style.cursor = 'pointer';
                const id = keybindingsLookup.shift();
                const title = id && this.keybindingService.lookupKeybinding(id)?.getLabel();
                hintHandler.disposables.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), anchor, title ?? ''));
            }
            return { hintElement, ariaLabel };
        }
        getDomNode() {
            if (!this.domNode) {
                this.domNode = $('.empty-editor-hint');
                this.domNode.style.width = 'max-content';
                this.domNode.style.paddingLeft = '4px';
                const inlineChatProviders = [...this.inlineChatService.getAllProvider()];
                const { hintElement, ariaLabel } = !inlineChatProviders.length ? this._getHintDefault() : this._getHintInlineChat(inlineChatProviders);
                this.domNode.append(hintElement);
                this.ariaLabel = ariaLabel.concat((0, nls_1.localize)('disableHint', ' Toggle {0} in settings to disable this hint.', "accessibility.verbosity.emptyEditorHint" /* AccessibilityVerbositySettingId.EmptyEditorHint */));
                this.toDispose.add(dom.addDisposableListener(this.domNode, 'click', () => {
                    this.editor.focus();
                }));
                this.editor.applyFontInfo(this.domNode);
            }
            return this.domNode;
        }
        getPosition() {
            return {
                position: { lineNumber: 1, column: 1 },
                preference: [0 /* ContentWidgetPositionPreference.EXACT */]
            };
        }
        dispose() {
            this.editor.removeContentWidget(this);
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(EmptyTextEditorHintContribution.ID, EmptyTextEditorHintContribution, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to render a help message
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHlUZXh0RWRpdG9ySGludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9lbXB0eVRleHRFZGl0b3JIaW50L2VtcHR5VGV4dEVkaXRvckhpbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0NoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLG9EQUFvRDtJQUNwRCxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQVUsQ0FBQyxzQkFBc0IsQ0FBQztTQUM3RSwrQkFBK0IsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsRUFBRSxnQ0FBZ0M7WUFDckMsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakMsQ0FBQyxrQ0FBMEIsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUN2QyxDQUFDLGdDQUFnQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDO2FBQ3hELENBQUM7U0FDRjtRQUNEO1lBQ0MsR0FBRyxFQUFFLHNDQUFzQztZQUMzQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxrR0FBa0QsRUFBRSxLQUFLLEVBQUUsQ0FBQztnQkFDNUQsQ0FBQyxzQ0FBc0MsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQzthQUM5RCxDQUFDO1NBQ0YsQ0FBQyxDQUFDLENBQUM7SUFNUSxRQUFBLDBCQUEwQixHQUFHLDZCQUE2QixDQUFDO0lBQ2pFLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQStCO2lCQUVwQixPQUFFLEdBQUcsb0NBQW9DLEFBQXZDLENBQXdDO1FB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