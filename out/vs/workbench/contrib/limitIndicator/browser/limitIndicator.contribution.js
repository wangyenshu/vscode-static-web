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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/languageStatus/common/languageStatusService", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/nls", "vs/editor/contrib/folding/browser/folding", "vs/editor/contrib/colorPicker/browser/colorDetector"], function (require, exports, lifecycle_1, severity_1, editorBrowser_1, editorService_1, languageStatusService_1, platform_1, contributions_1, nls, folding_1, colorDetector_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LimitIndicatorContribution = void 0;
    const openSettingsCommand = 'workbench.action.openSettings';
    const configureSettingsLabel = nls.localize('status.button.configure', "Configure");
    /**
     * Uses that language status indicator to show information which language features have been limited for performance reasons.
     * Currently this is used for folding ranges and for color decorators.
     */
    let LimitIndicatorContribution = class LimitIndicatorContribution extends lifecycle_1.Disposable {
        constructor(editorService, languageStatusService) {
            super();
            const accessors = [new ColorDecorationAccessor(), new FoldingRangeAccessor()];
            const statusEntries = accessors.map(indicator => new LanguageStatusEntry(languageStatusService, indicator));
            statusEntries.forEach(entry => this._register(entry));
            let control;
            const onActiveEditorChanged = () => {
                const activeControl = editorService.activeTextEditorControl;
                if (activeControl === control) {
                    return;
                }
                control = activeControl;
                const editor = (0, editorBrowser_1.getCodeEditor)(activeControl);
                statusEntries.forEach(statusEntry => statusEntry.onActiveEditorChanged(editor));
            };
            this._register(editorService.onDidActiveEditorChange(onActiveEditorChanged));
            onActiveEditorChanged();
        }
    };
    exports.LimitIndicatorContribution = LimitIndicatorContribution;
    exports.LimitIndicatorContribution = LimitIndicatorContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, languageStatusService_1.ILanguageStatusService)
    ], LimitIndicatorContribution);
    class ColorDecorationAccessor {
        constructor() {
            this.id = 'decoratorsLimitInfo';
            this.name = nls.localize('colorDecoratorsStatusItem.name', 'Color Decorator Status');
            this.label = nls.localize('status.limitedColorDecorators.short', 'Color Decorators');
            this.source = nls.localize('colorDecoratorsStatusItem.source', 'Color Decorators');
            this.settingsId = 'editor.colorDecoratorsLimit';
        }
        getLimitReporter(editor) {
            return colorDetector_1.ColorDetector.get(editor)?.limitReporter;
        }
    }
    class FoldingRangeAccessor {
        constructor() {
            this.id = 'foldingLimitInfo';
            this.name = nls.localize('foldingRangesStatusItem.name', 'Folding Status');
            this.label = nls.localize('status.limitedFoldingRanges.short', 'Folding Ranges');
            this.source = nls.localize('foldingRangesStatusItem.source', 'Folding');
            this.settingsId = 'editor.foldingMaximumRegions';
        }
        getLimitReporter(editor) {
            return folding_1.FoldingController.get(editor)?.limitReporter;
        }
    }
    class LanguageStatusEntry {
        constructor(languageStatusService, accessor) {
            this.languageStatusService = languageStatusService;
            this.accessor = accessor;
        }
        onActiveEditorChanged(editor) {
            if (this._indicatorChangeListener) {
                this._indicatorChangeListener.dispose();
                this._indicatorChangeListener = undefined;
            }
            let info;
            if (editor) {
                info = this.accessor.getLimitReporter(editor);
            }
            this.updateStatusItem(info);
            if (info) {
                this._indicatorChangeListener = info.onDidChange(_ => {
                    this.updateStatusItem(info);
                });
                return true;
            }
            return false;
        }
        updateStatusItem(info) {
            if (this._limitStatusItem) {
                this._limitStatusItem.dispose();
                this._limitStatusItem = undefined;
            }
            if (info && info.limited !== false) {
                const status = {
                    id: this.accessor.id,
                    selector: '*',
                    name: this.accessor.name,
                    severity: severity_1.default.Warning,
                    label: this.accessor.label,
                    detail: nls.localize('status.limited.details', 'only {0} shown for performance reasons', info.limited),
                    command: { id: openSettingsCommand, arguments: [this.accessor.settingsId], title: configureSettingsLabel },
                    accessibilityInfo: undefined,
                    source: this.accessor.source,
                    busy: false
                };
                this._limitStatusItem = this.languageStatusService.addStatus(status);
            }
        }
        dispose() {
            this._limitStatusItem?.dispose;
            this._limitStatusItem = undefined;
            this._indicatorChangeListener?.dispose;
            this._indicatorChangeListener = undefined;
        }
    }
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LimitIndicatorContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGltaXRJbmRpY2F0b3IuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbGltaXRJbmRpY2F0b3IvYnJvd3Nlci9saW1pdEluZGljYXRvci5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0JoRyxNQUFNLG1CQUFtQixHQUFHLCtCQUErQixDQUFDO0lBQzVELE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVwRjs7O09BR0c7SUFDSSxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHNCQUFVO1FBRXpELFlBQ2lCLGFBQTZCLEVBQ3JCLHFCQUE2QztZQUVyRSxLQUFLLEVBQUUsQ0FBQztZQUVSLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBSSx1QkFBdUIsRUFBRSxFQUFFLElBQUksb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDNUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUV0RCxJQUFJLE9BQVksQ0FBQztZQUVqQixNQUFNLHFCQUFxQixHQUFHLEdBQUcsRUFBRTtnQkFDbEMsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLHVCQUF1QixDQUFDO2dCQUM1RCxJQUFJLGFBQWEsS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDL0IsT0FB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