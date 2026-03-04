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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/strings", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, lifecycle_1, objects_1, platform_1, strings_1, nls_1, configuration_1, configurationRegistry_1, product_1, productService_1, platform_2, telemetry_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    let TelemetryService = class TelemetryService {
        static { this.IDLE_START_EVENT_NAME = 'UserIdleStart'; }
        static { this.IDLE_STOP_EVENT_NAME = 'UserIdleStop'; }
        constructor(config, _configurationService, _productService) {
            this._configurationService = _configurationService;
            this._productService = _productService;
            this._experimentProperties = {};
            this._disposables = new lifecycle_1.DisposableStore();
            this._cleanupPatterns = [];
            this._appenders = config.appenders;
            this._commonProperties = config.commonProperties ?? Object.create(null);
            this.sessionId = this._commonProperties['sessionID'];
            this.machineId = this._commonProperties['common.machineId'];
            this.sqmId = this._commonProperties['common.sqmId'];
            this.firstSessionDate = this._commonProperties['common.firstSessionDate'];
            this.msftInternal = this._commonProperties['common.msftInternal'];
            this._piiPaths = config.piiPaths || [];
            this._telemetryLevel = 3 /* TelemetryLevel.USAGE */;
            this._sendErrorTelemetry = !!config.sendErrorTelemetry;
            // static cleanup pattern for: `vscode-file:///DANGEROUS/PATH/resources/app/Useful/Information`
            this._cleanupPatterns = [/(vscode-)?file:\/\/\/.*?\/resources\/app\//gi];
            for (const piiPath of this._piiPaths) {
                this._cleanupPatterns.push(new RegExp((0, strings_1.escapeRegExpCharacters)(piiPath), 'gi'));
                if (piiPath.indexOf('\\') >= 0) {
                    this._cleanupPatterns.push(new RegExp((0, strings_1.escapeRegExpCharacters)(piiPath.replace(/\\/g, '/')), 'gi'));
                }
            }
            this._updateTelemetryLevel();
            this._disposables.add(this._configurationService.onDidChangeConfiguration(e => {
                // Check on the telemetry settings and update the state if changed
                const affectsTelemetryConfig = e.affectsConfiguration(telemetry_1.TELEMETRY_SETTING_ID)
                    || e.affectsConfiguration(telemetry_1.TELEMETRY_OLD_SETTING_ID)
                    || e.affectsConfiguration(telemetry_1.TELEMETRY_CRASH_REPORTER_SETTING_ID);
                if (affectsTelemetryConfig) {
                    this._updateTelemetryLevel();
                }
            }));
        }
        setExperimentProperty(name, value) {
            this._experimentProperties[name] = value;
        }
        _updateTelemetryLevel() {
            let level = (0, telemetryUtils_1.getTelemetryLevel)(this._configurationService);
            const collectableTelemetry = this._productService.enabledTelemetryLevels;
            // Also ensure that error telemetry is respecting the product configuration for collectable telemetry
            if (collectableTelemetry) {
                this._sendErrorTelemetry = this.sendErrorTelemetry ? collectableTelemetry.error : false;
                // Make sure the telemetry level from the service is the minimum of the config and product
                const maxCollectableTelemetryLevel = collectableTelemetry.usage ? 3 /* TelemetryLevel.USAGE */ : collectableTelemetry.error ? 2 /* TelemetryLevel.ERROR */ : 0 /* TelemetryLevel.NONE */;
                level = Math.min(level, maxCollectableTelemetryLevel);
            }
            this._telemetryLevel = level;
        }
        get sendErrorTelemetry() {
            return this._sendErrorTelemetry;
        }
        get telemetryLevel() {
            return this._telemetryLevel;
        }
        dispose() {
            this._disposables.dispose();
        }
        _log(eventName, eventLevel, data) {
            // don't send events when the user is optout
            if (this._telemetryLevel < eventLevel) {
                return;
            }
            // add experiment properties
            data = (0, objects_1.mixin)(data, this._experimentProperties);
            // remove all PII from data
            data = (0, telemetryUtils_1.cleanData)(data, this._cleanupPatterns);
            // add common properties
            data = (0, objects_1.mixin)(data, this._commonProperties);
            // Log to the appenders of sufficient level
            this._appenders.forEach(a => a.log(eventName, data));
        }
        publicLog(eventName, data) {
            this._log(eventName, 3 /* TelemetryLevel.USAGE */, data);
        }
        publicLog2(eventName, data) {
            this.publicLog(eventName, data);
        }
        publicLogError(errorEventName, data) {
            if (!this._sendErrorTelemetry) {
                return;
            }
            // Send error event and anonymize paths
            this._log(errorEventName, 2 /* TelemetryLevel.ERROR */, data);
        }
        publicLogError2(eventName, data) {
            this.publicLogError(eventName, data);
        }
    };
    exports.TelemetryService = TelemetryService;
    exports.TelemetryService = TelemetryService = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService)
    ], TelemetryService);
    function getTelemetryLevelSettingDescription() {
        const telemetryText = (0, nls_1.localize)('telemetry.telemetryLevelMd', "Controls {0} telemetry, first-party extension telemetry, and participating third-party extension telemetry. Some third party extensions might not respect this setting. Consult the specific extension's documentation to be sure. Telemetry helps us better understand how {0} is performing, where improvements need to be made, and how features are being used.", product_1.default.nameLong);
        const externalLinksStatement = !product_1.default.privacyStatementUrl ?
            (0, nls_1.localize)("telemetry.docsStatement", "Read more about the [data we collect]({0}).", 'https://aka.ms/vscode-telemetry') :
            (0, nls_1.localize)("telemetry.docsAndPrivacyStatement", "Read more about the [data we collect]({0}) and our [privacy statement]({1}).", 'https://aka.ms/vscode-telemetry', product_1.default.privacyStatementUrl);
        const restartString = !platform_1.isWeb ? (0, nls_1.localize)('telemetry.restart', 'A full restart of the application is necessary for crash reporting changes to take effect.') : '';
        const crashReportsHeader = (0, nls_1.localize)('telemetry.crashReports', "Crash Reports");
        const errorsHeader = (0, nls_1.localize)('telemetry.errors', "Error Telemetry");
        const usageHeader = (0, nls_1.localize)('telemetry.usage', "Usage Data");
        const telemetryTableDescription = (0, nls_1.localize)('telemetry.telemetryLevel.tableDescription', "The following table outlines the data sent with each setting:");
        const telemetryTable = `
|       | ${crashReportsHeader} | ${errorsHeader} | ${usageHeader} |
|:------|:---------------------:|:---------------:|:--------------:|
| all   |            ✓          |        ✓        |        ✓       |
| error |            ✓          |        ✓        |        -       |
| crash |            ✓          |        -        |        -       |
| off   |            -          |        -        |        -       |
`;
        const deprecatedSettingNote = (0, nls_1.localize)('telemetry.telemetryLevel.deprecated', "****Note:*** If this setting is 'off', no telemetry will be sent regardless of other telemetry settings. If this setting is set to anything except 'off' and telemetry is disabled with deprecated settings, no telemetry will be sent.*");
        const telemetryDescription = `
${telemetryText} ${externalLinksStatement} ${restartString}

&nbsp;

${telemetryTableDescription}
${telemetryTable}

&nbsp;

${deprecatedSettingNote}
`;
        return telemetryDescription;
    }
    platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': telemetry_1.TELEMETRY_SECTION_ID,
        'order': 1,
        'type': 'object',
        'title': (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
        'properties': {
            [telemetry_1.TELEMETRY_SETTING_ID]: {
                'type': 'string',
                'enum': ["all" /* TelemetryConfiguration.ON */, "error" /* TelemetryConfiguration.ERROR */, "crash" /* TelemetryConfiguration.CRASH */, "off" /* TelemetryConfiguration.OFF */],
                'enumDescriptions': [
                    (0, nls_1.localize)('telemetry.telemetryLevel.default', "Sends usage data, errors, and crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.error', "Sends general error telemetry and crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.crash', "Sends OS level crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.off', "Disables all product telemetry.")
                ],
                'markdownDescription': getTelemetryLevelSettingDescription(),
                'default': "all" /* TelemetryConfiguration.ON */,
                'restricted': true,
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                'tags': ['usesOnlineServices', 'telemetry']
            }
        }
    });
    // Deprecated telemetry setting
    platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': telemetry_1.TELEMETRY_SECTION_ID,
        'order': 110,
        'type': 'object',
        'title': (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
        'properties': {
            [telemetry_1.TELEMETRY_OLD_SETTING_ID]: {
                'type': 'boolean',
                'markdownDescription': !product_1.default.privacyStatementUrl ?
                    (0, nls_1.localize)('telemetry.enableTelemetry', "Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made.", product_1.default.nameLong) :
                    (0, nls_1.localize)('telemetry.enableTelemetryMd', "Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made. [Read more]({1}) about what we collect and our privacy statement.", product_1.default.nameLong, product_1.default.privacyStatementUrl),
                'default': true,
                'restricted': true,
                'markdownDeprecationMessage': (0, nls_1.localize)('enableTelemetryDeprecated', "If this setting is false, no telemetry will be sent regardless of the new setting's value. Deprecated in favor of the {0} setting.", `\`#${telemetry_1.TELEMETRY_SETTING_ID}#\``),
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                'tags': ['usesOnlineServices', 'telemetry']
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9jb21tb24vdGVsZW1ldHJ5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO2lCQUVaLDBCQUFxQixHQUFHLGVBQWUsQUFBbEIsQ0FBbUI7aUJBQ3hDLHlCQUFvQixHQUFHLGNBQWMsQUFBakIsQ0FBa0I7UUFvQnRELFlBQ0MsTUFBK0IsRUFDUixxQkFBb0QsRUFDMUQsZUFBd0M7WUFEMUIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNsRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFYbEQsMEJBQXFCLEdBQStCLEVBQUUsQ0FBQztZQUs5QyxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzlDLHFCQUFnQixHQUFhLEVBQUUsQ0FBQztZQU92QyxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7WUFDbkMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXhFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBVyxDQUFDO1lBQy9ELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFXLENBQUM7WUFDdEUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFXLENBQUM7WUFDOUQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFB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