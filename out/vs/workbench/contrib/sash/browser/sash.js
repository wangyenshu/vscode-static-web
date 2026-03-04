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
define(["require", "exports", "vs/base/common/numbers", "vs/base/browser/ui/sash/sash", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/layout/browser/layoutService"], function (require, exports, numbers_1, sash_1, event_1, lifecycle_1, configuration_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SashSettingsController = exports.maxSize = exports.minSize = void 0;
    exports.minSize = 1;
    exports.maxSize = 20; // see also https://ux.stackexchange.com/questions/39023/what-is-the-optimum-button-size-of-touch-screen-applications
    let SashSettingsController = class SashSettingsController {
        constructor(configurationService, layoutService) {
            this.configurationService = configurationService;
            this.layoutService = layoutService;
            this.disposables = new lifecycle_1.DisposableStore();
            const onDidChangeSize = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('workbench.sash.size'));
            onDidChangeSize(this.onDidChangeSize, this, this.disposables);
            this.onDidChangeSize();
            const onDidChangeHoverDelay = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('workbench.sash.hoverDelay'));
            onDidChangeHoverDelay(this.onDidChangeHoverDelay, this, this.disposables);
            this.onDidChangeHoverDelay();
        }
        onDidChangeSize() {
            const configuredSize = this.configurationService.getValue('workbench.sash.size');
            const size = (0, numbers_1.clamp)(configuredSize, 4, 20);
            const hoverSize = (0, numbers_1.clamp)(configuredSize, 1, 8);
            this.layoutService.mainContainer.style.setProperty('--vscode-sash-size', size + 'px');
            this.layoutService.mainContainer.style.setProperty('--vscode-sash-hover-size', hoverSize + 'px');
            (0, sash_1.setGlobalSashSize)(size);
        }
        onDidChangeHoverDelay() {
            (0, sash_1.setGlobalHoverDelay)(this.configurationService.getValue('workbench.sash.hoverDelay'));
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.SashSettingsController = SashSettingsController;
    exports.SashSettingsController = SashSettingsController = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, layoutService_1.ILayoutService)
    ], SashSettingsController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FzaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Nhc2gvYnJvd3Nlci9zYXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVuRixRQUFBLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDWixRQUFBLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxxSEFBcUg7SUFFekksSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBc0I7UUFJbEMsWUFDd0Isb0JBQTRELEVBQ25FLGFBQThDO1lBRHRCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbEQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBSjlDLGdCQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFNcEQsTUFBTSxlQUFlLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFDeEksZUFBZSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFdkIsTUFBTSxxQkFBcUIsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztZQUNwSixxQkFBcUIsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRU8sZUFBZTtZQUN0QixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFTLHFCQUFxQixDQUFDLENBQUM7WUFDekYsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFLLEVBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxQyxNQUFNLFNBQVMsR0FBRyxJQUFBLGVBQUssRUFBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTlDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ3RGLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsMEJBQTBCLEVBQUUsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ2pHLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVPLHFCQUFxQjtZQUM1QixJQUFBLDBCQUFtQixFQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixDQUFDO0tBQ0QsQ0FBQTtJQWxDWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQUtoQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsOEJBQWMsQ0FBQTtPQU5KLHNCQUFzQixDQWtDbEMifQ==