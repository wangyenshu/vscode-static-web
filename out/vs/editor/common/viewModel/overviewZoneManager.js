/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverviewZoneManager = exports.OverviewRulerZone = exports.ColorZone = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["MINIMUM_HEIGHT"] = 4] = "MINIMUM_HEIGHT";
    })(Constants || (Constants = {}));
    class ColorZone {
        constructor(from, to, colorId) {
            this._colorZoneBrand = undefined;
            this.from = from | 0;
            this.to = to | 0;
            this.colorId = colorId | 0;
        }
        static compare(a, b) {
            if (a.colorId === b.colorId) {
                if (a.from === b.from) {
                    return a.to - b.to;
                }
                return a.from - b.from;
            }
            return a.colorId - b.colorId;
        }
    }
    exports.ColorZone = ColorZone;
    /**
     * A zone in the overview ruler
     */
    class OverviewRulerZone {
        constructor(startLineNumber, endLineNumber, heightInLines, color) {
            this._overviewRulerZoneBrand = undefined;
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
            this.heightInLines = heightInLines;
            this.color = color;
            this._colorZone = null;
        }
        static compare(a, b) {
            if (a.color === b.color) {
                if (a.startLineNumber === b.startLineNumber) {
                    if (a.heightInLines === b.heightInLines) {
                        return a.endLineNumber - b.endLineNumber;
                    }
                    return a.heightInLines - b.heightInLines;
                }
                return a.startLineNumber - b.startLineNumber;
            }
            return a.color < b.color ? -1 : 1;
        }
        setColorZone(colorZone) {
            this._colorZone = colorZone;
        }
        getColorZones() {
            return this._colorZone;
        }
    }
    exports.OverviewRulerZone = OverviewRulerZone;
    class OverviewZoneManager {
        constructor(getVerticalOffsetForLine) {
            this._getVerticalOffsetForLine = getVerticalOffsetForLine;
            this._zones = [];
            this._colorZonesInvalid = false;
            this._lineHeight = 0;
            this._domWidth = 0;
            this._domHeight = 0;
            this._outerHeight = 0;
            this._pixelRatio = 1;
            this._lastAssignedId = 0;
            this._color2Id = Object.create(null);
            this._id2Color = [];
        }
        getId2Color() {
            return this._id2Color;
        }
        setZones(newZones) {
            this._zones = newZones;
            this._zones.sort(OverviewRulerZone.compare);
        }
        setLineHeight(lineHeight) {
            if (this._lineHeight === lineHeight) {
                return false;
            }
            this._lineHeight = lineHeight;
            this._colorZonesInvalid = true;
            return true;
        }
        setPixelRatio(pixelRatio) {
            this._pixelRatio = pixelRatio;
            this._colorZonesInvalid = true;
        }
        getDOMWidth() {
            return this._domWidth;
        }
        getCanvasWidth() {
            return this._domWidth * this._pixelRatio;
        }
        setDOMWidth(width) {
            if (this._domWidth === width) {
                return false;
            }
            this._domWidth = width;
            this._colorZonesInvalid = true;
            return true;
        }
        getDOMHeight() {
            return this._domHeight;
        }
        getCanvasHeight() {
            return this._domHeight * this._pixelRatio;
        }
        setDOMHeight(height) {
            if (this._domHeight === height) {
                return false;
            }
            this._domHeight = height;
            this._colorZonesInvalid = true;
            return true;
        }
        getOuterHeight() {
            return this._outerHeight;
        }
        setOuterHeight(outerHeight) {
            if (this._outerHeight === outerHeight) {
                return false;
            }
            this._outerHeight = outerHeight;
            this._colorZonesInvalid = true;
            return true;
        }
        resolveColorZones() {
            const colorZonesInvalid = this._colorZonesInvalid;
            const lineHeight = Math.floor(this._lineHeight);
            const totalHeight = Math.floor(this.getCanvasHeight());
            const outerHeight = Math.floor(this._outerHeight);
            const heightRatio = totalHeight / outerHeight;
            const halfMinimumHeight = Math.floor(4 /* Constants.MINIMUM_HEIGHT */ * this._pixelRatio / 2);
            const allColorZones = [];
            for (let i = 0, len = this._zones.length; i < len; i++) {
                const zone = this._zones[i];
                if (!colorZonesInvalid) {
                    const colorZone = zone.getColorZones();
                    if (colorZone) {
                        allColorZones.push(colorZone);
                        continue;
                    }
                }
                const offset1 = this._getVerticalOffsetForLine(zone.startLineNumber);
                const offset2 = (zone.heightInLines === 0
                    ? this._getVerticalOffsetForLine(zone.endLineNumber) + lineHeight
                    : offset1 + zone.heightInLines * lineHeight);
                const y1 = Math.floor(heightRatio * offset1);
                const y2 = Math.floor(heightRatio * offset2);
                let ycenter = Math.floor((y1 + y2) / 2);
                let halfHeight = (y2 - ycenter);
                if (halfHeight < halfMinimumHeight) {
                    halfHeight = halfMinimumHeight;
                }
                if (ycenter - halfHeight < 0) {
                    ycenter = halfHeight;
                }
                if (ycenter + halfHeight > totalHeight) {
                    ycenter = totalHeight - halfHeight;
                }
                const color = zone.color;
                let colorId = this._color2Id[color];
                if (!colorId) {
                    colorId = (++this._lastAssignedId);
                    this._color2Id[color] = colorId;
                    this._id2Color[colorId] = color;
                }
                const colorZone = new ColorZone(ycenter - halfHeight, ycenter + halfHeight, colorId);
                zone.setColorZone(colorZone);
                allColorZones.push(colorZone);
            }
            this._colorZonesInvalid = false;
            allColorZones.sort(ColorZone.compare);
            return allColorZones;
        }
    }
    exports.OverviewZoneManager = OverviewZoneManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcnZpZXdab25lTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld01vZGVsL292ZXJ2aWV3Wm9uZU1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHLElBQVcsU0FFVjtJQUZELFdBQVcsU0FBUztRQUNuQiw2REFBa0IsQ0FBQTtJQUNuQixDQUFDLEVBRlUsU0FBUyxLQUFULFNBQVMsUUFFbkI7SUFFRCxNQUFhLFNBQVM7UUFPckIsWUFBWSxJQUFZLEVBQUUsRUFBVSxFQUFFLE9BQWU7WUFOckQsb0JBQWUsR0FBUyxTQUFTLENBQUM7WUFPakMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVNLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBWSxFQUFFLENBQVk7WUFDL0MsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BCLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDeEIsQ0FBQztZQUNELE9BQU8sQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQzlCLENBQUM7S0FDRDtJQXRCRCw4QkFzQkM7SUFF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