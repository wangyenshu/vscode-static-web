/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fromNow = fromNow;
    exports.getDurationString = getDurationString;
    exports.toLocalISOString = toLocalISOString;
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    /**
     * Create a localized difference of the time between now and the specified date.
     * @param date The date to generate the difference from.
     * @param appendAgoLabel Whether to append the " ago" to the end.
     * @param useFullTimeWords Whether to use full words (eg. seconds) instead of
     * shortened (eg. secs).
     * @param disallowNow Whether to disallow the string "now" when the difference
     * is less than 30 seconds.
     */
    function fromNow(date, appendAgoLabel, useFullTimeWords, disallowNow) {
        if (typeof date !== 'number') {
            date = date.getTime();
        }
        const seconds = Math.round((new Date().getTime() - date) / 1000);
        if (seconds < -30) {
            return (0, nls_1.localize)('date.fromNow.in', 'in {0}', fromNow(new Date().getTime() + seconds * 1000, false));
        }
        if (!disallowNow && seconds < 30) {
            return (0, nls_1.localize)('date.fromNow.now', 'now');
        }
        let value;
        if (seconds < minute) {
            value = seconds;
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.seconds.singular.ago.fullWord', '{0} second ago', value)
                        : (0, nls_1.localize)('date.fromNow.seconds.singular.ago', '{0} sec ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.seconds.plural.ago.fullWord', '{0} seconds ago', value)
                        : (0, nls_1.localize)('date.fromNow.seconds.plural.ago', '{0} secs ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.seconds.singular.fullWord', '{0} second', value)
                        : (0, nls_1.localize)('date.fromNow.seconds.singular', '{0} sec', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.seconds.plural.fullWord', '{0} seconds', value)
                        : (0, nls_1.localize)('date.fromNow.seconds.plural', '{0} secs', value);
                }
            }
        }
        if (seconds < hour) {
            value = Math.floor(seconds / minute);
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.minutes.singular.ago.fullWord', '{0} minute ago', value)
                        : (0, nls_1.localize)('date.fromNow.minutes.singular.ago', '{0} min ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.minutes.plural.ago.fullWord', '{0} minutes ago', value)
                        : (0, nls_1.localize)('date.fromNow.minutes.plural.ago', '{0} mins ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.minutes.singular.fullWord', '{0} minute', value)
                        : (0, nls_1.localize)('date.fromNow.minutes.singular', '{0} min', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.minutes.plural.fullWord', '{0} minutes', value)
                        : (0, nls_1.localize)('date.fromNow.minutes.plural', '{0} mins', value);
                }
            }
        }
        if (seconds < day) {
            value = Math.floor(seconds / hour);
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.hours.singular.ago.fullWord', '{0} hour ago', value)
                        : (0, nls_1.localize)('date.fromNow.hours.singular.ago', '{0} hr ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.hours.plural.ago.fullWord', '{0} hours ago', value)
                        : (0, nls_1.localize)('date.fromNow.hours.plural.ago', '{0} hrs ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.hours.singular.fullWord', '{0} hour', value)
                        : (0, nls_1.localize)('date.fromNow.hours.singular', '{0} hr', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.hours.plural.fullWord', '{0} hours', value)
                        : (0, nls_1.localize)('date.fromNow.hours.plural', '{0} hrs', value);
                }
            }
        }
        if (seconds < week) {
            value = Math.floor(seconds / day);
            if (appendAgoLabel) {
                return value === 1
                    ? (0, nls_1.localize)('date.fromNow.days.singular.ago', '{0} day ago', value)
                    : (0, nls_1.localize)('date.fromNow.days.plural.ago', '{0} days ago', value);
            }
            else {
                return value === 1
                    ? (0, nls_1.localize)('date.fromNow.days.singular', '{0} day', value)
                    : (0, nls_1.localize)('date.fromNow.days.plural', '{0} days', value);
            }
        }
        if (seconds < month) {
            value = Math.floor(seconds / week);
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.weeks.singular.ago.fullWord', '{0} week ago', value)
                        : (0, nls_1.localize)('date.fromNow.weeks.singular.ago', '{0} wk ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.weeks.plural.ago.fullWord', '{0} weeks ago', value)
                        : (0, nls_1.localize)('date.fromNow.weeks.plural.ago', '{0} wks ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.weeks.singular.fullWord', '{0} week', value)
                        : (0, nls_1.localize)('date.fromNow.weeks.singular', '{0} wk', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.weeks.plural.fullWord', '{0} weeks', value)
                        : (0, nls_1.localize)('date.fromNow.weeks.plural', '{0} wks', value);
                }
            }
        }
        if (seconds < year) {
            value = Math.floor(seconds / month);
            if (appendAgoLabel) {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.months.singular.ago.fullWord', '{0} month ago', value)
                        : (0, nls_1.localize)('date.fromNow.months.singular.ago', '{0} mo ago', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.months.plural.ago.fullWord', '{0} months ago', value)
                        : (0, nls_1.localize)('date.fromNow.months.plural.ago', '{0} mos ago', value);
                }
            }
            else {
                if (value === 1) {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.months.singular.fullWord', '{0} month', value)
                        : (0, nls_1.localize)('date.fromNow.months.singular', '{0} mo', value);
                }
                else {
                    return useFullTimeWords
                        ? (0, nls_1.localize)('date.fromNow.months.plural.fullWord', '{0} months', value)
                        : (0, nls_1.localize)('date.fromNow.months.plural', '{0} mos', value);
                }
            }
        }
        value = Math.floor(seconds / year);
        if (appendAgoLabel) {
            if (value === 1) {
                return useFullTimeWords
                    ? (0, nls_1.localize)('date.fromNow.years.singular.ago.fullWord', '{0} year ago', value)
                    : (0, nls_1.localize)('date.fromNow.years.singular.ago', '{0} yr ago', value);
            }
            else {
                return useFullTimeWords
                    ? (0, nls_1.localize)('date.fromNow.years.plural.ago.fullWord', '{0} years ago', value)
                    : (0, nls_1.localize)('date.fromNow.years.plural.ago', '{0} yrs ago', value);
            }
        }
        else {
            if (value === 1) {
                return useFullTimeWords
                    ? (0, nls_1.localize)('date.fromNow.years.singular.fullWord', '{0} year', value)
                    : (0, nls_1.localize)('date.fromNow.years.singular', '{0} yr', value);
            }
            else {
                return useFullTimeWords
                    ? (0, nls_1.localize)('date.fromNow.years.plural.fullWord', '{0} years', value)
                    : (0, nls_1.localize)('date.fromNow.years.plural', '{0} yrs', value);
            }
        }
    }
    /**
     * Gets a readable duration with intelligent/lossy precision. For example "40ms" or "3.040s")
     * @param ms The duration to get in milliseconds.
     * @param useFullTimeWords Whether to use full words (eg. seconds) instead of
     * shortened (eg. secs).
     */
    function getDurationString(ms, useFullTimeWords) {
        const seconds = Math.abs(ms / 1000);
        if (seconds < 1) {
            return useFullTimeWords
                ? (0, nls_1.localize)('duration.ms.full', '{0} milliseconds', ms)
                : (0, nls_1.localize)('duration.ms', '{0}ms', ms);
        }
        if (seconds < minute) {
            return useFullTimeWords
                ? (0, nls_1.localize)('duration.s.full', '{0} seconds', Math.round(ms) / 1000)
                : (0, nls_1.localize)('duration.s', '{0}s', Math.round(ms) / 1000);
        }
        if (seconds < hour) {
            return useFullTimeWords
                ? (0, nls_1.localize)('duration.m.full', '{0} minutes', Math.round(ms / (1000 * minute)))
                : (0, nls_1.localize)('duration.m', '{0} mins', Math.round(ms / (1000 * minute)));
        }
        if (seconds < day) {
            return useFullTimeWords
                ? (0, nls_1.localize)('duration.h.full', '{0} hours', Math.round(ms / (1000 * hour)))
                : (0, nls_1.localize)('duration.h', '{0} hrs', Math.round(ms / (1000 * hour)));
        }
        return (0, nls_1.localize)('duration.d', '{0} days', Math.round(ms / (1000 * day)));
    }
    function toLocalISOString(date) {
        return date.getFullYear() +
            '-' + String(date.getMonth() + 1).padStart(2, '0') +
            '-' + String(date.getDate()).padStart(2, '0') +
            'T' + String(date.getHours()).padStart(2, '0') +
            ':' + String(date.getMinutes()).padStart(2, '0') +
            ':' + String(date.getSeconds()).padStart(2, '0') +
            '.' + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
            'Z';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQmhHLDBCQWdMQztJQVFELDhDQXVCQztJQUVELDRDQVNDO0lBMU9ELE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNsQixNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDdEIsTUFBTSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNyQixNQUFNLEtBQUssR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFFdkI7Ozs7Ozs7O09BUUc7SUFDSCxTQUFnQixPQUFPLENBQUMsSUFBbUIsRUFBRSxjQUF3QixFQUFFLGdCQUEwQixFQUFFLFdBQXFCO1FBQ3ZILElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDakUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNuQixPQUFPLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxPQUFPLEdBQUcsSUFBSSxFQUFFLEtBQUssQ0FB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