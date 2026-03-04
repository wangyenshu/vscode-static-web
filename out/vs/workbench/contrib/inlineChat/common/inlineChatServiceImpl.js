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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/linkedList", "vs/platform/contextkey/common/contextkey", "./inlineChat"], function (require, exports, lifecycle_1, event_1, linkedList_1, contextkey_1, inlineChat_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatServiceImpl = void 0;
    let InlineChatServiceImpl = class InlineChatServiceImpl {
        constructor(contextKeyService) {
            this._onDidChangeProviders = new event_1.Emitter();
            this._entries = new linkedList_1.LinkedList();
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._ctxHasProvider = inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER.bindTo(contextKeyService);
        }
        addProvider(provider) {
            const rm = this._entries.push(provider);
            this._ctxHasProvider.set(true);
            this._onDidChangeProviders.fire({ added: provider });
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                this._ctxHasProvider.set(this._entries.size > 0);
                this._onDidChangeProviders.fire({ removed: provider });
            });
        }
        getAllProvider() {
            return [...this._entries].reverse();
        }
    };
    exports.InlineChatServiceImpl = InlineChatServiceImpl;
    exports.InlineChatServiceImpl = InlineChatServiceImpl = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], InlineChatServiceImpl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC9jb21tb24vaW5saW5lQ2hhdFNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQVVqQyxZQUFnQyxpQkFBcUM7WUFOcEQsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQWlDLENBQUM7WUFDckUsYUFBUSxHQUFHLElBQUksdUJBQVUsRUFBOEIsQ0FBQztZQUdoRSx5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBR2hFLElBQUksQ0FBQyxlQUFlLEdBQUcseUNBQTRCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVELFdBQVcsQ0FBQyxRQUFvQztZQUUvQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFckQsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixFQUFFLEVBQUUsQ0FBQztnQkFDTCxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDakQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELGNBQWM7WUFDYixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckMsQ0FBQztLQUNELENBQUE7SUE5Qlksc0RBQXFCO29DQUFyQixxQkFBcUI7UUFVcEIsV0FBQSwrQkFBa0IsQ0FBQTtPQVZuQixxQkFBcUIsQ0E4QmpDIn0=