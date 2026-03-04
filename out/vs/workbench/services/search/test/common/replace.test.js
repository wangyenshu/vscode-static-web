define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/services/search/common/replace"], function (require, exports, assert, utils_1, replace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Replace Pattern test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('parse replace string', () => {
            const testParse = (input, expected, expectedHasParameters) => {
                let actual = new replace_1.ReplacePattern(input, { pattern: 'somepattern', isRegExp: true });
                assert.strictEqual(expected, actual.pattern);
                assert.strictEqual(expectedHasParameters, actual.hasParameters);
                actual = new replace_1.ReplacePattern('hello' + input + 'hi', { pattern: 'sonepattern', isRegExp: true });
                assert.strictEqual('hello' + expected + 'hi', actual.pattern);
                assert.strictEqual(expectedHasParameters, actual.hasParameters);
            };
            // no backslash => no treatment
            testParse('hello', 'hello', false);
            // \t => TAB
            testParse('\\thello', '\thello', false);
            // \n => LF
            testParse('\\nhello', '\nhello', false);
            // \\t => \t
            testParse('\\\\thello', '\\thello', false);
            // \\\t => \TAB
            testParse('\\\\\\thello', '\\\thello', false);
            // \\\\t => \\t
            testParse('\\\\\\\\thello', '\\\\thello', false);
            // \ at the end => no treatment
            testParse('hello\\', 'hello\\', false);
            // \ with unknown char => no treatment
            testParse('hello\\x', 'hello\\x', false);
            // \ with back reference => no treatment
            testParse('hello\\0', 'hello\\0', false);
            // $1 => no treatment
            testParse('hello$1', 'hello$1', true);
            // $2 => no treatment
            testParse('hello$2', 'hello$2', true);
            // $12 => no treatment
            testParse('hello$12', 'hello$12', true);
            // $99 => no treatment
            testParse('hello$99', 'hello$99', true);
            // $99a => no treatment
            testParse('hello$99a', 'hello$99a', true);
            // $100 => no treatment
            testParse('hello$100', 'hello$100', false);
            // $100a => no treatment
            testParse('hello$100a', 'hello$100a', false);
            // $10a0 => no treatment
            testParse('hello$10a0', 'hello$10a0', true);
            // $$ => no treatment
            testParse('hello$$', 'hello$$', false);
            // $$0 => no treatment
            testParse('hello$$0', 'hello$$0', false);
            // $0 => $&
            testParse('hello$0', 'hello$&', true);
            testParse('hello$02', 'hello$&2', true);
            testParse('hello$`', 'hello$`', true);
            testParse('hello$\'', 'hello$\'', true);
        });
        test('create pattern by passing regExp', () => {
            let expected = /abc/;
            let actual = new replace_1.ReplacePattern('hello', false, expected).regExp;
            assert.deepStrictEqual(actual, expected);
            expected = /abc/;
            actual = new replace_1.ReplacePattern('hello', false, /abc/g).regExp;
            assert.deepStrictEqual(actual, expected);
            let testObject = new replace_1.ReplacePattern('hello$0', false, /abc/g);
            assert.strictEqual(testObject.hasParameters, false);
            testObject = new replace_1.ReplacePattern('hello$0', true, /abc/g);
            assert.strictEqual(testObject.hasParameters, true);
        });
        test('get replace string if given text is a complete match', () => {
            let testObject = new replace_1.ReplacePattern('hello', { pattern: 'bla', isRegExp: true });
            let actual = testObject.getReplaceString('bla');
            assert.strictEqual(actual, 'hello');
            testObject = new replace_1.ReplacePattern('hello', { pattern: 'bla', isRegExp: false });
            actual = testObject.getReplaceString('bla');
            assert.strictEqual(actual, 'hello');
            testObject = new replace_1.ReplacePattern('hello', { pattern: '(bla)', isRegExp: true });
            actual = testObject.getReplaceString('bla');
            assert.strictEqual(actual, 'hello');
            testObject = new replace_1.ReplacePattern('hello$0', { pattern: '(bla)', isRegExp: true });
            actual = testObject.getReplaceString('bla');
            assert.strictEqual(actual, 'hellobla');
            testObject = new replace_1.ReplacePattern('import * as $1 from \'$2\';', { pattern: 'let\\s+(\\w+)\\s*=\\s*require\\s*\\(\\s*[\'\"]([\\w.\\-/]+)\\s*[\'\"]\\s*\\)\\s*', isRegExp: true });
            actual = testObject.getReplaceString('let fs = require(\'fs\')');
            assert.strictEqual(actual, 'import * as fs from \'fs\';');
            actual = testObject.getReplaceString('let something = require(\'fs\')');
            assert.strictEqual(actual, 'import * as something from \'fs\';');
            actual = testObject.getReplaceString('let require(\'fs\')');
            assert.strictEqual(actual, null);
            testObject = new replace_1.ReplacePattern('import * as $1 from \'$1\';', { pattern: 'let\\s+(\\w+)\\s*=\\s*require\\s*\\(\\s*[\'\"]([\\w.\\-/]+)\\s*[\'\"]\\s*\\)\\s*', isRegExp: true });
            actual = testObject.getReplaceString('let something = require(\'fs\')');
            assert.strictEqual(actual, 'import * as something from \'something\';');
            testObject = new replace_1.ReplacePattern('import * as $2 from \'$1\';', { pattern: 'let\\s+(\\w+)\\s*=\\s*require\\s*\\(\\s*[\'\"]([\\w.\\-/]+)\\s*[\'\"]\\s*\\)\\s*', isRegExp: true });
            actual = testObject.getReplaceString('let something = require(\'fs\')');
            assert.strictEqual(actual, 'import * as fs from \'something\';');
            testObject = new replace_1.ReplacePattern('import * as $0 from \'$0\';', { pattern: 'let\\s+(\\w+)\\s*=\\s*require\\s*\\(\\s*[\'\"]([\\w.\\-/]+)\\s*[\'\"]\\s*\\)\\s*', isRegExp: true });
            actual = testObject.getReplaceString('let something = require(\'fs\');');
            assert.strictEqual(actual, 'import * as let something = require(\'fs\') from \'let something = require(\'fs\')\';');
            testObject = new replace_1.ReplacePattern('import * as $1 from \'$2\';', { pattern: 'let\\s+(\\w+)\\s*=\\s*require\\s*\\(\\s*[\'\"]([\\w.\\-/]+)\\s*[\'\"]\\s*\\)\\s*', isRegExp: false });
            actual = testObject.getReplaceString('let fs = require(\'fs\');');
            assert.strictEqual(actual, null);
            testObject = new replace_1.ReplacePattern('cat$1', { pattern: 'for(.*)', isRegExp: true });
            actual = testObject.getReplaceString('for ()');
            assert.strictEqual(actual, 'cat ()');
        });
        test('case operations', () => {
            const testObject = new replace_1.ReplacePattern('a\\u$1l\\u\\l\\U$2M$3n', { pattern: 'a(l)l(good)m(e)n', isRegExp: true });
            const actual = testObject.getReplaceString('allgoodmen');
            assert.strictEqual(actual, 'aLlGoODMen');
        });
        test('case operations - no false positive', () => {
            let testObject = new replace_1.ReplacePattern('\\left $1', { pattern: '(pattern)', isRegExp: true });
            let actual = testObject.getReplaceString('pattern');
            assert.strictEqual(actual, '\\left pattern');
            testObject = new replace_1.ReplacePattern('\\hi \\left $1', { pattern: '(pattern)', isRegExp: true });
            actual = testObject.getReplaceString('pattern');
            assert.strictEqual(actual, '\\hi \\left pattern');
            testObject = new replace_1.ReplacePattern('\\left \\L$1', { pattern: 'PATT(ERN)', isRegExp: true });
            actual = testObject.getReplaceString('PATTERN');
            assert.strictEqual(actual, '\\left ern');
        });
        test('case operations and newline', () => {
            const testObject = new replace_1.ReplacePattern('$1\n\\U$2', { pattern: '(multi)(line)', isRegExp: true });
            const actual = testObject.getReplaceString('multiline');
            assert.strictEqual(actual, 'multi\nLINE');
        });
        test('get replace string for no matches', () => {
            let testObject = new replace_1.ReplacePattern('hello', { pattern: 'bla', isRegExp: true });
            let actual = testObject.getReplaceString('foo');
            assert.strictEqual(actual, null);
            testObject = new replace_1.ReplacePattern('hello', { pattern: 'bla', isRegExp: false });
            actual = testObject.getReplaceString('foo');
            assert.strictEqual(actual, null);
        });
        test('get replace string if match is sub-string of the text', () => {
            let testObject = new replace_1.ReplacePattern('hello', { pattern: 'bla', isRegExp: true });
            let actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'hello');
            testObject = new replace_1.ReplacePattern('hello', { pattern: 'bla', isRegExp: false });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'hello');
            testObject = new replace_1.ReplacePattern('that', { pattern: 'this(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'that');
            testObject = new replace_1.ReplacePattern('$1at', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'that');
            testObject = new replace_1.ReplacePattern('$1e', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'the');
            testObject = new replace_1.ReplacePattern('$1ere', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'there');
            testObject = new replace_1.ReplacePattern('$1', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'th');
            testObject = new replace_1.ReplacePattern('ma$1', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'math');
            testObject = new replace_1.ReplacePattern('ma$1s', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'maths');
            testObject = new replace_1.ReplacePattern('ma$1s', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'maths');
            testObject = new replace_1.ReplacePattern('$0', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'this');
            testObject = new replace_1.ReplacePattern('$0$1', { pattern: '(th)is(?=.*bla)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'thisth');
            testObject = new replace_1.ReplacePattern('foo', { pattern: 'bla(?=\\stext$)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'foo');
            testObject = new replace_1.ReplacePattern('f$1', { pattern: 'b(la)(?=\\stext$)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'fla');
            testObject = new replace_1.ReplacePattern('f$0', { pattern: 'b(la)(?=\\stext$)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'fbla');
            testObject = new replace_1.ReplacePattern('$0ah', { pattern: 'b(la)(?=\\stext$)', isRegExp: true });
            actual = testObject.getReplaceString('this is a bla text');
            assert.strictEqual(actual, 'blaah');
            testObject = new replace_1.ReplacePattern('newrege$1', true, /Testrege(\w*)/);
            actual = testObject.getReplaceString('Testregex', true);
            assert.strictEqual(actual, 'Newregex');
            testObject = new replace_1.ReplacePattern('newrege$1', true, /TESTREGE(\w*)/);
            actual = testObject.getReplaceString('TESTREGEX', true);
            assert.strictEqual(actual, 'NEWREGEX');
            testObject = new replace_1.ReplacePattern('new_rege$1', true, /Test_Rege(\w*)/);
            actual = testObject.getReplaceString('Test_Regex', true);
            assert.strictEqual(actual, 'New_Regex');
            testObject = new replace_1.ReplacePattern('new-rege$1', true, /Test-Rege(\w*)/);
            actual = testObject.getReplaceString('Test-Regex', true);
            assert.strictEqual(actual, 'New-Regex');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC90ZXN0L2NvbW1vbi9yZXBsYWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBUUEsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtRQUNsQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtZQUNqQyxNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQWEsRUFBRSxRQUFnQixFQUFFLHFCQUE4QixFQUFFLEVBQUU7Z0JBQ3JGLElBQUksTUFBTSxHQUFHLElBQUksd0JBQWMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMscUJBQXFCLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUVoRSxNQUFNLEdBQUcsSUFBSSx3QkFBYyxDQUFDLE9BQU8sR0FBRyxLQUFLLEdBQUcsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDaEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsUUFBUSxHQUFHLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMscUJBQXFCLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pFLENBQUMsQ0FBQztZQUVGLCtCQUErQjtZ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