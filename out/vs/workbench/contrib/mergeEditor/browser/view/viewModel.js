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
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/range", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, arraysFind_1, lifecycle_1, observable_1, range_1, nls_1, configuration_1, notification_1, lineRange_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorViewModel = void 0;
    let MergeEditorViewModel = class MergeEditorViewModel extends lifecycle_1.Disposable {
        constructor(model, inputCodeEditorView1, inputCodeEditorView2, resultCodeEditorView, baseCodeEditorView, showNonConflictingChanges, configurationService, notificationService) {
            super();
            this.model = model;
            this.inputCodeEditorView1 = inputCodeEditorView1;
            this.inputCodeEditorView2 = inputCodeEditorView2;
            this.resultCodeEditorView = resultCodeEditorView;
            this.baseCodeEditorView = baseCodeEditorView;
            this.showNonConflictingChanges = showNonConflictingChanges;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.manuallySetActiveModifiedBaseRange = (0, observable_1.observableValue)(this, { range: undefined, counter: 0 });
            this.attachedHistory = this._register(new AttachedHistory(this.model.resultTextModel));
            this.shouldUseAppendInsteadOfAccept = (0, utils_1.observableConfigValue)('mergeEditor.shouldUseAppendInsteadOfAccept', false, this.configurationService);
            this.counter = 0;
            this.lastFocusedEditor = (0, observable_1.derivedObservableWithWritableCache)(this, (reader, lastValue) => {
                const editors = [
                    this.inputCodeEditorView1,
                    this.inputCodeEditorView2,
                    this.resultCodeEditorView,
                    this.baseCodeEditorView.read(reader),
                ];
                const view = editors.find((e) => e && e.isFocused.read(reader));
                return view ? { view, counter: this.counter++ } : lastValue || { view: undefined, counter: this.counter++ };
            });
            this.baseShowDiffAgainst = (0, observable_1.derived)(this, reader => {
                const lastFocusedEditor = this.lastFocusedEditor.read(reader);
                if (lastFocusedEditor.view === this.inputCodeEditorView1) {
                    return 1;
                }
                else if (lastFocusedEditor.view === this.inputCodeEditorView2) {
                    return 2;
                }
                return undefined;
            });
            this.selectionInBase = (0, observable_1.derived)(this, reader => {
                const sourceEditor = this.lastFocusedEditor.read(reader).view;
                if (!sourceEditor) {
                    return undefined;
                }
                const selections = sourceEditor.selection.read(reader) || [];
                const rangesInBase = selections.map((selection) => {
                    if (sourceEditor === this.inputCodeEditorView1) {
                        return this.model.translateInputRangeToBase(1, selection);
                    }
                    else if (sourceEditor === this.inputCodeEditorView2) {
                        return this.model.translateInputRangeToBase(2, selection);
                    }
                    else if (sourceEditor === this.resultCodeEditorView) {
                        return this.model.translateResultRangeToBase(selection);
                    }
                    else if (sourceEditor === this.baseCodeEditorView.read(reader)) {
                        return selection;
                    }
                    else {
                        return selection;
                    }
                });
                return {
                    rangesInBase,
                    sourceEditor
                };
            });
            this.activeModifiedBaseRange = (0, observable_1.derived)(this, (reader) => {
                /** @description activeModifiedBaseRange */
                const focusedEditor = this.lastFocusedEditor.read(reader);
                const manualRange = this.manuallySetActiveModifiedBaseRange.read(reader);
                if (manualRange.counter > focusedEditor.counter) {
                    return manualRange.range;
                }
                if (!focusedEditor.view) {
                    return;
                }
                const cursorLineNumber = focusedEditor.view.cursorLineNumber.read(reader);
                if (!cursorLineNumber) {
                    return undefined;
                }
                const modifiedBaseRanges = this.model.modifiedBaseRanges.read(reader);
                return modifiedBaseRanges.find((r) => {
                    const range = this.getRangeOfModifiedBaseRange(focusedEditor.view, r, reader);
                    return range.isEmpty
                        ? range.startLineNumber === cursorLineNumber
                        : range.contains(cursorLineNumber);
                });
            });
            this._register(resultCodeEditorView.editor.onDidChangeModelContent(e => {
                if (this.model.isApplyingEditInResult || e.isRedoing || e.isUndoing) {
                    return;
                }
                const baseRangeStates = [];
                for (const change of e.changes) {
                    const rangeInBase = this.model.translateResultRangeToBase(range_1.Range.lift(change.range));
                    const baseRanges = this.model.findModifiedBaseRangesInRange(new lineRange_1.LineRange(rangeInBase.startLineNumber, rangeInBase.endLineNumber - rangeInBase.startLineNumber));
                    if (baseRanges.length === 1) {
                        const isHandled = this.model.isHandled(baseRanges[0]).get();
                        if (!isHandled) {
                            baseRangeStates.push(baseRanges[0]);
                        }
                    }
                }
                if (baseRangeStates.length === 0) {
                    return;
                }
                const element = {
                    model: this.model,
                    redo() {
                        (0, observable_1.transaction)(tx => {
                            /** @description Mark conflicts touched by manual edits as handled */
                            for (const r of baseRangeStates) {
                                this.model.setHandled(r, true, tx);
                            }
                        });
                    },
                    undo() {
                        (0, observable_1.transaction)(tx => {
                            /** @description Mark conflicts touched by manual edits as handled */
                            for (const r of baseRangeStates) {
                                this.model.setHandled(r, false, tx);
                            }
                        });
                    },
                };
                this.attachedHistory.pushAttachedHistoryElement(element);
                element.redo();
            }));
        }
        getRangeOfModifiedBaseRange(editor, modifiedBaseRange, reader) {
            if (editor === this.resultCodeEditorView) {
                return this.model.getLineRangeInResult(modifiedBaseRange.baseRange, reader);
            }
            else if (editor === this.baseCodeEditorView.get()) {
                return modifiedBaseRange.baseRange;
            }
            else {
                const input = editor === this.inputCodeEditorView1 ? 1 : 2;
                return modifiedBaseRange.getInputRange(input);
            }
        }
        setActiveModifiedBaseRange(range, tx) {
            this.manuallySetActiveModifiedBaseRange.set({ range, counter: this.counter++ }, tx);
        }
        setState(baseRange, state, tx, inputNumber) {
            this.manuallySetActiveModifiedBaseRange.set({ range: baseRange, counter: this.counter++ }, tx);
            this.model.setState(baseRange, state, inputNumber, tx);
        }
        goToConflict(getModifiedBaseRange) {
            let editor = this.lastFocusedEditor.get().view;
            if (!editor) {
                editor = this.resultCodeEditorView;
            }
            const curLineNumber = editor.editor.getPosition()?.lineNumber;
            if (curLineNumber === undefined) {
                return;
            }
            const modifiedBaseRange = getModifiedBaseRange(editor, curLineNumber);
            if (modifiedBaseRange) {
                const range = this.getRangeOfModifiedBaseRange(editor, modifiedBaseRange, undefined);
                editor.editor.focus();
                let startLineNumber = range.startLineNumber;
                let endLineNumberExclusive = range.endLineNumberExclusive;
                if (range.startLineNumber > editor.editor.getModel().getLineCount()) {
                    (0, observable_1.transaction)(tx => {
                        this.setActiveModifiedBaseRange(modifiedBaseRange, tx);
                    });
                    startLineNumber = endLineNumberExclusive = editor.editor.getModel().getLineCount();
                }
                editor.editor.setPosition({
                    lineNumber: startLineNumber,
                    column: editor.editor.getModel().getLineFirstNonWhitespaceColumn(startLineNumber),
                });
                editor.editor.revealLinesNearTop(startLineNumber, endLineNumberExclusive, 0 /* ScrollType.Smooth */);
            }
        }
        goToNextModifiedBaseRange(predicate) {
            this.goToConflict((e, l) => this.model.modifiedBaseRanges
                .get()
                .find((r) => predicate(r) &&
                this.getRangeOfModifiedBaseRange(e, r, undefined).startLineNumber > l) ||
                this.model.modifiedBaseRanges
                    .get()
                    .find((r) => predicate(r)));
        }
        goToPreviousModifiedBaseRange(predicate) {
            this.goToConflict((e, l) => (0, arraysFind_1.findLast)(this.model.modifiedBaseRanges.get(), (r) => predicate(r) &&
                this.getRangeOfModifiedBaseRange(e, r, undefined).endLineNumberExclusive < l) ||
                (0, arraysFind_1.findLast)(this.model.modifiedBaseRanges.get(), (r) => predicate(r)));
        }
        toggleActiveConflict(inputNumber) {
            const activeModifiedBaseRange = this.activeModifiedBaseRange.get();
            if (!activeModifiedBaseRange) {
                this.notificationService.error((0, nls_1.localize)('noConflictMessage', "There is currently no conflict focused that can be toggled."));
                return;
            }
            (0, observable_1.transaction)(tx => {
                /** @description Toggle Active Conflict */
                this.setState(activeModifiedBaseRange, this.model.getState(activeModifiedBaseRange).get().toggle(inputNumber), tx, inputNumber);
            });
        }
        acceptAll(inputNumber) {
            (0, observable_1.transaction)(tx => {
                /** @description Toggle Active Conflict */
                for (const range of this.model.modifiedBaseRanges.get()) {
                    this.setState(range, this.model.getState(range).get().withInputValue(inputNumber, true), tx, inputNumber);
                }
            });
        }
    };
    exports.MergeEditorViewModel = MergeEditorViewModel;
    exports.MergeEditorViewModel = MergeEditorViewModel = __decorate([
        __param(6, configuration_1.IConfigurationService),
        __param(7, notification_1.INotificationService)
    ], MergeEditorViewModel);
    class AttachedHistory extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this.attachedHistory = [];
            this.previousAltId = this.model.getAlternativeVersionId();
            this._register(model.onDidChangeContent((e) => {
                const currentAltId = model.getAlternativeVersionId();
                if (e.isRedoing) {
                    for (const item of this.attachedHistory) {
                        if (this.previousAltId < item.altId && item.altId <= currentAltId) {
                            item.element.redo();
                        }
                    }
                }
                else if (e.isUndoing) {
                    for (let i = this.attachedHistory.length - 1; i >= 0; i--) {
                        const item = this.attachedHistory[i];
                        if (currentAltId < item.altId && item.altId <= this.previousAltId) {
                            item.element.undo();
                        }
                    }
                }
                else {
                    // The user destroyed the redo stack by performing a non redo/undo operation.
                    // Thus we also need to remove all history elements after the last version id.
                    while (this.attachedHistory.length > 0
                        && this.attachedHistory[this.attachedHistory.length - 1].altId > this.previousAltId) {
                        this.attachedHistory.pop();
                    }
                }
                this.previousAltId = currentAltId;
            }));
        }
        /**
         * Pushes an history item that is tied to the last text edit (or an extension of it).
         * When the last text edit is undone/redone, so is is this history item.
         */
        pushAttachedHistoryElement(element) {
            this.attachedHistory.push({ altId: this.model.getAlternativeVersionId(), element });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci92aWV3L3ZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFPbkQsWUFDaUIsS0FBdUIsRUFDdkIsb0JBQXlDLEVBQ3pDLG9CQUF5QyxFQUN6QyxvQkFBMEMsRUFDMUMsa0JBQStELEVBQy9ELHlCQUErQyxFQUN4QyxvQkFBNEQsRUFDN0QsbUJBQTBEO1lBRWhGLEtBQUssRUFBRSxDQUFDO1lBVFEsVUFBSyxHQUFMLEtBQUssQ0FBa0I7WUFDdkIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFxQjtZQUN6Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXFCO1lBQ3pDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDMUMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE2QztZQUMvRCw4QkFBeUIsR0FBekIseUJBQXlCLENBQXNCO1lBQ3ZCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDNUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQWRoRSx1Q0FBa0MsR0FBRyxJQUFBLDRCQUFlLEVBRW5FLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFekIsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQTREbkYsbUNBQThCLEdBQUcsSUFBQSw2QkFBcUIsRUFDckUsNENBQTRDLEVB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