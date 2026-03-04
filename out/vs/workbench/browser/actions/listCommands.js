/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/browser/ui/list/listWidget", "vs/platform/list/browser/listService", "vs/base/browser/ui/list/listPaging", "vs/base/common/arrays", "vs/platform/contextkey/common/contextkey", "vs/base/browser/ui/tree/objectTree", "vs/base/browser/ui/tree/asyncDataTree", "vs/base/browser/ui/tree/dataTree", "vs/platform/commands/common/commands", "vs/base/browser/ui/table/tableWidget", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/dom", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/nls"], function (require, exports, keybindingsRegistry_1, listWidget_1, listService_1, listPaging_1, arrays_1, contextkey_1, objectTree_1, asyncDataTree_1, dataTree_1, commands_1, tableWidget_1, abstractTree_1, dom_1, actions_1, configuration_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ensureDOMFocus(widget) {
        // it can happen that one of the commands is executed while
        // DOM focus is within another focusable control within the
        // list/tree item. therefor we should ensure that the
        // list/tree has DOM focus again after the command ran.
        const element = widget?.getHTMLElement();
        if (element && !(0, dom_1.isActiveElement)(element)) {
            widget?.domFocus();
        }
    }
    async function updateFocus(widget, updateFocusFn) {
        if (!listService_1.WorkbenchListSelectionNavigation.getValue(widget.contextKeyService)) {
            return updateFocusFn(widget);
        }
        const focus = widget.getFocus();
        const selection = widget.getSelection();
        await updateFocusFn(widget);
        const newFocus = widget.getFocus();
        if (selection.length > 1 || !(0, arrays_1.equals)(focus, selection) || (0, arrays_1.equals)(focus, newFocus)) {
            return;
        }
        const fakeKeyboardEvent = new KeyboardEvent('keydown');
        widget.setSelection(newFocus, fakeKeyboardEvent);
    }
    async function navigate(widget, updateFocusFn) {
        if (!widget) {
            return;
        }
        await updateFocus(widget, updateFocusFn);
        const listFocus = widget.getFocus();
        if (listFocus.length) {
            widget.reveal(listFocus[0]);
        }
        widget.setAnchor(listFocus[0]);
        ensureDOMFocus(widget);
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 18 /* KeyCode.DownArrow */,
        mac: {
            primary: 18 /* KeyCode.DownArrow */,
            secondary: [256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */]
        },
        handler: (accessor, arg2) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusNext(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 16 /* KeyCode.UpArrow */,
        mac: {
            primary: 16 /* KeyCode.UpArrow */,
            secondary: [256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */]
        },
        handler: (accessor, arg2) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusPrevious(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusAnyDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
        mac: {
            primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
            secondary: [256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 44 /* KeyCode.KeyN */]
        },
        handler: (accessor, arg2) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown', { altKey: true });
                await widget.focusNext(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusAnyUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
        mac: {
            primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
            secondary: [256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 46 /* KeyCode.KeyP */]
        },
        handler: (accessor, arg2) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown', { altKey: true });
                await widget.focusPrevious(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusPageDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 12 /* KeyCode.PageDown */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusNextPage(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusPageUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 11 /* KeyCode.PageUp */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusPreviousPage(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusFirst',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 14 /* KeyCode.Home */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusFirst(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusLast',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 13 /* KeyCode.End */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                await widget.focusLast(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusAnyFirst',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 512 /* KeyMod.Alt */ | 14 /* KeyCode.Home */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown', { altKey: true });
                await widget.focusFirst(fakeKeyboardEvent);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusAnyLast',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 512 /* KeyMod.Alt */ | 13 /* KeyCode.End */,
        handler: (accessor) => {
            navigate(accessor.get(listService_1.IListService).lastFocusedList, async (widget) => {
                const fakeKeyboardEvent = new KeyboardEvent('keydown', { altKey: true });
                await widget.focusLast(fakeKeyboardEvent);
            });
        }
    });
    function expandMultiSelection(focused, previousFocus) {
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof tableWidget_1.Table) {
            const list = focused;
            const focus = list.getFocus() ? list.getFocus()[0] : undefined;
            const selection = list.getSelection();
            if (selection && typeof focus === 'number' && selection.indexOf(focus) >= 0) {
                list.setSelection(selection.filter(s => s !== previousFocus));
            }
            else {
                if (typeof focus === 'number') {
                    list.setSelection(selection.concat(focus));
                }
            }
        }
        // Tree
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const list = focused;
            const focus = list.getFocus() ? list.getFocus()[0] : undefined;
            if (previousFocus === focus) {
                return;
            }
            const selection = list.getSelection();
            const fakeKeyboardEvent = new KeyboardEvent('keydown', { shiftKey: true });
            if (selection && selection.indexOf(focus) >= 0) {
                list.setSelection(selection.filter(s => s !== previousFocus), fakeKeyboardEvent);
            }
            else {
                list.setSelection(selection.concat(focus), fakeKeyboardEvent);
            }
        }
    }
    function revealFocusedStickyScroll(tree, postRevealAction) {
        const focus = tree.getStickyScrollFocus();
        if (focus.length === 0) {
            throw new Error(`StickyScroll has no focus`);
        }
        if (focus.length > 1) {
            throw new Error(`StickyScroll can only have a single focused item`);
        }
        tree.reveal(focus[0]);
        tree.getHTMLElement().focus(); // domfocus() would focus stiky scroll dom and not the tree todo@benibenj
        tree.setFocus(focus);
        postRevealAction?.(focus[0]);
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expandSelectionDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
        handler: (accessor, arg2) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            // Focus down first
            const previousFocus = widget.getFocus() ? widget.getFocus()[0] : undefined;
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            widget.focusNext(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            // Then adjust selection
            expandMultiSelection(widget, previousFocus);
            const focus = widget.getFocus();
            if (focus.length) {
                widget.reveal(focus[0]);
            }
            ensureDOMFocus(widget);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expandSelectionUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
        handler: (accessor, arg2) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            // Focus up first
            const previousFocus = widget.getFocus() ? widget.getFocus()[0] : undefined;
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            widget.focusPrevious(typeof arg2 === 'number' ? arg2 : 1, false, fakeKeyboardEvent);
            // Then adjust selection
            expandMultiSelection(widget, previousFocus);
            const focus = widget.getFocus();
            if (focus.length) {
                widget.reveal(focus[0]);
            }
            ensureDOMFocus(widget);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.collapse',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, contextkey_1.ContextKeyExpr.or(listService_1.WorkbenchTreeElementCanCollapse, listService_1.WorkbenchTreeElementHasParent)),
        primary: 15 /* KeyCode.LeftArrow */,
        mac: {
            primary: 15 /* KeyCode.LeftArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
        },
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            const tree = widget;
            const focusedElements = tree.getFocus();
            if (focusedElements.length === 0) {
                return;
            }
            const focus = focusedElements[0];
            if (!tree.collapse(focus)) {
                const parent = tree.getParentElement(focus);
                if (parent) {
                    navigate(widget, widget => {
                        const fakeKeyboardEvent = new KeyboardEvent('keydown');
                        widget.setFocus([parent], fakeKeyboardEvent);
                    });
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.stickyScroll.collapse',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        when: listService_1.WorkbenchTreeStickyScrollFocused,
        primary: 15 /* KeyCode.LeftArrow */,
        mac: {
            primary: 15 /* KeyCode.LeftArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
        },
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            revealFocusedStickyScroll(widget, focus => widget.collapse(focus));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.collapseAll',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */]
        },
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (focused && !(focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof tableWidget_1.Table)) {
                focused.collapseAll();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.collapseAllToFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            const fakeKeyboardEvent = (0, listService_1.getSelectionKeyboardEvent)('keydown', true);
            // Trees
            if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                const focus = tree.getFocus();
                if (focus.length > 0) {
                    tree.collapse(focus[0], true);
                }
                tree.setSelection(focus, fakeKeyboardEvent);
                tree.setAnchor(focus[0]);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.focusParent',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            const tree = widget;
            const focusedElements = tree.getFocus();
            if (focusedElements.length === 0) {
                return;
            }
            const focus = focusedElements[0];
            const parent = tree.getParentElement(focus);
            if (parent) {
                navigate(widget, widget => {
                    const fakeKeyboardEvent = new KeyboardEvent('keydown');
                    widget.setFocus([parent], fakeKeyboardEvent);
                });
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.expand',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, contextkey_1.ContextKeyExpr.or(listService_1.WorkbenchTreeElementCanExpand, listService_1.WorkbenchTreeElementHasChild)),
        primary: 17 /* KeyCode.RightArrow */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            if (widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree) {
                // TODO@Joao: instead of doing this here, just delegate to a tree method
                const focusedElements = widget.getFocus();
                if (focusedElements.length === 0) {
                    return;
                }
                const focus = focusedElements[0];
                if (!widget.expand(focus)) {
                    const child = widget.getFirstElementChild(focus);
                    if (child) {
                        const node = widget.getNode(child);
                        if (node.visible) {
                            navigate(widget, widget => {
                                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                                widget.setFocus([child], fakeKeyboardEvent);
                            });
                        }
                    }
                }
            }
            else if (widget instanceof asyncDataTree_1.AsyncDataTree) {
                // TODO@Joao: instead of doing this here, just delegate to a tree method
                const focusedElements = widget.getFocus();
                if (focusedElements.length === 0) {
                    return;
                }
                const focus = focusedElements[0];
                widget.expand(focus).then(didExpand => {
                    if (focus && !didExpand) {
                        const child = widget.getFirstElementChild(focus);
                        if (child) {
                            const node = widget.getNode(child);
                            if (node.visible) {
                                navigate(widget, widget => {
                                    const fakeKeyboardEvent = new KeyboardEvent('keydown');
                                    widget.setFocus([child], fakeKeyboardEvent);
                                });
                            }
                        }
                    }
                });
            }
        }
    });
    function selectElement(accessor, retainCurrentFocus) {
        const focused = accessor.get(listService_1.IListService).lastFocusedList;
        const fakeKeyboardEvent = (0, listService_1.getSelectionKeyboardEvent)('keydown', retainCurrentFocus);
        // List
        if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof tableWidget_1.Table) {
            const list = focused;
            list.setAnchor(list.getFocus()[0]);
            list.setSelection(list.getFocus(), fakeKeyboardEvent);
        }
        // Trees
        else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
            const tree = focused;
            const focus = tree.getFocus();
            if (focus.length > 0) {
                let toggleCollapsed = true;
                if (tree.expandOnlyOnTwistieClick === true) {
                    toggleCollapsed = false;
                }
                else if (typeof tree.expandOnlyOnTwistieClick !== 'boolean' && tree.expandOnlyOnTwistieClick(focus[0])) {
                    toggleCollapsed = false;
                }
                if (toggleCollapsed) {
                    tree.toggleCollapsed(focus[0]);
                }
            }
            tree.setAnchor(focus[0]);
            tree.setSelection(focus, fakeKeyboardEvent);
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.select',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
        },
        handler: (accessor) => {
            selectElement(accessor, false);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.stickyScrollselect',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50, // priorities over file explorer
        when: listService_1.WorkbenchTreeStickyScrollFocused,
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
        },
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            revealFocusedStickyScroll(widget, focus => widget.setSelection([focus]));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.selectAndPreserveFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: accessor => {
            selectElement(accessor, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.selectAll',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsMultiSelectContextKey),
        primary: 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (focused instanceof listWidget_1.List || focused instanceof listPaging_1.PagedList || focused instanceof tableWidget_1.Table) {
                const list = focused;
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                list.setSelection((0, arrays_1.range)(list.length), fakeKeyboardEvent);
            }
            // Trees
            else if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                const focus = tree.getFocus();
                const selection = tree.getSelection();
                // Which element should be considered to start selecting all?
                let start = undefined;
                if (focus.length > 0 && (selection.length === 0 || !selection.includes(focus[0]))) {
                    start = focus[0];
                }
                if (!start && selection.length > 0) {
                    start = selection[0];
                }
                // What is the scope of select all?
                let scope = undefined;
                if (!start) {
                    scope = undefined;
                }
                else {
                    scope = tree.getParentElement(start);
                }
                const newSelection = [];
                const visit = (node) => {
                    for (const child of node.children) {
                        if (child.visible) {
                            newSelection.push(child.element);
                            if (!child.collapsed) {
                                visit(child);
                            }
                        }
                    }
                };
                // Add the whole scope subtree to the new selection
                visit(tree.getNode(scope));
                // If the scope isn't the tree root, it should be part of the new selection
                if (scope && selection.length === newSelection.length) {
                    newSelection.unshift(scope);
                }
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                tree.setSelection(newSelection, fakeKeyboardEvent);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.toggleSelection',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            const focus = widget.getFocus();
            if (focus.length === 0) {
                return;
            }
            const selection = widget.getSelection();
            const index = selection.indexOf(focus[0]);
            if (index > -1) {
                widget.setSelection([...selection.slice(0, index), ...selection.slice(index + 1)]);
            }
            else {
                widget.setSelection([...selection, focus[0]]);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.toggleExpand',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        primary: 10 /* KeyCode.Space */,
        handler: (accessor) => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            // Tree only
            if (focused instanceof objectTree_1.ObjectTree || focused instanceof dataTree_1.DataTree || focused instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = focused;
                const focus = tree.getFocus();
                if (focus.length > 0 && tree.isCollapsible(focus[0])) {
                    tree.toggleCollapsed(focus[0]);
                    return;
                }
            }
            selectElement(accessor, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.stickyScrolltoggleExpand',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50, // priorities over file explorer
        when: listService_1.WorkbenchTreeStickyScrollFocused,
        primary: 10 /* KeyCode.Space */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget || !(widget instanceof objectTree_1.ObjectTree || widget instanceof dataTree_1.DataTree || widget instanceof asyncDataTree_1.AsyncDataTree)) {
                return;
            }
            revealFocusedStickyScroll(widget);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.clear',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListHasSelectionOrFocus),
        primary: 9 /* KeyCode.Escape */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (!widget) {
                return;
            }
            const selection = widget.getSelection();
            const fakeKeyboardEvent = new KeyboardEvent('keydown');
            if (selection.length > 1) {
                const useSelectionNavigation = listService_1.WorkbenchListSelectionNavigation.getValue(widget.contextKeyService);
                if (useSelectionNavigation) {
                    const focus = widget.getFocus();
                    widget.setSelection([focus[0]], fakeKeyboardEvent);
                }
                else {
                    widget.setSelection([], fakeKeyboardEvent);
                }
            }
            else {
                widget.setSelection([], fakeKeyboardEvent);
                widget.setFocus([], fakeKeyboardEvent);
            }
            widget.setAnchor(undefined);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'list.triggerTypeNavigation',
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            widget?.triggerTypeNavigation();
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'list.toggleFindMode',
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (widget instanceof abstractTree_1.AbstractTree || widget instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = widget;
                tree.findMode = tree.findMode === abstractTree_1.TreeFindMode.Filter ? abstractTree_1.TreeFindMode.Highlight : abstractTree_1.TreeFindMode.Filter;
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'list.toggleFindMatchType',
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (widget instanceof abstractTree_1.AbstractTree || widget instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = widget;
                tree.findMatchType = tree.findMatchType === abstractTree_1.TreeFindMatchType.Contiguous ? abstractTree_1.TreeFindMatchType.Fuzzy : abstractTree_1.TreeFindMatchType.Contiguous;
            }
        }
    });
    // Deprecated commands
    commands_1.CommandsRegistry.registerCommandAlias('list.toggleKeyboardNavigation', 'list.triggerTypeNavigation');
    commands_1.CommandsRegistry.registerCommandAlias('list.toggleFilterOnType', 'list.toggleFindMode');
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.find',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.RawWorkbenchListFocusContextKey, listService_1.WorkbenchListSupportsFind),
        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
        secondary: [61 /* KeyCode.F3 */],
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            // List
            if (widget instanceof listWidget_1.List || widget instanceof listPaging_1.PagedList || widget instanceof tableWidget_1.Table) {
                // TODO@joao
            }
            // Tree
            else if (widget instanceof abstractTree_1.AbstractTree || widget instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = widget;
                tree.openFind();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.closeFind',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(listService_1.RawWorkbenchListFocusContextKey, listService_1.WorkbenchTreeFindOpen),
        primary: 9 /* KeyCode.Escape */,
        handler: (accessor) => {
            const widget = accessor.get(listService_1.IListService).lastFocusedList;
            if (widget instanceof abstractTree_1.AbstractTree || widget instanceof asyncDataTree_1.AsyncDataTree) {
                const tree = widget;
                tree.closeFind();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.scrollUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        // Since the default keybindings for list.scrollUp and widgetNavigation.focusPrevious
        // are both Ctrl+UpArrow, we disable this command when the scrollbar is at
        // top-most position. This will give chance for widgetNavigation.focusPrevious to execute
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListScrollAtTopContextKey?.negate()),
        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused) {
                return;
            }
            focused.scrollTop -= 10;
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.scrollDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        // same as above
        when: contextkey_1.ContextKeyExpr.and(listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchListScrollAtBottomContextKey?.negate()),
        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused) {
                return;
            }
            focused.scrollTop += 10;
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.scrollLeft',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused) {
                return;
            }
            focused.scrollLeft -= 10;
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'list.scrollRight',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: listService_1.WorkbenchListFocusContextKey,
        handler: accessor => {
            const focused = accessor.get(listService_1.IListService).lastFocusedList;
            if (!focused) {
                return;
            }
            focused.scrollLeft += 10;
        }
    });
    (0, actions_1.registerAction2)(class ToggleStickyScroll extends actions_1.Action2 {
        constructor() {
            super({
                id: 'tree.toggleStickyScroll',
                title: {
                    ...(0, nls_1.localize2)('toggleTreeStickyScroll', "Toggle Tree Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mitoggleTreeStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Toggle Tree Sticky Scroll"),
                },
                category: 'View',
                metadata: { description: (0, nls_1.localize)('toggleTreeStickyScrollDescription', "Toggles Sticky Scroll widget at the top of tree structures such as the File Explorer and Debug variables View.") },
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('workbench.tree.enableStickyScroll');
            configurationService.updateValue('workbench.tree.enableStickyScroll', newValue);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdENvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvYWN0aW9ucy9saXN0Q29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLFNBQVMsY0FBYyxDQUFDLE1BQThCO1FBQ3JELDJEQUEyRDtRQUMzRCwyREFBMkQ7UUFDM0QscURBQXFEO1FBQ3JELHVEQUF1RDtRQUN2RCxNQUFNLE9BQU8sR0FBRyxNQUFNLEVBQUUsY0FBYyxFQUFFLENBQUM7UUFDekMsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFBLHFCQUFlLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMxQyxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDcEIsQ0FBQztJQUNGLENBQUM7SUFFRCxLQUFLLFVBQVUsV0FBVyxDQUFDLE1BQTJCLEVBQUUsYUFBb0U7UUFDM0gsSUFBSSxDQUFDLDhDQUFnQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO1lBQzFFLE9BQU8sYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRXhDLE1BQU0sYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTVCLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVuQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBQSxlQUFNLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxJQUFJLElBQUEsZUFBTSxFQUFDLEtBQUssRUFBRSxRQUFR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