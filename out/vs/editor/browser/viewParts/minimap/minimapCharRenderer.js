/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./minimapCharSheet", "vs/base/common/uint"], function (require, exports, minimapCharSheet_1, uint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinimapCharRenderer = void 0;
    class MinimapCharRenderer {
        constructor(charData, scale) {
            this.scale = scale;
            this._minimapCharRendererBrand = undefined;
            this.charDataNormal = MinimapCharRenderer.soften(charData, 12 / 15);
            this.charDataLight = MinimapCharRenderer.soften(charData, 50 / 60);
        }
        static soften(input, ratio) {
            const result = new Uint8ClampedArray(input.length);
            for (let i = 0, len = input.length; i < len; i++) {
                result[i] = (0, uint_1.toUint8)(input[i] * ratio);
            }
            return result;
        }
        renderChar(target, dx, dy, chCode, color, foregroundAlpha, backgroundColor, backgroundAlpha, fontScale, useLighterFont, force1pxHeight) {
            const charWidth = 1 /* Constants.BASE_CHAR_WIDTH */ * this.scale;
            const charHeight = 2 /* Constants.BASE_CHAR_HEIGHT */ * this.scale;
            const renderHeight = (force1pxHeight ? 1 : charHeight);
            if (dx + charWidth > target.width || dy + renderHeight > target.height) {
                console.warn('bad render request outside image data');
                return;
            }
            const charData = useLighterFont ? this.charDataLight : this.charDataNormal;
            const charIndex = (0, minimapCharSheet_1.getCharIndex)(chCode, fontScale);
            const destWidth = target.width * 4 /* Constants.RGBA_CHANNELS_CNT */;
            const backgroundR = backgroundColor.r;
            const backgroundG = backgroundColor.g;
            const backgroundB = backgroundColor.b;
            const deltaR = color.r - backgroundR;
            const deltaG = color.g - backgroundG;
            const deltaB = color.b - backgroundB;
            const destAlpha = Math.max(foregroundAlpha, backgroundAlpha);
            const dest = target.data;
            let sourceOffset = charIndex * charWidth * charHeight;
            let row = dy * destWidth + dx * 4 /* Constants.RGBA_CHANNELS_CNT */;
            for (let y = 0; y < renderHeight; y++) {
                let column = row;
                for (let x = 0; x < charWidth; x++) {
                    const c = (charData[sourceOffset++] / 255) * (foregroundAlpha / 255);
                    dest[column++] = backgroundR + deltaR * c;
                    dest[column++] = backgroundG + deltaG * c;
                    dest[column++] = backgroundB + deltaB * c;
                    dest[column++] = destAlpha;
                }
                row += destWidth;
            }
        }
        blockRenderChar(target, dx, dy, color, foregroundAlpha, backgroundColor, backgroundAlpha, force1pxHeight) {
            const charWidth = 1 /* Constants.BASE_CHAR_WIDTH */ * this.scale;
            const charHeight = 2 /* Constants.BASE_CHAR_HEIGHT */ * this.scale;
            const renderHeight = (force1pxHeight ? 1 : charHeight);
            if (dx + charWidth > target.width || dy + renderHeight > target.height) {
                console.warn('bad render request outside image data');
                return;
            }
            const destWidth = target.width * 4 /* Constants.RGBA_CHANNELS_CNT */;
            const c = 0.5 * (foregroundAlpha / 255);
            const backgroundR = backgroundColor.r;
            const backgroundG = backgroundColor.g;
            const backgroundB = backgroundColor.b;
            const deltaR = color.r - backgroundR;
            const deltaG = color.g - backgroundG;
            const deltaB = color.b - backgroundB;
            const colorR = backgroundR + deltaR * c;
            const colorG = backgroundG + deltaG * c;
            const colorB = backgroundB + deltaB * c;
            const destAlpha = Math.max(foregroundAlpha, backgroundAlpha);
            const dest = target.data;
            let row = dy * destWidth + dx * 4 /* Constants.RGBA_CHANNELS_CNT */;
            for (let y = 0; y < renderHeight; y++) {
                let column = row;
                for (let x = 0; x < charWidth; x++) {
                    dest[column++] = colorR;
                    dest[column++] = colorG;
                    dest[column++] = colorB;
                    dest[column++] = destAlpha;
                }
                row += destWidth;
            }
        }
    }
    exports.MinimapCharRenderer = MinimapCharRenderer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcENoYXJSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9taW5pbWFwL21pbmltYXBDaGFyUmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsbUJBQW1CO1FBTS9CLFlBQVksUUFBMkIsRUFBa0IsS0FBYTtZQUFiLFVBQUssR0FBTCxLQUFLLENBQVE7WUFMdEUsOEJBQXlCLEdBQVMsU0FBUyxDQUFDO1lBTTNDLElBQUksQ0FBQyxjQUFjLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUF3QixFQUFFLEtBQWE7WUFDNUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBQSxjQUFPLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTSxVQUFVLENBQ2hCLE1BQWlCLEVBQ2pCLEVBQVUsRUFDVixFQUFVLEVBQ1YsTUFB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