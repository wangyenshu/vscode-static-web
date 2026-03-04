/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/contributions", "vs/workbench/contrib/splash/browser/splash", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/splash/browser/partsSplash"], function (require, exports, contributions_1, splash_1, extensions_1, partsSplash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(splash_1.ISplashStorageService, class SplashStorageService {
        async saveWindowSplash(splash) {
            const raw = JSON.stringify(splash);
            localStorage.setItem('monaco-parts-splash', raw);
        }
    }, 1 /* InstantiationType.Delayed */);
    (0, contributions_1.registerWorkbenchContribution2)(partsSplash_1.PartsSplash.ID, partsSplash_1.PartsSplash, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BsYXNoLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NwbGFzaC9icm93c2VyL3NwbGFzaC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsSUFBQSw4QkFBaUIsRUFBQyw4QkFBcUIsRUFBRSxNQUFNLG9CQUFvQjtRQUdsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBb0I7WUFDMUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQyxZQUFZLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2xELENBQUM7S0FDRCxvQ0FBNEIsQ0FBQztJQUU5QixJQUFBLDhDQUE4QixFQUM3Qix5QkFBVyxDQUFDLEVBQUUsRUFDZCx5QkFBVyxzQ0FFWCxDQUFDIn0=