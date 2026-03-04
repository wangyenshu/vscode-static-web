/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/services/textMate/browser/arrayOperation"], function (require, exports, assert, utils_1, arrayOperation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('array operation', () => {
        function seq(start, end) {
            const result = [];
            for (let i = start; i < end; i++) {
                result.push(i);
            }
            return result;
        }
        test('simple', () => {
            const edit = new arrayOperation_1.ArrayEdit([
                new arrayOperation_1.SingleArrayEdit(4, 3, 2),
                new arrayOperation_1.SingleArrayEdit(8, 0, 2),
                new arrayOperation_1.SingleArrayEdit(9, 2, 0),
            ]);
            const arr = seq(0, 15).map(x => `item${x}`);
            const newArr = arr.slice();
            edit.applyToArray(newArr);
            assert.deepStrictEqual(newArr, [
                'item0',
                'item1',
                'item2',
                'item3',
                undefined,
                undefined,
                'item7',
                undefined,
                undefined,
                'item8',
                'item11',
                'item12',
                'item13',
                'item14',
            ]);
            const transformer = new arrayOperation_1.MonotonousIndexTransformer(edit);
            assert.deepStrictEqual(seq(0, 15).map((x) => {
                const t = transformer.transform(x);
                let r = `arr[${x}]: ${arr[x]} -> `;
                if (t !== undefined) {
                    r += `newArr[${t}]: ${newArr[t]}`;
                }
                else {
                    r += 'undefined';
                }
                return r;
            }), [
                'arr[0]: item0 -> newArr[0]: item0',
                'arr[1]: item1 -> newArr[1]: item1',
                'arr[2]: item2 -> newArr[2]: item2',
                'arr[3]: item3 -> newArr[3]: item3',
                'arr[4]: item4 -> undefined',
                'arr[5]: item5 -> undefined',
                'arr[6]: item6 -> undefined',
                'arr[7]: item7 -> newArr[6]: item7',
                'arr[8]: item8 -> newArr[9]: item8',
                'arr[9]: item9 -> undefined',
                'arr[10]: item10 -> undefined',
                'arr[11]: item11 -> newArr[10]: item11',
                'arr[12]: item12 -> newArr[11]: item12',
                'arr[13]: item13 -> newArr[12]: item13',
                'arr[14]: item14 -> newArr[13]: item14',
            ]);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlPcGVyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0TWF0ZS90ZXN0L2Jyb3dzZXIvYXJyYXlPcGVyYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBQzdCLFNBQVMsR0FBRyxDQUFDLEtBQWEsRUFBRSxHQUFXO1lBQ3RDLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztZQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBQ25CLE1BQU0sSUFBSSxHQUFHLElBQUksMEJBQVMsQ0FBQztnQkFDMUIsSUFBSSxnQ0FBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLGdDQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzVCLElBQUksZ0NBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUM1QixDQUFDLENBQUM7WUFFSCxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1QyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRTtnQkFDOUIsT0FBTztnQkFDUCxPQUFPO2dCQUNQLE9BQU87Z0JBQ1AsT0FBTztnQkFDUCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsT0FBTztnQkFDUCxTQUFTO2dCQUNULFNBQVM7Z0JBQ1QsT0FBTztnQkFDUCxRQUFRO2dCQUNSLFFBQVE7Z0JBQ1IsUUFBUTtnQkFDUixRQUFRO2FBQ1IsQ0FBQyxDQUFDO1lBRUgsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQ0FBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsZUFBZSxDQUNyQixHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNwQixNQUFNLENBQUMsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDbkMsSUFBSSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3JCLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLENBQUMsSUFBSSxXQUFXLENBQUM7Z0JBQ2xCLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDLENBQUMsRUFDRjtnQkFDQyxtQ0FBbUM7Z0JBQ25DLG1DQUFtQztnQkFDbkMsbUNBQW1DO2dCQUNuQyxtQ0FBbUM7Z0JBQ25DLDRCQUE0QjtnQkFDNUIsNEJBQTRCO2dCQUM1Qiw0QkFBNEI7Z0JBQzVCLG1DQUFtQztnQkFDbkMsbUNBQW1DO2dCQUNuQyw0QkFBNEI7Z0JBQzVCLDhCQUE4QjtnQkFDOUIsdUNBQXVDO2dCQUN2Qyx1Q0FBdUM7Z0JBQ3ZDLHVDQUF1QztnQkFDdkMsdUNBQXVDO2FBQ3ZDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=