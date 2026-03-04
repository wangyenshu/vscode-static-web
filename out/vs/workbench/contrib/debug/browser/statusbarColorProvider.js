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
define(["require", "exports", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/workbench/common/theme", "vs/base/common/lifecycle", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/configuration/common/configuration", "vs/platform/layout/browser/layoutService"], function (require, exports, nls_1, colorRegistry_1, debug_1, workspace_1, theme_1, lifecycle_1, statusbar_1, configuration_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusBarColorProvider = exports.COMMAND_CENTER_DEBUGGING_BACKGROUND = exports.STATUS_BAR_DEBUGGING_BORDER = exports.STATUS_BAR_DEBUGGING_FOREGROUND = exports.STATUS_BAR_DEBUGGING_BACKGROUND = void 0;
    exports.isStatusbarInDebugMode = isStatusbarInDebugMode;
    // colors for theming
    exports.STATUS_BAR_DEBUGGING_BACKGROUND = (0, colorRegistry_1.registerColor)('statusBar.debuggingBackground', {
        dark: '#CC6633',
        light: '#CC6633',
        hcDark: '#BA592C',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('statusBarDebuggingBackground', "Status bar background color when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_DEBUGGING_FOREGROUND = (0, colorRegistry_1.registerColor)('statusBar.debuggingForeground', {
        dark: theme_1.STATUS_BAR_FOREGROUND,
        light: theme_1.STATUS_BAR_FOREGROUND,
        hcDark: theme_1.STATUS_BAR_FOREGROUND,
        hcLight: '#FFFFFF'
    }, (0, nls_1.localize)('statusBarDebuggingForeground', "Status bar foreground color when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.STATUS_BAR_DEBUGGING_BORDER = (0, colorRegistry_1.registerColor)('statusBar.debuggingBorder', {
        dark: theme_1.STATUS_BAR_BORDER,
        light: theme_1.STATUS_BAR_BORDER,
        hcDark: theme_1.STATUS_BAR_BORDER,
        hcLight: theme_1.STATUS_BAR_BORDER
    }, (0, nls_1.localize)('statusBarDebuggingBorder', "Status bar border color separating to the sidebar and editor when a program is being debugged. The status bar is shown in the bottom of the window"));
    exports.COMMAND_CENTER_DEBUGGING_BACKGROUND = (0, colorRegistry_1.registerColor)('commandCenter.debuggingBackground', {
        dark: { value: exports.STATUS_BAR_DEBUGGING_BACKGROUND, op: 2 /* ColorTransformType.Transparent */, factor: 0.258 },
        hcDark: { value: exports.STATUS_BAR_DEBUGGING_BACKGROUND, op: 2 /* ColorTransformType.Transparent */, factor: 0.258 },
        light: { value: exports.STATUS_BAR_DEBUGGING_BACKGROUND, op: 2 /* ColorTransformType.Transparent */, factor: 0.258 },
        hcLight: { value: exports.STATUS_BAR_DEBUGGING_BACKGROUND, op: 2 /* ColorTransformType.Transparent */, factor: 0.258 }
    }, (0, nls_1.localize)('commandCenter-activeBackground', "Command center background color when a program is being debugged"), true);
    let StatusBarColorProvider = class StatusBarColorProvider {
        set enabled(enabled) {
            if (enabled === !!this.disposable) {
                return;
            }
            if (enabled) {
                this.disposable = this.statusbarService.overrideStyle({
                    priority: 10,
                    foreground: exports.STATUS_BAR_DEBUGGING_FOREGROUND,
                    background: exports.STATUS_BAR_DEBUGGING_BACKGROUND,
                    border: exports.STATUS_BAR_DEBUGGING_BORDER,
                });
            }
            else {
                this.disposable.dispose();
                this.disposable = undefined;
            }
        }
        constructor(debugService, contextService, statusbarService, layoutService, configurationService) {
            this.debugService = debugService;
            this.contextService = contextService;
            this.statusbarService = statusbarService;
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.debugService.onDidChangeState(this.update, this, this.disposables);
            this.contextService.onDidChangeWorkbenchState(this.update, this, this.disposables);
            this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('debug.enableStatusBarColor') || e.affectsConfiguration('debug.toolBarLocation')) {
                    this.update();
                }
            }, this.disposables);
            this.update();
        }
        update() {
            const debugConfig = this.configurationService.getValue('debug');
            const isInDebugMode = isStatusbarInDebugMode(this.debugService.state, this.debugService.getModel().getSessions());
            if (!debugConfig.enableStatusBarColor) {
                this.enabled = false;
            }
            else {
                this.enabled = isInDebugMode;
            }
            const isInCommandCenter = debugConfig.toolBarLocation === 'commandCenter';
            this.layoutService.mainContainer.style.setProperty((0, colorRegistry_1.asCssVariableName)(theme_1.COMMAND_CENTER_BACKGROUND), isInCommandCenter && isInDebugMode
                ? (0, colorRegistry_1.asCssVariable)(exports.COMMAND_CENTER_DEBUGGING_BACKGROUND)
                : '');
        }
        dispose() {
            this.disposable?.dispose();
            this.disposables.dispose();
        }
    };
    exports.StatusBarColorProvider = StatusBarColorProvider;
    exports.StatusBarColorProvider = StatusBarColorProvider = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, statusbar_1.IStatusbarService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, configuration_1.IConfigurationService)
    ], StatusBarColorProvider);
    function isStatusbarInDebugMode(state, sessions) {
        if (state === 0 /* State.Inactive */ || state === 1 /* State.Initializing */ || sessions.every(s => s.suppressDebugStatusbar || s.configuration?.noDebug)) {
            return false;
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFyQ29sb3JQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvc3RhdHVzYmFyQ29sb3JQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnSGhHLHdEQU1DO0lBeEdELHFCQUFxQjtJQUVSLFFBQUEsK0JBQStCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLCtCQUErQixFQUFFO1FBQzdGLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsTUFBTSxFQUFFLFNBQVM7UUFDakIsT0FBTyxFQUFFLFNBQVM7S0FDbEIsRUFBRSxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxtSEFBbUgsQ0FBQyxDQUFDLENBQUM7SUFFckosUUFBQSwrQkFBK0IsR0FBRyxJQUFBLDZCQUFhLEVBQUMsK0JBQStCLEVBQUU7UUFDN0YsSUFBSSxFQUFFLDZCQUFxQjtRQUMzQixLQUFLLEVBQUUsNkJBQXFCO1FBQzVCLE1BQU0sRUFBRSw2QkFBcUI7UUFDN0IsT0FBTyxFQUFFLFNBQVM7S0FDbEIsRUFBRSxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxtSEFBbUgsQ0FBQyxDQUFDLENBQUM7SUFFckosUUFBQSwyQkFBMkIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsMkJBQTJCLEVBQUU7UUFDckYsSUFBSSxFQUFFLHlCQUFpQjtRQUN2QixLQUFLLEVBQUUseUJBQWlCO1FBQ3hCLE1BQU0sRUFBRSx5QkFBaUI7UUFDekIsT0FBTyxFQUFFLHlCQUFpQjtLQUMxQixFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLG9KQUFvSixDQUFDLENBQUMsQ0FBQztJQUVsTCxRQUFBLG1DQUFtQyxHQUFHLElBQUEs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