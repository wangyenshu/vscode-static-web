/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/linkedList", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, linkedList_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketSelectionRangeProvider = void 0;
    class BracketSelectionRangeProvider {
        async provideSelectionRanges(model, positions) {
            const result = [];
            for (const position of positions) {
                const bucket = [];
                result.push(bucket);
                const ranges = new Map();
                await new Promise(resolve => BracketSelectionRangeProvider._bracketsRightYield(resolve, 0, model, position, ranges));
                await new Promise(resolve => BracketSelectionRangeProvider._bracketsLeftYield(resolve, 0, model, position, ranges, bucket));
            }
            return result;
        }
        static { this._maxDuration = 30; }
        static { this._maxRounds = 2; }
        static _bracketsRightYield(resolve, round, model, pos, ranges) {
            const counts = new Map();
            const t1 = Date.now();
            while (true) {
                if (round >= BracketSelectionRangeProvider._maxRounds) {
                    resolve();
                    break;
                }
                if (!pos) {
                    resolve();
                    break;
                }
                const bracket = model.bracketPairs.findNextBracket(pos);
                if (!bracket) {
                    resolve();
                    break;
                }
                const d = Date.now() - t1;
                if (d > BracketSelectionRangeProvider._maxDuration) {
                    setTimeout(() => BracketSelectionRangeProvider._bracketsRightYield(resolve, round + 1, model, pos, ranges));
                    break;
                }
                if (bracket.bracketInfo.isOpeningBracket) {
                    const key = bracket.bracketInfo.bracketText;
                    // wait for closing
                    const val = counts.has(key) ? counts.get(key) : 0;
                    counts.set(key, val + 1);
                }
                else {
                    const key = bracket.bracketInfo.getOpeningBrackets()[0].bracketText;
                    // process closing
                    let val = counts.has(key) ? counts.get(key) : 0;
                    val -= 1;
                    counts.set(key, Math.max(0, val));
                    if (val < 0) {
                        let list = ranges.get(key);
                        if (!list) {
                            list = new linkedList_1.LinkedList();
                            ranges.set(key, list);
                        }
                        list.push(bracket.range);
                    }
                }
                pos = bracket.range.getEndPosition();
            }
        }
        static _bracketsLeftYield(resolve, round, model, pos, ranges, bucket) {
            const counts = new Map();
            const t1 = Date.now();
            while (true) {
                if (round >= BracketSelectionRangeProvider._maxRounds && ranges.size === 0) {
                    resolve();
                    break;
                }
                if (!pos) {
                    resolve();
                    break;
                }
                const bracket = model.bracketPairs.findPrevBracket(pos);
                if (!bracket) {
                    resolve();
                    break;
                }
                const d = Date.now() - t1;
                if (d > BracketSelectionRangeProvider._maxDuration) {
                    setTimeout(() => BracketSelectionRangeProvider._bracketsLeftYield(resolve, round + 1, model, pos, ranges, bucket));
                    break;
                }
                if (!bracket.bracketInfo.isOpeningBracket) {
                    const key = bracket.bracketInfo.getOpeningBrackets()[0].bracketText;
                    // wait for opening
                    const val = counts.has(key) ? counts.get(key) : 0;
                    counts.set(key, val + 1);
                }
                else {
                    const key = bracket.bracketInfo.bracketText;
                    // opening
                    let val = counts.has(key) ? counts.get(key) : 0;
                    val -= 1;
                    counts.set(key, Math.max(0, val));
                    if (val < 0) {
                        const list = ranges.get(key);
                        if (list) {
                            const closing = list.shift();
                            if (list.size === 0) {
                                ranges.delete(key);
                            }
                            const innerBracket = range_1.Range.fromPositions(bracket.range.getEndPosition(), closing.getStartPosition());
                            const outerBracket = range_1.Range.fromPositions(bracket.range.getStartPosition(), closing.getEndPosition());
                            bucket.push({ range: innerBracket });
                            bucket.push({ range: outerBracket });
                            BracketSelectionRangeProvider._addBracketLeading(model, outerBracket, bucket);
                        }
                    }
                }
                pos = bracket.range.getStartPosition();
            }
        }
        static _addBracketLeading(model, bracket, bucket) {
            if (bracket.startLineNumber === bracket.endLineNumber) {
                return;
            }
            // xxxxxxxx {
            //
            // }
            const startLine = bracket.startLineNumber;
            const column = model.getLineFirstNonWhitespaceColumn(startLine);
            if (column !== 0 && column !== bracket.startColumn) {
                bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(startLine, column), bracket.getEndPosition()) });
                bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(startLine, 1), bracket.getEndPosition()) });
            }
            // xxxxxxxx
            // {
            //
            // }
            const aboveLine = startLine - 1;
            if (aboveLine > 0) {
                const column = model.getLineFirstNonWhitespaceColumn(aboveLine);
                if (column === bracket.startColumn && column !== model.getLineLastNonWhitespaceColumn(aboveLine)) {
                    bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(aboveLine, column), bracket.getEndPosition()) });
                    bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(aboveLine, 1), bracket.getEndPosition()) });
                }
            }
        }
    }
    exports.BracketSelectionRangeProvider = BracketSelectionRangeProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldFNlbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zbWFydFNlbGVjdC9icm93c2VyL2JyYWNrZXRTZWxlY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLDZCQUE2QjtRQUV6QyxLQUFLLENBQUMsc0JBQXNCLENBQUMsS0FBaUIsRUFBRSxTQUFxQjtZQUNwRSxNQUFNLE1BQU0sR0FBdUIsRUFBRSxDQUFDO1lBRXRDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sTUFBTSxHQUFxQixFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXBCLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO2dCQUNwRCxNQUFNLElBQUksT0FBTyxDQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUMsNkJBQTZCLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQzNILE1BQU0sSUFBSSxPQUFPLENBQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbkksQ0FBQztZQUVELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztpQkFFYSxpQkFBWSxHQUFHLEVBQUUsQ0FBQztpQkFDUixlQUFVLEdBQUcsQ0FBQyxDQUFDO1FBRS9CLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFtQixFQUFFLEtBQWEsRUFB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