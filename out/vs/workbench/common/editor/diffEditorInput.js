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
define(["require", "exports", "vs/nls", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor", "vs/workbench/common/editor/textEditorModel", "vs/workbench/common/editor/diffEditorModel", "vs/workbench/common/editor/textDiffEditorModel", "vs/workbench/services/editor/common/editorService", "vs/base/common/labels", "vs/platform/editor/common/editor"], function (require, exports, nls_1, sideBySideEditorInput_1, editor_1, textEditorModel_1, diffEditorModel_1, textDiffEditorModel_1, editorService_1, labels_1, editor_2) {
    "use strict";
    var DiffEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorInputSerializer = exports.DiffEditorInput = void 0;
    /**
     * The base editor input for the diff editor. It is made up of two editor inputs, the original version
     * and the modified version.
     */
    let DiffEditorInput = class DiffEditorInput extends sideBySideEditorInput_1.SideBySideEditorInput {
        static { DiffEditorInput_1 = this; }
        static { this.ID = 'workbench.editors.diffEditorInput'; }
        get typeId() {
            return DiffEditorInput_1.ID;
        }
        get editorId() {
            return this.modified.editorId === this.original.editorId ? this.modified.editorId : undefined;
        }
        get capabilities() {
            let capabilities = super.capabilities;
            // Force description capability depends on labels
            if (this.labels.forceDescription) {
                capabilities |= 64 /* EditorInputCapabilities.ForceDescription */;
            }
            return capabilities;
        }
        constructor(preferredName, preferredDescription, original, modified, forceOpenAsBinary, editorService) {
            super(preferredName, preferredDescription, original, modified, editorService);
            this.original = original;
            this.modified = modified;
            this.forceOpenAsBinary = forceOpenAsBinary;
            this.cachedModel = undefined;
            this.labels = this.computeLabels();
        }
        computeLabels() {
            // Name
            let name;
            let forceDescription = false;
            if (this.preferredName) {
                name = this.preferredName;
            }
            else {
                const originalName = this.original.getName();
                const modifiedName = this.modified.getName();
                name = (0, nls_1.localize)('sideBySideLabels', "{0} ↔ {1}", originalName, modifiedName);
                // Enforce description when the names are identical
                forceDescription = originalName === modifiedName;
            }
            // Description
            let shortDescription;
            let mediumDescription;
            let longDescription;
            if (this.preferredDescription) {
                shortDescription = this.preferredDescription;
                mediumDescription = this.preferredDescription;
                longDescription = this.preferredDescription;
            }
            else {
                shortDescription = this.computeLabel(this.original.getDescription(0 /* Verbosity.SHORT */), this.modified.getDescription(0 /* Verbosity.SHORT */));
                longDescription = this.computeLabel(this.original.getDescription(2 /* Verbosity.LONG */), this.modified.getDescription(2 /* Verbosity.LONG */));
                // Medium Description: try to be verbose by computing
                // a label that resembles the difference between the two
                const originalMediumDescription = this.original.getDescription(1 /* Verbosity.MEDIUM */);
                const modifiedMediumDescription = this.modified.getDescription(1 /* Verbosity.MEDIUM */);
                if ((typeof originalMediumDescription === 'string' && typeof modifiedMediumDescription === 'string') && // we can only `shorten` when both sides are strings...
                    (originalMediumDescription || modifiedMediumDescription) // ...however never when both sides are empty strings
                ) {
                    const [shortenedOriginalMediumDescription, shortenedModifiedMediumDescription] = (0, labels_1.shorten)([originalMediumDescription, modifiedMediumDescription]);
                    mediumDescription = this.computeLabel(shortenedOriginalMediumDescription, shortenedModifiedMediumDescription);
                }
            }
            // Title
            let shortTitle = this.computeLabel(this.original.getTitle(0 /* Verbosity.SHORT */) ?? this.original.getName(), this.modified.getTitle(0 /* Verbosity.SHORT */) ?? this.modified.getName(), ' ↔ ');
            let mediumTitle = this.computeLabel(this.original.getTitle(1 /* Verbosity.MEDIUM */) ?? this.original.getName(), this.modified.getTitle(1 /* Verbosity.MEDIUM */) ?? this.modified.getName(), ' ↔ ');
            let longTitle = this.computeLabel(this.original.getTitle(2 /* Verbosity.LONG */) ?? this.original.getName(), this.modified.getTitle(2 /* Verbosity.LONG */) ?? this.modified.getName(), ' ↔ ');
            const preferredTitle = this.getPreferredTitle();
            if (preferredTitle) {
                shortTitle = `${preferredTitle} (${shortTitle})`;
                mediumTitle = `${preferredTitle} (${mediumTitle})`;
                longTitle = `${preferredTitle} (${longTitle})`;
            }
            return { name, shortDescription, mediumDescription, longDescription, forceDescription, shortTitle, mediumTitle, longTitle };
        }
        computeLabel(originalLabel, modifiedLabel, separator = ' - ') {
            if (!originalLabel || !modifiedLabel) {
                return undefined;
            }
            if (originalLabel === modifiedLabel) {
                return modifiedLabel;
            }
            return `${originalLabel}${separator}${modifiedLabel}`;
        }
        getName() {
            return this.labels.name;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.labels.shortDescription;
                case 2 /* Verbosity.LONG */:
                    return this.labels.longDescription;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    return this.labels.mediumDescription;
            }
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.labels.shortTitle;
                case 2 /* Verbosity.LONG */:
                    return this.labels.longTitle;
                default:
                case 1 /* Verbosity.MEDIUM */:
                    return this.labels.mediumTitle;
            }
        }
        async resolve() {
            // Create Model - we never reuse our cached model if refresh is true because we cannot
            // decide for the inputs within if the cached model can be reused or not. There may be
            // inputs that need to be loaded again and thus we always recreate the model and dispose
            // the previous one - if any.
            const resolvedModel = await this.createModel();
            this.cachedModel?.dispose();
            this.cachedModel = resolvedModel;
            return this.cachedModel;
        }
        prefersEditorPane(editorPanes) {
            if (this.forceOpenAsBinary) {
                return editorPanes.find(editorPane => editorPane.typeId === editor_1.BINARY_DIFF_EDITOR_ID);
            }
            return editorPanes.find(editorPane => editorPane.typeId === editor_1.TEXT_DIFF_EDITOR_ID);
        }
        async createModel() {
            // Join resolve call over two inputs and build diff editor model
            const [originalEditorModel, modifiedEditorModel] = await Promise.all([
                this.original.resolve(),
                this.modified.resolve()
            ]);
            // If both are text models, return textdiffeditor model
            if (modifiedEditorModel instanceof textEditorModel_1.BaseTextEditorModel && originalEditorModel instanceof textEditorModel_1.BaseTextEditorModel) {
                return new textDiffEditorModel_1.TextDiffEditorModel(originalEditorModel, modifiedEditorModel);
            }
            // Otherwise return normal diff model
            return new diffEditorModel_1.DiffEditorModel((0, editor_2.isResolvedEditorModel)(originalEditorModel) ? originalEditorModel : undefined, (0, editor_2.isResolvedEditorModel)(modifiedEditorModel) ? modifiedEditorModel : undefined);
        }
        toUntyped(options) {
            const untyped = super.toUntyped(options);
            if (untyped) {
                return {
                    ...untyped,
                    modified: untyped.primary,
                    original: untyped.secondary
                };
            }
            return undefined;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof DiffEditorInput_1) {
                return this.modified.matches(otherInput.modified) && this.original.matches(otherInput.original) && otherInput.forceOpenAsBinary === this.forceOpenAsBinary;
            }
            if ((0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return this.modified.matches(otherInput.modified) && this.original.matches(otherInput.original);
            }
            return false;
        }
        dispose() {
            // Free the diff editor model but do not propagate the dispose() call to the two inputs
            // We never created the two inputs (original and modified) so we can not dispose
            // them without sideeffects.
            if (this.cachedModel) {
                this.cachedModel.dispose();
                this.cachedModel = undefined;
            }
            super.dispose();
        }
    };
    exports.DiffEditorInput = DiffEditorInput;
    exports.DiffEditorInput = DiffEditorInput = DiffEditorInput_1 = __decorate([
        __param(5, editorService_1.IEditorService)
    ], DiffEditorInput);
    class DiffEditorInputSerializer extends sideBySideEditorInput_1.AbstractSideBySideEditorInputSerializer {
        createEditorInput(instantiationService, name, description, secondaryInput, primaryInput) {
            return instantiationService.createInstance(DiffEditorInput, name, description, secondaryInput, primaryInput, undefined);
        }
    }
    exports.DiffEditorInputSerializer = DiffEditorInputSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvcklucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9lZGl0b3IvZGlmZkVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE2QmhHOzs7T0FHRztJQUNJLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsNkNBQXFCOztpQkFFaEMsT0FBRSxHQUFXLG1DQUFtQyxBQUE5QyxDQUErQztRQUUxRSxJQUFhLE1BQU07WUFDbEIsT0FBTyxpQkFBZSxDQUFDLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBYSxRQUFRO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDL0YsQ0FBQztRQUVELElBQWEsWUFBWTtZQUN4QixJQUFJLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO1lBRXRDLGlEQUFpRDtZQUNqRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDbEMsWUFBWSxxREFBNEMsQ0FBQztZQUMxRCxDQUFDO1lBRUQsT0FBTyxZQUFZLENBQUM7UUFDckIsQ0FBQztRQU1ELFlBQ0MsYUFBaUMsRUFDakMsb0JBQXdDLEVBQy9CLFFBQXFCLEVBQ3JCLFFBQXFCLEVBQ2IsaUJBQXNDLEVBQ3ZDLGFBQTZCO1lBRTdDLEtBQUssQ0FBQyxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUxyRSxhQUFRLEdBQVIsUUFBUSxDQUFhO1lB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