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
define(["require", "exports", "vs/nls", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/lifecycle", "vs/platform/keyboardLayout/common/keyboardLayout", "vs/workbench/common/contributions", "vs/workbench/contrib/preferences/common/preferences", "vs/base/common/platform", "vs/platform/quickinput/common/quickInput", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/base/common/buffer"], function (require, exports, nls, statusbar_1, lifecycle_1, keyboardLayout_1, contributions_1, preferences_1, platform_1, quickInput_1, actions_1, configuration_1, environment_1, files_1, editorService_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutPickerContribution = void 0;
    let KeyboardLayoutPickerContribution = class KeyboardLayoutPickerContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.keyboardLayoutPicker'; }
        constructor(keyboardLayoutService, statusbarService) {
            super();
            this.keyboardLayoutService = keyboardLayoutService;
            this.statusbarService = statusbarService;
            this.pickerElement = this._register(new lifecycle_1.MutableDisposable());
            const name = nls.localize('status.workbench.keyboardLayout', "Keyboard Layout");
            const layout = this.keyboardLayoutService.getCurrentKeyboardLayout();
            if (layout) {
                const layoutInfo = (0, keyboardLayout_1.parseKeyboardLayoutDescription)(layout);
                const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                this.pickerElement.value = this.statusbarService.addEntry({
                    name,
                    text,
                    ariaLabel: text,
                    command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                }, 'status.workbench.keyboardLayout', 1 /* StatusbarAlignment.RIGHT */);
            }
            this._register(this.keyboardLayoutService.onDidChangeKeyboardLayout(() => {
                const layout = this.keyboardLayoutService.getCurrentKeyboardLayout();
                const layoutInfo = (0, keyboardLayout_1.parseKeyboardLayoutDescription)(layout);
                if (this.pickerElement.value) {
                    const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                    this.pickerElement.value.update({
                        name,
                        text,
                        ariaLabel: text,
                        command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                    });
                }
                else {
                    const text = nls.localize('keyboardLayout', "Layout: {0}", layoutInfo.label);
                    this.pickerElement.value = this.statusbarService.addEntry({
                        name,
                        text,
                        ariaLabel: text,
                        command: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER
                    }, 'status.workbench.keyboardLayout', 1 /* StatusbarAlignment.RIGHT */);
                }
            }));
        }
    };
    exports.KeyboardLayoutPickerContribution = KeyboardLayoutPickerContribution;
    exports.KeyboardLayoutPickerContribution = KeyboardLayoutPickerContribution = __decorate([
        __param(0, keyboardLayout_1.IKeyboardLayoutService),
        __param(1, statusbar_1.IStatusbarService)
    ], KeyboardLayoutPickerContribution);
    (0, contributions_1.registerWorkbenchContribution2)(KeyboardLayoutPickerContribution.ID, KeyboardLayoutPickerContribution, 1 /* WorkbenchPhase.BlockStartup */);
    const DEFAULT_CONTENT = [
        `// ${nls.localize('displayLanguage', 'Defines the keyboard layout used in VS Code in the browser environment.')}`,
        `// ${nls.localize('doc', 'Open VS Code and run "Developer: Inspect Key Mappings (JSON)" from Command Palette.')}`,
        ``,
        `// Once you have the keyboard layout info, please paste it below.`,
        '\n'
    ].join('\n');
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: preferences_1.KEYBOARD_LAYOUT_OPEN_PICKER,
                title: nls.localize2('keyboard.chooseLayout', "Change Keyboard Layout"),
                f1: true
            });
        }
        async run(accessor) {
            const keyboardLayoutService = accessor.get(keyboardLayout_1.IKeyboardLayoutService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const environmentService = accessor.get(environment_1.IEnvironmentService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const layouts = keyboardLayoutService.getAllKeyboardLayouts();
            const currentLayout = keyboardLayoutService.getCurrentKeyboardLayout();
            const layoutConfig = configurationService.getValue('keyboard.layout');
            const isAutoDetect = layoutConfig === 'autodetect';
            const picks = layouts.map(layout => {
                const picked = !isAutoDetect && (0, keyboardLayout_1.areKeyboardLayoutsEqual)(currentLayout, layout);
                const layoutInfo = (0, keyboardLayout_1.parseKeyboardLayoutDescription)(layout);
                return {
                    layout: layout,
                    label: [layoutInfo.label, (layout && layout.isUserKeyboardLayout) ? '(User configured layout)' : ''].join(' '),
                    id: layout.text || layout.lang || layout.layout,
                    description: layoutInfo.description + (picked ? ' (Current layout)' : ''),
                    picked: !isAutoDetect && (0, keyboardLayout_1.areKeyboardLayoutsEqual)(currentLayout, layout)
                };
            }).sort((a, b) => {
                return a.label < b.label ? -1 : (a.label > b.label ? 1 : 0);
            });
            if (picks.length > 0) {
                const platform = platform_1.isMacintosh ? 'Mac' : platform_1.isWindows ? 'Win' : 'Linux';
                picks.unshift({ type: 'separator', label: nls.localize('layoutPicks', "Keyboard Layouts ({0})", platform) });
            }
            const configureKeyboardLayout = { label: nls.localize('configureKeyboardLayout', "Configure Keyboard Layout") };
            picks.unshift(configureKeyboardLayout);
            // Offer to "Auto Detect"
            const autoDetectMode = {
                label: nls.localize('autoDetect', "Auto Detect"),
                description: isAutoDetect ? `Current: ${(0, keyboardLayout_1.parseKeyboardLayoutDescription)(currentLayout).label}` : undefined,
                picked: isAutoDetect ? true : undefined
            };
            picks.unshift(autoDetectMode);
            const pick = await quickInputService.pick(picks, { placeHolder: nls.localize('pickKeyboardLayout', "Select Keyboard Layout"), matchOnDescription: true });
            if (!pick) {
                return;
            }
            if (pick === autoDetectMode) {
                // set keymap service to auto mode
                configurationService.updateValue('keyboard.layout', 'autodetect');
                return;
            }
            if (pick === configureKeyboardLayout) {
                const file = environmentService.keyboardLayoutResource;
                await fileService.stat(file).then(undefined, () => {
                    return fileService.createFile(file, buffer_1.VSBuffer.fromString(DEFAULT_CONTENT));
                }).then((stat) => {
                    if (!stat) {
                        return undefined;
                    }
                    return editorService.openEditor({
                        resource: stat.resource,
                        languageId: 'jsonc',
                        options: { pinned: true }
                    });
                }, (error) => {
                    throw new Error(nls.localize('fail.createSettings', "Unable to create '{0}' ({1}).", file.toString(), error));
                });
                return Promise.resolve();
            }
            configurationService.updateValue('keyboard.layout', (0, keyboardLayout_1.getKeyboardLayoutId)(pick.layout));
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmRMYXlvdXRQaWNrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL2tleWJvYXJkTGF5b3V0UGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtpQkFFL0MsT0FBRSxHQUFHLHdDQUF3QyxBQUEzQyxDQUE0QztRQUk5RCxZQUN5QixxQkFBOEQsRUFDbkUsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBSGlDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDbEQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUp2RCxrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBUWpHLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUNBQWlDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUVoRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNyRSxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE1BQU0sVUFBVSxHQUFHLElBQUEsK0NBQThCLEVBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFN0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FDeEQ7b0JBQ0MsSUFBSTtvQkFD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