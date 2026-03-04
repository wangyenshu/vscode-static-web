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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/filters", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/nls", "vs/base/browser/ui/iconLabel/iconLabel", "vs/platform/configuration/common/configuration", "vs/platform/markers/common/markers", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/editor/common/services/textResourceConfiguration", "vs/base/common/themables", "vs/base/browser/window", "vs/css!./documentSymbolsTree", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, dom, highlightedLabel_1, filters_1, range_1, languages_1, outlineModel_1, nls_1, iconLabel_1, configuration_1, markers_1, themeService_1, colorRegistry_1, textResourceConfiguration_1, themables_1, window_1) {
    "use strict";
    var DocumentSymbolFilter_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentSymbolComparator = exports.DocumentSymbolFilter = exports.DocumentSymbolRenderer = exports.DocumentSymbolGroupRenderer = exports.DocumentSymbolVirtualDelegate = exports.DocumentSymbolIdentityProvider = exports.DocumentSymbolAccessibilityProvider = exports.DocumentSymbolNavigationLabelProvider = void 0;
    class DocumentSymbolNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.label;
            }
            else {
                return element.symbol.name;
            }
        }
    }
    exports.DocumentSymbolNavigationLabelProvider = DocumentSymbolNavigationLabelProvider;
    class DocumentSymbolAccessibilityProvider {
        constructor(_ariaLabel) {
            this._ariaLabel = _ariaLabel;
        }
        getWidgetAriaLabel() {
            return this._ariaLabel;
        }
        getAriaLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.label;
            }
            else {
                return (0, languages_1.getAriaLabelForSymbol)(element.symbol.name, element.symbol.kind);
            }
        }
    }
    exports.DocumentSymbolAccessibilityProvider = DocumentSymbolAccessibilityProvider;
    class DocumentSymbolIdentityProvider {
        getId(element) {
            return element.id;
        }
    }
    exports.DocumentSymbolIdentityProvider = DocumentSymbolIdentityProvider;
    class DocumentSymbolGroupTemplate {
        static { this.id = 'DocumentSymbolGroupTemplate'; }
        constructor(labelContainer, label) {
            this.labelContainer = labelContainer;
            this.label = label;
        }
        dispose() {
            this.label.dispose();
        }
    }
    class DocumentSymbolTemplate {
        static { this.id = 'DocumentSymbolTemplate'; }
        constructor(container, iconLabel, iconClass, decoration) {
            this.container = container;
            this.iconLabel = iconLabel;
            this.iconClass = iconClass;
            this.decoration = decoration;
        }
    }
    class DocumentSymbolVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            return element instanceof outlineModel_1.OutlineGroup
                ? DocumentSymbolGroupTemplate.id
                : DocumentSymbolTemplate.id;
        }
    }
    exports.DocumentSymbolVirtualDelegate = DocumentSymbolVirtualDelegate;
    class DocumentSymbolGroupRenderer {
        constructor() {
            this.templateId = DocumentSymbolGroupTemplate.id;
        }
        renderTemplate(container) {
            const labelContainer = dom.$('.outline-element-label');
            container.classList.add('outline-element');
            dom.append(container, labelContainer);
            return new DocumentSymbolGroupTemplate(labelContainer, new highlightedLabel_1.HighlightedLabel(labelContainer));
        }
        renderElement(node, _index, template) {
            template.label.set(node.element.label, (0, filters_1.createMatches)(node.filterData));
        }
        disposeTemplate(_template) {
            _template.dispose();
        }
    }
    exports.DocumentSymbolGroupRenderer = DocumentSymbolGroupRenderer;
    let DocumentSymbolRenderer = class DocumentSymbolRenderer {
        constructor(_renderMarker, target, _configurationService, _themeService) {
            this._renderMarker = _renderMarker;
            this._configurationService = _configurationService;
            this._themeService = _themeService;
            this.templateId = DocumentSymbolTemplate.id;
        }
        renderTemplate(container) {
            container.classList.add('outline-element');
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            const iconClass = dom.$('.outline-element-icon');
            const decoration = dom.$('.outline-element-decoration');
            container.prepend(iconClass);
            container.appendChild(decoration);
            return new DocumentSymbolTemplate(container, iconLabel, iconClass, decoration);
        }
        renderElement(node, _index, template) {
            const { element } = node;
            const extraClasses = ['nowrap'];
            const options = {
                matches: (0, filters_1.createMatches)(node.filterData),
                labelEscapeNewLines: true,
                extraClasses,
                title: (0, nls_1.localize)('title.template', "{0} ({1})", element.symbol.name, languages_1.symbolKindNames[element.symbol.kind])
            };
            if (this._configurationService.getValue("outline.icons" /* OutlineConfigKeys.icons */)) {
                // add styles for the icons
                template.iconClass.className = '';
                template.iconClass.classList.add('outline-element-icon', 'inline', ...themables_1.ThemeIcon.asClassNameArray(languages_1.SymbolKinds.toIcon(element.symbol.kind)));
            }
            if (element.symbol.tags.indexOf(1 /* SymbolTag.Deprecated */) >= 0) {
                extraClasses.push(`deprecated`);
                options.matches = [];
            }
            template.iconLabel.setLabel(element.symbol.name, element.symbol.detail, options);
            if (this._renderMarker) {
                this._renderMarkerInfo(element, template);
            }
        }
        _renderMarkerInfo(element, template) {
            if (!element.marker) {
                dom.hide(template.decoration);
                template.container.style.removeProperty('--outline-element-color');
                return;
            }
            const { count, topSev } = element.marker;
            const color = this._themeService.getColorTheme().getColor(topSev === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground);
            const cssColor = color ? color.toString() : 'inherit';
            // color of the label
            const problem = this._configurationService.getValue('problems.visibility');
            const configProblems = this._configurationService.getValue("outline.problems.colors" /* OutlineConfigKeys.problemsColors */);
            if (!problem || !configProblems) {
                template.container.style.removeProperty('--outline-element-color');
            }
            else {
                template.container.style.setProperty('--outline-element-color', cssColor);
            }
            // badge with color/rollup
            if (problem === undefined) {
                return;
            }
            const configBadges = this._configurationService.getValue("outline.problems.badges" /* OutlineConfigKeys.problemsBadges */);
            if (!configBadges || !problem) {
                dom.hide(template.decoration);
            }
            else if (count > 0) {
                dom.show(template.decoration);
                template.decoration.classList.remove('bubble');
                template.decoration.innerText = count < 10 ? count.toString() : '+9';
                template.decoration.title = count === 1 ? (0, nls_1.localize)('1.problem', "1 problem in this element") : (0, nls_1.localize)('N.problem', "{0} problems in this element", count);
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
            else {
                dom.show(template.decoration);
                template.decoration.classList.add('bubble');
                template.decoration.innerText = '\uea71';
                template.decoration.title = (0, nls_1.localize)('deep.problem', "Contains elements with problems");
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
        }
        disposeTemplate(_template) {
            _template.iconLabel.dispose();
        }
    };
    exports.DocumentSymbolRenderer = DocumentSymbolRenderer;
    exports.DocumentSymbolRenderer = DocumentSymbolRenderer = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, themeService_1.IThemeService)
    ], DocumentSymbolRenderer);
    let DocumentSymbolFilter = class DocumentSymbolFilter {
        static { DocumentSymbolFilter_1 = this; }
        static { this.kindToConfigName = Object.freeze({
            [0 /* SymbolKind.File */]: 'showFiles',
            [1 /* SymbolKind.Module */]: 'showModules',
            [2 /* SymbolKind.Namespace */]: 'showNamespaces',
            [3 /* SymbolKind.Package */]: 'showPackages',
            [4 /* SymbolKind.Class */]: 'showClasses',
            [5 /* SymbolKind.Method */]: 'showMethods',
            [6 /* SymbolKind.Property */]: 'showProperties',
            [7 /* SymbolKind.Field */]: 'showFields',
            [8 /* SymbolKind.Constructor */]: 'showConstructors',
            [9 /* SymbolKind.Enum */]: 'showEnums',
            [10 /* SymbolKind.Interface */]: 'showInterfaces',
            [11 /* SymbolKind.Function */]: 'showFunctions',
            [12 /* SymbolKind.Variable */]: 'showVariables',
            [13 /* SymbolKind.Constant */]: 'showConstants',
            [14 /* SymbolKind.String */]: 'showStrings',
            [15 /* SymbolKind.Number */]: 'showNumbers',
            [16 /* SymbolKind.Boolean */]: 'showBooleans',
            [17 /* SymbolKind.Array */]: 'showArrays',
            [18 /* SymbolKind.Object */]: 'showObjects',
            [19 /* SymbolKind.Key */]: 'showKeys',
            [20 /* SymbolKind.Null */]: 'showNull',
            [21 /* SymbolKind.EnumMember */]: 'showEnumMembers',
            [22 /* SymbolKind.Struct */]: 'showStructs',
            [23 /* SymbolKind.Event */]: 'showEvents',
            [24 /* SymbolKind.Operator */]: 'showOperators',
            [25 /* SymbolKind.TypeParameter */]: 'showTypeParameters',
        }); }
        constructor(_prefix, _textResourceConfigService) {
            this._prefix = _prefix;
            this._textResourceConfigService = _textResourceConfigService;
        }
        filter(element) {
            const outline = outlineModel_1.OutlineModel.get(element);
            if (!(element instanceof outlineModel_1.OutlineElement)) {
                return true;
            }
            const configName = DocumentSymbolFilter_1.kindToConfigName[element.symbol.kind];
            const configKey = `${this._prefix}.${configName}`;
            return this._textResourceConfigService.getValue(outline?.uri, configKey);
        }
    };
    exports.DocumentSymbolFilter = DocumentSymbolFilter;
    exports.DocumentSymbolFilter = DocumentSymbolFilter = DocumentSymbolFilter_1 = __decorate([
        __param(1, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], DocumentSymbolFilter);
    class DocumentSymbolComparator {
        constructor() {
            this._collator = new dom.WindowIdleValue(window_1.mainWindow, () => new Intl.Collator(undefined, { numeric: true }));
        }
        compareByPosition(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range) || this._collator.value.compare(a.symbol.name, b.symbol.name);
            }
            return 0;
        }
        compareByType(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return a.symbol.kind - b.symbol.kind || this._collator.value.compare(a.symbol.name, b.symbol.name);
            }
            return 0;
        }
        compareByName(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return this._collator.value.compare(a.symbol.name, b.symbol.name) || range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range);
            }
            return 0;
        }
    }
    exports.DocumentSymbolComparator = DocumentSymbolComparator;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTeW1ib2xzVHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9vdXRsaW5lL2RvY3VtZW50U3ltYm9sc1RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBCaEcsTUFBYSxxQ0FBcUM7UUFFakQsMEJBQTBCLENBQUMsT0FBMkI7WUFDckQsSUFBSSxPQUFPLFlBQVksMkJBQVksRUFBRSxDQUFDO2dCQUNyQyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDdEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQVRELHNGQVNDO0lBRUQsTUFBYSxtQ0FBbUM7UUFFL0MsWUFBNkIsVUFBa0I7WUFBbEIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUFJLENBQUM7UUFFcEQsa0JBQWtCO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBQ0QsWUFBWSxDQUFDLE9BQTJCO1lBQ3ZDLElBQUksT0FBTyxZQUFZLDJCQUFZLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ3RCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUEsaUNBQXFCLEVBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4RSxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBZEQsa0ZBY0M7SUFFRCxNQUFhLDhCQUE4QjtRQUMxQyxLQUFLLENBQUMsT0FBMkI7WUFDaEMsT0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ25CLENBQUM7S0FDRDtJQUpELHdFQUlDO0lBRUQsTUFBTSwyQkFBMkI7aUJBQ2hCLE9BQUUsR0FBRyw2QkFBNkIsQ0FBQztRQUNuRCxZQUNVLGNBQTJCLEVBQzNCLEtBQXVCO1lBRHZCLG1CQUFjLEdBQWQsY0FBYyxDQUFhO1lBQzNCLFVBQUssR0FBTCxLQUFLLENBQWtCO1FBQzdCLENBQUM7UUFFTCxPQUFPO1lBQ04sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN0QixDQUFDOztJQUdGLE1BQU0sc0JBQXNCO2lCQUNYLE9BQUUsR0FBRyx3QkFBd0IsQ0FBQztRQUM5QyxZQUNVLFNBQXNCLEVBQ3RCLFNBQW9CLEVBQ3BCLFNBQXNCLEVBQ3RCLFVBQXVCO1lBSHZCLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFDdEIsY0FBUyxHQUFULFNBQVMsQ0FBVztZQUNwQixjQUFTLEdBQVQsU0FBUyxDQUFhO1lBQ3RCLGVBQVUsR0FBVixVQUFVLENBQWE7UUFDN0IsQ0FBQzs7SUFHTixNQUFhLDZCQUE2QjtRQUV6QyxTQUFTLENBQUMsUUFBNEI7WUFDckMsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQTJCO1lBQ3hDLE9BQU8sT0FBTyxZQUFZLDJCQUFZO2dCQUNyQyxDQUFDLENBQUMsMkJBQTJCLENBQUMsRUFBRTtnQkFDaEMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQztRQUM5QixDQUFDO0tBQ0Q7SUFYRCxzRUFXQztJQUVELE1BQWEsMkJBQTJCO1FBQXhDO1lBRVUsZUFBVSxHQUFXLDJCQUEyQixDQUFDLEVBQUUsQ0FBQztRQWdCOUQsQ0FBQztRQWRBLGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDdkQsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMzQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN0QyxPQUFPLElBQUksMkJBQTJCLENBQUMsY0FBYyxFQUFFLElBQUksbUNBQWdCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRUQsYUFBYSxDQUFDLElBQXlDLEVBQUUsTUFBYyxFQUFFLFFBQXFDO1lBQzdHLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsdUJBQWEsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRUQsZUFBZSxDQUFDLFNBQXNDO1lBQ3JELFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDO0tBQ0Q7SUFsQkQsa0VBa0JDO0lBRU0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBc0I7UUFJbEMsWUFDUyxhQUFzQixFQUM5QixNQUFxQixFQUNFLHFCQUE2RCxFQUNyRSxhQUE2QztZQUhwRCxrQkFBYSxHQUFiLGFBQWEsQ0FBUztZQUVVLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDcEQsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFOcEQsZUFBVSxHQUFXLHNCQUFzQixDQUFDLEVBQUUsQ0FBQztRQU9wRCxDQUFDO1FBRUwsY0FBYyxDQUFDLFNBQXNCO1lBQ3BDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDM0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxxQkFBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDeEUsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQztZQUN4RCxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdCLFNBQVMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEMsT0FBTyxJQUFJLHNCQUFzQixDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRCxhQUFhLENBQUMsSUFBMkMsRUFBRSxNQUFjLEVBQUUsUUFBZ0M7WUFDMUcsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztZQUN6QixNQUFNLFlBQVksR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sT0FBTyxHQUEyQjtnQkFDdkMsT0FBTyxFQUFFLElBQUEsdUJBQWEsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUN2QyxtQkFBbUIsRUFBRSxJQUFJO2dCQUN6QixZQUFZO2dCQUNaLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsMkJBQWUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3pHLENBQUM7WUFDRixJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLCtDQUF5QixFQUFFLENBQUM7Z0JBQ2xFLDJCQUEyQjtnQkFDM0IsUUFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO2dCQUNsQyxRQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsUUFBUSxFQUFFLEdBQUcscUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyx1QkFBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1SSxDQUFDO1lBQ0QsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLDhCQUFzQixJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUM1RCxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUN0QixDQUFDO1lBQ0QsUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFakYsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0MsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxPQUF1QixFQUFFLFFBQWdDO1lBRWxGLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JCLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM5QixRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUMsQ0FBQztnQkFDbkUsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDekMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLHdCQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUN6SSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRXRELHFCQUFxQjtZQUNyQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDM0UsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsa0VBQWtDLENBQUM7WUFFN0YsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNqQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUNwRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLHlCQUF5QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzNFLENBQUM7WUFFRCwwQkFBMEI7WUFDMUIsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzNCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsa0VBQWtDLENBQUM7WUFDM0YsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMvQixHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvQixDQUFDO2lCQUFNLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0QixHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDOUIsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMvQyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDckUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSw4QkFBOEIsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDNUosUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLHlCQUF5QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTVFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDOUIsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7Z0JBQ3pDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO2dCQUN4RixRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMseUJBQXlCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDNUUsQ0FBQztRQUNGLENBQUM7UUFFRCxlQUFlLENBQUMsU0FBaUM7WUFDaEQsU0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvQixDQUFDO0tBQ0QsQ0FBQTtJQS9GWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQU9oQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsNEJBQWEsQ0FBQTtPQVJILHNCQUFzQixDQStGbEM7SUFFTSxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjs7aUJBRWhCLHFCQUFnQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDaEQseUJBQWlCLEVBQUUsV0FBVztZQUM5QiwyQkFBbUIsRUFBRSxhQUFhO1lBQ2xDLDhCQUFzQixFQUFFLGdCQUFnQjtZQUN4Qyw0QkFBb0IsRUFBRSxjQUFjO1lBQ3BDLDBCQUFrQixFQUFFLGFBQWE7WUFDakMsMkJBQW1CLEVBQUUsYUFBYTtZQUNsQyw2QkFBcUIsRUFBRSxnQkFBZ0I7WUFDdkMsMEJBQWtCLEVBQUUsWUFBWTtZQUNoQyxnQ0FBd0IsRUFBRSxrQkFBa0I7WUFDNUMseUJBQWlCLEVBQUUsV0FBVztZQUM5QiwrQkFBc0IsRUFBRSxnQkFBZ0I7WUFDeEMsOEJBQXFCLEVBQUUsZUFBZTtZQUN0Qyw4QkFBcUIsRUFBRSxlQUFlO1lBQ3RDLDhCQUFxQixFQUFFLGVBQWU7WUFDdEMsNEJBQW1CLEVBQUUsYUFBYTtZQUNsQyw0QkFBbUIsRUFBRSxhQUFhO1lBQ2xDLDZCQUFvQixFQUFFLGNBQWM7WUFDcEMsMkJBQWtCLEVBQUUsWUFBWTtZQUNoQyw0QkFBbUIsRUFBRSxhQUFhO1lBQ2xDLHlCQUFnQixFQUFFLFVBQVU7WUFDNUIsMEJBQWlCLEVBQUUsVUFBVTtZQUM3QixnQ0FBdUIsRUFBRSxpQkFBaUI7WUFDMUMsNEJBQW1CLEVBQUUsYUFBYTtZQUNsQywyQkFBa0IsRUFBRSxZQUFZO1lBQ2hDLDhCQUFxQixFQUFFLGVBQWU7WUFDdEMsbUNBQTBCLEVBQUUsb0JBQW9CO1NBQ2hELENBQUMsQUEzQjhCLENBMkI3QjtRQUVILFlBQ2tCLE9BQWtDLEVBQ0MsMEJBQTZEO1lBRGhHLFlBQU8sR0FBUCxPQUFPLENBQTJCO1lBQ0MsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFtQztRQUM5RyxDQUFDO1FBRUwsTUFBTSxDQUFDLE9BQTJCO1lBQ2pDLE1BQU0sT0FBTyxHQUFHLDJCQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxDQUFDLE9BQU8sWUFBWSw2QkFBYyxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsTUFBTSxVQUFVLEdBQUcsc0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RSxNQUFNLFNBQVMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksVUFBVSxFQUFFLENBQUM7WUFDbEQsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDMUUsQ0FBQzs7SUE1Q1csb0RBQW9CO21DQUFwQixvQkFBb0I7UUFpQzlCLFdBQUEsNkRBQWlDLENBQUE7T0FqQ3ZCLG9CQUFvQixDQTZDaEM7SUFFRCxNQUFhLHdCQUF3QjtRQUFyQztZQUVrQixjQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFnQixtQkFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBMEJ4SSxDQUFDO1FBeEJBLGlCQUFpQixDQUFDLENBQXFCLEVBQUUsQ0FBcUI7WUFDN0QsSUFBSSxDQUFDLFlBQVksMkJBQVksSUFBSSxDQUFDLFlBQVksMkJBQVksRUFBRSxDQUFDO2dCQUM1RCxPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUMxQixDQUFDO2lCQUFNLElBQUksQ0FBQyxZQUFZLDZCQUFjLElBQUksQ0FBQyxZQUFZLDZCQUFjLEVBQUUsQ0FBQztnQkFDdkUsT0FBTyxhQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNySSxDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBQ0QsYUFBYSxDQUFDLENBQXFCLEVBQUUsQ0FBcUI7WUFDekQsSUFBSSxDQUFDLFlBQVksMkJBQVksSUFBSSxDQUFDLFlBQVksMkJBQVksRUFBRSxDQUFDO2dCQUM1RCxPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUMxQixDQUFDO2lCQUFNLElBQUksQ0FBQyxZQUFZLDZCQUFjLElBQUksQ0FBQyxZQUFZLDZCQUFjLEVBQUUsQ0FBQztnQkFDdkUsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRyxDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBQ0QsYUFBYSxDQUFDLENBQXFCLEVBQUUsQ0FBcUI7WUFDekQsSUFBSSxDQUFDLFlBQVksMkJBQVksSUFBSSxDQUFDLFlBQVksMkJBQVksRUFBRSxDQUFDO2dCQUM1RCxPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUMxQixDQUFDO2lCQUFNLElBQUksQ0FBQyxZQUFZLDZCQUFjLElBQUksQ0FBQyxZQUFZLDZCQUFjLEVBQUUsQ0FBQztnQkFDdkUsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxhQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNySSxDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO0tBQ0Q7SUE1QkQsNERBNEJDIn0=