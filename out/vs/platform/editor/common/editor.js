/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEditorSelectionSource = exports.TextEditorSelectionRevealType = exports.EditorOpenSource = exports.EditorResolution = exports.EditorActivation = void 0;
    exports.isResolvedEditorModel = isResolvedEditorModel;
    function isResolvedEditorModel(model) {
        const candidate = model;
        return typeof candidate?.resolve === 'function'
            && typeof candidate?.isResolved === 'function';
    }
    var EditorActivation;
    (function (EditorActivation) {
        /**
         * Activate the editor after it opened. This will automatically restore
         * the editor if it is minimized.
         */
        EditorActivation[EditorActivation["ACTIVATE"] = 1] = "ACTIVATE";
        /**
         * Only restore the editor if it is minimized but do not activate it.
         *
         * Note: will only work in combination with the `preserveFocus: true` option.
         * Otherwise, if focus moves into the editor, it will activate and restore
         * automatically.
         */
        EditorActivation[EditorActivation["RESTORE"] = 2] = "RESTORE";
        /**
         * Preserve the current active editor.
         *
         * Note: will only work in combination with the `preserveFocus: true` option.
         * Otherwise, if focus moves into the editor, it will activate and restore
         * automatically.
         */
        EditorActivation[EditorActivation["PRESERVE"] = 3] = "PRESERVE";
    })(EditorActivation || (exports.EditorActivation = EditorActivation = {}));
    var EditorResolution;
    (function (EditorResolution) {
        /**
         * Displays a picker and allows the user to decide which editor to use.
         */
        EditorResolution[EditorResolution["PICK"] = 0] = "PICK";
        /**
         * Only exclusive editors are considered.
         */
        EditorResolution[EditorResolution["EXCLUSIVE_ONLY"] = 1] = "EXCLUSIVE_ONLY";
    })(EditorResolution || (exports.EditorResolution = EditorResolution = {}));
    var EditorOpenSource;
    (function (EditorOpenSource) {
        /**
         * Default: the editor is opening via a programmatic call
         * to the editor service API.
         */
        EditorOpenSource[EditorOpenSource["API"] = 0] = "API";
        /**
         * Indicates that a user action triggered the opening, e.g.
         * via mouse or keyboard use.
         */
        EditorOpenSource[EditorOpenSource["USER"] = 1] = "USER";
    })(EditorOpenSource || (exports.EditorOpenSource = EditorOpenSource = {}));
    var TextEditorSelectionRevealType;
    (function (TextEditorSelectionRevealType) {
        /**
         * Option to scroll vertically or horizontally as necessary and reveal a range centered vertically.
         */
        TextEditorSelectionRevealType[TextEditorSelectionRevealType["Center"] = 0] = "Center";
        /**
         * Option to scroll vertically or horizontally as necessary and reveal a range centered vertically only if it lies outside the viewport.
         */
        TextEditorSelectionRevealType[TextEditorSelectionRevealType["CenterIfOutsideViewport"] = 1] = "CenterIfOutsideViewport";
        /**
         * Option to scroll vertically or horizontally as necessary and reveal a range close to the top of the viewport, but not quite at the top.
         */
        TextEditorSelectionRevealType[TextEditorSelectionRevealType["NearTop"] = 2] = "NearTop";
        /**
         * Option to scroll vertically or horizontally as necessary and reveal a range close to the top of the viewport, but not quite at the top.
         * Only if it lies outside the viewport
         */
        TextEditorSelectionRevealType[TextEditorSelectionRevealType["NearTopIfOutsideViewport"] = 3] = "NearTopIfOutsideViewport";
    })(TextEditorSelectionRevealType || (exports.TextEditorSelectionRevealType = TextEditorSelectionRevealType = {}));
    var TextEditorSelectionSource;
    (function (TextEditorSelectionSource) {
        /**
         * Programmatic source indicates a selection change that
         * was not triggered by the user via keyboard or mouse
         * but through text editor APIs.
         */
        TextEditorSelectionSource["PROGRAMMATIC"] = "api";
        /**
         * Navigation source indicates a selection change that
         * was caused via some command or UI component such as
         * an outline tree.
         */
        TextEditorSelectionSource["NAVIGATION"] = "code.navigation";
        /**
         * Jump source indicates a selection change that
         * was caused from within the text editor to another
         * location in the same or different text editor such
         * as "Go to definition".
         */
        TextEditorSelectionSource["JUMP"] = "code.jump";
    })(TextEditorSelectionSource || (exports.TextEditorSelectionSource = TextEditorSelectionSource = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZWRpdG9yL2NvbW1vbi9lZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxzREFLQztJQUxELFNBQWdCLHFCQUFxQixDQUFDLEtBQXFDO1FBQzFFLE1BQU0sU0FBUyxHQUFHLEtBQWtELENBQUM7UUFFckUsT0FBTyxPQUFPLFNBQVMsRUFBRSxPQUFPLEtBQUssVUFBVTtlQUMzQyxPQUFPLFNBQVMsRUFBRSxVQUFVLEtBQUssVUFBVSxDQUFDO0lBQ2pELENBQUM7SUFvR0QsSUFBWSxnQkF5Qlg7SUF6QkQsV0FBWSxnQkFBZ0I7UUFFM0I7OztXQUdHO1FBQ0gsK0RBQVksQ0FBQTtRQUVaOzs7Ozs7V0FNRztRQUNILDZEQUFPLENBQUE7UUFFUDs7Ozs7O1dBTUc7UUFDSCwrREFBUSxDQUFBO0lBQ1QsQ0FBQyxFQXpCVyxnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQXlCM0I7SUFFRCxJQUFZLGdCQVdYO0lBWEQsV0FBWSxnQkFBZ0I7UUFFM0I7O1dBRUc7UUFDSCx1REFBSSxDQUFBO1FBRUo7O1dBRUc7UUFDSCwyRUFBYyxDQUFBO0lBQ2YsQ0FBQyxFQVhXLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBVzNCO0lBRUQsSUFBWSxnQkFhWDtJQWJELFdBQVksZ0JBQWdCO1FBRTNCOzs7V0FHRztRQUNILHFEQUFHLENBQUE7UUFFSDs7O1dBR0c7UUFDSCx1REFBSSxDQUFBO0lBQ0wsQ0FBQyxFQWJXLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBYTNCO0lBcUlELElBQWtCLDZCQXFCakI7SUFyQkQsV0FBa0IsNkJBQTZCO1FBQzlDOztXQUVHO1FBQ0gscUZBQVUsQ0FBQTtRQUVWOztXQUVHO1FBQ0gsdUhBQTJCLENBQUE7UUFFM0I7O1dBRUc7UUFDSCx1RkFBVyxDQUFBO1FBRVg7OztXQUdHO1FBQ0gseUhBQTRCLENBQUE7SUFDN0IsQ0FBQyxFQXJCaUIsNkJBQTZCLDZDQUE3Qiw2QkFBNkIsUUFxQjlDO0lBRUQsSUFBa0IseUJBdUJqQjtJQXZCRCxXQUFrQix5QkFBeUI7UUFFMUM7Ozs7V0FJRztRQUNILGlEQUFvQixDQUFBO1FBRXBCOzs7O1dBSUc7UUFDSCwyREFBOEIsQ0FBQTtRQUU5Qjs7Ozs7V0FLRztRQUNILCtDQUFrQixDQUFBO0lBQ25CLENBQUMsRUF2QmlCLHlCQUF5Qix5Q0FBekIseUJBQXlCLFFBdUIxQyJ9