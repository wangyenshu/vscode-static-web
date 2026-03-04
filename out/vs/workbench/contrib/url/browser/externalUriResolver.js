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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/workbench/services/environment/browser/environmentService"], function (require, exports, lifecycle_1, opener_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalUriResolverContribution = void 0;
    let ExternalUriResolverContribution = class ExternalUriResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.externalUriResolver'; }
        constructor(_openerService, _workbenchEnvironmentService) {
            super();
            if (_workbenchEnvironmentService.options?.resolveExternalUri) {
                this._register(_openerService.registerExternalUriResolver({
                    resolveExternalUri: async (resource) => {
                        return {
                            resolved: await _workbenchEnvironmentService.options.resolveExternalUri(resource),
                            dispose: () => {
                                // TODO@mjbvz - do we need to do anything here?
                            }
                        };
                    }
                }));
            }
        }
    };
    exports.ExternalUriResolverContribution = ExternalUriResolverContribution;
    exports.ExternalUriResolverContribution = ExternalUriResolverContribution = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], ExternalUriResolverContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxVcmlSZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VybC9icm93c2VyL2V4dGVybmFsVXJpUmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBT3pGLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQWdDLFNBQVEsc0JBQVU7aUJBRTlDLE9BQUUsR0FBRyx1Q0FBdUMsQUFBMUMsQ0FBMkM7UUFFN0QsWUFDaUIsY0FBOEIsRUFDVCw0QkFBaUU7WUFFdEcsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLDRCQUE0QixDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxDQUFDO2dCQUM5RCxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQztvQkFDekQsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO3dCQUN0QyxPQUFPOzRCQUNOLFFBQVEsRUFBRSxNQUFNLDRCQUE0QixDQUFDLE9BQVEsQ0FBQyxrQkFBbUIsQ0FBQyxRQUFRLENBQUM7NEJBQ25GLE9BQU8sRUFBRSxHQUFHLEVBQUU7Z0NBQ2IsK0NBQStDOzRCQUNoRCxDQUFDO3lCQUNELENBQUM7b0JBQ0gsQ0FBQztpQkFDRCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDOztJQXRCVywwRUFBK0I7OENBQS9CLCtCQUErQjtRQUt6QyxXQUFBLHVCQUFjLENBQUE7UUFDZCxXQUFBLHdEQUFtQyxDQUFBO09BTnpCLCtCQUErQixDQXVCM0MifQ==