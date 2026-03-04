/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostDebugChannelClient = exports.ExtensionHostDebugBroadcastChannel = void 0;
    class ExtensionHostDebugBroadcastChannel {
        constructor() {
            this._onCloseEmitter = new event_1.Emitter();
            this._onReloadEmitter = new event_1.Emitter();
            this._onTerminateEmitter = new event_1.Emitter();
            this._onAttachEmitter = new event_1.Emitter();
        }
        static { this.ChannelName = 'extensionhostdebugservice'; }
        call(ctx, command, arg) {
            switch (command) {
                case 'close':
                    return Promise.resolve(this._onCloseEmitter.fire({ sessionId: arg[0] }));
                case 'reload':
                    return Promise.resolve(this._onReloadEmitter.fire({ sessionId: arg[0] }));
                case 'terminate':
                    return Promise.resolve(this._onTerminateEmitter.fire({ sessionId: arg[0] }));
                case 'attach':
                    return Promise.resolve(this._onAttachEmitter.fire({ sessionId: arg[0], port: arg[1], subId: arg[2] }));
            }
            throw new Error('Method not implemented.');
        }
        listen(ctx, event, arg) {
            switch (event) {
                case 'close':
                    return this._onCloseEmitter.event;
                case 'reload':
                    return this._onReloadEmitter.event;
                case 'terminate':
                    return this._onTerminateEmitter.event;
                case 'attach':
                    return this._onAttachEmitter.event;
            }
            throw new Error('Method not implemented.');
        }
    }
    exports.ExtensionHostDebugBroadcastChannel = ExtensionHostDebugBroadcastChannel;
    class ExtensionHostDebugChannelClient extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this.channel = channel;
        }
        reload(sessionId) {
            this.channel.call('reload', [sessionId]);
        }
        get onReload() {
            return this.channel.listen('reload');
        }
        close(sessionId) {
            this.channel.call('close', [sessionId]);
        }
        get onClose() {
            return this.channel.listen('close');
        }
        attachSession(sessionId, port, subId) {
            this.channel.call('attach', [sessionId, port, subId]);
        }
        get onAttachSession() {
            return this.channel.listen('attach');
        }
        terminateSession(sessionId, subId) {
            this.channel.call('terminate', [sessionId, subId]);
        }
        get onTerminateSession() {
            return this.channel.listen('terminate');
        }
        openExtensionDevelopmentHostWindow(args, debugRenderer) {
            return this.channel.call('openExtensionDevelopmentHostWindow', [args, debugRenderer]);
        }
    }
    exports.ExtensionHostDebugChannelClient = ExtensionHostDebugChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdERlYnVnSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZGVidWcvY29tbW9uL2V4dGVuc2lvbkhvc3REZWJ1Z0lwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxrQ0FBa0M7UUFBL0M7WUFJa0Isb0JBQWUsR0FBRyxJQUFJLGVBQU8sRUFBc0IsQ0FBQztZQUNwRCxxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBdUIsQ0FBQztZQUN0RCx3QkFBbUIsR0FBRyxJQUFJLGVBQU8sRUFBMEIsQ0FBQztZQUM1RCxxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBdUIsQ0FBQztRQTZCeEUsQ0FBQztpQkFsQ2dCLGdCQUFXLEdBQUcsMkJBQTJCLEFBQTlCLENBQStCO1FBTzFELElBQUksQ0FBQyxHQUFhLEVBQUUsT0FBZSxFQUFFLEdBQVM7WUFDN0MsUUFBUSxPQUFPLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxPQUFPO29CQUNYLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLEtBQUssUUFBUTtvQkFDWixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNFLEtBQUssV0FBVztvQkFDZixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FB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