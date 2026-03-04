/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/platform/contextkey/common/contextkey", "vs/platform/progress/common/progress", "../common/types", "./codeAction", "vs/base/common/hierarchicalKind"], function (require, exports, async_1, errors_1, event_1, lifecycle_1, resources_1, editorOptions_1, position_1, selection_1, contextkey_1, progress_1, types_1, codeAction_1, hierarchicalKind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionModel = exports.CodeActionsState = exports.APPLY_FIX_ALL_COMMAND_ID = exports.SUPPORTED_CODE_ACTIONS = void 0;
    exports.SUPPORTED_CODE_ACTIONS = new contextkey_1.RawContextKey('supportedCodeAction', '');
    exports.APPLY_FIX_ALL_COMMAND_ID = '_typescript.applyFixAllCodeAction';
    class CodeActionOracle extends lifecycle_1.Disposable {
        constructor(_editor, _markerService, _signalChange, _delay = 250) {
            super();
            this._editor = _editor;
            this._markerService = _markerService;
            this._signalChange = _signalChange;
            this._delay = _delay;
            this._autoTriggerTimer = this._register(new async_1.TimeoutTimer());
            this._register(this._markerService.onMarkerChanged(e => this._onMarkerChanges(e)));
            this._register(this._editor.onDidChangeCursorPosition(() => this._tryAutoTrigger()));
        }
        trigger(trigger) {
            const selection = this._getRangeOfSelectionUnlessWhitespaceEnclosed(trigger);
            this._signalChange(selection ? { trigger, selection } : undefined);
        }
        _onMarkerChanges(resources) {
            const model = this._editor.getModel();
            if (model && resources.some(resource => (0, resources_1.isEqual)(resource, model.uri))) {
                this._tryAutoTrigger();
            }
        }
        _tryAutoTrigger() {
            this._autoTriggerTimer.cancelAndSet(() => {
                this.trigger({ type: 2 /* CodeActionTriggerType.Auto */, triggerAction: types_1.CodeActionTriggerSource.Default });
            }, this._delay);
        }
        _getRangeOfSelectionUnlessWhitespaceEnclosed(trigger) {
            if (!this._editor.hasModel()) {
                return undefined;
            }
            const selection = this._editor.getSelection();
            if (trigger.type === 1 /* CodeActionTriggerType.Invoke */) {
                return selection;
            }
            const enabled = this._editor.getOption(65 /* EditorOption.lightbulb */).enabled;
            if (enabled === editorOptions_1.ShowLightbulbIconMode.Off) {
                return undefined;
            }
            else if (enabled === editorOptions_1.ShowLightbulbIconMode.On) {
                return selection;
            }
            else if (enabled === editorOptions_1.ShowLightbulbIconMode.OnCode) {
                const isSelectionEmpty = selection.isEmpty();
                if (!isSelectionEmpty) {
                    return selection;
                }
                const model = this._editor.getModel();
                const { lineNumber, column } = selection.getPosition();
                const line = model.getLineContent(lineNumber);
                if (line.length === 0) {
                    // empty line
                    return undefined;
                }
                else if (column === 1) {
                    // look only right
                    if (/\s/.test(line[0])) {
                        return undefined;
                    }
                }
                else if (column === model.getLineMaxColumn(lineNumber)) {
                    // look only left
                    if (/\s/.test(line[line.length - 1])) {
                        return undefined;
                    }
                }
                else {
                    // look left and right
                    if (/\s/.test(line[column - 2]) && /\s/.test(line[column - 1])) {
                        return undefined;
                    }
                }
            }
            return selection;
        }
    }
    var CodeActionsState;
    (function (CodeActionsState) {
        let Type;
        (function (Type) {
            Type[Type["Empty"] = 0] = "Empty";
            Type[Type["Triggered"] = 1] = "Triggered";
        })(Type = CodeActionsState.Type || (CodeActionsState.Type = {}));
        CodeActionsState.Empty = { type: 0 /* Type.Empty */ };
        class Triggered {
            constructor(trigger, position, _cancellablePromise) {
                this.trigger = trigger;
                this.position = position;
                this._cancellablePromise = _cancellablePromise;
                this.type = 1 /* Type.Triggered */;
                this.actions = _cancellablePromise.catch((e) => {
                    if ((0, errors_1.isCancellationError)(e)) {
                        return emptyCodeActionSet;
                    }
                    throw e;
                });
            }
            cancel() {
                this._cancellablePromise.cancel();
            }
        }
        CodeActionsState.Triggered = Triggered;
    })(CodeActionsState || (exports.CodeActionsState = CodeActionsState = {}));
    const emptyCodeActionSet = Object.freeze({
        allActions: [],
        validActions: [],
        dispose: () => { },
        documentation: [],
        hasAutoFix: false,
        hasAIFix: false,
        allAIFixes: false,
    });
    class CodeActionModel extends lifecycle_1.Disposable {
        constructor(_editor, _registry, _markerService, contextKeyService, _progressService, _configurationService) {
            super();
            this._editor = _editor;
            this._registry = _registry;
            this._markerService = _markerService;
            this._progressService = _progressService;
            this._configurationService = _configurationService;
            this._codeActionOracle = this._register(new lifecycle_1.MutableDisposable());
            this._state = CodeActionsState.Empty;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._disposed = false;
            this._supportedCodeActions = exports.SUPPORTED_CODE_ACTIONS.bindTo(contextKeyService);
            this._register(this._editor.onDidChangeModel(() => this._update()));
            this._register(this._editor.onDidChangeModelLanguage(() => this._update()));
            this._register(this._registry.onDidChange(() => this._update()));
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(65 /* EditorOption.lightbulb */)) {
                    this._update();
                }
            }));
            this._update();
        }
        dispose() {
            if (this._disposed) {
                return;
            }
            this._disposed = true;
            super.dispose();
            this.setState(CodeActionsState.Empty, true);
        }
        _settingEnabledNearbyQuickfixes() {
            const model = this._editor?.getModel();
            return this._configurationService ? this._configurationService.getValue('editor.codeActionWidget.includeNearbyQuickFixes', { resource: model?.uri }) : false;
        }
        _update() {
            if (this._disposed) {
                return;
            }
            this._codeActionOracle.value = undefined;
            this.setState(CodeActionsState.Empty);
            const model = this._editor.getModel();
            if (model
                && this._registry.has(model)
                && !this._editor.getOption(91 /* EditorOption.readOnly */)) {
                const supportedActions = this._registry.all(model).flatMap(provider => provider.providedCodeActionKinds ?? []);
                this._supportedCodeActions.set(supportedActions.join(' '));
                this._codeActionOracle.value = new CodeActionOracle(this._editor, this._markerService, trigger => {
                    if (!trigger) {
                        this.setState(CodeActionsState.Empty);
                        return;
                    }
                    const startPosition = trigger.selection.getStartPosition();
                    const actions = (0, async_1.createCancelablePromise)(async (token) => {
                        if (this._settingEnabledNearbyQuickfixes() && trigger.trigger.type === 1 /* CodeActionTriggerType.Invoke */ && (trigger.trigger.triggerAction === types_1.CodeActionTriggerSource.QuickFix || trigger.trigger.filter?.include?.contains(types_1.CodeActionKind.QuickFix))) {
                            const codeActionSet = await (0, codeAction_1.getCodeActions)(this._registry, model, trigger.selection, trigger.trigger, progress_1.Progress.None, token);
                            const allCodeActions = [...codeActionSet.allActions];
                            if (token.isCancellationRequested) {
                                return emptyCodeActionSet;
                            }
                            // Search for quickfixes in the curret code action set.
                            const foundQuickfix = codeActionSet.validActions?.some(action => action.action.kind ? types_1.CodeActionKind.QuickFix.contains(new hierarchicalKind_1.HierarchicalKind(action.action.kind)) : false);
                            const allMarkers = this._markerService.read({ resource: model.uri });
                            if (foundQuickfix) {
                                for (const action of codeActionSet.validActions) {
                                    if (action.action.command?.arguments?.some(arg => typeof arg === 'string' && arg.includes(exports.APPLY_FIX_ALL_COMMAND_ID))) {
                                        action.action.diagnostics = [...allMarkers.filter(marker => marker.relatedInformation)];
                                    }
                                }
                                return { validActions: codeActionSet.validActions, allActions: allCodeActions, documentation: codeActionSet.documentation, hasAutoFix: codeActionSet.hasAutoFix, hasAIFix: codeActionSet.hasAIFix, allAIFixes: codeActionSet.allAIFixes, dispose: () => { codeActionSet.dispose(); } };
                            }
                            else if (!foundQuickfix) {
                                // If markers exists, and there are no quickfixes found or length is zero, check for quickfixes on that line.
                                if (allMarkers.length > 0) {
                                    const currPosition = trigger.selection.getPosition();
                                    let trackedPosition = currPosition;
                                    let distance = Number.MAX_VALUE;
                                    const currentActions = [...codeActionSet.validActions];
                                    for (const marker of allMarkers) {
                                        const col = marker.endColumn;
                                        const row = marker.endLineNumber;
                                        const startRow = marker.startLineNumber;
                                        // Found quickfix on the same line and check relative distance to other markers
                                        if ((row === currPosition.lineNumber || startRow === currPosition.lineNumber)) {
                                            trackedPosition = new position_1.Position(row, col);
                                            const newCodeActionTrigger = {
                                                type: trigger.trigger.type,
                                                triggerAction: trigger.trigger.triggerAction,
                                                filter: { include: trigger.trigger.filter?.include ? trigger.trigger.filter?.include : types_1.CodeActionKind.QuickFix },
                                                autoApply: trigger.trigger.autoApply,
                                                context: { notAvailableMessage: trigger.trigger.context?.notAvailableMessage || '', position: trackedPosition }
                                            };
                                            const selectionAsPosition = new selection_1.Selection(trackedPosition.lineNumber, trackedPosition.column, trackedPosition.lineNumber, trackedPosition.column);
                                            const actionsAtMarker = await (0, codeAction_1.getCodeActions)(this._registry, model, selectionAsPosition, newCodeActionTrigger, progress_1.Progress.None, token);
                                            if (actionsAtMarker.validActions.length !== 0) {
                                                for (const action of actionsAtMarker.validActions) {
                                                    if (action.action.command?.arguments?.some(arg => typeof arg === 'string' && arg.includes(exports.APPLY_FIX_ALL_COMMAND_ID))) {
                                                        action.action.diagnostics = [...allMarkers.filter(marker => marker.relatedInformation)];
                                                    }
                                                }
                                                if (codeActionSet.allActions.length === 0) {
                                                    allCodeActions.push(...actionsAtMarker.allActions);
                                                }
                                                // Already filtered through to only get quickfixes, so no need to filter again.
                                                if (Math.abs(currPosition.column - col) < distance) {
                                                    currentActions.unshift(...actionsAtMarker.validActions);
                                                }
                                                else {
                                                    currentActions.push(...actionsAtMarker.validActions);
                                                }
                                            }
                                            distance = Math.abs(currPosition.column - col);
                                        }
                                    }
                                    const filteredActions = currentActions.filter((action, index, self) => self.findIndex((a) => a.action.title === action.action.title) === index);
                                    filteredActions.sort((a, b) => {
                                        if (a.action.isPreferred && !b.action.isPreferred) {
                                            return -1;
                                        }
                                        else if (!a.action.isPreferred && b.action.isPreferred) {
                                            return 1;
                                        }
                                        else if (a.action.isAI && !b.action.isAI) {
                                            return 1;
                                        }
                                        else if (!a.action.isAI && b.action.isAI) {
                                            return -1;
                                        }
                                        else {
                                            return 0;
                                        }
                                    });
                                    // Only retriggers if actually found quickfix on the same line as cursor
                                    return { validActions: filteredActions, allActions: allCodeActions, documentation: codeActionSet.documentation, hasAutoFix: codeActionSet.hasAutoFix, hasAIFix: codeActionSet.hasAIFix, allAIFixes: codeActionSet.allAIFixes, dispose: () => { codeActionSet.dispose(); } };
                                }
                            }
                        }
                        // temporarilly hiding here as this is enabled/disabled behind a setting.
                        return (0, codeAction_1.getCodeActions)(this._registry, model, trigger.selection, trigger.trigger, progress_1.Progress.None, token);
                    });
                    if (trigger.trigger.type === 1 /* CodeActionTriggerType.Invoke */) {
                        this._progressService?.showWhile(actions, 250);
                    }
                    const newState = new CodeActionsState.Triggered(trigger.trigger, startPosition, actions);
                    let isManualToAutoTransition = false;
                    if (this._state.type === 1 /* CodeActionsState.Type.Triggered */) {
                        // Check if the current state is manual and the new state is automatic
                        isManualToAutoTransition = this._state.trigger.type === 1 /* CodeActionTriggerType.Invoke */ &&
                            newState.type === 1 /* CodeActionsState.Type.Triggered */ &&
                            newState.trigger.type === 2 /* CodeActionTriggerType.Auto */ &&
                            this._state.position !== newState.position;
                    }
                    // Do not trigger state if current state is manual and incoming state is automatic
                    if (!isManualToAutoTransition) {
                        this.setState(newState);
                    }
                    else {
                        // Reset the new state after getting code actions back.
                        setTimeout(() => {
                            this.setState(newState);
                        }, 500);
                    }
                }, undefined);
                this._codeActionOracle.value.trigger({ type: 2 /* CodeActionTriggerType.Auto */, triggerAction: types_1.CodeActionTriggerSource.Default });
            }
            else {
                this._supportedCodeActions.reset();
            }
        }
        trigger(trigger) {
            this._codeActionOracle.value?.trigger(trigger);
        }
        setState(newState, skipNotify) {
            if (newState === this._state) {
                return;
            }
            // Cancel old request
            if (this._state.type === 1 /* CodeActionsState.Type.Triggered */) {
                this._state.cancel();
            }
            this._state = newState;
            if (!skipNotify && !this._disposed) {
                this._onDidChangeState.fire(newState);
            }
        }
    }
    exports.CodeActionModel = CodeActionModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbk1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29kZUFjdGlvbi9icm93c2VyL2NvZGVBY3Rpb25Nb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzQm5GLFFBQUEsc0JBQXNCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRTlFLFFBQUEsd0JBQXdCLEdBQUcsbUNBQW1DLENBQUM7SUFPNUUsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQUl4QyxZQUNrQixPQUFvQixFQUNwQixjQUE4QixFQUM5QixhQUFtRSxFQUNuRSxTQUFpQixHQUFHO1lBRXJDLEtBQUssRUFBRSxDQUFDO1lBTFMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNwQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDOUIsa0JBQWEsR0FBYixhQUFhLENBQXNEO1lBQ25FLFdBQU0sR0FBTixNQUFNLENBQWM7WUFOckIsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG9CQUFZLEVBQUUsQ0FBQyxDQUFDO1lBU3ZFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFTSxPQUFPLENBQUMsT0FBMEI7WUFDeEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxD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