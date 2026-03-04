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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/utils", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService", "vs/workbench/contrib/scm/common/scm", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, observable_1, utils_1, uri_1, nls_1, actions_1, instantiation_1, multiDiffSourceResolverService_1, scm_1, editorService_1) {
    "use strict";
    var ScmMultiDiffSourceResolver_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenScmGroupAction = exports.ScmMultiDiffSourceResolverContribution = exports.ScmMultiDiffSourceResolver = void 0;
    let ScmMultiDiffSourceResolver = class ScmMultiDiffSourceResolver {
        static { ScmMultiDiffSourceResolver_1 = this; }
        static { this._scheme = 'scm-multi-diff-source'; }
        static getMultiDiffSourceUri(repositoryUri, groupId) {
            return uri_1.URI.from({
                scheme: ScmMultiDiffSourceResolver_1._scheme,
                query: JSON.stringify({ repositoryUri, groupId }),
            });
        }
        static parseUri(uri) {
            if (uri.scheme !== ScmMultiDiffSourceResolver_1._scheme) {
                return undefined;
            }
            let query;
            try {
                query = JSON.parse(uri.query);
            }
            catch (e) {
                return undefined;
            }
            if (typeof query !== 'object' || query === null) {
                return undefined;
            }
            const { repositoryUri, groupId } = query;
            if (typeof repositoryUri !== 'string' || typeof groupId !== 'string') {
                return undefined;
            }
            return { repositoryUri: uri_1.URI.parse(repositoryUri), groupId };
        }
        constructor(_scmService) {
            this._scmService = _scmService;
        }
        canHandleUri(uri) {
            return ScmMultiDiffSourceResolver_1.parseUri(uri) !== undefined;
        }
        async resolveDiffSource(uri) {
            const { repositoryUri, groupId } = ScmMultiDiffSourceResolver_1.parseUri(uri);
            const repository = await (0, observable_1.waitForState)((0, observable_1.observableFromEvent)(this._scmService.onDidAddRepository, () => [...this._scmService.repositories].find(r => r.provider.rootUri?.toString() === repositoryUri.toString())));
            const group = await (0, observable_1.waitForState)((0, observable_1.observableFromEvent)(repository.provider.onDidChangeResourceGroups, () => repository.provider.groups.find(g => g.id === groupId)));
            return new ScmResolvedMultiDiffSource(group, repository);
        }
    };
    exports.ScmMultiDiffSourceResolver = ScmMultiDiffSourceResolver;
    exports.ScmMultiDiffSourceResolver = ScmMultiDiffSourceResolver = ScmMultiDiffSourceResolver_1 = __decorate([
        __param(0, scm_1.ISCMService)
    ], ScmMultiDiffSourceResolver);
    class ScmResolvedMultiDiffSource {
        constructor(_group, _repository) {
            this._group = _group;
            this._repository = _repository;
            this._resources = (0, observable_1.observableFromEvent)(this._group.onDidChangeResources, () => /** @description resources */ this._group.resources.map(e => new multiDiffSourceResolverService_1.MultiDiffEditorItem(e.multiDiffEditorOriginalUri, e.multiDiffEditorModifiedUri)));
            this.resources = new utils_1.ValueWithChangeEventFromObservable(this._resources);
            this.contextKeys = {
                scmResourceGroup: this._group.id,
                scmProvider: this._repository.provider.contextValue,
            };
        }
    }
    let ScmMultiDiffSourceResolverContribution = class ScmMultiDiffSourceResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.scmMultiDiffSourceResolver'; }
        constructor(instantiationService, multiDiffSourceResolverService) {
            super();
            this._register(multiDiffSourceResolverService.registerResolver(instantiationService.createInstance(ScmMultiDiffSourceResolver)));
        }
    };
    exports.ScmMultiDiffSourceResolverContribution = ScmMultiDiffSourceResolverContribution;
    exports.ScmMultiDiffSourceResolverContribution = ScmMultiDiffSourceResolverContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, multiDiffSourceResolverService_1.IMultiDiffSourceResolverService)
    ], ScmMultiDiffSourceResolverContribution);
    class OpenScmGroupAction extends actions_1.Action2 {
        static async openMultiFileDiffEditor(editorService, label, repositoryRootUri, resourceGroupId, options) {
            if (!repositoryRootUri) {
                return;
            }
            const multiDiffSource = ScmMultiDiffSourceResolver.getMultiDiffSourceUri(repositoryRootUri.toString(), resourceGroupId);
            return await editorService.openEditor({ label, multiDiffSource, options });
        }
        constructor() {
            super({
                id: '_workbench.openScmMultiDiffEditor',
                title: (0, nls_1.localize2)('viewChanges', 'View Changes'),
                f1: false
            });
        }
        async run(accessor, options) {
            const editorService = accessor.get(editorService_1.IEditorService);
            await OpenScmGroupAction.openMultiFileDiffEditor(editorService, options.title, uri_1.URI.revive(options.repositoryUri), options.resourceGroupId);
        }
    }
    exports.OpenScmGroupAction = OpenScmGroupAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtTXVsdGlEaWZmU291cmNlUmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tdWx0aURpZmZFZGl0b3IvYnJvd3Nlci9zY21NdWx0aURpZmZTb3VyY2VSZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBZXpGLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTBCOztpQkFDZCxZQUFPLEdBQUcsdUJBQXVCLEFBQTFCLENBQTJCO1FBRW5ELE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxhQUFxQixFQUFFLE9BQWU7WUFDekUsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNmLE1BQU0sRUFBRSw0QkFBMEIsQ0FBQyxPQUFPO2dCQUMxQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQXNCLENBQUM7YUFDckUsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBUTtZQUMvQixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssNEJBQTBCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLEtBQWdCLENBQUM7WUFDckIsSUFBSSxDQUFDO2dCQUNKLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQWMsQ0FBQztZQUM1QyxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNqRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7WUFDekMsSUFBSSxPQUFPLGFBQWEsS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3RFLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPLEVBQUUsYUFBYSxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDN0QsQ0FBQztRQUVELFlBQytCLFdBQXdCO1lBQXhCLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1FBRXZELENBQUM7UUFFRCxZQUFZLENBQUMsR0FBUTtZQUNwQixPQUFPLDRCQUEwQixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLENBQUM7UUFDL0QsQ0FBQztRQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFRO1lBQy9CLE1BQU0sRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLEdBQUcsNEJBQTBCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBRSxDQUFDO1lBQzdFLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSx5QkFBWSxFQUFDLElBQUEsZ0NBQW1CLEVBQ3hELElBQUksQ0FBQyxXQUFXLENBQUMsa0JBQWtCLEVBQ25DLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQ2hILENBQUM7WUFDRixNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEseUJBQVksRUFBQyxJQUFBLGdDQUFtQixFQUNuRCxVQUFVLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUM3QyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUM1RCxDQUFDLENBQUM7WUFDSCxPQUFPLElBQUksMEJBQTBCLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzFELENBQUM7O0lBdERXLGdFQUEwQjt5Q0FBMUIsMEJBQTBCO1FBbUNwQyxXQUFBLGlCQUFXLENBQUE7T0FuQ0QsMEJBQTBCLENBdUR0QztJQUVELE1BQU0sMEJBQTBCO1FBWS9CLFlBQ2tCLE1BQXlCLEVBQ3pCLFdBQTJCO1lBRDNCLFdBQU0sR0FBTixNQUFNLENBQW1CO1lBQ3pCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQWI1QixlQUFVLEdBQUcsSUFBQSxnQ0FBbUIsRUFDaEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFDaEMsR0FBRyxFQUFFLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxvREFBbUIsQ0FBQyxDQUFDLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FDdkosQ0FBQztZQUNPLGNBQVMsR0FBRyxJQUFJLDBDQUFrQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU3RCxnQkFBVyxHQUFvQztnQkFDOUQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNoQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWTthQUNuRCxDQUFDO1FBS0UsQ0FBQztLQUNMO0lBT00sSUFBTSxzQ0FBc0MsR0FBNUMsTUFBTSxzQ0FBdUMsU0FBUSxzQkFBVTtpQkFFckQsT0FBRSxHQUFHLDhDQUE4QyxBQUFqRCxDQUFrRDtRQUVwRSxZQUN3QixvQkFBMkMsRUFDakMsOEJBQStEO1lBRWhHLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsQ0FBQyw4QkFBOEIsQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEksQ0FBQzs7SUFYVyx3RkFBc0M7cURBQXRDLHNDQUFzQztRQUtoRCxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsZ0VBQStCLENBQUE7T0FOckIsc0NBQXNDLENBWWxEO0lBUUQsTUFBYSxrQkFBbUIsU0FBUSxpQkFBTztRQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLGFBQTZCLEVBQUUsS0FBYSxFQUFFLGlCQUFrQyxFQUFFLGVBQXVCLEVBQUUsT0FBaUM7WUFDdkwsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsMEJBQTBCLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDeEgsT0FBTyxNQUFNLGFBQWEsQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUVEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxtQ0FBbUM7Z0JBQ3ZDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxhQUFhLEVBQUUsY0FBYyxDQUFDO2dCQUMvQyxFQUFFLEVBQUUsS0FBSzthQUNULENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsT0FBa0M7WUFDdkUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxrQkFBa0IsQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRSxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDNUksQ0FBQztLQUNEO0lBdEJELGdEQXNCQyJ9