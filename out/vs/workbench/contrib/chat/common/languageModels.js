/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageModelsService = exports.ILanguageModelsService = exports.ChatMessageRole = void 0;
    var ChatMessageRole;
    (function (ChatMessageRole) {
        ChatMessageRole[ChatMessageRole["System"] = 0] = "System";
        ChatMessageRole[ChatMessageRole["User"] = 1] = "User";
        ChatMessageRole[ChatMessageRole["Assistant"] = 2] = "Assistant";
    })(ChatMessageRole || (exports.ChatMessageRole = ChatMessageRole = {}));
    exports.ILanguageModelsService = (0, instantiation_1.createDecorator)('ILanguageModelsService');
    class LanguageModelsService {
        constructor() {
            this._providers = new Map();
            this._onDidChangeProviders = new event_1.Emitter();
            this.onDidChangeLanguageModels = this._onDidChangeProviders.event;
        }
        dispose() {
            this._onDidChangeProviders.dispose();
            this._providers.clear();
        }
        getLanguageModelIds() {
            return Array.from(this._providers.keys());
        }
        lookupLanguageModel(identifier) {
            return this._providers.get(identifier)?.metadata;
        }
        registerLanguageModelChat(identifier, provider) {
            if (this._providers.has(identifier)) {
                throw new Error(`Chat response provider with identifier ${identifier} is already registered.`);
            }
            this._providers.set(identifier, provider);
            this._onDidChangeProviders.fire({ added: [provider.metadata] });
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._providers.delete(identifier)) {
                    this._onDidChangeProviders.fire({ removed: [identifier] });
                }
            });
        }
        makeLanguageModelChatRequest(identifier, from, messages, options, progress, token) {
            const provider = this._providers.get(identifier);
            if (!provider) {
                throw new Error(`Chat response provider with identifier ${identifier} is not registered.`);
            }
            return provider.provideChatResponse(messages, from, options, progress, token);
        }
        computeTokenLength(identifier, message, token) {
            const provider = this._providers.get(identifier);
            if (!provider) {
                throw new Error(`Chat response provider with identifier ${identifier} is not registered.`);
            }
            return provider.provideTokenCount(message, token);
        }
    }
    exports.LanguageModelsService = LanguageModelsService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VNb2RlbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9sYW5ndWFnZU1vZGVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsSUFBa0IsZUFJakI7SUFKRCxXQUFrQixlQUFlO1FBQ2hDLHlEQUFNLENBQUE7UUFDTixxREFBSSxDQUFBO1FBQ0osK0RBQVMsQ0FBQTtJQUNWLENBQUMsRUFKaUIsZUFBZSwrQkFBZixlQUFlLFFBSWhDO0lBK0JZLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qix3QkFBd0IsQ0FBQyxDQUFDO0lBbUJ4RyxNQUFhLHFCQUFxQjtRQUFsQztZQUdrQixlQUFVLEdBQW9DLElBQUksR0FBRyxFQUFFLENBQUM7WUFFeEQsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQWdFLENBQUM7WUFDNUcsOEJBQXlCLEdBQXdFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7UUEyQzVJLENBQUM7UUF6Q0EsT0FBTztZQUNOLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pCLENBQUM7UUFFRCxtQkFBbUI7WUFDbEIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsbUJBQW1CLENBQUMsVUFBa0I7WUFDckMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxRQUFRLENBQUM7UUFDbEQsQ0FBQztRQUVELHlCQUF5QixDQUFDLFVBQWtCLEVBQUUsUUFBNEI7WUFDekUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxVQUFVLHlCQUF5QixDQUFDLENBQUM7WUFDaEcsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRSxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELDRCQUE0QixDQUFDLFVBQWtCLEVBQUUsSUFBeUIsRUFBRSxRQUF3QixFQUFFLE9BQWdDLEVBQUUsUUFBMEMsRUFBRSxLQUF3QjtZQUMzTSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsVUFBVSxxQkFBcUIsQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFDRCxPQUFPLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVELGtCQUFrQixDQUFDLFVBQWtCLEVBQUUsT0FBOEIsRUFBRSxLQUF3QjtZQUM5RixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsVUFBVSxxQkFBcUIsQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFDRCxPQUFPLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkQsQ0FBQztLQUNEO0lBakRELHNEQWlEQyJ9