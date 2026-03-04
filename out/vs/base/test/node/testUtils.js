/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/path", "vs/base/test/common/testUtils"], function (require, exports, extpath_1, path_1, testUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flakySuite = void 0;
    exports.getRandomTestPath = getRandomTestPath;
    function getRandomTestPath(tmpdir, ...segments) {
        return (0, extpath_1.randomPath)((0, path_1.join)(tmpdir, ...segments));
    }
    exports.flakySuite = testUtils.flakySuite;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFV0aWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L25vZGUvdGVzdFV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyw4Q0FFQztJQUZELFNBQWdCLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxHQUFHLFFBQWtCO1FBQ3RFLE9BQU8sSUFBQSxvQkFBVSxFQUFDLElBQUEsV0FBSSxFQUFDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVhLFFBQUEsVUFBVSxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMifQ==