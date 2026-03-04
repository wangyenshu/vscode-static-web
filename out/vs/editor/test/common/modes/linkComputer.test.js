define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/languages/linkComputer"], function (require, exports, assert, utils_1, linkComputer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimpleLinkComputerTarget {
        constructor(_lines) {
            this._lines = _lines;
            // Intentional Empty
        }
        getLineCount() {
            return this._lines.length;
        }
        getLineContent(lineNumber) {
            return this._lines[lineNumber - 1];
        }
    }
    function myComputeLinks(lines) {
        const target = new SimpleLinkComputerTarget(lines);
        return (0, linkComputer_1.computeLinks)(target);
    }
    function assertLink(text, extractedLink) {
        let startColumn = 0, endColumn = 0, chr, i = 0;
        for (i = 0; i < extractedLink.length; i++) {
            chr = extractedLink.charAt(i);
            if (chr !== ' ' && chr !== '\t') {
                startColumn = i + 1;
                break;
            }
        }
        for (i = extractedLink.length - 1; i >= 0; i--) {
            chr = extractedLink.charAt(i);
            if (chr !== ' ' && chr !== '\t') {
                endColumn = i + 2;
                break;
            }
        }
        const r = myComputeLinks([text]);
        assert.deepStrictEqual(r, [{
                range: {
                    startLineNumber: 1,
                    startColumn: startColumn,
                    endLineNumber: 1,
                    endColumn: endColumn
                },
                url: extractedLink.substring(startColumn - 1, endColumn - 1)
            }]);
    }
    suite('Editor Modes - Link Computer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Null model', () => {
            const r = (0, linkComputer_1.computeLinks)(null);
            assert.deepStrictEqual(r, []);
        });
        test('Parsing', () => {
            assertLink('x = "http://foo.bar";', '     http://foo.bar  ');
            assertLink('x = (http://foo.bar);', '     http://foo.bar  ');
            assertLink('x = [http://foo.bar];', '     http://foo.bar  ');
            assertLink('x = \'http://foo.bar\';', '     http://foo.bar  ');
            assertLink('x =  http://foo.bar ;', '     http://foo.bar  ');
            assertLink('x = <http://foo.bar>;', '     http://foo.bar  ');
            assertLink('x = {http://foo.bar};', '     http://foo.bar  ');
            assertLink('(see http://foo.bar)', '     http://foo.bar  ');
            assertLink('[see http://foo.bar]', '     http://foo.bar  ');
            assertLink('{see http://foo.bar}', '     http://foo.bar  ');
            assertLink('<see http://foo.bar>', '     http://foo.bar  ');
            assertLink('<url>http://mylink.com</url>', '     http://mylink.com      ');
            assertLink('// Click here to learn more. https://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409', '                             https://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409');
            assertLink('// Click here to learn more. https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx', '                             https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx');
            assertLink('// https://github.com/projectkudu/kudu/blob/master/Kudu.Core/Scripts/selectNodeVersion.js', '   https://github.com/projectkudu/kudu/blob/master/Kudu.Core/Scripts/selectNodeVersion.js');
            assertLink('<!-- !!! Do not remove !!!   WebContentRef(link:https://go.microsoft.com/fwlink/?LinkId=166007, area:Admin, updated:2015, nextUpdate:2016, tags:SqlServer)   !!! Do not remove !!! -->', '                                                https://go.microsoft.com/fwlink/?LinkId=166007                                                                                        ');
            assertLink('For instructions, see https://go.microsoft.com/fwlink/?LinkId=166007.</value>', '                      https://go.microsoft.com/fwlink/?LinkId=166007         ');
            assertLink('For instructions, see https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx.</value>', '                      https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx         ');
            assertLink('x = "https://en.wikipedia.org/wiki/Zürich";', '     https://en.wikipedia.org/wiki/Zürich  ');
            assertLink('請參閱 http://go.microsoft.com/fwlink/?LinkId=761051。', '    http://go.microsoft.com/fwlink/?LinkId=761051 ');
            assertLink('（請參閱 http://go.microsoft.com/fwlink/?LinkId=761051）', '     http://go.microsoft.com/fwlink/?LinkId=761051 ');
            assertLink('x = "file:///foo.bar";', '     file:///foo.bar  ');
            assertLink('x = "file://c:/foo.bar";', '     file://c:/foo.bar  ');
            assertLink('x = "file://shares/foo.bar";', '     file://shares/foo.bar  ');
            assertLink('x = "file://shäres/foo.bar";', '     file://shäres/foo.bar  ');
            assertLink('Some text, then http://www.bing.com.', '                http://www.bing.com ');
            assertLink('let url = `http://***/_api/web/lists/GetByTitle(\'Teambuildingaanvragen\')/items`;', '           http://***/_api/web/lists/GetByTitle(\'Teambuildingaanvragen\')/items  ');
        });
        test('issue #7855', () => {
            assertLink('7. At this point, ServiceMain has been called.  There is no functionality presently in ServiceMain, but you can consult the [MSDN documentation](https://msdn.microsoft.com/en-us/library/windows/desktop/ms687414(v=vs.85).aspx) to add functionality as desired!', '                                                                                                                                                 https://msdn.microsoft.com/en-us/library/windows/desktop/ms687414(v=vs.85).aspx                                  ');
        });
        test('issue #62278: "Ctrl + click to follow link" for IPv6 URLs', () => {
            assertLink('let x = "http://[::1]:5000/connect/token"', '         http://[::1]:5000/connect/token  ');
        });
        test('issue #70254: bold links dont open in markdown file using editor mode with ctrl + click', () => {
            assertLink('2. Navigate to **https://portal.azure.com**', '                 https://portal.azure.com  ');
        });
        test('issue #86358: URL wrong recognition pattern', () => {
            assertLink('POST|https://portal.azure.com|2019-12-05|', '     https://portal.azure.com            ');
        });
        test('issue #67022: Space as end of hyperlink isn\'t always good idea', () => {
            assertLink('aa  https://foo.bar/[this is foo site]  aa', '    https://foo.bar/[this is foo site]    ');
        });
        test('issue #100353: Link detection stops at ＆(double-byte)', () => {
            assertLink('aa  http://tree-mark.chips.jp/レーズン＆ベリーミックス  aa', '    http://tree-mark.chips.jp/レーズン＆ベリーミックス    ');
        });
        test('issue #121438: Link detection stops at【...】', () => {
            assertLink('aa  https://zh.wikipedia.org/wiki/【我推的孩子】 aa', '    https://zh.wikipedia.org/wiki/【我推的孩子】   ');
        });
        test('issue #121438: Link detection stops at《...》', () => {
            assertLink('aa  https://zh.wikipedia.org/wiki/《新青年》编辑部旧址 aa', '    https://zh.wikipedia.org/wiki/《新青年》编辑部旧址   ');
        });
        test('issue #121438: Link detection stops at “...”', () => {
            assertLink('aa  https://zh.wikipedia.org/wiki/“常凯申”误译事件 aa', '    https://zh.wikipedia.org/wiki/“常凯申”误译事件   ');
        });
        test('issue #150905: Colon after bare hyperlink is treated as its part', () => {
            assertLink('https://site.web/page.html: blah blah blah', 'https://site.web/page.html                ');
        });
        // Removed because of #156875
        // test('issue #151631: Link parsing stoped where comments include a single quote ', () => {
        // 	assertLink(
        // 		`aa https://regexper.com/#%2F''%2F aa`,
        // 		`   https://regexper.com/#%2F''%2F   `,
        // 	);
        // });
        test('issue #156875: Links include quotes ', () => {
            assertLink(`"This file has been converted from https://github.com/jeff-hykin/better-c-syntax/blob/master/autogenerated/c.tmLanguage.json",`, `                                   https://github.com/jeff-hykin/better-c-syntax/blob/master/autogenerated/c.tmLanguage.json  `);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua0NvbXB1dGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZXMvbGlua0NvbXB1dGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBU0EsTUFBTSx3QkFBd0I7UUFFN0IsWUFBb0IsTUFBZ0I7WUFBaEIsV0FBTSxHQUFOLE1BQU0sQ0FBVTtZQUNuQyxvQkFBb0I7UUFDckIsQ0FBQztRQUVNLFlBQVk7WUFDbEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMzQixDQUFDO1FBRU0sY0FBYyxDQUFDLFVBQWtCO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQztLQUNEO0lBRUQsU0FBUyxjQUFjLENBQUMsS0FBZTtRQUN0QyxNQUFNLE1BQU0sR0FBRyxJQUFJLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25ELE9BQU8sSUFBQSwyQkFBWSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUFZLEVBQUUsYUFBcUI7UUFDdEQsSUFBSSxXQUFXLEdBQUcsQ0FBQyxFQUNsQixTQUFTLEdBQUcsQ0FBQyxFQUNiLEdBQVcsRUFDWCxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRVAsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDM0MsR0FBRyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsSUFBSSxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDakMsV0FBVyxHQUFH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