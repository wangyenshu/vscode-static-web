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
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/viewPane", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/opener/common/opener", "vs/workbench/common/contextkeys", "vs/workbench/browser/actions/workspaceActions", "vs/base/common/platform", "vs/editor/browser/editorBrowser", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/browser/debugCommands", "vs/platform/hover/browser/hover"], function (require, exports, themeService_1, keybinding_1, contextView_1, configuration_1, contextkey_1, nls_1, debug_1, editorService_1, viewPane_1, instantiation_1, views_1, platform_1, opener_1, contextkeys_1, workspaceActions_1, platform_2, editorBrowser_1, storage_1, telemetry_1, lifecycle_1, debugCommands_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WelcomeView = void 0;
    const debugStartLanguageKey = 'debugStartLanguage';
    const CONTEXT_DEBUG_START_LANGUAGE = new contextkey_1.RawContextKey(debugStartLanguageKey, undefined);
    const CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR = new contextkey_1.RawContextKey('debuggerInterestedInActiveEditor', false);
    let WelcomeView = class WelcomeView extends viewPane_1.ViewPane {
        static { this.ID = 'workbench.debug.welcome'; }
        static { this.LABEL = (0, nls_1.localize2)('run', "Run"); }
        constructor(options, themeService, keybindingService, contextMenuService, configurationService, contextKeyService, debugService, editorService, instantiationService, viewDescriptorService, openerService, storageSevice, telemetryService, hoverService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, hoverService);
            this.debugService = debugService;
            this.editorService = editorService;
            this.debugStartLanguageContext = CONTEXT_DEBUG_START_LANGUAGE.bindTo(contextKeyService);
            this.debuggerInterestedContext = CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR.bindTo(contextKeyService);
            const lastSetLanguage = storageSevice.get(debugStartLanguageKey, 1 /* StorageScope.WORKSPACE */);
            this.debugStartLanguageContext.set(lastSetLanguage);
            const setContextKey = () => {
                let editorControl = this.editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isDiffEditor)(editorControl)) {
                    editorControl = editorControl.getModifiedEditor();
                }
                if ((0, editorBrowser_1.isCodeEditor)(editorControl)) {
                    const model = editorControl.getModel();
                    const language = model ? model.getLanguageId() : undefined;
                    if (language && this.debugService.getAdapterManager().someDebuggerInterestedInLanguage(language)) {
                        this.debugStartLanguageContext.set(language);
                        this.debuggerInterestedContext.set(true);
                        storageSevice.store(debugStartLanguageKey, language, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                        return;
                    }
                }
                this.debuggerInterestedContext.set(false);
            };
            const disposables = new lifecycle_1.DisposableStore();
            this._register(disposables);
            this._register(editorService.onDidActiveEditorChange(() => {
                disposables.clear();
                let editorControl = this.editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isDiffEditor)(editorControl)) {
                    editorControl = editorControl.getModifiedEditor();
                }
                if ((0, editorBrowser_1.isCodeEditor)(editorControl)) {
                    disposables.add(editorControl.onDidChangeModelLanguage(setContextKey));
                }
                setContextKey();
            }));
            this._register(this.debugService.getAdapterManager().onDidRegisterDebugger(setContextKey));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible) {
                    setContextKey();
                }
            }));
            setContextKey();
            const debugKeybinding = this.keybindingService.lookupKeybinding(debugCommands_1.DEBUG_START_COMMAND_ID);
            debugKeybindingLabel = debugKeybinding ? ` (${debugKeybinding.getLabel()})` : '';
        }
        shouldShowWelcome() {
            return true;
        }
    };
    exports.WelcomeView = WelcomeView;
    exports.WelcomeView = WelcomeView = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, debug_1.IDebugService),
        __param(7, editorService_1.IEditorService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, opener_1.IOpenerService),
        __param(11, storage_1.IStorageService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, hover_1.IHoverService)
    ], WelcomeView);
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)({
            key: 'openAFileWhichCanBeDebugged',
            comment: [
                'Please do not translate the word "command", it is part of our internal syntax which must not change',
                '{Locked="](command:{0})"}'
            ]
        }, "[Open a file](command:{0}) which can be debugged or run.", (platform_2.isMacintosh && !platform_2.isWeb) ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFileAction.ID),
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR.toNegated()),
        group: views_1.ViewContentGroups.Open,
    });
    let debugKeybindingLabel = '';
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: `[${(0, nls_1.localize)('runAndDebugAction', "Run and Debug")}${debugKeybindingLabel}](command:${debugCommands_1.DEBUG_START_COMMAND_ID})`,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
        group: views_1.ViewContentGroups.Debug,
        // Allow inserting more buttons directly after this one (by setting order to 1).
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: `[${(0, nls_1.localize)('detectThenRunAndDebug', "Show all automatic debug configurations")}](command:${debugCommands_1.SELECT_AND_START_ID}).`,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
        group: views_1.ViewContentGroups.Debug,
        order: 10
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)({
            key: 'customizeRunAndDebug',
            comment: [
                'Please do not translate the word "command", it is part of our internal syntax which must not change',
                '{Locked="](command:{0})"}'
            ]
        }, "To customize Run and Debug [create a launch.json file](command:{0}).", debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID),
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, contextkeys_1.WorkbenchStateContext.notEqualsTo('empty')),
        group: views_1.ViewContentGroups.Debug
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)({
            key: 'customizeRunAndDebugOpenFolder',
            comment: [
                'Please do not translate the word "command", it is part of our internal syntax which must not change',
                'Please do not translate "launch.json", it is the specific configuration file name',
                '{Locked="](command:{0})"}',
            ]
        }, "To customize Run and Debug, [open a folder](command:{0}) and create a launch.json file.", (platform_2.isMacintosh && !platform_2.isWeb) ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFolderAction.ID),
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, contextkeys_1.WorkbenchStateContext.isEqualTo('empty')),
        group: views_1.ViewContentGroups.Debug
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)('allDebuggersDisabled', "All debug extensions are disabled. Enable a debug extension or install a new one from the Marketplace."),
        when: debug_1.CONTEXT_DEBUG_EXTENSION_AVAILABLE.toNegated(),
        group: views_1.ViewContentGroups.Debug
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VsY29tZVZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL3dlbGNvbWVWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCaEcsTUFBTSxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztJQUNuRCxNQUFNLDRCQUE0QixHQUFHLElBQUksMEJBQWEsQ0FBUyxxQkFBcUIsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNqRyxNQUFNLDRDQUE0QyxHQUFHLElBQUksMEJBQWEsQ0FBVSxrQ0FBa0MsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVwSCxJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEsbUJBQVE7aUJBRXhCLE9BQUUsR0FBRyx5QkFBeUIsQUFBNUIsQ0FBNkI7aUJBQy9CLFVBQUssR0FBcUIsSUFBQSxlQUFTLEVBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxBQUE1QyxDQUE2QztRQUtsRSxZQUNDLE9BQTRCLEVBQ2IsWUFBMkIsRUFDdEIsaUJBQXFDLEVBQ3BDLGtCQUF1QyxFQUNyQyxvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQ3pCLFlBQTJCLEVBQzFCLGFBQTZCLEVBQ3ZDLG9CQUEyQyxFQUMxQyxxQkFBNkMsRUFDckQsYUFBNkIsRUFDNUIsYUFBOEIsRUFDNUIsZ0JBQW1DLEVBQ3ZDLFlBQTJCO1lBRTFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQztZQVR6SyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUMxQixrQkFB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