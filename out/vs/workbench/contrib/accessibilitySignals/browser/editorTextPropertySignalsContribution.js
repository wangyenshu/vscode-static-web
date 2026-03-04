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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/utils", "vs/base/common/types", "vs/editor/browser/editorBrowser", "vs/editor/contrib/folding/browser/folding", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService"], function (require, exports, async_1, lifecycle_1, observable_1, utils_1, types_1, editorBrowser_1, folding_1, accessibilitySignalService_1, instantiation_1, markers_1, debug_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorTextPropertySignalsContribution = void 0;
    let EditorTextPropertySignalsContribution = class EditorTextPropertySignalsContribution extends lifecycle_1.Disposable {
        constructor(_editorService, _instantiationService, _accessibilitySignalService) {
            super();
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._textProperties = [
                this._instantiationService.createInstance(MarkerTextProperty, accessibilitySignalService_1.AccessibilitySignal.errorAtPosition, accessibilitySignalService_1.AccessibilitySignal.errorOnLine, markers_1.MarkerSeverity.Error),
                this._instantiationService.createInstance(MarkerTextProperty, accessibilitySignalService_1.AccessibilitySignal.warningAtPosition, accessibilitySignalService_1.AccessibilitySignal.warningOnLine, markers_1.MarkerSeverity.Warning),
                this._instantiationService.createInstance(FoldedAreaTextProperty),
                this._instantiationService.createInstance(BreakpointTextProperty),
            ];
            this._someAccessibilitySignalIsEnabled = (0, observable_1.derived)(this, reader => this._textProperties
                .flatMap(p => [p.lineSignal, p.positionSignal])
                .filter(types_1.isDefined)
                .some(signal => (0, utils_1.observableFromValueWithChangeEvent)(this, this._accessibilitySignalService.getEnabledState(signal, false)).read(reader)));
            this._activeEditorObservable = (0, observable_1.observableFromEvent)(this._editorService.onDidActiveEditorChange, (_) => {
                const activeTextEditorControl = this._editorService.activeTextEditorControl;
                const editor = (0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)
                    ? activeTextEditorControl.getOriginalEditor()
                    : (0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)
                        ? activeTextEditorControl
                        : undefined;
                return editor && editor.hasModel() ? { editor, model: editor.getModel() } : undefined;
            });
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description updateSignalsEnabled */
                if (!this._someAccessibilitySignalIsEnabled.read(reader)) {
                    return;
                }
                const activeEditor = this._activeEditorObservable.read(reader);
                if (activeEditor) {
                    this._registerAccessibilitySignalsForEditor(activeEditor.editor, activeEditor.model, store);
                }
            }));
        }
        _registerAccessibilitySignalsForEditor(editor, editorModel, store) {
            let lastLine = -1;
            const ignoredLineSignalsForCurrentLine = new Set();
            const timeouts = new lifecycle_1.DisposableStore();
            const propertySources = this._textProperties.map(p => ({ source: p.createSource(editor, editorModel), property: p }));
            const didType = (0, utils_1.wasEventTriggeredRecently)(editor.onDidChangeModelContent, 100, store);
            store.add(editor.onDidChangeCursorPosition(args => {
                timeouts.clear();
                if (args &&
                    args.reason !== 3 /* CursorChangeReason.Explicit */ &&
                    args.reason !== 0 /* CursorChangeReason.NotSet */) {
                    // Ignore cursor changes caused by navigation (e.g. which happens when execution is paused).
                    ignoredLineSignalsForCurrentLine.clear();
                    return;
                }
                const trigger = (property, source, mode) => {
                    const signal = mode === 'line' ? property.lineSignal : property.positionSignal;
                    if (!signal
                        || !this._accessibilitySignalService.getEnabledState(signal, false).value
                        || !source.isPresent(position, mode, undefined)) {
                        return;
                    }
                    for (const modality of ['sound', 'announcement']) {
                        if (this._accessibilitySignalService.getEnabledState(signal, false, modality)) {
                            const delay = this._getDelay(signal, modality) + (didType.get() ? 1000 : 0);
                            timeouts.add((0, async_1.disposableTimeout)(() => {
                                if (source.isPresent(position, mode, undefined)) {
                                    if (!(mode === 'line') || !ignoredLineSignalsForCurrentLine.has(property)) {
                                        this._accessibilitySignalService.playSignal(signal, { modality });
                                    }
                                    ignoredLineSignalsForCurrentLine.add(property);
                                }
                            }, delay));
                        }
                    }
                };
                // React to cursor changes
                const position = args.position;
                const lineNumber = position.lineNumber;
                if (lineNumber !== lastLine) {
                    ignoredLineSignalsForCurrentLine.clear();
                    lastLine = lineNumber;
                    for (const p of propertySources) {
                        trigger(p.property, p.source, 'line');
                    }
                }
                for (const p of propertySources) {
                    trigger(p.property, p.source, 'positional');
                }
                // React to property state changes for the current cursor position
                for (const s of propertySources) {
                    if (![s.property.lineSignal, s.property.positionSignal]
                        .some(s => s && this._accessibilitySignalService.getEnabledState(s, false).value)) {
                        return;
                    }
                    let lastValueAtPosition = undefined;
                    let lastValueOnLine = undefined;
                    timeouts.add((0, observable_1.autorun)(reader => {
                        const newValueAtPosition = s.source.isPresentAtPosition(args.position, reader);
                        const newValueOnLine = s.source.isPresentOnLine(args.position.lineNumber, reader);
                        if (lastValueAtPosition !== undefined && lastValueAtPosition !== undefined) {
                            if (!lastValueAtPosition && newValueAtPosition) {
                                trigger(s.property, s.source, 'positional');
                            }
                            if (!lastValueOnLine && newValueOnLine) {
                                trigger(s.property, s.source, 'line');
                            }
                        }
                        lastValueAtPosition = newValueAtPosition;
                        lastValueOnLine = newValueOnLine;
                    }));
                }
            }));
        }
        _getDelay(signal, modality) {
            // TODO make these delays configurable!
            if (signal === accessibilitySignalService_1.AccessibilitySignal.errorAtPosition || signal === accessibilitySignalService_1.AccessibilitySignal.warningAtPosition) {
                if (modality === 'sound') {
                    return 100;
                }
                else {
                    return 1000;
                }
            }
            if (modality === 'sound') {
                return 400;
            }
            else {
                return 3000;
            }
        }
    };
    exports.EditorTextPropertySignalsContribution = EditorTextPropertySignalsContribution;
    exports.EditorTextPropertySignalsContribution = EditorTextPropertySignalsContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, accessibilitySignalService_1.IAccessibilitySignalService)
    ], EditorTextPropertySignalsContribution);
    class TextPropertySource {
        static { this.notPresent = new TextPropertySource({ isPresentAtPosition: () => false, isPresentOnLine: () => false }); }
        constructor(options) {
            this.isPresentOnLine = options.isPresentOnLine;
            this.isPresentAtPosition = options.isPresentAtPosition ?? (() => false);
        }
        isPresent(position, mode, reader) {
            return mode === 'line' ? this.isPresentOnLine(position.lineNumber, reader) : this.isPresentAtPosition(position, reader);
        }
    }
    let MarkerTextProperty = class MarkerTextProperty {
        constructor(positionSignal, lineSignal, severity, markerService) {
            this.positionSignal = positionSignal;
            this.lineSignal = lineSignal;
            this.severity = severity;
            this.markerService = markerService;
            this.debounceWhileTyping = true;
        }
        createSource(editor, model) {
            const obs = (0, utils_1.observableSignalFromEvent)('onMarkerChanged', this.markerService.onMarkerChanged);
            return new TextPropertySource({
                isPresentAtPosition: (position, reader) => {
                    obs.read(reader);
                    const hasMarker = this.markerService
                        .read({ resource: model.uri })
                        .some((m) => m.severity === this.severity &&
                        m.startLineNumber <= position.lineNumber &&
                        position.lineNumber <= m.endLineNumber &&
                        m.startColumn <= position.column &&
                        position.column <= m.endColumn);
                    return hasMarker;
                },
                isPresentOnLine: (lineNumber, reader) => {
                    obs.read(reader);
                    const hasMarker = this.markerService
                        .read({ resource: model.uri })
                        .some((m) => m.severity === this.severity &&
                        m.startLineNumber <= lineNumber &&
                        lineNumber <= m.endLineNumber);
                    return hasMarker;
                }
            });
        }
    };
    MarkerTextProperty = __decorate([
        __param(3, markers_1.IMarkerService)
    ], MarkerTextProperty);
    class FoldedAreaTextProperty {
        constructor() {
            this.lineSignal = accessibilitySignalService_1.AccessibilitySignal.foldedArea;
        }
        createSource(editor, _model) {
            const foldingController = folding_1.FoldingController.get(editor);
            if (!foldingController) {
                return TextPropertySource.notPresent;
            }
            const foldingModel = (0, observable_1.observableFromPromise)(foldingController.getFoldingModel() ?? Promise.resolve(undefined));
            return new TextPropertySource({
                isPresentOnLine(lineNumber, reader) {
                    const m = foldingModel.read(reader);
                    const regionAtLine = m.value?.getRegionAtLine(lineNumber);
                    const hasFolding = !regionAtLine
                        ? false
                        : regionAtLine.isCollapsed &&
                            regionAtLine.startLineNumber === lineNumber;
                    return hasFolding;
                }
            });
        }
    }
    let BreakpointTextProperty = class BreakpointTextProperty {
        constructor(debugService) {
            this.debugService = debugService;
            this.lineSignal = accessibilitySignalService_1.AccessibilitySignal.break;
        }
        createSource(editor, model) {
            const signal = (0, utils_1.observableSignalFromEvent)('onDidChangeBreakpoints', this.debugService.getModel().onDidChangeBreakpoints);
            const debugService = this.debugService;
            return new TextPropertySource({
                isPresentOnLine(lineNumber, reader) {
                    signal.read(reader);
                    const breakpoints = debugService
                        .getModel()
                        .getBreakpoints({ uri: model.uri, lineNumber });
                    const hasBreakpoints = breakpoints.length > 0;
                    return hasBreakpoints;
                }
            });
        }
    };
    BreakpointTextProperty = __decorate([
        __param(0, debug_1.IDebugService)
    ], BreakpointTextProperty);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yVGV4dFByb3BlcnR5U2lnbmFsc0NvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHlTaWduYWxzL2Jyb3dzZXIvZWRpdG9yVGV4dFByb3BlcnR5U2lnbmFsc0NvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0scUNBQXFDLEdBQTNDLE1BQU0scUNBQXNDLFNBQVEsc0JBQVU7UUE4QnBFLFlBQ2lCLGNBQStDLEVBQ3hDLHFCQUE2RCxFQUN2RCwyQkFBeUU7WUFFdEcsS0FBSyxFQUFFLENBQUM7WUFKeUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3ZCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDdEMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE2QjtZQWhDdEYsb0JBQWUsR0FBbUI7Z0JBQ2xELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsZ0RBQW1CLENBQUMsZUFBZSxFQUFFLGdEQUFtQixDQUFDLFdBQVcsRUFBRSx3QkFBYyxDQUFDLEtBQUssQ0FBQztnQkFDekosSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxnREFBbUIsQ0FBQyxpQkFBaUIsRUFBRSxnREFBbUIsQ0FBQyxhQUFhLEVBQUUsd0JBQWMsQ0FBQyxPQUFPLENBQUM7Z0JBQy9KLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUM7Z0JBQ2pFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUM7YUFDakUsQ0FBQztZQUVlLHNDQUFpQyxHQUFHLElBQUEsb0JBQU8sRUFBQyxJ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