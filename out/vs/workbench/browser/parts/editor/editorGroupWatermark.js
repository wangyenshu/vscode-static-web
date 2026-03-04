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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/keybinding/common/keybinding", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/browser/dom", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry"], function (require, exports, nls_1, lifecycle_1, platform_1, keybinding_1, workspace_1, configuration_1, dom_1, keybindingLabel_1, commands_1, contextkey_1, defaultStyles_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorGroupWatermark = void 0;
    (0, colorRegistry_1.registerColor)('editorWatermark.foreground', { dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.6), light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.68), hcDark: colorRegistry_1.editorForeground, hcLight: colorRegistry_1.editorForeground }, (0, nls_1.localize)('editorLineHighlight', 'Foreground color for the labels in the editor watermark.'));
    const showCommands = { text: (0, nls_1.localize)('watermark.showCommands', "Show All Commands"), id: 'workbench.action.showCommands' };
    const quickAccess = { text: (0, nls_1.localize)('watermark.quickAccess', "Go to File"), id: 'workbench.action.quickOpen' };
    const openFileNonMacOnly = { text: (0, nls_1.localize)('watermark.openFile', "Open File"), id: 'workbench.action.files.openFile', mac: false };
    const openFolderNonMacOnly = { text: (0, nls_1.localize)('watermark.openFolder', "Open Folder"), id: 'workbench.action.files.openFolder', mac: false };
    const openFileOrFolderMacOnly = { text: (0, nls_1.localize)('watermark.openFileFolder', "Open File or Folder"), id: 'workbench.action.files.openFileFolder', mac: true };
    const openRecent = { text: (0, nls_1.localize)('watermark.openRecent', "Open Recent"), id: 'workbench.action.openRecent' };
    const newUntitledFileMacOnly = { text: (0, nls_1.localize)('watermark.newUntitledFile', "New Untitled Text File"), id: 'workbench.action.files.newUntitledFile', mac: true };
    const findInFiles = { text: (0, nls_1.localize)('watermark.findInFiles', "Find in Files"), id: 'workbench.action.findInFiles' };
    const toggleTerminal = { text: (0, nls_1.localize)({ key: 'watermark.toggleTerminal', comment: ['toggle is a verb here'] }, "Toggle Terminal"), id: 'workbench.action.terminal.toggleTerminal', when: contextkey_1.ContextKeyExpr.equals('terminalProcessSupported', true) };
    const startDebugging = { text: (0, nls_1.localize)('watermark.startDebugging', "Start Debugging"), id: 'workbench.action.debug.start', when: contextkey_1.ContextKeyExpr.equals('terminalProcessSupported', true) };
    const toggleFullscreen = { text: (0, nls_1.localize)({ key: 'watermark.toggleFullscreen', comment: ['toggle is a verb here'] }, "Toggle Full Screen"), id: 'workbench.action.toggleFullScreen' };
    const showSettings = { text: (0, nls_1.localize)('watermark.showSettings', "Show Settings"), id: 'workbench.action.openSettings' };
    const noFolderEntries = [
        showCommands,
        openFileNonMacOnly,
        openFolderNonMacOnly,
        openFileOrFolderMacOnly,
        openRecent,
        newUntitledFileMacOnly
    ];
    const folderEntries = [
        showCommands,
        quickAccess,
        findInFiles,
        startDebugging,
        toggleTerminal,
        toggleFullscreen,
        showSettings
    ];
    let EditorGroupWatermark = class EditorGroupWatermark extends lifecycle_1.Disposable {
        constructor(container, keybindingService, contextService, contextKeyService, configurationService) {
            super();
            this.keybindingService = keybindingService;
            this.contextService = contextService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.transientDisposables = this._register(new lifecycle_1.DisposableStore());
            this.enabled = false;
            const elements = (0, dom_1.h)('.editor-group-watermark', [
                (0, dom_1.h)('.letterpress'),
                (0, dom_1.h)('.shortcuts@shortcuts'),
            ]);
            (0, dom_1.append)(container, elements.root);
            this.shortcuts = elements.shortcuts;
            this.registerListeners();
            this.workbenchState = contextService.getWorkbenchState();
            this.render();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.tips.enabled')) {
                    this.render();
                }
            }));
            this._register(this.contextService.onDidChangeWorkbenchState(workbenchState => {
                if (this.workbenchState === workbenchState) {
                    return;
                }
                this.workbenchState = workbenchState;
                this.render();
            }));
            const allEntriesWhenClauses = [...noFolderEntries, ...folderEntries].filter(entry => entry.when !== undefined).map(entry => entry.when);
            const allKeys = new Set();
            allEntriesWhenClauses.forEach(when => when.keys().forEach(key => allKeys.add(key)));
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(allKeys)) {
                    this.render();
                }
            }));
        }
        render() {
            const enabled = this.configurationService.getValue('workbench.tips.enabled');
            if (enabled === this.enabled) {
                return;
            }
            this.enabled = enabled;
            this.clear();
            if (!enabled) {
                return;
            }
            const box = (0, dom_1.append)(this.shortcuts, (0, dom_1.$)('.watermark-box'));
            const folder = this.workbenchState !== 1 /* WorkbenchState.EMPTY */;
            const selected = (folder ? folderEntries : noFolderEntries)
                .filter(entry => !('when' in entry) || this.contextKeyService.contextMatchesRules(entry.when))
                .filter(entry => !('mac' in entry) || entry.mac === (platform_1.isMacintosh && !platform_1.isWeb))
                .filter(entry => !!commands_1.CommandsRegistry.getCommand(entry.id))
                .filter(entry => !!this.keybindingService.lookupKeybinding(entry.id));
            const update = () => {
                (0, dom_1.clearNode)(box);
                for (const entry of selected) {
                    const keys = this.keybindingService.lookupKeybinding(entry.id);
                    if (!keys) {
                        continue;
                    }
                    const dl = (0, dom_1.append)(box, (0, dom_1.$)('dl'));
                    const dt = (0, dom_1.append)(dl, (0, dom_1.$)('dt'));
                    dt.textContent = entry.text;
                    const dd = (0, dom_1.append)(dl, (0, dom_1.$)('dd'));
                    this.keybindingLabel?.dispose();
                    this.keybindingLabel = new keybindingLabel_1.KeybindingLabel(dd, platform_1.OS, { renderUnboundKeybindings: true, ...defaultStyles_1.defaultKeybindingLabelStyles });
                    this.keybindingLabel.set(keys);
                }
            };
            update();
            this.transientDisposables.add(this.keybindingService.onDidUpdateKeybindings(update));
        }
        clear() {
            (0, dom_1.clearNode)(this.shortcuts);
            this.transientDisposables.clear();
        }
        dispose() {
            super.dispose();
            this.clear();
            this.keybindingLabel?.dispose();
        }
    };
    exports.EditorGroupWatermark = EditorGroupWatermark;
    exports.EditorGroupWatermark = EditorGroupWatermark = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService)
    ], EditorGroupWatermark);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBXYXRlcm1hcmsuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yR3JvdXBXYXRlcm1hcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZWhHLElBQUEsNkJBQWEsRUFBQyw0QkFBNEIsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFBLDJCQUFXLEVBQUMsZ0NBQWdCLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUEsMkJBQVcsRUFBQyxnQ0FBZ0IsRUFBRSxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsZ0NBQWdCLEVBQUUsT0FBTyxFQUFFLGdDQUFnQixFQUFFLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsMERBQTBELENBQUMsQ0FBQyxDQUFDO0lBU3hSLE1BQU0sWUFBWSxHQUFtQixFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSwrQkFBK0IsRUFBRSxDQUFDO0lBQzVJLE1BQU0sV0FBVyxHQUFtQixFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxZQUFZLENBQUMsRUFBRSxFQUFFLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQztJQUNoSSxNQUFNLGtCQUFrQixHQUFtQixFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsaUNBQWlDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3BKLE1BQU0sb0JBQW9CLEdBQW1CLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGFBQWEs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