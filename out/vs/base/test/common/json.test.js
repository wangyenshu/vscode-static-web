define(["require", "exports", "assert", "vs/base/common/json", "vs/base/common/jsonErrorMessages", "vs/base/test/common/utils"], function (require, exports, assert, json_1, jsonErrorMessages_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertKinds(text, ...kinds) {
        const scanner = (0, json_1.createScanner)(text);
        let kind;
        while ((kind = scanner.scan()) !== 17 /* SyntaxKind.EOF */) {
            assert.strictEqual(kind, kinds.shift());
        }
        assert.strictEqual(kinds.length, 0);
    }
    function assertScanError(text, expectedKind, scanError) {
        const scanner = (0, json_1.createScanner)(text);
        scanner.scan();
        assert.strictEqual(scanner.getToken(), expectedKind);
        assert.strictEqual(scanner.getTokenError(), scanError);
    }
    function assertValidParse(input, expected, options) {
        const errors = [];
        const actual = (0, json_1.parse)(input, errors, options);
        if (errors.length !== 0) {
            assert(false, (0, jsonErrorMessages_1.getParseErrorMessage)(errors[0].error));
        }
        assert.deepStrictEqual(actual, expected);
    }
    function assertInvalidParse(input, expected, options) {
        const errors = [];
        const actual = (0, json_1.parse)(input, errors, options);
        assert(errors.length > 0);
        assert.deepStrictEqual(actual, expected);
    }
    function assertTree(input, expected, expectedErrors = [], options) {
        const errors = [];
        const actual = (0, json_1.parseTree)(input, errors, options);
        assert.deepStrictEqual(errors.map(e => e.error, expected), expectedErrors);
        const checkParent = (node) => {
            if (node.children) {
                for (const child of node.children) {
                    assert.strictEqual(node, child.parent);
                    delete child.parent; // delete to avoid recursion in deep equal
                    checkParent(child);
                }
            }
        };
        checkParent(actual);
        assert.deepStrictEqual(actual, expected);
    }
    suite('JSON', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('tokens', () => {
            assertKinds('{', 1 /* SyntaxKind.OpenBraceToken */);
            assertKinds('}', 2 /* SyntaxKind.CloseBraceToken */);
            assertKinds('[', 3 /* SyntaxKind.OpenBracketToken */);
            assertKinds(']', 4 /* SyntaxKind.CloseBracketToken */);
            assertKinds(':', 6 /* SyntaxKind.ColonToken */);
            assertKinds(',', 5 /* SyntaxKind.CommaToken */);
        });
        test('comments', () => {
            assertKinds('// this is a comment', 12 /* SyntaxKind.LineCommentTrivia */);
            assertKinds('// this is a comment\n', 12 /* SyntaxKind.LineCommentTrivia */, 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('/* this is a comment*/', 13 /* SyntaxKind.BlockCommentTrivia */);
            assertKinds('/* this is a \r\ncomment*/', 13 /* SyntaxKind.BlockCommentTrivia */);
            assertKinds('/* this is a \ncomment*/', 13 /* SyntaxKind.BlockCommentTrivia */);
            // unexpected end
            assertKinds('/* this is a', 13 /* SyntaxKind.BlockCommentTrivia */);
            assertKinds('/* this is a \ncomment', 13 /* SyntaxKind.BlockCommentTrivia */);
            // broken comment
            assertKinds('/ ttt', 16 /* SyntaxKind.Unknown */, 15 /* SyntaxKind.Trivia */, 16 /* SyntaxKind.Unknown */);
        });
        test('strings', () => {
            assertKinds('"test"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\""', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\/"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\b"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\f"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\n"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\r"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\t"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\\v"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"\u88ff"', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"​\u2028"', 10 /* SyntaxKind.StringLiteral */);
            // unexpected end
            assertKinds('"test', 10 /* SyntaxKind.StringLiteral */);
            assertKinds('"test\n"', 10 /* SyntaxKind.StringLiteral */, 14 /* SyntaxKind.LineBreakTrivia */, 10 /* SyntaxKind.StringLiteral */);
            // invalid characters
            assertScanError('"\t"', 10 /* SyntaxKind.StringLiteral */, 6 /* ScanError.InvalidCharacter */);
            assertScanError('"\t "', 10 /* SyntaxKind.StringLiteral */, 6 /* ScanError.InvalidCharacter */);
        });
        test('numbers', () => {
            assertKinds('0', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('0.1', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('-0.1', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('-1', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('1', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('123456789', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('10', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90E+123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90e+123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90e-123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90E-123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90E123', 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('90e123', 11 /* SyntaxKind.NumericLiteral */);
            // zero handling
            assertKinds('01', 11 /* SyntaxKind.NumericLiteral */, 11 /* SyntaxKind.NumericLiteral */);
            assertKinds('-01', 11 /* SyntaxKind.NumericLiteral */, 11 /* SyntaxKind.NumericLiteral */);
            // unexpected end
            assertKinds('-', 16 /* SyntaxKind.Unknown */);
            assertKinds('.0', 16 /* SyntaxKind.Unknown */);
        });
        test('keywords: true, false, null', () => {
            assertKinds('true', 8 /* SyntaxKind.TrueKeyword */);
            assertKinds('false', 9 /* SyntaxKind.FalseKeyword */);
            assertKinds('null', 7 /* SyntaxKind.NullKeyword */);
            assertKinds('true false null', 8 /* SyntaxKind.TrueKeyword */, 15 /* SyntaxKind.Trivia */, 9 /* SyntaxKind.FalseKeyword */, 15 /* SyntaxKind.Trivia */, 7 /* SyntaxKind.NullKeyword */);
            // invalid words
            assertKinds('nulllll', 16 /* SyntaxKind.Unknown */);
            assertKinds('True', 16 /* SyntaxKind.Unknown */);
            assertKinds('foo-bar', 16 /* SyntaxKind.Unknown */);
            assertKinds('foo bar', 16 /* SyntaxKind.Unknown */, 15 /* SyntaxKind.Trivia */, 16 /* SyntaxKind.Unknown */);
        });
        test('trivia', () => {
            assertKinds(' ', 15 /* SyntaxKind.Trivia */);
            assertKinds('  \t  ', 15 /* SyntaxKind.Trivia */);
            assertKinds('  \t  \n  \t  ', 15 /* SyntaxKind.Trivia */, 14 /* SyntaxKind.LineBreakTrivia */, 15 /* SyntaxKind.Trivia */);
            assertKinds('\r\n', 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('\r', 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('\n', 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('\n\r', 14 /* SyntaxKind.LineBreakTrivia */, 14 /* SyntaxKind.LineBreakTrivia */);
            assertKinds('\n   \n', 14 /* SyntaxKind.LineBreakTrivia */, 15 /* SyntaxKind.Trivia */, 14 /* SyntaxKind.LineBreakTrivia */);
        });
        test('parse: literals', () => {
            assertValidParse('true', true);
            assertValidParse('false', false);
            assertValidParse('null', null);
            assertValidParse('"foo"', 'foo');
            assertValidParse('"\\"-\\\\-\\/-\\b-\\f-\\n-\\r-\\t"', '"-\\-/-\b-\f-\n-\r-\t');
            assertValidParse('"\\u00DC"', 'Ü');
            assertValidParse('9', 9);
            assertValidParse('-9', -9);
            assertValidParse('0.129', 0.129);
            assertValidParse('23e3', 23e3);
            assertValidParse('1.2E+3', 1.2E+3);
            assertValidParse('1.2E-3', 1.2E-3);
            assertValidParse('1.2E-3 // comment', 1.2E-3);
        });
        test('parse: objects', () => {
            assertValidParse('{}', {});
            assertValidParse('{ "foo": true }', { foo: true });
            assertValidParse('{ "bar": 8, "xoo": "foo" }', { bar: 8, xoo: 'foo' });
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
            assertValidParse('{ "a": false, "b": true, "c": [ 7.4 ] }', { a: false, b: true, c: [7.4] });
            assertValidParse('{ "lineComment": "//", "blockComment": ["/*", "*/"], "brackets": [ ["{", "}"], ["[", "]"], ["(", ")"] ] }', { lineComment: '//', blockComment: ['/*', '*/'], brackets: [['{', '}'], ['[', ']'], ['(', ')']] });
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
            assertValidParse('{ "hello": { "again": { "inside": 5 }, "world": 1 }}', { hello: { again: { inside: 5 }, world: 1 } });
            assertValidParse('{ "foo": /*hello*/true }', { foo: true });
        });
        test('parse: arrays', () => {
            assertValidParse('[]', []);
            assertValidParse('[ [],  [ [] ]]', [[], [[]]]);
            assertValidParse('[ 1, 2, 3 ]', [1, 2, 3]);
            assertValidParse('[ { "a": null } ]', [{ a: null }]);
        });
        test('parse: objects with errors', () => {
            assertInvalidParse('{,}', {});
            assertInvalidParse('{ "foo": true, }', { foo: true }, { allowTrailingComma: false });
            assertInvalidParse('{ "bar": 8 "xoo": "foo" }', { bar: 8, xoo: 'foo' });
            assertInvalidParse('{ ,"bar": 8 }', { bar: 8 });
            assertInvalidParse('{ ,"bar": 8, "foo" }', { bar: 8 });
            assertInvalidParse('{ "bar": 8, "foo": }', { bar: 8 });
            assertInvalidParse('{ 8, "foo": 9 }', { foo: 9 });
        });
        test('parse: array with errors', () => {
            assertInvalidParse('[,]', []);
            assertInvalidParse('[ 1, 2, ]', [1, 2], { allowTrailingComma: false });
            assertInvalidParse('[ 1 2, 3 ]', [1, 2, 3]);
            assertInvalidParse('[ ,1, 2, 3 ]', [1, 2, 3]);
            assertInvalidParse('[ ,1, 2, 3, ]', [1, 2, 3], { allowTrailingComma: false });
        });
        test('parse: disallow commments', () => {
            const options = { disallowComments: true };
            assertValidParse('[ 1, 2, null, "foo" ]', [1, 2, null, 'foo'], options);
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} }, options);
            assertInvalidParse('{ "foo": /*comment*/ true }', { foo: true }, options);
        });
        test('parse: trailing comma', () => {
            // default is allow
            assertValidParse('{ "hello": [], }', { hello: [] });
            let options = { allowTrailingComma: true };
            assertValidParse('{ "hello": [], }', { hello: [] }, options);
            assertValidParse('{ "hello": [] }', { hello: [] }, options);
            assertValidParse('{ "hello": [], "world": {}, }', { hello: [], world: {} }, options);
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} }, options);
            assertValidParse('{ "hello": [1,] }', { hello: [1] }, options);
            options = { allowTrailingComma: false };
            assertInvalidParse('{ "hello": [], }', { hello: [] }, options);
            assertInvalidParse('{ "hello": [], "world": {}, }', { hello: [], world: {} }, options);
        });
        test('tree: literals', () => {
            assertTree('true', { type: 'boolean', offset: 0, length: 4, value: true });
            assertTree('false', { type: 'boolean', offset: 0, length: 5, value: false });
            assertTree('null', { type: 'null', offset: 0, length: 4, value: null });
            assertTree('23', { type: 'number', offset: 0, length: 2, value: 23 });
            assertTree('-1.93e-19', { type: 'number', offset: 0, length: 9, value: -1.93e-19 });
            assertTree('"hello"', { type: 'string', offset: 0, length: 7, value: 'hello' });
        });
        test('tree: arrays', () => {
            assertTree('[]', { type: 'array', offset: 0, length: 2, children: [] });
            assertTree('[ 1 ]', { type: 'array', offset: 0, length: 5, children: [{ type: 'number', offset: 2, length: 1, value: 1 }] });
            assertTree('[ 1,"x"]', {
                type: 'array', offset: 0, length: 8, children: [
                    { type: 'number', offset: 2, length: 1, value: 1 },
                    { type: 'string', offset: 4, length: 3, value: 'x' }
                ]
            });
            assertTree('[[]]', {
                type: 'array', offset: 0, length: 4, children: [
                    { type: 'array', offset: 1, length: 2, children: [] }
                ]
            });
        });
        test('tree: objects', () => {
            assertTree('{ }', { type: 'object', offset: 0, length: 3, children: [] });
            assertTree('{ "val": 1 }', {
                type: 'object', offset: 0, length: 12, children: [
                    {
                        type: 'property', offset: 2, length: 8, colonOffset: 7, children: [
                            { type: 'string', offset: 2, length: 5, value: 'val' },
                            { type: 'number', offset: 9, length: 1, value: 1 }
                        ]
                    }
                ]
            });
            assertTree('{"id": "$", "v": [ null, null] }', {
                type: 'object', offset: 0, length: 32, children: [
                    {
                        type: 'property', offset: 1, length: 9, colonOffset: 5, children: [
                            { type: 'string', offset: 1, length: 4, value: 'id' },
                            { type: 'string', offset: 7, length: 3, value: '$' }
                        ]
                    },
                    {
                        type: 'property', offset: 12, length: 18, colonOffset: 15, children: [
                            { type: 'string', offset: 12, length: 3, value: 'v' },
                            {
                                type: 'array', offset: 17, length: 13, children: [
                                    { type: 'null', offset: 19, length: 4, value: null },
                                    { type: 'null', offset: 25, length: 4, value: null }
                                ]
                            }
                        ]
                    }
                ]
            });
            assertTree('{  "id": { "foo": { } } , }', {
                type: 'object', offset: 0, length: 27, children: [
                    {
                        type: 'property', offset: 3, length: 20, colonOffset: 7, children: [
                            { type: 'string', offset: 3, length: 4, value: 'id' },
                            {
                                type: 'object', offset: 9, length: 14, children: [
                                    {
                                        type: 'property', offset: 11, length: 10, colonOffset: 16, children: [
                                            { type: 'string', offset: 11, length: 5, value: 'foo' },
                                            { type: 'object', offset: 18, length: 3, children: [] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }, [3 /* ParseErrorCode.PropertyNameExpected */, 4 /* ParseErrorCode.ValueExpected */], { allowTrailingComma: false });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9qc29uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBU0EsU0FBUyxXQUFXLENBQUMsSUFBWSxFQUFFLEdBQUcsS0FBbUI7UUFDeEQsTUFBTSxPQUFPLEdBQUcsSUFBQSxvQkFBYSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQUksSUFBZ0IsQ0FBQztRQUNyQixPQUFPLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyw0QkFBbUIsRUFBRSxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUNELFNBQVMsZUFBZSxDQUFDLElBQVksRUFBRSxZQUF3QixFQUFFLFNBQW9CO1FBQ3BGLE1BQU0sT0FBTyxHQUFHLElBQUEsb0JBQWEsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFhLEVBQUUsUUFBYSxFQUFFLE9BQXNCO1FBQzdFLE1BQU0sTUFBTSxHQUFpQixFQUFFLENBQUM7UUFDaEMsTUFBTSxNQUFNLEdBQUcsSUFBQSxZQUFLLEVB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