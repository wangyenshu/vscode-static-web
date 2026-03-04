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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/decorations/common/decorations", "vs/base/common/cancellation"], function (require, exports, uri_1, event_1, lifecycle_1, extHost_protocol_1, extHostCustomers_1, decorations_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDecorations = void 0;
    class DecorationRequestsQueue {
        constructor(_proxy, _handle) {
            this._proxy = _proxy;
            this._handle = _handle;
            this._idPool = 0;
            this._requests = new Map();
            this._resolver = new Map();
            //
        }
        enqueue(uri, token) {
            const id = ++this._idPool;
            const result = new Promise(resolve => {
                this._requests.set(id, { id, uri });
                this._resolver.set(id, resolve);
                this._processQueue();
            });
            const sub = token.onCancellationRequested(() => {
                this._requests.delete(id);
                this._resolver.delete(id);
            });
            return result.finally(() => sub.dispose());
        }
        _processQueue() {
            if (typeof this._timer === 'number') {
                // already queued
                return;
            }
            this._timer = setTimeout(() => {
                // make request
                const requests = this._requests;
                const resolver = this._resolver;
                this._proxy.$provideDecorations(this._handle, [...requests.values()], cancellation_1.CancellationToken.None).then(data => {
                    for (const [id, resolve] of resolver) {
                        resolve(data[id]);
                    }
                });
                // reset
                this._requests = new Map();
                this._resolver = new Map();
                this._timer = undefined;
            }, 0);
        }
    }
    let MainThreadDecorations = class MainThreadDecorations {
        constructor(context, _decorationsService) {
            this._decorationsService = _decorationsService;
            this._provider = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDecorations);
        }
        dispose() {
            this._provider.forEach(value => (0, lifecycle_1.dispose)(value));
            this._provider.clear();
        }
        $registerDecorationProvider(handle, label) {
            const emitter = new event_1.Emitter();
            const queue = new DecorationRequestsQueue(this._proxy, handle);
            const registration = this._decorationsService.registerDecorationsProvider({
                label,
                onDidChange: emitter.event,
                provideDecorations: async (uri, token) => {
                    const data = await queue.enqueue(uri, token);
                    if (!data) {
                        return undefined;
                    }
                    const [bubble, tooltip, letter, themeColor] = data;
                    return {
                        weight: 10,
                        bubble: bubble ?? false,
                        color: themeColor?.id,
                        tooltip,
                        letter
                    };
                }
            });
            this._provider.set(handle, [emitter, registration]);
        }
        $onDidChange(handle, resources) {
            const provider = this._provider.get(handle);
            if (provider) {
                const [emitter] = provider;
                emitter.fire(resources && resources.map(r => uri_1.URI.revive(r)));
            }
        }
        $unregisterDecorationProvider(handle) {
            const provider = this._provider.get(handle);
            if (provider) {
                (0, lifecycle_1.dispose)(provider);
                this._provider.delete(handle);
            }
        }
    };
    exports.MainThreadDecorations = MainThreadDecorations;
    exports.MainThreadDecorations = MainThreadDecorations = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDecorations),
        __param(1, decorations_1.IDecorationsService)
    ], MainThreadDecorations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWREZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsTUFBTSx1QkFBdUI7UUFRNUIsWUFDa0IsTUFBK0IsRUFDL0IsT0FBZTtZQURmLFdBQU0sR0FBTixNQUFNLENBQXlCO1lBQy9CLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFSekIsWUFBTyxHQUFHLENBQUMsQ0FBQztZQUNaLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztZQUNqRCxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQXlDLENBQUM7WUFRcEUsRUFBRTtRQUNILENBQUM7UUFFRCxPQUFPLENBQUMsR0FBUSxFQUFFLEtBQXdCO1lBQ3pDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBaUIsT0FBTyxDQUFDLEVBQUU7Z0JBQ3BELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0QixDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQzlDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQixJQUFJLENB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