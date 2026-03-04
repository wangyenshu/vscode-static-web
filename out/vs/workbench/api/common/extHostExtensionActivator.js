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
define(["require", "exports", "vs/base/common/errors", "vs/workbench/services/extensions/common/extensionDescriptionRegistry", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/base/common/async"], function (require, exports, errors, extensionDescriptionRegistry_1, extensions_1, extensions_2, log_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsActivator = exports.HostExtension = exports.EmptyExtension = exports.ActivatedExtension = exports.ExtensionActivationTimesBuilder = exports.ExtensionActivationTimes = void 0;
    class ExtensionActivationTimes {
        static { this.NONE = new ExtensionActivationTimes(false, -1, -1, -1); }
        constructor(startup, codeLoadingTime, activateCallTime, activateResolvedTime) {
            this.startup = startup;
            this.codeLoadingTime = codeLoadingTime;
            this.activateCallTime = activateCallTime;
            this.activateResolvedTime = activateResolvedTime;
        }
    }
    exports.ExtensionActivationTimes = ExtensionActivationTimes;
    class ExtensionActivationTimesBuilder {
        constructor(startup) {
            this._startup = startup;
            this._codeLoadingStart = -1;
            this._codeLoadingStop = -1;
            this._activateCallStart = -1;
            this._activateCallStop = -1;
            this._activateResolveStart = -1;
            this._activateResolveStop = -1;
        }
        _delta(start, stop) {
            if (start === -1 || stop === -1) {
                return -1;
            }
            return stop - start;
        }
        build() {
            return new ExtensionActivationTimes(this._startup, this._delta(this._codeLoadingStart, this._codeLoadingStop), this._delta(this._activateCallStart, this._activateCallStop), this._delta(this._activateResolveStart, this._activateResolveStop));
        }
        codeLoadingStart() {
            this._codeLoadingStart = Date.now();
        }
        codeLoadingStop() {
            this._codeLoadingStop = Date.now();
        }
        activateCallStart() {
            this._activateCallStart = Date.now();
        }
        activateCallStop() {
            this._activateCallStop = Date.now();
        }
        activateResolveStart() {
            this._activateResolveStart = Date.now();
        }
        activateResolveStop() {
            this._activateResolveStop = Date.now();
        }
    }
    exports.ExtensionActivationTimesBuilder = ExtensionActivationTimesBuilder;
    class ActivatedExtension {
        constructor(activationFailed, activationFailedError, activationTimes, module, exports, subscriptions) {
            this.activationFailed = activationFailed;
            this.activationFailedError = activationFailedError;
            this.activationTimes = activationTimes;
            this.module = module;
            this.exports = exports;
            this.subscriptions = subscriptions;
        }
    }
    exports.ActivatedExtension = ActivatedExtension;
    class EmptyExtension extends ActivatedExtension {
        constructor(activationTimes) {
            super(false, null, activationTimes, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    exports.EmptyExtension = EmptyExtension;
    class HostExtension extends ActivatedExtension {
        constructor() {
            super(false, null, ExtensionActivationTimes.NONE, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    exports.HostExtension = HostExtension;
    class FailedExtension extends ActivatedExtension {
        constructor(activationError) {
            super(true, activationError, ExtensionActivationTimes.NONE, { activate: undefined, deactivate: undefined }, undefined, []);
        }
    }
    let ExtensionsActivator = class ExtensionsActivator {
        constructor(registry, globalRegistry, host, _logService) {
            this._logService = _logService;
            this._registry = registry;
            this._globalRegistry = globalRegistry;
            this._host = host;
            this._operations = new extensions_1.ExtensionIdentifierMap();
            this._alreadyActivatedEvents = Object.create(null);
        }
        dispose() {
            for (const [_, op] of this._operations) {
                op.dispose();
            }
        }
        async waitForActivatingExtensions() {
            const res = [];
            for (const [_, op] of this._operations) {
                res.push(op.wait());
            }
            await Promise.all(res);
        }
        isActivated(extensionId) {
            const op = this._operations.get(extensionId);
            return Boolean(op && op.value);
        }
        getActivatedExtension(extensionId) {
            const op = this._operations.get(extensionId);
            if (!op || !op.value) {
                throw new Error(`Extension '${extensionId.value}' is not known or not activated`);
            }
            return op.value;
        }
        async activateByEvent(activationEvent, startup) {
            if (this._alreadyActivatedEvents[activationEvent]) {
                return;
            }
            const activateExtensions = this._registry.getExtensionDescriptionsForActivationEvent(activationEvent);
            await this._activateExtensions(activateExtensions.map(e => ({
                id: e.identifier,
                reason: { startup, extensionId: e.identifier, activationEvent }
            })));
            this._alreadyActivatedEvents[activationEvent] = true;
        }
        activateById(extensionId, reason) {
            const desc = this._registry.getExtensionDescription(extensionId);
            if (!desc) {
                throw new Error(`Extension '${extensionId.value}' is not known`);
            }
            return this._activateExtensions([{ id: desc.identifier, reason }]);
        }
        async _activateExtensions(extensions) {
            const operations = extensions
                .filter((p) => !this.isActivated(p.id))
                .map(ext => this._handleActivationRequest(ext));
            await Promise.all(operations.map(op => op.wait()));
        }
        /**
         * Handle semantics related to dependencies for `currentExtension`.
         * We don't need to worry about dependency loops because they are handled by the registry.
         */
        _handleActivationRequest(currentActivation) {
            if (this._operations.has(currentActivation.id)) {
                return this._operations.get(currentActivation.id);
            }
            if (this._isHostExtension(currentActivation.id)) {
                return this._createAndSaveOperation(currentActivation, null, [], null);
            }
            const currentExtension = this._registry.getExtensionDescription(currentActivation.id);
            if (!currentExtension) {
                // Error condition 0: unknown extension
                const error = new Error(`Cannot activate unknown extension '${currentActivation.id.value}'`);
                const result = this._createAndSaveOperation(currentActivation, null, [], new FailedExtension(error));
                this._host.onExtensionActivationError(currentActivation.id, error, new extensions_2.MissingExtensionDependency(currentActivation.id.value));
                return result;
            }
            const deps = [];
            const depIds = (typeof currentExtension.extensionDependencies === 'undefined' ? [] : currentExtension.extensionDependencies);
            for (const depId of depIds) {
                if (this._isResolvedExtension(depId)) {
                    // This dependency is already resolved
                    continue;
                }
                const dep = this._operations.get(depId);
                if (dep) {
                    deps.push(dep);
                    continue;
                }
                if (this._isHostExtension(depId)) {
                    // must first wait for the dependency to activate
                    deps.push(this._handleActivationRequest({
                        id: this._globalRegistry.getExtensionDescription(depId).identifier,
                        reason: currentActivation.reason
                    }));
                    continue;
                }
                const depDesc = this._registry.getExtensionDescription(depId);
                if (depDesc) {
                    if (!depDesc.main && !depDesc.browser) {
                        // this dependency does not need to activate because it is descriptive only
                        continue;
                    }
                    // must first wait for the dependency to activate
                    deps.push(this._handleActivationRequest({
                        id: depDesc.identifier,
                        reason: currentActivation.reason
                    }));
                    continue;
                }
                // Error condition 1: unknown dependency
                const currentExtensionFriendlyName = currentExtension.displayName || currentExtension.identifier.value;
                const error = new Error(`Cannot activate the '${currentExtensionFriendlyName}' extension because it depends on unknown extension '${depId}'`);
                const result = this._createAndSaveOperation(currentActivation, currentExtension.displayName, [], new FailedExtension(error));
                this._host.onExtensionActivationError(currentExtension.identifier, error, new extensions_2.MissingExtensionDependency(depId));
                return result;
            }
            return this._createAndSaveOperation(currentActivation, currentExtension.displayName, deps, null);
        }
        _createAndSaveOperation(activation, displayName, deps, value) {
            const operation = new ActivationOperation(activation.id, displayName, activation.reason, deps, value, this._host, this._logService);
            this._operations.set(activation.id, operation);
            return operation;
        }
        _isHostExtension(extensionId) {
            return extensionDescriptionRegistry_1.ExtensionDescriptionRegistry.isHostExtension(extensionId, this._registry, this._globalRegistry);
        }
        _isResolvedExtension(extensionId) {
            const extensionDescription = this._globalRegistry.getExtensionDescription(extensionId);
            if (!extensionDescription) {
                // unknown extension
                return false;
            }
            return (!extensionDescription.main && !extensionDescription.browser);
        }
    };
    exports.ExtensionsActivator = ExtensionsActivator;
    exports.ExtensionsActivator = ExtensionsActivator = __decorate([
        __param(3, log_1.ILogService)
    ], ExtensionsActivator);
    let ActivationOperation = class ActivationOperation {
        get value() {
            return this._value;
        }
        get friendlyName() {
            return this._displayName || this._id.value;
        }
        constructor(_id, _displayName, _reason, _deps, _value, _host, _logService) {
            this._id = _id;
            this._displayName = _displayName;
            this._reason = _reason;
            this._deps = _deps;
            this._value = _value;
            this._host = _host;
            this._logService = _logService;
            this._barrier = new async_1.Barrier();
            this._isDisposed = false;
            this._initialize();
        }
        dispose() {
            this._isDisposed = true;
        }
        wait() {
            return this._barrier.wait();
        }
        async _initialize() {
            await this._waitForDepsThenActivate();
            this._barrier.open();
        }
        async _waitForDepsThenActivate() {
            if (this._value) {
                // this operation is already finished
                return;
            }
            while (this._deps.length > 0) {
                // remove completed deps
                for (let i = 0; i < this._deps.length; i++) {
                    const dep = this._deps[i];
                    if (dep.value && !dep.value.activationFailed) {
                        // the dependency is already activated OK
                        this._deps.splice(i, 1);
                        i--;
                        continue;
                    }
                    if (dep.value && dep.value.activationFailed) {
                        // Error condition 2: a dependency has already failed activation
                        const error = new Error(`Cannot activate the '${this.friendlyName}' extension because its dependency '${dep.friendlyName}' failed to activate`);
                        error.detail = dep.value.activationFailedError;
                        this._value = new FailedExtension(error);
                        this._host.onExtensionActivationError(this._id, error, null);
                        return;
                    }
                }
                if (this._deps.length > 0) {
                    // wait for one dependency
                    await Promise.race(this._deps.map(dep => dep.wait()));
                }
            }
            await this._activate();
        }
        async _activate() {
            try {
                this._value = await this._host.actualActivateExtension(this._id, this._reason);
            }
            catch (err) {
                const error = new Error();
                if (err && err.name) {
                    error.name = err.name;
                }
                if (err && err.message) {
                    error.message = `Activating extension '${this._id.value}' failed: ${err.message}.`;
                }
                else {
                    error.message = `Activating extension '${this._id.value}' failed: ${err}.`;
                }
                if (err && err.stack) {
                    error.stack = err.stack;
                }
                // Treat the extension as being empty
                this._value = new FailedExtension(error);
                if (this._isDisposed && errors.isCancellationError(err)) {
                    // It is expected for ongoing activations to fail if the extension host is going down
                    // So simply ignore and don't log canceled errors in this case
                    return;
                }
                this._host.onExtensionActivationError(this._id, error, null);
                this._logService.error(`Activating extension ${this._id.value} failed due to an error:`);
                this._logService.error(err);
            }
        }
    };
    ActivationOperation = __decorate([
        __param(6, log_1.ILogService)
    ], ActivationOperation);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEV4dGVuc2lvbkFjdGl2YXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RFeHRlbnNpb25BY3RpdmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUNoRyxNQUFhLHdCQUF3QjtpQkFFYixTQUFJLEdBQUcsSUFBSSx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQU85RSxZQUFZLE9BQWdCLEVBQUUsZUFBdUIsRUFBRSxnQkFBd0IsRUFBRSxvQkFBNEI7WUFDNUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7WUFDdkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO1lBQ3pDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQztRQUNsRCxDQUFDOztJQWRGLDREQWVDO0lBRUQsTUFBYSwrQkFBK0I7UUFVM0MsWUFBWSxPQUFnQjtZQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFD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