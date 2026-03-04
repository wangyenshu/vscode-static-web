define(["require", "exports", "vs/base/common/color"], function (require, exports, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeDefaultDocumentColors = computeDefaultDocumentColors;
    function _parseCaptureGroups(captureGroups) {
        const values = [];
        for (const captureGroup of captureGroups) {
            const parsedNumber = Number(captureGroup);
            if (parsedNumber || parsedNumber === 0 && captureGroup.replace(/\s/g, '') !== '') {
                values.push(parsedNumber);
            }
        }
        return values;
    }
    function _toIColor(r, g, b, a) {
        return {
            red: r / 255,
            blue: b / 255,
            green: g / 255,
            alpha: a
        };
    }
    function _findRange(model, match) {
        const index = match.index;
        const length = match[0].length;
        if (!index) {
            return;
        }
        const startPosition = model.positionAt(index);
        const range = {
            startLineNumber: startPosition.lineNumber,
            startColumn: startPosition.column,
            endLineNumber: startPosition.lineNumber,
            endColumn: startPosition.column + length
        };
        return range;
    }
    function _findHexColorInformation(range, hexValue) {
        if (!range) {
            return;
        }
        const parsedHexColor = color_1.Color.Format.CSS.parseHex(hexValue);
        if (!parsedHexColor) {
            return;
        }
        return {
            range: range,
            color: _toIColor(parsedHexColor.rgba.r, parsedHexColor.rgba.g, parsedHexColor.rgba.b, parsedHexColor.rgba.a)
        };
    }
    function _findRGBColorInformation(range, matches, isAlpha) {
        if (!range || matches.length !== 1) {
            return;
        }
        const match = matches[0];
        const captureGroups = match.values();
        const parsedRegex = _parseCaptureGroups(captureGroups);
        return {
            range: range,
            color: _toIColor(parsedRegex[0], parsedRegex[1], parsedRegex[2], isAlpha ? parsedRegex[3] : 1)
        };
    }
    function _findHSLColorInformation(range, matches, isAlpha) {
        if (!range || matches.length !== 1) {
            return;
        }
        const match = matches[0];
        const captureGroups = match.values();
        const parsedRegex = _parseCaptureGroups(captureGroups);
        const colorEquivalent = new color_1.Color(new color_1.HSLA(parsedRegex[0], parsedRegex[1] / 100, parsedRegex[2] / 100, isAlpha ? parsedRegex[3] : 1));
        return {
            range: range,
            color: _toIColor(colorEquivalent.rgba.r, colorEquivalent.rgba.g, colorEquivalent.rgba.b, colorEquivalent.rgba.a)
        };
    }
    function _findMatches(model, regex) {
        if (typeof model === 'string') {
            return [...model.matchAll(regex)];
        }
        else {
            return model.findMatches(regex);
        }
    }
    function computeColors(model) {
        const result = [];
        // Early validation for RGB and HSL
        const initialValidationRegex = /\b(rgb|rgba|hsl|hsla)(\([0-9\s,.\%]*\))|(#)([A-Fa-f0-9]{3})\b|(#)([A-Fa-f0-9]{4})\b|(#)([A-Fa-f0-9]{6})\b|(#)([A-Fa-f0-9]{8})\b/gm;
        const initialValidationMatches = _findMatches(model, initialValidationRegex);
        // Potential colors have been found, validate the parameters
        if (initialValidationMatches.length > 0) {
            for (const initialMatch of initialValidationMatches) {
                const initialCaptureGroups = initialMatch.filter(captureGroup => captureGroup !== undefined);
                const colorScheme = initialCaptureGroups[1];
                const colorParameters = initialCaptureGroups[2];
                if (!colorParameters) {
                    continue;
                }
                let colorInformation;
                if (colorScheme === 'rgb') {
                    const regexParameters = /^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*\)$/gm;
                    colorInformation = _findRGBColorInformation(_findRange(model, initialMatch), _findMatches(colorParameters, regexParameters), false);
                }
                else if (colorScheme === 'rgba') {
                    const regexParameters = /^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]|[01])\s*\)$/gm;
                    colorInformation = _findRGBColorInformation(_findRange(model, initialMatch), _findMatches(colorParameters, regexParameters), true);
                }
                else if (colorScheme === 'hsl') {
                    const regexParameters = /^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*\)$/gm;
                    colorInformation = _findHSLColorInformation(_findRange(model, initialMatch), _findMatches(colorParameters, regexParameters), false);
                }
                else if (colorScheme === 'hsla') {
                    const regexParameters = /^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]|[01])\s*\)$/gm;
                    colorInformation = _findHSLColorInformation(_findRange(model, initialMatch), _findMatches(colorParameters, regexParameters), true);
                }
                else if (colorScheme === '#') {
                    colorInformation = _findHexColorInformation(_findRange(model, initialMatch), colorScheme + colorParameters);
                }
                if (colorInformation) {
                    result.push(colorInformation);
                }
            }
        }
        return result;
    }
    /**
     * Returns an array of all default document colors in the provided document
     */
    function computeDefaultDocumentColors(model) {
        if (!model || typeof model.getValue !== 'function' || typeof model.positionAt !== 'function') {
            // Unknown caller!
            return [];
        }
        return computeColors(model);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdERvY3VtZW50Q29sb3JzQ29tcHV0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2xhbmd1YWdlcy9kZWZhdWx0RG9jdW1lbnRDb2xvcnNDb21wdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUE4SUEsb0VBTUM7SUFySUQsU0FBUyxtQkFBbUIsQ0FBQyxhQUF1QztRQUNuRSxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsS0FBSyxNQUFNLFlBQVksSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUMxQyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDMUMsSUFBSSxZQUFZLElBQUksWUFBWSxLQUFLLENBQUMsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztnQkFDbEYsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsU0FBUyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVM7UUFDNUQsT0FBTztZQUNOLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRztZQUNaLElBQUksRUFBRSxDQUFDLEdBQUcsR0FBRztZQUNiLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRztZQUNkLEtBQUssRUFBRSxDQUFDO1NBQ1IsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFTLFVBQVUsQ0FBQyxLQUFtQyxFQUFFLEtBQXVCO1FBQy9FLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDMUIsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxD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