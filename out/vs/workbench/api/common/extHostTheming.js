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
define(["require", "exports", "./extHostTypes", "vs/workbench/api/common/extHostRpcService", "vs/base/common/event"], function (require, exports, extHostTypes_1, extHostRpcService_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTheming = void 0;
    let ExtHostTheming = class ExtHostTheming {
        constructor(_extHostRpc) {
            this._actual = new extHostTypes_1.ColorTheme(extHostTypes_1.ColorThemeKind.Dark);
            this._onDidChangeActiveColorTheme = new event_1.Emitter();
        }
        get activeColorTheme() {
            return this._actual;
        }
        $onColorThemeChange(type) {
            let kind;
            switch (type) {
                case 'light':
                    kind = extHostTypes_1.ColorThemeKind.Light;
                    break;
                case 'hcDark':
                    kind = extHostTypes_1.ColorThemeKind.HighContrast;
                    break;
                case 'hcLight':
                    kind = extHostTypes_1.ColorThemeKind.HighContrastLight;
                    break;
                default:
                    kind = extHostTypes_1.ColorThemeKind.Dark;
            }
            this._actual = new extHostTypes_1.ColorTheme(kind);
            this._onDidChangeActiveColorTheme.fire(this._actual);
        }
        get onDidChangeActiveColorTheme() {
            return this._onDidChangeActiveColorTheme.event;
        }
    };
    exports.ExtHostTheming = ExtHostTheming;
    exports.ExtHostTheming = ExtHostTheming = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostTheming);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRoZW1pbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VGhlbWluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFPekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBYztRQU8xQixZQUNxQixXQUErQjtZQUVuRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUkseUJBQVUsQ0FBQyw2QkFBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLGVBQU8sRUFBYyxDQUFDO1FBQy9ELENBQUM7UUFFRCxJQUFXLGdCQUFnQjtZQUMxQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVELG1CQUFtQixDQUFDLElBQVk7WUFDL0IsSUFBSSxJQUFJLENBQUM7WUFDVCxRQUFRLElBQUksRUFBRSxDQUFDO2dCQUNkLEtBQUssT0FBTztvQkFBRSxJQUFJLEdBQUcsNkJBQWMsQ0FBQyxLQUFLLENBQUM7b0JBQUMsTUFBTTtnQkFDakQsS0FBSyxRQUFRO29CQUFFLElBQUksR0FBRyw2QkFBYyxDQUFDLFlBQVksQ0FBQztvQkFBQyxNQUFNO2dCQUN6RCxLQUFLLFNBQVM7b0JBQUUsSUFBSSxHQUFHLDZCQUFjLENBQUMsaUJBQWlCLENBQUM7b0JBQUMsTUFBTTtnQkFDL0Q7b0JBQ0MsSUFBSSxHQUFHLDZCQUFjLENBQUMsSUFBSSxDQUFDO1lBQzdCLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUkseUJBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsSUFBVywyQkFBMkI7WUFDckMsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDO1FBQ2hELENBQUM7S0FDRCxDQUFBO0lBbENZLHdDQUFjOzZCQUFkLGNBQWM7UUFReEIsV0FBQSxzQ0FBa0IsQ0FBQTtPQVJSLGNBQWMsQ0FrQzFCIn0=