/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/services/modelService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, platform_1, uri_1, modelService_1, configuration_1, testConfigurationService_1, contextkey_1, mockKeybindingService_1, themeService_1, testThemeService_1, notebookEditorServiceImpl_1, editorGroupsService_1, editorService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFileUriFromPathFromRoot = createFileUriFromPathFromRoot;
    exports.getRootName = getRootName;
    exports.stubModelService = stubModelService;
    exports.stubNotebookEditorService = stubNotebookEditorService;
    exports.addToSearchResult = addToSearchResult;
    function createFileUriFromPathFromRoot(path) {
        const rootName = getRootName();
        if (path) {
            return uri_1.URI.file(`${rootName}${path}`);
        }
        else {
            if (platform_1.isWindows) {
                return uri_1.URI.file(`${rootName}/`);
            }
            else {
                return uri_1.URI.file(rootName);
            }
        }
    }
    function getRootName() {
        if (platform_1.isWindows) {
            return 'c:';
        }
        else {
            return '';
        }
    }
    function stubModelService(instantiationService, addDisposable) {
        instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
        const config = new testConfigurationService_1.TestConfigurationService();
        config.setUserConfiguration('search', { searchOnType: true });
        instantiationService.stub(configuration_1.IConfigurationService, config);
        const modelService = instantiationService.createInstance(modelService_1.ModelService);
        addDisposable(modelService);
        return modelService;
    }
    function stubNotebookEditorService(instantiationService, addDisposable) {
        instantiationService.stub(editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService());
        instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
        const es = new workbenchTestServices_1.TestEditorService();
        addDisposable(es);
        instantiationService.stub(editorService_1.IEditorService, es);
        const notebookEditorWidgetService = instantiationService.createInstance(notebookEditorServiceImpl_1.NotebookEditorWidgetService);
        addDisposable(notebookEditorWidgetService);
        return notebookEditorWidgetService;
    }
    function addToSearchResult(searchResult, allRaw, searchInstanceID = '') {
        searchResult.add(allRaw, searchInstanceID, false);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoVGVzdENvbW1vbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC90ZXN0L2Jyb3dzZXIvc2VhcmNoVGVzdENvbW1vbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsc0VBV0M7SUFFRCxrQ0FNQztJQUVELDRDQVFDO0lBRUQsOERBU0M7SUFFRCw4Q0FFQztJQTVDRCxTQUFnQiw2QkFBNkIsQ0FBQyxJQUFhO1FBQzFELE1BQU0sUUFBUSxHQUFHLFdBQVcsRUFBRSxDQUFDO1FBQy9CLElBQUksSUFBSSxFQUFFLENBQUM7WUFDVixPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2QyxDQUFDO2FBQU0sQ0FBQztZQUNQLElBQUksb0JBQVMsRUFBRSxDQUFDO2dCQUNmLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDakMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixXQUFXO1FBQzFCLElBQUksb0JBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxvQkFBOEMsRUFBRSxhQUF1QztRQUN2SCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsNEJBQWEsRUFBRSxJQUFJLG1DQUFnQixFQUFFLENBQUMsQ0FBQztRQUNqRSxNQUFNLE1BQU0sR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7UUFDOUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzlELG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RCxNQUFNLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkJBQVksQ0FBQyxDQUFDO1FBQ3ZFLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM1QixPQUFPLFlBQVksQ0FBQztJQUNyQixDQUFDO0lBRUQsU0FBZ0IseUJBQXlCLENBQUMsb0JBQThDLEVBQUUsYUFBdUM7UUFDaEksb0JBQW9CLENBQUMsSUFBSSxDQUFDLDBDQUFvQixFQUFFLElBQUksK0NBQXVCLEVBQUUsQ0FBQyxDQUFDO1FBQy9FLG9CQUFvQixDQUFDLElBQUksQ0FBQywrQkFBa0IsRUFBRSxJQUFJLDZDQUFxQixFQUFFLENBQUMsQ0FBQztRQUMzRSxNQUFNLEVBQUUsR0FBRyxJQUFJLHlDQUFpQixFQUFFLENBQUM7UUFDbkMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xCLG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLE1BQU0sMkJBQTJCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVEQUEyQixDQUFDLENBQUM7UUFDckcsYUFBYSxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDM0MsT0FBTywyQkFBMkIsQ0FBQztJQUNwQyxDQUFDO0lBRUQsU0FBZ0IsaUJBQWlCLENBQUMsWUFBMEIsRUFBRSxNQUFvQixFQUFFLGdCQUFnQixHQUFHLEVBQUU7UUFDeEcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbkQsQ0FBQyJ9