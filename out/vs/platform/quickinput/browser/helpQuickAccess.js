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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput"], function (require, exports, nls_1, platform_1, lifecycle_1, keybinding_1, quickAccess_1, quickInput_1) {
    "use strict";
    var HelpQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HelpQuickAccessProvider = void 0;
    let HelpQuickAccessProvider = class HelpQuickAccessProvider {
        static { HelpQuickAccessProvider_1 = this; }
        static { this.PREFIX = '?'; }
        constructor(quickInputService, keybindingService) {
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
            this.registry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
        }
        provide(picker) {
            const disposables = new lifecycle_1.DisposableStore();
            // Open a picker with the selected value if picked
            disposables.add(picker.onDidAccept(() => {
                const [item] = picker.selectedItems;
                if (item) {
                    this.quickInputService.quickAccess.show(item.prefix, { preserveValue: true });
                }
            }));
            // Also open a picker when we detect the user typed the exact
            // name of a provider (e.g. `?term` for terminals)
            disposables.add(picker.onDidChangeValue(value => {
                const providerDescriptor = this.registry.getQuickAccessProvider(value.substr(HelpQuickAccessProvider_1.PREFIX.length));
                if (providerDescriptor && providerDescriptor.prefix && providerDescriptor.prefix !== HelpQuickAccessProvider_1.PREFIX) {
                    this.quickInputService.quickAccess.show(providerDescriptor.prefix, { preserveValue: true });
                }
            }));
            // Fill in all providers
            picker.items = this.getQuickAccessProviders().filter(p => p.prefix !== HelpQuickAccessProvider_1.PREFIX);
            return disposables;
        }
        getQuickAccessProviders() {
            const providers = this.registry
                .getQuickAccessProviders()
                .sort((providerA, providerB) => providerA.prefix.localeCompare(providerB.prefix))
                .flatMap(provider => this.createPicks(provider));
            return providers;
        }
        createPicks(provider) {
            return provider.helpEntries.map(helpEntry => {
                const prefix = helpEntry.prefix || provider.prefix;
                const label = prefix || '\u2026' /* ... */;
                return {
                    prefix,
                    label,
                    keybinding: helpEntry.commandId ? this.keybindingService.lookupKeybinding(helpEntry.commandId) : undefined,
                    ariaLabel: (0, nls_1.localize)('helpPickAriaLabel', "{0}, {1}", label, helpEntry.description),
                    description: helpEntry.description
                };
            });
        }
    };
    exports.HelpQuickAccessProvider = HelpQuickAccessProvider;
    exports.HelpQuickAccessProvider = HelpQuickAccessProvider = HelpQuickAccessProvider_1 = __decorate([
        __param(0, quickInput_1.IQuickInputService),
        __param(1, keybinding_1.IKeybindingService)
    ], HelpQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscFF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcXVpY2tpbnB1dC9icm93c2VyL2hlbHBRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCOztpQkFFNUIsV0FBTSxHQUFHLEdBQUcsQUFBTixDQUFPO1FBSXBCLFlBQ3FCLGlCQUFzRCxFQUN0RCxpQkFBc0Q7WUFEckMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNyQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBSjFELGFBQVEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBdUIsd0JBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUtsRixDQUFDO1FBRUwsT0FBTyxDQUFDLE1BQTRDO1lBQ25ELE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLGtEQUFrRDtZQUNsRCxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO2dCQUN2QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztnQkFDcEMsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDVixJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQy9FLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosNkRBQTZEO1lBQzdELGtEQUFrRDtZQUNsRCxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDL0MsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMseUJBQXVCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3JILElBQUksa0JBQWtCLElBQUksa0JBQWtCLENBQUMsTUFBTSxJQUFJLGtCQUFrQixDQUFDLE1BQU0sS0FBSyx5QkFBdUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDckgsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzdGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosd0JBQXdCO1lBQ3hCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyx5QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV2RyxPQUFPLFdBQVcsQ0FBQztRQUNwQixDQUFDO1FBRUQsdUJBQXVCO1lBQ3RCLE1BQU0sU0FBUyxHQUErQixJQUFJLENBQUMsUUFBUTtpQkFDekQsdUJBQXVCLEVBQUU7aUJBQ3pCLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDaEYsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRWxELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFTyxXQUFXLENBQUMsUUFBd0M7WUFDM0QsT0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDM0MsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDO2dCQUNuRCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQztnQkFFM0MsT0FBTztvQkFDTixNQUFNO29CQUNOLEtBQUs7b0JBQ0wsVUFBVSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7b0JBQzFHLFNBQVMsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUM7b0JBQ2xGLFdBQVcsRUFBRSxTQUFTLENBQUMsV0FBVztpQkFDbEMsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUEzRFcsMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFPakMsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLCtCQUFrQixDQUFBO09BUlIsdUJBQXVCLENBNERuQyJ9