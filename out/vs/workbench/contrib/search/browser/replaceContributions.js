define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/search/browser/replace", "vs/workbench/contrib/search/browser/replaceService", "vs/workbench/common/contributions"], function (require, exports, extensions_1, replace_1, replaceService_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerContributions = registerContributions;
    function registerContributions() {
        (0, extensions_1.registerSingleton)(replace_1.IReplaceService, replaceService_1.ReplaceService, 1 /* InstantiationType.Delayed */);
        (0, contributions_1.registerWorkbenchContribution2)(replaceService_1.ReplacePreviewContentProvider.ID, replaceService_1.ReplacePreviewContentProvider, 1 /* WorkbenchPhase.BlockStartup */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZUNvbnRyaWJ1dGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9yZXBsYWNlQ29udHJpYnV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFTQSxzREFHQztJQUhELFNBQWdCLHFCQUFxQjtRQUNwQyxJQUFBLDhCQUFpQixFQUFDLHlCQUFlLEVBQUUsK0JBQWMsb0NBQTRCLENBQUM7UUFDOUUsSUFBQSw4Q0FBOEIsRUFBQyw4Q0FBNkIsQ0FBQyxFQUFFLEVBQUUsOENBQTZCLHNDQUFzRCxDQUFDO0lBQ3RKLENBQUMifQ==