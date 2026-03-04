/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewZonesChangedEvent = exports.ViewTokensColorsChangedEvent = exports.ViewTokensChangedEvent = exports.ViewThemeChangedEvent = exports.ViewScrollChangedEvent = exports.ViewRevealRangeRequestEvent = exports.VerticalRevealType = exports.ViewLinesInsertedEvent = exports.ViewLinesDeletedEvent = exports.ViewLinesChangedEvent = exports.ViewLineMappingChangedEvent = exports.ViewLanguageConfigurationEvent = exports.ViewFocusChangedEvent = exports.ViewFlushedEvent = exports.ViewDecorationsChangedEvent = exports.ViewCursorStateChangedEvent = exports.ViewConfigurationChangedEvent = exports.ViewCompositionEndEvent = exports.ViewCompositionStartEvent = exports.ViewEventType = void 0;
    var ViewEventType;
    (function (ViewEventType) {
        ViewEventType[ViewEventType["ViewCompositionStart"] = 0] = "ViewCompositionStart";
        ViewEventType[ViewEventType["ViewCompositionEnd"] = 1] = "ViewCompositionEnd";
        ViewEventType[ViewEventType["ViewConfigurationChanged"] = 2] = "ViewConfigurationChanged";
        ViewEventType[ViewEventType["ViewCursorStateChanged"] = 3] = "ViewCursorStateChanged";
        ViewEventType[ViewEventType["ViewDecorationsChanged"] = 4] = "ViewDecorationsChanged";
        ViewEventType[ViewEventType["ViewFlushed"] = 5] = "ViewFlushed";
        ViewEventType[ViewEventType["ViewFocusChanged"] = 6] = "ViewFocusChanged";
        ViewEventType[ViewEventType["ViewLanguageConfigurationChanged"] = 7] = "ViewLanguageConfigurationChanged";
        ViewEventType[ViewEventType["ViewLineMappingChanged"] = 8] = "ViewLineMappingChanged";
        ViewEventType[ViewEventType["ViewLinesChanged"] = 9] = "ViewLinesChanged";
        ViewEventType[ViewEventType["ViewLinesDeleted"] = 10] = "ViewLinesDeleted";
        ViewEventType[ViewEventType["ViewLinesInserted"] = 11] = "ViewLinesInserted";
        ViewEventType[ViewEventType["ViewRevealRangeRequest"] = 12] = "ViewRevealRangeRequest";
        ViewEventType[ViewEventType["ViewScrollChanged"] = 13] = "ViewScrollChanged";
        ViewEventType[ViewEventType["ViewThemeChanged"] = 14] = "ViewThemeChanged";
        ViewEventType[ViewEventType["ViewTokensChanged"] = 15] = "ViewTokensChanged";
        ViewEventType[ViewEventType["ViewTokensColorsChanged"] = 16] = "ViewTokensColorsChanged";
        ViewEventType[ViewEventType["ViewZonesChanged"] = 17] = "ViewZonesChanged";
    })(ViewEventType || (exports.ViewEventType = ViewEventType = {}));
    class ViewCompositionStartEvent {
        constructor() {
            this.type = 0 /* ViewEventType.ViewCompositionStart */;
        }
    }
    exports.ViewCompositionStartEvent = ViewCompositionStartEvent;
    class ViewCompositionEndEvent {
        constructor() {
            this.type = 1 /* ViewEventType.ViewCompositionEnd */;
        }
    }
    exports.ViewCompositionEndEvent = ViewCompositionEndEvent;
    class ViewConfigurationChangedEvent {
        constructor(source) {
            this.type = 2 /* ViewEventType.ViewConfigurationChanged */;
            this._source = source;
        }
        hasChanged(id) {
            return this._source.hasChanged(id);
        }
    }
    exports.ViewConfigurationChangedEvent = ViewConfigurationChangedEvent;
    class ViewCursorStateChangedEvent {
        constructor(selections, modelSelections, reason) {
            this.selections = selections;
            this.modelSelections = modelSelections;
            this.reason = reason;
            this.type = 3 /* ViewEventType.ViewCursorStateChanged */;
        }
    }
    exports.ViewCursorStateChangedEvent = ViewCursorStateChangedEvent;
    class ViewDecorationsChangedEvent {
        constructor(source) {
            this.type = 4 /* ViewEventType.ViewDecorationsChanged */;
            if (source) {
                this.affectsMinimap = source.affectsMinimap;
                this.affectsOverviewRuler = source.affectsOverviewRuler;
                this.affectsGlyphMargin = source.affectsGlyphMargin;
                this.affectsLineNumber = source.affectsLineNumber;
            }
            else {
                this.affectsMinimap = true;
                this.affectsOverviewRuler = true;
                this.affectsGlyphMargin = true;
                this.affectsLineNumber = true;
            }
        }
    }
    exports.ViewDecorationsChangedEvent = ViewDecorationsChangedEvent;
    class ViewFlushedEvent {
        constructor() {
            this.type = 5 /* ViewEventType.ViewFlushed */;
            // Nothing to do
        }
    }
    exports.ViewFlushedEvent = ViewFlushedEvent;
    class ViewFocusChangedEvent {
        constructor(isFocused) {
            this.type = 6 /* ViewEventType.ViewFocusChanged */;
            this.isFocused = isFocused;
        }
    }
    exports.ViewFocusChangedEvent = ViewFocusChangedEvent;
    class ViewLanguageConfigurationEvent {
        constructor() {
            this.type = 7 /* ViewEventType.ViewLanguageConfigurationChanged */;
        }
    }
    exports.ViewLanguageConfigurationEvent = ViewLanguageConfigurationEvent;
    class ViewLineMappingChangedEvent {
        constructor() {
            this.type = 8 /* ViewEventType.ViewLineMappingChanged */;
            // Nothing to do
        }
    }
    exports.ViewLineMappingChangedEvent = ViewLineMappingChangedEvent;
    class ViewLinesChangedEvent {
        constructor(
        /**
         * The first line that has changed.
         */
        fromLineNumber, 
        /**
         * The number of lines that have changed.
         */
        count) {
            this.fromLineNumber = fromLineNumber;
            this.count = count;
            this.type = 9 /* ViewEventType.ViewLinesChanged */;
        }
    }
    exports.ViewLinesChangedEvent = ViewLinesChangedEvent;
    class ViewLinesDeletedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 10 /* ViewEventType.ViewLinesDeleted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesDeletedEvent = ViewLinesDeletedEvent;
    class ViewLinesInsertedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 11 /* ViewEventType.ViewLinesInserted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesInsertedEvent = ViewLinesInsertedEvent;
    var VerticalRevealType;
    (function (VerticalRevealType) {
        VerticalRevealType[VerticalRevealType["Simple"] = 0] = "Simple";
        VerticalRevealType[VerticalRevealType["Center"] = 1] = "Center";
        VerticalRevealType[VerticalRevealType["CenterIfOutsideViewport"] = 2] = "CenterIfOutsideViewport";
        VerticalRevealType[VerticalRevealType["Top"] = 3] = "Top";
        VerticalRevealType[VerticalRevealType["Bottom"] = 4] = "Bottom";
        VerticalRevealType[VerticalRevealType["NearTop"] = 5] = "NearTop";
        VerticalRevealType[VerticalRevealType["NearTopIfOutsideViewport"] = 6] = "NearTopIfOutsideViewport";
    })(VerticalRevealType || (exports.VerticalRevealType = VerticalRevealType = {}));
    class ViewRevealRangeRequestEvent {
        constructor(
        /**
         * Source of the call that caused the event.
         */
        source, 
        /**
         * Reduce the revealing to a minimum (e.g. avoid scrolling if the bounding box is visible and near the viewport edge).
         */
        minimalReveal, 
        /**
         * Range to be reavealed.
         */
        range, 
        /**
         * Selections to be revealed.
         */
        selections, 
        /**
         * The vertical reveal strategy.
         */
        verticalType, 
        /**
         * If true: there should be a horizontal & vertical revealing.
         * If false: there should be just a vertical revealing.
         */
        revealHorizontal, 
        /**
         * The scroll type.
         */
        scrollType) {
            this.source = source;
            this.minimalReveal = minimalReveal;
            this.range = range;
            this.selections = selections;
            this.verticalType = verticalType;
            this.revealHorizontal = revealHorizontal;
            this.scrollType = scrollType;
            this.type = 12 /* ViewEventType.ViewRevealRangeRequest */;
        }
    }
    exports.ViewRevealRangeRequestEvent = ViewRevealRangeRequestEvent;
    class ViewScrollChangedEvent {
        constructor(source) {
            this.type = 13 /* ViewEventType.ViewScrollChanged */;
            this.scrollWidth = source.scrollWidth;
            this.scrollLeft = source.scrollLeft;
            this.scrollHeight = source.scrollHeight;
            this.scrollTop = source.scrollTop;
            this.scrollWidthChanged = source.scrollWidthChanged;
            this.scrollLeftChanged = source.scrollLeftChanged;
            this.scrollHeightChanged = source.scrollHeightChanged;
            this.scrollTopChanged = source.scrollTopChanged;
        }
    }
    exports.ViewScrollChangedEvent = ViewScrollChangedEvent;
    class ViewThemeChangedEvent {
        constructor(theme) {
            this.theme = theme;
            this.type = 14 /* ViewEventType.ViewThemeChanged */;
        }
    }
    exports.ViewThemeChangedEvent = ViewThemeChangedEvent;
    class ViewTokensChangedEvent {
        constructor(ranges) {
            this.type = 15 /* ViewEventType.ViewTokensChanged */;
            this.ranges = ranges;
        }
    }
    exports.ViewTokensChangedEvent = ViewTokensChangedEvent;
    class ViewTokensColorsChangedEvent {
        constructor() {
            this.type = 16 /* ViewEventType.ViewTokensColorsChanged */;
            // Nothing to do
        }
    }
    exports.ViewTokensColorsChangedEvent = ViewTokensColorsChangedEvent;
    class ViewZonesChangedEvent {
        constructor() {
            this.type = 17 /* ViewEventType.ViewZonesChanged */;
            // Nothing to do
        }
    }
    exports.ViewZonesChangedEvent = ViewZonesChangedEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0V2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld0V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsSUFBa0IsYUFtQmpCO0lBbkJELFdBQWtCLGFBQWE7UUFDOUIsaUZBQW9CLENBQUE7UUFDcEIsNkVBQWtCLENBQUE7UUFDbEIseUZBQXdCLENBQUE7UUFDeEIscUZBQXNCLENBQUE7UUFDdEIscUZBQXNCLENBQUE7UUFDdEIsK0RBQVcsQ0FBQTtRQUNYLHlFQUFnQixDQUFBO1FBQ2hCLHlHQUFnQyxDQUFBO1FBQ2hDLHFGQUFzQixDQUFBO1FBQ3RCLHlFQUFnQixDQUFBO1FBQ2hCLDBFQUFnQixDQUFBO1FBQ2hCLDRFQUFpQixDQUFBO1FBQ2pCLHNGQUFzQixDQUFBO1FBQ3RCLDRFQUFpQixDQUFBO1FBQ2pCLDBFQUFnQixDQUFBO1FBQ2hCLDRFQUFpQixDQUFBO1FBQ2pCLHdGQUF1QixDQUFBO1FBQ3ZCLDBFQUFnQixDQUFBO0lBQ2pCLENBQUMsRUFuQmlCLGFBQWEsNkJBQWIsYUFBYSxRQW1COUI7SUFFRCxNQUFhLHlCQUF5QjtRQUVyQztZQURnQixTQUFJLDhDQUFzQztRQUMxQyxDQUFDO0tBQ2pCO0lBSEQsOERBR0M7SUFFRCxNQUFhLHVCQUF1QjtRQUVuQztZQURnQixTQUFJLDRDQUFvQztRQUN4QyxDQUFDO0tBQ2pCO0lBSEQsMERBR0M7SUFFRCxNQUFhLDZCQUE2QjtRQU16QyxZQUFZLE1BQWlDO1lBSjdCLFNBQUksa0RBQTBDO1lBSzdELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7UUFFTSxVQUFVLENBQUMsRUFBZ0I7WUFDakMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFF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