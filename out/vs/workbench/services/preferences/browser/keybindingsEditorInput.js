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
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/platform", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/editor/editorInput", "vs/workbench/services/preferences/browser/keybindingsEditorModel"], function (require, exports, codicons_1, platform_1, nls, instantiation_1, iconRegistry_1, editorInput_1, keybindingsEditorModel_1) {
    "use strict";
    var KeybindingsEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditorInput = void 0;
    const KeybindingsEditorIcon = (0, iconRegistry_1.registerIcon)('keybindings-editor-label-icon', codicons_1.Codicon.keyboard, nls.localize('keybindingsEditorLabelIcon', 'Icon of the keybindings editor label.'));
    let KeybindingsEditorInput = class KeybindingsEditorInput extends editorInput_1.EditorInput {
        static { KeybindingsEditorInput_1 = this; }
        static { this.ID = 'workbench.input.keybindings'; }
        constructor(instantiationService) {
            super();
            this.searchOptions = null;
            this.resource = undefined;
            this.keybindingsModel = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, platform_1.OS);
        }
        get typeId() {
            return KeybindingsEditorInput_1.ID;
        }
        getName() {
            return nls.localize('keybindingsInputName', "Keyboard Shortcuts");
        }
        getIcon() {
            return KeybindingsEditorIcon;
        }
        async resolve() {
            return this.keybindingsModel;
        }
        matches(otherInput) {
            return otherInput instanceof KeybindingsEditorInput_1;
        }
        dispose() {
            this.keybindingsModel.dispose();
            super.dispose();
        }
    };
    exports.KeybindingsEditorInput = KeybindingsEditorInput;
    exports.KeybindingsEditorInput = KeybindingsEditorInput = KeybindingsEditorInput_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], KeybindingsEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wcmVmZXJlbmNlcy9icm93c2VyL2tleWJpbmRpbmdzRWRpdG9ySW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtCaEcsTUFBTSxxQkFBcUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsK0JBQStCLEVBQUUsa0JBQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDLENBQUM7SUFFNUssSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSx5QkFBVzs7aUJBRXRDLE9BQUUsR0FBVyw2QkFBNkIsQUFBeEMsQ0FBeUM7UUFPM0QsWUFBbUMsb0JBQTJDO1lBQzdFLEtBQUssRUFBRSxDQUFDO1lBTFQsa0JBQWEsR0FBMkMsSUFBSSxDQUFDO1lBRXBELGFBQVEsR0FBRyxTQUFTLENBQUM7WUFLN0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQ0FBc0IsRUFBRSxhQUFFLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRUQsSUFBYSxNQUFNO1lBQ2xCLE9BQU8sd0JBQXNCLENBQUMsRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVRLE9BQU87WUFDZixPQUFPLHFCQUFxQixDQUFDO1FBQzlCLENBQUM7UUFFUSxLQUFLLENBQUMsT0FBTztZQUNyQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixDQUFDO1FBRVEsT0FBTyxDQUFDLFVBQTZDO1lBQzdELE9BQU8sVUFBVSxZQUFZLHdCQUFzQixDQUFDO1FBQ3JELENBQUM7UUFFUSxPQUFPO1lBQ2YsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWhDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDOztJQXZDVyx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQVNyQixXQUFBLHFDQUFxQixDQUFBO09BVHRCLHNCQUFzQixDQXdDbEMifQ==