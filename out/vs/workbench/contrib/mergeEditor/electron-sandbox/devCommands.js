/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/codicons", "vs/base/common/extpath", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/mergeEditor/browser/view/mergeEditor", "vs/workbench/services/editor/common/editorService"], function (require, exports, buffer_1, codicons_1, extpath_1, uri_1, language_1, nls_1, actions_1, clipboardService_1, environment_1, files_1, quickInput_1, mergeEditor_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenSelectionInTemporaryMergeEditor = exports.MergeEditorOpenContentsFromJSON = void 0;
    const MERGE_EDITOR_CATEGORY = (0, nls_1.localize2)('mergeEditor', 'Merge Editor (Dev)');
    class MergeEditorOpenContentsFromJSON extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.dev.openContentsJson',
                category: MERGE_EDITOR_CATEGORY,
                title: (0, nls_1.localize2)('merge.dev.openState', "Open Merge Editor State from JSON"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true,
            });
        }
        async run(accessor, args) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const languageService = accessor.get(language_1.ILanguageService);
            const env = accessor.get(environment_1.INativeEnvironmentService);
            const fileService = accessor.get(files_1.IFileService);
            if (!args) {
                args = {};
            }
            let content;
            if (!args.data) {
                const result = await quickInputService.input({
                    prompt: (0, nls_1.localize)('mergeEditor.enterJSON', 'Enter JSON'),
                    value: await clipboardService.readText(),
                });
                if (result === undefined) {
                    return;
                }
                content =
                    result !== ''
                        ? JSON.parse(result)
                        : { base: '', input1: '', input2: '', result: '', languageId: 'plaintext' };
            }
            else {
                content = args.data;
            }
            const targetDir = uri_1.URI.joinPath(env.tmpDir, (0, extpath_1.randomPath)());
            const extension = languageService.getExtensions(content.languageId)[0] || '';
            const baseUri = uri_1.URI.joinPath(targetDir, `/base${extension}`);
            const input1Uri = uri_1.URI.joinPath(targetDir, `/input1${extension}`);
            const input2Uri = uri_1.URI.joinPath(targetDir, `/input2${extension}`);
            const resultUri = uri_1.URI.joinPath(targetDir, `/result${extension}`);
            const initialResultUri = uri_1.URI.joinPath(targetDir, `/initialResult${extension}`);
            async function writeFile(uri, content) {
                await fileService.writeFile(uri, buffer_1.VSBuffer.fromString(content));
            }
            const shouldOpenInitial = await promptOpenInitial(quickInputService, args.resultState);
            await Promise.all([
                writeFile(baseUri, content.base),
                writeFile(input1Uri, content.input1),
                writeFile(input2Uri, content.input2),
                writeFile(resultUri, shouldOpenInitial ? (content.initialResult || '') : content.result),
                writeFile(initialResultUri, content.initialResult || ''),
            ]);
            const input = {
                base: { resource: baseUri },
                input1: { resource: input1Uri, label: 'Input 1', description: 'Input 1', detail: '(from JSON)' },
                input2: { resource: input2Uri, label: 'Input 2', description: 'Input 2', detail: '(from JSON)' },
                result: { resource: resultUri },
            };
            editorService.openEditor(input);
        }
    }
    exports.MergeEditorOpenContentsFromJSON = MergeEditorOpenContentsFromJSON;
    async function promptOpenInitial(quickInputService, resultStateOverride) {
        if (resultStateOverride) {
            return resultStateOverride === 'initial';
        }
        const result = await quickInputService.pick([{ label: 'result', result: false }, { label: 'initial result', result: true }], { canPickMany: false });
        return result?.result;
    }
    class MergeEditorAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                const vm = activeEditorPane.viewModel.get();
                if (!vm) {
                    return;
                }
                this.runWithViewModel(vm, accessor);
            }
        }
    }
    class OpenSelectionInTemporaryMergeEditor extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.dev.openSelectionInTemporaryMergeEditor',
                category: MERGE_EDITOR_CATEGORY,
                title: (0, nls_1.localize2)('merge.dev.openSelectionInTemporaryMergeEditor', "Open Selection In Temporary Merge Editor"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true,
            });
        }
        async runWithViewModel(viewModel, accessor) {
            const rangesInBase = viewModel.selectionInBase.get()?.rangesInBase;
            if (!rangesInBase || rangesInBase.length === 0) {
                return;
            }
            const base = rangesInBase
                .map((r) => viewModel.model.base.getValueInRange(r))
                .join('\n');
            const input1 = rangesInBase
                .map((r) => viewModel.inputCodeEditorView1.editor.getModel().getValueInRange(viewModel.model.translateBaseRangeToInput(1, r)))
                .join('\n');
            const input2 = rangesInBase
                .map((r) => viewModel.inputCodeEditorView2.editor.getModel().getValueInRange(viewModel.model.translateBaseRangeToInput(2, r)))
                .join('\n');
            const result = rangesInBase
                .map((r) => viewModel.resultCodeEditorView.editor.getModel().getValueInRange(viewModel.model.translateBaseRangeToResult(r)))
                .join('\n');
            new MergeEditorOpenContentsFromJSON().run(accessor, {
                data: {
                    base,
                    input1,
                    input2,
                    result,
                    languageId: viewModel.resultCodeEditorView.editor.getModel().getLanguageId()
                }
            });
        }
    }
    exports.OpenSelectionInTemporaryMergeEditor = OpenSelectionInTemporaryMergeEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2Q29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9lbGVjdHJvbi1zYW5kYm94L2RldkNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCaEcsTUFBTSxxQkFBcUIsR0FBcUIsSUFBQSxlQUFTLEVBQUMsYUFBYSxFQUFFLG9CQUFvQixDQUFDLENBQUM7SUFFL0YsTUFBYSwrQkFBZ0MsU0FBUSxpQkFBTztRQUMzRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsNEJBQTRCO2dCQUNoQyxRQUFRLEVBQUUscUJBQXFCO2dCQUMvQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMscUJBQXFCLEVBQUUsbUNBQW1DLENBQUM7Z0JBQzVFLElBQUksRUFBRSxrQkFBTyxDQUFDLGNBQWM7Z0JBQzVCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxJQUEwRTtZQUMvRyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUMzRCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0NBQWlCLENBQUMsQ0FBQztZQUN6RCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztZQUNuRCxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7WUFDdkQsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBeUIsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDO1lBRS9DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELElBQUksT0FBNEIsQ0FBQztZQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixNQUFNLE1BQU0sR0FBRyxNQUFNLGlCQUFpQixDQUFDLEtBQUssQ0FBQztvQkFDNUMsTUFBTSxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLFlBQVksQ0FBQztvQkFDdkQsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCLENBQUMsUUFBUSxFQUFFO2lCQUN4QyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzFCLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxPQUFPO29CQUNOLE1BQU0sS0FBSyxFQUFFO3dCQUNaLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQzt3QkFDcEIsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDL0UsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ3JCLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBQSxvQkFBVSxHQUFFLENBQUMsQ0FBQztZQUV6RCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFN0UsTUFBTSxPQUFPLEdBQUcsU0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQzdELE1BQU0sU0FBUyxHQUFHLFNBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFVBQVUsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxVQUFVLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsVUFBVSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sZ0JBQWdCLEdBQUcsU0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFFL0UsS0FBSyxVQUFVLFNBQVMsQ0FBQyxHQUFRLEVBQUUsT0FBZTtnQkFDakQsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFFRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0saUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXZGLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztnQkFDakIsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNoQyxTQUFTLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ3BDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFDcEMsU0FBUyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO2dCQUN4RixTQUFTLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUM7YUFDeEQsQ0FBQyxDQUFDO1lBRUgsTUFBTSxLQUFLLEdBQThCO2dCQUN4QyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFO2dCQUMzQixNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO2dCQUNoRyxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO2dCQUNoRyxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFO2FBQy9CLENBQUM7WUFDRixhQUFhLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUM7S0FDRDtJQXhFRCwwRUF3RUM7SUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQUMsaUJBQXFDLEVBQUUsbUJBQTJDO1FBQ2xILElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQUN6QixPQUFPLG1CQUFtQixLQUFLLFNBQVMsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDckosT0FBTyxNQUFNLEVBQUUsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxNQUFlLGlCQUFrQixTQUFRLGlCQUFPO1FBQy9DLFlBQVksSUFBK0I7WUFDMUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2IsQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztZQUMxRCxJQUFJLGdCQUFnQixZQUFZLHlCQUFXLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ1QsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7S0FHRDtJQUVELE1BQWEsbUNBQW9DLFNBQVEsaUJBQWlCO1FBQ3pFO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwrQ0FBK0M7Z0JBQ25ELFFBQVEsRUFBRSxxQkFBcUI7Z0JBQy9CLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQywrQ0FBK0MsRUFBRSwwQ0FBMEMsQ0FBQztnQkFDN0csSUFBSSxFQUFFLGtCQUFPLENBQUMsY0FBYztnQkFDNUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFNBQStCLEVBQUUsUUFBMEI7WUFDMUYsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxZQUFZLENBQUM7WUFDbkUsSUFBSSxDQUFDLFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLFlBQVk7aUJBQ3ZCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQ1YsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUNuQyxDQUFDLENBQ0QsQ0FDRDtpQkFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFYixNQUFNLE1BQU0sR0FBRyxZQUFZO2lCQUN6QixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUNWLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsZUFBZSxDQUNoRSxTQUFTLENBQUMsS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDL0MsQ0FDRDtpQkFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFYixNQUFNLE1BQU0sR0FBRyxZQUFZO2lCQUN6QixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUNWLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsZUFBZSxDQUNoRSxTQUFTLENBQUMsS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDL0MsQ0FDRDtpQkFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFYixNQUFNLE1BQU0sR0FBRyxZQUFZO2lCQUN6QixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUNWLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFHLENBQUMsZUFBZSxDQUNoRSxTQUFTLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUM3QyxDQUNEO2lCQUNBLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUViLElBQUksK0JBQStCLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFO2dCQUNuRCxJQUFJLEVBQUU7b0JBQ0wsSUFBSTtvQkFDSixNQUFNO29CQUNOLE1BQU07b0JBQ04sTUFBTTtvQkFDTixVQUFVLEVBQUUsU0FBUyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxhQUFhLEVBQUU7aUJBQzdFO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBM0RELGtGQTJEQyJ9