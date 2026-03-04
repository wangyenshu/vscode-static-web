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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, event_1, lifecycle_1, uri_1, contextkey_1, editor_1, instantiation_1, terminal_1, terminal_2, terminalEditorInput_1, terminalUri_1, terminalContextKey_1, editorGroupsService_1, editorService_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditorService = void 0;
    let TerminalEditorService = class TerminalEditorService extends lifecycle_1.Disposable {
        constructor(_editorService, _editorGroupsService, _terminalInstanceService, _instantiationService, lifecycleService, contextKeyService) {
            super();
            this._editorService = _editorService;
            this._editorGroupsService = _editorGroupsService;
            this._terminalInstanceService = _terminalInstanceService;
            this._instantiationService = _instantiationService;
            this.instances = [];
            this._activeInstanceIndex = -1;
            this._isShuttingDown = false;
            this._editorInputs = new Map();
            this._instanceDisposables = new Map();
            this._onDidDisposeInstance = this._register(new event_1.Emitter());
            this.onDidDisposeInstance = this._onDidDisposeInstance.event;
            this._onDidFocusInstance = this._register(new event_1.Emitter());
            this.onDidFocusInstance = this._onDidFocusInstance.event;
            this._onDidChangeInstanceCapability = this._register(new event_1.Emitter());
            this.onDidChangeInstanceCapability = this._onDidChangeInstanceCapability.event;
            this._onDidChangeActiveInstance = this._register(new event_1.Emitter());
            this.onDidChangeActiveInstance = this._onDidChangeActiveInstance.event;
            this._onDidChangeInstances = this._register(new event_1.Emitter());
            this.onDidChangeInstances = this._onDidChangeInstances.event;
            this._terminalEditorActive = terminalContextKey_1.TerminalContextKeys.terminalEditorActive.bindTo(contextKeyService);
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const d of this._instanceDisposables.values()) {
                    (0, lifecycle_1.dispose)(d);
                }
            }));
            this._register(lifecycleService.onWillShutdown(() => this._isShuttingDown = true));
            this._register(this._editorService.onDidActiveEditorChange(() => {
                const activeEditor = this._editorService.activeEditor;
                const instance = activeEditor instanceof terminalEditorInput_1.TerminalEditorInput ? activeEditor?.terminalInstance : undefined;
                const terminalEditorActive = !!instance && activeEditor instanceof terminalEditorInput_1.TerminalEditorInput;
                this._terminalEditorActive.set(terminalEditorActive);
                if (terminalEditorActive) {
                    activeEditor?.setGroup(this._editorService.activeEditorPane?.group);
                    this.setActiveInstance(instance);
                }
                else {
                    for (const instance of this.instances) {
                        instance.resetFocusContextKey();
                    }
                }
            }));
            this._register(this._editorService.onDidVisibleEditorsChange(() => {
                // add any terminal editors created via the editor service split command
                const knownIds = this.instances.map(i => i.instanceId);
                const terminalEditors = this._getActiveTerminalEditors();
                const unknownEditor = terminalEditors.find(input => {
                    const inputId = input instanceof terminalEditorInput_1.TerminalEditorInput ? input.terminalInstance?.instanceId : undefined;
                    if (inputId === undefined) {
                        return false;
                    }
                    return !knownIds.includes(inputId);
                });
                if (unknownEditor instanceof terminalEditorInput_1.TerminalEditorInput && unknownEditor.terminalInstance) {
                    this._editorInputs.set(unknownEditor.terminalInstance.resource.path, unknownEditor);
                    this.instances.push(unknownEditor.terminalInstance);
                }
            }));
            // Remove the terminal from the managed instances when the editor closes. This fires when
            // dragging and dropping to another editor or closing the editor via cmd/ctrl+w.
            this._register(this._editorService.onDidCloseEditor(e => {
                const instance = e.editor instanceof terminalEditorInput_1.TerminalEditorInput ? e.editor.terminalInstance : undefined;
                if (instance) {
                    const instanceIndex = this.instances.findIndex(e => e === instance);
                    if (instanceIndex !== -1) {
                        const wasActiveInstance = this.instances[instanceIndex] === this.activeInstance;
                        this._removeInstance(instance);
                        if (wasActiveInstance) {
                            this.setActiveInstance(undefined);
                        }
                    }
                }
            }));
        }
        _getActiveTerminalEditors() {
            return this._editorService.visibleEditors.filter(e => e instanceof terminalEditorInput_1.TerminalEditorInput && e.terminalInstance?.instanceId);
        }
        get activeInstance() {
            if (this.instances.length === 0 || this._activeInstanceIndex === -1) {
                return undefined;
            }
            return this.instances[this._activeInstanceIndex];
        }
        setActiveInstance(instance) {
            this._activeInstanceIndex = instance ? this.instances.findIndex(e => e === instance) : -1;
            this._onDidChangeActiveInstance.fire(this.activeInstance);
        }
        async focusActiveInstance() {
            return this.activeInstance?.focusWhenReady(true);
        }
        async openEditor(instance, editorOptions) {
            const resource = this.resolveResource(instance);
            if (resource) {
                await this._activeOpenEditorRequest?.promise;
                this._activeOpenEditorRequest = {
                    instanceId: instance.instanceId,
                    promise: this._editorService.openEditor({
                        resource,
                        description: instance.description || instance.shellLaunchConfig.type,
                        options: {
                            pinned: true,
                            forceReload: true,
                            preserveFocus: editorOptions?.preserveFocus
                        }
                    }, editorOptions?.viewColumn ?? editorService_1.ACTIVE_GROUP)
                };
                await this._activeOpenEditorRequest?.promise;
                this._activeOpenEditorRequest = undefined;
            }
        }
        resolveResource(instance) {
            const resource = instance.resource;
            const inputKey = resource.path;
            const cachedEditor = this._editorInputs.get(inputKey);
            if (cachedEditor) {
                return cachedEditor.resource;
            }
            instance.target = terminal_1.TerminalLocation.Editor;
            const input = this._instantiationService.createInstance(terminalEditorInput_1.TerminalEditorInput, resource, instance);
            this._registerInstance(inputKey, input, instance);
            return input.resource;
        }
        getInputFromResource(resource) {
            const input = this._editorInputs.get(resource.path);
            if (!input) {
                throw new Error(`Could not get input from resource: ${resource.path}`);
            }
            return input;
        }
        _registerInstance(inputKey, input, instance) {
            this._editorInputs.set(inputKey, input);
            this._instanceDisposables.set(inputKey, [
                instance.onDidFocus(this._onDidFocusInstance.fire, this._onDidFocusInstance),
                instance.onDisposed(this._onDidDisposeInstance.fire, this._onDidDisposeInstance),
                instance.capabilities.onDidAddCapabilityType(() => this._onDidChangeInstanceCapability.fire(instance)),
                instance.capabilities.onDidRemoveCapabilityType(() => this._onDidChangeInstanceCapability.fire(instance)),
            ]);
            this.instances.push(instance);
            this._onDidChangeInstances.fire();
        }
        _removeInstance(instance) {
            const inputKey = instance.resource.path;
            this._editorInputs.delete(inputKey);
            const instanceIndex = this.instances.findIndex(e => e === instance);
            if (instanceIndex !== -1) {
                this.instances.splice(instanceIndex, 1);
            }
            const disposables = this._instanceDisposables.get(inputKey);
            this._instanceDisposables.delete(inputKey);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
            }
            this._onDidChangeInstances.fire();
        }
        getInstanceFromResource(resource) {
            return (0, terminalUri_1.getInstanceFromResource)(this.instances, resource);
        }
        splitInstance(instanceToSplit, shellLaunchConfig = {}) {
            if (instanceToSplit.target === terminal_1.TerminalLocation.Editor) {
                // Make sure the instance to split's group is active
                const group = this._editorInputs.get(instanceToSplit.resource.path)?.group;
                if (group) {
                    this._editorGroupsService.activateGroup(group);
                }
            }
            const instance = this._terminalInstanceService.createInstance(shellLaunchConfig, terminal_1.TerminalLocation.Editor);
            const resource = this.resolveResource(instance);
            if (resource) {
                this._editorService.openEditor({
                    resource: uri_1.URI.revive(resource),
                    description: instance.description,
                    options: {
                        pinned: true,
                        forceReload: true
                    }
                }, editorService_1.SIDE_GROUP);
            }
            return instance;
        }
        reviveInput(deserializedInput) {
            if ('pid' in deserializedInput) {
                const newDeserializedInput = { ...deserializedInput, findRevivedId: true };
                const instance = this._terminalInstanceService.createInstance({ attachPersistentProcess: newDeserializedInput }, terminal_1.TerminalLocation.Editor);
                const input = this._instantiationService.createInstance(terminalEditorInput_1.TerminalEditorInput, instance.resource, instance);
                this._registerInstance(instance.resource.path, input, instance);
                return input;
            }
            else {
                throw new Error(`Could not revive terminal editor input, ${deserializedInput}`);
            }
        }
        detachInstance(instance) {
            const inputKey = instance.resource.path;
            const editorInput = this._editorInputs.get(inputKey);
            editorInput?.detachInstance();
            this._removeInstance(instance);
            // Don't dispose the input when shutting down to avoid layouts in the editor area
            if (!this._isShuttingDown) {
                editorInput?.dispose();
            }
        }
        async revealActiveEditor(preserveFocus) {
            const instance = this.activeInstance;
            if (!instance) {
                return;
            }
            // If there is an active openEditor call for this instance it will be revealed by that
            if (this._activeOpenEditorRequest?.instanceId === instance.instanceId) {
                return;
            }
            const editorInput = this._editorInputs.get(instance.resource.path);
            this._editorService.openEditor(editorInput, {
                pinned: true,
                forceReload: true,
                preserveFocus,
                activation: editor_1.EditorActivation.PRESERVE
            });
        }
    };
    exports.TerminalEditorService = TerminalEditorService;
    exports.TerminalEditorService = TerminalEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, terminal_2.ITerminalInstanceService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, contextkey_1.IContextKeyService)
    ], TerminalEditorService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFZGl0b3JTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbEVkaXRvclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBd0JwRCxZQUNpQixjQUErQyxFQUN6QyxvQkFBMkQsRUFDdkQsd0JBQW1FLEVBQ3RFLHFCQUE2RCxFQUNqRSxnQkFBbUMsRUFDbEMsaUJBQXFDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBUHlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN4Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ3RDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDckQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQXpCckYsY0FBUyxHQUF3QixFQUFFLENBQUM7WUFDNUIseUJBQW9CLEdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDbEMsb0JBQWUsR0FBRyxLQUFLLENBQUM7WUFLeEIsa0JBQWEsR0FBaUQsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUN4RSx5QkFBb0IsR0FBMkMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUVoRSwwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFxQixDQUFDLENBQUM7WUFDakYseUJBQW9CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQUNoRCx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFxQixDQUFDLENBQUM7WUFDL0UsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1C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