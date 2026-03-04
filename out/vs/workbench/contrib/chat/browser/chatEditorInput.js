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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, cancellation_1, codicons_1, event_1, lifecycle_1, network_1, uri_1, nls, iconRegistry_1, editorInput_1, chatAgents_1, chatService_1) {
    "use strict";
    var ChatEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatEditorInputSerializer = exports.ChatUri = exports.ChatEditorModel = exports.ChatEditorInput = void 0;
    const ChatEditorIcon = (0, iconRegistry_1.registerIcon)('chat-editor-label-icon', codicons_1.Codicon.commentDiscussion, nls.localize('chatEditorLabelIcon', 'Icon of the chat editor label.'));
    let ChatEditorInput = class ChatEditorInput extends editorInput_1.EditorInput {
        static { ChatEditorInput_1 = this; }
        static { this.countsInUse = new Set(); }
        static { this.TypeID = 'workbench.input.chatSession'; }
        static { this.EditorID = 'workbench.editor.chatSession'; }
        static getNewEditorUri() {
            const handle = Math.floor(Math.random() * 1e9);
            return ChatUri.generate(handle);
        }
        static getNextCount() {
            let count = 0;
            while (ChatEditorInput_1.countsInUse.has(count)) {
                count++;
            }
            return count;
        }
        constructor(resource, options, chatService) {
            super();
            this.resource = resource;
            this.options = options;
            this.chatService = chatService;
            const parsed = ChatUri.parse(resource);
            if (typeof parsed?.handle !== 'number') {
                throw new Error('Invalid chat URI');
            }
            this.sessionId = (options.target && 'sessionId' in options.target) ?
                options.target.sessionId :
                undefined;
            this.inputCount = ChatEditorInput_1.getNextCount();
            ChatEditorInput_1.countsInUse.add(this.inputCount);
            this._register((0, lifecycle_1.toDisposable)(() => ChatEditorInput_1.countsInUse.delete(this.inputCount)));
        }
        get editorId() {
            return ChatEditorInput_1.EditorID;
        }
        get capabilities() {
            return super.capabilities | 8 /* EditorInputCapabilities.Singleton */;
        }
        matches(otherInput) {
            return otherInput instanceof ChatEditorInput_1 && otherInput.resource.toString() === this.resource.toString();
        }
        get typeId() {
            return ChatEditorInput_1.TypeID;
        }
        getName() {
            return this.model?.title || nls.localize('chatEditorName', "Chat") + (this.inputCount > 0 ? ` ${this.inputCount + 1}` : '');
        }
        getIcon() {
            return ChatEditorIcon;
        }
        async resolve() {
            if (typeof this.sessionId === 'string') {
                this.model = this.chatService.getOrRestoreSession(this.sessionId);
            }
            else if (!this.options.target) {
                this.model = this.chatService.startSession(chatAgents_1.ChatAgentLocation.Panel, cancellation_1.CancellationToken.None);
            }
            else if ('data' in this.options.target) {
                this.model = this.chatService.loadSessionFromContent(this.options.target.data);
            }
            if (!this.model) {
                return null;
            }
            this.sessionId = this.model.sessionId;
            this._register(this.model.onDidChange(() => this._onDidChangeLabel.fire()));
            return this._register(new ChatEditorModel(this.model));
        }
        dispose() {
            super.dispose();
            if (this.sessionId) {
                this.chatService.clearSession(this.sessionId);
            }
        }
    };
    exports.ChatEditorInput = ChatEditorInput;
    exports.ChatEditorInput = ChatEditorInput = ChatEditorInput_1 = __decorate([
        __param(2, chatService_1.IChatService)
    ], ChatEditorInput);
    class ChatEditorModel extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._isDisposed = false;
            this._isResolved = false;
        }
        async resolve() {
            this._isResolved = true;
        }
        isResolved() {
            return this._isResolved;
        }
        isDisposed() {
            return this._isDisposed;
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
        }
    }
    exports.ChatEditorModel = ChatEditorModel;
    var ChatUri;
    (function (ChatUri) {
        ChatUri.scheme = network_1.Schemas.vscodeChatSesssion;
        function generate(handle) {
            return uri_1.URI.from({ scheme: ChatUri.scheme, path: `chat-${handle}` });
        }
        ChatUri.generate = generate;
        function parse(resource) {
            if (resource.scheme !== ChatUri.scheme) {
                return undefined;
            }
            const match = resource.path.match(/chat-(\d+)/);
            const handleStr = match?.[1];
            if (typeof handleStr !== 'string') {
                return undefined;
            }
            const handle = parseInt(handleStr);
            if (isNaN(handle)) {
                return undefined;
            }
            return { handle };
        }
        ChatUri.parse = parse;
    })(ChatUri || (exports.ChatUri = ChatUri = {}));
    class ChatEditorInputSerializer {
        canSerialize(input) {
            return input instanceof ChatEditorInput && typeof input.sessionId === 'string';
        }
        serialize(input) {
            if (!this.canSerialize(input)) {
                return undefined;
            }
            const obj = {
                options: input.options,
                sessionId: input.sessionId,
                resource: input.resource
            };
            return JSON.stringify(obj);
        }
        deserialize(instantiationService, serializedEditor) {
            try {
                const parsed = JSON.parse(serializedEditor);
                const resource = uri_1.URI.revive(parsed.resource);
                return instantiationService.createInstance(ChatEditorInput, resource, { ...parsed.options, target: { sessionId: parsed.sessionId } });
            }
            catch (err) {
                return undefined;
            }
        }
    }
    exports.ChatEditorInputSerializer = ChatEditorInputSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEVkaXRvcklucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRyxNQUFNLGNBQWMsR0FBRyxJQUFBLDJCQUFZLEVBQUMsd0JBQXdCLEVBQUUsa0JBQU8sQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztJQUV6SixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHlCQUFXOztpQkFDL0IsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBVSxBQUFwQixDQUFxQjtpQkFFaEMsV0FBTSxHQUFXLDZCQUE2QixBQUF4QyxDQUF5QztpQkFDL0MsYUFBUSxHQUFXLDhCQUE4QixBQUF6QyxDQUEwQztRQU9sRSxNQUFNLENBQUMsZUFBZTtZQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUMvQyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELE1BQU0sQ0FBQyxZQUFZO1lBQ2xCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNkLE9BQU8saUJBQWUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLEtBQUssRUFBRSxDQUFDO1lBQ1QsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELFlBQ1UsUUFBYSxFQUNiLE9BQTJCLEVBQ0wsV0FBeUI7WUFFeEQsS0FBSyxFQUFFLENBQUM7WUFKQyxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ2IsWUFBTyxHQUFQLE9BQU8sQ0FBb0I7WUFDTCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUl4RCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksT0FBTyxNQUFNLEVBQUUsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDckMsQ0FBQztZQUVELElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLFdBQVcsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDMUIsU0FBUyxDQUFDO1lBQ1gsSUFBSSxDQUFDLFVBQVUsR0FBRyxpQkFBZSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2pELGlCQUFlLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsaUJBQWUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekYsQ0FBQztRQUVELElBQWEsUUFBUTtZQUNwQixPQUFPLGlCQUFlLENBQUMsUUFBUSxDQUFDO1FBQ2pDLENBQUM7UUFFRCxJQUFhLFlBQVk7WUFDeEIsT0FBTyxLQUFLLENBQUMsWUFBWSw0Q0FBb0MsQ0FBQztRQUMvRCxDQUFDO1FBRVEsT0FBTyxDQUFDLFVBQTZDO1lBQzdELE9BQU8sVUFBVSxZQUFZLGlCQUFlLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdHLENBQUM7UUFFRCxJQUFhLE1BQU07WUFDbEIsT0FBTyxpQkFBZSxDQUFDLE1BQU0sQ0FBQztRQUMvQixDQUFDO1FBRVEsT0FBTztZQUNmLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzdILENBQUM7UUFFUSxPQUFPO1lBQ2YsT0FBTyxjQUFjLENBQUM7UUFDdkIsQ0FBQztRQUVRLEtBQUssQ0FBQyxPQUFPO1lBQ3JCLElBQUksT0FBTyxJQUFJLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25FLENBQUM7aUJBQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsOEJBQWlCLENBQUMsS0FBSyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdGLENBQUM7aUJBQU0sSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1RSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQzs7SUE3RlcsMENBQWU7OEJBQWYsZUFBZTtRQTRCekIsV0FBQSwwQkFBWSxDQUFBO09BNUJGLGVBQWUsQ0E4RjNCO0lBRUQsTUFBYSxlQUFnQixTQUFRLHNCQUFVO1FBTzlDLFlBQ1UsS0FBaUI7WUFDdkIsS0FBSyxFQUFFLENBQUM7WUFERixVQUFLLEdBQUwsS0FBSyxDQUFZO1lBUG5CLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDcEQsa0JBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUUzQyxnQkFBVyxHQUFHLEtBQUssQ0FBQztZQUNwQixnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUlmLENBQUM7UUFFZCxLQUFLLENBQUMsT0FBTztZQUNaLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLENBQUM7UUFFRCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLENBQUM7S0FDRDtJQTNCRCwwQ0EyQkM7SUFFRCxJQUFpQixPQUFPLENBMkJ2QjtJQTNCRCxXQUFpQixPQUFPO1FBRVYsY0FBTSxHQUFHLGlCQUFPLENBQUMsa0JBQWtCLENBQUM7UUFHakQsU0FBZ0IsUUFBUSxDQUFDLE1BQWM7WUFDdEMsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFOLFFBQUEsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRmUsZ0JBQVEsV0FFdkIsQ0FBQTtRQUVELFNBQWdCLEtBQUssQ0FBQyxRQUFhO1lBQ2xDLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxRQUFBLE1BQU0sRUFBRSxDQUFDO2dCQUNoQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDaEQsTUFBTSxTQUFTLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNuQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFqQmUsYUFBSyxRQWlCcEIsQ0FBQTtJQUNGLENBQUMsRUEzQmdCLE9BQU8sdUJBQVAsT0FBTyxRQTJCdkI7SUFRRCxNQUFhLHlCQUF5QjtRQUNyQyxZQUFZLENBQUMsS0FBa0I7WUFDOUIsT0FBTyxLQUFLLFlBQVksZUFBZSxJQUFJLE9BQU8sS0FBSyxDQUFDLFNBQVMsS0FBSyxRQUFRLENBQUM7UUFDaEYsQ0FBQztRQUVELFNBQVMsQ0FBQyxLQUFrQjtZQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxHQUFHLEdBQStCO2dCQUN2QyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3RCLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUztnQkFDMUIsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQ3hCLENBQUM7WUFDRixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELFdBQVcsQ0FBQyxvQkFBMkMsRUFBRSxnQkFBd0I7WUFDaEYsSUFBSSxDQUFDO2dCQUNKLE1BQU0sTUFBTSxHQUErQixJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3hFLE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZJLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUEzQkQsOERBMkJDIn0=