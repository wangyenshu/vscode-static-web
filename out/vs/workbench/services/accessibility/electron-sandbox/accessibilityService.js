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
define(["require", "exports", "vs/platform/accessibility/common/accessibility", "vs/base/common/platform", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/accessibility/browser/accessibilityService", "vs/platform/instantiation/common/extensions", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/common/contributions", "vs/platform/native/common/native", "vs/platform/layout/browser/layoutService"], function (require, exports, accessibility_1, platform_1, environmentService_1, contextkey_1, configuration_1, accessibilityService_1, extensions_1, telemetry_1, jsonEditing_1, contributions_1, native_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeAccessibilityService = void 0;
    let NativeAccessibilityService = class NativeAccessibilityService extends accessibilityService_1.AccessibilityService {
        constructor(environmentService, contextKeyService, configurationService, _layoutService, _telemetryService, nativeHostService) {
            super(contextKeyService, _layoutService, configurationService);
            this._telemetryService = _telemetryService;
            this.nativeHostService = nativeHostService;
            this.didSendTelemetry = false;
            this.shouldAlwaysUnderlineAccessKeys = undefined;
            this.setAccessibilitySupport(environmentService.window.accessibilitySupport ? 2 /* AccessibilitySupport.Enabled */ : 1 /* AccessibilitySupport.Disabled */);
        }
        async alwaysUnderlineAccessKeys() {
            if (!platform_1.isWindows) {
                return false;
            }
            if (typeof this.shouldAlwaysUnderlineAccessKeys !== 'boolean') {
                const windowsKeyboardAccessibility = await this.nativeHostService.windowsGetStringRegKey('HKEY_CURRENT_USER', 'Control Panel\\Accessibility\\Keyboard Preference', 'On');
                this.shouldAlwaysUnderlineAccessKeys = (windowsKeyboardAccessibility === '1');
            }
            return this.shouldAlwaysUnderlineAccessKeys;
        }
        setAccessibilitySupport(accessibilitySupport) {
            super.setAccessibilitySupport(accessibilitySupport);
            if (!this.didSendTelemetry && accessibilitySupport === 2 /* AccessibilitySupport.Enabled */) {
                this._telemetryService.publicLog2('accessibility', { enabled: true });
                this.didSendTelemetry = true;
            }
        }
    };
    exports.NativeAccessibilityService = NativeAccessibilityService;
    exports.NativeAccessibilityService = NativeAccessibilityService = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, native_1.INativeHostService)
    ], NativeAccessibilityService);
    (0, extensions_1.registerSingleton)(accessibility_1.IAccessibilityService, NativeAccessibilityService, 1 /* InstantiationType.Delayed */);
    // On linux we do not automatically detect that a screen reader is detected, thus we have to implicitly notify the renderer to enable accessibility when user configures it in settings
    let LinuxAccessibilityContribution = class LinuxAccessibilityContribution {
        static { this.ID = 'workbench.contrib.linuxAccessibility'; }
        constructor(jsonEditingService, accessibilityService, environmentService) {
            const forceRendererAccessibility = () => {
                if (accessibilityService.isScreenReaderOptimized()) {
                    jsonEditingService.write(environmentService.argvResource, [{ path: ['force-renderer-accessibility'], value: true }], true);
                }
            };
            forceRendererAccessibility();
            accessibilityService.onDidChangeScreenReaderOptimized(forceRendererAccessibility);
        }
    };
    LinuxAccessibilityContribution = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService)
    ], LinuxAccessibilityContribution);
    if (platform_1.isLinux) {
        (0, contributions_1.registerWorkbenchContribution2)(LinuxAccessibilityContribution.ID, LinuxAccessibilityContribution, 2 /* WorkbenchPhase.BlockRestore */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYWNjZXNzaWJpbGl0eS9lbGVjdHJvbi1zYW5kYm94L2FjY2Vzc2liaWxpdHlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdCekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSwyQ0FBb0I7UUFLbkUsWUFDcUMsa0JBQXNELEVBQ3RFLGlCQUFxQyxFQUNsQyxvQkFBMkMsRUFDbEQsY0FBOEIsRUFDM0IsaUJBQXFELEVBQ3BELGlCQUFzRDtZQUUxRSxLQUFLLENBQUMsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFIM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNuQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBVG5FLHFCQUFnQixHQUFHLEtBQUssQ0FBQztZQUN6QixvQ0FBK0IsR0FBd0IsU0FBUyxDQUFDO1lBV3hFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxzQ0FBOEIsQ0FBQyxzQ0FBOEIsQ0FBQyxDQUFDO1FBQzdJLENBQUM7UUFFUSxLQUFLLENBQUMseUJBQXlCO1lBQ3ZDLElBQUksQ0FBQyxvQkFBUyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksT0FBTyxJQUFJLENBQUMsK0JBQStCLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQy9ELE1BQU0sNEJBQTRCLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLEVBQUUsbURBQW1ELEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3pLLElBQUksQ0FBQywrQkFBK0IsR0FBRyxDQUFDLDRCQUE0QixLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQy9FLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQztRQUM3QyxDQUFDO1FBRVEsdUJBQXVCLENBQUMsb0JBQTBDO1lBQzFFLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRXBELElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksb0JBQW9CLHlDQUFpQyxFQUFFLENBQUM7Z0JBQ3JGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQTJELGVBQWUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNoSSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQXRDWSxnRUFBMEI7eUNBQTFCLDBCQUEwQjtRQU1wQyxXQUFBLHVEQUFrQyxDQUFBO1FBQ2xDLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsMkJBQWtCLENBQUE7T0FYUiwwQkFBMEIsQ0FzQ3RDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxxQ0FBcUIsRUFBRSwwQkFBMEIsb0NBQTRCLENBQUM7SUFFaEcsdUxBQXVMO0lBQ3ZMLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQThCO2lCQUVuQixPQUFFLEdBQUcsc0NBQXNDLEFBQXpDLENBQTBDO1FBRTVELFlBQ3NCLGtCQUF1QyxFQUNyQyxvQkFBMkMsRUFDOUIsa0JBQXNEO1lBRTFGLE1BQU0sMEJBQTBCLEdBQUcsR0FBRyxFQUFFO2dCQUN2QyxJQUFJLG9CQUFvQixDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQztvQkFDcEQsa0JBQWtCLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsOEJBQThCLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUgsQ0FBQztZQUNGLENBQUMsQ0FBQztZQUNGLDBCQUEwQixFQUFFLENBQUM7WUFDN0Isb0JBQW9CLENBQUMsZ0NBQWdDLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNuRixDQUFDOztJQWhCSSw4QkFBOEI7UUFLakMsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsdURBQWtDLENBQUE7T0FQL0IsOEJBQThCLENBaUJuQztJQUVELElBQUksa0JBQU8sRUFBRSxDQUFDO1FBQ2IsSUFBQSw4Q0FBOEIsRUFBQyw4QkFBOEIsQ0FBQyxFQUFFLEVBQUUsOEJBQThCLHNDQUE4QixDQUFDO0lBQ2hJLENBQUMifQ==