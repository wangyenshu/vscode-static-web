/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/platform/telemetry/test/common/telemetryLogAppender.test", "vs/workbench/api/common/extHostTelemetry", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, uri_1, utils_1, extensions_1, log_1, telemetryLogAppender_test_1, extHostTelemetry_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostTelemetry', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const mockEnvironment = {
            isExtensionDevelopmentDebug: false,
            extensionDevelopmentLocationURI: undefined,
            extensionTestsLocationURI: undefined,
            appRoot: undefined,
            appName: 'test',
            extensionTelemetryLogResource: uri_1.URI.parse('fake'),
            isExtensionTelemetryLoggingOnly: false,
            appHost: 'test',
            appLanguage: 'en',
            globalStorageHome: uri_1.URI.parse('fake'),
            workspaceStorageHome: uri_1.URI.parse('fake'),
            appUriScheme: 'test',
        };
        const mockTelemetryInfo = {
            firstSessionDate: '2020-01-01T00:00:00.000Z',
            sessionId: 'test',
            machineId: 'test',
            sqmId: 'test'
        };
        const mockRemote = {
            authority: 'test',
            isRemote: false,
            connectionData: null
        };
        const mockExtensionIdentifier = {
            identifier: new extensions_1.ExtensionIdentifier('test-extension'),
            targetPlatform: "universal" /* TargetPlatform.UNIVERSAL */,
            isBuiltin: true,
            isUserBuiltin: true,
            isUnderDevelopment: true,
            name: 'test-extension',
            publisher: 'vscode',
            version: '1.0.0',
            engines: { vscode: '*' },
            extensionLocation: uri_1.URI.parse('fake')
        };
        const createExtHostTelemetry = () => {
            const extensionTelemetry = new extHostTelemetry_1.ExtHostTelemetry(new class extends (0, workbenchTestServices_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.environment = mockEnvironment;
                    this.telemetryInfo = mockTelemetryInfo;
                    this.remote = mockRemote;
                }
            }, new telemetryLogAppender_test_1.TestTelemetryLoggerService(log_1.DEFAULT_LOG_LEVEL));
            store.add(extensionTelemetry);
            extensionTelemetry.$initializeTelemetryLevel(3 /* TelemetryLevel.USAGE */, true, { usage: true, error: true });
            return extensionTelemetry;
        };
        const createLogger = (functionSpy, extHostTelemetry, options) => {
            const extensionTelemetry = extHostTelemetry ?? createExtHostTelemetry();
            // This is the appender which the extension would contribute
            const appender = {
                sendEventData: (eventName, data) => {
                    functionSpy.dataArr.push({ eventName, data });
                },
                sendErrorData: (exception, data) => {
                    functionSpy.exceptionArr.push({ exception, data });
                },
                flush: () => {
                    functionSpy.flushCalled = true;
                }
            };
            if (extHostTelemetry) {
                store.add(extHostTelemetry);
            }
            const logger = extensionTelemetry.instantiateLogger(mockExtensionIdentifier, appender, options);
            store.add(logger);
            return logger;
        };
        test('Validate sender instances', function () {
            assert.throws(() => extHostTelemetry_1.ExtHostTelemetryLogger.validateSender(null));
            assert.throws(() => extHostTelemetry_1.ExtHostTelemetryLogger.validateSender(1));
            assert.throws(() => extHostTelemetry_1.ExtHostTelemetryLogger.validateSender({}));
            assert.throws(() => {
                extHostTelemetry_1.ExtHostTelemetryLogger.validateSender({
                    sendErrorData: () => { },
                    sendEventData: true
                });
            });
            assert.throws(() => {
                extHostTelemetry_1.ExtHostTelemetryLogger.validateSender({
                    sendErrorData: 123,
                    sendEventData: () => { },
                });
            });
            assert.throws(() => {
                extHostTelemetry_1.ExtHostTelemetryLogger.validateSender({
                    sendErrorData: () => { },
                    sendEventData: () => { },
                    flush: true
                });
            });
        });
        test('Ensure logger gets proper telemetry level during initialization', function () {
            const extensionTelemetry = createExtHostTelemetry();
            let config = extensionTelemetry.getTelemetryDetails();
            assert.strictEqual(config.isCrashEnabled, true);
            assert.strictEqual(config.isUsageEnabled, true);
            assert.strictEqual(config.isErrorsEnabled, true);
            // Initialize would never be called twice, but this is just for testing
            extensionTelemetry.$initializeTelemetryLevel(2 /* TelemetryLevel.ERROR */, true, { usage: true, error: true });
            config = extensionTelemetry.getTelemetryDetails();
            assert.strictEqual(config.isCrashEnabled, true);
            assert.strictEqual(config.isUsageEnabled, false);
            assert.strictEqual(config.isErrorsEnabled, true);
            extensionTelemetry.$initializeTelemetryLevel(1 /* TelemetryLevel.CRASH */, true, { usage: true, error: true });
            config = extensionTelemetry.getTelemetryDetails();
            assert.strictEqual(config.isCrashEnabled, true);
            assert.strictEqual(config.isUsageEnabled, false);
            assert.strictEqual(config.isErrorsEnabled, false);
            extensionTelemetry.$initializeTelemetryLevel(3 /* TelemetryLevel.USAGE */, true, { usage: false, error: true });
            config = extensionTelemetry.getTelemetryDetails();
            assert.strictEqual(config.isCrashEnabled, true);
            assert.strictEqual(config.isUsageEnabled, false);
            assert.strictEqual(config.isErrorsEnabled, true);
            extensionTelemetry.dispose();
        });
        test('Simple log event to TelemetryLogger', function () {
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy);
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 1);
            assert.strictEqual(functionSpy.dataArr[0].eventName, `${mockExtensionIdentifier.name}/test-event`);
            assert.strictEqual(functionSpy.dataArr[0].data['test-data'], 'test-data');
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 2);
            logger.logError('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            logger.logError(new Error('test-error'), { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            assert.strictEqual(functionSpy.exceptionArr.length, 1);
            // Assert not flushed
            assert.strictEqual(functionSpy.flushCalled, false);
            // Call flush and assert that flush occurs
            logger.dispose();
            assert.strictEqual(functionSpy.flushCalled, true);
        });
        test('Simple log event to TelemetryLogger with options', function () {
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy, undefined, { additionalCommonProperties: { 'common.foo': 'bar' } });
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 1);
            assert.strictEqual(functionSpy.dataArr[0].eventName, `${mockExtensionIdentifier.name}/test-event`);
            assert.strictEqual(functionSpy.dataArr[0].data['test-data'], 'test-data');
            assert.strictEqual(functionSpy.dataArr[0].data['common.foo'], 'bar');
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 2);
            logger.logError('test-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            logger.logError(new Error('test-error'), { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            assert.strictEqual(functionSpy.exceptionArr.length, 1);
            // Assert not flushed
            assert.strictEqual(functionSpy.flushCalled, false);
            // Call flush and assert that flush occurs
            logger.dispose();
            assert.strictEqual(functionSpy.flushCalled, true);
        });
        test('Log error should get common properties #193205', function () {
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy, undefined, { additionalCommonProperties: { 'common.foo': 'bar' } });
            logger.logError(new Error('Test error'));
            assert.strictEqual(functionSpy.exceptionArr.length, 1);
            assert.strictEqual(functionSpy.exceptionArr[0].data['common.foo'], 'bar');
            assert.strictEqual(functionSpy.exceptionArr[0].data['common.product'], 'test');
            logger.logError('test-error-event');
            assert.strictEqual(functionSpy.dataArr.length, 1);
            assert.strictEqual(functionSpy.dataArr[0].data['common.foo'], 'bar');
            assert.strictEqual(functionSpy.dataArr[0].data['common.product'], 'test');
            logger.logError('test-error-event', { 'test-data': 'test-data' });
            assert.strictEqual(functionSpy.dataArr.length, 2);
            assert.strictEqual(functionSpy.dataArr[1].data['common.foo'], 'bar');
            assert.strictEqual(functionSpy.dataArr[1].data['common.product'], 'test');
            logger.logError('test-error-event', { properties: { 'test-data': 'test-data' } });
            assert.strictEqual(functionSpy.dataArr.length, 3);
            assert.strictEqual(functionSpy.dataArr[2].data.properties['common.foo'], 'bar');
            assert.strictEqual(functionSpy.dataArr[2].data.properties['common.product'], 'test');
            logger.dispose();
            assert.strictEqual(functionSpy.flushCalled, true);
        });
        test('Ensure logger properly cleans PII', function () {
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy);
            // Log an event with a bunch of PII, this should all get cleaned out
            logger.logUsage('test-event', {
                'fake-password': 'pwd=123',
                'fake-email': 'no-reply@example.com',
                'fake-token': 'token=123',
                'fake-slack-token': 'xoxp-123',
                'fake-path': '/Users/username/.vscode/extensions',
            });
            assert.strictEqual(functionSpy.dataArr.length, 1);
            assert.strictEqual(functionSpy.dataArr[0].eventName, `${mockExtensionIdentifier.name}/test-event`);
            assert.strictEqual(functionSpy.dataArr[0].data['fake-password'], '<REDACTED: Generic Secret>');
            assert.strictEqual(functionSpy.dataArr[0].data['fake-email'], '<REDACTED: Email>');
            assert.strictEqual(functionSpy.dataArr[0].data['fake-token'], '<REDACTED: Generic Secret>');
            assert.strictEqual(functionSpy.dataArr[0].data['fake-slack-token'], '<REDACTED: Slack Token>');
            assert.strictEqual(functionSpy.dataArr[0].data['fake-path'], '<REDACTED: user-file-path>');
        });
        test('Ensure output channel is logged to', function () {
            // Have to re-duplicate code here because I the logger service isn't exposed in the simple setup functions
            const loggerService = new telemetryLogAppender_test_1.TestTelemetryLoggerService(log_1.LogLevel.Trace);
            const extensionTelemetry = new extHostTelemetry_1.ExtHostTelemetry(new class extends (0, workbenchTestServices_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.environment = mockEnvironment;
                    this.telemetryInfo = mockTelemetryInfo;
                    this.remote = mockRemote;
                }
            }, loggerService);
            extensionTelemetry.$initializeTelemetryLevel(3 /* TelemetryLevel.USAGE */, true, { usage: true, error: true });
            const functionSpy = { dataArr: [], exceptionArr: [], flushCalled: false };
            const logger = createLogger(functionSpy, extensionTelemetry);
            // Ensure headers are logged on instantiation
            assert.strictEqual(loggerService.createLogger().logs.length, 2);
            logger.logUsage('test-event', { 'test-data': 'test-data' });
            // Initial header is logged then the event
            assert.strictEqual(loggerService.createLogger().logs.length, 3);
            assert.ok(loggerService.createLogger().logs[2].startsWith('test-extension/test-event'));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlbGVtZXRyeS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvZXh0SG9zdFRlbGVtZXRyeS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBcUJoRyxLQUFLLENBQUMsa0JBQWtCLEVBQUU7UUFDekIsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELE1BQU0sZUFBZSxHQUFpQjtZQUNyQywyQkFBMkIsRUFBRSxLQUFLO1lBQ2xDLCtCQUErQixFQUFFLFNBQVM7WUFDMUMseUJBQXlCLEVBQUUsU0FBUztZQUNwQyxPQUFPLEVBQUUsU0FBUztZQUNsQixPQUFPLEVBQUUsTUFBTTtZQUNmLDZCQUE2QixFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ2hELCtCQUErQixFQUFFLEtBQUs7WUFDdEMsT0FBTyxFQUFFLE1BQU07WUFDZixXQUFXLEVBQUUsSUFBSTtZQUNqQixpQkFBaUIsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUNwQyxvQkFBb0IsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUN2QyxZQUFZLEVBQUUsTUFBTTtTQUNwQixDQUFDO1FBRUYsTUFBTSxpQkFBaUIsR0FBRztZQUN6QixnQkFBZ0IsRUFBRSwwQkFBMEI7WUFDNUMsU0FBUyxFQUFFLE1BQU07WUFDakIsU0FBUyxFQUFFLE1BQU07WUFDakIsS0FBSyxFQUFFLE1BQU07U0FDYixDQUFDO1FBRUYsTUFBTSxVQUFVLEdBQUc7WUFDbEIsU0FBUyxFQUFFLE1BQU07WUFDakIsUUFBUSxFQUFFLEtBQUs7WUFDZixjQUFjLEVBQUUsSUFBSTtTQUNwQixDQUFDO1FBRUYsTUFBTSx1QkFBdUIsR0FBMEI7WUFDdEQsVUFBVSxFQUFFLElBQUksZ0NBQW1CLENBQUMsZ0JBQWdCLENBQUM7WUFDckQsY0FBYyw0Q0FBMEI7WUFDeEMsU0FBUyxFQUFFLElBQUk7WUFDZixhQUFhLEVBQUUsSUFBSTtZQUNuQixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLE9BQU87WUFDaEIsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUN4QixpQkFBaUIsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztTQUNwQyxDQUFDO1FBRUYsTUFBTSxzQkFBc0IsR0FBRyxHQUFHLEVBQUU7WUFDbkMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLG1DQUFnQixDQUFDLElBQUksS0FBTSxTQUFRLElBQUEsNEJBQUksR0FBMkI7Z0JBQTdDOztvQkFDMUMsZ0JBQVcsR0FBaUIsZUFBZSxDQUFDO29CQUM1QyxrQkFBYSxHQUFHLGlCQUFpQixDQUFDO29CQUNsQyxXQUFNLEdBQUcsVUFBVSxDQUFDO2dCQUM5QixDQUFDO2FBQUEsRUFBRSxJQUFJLHNEQUEwQixDQUFDLHVCQUFpQixDQUFDLENBQUMsQ0FBQztZQUN0RCxLQUFLLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDOUIsa0JBQWtCLENBQUMseUJBQXlCLCtCQUF1QixJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZHLE9BQU8sa0JBQWtCLENBQUM7UUFDM0IsQ0FBQyxDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQUcsQ0FBQyxXQUErQixFQUFFLGdCQUFtQyxFQUFFLE9BQWdDLEVBQUUsRUFBRTtZQUMvSCxNQUFNLGtCQUFrQixHQUFHLGdCQUFnQixJQUFJLHNCQUFzQixFQUFFLENBQUM7WUFDeEUsNERBQTREO1lBQzVELE1BQU0sUUFBUSxHQUFvQjtnQkFDakMsYUFBYSxFQUFFLENBQUMsU0FBaUIsRUFBRSxJQUFJLEVBQUUsRUFBRTtvQkFDMUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztnQkFDRCxhQUFhLEVBQUUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUU7b0JBQ2xDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3BELENBQUM7Z0JBQ0QsS0FBSyxFQUFFLEdBQUcsRUFBRTtvQkFDWCxXQUFXLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztnQkFDaEMsQ0FBQzthQUNELENBQUM7WUFFRixJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLEtBQUssQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hHLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEIsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDLENBQUM7UUFFRixJQUFJLENBQUMsMkJBQTJCLEVBQUU7WUFDakMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyx5Q0FBc0IsQ0FBQyxjQUFjLENBQU0sSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLHlDQUFzQixDQUFDLGNBQWMsQ0FBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMseUNBQXNCLENBQUMsY0FBYyxDQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUU7Z0JBQ2xCLHlDQUFzQixDQUFDLGNBQWMsQ0FBTTtvQkFDMUMsYUFBYSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ3hCLGFBQWEsRUFBRSxJQUFJO2lCQUNuQixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO2dCQUNsQix5Q0FBc0IsQ0FBQyxjQUFjLENBQU07b0JBQzFDLGFBQWEsRUFBRSxHQUFHO29CQUNsQixhQUFhLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztpQkFDeEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtnQkFDbEIseUNBQXNCLENBQUMsY0FBYyxDQUFNO29CQUMxQyxhQUFhLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDeEIsYUFBYSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ3hCLEtBQUssRUFBRSxJQUFJO2lCQUNYLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUVBQWlFLEVBQUU7WUFDdkUsTUFBTSxrQkFBa0IsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBQ3BELElBQUksTUFBTSxHQUFHLGtCQUFrQixDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFakQsdUVBQXVFO1lBQ3ZFLGtCQUFrQixDQUFDLHlCQUF5QiwrQkFBdUIsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN2RyxNQUFNLEdBQUcsa0JBQWtCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVqRCxrQkFBa0IsQ0FBQyx5QkFBeUIsK0JBQXVCLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDdkcsTUFBTSxHQUFHLGtCQUFrQixDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEQsa0JBQWtCLENBQUMseUJBQXlCLCtCQUF1QixJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pELGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFDQUFxQyxFQUFFO1lBQzNDLE1BQU0sV0FBVyxHQUF1QixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFFOUYsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXpDLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLEdBQUcsdUJBQXVCLENBQUMsSUFBSSxhQUFhLENBQUMsQ0FBQztZQUNuRyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRTFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVsRCxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUd2RCxxQkFBcUI7WUFDckIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRW5ELDBDQUEwQztZQUMxQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRW5ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtEQUFrRCxFQUFFO1lBQ3hELE1BQU0sV0FBVyxHQUF1QixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFFOUYsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBRSwwQkFBMEIsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFN0csTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDO1lBQ25HLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVyRSxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUN2RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFHdkQscUJBQXFCO1lBQ3JCLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVuRCwwQ0FBMEM7WUFDMUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVuRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnREFBZ0QsRUFBRTtZQUN0RCxNQUFNLFdBQVcsR0FBdUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDO1lBRTlGLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRS9FLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRTFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRTFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVyRixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBR0gsSUFBSSxDQUFDLG1DQUFtQyxFQUFFO1lBQ3pDLE1BQU0sV0FBVyxHQUF1QixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFFOUYsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXpDLG9FQUFvRTtZQUNwRSxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRTtnQkFDN0IsZUFBZSxFQUFFLFNBQVM7Z0JBQzFCLFlBQVksRUFBRSxzQkFBc0I7Z0JBQ3BDLFlBQVksRUFBRSxXQUFXO2dCQUN6QixrQkFBa0IsRUFBRSxVQUFVO2dCQUM5QixXQUFXLEVBQUUsb0NBQW9DO2FBQ2pELENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxHQUFHLHVCQUF1QixDQUFDLElBQUksYUFBYSxDQUFDLENBQUM7WUFDbkcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLDRCQUE0QixDQUFDLENBQUM7WUFDNUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLHlCQUF5QixDQUFDLENBQUM7WUFDL0YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1FBQzVGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFO1lBRTFDLDBHQUEwRztZQUMxRyxNQUFNLGFBQWEsR0FBRyxJQUFJLHNEQUEwQixDQUFDLGNBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRSxNQUFNLGtCQUFrQixHQUFHLElBQUksbUNBQWdCLENBQUMsSUFBSSxLQUFNLFNBQVEsSUFBQSw0QkFBSSxHQUEyQjtnQkFBN0M7O29CQUMxQyxnQkFBVyxHQUFpQixlQUFlLENBQUM7b0JBQzVDLGtCQUFhLEdBQUcsaUJBQWlCLENBQUM7b0JBQ2xDLFdBQU0sR0FBRyxVQUFVLENBQUM7Z0JBQzlCLENBQUM7YUFBQSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ2xCLGtCQUFrQixDQUFDLHlCQUF5QiwrQkFBdUIsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUV2RyxNQUFNLFdBQVcsR0FBdUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDO1lBRTlGLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUU3RCw2Q0FBNkM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVoRSxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQzVELDBDQUEwQztZQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==