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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/layout/browser/layoutService", "vs/platform/opener/common/opener", "vs/platform/quickinput/browser/quickAccess", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "./quickInput", "vs/platform/quickinput/browser/quickInputController", "vs/platform/configuration/common/configuration", "vs/base/browser/dom"], function (require, exports, cancellation_1, event_1, contextkey_1, instantiation_1, layoutService_1, opener_1, quickAccess_1, defaultStyles_1, colorRegistry_1, themeService_1, quickInput_1, quickInputController_1, configuration_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputService = void 0;
    let QuickInputService = class QuickInputService extends themeService_1.Themable {
        get backButton() { return this.controller.backButton; }
        get controller() {
            if (!this._controller) {
                this._controller = this._register(this.createController());
            }
            return this._controller;
        }
        get hasController() { return !!this._controller; }
        get quickAccess() {
            if (!this._quickAccess) {
                this._quickAccess = this._register(this.instantiationService.createInstance(quickAccess_1.QuickAccessController));
            }
            return this._quickAccess;
        }
        constructor(instantiationService, contextKeyService, themeService, layoutService, configurationService) {
            super(themeService);
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this._onShow = this._register(new event_1.Emitter());
            this.onShow = this._onShow.event;
            this._onHide = this._register(new event_1.Emitter());
            this.onHide = this._onHide.event;
            this.contexts = new Map();
        }
        createController(host = this.layoutService, options) {
            const defaultOptions = {
                idPrefix: 'quickInput_',
                container: host.activeContainer,
                ignoreFocusOut: () => false,
                backKeybindingLabel: () => undefined,
                setContextKey: (id) => this.setContextKey(id),
                linkOpenerDelegate: (content) => {
                    // HACK: https://github.com/microsoft/vscode/issues/173691
                    this.instantiationService.invokeFunction(accessor => {
                        const openerService = accessor.get(opener_1.IOpenerService);
                        openerService.open(content, { allowCommands: true, fromUserGesture: true });
                    });
                },
                returnFocus: () => host.focus(),
                styles: this.computeStyles(),
                hoverDelegate: this._register(this.instantiationService.createInstance(quickInput_1.QuickInputHoverDelegate))
            };
            const controller = this._register(this.instantiationService.createInstance(quickInputController_1.QuickInputController, {
                ...defaultOptions,
                ...options
            }));
            controller.layout(host.activeContainerDimension, host.activeContainerOffset.quickPickTop);
            // Layout changes
            this._register(host.onDidLayoutActiveContainer(dimension => {
                if ((0, dom_1.getWindow)(host.activeContainer) === (0, dom_1.getWindow)(controller.container)) {
                    controller.layout(dimension, host.activeContainerOffset.quickPickTop);
                }
            }));
            this._register(host.onDidChangeActiveContainer(() => {
                if (controller.isVisible()) {
                    return;
                }
                controller.layout(host.activeContainerDimension, host.activeContainerOffset.quickPickTop);
            }));
            // Context keys
            this._register(controller.onShow(() => {
                this.resetContextKeys();
                this._onShow.fire();
            }));
            this._register(controller.onHide(() => {
                this.resetContextKeys();
                this._onHide.fire();
            }));
            return controller;
        }
        setContextKey(id) {
            let key;
            if (id) {
                key = this.contexts.get(id);
                if (!key) {
                    key = new contextkey_1.RawContextKey(id, false)
                        .bindTo(this.contextKeyService);
                    this.contexts.set(id, key);
                }
            }
            if (key && key.get()) {
                return; // already active context
            }
            this.resetContextKeys();
            key?.set(true);
        }
        resetContextKeys() {
            this.contexts.forEach(context => {
                if (context.get()) {
                    context.reset();
                }
            });
        }
        pick(picks, options = {}, token = cancellation_1.CancellationToken.None) {
            return this.controller.pick(picks, options, token);
        }
        input(options = {}, token = cancellation_1.CancellationToken.None) {
            return this.controller.input(options, token);
        }
        createQuickPick() {
            return this.controller.createQuickPick();
        }
        createInputBox() {
            return this.controller.createInputBox();
        }
        createQuickWidget() {
            return this.controller.createQuickWidget();
        }
        focus() {
            this.controller.focus();
        }
        toggle() {
            this.controller.toggle();
        }
        navigate(next, quickNavigate) {
            this.controller.navigate(next, quickNavigate);
        }
        accept(keyMods) {
            return this.controller.accept(keyMods);
        }
        back() {
            return this.controller.back();
        }
        cancel() {
            return this.controller.cancel();
        }
        updateStyles() {
            if (this.hasController) {
                this.controller.applyStyles(this.computeStyles());
            }
        }
        computeStyles() {
            return {
                widget: {
                    quickInputBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputBackground),
                    quickInputForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputForeground),
                    quickInputTitleBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputTitleBackground),
                    widgetBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetBorder),
                    widgetShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow),
                },
                inputBox: defaultStyles_1.defaultInputBoxStyles,
                toggle: defaultStyles_1.defaultToggleStyles,
                countBadge: defaultStyles_1.defaultCountBadgeStyles,
                button: defaultStyles_1.defaultButtonStyles,
                progressBar: defaultStyles_1.defaultProgressBarStyles,
                keybindingLabel: defaultStyles_1.defaultKeybindingLabelStyles,
                list: (0, defaultStyles_1.getListStyles)({
                    listBackground: colorRegistry_1.quickInputBackground,
                    listFocusBackground: colorRegistry_1.quickInputListFocusBackground,
                    listFocusForeground: colorRegistry_1.quickInputListFocusForeground,
                    // Look like focused when inactive.
                    listInactiveFocusForeground: colorRegistry_1.quickInputListFocusForeground,
                    listInactiveSelectionIconForeground: colorRegistry_1.quickInputListFocusIconForeground,
                    listInactiveFocusBackground: colorRegistry_1.quickInputListFocusBackground,
                    listFocusOutline: colorRegistry_1.activeContrastBorder,
                    listInactiveFocusOutline: colorRegistry_1.activeContrastBorder,
                }),
                pickerGroup: {
                    pickerGroupBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.pickerGroupBorder),
                    pickerGroupForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.pickerGroupForeground),
                }
            };
        }
    };
    exports.QuickInputService = QuickInputService;
    exports.QuickInputService = QuickInputService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, themeService_1.IThemeService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, configuration_1.IConfigurationService)
    ], QuickInputService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9xdWlja2lucHV0L2Jyb3dzZXIvcXVpY2tJbnB1dFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHVCQUFRO1FBSTlDLElBQUksVUFBVSxLQUF3QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQVMxRSxJQUFZLFVBQVU7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBWSxhQUFhLEtBQUssT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFHMUQsSUFBSSxXQUFXO1lBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbUNBQXFCLENBQUMsQ0FBQyxDQUFDO1lBQ3JHLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUlELFlBQ3dCLG9CQUE0RCxFQUMvRCxpQkFBd0QsRUFDN0QsWUFBMkIsRUFDMUIsYUFBZ0QsRUFDekMsb0JBQThEO1lBRXJGLEtBQUssQ0FBQyxZQUFZ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