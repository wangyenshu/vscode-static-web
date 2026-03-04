/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/comparers", "vs/base/common/filters", "vs/base/common/hash", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings"], function (require, exports, comparers_1, filters_1, hash_1, path_1, platform_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scoreFuzzy = scoreFuzzy;
    exports.scoreFuzzy2 = scoreFuzzy2;
    exports.scoreItemFuzzy = scoreItemFuzzy;
    exports.compareItemsByFuzzyScore = compareItemsByFuzzyScore;
    exports.prepareQuery = prepareQuery;
    exports.pieceToQuery = pieceToQuery;
    const NO_MATCH = 0;
    const NO_SCORE = [NO_MATCH, []];
    // const DEBUG = true;
    // const DEBUG_MATRIX = false;
    function scoreFuzzy(target, query, queryLower, allowNonContiguousMatches) {
        if (!target || !query) {
            return NO_SCORE; // return early if target or query are undefined
        }
        const targetLength = target.length;
        const queryLength = query.length;
        if (targetLength < queryLength) {
            return NO_SCORE; // impossible for query to be contained in target
        }
        // if (DEBUG) {
        // 	console.group(`Target: ${target}, Query: ${query}`);
        // }
        const targetLower = target.toLowerCase();
        const res = doScoreFuzzy(query, queryLower, queryLength, target, targetLower, targetLength, allowNonContiguousMatches);
        // if (DEBUG) {
        // 	console.log(`%cFinal Score: ${res[0]}`, 'font-weight: bold');
        // 	console.groupEnd();
        // }
        return res;
    }
    function doScoreFuzzy(query, queryLower, queryLength, target, targetLower, targetLength, allowNonContiguousMatches) {
        const scores = [];
        const matches = [];
        //
        // Build Scorer Matrix:
        //
        // The matrix is composed of query q and target t. For each index we score
        // q[i] with t[i] and compare that with the previous score. If the score is
        // equal or larger, we keep the match. In addition to the score, we also keep
        // the length of the consecutive matches to use as boost for the score.
        //
        //      t   a   r   g   e   t
        //  q
        //  u
        //  e
        //  r
        //  y
        //
        for (let queryIndex = 0; queryIndex < queryLength; queryIndex++) {
            const queryIndexOffset = queryIndex * targetLength;
            const queryIndexPreviousOffset = queryIndexOffset - targetLength;
            const queryIndexGtNull = queryIndex > 0;
            const queryCharAtIndex = query[queryIndex];
            const queryLowerCharAtIndex = queryLower[queryIndex];
            for (let targetIndex = 0; targetIndex < targetLength; targetIndex++) {
                const targetIndexGtNull = targetIndex > 0;
                const currentIndex = queryIndexOffset + targetIndex;
                const leftIndex = currentIndex - 1;
                const diagIndex = queryIndexPreviousOffset + targetIndex - 1;
                const leftScore = targetIndexGtNull ? scores[leftIndex] : 0;
                const diagScore = queryIndexGtNull && targetIndexGtNull ? scores[diagIndex] : 0;
                const matchesSequenceLength = queryIndexGtNull && targetIndexGtNull ? matches[diagIndex] : 0;
                // If we are not matching on the first query character any more, we only produce a
                // score if we had a score previously for the last query index (by looking at the diagScore).
                // This makes sure that the query always matches in sequence on the target. For example
                // given a target of "ede" and a query of "de", we would otherwise produce a wrong high score
                // for query[1] ("e") matching on target[0] ("e") because of the "beginning of word" boost.
                let score;
                if (!diagScore && queryIndexGtNull) {
                    score = 0;
                }
                else {
                    score = computeCharScore(queryCharAtIndex, queryLowerCharAtIndex, target, targetLower, targetIndex, matchesSequenceLength);
                }
                // We have a score and its equal or larger than the left score
                // Match: sequence continues growing from previous diag value
                // Score: increases by diag score value
                const isValidScore = score && diagScore + score >= leftScore;
                if (isValidScore && (
                // We don't need to check if it's contiguous if we allow non-contiguous matches
                allowNonContiguousMatches ||
                    // We must be looking for a contiguous match.
                    // Looking at an index higher than 0 in the query means we must have already
                    // found out this is contiguous otherwise there wouldn't have been a score
                    queryIndexGtNull ||
                    // lastly check if the query is completely contiguous at this index in the target
                    targetLower.startsWith(queryLower, targetIndex))) {
                    matches[currentIndex] = matchesSequenceLength + 1;
                    scores[currentIndex] = diagScore + score;
                }
                // We either have no score or the score is lower than the left score
                // Match: reset to 0
                // Score: pick up from left hand side
                else {
                    matches[currentIndex] = NO_MATCH;
                    scores[currentIndex] = leftScore;
                }
            }
        }
        // Restore Positions (starting from bottom right of matrix)
        const positions = [];
        let queryIndex = queryLength - 1;
        let targetIndex = targetLength - 1;
        while (queryIndex >= 0 && targetIndex >= 0) {
            const currentIndex = queryIndex * targetLength + targetIndex;
            const match = matches[currentIndex];
            if (match === NO_MATCH) {
                targetIndex--; // go left
            }
            else {
                positions.push(targetIndex);
                // go up and left
                queryIndex--;
                targetIndex--;
            }
        }
        // Print matrix
        // if (DEBUG_MATRIX) {
        // 	printMatrix(query, target, matches, scores);
        // }
        return [scores[queryLength * targetLength - 1], positions.reverse()];
    }
    function computeCharScore(queryCharAtIndex, queryLowerCharAtIndex, target, targetLower, targetIndex, matchesSequenceLength) {
        let score = 0;
        if (!considerAsEqual(queryLowerCharAtIndex, targetLower[targetIndex])) {
            return score; // no match of characters
        }
        // if (DEBUG) {
        // 	console.groupCollapsed(`%cFound a match of char: ${queryLowerCharAtIndex} at index ${targetIndex}`, 'font-weight: normal');
        // }
        // Character match bonus
        score += 1;
        // if (DEBUG) {
        // 	console.log(`%cCharacter match bonus: +1`, 'font-weight: normal');
        // }
        // Consecutive match bonus
        if (matchesSequenceLength > 0) {
            score += (matchesSequenceLength * 5);
            // if (DEBUG) {
            // 	console.log(`Consecutive match bonus: +${matchesSequenceLength * 5}`);
            // }
        }
        // Same case bonus
        if (queryCharAtIndex === target[targetIndex]) {
            score += 1;
            // if (DEBUG) {
            // 	console.log('Same case bonus: +1');
            // }
        }
        // Start of word bonus
        if (targetIndex === 0) {
            score += 8;
            // if (DEBUG) {
            // 	console.log('Start of word bonus: +8');
            // }
        }
        else {
            // After separator bonus
            const separatorBonus = scoreSeparatorAtPos(target.charCodeAt(targetIndex - 1));
            if (separatorBonus) {
                score += separatorBonus;
                // if (DEBUG) {
                // 	console.log(`After separator bonus: +${separatorBonus}`);
                // }
            }
            // Inside word upper case bonus (camel case). We only give this bonus if we're not in a contiguous sequence.
            // For example:
            // NPE => NullPointerException = boost
            // HTTP => HTTP = not boost
            else if ((0, filters_1.isUpper)(target.charCodeAt(targetIndex)) && matchesSequenceLength === 0) {
                score += 2;
                // if (DEBUG) {
                // 	console.log('Inside word upper case bonus: +2');
                // }
            }
        }
        // if (DEBUG) {
        // 	console.log(`Total score: ${score}`);
        // 	console.groupEnd();
        // }
        return score;
    }
    function considerAsEqual(a, b) {
        if (a === b) {
            return true;
        }
        // Special case path separators: ignore platform differences
        if (a === '/' || a === '\\') {
            return b === '/' || b === '\\';
        }
        return false;
    }
    function scoreSeparatorAtPos(charCode) {
        switch (charCode) {
            case 47 /* CharCode.Slash */:
            case 92 /* CharCode.Backslash */:
                return 5; // prefer path separators...
            case 95 /* CharCode.Underline */:
            case 45 /* CharCode.Dash */:
            case 46 /* CharCode.Period */:
            case 32 /* CharCode.Space */:
            case 39 /* CharCode.SingleQuote */:
            case 34 /* CharCode.DoubleQuote */:
            case 58 /* CharCode.Colon */:
                return 4; // ...over other separators
            default:
                return 0;
        }
    }
    const NO_SCORE2 = [undefined, []];
    function scoreFuzzy2(target, query, patternStart = 0, wordStart = 0) {
        // Score: multiple inputs
        const preparedQuery = query;
        if (preparedQuery.values && preparedQuery.values.length > 1) {
            return doScoreFuzzy2Multiple(target, preparedQuery.values, patternStart, wordStart);
        }
        // Score: single input
        return doScoreFuzzy2Single(target, query, patternStart, wordStart);
    }
    function doScoreFuzzy2Multiple(target, query, patternStart, wordStart) {
        let totalScore = 0;
        const totalMatches = [];
        for (const queryPiece of query) {
            const [score, matches] = doScoreFuzzy2Single(target, queryPiece, patternStart, wordStart);
            if (typeof score !== 'number') {
                // if a single query value does not match, return with
                // no score entirely, we require all queries to match
                return NO_SCORE2;
            }
            totalScore += score;
            totalMatches.push(...matches);
        }
        // if we have a score, ensure that the positions are
        // sorted in ascending order and distinct
        return [totalScore, normalizeMatches(totalMatches)];
    }
    function doScoreFuzzy2Single(target, query, patternStart, wordStart) {
        const score = (0, filters_1.fuzzyScore)(query.original, query.originalLowercase, patternStart, target, target.toLowerCase(), wordStart, { firstMatchCanBeWeak: true, boostFullMatch: true });
        if (!score) {
            return NO_SCORE2;
        }
        return [score[0], (0, filters_1.createMatches)(score)];
    }
    const NO_ITEM_SCORE = Object.freeze({ score: 0 });
    const PATH_IDENTITY_SCORE = 1 << 18;
    const LABEL_PREFIX_SCORE_THRESHOLD = 1 << 17;
    const LABEL_SCORE_THRESHOLD = 1 << 16;
    function getCacheHash(label, description, allowNonContiguousMatches, query) {
        const values = query.values ? query.values : [query];
        const cacheHash = (0, hash_1.hash)({
            [query.normalized]: {
                values: values.map(v => ({ value: v.normalized, expectContiguousMatch: v.expectContiguousMatch })),
                label,
                description,
                allowNonContiguousMatches
            }
        });
        return cacheHash;
    }
    function scoreItemFuzzy(item, query, allowNonContiguousMatches, accessor, cache) {
        if (!item || !query.normalized) {
            return NO_ITEM_SCORE; // we need an item and query to score on at least
        }
        const label = accessor.getItemLabel(item);
        if (!label) {
            return NO_ITEM_SCORE; // we need a label at least
        }
        const description = accessor.getItemDescription(item);
        // in order to speed up scoring, we cache the score with a unique hash based on:
        // - label
        // - description (if provided)
        // - whether non-contiguous matching is enabled or not
        // - hash of the query (normalized) values
        const cacheHash = getCacheHash(label, description, allowNonContiguousMatches, query);
        const cached = cache[cacheHash];
        if (cached) {
            return cached;
        }
        const itemScore = doScoreItemFuzzy(label, description, accessor.getItemPath(item), query, allowNonContiguousMatches);
        cache[cacheHash] = itemScore;
        return itemScore;
    }
    function doScoreItemFuzzy(label, description, path, query, allowNonContiguousMatches) {
        const preferLabelMatches = !path || !query.containsPathSeparator;
        // Treat identity matches on full path highest
        if (path && (platform_1.isLinux ? query.pathNormalized === path : (0, strings_1.equalsIgnoreCase)(query.pathNormalized, path))) {
            return { score: PATH_IDENTITY_SCORE, labelMatch: [{ start: 0, end: label.length }], descriptionMatch: description ? [{ start: 0, end: description.length }] : undefined };
        }
        // Score: multiple inputs
        if (query.values && query.values.length > 1) {
            return doScoreItemFuzzyMultiple(label, description, path, query.values, preferLabelMatches, allowNonContiguousMatches);
        }
        // Score: single input
        return doScoreItemFuzzySingle(label, description, path, query, preferLabelMatches, allowNonContiguousMatches);
    }
    function doScoreItemFuzzyMultiple(label, description, path, query, preferLabelMatches, allowNonContiguousMatches) {
        let totalScore = 0;
        const totalLabelMatches = [];
        const totalDescriptionMatches = [];
        for (const queryPiece of query) {
            const { score, labelMatch, descriptionMatch } = doScoreItemFuzzySingle(label, description, path, queryPiece, preferLabelMatches, allowNonContiguousMatches);
            if (score === NO_MATCH) {
                // if a single query value does not match, return with
                // no score entirely, we require all queries to match
                return NO_ITEM_SCORE;
            }
            totalScore += score;
            if (labelMatch) {
                totalLabelMatches.push(...labelMatch);
            }
            if (descriptionMatch) {
                totalDescriptionMatches.push(...descriptionMatch);
            }
        }
        // if we have a score, ensure that the positions are
        // sorted in ascending order and distinct
        return {
            score: totalScore,
            labelMatch: normalizeMatches(totalLabelMatches),
            descriptionMatch: normalizeMatches(totalDescriptionMatches)
        };
    }
    function doScoreItemFuzzySingle(label, description, path, query, preferLabelMatches, allowNonContiguousMatches) {
        // Prefer label matches if told so or we have no description
        if (preferLabelMatches || !description) {
            const [labelScore, labelPositions] = scoreFuzzy(label, query.normalized, query.normalizedLowercase, allowNonContiguousMatches && !query.expectContiguousMatch);
            if (labelScore) {
                // If we have a prefix match on the label, we give a much
                // higher baseScore to elevate these matches over others
                // This ensures that typing a file name wins over results
                // that are present somewhere in the label, but not the
                // beginning.
                const labelPrefixMatch = (0, filters_1.matchesPrefix)(query.normalized, label);
                let baseScore;
                if (labelPrefixMatch) {
                    baseScore = LABEL_PREFIX_SCORE_THRESHOLD;
                    // We give another boost to labels that are short, e.g. given
                    // files "window.ts" and "windowActions.ts" and a query of
                    // "window", we want "window.ts" to receive a higher score.
                    // As such we compute the percentage the query has within the
                    // label and add that to the baseScore.
                    const prefixLengthBoost = Math.round((query.normalized.length / label.length) * 100);
                    baseScore += prefixLengthBoost;
                }
                else {
                    baseScore = LABEL_SCORE_THRESHOLD;
                }
                return { score: baseScore + labelScore, labelMatch: labelPrefixMatch || createMatches(labelPositions) };
            }
        }
        // Finally compute description + label scores if we have a description
        if (description) {
            let descriptionPrefix = description;
            if (!!path) {
                descriptionPrefix = `${description}${path_1.sep}`; // assume this is a file path
            }
            const descriptionPrefixLength = descriptionPrefix.length;
            const descriptionAndLabel = `${descriptionPrefix}${label}`;
            const [labelDescriptionScore, labelDescriptionPositions] = scoreFuzzy(descriptionAndLabel, query.normalized, query.normalizedLowercase, allowNonContiguousMatches && !query.expectContiguousMatch);
            if (labelDescriptionScore) {
                const labelDescriptionMatches = createMatches(labelDescriptionPositions);
                const labelMatch = [];
                const descriptionMatch = [];
                // We have to split the matches back onto the label and description portions
                labelDescriptionMatches.forEach(h => {
                    // Match overlaps label and description part, we need to split it up
                    if (h.start < descriptionPrefixLength && h.end > descriptionPrefixLength) {
                        labelMatch.push({ start: 0, end: h.end - descriptionPrefixLength });
                        descriptionMatch.push({ start: h.start, end: descriptionPrefixLength });
                    }
                    // Match on label part
                    else if (h.start >= descriptionPrefixLength) {
                        labelMatch.push({ start: h.start - descriptionPrefixLength, end: h.end - descriptionPrefixLength });
                    }
                    // Match on description part
                    else {
                        descriptionMatch.push(h);
                    }
                });
                return { score: labelDescriptionScore, labelMatch, descriptionMatch };
            }
        }
        return NO_ITEM_SCORE;
    }
    function createMatches(offsets) {
        const ret = [];
        if (!offsets) {
            return ret;
        }
        let last;
        for (const pos of offsets) {
            if (last && last.end === pos) {
                last.end += 1;
            }
            else {
                last = { start: pos, end: pos + 1 };
                ret.push(last);
            }
        }
        return ret;
    }
    function normalizeMatches(matches) {
        // sort matches by start to be able to normalize
        const sortedMatches = matches.sort((matchA, matchB) => {
            return matchA.start - matchB.start;
        });
        // merge matches that overlap
        const normalizedMatches = [];
        let currentMatch = undefined;
        for (const match of sortedMatches) {
            // if we have no current match or the matches
            // do not overlap, we take it as is and remember
            // it for future merging
            if (!currentMatch || !matchOverlaps(currentMatch, match)) {
                currentMatch = match;
                normalizedMatches.push(match);
            }
            // otherwise we merge the matches
            else {
                currentMatch.start = Math.min(currentMatch.start, match.start);
                currentMatch.end = Math.max(currentMatch.end, match.end);
            }
        }
        return normalizedMatches;
    }
    function matchOverlaps(matchA, matchB) {
        if (matchA.end < matchB.start) {
            return false; // A ends before B starts
        }
        if (matchB.end < matchA.start) {
            return false; // B ends before A starts
        }
        return true;
    }
    //#endregion
    //#region Comparers
    function compareItemsByFuzzyScore(itemA, itemB, query, allowNonContiguousMatches, accessor, cache) {
        const itemScoreA = scoreItemFuzzy(itemA, query, allowNonContiguousMatches, accessor, cache);
        const itemScoreB = scoreItemFuzzy(itemB, query, allowNonContiguousMatches, accessor, cache);
        const scoreA = itemScoreA.score;
        const scoreB = itemScoreB.score;
        // 1.) identity matches have highest score
        if (scoreA === PATH_IDENTITY_SCORE || scoreB === PATH_IDENTITY_SCORE) {
            if (scoreA !== scoreB) {
                return scoreA === PATH_IDENTITY_SCORE ? -1 : 1;
            }
        }
        // 2.) matches on label are considered higher compared to label+description matches
        if (scoreA > LABEL_SCORE_THRESHOLD || scoreB > LABEL_SCORE_THRESHOLD) {
            if (scoreA !== scoreB) {
                return scoreA > scoreB ? -1 : 1;
            }
            // prefer more compact matches over longer in label (unless this is a prefix match where
            // longer prefix matches are actually preferred)
            if (scoreA < LABEL_PREFIX_SCORE_THRESHOLD && scoreB < LABEL_PREFIX_SCORE_THRESHOLD) {
                const comparedByMatchLength = compareByMatchLength(itemScoreA.labelMatch, itemScoreB.labelMatch);
                if (comparedByMatchLength !== 0) {
                    return comparedByMatchLength;
                }
            }
            // prefer shorter labels over longer labels
            const labelA = accessor.getItemLabel(itemA) || '';
            const labelB = accessor.getItemLabel(itemB) || '';
            if (labelA.length !== labelB.length) {
                return labelA.length - labelB.length;
            }
        }
        // 3.) compare by score in label+description
        if (scoreA !== scoreB) {
            return scoreA > scoreB ? -1 : 1;
        }
        // 4.) scores are identical: prefer matches in label over non-label matches
        const itemAHasLabelMatches = Array.isArray(itemScoreA.labelMatch) && itemScoreA.labelMatch.length > 0;
        const itemBHasLabelMatches = Array.isArray(itemScoreB.labelMatch) && itemScoreB.labelMatch.length > 0;
        if (itemAHasLabelMatches && !itemBHasLabelMatches) {
            return -1;
        }
        else if (itemBHasLabelMatches && !itemAHasLabelMatches) {
            return 1;
        }
        // 5.) scores are identical: prefer more compact matches (label and description)
        const itemAMatchDistance = computeLabelAndDescriptionMatchDistance(itemA, itemScoreA, accessor);
        const itemBMatchDistance = computeLabelAndDescriptionMatchDistance(itemB, itemScoreB, accessor);
        if (itemAMatchDistance && itemBMatchDistance && itemAMatchDistance !== itemBMatchDistance) {
            return itemBMatchDistance > itemAMatchDistance ? -1 : 1;
        }
        // 6.) scores are identical: start to use the fallback compare
        return fallbackCompare(itemA, itemB, query, accessor);
    }
    function computeLabelAndDescriptionMatchDistance(item, score, accessor) {
        let matchStart = -1;
        let matchEnd = -1;
        // If we have description matches, the start is first of description match
        if (score.descriptionMatch && score.descriptionMatch.length) {
            matchStart = score.descriptionMatch[0].start;
        }
        // Otherwise, the start is the first label match
        else if (score.labelMatch && score.labelMatch.length) {
            matchStart = score.labelMatch[0].start;
        }
        // If we have label match, the end is the last label match
        // If we had a description match, we add the length of the description
        // as offset to the end to indicate this.
        if (score.labelMatch && score.labelMatch.length) {
            matchEnd = score.labelMatch[score.labelMatch.length - 1].end;
            if (score.descriptionMatch && score.descriptionMatch.length) {
                const itemDescription = accessor.getItemDescription(item);
                if (itemDescription) {
                    matchEnd += itemDescription.length;
                }
            }
        }
        // If we have just a description match, the end is the last description match
        else if (score.descriptionMatch && score.descriptionMatch.length) {
            matchEnd = score.descriptionMatch[score.descriptionMatch.length - 1].end;
        }
        return matchEnd - matchStart;
    }
    function compareByMatchLength(matchesA, matchesB) {
        if ((!matchesA && !matchesB) || ((!matchesA || !matchesA.length) && (!matchesB || !matchesB.length))) {
            return 0; // make sure to not cause bad comparing when matches are not provided
        }
        if (!matchesB || !matchesB.length) {
            return -1;
        }
        if (!matchesA || !matchesA.length) {
            return 1;
        }
        // Compute match length of A (first to last match)
        const matchStartA = matchesA[0].start;
        const matchEndA = matchesA[matchesA.length - 1].end;
        const matchLengthA = matchEndA - matchStartA;
        // Compute match length of B (first to last match)
        const matchStartB = matchesB[0].start;
        const matchEndB = matchesB[matchesB.length - 1].end;
        const matchLengthB = matchEndB - matchStartB;
        // Prefer shorter match length
        return matchLengthA === matchLengthB ? 0 : matchLengthB < matchLengthA ? 1 : -1;
    }
    function fallbackCompare(itemA, itemB, query, accessor) {
        // check for label + description length and prefer shorter
        const labelA = accessor.getItemLabel(itemA) || '';
        const labelB = accessor.getItemLabel(itemB) || '';
        const descriptionA = accessor.getItemDescription(itemA);
        const descriptionB = accessor.getItemDescription(itemB);
        const labelDescriptionALength = labelA.length + (descriptionA ? descriptionA.length : 0);
        const labelDescriptionBLength = labelB.length + (descriptionB ? descriptionB.length : 0);
        if (labelDescriptionALength !== labelDescriptionBLength) {
            return labelDescriptionALength - labelDescriptionBLength;
        }
        // check for path length and prefer shorter
        const pathA = accessor.getItemPath(itemA);
        const pathB = accessor.getItemPath(itemB);
        if (pathA && pathB && pathA.length !== pathB.length) {
            return pathA.length - pathB.length;
        }
        // 7.) finally we have equal scores and equal length, we fallback to comparer
        // compare by label
        if (labelA !== labelB) {
            return (0, comparers_1.compareAnything)(labelA, labelB, query.normalized);
        }
        // compare by description
        if (descriptionA && descriptionB && descriptionA !== descriptionB) {
            return (0, comparers_1.compareAnything)(descriptionA, descriptionB, query.normalized);
        }
        // compare by path
        if (pathA && pathB && pathA !== pathB) {
            return (0, comparers_1.compareAnything)(pathA, pathB, query.normalized);
        }
        // equal
        return 0;
    }
    /*
     * If a query is wrapped in quotes, the user does not want to
     * use fuzzy search for this query.
     */
    function queryExpectsExactMatch(query) {
        return query.startsWith('"') && query.endsWith('"');
    }
    /**
     * Helper function to prepare a search value for scoring by removing unwanted characters
     * and allowing to score on multiple pieces separated by whitespace character.
     */
    const MULTIPLE_QUERY_VALUES_SEPARATOR = ' ';
    function prepareQuery(original) {
        if (typeof original !== 'string') {
            original = '';
        }
        const originalLowercase = original.toLowerCase();
        const { pathNormalized, normalized, normalizedLowercase } = normalizeQuery(original);
        const containsPathSeparator = pathNormalized.indexOf(path_1.sep) >= 0;
        const expectExactMatch = queryExpectsExactMatch(original);
        let values = undefined;
        const originalSplit = original.split(MULTIPLE_QUERY_VALUES_SEPARATOR);
        if (originalSplit.length > 1) {
            for (const originalPiece of originalSplit) {
                const expectExactMatchPiece = queryExpectsExactMatch(originalPiece);
                const { pathNormalized: pathNormalizedPiece, normalized: normalizedPiece, normalizedLowercase: normalizedLowercasePiece } = normalizeQuery(originalPiece);
                if (normalizedPiece) {
                    if (!values) {
                        values = [];
                    }
                    values.push({
                        original: originalPiece,
                        originalLowercase: originalPiece.toLowerCase(),
                        pathNormalized: pathNormalizedPiece,
                        normalized: normalizedPiece,
                        normalizedLowercase: normalizedLowercasePiece,
                        expectContiguousMatch: expectExactMatchPiece
                    });
                }
            }
        }
        return { original, originalLowercase, pathNormalized, normalized, normalizedLowercase, values, containsPathSeparator, expectContiguousMatch: expectExactMatch };
    }
    function normalizeQuery(original) {
        let pathNormalized;
        if (platform_1.isWindows) {
            pathNormalized = original.replace(/\//g, path_1.sep); // Help Windows users to search for paths when using slash
        }
        else {
            pathNormalized = original.replace(/\\/g, path_1.sep); // Help macOS/Linux users to search for paths when using backslash
        }
        // we remove quotes here because quotes are used for exact match search
        const normalized = (0, strings_1.stripWildcards)(pathNormalized).replace(/\s|"/g, '');
        return {
            pathNormalized,
            normalized,
            normalizedLowercase: normalized.toLowerCase()
        };
    }
    function pieceToQuery(arg1) {
        if (Array.isArray(arg1)) {
            return prepareQuery(arg1.map(piece => piece.original).join(MULTIPLE_QUERY_VALUES_SEPARATOR));
        }
        return prepareQuery(arg1.original);
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnV6enlTY29yZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9mdXp6eVNjb3Jlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsZ0NBeUJDO0lBK09ELGtDQVVDO0lBK0ZELHdDQTJCQztJQXdNRCw0REE0REM7SUEwS0Qsb0NBd0NDO0lBc0JELG9DQU1DO0lBcDRCRCxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDbkIsTUFBTSxRQUFRLEdBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFNUMsc0JBQXNCO0lBQ3RCLDhCQUE4QjtJQUU5QixTQUFnQixVQUFVLENBQUMsTUFBYyxFQUFFLEtBQWEsRUFBRSxVQUFrQixFQUFFLHlCQUFrQztRQUMvRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkIsT0FBTyxRQUFRLENBQUMsQ0FBQyxnREFBZ0Q7UUFDbEUsQ0FBQztRQUVELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbkMsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUVqQyxJQUFJLFlBQVksR0FBRyxXQUFXLEVBQUUsQ0FBQztZQUNoQyxPQUFPLFFBQVEsQ0FBQyxDQUFDLGlEQUFpRDtRQUNuRSxDQUFDO1FBRUQsZUFBZTtRQUNmLHdEQUF3RDtRQUN4RCxJQUFJO1FBRUosTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sR0FBRyxHQUFHLFlBQVksQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBRXZILGVBQWU7UUFDZixpRUFB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