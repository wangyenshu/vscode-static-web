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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/themables", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/workbench/contrib/extensions/common/extensions"], function (require, exports, dom, dom_1, button_1, iconLabels_1, cancellation_1, lifecycle_1, network_1, themables_1, uri_1, nls_1, commands_1, chatAgents_1, extensionsActions_1, extensionsIcons_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatAgentHover = void 0;
    let ChatAgentHover = class ChatAgentHover extends lifecycle_1.Disposable {
        constructor(chatAgentService, extensionService, commandService) {
            super();
            this.chatAgentService = chatAgentService;
            this.extensionService = extensionService;
            this.commandService = commandService;
            const hoverElement = (0, dom_1.h)('.chat-agent-hover@root', [
                (0, dom_1.h)('.chat-agent-hover-header', [
                    (0, dom_1.h)('.chat-agent-hover-icon@icon'),
                    (0, dom_1.h)('.chat-agent-hover-details', [
                        (0, dom_1.h)('.chat-agent-hover-name@name'),
                        (0, dom_1.h)('.chat-agent-hover-extension', [
                            (0, dom_1.h)('.chat-agent-hover-extension-name@extensionName'),
                            (0, dom_1.h)('.chat-agent-hover-separator@separator'),
                            (0, dom_1.h)('.chat-agent-hover-publisher@publisher'),
                        ]),
                    ]),
                ]),
                (0, dom_1.h)('span.chat-agent-hover-description@description'),
                (0, dom_1.h)('span.chat-agent-hover-marketplace-button@button'),
            ]);
            this.domNode = hoverElement.root;
            this.icon = hoverElement.icon;
            this.name = hoverElement.name;
            this.extensionName = hoverElement.extensionName;
            this.description = hoverElement.description;
            hoverElement.separator.textContent = '|';
            this.verifiedBadge = dom.$('span.extension-verified-publisher', undefined, (0, iconLabels_1.renderIcon)(extensionsIcons_1.verifiedPublisherIcon));
            this.verifiedBadge.style.display = 'none';
            this.publisherName = dom.$('span.chat-agent-hover-publisher-name');
            dom.append(hoverElement.publisher, this.verifiedBadge, this.publisherName);
            const label = (0, nls_1.localize)('marketplaceLabel', "View in Marketplace") + '.';
            const marketplaceButton = this._register(new button_1.Button(hoverElement.button, {
                title: label,
                buttonBackground: undefined,
                buttonBorder: undefined,
                buttonForeground: undefined,
                buttonHoverBackground: undefined,
                buttonSecondaryBackground: undefined,
                buttonSecondaryForeground: undefined,
                buttonSecondaryHoverBackground: undefined,
                buttonSeparator: undefined,
            }));
            marketplaceButton.label = label;
            this._register(marketplaceButton.onDidClick(() => {
                if (this.currentAgent) {
                    this.commandService.executeCommand(extensionsActions_1.showExtensionsWithIdsCommandId, [this.currentAgent.extensionId.value]);
                }
            }));
        }
        setAgent(id) {
            const agent = this.chatAgentService.getAgent(id);
            this.currentAgent = agent;
            if (agent.metadata.icon instanceof uri_1.URI) {
                const avatarIcon = dom.$('img.icon');
                avatarIcon.src = network_1.FileAccess.uriToBrowserUri(agent.metadata.icon).toString(true);
                this.icon.replaceChildren(dom.$('.avatar', undefined, avatarIcon));
            }
            else if (agent.metadata.themeIcon) {
                const avatarIcon = dom.$(themables_1.ThemeIcon.asCSSSelector(agent.metadata.themeIcon));
                this.icon.replaceChildren(dom.$('.avatar.codicon-avatar', undefined, avatarIcon));
            }
            this.name.textContent = `@${agent.name}`;
            this.extensionName.textContent = agent.extensionDisplayName;
            this.publisherName.textContent = agent.extensionPublisherDisplayName ?? agent.extensionPublisherId;
            const description = agent.description && !agent.description.endsWith('.') ?
                `${agent.description}. ` :
                (agent.description || '');
            this.description.textContent = description;
            const cancel = this._register(new cancellation_1.CancellationTokenSource());
            this.extensionService.getExtensions([{ id: agent.extensionId.value }], cancel.token).then(extensions => {
                cancel.dispose();
                const extension = extensions[0];
                if (extension?.publisherDomain?.verified) {
                    this.verifiedBadge.style.display = '';
                }
            });
        }
    };
    exports.ChatAgentHover = ChatAgentHover;
    exports.ChatAgentHover = ChatAgentHover = __decorate([
        __param(0, chatAgents_1.IChatAgentService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, commands_1.ICommandService)
    ], ChatAgentHover);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFnZW50SG92ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY2hhdEFnZW50SG92ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVU7UUFZN0MsWUFDcUMsZ0JBQW1DLEVBQ3pCLGdCQUE2QyxFQUN6RCxjQUErQjtZQUVqRSxLQUFLLEVBQUUsQ0FBQztZQUo0QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3pCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBNkI7WUFDekQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBSWpFLE1BQU0sWUFBWSxHQUFHLElBQUEsT0FBQyxFQUNyQix3QkFBd0IsRUFDeEI7Z0JBQ0MsSUFBQSxPQUFDLEVBQUMsMEJBQTBCLEVBQUU7b0JBQzdCLElBQUEsT0FBQyxFQUFDLDZCQUE2QixDQUFDO29CQUNoQyxJQUFBLE9BQUMsRUFBQywyQkFBMkIsRUFBRTt3QkFDOUIsSUFBQSxPQUFDLEVBQUMsNkJBQTZCLENBQUM7d0JBQ2hDLElBQUEsT0FBQyxFQUFDLDZCQUE2QixFQUFFOzRCQUNoQyxJQUFBLE9BQUMsRUFBQyxnREFBZ0QsQ0FBQzs0QkFDbkQsSUFBQSxPQUFDLEVBQUMsdUNBQXVDLENBQUM7NEJBQzFDLElBQUEsT0FBQyxFQUFDLHVDQUF1QyxDQUFDO3lCQUMxQyxDQUFDO3FCQUNGLENBQUM7aUJBQ0YsQ0FBQztnQkFDRixJQUFBLE9BQUMsRUFBQywrQ0FBK0MsQ0FBQztnQkFDbEQsSUFBQSxPQUFDLEVBQUMsaURBQWlELENBQUM7YUFDcEQsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDO1lBRWpDLElBQUksQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQztZQUM5QixJQUFJLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDO1lBQ2hELElBQUksQ0FBQyxXQUFXLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQztZQUU1QyxZQUFZLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7WUFFekMsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLG1DQUFtQyxFQUFFLFNBQVMsRUFBRSxJQUFBLHVCQUFVLEVBQUMsdUNBQXFCLENBQUMsQ0FBQyxDQUFDO1lBQzlHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFMUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFDbkUsR0FBRyxDQUFDLE1BQU0sQ0FDVCxZQUFZLENBQUMsU0FBUyxFQUN0QixJQUFJLENBQUMsYUFBYSxFQUNsQixJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFckIsTUFBTSxLQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUscUJBQXFCLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDeEUsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUU7Z0JBQ3hFLEtBQUssRUFBRSxLQUFLO2dCQUNaLGdCQUFnQixFQUFFLFNBQVM7Z0JBQzNCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixnQkFBZ0IsRUFBRSxTQUFTO2dCQUMzQixxQkFBcUIsRUFBRSxTQUFTO2dCQUNoQyx5QkFBeUIsRUFBRSxTQUFTO2dCQUNwQyx5QkFBeUIsRUFBRSxTQUFTO2dCQUNwQyw4QkFBOEIsRUFBRSxTQUFTO2dCQUN6QyxlQUFlLEVBQUUsU0FBUzthQUMxQixDQUFDLENBQUMsQ0FBQztZQUNKLGlCQUFpQixDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNoRCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsa0RBQThCLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMzRyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxRQUFRLENBQUMsRUFBVTtZQUNsQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBRSxDQUFDO1lBQ2xELElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBRTFCLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFlBQVksU0FBRyxFQUFFLENBQUM7Z0JBQ3hDLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQW1CLFVBQVUsQ0FBQyxDQUFDO2dCQUN2RCxVQUFVLENBQUMsR0FBRyxHQUFHLG9CQUFVLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoRixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRSxDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxxQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVFLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQztZQUM1RCxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsNkJBQTZCLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDO1lBRW5HLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxHQUFHLEtBQUssQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDO2dCQUMxQixDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBRTNDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUN0RyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxTQUFTLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxDQUFDO29CQUMxQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUN2QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQXpHWSx3Q0FBYzs2QkFBZCxjQUFjO1FBYXhCLFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSx3Q0FBMkIsQ0FBQTtRQUMzQixXQUFBLDBCQUFlLENBQUE7T0FmTCxjQUFjLENBeUcxQiJ9