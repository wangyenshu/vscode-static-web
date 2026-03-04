/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/linkedText", "vs/base/test/common/utils"], function (require, exports, assert, linkedText_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LinkedText', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('parses correctly', () => {
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('').nodes, []);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('hello').nodes, ['hello']);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('hello there').nodes, ['hello there']);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [link text](http://link.href).').nodes, [
                'Some message with ',
                { label: 'link text', href: 'http://link.href' },
                '.'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [link text](http://link.href "and a title").').nodes, [
                'Some message with ',
                { label: 'link text', href: 'http://link.href', title: 'and a title' },
                '.'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [link text](http://link.href \'and a title\').').nodes, [
                'Some message with ',
                { label: 'link text', href: 'http://link.href', title: 'and a title' },
                '.'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [link text](http://link.href "and a \'title\'").').nodes, [
                'Some message with ',
                { label: 'link text', href: 'http://link.href', title: 'and a \'title\'' },
                '.'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [link text](http://link.href \'and a "title"\').').nodes, [
                'Some message with ',
                { label: 'link text', href: 'http://link.href', title: 'and a "title"' },
                '.'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [link text](random stuff).').nodes, [
                'Some message with [link text](random stuff).'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [https link](https://link.href).').nodes, [
                'Some message with ',
                { label: 'https link', href: 'https://link.href' },
                '.'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [https link](https:).').nodes, [
                'Some message with [https link](https:).'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [a command](command:foobar).').nodes, [
                'Some message with ',
                { label: 'a command', href: 'command:foobar' },
                '.'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('Some message with [a command](command:).').nodes, [
                'Some message with [a command](command:).'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('link [one](command:foo "nice") and link [two](http://foo)...').nodes, [
                'link ',
                { label: 'one', href: 'command:foo', title: 'nice' },
                ' and link ',
                { label: 'two', href: 'http://foo' },
                '...'
            ]);
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('link\n[one](command:foo "nice")\nand link [two](http://foo)...').nodes, [
                'link\n',
                { label: 'one', href: 'command:foo', title: 'nice' },
                '\nand link ',
                { label: 'two', href: 'http://foo' },
                '...'
            ]);
        });
        test('Should match non-greedily', () => {
            assert.deepStrictEqual((0, linkedText_1.parseLinkedText)('a [link text 1](http://link.href "title1") b [link text 2](http://link.href "title2") c').nodes, [
                'a ',
                { label: 'link text 1', href: 'http://link.href', title: 'title1' },
                ' b ',
                { label: 'link text 2', href: 'http://link.href', title: 'title2' },
                ' c',
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VkVGV4dC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9saW5rZWRUZXh0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7UUFDeEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLDRCQUFlLEVBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSw0QkFBZSxFQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLDRCQUFlLEVBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUM5RSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsNEJBQWUsRUFBQyxrREFBa0QsQ0FBQyxDQUFDLEtBQUssRUFBRTtnQkFDakcsb0JBQW9CO2dCQUNwQixFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFO2dCQUNoRCxHQUFHO2FBQ0gsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLDRCQUFlLEVBQUMsZ0VBQWdFLENBQUMsQ0FBQyxLQUFLLEVBQUU7Z0JBQy9HLG9CQUFvQjtnQkFDcEIsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFO2dC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