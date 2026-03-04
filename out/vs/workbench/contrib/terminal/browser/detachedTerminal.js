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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/symbols", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/browser/widgets/widgetManager"], function (require, exports, dom, async_1, errors_1, lifecycle_1, symbols_1, instantiation_1, terminalCapabilityStore_1, terminalExtensions_1, widgetManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DetachedProcessInfo = exports.DetachedTerminal = void 0;
    let DetachedTerminal = class DetachedTerminal extends lifecycle_1.Disposable {
        get xterm() {
            return this._xterm;
        }
        constructor(_xterm, options, instantiationService) {
            super();
            this._xterm = _xterm;
            this._widgets = this._register(new widgetManager_1.TerminalWidgetManager());
            this.capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
            this._contributions = new Map();
            this._register(_xterm);
            // Initialize contributions
            const contributionDescs = terminalExtensions_1.TerminalExtensionsRegistry.getTerminalContributions();
            for (const desc of contributionDescs) {
                if (this._contributions.has(desc.id)) {
                    (0, errors_1.onUnexpectedError)(new Error(`Cannot have two terminal contributions with the same id ${desc.id}`));
                    continue;
                }
                if (desc.canRunInDetachedTerminals === false) {
                    continue;
                }
                let contribution;
                try {
                    contribution = instantiationService.createInstance(desc.ctor, this, options.processInfo, this._widgets);
                    this._contributions.set(desc.id, contribution);
                    this._register(contribution);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            // xterm is already by the time DetachedTerminal is created, so trigger everything
            // on the next microtask, allowing the caller to do any extra initialization
            this._register(new async_1.Delayer(symbols_1.MicrotaskDelay)).trigger(() => {
                for (const contr of this._contributions.values()) {
                    contr.xtermReady?.(this._xterm);
                }
            });
        }
        get selection() {
            return this._xterm && this.hasSelection() ? this._xterm.raw.getSelection() : undefined;
        }
        hasSelection() {
            return this._xterm.hasSelection();
        }
        clearSelection() {
            this._xterm.clearSelection();
        }
        focus(force) {
            if (force || !dom.getActiveWindow().getSelection()?.toString()) {
                this.xterm.focus();
            }
        }
        attachToElement(container, options) {
            this.domElement = container;
            const screenElement = this._xterm.attachToElement(container, options);
            this._widgets.attachToElement(screenElement);
        }
        forceScrollbarVisibility() {
            this.domElement?.classList.add('force-scrollbar');
        }
        resetScrollbarVisibility() {
            this.domElement?.classList.remove('force-scrollbar');
        }
        getContribution(id) {
            return this._contributions.get(id);
        }
    };
    exports.DetachedTerminal = DetachedTerminal;
    exports.DetachedTerminal = DetachedTerminal = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], DetachedTerminal);
    /**
     * Implements {@link ITerminalProcessInfo} for a detached terminal where most
     * properties are stubbed. Properties are mutable and can be updated by
     * the instantiator.
     */
    class DetachedProcessInfo {
        constructor(initialValues) {
            this.processState = 3 /* ProcessState.Running */;
            this.ptyProcessReady = Promise.resolve();
            this.initialCwd = '';
            this.shouldPersist = false;
            this.hasWrittenData = false;
            this.hasChildProcesses = false;
            this.capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
            this.shellIntegrationNonce = '';
            Object.assign(this, initialValues);
        }
    }
    exports.DetachedProcessInfo = DetachedProcessInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV0YWNoZWRUZXJtaW5hbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvZGV0YWNoZWRUZXJtaW5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7UUFPL0MsSUFBVyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxZQUNrQixNQUFxQixFQUN0QyxPQUE4QixFQUNQLG9CQUEyQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUpTLFdBQU0sR0FBTixNQUFNLENBQWU7WUFYdEIsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQ0FBcUIsRUFBRSxDQUFDLENBQUM7WUFDeEQsaUJBQVksR0FBRyxJQUFJLGlEQUF1QixFQUFFLENBQUM7WUFDNUMsbUJBQWMsR0FBdUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQWMvRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXZCLDJCQUEyQjtZQUMzQixNQUFNLGlCQUFpQixHQUFHLCtDQUEwQixDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDaEYsS0FBSyxNQUFNLElBQUksSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUN0QyxJQUFBLDBCQUFpQixFQUFDLElBQUksS0FBSyxDQUFDLDJEQUEyRCxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNuRyxTQUFTO2dCQUNWLENBQUM7Z0JB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