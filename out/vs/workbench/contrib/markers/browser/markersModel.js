/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/editor/common/core/range", "vs/platform/markers/common/markers", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/strings", "vs/platform/markers/common/markerService"], function (require, exports, resources_1, range_1, markers_1, arrays_1, map_1, event_1, hash_1, strings_1, markerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersModel = exports.RelatedInformation = exports.MarkerTableItem = exports.Marker = exports.ResourceMarkers = void 0;
    exports.compareMarkersByUri = compareMarkersByUri;
    function compareMarkersByUri(a, b) {
        return resources_1.extUri.compare(a.resource, b.resource);
    }
    function compareResourceMarkers(a, b) {
        const [firstMarkerOfA] = a.markers;
        const [firstMarkerOfB] = b.markers;
        let res = 0;
        if (firstMarkerOfA && firstMarkerOfB) {
            res = markers_1.MarkerSeverity.compare(firstMarkerOfA.marker.severity, firstMarkerOfB.marker.severity);
        }
        if (res === 0) {
            res = a.path.localeCompare(b.path) || a.name.localeCompare(b.name);
        }
        return res;
    }
    class ResourceMarkers {
        constructor(id, resource) {
            this.id = id;
            this.resource = resource;
            this._markersMap = new map_1.ResourceMap();
            this._total = 0;
            this.path = this.resource.fsPath;
            this.name = (0, resources_1.basename)(this.resource);
        }
        get markers() {
            if (!this._cachedMarkers) {
                this._cachedMarkers = (0, arrays_1.flatten)([...this._markersMap.values()]).sort(ResourceMarkers._compareMarkers);
            }
            return this._cachedMarkers;
        }
        has(uri) {
            return this._markersMap.has(uri);
        }
        set(uri, marker) {
            this.delete(uri);
            if ((0, arrays_1.isNonEmptyArray)(marker)) {
                this._markersMap.set(uri, marker);
                this._total += marker.length;
                this._cachedMarkers = undefined;
            }
        }
        delete(uri) {
            const array = this._markersMap.get(uri);
            if (array) {
                this._total -= array.length;
                this._cachedMarkers = undefined;
                this._markersMap.delete(uri);
            }
        }
        get total() {
            return this._total;
        }
        static _compareMarkers(a, b) {
            return markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity)
                || resources_1.extUri.compare(a.resource, b.resource)
                || range_1.Range.compareRangesUsingStarts(a.marker, b.marker);
        }
    }
    exports.ResourceMarkers = ResourceMarkers;
    class Marker {
        get resource() { return this.marker.resource; }
        get range() { return this.marker; }
        get lines() {
            if (!this._lines) {
                this._lines = (0, strings_1.splitLines)(this.marker.message);
            }
            return this._lines;
        }
        constructor(id, marker, relatedInformation = []) {
            this.id = id;
            this.marker = marker;
            this.relatedInformation = relatedInformation;
        }
        toString() {
            return JSON.stringify({
                ...this.marker,
                resource: this.marker.resource.path,
                relatedInformation: this.relatedInformation.length ? this.relatedInformation.map(r => ({ ...r.raw, resource: r.raw.resource.path })) : undefined
            }, null, '\t');
        }
    }
    exports.Marker = Marker;
    class MarkerTableItem extends Marker {
        constructor(marker, sourceMatches, codeMatches, messageMatches, fileMatches, ownerMatches) {
            super(marker.id, marker.marker, marker.relatedInformation);
            this.sourceMatches = sourceMatches;
            this.codeMatches = codeMatches;
            this.messageMatches = messageMatches;
            this.fileMatches = fileMatches;
            this.ownerMatches = ownerMatches;
        }
    }
    exports.MarkerTableItem = MarkerTableItem;
    class RelatedInformation {
        constructor(id, marker, raw) {
            this.id = id;
            this.marker = marker;
            this.raw = raw;
        }
    }
    exports.RelatedInformation = RelatedInformation;
    class MarkersModel {
        get resourceMarkers() {
            if (!this.cachedSortedResources) {
                this.cachedSortedResources = [...this.resourcesByUri.values()].sort(compareResourceMarkers);
            }
            return this.cachedSortedResources;
        }
        constructor() {
            this.cachedSortedResources = undefined;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._total = 0;
            this.resourcesByUri = new Map();
        }
        reset() {
            const removed = new Set();
            for (const resourceMarker of this.resourcesByUri.values()) {
                removed.add(resourceMarker);
            }
            this.resourcesByUri.clear();
            this._total = 0;
            this._onDidChange.fire({ removed, added: new Set(), updated: new Set() });
        }
        get total() {
            return this._total;
        }
        getResourceMarkers(resource) {
            return this.resourcesByUri.get(resources_1.extUri.getComparisonKey(resource, true)) ?? null;
        }
        setResourceMarkers(resourcesMarkers) {
            const change = { added: new Set(), removed: new Set(), updated: new Set() };
            for (const [resource, rawMarkers] of resourcesMarkers) {
                if (markerService_1.unsupportedSchemas.has(resource.scheme)) {
                    continue;
                }
                const key = resources_1.extUri.getComparisonKey(resource, true);
                let resourceMarkers = this.resourcesByUri.get(key);
                if ((0, arrays_1.isNonEmptyArray)(rawMarkers)) {
                    // update, add
                    if (!resourceMarkers) {
                        const resourceMarkersId = this.id(resource.toString());
                        resourceMarkers = new ResourceMarkers(resourceMarkersId, resource.with({ fragment: null }));
                        this.resourcesByUri.set(key, resourceMarkers);
                        change.added.add(resourceMarkers);
                    }
                    else {
                        change.updated.add(resourceMarkers);
                    }
                    const markersCountByKey = new Map();
                    const markers = rawMarkers.map((rawMarker) => {
                        const key = markers_1.IMarkerData.makeKey(rawMarker);
                        const index = markersCountByKey.get(key) || 0;
                        markersCountByKey.set(key, index + 1);
                        const markerId = this.id(resourceMarkers.id, key, index, rawMarker.resource.toString());
                        let relatedInformation = undefined;
                        if (rawMarker.relatedInformation) {
                            relatedInformation = rawMarker.relatedInformation.map((r, index) => new RelatedInformation(this.id(markerId, r.resource.toString(), r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn, index), rawMarker, r));
                        }
                        return new Marker(markerId, rawMarker, relatedInformation);
                    });
                    this._total -= resourceMarkers.total;
                    resourceMarkers.set(resource, markers);
                    this._total += resourceMarkers.total;
                }
                else if (resourceMarkers) {
                    // clear
                    this._total -= resourceMarkers.total;
                    resourceMarkers.delete(resource);
                    this._total += resourceMarkers.total;
                    if (resourceMarkers.total === 0) {
                        this.resourcesByUri.delete(key);
                        change.removed.add(resourceMarkers);
                    }
                    else {
                        change.updated.add(resourceMarkers);
                    }
                }
            }
            this.cachedSortedResources = undefined;
            if (change.added.size || change.removed.size || change.updated.size) {
                this._onDidChange.fire(change);
            }
        }
        id(...values) {
            const hasher = new hash_1.Hasher();
            for (const value of values) {
                hasher.hash(value);
            }
            return `${hasher.value}`;
        }
        dispose() {
            this._onDidChange.dispose();
            this.resourcesByUri.clear();
        }
    }
    exports.MarkersModel = MarkersModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWFya2Vycy9icm93c2VyL21hcmtlcnNNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLGtEQUVDO0lBRkQsU0FBZ0IsbUJBQW1CLENBQUMsQ0FBVSxFQUFFLENBQVU7UUFDekQsT0FBTyxrQkFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsU0FBUyxzQkFBc0IsQ0FBQyxDQUFrQixFQUFFLENBQWtCO1FBQ3JFLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ25DLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ25DLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNaLElBQUksY0FBYyxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ3RDLEdBQUcsR0FBRyx3QkFBYyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFDRCxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNmLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUM7SUFHRCxNQUFhLGVBQWU7UUFV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