/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/htmlContent", "vs/base/common/types", "vs/nls"], function (require, exports, cancellation_1, htmlContent_1, types_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UpdatableHoverWidget = void 0;
    class UpdatableHoverWidget {
        constructor(hoverDelegate, target, fadeInAnimation) {
            this.hoverDelegate = hoverDelegate;
            this.target = target;
            this.fadeInAnimation = fadeInAnimation;
        }
        async update(content, focus, options) {
            if (this._cancellationTokenSource) {
                // there's an computation ongoing, cancel it
                this._cancellationTokenSource.dispose(true);
                this._cancellationTokenSource = undefined;
            }
            if (this.isDisposed) {
                return;
            }
            let resolvedContent;
            if (content === undefined || (0, types_1.isString)(content) || content instanceof HTMLElement) {
                resolvedContent = content;
            }
            else if (!(0, types_1.isFunction)(content.markdown)) {
                resolvedContent = content.markdown ?? content.markdownNotSupportedFallback;
            }
            else {
                // compute the content, potentially long-running
                // show 'Loading' if no hover is up yet
                if (!this._hoverWidget) {
                    this.show((0, nls_1.localize)('iconLabel.loading', "Loading..."), focus);
                }
                // compute the content
                this._cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                const token = this._cancellationTokenSource.token;
                resolvedContent = await content.markdown(token);
                if (resolvedContent === undefined) {
                    resolvedContent = content.markdownNotSupportedFallback;
                }
                if (this.isDisposed || token.isCancellationRequested) {
                    // either the widget has been closed in the meantime
                    // or there has been a new call to `update`
                    return;
                }
            }
            this.show(resolvedContent, focus, options);
        }
        show(content, focus, options) {
            const oldHoverWidget = this._hoverWidget;
            if (this.hasContent(content)) {
                const hoverOptions = {
                    content,
                    target: this.target,
                    appearance: {
                        showPointer: this.hoverDelegate.placement === 'element',
                        skipFadeInAnimation: !this.fadeInAnimation || !!oldHoverWidget, // do not fade in if the hover is already showing
                    },
                    position: {
                        hoverPosition: 2 /* HoverPosition.BELOW */,
                    },
                    ...options
                };
                this._hoverWidget = this.hoverDelegate.showHover(hoverOptions, focus);
            }
            oldHoverWidget?.dispose();
        }
        hasContent(content) {
            if (!content) {
                return false;
            }
            if ((0, htmlContent_1.isMarkdownString)(content)) {
                return !!content.value;
            }
            return true;
        }
        get isDisposed() {
            return this._hoverWidget?.isDisposed;
        }
        dispose() {
            this._hoverWidget?.dispose();
            this._cancellationTokenSource?.dispose(true);
            this._cancellationTokenSource = undefined;
        }
    }
    exports.UpdatableHoverWidget = UpdatableHoverWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRhYmxlSG92ZXJXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9zZXJ2aWNlcy9ob3ZlclNlcnZpY2UvdXBkYXRhYmxlSG92ZXJXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEsb0JBQW9CO1FBS2hDLFlBQW9CLGFBQTZCLEVBQVUsTUFBMEMsRUFBVSxlQUF3QjtZQUFuSCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFvQztZQUFVLG9CQUFlLEdBQWYsZUFBZSxDQUFTO1FBQ3ZJLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQStCLEVBQUUsS0FBZSxFQUFFLE9BQWdDO1lBQzlGLElBQUksSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ25DLDRDQUE0QztnQkFDNUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLFNBQVMsQ0FBQztZQUMzQyxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxlQUFlLENBQUM7WUFDcEIsSUFBSSxPQUFPLEtBQUssU0FBUyxJQUFJLElBQUEsZ0JBQVEsRUFBQyxPQUFPLENBQUMsSUFBSSxPQUFPLFlBQVksV0FBVyxFQUFFLENBQUM7Z0JBQ2xGLGVBQWUsR0FBRyxPQUFPLENBQUM7WUFDM0IsQ0FBQztpQkFBTSxJQUFJLENBQUMsSUFBQSxrQkFBVSxFQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxlQUFlLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxP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