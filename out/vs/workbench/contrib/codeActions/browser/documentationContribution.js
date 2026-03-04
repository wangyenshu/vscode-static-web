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
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/common/types", "vs/platform/contextkey/common/contextkey"], function (require, exports, hierarchicalKind_1, lifecycle_1, languageFeatures_1, types_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionDocumentationContribution = void 0;
    let CodeActionDocumentationContribution = class CodeActionDocumentationContribution extends lifecycle_1.Disposable {
        constructor(extensionPoint, contextKeyService, languageFeaturesService) {
            super();
            this.contextKeyService = contextKeyService;
            this.contributions = [];
            this.emptyCodeActionsList = {
                actions: [],
                dispose: () => { }
            };
            this._register(languageFeaturesService.codeActionProvider.register('*', this));
            extensionPoint.setHandler(points => {
                this.contributions = [];
                for (const documentation of points) {
                    if (!documentation.value.refactoring) {
                        continue;
                    }
                    for (const contribution of documentation.value.refactoring) {
                        const precondition = contextkey_1.ContextKeyExpr.deserialize(contribution.when);
                        if (!precondition) {
                            continue;
                        }
                        this.contributions.push({
                            title: contribution.title,
                            when: precondition,
                            command: contribution.command
                        });
                    }
                }
            });
        }
        async provideCodeActions(_model, _range, context, _token) {
            return this.emptyCodeActionsList;
        }
        _getAdditionalMenuItems(context, actions) {
            if (context.only !== types_1.CodeActionKind.Refactor.value) {
                if (!actions.some(action => action.kind && types_1.CodeActionKind.Refactor.contains(new hierarchicalKind_1.HierarchicalKind(action.kind)))) {
                    return [];
                }
            }
            return this.contributions
                .filter(contribution => this.contextKeyService.contextMatchesRules(contribution.when))
                .map(contribution => {
                return {
                    id: contribution.command,
                    title: contribution.title
                };
            });
        }
    };
    exports.CodeActionDocumentationContribution = CodeActionDocumentationContribution;
    exports.CodeActionDocumentationContribution = CodeActionDocumentationContribution = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], CodeActionDocumentationContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRhdGlvbkNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVBY3Rpb25zL2Jyb3dzZXIvZG9jdW1lbnRhdGlvbkNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQnpGLElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW9DLFNBQVEsc0JBQVU7UUFhbEUsWUFDQyxjQUE0RCxFQUN4QyxpQkFBc0QsRUFDaEQsdUJBQWlEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBSDZCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFibkUsa0JBQWEsR0FJZixFQUFFLENBQUM7WUFFUSx5QkFBb0IsR0FBRztnQkFDdkMsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7YUFDbEIsQ0FBQztZQVNELElBQUksQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRS9FLGNBQWMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO2dCQUN4QixLQUFLLE1BQU0sYUFBYSxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNwQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDdEMsU0FBUztvQkFDVixDQUFDO29CQUVELEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDNUQsTUFBTSxZQUFZLEdBQUcsMkJBQWMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNuRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7NEJBQ25CLFNBQVM7d0JBQ1YsQ0FBQzt3QkFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQzs0QkFDdkIsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLOzRCQUN6QixJQUFJLEVBQUUsWUFBWTs0QkFDbEIsT0FBTyxFQUFFLFlBQVksQ0FBQyxPQUFPO3lCQUM3QixDQUFDLENBQUM7b0JBRUosQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQWtCLEVBQUUsTUFBeUIsRUFBRSxPQUFvQyxFQUFFLE1BQXlCO1lBQ3RJLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDO1FBQ2xDLENBQUM7UUFFTSx1QkFBdUIsQ0FBQyxPQUFvQyxFQUFFLE9BQXdDO1lBQzVHLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxzQkFBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLHNCQUFjLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLG1DQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDakgsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxhQUFhO2lCQUN2QixNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNyRixHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ25CLE9BQU87b0JBQ04sRUFBRSxFQUFFLFlBQVksQ0FBQyxPQUFPO29CQUN4QixLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUs7aUJBQ3pCLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBbEVZLGtGQUFtQztrREFBbkMsbUNBQW1DO1FBZTdDLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSwyQ0FBd0IsQ0FBQTtPQWhCZCxtQ0FBbUMsQ0FrRS9DIn0=