/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/platform/commands/common/commands"], function (require, exports, cancellation_1, languageFeatures_1, resolverService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    commands_1.CommandsRegistry.registerCommand('_executeMappedEditsProvider', async (accessor, documentUri, codeBlocks, context) => {
        const modelService = accessor.get(resolverService_1.ITextModelService);
        const langFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const document = await modelService.createModelReference(documentUri);
        let result = null;
        try {
            const providers = langFeaturesService.mappedEditsProvider.ordered(document.object.textEditorModel);
            if (providers.length > 0) {
                const mostRelevantProvider = providers[0];
                const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                result = await mostRelevantProvider.provideMappedEdits(document.object.textEditorModel, codeBlocks, context, cancellationTokenSource.token);
            }
        }
        finally {
            document.dispose();
        }
        return result;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwcGVkRWRpdHMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWFwcGVkRWRpdHMvY29tbW9uL21hcHBlZEVkaXRzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRywyQkFBZ0IsQ0FBQyxlQUFlLENBQy9CLDZCQUE2QixFQUM3QixLQUFLLEVBQ0osUUFBMEIsRUFDMUIsV0FBZ0IsRUFDaEIsVUFBb0IsRUFDcEIsT0FBcUMsRUFDSyxFQUFFO1FBRTVDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUNBQWlCLENBQUMsQ0FBQztRQUNyRCxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkNBQXdCLENBQUMsQ0FBQztRQUVuRSxNQUFNLFFBQVEsR0FBRyxNQUFNLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUV0RSxJQUFJLE1BQU0sR0FBbUMsSUFBSSxDQUFDO1FBRWxELElBQUksQ0FBQztZQUNKLE1BQU0sU0FBUyxHQUFHLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRW5HLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxvQkFBb0IsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTFDLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDO2dCQUU5RCxNQUFNLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FDckQsUUFBUSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQy9CLFVBQVUsRUFDVixPQUFPLEVBQ1AsdUJBQXVCLENBQUMsS0FBSyxDQUM3QixDQUFDO1lBQ0gsQ0FBQztRQUNGLENBQUM7Z0JBQVMsQ0FBQztZQUNWLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNwQixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDLENBQ0QsQ0FBQyJ9