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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/lifecycle", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/base/common/async", "vs/workbench/browser/quickaccess", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing", "vs/platform/label/common/label", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation"], function (require, exports, dom_1, event_1, nls_1, quickInput_1, terminal_1, lifecycle_1, accessibleView_1, async_1, quickaccess_1, terminalLinkParsing_1, label_1, resources_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkQuickpick = void 0;
    let TerminalLinkQuickpick = class TerminalLinkQuickpick extends lifecycle_1.DisposableStore {
        constructor(_labelService, _quickInputService, _accessibleViewService, instantiationService) {
            super();
            this._labelService = _labelService;
            this._quickInputService = _quickInputService;
            this._accessibleViewService = _accessibleViewService;
            this._editorSequencer = new async_1.Sequencer();
            this._onDidRequestMoreLinks = this.add(new event_1.Emitter());
            this.onDidRequestMoreLinks = this._onDidRequestMoreLinks.event;
            this._terminalScrollStateSaved = false;
            this._editorViewState = this.add(instantiationService.createInstance(quickaccess_1.PickerEditorState));
        }
        async show(instance, links) {
            this._instance = instance;
            // Allow all links a small amount of time to elapse to finish, if this is not done in this
            // time they will be loaded upon the first filter.
            const result = await Promise.race([links.all, (0, async_1.timeout)(500)]);
            const usingAllLinks = typeof result === 'object';
            const resolvedLinks = usingAllLinks ? result : links.viewport;
            // Get raw link picks
            const wordPicks = resolvedLinks.wordLinks ? await this._generatePicks(resolvedLinks.wordLinks) : undefined;
            const filePicks = resolvedLinks.fileLinks ? await this._generatePicks(resolvedLinks.fileLinks) : undefined;
            const folderPicks = resolvedLinks.folderLinks ? await this._generatePicks(resolvedLinks.folderLinks) : undefined;
            const webPicks = resolvedLinks.webLinks ? await this._generatePicks(resolvedLinks.webLinks) : undefined;
            const picks = [];
            if (webPicks) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.urlLinks', "Url") });
                picks.push(...webPicks);
            }
            if (filePicks) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.localFileLinks', "File") });
                picks.push(...filePicks);
            }
            if (folderPicks) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.localFolderLinks', "Folder") });
                picks.push(...folderPicks);
            }
            if (wordPicks) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.searchLinks', "Workspace Search") });
                picks.push(...wordPicks);
            }
            // Create and show quick pick
            const pick = this._quickInputService.createQuickPick();
            pick.items = picks;
            pick.placeholder = (0, nls_1.localize)('terminal.integrated.openDetectedLink', "Select the link to open, type to filter all links");
            pick.sortByLabel = false;
            pick.show();
            if (pick.activeItems.length > 0) {
                this._previewItem(pick.activeItems[0]);
            }
            // Show all results only when filtering begins, this is done so the quick pick will show up
            // ASAP with only the viewport entries.
            let accepted = false;
            const disposables = new lifecycle_1.DisposableStore();
            if (!usingAllLinks) {
                disposables.add(event_1.Event.once(pick.onDidChangeValue)(async () => {
                    const allLinks = await links.all;
                    if (accepted) {
                        return;
                    }
                    const wordIgnoreLinks = [...(allLinks.fileLinks ?? []), ...(allLinks.folderLinks ?? []), ...(allLinks.webLinks ?? [])];
                    const wordPicks = allLinks.wordLinks ? await this._generatePicks(allLinks.wordLinks, wordIgnoreLinks) : undefined;
                    const filePicks = allLinks.fileLinks ? await this._generatePicks(allLinks.fileLinks) : undefined;
                    const folderPicks = allLinks.folderLinks ? await this._generatePicks(allLinks.folderLinks) : undefined;
                    const webPicks = allLinks.webLinks ? await this._generatePicks(allLinks.webLinks) : undefined;
                    const picks = [];
                    if (webPicks) {
                        picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.urlLinks', "Url") });
                        picks.push(...webPicks);
                    }
                    if (filePicks) {
                        picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.localFileLinks', "File") });
                        picks.push(...filePicks);
                    }
                    if (folderPicks) {
                        picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.localFolderLinks', "Folder") });
                        picks.push(...folderPicks);
                    }
                    if (wordPicks) {
                        picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.searchLinks', "Workspace Search") });
                        picks.push(...wordPicks);
                    }
                    pick.items = picks;
                }));
            }
            disposables.add(pick.onDidChangeActive(async () => {
                const [item] = pick.activeItems;
                this._previewItem(item);
            }));
            return new Promise(r => {
                disposables.add(pick.onDidHide(({ reason }) => {
                    // Restore terminal scroll state
                    if (this._terminalScrollStateSaved) {
                        const markTracker = this._instance?.xterm?.markTracker;
                        if (markTracker) {
                            markTracker.restoreScrollState();
                            markTracker.clear();
                            this._terminalScrollStateSaved = false;
                        }
                    }
                    // Restore view state upon cancellation if we changed it
                    // but only when the picker was closed via explicit user
                    // gesture and not e.g. when focus was lost because that
                    // could mean the user clicked into the editor directly.
                    if (reason === quickInput_1.QuickInputHideReason.Gesture) {
                        this._editorViewState.restore();
                    }
                    disposables.dispose();
                    if (pick.selectedItems.length === 0) {
                        this._accessibleViewService.showLastProvider("terminal" /* AccessibleViewProviderId.Terminal */);
                    }
                    r();
                }));
                disposables.add(event_1.Event.once(pick.onDidAccept)(() => {
                    // Restore terminal scroll state
                    if (this._terminalScrollStateSaved) {
                        const markTracker = this._instance?.xterm?.markTracker;
                        if (markTracker) {
                            markTracker.restoreScrollState();
                            markTracker.clear();
                            this._terminalScrollStateSaved = false;
                        }
                    }
                    accepted = true;
                    const event = new terminal_1.TerminalLinkQuickPickEvent(dom_1.EventType.CLICK);
                    const activeItem = pick.activeItems?.[0];
                    if (activeItem && 'link' in activeItem) {
                        activeItem.link.activate(event, activeItem.label);
                    }
                    disposables.dispose();
                    r();
                }));
            });
        }
        /**
         * @param ignoreLinks Links with labels to not include in the picks.
         */
        async _generatePicks(links, ignoreLinks) {
            if (!links) {
                return;
            }
            const linkTextKeys = new Set();
            const linkUriKeys = new Set();
            const picks = [];
            for (const link of links) {
                let label = link.text;
                if (!linkTextKeys.has(label) && (!ignoreLinks || !ignoreLinks.some(e => e.text === label))) {
                    linkTextKeys.add(label);
                    // Add a consistently formatted resolved URI label to the description if applicable
                    let description;
                    if ('uri' in link && link.uri) {
                        // For local files and folders, mimic the presentation of go to file
                        if (link.type === "LocalFile" /* TerminalBuiltinLinkType.LocalFile */ ||
                            link.type === "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */ ||
                            link.type === "LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */) {
                            label = (0, resources_1.basenameOrAuthority)(link.uri);
                            description = this._labelService.getUriLabel((0, resources_1.dirname)(link.uri), { relative: true });
                        }
                        // Add line and column numbers to the label if applicable
                        if (link.type === "LocalFile" /* TerminalBuiltinLinkType.LocalFile */) {
                            if (link.parsedLink?.suffix?.row !== undefined) {
                                label += `:${link.parsedLink.suffix.row}`;
                                if (link.parsedLink?.suffix?.rowEnd !== undefined) {
                                    label += `-${link.parsedLink.suffix.rowEnd}`;
                                }
                                if (link.parsedLink?.suffix?.col !== undefined) {
                                    label += `:${link.parsedLink.suffix.col}`;
                                    if (link.parsedLink?.suffix?.colEnd !== undefined) {
                                        label += `-${link.parsedLink.suffix.colEnd}`;
                                    }
                                }
                            }
                        }
                        // Skip the link if it's a duplicate URI + line/col
                        if (linkUriKeys.has(label + '|' + (description ?? ''))) {
                            continue;
                        }
                        linkUriKeys.add(label + '|' + (description ?? ''));
                    }
                    picks.push({ label, link, description });
                }
            }
            return picks.length > 0 ? picks : undefined;
        }
        _previewItem(item) {
            if (!item || !('link' in item) || !item.link) {
                return;
            }
            // Any link can be previewed in the termninal
            const link = item.link;
            this._previewItemInTerminal(link);
            if (!('uri' in link) || !link.uri) {
                return;
            }
            if (link.type !== "LocalFile" /* TerminalBuiltinLinkType.LocalFile */) {
                return;
            }
            this._previewItemInEditor(link);
        }
        _previewItemInEditor(link) {
            const linkSuffix = link.parsedLink ? link.parsedLink.suffix : (0, terminalLinkParsing_1.getLinkSuffix)(link.text);
            const selection = linkSuffix?.row === undefined ? undefined : {
                startLineNumber: linkSuffix.row ?? 1,
                startColumn: linkSuffix.col ?? 1,
                endLineNumber: linkSuffix.rowEnd,
                endColumn: linkSuffix.colEnd
            };
            this._editorViewState.set();
            this._editorSequencer.queue(async () => {
                await this._editorViewState.openTransientEditor({
                    resource: link.uri,
                    options: { preserveFocus: true, revealIfOpened: true, ignoreError: true, selection, }
                });
            });
        }
        _previewItemInTerminal(link) {
            const xterm = this._instance?.xterm;
            if (!xterm) {
                return;
            }
            if (!this._terminalScrollStateSaved) {
                xterm.markTracker.saveScrollState();
                this._terminalScrollStateSaved = true;
            }
            xterm.markTracker.revealRange(link.range);
        }
    };
    exports.TerminalLinkQuickpick = TerminalLinkQuickpick;
    exports.TerminalLinkQuickpick = TerminalLinkQuickpick = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, quickInput_1.IQuickInputService),
        __param(2, accessibleView_1.IAccessibleViewService),
        __param(3, instantiation_1.IInstantiationService)
    ], TerminalLinkQuickpick);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rUXVpY2twaWNrLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWxMaW5rUXVpY2twaWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSwyQkFBZTtRQVV6RCxZQUNnQixhQUE2QyxFQUN4QyxrQkFBdUQsRUFDbkQsc0JBQStELEVBQ2hFLG9CQUEyQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUx3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUN2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ2xDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7WUFYdkUscUJBQWdCLEdBQUcsSUFBSSxpQkFBUyxFQUFFLENBQUM7WUFLbkMsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDL0QsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQWlQM0QsOEJBQXlCLEdBQVksS0FBSyxDQUFDO1lBeE9sRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsK0JBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQXVELEVBQUUsS0FBaUU7WUFDcEksSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFFMUIsMEZBQTBGO1lBQzFGLGtEQUFrRDtZQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8s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