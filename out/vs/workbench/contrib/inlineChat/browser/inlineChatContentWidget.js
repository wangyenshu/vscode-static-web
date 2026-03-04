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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/base/browser/ui/iconLabel/iconLabels", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatAgents", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/chat/common/chatModel", "vs/editor/common/core/range", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/css!./media/inlineChatContentWidget"], function (require, exports, dom, event_1, lifecycle_1, position_1, iconLabels_1, instantiation_1, inlineChat_1, chatWidget_1, chatAgents_1, colorRegistry_1, chatModel_1, range_1, serviceCollection_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatContentWidget = void 0;
    let InlineChatContentWidget = class InlineChatContentWidget {
        constructor(_editor, instaService, contextKeyService) {
            this._editor = _editor;
            this.suppressMouseDown = false;
            this.allowEditorOverflow = true;
            this._store = new lifecycle_1.DisposableStore();
            this._domNode = document.createElement('div');
            this._inputContainer = document.createElement('div');
            this._messageContainer = document.createElement('div');
            this._onDidBlur = this._store.add(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._visible = false;
            this._focusNext = false;
            this._defaultChatModel = this._store.add(instaService.createInstance(chatModel_1.ChatModel, undefined, chatAgents_1.ChatAgentLocation.Editor));
            const scopedInstaService = instaService.createChild(new serviceCollection_1.ServiceCollection([
                contextkey_1.IContextKeyService,
                this._store.add(contextKeyService.createScoped(this._domNode))
            ]));
            this._widget = scopedInstaService.createInstance(chatWidget_1.ChatWidget, chatAgents_1.ChatAgentLocation.Editor, { resource: true }, {
                defaultElementHeight: 32,
                editorOverflowWidgetsDomNode: _editor.getOverflowWidgetsDomNode(),
                renderStyle: 'compact',
                renderInputOnTop: true,
                renderFollowups: true,
                supportsFileReferences: false,
                menus: {
                    telemetrySource: 'inlineChat-content'
                },
                filter: _item => false
            }, {
                listForeground: colorRegistry_1.editorForeground,
                listBackground: inlineChat_1.inlineChatBackground,
                inputEditorBackground: colorRegistry_1.inputBackground,
                resultEditorBackground: colorRegistry_1.editorBackground
            });
            this._store.add(this._widget);
            this._widget.render(this._inputContainer);
            this._widget.setModel(this._defaultChatModel, {});
            this._store.add(this._widget.inputEditor.onDidContentSizeChange(() => _editor.layoutContentWidget(this)));
            this._domNode.tabIndex = -1;
            this._domNode.className = 'inline-chat-content-widget interactive-session';
            this._domNode.appendChild(this._inputContainer);
            this._messageContainer.classList.add('hidden', 'message');
            this._domNode.appendChild(this._messageContainer);
            const tracker = dom.trackFocus(this._domNode);
            this._store.add(tracker.onDidBlur(() => {
                if (this._visible
                // && !"ON"
                ) {
                    this._onDidBlur.fire();
                }
            }));
            this._store.add(tracker);
        }
        dispose() {
            this._store.dispose();
        }
        getId() {
            return 'inline-chat-content-widget';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            if (!this._position) {
                return null;
            }
            return {
                position: this._position,
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */]
            };
        }
        beforeRender() {
            const maxHeight = this._widget.input.inputEditor.getOption(67 /* EditorOption.lineHeight */) * 5;
            const inputEditorHeight = this._widget.contentHeight;
            this._widget.layout(Math.min(maxHeight, inputEditorHeight), 360);
            // const actualHeight = this._widget.inputPartHeight;
            // return new dom.Dimension(width, actualHeight);
            return null;
        }
        afterRender() {
            if (this._focusNext) {
                this._focusNext = false;
                this._widget.focusInput();
            }
        }
        // ---
        get chatWidget() {
            return this._widget;
        }
        get isVisible() {
            return this._visible;
        }
        get value() {
            return this._widget.inputEditor.getValue();
        }
        show(position) {
            if (!this._visible) {
                this._visible = true;
                this._focusNext = true;
                this._editor.revealRangeNearTopIfOutsideViewport(range_1.Range.fromPositions(position));
                this._widget.inputEditor.setValue('');
                const wordInfo = this._editor.getModel()?.getWordAtPosition(position);
                this._position = wordInfo ? new position_1.Position(position.lineNumber, wordInfo.startColumn) : position;
                this._editor.addContentWidget(this);
                this._widget.setVisible(true);
            }
        }
        hide() {
            if (this._visible) {
                this._visible = false;
                this._editor.removeContentWidget(this);
                this._widget.saveState();
                this._widget.setVisible(false);
            }
        }
        setSession(session) {
            this._widget.setModel(session.chatModel, {});
            this._widget.setInputPlaceholder(session.session.placeholder ?? '');
            this._updateMessage(session.session.message ?? '');
        }
        _updateMessage(message) {
            if (message) {
                const renderedMessage = (0, iconLabels_1.renderLabelWithIcons)(message);
                dom.reset(this._messageContainer, ...renderedMessage);
            }
            this._messageContainer.style.display = message ? 'inherit' : 'none';
            this._editor.layoutContentWidget(this);
        }
    };
    exports.InlineChatContentWidget = InlineChatContentWidget;
    exports.InlineChatContentWidget = InlineChatContentWidget = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService)
    ], InlineChatContentWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdENvbnRlbnRXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdENvbnRlbnRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQXFCbkMsWUFDa0IsT0FBb0IsRUFDZCxZQUFtQyxFQUN0QyxpQkFBcUM7WUFGeEMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQXBCN0Isc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQzFCLHdCQUFtQixHQUFHLElBQUksQ0FBQztZQUVuQixXQUFNLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDL0IsYUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekMsb0JBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hELHNCQUFpQixHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFJbEQsZUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMxRCxjQUFTLEdBQWdCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBRWhELGFBQVEsR0FBWSxLQUFLLENBQUM7WUFDMUIsZUFBVSxHQUFZLEtBQUssQ0FBQztZQVduQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxxQkFBUyxFQUFFLFNBQVMsRUFBRSw4QkFBaUIsQ0FBQyxNQUFNLENB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