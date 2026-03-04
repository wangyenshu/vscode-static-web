/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/typeHierarchy/common/typeHierarchy", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/languages", "vs/base/common/strings", "vs/editor/common/core/range", "vs/nls", "vs/base/common/themables"], function (require, exports, typeHierarchy_1, cancellation_1, filters_1, iconLabel_1, languages_1, strings_1, range_1, nls_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProvider = exports.VirtualDelegate = exports.TypeRenderer = exports.IdentityProvider = exports.Sorter = exports.DataSource = exports.Type = void 0;
    class Type {
        constructor(item, model, parent) {
            this.item = item;
            this.model = model;
            this.parent = parent;
        }
        static compare(a, b) {
            let res = (0, strings_1.compare)(a.item.uri.toString(), b.item.uri.toString());
            if (res === 0) {
                res = range_1.Range.compareRangesUsingStarts(a.item.range, b.item.range);
            }
            return res;
        }
    }
    exports.Type = Type;
    class DataSource {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        hasChildren() {
            return true;
        }
        async getChildren(element) {
            if (element instanceof typeHierarchy_1.TypeHierarchyModel) {
                return element.roots.map(root => new Type(root, element, undefined));
            }
            const { model, item } = element;
            if (this.getDirection() === "supertypes" /* TypeHierarchyDirection.Supertypes */) {
                return (await model.provideSupertypes(item, cancellation_1.CancellationToken.None)).map(item => {
                    return new Type(item, model, element);
                });
            }
            else {
                return (await model.provideSubtypes(item, cancellation_1.CancellationToken.None)).map(item => {
                    return new Type(item, model, element);
                });
            }
        }
    }
    exports.DataSource = DataSource;
    class Sorter {
        compare(element, otherElement) {
            return Type.compare(element, otherElement);
        }
    }
    exports.Sorter = Sorter;
    class IdentityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getId(element) {
            let res = this.getDirection() + JSON.stringify(element.item.uri) + JSON.stringify(element.item.range);
            if (element.parent) {
                res += this.getId(element.parent);
            }
            return res;
        }
    }
    exports.IdentityProvider = IdentityProvider;
    class TypeRenderingTemplate {
        constructor(icon, label) {
            this.icon = icon;
            this.label = label;
        }
    }
    class TypeRenderer {
        constructor() {
            this.templateId = TypeRenderer.id;
        }
        static { this.id = 'TypeRenderer'; }
        renderTemplate(container) {
            container.classList.add('typehierarchy-element');
            const icon = document.createElement('div');
            container.appendChild(icon);
            const label = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            return new TypeRenderingTemplate(icon, label);
        }
        renderElement(node, _index, template) {
            const { element, filterData } = node;
            const deprecated = element.item.tags?.includes(1 /* SymbolTag.Deprecated */);
            template.icon.classList.add('inline', ...themables_1.ThemeIcon.asClassNameArray(languages_1.SymbolKinds.toIcon(element.item.kind)));
            template.label.setLabel(element.item.name, element.item.detail, { labelEscapeNewLines: true, matches: (0, filters_1.createMatches)(filterData), strikethrough: deprecated });
        }
        disposeTemplate(template) {
            template.label.dispose();
        }
    }
    exports.TypeRenderer = TypeRenderer;
    class VirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return TypeRenderer.id;
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
    class AccessibilityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('tree.aria', "Type Hierarchy");
        }
        getAriaLabel(element) {
            if (this.getDirection() === "supertypes" /* TypeHierarchyDirection.Supertypes */) {
                return (0, nls_1.localize)('supertypes', "supertypes of {0}", element.item.name);
            }
            else {
                return (0, nls_1.localize)('subtypes', "subtypes of {0}", element.item.name);
            }
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZUhpZXJhcmNoeVRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90eXBlSGllcmFyY2h5L2Jyb3dzZXIvdHlwZUhpZXJhcmNoeVRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsSUFBSTtRQUNoQixZQUNVLElBQXVCLEVBQ3ZCLEtBQXlCLEVBQ3pCLE1BQXdCO1lBRnhCLFNBQUksR0FBSixJQUFJLENBQW1CO1lBQ3ZCLFVBQUssR0FBTCxLQUFLLENBQW9CO1lBQ3pCLFdBQU0sR0FBTixNQUFNLENBQWtCO1FBQzlCLENBQUM7UUFFTCxNQUFNLENBQUMsT0FBTyxDQUFDLENBQU8sRUFBRSxDQUFPO1lBQzlCLElBQUksR0FBRyxHQUFHLElBQUEsaUJBQU8sRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNmLEdBQUcsR0FBRyxhQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO0tBQ0Q7SUFkRCxvQkFjQztJQUVELE1BQWEsVUFBVTtRQUV0QixZQUNRLFlBQTBDO1lBQTFDLGlCQUFZLEdBQVosWUFBWSxDQUE4QjtRQUM5QyxDQUFDO1FBRUwsV0FBVztZQUNWLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBa0M7WUFD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