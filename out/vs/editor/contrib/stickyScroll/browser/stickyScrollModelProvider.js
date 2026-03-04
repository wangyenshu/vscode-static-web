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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/base/common/async", "vs/editor/contrib/folding/browser/folding", "vs/editor/contrib/folding/browser/syntaxRangeProvider", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/common/languages/languageConfigurationRegistry", "vs/base/common/errors", "vs/editor/contrib/stickyScroll/browser/stickyScrollElement", "vs/base/common/iterator", "vs/platform/instantiation/common/instantiation"], function (require, exports, lifecycle_1, languageFeatures_1, outlineModel_1, async_1, folding_1, syntaxRangeProvider_1, indentRangeProvider_1, languageConfigurationRegistry_1, errors_1, stickyScrollElement_1, iterator_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StickyModelProvider = void 0;
    var ModelProvider;
    (function (ModelProvider) {
        ModelProvider["OUTLINE_MODEL"] = "outlineModel";
        ModelProvider["FOLDING_PROVIDER_MODEL"] = "foldingProviderModel";
        ModelProvider["INDENTATION_MODEL"] = "indentationModel";
    })(ModelProvider || (ModelProvider = {}));
    var Status;
    (function (Status) {
        Status[Status["VALID"] = 0] = "VALID";
        Status[Status["INVALID"] = 1] = "INVALID";
        Status[Status["CANCELED"] = 2] = "CANCELED";
    })(Status || (Status = {}));
    let StickyModelProvider = class StickyModelProvider extends lifecycle_1.Disposable {
        constructor(_editor, onProviderUpdate, _languageConfigurationService, _languageFeaturesService) {
            super();
            this._editor = _editor;
            this._modelProviders = [];
            this._modelPromise = null;
            this._updateScheduler = this._register(new async_1.Delayer(300));
            this._updateOperation = this._register(new lifecycle_1.DisposableStore());
            switch (this._editor.getOption(115 /* EditorOption.stickyScroll */).defaultModel) {
                case ModelProvider.OUTLINE_MODEL:
                    this._modelProviders.push(new StickyModelFromCandidateOutlineProvider(this._editor, _languageFeaturesService));
                // fall through
                case ModelProvider.FOLDING_PROVIDER_MODEL:
                    this._modelProviders.push(new StickyModelFromCandidateSyntaxFoldingProvider(this._editor, onProviderUpdate, _languageFeaturesService));
                // fall through
                case ModelProvider.INDENTATION_MODEL:
                    this._modelProviders.push(new StickyModelFromCandidateIndentationFoldingProvider(this._editor, _languageConfigurationService));
                    break;
            }
        }
        dispose() {
            this._modelProviders.forEach(provider => provider.dispose());
            this._updateOperation.clear();
            this._cancelModelPromise();
            super.dispose();
        }
        _cancelModelPromise() {
            if (this._modelPromise) {
                this._modelPromise.cancel();
                this._modelPromise = null;
            }
        }
        async update(token) {
            this._updateOperation.clear();
            this._updateOperation.add({
                dispose: () => {
                    this._cancelModelPromise();
                    this._updateScheduler.cancel();
                }
            });
            this._cancelModelPromise();
            return await this._updateScheduler.trigger(async () => {
                for (const modelProvider of this._modelProviders) {
                    const { statusPromise, modelPromise } = modelProvider.computeStickyModel(token);
                    this._modelPromise = modelPromise;
                    const status = await statusPromise;
                    if (this._modelPromise !== modelPromise) {
                        return null;
                    }
                    switch (status) {
                        case Status.CANCELED:
                            this._updateOperation.clear();
                            return null;
                        case Status.VALID:
                            return modelProvider.stickyModel;
                    }
                }
                return null;
            }).catch((error) => {
                (0, errors_1.onUnexpectedError)(error);
                return null;
            });
        }
    };
    exports.StickyModelProvider = StickyModelProvider;
    exports.StickyModelProvider = StickyModelProvider = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService)
    ], StickyModelProvider);
    class StickyModelCandidateProvider extends lifecycle_1.Disposable {
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._stickyModel = null;
        }
        get stickyModel() {
            return this._stickyModel;
        }
        _invalid() {
            this._stickyModel = null;
            return Status.INVALID;
        }
        computeStickyModel(token) {
            if (token.isCancellationRequested || !this.isProviderValid()) {
                return { statusPromise: this._invalid(), modelPromise: null };
            }
            const providerModelPromise = (0, async_1.createCancelablePromise)(token => this.createModelFromProvider(token));
            return {
                statusPromise: providerModelPromise.then(providerModel => {
                    if (!this.isModelValid(providerModel)) {
                        return this._invalid();
                    }
                    if (token.isCancellationRequested) {
                        return Status.CANCELED;
                    }
                    this._stickyModel = this.createStickyModel(token, providerModel);
                    return Status.VALID;
                }).then(undefined, (err) => {
                    (0, errors_1.onUnexpectedError)(err);
                    return Status.CANCELED;
                }),
                modelPromise: providerModelPromise
            };
        }
        /**
         * Method which checks whether the model returned by the provider is valid and can be used to compute a sticky model.
         * This method by default returns true.
         * @param model model returned by the provider
         * @returns boolean indicating whether the model is valid
         */
        isModelValid(model) {
            return true;
        }
        /**
         * Method which checks whether the provider is valid before applying it to find the provider model.
         * This method by default returns true.
         * @returns boolean indicating whether the provider is valid
         */
        isProviderValid() {
            return true;
        }
    }
    let StickyModelFromCandidateOutlineProvider = class StickyModelFromCandidateOutlineProvider extends StickyModelCandidateProvider {
        constructor(_editor, _languageFeaturesService) {
            super(_editor);
            this._languageFeaturesService = _languageFeaturesService;
        }
        createModelFromProvider(token) {
            return outlineModel_1.OutlineModel.create(this._languageFeaturesService.documentSymbolProvider, this._editor.getModel(), token);
        }
        createStickyModel(token, model) {
            const { stickyOutlineElement, providerID } = this._stickyModelFromOutlineModel(model, this._stickyModel?.outlineProviderId);
            const textModel = this._editor.getModel();
            return new stickyScrollElement_1.StickyModel(textModel.uri, textModel.getVersionId(), stickyOutlineElement, providerID);
        }
        isModelValid(model) {
            return model && model.children.size > 0;
        }
        _stickyModelFromOutlineModel(outlineModel, preferredProvider) {
            let outlineElements;
            // When several possible outline providers
            if (iterator_1.Iterable.first(outlineModel.children.values()) instanceof outlineModel_1.OutlineGroup) {
                const provider = iterator_1.Iterable.find(outlineModel.children.values(), outlineGroupOfModel => outlineGroupOfModel.id === preferredProvider);
                if (provider) {
                    outlineElements = provider.children;
                }
                else {
                    let tempID = '';
                    let maxTotalSumOfRanges = -1;
                    let optimalOutlineGroup = undefined;
                    for (const [_key, outlineGroup] of outlineModel.children.entries()) {
                        const totalSumRanges = this._findSumOfRangesOfGroup(outlineGroup);
                        if (totalSumRanges > maxTotalSumOfRanges) {
                            optimalOutlineGroup = outlineGroup;
                            maxTotalSumOfRanges = totalSumRanges;
                            tempID = outlineGroup.id;
                        }
                    }
                    preferredProvider = tempID;
                    outlineElements = optimalOutlineGroup.children;
                }
            }
            else {
                outlineElements = outlineModel.children;
            }
            const stickyChildren = [];
            const outlineElementsArray = Array.from(outlineElements.values()).sort((element1, element2) => {
                const range1 = new stickyScrollElement_1.StickyRange(element1.symbol.range.startLineNumber, element1.symbol.range.endLineNumber);
                const range2 = new stickyScrollElement_1.StickyRange(element2.symbol.range.startLineNumber, element2.symbol.range.endLineNumber);
                return this._comparator(range1, range2);
            });
            for (const outlineElement of outlineElementsArray) {
                stickyChildren.push(this._stickyModelFromOutlineElement(outlineElement, outlineElement.symbol.selectionRange.startLineNumber));
            }
            const stickyOutlineElement = new stickyScrollElement_1.StickyElement(undefined, stickyChildren, undefined);
            return {
                stickyOutlineElement: stickyOutlineElement,
                providerID: preferredProvider
            };
        }
        _stickyModelFromOutlineElement(outlineElement, previousStartLine) {
            const children = [];
            for (const child of outlineElement.children.values()) {
                if (child.symbol.selectionRange.startLineNumber !== child.symbol.range.endLineNumber) {
                    if (child.symbol.selectionRange.startLineNumber !== previousStartLine) {
                        children.push(this._stickyModelFromOutlineElement(child, child.symbol.selectionRange.startLineNumber));
                    }
                    else {
                        for (const subchild of child.children.values()) {
                            children.push(this._stickyModelFromOutlineElement(subchild, child.symbol.selectionRange.startLineNumber));
                        }
                    }
                }
            }
            children.sort((child1, child2) => this._comparator(child1.range, child2.range));
            const range = new stickyScrollElement_1.StickyRange(outlineElement.symbol.selectionRange.startLineNumber, outlineElement.symbol.range.endLineNumber);
            return new stickyScrollElement_1.StickyElement(range, children, undefined);
        }
        _comparator(range1, range2) {
            if (range1.startLineNumber !== range2.startLineNumber) {
                return range1.startLineNumber - range2.startLineNumber;
            }
            else {
                return range2.endLineNumber - range1.endLineNumber;
            }
        }
        _findSumOfRangesOfGroup(outline) {
            let res = 0;
            for (const child of outline.children.values()) {
                res += this._findSumOfRangesOfGroup(child);
            }
            if (outline instanceof outlineModel_1.OutlineElement) {
                return res + outline.symbol.range.endLineNumber - outline.symbol.selectionRange.startLineNumber;
            }
            else {
                return res;
            }
        }
    };
    StickyModelFromCandidateOutlineProvider = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], StickyModelFromCandidateOutlineProvider);
    class StickyModelFromCandidateFoldingProvider extends StickyModelCandidateProvider {
        constructor(editor) {
            super(editor);
            this._foldingLimitReporter = new folding_1.RangesLimitReporter(editor);
        }
        createStickyModel(token, model) {
            const foldingElement = this._fromFoldingRegions(model);
            const textModel = this._editor.getModel();
            return new stickyScrollElement_1.StickyModel(textModel.uri, textModel.getVersionId(), foldingElement, undefined);
        }
        isModelValid(model) {
            return model !== null;
        }
        _fromFoldingRegions(foldingRegions) {
            const length = foldingRegions.length;
            const orderedStickyElements = [];
            // The root sticky outline element
            const stickyOutlineElement = new stickyScrollElement_1.StickyElement(undefined, [], undefined);
            for (let i = 0; i < length; i++) {
                // Finding the parent index of the current range
                const parentIndex = foldingRegions.getParentIndex(i);
                let parentNode;
                if (parentIndex !== -1) {
                    // Access the reference of the parent node
                    parentNode = orderedStickyElements[parentIndex];
                }
                else {
                    // In that case the parent node is the root node
                    parentNode = stickyOutlineElement;
                }
                const child = new stickyScrollElement_1.StickyElement(new stickyScrollElement_1.StickyRange(foldingRegions.getStartLineNumber(i), foldingRegions.getEndLineNumber(i) + 1), [], parentNode);
                parentNode.children.push(child);
                orderedStickyElements.push(child);
            }
            return stickyOutlineElement;
        }
    }
    let StickyModelFromCandidateIndentationFoldingProvider = class StickyModelFromCandidateIndentationFoldingProvider extends StickyModelFromCandidateFoldingProvider {
        constructor(editor, _languageConfigurationService) {
            super(editor);
            this._languageConfigurationService = _languageConfigurationService;
            this.provider = this._register(new indentRangeProvider_1.IndentRangeProvider(editor.getModel(), this._languageConfigurationService, this._foldingLimitReporter));
        }
        async createModelFromProvider(token) {
            return this.provider.compute(token);
        }
    };
    StickyModelFromCandidateIndentationFoldingProvider = __decorate([
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], StickyModelFromCandidateIndentationFoldingProvider);
    let StickyModelFromCandidateSyntaxFoldingProvider = class StickyModelFromCandidateSyntaxFoldingProvider extends StickyModelFromCandidateFoldingProvider {
        constructor(editor, onProviderUpdate, _languageFeaturesService) {
            super(editor);
            this._languageFeaturesService = _languageFeaturesService;
            const selectedProviders = folding_1.FoldingController.getFoldingRangeProviders(this._languageFeaturesService, editor.getModel());
            if (selectedProviders.length > 0) {
                this.provider = this._register(new syntaxRangeProvider_1.SyntaxRangeProvider(editor.getModel(), selectedProviders, onProviderUpdate, this._foldingLimitReporter, undefined));
            }
        }
        isProviderValid() {
            return this.provider !== undefined;
        }
        async createModelFromProvider(token) {
            return this.provider?.compute(token) ?? null;
        }
    };
    StickyModelFromCandidateSyntaxFoldingProvider = __decorate([
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], StickyModelFromCandidateSyntaxFoldingProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsTW9kZWxQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N0aWNreVNjcm9sbC9icm93c2VyL3N0aWNreVNjcm9sbE1vZGVsUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRyxJQUFLLGFBSUo7SUFKRCxXQUFLLGFBQWE7UUFDakIsK0NBQThCLENBQUE7UUFDOUIsZ0VBQStDLENBQUE7UUFDL0MsdURBQXNDLENBQUE7SUFDdkMsQ0FBQyxFQUpJLGFBQWEsS0FBYixhQUFhLFFBSWpCO0lBRUQsSUFBSyxNQUlKO0lBSkQsV0FBSyxNQUFNO1FBQ1YscUNBQUssQ0FBQTtRQUNMLHlDQUFPLENBQUE7UUFDUCwyQ0FBUSxDQUFBO0lBQ1QsQ0FBQyxFQUpJLE1BQU0sS0FBTixNQUFNLFFBSVY7SUFZTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBT2xELFlBQ2tCLE9BQTBCLEVBQzNDLGdCQUE0QixFQUNMLDZCQUE0RCxFQUN6RCx3QkFBa0Q7WUFFNUUsS0FBSyxFQUFFLENBQUM7WUFMUyxZQUFPLEdBQVAsT0FBTyxDQUFtQjtZQU5wQyxvQkFBZSxHQUF5QyxFQUFFLENBQUM7WUFDM0Qsa0JBQWEsR0FBeUMsSUFBSSxDQUFDO1lBQzNELHFCQUFnQixHQUFnQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxDQUFxQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzVGLHFCQUFnQixHQUFvQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFVMUYsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMscUNBQTJCLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hFLEtBQUssYUFBYSxDQUFDLGFBQWE7b0JBQy9CLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksdUNBQXVDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hILGVBQWU7Z0JBQ2YsS0FBSyxhQUFhLENBQUMsc0JBQXNCO29CQUN4QyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLDZDQUE2QyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO2dCQUN4SSxlQUFlO2dCQUNmLEtBQUssYUFBYSxDQUFDLGlCQUFpQjtvQkFDbkMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxrREFBa0QsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLDZCQUE2QixDQUFDLENBQUMsQ0FBQztvQkFDL0gsTUFBTTtZQUNSLENBQUM7UUFDRixDQUFDO1FBRWUsT0FBTztZQUN0QixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMzQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7UUFFTSxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQXdCO1lBRTNDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO2dCQUN6QixPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNiLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUMzQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hDLENBQUM7YUFDRCxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUUzQixPQUFPLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFFckQsS0FBSyxNQUFNLGFBQWEsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ2xELE1BQU0sRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLEdBQUcsYUFBYSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNoRixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztvQkFDbEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUM7b0JBQ25DLElBQUksSUFBSSxDQUFDLGFBQWEsS0FBSyxZQUFZLEVBQUUsQ0FBQzt3QkFDekMsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztvQkFDRCxRQUFRLE1BQU0sRUFBRSxDQUFDO3dCQUNoQixLQUFLLE1BQU0sQ0FBQyxRQUFROzRCQUNuQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQzlCLE9BQU8sSUFBSSxDQUFDO3dCQUNiLEtBQUssTUFBTSxDQUFDLEtBQUs7NEJBQ2hCLE9BQU8sYUFBYSxDQUFDLFdBQVcsQ0FBQztvQkFDbkMsQ0FBQztnQkFDRixDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ2xCLElBQUEsMEJBQWlCLEVBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3pCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQTVFWSxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQVU3QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsMkNBQXdCLENBQUE7T0FYZCxtQkFBbUIsQ0E0RS9CO0lBYUQsTUFBZSw0QkFBZ0MsU0FBUSxzQkFBVTtRQUloRSxZQUErQixPQUEwQjtZQUN4RCxLQUFLLEVBQUUsQ0FBQztZQURzQixZQUFPLEdBQVAsT0FBTyxDQUFtQjtZQUYvQyxpQkFBWSxHQUF1QixJQUFJLENBQUM7UUFJbEQsQ0FBQztRQUVELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRU8sUUFBUTtZQUNmLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUN2QixDQUFDO1FBRU0sa0JBQWtCLENBQUMsS0FBd0I7WUFDakQsSUFBSSxLQUFLLENBQUMsdUJBQXVCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQztnQkFDOUQsT0FBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDO1lBQy9ELENBQUM7WUFDRCxNQUFNLG9CQUFvQixHQUFHLElBQUEsK0JBQXVCLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUVuRyxPQUFPO2dCQUNOLGFBQWEsRUFBRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUU7b0JBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7d0JBQ3ZDLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUV4QixDQUFDO29CQUNELElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7d0JBQ25DLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQztvQkFDeEIsQ0FBQztvQkFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7b0JBQ2pFLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDckIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUMxQixJQUFBLDBCQUFpQixFQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN2QixPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUM7Z0JBQ3hCLENBQUMsQ0FBQztnQkFDRixZQUFZLEVBQUUsb0JBQW9CO2FBQ2xDLENBQUM7UUFDSCxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDTyxZQUFZLENBQUMsS0FBUTtZQUM5QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRDs7OztXQUlHO1FBQ08sZUFBZTtZQUN4QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7S0FnQkQ7SUFFRCxJQUFNLHVDQUF1QyxHQUE3QyxNQUFNLHVDQUF3QyxTQUFRLDRCQUEwQztRQUUvRixZQUFZLE9BQTBCLEVBQTZDLHdCQUFrRDtZQUNwSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFEbUUsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtRQUVySSxDQUFDO1FBRVMsdUJBQXVCLENBQUMsS0FBd0I7WUFDekQsT0FBTywyQkFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsSCxDQUFDO1FBRVMsaUJBQWlCLENBQUMsS0FBd0IsRUFBRSxLQUFtQjtZQUN4RSxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDNUgsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxQyxPQUFPLElBQUksaUNBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNuRyxDQUFDO1FBRWtCLFlBQVksQ0FBQyxLQUFtQjtZQUNsRCxPQUFPLEtBQUssSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVPLDRCQUE0QixDQUFDLFlBQTBCLEVBQUUsaUJBQXFDO1lBRXJHLElBQUksZUFBNEMsQ0FBQztZQUNqRCwwQ0FBMEM7WUFDMUMsSUFBSSxtQkFBUSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLFlBQVksMkJBQVksRUFBRSxDQUFDO2dCQUM1RSxNQUFNLFFBQVEsR0FBRyxtQkFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEtBQUssaUJBQWlCLENBQUMsQ0FBQztnQkFDcEksSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCxlQUFlLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztnQkFDckMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxtQkFBbUIsR0FBRyxTQUFTLENBQUM7b0JBQ3BDLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7d0JBQ3BFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDbEUsSUFBSSxjQUFjLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQzs0QkFDMUMsbUJBQW1CLEdBQUcsWUFBWSxDQUFDOzRCQUNuQyxtQkFBbUIsR0FBRyxjQUFjLENBQUM7NEJBQ3JDLE1BQU0sR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDO3dCQUMxQixDQUFDO29CQUNGLENBQUM7b0JBQ0QsaUJBQWlCLEdBQUcsTUFBTSxDQUFDO29CQUMzQixlQUFlLEdBQUcsbUJBQW9CLENBQUMsUUFBUSxDQUFDO2dCQUNqRCxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGVBQWUsR0FBRyxZQUFZLENBQUMsUUFBdUMsQ0FBQztZQUN4RSxDQUFDO1lBQ0QsTUFBTSxjQUFjLEdBQW9CLEVBQUUsQ0FBQztZQUMzQyxNQUFNLG9CQUFvQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUM3RixNQUFNLE1BQU0sR0FBZ0IsSUFBSSxpQ0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDeEgsTUFBTSxNQUFNLEdBQWdCLElBQUksaUNBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3hILE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7WUFDSCxLQUFLLE1BQU0sY0FBYyxJQUFJLG9CQUFvQixFQUFFLENBQUM7Z0JBQ25ELGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ2hJLENBQUM7WUFDRCxNQUFNLG9CQUFvQixHQUFHLElBQUksbUNBQWEsQ0FBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXJGLE9BQU87Z0JBQ04sb0JBQW9CLEVBQUUsb0JBQW9CO2dCQUMxQyxVQUFVLEVBQUUsaUJBQWlCO2FBQzdCLENBQUM7UUFDSCxDQUFDO1FBRU8sOEJBQThCLENBQUMsY0FBOEIsRUFBRSxpQkFBeUI7WUFDL0YsTUFBTSxRQUFRLEdBQW9CLEVBQUUsQ0FBQztZQUNyQyxLQUFLLE1BQU0sS0FBSyxJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxlQUFlLEtBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3RGLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsZUFBZSxLQUFLLGlCQUFpQixFQUFFLENBQUM7d0JBQ3ZFLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO29CQUN4RyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsS0FBSyxNQUFNLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7NEJBQ2hELFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO3dCQUMzRyxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBTSxFQUFFLE1BQU0sQ0FBQyxLQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sS0FBSyxHQUFHLElBQUksaUNBQVcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxlQUFlLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDL0gsT0FBTyxJQUFJLG1DQUFhLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU8sV0FBVyxDQUFDLE1BQW1CLEVBQUUsTUFBbUI7WUFDM0QsSUFBSSxNQUFNLENBQUMsZUFBZSxLQUFLLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdkQsT0FBTyxNQUFNLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUM7WUFDeEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQ3BELENBQUM7UUFDRixDQUFDO1FBRU8sdUJBQXVCLENBQUMsT0FBc0M7WUFDckUsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ1osS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQy9DLEdBQUcsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUNELElBQUksT0FBTyxZQUFZLDZCQUFjLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQztZQUNqRyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFwR0ssdUNBQXVDO1FBRUgsV0FBQSwyQ0FBd0IsQ0FBQTtPQUY1RCx1Q0FBdUMsQ0FvRzVDO0lBRUQsTUFBZSx1Q0FBd0MsU0FBUSw0QkFBbUQ7UUFJakgsWUFBWSxNQUF5QjtZQUNwQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDZCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSw2QkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRVMsaUJBQWlCLENBQUMsS0FBd0IsRUFBRSxLQUFxQjtZQUMxRSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxQyxPQUFPLElBQUksaUNBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVrQixZQUFZLENBQUMsS0FBcUI7WUFDcEQsT0FBTyxLQUFLLEtBQUssSUFBSSxDQUFDO1FBQ3ZCLENBQUM7UUFHTyxtQkFBbUIsQ0FBQyxjQUE4QjtZQUN6RCxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDO1lBQ3JDLE1BQU0scUJBQXFCLEdBQW9CLEVBQUUsQ0FBQztZQUVsRCxrQ0FBa0M7WUFDbEMsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG1DQUFhLENBQzdDLFNBQVMsRUFDVCxFQUFFLEVBQ0YsU0FBUyxDQUNULENBQUM7WUFFRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pDLGdEQUFnRDtnQkFDaEQsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFckQsSUFBSSxVQUFVLENBQUM7Z0JBQ2YsSUFBSSxXQUFXLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDeEIsMENBQTBDO29CQUMxQyxVQUFVLEdBQUcscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ2pELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxnREFBZ0Q7b0JBQ2hELFVBQVUsR0FBRyxvQkFBb0IsQ0FBQztnQkFDbkMsQ0FBQztnQkFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLG1DQUFhLENBQzlCLElBQUksaUNBQVcsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUM3RixFQUFFLEVBQ0YsVUFBVSxDQUNWLENBQUM7Z0JBQ0YsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsT0FBTyxvQkFBb0IsQ0FBQztRQUM3QixDQUFDO0tBQ0Q7SUFFRCxJQUFNLGtEQUFrRCxHQUF4RCxNQUFNLGtEQUFtRCxTQUFRLHVDQUF1QztRQUl2RyxZQUNDLE1BQXlCLEVBQ3VCLDZCQUE0RDtZQUM1RyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFEa0Msa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUc1RyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5Q0FBbUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDNUksQ0FBQztRQUVrQixLQUFLLENBQUMsdUJBQXVCLENBQUMsS0FBd0I7WUFDeEUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxDQUFDO0tBQ0QsQ0FBQTtJQWZLLGtEQUFrRDtRQU1yRCxXQUFBLDZEQUE2QixDQUFBO09BTjFCLGtEQUFrRCxDQWV2RDtJQUVELElBQU0sNkNBQTZDLEdBQW5ELE1BQU0sNkNBQThDLFNBQVEsdUNBQXVDO1FBSWxHLFlBQVksTUFBeUIsRUFDcEMsZ0JBQTRCLEVBQ2Usd0JBQWtEO1lBRTdGLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUY2Qiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBRzdGLE1BQU0saUJBQWlCLEdBQUcsMkJBQWlCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZILElBQUksaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5Q0FBbUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDeEosQ0FBQztRQUNGLENBQUM7UUFFa0IsZUFBZTtZQUNqQyxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO1FBQ3BDLENBQUM7UUFFa0IsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEtBQXdCO1lBQ3hFLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDO1FBQzlDLENBQUM7S0FDRCxDQUFBO0lBdEJLLDZDQUE2QztRQU1oRCxXQUFBLDJDQUF3QixDQUFBO09BTnJCLDZDQUE2QyxDQXNCbEQifQ==