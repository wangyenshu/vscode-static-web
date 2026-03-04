/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/instantiation/common/instantiation"], function (require, exports, errors_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAuthorityResolverError = exports.RemoteAuthorityResolverErrorCode = exports.WebSocketRemoteConnection = exports.ManagedRemoteConnection = exports.RemoteConnectionType = exports.IRemoteAuthorityResolverService = void 0;
    exports.getRemoteAuthorityPrefix = getRemoteAuthorityPrefix;
    exports.IRemoteAuthorityResolverService = (0, instantiation_1.createDecorator)('remoteAuthorityResolverService');
    var RemoteConnectionType;
    (function (RemoteConnectionType) {
        RemoteConnectionType[RemoteConnectionType["WebSocket"] = 0] = "WebSocket";
        RemoteConnectionType[RemoteConnectionType["Managed"] = 1] = "Managed";
    })(RemoteConnectionType || (exports.RemoteConnectionType = RemoteConnectionType = {}));
    class ManagedRemoteConnection {
        constructor(id) {
            this.id = id;
            this.type = 1 /* RemoteConnectionType.Managed */;
        }
        toString() {
            return `Managed(${this.id})`;
        }
    }
    exports.ManagedRemoteConnection = ManagedRemoteConnection;
    class WebSocketRemoteConnection {
        constructor(host, port) {
            this.host = host;
            this.port = port;
            this.type = 0 /* RemoteConnectionType.WebSocket */;
        }
        toString() {
            return `WebSocket(${this.host}:${this.port})`;
        }
    }
    exports.WebSocketRemoteConnection = WebSocketRemoteConnection;
    var RemoteAuthorityResolverErrorCode;
    (function (RemoteAuthorityResolverErrorCode) {
        RemoteAuthorityResolverErrorCode["Unknown"] = "Unknown";
        RemoteAuthorityResolverErrorCode["NotAvailable"] = "NotAvailable";
        RemoteAuthorityResolverErrorCode["TemporarilyNotAvailable"] = "TemporarilyNotAvailable";
        RemoteAuthorityResolverErrorCode["NoResolverFound"] = "NoResolverFound";
        RemoteAuthorityResolverErrorCode["InvalidAuthority"] = "InvalidAuthority";
    })(RemoteAuthorityResolverErrorCode || (exports.RemoteAuthorityResolverErrorCode = RemoteAuthorityResolverErrorCode = {}));
    class RemoteAuthorityResolverError extends errors_1.ErrorNoTelemetry {
        static isNotAvailable(err) {
            return (err instanceof RemoteAuthorityResolverError) && err._code === RemoteAuthorityResolverErrorCode.NotAvailable;
        }
        static isTemporarilyNotAvailable(err) {
            return (err instanceof RemoteAuthorityResolverError) && err._code === RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable;
        }
        static isNoResolverFound(err) {
            return (err instanceof RemoteAuthorityResolverError) && err._code === RemoteAuthorityResolverErrorCode.NoResolverFound;
        }
        static isInvalidAuthority(err) {
            return (err instanceof RemoteAuthorityResolverError) && err._code === RemoteAuthorityResolverErrorCode.InvalidAuthority;
        }
        static isHandled(err) {
            return (err instanceof RemoteAuthorityResolverError) && err.isHandled;
        }
        constructor(message, code = RemoteAuthorityResolverErrorCode.Unknown, detail) {
            super(message);
            this._message = message;
            this._code = code;
            this._detail = detail;
            this.isHandled = (code === RemoteAuthorityResolverErrorCode.NotAvailable) && detail === true;
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(this, RemoteAuthorityResolverError.prototype);
        }
    }
    exports.RemoteAuthorityResolverError = RemoteAuthorityResolverError;
    function getRemoteAuthorityPrefix(remoteAuthority) {
        const plusIndex = remoteAuthority.indexOf('+');
        if (plusIndex === -1) {
            return remoteAuthority;
        }
        return remoteAuthority.substring(0, plusIndex);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQXV0aG9yaXR5UmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvY29tbW9uL3JlbW90ZUF1dGhvcml0eVJlc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtLaEcsNERBTUM7SUFqS1ksUUFBQSwrQkFBK0IsR0FBRyxJQUFBLCtCQUFlLEVBQWtDLGdDQUFnQyxDQUFDLENBQUM7SUFFbEksSUFBa0Isb0JBR2pCO0lBSEQsV0FBa0Isb0JBQW9CO1FBQ3JDLHlFQUFTLENBQUE7UUFDVCxxRUFBTyxDQUFBO0lBQ1IsQ0FBQyxFQUhpQixvQkFBb0Isb0NBQXBCLG9CQUFvQixRQUdyQztJQUVELE1BQWEsdUJBQXVCO1FBR25DLFlBQ2lCLEVBQVU7WUFBVixPQUFFLEdBQUYsRUFBRSxDQUFRO1lBSFgsU0FBSSx3Q0FBZ0M7UUFJaEQsQ0FBQztRQUVFLFFBQVE7WUFDZCxPQUFPLFdBQVcsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDO1FBQzlCLENBQUM7S0FDRDtJQVZELDBEQVVDO0lBRUQsTUFBYSx5QkFBeUI7UUFHckMsWUFDaUIsSUFBWSxFQUNaLElBQVk7WUFEWixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ1osU0FBSSxHQUFKLElBQUksQ0FBUTtZQUpiLFNBQUksMENBQWtDO1FBS2xELENBQUM7UUFFRSxRQUFRO1lBQ2QsT0FBTyxhQUFhLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDO1FBQy9DLENBQUM7S0FDRDtJQVhELDhEQVdDO0lBa0RELElBQVksZ0NBTVg7SUFORCxXQUFZLGdDQUFnQztRQUMzQyx1REFBbUIsQ0FBQTtRQUNuQixpRUFBNkIsQ0FBQTtRQUM3Qix1RkFBbUQsQ0FBQTtRQUNuRCx1RUFBbUMsQ0FBQTtRQUNuQyx5RUFBcUMsQ0FBQTtJQUN0QyxDQUFDLEVBTlcsZ0NBQWdDLGdEQUFoQyxnQ0FBZ0MsUUFNM0M7SUFFRCxNQUFhLDRCQUE2QixTQUFRLHlCQUFnQjtRQUUxRCxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQVE7WUFDcEMsT0FBTyxDQUFDLEdBQUcsWUFBWSw0QkFBNEIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssZ0NBQWdDLENBQUMsWUFBWSxDQUFDO1FBQ3JILENBQUM7UUFFTSxNQUFNLENBQUMseUJBQXlCLENBQUMsR0FBUTtZQUMvQyxPQUFPLENBQUMsR0FBRyxZQUFZLDRCQUE0QixDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxnQ0FBZ0MsQ0FBQyx1QkFBdUIsQ0FBQztRQUNoSSxDQUFDO1FBRU0sTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQVE7WUFDdkMsT0FBTyxDQUFDLEdBQUcsWUFBWSw0QkFBNEIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssZ0NBQWdDLENBQUMsZUFBZSxDQUFDO1FBQ3hILENBQUM7UUFFTSxNQUFNLENBQUMsa0JBQWtCLENBQUMsR0FBUTtZQUN4QyxPQUFPLENBQUMsR0FBRyxZQUFZLDRCQUE0QixDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxnQ0FBZ0MsQ0FBQyxnQkFBZ0IsQ0FBQztRQUN6SCxDQUFDO1FBRU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFRO1lBQy9CLE9BQU8sQ0FBQyxHQUFHLFlBQVksNEJBQTRCLENBQUMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ3ZFLENBQUM7UUFRRCxZQUFZLE9BQWdCLEVBQUUsT0FBeUMsZ0NBQWdDLENBQUMsT0FBTyxFQUFFLE1BQVk7WUFDNUgsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWYsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksS0FBSyxnQ0FBZ0MsQ0FBQyxZQUFZLENBQUMsSUFBSSxNQUFNLEtBQUssSUFBSSxDQUFDO1lBRTdGLDRFQUE0RTtZQUM1RSwrSUFBK0k7WUFDL0ksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckUsQ0FBQztLQUNEO0lBekNELG9FQXlDQztJQTBCRCxTQUFnQix3QkFBd0IsQ0FBQyxlQUF1QjtRQUMvRCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9DLElBQUksU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDdEIsT0FBTyxlQUFlLENBQUM7UUFDeEIsQ0FBQztRQUNELE9BQU8sZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDaEQsQ0FBQyJ9