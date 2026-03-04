/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/contrib/colorPicker/browser/colorDetector", "vs/editor/contrib/colorPicker/browser/colorHoverParticipant", "vs/editor/contrib/hover/browser/hoverController", "vs/editor/contrib/hover/browser/hoverTypes"], function (require, exports, lifecycle_1, editorExtensions_1, range_1, colorDetector_1, colorHoverParticipant_1, hoverController_1, hoverTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorContribution = void 0;
    class ColorContribution extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.colorContribution'; }
        static { this.RECOMPUTE_TIME = 1000; } // ms
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._register(_editor.onMouseDown((e) => this.onMouseDown(e)));
        }
        dispose() {
            super.dispose();
        }
        onMouseDown(mouseEvent) {
            const colorDecoratorsActivatedOn = this._editor.getOption(148 /* EditorOption.colorDecoratorsActivatedOn */);
            if (colorDecoratorsActivatedOn !== 'click' && colorDecoratorsActivatedOn !== 'clickAndHover') {
                return;
            }
            const target = mouseEvent.target;
            if (target.type !== 6 /* MouseTargetType.CONTENT_TEXT */) {
                return;
            }
            if (!target.detail.injectedText) {
                return;
            }
            if (target.detail.injectedText.options.attachedData !== colorDetector_1.ColorDecorationInjectedTextMarker) {
                return;
            }
            if (!target.range) {
                return;
            }
            const hoverController = this._editor.getContribution(hoverController_1.HoverController.ID);
            if (!hoverController) {
                return;
            }
            if (!hoverController.isColorPickerVisible) {
                const range = new range_1.Range(target.range.startLineNumber, target.range.startColumn + 1, target.range.endLineNumber, target.range.endColumn + 1);
                hoverController.showContentHover(range, 1 /* HoverStartMode.Immediate */, 0 /* HoverStartSource.Mouse */, false, true);
            }
        }
    }
    exports.ColorContribution = ColorContribution;
    (0, editorExtensions_1.registerEditorContribution)(ColorContribution.ID, ColorContribution, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    hoverTypes_1.HoverParticipantRegistry.register(colorHoverParticipant_1.ColorHoverParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JDb250cmlidXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29sb3JQaWNrZXIvYnJvd3Nlci9jb2xvckNvbnRyaWJ1dGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQWEsaUJBQWtCLFNBQVEsc0JBQVU7aUJBRXpCLE9BQUUsR0FBVyxrQ0FBa0MsQ0FBQztpQkFFdkQsbUJBQWMsR0FBRyxJQUFJLENBQUMsR0FBQyxLQUFLO1FBRTVDLFlBQTZCLE9BQW9CO1lBRWhELEtBQUssRUFBRSxDQUFDO1lBRm9CLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFHaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBRVEsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRU8sV0FBVyxDQUFDLFVBQTZCO1lBRWhELE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLG1EQUF5QyxDQUFDO1lBQ25HLElBQUksMEJBQTBCLEtBQUssT0FBTyxJQUFJLDBCQUEwQixLQUFLLGVBQWUsRUFBRSxDQUFDO2dCQUM5RixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFFakMsSUFBSSxNQUFNLENBQUMsSUFBSSx5Q0FBaUMsRUFBRSxDQUFDO2dCQUNsRCxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNqQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFlBQVksS0FBSyxpREFBaUMsRUFBRSxDQUFDO2dCQUMzRixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQWtCLGlDQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUYsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN0QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxlQUFlLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUM1SSxlQUFlLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxvRUFBb0QsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hHLENBQUM7UUFDRixDQUFDOztJQWpERiw4Q0FrREM7SUFFRCxJQUFBLDZDQUEwQixFQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSxpQkFBaUIsaUVBQXlELENBQUM7SUFDNUgscUNBQXdCLENBQUMsUUFBUSxDQUFDLDZDQUFxQixDQUFDLENBQUMifQ==