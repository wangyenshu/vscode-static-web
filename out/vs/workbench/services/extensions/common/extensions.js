/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/common/implicitActivationEvents", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, uri_1, extensionManagementUtil_1, implicitActivationEvents_1, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullExtensionService = exports.ActivationKind = exports.ExtensionPointContribution = exports.ActivationTimes = exports.ExtensionHostExtensions = exports.ExtensionHostStartup = exports.MissingExtensionDependency = exports.IExtensionService = exports.webWorkerExtHostConfig = exports.nullExtensionDescription = void 0;
    exports.isProposedApiEnabled = isProposedApiEnabled;
    exports.checkProposedApiEnabled = checkProposedApiEnabled;
    exports.toExtension = toExtension;
    exports.toExtensionDescription = toExtensionDescription;
    exports.nullExtensionDescription = Object.freeze({
        identifier: new extensions_1.ExtensionIdentifier('nullExtensionDescription'),
        name: 'Null Extension Description',
        version: '0.0.0',
        publisher: 'vscode',
        engines: { vscode: '' },
        extensionLocation: uri_1.URI.parse('void:location'),
        isBuiltin: false,
        targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
        isUserBuiltin: false,
        isUnderDevelopment: false,
    });
    exports.webWorkerExtHostConfig = 'extensions.webWorker';
    exports.IExtensionService = (0, instantiation_1.createDecorator)('extensionService');
    class MissingExtensionDependency {
        constructor(dependency) {
            this.dependency = dependency;
        }
    }
    exports.MissingExtensionDependency = MissingExtensionDependency;
    var ExtensionHostStartup;
    (function (ExtensionHostStartup) {
        /**
         * The extension host should be launched immediately and doesn't require a `$startExtensionHost` call.
         */
        ExtensionHostStartup[ExtensionHostStartup["EagerAutoStart"] = 1] = "EagerAutoStart";
        /**
         * The extension host should be launched immediately and needs a `$startExtensionHost` call.
         */
        ExtensionHostStartup[ExtensionHostStartup["EagerManualStart"] = 2] = "EagerManualStart";
        /**
         * The extension host should be launched lazily and only when it has extensions it needs to host. It needs a `$startExtensionHost` call.
         */
        ExtensionHostStartup[ExtensionHostStartup["Lazy"] = 3] = "Lazy";
    })(ExtensionHostStartup || (exports.ExtensionHostStartup = ExtensionHostStartup = {}));
    class ExtensionHostExtensions {
        get versionId() {
            return this._versionId;
        }
        get allExtensions() {
            return this._allExtensions;
        }
        get myExtensions() {
            return this._myExtensions;
        }
        constructor(versionId, allExtensions, myExtensions) {
            this._versionId = versionId;
            this._allExtensions = allExtensions.slice(0);
            this._myExtensions = myExtensions.slice(0);
            this._myActivationEvents = null;
        }
        toSnapshot() {
            return {
                versionId: this._versionId,
                allExtensions: this._allExtensions,
                myExtensions: this._myExtensions,
                activationEvents: implicitActivationEvents_1.ImplicitActivationEvents.createActivationEventsMap(this._allExtensions)
            };
        }
        set(versionId, allExtensions, myExtensions) {
            if (this._versionId > versionId) {
                throw new Error(`ExtensionHostExtensions: invalid versionId ${versionId} (current: ${this._versionId})`);
            }
            const toRemove = [];
            const toAdd = [];
            const myToRemove = [];
            const myToAdd = [];
            const oldExtensionsMap = extensionDescriptionArrayToMap(this._allExtensions);
            const newExtensionsMap = extensionDescriptionArrayToMap(allExtensions);
            const extensionsAreTheSame = (a, b) => {
                return ((a.extensionLocation.toString() === b.extensionLocation.toString())
                    || (a.isBuiltin === b.isBuiltin)
                    || (a.isUserBuiltin === b.isUserBuiltin)
                    || (a.isUnderDevelopment === b.isUnderDevelopment));
            };
            for (const oldExtension of this._allExtensions) {
                const newExtension = newExtensionsMap.get(oldExtension.identifier);
                if (!newExtension) {
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(oldExtension.identifier);
                    continue;
                }
                if (!extensionsAreTheSame(oldExtension, newExtension)) {
                    // The new extension is different than the old one
                    // (e.g. maybe it executes in a different location)
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(oldExtension.identifier);
                    continue;
                }
            }
            for (const newExtension of allExtensions) {
                const oldExtension = oldExtensionsMap.get(newExtension.identifier);
                if (!oldExtension) {
                    toAdd.push(newExtension);
                    continue;
                }
                if (!extensionsAreTheSame(oldExtension, newExtension)) {
                    // The new extension is different than the old one
                    // (e.g. maybe it executes in a different location)
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(oldExtension.identifier);
                    continue;
                }
            }
            const myOldExtensionsSet = new extensions_1.ExtensionIdentifierSet(this._myExtensions);
            const myNewExtensionsSet = new extensions_1.ExtensionIdentifierSet(myExtensions);
            for (const oldExtensionId of this._myExtensions) {
                if (!myNewExtensionsSet.has(oldExtensionId)) {
                    myToRemove.push(oldExtensionId);
                }
            }
            for (const newExtensionId of myExtensions) {
                if (!myOldExtensionsSet.has(newExtensionId)) {
                    myToAdd.push(newExtensionId);
                }
            }
            const addActivationEvents = implicitActivationEvents_1.ImplicitActivationEvents.createActivationEventsMap(toAdd);
            const delta = { versionId, toRemove, toAdd, addActivationEvents, myToRemove, myToAdd };
            this.delta(delta);
            return delta;
        }
        delta(extensionsDelta) {
            if (this._versionId >= extensionsDelta.versionId) {
                // ignore older deltas
                return null;
            }
            const { toRemove, toAdd, myToRemove, myToAdd } = extensionsDelta;
            // First handle removals
            const toRemoveSet = new extensions_1.ExtensionIdentifierSet(toRemove);
            const myToRemoveSet = new extensions_1.ExtensionIdentifierSet(myToRemove);
            for (let i = 0; i < this._allExtensions.length; i++) {
                if (toRemoveSet.has(this._allExtensions[i].identifier)) {
                    this._allExtensions.splice(i, 1);
                    i--;
                }
            }
            for (let i = 0; i < this._myExtensions.length; i++) {
                if (myToRemoveSet.has(this._myExtensions[i])) {
                    this._myExtensions.splice(i, 1);
                    i--;
                }
            }
            // Then handle additions
            for (const extension of toAdd) {
                this._allExtensions.push(extension);
            }
            for (const extensionId of myToAdd) {
                this._myExtensions.push(extensionId);
            }
            // clear cached activation events
            this._myActivationEvents = null;
            return extensionsDelta;
        }
        containsExtension(extensionId) {
            for (const myExtensionId of this._myExtensions) {
                if (extensions_1.ExtensionIdentifier.equals(myExtensionId, extensionId)) {
                    return true;
                }
            }
            return false;
        }
        containsActivationEvent(activationEvent) {
            if (!this._myActivationEvents) {
                this._myActivationEvents = this._readMyActivationEvents();
            }
            return this._myActivationEvents.has(activationEvent);
        }
        _readMyActivationEvents() {
            const result = new Set();
            for (const extensionDescription of this._allExtensions) {
                if (!this.containsExtension(extensionDescription.identifier)) {
                    continue;
                }
                const activationEvents = implicitActivationEvents_1.ImplicitActivationEvents.readActivationEvents(extensionDescription);
                for (const activationEvent of activationEvents) {
                    result.add(activationEvent);
                }
            }
            return result;
        }
    }
    exports.ExtensionHostExtensions = ExtensionHostExtensions;
    function extensionDescriptionArrayToMap(extensions) {
        const result = new extensions_1.ExtensionIdentifierMap();
        for (const extension of extensions) {
            result.set(extension.identifier, extension);
        }
        return result;
    }
    function isProposedApiEnabled(extension, proposal) {
        if (!extension.enabledApiProposals) {
            return false;
        }
        return extension.enabledApiProposals.includes(proposal);
    }
    function checkProposedApiEnabled(extension, proposal) {
        if (!isProposedApiEnabled(extension, proposal)) {
            throw new Error(`Extension '${extension.identifier.value}' CANNOT use API proposal: ${proposal}.\nIts package.json#enabledApiProposals-property declares: ${extension.enabledApiProposals?.join(', ') ?? '[]'} but NOT ${proposal}.\n The missing proposal MUST be added and you must start in extension development mode or use the following command line switch: --enable-proposed-api ${extension.identifier.value}`);
        }
    }
    class ActivationTimes {
        constructor(codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) {
            this.codeLoadingTime = codeLoadingTime;
            this.activateCallTime = activateCallTime;
            this.activateResolvedTime = activateResolvedTime;
            this.activationReason = activationReason;
        }
    }
    exports.ActivationTimes = ActivationTimes;
    class ExtensionPointContribution {
        constructor(description, value) {
            this.description = description;
            this.value = value;
        }
    }
    exports.ExtensionPointContribution = ExtensionPointContribution;
    var ActivationKind;
    (function (ActivationKind) {
        ActivationKind[ActivationKind["Normal"] = 0] = "Normal";
        ActivationKind[ActivationKind["Immediate"] = 1] = "Immediate";
    })(ActivationKind || (exports.ActivationKind = ActivationKind = {}));
    function toExtension(extensionDescription) {
        return {
            type: extensionDescription.isBuiltin ? 0 /* ExtensionType.System */ : 1 /* ExtensionType.User */,
            isBuiltin: extensionDescription.isBuiltin || extensionDescription.isUserBuiltin,
            identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(extensionDescription.publisher, extensionDescription.name), uuid: extensionDescription.uuid },
            manifest: extensionDescription,
            location: extensionDescription.extensionLocation,
            targetPlatform: extensionDescription.targetPlatform,
            validations: [],
            isValid: true
        };
    }
    function toExtensionDescription(extension, isUnderDevelopment) {
        return {
            identifier: new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(extension.manifest.publisher, extension.manifest.name)),
            isBuiltin: extension.type === 0 /* ExtensionType.System */,
            isUserBuiltin: extension.type === 1 /* ExtensionType.User */ && extension.isBuiltin,
            isUnderDevelopment: !!isUnderDevelopment,
            extensionLocation: extension.location,
            ...extension.manifest,
            uuid: extension.identifier.uuid,
            targetPlatform: extension.targetPlatform,
            publisherDisplayName: extension.publisherDisplayName,
        };
    }
    class NullExtensionService {
        constructor() {
            this.onDidRegisterExtensions = event_1.Event.None;
            this.onDidChangeExtensionsStatus = event_1.Event.None;
            this.onDidChangeExtensions = event_1.Event.None;
            this.onWillActivateByEvent = event_1.Event.None;
            this.onDidChangeResponsiveChange = event_1.Event.None;
            this.onWillStop = event_1.Event.None;
            this.extensions = [];
        }
        activateByEvent(_activationEvent) { return Promise.resolve(undefined); }
        activateById(extensionId, reason) { return Promise.resolve(undefined); }
        activationEventIsDone(_activationEvent) { return false; }
        whenInstalledExtensionsRegistered() { return Promise.resolve(true); }
        getExtension() { return Promise.resolve(undefined); }
        readExtensionPointContributions(_extPoint) { return Promise.resolve(Object.create(null)); }
        getExtensionsStatus() { return Object.create(null); }
        getInspectPorts(_extensionHostKind, _tryEnableInspector) { return Promise.resolve([]); }
        stopExtensionHosts() { }
        async startExtensionHosts() { }
        async setRemoteEnvironment(_env) { }
        canAddExtension() { return false; }
        canRemoveExtension() { return false; }
    }
    exports.NullExtensionService = NullExtensionService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNUaEcsb0RBS0M7SUFFRCwwREFJQztJQTRORCxrQ0FXQztJQUVELHdEQVlDO0lBcmlCWSxRQUFBLHdCQUF3QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQXdCO1FBQzVFLFVBQVUsRUFBRSxJQUFJLGdDQUFtQixDQUFDLDBCQUEwQixDQUFDO1FBQy9ELElBQUksRUFBRSw0QkFBNEI7UUFDbEMsT0FBTyxFQUFFLE9BQU87UUFDaEIsU0FBUyxFQUFFLFFBQVE7UUFDbkIsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtRQUN2QixpQkFBaUIsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQztRQUM3QyxTQUFTLEVBQUUsS0FBSztRQUNoQixjQUFjLDRDQUEwQjtRQUN4QyxhQUFhLEVBQUUsS0FBSztRQUNwQixrQkFBa0IsRUFBRSxLQUFLO0tBQ3pCLENBQUMsQ0FBQztJQUdVLFFBQUEsc0JBQXNCLEdBQUcsc0JBQXNCLENBQUM7SUFFaEQsUUFBQSxpQkFBaUIsR0FBRyxJQUFBLCtCQUFlLEVBQW9CLGtCQUFrQixDQUFDLENBQUM7SUFrQnhGLE1BQWEsMEJBQTBCO1FBQ3RDLFlBQXFCLFVBQWtCO1lBQWxCLGVBQVUsR0FBVixVQUFVLENBQVE7UUFBSSxDQUFDO0tBQzVDO0lBRkQsZ0VBRUM7SUEwQ0QsSUFBa0Isb0JBYWpCO0lBYkQsV0FBa0Isb0JBQW9CO1FBQ3JDOztXQUVHO1FBQ0gsbUZBQWtCLENBQUE7UUFDbEI7O1dBRUc7UUFDSCx1RkFBb0IsQ0FBQTtRQUNwQjs7V0FFRztR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