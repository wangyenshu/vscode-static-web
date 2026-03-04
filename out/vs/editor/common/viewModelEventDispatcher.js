/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModelTokensChangedEvent = exports.ModelOptionsChangedEvent = exports.ModelContentChangedEvent = exports.ModelLanguageConfigurationChangedEvent = exports.ModelLanguageChangedEvent = exports.ModelDecorationsChangedEvent = exports.ReadOnlyEditAttemptEvent = exports.CursorStateChangedEvent = exports.HiddenAreasChangedEvent = exports.ViewZonesChangedEvent = exports.ScrollChangedEvent = exports.FocusChangedEvent = exports.ContentSizeChangedEvent = exports.OutgoingViewModelEventKind = exports.ViewModelEventsCollector = exports.ViewModelEventDispatcher = void 0;
    class ViewModelEventDispatcher extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onEvent = this._register(new event_1.Emitter());
            this.onEvent = this._onEvent.event;
            this._eventHandlers = [];
            this._viewEventQueue = null;
            this._isConsumingViewEventQueue = false;
            this._collector = null;
            this._collectorCnt = 0;
            this._outgoingEvents = [];
        }
        emitOutgoingEvent(e) {
            this._addOutgoingEvent(e);
            this._emitOutgoingEvents();
        }
        _addOutgoingEvent(e) {
            for (let i = 0, len = this._outgoingEvents.length; i < len; i++) {
                const mergeResult = (this._outgoingEvents[i].kind === e.kind ? this._outgoingEvents[i].attemptToMerge(e) : null);
                if (mergeResult) {
                    this._outgoingEvents[i] = mergeResult;
                    return;
                }
            }
            // not merged
            this._outgoingEvents.push(e);
        }
        _emitOutgoingEvents() {
            while (this._outgoingEvents.length > 0) {
                if (this._collector || this._isConsumingViewEventQueue) {
                    // right now collecting or emitting view events, so let's postpone emitting
                    return;
                }
                const event = this._outgoingEvents.shift();
                if (event.isNoOp()) {
                    continue;
                }
                this._onEvent.fire(event);
            }
        }
        addViewEventHandler(eventHandler) {
            for (let i = 0, len = this._eventHandlers.length; i < len; i++) {
                if (this._eventHandlers[i] === eventHandler) {
                    console.warn('Detected duplicate listener in ViewEventDispatcher', eventHandler);
                }
            }
            this._eventHandlers.push(eventHandler);
        }
        removeViewEventHandler(eventHandler) {
            for (let i = 0; i < this._eventHandlers.length; i++) {
                if (this._eventHandlers[i] === eventHandler) {
                    this._eventHandlers.splice(i, 1);
                    break;
                }
            }
        }
        beginEmitViewEvents() {
            this._collectorCnt++;
            if (this._collectorCnt === 1) {
                this._collector = new ViewModelEventsCollector();
            }
            return this._collector;
        }
        endEmitViewEvents() {
            this._collectorCnt--;
            if (this._collectorCnt === 0) {
                const outgoingEvents = this._collector.outgoingEvents;
                const viewEvents = this._collector.viewEvents;
                this._collector = null;
                for (const outgoingEvent of outgoingEvents) {
                    this._addOutgoingEvent(outgoingEvent);
                }
                if (viewEvents.length > 0) {
                    this._emitMany(viewEvents);
                }
            }
            this._emitOutgoingEvents();
        }
        emitSingleViewEvent(event) {
            try {
                const eventsCollector = this.beginEmitViewEvents();
                eventsCollector.emitViewEvent(event);
            }
            finally {
                this.endEmitViewEvents();
            }
        }
        _emitMany(events) {
            if (this._viewEventQueue) {
                this._viewEventQueue = this._viewEventQueue.concat(events);
            }
            else {
                this._viewEventQueue = events;
            }
            if (!this._isConsumingViewEventQueue) {
                this._consumeViewEventQueue();
            }
        }
        _consumeViewEventQueue() {
            try {
                this._isConsumingViewEventQueue = true;
                this._doConsumeQueue();
            }
            finally {
                this._isConsumingViewEventQueue = false;
            }
        }
        _doConsumeQueue() {
            while (this._viewEventQueue) {
                // Empty event queue, as events might come in while sending these off
                const events = this._viewEventQueue;
                this._viewEventQueue = null;
                // Use a clone of the event handlers list, as they might remove themselves
                const eventHandlers = this._eventHandlers.slice(0);
                for (const eventHandler of eventHandlers) {
                    eventHandler.handleEvents(events);
                }
            }
        }
    }
    exports.ViewModelEventDispatcher = ViewModelEventDispatcher;
    class ViewModelEventsCollector {
        constructor() {
            this.viewEvents = [];
            this.outgoingEvents = [];
        }
        emitViewEvent(event) {
            this.viewEvents.push(event);
        }
        emitOutgoingEvent(e) {
            this.outgoingEvents.push(e);
        }
    }
    exports.ViewModelEventsCollector = ViewModelEventsCollector;
    var OutgoingViewModelEventKind;
    (function (OutgoingViewModelEventKind) {
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ContentSizeChanged"] = 0] = "ContentSizeChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["FocusChanged"] = 1] = "FocusChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ScrollChanged"] = 2] = "ScrollChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ViewZonesChanged"] = 3] = "ViewZonesChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["HiddenAreasChanged"] = 4] = "HiddenAreasChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ReadOnlyEditAttempt"] = 5] = "ReadOnlyEditAttempt";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["CursorStateChanged"] = 6] = "CursorStateChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelDecorationsChanged"] = 7] = "ModelDecorationsChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelLanguageChanged"] = 8] = "ModelLanguageChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelLanguageConfigurationChanged"] = 9] = "ModelLanguageConfigurationChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelContentChanged"] = 10] = "ModelContentChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelOptionsChanged"] = 11] = "ModelOptionsChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelTokensChanged"] = 12] = "ModelTokensChanged";
    })(OutgoingViewModelEventKind || (exports.OutgoingViewModelEventKind = OutgoingViewModelEventKind = {}));
    class ContentSizeChangedEvent {
        constructor(oldContentWidth, oldContentHeight, contentWidth, contentHeight) {
            this.kind = 0 /* OutgoingViewModelEventKind.ContentSizeChanged */;
            this._oldContentWidth = oldContentWidth;
            this._oldContentHeight = oldContentHeight;
            this.contentWidth = contentWidth;
            this.contentHeight = contentHeight;
            this.contentWidthChanged = (this._oldContentWidth !== this.contentWidth);
            this.contentHeightChanged = (this._oldContentHeight !== this.contentHeight);
        }
        isNoOp() {
            return (!this.contentWidthChanged && !this.contentHeightChanged);
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return new ContentSizeChangedEvent(this._oldContentWidth, this._oldContentHeight, other.contentWidth, other.contentHeight);
        }
    }
    exports.ContentSizeChangedEvent = ContentSizeChangedEvent;
    class FocusChangedEvent {
        constructor(oldHasFocus, hasFocus) {
            this.kind = 1 /* OutgoingViewModelEventKind.FocusChanged */;
            this.oldHasFocus = oldHasFocus;
            this.hasFocus = hasFocus;
        }
        isNoOp() {
            return (this.oldHasFocus === this.hasFocus);
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return new FocusChangedEvent(this.oldHasFocus, other.hasFocus);
        }
    }
    exports.FocusChangedEvent = FocusChangedEvent;
    class ScrollChangedEvent {
        constructor(oldScrollWidth, oldScrollLeft, oldScrollHeight, oldScrollTop, scrollWidth, scrollLeft, scrollHeight, scrollTop) {
            this.kind = 2 /* OutgoingViewModelEventKind.ScrollChanged */;
            this._oldScrollWidth = oldScrollWidth;
            this._oldScrollLeft = oldScrollLeft;
            this._oldScrollHeight = oldScrollHeight;
            this._oldScrollTop = oldScrollTop;
            this.scrollWidth = scrollWidth;
            this.scrollLeft = scrollLeft;
            this.scrollHeight = scrollHeight;
            this.scrollTop = scrollTop;
            this.scrollWidthChanged = (this._oldScrollWidth !== this.scrollWidth);
            this.scrollLeftChanged = (this._oldScrollLeft !== this.scrollLeft);
            this.scrollHeightChanged = (this._oldScrollHeight !== this.scrollHeight);
            this.scrollTopChanged = (this._oldScrollTop !== this.scrollTop);
        }
        isNoOp() {
            return (!this.scrollWidthChanged && !this.scrollLeftChanged && !this.scrollHeightChanged && !this.scrollTopChanged);
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return new ScrollChangedEvent(this._oldScrollWidth, this._oldScrollLeft, this._oldScrollHeight, this._oldScrollTop, other.scrollWidth, other.scrollLeft, other.scrollHeight, other.scrollTop);
        }
    }
    exports.ScrollChangedEvent = ScrollChangedEvent;
    class ViewZonesChangedEvent {
        constructor() {
            this.kind = 3 /* OutgoingViewModelEventKind.ViewZonesChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return this;
        }
    }
    exports.ViewZonesChangedEvent = ViewZonesChangedEvent;
    class HiddenAreasChangedEvent {
        constructor() {
            this.kind = 4 /* OutgoingViewModelEventKind.HiddenAreasChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return this;
        }
    }
    exports.HiddenAreasChangedEvent = HiddenAreasChangedEvent;
    class CursorStateChangedEvent {
        constructor(oldSelections, selections, oldModelVersionId, modelVersionId, source, reason, reachedMaxCursorCount) {
            this.kind = 6 /* OutgoingViewModelEventKind.CursorStateChanged */;
            this.oldSelections = oldSelections;
            this.selections = selections;
            this.oldModelVersionId = oldModelVersionId;
            this.modelVersionId = modelVersionId;
            this.source = source;
            this.reason = reason;
            this.reachedMaxCursorCount = reachedMaxCursorCount;
        }
        static _selectionsAreEqual(a, b) {
            if (!a && !b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!a[i].equalsSelection(b[i])) {
                    return false;
                }
            }
            return true;
        }
        isNoOp() {
            return (CursorStateChangedEvent._selectionsAreEqual(this.oldSelections, this.selections)
                && this.oldModelVersionId === this.modelVersionId);
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return new CursorStateChangedEvent(this.oldSelections, other.selections, this.oldModelVersionId, other.modelVersionId, other.source, other.reason, this.reachedMaxCursorCount || other.reachedMaxCursorCount);
        }
    }
    exports.CursorStateChangedEvent = CursorStateChangedEvent;
    class ReadOnlyEditAttemptEvent {
        constructor() {
            this.kind = 5 /* OutgoingViewModelEventKind.ReadOnlyEditAttempt */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return this;
        }
    }
    exports.ReadOnlyEditAttemptEvent = ReadOnlyEditAttemptEvent;
    class ModelDecorationsChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 7 /* OutgoingViewModelEventKind.ModelDecorationsChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelDecorationsChangedEvent = ModelDecorationsChangedEvent;
    class ModelLanguageChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 8 /* OutgoingViewModelEventKind.ModelLanguageChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelLanguageChangedEvent = ModelLanguageChangedEvent;
    class ModelLanguageConfigurationChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 9 /* OutgoingViewModelEventKind.ModelLanguageConfigurationChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelLanguageConfigurationChangedEvent = ModelLanguageConfigurationChangedEvent;
    class ModelContentChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 10 /* OutgoingViewModelEventKind.ModelContentChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelContentChangedEvent = ModelContentChangedEvent;
    class ModelOptionsChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 11 /* OutgoingViewModelEventKind.ModelOptionsChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelOptionsChangedEvent = ModelOptionsChangedEvent;
    class ModelTokensChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 12 /* OutgoingViewModelEventKind.ModelTokensChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelTokensChangedEvent = ModelTokensChangedEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsRXZlbnREaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TW9kZWxFdmVudERpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsd0JBQXlCLFNBQVEsc0JBQVU7UUFZdkQ7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQVhRLGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEwQixDQUFDLENBQUM7WUFDbEUsWUFBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBVzdDLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzVCLElBQUksQ0FBQywwQkFBMEIsR0FBRyxLQUFLLENBQUM7WUFDeEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVNLGlCQUFpQixDQUFDLENBQXlCO1lBQ2pELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU8saUJBQWlCLENBQUMsQ0FBeUI7WUFDbEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxJQUFJLENB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