/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/editor/editorInput"], function (require, exports, codicons_1, network_1, uri_1, nls_1, iconRegistry_1, editorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustEditorInput = void 0;
    const WorkspaceTrustEditorIcon = (0, iconRegistry_1.registerIcon)('workspace-trust-editor-label-icon', codicons_1.Codicon.shield, (0, nls_1.localize)('workspaceTrustEditorLabelIcon', 'Icon of the workspace trust editor label.'));
    class WorkspaceTrustEditorInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = uri_1.URI.from({
                scheme: network_1.Schemas.vscodeWorkspaceTrust,
                path: `workspaceTrustEditor`
            });
        }
        static { this.ID = 'workbench.input.workspaceTrust'; }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */;
        }
        get typeId() {
            return WorkspaceTrustEditorInput.ID;
        }
        matches(otherInput) {
            return super.matches(otherInput) || otherInput instanceof WorkspaceTrustEditorInput;
        }
        getName() {
            return (0, nls_1.localize)('workspaceTrustEditorInputName', "Workspace Trust");
        }
        getIcon() {
            return WorkspaceTrustEditorIcon;
        }
    }
    exports.WorkspaceTrustEditorInput = WorkspaceTrustEditorInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3RFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3Jrc3BhY2VzL2Jyb3dzZXIvd29ya3NwYWNlVHJ1c3RFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBTSx3QkFBd0IsR0FBRyxJQUFBLDJCQUFZLEVBQUMsbUNBQW1DLEVBQUUsa0JBQU8sQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsK0JBQStCLEVBQUUsMkNBQTJDLENBQUMsQ0FBQyxDQUFDO0lBRTNMLE1BQWEseUJBQTBCLFNBQVEseUJBQVc7UUFBMUQ7O1lBV1UsYUFBUSxHQUFRLFNBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pDLE1BQU0sRUFBRSxpQkFBTyxDQUFDLG9CQUFvQjtnQkFDcEMsSUFBSSxFQUFFLHNCQUFzQjthQUM1QixDQUFDLENBQUM7UUFhSixDQUFDO2lCQTFCZ0IsT0FBRSxHQUFXLGdDQUFnQyxBQUEzQyxDQUE0QztRQUU5RCxJQUFhLFlBQVk7WUFDeEIsT0FBTyxvRkFBb0UsQ0FBQztRQUM3RSxDQUFDO1FBRUQsSUFBYSxNQUFNO1lBQ2xCLE9BQU8seUJBQXlCLENBQUMsRUFBRSxDQUFDO1FBQ3JDLENBQUM7UUFPUSxPQUFPLENBQUMsVUFBNkM7WUFDN0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLFVBQVUsWUFBWSx5QkFBeUIsQ0FBQztRQUNyRixDQUFDO1FBRVEsT0FBTztZQUNmLE9BQU8sSUFBQSxjQUFRLEVBQUMsK0JBQStCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRVEsT0FBTztZQUNmLE9BQU8sd0JBQXdCLENBQUM7UUFDakMsQ0FBQzs7SUExQkYsOERBMkJDIn0=