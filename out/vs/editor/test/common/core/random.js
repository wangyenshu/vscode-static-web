/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/offsetRange", "vs/editor/common/core/positionToOffset", "vs/editor/common/core/range", "vs/editor/common/core/textEdit"], function (require, exports, arrays_1, offsetRange_1, positionToOffset_1, range_1, textEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Random = void 0;
    class Random {
        static { this.basicAlphabet = '      abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; }
        static { this.basicAlphabetMultiline = '      \n\n\nabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; }
        static create(seed) {
            return new MersenneTwister(seed);
        }
        nextString(length, alphabet = Random.basicAlphabet) {
            let randomText = '';
            for (let i = 0; i < length; i++) {
                const characterIndex = this.nextIntRange(0, alphabet.length);
                randomText += alphabet.charAt(characterIndex);
            }
            return randomText;
        }
        nextMultiLineString(lineCount, lineLengthRange, alphabet = Random.basicAlphabet) {
            const lines = [];
            for (let i = 0; i < lineCount; i++) {
                const lineLength = this.nextIntRange(lineLengthRange.start, lineLengthRange.endExclusive);
                lines.push(this.nextString(lineLength, alphabet));
            }
            return lines.join('\n');
        }
        nextConsecutivePositions(source, count) {
            const t = new positionToOffset_1.PositionOffsetTransformer(source.getValue());
            const offsets = offsetRange_1.OffsetRange.ofLength(count).map(() => this.nextIntRange(0, t.text.length));
            offsets.sort(arrays_1.numberComparator);
            return offsets.map(offset => t.getPosition(offset));
        }
        nextRange(source) {
            const [start, end] = this.nextConsecutivePositions(source, 2);
            return range_1.Range.fromPositions(start, end);
        }
        nextTextEdit(target, singleTextEditCount) {
            const singleTextEdits = [];
            const positions = this.nextConsecutivePositions(target, singleTextEditCount * 2);
            for (let i = 0; i < singleTextEditCount; i++) {
                const start = positions[i * 2];
                const end = positions[i * 2 + 1];
                const newText = this.nextString(end.column - start.column, Random.basicAlphabetMultiline);
                singleTextEdits.push(new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(start, end), newText));
            }
            return new textEdit_1.TextEdit(singleTextEdits).normalize();
        }
    }
    exports.Random = Random;
    class MersenneTwister extends Random {
        constructor(seed) {
            super();
            this.mt = new Array(624);
            this.index = 0;
            this.mt[0] = seed >>> 0;
            for (let i = 1; i < 624; i++) {
                const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
                this.mt[i] = (((((s & 0xffff0000) >>> 16) * 0x6c078965) << 16) + (s & 0x0000ffff) * 0x6c078965 + i) >>> 0;
            }
        }
        _nextInt() {
            if (this.index === 0) {
                this.generateNumbers();
            }
            let y = this.mt[this.index];
            y = y ^ (y >>> 11);
            y = y ^ ((y << 7) & 0x9d2c5680);
            y = y ^ ((y << 15) & 0xefc60000);
            y = y ^ (y >>> 18);
            this.index = (this.index + 1) % 624;
            return y >>> 0;
        }
        nextIntRange(start, endExclusive) {
            const range = endExclusive - start;
            return Math.floor(this._nextInt() / (0x100000000 / range)) + start;
        }
        generateNumbers() {
            for (let i = 0; i < 624; i++) {
                const y = (this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff);
                this.mt[i] = this.mt[(i + 397) % 624] ^ (y >>> 1);
                if ((y % 2) !== 0) {
                    this.mt[i] = this.mt[i] ^ 0x9908b0df;
                }
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZG9tLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL2NvcmUvcmFuZG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFzQixNQUFNO2lCQUNiLGtCQUFhLEdBQVcsc0VBQXNFLENBQUM7aUJBQy9GLDJCQUFzQixHQUFXLDRFQUE0RSxDQUFDO1FBRXJILE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBWTtZQUNoQyxPQUFPLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFJTSxVQUFVLENBQUMsTUFBYyxFQUFFLFFBQVEsR0FBRyxNQUFNLENBQUMsYUFBYTtZQUNoRSxJQUFJLFVBQVUsR0FBVyxFQUFFLENBQUM7WUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzdELFVBQVUsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFDRCxPQUFPLFVBQVUsQ0FBQztRQUNuQixDQUFDO1FBRU0sbUJBQW1CLENBQUMsU0FBaUIsRUFBRSxlQUE0QixFQUFFLFFBQVEsR0FBRyxNQUFNLENBQUMsYUFBYTtZQUMxRyxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7WUFDM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNwQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFD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QUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3BFLENBQUM7UUFFTyxlQUFlO1lBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQztnQkFDNUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNuQixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDO2dCQUN0QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7S0FDRCJ9