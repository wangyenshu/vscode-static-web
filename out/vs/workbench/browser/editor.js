/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/base/common/async", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/network", "vs/base/common/iterator", "vs/base/common/event"], function (require, exports, nls_1, editor_1, platform_1, lifecycle_1, async_1, editorService_1, uriIdentity_1, workingCopyService_1, network_1, iterator_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorPaneRegistry = exports.EditorPaneDescriptor = void 0;
    exports.whenEditorClosed = whenEditorClosed;
    exports.computeEditorAriaLabel = computeEditorAriaLabel;
    /**
     * A lightweight descriptor of an editor pane. The descriptor is deferred so that heavy editor
     * panes can load lazily in the workbench.
     */
    class EditorPaneDescriptor {
        static { this.instantiatedEditorPanes = new Set(); }
        static didInstantiateEditorPane(typeId) {
            return EditorPaneDescriptor.instantiatedEditorPanes.has(typeId);
        }
        static { this._onWillInstantiateEditorPane = new event_1.Emitter(); }
        static { this.onWillInstantiateEditorPane = EditorPaneDescriptor._onWillInstantiateEditorPane.event; }
        static create(ctor, typeId, name) {
            return new EditorPaneDescriptor(ctor, typeId, name);
        }
        constructor(ctor, typeId, name) {
            this.ctor = ctor;
            this.typeId = typeId;
            this.name = name;
        }
        instantiate(instantiationService, group) {
            EditorPaneDescriptor._onWillInstantiateEditorPane.fire({ typeId: this.typeId });
            const pane = instantiationService.createInstance(this.ctor, group);
            EditorPaneDescriptor.instantiatedEditorPanes.add(this.typeId);
            return pane;
        }
        describes(editorPane) {
            return editorPane.getId() === this.typeId;
        }
    }
    exports.EditorPaneDescriptor = EditorPaneDescriptor;
    class EditorPaneRegistry {
        constructor() {
            this.mapEditorPanesToEditors = new Map();
            //#endregion
        }
        registerEditorPane(editorPaneDescriptor, editorDescriptors) {
            this.mapEditorPanesToEditors.set(editorPaneDescriptor, editorDescriptors);
            return (0, lifecycle_1.toDisposable)(() => {
                this.mapEditorPanesToEditors.delete(editorPaneDescriptor);
            });
        }
        getEditorPane(editor) {
            const descriptors = this.findEditorPaneDescriptors(editor);
            if (descriptors.length === 0) {
                return undefined;
            }
            if (descriptors.length === 1) {
                return descriptors[0];
            }
            return editor.prefersEditorPane(descriptors);
        }
        findEditorPaneDescriptors(editor, byInstanceOf) {
            const matchingEditorPaneDescriptors = [];
            for (const editorPane of this.mapEditorPanesToEditors.keys()) {
                const editorDescriptors = this.mapEditorPanesToEditors.get(editorPane) || [];
                for (const editorDescriptor of editorDescriptors) {
                    const editorClass = editorDescriptor.ctor;
                    // Direct check on constructor type (ignores prototype chain)
                    if (!byInstanceOf && editor.constructor === editorClass) {
                        matchingEditorPaneDescriptors.push(editorPane);
                        break;
                    }
                    // Normal instanceof check
                    else if (byInstanceOf && editor instanceof editorClass) {
                        matchingEditorPaneDescriptors.push(editorPane);
                        break;
                    }
                }
            }
            // If no descriptors found, continue search using instanceof and prototype chain
            if (!byInstanceOf && matchingEditorPaneDescriptors.length === 0) {
                return this.findEditorPaneDescriptors(editor, true);
            }
            return matchingEditorPaneDescriptors;
        }
        //#region Used for tests only
        getEditorPaneByType(typeId) {
            return iterator_1.Iterable.find(this.mapEditorPanesToEditors.keys(), editor => editor.typeId === typeId);
        }
        getEditorPanes() {
            return Array.from(this.mapEditorPanesToEditors.keys());
        }
        getEditors() {
            const editorClasses = [];
            for (const editorPane of this.mapEditorPanesToEditors.keys()) {
                const editorDescriptors = this.mapEditorPanesToEditors.get(editorPane);
                if (editorDescriptors) {
                    editorClasses.push(...editorDescriptors.map(editorDescriptor => editorDescriptor.ctor));
                }
            }
            return editorClasses;
        }
    }
    exports.EditorPaneRegistry = EditorPaneRegistry;
    platform_1.Registry.add(editor_1.EditorExtensions.EditorPane, new EditorPaneRegistry());
    //#endregion
    //#region Editor Close Tracker
    function whenEditorClosed(accessor, resources) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
        const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
        return new Promise(resolve => {
            let remainingResources = [...resources];
            // Observe any editor closing from this moment on
            const listener = editorService.onDidCloseEditor(async (event) => {
                if (event.context === editor_1.EditorCloseContext.MOVE) {
                    return; // ignore move events where the editor will open in another group
                }
                let primaryResource = editor_1.EditorResourceAccessor.getOriginalUri(event.editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                let secondaryResource = editor_1.EditorResourceAccessor.getOriginalUri(event.editor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                // Specially handle an editor getting replaced: if the new active editor
                // matches any of the resources from the closed editor, ignore those
                // resources because they were actually not closed, but replaced.
                // (see https://github.com/microsoft/vscode/issues/134299)
                if (event.context === editor_1.EditorCloseContext.REPLACE) {
                    const newPrimaryResource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                    const newSecondaryResource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                    if (uriIdentityService.extUri.isEqual(primaryResource, newPrimaryResource)) {
                        primaryResource = undefined;
                    }
                    if (uriIdentityService.extUri.isEqual(secondaryResource, newSecondaryResource)) {
                        secondaryResource = undefined;
                    }
                }
                // Remove from resources to wait for being closed based on the
                // resources from editors that got closed
                remainingResources = remainingResources.filter(resource => {
                    // Closing editor matches resource directly: remove from remaining
                    if (uriIdentityService.extUri.isEqual(resource, primaryResource) || uriIdentityService.extUri.isEqual(resource, secondaryResource)) {
                        return false;
                    }
                    // Closing editor is untitled with associated resource
                    // that matches resource directly: remove from remaining
                    // but only if the editor was not replaced, otherwise
                    // saving an untitled with associated resource would
                    // release the `--wait` call.
                    // (see https://github.com/microsoft/vscode/issues/141237)
                    if (event.context !== editor_1.EditorCloseContext.REPLACE) {
                        if ((primaryResource?.scheme === network_1.Schemas.untitled && uriIdentityService.extUri.isEqual(resource, primaryResource.with({ scheme: resource.scheme }))) ||
                            (secondaryResource?.scheme === network_1.Schemas.untitled && uriIdentityService.extUri.isEqual(resource, secondaryResource.with({ scheme: resource.scheme })))) {
                            return false;
                        }
                    }
                    // Editor is not yet closed, so keep it in waiting mode
                    return true;
                });
                // All resources to wait for being closed are closed
                if (remainingResources.length === 0) {
                    // If auto save is configured with the default delay (1s) it is possible
                    // to close the editor while the save still continues in the background. As such
                    // we have to also check if the editors to track for are dirty and if so wait
                    // for them to get saved.
                    const dirtyResources = resources.filter(resource => workingCopyService.isDirty(resource));
                    if (dirtyResources.length > 0) {
                        await async_1.Promises.settled(dirtyResources.map(async (resource) => await new Promise(resolve => {
                            if (!workingCopyService.isDirty(resource)) {
                                return resolve(); // return early if resource is not dirty
                            }
                            // Otherwise resolve promise when resource is saved
                            const listener = workingCopyService.onDidChangeDirty(workingCopy => {
                                if (!workingCopy.isDirty() && uriIdentityService.extUri.isEqual(resource, workingCopy.resource)) {
                                    listener.dispose();
                                    return resolve();
                                }
                            });
                        })));
                    }
                    listener.dispose();
                    return resolve();
                }
            });
        });
    }
    //#endregion
    //#region ARIA
    function computeEditorAriaLabel(input, index, group, groupCount) {
        let ariaLabel = input.getAriaLabel();
        if (group && !group.isPinned(input)) {
            ariaLabel = (0, nls_1.localize)('preview', "{0}, preview", ariaLabel);
        }
        if (group?.isSticky(index ?? input)) {
            ariaLabel = (0, nls_1.localize)('pinned', "{0}, pinned", ariaLabel);
        }
        // Apply group information to help identify in
        // which group we are (only if more than one group
        // is actually opened)
        if (group && typeof groupCount === 'number' && groupCount > 1) {
            ariaLabel = `${ariaLabel}, ${group.ariaLabel}`;
        }
        return ariaLabel;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRLaEcsNENBNkZDO0lBTUQsd0RBa0JDO0lBdFBEOzs7T0FHRztJQUNILE1BQWEsb0JBQW9CO2lCQUVSLDRCQUF1QixHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDcEUsTUFBTSxDQUFDLHdCQUF3QixDQUFDLE1BQWM7WUFDN0MsT0FBTyxvQkFBb0IsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakUsQ0FBQztpQkFFdUIsaUNBQTRCLEdBQUcsSUFBSSxlQUFPLEVBQW1DLENBQUM7aUJBQ3RGLGdDQUEyQixHQUFHLG9CQUFvQixDQUFDLDRCQUE0QixDQUFDLEtBQUssQ0FBQztRQUV0RyxNQUFNLENBQUMsTUFBTSxDQUNaLElBQXFFLEVBQ3JFLE1BQWMsRUFDZCxJQUFZO1lBRVosT0FBTyxJQUFJLG9CQUFvQixDQUFDLElBQXlELEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzFHLENBQUM7UUFFRCxZQUNrQixJQUF1RCxFQUMvRCxNQUFjLEVBQ2QsSUFBWTtZQUZKLFNBQUksR0FBSixJQUFJLENBQW1EO1lBQy9ELFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ2xCLENBQUM7UUFFTCxXQUFXLENBQUMsb0JBQTJDLEVBQUUsS0FBbUI7WUFDM0Usb0JBQW9CLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBRWhGLE1BQU0sSUFBSSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxJ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