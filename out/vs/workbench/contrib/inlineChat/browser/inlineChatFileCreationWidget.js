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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/editor/browser/editorExtensions", "vs/workbench/browser/labels", "vs/platform/files/common/files", "vs/editor/common/services/resolverService", "vs/base/browser/ui/button/button", "vs/platform/theme/browser/defaultStyles", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/codicons", "vs/workbench/common/theme", "vs/nls", "vs/base/common/event"], function (require, exports, dom_1, lifecycle_1, embeddedCodeEditorWidget_1, zoneWidget_1, instantiation_1, colorRegistry, editorColorRegistry, themeService_1, inlineChat_1, editorExtensions_1, labels_1, files_1, resolverService_1, button_1, defaultStyles_1, editor_1, editorService_1, contextView_1, actions_1, iconLabels_1, codicons_1, theme_1, nls_1, event_1) {
    "use strict";
    var InlineChatFileCreatePreviewWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatFileCreatePreviewWidget = void 0;
    let InlineChatFileCreatePreviewWidget = class InlineChatFileCreatePreviewWidget extends zoneWidget_1.ZoneWidget {
        static { InlineChatFileCreatePreviewWidget_1 = this; }
        static { this.TitleHeight = 35; }
        constructor(parentEditor, instaService, themeService, _textModelResolverService, _editorService) {
            super(parentEditor, {
                showArrow: false,
                showFrame: true,
                frameColor: colorRegistry.asCssVariable(theme_1.TAB_ACTIVE_MODIFIED_BORDER),
                frameWidth: 1,
                isResizeable: true,
                isAccessible: true,
                showInHiddenAreas: true,
                ordinal: 10000 + 2
            });
            this._textModelResolverService = _textModelResolverService;
            this._editorService = _editorService;
            this._elements = (0, dom_1.h)('div.inline-chat-newfile-widget@domNode', [
                (0, dom_1.h)('div.title@title', [
                    (0, dom_1.h)('span.name.show-file-icons@name'),
                    (0, dom_1.h)('span.detail@detail'),
                ]),
                (0, dom_1.h)('div.editor@editor'),
            ]);
            this._previewStore = new lifecycle_1.MutableDisposable();
            super.create();
            this._name = instaService.createInstance(labels_1.ResourceLabel, this._elements.name, { supportIcons: true });
            this._elements.detail.appendChild((0, iconLabels_1.renderIcon)(codicons_1.Codicon.circleFilled));
            const contributions = editorExtensions_1.EditorExtensionsRegistry
                .getEditorContributions()
                .filter(c => c.id !== inlineChat_1.INLINE_CHAT_ID);
            this._previewEditor = instaService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, this._elements.editor, {
                scrollBeyondLastLine: false,
                stickyScroll: { enabled: false },
                minimap: { enabled: false },
                scrollbar: { alwaysConsumeMouseWheel: false, useShadows: true, ignoreHorizontalScrollbarInContentHeight: true, },
            }, { isSimpleWidget: true, contributions }, parentEditor);
            const doStyle = () => {
                const theme = themeService.getColorTheme();
                const overrides = [
                    [colorRegistry.editorBackground, inlineChat_1.inlineChatRegionHighlight],
                    [editorColorRegistry.editorGutter, inlineChat_1.inlineChatRegionHighlight],
                ];
                for (const [target, source] of overrides) {
                    const value = theme.getColor(source);
                    if (value) {
                        this._elements.domNode.style.setProperty(colorRegistry.asCssVariableName(target), String(value));
                    }
                }
            };
            doStyle();
            this._disposables.add(themeService.onDidColorThemeChange(doStyle));
            this._buttonBar = instaService.createInstance(ButtonBarWidget);
            this._elements.title.appendChild(this._buttonBar.domNode);
        }
        dispose() {
            this._name.dispose();
            this._buttonBar.dispose();
            this._previewEditor.dispose();
            this._previewStore.dispose();
            super.dispose();
        }
        _fillContainer(container) {
            container.appendChild(this._elements.domNode);
        }
        show() {
            throw new Error('Use showFileCreation');
        }
        async showCreation(where, untitledTextModel) {
            const store = new lifecycle_1.DisposableStore();
            this._previewStore.value = store;
            this._name.element.setFile(untitledTextModel.resource, {
                fileKind: files_1.FileKind.FILE,
                fileDecorations: { badges: true, colors: true }
            });
            const actionSave = (0, actions_1.toAction)({
                id: '1',
                label: (0, nls_1.localize)('save', "Create"),
                run: () => untitledTextModel.save({ reason: 1 /* SaveReason.EXPLICIT */ })
            });
            const actionSaveAs = (0, actions_1.toAction)({
                id: '2',
                label: (0, nls_1.localize)('saveAs', "Create As"),
                run: async () => {
                    const ids = this._editorService.findEditors(untitledTextModel.resource, { supportSideBySide: editor_1.SideBySideEditor.ANY });
                    await this._editorService.save(ids.slice(), { saveAs: true, reason: 1 /* SaveReason.EXPLICIT */ });
                }
            });
            this._buttonBar.update([
                [actionSave, actionSaveAs],
                [((0, actions_1.toAction)({ id: '3', label: (0, nls_1.localize)('discard', "Discard"), run: () => untitledTextModel.revert() }))]
            ]);
            store.add(event_1.Event.any(untitledTextModel.onDidRevert, untitledTextModel.onDidSave, untitledTextModel.onDidChangeDirty, untitledTextModel.onWillDispose)(() => this.hide()));
            await untitledTextModel.resolve();
            const ref = await this._textModelResolverService.createModelReference(untitledTextModel.resource);
            store.add(ref);
            const model = ref.object.textEditorModel;
            this._previewEditor.setModel(model);
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            this._elements.title.style.height = `${InlineChatFileCreatePreviewWidget_1.TitleHeight}px`;
            const titleHightInLines = InlineChatFileCreatePreviewWidget_1.TitleHeight / lineHeight;
            const maxLines = Math.max(4, Math.floor((this.editor.getLayoutInfo().height / lineHeight) * .33));
            const lines = Math.min(maxLines, model.getLineCount());
            super.show(where, titleHightInLines + lines);
        }
        hide() {
            this._previewStore.clear();
            super.hide();
        }
        // --- layout
        revealRange(range, isLastLine) {
            // ignore
        }
        _onWidth(widthInPixel) {
            if (this._dim) {
                this._doLayout(this._dim.height, widthInPixel);
            }
        }
        _doLayout(heightInPixel, widthInPixel) {
            const { lineNumbersLeft } = this.editor.getLayoutInfo();
            this._elements.title.style.marginLeft = `${lineNumbersLeft}px`;
            const newDim = new dom_1.Dimension(widthInPixel, heightInPixel);
            if (!dom_1.Dimension.equals(this._dim, newDim)) {
                this._dim = newDim;
                this._previewEditor.layout(this._dim.with(undefined, this._dim.height - InlineChatFileCreatePreviewWidget_1.TitleHeight));
            }
        }
    };
    exports.InlineChatFileCreatePreviewWidget = InlineChatFileCreatePreviewWidget;
    exports.InlineChatFileCreatePreviewWidget = InlineChatFileCreatePreviewWidget = InlineChatFileCreatePreviewWidget_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, editorService_1.IEditorService)
    ], InlineChatFileCreatePreviewWidget);
    let ButtonBarWidget = class ButtonBarWidget {
        constructor(_contextMenuService) {
            this._contextMenuService = _contextMenuService;
            this._domNode = (0, dom_1.h)('div.buttonbar-widget');
            this._store = new lifecycle_1.DisposableStore();
            this._buttonBar = new button_1.ButtonBar(this.domNode);
        }
        update(allActions) {
            this._buttonBar.clear();
            let secondary = false;
            for (const actions of allActions) {
                let btn;
                const [first, ...rest] = actions;
                if (!first) {
                    continue;
                }
                else if (rest.length === 0) {
                    // single action
                    btn = this._buttonBar.addButton({ ...defaultStyles_1.defaultButtonStyles, secondary });
                }
                else {
                    btn = this._buttonBar.addButtonWithDropdown({
                        ...defaultStyles_1.defaultButtonStyles,
                        addPrimaryActionToDropdown: false,
                        actions: rest,
                        contextMenuProvider: this._contextMenuService
                    });
                }
                btn.label = first.label;
                this._store.add(btn.onDidClick(() => first.run()));
                secondary = true;
            }
        }
        dispose() {
            this._buttonBar.dispose();
            this._store.dispose();
        }
        get domNode() {
            return this._domNode.root;
        }
    };
    ButtonBarWidget = __decorate([
        __param(0, contextView_1.IContextMenuService)
    ], ButtonBarWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdEZpbGVDcmVhdGlvbldpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci9pbmxpbmVDaGF0RmlsZUNyZWF0aW9uV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnQ3pGLElBQU0saUNBQWlDLEdBQXZDLE1BQU0saUNBQWtDLFNBQVEsdUJBQVU7O2lCQUVqRCxnQkFBVyxHQUFHLEVBQUUsQUFBTCxDQUFNO1FBZ0JoQyxZQUNDLFlBQXlCLEVBQ0YsWUFBbUMsRUFDM0MsWUFBMkIsRUFDdkIseUJBQTZELEVBQ2hFLGNBQStDO1lBRS9ELEtBQUssQ0FBQyxZQUFZLEVBQUU7Z0JBQ25CLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixTQUFTLEVBQUUsSUFBSTtnQkFDZixVQUFVLEVBQUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxrQ0FBMEIsQ0FBQztnQkFDbkUsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixpQkFBaUIsRUFBRSxJQUFJO2dCQUN2QixPQUFPLEVBQUUsS0FBSyxHQUFHLENBQUM7YUFDbEIsQ0FBQyxDQUFDO1lBWmlDLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBbUI7WUFDL0MsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBbkIvQyxjQUFTLEdBQUcsSUFBQSxPQUFDLEVBQUMsd0NBQXdDLEVBQUU7Z0JBQ3hFLElBQUEsT0FBQyxFQUFDLGlCQUFpQixFQUFFO29CQUNwQixJQUFBLE9BQUMsRUFBQyxnQ0FBZ0MsQ0FBQztvQkFDbkMsSUFBQSxPQUFDLEVBQUMsb0JBQW9CLENBQUM7aUJBQ3ZCLENBQUM7Z0JBQ0YsSUFBQSxP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