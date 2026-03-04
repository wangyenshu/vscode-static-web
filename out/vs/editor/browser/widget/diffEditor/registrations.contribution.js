/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/themables", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry"], function (require, exports, codicons_1, themables_1, textModel_1, nls_1, colorRegistry_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.diffDeleteDecorationEmpty = exports.diffWholeLineDeleteDecoration = exports.diffDeleteDecoration = exports.diffAddDecorationEmpty = exports.diffWholeLineAddDecoration = exports.diffAddDecoration = exports.diffLineDeleteDecorationBackground = exports.diffLineAddDecorationBackground = exports.diffLineDeleteDecorationBackgroundWithIndicator = exports.diffLineAddDecorationBackgroundWithIndicator = exports.diffRemoveIcon = exports.diffInsertIcon = exports.diffEditorUnchangedRegionShadow = exports.diffMoveBorderActive = exports.diffMoveBorder = void 0;
    exports.diffMoveBorder = (0, colorRegistry_1.registerColor)('diffEditor.move.border', { dark: '#8b8b8b9c', light: '#8b8b8b9c', hcDark: '#8b8b8b9c', hcLight: '#8b8b8b9c', }, (0, nls_1.localize)('diffEditor.move.border', 'The border color for text that got moved in the diff editor.'));
    exports.diffMoveBorderActive = (0, colorRegistry_1.registerColor)('diffEditor.moveActive.border', { dark: '#FFA500', light: '#FFA500', hcDark: '#FFA500', hcLight: '#FFA500', }, (0, nls_1.localize)('diffEditor.moveActive.border', 'The active border color for text that got moved in the diff editor.'));
    exports.diffEditorUnchangedRegionShadow = (0, colorRegistry_1.registerColor)('diffEditor.unchangedRegionShadow', { dark: '#000000', light: '#737373BF', hcDark: '#000000', hcLight: '#737373BF', }, (0, nls_1.localize)('diffEditor.unchangedRegionShadow', 'The color of the shadow around unchanged region widgets.'));
    exports.diffInsertIcon = (0, iconRegistry_1.registerIcon)('diff-insert', codicons_1.Codicon.add, (0, nls_1.localize)('diffInsertIcon', 'Line decoration for inserts in the diff editor.'));
    exports.diffRemoveIcon = (0, iconRegistry_1.registerIcon)('diff-remove', codicons_1.Codicon.remove, (0, nls_1.localize)('diffRemoveIcon', 'Line decoration for removals in the diff editor.'));
    exports.diffLineAddDecorationBackgroundWithIndicator = textModel_1.ModelDecorationOptions.register({
        className: 'line-insert',
        description: 'line-insert',
        isWholeLine: true,
        linesDecorationsClassName: 'insert-sign ' + themables_1.ThemeIcon.asClassName(exports.diffInsertIcon),
        marginClassName: 'gutter-insert',
    });
    exports.diffLineDeleteDecorationBackgroundWithIndicator = textModel_1.ModelDecorationOptions.register({
        className: 'line-delete',
        description: 'line-delete',
        isWholeLine: true,
        linesDecorationsClassName: 'delete-sign ' + themables_1.ThemeIcon.asClassName(exports.diffRemoveIcon),
        marginClassName: 'gutter-delete',
    });
    exports.diffLineAddDecorationBackground = textModel_1.ModelDecorationOptions.register({
        className: 'line-insert',
        description: 'line-insert',
        isWholeLine: true,
        marginClassName: 'gutter-insert',
    });
    exports.diffLineDeleteDecorationBackground = textModel_1.ModelDecorationOptions.register({
        className: 'line-delete',
        description: 'line-delete',
        isWholeLine: true,
        marginClassName: 'gutter-delete',
    });
    exports.diffAddDecoration = textModel_1.ModelDecorationOptions.register({
        className: 'char-insert',
        description: 'char-insert',
        shouldFillLineOnLineBreak: true,
    });
    exports.diffWholeLineAddDecoration = textModel_1.ModelDecorationOptions.register({
        className: 'char-insert',
        description: 'char-insert',
        isWholeLine: true,
    });
    exports.diffAddDecorationEmpty = textModel_1.ModelDecorationOptions.register({
        className: 'char-insert diff-range-empty',
        description: 'char-insert diff-range-empty',
    });
    exports.diffDeleteDecoration = textModel_1.ModelDecorationOptions.register({
        className: 'char-delete',
        description: 'char-delete',
        shouldFillLineOnLineBreak: true,
    });
    exports.diffWholeLineDeleteDecoration = textModel_1.ModelDecorationOptions.register({
        className: 'char-delete',
        description: 'char-delete',
        isWholeLine: true,
    });
    exports.diffDeleteDecorationEmpty = textModel_1.ModelDecorationOptions.register({
        className: 'char-delete diff-range-empty',
        description: 'char-delete diff-range-empty',
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0cmF0aW9ucy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9yZWdpc3RyYXRpb25zLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTbkYsUUFBQSxjQUFjLEdBQUcsSUFBQSw2QkFBYSxFQUMxQyx3QkFBd0IsRUFDeEIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsV0FBVyxHQUFHLEVBQ3JGLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDhEQUE4RCxDQUFDLENBQ2xHLENBQUM7SUFFVyxRQUFBLG9CQUFvQixHQUFHLElBQUEsNkJBQWEsRUFDaEQsOEJBQThCLEVBQzlCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsR0FBRyxFQUM3RSxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxxRUFBcUUsQ0FBQyxDQUMvRyxDQUFDO0lBRVcsUUFBQSwrQkFBK0IsR0FBRyxJQUFBLDZCQUFhLEVBQzNELGtDQUFrQyxFQUNsQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxXQUFXLEdBQUcsRUFDakYsSUFBQSxjQUFRLEVBQUMsa0NBQWtDLEVBQUUsMERBQTBELENBQUMsQ0FDeEcsQ0FBQztJQUVXLFFBQUEsY0FBYyxHQUFHLElBQUEsMkJBQVksRUFBQyxhQUFhLEVBQUUsa0JBQU8sQ0FBQyxHQUFHLEVBQUUsSUFBQSxj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