define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/platform/environment/common/environment", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetryLogAppender"], function (require, exports, assert, event_1, utils_1, environment_1, instantiationServiceMock_1, log_1, productService_1, telemetryLogAppender_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestTelemetryLoggerService = void 0;
    class TestTelemetryLogger extends log_1.AbstractLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super();
            this.logs = [];
            this.setLevel(logLevel);
        }
        trace(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Trace)) {
                this.logs.push(message + JSON.stringify(args));
            }
        }
        debug(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Debug)) {
                this.logs.push(message);
            }
        }
        info(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Info)) {
                this.logs.push(message);
            }
        }
        warn(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Warning)) {
                this.logs.push(message.toString());
            }
        }
        error(message, ...args) {
            if (this.checkLogLevel(log_1.LogLevel.Error)) {
                this.logs.push(message);
            }
        }
        flush() { }
    }
    class TestTelemetryLoggerService {
        constructor(logLevel) {
            this.logLevel = logLevel;
            this.onDidChangeVisibility = event_1.Event.None;
            this.onDidChangeLogLevel = event_1.Event.None;
            this.onDidChangeLoggers = event_1.Event.None;
        }
        getLogger() {
            return this.logger;
        }
        createLogger() {
            if (!this.logger) {
                this.logger = new TestTelemetryLogger(this.logLevel);
            }
            return this.logger;
        }
        setLogLevel() { }
        getLogLevel() { return log_1.LogLevel.Info; }
        setVisibility() { }
        getDefaultLogLevel() { return this.logLevel; }
        registerLogger() { }
        deregisterLogger() { }
        getRegisteredLoggers() { return []; }
        getRegisteredLogger() { return undefined; }
    }
    exports.TestTelemetryLoggerService = TestTelemetryLoggerService;
    suite('TelemetryLogAdapter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Do not Log Telemetry if log level is not trace', async () => {
            const testLoggerService = new TestTelemetryLoggerService(log_1.DEFAULT_LOG_LEVEL);
            const testInstantiationService = new instantiationServiceMock_1.TestInstantiationService();
            const testObject = new telemetryLogAppender_1.TelemetryLogAppender(new log_1.NullLogService(), testLoggerService, testInstantiationService.stub(environment_1.IEnvironmentService, {}), testInstantiationService.stub(productService_1.IProductService, {}));
            testObject.log('testEvent', { hello: 'world', isTrue: true, numberBetween1And3: 2 });
            assert.strictEqual(testLoggerService.createLogger().logs.length, 2);
            testObject.dispose();
            testInstantiationService.dispose();
        });
        test('Log Telemetry if log level is trace', async () => {
            const testLoggerService = new TestTelemetryLoggerService(log_1.LogLevel.Trace);
            const testInstantiationService = new instantiationServiceMock_1.TestInstantiationService();
            const testObject = new telemetryLogAppender_1.TelemetryLogAppender(new log_1.NullLogService(), testLoggerService, testInstantiationService.stub(environment_1.IEnvironmentService, {}), testInstantiationService.stub(productService_1.IProductService, {}));
            testObject.log('testEvent', { hello: 'world', isTrue: true, numberBetween1And3: 2 });
            assert.strictEqual(testLoggerService.createLogger().logs[2], 'telemetry/testEvent' + JSON.stringify([{
                    properties: {
                        hello: 'world',
                    },
                    measurements: {
                        isTrue: 1, numberBetween1And3: 2
                    }
                }]));
            testObject.dispose();
            testInstantiationService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5TG9nQXBwZW5kZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS90ZXN0L2NvbW1vbi90ZWxlbWV0cnlMb2dBcHBlbmRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFhQSxNQUFNLG1CQUFvQixTQUFRLG9CQUFjO1FBSS9DLFlBQVksV0FBcUIsdUJBQWlCO1lBQ2pELEtBQUssRUFBRSxDQUFDO1lBSEYsU0FBSSxHQUFhLEVBQUUsQ0FBQztZQUkxQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztZQUNwQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztZQUNwQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pCLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQWUsRUFBRSxHQUFHLElBQVc7WUFDbkMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FB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