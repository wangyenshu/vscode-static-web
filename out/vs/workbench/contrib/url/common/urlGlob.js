/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testUrlMatchesGlob = void 0;
    // TODO: rewrite this to use URIs directly and validate each part individually
    // instead of relying on memoization of the stringified URI.
    const testUrlMatchesGlob = (uri, globUrl) => {
        let url = uri.with({ query: null, fragment: null }).toString(true);
        const normalize = (url) => url.replace(/\/+$/, '');
        globUrl = normalize(globUrl);
        url = normalize(url);
        const memo = Array.from({ length: url.length + 1 }).map(() => Array.from({ length: globUrl.length + 1 }).map(() => undefined));
        if (/^[^./:]*:\/\//.test(globUrl)) {
            return doUrlMatch(memo, url, globUrl, 0, 0);
        }
        const scheme = /^(https?):\/\//.exec(url)?.[1];
        if (scheme) {
            return doUrlMatch(memo, url, `${scheme}://${globUrl}`, 0, 0);
        }
        return false;
    };
    exports.testUrlMatchesGlob = testUrlMatchesGlob;
    const doUrlMatch = (memo, url, globUrl, urlOffset, globUrlOffset) => {
        if (memo[urlOffset]?.[globUrlOffset] !== undefined) {
            return memo[urlOffset][globUrlOffset];
        }
        const options = [];
        // Endgame.
        // Fully exact match
        if (urlOffset === url.length) {
            return globUrlOffset === globUrl.length;
        }
        // Some path remaining in url
        if (globUrlOffset === globUrl.length) {
            const remaining = url.slice(urlOffset);
            return remaining[0] === '/';
        }
        if (url[urlOffset] === globUrl[globUrlOffset]) {
            // Exact match.
            options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset + 1));
        }
        if (globUrl[globUrlOffset] + globUrl[globUrlOffset + 1] === '*.') {
            // Any subdomain match. Either consume one thing that's not a / or : and don't advance base or consume nothing and do.
            if (!['/', ':'].includes(url[urlOffset])) {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset));
            }
            options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 2));
        }
        if (globUrl[globUrlOffset] === '*') {
            // Any match. Either consume one thing and don't advance base or consume nothing and do.
            if (urlOffset + 1 === url.length) {
                // If we're at the end of the input url consume one from both.
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset + 1));
            }
            else {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset));
            }
            options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 1));
        }
        if (globUrl[globUrlOffset] + globUrl[globUrlOffset + 1] === ':*') {
            // any port match. Consume a port if it exists otherwise nothing. Always comsume the base.
            if (url[urlOffset] === ':') {
                let endPortIndex = urlOffset + 1;
                do {
                    endPortIndex++;
                } while (/[0-9]/.test(url[endPortIndex]));
                options.push(doUrlMatch(memo, url, globUrl, endPortIndex, globUrlOffset + 2));
            }
            else {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 2));
            }
        }
        return (memo[urlOffset][globUrlOffset] = options.some(a => a === true));
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsR2xvYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VybC9jb21tb24vdXJsR2xvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsOEVBQThFO0lBQzlFLDREQUE0RDtJQUNyRCxNQUFNLGtCQUFrQixHQUFHLENBQUMsR0FBUSxFQUFFLE9BQWUsRUFBVyxFQUFFO1FBQ3hFLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRSxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0QsT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QixHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXJCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FDNUQsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUMvRCxDQUFDO1FBRUYsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDbkMsT0FBTyxVQUFVLENBQUMsSUFBSSxF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