/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/workbench/common/editor/editorInput", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls, uri_1, editorInput_1, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RuntimeExtensionsInput = void 0;
    const RuntimeExtensionsEditorIcon = (0, iconRegistry_1.registerIcon)('runtime-extensions-editor-label-icon', codicons_1.Codicon.extensions, nls.localize('runtimeExtensionEditorLabelIcon', 'Icon of the runtime extensions editor label.'));
    class RuntimeExtensionsInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = uri_1.URI.from({
                scheme: 'runtime-extensions',
                path: 'default'
            });
        }
        static { this.ID = 'workbench.runtimeExtensions.input'; }
        get typeId() {
            return RuntimeExtensionsInput.ID;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */;
        }
        static get instance() {
            if (!RuntimeExtensionsInput._instance || RuntimeExtensionsInput._instance.isDisposed()) {
                RuntimeExtensionsInput._instance = new RuntimeExtensionsInput();
            }
            return RuntimeExtensionsInput._instance;
        }
        getName() {
            return nls.localize('extensionsInputName', "Running Extensions");
        }
        getIcon() {
            return RuntimeExtensionsEditorIcon;
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            return other instanceof RuntimeExtensionsInput;
        }
    }
    exports.RuntimeExtensionsInput = RuntimeExtensionsInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZUV4dGVuc2lvbnNJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvY29tbW9uL3J1bnRpbWVFeHRlbnNpb25zSW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQU0sMkJBQTJCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLHNDQUFzQyxFQUFFLGtCQUFPLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUNBQWlDLEVBQUUsOENBQThDLENBQUMsQ0FBQyxDQUFDO0lBRTlNLE1BQWEsc0JBQXVCLFNBQVEseUJBQVc7UUFBdkQ7O1lBcUJVLGFBQVEsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDO2dCQUM1QixNQUFNLEVBQUUsb0JBQW9CO2dCQUM1QixJQUFJLEVBQUUsU0FBUzthQUNmLENBQUMsQ0FBQztRQWdCSixDQUFDO2lCQXRDZ0IsT0FBRSxHQUFHLG1DQUFtQyxBQUF0QyxDQUF1QztRQUV6RCxJQUFhLE1BQU07WUFDbEIsT0FBTyxzQkFBc0IsQ0FBQyxFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVELElBQWEsWUFBWTtZQUN4QixPQUFPLG9GQUFvRSxDQUFDO1FBQzdFLENBQUM7UUFHRCxNQUFNLEtBQUssUUFBUTtZQUNsQixJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxJQUFJLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUN4RixzQkFBc0IsQ0FBQyxTQUFTLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO1lBQ2pFLENBQUM7WUFFRCxPQUFPLHNCQUFzQixDQUFDLFNBQVMsQ0FBQztRQUN6QyxDQUFDO1FBT1EsT0FBTztZQUNmLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTywyQkFBMkIsQ0FBQztRQUNwQyxDQUFDO1FBRVEsT0FBTyxDQUFDLEtBQXdDO1lBQ3hELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLEtBQUssWUFBWSxzQkFBc0IsQ0FBQztRQUNoRCxDQUFDOztJQXZDRix3REF3Q0MifQ==