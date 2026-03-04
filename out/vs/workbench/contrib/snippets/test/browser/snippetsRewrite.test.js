/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uuid", "vs/base/test/common/utils", "vs/workbench/contrib/snippets/browser/snippetsFile"], function (require, exports, assert, uuid_1, utils_1, snippetsFile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SnippetRewrite', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertRewrite(input, expected) {
            const actual = new snippetsFile_1.Snippet(false, ['foo'], 'foo', 'foo', 'foo', input, 'foo', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)());
            if (typeof expected === 'boolean') {
                assert.strictEqual(actual.codeSnippet, input);
            }
            else {
                assert.strictEqual(actual.codeSnippet, expected);
            }
        }
        test('bogous variable rewrite', function () {
            assertRewrite('foo', false);
            assertRewrite('hello $1 world$0', false);
            assertRewrite('$foo and $foo', '${1:foo} and ${1:foo}');
            assertRewrite('$1 and $SELECTION and $foo', '$1 and ${SELECTION} and ${2:foo}');
            assertRewrite([
                'for (var ${index} = 0; ${index} < ${array}.length; ${index}++) {',
                '\tvar ${element} = ${array}[${index}];',
                '\t$0',
                '}'
            ].join('\n'), [
                'for (var ${1:index} = 0; ${1:index} < ${2:array}.length; ${1:index}++) {',
                '\tvar ${3:element} = ${2:array}[${1:index}];',
                '\t$0',
                '\\}'
            ].join('\n'));
        });
        test('Snippet choices: unable to escape comma and pipe, #31521', function () {
            assertRewrite('console.log(${1|not\\, not, five, 5, 1   23|});', false);
        });
        test('lazy bogous variable rewrite', function () {
            const snippet = new snippetsFile_1.Snippet(false, ['fooLang'], 'foo', 'prefix', 'desc', 'This is ${bogous} because it is a ${var}', 'source', 3 /* SnippetSource.Extension */, (0, uuid_1.generateUuid)());
            assert.strictEqual(snippet.body, 'This is ${bogous} because it is a ${var}');
            assert.strictEqual(snippet.codeSnippet, 'This is ${1:bogous} because it is a ${2:var}');
            assert.strictEqual(snippet.isBogous, true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNSZXdyaXRlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zbmlwcGV0cy90ZXN0L2Jyb3dzZXIvc25pcHBldHNSZXdyaXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFO1FBRXZCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLGFBQWEsQ0FBQyxLQUFhLEVBQUUsUUFBMEI7WUFDL0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxzQkFBTyxDQUFDLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLDhCQUFzQixJQUFBLG1CQUFZLEdBQUUsQ0FBQyxDQUFDO1lBQ2xILElBQUksT0FBTyxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMvQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1lBRS9CLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsYUFBYSxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXpDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUN4RCxhQUFhLENBQUMsNEJBQTRCLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztZQUdoRixhQUFhLENBQ1o7Z0JBQ0Msa0VBQWtFO2dCQUNsRSx3Q0FBd0M7Z0JBQ3hDLE1BQU07Z0JBQ04sR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNaO2dCQUNDLDBFQUEwRTtnQkFDMUUsOENBQThDO2dCQUM5QyxNQUFNO2dCQUNOLEtBQUs7YUFDTCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDWixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMERBQTBELEVBQUU7WUFDaEUsYUFBYSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLElBQUksc0JBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSwwQ0FBMEMsRUFBRSxRQUFRLG1DQUEyQixJQUFBLG1CQUFZLEdBQUUsQ0FBQyxDQUFDO1lBQ3hLLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=