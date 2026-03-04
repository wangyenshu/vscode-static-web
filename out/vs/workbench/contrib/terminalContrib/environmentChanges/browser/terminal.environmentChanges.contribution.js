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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/services/editor/common/editorService"], function (require, exports, uri_1, event_1, model_1, resolverService_1, nls_1, instantiation_1, environmentVariable_1, terminalActions_1, editorService_1) {
    "use strict";
    var EnvironmentCollectionProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO: The rest of the terminal environment changes feature should move here https://github.com/microsoft/vscode/issues/177241
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.showEnvironmentContributions" /* TerminalCommandId.ShowEnvironmentContributions */,
        title: (0, nls_1.localize2)('workbench.action.terminal.showEnvironmentContributions', 'Show Environment Contributions'),
        run: async (activeInstance, c, accessor, arg) => {
            const collection = activeInstance.extEnvironmentVariableCollection;
            if (collection) {
                const scope = arg;
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const outputProvider = instantiationService.createInstance(EnvironmentCollectionProvider);
                const editorService = accessor.get(editorService_1.IEditorService);
                const timestamp = new Date().getTime();
                const scopeDesc = scope?.workspaceFolder ? ` - ${scope.workspaceFolder.name}` : '';
                const textContent = await outputProvider.provideTextContent(uri_1.URI.from({
                    scheme: EnvironmentCollectionProvider.scheme,
                    path: `Environment changes${scopeDesc}`,
                    fragment: describeEnvironmentChanges(collection, scope),
                    query: `environment-collection-${timestamp}`
                }));
                if (textContent) {
                    await editorService.openEditor({
                        resource: textContent.uri
                    });
                }
            }
        }
    });
    function describeEnvironmentChanges(collection, scope) {
        let content = `# ${(0, nls_1.localize)('envChanges', 'Terminal Environment Changes')}`;
        const globalDescriptions = collection.getDescriptionMap(undefined);
        const workspaceDescriptions = collection.getDescriptionMap(scope);
        for (const [ext, coll] of collection.collections) {
            content += `\n\n## ${(0, nls_1.localize)('extension', 'Extension: {0}', ext)}`;
            content += '\n';
            const globalDescription = globalDescriptions.get(ext);
            if (globalDescription) {
                content += `\n${globalDescription}\n`;
            }
            const workspaceDescription = workspaceDescriptions.get(ext);
            if (workspaceDescription) {
                // Only show '(workspace)' suffix if there is already a description for the extension.
                const workspaceSuffix = globalDescription ? ` (${(0, nls_1.localize)('ScopedEnvironmentContributionInfo', 'workspace')})` : '';
                content += `\n${workspaceDescription}${workspaceSuffix}\n`;
            }
            for (const mutator of coll.map.values()) {
                if (filterScope(mutator, scope) === false) {
                    continue;
                }
                content += `\n- \`${mutatorTypeLabel(mutator.type, mutator.value, mutator.variable)}\``;
            }
        }
        return content;
    }
    function filterScope(mutator, scope) {
        if (!mutator.scope) {
            return true;
        }
        // Only mutators which are applicable on the relevant workspace should be shown.
        if (mutator.scope.workspaceFolder && scope?.workspaceFolder && mutator.scope.workspaceFolder.index === scope.workspaceFolder.index) {
            return true;
        }
        return false;
    }
    function mutatorTypeLabel(type, value, variable) {
        switch (type) {
            case environmentVariable_1.EnvironmentVariableMutatorType.Prepend: return `${variable}=${value}\${env:${variable}}`;
            case environmentVariable_1.EnvironmentVariableMutatorType.Append: return `${variable}=\${env:${variable}}${value}`;
            default: return `${variable}=${value}`;
        }
    }
    let EnvironmentCollectionProvider = class EnvironmentCollectionProvider {
        static { EnvironmentCollectionProvider_1 = this; }
        static { this.scheme = 'ENVIRONMENT_CHANGES_COLLECTION'; }
        constructor(textModelResolverService, _modelService) {
            this._modelService = _modelService;
            textModelResolverService.registerTextModelContentProvider(EnvironmentCollectionProvider_1.scheme, this);
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            return this._modelService.createModel(resource.fragment, { languageId: 'markdown', onDidChange: event_1.Event.None }, resource, false);
        }
    };
    EnvironmentCollectionProvider = EnvironmentCollectionProvider_1 = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], EnvironmentCollectionProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuZW52aXJvbm1lbnRDaGFuZ2VzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9lbnZpcm9ubWVudENoYW5nZXMvYnJvd3Nlci90ZXJtaW5hbC5lbnZpcm9ubWVudENoYW5nZXMuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNoRyxnSUFBZ0k7SUFFaEksSUFBQSw4Q0FBNEIsRUFBQztRQUM1QixFQUFFLCtHQUFnRDtRQUNsRCxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsd0RBQXdELEVBQUUsZ0NBQWdDLENBQUM7UUFDNUcsR0FBRyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUMvQyxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsZ0NBQWdDLENBQUM7WUFDbkUsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxLQUFLLEdBQUcsR0FBMkMsQ0FBQztnQkFDMUQsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO2dCQUMxRixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxTQUFTLEdBQUcsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMs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