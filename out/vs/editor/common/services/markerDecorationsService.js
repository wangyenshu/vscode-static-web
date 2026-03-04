/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/markers/common/markers", "vs/base/common/lifecycle", "vs/editor/common/model", "vs/platform/theme/common/themeService", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/services/model", "vs/editor/common/core/range", "vs/base/common/network", "vs/base/common/event", "vs/platform/theme/common/colorRegistry", "vs/base/common/map", "vs/base/common/collections"], function (require, exports, markers_1, lifecycle_1, model_1, themeService_1, editorColorRegistry_1, model_2, range_1, network_1, event_1, colorRegistry_1, map_1, collections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerDecorationsService = void 0;
    let MarkerDecorationsService = class MarkerDecorationsService extends lifecycle_1.Disposable {
        constructor(modelService, _markerService) {
            super();
            this._markerService = _markerService;
            this._onDidChangeMarker = this._register(new event_1.Emitter());
            this.onDidChangeMarker = this._onDidChangeMarker.event;
            this._markerDecorations = new map_1.ResourceMap();
            modelService.getModels().forEach(model => this._onModelAdded(model));
            this._register(modelService.onModelAdded(this._onModelAdded, this));
            this._register(modelService.onModelRemoved(this._onModelRemoved, this));
            this._register(this._markerService.onMarkerChanged(this._handleMarkerChange, this));
        }
        dispose() {
            super.dispose();
            this._markerDecorations.forEach(value => value.dispose());
            this._markerDecorations.clear();
        }
        getMarker(uri, decoration) {
            const markerDecorations = this._markerDecorations.get(uri);
            return markerDecorations ? (markerDecorations.getMarker(decoration) || null) : null;
        }
        getLiveMarkers(uri) {
            const markerDecorations = this._markerDecorations.get(uri);
            return markerDecorations ? markerDecorations.getMarkers() : [];
        }
        _handleMarkerChange(changedResources) {
            changedResources.forEach((resource) => {
                const markerDecorations = this._markerDecorations.get(resource);
                if (markerDecorations) {
                    this._updateDecorations(markerDecorations);
                }
            });
        }
        _onModelAdded(model) {
            const markerDecorations = new MarkerDecorations(model);
            this._markerDecorations.set(model.uri, markerDecorations);
            this._updateDecorations(markerDecorations);
        }
        _onModelRemoved(model) {
            const markerDecorations = this._markerDecorations.get(model.uri);
            if (markerDecorations) {
                markerDecorations.dispose();
                this._markerDecorations.delete(model.uri);
            }
            // clean up markers for internal, transient models
            if (model.uri.scheme === network_1.Schemas.inMemory
                || model.uri.scheme === network_1.Schemas.internal
                || model.uri.scheme === network_1.Schemas.vscode) {
                this._markerService?.read({ resource: model.uri }).map(marker => marker.owner).forEach(owner => this._markerService.remove(owner, [model.uri]));
            }
        }
        _updateDecorations(markerDecorations) {
            // Limit to the first 500 errors/warnings
            const markers = this._markerService.read({ resource: markerDecorations.model.uri, take: 500 });
            if (markerDecorations.update(markers)) {
                this._onDidChangeMarker.fire(markerDecorations.model);
            }
        }
    };
    exports.MarkerDecorationsService = MarkerDecorationsService;
    exports.MarkerDecorationsService = MarkerDecorationsService = __decorate([
        __param(0, model_2.IModelService),
        __param(1, markers_1.IMarkerService)
    ], MarkerDecorationsService);
    class MarkerDecorations extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this._map = new map_1.BidirectionalMap();
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.model.deltaDecorations([...this._map.values()], []);
                this._map.clear();
            }));
        }
        update(markers) {
            // We use the fact that marker instances are not recreated when different owners
            // update. So we can compare references to find out what changed since the last update.
            const { added, removed } = (0, collections_1.diffSets)(new Set(this._map.keys()), new Set(markers));
            if (added.length === 0 && removed.length === 0) {
                return false;
            }
            const oldIds = removed.map(marker => this._map.get(marker));
            const newDecorations = added.map(marker => {
                return {
                    range: this._createDecorationRange(this.model, marker),
                    options: this._createDecorationOption(marker)
                };
            });
            const ids = this.model.deltaDecorations(oldIds, newDecorations);
            for (const removedMarker of removed) {
                this._map.delete(removedMarker);
            }
            for (let index = 0; index < ids.length; index++) {
                this._map.set(added[index], ids[index]);
            }
            return true;
        }
        getMarker(decoration) {
            return this._map.getKey(decoration.id);
        }
        getMarkers() {
            const res = [];
            this._map.forEach((id, marker) => {
                const range = this.model.getDecorationRange(id);
                if (range) {
                    res.push([range, marker]);
                }
            });
            return res;
        }
        _createDecorationRange(model, rawMarker) {
            let ret = range_1.Range.lift(rawMarker);
            if (rawMarker.severity === markers_1.MarkerSeverity.Hint && !this._hasMarkerTag(rawMarker, 1 /* MarkerTag.Unnecessary */) && !this._hasMarkerTag(rawMarker, 2 /* MarkerTag.Deprecated */)) {
                // * never render hints on multiple lines
                // * make enough space for three dots
                ret = ret.setEndPosition(ret.startLineNumber, ret.startColumn + 2);
            }
            ret = model.validateRange(ret);
            if (ret.isEmpty()) {
                const maxColumn = model.getLineLastNonWhitespaceColumn(ret.startLineNumber) ||
                    model.getLineMaxColumn(ret.startLineNumber);
                if (maxColumn === 1 || ret.endColumn >= maxColumn) {
                    // empty line or behind eol
                    // keep the range as is, it will be rendered 1ch wide
                    return ret;
                }
                const word = model.getWordAtPosition(ret.getStartPosition());
                if (word) {
                    ret = new range_1.Range(ret.startLineNumber, word.startColumn, ret.endLineNumber, word.endColumn);
                }
            }
            else if (rawMarker.endColumn === Number.MAX_VALUE && rawMarker.startColumn === 1 && ret.startLineNumber === ret.endLineNumber) {
                const minColumn = model.getLineFirstNonWhitespaceColumn(rawMarker.startLineNumber);
                if (minColumn < ret.endColumn) {
                    ret = new range_1.Range(ret.startLineNumber, minColumn, ret.endLineNumber, ret.endColumn);
                    rawMarker.startColumn = minColumn;
                }
            }
            return ret;
        }
        _createDecorationOption(marker) {
            let className;
            let color = undefined;
            let zIndex;
            let inlineClassName = undefined;
            let minimap;
            switch (marker.severity) {
                case markers_1.MarkerSeverity.Hint:
                    if (this._hasMarkerTag(marker, 2 /* MarkerTag.Deprecated */)) {
                        className = undefined;
                    }
                    else if (this._hasMarkerTag(marker, 1 /* MarkerTag.Unnecessary */)) {
                        className = "squiggly-unnecessary" /* ClassName.EditorUnnecessaryDecoration */;
                    }
                    else {
                        className = "squiggly-hint" /* ClassName.EditorHintDecoration */;
                    }
                    zIndex = 0;
                    break;
                case markers_1.MarkerSeverity.Info:
                    className = "squiggly-info" /* ClassName.EditorInfoDecoration */;
                    color = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerInfo);
                    zIndex = 10;
                    minimap = {
                        color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapInfo),
                        position: 1 /* MinimapPosition.Inline */
                    };
                    break;
                case markers_1.MarkerSeverity.Warning:
                    className = "squiggly-warning" /* ClassName.EditorWarningDecoration */;
                    color = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerWarning);
                    zIndex = 20;
                    minimap = {
                        color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapWarning),
                        position: 1 /* MinimapPosition.Inline */
                    };
                    break;
                case markers_1.MarkerSeverity.Error:
                default:
                    className = "squiggly-error" /* ClassName.EditorErrorDecoration */;
                    color = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerError);
                    zIndex = 30;
                    minimap = {
                        color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapError),
                        position: 1 /* MinimapPosition.Inline */
                    };
                    break;
            }
            if (marker.tags) {
                if (marker.tags.indexOf(1 /* MarkerTag.Unnecessary */) !== -1) {
                    inlineClassName = "squiggly-inline-unnecessary" /* ClassName.EditorUnnecessaryInlineDecoration */;
                }
                if (marker.tags.indexOf(2 /* MarkerTag.Deprecated */) !== -1) {
                    inlineClassName = "squiggly-inline-deprecated" /* ClassName.EditorDeprecatedInlineDecoration */;
                }
            }
            return {
                description: 'marker-decoration',
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                className,
                showIfCollapsed: true,
                overviewRuler: {
                    color,
                    position: model_1.OverviewRulerLane.Right
                },
                minimap,
                zIndex,
                inlineClassName,
            };
        }
        _hasMarkerTag(marker, tag) {
            if (marker.tags) {
                return marker.tags.indexOf(tag) >= 0;
            }
            return false;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VyRGVjb3JhdGlvbnNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy9tYXJrZXJEZWNvcmF0aW9uc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO1FBU3ZELFlBQ2dCLFlBQTJCLEVBQzFCLGNBQStDO1lBRS9ELEtBQUssRUFBRSxDQUFDO1lBRnlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQVAvQyx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFjLENBQUMsQ0FBQztZQUN2RSxzQkFBaUIsR0FBc0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUU3RCx1QkFBa0IsR0FBRyxJQUFJLGlCQUFXLEVBQXFCLENBQUM7WUFPMUUsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNy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