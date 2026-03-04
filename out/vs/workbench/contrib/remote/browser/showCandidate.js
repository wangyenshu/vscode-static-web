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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/remote/common/remoteExplorerService"], function (require, exports, lifecycle_1, environmentService_1, remoteExplorerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowCandidateContribution = void 0;
    let ShowCandidateContribution = class ShowCandidateContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.showPortCandidate'; }
        constructor(remoteExplorerService, environmentService) {
            super();
            const showPortCandidate = environmentService.options?.tunnelProvider?.showPortCandidate;
            if (showPortCandidate) {
                this._register(remoteExplorerService.setCandidateFilter(async (candidates) => {
                    const filters = await Promise.all(candidates.map(candidate => showPortCandidate(candidate.host, candidate.port, candidate.detail ?? '')));
                    const filteredCandidates = [];
                    if (filters.length !== candidates.length) {
                        return candidates;
                    }
                    for (let i = 0; i < candidates.length; i++) {
                        if (filters[i]) {
                            filteredCandidates.push(candidates[i]);
                        }
                    }
                    return filteredCandidates;
                }));
            }
        }
    };
    exports.ShowCandidateContribution = ShowCandidateContribution;
    exports.ShowCandidateContribution = ShowCandidateContribution = __decorate([
        __param(0, remoteExplorerService_1.IRemoteExplorerService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], ShowCandidateContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hvd0NhbmRpZGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3JlbW90ZS9icm93c2VyL3Nob3dDYW5kaWRhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7aUJBRXhDLE9BQUUsR0FBRyxxQ0FBcUMsQUFBeEMsQ0FBeUM7UUFFM0QsWUFDeUIscUJBQTZDLEVBQ2hDLGtCQUF1RDtZQUU1RixLQUFLLEVBQUUsQ0FBQztZQUNSLE1BQU0saUJBQWlCLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQztZQUN4RixJQUFJLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFVBQTJCLEVBQTRCLEVBQUU7b0JBQ3ZILE1BQU0sT0FBTyxHQUFjLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNySixNQUFNLGtCQUFrQixHQUFvQixFQUFFLENBQUM7b0JBQy9DLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzFDLE9BQU8sVUFBVSxDQUFDO29CQUNuQixDQUFDO29CQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQzVDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2hCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDeEMsQ0FBQztvQkFDRixDQUFDO29CQUNELE9BQU8sa0JBQWtCLENBQUM7Z0JBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQzs7SUF6QlcsOERBQXlCO3dDQUF6Qix5QkFBeUI7UUFLbkMsV0FBQSw4Q0FBc0IsQ0FBQTtRQUN0QixXQUFBLHdEQUFtQyxDQUFBO09BTnpCLHlCQUF5QixDQTBCckMifQ==