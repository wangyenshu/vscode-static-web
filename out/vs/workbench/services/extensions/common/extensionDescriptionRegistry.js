/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/base/common/event", "vs/base/common/path", "vs/base/common/lifecycle", "vs/base/common/async"], function (require, exports, extensions_1, event_1, path, lifecycle_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionDescriptionRegistryLock = exports.LockableExtensionDescriptionRegistry = exports.ExtensionDescriptionRegistrySnapshot = exports.ExtensionDescriptionRegistry = exports.DeltaExtensionsResult = void 0;
    class DeltaExtensionsResult {
        constructor(versionId, removedDueToLooping) {
            this.versionId = versionId;
            this.removedDueToLooping = removedDueToLooping;
        }
    }
    exports.DeltaExtensionsResult = DeltaExtensionsResult;
    class ExtensionDescriptionRegistry {
        static isHostExtension(extensionId, myRegistry, globalRegistry) {
            if (myRegistry.getExtensionDescription(extensionId)) {
                // I have this extension
                return false;
            }
            const extensionDescription = globalRegistry.getExtensionDescription(extensionId);
            if (!extensionDescription) {
                // unknown extension
                return false;
            }
            if ((extensionDescription.main || extensionDescription.browser) && extensionDescription.api === 'none') {
                return true;
            }
            return false;
        }
        constructor(_activationEventsReader, extensionDescriptions) {
            this._activationEventsReader = _activationEventsReader;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._versionId = 0;
            this._extensionDescriptions = extensionDescriptions;
            this._initialize();
        }
        _initialize() {
            // Ensure extensions are stored in the order: builtin, user, under development
            this._extensionDescriptions.sort(extensionCmp);
            this._extensionsMap = new extensions_1.ExtensionIdentifierMap();
            this._extensionsArr = [];
            this._activationMap = new Map();
            for (const extensionDescription of this._extensionDescriptions) {
                if (this._extensionsMap.has(extensionDescription.identifier)) {
                    // No overwriting allowed!
                    console.error('Extension `' + extensionDescription.identifier.value + '` is already registered');
                    continue;
                }
                this._extensionsMap.set(extensionDescription.identifier, extensionDescription);
                this._extensionsArr.push(extensionDescription);
                const activationEvents = this._activationEventsReader.readActivationEvents(extensionDescription);
                for (const activationEvent of activationEvents) {
                    if (!this._activationMap.has(activationEvent)) {
                        this._activationMap.set(activationEvent, []);
                    }
                    this._activationMap.get(activationEvent).push(extensionDescription);
                }
            }
        }
        set(extensionDescriptions) {
            this._extensionDescriptions = extensionDescriptions;
            this._initialize();
            this._versionId++;
            this._onDidChange.fire(undefined);
            return {
                versionId: this._versionId
            };
        }
        deltaExtensions(toAdd, toRemove) {
            // It is possible that an extension is removed, only to be added again at a different version
            // so we will first handle removals
            this._extensionDescriptions = removeExtensions(this._extensionDescriptions, toRemove);
            // Then, handle the extensions to add
            this._extensionDescriptions = this._extensionDescriptions.concat(toAdd);
            // Immediately remove looping extensions!
            const looping = ExtensionDescriptionRegistry._findLoopingExtensions(this._extensionDescriptions);
            this._extensionDescriptions = removeExtensions(this._extensionDescriptions, looping.map(ext => ext.identifier));
            this._initialize();
            this._versionId++;
            this._onDidChange.fire(undefined);
            return new DeltaExtensionsResult(this._versionId, looping);
        }
        static _findLoopingExtensions(extensionDescriptions) {
            const G = new class {
                constructor() {
                    this._arcs = new Map();
                    this._nodesSet = new Set();
                    this._nodesArr = [];
                }
                addNode(id) {
                    if (!this._nodesSet.has(id)) {
                        this._nodesSet.add(id);
                        this._nodesArr.push(id);
                    }
                }
                addArc(from, to) {
                    this.addNode(from);
                    this.addNode(to);
                    if (this._arcs.has(from)) {
                        this._arcs.get(from).push(to);
                    }
                    else {
                        this._arcs.set(from, [to]);
                    }
                }
                getArcs(id) {
                    if (this._arcs.has(id)) {
                        return this._arcs.get(id);
                    }
                    return [];
                }
                hasOnlyGoodArcs(id, good) {
                    const dependencies = G.getArcs(id);
                    for (let i = 0; i < dependencies.length; i++) {
                        if (!good.has(dependencies[i])) {
                            return false;
                        }
                    }
                    return true;
                }
                getNodes() {
                    return this._nodesArr;
                }
            };
            const descs = new extensions_1.ExtensionIdentifierMap();
            for (const extensionDescription of extensionDescriptions) {
                descs.set(extensionDescription.identifier, extensionDescription);
                if (extensionDescription.extensionDependencies) {
                    for (const depId of extensionDescription.extensionDependencies) {
                        G.addArc(extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier), extensions_1.ExtensionIdentifier.toKey(depId));
                    }
                }
            }
            // initialize with all extensions with no dependencies.
            const good = new Set();
            G.getNodes().filter(id => G.getArcs(id).length === 0).forEach(id => good.add(id));
            // all other extensions will be processed below.
            const nodes = G.getNodes().filter(id => !good.has(id));
            let madeProgress;
            do {
                madeProgress = false;
                // find one extension which has only good deps
                for (let i = 0; i < nodes.length; i++) {
                    const id = nodes[i];
                    if (G.hasOnlyGoodArcs(id, good)) {
                        nodes.splice(i, 1);
                        i--;
                        good.add(id);
                        madeProgress = true;
                    }
                }
            } while (madeProgress);
            // The remaining nodes are bad and have loops
            return nodes.map(id => descs.get(id));
        }
        containsActivationEvent(activationEvent) {
            return this._activationMap.has(activationEvent);
        }
        containsExtension(extensionId) {
            return this._extensionsMap.has(extensionId);
        }
        getExtensionDescriptionsForActivationEvent(activationEvent) {
            const extensions = this._activationMap.get(activationEvent);
            return extensions ? extensions.slice(0) : [];
        }
        getAllExtensionDescriptions() {
            return this._extensionsArr.slice(0);
        }
        getSnapshot() {
            return new ExtensionDescriptionRegistrySnapshot(this._versionId, this.getAllExtensionDescriptions());
        }
        getExtensionDescription(extensionId) {
            const extension = this._extensionsMap.get(extensionId);
            return extension ? extension : undefined;
        }
        getExtensionDescriptionByUUID(uuid) {
            for (const extensionDescription of this._extensionsArr) {
                if (extensionDescription.uuid === uuid) {
                    return extensionDescription;
                }
            }
            return undefined;
        }
        getExtensionDescriptionByIdOrUUID(extensionId, uuid) {
            return (this.getExtensionDescription(extensionId)
                ?? (uuid ? this.getExtensionDescriptionByUUID(uuid) : undefined));
        }
    }
    exports.ExtensionDescriptionRegistry = ExtensionDescriptionRegistry;
    class ExtensionDescriptionRegistrySnapshot {
        constructor(versionId, extensions) {
            this.versionId = versionId;
            this.extensions = extensions;
        }
    }
    exports.ExtensionDescriptionRegistrySnapshot = ExtensionDescriptionRegistrySnapshot;
    class LockableExtensionDescriptionRegistry {
        constructor(activationEventsReader) {
            this._lock = new Lock();
            this._actual = new ExtensionDescriptionRegistry(activationEventsReader, []);
        }
        async acquireLock(customerName) {
            const lock = await this._lock.acquire(customerName);
            return new ExtensionDescriptionRegistryLock(this, lock);
        }
        deltaExtensions(acquiredLock, toAdd, toRemove) {
            if (!acquiredLock.isAcquiredFor(this)) {
                throw new Error('Lock is not held');
            }
            return this._actual.deltaExtensions(toAdd, toRemove);
        }
        containsActivationEvent(activationEvent) {
            return this._actual.containsActivationEvent(activationEvent);
        }
        containsExtension(extensionId) {
            return this._actual.containsExtension(extensionId);
        }
        getExtensionDescriptionsForActivationEvent(activationEvent) {
            return this._actual.getExtensionDescriptionsForActivationEvent(activationEvent);
        }
        getAllExtensionDescriptions() {
            return this._actual.getAllExtensionDescriptions();
        }
        getSnapshot() {
            return this._actual.getSnapshot();
        }
        getExtensionDescription(extensionId) {
            return this._actual.getExtensionDescription(extensionId);
        }
        getExtensionDescriptionByUUID(uuid) {
            return this._actual.getExtensionDescriptionByUUID(uuid);
        }
        getExtensionDescriptionByIdOrUUID(extensionId, uuid) {
            return this._actual.getExtensionDescriptionByIdOrUUID(extensionId, uuid);
        }
    }
    exports.LockableExtensionDescriptionRegistry = LockableExtensionDescriptionRegistry;
    class ExtensionDescriptionRegistryLock extends lifecycle_1.Disposable {
        constructor(_registry, lock) {
            super();
            this._registry = _registry;
            this._isDisposed = false;
            this._register(lock);
        }
        isAcquiredFor(registry) {
            return !this._isDisposed && this._registry === registry;
        }
    }
    exports.ExtensionDescriptionRegistryLock = ExtensionDescriptionRegistryLock;
    class LockCustomer {
        constructor(name) {
            this.name = name;
            const withResolvers = (0, async_1.promiseWithResolvers)();
            this.promise = withResolvers.promise;
            this._resolve = withResolvers.resolve;
        }
        resolve(value) {
            this._resolve(value);
        }
    }
    class Lock {
        constructor() {
            this._pendingCustomers = [];
            this._isLocked = false;
        }
        async acquire(customerName) {
            const customer = new LockCustomer(customerName);
            this._pendingCustomers.push(customer);
            this._advance();
            return customer.promise;
        }
        _advance() {
            if (this._isLocked) {
                // cannot advance yet
                return;
            }
            if (this._pendingCustomers.length === 0) {
                // no more waiting customers
                return;
            }
            const customer = this._pendingCustomers.shift();
            this._isLocked = true;
            let customerHoldsLock = true;
            const logLongRunningCustomerTimeout = setTimeout(() => {
                if (customerHoldsLock) {
                    console.warn(`The customer named ${customer.name} has been holding on to the lock for 30s. This might be a problem.`);
                }
            }, 30 * 1000 /* 30 seconds */);
            const releaseLock = () => {
                if (!customerHoldsLock) {
                    return;
                }
                clearTimeout(logLongRunningCustomerTimeout);
                customerHoldsLock = false;
                this._isLocked = false;
                this._advance();
            };
            customer.resolve((0, lifecycle_1.toDisposable)(releaseLock));
        }
    }
    var SortBucket;
    (function (SortBucket) {
        SortBucket[SortBucket["Builtin"] = 0] = "Builtin";
        SortBucket[SortBucket["User"] = 1] = "User";
        SortBucket[SortBucket["Dev"] = 2] = "Dev";
    })(SortBucket || (SortBucket = {}));
    /**
     * Ensure that:
     * - first are builtin extensions
     * - second are user extensions
     * - third are extensions under development
     *
     * In each bucket, extensions must be sorted alphabetically by their folder name.
     */
    function extensionCmp(a, b) {
        const aSortBucket = (a.isBuiltin ? 0 /* SortBucket.Builtin */ : a.isUnderDevelopment ? 2 /* SortBucket.Dev */ : 1 /* SortBucket.User */);
        const bSortBucket = (b.isBuiltin ? 0 /* SortBucket.Builtin */ : b.isUnderDevelopment ? 2 /* SortBucket.Dev */ : 1 /* SortBucket.User */);
        if (aSortBucket !== bSortBucket) {
            return aSortBucket - bSortBucket;
        }
        const aLastSegment = path.posix.basename(a.extensionLocation.path);
        const bLastSegment = path.posix.basename(b.extensionLocation.path);
        if (aLastSegment < bLastSegment) {
            return -1;
        }
        if (aLastSegment > bLastSegment) {
            return 1;
        }
        return 0;
    }
    function removeExtensions(arr, toRemove) {
        const toRemoveSet = new extensions_1.ExtensionIdentifierSet(toRemove);
        return arr.filter(extension => !toRemoveSet.has(extension.identifier));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRGVzY3JpcHRpb25SZWdpc3RyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25EZXNjcmlwdGlvblJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLHFCQUFxQjtRQUNqQyxZQUNpQixTQUFpQixFQUNqQixtQkFBNEM7WUFENUMsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXlCO1FBQ3pELENBQUM7S0FDTDtJQUxELHNEQUtDO0lBWUQsTUFBYSw0QkFBNEI7UUFFakMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUF5QyxFQUFFLFVBQXdDLEVBQUUsY0FBNEM7WUFDOUosSUFBSSxVQUFVLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDckQsd0JBQXdCO2dCQUN4QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxNQUFNLG9CQUFvQixHQUFHLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDM0Isb0JBQW9CO2dCQUNwQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxJQUFJLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxJQUFJLG9CQUFvQixDQUFDLEdBQUcsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDeEcsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBV0QsWUFDa0IsdUJBQWdELEVBQ2pFLHFCQUE4QztZQUQ3Qiw0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