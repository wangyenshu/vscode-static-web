/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorCommon"], function (require, exports, editorCommon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorState = exports.MouseTargetType = exports.OverlayWidgetPositionPreference = exports.ContentWidgetPositionPreference = void 0;
    exports.isCodeEditor = isCodeEditor;
    exports.isDiffEditor = isDiffEditor;
    exports.isCompositeEditor = isCompositeEditor;
    exports.getCodeEditor = getCodeEditor;
    exports.getIEditor = getIEditor;
    /**
     * A positioning preference for rendering content widgets.
     */
    var ContentWidgetPositionPreference;
    (function (ContentWidgetPositionPreference) {
        /**
         * Place the content widget exactly at a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["EXACT"] = 0] = "EXACT";
        /**
         * Place the content widget above a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["ABOVE"] = 1] = "ABOVE";
        /**
         * Place the content widget below a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["BELOW"] = 2] = "BELOW";
    })(ContentWidgetPositionPreference || (exports.ContentWidgetPositionPreference = ContentWidgetPositionPreference = {}));
    /**
     * A positioning preference for rendering overlay widgets.
     */
    var OverlayWidgetPositionPreference;
    (function (OverlayWidgetPositionPreference) {
        /**
         * Position the overlay widget in the top right corner
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["TOP_RIGHT_CORNER"] = 0] = "TOP_RIGHT_CORNER";
        /**
         * Position the overlay widget in the bottom right corner
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["BOTTOM_RIGHT_CORNER"] = 1] = "BOTTOM_RIGHT_CORNER";
        /**
         * Position the overlay widget in the top center
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["TOP_CENTER"] = 2] = "TOP_CENTER";
    })(OverlayWidgetPositionPreference || (exports.OverlayWidgetPositionPreference = OverlayWidgetPositionPreference = {}));
    /**
     * Type of hit element with the mouse in the editor.
     */
    var MouseTargetType;
    (function (MouseTargetType) {
        /**
         * Mouse is on top of an unknown element.
         */
        MouseTargetType[MouseTargetType["UNKNOWN"] = 0] = "UNKNOWN";
        /**
         * Mouse is on top of the textarea used for input.
         */
        MouseTargetType[MouseTargetType["TEXTAREA"] = 1] = "TEXTAREA";
        /**
         * Mouse is on top of the glyph margin
         */
        MouseTargetType[MouseTargetType["GUTTER_GLYPH_MARGIN"] = 2] = "GUTTER_GLYPH_MARGIN";
        /**
         * Mouse is on top of the line numbers
         */
        MouseTargetType[MouseTargetType["GUTTER_LINE_NUMBERS"] = 3] = "GUTTER_LINE_NUMBERS";
        /**
         * Mouse is on top of the line decorations
         */
        MouseTargetType[MouseTargetType["GUTTER_LINE_DECORATIONS"] = 4] = "GUTTER_LINE_DECORATIONS";
        /**
         * Mouse is on top of the whitespace left in the gutter by a view zone.
         */
        MouseTargetType[MouseTargetType["GUTTER_VIEW_ZONE"] = 5] = "GUTTER_VIEW_ZONE";
        /**
         * Mouse is on top of text in the content.
         */
        MouseTargetType[MouseTargetType["CONTENT_TEXT"] = 6] = "CONTENT_TEXT";
        /**
         * Mouse is on top of empty space in the content (e.g. after line text or below last line)
         */
        MouseTargetType[MouseTargetType["CONTENT_EMPTY"] = 7] = "CONTENT_EMPTY";
        /**
         * Mouse is on top of a view zone in the content.
         */
        MouseTargetType[MouseTargetType["CONTENT_VIEW_ZONE"] = 8] = "CONTENT_VIEW_ZONE";
        /**
         * Mouse is on top of a content widget.
         */
        MouseTargetType[MouseTargetType["CONTENT_WIDGET"] = 9] = "CONTENT_WIDGET";
        /**
         * Mouse is on top of the decorations overview ruler.
         */
        MouseTargetType[MouseTargetType["OVERVIEW_RULER"] = 10] = "OVERVIEW_RULER";
        /**
         * Mouse is on top of a scrollbar.
         */
        MouseTargetType[MouseTargetType["SCROLLBAR"] = 11] = "SCROLLBAR";
        /**
         * Mouse is on top of an overlay widget.
         */
        MouseTargetType[MouseTargetType["OVERLAY_WIDGET"] = 12] = "OVERLAY_WIDGET";
        /**
         * Mouse is outside of the editor.
         */
        MouseTargetType[MouseTargetType["OUTSIDE_EDITOR"] = 13] = "OUTSIDE_EDITOR";
    })(MouseTargetType || (exports.MouseTargetType = MouseTargetType = {}));
    /**
     * @internal
     */
    var DiffEditorState;
    (function (DiffEditorState) {
        DiffEditorState[DiffEditorState["Idle"] = 0] = "Idle";
        DiffEditorState[DiffEditorState["ComputingDiff"] = 1] = "ComputingDiff";
        DiffEditorState[DiffEditorState["DiffComputed"] = 2] = "DiffComputed";
    })(DiffEditorState || (exports.DiffEditorState = DiffEditorState = {}));
    /**
     *@internal
     */
    function isCodeEditor(thing) {
        if (thing && typeof thing.getEditorType === 'function') {
            return thing.getEditorType() === editorCommon.EditorType.ICodeEditor;
        }
        else {
            return false;
        }
    }
    /**
     *@internal
     */
    function isDiffEditor(thing) {
        if (thing && typeof thing.getEditorType === 'function') {
            return thing.getEditorType() === editorCommon.EditorType.IDiffEditor;
        }
        else {
            return false;
        }
    }
    /**
     *@internal
     */
    function isCompositeEditor(thing) {
        return !!thing
            && typeof thing === 'object'
            && typeof thing.onDidChangeActiveEditor === 'function';
    }
    /**
     *@internal
     */
    function getCodeEditor(thing) {
        if (isCodeEditor(thing)) {
            return thing;
        }
        if (isDiffEditor(thing)) {
            return thing.getModifiedEditor();
        }
        if (isCompositeEditor(thing) && isCodeEditor(thing.activeCodeEditor)) {
            return thing.activeCodeEditor;
        }
        return null;
    }
    /**
     *@internal
     */
    function getIEditor(thing) {
        if (isCodeEditor(thing) || isDiffEditor(thing)) {
            return thing;
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2VkaXRvckJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK3lDaEcsb0NBTUM7SUFLRCxvQ0FNQztJQUtELDhDQUtDO0lBS0Qsc0NBY0M7SUFLRCxnQ0FNQztJQXB2Q0Q7O09BRUc7SUFDSCxJQUFrQiwrQkFhakI7SUFiRCxXQUFrQiwrQkFBK0I7UUFDaEQ7O1dBRUc7UUFDSCx1RkFBSyxDQUFBO1FBQ0w7O1dBRUc7UUFDSCx1RkFBSyxDQUFBO1FBQ0w7O1dBRUc7UUFDSCx1RkFBSyxDQUFBO0lBQ04sQ0FBQyxFQWJpQiwrQkFBK0IsK0NBQS9CLCtCQUErQixRQWFoRDtJQTBFRDs7T0FFRztJQUNILElBQWtCLCtCQWVqQjtJQWZELFdBQWtCLCtCQUErQjtRQUNoRDs7V0FFRztRQUNILDZHQUFnQixDQUFBO1FBRWhCOztXQUVHO1FBQ0gsbUhBQW1CLENBQUE7UUFFbkI7O1dBRUc7UUFDSCxpR0FBVSxDQUFBO0lBQ1gsQ0FBQyxFQWZpQiwrQkFBK0IsK0NBQS9CLCtCQUErQixRQWVoRDtJQTBGRDs7T0FFRztJQUNILElBQWtCLGVBeURqQjtJQXpERCxXQUFrQixlQUFlO1FBQ2hDOztXQUVHO1FBQ0gsMkRBQU8sQ0FBQTtRQUNQOztXQUVHO1FBQ0gsNkRBQVEsQ0FBQTtRQUNSOztXQUVHO1FBQ0gsbUZBQW1CLENBQUE7UUFDbkI7O1dBRUc7UUFDSCxtRkFBbUIsQ0FBQTtRQUNuQjs7V0FFRztRQUNILDJGQUF1QixDQUFBO1FBQ3ZCOztXQUVHO1FBQ0gsNkVBQWdCLENBQUE7UUFDaEI7O1dBRUc7UUFDSCxxRUFBWSxDQUFBO1FBQ1o7O1dBRUc7UUFDSCx1RUFBYSxDQUFBO1FBQ2I7O1dBRUc7UUFDSCwrRUFBaUIsQ0FBQTtRQUNqQjs7V0FFRztRQUNILHlFQUFjLENBQUE7UUFDZDs7V0FFRztRQUNILDBFQUFjLENBQUE7UUFDZDs7V0FFRztRQUNILGdFQUFTLENBQUE7UUFDVDs7V0FFRztRQUNILDBFQUFjLENBQUE7UUFDZDs7V0FFRztRQUNILDBFQUFjLENBQUE7SUFDZixDQUFDLEVBekRpQixlQUFlLCtCQUFmLGVBQWUsUUF5RGhDO0lBMnpCRDs7T0FFRztJQUNILElBQWtCLGVBSWpCO0lBSkQsV0FBa0IsZUFBZTtRQUNoQyxxREFBSSxDQUFBO1FBQ0osdUVBQWEsQ0FBQTtRQUNiLHFFQUFZLENBQUE7SUFDYixDQUFDLEVBSmlCLGVBQWUsK0JBQWYsZUFBZSxRQUloQztJQW9IRDs7T0FFRztJQUNILFNBQWdCLFlBQVksQ0FBQyxLQUFjO1FBQzFDLElBQUksS0FBSyxJQUFJLE9BQXFCLEtBQU0sQ0FBQyxhQUFhLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDdkUsT0FBcUIsS0FBTSxDQUFDLGFBQWEsRUFBRSxLQUFLLFlBQVksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO1FBQ3JGLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsWUFBWSxDQUFDLEtBQWM7UUFDMUMsSUFBSSxLQUFLLElBQUksT0FBcUIsS0FBTSxDQUFDLGFBQWEsS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUN2RSxPQUFxQixLQUFNLENBQUMsYUFBYSxFQUFFLEtBQUssWUFBWSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7UUFDckYsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDRixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxLQUFjO1FBQy9DLE9BQU8sQ0FBQyxDQUFDLEtBQUs7ZUFDVixPQUFPLEtBQUssS0FBSyxRQUFRO2VBQ3pCLE9BQTJDLEtBQU0sQ0FBQyx1QkFBdUIsS0FBSyxVQUFVLENBQUM7SUFFOUYsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsYUFBYSxDQUFDLEtBQWM7UUFDM0MsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6QixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVELElBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7WUFDdEUsT0FBTyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7UUFDL0IsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsVUFBVSxDQUFDLEtBQVU7UUFDcEMsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDaEQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDIn0=