/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/editorTabsControl", "vs/workbench/browser/labels", "vs/workbench/common/theme", "vs/base/browser/touch", "vs/base/browser/dom", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/color", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/platform/theme/browser/defaultStyles", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/css!./media/singleeditortabscontrol"], function (require, exports, editor_1, editorTabsControl_1, labels_1, theme_1, touch_1, dom_1, editorCommands_1, color_1, types_1, objects_1, lifecycle_1, defaultStyles_1, breadcrumbsControl_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SingleEditorTabsControl = void 0;
    class SingleEditorTabsControl extends editorTabsControl_1.EditorTabsControl {
        constructor() {
            super(...arguments);
            this.activeLabel = Object.create(null);
        }
        get breadcrumbsControl() { return this.breadcrumbsControlFactory?.control; }
        create(parent) {
            super.create(parent);
            const titleContainer = this.titleContainer = parent;
            titleContainer.draggable = true;
            // Container listeners
            this.registerContainerListeners(titleContainer);
            // Gesture Support
            this._register(touch_1.Gesture.addTarget(titleContainer));
            const labelContainer = document.createElement('div');
            labelContainer.classList.add('label-container');
            titleContainer.appendChild(labelContainer);
            // Editor Label
            this.editorLabel = this._register(this.instantiationService.createInstance(labels_1.ResourceLabel, labelContainer, { hoverDelegate: this.getHoverDelegate() })).element;
            this._register((0, dom_1.addDisposableListener)(this.editorLabel.element, dom_1.EventType.CLICK, e => this.onTitleLabelClick(e)));
            // Breadcrumbs
            this.breadcrumbsControlFactory = this._register(this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControlFactory, labelContainer, this.groupView, {
                showFileIcons: false,
                showSymbolIcons: true,
                showDecorationColors: false,
                widgetStyles: { ...defaultStyles_1.defaultBreadcrumbsWidgetStyles, breadcrumbsBackground: color_1.Color.transparent.toString() },
                showPlaceholder: false
            }));
            this._register(this.breadcrumbsControlFactory.onDidEnablementChange(() => this.handleBreadcrumbsEnablementChange()));
            titleContainer.classList.toggle('breadcrumbs', Boolean(this.breadcrumbsControl));
            this._register((0, lifecycle_1.toDisposable)(() => titleContainer.classList.remove('breadcrumbs'))); // important to remove because the container is a shared dom node
            // Create editor actions toolbar
            this.createEditorActionsToolBar(titleContainer, ['title-actions']);
        }
        registerContainerListeners(titleContainer) {
            // Drag & Drop support
            let lastDragEvent = undefined;
            let isNewWindowOperation = false;
            this._register(new dom_1.DragAndDropObserver(titleContainer, {
                onDragStart: e => { isNewWindowOperation = this.onGroupDragStart(e, titleContainer); },
                onDrag: e => { lastDragEvent = e; },
                onDragEnd: e => { this.onGroupDragEnd(e, lastDragEvent, titleContainer, isNewWindowOperation); },
            }));
            // Pin on double click
            this._register((0, dom_1.addDisposableListener)(titleContainer, dom_1.EventType.DBLCLICK, e => this.onTitleDoubleClick(e)));
            // Detect mouse click
            this._register((0, dom_1.addDisposableListener)(titleContainer, dom_1.EventType.AUXCLICK, e => this.onTitleAuxClick(e)));
            // Detect touch
            this._register((0, dom_1.addDisposableListener)(titleContainer, touch_1.EventType.Tap, (e) => this.onTitleTap(e)));
            // Context Menu
            for (const event of [dom_1.EventType.CONTEXT_MENU, touch_1.EventType.Contextmenu]) {
                this._register((0, dom_1.addDisposableListener)(titleContainer, event, e => {
                    if (this.tabsModel.activeEditor) {
                        this.onTabContextMenu(this.tabsModel.activeEditor, e, titleContainer);
                    }
                }));
            }
        }
        onTitleLabelClick(e) {
            dom_1.EventHelper.stop(e, false);
            // delayed to let the onTitleClick() come first which can cause a focus change which can close quick access
            setTimeout(() => this.quickInputService.quickAccess.show());
        }
        onTitleDoubleClick(e) {
            dom_1.EventHelper.stop(e);
            this.groupView.pinEditor();
        }
        onTitleAuxClick(e) {
            if (e.button === 1 /* Middle Button */ && this.tabsModel.activeEditor) {
                dom_1.EventHelper.stop(e, true /* for https://github.com/microsoft/vscode/issues/56715 */);
                if (!(0, editor_1.preventEditorClose)(this.tabsModel, this.tabsModel.activeEditor, editor_1.EditorCloseMethod.MOUSE, this.groupsView.partOptions)) {
                    this.groupView.closeEditor(this.tabsModel.activeEditor);
                }
            }
        }
        onTitleTap(e) {
            // We only want to open the quick access picker when
            // the tap occurred over the editor label, so we need
            // to check on the target
            // (https://github.com/microsoft/vscode/issues/107543)
            const target = e.initialTarget;
            if (!(target instanceof HTMLElement) || !this.editorLabel || !(0, dom_1.isAncestor)(target, this.editorLabel.element)) {
                return;
            }
            // TODO@rebornix gesture tap should open the quick access
            // editorGroupView will focus on the editor again when there
            // are mouse/pointer/touch down events we need to wait a bit as
            // `GesureEvent.Tap` is generated from `touchstart` and then
            // `touchend` events, which are not an atom event.
            setTimeout(() => this.quickInputService.quickAccess.show(), 50);
        }
        openEditor(editor) {
            return this.doHandleOpenEditor();
        }
        openEditors(editors) {
            return this.doHandleOpenEditor();
        }
        doHandleOpenEditor() {
            const activeEditorChanged = this.ifActiveEditorChanged(() => this.redraw());
            if (!activeEditorChanged) {
                this.ifActiveEditorPropertiesChanged(() => this.redraw());
            }
            return activeEditorChanged;
        }
        beforeCloseEditor(editor) {
            // Nothing to do before closing an editor
        }
        closeEditor(editor) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        closeEditors(editors) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        moveEditor(editor, fromIndex, targetIndex) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        pinEditor(editor) {
            this.ifEditorIsActive(editor, () => this.redraw());
        }
        stickEditor(editor) {
            // Sticky editors are not presented any different with tabs disabled
        }
        unstickEditor(editor) {
            // Sticky editors are not presented any different with tabs disabled
        }
        setActive(isActive) {
            this.redraw();
        }
        updateEditorLabel(editor) {
            this.ifEditorIsActive(editor, () => this.redraw());
        }
        updateEditorDirty(editor) {
            this.ifEditorIsActive(editor, () => {
                const titleContainer = (0, types_1.assertIsDefined)(this.titleContainer);
                // Signal dirty (unless saving)
                if (editor.isDirty() && !editor.isSaving()) {
                    titleContainer.classList.add('dirty');
                }
                // Otherwise, clear dirty
                else {
                    titleContainer.classList.remove('dirty');
                }
            });
        }
        updateOptions(oldOptions, newOptions) {
            super.updateOptions(oldOptions, newOptions);
            if (oldOptions.labelFormat !== newOptions.labelFormat || !(0, objects_1.equals)(oldOptions.decorations, newOptions.decorations)) {
                this.redraw();
            }
        }
        updateStyles() {
            this.redraw();
        }
        handleBreadcrumbsEnablementChange() {
            const titleContainer = (0, types_1.assertIsDefined)(this.titleContainer);
            titleContainer.classList.toggle('breadcrumbs', Boolean(this.breadcrumbsControl));
            this.redraw();
        }
        ifActiveEditorChanged(fn) {
            if (!this.activeLabel.editor && this.tabsModel.activeEditor || // active editor changed from null => editor
                this.activeLabel.editor && !this.tabsModel.activeEditor || // active editor changed from editor => null
                (!this.activeLabel.editor || !this.tabsModel.isActive(this.activeLabel.editor)) // active editor changed from editorA => editorB
            ) {
                fn();
                return true;
            }
            return false;
        }
        ifActiveEditorPropertiesChanged(fn) {
            if (!this.activeLabel.editor || !this.tabsModel.activeEditor) {
                return; // need an active editor to check for properties changed
            }
            if (this.activeLabel.pinned !== this.tabsModel.isPinned(this.tabsModel.activeEditor)) {
                fn(); // only run if pinned state has changed
            }
        }
        ifEditorIsActive(editor, fn) {
            if (this.tabsModel.isActive(editor)) {
                fn(); // only run if editor is current active
            }
        }
        redraw() {
            const editor = this.tabsModel.activeEditor ?? undefined;
            const options = this.groupsView.partOptions;
            const isEditorPinned = editor ? this.tabsModel.isPinned(editor) : false;
            const isGroupActive = this.groupsView.activeGroup === this.groupView;
            this.activeLabel = { editor, pinned: isEditorPinned };
            // Update Breadcrumbs
            if (this.breadcrumbsControl) {
                if (isGroupActive) {
                    this.breadcrumbsControl.update();
                    this.breadcrumbsControl.domNode.classList.toggle('preview', !isEditorPinned);
                }
                else {
                    this.breadcrumbsControl.hide();
                }
            }
            // Clear if there is no editor
            const [titleContainer, editorLabel] = (0, types_1.assertAllDefined)(this.titleContainer, this.editorLabel);
            if (!editor) {
                titleContainer.classList.remove('dirty');
                editorLabel.clear();
                this.clearEditorActionsToolbar();
            }
            // Otherwise render it
            else {
                // Dirty state
                this.updateEditorDirty(editor);
                // Editor Label
                const { labelFormat } = this.groupsView.partOptions;
                let description;
                if (this.breadcrumbsControl && !this.breadcrumbsControl.isHidden()) {
                    description = ''; // hide description when showing breadcrumbs
                }
                else if (labelFormat === 'default' && !isGroupActive) {
                    description = ''; // hide description when group is not active and style is 'default'
                }
                else {
                    description = editor.getDescription(this.getVerbosity(labelFormat)) || '';
                }
                editorLabel.setResource({
                    resource: editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }),
                    name: editor.getName(),
                    description
                }, {
                    title: this.getHoverTitle(editor),
                    italic: !isEditorPinned,
                    extraClasses: ['single-tab', 'title-label'].concat(editor.getLabelExtraClasses()),
                    fileDecorations: {
                        colors: Boolean(options.decorations?.colors),
                        badges: Boolean(options.decorations?.badges)
                    },
                    icon: editor.getIcon(),
                    hideIcon: options.showIcons === false,
                });
                if (isGroupActive) {
                    titleContainer.style.color = this.getColor(theme_1.TAB_ACTIVE_FOREGROUND) || '';
                }
                else {
                    titleContainer.style.color = this.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_FOREGROUND) || '';
                }
                // Update Editor Actions Toolbar
                this.updateEditorActionsToolbar();
            }
        }
        getVerbosity(style) {
            switch (style) {
                case 'short': return 0 /* Verbosity.SHORT */;
                case 'long': return 2 /* Verbosity.LONG */;
                default: return 1 /* Verbosity.MEDIUM */;
            }
        }
        prepareEditorActions(editorActions) {
            const isGroupActive = this.groupsView.activeGroup === this.groupView;
            // Active: allow all actions
            if (isGroupActive) {
                return editorActions;
            }
            // Inactive: only show "Close, "Unlock" and secondary actions
            else {
                return {
                    primary: editorActions.primary.filter(action => action.id === editorCommands_1.CLOSE_EDITOR_COMMAND_ID || action.id === editorCommands_1.UNLOCK_GROUP_COMMAND_ID),
                    secondary: editorActions.secondary
                };
            }
        }
        getHeight() {
            return this.tabHeight;
        }
        layout(dimensions) {
            this.breadcrumbsControl?.layout(undefined);
            return new dom_1.Dimension(dimensions.container.width, this.getHeight());
        }
    }
    exports.SingleEditorTabsControl = SingleEditorTabsControl;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2luZ2xlRWRpdG9yVGFic0NvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3Ivc2luZ2xlRWRpdG9yVGFic0NvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JoRyxNQUFhLHVCQUF3QixTQUFRLHFDQUFpQjtRQUE5RDs7WUFJUyxnQkFBVyxHQUF5QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBbVZqRSxDQUFDO1FBaFZBLElBQVksa0JBQWtCLEtBQUssT0FBTyxJQUFJLENBQUMseUJBQXlCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUVqRSxNQUFNLENBQUMsTUFBbUI7WUFDNUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVyQixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQztZQUNwRCxjQUFjLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUVoQyxzQkFBc0I7WUFDdEIsSUFBSSxDQUFDLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRWhELGtCQUFrQjtZQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLGVBQU8sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUVsRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDaEQsY0FBYyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUUzQyxlQUFlO1lBQ2YsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxD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