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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/marshalling", "vs/editor/browser/services/bulkEditService", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, buffer_1, marshalling_1, bulkEditService_1, log_1, uriIdentity_1, extHost_protocol_1, bulkCellEdits_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadBulkEdits = void 0;
    exports.reviveWorkspaceEditDto = reviveWorkspaceEditDto;
    let MainThreadBulkEdits = class MainThreadBulkEdits {
        constructor(_extHostContext, _bulkEditService, _logService, _uriIdentService) {
            this._bulkEditService = _bulkEditService;
            this._logService = _logService;
            this._uriIdentService = _uriIdentService;
        }
        dispose() { }
        $tryApplyWorkspaceEdit(dto, undoRedoGroupId, isRefactoring) {
            const edits = reviveWorkspaceEditDto(dto.value, this._uriIdentService);
            return this._bulkEditService.apply(edits, { undoRedoGroupId, respectAutoSaveConfig: isRefactoring }).then((res) => res.isApplied, err => {
                this._logService.warn(`IGNORING workspace edit: ${err}`);
                return false;
            });
        }
    };
    exports.MainThreadBulkEdits = MainThreadBulkEdits;
    exports.MainThreadBulkEdits = MainThreadBulkEdits = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadBulkEdits),
        __param(1, bulkEditService_1.IBulkEditService),
        __param(2, log_1.ILogService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], MainThreadBulkEdits);
    function reviveWorkspaceEditDto(data, uriIdentityService, resolveDataTransferFile) {
        if (!data || !data.edits) {
            return data;
        }
        const result = (0, marshalling_1.revive)(data);
        for (const edit of result.edits) {
            if (bulkEditService_1.ResourceTextEdit.is(edit)) {
                edit.resource = uriIdentityService.asCanonicalUri(edit.resource);
            }
            if (bulkEditService_1.ResourceFileEdit.is(edit)) {
                if (edit.options) {
                    const inContents = edit.options?.contents;
                    if (inContents) {
                        if (inContents.type === 'base64') {
                            edit.options.contents = Promise.resolve((0, buffer_1.decodeBase64)(inContents.value));
                        }
                        else {
                            if (resolveDataTransferFile) {
                                edit.options.contents = resolveDataTransferFile(inContents.id);
                            }
                            else {
                                throw new Error('Could not revive data transfer file');
                            }
                        }
                    }
                }
                edit.newResource = edit.newResource && uriIdentityService.asCanonicalUri(edit.newResource);
                edit.oldResource = edit.oldResource && uriIdentityService.asCanonicalUri(edit.oldResource);
            }
            if (bulkCellEdits_1.ResourceNotebookCellEdit.is(edit)) {
                edit.resource = uriIdentityService.asCanonicalUri(edit.resource);
                const cellEdit = edit.cellEdit;
                if (cellEdit.editType === 1 /* CellEditType.Replace */) {
                    edit.cellEdit = {
                        ...cellEdit,
                        cells: cellEdit.cells.map(cell => ({
                            ...cell,
                            outputs: cell.outputs.map(output => ({
                                ...output,
                                outputs: output.items.map(item => {
                                    return {
                                        mime: item.mime,
                                        data: item.valueBytes
                                    };
                                })
                            }))
                        }))
                    };
                }
            }
        }
        return data;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEJ1bGtFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkQnVsa0VkaXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNDaEcsd0RBa0RDO0lBeEVNLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBRS9CLFlBQ0MsZUFBZ0MsRUFDRyxnQkFBa0MsRUFDdkMsV0FBd0IsRUFDaEIsZ0JBQXFDO1lBRnhDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDdkMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDaEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFxQjtRQUN4RSxDQUFDO1FBRUwsT0FBTyxLQUFXLENBQUM7UUFFbkIsc0JBQXNCLENBQUMsR0FBcUQsRUFBRSxlQUF3QixFQUFFLGFBQXVCO1lBQzlILE1BQU0sS0FBSyxHQUFHLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDdkUsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLGVBQWUsRUFBRSxxQkFBcUIsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDdkksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3pELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQWxCWSxrREFBbUI7a0NBQW5C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