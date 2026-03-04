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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/common/async", "vs/editor/common/languages/language", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/editor/common/editorContextKeys", "vs/base/common/network", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, editorBrowser_1, nls_1, platform_1, contributions_1, editorService_1, statusbar_1, languageDetectionWorkerService_1, async_1, language_1, keybinding_1, actions_1, notification_1, contextkey_1, notebookContextKeys_1, editorContextKeys_1, network_1, configuration_1) {
    "use strict";
    var LanguageDetectionStatusContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    const detectLanguageCommandId = 'editor.detectLanguage';
    let LanguageDetectionStatusContribution = class LanguageDetectionStatusContribution {
        static { LanguageDetectionStatusContribution_1 = this; }
        static { this._id = 'status.languageDetectionStatus'; }
        constructor(_languageDetectionService, _statusBarService, _configurationService, _editorService, _languageService, _keybindingService) {
            this._languageDetectionService = _languageDetectionService;
            this._statusBarService = _statusBarService;
            this._configurationService = _configurationService;
            this._editorService = _editorService;
            this._languageService = _languageService;
            this._keybindingService = _keybindingService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._delayer = new async_1.ThrottledDelayer(1000);
            this._renderDisposables = new lifecycle_1.DisposableStore();
            _editorService.onDidActiveEditorChange(() => this._update(true), this, this._disposables);
            this._update(false);
        }
        dispose() {
            this._disposables.dispose();
            this._delayer.dispose();
            this._combinedEntry?.dispose();
            this._renderDisposables.dispose();
        }
        _update(clear) {
            if (clear) {
                this._combinedEntry?.dispose();
                this._combinedEntry = undefined;
            }
            this._delayer.trigger(() => this._doUpdate());
        }
        async _doUpdate() {
            const editor = (0, editorBrowser_1.getCodeEditor)(this._editorService.activeTextEditorControl);
            this._renderDisposables.clear();
            // update when editor language changes
            editor?.onDidChangeModelLanguage(() => this._update(true), this, this._renderDisposables);
            editor?.onDidChangeModelContent(() => this._update(false), this, this._renderDisposables);
            const editorModel = editor?.getModel();
            const editorUri = editorModel?.uri;
            const existingId = editorModel?.getLanguageId();
            const enablementConfig = this._configurationService.getValue('workbench.editor.languageDetectionHints');
            const enabled = typeof enablementConfig === 'object' && enablementConfig?.untitledEditors;
            const disableLightbulb = !enabled || editorUri?.scheme !== network_1.Schemas.untitled || !existingId;
            if (disableLightbulb || !editorUri) {
                this._combinedEntry?.dispose();
                this._combinedEntry = undefined;
            }
            else {
                const lang = await this._languageDetectionService.detectLanguage(editorUri);
                const skip = { 'jsonc': 'json' };
                const existing = editorModel.getLanguageId();
                if (lang && lang !== existing && skip[existing] !== lang) {
                    const detectedName = this._languageService.getLanguageName(lang) || lang;
                    let tooltip = (0, nls_1.localize)('status.autoDetectLanguage', "Accept Detected Language: {0}", detectedName);
                    const keybinding = this._keybindingService.lookupKeybinding(detectLanguageCommandId);
                    const label = keybinding?.getLabel();
                    if (label) {
                        tooltip += ` (${label})`;
                    }
                    const props = {
                        name: (0, nls_1.localize)('langDetection.name', "Language Detection"),
                        ariaLabel: (0, nls_1.localize)('langDetection.aria', "Change to Detected Language: {0}", lang),
                        tooltip,
                        command: detectLanguageCommandId,
                        text: '$(lightbulb-autofix)',
                    };
                    if (!this._combinedEntry) {
                        this._combinedEntry = this._statusBarService.addEntry(props, LanguageDetectionStatusContribution_1._id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 1 /* StatusbarAlignment.RIGHT */, compact: true });
                    }
                    else {
                        this._combinedEntry.update(props);
                    }
                }
                else {
                    this._combinedEntry?.dispose();
                    this._combinedEntry = undefined;
                }
            }
        }
    };
    LanguageDetectionStatusContribution = LanguageDetectionStatusContribution_1 = __decorate([
        __param(0, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorService_1.IEditorService),
        __param(4, language_1.ILanguageService),
        __param(5, keybinding_1.IKeybindingService)
    ], LanguageDetectionStatusContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LanguageDetectionStatusContribution, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: detectLanguageCommandId,
                title: (0, nls_1.localize2)('detectlang', "Detect Language from Content"),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.toNegated(), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                keybinding: { primary: 34 /* KeyCode.KeyD */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */, weight: 200 /* KeybindingWeight.WorkbenchContrib */ }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const editor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
            const notificationService = accessor.get(notification_1.INotificationService);
            const editorUri = editor?.getModel()?.uri;
            if (editorUri) {
                const lang = await languageDetectionService.detectLanguage(editorUri);
                if (lang) {
                    editor.getModel()?.setLanguage(lang, languageDetectionWorkerService_1.LanguageDetectionLanguageEventSource);
                }
                else {
                    notificationService.warn((0, nls_1.localize)('noDetection', "Unable to detect editor language"));
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VEZXRlY3Rpb24uY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbGFuZ3VhZ2VEZXRlY3Rpb24vYnJvd3Nlci9sYW5ndWFnZURldGVjdGlvbi5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxNQUFNLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBRXhELElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW1DOztpQkFFaEIsUUFBRyxHQUFHLGdDQUFnQyxBQUFuQyxDQUFvQztRQU8vRCxZQUM0Qix5QkFBcUUsRUFDN0UsaUJBQXFELEVBQ2pELHFCQUE2RCxFQUNwRSxjQUErQyxFQUM3QyxnQkFBbUQsRUFDakQsa0JBQXVEO1lBTC9CLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMkI7WUFDNUQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNoQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ25ELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM1QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ2hDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFYM0QsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUU5QyxhQUFRLEdBQUcsSUFBSSx3QkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3Qix1QkFBa0IsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVUzRCxjQUFjLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzFG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