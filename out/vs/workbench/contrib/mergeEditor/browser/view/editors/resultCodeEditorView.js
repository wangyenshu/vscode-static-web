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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/model", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/mergeEditor/browser/view/colors", "vs/workbench/contrib/mergeEditor/browser/view/editorGutter", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "./codeEditorView"], function (require, exports, dom_1, actionbar_1, iconLabels_1, arrays_1, errors_1, lifecycle_1, observable_1, model_1, nls_1, actions_1, configuration_1, contextkey_1, instantiation_1, label_1, lineRange_1, utils_1, colors_1, editorGutter_1, mergeEditor_1, codeEditorView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResultCodeEditorView = void 0;
    let ResultCodeEditorView = class ResultCodeEditorView extends codeEditorView_1.CodeEditorView {
        constructor(viewModel, instantiationService, _labelService, configurationService) {
            super(instantiationService, viewModel, configurationService);
            this._labelService = _labelService;
            this.decorations = (0, observable_1.derived)(this, reader => {
                const viewModel = this.viewModel.read(reader);
                if (!viewModel) {
                    return [];
                }
                const model = viewModel.model;
                const textModel = model.resultTextModel;
                const result = new Array();
                const baseRangeWithStoreAndTouchingDiffs = (0, utils_1.join)(model.modifiedBaseRanges.read(reader), model.baseResultDiffs.read(reader), (baseRange, diff) => baseRange.baseRange.touches(diff.inputRange)
                    ? arrays_1.CompareResult.neitherLessOrGreaterThan
                    : lineRange_1.LineRange.compareByStart(baseRange.baseRange, diff.inputRange));
                const activeModifiedBaseRange = viewModel.activeModifiedBaseRange.read(reader);
                const showNonConflictingChanges = viewModel.showNonConflictingChanges.read(reader);
                for (const m of baseRangeWithStoreAndTouchingDiffs) {
                    const modifiedBaseRange = m.left;
                    if (modifiedBaseRange) {
                        const blockClassNames = ['merge-editor-block'];
                        let blockPadding = [0, 0, 0, 0];
                        const isHandled = model.isHandled(modifiedBaseRange).read(reader);
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
                        blockClassNames.push('result');
                        if (!modifiedBaseRange.isConflicting && !showNonConflictingChanges && isHandled) {
                            continue;
                        }
                        const range = model.getLineRangeInResult(modifiedBaseRange.baseRange, reader);
                        result.push({
                            range: range.toInclusiveRangeOrEmpty(),
                            options: {
                                showIfCollapsed: true,
                                blockClassName: blockClassNames.join(' '),
                                blockPadding,
                                blockIsAfterEnd: range.startLineNumber > textModel.getLineCount(),
                                description: 'Result Diff',
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
                    }
                    if (!modifiedBaseRange || modifiedBaseRange.isConflicting) {
                        for (const diff of m.rights) {
                            const range = diff.outputRange.toInclusiveRange();
                            if (range) {
                                result.push({
                                    range,
                                    options: {
                                        className: `merge-editor-diff result`,
                                        description: 'Merge Editor',
                                        isWholeLine: true,
                                    }
                                });
                            }
                            if (diff.rangeMappings) {
                                for (const d of diff.rangeMappings) {
                                    result.push({
                                        range: d.outputRange,
                                        options: {
                                            className: `merge-editor-diff-word result`,
                                            description: 'Merge Editor'
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
                return result;
            });
            this.editor.invokeWithinContext(accessor => {
                const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
                const isMergeResultEditor = mergeEditor_1.ctxIsMergeResultEditor.bindTo(contextKeyService);
                isMergeResultEditor.set(true);
                this._register((0, lifecycle_1.toDisposable)(() => isMergeResultEditor.reset()));
            });
            this.htmlElements.gutterDiv.style.width = '5px';
            this.htmlElements.root.classList.add(`result`);
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description update checkboxes */
                if (this.checkboxesVisible.read(reader)) {
                    store.add(new editorGutter_1.EditorGutter(this.editor, this.htmlElements.gutterDiv, {
                        getIntersectingGutterItems: (range, reader) => [],
                        createView: (item, target) => { throw new errors_1.BugIndicatingError(); },
                    }));
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update labels & text model */
                const vm = this.viewModel.read(reader);
                if (!vm) {
                    return;
                }
                this.editor.setModel(vm.model.resultTextModel);
                (0, dom_1.reset)(this.htmlElements.title, ...(0, iconLabels_1.renderLabelWithIcons)((0, nls_1.localize)('result', 'Result')));
                (0, dom_1.reset)(this.htmlElements.description, ...(0, iconLabels_1.renderLabelWithIcons)(this._labelService.getUriLabel(vm.model.resultTextModel.uri, { relative: true })));
            }));
            const remainingConflictsActionBar = this._register(new actionbar_1.ActionBar(this.htmlElements.detail));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update remainingConflicts label */
                const vm = this.viewModel.read(reader);
                if (!vm) {
                    return;
                }
                const model = vm.model;
                if (!model) {
                    return;
                }
                const count = model.unhandledConflictsCount.read(reader);
                const text = count === 1
                    ? (0, nls_1.localize)('mergeEditor.remainingConflicts', '{0} Conflict Remaining', count)
                    : (0, nls_1.localize)('mergeEditor.remainingConflict', '{0} Conflicts Remaining ', count);
                remainingConflictsActionBar.clear();
                remainingConflictsActionBar.push({
                    class: undefined,
                    enabled: count > 0,
                    id: 'nextConflict',
                    label: text,
                    run() {
                        vm.model.telemetry.reportConflictCounterClicked();
                        vm.goToNextModifiedBaseRange(m => !model.isHandled(m).get());
                    },
                    tooltip: count > 0
                        ? (0, nls_1.localize)('goToNextConflict', 'Go to next conflict')
                        : (0, nls_1.localize)('allConflictHandled', 'All conflicts handled, the merge can be completed now.'),
                });
            }));
            this._register((0, utils_1.applyObservableDecorations)(this.editor, this.decorations));
            this._register((0, codeEditorView_1.createSelectionsAutorun)(this, (baseRange, viewModel) => viewModel.model.translateBaseRangeToResult(baseRange)));
            this._register(instantiationService.createInstance(codeEditorView_1.TitleMenu, actions_1.MenuId.MergeInputResultToolbar, this.htmlElements.toolbar));
        }
    };
    exports.ResultCodeEditorView = ResultCodeEditorView;
    exports.ResultCodeEditorView = ResultCodeEditorView = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, label_1.ILabelService),
        __param(3, configuration_1.IConfigurationService)
    ], ResultCodeEditorView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdWx0Q29kZUVkaXRvclZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvZWRpdG9ycy9yZXN1bHRDb2RlRWRpdG9yVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsK0JBQWM7UUFDdkQsWUFDQyxTQUF3RCxFQUNqQyxvQkFBMkMsRUFDbkQsYUFBNkMsRUFDckMsb0JBQTJDO1lBRWxFLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUg3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQW9HNUMsZ0JBQVcsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNyRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNoQixPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO2dCQUNELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7Z0JBQzlCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7Z0JBQ3hDLE1BQU0sTUFBTSxHQUFHLElBQUksS0FBSyxFQUF5QixDQUFDO2dCQUVsRCxNQUFNLGtDQUFrQyxHQUFHLElBQUEsWUFBSSxFQUM5QyxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUNyQyxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDbEMs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