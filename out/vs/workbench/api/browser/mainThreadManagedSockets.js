/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/remote/common/managedSocket", "vs/platform/remote/common/remoteSocketFactoryService", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, event_1, lifecycle_1, managedSocket_1, remoteSocketFactoryService_1, extHost_protocol_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadManagedSocket = exports.MainThreadManagedSockets = void 0;
    let MainThreadManagedSockets = class MainThreadManagedSockets extends lifecycle_1.Disposable {
        constructor(extHostContext, _remoteSocketFactoryService) {
            super();
            this._remoteSocketFactoryService = _remoteSocketFactoryService;
            this._registrations = new Map();
            this._remoteSockets = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostManagedSockets);
        }
        async $registerSocketFactory(socketFactoryId) {
            const that = this;
            const socketFactory = new class {
                supports(connectTo) {
                    return (connectTo.id === socketFactoryId);
                }
                connect(connectTo, path, query, debugLabel) {
                    return new Promise((resolve, reject) => {
                        if (connectTo.id !== socketFactoryId) {
                            return reject(new Error('Invalid connectTo'));
                        }
                        const factoryId = connectTo.id;
                        that._proxy.$openRemoteSocket(factoryId).then(socketId => {
                            const half = {
                                onClose: new event_1.Emitter(),
                                onData: new event_1.Emitter(),
                                onEnd: new event_1.Emitter(),
                            };
                            that._remoteSockets.set(socketId, half);
                            MainThreadManagedSocket.connect(socketId, that._proxy, path, query, debugLabel, half)
                                .then(socket => {
                                socket.onDidDispose(() => that._remoteSockets.delete(socketId));
                                resolve(socket);
                            }, err => {
                                that._remoteSockets.delete(socketId);
                                reject(err);
                            });
                        }).catch(reject);
                    });
                }
            };
            this._registrations.set(socketFactoryId, this._remoteSocketFactoryService.register(1 /* RemoteConnectionType.Managed */, socketFactory));
        }
        async $unregisterSocketFactory(socketFactoryId) {
            this._registrations.get(socketFactoryId)?.dispose();
        }
        $onDidManagedSocketHaveData(socketId, data) {
            this._remoteSockets.get(socketId)?.onData.fire(data);
        }
        $onDidManagedSocketClose(socketId, error) {
            this._remoteSockets.get(socketId)?.onClose.fire({
                type: 0 /* SocketCloseEventType.NodeSocketCloseEvent */,
                error: error ? new Error(error) : undefined,
                hadError: !!error
            });
            this._remoteSockets.delete(socketId);
        }
        $onDidManagedSocketEnd(socketId) {
            this._remoteSockets.get(socketId)?.onEnd.fire();
        }
    };
    exports.MainThreadManagedSockets = MainThreadManagedSockets;
    exports.MainThreadManagedSockets = MainThreadManagedSockets = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadManagedSockets),
        __param(1, remoteSocketFactoryService_1.IRemoteSocketFactoryService)
    ], MainThreadManagedSockets);
    class MainThreadManagedSocket extends managedSocket_1.ManagedSocket {
        static connect(socketId, proxy, path, query, debugLabel, half) {
            const socket = new MainThreadManagedSocket(socketId, proxy, debugLabel, half);
            return (0, managedSocket_1.connectManagedSocket)(socket, path, query, debugLabel, half);
        }
        constructor(socketId, proxy, debugLabel, half) {
            super(debugLabel, half);
            this.socketId = socketId;
            this.proxy = proxy;
        }
        write(buffer) {
            this.proxy.$remoteSocketWrite(this.socketId, buffer);
        }
        closeRemote() {
            this.proxy.$remoteSocketEnd(this.socketId);
        }
        drain() {
            return this.proxy.$remoteSocketDrain(this.socketId);
        }
    }
    exports.MainThreadManagedSocket = MainThreadManagedSocket;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE1hbmFnZWRTb2NrZXRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRNYW5hZ2VkU29ja2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQU12RCxZQUNDLGNBQStCLEVBQ0YsMkJBQXlFO1lBRXRHLEtBQUssRUFBRSxDQUFDO1lBRnNDLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFMdEYsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztZQUNoRCxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUE0QixDQUFDO1lBT3JFLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxlQUF1QjtZQUNuRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsTUFBTSxhQUFhLEdBQUcsSUFBSTtnQkFFekIsUUFBUSxDQUFDLFNBQWtDO29CQUMxQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxlQUFlLENBQUMsQ0FBQztnQkFDM0MsQ0FBQztnQkFFRCxPQUFPLENBQUMsU0FBa0MsRUFBRSxJQUFZLEVBQUUsS0FBYSxFQUFFLFVBQWtCO29CQUMxRixPQUFPLElBQUksT0FBTyxDQUFVLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO3dCQUMvQyxJQUFJLFNBQVMsQ0FBQyxFQUFFLEtBQUssZUFBZSxFQUFFLENBQUM7NEJBQ3RDLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxD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