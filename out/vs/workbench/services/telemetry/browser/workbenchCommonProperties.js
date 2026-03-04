/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uuid", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/objects", "vs/platform/telemetry/common/telemetry", "vs/base/browser/touch"], function (require, exports, Platform, uuid, telemetryUtils_1, objects_1, telemetry_1, touch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveWorkbenchCommonProperties = resolveWorkbenchCommonProperties;
    /**
     * General function to help reduce the individuality of user agents
     * @param userAgent userAgent from browser window
     * @returns A simplified user agent with less detail
     */
    function cleanUserAgent(userAgent) {
        return userAgent.replace(/(\d+\.\d+)(\.\d+)+/g, '$1');
    }
    function resolveWorkbenchCommonProperties(storageService, commit, version, isInternalTelemetry, remoteAuthority, productIdentifier, removeMachineId, resolveAdditionalProperties) {
        const result = Object.create(null);
        const firstSessionDate = storageService.get(telemetry_1.firstSessionDateStorageKey, -1 /* StorageScope.APPLICATION */);
        const lastSessionDate = storageService.get(telemetry_1.lastSessionDateStorageKey, -1 /* StorageScope.APPLICATION */);
        let machineId;
        if (!removeMachineId) {
            machineId = storageService.get(telemetry_1.machineIdKey, -1 /* StorageScope.APPLICATION */);
            if (!machineId) {
                machineId = uuid.generateUuid();
                storageService.store(telemetry_1.machineIdKey, machineId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
        }
        else {
            machineId = `Redacted-${productIdentifier ?? 'web'}`;
        }
        /**
         * Note: In the web, session date information is fetched from browser storage, so these dates are tied to a specific
         * browser and not the machine overall.
         */
        // __GDPR__COMMON__ "common.firstSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.firstSessionDate'] = firstSessionDate;
        // __GDPR__COMMON__ "common.lastSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.lastSessionDate'] = lastSessionDate || '';
        // __GDPR__COMMON__ "common.isNewSession" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.isNewSession'] = !lastSessionDate ? '1' : '0';
        // __GDPR__COMMON__ "common.remoteAuthority" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.remoteAuthority'] = (0, telemetryUtils_1.cleanRemoteAuthority)(remoteAuthority);
        // __GDPR__COMMON__ "common.machineId" : { "endPoint": "MacAddressHash", "classification": "EndUserPseudonymizedInformation", "purpose": "FeatureInsight" }
        result['common.machineId'] = machineId;
        // __GDPR__COMMON__ "sessionID" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['sessionID'] = uuid.generateUuid() + Date.now();
        // __GDPR__COMMON__ "commitHash" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['commitHash'] = commit;
        // __GDPR__COMMON__ "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['version'] = version;
        // __GDPR__COMMON__ "common.platform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.platform'] = Platform.PlatformToString(Platform.platform);
        // __GDPR__COMMON__ "common.product" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.product'] = productIdentifier ?? 'web';
        // __GDPR__COMMON__ "common.userAgent" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.userAgent'] = Platform.userAgent ? cleanUserAgent(Platform.userAgent) : undefined;
        // __GDPR__COMMON__ "common.isTouchDevice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.isTouchDevice'] = String(touch_1.Gesture.isTouchDevice());
        if (isInternalTelemetry) {
            // __GDPR__COMMON__ "common.msftInternal" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            result['common.msftInternal'] = isInternalTelemetry;
        }
        // dynamic properties which value differs on each call
        let seq = 0;
        const startTime = Date.now();
        Object.defineProperties(result, {
            // __GDPR__COMMON__ "timestamp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            'timestamp': {
                get: () => new Date(),
                enumerable: true
            },
            // __GDPR__COMMON__ "common.timesincesessionstart" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            'common.timesincesessionstart': {
                get: () => Date.now() - startTime,
                enumerable: true
            },
            // __GDPR__COMMON__ "common.sequence" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            'common.sequence': {
                get: () => seq++,
                enumerable: true
            }
        });
        if (resolveAdditionalProperties) {
            (0, objects_1.mixin)(result, resolveAdditionalProperties());
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoQ29tbW9uUHJvcGVydGllcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZWxlbWV0cnkvYnJvd3Nlci93b3JrYmVuY2hDb21tb25Qcm9wZXJ0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyw0RUF1RkM7SUFoR0Q7Ozs7T0FJRztJQUNILFNBQVMsY0FBYyxDQUFDLFNBQWlCO1FBQ3hDLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsU0FBZ0IsZ0NBQWdDLENBQy9DLGNBQStCLEVBQy9CLE1BQTBCLEVBQzFCLE9BQTJCLEVBQzNCLG1CQUE0QixFQUM1QixlQUF3QixFQUN4QixpQkFBMEIsRUFDMUIsZUFBeUIsRUFDekIsMkJBQTBEO1FBRTFELE1BQU0sTUFBTSxHQUFzQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RELE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxzQ0FBMEIsb0NBQTRCLENBQUM7UUFDbkcsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxxQ0FBeUIsb0NBQTRCLENBQUM7UUFFakcsSUFBSSxTQUE2QixDQUFDO1FBQ2xDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN0QixTQUFTLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyx3QkFBWSxvQ0FBMkIsQ0FBQztZQUN2RSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ2hDLGNBQWMsQ0FBQyxLQUFLLENBQUMsd0JBQVksRUFBRSxTQUFTLG1FQUFrRCxD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