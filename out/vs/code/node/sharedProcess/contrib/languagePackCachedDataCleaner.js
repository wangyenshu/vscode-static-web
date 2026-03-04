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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/product/common/productService"], function (require, exports, async_1, errors_1, lifecycle_1, path_1, pfs_1, environment_1, log_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagePackCachedDataCleaner = void 0;
    let LanguagePackCachedDataCleaner = class LanguagePackCachedDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService, logService, productService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.productService = productService;
            this._DataMaxAge = this.productService.quality !== 'stable'
                ? 1000 * 60 * 60 * 24 * 7 // roughly 1 week (insiders)
                : 1000 * 60 * 60 * 24 * 30 * 3; // roughly 3 months (stable)
            // We have no Language pack support for dev version (run from source)
            // So only cleanup when we have a build version.
            if (this.environmentService.isBuilt) {
                const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                    this.cleanUpLanguagePackCache();
                }, 40 * 1000 /* after 40s */));
                scheduler.schedule();
            }
        }
        async cleanUpLanguagePackCache() {
            this.logService.trace('[language pack cache cleanup]: Starting to clean up unused language packs.');
            try {
                const installed = Object.create(null);
                const metaData = JSON.parse(await pfs_1.Promises.readFile((0, path_1.join)(this.environmentService.userDataPath, 'languagepacks.json'), 'utf8'));
                for (const locale of Object.keys(metaData)) {
                    const entry = metaData[locale];
                    installed[`${entry.hash}.${locale}`] = true;
                }
                // Cleanup entries for language packs that aren't installed anymore
                const cacheDir = (0, path_1.join)(this.environmentService.userDataPath, 'clp');
                const cacheDirExists = await pfs_1.Promises.exists(cacheDir);
                if (!cacheDirExists) {
                    return;
                }
                const entries = await pfs_1.Promises.readdir(cacheDir);
                for (const entry of entries) {
                    if (installed[entry]) {
                        this.logService.trace(`[language pack cache cleanup]: Skipping folder ${entry}. Language pack still in use.`);
                        continue;
                    }
                    this.logService.trace(`[language pack cache cleanup]: Removing unused language pack: ${entry}`);
                    await pfs_1.Promises.rm((0, path_1.join)(cacheDir, entry));
                }
                const now = Date.now();
                for (const packEntry of Object.keys(installed)) {
                    const folder = (0, path_1.join)(cacheDir, packEntry);
                    const entries = await pfs_1.Promises.readdir(folder);
                    for (const entry of entries) {
                        if (entry === 'tcf.json') {
                            continue;
                        }
                        const candidate = (0, path_1.join)(folder, entry);
                        const stat = await pfs_1.Promises.stat(candidate);
                        if (stat.isDirectory() && (now - stat.mtime.getTime()) > this._DataMaxAge) {
                            this.logService.trace(`[language pack cache cleanup]: Removing language pack cache folder: ${(0, path_1.join)(packEntry, entry)}`);
                            await pfs_1.Promises.rm(candidate);
                        }
                    }
                }
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    exports.LanguagePackCachedDataCleaner = LanguagePackCachedDataCleaner;
    exports.LanguagePackCachedDataCleaner = LanguagePackCachedDataCleaner = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, productService_1.IProductService)
    ], LanguagePackCachedDataCleaner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VQYWNrQ2FjaGVkRGF0YUNsZWFuZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jb2RlL25vZGUvc2hhcmVkUHJvY2Vzcy9jb250cmliL2xhbmd1YWdlUGFja0NhY2hlZERhdGFDbGVhbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZCekYsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBOEIsU0FBUSxzQkFBVTtRQU01RCxZQUM0QixrQkFBOEQsRUFDNUUsVUFBd0MsRUFDcEMsY0FBZ0Q7WUFFakUsS0FBSyxFQUFFLENBQUM7WUFKb0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUEyQjtZQUMzRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ25CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQVBqRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxLQUFLLFFBQVE7Z0JBQ3RFLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFHLDRCQUE0QjtnQkFDeEQsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsNEJBQTRCO1lBUzVELHFFQUFxRTtZQUNyRSxnREFBZ0Q7WUFDaEQsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUU7b0JBQzFELElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2dCQUNqQyxDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMs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