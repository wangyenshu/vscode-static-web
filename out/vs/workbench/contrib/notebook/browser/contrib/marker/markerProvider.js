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
define(["require", "exports", "vs/workbench/common/contributions", "vs/editor/contrib/gotoError/browser/markerNavigationService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/markers/common/markers", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/base/common/decorators", "vs/platform/theme/common/colorRegistry", "vs/base/common/resources"], function (require, exports, contributions_1, markerNavigationService_1, notebookCommon_1, markers_1, configuration_1, lifecycle_1, notebookBrowser_1, notebookEditorExtensions_1, decorators_1, colorRegistry_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MarkerListProvider = class MarkerListProvider {
        static { this.ID = 'workbench.contrib.markerListProvider'; }
        constructor(_markerService, markerNavigation, _configService) {
            this._markerService = _markerService;
            this._configService = _configService;
            this._dispoables = markerNavigation.registerProvider(this);
        }
        dispose() {
            this._dispoables.dispose();
        }
        getMarkerList(resource) {
            if (!resource) {
                return undefined;
            }
            const data = notebookCommon_1.CellUri.parse(resource);
            if (!data) {
                return undefined;
            }
            return new markerNavigationService_1.MarkerList(uri => {
                const otherData = notebookCommon_1.CellUri.parse(uri);
                return otherData?.notebook.toString() === data.notebook.toString();
            }, this._markerService, this._configService);
        }
    };
    MarkerListProvider = __decorate([
        __param(0, markers_1.IMarkerService),
        __param(1, markerNavigationService_1.IMarkerNavigationService),
        __param(2, configuration_1.IConfigurationService)
    ], MarkerListProvider);
    let NotebookMarkerDecorationContribution = class NotebookMarkerDecorationContribution extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.markerDecoration'; }
        constructor(_notebookEditor, _markerService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._markerService = _markerService;
            this._markersOverviewRulerDecorations = [];
            this._update();
            this._register(this._notebookEditor.onDidChangeModel(() => this._update()));
            this._register(this._markerService.onMarkerChanged(e => {
                if (e.some(uri => this._notebookEditor.getCellsInRange().some(cell => (0, resources_1.isEqual)(cell.uri, uri)))) {
                    this._update();
                }
            }));
        }
        _update() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const cellDecorations = [];
            this._notebookEditor.getCellsInRange().forEach(cell => {
                const marker = this._markerService.read({ resource: cell.uri, severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning });
                marker.forEach(m => {
                    const color = m.severity === markers_1.MarkerSeverity.Error ? colorRegistry_1.editorErrorForeground : colorRegistry_1.editorWarningForeground;
                    const range = { startLineNumber: m.startLineNumber, startColumn: m.startColumn, endLineNumber: m.endLineNumber, endColumn: m.endColumn };
                    cellDecorations.push({
                        handle: cell.handle,
                        options: {
                            overviewRuler: {
                                color: color,
                                modelRanges: [range],
                                includeOutput: false,
                                position: notebookBrowser_1.NotebookOverviewRulerLane.Right
                            }
                        }
                    });
                });
            });
            this._markersOverviewRulerDecorations = this._notebookEditor.deltaCellDecorations(this._markersOverviewRulerDecorations, cellDecorations);
        }
    };
    __decorate([
        (0, decorators_1.throttle)(100)
    ], NotebookMarkerDecorationContribution.prototype, "_update", null);
    NotebookMarkerDecorationContribution = __decorate([
        __param(1, markers_1.IMarkerService)
    ], NotebookMarkerDecorationContribution);
    (0, contributions_1.registerWorkbenchContribution2)(MarkerListProvider.ID, MarkerListProvider, 2 /* WorkbenchPhase.BlockRestore */);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(NotebookMarkerDecorationContribution.id, NotebookMarkerDecorationContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VyUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvbWFya2VyL21hcmtlclByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBZWhHLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQWtCO2lCQUVQLE9BQUUsR0FBRyxzQ0FBc0MsQUFBekMsQ0FBMEM7UUFJNUQsWUFDa0MsY0FBOEIsRUFDckMsZ0JBQTBDLEVBQzVCLGNBQXFDO1lBRjVDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUV2QixtQkFBYyxHQUFkLGNBQWMsQ0FBdUI7WUFFN0UsSUFBSSxDQUFDLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVELGFBQWEsQ0FBQyxRQUF5QjtZQUN0QyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLHdCQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTyxJQUFJLG9DQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzNCLE1BQU0sU0FBUyxHQUFHLHdCQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxPQUFPLFNBQVMsRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFF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