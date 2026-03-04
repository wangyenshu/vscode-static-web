/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, files_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpdLogLogger = void 0;
    var SpdLogLevel;
    (function (SpdLogLevel) {
        SpdLogLevel[SpdLogLevel["Trace"] = 0] = "Trace";
        SpdLogLevel[SpdLogLevel["Debug"] = 1] = "Debug";
        SpdLogLevel[SpdLogLevel["Info"] = 2] = "Info";
        SpdLogLevel[SpdLogLevel["Warning"] = 3] = "Warning";
        SpdLogLevel[SpdLogLevel["Error"] = 4] = "Error";
        SpdLogLevel[SpdLogLevel["Critical"] = 5] = "Critical";
        SpdLogLevel[SpdLogLevel["Off"] = 6] = "Off";
    })(SpdLogLevel || (SpdLogLevel = {}));
    async function createSpdLogLogger(name, logfilePath, filesize, filecount, donotUseFormatters) {
        // Do not crash if spdlog cannot be loaded
        try {
            const _spdlog = await new Promise((resolve_1, reject_1) => { require(['@vscode/spdlog'], resolve_1, reject_1); });
            _spdlog.setFlushOn(SpdLogLevel.Trace);
            const logger = await _spdlog.createAsyncRotatingLogger(name, logfilePath, filesize, filecount);
            if (donotUseFormatters) {
                logger.clearFormatters();
            }
            else {
                logger.setPattern('%Y-%m-%d %H:%M:%S.%e [%l] %v');
            }
            return logger;
        }
        catch (e) {
            console.error(e);
        }
        return null;
    }
    function log(logger, level, message) {
        switch (level) {
            case log_1.LogLevel.Trace:
                logger.trace(message);
                break;
            case log_1.LogLevel.Debug:
                logger.debug(message);
                break;
            case log_1.LogLevel.Info:
                logger.info(message);
                break;
            case log_1.LogLevel.Warning:
                logger.warn(message);
                break;
            case log_1.LogLevel.Error:
                logger.error(message);
                break;
            case log_1.LogLevel.Off: /* do nothing */ break;
            default: throw new Error(`Invalid log level ${level}`);
        }
    }
    function setLogLevel(logger, level) {
        switch (level) {
            case log_1.LogLevel.Trace:
                logger.setLevel(SpdLogLevel.Trace);
                break;
            case log_1.LogLevel.Debug:
                logger.setLevel(SpdLogLevel.Debug);
                break;
            case log_1.LogLevel.Info:
                logger.setLevel(SpdLogLevel.Info);
                break;
            case log_1.LogLevel.Warning:
                logger.setLevel(SpdLogLevel.Warning);
                break;
            case log_1.LogLevel.Error:
                logger.setLevel(SpdLogLevel.Error);
                break;
            case log_1.LogLevel.Off:
                logger.setLevel(SpdLogLevel.Off);
                break;
            default: throw new Error(`Invalid log level ${level}`);
        }
    }
    class SpdLogLogger extends log_1.AbstractMessageLogger {
        constructor(name, filepath, rotating, donotUseFormatters, level) {
            super();
            this.buffer = [];
            this.setLevel(level);
            this._loggerCreationPromise = this._createSpdLogLogger(name, filepath, rotating, donotUseFormatters);
            this._register(this.onDidChangeLogLevel(level => {
                if (this._logger) {
                    setLogLevel(this._logger, level);
                }
            }));
        }
        async _createSpdLogLogger(name, filepath, rotating, donotUseFormatters) {
            const filecount = rotating ? 6 : 1;
            const filesize = (30 / filecount) * files_1.ByteSize.MB;
            const logger = await createSpdLogLogger(name, filepath, filesize, filecount, donotUseFormatters);
            if (logger) {
                this._logger = logger;
                setLogLevel(this._logger, this.getLevel());
                for (const { level, message } of this.buffer) {
                    log(this._logger, level, message);
                }
                this.buffer = [];
            }
        }
        log(level, message) {
            if (this._logger) {
                log(this._logger, level, message);
            }
            else if (this.getLevel() <= level) {
                this.buffer.push({ level, message });
            }
        }
        flush() {
            if (this._logger) {
                this._logger.flush();
            }
            else {
                this._loggerCreationPromise.then(() => this.flush());
            }
        }
        dispose() {
            if (this._logger) {
                this.disposeLogger();
            }
            else {
                this._loggerCreationPromise.then(() => this.disposeLogger());
            }
            super.dispose();
        }
        disposeLogger() {
            if (this._logger) {
                this._logger.drop();
                this._logger = undefined;
            }
        }
    }
    exports.SpdLogLogger = SpdLogLogger;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BkbG9nTG9nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbG9nL25vZGUvc3BkbG9nTG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxJQUFLLFdBUUo7SUFSRCxXQUFLLFdBQVc7UUFDZiwrQ0FBSyxDQUFBO1FBQ0wsK0NBQUssQ0FBQTtRQUNMLDZDQUFJLENBQUE7UUFDSixtREFBTyxDQUFBO1FBQ1AsK0NBQUssQ0FBQTtRQUNMLHFEQUFRLENBQUE7UUFDUiwyQ0FBRyxDQUFBO0lBQ0osQ0FBQyxFQVJJLFdBQVcsS0FBWCxXQUFXLFFBUWY7SUFFRCxLQUFLLFVBQVUsa0JBQWtCLENBQUMsSUFBWSxFQUFFLFdBQW1CLEVBQUUsUUFBZ0IsRUFBRSxTQUFpQixFQUFFLGtCQUEyQjtRQUNwSSwwQ0FBMEM7UUFDMUMsSUFBSSxDQUFDO1lBQ0osTUFBTSxPQUFPLEdBQUcsc0RBQWEsZ0JBQWdCLDJCQUFDLENBQUM7WUFDL0MsT0FBTyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMseUJBQXlCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDL0YsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QixNQUFNLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDMUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxVQUFVLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENB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