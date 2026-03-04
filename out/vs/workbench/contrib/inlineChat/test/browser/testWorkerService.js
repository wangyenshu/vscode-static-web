var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/test/common/mock", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/base/common/types", "vs/editor/common/services/editorSimpleWorker", "vs/editor/common/core/lineRange", "vs/editor/common/diff/linesDiffComputer", "vs/editor/common/diff/rangeMapping"], function (require, exports, mock_1, range_1, model_1, types_1, editorSimpleWorker_1, lineRange_1, linesDiffComputer_1, rangeMapping_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWorkerService = void 0;
    let TestWorkerService = class TestWorkerService extends (0, mock_1.mock)() {
        constructor(_modelService) {
            super();
            this._modelService = _modelService;
            this._worker = new editorSimpleWorker_1.EditorSimpleWorker(null, null);
        }
        async computeMoreMinimalEdits(resource, edits, pretty) {
            return undefined;
        }
        async computeDiff(original, modified, options, algorithm) {
            const originalModel = this._modelService.getModel(original);
            const modifiedModel = this._modelService.getModel(modified);
            (0, types_1.assertType)(originalModel);
            (0, types_1.assertType)(modifiedModel);
            this._worker.acceptNewModel({
                url: originalModel.uri.toString(),
                versionId: originalModel.getVersionId(),
                lines: originalModel.getLinesContent(),
                EOL: originalModel.getEOL(),
            });
            this._worker.acceptNewModel({
                url: modifiedModel.uri.toString(),
                versionId: modifiedModel.getVersionId(),
                lines: modifiedModel.getLinesContent(),
                EOL: modifiedModel.getEOL(),
            });
            const result = await this._worker.computeDiff(originalModel.uri.toString(), modifiedModel.uri.toString(), options, algorithm);
            if (!result) {
                return result;
            }
            // Convert from space efficient JSON data to rich objects.
            const diff = {
                identical: result.identical,
                quitEarly: result.quitEarly,
                changes: toLineRangeMappings(result.changes),
                moves: result.moves.map(m => new linesDiffComputer_1.MovedText(new rangeMapping_1.LineRangeMapping(new lineRange_1.LineRange(m[0], m[1]), new lineRange_1.LineRange(m[2], m[3])), toLineRangeMappings(m[4])))
            };
            return diff;
            function toLineRangeMappings(changes) {
                return changes.map((c) => new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(c[0], c[1]), new lineRange_1.LineRange(c[2], c[3]), c[4]?.map((c) => new rangeMapping_1.RangeMapping(new range_1.Range(c[0], c[1], c[2], c[3]), new range_1.Range(c[4], c[5], c[6], c[7])))));
            }
        }
    };
    exports.TestWorkerService = TestWorkerService;
    exports.TestWorkerService = TestWorkerService = __decorate([
        __param(0, model_1.IModelService)
    ], TestWorkerService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFdvcmtlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L3Rlc3QvYnJvd3Nlci90ZXN0V29ya2VyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBa0JPLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsSUFBQSxXQUFJLEdBQXdCO1FBSWxFLFlBQTJCLGFBQTZDO1lBQ3ZFLEtBQUssRUFBRSxDQUFDO1lBRG1DLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBRnZELFlBQU8sR0FBRyxJQUFJLHVDQUFrQixDQUFDLElBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUkvRCxDQUFDO1FBRVEsS0FBSyxDQUFDLHVCQUF1QixDQUFDLFFBQWEsRUFBRSxLQUFvQyxFQUFFLE1BQTRCO1lBQ3ZILE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFUSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQWEsRUFBRSxRQUFhLEVBQUUsT0FBcUMsRUFBRSxTQUE0QjtZQUUzSCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU1RCxJQUFBLGtCQUFVLEVBQUMsYUFBYSxDQUFDLENBQUM7WUFDMUIsSUFBQSxrQkFBVSxFQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRTFCLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDO2dCQUMzQixHQUFHLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUU7Z0JBQ2pDLFNBQVMsRUFBRSxhQUFhLENBQUMsWUFBWSxFQUFF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