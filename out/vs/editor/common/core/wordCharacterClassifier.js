/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/editor/common/core/characterClassifier"], function (require, exports, map_1, characterClassifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordCharacterClassifier = exports.WordCharacterClass = void 0;
    exports.getMapForWordSeparators = getMapForWordSeparators;
    var WordCharacterClass;
    (function (WordCharacterClass) {
        WordCharacterClass[WordCharacterClass["Regular"] = 0] = "Regular";
        WordCharacterClass[WordCharacterClass["Whitespace"] = 1] = "Whitespace";
        WordCharacterClass[WordCharacterClass["WordSeparator"] = 2] = "WordSeparator";
    })(WordCharacterClass || (exports.WordCharacterClass = WordCharacterClass = {}));
    class WordCharacterClassifier extends characterClassifier_1.CharacterClassifier {
        constructor(wordSeparators, intlSegmenterLocales) {
            super(0 /* WordCharacterClass.Regular */);
            this._segmenter = null;
            this._cachedLine = null;
            this._cachedSegments = [];
            this.intlSegmenterLocales = intlSegmenterLocales;
            if (this.intlSegmenterLocales.length > 0) {
                this._segmenter = new Intl.Segmenter(this.intlSegmenterLocales, { granularity: 'word' });
            }
            else {
                this._segmenter = null;
            }
            for (let i = 0, len = wordSeparators.length; i < len; i++) {
                this.set(wordSeparators.charCodeAt(i), 2 /* WordCharacterClass.WordSeparator */);
            }
            this.set(32 /* CharCode.Space */, 1 /* WordCharacterClass.Whitespace */);
            this.set(9 /* CharCode.Tab */, 1 /* WordCharacterClass.Whitespace */);
        }
        findPrevIntlWordBeforeOrAtOffset(line, offset) {
            let candidate = null;
            for (const segment of this._getIntlSegmenterWordsOnLine(line)) {
                if (segment.index > offset) {
                    break;
                }
                candidate = segment;
            }
            return candidate;
        }
        findNextIntlWordAtOrAfterOffset(lineContent, offset) {
            for (const segment of this._getIntlSegmenterWordsOnLine(lineContent)) {
                if (segment.index < offset) {
                    continue;
                }
                return segment;
            }
            return null;
        }
        _getIntlSegmenterWordsOnLine(line) {
            if (!this._segmenter) {
                return [];
            }
            // Check if the line has changed from the previous call
            if (this._cachedLine === line) {
                return this._cachedSegments;
            }
            // Update the cache with the new line
            this._cachedLine = line;
            this._cachedSegments = this._filterWordSegments(this._segmenter.segment(line));
            return this._cachedSegments;
        }
        _filterWordSegments(segments) {
            const result = [];
            for (const segment of segments) {
                if (this._isWordLike(segment)) {
                    result.push(segment);
                }
            }
            return result;
        }
        _isWordLike(segment) {
            if (segment.isWordLike) {
                return true;
            }
            return false;
        }
    }
    exports.WordCharacterClassifier = WordCharacterClassifier;
    const wordClassifierCache = new map_1.LRUCache(10);
    function getMapForWordSeparators(wordSeparators, intlSegmenterLocales) {
        const key = `${wordSeparators}/${intlSegmenterLocales.join(',')}`;
        let result = wordClassifierCache.get(key);
        if (!result) {
            result = new WordCharacterClassifier(wordSeparators, intlSegmenterLocales);
            wordClassifierCache.set(key, result);
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZENoYXJhY3RlckNsYXNzaWZpZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2NvcmUvd29yZENoYXJhY3RlckNsYXNzaWZpZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0doRywwREFRQztJQXBHRCxJQUFrQixrQkFJakI7SUFKRCxXQUFrQixrQkFBa0I7UUFDbkMsaUVBQVcsQ0FBQTtRQUNYLHVFQUFjLENBQUE7UUFDZCw2RUFBaUIsQ0FBQTtJQUNsQixDQUFDLEVBSmlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBSW5DO0lBRUQsTUFBYSx1QkFBd0IsU0FBUSx5Q0FBdUM7UUFPbkYsWUFBWSxjQUFzQixFQUFFLG9CQUF5RDtZQUM1RixLQUFLLG9DQUE0QixDQUFDO1lBTGxCLGVBQVUsR0FBMEIsSUFBSSxDQUFDO1lBQ2xELGdCQUFXLEdBQWtCLElBQUksQ0FBQztZQUNsQyxvQkFBZSxHQUEwQixFQUFFLENBQUM7WUFJbkQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDO1lBQ2pELElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDMUYsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLENBQUM7WUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENB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