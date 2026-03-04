/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/editorFeatures", "vs/editor/contrib/dropOrPasteInto/browser/copyPasteController", "vs/editor/contrib/dropOrPasteInto/browser/defaultProviders", "vs/nls"], function (require, exports, hierarchicalKind_1, editorExtensions_1, editorContextKeys_1, editorFeatures_1, copyPasteController_1, defaultProviders_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(copyPasteController_1.CopyPasteController.ID, copyPasteController_1.CopyPasteController, 0 /* EditorContributionInstantiation.Eager */); // eager because it listens to events on the container dom node of the editor
    (0, editorFeatures_1.registerEditorFeature)(defaultProviders_1.DefaultPasteProvidersFeature);
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: copyPasteController_1.changePasteTypeCommandId,
                precondition: copyPasteController_1.pasteWidgetVisibleCtx,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return copyPasteController_1.CopyPasteController.get(editor)?.changePasteType();
        }
    });
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.hidePasteWidget',
                precondition: copyPasteController_1.pasteWidgetVisibleCtx,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            copyPasteController_1.CopyPasteController.get(editor)?.clearWidgets();
        }
    });
    (0, editorExtensions_1.registerEditorAction)(class PasteAsAction extends editorExtensions_1.EditorAction {
        static { this.argsSchema = {
            type: 'object',
            properties: {
                kind: {
                    type: 'string',
                    description: nls.localize('pasteAs.kind', "The kind of the paste edit to try applying. If not provided or there are multiple edits for this kind, the editor will show a picker."),
                }
            },
        }; }
        constructor() {
            super({
                id: 'editor.action.pasteAs',
                label: nls.localize('pasteAs', "Paste As..."),
                alias: 'Paste As...',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                metadata: {
                    description: 'Paste as',
                    args: [{
                            name: 'args',
                            schema: PasteAsAction.argsSchema
                        }]
                }
            });
        }
        run(_accessor, editor, args) {
            let kind = typeof args?.kind === 'string' ? args.kind : undefined;
            if (!kind && args) {
                // Support old id property
                // TODO: remove this in the future
                kind = typeof args.id === 'string' ? args.id : undefined;
            }
            return copyPasteController_1.CopyPasteController.get(editor)?.pasteAs(kind ? new hierarchicalKind_1.HierarchicalKind(kind) : undefined);
        }
    });
    (0, editorExtensions_1.registerEditorAction)(class extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.pasteAsText',
                label: nls.localize('pasteAsText', "Paste as Text"),
                alias: 'Paste as Text',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
            });
        }
        run(_accessor, editor) {
            return copyPasteController_1.CopyPasteController.get(editor)?.pasteAs({ providerId: defaultProviders_1.DefaultTextPasteOrDropEditProvider.id });
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weVBhc3RlQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZHJvcE9yUGFzdGVJbnRvL2Jyb3dzZXIvY29weVBhc3RlQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLElBQUEsNkNBQTBCLEVBQUMseUNBQW1CLENBQUMsRUFBRSxFQUFFLHlDQUFtQixnREFBd0MsQ0FBQyxDQUFDLDZFQUE2RTtJQUM3TCxJQUFBLHNDQUFxQixFQUFDLCtDQUE0QixDQUFDLENBQUM7SUFFcEQsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLEtBQU0sU0FBUSxnQ0FBYTtRQUNwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsOENBQXdCO2dCQUM1QixZQUFZLEVBQUUsMkNBQXFCO2dCQUNuQyxNQUFNLEVBQUU7b0JBQ1AsTUFBTSwwQ0FBZ0M7b0JBQ3RDLE9BQU8sRUFBRSxtREFBK0I7aUJBQ3hDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVlLGdCQUFnQixDQUFDLFNBQWtDLEVBQUUsTUFBbUI7WUFDdkYsT0FBTyx5Q0FBbUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsZUFBZSxFQUFFLENBQUM7UUFDM0QsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEsd0NBQXFCLEVBQUMsSUFBSSxLQUFNLFNBQVEsZ0NBQWE7UUFDcEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHdCQUF3QjtnQkFDNUIsWUFBWSxFQUFFLDJDQUFxQjtnQkFDbkMsTUFBTSxFQUFFO29CQUNQLE1BQU0sMENBQWdDO29CQUN0QyxPQUFPLHdCQUFnQjtpQkFDdkI7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRWUsZ0JBQWdCLENBQUMs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