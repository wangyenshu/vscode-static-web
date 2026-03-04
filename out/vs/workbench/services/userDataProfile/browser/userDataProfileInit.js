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
define(["require", "exports", "vs/platform/storage/common/storage", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/base/common/async", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/browser/settingsResource", "vs/workbench/services/userDataProfile/browser/globalStateResource", "vs/workbench/services/userDataProfile/browser/keybindingsResource", "vs/workbench/services/userDataProfile/browser/tasksResource", "vs/workbench/services/userDataProfile/browser/snippetsResource", "vs/workbench/services/userDataProfile/browser/extensionsResource", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/types", "vs/platform/request/common/request", "vs/base/common/cancellation", "vs/base/common/uri"], function (require, exports, storage_1, files_1, log_1, async_1, uriIdentity_1, userDataProfile_1, settingsResource_1, globalStateResource_1, keybindingsResource_1, tasksResource_1, snippetsResource_1, extensionsResource_1, environmentService_1, types_1, request_1, cancellation_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileInitializer = void 0;
    let UserDataProfileInitializer = class UserDataProfileInitializer {
        constructor(environmentService, fileService, userDataProfileService, storageService, logService, uriIdentityService, requestService) {
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.userDataProfileService = userDataProfileService;
            this.storageService = storageService;
            this.logService = logService;
            this.uriIdentityService = uriIdentityService;
            this.requestService = requestService;
            this.initialized = [];
            this.initializationFinished = new async_1.Barrier();
        }
        async whenInitializationFinished() {
            await this.initializationFinished.wait();
        }
        async requiresInitialization() {
            if (!this.environmentService.options?.profile?.contents) {
                return false;
            }
            if (!this.storageService.isNew(0 /* StorageScope.PROFILE */)) {
                return false;
            }
            return true;
        }
        async initializeRequiredResources() {
            this.logService.trace(`UserDataProfileInitializer#initializeRequiredResources`);
            const promises = [];
            const profileTemplate = await this.getProfileTemplate();
            if (profileTemplate?.settings) {
                promises.push(this.initialize(new settingsResource_1.SettingsResourceInitializer(this.userDataProfileService, this.fileService, this.logService), profileTemplate.settings, "settings" /* ProfileResourceType.Settings */));
            }
            if (profileTemplate?.globalState) {
                promises.push(this.initialize(new globalStateResource_1.GlobalStateResourceInitializer(this.storageService), profileTemplate.globalState, "globalState" /* ProfileResourceType.GlobalState */));
            }
            await Promise.all(promises);
        }
        async initializeOtherResources(instantiationService) {
            try {
                this.logService.trace(`UserDataProfileInitializer#initializeOtherResources`);
                const promises = [];
                const profileTemplate = await this.getProfileTemplate();
                if (profileTemplate?.keybindings) {
                    promises.push(this.initialize(new keybindingsResource_1.KeybindingsResourceInitializer(this.userDataProfileService, this.fileService, this.logService), profileTemplate.keybindings, "keybindings" /* ProfileResourceType.Keybindings */));
                }
                if (profileTemplate?.tasks) {
                    promises.push(this.initialize(new tasksResource_1.TasksResourceInitializer(this.userDataProfileService, this.fileService, this.logService), profileTemplate.tasks, "tasks" /* ProfileResourceType.Tasks */));
                }
                if (profileTemplate?.snippets) {
                    promises.push(this.initialize(new snippetsResource_1.SnippetsResourceInitializer(this.userDataProfileService, this.fileService, this.uriIdentityService), profileTemplate.snippets, "snippets" /* ProfileResourceType.Snippets */));
                }
                promises.push(this.initializeInstalledExtensions(instantiationService));
                await async_1.Promises.settled(promises);
            }
            finally {
                this.initializationFinished.open();
            }
        }
        async initializeInstalledExtensions(instantiationService) {
            if (!this.initializeInstalledExtensionsPromise) {
                const profileTemplate = await this.getProfileTemplate();
                if (profileTemplate?.extensions) {
                    this.initializeInstalledExtensionsPromise = this.initialize(instantiationService.createInstance(extensionsResource_1.ExtensionsResourceInitializer), profileTemplate.extensions, "extensions" /* ProfileResourceType.Extensions */);
                }
                else {
                    this.initializeInstalledExtensionsPromise = Promise.resolve();
                }
            }
            return this.initializeInstalledExtensionsPromise;
        }
        getProfileTemplate() {
            if (!this.profileTemplatePromise) {
                this.profileTemplatePromise = this.doGetProfileTemplate();
            }
            return this.profileTemplatePromise;
        }
        async doGetProfileTemplate() {
            if (!this.environmentService.options?.profile?.contents) {
                return null;
            }
            if ((0, types_1.isString)(this.environmentService.options.profile.contents)) {
                try {
                    return JSON.parse(this.environmentService.options.profile.contents);
                }
                catch (error) {
                    this.logService.error(error);
                    return null;
                }
            }
            try {
                const url = uri_1.URI.revive(this.environmentService.options.profile.contents).toString(true);
                const context = await this.requestService.request({ type: 'GET', url }, cancellation_1.CancellationToken.None);
                if (context.res.statusCode === 200) {
                    return await (0, request_1.asJson)(context);
                }
                else {
                    this.logService.warn(`UserDataProfileInitializer: Failed to get profile from URL: ${url}. Status code: ${context.res.statusCode}.`);
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            return null;
        }
        async initialize(initializer, content, profileResource) {
            try {
                if (this.initialized.includes(profileResource)) {
                    this.logService.info(`UserDataProfileInitializer: ${profileResource} initialized already.`);
                    return;
                }
                this.initialized.push(profileResource);
                this.logService.trace(`UserDataProfileInitializer: Initializing ${profileResource}`);
                await initializer.initialize(content);
                this.logService.info(`UserDataProfileInitializer: Initialized ${profileResource}`);
            }
            catch (error) {
                this.logService.info(`UserDataProfileInitializer: Error while initializing ${profileResource}`);
                this.logService.error(error);
            }
        }
    };
    exports.UserDataProfileInitializer = UserDataProfileInitializer;
    exports.UserDataProfileInitializer = UserDataProfileInitializer = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, userDataProfile_1.IUserDataProfileService),
        __param(3, storage_1.IStorageService),
        __param(4, log_1.ILogService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, request_1.IRequestService)
    ], UserDataProfileInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlSW5pdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci91c2VyRGF0YVByb2ZpbGVJbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMEI7UUFPdEMsWUFDc0Msa0JBQXdFLEVBQy9GLFdBQTBDLEVBQy9CLHNCQUFnRSxFQUN4RSxjQUFnRCxFQUNwRCxVQUF3QyxFQUNoQyxrQkFBd0QsRUFDNUQsY0FBZ0Q7WUFOWCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFDO1lBQzlFLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2QsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUN2RCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNmLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDM0MsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBVmpELGdCQUFXLEdBQTBCLEVBQUUsQ0FBQztZQUN4QywyQkFBc0IsR0FBRyxJQUFJLGVBQU8sRUFBRSxDQUFDO1FBV3hELENBQUM7UUFFRCxLQUFLLENBQUMsMEJBQTBCO1lBQy9CLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQzFDLENBQUM7UUFFRCxLQUFLLENBQUMsc0JBQXNCO1lBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDekQsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFj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