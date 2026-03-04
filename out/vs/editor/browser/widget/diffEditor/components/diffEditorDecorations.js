/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/features/movedBlocksLinesFeature", "vs/editor/browser/widget/diffEditor/registrations.contribution", "vs/editor/browser/widget/diffEditor/utils"], function (require, exports, lifecycle_1, observable_1, movedBlocksLinesFeature_1, registrations_contribution_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorDecorations = void 0;
    class DiffEditorDecorations extends lifecycle_1.Disposable {
        constructor(_editors, _diffModel, _options, widget) {
            super();
            this._editors = _editors;
            this._diffModel = _diffModel;
            this._options = _options;
            this._decorations = (0, observable_1.derived)(this, (reader) => {
                const diff = this._diffModel.read(reader)?.diff.read(reader);
                if (!diff) {
                    return null;
                }
                const movedTextToCompare = this._diffModel.read(reader).movedTextToCompare.read(reader);
                const renderIndicators = this._options.renderIndicators.read(reader);
                const showEmptyDecorations = this._options.showEmptyDecorations.read(reader);
                const originalDecorations = [];
                const modifiedDecorations = [];
                if (!movedTextToCompare) {
                    for (const m of diff.mappings) {
                        if (!m.lineRangeMapping.original.isEmpty) {
                            originalDecorations.push({ range: m.lineRangeMapping.original.toInclusiveRange(), options: renderIndicators ? registrations_contribution_1.diffLineDeleteDecorationBackgroundWithIndicator : registrations_contribution_1.diffLineDeleteDecorationBackground });
                        }
                        if (!m.lineRangeMapping.modified.isEmpty) {
                            modifiedDecorations.push({ range: m.lineRangeMapping.modified.toInclusiveRange(), options: renderIndicators ? registrations_contribution_1.diffLineAddDecorationBackgroundWithIndicator : registrations_contribution_1.diffLineAddDecorationBackground });
                        }
                        if (m.lineRangeMapping.modified.isEmpty || m.lineRangeMapping.original.isEmpty) {
                            if (!m.lineRangeMapping.original.isEmpty) {
                                originalDecorations.push({ range: m.lineRangeMapping.original.toInclusiveRange(), options: registrations_contribution_1.diffWholeLineDeleteDecoration });
                            }
                            if (!m.lineRangeMapping.modified.isEmpty) {
                                modifiedDecorations.push({ range: m.lineRangeMapping.modified.toInclusiveRange(), options: registrations_contribution_1.diffWholeLineAddDecoration });
                            }
                        }
                        else {
                            for (const i of m.lineRangeMapping.innerChanges || []) {
                                // Don't show empty markers outside the line range
                                if (m.lineRangeMapping.original.contains(i.originalRange.startLineNumber)) {
                                    originalDecorations.push({ range: i.originalRange, options: (i.originalRange.isEmpty() && showEmptyDecorations) ? registrations_contribution_1.diffDeleteDecorationEmpty : registrations_contribution_1.diffDeleteDecoration });
                                }
                                if (m.lineRangeMapping.modified.contains(i.modifiedRange.startLineNumber)) {
                                    modifiedDecorations.push({ range: i.modifiedRange, options: (i.modifiedRange.isEmpty() && showEmptyDecorations) ? registrations_contribution_1.diffAddDecorationEmpty : registrations_contribution_1.diffAddDecoration });
                                }
                            }
                        }
                    }
                }
                if (movedTextToCompare) {
                    for (const m of movedTextToCompare.changes) {
                        const fullRangeOriginal = m.original.toInclusiveRange();
                        if (fullRangeOriginal) {
                            originalDecorations.push({ range: fullRangeOriginal, options: renderIndicators ? registrations_contribution_1.diffLineDeleteDecorationBackgroundWithIndicator : registrations_contribution_1.diffLineDeleteDecorationBackground });
                        }
                        const fullRangeModified = m.modified.toInclusiveRange();
                        if (fullRangeModified) {
                            modifiedDecorations.push({ range: fullRangeModified, options: renderIndicators ? registrations_contribution_1.diffLineAddDecorationBackgroundWithIndicator : registrations_contribution_1.diffLineAddDecorationBackground });
                        }
                        for (const i of m.innerChanges || []) {
                            originalDecorations.push({ range: i.originalRange, options: registrations_contribution_1.diffDeleteDecoration });
                            modifiedDecorations.push({ range: i.modifiedRange, options: registrations_contribution_1.diffAddDecoration });
                        }
                    }
                }
                const activeMovedText = this._diffModel.read(reader).activeMovedText.read(reader);
                for (const m of diff.movedTexts) {
                    originalDecorations.push({
                        range: m.lineRangeMapping.original.toInclusiveRange(), options: {
                            description: 'moved',
                            blockClassName: 'movedOriginal' + (m === activeMovedText ? ' currentMove' : ''),
                            blockPadding: [movedBlocksLinesFeature_1.MovedBlocksLinesFeature.movedCodeBlockPadding, 0, movedBlocksLinesFeature_1.MovedBlocksLinesFeature.movedCodeBlockPadding, movedBlocksLinesFeature_1.MovedBlocksLinesFeature.movedCodeBlockPadding],
                        }
                    });
                    modifiedDecorations.push({
                        range: m.lineRangeMapping.modified.toInclusiveRange(), options: {
                            description: 'moved',
                            blockClassName: 'movedModified' + (m === activeMovedText ? ' currentMove' : ''),
                            blockPadding: [4, 0, 4, 4],
                        }
                    });
                }
                return { originalDecorations, modifiedDecorations };
            });
            this._register((0, utils_1.applyObservableDecorations)(this._editors.original, this._decorations.map(d => d?.originalDecorations || [])));
            this._register((0, utils_1.applyObservableDecorations)(this._editors.modified, this._decorations.map(d => d?.modifiedDecorations || [])));
        }
    }
    exports.DiffEditorDecorations = DiffEditorDecorations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvckRlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L2RpZmZFZGl0b3IvY29tcG9uZW50cy9kaWZmRWRpdG9yRGVjb3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEscUJBQXNCLFNBQVEsc0JBQVU7UUFDcEQsWUFDa0IsUUFBMkIsRUFDM0IsVUFBd0QsRUFDeEQsUUFBMkIsRUFDNUMsTUFBd0I7WUFFeEIsS0FBSyxFQUFFLENBQUM7WUFMUyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixlQUFVLEdBQVYsVUFBVSxDQUE4QztZQUN4RCxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQVM1QixpQkFBWSxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDeEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3pGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JFLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0Is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