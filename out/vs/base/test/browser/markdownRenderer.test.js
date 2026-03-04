/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/markdownRenderer", "vs/base/common/htmlContent", "vs/base/common/marked/marked", "vs/base/common/marshalling", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, markdownRenderer_1, htmlContent_1, marked_1, marshalling_1, platform_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function strToNode(str) {
        return new DOMParser().parseFromString(str, 'text/html').body.firstChild;
    }
    function assertNodeEquals(actualNode, expectedHtml) {
        const expectedNode = strToNode(expectedHtml);
        assert.ok(actualNode.isEqualNode(expectedNode), `Expected: ${expectedNode.outerHTML}\nActual: ${actualNode.outerHTML}`);
    }
    suite('MarkdownRenderer', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('Sanitization', () => {
            test('Should not render images with unknown schemes', () => {
                const markdown = { value: `![image](no-such://example.com/cat.gif)` };
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(markdown)).element;
                assert.strictEqual(result.innerHTML, '<p><img alt="image"></p>');
            });
        });
        suite('Images', () => {
            test('image rendering conforms to default', () => {
                const markdown = { value: `![image](http://example.com/cat.gif 'caption')` };
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(markdown)).element;
                assertNodeEquals(result, '<div><p><img title="caption" alt="image" src="http://example.com/cat.gif"></p></div>');
            });
            test('image rendering conforms to default without title', () => {
                const markdown = { value: `![image](http://example.com/cat.gif)` };
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(markdown)).element;
                assertNodeEquals(result, '<div><p><img alt="image" src="http://example.com/cat.gif"></p></div>');
            });
            test('image width from title params', () => {
                const result = store.add((0, markdownRenderer_1.renderMarkdown)({ value: `![image](http://example.com/cat.gif|width=100px 'caption')` })).element;
                assertNodeEquals(result, `<div><p><img width="100" title="caption" alt="image" src="http://example.com/cat.gif"></p></div>`);
            });
            test('image height from title params', () => {
                const result = store.add((0, markdownRenderer_1.renderMarkdown)({ value: `![image](http://example.com/cat.gif|height=100 'caption')` })).element;
                assertNodeEquals(result, `<div><p><img height="100" title="caption" alt="image" src="http://example.com/cat.gif"></p></div>`);
            });
            test('image width and height from title params', () => {
                const result = store.add((0, markdownRenderer_1.renderMarkdown)({ value: `![image](http://example.com/cat.gif|height=200,width=100 'caption')` })).element;
                assertNodeEquals(result, `<div><p><img height="200" width="100" title="caption" alt="image" src="http://example.com/cat.gif"></p></div>`);
            });
            test('image with file uri should render as same origin uri', () => {
                if (platform_1.isWeb) {
                    return;
                }
                const result = store.add((0, markdownRenderer_1.renderMarkdown)({ value: `![image](file:///images/cat.gif)` })).element;
                assertNodeEquals(result, '<div><p><img src="vscode-file://vscode-app/images/cat.gif" alt="image"></p></div>');
            });
        });
        suite('Code block renderer', () => {
            const simpleCodeBlockRenderer = (lang, code) => {
                const element = document.createElement('code');
                element.textContent = code;
                return Promise.resolve(element);
            };
            test('asyncRenderCallback should be invoked for code blocks', () => {
                const markdown = { value: '```js\n1 + 1;\n```' };
                return new Promise(resolve => {
                    store.add((0, markdownRenderer_1.renderMarkdown)(markdown, {
                        asyncRenderCallback: resolve,
                        codeBlockRenderer: simpleCodeBlockRenderer
                    }));
                });
            });
            test('asyncRenderCallback should not be invoked if result is immediately disposed', () => {
                const markdown = { value: '```js\n1 + 1;\n```' };
                return new Promise((resolve, reject) => {
                    const result = (0, markdownRenderer_1.renderMarkdown)(markdown, {
                        asyncRenderCallback: reject,
                        codeBlockRenderer: simpleCodeBlockRenderer
                    });
                    result.dispose();
                    setTimeout(resolve, 10);
                });
            });
            test('asyncRenderCallback should not be invoked if dispose is called before code block is rendered', () => {
                const markdown = { value: '```js\n1 + 1;\n```' };
                return new Promise((resolve, reject) => {
                    let resolveCodeBlockRendering;
                    const result = (0, markdownRenderer_1.renderMarkdown)(markdown, {
                        asyncRenderCallback: reject,
                        codeBlockRenderer: () => {
                            return new Promise(resolve => {
                                resolveCodeBlockRendering = resolve;
                            });
                        }
                    });
                    setTimeout(() => {
                        result.dispose();
                        resolveCodeBlockRendering(document.createElement('code'));
                        setTimeout(resolve, 10);
                    }, 10);
                });
            });
            test('Code blocks should use leading language id (#157793)', async () => {
                const markdown = { value: '```js some other stuff\n1 + 1;\n```' };
                const lang = await new Promise(resolve => {
                    store.add((0, markdownRenderer_1.renderMarkdown)(markdown, {
                        codeBlockRenderer: async (lang, value) => {
                            resolve(lang);
                            return simpleCodeBlockRenderer(lang, value);
                        }
                    }));
                });
                assert.strictEqual(lang, 'js');
            });
        });
        suite('ThemeIcons Support On', () => {
            test('render appendText', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendText('$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>$(zap)&nbsp;$(not&nbsp;a&nbsp;theme&nbsp;icon)&nbsp;$(add)</p>`);
            });
            test('render appendMarkdown', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendMarkdown('$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p><span class="codicon codicon-zap"></span> $(not a theme icon) <span class="codicon codicon-add"></span></p>`);
            });
            test('render appendMarkdown with escaped icon', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendMarkdown('\\$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>$(zap) $(not a theme icon) <span class="codicon codicon-add"></span></p>`);
            });
            test('render icon in link', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendMarkdown(`[$(zap)-link](#link)`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p><a data-href="#link" href="" title="#link" draggable="false"><span class="codicon codicon-zap"></span>-link</a></p>`);
            });
            test('render icon in table', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendMarkdown(`
| text   | text                 |
|--------|----------------------|
| $(zap) | [$(zap)-link](#link) |`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<table>
<thead>
<tr>
<th>text</th>
<th>text</th>
</tr>
</thead>
<tbody><tr>
<td><span class="codicon codicon-zap"></span></td>
<td><a data-href="#link" href="" title="#link" draggable="false"><span class="codicon codicon-zap"></span>-link</a></td>
</tr>
</tbody></table>
`);
            });
            test('render icon in <a> without href (#152170)', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true, supportHtml: true });
                mds.appendMarkdown(`<a>$(sync)</a>`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p><span class="codicon codicon-sync"></span></p>`);
            });
        });
        suite('ThemeIcons Support Off', () => {
            test('render appendText', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: false });
                mds.appendText('$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>$(zap)&nbsp;$(not&nbsp;a&nbsp;theme&nbsp;icon)&nbsp;$(add)</p>`);
            });
            test('render appendMarkdown with escaped icon', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: false });
                mds.appendMarkdown('\\$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>$(zap) $(not a theme icon) $(add)</p>`);
            });
        });
        test('npm Hover Run Script not working #90855', function () {
            const md = JSON.parse('{"value":"[Run Script](command:npm.runScriptFromHover?%7B%22documentUri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5Cjrieken%5C%5CCode%5C%5C_sample%5C%5Cfoo%5C%5Cpackage.json%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2Fjrieken%2FCode%2F_sample%2Ffoo%2Fpackage.json%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2Fjrieken%2FCode%2F_sample%2Ffoo%2Fpackage.json%22%2C%22scheme%22%3A%22file%22%7D%2C%22script%22%3A%22echo%22%7D \\"Run the script as a task\\")","supportThemeIcons":false,"isTrusted":true,"uris":{"__uri_e49443":{"$mid":1,"fsPath":"c:\\\\Users\\\\jrieken\\\\Code\\\\_sample\\\\foo\\\\package.json","_sep":1,"external":"file:///c%3A/Users/jrieken/Code/_sample/foo/package.json","path":"/c:/Users/jrieken/Code/_sample/foo/package.json","scheme":"file"},"command:npm.runScriptFromHover?%7B%22documentUri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5Cjrieken%5C%5CCode%5C%5C_sample%5C%5Cfoo%5C%5Cpackage.json%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2Fjrieken%2FCode%2F_sample%2Ffoo%2Fpackage.json%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2Fjrieken%2FCode%2F_sample%2Ffoo%2Fpackage.json%22%2C%22scheme%22%3A%22file%22%7D%2C%22script%22%3A%22echo%22%7D":{"$mid":1,"path":"npm.runScriptFromHover","scheme":"command","query":"{\\"documentUri\\":\\"__uri_e49443\\",\\"script\\":\\"echo\\"}"}}}');
            const element = store.add((0, markdownRenderer_1.renderMarkdown)(md)).element;
            const anchor = element.querySelector('a');
            assert.ok(anchor);
            assert.ok(anchor.dataset['href']);
            const uri = uri_1.URI.parse(anchor.dataset['href']);
            const data = (0, marshalling_1.parse)(decodeURIComponent(uri.query));
            assert.ok(data);
            assert.strictEqual(data.script, 'echo');
            assert.ok(data.documentUri.toString().startsWith('file:///c%3A/'));
        });
        test('Should not render command links by default', () => {
            const md = new htmlContent_1.MarkdownString(`[command1](command:doFoo) <a href="command:doFoo">command2</a>`, {
                supportHtml: true
            });
            const result = store.add((0, markdownRenderer_1.renderMarkdown)(md)).element;
            assert.strictEqual(result.innerHTML, `<p>command1 command2</p>`);
        });
        test('Should render command links in trusted strings', () => {
            const md = new htmlContent_1.MarkdownString(`[command1](command:doFoo) <a href="command:doFoo">command2</a>`, {
                isTrusted: true,
                supportHtml: true,
            });
            const result = store.add((0, markdownRenderer_1.renderMarkdown)(md)).element;
            assert.strictEqual(result.innerHTML, `<p><a data-href="command:doFoo" href="" title="command:doFoo" draggable="false">command1</a> <a data-href="command:doFoo" href="">command2</a></p>`);
        });
        suite('PlaintextMarkdownRender', () => {
            test('test code, blockquote, heading, list, listitem, paragraph, table, tablerow, tablecell, strong, em, br, del, text are rendered plaintext', () => {
                const markdown = { value: '`code`\n>quote\n# heading\n- list\n\n\ntable | table2\n--- | --- \none | two\n\n\nbo**ld**\n_italic_\n~~del~~\nsome text' };
                const expected = 'code\nquote\nheading\nlist\ntable table2 one two \nbold\nitalic\ndel\nsome text\n';
                const result = (0, markdownRenderer_1.renderMarkdownAsPlaintext)(markdown);
                assert.strictEqual(result, expected);
            });
            test('test html, hr, image, link are rendered plaintext', () => {
                const markdown = { value: '<div>html</div>\n\n---\n![image](imageLink)\n[text](textLink)' };
                const expected = '\ntext\n';
                const result = (0, markdownRenderer_1.renderMarkdownAsPlaintext)(markdown);
                assert.strictEqual(result, expected);
            });
        });
        suite('supportHtml', () => {
            test('supportHtml is disabled by default', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, {});
                mds.appendMarkdown('a<b>b</b>c');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>abc</p>`);
            });
            test('Renders html when supportHtml=true', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendMarkdown('a<b>b</b>c');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>a<b>b</b>c</p>`);
            });
            test('Should not include scripts even when supportHtml=true', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendMarkdown('a<b onclick="alert(1)">b</b><script>alert(2)</script>c');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>a<b>b</b>c</p>`);
            });
            test('Should not render html appended as text', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendText('a<b>b</b>c');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>a&lt;b&gt;b&lt;/b&gt;c</p>`);
            });
            test('Should render html images', () => {
                if (platform_1.isWeb) {
                    return;
                }
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendMarkdown(`<img src="http://example.com/cat.gif">`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<img src="http://example.com/cat.gif">`);
            });
            test('Should render html images with file uri as same origin uri', () => {
                if (platform_1.isWeb) {
                    return;
                }
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendMarkdown(`<img src="file:///images/cat.gif">`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<img src="vscode-file://vscode-app/images/cat.gif">`);
            });
        });
        suite('fillInIncompleteTokens', () => {
            function ignoreRaw(...tokenLists) {
                tokenLists.forEach(tokens => {
                    tokens.forEach(t => t.raw = '');
                });
            }
            const completeTable = '| a | b |\n| --- | --- |';
            suite('table', () => {
                test('complete table', () => {
                    const tokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.equal(newTokens, tokens);
                });
                test('full header only', () => {
                    const incompleteTable = '| a | b |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header only with trailing space', () => {
                    const incompleteTable = '| a | b | ';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    ignoreRaw(newTokens, completeTableTokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('incomplete header', () => {
                    const incompleteTable = '| a | b';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    ignoreRaw(newTokens, completeTableTokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('incomplete header one column', () => {
                    const incompleteTable = '| a ';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(incompleteTable + '|\n| --- |');
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    ignoreRaw(newTokens, completeTableTokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with extras', () => {
                    const incompleteTable = '| a **bold** | b _italics_ |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(incompleteTable + '\n| --- | --- |');
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with leading text', () => {
                    // Parsing this gives one token and one 'text' subtoken
                    const incompleteTable = 'here is a table\n| a | b |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(incompleteTable + '\n| --- | --- |');
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with leading other stuff', () => {
                    // Parsing this gives one token and one 'text' subtoken
                    const incompleteTable = '```js\nconst xyz = 123;\n```\n| a | b |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(incompleteTable + '\n| --- | --- |');
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with incomplete separator', () => {
                    const incompleteTable = '| a | b |\n| ---';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with incomplete separator 2', () => {
                    const incompleteTable = '| a | b |\n| --- |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with incomplete separator 3', () => {
                    const incompleteTable = '| a | b |\n|';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('not a table', () => {
                    const incompleteTable = '| a | b |\nsome text';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test('not a table 2', () => {
                    const incompleteTable = '| a | b |\n| --- |\nsome text';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
            });
            suite('codeblock', () => {
                test('complete code block', () => {
                    const completeCodeblock = '```js\nconst xyz = 123;\n```';
                    const tokens = marked_1.marked.lexer(completeCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.equal(newTokens, tokens);
                });
                test('code block header only', () => {
                    const incompleteCodeblock = '```js';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header no lang', () => {
                    const incompleteCodeblock = '```';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header and some code', () => {
                    const incompleteCodeblock = '```js\nconst';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header with leading text', () => {
                    const incompleteCodeblock = 'some text\n```js';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header with leading text and some code', () => {
                    const incompleteCodeblock = 'some text\n```js\nconst';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header with more backticks', () => {
                    const incompleteCodeblock = 'some text\n`````js\nconst';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n`````');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header containing codeblock', () => {
                    const incompleteCodeblock = `some text
\`\`\`\`\`js
const x = 1;
\`\`\`
const y = 2;
\`\`\`
// foo`;
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n`````');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
            });
            function simpleMarkdownTestSuite(name, delimiter) {
                test(`incomplete ${name}`, () => {
                    const incomplete = `${delimiter}code`;
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test(`complete ${name}`, () => {
                    const text = `leading text ${delimiter}code${delimiter} trailing text`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test(`${name} with leading text`, () => {
                    const incomplete = `some text and ${delimiter}some code`;
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test(`single loose "${delimiter}"`, () => {
                    const text = `some text and ${delimiter}by itself\nmore text here`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test(`incomplete ${name} after newline`, () => {
                    const text = `some text\nmore text here and ${delimiter}text`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test(`incomplete after complete ${name}`, () => {
                    const text = `leading text ${delimiter}code${delimiter} trailing text and ${delimiter}another`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test.skip(`incomplete ${name} in list`, () => {
                    const text = `- list item one\n- list item two and ${delimiter}text`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
            }
            suite('codespan', () => {
                simpleMarkdownTestSuite('codespan', '`');
                test(`backtick between letters`, () => {
                    const text = 'a`b';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodespanTokens = marked_1.marked.lexer(text + '`');
                    assert.deepStrictEqual(newTokens, completeCodespanTokens);
                });
                test(`nested pattern`, () => {
                    const text = 'sldkfjsd `abc __def__ ghi';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + '`');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
            });
            suite('star', () => {
                simpleMarkdownTestSuite('star', '*');
                test(`star between letters`, () => {
                    const text = 'sldkfjsd a*b';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + '*');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test(`nested pattern`, () => {
                    const text = 'sldkfjsd *abc __def__ ghi';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + '*');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
            });
            suite('double star', () => {
                simpleMarkdownTestSuite('double star', '**');
                test(`double star between letters`, () => {
                    const text = 'a**b';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + '**');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
            });
            suite('underscore', () => {
                simpleMarkdownTestSuite('underscore', '_');
                test(`underscore between letters`, () => {
                    const text = `this_not_italics`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
            });
            suite('double underscore', () => {
                simpleMarkdownTestSuite('double underscore', '__');
                test(`double underscore between letters`, () => {
                    const text = `this__not__bold`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
            });
            suite('link', () => {
                test('incomplete link text', () => {
                    const incomplete = 'abc [text';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + '](about:blank)');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target', () => {
                    const incomplete = 'foo [text](http://microsoft';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + ')');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target 2', () => {
                    const incomplete = 'foo [text](http://microsoft.com';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + ')');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target with extra stuff', () => {
                    const incomplete = '[before `text` after](http://microsoft.com';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + ')');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target with extra stuff and arg', () => {
                    const incomplete = '[before `text` after](http://microsoft.com "more text ';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + ')');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target with arg', () => {
                    const incomplete = 'foo [text](http://microsoft.com "more text here ';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + '")');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test.skip('incomplete link in list', () => {
                    const incomplete = '- [text';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + '](about:blank)');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('square brace between letters', () => {
                    const incomplete = 'a[b';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test('square brace on previous line', () => {
                    const incomplete = 'text[\nmore text';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test('complete link', () => {
                    const incomplete = 'text [link](http://microsoft.com)';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25SZW5kZXJlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvbWFya2Rvd25SZW5kZXJlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLFNBQVMsU0FBUyxDQUFDLEdBQVc7UUFDN0IsT0FBTyxJQUFJLFNBQVMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQXlCLENBQUM7SUFDekYsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsVUFBdUIsRUFBRSxZQUFvQjtRQUN0RSxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDN0MsTUFBTSxDQUFDLEVBQUUsQ0FDUixVQUFVLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUNwQyxhQUFhLFlBQVksQ0FBQyxTQUFTLGFBQWEsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVELEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFFOUIsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1lBQzFCLElBQUksQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7Z0JBQzFELE1BQU0sUUFBUSxHQUFHLEVBQUUsS0FBSyxFQUFFLHlDQUF5QyxFQUFFLENBQUM7Z0JBQ3RFLE1BQU0sTUFBTSxHQUFnQixLQUFLLENBQUMsR0FBRyxDQUFDLElBQUEsaUNBQWMsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztnQkFDeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxF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