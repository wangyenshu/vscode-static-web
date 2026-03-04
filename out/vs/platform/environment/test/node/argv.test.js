/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/environment/node/argv", "vs/platform/environment/node/argvHelper"], function (require, exports, assert, utils_1, argv_1, argvHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function o(description, type = 'string') {
        return {
            description, type
        };
    }
    function c(description, options) {
        return {
            description, type: 'subcommand', options
        };
    }
    suite('formatOptions', () => {
        test('Text should display small columns correctly', () => {
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'add': o('bar')
            }, 80), ['  --add        bar']);
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'add': o('bar'),
                'wait': o('ba'),
                'trace': o('b')
            }, 80), [
                '  --add        bar',
                '  --wait       ba',
                '  --trace      b'
            ]);
        });
        test('Text should wrap', () => {
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'add': o('bar '.repeat(9))
            }, 40), [
                '  --add        bar bar bar bar bar bar',
                '               bar bar bar'
            ]);
        });
        test('Text should revert to the condensed view when the terminal is too narrow', () => {
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'add': o('bar '.repeat(9))
            }, 30), [
                '  --add',
                '      bar bar bar bar bar bar bar bar bar '
            ]);
        });
        test('addArg', () => {
            assert.deepStrictEqual((0, argvHelper_1.addArg)([], 'foo'), ['foo']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)([], 'foo', 'bar'), ['foo', 'bar']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)(['foo'], 'bar'), ['foo', 'bar']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)(['--wait'], 'bar'), ['--wait', 'bar']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)(['--wait', '--', '--foo'], 'bar'), ['--wait', 'bar', '--', '--foo']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)(['--', '--foo'], 'bar'), ['bar', '--', '--foo']);
        });
        test('subcommands', () => {
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'testcmd': c('A test command', { add: o('A test command option') })
            }, 30), [
                '  --testcmd',
                '      A test command'
            ]);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    suite('parseArgs', () => {
        function newErrorReporter(result = [], command = '') {
            const commandPrefix = command ? command + '-' : '';
            return {
                onDeprecatedOption: (deprecatedId) => result.push(`${commandPrefix}onDeprecatedOption ${deprecatedId}`),
                onUnknownOption: (id) => result.push(`${commandPrefix}onUnknownOption ${id}`),
                onEmptyValue: (id) => result.push(`${commandPrefix}onEmptyValue ${id}`),
                onMultipleValues: (id, usedValue) => result.push(`${commandPrefix}onMultipleValues ${id} ${usedValue}`),
                getSubcommandReporter: (c) => newErrorReporter(result, commandPrefix + c),
                result
            };
        }
        function assertParse(options, input, expected, expectedErrors) {
            const errorReporter = newErrorReporter();
            assert.deepStrictEqual((0, argv_1.parseArgs)(input, options, errorReporter), expected);
            assert.deepStrictEqual(errorReporter.result, expectedErrors);
        }
        test('subcommands', () => {
            const options1 = {
                'testcmd': c('A test command', {
                    testArg: o('A test command option'),
                    _: { type: 'string[]' }
                }),
                _: { type: 'string[]' }
            };
            assertParse(options1, ['testcmd', '--testArg=foo'], { testcmd: { testArg: 'foo', '_': [] }, '_': [] }, []);
            assertParse(options1, ['testcmd', '--testArg=foo', '--testX'], { testcmd: { testArg: 'foo', '_': [] }, '_': [] }, ['testcmd-onUnknownOption testX']);
            const options2 = {
                'testcmd': c('A test command', {
                    testArg: o('A test command option')
                }),
                testX: { type: 'boolean', global: true, description: '' },
                _: { type: 'string[]' }
            };
            assertParse(options2, ['testcmd', '--testArg=foo', '--testX'], { testcmd: { testArg: 'foo', testX: true, '_': [] }, '_': [] }, []);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJndi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZW52aXJvbm1lbnQvdGVzdC9ub2RlL2FyZ3YudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxTQUFTLENBQUMsQ0FBQyxXQUFtQixFQUFFLE9BQTBDLFFBQVE7UUFDakYsT0FBTztZQUNOLFdBQVcsRUFBRSxJQUFJO1NBQ2pCLENBQUM7SUFDSCxDQUFDO0lBQ0QsU0FBUyxDQUFDLENBQUMsV0FBbUIsRUFBRSxPQUFnQztRQUMvRCxPQUFPO1lBQ04sV0FBVyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsT0FBTztTQUN4QyxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBRTNCLElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLEVBQUU7WUFDeEQsTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSxvQkFBYSxFQUFDO2dCQUNiLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDO2FBQ2YsRUFBRSxFQUFFLENBQUMsRUFDTixDQUFDLG9CQUFvQixDQUFDLENBQ3RCLENBQUM7WUFDRixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLG9CQUFhLEVBQUM7Z0JBQ2IsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ2YsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2YsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUM7YUFDZixFQUFFLEVBQUUsQ0FBQyxFQUNOO2dCQUNDLG9CQUFvQjtnQkFDcEIsbUJBQW1CO2dCQUNuQixrQkFBa0I7YUFDbEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0JBQWtCLEVBQUUs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