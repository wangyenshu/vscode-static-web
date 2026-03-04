/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/css!./dialog"], function (require, exports, dom_1, keyboardEvent_1, actionbar_1, button_1, toggle_1, inputBox_1, actions_1, codicons_1, themables_1, labels_1, lifecycle_1, platform_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Dialog = void 0;
    class Dialog extends lifecycle_1.Disposable {
        constructor(container, message, buttons, options) {
            super();
            this.container = container;
            this.message = message;
            this.options = options;
            this.modalElement = this.container.appendChild((0, dom_1.$)(`.monaco-dialog-modal-block.dimmed`));
            this.shadowElement = this.modalElement.appendChild((0, dom_1.$)('.dialog-shadow'));
            this.element = this.shadowElement.appendChild((0, dom_1.$)('.monaco-dialog-box'));
            this.element.setAttribute('role', 'dialog');
            this.element.tabIndex = -1;
            (0, dom_1.hide)(this.element);
            this.buttonStyles = options.buttonStyles;
            if (Array.isArray(buttons) && buttons.length > 0) {
                this.buttons = buttons;
            }
            else if (!this.options.disableDefaultAction) {
                this.buttons = [nls.localize('ok', "OK")];
            }
            else {
                this.buttons = [];
            }
            const buttonsRowElement = this.element.appendChild((0, dom_1.$)('.dialog-buttons-row'));
            this.buttonsContainer = buttonsRowElement.appendChild((0, dom_1.$)('.dialog-buttons'));
            const messageRowElement = this.element.appendChild((0, dom_1.$)('.dialog-message-row'));
            this.iconElement = messageRowElement.appendChild((0, dom_1.$)('#monaco-dialog-icon.dialog-icon'));
            this.iconElement.setAttribute('aria-label', this.getIconAriaLabel());
            this.messageContainer = messageRowElement.appendChild((0, dom_1.$)('.dialog-message-container'));
            if (this.options.detail || this.options.renderBody) {
                const messageElement = this.messageContainer.appendChild((0, dom_1.$)('.dialog-message'));
                const messageTextElement = messageElement.appendChild((0, dom_1.$)('#monaco-dialog-message-text.dialog-message-text'));
                messageTextElement.innerText = this.message;
            }
            this.messageDetailElement = this.messageContainer.appendChild((0, dom_1.$)('#monaco-dialog-message-detail.dialog-message-detail'));
            if (this.options.detail || !this.options.renderBody) {
                this.messageDetailElement.innerText = this.options.detail ? this.options.detail : message;
            }
            else {
                this.messageDetailElement.style.display = 'none';
            }
            if (this.options.renderBody) {
                const customBody = this.messageContainer.appendChild((0, dom_1.$)('#monaco-dialog-message-body.dialog-message-body'));
                this.options.renderBody(customBody);
                for (const el of this.messageContainer.querySelectorAll('a')) {
                    el.tabIndex = 0;
                }
            }
            if (this.options.inputs) {
                this.inputs = this.options.inputs.map(input => {
                    const inputRowElement = this.messageContainer.appendChild((0, dom_1.$)('.dialog-message-input'));
                    const inputBox = this._register(new inputBox_1.InputBox(inputRowElement, undefined, {
                        placeholder: input.placeholder,
                        type: input.type ?? 'text',
                        inputBoxStyles: options.inputBoxStyles
                    }));
                    if (input.value) {
                        inputBox.value = input.value;
                    }
                    return inputBox;
                });
            }
            else {
                this.inputs = [];
            }
            if (this.options.checkboxLabel) {
                const checkboxRowElement = this.messageContainer.appendChild((0, dom_1.$)('.dialog-checkbox-row'));
                const checkbox = this.checkbox = this._register(new toggle_1.Checkbox(this.options.checkboxLabel, !!this.options.checkboxChecked, options.checkboxStyles));
                checkboxRowElement.appendChild(checkbox.domNode);
                const checkboxMessageElement = checkboxRowElement.appendChild((0, dom_1.$)('.dialog-checkbox-message'));
                checkboxMessageElement.innerText = this.options.checkboxLabel;
                this._register((0, dom_1.addDisposableListener)(checkboxMessageElement, dom_1.EventType.CLICK, () => checkbox.checked = !checkbox.checked));
            }
            const toolbarRowElement = this.element.appendChild((0, dom_1.$)('.dialog-toolbar-row'));
            this.toolbarContainer = toolbarRowElement.appendChild((0, dom_1.$)('.dialog-toolbar'));
            this.applyStyles();
        }
        getIconAriaLabel() {
            let typeLabel = nls.localize('dialogInfoMessage', 'Info');
            switch (this.options.type) {
                case 'error':
                    typeLabel = nls.localize('dialogErrorMessage', 'Error');
                    break;
                case 'warning':
                    typeLabel = nls.localize('dialogWarningMessage', 'Warning');
                    break;
                case 'pending':
                    typeLabel = nls.localize('dialogPendingMessage', 'In Progress');
                    break;
                case 'none':
                case 'info':
                case 'question':
                default:
                    break;
            }
            return typeLabel;
        }
        updateMessage(message) {
            this.messageDetailElement.innerText = message;
        }
        async show() {
            this.focusToReturn = this.container.ownerDocument.activeElement;
            return new Promise((resolve) => {
                (0, dom_1.clearNode)(this.buttonsContainer);
                const buttonBar = this.buttonBar = this._register(new button_1.ButtonBar(this.buttonsContainer));
                const buttonMap = this.rearrangeButtons(this.buttons, this.options.cancelId);
                // Handle button clicks
                buttonMap.forEach((entry, index) => {
                    const primary = buttonMap[index].index === 0;
                    const button = this.options.buttonDetails ? this._register(buttonBar.addButtonWithDescription({ title: true, secondary: !primary, ...this.buttonStyles })) : this._register(buttonBar.addButton({ title: true, secondary: !primary, ...this.buttonStyles }));
                    button.label = (0, labels_1.mnemonicButtonLabel)(buttonMap[index].label, true);
                    if (button instanceof button_1.ButtonWithDescription) {
                        button.description = this.options.buttonDetails[buttonMap[index].index];
                    }
                    this._register(button.onDidClick(e => {
                        if (e) {
                            dom_1.EventHelper.stop(e);
                        }
                        resolve({
                            button: buttonMap[index].index,
                            checkboxChecked: this.checkbox ? this.checkbox.checked : undefined,
                            values: this.inputs.length > 0 ? this.inputs.map(input => input.value) : undefined
                        });
                    }));
                });
                // Handle keyboard events globally: Tab, Arrow-Left/Right
                const window = (0, dom_1.getWindow)(this.container);
                this._register((0, dom_1.addDisposableListener)(window, 'keydown', e => {
                    const evt = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (evt.equals(512 /* KeyMod.Alt */)) {
                        evt.preventDefault();
                    }
                    if (evt.equals(3 /* KeyCode.Enter */)) {
                        // Enter in input field should OK the dialog
                        if (this.inputs.some(input => input.hasFocus())) {
                            dom_1.EventHelper.stop(e);
                            resolve({
                                button: buttonMap.find(button => button.index !== this.options.cancelId)?.index ?? 0,
                                checkboxChecked: this.checkbox ? this.checkbox.checked : undefined,
                                values: this.inputs.length > 0 ? this.inputs.map(input => input.value) : undefined
                            });
                        }
                        return; // leave default handling
                    }
                    if (evt.equals(10 /* KeyCode.Space */)) {
                        return; // leave default handling
                    }
                    let eventHandled = false;
                    // Focus: Next / Previous
                    if (evt.equals(2 /* KeyCode.Tab */) || evt.equals(17 /* KeyCode.RightArrow */) || evt.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */) || evt.equals(15 /* KeyCode.LeftArrow */)) {
                        // Build a list of focusable elements in their visual order
                        const focusableElements = [];
                        let focusedIndex = -1;
                        if (this.messageContainer) {
                            const links = this.messageContainer.querySelectorAll('a');
                            for (const link of links) {
                                focusableElements.push(link);
                                if ((0, dom_1.isActiveElement)(link)) {
                                    focusedIndex = focusableElements.length - 1;
                                }
                            }
                        }
                        for (const input of this.inputs) {
                            focusableElements.push(input);
                            if (input.hasFocus()) {
                                focusedIndex = focusableElements.length - 1;
                            }
                        }
                        if (this.checkbox) {
                            focusableElements.push(this.checkbox);
                            if (this.checkbox.hasFocus()) {
                                focusedIndex = focusableElements.length - 1;
                            }
                        }
                        if (this.buttonBar) {
                            for (const button of this.buttonBar.buttons) {
                                focusableElements.push(button);
                                if (button.hasFocus()) {
                                    focusedIndex = focusableElements.length - 1;
                                }
                            }
                        }
                        // Focus next element (with wrapping)
                        if (evt.equals(2 /* KeyCode.Tab */) || evt.equals(17 /* KeyCode.RightArrow */)) {
                            if (focusedIndex === -1) {
                                focusedIndex = 0; // default to focus first element if none have focus
                            }
                            const newFocusedIndex = (focusedIndex + 1) % focusableElements.length;
                            focusableElements[newFocusedIndex].focus();
                        }
                        // Focus previous element (with wrapping)
                        else {
                            if (focusedIndex === -1) {
                                focusedIndex = focusableElements.length; // default to focus last element if none have focus
                            }
                            let newFocusedIndex = focusedIndex - 1;
                            if (newFocusedIndex === -1) {
                                newFocusedIndex = focusableElements.length - 1;
                            }
                            focusableElements[newFocusedIndex].focus();
                        }
                        eventHandled = true;
                    }
                    if (eventHandled) {
                        dom_1.EventHelper.stop(e, true);
                    }
                    else if (this.options.keyEventProcessor) {
                        this.options.keyEventProcessor(evt);
                    }
                }, true));
                this._register((0, dom_1.addDisposableListener)(window, 'keyup', e => {
                    dom_1.EventHelper.stop(e, true);
                    const evt = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (!this.options.disableCloseAction && evt.equals(9 /* KeyCode.Escape */)) {
                        resolve({
                            button: this.options.cancelId || 0,
                            checkboxChecked: this.checkbox ? this.checkbox.checked : undefined
                        });
                    }
                }, true));
                // Detect focus out
                this._register((0, dom_1.addDisposableListener)(this.element, 'focusout', e => {
                    if (!!e.relatedTarget && !!this.element) {
                        if (!(0, dom_1.isAncestor)(e.relatedTarget, this.element)) {
                            this.focusToReturn = e.relatedTarget;
                            if (e.target) {
                                e.target.focus();
                                dom_1.EventHelper.stop(e, true);
                            }
                        }
                    }
                }, false));
                const spinModifierClassName = 'codicon-modifier-spin';
                this.iconElement.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogError), ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogWarning), ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogInfo), ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), spinModifierClassName);
                if (this.options.icon) {
                    this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(this.options.icon));
                }
                else {
                    switch (this.options.type) {
                        case 'error':
                            this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogError));
                            break;
                        case 'warning':
                            this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogWarning));
                            break;
                        case 'pending':
                            this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), spinModifierClassName);
                            break;
                        case 'none':
                            this.iconElement.classList.add('no-codicon');
                            break;
                        case 'info':
                        case 'question':
                        default:
                            this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogInfo));
                            break;
                    }
                }
                if (!this.options.disableCloseAction) {
                    const actionBar = this._register(new actionbar_1.ActionBar(this.toolbarContainer, {}));
                    const action = this._register(new actions_1.Action('dialog.close', nls.localize('dialogClose', "Close Dialog"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.dialogClose), true, async () => {
                        resolve({
                            button: this.options.cancelId || 0,
                            checkboxChecked: this.checkbox ? this.checkbox.checked : undefined
                        });
                    }));
                    actionBar.push(action, { icon: true, label: false });
                }
                this.applyStyles();
                this.element.setAttribute('aria-modal', 'true');
                this.element.setAttribute('aria-labelledby', 'monaco-dialog-icon monaco-dialog-message-text');
                this.element.setAttribute('aria-describedby', 'monaco-dialog-icon monaco-dialog-message-text monaco-dialog-message-detail monaco-dialog-message-body');
                (0, dom_1.show)(this.element);
                // Focus first element (input or button)
                if (this.inputs.length > 0) {
                    this.inputs[0].focus();
                    this.inputs[0].select();
                }
                else {
                    buttonMap.forEach((value, index) => {
                        if (value.index === 0) {
                            buttonBar.buttons[index].focus();
                        }
                    });
                }
            });
        }
        applyStyles() {
            const style = this.options.dialogStyles;
            const fgColor = style.dialogForeground;
            const bgColor = style.dialogBackground;
            const shadowColor = style.dialogShadow ? `0 0px 8px ${style.dialogShadow}` : '';
            const border = style.dialogBorder ? `1px solid ${style.dialogBorder}` : '';
            const linkFgColor = style.textLinkForeground;
            this.shadowElement.style.boxShadow = shadowColor;
            this.element.style.color = fgColor ?? '';
            this.element.style.backgroundColor = bgColor ?? '';
            this.element.style.border = border;
            // TODO fix
            // if (fgColor && bgColor) {
            // 	const messageDetailColor = fgColor.transparent(.9);
            // 	this.messageDetailElement.style.mixBlendMode = messageDetailColor.makeOpaque(bgColor).toString();
            // }
            if (linkFgColor) {
                for (const el of this.messageContainer.getElementsByTagName('a')) {
                    el.style.color = linkFgColor;
                }
            }
            let color;
            switch (this.options.type) {
                case 'error':
                    color = style.errorIconForeground;
                    break;
                case 'warning':
                    color = style.warningIconForeground;
                    break;
                default:
                    color = style.infoIconForeground;
                    break;
            }
            if (color) {
                this.iconElement.style.color = color;
            }
        }
        dispose() {
            super.dispose();
            if (this.modalElement) {
                this.modalElement.remove();
                this.modalElement = undefined;
            }
            if (this.focusToReturn && (0, dom_1.isAncestor)(this.focusToReturn, this.container.ownerDocument.body)) {
                this.focusToReturn.focus();
                this.focusToReturn = undefined;
            }
        }
        rearrangeButtons(buttons, cancelId) {
            // Maps each button to its current label and old index
            // so that when we move them around it's not a problem
            const buttonMap = buttons.map((label, index) => ({ label, index }));
            if (buttons.length < 2) {
                return buttonMap; // only need to rearrange if there are 2+ buttons
            }
            if (platform_1.isMacintosh || platform_1.isLinux) {
                // Linux: the GNOME HIG (https://developer.gnome.org/hig/patterns/feedback/dialogs.html?highlight=dialog)
                // recommend the following:
                // "Always ensure that the cancel button appears first, before the affirmative button. In left-to-right
                //  locales, this is on the left. This button order ensures that users become aware of, and are reminded
                //  of, the ability to cancel prior to encountering the affirmative button."
                // macOS: the HIG (https://developer.apple.com/design/human-interface-guidelines/components/presentation/alerts)
                // recommend the following:
                // "Place buttons where people expect. In general, place the button people are most likely to choose on the trailing side in a
                //  row of buttons or at the top in a stack of buttons. Always place the default button on the trailing side of a row or at the
                //  top of a stack. Cancel buttons are typically on the leading side of a row or at the bottom of a stack."
                if (typeof cancelId === 'number' && buttonMap[cancelId]) {
                    const cancelButton = buttonMap.splice(cancelId, 1)[0];
                    buttonMap.splice(1, 0, cancelButton);
                }
                buttonMap.reverse();
            }
            else if (platform_1.isWindows) {
                // Windows: the HIG (https://learn.microsoft.com/en-us/windows/win32/uxguide/win-dialog-box)
                // recommend the following:
                // "One of the following sets of concise commands: Yes/No, Yes/No/Cancel, [Do it]/Cancel,
                //  [Do it]/[Don't do it], [Do it]/[Don't do it]/Cancel."
                if (typeof cancelId === 'number' && buttonMap[cancelId]) {
                    const cancelButton = buttonMap.splice(cancelId, 1)[0];
                    buttonMap.push(cancelButton);
                }
            }
            return buttonMap;
        }
    }
    exports.Dialog = Dialog;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2RpYWxvZy9kaWFsb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUVoRyxNQUFhLE1BQU8sU0FBUSxzQkFBVTtRQWdCckMsWUFBb0IsU0FBc0IsRUFBVSxPQUFlLEVBQUUsT0FBNkIsRUFBbUIsT0FBdUI7WUFDM0ksS0FBSyxFQUFFLENBQUM7WUFEVyxjQUFTLEdBQVQsU0FBUyxDQUFhO1lBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUFrRCxZQUFPLEdBQVAsT0FBTyxDQUFnQjtZQUczSSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUEsT0FBQyxFQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQztZQUN2RixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUEsT0FBQyxFQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUEsT0FBQyxFQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUN2RSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBQSxVQUFJLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRW5CLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQztZQUV6QyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFD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