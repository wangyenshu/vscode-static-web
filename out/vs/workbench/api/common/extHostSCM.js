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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/base/common/async", "./extHost.protocol", "vs/base/common/arrays", "vs/base/common/comparers", "vs/platform/log/common/log", "vs/platform/extensions/common/extensions", "vs/base/common/themables", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/services/extensions/common/extensions", "vs/base/common/network", "vs/base/common/platform"], function (require, exports, uri_1, event_1, decorators_1, lifecycle_1, async_1, extHost_protocol_1, arrays_1, comparers_1, log_1, extensions_1, themables_1, extHostTypeConverters_1, extensions_2, network_1, platform_1) {
    "use strict";
    var ExtHostSCM_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostSCM = exports.ExtHostSCMInputBox = void 0;
    function isUri(thing) {
        return thing instanceof uri_1.URI;
    }
    function uriEquals(a, b) {
        if (a.scheme === network_1.Schemas.file && b.scheme === network_1.Schemas.file && platform_1.isLinux) {
            return a.toString() === b.toString();
        }
        return a.toString().toLowerCase() === b.toString().toLowerCase();
    }
    function getIconResource(decorations) {
        if (!decorations) {
            return undefined;
        }
        else if (typeof decorations.iconPath === 'string') {
            return uri_1.URI.file(decorations.iconPath);
        }
        else if (uri_1.URI.isUri(decorations.iconPath)) {
            return decorations.iconPath;
        }
        else if (themables_1.ThemeIcon.isThemeIcon(decorations.iconPath)) {
            return decorations.iconPath;
        }
        else {
            return undefined;
        }
    }
    function getHistoryItemIconDto(historyItem) {
        if (!historyItem.icon) {
            return undefined;
        }
        else if (uri_1.URI.isUri(historyItem.icon)) {
            return historyItem.icon;
        }
        else if (themables_1.ThemeIcon.isThemeIcon(historyItem.icon)) {
            return historyItem.icon;
        }
        else {
            const icon = historyItem.icon;
            return { light: icon.light, dark: icon.dark };
        }
    }
    function compareResourceThemableDecorations(a, b) {
        if (!a.iconPath && !b.iconPath) {
            return 0;
        }
        else if (!a.iconPath) {
            return -1;
        }
        else if (!b.iconPath) {
            return 1;
        }
        const aPath = typeof a.iconPath === 'string' ? a.iconPath : uri_1.URI.isUri(a.iconPath) ? a.iconPath.fsPath : a.iconPath.id;
        const bPath = typeof b.iconPath === 'string' ? b.iconPath : uri_1.URI.isUri(b.iconPath) ? b.iconPath.fsPath : b.iconPath.id;
        return (0, comparers_1.comparePaths)(aPath, bPath);
    }
    function compareResourceStatesDecorations(a, b) {
        let result = 0;
        if (a.strikeThrough !== b.strikeThrough) {
            return a.strikeThrough ? 1 : -1;
        }
        if (a.faded !== b.faded) {
            return a.faded ? 1 : -1;
        }
        if (a.tooltip !== b.tooltip) {
            return (a.tooltip || '').localeCompare(b.tooltip || '');
        }
        result = compareResourceThemableDecorations(a, b);
        if (result !== 0) {
            return result;
        }
        if (a.light && b.light) {
            result = compareResourceThemableDecorations(a.light, b.light);
        }
        else if (a.light) {
            return 1;
        }
        else if (b.light) {
            return -1;
        }
        if (result !== 0) {
            return result;
        }
        if (a.dark && b.dark) {
            result = compareResourceThemableDecorations(a.dark, b.dark);
        }
        else if (a.dark) {
            return 1;
        }
        else if (b.dark) {
            return -1;
        }
        return result;
    }
    function compareCommands(a, b) {
        if (a.command !== b.command) {
            return a.command < b.command ? -1 : 1;
        }
        if (a.title !== b.title) {
            return a.title < b.title ? -1 : 1;
        }
        if (a.tooltip !== b.tooltip) {
            if (a.tooltip !== undefined && b.tooltip !== undefined) {
                return a.tooltip < b.tooltip ? -1 : 1;
            }
            else if (a.tooltip !== undefined) {
                return 1;
            }
            else if (b.tooltip !== undefined) {
                return -1;
            }
        }
        if (a.arguments === b.arguments) {
            return 0;
        }
        else if (!a.arguments) {
            return -1;
        }
        else if (!b.arguments) {
            return 1;
        }
        else if (a.arguments.length !== b.arguments.length) {
            return a.arguments.length - b.arguments.length;
        }
        for (let i = 0; i < a.arguments.length; i++) {
            const aArg = a.arguments[i];
            const bArg = b.arguments[i];
            if (aArg === bArg) {
                continue;
            }
            if (isUri(aArg) && isUri(bArg) && uriEquals(aArg, bArg)) {
                continue;
            }
            return aArg < bArg ? -1 : 1;
        }
        return 0;
    }
    function compareResourceStates(a, b) {
        let result = (0, comparers_1.comparePaths)(a.resourceUri.fsPath, b.resourceUri.fsPath, true);
        if (result !== 0) {
            return result;
        }
        if (a.command && b.command) {
            result = compareCommands(a.command, b.command);
        }
        else if (a.command) {
            return 1;
        }
        else if (b.command) {
            return -1;
        }
        if (result !== 0) {
            return result;
        }
        if (a.decorations && b.decorations) {
            result = compareResourceStatesDecorations(a.decorations, b.decorations);
        }
        else if (a.decorations) {
            return 1;
        }
        else if (b.decorations) {
            return -1;
        }
        if (a.multiFileDiffEditorModifiedUri && b.multiFileDiffEditorModifiedUri) {
            result = (0, comparers_1.comparePaths)(a.multiFileDiffEditorModifiedUri.fsPath, b.multiFileDiffEditorModifiedUri.fsPath, true);
        }
        else if (a.multiFileDiffEditorModifiedUri) {
            return 1;
        }
        else if (b.multiFileDiffEditorModifiedUri) {
            return -1;
        }
        if (a.multiDiffEditorOriginalUri && b.multiDiffEditorOriginalUri) {
            result = (0, comparers_1.comparePaths)(a.multiDiffEditorOriginalUri.fsPath, b.multiDiffEditorOriginalUri.fsPath, true);
        }
        else if (a.multiDiffEditorOriginalUri) {
            return 1;
        }
        else if (b.multiDiffEditorOriginalUri) {
            return -1;
        }
        return result;
    }
    function compareArgs(a, b) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    function commandEquals(a, b) {
        return a.command === b.command
            && a.title === b.title
            && a.tooltip === b.tooltip
            && (a.arguments && b.arguments ? compareArgs(a.arguments, b.arguments) : a.arguments === b.arguments);
    }
    function commandListEquals(a, b) {
        return (0, arrays_1.equals)(a, b, commandEquals);
    }
    class ExtHostSCMInputBox {
        #proxy;
        #extHostDocuments;
        get value() {
            return this._value;
        }
        set value(value) {
            value = value ?? '';
            this.#proxy.$setInputBoxValue(this._sourceControlHandle, value);
            this.updateValue(value);
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this.#proxy.$setInputBoxPlaceholder(this._sourceControlHandle, placeholder);
            this._placeholder = placeholder;
        }
        get validateInput() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            return this._validateInput;
        }
        set validateInput(fn) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            if (fn && typeof fn !== 'function') {
                throw new Error(`[${this._extension.identifier.value}]: Invalid SCM input box validation function`);
            }
            this._validateInput = fn;
            this.#proxy.$setValidationProviderIsEnabled(this._sourceControlHandle, !!fn);
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            enabled = !!enabled;
            if (this._enabled === enabled) {
                return;
            }
            this._enabled = enabled;
            this.#proxy.$setInputBoxEnablement(this._sourceControlHandle, enabled);
        }
        get visible() {
            return this._visible;
        }
        set visible(visible) {
            visible = !!visible;
            if (this._visible === visible) {
                return;
            }
            this._visible = visible;
            this.#proxy.$setInputBoxVisibility(this._sourceControlHandle, visible);
        }
        get document() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmTextDocument');
            return this.#extHostDocuments.getDocument(this._documentUri);
        }
        constructor(_extension, _extHostDocuments, proxy, _sourceControlHandle, _documentUri) {
            this._extension = _extension;
            this._sourceControlHandle = _sourceControlHandle;
            this._documentUri = _documentUri;
            this._value = '';
            this._onDidChange = new event_1.Emitter();
            this._placeholder = '';
            this._enabled = true;
            this._visible = true;
            this.#extHostDocuments = _extHostDocuments;
            this.#proxy = proxy;
        }
        showValidationMessage(message, type) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmValidation');
            this.#proxy.$showValidationMessage(this._sourceControlHandle, message, type);
        }
        $onInputBoxValueChange(value) {
            this.updateValue(value);
        }
        updateValue(value) {
            this._value = value;
            this._onDidChange.fire(value);
        }
    }
    exports.ExtHostSCMInputBox = ExtHostSCMInputBox;
    class ExtHostSourceControlResourceGroup {
        static { this._handlePool = 0; }
        get disposed() { return this._disposed; }
        get id() { return this._id; }
        get label() { return this._label; }
        set label(label) {
            this._label = label;
            this._proxy.$updateGroupLabel(this._sourceControlHandle, this.handle, label);
        }
        get hideWhenEmpty() { return this._hideWhenEmpty; }
        set hideWhenEmpty(hideWhenEmpty) {
            this._hideWhenEmpty = hideWhenEmpty;
            this._proxy.$updateGroup(this._sourceControlHandle, this.handle, this.features);
        }
        get features() {
            return {
                hideWhenEmpty: this.hideWhenEmpty
            };
        }
        get resourceStates() { return [...this._resourceStates]; }
        set resourceStates(resources) {
            this._resourceStates = [...resources];
            this._onDidUpdateResourceStates.fire();
        }
        constructor(_proxy, _commands, _sourceControlHandle, _id, _label, multiDiffEditorEnableViewChanges, _extension) {
            this._proxy = _proxy;
            this._commands = _commands;
            this._sourceControlHandle = _sourceControlHandle;
            this._id = _id;
            this._label = _label;
            this.multiDiffEditorEnableViewChanges = multiDiffEditorEnableViewChanges;
            this._extension = _extension;
            this._resourceHandlePool = 0;
            this._resourceStates = [];
            this._resourceStatesMap = new Map();
            this._resourceStatesCommandsMap = new Map();
            this._resourceStatesDisposablesMap = new Map();
            this._onDidUpdateResourceStates = new event_1.Emitter();
            this.onDidUpdateResourceStates = this._onDidUpdateResourceStates.event;
            this._disposed = false;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this._handlesSnapshot = [];
            this._resourceSnapshot = [];
            this._hideWhenEmpty = undefined;
            this.handle = ExtHostSourceControlResourceGroup._handlePool++;
        }
        getResourceState(handle) {
            return this._resourceStatesMap.get(handle);
        }
        $executeResourceCommand(handle, preserveFocus) {
            const command = this._resourceStatesCommandsMap.get(handle);
            if (!command) {
                return Promise.resolve(undefined);
            }
            return (0, async_1.asPromise)(() => this._commands.executeCommand(command.command, ...(command.arguments || []), preserveFocus));
        }
        _takeResourceStateSnapshot() {
            const snapshot = [...this._resourceStates].sort(compareResourceStates);
            const diffs = (0, arrays_1.sortedDiff)(this._resourceSnapshot, snapshot, compareResourceStates);
            const splices = diffs.map(diff => {
                const toInsert = diff.toInsert.map(r => {
                    const handle = this._resourceHandlePool++;
                    this._resourceStatesMap.set(handle, r);
                    const sourceUri = r.resourceUri;
                    let command;
                    if (r.command) {
                        if (r.command.command === 'vscode.open' || r.command.command === 'vscode.diff' || r.command.command === 'vscode.changes') {
                            const disposables = new lifecycle_1.DisposableStore();
                            command = this._commands.converter.toInternal(r.command, disposables);
                            this._resourceStatesDisposablesMap.set(handle, disposables);
                        }
                        else {
                            this._resourceStatesCommandsMap.set(handle, r.command);
                        }
                    }
                    const hasScmMultiDiffEditorProposalEnabled = (0, extensions_2.isProposedApiEnabled)(this._extension, 'scmMultiDiffEditor');
                    const multiFileDiffEditorOriginalUri = hasScmMultiDiffEditorProposalEnabled ? r.multiDiffEditorOriginalUri : undefined;
                    const multiFileDiffEditorModifiedUri = hasScmMultiDiffEditorProposalEnabled ? r.multiFileDiffEditorModifiedUri : undefined;
                    const icon = getIconResource(r.decorations);
                    const lightIcon = r.decorations && getIconResource(r.decorations.light) || icon;
                    const darkIcon = r.decorations && getIconResource(r.decorations.dark) || icon;
                    const icons = [lightIcon, darkIcon];
                    const tooltip = (r.decorations && r.decorations.tooltip) || '';
                    const strikeThrough = r.decorations && !!r.decorations.strikeThrough;
                    const faded = r.decorations && !!r.decorations.faded;
                    const contextValue = r.contextValue || '';
                    const rawResource = [handle, sourceUri, icons, tooltip, strikeThrough, faded, contextValue, command, multiFileDiffEditorOriginalUri, multiFileDiffEditorModifiedUri];
                    return { rawResource, handle };
                });
                return { start: diff.start, deleteCount: diff.deleteCount, toInsert };
            });
            const rawResourceSplices = splices
                .map(({ start, deleteCount, toInsert }) => [start, deleteCount, toInsert.map(i => i.rawResource)]);
            const reverseSplices = splices.reverse();
            for (const { start, deleteCount, toInsert } of reverseSplices) {
                const handles = toInsert.map(i => i.handle);
                const handlesToDelete = this._handlesSnapshot.splice(start, deleteCount, ...handles);
                for (const handle of handlesToDelete) {
                    this._resourceStatesMap.delete(handle);
                    this._resourceStatesCommandsMap.delete(handle);
                    this._resourceStatesDisposablesMap.get(handle)?.dispose();
                    this._resourceStatesDisposablesMap.delete(handle);
                }
            }
            this._resourceSnapshot = snapshot;
            return rawResourceSplices;
        }
        dispose() {
            this._disposed = true;
            this._onDidDispose.fire();
        }
    }
    class ExtHostSourceControl {
        static { this._handlePool = 0; }
        #proxy;
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        get rootUri() {
            return this._rootUri;
        }
        get inputBox() { return this._inputBox; }
        get count() {
            return this._count;
        }
        set count(count) {
            if (this._count === count) {
                return;
            }
            this._count = count;
            this.#proxy.$updateSourceControl(this.handle, { count });
        }
        get quickDiffProvider() {
            return this._quickDiffProvider;
        }
        set quickDiffProvider(quickDiffProvider) {
            this._quickDiffProvider = quickDiffProvider;
            let quickDiffLabel = undefined;
            if ((0, extensions_2.isProposedApiEnabled)(this._extension, 'quickDiffProvider')) {
                quickDiffLabel = quickDiffProvider?.label;
            }
            this.#proxy.$updateSourceControl(this.handle, { hasQuickDiffProvider: !!quickDiffProvider, quickDiffLabel });
        }
        get historyProvider() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmHistoryProvider');
            return this._historyProvider;
        }
        set historyProvider(historyProvider) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmHistoryProvider');
            this._historyProvider = historyProvider;
            this._historyProviderDisposable.value = new lifecycle_1.DisposableStore();
            this.#proxy.$updateSourceControl(this.handle, { hasHistoryProvider: !!historyProvider });
            if (historyProvider) {
                this._historyProviderDisposable.value.add(historyProvider.onDidChangeCurrentHistoryItemGroup(() => {
                    this._historyProviderCurrentHistoryItemGroup = historyProvider?.currentHistoryItemGroup;
                    this.#proxy.$onDidChangeHistoryProviderCurrentHistoryItemGroup(this.handle, this._historyProviderCurrentHistoryItemGroup);
                }));
            }
        }
        get commitTemplate() {
            return this._commitTemplate;
        }
        set commitTemplate(commitTemplate) {
            if (commitTemplate === this._commitTemplate) {
                return;
            }
            this._commitTemplate = commitTemplate;
            this.#proxy.$updateSourceControl(this.handle, { commitTemplate });
        }
        get acceptInputCommand() {
            return this._acceptInputCommand;
        }
        set acceptInputCommand(acceptInputCommand) {
            this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
            this._acceptInputCommand = acceptInputCommand;
            const internal = this._commands.converter.toInternal(acceptInputCommand, this._acceptInputDisposables.value);
            this.#proxy.$updateSourceControl(this.handle, { acceptInputCommand: internal });
        }
        get actionButton() {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmActionButton');
            return this._actionButton;
        }
        set actionButton(actionButton) {
            (0, extensions_2.checkProposedApiEnabled)(this._extension, 'scmActionButton');
            this._actionButtonDisposables.value = new lifecycle_1.DisposableStore();
            this._actionButton = actionButton;
            const internal = actionButton !== undefined ?
                {
                    command: this._commands.converter.toInternal(actionButton.command, this._actionButtonDisposables.value),
                    secondaryCommands: actionButton.secondaryCommands?.map(commandGroup => {
                        return commandGroup.map(command => this._commands.converter.toInternal(command, this._actionButtonDisposables.value));
                    }),
                    description: actionButton.description,
                    enabled: actionButton.enabled
                } : undefined;
            this.#proxy.$updateSourceControl(this.handle, { actionButton: internal ?? null });
        }
        get statusBarCommands() {
            return this._statusBarCommands;
        }
        set statusBarCommands(statusBarCommands) {
            if (this._statusBarCommands && statusBarCommands && commandListEquals(this._statusBarCommands, statusBarCommands)) {
                return;
            }
            this._statusBarDisposables.value = new lifecycle_1.DisposableStore();
            this._statusBarCommands = statusBarCommands;
            const internal = (statusBarCommands || []).map(c => this._commands.converter.toInternal(c, this._statusBarDisposables.value));
            this.#proxy.$updateSourceControl(this.handle, { statusBarCommands: internal });
        }
        get selected() {
            return this._selected;
        }
        constructor(_extension, _extHostDocuments, proxy, _commands, _id, _label, _rootUri) {
            this._extension = _extension;
            this._commands = _commands;
            this._id = _id;
            this._label = _label;
            this._rootUri = _rootUri;
            this._groups = new Map();
            this._count = undefined;
            this._quickDiffProvider = undefined;
            this._historyProviderDisposable = new lifecycle_1.MutableDisposable();
            this._commitTemplate = undefined;
            this._acceptInputDisposables = new lifecycle_1.MutableDisposable();
            this._acceptInputCommand = undefined;
            this._actionButtonDisposables = new lifecycle_1.MutableDisposable();
            this._statusBarDisposables = new lifecycle_1.MutableDisposable();
            this._statusBarCommands = undefined;
            this._selected = false;
            this._onDidChangeSelection = new event_1.Emitter();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this.handle = ExtHostSourceControl._handlePool++;
            this.createdResourceGroups = new Map();
            this.updatedResourceGroups = new Set();
            this.#proxy = proxy;
            const inputBoxDocumentUri = uri_1.URI.from({
                scheme: network_1.Schemas.vscodeSourceControl,
                path: `${_id}/scm${this.handle}/input`,
                query: _rootUri ? `rootUri=${encodeURIComponent(_rootUri.toString())}` : undefined
            });
            this._inputBox = new ExtHostSCMInputBox(_extension, _extHostDocuments, this.#proxy, this.handle, inputBoxDocumentUri);
            this.#proxy.$registerSourceControl(this.handle, _id, _label, _rootUri, inputBoxDocumentUri);
        }
        createResourceGroup(id, label, options) {
            const multiDiffEditorEnableViewChanges = (0, extensions_2.isProposedApiEnabled)(this._extension, 'scmMultiDiffEditor') && options?.multiDiffEditorEnableViewChanges === true;
            const group = new ExtHostSourceControlResourceGroup(this.#proxy, this._commands, this.handle, id, label, multiDiffEditorEnableViewChanges, this._extension);
            const disposable = event_1.Event.once(group.onDidDispose)(() => this.createdResourceGroups.delete(group));
            this.createdResourceGroups.set(group, disposable);
            this.eventuallyAddResourceGroups();
            return group;
        }
        eventuallyAddResourceGroups() {
            const groups = [];
            const splices = [];
            for (const [group, disposable] of this.createdResourceGroups) {
                disposable.dispose();
                const updateListener = group.onDidUpdateResourceStates(() => {
                    this.updatedResourceGroups.add(group);
                    this.eventuallyUpdateResourceStates();
                });
                event_1.Event.once(group.onDidDispose)(() => {
                    this.updatedResourceGroups.delete(group);
                    updateListener.dispose();
                    this._groups.delete(group.handle);
                    this.#proxy.$unregisterGroup(this.handle, group.handle);
                });
                groups.push([group.handle, group.id, group.label, group.features, group.multiDiffEditorEnableViewChanges]);
                const snapshot = group._takeResourceStateSnapshot();
                if (snapshot.length > 0) {
                    splices.push([group.handle, snapshot]);
                }
                this._groups.set(group.handle, group);
            }
            this.#proxy.$registerGroups(this.handle, groups, splices);
            this.createdResourceGroups.clear();
        }
        eventuallyUpdateResourceStates() {
            const splices = [];
            this.updatedResourceGroups.forEach(group => {
                const snapshot = group._takeResourceStateSnapshot();
                if (snapshot.length === 0) {
                    return;
                }
                splices.push([group.handle, snapshot]);
            });
            if (splices.length > 0) {
                this.#proxy.$spliceResourceStates(this.handle, splices);
            }
            this.updatedResourceGroups.clear();
        }
        getResourceGroup(handle) {
            return this._groups.get(handle);
        }
        setSelectionState(selected) {
            this._selected = selected;
            this._onDidChangeSelection.fire(selected);
        }
        dispose() {
            this._acceptInputDisposables.dispose();
            this._actionButtonDisposables.dispose();
            this._statusBarDisposables.dispose();
            this._groups.forEach(group => group.dispose());
            this.#proxy.$unregisterSourceControl(this.handle);
        }
    }
    __decorate([
        (0, decorators_1.debounce)(100)
    ], ExtHostSourceControl.prototype, "eventuallyAddResourceGroups", null);
    __decorate([
        (0, decorators_1.debounce)(100)
    ], ExtHostSourceControl.prototype, "eventuallyUpdateResourceStates", null);
    let ExtHostSCM = class ExtHostSCM {
        static { ExtHostSCM_1 = this; }
        static { this._handlePool = 0; }
        get onDidChangeActiveProvider() { return this._onDidChangeActiveProvider.event; }
        constructor(mainContext, _commands, _extHostDocuments, logService) {
            this._commands = _commands;
            this._extHostDocuments = _extHostDocuments;
            this.logService = logService;
            this._sourceControls = new Map();
            this._sourceControlsByExtension = new extensions_1.ExtensionIdentifierMap();
            this._onDidChangeActiveProvider = new event_1.Emitter();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadSCM);
            this._telemetry = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            _commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (arg && arg.$mid === 3 /* MarshalledId.ScmResource */) {
                        const sourceControl = this._sourceControls.get(arg.sourceControlHandle);
                        if (!sourceControl) {
                            return arg;
                        }
                        const group = sourceControl.getResourceGroup(arg.groupHandle);
                        if (!group) {
                            return arg;
                        }
                        return group.getResourceState(arg.handle);
                    }
                    else if (arg && arg.$mid === 4 /* MarshalledId.ScmResourceGroup */) {
                        const sourceControl = this._sourceControls.get(arg.sourceControlHandle);
                        if (!sourceControl) {
                            return arg;
                        }
                        return sourceControl.getResourceGroup(arg.groupHandle);
                    }
                    else if (arg && arg.$mid === 5 /* MarshalledId.ScmProvider */) {
                        const sourceControl = this._sourceControls.get(arg.handle);
                        if (!sourceControl) {
                            return arg;
                        }
                        return sourceControl;
                    }
                    return arg;
                }
            });
        }
        createSourceControl(extension, id, label, rootUri) {
            this.logService.trace('ExtHostSCM#createSourceControl', extension.identifier.value, id, label, rootUri);
            this._telemetry.$publicLog2('api/scm/createSourceControl', {
                extensionId: extension.identifier.value,
            });
            const handle = ExtHostSCM_1._handlePool++;
            const sourceControl = new ExtHostSourceControl(extension, this._extHostDocuments, this._proxy, this._commands, id, label, rootUri);
            this._sourceControls.set(handle, sourceControl);
            const sourceControls = this._sourceControlsByExtension.get(extension.identifier) || [];
            sourceControls.push(sourceControl);
            this._sourceControlsByExtension.set(extension.identifier, sourceControls);
            return sourceControl;
        }
        // Deprecated
        getLastInputBox(extension) {
            this.logService.trace('ExtHostSCM#getLastInputBox', extension.identifier.value);
            const sourceControls = this._sourceControlsByExtension.get(extension.identifier);
            const sourceControl = sourceControls && sourceControls[sourceControls.length - 1];
            return sourceControl && sourceControl.inputBox;
        }
        $provideOriginalResource(sourceControlHandle, uriComponents, token) {
            const uri = uri_1.URI.revive(uriComponents);
            this.logService.trace('ExtHostSCM#$provideOriginalResource', sourceControlHandle, uri.toString());
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl || !sourceControl.quickDiffProvider || !sourceControl.quickDiffProvider.provideOriginalResource) {
                return Promise.resolve(null);
            }
            return (0, async_1.asPromise)(() => sourceControl.quickDiffProvider.provideOriginalResource(uri, token))
                .then(r => r || null);
        }
        $onInputBoxValueChange(sourceControlHandle, value) {
            this.logService.trace('ExtHostSCM#$onInputBoxValueChange', sourceControlHandle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            sourceControl.inputBox.$onInputBoxValueChange(value);
            return Promise.resolve(undefined);
        }
        $executeResourceCommand(sourceControlHandle, groupHandle, handle, preserveFocus) {
            this.logService.trace('ExtHostSCM#$executeResourceCommand', sourceControlHandle, groupHandle, handle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            const group = sourceControl.getResourceGroup(groupHandle);
            if (!group) {
                return Promise.resolve(undefined);
            }
            return group.$executeResourceCommand(handle, preserveFocus);
        }
        $validateInput(sourceControlHandle, value, cursorPosition) {
            this.logService.trace('ExtHostSCM#$validateInput', sourceControlHandle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            if (!sourceControl.inputBox.validateInput) {
                return Promise.resolve(undefined);
            }
            return (0, async_1.asPromise)(() => sourceControl.inputBox.validateInput(value, cursorPosition)).then(result => {
                if (!result) {
                    return Promise.resolve(undefined);
                }
                const message = extHostTypeConverters_1.MarkdownString.fromStrict(result.message);
                if (!message) {
                    return Promise.resolve(undefined);
                }
                return Promise.resolve([message, result.type]);
            });
        }
        $setSelectedSourceControl(selectedSourceControlHandle) {
            this.logService.trace('ExtHostSCM#$setSelectedSourceControl', selectedSourceControlHandle);
            if (selectedSourceControlHandle !== undefined) {
                this._sourceControls.get(selectedSourceControlHandle)?.setSelectionState(true);
            }
            if (this._selectedSourceControlHandle !== undefined) {
                this._sourceControls.get(this._selectedSourceControlHandle)?.setSelectionState(false);
            }
            this._selectedSourceControlHandle = selectedSourceControlHandle;
            return Promise.resolve(undefined);
        }
        async $resolveHistoryItemGroupCommonAncestor(sourceControlHandle, historyItemGroupId1, historyItemGroupId2, token) {
            const historyProvider = this._sourceControls.get(sourceControlHandle)?.historyProvider;
            return await historyProvider?.resolveHistoryItemGroupCommonAncestor(historyItemGroupId1, historyItemGroupId2, token) ?? undefined;
        }
        async $provideHistoryItems(sourceControlHandle, historyItemGroupId, options, token) {
            const historyProvider = this._sourceControls.get(sourceControlHandle)?.historyProvider;
            const historyItems = await historyProvider?.provideHistoryItems(historyItemGroupId, options, token);
            return historyItems?.map(item => ({ ...item, icon: getHistoryItemIconDto(item) })) ?? undefined;
        }
        async $provideHistoryItemSummary(sourceControlHandle, historyItemId, historyItemParentId, token) {
            const historyProvider = this._sourceControls.get(sourceControlHandle)?.historyProvider;
            if (typeof historyProvider?.provideHistoryItemSummary !== 'function') {
                return undefined;
            }
            const historyItem = await historyProvider.provideHistoryItemSummary(historyItemId, historyItemParentId, token);
            return historyItem ? { ...historyItem, icon: getHistoryItemIconDto(historyItem) } : undefined;
        }
        async $provideHistoryItemChanges(sourceControlHandle, historyItemId, historyItemParentId, token) {
            const historyProvider = this._sourceControls.get(sourceControlHandle)?.historyProvider;
            return await historyProvider?.provideHistoryItemChanges(historyItemId, historyItemParentId, token) ?? undefined;
        }
    };
    exports.ExtHostSCM = ExtHostSCM;
    exports.ExtHostSCM = ExtHostSCM = ExtHostSCM_1 = __decorate([
        __param(3, log_1.ILogService)
    ], ExtHostSCM);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNDTS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RTQ00udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStCaEcsU0FBUyxLQUFLLENBQUMsS0FBVTtRQUN4QixPQUFPLEtBQUssWUFBWSxTQUFHLENBQUM7SUFDN0IsQ0FBQztJQUVELFNBQVMsU0FBUyxDQUFDLENBQWEsRUFBRSxDQUFhO1FBQzlDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxJQUFJLGtCQUFPLEVBQUUsQ0FBQztZQUN2RSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUVELE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNsRSxDQUFDO0lBRUQsU0FBUyxlQUFlLENBQUMsV0FBNkQ7UUFDckYsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7YUFBTSxJQUFJLE9BQU8sV0FBVyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNyRCxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7YUFBTSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDNUMsT0FBTyxXQUFXLENBQUMsUUFBUSxDQUFDO1FB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