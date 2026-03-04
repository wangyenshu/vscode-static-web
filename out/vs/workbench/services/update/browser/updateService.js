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
define(["require", "exports", "vs/base/common/event", "vs/platform/update/common/update", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/host/browser/host", "vs/base/common/lifecycle"], function (require, exports, event_1, update_1, extensions_1, environmentService_1, host_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserUpdateService = void 0;
    let BrowserUpdateService = class BrowserUpdateService extends lifecycle_1.Disposable {
        get state() { return this._state; }
        set state(state) {
            this._state = state;
            this._onStateChange.fire(state);
        }
        constructor(environmentService, hostService) {
            super();
            this.environmentService = environmentService;
            this.hostService = hostService;
            this._onStateChange = this._register(new event_1.Emitter());
            this.onStateChange = this._onStateChange.event;
            this._state = update_1.State.Uninitialized;
            this.checkForUpdates(false);
        }
        async isLatestVersion() {
            const update = await this.doCheckForUpdates(false);
            if (update === undefined) {
                return undefined; // no update provider
            }
            return !!update;
        }
        async checkForUpdates(explicit) {
            await this.doCheckForUpdates(explicit);
        }
        async doCheckForUpdates(explicit) {
            if (this.environmentService.options && this.environmentService.options.updateProvider) {
                const updateProvider = this.environmentService.options.updateProvider;
                // State -> Checking for Updates
                this.state = update_1.State.CheckingForUpdates(explicit);
                const update = await updateProvider.checkForUpdate();
                if (update) {
                    // State -> Downloaded
                    this.state = update_1.State.Ready({ version: update.version, productVersion: update.version });
                }
                else {
                    // State -> Idle
                    this.state = update_1.State.Idle(1 /* UpdateType.Archive */);
                }
                return update;
            }
            return undefined; // no update provider to ask
        }
        async downloadUpdate() {
            // no-op
        }
        async applyUpdate() {
            this.hostService.reload();
        }
        async quitAndInstall() {
            this.hostService.reload();
        }
        async _applySpecificUpdate(packagePath) {
            // noop
        }
    };
    exports.BrowserUpdateService = BrowserUpdateService;
    exports.BrowserUpdateService = BrowserUpdateService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, host_1.IHostService)
    ], BrowserUpdateService);
    (0, extensions_1.registerSingleton)(update_1.IUpdateService, BrowserUpdateService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91cGRhdGUvYnJvd3Nlci91cGRhdGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQVFuRCxJQUFJLEtBQUssS0FBWSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzFDLElBQUksS0FBSyxDQUFDLEtBQVk7WUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELFlBQ3NDLGtCQUF3RSxFQUMvRixXQUEwQztZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQUg4Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFDO1lBQzlFLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBWmpELG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUyxDQUFDLENBQUM7WUFDckQsa0JBQWEsR0FBaUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFFekQsV0FBTSxHQUFVLGNBQUssQ0FBQyxhQUFhLENBQUM7WUFhM0MsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBRUQsS0FBSyxDQUFDLGVBQWU7WUFDcEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sU0FBUyxDQUFDLENBQUMscUJBQXFCO1lBQ3hDLENBQUM7WUFFRCxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDakIsQ0FBQztRQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBaUI7WUFDdEMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxRQUFpQjtZQUNoRCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDdkYsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUM7Z0JBRXRFLGdDQUFnQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxjQUFLLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRWhELE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBYyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNyRCxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNaLHNCQUFzQjtvQkFDdEIsSUFBSSxDQUFDLEtBQUssR0FBRyxjQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsZ0JBQWdCO29CQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLGNBQUssQ0FBQyxJQUFJLDRCQUFvQixDQUFDO2dCQUM3QyxDQUFDO2dCQUVELE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDLENBQUMsNEJBQTRCO1FBQy9DLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYztZQUNuQixRQUFRO1FBQ1QsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXO1lBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjO1lBQ25CLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxXQUFtQjtZQUM3QyxPQUFPO1FBQ1IsQ0FBQztLQUNELENBQUE7SUF6RVksb0RBQW9CO21DQUFwQixvQkFBb0I7UUFlOUIsV0FBQSx3REFBbUMsQ0FBQTtRQUNuQyxXQUFBLG1CQUFZLENBQUE7T0FoQkYsb0JBQW9CLENBeUVoQztJQUVELElBQUEsOEJBQWlCLEVBQUMsdUJBQWMsRUFBRSxvQkFBb0Isa0NBQTBCLENBQUMifQ==