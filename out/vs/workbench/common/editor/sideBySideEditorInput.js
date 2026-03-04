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
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, event_1, nls_1, platform_1, editor_1, editorInput_1, editorService_1) {
    "use strict";
    var SideBySideEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SideBySideEditorInputSerializer = exports.AbstractSideBySideEditorInputSerializer = exports.SideBySideEditorInput = void 0;
    /**
     * Side by side editor inputs that have a primary and secondary side.
     */
    let SideBySideEditorInput = class SideBySideEditorInput extends editorInput_1.EditorInput {
        static { SideBySideEditorInput_1 = this; }
        static { this.ID = 'workbench.editorinputs.sidebysideEditorInput'; }
        get typeId() {
            return SideBySideEditorInput_1.ID;
        }
        get capabilities() {
            // Use primary capabilities as main capabilities...
            let capabilities = this.primary.capabilities;
            // ...with the exception of `CanSplitInGroup` which
            // is only relevant to single editors.
            capabilities &= ~32 /* EditorInputCapabilities.CanSplitInGroup */;
            // Trust: should be considered for both sides
            if (this.secondary.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */)) {
                capabilities |= 16 /* EditorInputCapabilities.RequiresTrust */;
            }
            // Singleton: should be considered for both sides
            if (this.secondary.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
                capabilities |= 8 /* EditorInputCapabilities.Singleton */;
            }
            // Indicate we show more than one editor
            capabilities |= 256 /* EditorInputCapabilities.MultipleEditors */;
            return capabilities;
        }
        get resource() {
            if (this.hasIdenticalSides) {
                // pretend to be just primary side when being asked for a resource
                // in case both sides are the same. this can help when components
                // want to identify this input among others (e.g. in history).
                return this.primary.resource;
            }
            return undefined;
        }
        constructor(preferredName, preferredDescription, secondary, primary, editorService) {
            super();
            this.preferredName = preferredName;
            this.preferredDescription = preferredDescription;
            this.secondary = secondary;
            this.primary = primary;
            this.editorService = editorService;
            this.hasIdenticalSides = this.primary.matches(this.secondary);
            this.registerListeners();
        }
        registerListeners() {
            // When the primary or secondary input gets disposed, dispose this diff editor input
            this._register(event_1.Event.once(event_1.Event.any(this.primary.onWillDispose, this.secondary.onWillDispose))(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Re-emit some events from the primary side to the outside
            this._register(this.primary.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            // Re-emit some events from both sides to the outside
            this._register(this.primary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
            this._register(this.secondary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
            this._register(this.primary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
            this._register(this.secondary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
        }
        getName() {
            const preferredName = this.getPreferredName();
            if (preferredName) {
                return preferredName;
            }
            if (this.hasIdenticalSides) {
                return this.primary.getName(); // keep name concise when same editor is opened side by side
            }
            return (0, nls_1.localize)('sideBySideLabels', "{0} - {1}", this.secondary.getName(), this.primary.getName());
        }
        getPreferredName() {
            return this.preferredName;
        }
        getDescription(verbosity) {
            const preferredDescription = this.getPreferredDescription();
            if (preferredDescription) {
                return preferredDescription;
            }
            if (this.hasIdenticalSides) {
                return this.primary.getDescription(verbosity);
            }
            return super.getDescription(verbosity);
        }
        getPreferredDescription() {
            return this.preferredDescription;
        }
        getTitle(verbosity) {
            let title;
            if (this.hasIdenticalSides) {
                title = this.primary.getTitle(verbosity) ?? this.getName();
            }
            else {
                title = super.getTitle(verbosity);
            }
            const preferredTitle = this.getPreferredTitle();
            if (preferredTitle) {
                title = `${preferredTitle} (${title})`;
            }
            return title;
        }
        getPreferredTitle() {
            if (this.preferredName && this.preferredDescription) {
                return `${this.preferredName} ${this.preferredDescription}`;
            }
            if (this.preferredName || this.preferredDescription) {
                return this.preferredName ?? this.preferredDescription;
            }
            return undefined;
        }
        getLabelExtraClasses() {
            if (this.hasIdenticalSides) {
                return this.primary.getLabelExtraClasses();
            }
            return super.getLabelExtraClasses();
        }
        getAriaLabel() {
            if (this.hasIdenticalSides) {
                return this.primary.getAriaLabel();
            }
            return super.getAriaLabel();
        }
        getTelemetryDescriptor() {
            const descriptor = this.primary.getTelemetryDescriptor();
            return { ...descriptor, ...super.getTelemetryDescriptor() };
        }
        isDirty() {
            return this.primary.isDirty();
        }
        isSaving() {
            return this.primary.isSaving();
        }
        async save(group, options) {
            const primarySaveResult = await this.primary.save(group, options);
            return this.saveResultToEditor(primarySaveResult);
        }
        async saveAs(group, options) {
            const primarySaveResult = await this.primary.saveAs(group, options);
            return this.saveResultToEditor(primarySaveResult);
        }
        saveResultToEditor(primarySaveResult) {
            if (!primarySaveResult || !this.hasIdenticalSides) {
                return primarySaveResult;
            }
            if (this.primary.matches(primarySaveResult)) {
                return this;
            }
            if (primarySaveResult instanceof editorInput_1.EditorInput) {
                return new SideBySideEditorInput_1(this.preferredName, this.preferredDescription, primarySaveResult, primarySaveResult, this.editorService);
            }
            if (!(0, editor_1.isResourceDiffEditorInput)(primarySaveResult) && !(0, editor_1.isResourceMultiDiffEditorInput)(primarySaveResult) && !(0, editor_1.isResourceSideBySideEditorInput)(primarySaveResult) && !(0, editor_1.isResourceMergeEditorInput)(primarySaveResult)) {
                return {
                    primary: primarySaveResult,
                    secondary: primarySaveResult,
                    label: this.preferredName,
                    description: this.preferredDescription
                };
            }
            return undefined;
        }
        revert(group, options) {
            return this.primary.revert(group, options);
        }
        async rename(group, target) {
            if (!this.hasIdenticalSides) {
                return; // currently only enabled when both sides are identical
            }
            // Forward rename to primary side
            const renameResult = await this.primary.rename(group, target);
            if (!renameResult) {
                return undefined;
            }
            // Build a side-by-side result from the rename result
            if ((0, editor_1.isEditorInput)(renameResult.editor)) {
                return {
                    editor: new SideBySideEditorInput_1(this.preferredName, this.preferredDescription, renameResult.editor, renameResult.editor, this.editorService),
                    options: {
                        ...renameResult.options,
                        viewState: (0, editor_1.findViewStateForEditor)(this, group, this.editorService)
                    }
                };
            }
            if ((0, editor_1.isResourceEditorInput)(renameResult.editor)) {
                return {
                    editor: {
                        label: this.preferredName,
                        description: this.preferredDescription,
                        primary: renameResult.editor,
                        secondary: renameResult.editor,
                        options: {
                            ...renameResult.options,
                            viewState: (0, editor_1.findViewStateForEditor)(this, group, this.editorService)
                        }
                    }
                };
            }
            return undefined;
        }
        isReadonly() {
            return this.primary.isReadonly();
        }
        toUntyped(options) {
            const primaryResourceEditorInput = this.primary.toUntyped(options);
            const secondaryResourceEditorInput = this.secondary.toUntyped(options);
            // Prevent nested side by side editors which are unsupported
            if (primaryResourceEditorInput && secondaryResourceEditorInput &&
                !(0, editor_1.isResourceDiffEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceDiffEditorInput)(secondaryResourceEditorInput) &&
                !(0, editor_1.isResourceMultiDiffEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceMultiDiffEditorInput)(secondaryResourceEditorInput) &&
                !(0, editor_1.isResourceSideBySideEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceSideBySideEditorInput)(secondaryResourceEditorInput) &&
                !(0, editor_1.isResourceMergeEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceMergeEditorInput)(secondaryResourceEditorInput)) {
                const untypedInput = {
                    label: this.preferredName,
                    description: this.preferredDescription,
                    primary: primaryResourceEditorInput,
                    secondary: secondaryResourceEditorInput
                };
                if (typeof options?.preserveViewState === 'number') {
                    untypedInput.options = {
                        viewState: (0, editor_1.findViewStateForEditor)(this, options.preserveViewState, this.editorService)
                    };
                }
                return untypedInput;
            }
            return undefined;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if ((0, editor_1.isDiffEditorInput)(otherInput) || (0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return false; // prevent subclass from matching
            }
            if (otherInput instanceof SideBySideEditorInput_1) {
                return this.primary.matches(otherInput.primary) && this.secondary.matches(otherInput.secondary);
            }
            if ((0, editor_1.isResourceSideBySideEditorInput)(otherInput)) {
                return this.primary.matches(otherInput.primary) && this.secondary.matches(otherInput.secondary);
            }
            return false;
        }
    };
    exports.SideBySideEditorInput = SideBySideEditorInput;
    exports.SideBySideEditorInput = SideBySideEditorInput = SideBySideEditorInput_1 = __decorate([
        __param(4, editorService_1.IEditorService)
    ], SideBySideEditorInput);
    class AbstractSideBySideEditorInputSerializer {
        canSerialize(editorInput) {
            const input = editorInput;
            if (input.primary && input.secondary) {
                const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(input.secondary.typeId, input.primary.typeId);
                return !!(secondaryInputSerializer?.canSerialize(input.secondary) && primaryInputSerializer?.canSerialize(input.primary));
            }
            return false;
        }
        serialize(editorInput) {
            const input = editorInput;
            if (input.primary && input.secondary) {
                const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(input.secondary.typeId, input.primary.typeId);
                if (primaryInputSerializer && secondaryInputSerializer) {
                    const primarySerialized = primaryInputSerializer.serialize(input.primary);
                    const secondarySerialized = secondaryInputSerializer.serialize(input.secondary);
                    if (primarySerialized && secondarySerialized) {
                        const serializedEditorInput = {
                            name: input.getPreferredName(),
                            description: input.getPreferredDescription(),
                            primarySerialized,
                            secondarySerialized,
                            primaryTypeId: input.primary.typeId,
                            secondaryTypeId: input.secondary.typeId
                        };
                        return JSON.stringify(serializedEditorInput);
                    }
                }
            }
            return undefined;
        }
        deserialize(instantiationService, serializedEditorInput) {
            const deserialized = JSON.parse(serializedEditorInput);
            const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(deserialized.secondaryTypeId, deserialized.primaryTypeId);
            if (primaryInputSerializer && secondaryInputSerializer) {
                const primaryInput = primaryInputSerializer.deserialize(instantiationService, deserialized.primarySerialized);
                const secondaryInput = secondaryInputSerializer.deserialize(instantiationService, deserialized.secondarySerialized);
                if (primaryInput instanceof editorInput_1.EditorInput && secondaryInput instanceof editorInput_1.EditorInput) {
                    return this.createEditorInput(instantiationService, deserialized.name, deserialized.description, secondaryInput, primaryInput);
                }
            }
            return undefined;
        }
        getSerializers(secondaryEditorInputTypeId, primaryEditorInputTypeId) {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            return [registry.getEditorSerializer(secondaryEditorInputTypeId), registry.getEditorSerializer(primaryEditorInputTypeId)];
        }
    }
    exports.AbstractSideBySideEditorInputSerializer = AbstractSideBySideEditorInputSerializer;
    class SideBySideEditorInputSerializer extends AbstractSideBySideEditorInputSerializer {
        createEditorInput(instantiationService, name, description, secondaryInput, primaryInput) {
            return instantiationService.createInstance(SideBySideEditorInput, name, description, secondaryInput, primaryInput);
        }
    }
    exports.SideBySideEditorInputSerializer = SideBySideEditorInputSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lkZUJ5U2lkZUVkaXRvcklucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9lZGl0b3Ivc2lkZUJ5U2lkZUVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFZaEc7O09BRUc7SUFDSSxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHlCQUFXOztpQkFFckMsT0FBRSxHQUFXLDhDQUE4QyxBQUF6RCxDQUEwRDtRQUU1RSxJQUFhLE1BQU07WUFDbEIsT0FBTyx1QkFBcUIsQ0FBQyxFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVELElBQWEsWUFBWTtZQUV4QixtREFBbUQ7WUFDbkQsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUM7WUFFN0MsbURBQW1EO1lBQ25ELHNDQUFzQztZQUN0QyxZQUFZLElBQUksaURBQXdDLENBQUM7WUFFekQsNkNBQTZDO1lBQzdDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLGdEQUF1QyxFQUFFLENBQUM7Z0JBQ3pFLFlBQVksa0RBQXlDLENBQUM7WUFDdkQsQ0FBQztZQUVELGlEQUFpRDtZQUNqRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSwyQ0FBbUMsRUFBRSxDQUFDO2dCQUNyRSxZQUFZLDZDQUFxQyxDQUFDO1lBQ25ELENBQUM7WUFFRCx3Q0FBd0M7WUFDeEMsWUFBWSxxREFBMkMsQ0FBQztZQUV4RCxPQUFPLFlBQVksQ0FBQztRQUNyQixDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNUIsa0VBQWtFO2dCQUNsRSxpRUFBaUU7Z0JBQ2pFLDhEQUE4RDtnQkFDOUQsT0FB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