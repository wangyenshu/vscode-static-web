/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/browser/trustedTypes", "vs/base/common/errors", "vs/editor/common/core/stringBuilder"], function (require, exports, fastDomNode_1, trustedTypes_1, errors_1, stringBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VisibleLinesCollection = exports.RenderedLinesCollection = void 0;
    class RenderedLinesCollection {
        constructor(createLine) {
            this._createLine = createLine;
            this._set(1, []);
        }
        flush() {
            this._set(1, []);
        }
        _set(rendLineNumberStart, lines) {
            this._lines = lines;
            this._rendLineNumberStart = rendLineNumberStart;
        }
        _get() {
            return {
                rendLineNumberStart: this._rendLineNumberStart,
                lines: this._lines
            };
        }
        /**
         * @returns Inclusive line number that is inside this collection
         */
        getStartLineNumber() {
            return this._rendLineNumberStart;
        }
        /**
         * @returns Inclusive line number that is inside this collection
         */
        getEndLineNumber() {
            return this._rendLineNumberStart + this._lines.length - 1;
        }
        getCount() {
            return this._lines.length;
        }
        getLine(lineNumber) {
            const lineIndex = lineNumber - this._rendLineNumberStart;
            if (lineIndex < 0 || lineIndex >= this._lines.length) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
            return this._lines[lineIndex];
        }
        /**
         * @returns Lines that were removed from this collection
         */
        onLinesDeleted(deleteFromLineNumber, deleteToLineNumber) {
            if (this.getCount() === 0) {
                // no lines
                return null;
            }
            const startLineNumber = this.getStartLineNumber();
            const endLineNumber = this.getEndLineNumber();
            if (deleteToLineNumber < startLineNumber) {
                // deleting above the viewport
                const deleteCnt = deleteToLineNumber - deleteFromLineNumber + 1;
                this._rendLineNumberStart -= deleteCnt;
                return null;
            }
            if (deleteFromLineNumber > endLineNumber) {
                // deleted below the viewport
                return null;
            }
            // Record what needs to be deleted
            let deleteStartIndex = 0;
            let deleteCount = 0;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineIndex = lineNumber - this._rendLineNumberStart;
                if (deleteFromLineNumber <= lineNumber && lineNumber <= deleteToLineNumber) {
                    // this is a line to be deleted
                    if (deleteCount === 0) {
                        // this is the first line to be deleted
                        deleteStartIndex = lineIndex;
                        deleteCount = 1;
                    }
                    else {
                        deleteCount++;
                    }
                }
            }
            // Adjust this._rendLineNumberStart for lines deleted above
            if (deleteFromLineNumber < startLineNumber) {
                // Something was deleted above
                let deleteAboveCount = 0;
                if (deleteToLineNumber < startLineNumber) {
                    // the entire deleted lines are above
                    deleteAboveCount = deleteToLineNumber - deleteFromLineNumber + 1;
                }
                else {
                    deleteAboveCount = startLineNumber - deleteFromLineNumber;
                }
                this._rendLineNumberStart -= deleteAboveCount;
            }
            const deleted = this._lines.splice(deleteStartIndex, deleteCount);
            return deleted;
        }
        onLinesChanged(changeFromLineNumber, changeCount) {
            const changeToLineNumber = changeFromLineNumber + changeCount - 1;
            if (this.getCount() === 0) {
                // no lines
                return false;
            }
            const startLineNumber = this.getStartLineNumber();
            const endLineNumber = this.getEndLineNumber();
            let someoneNotified = false;
            for (let changedLineNumber = changeFromLineNumber; changedLineNumber <= changeToLineNumber; changedLineNumber++) {
                if (changedLineNumber >= startLineNumber && changedLineNumber <= endLineNumber) {
                    // Notify the line
                    this._lines[changedLineNumber - this._rendLineNumberStart].onContentChanged();
                    someoneNotified = true;
                }
            }
            return someoneNotified;
        }
        onLinesInserted(insertFromLineNumber, insertToLineNumber) {
            if (this.getCount() === 0) {
                // no lines
                return null;
            }
            const insertCnt = insertToLineNumber - insertFromLineNumber + 1;
            const startLineNumber = this.getStartLineNumber();
            const endLineNumber = this.getEndLineNumber();
            if (insertFromLineNumber <= startLineNumber) {
                // inserting above the viewport
                this._rendLineNumberStart += insertCnt;
                return null;
            }
            if (insertFromLineNumber > endLineNumber) {
                // inserting below the viewport
                return null;
            }
            if (insertCnt + insertFromLineNumber > endLineNumber) {
                // insert inside the viewport in such a way that all remaining lines are pushed outside
                const deleted = this._lines.splice(insertFromLineNumber - this._rendLineNumberStart, endLineNumber - insertFromLineNumber + 1);
                return deleted;
            }
            // insert inside the viewport, push out some lines, but not all remaining lines
            const newLines = [];
            for (let i = 0; i < insertCnt; i++) {
                newLines[i] = this._createLine();
            }
            const insertIndex = insertFromLineNumber - this._rendLineNumberStart;
            const beforeLines = this._lines.slice(0, insertIndex);
            const afterLines = this._lines.slice(insertIndex, this._lines.length - insertCnt);
            const deletedLines = this._lines.slice(this._lines.length - insertCnt, this._lines.length);
            this._lines = beforeLines.concat(newLines).concat(afterLines);
            return deletedLines;
        }
        onTokensChanged(ranges) {
            if (this.getCount() === 0) {
                // no lines
                return false;
            }
            const startLineNumber = this.getStartLineNumber();
            const endLineNumber = this.getEndLineNumber();
            let notifiedSomeone = false;
            for (let i = 0, len = ranges.length; i < len; i++) {
                const rng = ranges[i];
                if (rng.toLineNumber < startLineNumber || rng.fromLineNumber > endLineNumber) {
                    // range outside viewport
                    continue;
                }
                const from = Math.max(startLineNumber, rng.fromLineNumber);
                const to = Math.min(endLineNumber, rng.toLineNumber);
                for (let lineNumber = from; lineNumber <= to; lineNumber++) {
                    const lineIndex = lineNumber - this._rendLineNumberStart;
                    this._lines[lineIndex].onTokensChanged();
                    notifiedSomeone = true;
                }
            }
            return notifiedSomeone;
        }
    }
    exports.RenderedLinesCollection = RenderedLinesCollection;
    class VisibleLinesCollection {
        constructor(host) {
            this._host = host;
            this.domNode = this._createDomNode();
            this._linesCollection = new RenderedLinesCollection(() => this._host.createVisibleLine());
        }
        _createDomNode() {
            const domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            domNode.setClassName('view-layer');
            domNode.setPosition('absolute');
            domNode.domNode.setAttribute('role', 'presentation');
            domNode.domNode.setAttribute('aria-hidden', 'true');
            return domNode;
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                return true;
            }
            return false;
        }
        onFlushed(e) {
            this._linesCollection.flush();
            // No need to clear the dom node because a full .innerHTML will occur in ViewLayerRenderer._render
            return true;
        }
        onLinesChanged(e) {
            return this._linesCollection.onLinesChanged(e.fromLineNumber, e.count);
        }
        onLinesDeleted(e) {
            const deleted = this._linesCollection.onLinesDeleted(e.fromLineNumber, e.toLineNumber);
            if (deleted) {
                // Remove from DOM
                for (let i = 0, len = deleted.length; i < len; i++) {
                    const lineDomNode = deleted[i].getDomNode();
                    if (lineDomNode) {
                        this.domNode.domNode.removeChild(lineDomNode);
                    }
                }
            }
            return true;
        }
        onLinesInserted(e) {
            const deleted = this._linesCollection.onLinesInserted(e.fromLineNumber, e.toLineNumber);
            if (deleted) {
                // Remove from DOM
                for (let i = 0, len = deleted.length; i < len; i++) {
                    const lineDomNode = deleted[i].getDomNode();
                    if (lineDomNode) {
                        this.domNode.domNode.removeChild(lineDomNode);
                    }
                }
            }
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged;
        }
        onTokensChanged(e) {
            return this._linesCollection.onTokensChanged(e.ranges);
        }
        onZonesChanged(e) {
            return true;
        }
        // ---- end view event handlers
        getStartLineNumber() {
            return this._linesCollection.getStartLineNumber();
        }
        getEndLineNumber() {
            return this._linesCollection.getEndLineNumber();
        }
        getVisibleLine(lineNumber) {
            return this._linesCollection.getLine(lineNumber);
        }
        renderLines(viewportData) {
            const inp = this._linesCollection._get();
            const renderer = new ViewLayerRenderer(this.domNode.domNode, this._host, viewportData);
            const ctx = {
                rendLineNumberStart: inp.rendLineNumberStart,
                lines: inp.lines,
                linesLength: inp.lines.length
            };
            // Decide if this render will do a single update (single large .innerHTML) or many updates (inserting/removing dom nodes)
            const resCtx = renderer.render(ctx, viewportData.startLineNumber, viewportData.endLineNumber, viewportData.relativeVerticalOffset);
            this._linesCollection._set(resCtx.rendLineNumberStart, resCtx.lines);
        }
    }
    exports.VisibleLinesCollection = VisibleLinesCollection;
    class ViewLayerRenderer {
        static { this._ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('editorViewLayer', { createHTML: value => value }); }
        constructor(domNode, host, viewportData) {
            this.domNode = domNode;
            this.host = host;
            this.viewportData = viewportData;
        }
        render(inContext, startLineNumber, stopLineNumber, deltaTop) {
            const ctx = {
                rendLineNumberStart: inContext.rendLineNumberStart,
                lines: inContext.lines.slice(0),
                linesLength: inContext.linesLength
            };
            if ((ctx.rendLineNumberStart + ctx.linesLength - 1 < startLineNumber) || (stopLineNumber < ctx.rendLineNumberStart)) {
                // There is no overlap whatsoever
                ctx.rendLineNumberStart = startLineNumber;
                ctx.linesLength = stopLineNumber - startLineNumber + 1;
                ctx.lines = [];
                for (let x = startLineNumber; x <= stopLineNumber; x++) {
                    ctx.lines[x - startLineNumber] = this.host.createVisibleLine();
                }
                this._finishRendering(ctx, true, deltaTop);
                return ctx;
            }
            // Update lines which will remain untouched
            this._renderUntouchedLines(ctx, Math.max(startLineNumber - ctx.rendLineNumberStart, 0), Math.min(stopLineNumber - ctx.rendLineNumberStart, ctx.linesLength - 1), deltaTop, startLineNumber);
            if (ctx.rendLineNumberStart > startLineNumber) {
                // Insert lines before
                const fromLineNumber = startLineNumber;
                const toLineNumber = Math.min(stopLineNumber, ctx.rendLineNumberStart - 1);
                if (fromLineNumber <= toLineNumber) {
                    this._insertLinesBefore(ctx, fromLineNumber, toLineNumber, deltaTop, startLineNumber);
                    ctx.linesLength += toLineNumber - fromLineNumber + 1;
                }
            }
            else if (ctx.rendLineNumberStart < startLineNumber) {
                // Remove lines before
                const removeCnt = Math.min(ctx.linesLength, startLineNumber - ctx.rendLineNumberStart);
                if (removeCnt > 0) {
                    this._removeLinesBefore(ctx, removeCnt);
                    ctx.linesLength -= removeCnt;
                }
            }
            ctx.rendLineNumberStart = startLineNumber;
            if (ctx.rendLineNumberStart + ctx.linesLength - 1 < stopLineNumber) {
                // Insert lines after
                const fromLineNumber = ctx.rendLineNumberStart + ctx.linesLength;
                const toLineNumber = stopLineNumber;
                if (fromLineNumber <= toLineNumber) {
                    this._insertLinesAfter(ctx, fromLineNumber, toLineNumber, deltaTop, startLineNumber);
                    ctx.linesLength += toLineNumber - fromLineNumber + 1;
                }
            }
            else if (ctx.rendLineNumberStart + ctx.linesLength - 1 > stopLineNumber) {
                // Remove lines after
                const fromLineNumber = Math.max(0, stopLineNumber - ctx.rendLineNumberStart + 1);
                const toLineNumber = ctx.linesLength - 1;
                const removeCnt = toLineNumber - fromLineNumber + 1;
                if (removeCnt > 0) {
                    this._removeLinesAfter(ctx, removeCnt);
                    ctx.linesLength -= removeCnt;
                }
            }
            this._finishRendering(ctx, false, deltaTop);
            return ctx;
        }
        _renderUntouchedLines(ctx, startIndex, endIndex, deltaTop, deltaLN) {
            const rendLineNumberStart = ctx.rendLineNumberStart;
            const lines = ctx.lines;
            for (let i = startIndex; i <= endIndex; i++) {
                const lineNumber = rendLineNumberStart + i;
                lines[i].layoutLine(lineNumber, deltaTop[lineNumber - deltaLN], this.viewportData.lineHeight);
            }
        }
        _insertLinesBefore(ctx, fromLineNumber, toLineNumber, deltaTop, deltaLN) {
            const newLines = [];
            let newLinesLen = 0;
            for (let lineNumber = fromLineNumber; lineNumber <= toLineNumber; lineNumber++) {
                newLines[newLinesLen++] = this.host.createVisibleLine();
            }
            ctx.lines = newLines.concat(ctx.lines);
        }
        _removeLinesBefore(ctx, removeCount) {
            for (let i = 0; i < removeCount; i++) {
                const lineDomNode = ctx.lines[i].getDomNode();
                if (lineDomNode) {
                    this.domNode.removeChild(lineDomNode);
                }
            }
            ctx.lines.splice(0, removeCount);
        }
        _insertLinesAfter(ctx, fromLineNumber, toLineNumber, deltaTop, deltaLN) {
            const newLines = [];
            let newLinesLen = 0;
            for (let lineNumber = fromLineNumber; lineNumber <= toLineNumber; lineNumber++) {
                newLines[newLinesLen++] = this.host.createVisibleLine();
            }
            ctx.lines = ctx.lines.concat(newLines);
        }
        _removeLinesAfter(ctx, removeCount) {
            const removeIndex = ctx.linesLength - removeCount;
            for (let i = 0; i < removeCount; i++) {
                const lineDomNode = ctx.lines[removeIndex + i].getDomNode();
                if (lineDomNode) {
                    this.domNode.removeChild(lineDomNode);
                }
            }
            ctx.lines.splice(removeIndex, removeCount);
        }
        _finishRenderingNewLines(ctx, domNodeIsEmpty, newLinesHTML, wasNew) {
            if (ViewLayerRenderer._ttPolicy) {
                newLinesHTML = ViewLayerRenderer._ttPolicy.createHTML(newLinesHTML);
            }
            const lastChild = this.domNode.lastChild;
            if (domNodeIsEmpty || !lastChild) {
                this.domNode.innerHTML = newLinesHTML; // explains the ugly casts -> https://github.com/microsoft/vscode/issues/106396#issuecomment-692625393;
            }
            else {
                lastChild.insertAdjacentHTML('afterend', newLinesHTML);
            }
            let currChild = this.domNode.lastChild;
            for (let i = ctx.linesLength - 1; i >= 0; i--) {
                const line = ctx.lines[i];
                if (wasNew[i]) {
                    line.setDomNode(currChild);
                    currChild = currChild.previousSibling;
                }
            }
        }
        _finishRenderingInvalidLines(ctx, invalidLinesHTML, wasInvalid) {
            const hugeDomNode = document.createElement('div');
            if (ViewLayerRenderer._ttPolicy) {
                invalidLinesHTML = ViewLayerRenderer._ttPolicy.createHTML(invalidLinesHTML);
            }
            hugeDomNode.innerHTML = invalidLinesHTML;
            for (let i = 0; i < ctx.linesLength; i++) {
                const line = ctx.lines[i];
                if (wasInvalid[i]) {
                    const source = hugeDomNode.firstChild;
                    const lineDomNode = line.getDomNode();
                    lineDomNode.parentNode.replaceChild(source, lineDomNode);
                    line.setDomNode(source);
                }
            }
        }
        static { this._sb = new stringBuilder_1.StringBuilder(100000); }
        _finishRendering(ctx, domNodeIsEmpty, deltaTop) {
            const sb = ViewLayerRenderer._sb;
            const linesLength = ctx.linesLength;
            const lines = ctx.lines;
            const rendLineNumberStart = ctx.rendLineNumberStart;
            const wasNew = [];
            {
                sb.reset();
                let hadNewLine = false;
                for (let i = 0; i < linesLength; i++) {
                    const line = lines[i];
                    wasNew[i] = false;
                    const lineDomNode = line.getDomNode();
                    if (lineDomNode) {
                        // line is not new
                        continue;
                    }
                    const renderResult = line.renderLine(i + rendLineNumberStart, deltaTop[i], this.viewportData.lineHeight, this.viewportData, sb);
                    if (!renderResult) {
                        // line does not need rendering
                        continue;
                    }
                    wasNew[i] = true;
                    hadNewLine = true;
                }
                if (hadNewLine) {
                    this._finishRenderingNewLines(ctx, domNodeIsEmpty, sb.build(), wasNew);
                }
            }
            {
                sb.reset();
                let hadInvalidLine = false;
                const wasInvalid = [];
                for (let i = 0; i < linesLength; i++) {
                    const line = lines[i];
                    wasInvalid[i] = false;
                    if (wasNew[i]) {
                        // line was new
                        continue;
                    }
                    const renderResult = line.renderLine(i + rendLineNumberStart, deltaTop[i], this.viewportData.lineHeight, this.viewportData, sb);
                    if (!renderResult) {
                        // line does not need rendering
                        continue;
                    }
                    wasInvalid[i] = true;
                    hadInvalidLine = true;
                }
                if (hadInvalidLine) {
                    this._finishRenderingInvalidLines(ctx, sb.build(), wasInvalid);
                }
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xheWVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlldy92aWV3TGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0NoRyxNQUFhLHVCQUF1QjtRQUtuQyxZQUFZLFVBQW1CO1lBQzlCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1lBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFTSxLQUFLO1lBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQUksQ0FBQyxtQkFBMkIsRUFBRSxLQUFVO1lBQzNDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxtQkFBbUIsQ0FBQztRQUNqRCxDQUFDO1FBRUQsSUFBSTtZQUNILE9BQU87Z0JBQ04sbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG9CQUFvQjtnQkFDOUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNO2FBQ2xCLENBQUM7UUFDSCxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxrQkFBa0I7WUFDeEIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDbEMsQ0FBQztRQUVEOztXQUVHO1FBQ0ksZ0JBQWdCO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRU0sUUFBUTtZQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDM0IsQ0FBQztRQUVNLE9BQU8sQ0FBQyxVQUFrQjtZQUNoQyxNQUFN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