define(["require", "exports", "assert", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/supports/onEnter", "vs/editor/test/common/modes/supports/onEnterRules", "vs/base/test/common/utils"], function (require, exports, assert, languageConfiguration_1, onEnter_1, onEnterRules_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('OnEnter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('uses brackets', () => {
            const brackets = [
                ['(', ')'],
                ['begin', 'end']
            ];
            const support = new onEnter_1.OnEnterSupport({
                brackets: brackets
            });
            const testIndentAction = (beforeText, afterText, expected) => {
                const actual = support.onEnter(3 /* EditorAutoIndentStrategy.Advanced */, '', beforeText, afterText);
                if (expected === languageConfiguration_1.IndentAction.None) {
                    assert.strictEqual(actual, null);
                }
                else {
                    assert.strictEqual(actual.indentAction, expected);
                }
            };
            testIndentAction('a', '', languageConfiguration_1.IndentAction.None);
            testIndentAction('', 'b', languageConfiguration_1.IndentAction.None);
            testIndentAction('(', 'b', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('a', ')', languageConfiguration_1.IndentAction.None);
            testIndentAction('begin', 'ending', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('abegin', 'end', languageConfiguration_1.IndentAction.None);
            testIndentAction('begin', ')', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('begin', 'end', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('begin ', ' end', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction(' begin', 'end//as', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('(', ')', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('( ', ')', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('a(', ')b', languageConfiguration_1.IndentAction.IndentOutdent);
            testIndentAction('(', '', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('(', 'foo', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('begin', 'foo', languageConfiguration_1.IndentAction.Indent);
            testIndentAction('begin', '', languageConfiguration_1.IndentAction.Indent);
        });
        test('Issue #121125: onEnterRules with global modifier', () => {
            const support = new onEnter_1.OnEnterSupport({
                onEnterRules: [
                    {
                        action: {
                            appendText: '/// ',
                            indentAction: languageConfiguration_1.IndentAction.Outdent
                        },
                        beforeText: /^\s*\/{3}.*$/gm
                    }
                ]
            });
            const testIndentAction = (previousLineText, beforeText, afterText, expectedIndentAction, expectedAppendText, removeText = 0) => {
                const actual = support.onEnter(3 /* EditorAutoIndentStrategy.Advanced */, previousLineText, beforeText, afterText);
                if (expectedIndentAction === null) {
                    assert.strictEqual(actual, null, 'isNull:' + beforeText);
                }
                else {
                    assert.strictEqual(actual !== null, true, 'isNotNull:' + beforeText);
                    assert.strictEqual(actual.indentAction, expectedIndentAction, 'indentAction:' + beforeText);
                    if (expectedAppendText !== null) {
                        assert.strictEqual(actual.appendText, expectedAppendText, 'appendText:' + beforeText);
                    }
                    if (removeText !== 0) {
                        assert.strictEqual(actual.removeText, removeText, 'removeText:' + beforeText);
                    }
                }
            };
            testIndentAction('/// line', '/// line', '', languageConfiguration_1.IndentAction.Outdent, '/// ');
            testIndentAction('/// line', '/// line', '', languageConfiguration_1.IndentAction.Outdent, '/// ');
        });
        test('uses regExpRules', () => {
            const support = new onEnter_1.OnEnterSupport({
                onEnterRules: onEnterRules_1.javascriptOnEnterRules
            });
            const testIndentAction = (previousLineText, beforeText, afterText, expectedIndentAction, expectedAppendText, removeText = 0) => {
                const actual = support.onEnter(3 /* EditorAutoIndentStrategy.Advanced */, previousLineText, beforeText, afterText);
                if (expectedIndentAction === null) {
                    assert.strictEqual(actual, null, 'isNull:' + beforeText);
                }
                else {
                    assert.strictEqual(actual !== null, true, 'isNotNull:' + beforeText);
                    assert.strictEqual(actual.indentAction, expectedIndentAction, 'indentAction:' + beforeText);
                    if (expectedAppendText !== null) {
                        assert.strictEqual(actual.appendText, expectedAppendText, 'appendText:' + beforeText);
                    }
                    if (removeText !== 0) {
                        assert.strictEqual(actual.removeText, removeText, 'removeText:' + beforeText);
                    }
                }
            };
            testIndentAction('', '\t/**', ' */', languageConfiguration_1.IndentAction.IndentOutdent, ' * ');
            testIndentAction('', '\t/**', '', languageConfiguration_1.IndentAction.None, ' * ');
            testIndentAction('', '\t/** * / * / * /', '', languageConfiguration_1.IndentAction.None, ' * ');
            testIndentAction('', '\t/** /*', '', languageConfiguration_1.IndentAction.None, ' * ');
            testIndentAction('', '/**', '', languageConfiguration_1.IndentAction.None, ' * ');
            testIndentAction('', '\t/**/', '', null, null);
            testIndentAction('', '\t/***/', '', null, null);
            testIndentAction('', '\t/*******/', '', null, null);
            testIndentAction('', '\t/** * * * * */', '', null, null);
            testIndentAction('', '\t/** */', '', null, null);
            testIndentAction('', '\t/** asdfg */', '', null, null);
            testIndentAction('', '\t/* asdfg */', '', null, null);
            testIndentAction('', '\t/* asdfg */', '', null, null);
            testIndentAction('', '\t/** asdfg */', '', null, null);
            testIndentAction('', '*/', '', null, null);
            testIndentAction('', '\t/*', '', null, null);
            testIndentAction('', '\t*', '', null, null);
            testIndentAction('\t/**', '\t *', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('\t * something', '\t *', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('\t *', '\t *', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('', '\t */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '\t * */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '\t * * / * / * / */', '', null, null);
            testIndentAction('\t/**', '\t * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('\t * something', '\t * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('\t *', '\t * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * asdfsfagadfg', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * asdfsfagadfg * * * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * asdfsfagadfg * * * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * asdfsfagadfg * * * ', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * asdfsfagadfg * / * / * /', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * asdfsfagadfg * / * / * /', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * asdfsfagadfg * / * / * /', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('/**', ' * asdfsfagadfg * / * / * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' * something', ' * asdfsfagadfg * / * / * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction(' *', ' * asdfsfagadfg * / * / * /*', '', languageConfiguration_1.IndentAction.None, '* ');
            testIndentAction('', ' */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction(' */', ' * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('', '\t */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '\t\t */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '   */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '     */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', '\t     */', '', languageConfiguration_1.IndentAction.None, null, 1);
            testIndentAction('', ' *--------------------------------------------------------------------------------------------*/', '', languageConfiguration_1.IndentAction.None, null, 1);
            // issue #43469
            testIndentAction('class A {', '    * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('', '    * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('    ', '    * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('class A {', '  * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('', '  * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
            testIndentAction('  ', '  * test() {', '', languageConfiguration_1.IndentAction.Indent, null, 0);
        });
        test('issue #141816', () => {
            const support = new onEnter_1.OnEnterSupport({
                onEnterRules: onEnterRules_1.javascriptOnEnterRules
            });
            const testIndentAction = (beforeText, afterText, expected) => {
                const actual = support.onEnter(3 /* EditorAutoIndentStrategy.Advanced */, '', beforeText, afterText);
                if (expected === languageConfiguration_1.IndentAction.None) {
                    assert.strictEqual(actual, null);
                }
                else {
                    assert.strictEqual(actual.indentAction, expected);
                }
            };
            testIndentAction('const r = /{/;', '', languageConfiguration_1.IndentAction.None);
            testIndentAction('const r = /{[0-9]/;', '', languageConfiguration_1.IndentAction.None);
            testIndentAction('const r = /[a-zA-Z]{/;', '', languageConfiguration_1.IndentAction.None);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25FbnRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVzL3N1cHBvcnRzL29uRW50ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFXQSxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUVyQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7WUFDMUIsTUFBTSxRQUFRLEdBQW9CO2dCQUNqQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQ1YsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDO2FBQ2hCLENBQUM7WUFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLHdCQUFjLENBQUM7Z0JBQ2xDLFFBQVEsRUFBRSxRQUFRO2FBQ2xCLENBQUMsQ0FBQztZQUNILE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxVQUFrQixFQUFFLFNBQWlCLEVBQUUsUUFBc0IsRUFBRSxFQUFFO2dCQUMxRixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyw0Q0FBb0MsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDN0YsSUFBSSxRQUFRLEtBQUssb0NBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU8sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3BELENBQUM7WUFDRixDQUFDLENBQUM7WUFFRixnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLG9DQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0Ms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