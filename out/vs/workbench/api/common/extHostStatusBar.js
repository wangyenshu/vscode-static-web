/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHostTypes", "./extHost.protocol", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/types"], function (require, exports, extHostTypes_1, extHost_protocol_1, nls_1, lifecycle_1, extHostTypeConverters_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostStatusBar = exports.ExtHostStatusBarEntry = void 0;
    class ExtHostStatusBarEntry {
        static { this.ID_GEN = 0; }
        static { this.ALLOWED_BACKGROUND_COLORS = new Map([
            ['statusBarItem.errorBackground', new extHostTypes_1.ThemeColor('statusBarItem.errorForeground')],
            ['statusBarItem.warningBackground', new extHostTypes_1.ThemeColor('statusBarItem.warningForeground')]
        ]); }
        #proxy;
        #commands;
        constructor(proxy, commands, staticItems, extension, id, alignment = extHostTypes_1.StatusBarAlignment.Left, priority) {
            this._disposed = false;
            this._text = '';
            this._staleCommandRegistrations = new lifecycle_1.DisposableStore();
            this.#proxy = proxy;
            this.#commands = commands;
            if (id && extension) {
                this._entryId = (0, extHostTypes_1.asStatusBarItemIdentifier)(extension.identifier, id);
                // if new item already exists mark it as visible and copy properties
                // this can only happen when an item was contributed by an extension
                const item = staticItems.get(this._entryId);
                if (item) {
                    alignment = item.alignLeft ? extHostTypes_1.StatusBarAlignment.Left : extHostTypes_1.StatusBarAlignment.Right;
                    priority = item.priority;
                    this._visible = true;
                    this.name = item.name;
                    this.text = item.text;
                    this.tooltip = item.tooltip;
                    this.command = item.command;
                    this.accessibilityInformation = item.accessibilityInformation;
                }
            }
            else {
                this._entryId = String(ExtHostStatusBarEntry.ID_GEN++);
            }
            this._extension = extension;
            this._id = id;
            this._alignment = alignment;
            this._priority = this.validatePriority(priority);
        }
        validatePriority(priority) {
            if (!(0, types_1.isNumber)(priority)) {
                return undefined; // using this method to catch `NaN` too!
            }
            // Our RPC mechanism use JSON to serialize data which does
            // not support `Infinity` so we need to fill in the number
            // equivalent as close as possible.
            // https://github.com/microsoft/vscode/issues/133317
            if (priority === Number.POSITIVE_INFINITY) {
                return Number.MAX_VALUE;
            }
            if (priority === Number.NEGATIVE_INFINITY) {
                return -Number.MAX_VALUE;
            }
            return priority;
        }
        get id() {
            return this._id ?? this._extension.identifier.value;
        }
        get alignment() {
            return this._alignment;
        }
        get priority() {
            return this._priority;
        }
        get text() {
            return this._text;
        }
        get name() {
            return this._name;
        }
        get tooltip() {
            return this._tooltip;
        }
        get color() {
            return this._color;
        }
        get backgroundColor() {
            return this._backgroundColor;
        }
        get command() {
            return this._command?.fromApi;
        }
        get accessibilityInformation() {
            return this._accessibilityInformation;
        }
        set text(text) {
            this._text = text;
            this.update();
        }
        set name(name) {
            this._name = name;
            this.update();
        }
        set tooltip(tooltip) {
            this._tooltip = tooltip;
            this.update();
        }
        set color(color) {
            this._color = color;
            this.update();
        }
        set backgroundColor(color) {
            if (color && !ExtHostStatusBarEntry.ALLOWED_BACKGROUND_COLORS.has(color.id)) {
                color = undefined;
            }
            this._backgroundColor = color;
            this.update();
        }
        set command(command) {
            if (this._command?.fromApi === command) {
                return;
            }
            if (this._latestCommandRegistration) {
                this._staleCommandRegistrations.add(this._latestCommandRegistration);
            }
            this._latestCommandRegistration = new lifecycle_1.DisposableStore();
            if (typeof command === 'string') {
                this._command = {
                    fromApi: command,
                    internal: this.#commands.toInternal({ title: '', command }, this._latestCommandRegistration),
                };
            }
            else if (command) {
                this._command = {
                    fromApi: command,
                    internal: this.#commands.toInternal(command, this._latestCommandRegistration),
                };
            }
            else {
                this._command = undefined;
            }
            this.update();
        }
        set accessibilityInformation(accessibilityInformation) {
            this._accessibilityInformation = accessibilityInformation;
            this.update();
        }
        show() {
            this._visible = true;
            this.update();
        }
        hide() {
            clearTimeout(this._timeoutHandle);
            this._visible = false;
            this.#proxy.$disposeEntry(this._entryId);
        }
        update() {
            if (this._disposed || !this._visible) {
                return;
            }
            clearTimeout(this._timeoutHandle);
            // Defer the update so that multiple changes to setters dont cause a redraw each
            this._timeoutHandle = setTimeout(() => {
                this._timeoutHandle = undefined;
                // If the id is not set, derive it from the extension identifier,
                // otherwise make sure to prefix it with the extension identifier
                // to get a more unique value across extensions.
                let id;
                if (this._extension) {
                    if (this._id) {
                        id = `${this._extension.identifier.value}.${this._id}`;
                    }
                    else {
                        id = this._extension.identifier.value;
                    }
                }
                else {
                    id = this._id;
                }
                // If the name is not set, derive it from the extension descriptor
                let name;
                if (this._name) {
                    name = this._name;
                }
                else {
                    name = (0, nls_1.localize)('extensionLabel', "{0} (Extension)", this._extension.displayName || this._extension.name);
                }
                // If a background color is set, the foreground is determined
                let color = this._color;
                if (this._backgroundColor) {
                    color = ExtHostStatusBarEntry.ALLOWED_BACKGROUND_COLORS.get(this._backgroundColor.id);
                }
                const tooltip = extHostTypeConverters_1.MarkdownString.fromStrict(this._tooltip);
                // Set to status bar
                this.#proxy.$setEntry(this._entryId, id, this._extension?.identifier.value, name, this._text, tooltip, this._command?.internal, color, this._backgroundColor, this._alignment === extHostTypes_1.StatusBarAlignment.Left, this._priority, this._accessibilityInformation);
                // clean-up state commands _after_ updating the UI
                this._staleCommandRegistrations.clear();
            }, 0);
        }
        dispose() {
            this.hide();
            this._disposed = true;
        }
    }
    exports.ExtHostStatusBarEntry = ExtHostStatusBarEntry;
    class StatusBarMessage {
        constructor(statusBar) {
            this._messages = [];
            this._item = statusBar.createStatusBarEntry(undefined, 'status.extensionMessage', extHostTypes_1.StatusBarAlignment.Left, Number.MIN_VALUE);
            this._item.name = (0, nls_1.localize)('status.extensionMessage', "Extension Status");
        }
        dispose() {
            this._messages.length = 0;
            this._item.dispose();
        }
        setMessage(message) {
            const data = { message }; // use object to not confuse equal strings
            this._messages.unshift(data);
            this._update();
            return new extHostTypes_1.Disposable(() => {
                const idx = this._messages.indexOf(data);
                if (idx >= 0) {
                    this._messages.splice(idx, 1);
                    this._update();
                }
            });
        }
        _update() {
            if (this._messages.length > 0) {
                this._item.text = this._messages[0].message;
                this._item.show();
            }
            else {
                this._item.hide();
            }
        }
    }
    class ExtHostStatusBar {
        constructor(mainContext, commands) {
            this._existingItems = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadStatusBar);
            this._commands = commands;
            this._statusMessage = new StatusBarMessage(this);
        }
        $acceptStaticEntries(added) {
            for (const item of added) {
                this._existingItems.set(item.entryId, item);
            }
        }
        createStatusBarEntry(extension, id, alignment, priority) {
            return new ExtHostStatusBarEntry(this._proxy, this._commands, this._existingItems, extension, id, alignment, priority);
        }
        setStatusBarMessage(text, timeoutOrThenable) {
            const d = this._statusMessage.setMessage(text);
            let handle;
            if (typeof timeoutOrThenable === 'number') {
                handle = setTimeout(() => d.dispose(), timeoutOrThenable);
            }
            else if (typeof timeoutOrThenable !== 'undefined') {
                timeoutOrThenable.then(() => d.dispose(), () => d.dispose());
            }
            return new extHostTypes_1.Disposable(() => {
                d.dispose();
                clearTimeout(handle);
            });
        }
    }
    exports.ExtHostStatusBar = ExtHostStatusBar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFN0YXR1c0Jhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RTdGF0dXNCYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEscUJBQXFCO2lCQUVsQixXQUFNLEdBQUcsQ0FBQyxBQUFKLENBQUs7aUJBRVgsOEJBQXlCLEdBQUcsSUFBSSxHQUFHLENBQ2pEO1lBQ0MsQ0FBQywrQkFBK0IsRUFBRSxJQUFJLHlCQUFVLENBQUMsK0JBQStCLENBQUMsQ0FBQztZQUNsRixDQUFDLGlDQUFpQyxFQUFFLElBQUkseUJBQVUsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1NBQ3RGLENBQ0QsQUFMdUMsQ0FLdEM7UUFFRixNQUFNLENBQTJCO1FBQ2pDLFNBQVMsQ0FBb0I7UUErQjdCLFlBQVksS0FBK0IsRUFBRSxRQUEyQixFQUFFLFdBQWtELEVBQUUsU0FBaUMsRUFBRSxFQUFXLEVBQUUsWUFBdUMsaUNBQXlCLENBQUMsSUFBSSxFQUFFLFFBQWlCO1lBckI5UCxjQUFTLEdBQVksS0FBSyxDQUFDO1lBRzNCLFVBQUssR0FBVyxFQUFFLENBQUM7WUFPViwrQkFBMEIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVluRSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUUxQixJQUFJLEVBQUUsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLHdDQUF5QixFQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3BFLG9FQUFvRTtnQkFDcEUsb0VBQW9FO2dCQUNwRSxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDVixTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsaUNBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQ0FBeUIsQ0FBQyxLQUFLLENBQUM7b0JBQzlGLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO29CQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztvQkFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO29CQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ3RCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztvQkFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO29CQUM1QixJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDO2dCQUMvRCxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBRTVCLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVPLGdCQUFnQixDQUFDLFFBQWlCO1lBQ3pDLElBQUksQ0FBQyxJQUFBLGdCQUFRLEVBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxTQUFTLENBQUMsQ0FBQyx3Q0FBd0M7WUFDM0QsQ0FBQztZQUVELDBEQUEwRDtZQUMxRCwwREFBMEQ7WUFDMUQsbUNBQW1DO1lBQ25DLG9EQUFvRDtZQUVwRCxJQUFJLFFBQVEsS0FBSyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDO1lBQ3pCLENBQUM7WUFFRCxJQUFJLFFBQVEsS0FBSyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7WUFDMUIsQ0FBQztZQUVELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxJQUFXLEVBQUU7WUFDWixPQUFPLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLFVBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBQ3RELENBQUM7UUFFRCxJQUFXLFNBQVM7WUFDbkIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxJQUFXLFFBQVE7WUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFXLElBQUk7WUFDZCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVELElBQVcsSUFBSTtZQUNkLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRUQsSUFBVyxPQUFPO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBVyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFXLGVBQWU7WUFDekIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQUVELElBQVcsT0FBTztZQUNqQixPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFXLHdCQUF3QjtZQUNsQyxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBVyxJQUFJLENBQUMsSUFBWTtZQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNsQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsSUFBVyxJQUFJLENBQUMsSUFBd0I7WUFDdkMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQVcsT0FBTyxDQUFDLE9BQW1EO1lBQ3JFLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxJQUFXLEtBQUssQ0FBQyxLQUFzQztZQUN0RCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsSUFBVyxlQUFlLENBQUMsS0FBNkI7WUFDdkQsSUFBSSxLQUFLLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQzdFLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDbkIsQ0FBQztZQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7WUFDOUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQVcsT0FBTyxDQUFDLE9BQTRDO1lBQzlELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQ3hDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUN0RSxDQUFDO1lBQ0QsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3hELElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxRQUFRLEdBQUc7b0JBQ2YsT0FBTyxFQUFFLE9BQU87b0JBQ2hCLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDLDBCQUEwQixDQUFDO2lCQUM1RixDQUFDO1lBQ0gsQ0FBQztpQkFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsUUFBUSxHQUFHO29CQUNmLE9BQU8sRUFBRSxPQUFPO29CQUNoQixRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQywwQkFBMEIsQ0FBQztpQkFDN0UsQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQztZQUMzQixDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQVcsd0JBQXdCLENBQUMsd0JBQXFFO1lBQ3hHLElBQUksQ0FBQyx5QkFBeUIsR0FBRyx3QkFBd0IsQ0FBQztZQUMxRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRU0sSUFBSTtZQUNWLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFTSxJQUFJO1lBQ1YsWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVPLE1BQU07WUFDYixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3RDLE9BQU87WUFDUixDQUFDO1lBRUQsWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVsQyxnRkFBZ0Y7WUFDaEYsSUFBSSxDQUFDLGNBQWMsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNyQyxJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztnQkFFaEMsaUVBQWlFO2dCQUNqRSxpRUFBaUU7Z0JBQ2pFLGdEQUFnRDtnQkFDaEQsSUFBSSxFQUFVLENBQUM7Z0JBQ2YsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3JCLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUNkLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ3hELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO29CQUN2QyxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUksQ0FBQztnQkFDaEIsQ0FBQztnQkFFRCxrRUFBa0U7Z0JBQ2xFLElBQUksSUFBWSxDQUFDO2dCQUNqQixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ25CLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLEdBQUcsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFVBQVcsQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFVBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0csQ0FBQztnQkFFRCw2REFBNkQ7Z0JBQzdELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ3hCLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQzNCLEtBQUssR0FBRyxxQkFBcUIsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RixDQUFDO2dCQUVELE1BQU0sT0FBTyxHQUFHLHNDQUFjLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFekQsb0JBQW9CO2dCQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFDcEksSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxVQUFVLEtBQUssaUNBQXlCLENBQUMsSUFBSSxFQUN6RSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2dCQUVqRCxrREFBa0Q7Z0JBQ2xELElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN6QyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRU0sT0FBTztZQUNiLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLENBQUM7O0lBalFGLHNEQWtRQztJQUVELE1BQU0sZ0JBQWdCO1FBS3JCLFlBQVksU0FBMkI7WUFGdEIsY0FBUyxHQUEwQixFQUFFLENBQUM7WUFHdEQsSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLHlCQUF5QixFQUFFLGlDQUF5QixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxVQUFVLENBQUMsT0FBZTtZQUN6QixNQUFNLElBQUksR0FBd0IsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLDBDQUEwQztZQUN6RixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFZixPQUFPLElBQUkseUJBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQzFCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLE9BQU87WUFDZCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsTUFBYSxnQkFBZ0I7UUFPNUIsWUFBWSxXQUF5QixFQUFFLFFBQTJCO1lBRmpELG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQTRCLENBQUM7WUFHckUsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELG9CQUFvQixDQUFDLEtBQXlCO1lBQzdDLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNGLENBQUM7UUFJRCxvQkFBb0IsQ0FBQyxTQUFnQyxFQUFFLEVBQVUsRUFBRSxTQUFxQyxFQUFFLFFBQWlCO1lBQzFILE9BQU8sSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4SCxDQUFDO1FBRUQsbUJBQW1CLENBQUMsSUFBWSxFQUFFLGlCQUEwQztZQUMzRSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxJQUFJLE1BQVcsQ0FBQztZQUVoQixJQUFJLE9BQU8saUJBQWlCLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDM0QsQ0FBQztpQkFBTSxJQUFJLE9BQU8saUJBQWlCLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ3JELGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUVELE9BQU8sSUFBSSx5QkFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDMUIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNaLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQXhDRCw0Q0F3Q0MifQ==