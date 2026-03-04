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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollOverlay", "vs/css!./media/stickyScroll"], function (require, exports, event_1, lifecycle_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, terminalInstance_1, terminalStickyScrollOverlay_1) {
    "use strict";
    var TerminalStickyScrollContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalStickyScrollContribution = void 0;
    let TerminalStickyScrollContribution = class TerminalStickyScrollContribution extends lifecycle_1.Disposable {
        static { TerminalStickyScrollContribution_1 = this; }
        static { this.ID = 'terminal.stickyScroll'; }
        static get(instance) {
            return instance.getContribution(TerminalStickyScrollContribution_1.ID);
        }
        constructor(_instance, processManager, widgetManager, _configurationService, _contextKeyService, _instantiationService, _keybindingService) {
            super();
            this._instance = _instance;
            this._configurationService = _configurationService;
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this._overlay = this._register(new lifecycle_1.MutableDisposable());
            this._enableListeners = this._register(new lifecycle_1.MutableDisposable());
            this._disableListeners = this._register(new lifecycle_1.MutableDisposable());
            this._register(event_1.Event.runAndSubscribe(this._configurationService.onDidChangeConfiguration, e => {
                if (!e || e.affectsConfiguration("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */)) {
                    this._refreshState();
                }
            }));
        }
        xtermReady(xterm) {
            this._xterm = xterm;
            this._refreshState();
        }
        xtermOpen(xterm) {
            this._refreshState();
        }
        hideLock() {
            this._overlay.value?.lockHide();
        }
        hideUnlock() {
            this._overlay.value?.unlockHide();
        }
        _refreshState() {
            if (this._overlay.value) {
                this._tryDisable();
            }
            else {
                this._tryEnable();
            }
            if (this._overlay.value) {
                this._enableListeners.clear();
                if (!this._disableListeners.value) {
                    this._disableListeners.value = this._instance.capabilities.onDidRemoveCapability(e => {
                        if (e.id === 2 /* TerminalCapability.CommandDetection */) {
                            this._refreshState();
                        }
                    });
                }
            }
            else {
                this._disableListeners.clear();
                if (!this._enableListeners.value) {
                    this._enableListeners.value = this._instance.capabilities.onDidAddCapability(e => {
                        if (e.id === 2 /* TerminalCapability.CommandDetection */) {
                            this._refreshState();
                        }
                    });
                }
            }
        }
        _tryEnable() {
            if (this._shouldBeEnabled()) {
                const xtermCtorEventually = terminalInstance_1.TerminalInstance.getXtermConstructor(this._keybindingService, this._contextKeyService);
                this._overlay.value = this._instantiationService.createInstance(terminalStickyScrollOverlay_1.TerminalStickyScrollOverlay, this._instance, this._xterm, this._instantiationService.createInstance(terminalInstance_1.TerminalInstanceColorProvider, this._instance), this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */), xtermCtorEventually);
            }
        }
        _tryDisable() {
            if (!this._shouldBeEnabled()) {
                this._overlay.clear();
            }
        }
        _shouldBeEnabled() {
            const capability = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            return !!(this._configurationService.getValue("terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */) && capability && this._xterm?.raw?.element);
        }
    };
    exports.TerminalStickyScrollContribution = TerminalStickyScrollContribution;
    exports.TerminalStickyScrollContribution = TerminalStickyScrollContribution = TerminalStickyScrollContribution_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, keybinding_1.IKeybindingService)
    ], TerminalStickyScrollContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdGlja3lTY3JvbGxDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvc3RpY2t5U2Nyb2xsL2Jyb3dzZXIvdGVybWluYWxTdGlja3lTY3JvbGxDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtCekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTs7aUJBQy9DLE9BQUUsR0FBRyx1QkFBdUIsQUFBMUIsQ0FBMkI7UUFFN0MsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUEyQjtZQUNyQyxPQUFPLFFBQVEsQ0FBQyxlQUFlLENBQW1DLGtDQUFnQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hHLENBQUM7UUFTRCxZQUNrQixTQUE0QixFQUM3QyxjQUE4RCxFQUM5RCxhQUFvQyxFQUNiLHFCQUE2RCxFQUNoRSxrQkFBdUQsRUFDcEQscUJBQTZELEVBQ2hFLGtCQUF1RDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQVJTLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBR0wsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ25DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDL0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQVozRCxhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUErQixDQUFDLENBQUM7WUFFaEYscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUMzRCxzQkFBaUIsR0FBRyxJQUFJLENB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