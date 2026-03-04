/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/naturalLanguage/korean", "vs/base/test/common/utils"], function (require, exports, assert_1, korean_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getKoreanAltCharsForString(text) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const chars = (0, korean_1.getKoreanAltChars)(text.charCodeAt(i));
            if (chars) {
                result += String.fromCharCode(...Array.from(chars));
            }
            else {
                result += text.charAt(i);
            }
        }
        return result;
    }
    suite('Korean', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('getKoreanAltChars', () => {
            test('Modern initial consonants', () => {
                const cases = new Map([
                    ['ᄀ', 'r'],
                    ['ᄁ', 'R'],
                    ['ᄂ', 's'],
                    ['ᄃ', 'e'],
                    ['ᄄ', 'E'],
                    ['ᄅ', 'f'],
                    ['ᄆ', 'a'],
                    ['ᄇ', 'q'],
                    ['ᄈ', 'Q'],
                    ['ᄉ', 't'],
                    ['ᄊ', 'T'],
                    ['ᄋ', 'd'],
                    ['ᄌ', 'w'],
                    ['ᄍ', 'W'],
                    ['ᄎ', 'c'],
                    ['ᄏ', 'z'],
                    ['ᄐ', 'x'],
                    ['ᄑ', 'v'],
                    ['ᄒ', 'g'],
                ]);
                for (const [hangul, alt] of cases.entries()) {
                    (0, assert_1.strictEqual)(getKoreanAltCharsForString(hangul), alt, `"${hangul}" should result in "${alt}"`);
                }
            });
            test('Modern latter consonants', () => {
                const cases = new Map([
                    ['ᆨ', 'r'],
                    ['ᆩ', 'R'],
                    ['ᆪ', 'rt'],
                    ['ᆫ', 's'],
                    ['ᆬ', 'sw'],
                    ['ᆭ', 'sg'],
                    ['ᆮ', 'e'],
                    ['ᆯ', 'f'],
                    ['ᆰ', 'fr'],
                    ['ᆱ', 'fa'],
                    ['ᆲ', 'fq'],
                    ['ᆳ', 'ft'],
                    ['ᆴ', 'fx'],
                    ['ᆵ', 'fv'],
                    ['ᆶ', 'fg'],
                    ['ᆷ', 'a'],
                    ['ᆸ', 'q'],
                    ['ᆹ', 'qt'],
                    ['ᆺ', 't'],
                    ['ᆻ', 'T'],
                    ['ᆼ', 'd'],
                    ['ᆽ', 'w'],
                    ['ᆾ', 'c'],
                    ['ᆿ', 'z'],
                    ['ᇀ', 'x'],
                    ['ᇁ', 'v'],
                    ['ᇂ', 'g'],
                ]);
                for (const [hangul, alt] of cases.entries()) {
                    (0, assert_1.strictEqual)(getKoreanAltCharsForString(hangul), alt, `"${hangul}" (0x${hangul.charCodeAt(0).toString(16)}) should result in "${alt}"`);
                }
            });
            test('Modern vowels', () => {
                const cases = new Map([
                    ['ᅡ', 'k'],
                    ['ᅢ', 'o'],
                    ['ᅣ', 'i'],
                    ['ᅤ', 'O'],
                    ['ᅥ', 'j'],
                    ['ᅦ', 'p'],
                    ['ᅧ', 'u'],
                    ['ᅨ', 'P'],
                    ['ᅩ', 'h'],
                    ['ᅪ', 'hk'],
                    ['ᅫ', 'ho'],
                    ['ᅬ', 'hl'],
                    ['ᅭ', 'y'],
                    ['ᅮ', 'n'],
                    ['ᅯ', 'nj'],
                    ['ᅰ', 'np'],
                    ['ᅱ', 'nl'],
                    ['ᅲ', 'b'],
                    ['ᅳ', 'm'],
                    ['ᅴ', 'ml'],
                    ['ᅵ', 'l'],
                ]);
                for (const [hangul, alt] of cases.entries()) {
                    (0, assert_1.strictEqual)(getKoreanAltCharsForString(hangul), alt, `"${hangul}" (0x${hangul.charCodeAt(0).toString(16)}) should result in "${alt}"`);
                }
            });
            test('Compatibility Jamo', () => {
                const cases = new Map([
                    ['ㄱ', 'r'],
                    ['ㄲ', 'R'],
                    ['ㄳ', 'rt'],
                    ['ㄴ', 's'],
                    ['ㄵ', 'sw'],
                    ['ㄶ', 'sg'],
                    ['ㄷ', 'e'],
                    ['ㄸ', 'E'],
                    ['ㄹ', 'f'],
                    ['ㄺ', 'fr'],
                    ['ㄻ', 'fa'],
                    ['ㄼ', 'fq'],
                    ['ㄽ', 'ft'],
                    ['ㄾ', 'fx'],
                    ['ㄿ', 'fv'],
                    ['ㅀ', 'fg'],
                    ['ㅁ', 'a'],
                    ['ㅂ', 'q'],
                    ['ㅃ', 'Q'],
                    ['ㅄ', 'qt'],
                    ['ㅅ', 't'],
                    ['ㅆ', 'T'],
                    ['ㅇ', 'd'],
                    ['ㅈ', 'w'],
                    ['ㅉ', 'W'],
                    ['ㅊ', 'c'],
                    ['ㅋ', 'z'],
                    ['ㅌ', 'x'],
                    ['ㅍ', 'v'],
                    ['ㅎ', 'g'],
                    ['ㅏ', 'k'],
                    ['ㅐ', 'o'],
                    ['ㅑ', 'i'],
                    ['ㅒ', 'O'],
                    ['ㅓ', 'j'],
                    ['ㅔ', 'p'],
                    ['ㅕ', 'u'],
                    ['ㅖ', 'P'],
                    ['ㅗ', 'h'],
                    ['ㅘ', 'hk'],
                    ['ㅙ', 'ho'],
                    ['ㅚ', 'hl'],
                    ['ㅛ', 'y'],
                    ['ㅜ', 'n'],
                    ['ㅝ', 'nj'],
                    ['ㅞ', 'np'],
                    ['ㅟ', 'nl'],
                    ['ㅠ', 'b'],
                    ['ㅡ', 'm'],
                    ['ㅢ', 'ml'],
                    ['ㅣ', 'l'],
                    // HF: Hangul Filler (everything after this is archaic)
                ]);
                for (const [hangul, alt] of cases.entries()) {
                    (0, assert_1.strictEqual)(getKoreanAltCharsForString(hangul), alt, `"${hangul}" (0x${hangul.charCodeAt(0).toString(16)}) should result in "${alt}"`);
                }
            });
            // There are too many characters to test exhaustively, so select some
            // real world use cases from this code base (workbench contrib names)
            test('Composed samples', () => {
                const cases = new Map([
                    ['ㅁㅊㅊㄷㄴ냐ㅠㅑㅣㅑ쇼', 'accessibility'],
                    ['ㅁㅊ채ㅕㅜㅅ뚜샤시드둣ㄴ', 'accountEntitlements'],
                    ['며야ㅐ쳗ㄴ', 'audioCues'],
                    ['ㅠㄱㅁ찯셰먁채ㅣㅐ걐ㄷㄱ2ㅆ디듣ㅅ교', 'bracketPairColorizer2Telemetry'],
                    ['ㅠㅕㅣㅏㄸ얏', 'bulkEdit'],
                    ['ㅊ미ㅣㅗㅑㄷㄱㅁㄱ초ㅛ', 'callHierarchy'],
                    ['촘ㅅ', 'chat'],
                    ['챙ㄷㅁㅊ샤ㅐㅜㄴ', 'codeActions'],
                    ['챙ㄷㄸ야색', 'codeEditor'],
                    ['채ㅡㅡ뭉ㄴ', 'commands'],
                    ['채ㅡㅡ둣ㄴ', 'comments'],
                    ['채ㅜ럏ㄸ테ㅐㄳㄷㄱ', 'configExporter'],
                    ['채ㅜㅅㄷㅌ스두ㅕ', 'contextmenu'],
                    ['쳔새ㅡㄸ야색', 'customEditor'],
                    ['ㅇ듀ㅕㅎ', 'debug'],
                    ['ㅇ덱ㄷㅊㅁㅅㄷㅇㄸㅌㅅ두냐ㅐㅜㅡㅑㅎㄱㅁ색', 'deprecatedExtensionMigrator'],
                    ['ㄷ얏ㄴㄷㄴ냐ㅐㅜㄴ', 'editSessions'],
                    ['드ㅡㄷㅅ', 'emmet'],
                    ['ㄷㅌㅅ두냐ㅐㅜㄴ', 'extensions'],
                    ['ㄷㅌㅅㄷ구밌ㄷ그ㅑㅜ미', 'externalTerminal'],
                    ['ㄷㅌㅅㄷ구미ㅕ갸ㅒㅔ둗ㄱ', 'externalUriOpener'],
                    ['랴ㅣㄷㄴ', 'files'],
                    ['래ㅣ야ㅜㅎ', 'folding'],
                    ['래금ㅅ', 'format'],
                    ['ㅑㅟ묘ㅗㅑㅜㅅㄴ', 'inlayHints'],
                    ['ㅑㅟㅑㅜㄷ촘ㅅ', 'inlineChat'],
                    ['ㅑㅜㅅㄷㄱㅁㅊ샾ㄷ', 'interactive'],
                    ['ㅑㄴ녇', 'issue'],
                    ['ㅏ됴ㅠㅑㅜ야ㅜㅎㄴ', 'keybindings'],
                    ['ㅣ무혐ㅎㄷㅇㄷㅅㄷㅊ샤ㅐㅜ', 'languageDetection'],
                    ['ㅣ무혐ㅎㄷㄴㅅㅁ션', 'languageStatus'],
                    ['ㅣㅑㅡㅑ샤ㅜ얓ㅁ색', 'limitIndicator'],
                    ['ㅣㅑㄴㅅ', 'list'],
                    ['ㅣㅐㅊ미ㅗㅑㄴ새교', 'localHistory'],
                    ['ㅣㅐㅊ미ㅑㅋㅁ샤ㅐㅜ', 'localization'],
                    ['ㅣㅐㅎㄴ', 'logs'],
                    ['ㅡ메ㅔㄷㅇㄸ얏ㄴ', 'mappedEdits'],
                    ['ㅡㅁ가애주', 'markdown'],
                    ['ㅡㅁ갇ㄱㄴ', 'markers'],
                    ['ㅡㄷㄱㅎㄷㄸ야색', 'mergeEditor'],
                    ['ㅡㅕㅣ샤얄ㄹㄸ야색', 'multiDiffEditor'],
                    ['ㅜㅐㅅ듀ㅐㅐㅏ', 'notebook'],
                    ['ㅐㅕ시ㅑㅜㄷ', 'outline'],
                    ['ㅐㅕ세ㅕㅅ', 'output'],
                    ['ㅔㄷㄱ래그뭋ㄷ', 'performance'],
                    ['ㅔㄱㄷㄹㄷㄱ둧ㄷㄴ', 'preferences'],
                    ['벼ㅑ참ㅊㅊㄷㄴㄴ', 'quickaccess'],
                    ['ㄱ디며ㅜ촏ㄱ', 'relauncher'],
                    ['ㄱ드ㅐㅅㄷ', 'remote'],
                    ['ㄱ드ㅐㅅㄷ쎠ㅜㅜ디', 'remoteTunnel'],
                    ['ㄴㅁ노', 'sash'],
                    ['ㄴ츠', 'scm'],
                    ['ㄴㄷㅁㄱ초', 'search'],
                    ['ㄴㄷㅁㄱ초ㄸ야색', 'searchEditor'],
                    ['놈ㄱㄷ', 'share'],
                    ['누ㅑㅔㅔㄷㅅㄴ', 'snippets'],
                    ['넫ㄷ초', 'speech'],
                    ['네ㅣㅁ노', 'splash'],
                    ['녁ㅍ됸', 'surveys'],
                    ['ㅅㅁㅎㄴ', 'tags'],
                    ['ㅅㅁ난', 'tasks'],
                    ['ㅅ디듣ㅅ교', 'telemetry'],
                    ['ㅅㄷ그ㅑㅜ미', 'terminal'],
                    ['ㅅㄷ그ㅑㅜ미채ㅜㅅ갸ㅠ', 'terminalContrib'],
                    ['ㅅㄷㄴ샤ㅜㅎ', 'testing'],
                    ['소듣ㄴ', 'themes'],
                    ['샤ㅡ디ㅑㅜㄷ', 'timeline'],
                    ['쇼ㅔ도ㅑㄷㄱㅁㄱ초ㅛ', 'typeHierarchy'],
                    ['ㅕㅔㅇㅁㅅㄷ', 'update'],
                    ['ㅕ기', 'url'],
                    ['ㅕㄴㄷㄱㅇㅁㅅ몌개랴ㅣㄷ', 'userDataProfile'],
                    ['ㅕㄴㄷㄱㅇㅁㅅㅁ뇨ㅜㅊ', 'userDataSync'],
                    ['ㅈ듀퍋ㅈ', 'webview'],
                    ['ㅈ듀퍋졔무디', 'webviewPanel'],
                    ['ㅈ듀퍋ㅈ퍋ㅈ', 'webviewView'],
                    ['ㅈ디채ㅡ듀무ㅜㄷㄱ', 'welcomeBanner'],
                    ['ㅈ디채ㅡㄷ야미ㅐㅎ', 'welcomeDialog'],
                    ['ㅈ디채ㅡㄷㅎㄷㅅ샤ㅜㅎㄴㅅㅁㄳㄷㅇ', 'welcomeGettingStarted'],
                    ['ㅈ디채ㅡㄷ퍋ㅈㄴ', 'welcomeViews'],
                    ['ㅈ디채ㅡㄷㅉ미ㅏ소개ㅕ호', 'welcomeWalkthrough'],
                    ['재가넴ㅊㄷ', 'workspace'],
                    ['재가넴ㅊㄷㄴ', 'workspaces'],
                ]);
                for (const [hangul, alt] of cases.entries()) {
                    // Compare with lower case as some cases do not have
                    // corresponding hangul inputs
                    (0, assert_1.strictEqual)(getKoreanAltCharsForString(hangul).toLowerCase(), alt.toLowerCase(), `"${hangul}" (0x${hangul.charCodeAt(0).toString(16)}) should result in "${alt}"`);
                }
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia29yZWFuLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL25hdHVyYWxMYW5ndWFnZS9rb3JlYW4udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxTQUFTLDBCQUEwQixDQUFDLElBQVk7UUFDL0MsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsTUFBTSxLQUFLLEdBQUcsSUFBQSwwQkFBaUIsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxNQUFNLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNyRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtRQUNwQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtZQUMvQixJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO2dCQUN0QyxNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQztvQkFDckIsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFF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LEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO29CQUNYLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7b0JBQ1gsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO29CQUNYLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztvQkFDWCxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztvQkFDWCxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7b0JBQ1gsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO29CQUNYLENBQUMs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