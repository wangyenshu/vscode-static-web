define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/test/common/utils", "vs/platform/contextkey/common/contextkey"], function (require, exports, assert, platform_1, utils_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createContext(ctx) {
        return {
            getValue: (key) => {
                return ctx[key];
            }
        };
    }
    suite('ContextKeyExpr', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('ContextKeyExpr.equals', () => {
            const a = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('a1'), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('and.a')), contextkey_1.ContextKeyExpr.has('a2'), contextkey_1.ContextKeyExpr.regex('d3', /d.*/), contextkey_1.ContextKeyExpr.regex('d4', /\*\*3*/), contextkey_1.ContextKeyExpr.equals('b1', 'bb1'), contextkey_1.ContextKeyExpr.equals('b2', 'bb2'), contextkey_1.ContextKeyExpr.notEquals('c1', 'cc1'), contextkey_1.ContextKeyExpr.notEquals('c2', 'cc2'), contextkey_1.ContextKeyExpr.not('d1'), contextkey_1.ContextKeyExpr.not('d2'));
            const b = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('b2', 'bb2'), contextkey_1.ContextKeyExpr.notEquals('c1', 'cc1'), contextkey_1.ContextKeyExpr.not('d1'), contextkey_1.ContextKeyExpr.regex('d4', /\*\*3*/), contextkey_1.ContextKeyExpr.notEquals('c2', 'cc2'), contextkey_1.ContextKeyExpr.has('a2'), contextkey_1.ContextKeyExpr.equals('b1', 'bb1'), contextkey_1.ContextKeyExpr.regex('d3', /d.*/), contextkey_1.ContextKeyExpr.has('a1'), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('and.a', true)), contextkey_1.ContextKeyExpr.not('d2'));
            assert(a.equals(b), 'expressions should be equal');
        });
        test('issue #134942: Equals in comparator expressions', () => {
            function testEquals(expr, str) {
                const deserialized = contextkey_1.ContextKeyExpr.deserialize(str);
                assert.ok(expr);
                assert.ok(deserialized);
                assert.strictEqual(expr.equals(deserialized), true, str);
            }
            testEquals(contextkey_1.ContextKeyExpr.greater('value', 0), 'value > 0');
            testEquals(contextkey_1.ContextKeyExpr.greaterEquals('value', 0), 'value >= 0');
            testEquals(contextkey_1.ContextKeyExpr.smaller('value', 0), 'value < 0');
            testEquals(contextkey_1.ContextKeyExpr.smallerEquals('value', 0), 'value <= 0');
        });
        test('normalize', () => {
            const key1IsTrue = contextkey_1.ContextKeyExpr.equals('key1', true);
            const key1IsNotFalse = contextkey_1.ContextKeyExpr.notEquals('key1', false);
            const key1IsFalse = contextkey_1.ContextKeyExpr.equals('key1', false);
            const key1IsNotTrue = contextkey_1.ContextKeyExpr.notEquals('key1', true);
            assert.ok(key1IsTrue.equals(contextkey_1.ContextKeyExpr.has('key1')));
            assert.ok(key1IsNotFalse.equals(contextkey_1.ContextKeyExpr.has('key1')));
            assert.ok(key1IsFalse.equals(contextkey_1.ContextKeyExpr.not('key1')));
            assert.ok(key1IsNotTrue.equals(contextkey_1.ContextKeyExpr.not('key1')));
        });
        test('evaluate', () => {
            const context = createContext({
                'a': true,
                'b': false,
                'c': '5',
                'd': 'd'
            });
            function testExpression(expr, expected) {
                // console.log(expr + ' ' + expected);
                const rules = contextkey_1.ContextKeyExpr.deserialize(expr);
                assert.strictEqual(rules.evaluate(context), expected, expr);
            }
            function testBatch(expr, value) {
                /* eslint-disable eqeqeq */
                testExpression(expr, !!value);
                testExpression(expr + ' == true', !!value);
                testExpression(expr + ' != true', !value);
                testExpression(expr + ' == false', !value);
                testExpression(expr + ' != false', !!value);
                testExpression(expr + ' == 5', value == '5');
                testExpression(expr + ' != 5', value != '5');
                testExpression('!' + expr, !value);
                testExpression(expr + ' =~ /d.*/', /d.*/.test(value));
                testExpression(expr + ' =~ /D/i', /D/i.test(value));
                /* eslint-enable eqeqeq */
            }
            testBatch('a', true);
            testBatch('b', false);
            testBatch('c', '5');
            testBatch('d', 'd');
            testBatch('z', undefined);
            testExpression('true', true);
            testExpression('false', false);
            testExpression('a && !b', true && !false);
            testExpression('a && b', true && false);
            testExpression('a && !b && c == 5', true && !false && '5' === '5');
            testExpression('d =~ /e.*/', false);
            // precedence test: false && true || true === true because && is evaluated first
            testExpression('b && a || a', true);
            testExpression('a || b', true);
            testExpression('b || b', false);
            testExpression('b && a || a && b', false);
        });
        test('negate', () => {
            function testNegate(expr, expected) {
                const actual = contextkey_1.ContextKeyExpr.deserialize(expr).negate().serialize();
                assert.strictEqual(actual, expected);
            }
            testNegate('true', 'false');
            testNegate('false', 'true');
            testNegate('a', '!a');
            testNegate('a && b || c', '!a && !c || !b && !c');
            testNegate('a && b || c || d', '!a && !c && !d || !b && !c && !d');
            testNegate('!a && !b || !c && !d', 'a && c || a && d || b && c || b && d');
            testNegate('!a && !b || !c && !d || !e && !f', 'a && c && e || a && c && f || a && d && e || a && d && f || b && c && e || b && c && f || b && d && e || b && d && f');
        });
        test('false, true', () => {
            function testNormalize(expr, expected) {
                const actual = contextkey_1.ContextKeyExpr.deserialize(expr).serialize();
                assert.strictEqual(actual, expected);
            }
            testNormalize('true', 'true');
            testNormalize('!true', 'false');
            testNormalize('false', 'false');
            testNormalize('!false', 'true');
            testNormalize('a && true', 'a');
            testNormalize('a && false', 'false');
            testNormalize('a || true', 'true');
            testNormalize('a || false', 'a');
            testNormalize('isMac', platform_1.isMacintosh ? 'true' : 'false');
            testNormalize('isLinux', platform_1.isLinux ? 'true' : 'false');
            testNormalize('isWindows', platform_1.isWindows ? 'true' : 'false');
        });
        test('issue #101015: distribute OR', () => {
            function t(expr1, expr2, expected) {
                const e1 = contextkey_1.ContextKeyExpr.deserialize(expr1);
                const e2 = contextkey_1.ContextKeyExpr.deserialize(expr2);
                const actual = contextkey_1.ContextKeyExpr.and(e1, e2)?.serialize();
                assert.strictEqual(actual, expected);
            }
            t('a', 'b', 'a && b');
            t('a || b', 'c', 'a && c || b && c');
            t('a || b', 'c || d', 'a && c || a && d || b && c || b && d');
            t('a || b', 'c && d', 'a && c && d || b && c && d');
            t('a || b', 'c && d || e', 'a && e || b && e || a && c && d || b && c && d');
        });
        test('ContextKeyInExpr', () => {
            const ainb = contextkey_1.ContextKeyExpr.deserialize('a in b');
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 3, 'b': [3, 2, 1] })), true);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 3, 'b': [1, 2, 3] })), true);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 3, 'b': [1, 2] })), false);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 3 })), false);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 3, 'b': null })), false);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': ['x'] })), true);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': ['y'] })), false);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': {} })), false);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': { 'x': false } })), true);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': { 'x': true } })), true);
            assert.strictEqual(ainb.evaluate(createContext({ 'a': 'prototype', 'b': {} })), false);
        });
        test('ContextKeyNotInExpr', () => {
            const aNotInB = contextkey_1.ContextKeyExpr.deserialize('a not in b');
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 3, 'b': [3, 2, 1] })), false);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 3, 'b': [1, 2, 3] })), false);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 3, 'b': [1, 2] })), true);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 3 })), true);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 3, 'b': null })), true);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 'x', 'b': ['x'] })), false);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 'x', 'b': ['y'] })), true);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 'x', 'b': {} })), true);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 'x', 'b': { 'x': false } })), false);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 'x', 'b': { 'x': true } })), false);
            assert.strictEqual(aNotInB.evaluate(createContext({ 'a': 'prototype', 'b': {} })), true);
        });
        test('issue #106524: distributing AND should normalize', () => {
            const actual = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.has('a'), contextkey_1.ContextKeyExpr.has('b')), contextkey_1.ContextKeyExpr.has('c'));
            const expected = contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('a'), contextkey_1.ContextKeyExpr.has('c')), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('b'), contextkey_1.ContextKeyExpr.has('c')));
            assert.strictEqual(actual.equals(expected), true);
        });
        test('issue #129625: Removes duplicated terms in OR expressions', () => {
            const expr = contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.has('A'), contextkey_1.ContextKeyExpr.has('B'), contextkey_1.ContextKeyExpr.has('A'));
            assert.strictEqual(expr.serialize(), 'A || B');
        });
        test('Resolves true constant OR expressions', () => {
            const expr = contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.has('A'), contextkey_1.ContextKeyExpr.not('A'));
            assert.strictEqual(expr.serialize(), 'true');
        });
        test('Resolves false constant AND expressions', () => {
            const expr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('A'), contextkey_1.ContextKeyExpr.not('A'));
            assert.strictEqual(expr.serialize(), 'false');
        });
        test('issue #129625: Removes duplicated terms in AND expressions', () => {
            const expr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('A'), contextkey_1.ContextKeyExpr.has('B'), contextkey_1.ContextKeyExpr.has('A'));
            assert.strictEqual(expr.serialize(), 'A && B');
        });
        test('issue #129625: Remove duplicated terms when negating', () => {
            const expr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('A'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.has('B1'), contextkey_1.ContextKeyExpr.has('B2')));
            assert.strictEqual(expr.serialize(), 'A && B1 || A && B2');
            assert.strictEqual(expr.negate().serialize(), '!A || !A && !B1 || !A && !B2 || !B1 && !B2');
            assert.strictEqual(expr.negate().negate().serialize(), 'A && B1 || A && B2');
            assert.strictEqual(expr.negate().negate().negate().serialize(), '!A || !A && !B1 || !A && !B2 || !B1 && !B2');
        });
        test('issue #129625: remove redundant terms in OR expressions', () => {
            function strImplies(p0, q0) {
                const p = contextkey_1.ContextKeyExpr.deserialize(p0);
                const q = contextkey_1.ContextKeyExpr.deserialize(q0);
                return (0, contextkey_1.implies)(p, q);
            }
            assert.strictEqual(strImplies('a && b', 'a'), true);
            assert.strictEqual(strImplies('a', 'a && b'), false);
        });
        test('implies', () => {
            function strImplies(p0, q0) {
                const p = contextkey_1.ContextKeyExpr.deserialize(p0);
                const q = contextkey_1.ContextKeyExpr.deserialize(q0);
                return (0, contextkey_1.implies)(p, q);
            }
            assert.strictEqual(strImplies('a', 'a'), true);
            assert.strictEqual(strImplies('a', 'a || b'), true);
            assert.strictEqual(strImplies('a', 'a && b'), false);
            assert.strictEqual(strImplies('a', 'a && b || a && c'), false);
            assert.strictEqual(strImplies('a && b', 'a'), true);
            assert.strictEqual(strImplies('a && b', 'b'), true);
            assert.strictEqual(strImplies('a && b', 'a && b || c'), true);
            assert.strictEqual(strImplies('a || b', 'a || c'), false);
            assert.strictEqual(strImplies('a || b', 'a || b'), true);
            assert.strictEqual(strImplies('a && b', 'a && b'), true);
            assert.strictEqual(strImplies('a || b', 'a || b || c'), true);
            assert.strictEqual(strImplies('c && a && b', 'c && a'), true);
        });
        test('Greater, GreaterEquals, Smaller, SmallerEquals evaluate', () => {
            function checkEvaluate(expr, ctx, expected) {
                const _expr = contextkey_1.ContextKeyExpr.deserialize(expr);
                assert.strictEqual(_expr.evaluate(createContext(ctx)), expected);
            }
            checkEvaluate('a > 1', {}, false);
            checkEvaluate('a > 1', { a: 0 }, false);
            checkEvaluate('a > 1', { a: 1 }, false);
            checkEvaluate('a > 1', { a: 2 }, true);
            checkEvaluate('a > 1', { a: '0' }, false);
            checkEvaluate('a > 1', { a: '1' }, false);
            checkEvaluate('a > 1', { a: '2' }, true);
            checkEvaluate('a > 1', { a: 'a' }, false);
            checkEvaluate('a > 10', { a: 2 }, false);
            checkEvaluate('a > 10', { a: 11 }, true);
            checkEvaluate('a > 10', { a: '11' }, true);
            checkEvaluate('a > 10', { a: '2' }, false);
            checkEvaluate('a > 10', { a: '11' }, true);
            checkEvaluate('a > 1.1', { a: 1 }, false);
            checkEvaluate('a > 1.1', { a: 2 }, true);
            checkEvaluate('a > 1.1', { a: 11 }, true);
            checkEvaluate('a > 1.1', { a: '1.1' }, false);
            checkEvaluate('a > 1.1', { a: '2' }, true);
            checkEvaluate('a > 1.1', { a: '11' }, true);
            checkEvaluate('a > b', { a: 'b' }, false);
            checkEvaluate('a > b', { a: 'c' }, false);
            checkEvaluate('a > b', { a: 1000 }, false);
            checkEvaluate('a >= 2', { a: '1' }, false);
            checkEvaluate('a >= 2', { a: '2' }, true);
            checkEvaluate('a >= 2', { a: '3' }, true);
            checkEvaluate('a < 2', { a: '1' }, true);
            checkEvaluate('a < 2', { a: '2' }, false);
            checkEvaluate('a < 2', { a: '3' }, false);
            checkEvaluate('a <= 2', { a: '1' }, true);
            checkEvaluate('a <= 2', { a: '2' }, true);
            checkEvaluate('a <= 2', { a: '3' }, false);
        });
        test('Greater, GreaterEquals, Smaller, SmallerEquals negate', () => {
            function checkNegate(expr, expected) {
                const a = contextkey_1.ContextKeyExpr.deserialize(expr);
                const b = a.negate();
                assert.strictEqual(b.serialize(), expected);
            }
            checkNegate('a > 1', 'a <= 1');
            checkNegate('a > 1.1', 'a <= 1.1');
            checkNegate('a > b', 'a <= b');
            checkNegate('a >= 1', 'a < 1');
            checkNegate('a >= 1.1', 'a < 1.1');
            checkNegate('a >= b', 'a < b');
            checkNegate('a < 1', 'a >= 1');
            checkNegate('a < 1.1', 'a >= 1.1');
            checkNegate('a < b', 'a >= b');
            checkNegate('a <= 1', 'a > 1');
            checkNegate('a <= 1.1', 'a > 1.1');
            checkNegate('a <= b', 'a > b');
        });
        test('issue #111899: context keys can use `<` or `>` ', () => {
            const actual = contextkey_1.ContextKeyExpr.deserialize('editorTextFocus && vim.active && vim.use<C-r>');
            assert.ok(actual.equals(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('editorTextFocus'), contextkey_1.ContextKeyExpr.has('vim.active'), contextkey_1.ContextKeyExpr.has('vim.use<C-r>'))));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dGtleS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29udGV4dGtleS90ZXN0L2NvbW1vbi9jb250ZXh0a2V5LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBU0EsU0FBUyxhQUFhLENBQUMsR0FBUTtRQUM5QixPQUFPO1lBQ04sUUFBUSxFQUFFLENBQUMsR0FBVyxFQUFFLEVBQUU7Z0JBQ3pCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFFNUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFDbEMsTUFBTSxDQUFDLEdBQUcsMkJBQWMsQ0FBQyxHQUFHLENBQzNCLDJCQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUN4QiwyQkFBYyxDQUFDLEdBQUcsQ0FBQywyQkFBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUMvQywyQkFBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFDeEIsMkJBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUNqQywyQkFBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQ3BDLDJCQUFjLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFDbEMsMkJBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUNsQywyQkFBYyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQ3JDLDJCQUFjLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxL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RUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2QyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6QyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekMsYUFBYSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6QyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0MsYUFBYSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUzQyxhQUFhLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekMsYUFBYSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxQyxhQUFhLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0MsYUFBYSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUU1QyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUzQyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzNDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUxQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUxQyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1REFBdUQsRUFBRSxHQUFHLEVBQUU7WUFDbEUsU0FBUyxXQUFXLENBQUMsSUFBWSxFQUFFLFFBQWdCO2dCQUNsRCxNQUFNLENBQUMsR0FBRywyQkFBYyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUUsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsV0FBVyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMvQixXQUFXLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ25DLFdBQVcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFL0IsV0FBVyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvQixXQUFXLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFL0IsV0FBVyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMvQixXQUFXLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ25DLFdBQVcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFL0IsV0FBVyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvQixXQUFXLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFO1lBQzVELE1BQU0sTUFBTSxHQUFHLDJCQUFjLENBQUMsV0FBVyxDQUFDLCtDQUErQyxDQUFFLENBQUM7WUFDNUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUN0QiwyQkFBYyxDQUFDLEdBQUcsQ0FDakIsMkJBQWMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsRUFDckMsMkJBQWMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQ2hDLDJCQUFjLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUNqQyxDQUNGLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==