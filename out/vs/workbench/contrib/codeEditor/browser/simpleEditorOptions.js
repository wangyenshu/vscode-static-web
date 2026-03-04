/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/editor/browser/editorExtensions"], function (require, exports, contextmenu_1, snippetController2_1, suggestController_1, menuPreventer_1, selectionClipboard_1, tabCompletion_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSimpleEditorOptions = getSimpleEditorOptions;
    exports.getSimpleCodeEditorWidgetOptions = getSimpleCodeEditorWidgetOptions;
    function getSimpleEditorOptions(configurationService) {
        return {
            wordWrap: 'on',
            overviewRulerLanes: 0,
            glyphMargin: false,
            lineNumbers: 'off',
            folding: false,
            selectOnLineNumbers: false,
            hideCursorInOverviewRuler: true,
            selectionHighlight: false,
            scrollbar: {
                horizontal: 'hidden'
            },
            lineDecorationsWidth: 0,
            overviewRulerBorder: false,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'none',
            fixedOverflowWidgets: true,
            acceptSuggestionOnEnter: 'smart',
            dragAndDrop: false,
            revealHorizontalRightPadding: 5,
            minimap: {
                enabled: false
            },
            guides: {
                indentation: false
            },
            accessibilitySupport: configurationService.getValue('editor.accessibilitySupport'),
            cursorBlinking: configurationService.getValue('editor.cursorBlinking')
        };
    }
    function getSimpleCodeEditorWidgetOptions() {
        return {
            isSimpleWidget: true,
            contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                menuPreventer_1.MenuPreventer.ID,
                selectionClipboard_1.SelectionClipboardContributionID,
                contextmenu_1.ContextMenuController.ID,
                suggestController_1.SuggestController.ID,
                snippetController2_1.SnippetController2.ID,
                tabCompletion_1.TabCompletionController.ID,
            ])
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlRWRpdG9yT3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9zaW1wbGVFZGl0b3JPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLHdEQThCQztJQUVELDRFQVlDO0lBNUNELFNBQWdCLHNCQUFzQixDQUFDLG9CQUEyQztRQUNqRixPQUFPO1lBQ04sUUFBUSxFQUFFLElBQUk7WUFDZCxrQkFBa0IsRUFBRSxDQUFDO1lBQ3JCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsbUJBQW1CLEVBQUUsS0FBSztZQUMxQix5QkFBeUIsRUFBRSxJQUFJO1lBQy9CLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsU0FBUyxFQUFFO2dCQUNWLFVBQVUsRUFBRSxRQUFRO2FBQ3BCO1lBQ0Qsb0JBQW9CLEVBQUUsQ0FBQztZQUN2QixtQkFBbUIsRUFBRSxLQUFLO1lBQzFCLG9CQUFvQixFQUFFLEtBQUs7WUFDM0IsbUJBQW1CLEVBQUUsTUFBTTtZQUMzQixvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLHVCQUF1QixFQUFFLE9BQU87WUFDaEMsV0FBVyxFQUFFLEtBQUs7WUFDbEIsNEJBQTRCLEVBQUUsQ0FBQztZQUMvQixPQUFPLEVBQUU7Z0JBQ1IsT0FBTyxFQUFFLEtBQUs7YUFDZDtZQUNELE1BQU0sRUFBRTtnQkFDUCxXQUFXLEVBQUUsS0FBSzthQUNsQjtZQUNELG9CQUFvQixFQUFFLG9CQUFvQixDQUFDLFFBQVEsQ0FBd0IsNkJBQTZCLENBQUM7WUFDekcsY0FBYyxFQUFFLG9CQUFvQixDQUFDLFFBQVEsQ0FBb0QsdUJBQXVCLENBQUM7U0FDekgsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFnQixnQ0FBZ0M7UUFDL0MsT0FBTztZQUNOLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGFBQWEsRUFBRSwyQ0FBd0IsQ0FBQywwQkFBMEIsQ0FBQztnQkFDbEUsNkJBQWEsQ0FBQyxFQUFFO2dCQUNoQixxREFBZ0M7Z0JBQ2hDLG1DQUFxQixDQUFDLEVBQUU7Z0JBQ3hCLHFDQUFpQixDQUFDLEVBQUU7Z0JBQ3BCLHVDQUFrQixDQUFDLEVBQUU7Z0JBQ3JCLHVDQUF1QixDQUFDLEVBQUU7YUFDMUIsQ0FBQztTQUNGLENBQUM7SUFDSCxDQUFDIn0=