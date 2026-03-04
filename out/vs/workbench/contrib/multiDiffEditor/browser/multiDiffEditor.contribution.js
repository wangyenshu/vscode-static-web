/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditor", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput", "./actions", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/multiDiffEditor/browser/scmMultiDiffSourceResolver"], function (require, exports, nls_1, actions_1, configurationRegistry_1, descriptors_1, platform_1, editor_1, contributions_1, editor_2, multiDiffEditor_1, multiDiffEditorInput_1, actions_2, multiDiffSourceResolverService_1, extensions_1, scmMultiDiffSourceResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(actions_2.GoToFileAction);
    (0, actions_1.registerAction2)(actions_2.CollapseAllAction);
    (0, actions_1.registerAction2)(actions_2.ExpandAllAction);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        properties: {
            'multiDiffEditor.experimental.enabled': {
                type: 'boolean',
                default: true,
                description: 'Enable experimental multi diff editor.',
            },
        }
    });
    (0, extensions_1.registerSingleton)(multiDiffSourceResolverService_1.IMultiDiffSourceResolverService, multiDiffSourceResolverService_1.MultiDiffSourceResolverService, 1 /* InstantiationType.Delayed */);
    // Editor Integration
    (0, contributions_1.registerWorkbenchContribution2)(multiDiffEditorInput_1.MultiDiffEditorResolverContribution.ID, multiDiffEditorInput_1.MultiDiffEditorResolverContribution, 1 /* WorkbenchPhase.BlockStartup */);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane)
        .registerEditorPane(editor_1.EditorPaneDescriptor.create(multiDiffEditor_1.MultiDiffEditor, multiDiffEditor_1.MultiDiffEditor.ID, (0, nls_1.localize)('name', "Multi Diff Editor")), [new descriptors_1.SyncDescriptor(multiDiffEditorInput_1.MultiDiffEditorInput)]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory)
        .registerEditorSerializer(multiDiffEditorInput_1.MultiDiffEditorInput.ID, multiDiffEditorInput_1.MultiDiffEditorSerializer);
    // SCM integration
    (0, actions_1.registerAction2)(scmMultiDiffSourceResolver_1.OpenScmGroupAction);
    (0, contributions_1.registerWorkbenchContribution2)(scmMultiDiffSourceResolver_1.ScmMultiDiffSourceResolverContribution.ID, scmMultiDiffSourceResolver_1.ScmMultiDiffSourceResolverContribution, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmRWRpdG9yLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL211bHRpRGlmZkVkaXRvci9icm93c2VyL211bHRpRGlmZkVkaXRvci5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpQmhHLElBQUEseUJBQWUsRUFBQyx3QkFBYyxDQUFDLENBQUM7SUFDaEMsSUFBQSx5QkFBZSxFQUFDLDJCQUFpQixDQUFDLENBQUM7SUFDbkMsSUFBQSx5QkFBZSxFQUFDLHlCQUFlLENBQUMsQ0FBQztJQUVqQyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUM7U0FDM0QscUJBQXFCLENBQUM7UUFDdEIsVUFBVSxFQUFFO1lBQ1gsc0NBQXNDLEVBQUU7Z0JBQ3ZDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxJQUFJO2dCQUNiLFdBQVcsRUFBRSx3Q0FBd0M7YUFDckQ7U0FDRDtLQUNELENBQUMsQ0FBQztJQUVKLElBQUEsOEJBQWlCLEVBQUMsZ0VBQStCLEVBQUUsK0RBQThCLG9DQUE0QixDQUFDO0lBRTlHLHFCQUFxQjtJQUNyQixJQUFBLDhDQUE4QixFQUFDLDBEQUFtQyxDQUFDLEVBQUUsRUFBRSwwREFBbUMsc0NBQXdFLENBQUM7SUFFbkwsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQztTQUMzRCxrQkFBa0IsQ0FDbEIsNkJBQW9CLENBQUMsTUFBTSxDQUFDLGlDQUFlLEVBQUUsaUNBQWUsQ0FBQyxFQUFFLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLG1CQUFtQixDQUFDLENBQUMsRUFDdkcsQ0FBQyxJQUFJLDRCQUFjLENBQUMsMkNBQW9CLENBQUMsQ0FBQyxDQUMxQyxDQUFDO0lBRUgsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLHlCQUFnQixDQUFDLGFBQWEsQ0FBQztTQUNqRSx3QkFBd0IsQ0FBQywyQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsZ0RBQXlCLENBQUMsQ0FBQztJQUUvRSxrQkFBa0I7SUFDbEIsSUFBQSx5QkFBZSxFQUFDLCtDQUFrQixDQUFDLENBQUM7SUFDcEMsSUFBQSw4Q0FBOEIsRUFBQyxtRUFBc0MsQ0FBQyxFQUFFLEVBQUUsbUVBQXNDLHNDQUF5RSxDQUFDIn0=