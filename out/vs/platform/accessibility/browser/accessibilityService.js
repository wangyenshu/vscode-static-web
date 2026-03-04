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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/window", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/layout/browser/layoutService"], function (require, exports, dom_1, aria_1, window_1, event_1, lifecycle_1, accessibility_1, configuration_1, contextkey_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityService = void 0;
    let AccessibilityService = class AccessibilityService extends lifecycle_1.Disposable {
        constructor(_contextKeyService, _layoutService, _configurationService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._layoutService = _layoutService;
            this._configurationService = _configurationService;
            this._accessibilitySupport = 0 /* AccessibilitySupport.Unknown */;
            this._onDidChangeScreenReaderOptimized = new event_1.Emitter();
            this._onDidChangeReducedMotion = new event_1.Emitter();
            this._accessibilityModeEnabledContext = accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.bindTo(this._contextKeyService);
            const updateContextKey = () => this._accessibilityModeEnabledContext.set(this.isScreenReaderOptimized());
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    updateContextKey();
                    this._onDidChangeScreenReaderOptimized.fire();
                }
                if (e.affectsConfiguration('workbench.reduceMotion')) {
                    this._configMotionReduced = this._configurationService.getValue('workbench.reduceMotion');
                    this._onDidChangeReducedMotion.fire();
                }
            }));
            updateContextKey();
            this._register(this.onDidChangeScreenReaderOptimized(() => updateContextKey()));
            const reduceMotionMatcher = window_1.mainWindow.matchMedia(`(prefers-reduced-motion: reduce)`);
            this._systemMotionReduced = reduceMotionMatcher.matches;
            this._configMotionReduced = this._configurationService.getValue('workbench.reduceMotion');
            this.initReducedMotionListeners(reduceMotionMatcher);
        }
        initReducedMotionListeners(reduceMotionMatcher) {
            this._register((0, dom_1.addDisposableListener)(reduceMotionMatcher, 'change', () => {
                this._systemMotionReduced = reduceMotionMatcher.matches;
                if (this._configMotionReduced === 'auto') {
                    this._onDidChangeReducedMotion.fire();
                }
            }));
            const updateRootClasses = () => {
                const reduce = this.isMotionReduced();
                this._layoutService.mainContainer.classList.toggle('reduce-motion', reduce);
                this._layoutService.mainContainer.classList.toggle('enable-motion', !reduce);
            };
            updateRootClasses();
            this._register(this.onDidChangeReducedMotion(() => updateRootClasses()));
        }
        get onDidChangeScreenReaderOptimized() {
            return this._onDidChangeScreenReaderOptimized.event;
        }
        isScreenReaderOptimized() {
            const config = this._configurationService.getValue('editor.accessibilitySupport');
            return config === 'on' || (config === 'auto' && this._accessibilitySupport === 2 /* AccessibilitySupport.Enabled */);
        }
        get onDidChangeReducedMotion() {
            return this._onDidChangeReducedMotion.event;
        }
        isMotionReduced() {
            const config = this._configMotionReduced;
            return config === 'on' || (config === 'auto' && this._systemMotionReduced);
        }
        alwaysUnderlineAccessKeys() {
            return Promise.resolve(false);
        }
        getAccessibilitySupport() {
            return this._accessibilitySupport;
        }
        setAccessibilitySupport(accessibilitySupport) {
            if (this._accessibilitySupport === accessibilitySupport) {
                return;
            }
            this._accessibilitySupport = accessibilitySupport;
            this._onDidChangeScreenReaderOptimized.fire();
        }
        alert(message) {
            (0, aria_1.alert)(message);
        }
        status(message) {
            (0, aria_1.status)(message);
        }
    };
    exports.AccessibilityService = AccessibilityService;
    exports.AccessibilityService = AccessibilityService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, layoutService_1.ILayoutService),
        __param(2, configuration_1.IConfigurationService)
    ], AccessibilityService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvYWNjZXNzaWJpbGl0eVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWXpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFXbkQsWUFDcUIsa0JBQXVELEVBQzNELGNBQStDLEVBQ3hDLHFCQUErRDtZQUV0RixLQUFLLEVBQUUsQ0FBQztZQUo2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQzFDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUNyQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBVjdFLDBCQUFxQix3Q0FBZ0M7WUFDNUMsc0NBQWlDLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUl4RCw4QkFBeUIsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBUWxFLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxrREFBa0MsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFM0csTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUM7WUFDekcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3RFLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLDZCQUE2QixDQUFDLEVBQUUsQ0FBQztvQkFDM0QsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLGlDQUFp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