/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/parts/editor/editorTabsControl", "vs/base/browser/dom", "vs/css!./media/singleeditortabscontrol"], function (require, exports, editorTabsControl_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoEditorTabsControl = void 0;
    class NoEditorTabsControl extends editorTabsControl_1.EditorTabsControl {
        constructor() {
            super(...arguments);
            this.activeEditor = null;
        }
        prepareEditorActions(editorActions) {
            return {
                primary: [],
                secondary: []
            };
        }
        openEditor(editor) {
            return this.handleOpenedEditors();
        }
        openEditors(editors) {
            return this.handleOpenedEditors();
        }
        handleOpenedEditors() {
            const didChange = this.activeEditorChanged();
            this.activeEditor = this.tabsModel.activeEditor;
            return didChange;
        }
        activeEditorChanged() {
            if (!this.activeEditor && this.tabsModel.activeEditor || // active editor changed from null => editor
                this.activeEditor && !this.tabsModel.activeEditor || // active editor changed from editor => null
                (!this.activeEditor || !this.tabsModel.isActive(this.activeEditor)) // active editor changed from editorA => editorB
            ) {
                return true;
            }
            return false;
        }
        beforeCloseEditor(editor) { }
        closeEditor(editor) { }
        closeEditors(editors) { }
        moveEditor(editor, fromIndex, targetIndex) { }
        pinEditor(editor) { }
        stickEditor(editor) { }
        unstickEditor(editor) { }
        setActive(isActive) { }
        updateEditorLabel(editor) { }
        updateEditorDirty(editor) { }
        getHeight() {
            return 0;
        }
        layout(dimensions) {
            return new dom_1.Dimension(dimensions.container.width, this.getHeight());
        }
    }
    exports.NoEditorTabsControl = NoEditorTabsControl;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9FZGl0b3JUYWJzQ29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9ub0VkaXRvclRhYnNDb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLG1CQUFvQixTQUFRLHFDQUFpQjtRQUExRDs7WUFDUyxpQkFBWSxHQUF1QixJQUFJLENBQUM7UUE2RGpELENBQUM7UUEzRFUsb0JBQW9CLENBQUMsYUFBOEI7WUFDNUQsT0FBTztnQkFDTixPQUFPLEVBQUUsRUFBRTtnQkFDWCxTQUFTLEVBQUUsRUFBRTthQUNiLENBQUM7UUFDSCxDQUFDO1FBRUQsVUFBVSxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUVELFdBQVcsQ0FBQyxPQUFzQjtZQUNqQyxPQUFPLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFTyxtQkFBbUI7WUFDMUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUNoRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU8sbUJBQW1CO1lBQzFCLElBQ0MsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxJQUFRLDRDQUE0QztnQkFDckcsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxJQUFRLDRDQUE0QztnQkFDckcsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxnREFBZ0Q7Y0FDbkgsQ0FBQztnQkFDRixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxNQUFtQixJQUFVLENBQUM7UUFFaEQsV0FBVyxDQUFDLE1BQW1CLElBQVUsQ0FBQztRQUUxQyxZQUFZLENBQUMsT0FBc0IsSUFBVSxDQUFDO1FBRTlDLFVBQVUsQ0FBQyxNQUFtQixFQUFFLFNBQWlCLEVBQUUsV0FBbUIsSUFBVSxDQUFDO1FBRWpGLFNBQVMsQ0FBQyxNQUFtQixJQUFVLENBQUM7UUFFeEMsV0FBVyxDQUFDLE1BQW1CLElBQVUsQ0FBQztRQUUxQyxhQUFhLENBQUMsTUFBbUIsSUFBVSxDQUFDO1FBRTVDLFNBQVMsQ0FBQyxRQUFpQixJQUFVLENBQUM7UUFFdEMsaUJBQWlCLENBQUMsTUFBbUIsSUFBVSxDQUFDO1FBRWhELGlCQUFpQixDQUFDLE1BQW1CLElBQVUsQ0FBQztRQUVoRCxTQUFTO1lBQ1IsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBRUQsTUFBTSxDQUFDLFVBQXlDO1lBQy9DLE9BQU8sSUFBSSxlQUFTLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDcEUsQ0FBQztLQUNEO0lBOURELGtEQThEQyJ9