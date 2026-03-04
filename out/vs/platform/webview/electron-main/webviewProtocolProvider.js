/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, electron_1, lifecycle_1, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewProtocolProvider = void 0;
    class WebviewProtocolProvider extends lifecycle_1.Disposable {
        static { this.validWebviewFilePaths = new Map([
            ['/index.html', 'index.html'],
            ['/fake.html', 'fake.html'],
            ['/service-worker.js', 'service-worker.js'],
        ]); }
        constructor() {
            super();
            // Register the protocol for loading webview html
            const webviewHandler = this.handleWebviewRequest.bind(this);
            electron_1.protocol.registerFileProtocol(network_1.Schemas.vscodeWebview, webviewHandler);
        }
        handleWebviewRequest(request, callback) {
            try {
                const uri = uri_1.URI.parse(request.url);
                const entry = WebviewProtocolProvider.validWebviewFilePaths.get(uri.path);
                if (typeof entry === 'string') {
                    const relativeResourcePath = `vs/workbench/contrib/webview/browser/pre/${entry}`;
                    const url = network_1.FileAccess.asFileUri(relativeResourcePath);
                    return callback({
                        path: url.fsPath,
                        headers: {
                            ...network_1.COI.getHeadersFromQuery(request.url),
                            'Cross-Origin-Resource-Policy': 'cross-origin'
                        }
                    });
                }
                else {
                    return callback({ error: -10 /* ACCESS_DENIED - https://cs.chromium.org/chromium/src/net/base/net_error_list.h?l=32 */ });
                }
            }
            catch {
                // noop
            }
            return callback({ error: -2 /* FAILED - https://cs.chromium.org/chromium/src/net/base/net_error_list.h?l=32 */ });
        }
    }
    exports.WebviewProtocolProvider = WebviewProtocolProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1Byb3RvY29sUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93ZWJ2aWV3L2VsZWN0cm9uLW1haW4vd2Vidmlld1Byb3RvY29sUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsdUJBQXdCLFNBQVEsc0JBQVU7aUJBRXZDLDBCQUFxQixHQUFHLElBQUksR0FBRyxDQUFDO1lBQzlDLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQztZQUM3QixDQUFDLFlBQVksRUFBRSxXQUFXLENBQUM7WUFDM0IsQ0FBQyxvQkFBb0IsRUFBRSxtQkFBbUIsQ0FBQztTQUMzQyxDQUFDLENBQUM7UUFFSDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBRVIsaURBQWlEO1lBQ2pELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUQsbUJBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBTyxDQUFDLGFBQWEsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRU8sb0JBQW9CLENBQzNCLE9BQWlDLEVBQ2pDLFFBQWdFO1lBRWhFLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxLQUFLLEdBQUcsdUJBQXVCLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUUsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDL0IsTUFBTSxvQkFBb0IsR0FBb0IsNENBQTRDLEtBQUssRUFBRSxDQUFDO29CQUNsRyxNQUFNLEdBQUcsR0FBRyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO29CQUN2RCxPQUFPLFFBQVEsQ0FBQzt3QkFDZixJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU07d0JBQ2hCLE9BQU8sRUFBRTs0QkFDUixHQUFHLGFBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDOzRCQUN2Qyw4QkFBOEIsRUFBRSxjQUFjO3lCQUM5QztxQkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLHlGQUF5RixFQUFFLENBQUMsQ0FBQztnQkFDM0gsQ0FBQztZQUNGLENBQUM7WUFBQyxNQUFNLENBQUM7Z0JBQ1IsT0FBTztZQUNSLENBQUM7WUFDRCxPQUFPLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxrRkFBa0YsRUFBRSxDQUFDLENBQUM7UUFDbkgsQ0FBQzs7SUF4Q0YsMERBeUNDIn0=