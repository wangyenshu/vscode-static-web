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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/workbench/services/layout/browser/layoutService", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/common/contributions", "vs/base/common/platform", "vs/platform/clipboard/common/clipboardService", "vs/base/browser/mouseEvent", "vs/base/common/event", "vs/base/common/lazy"], function (require, exports, actions_1, nls_1, layoutService_1, contextView_1, lifecycle_1, dom_1, contributions_1, platform_1, clipboardService_1, mouseEvent_1, event_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextInputActionsProvider = void 0;
    let TextInputActionsProvider = class TextInputActionsProvider extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.textInputActionsProvider'; }
        constructor(layoutService, contextMenuService, clipboardService) {
            super();
            this.layoutService = layoutService;
            this.contextMenuService = contextMenuService;
            this.clipboardService = clipboardService;
            this.textInputActions = new lazy_1.Lazy(() => this.createActions());
            this.registerListeners();
        }
        createActions() {
            return [
                // Undo/Redo
                new actions_1.Action('undo', (0, nls_1.localize)('undo', "Undo"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('undo')),
                new actions_1.Action('redo', (0, nls_1.localize)('redo', "Redo"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('redo')),
                new actions_1.Separator(),
                // Cut / Copy / Paste
                new actions_1.Action('editor.action.clipboardCutAction', (0, nls_1.localize)('cut', "Cut"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('cut')),
                new actions_1.Action('editor.action.clipboardCopyAction', (0, nls_1.localize)('copy', "Copy"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('copy')),
                new actions_1.Action('editor.action.clipboardPasteAction', (0, nls_1.localize)('paste', "Paste"), undefined, true, async (element) => {
                    // Native: paste is supported
                    if (platform_1.isNative) {
                        (0, dom_1.getActiveDocument)().execCommand('paste');
                    }
                    // Web: paste is not supported due to security reasons
                    else {
                        const clipboardText = await this.clipboardService.readText();
                        if (element instanceof HTMLTextAreaElement ||
                            element instanceof HTMLInputElement) {
                            const selectionStart = element.selectionStart || 0;
                            const selectionEnd = element.selectionEnd || 0;
                            element.value = `${element.value.substring(0, selectionStart)}${clipboardText}${element.value.substring(selectionEnd, element.value.length)}`;
                            element.selectionStart = selectionStart + clipboardText.length;
                            element.selectionEnd = element.selectionStart;
                            element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        }
                    }
                }),
                new actions_1.Separator(),
                // Select All
                new actions_1.Action('editor.action.selectAll', (0, nls_1.localize)('selectAll', "Select All"), undefined, true, async () => (0, dom_1.getActiveDocument)().execCommand('selectAll'))
            ];
        }
        registerListeners() {
            // Context menu support in input/textarea
            this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidAddContainer, ({ container, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(container, 'contextmenu', e => this.onContextMenu((0, dom_1.getWindow)(container), e)));
            }, { container: this.layoutService.mainContainer, disposables: this._store }));
        }
        onContextMenu(targetWindow, e) {
            if (e.defaultPrevented) {
                return; // make sure to not show these actions by accident if component indicated to prevent
            }
            const target = e.target;
            if (!(target instanceof HTMLElement) || (target.nodeName.toLowerCase() !== 'input' && target.nodeName.toLowerCase() !== 'textarea')) {
                return; // only for inputs or textareas
            }
            dom_1.EventHelper.stop(e, true);
            const event = new mouseEvent_1.StandardMouseEvent(targetWindow, e);
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                getActions: () => this.textInputActions.value,
                getActionsContext: () => target,
            });
        }
    };
    exports.TextInputActionsProvider = TextInputActionsProvider;
    exports.TextInputActionsProvider = TextInputActionsProvider = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, clipboardService_1.IClipboardService)
    ], TextInputActionsProvider);
    (0, contributions_1.registerWorkbenchContribution2)(TextInputActionsProvider.ID, TextInputActionsProvider, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dElucHV0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2FjdGlvbnMvdGV4dElucHV0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtpQkFFdkMsT0FBRSxHQUFHLDRDQUE0QyxBQUEvQyxDQUFnRDtRQUlsRSxZQUMwQixhQUF1RCxFQUMzRCxrQkFBd0QsRUFDMUQsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBSmtDLGtCQUFhLEdBQWIsYUFBYSxDQUF5QjtZQUMxQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3pDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFMdkQscUJBQWdCLEdBQUcsSUFBSSxXQUFJLENBQVksR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFTbkYsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGFBQWE7WUFDcEIsT0FBTztnQkFFTixZQUFZO2dCQUNaLElBQUksZ0JBQU0sQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxJQUFBLHVCQUFpQixHQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNsSCxJQUFJLGdCQUFNLENBQUMsTUFBTSxFQUFFLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsSUFB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