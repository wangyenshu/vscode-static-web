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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/common/logsActions", "vs/workbench/common/contributions", "vs/platform/files/common/files", "vs/workbench/services/output/common/output", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/workbench/services/log/common/logConstants", "vs/base/common/async", "vs/base/common/errors", "vs/workbench/contrib/logs/common/defaultLogLevels", "vs/platform/contextkey/common/contextkey", "vs/base/common/map", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/network"], function (require, exports, nls, platform_1, actionCommonCategories_1, actions_1, logsActions_1, contributions_1, files_1, output_1, lifecycle_1, log_1, instantiation_1, event_1, logConstants_1, async_1, errors_1, defaultLogLevels_1, contextkey_1, map_1, uriIdentity_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: logsActions_1.SetLogLevelAction.ID,
                title: logsActions_1.SetLogLevelAction.TITLE,
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(servicesAccessor) {
            return servicesAccessor.get(instantiation_1.IInstantiationService).createInstance(logsActions_1.SetLogLevelAction, logsActions_1.SetLogLevelAction.ID, logsActions_1.SetLogLevelAction.TITLE.value).run();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.setDefaultLogLevel',
                title: nls.localize2('setDefaultLogLevel', "Set Default Log Level"),
                category: actionCommonCategories_1.Categories.Developer,
            });
        }
        run(servicesAccessor, logLevel, extensionId) {
            return servicesAccessor.get(defaultLogLevels_1.IDefaultLogLevelsService).setDefaultLogLevel(logLevel, extensionId);
        }
    });
    let LogOutputChannels = class LogOutputChannels extends lifecycle_1.Disposable {
        constructor(logService, loggerService, contextKeyService, fileService, uriIdentityService) {
            super();
            this.logService = logService;
            this.loggerService = loggerService;
            this.contextKeyService = contextKeyService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.contextKeys = new map_1.CounterSet();
            this.outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
            this.loggerDisposables = this._register(new lifecycle_1.DisposableMap());
            const contextKey = log_1.CONTEXT_LOG_LEVEL.bindTo(contextKeyService);
            contextKey.set((0, log_1.LogLevelToString)(loggerService.getLogLevel()));
            loggerService.onDidChangeLogLevel(e => {
                if ((0, log_1.isLogLevel)(e)) {
                    contextKey.set((0, log_1.LogLevelToString)(loggerService.getLogLevel()));
                }
            });
            this.onDidAddLoggers(loggerService.getRegisteredLoggers());
            this._register(loggerService.onDidChangeLoggers(({ added, removed }) => {
                this.onDidAddLoggers(added);
                this.onDidRemoveLoggers(removed);
            }));
            this._register(loggerService.onDidChangeVisibility(([resource, visibility]) => {
                const logger = loggerService.getRegisteredLogger(resource);
                if (logger) {
                    if (visibility) {
                        this.registerLogChannel(logger);
                    }
                    else {
                        this.deregisterLogChannel(logger);
                    }
                }
            }));
            this.registerShowWindowLogAction();
            this._register(event_1.Event.filter(contextKeyService.onDidChangeContext, e => e.affectsSome(this.contextKeys))(() => this.onDidChangeContext()));
        }
        onDidAddLoggers(loggers) {
            for (const logger of loggers) {
                if (logger.when) {
                    const contextKeyExpr = contextkey_1.ContextKeyExpr.deserialize(logger.when);
                    if (contextKeyExpr) {
                        for (const key of contextKeyExpr.keys()) {
                            this.contextKeys.add(key);
                        }
                        if (!this.contextKeyService.contextMatchesRules(contextKeyExpr)) {
                            continue;
                        }
                    }
                }
                if (logger.hidden) {
                    continue;
                }
                this.registerLogChannel(logger);
            }
        }
        onDidChangeContext() {
            for (const logger of this.loggerService.getRegisteredLoggers()) {
                if (logger.when) {
                    if (this.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(logger.when))) {
                        this.registerLogChannel(logger);
                    }
                    else {
                        this.deregisterLogChannel(logger);
                    }
                }
            }
        }
        onDidRemoveLoggers(loggers) {
            for (const logger of loggers) {
                if (logger.when) {
                    const contextKeyExpr = contextkey_1.ContextKeyExpr.deserialize(logger.when);
                    if (contextKeyExpr) {
                        for (const key of contextKeyExpr.keys()) {
                            this.contextKeys.delete(key);
                        }
                    }
                }
                this.deregisterLogChannel(logger);
            }
        }
        registerLogChannel(logger) {
            const channel = this.outputChannelRegistry.getChannel(logger.id);
            if (channel && this.uriIdentityService.extUri.isEqual(channel.file, logger.resource)) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const promise = (0, async_1.createCancelablePromise)(async (token) => {
                await (0, files_1.whenProviderRegistered)(logger.resource, this.fileService);
                try {
                    await this.whenFileExists(logger.resource, 1, token);
                    const existingChannel = this.outputChannelRegistry.getChannel(logger.id);
                    const remoteLogger = existingChannel?.file?.scheme === network_1.Schemas.vscodeRemote ? this.loggerService.getRegisteredLogger(existingChannel.file) : undefined;
                    if (remoteLogger) {
                        this.deregisterLogChannel(remoteLogger);
                    }
                    const hasToAppendRemote = existingChannel && logger.resource.scheme === network_1.Schemas.vscodeRemote;
                    const id = hasToAppendRemote ? `${logger.id}.remote` : logger.id;
                    const label = hasToAppendRemote ? nls.localize('remote name', "{0} (Remote)", logger.name ?? logger.id) : logger.name ?? logger.id;
                    this.outputChannelRegistry.registerChannel({ id, label, file: logger.resource, log: true, extensionId: logger.extensionId });
                    disposables.add((0, lifecycle_1.toDisposable)(() => this.outputChannelRegistry.removeChannel(id)));
                    if (remoteLogger) {
                        this.registerLogChannel(remoteLogger);
                    }
                }
                catch (error) {
                    if (!(0, errors_1.isCancellationError)(error)) {
                        this.logService.error('Error while registering log channel', logger.resource.toString(), (0, errors_1.getErrorMessage)(error));
                    }
                }
            });
            disposables.add((0, lifecycle_1.toDisposable)(() => promise.cancel()));
            this.loggerDisposables.set(logger.resource.toString(), disposables);
        }
        deregisterLogChannel(logger) {
            this.loggerDisposables.deleteAndDispose(logger.resource.toString());
        }
        async whenFileExists(file, trial, token) {
            const exists = await this.fileService.exists(file);
            if (exists) {
                return;
            }
            if (token.isCancellationRequested) {
                throw new errors_1.CancellationError();
            }
            if (trial > 10) {
                throw new Error(`Timed out while waiting for file to be created`);
            }
            this.logService.debug(`[Registering Log Channel] File does not exist. Waiting for 1s to retry.`, file.toString());
            await (0, async_1.timeout)(1000, token);
            await this.whenFileExists(file, trial + 1, token);
        }
        registerShowWindowLogAction() {
            this._register((0, actions_1.registerAction2)(class ShowWindowLogAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: logConstants_1.showWindowLogActionId,
                        title: nls.localize2('show window log', "Show Window Log"),
                        category: actionCommonCategories_1.Categories.Developer,
                        f1: true
                    });
                }
                async run(servicesAccessor) {
                    const outputService = servicesAccessor.get(output_1.IOutputService);
                    outputService.showChannel(logConstants_1.windowLogId);
                }
            }));
        }
    };
    LogOutputChannels = __decorate([
        __param(0, log_1.ILogService),
        __param(1, log_1.ILoggerService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, files_1.IFileService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], LogOutputChannels);
    let LogLevelMigration = class LogLevelMigration {
        constructor(defaultLogLevelsService) {
            defaultLogLevelsService.migrateLogLevels();
        }
    };
    LogLevelMigration = __decorate([
        __param(0, defaultLogLevels_1.IDefaultLogLevelsService)
    ], LogLevelMigration);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LogOutputChannels, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LogLevelMigration, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ncy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sb2dzL2NvbW1vbi9sb2dzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQTBCaEcsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsK0JBQWlCLENBQUMsRUFBRTtnQkFDeEIsS0FBSyxFQUFFLCtCQUFpQixDQUFDLEtBQUs7Z0JBQzlCLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELEdBQUcsQ0FBQyxnQkFBa0M7WUFDckMsT0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQyxjQUFjLENBQUMsK0JBQWlCLEVBQUUsK0JBQWlCLENBQUMsRUFBRSxFQUFFLCtCQUFpQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNqSixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUscUNBQXFDO2dCQUN6QyxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztnQkFDbkUsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUzthQUM5QixDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLGdCQUFrQyxFQUFFLFFBQWtCLEVBQUUsV0FBb0I7WUFDL0UsT0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsMkNBQXdCLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDakcsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsc0JBQVU7UUFNekMsWUFDYyxVQUF3QyxFQUNyQyxhQUE4QyxFQUMxQyxpQkFBc0QsRUFDNUQsV0FBMEMsRUFDbkMsa0JBQXdEO1lBRTdFLEtBQUssRUFBRSxDQUFDO1lBTnNCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDM0MsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQVQ3RCxnQkFBVyxHQUFHLElBQUksZ0JBQVUsRUFBVSxDQUFDO1lBQ3ZDLDBCQUFxQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5QixtQkFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3ZGLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFFLENBQUMsQ0FBQztZQVV4RSxNQUFNLFVBQVUsR0FBRyx1QkFBaUIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMvRCxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUEsc0JBQWdCLEVBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RCxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JDLElBQUksSUFBQSxnQkFBVSxFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ25CLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBQSxzQkFBZ0IsRUFBQyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO2dCQUN0RSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM1QixJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLEVBQUUsRUFBRTtnQkFDN0UsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNaLElBQUksVUFBVSxFQUFFLENBQUM7d0JBQ2hCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDakMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDbkMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNJLENBQUM7UUFFTyxlQUFlLENBQUMsT0FBa0M7WUFDekQsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2pCLE1BQU0sY0FBYyxHQUFHLDJCQUFjLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDL0QsSUFBSSxjQUFjLEVBQUUsQ0FBQzt3QkFDcEIsS0FBSyxNQUFNLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQzs0QkFDekMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQzNCLENBQUM7d0JBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDOzRCQUNqRSxTQUFTO3dCQUNWLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUNELElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNuQixTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLENBQUM7UUFDRixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUM7Z0JBQ2hFLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNqQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQywyQkFBYyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUN6RixJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ2pDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ25DLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sa0JBQWtCLENBQUMsT0FBa0M7WUFDNUQsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2pCLE1BQU0sY0FBYyxHQUFHLDJCQUFjLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDL0QsSUFBSSxjQUFjLEVBQUUsQ0FBQzt3QkFDcEIsS0FBSyxNQUFNLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQzs0QkFDekMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQzlCLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGtCQUFrQixDQUFDLE1BQXVCO1lBQ2pELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLElBQUksT0FBTyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RGLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsTUFBTSxPQUFPLEdBQUcsSUFBQSwrQkFBdUIsRUFBQyxLQUFLLEVBQUMsS0FBSyxFQUFDLEVBQUU7Z0JBQ3JELE1BQU0sSUFBQSw4QkFBc0IsRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxDQUFDO29CQUNKLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDckQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3pFLE1BQU0sWUFBWSxHQUFHLGVBQWUsRUFBRSxJQUFJLEVBQUUsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUN2SixJQUFJLFlBQVksRUFBRSxDQUFDO3dCQUNsQixJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ3pDLENBQUM7b0JBQ0QsTUFBTSxpQkFBaUIsR0FBRyxlQUFlLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxZQUFZLENBQUM7b0JBQzdGLE1BQU0sRUFBRSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDakUsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLGNBQWMsRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUNuSSxJQUFJLENBQUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztvQkFDN0gsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xGLElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ2xCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDdkMsQ0FBQztnQkFDRixDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxJQUFBLDRCQUFtQixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBQSx3QkFBZSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ2xILENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVPLG9CQUFvQixDQUFDLE1BQXVCO1lBQ25ELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVPLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBUyxFQUFFLEtBQWEsRUFBRSxLQUF3QjtZQUM5RSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLElBQUksMEJBQWlCLEVBQUUsQ0FBQztZQUMvQixDQUFDO1lBQ0QsSUFBSSxLQUFLLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMseUVBQXlFLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDbEgsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0IsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFTywyQkFBMkI7WUFDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsTUFBTSxtQkFBb0IsU0FBUSxpQkFBTztnQkFDdkU7b0JBQ0MsS0FBSyxDQUFDO3dCQUNMLEVBQUUsRUFBRSxvQ0FBcUI7d0JBQ3pCLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDO3dCQUMxRCxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO3dCQUM5QixFQUFFLEVBQUUsSUFBSTtxQkFDUixDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLGdCQUFrQztvQkFDM0MsTUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLHVCQUFjLENBQUMsQ0FBQztvQkFDM0QsYUFBYSxDQUFDLFdBQVcsQ0FBQywwQkFBVyxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBNUpLLGlCQUFpQjtRQU9wQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLG9CQUFjLENBQUE7UUFDZCxXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUNBQW1CLENBQUE7T0FYaEIsaUJBQWlCLENBNEp0QjtJQUVELElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWlCO1FBQ3RCLFlBQzJCLHVCQUFpRDtZQUUzRSx1QkFBdUIsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzVDLENBQUM7S0FDRCxDQUFBO0lBTkssaUJBQWlCO1FBRXBCLFdBQUEsMkNBQXdCLENBQUE7T0FGckIsaUJBQWlCLENBTXRCO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLGlCQUFpQixrQ0FBMEIsQ0FBQztJQUN0SixtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsNkJBQTZCLENBQUMsaUJBQWlCLG9DQUE0QixDQUFDIn0=