/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Protocol = void 0;
    /**
     * The Electron `Protocol` leverages Electron style IPC communication (`ipcRenderer`, `ipcMain`)
     * for the implementation of the `IMessagePassingProtocol`. That style of API requires a channel
     * name for sending data.
     */
    class Protocol {
        constructor(sender, onMessage) {
            this.sender = sender;
            this.onMessage = onMessage;
        }
        send(message) {
            try {
                this.sender.send('vscode:message', message.buffer);
            }
            catch (e) {
                // systems are going down
            }
        }
        disconnect() {
            this.sender.send('vscode:disconnect', null);
        }
    }
    exports.Protocol = Protocol;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLmVsZWN0cm9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9pcGMvY29tbW9uL2lwYy5lbGVjdHJvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEc7Ozs7T0FJRztJQUNILE1BQWEsUUFBUTtRQUVwQixZQUFvQixNQUFjLEVBQVcsU0FBMEI7WUFBbkQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUFXLGNBQVMsR0FBVCxTQUFTLENBQWlCO1FBQUksQ0FBQztRQUU1RSxJQUFJLENBQUMsT0FBaUI7WUFDckIsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWix5QkFBeUI7WUFDMUIsQ0FBQztRQUNGLENBQUM7UUFFRCxVQUFVO1lBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0MsQ0FBQztLQUNEO0lBZkQsNEJBZUMifQ==