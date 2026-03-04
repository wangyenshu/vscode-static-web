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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/errors", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/browser/codeActionKeybindingResolver", "vs/editor/contrib/codeAction/browser/codeActionMenu", "vs/editor/contrib/codeAction/browser/lightBulbWidget", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/actionWidget/browser/actionWidget", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/platform/progress/common/progress", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/editor/contrib/codeAction/common/types", "vs/editor/contrib/codeAction/browser/codeActionModel", "vs/base/common/hierarchicalKind", "vs/platform/telemetry/common/telemetry"], function (require, exports, dom_1, aria, errors_1, lazy_1, lifecycle_1, position_1, textModel_1, languageFeatures_1, codeAction_1, codeActionKeybindingResolver_1, codeActionMenu_1, lightBulbWidget_1, messageController_1, nls_1, actionWidget_1, commands_1, configuration_1, contextkey_1, instantiation_1, markers_1, progress_1, colorRegistry_1, theme_1, themeService_1, types_1, codeActionModel_1, hierarchicalKind_1, telemetry_1) {
    "use strict";
    var CodeActionController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionController = void 0;
    const DECORATION_CLASS_NAME = 'quickfix-edit-highlight';
    let CodeActionController = class CodeActionController extends lifecycle_1.Disposable {
        static { CodeActionController_1 = this; }
        static { this.ID = 'editor.contrib.codeActionController'; }
        static get(editor) {
            return editor.getContribution(CodeActionController_1.ID);
        }
        constructor(editor, markerService, contextKeyService, instantiationService, languageFeaturesService, progressService, _commandService, _configurationService, _actionWidgetService, _instantiationService, _telemetryService) {
            super();
            this._commandService = _commandService;
            this._configurationService = _configurationService;
            this._actionWidgetService = _actionWidgetService;
            this._instantiationService = _instantiationService;
            this._telemetryService = _telemetryService;
            this._activeCodeActions = this._register(new lifecycle_1.MutableDisposable());
            this._showDisabled = false;
            this._disposed = false;
            this._editor = editor;
            this._model = this._register(new codeActionModel_1.CodeActionModel(this._editor, languageFeaturesService.codeActionProvider, markerService, contextKeyService, progressService, _configurationService));
            this._register(this._model.onDidChangeState(newState => this.update(newState)));
            this._lightBulbWidget = new lazy_1.Lazy(() => {
                const widget = this._editor.getContribution(lightBulbWidget_1.LightBulbWidget.ID);
                if (widget) {
                    this._register(widget.onClick(e => this.showCodeActionsFromLightbulb(e.actions, e)));
                }
                return widget;
            });
            this._resolver = instantiationService.createInstance(codeActionKeybindingResolver_1.CodeActionKeybindingResolver);
            this._register(this._editor.onDidLayoutChange(() => this._actionWidgetService.hide()));
        }
        dispose() {
            this._disposed = true;
            super.dispose();
        }
        async showCodeActionsFromLightbulb(actions, at) {
            this._telemetryService.publicLog2('codeAction.showCodeActionsFromLightbulb', {
                codeActionListLength: actions.validActions.length,
                codeActions: actions.validActions.map(action => action.action.title),
                codeActionProviders: actions.validActions.map(action => action.provider?.displayName ?? ''),
            });
            if (actions.allAIFixes && actions.validActions.length === 1) {
                const actionItem = actions.validActions[0];
                const command = actionItem.action.command;
                if (command && command.id === 'inlineChat.start') {
                    if (command.arguments && command.arguments.length >= 1) {
                        command.arguments[0] = { ...command.arguments[0], autoSend: false };
                    }
                }
                await this._applyCodeAction(actionItem, false, false, codeAction_1.ApplyCodeActionReason.FromAILightbulb);
                return;
            }
            await this.showCodeActionList(actions, at, { includeDisabledActions: false, fromLightbulb: true });
        }
        showCodeActions(_trigger, actions, at) {
            return this.showCodeActionList(actions, at, { includeDisabledActions: false, fromLightbulb: false });
        }
        hideCodeActions() {
            this._actionWidgetService.hide();
        }
        manualTriggerAtCurrentPosition(notAvailableMessage, triggerAction, filter, autoApply) {
            if (!this._editor.hasModel()) {
                return;
            }
            messageController_1.MessageController.get(this._editor)?.closeMessage();
            const triggerPosition = this._editor.getPosition();
            this._trigger({ type: 1 /* CodeActionTriggerType.Invoke */, triggerAction, filter, autoApply, context: { notAvailableMessage, position: triggerPosition } });
        }
        _trigger(trigger) {
            return this._model.trigger(trigger);
        }
        async _applyCodeAction(action, retrigger, preview, actionReason) {
            try {
                await this._instantiationService.invokeFunction(codeAction_1.applyCodeAction, action, actionReason, { preview, editor: this._editor });
            }
            finally {
                if (retrigger) {
                    this._trigger({ type: 2 /* CodeActionTriggerType.Auto */, triggerAction: types_1.CodeActionTriggerSource.QuickFix, filter: {} });
                }
            }
        }
        hideLightBulbWidget() {
            this._lightBulbWidget.rawValue?.hide();
        }
        async update(newState) {
            if (newState.type !== 1 /* CodeActionsState.Type.Triggered */) {
                this._lightBulbWidget.rawValue?.hide();
                return;
            }
            let actions;
            try {
                actions = await newState.actions;
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
                return;
            }
            if (this._disposed) {
                return;
            }
            this._lightBulbWidget.value?.update(actions, newState.trigger, newState.position);
            if (newState.trigger.type === 1 /* CodeActionTriggerType.Invoke */) {
                if (newState.trigger.filter?.include) { // Triggered for specific scope
                    // Check to see if we want to auto apply.
                    const validActionToApply = this.tryGetValidActionToApply(newState.trigger, actions);
                    if (validActionToApply) {
                        try {
                            this._lightBulbWidget.value?.hide();
                            await this._applyCodeAction(validActionToApply, false, false, codeAction_1.ApplyCodeActionReason.FromCodeActions);
                        }
                        finally {
                            actions.dispose();
                        }
                        return;
                    }
                    // Check to see if there is an action that we would have applied were it not invalid
                    if (newState.trigger.context) {
                        const invalidAction = this.getInvalidActionThatWouldHaveBeenApplied(newState.trigger, actions);
                        if (invalidAction && invalidAction.action.disabled) {
                            messageController_1.MessageController.get(this._editor)?.showMessage(invalidAction.action.disabled, newState.trigger.context.position);
                            actions.dispose();
                            return;
                        }
                    }
                }
                const includeDisabledActions = !!newState.trigger.filter?.include;
                if (newState.trigger.context) {
                    if (!actions.allActions.length || !includeDisabledActions && !actions.validActions.length) {
                        messageController_1.MessageController.get(this._editor)?.showMessage(newState.trigger.context.notAvailableMessage, newState.trigger.context.position);
                        this._activeCodeActions.value = actions;
                        actions.dispose();
                        return;
                    }
                }
                this._activeCodeActions.value = actions;
                this.showCodeActionList(actions, this.toCoords(newState.position), { includeDisabledActions, fromLightbulb: false });
            }
            else {
                // auto magically triggered
                if (this._actionWidgetService.isVisible) {
                    // TODO: Figure out if we should update the showing menu?
                    actions.dispose();
                }
                else {
                    this._activeCodeActions.value = actions;
                }
            }
        }
        getInvalidActionThatWouldHaveBeenApplied(trigger, actions) {
            if (!actions.allActions.length) {
                return undefined;
            }
            if ((trigger.autoApply === "first" /* CodeActionAutoApply.First */ && actions.validActions.length === 0)
                || (trigger.autoApply === "ifSingle" /* CodeActionAutoApply.IfSingle */ && actions.allActions.length === 1)) {
                return actions.allActions.find(({ action }) => action.disabled);
            }
            return undefined;
        }
        tryGetValidActionToApply(trigger, actions) {
            if (!actions.validActions.length) {
                return undefined;
            }
            if ((trigger.autoApply === "first" /* CodeActionAutoApply.First */ && actions.validActions.length > 0)
                || (trigger.autoApply === "ifSingle" /* CodeActionAutoApply.IfSingle */ && actions.validActions.length === 1)) {
                return actions.validActions[0];
            }
            return undefined;
        }
        static { this.DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'quickfix-highlight',
            className: DECORATION_CLASS_NAME
        }); }
        async showCodeActionList(actions, at, options) {
            const currentDecorations = this._editor.createDecorationsCollection();
            const editorDom = this._editor.getDomNode();
            if (!editorDom) {
                return;
            }
            const actionsToShow = options.includeDisabledActions && (this._showDisabled || actions.validActions.length === 0) ? actions.allActions : actions.validActions;
            if (!actionsToShow.length) {
                return;
            }
            const anchor = position_1.Position.isIPosition(at) ? this.toCoords(at) : at;
            const delegate = {
                onSelect: async (action, preview) => {
                    this._applyCodeAction(action, /* retrigger */ true, !!preview, options.fromLightbulb ? codeAction_1.ApplyCodeActionReason.FromAILightbulb : codeAction_1.ApplyCodeActionReason.FromCodeActions);
                    this._actionWidgetService.hide(false);
                    currentDecorations.clear();
                },
                onHide: (didCancel) => {
                    this._editor?.focus();
                    currentDecorations.clear();
                    // Telemetry for showing code actions here. only log on `showLightbulb`. Logs when code action list is quit out.
                    if (options.fromLightbulb && didCancel !== undefined) {
                        this._telemetryService.publicLog2('codeAction.showCodeActionList.onHide', {
                            codeActionListLength: actions.validActions.length,
                            didCancel: didCancel,
                        });
                    }
                },
                onHover: async (action, token) => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    let canPreview = false;
                    const actionKind = action.action.kind;
                    if (actionKind) {
                        const hierarchicalKind = new hierarchicalKind_1.HierarchicalKind(actionKind);
                        const refactorKinds = [
                            types_1.CodeActionKind.RefactorExtract,
                            types_1.CodeActionKind.RefactorInline,
                            types_1.CodeActionKind.RefactorRewrite,
                            types_1.CodeActionKind.RefactorMove,
                            types_1.CodeActionKind.Source
                        ];
                        canPreview = refactorKinds.some(refactorKind => refactorKind.contains(hierarchicalKind));
                    }
                    return { canPreview: canPreview || !!action.action.edit?.edits.length };
                },
                onFocus: (action) => {
                    if (action && action.action) {
                        const ranges = action.action.ranges;
                        const diagnostics = action.action.diagnostics;
                        currentDecorations.clear();
                        if (ranges && ranges.length > 0) {
                            // Handles case for `fix all` where there are multiple diagnostics.
                            const decorations = (diagnostics && diagnostics?.length > 1)
                                ? diagnostics.map(diagnostic => ({ range: diagnostic, options: CodeActionController_1.DECORATION }))
                                : ranges.map(range => ({ range, options: CodeActionController_1.DECORATION }));
                            currentDecorations.set(decorations);
                        }
                        else if (diagnostics && diagnostics.length > 0) {
                            const decorations = diagnostics.map(diagnostic => ({ range: diagnostic, options: CodeActionController_1.DECORATION }));
                            currentDecorations.set(decorations);
                            const diagnostic = diagnostics[0];
                            if (diagnostic.startLineNumber && diagnostic.startColumn) {
                                const selectionText = this._editor.getModel()?.getWordAtPosition({ lineNumber: diagnostic.startLineNumber, column: diagnostic.startColumn })?.word;
                                aria.status((0, nls_1.localize)('editingNewSelection', "Context: {0} at line {1} and column {2}.", selectionText, diagnostic.startLineNumber, diagnostic.startColumn));
                            }
                        }
                    }
                    else {
                        currentDecorations.clear();
                    }
                }
            };
            this._actionWidgetService.show('codeActionWidget', true, (0, codeActionMenu_1.toMenuItems)(actionsToShow, this._shouldShowHeaders(), this._resolver.getResolver()), delegate, anchor, editorDom, this._getActionBarActions(actions, at, options));
        }
        toCoords(position) {
            if (!this._editor.hasModel()) {
                return { x: 0, y: 0 };
            }
            this._editor.revealPosition(position, 1 /* ScrollType.Immediate */);
            this._editor.render();
            // Translate to absolute editor position
            const cursorCoords = this._editor.getScrolledVisiblePosition(position);
            const editorCoords = (0, dom_1.getDomNodePagePosition)(this._editor.getDomNode());
            const x = editorCoords.left + cursorCoords.left;
            const y = editorCoords.top + cursorCoords.top + cursorCoords.height;
            return { x, y };
        }
        _shouldShowHeaders() {
            const model = this._editor?.getModel();
            return this._configurationService.getValue('editor.codeActionWidget.showHeaders', { resource: model?.uri });
        }
        _getActionBarActions(actions, at, options) {
            if (options.fromLightbulb) {
                return [];
            }
            const resultActions = actions.documentation.map((command) => ({
                id: command.id,
                label: command.title,
                tooltip: command.tooltip ?? '',
                class: undefined,
                enabled: true,
                run: () => this._commandService.executeCommand(command.id, ...(command.arguments ?? [])),
            }));
            if (options.includeDisabledActions && actions.validActions.length > 0 && actions.allActions.length !== actions.validActions.length) {
                resultActions.push(this._showDisabled ? {
                    id: 'hideMoreActions',
                    label: (0, nls_1.localize)('hideMoreActions', 'Hide Disabled'),
                    enabled: true,
                    tooltip: '',
                    class: undefined,
                    run: () => {
                        this._showDisabled = false;
                        return this.showCodeActionList(actions, at, options);
                    }
                } : {
                    id: 'showMoreActions',
                    label: (0, nls_1.localize)('showMoreActions', 'Show Disabled'),
                    enabled: true,
                    tooltip: '',
                    class: undefined,
                    run: () => {
                        this._showDisabled = true;
                        return this.showCodeActionList(actions, at, options);
                    }
                });
            }
            return resultActions;
        }
    };
    exports.CodeActionController = CodeActionController;
    exports.CodeActionController = CodeActionController = CodeActionController_1 = __decorate([
        __param(1, markers_1.IMarkerService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, progress_1.IEditorProgressService),
        __param(6, commands_1.ICommandService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, actionWidget_1.IActionWidgetService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, telemetry_1.ITelemetryService)
    ], CodeActionController);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const addBackgroundColorRule = (selector, color) => {
            if (color) {
                collector.addRule(`.monaco-editor ${selector} { background-color: ${color}; }`);
            }
        };
        addBackgroundColorRule('.quickfix-edit-highlight', theme.getColor(colorRegistry_1.editorFindMatchHighlight));
        const findMatchHighlightBorder = theme.getColor(colorRegistry_1.editorFindMatchHighlightBorder);
        if (findMatchHighlightBorder) {
            collector.addRule(`.monaco-editor .quickfix-edit-highlight { border: 1px ${(0, theme_1.isHighContrast)(theme.type) ? 'dotted' : 'solid'} ${findMatchHighlightBorder}; box-sizing: border-box; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbkNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2RlQWN0aW9uL2Jyb3dzZXIvY29kZUFjdGlvbkNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStDaEcsTUFBTSxxQkFBcUIsR0FBRyx5QkFBeUIsQ0FBQztJQUVqRCxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVOztpQkFFNUIsT0FBRSxHQUFHLHFDQUFxQyxBQUF4QyxDQUF5QztRQUUzRCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQ3BDLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBdUIsc0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQWFELFlBQ0MsTUFBbUIsRUFDSCxhQUE2QixFQUN6QixpQkFBcUMsRUFDbEMsb0JBQTJDLEVBQ3hDLHVCQUFpRCxFQUNuRCxlQUF1QyxFQUM5QyxlQUFpRCxFQUMzQyxxQkFBNkQsRUFDOUQsb0JBQTJELEVBQzFELHFCQUE2RCxFQUNqRSxpQkFBcUQ7WUFFeEUsS0FBSyxFQUFFLENBQUM7WUFOMEIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQzFCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDN0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUN6QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2hELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFsQnhELHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBaUIsQ0FBQyxDQUFDO1lBQ3JGLGtCQUFhLEdBQUcsS0FBSyxDQUFDO1lBSXRCLGNBQVMsR0FBRyxL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