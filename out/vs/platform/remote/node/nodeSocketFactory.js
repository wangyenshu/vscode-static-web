/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net", "vs/base/parts/ipc/node/ipc.net", "vs/platform/remote/common/managedSocket"], function (require, exports, net, ipc_net_1, managedSocket_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nodeSocketFactory = void 0;
    exports.nodeSocketFactory = new class {
        supports(connectTo) {
            return true;
        }
        connect({ host, port }, path, query, debugLabel) {
            return new Promise((resolve, reject) => {
                const socket = net.createConnection({ host: host, port: port }, () => {
                    socket.removeListener('error', reject);
                    socket.write((0, managedSocket_1.makeRawSocketHeaders)(path, query, debugLabel));
                    const onData = (data) => {
                        const strData = data.toString();
                        if (strData.indexOf('\r\n\r\n') >= 0) {
                            // headers received OK
                            socket.off('data', onData);
                            resolve(new ipc_net_1.NodeSocket(socket, debugLabel));
                        }
                    };
                    socket.on('data', onData);
                });
                // Disable Nagle's algorithm.
                socket.setNoDelay(true);
                socket.once('error', reject);
            });
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZVNvY2tldEZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvbm9kZS9ub2RlU29ja2V0RmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTbkYsUUFBQSxpQkFBaUIsR0FBRyxJQUFJO1FBRXBDLFFBQVEsQ0FBQyxTQUFvQztZQUM1QyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUE2QixFQUFFLElBQVksRUFBRSxLQUFhLEVBQUUsVUFBa0I7WUFDakcsT0FBTyxJQUFJLE9BQU8sQ0FBVSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDL0MsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFO29CQUNwRSxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFFdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFBLG9DQUFvQixFQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFFNUQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTt3QkFDL0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNoQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7NEJBQ3RDLHNCQUFzQjs0QkFDdEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7NEJBQzNCLE9BQU8sQ0FBQyxJQUFJLG9CQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7d0JBQzdDLENBQUM7b0JBQ0YsQ0FBQyxDQUFDO29CQUNGLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQixDQUFDLENBQUMsQ0FBQztnQkFDSCw2QkFBNkI7Z0JBQzdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUMifQ==