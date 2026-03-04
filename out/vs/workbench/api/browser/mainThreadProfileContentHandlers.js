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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, lifecycle_1, marshalling_1, extHost_protocol_1, extHostCustomers_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadProfileContentHandlers = void 0;
    let MainThreadProfileContentHandlers = class MainThreadProfileContentHandlers extends lifecycle_1.Disposable {
        constructor(context, userDataProfileImportExportService) {
            super();
            this.userDataProfileImportExportService = userDataProfileImportExportService;
            this.registeredHandlers = this._register(new lifecycle_1.DisposableMap());
            this.proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostProfileContentHandlers);
        }
        async $registerProfileContentHandler(id, name, description, extensionId) {
            this.registeredHandlers.set(id, this.userDataProfileImportExportService.registerProfileContentHandler(id, {
                name,
                description,
                extensionId,
                saveProfile: async (name, content, token) => {
                    const result = await this.proxy.$saveProfile(id, name, content, token);
                    return result ? (0, marshalling_1.revive)(result) : null;
                },
                readProfile: async (uri, token) => {
                    return this.proxy.$readProfile(id, uri, token);
                },
            }));
        }
        async $unregisterProfileContentHandler(id) {
            this.registeredHandlers.deleteAndDispose(id);
        }
    };
    exports.MainThreadProfileContentHandlers = MainThreadProfileContentHandlers;
    exports.MainThreadProfileContentHandlers = MainThreadProfileContentHandlers = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadProfileContentHandlers),
        __param(1, userDataProfile_1.IUserDataProfileImportExportService)
    ], MainThreadProfileContentHandlers);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFByb2ZpbGVDb250ZW50SGFuZGxlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFByb2ZpbGVDb250ZW50SGFuZGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7UUFNL0QsWUFDQyxPQUF3QixFQUNhLGtDQUF3RjtZQUU3SCxLQUFLLEVBQUUsQ0FBQztZQUY4Qyx1Q0FBa0MsR0FBbEMsa0NBQWtDLENBQXFDO1lBSjdHLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUF1QixDQUFDLENBQUM7WUFPOUYsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRUQsS0FBSyxDQUFDLDhCQUE4QixDQUFDLEVBQVUsRUFBRSxJQUFZLEVBQUUsV0FBK0IsRUFBRSxXQUFtQjtZQUNsSCxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsa0NBQWtDLENBQUMsNkJBQTZCLENBQUMsRUFBRSxFQUFFO2dCQUN6RyxJQUFJO2dCQUNKLFdBQVc7Z0JBQ1gsV0FBVztnQkFDWCxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQVksRUFBRSxPQUFlLEVBQUUsS0FBd0IsRUFBRSxFQUFFO29CQUM5RSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUN2RSxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBQSxvQkFBTSxFQUFxQixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMzRCxDQUFDO2dCQUNELFdBQVcsRUFBRSxLQUFLLEVBQUUsR0FBUSxFQUFFLEtBQXdCLEVBQUUsRUFBRTtvQkFDekQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLEVBQVU7WUFDaEQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7S0FFRCxDQUFBO0lBakNZLDRFQUFnQzsrQ0FBaEMsZ0NBQWdDO1FBRDVDLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyxnQ0FBZ0MsQ0FBQztRQVNoRSxXQUFBLHFEQUFtQyxDQUFBO09BUnpCLGdDQUFnQyxDQWlDNUMifQ==