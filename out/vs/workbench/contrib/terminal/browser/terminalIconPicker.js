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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codiconsLibrary", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/userDataProfile/browser/iconSelectBox"], function (require, exports, dom_1, codiconsLibrary_1, lazy_1, lifecycle_1, hover_1, instantiation_1, defaultStyles_1, iconRegistry_1, iconSelectBox_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalIconPicker = void 0;
    const icons = new lazy_1.Lazy(() => {
        const iconDefinitions = (0, iconRegistry_1.getIconRegistry)().getIcons();
        const includedChars = new Set();
        const dedupedIcons = iconDefinitions.filter(e => {
            if (e.id === codiconsLibrary_1.codiconsLibrary.blank.id) {
                return false;
            }
            if (!('fontCharacter' in e.defaults)) {
                return false;
            }
            if (includedChars.has(e.defaults.fontCharacter)) {
                return false;
            }
            includedChars.add(e.defaults.fontCharacter);
            return true;
        });
        return dedupedIcons;
    });
    let TerminalIconPicker = class TerminalIconPicker extends lifecycle_1.Disposable {
        constructor(instantiationService, _hoverService) {
            super();
            this._hoverService = _hoverService;
            this._iconSelectBox = instantiationService.createInstance(iconSelectBox_1.WorkbenchIconSelectBox, {
                icons: icons.value,
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                showIconInfo: true
            });
        }
        async pickIcons() {
            const dimension = new dom_1.Dimension(486, 260);
            return new Promise(resolve => {
                this._register(this._iconSelectBox.onDidSelect(e => {
                    resolve(e);
                    this._iconSelectBox.dispose();
                }));
                this._iconSelectBox.clearInput();
                const hoverWidget = this._hoverService.showHover({
                    content: this._iconSelectBox.domNode,
                    target: (0, dom_1.getActiveDocument)().body,
                    position: {
                        hoverPosition: 2 /* HoverPosition.BELOW */,
                    },
                    persistence: {
                        sticky: true,
                    },
                    appearance: {
                        showPointer: true
                    }
                }, true);
                if (hoverWidget) {
                    this._register(hoverWidget);
                }
                this._iconSelectBox.layout(dimension);
                this._iconSelectBox.focus();
            });
        }
    };
    exports.TerminalIconPicker = TerminalIconPicker;
    exports.TerminalIconPicker = TerminalIconPicker = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, hover_1.IHoverService)
    ], TerminalIconPicker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJY29uUGlja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbEljb25QaWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLE1BQU0sS0FBSyxHQUFHLElBQUksV0FBSSxDQUFxQixHQUFHLEVBQUU7UUFDL0MsTUFBTSxlQUFlLEdBQUcsSUFBQSw4QkFBZSxHQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckQsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUN4QyxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQy9DLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxpQ0FBZSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsSUFBSSxDQUFDLENBQUMsZUFBZSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO2dCQUNqRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sWUFBWSxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDO0lBRUksSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQUdqRCxZQUN3QixvQkFBMkMsRUFDbEMsYUFBNEI7WUFFNUQsS0FBSyxFQUFFLENBQUM7WUFGd0Isa0JBQWEsR0FBYixhQUFhLENBQWU7WUFJNUQsSUFBSSxDQUFDLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsc0NBQXNCLEVBQUU7Z0JBQ2pGLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztnQkFDbEIsY0FBYyxFQUFFLHFDQUFxQjtnQkFDckMsWUFBWSxFQUFFLElBQUk7YUFDbEIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxTQUFTO1lBQ2QsTUFBTSxTQUFTLEdBQUcsSUFBSSxlQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sSUFBSSxPQUFPLENBQXdCLE9BQU8sQ0FBQyxFQUFFO2dCQUNuRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUNsRCxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ1gsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQztvQkFDaEQsT0FBTyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTztvQkFDcEMsTUFBTSxFQUFFLElBQUEsdUJBQWlCLEdBQUUsQ0FBQyxJQUFJO29CQUNoQyxRQUFRLEVBQUU7d0JBQ1QsYUFBYSw2QkFBcUI7cUJBQ2xDO29CQUNELFdBQVcsRUFBRTt3QkFDWixNQUFNLEVBQUUsSUFBSTtxQkFDWjtvQkFDRCxVQUFVLEVBQUU7d0JBQ1gsV0FBVyxFQUFFLElBQUk7cUJBQ2pCO2lCQUNELEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ1QsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztnQkFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM3QixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRCxDQUFBO0lBNUNZLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBSTVCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQkFBYSxDQUFBO09BTEgsa0JBQWtCLENBNEM5QiJ9