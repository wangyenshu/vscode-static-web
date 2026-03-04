/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InternalModelContentChangeEvent = exports.ModelInjectedTextChangedEvent = exports.ModelRawContentChangedEvent = exports.ModelRawEOLChanged = exports.ModelRawLinesInserted = exports.ModelRawLinesDeleted = exports.ModelRawLineChanged = exports.LineInjectedText = exports.ModelRawFlush = exports.RawContentChangedType = void 0;
    /**
     * @internal
     */
    var RawContentChangedType;
    (function (RawContentChangedType) {
        RawContentChangedType[RawContentChangedType["Flush"] = 1] = "Flush";
        RawContentChangedType[RawContentChangedType["LineChanged"] = 2] = "LineChanged";
        RawContentChangedType[RawContentChangedType["LinesDeleted"] = 3] = "LinesDeleted";
        RawContentChangedType[RawContentChangedType["LinesInserted"] = 4] = "LinesInserted";
        RawContentChangedType[RawContentChangedType["EOLChanged"] = 5] = "EOLChanged";
    })(RawContentChangedType || (exports.RawContentChangedType = RawContentChangedType = {}));
    /**
     * An event describing that a model has been reset to a new value.
     * @internal
     */
    class ModelRawFlush {
        constructor() {
            this.changeType = 1 /* RawContentChangedType.Flush */;
        }
    }
    exports.ModelRawFlush = ModelRawFlush;
    /**
     * Represents text injected on a line
     * @internal
     */
    class LineInjectedText {
        static applyInjectedText(lineText, injectedTexts) {
            if (!injectedTexts || injectedTexts.length === 0) {
                return lineText;
            }
            let result = '';
            let lastOriginalOffset = 0;
            for (const injectedText of injectedTexts) {
                result += lineText.substring(lastOriginalOffset, injectedText.column - 1);
                lastOriginalOffset = injectedText.column - 1;
                result += injectedText.options.content;
            }
            result += lineText.substring(lastOriginalOffset);
            return result;
        }
        static fromDecorations(decorations) {
            const result = [];
            for (const decoration of decorations) {
                if (decoration.options.before && decoration.options.before.content.length > 0) {
                    result.push(new LineInjectedText(decoration.ownerId, decoration.range.startLineNumber, decoration.range.startColumn, decoration.options.before, 0));
                }
                if (decoration.options.after && decoration.options.after.content.length > 0) {
                    result.push(new LineInjectedText(decoration.ownerId, decoration.range.endLineNumber, decoration.range.endColumn, decoration.options.after, 1));
                }
            }
            result.sort((a, b) => {
                if (a.lineNumber === b.lineNumber) {
                    if (a.column === b.column) {
                        return a.order - b.order;
                    }
                    return a.column - b.column;
                }
                return a.lineNumber - b.lineNumber;
            });
            return result;
        }
        constructor(ownerId, lineNumber, column, options, order) {
            this.ownerId = ownerId;
            this.lineNumber = lineNumber;
            this.column = column;
            this.options = options;
            this.order = order;
        }
        withText(text) {
            return new LineInjectedText(this.ownerId, this.lineNumber, this.column, { ...this.options, content: text }, this.order);
        }
    }
    exports.LineInjectedText = LineInjectedText;
    /**
     * An event describing that a line has changed in a model.
     * @internal
     */
    class ModelRawLineChanged {
        constructor(lineNumber, detail, injectedText) {
            this.changeType = 2 /* RawContentChangedType.LineChanged */;
            this.lineNumber = lineNumber;
            this.detail = detail;
            this.injectedText = injectedText;
        }
    }
    exports.ModelRawLineChanged = ModelRawLineChanged;
    /**
     * An event describing that line(s) have been deleted in a model.
     * @internal
     */
    class ModelRawLinesDeleted {
        constructor(fromLineNumber, toLineNumber) {
            this.changeType = 3 /* RawContentChangedType.LinesDeleted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ModelRawLinesDeleted = ModelRawLinesDeleted;
    /**
     * An event describing that line(s) have been inserted in a model.
     * @internal
     */
    class ModelRawLinesInserted {
        constructor(fromLineNumber, toLineNumber, detail, injectedTexts) {
            this.changeType = 4 /* RawContentChangedType.LinesInserted */;
            this.injectedTexts = injectedTexts;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
            this.detail = detail;
        }
    }
    exports.ModelRawLinesInserted = ModelRawLinesInserted;
    /**
     * An event describing that a model has had its EOL changed.
     * @internal
     */
    class ModelRawEOLChanged {
        constructor() {
            this.changeType = 5 /* RawContentChangedType.EOLChanged */;
        }
    }
    exports.ModelRawEOLChanged = ModelRawEOLChanged;
    /**
     * An event describing a change in the text of a model.
     * @internal
     */
    class ModelRawContentChangedEvent {
        constructor(changes, versionId, isUndoing, isRedoing) {
            this.changes = changes;
            this.versionId = versionId;
            this.isUndoing = isUndoing;
            this.isRedoing = isRedoing;
            this.resultingSelection = null;
        }
        containsEvent(type) {
            for (let i = 0, len = this.changes.length; i < len; i++) {
                const change = this.changes[i];
                if (change.changeType === type) {
                    return true;
                }
            }
            return false;
        }
        static merge(a, b) {
            const changes = [].concat(a.changes).concat(b.changes);
            const versionId = b.versionId;
            const isUndoing = (a.isUndoing || b.isUndoing);
            const isRedoing = (a.isRedoing || b.isRedoing);
            return new ModelRawContentChangedEvent(changes, versionId, isUndoing, isRedoing);
        }
    }
    exports.ModelRawContentChangedEvent = ModelRawContentChangedEvent;
    /**
     * An event describing a change in injected text.
     * @internal
     */
    class ModelInjectedTextChangedEvent {
        constructor(changes) {
            this.changes = changes;
        }
    }
    exports.ModelInjectedTextChangedEvent = ModelInjectedTextChangedEvent;
    /**
     * @internal
     */
    class InternalModelContentChangeEvent {
        constructor(rawContentChangedEvent, contentChangedEvent) {
            this.rawContentChangedEvent = rawContentChangedEvent;
            this.contentChangedEvent = contentChangedEvent;
        }
        merge(other) {
            const rawContentChangedEvent = ModelRawContentChangedEvent.merge(this.rawContentChangedEvent, other.rawContentChangedEvent);
            const contentChangedEvent = InternalModelContentChangeEvent._mergeChangeEvents(this.contentChangedEvent, other.contentChangedEvent);
            return new InternalModelContentChangeEvent(rawContentChangedEvent, contentChangedEvent);
        }
        static _mergeChangeEvents(a, b) {
            const changes = [].concat(a.changes).concat(b.changes);
            const eol = b.eol;
            const versionId = b.versionId;
            const isUndoing = (a.isUndoing || b.isUndoing);
            const isRedoing = (a.isRedoing || b.isRedoing);
            const isFlush = (a.isFlush || b.isFlush);
            const isEolChange = a.isEolChange && b.isEolChange; // both must be true to not confuse listeners who skip such edits
            return {
                changes: changes,
                eol: eol,
                isEolChange: isEolChange,
                versionId: versionId,
                isUndoing: isUndoing,
                isRedoing: isRedoing,
                isFlush: isFlush,
            };
        }
    }
    exports.InternalModelContentChangeEvent = InternalModelContentChangeEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsRXZlbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi90ZXh0TW9kZWxFdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0hoRzs7T0FFRztJQUNILElBQWtCLHFCQU1qQjtJQU5ELFdBQWtCLHFCQUFxQjtRQUN0QyxtRUFBUyxDQUFBO1FBQ1QsK0VBQWUsQ0FBQTtRQUNmLGlGQUFnQixDQUFBO1FBQ2hCLG1GQUFpQixDQUFBO1FBQ2pCLDZFQUFjLENBQUE7SUFDZixDQUFDLEVBTmlCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBTXRDO0lBRUQ7OztPQUdHO0lBQ0gsTUFBYSxhQUFhO1FBQTFCO1lBQ2lCLGVBQVUsdUNBQStCO1FBQzFELENBQUM7S0FBQTtJQUZELHNDQUVDO0lBRUQ7OztPQUdHO0lBQ0gsTUFBYSxnQkFBZ0I7UUFDckIsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQWdCLEVBQUUsYUFBd0M7WUFDekYsSUFBSSxDQUFDLGFBQWEsSUFBSSxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNsRCxPQUFPLFFBQVEsQ0FBQztZQUNqQixDQUFDO1lBQ0QsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sSUFBSSxRQUFRLENBQUMsU0FBUyxDQUFDLGtCQUFrQixFQUFFLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLElBQUksWUFBWSxDQUFDLE9BQU8s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