/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/workbench/common/editor/editorInput", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/path", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, network_1, uri_1, nls_1, editorInput_1, extensionManagementUtil_1, path_1, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsInput = void 0;
    const ExtensionEditorIcon = (0, iconRegistry_1.registerIcon)('extensions-editor-label-icon', codicons_1.Codicon.extensions, (0, nls_1.localize)('extensionsEditorLabelIcon', 'Icon of the extensions editor label.'));
    class ExtensionsInput extends editorInput_1.EditorInput {
        static { this.ID = 'workbench.extensions.input2'; }
        get typeId() {
            return ExtensionsInput.ID;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */;
        }
        get resource() {
            return uri_1.URI.from({
                scheme: network_1.Schemas.extension,
                path: (0, path_1.join)(this._extension.identifier.id, 'extension')
            });
        }
        constructor(_extension) {
            super();
            this._extension = _extension;
        }
        get extension() { return this._extension; }
        getName() {
            return (0, nls_1.localize)('extensionsInputName', "Extension: {0}", this._extension.displayName);
        }
        getIcon() {
            return ExtensionEditorIcon;
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            return other instanceof ExtensionsInput && (0, extensionManagementUtil_1.areSameExtensions)(this._extension.identifier, other._extension.identifier);
        }
    }
    exports.ExtensionsInput = ExtensionsInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0lucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9uc0lucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFNLG1CQUFtQixHQUFHLElBQUEsMkJBQVksRUFBQyw4QkFBOEIsRUFBRSxrQkFBTyxDQUFDLFVBQVUsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDLENBQUM7SUFTNUssTUFBYSxlQUFnQixTQUFRLHlCQUFXO2lCQUUvQixPQUFFLEdBQUcsNkJBQTZCLENBQUM7UUFFbkQsSUFBYSxNQUFNO1lBQ2xCLE9BQU8sZUFBZSxDQUFDLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBYSxZQUFZO1lBQ3hCLE9BQU8sb0ZBQW9FLENBQUM7UUFDN0UsQ0FBQztRQUVELElBQWEsUUFBUTtZQUNwQixPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2YsTUFBTSxFQUFFLGlCQUFPLENBQUMsU0FBUztnQkFDekIsSUFBSSxFQUFFLElBQUEsV0FBSSxFQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUM7YUFDdEQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELFlBQW9CLFVBQXNCO1lBQ3pDLEtBQUssRUFBRSxDQUFDO1lBRFcsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUUxQyxDQUFDO1FBRUQsSUFBSSxTQUFTLEtBQWlCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFOUMsT0FBTztZQUNmLE9BQU8sSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBRVEsT0FBTztZQUNmLE9BQU8sbUJBQW1CLENBQUM7UUFDNUIsQ0FBQztRQUVRLE9BQU8sQ0FBQyxLQUF3QztZQUN4RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxLQUFLLFlBQVksZUFBZSxJQUFJLElBQUEsMkNBQWlCLEVBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2SCxDQUFDOztJQXZDRiwwQ0F3Q0MifQ==