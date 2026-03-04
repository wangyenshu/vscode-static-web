/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls"], function (require, exports, event_1, lifecycle_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptySubmenuAction = exports.SubmenuAction = exports.Separator = exports.ActionRunner = exports.Action = void 0;
    exports.toAction = toAction;
    class Action extends lifecycle_1.Disposable {
        constructor(id, label = '', cssClass = '', enabled = true, actionCallback) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._enabled = true;
            this._id = id;
            this._label = label;
            this._cssClass = cssClass;
            this._enabled = enabled;
            this._actionCallback = actionCallback;
        }
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        set label(value) {
            this._setLabel(value);
        }
        _setLabel(value) {
            if (this._label !== value) {
                this._label = value;
                this._onDidChange.fire({ label: value });
            }
        }
        get tooltip() {
            return this._tooltip || '';
        }
        set tooltip(value) {
            this._setTooltip(value);
        }
        _setTooltip(value) {
            if (this._tooltip !== value) {
                this._tooltip = value;
                this._onDidChange.fire({ tooltip: value });
            }
        }
        get class() {
            return this._cssClass;
        }
        set class(value) {
            this._setClass(value);
        }
        _setClass(value) {
            if (this._cssClass !== value) {
                this._cssClass = value;
                this._onDidChange.fire({ class: value });
            }
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(value) {
            this._setEnabled(value);
        }
        _setEnabled(value) {
            if (this._enabled !== value) {
                this._enabled = value;
                this._onDidChange.fire({ enabled: value });
            }
        }
        get checked() {
            return this._checked;
        }
        set checked(value) {
            this._setChecked(value);
        }
        _setChecked(value) {
            if (this._checked !== value) {
                this._checked = value;
                this._onDidChange.fire({ checked: value });
            }
        }
        async run(event, data) {
            if (this._actionCallback) {
                await this._actionCallback(event);
            }
        }
    }
    exports.Action = Action;
    class ActionRunner extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onWillRun = this._register(new event_1.Emitter());
            this.onWillRun = this._onWillRun.event;
            this._onDidRun = this._register(new event_1.Emitter());
            this.onDidRun = this._onDidRun.event;
        }
        async run(action, context) {
            if (!action.enabled) {
                return;
            }
            this._onWillRun.fire({ action });
            let error = undefined;
            try {
                await this.runAction(action, context);
            }
            catch (e) {
                error = e;
            }
            this._onDidRun.fire({ action, error });
        }
        async runAction(action, context) {
            await action.run(context);
        }
    }
    exports.ActionRunner = ActionRunner;
    class Separator {
        constructor() {
            this.id = Separator.ID;
            this.label = '';
            this.tooltip = '';
            this.class = 'separator';
            this.enabled = false;
            this.checked = false;
        }
        /**
         * Joins all non-empty lists of actions with separators.
         */
        static join(...actionLists) {
            let out = [];
            for (const list of actionLists) {
                if (!list.length) {
                    // skip
                }
                else if (out.length) {
                    out = [...out, new Separator(), ...list];
                }
                else {
                    out = list;
                }
            }
            return out;
        }
        static { this.ID = 'vs.actions.separator'; }
        async run() { }
    }
    exports.Separator = Separator;
    class SubmenuAction {
        get actions() { return this._actions; }
        constructor(id, label, actions, cssClass) {
            this.tooltip = '';
            this.enabled = true;
            this.checked = undefined;
            this.id = id;
            this.label = label;
            this.class = cssClass;
            this._actions = actions;
        }
        async run() { }
    }
    exports.SubmenuAction = SubmenuAction;
    class EmptySubmenuAction extends Action {
        static { this.ID = 'vs.actions.empty'; }
        constructor() {
            super(EmptySubmenuAction.ID, nls.localize('submenu.empty', '(empty)'), undefined, false);
        }
    }
    exports.EmptySubmenuAction = EmptySubmenuAction;
    function toAction(props) {
        return {
            id: props.id,
            label: props.label,
            class: props.class,
            enabled: props.enabled ?? true,
            checked: props.checked,
            run: async (...args) => props.run(...args),
            tooltip: props.label
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaVFoRyw0QkFVQztJQXhORCxNQUFhLE1BQU8sU0FBUSxzQkFBVTtRQWFyQyxZQUFZLEVBQVUsRUFBRSxRQUFnQixFQUFFLEVBQUUsV0FBbUIsRUFBRSxFQUFFLFVBQW1CLElBQUksRUFBRSxjQUE2QztZQUN4SSxLQUFLLEVBQUUsQ0FBQztZQVpDLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBc0IsQ0FBQyxDQUFDO1lBQ2xFLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFNckMsYUFBUSxHQUFZLElBQUksQ0FBQztZQU1sQyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxlQUFlLEdBQUcsY0FBYyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxJQUFJLEVBQUU7WUFDTCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsSUFBSSxLQUFLLENBQUMsS0FBYTtZQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFFTyxTQUFTLENBQUMsS0FBYTtZQUM5QixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFF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