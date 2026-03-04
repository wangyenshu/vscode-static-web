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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/theme/browser/defaultStyles", "../referencesModel"], function (require, exports, dom, countBadge_1, highlightedLabel_1, iconLabel_1, filters_1, lifecycle_1, resources_1, resolverService_1, nls_1, instantiation_1, keybinding_1, label_1, defaultStyles_1, referencesModel_1) {
    "use strict";
    var FileReferencesRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProvider = exports.OneReferenceRenderer = exports.FileReferencesRenderer = exports.IdentityProvider = exports.StringRepresentationProvider = exports.Delegate = exports.DataSource = void 0;
    let DataSource = class DataSource {
        constructor(_resolverService) {
            this._resolverService = _resolverService;
        }
        hasChildren(element) {
            if (element instanceof referencesModel_1.ReferencesModel) {
                return true;
            }
            if (element instanceof referencesModel_1.FileReferences) {
                return true;
            }
            return false;
        }
        getChildren(element) {
            if (element instanceof referencesModel_1.ReferencesModel) {
                return element.groups;
            }
            if (element instanceof referencesModel_1.FileReferences) {
                return element.resolve(this._resolverService).then(val => {
                    // if (element.failure) {
                    // 	// refresh the element on failure so that
                    // 	// we can update its rendering
                    // 	return tree.refresh(element).then(() => val.children);
                    // }
                    return val.children;
                });
            }
            throw new Error('bad tree');
        }
    };
    exports.DataSource = DataSource;
    exports.DataSource = DataSource = __decorate([
        __param(0, resolverService_1.ITextModelService)
    ], DataSource);
    //#endregion
    class Delegate {
        getHeight() {
            return 23;
        }
        getTemplateId(element) {
            if (element instanceof referencesModel_1.FileReferences) {
                return FileReferencesRenderer.id;
            }
            else {
                return OneReferenceRenderer.id;
            }
        }
    }
    exports.Delegate = Delegate;
    let StringRepresentationProvider = class StringRepresentationProvider {
        constructor(_keybindingService) {
            this._keybindingService = _keybindingService;
        }
        getKeyboardNavigationLabel(element) {
            if (element instanceof referencesModel_1.OneReference) {
                const parts = element.parent.getPreview(element)?.preview(element.range);
                if (parts) {
                    return parts.value;
                }
            }
            // FileReferences or unresolved OneReference
            return (0, resources_1.basename)(element.uri);
        }
        mightProducePrintableCharacter(event) {
            return this._keybindingService.mightProducePrintableCharacter(event);
        }
    };
    exports.StringRepresentationProvider = StringRepresentationProvider;
    exports.StringRepresentationProvider = StringRepresentationProvider = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], StringRepresentationProvider);
    class IdentityProvider {
        getId(element) {
            return element instanceof referencesModel_1.OneReference ? element.id : element.uri;
        }
    }
    exports.IdentityProvider = IdentityProvider;
    //#region render: File
    let FileReferencesTemplate = class FileReferencesTemplate extends lifecycle_1.Disposable {
        constructor(container, _labelService) {
            super();
            this._labelService = _labelService;
            const parent = document.createElement('div');
            parent.classList.add('reference-file');
            this.file = this._register(new iconLabel_1.IconLabel(parent, { supportHighlights: true }));
            this.badge = new countBadge_1.CountBadge(dom.append(parent, dom.$('.count')), {}, defaultStyles_1.defaultCountBadgeStyles);
            container.appendChild(parent);
        }
        set(element, matches) {
            const parent = (0, resources_1.dirname)(element.uri);
            this.file.setLabel(this._labelService.getUriBasenameLabel(element.uri), this._labelService.getUriLabel(parent, { relative: true }), { title: this._labelService.getUriLabel(element.uri), matches });
            const len = element.children.length;
            this.badge.setCount(len);
            if (len > 1) {
                this.badge.setTitleFormat((0, nls_1.localize)('referencesCount', "{0} references", len));
            }
            else {
                this.badge.setTitleFormat((0, nls_1.localize)('referenceCount', "{0} reference", len));
            }
        }
    };
    FileReferencesTemplate = __decorate([
        __param(1, label_1.ILabelService)
    ], FileReferencesTemplate);
    let FileReferencesRenderer = class FileReferencesRenderer {
        static { FileReferencesRenderer_1 = this; }
        static { this.id = 'FileReferencesRenderer'; }
        constructor(_instantiationService) {
            this._instantiationService = _instantiationService;
            this.templateId = FileReferencesRenderer_1.id;
        }
        renderTemplate(container) {
            return this._instantiationService.createInstance(FileReferencesTemplate, container);
        }
        renderElement(node, index, template) {
            template.set(node.element, (0, filters_1.createMatches)(node.filterData));
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    };
    exports.FileReferencesRenderer = FileReferencesRenderer;
    exports.FileReferencesRenderer = FileReferencesRenderer = FileReferencesRenderer_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], FileReferencesRenderer);
    //#endregion
    //#region render: Reference
    class OneReferenceTemplate extends lifecycle_1.Disposable {
        constructor(container) {
            super();
            this.label = this._register(new highlightedLabel_1.HighlightedLabel(container));
        }
        set(element, score) {
            const preview = element.parent.getPreview(element)?.preview(element.range);
            if (!preview || !preview.value) {
                // this means we FAILED to resolve the document or the value is the empty string
                this.label.set(`${(0, resources_1.basename)(element.uri)}:${element.range.startLineNumber + 1}:${element.range.startColumn + 1}`);
            }
            else {
                // render search match as highlight unless
                // we have score, then render the score
                const { value, highlight } = preview;
                if (score && !filters_1.FuzzyScore.isDefault(score)) {
                    this.label.element.classList.toggle('referenceMatch', false);
                    this.label.set(value, (0, filters_1.createMatches)(score));
                }
                else {
                    this.label.element.classList.toggle('referenceMatch', true);
                    this.label.set(value, [highlight]);
                }
            }
        }
    }
    class OneReferenceRenderer {
        constructor() {
            this.templateId = OneReferenceRenderer.id;
        }
        static { this.id = 'OneReferenceRenderer'; }
        renderTemplate(container) {
            return new OneReferenceTemplate(container);
        }
        renderElement(node, index, templateData) {
            templateData.set(node.element, node.filterData);
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    }
    exports.OneReferenceRenderer = OneReferenceRenderer;
    //#endregion
    class AccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('treeAriaLabel', "References");
        }
        getAriaLabel(element) {
            return element.ariaMessage;
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlc1RyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9nb3RvU3ltYm9sL2Jyb3dzZXIvcGVlay9yZWZlcmVuY2VzVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUJ6RixJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFVO1FBRXRCLFlBQWdELGdCQUFtQztZQUFuQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1FBQUksQ0FBQztRQUV4RixXQUFXLENBQUMsT0FBdUQ7WUFDbEUsSUFBSSxPQUFPLFlBQVksaUNBQWUsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLE9BQU8sWUFBWSxnQ0FBYyxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELFdBQVcsQ0FBQyxPQUF1RDtZQUNsRSxJQUFJLE9BQU8sWUFBWSxpQ0FBZSxFQUFFLENBQUM7Z0JBQ3hDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN2QixDQUFDO1lBRUQsSUFBSSxPQUFPLFlBQVksZ0NBQWMsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN4RCx5QkFBeUI7b0JBQ3pCLDZDQUE2QztvQkFDN0Msa0NBQWtDO29CQUNsQywwREFBMEQ7b0JBQzFELElBQUk7b0JBQ0osT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDO2dCQUNyQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxNQUFNLElBQUksS0FBSyxDQUFD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