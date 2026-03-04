/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, DOM) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderText = renderText;
    exports.renderFormattedText = renderFormattedText;
    exports.createElement = createElement;
    function renderText(text, options = {}) {
        const element = createElement(options);
        element.textContent = text;
        return element;
    }
    function renderFormattedText(formattedText, options = {}) {
        const element = createElement(options);
        _renderFormattedText(element, parseFormattedText(formattedText, !!options.renderCodeSegments), options.actionHandler, options.renderCodeSegments);
        return element;
    }
    function createElement(options) {
        const tagName = options.inline ? 'span' : 'div';
        const element = document.createElement(tagName);
        if (options.className) {
            element.className = options.className;
        }
        return element;
    }
    class StringStream {
        constructor(source) {
            this.source = source;
            this.index = 0;
        }
        eos() {
            return this.index >= this.source.length;
        }
        next() {
            const next = this.peek();
            this.advance();
            return next;
        }
        peek() {
            return this.source[this.index];
        }
        advance() {
            this.index++;
        }
    }
    var FormatType;
    (function (FormatType) {
        FormatType[FormatType["Invalid"] = 0] = "Invalid";
        FormatType[FormatType["Root"] = 1] = "Root";
        FormatType[FormatType["Text"] = 2] = "Text";
        FormatType[FormatType["Bold"] = 3] = "Bold";
        FormatType[FormatType["Italics"] = 4] = "Italics";
        FormatType[FormatType["Action"] = 5] = "Action";
        FormatType[FormatType["ActionClose"] = 6] = "ActionClose";
        FormatType[FormatType["Code"] = 7] = "Code";
        FormatType[FormatType["NewLine"] = 8] = "NewLine";
    })(FormatType || (FormatType = {}));
    function _renderFormattedText(element, treeNode, actionHandler, renderCodeSegments) {
        let child;
        if (treeNode.type === 2 /* FormatType.Text */) {
            child = document.createTextNode(treeNode.content || '');
        }
        else if (treeNode.type === 3 /* FormatType.Bold */) {
            child = document.createElement('b');
        }
        else if (treeNode.type === 4 /* FormatType.Italics */) {
            child = document.createElement('i');
        }
        else if (treeNode.type === 7 /* FormatType.Code */ && renderCodeSegments) {
            child = document.createElement('code');
        }
        else if (treeNode.type === 5 /* FormatType.Action */ && actionHandler) {
            const a = document.createElement('a');
            actionHandler.disposables.add(DOM.addStandardDisposableListener(a, 'click', (event) => {
                actionHandler.callback(String(treeNode.index), event);
            }));
            child = a;
        }
        else if (treeNode.type === 8 /* FormatType.NewLine */) {
            child = document.createElement('br');
        }
        else if (treeNode.type === 1 /* FormatType.Root */) {
            child = element;
        }
        if (child && element !== child) {
            element.appendChild(child);
        }
        if (child && Array.isArray(treeNode.children)) {
            treeNode.children.forEach((nodeChild) => {
                _renderFormattedText(child, nodeChild, actionHandler, renderCodeSegments);
            });
        }
    }
    function parseFormattedText(content, parseCodeSegments) {
        const root = {
            type: 1 /* FormatType.Root */,
            children: []
        };
        let actionViewItemIndex = 0;
        let current = root;
        const stack = [];
        const stream = new StringStream(content);
        while (!stream.eos()) {
            let next = stream.next();
            const isEscapedFormatType = (next === '\\' && formatTagType(stream.peek(), parseCodeSegments) !== 0 /* FormatType.Invalid */);
            if (isEscapedFormatType) {
                next = stream.next(); // unread the backslash if it escapes a format tag type
            }
            if (!isEscapedFormatType && isFormatTag(next, parseCodeSegments) && next === stream.peek()) {
                stream.advance();
                if (current.type === 2 /* FormatType.Text */) {
                    current = stack.pop();
                }
                const type = formatTagType(next, parseCodeSegments);
                if (current.type === type || (current.type === 5 /* FormatType.Action */ && type === 6 /* FormatType.ActionClose */)) {
                    current = stack.pop();
                }
                else {
                    const newCurrent = {
                        type: type,
                        children: []
                    };
                    if (type === 5 /* FormatType.Action */) {
                        newCurrent.index = actionViewItemIndex;
                        actionViewItemIndex++;
                    }
                    current.children.push(newCurrent);
                    stack.push(current);
                    current = newCurrent;
                }
            }
            else if (next === '\n') {
                if (current.type === 2 /* FormatType.Text */) {
                    current = stack.pop();
                }
                current.children.push({
                    type: 8 /* FormatType.NewLine */
                });
            }
            else {
                if (current.type !== 2 /* FormatType.Text */) {
                    const textCurrent = {
                        type: 2 /* FormatType.Text */,
                        content: next
                    };
                    current.children.push(textCurrent);
                    stack.push(current);
                    current = textCurrent;
                }
                else {
                    current.content += next;
                }
            }
        }
        if (current.type === 2 /* FormatType.Text */) {
            current = stack.pop();
        }
        if (stack.length) {
            // incorrectly formatted string literal
        }
        return root;
    }
    function isFormatTag(char, supportCodeSegments) {
        return formatTagType(char, supportCodeSegments) !== 0 /* FormatType.Invalid */;
    }
    function formatTagType(char, supportCodeSegments) {
        switch (char) {
            case '*':
                return 3 /* FormatType.Bold */;
            case '_':
                return 4 /* FormatType.Italics */;
            case '[':
                return 5 /* FormatType.Action */;
            case ']':
                return 6 /* FormatType.ActionClose */;
            case '`':
                return supportCodeSegments ? 7 /* FormatType.Code */ : 0 /* FormatType.Invalid */;
            default:
                return 0 /* FormatType.Invalid */;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGVkVGV4dFJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2Zvcm1hdHRlZFRleHRSZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW1CaEcsZ0NBSUM7SUFFRCxrREFJQztJQUVELHNDQU9DO0lBbkJELFNBQWdCLFVBQVUsQ0FBQyxJQUFZLEVBQUUsVUFBc0MsRUFBRTtRQUNoRixNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDM0IsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQWdCLG1CQUFtQixDQUFDLGFBQXFCLEVBQUUsVUFBc0MsRUFBRTtRQUNsRyxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNsSixPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDO0lBRUQsU0FBZ0IsYUFBYSxDQUFDLE9BQW1DO1FBQ2hFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ2hELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEQsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLFNBQVMsR0FBRyxPQUFPLENB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