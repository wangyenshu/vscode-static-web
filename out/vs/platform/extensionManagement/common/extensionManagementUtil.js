/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/process", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, strings_1, extensionManagement_1, extensions_1, platform_1, uri_1, errors_1, process_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BetterMergeId = exports.ExtensionKey = void 0;
    exports.areSameExtensions = areSameExtensions;
    exports.getIdAndVersion = getIdAndVersion;
    exports.getExtensionId = getExtensionId;
    exports.adoptToGalleryExtensionId = adoptToGalleryExtensionId;
    exports.getGalleryExtensionId = getGalleryExtensionId;
    exports.groupByExtension = groupByExtension;
    exports.getLocalExtensionTelemetryData = getLocalExtensionTelemetryData;
    exports.getGalleryExtensionTelemetryData = getGalleryExtensionTelemetryData;
    exports.getExtensionDependencies = getExtensionDependencies;
    exports.computeTargetPlatform = computeTargetPlatform;
    function areSameExtensions(a, b) {
        if (a.uuid && b.uuid) {
            return a.uuid === b.uuid;
        }
        if (a.id === b.id) {
            return true;
        }
        return (0, strings_1.compareIgnoreCase)(a.id, b.id) === 0;
    }
    const ExtensionKeyRegex = /^([^.]+\..+)-(\d+\.\d+\.\d+)(-(.+))?$/;
    class ExtensionKey {
        static create(extension) {
            const version = extension.manifest ? extension.manifest.version : extension.version;
            const targetPlatform = extension.manifest ? extension.targetPlatform : extension.properties.targetPlatform;
            return new ExtensionKey(extension.identifier, version, targetPlatform);
        }
        static parse(key) {
            const matches = ExtensionKeyRegex.exec(key);
            return matches && matches[1] && matches[2] ? new ExtensionKey({ id: matches[1] }, matches[2], matches[4] || undefined) : null;
        }
        constructor(identifier, version, targetPlatform = "undefined" /* TargetPlatform.UNDEFINED */) {
            this.version = version;
            this.targetPlatform = targetPlatform;
            this.id = identifier.id;
        }
        toString() {
            return `${this.id}-${this.version}${this.targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */ ? `-${this.targetPlatform}` : ''}`;
        }
        equals(o) {
            if (!(o instanceof ExtensionKey)) {
                return false;
            }
            return areSameExtensions(this, o) && this.version === o.version && this.targetPlatform === o.targetPlatform;
        }
    }
    exports.ExtensionKey = ExtensionKey;
    const EXTENSION_IDENTIFIER_WITH_VERSION_REGEX = /^([^.]+\..+)@((prerelease)|(\d+\.\d+\.\d+(-.*)?))$/;
    function getIdAndVersion(id) {
        const matches = EXTENSION_IDENTIFIER_WITH_VERSION_REGEX.exec(id);
        if (matches && matches[1]) {
            return [adoptToGalleryExtensionId(matches[1]), matches[2]];
        }
        return [adoptToGalleryExtensionId(id), undefined];
    }
    function getExtensionId(publisher, name) {
        return `${publisher}.${name}`;
    }
    function adoptToGalleryExtensionId(id) {
        return id.toLowerCase();
    }
    function getGalleryExtensionId(publisher, name) {
        return adoptToGalleryExtensionId(getExtensionId(publisher ?? extensions_1.UNDEFINED_PUBLISHER, name));
    }
    function groupByExtension(extensions, getExtensionIdentifier) {
        const byExtension = [];
        const findGroup = (extension) => {
            for (const group of byExtension) {
                if (group.some(e => areSameExtensions(getExtensionIdentifier(e), getExtensionIdentifier(extension)))) {
                    return group;
                }
            }
            return null;
        };
        for (const extension of extensions) {
            const group = findGroup(extension);
            if (group) {
                group.push(extension);
            }
            else {
                byExtension.push([extension]);
            }
        }
        return byExtension;
    }
    function getLocalExtensionTelemetryData(extension) {
        return {
            id: extension.identifier.id,
            name: extension.manifest.name,
            galleryId: null,
            publisherId: extension.publisherId,
            publisherName: extension.manifest.publisher,
            publisherDisplayName: extension.publisherDisplayName,
            dependencies: extension.manifest.extensionDependencies && extension.manifest.extensionDependencies.length > 0
        };
    }
    /* __GDPR__FRAGMENT__
        "GalleryExtensionTelemetryData" : {
            "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "name": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "galleryId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherDisplayName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "isPreReleaseVersion": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "dependencies": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
            "isSigned": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "${include}": [
                "${GalleryExtensionTelemetryData2}"
            ]
        }
    */
    function getGalleryExtensionTelemetryData(extension) {
        return {
            id: new telemetryUtils_1.TelemetryTrustedValue(extension.identifier.id),
            name: new telemetryUtils_1.TelemetryTrustedValue(extension.name),
            galleryId: extension.identifier.uuid,
            publisherId: extension.publisherId,
            publisherName: extension.publisher,
            publisherDisplayName: extension.publisherDisplayName,
            isPreReleaseVersion: extension.properties.isPreReleaseVersion,
            dependencies: !!(extension.properties.dependencies && extension.properties.dependencies.length > 0),
            isSigned: extension.isSigned,
            ...extension.telemetryData
        };
    }
    exports.BetterMergeId = new extensions_1.ExtensionIdentifier('pprice.better-merge');
    function getExtensionDependencies(installedExtensions, extension) {
        const dependencies = [];
        const extensions = extension.manifest.extensionDependencies?.slice(0) ?? [];
        while (extensions.length) {
            const id = extensions.shift();
            if (id && dependencies.every(e => !areSameExtensions(e.identifier, { id }))) {
                const ext = installedExtensions.filter(e => areSameExtensions(e.identifier, { id }));
                if (ext.length === 1) {
                    dependencies.push(ext[0]);
                    extensions.push(...ext[0].manifest.extensionDependencies?.slice(0) ?? []);
                }
            }
        }
        return dependencies;
    }
    async function isAlpineLinux(fileService, logService) {
        if (!platform_1.isLinux) {
            return false;
        }
        let content;
        try {
            const fileContent = await fileService.readFile(uri_1.URI.file('/etc/os-release'));
            content = fileContent.value.toString();
        }
        catch (error) {
            try {
                const fileContent = await fileService.readFile(uri_1.URI.file('/usr/lib/os-release'));
                content = fileContent.value.toString();
            }
            catch (error) {
                /* Ignore */
                logService.debug(`Error while getting the os-release file.`, (0, errors_1.getErrorMessage)(error));
            }
        }
        return !!content && (content.match(/^ID=([^\u001b\r\n]*)/m) || [])[1] === 'alpine';
    }
    async function computeTargetPlatform(fileService, logService) {
        const alpineLinux = await isAlpineLinux(fileService, logService);
        const targetPlatform = (0, extensionManagement_1.getTargetPlatform)(alpineLinux ? 'alpine' : platform_1.platform, process_1.arch);
        logService.debug('ComputeTargetPlatform:', targetPlatform);
        return targetPlatform;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudFV0aWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9leHRlbnNpb25NYW5hZ2VtZW50VXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsOENBUUM7SUF3Q0QsMENBTUM7SUFFRCx3Q0FFQztJQUVELDhEQUVDO0lBRUQsc0RBRUM7SUFFRCw0Q0FtQkM7SUFFRCx3RUFVQztJQW1CRCw0RUFhQztJQUlELDREQWlCQztJQXNCRCxzREFLQztJQW5MRCxTQUFnQixpQkFBaUIsQ0FBQyxDQUF1QixFQUFFLENBQXVCO1FBQ2pGLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdEIsT0FBTyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDMUIsQ0FBQztRQUNELElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDbkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsT0FBTyxJQUFBLDJCQUFpQixFQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsTUFBTSxpQkFBaUIsR0FBRyx1Q0FBdUMsQ0FBQztJQUVsRSxNQUFhLFlBQVk7UUFFeEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUF5QztZQUN0RCxNQUFNLE9BQU8sR0FBSSxTQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUUsU0FBd0IsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBRSxTQUErQixDQUFDLE9BQU8sQ0FBQztZQUMz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