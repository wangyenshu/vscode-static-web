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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, event_1, lifecycle_1, editorOptions_1, configuration_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalConfigurationService = void 0;
    // #region TerminalConfigurationService
    let TerminalConfigurationService = class TerminalConfigurationService extends lifecycle_1.Disposable {
        get config() { return this._config; }
        get onConfigChanged() { return this._onConfigChanged.event; }
        constructor(_configurationService) {
            super();
            this._configurationService = _configurationService;
            this._onConfigChanged = new event_1.Emitter();
            this._fontMetrics = this._register(new TerminalFontMetrics(this, _configurationService));
            this._register(event_1.Event.runAndSubscribe(this._configurationService.onDidChangeConfiguration, e => {
                if (!e || e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                    this._updateConfig();
                }
            }));
        }
        setPanelContainer(panelContainer) { return this._fontMetrics.setPanelContainer(panelContainer); }
        configFontIsMonospace() { return this._fontMetrics.configFontIsMonospace(); }
        getFont(w, xtermCore, excludeDimensions) { return this._fontMetrics.getFont(w, xtermCore, excludeDimensions); }
        _updateConfig() {
            const configValues = { ...this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION) };
            configValues.fontWeight = this._normalizeFontWeight(configValues.fontWeight, terminal_1.DEFAULT_FONT_WEIGHT);
            configValues.fontWeightBold = this._normalizeFontWeight(configValues.fontWeightBold, terminal_1.DEFAULT_BOLD_FONT_WEIGHT);
            this._config = configValues;
            this._onConfigChanged.fire();
        }
        _normalizeFontWeight(input, defaultWeight) {
            if (input === 'normal' || input === 'bold') {
                return input;
            }
            return clampInt(input, terminal_1.MINIMUM_FONT_WEIGHT, terminal_1.MAXIMUM_FONT_WEIGHT, defaultWeight);
        }
    };
    exports.TerminalConfigurationService = TerminalConfigurationService;
    exports.TerminalConfigurationService = TerminalConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TerminalConfigurationService);
    // #endregion TerminalConfigurationService
    // #region TerminalFontMetrics
    var FontConstants;
    (function (FontConstants) {
        FontConstants[FontConstants["MinimumFontSize"] = 6] = "MinimumFontSize";
        FontConstants[FontConstants["MaximumFontSize"] = 100] = "MaximumFontSize";
    })(FontConstants || (FontConstants = {}));
    class TerminalFontMetrics extends lifecycle_1.Disposable {
        constructor(_terminalConfigurationService, _configurationService) {
            super();
            this._terminalConfigurationService = _terminalConfigurationService;
            this._configurationService = _configurationService;
            this.linuxDistro = 1 /* LinuxDistro.Unknown */;
            this._register((0, lifecycle_1.toDisposable)(() => this._charMeasureElement?.remove()));
        }
        setPanelContainer(panelContainer) {
            this._panelContainer = panelContainer;
        }
        configFontIsMonospace() {
            const fontSize = 15;
            const fontFamily = this._terminalConfigurationService.config.fontFamily || this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            const iRect = this._getBoundingRectFor('i', fontFamily, fontSize);
            const wRect = this._getBoundingRectFor('w', fontFamily, fontSize);
            // Check for invalid bounds, there is no reason to believe the font is not monospace
            if (!iRect || !wRect || !iRect.width || !wRect.width) {
                return true;
            }
            return iRect.width === wRect.width;
        }
        /**
         * Gets the font information based on the terminal.integrated.fontFamily
         * terminal.integrated.fontSize, terminal.integrated.lineHeight configuration properties
         */
        getFont(w, xtermCore, excludeDimensions) {
            const editorConfig = this._configurationService.getValue('editor');
            let fontFamily = this._terminalConfigurationService.config.fontFamily || editorConfig.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            let fontSize = clampInt(this._terminalConfigurationService.config.fontSize, 6 /* FontConstants.MinimumFontSize */, 100 /* FontConstants.MaximumFontSize */, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
            // Work around bad font on Fedora/Ubuntu
            if (!this._terminalConfigurationService.config.fontFamily) {
                if (this.linuxDistro === 2 /* LinuxDistro.Fedora */) {
                    fontFamily = '\'DejaVu Sans Mono\'';
                }
                if (this.linuxDistro === 3 /* LinuxDistro.Ubuntu */) {
                    fontFamily = '\'Ubuntu Mono\'';
                    // Ubuntu mono is somehow smaller, so set fontSize a bit larger to get the same perceived size.
                    fontSize = clampInt(fontSize + 2, 6 /* FontConstants.MinimumFontSize */, 100 /* FontConstants.MaximumFontSize */, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
                }
            }
            // Always fallback to monospace, otherwise a proportional font may become the default
            fontFamily += ', monospace';
            const letterSpacing = this._terminalConfigurationService.config.letterSpacing ? Math.max(Math.floor(this._terminalConfigurationService.config.letterSpacing), terminal_1.MINIMUM_LETTER_SPACING) : terminal_1.DEFAULT_LETTER_SPACING;
            const lineHeight = this._terminalConfigurationService.config.lineHeight ? Math.max(this._terminalConfigurationService.config.lineHeight, 1) : terminal_1.DEFAULT_LINE_HEIGHT;
            if (excludeDimensions) {
                return {
                    fontFamily,
                    fontSize,
                    letterSpacing,
                    lineHeight
                };
            }
            // Get the character dimensions from xterm if it's available
            if (xtermCore?._renderService?._renderer.value) {
                const cellDims = xtermCore._renderService.dimensions.css.cell;
                if (cellDims?.width && cellDims?.height) {
                    return {
                        fontFamily,
                        fontSize,
                        letterSpacing,
                        lineHeight,
                        charHeight: cellDims.height / lineHeight,
                        charWidth: cellDims.width - Math.round(letterSpacing) / w.devicePixelRatio
                    };
                }
            }
            // Fall back to measuring the font ourselves
            return this._measureFont(w, fontFamily, fontSize, letterSpacing, lineHeight);
        }
        _createCharMeasureElementIfNecessary() {
            if (!this._panelContainer) {
                throw new Error('Cannot measure element when terminal is not attached');
            }
            // Create charMeasureElement if it hasn't been created or if it was orphaned by its parent
            if (!this._charMeasureElement || !this._charMeasureElement.parentElement) {
                this._charMeasureElement = document.createElement('div');
                this._panelContainer.appendChild(this._charMeasureElement);
            }
            return this._charMeasureElement;
        }
        _getBoundingRectFor(char, fontFamily, fontSize) {
            let charMeasureElement;
            try {
                charMeasureElement = this._createCharMeasureElementIfNecessary();
            }
            catch {
                return undefined;
            }
            const style = charMeasureElement.style;
            style.display = 'inline-block';
            style.fontFamily = fontFamily;
            style.fontSize = fontSize + 'px';
            style.lineHeight = 'normal';
            charMeasureElement.innerText = char;
            const rect = charMeasureElement.getBoundingClientRect();
            style.display = 'none';
            return rect;
        }
        _measureFont(w, fontFamily, fontSize, letterSpacing, lineHeight) {
            const rect = this._getBoundingRectFor('X', fontFamily, fontSize);
            // Bounding client rect was invalid, use last font measurement if available.
            if (this._lastFontMeasurement && (!rect || !rect.width || !rect.height)) {
                return this._lastFontMeasurement;
            }
            this._lastFontMeasurement = {
                fontFamily,
                fontSize,
                letterSpacing,
                lineHeight,
                charWidth: 0,
                charHeight: 0
            };
            if (rect && rect.width && rect.height) {
                this._lastFontMeasurement.charHeight = Math.ceil(rect.height);
                // Char width is calculated differently for DOM and the other renderer types. Refer to
                // how each renderer updates their dimensions in xterm.js
                if (this._terminalConfigurationService.config.gpuAcceleration === 'off') {
                    this._lastFontMeasurement.charWidth = rect.width;
                }
                else {
                    const deviceCharWidth = Math.floor(rect.width * w.devicePixelRatio);
                    const deviceCellWidth = deviceCharWidth + Math.round(letterSpacing);
                    const cssCellWidth = deviceCellWidth / w.devicePixelRatio;
                    this._lastFontMeasurement.charWidth = cssCellWidth - Math.round(letterSpacing) / w.devicePixelRatio;
                }
            }
            return this._lastFontMeasurement;
        }
    }
    // #endregion TerminalFontMetrics
    // #region Utils
    function clampInt(source, minimum, maximum, fallback) {
        let r = parseInt(source, 10);
        if (isNaN(r)) {
            return fallback;
        }
        if (typeof minimum === 'number') {
            r = Math.max(minimum, r);
        }
        if (typeof maximum === 'number') {
            r = Math.min(maximum, r);
        }
        return r;
    }
});
// #endregion Utils
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb25maWd1cmF0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxDb25maWd1cmF0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsdUNBQXVDO0lBRWhDLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsc0JBQVU7UUFNM0QsSUFBSSxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUdyQyxJQUFJLGVBQWUsS0FBa0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUUxRSxZQUN3QixxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFGZ0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUpwRSxxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBUXZELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFFekYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDN0YsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsa0NBQXVCLENBQUMsRUFBRSxDQUFDO29CQUMzRCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3RCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztR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