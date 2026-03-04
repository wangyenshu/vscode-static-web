/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/services/semanticTokensDto", "vs/base/common/buffer", "vs/base/test/common/utils"], function (require, exports, assert, semanticTokensDto_1, buffer_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SemanticTokensDto', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function toArr(arr) {
            const result = [];
            for (let i = 0, len = arr.length; i < len; i++) {
                result[i] = arr[i];
            }
            return result;
        }
        function assertEqualFull(actual, expected) {
            const convert = (dto) => {
                return {
                    id: dto.id,
                    type: dto.type,
                    data: toArr(dto.data)
                };
            };
            assert.deepStrictEqual(convert(actual), convert(expected));
        }
        function assertEqualDelta(actual, expected) {
            const convertOne = (delta) => {
                if (!delta.data) {
                    return delta;
                }
                return {
                    start: delta.start,
                    deleteCount: delta.deleteCount,
                    data: toArr(delta.data)
                };
            };
            const convert = (dto) => {
                return {
                    id: dto.id,
                    type: dto.type,
                    deltas: dto.deltas.map(convertOne)
                };
            };
            assert.deepStrictEqual(convert(actual), convert(expected));
        }
        function testRoundTrip(value) {
            const decoded = (0, semanticTokensDto_1.decodeSemanticTokensDto)((0, semanticTokensDto_1.encodeSemanticTokensDto)(value));
            if (value.type === 'full' && decoded.type === 'full') {
                assertEqualFull(decoded, value);
            }
            else if (value.type === 'delta' && decoded.type === 'delta') {
                assertEqualDelta(decoded, value);
            }
            else {
                assert.fail('wrong type');
            }
        }
        test('full encoding', () => {
            testRoundTrip({
                id: 12,
                type: 'full',
                data: new Uint32Array([(1 << 24) + (2 << 16) + (3 << 8) + 4])
            });
        });
        test('delta encoding', () => {
            testRoundTrip({
                id: 12,
                type: 'delta',
                deltas: [{
                        start: 0,
                        deleteCount: 4,
                        data: undefined
                    }, {
                        start: 15,
                        deleteCount: 0,
                        data: new Uint32Array([(1 << 24) + (2 << 16) + (3 << 8) + 4])
                    }, {
                        start: 27,
                        deleteCount: 5,
                        data: new Uint32Array([(1 << 24) + (2 << 16) + (3 << 8) + 4, 1, 2, 3, 4, 5, 6, 7, 8, 9])
                    }]
            });
        });
        test('partial array buffer', () => {
            const sharedArr = new Uint32Array([
                (1 << 24) + (2 << 16) + (3 << 8) + 4,
                1, 2, 3, 4, 5, (1 << 24) + (2 << 16) + (3 << 8) + 4
            ]);
            testRoundTrip({
                id: 12,
                type: 'delta',
                deltas: [{
                        start: 0,
                        deleteCount: 4,
                        data: sharedArr.subarray(0, 1)
                    }, {
                        start: 15,
                        deleteCount: 0,
                        data: sharedArr.subarray(1, sharedArr.length)
                    }]
            });
        });
        test('issue #94521: unusual backing array buffer', () => {
            function wrapAndSliceUint8Arry(buff, prefixLength, suffixLength) {
                const wrapped = new Uint8Array(prefixLength + buff.byteLength + suffixLength);
                wrapped.set(buff, prefixLength);
                return wrapped.subarray(prefixLength, prefixLength + buff.byteLength);
            }
            function wrapAndSlice(buff, prefixLength, suffixLength) {
                return buffer_1.VSBuffer.wrap(wrapAndSliceUint8Arry(buff.buffer, prefixLength, suffixLength));
            }
            const dto = {
                id: 5,
                type: 'full',
                data: new Uint32Array([1, 2, 3, 4, 5])
            };
            const encoded = (0, semanticTokensDto_1.encodeSemanticTokensDto)(dto);
            // with misaligned prefix and misaligned suffix
            assertEqualFull((0, semanticTokensDto_1.decodeSemanticTokensDto)(wrapAndSlice(encoded, 1, 1)), dto);
            // with misaligned prefix and aligned suffix
            assertEqualFull((0, semanticTokensDto_1.decodeSemanticTokensDto)(wrapAndSlice(encoded, 1, 4)), dto);
            // with aligned prefix and misaligned suffix
            assertEqualFull((0, semanticTokensDto_1.decodeSemanticTokensDto)(wrapAndSlice(encoded, 4, 1)), dto);
            // with aligned prefix and aligned suffix
            assertEqualFull((0, semanticTokensDto_1.decodeSemanticTokensDto)(wrapAndSlice(encoded, 4, 4)), dto);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNEdG8udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9zZXJ2aWNlcy9zZW1hbnRpY1Rva2Vuc0R0by50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFFL0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsS0FBSyxDQUFDLEdBQWdCO1lBQzlCLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztZQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEIsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELFNBQVMsZUFBZSxDQUFDLE1BQThCLEVBQUUsUUFBZ0M7WUFDeEYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUEyQixFQUFFLEVBQUU7Z0JBQy9DLE9BQU87b0JBQ04sRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFO29CQUNWLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtvQkFDZCxJQUFJLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7aUJBQ3JCLENBQUM7WUFDSCxDQUFDLENBQUM7WUFDRixNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsU0FBUyxnQkFBZ0IsQ0FB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