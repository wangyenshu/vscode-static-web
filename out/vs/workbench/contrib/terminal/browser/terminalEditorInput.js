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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/dialogs/common/dialogs", "vs/base/common/event"], function (require, exports, nls_1, severity_1, lifecycle_1, themeService_1, themables_1, editorInput_1, terminal_1, terminalIcon_1, instantiation_1, terminal_2, lifecycle_2, contextkey_1, configuration_1, terminalContextKey_1, dialogs_1, event_1) {
    "use strict";
    var TerminalEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditorInput = void 0;
    let TerminalEditorInput = class TerminalEditorInput extends editorInput_1.EditorInput {
        static { TerminalEditorInput_1 = this; }
        static { this.ID = 'workbench.editors.terminal'; }
        setGroup(group) {
            this._group = group;
            if (group?.scopedContextKeyService) {
                this._terminalInstance?.setParentContextKeyService(group.scopedContextKeyService);
            }
        }
        get group() {
            return this._group;
        }
        get typeId() {
            return TerminalEditorInput_1.ID;
        }
        get editorId() {
            return terminal_1.terminalEditorId;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */ | 128 /* EditorInputCapabilities.CanDropIntoEditor */ | 64 /* EditorInputCapabilities.ForceDescription */;
        }
        setTerminalInstance(instance) {
            if (this._terminalInstance) {
                throw new Error('cannot set instance that has already been set');
            }
            this._terminalInstance = instance;
            this._setupInstanceListeners();
        }
        copy() {
            const instance = this._terminalInstanceService.createInstance(this._copyLaunchConfig || {}, terminal_2.TerminalLocation.Editor);
            instance.focusWhenReady();
            this._copyLaunchConfig = undefined;
            return this._instantiationService.createInstance(TerminalEditorInput_1, instance.resource, instance);
        }
        /**
         * Sets the launch config to use for the next call to EditorInput.copy, which will be used when
         * the editor's split command is run.
         */
        setCopyLaunchConfig(launchConfig) {
            this._copyLaunchConfig = launchConfig;
        }
        /**
         * Returns the terminal instance for this input if it has not yet been detached from the input.
         */
        get terminalInstance() {
            return this._isDetached ? undefined : this._terminalInstance;
        }
        showConfirm() {
            if (this._isReverted) {
                return false;
            }
            const confirmOnKill = this._configurationService.getValue("terminal.integrated.confirmOnKill" /* TerminalSettingId.ConfirmOnKill */);
            if (confirmOnKill === 'editor' || confirmOnKill === 'always') {
                return this._terminalInstance?.hasChildProcesses || false;
            }
            return false;
        }
        async confirm(terminals) {
            const { confirmed } = await this._dialogService.confirm({
                type: severity_1.default.Warning,
                message: (0, nls_1.localize)('confirmDirtyTerminal.message', "Do you want to terminate running processes?"),
                primaryButton: (0, nls_1.localize)({ key: 'confirmDirtyTerminal.button', comment: ['&& denotes a mnemonic'] }, "&&Terminate"),
                detail: terminals.length > 1 ?
                    terminals.map(terminal => terminal.editor.getName()).join('\n') + '\n\n' + (0, nls_1.localize)('confirmDirtyTerminals.detail', "Closing will terminate the running processes in the terminals.") :
                    (0, nls_1.localize)('confirmDirtyTerminal.detail', "Closing will terminate the running processes in this terminal.")
            });
            return confirmed ? 1 /* ConfirmResult.DONT_SAVE */ : 2 /* ConfirmResult.CANCEL */;
        }
        async revert() {
            // On revert just treat the terminal as permanently non-dirty
            this._isReverted = true;
        }
        constructor(resource, _terminalInstance, _themeService, _terminalInstanceService, _instantiationService, _configurationService, _lifecycleService, _contextKeyService, _dialogService) {
            super();
            this.resource = resource;
            this._terminalInstance = _terminalInstance;
            this._themeService = _themeService;
            this._terminalInstanceService = _terminalInstanceService;
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._lifecycleService = _lifecycleService;
            this._contextKeyService = _contextKeyService;
            this._dialogService = _dialogService;
            this.closeHandler = this;
            this._isDetached = false;
            this._isShuttingDown = false;
            this._isReverted = false;
            this._onDidRequestAttach = this._register(new event_1.Emitter());
            this.onDidRequestAttach = this._onDidRequestAttach.event;
            this._terminalEditorFocusContextKey = terminalContextKey_1.TerminalContextKeys.editorFocus.bindTo(_contextKeyService);
            if (_terminalInstance) {
                this._setupInstanceListeners();
            }
        }
        _setupInstanceListeners() {
            const instance = this._terminalInstance;
            if (!instance) {
                return;
            }
            const instanceOnDidFocusListener = instance.onDidFocus(() => this._terminalEditorFocusContextKey.set(true));
            const instanceOnDidBlurListener = instance.onDidBlur(() => this._terminalEditorFocusContextKey.reset());
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (!this._isDetached && !this._isShuttingDown) {
                    // Will be ignored if triggered by onExit or onDisposed terminal events
                    // as disposed was already called
                    instance.dispose(terminal_2.TerminalExitReason.User);
                }
                (0, lifecycle_1.dispose)([instanceOnDidFocusListener, instanceOnDidBlurListener]);
            }));
            const disposeListeners = [
                instance.onExit((e) => {
                    if (!instance.waitOnExit) {
                        this.dispose();
                    }
                }),
                instance.onDisposed(() => this.dispose()),
                instance.onTitleChanged(() => this._onDidChangeLabel.fire()),
                instance.onIconChanged(() => this._onDidChangeLabel.fire()),
                instanceOnDidFocusListener,
                instanceOnDidBlurListener,
                instance.statusList.onDidChangePrimaryStatus(() => this._onDidChangeLabel.fire())
            ];
            // Don't dispose editor when instance is torn down on shutdown to avoid extra work and so
            // the editor/tabs don't disappear
            this._lifecycleService.onWillShutdown((e) => {
                this._isShuttingDown = true;
                (0, lifecycle_1.dispose)(disposeListeners);
                // Don't touch processes if the shutdown was a result of reload as they will be reattached
                const shouldPersistTerminals = this._configurationService.getValue("terminal.integrated.enablePersistentSessions" /* TerminalSettingId.EnablePersistentSessions */) && e.reason === 3 /* ShutdownReason.RELOAD */;
                if (shouldPersistTerminals) {
                    instance.detachProcessAndDispose(terminal_2.TerminalExitReason.Shutdown);
                }
                else {
                    instance.dispose(terminal_2.TerminalExitReason.Shutdown);
                }
            });
        }
        getName() {
            return this._terminalInstance?.title || this.resource.fragment;
        }
        getIcon() {
            if (!this._terminalInstance || !themables_1.ThemeIcon.isThemeIcon(this._terminalInstance.icon)) {
                return undefined;
            }
            return this._terminalInstance.icon;
        }
        getLabelExtraClasses() {
            if (!this._terminalInstance) {
                return [];
            }
            const extraClasses = ['terminal-tab', 'predefined-file-icon'];
            const colorClass = (0, terminalIcon_1.getColorClass)(this._terminalInstance);
            if (colorClass) {
                extraClasses.push(colorClass);
            }
            const uriClasses = (0, terminalIcon_1.getUriClasses)(this._terminalInstance, this._themeService.getColorTheme().type);
            if (uriClasses) {
                extraClasses.push(...uriClasses);
            }
            return extraClasses;
        }
        /**
         * Detach the instance from the input such that when the input is disposed it will not dispose
         * of the terminal instance/process.
         */
        detachInstance() {
            if (!this._isShuttingDown) {
                this._terminalInstance?.detachFromElement();
                this._terminalInstance?.setParentContextKeyService(this._contextKeyService);
                this._isDetached = true;
            }
        }
        getDescription() {
            return this._terminalInstance?.description;
        }
        toUntyped() {
            return {
                resource: this.resource,
                options: {
                    override: terminal_1.terminalEditorId,
                    pinned: true,
                    forceReload: true
                }
            };
        }
    };
    exports.TerminalEditorInput = TerminalEditorInput;
    exports.TerminalEditorInput = TerminalEditorInput = TerminalEditorInput_1 = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, terminal_1.ITerminalInstanceService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, dialogs_1.IDialogService)
    ], TerminalEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHlCQUFXOztpQkFFbkMsT0FBRSxHQUFHLDRCQUE0QixBQUEvQixDQUFnQztRQWNsRCxRQUFRLENBQUMsS0FBK0I7WUFDdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLDBCQUEwQixDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ25GLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFhLE1BQU07WUFDbEIsT0FBTyxxQkFBbUIsQ0FBQyxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQWEsUUFBUTtZQUNwQixPQUFPLDJCQUFnQixDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFhLFlBQVk7WUFDeEIsT0FBTyxvRkFBb0Usc0RBQTRDLG9EQUEyQyxDQUFDO1FBQ3BLLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxRQUEyQjtZQUM5QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7WUFDbEUsQ0FBQztZQUNELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUM7WUFD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