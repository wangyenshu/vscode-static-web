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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/workbench/contrib/notebook/browser/diff/diffComponents", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/notification/common/notification", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/editor/common/config/fontInfo", "vs/base/browser/pixelRatio", "vs/platform/actions/browser/toolbar", "vs/workbench/contrib/notebook/browser/diff/diffCellEditorOptions", "vs/platform/accessibility/common/accessibility", "vs/css!./notebookDiff"], function (require, exports, DOM, listWidget_1, lifecycle_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, listService_1, themeService_1, notebookDiffEditorBrowser_1, diffComponents_1, codeEditorWidget_1, diffEditorWidget_1, actions_1, contextView_1, notification_1, cellActionView_1, fontInfo_1, pixelRatio_1, toolbar_1, diffCellEditorOptions_1, accessibility_1) {
    "use strict";
    var CellDiffSingleSideRenderer_1, CellDiffSideBySideRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookTextDiffList = exports.NotebookMouseController = exports.CellDiffSideBySideRenderer = exports.CellDiffSingleSideRenderer = exports.NotebookCellTextDiffListDelegate = void 0;
    let NotebookCellTextDiffListDelegate = class NotebookCellTextDiffListDelegate {
        constructor(targetWindow, configurationService) {
            this.configurationService = configurationService;
            const editorOptions = this.configurationService.getValue('editor');
            this.lineHeight = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(targetWindow).value).lineHeight;
        }
        getHeight(element) {
            return element.getHeight(this.lineHeight);
        }
        hasDynamicHeight(element) {
            return false;
        }
        getTemplateId(element) {
            switch (element.type) {
                case 'delete':
                case 'insert':
                    return CellDiffSingleSideRenderer.TEMPLATE_ID;
                case 'modified':
                case 'unchanged':
                    return CellDiffSideBySideRenderer.TEMPLATE_ID;
            }
        }
    };
    exports.NotebookCellTextDiffListDelegate = NotebookCellTextDiffListDelegate;
    exports.NotebookCellTextDiffListDelegate = NotebookCellTextDiffListDelegate = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], NotebookCellTextDiffListDelegate);
    let CellDiffSingleSideRenderer = class CellDiffSingleSideRenderer {
        static { CellDiffSingleSideRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'cell_diff_single'; }
        constructor(notebookEditor, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return CellDiffSingleSideRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const body = DOM.$('.cell-body');
            DOM.append(container, body);
            const diffEditorContainer = DOM.$('.cell-diff-editor-container');
            DOM.append(body, diffEditorContainer);
            const diagonalFill = DOM.append(body, DOM.$('.diagonal-fill'));
            const sourceContainer = DOM.append(diffEditorContainer, DOM.$('.source-container'));
            const editor = this._buildSourceEditor(sourceContainer);
            const metadataHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-header-container'));
            const metadataInfoContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-info-container'));
            const outputHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.output-header-container'));
            const outputInfoContainer = DOM.append(diffEditorContainer, DOM.$('.output-info-container'));
            const borderContainer = DOM.append(body, DOM.$('.border-container'));
            const leftBorder = DOM.append(borderContainer, DOM.$('.left-border'));
            const rightBorder = DOM.append(borderContainer, DOM.$('.right-border'));
            const topBorder = DOM.append(borderContainer, DOM.$('.top-border'));
            const bottomBorder = DOM.append(borderContainer, DOM.$('.bottom-border'));
            return {
                body,
                container,
                diffEditorContainer,
                diagonalFill,
                sourceEditor: editor,
                metadataHeaderContainer,
                metadataInfoContainer,
                outputHeaderContainer,
                outputInfoContainer,
                leftBorder,
                rightBorder,
                topBorder,
                bottomBorder,
                elementDisposables: new lifecycle_1.DisposableStore()
            };
        }
        _buildSourceEditor(sourceContainer) {
            const editorContainer = DOM.append(sourceContainer, DOM.$('.editor-container'));
            const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, editorContainer, {
                ...diffCellEditorOptions_1.fixedEditorOptions,
                dimension: {
                    width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                    height: 0
                },
                automaticLayout: false,
                overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode()
            }, {});
            return editor;
        }
        renderElement(element, index, templateData, height) {
            templateData.body.classList.remove('left', 'right', 'full');
            switch (element.type) {
                case 'delete':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.DeletedElement, this.notebookEditor, element, templateData));
                    return;
                case 'insert':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.InsertElement, this.notebookEditor, element, templateData));
                    return;
                default:
                    break;
            }
        }
        disposeTemplate(templateData) {
            templateData.container.innerText = '';
            templateData.sourceEditor.dispose();
            templateData.elementDisposables.dispose();
        }
        disposeElement(element, index, templateData) {
            templateData.elementDisposables.clear();
        }
    };
    exports.CellDiffSingleSideRenderer = CellDiffSingleSideRenderer;
    exports.CellDiffSingleSideRenderer = CellDiffSingleSideRenderer = CellDiffSingleSideRenderer_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], CellDiffSingleSideRenderer);
    let CellDiffSideBySideRenderer = class CellDiffSideBySideRenderer {
        static { CellDiffSideBySideRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'cell_diff_side_by_side'; }
        constructor(notebookEditor, instantiationService, contextMenuService, keybindingService, menuService, contextKeyService, notificationService, themeService, accessibilityService) {
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.themeService = themeService;
            this.accessibilityService = accessibilityService;
        }
        get templateId() {
            return CellDiffSideBySideRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const body = DOM.$('.cell-body');
            DOM.append(container, body);
            const diffEditorContainer = DOM.$('.cell-diff-editor-container');
            DOM.append(body, diffEditorContainer);
            const sourceContainer = DOM.append(diffEditorContainer, DOM.$('.source-container'));
            const { editor, editorContainer } = this._buildSourceEditor(sourceContainer);
            const inputToolbarContainer = DOM.append(sourceContainer, DOM.$('.editor-input-toolbar-container'));
            const cellToolbarContainer = DOM.append(inputToolbarContainer, DOM.$('div.property-toolbar'));
            const toolbar = this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, cellToolbarContainer, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = new cellActionView_1.CodiconActionViewItem(action, { hoverDelegate: options.hoverDelegate }, this.keybindingService, this.notificationService, this.contextKeyService, this.themeService, this.contextMenuService, this.accessibilityService);
                        return item;
                    }
                    return undefined;
                }
            });
            const metadataHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-header-container'));
            const metadataInfoContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-info-container'));
            const outputHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.output-header-container'));
            const outputInfoContainer = DOM.append(diffEditorContainer, DOM.$('.output-info-container'));
            const borderContainer = DOM.append(body, DOM.$('.border-container'));
            const leftBorder = DOM.append(borderContainer, DOM.$('.left-border'));
            const rightBorder = DOM.append(borderContainer, DOM.$('.right-border'));
            const topBorder = DOM.append(borderContainer, DOM.$('.top-border'));
            const bottomBorder = DOM.append(borderContainer, DOM.$('.bottom-border'));
            return {
                body,
                container,
                diffEditorContainer,
                sourceEditor: editor,
                editorContainer,
                inputToolbarContainer,
                toolbar,
                metadataHeaderContainer,
                metadataInfoContainer,
                outputHeaderContainer,
                outputInfoContainer,
                leftBorder,
                rightBorder,
                topBorder,
                bottomBorder,
                elementDisposables: new lifecycle_1.DisposableStore()
            };
        }
        _buildSourceEditor(sourceContainer) {
            const editorContainer = DOM.append(sourceContainer, DOM.$('.editor-container'));
            const editor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, editorContainer, {
                ...diffCellEditorOptions_1.fixedDiffEditorOptions,
                padding: {
                    top: 24,
                    bottom: 12
                },
                overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                originalEditable: false,
                ignoreTrimWhitespace: false,
                automaticLayout: false,
                dimension: {
                    height: 0,
                    width: 0
                },
                renderSideBySide: true,
                useInlineViewWhenSpaceIsLimited: false
            }, {
                originalEditor: (0, diffComponents_1.getOptimizedNestedCodeEditorWidgetOptions)(),
                modifiedEditor: (0, diffComponents_1.getOptimizedNestedCodeEditorWidgetOptions)()
            });
            return {
                editor,
                editorContainer
            };
        }
        renderElement(element, index, templateData, height) {
            templateData.body.classList.remove('left', 'right', 'full');
            switch (element.type) {
                case 'unchanged':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.ModifiedElement, this.notebookEditor, element, templateData));
                    return;
                case 'modified':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.ModifiedElement, this.notebookEditor, element, templateData));
                    return;
                default:
                    break;
            }
        }
        disposeTemplate(templateData) {
            templateData.container.innerText = '';
            templateData.sourceEditor.dispose();
            templateData.toolbar?.dispose();
            templateData.elementDisposables.dispose();
        }
        disposeElement(element, index, templateData) {
            if (templateData.toolbar) {
                templateData.toolbar.context = undefined;
            }
            templateData.elementDisposables.clear();
        }
    };
    exports.CellDiffSideBySideRenderer = CellDiffSideBySideRenderer;
    exports.CellDiffSideBySideRenderer = CellDiffSideBySideRenderer = CellDiffSideBySideRenderer_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_1.IMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, notification_1.INotificationService),
        __param(7, themeService_1.IThemeService),
        __param(8, accessibility_1.IAccessibilityService)
    ], CellDiffSideBySideRenderer);
    class NotebookMouseController extends listWidget_1.MouseController {
        onViewPointer(e) {
            if ((0, listWidget_1.isMonacoEditor)(e.browserEvent.target)) {
                const focus = typeof e.index === 'undefined' ? [] : [e.index];
                this.list.setFocus(focus, e.browserEvent);
            }
            else {
                super.onViewPointer(e);
            }
        }
    }
    exports.NotebookMouseController = NotebookMouseController;
    let NotebookTextDiffList = class NotebookTextDiffList extends listService_1.WorkbenchList {
        get rowsContainer() {
            return this.view.containerDomNode;
        }
        constructor(listUser, container, delegate, renderers, contextKeyService, options, listService, configurationService, instantiationService) {
            super(listUser, container, delegate, renderers, options, contextKeyService, listService, configurationService, instantiationService);
        }
        createMouseController(options) {
            return new NotebookMouseController(this);
        }
        getCellViewScrollTop(element) {
            const index = this.indexOf(element);
            // if (index === undefined || index < 0 || index >= this.length) {
            // 	this._getViewIndexUpperBound(element);
            // 	throw new ListError(this.listUser, `Invalid index ${index}`);
            // }
            return this.view.elementTop(index);
        }
        getScrollHeight() {
            return this.view.scrollHeight;
        }
        triggerScrollFromMouseWheelEvent(browserEvent) {
            this.view.delegateScrollFromMouseWheelEvent(browserEvent);
        }
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this.view.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        clear() {
            super.splice(0, this.length);
        }
        updateElementHeight2(element, size) {
            const viewIndex = this.indexOf(element);
            const focused = this.getFocus();
            this.view.updateElementHeight(viewIndex, size, focused.length ? focused[0] : null);
        }
        style(styles) {
            const selectorSuffix = this.view.domId;
            if (!this.styleElement) {
                this.styleElement = DOM.createStyleSheet(this.view.domNode);
            }
            const suffix = selectorSuffix && `.${selectorSuffix}`;
            const content = [];
            if (styles.listBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows { background: ${styles.listBackground}; }`);
            }
            if (styles.listFocusBackground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listFocusAndSelectionBackground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected.focused { background-color: ${styles.listFocusAndSelectionBackground}; }
			`);
            }
            if (styles.listFocusAndSelectionForeground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected.focused { color: ${styles.listFocusAndSelectionForeground}; }
			`);
            }
            if (styles.listInactiveFocusBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { background-color:  ${styles.listInactiveFocusBackground}; }`);
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused:hover { background-color:  ${styles.listInactiveFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { background-color:  ${styles.listInactiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected:hover { background-color:  ${styles.listInactiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionForeground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { color: ${styles.listInactiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list${suffix}:not(.drop-target) > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover:not(.selected):not(.focused) { background-color:  ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover:not(.selected):not(.focused) { color:  ${styles.listHoverForeground}; }`);
            }
            if (styles.listSelectionOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { outline: 1px dotted ${styles.listSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listFocusOutline) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
			`);
            }
            if (styles.listInactiveFocusOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { outline: 1px dotted ${styles.listInactiveFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            if (styles.listDropOverBackground) {
                content.push(`
				.monaco-list${suffix}.drop-target,
				.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows.drop-target,
				.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-row.drop-target { background-color: ${styles.listDropOverBackground} !important; color: inherit !important; }
			`);
            }
            const newStyles = content.join('\n');
            if (newStyles !== this.styleElement.textContent) {
                this.styleElement.textContent = newStyles;
            }
        }
    };
    exports.NotebookTextDiffList = NotebookTextDiffList;
    exports.NotebookTextDiffList = NotebookTextDiffList = __decorate([
        __param(6, listService_1.IListService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, instantiation_1.IInstantiationService)
    ], NotebookTextDiffList);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmTGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvZGlmZi9ub3RlYm9va0RpZmZMaXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4QnpGLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWdDO1FBRzVDLFlBQ0MsWUFBb0IsRUFDb0Isb0JBQTJDO1lBQTNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFFbkYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBaUIsUUFBUSxDQUFDLENBQUM7WUFDbkYsSUFBSSxDQUFDLFVBQVUsR0FBRyx1QkFBWSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsRUFBRSx1QkFBVSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFDNUgsQ0FBQztRQUVELFNBQVMsQ0FBQyxPQUFpQztZQUMxQyxPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxPQUFpQztZQUNqRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBaUM7WUFDOUMsUUFBUSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3RCLEtBQUssUUFBUSxDQUFDO2dCQUNkLEtBQUssUUFBUTtvQkFDWixPQUFPLDBCQUEwQixDQUFDLFdBQVcsQ0FBQztnQkFDL0MsS0FBSyxVQUFVLENBQUM7Z0JBQ2hCLEtBQUssV0FBVztvQkFDZixPQUFPLDBCQUEwQixDQUFDLFdBQVcsQ0FBQztZQUNoRCxDQUFDO1FB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