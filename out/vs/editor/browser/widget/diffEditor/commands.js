/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "./registrations.contribution"], function (require, exports, dom_1, codicons_1, editorExtensions_1, codeEditorService_1, diffEditorWidget_1, editorContextKeys_1, nls_1, actions_1, configuration_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibleDiffViewerPrev = exports.AccessibleDiffViewerNext = exports.RevertHunkOrSelection = exports.ShowAllUnchangedRegions = exports.CollapseAllUnchangedRegions = exports.ExitCompareMove = exports.SwitchSide = exports.ToggleUseInlineViewWhenSpaceIsLimited = exports.ToggleShowMovedCodeBlocks = exports.ToggleCollapseUnchangedRegions = void 0;
    exports.findDiffEditor = findDiffEditor;
    exports.findFocusedDiffEditor = findFocusedDiffEditor;
    class ToggleCollapseUnchangedRegions extends actions_1.Action2 {
        constructor() {
            super({
                id: 'diffEditor.toggleCollapseUnchangedRegions',
                title: (0, nls_1.localize2)('toggleCollapseUnchangedRegions', 'Toggle Collapse Unchanged Regions'),
                icon: codicons_1.Codicon.map,
                toggled: contextkey_1.ContextKeyExpr.has('config.diffEditor.hideUnchangedRegions.enabled'),
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                menu: {
                    when: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                    id: actions_1.MenuId.EditorTitle,
                    order: 22,
                    group: 'navigation',
                },
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.hideUnchangedRegions.enabled');
            configurationService.updateValue('diffEditor.hideUnchangedRegions.enabled', newValue);
        }
    }
    exports.ToggleCollapseUnchangedRegions = ToggleCollapseUnchangedRegions;
    class ToggleShowMovedCodeBlocks extends actions_1.Action2 {
        constructor() {
            super({
                id: 'diffEditor.toggleShowMovedCodeBlocks',
                title: (0, nls_1.localize2)('toggleShowMovedCodeBlocks', 'Toggle Show Moved Code Blocks'),
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.experimental.showMoves');
            configurationService.updateValue('diffEditor.experimental.showMoves', newValue);
        }
    }
    exports.ToggleShowMovedCodeBlocks = ToggleShowMovedCodeBlocks;
    class ToggleUseInlineViewWhenSpaceIsLimited extends actions_1.Action2 {
        constructor() {
            super({
                id: 'diffEditor.toggleUseInlineViewWhenSpaceIsLimited',
                title: (0, nls_1.localize2)('toggleUseInlineViewWhenSpaceIsLimited', 'Toggle Use Inline View When Space Is Limited'),
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.useInlineViewWhenSpaceIsLimited');
            configurationService.updateValue('diffEditor.useInlineViewWhenSpaceIsLimited', newValue);
        }
    }
    exports.ToggleUseInlineViewWhenSpaceIsLimited = ToggleUseInlineViewWhenSpaceIsLimited;
    const diffEditorCategory = (0, nls_1.localize2)('diffEditor', "Diff Editor");
    class SwitchSide extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'diffEditor.switchSide',
                title: (0, nls_1.localize2)('switchSide', 'Switch Side'),
                icon: codicons_1.Codicon.arrowSwap,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                f1: true,
                category: diffEditorCategory,
            });
        }
        runEditorCommand(accessor, editor, arg) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                if (arg && arg.dryRun) {
                    return { destinationSelection: diffEditor.mapToOtherSide().destinationSelection };
                }
                else {
                    diffEditor.switchSide();
                }
            }
            return undefined;
        }
    }
    exports.SwitchSide = SwitchSide;
    class ExitCompareMove extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'diffEditor.exitCompareMove',
                title: (0, nls_1.localize2)('exitCompareMove', 'Exit Compare Move'),
                icon: codicons_1.Codicon.close,
                precondition: editorContextKeys_1.EditorContextKeys.comparingMovedCode,
                f1: false,
                category: diffEditorCategory,
                keybinding: {
                    weight: 10000,
                    primary: 9 /* KeyCode.Escape */,
                }
            });
        }
        runEditorCommand(accessor, editor, ...args) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                diffEditor.exitCompareMove();
            }
        }
    }
    exports.ExitCompareMove = ExitCompareMove;
    class CollapseAllUnchangedRegions extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'diffEditor.collapseAllUnchangedRegions',
                title: (0, nls_1.localize2)('collapseAllUnchangedRegions', 'Collapse All Unchanged Regions'),
                icon: codicons_1.Codicon.fold,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                f1: true,
                category: diffEditorCategory,
            });
        }
        runEditorCommand(accessor, editor, ...args) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                diffEditor.collapseAllUnchangedRegions();
            }
        }
    }
    exports.CollapseAllUnchangedRegions = CollapseAllUnchangedRegions;
    class ShowAllUnchangedRegions extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'diffEditor.showAllUnchangedRegions',
                title: (0, nls_1.localize2)('showAllUnchangedRegions', 'Show All Unchanged Regions'),
                icon: codicons_1.Codicon.unfold,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                f1: true,
                category: diffEditorCategory,
            });
        }
        runEditorCommand(accessor, editor, ...args) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                diffEditor.showAllUnchangedRegions();
            }
        }
    }
    exports.ShowAllUnchangedRegions = ShowAllUnchangedRegions;
    class RevertHunkOrSelection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'diffEditor.revert',
                title: (0, nls_1.localize2)('revert', 'Revert'),
                f1: false,
                category: diffEditorCategory,
            });
        }
        run(accessor, arg) {
            const diffEditor = findDiffEditor(accessor, arg.originalUri, arg.modifiedUri);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                diffEditor.revertRangeMappings(arg.mapping.innerChanges ?? []);
            }
            return undefined;
        }
    }
    exports.RevertHunkOrSelection = RevertHunkOrSelection;
    const accessibleDiffViewerCategory = (0, nls_1.localize2)('accessibleDiffViewer', "Accessible Diff Viewer");
    class AccessibleDiffViewerNext extends actions_1.Action2 {
        static { this.id = 'editor.action.accessibleDiffViewer.next'; }
        constructor() {
            super({
                id: AccessibleDiffViewerNext.id,
                title: (0, nls_1.localize2)('editor.action.accessibleDiffViewer.next', 'Go to Next Difference'),
                category: accessibleDiffViewerCategory,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                keybinding: {
                    primary: 65 /* KeyCode.F7 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                f1: true,
            });
        }
        run(accessor) {
            const diffEditor = findFocusedDiffEditor(accessor);
            diffEditor?.accessibleDiffViewerNext();
        }
    }
    exports.AccessibleDiffViewerNext = AccessibleDiffViewerNext;
    class AccessibleDiffViewerPrev extends actions_1.Action2 {
        static { this.id = 'editor.action.accessibleDiffViewer.prev'; }
        constructor() {
            super({
                id: AccessibleDiffViewerPrev.id,
                title: (0, nls_1.localize2)('editor.action.accessibleDiffViewer.prev', 'Go to Previous Difference'),
                category: accessibleDiffViewerCategory,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 65 /* KeyCode.F7 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                f1: true,
            });
        }
        run(accessor) {
            const diffEditor = findFocusedDiffEditor(accessor);
            diffEditor?.accessibleDiffViewerPrev();
        }
    }
    exports.AccessibleDiffViewerPrev = AccessibleDiffViewerPrev;
    function findDiffEditor(accessor, originalUri, modifiedUri) {
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        const diffEditors = codeEditorService.listDiffEditors();
        return diffEditors.find(diffEditor => {
            const modified = diffEditor.getModifiedEditor();
            const original = diffEditor.getOriginalEditor();
            return modified && modified.getModel()?.uri.toString() === modifiedUri.toString()
                && original && original.getModel()?.uri.toString() === originalUri.toString();
        }) || null;
    }
    function findFocusedDiffEditor(accessor) {
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        const diffEditors = codeEditorService.listDiffEditors();
        const activeElement = (0, dom_1.getActiveElement)();
        if (activeElement) {
            for (const d of diffEditors) {
                const container = d.getContainerDomNode();
                if (isElementOrParentOf(container, activeElement)) {
                    return d;
                }
            }
        }
        return null;
    }
    function isElementOrParentOf(elementOrParent, element) {
        let e = element;
        while (e) {
            if (e === elementOrParent) {
                return true;
            }
            e = e.parentElement;
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci9jb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5T2hHLHdDQVdDO0lBRUQsc0RBZUM7SUFqUEQsTUFBYSw4QkFBK0IsU0FBUSxpQkFBTztRQUMxRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsMkNBQTJDO2dCQUMvQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsZ0NBQWdDLEVBQUUsbUNBQW1DLENBQUM7Z0JBQ3ZGLElBQUksRUFBRSxrQkFBTyxDQUFDLEdBQUc7Z0JBQ2pCLE9BQU8sRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxnREFBZ0QsQ0FBQztnQkFDN0UsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNsRCxJQUFJLEVBQUU7b0JBQ0wsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO29CQUMxQyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO29CQUN0QixLQUFLLEVBQUUsRUFBRTtvQkFDVCxLQUFLLEVBQUUsWUFBWTtpQkFDbkI7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFlO1lBQ2pELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sUUFBUSxHQUFHLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFVLHlDQUF5QyxDQUFDLENBQUM7WUFDcEcsb0JBQW9CLENBQUMsV0FBVyxDQUFDLHlDQUF5QyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7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