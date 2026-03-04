/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isLocalizedString = isLocalizedString;
    exports.isICommandActionToggleInfo = isICommandActionToggleInfo;
    function isLocalizedString(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.original === 'string'
            && typeof thing.value === 'string';
    }
    function isICommandActionToggleInfo(thing) {
        return thing ? thing.condition !== undefined : false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWN0aW9uL2NvbW1vbi9hY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxQmhHLDhDQUtDO0lBa0NELGdFQUVDO0lBekNELFNBQWdCLGlCQUFpQixDQUFDLEtBQVU7UUFDM0MsT0FBTyxLQUFLO2VBQ1IsT0FBTyxLQUFLLEtBQUssUUFBUTtlQUN6QixPQUFPLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUTtlQUNsQyxPQUFPLEtBQUssQ0FBQyxLQUFLLEtBQUssUUFBUSxDQUFDO0lBQ3JDLENBQUM7SUFrQ0QsU0FBZ0IsMEJBQTBCLENBQUMsS0FBa0U7UUFDNUcsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUE0QixLQUFNLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ2xGLENBQUMifQ==