/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetParser = exports.TextmateSnippet = exports.Variable = exports.FormatString = exports.Transform = exports.Choice = exports.Placeholder = exports.TransformableMarker = exports.Text = exports.Marker = exports.Scanner = exports.TokenType = void 0;
    var TokenType;
    (function (TokenType) {
        TokenType[TokenType["Dollar"] = 0] = "Dollar";
        TokenType[TokenType["Colon"] = 1] = "Colon";
        TokenType[TokenType["Comma"] = 2] = "Comma";
        TokenType[TokenType["CurlyOpen"] = 3] = "CurlyOpen";
        TokenType[TokenType["CurlyClose"] = 4] = "CurlyClose";
        TokenType[TokenType["Backslash"] = 5] = "Backslash";
        TokenType[TokenType["Forwardslash"] = 6] = "Forwardslash";
        TokenType[TokenType["Pipe"] = 7] = "Pipe";
        TokenType[TokenType["Int"] = 8] = "Int";
        TokenType[TokenType["VariableName"] = 9] = "VariableName";
        TokenType[TokenType["Format"] = 10] = "Format";
        TokenType[TokenType["Plus"] = 11] = "Plus";
        TokenType[TokenType["Dash"] = 12] = "Dash";
        TokenType[TokenType["QuestionMark"] = 13] = "QuestionMark";
        TokenType[TokenType["EOF"] = 14] = "EOF";
    })(TokenType || (exports.TokenType = TokenType = {}));
    class Scanner {
        constructor() {
            this.value = '';
            this.pos = 0;
        }
        static { this._table = {
            [36 /* CharCode.DollarSign */]: 0 /* TokenType.Dollar */,
            [58 /* CharCode.Colon */]: 1 /* TokenType.Colon */,
            [44 /* CharCode.Comma */]: 2 /* TokenType.Comma */,
            [123 /* CharCode.OpenCurlyBrace */]: 3 /* TokenType.CurlyOpen */,
            [125 /* CharCode.CloseCurlyBrace */]: 4 /* TokenType.CurlyClose */,
            [92 /* CharCode.Backslash */]: 5 /* TokenType.Backslash */,
            [47 /* CharCode.Slash */]: 6 /* TokenType.Forwardslash */,
            [124 /* CharCode.Pipe */]: 7 /* TokenType.Pipe */,
            [43 /* CharCode.Plus */]: 11 /* TokenType.Plus */,
            [45 /* CharCode.Dash */]: 12 /* TokenType.Dash */,
            [63 /* CharCode.QuestionMark */]: 13 /* TokenType.QuestionMark */,
        }; }
        static isDigitCharacter(ch) {
            return ch >= 48 /* CharCode.Digit0 */ && ch <= 57 /* CharCode.Digit9 */;
        }
        static isVariableCharacter(ch) {
            return ch === 95 /* CharCode.Underline */
                || (ch >= 97 /* CharCode.a */ && ch <= 122 /* CharCode.z */)
                || (ch >= 65 /* CharCode.A */ && ch <= 90 /* CharCode.Z */);
        }
        text(value) {
            this.value = value;
            this.pos = 0;
        }
        tokenText(token) {
            return this.value.substr(token.pos, token.len);
        }
        next() {
            if (this.pos >= this.value.length) {
                return { type: 14 /* TokenType.EOF */, pos: this.pos, len: 0 };
            }
            const pos = this.pos;
            let len = 0;
            let ch = this.value.charCodeAt(pos);
            let type;
            // static types
            type = Scanner._table[ch];
            if (typeof type === 'number') {
                this.pos += 1;
                return { type, pos, len: 1 };
            }
            // number
            if (Scanner.isDigitCharacter(ch)) {
                type = 8 /* TokenType.Int */;
                do {
                    len += 1;
                    ch = this.value.charCodeAt(pos + len);
                } while (Scanner.isDigitCharacter(ch));
                this.pos += len;
                return { type, pos, len };
            }
            // variable name
            if (Scanner.isVariableCharacter(ch)) {
                type = 9 /* TokenType.VariableName */;
                do {
                    ch = this.value.charCodeAt(pos + (++len));
                } while (Scanner.isVariableCharacter(ch) || Scanner.isDigitCharacter(ch));
                this.pos += len;
                return { type, pos, len };
            }
            // format
            type = 10 /* TokenType.Format */;
            do {
                len += 1;
                ch = this.value.charCodeAt(pos + len);
            } while (!isNaN(ch)
                && typeof Scanner._table[ch] === 'undefined' // not static token
                && !Scanner.isDigitCharacter(ch) // not number
                && !Scanner.isVariableCharacter(ch) // not variable
            );
            this.pos += len;
            return { type, pos, len };
        }
    }
    exports.Scanner = Scanner;
    class Marker {
        constructor() {
            this._children = [];
        }
        appendChild(child) {
            if (child instanceof Text && this._children[this._children.length - 1] instanceof Text) {
                // this and previous child are text -> merge them
                this._children[this._children.length - 1].value += child.value;
            }
            else {
                // normal adoption of child
                child.parent = this;
                this._children.push(child);
            }
            return this;
        }
        replace(child, others) {
            const { parent } = child;
            const idx = parent.children.indexOf(child);
            const newChildren = parent.children.slice(0);
            newChildren.splice(idx, 1, ...others);
            parent._children = newChildren;
            (function _fixParent(children, parent) {
                for (const child of children) {
                    child.parent = parent;
                    _fixParent(child.children, child);
                }
            })(others, parent);
        }
        get children() {
            return this._children;
        }
        get rightMostDescendant() {
            if (this._children.length > 0) {
                return this._children[this._children.length - 1].rightMostDescendant;
            }
            return this;
        }
        get snippet() {
            let candidate = this;
            while (true) {
                if (!candidate) {
                    return undefined;
                }
                if (candidate instanceof TextmateSnippet) {
                    return candidate;
                }
                candidate = candidate.parent;
            }
        }
        toString() {
            return this.children.reduce((prev, cur) => prev + cur.toString(), '');
        }
        len() {
            return 0;
        }
    }
    exports.Marker = Marker;
    class Text extends Marker {
        static escape(value) {
            return value.replace(/\$|}|\\/g, '\\$&');
        }
        constructor(value) {
            super();
            this.value = value;
        }
        toString() {
            return this.value;
        }
        toTextmateString() {
            return Text.escape(this.value);
        }
        len() {
            return this.value.length;
        }
        clone() {
            return new Text(this.value);
        }
    }
    exports.Text = Text;
    class TransformableMarker extends Marker {
    }
    exports.TransformableMarker = TransformableMarker;
    class Placeholder extends TransformableMarker {
        static compareByIndex(a, b) {
            if (a.index === b.index) {
                return 0;
            }
            else if (a.isFinalTabstop) {
                return 1;
            }
            else if (b.isFinalTabstop) {
                return -1;
            }
            else if (a.index < b.index) {
                return -1;
            }
            else if (a.index > b.index) {
                return 1;
            }
            else {
                return 0;
            }
        }
        constructor(index) {
            super();
            this.index = index;
        }
        get isFinalTabstop() {
            return this.index === 0;
        }
        get choice() {
            return this._children.length === 1 && this._children[0] instanceof Choice
                ? this._children[0]
                : undefined;
        }
        toTextmateString() {
            let transformString = '';
            if (this.transform) {
                transformString = this.transform.toTextmateString();
            }
            if (this.children.length === 0 && !this.transform) {
                return `\$${this.index}`;
            }
            else if (this.children.length === 0) {
                return `\${${this.index}${transformString}}`;
            }
            else if (this.choice) {
                return `\${${this.index}|${this.choice.toTextmateString()}|${transformString}}`;
            }
            else {
                return `\${${this.index}:${this.children.map(child => child.toTextmateString()).join('')}${transformString}}`;
            }
        }
        clone() {
            const ret = new Placeholder(this.index);
            if (this.transform) {
                ret.transform = this.transform.clone();
            }
            ret._children = this.children.map(child => child.clone());
            return ret;
        }
    }
    exports.Placeholder = Placeholder;
    class Choice extends Marker {
        constructor() {
            super(...arguments);
            this.options = [];
        }
        appendChild(marker) {
            if (marker instanceof Text) {
                marker.parent = this;
                this.options.push(marker);
            }
            return this;
        }
        toString() {
            return this.options[0].value;
        }
        toTextmateString() {
            return this.options
                .map(option => option.value.replace(/\||,|\\/g, '\\$&'))
                .join(',');
        }
        len() {
            return this.options[0].len();
        }
        clone() {
            const ret = new Choice();
            this.options.forEach(ret.appendChild, ret);
            return ret;
        }
    }
    exports.Choice = Choice;
    class Transform extends Marker {
        constructor() {
            super(...arguments);
            this.regexp = new RegExp('');
        }
        resolve(value) {
            const _this = this;
            let didMatch = false;
            let ret = value.replace(this.regexp, function () {
                didMatch = true;
                return _this._replace(Array.prototype.slice.call(arguments, 0, -2));
            });
            // when the regex didn't match and when the transform has
            // else branches, then run those
            if (!didMatch && this._children.some(child => child instanceof FormatString && Boolean(child.elseValue))) {
                ret = this._replace([]);
            }
            return ret;
        }
        _replace(groups) {
            let ret = '';
            for (const marker of this._children) {
                if (marker instanceof FormatString) {
                    let value = groups[marker.index] || '';
                    value = marker.resolve(value);
                    ret += value;
                }
                else {
                    ret += marker.toString();
                }
            }
            return ret;
        }
        toString() {
            return '';
        }
        toTextmateString() {
            return `/${this.regexp.source}/${this.children.map(c => c.toTextmateString())}/${(this.regexp.ignoreCase ? 'i' : '') + (this.regexp.global ? 'g' : '')}`;
        }
        clone() {
            const ret = new Transform();
            ret.regexp = new RegExp(this.regexp.source, '' + (this.regexp.ignoreCase ? 'i' : '') + (this.regexp.global ? 'g' : ''));
            ret._children = this.children.map(child => child.clone());
            return ret;
        }
    }
    exports.Transform = Transform;
    class FormatString extends Marker {
        constructor(index, shorthandName, ifValue, elseValue) {
            super();
            this.index = index;
            this.shorthandName = shorthandName;
            this.ifValue = ifValue;
            this.elseValue = elseValue;
        }
        resolve(value) {
            if (this.shorthandName === 'upcase') {
                return !value ? '' : value.toLocaleUpperCase();
            }
            else if (this.shorthandName === 'downcase') {
                return !value ? '' : value.toLocaleLowerCase();
            }
            else if (this.shorthandName === 'capitalize') {
                return !value ? '' : (value[0].toLocaleUpperCase() + value.substr(1));
            }
            else if (this.shorthandName === 'pascalcase') {
                return !value ? '' : this._toPascalCase(value);
            }
            else if (this.shorthandName === 'camelcase') {
                return !value ? '' : this._toCamelCase(value);
            }
            else if (Boolean(value) && typeof this.ifValue === 'string') {
                return this.ifValue;
            }
            else if (!Boolean(value) && typeof this.elseValue === 'string') {
                return this.elseValue;
            }
            else {
                return value || '';
            }
        }
        _toPascalCase(value) {
            const match = value.match(/[a-z0-9]+/gi);
            if (!match) {
                return value;
            }
            return match.map(word => {
                return word.charAt(0).toUpperCase() + word.substr(1);
            })
                .join('');
        }
        _toCamelCase(value) {
            const match = value.match(/[a-z0-9]+/gi);
            if (!match) {
                return value;
            }
            return match.map((word, index) => {
                if (index === 0) {
                    return word.charAt(0).toLowerCase() + word.substr(1);
                }
                return word.charAt(0).toUpperCase() + word.substr(1);
            })
                .join('');
        }
        toTextmateString() {
            let value = '${';
            value += this.index;
            if (this.shorthandName) {
                value += `:/${this.shorthandName}`;
            }
            else if (this.ifValue && this.elseValue) {
                value += `:?${this.ifValue}:${this.elseValue}`;
            }
            else if (this.ifValue) {
                value += `:+${this.ifValue}`;
            }
            else if (this.elseValue) {
                value += `:-${this.elseValue}`;
            }
            value += '}';
            return value;
        }
        clone() {
            const ret = new FormatString(this.index, this.shorthandName, this.ifValue, this.elseValue);
            return ret;
        }
    }
    exports.FormatString = FormatString;
    class Variable extends TransformableMarker {
        constructor(name) {
            super();
            this.name = name;
        }
        resolve(resolver) {
            let value = resolver.resolve(this);
            if (this.transform) {
                value = this.transform.resolve(value || '');
            }
            if (value !== undefined) {
                this._children = [new Text(value)];
                return true;
            }
            return false;
        }
        toTextmateString() {
            let transformString = '';
            if (this.transform) {
                transformString = this.transform.toTextmateString();
            }
            if (this.children.length === 0) {
                return `\${${this.name}${transformString}}`;
            }
            else {
                return `\${${this.name}:${this.children.map(child => child.toTextmateString()).join('')}${transformString}}`;
            }
        }
        clone() {
            const ret = new Variable(this.name);
            if (this.transform) {
                ret.transform = this.transform.clone();
            }
            ret._children = this.children.map(child => child.clone());
            return ret;
        }
    }
    exports.Variable = Variable;
    function walk(marker, visitor) {
        const stack = [...marker];
        while (stack.length > 0) {
            const marker = stack.shift();
            const recurse = visitor(marker);
            if (!recurse) {
                break;
            }
            stack.unshift(...marker.children);
        }
    }
    class TextmateSnippet extends Marker {
        get placeholderInfo() {
            if (!this._placeholders) {
                // fill in placeholders
                const all = [];
                let last;
                this.walk(function (candidate) {
                    if (candidate instanceof Placeholder) {
                        all.push(candidate);
                        last = !last || last.index < candidate.index ? candidate : last;
                    }
                    return true;
                });
                this._placeholders = { all, last };
            }
            return this._placeholders;
        }
        get placeholders() {
            const { all } = this.placeholderInfo;
            return all;
        }
        offset(marker) {
            let pos = 0;
            let found = false;
            this.walk(candidate => {
                if (candidate === marker) {
                    found = true;
                    return false;
                }
                pos += candidate.len();
                return true;
            });
            if (!found) {
                return -1;
            }
            return pos;
        }
        fullLen(marker) {
            let ret = 0;
            walk([marker], marker => {
                ret += marker.len();
                return true;
            });
            return ret;
        }
        enclosingPlaceholders(placeholder) {
            const ret = [];
            let { parent } = placeholder;
            while (parent) {
                if (parent instanceof Placeholder) {
                    ret.push(parent);
                }
                parent = parent.parent;
            }
            return ret;
        }
        resolveVariables(resolver) {
            this.walk(candidate => {
                if (candidate instanceof Variable) {
                    if (candidate.resolve(resolver)) {
                        this._placeholders = undefined;
                    }
                }
                return true;
            });
            return this;
        }
        appendChild(child) {
            this._placeholders = undefined;
            return super.appendChild(child);
        }
        replace(child, others) {
            this._placeholders = undefined;
            return super.replace(child, others);
        }
        toTextmateString() {
            return this.children.reduce((prev, cur) => prev + cur.toTextmateString(), '');
        }
        clone() {
            const ret = new TextmateSnippet();
            this._children = this.children.map(child => child.clone());
            return ret;
        }
        walk(visitor) {
            walk(this.children, visitor);
        }
    }
    exports.TextmateSnippet = TextmateSnippet;
    class SnippetParser {
        constructor() {
            this._scanner = new Scanner();
            this._token = { type: 14 /* TokenType.EOF */, pos: 0, len: 0 };
        }
        static escape(value) {
            return value.replace(/\$|}|\\/g, '\\$&');
        }
        /**
         * Takes a snippet and returns the insertable string, e.g return the snippet-string
         * without any placeholder, tabstop, variables etc...
         */
        static asInsertText(value) {
            return new SnippetParser().parse(value).toString();
        }
        static guessNeedsClipboard(template) {
            return /\${?CLIPBOARD/.test(template);
        }
        parse(value, insertFinalTabstop, enforceFinalTabstop) {
            const snippet = new TextmateSnippet();
            this.parseFragment(value, snippet);
            this.ensureFinalTabstop(snippet, enforceFinalTabstop ?? false, insertFinalTabstop ?? false);
            return snippet;
        }
        parseFragment(value, snippet) {
            const offset = snippet.children.length;
            this._scanner.text(value);
            this._token = this._scanner.next();
            while (this._parse(snippet)) {
                // nothing
            }
            // fill in values for placeholders. the first placeholder of an index
            // that has a value defines the value for all placeholders with that index
            const placeholderDefaultValues = new Map();
            const incompletePlaceholders = [];
            snippet.walk(marker => {
                if (marker instanceof Placeholder) {
                    if (marker.isFinalTabstop) {
                        placeholderDefaultValues.set(0, undefined);
                    }
                    else if (!placeholderDefaultValues.has(marker.index) && marker.children.length > 0) {
                        placeholderDefaultValues.set(marker.index, marker.children);
                    }
                    else {
                        incompletePlaceholders.push(marker);
                    }
                }
                return true;
            });
            const fillInIncompletePlaceholder = (placeholder, stack) => {
                const defaultValues = placeholderDefaultValues.get(placeholder.index);
                if (!defaultValues) {
                    return;
                }
                const clone = new Placeholder(placeholder.index);
                clone.transform = placeholder.transform;
                for (const child of defaultValues) {
                    const newChild = child.clone();
                    clone.appendChild(newChild);
                    // "recurse" on children that are again placeholders
                    if (newChild instanceof Placeholder && placeholderDefaultValues.has(newChild.index) && !stack.has(newChild.index)) {
                        stack.add(newChild.index);
                        fillInIncompletePlaceholder(newChild, stack);
                        stack.delete(newChild.index);
                    }
                }
                snippet.replace(placeholder, [clone]);
            };
            const stack = new Set();
            for (const placeholder of incompletePlaceholders) {
                fillInIncompletePlaceholder(placeholder, stack);
            }
            return snippet.children.slice(offset);
        }
        ensureFinalTabstop(snippet, enforceFinalTabstop, insertFinalTabstop) {
            if (enforceFinalTabstop || insertFinalTabstop && snippet.placeholders.length > 0) {
                const finalTabstop = snippet.placeholders.find(p => p.index === 0);
                if (!finalTabstop) {
                    // the snippet uses placeholders but has no
                    // final tabstop defined -> insert at the end
                    snippet.appendChild(new Placeholder(0));
                }
            }
        }
        _accept(type, value) {
            if (type === undefined || this._token.type === type) {
                const ret = !value ? true : this._scanner.tokenText(this._token);
                this._token = this._scanner.next();
                return ret;
            }
            return false;
        }
        _backTo(token) {
            this._scanner.pos = token.pos + token.len;
            this._token = token;
            return false;
        }
        _until(type) {
            const start = this._token;
            while (this._token.type !== type) {
                if (this._token.type === 14 /* TokenType.EOF */) {
                    return false;
                }
                else if (this._token.type === 5 /* TokenType.Backslash */) {
                    const nextToken = this._scanner.next();
                    if (nextToken.type !== 0 /* TokenType.Dollar */
                        && nextToken.type !== 4 /* TokenType.CurlyClose */
                        && nextToken.type !== 5 /* TokenType.Backslash */) {
                        return false;
                    }
                }
                this._token = this._scanner.next();
            }
            const value = this._scanner.value.substring(start.pos, this._token.pos).replace(/\\(\$|}|\\)/g, '$1');
            this._token = this._scanner.next();
            return value;
        }
        _parse(marker) {
            return this._parseEscaped(marker)
                || this._parseTabstopOrVariableName(marker)
                || this._parseComplexPlaceholder(marker)
                || this._parseComplexVariable(marker)
                || this._parseAnything(marker);
        }
        // \$, \\, \} -> just text
        _parseEscaped(marker) {
            let value;
            if (value = this._accept(5 /* TokenType.Backslash */, true)) {
                // saw a backslash, append escaped token or that backslash
                value = this._accept(0 /* TokenType.Dollar */, true)
                    || this._accept(4 /* TokenType.CurlyClose */, true)
                    || this._accept(5 /* TokenType.Backslash */, true)
                    || value;
                marker.appendChild(new Text(value));
                return true;
            }
            return false;
        }
        // $foo -> variable, $1 -> tabstop
        _parseTabstopOrVariableName(parent) {
            let value;
            const token = this._token;
            const match = this._accept(0 /* TokenType.Dollar */)
                && (value = this._accept(9 /* TokenType.VariableName */, true) || this._accept(8 /* TokenType.Int */, true));
            if (!match) {
                return this._backTo(token);
            }
            parent.appendChild(/^\d+$/.test(value)
                ? new Placeholder(Number(value))
                : new Variable(value));
            return true;
        }
        // ${1:<children>}, ${1} -> placeholder
        _parseComplexPlaceholder(parent) {
            let index;
            const token = this._token;
            const match = this._accept(0 /* TokenType.Dollar */)
                && this._accept(3 /* TokenType.CurlyOpen */)
                && (index = this._accept(8 /* TokenType.Int */, true));
            if (!match) {
                return this._backTo(token);
            }
            const placeholder = new Placeholder(Number(index));
            if (this._accept(1 /* TokenType.Colon */)) {
                // ${1:<children>}
                while (true) {
                    // ...} -> done
                    if (this._accept(4 /* TokenType.CurlyClose */)) {
                        parent.appendChild(placeholder);
                        return true;
                    }
                    if (this._parse(placeholder)) {
                        continue;
                    }
                    // fallback
                    parent.appendChild(new Text('${' + index + ':'));
                    placeholder.children.forEach(parent.appendChild, parent);
                    return true;
                }
            }
            else if (placeholder.index > 0 && this._accept(7 /* TokenType.Pipe */)) {
                // ${1|one,two,three|}
                const choice = new Choice();
                while (true) {
                    if (this._parseChoiceElement(choice)) {
                        if (this._accept(2 /* TokenType.Comma */)) {
                            // opt, -> more
                            continue;
                        }
                        if (this._accept(7 /* TokenType.Pipe */)) {
                            placeholder.appendChild(choice);
                            if (this._accept(4 /* TokenType.CurlyClose */)) {
                                // ..|} -> done
                                parent.appendChild(placeholder);
                                return true;
                            }
                        }
                    }
                    this._backTo(token);
                    return false;
                }
            }
            else if (this._accept(6 /* TokenType.Forwardslash */)) {
                // ${1/<regex>/<format>/<options>}
                if (this._parseTransform(placeholder)) {
                    parent.appendChild(placeholder);
                    return true;
                }
                this._backTo(token);
                return false;
            }
            else if (this._accept(4 /* TokenType.CurlyClose */)) {
                // ${1}
                parent.appendChild(placeholder);
                return true;
            }
            else {
                // ${1 <- missing curly or colon
                return this._backTo(token);
            }
        }
        _parseChoiceElement(parent) {
            const token = this._token;
            const values = [];
            while (true) {
                if (this._token.type === 2 /* TokenType.Comma */ || this._token.type === 7 /* TokenType.Pipe */) {
                    break;
                }
                let value;
                if (value = this._accept(5 /* TokenType.Backslash */, true)) {
                    // \, \|, or \\
                    value = this._accept(2 /* TokenType.Comma */, true)
                        || this._accept(7 /* TokenType.Pipe */, true)
                        || this._accept(5 /* TokenType.Backslash */, true)
                        || value;
                }
                else {
                    value = this._accept(undefined, true);
                }
                if (!value) {
                    // EOF
                    this._backTo(token);
                    return false;
                }
                values.push(value);
            }
            if (values.length === 0) {
                this._backTo(token);
                return false;
            }
            parent.appendChild(new Text(values.join('')));
            return true;
        }
        // ${foo:<children>}, ${foo} -> variable
        _parseComplexVariable(parent) {
            let name;
            const token = this._token;
            const match = this._accept(0 /* TokenType.Dollar */)
                && this._accept(3 /* TokenType.CurlyOpen */)
                && (name = this._accept(9 /* TokenType.VariableName */, true));
            if (!match) {
                return this._backTo(token);
            }
            const variable = new Variable(name);
            if (this._accept(1 /* TokenType.Colon */)) {
                // ${foo:<children>}
                while (true) {
                    // ...} -> done
                    if (this._accept(4 /* TokenType.CurlyClose */)) {
                        parent.appendChild(variable);
                        return true;
                    }
                    if (this._parse(variable)) {
                        continue;
                    }
                    // fallback
                    parent.appendChild(new Text('${' + name + ':'));
                    variable.children.forEach(parent.appendChild, parent);
                    return true;
                }
            }
            else if (this._accept(6 /* TokenType.Forwardslash */)) {
                // ${foo/<regex>/<format>/<options>}
                if (this._parseTransform(variable)) {
                    parent.appendChild(variable);
                    return true;
                }
                this._backTo(token);
                return false;
            }
            else if (this._accept(4 /* TokenType.CurlyClose */)) {
                // ${foo}
                parent.appendChild(variable);
                return true;
            }
            else {
                // ${foo <- missing curly or colon
                return this._backTo(token);
            }
        }
        _parseTransform(parent) {
            // ...<regex>/<format>/<options>}
            const transform = new Transform();
            let regexValue = '';
            let regexOptions = '';
            // (1) /regex
            while (true) {
                if (this._accept(6 /* TokenType.Forwardslash */)) {
                    break;
                }
                let escaped;
                if (escaped = this._accept(5 /* TokenType.Backslash */, true)) {
                    escaped = this._accept(6 /* TokenType.Forwardslash */, true) || escaped;
                    regexValue += escaped;
                    continue;
                }
                if (this._token.type !== 14 /* TokenType.EOF */) {
                    regexValue += this._accept(undefined, true);
                    continue;
                }
                return false;
            }
            // (2) /format
            while (true) {
                if (this._accept(6 /* TokenType.Forwardslash */)) {
                    break;
                }
                let escaped;
                if (escaped = this._accept(5 /* TokenType.Backslash */, true)) {
                    escaped = this._accept(5 /* TokenType.Backslash */, true) || this._accept(6 /* TokenType.Forwardslash */, true) || escaped;
                    transform.appendChild(new Text(escaped));
                    continue;
                }
                if (this._parseFormatString(transform) || this._parseAnything(transform)) {
                    continue;
                }
                return false;
            }
            // (3) /option
            while (true) {
                if (this._accept(4 /* TokenType.CurlyClose */)) {
                    break;
                }
                if (this._token.type !== 14 /* TokenType.EOF */) {
                    regexOptions += this._accept(undefined, true);
                    continue;
                }
                return false;
            }
            try {
                transform.regexp = new RegExp(regexValue, regexOptions);
            }
            catch (e) {
                // invalid regexp
                return false;
            }
            parent.transform = transform;
            return true;
        }
        _parseFormatString(parent) {
            const token = this._token;
            if (!this._accept(0 /* TokenType.Dollar */)) {
                return false;
            }
            let complex = false;
            if (this._accept(3 /* TokenType.CurlyOpen */)) {
                complex = true;
            }
            const index = this._accept(8 /* TokenType.Int */, true);
            if (!index) {
                this._backTo(token);
                return false;
            }
            else if (!complex) {
                // $1
                parent.appendChild(new FormatString(Number(index)));
                return true;
            }
            else if (this._accept(4 /* TokenType.CurlyClose */)) {
                // ${1}
                parent.appendChild(new FormatString(Number(index)));
                return true;
            }
            else if (!this._accept(1 /* TokenType.Colon */)) {
                this._backTo(token);
                return false;
            }
            if (this._accept(6 /* TokenType.Forwardslash */)) {
                // ${1:/upcase}
                const shorthand = this._accept(9 /* TokenType.VariableName */, true);
                if (!shorthand || !this._accept(4 /* TokenType.CurlyClose */)) {
                    this._backTo(token);
                    return false;
                }
                else {
                    parent.appendChild(new FormatString(Number(index), shorthand));
                    return true;
                }
            }
            else if (this._accept(11 /* TokenType.Plus */)) {
                // ${1:+<if>}
                const ifValue = this._until(4 /* TokenType.CurlyClose */);
                if (ifValue) {
                    parent.appendChild(new FormatString(Number(index), undefined, ifValue, undefined));
                    return true;
                }
            }
            else if (this._accept(12 /* TokenType.Dash */)) {
                // ${2:-<else>}
                const elseValue = this._until(4 /* TokenType.CurlyClose */);
                if (elseValue) {
                    parent.appendChild(new FormatString(Number(index), undefined, undefined, elseValue));
                    return true;
                }
            }
            else if (this._accept(13 /* TokenType.QuestionMark */)) {
                // ${2:?<if>:<else>}
                const ifValue = this._until(1 /* TokenType.Colon */);
                if (ifValue) {
                    const elseValue = this._until(4 /* TokenType.CurlyClose */);
                    if (elseValue) {
                        parent.appendChild(new FormatString(Number(index), undefined, ifValue, elseValue));
                        return true;
                    }
                }
            }
            else {
                // ${1:<else>}
                const elseValue = this._until(4 /* TokenType.CurlyClose */);
                if (elseValue) {
                    parent.appendChild(new FormatString(Number(index), undefined, undefined, elseValue));
                    return true;
                }
            }
            this._backTo(token);
            return false;
        }
        _parseAnything(marker) {
            if (this._token.type !== 14 /* TokenType.EOF */) {
                marker.appendChild(new Text(this._scanner.tokenText(this._token)));
                this._accept(undefined);
                return true;
            }
            return false;
        }
    }
    exports.SnippetParser = SnippetParser;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NuaXBwZXQvYnJvd3Nlci9zbmlwcGV0UGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxJQUFrQixTQWdCakI7SUFoQkQsV0FBa0IsU0FBUztRQUMxQiw2Q0FBTSxDQUFBO1FBQ04sMkNBQUssQ0FBQTtRQUNMLDJDQUFLLENBQUE7UUFDTCxtREFBUyxDQUFBO1FBQ1QscURBQVUsQ0FBQTtRQUNWLG1EQUFTLENBQUE7UUFDVCx5REFBWSxDQUFBO1FBQ1oseUNBQUksQ0FBQTtRQUNKLHVDQUFHLENBQUE7UUFDSCx5REFBWSxDQUFBO1FBQ1osOENBQU0sQ0FBQTtRQUNOLDBDQUFJLENBQUE7UUFDSiwwQ0FBSSxDQUFBO1FBQ0osMERBQVksQ0FBQTtRQUNaLHdDQUFHLENBQUE7SUFDSixDQUFDLEVBaEJpQixTQUFTLHlCQUFULFNBQVMsUUFnQjFCO0lBU0QsTUFBYSxPQUFPO1FBQXBCO1lBMEJDLFVBQUssR0FBVyxFQUFFLENBQUM7WUFDbkIsUUFBRyxHQUFXLENBQUMsQ0FBQztRQW9FakIsQ0FBQztpQkE3RmUsV0FBTSxHQUFnQztZQUNwRCw4QkFBcUIsMEJBQWtCO1lBQ3ZDLHlCQUFnQix5QkFBaUI7WUFDakMseUJBQWdCLHlCQUFpQjtZQUNqQyxtQ0FBeUIsNkJBQXFCO1lBQzlDLG9DQUEwQiw4QkFBc0I7WUFDaEQsNkJBQW9CLDZCQUFxQjtZQUN6Qyx5QkFBZ0IsZ0NBQXdCO1lBQ3hDLHlCQUFlLHdCQUFnQjtZQUMvQix3QkFBZSx5QkFBZ0I7WUFDL0Isd0JBQWUseUJBQWdCO1lBQy9CLGdDQUF1QixpQ0FBd0I7U0FDL0MsQUFab0IsQ0FZbkI7UUFFRixNQUFNLENBQUMsZ0JBQWdCLENB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