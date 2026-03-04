/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/uri", "vs/base/browser/ui/actionbar/actionViewItems"], function (require, exports, nls, dom, actions_1, uri_1, actionViewItems_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReactionAction = exports.ReactionActionViewItem = exports.ToggleReactionsAction = void 0;
    class ToggleReactionsAction extends actions_1.Action {
        static { this.ID = 'toolbar.toggle.pickReactions'; }
        constructor(toggleDropdownMenu, title) {
            super(ToggleReactionsAction.ID, title || nls.localize('pickReactions', "Pick Reactions..."), 'toggle-reactions', true);
            this._menuActions = [];
            this.toggleDropdownMenu = toggleDropdownMenu;
        }
        run() {
            this.toggleDropdownMenu();
            return Promise.resolve(true);
        }
        get menuActions() {
            return this._menuActions;
        }
        set menuActions(actions) {
            this._menuActions = actions;
        }
    }
    exports.ToggleReactionsAction = ToggleReactionsAction;
    class ReactionActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action) {
            super(null, action, {});
        }
        updateLabel() {
            if (!this.label) {
                return;
            }
            const action = this.action;
            if (action.class) {
                this.label.classList.add(action.class);
            }
            if (!action.icon) {
                const reactionLabel = dom.append(this.label, dom.$('span.reaction-label'));
                reactionLabel.innerText = action.label;
            }
            else {
                const reactionIcon = dom.append(this.label, dom.$('.reaction-icon'));
                const uri = uri_1.URI.revive(action.icon);
                reactionIcon.style.backgroundImage = dom.asCSSUrl(uri);
            }
            if (action.count) {
                const reactionCount = dom.append(this.label, dom.$('span.reaction-count'));
                reactionCount.innerText = `${action.count}`;
            }
        }
        getTooltip() {
            const action = this.action;
            const toggleMessage = action.enabled ? nls.localize('comment.toggleableReaction', "Toggle reaction, ") : '';
            if (action.count === undefined) {
                return nls.localize({
                    key: 'comment.reactionLabelNone', comment: [
                        'This is a tooltip for an emoji button so that the current user can toggle their reaction to a comment.',
                        'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second is the name of the reaction.'
                    ]
                }, "{0}{1} reaction", toggleMessage, action.label);
            }
            else if (action.reactors === undefined || action.reactors.length === 0) {
                if (action.count === 1) {
                    return nls.localize({
                        key: 'comment.reactionLabelOne', comment: [
                            'This is a tooltip for an emoji that is a "reaction" to a comment where the count of the reactions is 1.',
                            'The emoji is also a button so that the current user can also toggle their own emoji reaction.',
                            'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second is the name of the reaction.'
                        ]
                    }, "{0}1 reaction with {1}", toggleMessage, action.label);
                }
                else if (action.count > 1) {
                    return nls.localize({
                        key: 'comment.reactionLabelMany', comment: [
                            'This is a tooltip for an emoji that is a "reaction" to a comment where the count of the reactions is greater than 1.',
                            'The emoji is also a button so that the current user can also toggle their own emoji reaction.',
                            'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second is number of users who have reacted with that reaction, and the third is the name of the reaction.'
                        ]
                    }, "{0}{1} reactions with {2}", toggleMessage, action.count, action.label);
                }
            }
            else {
                if (action.reactors.length <= 10 && action.reactors.length === action.count) {
                    return nls.localize({
                        key: 'comment.reactionLessThanTen', comment: [
                            'This is a tooltip for an emoji that is a "reaction" to a comment where the count of the reactions is less than or equal to 10.',
                            'The emoji is also a button so that the current user can also toggle their own emoji reaction.',
                            'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second iis a list of the reactors, and the third is the name of the reaction.'
                        ]
                    }, "{0}{1} reacted with {2}", toggleMessage, action.reactors.join(', '), action.label);
                }
                else if (action.count > 1) {
                    const displayedReactors = action.reactors.slice(0, 10);
                    return nls.localize({
                        key: 'comment.reactionMoreThanTen', comment: [
                            'This is a tooltip for an emoji that is a "reaction" to a comment where the count of the reactions is less than or equal to 10.',
                            'The emoji is also a button so that the current user can also toggle their own emoji reaction.',
                            'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second iis a list of the reactors, and the third is the name of the reaction.'
                        ]
                    }, "{0}{1} and {2} more reacted with {3}", toggleMessage, displayedReactors.join(', '), action.count - displayedReactors.length, action.label);
                }
            }
            return undefined;
        }
    }
    exports.ReactionActionViewItem = ReactionActionViewItem;
    class ReactionAction extends actions_1.Action {
        static { this.ID = 'toolbar.toggle.reaction'; }
        constructor(id, label = '', cssClass = '', enabled = true, actionCallback, reactors, icon, count) {
            super(ReactionAction.ID, label, cssClass, enabled, actionCallback);
            this.reactors = reactors;
            this.icon = icon;
            this.count = count;
        }
    }
    exports.ReactionAction = ReactionAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3Rpb25zQWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9yZWFjdGlvbnNBY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEscUJBQXNCLFNBQVEsZ0JBQU07aUJBQ2hDLE9BQUUsR0FBRyw4QkFBOEIsQUFBakMsQ0FBa0M7UUFHcEQsWUFBWSxrQkFBOEIsRUFBRSxLQUFjO1lBQ3pELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLG1CQUFtQixDQUFDLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFIaEgsaUJBQVksR0FBYyxFQUFFLENBQUM7WUFJcEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO1FBQzlDLENBQUM7UUFDUSxHQUFHO1lBQ1gsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDMUIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFDRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUNELElBQUksV0FBVyxDQUFDLE9BQWtCO1lBQ2pDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDO1FBQzdCLENBQUM7O0lBakJGLHNEQWtCQztJQUNELE1BQWEsc0JBQXVCLFNBQVEsZ0NBQWM7UUFDekQsWUFBWSxNQUFzQjtZQUNqQyxLQUFLLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBQ2tCLFdBQVc7WUFDN0IsSUFBSSxDQUFDLElB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