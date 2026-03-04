/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/uuid"], function (require, exports, platform_1, process_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveCommonProperties = resolveCommonProperties;
    exports.verifyMicrosoftInternalDomain = verifyMicrosoftInternalDomain;
    function getPlatformDetail(hostname) {
        if (platform_1.platform === 2 /* Platform.Linux */ && /^penguin(\.|$)/i.test(hostname)) {
            return 'chromebook';
        }
        return undefined;
    }
    function resolveCommonProperties(release, hostname, arch, commit, version, machineId, sqmId, isInternalTelemetry, product) {
        const result = Object.create(null);
        // __GDPR__COMMON__ "common.machineId" : { "endPoint": "MacAddressHash", "classification": "EndUserPseudonymizedInformation", "purpose": "FeatureInsight" }
        result['common.machineId'] = machineId;
        // __GDPR__COMMON__ "common.sqmId" : { "endPoint": "SqmMachineId", "classification": "EndUserPseudonymizedInformation", "purpose": "BusinessInsight" }
        result['common.sqmId'] = sqmId;
        // __GDPR__COMMON__ "sessionID" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['sessionID'] = (0, uuid_1.generateUuid)() + Date.now();
        // __GDPR__COMMON__ "commitHash" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['commitHash'] = commit;
        // __GDPR__COMMON__ "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['version'] = version;
        // __GDPR__COMMON__ "common.platformVersion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.platformVersion'] = (release || '').replace(/^(\d+)(\.\d+)?(\.\d+)?(.*)/, '$1$2$3');
        // __GDPR__COMMON__ "common.platform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.platform'] = (0, platform_1.PlatformToString)(platform_1.platform);
        // __GDPR__COMMON__ "common.nodePlatform" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.nodePlatform'] = process_1.platform;
        // __GDPR__COMMON__ "common.nodeArch" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.nodeArch'] = arch;
        // __GDPR__COMMON__ "common.product" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.product'] = product || 'desktop';
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
        if (platform_1.isLinuxSnap) {
            // __GDPR__COMMON__ "common.snap" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.snap'] = 'true';
        }
        const platformDetail = getPlatformDetail(hostname);
        if (platformDetail) {
            // __GDPR__COMMON__ "common.platformDetail" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.platformDetail'] = platformDetail;
        }
        return result;
    }
    function verifyMicrosoftInternalDomain(domainList) {
        const userDnsDomain = process_1.env['USERDNSDOMAIN'];
        if (!userDnsDomain) {
            return false;
        }
        const domain = userDnsDomain.toLowerCase();
        return domainList.some(msftDomain => domain === msftDomain);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uUHJvcGVydGllcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9jb21tb24vY29tbW9uUHJvcGVydGllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRywwREF5RUM7SUFFRCxzRUFRQztJQTNGRCxTQUFTLGlCQUFpQixDQUFDLFFBQWdCO1FBQzFDLElBQUksbUJBQVEsMkJBQW1CLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDckUsT0FBTyxZQUFZLENBQUM7UUFDckIsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxTQUFnQix1QkFBdUIsQ0FDdEMsT0FBZSxFQUNmLFFBQWdCLEVBQ2hCLElBQVksRUFDWixNQUEwQixFQUMxQixPQUEyQixFQUMzQixTQUE2QixFQUM3QixLQUF5QixFQUN6QixtQkFBNEIsRUFDNUIsT0FBZ0I7UUFFaEIsTUFBTSxNQUFNLEdBQXNCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdEQsMkpBQTJKO1FBQzNKLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUN2QyxzSkFBc0o7UUFDdEosTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUMvQixxR0FBcUc7UUFDckcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUEsbUJBQVksR0FBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNsRCw0R0FBNEc7UUFDNUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUM5QixtR0FBbUc7UUFDbkcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztRQUM1QixrSEFBa0g7UUFDbEgsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLDRCQUE0QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ25HLDJHQUEyRztRQUMzRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxJQUFBLDJCQUFnQixFQUFDLG1CQUFRLENBQUMsQ0FBQztRQUN2RCxxSEFBcUg7UUFDckgsTUFBTSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsa0JBQVksQ0FBQztRQUM3QyxpSEFBaUg7UUFDakgsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ2pDLGdIQUFnSDtRQUNoSCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxPQUFPLElBQUksU0FBUyxDQUFDO1FBRWhELElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQUN6QixzSUFBc0k7WUFDdEksTUFBTSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsbUJBQW1CLENBQUM7UUFDckQsQ0FBQztRQUVELHNEQUFzRDtRQUN0RCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDWixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDN0IsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRTtZQUMvQixxR0FBcUc7WUFDckcsV0FBVyxFQUFFO2dCQUNaLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRTtnQkFDckIsVUFBVSxFQUFFLElBQUk7YUFDaEI7WUFDRCwrSUFBK0k7WUFDL0ksOEJBQThCLEVBQUU7Z0JBQy9CLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUztnQkFDakMsVUFBVSxFQUFFLElBQUk7YUFDaEI7WUFDRCxrSUFBa0k7WUFDbEksaUJBQWlCLEVBQUU7Z0JBQ2xCLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2hCLFVBQVUsRUFBRSxJQUFJO2FBQ2hCO1NBQ0QsQ0FBQyxDQUFDO1FBRUgsSUFBSSxzQkFBVyxFQUFFLENBQUM7WUFDakIsdUdBQXVHO1lBQ3ZHLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxNQUFNLENBQUM7UUFDaEMsQ0FBQztRQUVELE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRW5ELElBQUksY0FBYyxFQUFFLENBQUM7WUFDcEIsaUhBQWlIO1lBQ2pILE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLGNBQWMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBZ0IsNkJBQTZCLENBQUMsVUFBNkI7UUFDMUUsTUFBTSxhQUFhLEdBQUcsYUFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNwQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDM0MsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsTUFBTSxLQUFLLFVBQVUsQ0FBQyxDQUFDO0lBQzdELENBQUMifQ==