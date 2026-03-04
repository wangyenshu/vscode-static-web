/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.webviewGenericCspSource = exports.webviewRootResourceAuthority = exports.webviewResourceBaseHost = void 0;
    exports.asWebviewUri = asWebviewUri;
    exports.decodeAuthority = decodeAuthority;
    /**
     * Root from which resources in webviews are loaded.
     *
     * This is hardcoded because we never expect to actually hit it. Instead these requests
     * should always go to a service worker.
     */
    exports.webviewResourceBaseHost = 'vscode-cdn.net';
    exports.webviewRootResourceAuthority = `vscode-resource.${exports.webviewResourceBaseHost}`;
    exports.webviewGenericCspSource = `'self' https://*.${exports.webviewResourceBaseHost}`;
    /**
     * Construct a uri that can load resources inside a webview
     *
     * We encode the resource component of the uri so that on the main thread
     * we know where to load the resource from (remote or truly local):
     *
     * ```txt
     * ${scheme}+${resource-authority}.vscode-resource.vscode-cdn.net/${path}
     * ```
     *
     * @param resource Uri of the resource to load.
     * @param remoteInfo Optional information about the remote that specifies where `resource` should be resolved from.
     */
    function asWebviewUri(resource, remoteInfo) {
        if (resource.scheme === network_1.Schemas.http || resource.scheme === network_1.Schemas.https) {
            return resource;
        }
        if (remoteInfo && remoteInfo.authority && remoteInfo.isRemote && resource.scheme === network_1.Schemas.file) {
            resource = uri_1.URI.from({
                scheme: network_1.Schemas.vscodeRemote,
                authority: remoteInfo.authority,
                path: resource.path,
            });
        }
        return uri_1.URI.from({
            scheme: network_1.Schemas.https,
            authority: `${resource.scheme}+${encodeAuthority(resource.authority)}.${exports.webviewRootResourceAuthority}`,
            path: resource.path,
            fragment: resource.fragment,
            query: resource.query,
        });
    }
    function encodeAuthority(authority) {
        return authority.replace(/./g, char => {
            const code = char.charCodeAt(0);
            if ((code >= 97 /* CharCode.a */ && code <= 122 /* CharCode.z */)
                || (code >= 65 /* CharCode.A */ && code <= 90 /* CharCode.Z */)
                || (code >= 48 /* CharCode.Digit0 */ && code <= 57 /* CharCode.Digit9 */)) {
                return char;
            }
            return '-' + code.toString(16).padStart(4, '0');
        });
    }
    function decodeAuthority(authority) {
        return authority.replace(/-([0-9a-f]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvY29tbW9uL3dlYnZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0NoRyxvQ0FvQkM7SUFnQkQsMENBRUM7SUEvREQ7Ozs7O09BS0c7SUFDVSxRQUFBLHVCQUF1QixHQUFHLGdCQUFnQixDQUFDO0lBRTNDLFFBQUEsNEJBQTRCLEdBQUcsbUJBQW1CLCtCQUF1QixFQUFFLENBQUM7SUFFNUUsUUFBQSx1QkFBdUIsR0FBRyxvQkFBb0IsK0JBQXVCLEVBQUUsQ0FBQztJQUVyRjs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxTQUFnQixZQUFZLENBQUMsUUFBYSxFQUFFLFVBQThCO1FBQ3pFLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDM0UsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxTQUFTLElBQUksVUFBVSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbkcsUUFBUSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFlBQVk7Z0JBQzVCLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBUztnQkFDL0IsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJO2FBQ25CLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZixNQUFNLEVBQUUsaUJBQU8sQ0FBQyxLQUFLO1lBQ3JCLFNBQVMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxNQUFNLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxvQ0FBNEIsRUFBRTtZQUN0RyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7WUFDbkIsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRO1lBQzNCLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztTQUNyQixDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUMsU0FBaUI7UUFDekMsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQ0MsQ0FBQyxJQUFJLHVCQUFjLElBQUksSUFBSSx3QkFBYyxDQUFDO21CQUN2QyxDQUFDLElBQUksdUJBQWMsSUFBSSxJQUFJLHVCQUFjLENBQUM7bUJBQzFDLENBQUMsSUFBSSw0QkFBbUIsSUFBSSxJQUFJLDRCQUFtQixDQUFDLEVBQ3RELENBQUM7Z0JBQ0YsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELFNBQWdCLGVBQWUsQ0FBQyxTQUFpQjtRQUNoRCxPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25HLENBQUMifQ==