/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, dom_1, errors_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeEditorContributions = void 0;
    class CodeEditorContributions extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._editor = null;
            this._instantiationService = null;
            /**
             * Contains all instantiated contributions.
             */
            this._instances = this._register(new lifecycle_1.DisposableMap());
            /**
             * Contains contributions which are not yet instantiated.
             */
            this._pending = new Map();
            /**
             * Tracks which instantiation kinds are still left in `_pending`.
             */
            this._finishedInstantiation = [];
            this._finishedInstantiation[0 /* EditorContributionInstantiation.Eager */] = false;
            this._finishedInstantiation[1 /* EditorContributionInstantiation.AfterFirstRender */] = false;
            this._finishedInstantiation[2 /* EditorContributionInstantiation.BeforeFirstInteraction */] = false;
            this._finishedInstantiation[3 /* EditorContributionInstantiation.Eventually */] = false;
        }
        initialize(editor, contributions, instantiationService) {
            this._editor = editor;
            this._instantiationService = instantiationService;
            for (const desc of contributions) {
                if (this._pending.has(desc.id)) {
                    (0, errors_1.onUnexpectedError)(new Error(`Cannot have two contributions with the same id ${desc.id}`));
                    continue;
                }
                this._pending.set(desc.id, desc);
            }
            this._instantiateSome(0 /* EditorContributionInstantiation.Eager */);
            // AfterFirstRender
            // - these extensions will be instantiated at the latest 50ms after the first render.
            // - but if there is idle time, we will instantiate them sooner.
            this._register((0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this._editor.getDomNode()), () => {
                this._instantiateSome(1 /* EditorContributionInstantiation.AfterFirstRender */);
            }));
            // BeforeFirstInteraction
            // - these extensions will be instantiated at the latest before a mouse or a keyboard event.
            // - but if there is idle time, we will instantiate them sooner.
            this._register((0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this._editor.getDomNode()), () => {
                this._instantiateSome(2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
            }));
            // Eventually
            // - these extensions will only be instantiated when there is idle time.
            // - since there is no guarantee that there will ever be idle time, we set a timeout of 5s here.
            this._register((0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this._editor.getDomNode()), () => {
                this._instantiateSome(3 /* EditorContributionInstantiation.Eventually */);
            }, 5000));
        }
        saveViewState() {
            const contributionsState = {};
            for (const [id, contribution] of this._instances) {
                if (typeof contribution.saveViewState === 'function') {
                    contributionsState[id] = contribution.saveViewState();
                }
            }
            return contributionsState;
        }
        restoreViewState(contributionsState) {
            for (const [id, contribution] of this._instances) {
                if (typeof contribution.restoreViewState === 'function') {
                    contribution.restoreViewState(contributionsState[id]);
                }
            }
        }
        get(id) {
            this._instantiateById(id);
            return this._instances.get(id) || null;
        }
        /**
         * used by tests
         */
        set(id, value) {
            this._instances.set(id, value);
        }
        onBeforeInteractionEvent() {
            // this method is called very often by the editor!
            this._instantiateSome(2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
        }
        onAfterModelAttached() {
            return (0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this._editor?.getDomNode()), () => {
                this._instantiateSome(1 /* EditorContributionInstantiation.AfterFirstRender */);
            }, 50);
        }
        _instantiateSome(instantiation) {
            if (this._finishedInstantiation[instantiation]) {
                // already done with this instantiation!
                return;
            }
            this._finishedInstantiation[instantiation] = true;
            const contribs = this._findPendingContributionsByInstantiation(instantiation);
            for (const contrib of contribs) {
                this._instantiateById(contrib.id);
            }
        }
        _findPendingContributionsByInstantiation(instantiation) {
            const result = [];
            for (const [, desc] of this._pending) {
                if (desc.instantiation === instantiation) {
                    result.push(desc);
                }
            }
            return result;
        }
        _instantiateById(id) {
            const desc = this._pending.get(id);
            if (!desc) {
                return;
            }
            this._pending.delete(id);
            if (!this._instantiationService || !this._editor) {
                throw new Error(`Cannot instantiate contributions before being initialized!`);
            }
            try {
                const instance = this._instantiationService.createInstance(desc.ctor, this._editor);
                this._instances.set(desc.id, instance);
                if (typeof instance.restoreViewState === 'function' && desc.instantiation !== 0 /* EditorContributionInstantiation.Eager */) {
                    console.warn(`Editor contribution '${desc.id}' should be eager instantiated because it uses saveViewState / restoreViewState.`);
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
        }
    }
    exports.CodeEditorContributions = CodeEditorContributions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUVkaXRvckNvbnRyaWJ1dGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvY29kZUVkaXRvci9jb2RlRWRpdG9yQ29udHJpYnV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSx1QkFBd0IsU0FBUSxzQkFBVTtRQWtCdEQ7WUFHQyxLQUFLLEVBQUUsQ0FBQztZQW5CRCxZQUFPLEdBQXVCLElBQUksQ0FBQztZQUNuQywwQkFBcUIsR0FBaUMsSUFBSSxDQUFDO1lBRW5FOztlQUVHO1lBQ2MsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUErQixDQUFDLENBQUM7WUFDL0Y7O2VBRUc7WUFDYyxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQTBDLENBQUM7WUFDOUU7O2VBRUc7WUFDYywyQkFBc0IsR0FBYyxFQUFFLENBQUM7WUFPdkQsSUFBSSxDQUFDLHNCQUFzQiwrQ0FBdUMsR0FBRyxLQUFLLENBQUM7WUFDM0UsSUFBSSxDQUFDLHNCQUFzQiwwREFBa0QsR0FBRyxLQUFLLENBQUM7WUFDdEYsSUFBSSxDQUFDLHNCQUFzQixnRUFBd0QsR0FBRyxLQUFLLENBQUM7WUFDNUYsSUFBSSxDQUFDLHNCQUFzQixvREFBNEMsR0FBRyxLQUFLLENBQUM7UUFDakYsQ0FBQztRQUVNLFVBQVUsQ0FBQyxNQUFtQixFQUFFLGFBQStDLEVBQUUsb0JBQTJDO1lBQ2xJLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztZQUVsRCxLQUFLLE1BQU0sSUFBSSxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMs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