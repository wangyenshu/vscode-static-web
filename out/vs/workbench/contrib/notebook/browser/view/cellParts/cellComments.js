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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentThreadWidget", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, arrays_1, lifecycle_1, editorOptions_1, configuration_1, contextkey_1, instantiation_1, themeService_1, commentService_1, commentThreadWidget_1, cellPart_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellComments = void 0;
    let CellComments = class CellComments extends cellPart_1.CellContentPart {
        constructor(notebookEditor, container, contextKeyService, themeService, commentService, configurationService, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.container = container;
            this.contextKeyService = contextKeyService;
            this.themeService = themeService;
            this.commentService = commentService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this._initialized = false;
            this._commentThreadWidget = null;
            this.commentTheadDisposables = this._register(new lifecycle_1.DisposableStore());
            this.container.classList.add('review-widget');
            this._register(this.themeService.onDidColorThemeChange(this._applyTheme, this));
            // TODO @rebornix onDidChangeLayout (font change)
            // this._register(this.notebookEditor.onDidchangeLa)
            this._applyTheme();
        }
        async initialize(element) {
            if (this._initialized) {
                return;
            }
            this._initialized = true;
            const info = await this._getCommentThreadForCell(element);
            if (info) {
                await this._createCommentTheadWidget(info.owner, info.thread);
            }
        }
        async _createCommentTheadWidget(owner, commentThread) {
            this._commentThreadWidget?.dispose();
            this.commentTheadDisposables.clear();
            this._commentThreadWidget = this.instantiationService.createInstance(commentThreadWidget_1.CommentThreadWidget, this.container, this.notebookEditor, owner, this.notebookEditor.textModel.uri, this.contextKeyService, this.instantiationService, commentThread, undefined, undefined, {
                codeBlockFontFamily: this.configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily
            }, undefined, {
                actionRunner: () => {
                },
                collapse: () => { }
            });
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            await this._commentThreadWidget.display(layoutInfo.fontInfo.lineHeight);
            this._applyTheme();
            this.commentTheadDisposables.add(this._commentThreadWidget.onDidResize(() => {
                if (this.currentElement?.cellKind === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                    this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
                }
            }));
        }
        _bindListeners() {
            this.cellDisposables.add(this.commentService.onDidUpdateCommentThreads(async () => {
                if (this.currentElement) {
                    const info = await this._getCommentThreadForCell(this.currentElement);
                    if (!this._commentThreadWidget && info) {
                        await this._createCommentTheadWidget(info.owner, info.thread);
                        const layoutInfo = this.currentElement.layoutInfo;
                        this.container.style.top = `${layoutInfo.outputContainerOffset + layoutInfo.outputTotalHeight}px`;
                        this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
                        return;
                    }
                    if (this._commentThreadWidget) {
                        if (!info) {
                            this._commentThreadWidget.dispose();
                            this.currentElement.commentHeight = 0;
                            return;
                        }
                        if (this._commentThreadWidget.commentThread === info.thread) {
                            this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
                            return;
                        }
                        await this._commentThreadWidget.updateCommentThread(info.thread);
                        this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
                    }
                }
            }));
        }
        _calculateCommentThreadHeight(bodyHeight) {
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            const headHeight = Math.ceil(layoutInfo.fontInfo.lineHeight * 1.2);
            const lineHeight = layoutInfo.fontInfo.lineHeight;
            const arrowHeight = Math.round(lineHeight / 3);
            const frameThickness = Math.round(lineHeight / 9) * 2;
            const computedHeight = headHeight + bodyHeight + arrowHeight + frameThickness + 8 /** margin bottom to avoid margin collapse */;
            return computedHeight;
        }
        async _getCommentThreadForCell(element) {
            if (this.notebookEditor.hasModel()) {
                const commentInfos = (0, arrays_1.coalesce)(await this.commentService.getNotebookComments(element.uri));
                if (commentInfos.length && commentInfos[0].threads.length) {
                    return { owner: commentInfos[0].uniqueOwner, thread: commentInfos[0].threads[0] };
                }
            }
            return null;
        }
        _applyTheme() {
            const theme = this.themeService.getColorTheme();
            const fontInfo = this.notebookEditor.getLayoutInfo().fontInfo;
            this._commentThreadWidget?.applyTheme(theme, fontInfo);
        }
        didRenderCell(element) {
            if (element.cellKind === notebookCommon_1.CellKind.Code) {
                this.currentElement = element;
                this.initialize(element);
                this._bindListeners();
            }
        }
        prepareLayout() {
            if (this.currentElement?.cellKind === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
            }
        }
        updateInternalLayoutNow(element) {
            if (this.currentElement?.cellKind === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                const layoutInfo = element.layoutInfo;
                this.container.style.top = `${layoutInfo.outputContainerOffset + layoutInfo.outputTotalHeight}px`;
            }
        }
    };
    exports.CellComments = CellComments;
    exports.CellComments = CellComments = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, commentService_1.ICommentService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService)
    ], CellComments);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbENvbW1lbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jZWxsQ29tbWVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsMEJBQWU7UUFNaEQsWUFDa0IsY0FBdUMsRUFDdkMsU0FBc0IsRUFFbkIsaUJBQXNELEVBQzNELFlBQTRDLEVBQzFDLGNBQWdELEVBQzFDLG9CQUE0RCxFQUM1RCxvQkFBNEQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFUUyxtQkFBYyxHQUFkLGNBQWMsQ0FBeUI7WUFDdkMsY0FBUyxHQUFULFNBQVMsQ0FBYTtZQUVGLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDMUMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDekIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ3pCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQWI1RSxpQkFBWSxHQUFZLEtBQUssQ0FBQztZQUM5Qix5QkFBb0IsR0FBMkMsSUFBSSxDQUFDO1lBRTNELDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQWFoRixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNoRixpREFBaUQ7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