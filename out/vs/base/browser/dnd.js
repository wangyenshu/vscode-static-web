/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/mime"], function (require, exports, dom_1, lifecycle_1, mime_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTransfers = exports.DelayedDragHandler = void 0;
    exports.applyDragImage = applyDragImage;
    /**
     * A helper that will execute a provided function when the provided HTMLElement receives
     *  dragover event for 800ms. If the drag is aborted before, the callback will not be triggered.
     */
    class DelayedDragHandler extends lifecycle_1.Disposable {
        constructor(container, callback) {
            super();
            this._register((0, dom_1.addDisposableListener)(container, 'dragover', e => {
                e.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
                if (!this.timeout) {
                    this.timeout = setTimeout(() => {
                        callback();
                        this.timeout = null;
                    }, 800);
                }
            }));
            ['dragleave', 'drop', 'dragend'].forEach(type => {
                this._register((0, dom_1.addDisposableListener)(container, type, () => {
                    this.clearDragTimeout();
                }));
            });
        }
        clearDragTimeout() {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
        }
        dispose() {
            super.dispose();
            this.clearDragTimeout();
        }
    }
    exports.DelayedDragHandler = DelayedDragHandler;
    // Common data transfers
    exports.DataTransfers = {
        /**
         * Application specific resource transfer type
         */
        RESOURCES: 'ResourceURLs',
        /**
         * Browser specific transfer type to download
         */
        DOWNLOAD_URL: 'DownloadURL',
        /**
         * Browser specific transfer type for files
         */
        FILES: 'Files',
        /**
         * Typically transfer type for copy/paste transfers.
         */
        TEXT: mime_1.Mimes.text,
        /**
         * Internal type used to pass around text/uri-list data.
         *
         * This is needed to work around https://bugs.chromium.org/p/chromium/issues/detail?id=239745.
         */
        INTERNAL_URI_LIST: 'application/vnd.code.uri-list',
    };
    function applyDragImage(event, label, clazz, backgroundColor, foregroundColor) {
        const dragImage = document.createElement('div');
        dragImage.className = clazz;
        dragImage.textContent = label;
        if (foregroundColor) {
            dragImage.style.color = foregroundColor;
        }
        if (backgroundColor) {
            dragImage.style.background = backgroundColor;
        }
        if (event.dataTransfer) {
            const ownerDocument = (0, dom_1.getWindow)(event).document;
            ownerDocument.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, -10, -10);
            // Removes the element when the DND operation is done
            setTimeout(() => ownerDocument.body.removeChild(dragImage), 0);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2RuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnRmhHLHdDQXFCQztJQS9GRDs7O09BR0c7SUFDSCxNQUFhLGtCQUFtQixTQUFRLHNCQUFVO1FBR2pELFlBQVksU0FBc0IsRUFBRSxRQUFvQjtZQUN2RCxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUMvRCxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxxSEFBcUg7Z0JBRXpJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTt3QkFDOUIsUUFBUSxFQUFFLENBQUM7d0JBRVgsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7b0JBQ3JCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDVCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtvQkFDMUQsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxnQkFBZ0I7WUFDdkIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLENBQUM7UUFDRixDQUFDO1FBRVEsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVoQixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN6QixDQUFDO0tBQ0Q7SUFyQ0QsZ0RBcUNDO0lBRUQsd0JBQXdCO0lBQ1gsUUFBQSxhQUFhLEdBQUc7UUFFNUI7O1dBRUc7UUFDSCxTQUFTLEVBQUUsY0FBYztRQUV6Qjs7V0FFRztRQUNILFlBQVksRUFBRSxhQUFhO1FBRTNCOztXQUVHO1FBQ0gsS0FBSyxFQUFFLE9BQU87UUFFZDs7V0FFRztRQUNILElBQUksRUFBRSxZQUFLLENBQUMsSUFBSTtRQUVoQjs7OztXQUlHO1FBQ0gsaUJBQWlCLEVBQUUsK0JBQStCO0tBQ2xELENBQUM7SUFFRixTQUFnQixjQUFjLENBQUMsS0FBZ0IsRUFBRSxLQUFvQixFQUFFLEtBQWEsRUFBRSxlQUErQixFQUFFLGVBQStCO1FBQ3JKLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEQsU0FBUyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDNUIsU0FBUyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFFOUIsSUFBSSxlQUFlLEVBQUUsQ0FBQztZQUNyQixTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxlQUFlLENBQUM7UUFDekMsQ0FBQztRQUVELElBQUksZUFBZSxFQUFFLENBQUM7WUFDckIsU0FBUyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsZUFBZSxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFJLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN4QixNQUFNLGFBQWEsR0FBRyxJQUFBLGVBQVMsRUFBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDaEQsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDMUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFckQscURBQXFEO1lBQ3JELFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoRSxDQUFDO0lBQ0YsQ0FBQyJ9