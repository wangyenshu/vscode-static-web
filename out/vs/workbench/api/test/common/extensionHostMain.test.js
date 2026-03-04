/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/ternarySearchTree", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTelemetry", "vs/workbench/api/common/extensionHostMain", "vs/workbench/services/extensions/common/extensions"], function (require, exports, assert, errors_1, platform_1, ternarySearchTree_1, mock_1, utils_1, instantiationService_1, serviceCollection_1, log_1, extHostExtensionService_1, extHostRpcService_1, extHostTelemetry_1, extensionHostMain_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionHostMain#ErrorHandler - Wrapping prepareStackTrace can cause slowdown and eventual stack overflow #184926 ', function () {
        if (platform_1.isFirefox || platform_1.isSafari) {
            return;
        }
        const extensionsIndex = ternarySearchTree_1.TernarySearchTree.forUris();
        const mainThreadExtensionsService = new class extends (0, mock_1.mock)() {
            $onExtensionRuntimeError(extensionId, data) {
            }
        };
        const collection = new serviceCollection_1.ServiceCollection([log_1.ILogService, new log_1.NullLogService()], [extHostTelemetry_1.IExtHostTelemetry, new class extends (0, mock_1.mock)() {
                onExtensionError(extension, error) {
                    return true;
                }
            }], [extHostExtensionService_1.IExtHostExtensionService, new class extends (0, mock_1.mock)() {
                getExtensionPathIndex() {
                    return new class extends extHostExtensionService_1.ExtensionPaths {
                        findSubstr(key) {
                            findSubstrCount++;
                            return extensions_1.nullExtensionDescription;
                        }
                    }(extensionsIndex);
                }
            }], [extHostRpcService_1.IExtHostRpcService, new class extends (0, mock_1.mock)() {
                getProxy(identifier) {
                    return mainThreadExtensionsService;
                }
            }]);
        const originalPrepareStackTrace = Error.prepareStackTrace;
        const insta = new instantiationService_1.InstantiationService(collection, false);
        let existingErrorHandler;
        let findSubstrCount = 0;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(async function () {
            existingErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            await insta.invokeFunction(extensionHostMain_1.ErrorHandler.installFullHandler);
        });
        suiteTeardown(function () {
            errors_1.errorHandler.setUnexpectedErrorHandler(existingErrorHandler);
        });
        setup(async function () {
            findSubstrCount = 0;
        });
        teardown(() => {
            Error.prepareStackTrace = originalPrepareStackTrace;
        });
        test('basics', function () {
            const err = new Error('test1');
            (0, errors_1.onUnexpectedError)(err);
            assert.strictEqual(findSubstrCount, 1);
        });
        test('set/reset prepareStackTrace-callback', function () {
            const original = Error.prepareStackTrace;
            Error.prepareStackTrace = (_error, _stack) => 'stack';
            const probeErr = new Error();
            const stack = probeErr.stack;
            assert.ok(stack);
            Error.prepareStackTrace = original;
            assert.strictEqual(findSubstrCount, 1);
            // already checked
            (0, errors_1.onUnexpectedError)(probeErr);
            assert.strictEqual(findSubstrCount, 1);
            // one more error
            const err = new Error('test2');
            (0, errors_1.onUnexpectedError)(err);
            assert.strictEqual(findSubstrCount, 2);
        });
        test('wrap prepareStackTrace-callback', function () {
            function do_something_else(params) {
                return params;
            }
            const original = Error.prepareStackTrace;
            Error.prepareStackTrace = (...args) => {
                return do_something_else(original?.(...args));
            };
            const probeErr = new Error();
            const stack = probeErr.stack;
            assert.ok(stack);
            (0, errors_1.onUnexpectedError)(probeErr);
            assert.strictEqual(findSubstrCount, 1);
        });
        test('prevent rewrapping', function () {
            let do_something_count = 0;
            function do_something(params) {
                do_something_count++;
            }
            Error.prepareStackTrace = (result, stack) => {
                do_something(stack);
                return 'fakestack';
            };
            for (let i = 0; i < 2_500; ++i) {
                Error.prepareStackTrace = Error.prepareStackTrace;
            }
            const probeErr = new Error();
            const stack = probeErr.stack;
            assert.strictEqual(stack, 'fakestack');
            (0, errors_1.onUnexpectedError)(probeErr);
            assert.strictEqual(findSubstrCount, 1);
            const probeErr2 = new Error();
            (0, errors_1.onUnexpectedError)(probeErr2);
            assert.strictEqual(findSubstrCount, 2);
            assert.strictEqual(do_something_count, 2);
        });
        suite('https://gist.github.com/thecrypticace/f0f2e182082072efdaf0f8e1537d2cce', function () {
            test("Restored, separate operations", () => {
                // Actual Test
                let original;
                // Operation 1
                original = Error.prepareStackTrace;
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                const err1 = new Error();
                assert.ok(err1.stack);
                assert.strictEqual(findSubstrCount, 1);
                Error.prepareStackTrace = original;
                // Operation 2
                original = Error.prepareStackTrace;
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                assert.strictEqual(findSubstrCount, 2);
                Error.prepareStackTrace = original;
                // Operation 3
                original = Error.prepareStackTrace;
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                assert.strictEqual(findSubstrCount, 3);
                Error.prepareStackTrace = original;
                // Operation 4
                original = Error.prepareStackTrace;
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                assert.strictEqual(findSubstrCount, 4);
                Error.prepareStackTrace = original;
                // Back to Operation 1
                assert.ok(err1.stack);
                assert.strictEqual(findSubstrCount, 4);
            });
            test("Never restored, separate operations", () => {
                // Operation 1
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                // Operation 2
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                // Operation 3
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                // Operation 4
                for (let i = 0; i < 12_500; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
            });
            test("Restored, too many uses before restoration", async () => {
                const original = Error.prepareStackTrace;
                Error.prepareStackTrace = (_, stack) => stack;
                // Operation 1 — more uses of `prepareStackTrace`
                for (let i = 0; i < 10_000; ++i) {
                    Error.prepareStackTrace = Error.prepareStackTrace;
                }
                assert.ok(new Error().stack);
                Error.prepareStackTrace = original;
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdE1haW4udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9jb21tb24vZXh0ZW5zaW9uSG9zdE1haW4udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsS0FBSyxDQUFDLHFIQUFxSCxFQUFFO1FBRTVILElBQUksb0JBQVMsSUFBSSxtQkFBUSxFQUFFLENBQUM7WUFDM0IsT0FBTztRQUNSLENBQUM7UUFFRCxNQUFNLGVBQWUsR0FBRyxxQ0FBaUIsQ0FBQyxPQUFPLEVBQXlCLENBQUM7UUFDM0UsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBbUM7WUFDbkYsd0JBQXdCLENBQUMsV0FBZ0MsRUFBRSxJQUFxQjtZQUV6RixDQUFDO1NBQ0QsQ0FBQztRQUVGLE1BQU0sVUFBVSxHQUFHLElBQUkscUNBQWlCLENBQ3ZDLENBQUMsaUJBQVcsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxFQUNuQyxDQUFDLG9DQUFpQixFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFxQjtnQkFFckQsZ0JBQWdCLENBQUMsU0FBOEIsRUFBRSxLQUFZO29CQUNyRSxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2FBQ0QsQ0FBQyxFQUNGLENBQUMsa0RBQXdCLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQWtDO2dCQUVsRixxQkFBcUI7b0JBQ3BCLE9BQU8sSUFBSSxLQUFNLFNBQVEsd0NBQWM7d0JBQzdCLFVBQVUsQ0FBQyxHQUFROzRCQUMzQixlQUFlLEVBQUUsQ0FBQzs0QkFDbEIsT0FBTyxxQ0FBd0IsQ0FBQzt3QkFDakMsQ0FBQztxQkFFRCxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNwQixD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