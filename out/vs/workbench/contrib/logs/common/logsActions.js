/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/output/common/output", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/contrib/logs/common/defaultLogLevels", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/lifecycle"], function (require, exports, nls, actions_1, log_1, quickInput_1, uri_1, files_1, environmentService_1, resources_1, editorService_1, output_1, telemetryUtils_1, defaultLogLevels_1, codicons_1, themables_1, lifecycle_1) {
    "use strict";
    var SetLogLevelAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenWindowSessionLogFileAction = exports.SetLogLevelAction = void 0;
    let SetLogLevelAction = class SetLogLevelAction extends actions_1.Action {
        static { SetLogLevelAction_1 = this; }
        static { this.ID = 'workbench.action.setLogLevel'; }
        static { this.TITLE = nls.localize2('setLogLevel', "Set Log Level..."); }
        constructor(id, label, quickInputService, loggerService, outputService, defaultLogLevelsService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.loggerService = loggerService;
            this.outputService = outputService;
            this.defaultLogLevelsService = defaultLogLevelsService;
        }
        async run() {
            const logLevelOrChannel = await this.selectLogLevelOrChannel();
            if (logLevelOrChannel !== null) {
                if ((0, log_1.isLogLevel)(logLevelOrChannel)) {
                    this.loggerService.setLogLevel(logLevelOrChannel);
                }
                else {
                    await this.setLogLevelForChannel(logLevelOrChannel);
                }
            }
        }
        async selectLogLevelOrChannel() {
            const defaultLogLevels = await this.defaultLogLevelsService.getDefaultLogLevels();
            const extensionLogs = [], logs = [];
            const logLevel = this.loggerService.getLogLevel();
            for (const channel of this.outputService.getChannelDescriptors()) {
                if (!SetLogLevelAction_1.isLevelSettable(channel) || !channel.file) {
                    continue;
                }
                const channelLogLevel = this.loggerService.getLogLevel(channel.file) ?? logLevel;
                const item = { id: channel.id, resource: channel.file, label: channel.label, description: channelLogLevel !== logLevel ? this.getLabel(channelLogLevel) : undefined, extensionId: channel.extensionId };
                if (channel.extensionId) {
                    extensionLogs.push(item);
                }
                else {
                    logs.push(item);
                }
            }
            const entries = [];
            entries.push({ type: 'separator', label: nls.localize('all', "All") });
            entries.push(...this.getLogLevelEntries(defaultLogLevels.default, this.loggerService.getLogLevel(), true));
            if (extensionLogs.length) {
                entries.push({ type: 'separator', label: nls.localize('extensionLogs', "Extension Logs") });
                entries.push(...extensionLogs.sort((a, b) => a.label.localeCompare(b.label)));
            }
            entries.push({ type: 'separator', label: nls.localize('loggers', "Logs") });
            entries.push(...logs.sort((a, b) => a.label.localeCompare(b.label)));
            return new Promise((resolve, reject) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.placeholder = nls.localize('selectlog', "Set Log Level");
                quickPick.items = entries;
                let selectedItem;
                disposables.add(quickPick.onDidTriggerItemButton(e => {
                    quickPick.hide();
                    this.defaultLogLevelsService.setDefaultLogLevel(e.item.level);
                }));
                disposables.add(quickPick.onDidAccept(e => {
                    selectedItem = quickPick.selectedItems[0];
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    const result = selectedItem ? selectedItem.level ?? selectedItem : null;
                    disposables.dispose();
                    resolve(result);
                }));
                quickPick.show();
            });
        }
        static isLevelSettable(channel) {
            return channel.log && channel.file !== undefined && channel.id !== telemetryUtils_1.telemetryLogId && channel.id !== telemetryUtils_1.extensionTelemetryLogChannelId;
        }
        async setLogLevelForChannel(logChannel) {
            const defaultLogLevels = await this.defaultLogLevelsService.getDefaultLogLevels();
            const defaultLogLevel = defaultLogLevels.extensions.find(e => e[0] === logChannel.extensionId?.toLowerCase())?.[1] ?? defaultLogLevels.default;
            const currentLogLevel = this.loggerService.getLogLevel(logChannel.resource) ?? defaultLogLevel;
            const entries = this.getLogLevelEntries(defaultLogLevel, currentLogLevel, !!logChannel.extensionId);
            return new Promise((resolve, reject) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.placeholder = logChannel ? nls.localize('selectLogLevelFor', " {0}: Select log level", logChannel?.label) : nls.localize('selectLogLevel', "Select log level");
                quickPick.items = entries;
                quickPick.activeItems = entries.filter((entry) => entry.level === this.loggerService.getLogLevel());
                let selectedItem;
                disposables.add(quickPick.onDidTriggerItemButton(e => {
                    quickPick.hide();
                    this.defaultLogLevelsService.setDefaultLogLevel(e.item.level, logChannel.extensionId);
                }));
                disposables.add(quickPick.onDidAccept(e => {
                    selectedItem = quickPick.selectedItems[0];
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    if (selectedItem) {
                        this.loggerService.setLogLevel(logChannel.resource, selectedItem.level);
                    }
                    disposables.dispose();
                    resolve();
                }));
                quickPick.show();
            });
        }
        getLogLevelEntries(defaultLogLevel, currentLogLevel, canSetDefaultLogLevel) {
            const button = canSetDefaultLogLevel ? { iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.checkAll), tooltip: nls.localize('resetLogLevel', "Set as Default Log Level") } : undefined;
            return [
                { label: this.getLabel(log_1.LogLevel.Trace, currentLogLevel), level: log_1.LogLevel.Trace, description: this.getDescription(log_1.LogLevel.Trace, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Trace ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Debug, currentLogLevel), level: log_1.LogLevel.Debug, description: this.getDescription(log_1.LogLevel.Debug, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Debug ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Info, currentLogLevel), level: log_1.LogLevel.Info, description: this.getDescription(log_1.LogLevel.Info, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Info ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Warning, currentLogLevel), level: log_1.LogLevel.Warning, description: this.getDescription(log_1.LogLevel.Warning, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Warning ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Error, currentLogLevel), level: log_1.LogLevel.Error, description: this.getDescription(log_1.LogLevel.Error, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Error ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Off, currentLogLevel), level: log_1.LogLevel.Off, description: this.getDescription(log_1.LogLevel.Off, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Off ? [button] : undefined },
            ];
        }
        getLabel(level, current) {
            const label = (0, log_1.LogLevelToLocalizedString)(level).value;
            return level === current ? `$(check) ${label}` : label;
        }
        getDescription(level, defaultLogLevel) {
            return defaultLogLevel === level ? nls.localize('default', "Default") : undefined;
        }
    };
    exports.SetLogLevelAction = SetLogLevelAction;
    exports.SetLogLevelAction = SetLogLevelAction = SetLogLevelAction_1 = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, log_1.ILoggerService),
        __param(4, output_1.IOutputService),
        __param(5, defaultLogLevels_1.IDefaultLogLevelsService)
    ], SetLogLevelAction);
    let OpenWindowSessionLogFileAction = class OpenWindowSessionLogFileAction extends actions_1.Action {
        static { this.ID = 'workbench.action.openSessionLogFile'; }
        static { this.TITLE = nls.localize2('openSessionLogFile', "Open Window Log File (Session)..."); }
        constructor(id, label, environmentService, fileService, quickInputService, editorService) {
            super(id, label);
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.quickInputService = quickInputService;
            this.editorService = editorService;
        }
        async run() {
            const sessionResult = await this.quickInputService.pick(this.getSessions().then(sessions => sessions.map((s, index) => ({
                id: s.toString(),
                label: (0, resources_1.basename)(s),
                description: index === 0 ? nls.localize('current', "Current") : undefined
            }))), {
                canPickMany: false,
                placeHolder: nls.localize('sessions placeholder', "Select Session")
            });
            if (sessionResult) {
                const logFileResult = await this.quickInputService.pick(this.getLogFiles(uri_1.URI.parse(sessionResult.id)).then(logFiles => logFiles.map(s => ({
                    id: s.toString(),
                    label: (0, resources_1.basename)(s)
                }))), {
                    canPickMany: false,
                    placeHolder: nls.localize('log placeholder', "Select Log file")
                });
                if (logFileResult) {
                    return this.editorService.openEditor({ resource: uri_1.URI.parse(logFileResult.id), options: { pinned: true } }).then(() => undefined);
                }
            }
        }
        async getSessions() {
            const logsPath = this.environmentService.logsHome.with({ scheme: this.environmentService.logFile.scheme });
            const result = [logsPath];
            const stat = await this.fileService.resolve((0, resources_1.dirname)(logsPath));
            if (stat.children) {
                result.push(...stat.children
                    .filter(stat => !(0, resources_1.isEqual)(stat.resource, logsPath) && stat.isDirectory && /^\d{8}T\d{6}$/.test(stat.name))
                    .sort()
                    .reverse()
                    .map(d => d.resource));
            }
            return result;
        }
        async getLogFiles(session) {
            const stat = await this.fileService.resolve(session);
            if (stat.children) {
                return stat.children.filter(stat => !stat.isDirectory).map(stat => stat.resource);
            }
            return [];
        }
    };
    exports.OpenWindowSessionLogFileAction = OpenWindowSessionLogFileAction;
    exports.OpenWindowSessionLogFileAction = OpenWindowSessionLogFileAction = __decorate([
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, editorService_1.IEditorService)
    ], OpenWindowSessionLogFileAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sb2dzL2NvbW1vbi9sb2dzQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLGdCQUFNOztpQkFFNUIsT0FBRSxHQUFHLDhCQUE4QixBQUFqQyxDQUFrQztpQkFDcEMsVUFBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGtCQUFrQixDQUFDLEFBQW5ELENBQW9EO1FBRXpFLFlBQVksRUFBVSxFQUFFLEtBQWEsRUFDQyxpQkFBcUMsRUFDekMsYUFBNkIsRUFDN0IsYUFBNkIsRUFDbkIsdUJBQWlEO1lBRTVGLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFMb0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN6QyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDN0Isa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ25CLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7UUFHN0YsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUMvRCxJQUFJLGlCQUFpQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNoQyxJQUFJLElBQUEsZ0JBQVUsRUFBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7b0JBQ25DLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ25ELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FB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