/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/amdX", "vs/base/common/errors", "vs/base/common/objects", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, amdX_1, errors_1, objects_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractOneDataSystemAppender = void 0;
    const endpointUrl = 'https://mobile.events.data.microsoft.com/OneCollector/1.0';
    const endpointHealthUrl = 'https://mobile.events.data.microsoft.com/ping';
    async function getClient(instrumentationKey, addInternalFlag, xhrOverride) {
        const oneDs = await (0, amdX_1.importAMDNodeModule)('@microsoft/1ds-core-js', 'dist/ms.core.js');
        const postPlugin = await (0, amdX_1.importAMDNodeModule)('@microsoft/1ds-post-js', 'dist/ms.post.js');
        const appInsightsCore = new oneDs.AppInsightsCore();
        const collectorChannelPlugin = new postPlugin.PostChannel();
        // Configure the app insights core to send to collector++ and disable logging of debug info
        const coreConfig = {
            instrumentationKey,
            endpointUrl,
            loggingLevelTelemetry: 0,
            loggingLevelConsole: 0,
            disableCookiesUsage: true,
            disableDbgExt: true,
            disableInstrumentationKeyValidation: true,
            channels: [[
                    collectorChannelPlugin
                ]]
        };
        if (xhrOverride) {
            coreConfig.extensionConfig = {};
            // Configure the channel to use a XHR Request override since it's not available in node
            const channelConfig = {
                alwaysUseXhrOverride: true,
                ignoreMc1Ms0CookieProcessing: true,
                httpXHROverride: xhrOverride
            };
            coreConfig.extensionConfig[collectorChannelPlugin.identifier] = channelConfig;
        }
        appInsightsCore.initialize(coreConfig, []);
        appInsightsCore.addTelemetryInitializer((envelope) => {
            // Opt the user out of 1DS data sharing
            envelope['ext'] = envelope['ext'] ?? {};
            envelope['ext']['web'] = envelope['ext']['web'] ?? {};
            envelope['ext']['web']['consentDetails'] = '{"GPC_DataSharingOptIn":false}';
            if (addInternalFlag) {
                envelope['ext']['utc'] = envelope['ext']['utc'] ?? {};
                // Sets it to be internal only based on Windows UTC flagging
                envelope['ext']['utc']['flags'] = 0x0000811ECD;
            }
        });
        return appInsightsCore;
    }
    // TODO @lramos15 maybe make more in line with src/vs/platform/telemetry/browser/appInsightsAppender.ts with caching support
    class AbstractOneDataSystemAppender {
        constructor(_isInternalTelemetry, _eventPrefix, _defaultData, iKeyOrClientFactory, // allow factory function for testing
        _xhrOverride) {
            this._isInternalTelemetry = _isInternalTelemetry;
            this._eventPrefix = _eventPrefix;
            this._defaultData = _defaultData;
            this._xhrOverride = _xhrOverride;
            this.endPointUrl = endpointUrl;
            this.endPointHealthUrl = endpointHealthUrl;
            if (!this._defaultData) {
                this._defaultData = {};
            }
            if (typeof iKeyOrClientFactory === 'function') {
                this._aiCoreOrKey = iKeyOrClientFactory();
            }
            else {
                this._aiCoreOrKey = iKeyOrClientFactory;
            }
            this._asyncAiCore = null;
        }
        _withAIClient(callback) {
            if (!this._aiCoreOrKey) {
                return;
            }
            if (typeof this._aiCoreOrKey !== 'string') {
                callback(this._aiCoreOrKey);
                return;
            }
            if (!this._asyncAiCore) {
                this._asyncAiCore = getClient(this._aiCoreOrKey, this._isInternalTelemetry, this._xhrOverride);
            }
            this._asyncAiCore.then((aiClient) => {
                callback(aiClient);
            }, (err) => {
                (0, errors_1.onUnexpectedError)(err);
                console.error(err);
            });
        }
        log(eventName, data) {
            if (!this._aiCoreOrKey) {
                return;
            }
            data = (0, objects_1.mixin)(data, this._defaultData);
            data = (0, telemetryUtils_1.validateTelemetryData)(data);
            const name = this._eventPrefix + '/' + eventName;
            try {
                this._withAIClient((aiClient) => {
                    aiClient.pluginVersionString = data?.properties.version ?? 'Unknown';
                    aiClient.track({
                        name,
                        baseData: { name, properties: data?.properties, measurements: data?.measurements }
                    });
                });
            }
            catch { }
        }
        flush() {
            if (this._aiCoreOrKey) {
                return new Promise(resolve => {
                    this._withAIClient((aiClient) => {
                        aiClient.unload(true, () => {
                            this._aiCoreOrKey = undefined;
                            resolve(undefined);
                        });
                    });
                });
            }
            return Promise.resolve(undefined);
        }
    }
    exports.AbstractOneDataSystemAppender = AbstractOneDataSystemAppender;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMWRzQXBwZW5kZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvY29tbW9uLzFkc0FwcGVuZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsTUFBTSxXQUFXLEdBQUcsMkRBQTJELENBQUM7SUFDaEYsTUFBTSxpQkFBaUIsR0FBRywrQ0FBK0MsQ0FBQztJQUUxRSxLQUFLLFVBQVUsU0FBUyxDQUFDLGtCQUEwQixFQUFFLGVBQXlCLEVBQUUsV0FBMEI7UUFDekcsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLDBCQUFtQixFQUEwQyx3QkFBd0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzlILE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSwwQkFBbUIsRUFBMEMsd0JBQXdCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNuSSxNQUFNLGVBQWUsR0FBRyxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNwRCxNQUFNLHNCQUFzQixHQUFnQixJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN6RSwyRkFBMkY7UUFDM0YsTUFBTSxVQUFVLEdBQTJCO1lBQzFDLGtCQUFrQjtZQUNsQixXQUFXO1lBQ1gscUJBQXFCLEVBQUUsQ0FBQztZQUN4QixtQkFBbUIsRUFBRSxDQUFDO1lBQ3RCLG1CQUFtQixFQUFFLElBQUk7WUFDekIsYUFBYSxFQUFFLElBQUk7WUFDbkIsbUNBQW1DLEVBQUUsSUFBSTtZQUN6QyxRQUFRLEVBQUUsQ0FBQztvQkFDVixzQkFBc0I7aUJBQ3RCLENBQUM7U0FDRixDQUFDO1FBRUYsSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUNqQixVQUFVLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUNoQyx1RkFBdUY7WUFDdkYsTUFBTSxh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