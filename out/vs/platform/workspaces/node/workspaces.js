/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources"], function (require, exports, crypto_1, network_1, platform_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NON_EMPTY_WORKSPACE_ID_LENGTH = void 0;
    exports.getWorkspaceIdentifier = getWorkspaceIdentifier;
    exports.getSingleFolderWorkspaceIdentifier = getSingleFolderWorkspaceIdentifier;
    exports.createEmptyWorkspaceIdentifier = createEmptyWorkspaceIdentifier;
    /**
     * Length of workspace identifiers that are not empty. Those are
     * MD5 hashes (128bits / 4 due to hex presentation).
     */
    exports.NON_EMPTY_WORKSPACE_ID_LENGTH = 128 / 4;
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // NOTE: DO NOT CHANGE. IDENTIFIERS HAVE TO REMAIN STABLE
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    function getWorkspaceIdentifier(configPath) {
        function getWorkspaceId() {
            let configPathStr = configPath.scheme === network_1.Schemas.file ? (0, resources_1.originalFSPath)(configPath) : configPath.toString();
            if (!platform_1.isLinux) {
                configPathStr = configPathStr.toLowerCase(); // sanitize for platform file system
            }
            return (0, crypto_1.createHash)('md5').update(configPathStr).digest('hex'); // CodeQL [SM04514] Using MD5 to convert a file path to a fixed length
        }
        return {
            id: getWorkspaceId(),
            configPath
        };
    }
    function getSingleFolderWorkspaceIdentifier(folderUri, folderStat) {
        function getFolderId() {
            // Remote: produce a hash from the entire URI
            if (folderUri.scheme !== network_1.Schemas.file) {
                return (0, crypto_1.createHash)('md5').update(folderUri.toString()).digest('hex'); // CodeQL [SM04514] Using MD5 to convert a file path to a fixed length
            }
            // Local: we use the ctime as extra salt to the
            // identifier so that folders getting recreated
            // result in a different identifier. However, if
            // the stat is not provided we return `undefined`
            // to ensure identifiers are stable for the given
            // URI.
            if (!folderStat) {
                return undefined;
            }
            let ctime;
            if (platform_1.isLinux) {
                ctime = folderStat.ino; // Linux: birthtime is ctime, so we cannot use it! We use the ino instead!
            }
            else if (platform_1.isMacintosh) {
                ctime = folderStat.birthtime.getTime(); // macOS: birthtime is fine to use as is
            }
            else if (platform_1.isWindows) {
                if (typeof folderStat.birthtimeMs === 'number') {
                    ctime = Math.floor(folderStat.birthtimeMs); // Windows: fix precision issue in node.js 8.x to get 7.x results (see https://github.com/nodejs/node/issues/19897)
                }
                else {
                    ctime = folderStat.birthtime.getTime();
                }
            }
            return (0, crypto_1.createHash)('md5').update(folderUri.fsPath).update(ctime ? String(ctime) : '').digest('hex'); // CodeQL [SM04514] Using MD5 to convert a file path to a fixed length
        }
        const folderId = getFolderId();
        if (typeof folderId === 'string') {
            return {
                id: folderId,
                uri: folderUri
            };
        }
        return undefined; // invalid folder
    }
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // NOTE: DO NOT CHANGE. IDENTIFIERS HAVE TO REMAIN STABLE
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    function createEmptyWorkspaceIdentifier() {
        return {
            id: (Date.now() + Math.round(Math.random() * 1000)).toString()
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dvcmtzcGFjZXMvbm9kZS93b3Jrc3BhY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsd0RBZUM7SUFRRCxnRkE2Q0M7SUFNRCx3RUFJQztJQXhGRDs7O09BR0c7SUFDVSxRQUFBLDZCQUE2QixHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFFckQseURBQXlEO0lBQ3pELHlEQUF5RDtJQUN6RCx5REFBeUQ7SUFFekQsU0FBZ0Isc0JBQXNCLENBQUMsVUFBZTtRQUVyRCxTQUFTLGNBQWM7WUFDdEIsSUFBSSxhQUFhLEdBQUcsVUFBVSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBQSwwQkFBYyxFQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUcsSUFBSSxDQUFDLGtCQUFPLEVBQUUsQ0FBQztnQkFDZCxhQUFhLEdBQUcsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsb0NBQW9DO1lBQ2xGLENBQUM7WUFFRCxPQUFPLElBQUEsbUJBQVUsRUFBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsc0VBQXNFO1FBQ3JJLENBQUM7UUFFRCxPQUFPO1lBQ04sRUFBRSxFQUFFLGNBQWMsRUFBRTtZQUNwQixVQUFVO1NBQ1YsQ0FBQztJQUNILENBQUM7SUFRRCxTQUFnQixrQ0FBa0MsQ0FBQyxTQUFjLEVBQUUsVUFBa0I7UUFFcEYsU0FBUyxXQUFXO1lBRW5CLDZDQUE2QztZQUM3QyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxJQUFBLG1CQUFVLEVBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLHNFQUFzRTtZQUM1SSxDQUFDO1lBRUQsK0NBQStDO1lBQy9DLCtDQUErQztZQUMvQyxnREFBZ0Q7WUFDaEQsaURBQWlEO1lBQ2pELGlEQUFpRDtZQUNqRCxPQUFPO1lBRVAsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsSUFBSSxLQUF5QixDQUFDO1lBQzlCLElBQUksa0JBQU8sRUFBRSxDQUFDO2dCQUNiLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsMEVBQTBFO1lBQ25HLENBQUM7aUJBQU0sSUFBSSxzQkFBVyxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsd0NBQXdDO1lBQ2pGLENBQUM7aUJBQU0sSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksT0FBTyxVQUFVLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNoRCxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxtSEFBbUg7Z0JBQ2hLLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxLQUFLLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDeEMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUEsbUJBQVUsRUFBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsc0VBQXNFO1FBQzNLLENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxXQUFXLEVBQUUsQ0FBQztRQUMvQixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2xDLE9BQU87Z0JBQ04sRUFBRSxFQUFFLFFBQVE7Z0JBQ1osR0FBRyxFQUFFLFNBQVM7YUFDZCxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDLENBQUMsaUJBQWlCO0lBQ3BDLENBQUM7SUFFRCx5REFBeUQ7SUFDekQseURBQXlEO0lBQ3pELHlEQUF5RDtJQUV6RCxTQUFnQiw4QkFBOEI7UUFDN0MsT0FBTztZQUNOLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtTQUM5RCxDQUFDO0lBQ0gsQ0FBQyJ9