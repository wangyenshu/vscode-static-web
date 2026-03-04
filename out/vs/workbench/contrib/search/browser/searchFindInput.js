/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindReplaceWidget", "vs/nls", "vs/base/common/codicons", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/toggle/toggle", "vs/base/common/event"], function (require, exports, contextScopedHistoryWidget_1, notebookFindReplaceWidget_1, nls, codicons_1, hoverDelegateFactory_1, toggle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchFindInput = void 0;
    const NLS_AI_TOGGLE_LABEL = nls.localize('aiDescription', "Use AI");
    class SearchFindInput extends contextScopedHistoryWidget_1.ContextScopedFindInput {
        constructor(container, contextViewProvider, options, contextKeyService, contextMenuService, instantiationService, filters, shouldShowAIButton, // caller responsible for updating this when it changes,
        filterStartVisiblitity) {
            super(container, contextViewProvider, options, contextKeyService);
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.filters = filters;
            this._filterChecked = false;
            this._onDidChangeAIToggle = this._register(new event_1.Emitter());
            this.onDidChangeAIToggle = this._onDidChangeAIToggle.event;
            this.shouldNotebookFilterBeVisible = false; // followed, but overriden by the whether aiToggle is visible
            this._findFilter = this._register(new notebookFindReplaceWidget_1.NotebookFindInputFilterButton(filters, contextMenuService, instantiationService, options, nls.localize('searchFindInputNotebookFilter.label', "Notebook Find Filters")));
            this._aiButton = this._register(new AIToggle({
                appendTitle: '',
                isChecked: false,
                ...options.toggleStyles
            }));
            this.setAdditionalToggles([this._aiButton]);
            this._updatePadding();
            this.controls.appendChild(this._findFilter.container);
            this._findFilter.container.classList.add('monaco-custom-toggle');
            this.filterVisible = filterStartVisiblitity;
            // ensure that ai button is visible if it should be
            this.sparkleVisible = shouldShowAIButton;
            this._register(this._aiButton.onChange(() => {
                if (this.regex) {
                    this.regex.visible = !this._aiButton.checked;
                }
                if (this.wholeWords) {
                    this.wholeWords.visible = !this._aiButton.checked;
                }
                if (this.caseSensitive) {
                    this.caseSensitive.visible = !this._aiButton.checked;
                }
                if (this._aiButton.checked) {
                    this._findFilter.visible = false;
                }
                else {
                    this.filterVisible = this.shouldNotebookFilterBeVisible;
                }
                this._updatePadding();
            }));
        }
        _updatePadding() {
            this.inputBox.paddingRight =
                (this.caseSensitive?.visible ? this.caseSensitive.width() : 0) +
                    (this.wholeWords?.visible ? this.wholeWords.width() : 0) +
                    (this.regex?.visible ? this.regex.width() : 0) +
                    (this._findFilter.visible ? this._findFilter.width() : 0) +
                    (this._aiButton.visible ? this._aiButton.width() : 0);
        }
        set sparkleVisible(visible) {
            this._aiButton.visible = visible;
            this._updatePadding();
        }
        set filterVisible(visible) {
            this.shouldNotebookFilterBeVisible = visible;
            if (this._aiButton.visible && this._aiButton.checked) {
                return;
            }
            this._findFilter.visible = visible;
            this.updateFilterStyles();
            this._updatePadding();
        }
        setEnabled(enabled) {
            super.setEnabled(enabled);
            if (enabled && (!this._filterChecked || !this._findFilter.visible)) {
                this.regex?.enable();
            }
            else {
                this.regex?.disable();
            }
        }
        updateFilterStyles() {
            // filter is checked if it's in a non-default state
            this._filterChecked =
                !this.filters.markupInput ||
                    !this.filters.markupPreview ||
                    !this.filters.codeInput ||
                    !this.filters.codeOutput;
            // TODO: find a way to express that searching notebook output and markdown preview don't support regex.
            this._findFilter.applyStyles(this._filterChecked);
        }
        get isAIEnabled() {
            return this._aiButton.checked;
        }
    }
    exports.SearchFindInput = SearchFindInput;
    class AIToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.sparkle,
                title: NLS_AI_TOGGLE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                hoverDelegate: opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRmluZElucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc2VhcmNoRmluZElucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVwRSxNQUFhLGVBQWdCLFNBQVEsbURBQXNCO1FBUTFELFlBQ0MsU0FBNkIsRUFDN0IsbUJBQXlDLEVBQ3pDLE9BQTBCLEVBQzFCLGlCQUFxQyxFQUM1QixrQkFBdUMsRUFDdkMsb0JBQTJDLEVBQzNDLE9BQTRCLEVBQ3JDLGtCQUEyQixFQUFFLHdEQUF3RDtRQUNyRixzQkFBK0I7WUFFL0IsS0FBSyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQU56RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MsWUFBTyxHQUFQLE9BQU8sQ0FBcUI7WUFaOUIsbUJBQWMsR0FBWSxLQUFLLENBQUM7WUFDdkIseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVyxDQUFDLENBQUM7WUFDL0Qsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUM5RCxrQ0FBNkIsR0FBWSxLQUFLLENBQUMsQ0FBQyw2REFBNkQ7WUFjcEgsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUNoQyxJQUFJLHlEQUE2QixDQUNoQyxPQUFPLEVBQ1Asa0JBQWtCLEVBQ2xCLG9CQUFvQixFQUNwQixPQUFPLEVB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