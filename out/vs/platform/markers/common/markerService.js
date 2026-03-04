/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/map", "vs/base/common/network", "vs/base/common/uri", "./markers"], function (require, exports, arrays_1, event_1, iterator_1, map_1, network_1, uri_1, markers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerService = exports.unsupportedSchemas = void 0;
    exports.unsupportedSchemas = new Set([
        network_1.Schemas.inMemory,
        network_1.Schemas.vscodeSourceControl,
        network_1.Schemas.walkThrough,
        network_1.Schemas.walkThroughSnippet,
        network_1.Schemas.vscodeChatCodeBlock,
    ]);
    class DoubleResourceMap {
        constructor() {
            this._byResource = new map_1.ResourceMap();
            this._byOwner = new Map();
        }
        set(resource, owner, value) {
            let ownerMap = this._byResource.get(resource);
            if (!ownerMap) {
                ownerMap = new Map();
                this._byResource.set(resource, ownerMap);
            }
            ownerMap.set(owner, value);
            let resourceMap = this._byOwner.get(owner);
            if (!resourceMap) {
                resourceMap = new map_1.ResourceMap();
                this._byOwner.set(owner, resourceMap);
            }
            resourceMap.set(resource, value);
        }
        get(resource, owner) {
            const ownerMap = this._byResource.get(resource);
            return ownerMap?.get(owner);
        }
        delete(resource, owner) {
            let removedA = false;
            let removedB = false;
            const ownerMap = this._byResource.get(resource);
            if (ownerMap) {
                removedA = ownerMap.delete(owner);
            }
            const resourceMap = this._byOwner.get(owner);
            if (resourceMap) {
                removedB = resourceMap.delete(resource);
            }
            if (removedA !== removedB) {
                throw new Error('illegal state');
            }
            return removedA && removedB;
        }
        values(key) {
            if (typeof key === 'string') {
                return this._byOwner.get(key)?.values() ?? iterator_1.Iterable.empty();
            }
            if (uri_1.URI.isUri(key)) {
                return this._byResource.get(key)?.values() ?? iterator_1.Iterable.empty();
            }
            return iterator_1.Iterable.map(iterator_1.Iterable.concat(...this._byOwner.values()), map => map[1]);
        }
    }
    class MarkerStats {
        constructor(service) {
            this.errors = 0;
            this.infos = 0;
            this.warnings = 0;
            this.unknowns = 0;
            this._data = new map_1.ResourceMap();
            this._service = service;
            this._subscription = service.onMarkerChanged(this._update, this);
        }
        dispose() {
            this._subscription.dispose();
        }
        _update(resources) {
            for (const resource of resources) {
                const oldStats = this._data.get(resource);
                if (oldStats) {
                    this._substract(oldStats);
                }
                const newStats = this._resourceStats(resource);
                this._add(newStats);
                this._data.set(resource, newStats);
            }
        }
        _resourceStats(resource) {
            const result = { errors: 0, warnings: 0, infos: 0, unknowns: 0 };
            // TODO this is a hack
            if (exports.unsupportedSchemas.has(resource.scheme)) {
                return result;
            }
            for (const { severity } of this._service.read({ resource })) {
                if (severity === markers_1.MarkerSeverity.Error) {
                    result.errors += 1;
                }
                else if (severity === markers_1.MarkerSeverity.Warning) {
                    result.warnings += 1;
                }
                else if (severity === markers_1.MarkerSeverity.Info) {
                    result.infos += 1;
                }
                else {
                    result.unknowns += 1;
                }
            }
            return result;
        }
        _substract(op) {
            this.errors -= op.errors;
            this.warnings -= op.warnings;
            this.infos -= op.infos;
            this.unknowns -= op.unknowns;
        }
        _add(op) {
            this.errors += op.errors;
            this.warnings += op.warnings;
            this.infos += op.infos;
            this.unknowns += op.unknowns;
        }
    }
    class MarkerService {
        constructor() {
            this._onMarkerChanged = new event_1.DebounceEmitter({
                delay: 0,
                merge: MarkerService._merge
            });
            this.onMarkerChanged = this._onMarkerChanged.event;
            this._data = new DoubleResourceMap();
            this._stats = new MarkerStats(this);
        }
        dispose() {
            this._stats.dispose();
            this._onMarkerChanged.dispose();
        }
        getStatistics() {
            return this._stats;
        }
        remove(owner, resources) {
            for (const resource of resources || []) {
                this.changeOne(owner, resource, []);
            }
        }
        changeOne(owner, resource, markerData) {
            if ((0, arrays_1.isFalsyOrEmpty)(markerData)) {
                // remove marker for this (owner,resource)-tuple
                const removed = this._data.delete(resource, owner);
                if (removed) {
                    this._onMarkerChanged.fire([resource]);
                }
            }
            else {
                // insert marker for this (owner,resource)-tuple
                const markers = [];
                for (const data of markerData) {
                    const marker = MarkerService._toMarker(owner, resource, data);
                    if (marker) {
                        markers.push(marker);
                    }
                }
                this._data.set(resource, owner, markers);
                this._onMarkerChanged.fire([resource]);
            }
        }
        static _toMarker(owner, resource, data) {
            let { code, severity, message, source, startLineNumber, startColumn, endLineNumber, endColumn, relatedInformation, tags, } = data;
            if (!message) {
                return undefined;
            }
            // santize data
            startLineNumber = startLineNumber > 0 ? startLineNumber : 1;
            startColumn = startColumn > 0 ? startColumn : 1;
            endLineNumber = endLineNumber >= startLineNumber ? endLineNumber : startLineNumber;
            endColumn = endColumn > 0 ? endColumn : startColumn;
            return {
                resource,
                owner,
                code,
                severity,
                message,
                source,
                startLineNumber,
                startColumn,
                endLineNumber,
                endColumn,
                relatedInformation,
                tags,
            };
        }
        changeAll(owner, data) {
            const changes = [];
            // remove old marker
            const existing = this._data.values(owner);
            if (existing) {
                for (const data of existing) {
                    const first = iterator_1.Iterable.first(data);
                    if (first) {
                        changes.push(first.resource);
                        this._data.delete(first.resource, owner);
                    }
                }
            }
            // add new markers
            if ((0, arrays_1.isNonEmptyArray)(data)) {
                // group by resource
                const groups = new map_1.ResourceMap();
                for (const { resource, marker: markerData } of data) {
                    const marker = MarkerService._toMarker(owner, resource, markerData);
                    if (!marker) {
                        // filter bad markers
                        continue;
                    }
                    const array = groups.get(resource);
                    if (!array) {
                        groups.set(resource, [marker]);
                        changes.push(resource);
                    }
                    else {
                        array.push(marker);
                    }
                }
                // insert all
                for (const [resource, value] of groups) {
                    this._data.set(resource, owner, value);
                }
            }
            if (changes.length > 0) {
                this._onMarkerChanged.fire(changes);
            }
        }
        read(filter = Object.create(null)) {
            let { owner, resource, severities, take } = filter;
            if (!take || take < 0) {
                take = -1;
            }
            if (owner && resource) {
                // exactly one owner AND resource
                const data = this._data.get(resource, owner);
                if (!data) {
                    return [];
                }
                else {
                    const result = [];
                    for (const marker of data) {
                        if (MarkerService._accept(marker, severities)) {
                            const newLen = result.push(marker);
                            if (take > 0 && newLen === take) {
                                break;
                            }
                        }
                    }
                    return result;
                }
            }
            else if (!owner && !resource) {
                // all
                const result = [];
                for (const markers of this._data.values()) {
                    for (const data of markers) {
                        if (MarkerService._accept(data, severities)) {
                            const newLen = result.push(data);
                            if (take > 0 && newLen === take) {
                                return result;
                            }
                        }
                    }
                }
                return result;
            }
            else {
                // of one resource OR owner
                const iterable = this._data.values(resource ?? owner);
                const result = [];
                for (const markers of iterable) {
                    for (const data of markers) {
                        if (MarkerService._accept(data, severities)) {
                            const newLen = result.push(data);
                            if (take > 0 && newLen === take) {
                                return result;
                            }
                        }
                    }
                }
                return result;
            }
        }
        static _accept(marker, severities) {
            return severities === undefined || (severities & marker.severity) === marker.severity;
        }
        // --- event debounce logic
        static _merge(all) {
            const set = new map_1.ResourceMap();
            for (const array of all) {
                for (const item of array) {
                    set.set(item, true);
                }
            }
            return Array.from(set.keys());
        }
    }
    exports.MarkerService = MarkerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL21hcmtlcnMvY29tbW9uL21hcmtlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV25GLFFBQUEsa0JBQWtCLEdBQUcsSUFBSSxHQUFHLENBQUM7UUFDekMsaUJBQU8sQ0FBQyxRQUFRO1FBQ2hCLGlCQUFPLENBQUMsbUJBQW1CO1FBQzNCLGlCQUFPLENBQUMsV0FBVztRQUNuQixpQkFBTyxDQUFDLGtCQUFrQjtRQUMxQixpQkFBTyxDQUFDLG1CQUFtQjtLQUMzQixDQUFDLENBQUM7SUFFSCxNQUFNLGlCQUFpQjtRQUF2QjtZQUVTLGdCQUFXLEdBQUcsSUFBSSxpQkFBVyxFQUFrQixDQUFDO1lBQ2hELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztRQWtEdEQsQ0FBQztRQWhEQSxHQUFHLENBQUMsUUFBYSxFQUFFLEtBQWEsRUFBRSxLQUFRO1lBQ3pDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUzQixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xCLFdBQVcs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