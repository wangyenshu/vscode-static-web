/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/editor/contrib/smartSelect/browser/bracketSelections"], function (require, exports, arrays_1, range_1, bracketSelections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordDistance = void 0;
    class WordDistance {
        static { this.None = new class extends WordDistance {
            distance() { return 0; }
        }; }
        static async create(service, editor) {
            if (!editor.getOption(118 /* EditorOption.suggest */).localityBonus) {
                return WordDistance.None;
            }
            if (!editor.hasModel()) {
                return WordDistance.None;
            }
            const model = editor.getModel();
            const position = editor.getPosition();
            if (!service.canComputeWordRanges(model.uri)) {
                return WordDistance.None;
            }
            const [ranges] = await new bracketSelections_1.BracketSelectionRangeProvider().provideSelectionRanges(model, [position]);
            if (ranges.length === 0) {
                return WordDistance.None;
            }
            const wordRanges = await service.computeWordRanges(model.uri, ranges[0].range);
            if (!wordRanges) {
                return WordDistance.None;
            }
            // remove current word
            const wordUntilPos = model.getWordUntilPosition(position);
            delete wordRanges[wordUntilPos.word];
            return new class extends WordDistance {
                distance(anchor, item) {
                    if (!position.equals(editor.getPosition())) {
                        return 0;
                    }
                    if (item.kind === 17 /* CompletionItemKind.Keyword */) {
                        return 2 << 20;
                    }
                    const word = typeof item.label === 'string' ? item.label : item.label.label;
                    const wordLines = wordRanges[word];
                    if ((0, arrays_1.isFalsyOrEmpty)(wordLines)) {
                        return 2 << 20;
                    }
                    const idx = (0, arrays_1.binarySearch)(wordLines, range_1.Range.fromPositions(anchor), range_1.Range.compareRangesUsingStarts);
                    const bestWordRange = idx >= 0 ? wordLines[idx] : wordLines[Math.max(0, ~idx - 1)];
                    let blockDistance = ranges.length;
                    for (const range of ranges) {
                        if (!range_1.Range.containsRange(range.range, bestWordRange)) {
                            break;
                        }
                        blockDistance -= 1;
                    }
                    return blockDistance;
                }
            };
        }
    }
    exports.WordDistance = WordDistance;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZERpc3RhbmNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3dvcmREaXN0YW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBc0IsWUFBWTtpQkFFakIsU0FBSSxHQUFHLElBQUksS0FBTSxTQUFRLFlBQVk7WUFDcEQsUUFBUSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN4QixDQUFDO1FBRUYsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBNkIsRUFBRSxNQUFtQjtZQUVyRSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsZ0NBQXNCLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzNELE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDMUIsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDO1lBQzFCLENBQUM7WUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxJQUFJLGlEQUE2QixFQUFFLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNyRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDMUIsQ0FBQztZQUVELHNCQUFzQjtZQUN0QixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDMUQsT0FBTyxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXJDLE9BQU8sSUFBSSxLQUFNLFNBQVEsWUFBWTtnQkFDcEMsUUFBUSxDQUFDLE1BQWlCLEVBQUUsSUFBb0I7b0JBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQzVDLE9BQU8sQ0FBQyxDQUFDO29CQUNWLENBQUM7b0JBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSSx3Q0FBK0IsRUFBRSxDQUFDO3dCQUM5QyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2hCLENBQUM7b0JBQ0QsTUFBTSxJQUFJLEdBQUcsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7b0JBQzVFLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbkMsSUFBSSxJQUFBLHVCQUFjLEVBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzt3QkFDL0IsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNoQixDQUFDO29CQUNELE1BQU0sR0FBRyxHQUFHLElBQUEscUJBQVksRUFBQyxTQUFTLEVBQUUsYUFBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxhQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFDakcsTUFBTSxhQUFhLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbkYsSUFBSSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztvQkFDbEMsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDNUIsSUFBSSxDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsRUFBRSxDQUFDOzRCQUN0RCxNQUFNO3dCQUNQLENBQUM7d0JBQ0QsYUFBYSxJQUFJLENBQUMsQ0FBQztvQkFDcEIsQ0FBQztvQkFDRCxPQUFPLGFBQWEsQ0FBQztnQkFDdEIsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDOztJQTlERixvQ0FpRUMifQ==