/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/welcomeWalkthrough/browser/walkThroughInput", "vs/workbench/contrib/welcomeWalkthrough/browser/walkThroughPart", "vs/workbench/contrib/welcomeWalkthrough/browser/walkThroughActions", "vs/workbench/contrib/welcomeWalkthrough/common/walkThroughContentProvider", "vs/workbench/contrib/welcomeWalkthrough/browser/editor/editorWalkThrough", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/platform/instantiation/common/descriptors", "vs/platform/actions/common/actions", "vs/workbench/common/contributions", "vs/workbench/browser/editor", "vs/platform/keybinding/common/keybindingsRegistry"], function (require, exports, nls_1, walkThroughInput_1, walkThroughPart_1, walkThroughActions_1, walkThroughContentProvider_1, editorWalkThrough_1, platform_1, editor_1, descriptors_1, actions_1, contributions_1, editor_2, keybindingsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane)
        .registerEditorPane(editor_2.EditorPaneDescriptor.create(walkThroughPart_1.WalkThroughPart, walkThroughPart_1.WalkThroughPart.ID, (0, nls_1.localize)('walkThrough.editor.label', "Playground")), [new descriptors_1.SyncDescriptor(walkThroughInput_1.WalkThroughInput)]);
    (0, actions_1.registerAction2)(editorWalkThrough_1.EditorWalkThroughAction);
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(editorWalkThrough_1.EditorWalkThroughInputSerializer.ID, editorWalkThrough_1.EditorWalkThroughInputSerializer);
    (0, contributions_1.registerWorkbenchContribution2)(walkThroughContentProvider_1.WalkThroughSnippetContentProvider.ID, walkThroughContentProvider_1.WalkThroughSnippetContentProvider, { editorTypeId: walkThroughPart_1.WalkThroughPart.ID });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(walkThroughActions_1.WalkThroughArrowUp);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(walkThroughActions_1.WalkThroughArrowDown);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(walkThroughActions_1.WalkThroughPageUp);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(walkThroughActions_1.WalkThroughPageDown);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarHelpMenu, {
        group: '1_welcome',
        command: {
            id: 'workbench.action.showInteractivePlayground',
            title: (0, nls_1.localize)({ key: 'miPlayground', comment: ['&& denotes a mnemonic'] }, "Editor Playgrou&&nd")
        },
        order: 3
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa1Rocm91Z2guY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZVdhbGt0aHJvdWdoL2Jyb3dzZXIvd2Fsa1Rocm91Z2guY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZ0JoRyxtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDO1NBQzNELGtCQUFrQixDQUFDLDZCQUFvQixDQUFDLE1BQU0sQ0FDOUMsaUNBQWUsRUFDZixpQ0FBZSxDQUFDLEVBQUUsRUFDbEIsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsWUFBWSxDQUFDLENBQ2xELEVBQ0EsQ0FBQyxJQUFJLDRCQUFjLENBQUMsbUNBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFMUMsSUFBQSx5QkFBZSxFQUFDLDJDQUF1QixDQUFDLENBQUM7SUFFekMsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLHlCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLG9EQUFnQyxDQUFDLEVBQUUsRUFBRSxvREFBZ0MsQ0FBQyxDQUFDO0lBRXBLLElBQUEsOENBQThCLEVBQUMsOERBQWlDLENBQUMsRUFBRSxFQUFFLDhEQUFpQyxFQUFFLEVBQUUsWUFBWSxFQUFFLGlDQUFlLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUU5SSx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQyx1Q0FBa0IsQ0FBQyxDQUFDO0lBRXpFLHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDLHlDQUFvQixDQUFDLENBQUM7SUFFM0UseUNBQW1CLENBQUMsZ0NBQWdDLENBQUMsc0NBQWlCLENBQUMsQ0FBQztJQUV4RSx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQyx3Q0FBbUIsQ0FBQyxDQUFDO0lBRTFFLHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsZUFBZSxFQUFFO1FBQ25ELEtBQUssRUFBRSxXQUFXO1FBQ2xCLE9BQU8sRUFBRTtZQUNSLEVBQUUsRUFBRSw0Q0FBNEM7WUFDaEQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUscUJBQXFCLENBQUM7U0FDbkc7UUFDRCxLQUFLLEVBQUUsQ0FBQztLQUNSLENBQUMsQ0FBQyJ9