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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/debug/browser/breakpointEditorContribution", "vs/workbench/contrib/debug/browser/callStackEditorContribution", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, async_1, lifecycle_1, range_1, configuration_1, breakpointEditorContribution_1, callStackEditorContribution_1, debug_1, notebookBrowser_1, notebookEditorExtensions_1, notebookEditorWidget_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookBreakpointDecorations = exports.PausedCellDecorationContribution = void 0;
    let PausedCellDecorationContribution = class PausedCellDecorationContribution extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.debug.pausedCellDecorations'; }
        constructor(_notebookEditor, _debugService, _notebookExecutionStateService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._debugService = _debugService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._currentTopDecorations = [];
            this._currentOtherDecorations = [];
            this._executingCellDecorations = [];
            const delayer = this._register(new async_1.Delayer(200));
            this._register(_debugService.getModel().onDidChangeCallStack(() => this.updateExecutionDecorations()));
            this._register(_debugService.getViewModel().onDidFocusStackFrame(() => this.updateExecutionDecorations()));
            this._register(_notebookExecutionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && this._notebookEditor.textModel && e.affectsNotebook(this._notebookEditor.textModel.uri)) {
                    delayer.trigger(() => this.updateExecutionDecorations());
                }
            }));
        }
        updateExecutionDecorations() {
            const exes = this._notebookEditor.textModel ?
                this._notebookExecutionStateService.getCellExecutionsByHandleForNotebook(this._notebookEditor.textModel.uri)
                : undefined;
            const topFrameCellsAndRanges = [];
            let focusedFrameCellAndRange = undefined;
            const getNotebookCellAndRange = (sf) => {
                const parsed = notebookCommon_1.CellUri.parse(sf.source.uri);
                if (parsed && parsed.notebook.toString() === this._notebookEditor.textModel?.uri.toString()) {
                    return { handle: parsed.handle, range: sf.range };
                }
                return undefined;
            };
            for (const session of this._debugService.getModel().getSessions()) {
                for (const thread of session.getAllThreads()) {
                    const topFrame = thread.getTopStackFrame();
                    if (topFrame) {
                        const notebookCellAndRange = getNotebookCellAndRange(topFrame);
                        if (notebookCellAndRange) {
                            topFrameCellsAndRanges.push(notebookCellAndRange);
                            exes?.delete(notebookCellAndRange.handle);
                        }
                    }
                }
            }
            const focusedFrame = this._debugService.getViewModel().focusedStackFrame;
            if (focusedFrame && focusedFrame.thread.stopped) {
                const thisFocusedFrameCellAndRange = getNotebookCellAndRange(focusedFrame);
                if (thisFocusedFrameCellAndRange &&
                    !topFrameCellsAndRanges.some(topFrame => topFrame.handle === thisFocusedFrameCellAndRange?.handle && range_1.Range.equalsRange(topFrame.range, thisFocusedFrameCellAndRange?.range))) {
                    focusedFrameCellAndRange = thisFocusedFrameCellAndRange;
                    exes?.delete(focusedFrameCellAndRange.handle);
                }
            }
            this.setTopFrameDecoration(topFrameCellsAndRanges);
            this.setFocusedFrameDecoration(focusedFrameCellAndRange);
            const exeHandles = exes ?
                Array.from(exes.entries())
                    .filter(([_, exe]) => exe.state === notebookCommon_1.NotebookCellExecutionState.Executing)
                    .map(([handle]) => handle)
                : [];
            this.setExecutingCellDecorations(exeHandles);
        }
        setTopFrameDecoration(handlesAndRanges) {
            const newDecorations = handlesAndRanges.map(({ handle, range }) => {
                const options = {
                    overviewRuler: {
                        color: callStackEditorContribution_1.topStackFrameColor,
                        includeOutput: false,
                        modelRanges: [range],
                        position: notebookBrowser_1.NotebookOverviewRulerLane.Full
                    }
                };
                return { handle, options };
            });
            this._currentTopDecorations = this._notebookEditor.deltaCellDecorations(this._currentTopDecorations, newDecorations);
        }
        setFocusedFrameDecoration(focusedFrameCellAndRange) {
            let newDecorations = [];
            if (focusedFrameCellAndRange) {
                const options = {
                    overviewRuler: {
                        color: callStackEditorContribution_1.focusedStackFrameColor,
                        includeOutput: false,
                        modelRanges: [focusedFrameCellAndRange.range],
                        position: notebookBrowser_1.NotebookOverviewRulerLane.Full
                    }
                };
                newDecorations = [{ handle: focusedFrameCellAndRange.handle, options }];
            }
            this._currentOtherDecorations = this._notebookEditor.deltaCellDecorations(this._currentOtherDecorations, newDecorations);
        }
        setExecutingCellDecorations(handles) {
            const newDecorations = handles.map(handle => {
                const options = {
                    overviewRuler: {
                        color: notebookEditorWidget_1.runningCellRulerDecorationColor,
                        includeOutput: false,
                        modelRanges: [new range_1.Range(0, 0, 0, 0)],
                        position: notebookBrowser_1.NotebookOverviewRulerLane.Left
                    }
                };
                return { handle, options };
            });
            this._executingCellDecorations = this._notebookEditor.deltaCellDecorations(this._executingCellDecorations, newDecorations);
        }
    };
    exports.PausedCellDecorationContribution = PausedCellDecorationContribution;
    exports.PausedCellDecorationContribution = PausedCellDecorationContribution = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], PausedCellDecorationContribution);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(PausedCellDecorationContribution.id, PausedCellDecorationContribution);
    let NotebookBreakpointDecorations = class NotebookBreakpointDecorations extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.debug.notebookBreakpointDecorations'; }
        constructor(_notebookEditor, _debugService, _configService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._debugService = _debugService;
            this._configService = _configService;
            this._currentDecorations = [];
            this._register(_debugService.getModel().onDidChangeBreakpoints(() => this.updateDecorations()));
            this._register(_configService.onDidChangeConfiguration(e => e.affectsConfiguration('debug.showBreakpointsInOverviewRuler') && this.updateDecorations()));
        }
        updateDecorations() {
            const enabled = this._configService.getValue('debug.showBreakpointsInOverviewRuler');
            const newDecorations = enabled ?
                this._debugService.getModel().getBreakpoints().map(breakpoint => {
                    const parsed = notebookCommon_1.CellUri.parse(breakpoint.uri);
                    if (!parsed || parsed.notebook.toString() !== this._notebookEditor.textModel.uri.toString()) {
                        return null;
                    }
                    const options = {
                        overviewRuler: {
                            color: breakpointEditorContribution_1.debugIconBreakpointForeground,
                            includeOutput: false,
                            modelRanges: [new range_1.Range(breakpoint.lineNumber, 0, breakpoint.lineNumber, 0)],
                            position: notebookBrowser_1.NotebookOverviewRulerLane.Left
                        }
                    };
                    return { handle: parsed.handle, options };
                }).filter(x => !!x)
                : [];
            this._currentDecorations = this._notebookEditor.deltaCellDecorations(this._currentDecorations, newDecorations);
        }
    };
    exports.NotebookBreakpointDecorations = NotebookBreakpointDecorations;
    exports.NotebookBreakpointDecorations = NotebookBreakpointDecorations = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, configuration_1.IConfigurationService)
    ], NotebookBreakpointDecorations);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(NotebookBreakpointDecorations.id, NotebookBreakpointDecorations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEZWJ1Z0RlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2RlYnVnL25vdGVib29rRGVidWdEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7aUJBQ3hELE9BQUUsR0FBVyxnREFBZ0QsQUFBM0QsQ0FBNEQ7UUFNckUsWUFDa0IsZUFBZ0MsRUFDbEMsYUFBNkMsRUFDNUIsOEJBQStFO1lBRS9HLEtBQUssRUFBRSxDQUFDO1lBSlMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ2pCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ1gsbUNBQThCLEdBQTlCLDhCQUE4QixDQUFnQztZQVB4RywyQkFBc0IsR0FBYSxFQUFFLENBQUM7WUFDdEMsNkJBQXdCLEdBQWEsRUFBRSxDQUFDO1lBQ3hDLDhCQUF5QixHQUFhLEVBQUUsQ0FBQztZQVNoRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRyxJ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