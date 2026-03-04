/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/uri", "vs/platform/log/common/log"], function (require, exports, map_1, uri_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggerChannel = void 0;
    class LoggerChannel {
        constructor(loggerService) {
            this.loggerService = loggerService;
            this.loggers = new map_1.ResourceMap();
        }
        listen(_, event, windowId) {
            switch (event) {
                case 'onDidChangeLoggers': return windowId ? this.loggerService.getOnDidChangeLoggersEvent(windowId) : this.loggerService.onDidChangeLoggers;
                case 'onDidChangeLogLevel': return windowId ? this.loggerService.getOnDidChangeLogLevelEvent(windowId) : this.loggerService.onDidChangeLogLevel;
                case 'onDidChangeVisibility': return windowId ? this.loggerService.getOnDidChangeVisibilityEvent(windowId) : this.loggerService.onDidChangeVisibility;
            }
            throw new Error(`Event not found: ${event}`);
        }
        async call(_, command, arg) {
            switch (command) {
                case 'createLogger':
                    this.createLogger(uri_1.URI.revive(arg[0]), arg[1], arg[2]);
                    return;
                case 'log': return this.log(uri_1.URI.revive(arg[0]), arg[1]);
                case 'consoleLog': return this.consoleLog(arg[0], arg[1]);
                case 'setLogLevel': return (0, log_1.isLogLevel)(arg[0]) ? this.loggerService.setLogLevel(arg[0]) : this.loggerService.setLogLevel(uri_1.URI.revive(arg[0]), arg[1]);
                case 'setVisibility': return this.loggerService.setVisibility(uri_1.URI.revive(arg[0]), arg[1]);
                case 'registerLogger': return this.loggerService.registerLogger({ ...arg[0], resource: uri_1.URI.revive(arg[0].resource) }, arg[1]);
                case 'deregisterLogger': return this.loggerService.deregisterLogger(uri_1.URI.revive(arg[0]));
            }
            throw new Error(`Call not found: ${command}`);
        }
        createLogger(file, options, windowId) {
            this.loggers.set(file, this.loggerService.createLogger(file, options, windowId));
        }
        consoleLog(level, args) {
            let consoleFn = console.log;
            switch (level) {
                case log_1.LogLevel.Error:
                    consoleFn = console.error;
                    break;
                case log_1.LogLevel.Warning:
                    consoleFn = console.warn;
                    break;
                case log_1.LogLevel.Info:
                    consoleFn = console.info;
                    break;
            }
            consoleFn.call(console, ...args);
        }
        log(file, messages) {
            const logger = this.loggers.get(file);
            if (!logger) {
                throw new Error('Create the logger before logging');
            }
            for (const [level, message] of messages) {
                (0, log_1.log)(logger, level, message);
            }
        }
    }
    exports.LoggerChannel = LoggerChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbG9nL2VsZWN0cm9uLW1haW4vbG9nSXBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLGFBQWE7UUFJekIsWUFBNkIsYUFBaUM7WUFBakMsa0JBQWEsR0FBYixhQUFhLENBQW9CO1lBRjdDLFlBQU8sR0FBRyxJQUFJLGlCQUFXLEVBQVcsQ0FBQztRQUVZLENBQUM7UUFFbkUsTUFBTSxDQUFDLENBQVUsRUFBRSxLQUFhLEVBQUUsUUFBaUI7WUFDbEQsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLG9CQUFvQixDQUFDLENBQUMsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsMEJBQTBCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUM7Z0JBQzdJLEtBQUsscUJBQXFCLENBQUMsQ0FBQyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQywyQkFBMkIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDaEosS0FBSyx1QkFBdUIsQ0FBQyxDQUFDLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLDZCQUE2QixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDO1lBQ3ZKLENBQUM7WUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxLQUFLLENBQUMsSUFB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