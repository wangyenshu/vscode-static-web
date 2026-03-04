/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteSocketFactoryService = exports.IRemoteSocketFactoryService = void 0;
    exports.IRemoteSocketFactoryService = (0, instantiation_1.createDecorator)('remoteSocketFactoryService');
    class RemoteSocketFactoryService {
        constructor() {
            this.factories = {};
        }
        register(type, factory) {
            this.factories[type] ??= [];
            this.factories[type].push(factory);
            return (0, lifecycle_1.toDisposable)(() => {
                const idx = this.factories[type]?.indexOf(factory);
                if (typeof idx === 'number' && idx >= 0) {
                    this.factories[type]?.splice(idx, 1);
                }
            });
        }
        getSocketFactory(messagePassing) {
            const factories = (this.factories[messagePassing.type] || []);
            return factories.find(factory => factory.supports(messagePassing));
        }
        connect(connectTo, path, query, debugLabel) {
            const socketFactory = this.getSocketFactory(connectTo);
            if (!socketFactory) {
                throw new Error(`No socket factory found for ${connectTo}`);
            }
            return socketFactory.connect(connectTo, path, query, debugLabel);
        }
    }
    exports.RemoteSocketFactoryService = RemoteSocketFactoryService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlU29ja2V0RmFjdG9yeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvY29tbW9uL3JlbW90ZVNvY2tldEZhY3RvcnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9uRixRQUFBLDJCQUEyQixHQUFHLElBQUEsK0JBQWUsRUFBOEIsNEJBQTRCLENBQUMsQ0FBQztJQXFCdEgsTUFBYSwwQkFBMEI7UUFBdkM7WUFHa0IsY0FBUyxHQUEwRCxFQUFFLENBQUM7UUF5QnhGLENBQUM7UUF2Qk8sUUFBUSxDQUFpQyxJQUFPLEVBQUUsT0FBMEI7WUFDbEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEMsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxnQkFBZ0IsQ0FBaUMsY0FBeUM7WUFDakcsTUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQXdCLENBQUM7WUFDckYsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFTSxPQUFPLENBQUMsU0FBMkIsRUFBRSxJQUFZLEVBQUUsS0FBYSxFQUFFLFVBQWtCO1lBQzFGLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDN0QsQ0FBQztZQUNELE9BQU8sYUFBYSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNsRSxDQUFDO0tBQ0Q7SUE1QkQsZ0VBNEJDIn0=