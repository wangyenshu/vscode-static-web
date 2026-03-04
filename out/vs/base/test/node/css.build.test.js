/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/css.build"], function (require, exports, assert, utils_1, css_build_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CSSPlugin', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Utilities.pathOf', () => {
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf(''), '');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('/a'), '/');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('a/b/c.css'), 'a/b/');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('a'), '');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('a.com/a.css'), 'a.com/');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('http://a.com/a.css'), 'http://a.com/');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('https://a.com/a.css'), 'https://a.com/');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('http://a.com/a/b/c.css'), 'http://a.com/a/b/');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('https://a.com/a/b/c.css'), 'https://a.com/a/b/');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('/a.css'), '/');
            assert.strictEqual(css_build_1.CSSPluginUtilities.pathOf('/a/b/c.css'), '/a/b/');
        });
        test('Utilities.joinPaths', () => {
            function mytest(a, b, expected) {
                assert.strictEqual(css_build_1.CSSPluginUtilities.joinPaths(a, b), expected, '<' + a + '> + <' + b + '> = <' + expected + '>');
            }
            mytest('', 'a.css', 'a.css');
            mytest('', './a.css', 'a.css');
            mytest('', '././././a.css', 'a.css');
            mytest('', './../a.css', '../a.css');
            mytest('', '../../a.css', '../../a.css');
            mytest('', '../../a/b/c.css', '../../a/b/c.css');
            mytest('/', 'a.css', '/a.css');
            mytest('/', './a.css', '/a.css');
            mytest('/', '././././a.css', '/a.css');
            mytest('/', './../a.css', '/a.css');
            mytest('/', '../../a.css', '/a.css');
            mytest('/', '../../a/b/c.css', '/a/b/c.css');
            mytest('x/y/z/', 'a.css', 'x/y/z/a.css');
            mytest('x/y/z/', './a.css', 'x/y/z/a.css');
            mytest('x/y/z/', '././././a.css', 'x/y/z/a.css');
            mytest('x/y/z/', './../a.css', 'x/y/a.css');
            mytest('x/y/z/', '../../a.css', 'x/a.css');
            mytest('x/y/z/', '../../a/b/c.css', 'x/a/b/c.css');
            mytest('//a.com/', 'a.css', '//a.com/a.css');
            mytest('//a.com/', './a.css', '//a.com/a.css');
            mytest('//a.com/', '././././a.css', '//a.com/a.css');
            mytest('//a.com/', './../a.css', '//a.com/a.css');
            mytest('//a.com/', '../../a.css', '//a.com/a.css');
            mytest('//a.com/', '../../a/b/c.css', '//a.com/a/b/c.css');
            mytest('//a.com/x/y/z/', 'a.css', '//a.com/x/y/z/a.css');
            mytest('//a.com/x/y/z/', './a.css', '//a.com/x/y/z/a.css');
            mytest('//a.com/x/y/z/', '././././a.css', '//a.com/x/y/z/a.css');
            mytest('//a.com/x/y/z/', './../a.css', '//a.com/x/y/a.css');
            mytest('//a.com/x/y/z/', '../../a.css', '//a.com/x/a.css');
            mytest('//a.com/x/y/z/', '../../a/b/c.css', '//a.com/x/a/b/c.css');
            mytest('http://a.com/', 'a.css', 'http://a.com/a.css');
            mytest('http://a.com/', './a.css', 'http://a.com/a.css');
            mytest('http://a.com/', '././././a.css', 'http://a.com/a.css');
            mytest('http://a.com/', './../a.css', 'http://a.com/a.css');
            mytest('http://a.com/', '../../a.css', 'http://a.com/a.css');
            mytest('http://a.com/', '../../a/b/c.css', 'http://a.com/a/b/c.css');
            mytest('http://a.com/x/y/z/', 'a.css', 'http://a.com/x/y/z/a.css');
            mytest('http://a.com/x/y/z/', './a.css', 'http://a.com/x/y/z/a.css');
            mytest('http://a.com/x/y/z/', '././././a.css', 'http://a.com/x/y/z/a.css');
            mytest('http://a.com/x/y/z/', './../a.css', 'http://a.com/x/y/a.css');
            mytest('http://a.com/x/y/z/', '../../a.css', 'http://a.com/x/a.css');
            mytest('http://a.com/x/y/z/', '../../a/b/c.css', 'http://a.com/x/a/b/c.css');
            mytest('https://a.com/', 'a.css', 'https://a.com/a.css');
            mytest('https://a.com/', './a.css', 'https://a.com/a.css');
            mytest('https://a.com/', '././././a.css', 'https://a.com/a.css');
            mytest('https://a.com/', './../a.css', 'https://a.com/a.css');
            mytest('https://a.com/', '../../a.css', 'https://a.com/a.css');
            mytest('https://a.com/', '../../a/b/c.css', 'https://a.com/a/b/c.css');
            mytest('https://a.com/x/y/z/', 'a.css', 'https://a.com/x/y/z/a.css');
            mytest('https://a.com/x/y/z/', './a.css', 'https://a.com/x/y/z/a.css');
            mytest('https://a.com/x/y/z/', '././././a.css', 'https://a.com/x/y/z/a.css');
            mytest('https://a.com/x/y/z/', './../a.css', 'https://a.com/x/y/a.css');
            mytest('https://a.com/x/y/z/', '../../a.css', 'https://a.com/x/a.css');
            mytest('https://a.com/x/y/z/', '../../a/b/c.css', 'https://a.com/x/a/b/c.css');
        });
        test('Utilities.commonPrefix', () => {
            function mytest(a, b, expected) {
                assert.strictEqual(css_build_1.CSSPluginUtilities.commonPrefix(a, b), expected, 'prefix(<' + a + '>, <' + b + '>) = <' + expected + '>');
                assert.strictEqual(css_build_1.CSSPluginUtilities.commonPrefix(b, a), expected, 'prefix(<' + b + '>, <' + a + '>) = <' + expected + '>');
            }
            mytest('', '', '');
            mytest('x', '', '');
            mytest('x', 'x', 'x');
            mytest('aaaa', 'aaaa', 'aaaa');
            mytest('aaaaxyz', 'aaaa', 'aaaa');
            mytest('aaaaxyz', 'aaaatuv', 'aaaa');
        });
        test('Utilities.commonFolderPrefix', () => {
            function mytest(a, b, expected) {
                assert.strictEqual(css_build_1.CSSPluginUtilities.commonFolderPrefix(a, b), expected, 'folderPrefix(<' + a + '>, <' + b + '>) = <' + expected + '>');
                assert.strictEqual(css_build_1.CSSPluginUtilities.commonFolderPrefix(b, a), expected, 'folderPrefix(<' + b + '>, <' + a + '>) = <' + expected + '>');
            }
            mytest('', '', '');
            mytest('x', '', '');
            mytest('x', 'x', '');
            mytest('aaaa', 'aaaa', '');
            mytest('aaaaxyz', 'aaaa', '');
            mytest('aaaaxyz', 'aaaatuv', '');
            mytest('/', '/', '/');
            mytest('x/', '', '');
            mytest('x/', 'x/', 'x/');
            mytest('aaaa/', 'aaaa/', 'aaaa/');
            mytest('aaaa/axyz', 'aaaa/a', 'aaaa/');
            mytest('aaaa/axyz', 'aaaa/atuv', 'aaaa/');
        });
        test('Utilities.relativePath', () => {
            function mytest(a, b, expected) {
                assert.strictEqual(css_build_1.CSSPluginUtilities.relativePath(a, b), expected, 'relativePath(<' + a + '>, <' + b + '>) = <' + expected + '>');
            }
            mytest('', '', '');
            mytest('x', '', '');
            mytest('x', 'x', 'x');
            mytest('aaaa', 'aaaa', 'aaaa');
            mytest('aaaaxyz', 'aaaa', 'aaaa');
            mytest('aaaaxyz', 'aaaatuv', 'aaaatuv');
            mytest('x/y/aaaaxyz', 'x/aaaatuv', '../aaaatuv');
            mytest('x/y/aaaaxyz', 'x/y/aaaatuv', 'aaaatuv');
            mytest('z/t/aaaaxyz', 'x/y/aaaatuv', '../../x/y/aaaatuv');
            mytest('aaaaxyz', 'x/y/aaaatuv', 'x/y/aaaatuv');
            mytest('a', '/a', '/a');
            mytest('/', '/a', '/a');
            mytest('/a/b/c', '/a/b/c', '/a/b/c');
            mytest('/a/b', '/a/b/c/d', '/a/b/c/d');
            mytest('a', 'http://a', 'http://a');
            mytest('/', 'http://a', 'http://a');
            mytest('/a/b/c', 'http://a/b/c', 'http://a/b/c');
            mytest('/a/b', 'http://a/b/c/d', 'http://a/b/c/d');
            mytest('a', 'https://a', 'https://a');
            mytest('/', 'https://a', 'https://a');
            mytest('/a/b/c', 'https://a/b/c', 'https://a/b/c');
            mytest('/a/b', 'https://a/b/c/d', 'https://a/b/c/d');
            mytest('x/', '', '../');
            mytest('x/', '', '../');
            mytest('x/', 'x/', '');
            mytest('x/a', 'x/a', 'a');
        });
        test('Utilities.rewriteUrls', () => {
            function mytest(originalFile, newFile, url, expected) {
                assert.strictEqual((0, css_build_1.rewriteUrls)(originalFile, newFile, 'sel { background:url(\'' + url + '\'); }'), 'sel { background:url(' + expected + '); }');
                assert.strictEqual((0, css_build_1.rewriteUrls)(originalFile, newFile, 'sel { background:url(\"' + url + '\"); }'), 'sel { background:url(' + expected + '); }');
                assert.strictEqual((0, css_build_1.rewriteUrls)(originalFile, newFile, 'sel { background:url(' + url + '); }'), 'sel { background:url(' + expected + '); }');
            }
            // img/img.png
            mytest('a.css', 'b.css', 'img/img.png', 'img/img.png');
            mytest('a.css', 't/b.css', 'img/img.png', '../img/img.png');
            mytest('a.css', 'x/y/b.css', 'img/img.png', '../../img/img.png');
            mytest('x/a.css', 'b.css', 'img/img.png', 'x/img/img.png');
            mytest('x/y/a.css', 'b.css', 'img/img.png', 'x/y/img/img.png');
            mytest('x/y/a.css', 't/u/b.css', 'img/img.png', '../../x/y/img/img.png');
            mytest('x/y/a.css', 'x/u/b.css', 'img/img.png', '../y/img/img.png');
            mytest('x/y/a.css', 'x/y/b.css', 'img/img.png', 'img/img.png');
            mytest('/a.css', 'b.css', 'img/img.png', '/img/img.png');
            mytest('/a.css', 'x/b.css', 'img/img.png', '/img/img.png');
            mytest('/a.css', 'x/y/b.css', 'img/img.png', '/img/img.png');
            mytest('/x/a.css', 'b.css', 'img/img.png', '/x/img/img.png');
            mytest('/x/a.css', 'x/b.css', 'img/img.png', '/x/img/img.png');
            mytest('/x/a.css', 'x/y/b.css', 'img/img.png', '/x/img/img.png');
            mytest('/x/y/a.css', 'b.css', 'img/img.png', '/x/y/img/img.png');
            mytest('/x/y/a.css', 'x/b.css', 'img/img.png', '/x/y/img/img.png');
            mytest('/x/y/a.css', 'x/y/b.css', 'img/img.png', '/x/y/img/img.png');
            mytest('/a.css', '/b.css', 'img/img.png', '/img/img.png');
            mytest('/a.css', '/b.css', 'img/img.png', '/img/img.png');
            mytest('/x/a.css', '/b.css', 'img/img.png', '/x/img/img.png');
            mytest('/x/a.css', '/x/b.css', 'img/img.png', '/x/img/img.png');
            mytest('http://www.example.com/x/y/a.css', 'b.css', 'img/img.png', 'http://www.example.com/x/y/img/img.png');
            mytest('http://www.example.com/x/y/a.css', 'http://www.example2.com/b.css', 'img/img.png', 'http://www.example.com/x/y/img/img.png');
            mytest('https://www.example.com/x/y/a.css', 'b.css', 'img/img.png', 'https://www.example.com/x/y/img/img.png');
            // ../img/img.png
            mytest('a.css', 'b.css', '../img/img.png', '../img/img.png');
            mytest('a.css', 't/b.css', '../img/img.png', '../../img/img.png');
            mytest('a.css', 'x/y/b.css', '../img/img.png', '../../../img/img.png');
            mytest('x/a.css', 'b.css', '../img/img.png', 'img/img.png');
            mytest('x/y/a.css', 'b.css', '../img/img.png', 'x/img/img.png');
            mytest('x/y/a.css', 't/u/b.css', '../img/img.png', '../../x/img/img.png');
            mytest('x/y/a.css', 'x/u/b.css', '../img/img.png', '../img/img.png');
            mytest('x/y/a.css', 'x/y/b.css', '../img/img.png', '../img/img.png');
            mytest('/a.css', 'b.css', '../img/img.png', '/img/img.png');
            mytest('/a.css', 'x/b.css', '../img/img.png', '/img/img.png');
            mytest('/a.css', 'x/y/b.css', '../img/img.png', '/img/img.png');
            mytest('/x/a.css', 'b.css', '../img/img.png', '/img/img.png');
            mytest('/x/a.css', 'x/b.css', '../img/img.png', '/img/img.png');
            mytest('/x/a.css', 'x/y/b.css', '../img/img.png', '/img/img.png');
            mytest('/x/y/a.css', 'b.css', '../img/img.png', '/x/img/img.png');
            mytest('/x/y/a.css', 'x/b.css', '../img/img.png', '/x/img/img.png');
            mytest('/x/y/a.css', 'x/y/b.css', '../img/img.png', '/x/img/img.png');
            mytest('/a.css', '/b.css', '../img/img.png', '/img/img.png');
            mytest('/a.css', '/b.css', '../img/img.png', '/img/img.png');
            mytest('/x/a.css', '/b.css', '../img/img.png', '/img/img.png');
            mytest('/x/a.css', '/x/b.css', '../img/img.png', '/img/img.png');
            mytest('http://www.example.com/x/y/a.css', 'b.css', '../img/img.png', 'http://www.example.com/x/img/img.png');
            mytest('http://www.example.com/x/y/a.css', 'http://www.example2.com/b.css', '../img/img.png', 'http://www.example.com/x/img/img.png');
            mytest('https://www.example.com/x/y/a.css', 'b.css', '../img/img.png', 'https://www.example.com/x/img/img.png');
            // /img/img.png
            mytest('a.css', 'b.css', '/img/img.png', '/img/img.png');
            mytest('a.css', 't/b.css', '/img/img.png', '/img/img.png');
            mytest('a.css', 'x/y/b.css', '/img/img.png', '/img/img.png');
            mytest('x/a.css', 'b.css', '/img/img.png', '/img/img.png');
            mytest('x/y/a.css', 'b.css', '/img/img.png', '/img/img.png');
            mytest('x/y/a.css', 't/u/b.css', '/img/img.png', '/img/img.png');
            mytest('x/y/a.css', 'x/u/b.css', '/img/img.png', '/img/img.png');
            mytest('x/y/a.css', 'x/y/b.css', '/img/img.png', '/img/img.png');
            mytest('/a.css', 'b.css', '/img/img.png', '/img/img.png');
            mytest('/a.css', 'x/b.css', '/img/img.png', '/img/img.png');
            mytest('/a.css', 'x/y/b.css', '/img/img.png', '/img/img.png');
            mytest('/x/a.css', 'b.css', '/img/img.png', '/img/img.png');
            mytest('/x/a.css', 'x/b.css', '/img/img.png', '/img/img.png');
            mytest('/x/a.css', 'x/y/b.css', '/img/img.png', '/img/img.png');
            mytest('/x/y/a.css', 'b.css', '/img/img.png', '/img/img.png');
            mytest('/x/y/a.css', 'x/b.css', '/img/img.png', '/img/img.png');
            mytest('/x/y/a.css', 'x/y/b.css', '/img/img.png', '/img/img.png');
            mytest('/a.css', '/b.css', '/img/img.png', '/img/img.png');
            mytest('/a.css', '/b.css', '/img/img.png', '/img/img.png');
            mytest('/x/a.css', '/b.css', '/img/img.png', '/img/img.png');
            mytest('/x/a.css', '/x/b.css', '/img/img.png', '/img/img.png');
            mytest('http://www.example.com/x/y/a.css', 'b.css', '/img/img.png', 'http://www.example.com/img/img.png');
            mytest('http://www.example.com/x/y/a.css', 'http://www.example.com/x/y/b.css', '/img/img.png', 'http://www.example.com/img/img.png');
            mytest('https://www.example.com/x/y/a.css', 'b.css', '/img/img.png', 'https://www.example.com/img/img.png');
            // http://example.com/img/img.png
            mytest('a.css', 'b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('a.css', 't/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('a.css', 'x/y/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('x/a.css', 'b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('x/y/a.css', 'b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('x/y/a.css', 't/u/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('x/y/a.css', 'x/u/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('x/y/a.css', 'x/y/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/a.css', 'b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/a.css', 'x/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/a.css', 'x/y/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/x/a.css', 'b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/x/a.css', 'x/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/x/a.css', 'x/y/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/x/y/a.css', 'b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/x/y/a.css', 'x/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/x/y/a.css', 'x/y/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/a.css', '/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/a.css', '/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/x/a.css', '/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('/x/a.css', '/x/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('http://www.example.com/x/y/a.css', 'b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('http://www.example.com/x/y/a.css', 'http://www.example.com/x/y/b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
            mytest('https://www.example.com/x/y/a.css', 'b.css', 'http://example.com/img/img.png', 'http://example.com/img/img.png');
        });
        test('Utilities.rewriteUrls - quotes and spaces', () => {
            assert.strictEqual((0, css_build_1.rewriteUrls)('x/y/a.css', 't/u/b.css', 'sel { background:url(\'../img/img.png\'); }'), 'sel { background:url(../../x/img/img.png); }');
            assert.strictEqual((0, css_build_1.rewriteUrls)('x/y/a.css', 't/u/b.css', 'sel { background:url(\t\'../img/img.png\'); }'), 'sel { background:url(../../x/img/img.png); }');
            assert.strictEqual((0, css_build_1.rewriteUrls)('x/y/a.css', 't/u/b.css', 'sel { background:url( \'../img/img.png\'); }'), 'sel { background:url(../../x/img/img.png); }');
            assert.strictEqual((0, css_build_1.rewriteUrls)('x/y/a.css', 't/u/b.css', 'sel { background:url(\'../img/img.png\'\t); }'), 'sel { background:url(../../x/img/img.png); }');
            assert.strictEqual((0, css_build_1.rewriteUrls)('x/y/a.css', 't/u/b.css', 'sel { background:url(\'../img/img.png\' ); }'), 'sel { background:url(../../x/img/img.png); }');
            assert.strictEqual((0, css_build_1.rewriteUrls)('x/y/a.css', 't/u/b.css', 'sel { background:url(   \t   \'../img/img.png\'     \t); }'), 'sel { background:url(../../x/img/img.png); }');
        });
        test('Bug 9601 - css should ignore data urls', () => {
            const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAACHmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNC40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iPgogICAgICAgICA8ZGM6c3ViamVjdD4KICAgICAgICAgICAgPHJkZjpCYWcvPgogICAgICAgICA8L2RjOnN1YmplY3Q+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIEltYWdlUmVhZHk8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+ClC8oVQAAAGnSURBVDiNrZMxTxNxGMZ///9dZWns9a4dTHSABFiuCU5dGt2d9BsQls6GD2LCd2AiQQfixKIJE0ObdKIUSvDa5uLZihP0Sh+HOw3ipOUZ3zzvL2+e932NJBaRe7/Q8Uw5eMRrzXllDU8A5mJkLB+/TflQ+67JXb+5O0FUNS9deLckns/tn2A7hxtDawZvn37Vp78AX8rmxZLDewf89HGJ+fgKCrkrBeuXKPy44hbGN7e8eTbRZwALcFE2nuOy48j6zmaTYP8Qtxaia9A1uLWQYP8QZ7OJI+s7LjsXZeMBIIlLn61xgEbLnqadtiQp7Z0orq8rrq8r7Z1IkqadtkbLnsYBuvTZkpQBhgF7SRVFJRQ3QqW9bgY5P1V6fpoDu4oboaISSqpoGLD3GzAIOEqqaFBBURHF9TWlZxlEktKzruL6mqJi5kmqaBBwJIl7Wf+7LICBIYBSKGyE+LsHuCurzPo9Zv0e7soq/u4BhY0Qpfn68p6HCbHv4Q0qtBPfarLd1LR1nAVWzDNphJq2jjXZbirxrQYV2n0PT9Lih/Rwp/xLCz3T/+gnd2VVRJs/vngAAAAASUVORK5CYII=';
            function mytest(originalFile, newFile) {
                assert.strictEqual((0, css_build_1.rewriteUrls)(originalFile, newFile, 'sel { background:url(' + dataUrl + '); }'), 'sel { background:url(' + dataUrl + '); }');
                assert.strictEqual((0, css_build_1.rewriteUrls)(originalFile, newFile, 'sel { background:url( \t' + dataUrl + '\t ); }'), 'sel { background:url(' + dataUrl + '); }');
            }
            mytest('a.css', 'b.css');
            mytest('a.css', 't/b.css');
            mytest('a.css', 'x/y/b.css');
            mytest('x/a.css', 'b.css');
            mytest('x/y/a.css', 'b.css');
            mytest('x/y/a.css', 't/u/b.css');
            mytest('x/y/a.css', 'x/u/b.css');
            mytest('x/y/a.css', 'x/y/b.css');
            mytest('/a.css', 'b.css');
            mytest('/a.css', 'x/b.css');
            mytest('/a.css', 'x/y/b.css');
            mytest('/x/a.css', 'b.css');
            mytest('/x/a.css', 'x/b.css');
            mytest('/x/a.css', 'x/y/b.css');
            mytest('/x/y/a.css', 'b.css');
            mytest('/x/y/a.css', 'x/b.css');
            mytest('/x/y/a.css', 'x/y/b.css');
            mytest('/a.css', '/b.css');
            mytest('/a.css', '/b.css');
            mytest('/x/a.css', '/b.css');
            mytest('/x/a.css', '/x/b.css');
            mytest('http://www.example.com/x/y/a.css', 'b.css');
            mytest('http://www.example.com/x/y/a.css', 'http://www.example.com/x/y/b.css');
            mytest('https://www.example.com/x/y/a.css', 'b.css');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLmJ1aWxkLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3Qvbm9kZS9jc3MuYnVpbGQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUV2QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM3QixNQUFNLENBQUMsV0FBVyxDQUFDLDhCQUFrQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLDhCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLDhCQUFrQixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNuRSxNQUFNLENBQUMsV0FBVyxDQUFDLDhCQUFrQixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLDhCQUFrQixDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2RSxNQUFNLENBQUMsV0FBVyxDQUFDLDhCQUFrQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxXQUFXLENBQUMsOEJBQWtCLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUN2RixNQUFNLENBQUMsV0FBVyxDQUFDLDhCQUFrQixDQUFDLE1B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LGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM5RCxNQUFNLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDaEUsTUFBTSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMvRCxNQUFNLENBQUMsa0NBQWtDLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO1lBQzFHLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxrQ0FBa0MsRUFBRSxjQUFjLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztZQUNySSxNQUFNLENBQUMsbUNBQW1DLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDO1lBRTVHLGlDQUFpQztZQUNqQyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQzdGLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDL0YsTUFBTSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsZ0NBQWdDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUNqRyxNQUFNLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDakcsTUFBTSxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsZ0NBQWdDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUNyRyxNQUFNLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQ3JHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDckcsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUM5RixNQUFNLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQ2hHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDbEcsTUFBTSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUNoRyxNQUFNLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQ2xHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDcEcsTUFBTSxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUNsRyxNQUFNLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQ3BHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDdEcsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsZ0NBQWdDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUMvRixNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDakcsTUFBTSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsZ0NBQWdDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztZQUNuRyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDeEgsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLGtDQUFrQyxFQUFFLGdDQUFnQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFDbkosTUFBTSxDQUFDLG1DQUFtQyxFQUFFLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1FBRzFILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsdUJBQVcsRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsOENBQThDLENBQUMsQ0FBQztZQUN6SixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsdUJBQVcsRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLCtDQUErQyxDQUFDLEVBQUUsOENBQThDLENBQUMsQ0FBQztZQUMzSixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsdUJBQVcsRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLDhDQUE4QyxDQUFDLEVBQUUsOENBQThDLENBQUMsQ0FBQztZQUMxSixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsdUJBQVcsRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLCtDQUErQyxDQUFDLEVBQUUsOENBQThDLENBQUMsQ0FBQztZQUMzSixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsdUJBQVcsRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLDhDQUE4QyxDQUFDLEVBQUUsOENBQThDLENBQUMsQ0FBQztZQUMxSixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsdUJBQVcsRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLDREQUE0RCxDQUFDLEVBQUUsOENBQThDLENBQUMsQ0FBQztRQUN6SyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7WUFDbkQsTUFBTSxPQUFPLEdBQUcsdzVDQUF3NUMsQ0FBQztZQUV6NkMsU0FBUyxNQUFNLENBQUMsWUFBb0IsRUFBRSxPQUFlO2dCQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsdUJBQVcsRUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxNQUFNLENBQUMsRUFBRSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQy9JLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSx1QkFBVyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEdBQUcsT0FBTyxHQUFHLFNBQVMsQ0FBQyxFQUFFLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQztZQUN0SixDQUFDO1lBRUQsTUFBTSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6QixNQUFNLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDNUIsTUFBTSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sQ0FBQyxtQ0FBbUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=