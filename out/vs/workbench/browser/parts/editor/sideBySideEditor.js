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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/editor/editor", "vs/base/common/lifecycle", "vs/workbench/common/theme", "vs/workbench/browser/parts/editor/editorWithViewState", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/base/common/uri", "vs/css!./media/sidebysideeditor"], function (require, exports, nls_1, dom_1, platform_1, editor_1, sideBySideEditorInput_1, telemetry_1, instantiation_1, themeService_1, editorGroupsService_1, splitview_1, event_1, storage_1, types_1, configuration_1, editor_2, lifecycle_1, theme_1, editorWithViewState_1, textResourceConfiguration_1, editorService_1, resources_1, uri_1) {
    "use strict";
    var SideBySideEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SideBySideEditor = void 0;
    function isSideBySideEditorViewState(thing) {
        const candidate = thing;
        return typeof candidate?.primary === 'object' && typeof candidate.secondary === 'object';
    }
    let SideBySideEditor = class SideBySideEditor extends editorWithViewState_1.AbstractEditorWithViewState {
        static { SideBySideEditor_1 = this; }
        static { this.ID = editor_1.SIDE_BY_SIDE_EDITOR_ID; }
        static { this.SIDE_BY_SIDE_LAYOUT_SETTING = 'workbench.editor.splitInGroupLayout'; }
        static { this.VIEW_STATE_PREFERENCE_KEY = 'sideBySideEditorViewState'; }
        //#region Layout Constraints
        get minimumPrimaryWidth() { return this.primaryEditorPane ? this.primaryEditorPane.minimumWidth : 0; }
        get maximumPrimaryWidth() { return this.primaryEditorPane ? this.primaryEditorPane.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumPrimaryHeight() { return this.primaryEditorPane ? this.primaryEditorPane.minimumHeight : 0; }
        get maximumPrimaryHeight() { return this.primaryEditorPane ? this.primaryEditorPane.maximumHeight : Number.POSITIVE_INFINITY; }
        get minimumSecondaryWidth() { return this.secondaryEditorPane ? this.secondaryEditorPane.minimumWidth : 0; }
        get maximumSecondaryWidth() { return this.secondaryEditorPane ? this.secondaryEditorPane.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumSecondaryHeight() { return this.secondaryEditorPane ? this.secondaryEditorPane.minimumHeight : 0; }
        get maximumSecondaryHeight() { return this.secondaryEditorPane ? this.secondaryEditorPane.maximumHeight : Number.POSITIVE_INFINITY; }
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        set minimumHeight(value) { }
        set maximumHeight(value) { }
        get minimumWidth() { return this.minimumPrimaryWidth + this.minimumSecondaryWidth; }
        get maximumWidth() { return this.maximumPrimaryWidth + this.maximumSecondaryWidth; }
        get minimumHeight() { return this.minimumPrimaryHeight + this.minimumSecondaryHeight; }
        get maximumHeight() { return this.maximumPrimaryHeight + this.maximumSecondaryHeight; }
        constructor(group, telemetryService, instantiationService, themeService, storageService, configurationService, textResourceConfigurationService, editorService, editorGroupService) {
            super(SideBySideEditor_1.ID, group, SideBySideEditor_1.VIEW_STATE_PREFERENCE_KEY, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
            this.configurationService = configurationService;
            //#endregion
            //#region Events
            this.onDidCreateEditors = this._register(new event_1.Emitter());
            this._onDidChangeSizeConstraints = this._register(new event_1.Relay());
            this.onDidChangeSizeConstraints = event_1.Event.any(this.onDidCreateEditors.event, this._onDidChangeSizeConstraints.event);
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            //#endregion
            this.primaryEditorPane = undefined;
            this.secondaryEditorPane = undefined;
            this.splitviewDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orientation = this.configurationService.getValue(SideBySideEditor_1.SIDE_BY_SIDE_LAYOUT_SETTING) === 'vertical' ? 0 /* Orientation.VERTICAL */ : 1 /* Orientation.HORIZONTAL */;
            this.dimension = new dom_1.Dimension(0, 0);
            this.lastFocusedSide = undefined;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onConfigurationUpdated(event) {
            if (event.affectsConfiguration(SideBySideEditor_1.SIDE_BY_SIDE_LAYOUT_SETTING)) {
                this.orientation = this.configurationService.getValue(SideBySideEditor_1.SIDE_BY_SIDE_LAYOUT_SETTING) === 'vertical' ? 0 /* Orientation.VERTICAL */ : 1 /* Orientation.HORIZONTAL */;
                // If config updated from event, re-create the split
                // editor using the new layout orientation if it was
                // already created.
                if (this.splitview) {
                    this.recreateSplitview();
                }
            }
        }
        recreateSplitview() {
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            // Clear old (if any) but remember ratio
            const ratio = this.getSplitViewRatio();
            if (this.splitview) {
                container.removeChild(this.splitview.el);
                this.splitviewDisposables.clear();
            }
            // Create new
            this.createSplitView(container, ratio);
            this.layout(this.dimension);
        }
        getSplitViewRatio() {
            let ratio = undefined;
            if (this.splitview) {
                const leftViewSize = this.splitview.getViewSize(0);
                const rightViewSize = this.splitview.getViewSize(1);
                // Only return a ratio when the view size is significantly
                // enough different for left and right view sizes
                if (Math.abs(leftViewSize - rightViewSize) > 1) {
                    const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                    ratio = leftViewSize / totalSize;
                }
            }
            return ratio;
        }
        createEditor(parent) {
            parent.classList.add('side-by-side-editor');
            // Editor pane containers
            this.secondaryEditorContainer = (0, dom_1.$)('.side-by-side-editor-container.editor-instance');
            this.primaryEditorContainer = (0, dom_1.$)('.side-by-side-editor-container.editor-instance');
            // Split view
            this.createSplitView(parent);
        }
        createSplitView(parent, ratio) {
            // Splitview widget
            this.splitview = this.splitviewDisposables.add(new splitview_1.SplitView(parent, { orientation: this.orientation }));
            this.splitviewDisposables.add(this.splitview.onDidSashReset(() => this.splitview?.distributeViewSizes()));
            if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                this.splitview.orthogonalEndSash = this._boundarySashes?.bottom;
            }
            else {
                this.splitview.orthogonalStartSash = this._boundarySashes?.left;
                this.splitview.orthogonalEndSash = this._boundarySashes?.right;
            }
            // Figure out sizing
            let leftSizing = splitview_1.Sizing.Distribute;
            let rightSizing = splitview_1.Sizing.Distribute;
            if (ratio) {
                const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                leftSizing = Math.round(totalSize * ratio);
                rightSizing = totalSize - leftSizing;
                // We need to call `layout` for the `ratio` to have any effect
                this.splitview.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height);
            }
            // Secondary (left)
            const secondaryEditorContainer = (0, types_1.assertIsDefined)(this.secondaryEditorContainer);
            this.splitview.addView({
                element: secondaryEditorContainer,
                layout: size => this.layoutPane(this.secondaryEditorPane, size),
                minimumSize: this.orientation === 1 /* Orientation.HORIZONTAL */ ? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, leftSizing);
            // Primary (right)
            const primaryEditorContainer = (0, types_1.assertIsDefined)(this.primaryEditorContainer);
            this.splitview.addView({
                element: primaryEditorContainer,
                layout: size => this.layoutPane(this.primaryEditorPane, size),
                minimumSize: this.orientation === 1 /* Orientation.HORIZONTAL */ ? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, rightSizing);
            this.updateStyles();
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('sideBySideEditor', "Side by Side Editor");
        }
        async setInput(input, options, context, token) {
            const oldInput = this.input;
            await super.setInput(input, options, context, token);
            // Create new side by side editors if either we have not
            // been created before or the input no longer matches.
            if (!oldInput || !input.matches(oldInput)) {
                if (oldInput) {
                    this.disposeEditors();
                }
                this.createEditors(input);
            }
            // Restore any previous view state
            const { primary, secondary, viewState } = this.loadViewState(input, options, context);
            this.lastFocusedSide = viewState?.focus;
            if (typeof viewState?.ratio === 'number' && this.splitview) {
                const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                this.splitview.resizeView(0, Math.round(totalSize * viewState.ratio));
            }
            else {
                this.splitview?.distributeViewSizes();
            }
            // Set input to both sides
            await Promise.all([
                this.secondaryEditorPane?.setInput(input.secondary, secondary, context, token),
                this.primaryEditorPane?.setInput(input.primary, primary, context, token)
            ]);
            // Update focus if target is provided
            if (typeof options?.target === 'number') {
                this.lastFocusedSide = options.target;
            }
        }
        loadViewState(input, options, context) {
            const viewState = isSideBySideEditorViewState(options?.viewState) ? options?.viewState : this.loadEditorViewState(input, context);
            let primaryOptions = Object.create(null);
            let secondaryOptions = undefined;
            // Depending on the optional `target` property, we apply
            // the provided options to either the primary or secondary
            // side
            if (options?.target === editor_1.SideBySideEditor.SECONDARY) {
                secondaryOptions = { ...options };
            }
            else {
                primaryOptions = { ...options };
            }
            primaryOptions.viewState = viewState?.primary;
            if (viewState?.secondary) {
                if (!secondaryOptions) {
                    secondaryOptions = { viewState: viewState.secondary };
                }
                else {
                    secondaryOptions.viewState = viewState?.secondary;
                }
            }
            return { primary: primaryOptions, secondary: secondaryOptions, viewState };
        }
        createEditors(newInput) {
            // Create editors
            this.secondaryEditorPane = this.doCreateEditor(newInput.secondary, (0, types_1.assertIsDefined)(this.secondaryEditorContainer));
            this.primaryEditorPane = this.doCreateEditor(newInput.primary, (0, types_1.assertIsDefined)(this.primaryEditorContainer));
            // Layout
            this.layout(this.dimension);
            // Eventing
            this._onDidChangeSizeConstraints.input = event_1.Event.any(event_1.Event.map(this.secondaryEditorPane.onDidChangeSizeConstraints, () => undefined), event_1.Event.map(this.primaryEditorPane.onDidChangeSizeConstraints, () => undefined));
            this.onDidCreateEditors.fire(undefined);
            // Track focus and signal active control change via event
            this.editorDisposables.add(this.primaryEditorPane.onDidFocus(() => this.onDidFocusChange(editor_1.SideBySideEditor.PRIMARY)));
            this.editorDisposables.add(this.secondaryEditorPane.onDidFocus(() => this.onDidFocusChange(editor_1.SideBySideEditor.SECONDARY)));
        }
        doCreateEditor(editorInput, container) {
            const editorPaneDescriptor = platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).getEditorPane(editorInput);
            if (!editorPaneDescriptor) {
                throw new Error('No editor pane descriptor for editor found');
            }
            // Create editor pane and make visible
            const editorPane = editorPaneDescriptor.instantiate(this.instantiationService, this.group);
            editorPane.create(container);
            editorPane.setVisible(this.isVisible());
            // Track selections if supported
            if ((0, editor_1.isEditorPaneWithSelection)(editorPane)) {
                this.editorDisposables.add(editorPane.onDidChangeSelection(e => this._onDidChangeSelection.fire(e)));
            }
            // Track for disposal
            this.editorDisposables.add(editorPane);
            return editorPane;
        }
        onDidFocusChange(side) {
            this.lastFocusedSide = side;
            // Signal to outside that our active control changed
            this._onDidChangeControl.fire();
        }
        getSelection() {
            const lastFocusedEditorPane = this.getLastFocusedEditorPane();
            if ((0, editor_1.isEditorPaneWithSelection)(lastFocusedEditorPane)) {
                const selection = lastFocusedEditorPane.getSelection();
                if (selection) {
                    return new SideBySideAwareEditorPaneSelection(selection, lastFocusedEditorPane === this.primaryEditorPane ? editor_1.SideBySideEditor.PRIMARY : editor_1.SideBySideEditor.SECONDARY);
                }
            }
            return undefined;
        }
        setOptions(options) {
            super.setOptions(options);
            // Update focus if target is provided
            if (typeof options?.target === 'number') {
                this.lastFocusedSide = options.target;
            }
            // Apply to focused side
            this.getLastFocusedEditorPane()?.setOptions(options);
        }
        setEditorVisible(visible) {
            // Forward to both sides
            this.primaryEditorPane?.setVisible(visible);
            this.secondaryEditorPane?.setVisible(visible);
            super.setEditorVisible(visible);
        }
        clearInput() {
            super.clearInput();
            // Forward to both sides
            this.primaryEditorPane?.clearInput();
            this.secondaryEditorPane?.clearInput();
            // Since we do not keep side editors alive
            // we dispose any editor created for recreation
            this.disposeEditors();
        }
        focus() {
            super.focus();
            this.getLastFocusedEditorPane()?.focus();
        }
        getLastFocusedEditorPane() {
            if (this.lastFocusedSide === editor_1.SideBySideEditor.SECONDARY) {
                return this.secondaryEditorPane;
            }
            return this.primaryEditorPane;
        }
        layout(dimension) {
            this.dimension = dimension;
            const splitview = (0, types_1.assertIsDefined)(this.splitview);
            splitview.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? dimension.width : dimension.height);
        }
        setBoundarySashes(sashes) {
            this._boundarySashes = sashes;
            if (this.splitview) {
                this.splitview.orthogonalEndSash = sashes.bottom;
            }
        }
        layoutPane(pane, size) {
            pane?.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? new dom_1.Dimension(size, this.dimension.height) : new dom_1.Dimension(this.dimension.width, size));
        }
        getControl() {
            return this.getLastFocusedEditorPane()?.getControl();
        }
        getPrimaryEditorPane() {
            return this.primaryEditorPane;
        }
        getSecondaryEditorPane() {
            return this.secondaryEditorPane;
        }
        tracksEditorViewState(input) {
            return input instanceof sideBySideEditorInput_1.SideBySideEditorInput;
        }
        computeEditorViewState(resource) {
            if (!this.input || !(0, resources_1.isEqual)(resource, this.toEditorViewStateResource(this.input))) {
                return; // unexpected state
            }
            const primarViewState = this.primaryEditorPane?.getViewState();
            const secondaryViewState = this.secondaryEditorPane?.getViewState();
            if (!primarViewState || !secondaryViewState) {
                return; // we actually need view states
            }
            return {
                primary: primarViewState,
                secondary: secondaryViewState,
                focus: this.lastFocusedSide,
                ratio: this.getSplitViewRatio()
            };
        }
        toEditorViewStateResource(input) {
            let primary;
            let secondary;
            if (input instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                primary = input.primary.resource;
                secondary = input.secondary.resource;
            }
            if (!secondary || !primary) {
                return undefined;
            }
            // create a URI that is the Base64 concatenation of original + modified resource
            return uri_1.URI.from({ scheme: 'sideBySide', path: `${(0, dom_1.multibyteAwareBtoa)(secondary.toString())}${(0, dom_1.multibyteAwareBtoa)(primary.toString())}` });
        }
        updateStyles() {
            super.updateStyles();
            if (this.primaryEditorContainer) {
                if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                    this.primaryEditorContainer.style.borderLeftWidth = '1px';
                    this.primaryEditorContainer.style.borderLeftStyle = 'solid';
                    this.primaryEditorContainer.style.borderLeftColor = this.getColor(theme_1.SIDE_BY_SIDE_EDITOR_VERTICAL_BORDER) ?? '';
                    this.primaryEditorContainer.style.borderTopWidth = '0';
                }
                else {
                    this.primaryEditorContainer.style.borderTopWidth = '1px';
                    this.primaryEditorContainer.style.borderTopStyle = 'solid';
                    this.primaryEditorContainer.style.borderTopColor = this.getColor(theme_1.SIDE_BY_SIDE_EDITOR_HORIZONTAL_BORDER) ?? '';
                    this.primaryEditorContainer.style.borderLeftWidth = '0';
                }
            }
        }
        dispose() {
            this.disposeEditors();
            super.dispose();
        }
        disposeEditors() {
            this.editorDisposables.clear();
            this.secondaryEditorPane = undefined;
            this.primaryEditorPane = undefined;
            this.lastFocusedSide = undefined;
            if (this.secondaryEditorContainer) {
                (0, dom_1.clearNode)(this.secondaryEditorContainer);
            }
            if (this.primaryEditorContainer) {
                (0, dom_1.clearNode)(this.primaryEditorContainer);
            }
        }
    };
    exports.SideBySideEditor = SideBySideEditor;
    exports.SideBySideEditor = SideBySideEditor = SideBySideEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, editorService_1.IEditorService),
        __param(8, editorGroupsService_1.IEditorGroupsService)
    ], SideBySideEditor);
    class SideBySideAwareEditorPaneSelection {
        constructor(selection, side) {
            this.selection = selection;
            this.side = side;
        }
        compare(other) {
            if (!(other instanceof SideBySideAwareEditorPaneSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            if (this.side !== other.side) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            return this.selection.compare(other.selection);
        }
        restore(options) {
            const sideBySideEditorOptions = {
                ...options,
                target: this.side
            };
            return this.selection.restore(sideBySideEditorOptions);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lkZUJ5U2lkZUVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9zaWRlQnlTaWRlRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1Q2hHLFNBQVMsMkJBQTJCLENBQUMsS0FBYztRQUNsRCxNQUFNLFNBQVMsR0FBRyxLQUErQyxDQUFDO1FBRWxFLE9BQU8sT0FBTyxTQUFTLEVBQUUsT0FBTyxLQUFLLFFBQVEsSUFBSSxPQUFPLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxDQUFDO0lBQzFGLENBQUM7SUFlTSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLGlEQUF1RDs7aUJBRTVFLE9BQUUsR0FBVywrQkFBc0IsQUFBakMsQ0FBa0M7aUJBRTdDLGdDQUEyQixHQUFHLHFDQUFxQyxBQUF4QyxDQUF5QztpQkFFbkQsOEJBQXlCLEdBQUcsMkJBQTJCLEFBQTlCLENBQStCO1FBRWhGLDRCQUE0QjtRQUU1QixJQUFZLG1CQUFtQixLQUFLLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlHLElBQVksbUJBQW1CLEtBQUssT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDckksSUFBWSxvQkFBb0IsS0FBSyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFD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