/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/platform/log/common/log", "vs/base/common/lifecycle"], function (require, exports, uri_1, event_1, log_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteLoggerChannelClient = exports.LoggerChannel = exports.LoggerChannelClient = void 0;
    class LoggerChannelClient extends log_1.AbstractLoggerService {
        constructor(windowId, logLevel, logsHome, loggers, channel) {
            super(logLevel, logsHome, loggers);
            this.windowId = windowId;
            this.channel = channel;
            this._register(channel.listen('onDidChangeLogLevel', windowId)(arg => {
                if ((0, log_1.isLogLevel)(arg)) {
                    super.setLogLevel(arg);
                }
                else {
                    super.setLogLevel(uri_1.URI.revive(arg[0]), arg[1]);
                }
            }));
            this._register(channel.listen('onDidChangeVisibility', windowId)(([resource, visibility]) => super.setVisibility(uri_1.URI.revive(resource), visibility)));
            this._register(channel.listen('onDidChangeLoggers', windowId)(({ added, removed }) => {
                for (const loggerResource of added) {
                    super.registerLogger({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) });
                }
                for (const loggerResource of removed) {
                    super.deregisterLogger(loggerResource.resource);
                }
            }));
        }
        createConsoleMainLogger() {
            return new log_1.AdapterLogger({
                log: (level, args) => {
                    this.channel.call('consoleLog', [level, args]);
                }
            });
        }
        registerLogger(logger) {
            super.registerLogger(logger);
            this.channel.call('registerLogger', [logger, this.windowId]);
        }
        deregisterLogger(resource) {
            super.deregisterLogger(resource);
            this.channel.call('deregisterLogger', [resource, this.windowId]);
        }
        setLogLevel(arg1, arg2) {
            super.setLogLevel(arg1, arg2);
            this.channel.call('setLogLevel', [arg1, arg2]);
        }
        setVisibility(resourceOrId, visibility) {
            super.setVisibility(resourceOrId, visibility);
            this.channel.call('setVisibility', [this.toResource(resourceOrId), visibility]);
        }
        doCreateLogger(file, logLevel, options) {
            return new Logger(this.channel, file, logLevel, options, this.windowId);
        }
        static setLogLevel(channel, arg1, arg2) {
            return channel.call('setLogLevel', [arg1, arg2]);
        }
    }
    exports.LoggerChannelClient = LoggerChannelClient;
    class Logger extends log_1.AbstractMessageLogger {
        constructor(channel, file, logLevel, loggerOptions, windowId) {
            super(loggerOptions?.logLevel === 'always');
            this.channel = channel;
            this.file = file;
            this.isLoggerCreated = false;
            this.buffer = [];
            this.setLevel(logLevel);
            this.channel.call('createLogger', [file, loggerOptions, windowId])
                .then(() => {
                this.doLog(this.buffer);
                this.isLoggerCreated = true;
            });
        }
        log(level, message) {
            const messages = [[level, message]];
            if (this.isLoggerCreated) {
                this.doLog(messages);
            }
            else {
                this.buffer.push(...messages);
            }
        }
        doLog(messages) {
            this.channel.call('log', [this.file, messages]);
        }
    }
    class LoggerChannel {
        constructor(loggerService, getUriTransformer) {
            this.loggerService = loggerService;
            this.getUriTransformer = getUriTransformer;
        }
        listen(context, event) {
            const uriTransformer = this.getUriTransformer(context);
            switch (event) {
                case 'onDidChangeLoggers': return event_1.Event.map(this.loggerService.onDidChangeLoggers, (e) => ({
                    added: [...e.added].map(logger => this.transformLogger(logger, uriTransformer)),
                    removed: [...e.removed].map(logger => this.transformLogger(logger, uriTransformer)),
                }));
                case 'onDidChangeVisibility': return event_1.Event.map(this.loggerService.onDidChangeVisibility, e => [uriTransformer.transformOutgoingURI(e[0]), e[1]]);
                case 'onDidChangeLogLevel': return event_1.Event.map(this.loggerService.onDidChangeLogLevel, e => (0, log_1.isLogLevel)(e) ? e : [uriTransformer.transformOutgoingURI(e[0]), e[1]]);
            }
            throw new Error(`Event not found: ${event}`);
        }
        async call(context, command, arg) {
            const uriTransformer = this.getUriTransformer(context);
            switch (command) {
                case 'setLogLevel': return (0, log_1.isLogLevel)(arg[0]) ? this.loggerService.setLogLevel(arg[0]) : this.loggerService.setLogLevel(uri_1.URI.revive(uriTransformer.transformIncoming(arg[0][0])), arg[0][1]);
                case 'getRegisteredLoggers': return Promise.resolve([...this.loggerService.getRegisteredLoggers()].map(logger => this.transformLogger(logger, uriTransformer)));
            }
            throw new Error(`Call not found: ${command}`);
        }
        transformLogger(logger, transformer) {
            return {
                ...logger,
                resource: transformer.transformOutgoingURI(logger.resource)
            };
        }
    }
    exports.LoggerChannel = LoggerChannel;
    class RemoteLoggerChannelClient extends lifecycle_1.Disposable {
        constructor(loggerService, channel) {
            super();
            channel.call('setLogLevel', [loggerService.getLogLevel()]);
            this._register(loggerService.onDidChangeLogLevel(arg => channel.call('setLogLevel', [arg])));
            channel.call('getRegisteredLoggers').then(loggers => {
                for (const loggerResource of loggers) {
                    loggerService.registerLogger({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) });
                }
            });
            this._register(channel.listen('onDidChangeVisibility')(([resource, visibility]) => loggerService.setVisibility(uri_1.URI.revive(resource), visibility)));
            this._register(channel.listen('onDidChangeLoggers')(({ added, removed }) => {
                for (const loggerResource of added) {
                    loggerService.registerLogger({ ...loggerResource, resource: uri_1.URI.revive(loggerResource.resource) });
                }
                for (const loggerResource of removed) {
                    loggerService.deregisterLogger(loggerResource.resource);
                }
            }));
        }
    }
    exports.RemoteLoggerChannelClient = RemoteLoggerChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbG9nL2NvbW1vbi9sb2dJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsbUJBQW9CLFNBQVEsMkJBQXFCO1FBRTdELFlBQTZCLFFBQTRCLEVBQUUsUUFBa0IsRUFBRSxRQUFhLEVBQUUsT0FBMEIsRUFBbUIsT0FBaUI7WUFDM0osS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFEUCxhQUFRLEdBQVIsUUFBUSxDQUFvQjtZQUFrRixZQUFPLEdBQVAsT0FBTyxDQUFVO1lBRTNKLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBNkIscUJBQXFCLEVBQUUsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2hHLElBQUksSUFBQSxnQkFBVSxFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3JCLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9DLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFpQix1QkFBdUIsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxD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