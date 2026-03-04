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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/workbench/contrib/chat/browser/chatAgentHover", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "../common/annotations", "vs/platform/hover/browser/hover", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, dom, errorMessage_1, lifecycle_1, marshalling_1, uri_1, instantiation_1, keybinding_1, label_1, log_1, chatAgentHover_1, chatAgents_1, chatParserTypes_1, annotations_1, hover_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatMarkdownDecorationsRenderer = void 0;
    const variableRefUrl = 'http://_vscodedecoration_';
    const agentRefUrl = 'http://_chatagent_';
    let ChatMarkdownDecorationsRenderer = class ChatMarkdownDecorationsRenderer {
        constructor(keybindingService, labelService, logService, chatAgentService, instantiationService, hoverService) {
            this.keybindingService = keybindingService;
            this.labelService = labelService;
            this.logService = logService;
            this.chatAgentService = chatAgentService;
            this.instantiationService = instantiationService;
            this.hoverService = hoverService;
        }
        convertParsedRequestToMarkdown(parsedRequest) {
            let result = '';
            for (const part of parsedRequest.parts) {
                if (part instanceof chatParserTypes_1.ChatRequestTextPart) {
                    result += part.text;
                }
                else if (part instanceof chatParserTypes_1.ChatRequestAgentPart) {
                    let text = part.text;
                    const isDupe = this.chatAgentService.getAgentsByName(part.agent.name).length > 1;
                    if (isDupe) {
                        text += ` (${part.agent.extensionPublisherDisplayName})`;
                    }
                    result += `[${text}](${agentRefUrl}?${encodeURIComponent(part.agent.id)})`;
                }
                else {
                    const uri = part instanceof chatParserTypes_1.ChatRequestDynamicVariablePart && part.data.map(d => d.value).find((d) => d instanceof uri_1.URI)
                        || undefined;
                    const title = uri ? encodeURIComponent(this.labelService.getUriLabel(uri, { relative: true })) :
                        part instanceof chatParserTypes_1.ChatRequestAgentPart ? part.agent.id :
                            '';
                    const text = part.text;
                    result += `[${text}](${variableRefUrl}?${title})`;
                }
            }
            return result;
        }
        walkTreeAndAnnotateReferenceLinks(element) {
            const store = new lifecycle_1.DisposableStore();
            element.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('data-href');
                if (href) {
                    if (href.startsWith(agentRefUrl)) {
                        const title = decodeURIComponent(href.slice(agentRefUrl.length + 1));
                        a.parentElement.replaceChild(this.renderAgentWidget(a.textContent, title, store), a);
                    }
                    else if (href.startsWith(variableRefUrl)) {
                        const title = decodeURIComponent(href.slice(variableRefUrl.length + 1));
                        a.parentElement.replaceChild(this.renderResourceWidget(a.textContent, title), a);
                    }
                    else if (href.startsWith(annotations_1.contentRefUrl)) {
                        this.renderFileWidget(href, a);
                    }
                    else if (href.startsWith('command:')) {
                        this.injectKeybindingHint(a, href, this.keybindingService);
                    }
                }
            });
            return store;
        }
        renderAgentWidget(name, id, store) {
            const container = dom.$('span.chat-resource-widget', undefined, dom.$('span', undefined, name));
            store.add(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), container, () => {
                const hover = store.add(this.instantiationService.createInstance(chatAgentHover_1.ChatAgentHover));
                hover.setAgent(id);
                return hover.domNode;
            }));
            return container;
        }
        renderFileWidget(href, a) {
            // TODO this can be a nicer FileLabel widget with an icon. Do a simple link for now.
            const fullUri = uri_1.URI.parse(href);
            let location;
            try {
                location = (0, marshalling_1.revive)(JSON.parse(fullUri.fragment));
            }
            catch (err) {
                this.logService.error('Invalid chat widget render data JSON', (0, errorMessage_1.toErrorMessage)(err));
                return;
            }
            if (!location.uri || !uri_1.URI.isUri(location.uri)) {
                this.logService.error(`Invalid chat widget render data: ${fullUri.fragment}`);
                return;
            }
            const fragment = location.range ? `${location.range.startLineNumber}-${location.range.endLineNumber}` : '';
            a.setAttribute('data-href', location.uri.with({ fragment }).toString());
            const label = this.labelService.getUriLabel(location.uri, { relative: true });
            a.title = location.range ?
                `${label}#${location.range.startLineNumber}-${location.range.endLineNumber}` :
                label;
        }
        renderResourceWidget(name, title) {
            const container = dom.$('span.chat-resource-widget');
            const alias = dom.$('span', undefined, name);
            alias.title = title;
            container.appendChild(alias);
            return container;
        }
        injectKeybindingHint(a, href, keybindingService) {
            const command = href.match(/command:([^\)]+)/)?.[1];
            if (command) {
                const kb = keybindingService.lookupKeybinding(command);
                if (kb) {
                    const keybinding = kb.getLabel();
                    if (keybinding) {
                        a.textContent = `${a.textContent} (${keybinding})`;
                    }
                }
            }
        }
    };
    exports.ChatMarkdownDecorationsRenderer = ChatMarkdownDecorationsRenderer;
    exports.ChatMarkdownDecorationsRenderer = ChatMarkdownDecorationsRenderer = __decorate([
        __param(0, keybinding_1.IKeybindingService),
        __param(1, label_1.ILabelService),
        __param(2, log_1.ILogService),
        __param(3, chatAgents_1.IChatAgentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, hover_1.IHoverService)
    ], ChatMarkdownDecorationsRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE1hcmtkb3duRGVjb3JhdGlvbnNSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0TWFya2Rvd25EZWNvcmF0aW9uc1JlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CaEcsTUFBTSxjQUFjLEdBQUcsMkJBQTJCLENBQUM7SUFDbkQsTUFBTSxXQUFXLEdBQUcsb0JBQW9CLENBQUM7SUFFbEMsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBK0I7UUFDM0MsWUFDc0MsaUJBQXFDLEVBQzFDLFlBQTJCLEVBQzdCLFVBQXVCLEVBQ2pCLGdCQUFtQyxFQUMvQixvQkFBMkMsRUFDbkQsWUFBMkI7WUFMdEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMxQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUM3QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2pCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDL0IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtRQUN4RCxDQUFDO1FBRUwsOEJBQThCLENBQUMsYUFBaUM7WUFDL0QsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLEtBQUssTUFBTSxJQUFJLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN4QyxJQUFJLElBQUksWUFBWSxxQ0FBbUIsRUFBRSxDQUFDO29CQUN6QyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDckIsQ0FBQztxQkFBTSxJQUFJLElBQUksWUFBWSxzQ0FBb0IsRUFBRSxDQUFDO29CQUNqRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMs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