/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uriIpc"], function (require, exports, uriIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createURITransformer = createURITransformer;
    /**
     * ```
     * --------------------------------
     * |    UI SIDE    |  AGENT SIDE  |
     * |---------------|--------------|
     * | vscode-remote | file         |
     * | file          | vscode-local |
     * --------------------------------
     * ```
     */
    function createRawURITransformer(remoteAuthority) {
        return {
            transformIncoming: (uri) => {
                if (uri.scheme === 'vscode-remote') {
                    return { scheme: 'file', path: uri.path, query: uri.query, fragment: uri.fragment };
                }
                if (uri.scheme === 'file') {
                    return { scheme: 'vscode-local', path: uri.path, query: uri.query, fragment: uri.fragment };
                }
                return uri;
            },
            transformOutgoing: (uri) => {
                if (uri.scheme === 'file') {
                    return { scheme: 'vscode-remote', authority: remoteAuthority, path: uri.path, query: uri.query, fragment: uri.fragment };
                }
                if (uri.scheme === 'vscode-local') {
                    return { scheme: 'file', path: uri.path, query: uri.query, fragment: uri.fragment };
                }
                return uri;
            },
            transformOutgoingScheme: (scheme) => {
                if (scheme === 'file') {
                    return 'vscode-remote';
                }
                else if (scheme === 'vscode-local') {
                    return 'file';
                }
                return scheme;
            }
        };
    }
    function createURITransformer(remoteAuthority) {
        return new uriIpc_1.URITransformer(createRawURITransformer(remoteAuthority));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJpVHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL25vZGUvdXJpVHJhbnNmb3JtZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE2Q2hHLG9EQUVDO0lBM0NEOzs7Ozs7Ozs7T0FTRztJQUNILFNBQVMsdUJBQXVCLENBQUMsZUFBdUI7UUFDdkQsT0FBTztZQUNOLGlCQUFpQixFQUFFLENBQUMsR0FBYSxFQUFZLEVBQUU7Z0JBQzlDLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxlQUFlLEVBQUUsQ0FBQztvQkFDcEMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDckYsQ0FBQztnQkFDRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQzNCLE9BQU8sRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzdGLENBQUM7Z0JBQ0QsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1lBQ0QsaUJBQWlCLEVBQUUsQ0FBQyxHQUFhLEVBQVksRUFBRTtnQkFDOUMsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRSxDQUFDO29CQUMzQixPQUFPLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzFILENBQUM7Z0JBQ0QsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLGNBQWMsRUFBRSxDQUFDO29CQUNuQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNyRixDQUFDO2dCQUNELE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUNELHVCQUF1QixFQUFFLENBQUMsTUFBYyxFQUFVLEVBQUU7Z0JBQ25ELElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRSxDQUFDO29CQUN2QixPQUFPLGVBQWUsQ0FBQztnQkFDeEIsQ0FBQztxQkFBTSxJQUFJLE1BQU0sS0FBSyxjQUFjLEVBQUUsQ0FBQztvQkFDdEMsT0FBTyxNQUFNLENBQUM7Z0JBQ2YsQ0FBQztnQkFDRCxPQUFPLE1BQU0sQ0FBQztZQUNmLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQWdCLG9CQUFvQixDQUFDLGVBQXVCO1FBQzNELE9BQU8sSUFBSSx1QkFBYyxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7SUFDckUsQ0FBQyJ9