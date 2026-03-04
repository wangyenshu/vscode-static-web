/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor/editorInput", "vs/nls", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, editorInput_1, nls_1, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisassemblyViewInput = void 0;
    const DisassemblyEditorIcon = (0, iconRegistry_1.registerIcon)('disassembly-editor-label-icon', codicons_1.Codicon.debug, (0, nls_1.localize)('disassemblyEditorLabelIcon', 'Icon of the disassembly editor label.'));
    class DisassemblyViewInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = undefined;
        }
        static { this.ID = 'debug.disassemblyView.input'; }
        get typeId() {
            return DisassemblyViewInput.ID;
        }
        static get instance() {
            if (!DisassemblyViewInput._instance || DisassemblyViewInput._instance.isDisposed()) {
                DisassemblyViewInput._instance = new DisassemblyViewInput();
            }
            return DisassemblyViewInput._instance;
        }
        getName() {
            return (0, nls_1.localize)('disassemblyInputName', "Disassembly");
        }
        getIcon() {
            return DisassemblyEditorIcon;
        }
        matches(other) {
            return other instanceof DisassemblyViewInput;
        }
    }
    exports.DisassemblyViewInput = DisassemblyViewInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzYXNzZW1ibHlWaWV3SW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vZGlzYXNzZW1ibHlWaWV3SW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQU0scUJBQXFCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLCtCQUErQixFQUFFLGtCQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLHVDQUF1QyxDQUFDLENBQUMsQ0FBQztJQUU1SyxNQUFhLG9CQUFxQixTQUFRLHlCQUFXO1FBQXJEOztZQWlCVSxhQUFRLEdBQUcsU0FBUyxDQUFDO1FBYy9CLENBQUM7aUJBN0JnQixPQUFFLEdBQUcsNkJBQTZCLEFBQWhDLENBQWlDO1FBRW5ELElBQWEsTUFBTTtZQUNsQixPQUFPLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBR0QsTUFBTSxLQUFLLFFBQVE7WUFDbEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDcEYsb0JBQW9CLENBQUMsU0FBUyxHQUFHLElBQUksb0JBQW9CLEVBQUUsQ0FBQztZQUM3RCxDQUFDO1lBRUQsT0FBTyxvQkFBb0IsQ0FBQyxTQUFTLENBQUM7UUFDdkMsQ0FBQztRQUlRLE9BQU87WUFDZixPQUFPLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxxQkFBcUIsQ0FBQztRQUM5QixDQUFDO1FBRVEsT0FBTyxDQUFDLEtBQWM7WUFDOUIsT0FBTyxLQUFLLFlBQVksb0JBQW9CLENBQUM7UUFDOUMsQ0FBQzs7SUE3QkYsb0RBK0JDIn0=