/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/findinput/findInput", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/css!./media/quickInput"], function (require, exports, dom, findInput_1, lifecycle_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputBox = void 0;
    const $ = dom.$;
    class QuickInputBox extends lifecycle_1.Disposable {
        constructor(parent, inputBoxStyles, toggleStyles) {
            super();
            this.parent = parent;
            this.onKeyDown = (handler) => {
                return dom.addStandardDisposableListener(this.findInput.inputBox.inputElement, dom.EventType.KEY_DOWN, handler);
            };
            this.onMouseDown = (handler) => {
                return dom.addStandardDisposableListener(this.findInput.inputBox.inputElement, dom.EventType.MOUSE_DOWN, handler);
            };
            this.onDidChange = (handler) => {
                return this.findInput.onDidChange(handler);
            };
            this.container = dom.append(this.parent, $('.quick-input-box'));
            this.findInput = this._register(new findInput_1.FindInput(this.container, undefined, { label: '', inputBoxStyles, toggleStyles }));
            const input = this.findInput.inputBox.inputElement;
            input.role = 'combobox';
            input.ariaHasPopup = 'menu';
            input.ariaAutoComplete = 'list';
            input.ariaExpanded = 'true';
        }
        get value() {
            return this.findInput.getValue();
        }
        set value(value) {
            this.findInput.setValue(value);
        }
        select(range = null) {
            this.findInput.inputBox.select(range);
        }
        getSelection() {
            return this.findInput.inputBox.getSelection();
        }
        isSelectionAtEnd() {
            return this.findInput.inputBox.isSelectionAtEnd();
        }
        setPlaceholder(placeholder) {
            this.findInput.inputBox.setPlaceHolder(placeholder);
        }
        get placeholder() {
            return this.findInput.inputBox.inputElement.getAttribute('placeholder') || '';
        }
        set placeholder(placeholder) {
            this.findInput.inputBox.setPlaceHolder(placeholder);
        }
        get password() {
            return this.findInput.inputBox.inputElement.type === 'password';
        }
        set password(password) {
            this.findInput.inputBox.inputElement.type = password ? 'password' : 'text';
        }
        set enabled(enabled) {
            // We can't disable the input box because it is still used for
            // navigating the list. Instead, we disable the list and the OK
            // so that nothing can be selected.
            // TODO: should this be what we do for all find inputs? Or maybe some _other_ API
            // on findInput to change it to readonly?
            this.findInput.inputBox.inputElement.toggleAttribute('readonly', !enabled);
            // TODO: styles of the quick pick need to be moved to the CSS instead of being in line
            // so things like this can be done in CSS
            // this.findInput.inputBox.inputElement.classList.toggle('disabled', !enabled);
        }
        set toggles(toggles) {
            this.findInput.setAdditionalToggles(toggles);
        }
        hasFocus() {
            return this.findInput.inputBox.hasFocus();
        }
        setAttribute(name, value) {
            this.findInput.inputBox.inputElement.setAttribute(name, value);
        }
        removeAttribute(name) {
            this.findInput.inputBox.inputElement.removeAttribute(name);
        }
        showDecoration(decoration) {
            if (decoration === severity_1.default.Ignore) {
                this.findInput.clearMessage();
            }
            else {
                this.findInput.showMessage({ type: decoration === severity_1.default.Info ? 1 /* MessageType.INFO */ : decoration === severity_1.default.Warning ? 2 /* MessageType.WARNING */ : 3 /* MessageType.ERROR */, content: '' });
            }
        }
        stylesForType(decoration) {
            return this.findInput.inputBox.stylesForType(decoration === severity_1.default.Info ? 1 /* MessageType.INFO */ : decoration === severity_1.default.Warning ? 2 /* MessageType.WARNING */ : 3 /* MessageType.ERROR */);
        }
        setFocus() {
            this.findInput.focus();
        }
        layout() {
            this.findInput.inputBox.layout();
        }
    }
    exports.QuickInputBox = QuickInputBox;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dEJveC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvYnJvd3Nlci9xdWlja0lucHV0Qm94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLE1BQWEsYUFBYyxTQUFRLHNCQUFVO1FBSzVDLFlBQ1MsTUFBbUIsRUFDM0IsY0FBK0IsRUFDL0IsWUFBMkI7WUFFM0IsS0FBSyxFQUFFLENBQUM7WUFKQSxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBYzVCLGNBQVMsR0FBRyxDQUFDLE9BQStDLEVBQWUsRUFBRTtnQkFDNUUsT0FBTyxHQUFHLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2pILENBQUMsQ0FBQztZQUVGLGdCQUFXLEdBQUcsQ0FBQyxPQUE0QyxFQUFlLEVBQUU7Z0JBQzNFLE9BQU8sR0FBRyxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuSCxDQUFDLENBQUM7WUFFRixnQkFBVyxHQUFHLENBQUMsT0FBZ0MsRUFBZSxFQUFFO2dCQUMvRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzVDLENBQUMsQ0FBQztZQW5CRCxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHFCQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkgsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO1lBQ25ELEtBQUssQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO1lBQ3hCLEtBQUssQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1lBQzVCLEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUM7WUFDaEMsS0FBSyxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7UUFDN0IsQ0FBQztRQWNELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBRUQsSUFBSSxLQUFLLENBQUMsS0FBYTtZQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQXVCLElBQUk7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxZQUFZO1lBQ1gsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMvQyxDQUFDO1FBRUQsZ0JBQWdCO1lBQ2YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ25ELENBQUM7UUFFRCxjQUFjLENBQUMsV0FBbUI7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQy9FLENBQUM7UUFFRCxJQUFJLFdBQVcsQ0FBQyxXQUFtQjtZQUNsQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUM7UUFDakUsQ0FBQztRQUVELElBQUksUUFBUSxDQUFDLFFBQWlCO1lBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUM1RSxDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsT0FBZ0I7WUFDM0IsOERBQThEO1lBQzlELCtEQUErRDtZQUMvRCxtQ0FBbUM7WUFDbkMsaUZBQWlGO1lBQ2pGLHlDQUF5QztZQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLHNGQUFzRjtZQUN0Rix5Q0FBeUM7WUFDekMsK0VBQStFO1FBQ2hGLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxPQUE2QjtZQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxRQUFRO1lBQ1AsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxDQUFDO1FBRUQsWUFBWSxDQUFDLElBQVksRUFBRSxLQUFhO1lBQ3ZDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxlQUFlLENBQUMsSUFBWTtZQUMzQixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxjQUFjLENBQUMsVUFBb0I7WUFDbEMsSUFBSSxVQUFVLEtBQUssa0JBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMvQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxLQUFLLGtCQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsMEJBQWtCLENBQUMsQ0FBQyxVQUFVLEtBQUssa0JBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyw2QkFBcUIsQ0FBQywwQkFBa0IsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoTCxDQUFDO1FBQ0YsQ0FBQztRQUVELGFBQWEsQ0FBQyxVQUFvQjtZQUNqQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEtBQUssa0JBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQywwQkFBa0IsQ0FBQyxDQUFDLFVBQVUsS0FBSyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLDZCQUFxQixDQUFDLDBCQUFrQixDQUFDLENBQUM7UUFDM0ssQ0FBQztRQUVELFFBQVE7WUFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbEMsQ0FBQztLQUNEO0lBdkhELHNDQXVIQyJ9