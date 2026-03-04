/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./ast"], function (require, exports, ast_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.concat23Trees = concat23Trees;
    exports.concat23TreesOfSameHeight = concat23TreesOfSameHeight;
    /**
     * Concatenates a list of (2,3) AstNode's into a single (2,3) AstNode.
     * This mutates the items of the input array!
     * If all items have the same height, this method has runtime O(items.length).
     * Otherwise, it has runtime O(items.length * max(log(items.length), items.max(i => i.height))).
    */
    function concat23Trees(items) {
        if (items.length === 0) {
            return null;
        }
        if (items.length === 1) {
            return items[0];
        }
        let i = 0;
        /**
         * Reads nodes of same height and concatenates them to a single node.
        */
        function readNode() {
            if (i >= items.length) {
                return null;
            }
            const start = i;
            const height = items[start].listHeight;
            i++;
            while (i < items.length && items[i].listHeight === height) {
                i++;
            }
            if (i - start >= 2) {
                return concat23TreesOfSameHeight(start === 0 && i === items.length ? items : items.slice(start, i), false);
            }
            else {
                return items[start];
            }
        }
        // The items might not have the same height.
        // We merge all items by using a binary concat operator.
        let first = readNode(); // There must be a first item
        let second = readNode();
        if (!second) {
            return first;
        }
        for (let item = readNode(); item; item = readNode()) {
            // Prefer concatenating smaller trees, as the runtime of concat depends on the tree height.
            if (heightDiff(first, second) <= heightDiff(second, item)) {
                first = concat(first, second);
                second = item;
            }
            else {
                second = concat(second, item);
            }
        }
        const result = concat(first, second);
        return result;
    }
    function concat23TreesOfSameHeight(items, createImmutableLists = false) {
        if (items.length === 0) {
            return null;
        }
        if (items.length === 1) {
            return items[0];
        }
        let length = items.length;
        // All trees have same height, just create parent nodes.
        while (length > 3) {
            const newLength = length >> 1;
            for (let i = 0; i < newLength; i++) {
                const j = i << 1;
                items[i] = ast_1.ListAstNode.create23(items[j], items[j + 1], j + 3 === length ? items[j + 2] : null, createImmutableLists);
            }
            length = newLength;
        }
        return ast_1.ListAstNode.create23(items[0], items[1], length >= 3 ? items[2] : null, createImmutableLists);
    }
    function heightDiff(node1, node2) {
        return Math.abs(node1.listHeight - node2.listHeight);
    }
    function concat(node1, node2) {
        if (node1.listHeight === node2.listHeight) {
            return ast_1.ListAstNode.create23(node1, node2, null, false);
        }
        else if (node1.listHeight > node2.listHeight) {
            // node1 is the tree we want to insert into
            return append(node1, node2);
        }
        else {
            return prepend(node2, node1);
        }
    }
    /**
     * Appends the given node to the end of this (2,3) tree.
     * Returns the new root.
    */
    function append(list, nodeToAppend) {
        list = list.toMutable();
        let curNode = list;
        const parents = [];
        let nodeToAppendOfCorrectHeight;
        while (true) {
            // assert nodeToInsert.listHeight <= curNode.listHeight
            if (nodeToAppend.listHeight === curNode.listHeight) {
                nodeToAppendOfCorrectHeight = nodeToAppend;
                break;
            }
            // assert 0 <= nodeToInsert.listHeight < curNode.listHeight
            if (curNode.kind !== 4 /* AstNodeKind.List */) {
                throw new Error('unexpected');
            }
            parents.push(curNode);
            // assert 2 <= curNode.childrenLength <= 3
            curNode = curNode.makeLastElementMutable();
        }
        // assert nodeToAppendOfCorrectHeight!.listHeight === curNode.listHeight
        for (let i = parents.length - 1; i >= 0; i--) {
            const parent = parents[i];
            if (nodeToAppendOfCorrectHeight) {
                // Can we take the element?
                if (parent.childrenLength >= 3) {
                    // assert parent.childrenLength === 3 && parent.listHeight === nodeToAppendOfCorrectHeight.listHeight + 1
                    // we need to split to maintain (2,3)-tree property.
                    // Send the third element + the new element to the parent.
                    nodeToAppendOfCorrectHeight = ast_1.ListAstNode.create23(parent.unappendChild(), nodeToAppendOfCorrectHeight, null, false);
                }
                else {
                    parent.appendChildOfSameHeight(nodeToAppendOfCorrectHeight);
                    nodeToAppendOfCorrectHeight = undefined;
                }
            }
            else {
                parent.handleChildrenChanged();
            }
        }
        if (nodeToAppendOfCorrectHeight) {
            return ast_1.ListAstNode.create23(list, nodeToAppendOfCorrectHeight, null, false);
        }
        else {
            return list;
        }
    }
    /**
     * Prepends the given node to the end of this (2,3) tree.
     * Returns the new root.
    */
    function prepend(list, nodeToAppend) {
        list = list.toMutable();
        let curNode = list;
        const parents = [];
        // assert nodeToInsert.listHeight <= curNode.listHeight
        while (nodeToAppend.listHeight !== curNode.listHeight) {
            // assert 0 <= nodeToInsert.listHeight < curNode.listHeight
            if (curNode.kind !== 4 /* AstNodeKind.List */) {
                throw new Error('unexpected');
            }
            parents.push(curNode);
            // assert 2 <= curNode.childrenFast.length <= 3
            curNode = curNode.makeFirstElementMutable();
        }
        let nodeToPrependOfCorrectHeight = nodeToAppend;
        // assert nodeToAppendOfCorrectHeight!.listHeight === curNode.listHeight
        for (let i = parents.length - 1; i >= 0; i--) {
            const parent = parents[i];
            if (nodeToPrependOfCorrectHeight) {
                // Can we take the element?
                if (parent.childrenLength >= 3) {
                    // assert parent.childrenLength === 3 && parent.listHeight === nodeToAppendOfCorrectHeight.listHeight + 1
                    // we need to split to maintain (2,3)-tree property.
                    // Send the third element + the new element to the parent.
                    nodeToPrependOfCorrectHeight = ast_1.ListAstNode.create23(nodeToPrependOfCorrectHeight, parent.unprependChild(), null, false);
                }
                else {
                    parent.prependChildOfSameHeight(nodeToPrependOfCorrectHeight);
                    nodeToPrependOfCorrectHeight = undefined;
                }
            }
            else {
                parent.handleChildrenChanged();
            }
        }
        if (nodeToPrependOfCorrectHeight) {
            return ast_1.ListAstNode.create23(nodeToPrependOfCorrectHeight, list, null, false);
        }
        else {
            return list;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uY2F0MjNUcmVlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJzVGV4dE1vZGVsUGFydC9icmFja2V0UGFpcnNUcmVlL2NvbmNhdDIzVHJlZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsc0NBbURDO0lBRUQsOERBbUJDO0lBOUVEOzs7OztNQUtFO0lBQ0YsU0FBZ0IsYUFBYSxDQUFDLEtBQWdCO1FBQzdDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN4QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDeEIsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWOztVQUVFO1FBQ0YsU0FBUyxRQUFRO1lBQ2hCLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFFdkMsQ0FBQyxFQUFFLENBQUM7WUFDSixPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQzNELENBQUMsRUFBRSxDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFD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