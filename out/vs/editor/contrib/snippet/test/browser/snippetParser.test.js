define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, assert, utils_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SnippetParser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Scanner', () => {
            const scanner = new snippetParser_1.Scanner();
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('abc');
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('{{abc}}');
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('abc() ');
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 10 /* TokenType.Format */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('abc 123');
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 10 /* TokenType.Format */);
            assert.strictEqual(scanner.next().type, 8 /* TokenType.Int */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('$foo');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('$foo_bar');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('$foo-bar');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 12 /* TokenType.Dash */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('${foo}');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('${1223:foo}');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 8 /* TokenType.Int */);
            assert.strictEqual(scanner.next().type, 1 /* TokenType.Colon */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
            scanner.text('\\${}');
            assert.strictEqual(scanner.next().type, 5 /* TokenType.Backslash */);
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            scanner.text('${foo/regex/format/option}');
            assert.strictEqual(scanner.next().type, 0 /* TokenType.Dollar */);
            assert.strictEqual(scanner.next().type, 3 /* TokenType.CurlyOpen */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 6 /* TokenType.Forwardslash */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 6 /* TokenType.Forwardslash */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 6 /* TokenType.Forwardslash */);
            assert.strictEqual(scanner.next().type, 9 /* TokenType.VariableName */);
            assert.strictEqual(scanner.next().type, 4 /* TokenType.CurlyClose */);
            assert.strictEqual(scanner.next().type, 14 /* TokenType.EOF */);
        });
        function assertText(value, expected) {
            const actual = snippetParser_1.SnippetParser.asInsertText(value);
            assert.strictEqual(actual, expected);
        }
        function assertMarker(input, ...ctors) {
            let marker;
            if (input instanceof snippetParser_1.TextmateSnippet) {
                marker = [...input.children];
            }
            else if (typeof input === 'string') {
                const p = new snippetParser_1.SnippetParser();
                marker = p.parse(input).children;
            }
            else {
                marker = [...input];
            }
            while (marker.length > 0) {
                const m = marker.pop();
                const ctor = ctors.pop();
                assert.ok(m instanceof ctor);
            }
            assert.strictEqual(marker.length, ctors.length);
            assert.strictEqual(marker.length, 0);
        }
        function assertTextAndMarker(value, escaped, ...ctors) {
            assertText(value, escaped);
            assertMarker(value, ...ctors);
        }
        function assertEscaped(value, expected) {
            const actual = snippetParser_1.SnippetParser.escape(value);
            assert.strictEqual(actual, expected);
        }
        test('Parser, escaped', function () {
            assertEscaped('foo$0', 'foo\\$0');
            assertEscaped('foo\\$0', 'foo\\\\\\$0');
            assertEscaped('f$1oo$0', 'f\\$1oo\\$0');
            assertEscaped('${1:foo}$0', '\\${1:foo\\}\\$0');
            assertEscaped('$', '\\$');
        });
        test('Parser, text', () => {
            assertText('$', '$');
            assertText('\\\\$', '\\$');
            assertText('{', '{');
            assertText('\\}', '}');
            assertText('\\abc', '\\abc');
            assertText('foo${f:\\}}bar', 'foo}bar');
            assertText('\\{', '\\{');
            assertText('I need \\\\\\$', 'I need \\$');
            assertText('\\', '\\');
            assertText('\\{{', '\\{{');
            assertText('{{', '{{');
            assertText('{{dd', '{{dd');
            assertText('}}', '}}');
            assertText('ff}}', 'ff}}');
            assertText('farboo', 'farboo');
            assertText('far{{}}boo', 'far{{}}boo');
            assertText('far{{123}}boo', 'far{{123}}boo');
            assertText('far\\{{123}}boo', 'far\\{{123}}boo');
            assertText('far{{id:bern}}boo', 'far{{id:bern}}boo');
            assertText('far{{id:bern {{basel}}}}boo', 'far{{id:bern {{basel}}}}boo');
            assertText('far{{id:bern {{id:basel}}}}boo', 'far{{id:bern {{id:basel}}}}boo');
            assertText('far{{id:bern {{id2:basel}}}}boo', 'far{{id:bern {{id2:basel}}}}boo');
        });
        test('Parser, TM text', () => {
            assertTextAndMarker('foo${1:bar}}', 'foobar}', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text);
            assertTextAndMarker('foo${1:bar}${2:foo}}', 'foobarfoo}', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Placeholder, snippetParser_1.Text);
            assertTextAndMarker('foo${1:bar\\}${2:foo}}', 'foobar}foo', snippetParser_1.Text, snippetParser_1.Placeholder);
            const [, placeholder] = new snippetParser_1.SnippetParser().parse('foo${1:bar\\}${2:foo}}').children;
            const { children } = placeholder;
            assert.strictEqual(placeholder.index, 1);
            assert.ok(children[0] instanceof snippetParser_1.Text);
            assert.strictEqual(children[0].toString(), 'bar}');
            assert.ok(children[1] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(children[1].toString(), 'foo');
        });
        test('Parser, placeholder', () => {
            assertTextAndMarker('farboo', 'farboo', snippetParser_1.Text);
            assertTextAndMarker('far{{}}boo', 'far{{}}boo', snippetParser_1.Text);
            assertTextAndMarker('far{{123}}boo', 'far{{123}}boo', snippetParser_1.Text);
            assertTextAndMarker('far\\{{123}}boo', 'far\\{{123}}boo', snippetParser_1.Text);
        });
        test('Parser, literal code', () => {
            assertTextAndMarker('far`123`boo', 'far`123`boo', snippetParser_1.Text);
            assertTextAndMarker('far\\`123\\`boo', 'far\\`123\\`boo', snippetParser_1.Text);
        });
        test('Parser, variables/tabstop', () => {
            assertTextAndMarker('$far-boo', '-boo', snippetParser_1.Variable, snippetParser_1.Text);
            assertTextAndMarker('\\$far-boo', '$far-boo', snippetParser_1.Text);
            assertTextAndMarker('far$farboo', 'far', snippetParser_1.Text, snippetParser_1.Variable);
            assertTextAndMarker('far${farboo}', 'far', snippetParser_1.Text, snippetParser_1.Variable);
            assertTextAndMarker('$123', '', snippetParser_1.Placeholder);
            assertTextAndMarker('$farboo', '', snippetParser_1.Variable);
            assertTextAndMarker('$far12boo', '', snippetParser_1.Variable);
            assertTextAndMarker('000_${far}_000', '000__000', snippetParser_1.Text, snippetParser_1.Variable, snippetParser_1.Text);
            assertTextAndMarker('FFF_${TM_SELECTED_TEXT}_FFF$0', 'FFF__FFF', snippetParser_1.Text, snippetParser_1.Variable, snippetParser_1.Text, snippetParser_1.Placeholder);
        });
        test('Parser, variables/placeholder with defaults', () => {
            assertTextAndMarker('${name:value}', 'value', snippetParser_1.Variable);
            assertTextAndMarker('${1:value}', 'value', snippetParser_1.Placeholder);
            assertTextAndMarker('${1:bar${2:foo}bar}', 'barfoobar', snippetParser_1.Placeholder);
            assertTextAndMarker('${name:value', '${name:value', snippetParser_1.Text);
            assertTextAndMarker('${1:bar${2:foobar}', '${1:barfoobar', snippetParser_1.Text, snippetParser_1.Placeholder);
        });
        test('Parser, variable transforms', function () {
            assertTextAndMarker('${foo///}', '', snippetParser_1.Variable);
            assertTextAndMarker('${foo/regex/format/gmi}', '', snippetParser_1.Variable);
            assertTextAndMarker('${foo/([A-Z][a-z])/format/}', '', snippetParser_1.Variable);
            // invalid regex
            assertTextAndMarker('${foo/([A-Z][a-z])/format/GMI}', '${foo/([A-Z][a-z])/format/GMI}', snippetParser_1.Text);
            assertTextAndMarker('${foo/([A-Z][a-z])/format/funky}', '${foo/([A-Z][a-z])/format/funky}', snippetParser_1.Text);
            assertTextAndMarker('${foo/([A-Z][a-z]/format/}', '${foo/([A-Z][a-z]/format/}', snippetParser_1.Text);
            // tricky regex
            assertTextAndMarker('${foo/m\\/atch/$1/i}', '', snippetParser_1.Variable);
            assertMarker('${foo/regex\/format/options}', snippetParser_1.Text);
            // incomplete
            assertTextAndMarker('${foo///', '${foo///', snippetParser_1.Text);
            assertTextAndMarker('${foo/regex/format/options', '${foo/regex/format/options', snippetParser_1.Text);
            // format string
            assertMarker('${foo/.*/${0:fooo}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/${1}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/$1/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/This-$1-encloses/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:else}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:-else}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:+if}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:?if:else}/i}', snippetParser_1.Variable);
            assertMarker('${foo/.*/complex${1:/upcase}/i}', snippetParser_1.Variable);
        });
        test('Parser, placeholder transforms', function () {
            assertTextAndMarker('${1///}', '', snippetParser_1.Placeholder);
            assertTextAndMarker('${1/regex/format/gmi}', '', snippetParser_1.Placeholder);
            assertTextAndMarker('${1/([A-Z][a-z])/format/}', '', snippetParser_1.Placeholder);
            // tricky regex
            assertTextAndMarker('${1/m\\/atch/$1/i}', '', snippetParser_1.Placeholder);
            assertMarker('${1/regex\/format/options}', snippetParser_1.Text);
            // incomplete
            assertTextAndMarker('${1///', '${1///', snippetParser_1.Text);
            assertTextAndMarker('${1/regex/format/options', '${1/regex/format/options', snippetParser_1.Text);
        });
        test('No way to escape forward slash in snippet regex #36715', function () {
            assertMarker('${TM_DIRECTORY/src\\//$1/}', snippetParser_1.Variable);
        });
        test('No way to escape forward slash in snippet format section #37562', function () {
            assertMarker('${TM_SELECTED_TEXT/a/\\/$1/g}', snippetParser_1.Variable);
            assertMarker('${TM_SELECTED_TEXT/a/in\\/$1ner/g}', snippetParser_1.Variable);
            assertMarker('${TM_SELECTED_TEXT/a/end\\//g}', snippetParser_1.Variable);
        });
        test('Parser, placeholder with choice', () => {
            assertTextAndMarker('${1|one,two,three|}', 'one', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one|}', 'one', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one1,two2|}', 'one1', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one1\\,two2|}', 'one1,two2', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one1\\|two2|}', 'one1|two2', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one1\\atwo2|}', 'one1\\atwo2', snippetParser_1.Placeholder);
            assertTextAndMarker('${1|one,two,three,|}', '${1|one,two,three,|}', snippetParser_1.Text);
            assertTextAndMarker('${1|one,', '${1|one,', snippetParser_1.Text);
            const snippet = new snippetParser_1.SnippetParser().parse('${1|one,two,three|}');
            const expected = [
                m => m instanceof snippetParser_1.Placeholder,
                m => m instanceof snippetParser_1.Choice && m.options.length === 3 && m.options.every(x => x instanceof snippetParser_1.Text),
            ];
            snippet.walk(marker => {
                assert.ok(expected.shift()(marker));
                return true;
            });
        });
        test('Snippet choices: unable to escape comma and pipe, #31521', function () {
            assertTextAndMarker('console.log(${1|not\\, not, five, 5, 1   23|});', 'console.log(not, not);', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text);
        });
        test('Marker, toTextmateString()', function () {
            function assertTextsnippetString(input, expected) {
                const snippet = new snippetParser_1.SnippetParser().parse(input);
                const actual = snippet.toTextmateString();
                assert.strictEqual(actual, expected);
            }
            assertTextsnippetString('$1', '$1');
            assertTextsnippetString('\\$1', '\\$1');
            assertTextsnippetString('console.log(${1|not\\, not, five, 5, 1   23|});', 'console.log(${1|not\\, not, five, 5, 1   23|});');
            assertTextsnippetString('console.log(${1|not\\, not, \\| five, 5, 1   23|});', 'console.log(${1|not\\, not, \\| five, 5, 1   23|});');
            assertTextsnippetString('${1|cho\\,ices,wi\\|th,esc\\\\aping,chall\\\\\\,enges|}', '${1|cho\\,ices,wi\\|th,esc\\\\aping,chall\\\\\\,enges|}');
            assertTextsnippetString('this is text', 'this is text');
            assertTextsnippetString('this ${1:is ${2:nested with $var}}', 'this ${1:is ${2:nested with ${var}}}');
            assertTextsnippetString('this ${1:is ${2:nested with $var}}}', 'this ${1:is ${2:nested with ${var}}}\\}');
        });
        test('Marker, toTextmateString() <-> identity', function () {
            function assertIdent(input) {
                // full loop: (1) parse input, (2) generate textmate string, (3) parse, (4) ensure both trees are equal
                const snippet = new snippetParser_1.SnippetParser().parse(input);
                const input2 = snippet.toTextmateString();
                const snippet2 = new snippetParser_1.SnippetParser().parse(input2);
                function checkCheckChildren(marker1, marker2) {
                    assert.ok(marker1 instanceof Object.getPrototypeOf(marker2).constructor);
                    assert.ok(marker2 instanceof Object.getPrototypeOf(marker1).constructor);
                    assert.strictEqual(marker1.children.length, marker2.children.length);
                    assert.strictEqual(marker1.toString(), marker2.toString());
                    for (let i = 0; i < marker1.children.length; i++) {
                        checkCheckChildren(marker1.children[i], marker2.children[i]);
                    }
                }
                checkCheckChildren(snippet, snippet2);
            }
            assertIdent('$1');
            assertIdent('\\$1');
            assertIdent('console.log(${1|not\\, not, five, 5, 1   23|});');
            assertIdent('console.log(${1|not\\, not, \\| five, 5, 1   23|});');
            assertIdent('this is text');
            assertIdent('this ${1:is ${2:nested with $var}}');
            assertIdent('this ${1:is ${2:nested with $var}}}');
            assertIdent('this ${1:is ${2:nested with $var}} and repeating $1');
        });
        test('Parser, choise marker', () => {
            const { placeholders } = new snippetParser_1.SnippetParser().parse('${1|one,two,three|}');
            assert.strictEqual(placeholders.length, 1);
            assert.ok(placeholders[0].choice instanceof snippetParser_1.Choice);
            assert.ok(placeholders[0].children[0] instanceof snippetParser_1.Choice);
            assert.strictEqual(placeholders[0].children[0].options.length, 3);
            assertText('${1|one,two,three|}', 'one');
            assertText('\\${1|one,two,three|}', '${1|one,two,three|}');
            assertText('${1\\|one,two,three|}', '${1\\|one,two,three|}');
            assertText('${1||}', '${1||}');
        });
        test('Backslash character escape in choice tabstop doesn\'t work #58494', function () {
            const { placeholders } = new snippetParser_1.SnippetParser().parse('${1|\\,,},$,\\|,\\\\|}');
            assert.strictEqual(placeholders.length, 1);
            assert.ok(placeholders[0].choice instanceof snippetParser_1.Choice);
        });
        test('Parser, only textmate', () => {
            const p = new snippetParser_1.SnippetParser();
            assertMarker(p.parse('far{{}}boo'), snippetParser_1.Text);
            assertMarker(p.parse('far{{123}}boo'), snippetParser_1.Text);
            assertMarker(p.parse('far\\{{123}}boo'), snippetParser_1.Text);
            assertMarker(p.parse('far$0boo'), snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text);
            assertMarker(p.parse('far${123}boo'), snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text);
            assertMarker(p.parse('far\\${123}boo'), snippetParser_1.Text);
        });
        test('Parser, real world', () => {
            let marker = new snippetParser_1.SnippetParser().parse('console.warn(${1: $TM_SELECTED_TEXT })').children;
            assert.strictEqual(marker[0].toString(), 'console.warn(');
            assert.ok(marker[1] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(marker[2].toString(), ')');
            const placeholder = marker[1];
            assert.strictEqual(placeholder.index, 1);
            assert.strictEqual(placeholder.children.length, 3);
            assert.ok(placeholder.children[0] instanceof snippetParser_1.Text);
            assert.ok(placeholder.children[1] instanceof snippetParser_1.Variable);
            assert.ok(placeholder.children[2] instanceof snippetParser_1.Text);
            assert.strictEqual(placeholder.children[0].toString(), ' ');
            assert.strictEqual(placeholder.children[1].toString(), '');
            assert.strictEqual(placeholder.children[2].toString(), ' ');
            const nestedVariable = placeholder.children[1];
            assert.strictEqual(nestedVariable.name, 'TM_SELECTED_TEXT');
            assert.strictEqual(nestedVariable.children.length, 0);
            marker = new snippetParser_1.SnippetParser().parse('$TM_SELECTED_TEXT').children;
            assert.strictEqual(marker.length, 1);
            assert.ok(marker[0] instanceof snippetParser_1.Variable);
        });
        test('Parser, transform example', () => {
            const { children } = new snippetParser_1.SnippetParser().parse('${1:name} : ${2:type}${3/\\s:=(.*)/${1:+ :=}${1}/};\n$0');
            //${1:name}
            assert.ok(children[0] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(children[0].children.length, 1);
            assert.strictEqual(children[0].children[0].toString(), 'name');
            assert.strictEqual(children[0].transform, undefined);
            // :
            assert.ok(children[1] instanceof snippetParser_1.Text);
            assert.strictEqual(children[1].toString(), ' : ');
            //${2:type}
            assert.ok(children[2] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(children[2].children.length, 1);
            assert.strictEqual(children[2].children[0].toString(), 'type');
            //${3/\\s:=(.*)/${1:+ :=}${1}/}
            assert.ok(children[3] instanceof snippetParser_1.Placeholder);
            assert.strictEqual(children[3].children.length, 0);
            assert.notStrictEqual(children[3].transform, undefined);
            const transform = children[3].transform;
            assert.deepStrictEqual(transform.regexp, /\s:=(.*)/);
            assert.strictEqual(transform.children.length, 2);
            assert.ok(transform.children[0] instanceof snippetParser_1.FormatString);
            assert.strictEqual(transform.children[0].index, 1);
            assert.strictEqual(transform.children[0].ifValue, ' :=');
            assert.ok(transform.children[1] instanceof snippetParser_1.FormatString);
            assert.strictEqual(transform.children[1].index, 1);
            assert.ok(children[4] instanceof snippetParser_1.Text);
            assert.strictEqual(children[4].toString(), ';\n');
        });
        // TODO @jrieken making this strictEqul causes circular json conversion errors
        test('Parser, default placeholder values', () => {
            assertMarker('errorContext: `${1:err}`, error: $1', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text, snippetParser_1.Placeholder);
            const [, p1, , p2] = new snippetParser_1.SnippetParser().parse('errorContext: `${1:err}`, error:$1').children;
            assert.strictEqual(p1.index, 1);
            assert.strictEqual(p1.children.length, 1);
            assert.strictEqual(p1.children[0].toString(), 'err');
            assert.strictEqual(p2.index, 1);
            assert.strictEqual(p2.children.length, 1);
            assert.strictEqual(p2.children[0].toString(), 'err');
        });
        // TODO @jrieken making this strictEqul causes circular json conversion errors
        test('Parser, default placeholder values and one transform', () => {
            assertMarker('errorContext: `${1:err}`, error: ${1/err/ok/}', snippetParser_1.Text, snippetParser_1.Placeholder, snippetParser_1.Text, snippetParser_1.Placeholder);
            const [, p3, , p4] = new snippetParser_1.SnippetParser().parse('errorContext: `${1:err}`, error:${1/err/ok/}').children;
            assert.strictEqual(p3.index, 1);
            assert.strictEqual(p3.children.length, 1);
            assert.strictEqual(p3.children[0].toString(), 'err');
            assert.strictEqual(p3.transform, undefined);
            assert.strictEqual(p4.index, 1);
            assert.strictEqual(p4.children.length, 1);
            assert.strictEqual(p4.children[0].toString(), 'err');
            assert.notStrictEqual(p4.transform, undefined);
        });
        test('Repeated snippet placeholder should always inherit, #31040', function () {
            assertText('${1:foo}-abc-$1', 'foo-abc-foo');
            assertText('${1:foo}-abc-${1}', 'foo-abc-foo');
            assertText('${1:foo}-abc-${1:bar}', 'foo-abc-foo');
            assertText('${1}-abc-${1:foo}', 'foo-abc-foo');
        });
        test('backspace esapce in TM only, #16212', () => {
            const actual = snippetParser_1.SnippetParser.asInsertText('Foo \\\\${abc}bar');
            assert.strictEqual(actual, 'Foo \\bar');
        });
        test('colon as variable/placeholder value, #16717', () => {
            let actual = snippetParser_1.SnippetParser.asInsertText('${TM_SELECTED_TEXT:foo:bar}');
            assert.strictEqual(actual, 'foo:bar');
            actual = snippetParser_1.SnippetParser.asInsertText('${1:foo:bar}');
            assert.strictEqual(actual, 'foo:bar');
        });
        test('incomplete placeholder', () => {
            assertTextAndMarker('${1:}', '', snippetParser_1.Placeholder);
        });
        test('marker#len', () => {
            function assertLen(template, ...lengths) {
                const snippet = new snippetParser_1.SnippetParser().parse(template, true);
                snippet.walk(m => {
                    const expected = lengths.shift();
                    assert.strictEqual(m.len(), expected);
                    return true;
                });
                assert.strictEqual(lengths.length, 0);
            }
            assertLen('text$0', 4, 0);
            assertLen('$1text$0', 0, 4, 0);
            assertLen('te$1xt$0', 2, 0, 2, 0);
            assertLen('errorContext: `${1:err}`, error: $0', 15, 0, 3, 10, 0);
            assertLen('errorContext: `${1:err}`, error: $1$0', 15, 0, 3, 10, 0, 3, 0);
            assertLen('$TM_SELECTED_TEXT$0', 0, 0);
            assertLen('${TM_SELECTED_TEXT:def}$0', 0, 3, 0);
        });
        test('parser, parent node', function () {
            let snippet = new snippetParser_1.SnippetParser().parse('This ${1:is ${2:nested}}$0', true);
            assert.strictEqual(snippet.placeholders.length, 3);
            let [first, second] = snippet.placeholders;
            assert.strictEqual(first.index, 1);
            assert.strictEqual(second.index, 2);
            assert.ok(second.parent === first);
            assert.ok(first.parent === snippet);
            snippet = new snippetParser_1.SnippetParser().parse('${VAR:default${1:value}}$0', true);
            assert.strictEqual(snippet.placeholders.length, 2);
            [first] = snippet.placeholders;
            assert.strictEqual(first.index, 1);
            assert.ok(snippet.children[0] instanceof snippetParser_1.Variable);
            assert.ok(first.parent === snippet.children[0]);
        });
        test('TextmateSnippet#enclosingPlaceholders', () => {
            const snippet = new snippetParser_1.SnippetParser().parse('This ${1:is ${2:nested}}$0', true);
            const [first, second] = snippet.placeholders;
            assert.deepStrictEqual(snippet.enclosingPlaceholders(first), []);
            assert.deepStrictEqual(snippet.enclosingPlaceholders(second), [first]);
        });
        test('TextmateSnippet#offset', () => {
            let snippet = new snippetParser_1.SnippetParser().parse('te$1xt', true);
            assert.strictEqual(snippet.offset(snippet.children[0]), 0);
            assert.strictEqual(snippet.offset(snippet.children[1]), 2);
            assert.strictEqual(snippet.offset(snippet.children[2]), 2);
            snippet = new snippetParser_1.SnippetParser().parse('${TM_SELECTED_TEXT:def}', true);
            assert.strictEqual(snippet.offset(snippet.children[0]), 0);
            assert.strictEqual(snippet.offset(snippet.children[0].children[0]), 0);
            // forgein marker
            assert.strictEqual(snippet.offset(new snippetParser_1.Text('foo')), -1);
        });
        test('TextmateSnippet#placeholder', () => {
            let snippet = new snippetParser_1.SnippetParser().parse('te$1xt$0', true);
            let placeholders = snippet.placeholders;
            assert.strictEqual(placeholders.length, 2);
            snippet = new snippetParser_1.SnippetParser().parse('te$1xt$1$0', true);
            placeholders = snippet.placeholders;
            assert.strictEqual(placeholders.length, 3);
            snippet = new snippetParser_1.SnippetParser().parse('te$1xt$2$0', true);
            placeholders = snippet.placeholders;
            assert.strictEqual(placeholders.length, 3);
            snippet = new snippetParser_1.SnippetParser().parse('${1:bar${2:foo}bar}$0', true);
            placeholders = snippet.placeholders;
            assert.strictEqual(placeholders.length, 3);
        });
        test('TextmateSnippet#replace 1/2', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('aaa${1:bbb${2:ccc}}$0', true);
            assert.strictEqual(snippet.placeholders.length, 3);
            const [, second] = snippet.placeholders;
            assert.strictEqual(second.index, 2);
            const enclosing = snippet.enclosingPlaceholders(second);
            assert.strictEqual(enclosing.length, 1);
            assert.strictEqual(enclosing[0].index, 1);
            const nested = new snippetParser_1.SnippetParser().parse('ddd$1eee$0', true);
            snippet.replace(second, nested.children);
            assert.strictEqual(snippet.toString(), 'aaabbbdddeee');
            assert.strictEqual(snippet.placeholders.length, 4);
            assert.strictEqual(snippet.placeholders[0].index, 1);
            assert.strictEqual(snippet.placeholders[1].index, 1);
            assert.strictEqual(snippet.placeholders[2].index, 0);
            assert.strictEqual(snippet.placeholders[3].index, 0);
            const newEnclosing = snippet.enclosingPlaceholders(snippet.placeholders[1]);
            assert.ok(newEnclosing[0] === snippet.placeholders[0]);
            assert.strictEqual(newEnclosing.length, 1);
            assert.strictEqual(newEnclosing[0].index, 1);
        });
        test('TextmateSnippet#replace 2/2', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('aaa${1:bbb${2:ccc}}$0', true);
            assert.strictEqual(snippet.placeholders.length, 3);
            const [, second] = snippet.placeholders;
            assert.strictEqual(second.index, 2);
            const nested = new snippetParser_1.SnippetParser().parse('dddeee$0', true);
            snippet.replace(second, nested.children);
            assert.strictEqual(snippet.toString(), 'aaabbbdddeee');
            assert.strictEqual(snippet.placeholders.length, 3);
        });
        test('Snippet order for placeholders, #28185', function () {
            const _10 = new snippetParser_1.Placeholder(10);
            const _2 = new snippetParser_1.Placeholder(2);
            assert.strictEqual(snippetParser_1.Placeholder.compareByIndex(_10, _2), 1);
        });
        test('Maximum call stack size exceeded, #28983', function () {
            new snippetParser_1.SnippetParser().parse('${1:${foo:${1}}}');
        });
        test('Snippet can freeze the editor, #30407', function () {
            const seen = new Set();
            seen.clear();
            new snippetParser_1.SnippetParser().parse('class ${1:${TM_FILENAME/(?:\\A|_)([A-Za-z0-9]+)(?:\\.rb)?/(?2::\\u$1)/g}} < ${2:Application}Controller\n  $3\nend').walk(marker => {
                assert.ok(!seen.has(marker));
                seen.add(marker);
                return true;
            });
            seen.clear();
            new snippetParser_1.SnippetParser().parse('${1:${FOO:abc$1def}}').walk(marker => {
                assert.ok(!seen.has(marker));
                seen.add(marker);
                return true;
            });
        });
        test('Snippets: make parser ignore `${0|choice|}`, #31599', function () {
            assertTextAndMarker('${0|foo,bar|}', '${0|foo,bar|}', snippetParser_1.Text);
            assertTextAndMarker('${1|foo,bar|}', 'foo', snippetParser_1.Placeholder);
        });
        test('Transform -> FormatString#resolve', function () {
            // shorthand functions
            assert.strictEqual(new snippetParser_1.FormatString(1, 'upcase').resolve('foo'), 'FOO');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'downcase').resolve('FOO'), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'capitalize').resolve('bar'), 'Bar');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'capitalize').resolve('bar no repeat'), 'Bar no repeat');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('bar-foo'), 'BarFoo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('bar-42-foo'), 'Bar42Foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('snake_AndPascalCase'), 'SnakeAndPascalCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('kebab-AndPascalCase'), 'KebabAndPascalCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'pascalcase').resolve('_justPascalCase'), 'JustPascalCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('bar-foo'), 'barFoo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('bar-42-foo'), 'bar42Foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('snake_AndCamelCase'), 'snakeAndCamelCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('kebab-AndCamelCase'), 'kebabAndCamelCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'camelcase').resolve('_JustCamelCase'), 'justCamelCase');
            assert.strictEqual(new snippetParser_1.FormatString(1, 'notKnown').resolve('input'), 'input');
            // if
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'foo', undefined).resolve(undefined), '');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'foo', undefined).resolve(''), '');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'foo', undefined).resolve('bar'), 'foo');
            // else
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, undefined, 'foo').resolve(undefined), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, undefined, 'foo').resolve(''), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, undefined, 'foo').resolve('bar'), 'bar');
            // if-else
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'bar', 'foo').resolve(undefined), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'bar', 'foo').resolve(''), 'foo');
            assert.strictEqual(new snippetParser_1.FormatString(1, undefined, 'bar', 'foo').resolve('baz'), 'bar');
        });
        test('Snippet variable transformation doesn\'t work if regex is complicated and snippet body contains \'$$\' #55627', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('const fileName = "${TM_FILENAME/(.*)\\..+$/$1/}"');
            assert.strictEqual(snippet.toTextmateString(), 'const fileName = "${TM_FILENAME/(.*)\\..+$/${1}/}"');
        });
        test('[BUG] HTML attribute suggestions: Snippet session does not have end-position set, #33147', function () {
            const { placeholders } = new snippetParser_1.SnippetParser().parse('src="$1"', true);
            const [first, second] = placeholders;
            assert.strictEqual(placeholders.length, 2);
            assert.strictEqual(first.index, 1);
            assert.strictEqual(second.index, 0);
        });
        test('Snippet optional transforms are not applied correctly when reusing the same variable, #37702', function () {
            const transform = new snippetParser_1.Transform();
            transform.appendChild(new snippetParser_1.FormatString(1, 'upcase'));
            transform.appendChild(new snippetParser_1.FormatString(2, 'upcase'));
            transform.regexp = /^(.)|-(.)/g;
            assert.strictEqual(transform.resolve('my-file-name'), 'MyFileName');
            const clone = transform.clone();
            assert.strictEqual(clone.resolve('my-file-name'), 'MyFileName');
        });
        test('problem with snippets regex #40570', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${TM_DIRECTORY/.*src[\\/](.*)/$1/}');
            assertMarker(snippet, snippetParser_1.Variable);
        });
        test('Variable transformation doesn\'t work if undefined variables are used in the same snippet #51769', function () {
            const transform = new snippetParser_1.Transform();
            transform.appendChild(new snippetParser_1.Text('bar'));
            transform.regexp = new RegExp('foo', 'gi');
            assert.strictEqual(transform.toTextmateString(), '/foo/bar/ig');
        });
        test('Snippet parser freeze #53144', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${1/(void$)|(.+)/${1:?-\treturn nil;}/}');
            assertMarker(snippet, snippetParser_1.Placeholder);
        });
        test('snippets variable not resolved in JSON proposal #52931', function () {
            assertTextAndMarker('FOO${1:/bin/bash}', 'FOO/bin/bash', snippetParser_1.Text, snippetParser_1.Placeholder);
        });
        test('Mirroring sequence of nested placeholders not selected properly on backjumping #58736', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${3:nest1 ${1:nest2 ${2:nest3}}} $3');
            assert.strictEqual(snippet.children.length, 3);
            assert.ok(snippet.children[0] instanceof snippetParser_1.Placeholder);
            assert.ok(snippet.children[1] instanceof snippetParser_1.Text);
            assert.ok(snippet.children[2] instanceof snippetParser_1.Placeholder);
            function assertParent(marker) {
                marker.children.forEach(assertParent);
                if (!(marker instanceof snippetParser_1.Placeholder)) {
                    return;
                }
                let found = false;
                let m = marker;
                while (m && !found) {
                    if (m.parent === snippet) {
                        found = true;
                    }
                    m = m.parent;
                }
                assert.ok(found);
            }
            const [, , clone] = snippet.children;
            assertParent(clone);
        });
        test('Backspace can\'t be escaped in snippet variable transforms #65412', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('namespace ${TM_DIRECTORY/[\\/]/\\\\/g};');
            assertMarker(snippet, snippetParser_1.Text, snippetParser_1.Variable, snippetParser_1.Text);
        });
        test('Snippet cannot escape closing bracket inside conditional insertion variable replacement #78883', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${TM_DIRECTORY/(.+)/${1:+import { hello \\} from world}/}');
            const variable = snippet.children[0];
            assert.strictEqual(snippet.children.length, 1);
            assert.ok(variable instanceof snippetParser_1.Variable);
            assert.ok(variable.transform);
            assert.strictEqual(variable.transform.children.length, 1);
            assert.ok(variable.transform.children[0] instanceof snippetParser_1.FormatString);
            assert.strictEqual(variable.transform.children[0].ifValue, 'import { hello } from world');
            assert.strictEqual(variable.transform.children[0].elseValue, undefined);
        });
        test('Snippet escape backslashes inside conditional insertion variable replacement #80394', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${CURRENT_YEAR/(.+)/${1:+\\\\}/}');
            const variable = snippet.children[0];
            assert.strictEqual(snippet.children.length, 1);
            assert.ok(variable instanceof snippetParser_1.Variable);
            assert.ok(variable.transform);
            assert.strictEqual(variable.transform.children.length, 1);
            assert.ok(variable.transform.children[0] instanceof snippetParser_1.FormatString);
            assert.strictEqual(variable.transform.children[0].ifValue, '\\');
            assert.strictEqual(variable.transform.children[0].elseValue, undefined);
        });
        test('Snippet placeholder empty right after expansion #152553', function () {
            const snippet = new snippetParser_1.SnippetParser().parse('${1:prog}: ${2:$1.cc} - $2');
            const actual = snippet.toString();
            assert.strictEqual(actual, 'prog: prog.cc - prog.cc');
            const snippet2 = new snippetParser_1.SnippetParser().parse('${1:prog}: ${3:${2:$1.cc}.33} - $2 $3');
            const actual2 = snippet2.toString();
            assert.strictEqual(actual2, 'prog: prog.cc.33 - prog.cc prog.cc.33');
            // cyclic references of placeholders
            const snippet3 = new snippetParser_1.SnippetParser().parse('${1:$2.one} <> ${2:$1.two}');
            const actual3 = snippet3.toString();
            assert.strictEqual(actual3, '.two.one.two.one <> .one.two.one.two');
        });
        test('Snippet choices are incorrectly escaped/applied #180132', function () {
            assertTextAndMarker('${1|aaa$aaa|}bbb\\$bbb', 'aaa$aaabbb$bbb', snippetParser_1.Placeholder, snippetParser_1.Text);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFBhcnNlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc25pcHBldC90ZXN0L2Jyb3dzZXIvc25pcHBldFBhcnNlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVFBLEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBRTNCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUVwQixNQUFNLE9BQU8sR0FBRyxJQUFJLHVCQUFPLEVBQUUsQ0FBQztZQUM5QixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLHlCQUFnQixDQUFDO1lBRXZELE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxpQ0FBeUIsQ0FBQztZQUNoRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLHlCQUFnQixDQUFDO1lBRXZELE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSw4QkFBc0IsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLDhCQUFzQixDQUFDO1lBQzdELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksaUNBQXlCLENBQUM7WUFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENB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