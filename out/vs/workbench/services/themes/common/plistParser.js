/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parse = parse;
    var ChCode;
    (function (ChCode) {
        ChCode[ChCode["BOM"] = 65279] = "BOM";
        ChCode[ChCode["SPACE"] = 32] = "SPACE";
        ChCode[ChCode["TAB"] = 9] = "TAB";
        ChCode[ChCode["CARRIAGE_RETURN"] = 13] = "CARRIAGE_RETURN";
        ChCode[ChCode["LINE_FEED"] = 10] = "LINE_FEED";
        ChCode[ChCode["SLASH"] = 47] = "SLASH";
        ChCode[ChCode["LESS_THAN"] = 60] = "LESS_THAN";
        ChCode[ChCode["QUESTION_MARK"] = 63] = "QUESTION_MARK";
        ChCode[ChCode["EXCLAMATION_MARK"] = 33] = "EXCLAMATION_MARK";
    })(ChCode || (ChCode = {}));
    var State;
    (function (State) {
        State[State["ROOT_STATE"] = 0] = "ROOT_STATE";
        State[State["DICT_STATE"] = 1] = "DICT_STATE";
        State[State["ARR_STATE"] = 2] = "ARR_STATE";
    })(State || (State = {}));
    /**
     * A very fast plist parser
     */
    function parse(content) {
        return _parse(content, null, null);
    }
    function _parse(content, filename, locationKeyName) {
        const len = content.length;
        let pos = 0;
        let line = 1;
        let char = 0;
        // Skip UTF8 BOM
        if (len > 0 && content.charCodeAt(0) === 65279 /* ChCode.BOM */) {
            pos = 1;
        }
        function advancePosBy(by) {
            if (locationKeyName === null) {
                pos = pos + by;
            }
            else {
                while (by > 0) {
                    const chCode = content.charCodeAt(pos);
                    if (chCode === 10 /* ChCode.LINE_FEED */) {
                        pos++;
                        line++;
                        char = 0;
                    }
                    else {
                        pos++;
                        char++;
                    }
                    by--;
                }
            }
        }
        function advancePosTo(to) {
            if (locationKeyName === null) {
                pos = to;
            }
            else {
                advancePosBy(to - pos);
            }
        }
        function skipWhitespace() {
            while (pos < len) {
                const chCode = content.charCodeAt(pos);
                if (chCode !== 32 /* ChCode.SPACE */ && chCode !== 9 /* ChCode.TAB */ && chCode !== 13 /* ChCode.CARRIAGE_RETURN */ && chCode !== 10 /* ChCode.LINE_FEED */) {
                    break;
                }
                advancePosBy(1);
            }
        }
        function advanceIfStartsWith(str) {
            if (content.substr(pos, str.length) === str) {
                advancePosBy(str.length);
                return true;
            }
            return false;
        }
        function advanceUntil(str) {
            const nextOccurence = content.indexOf(str, pos);
            if (nextOccurence !== -1) {
                advancePosTo(nextOccurence + str.length);
            }
            else {
                // EOF
                advancePosTo(len);
            }
        }
        function captureUntil(str) {
            const nextOccurence = content.indexOf(str, pos);
            if (nextOccurence !== -1) {
                const r = content.substring(pos, nextOccurence);
                advancePosTo(nextOccurence + str.length);
                return r;
            }
            else {
                // EOF
                const r = content.substr(pos);
                advancePosTo(len);
                return r;
            }
        }
        let state = 0 /* State.ROOT_STATE */;
        let cur = null;
        const stateStack = [];
        const objStack = [];
        let curKey = null;
        function pushState(newState, newCur) {
            stateStack.push(state);
            objStack.push(cur);
            state = newState;
            cur = newCur;
        }
        function popState() {
            if (stateStack.length === 0) {
                return fail('illegal state stack');
            }
            state = stateStack.pop();
            cur = objStack.pop();
        }
        function fail(msg) {
            throw new Error('Near offset ' + pos + ': ' + msg + ' ~~~' + content.substr(pos, 50) + '~~~');
        }
        const dictState = {
            enterDict: function () {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                const newDict = {};
                if (locationKeyName !== null) {
                    newDict[locationKeyName] = {
                        filename: filename,
                        line: line,
                        char: char
                    };
                }
                cur[curKey] = newDict;
                curKey = null;
                pushState(1 /* State.DICT_STATE */, newDict);
            },
            enterArray: function () {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                const newArr = [];
                cur[curKey] = newArr;
                curKey = null;
                pushState(2 /* State.ARR_STATE */, newArr);
            }
        };
        const arrState = {
            enterDict: function () {
                const newDict = {};
                if (locationKeyName !== null) {
                    newDict[locationKeyName] = {
                        filename: filename,
                        line: line,
                        char: char
                    };
                }
                cur.push(newDict);
                pushState(1 /* State.DICT_STATE */, newDict);
            },
            enterArray: function () {
                const newArr = [];
                cur.push(newArr);
                pushState(2 /* State.ARR_STATE */, newArr);
            }
        };
        function enterDict() {
            if (state === 1 /* State.DICT_STATE */) {
                dictState.enterDict();
            }
            else if (state === 2 /* State.ARR_STATE */) {
                arrState.enterDict();
            }
            else { // ROOT_STATE
                cur = {};
                if (locationKeyName !== null) {
                    cur[locationKeyName] = {
                        filename: filename,
                        line: line,
                        char: char
                    };
                }
                pushState(1 /* State.DICT_STATE */, cur);
            }
        }
        function leaveDict() {
            if (state === 1 /* State.DICT_STATE */) {
                popState();
            }
            else if (state === 2 /* State.ARR_STATE */) {
                return fail('unexpected </dict>');
            }
            else { // ROOT_STATE
                return fail('unexpected </dict>');
            }
        }
        function enterArray() {
            if (state === 1 /* State.DICT_STATE */) {
                dictState.enterArray();
            }
            else if (state === 2 /* State.ARR_STATE */) {
                arrState.enterArray();
            }
            else { // ROOT_STATE
                cur = [];
                pushState(2 /* State.ARR_STATE */, cur);
            }
        }
        function leaveArray() {
            if (state === 1 /* State.DICT_STATE */) {
                return fail('unexpected </array>');
            }
            else if (state === 2 /* State.ARR_STATE */) {
                popState();
            }
            else { // ROOT_STATE
                return fail('unexpected </array>');
            }
        }
        function acceptKey(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey !== null) {
                    return fail('too many <key>');
                }
                curKey = val;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                return fail('unexpected <key>');
            }
            else { // ROOT_STATE
                return fail('unexpected <key>');
            }
        }
        function acceptString(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptReal(val) {
            if (isNaN(val)) {
                return fail('cannot parse float');
            }
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptInteger(val) {
            if (isNaN(val)) {
                return fail('cannot parse integer');
            }
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptDate(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptData(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptBool(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function escapeVal(str) {
            return str.replace(/&#([0-9]+);/g, function (_, m0) {
                return String.fromCodePoint(parseInt(m0, 10));
            }).replace(/&#x([0-9a-f]+);/g, function (_, m0) {
                return String.fromCodePoint(parseInt(m0, 16));
            }).replace(/&amp;|&lt;|&gt;|&quot;|&apos;/g, function (_) {
                switch (_) {
                    case '&amp;': return '&';
                    case '&lt;': return '<';
                    case '&gt;': return '>';
                    case '&quot;': return '"';
                    case '&apos;': return '\'';
                }
                return _;
            });
        }
        function parseOpenTag() {
            let r = captureUntil('>');
            let isClosed = false;
            if (r.charCodeAt(r.length - 1) === 47 /* ChCode.SLASH */) {
                isClosed = true;
                r = r.substring(0, r.length - 1);
            }
            return {
                name: r.trim(),
                isClosed: isClosed
            };
        }
        function parseTagValue(tag) {
            if (tag.isClosed) {
                return '';
            }
            const val = captureUntil('</');
            advanceUntil('>');
            return escapeVal(val);
        }
        while (pos < len) {
            skipWhitespace();
            if (pos >= len) {
                break;
            }
            const chCode = content.charCodeAt(pos);
            advancePosBy(1);
            if (chCode !== 60 /* ChCode.LESS_THAN */) {
                return fail('expected <');
            }
            if (pos >= len) {
                return fail('unexpected end of input');
            }
            const peekChCode = content.charCodeAt(pos);
            if (peekChCode === 63 /* ChCode.QUESTION_MARK */) {
                advancePosBy(1);
                advanceUntil('?>');
                continue;
            }
            if (peekChCode === 33 /* ChCode.EXCLAMATION_MARK */) {
                advancePosBy(1);
                if (advanceIfStartsWith('--')) {
                    advanceUntil('-->');
                    continue;
                }
                advanceUntil('>');
                continue;
            }
            if (peekChCode === 47 /* ChCode.SLASH */) {
                advancePosBy(1);
                skipWhitespace();
                if (advanceIfStartsWith('plist')) {
                    advanceUntil('>');
                    continue;
                }
                if (advanceIfStartsWith('dict')) {
                    advanceUntil('>');
                    leaveDict();
                    continue;
                }
                if (advanceIfStartsWith('array')) {
                    advanceUntil('>');
                    leaveArray();
                    continue;
                }
                return fail('unexpected closed tag');
            }
            const tag = parseOpenTag();
            switch (tag.name) {
                case 'dict':
                    enterDict();
                    if (tag.isClosed) {
                        leaveDict();
                    }
                    continue;
                case 'array':
                    enterArray();
                    if (tag.isClosed) {
                        leaveArray();
                    }
                    continue;
                case 'key':
                    acceptKey(parseTagValue(tag));
                    continue;
                case 'string':
                    acceptString(parseTagValue(tag));
                    continue;
                case 'real':
                    acceptReal(parseFloat(parseTagValue(tag)));
                    continue;
                case 'integer':
                    acceptInteger(parseInt(parseTagValue(tag), 10));
                    continue;
                case 'date':
                    acceptDate(new Date(parseTagValue(tag)));
                    continue;
                case 'data':
                    acceptData(parseTagValue(tag));
                    continue;
                case 'true':
                    parseTagValue(tag);
                    acceptBool(true);
                    continue;
                case 'false':
                    parseTagValue(tag);
                    acceptBool(false);
                    continue;
            }
            if (/^plist/.test(tag.name)) {
                continue;
            }
            return fail('unexpected opened tag ' + tag.name);
        }
        return cur;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxpc3RQYXJzZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2NvbW1vbi9wbGlzdFBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXlCaEcsc0JBRUM7SUF6QkQsSUFBVyxNQWFWO0lBYkQsV0FBVyxNQUFNO1FBQ2hCLHFDQUFXLENBQUE7UUFFWCxzQ0FBVSxDQUFBO1FBQ1YsaUNBQU8sQ0FBQTtRQUNQLDBEQUFvQixDQUFBO1FBQ3BCLDhDQUFjLENBQUE7UUFFZCxzQ0FBVSxDQUFBO1FBRVYsOENBQWMsQ0FBQTtRQUNkLHNEQUFrQixDQUFBO1FBQ2xCLDREQUFxQixDQUFBO0lBQ3RCLENBQUMsRUFiVSxNQUFNLEtBQU4sTUFBTSxRQWFoQjtJQUVELElBQVcsS0FJVjtJQUpELFdBQVcsS0FBSztRQUNmLDZDQUFjLENBQUE7UUFDZCw2Q0FBYyxDQUFBO1FBQ2QsMkNBQWEsQ0FBQTtJQUNkLENBQUMsRUFKVSxLQUFLLEtBQUwsS0FBSyxRQUlmO0lBQ0Q7O09BRUc7SUFDSCxTQUFnQixLQUFLLENBQUMsT0FBZTtRQUNwQyxPQUFPLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxTQUFTLE1BQU0sQ0FBQyxPQUFlLEVBQUUsUUFBdUIsRUFBRSxlQUE4QjtRQUN2RixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBRTNCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNaLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNiLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztRQUViLGdCQUFnQjtRQUNoQixJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLFVB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