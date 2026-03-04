/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/contrib/mergeEditor/browser/view/mergeEditor", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "vs/workbench/services/editor/common/editorService"], function (require, exports, codicons_1, resources_1, uri_1, nls_1, actions_1, contextkey_1, dialogs_1, opener_1, storage_1, mergeEditorInput_1, mergeEditor_1, mergeEditor_2, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AcceptMerge = exports.ResetCloseWithConflictsChoice = exports.ResetToBaseAndAutoMergeCommand = exports.AcceptAllInput2 = exports.AcceptAllInput1 = exports.OpenBaseFile = exports.CompareInput2WithBaseCommand = exports.CompareInput1WithBaseCommand = exports.ToggleActiveConflictInput2 = exports.ToggleActiveConflictInput1 = exports.GoToPreviousUnhandledConflict = exports.GoToNextUnhandledConflict = exports.OpenResultResource = exports.ShowHideCenterBase = exports.ShowHideTopBase = exports.ShowHideBase = exports.ShowNonConflictingChanges = exports.SetColumnLayout = exports.SetMixedLayout = exports.OpenMergeEditor = void 0;
    class MergeEditorAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                const vm = activeEditorPane.viewModel.get();
                if (!vm) {
                    return;
                }
                this.runWithViewModel(vm, accessor);
            }
        }
    }
    class MergeEditorAction2 extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
        }
        run(accessor, ...args) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                const vm = activeEditorPane.viewModel.get();
                if (!vm) {
                    return;
                }
                return this.runWithMergeEditor({
                    viewModel: vm,
                    inputModel: activeEditorPane.inputModel.get(),
                    input: activeEditorPane.input,
                    editorIdentifier: {
                        editor: activeEditorPane.input,
                        groupId: activeEditorPane.group.id,
                    }
                }, accessor, ...args);
            }
        }
    }
    class OpenMergeEditor extends actions_1.Action2 {
        constructor() {
            super({
                id: '_open.mergeEditor',
                title: (0, nls_1.localize2)('title', 'Open Merge Editor'),
            });
        }
        run(accessor, ...args) {
            const validatedArgs = IRelaxedOpenArgs.validate(args[0]);
            const input = {
                base: { resource: validatedArgs.base },
                input1: { resource: validatedArgs.input1.uri, label: validatedArgs.input1.title, description: validatedArgs.input1.description, detail: validatedArgs.input1.detail },
                input2: { resource: validatedArgs.input2.uri, label: validatedArgs.input2.title, description: validatedArgs.input2.description, detail: validatedArgs.input2.detail },
                result: { resource: validatedArgs.output },
                options: { preserveFocus: true }
            };
            accessor.get(editorService_1.IEditorService).openEditor(input);
        }
    }
    exports.OpenMergeEditor = OpenMergeEditor;
    var IRelaxedOpenArgs;
    (function (IRelaxedOpenArgs) {
        function validate(obj) {
            if (!obj || typeof obj !== 'object') {
                throw new TypeError('invalid argument');
            }
            const o = obj;
            const base = toUri(o.base);
            const output = toUri(o.output);
            const input1 = toInputData(o.input1);
            const input2 = toInputData(o.input2);
            return { base, input1, input2, output };
        }
        IRelaxedOpenArgs.validate = validate;
        function toInputData(obj) {
            if (typeof obj === 'string') {
                return new mergeEditorInput_1.MergeEditorInputData(uri_1.URI.parse(obj, true), undefined, undefined, undefined);
            }
            if (!obj || typeof obj !== 'object') {
                throw new TypeError('invalid argument');
            }
            if (isUriComponents(obj)) {
                return new mergeEditorInput_1.MergeEditorInputData(uri_1.URI.revive(obj), undefined, undefined, undefined);
            }
            const o = obj;
            const title = o.title;
            const uri = toUri(o.uri);
            const detail = o.detail;
            const description = o.description;
            return new mergeEditorInput_1.MergeEditorInputData(uri, title, detail, description);
        }
        function toUri(obj) {
            if (typeof obj === 'string') {
                return uri_1.URI.parse(obj, true);
            }
            else if (obj && typeof obj === 'object') {
                return uri_1.URI.revive(obj);
            }
            throw new TypeError('invalid argument');
        }
        function isUriComponents(obj) {
            if (!obj || typeof obj !== 'object') {
                return false;
            }
            const o = obj;
            return typeof o.scheme === 'string'
                && typeof o.authority === 'string'
                && typeof o.path === 'string'
                && typeof o.query === 'string'
                && typeof o.fragment === 'string';
        }
    })(IRelaxedOpenArgs || (IRelaxedOpenArgs = {}));
    class SetMixedLayout extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.mixedLayout',
                title: (0, nls_1.localize2)('layout.mixed', "Mixed Layout"),
                toggled: mergeEditor_2.ctxMergeEditorLayout.isEqualTo('mixed'),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: '1_merge',
                        order: 9,
                    },
                ],
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.setLayoutKind('mixed');
            }
        }
    }
    exports.SetMixedLayout = SetMixedLayout;
    class SetColumnLayout extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.columnLayout',
                title: (0, nls_1.localize2)('layout.column', 'Column Layout'),
                toggled: mergeEditor_2.ctxMergeEditorLayout.isEqualTo('columns'),
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: '1_merge',
                        order: 10,
                    }],
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.setLayoutKind('columns');
            }
        }
    }
    exports.SetColumnLayout = SetColumnLayout;
    class ShowNonConflictingChanges extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.showNonConflictingChanges',
                title: (0, nls_1.localize2)('showNonConflictingChanges', "Show Non-Conflicting Changes"),
                toggled: mergeEditor_2.ctxMergeEditorShowNonConflictingChanges.isEqualTo(true),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: '3_merge',
                        order: 9,
                    },
                ],
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleShowNonConflictingChanges();
            }
        }
    }
    exports.ShowNonConflictingChanges = ShowNonConflictingChanges;
    class ShowHideBase extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.showBase',
                title: (0, nls_1.localize2)('layout.showBase', "Show Base"),
                toggled: mergeEditor_2.ctxMergeEditorShowBase.isEqualTo(true),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxIsMergeEditor, mergeEditor_2.ctxMergeEditorLayout.isEqualTo('columns')),
                        group: '2_merge',
                        order: 9,
                    },
                ]
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleBase();
            }
        }
    }
    exports.ShowHideBase = ShowHideBase;
    class ShowHideTopBase extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.showBaseTop',
                title: (0, nls_1.localize2)('layout.showBaseTop', "Show Base Top"),
                toggled: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxMergeEditorShowBase, mergeEditor_2.ctxMergeEditorShowBaseAtTop),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxIsMergeEditor, mergeEditor_2.ctxMergeEditorLayout.isEqualTo('mixed')),
                        group: '2_merge',
                        order: 10,
                    },
                ],
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleShowBaseTop();
            }
        }
    }
    exports.ShowHideTopBase = ShowHideTopBase;
    class ShowHideCenterBase extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.showBaseCenter',
                title: (0, nls_1.localize2)('layout.showBaseCenter', "Show Base Center"),
                toggled: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxMergeEditorShowBase, mergeEditor_2.ctxMergeEditorShowBaseAtTop.negate()),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxIsMergeEditor, mergeEditor_2.ctxMergeEditorLayout.isEqualTo('mixed')),
                        group: '2_merge',
                        order: 11,
                    },
                ],
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleShowBaseCenter();
            }
        }
    }
    exports.ShowHideCenterBase = ShowHideCenterBase;
    const mergeEditorCategory = (0, nls_1.localize2)('mergeEditor', "Merge Editor");
    class OpenResultResource extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.openResult',
                icon: codicons_1.Codicon.goToFile,
                title: (0, nls_1.localize2)('openfile', "Open File"),
                category: mergeEditorCategory,
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: 'navigation',
                        order: 1,
                    }],
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel, accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor({ resource: viewModel.model.resultTextModel.uri });
        }
    }
    exports.OpenResultResource = OpenResultResource;
    class GoToNextUnhandledConflict extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.goToNextUnhandledConflict',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.goToNextUnhandledConflict', "Go to Next Unhandled Conflict"),
                icon: codicons_1.Codicon.arrowDown,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: 'navigation',
                        order: 3
                    },
                ],
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.model.telemetry.reportNavigationToNextConflict();
            viewModel.goToNextModifiedBaseRange(r => !viewModel.model.isHandled(r).get());
        }
    }
    exports.GoToNextUnhandledConflict = GoToNextUnhandledConflict;
    class GoToPreviousUnhandledConflict extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.goToPreviousUnhandledConflict',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.goToPreviousUnhandledConflict', "Go to Previous Unhandled Conflict"),
                icon: codicons_1.Codicon.arrowUp,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: 'navigation',
                        order: 2
                    },
                ],
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.model.telemetry.reportNavigationToPreviousConflict();
            viewModel.goToPreviousModifiedBaseRange(r => !viewModel.model.isHandled(r).get());
        }
    }
    exports.GoToPreviousUnhandledConflict = GoToPreviousUnhandledConflict;
    class ToggleActiveConflictInput1 extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.toggleActiveConflictInput1',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.toggleCurrentConflictFromLeft', "Toggle Current Conflict from Left"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.toggleActiveConflict(1);
        }
    }
    exports.ToggleActiveConflictInput1 = ToggleActiveConflictInput1;
    class ToggleActiveConflictInput2 extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.toggleActiveConflictInput2',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.toggleCurrentConflictFromRight', "Toggle Current Conflict from Right"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.toggleActiveConflict(2);
        }
    }
    exports.ToggleActiveConflictInput2 = ToggleActiveConflictInput2;
    class CompareInput1WithBaseCommand extends MergeEditorAction {
        constructor() {
            super({
                id: 'mergeEditor.compareInput1WithBase',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.compareInput1WithBase', "Compare Input 1 With Base"),
                shortTitle: (0, nls_1.localize)('mergeEditor.compareWithBase', 'Compare With Base'),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInput1Toolbar, group: 'primary' },
                icon: codicons_1.Codicon.compareChanges,
            });
        }
        runWithViewModel(viewModel, accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            mergeEditorCompare(viewModel, editorService, 1);
        }
    }
    exports.CompareInput1WithBaseCommand = CompareInput1WithBaseCommand;
    class CompareInput2WithBaseCommand extends MergeEditorAction {
        constructor() {
            super({
                id: 'mergeEditor.compareInput2WithBase',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.compareInput2WithBase', "Compare Input 2 With Base"),
                shortTitle: (0, nls_1.localize)('mergeEditor.compareWithBase', 'Compare With Base'),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInput2Toolbar, group: 'primary' },
                icon: codicons_1.Codicon.compareChanges,
            });
        }
        runWithViewModel(viewModel, accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            mergeEditorCompare(viewModel, editorService, 2);
        }
    }
    exports.CompareInput2WithBaseCommand = CompareInput2WithBaseCommand;
    async function mergeEditorCompare(viewModel, editorService, inputNumber) {
        editorService.openEditor(editorService.activeEditor, { pinned: true });
        const model = viewModel.model;
        const base = model.base;
        const input = inputNumber === 1 ? viewModel.inputCodeEditorView1.editor : viewModel.inputCodeEditorView2.editor;
        const lineNumber = input.getPosition().lineNumber;
        await editorService.openEditor({
            original: { resource: base.uri },
            modified: { resource: input.getModel().uri },
            options: {
                selection: {
                    startLineNumber: lineNumber,
                    startColumn: 1,
                },
                revealIfOpened: true,
                revealIfVisible: true,
            }
        });
    }
    class OpenBaseFile extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.openBaseEditor',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.openBaseEditor', "Open Base File"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel, accessor) {
            const openerService = accessor.get(opener_1.IOpenerService);
            openerService.open(viewModel.model.base.uri);
        }
    }
    exports.OpenBaseFile = OpenBaseFile;
    class AcceptAllInput1 extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.acceptAllInput1',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.acceptAllInput1', "Accept All Changes from Left"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInput1Toolbar, group: 'primary' },
                icon: codicons_1.Codicon.checkAll,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.acceptAll(1);
        }
    }
    exports.AcceptAllInput1 = AcceptAllInput1;
    class AcceptAllInput2 extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.acceptAllInput2',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.acceptAllInput2', "Accept All Changes from Right"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInput2Toolbar, group: 'primary' },
                icon: codicons_1.Codicon.checkAll,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.acceptAll(2);
        }
    }
    exports.AcceptAllInput2 = AcceptAllInput2;
    class ResetToBaseAndAutoMergeCommand extends MergeEditorAction {
        constructor() {
            super({
                id: 'mergeEditor.resetResultToBaseAndAutoMerge',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.resetResultToBaseAndAutoMerge', "Reset Result"),
                shortTitle: (0, nls_1.localize)('mergeEditor.resetResultToBaseAndAutoMerge.short', 'Reset'),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInputResultToolbar, group: 'primary' },
                icon: codicons_1.Codicon.discard,
            });
        }
        runWithViewModel(viewModel, accessor) {
            viewModel.model.reset();
        }
    }
    exports.ResetToBaseAndAutoMergeCommand = ResetToBaseAndAutoMergeCommand;
    class ResetCloseWithConflictsChoice extends actions_1.Action2 {
        constructor() {
            super({
                id: 'mergeEditor.resetCloseWithConflictsChoice',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.resetChoice', "Reset Choice for \'Close with Conflicts\'"),
                f1: true,
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).remove(mergeEditor_2.StorageCloseWithConflicts, 0 /* StorageScope.PROFILE */);
        }
    }
    exports.ResetCloseWithConflictsChoice = ResetCloseWithConflictsChoice;
    // this is an API command
    class AcceptMerge extends MergeEditorAction2 {
        constructor() {
            super({
                id: 'mergeEditor.acceptMerge',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.acceptMerge', "Complete Merge"),
                f1: false,
                precondition: mergeEditor_2.ctxIsMergeEditor
            });
        }
        async runWithMergeEditor({ inputModel, editorIdentifier, viewModel }, accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (viewModel.model.unhandledConflictsCount.get() > 0) {
                const { confirmed } = await dialogService.confirm({
                    message: (0, nls_1.localize)('mergeEditor.acceptMerge.unhandledConflicts.message', "Do you want to complete the merge of {0}?", (0, resources_1.basename)(inputModel.resultUri)),
                    detail: (0, nls_1.localize)('mergeEditor.acceptMerge.unhandledConflicts.detail', "The file contains unhandled conflicts."),
                    primaryButton: (0, nls_1.localize)({ key: 'mergeEditor.acceptMerge.unhandledConflicts.accept', comment: ['&& denotes a mnemonic'] }, "&&Complete with Conflicts")
                });
                if (!confirmed) {
                    return {
                        successful: false
                    };
                }
            }
            await inputModel.accept();
            await editorService.closeEditor(editorIdentifier);
            return {
                successful: true
            };
        }
    }
    exports.AcceptMerge = AcceptMerge;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL2NvbW1hbmRzL2NvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNCaEcsTUFBZSxpQkFBa0IsU0FBUSxpQkFBTztRQUMvQyxZQUFZLElBQStCO1lBQzFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNiLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEI7WUFDN0IsTUFBTSxFQUFFLGdCQUFnQixFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDMUQsSUFBSSxnQkFBZ0IsWUFBWSx5QkFBVyxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sRUFBRSxHQUFHLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNULE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7UUFDRixDQUFDO0tBR0Q7SUFTRCxNQUFlLGtCQUFtQixTQUFRLGlCQUFPO1FBQ2hELFlBQVksSUFBK0I7WUFDMUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2IsQ0FBQztRQUVRLEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztZQUN0RCxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztZQUMxRCxJQUFJLGdCQUFnQixZQUFZLHlCQUFXLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxFQUFFLEdBQUcsZ0JBQWdCLENBQUMs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