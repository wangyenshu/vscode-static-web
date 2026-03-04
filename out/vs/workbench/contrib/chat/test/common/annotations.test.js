/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "../../common/annotations"], function (require, exports, htmlContent_1, snapshot_1, utils_1, annotations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function content(str) {
        return { kind: 'markdownContent', content: new htmlContent_1.MarkdownString(str) };
    }
    suite('Annotations', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('extractVulnerabilitiesFromText', () => {
            test('single line', async () => {
                const before = 'some code ';
                const vulnContent = 'content with vuln';
                const after = ' after';
                const annotatedResult = (0, annotations_1.annotateSpecialMarkdownContent)([content(before), { kind: 'markdownVuln', content: new htmlContent_1.MarkdownString(vulnContent), vulnerabilities: [{ title: 'title', description: 'vuln' }] }, content(after)]);
                await (0, snapshot_1.assertSnapshot)(annotatedResult);
                const markdown = annotatedResult[0];
                const result = (0, annotations_1.extractVulnerabilitiesFromText)(markdown.content.value);
                await (0, snapshot_1.assertSnapshot)(result);
            });
            test('multiline', async () => {
                const before = 'some code\nover\nmultiple lines ';
                const vulnContent = 'content with vuln\nand\nnewlines';
                const after = 'more code\nwith newline';
                const annotatedResult = (0, annotations_1.annotateSpecialMarkdownContent)([content(before), { kind: 'markdownVuln', content: new htmlContent_1.MarkdownString(vulnContent), vulnerabilities: [{ title: 'title', description: 'vuln' }] }, content(after)]);
                await (0, snapshot_1.assertSnapshot)(annotatedResult);
                const markdown = annotatedResult[0];
                const result = (0, annotations_1.extractVulnerabilitiesFromText)(markdown.content.value);
                await (0, snapshot_1.assertSnapshot)(result);
            });
            test('multiple vulns', async () => {
                const before = 'some code\nover\nmultiple lines ';
                const vulnContent = 'content with vuln\nand\nnewlines';
                const after = 'more code\nwith newline';
                const annotatedResult = (0, annotations_1.annotateSpecialMarkdownContent)([
                    content(before),
                    { kind: 'markdownVuln', content: new htmlContent_1.MarkdownString(vulnContent), vulnerabilities: [{ title: 'title', description: 'vuln' }] },
                    content(after),
                    { kind: 'markdownVuln', content: new htmlContent_1.MarkdownString(vulnContent), vulnerabilities: [{ title: 'title', description: 'vuln' }] },
                ]);
                await (0, snapshot_1.assertSnapshot)(annotatedResult);
                const markdown = annotatedResult[0];
                const result = (0, annotations_1.extractVulnerabilitiesFromText)(markdown.content.value);
                await (0, snapshot_1.assertSnapshot)(result);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvdGVzdC9jb21tb24vYW5ub3RhdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxTQUFTLE9BQU8sQ0FBQyxHQUFXO1FBQzNCLE9BQU8sRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ3RFLENBQUM7SUFFRCxLQUFLLENBQUMsYUFBYSxFQUFFO1FBQ3BCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQzVDLElBQUksQ0FBQyxhQUFhLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzlCLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztnQkFDNUIsTUFBTSxXQUFXLEdBQUcsbUJBQW1CLENBQUM7Z0JBQ3hDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQztnQkFDdkIsTUFBTSxlQUFlLEdBQUcsSUFBQSw0Q0FBOEIsRUFBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRSxlQUFlLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxTixNQUFNLElBQUEseUJBQWMsRUFBQyxlQUFlLENBQUMsQ0FBQztnQkFFdEMsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFD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