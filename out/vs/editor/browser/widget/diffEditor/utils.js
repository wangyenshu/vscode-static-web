/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/cancellation", "vs/base/common/hotReload", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/config/elementSizeObserver", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, arraysFind_1, cancellation_1, hotReload_1, lifecycle_1, observable_1, elementSizeObserver_1, position_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisposableCancellationTokenSource = exports.ManagedOverlayWidget = exports.PlaceholderViewZone = exports.ViewZoneOverlayWidget = exports.ObservableElementSizeObserver = void 0;
    exports.joinCombine = joinCombine;
    exports.applyObservableDecorations = applyObservableDecorations;
    exports.appendRemoveOnDispose = appendRemoveOnDispose;
    exports.prependRemoveOnDispose = prependRemoveOnDispose;
    exports.observableConfigValue = observableConfigValue;
    exports.animatedObservable = animatedObservable;
    exports.deepMerge = deepMerge;
    exports.applyStyle = applyStyle;
    exports.readHotReloadableExport = readHotReloadableExport;
    exports.observeHotReloadableExports = observeHotReloadableExports;
    exports.applyViewZones = applyViewZones;
    exports.translatePosition = translatePosition;
    exports.bindContextKey = bindContextKey;
    exports.filterWithPrevious = filterWithPrevious;
    function joinCombine(arr1, arr2, keySelector, combine) {
        if (arr1.length === 0) {
            return arr2;
        }
        if (arr2.length === 0) {
            return arr1;
        }
        const result = [];
        let i = 0;
        let j = 0;
        while (i < arr1.length && j < arr2.length) {
            const val1 = arr1[i];
            const val2 = arr2[j];
            const key1 = keySelector(val1);
            const key2 = keySelector(val2);
            if (key1 < key2) {
                result.push(val1);
                i++;
            }
            else if (key1 > key2) {
                result.push(val2);
                j++;
            }
            else {
                result.push(combine(val1, val2));
                i++;
                j++;
            }
        }
        while (i < arr1.length) {
            result.push(arr1[i]);
            i++;
        }
        while (j < arr2.length) {
            result.push(arr2[j]);
            j++;
        }
        return result;
    }
    // TODO make utility
    function applyObservableDecorations(editor, decorations) {
        const d = new lifecycle_1.DisposableStore();
        const decorationsCollection = editor.createDecorationsCollection();
        d.add((0, observable_1.autorunOpts)({ debugName: () => `Apply decorations from ${decorations.debugName}` }, reader => {
            const d = decorations.read(reader);
            decorationsCollection.set(d);
        }));
        d.add({
            dispose: () => {
                decorationsCollection.clear();
            }
        });
        return d;
    }
    function appendRemoveOnDispose(parent, child) {
        parent.appendChild(child);
        return (0, lifecycle_1.toDisposable)(() => {
            parent.removeChild(child);
        });
    }
    function prependRemoveOnDispose(parent, child) {
        parent.prepend(child);
        return (0, lifecycle_1.toDisposable)(() => {
            parent.removeChild(child);
        });
    }
    function observableConfigValue(key, defaultValue, configurationService) {
        return (0, observable_1.observableFromEvent)((handleChange) => configurationService.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(key)) {
                handleChange(e);
            }
        }), () => configurationService.getValue(key) ?? defaultValue);
    }
    class ObservableElementSizeObserver extends lifecycle_1.Disposable {
        get width() { return this._width; }
        get height() { return this._height; }
        constructor(element, dimension) {
            super();
            this.elementSizeObserver = this._register(new elementSizeObserver_1.ElementSizeObserver(element, dimension));
            this._width = (0, observable_1.observableValue)(this, this.elementSizeObserver.getWidth());
            this._height = (0, observable_1.observableValue)(this, this.elementSizeObserver.getHeight());
            this._register(this.elementSizeObserver.onDidChange(e => (0, observable_1.transaction)(tx => {
                /** @description Set width/height from elementSizeObserver */
                this._width.set(this.elementSizeObserver.getWidth(), tx);
                this._height.set(this.elementSizeObserver.getHeight(), tx);
            })));
        }
        observe(dimension) {
            this.elementSizeObserver.observe(dimension);
        }
        setAutomaticLayout(automaticLayout) {
            if (automaticLayout) {
                this.elementSizeObserver.startObserving();
            }
            else {
                this.elementSizeObserver.stopObserving();
            }
        }
    }
    exports.ObservableElementSizeObserver = ObservableElementSizeObserver;
    function animatedObservable(targetWindow, base, store) {
        let targetVal = base.get();
        let startVal = targetVal;
        let curVal = targetVal;
        const result = (0, observable_1.observableValue)('animatedValue', targetVal);
        let animationStartMs = -1;
        const durationMs = 300;
        let animationFrame = undefined;
        store.add((0, observable_1.autorunHandleChanges)({
            createEmptyChangeSummary: () => ({ animate: false }),
            handleChange: (ctx, s) => {
                if (ctx.didChange(base)) {
                    s.animate = s.animate || ctx.change;
                }
                return true;
            }
        }, (reader, s) => {
            /** @description update value */
            if (animationFrame !== undefined) {
                targetWindow.cancelAnimationFrame(animationFrame);
                animationFrame = undefined;
            }
            startVal = curVal;
            targetVal = base.read(reader);
            animationStartMs = Date.now() - (s.animate ? 0 : durationMs);
            update();
        }));
        function update() {
            const passedMs = Date.now() - animationStartMs;
            curVal = Math.floor(easeOutExpo(passedMs, startVal, targetVal - startVal, durationMs));
            if (passedMs < durationMs) {
                animationFrame = targetWindow.requestAnimationFrame(update);
            }
            else {
                curVal = targetVal;
            }
            result.set(curVal, undefined);
        }
        return result;
    }
    function easeOutExpo(t, b, c, d) {
        return t === d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    }
    function deepMerge(source1, source2) {
        const result = {};
        for (const key in source1) {
            result[key] = source1[key];
        }
        for (const key in source2) {
            const source2Value = source2[key];
            if (typeof result[key] === 'object' && source2Value && typeof source2Value === 'object') {
                result[key] = deepMerge(result[key], source2Value);
            }
            else {
                result[key] = source2Value;
            }
        }
        return result;
    }
    class ViewZoneOverlayWidget extends lifecycle_1.Disposable {
        constructor(editor, viewZone, htmlElement) {
            super();
            this._register(new ManagedOverlayWidget(editor, htmlElement));
            this._register(applyStyle(htmlElement, {
                height: viewZone.actualHeight,
                top: viewZone.actualTop,
            }));
        }
    }
    exports.ViewZoneOverlayWidget = ViewZoneOverlayWidget;
    class PlaceholderViewZone {
        get afterLineNumber() { return this._afterLineNumber.get(); }
        constructor(_afterLineNumber, heightInPx) {
            this._afterLineNumber = _afterLineNumber;
            this.heightInPx = heightInPx;
            this.domNode = document.createElement('div');
            this._actualTop = (0, observable_1.observableValue)(this, undefined);
            this._actualHeight = (0, observable_1.observableValue)(this, undefined);
            this.actualTop = this._actualTop;
            this.actualHeight = this._actualHeight;
            this.showInHiddenAreas = true;
            this.onChange = this._afterLineNumber;
            this.onDomNodeTop = (top) => {
                this._actualTop.set(top, undefined);
            };
            this.onComputedHeight = (height) => {
                this._actualHeight.set(height, undefined);
            };
        }
    }
    exports.PlaceholderViewZone = PlaceholderViewZone;
    class ManagedOverlayWidget {
        static { this._counter = 0; }
        constructor(_editor, _domElement) {
            this._editor = _editor;
            this._domElement = _domElement;
            this._overlayWidgetId = `managedOverlayWidget-${ManagedOverlayWidget._counter++}`;
            this._overlayWidget = {
                getId: () => this._overlayWidgetId,
                getDomNode: () => this._domElement,
                getPosition: () => null
            };
            this._editor.addOverlayWidget(this._overlayWidget);
        }
        dispose() {
            this._editor.removeOverlayWidget(this._overlayWidget);
        }
    }
    exports.ManagedOverlayWidget = ManagedOverlayWidget;
    function applyStyle(domNode, style) {
        return (0, observable_1.autorun)(reader => {
            /** @description applyStyle */
            for (let [key, val] of Object.entries(style)) {
                if (val && typeof val === 'object' && 'read' in val) {
                    val = val.read(reader);
                }
                if (typeof val === 'number') {
                    val = `${val}px`;
                }
                key = key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
                domNode.style[key] = val;
            }
        });
    }
    function readHotReloadableExport(value, reader) {
        observeHotReloadableExports([value], reader);
        return value;
    }
    function observeHotReloadableExports(values, reader) {
        if ((0, hotReload_1.isHotReloadEnabled)()) {
            const o = (0, observable_1.observableSignalFromEvent)('reload', event => (0, hotReload_1.registerHotReloadHandler)(({ oldExports }) => {
                if (![...Object.values(oldExports)].some(v => values.includes(v))) {
                    return undefined;
                }
                return (_newExports) => {
                    event(undefined);
                    return true;
                };
            }));
            o.read(reader);
        }
    }
    function applyViewZones(editor, viewZones, setIsUpdating, zoneIds) {
        const store = new lifecycle_1.DisposableStore();
        const lastViewZoneIds = [];
        store.add((0, observable_1.autorunWithStore)((reader, store) => {
            /** @description applyViewZones */
            const curViewZones = viewZones.read(reader);
            const viewZonIdsPerViewZone = new Map();
            const viewZoneIdPerOnChangeObservable = new Map();
            // Add/remove view zones
            if (setIsUpdating) {
                setIsUpdating(true);
            }
            editor.changeViewZones(a => {
                for (const id of lastViewZoneIds) {
                    a.removeZone(id);
                    zoneIds?.delete(id);
                }
                lastViewZoneIds.length = 0;
                for (const z of curViewZones) {
                    const id = a.addZone(z);
                    if (z.setZoneId) {
                        z.setZoneId(id);
                    }
                    lastViewZoneIds.push(id);
                    zoneIds?.add(id);
                    viewZonIdsPerViewZone.set(z, id);
                }
            });
            if (setIsUpdating) {
                setIsUpdating(false);
            }
            // Layout zone on change
            store.add((0, observable_1.autorunHandleChanges)({
                createEmptyChangeSummary() {
                    return { zoneIds: [] };
                },
                handleChange(context, changeSummary) {
                    const id = viewZoneIdPerOnChangeObservable.get(context.changedObservable);
                    if (id !== undefined) {
                        changeSummary.zoneIds.push(id);
                    }
                    return true;
                },
            }, (reader, changeSummary) => {
                /** @description layoutZone on change */
                for (const vz of curViewZones) {
                    if (vz.onChange) {
                        viewZoneIdPerOnChangeObservable.set(vz.onChange, viewZonIdsPerViewZone.get(vz));
                        vz.onChange.read(reader);
                    }
                }
                if (setIsUpdating) {
                    setIsUpdating(true);
                }
                editor.changeViewZones(a => { for (const id of changeSummary.zoneIds) {
                    a.layoutZone(id);
                } });
                if (setIsUpdating) {
                    setIsUpdating(false);
                }
            }));
        }));
        store.add({
            dispose() {
                if (setIsUpdating) {
                    setIsUpdating(true);
                }
                editor.changeViewZones(a => { for (const id of lastViewZoneIds) {
                    a.removeZone(id);
                } });
                zoneIds?.clear();
                if (setIsUpdating) {
                    setIsUpdating(false);
                }
            }
        });
        return store;
    }
    class DisposableCancellationTokenSource extends cancellation_1.CancellationTokenSource {
        dispose() {
            super.dispose(true);
        }
    }
    exports.DisposableCancellationTokenSource = DisposableCancellationTokenSource;
    function translatePosition(posInOriginal, mappings) {
        const mapping = (0, arraysFind_1.findLast)(mappings, m => m.original.startLineNumber <= posInOriginal.lineNumber);
        if (!mapping) {
            // No changes before the position
            return range_1.Range.fromPositions(posInOriginal);
        }
        if (mapping.original.endLineNumberExclusive <= posInOriginal.lineNumber) {
            const newLineNumber = posInOriginal.lineNumber - mapping.original.endLineNumberExclusive + mapping.modified.endLineNumberExclusive;
            return range_1.Range.fromPositions(new position_1.Position(newLineNumber, posInOriginal.column));
        }
        if (!mapping.innerChanges) {
            // Only for legacy algorithm
            return range_1.Range.fromPositions(new position_1.Position(mapping.modified.startLineNumber, 1));
        }
        const innerMapping = (0, arraysFind_1.findLast)(mapping.innerChanges, m => m.originalRange.getStartPosition().isBeforeOrEqual(posInOriginal));
        if (!innerMapping) {
            const newLineNumber = posInOriginal.lineNumber - mapping.original.startLineNumber + mapping.modified.startLineNumber;
            return range_1.Range.fromPositions(new position_1.Position(newLineNumber, posInOriginal.column));
        }
        if (innerMapping.originalRange.containsPosition(posInOriginal)) {
            return innerMapping.modifiedRange;
        }
        else {
            const l = lengthBetweenPositions(innerMapping.originalRange.getEndPosition(), posInOriginal);
            return range_1.Range.fromPositions(l.addToPosition(innerMapping.modifiedRange.getEndPosition()));
        }
    }
    function lengthBetweenPositions(position1, position2) {
        if (position1.lineNumber === position2.lineNumber) {
            return new textLength_1.TextLength(0, position2.column - position1.column);
        }
        else {
            return new textLength_1.TextLength(position2.lineNumber - position1.lineNumber, position2.column - 1);
        }
    }
    function bindContextKey(key, service, computeValue) {
        const boundKey = key.bindTo(service);
        return (0, observable_1.autorunOpts)({ debugName: () => `Set Context Key "${key.key}"` }, reader => {
            boundKey.set(computeValue(reader));
        });
    }
    function filterWithPrevious(arr, filter) {
        let prev;
        return arr.filter(cur => {
            const result = filter(cur, prev);
            prev = cur;
            return result;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci93aWRnZXQvZGlmZkVkaXRvci91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLGtDQXNDQztJQUdELGdFQWFDO0lBRUQsc0RBS0M7SUFFRCx3REFLQztJQUVELHNEQVNDO0lBc0NELGdEQThDQztJQU1ELDhCQWNDO0lBeUZELGdDQWNDO0lBRUQsMERBR0M7SUFFRCxrRUFnQkM7SUFFRCx3Q0ErREM7SUFRRCw4Q0E2QkM7SUFVRCx3Q0FLQztJQUVELGdEQU9DO0lBbmJELFNBQWdCLFdBQVcsQ0FBSSxJQUFrQixFQUFFLElBQWtCLEVBQUUsV0FBK0IsRUFBRSxPQUE0QjtRQUNuSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDdkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFRLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDM0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0IsTUFBTSxJ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