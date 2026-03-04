/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/viewParts/minimap/minimapCharRenderer", "vs/editor/browser/viewParts/minimap/minimapCharSheet", "vs/editor/browser/viewParts/minimap/minimapPreBaked", "vs/base/common/uint"], function (require, exports, minimapCharRenderer_1, minimapCharSheet_1, minimapPreBaked_1, uint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinimapCharRendererFactory = void 0;
    /**
     * Creates character renderers. It takes a 'scale' that determines how large
     * characters should be drawn. Using this, it draws data into a canvas and
     * then downsamples the characters as necessary for the current display.
     * This makes rendering more efficient, rather than drawing a full (tiny)
     * font, or downsampling in real-time.
     */
    class MinimapCharRendererFactory {
        /**
         * Creates a new character renderer factory with the given scale.
         */
        static create(scale, fontFamily) {
            // renderers are immutable. By default we'll 'create' a new minimap
            // character renderer whenever we switch editors, no need to do extra work.
            if (this.lastCreated && scale === this.lastCreated.scale && fontFamily === this.lastFontFamily) {
                return this.lastCreated;
            }
            let factory;
            if (minimapPreBaked_1.prebakedMiniMaps[scale]) {
                factory = new minimapCharRenderer_1.MinimapCharRenderer(minimapPreBaked_1.prebakedMiniMaps[scale](), scale);
            }
            else {
                factory = MinimapCharRendererFactory.createFromSampleData(MinimapCharRendererFactory.createSampleData(fontFamily).data, scale);
            }
            this.lastFontFamily = fontFamily;
            this.lastCreated = factory;
            return factory;
        }
        /**
         * Creates the font sample data, writing to a canvas.
         */
        static createSampleData(fontFamily) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.style.height = `${16 /* Constants.SAMPLED_CHAR_HEIGHT */}px`;
            canvas.height = 16 /* Constants.SAMPLED_CHAR_HEIGHT */;
            canvas.width = 96 /* Constants.CHAR_COUNT */ * 10 /* Constants.SAMPLED_CHAR_WIDTH */;
            canvas.style.width = 96 /* Constants.CHAR_COUNT */ * 10 /* Constants.SAMPLED_CHAR_WIDTH */ + 'px';
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${16 /* Constants.SAMPLED_CHAR_HEIGHT */}px ${fontFamily}`;
            ctx.textBaseline = 'middle';
            let x = 0;
            for (const code of minimapCharSheet_1.allCharCodes) {
                ctx.fillText(String.fromCharCode(code), x, 16 /* Constants.SAMPLED_CHAR_HEIGHT */ / 2);
                x += 10 /* Constants.SAMPLED_CHAR_WIDTH */;
            }
            return ctx.getImageData(0, 0, 96 /* Constants.CHAR_COUNT */ * 10 /* Constants.SAMPLED_CHAR_WIDTH */, 16 /* Constants.SAMPLED_CHAR_HEIGHT */);
        }
        /**
         * Creates a character renderer from the canvas sample data.
         */
        static createFromSampleData(source, scale) {
            const expectedLength = 16 /* Constants.SAMPLED_CHAR_HEIGHT */ * 10 /* Constants.SAMPLED_CHAR_WIDTH */ * 4 /* Constants.RGBA_CHANNELS_CNT */ * 96 /* Constants.CHAR_COUNT */;
            if (source.length !== expectedLength) {
                throw new Error('Unexpected source in MinimapCharRenderer');
            }
            const charData = MinimapCharRendererFactory._downsample(source, scale);
            return new minimapCharRenderer_1.MinimapCharRenderer(charData, scale);
        }
        static _downsampleChar(source, sourceOffset, dest, destOffset, scale) {
            const width = 1 /* Constants.BASE_CHAR_WIDTH */ * scale;
            const height = 2 /* Constants.BASE_CHAR_HEIGHT */ * scale;
            let targetIndex = destOffset;
            let brightest = 0;
            // This is essentially an ad-hoc rescaling algorithm. Standard approaches
            // like bicubic interpolation are awesome for scaling between image sizes,
            // but don't work so well when scaling to very small pixel values, we end
            // up with blurry, indistinct forms.
            //
            // The approach taken here is simply mapping each source pixel to the target
            // pixels, and taking the weighted values for all pixels in each, and then
            // averaging them out. Finally we apply an intensity boost in _downsample,
            // since when scaling to the smallest pixel sizes there's more black space
            // which causes characters to be much less distinct.
            for (let y = 0; y < height; y++) {
                // 1. For this destination pixel, get the source pixels we're sampling
                // from (x1, y1) to the next pixel (x2, y2)
                const sourceY1 = (y / height) * 16 /* Constants.SAMPLED_CHAR_HEIGHT */;
                const sourceY2 = ((y + 1) / height) * 16 /* Constants.SAMPLED_CHAR_HEIGHT */;
                for (let x = 0; x < width; x++) {
                    const sourceX1 = (x / width) * 10 /* Constants.SAMPLED_CHAR_WIDTH */;
                    const sourceX2 = ((x + 1) / width) * 10 /* Constants.SAMPLED_CHAR_WIDTH */;
                    // 2. Sample all of them, summing them up and weighting them. Similar
                    // to bilinear interpolation.
                    let value = 0;
                    let samples = 0;
                    for (let sy = sourceY1; sy < sourceY2; sy++) {
                        const sourceRow = sourceOffset + Math.floor(sy) * 3840 /* Constants.RGBA_SAMPLED_ROW_WIDTH */;
                        const yBalance = 1 - (sy - Math.floor(sy));
                        for (let sx = sourceX1; sx < sourceX2; sx++) {
                            const xBalance = 1 - (sx - Math.floor(sx));
                            const sourceIndex = sourceRow + Math.floor(sx) * 4 /* Constants.RGBA_CHANNELS_CNT */;
                            const weight = xBalance * yBalance;
                            samples += weight;
                            value += ((source[sourceIndex] * source[sourceIndex + 3]) / 255) * weight;
                        }
                    }
                    const final = value / samples;
                    brightest = Math.max(brightest, final);
                    dest[targetIndex++] = (0, uint_1.toUint8)(final);
                }
            }
            return brightest;
        }
        static _downsample(data, scale) {
            const pixelsPerCharacter = 2 /* Constants.BASE_CHAR_HEIGHT */ * scale * 1 /* Constants.BASE_CHAR_WIDTH */ * scale;
            const resultLen = pixelsPerCharacter * 96 /* Constants.CHAR_COUNT */;
            const result = new Uint8ClampedArray(resultLen);
            let resultOffset = 0;
            let sourceOffset = 0;
            let brightest = 0;
            for (let charIndex = 0; charIndex < 96 /* Constants.CHAR_COUNT */; charIndex++) {
                brightest = Math.max(brightest, this._downsampleChar(data, sourceOffset, result, resultOffset, scale));
                resultOffset += pixelsPerCharacter;
                sourceOffset += 10 /* Constants.SAMPLED_CHAR_WIDTH */ * 4 /* Constants.RGBA_CHANNELS_CNT */;
            }
            if (brightest > 0) {
                const adjust = 255 / brightest;
                for (let i = 0; i < resultLen; i++) {
                    result[i] *= adjust;
                }
            }
            return result;
        }
    }
    exports.MinimapCharRendererFactory = MinimapCharRendererFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcENoYXJSZW5kZXJlckZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvbWluaW1hcC9taW5pbWFwQ2hhclJlbmRlcmVyRmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEc7Ozs7OztPQU1HO0lBQ0gsTUFBYSwwQkFBMEI7UUFJdEM7O1dBRUc7UUFDSSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQWEsRUFBRSxVQUFrQjtZQUNyRCxtRUFBbUU7WUFDbkUsMkVBQTJFO1lBQzNFLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksVUFBVSxLQUFLLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDaEcsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3pCLENBQUM7WUFFRCxJQUFJLE9BQTRCLENBQUM7WUFDakMsSUFBSSxrQ0FBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM3QixPQUFPLEdBQUcsSUFBSSx5Q0FBbUIsQ0FBQyxrQ0FBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLEdBQUcsMEJBQTBCLENBQUMsb0JBQW9CLENBQ3hELDBCQUEwQixDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksRUFDNUQsS0FBSyxDQUNMLENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxDQUFDLGNBQWMsR0FBRyxVQUFVLENBQUM7WUFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUM7WUFDM0IsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVE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