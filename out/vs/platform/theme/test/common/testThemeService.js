/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/base/common/event", "vs/platform/theme/common/theme"], function (require, exports, color_1, event_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestThemeService = exports.TestColorTheme = void 0;
    class TestColorTheme {
        constructor(colors = {}, type = theme_1.ColorScheme.DARK, semanticHighlighting = false) {
            this.colors = colors;
            this.type = type;
            this.semanticHighlighting = semanticHighlighting;
            this.label = 'test';
        }
        getColor(color, useDefault) {
            const value = this.colors[color];
            if (value) {
                return color_1.Color.fromHex(value);
            }
            return undefined;
        }
        defines(color) {
            throw new Error('Method not implemented.');
        }
        getTokenStyleMetadata(type, modifiers, modelLanguage) {
            return undefined;
        }
        get tokenColorMap() {
            return [];
        }
    }
    exports.TestColorTheme = TestColorTheme;
    class TestFileIconTheme {
        constructor() {
            this.hasFileIcons = false;
            this.hasFolderIcons = false;
            this.hidesExplorerArrows = false;
        }
    }
    class UnthemedProductIconTheme {
        getIcon(contribution) {
            return undefined;
        }
    }
    class TestThemeService {
        constructor(theme = new TestColorTheme(), fileIconTheme = new TestFileIconTheme(), productIconTheme = new UnthemedProductIconTheme()) {
            this._onThemeChange = new event_1.Emitter();
            this._onFileIconThemeChange = new event_1.Emitter();
            this._onProductIconThemeChange = new event_1.Emitter();
            this._colorTheme = theme;
            this._fileIconTheme = fileIconTheme;
            this._productIconTheme = productIconTheme;
        }
        getColorTheme() {
            return this._colorTheme;
        }
        setTheme(theme) {
            this._colorTheme = theme;
            this.fireThemeChange();
        }
        fireThemeChange() {
            this._onThemeChange.fire(this._colorTheme);
        }
        get onDidColorThemeChange() {
            return this._onThemeChange.event;
        }
        getFileIconTheme() {
            return this._fileIconTheme;
        }
        get onDidFileIconThemeChange() {
            return this._onFileIconThemeChange.event;
        }
        getProductIconTheme() {
            return this._productIconTheme;
        }
        get onDidProductIconThemeChange() {
            return this._onProductIconThemeChange.event;
        }
    }
    exports.TestThemeService = TestThemeService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFRoZW1lU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RoZW1lL3Rlc3QvY29tbW9uL3Rlc3RUaGVtZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsY0FBYztRQUkxQixZQUNTLFNBQStDLEVBQUUsRUFDbEQsT0FBTyxtQkFBVyxDQUFDLElBQUksRUFDZCx1QkFBdUIsS0FBSztZQUZwQyxXQUFNLEdBQU4sTUFBTSxDQUEyQztZQUNsRCxTQUFJLEdBQUosSUFBSSxDQUFtQjtZQUNkLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBUTtZQUw3QixVQUFLLEdBQUcsTUFBTSxDQUFDO1FBTTNCLENBQUM7UUFFTCxRQUFRLENBQUMsS0FBYSxFQUFFLFVBQW9CO1lBQzNDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakMsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxPQUFPLGFBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxPQUFPLENBQUMsS0FBYTtZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELHFCQUFxQixDQUFDLElBQVksRUFBRSxTQUFtQixFQUFFLGFBQXFCO1lBQzdFLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxJQUFJLGFBQWE7WUFDaEIsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO0tBQ0Q7SUE3QkQsd0NBNkJDO0lBRUQsTUFBTSxpQkFBaUI7UUFBdkI7WUFDQyxpQkFBWSxHQUFHLEtBQUssQ0FBQztZQUNyQixtQkFBYyxHQUFHLEtBQUssQ0FBQztZQUN2Qix3QkFBbUIsR0FBRyxLQUFLLENBQUM7UUFDN0IsQ0FBQztLQUFBO0lBRUQsTUFBTSx3QkFBd0I7UUFDN0IsT0FBTyxDQUFDLFlBQThCO1lBQ3JDLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQUVELE1BQWEsZ0JBQWdCO1FBVTVCLFlBQVksS0FBSyxHQUFHLElBQUksY0FBYyxFQUFFLEVBQUUsYUFBYSxHQUFHLElBQUksaUJBQWlCLEVBQUUsRUFBRSxnQkFBZ0IsR0FBRyxJQUFJLHdCQUF3QixFQUFFO1lBSnBJLG1CQUFjLEdBQUcsSUFBSSxlQUFPLEVBQWUsQ0FBQztZQUM1QywyQkFBc0IsR0FBRyxJQUFJLGVBQU8sRUFBa0IsQ0FBQztZQUN2RCw4QkFBeUIsR0FBRyxJQUFJLGVBQU8sRUFBcUIsQ0FBQztZQUc1RCxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUNwQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsZ0JBQWdCLENBQUM7UUFDM0MsQ0FBQztRQUVELGFBQWE7WUFDWixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVELFFBQVEsQ0FBQyxLQUFrQjtZQUMxQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVELGVBQWU7WUFDZCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELElBQVcscUJBQXFCO1lBQy9CLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7UUFDbEMsQ0FBQztRQUVELGdCQUFnQjtZQUNmLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUM1QixDQUFDO1FBRUQsSUFBVyx3QkFBd0I7WUFDbEMsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1FBQzFDLENBQUM7UUFFRCxtQkFBbUI7WUFDbEIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQVcsMkJBQTJCO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztRQUM3QyxDQUFDO0tBQ0Q7SUFoREQsNENBZ0RDIn0=