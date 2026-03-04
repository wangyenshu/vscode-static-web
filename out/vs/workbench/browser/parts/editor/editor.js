/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/types", "vs/base/common/verifier"], function (require, exports, dom_1, types_1, verifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_EDITOR_PART_OPTIONS = exports.DEFAULT_EDITOR_MAX_DIMENSIONS = exports.DEFAULT_EDITOR_MIN_DIMENSIONS = void 0;
    exports.impactsEditorPartOptions = impactsEditorPartOptions;
    exports.getEditorPartOptions = getEditorPartOptions;
    exports.fillActiveEditorViewState = fillActiveEditorViewState;
    exports.DEFAULT_EDITOR_MIN_DIMENSIONS = new dom_1.Dimension(220, 70);
    exports.DEFAULT_EDITOR_MAX_DIMENSIONS = new dom_1.Dimension(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    exports.DEFAULT_EDITOR_PART_OPTIONS = {
        showTabs: 'multiple',
        highlightModifiedTabs: false,
        tabActionLocation: 'right',
        tabActionCloseVisibility: true,
        tabActionUnpinVisibility: true,
        tabSizing: 'fit',
        tabSizingFixedMinWidth: 50,
        tabSizingFixedMaxWidth: 160,
        pinnedTabSizing: 'normal',
        pinnedTabsOnSeparateRow: false,
        tabHeight: 'default',
        preventPinnedEditorClose: 'keyboardAndMouse',
        titleScrollbarSizing: 'default',
        focusRecentEditorAfterClose: true,
        showIcons: true,
        hasIcons: true, // 'vs-seti' is our default icon theme
        enablePreview: true,
        openPositioning: 'right',
        openSideBySideDirection: 'right',
        closeEmptyGroups: true,
        labelFormat: 'default',
        splitSizing: 'auto',
        splitOnDragAndDrop: true,
        dragToOpenWindow: true,
        centeredLayoutFixedWidth: false,
        doubleClickTabToToggleEditorGroupSizes: 'expand',
        editorActionsLocation: 'default',
        wrapTabs: false,
        enablePreviewFromQuickOpen: false,
        scrollToSwitchTabs: false,
        enablePreviewFromCodeNavigation: false,
        closeOnFileDelete: false,
        mouseBackForwardToNavigate: true,
        restoreViewState: true,
        splitInGroupLayout: 'horizontal',
        revealIfOpen: false,
        // Properties that are Objects have to be defined as getters
        // to ensure no consumer modifies the default values
        get limit() { return { enabled: false, value: 10, perEditorGroup: false, excludeDirty: false }; },
        get decorations() { return { badges: true, colors: true }; },
        get autoLockGroups() { return new Set(); }
    };
    function impactsEditorPartOptions(event) {
        return event.affectsConfiguration('workbench.editor') || event.affectsConfiguration('workbench.iconTheme') || event.affectsConfiguration('window.density');
    }
    function getEditorPartOptions(configurationService, themeService) {
        const options = {
            ...exports.DEFAULT_EDITOR_PART_OPTIONS,
            hasIcons: themeService.getFileIconTheme().hasFileIcons
        };
        const config = configurationService.getValue();
        if (config?.workbench?.editor) {
            // Assign all primitive configuration over
            Object.assign(options, config.workbench.editor);
            // Special handle array types and convert to Set
            if ((0, types_1.isObject)(config.workbench.editor.autoLockGroups)) {
                options.autoLockGroups = exports.DEFAULT_EDITOR_PART_OPTIONS.autoLockGroups;
                for (const [editorId, enablement] of Object.entries(config.workbench.editor.autoLockGroups)) {
                    if (enablement === true) {
                        options.autoLockGroups.add(editorId);
                    }
                }
            }
            else {
                options.autoLockGroups = exports.DEFAULT_EDITOR_PART_OPTIONS.autoLockGroups;
            }
        }
        const windowConfig = configurationService.getValue();
        if (windowConfig?.window?.density?.editorTabHeight) {
            options.tabHeight = windowConfig.window.density.editorTabHeight;
        }
        return validateEditorPartOptions(options);
    }
    function validateEditorPartOptions(options) {
        // Migrate: Show tabs (config migration kicks in very late and can cause flicker otherwise)
        if (typeof options.showTabs === 'boolean') {
            options.showTabs = options.showTabs ? 'multiple' : 'single';
        }
        return (0, verifier_1.verifyObject)({
            'wrapTabs': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['wrapTabs']),
            'scrollToSwitchTabs': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['scrollToSwitchTabs']),
            'highlightModifiedTabs': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['highlightModifiedTabs']),
            'tabActionCloseVisibility': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabActionCloseVisibility']),
            'tabActionUnpinVisibility': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabActionUnpinVisibility']),
            'pinnedTabsOnSeparateRow': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['pinnedTabsOnSeparateRow']),
            'focusRecentEditorAfterClose': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['focusRecentEditorAfterClose']),
            'showIcons': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['showIcons']),
            'enablePreview': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['enablePreview']),
            'enablePreviewFromQuickOpen': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['enablePreviewFromQuickOpen']),
            'enablePreviewFromCodeNavigation': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['enablePreviewFromCodeNavigation']),
            'closeOnFileDelete': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['closeOnFileDelete']),
            'closeEmptyGroups': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['closeEmptyGroups']),
            'revealIfOpen': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['revealIfOpen']),
            'mouseBackForwardToNavigate': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['mouseBackForwardToNavigate']),
            'restoreViewState': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['restoreViewState']),
            'splitOnDragAndDrop': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['splitOnDragAndDrop']),
            'dragToOpenWindow': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['dragToOpenWindow']),
            'centeredLayoutFixedWidth': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['centeredLayoutFixedWidth']),
            'hasIcons': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['hasIcons']),
            'tabSizingFixedMinWidth': new verifier_1.NumberVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabSizingFixedMinWidth']),
            'tabSizingFixedMaxWidth': new verifier_1.NumberVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabSizingFixedMaxWidth']),
            'showTabs': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['showTabs'], ['multiple', 'single', 'none']),
            'tabActionLocation': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabActionLocation'], ['left', 'right']),
            'tabSizing': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabSizing'], ['fit', 'shrink', 'fixed']),
            'pinnedTabSizing': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['pinnedTabSizing'], ['normal', 'compact', 'shrink']),
            'tabHeight': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabHeight'], ['default', 'compact']),
            'preventPinnedEditorClose': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['preventPinnedEditorClose'], ['keyboardAndMouse', 'keyboard', 'mouse', 'never']),
            'titleScrollbarSizing': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['titleScrollbarSizing'], ['default', 'large']),
            'openPositioning': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['openPositioning'], ['left', 'right', 'first', 'last']),
            'openSideBySideDirection': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['openSideBySideDirection'], ['right', 'down']),
            'labelFormat': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['labelFormat'], ['default', 'short', 'medium', 'long']),
            'splitInGroupLayout': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['splitInGroupLayout'], ['vertical', 'horizontal']),
            'splitSizing': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['splitSizing'], ['distribute', 'split', 'auto']),
            'doubleClickTabToToggleEditorGroupSizes': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['doubleClickTabToToggleEditorGroupSizes'], ['maximize', 'expand', 'off']),
            'editorActionsLocation': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['editorActionsLocation'], ['default', 'titleBar', 'hidden']),
            'autoLockGroups': new verifier_1.SetVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['autoLockGroups']),
            'limit': new verifier_1.ObjectVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit'], {
                'enabled': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit']['enabled']),
                'value': new verifier_1.NumberVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit']['value']),
                'perEditorGroup': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit']['perEditorGroup']),
                'excludeDirty': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit']['excludeDirty'])
            }),
            'decorations': new verifier_1.ObjectVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['decorations'], {
                'badges': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['decorations']['badges']),
                'colors': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['decorations']['colors'])
            }),
        }, options);
    }
    function fillActiveEditorViewState(group, expectedActiveEditor, presetOptions) {
        if (!expectedActiveEditor || !group.activeEditor || expectedActiveEditor.matches(group.activeEditor)) {
            const options = {
                ...presetOptions,
                viewState: group.activeEditorPane?.getViewState()
            };
            return options;
        }
        return presetOptions || Object.create(null);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxRWhHLDREQUVDO0lBRUQsb0RBZ0NDO0lBdUtELDhEQVdDO0lBclFZLFFBQUEsNkJBQTZCLEdBQUcsSUFBSSxlQUFTLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZELFFBQUEsNkJBQTZCLEdBQUcsSUFBSSxlQUFTLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBRWxHLFFBQUEsMkJBQTJCLEdBQXVCO1FBQzlELFFBQVEsRUFBRSxVQUFVO1FBQ3BCLHFCQUFxQixFQUFFLEtBQUs7UUFDNUIsaUJBQWlCLEVBQUUsT0FBTztRQUMxQix3QkFBd0IsRUFBRSxJQUFJO1FBQzlCLHdCQUF3QixFQUFFLElBQUk7UUFDOUIsU0FBUyxFQUFFLEtBQUs7UUFDaEIsc0JBQXNCLEVBQUUsRUFBRTtRQUMxQixzQkFBc0IsRUFBRSxHQUFHO1FBQzNCLGVBQWUsRUFBRSxRQUFRO1FBQ3pCLHVCQUF1QixFQUFFLEtBQUs7UUFDOUIsU0FBUyxFQUFFLFNBQVM7UUFDcEIsd0JBQXdCLEVBQUUsa0JBQWtCO1FBQzVDLG9CQUFvQixFQUFFLFNBQVM7UUFDL0IsMkJBQTJCLEVBQUUsSUFBSTtRQUNqQyxTQUFTLEVBQUUsSUFBSTtRQUNmLFFBQVEsRUFBRSxJQUFJLEVBQUUsc0NBQXNDO1FBQ3RELGFBQWEsRUFBRSxJQUFJO1FBQ25CLGVBQWUsRUFBRSxPQUFPO1FBQ3hCLHVCQUF1QixFQUFFLE9BQU87UUFDaEMsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixXQUFXLEVBQUUsU0FBUztRQUN0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