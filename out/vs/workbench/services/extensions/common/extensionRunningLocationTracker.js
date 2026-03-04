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
define(["require", "exports", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensionHostKind", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensionRunningLocation"], function (require, exports, network_1, configuration_1, extensions_1, log_1, environmentService_1, extensionHostKind_1, extensionManifestPropertiesService_1, extensionRunningLocation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRunningLocationTracker = void 0;
    exports.filterExtensionDescriptions = filterExtensionDescriptions;
    exports.filterExtensionIdentifiers = filterExtensionIdentifiers;
    let ExtensionRunningLocationTracker = class ExtensionRunningLocationTracker {
        get maxLocalProcessAffinity() {
            return this._maxLocalProcessAffinity;
        }
        get maxLocalWebWorkerAffinity() {
            return this._maxLocalWebWorkerAffinity;
        }
        constructor(_registry, _extensionHostKindPicker, _environmentService, _configurationService, _logService, _extensionManifestPropertiesService) {
            this._registry = _registry;
            this._extensionHostKindPicker = _extensionHostKindPicker;
            this._environmentService = _environmentService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._extensionManifestPropertiesService = _extensionManifestPropertiesService;
            this._runningLocation = new extensions_1.ExtensionIdentifierMap();
            this._maxLocalProcessAffinity = 0;
            this._maxLocalWebWorkerAffinity = 0;
        }
        set(extensionId, runningLocation) {
            this._runningLocation.set(extensionId, runningLocation);
        }
        readExtensionKinds(extensionDescription) {
            if (extensionDescription.isUnderDevelopment && this._environmentService.extensionDevelopmentKind) {
                return this._environmentService.extensionDevelopmentKind;
            }
            return this._extensionManifestPropertiesService.getExtensionKind(extensionDescription);
        }
        getRunningLocation(extensionId) {
            return this._runningLocation.get(extensionId) || null;
        }
        filterByRunningLocation(extensions, desiredRunningLocation) {
            return filterExtensionDescriptions(extensions, this._runningLocation, extRunningLocation => desiredRunningLocation.equals(extRunningLocation));
        }
        filterByExtensionHostKind(extensions, desiredExtensionHostKind) {
            return filterExtensionDescriptions(extensions, this._runningLocation, extRunningLocation => extRunningLocation.kind === desiredExtensionHostKind);
        }
        filterByExtensionHostManager(extensions, extensionHostManager) {
            return filterExtensionDescriptions(extensions, this._runningLocation, extRunningLocation => extensionHostManager.representsRunningLocation(extRunningLocation));
        }
        _computeAffinity(inputExtensions, extensionHostKind, isInitialAllocation) {
            // Only analyze extensions that can execute
            const extensions = new extensions_1.ExtensionIdentifierMap();
            for (const extension of inputExtensions) {
                if (extension.main || extension.browser) {
                    extensions.set(extension.identifier, extension);
                }
            }
            // Also add existing extensions of the same kind that can execute
            for (const extension of this._registry.getAllExtensionDescriptions()) {
                if (extension.main || extension.browser) {
                    const runningLocation = this._runningLocation.get(extension.identifier);
                    if (runningLocation && runningLocation.kind === extensionHostKind) {
                        extensions.set(extension.identifier, extension);
                    }
                }
            }
            // Initially, each extension belongs to its own group
            const groups = new extensions_1.ExtensionIdentifierMap();
            let groupNumber = 0;
            for (const [_, extension] of extensions) {
                groups.set(extension.identifier, ++groupNumber);
            }
            const changeGroup = (from, to) => {
                for (const [key, group] of groups) {
                    if (group === from) {
                        groups.set(key, to);
                    }
                }
            };
            // We will group things together when there are dependencies
            for (const [_, extension] of extensions) {
                if (!extension.extensionDependencies) {
                    continue;
                }
                const myGroup = groups.get(extension.identifier);
                for (const depId of extension.extensionDependencies) {
                    const depGroup = groups.get(depId);
                    if (!depGroup) {
                        // probably can't execute, so it has no impact
                        continue;
                    }
                    if (depGroup === myGroup) {
                        // already in the same group
                        continue;
                    }
                    changeGroup(depGroup, myGroup);
                }
            }
            // Initialize with existing affinities
            const resultingAffinities = new Map();
            let lastAffinity = 0;
            for (const [_, extension] of extensions) {
                const runningLocation = this._runningLocation.get(extension.identifier);
                if (runningLocation) {
                    const group = groups.get(extension.identifier);
                    resultingAffinities.set(group, runningLocation.affinity);
                    lastAffinity = Math.max(lastAffinity, runningLocation.affinity);
                }
            }
            // When doing extension host debugging, we will ignore the configured affinity
            // because we can currently debug a single extension host
            if (!this._environmentService.isExtensionDevelopment) {
                // Go through each configured affinity and try to accomodate it
                const configuredAffinities = this._configurationService.getValue('extensions.experimental.affinity') || {};
                const configuredExtensionIds = Object.keys(configuredAffinities);
                const configuredAffinityToResultingAffinity = new Map();
                for (const extensionId of configuredExtensionIds) {
                    const configuredAffinity = configuredAffinities[extensionId];
                    if (typeof configuredAffinity !== 'number' || configuredAffinity <= 0 || Math.floor(configuredAffinity) !== configuredAffinity) {
                        this._logService.info(`Ignoring configured affinity for '${extensionId}' because the value is not a positive integer.`);
                        continue;
                    }
                    const group = groups.get(extensionId);
                    if (!group) {
                        // The extension is not known or cannot execute for this extension host kind
                        continue;
                    }
                    const affinity1 = resultingAffinities.get(group);
                    if (affinity1) {
                        // Affinity for this group is already established
                        configuredAffinityToResultingAffinity.set(configuredAffinity, affinity1);
                        continue;
                    }
                    const affinity2 = configuredAffinityToResultingAffinity.get(configuredAffinity);
                    if (affinity2) {
                        // Affinity for this configuration is already established
                        resultingAffinities.set(group, affinity2);
                        continue;
                    }
                    if (!isInitialAllocation) {
                        this._logService.info(`Ignoring configured affinity for '${extensionId}' because extension host(s) are already running. Reload window.`);
                        continue;
                    }
                    const affinity3 = ++lastAffinity;
                    configuredAffinityToResultingAffinity.set(configuredAffinity, affinity3);
                    resultingAffinities.set(group, affinity3);
                }
            }
            const result = new extensions_1.ExtensionIdentifierMap();
            for (const extension of inputExtensions) {
                const group = groups.get(extension.identifier) || 0;
                const affinity = resultingAffinities.get(group) || 0;
                result.set(extension.identifier, affinity);
            }
            if (lastAffinity > 0 && isInitialAllocation) {
                for (let affinity = 1; affinity <= lastAffinity; affinity++) {
                    const extensionIds = [];
                    for (const extension of inputExtensions) {
                        if (result.get(extension.identifier) === affinity) {
                            extensionIds.push(extension.identifier);
                        }
                    }
                    this._logService.info(`Placing extension(s) ${extensionIds.map(e => e.value).join(', ')} on a separate extension host.`);
                }
            }
            return { affinities: result, maxAffinity: lastAffinity };
        }
        computeRunningLocation(localExtensions, remoteExtensions, isInitialAllocation) {
            return this._doComputeRunningLocation(this._runningLocation, localExtensions, remoteExtensions, isInitialAllocation).runningLocation;
        }
        _doComputeRunningLocation(existingRunningLocation, localExtensions, remoteExtensions, isInitialAllocation) {
            // Skip extensions that have an existing running location
            localExtensions = localExtensions.filter(extension => !existingRunningLocation.has(extension.identifier));
            remoteExtensions = remoteExtensions.filter(extension => !existingRunningLocation.has(extension.identifier));
            const extensionHostKinds = (0, extensionHostKind_1.determineExtensionHostKinds)(localExtensions, remoteExtensions, (extension) => this.readExtensionKinds(extension), (extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference) => this._extensionHostKindPicker.pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference));
            const extensions = new extensions_1.ExtensionIdentifierMap();
            for (const extension of localExtensions) {
                extensions.set(extension.identifier, extension);
            }
            for (const extension of remoteExtensions) {
                extensions.set(extension.identifier, extension);
            }
            const result = new extensions_1.ExtensionIdentifierMap();
            const localProcessExtensions = [];
            const localWebWorkerExtensions = [];
            for (const [extensionIdKey, extensionHostKind] of extensionHostKinds) {
                let runningLocation = null;
                if (extensionHostKind === 1 /* ExtensionHostKind.LocalProcess */) {
                    const extensionDescription = extensions.get(extensionIdKey);
                    if (extensionDescription) {
                        localProcessExtensions.push(extensionDescription);
                    }
                }
                else if (extensionHostKind === 2 /* ExtensionHostKind.LocalWebWorker */) {
                    const extensionDescription = extensions.get(extensionIdKey);
                    if (extensionDescription) {
                        localWebWorkerExtensions.push(extensionDescription);
                    }
                }
                else if (extensionHostKind === 3 /* ExtensionHostKind.Remote */) {
                    runningLocation = new extensionRunningLocation_1.RemoteRunningLocation();
                }
                result.set(extensionIdKey, runningLocation);
            }
            const { affinities, maxAffinity } = this._computeAffinity(localProcessExtensions, 1 /* ExtensionHostKind.LocalProcess */, isInitialAllocation);
            for (const extension of localProcessExtensions) {
                const affinity = affinities.get(extension.identifier) || 0;
                result.set(extension.identifier, new extensionRunningLocation_1.LocalProcessRunningLocation(affinity));
            }
            const { affinities: localWebWorkerAffinities, maxAffinity: maxLocalWebWorkerAffinity } = this._computeAffinity(localWebWorkerExtensions, 2 /* ExtensionHostKind.LocalWebWorker */, isInitialAllocation);
            for (const extension of localWebWorkerExtensions) {
                const affinity = localWebWorkerAffinities.get(extension.identifier) || 0;
                result.set(extension.identifier, new extensionRunningLocation_1.LocalWebWorkerRunningLocation(affinity));
            }
            // Add extensions that already have an existing running location
            for (const [extensionIdKey, runningLocation] of existingRunningLocation) {
                if (runningLocation) {
                    result.set(extensionIdKey, runningLocation);
                }
            }
            return { runningLocation: result, maxLocalProcessAffinity: maxAffinity, maxLocalWebWorkerAffinity: maxLocalWebWorkerAffinity };
        }
        initializeRunningLocation(localExtensions, remoteExtensions) {
            const { runningLocation, maxLocalProcessAffinity, maxLocalWebWorkerAffinity } = this._doComputeRunningLocation(this._runningLocation, localExtensions, remoteExtensions, true);
            this._runningLocation = runningLocation;
            this._maxLocalProcessAffinity = maxLocalProcessAffinity;
            this._maxLocalWebWorkerAffinity = maxLocalWebWorkerAffinity;
        }
        /**
         * Returns the running locations for the removed extensions.
         */
        deltaExtensions(toAdd, toRemove) {
            // Remove old running location
            const removedRunningLocation = new extensions_1.ExtensionIdentifierMap();
            for (const extensionId of toRemove) {
                const extensionKey = extensionId;
                removedRunningLocation.set(extensionKey, this._runningLocation.get(extensionKey) || null);
                this._runningLocation.delete(extensionKey);
            }
            // Determine new running location
            this._updateRunningLocationForAddedExtensions(toAdd);
            return removedRunningLocation;
        }
        /**
         * Update `this._runningLocation` with running locations for newly enabled/installed extensions.
         */
        _updateRunningLocationForAddedExtensions(toAdd) {
            // Determine new running location
            const localProcessExtensions = [];
            const localWebWorkerExtensions = [];
            for (const extension of toAdd) {
                const extensionKind = this.readExtensionKinds(extension);
                const isRemote = extension.extensionLocation.scheme === network_1.Schemas.vscodeRemote;
                const extensionHostKind = this._extensionHostKindPicker.pickExtensionHostKind(extension.identifier, extensionKind, !isRemote, isRemote, 0 /* ExtensionRunningPreference.None */);
                let runningLocation = null;
                if (extensionHostKind === 1 /* ExtensionHostKind.LocalProcess */) {
                    localProcessExtensions.push(extension);
                }
                else if (extensionHostKind === 2 /* ExtensionHostKind.LocalWebWorker */) {
                    localWebWorkerExtensions.push(extension);
                }
                else if (extensionHostKind === 3 /* ExtensionHostKind.Remote */) {
                    runningLocation = new extensionRunningLocation_1.RemoteRunningLocation();
                }
                this._runningLocation.set(extension.identifier, runningLocation);
            }
            const { affinities } = this._computeAffinity(localProcessExtensions, 1 /* ExtensionHostKind.LocalProcess */, false);
            for (const extension of localProcessExtensions) {
                const affinity = affinities.get(extension.identifier) || 0;
                this._runningLocation.set(extension.identifier, new extensionRunningLocation_1.LocalProcessRunningLocation(affinity));
            }
            const { affinities: webWorkerExtensionsAffinities } = this._computeAffinity(localWebWorkerExtensions, 2 /* ExtensionHostKind.LocalWebWorker */, false);
            for (const extension of localWebWorkerExtensions) {
                const affinity = webWorkerExtensionsAffinities.get(extension.identifier) || 0;
                this._runningLocation.set(extension.identifier, new extensionRunningLocation_1.LocalWebWorkerRunningLocation(affinity));
            }
        }
    };
    exports.ExtensionRunningLocationTracker = ExtensionRunningLocationTracker;
    exports.ExtensionRunningLocationTracker = ExtensionRunningLocationTracker = __decorate([
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, log_1.ILogService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], ExtensionRunningLocationTracker);
    function filterExtensionDescriptions(extensions, runningLocation, predicate) {
        return extensions.filter((ext) => {
            const extRunningLocation = runningLocation.get(ext.identifier);
            return extRunningLocation && predicate(extRunningLocation);
        });
    }
    function filterExtensionIdentifiers(extensions, runningLocation, predicate) {
        return extensions.filter((ext) => {
            const extRunningLocation = runningLocation.get(ext);
            return extRunningLocation && predicate(extRunningLocation);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUnVubmluZ0xvY2F0aW9uVHJhY2tlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25SdW5uaW5nTG9jYXRpb25UcmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFVaEcsa0VBS0M7SUFFRCxnRUFLQztJQW5VTSxJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUErQjtRQU0zQyxJQUFXLHVCQUF1QjtZQUNqQyxPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztRQUN0QyxDQUFDO1FBRUQsSUFBVyx5QkFBeUI7WUFDbkMsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUM7UUFDeEMsQ0FBQztRQUVELFlBQ2tCLFNBQWdELEVBQ2hELHdCQUFrRCxFQUNyQyxtQkFBa0UsRUFDekUscUJBQTZELEVBQ3ZFLFdBQXlDLEVBQ2pCLG1DQUF5RjtZQUw3RyxjQUFTLEdBQVQsU0FBUyxDQUF1QztZQUNoRCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3BCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFDeEQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNBLHdDQUFtQyxHQUFuQyxtQ0FBbUMsQ0FBcUM7WUFsQnZILHFCQUFnQixHQUFHLElBQUksbUNBQXNCLEVBQW1DLENBQUM7WUFDakYsNkJBQXdCLEdBQVcsQ0FBQyxDQUFDO1lBQ3JDLCtCQUEwQixHQUFXLENBQUMsQ0FBQztRQWlCM0MsQ0FBQztRQUVFLEdBQUcsQ0FBQyxXQUFnQyxFQUFFLGVBQXlDO1lBQ3JGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFTSxrQkFBa0IsQ0FBQyxvQkFBMkM7WUFDcEUsSUFBSSxvQkFBb0IsQ0FBQyxrQkFBa0IsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDbEcsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsd0JBQXdCLENBQUM7WUFDMUQsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLG1DQUFtQyxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVNLGtCQUFrQixDQUFDLFdBQWdDO1lBQ3pELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDdkQsQ0FBQztRQUVNLHVCQUF1QixDQUFDLFVBQTRDLEVBQUUsc0JBQWdEO1lBQzVILE9BQU8sMkJBQTJCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUNoSixDQUFDO1FBRU0seUJBQXlCLENBQUMsVUFBNEMsRUFBRSx3QkFBMkM7WUFDekgsT0FBTywyQkFBMkIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEtBQUssd0JBQXdCLENBQUMsQ0FBQztRQUNuSixDQUFDO1FBRU0sNEJBQTRCLENBQUMsVUFBNEMsRUFBRSxvQkFBMkM7WUFDNUgsT0FBTywyQkFBMkIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyx5QkFBeUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDakssQ0FBQztRQUVPLGdCQUFnQixDQUFDLGVBQXdDLEVBQUUsaUJBQW9DLEVBQUUsbUJBQTRCO1lBQ3BJLDJDQUEyQztZQUMzQyxNQUFNLFVBQVUsR0FBRyxJQUFJLG1DQUFzQixFQUF5QixDQUFDO1lBQ3ZFLEtBQUssTUFBTSxTQUFTLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3pDLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3pDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDakQsQ0FBQztZQUNGLENBQUM7WUFDRCxpRUFBaUU7WUFDakUsS0FBSyxNQUFNLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLDJCQUEyQixFQUFFLEVBQUUsQ0FBQztnQkFDdEUsSUFBSSxTQUFTLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDekMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ3hFLElBQUksZUFBZSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEtBQUssaUJBQWlCLEVBQUUsQ0FBQzt3QkFDbkUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUNqRCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQscURBQXFEO1lBQ3JELE1BQU0sTUFBTSxHQUFHLElBQUksbUNBQXNCLEVBQVUsQ0FBQztZQUNwRCxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7WUFDcEIsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBVSxFQUFFLEVBQUU7Z0JBQ2hELEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFDbkMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7d0JBQ3BCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUNyQixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUM7WUFFRiw0REFBNEQ7WUFDNUQsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ3RDLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUUsQ0FBQztnQkFDbEQsS0FBSyxNQUFNLEtBQUssSUFBSSxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDckQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNmLDhDQUE4Qzt3QkFDOUMsU0FBUztvQkFDVixDQUFDO29CQUVELElBQUksUUFBUSxLQUFLLE9BQU8sRUFBRSxDQUFDO3dCQUMxQiw0QkFBNEI7d0JBQzVCLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxXQUFXLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQztZQUVELHNDQUFzQztZQUN0QyxNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQ3RELElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztZQUNyQixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN4RSxJQUFJLGVBQWUsRUFBRSxDQUFDO29CQUNyQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUUsQ0FBQztvQkFDaEQsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3pELFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pFLENBQUM7WUFDRixDQUFDO1lBRUQsOEVBQThFO1lBQzlFLHlEQUF5RDtZQUN6RCxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ3RELCtEQUErRDtnQkFDL0QsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFnRCxrQ0FBa0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDMUosTUFBTSxzQkFBc0IsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQ2pFLE1BQU0scUNBQXFDLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7Z0JBQ3hFLEtBQUssTUFBTSxXQUFXLElBQUksc0JBQXNCLEVBQUUsQ0FBQztvQkFDbEQsTUFBTSxrQkFBa0IsR0FBRyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDN0QsSUFBSSxPQUFPLGtCQUFrQixLQUFLLFFBQVEsSUFBSSxrQkFBa0IsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLGtCQUFrQixFQUFFLENBQUM7d0JBQ2hJLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxXQUFXLGdEQUFnRCxDQUFDLENBQUM7d0JBQ3hILFNBQVM7b0JBQ1YsQ0FBQztvQkFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUN0QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ1osNEVBQTRFO3dCQUM1RSxTQUFTO29CQUNWLENBQUM7b0JBRUQsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqRCxJQUFJLFNBQVMsRUFBRSxDQUFDO3dCQUNmLGlEQUFpRDt3QkFDakQscUNBQXFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUN6RSxTQUFTO29CQUNWLENBQUM7b0JBRUQsTUFBTSxTQUFTLEdBQUcscUNBQXFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0JBQ2hGLElBQUksU0FBUyxFQUFFLENBQUM7d0JBQ2YseURBQXlEO3dCQUN6RCxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUMxQyxTQUFTO29CQUNWLENBQUM7b0JBRUQsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7d0JBQzFCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxXQUFXLGlFQUFpRSxDQUFDLENBQUM7d0JBQ3pJLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxNQUFNLFNBQVMsR0FBRyxFQUFFLFlBQVksQ0FBQztvQkFDakMscUNBQXFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUN6RSxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMzQyxDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksbUNBQXNCLEVBQVUsQ0FBQztZQUNwRCxLQUFLLE1BQU0sU0FBUyxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBRUQsSUFBSSxZQUFZLEdBQUcsQ0FBQyxJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBQzdDLEtBQUssSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLFFBQVEsSUFBSSxZQUFZLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQztvQkFDN0QsTUFBTSxZQUFZLEdBQTBCLEVBQUUsQ0FBQztvQkFDL0MsS0FBSyxNQUFNLFNBQVMsSUFBSSxlQUFlLEVBQUUsQ0FBQzt3QkFDekMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDbkQsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3pDLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLENBQUM7Z0JBQzFILENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxDQUFDO1FBQzFELENBQUM7UUFFTSxzQkFBc0IsQ0FBQyxlQUF3QyxFQUFFLGdCQUF5QyxFQUFFLG1CQUE0QjtZQUM5SSxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixFQUFFLG1CQUFtQixDQUFDLENBQUMsZUFBZSxDQUFDO1FBQ3RJLENBQUM7UUFFTyx5QkFBeUIsQ0FBQyx1QkFBZ0YsRUFBRSxlQUF3QyxFQUFFLGdCQUF5QyxFQUFFLG1CQUE0QjtZQUNwTyx5REFBeUQ7WUFDekQsZUFBZSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUMxRyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUU1RyxNQUFNLGtCQUFrQixHQUFHLElBQUEsK0NBQTJCLEVBQ3JELGVBQWUsRUFDZixnQkFBZ0IsRUFDaEIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsRUFDakQsQ0FBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUUsVUFBVSxDQUFDLENBQzNOLENBQUM7WUFFRixNQUFNLFVBQVUsR0FBRyxJQUFJLG1DQUFzQixFQUF5QixDQUFDO1lBQ3ZFLEtBQUssTUFBTSxTQUFTLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3pDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBQ0QsS0FBSyxNQUFNLFNBQVMsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMxQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksbUNBQXNCLEVBQW1DLENBQUM7WUFDN0UsTUFBTSxzQkFBc0IsR0FBNEIsRUFBRSxDQUFDO1lBQzNELE1BQU0sd0JBQXdCLEdBQTRCLEVBQUUsQ0FBQztZQUM3RCxLQUFLLE1BQU0sQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUN0RSxJQUFJLGVBQWUsR0FBb0MsSUFBSSxDQUFDO2dCQUM1RCxJQUFJLGlCQUFpQiwyQ0FBbUMsRUFBRSxDQUFDO29CQUMxRCxNQUFNLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQzVELElBQUksb0JBQW9CLEVBQUUsQ0FBQzt3QkFDMUIsc0JBQXNCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7b0JBQ25ELENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxJQUFJLGlCQUFpQiw2Q0FBcUMsRUFBRSxDQUFDO29CQUNuRSxNQUFNLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQzVELElBQUksb0JBQW9CLEVBQUUsQ0FBQzt3QkFDMUIsd0JBQXdCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7b0JBQ3JELENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxJQUFJLGlCQUFpQixxQ0FBNkIsRUFBRSxDQUFDO29CQUMzRCxlQUFlLEdBQUcsSUFBSSxnREFBcUIsRUFBRSxDQUFDO2dCQUMvQyxDQUFDO2dCQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFFRCxNQUFNLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsMENBQWtDLG1CQUFtQixDQUFDLENBQUM7WUFDdkksS0FBSyxNQUFNLFNBQVMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNELE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLHNEQUEyQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDN0UsQ0FBQztZQUNELE1BQU0sRUFBRSxVQUFVLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLHlCQUF5QixFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHdCQUF3Qiw0Q0FBb0MsbUJBQW1CLENBQUMsQ0FBQztZQUNoTSxLQUFLLE1BQU0sU0FBUyxJQUFJLHdCQUF3QixFQUFFLENBQUM7Z0JBQ2xELE1BQU0sUUFBUSxHQUFHLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSx3REFBNkIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQy9FLENBQUM7WUFFRCxnRUFBZ0U7WUFDaEUsS0FBSyxNQUFNLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxJQUFJLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3pFLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3JCLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSx5QkFBeUIsRUFBRSx5QkFBeUIsRUFBRSxDQUFDO1FBQ2hJLENBQUM7UUFFTSx5QkFBeUIsQ0FBQyxlQUF3QyxFQUFFLGdCQUF5QztZQUNuSCxNQUFNLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixFQUFFLHlCQUF5QixFQUFFLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0ssSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUN4QyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsdUJBQXVCLENBQUM7WUFDeEQsSUFBSSxDQUFDLDBCQUEwQixHQUFHLHlCQUF5QixDQUFDO1FBQzdELENBQUM7UUFFRDs7V0FFRztRQUNJLGVBQWUsQ0FBQyxLQUE4QixFQUFFLFFBQStCO1lBQ3JGLDhCQUE4QjtZQUM5QixNQUFNLHNCQUFzQixHQUFHLElBQUksbUNBQXNCLEVBQW1DLENBQUM7WUFDN0YsS0FBSyxNQUFNLFdBQVcsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDO2dCQUNqQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7Z0JBQzFGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELGlDQUFpQztZQUNqQyxJQUFJLENBQUMsd0NBQXdDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFckQsT0FBTyxzQkFBc0IsQ0FBQztRQUMvQixDQUFDO1FBRUQ7O1dBRUc7UUFDSyx3Q0FBd0MsQ0FBQyxLQUE4QjtZQUM5RSxpQ0FBaUM7WUFDakMsTUFBTSxzQkFBc0IsR0FBNEIsRUFBRSxDQUFDO1lBQzNELE1BQU0sd0JBQXdCLEdBQTRCLEVBQUUsQ0FBQztZQUM3RCxLQUFLLE1BQU0sU0FBUyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMvQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxZQUFZLENBQUM7Z0JBQzdFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsMENBQWtDLENBQUM7Z0JBQ3pLLElBQUksZUFBZSxHQUFvQyxJQUFJLENBQUM7Z0JBQzVELElBQUksaUJBQWlCLDJDQUFtQyxFQUFFLENBQUM7b0JBQzFELHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztxQkFBTSxJQUFJLGlCQUFpQiw2Q0FBcUMsRUFBRSxDQUFDO29CQUNuRSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzFDLENBQUM7cUJBQU0sSUFBSSxpQkFBaUIscUNBQTZCLEVBQUUsQ0FBQztvQkFDM0QsZUFBZSxHQUFHLElBQUksZ0RBQXFCLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQztnQkFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDbEUsQ0FBQztZQUVELE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLDBDQUFrQyxLQUFLLENBQUMsQ0FBQztZQUM1RyxLQUFLLE1BQU0sU0FBUyxJQUFJLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2hELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksc0RBQTJCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM1RixDQUFDO1lBRUQsTUFBTSxFQUFFLFVBQVUsRUFBRSw2QkFBNkIsRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyx3QkFBd0IsNENBQW9DLEtBQUssQ0FBQyxDQUFDO1lBQy9JLEtBQUssTUFBTSxTQUFTLElBQUksd0JBQXdCLEVBQUUsQ0FBQztnQkFDbEQsTUFBTSxRQUFRLEdBQUcsNkJBQTZCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLHdEQUE2QixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDOUYsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBclRZLDBFQUErQjs4Q0FBL0IsK0JBQStCO1FBaUJ6QyxXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSx3RUFBbUMsQ0FBQTtPQXBCekIsK0JBQStCLENBcVQzQztJQUVELFNBQWdCLDJCQUEyQixDQUFDLFVBQTRDLEVBQUUsZUFBd0UsRUFBRSxTQUFvRTtRQUN2TyxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNoQyxNQUFNLGtCQUFrQixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9ELE9BQU8sa0JBQWtCLElBQUksU0FBUyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBZ0IsMEJBQTBCLENBQUMsVUFBMEMsRUFBRSxlQUF3RSxFQUFFLFNBQW9FO1FBQ3BPLE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2hDLE1BQU0sa0JBQWtCLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwRCxPQUFPLGtCQUFrQixJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyJ9