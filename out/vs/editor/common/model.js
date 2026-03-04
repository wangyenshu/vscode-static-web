/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects"], function (require, exports, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplyEditsResult = exports.SearchData = exports.ValidAnnotatedEditOperation = exports.ModelConstants = exports.PositionAffinity = exports.TrackedRangeStickiness = exports.FindMatch = exports.TextModelResolvedOptions = exports.EndOfLineSequence = exports.DefaultEndOfLine = exports.EndOfLinePreference = exports.InjectedTextCursorStops = exports.MinimapSectionHeaderStyle = exports.MinimapPosition = exports.GlyphMarginLane = exports.OverviewRulerLane = void 0;
    exports.isITextSnapshot = isITextSnapshot;
    exports.shouldSynchronizeModel = shouldSynchronizeModel;
    /**
     * Vertical Lane in the overview ruler of the editor.
     */
    var OverviewRulerLane;
    (function (OverviewRulerLane) {
        OverviewRulerLane[OverviewRulerLane["Left"] = 1] = "Left";
        OverviewRulerLane[OverviewRulerLane["Center"] = 2] = "Center";
        OverviewRulerLane[OverviewRulerLane["Right"] = 4] = "Right";
        OverviewRulerLane[OverviewRulerLane["Full"] = 7] = "Full";
    })(OverviewRulerLane || (exports.OverviewRulerLane = OverviewRulerLane = {}));
    /**
     * Vertical Lane in the glyph margin of the editor.
     */
    var GlyphMarginLane;
    (function (GlyphMarginLane) {
        GlyphMarginLane[GlyphMarginLane["Left"] = 1] = "Left";
        GlyphMarginLane[GlyphMarginLane["Center"] = 2] = "Center";
        GlyphMarginLane[GlyphMarginLane["Right"] = 3] = "Right";
    })(GlyphMarginLane || (exports.GlyphMarginLane = GlyphMarginLane = {}));
    /**
     * Position in the minimap to render the decoration.
     */
    var MinimapPosition;
    (function (MinimapPosition) {
        MinimapPosition[MinimapPosition["Inline"] = 1] = "Inline";
        MinimapPosition[MinimapPosition["Gutter"] = 2] = "Gutter";
    })(MinimapPosition || (exports.MinimapPosition = MinimapPosition = {}));
    /**
     * Section header style.
     */
    var MinimapSectionHeaderStyle;
    (function (MinimapSectionHeaderStyle) {
        MinimapSectionHeaderStyle[MinimapSectionHeaderStyle["Normal"] = 1] = "Normal";
        MinimapSectionHeaderStyle[MinimapSectionHeaderStyle["Underlined"] = 2] = "Underlined";
    })(MinimapSectionHeaderStyle || (exports.MinimapSectionHeaderStyle = MinimapSectionHeaderStyle = {}));
    var InjectedTextCursorStops;
    (function (InjectedTextCursorStops) {
        InjectedTextCursorStops[InjectedTextCursorStops["Both"] = 0] = "Both";
        InjectedTextCursorStops[InjectedTextCursorStops["Right"] = 1] = "Right";
        InjectedTextCursorStops[InjectedTextCursorStops["Left"] = 2] = "Left";
        InjectedTextCursorStops[InjectedTextCursorStops["None"] = 3] = "None";
    })(InjectedTextCursorStops || (exports.InjectedTextCursorStops = InjectedTextCursorStops = {}));
    /**
     * End of line character preference.
     */
    var EndOfLinePreference;
    (function (EndOfLinePreference) {
        /**
         * Use the end of line character identified in the text buffer.
         */
        EndOfLinePreference[EndOfLinePreference["TextDefined"] = 0] = "TextDefined";
        /**
         * Use line feed (\n) as the end of line character.
         */
        EndOfLinePreference[EndOfLinePreference["LF"] = 1] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        EndOfLinePreference[EndOfLinePreference["CRLF"] = 2] = "CRLF";
    })(EndOfLinePreference || (exports.EndOfLinePreference = EndOfLinePreference = {}));
    /**
     * The default end of line to use when instantiating models.
     */
    var DefaultEndOfLine;
    (function (DefaultEndOfLine) {
        /**
         * Use line feed (\n) as the end of line character.
         */
        DefaultEndOfLine[DefaultEndOfLine["LF"] = 1] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        DefaultEndOfLine[DefaultEndOfLine["CRLF"] = 2] = "CRLF";
    })(DefaultEndOfLine || (exports.DefaultEndOfLine = DefaultEndOfLine = {}));
    /**
     * End of line character preference.
     */
    var EndOfLineSequence;
    (function (EndOfLineSequence) {
        /**
         * Use line feed (\n) as the end of line character.
         */
        EndOfLineSequence[EndOfLineSequence["LF"] = 0] = "LF";
        /**
         * Use carriage return and line feed (\r\n) as the end of line character.
         */
        EndOfLineSequence[EndOfLineSequence["CRLF"] = 1] = "CRLF";
    })(EndOfLineSequence || (exports.EndOfLineSequence = EndOfLineSequence = {}));
    class TextModelResolvedOptions {
        get originalIndentSize() {
            return this._indentSizeIsTabSize ? 'tabSize' : this.indentSize;
        }
        /**
         * @internal
         */
        constructor(src) {
            this._textModelResolvedOptionsBrand = undefined;
            this.tabSize = Math.max(1, src.tabSize | 0);
            if (src.indentSize === 'tabSize') {
                this.indentSize = this.tabSize;
                this._indentSizeIsTabSize = true;
            }
            else {
                this.indentSize = Math.max(1, src.indentSize | 0);
                this._indentSizeIsTabSize = false;
            }
            this.insertSpaces = Boolean(src.insertSpaces);
            this.defaultEOL = src.defaultEOL | 0;
            this.trimAutoWhitespace = Boolean(src.trimAutoWhitespace);
            this.bracketPairColorizationOptions = src.bracketPairColorizationOptions;
        }
        /**
         * @internal
         */
        equals(other) {
            return (this.tabSize === other.tabSize
                && this._indentSizeIsTabSize === other._indentSizeIsTabSize
                && this.indentSize === other.indentSize
                && this.insertSpaces === other.insertSpaces
                && this.defaultEOL === other.defaultEOL
                && this.trimAutoWhitespace === other.trimAutoWhitespace
                && (0, objects_1.equals)(this.bracketPairColorizationOptions, other.bracketPairColorizationOptions));
        }
        /**
         * @internal
         */
        createChangeEvent(newOpts) {
            return {
                tabSize: this.tabSize !== newOpts.tabSize,
                indentSize: this.indentSize !== newOpts.indentSize,
                insertSpaces: this.insertSpaces !== newOpts.insertSpaces,
                trimAutoWhitespace: this.trimAutoWhitespace !== newOpts.trimAutoWhitespace,
            };
        }
    }
    exports.TextModelResolvedOptions = TextModelResolvedOptions;
    class FindMatch {
        /**
         * @internal
         */
        constructor(range, matches) {
            this._findMatchBrand = undefined;
            this.range = range;
            this.matches = matches;
        }
    }
    exports.FindMatch = FindMatch;
    /**
     * Describes the behavior of decorations when typing/editing near their edges.
     * Note: Please do not edit the values, as they very carefully match `DecorationRangeBehavior`
     */
    var TrackedRangeStickiness;
    (function (TrackedRangeStickiness) {
        TrackedRangeStickiness[TrackedRangeStickiness["AlwaysGrowsWhenTypingAtEdges"] = 0] = "AlwaysGrowsWhenTypingAtEdges";
        TrackedRangeStickiness[TrackedRangeStickiness["NeverGrowsWhenTypingAtEdges"] = 1] = "NeverGrowsWhenTypingAtEdges";
        TrackedRangeStickiness[TrackedRangeStickiness["GrowsOnlyWhenTypingBefore"] = 2] = "GrowsOnlyWhenTypingBefore";
        TrackedRangeStickiness[TrackedRangeStickiness["GrowsOnlyWhenTypingAfter"] = 3] = "GrowsOnlyWhenTypingAfter";
    })(TrackedRangeStickiness || (exports.TrackedRangeStickiness = TrackedRangeStickiness = {}));
    /**
     * @internal
     */
    function isITextSnapshot(obj) {
        return (obj && typeof obj.read === 'function');
    }
    var PositionAffinity;
    (function (PositionAffinity) {
        /**
         * Prefers the left most position.
        */
        PositionAffinity[PositionAffinity["Left"] = 0] = "Left";
        /**
         * Prefers the right most position.
        */
        PositionAffinity[PositionAffinity["Right"] = 1] = "Right";
        /**
         * No preference.
        */
        PositionAffinity[PositionAffinity["None"] = 2] = "None";
        /**
         * If the given position is on injected text, prefers the position left of it.
        */
        PositionAffinity[PositionAffinity["LeftOfInjectedText"] = 3] = "LeftOfInjectedText";
        /**
         * If the given position is on injected text, prefers the position right of it.
        */
        PositionAffinity[PositionAffinity["RightOfInjectedText"] = 4] = "RightOfInjectedText";
    })(PositionAffinity || (exports.PositionAffinity = PositionAffinity = {}));
    /**
     * @internal
     */
    var ModelConstants;
    (function (ModelConstants) {
        ModelConstants[ModelConstants["FIRST_LINE_DETECTION_LENGTH_LIMIT"] = 1000] = "FIRST_LINE_DETECTION_LENGTH_LIMIT";
    })(ModelConstants || (exports.ModelConstants = ModelConstants = {}));
    /**
     * @internal
     */
    class ValidAnnotatedEditOperation {
        constructor(identifier, range, text, forceMoveMarkers, isAutoWhitespaceEdit, _isTracked) {
            this.identifier = identifier;
            this.range = range;
            this.text = text;
            this.forceMoveMarkers = forceMoveMarkers;
            this.isAutoWhitespaceEdit = isAutoWhitespaceEdit;
            this._isTracked = _isTracked;
        }
    }
    exports.ValidAnnotatedEditOperation = ValidAnnotatedEditOperation;
    /**
     * @internal
     */
    class SearchData {
        constructor(regex, wordSeparators, simpleSearch) {
            this.regex = regex;
            this.wordSeparators = wordSeparators;
            this.simpleSearch = simpleSearch;
        }
    }
    exports.SearchData = SearchData;
    /**
     * @internal
     */
    class ApplyEditsResult {
        constructor(reverseEdits, changes, trimAutoWhitespaceLineNumbers) {
            this.reverseEdits = reverseEdits;
            this.changes = changes;
            this.trimAutoWhitespaceLineNumbers = trimAutoWhitespaceLineNumbers;
        }
    }
    exports.ApplyEditsResult = ApplyEditsResult;
    /**
     * @internal
     */
    function shouldSynchronizeModel(model) {
        return (!model.isTooLargeForSyncing() && !model.isForSimpleWidget);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStuQmhHLDBDQUVDO0lBZzFCRCx3REFJQztJQTk3Q0Q7O09BRUc7SUFDSCxJQUFZLGlCQUtYO0lBTEQsV0FBWSxpQkFBaUI7UUFDNUIseURBQVEsQ0FBQTtRQUNSLDZEQUFVLENBQUE7UUFDViwyREFBUyxDQUFBO1FBQ1QseURBQVEsQ0FBQTtJQUNULENBQUMsRUFMVyxpQkFBaUIsaUNBQWpCLGlCQUFpQixRQUs1QjtJQUVEOztPQUVHO0lBQ0gsSUFBWSxlQUlYO0lBSkQsV0FBWSxlQUFlO1FBQzFCLHFEQUFRLENBQUE7UUFDUix5REFBVSxDQUFBO1FBQ1YsdURBQVMsQ0FBQTtJQUNWLENBQUMsRUFKVyxlQUFlLCtCQUFmLGVBQWUsUUFJMUI7SUEwQkQ7O09BRUc7SUFDSCxJQUFrQixlQUdqQjtJQUhELFdBQWtCLGVBQWU7UUFDaEMseURBQVUsQ0FBQTtRQUNWLHlEQUFVLENBQUE7SUFDWCxDQUFDLEVBSGlCLGVBQWUsK0JBQWYsZUFBZSxRQUdoQztJQUVEOztPQUVHO0lBQ0gsSUFBa0IseUJBR2pCO0lBSEQsV0FBa0IseUJBQXlCO1FBQzFDLDZFQUFVLENBQUE7UUFDVixxRkFBYyxDQUFBO0lBQ2YsQ0FBQyxFQUhpQix5QkFBeUIseUNBQXpCLHlCQUF5QixRQUcxQztJQW9PRCxJQUFZLHVCQUtYO0lBTEQsV0FBWSx1QkFBdUI7UUFDbEMscUVBQUksQ0FBQTtRQUNKLHVFQUFLLENBQUE7UUFDTCxxRUFBSSxDQUFBO1FBQ0oscUVBQUksQ0FBQTtJQUNMLENBQUMsRUFMVyx1QkFBdUIsdUNBQXZCLHVCQUF1QixRQUtsQztJQStFRDs7T0FFRztJQUNILElBQWtCLG1C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