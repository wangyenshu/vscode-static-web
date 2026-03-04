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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/languages", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/contrib/url/common/urlGlob", "vs/workbench/services/preferences/common/preferences"], function (require, exports, arrays_1, iterator_1, lifecycle_1, linkedList_1, platform_1, uri_1, languages, nls, configuration_1, instantiation_1, log_1, opener_1, quickInput_1, configuration_2, urlGlob_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalUriOpenerService = exports.IExternalUriOpenerService = void 0;
    exports.IExternalUriOpenerService = (0, instantiation_1.createDecorator)('externalUriOpenerService');
    let ExternalUriOpenerService = class ExternalUriOpenerService extends lifecycle_1.Disposable {
        constructor(openerService, configurationService, logService, preferencesService, quickInputService) {
            super();
            this.configurationService = configurationService;
            this.logService = logService;
            this.preferencesService = preferencesService;
            this.quickInputService = quickInputService;
            this._providers = new linkedList_1.LinkedList();
            this._register(openerService.registerExternalOpener(this));
        }
        registerExternalOpenerProvider(provider) {
            const remove = this._providers.push(provider);
            return { dispose: remove };
        }
        async getOpeners(targetUri, allowOptional, ctx, token) {
            const allOpeners = await this.getAllOpenersForUri(targetUri);
            if (allOpeners.size === 0) {
                return [];
            }
            // First see if we have a preferredOpener
            if (ctx.preferredOpenerId) {
                if (ctx.preferredOpenerId === configuration_2.defaultExternalUriOpenerId) {
                    return [];
                }
                const preferredOpener = allOpeners.get(ctx.preferredOpenerId);
                if (preferredOpener) {
                    // Skip the `canOpen` check here since the opener was specifically requested.
                    return [preferredOpener];
                }
            }
            // Check to see if we have a configured opener
            const configuredOpener = this.getConfiguredOpenerForUri(allOpeners, targetUri);
            if (configuredOpener) {
                // Skip the `canOpen` check here since the opener was specifically requested.
                return configuredOpener === configuration_2.defaultExternalUriOpenerId ? [] : [configuredOpener];
            }
            // Then check to see if there is a valid opener
            const validOpeners = [];
            await Promise.all(Array.from(allOpeners.values()).map(async (opener) => {
                let priority;
                try {
                    priority = await opener.canOpen(ctx.sourceUri, token);
                }
                catch (e) {
                    this.logService.error(e);
                    return;
                }
                switch (priority) {
                    case languages.ExternalUriOpenerPriority.Option:
                    case languages.ExternalUriOpenerPriority.Default:
                    case languages.ExternalUriOpenerPriority.Preferred:
                        validOpeners.push({ opener, priority });
                        break;
                }
            }));
            if (validOpeners.length === 0) {
                return [];
            }
            // See if we have a preferred opener first
            const preferred = (0, arrays_1.firstOrDefault)(validOpeners.filter(x => x.priority === languages.ExternalUriOpenerPriority.Preferred));
            if (preferred) {
                return [preferred.opener];
            }
            // See if we only have optional openers, use the default opener
            if (!allowOptional && validOpeners.every(x => x.priority === languages.ExternalUriOpenerPriority.Option)) {
                return [];
            }
            return validOpeners.map(value => value.opener);
        }
        async openExternal(href, ctx, token) {
            const targetUri = typeof href === 'string' ? uri_1.URI.parse(href) : href;
            const allOpeners = await this.getOpeners(targetUri, false, ctx, token);
            if (allOpeners.length === 0) {
                return false;
            }
            else if (allOpeners.length === 1) {
                return allOpeners[0].openExternalUri(targetUri, ctx, token);
            }
            // Otherwise prompt
            return this.showOpenerPrompt(allOpeners, targetUri, ctx, token);
        }
        async getOpener(targetUri, ctx, token) {
            const allOpeners = await this.getOpeners(targetUri, true, ctx, token);
            if (allOpeners.length >= 1) {
                return allOpeners[0];
            }
            return undefined;
        }
        async getAllOpenersForUri(targetUri) {
            const allOpeners = new Map();
            await Promise.all(iterator_1.Iterable.map(this._providers, async (provider) => {
                for await (const opener of provider.getOpeners(targetUri)) {
                    allOpeners.set(opener.id, opener);
                }
            }));
            return allOpeners;
        }
        getConfiguredOpenerForUri(openers, targetUri) {
            const config = this.configurationService.getValue(configuration_2.externalUriOpenersSettingId) || {};
            for (const [uriGlob, id] of Object.entries(config)) {
                if ((0, urlGlob_1.testUrlMatchesGlob)(targetUri, uriGlob)) {
                    if (id === configuration_2.defaultExternalUriOpenerId) {
                        return 'default';
                    }
                    const entry = openers.get(id);
                    if (entry) {
                        return entry;
                    }
                }
            }
            return undefined;
        }
        async showOpenerPrompt(openers, targetUri, ctx, token) {
            const items = openers.map((opener) => {
                return {
                    label: opener.label,
                    opener: opener
                };
            });
            items.push({
                label: platform_1.isWeb
                    ? nls.localize('selectOpenerDefaultLabel.web', 'Open in new browser window')
                    : nls.localize('selectOpenerDefaultLabel', 'Open in default browser'),
                opener: undefined
            }, { type: 'separator' }, {
                label: nls.localize('selectOpenerConfigureTitle', "Configure default opener..."),
                opener: 'configureDefault'
            });
            const picked = await this.quickInputService.pick(items, {
                placeHolder: nls.localize('selectOpenerPlaceHolder', "How would you like to open: {0}", targetUri.toString())
            });
            if (!picked) {
                // Still cancel the default opener here since we prompted the user
                return true;
            }
            if (typeof picked.opener === 'undefined') {
                return false; // Fallback to default opener
            }
            else if (picked.opener === 'configureDefault') {
                await this.preferencesService.openUserSettings({
                    jsonEditor: true,
                    revealSetting: { key: configuration_2.externalUriOpenersSettingId, edit: true }
                });
                return true;
            }
            else {
                return picked.opener.openExternalUri(targetUri, ctx, token);
            }
        }
    };
    exports.ExternalUriOpenerService = ExternalUriOpenerService;
    exports.ExternalUriOpenerService = ExternalUriOpenerService = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, preferences_1.IPreferencesService),
        __param(4, quickInput_1.IQuickInputService)
    ], ExternalUriOpenerService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxVcmlPcGVuZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZXJuYWxVcmlPcGVuZXIvY29tbW9uL2V4dGVybmFsVXJpT3BlbmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQm5GLFFBQUEseUJBQXlCLEdBQUcsSUFBQSwrQkFBZSxFQUE0QiwwQkFBMEIsQ0FBQyxDQUFDO0lBOEJ6RyxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO1FBTXZELFlBQ2lCLGFBQTZCLEVBQ3RCLG9CQUE0RCxFQUN0RSxVQUF3QyxFQUNoQyxrQkFBd0QsRUFDekQsaUJBQXNEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBTGdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDckQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNmLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDeEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQVAxRCxlQUFVLEdBQUcsSUFBSSx1QkFBVSxFQUEyQixDQUFDO1lBVXZFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVELDhCQUE4QixDQUFDLFFBQWlDO1lBQy9ELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVPLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBYyxFQUFFLGFBQXNCLEVBQUUsR0FBbUQsRUFBRSxLQUF3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