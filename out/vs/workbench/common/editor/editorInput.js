/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/arrays", "vs/workbench/common/editor", "vs/base/common/resources"], function (require, exports, event_1, arrays_1, editor_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorInput = void 0;
    /**
     * Editor inputs are lightweight objects that can be passed to the workbench API to open inside the editor part.
     * Each editor input is mapped to an editor that is capable of opening it through the Platform facade.
     */
    class EditorInput extends editor_1.AbstractEditorInput {
        constructor() {
            super(...arguments);
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this._onDidChangeCapabilities = this._register(new event_1.Emitter());
            this._onWillDispose = this._register(new event_1.Emitter());
            /**
             * Triggered when this input changes its dirty state.
             */
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            /**
             * Triggered when this input changes its label
             */
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            /**
             * Triggered when this input changes its capabilities.
             */
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            /**
             * Triggered when this input is about to be disposed.
             */
            this.onWillDispose = this._onWillDispose.event;
        }
        /**
         * Identifies the type of editor this input represents
         * This ID is registered with the {@link EditorResolverService} to allow
         * for resolving an untyped input to a typed one
         */
        get editorId() {
            return undefined;
        }
        /**
         * The capabilities of the input.
         */
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */;
        }
        /**
         * Figure out if the input has the provided capability.
         */
        hasCapability(capability) {
            if (capability === 0 /* EditorInputCapabilities.None */) {
                return this.capabilities === 0 /* EditorInputCapabilities.None */;
            }
            return (this.capabilities & capability) !== 0;
        }
        isReadonly() {
            return this.hasCapability(2 /* EditorInputCapabilities.Readonly */);
        }
        /**
         * Returns the display name of this input.
         */
        getName() {
            return `Editor ${this.typeId}`;
        }
        /**
         * Returns the display description of this input.
         */
        getDescription(verbosity) {
            return undefined;
        }
        /**
         * Returns the display title of this input.
         */
        getTitle(verbosity) {
            return this.getName();
        }
        /**
         * Returns the extra classes to apply to the label of this input.
         */
        getLabelExtraClasses() {
            return [];
        }
        /**
         * Returns the aria label to be read out by a screen reader.
         */
        getAriaLabel() {
            return this.getTitle(0 /* Verbosity.SHORT */);
        }
        /**
         * Returns the icon which represents this editor input.
         * If undefined, the default icon will be used.
         */
        getIcon() {
            return undefined;
        }
        /**
         * Returns a descriptor suitable for telemetry events.
         *
         * Subclasses should extend if they can contribute.
         */
        getTelemetryDescriptor() {
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "typeId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return { typeId: this.typeId };
        }
        /**
         * Returns if this input is dirty or not.
         */
        isDirty() {
            return false;
        }
        /**
         * Returns if the input has unsaved changes.
         */
        isModified() {
            return this.isDirty();
        }
        /**
         * Returns if this input is currently being saved or soon to be
         * saved. Based on this assumption the editor may for example
         * decide to not signal the dirty state to the user assuming that
         * the save is scheduled to happen anyway.
         */
        isSaving() {
            return false;
        }
        /**
         * Returns a type of `IDisposable` that represents the resolved input.
         * Subclasses should override to provide a meaningful model or return
         * `null` if the editor does not require a model.
         *
         * The `options` parameter are passed down from the editor when the
         * input is resolved as part of it.
         */
        async resolve() {
            return null;
        }
        /**
         * Saves the editor. The provided groupId helps implementors
         * to e.g. preserve view state of the editor and re-open it
         * in the correct group after saving.
         *
         * @returns the resulting editor input (typically the same) of
         * this operation or `undefined` to indicate that the operation
         * failed or was canceled.
         */
        async save(group, options) {
            return this;
        }
        /**
         * Saves the editor to a different location. The provided `group`
         * helps implementors to e.g. preserve view state of the editor
         * and re-open it in the correct group after saving.
         *
         * @returns the resulting editor input (typically a different one)
         * of this operation or `undefined` to indicate that the operation
         * failed or was canceled.
         */
        async saveAs(group, options) {
            return this;
        }
        /**
         * Reverts this input from the provided group.
         */
        async revert(group, options) { }
        /**
         * Called to determine how to handle a resource that is renamed that matches
         * the editors resource (or is a child of).
         *
         * Implementors are free to not implement this method to signal no intent
         * to participate. If an editor is returned though, it will replace the
         * current one with that editor and optional options.
         */
        async rename(group, target) {
            return undefined;
        }
        /**
         * Returns a copy of the current editor input. Used when we can't just reuse the input
         */
        copy() {
            return this;
        }
        /**
         * Indicates if this editor can be moved to another group. By default
         * editors can freely be moved around groups. If an editor cannot be
         * moved, a message should be returned to show to the user.
         *
         * @returns `true` if the editor can be moved to the target group, or
         * a string with a message to show to the user if the editor cannot be
         * moved.
         */
        canMove(sourceGroup, targetGroup) {
            return true;
        }
        /**
         * Returns if the other object matches this input.
         */
        matches(otherInput) {
            // Typed inputs: via  === check
            if ((0, editor_1.isEditorInput)(otherInput)) {
                return this === otherInput;
            }
            // Untyped inputs: go into properties
            const otherInputEditorId = otherInput.options?.override;
            // If the overrides are both defined and don't match that means they're separate inputs
            if (this.editorId !== otherInputEditorId && otherInputEditorId !== undefined && this.editorId !== undefined) {
                return false;
            }
            return (0, resources_1.isEqual)(this.resource, editor_1.EditorResourceAccessor.getCanonicalUri(otherInput));
        }
        /**
         * If a editor was registered onto multiple editor panes, this method
         * will be asked to return the preferred one to use.
         *
         * @param editorPanes a list of editor pane descriptors that are candidates
         * for the editor to open in.
         */
        prefersEditorPane(editorPanes) {
            return (0, arrays_1.firstOrDefault)(editorPanes);
        }
        /**
         * Returns a representation of this typed editor input as untyped
         * resource editor input that e.g. can be used to serialize the
         * editor input into a form that it can be restored.
         *
         * May return `undefined` if an untyped representation is not supported.
         */
        toUntyped(options) {
            return undefined;
        }
        /**
         * Returns if this editor is disposed.
         */
        isDisposed() {
            return this._store.isDisposed;
        }
        dispose() {
            if (!this.isDisposed()) {
                this._onWillDispose.fire();
            }
            super.dispose();
        }
    }
    exports.EditorInput = EditorInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2VkaXRvci9lZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzRGhHOzs7T0FHRztJQUNILE1BQXNCLFdBQVksU0FBUSw0QkFBbUI7UUFBN0Q7O1lBRW9CLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3hELHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3hELDZCQUF3QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBRWpFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFFdEU7O2VBRUc7WUFDTSxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBRXpEOztlQUVHO1lBQ00scUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUV6RDs7ZUFFRztZQUNNLDRCQUF1QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUFFdkU7O2VBRUc7WUFDTSxrQkFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO1FBaVJwRCxDQUFDO1FBcFBBOzs7O1dBSUc7UUFDSCxJQUFJLFFBQVE7WUFDWCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFJLFlBQVk7WUFDZixnREFBd0M7UUFDekMsQ0FBQztRQUVEOztXQUVHO1FBQ0gsYUFBYSxDQUFDLFVB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