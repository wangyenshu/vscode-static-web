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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/extensions/common/extensionHostManager", "vs/workbench/services/extensions/common/extensions"], function (require, exports, async_1, event_1, lifecycle_1, instantiation_1, log_1, remoteAuthorityResolver_1, extensionHostManager_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LazyCreateExtensionHostManager = void 0;
    /**
     * Waits until `start()` and only if it has extensions proceeds to really start.
     */
    let LazyCreateExtensionHostManager = class LazyCreateExtensionHostManager extends lifecycle_1.Disposable {
        get pid() {
            if (this._actual) {
                return this._actual.pid;
            }
            return null;
        }
        get kind() {
            return this._extensionHost.runningLocation.kind;
        }
        get startup() {
            return this._extensionHost.startup;
        }
        get friendyName() {
            return (0, extensionHostManager_1.friendlyExtHostName)(this.kind, this.pid);
        }
        constructor(extensionHost, _internalExtensionService, _instantiationService, _logService) {
            super();
            this._internalExtensionService = _internalExtensionService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._onDidChangeResponsiveState = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveState = this._onDidChangeResponsiveState.event;
            this._extensionHost = extensionHost;
            this.onDidExit = extensionHost.onExit;
            this._startCalled = new async_1.Barrier();
            this._actual = null;
            this._lazyStartExtensions = null;
        }
        _createActual(reason) {
            this._logService.info(`Creating lazy extension host (${this.friendyName}). Reason: ${reason}`);
            this._actual = this._register(this._instantiationService.createInstance(extensionHostManager_1.ExtensionHostManager, this._extensionHost, [], this._internalExtensionService));
            this._register(this._actual.onDidChangeResponsiveState((e) => this._onDidChangeResponsiveState.fire(e)));
            return this._actual;
        }
        async _getOrCreateActualAndStart(reason) {
            if (this._actual) {
                // already created/started
                return this._actual;
            }
            const actual = this._createActual(reason);
            await actual.start(this._lazyStartExtensions.versionId, this._lazyStartExtensions.allExtensions, this._lazyStartExtensions.myExtensions);
            return actual;
        }
        async ready() {
            await this._startCalled.wait();
            if (this._actual) {
                await this._actual.ready();
            }
        }
        representsRunningLocation(runningLocation) {
            return this._extensionHost.runningLocation.equals(runningLocation);
        }
        async deltaExtensions(extensionsDelta) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.deltaExtensions(extensionsDelta);
            }
            this._lazyStartExtensions.delta(extensionsDelta);
            if (extensionsDelta.myToAdd.length > 0) {
                const actual = this._createActual(`contains ${extensionsDelta.myToAdd.length} new extension(s) (installed or enabled): ${extensionsDelta.myToAdd.map(extId => extId.value)}`);
                await actual.start(this._lazyStartExtensions.versionId, this._lazyStartExtensions.allExtensions, this._lazyStartExtensions.myExtensions);
                return;
            }
        }
        containsExtension(extensionId) {
            return this._extensionHost.extensions?.containsExtension(extensionId) ?? false;
        }
        async activate(extension, reason) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.activate(extension, reason);
            }
            return false;
        }
        async activateByEvent(activationEvent, activationKind) {
            if (activationKind === 1 /* ActivationKind.Immediate */) {
                // this is an immediate request, so we cannot wait for start to be called
                if (this._actual) {
                    return this._actual.activateByEvent(activationEvent, activationKind);
                }
                return;
            }
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.activateByEvent(activationEvent, activationKind);
            }
        }
        activationEventIsDone(activationEvent) {
            if (!this._startCalled.isOpen()) {
                return false;
            }
            if (this._actual) {
                return this._actual.activationEventIsDone(activationEvent);
            }
            return true;
        }
        async getInspectPort(tryEnableInspector) {
            await this._startCalled.wait();
            return this._actual?.getInspectPort(tryEnableInspector);
        }
        async resolveAuthority(remoteAuthority, resolveAttempt) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.resolveAuthority(remoteAuthority, resolveAttempt);
            }
            return {
                type: 'error',
                error: {
                    message: `Cannot resolve authority`,
                    code: remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown,
                    detail: undefined
                }
            };
        }
        async getCanonicalURI(remoteAuthority, uri) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.getCanonicalURI(remoteAuthority, uri);
            }
            throw new Error(`Cannot resolve canonical URI`);
        }
        async start(extensionRegistryVersionId, allExtensions, myExtensions) {
            if (myExtensions.length > 0) {
                // there are actual extensions, so let's launch the extension host
                const actual = this._createActual(`contains ${myExtensions.length} extension(s): ${myExtensions.map(extId => extId.value)}.`);
                const result = actual.start(extensionRegistryVersionId, allExtensions, myExtensions);
                this._startCalled.open();
                return result;
            }
            // there are no actual extensions running, store extensions in `this._lazyStartExtensions`
            this._lazyStartExtensions = new extensions_1.ExtensionHostExtensions(extensionRegistryVersionId, allExtensions, myExtensions);
            this._startCalled.open();
        }
        async extensionTestsExecute() {
            await this._startCalled.wait();
            const actual = await this._getOrCreateActualAndStart(`execute tests.`);
            return actual.extensionTestsExecute();
        }
        async setRemoteEnvironment(env) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.setRemoteEnvironment(env);
            }
        }
    };
    exports.LazyCreateExtensionHostManager = LazyCreateExtensionHostManager;
    exports.LazyCreateExtensionHostManager = LazyCreateExtensionHostManager = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, log_1.ILogService)
    ], LazyCreateExtensionHostManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF6eUNyZWF0ZUV4dGVuc2lvbkhvc3RNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2xhenlDcmVhdGVFeHRlbnNpb25Ib3N0TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHOztPQUVHO0lBQ0ksSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBK0IsU0FBUSxzQkFBVTtRQVc3RCxJQUFXLEdBQUc7WUFDYixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUN6QixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsSUFBVyxJQUFJO1lBQ2QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFDakQsQ0FBQztRQUVELElBQVcsT0FBTztZQUNqQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxJQUFXLFdBQVc7WUFDckIsT0FBTyxJQUFBLDBDQUFtQixFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFRCxZQUNDLGFBQTZCLEVBQ1oseUJBQW9ELEVBQzlDLHFCQUE2RCxFQUN2RSxXQUF5QztZQUV0RCxLQUFLLEVBQUUsQ0FBQztZQUpTLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMkI7WUFDN0IsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQS9CdEMsZ0NBQTJCLEdBQTZCLElBQUksQ0FBQyxT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