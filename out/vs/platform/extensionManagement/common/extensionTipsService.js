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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/base/common/async", "vs/base/common/event", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, arrays_1, lifecycle_1, resources_1, uri_1, files_1, productService_1, async_1, event_1, path_1, platform_1, process_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractNativeExtensionTipsService = exports.ExtensionTipsService = void 0;
    //#region Base Extension Tips Service
    let ExtensionTipsService = class ExtensionTipsService extends lifecycle_1.Disposable {
        constructor(fileService, productService) {
            super();
            this.fileService = fileService;
            this.productService = productService;
            this.allConfigBasedTips = new Map();
            if (this.productService.configBasedExtensionTips) {
                Object.entries(this.productService.configBasedExtensionTips).forEach(([, value]) => this.allConfigBasedTips.set(value.configPath, value));
            }
        }
        getConfigBasedTips(folder) {
            return this.getValidConfigBasedTips(folder);
        }
        async getImportantExecutableBasedTips() {
            return [];
        }
        async getOtherExecutableBasedTips() {
            return [];
        }
        async getValidConfigBasedTips(folder) {
            const result = [];
            for (const [configPath, tip] of this.allConfigBasedTips) {
                if (tip.configScheme && tip.configScheme !== folder.scheme) {
                    continue;
                }
                try {
                    const content = (await this.fileService.readFile((0, resources_1.joinPath)(folder, configPath))).value.toString();
                    for (const [key, value] of Object.entries(tip.recommendations)) {
                        if (!value.contentPattern || new RegExp(value.contentPattern, 'mig').test(content)) {
                            result.push({
                                extensionId: key,
                                extensionName: value.name,
                                configName: tip.configName,
                                important: !!value.important,
                                isExtensionPack: !!value.isExtensionPack,
                                whenNotInstalled: value.whenNotInstalled
                            });
                        }
                    }
                }
                catch (error) { /* Ignore */ }
            }
            return result;
        }
    };
    exports.ExtensionTipsService = ExtensionTipsService;
    exports.ExtensionTipsService = ExtensionTipsService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, productService_1.IProductService)
    ], ExtensionTipsService);
    const promptedExecutableTipsStorageKey = 'extensionTips/promptedExecutableTips';
    const lastPromptedMediumImpExeTimeStorageKey = 'extensionTips/lastPromptedMediumImpExeTime';
    class AbstractNativeExtensionTipsService extends ExtensionTipsService {
        constructor(userHome, windowEvents, telemetryService, extensionManagementService, storageService, extensionRecommendationNotificationService, fileService, productService) {
            super(fileService, productService);
            this.userHome = userHome;
            this.windowEvents = windowEvents;
            this.telemetryService = telemetryService;
            this.extensionManagementService = extensionManagementService;
            this.storageService = storageService;
            this.extensionRecommendationNotificationService = extensionRecommendationNotificationService;
            this.highImportanceExecutableTips = new Map();
            this.mediumImportanceExecutableTips = new Map();
            this.allOtherExecutableTips = new Map();
            this.highImportanceTipsByExe = new Map();
            this.mediumImportanceTipsByExe = new Map();
            if (productService.exeBasedExtensionTips) {
                Object.entries(productService.exeBasedExtensionTips).forEach(([key, exeBasedExtensionTip]) => {
                    const highImportanceRecommendations = [];
                    const mediumImportanceRecommendations = [];
                    const otherRecommendations = [];
                    Object.entries(exeBasedExtensionTip.recommendations).forEach(([extensionId, value]) => {
                        if (value.important) {
                            if (exeBasedExtensionTip.important) {
                                highImportanceRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                            }
                            else {
                                mediumImportanceRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                            }
                        }
                        else {
                            otherRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                        }
                    });
                    if (highImportanceRecommendations.length) {
                        this.highImportanceExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: highImportanceRecommendations });
                    }
                    if (mediumImportanceRecommendations.length) {
                        this.mediumImportanceExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: mediumImportanceRecommendations });
                    }
                    if (otherRecommendations.length) {
                        this.allOtherExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: otherRecommendations });
                    }
                });
            }
            /*
                3s has come out to be the good number to fetch and prompt important exe based recommendations
                Also fetch important exe based recommendations for reporting telemetry
            */
            (0, async_1.disposableTimeout)(async () => {
                await this.collectTips();
                this.promptHighImportanceExeBasedTip();
                this.promptMediumImportanceExeBasedTip();
            }, 3000, this._store);
        }
        async getImportantExecutableBasedTips() {
            const highImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.highImportanceExecutableTips);
            const mediumImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.mediumImportanceExecutableTips);
            return [...highImportanceExeTips, ...mediumImportanceExeTips];
        }
        getOtherExecutableBasedTips() {
            return this.getValidExecutableBasedExtensionTips(this.allOtherExecutableTips);
        }
        async collectTips() {
            const highImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.highImportanceExecutableTips);
            const mediumImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.mediumImportanceExecutableTips);
            const local = await this.extensionManagementService.getInstalled();
            this.highImportanceTipsByExe = this.groupImportantTipsByExe(highImportanceExeTips, local);
            this.mediumImportanceTipsByExe = this.groupImportantTipsByExe(mediumImportanceExeTips, local);
        }
        groupImportantTipsByExe(importantExeBasedTips, local) {
            const importantExeBasedRecommendations = new Map();
            importantExeBasedTips.forEach(tip => importantExeBasedRecommendations.set(tip.extensionId.toLowerCase(), tip));
            const { installed, uninstalled: recommendations } = this.groupByInstalled([...importantExeBasedRecommendations.keys()], local);
            /* Log installed and uninstalled exe based recommendations */
            for (const extensionId of installed) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip) {
                    this.telemetryService.publicLog2('exeExtensionRecommendations:alreadyInstalled', { extensionId, exeName: tip.exeName });
                }
            }
            for (const extensionId of recommendations) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip) {
                    this.telemetryService.publicLog2('exeExtensionRecommendations:notInstalled', { extensionId, exeName: tip.exeName });
                }
            }
            const promptedExecutableTips = this.getPromptedExecutableTips();
            const tipsByExe = new Map();
            for (const extensionId of recommendations) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip && (!promptedExecutableTips[tip.exeName] || !promptedExecutableTips[tip.exeName].includes(tip.extensionId))) {
                    let tips = tipsByExe.get(tip.exeName);
                    if (!tips) {
                        tips = [];
                        tipsByExe.set(tip.exeName, tips);
                    }
                    tips.push(tip);
                }
            }
            return tipsByExe;
        }
        /**
         * High importance tips are prompted once per restart session
         */
        promptHighImportanceExeBasedTip() {
            if (this.highImportanceTipsByExe.size === 0) {
                return;
            }
            const [exeName, tips] = [...this.highImportanceTipsByExe.entries()][0];
            this.promptExeRecommendations(tips)
                .then(result => {
                switch (result) {
                    case "reacted" /* RecommendationsNotificationResult.Accepted */:
                        this.addToRecommendedExecutables(tips[0].exeName, tips);
                        break;
                    case "ignored" /* RecommendationsNotificationResult.Ignored */:
                        this.highImportanceTipsByExe.delete(exeName);
                        break;
                    case "incompatibleWindow" /* RecommendationsNotificationResult.IncompatibleWindow */: {
                        // Recommended in incompatible window. Schedule the prompt after active window change
                        const onActiveWindowChange = event_1.Event.once(event_1.Event.latch(event_1.Event.any(this.windowEvents.onDidOpenMainWindow, this.windowEvents.onDidFocusMainWindow)));
                        this._register(onActiveWindowChange(() => this.promptHighImportanceExeBasedTip()));
                        break;
                    }
                    case "toomany" /* RecommendationsNotificationResult.TooMany */: {
                        // Too many notifications. Schedule the prompt after one hour
                        const disposable = this._register(new lifecycle_1.MutableDisposable());
                        disposable.value = (0, async_1.disposableTimeout)(() => { disposable.dispose(); this.promptHighImportanceExeBasedTip(); }, 60 * 60 * 1000 /* 1 hour */);
                        break;
                    }
                }
            });
        }
        /**
         * Medium importance tips are prompted once per 7 days
         */
        promptMediumImportanceExeBasedTip() {
            if (this.mediumImportanceTipsByExe.size === 0) {
                return;
            }
            const lastPromptedMediumExeTime = this.getLastPromptedMediumExeTime();
            const timeSinceLastPrompt = Date.now() - lastPromptedMediumExeTime;
            const promptInterval = 7 * 24 * 60 * 60 * 1000; // 7 Days
            if (timeSinceLastPrompt < promptInterval) {
                // Wait until interval and prompt
                const disposable = this._register(new lifecycle_1.MutableDisposable());
                disposable.value = (0, async_1.disposableTimeout)(() => { disposable.dispose(); this.promptMediumImportanceExeBasedTip(); }, promptInterval - timeSinceLastPrompt);
                return;
            }
            const [exeName, tips] = [...this.mediumImportanceTipsByExe.entries()][0];
            this.promptExeRecommendations(tips)
                .then(result => {
                switch (result) {
                    case "reacted" /* RecommendationsNotificationResult.Accepted */: {
                        // Accepted: Update the last prompted time and caches.
                        this.updateLastPromptedMediumExeTime(Date.now());
                        this.mediumImportanceTipsByExe.delete(exeName);
                        this.addToRecommendedExecutables(tips[0].exeName, tips);
                        // Schedule the next recommendation for next internval
                        const disposable1 = this._register(new lifecycle_1.MutableDisposable());
                        disposable1.value = (0, async_1.disposableTimeout)(() => { disposable1.dispose(); this.promptMediumImportanceExeBasedTip(); }, promptInterval);
                        break;
                    }
                    case "ignored" /* RecommendationsNotificationResult.Ignored */:
                        // Ignored: Remove from the cache and prompt next recommendation
                        this.mediumImportanceTipsByExe.delete(exeName);
                        this.promptMediumImportanceExeBasedTip();
                        break;
                    case "incompatibleWindow" /* RecommendationsNotificationResult.IncompatibleWindow */: {
                        // Recommended in incompatible window. Schedule the prompt after active window change
                        const onActiveWindowChange = event_1.Event.once(event_1.Event.latch(event_1.Event.any(this.windowEvents.onDidOpenMainWindow, this.windowEvents.onDidFocusMainWindow)));
                        this._register(onActiveWindowChange(() => this.promptMediumImportanceExeBasedTip()));
                        break;
                    }
                    case "toomany" /* RecommendationsNotificationResult.TooMany */: {
                        // Too many notifications. Schedule the prompt after one hour
                        const disposable2 = this._register(new lifecycle_1.MutableDisposable());
                        disposable2.value = (0, async_1.disposableTimeout)(() => { disposable2.dispose(); this.promptMediumImportanceExeBasedTip(); }, 60 * 60 * 1000 /* 1 hour */);
                        break;
                    }
                }
            });
        }
        async promptExeRecommendations(tips) {
            const installed = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
            const extensions = tips
                .filter(tip => !tip.whenNotInstalled || tip.whenNotInstalled.every(id => installed.every(local => !(0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id }))))
                .map(({ extensionId }) => extensionId.toLowerCase());
            return this.extensionRecommendationNotificationService.promptImportantExtensionsInstallNotification({ extensions, source: 3 /* RecommendationSource.EXE */, name: tips[0].exeFriendlyName, searchValue: `@exe:"${tips[0].exeName}"` });
        }
        getLastPromptedMediumExeTime() {
            let value = this.storageService.getNumber(lastPromptedMediumImpExeTimeStorageKey, -1 /* StorageScope.APPLICATION */);
            if (!value) {
                value = Date.now();
                this.updateLastPromptedMediumExeTime(value);
            }
            return value;
        }
        updateLastPromptedMediumExeTime(value) {
            this.storageService.store(lastPromptedMediumImpExeTimeStorageKey, value, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        getPromptedExecutableTips() {
            return JSON.parse(this.storageService.get(promptedExecutableTipsStorageKey, -1 /* StorageScope.APPLICATION */, '{}'));
        }
        addToRecommendedExecutables(exeName, tips) {
            const promptedExecutableTips = this.getPromptedExecutableTips();
            promptedExecutableTips[exeName] = tips.map(({ extensionId }) => extensionId.toLowerCase());
            this.storageService.store(promptedExecutableTipsStorageKey, JSON.stringify(promptedExecutableTips), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
        }
        groupByInstalled(recommendationsToSuggest, local) {
            const installed = [], uninstalled = [];
            const installedExtensionsIds = local.reduce((result, i) => { result.add(i.identifier.id.toLowerCase()); return result; }, new Set());
            recommendationsToSuggest.forEach(id => {
                if (installedExtensionsIds.has(id.toLowerCase())) {
                    installed.push(id);
                }
                else {
                    uninstalled.push(id);
                }
            });
            return { installed, uninstalled };
        }
        async getValidExecutableBasedExtensionTips(executableTips) {
            const result = [];
            const checkedExecutables = new Map();
            for (const exeName of executableTips.keys()) {
                const extensionTip = executableTips.get(exeName);
                if (!extensionTip || !(0, arrays_1.isNonEmptyArray)(extensionTip.recommendations)) {
                    continue;
                }
                const exePaths = [];
                if (platform_1.isWindows) {
                    if (extensionTip.windowsPath) {
                        exePaths.push(extensionTip.windowsPath.replace('%USERPROFILE%', () => process_1.env['USERPROFILE'])
                            .replace('%ProgramFiles(x86)%', () => process_1.env['ProgramFiles(x86)'])
                            .replace('%ProgramFiles%', () => process_1.env['ProgramFiles'])
                            .replace('%APPDATA%', () => process_1.env['APPDATA'])
                            .replace('%WINDIR%', () => process_1.env['WINDIR']));
                    }
                }
                else {
                    exePaths.push((0, path_1.join)('/usr/local/bin', exeName));
                    exePaths.push((0, path_1.join)('/usr/bin', exeName));
                    exePaths.push((0, path_1.join)(this.userHome.fsPath, exeName));
                }
                for (const exePath of exePaths) {
                    let exists = checkedExecutables.get(exePath);
                    if (exists === undefined) {
                        exists = await this.fileService.exists(uri_1.URI.file(exePath));
                        checkedExecutables.set(exePath, exists);
                    }
                    if (exists) {
                        for (const { extensionId, extensionName, isExtensionPack, whenNotInstalled } of extensionTip.recommendations) {
                            result.push({
                                extensionId,
                                extensionName,
                                isExtensionPack,
                                exeName,
                                exeFriendlyName: extensionTip.exeFriendlyName,
                                windowsPath: extensionTip.windowsPath,
                                whenNotInstalled: whenNotInstalled
                            });
                        }
                    }
                }
            }
            return result;
        }
    }
    exports.AbstractNativeExtensionTipsService = AbstractNativeExtensionTipsService;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uVGlwc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9leHRlbnNpb25UaXBzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQmhHLHFDQUFxQztJQUU5QixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBTW5ELFlBQ2UsV0FBNEMsRUFDekMsY0FBZ0Q7WUFFakUsS0FBSyxFQUFFLENBQUM7WUFIeUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDeEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBSmpELHVCQUFrQixHQUE2QyxJQUFJLEdBQUcsRUFBdUMsQ0FBQztZQU85SCxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDbEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMzSSxDQUFDO1FBQ0YsQ0FBQztRQUVELGtCQUFrQixDQUFDLE1BQVc7WUFDN0IsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVELEtBQUssQ0FBQywrQkFBK0I7WUFDcEMsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsS0FBSyxDQUFDLDJCQUEyQjtZQUNoQyxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFF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