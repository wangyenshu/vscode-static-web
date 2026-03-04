var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/range", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/inlineChat/common/inlineChat", "./inlineChatWidget", "vs/platform/actions/common/actions", "vs/base/common/resources", "vs/editor/browser/stableEditorScroll", "vs/platform/configuration/common/configuration"], function (require, exports, dom_1, aria, lifecycle_1, types_1, range_1, zoneWidget_1, nls_1, contextkey_1, instantiation_1, inlineChat_1, inlineChatWidget_1, actions_1, resources_1, stableEditorScroll_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatZoneWidget = void 0;
    let InlineChatZoneWidget = class InlineChatZoneWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, _instaService, contextKeyService, configurationService) {
            super(editor, { showFrame: false, showArrow: false, isAccessible: true, className: 'inline-chat-widget', keepEditorSelection: true, showInHiddenAreas: true, ordinal: 10000 });
            this._instaService = _instaService;
            this._ctxCursorPosition = inlineChat_1.CTX_INLINE_CHAT_OUTER_CURSOR_POSITION.bindTo(contextKeyService);
            this._disposables.add((0, lifecycle_1.toDisposable)(() => {
                this._ctxCursorPosition.reset();
            }));
            this.widget = this._instaService.createInstance(inlineChatWidget_1.EditorBasedInlineChatWidget, this.editor, {
                telemetrySource: 'interactiveEditorWidget-toolbar',
                inputMenuId: actions_1.MenuId.ChatExecute,
                widgetMenuId: inlineChat_1.MENU_INLINE_CHAT_WIDGET,
                statusMenuId: {
                    menu: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    options: {
                        buttonConfigProvider: action => {
                            if (action.id === inlineChat_1.ACTION_REGENERATE_RESPONSE || action.id === inlineChat_1.ACTION_TOGGLE_DIFF) {
                                return { showIcon: true, showLabel: false, isSecondary: true };
                            }
                            else if (action.id === inlineChat_1.ACTION_VIEW_IN_CHAT || action.id === inlineChat_1.ACTION_ACCEPT_CHANGES) {
                                return { isSecondary: false };
                            }
                            else {
                                return { isSecondary: true };
                            }
                        }
                    }
                },
                rendererOptions: {
                    renderTextEditsAsSummary: (uri) => {
                        // render edits as summary only when using Live mode and when
                        // dealing with the current file in the editor
                        return (0, resources_1.isEqual)(uri, editor.getModel()?.uri)
                            && configurationService.getValue("inlineChat.mode" /* InlineChatConfigKeys.Mode */) === "live" /* EditMode.Live */;
                    },
                }
            });
            this._disposables.add(this.widget.onDidChangeHeight(() => {
                if (this.position) {
                    // only relayout when visible
                    this._relayout(this._computeHeightInLines());
                }
            }));
            this._disposables.add(this.widget);
            this.create();
            // todo@jrieken listen ONLY when showing
            const updateCursorIsAboveContextKey = () => {
                if (!this.position || !this.editor.hasModel()) {
                    this._ctxCursorPosition.reset();
                }
                else if (this.position.lineNumber === this.editor.getPosition().lineNumber) {
                    this._ctxCursorPosition.set('above');
                }
                else if (this.position.lineNumber + 1 === this.editor.getPosition().lineNumber) {
                    this._ctxCursorPosition.set('below');
                }
                else {
                    this._ctxCursorPosition.reset();
                }
            };
            this._disposables.add(this.editor.onDidChangeCursorPosition(e => updateCursorIsAboveContextKey()));
            this._disposables.add(this.editor.onDidFocusEditorText(e => updateCursorIsAboveContextKey()));
            updateCursorIsAboveContextKey();
        }
        _fillContainer(container) {
            container.appendChild(this.widget.domNode);
        }
        _doLayout(heightInPixel) {
            const maxWidth = !this.widget.showsAnyPreview() ? 640 : Number.MAX_SAFE_INTEGER;
            const width = Math.min(maxWidth, this._availableSpaceGivenIndentation(this._indentationWidth));
            this._dimension = new dom_1.Dimension(width, heightInPixel);
            this.widget.layout(this._dimension);
        }
        _availableSpaceGivenIndentation(indentationWidth) {
            const info = this.editor.getLayoutInfo();
            return info.contentWidth - (info.glyphMarginWidth + info.decorationsWidth + (indentationWidth ?? 0));
        }
        _computeHeightInLines() {
            const chatContentHeight = this.widget.contentHeight;
            const editorHeight = this.editor.getLayoutInfo().height;
            const contentHeight = Math.min(chatContentHeight, Math.max(this.widget.minHeight, editorHeight * 0.42));
            const heightInLines = contentHeight / this.editor.getOption(67 /* EditorOption.lineHeight */);
            return heightInLines;
        }
        _onWidth(_widthInPixel) {
            if (this._dimension) {
                this._doLayout(this._dimension.height);
            }
        }
        show(position) {
            (0, types_1.assertType)(this.container);
            const scrollState = stableEditorScroll_1.StableEditorBottomScrollState.capture(this.editor);
            const info = this.editor.getLayoutInfo();
            const marginWithoutIndentation = info.glyphMarginWidth + info.decorationsWidth + info.lineNumbersWidth;
            this.container.style.marginLeft = `${marginWithoutIndentation}px`;
            super.show(position, this._computeHeightInLines());
            this._setWidgetMargins(position);
            this.widget.focus();
            scrollState.restore(this.editor);
            this.editor.revealRangeNearTopIfOutsideViewport(range_1.Range.fromPositions(position.delta(-1)), 1 /* ScrollType.Immediate */);
        }
        updatePositionAndHeight(position) {
            super.updatePositionAndHeight(position, this._computeHeightInLines());
            this._setWidgetMargins(position);
        }
        _getWidth(info) {
            return info.width - info.minimap.minimapWidth;
        }
        updateBackgroundColor(newPosition, wholeRange) {
            (0, types_1.assertType)(this.container);
            const widgetLineNumber = newPosition.lineNumber;
            this.container.classList.toggle('inside-selection', widgetLineNumber > wholeRange.startLineNumber && widgetLineNumber < wholeRange.endLineNumber);
        }
        _calculateIndentationWidth(position) {
            const viewModel = this.editor._getViewModel();
            if (!viewModel) {
                return 0;
            }
            const visibleRange = viewModel.getCompletelyVisibleViewRange();
            if (!visibleRange.containsPosition(position)) {
                // this is needed because `getOffsetForColumn` won't work when the position
                // isn't visible/rendered
                return 0;
            }
            let indentationLevel = viewModel.getLineFirstNonWhitespaceColumn(position.lineNumber);
            let indentationLineNumber = position.lineNumber;
            for (let lineNumber = position.lineNumber; lineNumber >= visibleRange.startLineNumber; lineNumber--) {
                const currentIndentationLevel = viewModel.getLineFirstNonWhitespaceColumn(lineNumber);
                if (currentIndentationLevel !== 0) {
                    indentationLineNumber = lineNumber;
                    indentationLevel = currentIndentationLevel;
                    break;
                }
            }
            return Math.max(0, this.editor.getOffsetForColumn(indentationLineNumber, indentationLevel)); // double-guard against invalie getOffsetForColumn-calls
        }
        _setWidgetMargins(position) {
            const indentationWidth = this._calculateIndentationWidth(position);
            if (this._indentationWidth === indentationWidth) {
                return;
            }
            this._indentationWidth = this._availableSpaceGivenIndentation(indentationWidth) > 400 ? indentationWidth : 0;
            this.widget.domNode.style.marginLeft = `${this._indentationWidth}px`;
            this.widget.domNode.style.marginRight = `${this.editor.getLayoutInfo().minimap.minimapWidth}px`;
        }
        hide() {
            this.container.classList.remove('inside-selection');
            this._ctxCursorPosition.reset();
            this.widget.reset();
            super.hide();
            aria.status((0, nls_1.localize)('inlineChatClosed', 'Closed inline chat widget'));
        }
    };
    exports.InlineChatZoneWidget = InlineChatZoneWidget;
    exports.InlineChatZoneWidget = InlineChatZoneWidget = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, configuration_1.IConfigurationService)
    ], InlineChatZoneWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFpvbmVXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdFpvbmVXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQXlCTyxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHVCQUFVO1FBUW5ELFlBQ0MsTUFBbUIsRUFDcUIsYUFBb0MsRUFDeEQsaUJBQXFDLEVBQ2xDLG9CQUEyQztZQUVsRSxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFKdkksa0JBQWEsR0FBYixhQUFhLENBQXVCO1lBTTVFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrREFBcUMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUUxRixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsOENBQTJCLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDekYsZUFBZSxFQUFFLGlDQUFpQztnQkFDbEQsV0FBVyxFQUFFLGdCQUFNLENBQUMsV0FBVztnQkFDL0IsWUFBWSxFQUFFLG9DQUF1QjtnQkFDckMsWUFBWSxFQUFFO29CQUNiLElBQUksRUFBRSwyQ0FBOEI7b0JBQ3BDLE9BQU8sRUFBRTt3QkFDUixvQkFBb0IsRUFBRSxNQUFNLENBQUMsRUFBRTs0QkFDOUIsSUFBSSxNQUFNLENBQUMsRUFBRSxLQUFLLHVDQUEwQixJQUFJLE1BQU0sQ0FBQyxFQUFFLEtBQUssK0JBQWtCLEVBQUUsQ0FBQztnQ0FDbEYsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUM7NEJBQ2hFLENBQUM7aUNBQU0sSUFBSSxNQUFNLENBQUMsRUFBRSxLQUFLLGdDQUFtQixJQUFJLE1BQU0sQ0FBQyxFQUFFLEtBQUssa0NBQXFCLEVBQUUsQ0FBQztnQ0FDckYsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQzs0QkFDL0IsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUM7NEJBQzlCLENBQUM7d0JBQ0YsQ0FBQztxQkFDRDtpQkFDRDtnQkFDRCxlQUFlLEVBQUU7b0JBQ2hCLHdCQUF3QixFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7d0JBQ2pDLDZEQUE2RDt3QkFDN0QsOENBQThDO3dCQUM5QyxPQUFPLElBQUEsbUJBQU8sRUFBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQzsrQkFDdkMsb0JBQW9CLENBQUMsUUFBUSxtREFBcUMsK0JBQWtCLENBQUM7b0JBQzFGLENBQUM7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtnQkFDeEQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ25CLDZCQUE2QjtvQkFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO2dCQUM5QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFZCx3Q0FBd0M7WUFDeEMsTUFBTSw2QkFBNkIsR0FBRyxHQUFHLEVBQUU7Z0JBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUMvQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2pDLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUM5RSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO3FCQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2xGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2pDLENBQUM7WUFDRixDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLDZCQUE2QixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlGLDZCQUE2QixFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVrQixjQUFjLENBQUMsU0FBc0I7WUFDdkQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFHa0IsU0FBUyxDQUFDLGFBQXFCO1lBQ2pELE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFDaEYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDL0YsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLGVBQVMsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFTywrQkFBK0IsQ0FBQyxnQkFBb0M7WUFDM0UsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN6QyxPQUFPLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRU8scUJBQXFCO1lBQzVCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFDcEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFFeEQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sYUFBYSxHQUFHLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsa0NBQXlCLENBQUM7WUFDckYsT0FBTyxhQUFhLENBQUM7UUFDdEIsQ0FBQztRQUVrQixRQUFRLENBQUMsYUFBcUI7WUFDaEQsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxDQUFDO1FBQ0YsQ0FBQztRQUVRLElBQUksQ0FBQyxRQUFrQjtZQUMvQixJQUFBLGtCQUFVLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTNCLE1BQU0sV0FBVyxHQUFHLGtEQUE2QixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN6QyxNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1lBQ3ZHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxHQUFHLHdCQUF3QixJQUFJLENBQUM7WUFFbEUsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVwQixXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLG1DQUFtQyxDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLCtCQUF1QixDQUFDO1FBQ2hILENBQUM7UUFFUSx1QkFBdUIsQ0FBQyxRQUFrQjtZQUNsRCxLQUFLLENBQUMsdUJBQXVCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFa0IsU0FBUyxDQUFDLElBQXNCO1lBQ2xELE9BQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQztRQUMvQyxDQUFDO1FBRUQscUJBQXFCLENBQUMsV0FBcUIsRUFBRSxVQUFrQjtZQUM5RCxJQUFBLGtCQUFVLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQztZQUNoRCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUUsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLGVBQWUsSUFBSSxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbkosQ0FBQztRQUVPLDBCQUEwQixDQUFDLFFBQWtCO1lBQ3BELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFFRCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztZQUMvRCxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLDJFQUEyRTtnQkFDM0UseUJBQXlCO2dCQUN6QixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFFRCxJQUFJLGdCQUFnQixHQUFHLFNBQVMsQ0FBQywrQkFBK0IsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEYsSUFBSSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQ2hELEtBQUssSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRSxVQUFVLElBQUksWUFBWSxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUNyRyxNQUFNLHVCQUF1QixHQUFHLFNBQVMsQ0FBQywrQkFBK0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDdEYsSUFBSSx1QkFBdUIsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDbkMscUJBQXFCLEdBQUcsVUFBVSxDQUFDO29CQUNuQyxnQkFBZ0IsR0FBRyx1QkFBdUIsQ0FBQztvQkFDM0MsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyx3REFBd0Q7UUFDdEosQ0FBQztRQUVPLGlCQUFpQixDQUFDLFFBQWtCO1lBQzNDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25FLElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLGdCQUFnQixFQUFFLENBQUM7Z0JBQ2pELE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUM7WUFDckUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksSUFBSSxDQUFDO1FBQ2pHLENBQUM7UUFFUSxJQUFJO1lBQ1osSUFBSSxDQUFDLFNBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDcEIsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQztLQUNELENBQUE7SUF0TFksb0RBQW9CO21DQUFwQixvQkFBb0I7UUFVOUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEscUNBQXFCLENBQUE7T0FaWCxvQkFBb0IsQ0FzTGhDIn0=