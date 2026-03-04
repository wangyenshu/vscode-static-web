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
define(["require", "exports", "vs/base/common/event", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/nls", "vs/base/common/types", "vs/workbench/contrib/terminal/common/terminalConfiguration"], function (require, exports, event_1, scrollableElement_1, lifecycle_1, platform_1, terminalExtensions_1, configuration_1, terminalActions_1, nls_1, types_1, terminalConfiguration_1) {
    "use strict";
    var TerminalMouseWheelZoomContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalMouseWheelZoomContribution = class TerminalMouseWheelZoomContribution extends lifecycle_1.Disposable {
        static { TerminalMouseWheelZoomContribution_1 = this; }
        static { this.ID = 'terminal.mouseWheelZoom'; }
        static get(instance) {
            return instance.getContribution(TerminalMouseWheelZoomContribution_1.ID);
        }
        constructor(instance, processManager, widgetManager, _configurationService) {
            super();
            this._configurationService = _configurationService;
            this._listener = this._register(new lifecycle_1.MutableDisposable());
        }
        xtermOpen(xterm) {
            this._register(event_1.Event.runAndSubscribe(this._configurationService.onDidChangeConfiguration, e => {
                if (!e || e.affectsConfiguration("terminal.integrated.mouseWheelZoom" /* TerminalSettingId.MouseWheelZoom */)) {
                    if (!!this._configurationService.getValue("terminal.integrated.mouseWheelZoom" /* TerminalSettingId.MouseWheelZoom */)) {
                        this._setupMouseWheelZoomListener(xterm.raw);
                    }
                    else {
                        this._listener.clear();
                    }
                }
            }));
        }
        _getConfigFontSize() {
            return this._configurationService.getValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */);
        }
        _setupMouseWheelZoomListener(raw) {
            // This is essentially a copy of what we do in the editor, just we modify font size directly
            // as there is no separate zoom level concept in the terminal
            const classifier = scrollableElement_1.MouseWheelClassifier.INSTANCE;
            let prevMouseWheelTime = 0;
            let gestureStartFontSize = this._getConfigFontSize();
            let gestureHasZoomModifiers = false;
            let gestureAccumulatedDelta = 0;
            raw.attachCustomWheelEventHandler((e) => {
                const browserEvent = e;
                if (classifier.isPhysicalMouseWheel()) {
                    if (this._hasMouseWheelZoomModifiers(browserEvent)) {
                        const delta = browserEvent.deltaY > 0 ? -1 : 1;
                        this._configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, this._getConfigFontSize() + delta);
                        // EditorZoom.setZoomLevel(zoomLevel + delta);
                        browserEvent.preventDefault();
                        browserEvent.stopPropagation();
                        return false;
                    }
                }
                else {
                    // we consider mousewheel events that occur within 50ms of each other to be part of the same gesture
                    // we don't want to consider mouse wheel events where ctrl/cmd is pressed during the inertia phase
                    // we also want to accumulate deltaY values from the same gesture and use that to set the zoom level
                    if (Date.now() - prevMouseWheelTime > 50) {
                        // reset if more than 50ms have passed
                        gestureStartFontSize = this._getConfigFontSize();
                        gestureHasZoomModifiers = this._hasMouseWheelZoomModifiers(browserEvent);
                        gestureAccumulatedDelta = 0;
                    }
                    prevMouseWheelTime = Date.now();
                    gestureAccumulatedDelta += browserEvent.deltaY;
                    if (gestureHasZoomModifiers) {
                        const deltaAbs = Math.ceil(Math.abs(gestureAccumulatedDelta / 5));
                        const deltaDirection = gestureAccumulatedDelta > 0 ? -1 : 1;
                        const delta = deltaAbs * deltaDirection;
                        this._configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, gestureStartFontSize + delta);
                        gestureAccumulatedDelta += browserEvent.deltaY;
                        browserEvent.preventDefault();
                        browserEvent.stopPropagation();
                        return false;
                    }
                }
                return true;
            });
            this._listener.value = (0, lifecycle_1.toDisposable)(() => raw.attachCustomWheelEventHandler(() => true));
        }
        _hasMouseWheelZoomModifiers(browserEvent) {
            return (platform_1.isMacintosh
                // on macOS we support cmd + two fingers scroll (`metaKey` set)
                // and also the two fingers pinch gesture (`ctrKey` set)
                ? ((browserEvent.metaKey || browserEvent.ctrlKey) && !browserEvent.shiftKey && !browserEvent.altKey)
                : (browserEvent.ctrlKey && !browserEvent.metaKey && !browserEvent.shiftKey && !browserEvent.altKey));
        }
    };
    TerminalMouseWheelZoomContribution = TerminalMouseWheelZoomContribution_1 = __decorate([
        __param(3, configuration_1.IConfigurationService)
    ], TerminalMouseWheelZoomContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalMouseWheelZoomContribution.ID, TerminalMouseWheelZoomContribution, true);
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.fontZoomIn" /* TerminalCommandId.FontZoomIn */,
        title: (0, nls_1.localize2)('fontZoomIn', 'Increase Font Size'),
        run: async (c, accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const value = configurationService.getValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */);
            if ((0, types_1.isNumber)(value)) {
                await configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, value + 1);
            }
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.fontZoomOut" /* TerminalCommandId.FontZoomOut */,
        title: (0, nls_1.localize2)('fontZoomOut', 'Decrease Font Size'),
        run: async (c, accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const value = configurationService.getValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */);
            if ((0, types_1.isNumber)(value)) {
                await configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, value - 1);
            }
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.fontZoomReset" /* TerminalCommandId.FontZoomReset */,
        title: (0, nls_1.localize2)('fontZoomReset', 'Reset Font Size'),
        run: async (c, accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            await configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, terminalConfiguration_1.defaultTerminalFontSize);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuem9vbS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvem9vbS9icm93c2VyL3Rlcm1pbmFsLnpvb20uY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CaEcsSUFBTSxrQ0FBa0MsR0FBeEMsTUFBTSxrQ0FBbUMsU0FBUSxzQkFBVTs7aUJBQzFDLE9BQUUsR0FBRyx5QkFBeUIsQUFBNUIsQ0FBNkI7UUFRL0MsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUF1RDtZQUNqRSxPQUFPLFFBQVEsQ0FBQyxlQUFlLENBQXFDLG9DQUFrQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVHLENBQUM7UUFJRCxZQUNDLFFBQXVELEVBQ3ZELGNBQThELEVBQzlELGFBQW9DLEVBQ2IscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBRmdDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFOcEUsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7UUFTckUsQ0FBQztRQUVELFNBQVMsQ0FBQyxLQUFpRDtZQUMxRCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUM3RixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsNkVBQWtDLEVBQUUsQ0FBQztvQkFDcEUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsNkVBQWtDLEVBQUUsQ0FBQzt3QkFDN0UsSUFBSSxDQUFDLDRC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