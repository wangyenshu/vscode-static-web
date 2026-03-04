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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/label/common/label", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/terminal/common/embedderTerminalService"], function (require, exports, lifecycle_1, network_1, label_1, terminal_1, terminal_2, terminalUri_1, terminalStrings_1, editorResolverService_1, environmentService_1, lifecycle_2, embedderTerminalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalMainContribution = void 0;
    /**
     * The main contribution for the terminal contrib. This contains calls to other components necessary
     * to set up the terminal but don't need to be tracked in the long term (where TerminalService would
     * be more relevant).
     */
    let TerminalMainContribution = class TerminalMainContribution extends lifecycle_1.Disposable {
        static { this.ID = 'terminalMain'; }
        constructor(editorResolverService, embedderTerminalService, workbenchEnvironmentService, labelService, lifecycleService, terminalService, terminalEditorService, terminalGroupService, terminalInstanceService) {
            super();
            this._init(editorResolverService, embedderTerminalService, workbenchEnvironmentService, labelService, lifecycleService, terminalService, terminalEditorService, terminalGroupService, terminalInstanceService);
        }
        async _init(editorResolverService, embedderTerminalService, workbenchEnvironmentService, labelService, lifecycleService, terminalService, terminalEditorService, terminalGroupService, terminalInstanceService) {
            // IMPORTANT: This listener needs to be set up before the workbench is ready to support
            // embedder terminals.
            this._register(embedderTerminalService.onDidCreateTerminal(async (embedderTerminal) => {
                const terminal = await terminalService.createTerminal({
                    config: embedderTerminal,
                    location: terminal_1.TerminalLocation.Panel,
                    skipContributedProfileCheck: true,
                });
                terminalService.setActiveInstance(terminal);
                await terminalService.revealActiveTerminal();
            }));
            await lifecycleService.when(3 /* LifecyclePhase.Restored */);
            // Register terminal editors
            this._register(editorResolverService.registerEditor(`${network_1.Schemas.vscodeTerminal}:/**`, {
                id: terminal_2.terminalEditorId,
                label: terminalStrings_1.terminalStrings.terminal,
                priority: editorResolverService_1.RegisteredEditorPriority.exclusive
            }, {
                canSupportResource: uri => uri.scheme === network_1.Schemas.vscodeTerminal,
                singlePerResource: true
            }, {
                createEditorInput: async ({ resource, options }) => {
                    let instance = terminalService.getInstanceFromResource(resource);
                    if (instance) {
                        const sourceGroup = terminalGroupService.getGroupForInstance(instance);
                        sourceGroup?.removeInstance(instance);
                    }
                    else { // Terminal from a different window
                        const terminalIdentifier = (0, terminalUri_1.parseTerminalUri)(resource);
                        if (!terminalIdentifier.instanceId) {
                            throw new Error('Terminal identifier without instanceId');
                        }
                        const primaryBackend = terminalService.getPrimaryBackend();
                        if (!primaryBackend) {
                            throw new Error('No terminal primary backend');
                        }
                        const attachPersistentProcess = await primaryBackend.requestDetachInstance(terminalIdentifier.workspaceId, terminalIdentifier.instanceId);
                        if (!attachPersistentProcess) {
                            throw new Error('No terminal persistent process to attach');
                        }
                        instance = terminalInstanceService.createInstance({ attachPersistentProcess }, terminal_1.TerminalLocation.Editor);
                    }
                    const resolvedResource = terminalEditorService.resolveResource(instance);
                    const editor = terminalEditorService.getInputFromResource(resolvedResource);
                    return {
                        editor,
                        options: {
                            ...options,
                            pinned: true,
                            forceReload: true,
                            override: terminal_2.terminalEditorId
                        }
                    };
                }
            }));
            // Register a resource formatter for terminal URIs
            this._register(labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeTerminal,
                formatting: {
                    label: '${path}',
                    separator: ''
                }
            }));
        }
    };
    exports.TerminalMainContribution = TerminalMainContribution;
    exports.TerminalMainContribution = TerminalMainContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, embedderTerminalService_1.IEmbedderTerminalService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, label_1.ILabelService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, terminal_2.ITerminalService),
        __param(6, terminal_2.ITerminalEditorService),
        __param(7, terminal_2.ITerminalGroupService),
        __param(8, terminal_2.ITerminalInstanceService)
    ], TerminalMainContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxNYWluQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbE1haW5Db250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZWhHOzs7O09BSUc7SUFDSSxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO2lCQUNoRCxPQUFFLEdBQUcsY0FBYyxBQUFqQixDQUFrQjtRQUUzQixZQUN5QixxQkFBNkMsRUFDM0MsdUJBQWlELEVBQzdDLDJCQUF5RCxFQUN4RSxZQUEyQixFQUN2QixnQkFBbUMsRUFDcEMsZUFBaUMsRUFDM0IscUJBQTZDLEVBQzlDLG9CQUEyQyxFQUN4Qyx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsS0FBSyxDQUNULHFCQUFxQixFQUNyQix1QkFBdUIsRUFDdkIsMkJBQTJCLEVBQzNCLFlBQVksRUFDWixnQkFBZ0IsRUFDaEIsZUFBZSxFQUNmLHFCQUFxQixFQUNyQixvQkFBb0IsRUFDcEIsdUJBQXVCLENBQ3ZCLENBQUM7UUFDSCxDQUFDO1FBRU8sS0FBSyxDQUFDLEtBQUssQ0FDbEIscUJBQTZDLEVBQzdDLHVCQUFpRCxFQUNqRCwyQkFBeUQsRUFDekQsWUFBMkIsRUFDM0IsZ0JBQW1DLEVBQ25DLGVBQWlDLEVBQ2pDLHFCQUE2QyxFQUM3QyxvQkFBMkMsRUFDM0MsdUJBQWlEO1lBRWpELHVGQUF1RjtZQUN2RixzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUMsZ0JBQWdCLEVBQUMsRUFBRTtnQkFDbkYsTUFBTSxRQUFRLEdB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