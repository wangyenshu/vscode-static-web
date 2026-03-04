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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/common/contributions", "vs/platform/configuration/common/configuration", "vs/editor/common/editorContextKeys", "vs/base/browser/window", "vs/base/common/event", "vs/base/browser/dom"], function (require, exports, nls, async_1, lifecycle_1, platform, editorExtensions_1, range_1, clipboardService_1, selectionClipboard_1, contributions_1, configuration_1, editorContextKeys_1, window_1, event_1, dom_1) {
    "use strict";
    var SelectionClipboard_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionClipboard = void 0;
    let SelectionClipboard = class SelectionClipboard extends lifecycle_1.Disposable {
        static { SelectionClipboard_1 = this; }
        static { this.SELECTION_LENGTH_LIMIT = 65536; }
        constructor(editor, clipboardService) {
            super();
            if (platform.isLinux) {
                let isEnabled = editor.getOption(107 /* EditorOption.selectionClipboard */);
                this._register(editor.onDidChangeConfiguration((e) => {
                    if (e.hasChanged(107 /* EditorOption.selectionClipboard */)) {
                        isEnabled = editor.getOption(107 /* EditorOption.selectionClipboard */);
                    }
                }));
                const setSelectionToClipboard = this._register(new async_1.RunOnceScheduler(() => {
                    if (!editor.hasModel()) {
                        return;
                    }
                    const model = editor.getModel();
                    let selections = editor.getSelections();
                    selections = selections.slice(0);
                    selections.sort(range_1.Range.compareRangesUsingStarts);
                    let resultLength = 0;
                    for (const sel of selections) {
                        if (sel.isEmpty()) {
                            // Only write if all cursors have selection
                            return;
                        }
                        resultLength += model.getValueLengthInRange(sel);
                    }
                    if (resultLength > SelectionClipboard_1.SELECTION_LENGTH_LIMIT) {
                        // This is a large selection!
                        // => do not write it to the selection clipboard
                        return;
                    }
                    const result = [];
                    for (const sel of selections) {
                        result.push(model.getValueInRange(sel, 0 /* EndOfLinePreference.TextDefined */));
                    }
                    const textToCopy = result.join(model.getEOL());
                    clipboardService.writeText(textToCopy, 'selection');
                }, 100));
                this._register(editor.onDidChangeCursorSelection((e) => {
                    if (!isEnabled) {
                        return;
                    }
                    if (e.source === 'restoreState') {
                        // do not set selection to clipboard if this selection change
                        // was caused by restoring editors...
                        return;
                    }
                    setSelectionToClipboard.schedule();
                }));
            }
        }
        dispose() {
            super.dispose();
        }
    };
    exports.SelectionClipboard = SelectionClipboard;
    exports.SelectionClipboard = SelectionClipboard = SelectionClipboard_1 = __decorate([
        __param(1, clipboardService_1.IClipboardService)
    ], SelectionClipboard);
    let LinuxSelectionClipboardPastePreventer = class LinuxSelectionClipboardPastePreventer extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.linuxSelectionClipboardPastePreventer'; }
        constructor(configurationService) {
            super();
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(window.document, 'mouseup', e => {
                    if (e.button === 1) {
                        // middle button
                        const config = configurationService.getValue('editor');
                        if (!config.selectionClipboard) {
                            // selection clipboard is disabled
                            // try to stop the upcoming paste
                            e.preventDefault();
                        }
                    }
                }));
            }, { window: window_1.mainWindow, disposables: this._store }));
        }
    };
    LinuxSelectionClipboardPastePreventer = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], LinuxSelectionClipboardPastePreventer);
    class PasteSelectionClipboardAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.selectionClipboardPaste',
                label: nls.localize('actions.pasteSelectionClipboard', "Paste Selection Clipboard"),
                alias: 'Paste Selection Clipboard',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        async run(accessor, editor, args) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            // read selection clipboard
            const text = await clipboardService.readText('selection');
            editor.trigger('keyboard', "paste" /* Handler.Paste */, {
                text: text,
                pasteOnNewLine: false,
                multicursorText: null
            });
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(selectionClipboard_1.SelectionClipboardContributionID, SelectionClipboard, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to listen to selection change events
    if (platform.isLinux) {
        (0, contributions_1.registerWorkbenchContribution2)(LinuxSelectionClipboardPastePreventer.ID, LinuxSelectionClipboardPastePreventer, 2 /* WorkbenchPhase.BlockRestore */); // eager because it listens to mouse-up events globally
        (0, editorExtensions_1.registerEditorAction)(PasteSelectionClipboardAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uQ2xpcGJvYXJkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9lbGVjdHJvbi1zYW5kYm94L3NlbGVjdGlvbkNsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVOztpQkFDekIsMkJBQXNCLEdBQUcsS0FBSyxBQUFSLENBQVM7UUFFdkQsWUFBWSxNQUFtQixFQUFxQixnQkFBbUM7WUFDdEYsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsMkNBQWlDLENBQUM7Z0JBRWxFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBNEIsRUFBRSxFQUFFO29CQUMvRSxJQUFJLENBQUMsQ0FBQyxVQUFVLDJDQUFpQyxFQUFFLENBQUM7d0JBQ25ELFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUywyQ0FBaUMsQ0FBQztvQkFDL0QsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRTtvQkFDeEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO3dCQUN4QixPQUFPO29CQUNSLENBQUM7b0JBQ0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNoQyxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENB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