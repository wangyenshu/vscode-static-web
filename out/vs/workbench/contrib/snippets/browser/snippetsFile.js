/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/json", "vs/nls", "vs/base/common/path", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetVariables", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/browser/dom"], function (require, exports, json_1, nls_1, path_1, snippetParser_1, snippetVariables_1, resources_1, types_1, arrays_1, iterator_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetFile = exports.SnippetSource = exports.Snippet = void 0;
    class SnippetBodyInsights {
        constructor(body) {
            // init with defaults
            this.isBogous = false;
            this.isTrivial = false;
            this.usesClipboardVariable = false;
            this.usesSelectionVariable = false;
            this.codeSnippet = body;
            // check snippet...
            const textmateSnippet = new snippetParser_1.SnippetParser().parse(body, false);
            const placeholders = new Map();
            let placeholderMax = 0;
            for (const placeholder of textmateSnippet.placeholders) {
                placeholderMax = Math.max(placeholderMax, placeholder.index);
            }
            // mark snippet as trivial when there is no placeholders or when the only
            // placeholder is the final tabstop and it is at the very end.
            if (textmateSnippet.placeholders.length === 0) {
                this.isTrivial = true;
            }
            else if (placeholderMax === 0) {
                const last = (0, arrays_1.tail)(textmateSnippet.children);
                this.isTrivial = last instanceof snippetParser_1.Placeholder && last.isFinalTabstop;
            }
            const stack = [...textmateSnippet.children];
            while (stack.length > 0) {
                const marker = stack.shift();
                if (marker instanceof snippetParser_1.Variable) {
                    if (marker.children.length === 0 && !snippetVariables_1.KnownSnippetVariableNames[marker.name]) {
                        // a 'variable' without a default value and not being one of our supported
                        // variables is automatically turned into a placeholder. This is to restore
                        // a bug we had before. So `${foo}` becomes `${N:foo}`
                        const index = placeholders.has(marker.name) ? placeholders.get(marker.name) : ++placeholderMax;
                        placeholders.set(marker.name, index);
                        const synthetic = new snippetParser_1.Placeholder(index).appendChild(new snippetParser_1.Text(marker.name));
                        textmateSnippet.replace(marker, [synthetic]);
                        this.isBogous = true;
                    }
                    switch (marker.name) {
                        case 'CLIPBOARD':
                            this.usesClipboardVariable = true;
                            break;
                        case 'SELECTION':
                        case 'TM_SELECTED_TEXT':
                            this.usesSelectionVariable = true;
                            break;
                    }
                }
                else {
                    // recurse
                    stack.push(...marker.children);
                }
            }
            if (this.isBogous) {
                this.codeSnippet = textmateSnippet.toTextmateString();
            }
        }
    }
    class Snippet {
        constructor(isFileTemplate, scopes, name, prefix, description, body, source, snippetSource, snippetIdentifier, extensionId) {
            this.isFileTemplate = isFileTemplate;
            this.scopes = scopes;
            this.name = name;
            this.prefix = prefix;
            this.description = description;
            this.body = body;
            this.source = source;
            this.snippetSource = snippetSource;
            this.snippetIdentifier = snippetIdentifier;
            this.extensionId = extensionId;
            this.prefixLow = prefix.toLowerCase();
            this._bodyInsights = new dom_1.WindowIdleValue((0, dom_1.getActiveWindow)(), () => new SnippetBodyInsights(this.body));
        }
        get codeSnippet() {
            return this._bodyInsights.value.codeSnippet;
        }
        get isBogous() {
            return this._bodyInsights.value.isBogous;
        }
        get isTrivial() {
            return this._bodyInsights.value.isTrivial;
        }
        get needsClipboard() {
            return this._bodyInsights.value.usesClipboardVariable;
        }
        get usesSelection() {
            return this._bodyInsights.value.usesSelectionVariable;
        }
    }
    exports.Snippet = Snippet;
    function isJsonSerializedSnippet(thing) {
        return (0, types_1.isObject)(thing) && Boolean(thing.body);
    }
    var SnippetSource;
    (function (SnippetSource) {
        SnippetSource[SnippetSource["User"] = 1] = "User";
        SnippetSource[SnippetSource["Workspace"] = 2] = "Workspace";
        SnippetSource[SnippetSource["Extension"] = 3] = "Extension";
    })(SnippetSource || (exports.SnippetSource = SnippetSource = {}));
    class SnippetFile {
        constructor(source, location, defaultScopes, _extension, _fileService, _extensionResourceLoaderService) {
            this.source = source;
            this.location = location;
            this.defaultScopes = defaultScopes;
            this._extension = _extension;
            this._fileService = _fileService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this.data = [];
            this.isGlobalSnippets = (0, path_1.extname)(location.path) === '.code-snippets';
            this.isUserSnippets = !this._extension;
        }
        select(selector, bucket) {
            if (this.isGlobalSnippets || !this.isUserSnippets) {
                this._scopeSelect(selector, bucket);
            }
            else {
                this._filepathSelect(selector, bucket);
            }
        }
        _filepathSelect(selector, bucket) {
            // for `fooLang.json` files all snippets are accepted
            if (selector + '.json' === (0, path_1.basename)(this.location.path)) {
                bucket.push(...this.data);
            }
        }
        _scopeSelect(selector, bucket) {
            // for `my.code-snippets` files we need to look at each snippet
            for (const snippet of this.data) {
                const len = snippet.scopes.length;
                if (len === 0) {
                    // always accept
                    bucket.push(snippet);
                }
                else {
                    for (let i = 0; i < len; i++) {
                        // match
                        if (snippet.scopes[i] === selector) {
                            bucket.push(snippet);
                            break; // match only once!
                        }
                    }
                }
            }
            const idx = selector.lastIndexOf('.');
            if (idx >= 0) {
                this._scopeSelect(selector.substring(0, idx), bucket);
            }
        }
        async _load() {
            if (this._extension) {
                return this._extensionResourceLoaderService.readExtensionResource(this.location);
            }
            else {
                const content = await this._fileService.readFile(this.location);
                return content.value.toString();
            }
        }
        load() {
            if (!this._loadPromise) {
                this._loadPromise = Promise.resolve(this._load()).then(content => {
                    const data = (0, json_1.parse)(content);
                    if ((0, json_1.getNodeType)(data) === 'object') {
                        for (const [name, scopeOrTemplate] of Object.entries(data)) {
                            if (isJsonSerializedSnippet(scopeOrTemplate)) {
                                this._parseSnippet(name, scopeOrTemplate, this.data);
                            }
                            else {
                                for (const [name, template] of Object.entries(scopeOrTemplate)) {
                                    this._parseSnippet(name, template, this.data);
                                }
                            }
                        }
                    }
                    return this;
                });
            }
            return this._loadPromise;
        }
        reset() {
            this._loadPromise = undefined;
            this.data.length = 0;
        }
        _parseSnippet(name, snippet, bucket) {
            let { isFileTemplate, prefix, body, description } = snippet;
            if (!prefix) {
                prefix = '';
            }
            if (Array.isArray(body)) {
                body = body.join('\n');
            }
            if (typeof body !== 'string') {
                return;
            }
            if (Array.isArray(description)) {
                description = description.join('\n');
            }
            let scopes;
            if (this.defaultScopes) {
                scopes = this.defaultScopes;
            }
            else if (typeof snippet.scope === 'string') {
                scopes = snippet.scope.split(',').map(s => s.trim()).filter(Boolean);
            }
            else {
                scopes = [];
            }
            let source;
            if (this._extension) {
                // extension snippet -> show the name of the extension
                source = this._extension.displayName || this._extension.name;
            }
            else if (this.source === 2 /* SnippetSource.Workspace */) {
                // workspace -> only *.code-snippets files
                source = (0, nls_1.localize)('source.workspaceSnippetGlobal', "Workspace Snippet");
            }
            else {
                // user -> global (*.code-snippets) and language snippets
                if (this.isGlobalSnippets) {
                    source = (0, nls_1.localize)('source.userSnippetGlobal', "Global User Snippet");
                }
                else {
                    source = (0, nls_1.localize)('source.userSnippet', "User Snippet");
                }
            }
            for (const _prefix of iterator_1.Iterable.wrap(prefix)) {
                bucket.push(new Snippet(Boolean(isFileTemplate), scopes, name, _prefix, description, body, source, this.source, this._extension ? `${(0, resources_1.relativePath)(this._extension.extensionLocation, this.location)}/${name}` : `${(0, path_1.basename)(this.location.path)}/${name}`, this._extension?.identifier));
            }
        }
    }
    exports.SnippetFile = SnippetFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNGaWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc25pcHBldHMvYnJvd3Nlci9zbmlwcGV0c0ZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFNLG1CQUFtQjtRQWF4QixZQUFZLElBQVk7WUFFdkIscUJBQXFCO1lBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7WUFDbkMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQztZQUNuQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUV4QixtQkFBbUI7WUFDbkIsTUFBTSxlQUFlLEdBQUcsSUFBSSw2QkFBYSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUvRCxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUMvQyxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7WUFDdkIsS0FBSyxNQUFNLFdBQVcsSUFBSSxlQUFlLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hELGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUVELHlFQUF5RTtZQUN6RSw4REFBOEQ7WUFDOUQsSUFBSSxlQUFlLENBQUMsWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDdkIsQ0FBQztpQkFBTSxJQUFJLGNBQWMsS0FB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