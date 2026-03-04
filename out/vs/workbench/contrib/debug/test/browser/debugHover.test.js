/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/workbench/contrib/debug/browser/debugHover", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/test/browser/callStack.test", "vs/workbench/contrib/debug/test/browser/mockDebugModel"], function (require, exports, assert, utils_1, log_1, debugHover_1, debugModel_1, debugSource_1, callStack_test_1, mockDebugModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - Hover', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('find expression in stack frame', async () => {
            const model = (0, mockDebugModel_1.createMockDebugModel)(disposables);
            const session = disposables.add((0, callStack_test_1.createTestSession)(model));
            const thread = new class extends debugModel_1.Thread {
                getCallStack() {
                    return [stackFrame];
                }
            }(session, 'mockthread', 1);
            const firstSource = new debugSource_1.Source({
                name: 'internalModule.js',
                path: 'a/b/c/d/internalModule.js',
                sourceReference: 10,
            }, 'aDebugSessionId', mockDebugModel_1.mockUriIdentityService, new log_1.NullLogService());
            const stackFrame = new class extends debugModel_1.StackFrame {
                getScopes() {
                    return Promise.resolve([scope]);
                }
            }(thread, 1, firstSource, 'app.js', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 10 }, 1, true);
            const scope = new class extends debugModel_1.Scope {
                getChildren() {
                    return Promise.resolve([variableA]);
                }
            }(stackFrame, 1, 'local', 1, false, 10, 10);
            const variableA = new class extends debugModel_1.Variable {
                getChildren() {
                    return Promise.resolve([variableB]);
                }
            }(session, 1, scope, 2, 'A', 'A', undefined, 0, 0, undefined, {}, 'string');
            const variableB = new debugModel_1.Variable(session, 1, scope, 2, 'B', 'A.B', undefined, 0, 0, undefined, {}, 'string');
            assert.strictEqual(await (0, debugHover_1.findExpressionInStackFrame)(stackFrame, []), undefined);
            assert.strictEqual(await (0, debugHover_1.findExpressionInStackFrame)(stackFrame, ['A']), variableA);
            assert.strictEqual(await (0, debugHover_1.findExpressionInStackFrame)(stackFrame, ['doesNotExist', 'no']), undefined);
            assert.strictEqual(await (0, debugHover_1.findExpressionInStackFrame)(stackFrame, ['a']), undefined);
            assert.strictEqual(await (0, debugHover_1.findExpressionInStackFrame)(stackFrame, ['B']), undefined);
            assert.strictEqual(await (0, debugHover_1.findExpressionInStackFrame)(stackFrame, ['A', 'B']), variableB);
            assert.strictEqual(await (0, debugHover_1.findExpressionInStackFrame)(stackFrame, ['A', 'C']), undefined);
            // We do not search in expensive scopes
            scope.expensive = true;
            assert.strictEqual(await (0, debugHover_1.findExpressionInStackFrame)(stackFrame, ['A']), undefined);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdIb3Zlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9icm93c2VyL2RlYnVnSG92ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUMzQixNQUFNLFdBQVcsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFOUQsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2pELE1BQU0sS0FBSyxHQUFHLElBQUEscUNBQW9CLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEQsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGtDQUFpQixFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFMUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxLQUFNLFNBQVEsbUJBQU07Z0JBQ3RCLFlBQVk7b0JBQzNCLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDckIsQ0FBQzthQUNELENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1QixNQUFNLFdBQVcsR0FBRyxJQUFJLG9CQUFNLENBQUM7Z0JBQzlCLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLElBQUksRUFBRSwyQkFBMkI7Z0JBQ2pDLGVBQWUsRUFBRSxFQUFFO2FBQ25CLEVBQUUsaUJBQWlCLEVBQUUsdUNBQXNCLEVBQUUsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQztZQUVwRSxNQUFNLFVBQVUsR0FBRyxJQUFJLEtBQU0sU0FBUSx1QkFBVTtnQkFDckMsU0FBUztvQkFDakIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMs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