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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/contrib/scm/common/scm", "vs/base/browser/ui/countBadge/countBadge", "vs/platform/contextview/browser/contextView", "vs/platform/commands/common/commands", "vs/base/common/actions", "./util", "vs/platform/theme/browser/defaultStyles", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry", "vs/css!./media/scm"], function (require, exports, lifecycle_1, dom_1, scm_1, countBadge_1, contextView_1, commands_1, actions_1, util_1, defaultStyles_1, toolbar_1, actions_2, contextkey_1, keybinding_1, telemetry_1) {
    "use strict";
    var RepositoryRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RepositoryRenderer = exports.RepositoryActionRunner = void 0;
    class RepositoryActionRunner extends actions_1.ActionRunner {
        constructor(getSelectedRepositories) {
            super();
            this.getSelectedRepositories = getSelectedRepositories;
        }
        async runAction(action, context) {
            if (!(action instanceof actions_2.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const selection = this.getSelectedRepositories().map(r => r.provider);
            const actionContext = selection.some(s => s === context) ? selection : [context];
            await action.run(...actionContext);
        }
    }
    exports.RepositoryActionRunner = RepositoryActionRunner;
    let RepositoryRenderer = class RepositoryRenderer {
        static { RepositoryRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'repository'; }
        get templateId() { return RepositoryRenderer_1.TEMPLATE_ID; }
        constructor(toolbarMenuId, actionViewItemProvider, scmViewService, commandService, contextKeyService, contextMenuService, keybindingService, menuService, telemetryService) {
            this.toolbarMenuId = toolbarMenuId;
            this.actionViewItemProvider = actionViewItemProvider;
            this.scmViewService = scmViewService;
            this.commandService = commandService;
            this.contextKeyService = contextKeyService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.telemetryService = telemetryService;
        }
        renderTemplate(container) {
            // hack
            if (container.classList.contains('monaco-tl-contents')) {
                container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            }
            const provider = (0, dom_1.append)(container, (0, dom_1.$)('.scm-provider'));
            const label = (0, dom_1.append)(provider, (0, dom_1.$)('.label'));
            const name = (0, dom_1.append)(label, (0, dom_1.$)('span.name'));
            const description = (0, dom_1.append)(label, (0, dom_1.$)('span.description'));
            const actions = (0, dom_1.append)(provider, (0, dom_1.$)('.actions'));
            const toolBar = new toolbar_1.WorkbenchToolBar(actions, { actionViewItemProvider: this.actionViewItemProvider, resetMenu: this.toolbarMenuId }, this.menuService, this.contextKeyService, this.contextMenuService, this.keybindingService, this.commandService, this.telemetryService);
            const countContainer = (0, dom_1.append)(provider, (0, dom_1.$)('.count'));
            const count = new countBadge_1.CountBadge(countContainer, {}, defaultStyles_1.defaultCountBadgeStyles);
            const visibilityDisposable = toolBar.onDidChangeDropdownVisibility(e => provider.classList.toggle('active', e));
            const templateDisposable = (0, lifecycle_1.combinedDisposable)(visibilityDisposable, toolBar);
            return { label, name, description, countContainer, count, toolBar, elementDisposables: new lifecycle_1.DisposableStore(), templateDisposable };
        }
        renderElement(arg, index, templateData, height) {
            const repository = (0, util_1.isSCMRepository)(arg) ? arg : arg.element;
            templateData.name.textContent = repository.provider.name;
            if (repository.provider.rootUri) {
                templateData.label.title = `${repository.provider.label}: ${repository.provider.rootUri.fsPath}`;
                templateData.description.textContent = repository.provider.label;
            }
            else {
                templateData.label.title = repository.provider.label;
                templateData.description.textContent = '';
            }
            let statusPrimaryActions = [];
            let menuPrimaryActions = [];
            let menuSecondaryActions = [];
            const updateToolbar = () => {
                templateData.toolBar.setActions([...statusPrimaryActions, ...menuPrimaryActions], menuSecondaryActions);
            };
            const onDidChangeProvider = () => {
                const commands = repository.provider.statusBarCommands || [];
                statusPrimaryActions = commands.map(c => new util_1.StatusBarAction(c, this.commandService));
                updateToolbar();
                const count = repository.provider.count || 0;
                templateData.countContainer.setAttribute('data-count', String(count));
                templateData.count.setCount(count);
            };
            // TODO@joao TODO@lszomoru
            let disposed = false;
            templateData.elementDisposables.add((0, lifecycle_1.toDisposable)(() => disposed = true));
            templateData.elementDisposables.add(repository.provider.onDidChange(() => {
                if (disposed) {
                    return;
                }
                onDidChangeProvider();
            }));
            onDidChangeProvider();
            const repositoryMenus = this.scmViewService.menus.getRepositoryMenus(repository.provider);
            const menu = this.toolbarMenuId === actions_2.MenuId.SCMTitle ? repositoryMenus.titleMenu.menu : repositoryMenus.repositoryMenu;
            templateData.elementDisposables.add((0, util_1.connectPrimaryMenu)(menu, (primary, secondary) => {
                menuPrimaryActions = primary;
                menuSecondaryActions = secondary;
                updateToolbar();
            }));
            templateData.toolBar.context = repository.provider;
        }
        renderCompressedElements() {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
            templateData.templateDisposable.dispose();
        }
    };
    exports.RepositoryRenderer = RepositoryRenderer;
    exports.RepositoryRenderer = RepositoryRenderer = RepositoryRenderer_1 = __decorate([
        __param(2, scm_1.ISCMViewService),
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, actions_2.IMenuService),
        __param(8, telemetry_1.ITelemetryService)
    ], RepositoryRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtUmVwb3NpdG9yeVJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2NtL2Jyb3dzZXIvc2NtUmVwb3NpdG9yeVJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1QmhHLE1BQWEsc0JBQXVCLFNBQVEsc0JBQVk7UUFDdkQsWUFBNkIsdUJBQStDO1lBQzNFLEtBQUssRUFBRSxDQUFDO1lBRG9CLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBd0I7UUFFNUUsQ0FBQztRQUVrQixLQUFLLENBQUMsU0FBUyxDQUFDLE1BQWUsRUFBRSxPQUFxQjtZQUN4RSxJQUFJLENBQUMsQ0FBQyxNQUFNLFlBQVksd0JBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RSxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFakYsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUM7UUFDcEMsQ0FBQztLQUNEO0lBZkQsd0RBZUM7SUFhTSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjs7aUJBRWQsZ0JBQVcsR0FBRyxZQUFZLEFBQWYs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