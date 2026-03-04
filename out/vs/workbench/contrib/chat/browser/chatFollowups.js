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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes"], function (require, exports, dom, button_1, htmlContent_1, lifecycle_1, nls_1, contextkey_1, chatAgents_1, chatParserTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatFollowups = void 0;
    const $ = dom.$;
    let ChatFollowups = class ChatFollowups extends lifecycle_1.Disposable {
        constructor(container, followups, location, options, clickHandler, contextService, chatAgentService) {
            super();
            this.location = location;
            this.options = options;
            this.clickHandler = clickHandler;
            this.contextService = contextService;
            this.chatAgentService = chatAgentService;
            const followupsContainer = dom.append(container, $('.interactive-session-followups'));
            followups.forEach(followup => this.renderFollowup(followupsContainer, followup));
        }
        renderFollowup(container, followup) {
            if (followup.kind === 'command' && followup.when && !this.contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(followup.when))) {
                return;
            }
            if (!this.chatAgentService.getDefaultAgent(this.location)) {
                // No default agent yet, which affects how followups are rendered, so can't render this yet
                return;
            }
            let tooltipPrefix = '';
            if ('agentId' in followup && followup.agentId && followup.agentId !== this.chatAgentService.getDefaultAgent(this.location)?.id) {
                const agent = this.chatAgentService.getAgent(followup.agentId);
                if (!agent) {
                    // Refers to agent that doesn't exist
                    return;
                }
                tooltipPrefix += `${chatParserTypes_1.chatAgentLeader}${agent.name} `;
                if ('subCommand' in followup && followup.subCommand) {
                    tooltipPrefix += `${chatParserTypes_1.chatSubcommandLeader}${followup.subCommand} `;
                }
            }
            const baseTitle = followup.kind === 'reply' ?
                (followup.title || followup.message)
                : followup.title;
            const tooltip = tooltipPrefix +
                ('tooltip' in followup && followup.tooltip || baseTitle);
            const button = this._register(new button_1.Button(container, { ...this.options, supportIcons: true, title: tooltip }));
            if (followup.kind === 'reply') {
                button.element.classList.add('interactive-followup-reply');
            }
            else if (followup.kind === 'command') {
                button.element.classList.add('interactive-followup-command');
            }
            button.element.ariaLabel = (0, nls_1.localize)('followUpAriaLabel', "Follow up question: {0}", followup.title);
            let label = '';
            if (followup.kind === 'reply') {
                label = '$(sparkle) ' + baseTitle;
            }
            else {
                label = baseTitle;
            }
            button.label = new htmlContent_1.MarkdownString(label, { supportThemeIcons: true });
            this._register(button.onDidClick(() => this.clickHandler(followup)));
        }
    };
    exports.ChatFollowups = ChatFollowups;
    exports.ChatFollowups = ChatFollowups = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, chatAgents_1.IChatAgentService)
    ], ChatFollowups);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEZvbGxvd3Vwcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0Rm9sbG93dXBzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRVQsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBNkQsU0FBUSxzQkFBVTtRQUMzRixZQUNDLFNBQXNCLEVBQ3RCLFNBQWMsRUFDRyxRQUEyQixFQUMzQixPQUFrQyxFQUNsQyxZQUFtQyxFQUNmLGNBQWtDLEVBQ25DLGdCQUFtQztZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQU5TLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQzNCLFlBQU8sR0FBUCxPQUFPLENBQTJCO1lBQ2xDLGlCQUFZLEdBQVosWUFBWSxDQUF1QjtZQUNmLG1CQUFjLEdBQWQsY0FBYyxDQUFvQjtZQUNuQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBSXZFLE1BQU0sa0JBQWtCLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztZQUN0RixTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2xGLENBQUM7UUFFTyxjQUFjLENBQUMsU0FBc0IsRUFBRSxRQUFXO1lBRXpELElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsMkJBQWMsQ0FBQyxXQUFX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