/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/base/browser/event", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/base/browser/keyboardEvent", "vs/base/common/async", "vs/platform/layout/browser/layoutService", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/storage/common/storage", "vs/base/common/numbers", "vs/platform/configuration/common/configurationRegistry", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/output/common/output", "vs/workbench/services/log/common/logConstants", "vs/platform/files/common/files", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/editor/common/editorService", "vs/platform/product/common/product", "vs/platform/commands/common/commands", "vs/platform/environment/common/environment", "vs/css!./media/actions"], function (require, exports, nls_1, keybinding_1, event_1, color_1, event_2, lifecycle_1, dom_1, configuration_1, contextkey_1, keyboardEvent_1, async_1, layoutService_1, platform_1, actions_1, storage_1, numbers_1, configurationRegistry_1, log_1, workingCopyService_1, actionCommonCategories_1, workingCopyBackup_1, dialogs_1, output_1, logConstants_1, files_1, quickInput_1, userDataProfile_1, editorService_1, product_1, commands_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class InspectContextKeysAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.inspectContextKeys',
                title: (0, nls_1.localize2)('inspect context keys', 'Inspect Context Keys'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const disposables = new lifecycle_1.DisposableStore();
            const stylesheet = (0, dom_1.createStyleSheet)(undefined, undefined, disposables);
            (0, dom_1.createCSSRule)('*', 'cursor: crosshair !important;', stylesheet);
            const hoverFeedback = document.createElement('div');
            const activeDocument = (0, dom_1.getActiveDocument)();
            activeDocument.body.appendChild(hoverFeedback);
            disposables.add((0, lifecycle_1.toDisposable)(() => activeDocument.body.removeChild(hoverFeedback)));
            hoverFeedback.style.position = 'absolute';
            hoverFeedback.style.pointerEvents = 'none';
            hoverFeedback.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            hoverFeedback.style.zIndex = '1000';
            const onMouseMove = disposables.add(new event_1.DomEmitter(activeDocument, 'mousemove', true));
            disposables.add(onMouseMove.event(e => {
                const target = e.target;
                const position = (0, dom_1.getDomNodePagePosition)(target);
                hoverFeedback.style.top = `${position.top}px`;
                hoverFeedback.style.left = `${position.left}px`;
                hoverFeedback.style.width = `${position.width}px`;
                hoverFeedback.style.height = `${position.height}px`;
            }));
            const onMouseDown = disposables.add(new event_1.DomEmitter(activeDocument, 'mousedown', true));
            event_2.Event.once(onMouseDown.event)(e => { e.preventDefault(); e.stopPropagation(); }, null, disposables);
            const onMouseUp = disposables.add(new event_1.DomEmitter(activeDocument, 'mouseup', true));
            event_2.Event.once(onMouseUp.event)(e => {
                e.preventDefault();
                e.stopPropagation();
                const context = contextKeyService.getContext(e.target);
                console.log(context.collectAllValues());
                (0, lifecycle_1.dispose)(disposables);
            }, null, disposables);
        }
    }
    class ToggleScreencastModeAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleScreencastMode',
                title: (0, nls_1.localize2)('toggle screencast mode', 'Toggle Screencast Mode'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            if (ToggleScreencastModeAction.disposable) {
                ToggleScreencastModeAction.disposable.dispose();
                ToggleScreencastModeAction.disposable = undefined;
                return;
            }
            const layoutService = accessor.get(layoutService_1.ILayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const disposables = new lifecycle_1.DisposableStore();
            const container = layoutService.activeContainer;
            const mouseMarker = (0, dom_1.append)(container, (0, dom_1.$)('.screencast-mouse'));
            disposables.add((0, lifecycle_1.toDisposable)(() => mouseMarker.remove()));
            const keyboardMarker = (0, dom_1.append)(container, (0, dom_1.$)('.screencast-keyboard'));
            disposables.add((0, lifecycle_1.toDisposable)(() => keyboardMarker.remove()));
            const onMouseDown = disposables.add(new event_2.Emitter());
            const onMouseUp = disposables.add(new event_2.Emitter());
            const onMouseMove = disposables.add(new event_2.Emitter());
            function registerContainerListeners(container, disposables) {
                disposables.add(disposables.add(new event_1.DomEmitter(container, 'mousedown', true)).event(e => onMouseDown.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(container, 'mouseup', true)).event(e => onMouseUp.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(container, 'mousemove', true)).event(e => onMouseMove.fire(e)));
            }
            for (const { window, disposables } of (0, dom_1.getWindows)()) {
                registerContainerListeners(layoutService.getContainer(window), disposables);
            }
            disposables.add((0, dom_1.onDidRegisterWindow)(({ window, disposables }) => registerContainerListeners(layoutService.getContainer(window), disposables)));
            disposables.add(layoutService.onDidChangeActiveContainer(() => {
                layoutService.activeContainer.appendChild(mouseMarker);
                layoutService.activeContainer.appendChild(keyboardMarker);
            }));
            const updateMouseIndicatorColor = () => {
                mouseMarker.style.borderColor = color_1.Color.fromHex(configurationService.getValue('screencastMode.mouseIndicatorColor')).toString();
            };
            let mouseIndicatorSize;
            const updateMouseIndicatorSize = () => {
                mouseIndicatorSize = (0, numbers_1.clamp)(configurationService.getValue('screencastMode.mouseIndicatorSize') || 20, 20, 100);
                mouseMarker.style.height = `${mouseIndicatorSize}px`;
                mouseMarker.style.width = `${mouseIndicatorSize}px`;
            };
            updateMouseIndicatorColor();
            updateMouseIndicatorSize();
            disposables.add(onMouseDown.event(e => {
                mouseMarker.style.top = `${e.clientY - mouseIndicatorSize / 2}px`;
                mouseMarker.style.left = `${e.clientX - mouseIndicatorSize / 2}px`;
                mouseMarker.style.display = 'block';
                mouseMarker.style.transform = `scale(${1})`;
                mouseMarker.style.transition = 'transform 0.1s';
                const mouseMoveListener = onMouseMove.event(e => {
                    mouseMarker.style.top = `${e.clientY - mouseIndicatorSize / 2}px`;
                    mouseMarker.style.left = `${e.clientX - mouseIndicatorSize / 2}px`;
                    mouseMarker.style.transform = `scale(${.8})`;
                });
                event_2.Event.once(onMouseUp.event)(() => {
                    mouseMarker.style.display = 'none';
                    mouseMoveListener.dispose();
                });
            }));
            const updateKeyboardFontSize = () => {
                keyboardMarker.style.fontSize = `${(0, numbers_1.clamp)(configurationService.getValue('screencastMode.fontSize') || 56, 20, 100)}px`;
            };
            const updateKeyboardMarker = () => {
                keyboardMarker.style.bottom = `${(0, numbers_1.clamp)(configurationService.getValue('screencastMode.verticalOffset') || 0, 0, 90)}%`;
            };
            let keyboardMarkerTimeout;
            const updateKeyboardMarkerTimeout = () => {
                keyboardMarkerTimeout = (0, numbers_1.clamp)(configurationService.getValue('screencastMode.keyboardOverlayTimeout') || 800, 500, 5000);
            };
            updateKeyboardFontSize();
            updateKeyboardMarker();
            updateKeyboardMarkerTimeout();
            disposables.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('screencastMode.verticalOffset')) {
                    updateKeyboardMarker();
                }
                if (e.affectsConfiguration('screencastMode.fontSize')) {
                    updateKeyboardFontSize();
                }
                if (e.affectsConfiguration('screencastMode.keyboardOverlayTimeout')) {
                    updateKeyboardMarkerTimeout();
                }
                if (e.affectsConfiguration('screencastMode.mouseIndicatorColor')) {
                    updateMouseIndicatorColor();
                }
                if (e.affectsConfiguration('screencastMode.mouseIndicatorSize')) {
                    updateMouseIndicatorSize();
                }
            }));
            const onKeyDown = disposables.add(new event_2.Emitter());
            const onCompositionStart = disposables.add(new event_2.Emitter());
            const onCompositionUpdate = disposables.add(new event_2.Emitter());
            const onCompositionEnd = disposables.add(new event_2.Emitter());
            function registerWindowListeners(window, disposables) {
                disposables.add(disposables.add(new event_1.DomEmitter(window, 'keydown', true)).event(e => onKeyDown.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(window, 'compositionstart', true)).event(e => onCompositionStart.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(window, 'compositionupdate', true)).event(e => onCompositionUpdate.fire(e)));
                disposables.add(disposables.add(new event_1.DomEmitter(window, 'compositionend', true)).event(e => onCompositionEnd.fire(e)));
            }
            for (const { window, disposables } of (0, dom_1.getWindows)()) {
                registerWindowListeners(window, disposables);
            }
            disposables.add((0, dom_1.onDidRegisterWindow)(({ window, disposables }) => registerWindowListeners(window, disposables)));
            let length = 0;
            let composing = undefined;
            let imeBackSpace = false;
            const clearKeyboardScheduler = new async_1.RunOnceScheduler(() => {
                keyboardMarker.textContent = '';
                composing = undefined;
                length = 0;
            }, keyboardMarkerTimeout);
            disposables.add(onCompositionStart.event(e => {
                imeBackSpace = true;
            }));
            disposables.add(onCompositionUpdate.event(e => {
                if (e.data && imeBackSpace) {
                    if (length > 20) {
                        keyboardMarker.innerText = '';
                        length = 0;
                    }
                    composing = composing ?? (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.key'));
                    composing.textContent = e.data;
                }
                else if (imeBackSpace) {
                    keyboardMarker.innerText = '';
                    (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.key', {}, `Backspace`));
                }
                clearKeyboardScheduler.schedule();
            }));
            disposables.add(onCompositionEnd.event(e => {
                composing = undefined;
                length++;
            }));
            disposables.add(onKeyDown.event(e => {
                if (e.key === 'Process' || /[\uac00-\ud787\u3131-\u314e\u314f-\u3163\u3041-\u3094\u30a1-\u30f4\u30fc\u3005\u3006\u3024\u4e00-\u9fa5]/u.test(e.key)) {
                    if (e.code === 'Backspace') {
                        imeBackSpace = true;
                    }
                    else if (!e.code.includes('Key')) {
                        composing = undefined;
                        imeBackSpace = false;
                    }
                    else {
                        imeBackSpace = true;
                    }
                    clearKeyboardScheduler.schedule();
                    return;
                }
                if (e.isComposing) {
                    return;
                }
                const options = configurationService.getValue('screencastMode.keyboardOptions');
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                const shortcut = keybindingService.softDispatch(event, event.target);
                // Hide the single arrow key pressed
                if (shortcut.kind === 2 /* ResultKind.KbFound */ && shortcut.commandId && !(options.showSingleEditorCursorMoves ?? true) && (['cursorLeft', 'cursorRight', 'cursorUp', 'cursorDown'].includes(shortcut.commandId))) {
                    return;
                }
                if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
                    || length > 20
                    || event.keyCode === 1 /* KeyCode.Backspace */ || event.keyCode === 9 /* KeyCode.Escape */
                    || event.keyCode === 16 /* KeyCode.UpArrow */ || event.keyCode === 18 /* KeyCode.DownArrow */
                    || event.keyCode === 15 /* KeyCode.LeftArrow */ || event.keyCode === 17 /* KeyCode.RightArrow */) {
                    keyboardMarker.innerText = '';
                    length = 0;
                }
                const keybinding = keybindingService.resolveKeyboardEvent(event);
                const commandDetails = (this._isKbFound(shortcut) && shortcut.commandId) ? this.getCommandDetails(shortcut.commandId) : undefined;
                let commandAndGroupLabel = commandDetails?.title;
                let keyLabel = keybinding.getLabel();
                if (commandDetails) {
                    if ((options.showCommandGroups ?? false) && commandDetails.category) {
                        commandAndGroupLabel = `${commandDetails.category}: ${commandAndGroupLabel} `;
                    }
                    if (this._isKbFound(shortcut) && shortcut.commandId) {
                        const keybindings = keybindingService.lookupKeybindings(shortcut.commandId)
                            .filter(k => k.getLabel()?.endsWith(keyLabel ?? ''));
                        if (keybindings.length > 0) {
                            keyLabel = keybindings[keybindings.length - 1].getLabel();
                        }
                    }
                }
                if ((options.showCommands ?? true) && commandAndGroupLabel) {
                    (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.title', {}, `${commandAndGroupLabel} `));
                }
                if ((options.showKeys ?? true) || ((options.showKeybindings ?? true) && this._isKbFound(shortcut))) {
                    // Fix label for arrow keys
                    keyLabel = keyLabel?.replace('UpArrow', '↑')
                        ?.replace('DownArrow', '↓')
                        ?.replace('LeftArrow', '←')
                        ?.replace('RightArrow', '→');
                    (0, dom_1.append)(keyboardMarker, (0, dom_1.$)('span.key', {}, keyLabel ?? ''));
                }
                length++;
                clearKeyboardScheduler.schedule();
            }));
            ToggleScreencastModeAction.disposable = disposables;
        }
        _isKbFound(resolutionResult) {
            return resolutionResult.kind === 2 /* ResultKind.KbFound */;
        }
        getCommandDetails(commandId) {
            const fromMenuRegistry = actions_1.MenuRegistry.getCommand(commandId);
            if (fromMenuRegistry) {
                return {
                    title: typeof fromMenuRegistry.title === 'string' ? fromMenuRegistry.title : fromMenuRegistry.title.value,
                    category: fromMenuRegistry.category ? (typeof fromMenuRegistry.category === 'string' ? fromMenuRegistry.category : fromMenuRegistry.category.value) : undefined
                };
            }
            const fromCommandsRegistry = commands_1.CommandsRegistry.getCommand(commandId);
            if (fromCommandsRegistry && fromCommandsRegistry.metadata?.description) {
                return { title: typeof fromCommandsRegistry.metadata.description === 'string' ? fromCommandsRegistry.metadata.description : fromCommandsRegistry.metadata.description.value };
            }
            return undefined;
        }
    }
    class LogStorageAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.logStorage',
                title: (0, nls_1.localize2)({ key: 'logStorage', comment: ['A developer only action to log the contents of the storage for the current window.'] }, "Log Storage Database Contents"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const storageService = accessor.get(storage_1.IStorageService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            storageService.log();
            dialogService.info((0, nls_1.localize)('storageLogDialogMessage', "The storage database contents have been logged to the developer tools."), (0, nls_1.localize)('storageLogDialogDetails', "Open developer tools from the menu and select the Console tab."));
        }
    }
    class LogWorkingCopiesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.logWorkingCopies',
                title: (0, nls_1.localize2)({ key: 'logWorkingCopies', comment: ['A developer only action to log the working copies that exist.'] }, "Log Working Copies"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            const logService = accessor.get(log_1.ILogService);
            const outputService = accessor.get(output_1.IOutputService);
            const backups = await workingCopyBackupService.getBackups();
            const msg = [
                ``,
                `[Working Copies]`,
                ...(workingCopyService.workingCopies.length > 0) ?
                    workingCopyService.workingCopies.map(workingCopy => `${workingCopy.isDirty() ? '● ' : ''}${workingCopy.resource.toString(true)} (typeId: ${workingCopy.typeId || '<no typeId>'})`) :
                    ['<none>'],
                ``,
                `[Backups]`,
                ...(backups.length > 0) ?
                    backups.map(backup => `${backup.resource.toString(true)} (typeId: ${backup.typeId || '<no typeId>'})`) :
                    ['<none>'],
            ];
            logService.info(msg.join('\n'));
            outputService.showChannel(logConstants_1.windowLogId, true);
        }
    }
    class RemoveLargeStorageEntriesAction extends actions_1.Action2 {
        static { this.SIZE_THRESHOLD = 1024 * 16; } // 16kb
        constructor() {
            super({
                id: 'workbench.action.removeLargeStorageDatabaseEntries',
                title: (0, nls_1.localize2)('removeLargeStorageDatabaseEntries', 'Remove Large Storage Database Entries...'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const storageService = accessor.get(storage_1.IStorageService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const userDataProfileService = accessor.get(userDataProfile_1.IUserDataProfileService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const environmentService = accessor.get(environment_1.IEnvironmentService);
            const items = [];
            for (const scope of [-1 /* StorageScope.APPLICATION */, 0 /* StorageScope.PROFILE */, 1 /* StorageScope.WORKSPACE */]) {
                if (scope === 0 /* StorageScope.PROFILE */ && userDataProfileService.currentProfile.isDefault) {
                    continue; // avoid duplicates
                }
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    for (const key of storageService.keys(scope, target)) {
                        const value = storageService.get(key, scope);
                        if (value && (!environmentService.isBuilt /* show all keys in dev */ || value.length > RemoveLargeStorageEntriesAction.SIZE_THRESHOLD)) {
                            items.push({
                                key,
                                scope,
                                target,
                                size: value.length,
                                label: key,
                                description: files_1.ByteSize.formatSize(value.length),
                                detail: (0, nls_1.localize)('largeStorageItemDetail', "Scope: {0}, Target: {1}", scope === -1 /* StorageScope.APPLICATION */ ? (0, nls_1.localize)('global', "Global") : scope === 0 /* StorageScope.PROFILE */ ? (0, nls_1.localize)('profile', "Profile") : (0, nls_1.localize)('workspace', "Workspace"), target === 1 /* StorageTarget.MACHINE */ ? (0, nls_1.localize)('machine', "Machine") : (0, nls_1.localize)('user', "User")),
                            });
                        }
                    }
                }
            }
            items.sort((itemA, itemB) => itemB.size - itemA.size);
            const selectedItems = await new Promise(resolve => {
                const disposables = new lifecycle_1.DisposableStore();
                const picker = disposables.add(quickInputService.createQuickPick());
                picker.items = items;
                picker.canSelectMany = true;
                picker.ok = false;
                picker.customButton = true;
                picker.hideCheckAll = true;
                picker.customLabel = (0, nls_1.localize)('removeLargeStorageEntriesPickerButton', "Remove");
                picker.placeholder = (0, nls_1.localize)('removeLargeStorageEntriesPickerPlaceholder', "Select large entries to remove from storage");
                if (items.length === 0) {
                    picker.description = (0, nls_1.localize)('removeLargeStorageEntriesPickerDescriptionNoEntries', "There are no large storage entries to remove.");
                }
                picker.show();
                disposables.add(picker.onDidCustom(() => {
                    resolve(picker.selectedItems);
                    picker.hide();
                }));
                disposables.add(picker.onDidHide(() => disposables.dispose()));
            });
            if (selectedItems.length === 0) {
                return;
            }
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('removeLargeStorageEntriesConfirmRemove', "Do you want to remove the selected storage entries from the database?"),
                detail: (0, nls_1.localize)('removeLargeStorageEntriesConfirmRemoveDetail', "{0}\n\nThis action is irreversible and may result in data loss!", selectedItems.map(item => item.label).join('\n')),
                primaryButton: (0, nls_1.localize)({ key: 'removeLargeStorageEntriesButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Remove")
            });
            if (!confirmed) {
                return;
            }
            const scopesToOptimize = new Set();
            for (const item of selectedItems) {
                storageService.remove(item.key, item.scope);
                scopesToOptimize.add(item.scope);
            }
            for (const scope of scopesToOptimize) {
                await storageService.optimize(scope);
            }
        }
    }
    let tracker = undefined;
    let trackedDisposables = new Set();
    const DisposablesSnapshotStateContext = new contextkey_1.RawContextKey('dirtyWorkingCopies', 'stopped');
    class StartTrackDisposables extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.startTrackDisposables',
                title: (0, nls_1.localize2)('startTrackDisposables', 'Start Tracking Disposables'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(DisposablesSnapshotStateContext.isEqualTo('pending').negate(), DisposablesSnapshotStateContext.isEqualTo('started').negate())
            });
        }
        run(accessor) {
            const disposablesSnapshotStateContext = DisposablesSnapshotStateContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            disposablesSnapshotStateContext.set('started');
            trackedDisposables.clear();
            tracker = new lifecycle_1.DisposableTracker();
            (0, lifecycle_1.setDisposableTracker)(tracker);
        }
    }
    class SnapshotTrackedDisposables extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.snapshotTrackedDisposables',
                title: (0, nls_1.localize2)('snapshotTrackedDisposables', 'Snapshot Tracked Disposables'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: DisposablesSnapshotStateContext.isEqualTo('started')
            });
        }
        run(accessor) {
            const disposablesSnapshotStateContext = DisposablesSnapshotStateContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            disposablesSnapshotStateContext.set('pending');
            trackedDisposables = new Set(tracker?.computeLeakingDisposables(1000)?.leaks.map(disposable => disposable.value));
        }
    }
    class StopTrackDisposables extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.stopTrackDisposables',
                title: (0, nls_1.localize2)('stopTrackDisposables', 'Stop Tracking Disposables'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                precondition: DisposablesSnapshotStateContext.isEqualTo('pending')
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const disposablesSnapshotStateContext = DisposablesSnapshotStateContext.bindTo(accessor.get(contextkey_1.IContextKeyService));
            disposablesSnapshotStateContext.set('stopped');
            if (tracker) {
                const disposableLeaks = new Set();
                for (const disposable of new Set(tracker.computeLeakingDisposables(1000)?.leaks) ?? []) {
                    if (trackedDisposables.has(disposable.value)) {
                        disposableLeaks.add(disposable);
                    }
                }
                const leaks = tracker.computeLeakingDisposables(1000, Array.from(disposableLeaks));
                if (leaks) {
                    editorService.openEditor({ resource: undefined, contents: leaks.details });
                }
            }
            (0, lifecycle_1.setDisposableTracker)(null);
            tracker = undefined;
            trackedDisposables.clear();
        }
    }
    // --- Actions Registration
    (0, actions_1.registerAction2)(InspectContextKeysAction);
    (0, actions_1.registerAction2)(ToggleScreencastModeAction);
    (0, actions_1.registerAction2)(LogStorageAction);
    (0, actions_1.registerAction2)(LogWorkingCopiesAction);
    (0, actions_1.registerAction2)(RemoveLargeStorageEntriesAction);
    if (!product_1.default.commit) {
        (0, actions_1.registerAction2)(StartTrackDisposables);
        (0, actions_1.registerAction2)(SnapshotTrackedDisposables);
        (0, actions_1.registerAction2)(StopTrackDisposables);
    }
    // --- Configuration
    // Screen Cast Mode
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'screencastMode',
        order: 9,
        title: (0, nls_1.localize)('screencastModeConfigurationTitle', "Screencast Mode"),
        type: 'object',
        properties: {
            'screencastMode.verticalOffset': {
                type: 'number',
                default: 20,
                minimum: 0,
                maximum: 90,
                description: (0, nls_1.localize)('screencastMode.location.verticalPosition', "Controls the vertical offset of the screencast mode overlay from the bottom as a percentage of the workbench height.")
            },
            'screencastMode.fontSize': {
                type: 'number',
                default: 56,
                minimum: 20,
                maximum: 100,
                description: (0, nls_1.localize)('screencastMode.fontSize', "Controls the font size (in pixels) of the screencast mode keyboard.")
            },
            'screencastMode.keyboardOptions': {
                type: 'object',
                description: (0, nls_1.localize)('screencastMode.keyboardOptions.description', "Options for customizing the keyboard overlay in screencast mode."),
                properties: {
                    'showKeys': {
                        type: 'boolean',
                        default: true,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showKeys', "Show raw keys.")
                    },
                    'showKeybindings': {
                        type: 'boolean',
                        default: true,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showKeybindings', "Show keyboard shortcuts.")
                    },
                    'showCommands': {
                        type: 'boolean',
                        default: true,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showCommands', "Show command names.")
                    },
                    'showCommandGroups': {
                        type: 'boolean',
                        default: false,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showCommandGroups', "Show command group names, when commands are also shown.")
                    },
                    'showSingleEditorCursorMoves': {
                        type: 'boolean',
                        default: true,
                        description: (0, nls_1.localize)('screencastMode.keyboardOptions.showSingleEditorCursorMoves', "Show single editor cursor move commands.")
                    }
                },
                default: {
                    'showKeys': true,
                    'showKeybindings': true,
                    'showCommands': true,
                    'showCommandGroups': false,
                    'showSingleEditorCursorMoves': true
                },
                additionalProperties: false
            },
            'screencastMode.keyboardOverlayTimeout': {
                type: 'number',
                default: 800,
                minimum: 500,
                maximum: 5000,
                description: (0, nls_1.localize)('screencastMode.keyboardOverlayTimeout', "Controls how long (in milliseconds) the keyboard overlay is shown in screencast mode.")
            },
            'screencastMode.mouseIndicatorColor': {
                type: 'string',
                format: 'color-hex',
                default: '#FF0000',
                description: (0, nls_1.localize)('screencastMode.mouseIndicatorColor', "Controls the color in hex (#RGB, #RGBA, #RRGGBB or #RRGGBBAA) of the mouse indicator in screencast mode.")
            },
            'screencastMode.mouseIndicatorSize': {
                type: 'number',
                default: 20,
                minimum: 20,
                maximum: 100,
                description: (0, nls_1.localize)('screencastMode.mouseIndicatorSize', "Controls the size (in pixels) of the mouse indicator in screencast mode.")
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2ZWxvcGVyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2FjdGlvbnMvZGV2ZWxvcGVyQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXdDaEcsTUFBTSx3QkFBeUIsU0FBUSxpQkFBTztRQUU3QztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUscUNBQXFDO2dCQUN6QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsc0JBQXNCLEVBQUUsc0JBQXNCLENBQUM7Z0JBQ2hFLFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztZQUUzRCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUxQyxNQUFNLFVBQVUsR0FBRyxJQUFBLHNCQUFnQixFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkUsSUFBQSxtQkFBYSxFQUFDLEdBQUcsRUFBRSwrQkFBK0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVoRSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BELE1BQU0sY0FBYyxHQUFHLElBQUEsdUJBQWlCLEdBQUUsQ0FBQztZQUMzQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMvQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLENB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