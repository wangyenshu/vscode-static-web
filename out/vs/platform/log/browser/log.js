/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/resources", "vs/platform/log/common/log"], function (require, exports, window_1, resources_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConsoleLogInAutomationLogger = void 0;
    exports.getLogs = getLogs;
    /**
     * Only used in browser contexts where the log files are not stored on disk
     * but in IndexedDB. A method to get all logs with their contents so that
     * CI automation can persist them.
     */
    async function getLogs(fileService, environmentService) {
        const result = [];
        await doGetLogs(fileService, result, environmentService.logsHome, environmentService.logsHome);
        return result;
    }
    async function doGetLogs(fileService, logs, curFolder, logsHome) {
        const stat = await fileService.resolve(curFolder);
        for (const { resource, isDirectory } of stat.children || []) {
            if (isDirectory) {
                await doGetLogs(fileService, logs, resource, logsHome);
            }
            else {
                const contents = (await fileService.readFile(resource)).value.toString();
                if (contents) {
                    const path = (0, resources_1.relativePath)(logsHome, resource);
                    if (path) {
                        logs.push({ relativePath: path, contents });
                    }
                }
            }
        }
    }
    function logLevelToString(level) {
        switch (level) {
            case log_1.LogLevel.Trace: return 'trace';
            case log_1.LogLevel.Debug: return 'debug';
            case log_1.LogLevel.Info: return 'info';
            case log_1.LogLevel.Warning: return 'warn';
            case log_1.LogLevel.Error: return 'error';
        }
        return 'info';
    }
    /**
     * A logger that is used when VSCode is running in the web with
     * an automation such as playwright. We expect a global codeAutomationLog
     * to be defined that we can use to log to.
     */
    class ConsoleLogInAutomationLogger extends log_1.AdapterLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super({ log: (level, args) => this.consoleLog(logLevelToString(level), args) }, logLevel);
        }
        consoleLog(type, args) {
            const automatedWindow = window_1.mainWindow;
            if (typeof automatedWindow.codeAutomationLog === 'function') {
                try {
                    automatedWindow.codeAutomationLog(type, args);
                }
                catch (err) {
                    // see https://github.com/microsoft/vscode-test-web/issues/69
                    console.error('Problems writing to codeAutomationLog', err);
                }
            }
        }
    }
    exports.ConsoleLogInAutomationLogger = ConsoleLogInAutomationLogger;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbG9nL2Jyb3dzZXIvbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsMEJBTUM7SUFYRDs7OztPQUlHO0lBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxXQUF5QixFQUFFLGtCQUF1QztRQUMvRixNQUFNLE1BQU0sR0FBZSxFQUFFLENBQUM7UUFFOUIsTUFBTSxTQUFTLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFL0YsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsS0FBSyxVQUFVLFNBQVMsQ0FBQyxXQUF5QixFQUFFLElBQWdCLEVBQUUsU0FBYyxFQUFFLFFBQWE7UUFDbEcsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWxELEtBQUssTUFBTSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQzdELElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sU0FBUyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQU0sV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDekUsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCxNQUFNLElBQUksR0FBRyxJQUFBLHdCQUFZLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUM5QyxJQUFJLElBQUksRUFBRSxDQUFDO3dCQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQzdDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsS0FBZTtRQUN4QyxRQUFRLEtBQUssRUFBRSxDQUFDO1lBQ2YsS0FBSyxjQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxPQUFPLENBQUM7WUFDcEMsS0FBSyxjQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxPQUFPLENBQUM7WUFDcEMsS0FBSyxjQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUM7WUFDbEMsS0FBSyxjQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUM7WUFDckMsS0FBSyxjQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxPQUFPLENBQUM7UUFDckMsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxNQUFhLDRCQUE2QixTQUFRLG1CQUFhO1FBSTlELFlBQVksV0FBcUIsdUJBQWlCO1lBQ2pELEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBRU8sVUFBVSxDQUFDLElBQVksRUFBRSxJQUFXO1lBQzNDLE1BQU0sZUFBZSxHQUFHLG1CQUF5QyxDQUFDO1lBQ2xFLElBQUksT0FBTyxlQUFlLENBQUMsaUJBQWlCLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQzdELElBQUksQ0FBQztvQkFDSixlQUFlLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO2dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ2QsNkRBQTZEO29CQUM3RCxPQUFPLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7S0FDRDtJQW5CRCxvRUFtQkMifQ==