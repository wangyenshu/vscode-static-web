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
define(["require", "exports", "vs/base/common/async", "vs/platform/encryption/common/encryptionService", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/secrets/common/secrets", "vs/platform/storage/common/storage", "vs/workbench/services/environment/browser/environmentService"], function (require, exports, async_1, encryptionService_1, extensions_1, log_1, secrets_1, storage_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserSecretStorageService = void 0;
    let BrowserSecretStorageService = class BrowserSecretStorageService extends secrets_1.BaseSecretStorageService {
        constructor(storageService, encryptionService, environmentService, logService) {
            // We don't have encryption in the browser so instead we use the
            // in-memory base class implementation instead.
            super(true, storageService, encryptionService, logService);
            if (environmentService.options?.secretStorageProvider) {
                this._secretStorageProvider = environmentService.options.secretStorageProvider;
                this._embedderSequencer = new async_1.SequencerByKey();
            }
        }
        get(key) {
            if (this._secretStorageProvider) {
                return this._embedderSequencer.queue(key, () => this._secretStorageProvider.get(key));
            }
            return super.get(key);
        }
        set(key, value) {
            if (this._secretStorageProvider) {
                return this._embedderSequencer.queue(key, async () => {
                    await this._secretStorageProvider.set(key, value);
                    this.onDidChangeSecretEmitter.fire(key);
                });
            }
            return super.set(key, value);
        }
        delete(key) {
            if (this._secretStorageProvider) {
                return this._embedderSequencer.queue(key, async () => {
                    await this._secretStorageProvider.delete(key);
                    this.onDidChangeSecretEmitter.fire(key);
                });
            }
            return super.delete(key);
        }
        get type() {
            if (this._secretStorageProvider) {
                return this._secretStorageProvider.type;
            }
            return super.type;
        }
    };
    exports.BrowserSecretStorageService = BrowserSecretStorageService;
    exports.BrowserSecretStorageService = BrowserSecretStorageService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, encryptionService_1.IEncryptionService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(3, log_1.ILogService)
    ], BrowserSecretStorageService);
    (0, extensions_1.registerSingleton)(secrets_1.ISecretStorageService, BrowserSecretStorageService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0U3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VjcmV0cy9icm93c2VyL3NlY3JldFN0b3JhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLGtDQUF3QjtRQUt4RSxZQUNrQixjQUErQixFQUM1QixpQkFBcUMsRUFDcEIsa0JBQXVELEVBQy9FLFVBQXVCO1lBRXBDLGdFQUFnRTtZQUNoRSwrQ0FBK0M7WUFDL0MsS0FBSyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFM0QsSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLHNCQUFzQixHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztnQkFDL0UsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksc0JBQWMsRUFBVSxDQUFDO1lBQ3hELENBQUM7UUFDRixDQUFDO1FBRVEsR0FBRyxDQUFDLEdBQVc7WUFDdkIsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxJQUFJLENBQUMsa0JBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXVCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDekYsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBRVEsR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUFhO1lBQ3RDLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sSUFBSSxDQUFDLGtCQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQ3JELE1BQU0sSUFBSSxDQUFDLHNCQUF1QixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ25ELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3pDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVRLE1BQU0sQ0FBQyxHQUFXO1lBQzFCLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sSUFBSSxDQUFDLGtCQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQ3JELE1BQU0sSUFBSSxDQUFDLHNCQUF1QixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDL0MsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDekMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxJQUFhLElBQUk7WUFDaEIsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDO1lBQ3pDLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUM7UUFDbkIsQ0FBQztLQUNELENBQUE7SUExRFksa0VBQTJCOzBDQUEzQiwyQkFBMkI7UUFNckMsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLHdEQUFtQyxDQUFBO1FBQ25DLFdBQUEsaUJBQVcsQ0FBQTtPQVRELDJCQUEyQixDQTBEdkM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLCtCQUFxQixFQUFFLDJCQUEyQixvQ0FBNEIsQ0FBQyJ9