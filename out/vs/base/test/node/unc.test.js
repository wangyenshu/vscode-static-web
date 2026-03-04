/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/node/unc", "vs/base/test/common/utils"], function (require, exports, assert_1, unc_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UNC', () => {
        test('getUNCHost', () => {
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)(undefined), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)(null), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('/'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('/foo'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('c:'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('c:\\'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('c:\\foo'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('c:\\foo\\\\server\\path'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\localhost'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\localhost\\'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\localhost\\a'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?'), undefined);
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.\\localhost'), '.');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?\\localhost'), '?');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.\\UNC\\localhost'), '.');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?\\UNC\\localhost'), '?');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.\\UNC\\localhost\\'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?\\UNC\\localhost\\'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\.\\UNC\\localhost\\a'), 'localhost');
            (0, assert_1.strictEqual)((0, unc_1.getUNCHost)('\\\\?\\UNC\\localhost\\a'), 'localhost');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5jLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3Qvbm9kZS91bmMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtRQUVqQixJQUFJLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUV2QixJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlDLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFekMsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxHQUFHLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4QyxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRTNDLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekMsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMzQyxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzlDLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMseUJBQXlCLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUU5RCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDM0MsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxlQUFlLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVwRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLGlCQUFpQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDeEQsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxrQkFBa0IsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRXpELElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsT0FBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDNUMsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUU1QyxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLGtCQUFrQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDakQsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyxrQkFBa0IsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRWpELElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMsdUJBQXVCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN0RCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLHVCQUF1QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFdEQsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQyx5QkFBeUIsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2hFLElBQUEsb0JBQVcsRUFBQyxJQUFBLGdCQUFVLEVBQUMseUJBQXlCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVoRSxJQUFBLG9CQUFXLEVBQUMsSUFBQSxnQkFBVSxFQUFDLDBCQUEwQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDakUsSUFBQSxvQkFBVyxFQUFDLElBQUEsZ0JBQVUsRUFBQywwQkFBMEIsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2xFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=