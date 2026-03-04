/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/htmlContent", "vs/base/test/common/utils"], function (require, exports, assert, htmlContent_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MarkdownString', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Escape leading whitespace', function () {
            const mds = new htmlContent_1.MarkdownString();
            mds.appendText('Hello\n    Not a code block');
            assert.strictEqual(mds.value, 'Hello\n\n&nbsp;&nbsp;&nbsp;&nbsp;Not&nbsp;a&nbsp;code&nbsp;block');
        });
        test('MarkdownString.appendText doesn\'t escape quote #109040', function () {
            const mds = new htmlContent_1.MarkdownString();
            mds.appendText('> Text\n>More');
            assert.strictEqual(mds.value, '\\>&nbsp;Text\n\n\\>More');
        });
        test('appendText', () => {
            const mds = new htmlContent_1.MarkdownString();
            mds.appendText('# foo\n*bar*');
            assert.strictEqual(mds.value, '\\#&nbsp;foo\n\n\\*bar\\*');
        });
        test('appendLink', function () {
            function assertLink(target, label, title, expected) {
                const mds = new htmlContent_1.MarkdownString();
                mds.appendLink(target, label, title);
                assert.strictEqual(mds.value, expected);
            }
            assertLink('https://example.com\\()![](file:///Users/jrieken/Code/_samples/devfest/foo/img.png)', 'hello', undefined, '[hello](https://example.com\\(\\)![](file:///Users/jrieken/Code/_samples/devfest/foo/img.png\\))');
            assertLink('https://example.com', 'hello', 'title', '[hello](https://example.com "title")');
            assertLink('foo)', 'hello]', undefined, '[hello\\]](foo\\))');
            assertLink('foo\\)', 'hello]', undefined, '[hello\\]](foo\\))');
            assertLink('fo)o', 'hell]o', undefined, '[hell\\]o](fo\\)o)');
            assertLink('foo)', 'hello]', 'title"', '[hello\\]](foo\\) "title\\"")');
        });
        suite('appendCodeBlock', () => {
            function assertCodeBlock(lang, code, result) {
                const mds = new htmlContent_1.MarkdownString();
                mds.appendCodeblock(lang, code);
                assert.strictEqual(mds.value, result);
            }
            test('common cases', () => {
                // no backticks
                assertCodeBlock('ts', 'const a = 1;', `\n${[
                    '```ts',
                    'const a = 1;',
                    '```'
                ].join('\n')}\n`);
                // backticks
                assertCodeBlock('ts', 'const a = `1`;', `\n${[
                    '```ts',
                    'const a = `1`;',
                    '```'
                ].join('\n')}\n`);
            });
            // @see https://github.com/microsoft/vscode/issues/193746
            test('escape fence', () => {
                // fence in the first line
                assertCodeBlock('md', '```\n```', `\n${[
                    '````md',
                    '```\n```',
                    '````'
                ].join('\n')}\n`);
                // fence in the middle of code
                assertCodeBlock('md', '\n\n```\n```', `\n${[
                    '````md',
                    '\n\n```\n```',
                    '````'
                ].join('\n')}\n`);
                // longer fence at the end of code
                assertCodeBlock('md', '```\n```\n````\n````', `\n${[
                    '`````md',
                    '```\n```\n````\n````',
                    '`````'
                ].join('\n')}\n`);
            });
        });
        suite('ThemeIcons', () => {
            suite('Support On', () => {
                test('appendText', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                    mds.appendText('$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '\\\\$\\(zap\\)&nbsp;$\\(not&nbsp;a&nbsp;theme&nbsp;icon\\)&nbsp;\\\\$\\(add\\)');
                });
                test('appendMarkdown', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                    mds.appendMarkdown('$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '$(zap) $(not a theme icon) $(add)');
                });
                test('appendMarkdown with escaped icon', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                    mds.appendMarkdown('\\$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '\\$(zap) $(not a theme icon) $(add)');
                });
            });
            suite('Support Off', () => {
                test('appendText', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: false });
                    mds.appendText('$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '$\\(zap\\)&nbsp;$\\(not&nbsp;a&nbsp;theme&nbsp;icon\\)&nbsp;$\\(add\\)');
                });
                test('appendMarkdown', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: false });
                    mds.appendMarkdown('$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '$(zap) $(not a theme icon) $(add)');
                });
                test('appendMarkdown with escaped icon', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                    mds.appendMarkdown('\\$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '\\$(zap) $(not a theme icon) $(add)');
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25TdHJpbmcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vbWFya2Rvd25TdHJpbmcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBRTVCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsMkJBQTJCLEVBQUU7WUFDakMsTUFBTSxHQUFHLEdBQUcsSUFBSSw0QkFBYyxFQUFFLENBQUM7WUFDakMsR0FBRyxDQUFDLFVBQVUsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxrRUFBa0UsQ0FBQyxDQUFDO1FBQ25HLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlEQUF5RCxFQUFFO1lBQy9ELE1BQU0sR0FBRyxHQUFHLElBQUksNEJBQWMsRUFBRSxDQUFDO1lBQ2pDLEdBQUcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLDBCQUEwQixDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUV2QixNQUFNLEdBQUcsR0FBRyxJQUFJLDRCQUFjLEVBQUUsQ0FBQztZQUNqQyxHQUFHLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRS9CLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFlBQVksRUFB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