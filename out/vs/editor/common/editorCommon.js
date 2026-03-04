/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Handler = exports.EditorType = exports.ScrollType = void 0;
    exports.isThemeColor = isThemeColor;
    var ScrollType;
    (function (ScrollType) {
        ScrollType[ScrollType["Smooth"] = 0] = "Smooth";
        ScrollType[ScrollType["Immediate"] = 1] = "Immediate";
    })(ScrollType || (exports.ScrollType = ScrollType = {}));
    /**
     * @internal
     */
    function isThemeColor(o) {
        return o && typeof o.id === 'string';
    }
    /**
     * The type of the `IEditor`.
     */
    exports.EditorType = {
        ICodeEditor: 'vs.editor.ICodeEditor',
        IDiffEditor: 'vs.editor.IDiffEditor'
    };
    /**
     * Built-in commands.
     * @internal
     */
    var Handler;
    (function (Handler) {
        Handler["CompositionStart"] = "compositionStart";
        Handler["CompositionEnd"] = "compositionEnd";
        Handler["Type"] = "type";
        Handler["ReplacePreviousChar"] = "replacePreviousChar";
        Handler["CompositionType"] = "compositionType";
        Handler["Paste"] = "paste";
        Handler["Cut"] = "cut";
    })(Handler || (exports.Handler = Handler = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29tbW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9lZGl0b3JDb21tb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdWxCaEcsb0NBRUM7SUE5WUQsSUFBa0IsVUFHakI7SUFIRCxXQUFrQixVQUFVO1FBQzNCLCtDQUFVLENBQUE7UUFDVixxREFBYSxDQUFBO0lBQ2QsQ0FBQyxFQUhpQixVQUFVLDBCQUFWLFVBQVUsUUFHM0I7SUFzWUQ7O09BRUc7SUFDSCxTQUFnQixZQUFZLENBQUMsQ0FBTTtRQUNsQyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssUUFBUSxDQUFDO0lBQ3RDLENBQUM7SUEwSEQ7O09BRUc7SUFDVSxRQUFBLFVBQVUsR0FBRztRQUN6QixXQUFXLEVBQUUsdUJBQXVCO1FBQ3BDLFdBQVcsRUFBRSx1QkFBdUI7S0FDcEMsQ0FBQztJQUVGOzs7T0FHRztJQUNILElBQWtCLE9BUWpCO0lBUkQsV0FBa0IsT0FBTztRQUN4QixnREFBcUMsQ0FBQTtRQUNyQyw0Q0FBaUMsQ0FBQTtRQUNqQyx3QkFBYSxDQUFBO1FBQ2Isc0RBQTJDLENBQUE7UUFDM0MsOENBQW1DLENBQUE7UUFDbkMsMEJBQWUsQ0FBQTtRQUNmLHNCQUFXLENBQUE7SUFDWixDQUFDLEVBUmlCLE9BQU8sdUJBQVAsT0FBTyxRQVF4QiJ9