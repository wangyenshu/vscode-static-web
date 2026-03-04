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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, extHost_protocol_1, extHostRpcService_1, extHostTypeConverters_1, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostBulkEdits = void 0;
    let ExtHostBulkEdits = class ExtHostBulkEdits {
        constructor(extHostRpc, extHostDocumentsAndEditors) {
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadBulkEdits);
            this._versionInformationProvider = {
                getTextDocumentVersion: uri => extHostDocumentsAndEditors.getDocument(uri)?.version,
                getNotebookDocumentVersion: () => undefined
            };
        }
        applyWorkspaceEdit(edit, extension, metadata) {
            const dto = new proxyIdentifier_1.SerializableObjectWithBuffers(extHostTypeConverters_1.WorkspaceEdit.from(edit, this._versionInformationProvider));
            return this._proxy.$tryApplyWorkspaceEdit(dto, undefined, metadata?.isRefactoring ?? false);
        }
    };
    exports.ExtHostBulkEdits = ExtHostBulkEdits;
    exports.ExtHostBulkEdits = ExtHostBulkEdits = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostBulkEdits);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEJ1bGtFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RCdWxrRWRpdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO1FBSzVCLFlBQ3FCLFVBQThCLEVBQ2xELDBCQUFzRDtZQUV0RCxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBRW5FLElBQUksQ0FBQywyQkFBMkIsR0FBRztnQkFDbEMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTztnQkFDbkYsMEJBQTBCLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUzthQUMzQyxDQUFDO1FBQ0gsQ0FBQztRQUVELGtCQUFrQixDQUFDLElBQTBCLEVBQUUsU0FBZ0MsRUFBRSxRQUFrRDtZQUNsSSxNQUFNLEdBQUcsR0FBRyxJQUFJLCtDQUE2QixDQUFDLHFDQUFhLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1lBQzFHLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxhQUFhLElBQUksS0FBSyxDQUFDLENBQUM7UUFDN0YsQ0FBQztLQUNELENBQUE7SUFyQlksNENBQWdCOytCQUFoQixnQkFBZ0I7UUFNMUIsV0FBQSxzQ0FBa0IsQ0FBQTtPQU5SLGdCQUFnQixDQXFCNUIifQ==