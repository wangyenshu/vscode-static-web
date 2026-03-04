/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/path"], function (require, exports, lazy_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compareFileNames = compareFileNames;
    exports.compareFileNamesDefault = compareFileNamesDefault;
    exports.compareFileNamesUpper = compareFileNamesUpper;
    exports.compareFileNamesLower = compareFileNamesLower;
    exports.compareFileNamesUnicode = compareFileNamesUnicode;
    exports.compareFileExtensions = compareFileExtensions;
    exports.compareFileExtensionsDefault = compareFileExtensionsDefault;
    exports.compareFileExtensionsUpper = compareFileExtensionsUpper;
    exports.compareFileExtensionsLower = compareFileExtensionsLower;
    exports.compareFileExtensionsUnicode = compareFileExtensionsUnicode;
    exports.comparePaths = comparePaths;
    exports.compareAnything = compareAnything;
    exports.compareByPrefix = compareByPrefix;
    // When comparing large numbers of strings it's better for performance to create an
    // Intl.Collator object and use the function provided by its compare property
    // than it is to use String.prototype.localeCompare()
    // A collator with numeric sorting enabled, and no sensitivity to case, accents or diacritics.
    const intlFileNameCollatorBaseNumeric = new lazy_1.Lazy(() => {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        return {
            collator,
            collatorIsNumeric: collator.resolvedOptions().numeric
        };
    });
    // A collator with numeric sorting enabled.
    const intlFileNameCollatorNumeric = new lazy_1.Lazy(() => {
        const collator = new Intl.Collator(undefined, { numeric: true });
        return {
            collator
        };
    });
    // A collator with numeric sorting enabled, and sensitivity to accents and diacritics but not case.
    const intlFileNameCollatorNumericCaseInsensitive = new lazy_1.Lazy(() => {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'accent' });
        return {
            collator
        };
    });
    /** Compares filenames without distinguishing the name from the extension. Disambiguates by unicode comparison. */
    function compareFileNames(one, other, caseSensitive = false) {
        const a = one || '';
        const b = other || '';
        const result = intlFileNameCollatorBaseNumeric.value.collator.compare(a, b);
        // Using the numeric option will make compare(`foo1`, `foo01`) === 0. Disambiguate.
        if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && result === 0 && a !== b) {
            return a < b ? -1 : 1;
        }
        return result;
    }
    /** Compares full filenames without grouping by case. */
    function compareFileNamesDefault(one, other) {
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        one = one || '';
        other = other || '';
        return compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares full filenames grouping uppercase names before lowercase. */
    function compareFileNamesUpper(one, other) {
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        one = one || '';
        other = other || '';
        return compareCaseUpperFirst(one, other) || compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares full filenames grouping lowercase names before uppercase. */
    function compareFileNamesLower(one, other) {
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        one = one || '';
        other = other || '';
        return compareCaseLowerFirst(one, other) || compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares full filenames by unicode value. */
    function compareFileNamesUnicode(one, other) {
        one = one || '';
        other = other || '';
        if (one === other) {
            return 0;
        }
        return one < other ? -1 : 1;
    }
    /** Compares filenames by extension, then by name. Disambiguates by unicode comparison. */
    function compareFileExtensions(one, other) {
        const [oneName, oneExtension] = extractNameAndExtension(one);
        const [otherName, otherExtension] = extractNameAndExtension(other);
        let result = intlFileNameCollatorBaseNumeric.value.collator.compare(oneExtension, otherExtension);
        if (result === 0) {
            // Using the numeric option will  make compare(`foo1`, `foo01`) === 0. Disambiguate.
            if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && oneExtension !== otherExtension) {
                return oneExtension < otherExtension ? -1 : 1;
            }
            // Extensions are equal, compare filenames
            result = intlFileNameCollatorBaseNumeric.value.collator.compare(oneName, otherName);
            if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && result === 0 && oneName !== otherName) {
                return oneName < otherName ? -1 : 1;
            }
        }
        return result;
    }
    /** Compares filenames by extension, then by full filename. Mixes uppercase and lowercase names together. */
    function compareFileExtensionsDefault(one, other) {
        one = one || '';
        other = other || '';
        const oneExtension = extractExtension(one);
        const otherExtension = extractExtension(other);
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        const collatorNumericCaseInsensitive = intlFileNameCollatorNumericCaseInsensitive.value.collator;
        return compareAndDisambiguateByLength(collatorNumericCaseInsensitive, oneExtension, otherExtension) ||
            compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares filenames by extension, then case, then full filename. Groups uppercase names before lowercase. */
    function compareFileExtensionsUpper(one, other) {
        one = one || '';
        other = other || '';
        const oneExtension = extractExtension(one);
        const otherExtension = extractExtension(other);
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        const collatorNumericCaseInsensitive = intlFileNameCollatorNumericCaseInsensitive.value.collator;
        return compareAndDisambiguateByLength(collatorNumericCaseInsensitive, oneExtension, otherExtension) ||
            compareCaseUpperFirst(one, other) ||
            compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares filenames by extension, then case, then full filename. Groups lowercase names before uppercase. */
    function compareFileExtensionsLower(one, other) {
        one = one || '';
        other = other || '';
        const oneExtension = extractExtension(one);
        const otherExtension = extractExtension(other);
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        const collatorNumericCaseInsensitive = intlFileNameCollatorNumericCaseInsensitive.value.collator;
        return compareAndDisambiguateByLength(collatorNumericCaseInsensitive, oneExtension, otherExtension) ||
            compareCaseLowerFirst(one, other) ||
            compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares filenames by case-insensitive extension unicode value, then by full filename unicode value. */
    function compareFileExtensionsUnicode(one, other) {
        one = one || '';
        other = other || '';
        const oneExtension = extractExtension(one).toLowerCase();
        const otherExtension = extractExtension(other).toLowerCase();
        // Check for extension differences
        if (oneExtension !== otherExtension) {
            return oneExtension < otherExtension ? -1 : 1;
        }
        // Check for full filename differences.
        if (one !== other) {
            return one < other ? -1 : 1;
        }
        return 0;
    }
    const FileNameMatch = /^(.*?)(\.([^.]*))?$/;
    /** Extracts the name and extension from a full filename, with optional special handling for dotfiles */
    function extractNameAndExtension(str, dotfilesAsNames = false) {
        const match = str ? FileNameMatch.exec(str) : [];
        let result = [(match && match[1]) || '', (match && match[3]) || ''];
        // if the dotfilesAsNames option is selected, treat an empty filename with an extension
        // or a filename that starts with a dot, as a dotfile name
        if (dotfilesAsNames && (!result[0] && result[1] || result[0] && result[0].charAt(0) === '.')) {
            result = [result[0] + '.' + result[1], ''];
        }
        return result;
    }
    /** Extracts the extension from a full filename. Treats dotfiles as names, not extensions. */
    function extractExtension(str) {
        const match = str ? FileNameMatch.exec(str) : [];
        return (match && match[1] && match[1].charAt(0) !== '.' && match[3]) || '';
    }
    function compareAndDisambiguateByLength(collator, one, other) {
        // Check for differences
        const result = collator.compare(one, other);
        if (result !== 0) {
            return result;
        }
        // In a numeric comparison, `foo1` and `foo01` will compare as equivalent.
        // Disambiguate by sorting the shorter string first.
        if (one.length !== other.length) {
            return one.length < other.length ? -1 : 1;
        }
        return 0;
    }
    /** @returns `true` if the string is starts with a lowercase letter. Otherwise, `false`. */
    function startsWithLower(string) {
        const character = string.charAt(0);
        return (character.toLocaleUpperCase() !== character) ? true : false;
    }
    /** @returns `true` if the string starts with an uppercase letter. Otherwise, `false`. */
    function startsWithUpper(string) {
        const character = string.charAt(0);
        return (character.toLocaleLowerCase() !== character) ? true : false;
    }
    /**
     * Compares the case of the provided strings - lowercase before uppercase
     *
     * @returns
     * ```text
     *   -1 if one is lowercase and other is uppercase
     *    1 if one is uppercase and other is lowercase
     *    0 otherwise
     * ```
     */
    function compareCaseLowerFirst(one, other) {
        if (startsWithLower(one) && startsWithUpper(other)) {
            return -1;
        }
        return (startsWithUpper(one) && startsWithLower(other)) ? 1 : 0;
    }
    /**
     * Compares the case of the provided strings - uppercase before lowercase
     *
     * @returns
     * ```text
     *   -1 if one is uppercase and other is lowercase
     *    1 if one is lowercase and other is uppercase
     *    0 otherwise
     * ```
     */
    function compareCaseUpperFirst(one, other) {
        if (startsWithUpper(one) && startsWithLower(other)) {
            return -1;
        }
        return (startsWithLower(one) && startsWithUpper(other)) ? 1 : 0;
    }
    function comparePathComponents(one, other, caseSensitive = false) {
        if (!caseSensitive) {
            one = one && one.toLowerCase();
            other = other && other.toLowerCase();
        }
        if (one === other) {
            return 0;
        }
        return one < other ? -1 : 1;
    }
    function comparePaths(one, other, caseSensitive = false) {
        const oneParts = one.split(path_1.sep);
        const otherParts = other.split(path_1.sep);
        const lastOne = oneParts.length - 1;
        const lastOther = otherParts.length - 1;
        let endOne, endOther;
        for (let i = 0;; i++) {
            endOne = lastOne === i;
            endOther = lastOther === i;
            if (endOne && endOther) {
                return compareFileNames(oneParts[i], otherParts[i], caseSensitive);
            }
            else if (endOne) {
                return -1;
            }
            else if (endOther) {
                return 1;
            }
            const result = comparePathComponents(oneParts[i], otherParts[i], caseSensitive);
            if (result !== 0) {
                return result;
            }
        }
    }
    function compareAnything(one, other, lookFor) {
        const elementAName = one.toLowerCase();
        const elementBName = other.toLowerCase();
        // Sort prefix matches over non prefix matches
        const prefixCompare = compareByPrefix(one, other, lookFor);
        if (prefixCompare) {
            return prefixCompare;
        }
        // Sort suffix matches over non suffix matches
        const elementASuffixMatch = elementAName.endsWith(lookFor);
        const elementBSuffixMatch = elementBName.endsWith(lookFor);
        if (elementASuffixMatch !== elementBSuffixMatch) {
            return elementASuffixMatch ? -1 : 1;
        }
        // Understand file names
        const r = compareFileNames(elementAName, elementBName);
        if (r !== 0) {
            return r;
        }
        // Compare by name
        return elementAName.localeCompare(elementBName);
    }
    function compareByPrefix(one, other, lookFor) {
        const elementAName = one.toLowerCase();
        const elementBName = other.toLowerCase();
        // Sort prefix matches over non prefix matches
        const elementAPrefixMatch = elementAName.startsWith(lookFor);
        const elementBPrefixMatch = elementBName.startsWith(lookFor);
        if (elementAPrefixMatch !== elementBPrefixMatch) {
            return elementAPrefixMatch ? -1 : 1;
        }
        // Same prefix: Sort shorter matches to the top to have those on top that match more precisely
        else if (elementAPrefixMatch && elementBPrefixMatch) {
            if (elementAName.length < elementBName.length) {
                return -1;
            }
            if (elementAName.length > elementBName.length) {
                return 1;
            }
        }
        return 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGFyZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vY29tcGFyZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUNoRyw0Q0FXQztJQUdELDBEQU1DO0lBR0Qsc0RBTUM7SUFHRCxzREFNQztJQUdELDBEQVNDO0lBR0Qsc0RBcUJDO0lBR0Qsb0VBVUM7SUFHRCxnRUFXQztJQUdELGdFQVdDO0lBR0Qsb0VBaUJDO0lBdUdELG9DQTBCQztJQUVELDBDQXlCQztJQUVELDBDQXVCQztJQTFWRCxtRkFBbUY7SUFDbkYsNkVBQTZFO0lBQzdFLHFEQUFxRDtJQUVyRCw4RkFBOEY7SUFDOUYsTUFBTSwrQkFBK0IsR0FBa0UsSUFBSSxXQUFJLENBQUMsR0FBRyxFQUFFO1FBQ3BILE1BQU0sUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3RGLE9BQU87WUFDTixRQUFRO1lBQ1IsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDLE9BQU87U0FDckQsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsMkNBQTJDO0lBQzNDLE1BQU0sMkJBQTJCLEdBQXNDLElBQUksV0FBSSxDQUFDLEdBQUcsRUFBRTtRQUNwRixNQUFNLFFBQVEsR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDakUsT0FBTztZQUNOLFFBQVE7U0FDUixDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxtR0FBbUc7SUFDbkcsTUFBTSwwQ0FBMEMsR0FBc0MsSUFBSSxX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