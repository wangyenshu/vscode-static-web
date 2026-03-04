/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/textChange"], function (require, exports, assert, utils_1, textChange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GENERATE_TESTS = false;
    suite('TextChangeCompressor', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function getResultingContent(initialContent, edits) {
            let content = initialContent;
            for (let i = edits.length - 1; i >= 0; i--) {
                content = (content.substring(0, edits[i].offset) +
                    edits[i].text +
                    content.substring(edits[i].offset + edits[i].length));
            }
            return content;
        }
        function getTextChanges(initialContent, edits) {
            let content = initialContent;
            const changes = new Array(edits.length);
            let deltaOffset = 0;
            for (let i = 0; i < edits.length; i++) {
                const edit = edits[i];
                const position = edit.offset + deltaOffset;
                const length = edit.length;
                const text = edit.text;
                const oldText = content.substr(position, length);
                content = (content.substr(0, position) +
                    text +
                    content.substr(position + length));
                changes[i] = new textChange_1.TextChange(edit.offset, oldText, position, text);
                deltaOffset += text.length - length;
            }
            return changes;
        }
        function assertCompression(initialText, edit1, edit2) {
            const tmpText = getResultingContent(initialText, edit1);
            const chg1 = getTextChanges(initialText, edit1);
            const finalText = getResultingContent(tmpText, edit2);
            const chg2 = getTextChanges(tmpText, edit2);
            const compressedTextChanges = (0, textChange_1.compressConsecutiveTextChanges)(chg1, chg2);
            // Check that the compression was correct
            const compressedDoTextEdits = compressedTextChanges.map((change) => {
                return {
                    offset: change.oldPosition,
                    length: change.oldLength,
                    text: change.newText
                };
            });
            const actualDoResult = getResultingContent(initialText, compressedDoTextEdits);
            assert.strictEqual(actualDoResult, finalText);
            const compressedUndoTextEdits = compressedTextChanges.map((change) => {
                return {
                    offset: change.newPosition,
                    length: change.newLength,
                    text: change.oldText
                };
            });
            const actualUndoResult = getResultingContent(finalText, compressedUndoTextEdits);
            assert.strictEqual(actualUndoResult, initialText);
        }
        test('simple 1', () => {
            assertCompression('', [{ offset: 0, length: 0, text: 'h' }], [{ offset: 1, length: 0, text: 'e' }]);
        });
        test('simple 2', () => {
            assertCompression('|', [{ offset: 0, length: 0, text: 'h' }], [{ offset: 2, length: 0, text: 'e' }]);
        });
        test('complex1', () => {
            assertCompression('abcdefghij', [
                { offset: 0, length: 3, text: 'qh' },
                { offset: 5, length: 0, text: '1' },
                { offset: 8, length: 2, text: 'X' }
            ], [
                { offset: 1, length: 0, text: 'Z' },
                { offset: 3, length: 3, text: 'Y' },
            ]);
        });
        // test('issue #118041', () => {
        // 	assertCompression(
        // 		'﻿',
        // 		[
        // 			{ offset: 0, length: 1, text: '' },
        // 		],
        // 		[
        // 			{ offset: 1, length: 0, text: 'Z' },
        // 			{ offset: 3, length: 3, text: 'Y' },
        // 		]
        // 	);
        // })
        test('gen1', () => {
            assertCompression('kxm', [{ offset: 0, length: 1, text: 'tod_neu' }], [{ offset: 1, length: 2, text: 'sag_e' }]);
        });
        test('gen2', () => {
            assertCompression('kpb_r_v', [{ offset: 5, length: 2, text: 'a_jvf_l' }], [{ offset: 10, length: 2, text: 'w' }]);
        });
        test('gen3', () => {
            assertCompression('slu_w', [{ offset: 4, length: 1, text: '_wfw' }], [{ offset: 3, length: 5, text: '' }]);
        });
        test('gen4', () => {
            assertCompression('_e', [{ offset: 2, length: 0, text: 'zo_b' }], [{ offset: 1, length: 3, text: 'tra' }]);
        });
        test('gen5', () => {
            assertCompression('ssn_', [{ offset: 0, length: 2, text: 'tat_nwe' }], [{ offset: 2, length: 6, text: 'jm' }]);
        });
        test('gen6', () => {
            assertCompression('kl_nru', [{ offset: 4, length: 1, text: '' }], [{ offset: 1, length: 4, text: '__ut' }]);
        });
        const _a = 'a'.charCodeAt(0);
        const _z = 'z'.charCodeAt(0);
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        function getRandomString(minLength, maxLength) {
            const length = getRandomInt(minLength, maxLength);
            let r = '';
            for (let i = 0; i < length; i++) {
                r += String.fromCharCode(getRandomInt(_a, _z));
            }
            return r;
        }
        function getRandomEOL() {
            switch (getRandomInt(1, 3)) {
                case 1: return '\r';
                case 2: return '\n';
                case 3: return '\r\n';
            }
            throw new Error(`not possible`);
        }
        function getRandomBuffer(small) {
            const lineCount = getRandomInt(1, small ? 3 : 10);
            const lines = [];
            for (let i = 0; i < lineCount; i++) {
                lines.push(getRandomString(0, small ? 3 : 10) + getRandomEOL());
            }
            return lines.join('');
        }
        function getRandomEdits(content, min = 1, max = 5) {
            const result = [];
            let cnt = getRandomInt(min, max);
            let maxOffset = content.length;
            while (cnt > 0 && maxOffset > 0) {
                const offset = getRandomInt(0, maxOffset);
                const length = getRandomInt(0, maxOffset - offset);
                const text = getRandomBuffer(true);
                result.push({
                    offset: offset,
                    length: length,
                    text: text
                });
                maxOffset = offset;
                cnt--;
            }
            result.reverse();
            return result;
        }
        class GeneratedTest {
            constructor() {
                this._content = getRandomBuffer(false).replace(/\n/g, '_');
                this._edits1 = getRandomEdits(this._content, 1, 5).map((e) => { return { offset: e.offset, length: e.length, text: e.text.replace(/\n/g, '_') }; });
                const tmp = getResultingContent(this._content, this._edits1);
                this._edits2 = getRandomEdits(tmp, 1, 5).map((e) => { return { offset: e.offset, length: e.length, text: e.text.replace(/\n/g, '_') }; });
            }
            print() {
                console.log(`assertCompression(${JSON.stringify(this._content)}, ${JSON.stringify(this._edits1)}, ${JSON.stringify(this._edits2)});`);
            }
            assert() {
                assertCompression(this._content, this._edits1, this._edits2);
            }
        }
        if (GENERATE_TESTS) {
            let testNumber = 0;
            while (true) {
                testNumber++;
                console.log(`------RUNNING TextChangeCompressor TEST ${testNumber}`);
                const test = new GeneratedTest();
                try {
                    test.assert();
                }
                catch (err) {
                    console.log(err);
                    test.print();
                    break;
                }
            }
        }
    });
    suite('TextChange', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #118041: unicode character undo bug', () => {
            const textChange = new textChange_1.TextChange(428, '﻿', 428, '');
            const buff = new Uint8Array(textChange.writeSize());
            textChange.write(buff, 0);
            const actual = [];
            textChange_1.TextChange.read(buff, 0, actual);
            assert.deepStrictEqual(actual[0], textChange);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dENoYW5nZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVsL3RleHRDaGFuZ2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFRN0IsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtRQUVsQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxtQkFBbUIsQ0FBQyxjQUFzQixFQUFFLEtBQXVCO1lBQzNFLElBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQztZQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDNUMsT0FBTyxHQUFHLENBQ1QsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztvQkFDckMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7b0JBQ2IsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FDcEQsQ0FBQztZQUNILENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRUQsU0FBUyxjQUFjLENBQUMsY0FBc0IsRUFBRSxLQUF1QjtZQUN0RSxJQUFJLE9BQU8sR0FBRyxjQUFjLENBQUM7WUFDN0IsTUFBTSxPQUFPLEdBQWlCLElBQUksS0FBSyxDQUFhLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsRSxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7WUFFcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV0QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQztnQkFDM0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFFdkIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRWpELE9BQU8sR0FBRyxDQUNULE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQztvQkFDM0IsSUFBSTtvQkFDSixPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsQ0FDakMsQ0FBQztnQkFFRixPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSx1QkFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFbEUsV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JDLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxXQUFtQixFQUFFLEtBQXVCLEVBQUUsS0FBdUI7WUFFL0YsTUFBTSxPQUFPLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hELE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEQsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RELE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFNUMsTUFBTSxxQkFBcUIsR0FBRyxJQUFBLDJDQUE4QixFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV6RSx5Q0FBeUM7WUFDekMsTUFBTSxxQkFBcUIsR0FBcUIscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ3BGLE9BQU87b0JBQ04sTUFBTSxFQUFFLE1BQU0sQ0FBQyxXQUFXO29CQUMxQixNQUFNLEVBQUUsTUFBTSxDQUFDLFNBQVM7b0JBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTztpQkFDcEIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxjQUFjLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFDL0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFOUMsTUFBTSx1QkFBdUIsR0FBcUIscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ3RGLE9BQU87b0JBQ04sTUFBTSxFQUFFLE1BQU0sQ0FBQyxXQUFXO29CQUMxQixNQUFNLEVBQUUsTUFBTSxDQUFDLFNBQVM7b0JBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTztpQkFDcEIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUNqRixNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNyQixpQkFBaUIsQ0FDaEIsRUFBRSxFQUNGLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQ3JDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQ3JDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1lBQ3JCLGlCQUFpQixDQUNoQixHQUFHLEVBQ0gsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFDckMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FDckMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7WUFDckIsaUJBQWlCLENBQ2hCLFlBQVksRUFDWjtnQkFDQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO2dCQUNwQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNuQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO2FBQ25DLEVBQ0Q7Z0JBQ0MsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTtnQkFDbkMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRTthQUNuQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILGdDQUFnQztRQUNoQyxzQkFBc0I7UUFDdEIsU0FBUztRQUNULE1BQU07UUFDTix5Q0FBeUM7UUFDekMsT0FBTztRQUNQLE1BQU07UUFDTiwwQ0FBMEM7UUFDMUMsMENBQTBDO1FBQzFDLE1BQU07UUFDTixNQUFNO1FBQ04sS0FBSztRQUVMLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQ2pCLGlCQUFpQixDQUNoQixLQUFLLEVBQ0wsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFDM0MsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FDekMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7WUFDakIsaUJBQWlCLENBQ2hCLFNBQVMsRUFDVCxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUMzQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUN0QyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUNqQixpQkFBaUIsQ0FDaEIsT0FBTyxFQUNQLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQ3hDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQ3BDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQ2pCLGlCQUFpQixDQUNoQixJQUFJLEVBQ0osQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFDeEMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FDdkMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7WUFDakIsaUJBQWlCLENBQ2hCLE1BQU0sRUFDTixDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUMzQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUN0QyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUNqQixpQkFBaUIsQ0FDaEIsUUFBUSxFQUNSLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQ3BDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQ3hDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU3QixTQUFTLFlBQVksQ0FBQyxHQUFXLEVBQUUsR0FBVztZQUM3QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUMxRCxDQUFDO1FBRUQsU0FBUyxlQUFlLENBQUMsU0FBaUIsRUFBRSxTQUFpQjtZQUM1RCxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELENBQUM7WUFDRCxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7UUFFRCxTQUFTLFlBQVk7WUFDcEIsUUFBUSxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUM7WUFDdkIsQ0FBQztZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELFNBQVMsZUFBZSxDQUFDLEtBQWM7WUFDdEMsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO1lBQzNCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkIsQ0FBQztRQUVELFNBQVMsY0FBYyxDQUFDLE9BQWUsRUFBRSxNQUFjLENBQUMsRUFBRSxNQUFjLENBQUM7WUFFeEUsTUFBTSxNQUFNLEdBQXFCLEVBQUUsQ0FBQztZQUNwQyxJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRWpDLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFL0IsT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFFakMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDMUMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLENBQUMsRUFBRSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFbkMsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDWCxNQUFNLEVBQUUsTUFBTTtvQkFDZCxNQUFNLEVBQUUsTUFBTTtvQkFDZCxJQUFJLEVBQUUsSUFBSTtpQkFDVixDQUFDLENBQUM7Z0JBRUgsU0FBUyxHQUFHLE1BQU0sQ0FBQztnQkFDbkIsR0FBRyxFQUFFLENBQUM7WUFDUCxDQUFDO1lBRUQsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWpCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU0sYUFBYTtZQU1sQjtnQkFDQyxJQUFJLENBQUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEosTUFBTSxHQUFHLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdELElBQUksQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0ksQ0FBQztZQUVNLEtBQUs7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZJLENBQUM7WUFFTSxNQUFNO2dCQUNaLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUQsQ0FBQztTQUNEO1FBRUQsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNwQixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDbkIsT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDYixVQUFVLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLElBQUksR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUM7b0JBQ0osSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNmLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNqQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2IsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1FBRXhCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELE1BQU0sVUFBVSxHQUFHLElBQUksdUJBQVUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyRCxNQUFNLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUNwRCxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQixNQUFNLE1BQU0sR0FBaUIsRUFBRSxDQUFDO1lBQ2hDLHVCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7SUFFSixDQUFDLENBQUMsQ0FBQyJ9