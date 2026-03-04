/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/offsetRange", "vs/editor/common/core/positionToOffset"], function (require, exports, assert, utils_1, offsetRange_1, positionToOffset_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('PositionOffsetTransformer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const str = '123456\nabcdef\nghijkl\nmnopqr';
        const t = new positionToOffset_1.PositionOffsetTransformer(str);
        test('getPosition', () => {
            assert.deepStrictEqual(new offsetRange_1.OffsetRange(0, str.length + 2).map(i => t.getPosition(i).toString()), [
                "(1,1)",
                "(1,2)",
                "(1,3)",
                "(1,4)",
                "(1,5)",
                "(1,6)",
                "(1,7)",
                "(2,1)",
                "(2,2)",
                "(2,3)",
                "(2,4)",
                "(2,5)",
                "(2,6)",
                "(2,7)",
                "(3,1)",
                "(3,2)",
                "(3,3)",
                "(3,4)",
                "(3,5)",
                "(3,6)",
                "(3,7)",
                "(4,1)",
                "(4,2)",
                "(4,3)",
                "(4,4)",
                "(4,5)",
                "(4,6)",
                "(4,7)",
                "(4,8)"
            ]);
        });
        test('getOffset', () => {
            for (let i = 0; i < str.length + 2; i++) {
                assert.strictEqual(t.getOffset(t.getPosition(i)), i);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zaXRpb25PZmZzZXRUcmFuc2Zvcm1lci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL2NvcmUvcG9zaXRpb25PZmZzZXRUcmFuc2Zvcm1lci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7UUFDdkMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sR0FBRyxHQUFHLGdDQUFnQyxDQUFDO1FBRTdDLE1BQU0sQ0FBQyxHQUFHLElBQUksNENBQXlCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7WUFDeEIsTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBSSx5QkFBVyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFDeEU7Z0JBQ0MsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxPQUFPO2FBQ1AsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtZQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9