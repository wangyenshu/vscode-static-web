/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/workbench/common/component", "vs/base/common/event", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/types"], function (require, exports, actions_1, component_1, event_1, dom_1, lifecycle_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositeRegistry = exports.CompositeDescriptor = exports.Composite = void 0;
    /**
     * Composites are layed out in the sidebar and panel part of the workbench. At a time only one composite
     * can be open in the sidebar, and only one composite can be open in the panel.
     *
     * Each composite has a minimized representation that is good enough to provide some
     * information about the state of the composite data.
     *
     * The workbench will keep a composite alive after it has been created and show/hide it based on
     * user interaction. The lifecycle of a composite goes in the order create(), setVisible(true|false),
     * layout(), focus(), dispose(). During use of the workbench, a composite will often receive a setVisible,
     * layout and focus call, but only one create and dispose call.
     */
    class Composite extends component_1.Component {
        get onDidFocus() {
            if (!this._onDidFocus) {
                this._onDidFocus = this.registerFocusTrackEvents().onDidFocus;
            }
            return this._onDidFocus.event;
        }
        get onDidBlur() {
            if (!this._onDidBlur) {
                this._onDidBlur = this.registerFocusTrackEvents().onDidBlur;
            }
            return this._onDidBlur.event;
        }
        hasFocus() {
            return this._hasFocus;
        }
        registerFocusTrackEvents() {
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            const focusTracker = this._register((0, dom_1.trackFocus)(container));
            const onDidFocus = this._onDidFocus = this._register(new event_1.Emitter());
            this._register(focusTracker.onDidFocus(() => {
                this._hasFocus = true;
                onDidFocus.fire();
            }));
            const onDidBlur = this._onDidBlur = this._register(new event_1.Emitter());
            this._register(focusTracker.onDidBlur(() => {
                this._hasFocus = false;
                onDidBlur.fire();
            }));
            return { onDidFocus, onDidBlur };
        }
        constructor(id, telemetryService, themeService, storageService) {
            super(id, themeService, storageService);
            this.telemetryService = telemetryService;
            this._onTitleAreaUpdate = this._register(new event_1.Emitter());
            this.onTitleAreaUpdate = this._onTitleAreaUpdate.event;
            this._hasFocus = false;
            this.visible = false;
        }
        getTitle() {
            return undefined;
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Called to create this composite on the provided parent. This method is only
         * called once during the lifetime of the workbench.
         * Note that DOM-dependent calculations should be performed from the setVisible()
         * call. Only then the composite will be part of the DOM.
         */
        create(parent) {
            this.parent = parent;
        }
        /**
         * Returns the container this composite is being build in.
         */
        getContainer() {
            return this.parent;
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Called to indicate that the composite has become visible or hidden. This method
         * is called more than once during workbench lifecycle depending on the user interaction.
         * The composite will be on-DOM if visible is set to true and off-DOM otherwise.
         *
         * Typically this operation should be fast though because setVisible might be called many times during a session.
         * If there is a long running operation it is fine to have it running in the background asyncly and return before.
         */
        setVisible(visible) {
            if (this.visible !== !!visible) {
                this.visible = visible;
            }
        }
        /**
         * Called when this composite should receive keyboard focus.
         */
        focus() {
            // Subclasses can implement
        }
        /**
         *
         * @returns the action runner for this composite
         */
        getMenuIds() {
            return [];
        }
        /**
         * Returns an array of actions to show in the action bar of the composite.
         */
        getActions() {
            return [];
        }
        /**
         * Returns an array of actions to show in the action bar of the composite
         * in a less prominent way then action from getActions.
         */
        getSecondaryActions() {
            return [];
        }
        /**
         * Returns an array of actions to show in the context menu of the composite
         */
        getContextMenuActions() {
            return [];
        }
        /**
         * For any of the actions returned by this composite, provide an IActionViewItem in
         * cases where the implementor of the composite wants to override the presentation
         * of an action. Returns undefined to indicate that the action is not rendered through
         * an action item.
         */
        getActionViewItem(action, options) {
            return undefined;
        }
        /**
         * Provide a context to be passed to the toolbar.
         */
        getActionsContext() {
            return null;
        }
        /**
         * Returns the instance of IActionRunner to use with this composite for the
         * composite tool bar.
         */
        getActionRunner() {
            if (!this.actionRunner) {
                this.actionRunner = this._register(new actions_1.ActionRunner());
            }
            return this.actionRunner;
        }
        /**
         * Method for composite implementors to indicate to the composite container that the title or the actions
         * of the composite have changed. Calling this method will cause the container to ask for title (getTitle())
         * and actions (getActions(), getSecondaryActions()) if the composite is visible or the next time the composite
         * gets visible.
         */
        updateTitleArea() {
            this._onTitleAreaUpdate.fire();
        }
        /**
         * Returns true if this composite is currently visible and false otherwise.
         */
        isVisible() {
            return this.visible;
        }
        /**
         * Returns the underlying composite control or `undefined` if it is not accessible.
         */
        getControl() {
            return undefined;
        }
    }
    exports.Composite = Composite;
    /**
     * A composite descriptor is a lightweight descriptor of a composite in the workbench.
     */
    class CompositeDescriptor {
        constructor(ctor, id, name, cssClass, order, requestedIndex) {
            this.ctor = ctor;
            this.id = id;
            this.name = name;
            this.cssClass = cssClass;
            this.order = order;
            this.requestedIndex = requestedIndex;
        }
        instantiate(instantiationService) {
            return instantiationService.createInstance(this.ctor);
        }
    }
    exports.CompositeDescriptor = CompositeDescriptor;
    class CompositeRegistry extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidDeregister = this._register(new event_1.Emitter());
            this.onDidDeregister = this._onDidDeregister.event;
            this.composites = [];
        }
        registerComposite(descriptor) {
            if (this.compositeById(descriptor.id)) {
                return;
            }
            this.composites.push(descriptor);
            this._onDidRegister.fire(descriptor);
        }
        deregisterComposite(id) {
            const descriptor = this.compositeById(id);
            if (!descriptor) {
                return;
            }
            this.composites.splice(this.composites.indexOf(descriptor), 1);
            this._onDidDeregister.fire(descriptor);
        }
        getComposite(id) {
            return this.compositeById(id);
        }
        getComposites() {
            return this.composites.slice(0);
        }
        compositeById(id) {
            return this.composites.find(composite => composite.id === id);
        }
    }
    exports.CompositeRegistry = CompositeRegistry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zaXRlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvY29tcG9zaXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEc7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxNQUFzQixTQUFVLFNBQVEscUJBQVM7UUFNaEQsSUFBSSxVQUFVO1lBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxVQUFVLENBQUM7WUFDL0QsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7UUFDL0IsQ0FBQztRQUdELElBQUksU0FBUztZQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUMsU0FBUyxDQUFDO1lBQzdELENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBQzlCLENBQUM7UUFHRCxRQUFRO1lBQ1AsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFTyx3QkFBd0I7WUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxnQkFBVSxFQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFM0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMs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