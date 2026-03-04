/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/event", "vs/base/common/uuid", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, window_1, event_1, uuid_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.acquirePort = acquirePort;
    async function acquirePort(requestChannel, responseChannel, nonce = (0, uuid_1.generateUuid)()) {
        // Get ready to acquire the message port from the
        // provided `responseChannel` via preload helper.
        globals_1.ipcMessagePort.acquire(responseChannel, nonce);
        // If a `requestChannel` is provided, we are in charge
        // to trigger acquisition of the message port from main
        if (typeof requestChannel === 'string') {
            globals_1.ipcRenderer.send(requestChannel, nonce);
        }
        // Wait until the main side has returned the `MessagePort`
        // We need to filter by the `nonce` to ensure we listen
        // to the right response.
        const onMessageChannelResult = event_1.Event.fromDOMEventEmitter(window_1.mainWindow, 'message', (e) => ({ nonce: e.data, port: e.ports[0], source: e.source }));
        const { port } = await event_1.Event.toPromise(event_1.Event.once(event_1.Event.filter(onMessageChannelResult, e => e.nonce === nonce && e.source === window_1.mainWindow)));
        return port;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm1wLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9pcGMvZWxlY3Ryb24tc2FuZGJveC9pcGMubXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsa0NBbUJDO0lBbkJNLEtBQUssVUFBVSxXQUFXLENBQUMsY0FBa0MsRUFBRSxlQUF1QixFQUFFLEtBQUssR0FBRyxJQUFBLG1CQUFZLEdBQUU7UUFFcEgsaURBQWlEO1FBQ2pELGlEQUFpRDtRQUNqRCx3QkFBYyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFL0Msc0RBQXNEO1FBQ3RELHVEQUF1RDtRQUN2RCxJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3hDLHFCQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsMERBQTBEO1FBQzFELHVEQUF1RDtRQUN2RCx5QkFBeUI7UUFDekIsTUFBTSxzQkFBc0IsR0FBRyxhQUFLLENBQUMsbUJBQW1CLENBQXdCLG1CQUFVLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckwsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sYUFBSyxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLGFBQUssQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEtBQUssSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLG1CQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFNUksT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDIn0=