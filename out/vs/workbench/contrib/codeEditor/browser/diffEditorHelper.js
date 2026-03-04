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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/diffEditor/commands", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/editor/browser/widget/diffEditor/embeddedDiffEditorWidget", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/workbench/browser/codeeditor", "vs/workbench/common/configuration", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/accessibility/browser/editorAccessibilityHelp", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, observable_1, editorExtensions_1, codeEditorService_1, commands_1, diffEditorWidget_1, embeddedDiffEditorWidget_1, nls_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, notification_1, platform_1, codeeditor_1, configuration_2, accessibleView_1, accessibleViewActions_1, editorAccessibilityHelp_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DiffEditorHelperContribution = class DiffEditorHelperContribution extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.diffEditorHelper'; }
        constructor(_diffEditor, _instantiationService, _configurationService, _notificationService) {
            super();
            this._diffEditor = _diffEditor;
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._notificationService = _notificationService;
            this._register(createScreenReaderHelp());
            const isEmbeddedDiffEditor = this._diffEditor instanceof embeddedDiffEditorWidget_1.EmbeddedDiffEditorWidget;
            if (!isEmbeddedDiffEditor) {
                const computationResult = (0, observable_1.observableFromEvent)(e => this._diffEditor.onDidUpdateDiff(e), () => /** @description diffEditor.diffComputationResult */ this._diffEditor.getDiffComputationResult());
                const onlyWhiteSpaceChange = computationResult.map(r => r && !r.identical && r.changes2.length === 0);
                this._register((0, observable_1.autorunWithStore)((reader, store) => {
                    /** @description update state */
                    if (onlyWhiteSpaceChange.read(reader)) {
                        const helperWidget = store.add(this._instantiationService.createInstance(codeeditor_1.FloatingEditorClickWidget, this._diffEditor.getModifiedEditor(), (0, nls_1.localize)('hintWhitespace', "Show Whitespace Differences"), null));
                        store.add(helperWidget.onClick(() => {
                            this._configurationService.updateValue('diffEditor.ignoreTrimWhitespace', false);
                        }));
                        helperWidget.render();
                    }
                }));
                this._register(this._diffEditor.onDidUpdateDiff(() => {
                    const diffComputationResult = this._diffEditor.getDiffComputationResult();
                    if (diffComputationResult && diffComputationResult.quitEarly) {
                        this._notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('hintTimeout', "The diff algorithm was stopped early (after {0} ms.)", this._diffEditor.maxComputationTime), [{
                                label: (0, nls_1.localize)('removeTimeout', "Remove Limit"),
                                run: () => {
                                    this._configurationService.updateValue('diffEditor.maxComputationTime', 0);
                                }
                            }], {});
                    }
                }));
            }
        }
    };
    DiffEditorHelperContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService)
    ], DiffEditorHelperContribution);
    function createScreenReaderHelp() {
        return accessibleViewActions_1.AccessibilityHelpAction.addImplementation(105, 'diff-editor', async (accessor) => {
            const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (!(editorService.activeTextEditorControl instanceof diffEditorWidget_1.DiffEditorWidget)) {
                return;
            }
            const codeEditor = codeEditorService.getActiveCodeEditor() || codeEditorService.getFocusedCodeEditor();
            if (!codeEditor) {
                return;
            }
            const next = keybindingService.lookupKeybinding(commands_1.AccessibleDiffViewerNext.id)?.getAriaLabel();
            const previous = keybindingService.lookupKeybinding(commands_1.AccessibleDiffViewerPrev.id)?.getAriaLabel();
            let switchSides;
            const switchSidesKb = keybindingService.lookupKeybinding('diffEditor.switchSide')?.getAriaLabel();
            if (switchSidesKb) {
                switchSides = (0, nls_1.localize)('msg3', "Run the command Diff Editor: Switch Side ({0}) to toggle between the original and modified editors.", switchSidesKb);
            }
            else {
                switchSides = (0, nls_1.localize)('switchSidesNoKb', "Run the command Diff Editor: Switch Side, which is currently not triggerable via keybinding, to toggle between the original and modified editors.");
            }
            const diffEditorActiveAnnouncement = (0, nls_1.localize)('msg5', "The setting, accessibility.verbosity.diffEditorActive, controls if a diff editor announcement is made when it becomes the active editor.");
            const keys = ['accessibility.signals.diffLineDeleted', 'accessibility.signals.diffLineInserted', 'accessibility.signals.diffLineModified'];
            const content = [
                (0, nls_1.localize)('msg1', "You are in a diff editor."),
                (0, nls_1.localize)('msg2', "View the next ({0}) or previous ({1}) diff in diff review mode, which is optimized for screen readers.", next, previous),
                switchSides,
                diffEditorActiveAnnouncement,
                (0, nls_1.localize)('msg4', "To control which accessibility signals should be played, the following settings can be configured: {0}.", keys.join(', ')),
            ];
            const commentCommandInfo = (0, editorAccessibilityHelp_1.getCommentCommandInfo)(keybindingService, contextKeyService, codeEditor);
            if (commentCommandInfo) {
                content.push(commentCommandInfo);
            }
            accessibleViewService.show({
                id: "diffEditor" /* AccessibleViewProviderId.DiffEditor */,
                verbositySettingKey: "accessibility.verbosity.diffEditor" /* AccessibilityVerbositySettingId.DiffEditor */,
                provideContent: () => content.join('\n\n'),
                onClose: () => {
                    codeEditor.focus();
                },
                options: { type: "help" /* AccessibleViewType.Help */ }
            });
        }, contextkey_1.ContextKeyEqualsExpr.create('isInDiffEditor', true));
    }
    (0, editorExtensions_1.registerDiffEditorContribution)(DiffEditorHelperContribution.ID, DiffEditorHelperContribution);
    platform_1.Registry.as(configuration_2.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'diffEditor.experimental.collapseUnchangedRegions',
            migrateFn: (value, accessor) => {
                return [
                    ['diffEditor.hideUnchangedRegions.enabled', { value }],
                    ['diffEditor.experimental.collapseUnchangedRegions', { value: undefined }]
                ];
            }
        }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvckhlbHBlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9kaWZmRWRpdG9ySGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBMEJoRyxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVO2lCQUM3QixPQUFFLEdBQUcsaUNBQWlDLEFBQXBDLENBQXFDO1FBRTlELFlBQ2tCLFdBQXdCLEVBQ0QscUJBQTRDLEVBQzVDLHFCQUE0QyxFQUM3QyxvQkFBMEM7WUFFakYsS0FBSyxFQUFFLENBQUM7WUFMUyxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNELDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM3Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBSWpGLElBQUksQ0FBQyxTQUFTLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1lBRXpDLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFdBQVcsWUFBWSxtREFBd0IsQ0FBQztZQUVsRixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLGdDQUFtQixFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsb0RBQW9ELENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7Z0JBQ2hNLE1BQU0sb0JBQW9CLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMs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