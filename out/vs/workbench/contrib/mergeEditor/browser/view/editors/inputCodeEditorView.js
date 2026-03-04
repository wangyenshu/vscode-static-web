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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/toggle/toggle", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/observable", "vs/base/common/strings", "vs/base/common/types", "vs/editor/common/model", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/browser/defaultStyles", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/mergeEditor/browser/view/colors", "../editorGutter", "./codeEditorView"], function (require, exports, dom_1, iconLabels_1, toggle_1, actions_1, codicons_1, lifecycle_1, numbers_1, observable_1, strings_1, types_1, model_1, nls_1, actions_2, configuration_1, contextView_1, instantiation_1, defaultStyles_1, utils_1, colors_1, editorGutter_1, codeEditorView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeConflictGutterItemView = exports.ModifiedBaseRangeGutterItemModel = exports.InputCodeEditorView = void 0;
    let InputCodeEditorView = class InputCodeEditorView extends codeEditorView_1.CodeEditorView {
        constructor(inputNumber, viewModel, instantiationService, contextMenuService, configurationService) {
            super(instantiationService, viewModel, configurationService);
            this.inputNumber = inputNumber;
            this.otherInputNumber = this.inputNumber === 1 ? 2 : 1;
            this.modifiedBaseRangeGutterItemInfos = (0, observable_1.derivedOpts)({ debugName: `input${this.inputNumber}.modifiedBaseRangeGutterItemInfos` }, reader => {
                const viewModel = this.viewModel.read(reader);
                if (!viewModel) {
                    return [];
                }
                const model = viewModel.model;
                const inputNumber = this.inputNumber;
                const showNonConflictingChanges = viewModel.showNonConflictingChanges.read(reader);
                return model.modifiedBaseRanges.read(reader)
                    .filter((r) => r.getInputDiffs(this.inputNumber).length > 0 && (showNonConflictingChanges || r.isConflicting || !model.isHandled(r).read(reader)))
                    .map((baseRange, idx) => new ModifiedBaseRangeGutterItemModel(idx.toString(), baseRange, inputNumber, viewModel));
            });
            this.decorations = (0, observable_1.derivedOpts)({ debugName: `input${this.inputNumber}.decorations` }, reader => {
                const viewModel = this.viewModel.read(reader);
                if (!viewModel) {
                    return [];
                }
                const model = viewModel.model;
                const textModel = (this.inputNumber === 1 ? model.input1 : model.input2).textModel;
                const activeModifiedBaseRange = viewModel.activeModifiedBaseRange.read(reader);
                const result = new Array();
                const showNonConflictingChanges = viewModel.showNonConflictingChanges.read(reader);
                const showDeletionMarkers = this.showDeletionMarkers.read(reader);
                const diffWithThis = viewModel.baseCodeEditorView.read(reader) !== undefined && viewModel.baseShowDiffAgainst.read(reader) === this.inputNumber;
                const useSimplifiedDecorations = !diffWithThis && this.useSimplifiedDecorations.read(reader);
                for (const modifiedBaseRange of model.modifiedBaseRanges.read(reader)) {
                    const range = modifiedBaseRange.getInputRange(this.inputNumber);
                    if (!range) {
                        continue;
                    }
                    const blockClassNames = ['merge-editor-block'];
                    let blockPadding = [0, 0, 0, 0];
                    const isHandled = model.isInputHandled(modifiedBaseRange, this.inputNumber).read(reader);
                    if (isHandled) {
                        blockClassNames.push('handled');
                    }
                    if (modifiedBaseRange === activeModifiedBaseRange) {
                        blockClassNames.push('focused');
                        blockPadding = [0, 2, 0, 2];
                    }
                    if (modifiedBaseRange.isConflicting) {
                        blockClassNames.push('conflicting');
                    }
                    const inputClassName = this.inputNumber === 1 ? 'input i1' : 'input i2';
                    blockClassNames.push(inputClassName);
                    if (!modifiedBaseRange.isConflicting && !showNonConflictingChanges && isHandled) {
                        continue;
                    }
                    if (useSimplifiedDecorations && !isHandled) {
                        blockClassNames.push('use-simplified-decorations');
                    }
                    result.push({
                        range: range.toInclusiveRangeOrEmpty(),
                        options: {
                            showIfCollapsed: true,
                            blockClassName: blockClassNames.join(' '),
                            blockPadding,
                            blockIsAfterEnd: range.startLineNumber > textModel.getLineCount(),
                            description: 'Merge Editor',
                            minimap: {
                                position: 2 /* MinimapPosition.Gutter */,
                                color: { id: isHandled ? colors_1.handledConflictMinimapOverViewRulerColor : colors_1.unhandledConflictMinimapOverViewRulerColor },
                            },
                            overviewRuler: modifiedBaseRange.isConflicting ? {
                                position: model_1.OverviewRulerLane.Center,
                                color: { id: isHandled ? colors_1.handledConflictMinimapOverViewRulerColor : colors_1.unhandledConflictMinimapOverViewRulerColor },
                            } : undefined
                        }
                    });
                    if (!useSimplifiedDecorations && (modifiedBaseRange.isConflicting || !model.isHandled(modifiedBaseRange).read(reader))) {
                        const inputDiffs = modifiedBaseRange.getInputDiffs(this.inputNumber);
                        for (const diff of inputDiffs) {
                            const range = diff.outputRange.toInclusiveRange();
                            if (range) {
                                result.push({
                                    range,
                                    options: {
                                        className: `merge-editor-diff ${inputClassName}`,
                                        description: 'Merge Editor',
                                        isWholeLine: true,
                                    }
                                });
                            }
                            if (diff.rangeMappings) {
                                for (const d of diff.rangeMappings) {
                                    if (showDeletionMarkers || !d.outputRange.isEmpty()) {
                                        result.push({
                                            range: d.outputRange,
                                            options: {
                                                className: d.outputRange.isEmpty() ? `merge-editor-diff-empty-word ${inputClassName}` : `merge-editor-diff-word ${inputClassName}`,
                                                description: 'Merge Editor',
                                                showIfCollapsed: true,
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                return result;
            });
            this.htmlElements.root.classList.add(`input`);
            this._register(new editorGutter_1.EditorGutter(this.editor, this.htmlElements.gutterDiv, {
                getIntersectingGutterItems: (range, reader) => {
                    if (this.checkboxesVisible.read(reader)) {
                        return this.modifiedBaseRangeGutterItemInfos.read(reader);
                    }
                    else {
                        return [];
                    }
                },
                createView: (item, target) => new MergeConflictGutterItemView(item, target, contextMenuService),
            }));
            this._register((0, codeEditorView_1.createSelectionsAutorun)(this, (baseRange, viewModel) => viewModel.model.translateBaseRangeToInput(this.inputNumber, baseRange)));
            this._register(instantiationService.createInstance(codeEditorView_1.TitleMenu, inputNumber === 1 ? actions_2.MenuId.MergeInput1Toolbar : actions_2.MenuId.MergeInput2Toolbar, this.htmlElements.toolbar));
            this._register((0, observable_1.autorunOpts)({ debugName: `input${this.inputNumber}: update labels & text model` }, reader => {
                const vm = this.viewModel.read(reader);
                if (!vm) {
                    return;
                }
                this.editor.setModel(this.inputNumber === 1 ? vm.model.input1.textModel : vm.model.input2.textModel);
                const title = this.inputNumber === 1
                    ? vm.model.input1.title || (0, nls_1.localize)('input1', 'Input 1')
                    : vm.model.input2.title || (0, nls_1.localize)('input2', 'Input 2');
                const description = this.inputNumber === 1
                    ? vm.model.input1.description
                    : vm.model.input2.description;
                const detail = this.inputNumber === 1
                    ? vm.model.input1.detail
                    : vm.model.input2.detail;
                (0, dom_1.reset)(this.htmlElements.title, ...(0, iconLabels_1.renderLabelWithIcons)(title));
                (0, dom_1.reset)(this.htmlElements.description, ...(description ? (0, iconLabels_1.renderLabelWithIcons)(description) : []));
                (0, dom_1.reset)(this.htmlElements.detail, ...(detail ? (0, iconLabels_1.renderLabelWithIcons)(detail) : []));
            }));
            this._register((0, utils_1.applyObservableDecorations)(this.editor, this.decorations));
        }
    };
    exports.InputCodeEditorView = InputCodeEditorView;
    exports.InputCodeEditorView = InputCodeEditorView = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService)
    ], InputCodeEditorView);
    class ModifiedBaseRangeGutterItemModel {
        constructor(id, baseRange, inputNumber, viewModel) {
            this.id = id;
            this.baseRange = baseRange;
            this.inputNumber = inputNumber;
            this.viewModel = viewModel;
            this.model = this.viewModel.model;
            this.range = this.baseRange.getInputRange(this.inputNumber);
            this.enabled = this.model.isUpToDate;
            this.toggleState = (0, observable_1.derived)(this, reader => {
                const input = this.model
                    .getState(this.baseRange)
                    .read(reader)
                    .getInput(this.inputNumber);
                return input === 2 /* InputState.second */ && !this.baseRange.isOrderRelevant
                    ? 1 /* InputState.first */
                    : input;
            });
            this.state = (0, observable_1.derived)(this, reader => {
                const active = this.viewModel.activeModifiedBaseRange.read(reader);
                if (!this.model.hasBaseRange(this.baseRange)) {
                    return { handled: false, focused: false }; // Invalid state, should only be observed temporarily
                }
                return {
                    handled: this.model.isHandled(this.baseRange).read(reader),
                    focused: this.baseRange === active,
                };
            });
        }
        setState(value, tx) {
            this.viewModel.setState(this.baseRange, this.model
                .getState(this.baseRange)
                .get()
                .withInputValue(this.inputNumber, value), tx, this.inputNumber);
        }
        toggleBothSides() {
            (0, observable_1.transaction)(tx => {
                /** @description Context Menu: toggle both sides */
                const state = this.model
                    .getState(this.baseRange)
                    .get();
                this.model.setState(this.baseRange, state
                    .toggle(this.inputNumber)
                    .toggle(this.inputNumber === 1 ? 2 : 1), true, tx);
            });
        }
        getContextMenuActions() {
            const state = this.model.getState(this.baseRange).get();
            const handled = this.model.isHandled(this.baseRange).get();
            const update = (newState) => {
                (0, observable_1.transaction)(tx => {
                    /** @description Context Menu: Update Base Range State */
                    return this.viewModel.setState(this.baseRange, newState, tx, this.inputNumber);
                });
            };
            function action(id, label, targetState, checked) {
                const action = new actions_1.Action(id, label, undefined, true, () => {
                    update(targetState);
                });
                action.checked = checked;
                return action;
            }
            const both = state.includesInput1 && state.includesInput2;
            return [
                this.baseRange.input1Diffs.length > 0
                    ? action('mergeEditor.acceptInput1', (0, nls_1.localize)('mergeEditor.accept', 'Accept {0}', this.model.input1.title), state.toggle(1), state.includesInput1)
                    : undefined,
                this.baseRange.input2Diffs.length > 0
                    ? action('mergeEditor.acceptInput2', (0, nls_1.localize)('mergeEditor.accept', 'Accept {0}', this.model.input2.title), state.toggle(2), state.includesInput2)
                    : undefined,
                this.baseRange.isConflicting
                    ? (0, utils_1.setFields)(action('mergeEditor.acceptBoth', (0, nls_1.localize)('mergeEditor.acceptBoth', 'Accept Both'), state.withInputValue(1, !both).withInputValue(2, !both), both), { enabled: this.baseRange.canBeCombined })
                    : undefined,
                new actions_1.Separator(),
                this.baseRange.isConflicting
                    ? (0, utils_1.setFields)(action('mergeEditor.swap', (0, nls_1.localize)('mergeEditor.swap', 'Swap'), state.swap(), false), { enabled: !state.kind && (!both || this.baseRange.isOrderRelevant) })
                    : undefined,
                (0, utils_1.setFields)(new actions_1.Action('mergeEditor.markAsHandled', (0, nls_1.localize)('mergeEditor.markAsHandled', 'Mark as Handled'), undefined, true, () => {
                    (0, observable_1.transaction)((tx) => {
                        /** @description Context Menu: Mark as handled */
                        this.model.setHandled(this.baseRange, !handled, tx);
                    });
                }), { checked: handled }),
            ].filter(types_1.isDefined);
        }
    }
    exports.ModifiedBaseRangeGutterItemModel = ModifiedBaseRangeGutterItemModel;
    class MergeConflictGutterItemView extends lifecycle_1.Disposable {
        constructor(item, target, contextMenuService) {
            super();
            this.isMultiLine = (0, observable_1.observableValue)(this, false);
            this.item = (0, observable_1.observableValue)(this, item);
            const checkBox = new toggle_1.Toggle({
                isChecked: false,
                title: '',
                icon: codicons_1.Codicon.check,
                ...defaultStyles_1.defaultToggleStyles
            });
            checkBox.domNode.classList.add('accept-conflict-group');
            this._register((0, dom_1.addDisposableListener)(checkBox.domNode, dom_1.EventType.MOUSE_DOWN, (e) => {
                const item = this.item.get();
                if (!item) {
                    return;
                }
                if (e.button === /* Right */ 2) {
                    e.stopPropagation();
                    e.preventDefault();
                    contextMenuService.showContextMenu({
                        getAnchor: () => checkBox.domNode,
                        getActions: () => item.getContextMenuActions(),
                    });
                }
                else if (e.button === /* Middle */ 1) {
                    e.stopPropagation();
                    e.preventDefault();
                    item.toggleBothSides();
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description Update Checkbox */
                const item = this.item.read(reader);
                const value = item.toggleState.read(reader);
                const iconMap = {
                    [0 /* InputState.excluded */]: { icon: undefined, checked: false, title: (0, nls_1.localize)('accept.excluded', "Accept") },
                    [3 /* InputState.unrecognized */]: { icon: codicons_1.Codicon.circleFilled, checked: false, title: (0, nls_1.localize)('accept.conflicting', "Accept (result is dirty)") },
                    [1 /* InputState.first */]: { icon: codicons_1.Codicon.check, checked: true, title: (0, nls_1.localize)('accept.first', "Undo accept") },
                    [2 /* InputState.second */]: { icon: codicons_1.Codicon.checkAll, checked: true, title: (0, nls_1.localize)('accept.second', "Undo accept (currently second)") },
                };
                const state = iconMap[value];
                checkBox.setIcon(state.icon);
                checkBox.checked = state.checked;
                checkBox.setTitle(state.title);
                if (!item.enabled.read(reader)) {
                    checkBox.disable();
                }
                else {
                    checkBox.enable();
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description Update Checkbox CSS ClassNames */
                const state = this.item.read(reader).state.read(reader);
                const classNames = [
                    'merge-accept-gutter-marker',
                    state.handled && 'handled',
                    state.focused && 'focused',
                    this.isMultiLine.read(reader) ? 'multi-line' : 'single-line',
                ];
                target.className = classNames.filter(c => typeof c === 'string').join(' ');
            }));
            this._register(checkBox.onChange(() => {
                (0, observable_1.transaction)(tx => {
                    /** @description Handle Checkbox Change */
                    this.item.get().setState(checkBox.checked, tx);
                });
            }));
            target.appendChild((0, dom_1.h)('div.background', [strings_1.noBreakWhitespace]).root);
            target.appendChild(this.checkboxDiv = (0, dom_1.h)('div.checkbox', [(0, dom_1.h)('div.checkbox-background', [checkBox.domNode])]).root);
        }
        layout(top, height, viewTop, viewHeight) {
            const checkboxHeight = this.checkboxDiv.clientHeight;
            const middleHeight = height / 2 - checkboxHeight / 2;
            const margin = checkboxHeight;
            let effectiveCheckboxTop = top + middleHeight;
            const preferredViewPortRange = [
                margin,
                viewTop + viewHeight - margin - checkboxHeight
            ];
            const preferredParentRange = [
                top + margin,
                top + height - checkboxHeight - margin
            ];
            if (preferredParentRange[0] < preferredParentRange[1]) {
                effectiveCheckboxTop = (0, numbers_1.clamp)(effectiveCheckboxTop, preferredViewPortRange[0], preferredViewPortRange[1]);
                effectiveCheckboxTop = (0, numbers_1.clamp)(effectiveCheckboxTop, preferredParentRange[0], preferredParentRange[1]);
            }
            this.checkboxDiv.style.top = `${effectiveCheckboxTop - top}px`;
            (0, observable_1.transaction)((tx) => {
                /** @description MergeConflictGutterItemView: Update Is Multi Line */
                this.isMultiLine.set(height > 30, tx);
            });
        }
        update(baseRange) {
            (0, observable_1.transaction)(tx => {
                /** @description MergeConflictGutterItemView: Updating new base range */
                this.item.set(baseRange, tx);
            });
        }
    }
    exports.MergeConflictGutterItemView = MergeConflictGutterItemView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRDb2RlRWRpdG9yVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvdmlldy9lZGl0b3JzL2lucHV0Q29kZUVkaXRvclZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLCtCQUFjO1FBR3RELFlBQ2lCLFdBQWtCLEVBQ2xDLFNBQXdELEVBQ2pDLG9CQUEyQyxFQUM3QyxrQkFBdUMsRUFDckMsb0JBQTJDO1lBRWxFLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQU43QyxnQkFBVyxHQUFYLFdBQVcsQ0FBTztZQUhuQixxQkFBZ0IsR0FBRyxJQUFJLENBQUMsV0FBVyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFxRWpELHFDQUFnQyxHQUFHLElBQUEsd0JBQVcsRUFBQyxFQUFFLFNBQVMsRUFBRSxRQUFRLElBQUksQ0FBQyxXQUFXLG1DQUFtQyxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ3BKLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQUMsQ0FBQztnQkFDOUIsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztnQkFDOUIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztnQkFFckMsTUFBTSx5QkFBeUIsR0FBRyxTQUFTLENBQUMs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