/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerEditorFeature = registerEditorFeature;
    exports.getEditorFeatures = getEditorFeatures;
    const editorFeatures = [];
    /**
     * Registers an editor feature. Editor features will be instantiated only once, as soon as
     * the first code editor is instantiated.
     */
    function registerEditorFeature(ctor) {
        editorFeatures.push(ctor);
    }
    function getEditorFeatures() {
        return editorFeatures.slice(0);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2VkaXRvckZlYXR1cmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyxzREFFQztJQUVELDhDQUVDO0lBWkQsTUFBTSxjQUFjLEdBQXdCLEVBQUUsQ0FBQztJQUUvQzs7O09BR0c7SUFDSCxTQUFnQixxQkFBcUIsQ0FBb0MsSUFBb0Q7UUFDNUgsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUF5QixDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELFNBQWdCLGlCQUFpQjtRQUNoQyxPQUFPLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEMsQ0FBQyJ9