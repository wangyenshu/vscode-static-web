/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/contrib/hover/browser/hoverActions", "vs/editor/browser/editorExtensions", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/hover/browser/markerHoverParticipant", "vs/editor/contrib/hover/browser/hoverController", "vs/css!./hover"], function (require, exports, hoverActions_1, editorExtensions_1, colorRegistry_1, themeService_1, hoverTypes_1, markdownHoverParticipant_1, markerHoverParticipant_1, hoverController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(hoverController_1.HoverController.ID, hoverController_1.HoverController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.ShowOrFocusHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.ShowDefinitionPreviewHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.ScrollUpHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.ScrollDownHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.ScrollLeftHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.ScrollRightHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.PageUpHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.PageDownHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.GoToTopHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.GoToBottomHoverAction);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.IncreaseHoverVerbosityLevel);
    (0, editorExtensions_1.registerEditorAction)(hoverActions_1.DecreaseHoverVerbosityLevel);
    hoverTypes_1.HoverParticipantRegistry.register(markdownHoverParticipant_1.MarkdownHoverParticipant);
    hoverTypes_1.HoverParticipantRegistry.register(markerHoverParticipant_1.MarkerHoverParticipant);
    // theming
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-editor .monaco-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .monaco-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .monaco-hover hr { border-bottom: 0px solid ${hoverBorder.transparent(0.5)}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9ob3Zlci9icm93c2VyL2hvdmVyQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLElBQUEsNkNBQTBCLEVBQUMsaUNBQWUsQ0FBQyxFQUFFLEVBQUUsaUNBQWUsaUVBQXlELENBQUM7SUFDeEgsSUFBQSx1Q0FBb0IsRUFBQyxxQ0FBc0IsQ0FBQyxDQUFDO0lBQzdDLElBQUEsdUNBQW9CLEVBQUMsK0NBQWdDLENBQUMsQ0FBQztJQUN2RCxJQUFBLHVDQUFvQixFQUFDLGtDQUFtQixDQUFDLENBQUM7SUFDMUMsSUFBQSx1Q0FBb0IsRUFBQyxvQ0FBcUIsQ0FBQyxDQUFDO0lBQzVDLElBQUEsdUNBQW9CLEVBQUMsb0NBQXFCLENBQUMsQ0FBQztJQUM1QyxJQUFBLHVDQUFvQixFQUFDLHFDQUFzQixDQUFDLENBQUM7SUFDN0MsSUFBQSx1Q0FBb0IsRUFBQyxnQ0FBaUIsQ0FBQyxDQUFDO0lBQ3hDLElBQUEsdUNBQW9CLEVBQUMsa0NBQW1CLENBQUMsQ0FBQztJQUMxQyxJQUFBLHVDQUFvQixFQUFDLGlDQUFrQixDQUFDLENBQUM7SUFDekMsSUFBQSx1Q0FBb0IsRUFBQyxvQ0FBcUIsQ0FBQyxDQUFDO0lBQzVDLElBQUEsdUNBQW9CLEVBQUMsMENBQTJCLENBQUMsQ0FBQztJQUNsRCxJQUFBLHVDQUFvQixFQUFDLDBDQUEyQixDQUFDLENBQUM7SUFDbEQscUNBQXdCLENBQUMsUUFBUSxDQUFDLG1EQUF3QixDQUFDLENBQUM7SUFDNUQscUNBQXdCLENBQUMsUUFBUSxDQUFDLCtDQUFzQixDQUFDLENBQUM7SUFFMUQsVUFBVTtJQUNWLElBQUEseUNBQTBCLEVBQUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7UUFDL0MsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUIsQ0FBQyxDQUFDO1FBQ3RELElBQUksV0FBVyxFQUFFLENBQUM7WUFDakIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpR0FBaUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEosU0FBUyxDQUFDLE9BQU8sQ0FBQywyREFBMkQsV0FBVyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEgsU0FBUyxDQUFDLE9BQU8sQ0FBQyw4REFBOEQsV0FBVyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEgsQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDIn0=