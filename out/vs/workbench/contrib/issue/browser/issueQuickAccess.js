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
define(["require", "exports", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/filters", "vs/nls", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extensions", "vs/base/common/themables", "vs/base/common/codicons", "vs/platform/issue/common/issue", "vs/platform/product/common/productService"], function (require, exports, pickerQuickAccess_1, contextkey_1, actions_1, filters_1, nls_1, commands_1, extensions_1, themables_1, codicons_1, issue_1, productService_1) {
    "use strict";
    var IssueQuickAccess_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IssueQuickAccess = void 0;
    let IssueQuickAccess = class IssueQuickAccess extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { IssueQuickAccess_1 = this; }
        static { this.PREFIX = 'issue '; }
        constructor(menuService, contextKeyService, commandService, extensionService, productService) {
            super(IssueQuickAccess_1.PREFIX, { canAcceptInBackground: true });
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.commandService = commandService;
            this.extensionService = extensionService;
            this.productService = productService;
        }
        _getPicks(filter) {
            const issuePicksConst = new Array();
            const issuePicksParts = new Array();
            const extensionIdSet = new Set();
            // Add default items
            const productLabel = this.productService.nameLong;
            const marketPlaceLabel = (0, nls_1.localize)("reportExtensionMarketplace", "Extension Marketplace");
            const productFilter = (0, filters_1.matchesFuzzy)(filter, productLabel, true);
            const marketPlaceFilter = (0, filters_1.matchesFuzzy)(filter, marketPlaceLabel, true);
            // Add product pick if product filter matches
            if (productFilter) {
                issuePicksConst.push({
                    label: productLabel,
                    ariaLabel: productLabel,
                    highlights: { label: productFilter },
                    accept: () => this.commandService.executeCommand('workbench.action.openIssueReporter', { issueSource: issue_1.IssueSource.VSCode })
                });
            }
            // Add marketplace pick if marketplace filter matches
            if (marketPlaceFilter) {
                issuePicksConst.push({
                    label: marketPlaceLabel,
                    ariaLabel: marketPlaceLabel,
                    highlights: { label: marketPlaceFilter },
                    accept: () => this.commandService.executeCommand('workbench.action.openIssueReporter', { issueSource: issue_1.IssueSource.Marketplace })
                });
            }
            issuePicksConst.push({ type: 'separator', label: (0, nls_1.localize)('extensions', "Extensions") });
            // creates menu from contributed
            const menu = this.menuService.createMenu(actions_1.MenuId.IssueReporter, this.contextKeyService);
            // render menu and dispose
            const actions = menu.getActions({ renderShortTitle: true }).flatMap(entry => entry[1]);
            menu.dispose();
            // create picks from contributed menu
            actions.forEach(action => {
                if ('source' in action.item && action.item.source) {
                    extensionIdSet.add(action.item.source.id);
                }
                const pick = this._createPick(filter, action);
                if (pick) {
                    issuePicksParts.push(pick);
                }
            });
            // create picks from extensions
            this.extensionService.extensions.forEach(extension => {
                if (!extension.isBuiltin) {
                    const pick = this._createPick(filter, undefined, extension);
                    const id = extension.identifier.value;
                    if (pick && !extensionIdSet.has(id)) {
                        issuePicksParts.push(pick);
                    }
                    extensionIdSet.add(id);
                }
            });
            issuePicksParts.sort((a, b) => {
                const aLabel = a.label ?? '';
                const bLabel = b.label ?? '';
                return aLabel.localeCompare(bLabel);
            });
            return [...issuePicksConst, ...issuePicksParts];
        }
        _createPick(filter, action, extension) {
            const buttons = [{
                    iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info),
                    tooltip: (0, nls_1.localize)('contributedIssuePage', "Open Extension Page")
                }];
            let label;
            let trigger;
            let accept;
            if (action && 'source' in action.item && action.item.source) {
                label = action.item.source?.title;
                trigger = () => {
                    if ('source' in action.item && action.item.source) {
                        this.commandService.executeCommand('extension.open', action.item.source.id);
                    }
                    return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                };
                accept = () => {
                    action.run();
                };
            }
            else if (extension) {
                label = extension.displayName ?? extension.name;
                trigger = () => {
                    this.commandService.executeCommand('extension.open', extension.identifier.value);
                    return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                };
                accept = () => {
                    this.commandService.executeCommand('workbench.action.openIssueReporter', extension.identifier.value);
                };
            }
            else {
                return undefined;
            }
            const highlights = (0, filters_1.matchesFuzzy)(filter, label, true);
            if (highlights) {
                return {
                    label,
                    highlights: { label: highlights },
                    buttons,
                    trigger,
                    accept
                };
            }
            return undefined;
        }
    };
    exports.IssueQuickAccess = IssueQuickAccess;
    exports.IssueQuickAccess = IssueQuickAccess = IssueQuickAccess_1 = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, commands_1.ICommandService),
        __param(3, extensions_1.IExtensionService),
        __param(4, productService_1.IProductService)
    ], IssueQuickAccess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lzc3VlL2Jyb3dzZXIvaXNzdWVRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLDZDQUFpRDs7aUJBRS9FLFdBQU0sR0FBRyxRQUFRLEFBQVgsQ0FBWTtRQUV6QixZQUNnQyxXQUF5QixFQUNuQixpQkFBcUMsRUFDeEMsY0FBK0IsRUFDN0IsZ0JBQW1DLEVBQ3JDLGNBQStCO1lBRWpFLEtBQUssQ0FBQyxrQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBTmpDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ25CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDeEMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzdCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDckMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBR2xFLENBQUM7UUFFa0IsU0FBUyxDQUFDLE1BQWM7WUFDMUMsTUFBTSxlQUFlLEdBQUcsSUFBSSxLQUFLLEVBQWdELENBQUM7WUFDbEYsTUFBTSxlQUFlLEdBQUcsSUFBSSxLQUFLLEVBQWdELENBQUM7WUFDbEYsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUV6QyxvQkFBb0I7WUFDcEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUM7WUFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lB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