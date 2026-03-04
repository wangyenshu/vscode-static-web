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
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/formattedTextRenderer", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/dnd/browser/dnd", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/theme", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/treeViewsDndService", "vs/editor/common/services/treeViewsDnd", "vs/css!./media/editordroptarget"], function (require, exports, dnd_1, dom_1, formattedTextRenderer_1, async_1, lifecycle_1, platform_1, types_1, nls_1, configuration_1, instantiation_1, platform_2, colorRegistry_1, themeService_1, workspace_1, dnd_2, dnd_3, editor_1, theme_1, editorGroupsService_1, editorService_1, treeViewsDndService_1, treeViewsDnd_1) {
    "use strict";
    var DropOverlay_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorDropTarget = void 0;
    function isDropIntoEditorEnabledGlobally(configurationService) {
        return configurationService.getValue('editor.dropIntoEditor.enabled');
    }
    function isDragIntoEditorEvent(e) {
        return e.shiftKey;
    }
    let DropOverlay = class DropOverlay extends themeService_1.Themable {
        static { DropOverlay_1 = this; }
        static { this.OVERLAY_ID = 'monaco-workbench-editor-drop-overlay'; }
        get disposed() { return !!this._disposed; }
        constructor(groupView, themeService, configurationService, instantiationService, editorService, editorGroupService, treeViewsDragAndDropService, contextService) {
            super(themeService);
            this.groupView = groupView;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.treeViewsDragAndDropService = treeViewsDragAndDropService;
            this.contextService = contextService;
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.treeItemsTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.cleanupOverlayScheduler = this._register(new async_1.RunOnceScheduler(() => this.dispose(), 300));
            this.enableDropIntoEditor = isDropIntoEditorEnabledGlobally(this.configurationService) && this.isDropIntoActiveEditorEnabled();
            this.create();
        }
        create() {
            const overlayOffsetHeight = this.getOverlayOffsetHeight();
            // Container
            const container = this.container = document.createElement('div');
            container.id = DropOverlay_1.OVERLAY_ID;
            container.style.top = `${overlayOffsetHeight}px`;
            // Parent
            this.groupView.element.appendChild(container);
            this.groupView.element.classList.add('dragged-over');
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.groupView.element.removeChild(container);
                this.groupView.element.classList.remove('dragged-over');
            }));
            // Overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('editor-group-overlay-indicator');
            container.appendChild(this.overlay);
            if (this.enableDropIntoEditor) {
                this.dropIntoPromptElement = (0, formattedTextRenderer_1.renderFormattedText)((0, nls_1.localize)('dropIntoEditorPrompt', "Hold __{0}__ to drop into editor", platform_1.isMacintosh ? '⇧' : 'Shift'), {});
                this.dropIntoPromptElement.classList.add('editor-group-overlay-drop-into-prompt');
                this.overlay.appendChild(this.dropIntoPromptElement);
            }
            // Overlay Event Handling
            this.registerListeners(container);
            // Styles
            this.updateStyles();
        }
        updateStyles() {
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            // Overlay drop background
            overlay.style.backgroundColor = this.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND) || '';
            // Overlay contrast border (if any)
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            overlay.style.outlineColor = activeContrastBorderColor || '';
            overlay.style.outlineOffset = activeContrastBorderColor ? '-2px' : '';
            overlay.style.outlineStyle = activeContrastBorderColor ? 'dashed' : '';
            overlay.style.outlineWidth = activeContrastBorderColor ? '2px' : '';
            if (this.dropIntoPromptElement) {
                this.dropIntoPromptElement.style.backgroundColor = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_BACKGROUND) ?? '';
                this.dropIntoPromptElement.style.color = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_FOREGROUND) ?? '';
                const borderColor = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_BORDER);
                if (borderColor) {
                    this.dropIntoPromptElement.style.borderWidth = '1px';
                    this.dropIntoPromptElement.style.borderStyle = 'solid';
                    this.dropIntoPromptElement.style.borderColor = borderColor;
                }
                else {
                    this.dropIntoPromptElement.style.borderWidth = '0';
                }
            }
        }
        registerListeners(container) {
            this._register(new dom_1.DragAndDropObserver(container, {
                onDragOver: e => {
                    if (this.enableDropIntoEditor && isDragIntoEditorEvent(e)) {
                        this.dispose();
                        return;
                    }
                    const isDraggingGroup = this.groupTransfer.hasData(dnd_3.DraggedEditorGroupIdentifier.prototype);
                    const isDraggingEditor = this.editorTransfer.hasData(dnd_3.DraggedEditorIdentifier.prototype);
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!isDraggingEditor && !isDraggingGroup && e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                    // Find out if operation is valid
                    let isCopy = true;
                    if (isDraggingGroup) {
                        isCopy = this.isCopyOperation(e);
                    }
                    else if (isDraggingEditor) {
                        const data = this.editorTransfer.getData(dnd_3.DraggedEditorIdentifier.prototype);
                        if (Array.isArray(data)) {
                            isCopy = this.isCopyOperation(e, data[0].identifier);
                        }
                    }
                    if (!isCopy) {
                        const sourceGroupView = this.findSourceGroupView();
                        if (sourceGroupView === this.groupView) {
                            if (isDraggingGroup || (isDraggingEditor && sourceGroupView.count < 2)) {
                                this.hideOverlay();
                                return; // do not allow to drop group/editor on itself if this results in an empty group
                            }
                        }
                    }
                    // Position overlay and conditionally enable or disable
                    // editor group splitting support based on setting and
                    // keymodifiers used.
                    let splitOnDragAndDrop = !!this.editorGroupService.partOptions.splitOnDragAndDrop;
                    if (this.isToggleSplitOperation(e)) {
                        splitOnDragAndDrop = !splitOnDragAndDrop;
                    }
                    this.positionOverlay(e.offsetX, e.offsetY, isDraggingGroup, splitOnDragAndDrop);
                    // Make sure to stop any running cleanup scheduler to remove the overlay
                    if (this.cleanupOverlayScheduler.isScheduled()) {
                        this.cleanupOverlayScheduler.cancel();
                    }
                },
                onDragLeave: e => this.dispose(),
                onDragEnd: e => this.dispose(),
                onDrop: e => {
                    dom_1.EventHelper.stop(e, true);
                    // Dispose overlay
                    this.dispose();
                    // Handle drop if we have a valid operation
                    if (this.currentDropOperation) {
                        this.handleDrop(e, this.currentDropOperation.splitDirection);
                    }
                }
            }));
            this._register((0, dom_1.addDisposableListener)(container, dom_1.EventType.MOUSE_OVER, () => {
                // Under some circumstances we have seen reports where the drop overlay is not being
                // cleaned up and as such the editor area remains under the overlay so that you cannot
                // type into the editor anymore. This seems related to using VMs and DND via host and
                // guest OS, though some users also saw it without VMs.
                // To protect against this issue we always destroy the overlay as soon as we detect a
                // mouse event over it. The delay is used to guarantee we are not interfering with the
                // actual DROP event that can also trigger a mouse over event.
                if (!this.cleanupOverlayScheduler.isScheduled()) {
                    this.cleanupOverlayScheduler.schedule();
                }
            }));
        }
        isDropIntoActiveEditorEnabled() {
            return !!this.groupView.activeEditor?.hasCapability(128 /* EditorInputCapabilities.CanDropIntoEditor */);
        }
        findSourceGroupView() {
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_3.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_3.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    return this.editorGroupService.getGroup(data[0].identifier);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_3.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_3.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    return this.editorGroupService.getGroup(data[0].identifier.groupId);
                }
            }
            return undefined;
        }
        async handleDrop(event, splitDirection) {
            // Determine target group
            const ensureTargetGroup = () => {
                let targetGroup;
                if (typeof splitDirection === 'number') {
                    targetGroup = this.editorGroupService.addGroup(this.groupView, splitDirection);
                }
                else {
                    targetGroup = this.groupView;
                }
                return targetGroup;
            };
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_3.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_3.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    const sourceGroup = this.editorGroupService.getGroup(data[0].identifier);
                    if (sourceGroup) {
                        if (typeof splitDirection !== 'number' && sourceGroup === this.groupView) {
                            return;
                        }
                        // Split to new group
                        let targetGroup;
                        if (typeof splitDirection === 'number') {
                            if (this.isCopyOperation(event)) {
                                targetGroup = this.editorGroupService.copyGroup(sourceGroup, this.groupView, splitDirection);
                            }
                            else {
                                targetGroup = this.editorGroupService.moveGroup(sourceGroup, this.groupView, splitDirection);
                            }
                        }
                        // Merge into existing group
                        else {
                            let mergeGroupOptions = undefined;
                            if (this.isCopyOperation(event)) {
                                mergeGroupOptions = { mode: 0 /* MergeGroupMode.COPY_EDITORS */ };
                            }
                            this.editorGroupService.mergeGroup(sourceGroup, this.groupView, mergeGroupOptions);
                        }
                        if (targetGroup) {
                            this.editorGroupService.activateGroup(targetGroup);
                        }
                    }
                    this.groupTransfer.clearData(dnd_3.DraggedEditorGroupIdentifier.prototype);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_3.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_3.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    const draggedEditor = data[0].identifier;
                    const sourceGroup = this.editorGroupService.getGroup(draggedEditor.groupId);
                    if (sourceGroup) {
                        const copyEditor = this.isCopyOperation(event, draggedEditor);
                        let targetGroup = undefined;
                        // Optimization: if we move the last editor of an editor group
                        // and we are configured to close empty editor groups, we can
                        // rather move the entire editor group according to the direction
                        if (this.editorGroupService.partOptions.closeEmptyGroups && sourceGroup.count === 1 && typeof splitDirection === 'number' && !copyEditor) {
                            targetGroup = this.editorGroupService.moveGroup(sourceGroup, this.groupView, splitDirection);
                        }
                        // In any other case do a normal move/copy operation
                        else {
                            targetGroup = ensureTargetGroup();
                            if (sourceGroup === targetGroup) {
                                return;
                            }
                            // Open in target group
                            const options = (0, editor_1.fillActiveEditorViewState)(sourceGroup, draggedEditor.editor, {
                                pinned: true, // always pin dropped editor
                                sticky: sourceGroup.isSticky(draggedEditor.editor), // preserve sticky state
                            });
                            if (!copyEditor) {
                                sourceGroup.moveEditor(draggedEditor.editor, targetGroup, options);
                            }
                            else {
                                sourceGroup.copyEditor(draggedEditor.editor, targetGroup, options);
                            }
                        }
                        // Ensure target has focus
                        targetGroup.focus();
                    }
                    this.editorTransfer.clearData(dnd_3.DraggedEditorIdentifier.prototype);
                }
            }
            // Check for tree items
            else if (this.treeItemsTransfer.hasData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype)) {
                const data = this.treeItemsTransfer.getData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
                if (Array.isArray(data)) {
                    const editors = [];
                    for (const id of data) {
                        const dataTransferItem = await this.treeViewsDragAndDropService.removeDragOperationTransfer(id.identifier);
                        if (dataTransferItem) {
                            const treeDropData = await (0, dnd_3.extractTreeDropData)(dataTransferItem);
                            editors.push(...treeDropData.map(editor => ({ ...editor, options: { ...editor.options, pinned: true } })));
                        }
                    }
                    if (editors.length) {
                        this.editorService.openEditors(editors, ensureTargetGroup(), { validateTrust: true });
                    }
                }
                this.treeItemsTransfer.clearData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
            }
            // Check for URI transfer
            else {
                const dropHandler = this.instantiationService.createInstance(dnd_3.ResourcesDropHandler, { allowWorkspaceOpen: !platform_1.isWeb || (0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()) });
                dropHandler.handleDrop(event, (0, dom_1.getWindow)(this.groupView.element), () => ensureTargetGroup(), targetGroup => targetGroup?.focus());
            }
        }
        isCopyOperation(e, draggedEditor) {
            if (draggedEditor?.editor.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
                return false; // Singleton editors cannot be split
            }
            return (e.ctrlKey && !platform_1.isMacintosh) || (e.altKey && platform_1.isMacintosh);
        }
        isToggleSplitOperation(e) {
            return (e.altKey && !platform_1.isMacintosh) || (e.shiftKey && platform_1.isMacintosh);
        }
        positionOverlay(mousePosX, mousePosY, isDraggingGroup, enableSplitting) {
            const preferSplitVertically = this.editorGroupService.partOptions.openSideBySideDirection === 'right';
            const editorControlWidth = this.groupView.element.clientWidth;
            const editorControlHeight = this.groupView.element.clientHeight - this.getOverlayOffsetHeight();
            let edgeWidthThresholdFactor;
            let edgeHeightThresholdFactor;
            if (enableSplitting) {
                if (isDraggingGroup) {
                    edgeWidthThresholdFactor = preferSplitVertically ? 0.3 : 0.1; // give larger threshold when dragging group depending on preferred split direction
                }
                else {
                    edgeWidthThresholdFactor = 0.1; // 10% threshold to split if dragging editors
                }
                if (isDraggingGroup) {
                    edgeHeightThresholdFactor = preferSplitVertically ? 0.1 : 0.3; // give larger threshold when dragging group depending on preferred split direction
                }
                else {
                    edgeHeightThresholdFactor = 0.1; // 10% threshold to split if dragging editors
                }
            }
            else {
                edgeWidthThresholdFactor = 0;
                edgeHeightThresholdFactor = 0;
            }
            const edgeWidthThreshold = editorControlWidth * edgeWidthThresholdFactor;
            const edgeHeightThreshold = editorControlHeight * edgeHeightThresholdFactor;
            const splitWidthThreshold = editorControlWidth / 3; // offer to split left/right at 33%
            const splitHeightThreshold = editorControlHeight / 3; // offer to split up/down at 33%
            // No split if mouse is above certain threshold in the center of the view
            let splitDirection;
            if (mousePosX > edgeWidthThreshold && mousePosX < editorControlWidth - edgeWidthThreshold &&
                mousePosY > edgeHeightThreshold && mousePosY < editorControlHeight - edgeHeightThreshold) {
                splitDirection = undefined;
            }
            // Offer to split otherwise
            else {
                // User prefers to split vertically: offer a larger hitzone
                // for this direction like so:
                // ----------------------------------------------
                // |		|		SPLIT UP		|			|
                // | SPLIT 	|-----------------------|	SPLIT	|
                // |		|		  MERGE			|			|
                // | LEFT	|-----------------------|	RIGHT	|
                // |		|		SPLIT DOWN		|			|
                // ----------------------------------------------
                if (preferSplitVertically) {
                    if (mousePosX < splitWidthThreshold) {
                        splitDirection = 2 /* GroupDirection.LEFT */;
                    }
                    else if (mousePosX > splitWidthThreshold * 2) {
                        splitDirection = 3 /* GroupDirection.RIGHT */;
                    }
                    else if (mousePosY < editorControlHeight / 2) {
                        splitDirection = 0 /* GroupDirection.UP */;
                    }
                    else {
                        splitDirection = 1 /* GroupDirection.DOWN */;
                    }
                }
                // User prefers to split horizontally: offer a larger hitzone
                // for this direction like so:
                // ----------------------------------------------
                // |				SPLIT UP					|
                // |--------------------------------------------|
                // |  SPLIT LEFT  |	   MERGE	|  SPLIT RIGHT  |
                // |--------------------------------------------|
                // |				SPLIT DOWN					|
                // ----------------------------------------------
                else {
                    if (mousePosY < splitHeightThreshold) {
                        splitDirection = 0 /* GroupDirection.UP */;
                    }
                    else if (mousePosY > splitHeightThreshold * 2) {
                        splitDirection = 1 /* GroupDirection.DOWN */;
                    }
                    else if (mousePosX < editorControlWidth / 2) {
                        splitDirection = 2 /* GroupDirection.LEFT */;
                    }
                    else {
                        splitDirection = 3 /* GroupDirection.RIGHT */;
                    }
                }
            }
            // Draw overlay based on split direction
            switch (splitDirection) {
                case 0 /* GroupDirection.UP */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '50%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 1 /* GroupDirection.DOWN */:
                    this.doPositionOverlay({ top: '50%', left: '0', width: '100%', height: '50%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 2 /* GroupDirection.LEFT */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '50%', height: '100%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 3 /* GroupDirection.RIGHT */:
                    this.doPositionOverlay({ top: '0', left: '50%', width: '50%', height: '100%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                default:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
                    this.toggleDropIntoPrompt(true);
            }
            // Make sure the overlay is visible now
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            overlay.style.opacity = '1';
            // Enable transition after a timeout to prevent initial animation
            setTimeout(() => overlay.classList.add('overlay-move-transition'), 0);
            // Remember as current split direction
            this.currentDropOperation = { splitDirection };
        }
        doPositionOverlay(options) {
            const [container, overlay] = (0, types_1.assertAllDefined)(this.container, this.overlay);
            // Container
            const offsetHeight = this.getOverlayOffsetHeight();
            if (offsetHeight) {
                container.style.height = `calc(100% - ${offsetHeight}px)`;
            }
            else {
                container.style.height = '100%';
            }
            // Overlay
            overlay.style.top = options.top;
            overlay.style.left = options.left;
            overlay.style.width = options.width;
            overlay.style.height = options.height;
        }
        getOverlayOffsetHeight() {
            // With tabs and opened editors: use the area below tabs as drop target
            if (!this.groupView.isEmpty && this.editorGroupService.partOptions.showTabs === 'multiple') {
                return this.groupView.titleHeight.offset;
            }
            // Without tabs or empty group: use entire editor area as drop target
            return 0;
        }
        hideOverlay() {
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            // Reset overlay
            this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
            overlay.style.opacity = '0';
            overlay.classList.remove('overlay-move-transition');
            // Reset current operation
            this.currentDropOperation = undefined;
        }
        toggleDropIntoPrompt(showing) {
            if (!this.dropIntoPromptElement) {
                return;
            }
            this.dropIntoPromptElement.style.opacity = showing ? '1' : '0';
        }
        contains(element) {
            return element === this.container || element === this.overlay;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
        }
    };
    DropOverlay = DropOverlay_1 = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, treeViewsDndService_1.ITreeViewsDnDService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], DropOverlay);
    let EditorDropTarget = class EditorDropTarget extends themeService_1.Themable {
        constructor(container, delegate, editorGroupService, themeService, configurationService, instantiationService) {
            super(themeService);
            this.container = container;
            this.delegate = delegate;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.counter = 0;
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.registerListeners();
        }
        get overlay() {
            if (this._overlay && !this._overlay.disposed) {
                return this._overlay;
            }
            return undefined;
        }
        registerListeners() {
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.DRAG_ENTER, e => this.onDragEnter(e)));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.DRAG_LEAVE, () => this.onDragLeave()));
            for (const target of [this.container, (0, dom_1.getWindow)(this.container)]) {
                this._register((0, dom_1.addDisposableListener)(target, dom_1.EventType.DRAG_END, () => this.onDragEnd()));
            }
        }
        onDragEnter(event) {
            if (isDropIntoEditorEnabledGlobally(this.configurationService) && isDragIntoEditorEvent(event)) {
                return;
            }
            this.counter++;
            // Validate transfer
            if (!this.editorTransfer.hasData(dnd_3.DraggedEditorIdentifier.prototype) &&
                !this.groupTransfer.hasData(dnd_3.DraggedEditorGroupIdentifier.prototype) &&
                event.dataTransfer) {
                const dndContributions = platform_2.Registry.as(dnd_2.Extensions.DragAndDropContribution).getAll();
                const dndContributionKeys = Array.from(dndContributions).map(e => e.dataFormatKey);
                if (!(0, dnd_2.containsDragType)(event, dnd_1.DataTransfers.FILES, dnd_2.CodeDataTransfers.FILES, dnd_1.DataTransfers.RESOURCES, dnd_2.CodeDataTransfers.EDITORS, ...dndContributionKeys)) { // see https://github.com/microsoft/vscode/issues/25789
                    event.dataTransfer.dropEffect = 'none';
                    return; // unsupported transfer
                }
            }
            // Signal DND start
            this.updateContainer(true);
            const target = event.target;
            if (target) {
                // Somehow we managed to move the mouse quickly out of the current overlay, so destroy it
                if (this.overlay && !this.overlay.contains(target)) {
                    this.disposeOverlay();
                }
                // Create overlay over target
                if (!this.overlay) {
                    const targetGroupView = this.findTargetGroupView(target);
                    if (targetGroupView) {
                        this._overlay = this.instantiationService.createInstance(DropOverlay, targetGroupView);
                    }
                }
            }
        }
        onDragLeave() {
            this.counter--;
            if (this.counter === 0) {
                this.updateContainer(false);
            }
        }
        onDragEnd() {
            this.counter = 0;
            this.updateContainer(false);
            this.disposeOverlay();
        }
        findTargetGroupView(child) {
            const groups = this.editorGroupService.groups;
            return groups.find(groupView => (0, dom_1.isAncestor)(child, groupView.element) || this.delegate.containsGroup?.(groupView));
        }
        updateContainer(isDraggedOver) {
            this.container.classList.toggle('dragged-over', isDraggedOver);
        }
        dispose() {
            super.dispose();
            this.disposeOverlay();
        }
        disposeOverlay() {
            if (this.overlay) {
                this.overlay.dispose();
                this._overlay = undefined;
            }
        }
    };
    exports.EditorDropTarget = EditorDropTarget;
    exports.EditorDropTarget = EditorDropTarget = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService)
    ], EditorDropTarget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRHJvcFRhcmdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JEcm9wVGFyZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErQmhHLFNBQVMsK0JBQStCLENBQUMsb0JBQTJDO1FBQ25GLE9BQU8sb0JBQW9CLENBQUMsUUFBUSxDQUFVLCtCQUErQixDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUVELFNBQVMscUJBQXFCLENBQUMsQ0FBWTtRQUMxQyxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUM7SUFDbkIsQ0FBQztJQUVELElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSx1QkFBUTs7aUJBRVQsZUFBVSxHQUFHLHNDQUFzQyxBQUF6QyxDQUEwQztRQVM1RSxJQUFJLFFBQVEsS0FBYyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQVVwRCxZQUNrQixTQUEyQixFQUM3QixZQUEyQixFQUNuQixvQkFBNEQsRUFDNUQsb0JBQTRELEVBQ25FLGFBQThDLEVBQ3hDLGtCQUF5RCxFQUN6RCwyQkFBa0UsRUFDOUQsY0FBeUQ7WUFFbkYsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBVEgsY0FBUyxHQUFULFNBQVMsQ0FBa0I7WUFFSix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbEQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDeEMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFzQjtZQUM3QyxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFkbkUsbUJBQWMs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