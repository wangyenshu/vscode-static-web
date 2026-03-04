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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/search/browser/searchActionsFind", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminalContrib/find/browser/terminalFindWidget"], function (require, exports, lazy_1, lifecycle_1, nls_1, contextkey_1, instantiation_1, searchActionsFind_1, terminal_1, terminalActions_1, terminalExtensions_1, terminalContextKey_1, terminalFindWidget_1) {
    "use strict";
    var TerminalFindContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalFindContribution = class TerminalFindContribution extends lifecycle_1.Disposable {
        static { TerminalFindContribution_1 = this; }
        static { this.ID = 'terminal.find'; }
        static get(instance) {
            return instance.getContribution(TerminalFindContribution_1.ID);
        }
        get findWidget() { return this._findWidget.value; }
        constructor(_instance, processManager, widgetManager, instantiationService, terminalService) {
            super();
            this._instance = _instance;
            this._findWidget = new lazy_1.Lazy(() => {
                const findWidget = instantiationService.createInstance(terminalFindWidget_1.TerminalFindWidget, this._instance);
                // Track focus and set state so we can force the scroll bar to be visible
                findWidget.focusTracker.onDidFocus(() => {
                    TerminalFindContribution_1.activeFindWidget = this;
                    this._instance.forceScrollbarVisibility();
                    if (!(0, terminal_1.isDetachedTerminalInstance)(this._instance)) {
                        terminalService.setActiveInstance(this._instance);
                    }
                });
                findWidget.focusTracker.onDidBlur(() => {
                    TerminalFindContribution_1.activeFindWidget = undefined;
                    this._instance.resetScrollbarVisibility();
                });
                if (!this._instance.domElement) {
                    throw new Error('FindWidget expected terminal DOM to be initialized');
                }
                this._instance.domElement?.appendChild(findWidget.getDomNode());
                if (this._lastLayoutDimensions) {
                    findWidget.layout(this._lastLayoutDimensions.width);
                }
                return findWidget;
            });
        }
        layout(_xterm, dimension) {
            this._lastLayoutDimensions = dimension;
            this._findWidget.rawValue?.layout(dimension.width);
        }
        xtermReady(xterm) {
            this._register(xterm.onDidChangeFindResults(() => this._findWidget.rawValue?.updateResultCount()));
        }
        dispose() {
            if (TerminalFindContribution_1.activeFindWidget === this) {
                TerminalFindContribution_1.activeFindWidget = undefined;
            }
            super.dispose();
            this._findWidget.rawValue?.dispose();
        }
    };
    TerminalFindContribution = TerminalFindContribution_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, terminal_1.ITerminalService)
    ], TerminalFindContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalFindContribution.ID, TerminalFindContribution, true);
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.focusFind" /* TerminalCommandId.FindFocus */,
        title: (0, nls_1.localize2)('workbench.action.terminal.focusFind', 'Focus Find'),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
            when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.findFocus, terminalContextKey_1.TerminalContextKeys.focusInAny),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            contr?.findWidget.reveal();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.hideFind" /* TerminalCommandId.FindHide */,
        title: (0, nls_1.localize2)('workbench.action.terminal.hideFind', 'Hide Find'),
        keybinding: {
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findVisible),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            contr?.findWidget.hide();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.toggleFindRegex" /* TerminalCommandId.ToggleFindRegex */,
        title: (0, nls_1.localize2)('workbench.action.terminal.toggleFindRegex', 'Toggle Find Using Regex'),
        keybinding: {
            primary: 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */ },
            when: terminalContextKey_1.TerminalContextKeys.findVisible,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const state = contr?.findWidget.state;
            state?.change({ isRegex: !state.isRegex }, false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.toggleFindWholeWord" /* TerminalCommandId.ToggleFindWholeWord */,
        title: (0, nls_1.localize2)('workbench.action.terminal.toggleFindWholeWord', 'Toggle Find Using Whole Word'),
        keybinding: {
            primary: 512 /* KeyMod.Alt */ | 53 /* KeyCode.KeyW */,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 53 /* KeyCode.KeyW */ },
            when: terminalContextKey_1.TerminalContextKeys.findVisible,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const state = contr?.findWidget.state;
            state?.change({ wholeWord: !state.wholeWord }, false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.toggleFindCaseSensitive" /* TerminalCommandId.ToggleFindCaseSensitive */,
        title: (0, nls_1.localize2)('workbench.action.terminal.toggleFindCaseSensitive', 'Toggle Find Using Case Sensitive'),
        keybinding: {
            primary: 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */ },
            when: terminalContextKey_1.TerminalContextKeys.findVisible,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const state = contr?.findWidget.state;
            state?.change({ matchCase: !state.matchCase }, false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.findNext" /* TerminalCommandId.FindNext */,
        title: (0, nls_1.localize2)('workbench.action.terminal.findNext', 'Find Next'),
        keybinding: [
            {
                primary: 61 /* KeyCode.F3 */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, secondary: [61 /* KeyCode.F3 */] },
                when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findFocus),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            {
                primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                when: terminalContextKey_1.TerminalContextKeys.findInputFocus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            }
        ],
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const widget = contr?.findWidget;
            if (widget) {
                widget.show();
                widget.find(false);
            }
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.findPrevious" /* TerminalCommandId.FindPrevious */,
        title: (0, nls_1.localize2)('workbench.action.terminal.findPrevious', 'Find Previous'),
        keybinding: [
            {
                primary: 1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */, secondary: [1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */] },
                when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findFocus),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            {
                primary: 3 /* KeyCode.Enter */,
                when: terminalContextKey_1.TerminalContextKeys.findInputFocus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            }
        ],
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const widget = contr?.findWidget;
            if (widget) {
                widget.show();
                widget.find(true);
            }
        }
    });
    // Global workspace file search
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.searchWorkspace" /* TerminalCommandId.SearchWorkspace */,
        title: (0, nls_1.localize2)('workbench.action.terminal.searchWorkspace', 'Search Workspace'),
        keybinding: [
            {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 36 /* KeyCode.KeyF */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.textSelected),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50
            }
        ],
        run: (activeInstance, c, accessor) => (0, searchActionsFind_1.findInFilesCommand)(accessor, { query: activeInstance.selection })
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuZmluZC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvZmluZC9icm93c2VyL3Rlcm1pbmFsLmZpbmQuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CaEcsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTs7aUJBQ2hDLE9BQUUsR0FBRyxlQUFlLEFBQWxCLENBQW1CO1FBUXJDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBdUQ7WUFDakUsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUEyQiwwQkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBS0QsSUFBSSxVQUFVLEtBQXlCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXZFLFlBQ2tCLFNBQXdELEVBQ3pFLGNBQThELEVBQzlELGFBQW9DLEVBQ2Isb0JBQTJDLEVBQ2hELGVBQWlDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBTlMsY0FBUyxHQUFULFNBQVMsQ0FBK0M7WUFRekUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ2hDLE1BQU0sVUFBVSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1Q0FBa0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRTNGLHlFQUF5RTtnQkFDekUsVUFBVSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUN2QywwQkFBd0IsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7b0JBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsd0JB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