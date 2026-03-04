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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/keyboardLayout/common/keyboardLayout", "vs/base/common/event", "vs/base/common/platform", "vs/platform/keyboardLayout/common/keyboardMapper", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/workbench/services/keybinding/common/fallbackKeyboardMapper", "vs/workbench/services/keybinding/common/macLinuxKeyboardMapper", "vs/platform/keyboardLayout/common/keyboardConfig", "vs/platform/configuration/common/configuration", "vs/workbench/services/keybinding/electron-sandbox/nativeKeyboardLayoutService", "vs/platform/instantiation/common/extensions"], function (require, exports, lifecycle_1, keyboardLayout_1, event_1, platform_1, keyboardMapper_1, windowsKeyboardMapper_1, fallbackKeyboardMapper_1, macLinuxKeyboardMapper_1, keyboardConfig_1, configuration_1, nativeKeyboardLayoutService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutService = void 0;
    let KeyboardLayoutService = class KeyboardLayoutService extends lifecycle_1.Disposable {
        constructor(_nativeKeyboardLayoutService, _configurationService) {
            super();
            this._nativeKeyboardLayoutService = _nativeKeyboardLayoutService;
            this._configurationService = _configurationService;
            this._onDidChangeKeyboardLayout = this._register(new event_1.Emitter());
            this.onDidChangeKeyboardLayout = this._onDidChangeKeyboardLayout.event;
            this._keyboardMapper = null;
            this._register(this._nativeKeyboardLayoutService.onDidChangeKeyboardLayout(async () => {
                this._keyboardMapper = null;
                this._onDidChangeKeyboardLayout.fire();
            }));
            this._register(_configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration('keyboard')) {
                    this._keyboardMapper = null;
                    this._onDidChangeKeyboardLayout.fire();
                }
            }));
        }
        getRawKeyboardMapping() {
            return this._nativeKeyboardLayoutService.getRawKeyboardMapping();
        }
        getCurrentKeyboardLayout() {
            return this._nativeKeyboardLayoutService.getCurrentKeyboardLayout();
        }
        getAllKeyboardLayouts() {
            return [];
        }
        getKeyboardMapper() {
            const config = (0, keyboardConfig_1.readKeyboardConfig)(this._configurationService);
            if (config.dispatch === 1 /* DispatchConfig.KeyCode */) {
                // Forcefully set to use keyCode
                return new fallbackKeyboardMapper_1.FallbackKeyboardMapper(config.mapAltGrToCtrlAlt, platform_1.OS);
            }
            if (!this._keyboardMapper) {
                this._keyboardMapper = new keyboardMapper_1.CachedKeyboardMapper(createKeyboardMapper(this.getCurrentKeyboardLayout(), this.getRawKeyboardMapping(), config.mapAltGrToCtrlAlt));
            }
            return this._keyboardMapper;
        }
        validateCurrentKeyboardMapping(keyboardEvent) {
            return;
        }
    };
    exports.KeyboardLayoutService = KeyboardLayoutService;
    exports.KeyboardLayoutService = KeyboardLayoutService = __decorate([
        __param(0, nativeKeyboardLayoutService_1.INativeKeyboardLayoutService),
        __param(1, configuration_1.IConfigurationService)
    ], KeyboardLayoutService);
    function createKeyboardMapper(layoutInfo, rawMapping, mapAltGrToCtrlAlt) {
        const _isUSStandard = isUSStandard(layoutInfo);
        if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
            return new windowsKeyboardMapper_1.WindowsKeyboardMapper(_isUSStandard, rawMapping, mapAltGrToCtrlAlt);
        }
        if (!rawMapping || Object.keys(rawMapping).length === 0) {
            // Looks like reading the mappings failed (most likely Mac + Japanese/Chinese keyboard layouts)
            return new fallbackKeyboardMapper_1.FallbackKeyboardMapper(mapAltGrToCtrlAlt, platform_1.OS);
        }
        if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
            const kbInfo = layoutInfo;
            if (kbInfo.id === 'com.apple.keylayout.DVORAK-QWERTYCMD') {
                // Use keyCode based dispatching for DVORAK - QWERTY ⌘
                return new fallbackKeyboardMapper_1.FallbackKeyboardMapper(mapAltGrToCtrlAlt, platform_1.OS);
            }
        }
        return new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(_isUSStandard, rawMapping, mapAltGrToCtrlAlt, platform_1.OS);
    }
    function isUSStandard(_kbInfo) {
        if (!_kbInfo) {
            return false;
        }
        if (platform_1.OS === 3 /* OperatingSystem.Linux */) {
            const kbInfo = _kbInfo;
            const layouts = kbInfo.layout.split(/,/g);
            return (layouts[kbInfo.group] === 'us');
        }
        if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
            const kbInfo = _kbInfo;
            return (kbInfo.id === 'com.apple.keylayout.US');
        }
        if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
            const kbInfo = _kbInfo;
            return (kbInfo.name === '00000409');
        }
        return false;
    }
    (0, extensions_1.registerSingleton)(keyboardLayout_1.IKeyboardLayoutService, KeyboardLayoutService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlS2V5Ym9hcmRMYXlvdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy9lbGVjdHJvbi1zYW5kYm94L25hdGl2ZUtleWJvYXJkTGF5b3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBVTtRQVNwRCxZQUMrQiw0QkFBMkUsRUFDbEYscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBSHVDLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBOEI7WUFDakUsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQVBwRSwrQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN6RSw4QkFBeUIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBUzFFLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBRTVCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLHlCQUF5QixDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNyRixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDNUIsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDekUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxDQUFD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