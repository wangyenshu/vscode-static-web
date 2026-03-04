/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/test/common/utils", "vs/editor/common/services/languageService", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedDetailsRenderer", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, network_1, utils_1, languageService_1, testNotificationService_1, gettingStartedDetailsRenderer_1, gettingStartedService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Getting Started Markdown Renderer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('renders theme picker markdown with images', async () => {
            const fileService = new workbenchTestServices_1.TestFileService();
            const languageService = new languageService_1.LanguageService();
            const renderer = new gettingStartedDetailsRenderer_1.GettingStartedDetailsRenderer(fileService, new testNotificationService_1.TestNotificationService(), new workbenchTestServices_2.TestExtensionService(), languageService);
            const mdPath = (0, gettingStartedService_1.convertInternalMediaPathToFileURI)('theme_picker').with({ query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcomeGettingStarted/common/media/theme_picker' }) });
            const mdBase = network_1.FileAccess.asFileUri('vs/workbench/contrib/welcomeGettingStarted/common/media/');
            const rendered = await renderer.renderMarkdown(mdPath, mdBase);
            const imageSrcs = [...rendered.matchAll(/img src="[^"]*"/g)].map(match => match[0]);
            for (const src of imageSrcs) {
                const targetSrcFormat = /^img src=".*\/vs\/workbench\/contrib\/welcomeGettingStarted\/common\/media\/.*.png"$/;
                assert(targetSrcFormat.test(src), `${src} didnt match regex`);
            }
            languageService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWRNYXJrZG93blJlbmRlcmVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvdGVzdC9icm93c2VyL2dldHRpbmdTdGFydGVkTWFya2Rvd25SZW5kZXJlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7UUFFL0MsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywyQ0FBMkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RCxNQUFNLFdBQVcsR0FBRyxJQUFJLHVDQUFlLEVBQUUsQ0FBQztZQUMxQyxNQUFNLGVBQWUsR0FBRyxJQUFJLGlDQUFlLEVBQUUsQ0FBQztZQUM5QyxNQUFNLFFBQVEsR0FBRyxJQUFJLDZEQUE2QixDQUFDLFdBQVcsRUFBRSxJQUFJLGlEQUF1QixFQUFFLEVBQUUsSUFBSSw0Q0FBb0IsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzVJLE1BQU0sTUFBTSxHQUFHLElBQUEseURBQWlDLEVBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsc0VBQXNFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2TCxNQUFNLE1BQU0sR0FBRyxvQkFBVSxDQUFDLFNBQVMsQ0FBQywwREFBMEQsQ0FBQyxDQUFDO1lBQ2hHLE1BQU0sUUFBUSxHQUFHLE1BQU0sUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDL0QsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLEtBQUssTUFBTSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sZUFBZSxHQUFHLHNGQUFzRixDQUFDO2dCQUMvRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsb0JBQW9CLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBQ0QsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==