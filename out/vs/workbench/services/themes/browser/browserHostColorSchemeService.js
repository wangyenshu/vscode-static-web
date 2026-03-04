/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/browser/browser", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/themes/common/hostColorSchemeService", "vs/base/browser/window"], function (require, exports, event_1, browser_1, extensions_1, lifecycle_1, hostColorSchemeService_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserHostColorSchemeService = void 0;
    class BrowserHostColorSchemeService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidSchemeChangeEvent = this._register(new event_1.Emitter());
            this.registerListeners();
        }
        registerListeners() {
            (0, browser_1.addMatchMediaChangeListener)(window_1.mainWindow, '(prefers-color-scheme: dark)', () => {
                this._onDidSchemeChangeEvent.fire();
            });
            (0, browser_1.addMatchMediaChangeListener)(window_1.mainWindow, '(forced-colors: active)', () => {
                this._onDidSchemeChangeEvent.fire();
            });
        }
        get onDidChangeColorScheme() {
            return this._onDidSchemeChangeEvent.event;
        }
        get dark() {
            if (window_1.mainWindow.matchMedia(`(prefers-color-scheme: light)`).matches) {
                return false;
            }
            else if (window_1.mainWindow.matchMedia(`(prefers-color-scheme: dark)`).matches) {
                return true;
            }
            return false;
        }
        get highContrast() {
            if (window_1.mainWindow.matchMedia(`(forced-colors: active)`).matches) {
                return true;
            }
            return false;
        }
    }
    exports.BrowserHostColorSchemeService = BrowserHostColorSchemeService;
    (0, extensions_1.registerSingleton)(hostColorSchemeService_1.IHostColorSchemeService, BrowserHostColorSchemeService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlckhvc3RDb2xvclNjaGVtZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2Jyb3dzZXIvYnJvd3Nlckhvc3RDb2xvclNjaGVtZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsNkJBQThCLFNBQVEsc0JBQVU7UUFNNUQ7WUFFQyxLQUFLLEVBQUUsQ0FBQztZQUpRLDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBTTlFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFFeEIsSUFBQSxxQ0FBMkIsRUFBQyxtQkFBVSxFQUFFLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtnQkFDNUUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBQSxxQ0FBMkIsRUFBQyxtQkFBVSxFQUFFLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtnQkFDdkUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQUksc0JBQXNCO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztRQUMzQyxDQUFDO1FBRUQsSUFBSSxJQUFJO1lBQ1AsSUFBSSxtQkFBVSxDQUFDLFVBQVUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwRSxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7aUJBQU0sSUFBSSxtQkFBVSxDQUFDLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMxRSxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLFlBQVk7WUFDZixJQUFJLG1CQUFVLENBQUMsVUFBVSxDQUFDLHlCQUF5QixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzlELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztLQUVEO0lBM0NELHNFQTJDQztJQUVELElBQUEsOEJBQWlCLEVBQUMsZ0RBQXVCLEVBQUUsNkJBQTZCLG9DQUE0QixDQUFDIn0=