/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SufTrie = exports.PreTrie = exports.ExplorerFileNestingTrie = void 0;
    /**
     * A sort of double-ended trie, used to efficiently query for matches to "star" patterns, where
     * a given key represents a parent and may contain a capturing group ("*"), which can then be
     * referenced via the token "$(capture)" in associated child patterns.
     *
     * The generated tree will have at most two levels, as subtrees are flattened rather than nested.
     *
     * Example:
     * The config: [
     * [ *.ts , [ $(capture).*.ts ; $(capture).js ] ]
     * [ *.js , [ $(capture).min.js ] ] ]
     * Nests the files: [ a.ts ; a.d.ts ; a.js ; a.min.js ; b.ts ; b.min.js ]
     * As:
     * - a.ts => [ a.d.ts ; a.js ; a.min.js ]
     * - b.ts => [ ]
     * - b.min.ts => [ ]
     */
    class ExplorerFileNestingTrie {
        constructor(config) {
            this.root = new PreTrie();
            for (const [parentPattern, childPatterns] of config) {
                for (const childPattern of childPatterns) {
                    this.root.add(parentPattern, childPattern);
                }
            }
        }
        toString() {
            return this.root.toString();
        }
        getAttributes(filename, dirname) {
            const lastDot = filename.lastIndexOf('.');
            if (lastDot < 1) {
                return {
                    dirname,
                    basename: filename,
                    extname: ''
                };
            }
            else {
                return {
                    dirname,
                    basename: filename.substring(0, lastDot),
                    extname: filename.substring(lastDot + 1)
                };
            }
        }
        nest(files, dirname) {
            const parentFinder = new PreTrie();
            for (const potentialParent of files) {
                const attributes = this.getAttributes(potentialParent, dirname);
                const children = this.root.get(potentialParent, attributes);
                for (const child of children) {
                    parentFinder.add(child, potentialParent);
                }
            }
            const findAllRootAncestors = (file, seen = new Set()) => {
                if (seen.has(file)) {
                    return [];
                }
                seen.add(file);
                const attributes = this.getAttributes(file, dirname);
                const ancestors = parentFinder.get(file, attributes);
                if (ancestors.length === 0) {
                    return [file];
                }
                if (ancestors.length === 1 && ancestors[0] === file) {
                    return [file];
                }
                return ancestors.flatMap(a => findAllRootAncestors(a, seen));
            };
            const result = new Map();
            for (const file of files) {
                let ancestors = findAllRootAncestors(file);
                if (ancestors.length === 0) {
                    ancestors = [file];
                }
                for (const ancestor of ancestors) {
                    let existing = result.get(ancestor);
                    if (!existing) {
                        result.set(ancestor, existing = new Set());
                    }
                    if (file !== ancestor) {
                        existing.add(file);
                    }
                }
            }
            return result;
        }
    }
    exports.ExplorerFileNestingTrie = ExplorerFileNestingTrie;
    /** Export for test only. */
    class PreTrie {
        constructor() {
            this.value = new SufTrie();
            this.map = new Map();
        }
        add(key, value) {
            if (key === '') {
                this.value.add(key, value);
            }
            else if (key[0] === '*') {
                this.value.add(key, value);
            }
            else {
                const head = key[0];
                const rest = key.slice(1);
                let existing = this.map.get(head);
                if (!existing) {
                    this.map.set(head, existing = new PreTrie());
                }
                existing.add(rest, value);
            }
        }
        get(key, attributes) {
            const results = [];
            results.push(...this.value.get(key, attributes));
            const head = key[0];
            const rest = key.slice(1);
            const existing = this.map.get(head);
            if (existing) {
                results.push(...existing.get(rest, attributes));
            }
            return results;
        }
        toString(indentation = '') {
            const lines = [];
            if (this.value.hasItems) {
                lines.push('* => \n' + this.value.toString(indentation + '  '));
            }
            [...this.map.entries()].map(([key, trie]) => lines.push('^' + key + ' => \n' + trie.toString(indentation + '  ')));
            return lines.map(l => indentation + l).join('\n');
        }
    }
    exports.PreTrie = PreTrie;
    /** Export for test only. */
    class SufTrie {
        constructor() {
            this.star = [];
            this.epsilon = [];
            this.map = new Map();
            this.hasItems = false;
        }
        add(key, value) {
            this.hasItems = true;
            if (key === '*') {
                this.star.push(new SubstitutionString(value));
            }
            else if (key === '') {
                this.epsilon.push(new SubstitutionString(value));
            }
            else {
                const tail = key[key.length - 1];
                const rest = key.slice(0, key.length - 1);
                if (tail === '*') {
                    throw Error('Unexpected star in SufTrie key: ' + key);
                }
                else {
                    let existing = this.map.get(tail);
                    if (!existing) {
                        this.map.set(tail, existing = new SufTrie());
                    }
                    existing.add(rest, value);
                }
            }
        }
        get(key, attributes) {
            const results = [];
            if (key === '') {
                results.push(...this.epsilon.map(ss => ss.substitute(attributes)));
            }
            if (this.star.length) {
                results.push(...this.star.map(ss => ss.substitute(attributes, key)));
            }
            const tail = key[key.length - 1];
            const rest = key.slice(0, key.length - 1);
            const existing = this.map.get(tail);
            if (existing) {
                results.push(...existing.get(rest, attributes));
            }
            return results;
        }
        toString(indentation = '') {
            const lines = [];
            if (this.star.length) {
                lines.push('* => ' + this.star.join('; '));
            }
            if (this.epsilon.length) {
                // allow-any-unicode-next-line
                lines.push('ε => ' + this.epsilon.join('; '));
            }
            [...this.map.entries()].map(([key, trie]) => lines.push(key + '$' + ' => \n' + trie.toString(indentation + '  ')));
            return lines.map(l => indentation + l).join('\n');
        }
    }
    exports.SufTrie = SufTrie;
    var SubstitutionType;
    (function (SubstitutionType) {
        SubstitutionType["capture"] = "capture";
        SubstitutionType["basename"] = "basename";
        SubstitutionType["dirname"] = "dirname";
        SubstitutionType["extname"] = "extname";
    })(SubstitutionType || (SubstitutionType = {}));
    const substitutionStringTokenizer = /\$[({](capture|basename|dirname|extname)[)}]/g;
    class SubstitutionString {
        constructor(pattern) {
            this.tokens = [];
            substitutionStringTokenizer.lastIndex = 0;
            let token;
            let lastIndex = 0;
            while (token = substitutionStringTokenizer.exec(pattern)) {
                const prefix = pattern.slice(lastIndex, token.index);
                this.tokens.push(prefix);
                const type = token[1];
                switch (type) {
                    case "basename" /* SubstitutionType.basename */:
                    case "dirname" /* SubstitutionType.dirname */:
                    case "extname" /* SubstitutionType.extname */:
                    case "capture" /* SubstitutionType.capture */:
                        this.tokens.push({ capture: type });
                        break;
                    default: throw Error('unknown substitution type: ' + type);
                }
                lastIndex = token.index + token[0].length;
            }
            if (lastIndex !== pattern.length) {
                const suffix = pattern.slice(lastIndex, pattern.length);
                this.tokens.push(suffix);
            }
        }
        substitute(attributes, capture) {
            return this.tokens.map(t => {
                if (typeof t === 'string') {
                    return t;
                }
                switch (t.capture) {
                    case "basename" /* SubstitutionType.basename */: return attributes.basename;
                    case "dirname" /* SubstitutionType.dirname */: return attributes.dirname;
                    case "extname" /* SubstitutionType.extname */: return attributes.extname;
                    case "capture" /* SubstitutionType.capture */: return capture || '';
                }
            }).join('');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJGaWxlTmVzdGluZ1RyaWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9jb21tb24vZXhwbG9yZXJGaWxlTmVzdGluZ1RyaWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHOzs7Ozs7Ozs7Ozs7Ozs7O09BZ0JHO0lBQ0gsTUFBYSx1QkFBdUI7UUFHbkMsWUFBWSxNQUE0QjtZQUZoQyxTQUFJLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUc1QixLQUFLLE1BQU0sQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ3JELEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDNUMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsUUFBUTtZQUNQLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixDQUFDO1FBRU8sYUFBYSxDQUFDLFFBQWdCLEVBQUUsT0FBZTtZQUN0RCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLElBQUksT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNqQixPQUFPO29CQUNOLE9BQU87b0JBQ1AsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLE9BQU8sRUFBRSxFQUFFO2lCQUNYLENBQUM7WUFDSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTztvQkFDTixPQUFPO29CQUNQLFFBQVEsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUM7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