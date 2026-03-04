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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/contrib/comments/browser/commentFormActions", "vs/platform/keybinding/common/keybinding"], function (require, exports, dom, lifecycle_1, commentFormActions_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadAdditionalActions = void 0;
    let CommentThreadAdditionalActions = class CommentThreadAdditionalActions extends lifecycle_1.Disposable {
        constructor(container, _commentThread, _contextKeyService, _commentMenus, _actionRunDelegate, _keybindingService) {
            super();
            this._commentThread = _commentThread;
            this._contextKeyService = _contextKeyService;
            this._commentMenus = _commentMenus;
            this._actionRunDelegate = _actionRunDelegate;
            this._keybindingService = _keybindingService;
            this._container = dom.append(container, dom.$('.comment-additional-actions'));
            dom.append(this._container, dom.$('.section-separator'));
            this._buttonBar = dom.append(this._container, dom.$('.button-bar'));
            this._createAdditionalActions(this._buttonBar);
        }
        _showMenu() {
            this._container?.classList.remove('hidden');
        }
        _hideMenu() {
            this._container?.classList.add('hidden');
        }
        _enableDisableMenu(menu) {
            const groups = menu.getActions({ shouldForwardArgs: true });
            // Show the menu if at least one action is enabled.
            for (const group of groups) {
                const [, actions] = group;
                for (const action of actions) {
                    if (action.enabled) {
                        this._showMenu();
                        return;
                    }
                    for (const subAction of action.actions ?? []) {
                        if (subAction.enabled) {
                            this._showMenu();
                            return;
                        }
                    }
                }
            }
            this._hideMenu();
        }
        _createAdditionalActions(container) {
            const menu = this._commentMenus.getCommentThreadAdditionalActions(this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(() => {
                this._commentFormActions.setActions(menu, /*hasOnlySecondaryActions*/ true);
                this._enableDisableMenu(menu);
            }));
            this._commentFormActions = new commentFormActions_1.CommentFormActions(this._keybindingService, this._contextKeyService, container, async (action) => {
                this._actionRunDelegate?.();
                action.run({
                    thread: this._commentThread,
                    $mid: 8 /* MarshalledId.CommentThreadInstance */
                });
            }, 4);
            this._register(this._commentFormActions);
            this._commentFormActions.setActions(menu, /*hasOnlySecondaryActions*/ true);
            this._enableDisableMenu(menu);
        }
    };
    exports.CommentThreadAdditionalActions = CommentThreadAdditionalActions;
    exports.CommentThreadAdditionalActions = CommentThreadAdditionalActions = __decorate([
        __param(5, keybinding_1.IKeybindingService)
    ], CommentThreadAdditionalActions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFRocmVhZEFkZGl0aW9uYWxBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50VGhyZWFkQWRkaXRpb25hbEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUE4RCxTQUFRLHNCQUFVO1FBSzVGLFlBQ0MsU0FBc0IsRUFDZCxjQUEwQyxFQUMxQyxrQkFBc0MsRUFDdEMsYUFBMkIsRUFDM0Isa0JBQXVDLEVBQ25CLGtCQUFzQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQU5BLG1CQUFjLEdBQWQsY0FBYyxDQUE0QjtZQUMxQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3RDLGtCQUFhLEdBQWIsYUFBYSxDQUFjO1lBQzNCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDbkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUlsRSxJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO1lBQzlFLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUV6RCxJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxVQUFV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