/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/markers/common/markers", "vs/base/common/uuid", "vs/base/common/platform"], function (require, exports, uri_1, event_1, lifecycle_1, problemMatcher_1, markers_1, uuid_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WatchingProblemCollector = exports.StartStopProblemCollector = exports.ProblemHandlingStrategy = exports.AbstractProblemCollector = exports.ProblemCollectorEventKind = void 0;
    var ProblemCollectorEventKind;
    (function (ProblemCollectorEventKind) {
        ProblemCollectorEventKind["BackgroundProcessingBegins"] = "backgroundProcessingBegins";
        ProblemCollectorEventKind["BackgroundProcessingEnds"] = "backgroundProcessingEnds";
    })(ProblemCollectorEventKind || (exports.ProblemCollectorEventKind = ProblemCollectorEventKind = {}));
    var IProblemCollectorEvent;
    (function (IProblemCollectorEvent) {
        function create(kind) {
            return Object.freeze({ kind });
        }
        IProblemCollectorEvent.create = create;
    })(IProblemCollectorEvent || (IProblemCollectorEvent = {}));
    class AbstractProblemCollector extends lifecycle_1.Disposable {
        constructor(problemMatchers, markerService, modelService, fileService) {
            super();
            this.problemMatchers = problemMatchers;
            this.markerService = markerService;
            this.modelService = modelService;
            this.modelListeners = new lifecycle_1.DisposableStore();
            this._onDidFindFirstMatch = new event_1.Emitter();
            this.onDidFindFirstMatch = this._onDidFindFirstMatch.event;
            this._onDidFindErrors = new event_1.Emitter();
            this.onDidFindErrors = this._onDidFindErrors.event;
            this._onDidRequestInvalidateLastMarker = new event_1.Emitter();
            this.onDidRequestInvalidateLastMarker = this._onDidRequestInvalidateLastMarker.event;
            this.matchers = Object.create(null);
            this.bufferLength = 1;
            problemMatchers.map(elem => (0, problemMatcher_1.createLineMatcher)(elem, fileService)).forEach((matcher) => {
                const length = matcher.matchLength;
                if (length > this.bufferLength) {
                    this.bufferLength = length;
                }
                let value = this.matchers[length];
                if (!value) {
                    value = [];
                    this.matchers[length] = value;
                }
                value.push(matcher);
            });
            this.buffer = [];
            this.activeMatcher = null;
            this._numberOfMatches = 0;
            this._maxMarkerSeverity = undefined;
            this.openModels = Object.create(null);
            this.applyToByOwner = new Map();
            for (const problemMatcher of problemMatchers) {
                const current = this.applyToByOwner.get(problemMatcher.owner);
                if (current === undefined) {
                    this.applyToByOwner.set(problemMatcher.owner, problemMatcher.applyTo);
                }
                else {
                    this.applyToByOwner.set(problemMatcher.owner, this.mergeApplyTo(current, problemMatcher.applyTo));
                }
            }
            this.resourcesToClean = new Map();
            this.markers = new Map();
            this.deliveredMarkers = new Map();
            this._register(this.modelService.onModelAdded((model) => {
                this.openModels[model.uri.toString()] = true;
            }, this, this.modelListeners));
            this._register(this.modelService.onModelRemoved((model) => {
                delete this.openModels[model.uri.toString()];
            }, this, this.modelListeners));
            this.modelService.getModels().forEach(model => this.openModels[model.uri.toString()] = true);
            this._onDidStateChange = new event_1.Emitter();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        processLine(line) {
            if (this.tail) {
                const oldTail = this.tail;
                this.tail = oldTail.then(() => {
                    return this.processLineInternal(line);
                });
            }
            else {
                this.tail = this.processLineInternal(line);
            }
        }
        dispose() {
            super.dispose();
            this.modelListeners.dispose();
        }
        get numberOfMatches() {
            return this._numberOfMatches;
        }
        get maxMarkerSeverity() {
            return this._maxMarkerSeverity;
        }
        tryFindMarker(line) {
            let result = null;
            if (this.activeMatcher) {
                result = this.activeMatcher.next(line);
                if (result) {
                    this.captureMatch(result);
                    return result;
                }
                this.clearBuffer();
                this.activeMatcher = null;
            }
            if (this.buffer.length < this.bufferLength) {
                this.buffer.push(line);
            }
            else {
                const end = this.buffer.length - 1;
                for (let i = 0; i < end; i++) {
                    this.buffer[i] = this.buffer[i + 1];
                }
                this.buffer[end] = line;
            }
            result = this.tryMatchers();
            if (result) {
                this.clearBuffer();
            }
            return result;
        }
        async shouldApplyMatch(result) {
            switch (result.description.applyTo) {
                case problemMatcher_1.ApplyToKind.allDocuments:
                    return true;
                case problemMatcher_1.ApplyToKind.openDocuments:
                    return !!this.openModels[(await result.resource).toString()];
                case problemMatcher_1.ApplyToKind.closedDocuments:
                    return !this.openModels[(await result.resource).toString()];
                default:
                    return true;
            }
        }
        mergeApplyTo(current, value) {
            if (current === value || current === problemMatcher_1.ApplyToKind.allDocuments) {
                return current;
            }
            return problemMatcher_1.ApplyToKind.allDocuments;
        }
        tryMatchers() {
            this.activeMatcher = null;
            const length = this.buffer.length;
            for (let startIndex = 0; startIndex < length; startIndex++) {
                const candidates = this.matchers[length - startIndex];
                if (!candidates) {
                    continue;
                }
                for (const matcher of candidates) {
                    const result = matcher.handle(this.buffer, startIndex);
                    if (result.match) {
                        this.captureMatch(result.match);
                        if (result.continue) {
                            this.activeMatcher = matcher;
                        }
                        return result.match;
                    }
                }
            }
            return null;
        }
        captureMatch(match) {
            this._numberOfMatches++;
            if (this._maxMarkerSeverity === undefined || match.marker.severity > this._maxMarkerSeverity) {
                this._maxMarkerSeverity = match.marker.severity;
            }
        }
        clearBuffer() {
            if (this.buffer.length > 0) {
                this.buffer = [];
            }
        }
        recordResourcesToClean(owner) {
            const resourceSetToClean = this.getResourceSetToClean(owner);
            this.markerService.read({ owner: owner }).forEach(marker => resourceSetToClean.set(marker.resource.toString(), marker.resource));
        }
        recordResourceToClean(owner, resource) {
            this.getResourceSetToClean(owner).set(resource.toString(), resource);
        }
        removeResourceToClean(owner, resource) {
            const resourceSet = this.resourcesToClean.get(owner);
            resourceSet?.delete(resource);
        }
        getResourceSetToClean(owner) {
            let result = this.resourcesToClean.get(owner);
            if (!result) {
                result = new Map();
                this.resourcesToClean.set(owner, result);
            }
            return result;
        }
        cleanAllMarkers() {
            this.resourcesToClean.forEach((value, owner) => {
                this._cleanMarkers(owner, value);
            });
            this.resourcesToClean = new Map();
        }
        cleanMarkers(owner) {
            const toClean = this.resourcesToClean.get(owner);
            if (toClean) {
                this._cleanMarkers(owner, toClean);
                this.resourcesToClean.delete(owner);
            }
        }
        _cleanMarkers(owner, toClean) {
            const uris = [];
            const applyTo = this.applyToByOwner.get(owner);
            toClean.forEach((uri, uriAsString) => {
                if (applyTo === problemMatcher_1.ApplyToKind.allDocuments ||
                    (applyTo === problemMatcher_1.ApplyToKind.openDocuments && this.openModels[uriAsString]) ||
                    (applyTo === problemMatcher_1.ApplyToKind.closedDocuments && !this.openModels[uriAsString])) {
                    uris.push(uri);
                }
            });
            this.markerService.remove(owner, uris);
        }
        recordMarker(marker, owner, resourceAsString) {
            let markersPerOwner = this.markers.get(owner);
            if (!markersPerOwner) {
                markersPerOwner = new Map();
                this.markers.set(owner, markersPerOwner);
            }
            let markersPerResource = markersPerOwner.get(resourceAsString);
            if (!markersPerResource) {
                markersPerResource = new Map();
                markersPerOwner.set(resourceAsString, markersPerResource);
            }
            const key = markers_1.IMarkerData.makeKeyOptionalMessage(marker, false);
            let existingMarker;
            if (!markersPerResource.has(key)) {
                markersPerResource.set(key, marker);
            }
            else if (((existingMarker = markersPerResource.get(key)) !== undefined) && (existingMarker.message.length < marker.message.length) && platform_1.isWindows) {
                // Most likely https://github.com/microsoft/vscode/issues/77475
                // Heuristic dictates that when the key is the same and message is smaller, we have hit this limitation.
                markersPerResource.set(key, marker);
            }
        }
        reportMarkers() {
            this.markers.forEach((markersPerOwner, owner) => {
                const deliveredMarkersPerOwner = this.getDeliveredMarkersPerOwner(owner);
                markersPerOwner.forEach((markers, resource) => {
                    this.deliverMarkersPerOwnerAndResourceResolved(owner, resource, markers, deliveredMarkersPerOwner);
                });
            });
        }
        deliverMarkersPerOwnerAndResource(owner, resource) {
            const markersPerOwner = this.markers.get(owner);
            if (!markersPerOwner) {
                return;
            }
            const deliveredMarkersPerOwner = this.getDeliveredMarkersPerOwner(owner);
            const markersPerResource = markersPerOwner.get(resource);
            if (!markersPerResource) {
                return;
            }
            this.deliverMarkersPerOwnerAndResourceResolved(owner, resource, markersPerResource, deliveredMarkersPerOwner);
        }
        deliverMarkersPerOwnerAndResourceResolved(owner, resource, markers, reported) {
            if (markers.size !== reported.get(resource)) {
                const toSet = [];
                markers.forEach(value => toSet.push(value));
                this.markerService.changeOne(owner, uri_1.URI.parse(resource), toSet);
                reported.set(resource, markers.size);
            }
        }
        getDeliveredMarkersPerOwner(owner) {
            let result = this.deliveredMarkers.get(owner);
            if (!result) {
                result = new Map();
                this.deliveredMarkers.set(owner, result);
            }
            return result;
        }
        cleanMarkerCaches() {
            this._numberOfMatches = 0;
            this._maxMarkerSeverity = undefined;
            this.markers.clear();
            this.deliveredMarkers.clear();
        }
        done() {
            this.reportMarkers();
            this.cleanAllMarkers();
        }
    }
    exports.AbstractProblemCollector = AbstractProblemCollector;
    var ProblemHandlingStrategy;
    (function (ProblemHandlingStrategy) {
        ProblemHandlingStrategy[ProblemHandlingStrategy["Clean"] = 0] = "Clean";
    })(ProblemHandlingStrategy || (exports.ProblemHandlingStrategy = ProblemHandlingStrategy = {}));
    class StartStopProblemCollector extends AbstractProblemCollector {
        constructor(problemMatchers, markerService, modelService, _strategy = 0 /* ProblemHandlingStrategy.Clean */, fileService) {
            super(problemMatchers, markerService, modelService, fileService);
            const ownerSet = Object.create(null);
            problemMatchers.forEach(description => ownerSet[description.owner] = true);
            this.owners = Object.keys(ownerSet);
            this.owners.forEach((owner) => {
                this.recordResourcesToClean(owner);
            });
        }
        async processLineInternal(line) {
            const markerMatch = this.tryFindMarker(line);
            if (!markerMatch) {
                return;
            }
            const owner = markerMatch.description.owner;
            const resource = await markerMatch.resource;
            const resourceAsString = resource.toString();
            this.removeResourceToClean(owner, resourceAsString);
            const shouldApplyMatch = await this.shouldApplyMatch(markerMatch);
            if (shouldApplyMatch) {
                this.recordMarker(markerMatch.marker, owner, resourceAsString);
                if (this.currentOwner !== owner || this.currentResource !== resourceAsString) {
                    if (this.currentOwner && this.currentResource) {
                        this.deliverMarkersPerOwnerAndResource(this.currentOwner, this.currentResource);
                    }
                    this.currentOwner = owner;
                    this.currentResource = resourceAsString;
                }
            }
        }
    }
    exports.StartStopProblemCollector = StartStopProblemCollector;
    class WatchingProblemCollector extends AbstractProblemCollector {
        constructor(problemMatchers, markerService, modelService, fileService) {
            super(problemMatchers, markerService, modelService, fileService);
            this.lines = [];
            this.beginPatterns = [];
            this.resetCurrentResource();
            this.backgroundPatterns = [];
            this._activeBackgroundMatchers = new Set();
            this.problemMatchers.forEach(matcher => {
                if (matcher.watching) {
                    const key = (0, uuid_1.generateUuid)();
                    this.backgroundPatterns.push({
                        key,
                        matcher: matcher,
                        begin: matcher.watching.beginsPattern,
                        end: matcher.watching.endsPattern
                    });
                    this.beginPatterns.push(matcher.watching.beginsPattern.regexp);
                }
            });
            this.modelListeners.add(this.modelService.onModelRemoved(modelEvent => {
                let markerChanged = event_1.Event.debounce(this.markerService.onMarkerChanged, (last, e) => {
                    return (last ?? []).concat(e);
                }, 500, false, true)(async (markerEvent) => {
                    markerChanged?.dispose();
                    markerChanged = undefined;
                    if (!markerEvent || !markerEvent.includes(modelEvent.uri) || (this.markerService.read({ resource: modelEvent.uri }).length !== 0)) {
                        return;
                    }
                    const oldLines = Array.from(this.lines);
                    for (const line of oldLines) {
                        await this.processLineInternal(line);
                    }
                });
                setTimeout(async () => {
                    // Calling dispose below can trigger the debounce event (via flushOnListenerRemove), so we
                    // have to unset markerChanged first to make sure the handler above doesn't dispose it again.
                    const _markerChanged = markerChanged;
                    markerChanged = undefined;
                    _markerChanged?.dispose();
                }, 600);
            }));
        }
        aboutToStart() {
            for (const background of this.backgroundPatterns) {
                if (background.matcher.watching && background.matcher.watching.activeOnStart) {
                    this._activeBackgroundMatchers.add(background.key);
                    this._onDidStateChange.fire(IProblemCollectorEvent.create("backgroundProcessingBegins" /* ProblemCollectorEventKind.BackgroundProcessingBegins */));
                    this.recordResourcesToClean(background.matcher.owner);
                }
            }
        }
        async processLineInternal(line) {
            if (await this.tryBegin(line) || this.tryFinish(line)) {
                return;
            }
            this.lines.push(line);
            const markerMatch = this.tryFindMarker(line);
            if (!markerMatch) {
                return;
            }
            const resource = await markerMatch.resource;
            const owner = markerMatch.description.owner;
            const resourceAsString = resource.toString();
            this.removeResourceToClean(owner, resourceAsString);
            const shouldApplyMatch = await this.shouldApplyMatch(markerMatch);
            if (shouldApplyMatch) {
                this.recordMarker(markerMatch.marker, owner, resourceAsString);
                if (this.currentOwner !== owner || this.currentResource !== resourceAsString) {
                    this.reportMarkersForCurrentResource();
                    this.currentOwner = owner;
                    this.currentResource = resourceAsString;
                }
            }
        }
        forceDelivery() {
            this.reportMarkersForCurrentResource();
        }
        async tryBegin(line) {
            let result = false;
            for (const background of this.backgroundPatterns) {
                const matches = background.begin.regexp.exec(line);
                if (matches) {
                    if (this._activeBackgroundMatchers.has(background.key)) {
                        continue;
                    }
                    this._activeBackgroundMatchers.add(background.key);
                    result = true;
                    this._onDidFindFirstMatch.fire();
                    this.lines = [];
                    this.lines.push(line);
                    this._onDidStateChange.fire(IProblemCollectorEvent.create("backgroundProcessingBegins" /* ProblemCollectorEventKind.BackgroundProcessingBegins */));
                    this.cleanMarkerCaches();
                    this.resetCurrentResource();
                    const owner = background.matcher.owner;
                    const file = matches[background.begin.file];
                    if (file) {
                        const resource = (0, problemMatcher_1.getResource)(file, background.matcher);
                        this.recordResourceToClean(owner, await resource);
                    }
                    else {
                        this.recordResourcesToClean(owner);
                    }
                }
            }
            return result;
        }
        tryFinish(line) {
            let result = false;
            for (const background of this.backgroundPatterns) {
                const matches = background.end.regexp.exec(line);
                if (matches) {
                    if (this._numberOfMatches > 0) {
                        this._onDidFindErrors.fire();
                    }
                    else {
                        this._onDidRequestInvalidateLastMarker.fire();
                    }
                    if (this._activeBackgroundMatchers.has(background.key)) {
                        this._activeBackgroundMatchers.delete(background.key);
                        this.resetCurrentResource();
                        this._onDidStateChange.fire(IProblemCollectorEvent.create("backgroundProcessingEnds" /* ProblemCollectorEventKind.BackgroundProcessingEnds */));
                        result = true;
                        this.lines.push(line);
                        const owner = background.matcher.owner;
                        this.cleanMarkers(owner);
                        this.cleanMarkerCaches();
                    }
                }
            }
            return result;
        }
        resetCurrentResource() {
            this.reportMarkersForCurrentResource();
            this.currentOwner = undefined;
            this.currentResource = undefined;
        }
        reportMarkersForCurrentResource() {
            if (this.currentOwner && this.currentResource) {
                this.deliverMarkersPerOwnerAndResource(this.currentOwner, this.currentResource);
            }
        }
        done() {
            [...this.applyToByOwner.keys()].forEach(owner => {
                this.recordResourcesToClean(owner);
            });
            super.done();
        }
        isWatching() {
            return this.backgroundPatterns.length > 0;
        }
    }
    exports.WatchingProblemCollector = WatchingProblemCollector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvYmxlbUNvbGxlY3RvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YXNrcy9jb21tb24vcHJvYmxlbUNvbGxlY3RvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLElBQWtCLHlCQUdqQjtJQUhELFdBQWtCLHlCQUF5QjtRQUMxQyxzRkFBeUQsQ0FBQTtRQUN6RCxrRkFBcUQsQ0FBQTtJQUN0RCxDQUFDLEVBSGlCLHlCQUF5Qix5Q0FBekIseUJBQXlCLFFBRzFDO0lBTUQsSUFBVSxzQkFBc0IsQ0FJL0I7SUFKRCxXQUFVLHNCQUFzQjtRQUMvQixTQUFnQixNQUFNLENBQUMsSUFBK0I7WUFDckQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRmUsNkJBQU0sU0FFckIsQ0FBQTtJQUNGLENBQUMsRUFKUyxzQkFBc0IsS0FBdEIsc0JBQXNCLFFBSS9CO0lBTUQsTUFBc0Isd0JBQXlCLFNBQVEsc0JBQVU7UUFnQ2hFLFlBQTRCLGVBQWlDLEVBQVksYUFBNkIsRUFBWSxZQUEyQixFQUFFLFdBQTBCO1lBQ3hLLEtBQUssRUFBRSxDQUFDO1lBRG1CLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUFZLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUFZLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBdkIxSCxtQkFBYyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBY3ZDLHlCQUFvQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDckQsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUU1QyxxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ2pELG9C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