/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/base/parts/ipc/node/ipc.mp", "vs/base/parts/sandbox/node/electronTypes", "vs/platform/files/node/watcher/watcher"], function (require, exports, lifecycle_1, ipc_1, ipc_cp_1, ipc_mp_1, electronTypes_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let server;
    if ((0, electronTypes_1.isUtilityProcess)(process)) {
        server = new ipc_mp_1.Server();
    }
    else {
        server = new ipc_cp_1.Server('watcher');
    }
    const service = new watcher_1.UniversalWatcher();
    server.registerChannel('watcher', ipc_1.ProxyChannel.fromService(service, new lifecycle_1.DisposableStore()));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlck1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9maWxlcy9ub2RlL3dhdGNoZXIvd2F0Y2hlck1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsSUFBSSxNQUF5RCxDQUFDO0lBQzlELElBQUksSUFBQSxnQ0FBZ0IsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQy9CLE1BQU0sR0FBRyxJQUFJLGVBQW9CLEVBQUUsQ0FBQztJQUNyQyxDQUFDO1NBQU0sQ0FBQztRQUNQLE1BQU0sR0FBRyxJQUFJLGVBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELE1BQU0sT0FBTyxHQUFHLElBQUksMEJBQWdCLEVBQUUsQ0FBQztJQUN2QyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxrQkFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDIn0=