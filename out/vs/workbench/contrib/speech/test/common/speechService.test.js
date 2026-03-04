/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/speech/common/speechService"], function (require, exports, assert, utils_1, speechService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SpeechService', () => {
        test('resolve language', async () => {
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)(undefined), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)(3), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('foo'), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('foo-bar'), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('tr-TR'), 'tr-TR');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('zh-TW'), 'zh-TW');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('auto', 'en'), 'en-US');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('auto', 'tr'), 'tr-TR');
            assert.strictEqual((0, speechService_1.speechLanguageConfigToLanguage)('auto', 'zh-tw'), 'zh-TW');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlZWNoU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc3BlZWNoL3Rlc3QvY29tbW9uL3NwZWVjaFNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUUzQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhDQUE4QixFQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4Q0FBOEIsRUFBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOENBQThCLEVBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhDQUE4QixFQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRXZFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4Q0FBOEIsRUFBQyxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOENBQThCLEVBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDhDQUE4QixFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsOENBQThCLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw4Q0FBOEIsRUFBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==