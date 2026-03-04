/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/types", "vs/platform/remote/common/remoteHosts", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry"], function (require, exports, objects_1, types_1, remoteHosts_1, commonProperties_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullAppender = exports.extensionTelemetryLogChannelId = exports.telemetryLogId = exports.NullEndpointTelemetryService = exports.NullTelemetryService = exports.NullTelemetryServiceShape = exports.TelemetryTrustedValue = void 0;
    exports.supportsTelemetry = supportsTelemetry;
    exports.isLoggingOnly = isLoggingOnly;
    exports.getTelemetryLevel = getTelemetryLevel;
    exports.validateTelemetryData = validateTelemetryData;
    exports.cleanRemoteAuthority = cleanRemoteAuthority;
    exports.isInternalTelemetry = isInternalTelemetry;
    exports.getPiiPathsFromEnvironment = getPiiPathsFromEnvironment;
    exports.cleanData = cleanData;
    /**
     * A special class used to denoting a telemetry value which should not be clean.
     * This is because that value is "Trusted" not to contain identifiable information such as paths.
     * NOTE: This is used as an API type as well, and should not be changed.
     */
    class TelemetryTrustedValue {
        constructor(value) {
            this.value = value;
            // This is merely used as an identifier as the instance will be lost during serialization over the exthost
            this.isTrustedTelemetryValue = true;
        }
    }
    exports.TelemetryTrustedValue = TelemetryTrustedValue;
    class NullTelemetryServiceShape {
        constructor() {
            this.telemetryLevel = 0 /* TelemetryLevel.NONE */;
            this.sessionId = 'someValue.sessionId';
            this.machineId = 'someValue.machineId';
            this.sqmId = 'someValue.sqmId';
            this.firstSessionDate = 'someValue.firstSessionDate';
            this.sendErrorTelemetry = false;
        }
        publicLog() { }
        publicLog2() { }
        publicLogError() { }
        publicLogError2() { }
        setExperimentProperty() { }
    }
    exports.NullTelemetryServiceShape = NullTelemetryServiceShape;
    exports.NullTelemetryService = new NullTelemetryServiceShape();
    class NullEndpointTelemetryService {
        async publicLog(_endpoint, _eventName, _data) {
            // noop
        }
        async publicLogError(_endpoint, _errorEventName, _data) {
            // noop
        }
    }
    exports.NullEndpointTelemetryService = NullEndpointTelemetryService;
    exports.telemetryLogId = 'telemetry';
    exports.extensionTelemetryLogChannelId = 'extensionTelemetryLog';
    exports.NullAppender = { log: () => null, flush: () => Promise.resolve(null) };
    /**
     * Determines whether or not we support logging telemetry.
     * This checks if the product is capable of collecting telemetry but not whether or not it can send it
     * For checking the user setting and what telemetry you can send please check `getTelemetryLevel`.
     * This returns true if `--disable-telemetry` wasn't used, the product.json allows for telemetry, and we're not testing an extension
     * If false telemetry is disabled throughout the product
     * @param productService
     * @param environmentService
     * @returns false - telemetry is completely disabled, true - telemetry is logged locally, but may not be sent
     */
    function supportsTelemetry(productService, environmentService) {
        // If it's OSS and telemetry isn't disabled via the CLI we will allow it for logging only purposes
        if (!environmentService.isBuilt && !environmentService.disableTelemetry) {
            return true;
        }
        return !(environmentService.disableTelemetry || !productService.enableTelemetry);
    }
    /**
     * Checks to see if we're in logging only mode to debug telemetry.
     * This is if telemetry is enabled and we're in OSS, but no telemetry key is provided so it's not being sent just logged.
     * @param productService
     * @param environmentService
     * @returns True if telemetry is actually disabled and we're only logging for debug purposes
     */
    function isLoggingOnly(productService, environmentService) {
        // If we're testing an extension, log telemetry for debug purposes
        if (environmentService.extensionTestsLocationURI) {
            return true;
        }
        // Logging only mode is only for OSS
        if (environmentService.isBuilt) {
            return false;
        }
        if (environmentService.disableTelemetry) {
            return false;
        }
        if (productService.enableTelemetry && productService.aiConfig?.ariaKey) {
            return false;
        }
        return true;
    }
    /**
     * Determines how telemetry is handled based on the user's configuration.
     *
     * @param configurationService
     * @returns OFF, ERROR, ON
     */
    function getTelemetryLevel(configurationService) {
        const newConfig = configurationService.getValue(telemetry_1.TELEMETRY_SETTING_ID);
        const crashReporterConfig = configurationService.getValue(telemetry_1.TELEMETRY_CRASH_REPORTER_SETTING_ID);
        const oldConfig = configurationService.getValue(telemetry_1.TELEMETRY_OLD_SETTING_ID);
        // If `telemetry.enableCrashReporter` is false or `telemetry.enableTelemetry' is false, disable telemetry
        if (oldConfig === false || crashReporterConfig === false) {
            return 0 /* TelemetryLevel.NONE */;
        }
        // Maps new telemetry setting to a telemetry level
        switch (newConfig ?? "all" /* TelemetryConfiguration.ON */) {
            case "all" /* TelemetryConfiguration.ON */:
                return 3 /* TelemetryLevel.USAGE */;
            case "error" /* TelemetryConfiguration.ERROR */:
                return 2 /* TelemetryLevel.ERROR */;
            case "crash" /* TelemetryConfiguration.CRASH */:
                return 1 /* TelemetryLevel.CRASH */;
            case "off" /* TelemetryConfiguration.OFF */:
                return 0 /* TelemetryLevel.NONE */;
        }
    }
    function validateTelemetryData(data) {
        const properties = {};
        const measurements = {};
        const flat = {};
        flatten(data, flat);
        for (let prop in flat) {
            // enforce property names less than 150 char, take the last 150 char
            prop = prop.length > 150 ? prop.substr(prop.length - 149) : prop;
            const value = flat[prop];
            if (typeof value === 'number') {
                measurements[prop] = value;
            }
            else if (typeof value === 'boolean') {
                measurements[prop] = value ? 1 : 0;
            }
            else if (typeof value === 'string') {
                if (value.length > 8192) {
                    console.warn(`Telemetry property: ${prop} has been trimmed to 8192, the original length is ${value.length}`);
                }
                //enforce property value to be less than 8192 char, take the first 8192 char
                // https://docs.microsoft.com/en-us/azure/azure-monitor/app/api-custom-events-metrics#limits
                properties[prop] = value.substring(0, 8191);
            }
            else if (typeof value !== 'undefined' && value !== null) {
                properties[prop] = value;
            }
        }
        return {
            properties,
            measurements
        };
    }
    const telemetryAllowedAuthorities = new Set(['ssh-remote', 'dev-container', 'attached-container', 'wsl', 'tunnel', 'codespaces', 'amlext']);
    function cleanRemoteAuthority(remoteAuthority) {
        if (!remoteAuthority) {
            return 'none';
        }
        const remoteName = (0, remoteHosts_1.getRemoteName)(remoteAuthority);
        return telemetryAllowedAuthorities.has(remoteName) ? remoteName : 'other';
    }
    function flatten(obj, result, order = 0, prefix) {
        if (!obj) {
            return;
        }
        for (const item of Object.getOwnPropertyNames(obj)) {
            const value = obj[item];
            const index = prefix ? prefix + item : item;
            if (Array.isArray(value)) {
                result[index] = (0, objects_1.safeStringify)(value);
            }
            else if (value instanceof Date) {
                // TODO unsure why this is here and not in _getData
                result[index] = value.toISOString();
            }
            else if ((0, types_1.isObject)(value)) {
                if (order < 2) {
                    flatten(value, result, order + 1, index + '.');
                }
                else {
                    result[index] = (0, objects_1.safeStringify)(value);
                }
            }
            else {
                result[index] = value;
            }
        }
    }
    /**
     * Whether or not this is an internal user
     * @param productService The product service
     * @param configService The config servivce
     * @returns true if internal, false otherwise
     */
    function isInternalTelemetry(productService, configService) {
        const msftInternalDomains = productService.msftInternalDomains || [];
        const internalTesting = configService.getValue('telemetry.internalTesting');
        return (0, commonProperties_1.verifyMicrosoftInternalDomain)(msftInternalDomains) || internalTesting;
    }
    function getPiiPathsFromEnvironment(paths) {
        return [paths.appRoot, paths.extensionsPath, paths.userHome.fsPath, paths.tmpDir.fsPath, paths.userDataPath];
    }
    //#region Telemetry Cleaning
    /**
     * Cleans a given stack of possible paths
     * @param stack The stack to sanitize
     * @param cleanupPatterns Cleanup patterns to remove from the stack
     * @returns The cleaned stack
     */
    function anonymizeFilePaths(stack, cleanupPatterns) {
        // Fast check to see if it is a file path to avoid doing unnecessary heavy regex work
        if (!stack || (!stack.includes('/') && !stack.includes('\\'))) {
            return stack;
        }
        let updatedStack = stack;
        const cleanUpIndexes = [];
        for (const regexp of cleanupPatterns) {
            while (true) {
                const result = regexp.exec(stack);
                if (!result) {
                    break;
                }
                cleanUpIndexes.push([result.index, regexp.lastIndex]);
            }
        }
        const nodeModulesRegex = /^[\\\/]?(node_modules|node_modules\.asar)[\\\/]/;
        const fileRegex = /(file:\/\/)?([a-zA-Z]:(\\\\|\\|\/)|(\\\\|\\|\/))?([\w-\._]+(\\\\|\\|\/))+[\w-\._]*/g;
        let lastIndex = 0;
        updatedStack = '';
        while (true) {
            const result = fileRegex.exec(stack);
            if (!result) {
                break;
            }
            // Check to see if the any cleanupIndexes partially overlap with this match
            const overlappingRange = cleanUpIndexes.some(([start, end]) => result.index < end && start < fileRegex.lastIndex);
            // anoynimize user file paths that do not need to be retained or cleaned up.
            if (!nodeModulesRegex.test(result[0]) && !overlappingRange) {
                updatedStack += stack.substring(lastIndex, result.index) + '<REDACTED: user-file-path>';
                lastIndex = fileRegex.lastIndex;
            }
        }
        if (lastIndex < stack.length) {
            updatedStack += stack.substr(lastIndex);
        }
        return updatedStack;
    }
    /**
     * Attempts to remove commonly leaked PII
     * @param property The property which will be removed if it contains user data
     * @returns The new value for the property
     */
    function removePropertiesWithPossibleUserInfo(property) {
        // If for some reason it is undefined we skip it (this shouldn't be possible);
        if (!property) {
            return property;
        }
        const userDataRegexes = [
            { label: 'Google API Key', regex: /AIza[A-Za-z0-9_\\\-]{35}/ },
            { label: 'Slack Token', regex: /xox[pbar]\-[A-Za-z0-9]/ },
            { label: 'GitHub Token', regex: /(gh[psuro]_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})/ },
            { label: 'Generic Secret', regex: /(key|token|sig|secret|signature|password|passwd|pwd|android:value)[^a-zA-Z0-9]/i },
            { label: 'CLI Credentials', regex: /((login|psexec|(certutil|psexec)\.exe).{1,50}(\s-u(ser(name)?)?\s+.{3,100})?\s-(admin|user|vm|root)?p(ass(word)?)?\s+["']?[^$\-\/\s]|(^|[\s\r\n\\])net(\.exe)?.{1,5}(user\s+|share\s+\/user:| user -? secrets ? set) \s + [^ $\s \/])/ },
            { label: 'Email', regex: /@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+/ } // Regex which matches @*.site
        ];
        // Check for common user data in the telemetry events
        for (const secretRegex of userDataRegexes) {
            if (secretRegex.regex.test(property)) {
                return `<REDACTED: ${secretRegex.label}>`;
            }
        }
        return property;
    }
    /**
     * Does a best possible effort to clean a data object from any possible PII.
     * @param data The data object to clean
     * @param paths Any additional patterns that should be removed from the data set
     * @returns A new object with the PII removed
     */
    function cleanData(data, cleanUpPatterns) {
        return (0, objects_1.cloneAndChange)(data, value => {
            // If it's a trusted value it means it's okay to skip cleaning so we don't clean it
            if (value instanceof TelemetryTrustedValue || Object.hasOwnProperty.call(value, 'isTrustedTelemetryValue')) {
                return value.value;
            }
            // We only know how to clean strings
            if (typeof value === 'string') {
                let updatedProperty = value.replaceAll('%20', ' ');
                // First we anonymize any possible file paths
                updatedProperty = anonymizeFilePaths(updatedProperty, cleanUpPatterns);
                // Then we do a simple regex replace with the defined patterns
                for (const regexp of cleanUpPatterns) {
                    updatedProperty = updatedProperty.replace(regexp, '');
                }
                // Lastly, remove commonly leaked PII
                updatedProperty = removePropertiesWithPossibleUserInfo(updatedProperty);
                return updatedProperty;
            }
            return undefined;
        });
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvY29tbW9uL3RlbGVtZXRyeVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdGaEcsOENBTUM7SUFTRCxzQ0FtQkM7SUFRRCw4Q0FxQkM7SUFVRCxzREFvQ0M7SUFJRCxvREFNQztJQW9DRCxrREFJQztJQVVELGdFQUVDO0lBOEZELDhCQTJCQztJQWhYRDs7OztPQUlHO0lBQ0gsTUFBYSxxQkFBcUI7UUFHakMsWUFBNEIsS0FBUTtZQUFSLFVBQUssR0FBTCxLQUFLLENBQUc7WUFGcEMsMEdBQTBHO1lBQzFGLDRCQUF1QixHQUFHLElBQUksQ0FBQztRQUNQLENBQUM7S0FDekM7SUFKRCxzREFJQztJQUVELE1BQWEseUJBQXlCO1FBQXRDO1lBRVUsbUJBQWMsK0JBQXVCO1lBQ3JDLGNBQVMsR0FBRyxxQkFBcUIsQ0FBQztZQUNsQyxjQUFTLEdBQUcscUJBQXFCLENBQUM7WUFDbEMsVUFBSyxHQUFHLGlCQUFpQixDQUFDO1lBQzFCLHFCQUFnQixHQUFHLDRCQUE0QixDQUFDO1lBQ2hELHVCQUFrQixHQUFHLEtBQUssQ0FBQztRQU1yQyxDQUFDO1FBTEEsU0FBUyxLQUFLLENBQUM7UUFDZixVQUFVLEtBQUssQ0FBQztRQUNoQixjQUFjLEtBQUssQ0FBQztRQUNwQixlQUFlLEtBQUssQ0FBQztRQUNyQixxQkFBcUIsS0FBSyxDQUFDO0tBQzNCO0lBYkQsOERBYUM7SUFFWSxRQUFBLG9CQUFvQixHQUFHLElBQUkseUJBQXlCLEVBQUUsQ0FBQztJQUVwRSxNQUFhLDRCQUE0QjtRQUd4QyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQTZCLEVBQUUsVUFBa0IsRUFBRSxLQUFzQjtZQUN4RixPQUFPO1FB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