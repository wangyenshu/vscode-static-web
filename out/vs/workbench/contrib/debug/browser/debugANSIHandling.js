/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/workbench/contrib/terminal/common/terminalColorRegistry"], function (require, exports, color_1, terminalColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.handleANSIOutput = handleANSIOutput;
    exports.appendStylizedStringToContainer = appendStylizedStringToContainer;
    exports.calcANSI8bitColor = calcANSI8bitColor;
    /**
     * @param text The content to stylize.
     * @returns An {@link HTMLSpanElement} that contains the potentially stylized text.
     */
    function handleANSIOutput(text, linkDetector, themeService, workspaceFolder) {
        const root = document.createElement('span');
        const textLength = text.length;
        let styleNames = [];
        let customFgColor;
        let customBgColor;
        let customUnderlineColor;
        let colorsInverted = false;
        let currentPos = 0;
        let buffer = '';
        while (currentPos < textLength) {
            let sequenceFound = false;
            // Potentially an ANSI escape sequence.
            // See http://ascii-table.com/ansi-escape-sequences.php & https://en.wikipedia.org/wiki/ANSI_escape_code
            if (text.charCodeAt(currentPos) === 27 && text.charAt(currentPos + 1) === '[') {
                const startPos = currentPos;
                currentPos += 2; // Ignore 'Esc[' as it's in every sequence.
                let ansiSequence = '';
                while (currentPos < textLength) {
                    const char = text.charAt(currentPos);
                    ansiSequence += char;
                    currentPos++;
                    // Look for a known sequence terminating character.
                    if (char.match(/^[ABCDHIJKfhmpsu]$/)) {
                        sequenceFound = true;
                        break;
                    }
                }
                if (sequenceFound) {
                    // Flush buffer with previous styles.
                    appendStylizedStringToContainer(root, buffer, styleNames, linkDetector, workspaceFolder, customFgColor, customBgColor, customUnderlineColor);
                    buffer = '';
                    /*
                     * Certain ranges that are matched here do not contain real graphics rendition sequences. For
                     * the sake of having a simpler expression, they have been included anyway.
                     */
                    if (ansiSequence.match(/^(?:[34][0-8]|9[0-7]|10[0-7]|[0-9]|2[1-5,7-9]|[34]9|5[8,9]|1[0-9])(?:;[349][0-7]|10[0-7]|[013]|[245]|[34]9)?(?:;[012]?[0-9]?[0-9])*;?m$/)) {
                        const styleCodes = ansiSequence.slice(0, -1) // Remove final 'm' character.
                            .split(';') // Separate style codes.
                            .filter(elem => elem !== '') // Filter empty elems as '34;m' -> ['34', ''].
                            .map(elem => parseInt(elem, 10)); // Convert to numbers.
                        if (styleCodes[0] === 38 || styleCodes[0] === 48 || styleCodes[0] === 58) {
                            // Advanced color code - can't be combined with formatting codes like simple colors can
                            // Ignores invalid colors and additional info beyond what is necessary
                            const colorType = (styleCodes[0] === 38) ? 'foreground' : ((styleCodes[0] === 48) ? 'background' : 'underline');
                            if (styleCodes[1] === 5) {
                                set8BitColor(styleCodes, colorType);
                            }
                            else if (styleCodes[1] === 2) {
                                set24BitColor(styleCodes, colorType);
                            }
                        }
                        else {
                            setBasicFormatters(styleCodes);
                        }
                    }
                    else {
                        // Unsupported sequence so simply hide it.
                    }
                }
                else {
                    currentPos = startPos;
                }
            }
            if (sequenceFound === false) {
                buffer += text.charAt(currentPos);
                currentPos++;
            }
        }
        // Flush remaining text buffer if not empty.
        if (buffer) {
            appendStylizedStringToContainer(root, buffer, styleNames, linkDetector, workspaceFolder, customFgColor, customBgColor, customUnderlineColor);
        }
        return root;
        /**
         * Change the foreground or background color by clearing the current color
         * and adding the new one.
         * @param colorType If `'foreground'`, will change the foreground color, if
         * 	`'background'`, will change the background color, and if `'underline'`
         * will set the underline color.
         * @param color Color to change to. If `undefined` or not provided,
         * will clear current color without adding a new one.
         */
        function changeColor(colorType, color) {
            if (colorType === 'foreground') {
                customFgColor = color;
            }
            else if (colorType === 'background') {
                customBgColor = color;
            }
            else if (colorType === 'underline') {
                customUnderlineColor = color;
            }
            styleNames = styleNames.filter(style => style !== `code-${colorType}-colored`);
            if (color !== undefined) {
                styleNames.push(`code-${colorType}-colored`);
            }
        }
        /**
         * Swap foreground and background colors.  Used for color inversion.  Caller should check
         * [] flag to make sure it is appropriate to turn ON or OFF (if it is already inverted don't call
         */
        function reverseForegroundAndBackgroundColors() {
            const oldFgColor = customFgColor;
            changeColor('foreground', customBgColor);
            changeColor('background', oldFgColor);
        }
        /**
         * Calculate and set basic ANSI formatting. Supports ON/OFF of bold, italic, underline,
         * double underline,  crossed-out/strikethrough, overline, dim, blink, rapid blink,
         * reverse/invert video, hidden, superscript, subscript and alternate font codes,
         * clearing/resetting of foreground, background and underline colors,
         * setting normal foreground and background colors, and bright foreground and
         * background colors. Not to be used for codes containing advanced colors.
         * Will ignore invalid codes.
         * @param styleCodes Array of ANSI basic styling numbers, which will be
         * applied in order. New colors and backgrounds clear old ones; new formatting
         * does not.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#SGR }
         */
        function setBasicFormatters(styleCodes) {
            for (const code of styleCodes) {
                switch (code) {
                    case 0: { // reset (everything)
                        styleNames = [];
                        customFgColor = undefined;
                        customBgColor = undefined;
                        break;
                    }
                    case 1: { // bold
                        styleNames = styleNames.filter(style => style !== `code-bold`);
                        styleNames.push('code-bold');
                        break;
                    }
                    case 2: { // dim
                        styleNames = styleNames.filter(style => style !== `code-dim`);
                        styleNames.push('code-dim');
                        break;
                    }
                    case 3: { // italic
                        styleNames = styleNames.filter(style => style !== `code-italic`);
                        styleNames.push('code-italic');
                        break;
                    }
                    case 4: { // underline
                        styleNames = styleNames.filter(style => (style !== `code-underline` && style !== `code-double-underline`));
                        styleNames.push('code-underline');
                        break;
                    }
                    case 5: { // blink
                        styleNames = styleNames.filter(style => style !== `code-blink`);
                        styleNames.push('code-blink');
                        break;
                    }
                    case 6: { // rapid blink
                        styleNames = styleNames.filter(style => style !== `code-rapid-blink`);
                        styleNames.push('code-rapid-blink');
                        break;
                    }
                    case 7: { // invert foreground and background
                        if (!colorsInverted) {
                            colorsInverted = true;
                            reverseForegroundAndBackgroundColors();
                        }
                        break;
                    }
                    case 8: { // hidden
                        styleNames = styleNames.filter(style => style !== `code-hidden`);
                        styleNames.push('code-hidden');
                        break;
                    }
                    case 9: { // strike-through/crossed-out
                        styleNames = styleNames.filter(style => style !== `code-strike-through`);
                        styleNames.push('code-strike-through');
                        break;
                    }
                    case 10: { // normal default font
                        styleNames = styleNames.filter(style => !style.startsWith('code-font'));
                        break;
                    }
                    case 11:
                    case 12:
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                    case 17:
                    case 18:
                    case 19:
                    case 20: { // font codes (and 20 is 'blackletter' font code)
                        styleNames = styleNames.filter(style => !style.startsWith('code-font'));
                        styleNames.push(`code-font-${code - 10}`);
                        break;
                    }
                    case 21: { // double underline
                        styleNames = styleNames.filter(style => (style !== `code-underline` && style !== `code-double-underline`));
                        styleNames.push('code-double-underline');
                        break;
                    }
                    case 22: { // normal intensity (bold off and dim off)
                        styleNames = styleNames.filter(style => (style !== `code-bold` && style !== `code-dim`));
                        break;
                    }
                    case 23: { // Neither italic or blackletter (font 10)
                        styleNames = styleNames.filter(style => (style !== `code-italic` && style !== `code-font-10`));
                        break;
                    }
                    case 24: { // not underlined (Neither singly nor doubly underlined)
                        styleNames = styleNames.filter(style => (style !== `code-underline` && style !== `code-double-underline`));
                        break;
                    }
                    case 25: { // not blinking
                        styleNames = styleNames.filter(style => (style !== `code-blink` && style !== `code-rapid-blink`));
                        break;
                    }
                    case 27: { // not reversed/inverted
                        if (colorsInverted) {
                            colorsInverted = false;
                            reverseForegroundAndBackgroundColors();
                        }
                        break;
                    }
                    case 28: { // not hidden (reveal)
                        styleNames = styleNames.filter(style => style !== `code-hidden`);
                        break;
                    }
                    case 29: { // not crossed-out
                        styleNames = styleNames.filter(style => style !== `code-strike-through`);
                        break;
                    }
                    case 53: { // overlined
                        styleNames = styleNames.filter(style => style !== `code-overline`);
                        styleNames.push('code-overline');
                        break;
                    }
                    case 55: { // not overlined
                        styleNames = styleNames.filter(style => style !== `code-overline`);
                        break;
                    }
                    case 39: { // default foreground color
                        changeColor('foreground', undefined);
                        break;
                    }
                    case 49: { // default background color
                        changeColor('background', undefined);
                        break;
                    }
                    case 59: { // default underline color
                        changeColor('underline', undefined);
                        break;
                    }
                    case 73: { // superscript
                        styleNames = styleNames.filter(style => (style !== `code-superscript` && style !== `code-subscript`));
                        styleNames.push('code-superscript');
                        break;
                    }
                    case 74: { // subscript
                        styleNames = styleNames.filter(style => (style !== `code-superscript` && style !== `code-subscript`));
                        styleNames.push('code-subscript');
                        break;
                    }
                    case 75: { // neither superscript or subscript
                        styleNames = styleNames.filter(style => (style !== `code-superscript` && style !== `code-subscript`));
                        break;
                    }
                    default: {
                        setBasicColor(code);
                        break;
                    }
                }
            }
        }
        /**
         * Calculate and set styling for complicated 24-bit ANSI color codes.
         * @param styleCodes Full list of integer codes that make up the full ANSI
         * sequence, including the two defining codes and the three RGB codes.
         * @param colorType If `'foreground'`, will set foreground color, if
         * `'background'`, will set background color, and if it is `'underline'`
         * will set the underline color.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#24-bit }
         */
        function set24BitColor(styleCodes, colorType) {
            if (styleCodes.length >= 5 &&
                styleCodes[2] >= 0 && styleCodes[2] <= 255 &&
                styleCodes[3] >= 0 && styleCodes[3] <= 255 &&
                styleCodes[4] >= 0 && styleCodes[4] <= 255) {
                const customColor = new color_1.RGBA(styleCodes[2], styleCodes[3], styleCodes[4]);
                changeColor(colorType, customColor);
            }
        }
        /**
         * Calculate and set styling for advanced 8-bit ANSI color codes.
         * @param styleCodes Full list of integer codes that make up the ANSI
         * sequence, including the two defining codes and the one color code.
         * @param colorType If `'foreground'`, will set foreground color, if
         * `'background'`, will set background color and if it is `'underline'`
         * will set the underline color.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit }
         */
        function set8BitColor(styleCodes, colorType) {
            let colorNumber = styleCodes[2];
            const color = calcANSI8bitColor(colorNumber);
            if (color) {
                changeColor(colorType, color);
            }
            else if (colorNumber >= 0 && colorNumber <= 15) {
                if (colorType === 'underline') {
                    // for underline colors we just decode the 0-15 color number to theme color, set and return
                    const theme = themeService.getColorTheme();
                    const colorName = terminalColorRegistry_1.ansiColorIdentifiers[colorNumber];
                    const color = theme.getColor(colorName);
                    if (color) {
                        changeColor(colorType, color.rgba);
                    }
                    return;
                }
                // Need to map to one of the four basic color ranges (30-37, 90-97, 40-47, 100-107)
                colorNumber += 30;
                if (colorNumber >= 38) {
                    // Bright colors
                    colorNumber += 52;
                }
                if (colorType === 'background') {
                    colorNumber += 10;
                }
                setBasicColor(colorNumber);
            }
        }
        /**
         * Calculate and set styling for basic bright and dark ANSI color codes. Uses
         * theme colors if available. Automatically distinguishes between foreground
         * and background colors; does not support color-clearing codes 39 and 49.
         * @param styleCode Integer color code on one of the following ranges:
         * [30-37, 90-97, 40-47, 100-107]. If not on one of these ranges, will do
         * nothing.
         */
        function setBasicColor(styleCode) {
            const theme = themeService.getColorTheme();
            let colorType;
            let colorIndex;
            if (styleCode >= 30 && styleCode <= 37) {
                colorIndex = styleCode - 30;
                colorType = 'foreground';
            }
            else if (styleCode >= 90 && styleCode <= 97) {
                colorIndex = (styleCode - 90) + 8; // High-intensity (bright)
                colorType = 'foreground';
            }
            else if (styleCode >= 40 && styleCode <= 47) {
                colorIndex = styleCode - 40;
                colorType = 'background';
            }
            else if (styleCode >= 100 && styleCode <= 107) {
                colorIndex = (styleCode - 100) + 8; // High-intensity (bright)
                colorType = 'background';
            }
            if (colorIndex !== undefined && colorType) {
                const colorName = terminalColorRegistry_1.ansiColorIdentifiers[colorIndex];
                const color = theme.getColor(colorName);
                if (color) {
                    changeColor(colorType, color.rgba);
                }
            }
        }
    }
    /**
     * @param root The {@link HTMLElement} to append the content to.
     * @param stringContent The text content to be appended.
     * @param cssClasses The list of CSS styles to apply to the text content.
     * @param linkDetector The {@link LinkDetector} responsible for generating links from {@param stringContent}.
     * @param customTextColor If provided, will apply custom color with inline style.
     * @param customBackgroundColor If provided, will apply custom backgroundColor with inline style.
     * @param customUnderlineColor If provided, will apply custom textDecorationColor with inline style.
     */
    function appendStylizedStringToContainer(root, stringContent, cssClasses, linkDetector, workspaceFolder, customTextColor, customBackgroundColor, customUnderlineColor) {
        if (!root || !stringContent) {
            return;
        }
        const container = linkDetector.linkify(stringContent, true, workspaceFolder);
        container.className = cssClasses.join(' ');
        if (customTextColor) {
            container.style.color =
                color_1.Color.Format.CSS.formatRGB(new color_1.Color(customTextColor));
        }
        if (customBackgroundColor) {
            container.style.backgroundColor =
                color_1.Color.Format.CSS.formatRGB(new color_1.Color(customBackgroundColor));
        }
        if (customUnderlineColor) {
            container.style.textDecorationColor =
                color_1.Color.Format.CSS.formatRGB(new color_1.Color(customUnderlineColor));
        }
        root.appendChild(container);
    }
    /**
     * Calculate the color from the color set defined in the ANSI 8-bit standard.
     * Standard and high intensity colors are not defined in the standard as specific
     * colors, so these and invalid colors return `undefined`.
     * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit } for info.
     * @param colorNumber The number (ranging from 16 to 255) referring to the color
     * desired.
     */
    function calcANSI8bitColor(colorNumber) {
        if (colorNumber % 1 !== 0) {
            // Should be integer
            return;
        }
        if (colorNumber >= 16 && colorNumber <= 231) {
            // Converts to one of 216 RGB colors
            colorNumber -= 16;
            let blue = colorNumber % 6;
            colorNumber = (colorNumber - blue) / 6;
            let green = colorNumber % 6;
            colorNumber = (colorNumber - green) / 6;
            let red = colorNumber;
            // red, green, blue now range on [0, 5], need to map to [0,255]
            const convFactor = 255 / 5;
            blue = Math.round(blue * convFactor);
            green = Math.round(green * convFactor);
            red = Math.round(red * convFactor);
            return new color_1.RGBA(red, green, blue);
        }
        else if (colorNumber >= 232 && colorNumber <= 255) {
            // Converts to a grayscale value
            colorNumber -= 232;
            const colorLevel = Math.round(colorNumber / 23 * 255);
            return new color_1.RGBA(colorLevel, colorLevel, colorLevel);
        }
        else {
            return;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdBTlNJSGFuZGxpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnQU5TSUhhbmRsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLDRDQXlYQztJQVdELDBFQThCQztJQVVELDhDQTZCQztJQTdjRDs7O09BR0c7SUFDSCxTQUFnQixnQkFBZ0IsQ0FBQyxJQUFZLEVBQUUsWUFBMEIsRUFBRSxZQUEyQixFQUFFLGVBQTZDO1FBRXBKLE1BQU0sSUFBSSxHQUFvQixRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdELE1BQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFdkMsSUFBSSxVQUFVLEdBQWEsRUFBRSxDQUFDO1FBQzlCLElBQUksYUFBK0IsQ0FBQztRQUNwQyxJQUFJLGFBQStCLENBQUM7UUFDcEMsSUFBSSxvQkFBc0MsQ0FBQztRQUMzQyxJQUFJLGNBQWMsR0FBWSxLQUFLLENBQUM7UUFDcEMsSUFBSSxVQUFVLEdBQVcsQ0FBQyxDQUFDO1FBQzNCLElBQUksTUFBTSxHQUFXLEVBQUUsQ0FBQztRQUV4QixPQUFPLFVBQVUsR0FBRyxVQUFVLEVBQUUsQ0FBQztZQUVoQyxJQUFJLGFBQWEsR0FBWSxLQUFLLENBQUM7WUFFbkMsdUNBQXVDO1lBQ3ZDLHdHQUF3RztZQUN4RyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUUvRSxNQUFNLFFBQVEsR0FBVyxVQUFVLENBQUM7Z0JBQ3BDLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FB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