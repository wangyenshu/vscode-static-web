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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/inlayHints/browser/inlayHints", "vs/editor/contrib/inlayHints/browser/inlayHintsController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/browser/link"], function (require, exports, dom, cancellation_1, lifecycle_1, editorExtensions_1, editorContextKeys_1, inlayHints_1, inlayHintsController_1, nls_1, actions_1, accessibilitySignalService_1, contextkey_1, instantiation_1, link_1) {
    "use strict";
    var InlayHintsAccessibility_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsAccessibility = void 0;
    let InlayHintsAccessibility = class InlayHintsAccessibility {
        static { InlayHintsAccessibility_1 = this; }
        static { this.IsReading = new contextkey_1.RawContextKey('isReadingLineWithInlayHints', false, { type: 'boolean', description: (0, nls_1.localize)('isReadingLineWithInlayHints', "Whether the current line and its inlay hints are currently focused") }); }
        static { this.ID = 'editor.contrib.InlayHintsAccessibility'; }
        static get(editor) {
            return editor.getContribution(InlayHintsAccessibility_1.ID) ?? undefined;
        }
        constructor(_editor, contextKeyService, _accessibilitySignalService, _instaService) {
            this._editor = _editor;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._instaService = _instaService;
            this._sessionDispoosables = new lifecycle_1.DisposableStore();
            this._ariaElement = document.createElement('span');
            this._ariaElement.style.position = 'fixed';
            this._ariaElement.className = 'inlayhint-accessibility-element';
            this._ariaElement.tabIndex = 0;
            this._ariaElement.setAttribute('aria-description', (0, nls_1.localize)('description', "Code with Inlay Hint Information"));
            this._ctxIsReading = InlayHintsAccessibility_1.IsReading.bindTo(contextKeyService);
        }
        dispose() {
            this._sessionDispoosables.dispose();
            this._ctxIsReading.reset();
            this._ariaElement.remove();
        }
        _reset() {
            dom.clearNode(this._ariaElement);
            this._sessionDispoosables.clear();
            this._ctxIsReading.reset();
        }
        async _read(line, hints) {
            this._sessionDispoosables.clear();
            if (!this._ariaElement.isConnected) {
                this._editor.getDomNode()?.appendChild(this._ariaElement);
            }
            if (!this._editor.hasModel() || !this._ariaElement.isConnected) {
                this._ctxIsReading.set(false);
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            this._sessionDispoosables.add(cts);
            for (const hint of hints) {
                await hint.resolve(cts.token);
            }
            if (cts.token.isCancellationRequested) {
                return;
            }
            const model = this._editor.getModel();
            // const text = this._editor.getModel().getLineContent(line);
            const newChildren = [];
            let start = 0;
            let tooLongToRead = false;
            for (const item of hints) {
                // text
                const part = model.getValueInRange({ startLineNumber: line, startColumn: start + 1, endLineNumber: line, endColumn: item.hint.position.column });
                if (part.length > 0) {
                    newChildren.push(part);
                    start = item.hint.position.column - 1;
                }
                // check length
                if (start > 750) {
                    newChildren.push('…');
                    tooLongToRead = true;
                    break;
                }
                // hint
                const em = document.createElement('em');
                const { label } = item.hint;
                if (typeof label === 'string') {
                    em.innerText = label;
                }
                else {
                    for (const part of label) {
                        if (part.command) {
                            const link = this._instaService.createInstance(link_1.Link, em, { href: (0, inlayHints_1.asCommandLink)(part.command), label: part.label, title: part.command.title }, undefined);
                            this._sessionDispoosables.add(link);
                        }
                        else {
                            em.innerText += part.label;
                        }
                    }
                }
                newChildren.push(em);
            }
            // trailing text
            if (!tooLongToRead) {
                newChildren.push(model.getValueInRange({ startLineNumber: line, startColumn: start + 1, endLineNumber: line, endColumn: Number.MAX_SAFE_INTEGER }));
            }
            dom.reset(this._ariaElement, ...newChildren);
            this._ariaElement.focus();
            this._ctxIsReading.set(true);
            // reset on blur
            this._sessionDispoosables.add(dom.addDisposableListener(this._ariaElement, 'focusout', () => {
                this._reset();
            }));
        }
        startInlayHintsReading() {
            if (!this._editor.hasModel()) {
                return;
            }
            const line = this._editor.getPosition().lineNumber;
            const hints = inlayHintsController_1.InlayHintsController.get(this._editor)?.getInlayHintsForLine(line);
            if (!hints || hints.length === 0) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.noInlayHints);
            }
            else {
                this._read(line, hints);
            }
        }
        stopInlayHintsReading() {
            this._reset();
            this._editor.focus();
        }
    };
    exports.InlayHintsAccessibility = InlayHintsAccessibility;
    exports.InlayHintsAccessibility = InlayHintsAccessibility = InlayHintsAccessibility_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(3, instantiation_1.IInstantiationService)
    ], InlayHintsAccessibility);
    (0, actions_1.registerAction2)(class StartReadHints extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlayHints.startReadingLineWithHint',
                title: (0, nls_1.localize2)('read.title', "Read Line With Inline Hints"),
                precondition: editorContextKeys_1.EditorContextKeys.hasInlayHintsProvider,
                f1: true
            });
        }
        runEditorCommand(_accessor, editor) {
            const ctrl = InlayHintsAccessibility.get(editor);
            ctrl?.startInlayHintsReading();
        }
    });
    (0, actions_1.registerAction2)(class StopReadHints extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlayHints.stopReadingLineWithHint',
                title: (0, nls_1.localize2)('stop.title', "Stop Inlay Hints Reading"),
                precondition: InlayHintsAccessibility.IsReading,
                f1: true,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            const ctrl = InlayHintsAccessibility.get(editor);
            ctrl?.stopInlayHintsReading();
        }
    });
    (0, editorExtensions_1.registerEditorContribution)(InlayHintsAccessibility.ID, InlayHintsAccessibility, 4 /* EditorContributionInstantiation.Lazy */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50c0FjY2Vzc2liaWx0eS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGF5SGludHMvYnJvd3Nlci9pbmxheUhpbnRzQWNjZXNzaWJpbHR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQnpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCOztpQkFFbkIsY0FBUyxHQUFHLElBQUksMEJBQWEsQ0FBVSw2QkFBNkIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSxvRUFBb0UsQ0FBQyxFQUFFLENBQUMsQUFBcE4sQ0FBcU47aUJBRTlOLE9BQUUsR0FBVyx3Q0FBd0MsQUFBbkQsQ0FBb0Q7UUFFdEUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUM3QixPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTBCLHlCQUF1QixDQUFDLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQztRQUNqRyxDQUFDO1FBT0QsWUFDa0IsT0FBb0IsRUFDakIsaUJBQXFDLEVBQzVCLDJCQUF5RSxFQUMvRSxhQUFxRDtZQUgzRCxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBRVMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE2QjtZQUM5RCxrQkFBYSxHQUFiLGFBQWEsQ0FBdUI7WUFONUQseUJBQW9CLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFRN0QsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDM0MsSUFBSSxD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