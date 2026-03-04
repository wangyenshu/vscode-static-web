/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./length"], function (require, exports, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeReader = void 0;
    /**
     * Allows to efficiently find a longest child at a given offset in a fixed node.
     * The requested offsets must increase monotonously.
    */
    class NodeReader {
        constructor(node) {
            this.lastOffset = length_1.lengthZero;
            this.nextNodes = [node];
            this.offsets = [length_1.lengthZero];
            this.idxs = [];
        }
        /**
         * Returns the longest node at `offset` that satisfies the predicate.
         * @param offset must be greater than or equal to the last offset this method has been called with!
        */
        readLongestNodeAt(offset, predicate) {
            if ((0, length_1.lengthLessThan)(offset, this.lastOffset)) {
                throw new Error('Invalid offset');
            }
            this.lastOffset = offset;
            // Find the longest node of all those that are closest to the current offset.
            while (true) {
                const curNode = lastOrUndefined(this.nextNodes);
                if (!curNode) {
                    return undefined;
                }
                const curNodeOffset = lastOrUndefined(this.offsets);
                if ((0, length_1.lengthLessThan)(offset, curNodeOffset)) {
                    // The next best node is not here yet.
                    // The reader must advance before a cached node is hit.
                    return undefined;
                }
                if ((0, length_1.lengthLessThan)(curNodeOffset, offset)) {
                    // The reader is ahead of the current node.
                    if ((0, length_1.lengthAdd)(curNodeOffset, curNode.length) <= offset) {
                        // The reader is after the end of the current node.
                        this.nextNodeAfterCurrent();
                    }
                    else {
                        // The reader is somewhere in the current node.
                        const nextChildIdx = getNextChildIdx(curNode);
                        if (nextChildIdx !== -1) {
                            // Go to the first child and repeat.
                            this.nextNodes.push(curNode.getChild(nextChildIdx));
                            this.offsets.push(curNodeOffset);
                            this.idxs.push(nextChildIdx);
                        }
                        else {
                            // We don't have children
                            this.nextNodeAfterCurrent();
                        }
                    }
                }
                else {
                    // readerOffsetBeforeChange === curNodeOffset
                    if (predicate(curNode)) {
                        this.nextNodeAfterCurrent();
                        return curNode;
                    }
                    else {
                        const nextChildIdx = getNextChildIdx(curNode);
                        // look for shorter node
                        if (nextChildIdx === -1) {
                            // There is no shorter node.
                            this.nextNodeAfterCurrent();
                            return undefined;
                        }
                        else {
                            // Descend into first child & repeat.
                            this.nextNodes.push(curNode.getChild(nextChildIdx));
                            this.offsets.push(curNodeOffset);
                            this.idxs.push(nextChildIdx);
                        }
                    }
                }
            }
        }
        // Navigates to the longest node that continues after the current node.
        nextNodeAfterCurrent() {
            while (true) {
                const currentOffset = lastOrUndefined(this.offsets);
                const currentNode = lastOrUndefined(this.nextNodes);
                this.nextNodes.pop();
                this.offsets.pop();
                if (this.idxs.length === 0) {
                    // We just popped the root node, there is no next node.
                    break;
                }
                // Parent is not undefined, because idxs is not empty
                const parent = lastOrUndefined(this.nextNodes);
                const nextChildIdx = getNextChildIdx(parent, this.idxs[this.idxs.length - 1]);
                if (nextChildIdx !== -1) {
                    this.nextNodes.push(parent.getChild(nextChildIdx));
                    this.offsets.push((0, length_1.lengthAdd)(currentOffset, currentNode.length));
                    this.idxs[this.idxs.length - 1] = nextChildIdx;
                    break;
                }
                else {
                    this.idxs.pop();
                }
                // We fully consumed the parent.
                // Current node is now parent, so call nextNodeAfterCurrent again
            }
        }
    }
    exports.NodeReader = NodeReader;
    function getNextChildIdx(node, curIdx = -1) {
        while (true) {
            curIdx++;
            if (curIdx >= node.childrenLength) {
                return -1;
            }
            if (node.getChild(curIdx)) {
                return curIdx;
            }
        }
    }
    function lastOrUndefined(arr) {
        return arr.length > 0 ? arr[arr.length - 1] : undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZVJlYWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJzVGV4dE1vZGVsUGFydC9icmFja2V0UGFpcnNUcmVlL25vZGVSZWFkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHOzs7TUFHRTtJQUNGLE1BQWEsVUFBVTtRQU10QixZQUFZLElBQWE7WUFGakIsZUFBVSxHQUFXLG1CQUFVLENBQUM7WUFHdkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxtQkFBVSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVEOzs7VUFHRTtRQUNGLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxTQUFxQztZQUN0RSxJQUFJLElBQUEsdUJBQWMsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7WUFFekIsNkVBQTZFO1lBQzdFLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFFaEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNkLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFFLENBQUM7Z0JBRXJELElBQUksSUFBQSx1QkFBYyxF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