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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/tree/abstractTree", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/preferences/browser/settingsTree", "vs/workbench/contrib/preferences/browser/settingsTreeModels", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/workbench/services/environment/common/environmentService"], function (require, exports, DOM, hoverDelegateFactory_1, listWidget_1, abstractTree_1, iterator_1, lifecycle_1, nls_1, configuration_1, contextkey_1, hover_1, instantiation_1, listService_1, defaultStyles_1, colorRegistry_1, settingsTree_1, settingsTreeModels_1, settingsEditorColorRegistry_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TOCTree = exports.TOCRenderer = exports.TOCTreeModel = void 0;
    exports.createTOCIterator = createTOCIterator;
    const $ = DOM.$;
    let TOCTreeModel = class TOCTreeModel {
        constructor(_viewState, environmentService) {
            this._viewState = _viewState;
            this.environmentService = environmentService;
            this._currentSearchModel = null;
        }
        get settingsTreeRoot() {
            return this._settingsTreeRoot;
        }
        set settingsTreeRoot(value) {
            this._settingsTreeRoot = value;
            this.update();
        }
        get currentSearchModel() {
            return this._currentSearchModel;
        }
        set currentSearchModel(model) {
            this._currentSearchModel = model;
            this.update();
        }
        get children() {
            return this._settingsTreeRoot.children;
        }
        update() {
            if (this._settingsTreeRoot) {
                this.updateGroupCount(this._settingsTreeRoot);
            }
        }
        updateGroupCount(group) {
            group.children.forEach(child => {
                if (child instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                    this.updateGroupCount(child);
                }
            });
            const childCount = group.children
                .filter(child => child instanceof settingsTreeModels_1.SettingsTreeGroupElement)
                .reduce((acc, cur) => acc + cur.count, 0);
            group.count = childCount + this.getGroupCount(group);
        }
        getGroupCount(group) {
            return group.children.filter(child => {
                if (!(child instanceof settingsTreeModels_1.SettingsTreeSettingElement)) {
                    return false;
                }
                if (this._currentSearchModel && !this._currentSearchModel.root.containsSetting(child.setting.key)) {
                    return false;
                }
                // Check everything that the SettingsFilter checks except whether it's filtered by a category
                const isRemote = !!this.environmentService.remoteAuthority;
                return child.matchesScope(this._viewState.settingsTarget, isRemote) &&
                    child.matchesAllTags(this._viewState.tagFilters) &&
                    child.matchesAnyFeature(this._viewState.featureFilters) &&
                    child.matchesAnyExtension(this._viewState.extensionFilters) &&
                    child.matchesAnyId(this._viewState.idFilters);
            }).length;
        }
    };
    exports.TOCTreeModel = TOCTreeModel;
    exports.TOCTreeModel = TOCTreeModel = __decorate([
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], TOCTreeModel);
    const TOC_ENTRY_TEMPLATE_ID = 'settings.toc.entry';
    class TOCRenderer {
        constructor(_hoverService) {
            this._hoverService = _hoverService;
            this.templateId = TOC_ENTRY_TEMPLATE_ID;
        }
        renderTemplate(container) {
            return {
                labelElement: DOM.append(container, $('.settings-toc-entry')),
                countElement: DOM.append(container, $('.settings-toc-count')),
                elementDisposables: new lifecycle_1.DisposableStore()
            };
        }
        renderElement(node, index, template) {
            template.elementDisposables.clear();
            const element = node.element;
            const count = element.count;
            const label = element.label;
            template.labelElement.textContent = label;
            template.elementDisposables.add(this._hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), template.labelElement, label));
            if (count) {
                template.countElement.textContent = ` (${count})`;
            }
            else {
                template.countElement.textContent = '';
            }
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
        }
    }
    exports.TOCRenderer = TOCRenderer;
    class TOCTreeDelegate {
        getTemplateId(element) {
            return TOC_ENTRY_TEMPLATE_ID;
        }
        getHeight(element) {
            return 22;
        }
    }
    function createTOCIterator(model, tree) {
        const groupChildren = model.children.filter(c => c instanceof settingsTreeModels_1.SettingsTreeGroupElement);
        return iterator_1.Iterable.map(groupChildren, g => {
            const hasGroupChildren = g.children.some(c => c instanceof settingsTreeModels_1.SettingsTreeGroupElement);
            return {
                element: g,
                collapsed: undefined,
                collapsible: hasGroupChildren,
                children: g instanceof settingsTreeModels_1.SettingsTreeGroupElement ?
                    createTOCIterator(g, tree) :
                    undefined
            };
        });
    }
    class SettingsAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)({
                key: 'settingsTOC',
                comment: ['A label for the table of contents for the full settings list']
            }, "Settings Table of Contents");
        }
        getAriaLabel(element) {
            if (!element) {
                return '';
            }
            if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                return (0, nls_1.localize)('groupRowAriaLabel', "{0}, group", element.label);
            }
            return '';
        }
        getAriaLevel(element) {
            let i = 1;
            while (element instanceof settingsTreeModels_1.SettingsTreeGroupElement && element.parent) {
                i++;
                element = element.parent;
            }
            return i;
        }
    }
    let TOCTree = class TOCTree extends listService_1.WorkbenchObjectTree {
        constructor(container, viewState, contextKeyService, listService, configurationService, hoverService, instantiationService) {
            // test open mode
            const filter = instantiationService.createInstance(settingsTree_1.SettingsTreeFilter, viewState);
            const options = {
                filter,
                multipleSelectionSupport: false,
                identityProvider: {
                    getId(e) {
                        return e.id;
                    }
                },
                styleController: id => new listWidget_1.DefaultStyleController(DOM.createStyleSheet(container), id),
                accessibilityProvider: instantiationService.createInstance(SettingsAccessibilityProvider),
                collapseByDefault: true,
                horizontalScrolling: false,
                hideTwistiesOfChildlessElements: true,
                renderIndentGuides: abstractTree_1.RenderIndentGuides.None
            };
            super('SettingsTOC', container, new TOCTreeDelegate(), [new TOCRenderer(hoverService)], options, instantiationService, contextKeyService, listService, configurationService);
            this.style((0, defaultStyles_1.getListStyles)({
                listBackground: colorRegistry_1.editorBackground,
                listFocusOutline: colorRegistry_1.focusBorder,
                listActiveSelectionBackground: colorRegistry_1.editorBackground,
                listActiveSelectionForeground: settingsEditorColorRegistry_1.settingsHeaderForeground,
                listFocusAndSelectionBackground: colorRegistry_1.editorBackground,
                listFocusAndSelectionForeground: settingsEditorColorRegistry_1.settingsHeaderForeground,
                listFocusBackground: colorRegistry_1.editorBackground,
                listFocusForeground: settingsEditorColorRegistry_1.settingsHeaderHoverForeground,
                listHoverForeground: settingsEditorColorRegistry_1.settingsHeaderHoverForeground,
                listHoverBackground: colorRegistry_1.editorBackground,
                listInactiveSelectionBackground: colorRegistry_1.editorBackground,
                listInactiveSelectionForeground: settingsEditorColorRegistry_1.settingsHeaderForeground,
                listInactiveFocusBackground: colorRegistry_1.editorBackground,
                listInactiveFocusOutline: colorRegistry_1.editorBackground,
                treeIndentGuidesStroke: undefined,
                treeInactiveIndentGuidesStroke: undefined
            }));
        }
    };
    exports.TOCTree = TOCTree;
    exports.TOCTree = TOCTree = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, listService_1.IListService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, hover_1.IHoverService),
        __param(6, instantiation_1.IInstantiationService)
    ], TOCTree);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9jVHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIvdG9jVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwSmhHLDhDQWVDO0lBbEpELE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFVCxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFZO1FBS3hCLFlBQ1MsVUFBb0MsRUFDZCxrQkFBd0Q7WUFEOUUsZUFBVSxHQUFWLFVBQVUsQ0FBMEI7WUFDTix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBTC9FLHdCQUFtQixHQUE2QixJQUFJLENBQUM7UUFPN0QsQ0FBQztRQUVELElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJLGdCQUFnQixDQUFDLEtBQStCO1lBQ25ELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFDL0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQUksa0JBQWtCO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ2pDLENBQUM7UUFFRCxJQUFJLGtCQUFrQixDQUFDLEtBQStCO1lBQ3JELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxLQUFLLENBQUM7WUFDakMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztRQUN4QyxDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzVCLElBQUks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