/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/async", "vs/nls"], function (require, exports, event_1, async_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractDebugAdapter = void 0;
    /**
     * Abstract implementation of the low level API for a debug adapter.
     * Missing is how this API communicates with the debug adapter.
     */
    class AbstractDebugAdapter {
        constructor() {
            this.pendingRequests = new Map();
            this.queue = [];
            this._onError = new event_1.Emitter();
            this._onExit = new event_1.Emitter();
            this.sequence = 1;
        }
        get onError() {
            return this._onError.event;
        }
        get onExit() {
            return this._onExit.event;
        }
        onMessage(callback) {
            if (this.messageCallback) {
                this._onError.fire(new Error(`attempt to set more than one 'Message' callback`));
            }
            this.messageCallback = callback;
        }
        onEvent(callback) {
            if (this.eventCallback) {
                this._onError.fire(new Error(`attempt to set more than one 'Event' callback`));
            }
            this.eventCallback = callback;
        }
        onRequest(callback) {
            if (this.requestCallback) {
                this._onError.fire(new Error(`attempt to set more than one 'Request' callback`));
            }
            this.requestCallback = callback;
        }
        sendResponse(response) {
            if (response.seq > 0) {
                this._onError.fire(new Error(`attempt to send more than one response for command ${response.command}`));
            }
            else {
                this.internalSend('response', response);
            }
        }
        sendRequest(command, args, clb, timeout) {
            const request = {
                command: command
            };
            if (args && Object.keys(args).length > 0) {
                request.arguments = args;
            }
            this.internalSend('request', request);
            if (typeof timeout === 'number') {
                const timer = setTimeout(() => {
                    clearTimeout(timer);
                    const clb = this.pendingRequests.get(request.seq);
                    if (clb) {
                        this.pendingRequests.delete(request.seq);
                        const err = {
                            type: 'response',
                            seq: 0,
                            request_seq: request.seq,
                            success: false,
                            command,
                            message: (0, nls_1.localize)('timeout', "Timeout after {0} ms for '{1}'", timeout, command)
                        };
                        clb(err);
                    }
                }, timeout);
            }
            if (clb) {
                // store callback for this request
                this.pendingRequests.set(request.seq, clb);
            }
            return request.seq;
        }
        acceptMessage(message) {
            if (this.messageCallback) {
                this.messageCallback(message);
            }
            else {
                this.queue.push(message);
                if (this.queue.length === 1) {
                    // first item = need to start processing loop
                    this.processQueue();
                }
            }
        }
        /**
         * Returns whether we should insert a timeout between processing messageA
         * and messageB. Artificially queueing protocol messages guarantees that any
         * microtasks for previous message finish before next message is processed.
         * This is essential ordering when using promises anywhere along the call path.
         *
         * For example, take the following, where `chooseAndSendGreeting` returns
         * a person name and then emits a greeting event:
         *
         * ```
         * let person: string;
         * adapter.onGreeting(() => console.log('hello', person));
         * person = await adapter.chooseAndSendGreeting();
         * ```
         *
         * Because the event is dispatched synchronously, it may fire before person
         * is assigned if they're processed in the same task. Inserting a task
         * boundary avoids this issue.
         */
        needsTaskBoundaryBetween(messageA, messageB) {
            return messageA.type !== 'event' || messageB.type !== 'event';
        }
        /**
         * Reads and dispatches items from the queue until it is empty.
         */
        async processQueue() {
            let message;
            while (this.queue.length) {
                if (!message || this.needsTaskBoundaryBetween(this.queue[0], message)) {
                    await (0, async_1.timeout)(0);
                }
                message = this.queue.shift();
                if (!message) {
                    return; // may have been disposed of
                }
                switch (message.type) {
                    case 'event':
                        this.eventCallback?.(message);
                        break;
                    case 'request':
                        this.requestCallback?.(message);
                        break;
                    case 'response': {
                        const response = message;
                        const clb = this.pendingRequests.get(response.request_seq);
                        if (clb) {
                            this.pendingRequests.delete(response.request_seq);
                            clb(response);
                        }
                        break;
                    }
                }
            }
        }
        internalSend(typ, message) {
            message.type = typ;
            message.seq = this.sequence++;
            this.sendMessage(message);
        }
        async cancelPendingRequests() {
            if (this.pendingRequests.size === 0) {
                return Promise.resolve();
            }
            const pending = new Map();
            this.pendingRequests.forEach((value, key) => pending.set(key, value));
            await (0, async_1.timeout)(500);
            pending.forEach((callback, request_seq) => {
                const err = {
                    type: 'response',
                    seq: 0,
                    request_seq,
                    success: false,
                    command: 'canceled',
                    message: 'canceled'
                };
                callback(err);
                this.pendingRequests.delete(request_seq);
            });
        }
        getPendingRequestIds() {
            return Array.from(this.pendingRequests.keys());
        }
        dispose() {
            this.queue = [];
        }
    }
    exports.AbstractDebugAdapter = AbstractDebugAdapter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3REZWJ1Z0FkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vYWJzdHJhY3REZWJ1Z0FkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHOzs7T0FHRztJQUNILE1BQXNCLG9CQUFvQjtRQVV6QztZQVJRLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQStDLENBQUM7WUFJekUsVUFBSyxHQUFvQyxFQUFFLENBQUM7WUFDakMsYUFBUSxHQUFHLElBQUksZUFBTyxFQUFTLENBQUM7WUFDaEMsWUFBTyxHQUFHLElBQUksZUFBTyxFQUFpQixDQUFDO1lBR3pELElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLENBQUM7UUFRRCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLE1BQU07WUFDVCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQzNCLENBQUM7UUFFRCxTQUFTLENBQUMsUUFBMEQ7WUFDbkUsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUMsQ0FBQztZQUNsRixDQUFDO1lBQ0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUM7UUFDakMsQ0FBQztRQUVELE9BQU8sQ0FBQyxRQUE4QztZQUNyRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFDRCxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztRQUMvQixDQUFDO1FBRUQsU0FBUyxDQUFDLFFBQWtEO1lBQzNELElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDLENBQUM7WUFDbEYsQ0FBQztZQUNELElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO1FBQ2pDLENBQUM7UUFFRCxZQUFZLENBQUMsUUFBZ0M7WUFDNUMsSUFBSSxRQUFRLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxzREFBc0QsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDekMsQ0FBQztRQUNGLENBQUM7UUFFRCxXQUFXLENBQUMsT0FBZSxFQUFFLElBQVMsRUFBRSxHQUE2QyxFQUFFLE9BQWdCO1lBQ3RHLE1BQU0sT0FBTyxHQUFRO2dCQUNwQixPQUFPLEVBQUUsT0FBTzthQUNoQixDQUFDO1lBQ0YsSUFBSSxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQzFCLENBQUM7WUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN0QyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUM3QixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3BCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDVCxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ3pDLE1BQU0sR0FBRyxHQUEyQjs0QkFDbkMsSUFBSSxFQUFFLFVBQVU7NEJBQ2hCLEdBQUcsRUFBRSxDQUFDOzRCQUNOLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRzs0QkFDeEIsT0FBTyxFQUFFLEtBQUs7NEJBQ2QsT0FBTzs0QkFDUCxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLGdDQUFnQyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUM7eUJBQ2hGLENBQUM7d0JBQ0YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNWLENBQUM7Z0JBQ0YsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2IsQ0FBQztZQUNELElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1Qsa0NBQWtDO2dCQUNsQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDcEIsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUFzQztZQUNuRCxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3pCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzdCLDZDQUE2QztvQkFDN0MsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNyQixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBa0JHO1FBQ08sd0JBQXdCLENBQUMsUUFBdUMsRUFBRSxRQUF1QztZQUNsSCxPQUFPLFFBQVEsQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDO1FBQy9ELENBQUM7UUFFRDs7V0FFRztRQUNLLEtBQUssQ0FBQyxZQUFZO1lBQ3pCLElBQUksT0FBa0QsQ0FBQztZQUN2RCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDdkUsTUFBTSxJQUFBLGVBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEIsQ0FBQztnQkFFRCxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNkLE9BQU8sQ0FBQyw0QkFBNEI7Z0JBQ3JDLENBQUM7Z0JBRUQsUUFBUSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3RCLEtBQUssT0FBTzt3QkFDWCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQXNCLE9BQU8sQ0FBQyxDQUFDO3dCQUNuRCxNQUFNO29CQUNQLEtBQUssU0FBUzt3QkFDYixJQUFJLENBQUMsZUFBZSxFQUFFLENBQXdCLE9BQU8sQ0FBQyxDQUFDO3dCQUN2RCxNQUFNO29CQUNQLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQzt3QkFDakIsTUFBTSxRQUFRLEdBQTJCLE9BQU8sQ0FBQzt3QkFDakQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO3dCQUMzRCxJQUFJLEdBQUcsRUFBRSxDQUFDOzRCQUNULElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQzs0QkFDbEQsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUNmLENBQUM7d0JBQ0QsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLFlBQVksQ0FBQyxHQUFxQyxFQUFFLE9BQXNDO1lBQ2pHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ25CLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVTLEtBQUssQ0FBQyxxQkFBcUI7WUFDcEMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUErQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLElBQUEsZUFBTyxFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLEVBQUU7Z0JBQ3pDLE1BQU0sR0FBRyxHQUEyQjtvQkFDbkMsSUFBSSxFQUFFLFVBQVU7b0JBQ2hCLEdBQUcsRUFBRSxDQUFDO29CQUNOLFdBQVc7b0JBQ1gsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsT0FBTyxFQUFFLFVBQVU7b0JBQ25CLE9BQU8sRUFBRSxVQUFVO2lCQUNuQixDQUFDO2dCQUNGLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDZCxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxvQkFBb0I7WUFDbkIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQXBNRCxvREFvTUMifQ==