define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, platform_1, uri_1, utils_1, testWorkspace_1, queryBuilder_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('QueryBuilderCommon', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let context;
        setup(() => {
            const workspace = (0, testWorkspace_1.testWorkspace)(uri_1.URI.file(platform_1.isWindows ? 'C:\\testWorkspace' : '/testWorkspace'));
            context = new workbenchTestServices_1.TestContextService(workspace);
        });
        test('resolveResourcesForSearchIncludes passes through paths without special glob characters', () => {
            const actual = (0, queryBuilder_1.resolveResourcesForSearchIncludes)([uri_1.URI.file(platform_1.isWindows ? "C:\\testWorkspace\\pages\\blog" : "/testWorkspace/pages/blog")], context);
            assert.deepStrictEqual(actual, ["./pages/blog"]);
        });
        test('resolveResourcesForSearchIncludes escapes paths with special characters', () => {
            const actual = (0, queryBuilder_1.resolveResourcesForSearchIncludes)([uri_1.URI.file(platform_1.isWindows ? "C:\\testWorkspace\\pages\\blog\\[postId]" : "/testWorkspace/pages/blog/[postId]")], context);
            assert.deepStrictEqual(actual, ["./pages/blog/[[]postId[]]"]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlCdWlsZGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL3Rlc3QvY29tbW9uL3F1ZXJ5QnVpbGRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQWFBLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFDaEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzFDLElBQUksT0FBaUMsQ0FBQztRQUV0QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxTQUFTLEdBQUcsSUFBQSw2QkFBYSxFQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUM5RixPQUFPLEdBQUcsSUFBSSwwQ0FBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3RkFBd0YsRUFBRSxHQUFHLEVBQUU7WUFDbkcsTUFBTSxNQUFNLEdBQUcsSUFBQSxnREFBaUMsRUFBQyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLDJCQUEyQixDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsSixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUVBQXlFLEVBQUUsR0FBRyxFQUFFO1lBQ3BGLE1BQU0sTUFBTSxHQUFHLElBQUEsZ0RBQWlDLEVBQUMsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFTLENBQUMsQ0FBQyxDQUFDLDBDQUEwQyxDQUFDLENBQUMsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDckssTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9