/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/pixelRatio", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/config/charWidthReader", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo"], function (require, exports, dom_1, pixelRatio_1, event_1, lifecycle_1, charWidthReader_1, editorOptions_1, fontInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FontMeasurements = exports.FontMeasurementsImpl = void 0;
    class FontMeasurementsImpl extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._cache = new Map();
            this._evictUntrustedReadingsTimeout = -1;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            if (this._evictUntrustedReadingsTimeout !== -1) {
                clearTimeout(this._evictUntrustedReadingsTimeout);
                this._evictUntrustedReadingsTimeout = -1;
            }
            super.dispose();
        }
        /**
         * Clear all cached font information and trigger a change event.
         */
        clearAllFontInfos() {
            this._cache.clear();
            this._onDidChange.fire();
        }
        _ensureCache(targetWindow) {
            const windowId = (0, dom_1.getWindowId)(targetWindow);
            let cache = this._cache.get(windowId);
            if (!cache) {
                cache = new FontMeasurementsCache();
                this._cache.set(windowId, cache);
            }
            return cache;
        }
        _writeToCache(targetWindow, item, value) {
            const cache = this._ensureCache(targetWindow);
            cache.put(item, value);
            if (!value.isTrusted && this._evictUntrustedReadingsTimeout === -1) {
                // Try reading again after some time
                this._evictUntrustedReadingsTimeout = targetWindow.setTimeout(() => {
                    this._evictUntrustedReadingsTimeout = -1;
                    this._evictUntrustedReadings(targetWindow);
                }, 5000);
            }
        }
        _evictUntrustedReadings(targetWindow) {
            const cache = this._ensureCache(targetWindow);
            const values = cache.getValues();
            let somethingRemoved = false;
            for (const item of values) {
                if (!item.isTrusted) {
                    somethingRemoved = true;
                    cache.remove(item);
                }
            }
            if (somethingRemoved) {
                this._onDidChange.fire();
            }
        }
        /**
         * Serialized currently cached font information.
         */
        serializeFontInfo(targetWindow) {
            // Only save trusted font info (that has been measured in this running instance)
            const cache = this._ensureCache(targetWindow);
            return cache.getValues().filter(item => item.isTrusted);
        }
        /**
         * Restore previously serialized font informations.
         */
        restoreFontInfo(targetWindow, savedFontInfos) {
            // Take all the saved font info and insert them in the cache without the trusted flag.
            // The reason for this is that a font might have been installed on the OS in the meantime.
            for (const savedFontInfo of savedFontInfos) {
                if (savedFontInfo.version !== fontInfo_1.SERIALIZED_FONT_INFO_VERSION) {
                    // cannot use older version
                    continue;
                }
                const fontInfo = new fontInfo_1.FontInfo(savedFontInfo, false);
                this._writeToCache(targetWindow, fontInfo, fontInfo);
            }
        }
        /**
         * Read font information.
         */
        readFontInfo(targetWindow, bareFontInfo) {
            const cache = this._ensureCache(targetWindow);
            if (!cache.has(bareFontInfo)) {
                let readConfig = this._actualReadFontInfo(targetWindow, bareFontInfo);
                if (readConfig.typicalHalfwidthCharacterWidth <= 2 || readConfig.typicalFullwidthCharacterWidth <= 2 || readConfig.spaceWidth <= 2 || readConfig.maxDigitWidth <= 2) {
                    // Hey, it's Bug 14341 ... we couldn't read
                    readConfig = new fontInfo_1.FontInfo({
                        pixelRatio: pixelRatio_1.PixelRatio.getInstance(targetWindow).value,
                        fontFamily: readConfig.fontFamily,
                        fontWeight: readConfig.fontWeight,
                        fontSize: readConfig.fontSize,
                        fontFeatureSettings: readConfig.fontFeatureSettings,
                        fontVariationSettings: readConfig.fontVariationSettings,
                        lineHeight: readConfig.lineHeight,
                        letterSpacing: readConfig.letterSpacing,
                        isMonospace: readConfig.isMonospace,
                        typicalHalfwidthCharacterWidth: Math.max(readConfig.typicalHalfwidthCharacterWidth, 5),
                        typicalFullwidthCharacterWidth: Math.max(readConfig.typicalFullwidthCharacterWidth, 5),
                        canUseHalfwidthRightwardsArrow: readConfig.canUseHalfwidthRightwardsArrow,
                        spaceWidth: Math.max(readConfig.spaceWidth, 5),
                        middotWidth: Math.max(readConfig.middotWidth, 5),
                        wsmiddotWidth: Math.max(readConfig.wsmiddotWidth, 5),
                        maxDigitWidth: Math.max(readConfig.maxDigitWidth, 5),
                    }, false);
                }
                this._writeToCache(targetWindow, bareFontInfo, readConfig);
            }
            return cache.get(bareFontInfo);
        }
        _createRequest(chr, type, all, monospace) {
            const result = new charWidthReader_1.CharWidthRequest(chr, type);
            all.push(result);
            monospace?.push(result);
            return result;
        }
        _actualReadFontInfo(targetWindow, bareFontInfo) {
            const all = [];
            const monospace = [];
            const typicalHalfwidthCharacter = this._createRequest('n', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const typicalFullwidthCharacter = this._createRequest('\uff4d', 0 /* CharWidthRequestType.Regular */, all, null);
            const space = this._createRequest(' ', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit0 = this._createRequest('0', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit1 = this._createRequest('1', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit2 = this._createRequest('2', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit3 = this._createRequest('3', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit4 = this._createRequest('4', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit5 = this._createRequest('5', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit6 = this._createRequest('6', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit7 = this._createRequest('7', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit8 = this._createRequest('8', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit9 = this._createRequest('9', 0 /* CharWidthRequestType.Regular */, all, monospace);
            // monospace test: used for whitespace rendering
            const rightwardsArrow = this._createRequest('→', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const halfwidthRightwardsArrow = this._createRequest('￫', 0 /* CharWidthRequestType.Regular */, all, null);
            // U+00B7 - MIDDLE DOT
            const middot = this._createRequest('·', 0 /* CharWidthRequestType.Regular */, all, monospace);
            // U+2E31 - WORD SEPARATOR MIDDLE DOT
            const wsmiddotWidth = this._createRequest(String.fromCharCode(0x2E31), 0 /* CharWidthRequestType.Regular */, all, null);
            // monospace test: some characters
            const monospaceTestChars = '|/-_ilm%';
            for (let i = 0, len = monospaceTestChars.length; i < len; i++) {
                this._createRequest(monospaceTestChars.charAt(i), 0 /* CharWidthRequestType.Regular */, all, monospace);
                this._createRequest(monospaceTestChars.charAt(i), 1 /* CharWidthRequestType.Italic */, all, monospace);
                this._createRequest(monospaceTestChars.charAt(i), 2 /* CharWidthRequestType.Bold */, all, monospace);
            }
            (0, charWidthReader_1.readCharWidths)(targetWindow, bareFontInfo, all);
            const maxDigitWidth = Math.max(digit0.width, digit1.width, digit2.width, digit3.width, digit4.width, digit5.width, digit6.width, digit7.width, digit8.width, digit9.width);
            let isMonospace = (bareFontInfo.fontFeatureSettings === editorOptions_1.EditorFontLigatures.OFF);
            const referenceWidth = monospace[0].width;
            for (let i = 1, len = monospace.length; isMonospace && i < len; i++) {
                const diff = referenceWidth - monospace[i].width;
                if (diff < -0.001 || diff > 0.001) {
                    isMonospace = false;
                    break;
                }
            }
            let canUseHalfwidthRightwardsArrow = true;
            if (isMonospace && halfwidthRightwardsArrow.width !== referenceWidth) {
                // using a halfwidth rightwards arrow would break monospace...
                canUseHalfwidthRightwardsArrow = false;
            }
            if (halfwidthRightwardsArrow.width > rightwardsArrow.width) {
                // using a halfwidth rightwards arrow would paint a larger arrow than a regular rightwards arrow
                canUseHalfwidthRightwardsArrow = false;
            }
            return new fontInfo_1.FontInfo({
                pixelRatio: pixelRatio_1.PixelRatio.getInstance(targetWindow).value,
                fontFamily: bareFontInfo.fontFamily,
                fontWeight: bareFontInfo.fontWeight,
                fontSize: bareFontInfo.fontSize,
                fontFeatureSettings: bareFontInfo.fontFeatureSettings,
                fontVariationSettings: bareFontInfo.fontVariationSettings,
                lineHeight: bareFontInfo.lineHeight,
                letterSpacing: bareFontInfo.letterSpacing,
                isMonospace: isMonospace,
                typicalHalfwidthCharacterWidth: typicalHalfwidthCharacter.width,
                typicalFullwidthCharacterWidth: typicalFullwidthCharacter.width,
                canUseHalfwidthRightwardsArrow: canUseHalfwidthRightwardsArrow,
                spaceWidth: space.width,
                middotWidth: middot.width,
                wsmiddotWidth: wsmiddotWidth.width,
                maxDigitWidth: maxDigitWidth
            }, true);
        }
    }
    exports.FontMeasurementsImpl = FontMeasurementsImpl;
    class FontMeasurementsCache {
        constructor() {
            this._keys = Object.create(null);
            this._values = Object.create(null);
        }
        has(item) {
            const itemId = item.getId();
            return !!this._values[itemId];
        }
        get(item) {
            const itemId = item.getId();
            return this._values[itemId];
        }
        put(item, value) {
            const itemId = item.getId();
            this._keys[itemId] = item;
            this._values[itemId] = value;
        }
        remove(item) {
            const itemId = item.getId();
            delete this._keys[itemId];
            delete this._values[itemId];
        }
        getValues() {
            return Object.keys(this._keys).map(id => this._values[id]);
        }
    }
    exports.FontMeasurements = new FontMeasurementsImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9udE1lYXN1cmVtZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbmZpZy9mb250TWVhc3VyZW1lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlDaEcsTUFBYSxvQkFBcUIsU0FBUSxzQkFBVTtRQUFwRDs7WUFFa0IsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1lBRTNELG1DQUE4QixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTNCLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDcEQsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQTBNdkQsQ0FBQztRQXhNZ0IsT0FBTztZQUN0QixJQUFJLElBQUksQ0FBQyw4QkFBOEIsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxZQUFZLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7Z0JBQ2xELElBQUksQ0FBQyw4QkFBOEIsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFRDs7V0FFRztRQUNJLGlCQUFpQjtZQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLFlBQVksQ0FBQyxZQUFvQjtZQUN4QyxNQUFNLFFBQVEsR0FBRyxJQUFBLGlCQUFXLEVBQUMsWUFBWSxDQUFDLENBQUM7WUFDM0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFD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