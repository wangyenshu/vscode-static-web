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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/markers/common/markers", "vs/workbench/services/decorations/common/decorations", "vs/base/common/lifecycle", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, contributions_1, markers_1, decorations_1, lifecycle_1, nls_1, platform_1, colorRegistry_1, configuration_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MarkersDecorationsProvider {
        constructor(_markerService) {
            this._markerService = _markerService;
            this.label = (0, nls_1.localize)('label', "Problems");
            this.onDidChange = _markerService.onMarkerChanged;
        }
        provideDecorations(resource) {
            const markers = this._markerService.read({
                resource,
                severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning
            });
            let first;
            for (const marker of markers) {
                if (!first || marker.severity > first.severity) {
                    first = marker;
                }
            }
            if (!first) {
                return undefined;
            }
            return {
                weight: 100 * first.severity,
                bubble: true,
                tooltip: markers.length === 1 ? (0, nls_1.localize)('tooltip.1', "1 problem in this file") : (0, nls_1.localize)('tooltip.N', "{0} problems in this file", markers.length),
                letter: markers.length < 10 ? markers.length.toString() : '9+',
                color: first.severity === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground,
            };
        }
    }
    let MarkersFileDecorations = class MarkersFileDecorations {
        constructor(_markerService, _decorationsService, _configurationService) {
            this._markerService = _markerService;
            this._decorationsService = _decorationsService;
            this._configurationService = _configurationService;
            this._disposables = [
                this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('problems.visibility')) {
                        this._updateEnablement();
                    }
                }),
            ];
            this._updateEnablement();
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._provider);
            (0, lifecycle_1.dispose)(this._disposables);
        }
        _updateEnablement() {
            const problem = this._configurationService.getValue('problems.visibility');
            if (problem === undefined) {
                return;
            }
            const value = this._configurationService.getValue('problems');
            const shouldEnable = (problem && value.decorations.enabled);
            if (shouldEnable === this._enabled) {
                if (!problem || !value.decorations.enabled) {
                    this._provider?.dispose();
                    this._provider = undefined;
                }
                return;
            }
            this._enabled = shouldEnable;
            if (this._enabled) {
                const provider = new MarkersDecorationsProvider(this._markerService);
                this._provider = this._decorationsService.registerDecorationsProvider(provider);
            }
            else if (this._provider) {
                this._provider.dispose();
            }
        }
    };
    MarkersFileDecorations = __decorate([
        __param(0, markers_1.IMarkerService),
        __param(1, decorations_1.IDecorationsService),
        __param(2, configuration_1.IConfigurationService)
    ], MarkersFileDecorations);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': 'problems',
        'order': 101,
        'type': 'object',
        'properties': {
            'problems.decorations.enabled': {
                'markdownDescription': (0, nls_1.localize)('markers.showOnFile', "Show Errors & Warnings on files and folder. Overwritten by `#problems.visibility#` when it is off."),
                'type': 'boolean',
                'default': true
            }
        }
    });
    // register file decorations
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(MarkersFileDecorations, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc0ZpbGVEZWNvcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21hcmtlcnMvYnJvd3Nlci9tYXJrZXJzRmlsZURlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBZWhHLE1BQU0sMEJBQTBCO1FBSy9CLFlBQ2tCLGNBQThCO1lBQTlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUp2QyxVQUFLLEdBQVcsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBTXRELElBQUksQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDLGVBQWUsQ0FBQztRQUNuRCxDQUFDO1FBRUQsa0JBQWtCLENBQUMsUUFBYTtZQUMvQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQztnQkFDeEMsUUFBUTtnQkFDUixVQUFVLEVBQUUsd0JBQWMsQ0FBQyxLQUFLLEdBQUcsd0JBQWMsQ0FBQyxPQUFPO2FBQ3pELENBQUMsQ0FBQztZQUNILElBQUksS0FBMEIsQ0FBQztZQUMvQixLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNoRCxLQUFLLEdBQUcsTUFBTSxDQUFDO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTztnQkFDTixNQUFNLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxRQUFRO2dCQUM1QixNQUFNLEVBQUUsSUFBSTtn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