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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/themables", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/platform/instantiation/common/instantiation", "vs/css!./inlineProgressWidget"], function (require, exports, dom, async_1, codicons_1, lifecycle_1, strings_1, themables_1, range_1, textModel_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineProgressManager = void 0;
    const inlineProgressDecoration = textModel_1.ModelDecorationOptions.register({
        description: 'inline-progress-widget',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        showIfCollapsed: true,
        after: {
            content: strings_1.noBreakWhitespace,
            inlineClassName: 'inline-editor-progress-decoration',
            inlineClassNameAffectsLetterSpacing: true,
        }
    });
    class InlineProgressWidget extends lifecycle_1.Disposable {
        static { this.baseId = 'editor.widget.inlineProgressWidget'; }
        constructor(typeId, editor, range, title, delegate) {
            super();
            this.typeId = typeId;
            this.editor = editor;
            this.range = range;
            this.delegate = delegate;
            this.allowEditorOverflow = false;
            this.suppressMouseDown = true;
            this.create(title);
            this.editor.addContentWidget(this);
            this.editor.layoutContentWidget(this);
        }
        create(title) {
            this.domNode = dom.$('.inline-progress-widget');
            this.domNode.role = 'button';
            this.domNode.title = title;
            const iconElement = dom.$('span.icon');
            this.domNode.append(iconElement);
            iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), 'codicon-modifier-spin');
            const updateSize = () => {
                const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
                this.domNode.style.height = `${lineHeight}px`;
                this.domNode.style.width = `${Math.ceil(0.8 * lineHeight)}px`;
            };
            updateSize();
            this._register(this.editor.onDidChangeConfiguration(c => {
                if (c.hasChanged(52 /* EditorOption.fontSize */) || c.hasChanged(67 /* EditorOption.lineHeight */)) {
                    updateSize();
                }
            }));
            this._register(dom.addDisposableListener(this.domNode, dom.EventType.CLICK, e => {
                this.delegate.cancel();
            }));
        }
        getId() {
            return InlineProgressWidget.baseId + '.' + this.typeId;
        }
        getDomNode() {
            return this.domNode;
        }
        getPosition() {
            return {
                position: { lineNumber: this.range.startLineNumber, column: this.range.startColumn },
                preference: [0 /* ContentWidgetPositionPreference.EXACT */]
            };
        }
        dispose() {
            super.dispose();
            this.editor.removeContentWidget(this);
        }
    }
    let InlineProgressManager = class InlineProgressManager extends lifecycle_1.Disposable {
        constructor(id, _editor, _instantiationService) {
            super();
            this.id = id;
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            /** Delay before showing the progress widget */
            this._showDelay = 500; // ms
            this._showPromise = this._register(new lifecycle_1.MutableDisposable());
            this._currentWidget = new lifecycle_1.MutableDisposable();
            this._operationIdPool = 0;
            this._currentDecorations = _editor.createDecorationsCollection();
        }
        async showWhile(position, title, promise) {
            const operationId = this._operationIdPool++;
            this._currentOperation = operationId;
            this.clear();
            this._showPromise.value = (0, async_1.disposableTimeout)(() => {
                const range = range_1.Range.fromPositions(position);
                const decorationIds = this._currentDecorations.set([{
                        range: range,
                        options: inlineProgressDecoration,
                    }]);
                if (decorationIds.length > 0) {
                    this._currentWidget.value = this._instantiationService.createInstance(InlineProgressWidget, this.id, this._editor, range, title, promise);
                }
            }, this._showDelay);
            try {
                return await promise;
            }
            finally {
                if (this._currentOperation === operationId) {
                    this.clear();
                    this._currentOperation = undefined;
                }
            }
        }
        clear() {
            this._showPromise.clear();
            this._currentDecorations.clear();
            this._currentWidget.clear();
        }
    };
    exports.InlineProgressManager = InlineProgressManager;
    exports.InlineProgressManager = InlineProgressManager = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], InlineProgressManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lUHJvZ3Jlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVQcm9ncmVzcy9icm93c2VyL2lubGluZVByb2dyZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCaEcsTUFBTSx3QkFBd0IsR0FBRyxrQ0FBc0IsQ0FBQyxRQUFRLENBQUM7UUFDaEUsV0FBVyxFQUFFLHdCQUF3QjtRQUNyQyxVQUFVLDREQUFvRDtRQUM5RCxlQUFlLEVBQUUsSUFBSTtRQUNyQixLQUFLLEVBQUU7WUFDTixPQUFPLEVBQUUsMkJBQWlCO1lBQzFCLGVBQWUsRUFBRSxtQ0FBbUM7WUFDcEQsbUNBQW1DLEVBQUUsSUFBSTtTQUN6QztLQUNELENBQUMsQ0FBQztJQUdILE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7aUJBQ3BCLFdBQU0sR0FBRyxvQ0FBb0MsQUFBdkMsQ0FBd0M7UUFPdEUsWUFDa0IsTUFBYyxFQUNkLE1BQW1CLEVBQ25CLEtBQVksRUFDN0IsS0FBYSxFQUNJLFFBQWdDO1lBRWpELEtBQUssRUFBRSxDQUFDO1lBTlMsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNkLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDbkIsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUVaLGFBQVEsR0FBUixRQUFRLENBQXdCO1lBVmxELHdCQUFtQixHQUFHLEtBQUssQ0FBQztZQUM1QixzQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFheEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVuQixJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENB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