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
define(["require", "exports", "vs/base/common/uri", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/dialogs/common/dialogs", "vs/base/common/network"], function (require, exports, uri_1, extHost_protocol_1, extHostCustomers_1, dialogs_1, network_1) {
    "use strict";
    var MainThreadDialogs_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDialogs = void 0;
    let MainThreadDialogs = MainThreadDialogs_1 = class MainThreadDialogs {
        constructor(context, _fileDialogService) {
            this._fileDialogService = _fileDialogService;
            //
        }
        dispose() {
            //
        }
        async $showOpenDialog(options) {
            const convertedOptions = MainThreadDialogs_1._convertOpenOptions(options);
            if (!convertedOptions.defaultUri) {
                convertedOptions.defaultUri = await this._fileDialogService.defaultFilePath();
            }
            return Promise.resolve(this._fileDialogService.showOpenDialog(convertedOptions));
        }
        async $showSaveDialog(options) {
            const convertedOptions = MainThreadDialogs_1._convertSaveOptions(options);
            if (!convertedOptions.defaultUri) {
                convertedOptions.defaultUri = await this._fileDialogService.defaultFilePath();
            }
            return Promise.resolve(this._fileDialogService.showSaveDialog(convertedOptions));
        }
        static _convertOpenOptions(options) {
            const result = {
                openLabel: options?.openLabel || undefined,
                canSelectFiles: options?.canSelectFiles || (!options?.canSelectFiles && !options?.canSelectFolders),
                canSelectFolders: options?.canSelectFolders,
                canSelectMany: options?.canSelectMany,
                defaultUri: options?.defaultUri ? uri_1.URI.revive(options.defaultUri) : undefined,
                title: options?.title || undefined,
                availableFileSystems: options?.allowUIResources ? [network_1.Schemas.vscodeRemote, network_1.Schemas.file] : []
            };
            if (options?.filters) {
                result.filters = [];
                for (const [key, value] of Object.entries(options.filters)) {
                    result.filters.push({ name: key, extensions: value });
                }
            }
            return result;
        }
        static _convertSaveOptions(options) {
            const result = {
                defaultUri: options?.defaultUri ? uri_1.URI.revive(options.defaultUri) : undefined,
                saveLabel: options?.saveLabel || undefined,
                title: options?.title || undefined
            };
            if (options?.filters) {
                result.filters = [];
                for (const [key, value] of Object.entries(options.filters)) {
                    result.filters.push({ name: key, extensions: value });
                }
            }
            return result;
        }
    };
    exports.MainThreadDialogs = MainThreadDialogs;
    exports.MainThreadDialogs = MainThreadDialogs = MainThreadDialogs_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDialogs),
        __param(1, dialogs_1.IFileDialogService)
    ], MainThreadDialogs);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERpYWxvZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZERpYWxvZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLGlCQUFpQix5QkFBdkIsTUFBTSxpQkFBaUI7UUFFN0IsWUFDQyxPQUF3QixFQUNhLGtCQUFzQztZQUF0Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBRTNFLEVBQUU7UUFDSCxDQUFDO1FBRUQsT0FBTztZQUNOLEVBQUU7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLGVBQWUsQ0FBQyxPQUFxQztZQUMxRCxNQUFNLGdCQUFnQixHQUFHLG1CQUFpQixDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbEMsZ0JBQWdCLENBQUMsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQy9FLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBcUM7WUFDMUQsTUFBTSxnQkFBZ0IsR0FBRyxtQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2xDLGdCQUFnQixDQUFDLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZ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