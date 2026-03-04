/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/core/textEdit", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/combineTextEditInfos", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length", "vs/editor/test/common/core/random", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, range_1, textEdit_1, beforeEditPositionMapper_1, combineTextEditInfos_1, length_1, random_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRandomEditInfos = getRandomEditInfos;
    suite('combineTextEditInfos', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        for (let seed = 0; seed < 50; seed++) {
            test('test' + seed, () => {
                runTest(seed);
            });
        }
    });
    function runTest(seed) {
        const rng = random_1.Random.create(seed);
        const str = 'abcde\nfghij\nklmno\npqrst\n';
        const textModelS0 = (0, testTextModel_1.createTextModel)(str);
        const edits1 = getRandomEditInfos(textModelS0, rng.nextIntRange(1, 4), rng);
        const textModelS1 = (0, testTextModel_1.createTextModel)(textModelS0.getValue());
        textModelS1.applyEdits(edits1.map(e => toEdit(e)));
        const edits2 = getRandomEditInfos(textModelS1, rng.nextIntRange(1, 4), rng);
        const textModelS2 = (0, testTextModel_1.createTextModel)(textModelS1.getValue());
        textModelS2.applyEdits(edits2.map(e => toEdit(e)));
        const combinedEdits = (0, combineTextEditInfos_1.combineTextEditInfos)(edits1, edits2);
        for (const edit of combinedEdits) {
            const range = range_1.Range.fromPositions((0, length_1.lengthToPosition)(edit.startOffset), (0, length_1.lengthToPosition)((0, length_1.lengthAdd)(edit.startOffset, edit.newLength)));
            const value = textModelS2.getValueInRange(range);
            if (!value.match(/^(L|C|\n)*$/)) {
                throw new Error('Invalid edit: ' + value);
            }
            textModelS2.applyEdits([{
                    range,
                    text: textModelS0.getValueInRange(range_1.Range.fromPositions((0, length_1.lengthToPosition)(edit.startOffset), (0, length_1.lengthToPosition)(edit.endOffset))),
                }]);
        }
        assert.deepStrictEqual(textModelS2.getValue(), textModelS0.getValue());
        textModelS0.dispose();
        textModelS1.dispose();
        textModelS2.dispose();
    }
    function getRandomEditInfos(textModel, count, rng, disjoint = false) {
        const edits = [];
        let i = 0;
        for (let j = 0; j < count; j++) {
            edits.push(getRandomEdit(textModel, i, rng));
            i = textModel.getOffsetAt((0, length_1.lengthToPosition)(edits[j].endOffset)) + (disjoint ? 1 : 0);
        }
        return edits;
    }
    function getRandomEdit(textModel, rangeOffsetStart, rng) {
        const textModelLength = textModel.getValueLength();
        const offsetStart = rng.nextIntRange(rangeOffsetStart, textModelLength);
        const offsetEnd = rng.nextIntRange(offsetStart, textModelLength);
        const lineCount = rng.nextIntRange(0, 3);
        const columnCount = rng.nextIntRange(0, 5);
        return new beforeEditPositionMapper_1.TextEditInfo((0, length_1.positionToLength)(textModel.getPositionAt(offsetStart)), (0, length_1.positionToLength)(textModel.getPositionAt(offsetEnd)), (0, length_1.toLength)(lineCount, columnCount));
    }
    function toEdit(editInfo) {
        const l = (0, length_1.lengthToObj)(editInfo.newLength);
        let text = '';
        for (let i = 0; i < l.lineCount; i++) {
            text += 'LLL\n';
        }
        for (let i = 0; i < l.columnCount; i++) {
            text += 'C';
        }
        return new textEdit_1.SingleTextEdit(range_1.Range.fromPositions((0, length_1.lengthToPosition)(editInfo.startOffset), (0, length_1.lengthToPosition)(editInfo.endOffset)), text);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tYmluZVRleHRFZGl0SW5mb3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC9icmFja2V0UGFpckNvbG9yaXplci9jb21iaW5lVGV4dEVkaXRJbmZvcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBeURoRyxnREFRQztJQXBERCxLQUFLLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1FBQ2xDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQUVILFNBQVMsT0FBTyxDQUFDLElBQVk7UUFDNUIsTUFBTSxHQUFHLEdBQUcsZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVoQyxNQUFNLEdBQUcsR0FBRyw4QkFBOEIsQ0FBQztRQUMzQyxNQUFNLFdBQVcsR0FBRyxJQUFBLCtCQUFlLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFFekMsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzVFLE1BQU0sV0FBVyxHQUFHLElBQUEsK0JBQWUsRUFBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM1RCxXQUFXLENBQUMsVUFBVSxD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