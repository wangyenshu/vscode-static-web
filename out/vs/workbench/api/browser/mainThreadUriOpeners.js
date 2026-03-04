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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/contrib/externalUriOpener/common/contributedOpeners", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService", "vs/workbench/services/extensions/common/extensions", "../../services/extensions/common/extHostCustomers"], function (require, exports, actions_1, errors_1, lifecycle_1, network_1, nls_1, notification_1, opener_1, storage_1, extHost_protocol_1, configuration_1, contributedOpeners_1, externalUriOpenerService_1, extensions_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadUriOpeners = void 0;
    let MainThreadUriOpeners = class MainThreadUriOpeners extends lifecycle_1.Disposable {
        constructor(context, storageService, externalUriOpenerService, extensionService, openerService, notificationService) {
            super();
            this.extensionService = extensionService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this._registeredOpeners = new Map();
            this.proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostUriOpeners);
            this._register(externalUriOpenerService.registerExternalOpenerProvider(this));
            this._contributedExternalUriOpenersStore = this._register(new contributedOpeners_1.ContributedExternalUriOpenersStore(storageService, extensionService));
        }
        async *getOpeners(targetUri) {
            // Currently we only allow openers for http and https urls
            if (targetUri.scheme !== network_1.Schemas.http && targetUri.scheme !== network_1.Schemas.https) {
                return;
            }
            await this.extensionService.activateByEvent(`onOpenExternalUri:${targetUri.scheme}`);
            for (const [id, openerMetadata] of this._registeredOpeners) {
                if (openerMetadata.schemes.has(targetUri.scheme)) {
                    yield this.createOpener(id, openerMetadata);
                }
            }
        }
        createOpener(id, metadata) {
            return {
                id: id,
                label: metadata.label,
                canOpen: (uri, token) => {
                    return this.proxy.$canOpenUri(id, uri, token);
                },
                openExternalUri: async (uri, ctx, token) => {
                    try {
                        await this.proxy.$openUri(id, { resolvedUri: uri, sourceUri: ctx.sourceUri }, token);
                    }
                    catch (e) {
                        if (!(0, errors_1.isCancellationError)(e)) {
                            const openDefaultAction = new actions_1.Action('default', (0, nls_1.localize)('openerFailedUseDefault', "Open using default opener"), undefined, undefined, async () => {
                                await this.openerService.open(uri, {
                                    allowTunneling: false,
                                    allowContributedOpeners: configuration_1.defaultExternalUriOpenerId,
                                });
                            });
                            openDefaultAction.tooltip = uri.toString();
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: (0, nls_1.localize)({
                                    key: 'openerFailedMessage',
                                    comment: ['{0} is the id of the opener. {1} is the url being opened.'],
                                }, 'Could not open uri with \'{0}\': {1}', id, e.toString()),
                                actions: {
                                    primary: [
                                        openDefaultAction
                                    ]
                                }
                            });
                        }
                    }
                    return true;
                },
            };
        }
        async $registerUriOpener(id, schemes, extensionId, label) {
            if (this._registeredOpeners.has(id)) {
                throw new Error(`Opener with id '${id}' already registered`);
            }
            this._registeredOpeners.set(id, {
                schemes: new Set(schemes),
                label,
                extensionId,
            });
            this._contributedExternalUriOpenersStore.didRegisterOpener(id, extensionId.value);
        }
        async $unregisterUriOpener(id) {
            this._registeredOpeners.delete(id);
            this._contributedExternalUriOpenersStore.delete(id);
        }
        dispose() {
            super.dispose();
            this._registeredOpeners.clear();
        }
    };
    exports.MainThreadUriOpeners = MainThreadUriOpeners;
    exports.MainThreadUriOpeners = MainThreadUriOpeners = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadUriOpeners),
        __param(1, storage_1.IStorageService),
        __param(2, externalUriOpenerService_1.IExternalUriOpenerService),
        __param(3, extensions_1.IExtensionService),
        __param(4, opener_1.IOpenerService),
        __param(5, notification_1.INotificationService)
    ], MainThreadUriOpeners);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFVyaU9wZW5lcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFVyaU9wZW5lcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEJ6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBTW5ELFlBQ0MsT0FBd0IsRUFDUCxjQUErQixFQUNyQix3QkFBbUQsRUFDM0QsZ0JBQW9ELEVBQ3ZELGFBQThDLEVBQ3hDLG1CQUEwRDtZQUVoRixLQUFLLEVBQUUsQ0FBQztZQUo0QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3RDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN2Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBVGhFLHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUFvQyxDQUFDO1lBWWpGLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFaEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRTlFLElBQUksQ0FBQyxtQ0FBbUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksdURBQWtDLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNySSxDQUFDO1FBRU0sS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLFNBQWM7WUFFdEMsMERBQTBEO1lBQzFELElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsS0FB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