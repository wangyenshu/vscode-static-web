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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, nls_1, platform_1, actions_1, configuration_1, contextkey_1, platform_2, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMultiCursorModifierAction = void 0;
    class ToggleMultiCursorModifierAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.toggleMultiCursorModifier'; }
        static { this.multiCursorModifierConfigurationKey = 'editor.multiCursorModifier'; }
        constructor() {
            super({
                id: ToggleMultiCursorModifierAction.ID,
                title: (0, nls_1.localize2)('toggleLocation', 'Toggle Multi-Cursor Modifier'),
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const editorConf = configurationService.getValue('editor');
            const newValue = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'alt' : 'ctrlCmd');
            return configurationService.updateValue(ToggleMultiCursorModifierAction.multiCursorModifierConfigurationKey, newValue);
        }
    }
    exports.ToggleMultiCursorModifierAction = ToggleMultiCursorModifierAction;
    const multiCursorModifier = new contextkey_1.RawContextKey('multiCursorModifier', 'altKey');
    let MultiCursorModifierContextKeyController = class MultiCursorModifierContextKeyController {
        constructor(configurationService, contextKeyService) {
            this.configurationService = configurationService;
            this._multiCursorModifier = multiCursorModifier.bindTo(contextKeyService);
            this._update();
            configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.multiCursorModifier')) {
                    this._update();
                }
            });
        }
        _update() {
            const editorConf = this.configurationService.getValue('editor');
            const value = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'ctrlCmd' : 'altKey');
            this._multiCursorModifier.set(value);
        }
    };
    MultiCursorModifierContextKeyController = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, contextkey_1.IContextKeyService)
    ], MultiCursorModifierContextKeyController);
    platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(MultiCursorModifierContextKeyController, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(ToggleMultiCursorModifierAction);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleMultiCursorModifierAction.ID,
            title: (0, nls_1.localize)('miMultiCursorAlt', "Switch to Alt+Click for Multi-Cursor")
        },
        when: multiCursorModifier.isEqualTo('ctrlCmd'),
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleMultiCursorModifierAction.ID,
            title: (platform_1.isMacintosh
                ? (0, nls_1.localize)('miMultiCursorCmd', "Switch to Cmd+Click for Multi-Cursor")
                : (0, nls_1.localize)('miMultiCursorCtrl', "Switch to Ctrl+Click for Multi-Cursor"))
        },
        when: multiCursorModifier.isEqualTo('altKey'),
        order: 1
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlTXVsdGlDdXJzb3JNb2RpZmllci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci90b2dnbGVNdWx0aUN1cnNvck1vZGlmaWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVloRyxNQUFhLCtCQUFnQyxTQUFRLGlCQUFPO2lCQUUzQyxPQUFFLEdBQUcsNENBQTRDLENBQUM7aUJBRTFDLHdDQUFtQyxHQUFHLDRCQUE0QixDQUFDO1FBRTNGO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwrQkFBK0IsQ0FBQyxFQUFFO2dCQUN0QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsZ0JBQWdCLEVBQUUsOEJBQThCLENBQUM7Z0JBQ2xFLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLEdBQUcsQ0FBQyxRQUEwQjtZQUN0QyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUVqRSxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQTZDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZHLE1BQU0sUUFBUSxHQUFzQixDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFdkcsT0FBTyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsK0JBQStCLENBQUMsbUNBQW1DLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEgsQ0FBQzs7SUFyQkYsMEVBc0JDO0lBRUQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLDBCQUFhLENBQVMscUJBQXFCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFdkYsSUFBTSx1Q0FBdUMsR0FBN0MsTUFBTSx1Q0FBdUM7UUFJNUMsWUFDeUMsb0JBQTJDLEVBQy9ELGlCQUFxQztZQURqQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBR25GLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUUxRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZixvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNuRCxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUM7b0JBQzFELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLE9BQU87WUFDZCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUE2QyxRQUFRLENBQUMsQ0FBQztZQUM1RyxNQUFNLEtBQUssR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEYsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxDQUFDO0tBQ0QsQ0FBQTtJQXZCSyx1Q0FBdUM7UUFLMUMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLCtCQUFrQixDQUFBO09BTmYsdUNBQXVDLENBdUI1QztJQUVELG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyx1Q0FBdUMsa0NBQTBCLENBQUM7SUFFNUssSUFBQSx5QkFBZSxFQUFDLCtCQUErQixDQUFDLENBQUM7SUFFakQsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxvQkFBb0IsRUFBRTtRQUN4RCxLQUFLLEVBQUUsVUFBVTtRQUNqQixPQUFPLEVBQUU7WUFDUixFQUFFLEVBQUUsK0JBQStCLENBQUMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsc0NBQXNDLENBQUM7U0FDM0U7UUFDRCxJQUFJLEVBQUUsbUJBQW1CLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUM5QyxLQUFLLEVBQUUsQ0FBQztLQUNSLENBQUMsQ0FBQztJQUNILHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsb0JBQW9CLEVBQUU7UUFDeEQsS0FBSyxFQUFFLFVBQVU7UUFDakIsT0FBTyxFQUFFO1lBQ1IsRUFBRSxFQUFFLCtCQUErQixDQUFDLEVBQUU7WUFDdEMsS0FBSyxFQUFFLENBQ04sc0JBQVc7Z0JBQ1YsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLHNDQUFzQyxDQUFDO2dCQUN0RSxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsdUNBQXVDLENBQUMsQ0FDekU7U0FDRDtRQUNELElBQUksRUFBRSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBQzdDLEtBQUssRUFBRSxDQUFDO0tBQ1IsQ0FBQyxDQUFDIn0=