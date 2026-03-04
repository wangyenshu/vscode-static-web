/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "./extHost.protocol", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "vs/base/common/errors", "vs/base/common/arrays", "vs/base/common/severity", "vs/base/common/themables", "vs/workbench/services/extensions/common/extensions", "vs/workbench/api/common/extHostTypeConverters"], function (require, exports, cancellation_1, event_1, lifecycle_1, extHost_protocol_1, uri_1, extHostTypes_1, errors_1, arrays_1, severity_1, themables_1, extensions_1, extHostTypeConverters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createExtHostQuickOpen = createExtHostQuickOpen;
    function createExtHostQuickOpen(mainContext, workspace, commands) {
        const proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadQuickOpen);
        class ExtHostQuickOpenImpl {
            constructor(workspace, commands) {
                this._sessions = new Map();
                this._instances = 0;
                this._workspace = workspace;
                this._commands = commands;
            }
            showQuickPick(extension, itemsOrItemsPromise, options, token = cancellation_1.CancellationToken.None) {
                // clear state from last invocation
                this._onDidSelectItem = undefined;
                const itemsPromise = Promise.resolve(itemsOrItemsPromise);
                const instance = ++this._instances;
                const quickPickWidget = proxy.$show(instance, {
                    title: options?.title,
                    placeHolder: options?.placeHolder,
                    matchOnDescription: options?.matchOnDescription,
                    matchOnDetail: options?.matchOnDetail,
                    ignoreFocusLost: options?.ignoreFocusOut,
                    canPickMany: options?.canPickMany,
                }, token);
                const widgetClosedMarker = {};
                const widgetClosedPromise = quickPickWidget.then(() => widgetClosedMarker);
                return Promise.race([widgetClosedPromise, itemsPromise]).then(result => {
                    if (result === widgetClosedMarker) {
                        return undefined;
                    }
                    const allowedTooltips = (0, extensions_1.isProposedApiEnabled)(extension, 'quickPickItemTooltip');
                    return itemsPromise.then(items => {
                        const pickItems = [];
                        for (let handle = 0; handle < items.length; handle++) {
                            const item = items[handle];
                            if (typeof item === 'string') {
                                pickItems.push({ label: item, handle });
                            }
                            else if (item.kind === extHostTypes_1.QuickPickItemKind.Separator) {
                                pickItems.push({ type: 'separator', label: item.label });
                            }
                            else {
                                if (item.tooltip && !allowedTooltips) {
                                    console.warn(`Extension '${extension.identifier.value}' uses a tooltip which is proposed API that is only available when running out of dev or with the following command line switch: --enable-proposed-api ${extension.identifier.value}`);
                                }
                                const icon = (item.iconPath) ? getIconPathOrClass(item.iconPath) : undefined;
                                pickItems.push({
                                    label: item.label,
                                    iconPath: icon?.iconPath,
                                    iconClass: icon?.iconClass,
                                    description: item.description,
                                    detail: item.detail,
                                    picked: item.picked,
                                    alwaysShow: item.alwaysShow,
                                    tooltip: allowedTooltips ? extHostTypeConverters_1.MarkdownString.fromStrict(item.tooltip) : undefined,
                                    handle
                                });
                            }
                        }
                        // handle selection changes
                        if (options && typeof options.onDidSelectItem === 'function') {
                            this._onDidSelectItem = (handle) => {
                                options.onDidSelectItem(items[handle]);
                            };
                        }
                        // show items
                        proxy.$setItems(instance, pickItems);
                        return quickPickWidget.then(handle => {
                            if (typeof handle === 'number') {
                                return items[handle];
                            }
                            else if (Array.isArray(handle)) {
                                return handle.map(h => items[h]);
                            }
                            return undefined;
                        });
                    });
                }).then(undefined, err => {
                    if ((0, errors_1.isCancellationError)(err)) {
                        return undefined;
                    }
                    proxy.$setError(instance, err);
                    return Promise.reject(err);
                });
            }
            $onItemSelected(handle) {
                this._onDidSelectItem?.(handle);
            }
            // ---- input
            showInput(options, token = cancellation_1.CancellationToken.None) {
                // global validate fn used in callback below
                this._validateInput = options?.validateInput;
                return proxy.$input(options, typeof this._validateInput === 'function', token)
                    .then(undefined, err => {
                    if ((0, errors_1.isCancellationError)(err)) {
                        return undefined;
                    }
                    return Promise.reject(err);
                });
            }
            async $validateInput(input) {
                if (!this._validateInput) {
                    return;
                }
                const result = await this._validateInput(input);
                if (!result || typeof result === 'string') {
                    return result;
                }
                let severity;
                switch (result.severity) {
                    case extHostTypes_1.InputBoxValidationSeverity.Info:
                        severity = severity_1.default.Info;
                        break;
                    case extHostTypes_1.InputBoxValidationSeverity.Warning:
                        severity = severity_1.default.Warning;
                        break;
                    case extHostTypes_1.InputBoxValidationSeverity.Error:
                        severity = severity_1.default.Error;
                        break;
                    default:
                        severity = result.message ? severity_1.default.Error : severity_1.default.Ignore;
                        break;
                }
                return {
                    content: result.message,
                    severity
                };
            }
            // ---- workspace folder picker
            async showWorkspaceFolderPick(options, token = cancellation_1.CancellationToken.None) {
                const selectedFolder = await this._commands.executeCommand('_workbench.pickWorkspaceFolder', [options]);
                if (!selectedFolder) {
                    return undefined;
                }
                const workspaceFolders = await this._workspace.getWorkspaceFolders2();
                if (!workspaceFolders) {
                    return undefined;
                }
                return workspaceFolders.find(folder => folder.uri.toString() === selectedFolder.uri.toString());
            }
            // ---- QuickInput
            createQuickPick(extension) {
                const session = new ExtHostQuickPick(extension, () => this._sessions.delete(session._id));
                this._sessions.set(session._id, session);
                return session;
            }
            createInputBox(extension) {
                const session = new ExtHostInputBox(extension, () => this._sessions.delete(session._id));
                this._sessions.set(session._id, session);
                return session;
            }
            $onDidChangeValue(sessionId, value) {
                const session = this._sessions.get(sessionId);
                session?._fireDidChangeValue(value);
            }
            $onDidAccept(sessionId) {
                const session = this._sessions.get(sessionId);
                session?._fireDidAccept();
            }
            $onDidChangeActive(sessionId, handles) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidChangeActive(handles);
                }
            }
            $onDidChangeSelection(sessionId, handles) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidChangeSelection(handles);
                }
            }
            $onDidTriggerButton(sessionId, handle) {
                const session = this._sessions.get(sessionId);
                session?._fireDidTriggerButton(handle);
            }
            $onDidTriggerItemButton(sessionId, itemHandle, buttonHandle) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidTriggerItemButton(itemHandle, buttonHandle);
                }
            }
            $onDidHide(sessionId) {
                const session = this._sessions.get(sessionId);
                session?._fireDidHide();
            }
        }
        class ExtHostQuickInput {
            static { this._nextId = 1; }
            constructor(_extensionId, _onDidDispose) {
                this._extensionId = _extensionId;
                this._onDidDispose = _onDidDispose;
                this._id = ExtHostQuickPick._nextId++;
                this._visible = false;
                this._expectingHide = false;
                this._enabled = true;
                this._busy = false;
                this._ignoreFocusOut = true;
                this._value = '';
                this._buttons = [];
                this._handlesToButtons = new Map();
                this._onDidAcceptEmitter = new event_1.Emitter();
                this._onDidChangeValueEmitter = new event_1.Emitter();
                this._onDidTriggerButtonEmitter = new event_1.Emitter();
                this._onDidHideEmitter = new event_1.Emitter();
                this._pendingUpdate = { id: this._id };
                this._disposed = false;
                this._disposables = [
                    this._onDidTriggerButtonEmitter,
                    this._onDidHideEmitter,
                    this._onDidAcceptEmitter,
                    this._onDidChangeValueEmitter
                ];
                this.onDidChangeValue = this._onDidChangeValueEmitter.event;
                this.onDidAccept = this._onDidAcceptEmitter.event;
                this.onDidTriggerButton = this._onDidTriggerButtonEmitter.event;
                this.onDidHide = this._onDidHideEmitter.event;
            }
            get title() {
                return this._title;
            }
            set title(title) {
                this._title = title;
                this.update({ title });
            }
            get step() {
                return this._steps;
            }
            set step(step) {
                this._steps = step;
                this.update({ step });
            }
            get totalSteps() {
                return this._totalSteps;
            }
            set totalSteps(totalSteps) {
                this._totalSteps = totalSteps;
                this.update({ totalSteps });
            }
            get enabled() {
                return this._enabled;
            }
            set enabled(enabled) {
                this._enabled = enabled;
                this.update({ enabled });
            }
            get busy() {
                return this._busy;
            }
            set busy(busy) {
                this._busy = busy;
                this.update({ busy });
            }
            get ignoreFocusOut() {
                return this._ignoreFocusOut;
            }
            set ignoreFocusOut(ignoreFocusOut) {
                this._ignoreFocusOut = ignoreFocusOut;
                this.update({ ignoreFocusOut });
            }
            get value() {
                return this._value;
            }
            set value(value) {
                this._value = value;
                this.update({ value });
            }
            get placeholder() {
                return this._placeholder;
            }
            set placeholder(placeholder) {
                this._placeholder = placeholder;
                this.update({ placeholder });
            }
            get buttons() {
                return this._buttons;
            }
            set buttons(buttons) {
                this._buttons = buttons.slice();
                this._handlesToButtons.clear();
                buttons.forEach((button, i) => {
                    const handle = button === extHostTypes_1.QuickInputButtons.Back ? -1 : i;
                    this._handlesToButtons.set(handle, button);
                });
                this.update({
                    buttons: buttons.map((button, i) => {
                        return {
                            ...getIconPathOrClass(button.iconPath),
                            tooltip: button.tooltip,
                            handle: button === extHostTypes_1.QuickInputButtons.Back ? -1 : i,
                        };
                    })
                });
            }
            show() {
                this._visible = true;
                this._expectingHide = true;
                this.update({ visible: true });
            }
            hide() {
                this._visible = false;
                this.update({ visible: false });
            }
            _fireDidAccept() {
                this._onDidAcceptEmitter.fire();
            }
            _fireDidChangeValue(value) {
                this._value = value;
                this._onDidChangeValueEmitter.fire(value);
            }
            _fireDidTriggerButton(handle) {
                const button = this._handlesToButtons.get(handle);
                if (button) {
                    this._onDidTriggerButtonEmitter.fire(button);
                }
            }
            _fireDidHide() {
                if (this._expectingHide) {
                    // if this._visible is true, it means that .show() was called between
                    // .hide() and .onDidHide. To ensure the correct number of onDidHide events
                    // are emitted, we set this._expectingHide to this value so that
                    // the next time .hide() is called, we can emit the event again.
                    // Example:
                    // .show() -> .hide() -> .show() -> .hide() should emit 2 onDidHide events.
                    // .show() -> .hide() -> .hide() should emit 1 onDidHide event.
                    // Fixes #135747
                    this._expectingHide = this._visible;
                    this._onDidHideEmitter.fire();
                }
            }
            dispose() {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                this._fireDidHide();
                this._disposables = (0, lifecycle_1.dispose)(this._disposables);
                if (this._updateTimeout) {
                    clearTimeout(this._updateTimeout);
                    this._updateTimeout = undefined;
                }
                this._onDidDispose();
                proxy.$dispose(this._id);
            }
            update(properties) {
                if (this._disposed) {
                    return;
                }
                for (const key of Object.keys(properties)) {
                    const value = properties[key];
                    this._pendingUpdate[key] = value === undefined ? null : value;
                }
                if ('visible' in this._pendingUpdate) {
                    if (this._updateTimeout) {
                        clearTimeout(this._updateTimeout);
                        this._updateTimeout = undefined;
                    }
                    this.dispatchUpdate();
                }
                else if (this._visible && !this._updateTimeout) {
                    // Defer the update so that multiple changes to setters dont cause a redraw each
                    this._updateTimeout = setTimeout(() => {
                        this._updateTimeout = undefined;
                        this.dispatchUpdate();
                    }, 0);
                }
            }
            dispatchUpdate() {
                proxy.$createOrUpdate(this._pendingUpdate);
                this._pendingUpdate = { id: this._id };
            }
        }
        function getIconUris(iconPath) {
            if (iconPath instanceof extHostTypes_1.ThemeIcon) {
                return { id: iconPath.id };
            }
            const dark = getDarkIconUri(iconPath);
            const light = getLightIconUri(iconPath);
            // Tolerate strings: https://github.com/microsoft/vscode/issues/110432#issuecomment-726144556
            return {
                dark: typeof dark === 'string' ? uri_1.URI.file(dark) : dark,
                light: typeof light === 'string' ? uri_1.URI.file(light) : light
            };
        }
        function getLightIconUri(iconPath) {
            return typeof iconPath === 'object' && 'light' in iconPath ? iconPath.light : iconPath;
        }
        function getDarkIconUri(iconPath) {
            return typeof iconPath === 'object' && 'dark' in iconPath ? iconPath.dark : iconPath;
        }
        function getIconPathOrClass(icon) {
            const iconPathOrIconClass = getIconUris(icon);
            let iconPath;
            let iconClass;
            if ('id' in iconPathOrIconClass) {
                iconClass = themables_1.ThemeIcon.asClassName(iconPathOrIconClass);
            }
            else {
                iconPath = iconPathOrIconClass;
            }
            return {
                iconPath,
                iconClass
            };
        }
        class ExtHostQuickPick extends ExtHostQuickInput {
            constructor(extension, onDispose) {
                super(extension.identifier, onDispose);
                this.extension = extension;
                this._items = [];
                this._handlesToItems = new Map();
                this._itemsToHandles = new Map();
                this._canSelectMany = false;
                this._matchOnDescription = true;
                this._matchOnDetail = true;
                this._sortByLabel = true;
                this._keepScrollPosition = false;
                this._activeItems = [];
                this._onDidChangeActiveEmitter = new event_1.Emitter();
                this._selectedItems = [];
                this._onDidChangeSelectionEmitter = new event_1.Emitter();
                this._onDidTriggerItemButtonEmitter = new event_1.Emitter();
                this.onDidChangeActive = this._onDidChangeActiveEmitter.event;
                this.onDidChangeSelection = this._onDidChangeSelectionEmitter.event;
                this.onDidTriggerItemButton = this._onDidTriggerItemButtonEmitter.event;
                this._disposables.push(this._onDidChangeActiveEmitter, this._onDidChangeSelectionEmitter, this._onDidTriggerItemButtonEmitter);
                this.update({ type: 'quickPick' });
            }
            get items() {
                return this._items;
            }
            set items(items) {
                this._items = items.slice();
                this._handlesToItems.clear();
                this._itemsToHandles.clear();
                items.forEach((item, i) => {
                    this._handlesToItems.set(i, item);
                    this._itemsToHandles.set(item, i);
                });
                const allowedTooltips = (0, extensions_1.isProposedApiEnabled)(this.extension, 'quickPickItemTooltip');
                const pickItems = [];
                for (let handle = 0; handle < items.length; handle++) {
                    const item = items[handle];
                    if (item.kind === extHostTypes_1.QuickPickItemKind.Separator) {
                        pickItems.push({ type: 'separator', label: item.label });
                    }
                    else {
                        if (item.tooltip && !allowedTooltips) {
                            console.warn(`Extension '${this.extension.identifier.value}' uses a tooltip which is proposed API that is only available when running out of dev or with the following command line switch: --enable-proposed-api ${this.extension.identifier.value}`);
                        }
                        const icon = (item.iconPath) ? getIconPathOrClass(item.iconPath) : undefined;
                        pickItems.push({
                            handle,
                            label: item.label,
                            iconPath: icon?.iconPath,
                            iconClass: icon?.iconClass,
                            description: item.description,
                            detail: item.detail,
                            picked: item.picked,
                            alwaysShow: item.alwaysShow,
                            tooltip: allowedTooltips ? extHostTypeConverters_1.MarkdownString.fromStrict(item.tooltip) : undefined,
                            buttons: item.buttons?.map((button, i) => {
                                return {
                                    ...getIconPathOrClass(button.iconPath),
                                    tooltip: button.tooltip,
                                    handle: i
                                };
                            }),
                        });
                    }
                }
                this.update({
                    items: pickItems,
                });
            }
            get canSelectMany() {
                return this._canSelectMany;
            }
            set canSelectMany(canSelectMany) {
                this._canSelectMany = canSelectMany;
                this.update({ canSelectMany });
            }
            get matchOnDescription() {
                return this._matchOnDescription;
            }
            set matchOnDescription(matchOnDescription) {
                this._matchOnDescription = matchOnDescription;
                this.update({ matchOnDescription });
            }
            get matchOnDetail() {
                return this._matchOnDetail;
            }
            set matchOnDetail(matchOnDetail) {
                this._matchOnDetail = matchOnDetail;
                this.update({ matchOnDetail });
            }
            get sortByLabel() {
                return this._sortByLabel;
            }
            set sortByLabel(sortByLabel) {
                this._sortByLabel = sortByLabel;
                this.update({ sortByLabel });
            }
            get keepScrollPosition() {
                return this._keepScrollPosition;
            }
            set keepScrollPosition(keepScrollPosition) {
                this._keepScrollPosition = keepScrollPosition;
                this.update({ keepScrollPosition });
            }
            get activeItems() {
                return this._activeItems;
            }
            set activeItems(activeItems) {
                this._activeItems = activeItems.filter(item => this._itemsToHandles.has(item));
                this.update({ activeItems: this._activeItems.map(item => this._itemsToHandles.get(item)) });
            }
            get selectedItems() {
                return this._selectedItems;
            }
            set selectedItems(selectedItems) {
                this._selectedItems = selectedItems.filter(item => this._itemsToHandles.has(item));
                this.update({ selectedItems: this._selectedItems.map(item => this._itemsToHandles.get(item)) });
            }
            _fireDidChangeActive(handles) {
                const items = (0, arrays_1.coalesce)(handles.map(handle => this._handlesToItems.get(handle)));
                this._activeItems = items;
                this._onDidChangeActiveEmitter.fire(items);
            }
            _fireDidChangeSelection(handles) {
                const items = (0, arrays_1.coalesce)(handles.map(handle => this._handlesToItems.get(handle)));
                this._selectedItems = items;
                this._onDidChangeSelectionEmitter.fire(items);
            }
            _fireDidTriggerItemButton(itemHandle, buttonHandle) {
                const item = this._handlesToItems.get(itemHandle);
                if (!item || !item.buttons || !item.buttons.length) {
                    return;
                }
                const button = item.buttons[buttonHandle];
                if (button) {
                    this._onDidTriggerItemButtonEmitter.fire({
                        button,
                        item
                    });
                }
            }
        }
        class ExtHostInputBox extends ExtHostQuickInput {
            constructor(extension, onDispose) {
                super(extension.identifier, onDispose);
                this._password = false;
                this.update({ type: 'inputBox' });
            }
            get password() {
                return this._password;
            }
            set password(password) {
                this._password = password;
                this.update({ password });
            }
            get prompt() {
                return this._prompt;
            }
            set prompt(prompt) {
                this._prompt = prompt;
                this.update({ prompt });
            }
            get valueSelection() {
                return this._valueSelection;
            }
            set valueSelection(valueSelection) {
                this._valueSelection = valueSelection;
                this.update({ valueSelection });
            }
            get validationMessage() {
                return this._validationMessage;
            }
            set validationMessage(validationMessage) {
                this._validationMessage = validationMessage;
                if (!validationMessage) {
                    this.update({ validationMessage: undefined, severity: severity_1.default.Ignore });
                }
                else if (typeof validationMessage === 'string') {
                    this.update({ validationMessage, severity: severity_1.default.Error });
                }
                else {
                    this.update({ validationMessage: validationMessage.message, severity: validationMessage.severity ?? severity_1.default.Error });
                }
            }
        }
        return new ExtHostQuickOpenImpl(workspace, commands);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFF1aWNrT3Blbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RRdWlja09wZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQ2hHLHdEQW10QkM7SUFudEJELFNBQWdCLHNCQUFzQixDQUFDLFdBQXlCLEVBQUUsU0FBb0MsRUFBRSxRQUF5QjtRQUNoSSxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUVwRSxNQUFNLG9CQUFvQjtZQVl6QixZQUFZLFNBQW9DLEVBQUUsUUFBeUI7Z0JBSm5FLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztnQkFFakQsZUFBVSxHQUFHLENBQUMsQ0FBQztnQkFHdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzNCLENBQUM7WUFLRCxhQUFhLENBQUMsU0FBZ0MsRUFBRSxtQkFBNkMsRUFBRSxPQUEwQixFQUFFLFFBQTJCLGdDQUFpQixDQUFDLElBQUk7Z0JBQzNLLG1DQUFtQztnQkFDbkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztnQkFFbEMsTUFBTSxZQUFZLEdBQW9CLE9BQU8sQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFFM0UsTUFBTSxRQUFRLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUVuQyxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtvQkFDN0MsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLO29CQUNyQixXQUFXLEVBQUUsT0FBTyxFQUFFLFdBQVc7b0JB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