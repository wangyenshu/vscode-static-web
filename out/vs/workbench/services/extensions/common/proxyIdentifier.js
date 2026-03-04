/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SerializableObjectWithBuffers = exports.ProxyIdentifier = void 0;
    exports.createProxyIdentifier = createProxyIdentifier;
    exports.getStringIdentifierForProxy = getStringIdentifierForProxy;
    class ProxyIdentifier {
        static { this.count = 0; }
        constructor(sid) {
            this._proxyIdentifierBrand = undefined;
            this.sid = sid;
            this.nid = (++ProxyIdentifier.count);
        }
    }
    exports.ProxyIdentifier = ProxyIdentifier;
    const identifiers = [];
    function createProxyIdentifier(identifier) {
        const result = new ProxyIdentifier(identifier);
        identifiers[result.nid] = result;
        return result;
    }
    function getStringIdentifierForProxy(nid) {
        return identifiers[nid].sid;
    }
    /**
     * Marks the object as containing buffers that should be serialized more efficiently.
     */
    class SerializableObjectWithBuffers {
        constructor(value) {
            this.value = value;
        }
    }
    exports.SerializableObjectWithBuffers = SerializableObjectWithBuffers;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHlJZGVudGlmaWVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL3Byb3h5SWRlbnRpZmllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0Q2hHLHNEQUlDO0lBc0JELGtFQUVDO0lBM0NELE1BQWEsZUFBZTtpQkFDYixVQUFLLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFNeEIsWUFBWSxHQUFXO1lBTHZCLDBCQUFxQixHQUFTLFNBQVMsQ0FBQztZQU12QyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxDQUFDOztJQVZGLDBDQVdDO0lBRUQsTUFBTSxXQUFXLEdBQTJCLEVBQUUsQ0FBQztJQUUvQyxTQUFnQixxQkFBcUIsQ0FBSSxVQUFrQjtRQUMxRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQWUsQ0FBSSxVQUFVLENBQUMsQ0FBQztRQUNsRCxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUNqQyxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFzQkQsU0FBZ0IsMkJBQTJCLENBQUMsR0FBVztRQUN0RCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDN0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBYSw2QkFBNkI7UUFDekMsWUFDaUIsS0FBUTtZQUFSLFVBQUssR0FBTCxLQUFLLENBQUc7UUFDckIsQ0FBQztLQUNMO0lBSkQsc0VBSUMifQ==