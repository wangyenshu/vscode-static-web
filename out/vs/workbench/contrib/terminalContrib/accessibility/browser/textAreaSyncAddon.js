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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/terminal/common/terminal"], function (require, exports, decorators_1, event_1, lifecycle_1, accessibility_1, configuration_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextAreaSyncAddon = void 0;
    let TextAreaSyncAddon = class TextAreaSyncAddon extends lifecycle_1.Disposable {
        activate(terminal) {
            this._terminal = terminal;
            this._refreshListeners();
        }
        constructor(_capabilities, _accessibilityService, _configurationService, _logService) {
            super();
            this._capabilities = _capabilities;
            this._accessibilityService = _accessibilityService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._listeners = this._register(new lifecycle_1.MutableDisposable());
            this._register(event_1.Event.runAndSubscribe(event_1.Event.any(this._capabilities.onDidAddCapability, this._capabilities.onDidRemoveCapability, this._accessibilityService.onDidChangeScreenReaderOptimized), () => {
                this._refreshListeners();
            }));
        }
        _refreshListeners() {
            const commandDetection = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (this._shouldBeActive() && commandDetection) {
                if (!this._listeners.value) {
                    const textarea = this._terminal?.textarea;
                    if (textarea) {
                        this._listeners.value = event_1.Event.runAndSubscribe(commandDetection.promptInputModel.onDidChangeInput, () => this._sync(textarea));
                    }
                }
            }
            else {
                this._listeners.clear();
            }
        }
        _shouldBeActive() {
            return this._accessibilityService.isScreenReaderOptimized() || this._configurationService.getValue("terminal.integrated.developer.devMode" /* TerminalSettingId.DevMode */);
        }
        _sync(textArea) {
            const commandCapability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (!commandCapability) {
                return;
            }
            textArea.value = commandCapability.promptInputModel.value;
            textArea.selectionStart = commandCapability.promptInputModel.cursorIndex;
            textArea.selectionEnd = commandCapability.promptInputModel.cursorIndex;
            this._logService.debug(`TextAreaSyncAddon#sync: text changed to "${textArea.value}"`);
        }
    };
    exports.TextAreaSyncAddon = TextAreaSyncAddon;
    __decorate([
        (0, decorators_1.debounce)(50)
    ], TextAreaSyncAddon.prototype, "_sync", null);
    exports.TextAreaSyncAddon = TextAreaSyncAddon = __decorate([
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, terminal_1.ITerminalLogService)
    ], TextAreaSyncAddon);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFTeW5jQWRkb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvYWNjZXNzaWJpbGl0eS9icm93c2VyL3RleHRBcmVhU3luY0FkZG9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFVO1FBSWhELFFBQVEsQ0FBQyxRQUFrQjtZQUMxQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRUQsWUFDa0IsYUFBdUMsRUFDakMscUJBQTZELEVBQzdELHFCQUE2RCxFQUMvRCxXQUFpRDtZQUV0RSxLQUFLLEVBQUUsQ0FBQztZQUxTLGtCQUFhLEdBQWIsYUFBYSxDQUEwQjtZQUNoQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO1lBWHRELGVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBZXJFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUM3QyxJQUFJLENBQUMsYUFBYSxDQUFDLGtCQUFrQixFQUNyQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUN4QyxJQUFJLENBQUMscUJBQXFCLENBQUMsZ0NBQWdDLENBQzNELEVBQUUsR0FBRyxFQUFFO2dCQUNQLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLDZDQUFxQyxDQUFDO1lBQ3JGLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM1QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQztvQkFDMUMsSUFBSSxRQUFRLEVBQUUsQ0FBQzt3QkFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxhQUFLLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDL0gsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFTyxlQUFlO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLHVCQUF1QixFQUFFLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEseUVBQTJCLENBQUM7UUFDL0gsQ0FBQztRQUdPLEtBQUssQ0FBQyxRQUE2QjtZQUMxQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyw2Q0FBcUMsQ0FBQztZQUN0RixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFFRCxRQUFRLENBQUMsS0FBSyxHQUFHLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUMxRCxRQUFRLENBQUMsY0FBYyxHQUFHLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQztZQUN6RSxRQUFRLENBQUMsWUFBWSxHQUFHLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQztZQUV2RSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsUUFBUSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDdkYsQ0FBQztLQUNELENBQUE7SUF6RFksOENBQWlCO0lBNkNyQjtRQURQLElBQUEscUJBQVEsRUFBQyxFQUFFLENBQUM7a0RBWVo7Z0NBeERXLGlCQUFpQjtRQVczQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4QkFBbUIsQ0FBQTtPQWJULGlCQUFpQixDQXlEN0IifQ==