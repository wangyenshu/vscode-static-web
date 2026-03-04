/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/assert", "vs/editor/common/services/editorWorker", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, assert_1, editorWorker_1, configuration_1, lineRange_1, mapping_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeDiffComputer = void 0;
    exports.toLineRange = toLineRange;
    exports.toRangeMapping = toRangeMapping;
    let MergeDiffComputer = class MergeDiffComputer {
        constructor(editorWorkerService, configurationService) {
            this.editorWorkerService = editorWorkerService;
            this.configurationService = configurationService;
            this.mergeAlgorithm = (0, utils_1.observableConfigValue)('mergeEditor.diffAlgorithm', 'advanced', this.configurationService)
                .map(v => v === 'smart' ? 'legacy' : v === 'experimental' ? 'advanced' : v);
        }
        async computeDiff(textModel1, textModel2, reader) {
            const diffAlgorithm = this.mergeAlgorithm.read(reader);
            const inputVersion = textModel1.getVersionId();
            const outputVersion = textModel2.getVersionId();
            const result = await this.editorWorkerService.computeDiff(textModel1.uri, textModel2.uri, {
                ignoreTrimWhitespace: false,
                maxComputationTimeMs: 0,
                computeMoves: false,
            }, diffAlgorithm);
            if (!result) {
                throw new Error('Diff computation failed');
            }
            if (textModel1.isDisposed() || textModel2.isDisposed()) {
                return { diffs: null };
            }
            const changes = result.changes.map(c => new mapping_1.DetailedLineRangeMapping(toLineRange(c.original), textModel1, toLineRange(c.modified), textModel2, c.innerChanges?.map(ic => toRangeMapping(ic))));
            const newInputVersion = textModel1.getVersionId();
            const newOutputVersion = textModel2.getVersionId();
            if (inputVersion !== newInputVersion || outputVersion !== newOutputVersion) {
                return { diffs: null };
            }
            (0, assert_1.assertFn)(() => {
                for (const c of changes) {
                    const inputRange = c.inputRange;
                    const outputRange = c.outputRange;
                    const inputTextModel = c.inputTextModel;
                    const outputTextModel = c.outputTextModel;
                    for (const map of c.rangeMappings) {
                        let inputRangesValid = inputRange.startLineNumber - 1 <= map.inputRange.startLineNumber
                            && map.inputRange.endLineNumber <= inputRange.endLineNumberExclusive;
                        if (inputRangesValid && map.inputRange.startLineNumber === inputRange.startLineNumber - 1) {
                            inputRangesValid = map.inputRange.endColumn >= inputTextModel.getLineMaxColumn(map.inputRange.startLineNumber);
                        }
                        if (inputRangesValid && map.inputRange.endLineNumber === inputRange.endLineNumberExclusive) {
                            inputRangesValid = map.inputRange.endColumn === 1;
                        }
                        let outputRangesValid = outputRange.startLineNumber - 1 <= map.outputRange.startLineNumber
                            && map.outputRange.endLineNumber <= outputRange.endLineNumberExclusive;
                        if (outputRangesValid && map.outputRange.startLineNumber === outputRange.startLineNumber - 1) {
                            outputRangesValid = map.outputRange.endColumn >= outputTextModel.getLineMaxColumn(map.outputRange.endLineNumber);
                        }
                        if (outputRangesValid && map.outputRange.endLineNumber === outputRange.endLineNumberExclusive) {
                            outputRangesValid = map.outputRange.endColumn === 1;
                        }
                        if (!inputRangesValid || !outputRangesValid) {
                            return false;
                        }
                    }
                }
                return changes.length === 0 || (changes[0].inputRange.startLineNumber === changes[0].outputRange.startLineNumber &&
                    (0, assert_1.checkAdjacentItems)(changes, (m1, m2) => m2.inputRange.startLineNumber - m1.inputRange.endLineNumberExclusive === m2.outputRange.startLineNumber - m1.outputRange.endLineNumberExclusive &&
                        // There has to be an unchanged line in between (otherwise both diffs should have been joined)
                        m1.inputRange.endLineNumberExclusive < m2.inputRange.startLineNumber &&
                        m1.outputRange.endLineNumberExclusive < m2.outputRange.startLineNumber));
            });
            return {
                diffs: changes
            };
        }
    };
    exports.MergeDiffComputer = MergeDiffComputer;
    exports.MergeDiffComputer = MergeDiffComputer = __decorate([
        __param(0, editorWorker_1.IEditorWorkerService),
        __param(1, configuration_1.IConfigurationService)
    ], MergeDiffComputer);
    function toLineRange(range) {
        return new lineRange_1.LineRange(range.startLineNumber, range.length);
    }
    function toRangeMapping(mapping) {
        return new mapping_1.RangeMapping(mapping.originalRange, mapping.modifiedRange);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkNvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci9tb2RlbC9kaWZmQ29tcHV0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0hoRyxrQ0FFQztJQUVELHdDQUVDO0lBekdNLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWlCO1FBSzdCLFlBQ3VCLG1CQUEwRCxFQUN6RCxvQkFBNEQ7WUFENUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN4Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBTm5FLG1CQUFjLEdBQUcsSUFBQSw2QkFBcUIsRUFDdEQsMkJBQTJCLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztpQkFDbEUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssY0FBYyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBTTdFLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLFVBQXNCLEVBQUUsVUFBc0IsRUFBRSxNQUFlO1lBQ2hGLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMvQyxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFaEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FB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