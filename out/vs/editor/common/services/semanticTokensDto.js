/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/platform"], function (require, exports, buffer_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.encodeSemanticTokensDto = encodeSemanticTokensDto;
    exports.decodeSemanticTokensDto = decodeSemanticTokensDto;
    var EncodedSemanticTokensType;
    (function (EncodedSemanticTokensType) {
        EncodedSemanticTokensType[EncodedSemanticTokensType["Full"] = 1] = "Full";
        EncodedSemanticTokensType[EncodedSemanticTokensType["Delta"] = 2] = "Delta";
    })(EncodedSemanticTokensType || (EncodedSemanticTokensType = {}));
    function reverseEndianness(arr) {
        for (let i = 0, len = arr.length; i < len; i += 4) {
            // flip bytes 0<->3 and 1<->2
            const b0 = arr[i + 0];
            const b1 = arr[i + 1];
            const b2 = arr[i + 2];
            const b3 = arr[i + 3];
            arr[i + 0] = b3;
            arr[i + 1] = b2;
            arr[i + 2] = b1;
            arr[i + 3] = b0;
        }
    }
    function toLittleEndianBuffer(arr) {
        const uint8Arr = new Uint8Array(arr.buffer, arr.byteOffset, arr.length * 4);
        if (!platform.isLittleEndian()) {
            // the byte order must be changed
            reverseEndianness(uint8Arr);
        }
        return buffer_1.VSBuffer.wrap(uint8Arr);
    }
    function fromLittleEndianBuffer(buff) {
        const uint8Arr = buff.buffer;
        if (!platform.isLittleEndian()) {
            // the byte order must be changed
            reverseEndianness(uint8Arr);
        }
        if (uint8Arr.byteOffset % 4 === 0) {
            return new Uint32Array(uint8Arr.buffer, uint8Arr.byteOffset, uint8Arr.length / 4);
        }
        else {
            // unaligned memory access doesn't work on all platforms
            const data = new Uint8Array(uint8Arr.byteLength);
            data.set(uint8Arr);
            return new Uint32Array(data.buffer, data.byteOffset, data.length / 4);
        }
    }
    function encodeSemanticTokensDto(semanticTokens) {
        const dest = new Uint32Array(encodeSemanticTokensDtoSize(semanticTokens));
        let offset = 0;
        dest[offset++] = semanticTokens.id;
        if (semanticTokens.type === 'full') {
            dest[offset++] = 1 /* EncodedSemanticTokensType.Full */;
            dest[offset++] = semanticTokens.data.length;
            dest.set(semanticTokens.data, offset);
            offset += semanticTokens.data.length;
        }
        else {
            dest[offset++] = 2 /* EncodedSemanticTokensType.Delta */;
            dest[offset++] = semanticTokens.deltas.length;
            for (const delta of semanticTokens.deltas) {
                dest[offset++] = delta.start;
                dest[offset++] = delta.deleteCount;
                if (delta.data) {
                    dest[offset++] = delta.data.length;
                    dest.set(delta.data, offset);
                    offset += delta.data.length;
                }
                else {
                    dest[offset++] = 0;
                }
            }
        }
        return toLittleEndianBuffer(dest);
    }
    function encodeSemanticTokensDtoSize(semanticTokens) {
        let result = 0;
        result += (+1 // id
            + 1 // type
        );
        if (semanticTokens.type === 'full') {
            result += (+1 // data length
                + semanticTokens.data.length);
        }
        else {
            result += (+1 // delta count
            );
            result += (+1 // start
                + 1 // deleteCount
                + 1 // data length
            ) * semanticTokens.deltas.length;
            for (const delta of semanticTokens.deltas) {
                if (delta.data) {
                    result += delta.data.length;
                }
            }
        }
        return result;
    }
    function decodeSemanticTokensDto(_buff) {
        const src = fromLittleEndianBuffer(_buff);
        let offset = 0;
        const id = src[offset++];
        const type = src[offset++];
        if (type === 1 /* EncodedSemanticTokensType.Full */) {
            const length = src[offset++];
            const data = src.subarray(offset, offset + length);
            offset += length;
            return {
                id: id,
                type: 'full',
                data: data
            };
        }
        const deltaCount = src[offset++];
        const deltas = [];
        for (let i = 0; i < deltaCount; i++) {
            const start = src[offset++];
            const deleteCount = src[offset++];
            const length = src[offset++];
            let data;
            if (length > 0) {
                data = src.subarray(offset, offset + length);
                offset += length;
            }
            deltas[i] = { start, deleteCount, data };
        }
        return {
            id: id,
            type: 'delta',
            deltas: deltas
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNEdG8uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL3NlbWFudGljVG9rZW5zRHRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBK0RoRywwREF1QkM7SUErQkQsMERBK0JDO0lBaklELElBQVcseUJBR1Y7SUFIRCxXQUFXLHlCQUF5QjtRQUNuQyx5RUFBUSxDQUFBO1FBQ1IsMkVBQVMsQ0FBQTtJQUNWLENBQUMsRUFIVSx5QkFBeUIsS0FBekIseUJBQXlCLFFBR25DO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxHQUFlO1FBQ3pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ25ELDZCQUE2QjtZQUM3QixNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLEdBQUcsQ0FBQyxD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