/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/dompurify/dompurify", "vs/base/browser/event", "vs/base/browser/formattedTextRenderer", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/iconLabels", "vs/base/common/idGenerator", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/marked/marked", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri"], function (require, exports, DOM, dompurify, event_1, formattedTextRenderer_1, keyboardEvent_1, mouseEvent_1, iconLabels_1, errors_1, event_2, htmlContent_1, iconLabels_2, idGenerator_1, lazy_1, lifecycle_1, marked_1, marshalling_1, network_1, objects_1, resources_1, strings_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.allowedMarkdownAttr = void 0;
    exports.renderMarkdown = renderMarkdown;
    exports.renderStringAsPlaintext = renderStringAsPlaintext;
    exports.renderMarkdownAsPlaintext = renderMarkdownAsPlaintext;
    exports.fillInIncompleteTokens = fillInIncompleteTokens;
    const defaultMarkedRenderers = Object.freeze({
        image: (href, title, text) => {
            let dimensions = [];
            let attributes = [];
            if (href) {
                ({ href, dimensions } = (0, htmlContent_1.parseHrefAndDimensions)(href));
                attributes.push(`src="${(0, htmlContent_1.escapeDoubleQuotes)(href)}"`);
            }
            if (text) {
                attributes.push(`alt="${(0, htmlContent_1.escapeDoubleQuotes)(text)}"`);
            }
            if (title) {
                attributes.push(`title="${(0, htmlContent_1.escapeDoubleQuotes)(title)}"`);
            }
            if (dimensions.length) {
                attributes = attributes.concat(dimensions);
            }
            return '<img ' + attributes.join(' ') + '>';
        },
        paragraph: (text) => {
            return `<p>${text}</p>`;
        },
        link: (href, title, text) => {
            if (typeof href !== 'string') {
                return '';
            }
            // Remove markdown escapes. Workaround for https://github.com/chjj/marked/issues/829
            if (href === text) { // raw link case
                text = (0, htmlContent_1.removeMarkdownEscapes)(text);
            }
            title = typeof title === 'string' ? (0, htmlContent_1.escapeDoubleQuotes)((0, htmlContent_1.removeMarkdownEscapes)(title)) : '';
            href = (0, htmlContent_1.removeMarkdownEscapes)(href);
            // HTML Encode href
            href = href.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            return `<a href="${href}" title="${title || href}" draggable="false">${text}</a>`;
        },
    });
    /**
     * Low-level way create a html element from a markdown string.
     *
     * **Note** that for most cases you should be using [`MarkdownRenderer`](./src/vs/editor/contrib/markdownRenderer/browser/markdownRenderer.ts)
     * which comes with support for pretty code block rendering and which uses the default way of handling links.
     */
    function renderMarkdown(markdown, options = {}, markedOptions = {}) {
        const disposables = new lifecycle_1.DisposableStore();
        let isDisposed = false;
        const element = (0, formattedTextRenderer_1.createElement)(options);
        const _uriMassage = function (part) {
            let data;
            try {
                data = (0, marshalling_1.parse)(decodeURIComponent(part));
            }
            catch (e) {
                // ignore
            }
            if (!data) {
                return part;
            }
            data = (0, objects_1.cloneAndChange)(data, value => {
                if (markdown.uris && markdown.uris[value]) {
                    return uri_1.URI.revive(markdown.uris[value]);
                }
                else {
                    return undefined;
                }
            });
            return encodeURIComponent(JSON.stringify(data));
        };
        const _href = function (href, isDomUri) {
            const data = markdown.uris && markdown.uris[href];
            let uri = uri_1.URI.revive(data);
            if (isDomUri) {
                if (href.startsWith(network_1.Schemas.data + ':')) {
                    return href;
                }
                if (!uri) {
                    uri = uri_1.URI.parse(href);
                }
                // this URI will end up as "src"-attribute of a dom node
                // and because of that special rewriting needs to be done
                // so that the URI uses a protocol that's understood by
                // browsers (like http or https)
                return network_1.FileAccess.uriToBrowserUri(uri).toString(true);
            }
            if (!uri) {
                return href;
            }
            if (uri_1.URI.parse(href).toString() === uri.toString()) {
                return href; // no transformation performed
            }
            if (uri.query) {
                uri = uri.with({ query: _uriMassage(uri.query) });
            }
            return uri.toString();
        };
        const renderer = new marked_1.marked.Renderer();
        renderer.image = defaultMarkedRenderers.image;
        renderer.link = defaultMarkedRenderers.link;
        renderer.paragraph = defaultMarkedRenderers.paragraph;
        // Will collect [id, renderedElement] tuples
        const codeBlocks = [];
        const syncCodeBlocks = [];
        if (options.codeBlockRendererSync) {
            renderer.code = (code, lang) => {
                const id = idGenerator_1.defaultGenerator.nextId();
                const value = options.codeBlockRendererSync(postProcessCodeBlockLanguageId(lang), code);
                syncCodeBlocks.push([id, value]);
                return `<div class="code" data-code="${id}">${(0, strings_1.escape)(code)}</div>`;
            };
        }
        else if (options.codeBlockRenderer) {
            renderer.code = (code, lang) => {
                const id = idGenerator_1.defaultGenerator.nextId();
                const value = options.codeBlockRenderer(postProcessCodeBlockLanguageId(lang), code);
                codeBlocks.push(value.then(element => [id, element]));
                return `<div class="code" data-code="${id}">${(0, strings_1.escape)(code)}</div>`;
            };
        }
        if (options.actionHandler) {
            const _activateLink = function (event) {
                let target = event.target;
                if (target.tagName !== 'A') {
                    target = target.parentElement;
                    if (!target || target.tagName !== 'A') {
                        return;
                    }
                }
                try {
                    let href = target.dataset['href'];
                    if (href) {
                        if (markdown.baseUri) {
                            href = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
                        }
                        options.actionHandler.callback(href, event);
                    }
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                finally {
                    event.preventDefault();
                }
            };
            const onClick = options.actionHandler.disposables.add(new event_1.DomEmitter(element, 'click'));
            const onAuxClick = options.actionHandler.disposables.add(new event_1.DomEmitter(element, 'auxclick'));
            options.actionHandler.disposables.add(event_2.Event.any(onClick.event, onAuxClick.event)(e => {
                const mouseEvent = new mouseEvent_1.StandardMouseEvent(DOM.getWindow(element), e);
                if (!mouseEvent.leftButton && !mouseEvent.middleButton) {
                    return;
                }
                _activateLink(mouseEvent);
            }));
            options.actionHandler.disposables.add(DOM.addDisposableListener(element, 'keydown', (e) => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (!keyboardEvent.equals(10 /* KeyCode.Space */) && !keyboardEvent.equals(3 /* KeyCode.Enter */)) {
                    return;
                }
                _activateLink(keyboardEvent);
            }));
        }
        if (!markdown.supportHtml) {
            // TODO: Can we deprecated this in favor of 'supportHtml'?
            // Use our own sanitizer so that we can let through only spans.
            // Otherwise, we'd be letting all html be rendered.
            // If we want to allow markdown permitted tags, then we can delete sanitizer and sanitize.
            // We always pass the output through dompurify after this so that we don't rely on
            // marked for sanitization.
            markedOptions.sanitizer = (html) => {
                const match = markdown.isTrusted ? html.match(/^(<span[^>]+>)|(<\/\s*span>)$/) : undefined;
                return match ? html : '';
            };
            markedOptions.sanitize = true;
            markedOptions.silent = true;
        }
        markedOptions.renderer = renderer;
        // values that are too long will freeze the UI
        let value = markdown.value ?? '';
        if (value.length > 100_000) {
            value = `${value.substr(0, 100_000)}…`;
        }
        // escape theme icons
        if (markdown.supportThemeIcons) {
            value = (0, iconLabels_2.markdownEscapeEscapedIcons)(value);
        }
        let renderedMarkdown;
        if (options.fillInIncompleteTokens) {
            // The defaults are applied by parse but not lexer()/parser(), and they need to be present
            const opts = {
                ...marked_1.marked.defaults,
                ...markedOptions
            };
            const tokens = marked_1.marked.lexer(value, opts);
            const newTokens = fillInIncompleteTokens(tokens);
            renderedMarkdown = marked_1.marked.parser(newTokens, opts);
        }
        else {
            renderedMarkdown = marked_1.marked.parse(value, markedOptions);
        }
        // Rewrite theme icons
        if (markdown.supportThemeIcons) {
            const elements = (0, iconLabels_1.renderLabelWithIcons)(renderedMarkdown);
            renderedMarkdown = elements.map(e => typeof e === 'string' ? e : e.outerHTML).join('');
        }
        const htmlParser = new DOMParser();
        const markdownHtmlDoc = htmlParser.parseFromString(sanitizeRenderedMarkdown(markdown, renderedMarkdown), 'text/html');
        markdownHtmlDoc.body.querySelectorAll('img, audio, video, source')
            .forEach(img => {
            const src = img.getAttribute('src'); // Get the raw 'src' attribute value as text, not the resolved 'src'
            if (src) {
                let href = src;
                try {
                    if (markdown.baseUri) { // absolute or relative local path, or file: uri
                        href = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
                    }
                }
                catch (err) { }
                img.setAttribute('src', _href(href, true));
                if (options.disallowRemoteImages) {
                    const uriScheme = uri_1.URI.parse(href).scheme;
                    if (uriScheme !== network_1.Schemas.file && uriScheme !== network_1.Schemas.data) {
                        img.replaceWith(DOM.$('', undefined, img.outerHTML));
                    }
                }
            }
        });
        markdownHtmlDoc.body.querySelectorAll('a')
            .forEach(a => {
            const href = a.getAttribute('href'); // Get the raw 'href' attribute value as text, not the resolved 'href'
            a.setAttribute('href', ''); // Clear out href. We use the `data-href` for handling clicks instead
            if (!href
                || /^data:|javascript:/i.test(href)
                || (/^command:/i.test(href) && !markdown.isTrusted)
                || /^command:(\/\/\/)?_workbench\.downloadResource/i.test(href)) {
                // drop the link
                a.replaceWith(...a.childNodes);
            }
            else {
                let resolvedHref = _href(href, false);
                if (markdown.baseUri) {
                    resolvedHref = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
                }
                a.dataset.href = resolvedHref;
            }
        });
        element.innerHTML = sanitizeRenderedMarkdown(markdown, markdownHtmlDoc.body.innerHTML);
        if (codeBlocks.length > 0) {
            Promise.all(codeBlocks).then((tuples) => {
                if (isDisposed) {
                    return;
                }
                const renderedElements = new Map(tuples);
                const placeholderElements = element.querySelectorAll(`div[data-code]`);
                for (const placeholderElement of placeholderElements) {
                    const renderedElement = renderedElements.get(placeholderElement.dataset['code'] ?? '');
                    if (renderedElement) {
                        DOM.reset(placeholderElement, renderedElement);
                    }
                }
                options.asyncRenderCallback?.();
            });
        }
        else if (syncCodeBlocks.length > 0) {
            const renderedElements = new Map(syncCodeBlocks);
            const placeholderElements = element.querySelectorAll(`div[data-code]`);
            for (const placeholderElement of placeholderElements) {
                const renderedElement = renderedElements.get(placeholderElement.dataset['code'] ?? '');
                if (renderedElement) {
                    DOM.reset(placeholderElement, renderedElement);
                }
            }
        }
        // signal size changes for image tags
        if (options.asyncRenderCallback) {
            for (const img of element.getElementsByTagName('img')) {
                const listener = disposables.add(DOM.addDisposableListener(img, 'load', () => {
                    listener.dispose();
                    options.asyncRenderCallback();
                }));
            }
        }
        return {
            element,
            dispose: () => {
                isDisposed = true;
                disposables.dispose();
            }
        };
    }
    function postProcessCodeBlockLanguageId(lang) {
        if (!lang) {
            return '';
        }
        const parts = lang.split(/[\s+|:|,|\{|\?]/, 1);
        if (parts.length) {
            return parts[0];
        }
        return lang;
    }
    function resolveWithBaseUri(baseUri, href) {
        const hasScheme = /^\w[\w\d+.-]*:/.test(href);
        if (hasScheme) {
            return href;
        }
        if (baseUri.path.endsWith('/')) {
            return (0, resources_1.resolvePath)(baseUri, href).toString();
        }
        else {
            return (0, resources_1.resolvePath)((0, resources_1.dirname)(baseUri), href).toString();
        }
    }
    function sanitizeRenderedMarkdown(options, renderedMarkdown) {
        const { config, allowedSchemes } = getSanitizerOptions(options);
        dompurify.addHook('uponSanitizeAttribute', (element, e) => {
            if (e.attrName === 'style' || e.attrName === 'class') {
                if (element.tagName === 'SPAN') {
                    if (e.attrName === 'style') {
                        e.keepAttr = /^(color\:(#[0-9a-fA-F]+|var\(--vscode(-[a-zA-Z]+)+\));)?(background-color\:(#[0-9a-fA-F]+|var\(--vscode(-[a-zA-Z]+)+\));)?$/.test(e.attrValue);
                        return;
                    }
                    else if (e.attrName === 'class') {
                        e.keepAttr = /^codicon codicon-[a-z\-]+( codicon-modifier-[a-z\-]+)?$/.test(e.attrValue);
                        return;
                    }
                }
                e.keepAttr = false;
                return;
            }
            else if (element.tagName === 'INPUT' && element.attributes.getNamedItem('type')?.value === 'checkbox') {
                if ((e.attrName === 'type' && e.attrValue === 'checkbox') || e.attrName === 'disabled' || e.attrName === 'checked') {
                    e.keepAttr = true;
                    return;
                }
                e.keepAttr = false;
            }
        });
        dompurify.addHook('uponSanitizeElement', (element, e) => {
            if (e.tagName === 'input') {
                if (element.attributes.getNamedItem('type')?.value === 'checkbox') {
                    element.setAttribute('disabled', '');
                }
                else {
                    element.parentElement?.removeChild(element);
                }
            }
        });
        const hook = DOM.hookDomPurifyHrefAndSrcSanitizer(allowedSchemes);
        try {
            return dompurify.sanitize(renderedMarkdown, { ...config, RETURN_TRUSTED_TYPE: true });
        }
        finally {
            dompurify.removeHook('uponSanitizeAttribute');
            hook.dispose();
        }
    }
    exports.allowedMarkdownAttr = [
        'align',
        'autoplay',
        'alt',
        'checked',
        'class',
        'controls',
        'data-code',
        'data-href',
        'disabled',
        'draggable',
        'height',
        'href',
        'loop',
        'muted',
        'playsinline',
        'poster',
        'src',
        'style',
        'target',
        'title',
        'type',
        'width',
        'start',
    ];
    function getSanitizerOptions(options) {
        const allowedSchemes = [
            network_1.Schemas.http,
            network_1.Schemas.https,
            network_1.Schemas.mailto,
            network_1.Schemas.data,
            network_1.Schemas.file,
            network_1.Schemas.vscodeFileResource,
            network_1.Schemas.vscodeRemote,
            network_1.Schemas.vscodeRemoteResource,
        ];
        if (options.isTrusted) {
            allowedSchemes.push(network_1.Schemas.command);
        }
        return {
            config: {
                // allowedTags should included everything that markdown renders to.
                // Since we have our own sanitize function for marked, it's possible we missed some tag so let dompurify make sure.
                // HTML tags that can result from markdown are from reading https://spec.commonmark.org/0.29/
                // HTML table tags that can result from markdown are from https://github.github.com/gfm/#tables-extension-
                ALLOWED_TAGS: [...DOM.basicMarkupHtmlTags],
                ALLOWED_ATTR: exports.allowedMarkdownAttr,
                ALLOW_UNKNOWN_PROTOCOLS: true,
            },
            allowedSchemes
        };
    }
    /**
     * Strips all markdown from `string`, if it's an IMarkdownString. For example
     * `# Header` would be output as `Header`. If it's not, the string is returned.
     */
    function renderStringAsPlaintext(string) {
        return typeof string === 'string' ? string : renderMarkdownAsPlaintext(string);
    }
    /**
     * Strips all markdown from `markdown`. For example `# Header` would be output as `Header`.
     */
    function renderMarkdownAsPlaintext(markdown) {
        // values that are too long will freeze the UI
        let value = markdown.value ?? '';
        if (value.length > 100_000) {
            value = `${value.substr(0, 100_000)}…`;
        }
        const html = marked_1.marked.parse(value, { renderer: plainTextRenderer.value }).replace(/&(#\d+|[a-zA-Z]+);/g, m => unescapeInfo.get(m) ?? m);
        return sanitizeRenderedMarkdown({ isTrusted: false }, html).toString();
    }
    const unescapeInfo = new Map([
        ['&quot;', '"'],
        ['&nbsp;', ' '],
        ['&amp;', '&'],
        ['&#39;', '\''],
        ['&lt;', '<'],
        ['&gt;', '>'],
    ]);
    const plainTextRenderer = new lazy_1.Lazy(() => {
        const renderer = new marked_1.marked.Renderer();
        renderer.code = (code) => {
            return code;
        };
        renderer.blockquote = (quote) => {
            return quote;
        };
        renderer.html = (_html) => {
            return '';
        };
        renderer.heading = (text, _level, _raw) => {
            return text + '\n';
        };
        renderer.hr = () => {
            return '';
        };
        renderer.list = (body, _ordered) => {
            return body;
        };
        renderer.listitem = (text) => {
            return text + '\n';
        };
        renderer.paragraph = (text) => {
            return text + '\n';
        };
        renderer.table = (header, body) => {
            return header + body + '\n';
        };
        renderer.tablerow = (content) => {
            return content;
        };
        renderer.tablecell = (content, _flags) => {
            return content + ' ';
        };
        renderer.strong = (text) => {
            return text;
        };
        renderer.em = (text) => {
            return text;
        };
        renderer.codespan = (code) => {
            return code;
        };
        renderer.br = () => {
            return '\n';
        };
        renderer.del = (text) => {
            return text;
        };
        renderer.image = (_href, _title, _text) => {
            return '';
        };
        renderer.text = (text) => {
            return text;
        };
        renderer.link = (_href, _title, text) => {
            return text;
        };
        return renderer;
    });
    function mergeRawTokenText(tokens) {
        let mergedTokenText = '';
        tokens.forEach(token => {
            mergedTokenText += token.raw;
        });
        return mergedTokenText;
    }
    function completeSingleLinePattern(token) {
        for (let i = 0; i < token.tokens.length; i++) {
            const subtoken = token.tokens[i];
            if (subtoken.type === 'text') {
                const lines = subtoken.raw.split('\n');
                const lastLine = lines[lines.length - 1];
                if (lastLine.includes('`')) {
                    return completeCodespan(token);
                }
                else if (lastLine.includes('**')) {
                    return completeDoublestar(token);
                }
                else if (lastLine.match(/\*\w/)) {
                    return completeStar(token);
                }
                else if (lastLine.match(/(^|\s)__\w/)) {
                    return completeDoubleUnderscore(token);
                }
                else if (lastLine.match(/(^|\s)_\w/)) {
                    return completeUnderscore(token);
                }
                else if (lastLine.match(/(^|\s)\[.*\]\(\w*/)) {
                    const nextTwoSubTokens = token.tokens.slice(i + 1);
                    if (nextTwoSubTokens[0]?.type === 'link' && nextTwoSubTokens[1]?.type === 'text' && nextTwoSubTokens[1].raw.match(/^ *"[^"]*$/)) {
                        // A markdown link can look like
                        // [link text](https://microsoft.com "more text")
                        // Where "more text" is a title for the link or an argument to a vscode command link
                        return completeLinkTargetArg(token);
                    }
                    return completeLinkTarget(token);
                }
                else if (hasStartOfLinkTarget(lastLine)) {
                    return completeLinkTarget(token);
                }
                else if (lastLine.match(/(^|\s)\[\w/) && !token.tokens.slice(i + 1).some(t => hasStartOfLinkTarget(t.raw))) {
                    return completeLinkText(token);
                }
            }
        }
        return undefined;
    }
    function hasStartOfLinkTarget(str) {
        return !!str.match(/^[^\[]*\]\([^\)]*$/);
    }
    // function completeListItemPattern(token: marked.Tokens.List): marked.Tokens.List | undefined {
    // 	// Patch up this one list item
    // 	const lastItem = token.items[token.items.length - 1];
    // 	const newList = completeSingleLinePattern(lastItem);
    // 	if (!newList || newList.type !== 'list') {
    // 		// Nothing to fix, or not a pattern we were expecting
    // 		return;
    // 	}
    // 	// Re-parse the whole list with the last item replaced
    // 	const completeList = marked.lexer(mergeRawTokenText(token.items.slice(0, token.items.length - 1)) + newList.items[0].raw);
    // 	if (completeList.length === 1 && completeList[0].type === 'list') {
    // 		return completeList[0];
    // 	}
    // 	// Not a pattern we were expecting
    // 	return undefined;
    // }
    function fillInIncompleteTokens(tokens) {
        let i;
        let newTokens;
        for (i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            let codeblockStart;
            if (token.type === 'paragraph' && (codeblockStart = token.raw.match(/(\n|^)(````*)/))) {
                const codeblockLead = codeblockStart[2];
                // If the code block was complete, it would be in a type='code'
                newTokens = completeCodeBlock(tokens.slice(i), codeblockLead);
                break;
            }
            if (token.type === 'paragraph' && token.raw.match(/(\n|^)\|/)) {
                newTokens = completeTable(tokens.slice(i));
                break;
            }
            // if (i === tokens.length - 1 && token.type === 'list') {
            // 	const newListToken = completeListItemPattern(token);
            // 	if (newListToken) {
            // 		newTokens = [newListToken];
            // 		break;
            // 	}
            // }
            if (i === tokens.length - 1 && token.type === 'paragraph') {
                // Only operates on a single token, because any newline that follows this should break these patterns
                const newToken = completeSingleLinePattern(token);
                if (newToken) {
                    newTokens = [newToken];
                    break;
                }
            }
        }
        if (newTokens) {
            const newTokensList = [
                ...tokens.slice(0, i),
                ...newTokens
            ];
            newTokensList.links = tokens.links;
            return newTokensList;
        }
        return tokens;
    }
    function completeCodeBlock(tokens, leader) {
        const mergedRawText = mergeRawTokenText(tokens);
        return marked_1.marked.lexer(mergedRawText + `\n${leader}`);
    }
    function completeCodespan(token) {
        return completeWithString(token, '`');
    }
    function completeStar(tokens) {
        return completeWithString(tokens, '*');
    }
    function completeUnderscore(tokens) {
        return completeWithString(tokens, '_');
    }
    function completeLinkTarget(tokens) {
        return completeWithString(tokens, ')');
    }
    function completeLinkTargetArg(tokens) {
        return completeWithString(tokens, '")');
    }
    function completeLinkText(tokens) {
        return completeWithString(tokens, '](about:blank)');
    }
    function completeDoublestar(tokens) {
        return completeWithString(tokens, '**');
    }
    function completeDoubleUnderscore(tokens) {
        return completeWithString(tokens, '__');
    }
    function completeWithString(tokens, closingString) {
        const mergedRawText = mergeRawTokenText(Array.isArray(tokens) ? tokens : [tokens]);
        // If it was completed correctly, this should be a single token.
        // Expecting either a Paragraph or a List
        return marked_1.marked.lexer(mergedRawText + closingString)[0];
    }
    function completeTable(tokens) {
        const mergedRawText = mergeRawTokenText(tokens);
        const lines = mergedRawText.split('\n');
        let numCols; // The number of line1 col headers
        let hasSeparatorRow = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (typeof numCols === 'undefined' && line.match(/^\s*\|/)) {
                const line1Matches = line.match(/(\|[^\|]+)(?=\||$)/g);
                if (line1Matches) {
                    numCols = line1Matches.length;
                }
            }
            else if (typeof numCols === 'number') {
                if (line.match(/^\s*\|/)) {
                    if (i !== lines.length - 1) {
                        // We got the line1 header row, and the line2 separator row, but there are more lines, and it wasn't parsed as a table!
                        // That's strange and means that the table is probably malformed in the source, so I won't try to patch it up.
                        return undefined;
                    }
                    // Got a line2 separator row- partial or complete, doesn't matter, we'll replace it with a correct one
                    hasSeparatorRow = true;
                }
                else {
                    // The line after the header row isn't a valid separator row, so the table is malformed, don't fix it up
                    return undefined;
                }
            }
        }
        if (typeof numCols === 'number' && numCols > 0) {
            const prefixText = hasSeparatorRow ? lines.slice(0, -1).join('\n') : mergedRawText;
            const line1EndsInPipe = !!prefixText.match(/\|\s*$/);
            const newRawText = prefixText + (line1EndsInPipe ? '' : '|') + `\n|${' --- |'.repeat(numCols)}`;
            return marked_1.marked.lexer(newRawText);
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25SZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9tYXJrZG93blJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJGaEcsd0NBbVFDO0lBdUlELDBEQUVDO0lBS0QsOERBVUM7SUFpSkQsd0RBOENDO0lBaHBCRCxNQUFNLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUMsS0FBSyxFQUFFLENBQUMsSUFBbUIsRUFBRSxLQUFvQixFQUFFLElBQVksRUFBVSxFQUFFO1lBQzFFLElBQUksVUFBVSxHQUFhLEVBQUUsQ0FBQztZQUM5QixJQUFJLFVBQVUsR0FBYSxFQUFFLENBQUM7WUFDOUIsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLElBQUEsb0NBQXNCLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdEQsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUEsZ0NBQWtCLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFDRCxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNWLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFBLGdDQUFrQixFQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0RCxDQUFDO1lBQ0QsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBQSxnQ0FBa0IsRUFBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekQsQ0FBQztZQUNELElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2QixVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FB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