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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/base/common/async", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/contrib/notebook/common/notebookEditorModel"], function (require, exports, nls_1, instantiation_1, extHostCustomers_1, extHost_protocol_1, async_1, workingCopyFileService_1, notebookEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveParticipant = void 0;
    class ExtHostNotebookDocumentSaveParticipant {
        constructor(extHostContext) {
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookDocumentSaveParticipant);
        }
        async participate(workingCopy, context, _progress, token) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return undefined;
            }
            let _warningTimeout;
            const p = new Promise((resolve, reject) => {
                _warningTimeout = setTimeout(() => reject(new Error((0, nls_1.localize)('timeout.onWillSave', "Aborted onWillSaveNotebookDocument-event after 1750ms"))), 1750);
                this._proxy.$participateInSave(workingCopy.resource, context.reason, token).then(_ => {
                    clearTimeout(_warningTimeout);
                    return undefined;
                }).then(resolve, reject);
            });
            return (0, async_1.raceCancellationError)(p, token);
        }
    }
    let SaveParticipant = class SaveParticipant {
        constructor(extHostContext, instantiationService, workingCopyFileService) {
            this.workingCopyFileService = workingCopyFileService;
            this._saveParticipantDisposable = this.workingCopyFileService.addSaveParticipant(instantiationService.createInstance(ExtHostNotebookDocumentSaveParticipant, extHostContext));
        }
        dispose() {
            this._saveParticipantDisposable.dispose();
        }
    };
    exports.SaveParticipant = SaveParticipant;
    exports.SaveParticipant = SaveParticipant = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService),
        __param(2, workingCopyFileService_1.IWorkingCopyFileService)
    ], SaveParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rU2F2ZVBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWROb3RlYm9va1NhdmVQYXJ0aWNpcGFudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEcsTUFBTSxzQ0FBc0M7UUFJM0MsWUFBWSxjQUErQjtZQUMxQyxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQWdFLEVBQUUsT0FBcUQsRUFBRSxTQUFtQyxFQUFFLEtBQXdCO1lBRXZNLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxZQUFZLGtEQUE0QixDQUFDLEVBQUUsQ0FBQztnQkFDeEYsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksZUFBb0IsQ0FBQztZQUV6QixNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFFOUMsZUFBZSxHQUFHLFVBQVUsQ0FDM0IsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLHVEQUF1RCxDQUFDLENBQUMsQ0FBQyxFQUNoSCxJQUFJLENBQ0osQ0FBQztnQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3BGLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDOUIsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLElBQUEsNkJBQXFCLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDRDtJQUdNLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWU7UUFJM0IsWUFDQyxjQUErQixFQUNSLG9CQUEyQyxFQUN4QixzQkFBK0M7WUFBL0MsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUV6RixJQUFJLENBQUMsMEJBQTBCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxzQ0FBc0MsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQy9LLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNDLENBQUM7S0FDRCxDQUFBO0lBZlksMENBQWU7OEJBQWYsZUFBZTtRQUQzQixrQ0FBZTtRQU9iLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxnREFBdUIsQ0FBQTtPQVBiLGVBQWUsQ0FlM0IifQ==