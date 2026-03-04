/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeRemoteResourceRouter = exports.NODE_REMOTE_RESOURCE_CHANNEL_NAME = exports.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME = void 0;
    exports.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME = 'request';
    exports.NODE_REMOTE_RESOURCE_CHANNEL_NAME = 'remoteResourceHandler';
    class NodeRemoteResourceRouter {
        async routeCall(hub, command, arg) {
            if (command !== exports.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME) {
                throw new Error(`Call not found: ${command}`);
            }
            const uri = arg[0];
            if (uri?.authority) {
                const connection = hub.connections.find(c => c.ctx === uri.authority);
                if (connection) {
                    return connection;
                }
            }
            throw new Error(`Caller not found`);
        }
        routeEvent(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
    }
    exports.NodeRemoteResourceRouter = NodeRemoteResourceRouter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3Ryb25SZW1vdGVSZXNvdXJjZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvY29tbW9uL2VsZWN0cm9uUmVtb3RlUmVzb3VyY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtuRixRQUFBLG9DQUFvQyxHQUFHLFNBQVMsQ0FBQztJQUVqRCxRQUFBLGlDQUFpQyxHQUFHLHVCQUF1QixDQUFDO0lBSXpFLE1BQWEsd0JBQXdCO1FBQ3BDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBMkIsRUFBRSxPQUFlLEVBQUUsR0FBUztZQUN0RSxJQUFJLE9BQU8sS0FBSyw0Q0FBb0MsRUFBRSxDQUFDO2dCQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFnQyxDQUFDO1lBQ2xELElBQUksR0FBRyxFQUFFLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN0RSxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixPQUFPLFVBQVUsQ0FBQztnQkFDbkIsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELFVBQVUsQ0FBQyxDQUF5QixFQUFFLEtBQWE7WUFDbEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM5QyxDQUFDO0tBQ0Q7SUFwQkQsNERBb0JDIn0=