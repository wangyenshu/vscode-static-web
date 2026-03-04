/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters", "vs/base/common/strings", "vs/base/common/themables"], function (require, exports, filters_1, strings_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeIcons = escapeIcons;
    exports.markdownEscapeEscapedIcons = markdownEscapeEscapedIcons;
    exports.stripIcons = stripIcons;
    exports.getCodiconAriaLabel = getCodiconAriaLabel;
    exports.parseLabelWithIcons = parseLabelWithIcons;
    exports.matchesFuzzyIconAware = matchesFuzzyIconAware;
    const iconStartMarker = '$(';
    const iconsRegex = new RegExp(`\\$\\(${themables_1.ThemeIcon.iconNameExpression}(?:${themables_1.ThemeIcon.iconModifierExpression})?\\)`, 'g'); // no capturing groups
    const escapeIconsRegex = new RegExp(`(\\\\)?${iconsRegex.source}`, 'g');
    function escapeIcons(text) {
        return text.replace(escapeIconsRegex, (match, escaped) => escaped ? match : `\\${match}`);
    }
    const markdownEscapedIconsRegex = new RegExp(`\\\\${iconsRegex.source}`, 'g');
    function markdownEscapeEscapedIcons(text) {
        // Need to add an extra \ for escaping in markdown
        return text.replace(markdownEscapedIconsRegex, match => `\\${match}`);
    }
    const stripIconsRegex = new RegExp(`(\\s)?(\\\\)?${iconsRegex.source}(\\s)?`, 'g');
    /**
     * Takes a label with icons (`$(iconId)xyz`)  and strips the icons out (`xyz`)
     */
    function stripIcons(text) {
        if (text.indexOf(iconStartMarker) === -1) {
            return text;
        }
        return text.replace(stripIconsRegex, (match, preWhitespace, escaped, postWhitespace) => escaped ? match : preWhitespace || postWhitespace || '');
    }
    /**
     * Takes a label with icons (`$(iconId)xyz`), removes the icon syntax adds whitespace so that screen readers can read the text better.
     */
    function getCodiconAriaLabel(text) {
        if (!text) {
            return '';
        }
        return text.replace(/\$\((.*?)\)/g, (_match, codiconName) => ` ${codiconName} `).trim();
    }
    const _parseIconsRegex = new RegExp(`\\$\\(${themables_1.ThemeIcon.iconNameCharacter}+\\)`, 'g');
    /**
     * Takes a label with icons (`abc $(iconId)xyz`) and returns the text (`abc xyz`) and the offsets of the icons (`[3]`)
     */
    function parseLabelWithIcons(input) {
        _parseIconsRegex.lastIndex = 0;
        let text = '';
        const iconOffsets = [];
        let iconsOffset = 0;
        while (true) {
            const pos = _parseIconsRegex.lastIndex;
            const match = _parseIconsRegex.exec(input);
            const chars = input.substring(pos, match?.index);
            if (chars.length > 0) {
                text += chars;
                for (let i = 0; i < chars.length; i++) {
                    iconOffsets.push(iconsOffset);
                }
            }
            if (!match) {
                break;
            }
            iconsOffset += match[0].length;
        }
        return { text, iconOffsets };
    }
    function matchesFuzzyIconAware(query, target, enableSeparateSubstringMatching = false) {
        const { text, iconOffsets } = target;
        // Return early if there are no icon markers in the word to match against
        if (!iconOffsets || iconOffsets.length === 0) {
            return (0, filters_1.matchesFuzzy)(query, text, enableSeparateSubstringMatching);
        }
        // Trim the word to match against because it could have leading
        // whitespace now if the word started with an icon
        const wordToMatchAgainstWithoutIconsTrimmed = (0, strings_1.ltrim)(text, ' ');
        const leadingWhitespaceOffset = text.length - wordToMatchAgainstWithoutIconsTrimmed.length;
        // match on value without icon
        const matches = (0, filters_1.matchesFuzzy)(query, wordToMatchAgainstWithoutIconsTrimmed, enableSeparateSubstringMatching);
        // Map matches back to offsets with icon and trimming
        if (matches) {
            for (const match of matches) {
                const iconOffset = iconOffsets[match.start + leadingWhitespaceOffset] /* icon offsets at index */ + leadingWhitespaceOffset /* overall leading whitespace offset */;
                match.start += iconOffset;
                match.end += iconOffset;
            }
        }
        return matches;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbkxhYmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2ljb25MYWJlbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsa0NBRUM7SUFHRCxnRUFHQztJQU9ELGdDQU1DO0lBTUQsa0RBTUM7SUFhRCxrREEwQkM7SUFHRCxzREEwQkM7SUExR0QsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDO0lBRTdCLE1BQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMscUJBQVMsQ0FBQyxrQkFBa0IsTUFBTSxxQkFBUyxDQUFDLHNCQUFzQixPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxzQkFBc0I7SUFFOUksTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxVQUFVLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN4RSxTQUFnQixXQUFXLENBQUMsSUFBWTtRQUN2QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFRCxNQUFNLHlCQUF5QixHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzlFLFNBQWdCLDBCQUEwQixDQUFDLElBQVk7UUFDdEQsa0RBQWtEO1FBQ2xELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLFVBQVUsQ0FBQyxNQUFNLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUVuRjs7T0FFRztJQUNILFNBQWdCLFVBQVUsQ0FBQyxJQUFZO1FBQ3RDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQzFDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxhQUFhLElBQUksY0FBYyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2xKLENBQUM7SUFHRDs7T0FFRztJQUNILFNBQWdCLG1CQUFtQixDQUFDLElBQXdCO1FBQzNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDekYsQ0FBQztJQVFELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsU0FBUyxxQkFBUyxDQUFDLGlCQUFpQixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFckY7O09BRUc7SUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxLQUFhO1FBRWhELGdCQUFnQixDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFFL0IsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2QsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1FBQ2pDLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztRQUVwQixPQUFPLElBQUksRUFBRSxDQUFDO1lBQ2IsTUFBTSxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFDO1lBQ3ZDLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUzQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakQsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0QixJQUFJLElBQUksS0FBSyxDQUFDO2dCQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3ZDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE1BQU07WUFDUCxDQUFDO1lBQ0QsV0FBVyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDaEMsQ0FBQztRQUVELE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUdELFNBQWdCLHFCQUFxQixDQUFDLEtBQWEsRUFBRSxNQUE2QixFQUFFLCtCQUErQixHQUFHLEtBQUs7UUFDMUgsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxNQUFNLENBQUM7UUFFckMseUVBQXlFO1FBQ3pFLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUM5QyxPQUFPLElBQUEsc0JBQVksRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLCtCQUErQixDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELCtEQUErRDtRQUMvRCxrREFBa0Q7UUFDbEQsTUFBTSxxQ0FBcUMsR0FBRyxJQUFBLGVBQUssRUFBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDL0QsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLHFDQUFxQyxDQUFDLE1BQU0sQ0FBQztRQUUzRiw4QkFBOEI7UUFDOUIsTUFBTSxPQUFPLEdBQUcsSUFBQSxzQkFBWSxFQUFDLEtBQUssRUFBRSxxQ0FBcUMsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO1FBRTVHLHFEQUFxRDtRQUNyRCxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2IsS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsdUJBQXVCLENBQUMsQ0FBQywyQkFBMkIsR0FBRyx1QkFBdUIsQ0FBQyx1Q0FBdUMsQ0FBQztnQkFDcEssS0FBSyxDQUFDLEtBQUssSUFBSSxVQUFVLENBQUM7Z0JBQzFCLEtBQUssQ0FBQyxHQUFHLElBQUksVUFBVSxDQUFDO1lBQ3pCLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQyJ9