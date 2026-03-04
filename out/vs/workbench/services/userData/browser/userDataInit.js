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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/base/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/base/common/performance"], function (require, exports, instantiation_1, contributions_1, platform_1, platform_2, extensions_1, performance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataInitializationService = exports.IUserDataInitializationService = void 0;
    exports.IUserDataInitializationService = (0, instantiation_1.createDecorator)('IUserDataInitializationService');
    class UserDataInitializationService {
        constructor(initializers = []) {
            this.initializers = initializers;
        }
        async whenInitializationFinished() {
            if (await this.requiresInitialization()) {
                await Promise.all(this.initializers.map(initializer => initializer.whenInitializationFinished()));
            }
        }
        async requiresInitialization() {
            return (await Promise.all(this.initializers.map(initializer => initializer.requiresInitialization()))).some(result => result);
        }
        async initializeRequiredResources() {
            if (await this.requiresInitialization()) {
                await Promise.all(this.initializers.map(initializer => initializer.initializeRequiredResources()));
            }
        }
        async initializeOtherResources(instantiationService) {
            if (await this.requiresInitialization()) {
                await Promise.all(this.initializers.map(initializer => initializer.initializeOtherResources(instantiationService)));
            }
        }
        async initializeInstalledExtensions(instantiationService) {
            if (await this.requiresInitialization()) {
                await Promise.all(this.initializers.map(initializer => initializer.initializeInstalledExtensions(instantiationService)));
            }
        }
    }
    exports.UserDataInitializationService = UserDataInitializationService;
    let InitializeOtherResourcesContribution = class InitializeOtherResourcesContribution {
        constructor(userDataInitializeService, instantiationService, extensionService) {
            extensionService.whenInstalledExtensionsRegistered().then(() => this.initializeOtherResource(userDataInitializeService, instantiationService));
        }
        async initializeOtherResource(userDataInitializeService, instantiationService) {
            if (await userDataInitializeService.requiresInitialization()) {
                (0, performance_1.mark)('code/willInitOtherUserData');
                await userDataInitializeService.initializeOtherResources(instantiationService);
                (0, performance_1.mark)('code/didInitOtherUserData');
            }
        }
    };
    InitializeOtherResourcesContribution = __decorate([
        __param(0, exports.IUserDataInitializationService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, extensions_1.IExtensionService)
    ], InitializeOtherResourcesContribution);
    if (platform_2.isWeb) {
        const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(InitializeOtherResourcesContribution, 3 /* LifecyclePhase.Restored */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFJbml0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhL2Jyb3dzZXIvdXNlckRhdGFJbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCbkYsUUFBQSw4QkFBOEIsR0FBRyxJQUFBLCtCQUFlLEVBQWlDLGdDQUFnQyxDQUFDLENBQUM7SUFLaEksTUFBYSw2QkFBNkI7UUFJekMsWUFBNkIsZUFBdUMsRUFBRTtZQUF6QyxpQkFBWSxHQUFaLFlBQVksQ0FBNkI7UUFDdEUsQ0FBQztRQUVELEtBQUssQ0FBQywwQkFBMEI7WUFDL0IsSUFBSSxNQUFNLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxzQkFBc0I7WUFDM0IsT0FBTyxDQUFDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9ILENBQUM7UUFFRCxLQUFLLENBQUMsMkJBQTJCO1lBQ2hDLElBQUksTUFBTSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEcsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsd0JBQXdCLENBQUMsb0JBQTJDO1lBQ3pFLElBQUksTUFBTSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsd0JBQXdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckgsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsNkJBQTZCLENBQUMsb0JBQTJDO1lBQzlFLElBQUksTUFBTSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsNkJBQTZCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUgsQ0FBQztRQUNGLENBQUM7S0FFRDtJQW5DRCxzRUFtQ0M7SUFFRCxJQUFNLG9DQUFvQyxHQUExQyxNQUFNLG9DQUFvQztRQUN6QyxZQUNpQyx5QkFBeUQsRUFDbEUsb0JBQTJDLEVBQy9DLGdCQUFtQztZQUV0RCxnQkFBZ0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMseUJBQXlCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQ2hKLENBQUM7UUFFTyxLQUFLLENBQUMsdUJBQXVCLENBQUMseUJBQXlELEVBQUUsb0JBQTJDO1lBQzNJLElBQUksTUFBTSx5QkFBeUIsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7Z0JBQzlELElBQUEsa0JBQUksRUFBQyw0QkFBNEIsQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLHlCQUF5QixDQUFDLHdCQUF3QixDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQy9FLElBQUEsa0JBQUksRUFBQywyQkFBMkIsQ0FBQyxDQUFDO1lBQ25DLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQWhCSyxvQ0FBb0M7UUFFdkMsV0FBQSxzQ0FBOEIsQ0FBQTtRQUM5QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsOEJBQWlCLENBQUE7T0FKZCxvQ0FBb0MsQ0FnQnpDO0lBRUQsSUFBSSxnQkFBSyxFQUFFLENBQUM7UUFDWCxNQUFNLGlCQUFpQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdGLGlCQUFpQixDQUFDLDZCQUE2QixDQUFDLG9DQUFvQyxrQ0FBMEIsQ0FBQztJQUNoSCxDQUFDIn0=