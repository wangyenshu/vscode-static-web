/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/common/core/range", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/textMate/browser/textMateTokenizationFeature", "vs/editor/common/services/model", "vs/workbench/services/editor/common/editorService", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/log/common/log", "vs/base/common/resources", "vs/platform/files/common/files"], function (require, exports, nls, range_1, actions_1, actionCommonCategories_1, textMateTokenizationFeature_1, model_1, editorService_1, uri_1, uuid_1, codeEditorService_1, host_1, environmentService_1, log_1, resources_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StartDebugTextMate extends actions_1.Action2 {
        static { this.resource = uri_1.URI.parse(`inmemory:///tm-log.txt`); }
        constructor() {
            super({
                id: 'editor.action.startDebugTextMate',
                title: nls.localize2('startDebugTextMate', "Start TextMate Syntax Grammar Logging"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        _getOrCreateModel(modelService) {
            const model = modelService.getModel(StartDebugTextMate.resource);
            if (model) {
                return model;
            }
            return modelService.createModel('', null, StartDebugTextMate.resource);
        }
        _append(model, str) {
            const lineCount = model.getLineCount();
            model.applyEdits([{
                    range: new range_1.Range(lineCount, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, lineCount, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                    text: str
                }]);
        }
        async run(accessor) {
            const textMateService = accessor.get(textMateTokenizationFeature_1.ITextMateTokenizationService);
            const modelService = accessor.get(model_1.IModelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const hostService = accessor.get(host_1.IHostService);
            const environmentService = accessor.get(environmentService_1.INativeWorkbenchEnvironmentService);
            const loggerService = accessor.get(log_1.ILoggerService);
            const fileService = accessor.get(files_1.IFileService);
            const pathInTemp = (0, resources_1.joinPath)(environmentService.tmpDir, `vcode-tm-log-${(0, uuid_1.generateUuid)()}.txt`);
            await fileService.createFile(pathInTemp);
            const logger = loggerService.createLogger(pathInTemp, { name: 'debug textmate' });
            const model = this._getOrCreateModel(modelService);
            const append = (str) => {
                this._append(model, str + '\n');
                scrollEditor();
                logger.info(str);
                logger.flush();
            };
            await hostService.openWindow([{ fileUri: pathInTemp }], { forceNewWindow: true });
            const textEditorPane = await editorService.openEditor({
                resource: model.uri,
                options: { pinned: true }
            });
            if (!textEditorPane) {
                return;
            }
            const scrollEditor = () => {
                const editors = codeEditorService.listCodeEditors();
                for (const editor of editors) {
                    if (editor.hasModel()) {
                        if (editor.getModel().uri.toString() === StartDebugTextMate.resource.toString()) {
                            editor.revealLine(editor.getModel().getLineCount());
                        }
                    }
                }
            };
            append(`// Open the file you want to test to the side and watch here`);
            append(`// Output mirrored at ${pathInTemp}`);
            textMateService.startDebugMode((str) => {
                this._append(model, str + '\n');
                scrollEditor();
                logger.info(str);
                logger.flush();
            }, () => {
            });
        }
    }
    (0, actions_1.registerAction2)(StartDebugTextMate);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnREZWJ1Z1RleHRNYXRlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9lbGVjdHJvbi1zYW5kYm94L3N0YXJ0RGVidWdUZXh0TWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsTUFBTSxrQkFBbUIsU0FBUSxpQkFBTztpQkFFeEIsYUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUU5RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0NBQWtDO2dCQUN0QyxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSx1Q0FBdUMsQ0FBQztnQkFDbkYsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztnQkFDOUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8saUJBQWlCLENBQUMsWUFBMkI7WUFDcEQsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqRSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELE9BQU8sWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFTyxPQUFPLENBQUMsS0FBaUIsRUFBRSxHQUFXO1lBQzdDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2QyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ2pCLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxTQUFTLHFEQUFv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