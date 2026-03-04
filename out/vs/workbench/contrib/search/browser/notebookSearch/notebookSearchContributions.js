define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/search/common/notebookSearch", "vs/workbench/contrib/search/browser/notebookSearch/notebookSearchService"], function (require, exports, extensions_1, notebookSearch_1, notebookSearchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerContributions = registerContributions;
    function registerContributions() {
        (0, extensions_1.registerSingleton)(notebookSearch_1.INotebookSearchService, notebookSearchService_1.NotebookSearchService, 1 /* InstantiationType.Delayed */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZWFyY2hDb250cmlidXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvbm90ZWJvb2tTZWFyY2gvbm90ZWJvb2tTZWFyY2hDb250cmlidXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVFBLHNEQUVDO0lBRkQsU0FBZ0IscUJBQXFCO1FBQ3BDLElBQUEsOEJBQWlCLEVBQUMsdUNBQXNCLEVBQUUsNkNBQXFCLG9DQUE0QixDQUFDO0lBQzdGLENBQUMifQ==