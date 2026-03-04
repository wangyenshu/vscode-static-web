/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RowCache = void 0;
    function removeFromParent(element) {
        try {
            element.parentElement?.removeChild(element);
        }
        catch (e) {
            // this will throw if this happens due to a blur event, nasty business
        }
    }
    class RowCache {
        constructor(renderers) {
            this.renderers = renderers;
            this.cache = new Map();
            this.transactionNodesPendingRemoval = new Set();
            this.inTransaction = false;
        }
        /**
         * Returns a row either by creating a new one or reusing
         * a previously released row which shares the same templateId.
         *
         * @returns A row and `isReusingConnectedDomNode` if the row's node is already in the dom in a stale position.
         */
        alloc(templateId) {
            let result = this.getTemplateCache(templateId).pop();
            let isStale = false;
            if (result) {
                isStale = this.transactionNodesPendingRemoval.has(result.domNode);
                if (isStale) {
                    this.transactionNodesPendingRemoval.delete(result.domNode);
                }
            }
            else {
                const domNode = (0, dom_1.$)('.monaco-list-row');
                const renderer = this.getRenderer(templateId);
                const templateData = renderer.renderTemplate(domNode);
                result = { domNode, templateId, templateData };
            }
            return { row: result, isReusingConnectedDomNode: isStale };
        }
        /**
         * Releases the row for eventual reuse.
         */
        release(row) {
            if (!row) {
                return;
            }
            this.releaseRow(row);
        }
        /**
         * Begin a set of changes that use the cache. This lets us skip work when a row is removed and then inserted again.
         */
        transact(makeChanges) {
            if (this.inTransaction) {
                throw new Error('Already in transaction');
            }
            this.inTransaction = true;
            try {
                makeChanges();
            }
            finally {
                for (const domNode of this.transactionNodesPendingRemoval) {
                    this.doRemoveNode(domNode);
                }
                this.transactionNodesPendingRemoval.clear();
                this.inTransaction = false;
            }
        }
        releaseRow(row) {
            const { domNode, templateId } = row;
            if (domNode) {
                if (this.inTransaction) {
                    this.transactionNodesPendingRemoval.add(domNode);
                }
                else {
                    this.doRemoveNode(domNode);
                }
            }
            const cache = this.getTemplateCache(templateId);
            cache.push(row);
        }
        doRemoveNode(domNode) {
            domNode.classList.remove('scrolling');
            removeFromParent(domNode);
        }
        getTemplateCache(templateId) {
            let result = this.cache.get(templateId);
            if (!result) {
                result = [];
                this.cache.set(templateId, result);
            }
            return result;
        }
        dispose() {
            this.cache.forEach((cachedRows, templateId) => {
                for (const cachedRow of cachedRows) {
                    const renderer = this.getRenderer(templateId);
                    renderer.disposeTemplate(cachedRow.templateData);
                    cachedRow.templateData = null;
                }
            });
            this.cache.clear();
            this.transactionNodesPendingRemoval.clear();
        }
        getRenderer(templateId) {
            const renderer = this.renderers.get(templateId);
            if (!renderer) {
                throw new Error(`No renderer found for ${templateId}`);
            }
            return renderer;
        }
    }
    exports.RowCache = RowCache;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93Q2FjaGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvbGlzdC9yb3dDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFvQjtRQUM3QyxJQUFJLENBQUM7WUFDSixPQUFPLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNaLHNFQUFzRTtRQUN2RSxDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQWEsUUFBUTtRQU9wQixZQUFvQixTQUE2QztZQUE3QyxjQUFTLEdBQVQsU0FBUyxDQUFvQztZQUx6RCxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFFekIsbUNBQThCLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQztZQUNqRSxrQkFBYSxHQUFHLEtBQUssQ0FBQztRQUV1QyxDQUFDO1FBRXRFOzs7OztXQUtHO1FBQ0gsS0FBSyxDQUFDLFVBQWtCO1lBQ3ZCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUVyRCxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWixPQUFPLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xFLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsSUFBSSxDQUFDLDhCQUE4QixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzVELENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxPQUFPLEdBQUcsSUFBQSxPQUFDLEVBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFDdEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxHQUFHLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsQ0FBQztZQUNoRCxDQUFDO1lBRUQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUseUJBQXlCLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDNUQsQ0FBQztRQUVEOztXQUVHO1FBQ0gsT0FBTyxDQUFDLEdBQVM7WUFDaEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNWLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxRQUFRLENBQUMsV0FBdUI7WUFDL0IsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFFMUIsSUFBSSxDQUFDO2dCQUNKLFdBQVcsRUFBRSxDQUFDO1lBQ2YsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7b0JBQzNELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzVCLENBQUM7Z0JBRUQsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztZQUM1QixDQUFDO1FBQ0YsQ0FBQztRQUVPLFVBQVUsQ0FBQyxHQUFTO1lBQzNCLE1BQU0sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsR0FBRyxDQUFDO1lBQ3BDLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3hCLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoRCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLENBQUM7UUFFTyxZQUFZLENBQUMsT0FBb0I7WUFDeEMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdEMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVPLGdCQUFnQixDQUFDLFVBQWtCO1lBQzFDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXhDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNwQyxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxFQUFFO2dCQUM3QyxLQUFLLE1BQU0sU0FBUyxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUM5QyxRQUFRLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDakQsU0FBUyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzdDLENBQUM7UUFFTyxXQUFXLENBQUMsVUFBa0I7WUFDckMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQXJIRCw0QkFxSEMifQ==