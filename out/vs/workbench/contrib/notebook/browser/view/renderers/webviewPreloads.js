/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.preloadsScriptStr = preloadsScriptStr;
    async function webviewPreloads(ctx) {
        /* eslint-disable no-restricted-globals */
        // The use of global `window` should be fine in this context, even
        // with aux windows. This code is running from within an `iframe`
        // where there is only one `window` object anyway.
        const userAgent = navigator.userAgent;
        const isChrome = (userAgent.indexOf('Chrome') >= 0);
        const textEncoder = new TextEncoder();
        const textDecoder = new TextDecoder();
        function promiseWithResolvers() {
            let resolve;
            let reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve: resolve, reject: reject };
        }
        let currentOptions = ctx.options;
        const isWorkspaceTrusted = ctx.isWorkspaceTrusted;
        let currentRenderOptions = ctx.renderOptions;
        const settingChange = createEmitter();
        const acquireVsCodeApi = globalThis.acquireVsCodeApi;
        const vscode = acquireVsCodeApi();
        delete globalThis.acquireVsCodeApi;
        const tokenizationStyle = new CSSStyleSheet();
        tokenizationStyle.replaceSync(ctx.style.tokenizationCss);
        const runWhenIdle = (typeof requestIdleCallback !== 'function' || typeof cancelIdleCallback !== 'function')
            ? (runner) => {
                setTimeout(() => {
                    if (disposed) {
                        return;
                    }
                    const end = Date.now() + 15; // one frame at 64fps
                    runner(Object.freeze({
                        didTimeout: true,
                        timeRemaining() {
                            return Math.max(0, end - Date.now());
                        }
                    }));
                });
                let disposed = false;
                return {
                    dispose() {
                        if (disposed) {
                            return;
                        }
                        disposed = true;
                    }
                };
            }
            : (runner, timeout) => {
                const handle = requestIdleCallback(runner, typeof timeout === 'number' ? { timeout } : undefined);
                let disposed = false;
                return {
                    dispose() {
                        if (disposed) {
                            return;
                        }
                        disposed = true;
                        cancelIdleCallback(handle);
                    }
                };
            };
        function getOutputContainer(event) {
            for (const node of event.composedPath()) {
                if (node instanceof HTMLElement && node.classList.contains('output')) {
                    return {
                        id: node.id
                    };
                }
            }
            return;
        }
        let lastFocusedOutput = undefined;
        const handleOutputFocusOut = (event) => {
            const outputFocus = event && getOutputContainer(event);
            if (!outputFocus) {
                return;
            }
            // Possible we're tabbing through the elements of the same output.
            // Lets see if focus is set back to the same output.
            lastFocusedOutput = undefined;
            setTimeout(() => {
                if (lastFocusedOutput?.id === outputFocus.id) {
                    return;
                }
                postNotebookMessage('outputBlur', outputFocus);
            }, 0);
        };
        // check if an input element is focused within the output element
        const checkOutputInputFocus = (e) => {
            lastFocusedOutput = getOutputContainer(e);
            const activeElement = window.document.activeElement;
            if (!activeElement) {
                return;
            }
            const id = lastFocusedOutput?.id;
            if (id && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
                postNotebookMessage('outputInputFocus', { inputFocused: true, id });
                activeElement.addEventListener('blur', () => {
                    postNotebookMessage('outputInputFocus', { inputFocused: false, id });
                }, { once: true });
            }
        };
        const handleInnerClick = (event) => {
            if (!event || !event.view || !event.view.document) {
                return;
            }
            const outputFocus = lastFocusedOutput = getOutputContainer(event);
            for (const node of event.composedPath()) {
                if (node instanceof HTMLAnchorElement && node.href) {
                    if (node.href.startsWith('blob:')) {
                        if (outputFocus) {
                            postNotebookMessage('outputFocus', outputFocus);
                        }
                        handleBlobUrlClick(node.href, node.download);
                    }
                    else if (node.href.startsWith('data:')) {
                        if (outputFocus) {
                            postNotebookMessage('outputFocus', outputFocus);
                        }
                        handleDataUrl(node.href, node.download);
                    }
                    else if (node.getAttribute('href')?.trim().startsWith('#')) {
                        // Scrolling to location within current doc
                        if (!node.hash) {
                            postNotebookMessage('scroll-to-reveal', { scrollTop: 0 });
                            return;
                        }
                        const targetId = node.hash.substring(1);
                        // Check outer document first
                        let scrollTarget = event.view.document.getElementById(targetId);
                        if (!scrollTarget) {
                            // Fallback to checking preview shadow doms
                            for (const preview of event.view.document.querySelectorAll('.preview')) {
                                scrollTarget = preview.shadowRoot?.getElementById(targetId);
                                if (scrollTarget) {
                                    break;
                                }
                            }
                        }
                        if (scrollTarget) {
                            const scrollTop = scrollTarget.getBoundingClientRect().top + event.view.scrollY;
                            postNotebookMessage('scroll-to-reveal', { scrollTop });
                            return;
                        }
                    }
                    else {
                        const href = node.getAttribute('href');
                        if (href) {
                            if (href.startsWith('command:') && outputFocus) {
                                postNotebookMessage('outputFocus', outputFocus);
                            }
                            postNotebookMessage('clicked-link', { href });
                        }
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }
            if (outputFocus) {
                postNotebookMessage('outputFocus', outputFocus);
            }
        };
        const blurOutput = () => {
            const selection = window.getSelection();
            if (!selection) {
                return;
            }
            selection.removeAllRanges();
        };
        const selectOutputContents = (cellOrOutputId) => {
            const selection = window.getSelection();
            if (!selection) {
                return;
            }
            const cellOutputContainer = window.document.getElementById(cellOrOutputId);
            if (!cellOutputContainer) {
                return;
            }
            selection.removeAllRanges();
            const range = document.createRange();
            range.selectNode(cellOutputContainer);
            selection.addRange(range);
        };
        const selectInputContents = (cellOrOutputId) => {
            const cellOutputContainer = window.document.getElementById(cellOrOutputId);
            if (!cellOutputContainer) {
                return;
            }
            const activeElement = window.document.activeElement;
            if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
                activeElement.select();
            }
        };
        const onPageUpDownSelectionHandler = (e) => {
            if (!lastFocusedOutput?.id || !e.shiftKey) {
                return;
            }
            // If we're pressing `Shift+Up/Down` then we want to select a line at a time.
            if (e.shiftKey && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
                e.stopPropagation(); // We don't want the notebook to handle this, default behavior is what we need.
                return;
            }
            // We want to handle just `Shift + PageUp/PageDown` & `Shift + Cmd + ArrowUp/ArrowDown` (for mac)
            if (!(e.code === 'PageUp' || e.code === 'PageDown') && !(e.metaKey && (e.code === 'ArrowDown' || e.code === 'ArrowUp'))) {
                return;
            }
            const outputContainer = window.document.getElementById(lastFocusedOutput.id);
            const selection = window.getSelection();
            if (!outputContainer || !selection?.anchorNode) {
                return;
            }
            const activeElement = window.document.activeElement;
            if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
                // Leave for default behavior.
                return;
            }
            // These should change the scroll position, not adjust the selected cell in the notebook
            e.stopPropagation(); // We don't want the notebook to handle this.
            e.preventDefault(); // We will handle selection.
            const { anchorNode, anchorOffset } = selection;
            const range = document.createRange();
            if (e.code === 'PageDown' || e.code === 'ArrowDown') {
                range.setStart(anchorNode, anchorOffset);
                range.setEnd(outputContainer, 1);
            }
            else {
                range.setStart(outputContainer, 0);
                range.setEnd(anchorNode, anchorOffset);
            }
            selection.removeAllRanges();
            selection.addRange(range);
        };
        const disableNativeSelectAll = (e) => {
            if (!lastFocusedOutput?.id) {
                return;
            }
            const activeElement = window.document.activeElement;
            if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
                // The input element will handle this.
                return;
            }
            if ((e.key === 'a' && e.ctrlKey) || (e.metaKey && e.key === 'a')) {
                e.preventDefault(); // We will handle selection in editor code.
                return;
            }
        };
        const handleDataUrl = async (data, downloadName) => {
            postNotebookMessage('clicked-data-url', {
                data,
                downloadName
            });
        };
        const handleBlobUrlClick = async (url, downloadName) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    handleDataUrl(reader.result, downloadName);
                });
                reader.readAsDataURL(blob);
            }
            catch (e) {
                console.error(e.message);
            }
        };
        window.document.body.addEventListener('click', handleInnerClick);
        window.document.body.addEventListener('focusin', checkOutputInputFocus);
        window.document.body.addEventListener('focusout', handleOutputFocusOut);
        window.document.body.addEventListener('keydown', onPageUpDownSelectionHandler);
        window.document.body.addEventListener('keydown', disableNativeSelectAll);
        function createKernelContext() {
            return Object.freeze({
                onDidReceiveKernelMessage: onDidReceiveKernelMessage.event,
                postKernelMessage: (data) => postNotebookMessage('customKernelMessage', { message: data }),
            });
        }
        async function runKernelPreload(url) {
            try {
                return await activateModuleKernelPreload(url);
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        }
        async function activateModuleKernelPreload(url) {
            const module = await __import(url);
            if (!module.activate) {
                console.error(`Notebook preload '${url}' was expected to be a module but it does not export an 'activate' function`);
                return;
            }
            return module.activate(createKernelContext());
        }
        const dimensionUpdater = new class {
            constructor() {
                this.pending = new Map();
            }
            updateHeight(id, height, options) {
                if (!this.pending.size) {
                    setTimeout(() => {
                        this.updateImmediately();
                    }, 0);
                }
                const update = this.pending.get(id);
                if (update && update.isOutput) {
                    this.pending.set(id, {
                        id,
                        height,
                        init: update.init,
                        isOutput: update.isOutput,
                    });
                }
                else {
                    this.pending.set(id, {
                        id,
                        height,
                        ...options,
                    });
                }
            }
            updateImmediately() {
                if (!this.pending.size) {
                    return;
                }
                postNotebookMessage('dimension', {
                    updates: Array.from(this.pending.values())
                });
                this.pending.clear();
            }
        };
        const resizeObserver = new class {
            constructor() {
                this._observedElements = new WeakMap();
                this._observer = new ResizeObserver(entries => {
                    for (const entry of entries) {
                        if (!window.document.body.contains(entry.target)) {
                            continue;
                        }
                        const observedElementInfo = this._observedElements.get(entry.target);
                        if (!observedElementInfo) {
                            continue;
                        }
                        this.postResizeMessage(observedElementInfo.cellId);
                        if (entry.target.id !== observedElementInfo.id) {
                            continue;
                        }
                        if (!entry.contentRect) {
                            continue;
                        }
                        if (!observedElementInfo.output) {
                            // markup, update directly
                            this.updateHeight(observedElementInfo, entry.target.offsetHeight);
                            continue;
                        }
                        const newHeight = entry.contentRect.height;
                        const shouldUpdatePadding = (newHeight !== 0 && observedElementInfo.lastKnownPadding === 0) ||
                            (newHeight === 0 && observedElementInfo.lastKnownPadding !== 0);
                        if (shouldUpdatePadding) {
                            // Do not update dimension in resize observer
                            window.requestAnimationFrame(() => {
                                if (newHeight !== 0) {
                                    entry.target.style.padding = `${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodeLeftPadding}px`;
                                }
                                else {
                                    entry.target.style.padding = `0px`;
                                }
                                this.updateHeight(observedElementInfo, entry.target.offsetHeight);
                            });
                        }
                        else {
                            this.updateHeight(observedElementInfo, entry.target.offsetHeight);
                        }
                    }
                });
            }
            updateHeight(observedElementInfo, offsetHeight) {
                if (observedElementInfo.lastKnownHeight !== offsetHeight) {
                    observedElementInfo.lastKnownHeight = offsetHeight;
                    dimensionUpdater.updateHeight(observedElementInfo.id, offsetHeight, {
                        isOutput: observedElementInfo.output
                    });
                }
            }
            observe(container, id, output, cellId) {
                if (this._observedElements.has(container)) {
                    return;
                }
                this._observedElements.set(container, { id, output, lastKnownPadding: ctx.style.outputNodePadding, lastKnownHeight: -1, cellId });
                this._observer.observe(container);
            }
            postResizeMessage(cellId) {
                // Debounce this callback to only happen after
                // 250 ms. Don't need resize events that often.
                clearTimeout(this._outputResizeTimer);
                this._outputResizeTimer = setTimeout(() => {
                    postNotebookMessage('outputResized', {
                        cellId
                    });
                }, 250);
            }
        };
        let previousDelta;
        let scrollTimeout;
        let scrolledElement;
        let lastTimeScrolled;
        function flagRecentlyScrolled(node, deltaY) {
            scrolledElement = node;
            if (deltaY === undefined) {
                lastTimeScrolled = Date.now();
                previousDelta = undefined;
                node.setAttribute('recentlyScrolled', 'true');
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => { scrolledElement?.removeAttribute('recentlyScrolled'); }, 300);
                return true;
            }
            if (node.hasAttribute('recentlyScrolled')) {
                if (lastTimeScrolled && Date.now() - lastTimeScrolled > 400) {
                    // it has been a while since we actually scrolled
                    // if scroll velocity increases significantly, it's likely a new scroll event
                    if (!!previousDelta && deltaY < 0 && deltaY < previousDelta - 8) {
                        clearTimeout(scrollTimeout);
                        scrolledElement?.removeAttribute('recentlyScrolled');
                        return false;
                    }
                    else if (!!previousDelta && deltaY > 0 && deltaY > previousDelta + 8) {
                        clearTimeout(scrollTimeout);
                        scrolledElement?.removeAttribute('recentlyScrolled');
                        return false;
                    }
                    // the tail end of a smooth scrolling event (from a trackpad) can go on for a while
                    // so keep swallowing it, but we can shorten the timeout since the events occur rapidly
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => { scrolledElement?.removeAttribute('recentlyScrolled'); }, 50);
                }
                else {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => { scrolledElement?.removeAttribute('recentlyScrolled'); }, 300);
                }
                previousDelta = deltaY;
                return true;
            }
            return false;
        }
        function eventTargetShouldHandleScroll(event) {
            for (let node = event.target; node; node = node.parentNode) {
                if (!(node instanceof Element) || node.id === 'container' || node.classList.contains('cell_container') || node.classList.contains('markup') || node.classList.contains('output_container')) {
                    return false;
                }
                // scroll up
                if (event.deltaY < 0 && node.scrollTop > 0) {
                    // there is still some content to scroll
                    flagRecentlyScrolled(node);
                    return true;
                }
                // scroll down
                if (event.deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight) {
                    // per https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
                    // scrollTop is not rounded but scrollHeight and clientHeight are
                    // so we need to check if the difference is less than some threshold
                    if (node.scrollHeight - node.scrollTop - node.clientHeight < 2) {
                        continue;
                    }
                    // if the node is not scrollable, we can continue. We don't check the computed style always as it's expensive
                    if (window.getComputedStyle(node).overflowY === 'hidden' || window.getComputedStyle(node).overflowY === 'visible') {
                        continue;
                    }
                    flagRecentlyScrolled(node);
                    return true;
                }
                if (flagRecentlyScrolled(node, event.deltaY)) {
                    return true;
                }
            }
            return false;
        }
        const handleWheel = (event) => {
            if (event.defaultPrevented || eventTargetShouldHandleScroll(event)) {
                return;
            }
            postNotebookMessage('did-scroll-wheel', {
                payload: {
                    deltaMode: event.deltaMode,
                    deltaX: event.deltaX,
                    deltaY: event.deltaY,
                    deltaZ: event.deltaZ,
                    // Refs https://github.com/microsoft/vscode/issues/146403#issuecomment-1854538928
                    wheelDelta: event.wheelDelta && isChrome ? (event.wheelDelta / window.devicePixelRatio) : event.wheelDelta,
                    wheelDeltaX: event.wheelDeltaX && isChrome ? (event.wheelDeltaX / window.devicePixelRatio) : event.wheelDeltaX,
                    wheelDeltaY: event.wheelDeltaY && isChrome ? (event.wheelDeltaY / window.devicePixelRatio) : event.wheelDeltaY,
                    detail: event.detail,
                    shiftKey: event.shiftKey,
                    type: event.type
                }
            });
        };
        function focusFirstFocusableOrContainerInOutput(cellOrOutputId, alternateId) {
            const cellOutputContainer = window.document.getElementById(cellOrOutputId) ??
                (alternateId ? window.document.getElementById(alternateId) : undefined);
            if (cellOutputContainer) {
                if (cellOutputContainer.contains(window.document.activeElement)) {
                    return;
                }
                const id = cellOutputContainer.id;
                let focusableElement = cellOutputContainer.querySelector('[tabindex="0"], [href], button, input, option, select, textarea');
                if (!focusableElement) {
                    focusableElement = cellOutputContainer;
                    focusableElement.tabIndex = -1;
                    postNotebookMessage('outputInputFocus', { inputFocused: false, id });
                }
                else {
                    const inputFocused = focusableElement.tagName === 'INPUT' || focusableElement.tagName === 'TEXTAREA';
                    postNotebookMessage('outputInputFocus', { inputFocused, id });
                }
                lastFocusedOutput = cellOutputContainer;
                postNotebookMessage('outputFocus', { id: cellOutputContainer.id });
                focusableElement.focus();
            }
        }
        function createFocusSink(cellId, focusNext) {
            const element = document.createElement('div');
            element.id = `focus-sink-${cellId}`;
            element.tabIndex = 0;
            element.addEventListener('focus', () => {
                postNotebookMessage('focus-editor', {
                    cellId: cellId,
                    focusNext
                });
            });
            return element;
        }
        function _internalHighlightRange(range, tagName = 'mark', attributes = {}) {
            // derived from https://github.com/Treora/dom-highlight-range/blob/master/highlight-range.js
            // Return an array of the text nodes in the range. Split the start and end nodes if required.
            function _textNodesInRange(range) {
                if (!range.startContainer.ownerDocument) {
                    return [];
                }
                // If the start or end node is a text node and only partly in the range, split it.
                if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
                    const startContainer = range.startContainer;
                    const endOffset = range.endOffset; // (this may get lost when the splitting the node)
                    const createdNode = startContainer.splitText(range.startOffset);
                    if (range.endContainer === startContainer) {
                        // If the end was in the same container, it will now be in the newly created node.
                        range.setEnd(createdNode, endOffset - range.startOffset);
                    }
                    range.setStart(createdNode, 0);
                }
                if (range.endContainer.nodeType === Node.TEXT_NODE
                    && range.endOffset < range.endContainer.length) {
                    range.endContainer.splitText(range.endOffset);
                }
                // Collect the text nodes.
                const walker = range.startContainer.ownerDocument.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, node => range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT);
                walker.currentNode = range.startContainer;
                // // Optimise by skipping nodes that are explicitly outside the range.
                // const NodeTypesWithCharacterOffset = [
                //  Node.TEXT_NODE,
                //  Node.PROCESSING_INSTRUCTION_NODE,
                //  Node.COMMENT_NODE,
                // ];
                // if (!NodeTypesWithCharacterOffset.includes(range.startContainer.nodeType)) {
                //   if (range.startOffset < range.startContainer.childNodes.length) {
                //     walker.currentNode = range.startContainer.childNodes[range.startOffset];
                //   } else {
                //     walker.nextSibling(); // TODO verify this is correct.
                //   }
                // }
                const nodes = [];
                if (walker.currentNode.nodeType === Node.TEXT_NODE) {
                    nodes.push(walker.currentNode);
                }
                while (walker.nextNode() && range.comparePoint(walker.currentNode, 0) !== 1) {
                    if (walker.currentNode.nodeType === Node.TEXT_NODE) {
                        nodes.push(walker.currentNode);
                    }
                }
                return nodes;
            }
            // Replace [node] with <tagName ...attributes>[node]</tagName>
            function wrapNodeInHighlight(node, tagName, attributes) {
                const highlightElement = node.ownerDocument.createElement(tagName);
                Object.keys(attributes).forEach(key => {
                    highlightElement.setAttribute(key, attributes[key]);
                });
                const tempRange = node.ownerDocument.createRange();
                tempRange.selectNode(node);
                tempRange.surroundContents(highlightElement);
                return highlightElement;
            }
            if (range.collapsed) {
                return {
                    remove: () => { },
                    update: () => { }
                };
            }
            // First put all nodes in an array (splits start and end nodes if needed)
            const nodes = _textNodesInRange(range);
            // Highlight each node
            const highlightElements = [];
            for (const nodeIdx in nodes) {
                const highlightElement = wrapNodeInHighlight(nodes[nodeIdx], tagName, attributes);
                highlightElements.push(highlightElement);
            }
            // Remove a highlight element created with wrapNodeInHighlight.
            function _removeHighlight(highlightElement) {
                if (highlightElement.childNodes.length === 1) {
                    highlightElement.parentNode?.replaceChild(highlightElement.firstChild, highlightElement);
                }
                else {
                    // If the highlight somehow contains multiple nodes now, move them all.
                    while (highlightElement.firstChild) {
                        highlightElement.parentNode?.insertBefore(highlightElement.firstChild, highlightElement);
                    }
                    highlightElement.remove();
                }
            }
            // Return a function that cleans up the highlightElements.
            function _removeHighlights() {
                // Remove each of the created highlightElements.
                for (const highlightIdx in highlightElements) {
                    _removeHighlight(highlightElements[highlightIdx]);
                }
            }
            function _updateHighlight(highlightElement, attributes = {}) {
                Object.keys(attributes).forEach(key => {
                    highlightElement.setAttribute(key, attributes[key]);
                });
            }
            function updateHighlights(attributes) {
                for (const highlightIdx in highlightElements) {
                    _updateHighlight(highlightElements[highlightIdx], attributes);
                }
            }
            return {
                remove: _removeHighlights,
                update: updateHighlights
            };
        }
        function selectRange(_range) {
            const sel = window.getSelection();
            if (sel) {
                try {
                    sel.removeAllRanges();
                    const r = document.createRange();
                    r.setStart(_range.startContainer, _range.startOffset);
                    r.setEnd(_range.endContainer, _range.endOffset);
                    sel.addRange(r);
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
        function highlightRange(range, useCustom, tagName = 'mark', attributes = {}) {
            if (useCustom) {
                const ret = _internalHighlightRange(range, tagName, attributes);
                return {
                    range: range,
                    dispose: ret.remove,
                    update: (color, className) => {
                        if (className === undefined) {
                            ret.update({
                                'style': `background-color: ${color}`
                            });
                        }
                        else {
                            ret.update({
                                'class': className
                            });
                        }
                    }
                };
            }
            else {
                window.document.execCommand('hiliteColor', false, matchColor);
                const cloneRange = window.getSelection().getRangeAt(0).cloneRange();
                const _range = {
                    collapsed: cloneRange.collapsed,
                    commonAncestorContainer: cloneRange.commonAncestorContainer,
                    endContainer: cloneRange.endContainer,
                    endOffset: cloneRange.endOffset,
                    startContainer: cloneRange.startContainer,
                    startOffset: cloneRange.startOffset
                };
                return {
                    range: _range,
                    dispose: () => {
                        selectRange(_range);
                        try {
                            document.designMode = 'On';
                            window.document.execCommand('removeFormat', false, undefined);
                            document.designMode = 'Off';
                            window.getSelection()?.removeAllRanges();
                        }
                        catch (e) {
                            console.log(e);
                        }
                    },
                    update: (color, className) => {
                        selectRange(_range);
                        try {
                            document.designMode = 'On';
                            window.document.execCommand('removeFormat', false, undefined);
                            window.document.execCommand('hiliteColor', false, color);
                            document.designMode = 'Off';
                            window.getSelection()?.removeAllRanges();
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                };
            }
        }
        function createEmitter(listenerChange = () => undefined) {
            const listeners = new Set();
            return {
                fire(data) {
                    for (const listener of [...listeners]) {
                        listener.fn.call(listener.thisArg, data);
                    }
                },
                event(fn, thisArg, disposables) {
                    const listenerObj = { fn, thisArg };
                    const disposable = {
                        dispose: () => {
                            listeners.delete(listenerObj);
                            listenerChange(listeners);
                        },
                    };
                    listeners.add(listenerObj);
                    listenerChange(listeners);
                    if (disposables instanceof Array) {
                        disposables.push(disposable);
                    }
                    else if (disposables) {
                        disposables.add(disposable);
                    }
                    return disposable;
                },
            };
        }
        function showRenderError(errorText, outputNode, errors) {
            outputNode.innerText = errorText;
            const errList = document.createElement('ul');
            for (const result of errors) {
                console.error(result);
                const item = document.createElement('li');
                item.innerText = result.message;
                errList.appendChild(item);
            }
            outputNode.appendChild(errList);
        }
        const outputItemRequests = new class {
            constructor() {
                this._requestPool = 0;
                this._requests = new Map();
            }
            getOutputItem(outputId, mime) {
                const requestId = this._requestPool++;
                const { promise, resolve } = promiseWithResolvers();
                this._requests.set(requestId, { resolve });
                postNotebookMessage('getOutputItem', { requestId, outputId, mime });
                return promise;
            }
            resolveOutputItem(requestId, output) {
                const request = this._requests.get(requestId);
                if (!request) {
                    return;
                }
                this._requests.delete(requestId);
                request.resolve(output);
            }
        };
        let hasWarnedAboutAllOutputItemsProposal = false;
        function createOutputItem(id, mime, metadata, valueBytes, allOutputItemData, appended) {
            function create(id, mime, metadata, valueBytes, appended) {
                return Object.freeze({
                    id,
                    mime,
                    metadata,
                    appendedText() {
                        if (appended) {
                            return textDecoder.decode(appended.valueBytes);
                        }
                        return undefined;
                    },
                    data() {
                        return valueBytes;
                    },
                    text() {
                        return textDecoder.decode(valueBytes);
                    },
                    json() {
                        return JSON.parse(this.text());
                    },
                    blob() {
                        return new Blob([valueBytes], { type: this.mime });
                    },
                    get _allOutputItems() {
                        if (!hasWarnedAboutAllOutputItemsProposal) {
                            hasWarnedAboutAllOutputItemsProposal = true;
                            console.warn(`'_allOutputItems' is proposed API. DO NOT ship an extension that depends on it!`);
                        }
                        return allOutputItemList;
                    },
                });
            }
            const allOutputItemCache = new Map();
            const allOutputItemList = Object.freeze(allOutputItemData.map(outputItem => {
                const mime = outputItem.mime;
                return Object.freeze({
                    mime,
                    getItem() {
                        const existingTask = allOutputItemCache.get(mime);
                        if (existingTask) {
                            return existingTask;
                        }
                        const task = outputItemRequests.getOutputItem(id, mime).then(item => {
                            return item ? create(id, item.mime, metadata, item.valueBytes) : undefined;
                        });
                        allOutputItemCache.set(mime, task);
                        return task;
                    }
                });
            }));
            const item = create(id, mime, metadata, valueBytes, appended);
            allOutputItemCache.set(mime, Promise.resolve(item));
            return item;
        }
        const onDidReceiveKernelMessage = createEmitter();
        const ttPolicy = window.trustedTypes?.createPolicy('notebookRenderer', {
            createHTML: value => value, // CodeQL [SM03712] The rendered content is provided by renderer extensions, which are responsible for sanitizing their content themselves. The notebook webview is also sandboxed.
            createScript: value => value, // CodeQL [SM03712] The rendered content is provided by renderer extensions, which are responsible for sanitizing their content themselves. The notebook webview is also sandboxed.
        });
        window.addEventListener('wheel', handleWheel);
        const matchColor = window.getComputedStyle(window.document.getElementById('_defaultColorPalatte')).color;
        const currentMatchColor = window.getComputedStyle(window.document.getElementById('_defaultColorPalatte')).backgroundColor;
        class JSHighlighter {
            constructor() {
                this._activeHighlightInfo = new Map();
            }
            addHighlights(matches, ownerID) {
                for (let i = matches.length - 1; i >= 0; i--) {
                    const match = matches[i];
                    const ret = highlightRange(match.originalRange, true, 'mark', match.isShadow ? {
                        'style': 'background-color: ' + matchColor + ';',
                    } : {
                        'class': 'find-match'
                    });
                    match.highlightResult = ret;
                }
                const highlightInfo = {
                    matches,
                    currentMatchIndex: -1
                };
                this._activeHighlightInfo.set(ownerID, highlightInfo);
            }
            removeHighlights(ownerID) {
                this._activeHighlightInfo.get(ownerID)?.matches.forEach(match => {
                    match.highlightResult?.dispose();
                });
                this._activeHighlightInfo.delete(ownerID);
            }
            highlightCurrentMatch(index, ownerID) {
                const highlightInfo = this._activeHighlightInfo.get(ownerID);
                if (!highlightInfo) {
                    console.error('Modified current highlight match before adding highlight list.');
                    return;
                }
                const oldMatch = highlightInfo.matches[highlightInfo.currentMatchIndex];
                oldMatch?.highlightResult?.update(matchColor, oldMatch.isShadow ? undefined : 'find-match');
                const match = highlightInfo.matches[index];
                highlightInfo.currentMatchIndex = index;
                const sel = window.getSelection();
                if (!!match && !!sel && match.highlightResult) {
                    let offset = 0;
                    try {
                        const outputOffset = window.document.getElementById(match.id).getBoundingClientRect().top;
                        const tempRange = document.createRange();
                        tempRange.selectNode(match.highlightResult.range.startContainer);
                        match.highlightResult.range.startContainer.parentElement?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
                        const rangeOffset = tempRange.getBoundingClientRect().top;
                        tempRange.detach();
                        offset = rangeOffset - outputOffset;
                    }
                    catch (e) {
                        console.error(e);
                    }
                    match.highlightResult?.update(currentMatchColor, match.isShadow ? undefined : 'current-find-match');
                    window.document.getSelection()?.removeAllRanges();
                    postNotebookMessage('didFindHighlightCurrent', {
                        offset
                    });
                }
            }
            unHighlightCurrentMatch(index, ownerID) {
                const highlightInfo = this._activeHighlightInfo.get(ownerID);
                if (!highlightInfo) {
                    return;
                }
                const oldMatch = highlightInfo.matches[index];
                if (oldMatch && oldMatch.highlightResult) {
                    oldMatch.highlightResult.update(matchColor, oldMatch.isShadow ? undefined : 'find-match');
                }
            }
            dispose() {
                window.document.getSelection()?.removeAllRanges();
                this._activeHighlightInfo.forEach(highlightInfo => {
                    highlightInfo.matches.forEach(match => {
                        match.highlightResult?.dispose();
                    });
                });
            }
        }
        class CSSHighlighter {
            constructor() {
                this._activeHighlightInfo = new Map();
                this._matchesHighlight = new Highlight();
                this._matchesHighlight.priority = 1;
                this._currentMatchesHighlight = new Highlight();
                this._currentMatchesHighlight.priority = 2;
                CSS.highlights?.set(`find-highlight`, this._matchesHighlight);
                CSS.highlights?.set(`current-find-highlight`, this._currentMatchesHighlight);
            }
            _refreshRegistry(updateMatchesHighlight = true) {
                // for performance reasons, only update the full list of highlights when we need to
                if (updateMatchesHighlight) {
                    this._matchesHighlight.clear();
                }
                this._currentMatchesHighlight.clear();
                this._activeHighlightInfo.forEach((highlightInfo) => {
                    if (updateMatchesHighlight) {
                        for (let i = 0; i < highlightInfo.matches.length; i++) {
                            this._matchesHighlight.add(highlightInfo.matches[i].originalRange);
                        }
                    }
                    if (highlightInfo.currentMatchIndex < highlightInfo.matches.length && highlightInfo.currentMatchIndex >= 0) {
                        this._currentMatchesHighlight.add(highlightInfo.matches[highlightInfo.currentMatchIndex].originalRange);
                    }
                });
            }
            addHighlights(matches, ownerID) {
                for (let i = 0; i < matches.length; i++) {
                    this._matchesHighlight.add(matches[i].originalRange);
                }
                const newEntry = {
                    matches,
                    currentMatchIndex: -1,
                };
                this._activeHighlightInfo.set(ownerID, newEntry);
            }
            highlightCurrentMatch(index, ownerID) {
                const highlightInfo = this._activeHighlightInfo.get(ownerID);
                if (!highlightInfo) {
                    console.error('Modified current highlight match before adding highlight list.');
                    return;
                }
                highlightInfo.currentMatchIndex = index;
                const match = highlightInfo.matches[index];
                if (match) {
                    let offset = 0;
                    try {
                        const outputOffset = window.document.getElementById(match.id).getBoundingClientRect().top;
                        match.originalRange.startContainer.parentElement?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
                        const rangeOffset = match.originalRange.getBoundingClientRect().top;
                        offset = rangeOffset - outputOffset;
                        postNotebookMessage('didFindHighlightCurrent', {
                            offset
                        });
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                this._refreshRegistry(false);
            }
            unHighlightCurrentMatch(index, ownerID) {
                const highlightInfo = this._activeHighlightInfo.get(ownerID);
                if (!highlightInfo) {
                    return;
                }
                highlightInfo.currentMatchIndex = -1;
            }
            removeHighlights(ownerID) {
                this._activeHighlightInfo.delete(ownerID);
                this._refreshRegistry();
            }
            dispose() {
                window.document.getSelection()?.removeAllRanges();
                this._currentMatchesHighlight.clear();
                this._matchesHighlight.clear();
            }
        }
        const _highlighter = (CSS.highlights) ? new CSSHighlighter() : new JSHighlighter();
        function extractSelectionLine(selection) {
            const range = selection.getRangeAt(0);
            // we need to keep a reference to the old selection range to re-apply later
            const oldRange = range.cloneRange();
            const captureLength = selection.toString().length;
            // use selection API to modify selection to get entire line (the first line if multi-select)
            // collapse selection to start so that the cursor position is at beginning of match
            selection.collapseToStart();
            // extend selection in both directions to select the line
            selection.modify('move', 'backward', 'lineboundary');
            selection.modify('extend', 'forward', 'lineboundary');
            const line = selection.toString();
            // using the original range and the new range, we can find the offset of the match from the line start.
            const rangeStart = getStartOffset(selection.getRangeAt(0), oldRange);
            // line range for match
            const lineRange = {
                start: rangeStart,
                end: rangeStart + captureLength,
            };
            // re-add the old range so that the selection is restored
            selection.removeAllRanges();
            selection.addRange(oldRange);
            return { line, range: lineRange };
        }
        function getStartOffset(lineRange, originalRange) {
            // sometimes, the old and new range are in different DOM elements (ie: when the match is inside of <b></b>)
            // so we need to find the first common ancestor DOM element and find the positions of the old and new range relative to that.
            const firstCommonAncestor = findFirstCommonAncestor(lineRange.startContainer, originalRange.startContainer);
            const selectionOffset = getSelectionOffsetRelativeTo(firstCommonAncestor, lineRange.startContainer) + lineRange.startOffset;
            const textOffset = getSelectionOffsetRelativeTo(firstCommonAncestor, originalRange.startContainer) + originalRange.startOffset;
            return textOffset - selectionOffset;
        }
        // modified from https://stackoverflow.com/a/68583466/16253823
        function findFirstCommonAncestor(nodeA, nodeB) {
            const range = new Range();
            range.setStart(nodeA, 0);
            range.setEnd(nodeB, 0);
            return range.commonAncestorContainer;
        }
        function getTextContentLength(node) {
            let length = 0;
            if (node.nodeType === Node.TEXT_NODE) {
                length += node.textContent?.length || 0;
            }
            else {
                for (const childNode of node.childNodes) {
                    length += getTextContentLength(childNode);
                }
            }
            return length;
        }
        // modified from https://stackoverflow.com/a/48812529/16253823
        function getSelectionOffsetRelativeTo(parentElement, currentNode) {
            if (!currentNode) {
                return 0;
            }
            let offset = 0;
            if (currentNode === parentElement || !parentElement.contains(currentNode)) {
                return offset;
            }
            // count the number of chars before the current dom elem and the start of the dom
            let prevSibling = currentNode.previousSibling;
            while (prevSibling) {
                offset += getTextContentLength(prevSibling);
                prevSibling = prevSibling.previousSibling;
            }
            return offset + getSelectionOffsetRelativeTo(parentElement, currentNode.parentNode);
        }
        const find = (query, options) => {
            let find = true;
            const matches = [];
            const range = document.createRange();
            range.selectNodeContents(window.document.getElementById('findStart'));
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
            viewModel.toggleDragDropEnabled(false);
            try {
                document.designMode = 'On';
                while (find && matches.length < 500) {
                    find = window.find(query, /* caseSensitive*/ !!options.caseSensitive, 
                    /* backwards*/ false, 
                    /* wrapAround*/ false, 
                    /* wholeWord */ !!options.wholeWord, 
                    /* searchInFrames*/ true, false);
                    if (find) {
                        const selection = window.getSelection();
                        if (!selection) {
                            console.log('no selection');
                            break;
                        }
                        // Markdown preview are rendered in a shadow DOM.
                        if (options.includeMarkup && selection.rangeCount > 0 && selection.getRangeAt(0).startContainer.nodeType === 1
                            && selection.getRangeAt(0).startContainer.classList.contains('markup')) {
                            // markdown preview container
                            const preview = selection.anchorNode?.firstChild;
                            const root = preview.shadowRoot;
                            const shadowSelection = root?.getSelection ? root?.getSelection() : null;
                            // find the match in the shadow dom by checking the selection inside the shadow dom
                            if (shadowSelection && shadowSelection.anchorNode) {
                                matches.push({
                                    type: 'preview',
                                    id: preview.id,
                                    cellId: preview.id,
                                    container: preview,
                                    isShadow: true,
                                    originalRange: shadowSelection.getRangeAt(0),
                                    searchPreviewInfo: options.shouldGetSearchPreviewInfo ? extractSelectionLine(shadowSelection) : undefined,
                                });
                            }
                        }
                        // Outputs might be rendered inside a shadow DOM.
                        if (options.includeOutput && selection.rangeCount > 0 && selection.getRangeAt(0).startContainer.nodeType === 1
                            && selection.getRangeAt(0).startContainer.classList.contains('output_container')) {
                            // output container
                            const cellId = selection.getRangeAt(0).startContainer.parentElement.id;
                            const outputNode = selection.anchorNode?.firstChild;
                            const root = outputNode.shadowRoot;
                            const shadowSelection = root?.getSelection ? root?.getSelection() : null;
                            if (shadowSelection && shadowSelection.anchorNode) {
                                matches.push({
                                    type: 'output',
                                    id: outputNode.id,
                                    cellId: cellId,
                                    container: outputNode,
                                    isShadow: true,
                                    originalRange: shadowSelection.getRangeAt(0),
                                    searchPreviewInfo: options.shouldGetSearchPreviewInfo ? extractSelectionLine(shadowSelection) : undefined,
                                });
                            }
                        }
                        const anchorNode = selection.anchorNode?.parentElement;
                        if (anchorNode) {
                            const lastEl = matches.length ? matches[matches.length - 1] : null;
                            // Optimization: avoid searching for the output container
                            if (lastEl && lastEl.container.contains(anchorNode) && options.includeOutput) {
                                matches.push({
                                    type: lastEl.type,
                                    id: lastEl.id,
                                    cellId: lastEl.cellId,
                                    container: lastEl.container,
                                    isShadow: false,
                                    originalRange: selection.getRangeAt(0),
                                    searchPreviewInfo: options.shouldGetSearchPreviewInfo ? extractSelectionLine(selection) : undefined,
                                });
                            }
                            else {
                                // Traverse up the DOM to find the container
                                for (let node = anchorNode; node; node = node.parentElement) {
                                    if (!(node instanceof Element)) {
                                        break;
                                    }
                                    if (node.classList.contains('output') && options.includeOutput) {
                                        // inside output
                                        const cellId = node.parentElement?.parentElement?.id;
                                        if (cellId) {
                                            matches.push({
                                                type: 'output',
                                                id: node.id,
                                                cellId: cellId,
                                                container: node,
                                                isShadow: false,
                                                originalRange: selection.getRangeAt(0),
                                                searchPreviewInfo: options.shouldGetSearchPreviewInfo ? extractSelectionLine(selection) : undefined,
                                            });
                                        }
                                        break;
                                    }
                                    if (node.id === 'container' || node === window.document.body) {
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            break;
                        }
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
            _highlighter.addHighlights(matches, options.ownerID);
            window.document.getSelection()?.removeAllRanges();
            viewModel.toggleDragDropEnabled(currentOptions.dragAndDropEnabled);
            document.designMode = 'Off';
            postNotebookMessage('didFind', {
                matches: matches.map((match, index) => ({
                    type: match.type,
                    id: match.id,
                    cellId: match.cellId,
                    index,
                    searchPreviewInfo: match.searchPreviewInfo,
                }))
            });
        };
        const copyOutputImage = async (outputId, altOutputId, retries = 5) => {
            if (!window.document.hasFocus() && retries > 0) {
                // copyImage can be called from outside of the webview, which means this function may be running whilst the webview is gaining focus.
                // Since navigator.clipboard.write requires the document to be focused, we need to wait for focus.
                // We cannot use a listener, as there is a high chance the focus is gained during the setup of the listener resulting in us missing it.
                setTimeout(() => { copyOutputImage(outputId, altOutputId, retries - 1); }, 50);
                return;
            }
            try {
                const outputElement = window.document.getElementById(outputId)
                    ?? window.document.getElementById(altOutputId);
                let image = outputElement?.querySelector('img');
                if (!image) {
                    const svgImage = outputElement?.querySelector('svg.output-image') ??
                        outputElement?.querySelector('div.svgContainerStyle > svg');
                    if (svgImage) {
                        image = new Image();
                        image.src = 'data:image/svg+xml,' + encodeURIComponent(svgImage.outerHTML);
                    }
                }
                if (image) {
                    const imageToCopy = image;
                    await navigator.clipboard.write([new ClipboardItem({
                            'image/png': new Promise((resolve) => {
                                const canvas = document.createElement('canvas');
                                canvas.width = imageToCopy.naturalWidth;
                                canvas.height = imageToCopy.naturalHeight;
                                const context = canvas.getContext('2d');
                                context.drawImage(imageToCopy, 0, 0);
                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        resolve(blob);
                                    }
                                    else {
                                        console.error('No blob data to write to clipboard');
                                    }
                                    canvas.remove();
                                }, 'image/png');
                            })
                        })]);
                }
                else {
                    console.error('Could not find image element to copy for output with id', outputId);
                }
            }
            catch (e) {
                console.error('Could not copy image:', e);
            }
        };
        window.addEventListener('message', async (rawEvent) => {
            const event = rawEvent;
            switch (event.data.type) {
                case 'initializeMarkup': {
                    try {
                        await Promise.all(event.data.cells.map(info => viewModel.ensureMarkupCell(info)));
                    }
                    finally {
                        dimensionUpdater.updateImmediately();
                        postNotebookMessage('initializedMarkup', { requestId: event.data.requestId });
                    }
                    break;
                }
                case 'createMarkupCell':
                    viewModel.ensureMarkupCell(event.data.cell);
                    break;
                case 'showMarkupCell':
                    viewModel.showMarkupCell(event.data.id, event.data.top, event.data.content, event.data.metadata);
                    break;
                case 'hideMarkupCells':
                    for (const id of event.data.ids) {
                        viewModel.hideMarkupCell(id);
                    }
                    break;
                case 'unhideMarkupCells':
                    for (const id of event.data.ids) {
                        viewModel.unhideMarkupCell(id);
                    }
                    break;
                case 'deleteMarkupCell':
                    for (const id of event.data.ids) {
                        viewModel.deleteMarkupCell(id);
                    }
                    break;
                case 'updateSelectedMarkupCells':
                    viewModel.updateSelectedCells(event.data.selectedCellIds);
                    break;
                case 'html': {
                    const data = event.data;
                    if (data.createOnIdle) {
                        outputRunner.enqueueIdle(data.outputId, signal => {
                            // cancel the idle callback if it exists
                            return viewModel.renderOutputCell(data, signal);
                        });
                    }
                    else {
                        outputRunner.enqueue(data.outputId, signal => {
                            // cancel the idle callback if it exists
                            return viewModel.renderOutputCell(data, signal);
                        });
                    }
                    break;
                }
                case 'view-scroll':
                    {
                        // const date = new Date();
                        // console.log('----- will scroll ----  ', date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds());
                        event.data.widgets.forEach(widget => {
                            outputRunner.enqueue(widget.outputId, () => {
                                viewModel.updateOutputsScroll([widget]);
                            });
                        });
                        viewModel.updateMarkupScrolls(event.data.markupCells);
                        break;
                    }
                case 'clear':
                    renderers.clearAll();
                    viewModel.clearAll();
                    window.document.getElementById('container').innerText = '';
                    break;
                case 'clearOutput': {
                    const { cellId, rendererId, outputId } = event.data;
                    outputRunner.cancelOutput(outputId);
                    viewModel.clearOutput(cellId, outputId, rendererId);
                    break;
                }
                case 'hideOutput': {
                    const { cellId, outputId } = event.data;
                    outputRunner.enqueue(outputId, () => {
                        viewModel.hideOutput(cellId);
                    });
                    break;
                }
                case 'showOutput': {
                    const { outputId, cellTop, cellId, content } = event.data;
                    outputRunner.enqueue(outputId, () => {
                        viewModel.showOutput(cellId, outputId, cellTop);
                        if (content) {
                            viewModel.updateAndRerender(cellId, outputId, content);
                        }
                    });
                    break;
                }
                case 'copyImage': {
                    await copyOutputImage(event.data.outputId, event.data.altOutputId);
                    break;
                }
                case 'ack-dimension': {
                    for (const { cellId, outputId, height } of event.data.updates) {
                        viewModel.updateOutputHeight(cellId, outputId, height);
                    }
                    break;
                }
                case 'preload': {
                    const resources = event.data.resources;
                    for (const { uri } of resources) {
                        kernelPreloads.load(uri);
                    }
                    break;
                }
                case 'updateRenderers': {
                    const { rendererData } = event.data;
                    renderers.updateRendererData(rendererData);
                    break;
                }
                case 'focus-output':
                    focusFirstFocusableOrContainerInOutput(event.data.cellOrOutputId, event.data.alternateId);
                    break;
                case 'blur-output':
                    blurOutput();
                    break;
                case 'select-output-contents':
                    selectOutputContents(event.data.cellOrOutputId);
                    break;
                case 'select-input-contents':
                    selectInputContents(event.data.cellOrOutputId);
                    break;
                case 'decorations': {
                    let outputContainer = window.document.getElementById(event.data.cellId);
                    if (!outputContainer) {
                        viewModel.ensureOutputCell(event.data.cellId, -100000, true);
                        outputContainer = window.document.getElementById(event.data.cellId);
                    }
                    outputContainer?.classList.add(...event.data.addedClassNames);
                    outputContainer?.classList.remove(...event.data.removedClassNames);
                    break;
                }
                case 'customKernelMessage':
                    onDidReceiveKernelMessage.fire(event.data.message);
                    break;
                case 'customRendererMessage':
                    renderers.getRenderer(event.data.rendererId)?.receiveMessage(event.data.message);
                    break;
                case 'notebookStyles': {
                    const documentStyle = window.document.documentElement.style;
                    for (let i = documentStyle.length - 1; i >= 0; i--) {
                        const property = documentStyle[i];
                        // Don't remove properties that the webview might have added separately
                        if (property && property.startsWith('--notebook-')) {
                            documentStyle.removeProperty(property);
                        }
                    }
                    // Re-add new properties
                    for (const [name, value] of Object.entries(event.data.styles)) {
                        documentStyle.setProperty(`--${name}`, value);
                    }
                    break;
                }
                case 'notebookOptions':
                    currentOptions = event.data.options;
                    viewModel.toggleDragDropEnabled(currentOptions.dragAndDropEnabled);
                    currentRenderOptions = event.data.renderOptions;
                    settingChange.fire(currentRenderOptions);
                    break;
                case 'tokenizedCodeBlock': {
                    const { codeBlockId, html } = event.data;
                    MarkdownCodeBlock.highlightCodeBlock(codeBlockId, html);
                    break;
                }
                case 'tokenizedStylesChanged': {
                    tokenizationStyle.replaceSync(event.data.css);
                    break;
                }
                case 'find': {
                    _highlighter.removeHighlights(event.data.options.ownerID);
                    find(event.data.query, event.data.options);
                    break;
                }
                case 'findHighlightCurrent': {
                    _highlighter?.highlightCurrentMatch(event.data.index, event.data.ownerID);
                    break;
                }
                case 'findUnHighlightCurrent': {
                    _highlighter?.unHighlightCurrentMatch(event.data.index, event.data.ownerID);
                    break;
                }
                case 'findStop': {
                    _highlighter.removeHighlights(event.data.ownerID);
                    break;
                }
                case 'returnOutputItem': {
                    outputItemRequests.resolveOutputItem(event.data.requestId, event.data.output);
                }
            }
        });
        const renderFallbackErrorName = 'vscode.fallbackToNextRenderer';
        class Renderer {
            constructor(data) {
                this.data = data;
                this._onMessageEvent = createEmitter();
            }
            receiveMessage(message) {
                this._onMessageEvent.fire(message);
            }
            async renderOutputItem(item, element, signal) {
                try {
                    await this.load();
                }
                catch (e) {
                    if (!signal.aborted) {
                        showRenderError(`Error loading renderer '${this.data.id}'`, element, e instanceof Error ? [e] : []);
                    }
                    return;
                }
                if (!this._api) {
                    if (!signal.aborted) {
                        showRenderError(`Renderer '${this.data.id}' does not implement renderOutputItem`, element, []);
                    }
                    return;
                }
                try {
                    const renderStart = performance.now();
                    await this._api.renderOutputItem(item, element, signal);
                    this.postDebugMessage('Rendered output item', { id: item.id, duration: `${performance.now() - renderStart}ms` });
                }
                catch (e) {
                    if (signal.aborted) {
                        return;
                    }
                    if (e instanceof Error && e.name === renderFallbackErrorName) {
                        throw e;
                    }
                    showRenderError(`Error rendering output item using '${this.data.id}'`, element, e instanceof Error ? [e] : []);
                    this.postDebugMessage('Rendering output item failed', { id: item.id, error: e + '' });
                }
            }
            disposeOutputItem(id) {
                this._api?.disposeOutputItem?.(id);
            }
            createRendererContext() {
                const { id, messaging } = this.data;
                const context = {
                    setState: newState => vscode.setState({ ...vscode.getState(), [id]: newState }),
                    getState: () => {
                        const state = vscode.getState();
                        return typeof state === 'object' && state ? state[id] : undefined;
                    },
                    getRenderer: async (id) => {
                        const renderer = renderers.getRenderer(id);
                        if (!renderer) {
                            return undefined;
                        }
                        if (renderer._api) {
                            return renderer._api;
                        }
                        return renderer.load();
                    },
                    workspace: {
                        get isTrusted() { return isWorkspaceTrusted; }
                    },
                    settings: {
                        get lineLimit() { return currentRenderOptions.lineLimit; },
                        get outputScrolling() { return currentRenderOptions.outputScrolling; },
                        get outputWordWrap() { return currentRenderOptions.outputWordWrap; },
                        get linkifyFilePaths() { return currentRenderOptions.linkifyFilePaths; },
                        get minimalError() { return currentRenderOptions.minimalError; },
                    },
                    get onDidChangeSettings() { return settingChange.event; }
                };
                if (messaging) {
                    context.onDidReceiveMessage = this._onMessageEvent.event;
                    context.postMessage = message => postNotebookMessage('customRendererMessage', { rendererId: id, message });
                }
                return Object.freeze(context);
            }
            load() {
                this._loadPromise ??= this._load();
                return this._loadPromise;
            }
            /** Inner function cached in the _loadPromise(). */
            async _load() {
                this.postDebugMessage('Start loading renderer');
                try {
                    // Preloads need to be loaded before loading renderers.
                    await kernelPreloads.waitForAllCurrent();
                    const importStart = performance.now();
                    const module = await __import(this.data.entrypoint.path);
                    this.postDebugMessage('Imported renderer', { duration: `${performance.now() - importStart}ms` });
                    if (!module) {
                        return;
                    }
                    this._api = await module.activate(this.createRendererContext());
                    this.postDebugMessage('Activated renderer', { duration: `${performance.now() - importStart}ms` });
                    const dependantRenderers = ctx.rendererData
                        .filter(d => d.entrypoint.extends === this.data.id);
                    if (dependantRenderers.length) {
                        this.postDebugMessage('Activating dependant renderers', { dependents: dependantRenderers.map(x => x.id).join(', ') });
                    }
                    // Load all renderers that extend this renderer
                    await Promise.all(dependantRenderers.map(async (d) => {
                        const renderer = renderers.getRenderer(d.id);
                        if (!renderer) {
                            throw new Error(`Could not find extending renderer: ${d.id}`);
                        }
                        try {
                            return await renderer.load();
                        }
                        catch (e) {
                            // Squash any errors extends errors. They won't prevent the renderer
                            // itself from working, so just log them.
                            console.error(e);
                            this.postDebugMessage('Activating dependant renderer failed', { dependent: d.id, error: e + '' });
                            return undefined;
                        }
                    }));
                    return this._api;
                }
                catch (e) {
                    this.postDebugMessage('Loading renderer failed');
                    throw e;
                }
            }
            postDebugMessage(msg, data) {
                postNotebookMessage('logRendererDebugMessage', {
                    message: `[renderer ${this.data.id}] - ${msg}`,
                    data
                });
            }
        }
        const kernelPreloads = new class {
            constructor() {
                this.preloads = new Map();
            }
            /**
             * Returns a promise that resolves when the given preload is activated.
             */
            waitFor(uri) {
                return this.preloads.get(uri) || Promise.resolve(new Error(`Preload not ready: ${uri}`));
            }
            /**
             * Loads a preload.
             * @param uri URI to load from
             * @param originalUri URI to show in an error message if the preload is invalid.
             */
            load(uri) {
                const promise = Promise.all([
                    runKernelPreload(uri),
                    this.waitForAllCurrent(),
                ]);
                this.preloads.set(uri, promise);
                return promise;
            }
            /**
             * Returns a promise that waits for all currently-registered preloads to
             * activate before resolving.
             */
            waitForAllCurrent() {
                return Promise.all([...this.preloads.values()].map(p => p.catch(err => err)));
            }
        };
        const outputRunner = new class {
            constructor() {
                this.outputs = new Map();
                this.pendingOutputCreationRequest = new Map();
            }
            /**
             * Pushes the action onto the list of actions for the given output ID,
             * ensuring that it's run in-order.
             */
            enqueue(outputId, action) {
                this.pendingOutputCreationRequest.get(outputId)?.dispose();
                this.pendingOutputCreationRequest.delete(outputId);
                const record = this.outputs.get(outputId);
                if (!record) {
                    const controller = new AbortController();
                    this.outputs.set(outputId, { abort: controller, queue: new Promise(r => r(action(controller.signal))) });
                }
                else {
                    record.queue = record.queue.then(async (r) => {
                        if (!record.abort.signal.aborted) {
                            await action(record.abort.signal);
                        }
                    });
                }
            }
            enqueueIdle(outputId, action) {
                this.pendingOutputCreationRequest.get(outputId)?.dispose();
                outputRunner.pendingOutputCreationRequest.set(outputId, runWhenIdle(() => {
                    outputRunner.enqueue(outputId, action);
                    outputRunner.pendingOutputCreationRequest.delete(outputId);
                }));
            }
            /**
             * Cancels the rendering of all outputs.
             */
            cancelAll() {
                // Delete all pending idle requests
                this.pendingOutputCreationRequest.forEach(r => r.dispose());
                this.pendingOutputCreationRequest.clear();
                for (const { abort } of this.outputs.values()) {
                    abort.abort();
                }
                this.outputs.clear();
            }
            /**
             * Cancels any ongoing rendering out an output.
             */
            cancelOutput(outputId) {
                // Delete the pending idle request if it exists
                this.pendingOutputCreationRequest.get(outputId)?.dispose();
                this.pendingOutputCreationRequest.delete(outputId);
                const output = this.outputs.get(outputId);
                if (output) {
                    output.abort.abort();
                    this.outputs.delete(outputId);
                }
            }
        };
        const renderers = new class {
            constructor() {
                this._renderers = new Map();
                for (const renderer of ctx.rendererData) {
                    this.addRenderer(renderer);
                }
            }
            getRenderer(id) {
                return this._renderers.get(id);
            }
            rendererEqual(a, b) {
                if (a.id !== b.id || a.entrypoint.path !== b.entrypoint.path || a.entrypoint.extends !== b.entrypoint.extends || a.messaging !== b.messaging) {
                    return false;
                }
                if (a.mimeTypes.length !== b.mimeTypes.length) {
                    return false;
                }
                for (let i = 0; i < a.mimeTypes.length; i++) {
                    if (a.mimeTypes[i] !== b.mimeTypes[i]) {
                        return false;
                    }
                }
                return true;
            }
            updateRendererData(rendererData) {
                const oldKeys = new Set(this._renderers.keys());
                const newKeys = new Set(rendererData.map(d => d.id));
                for (const renderer of rendererData) {
                    const existing = this._renderers.get(renderer.id);
                    if (existing && this.rendererEqual(existing.data, renderer)) {
                        continue;
                    }
                    this.addRenderer(renderer);
                }
                for (const key of oldKeys) {
                    if (!newKeys.has(key)) {
                        this._renderers.delete(key);
                    }
                }
            }
            addRenderer(renderer) {
                this._renderers.set(renderer.id, new Renderer(renderer));
            }
            clearAll() {
                outputRunner.cancelAll();
                for (const renderer of this._renderers.values()) {
                    renderer.disposeOutputItem();
                }
            }
            clearOutput(rendererId, outputId) {
                outputRunner.cancelOutput(outputId);
                this._renderers.get(rendererId)?.disposeOutputItem(outputId);
            }
            async render(item, preferredRendererId, element, signal) {
                const primaryRenderer = this.findRenderer(preferredRendererId, item);
                if (!primaryRenderer) {
                    const errorMessage = (window.document.documentElement.style.getPropertyValue('--notebook-cell-renderer-not-found-error') || '').replace('$0', () => item.mime);
                    this.showRenderError(item, element, errorMessage);
                    return;
                }
                // Try primary renderer first
                if (!(await this._doRender(item, element, primaryRenderer, signal)).continue) {
                    return;
                }
                // Primary renderer failed in an expected way. Fallback to render the next mime types
                for (const additionalItemData of item._allOutputItems) {
                    if (additionalItemData.mime === item.mime) {
                        continue;
                    }
                    const additionalItem = await additionalItemData.getItem();
                    if (signal.aborted) {
                        return;
                    }
                    if (additionalItem) {
                        const renderer = this.findRenderer(undefined, additionalItem);
                        if (renderer) {
                            if (!(await this._doRender(additionalItem, element, renderer, signal)).continue) {
                                return; // We rendered successfully
                            }
                        }
                    }
                }
                // All renderers have failed and there is nothing left to fallback to
                const errorMessage = (window.document.documentElement.style.getPropertyValue('--notebook-cell-renderer-fallbacks-exhausted') || '').replace('$0', () => item.mime);
                this.showRenderError(item, element, errorMessage);
            }
            async _doRender(item, element, renderer, signal) {
                try {
                    await renderer.renderOutputItem(item, element, signal);
                    return { continue: false }; // We rendered successfully
                }
                catch (e) {
                    if (signal.aborted) {
                        return { continue: false };
                    }
                    if (e instanceof Error && e.name === renderFallbackErrorName) {
                        return { continue: true };
                    }
                    else {
                        throw e; // Bail and let callers handle unknown errors
                    }
                }
            }
            findRenderer(preferredRendererId, info) {
                let renderer;
                if (typeof preferredRendererId === 'string') {
                    renderer = Array.from(this._renderers.values())
                        .find((renderer) => renderer.data.id === preferredRendererId);
                }
                else {
                    const renderers = Array.from(this._renderers.values())
                        .filter((renderer) => renderer.data.mimeTypes.includes(info.mime) && !renderer.data.entrypoint.extends);
                    if (renderers.length) {
                        // De-prioritize built-in renderers
                        renderers.sort((a, b) => +a.data.isBuiltin - +b.data.isBuiltin);
                        // Use first renderer we find in sorted list
                        renderer = renderers[0];
                    }
                }
                return renderer;
            }
            showRenderError(info, element, errorMessage) {
                const errorContainer = document.createElement('div');
                const error = document.createElement('div');
                error.className = 'no-renderer-error';
                error.innerText = errorMessage;
                const cellText = document.createElement('div');
                cellText.innerText = info.text();
                errorContainer.appendChild(error);
                errorContainer.appendChild(cellText);
                element.innerText = '';
                element.appendChild(errorContainer);
            }
        }();
        const viewModel = new class ViewModel {
            constructor() {
                this._markupCells = new Map();
                this._outputCells = new Map();
            }
            clearAll() {
                for (const cell of this._markupCells.values()) {
                    cell.dispose();
                }
                this._markupCells.clear();
                for (const output of this._outputCells.values()) {
                    output.dispose();
                }
                this._outputCells.clear();
            }
            async createMarkupCell(init, top, visible) {
                const existing = this._markupCells.get(init.cellId);
                if (existing) {
                    console.error(`Trying to create markup that already exists: ${init.cellId}`);
                    return existing;
                }
                const cell = new MarkupCell(init.cellId, init.mime, init.content, top, init.metadata);
                cell.element.style.visibility = visible ? '' : 'hidden';
                this._markupCells.set(init.cellId, cell);
                await cell.ready;
                return cell;
            }
            async ensureMarkupCell(info) {
                let cell = this._markupCells.get(info.cellId);
                if (cell) {
                    cell.element.style.visibility = info.visible ? '' : 'hidden';
                    await cell.updateContentAndRender(info.content, info.metadata);
                }
                else {
                    cell = await this.createMarkupCell(info, info.offset, info.visible);
                }
            }
            deleteMarkupCell(id) {
                const cell = this.getExpectedMarkupCell(id);
                if (cell) {
                    cell.remove();
                    cell.dispose();
                    this._markupCells.delete(id);
                }
            }
            async updateMarkupContent(id, newContent, metadata) {
                const cell = this.getExpectedMarkupCell(id);
                await cell?.updateContentAndRender(newContent, metadata);
            }
            showMarkupCell(id, top, newContent, metadata) {
                const cell = this.getExpectedMarkupCell(id);
                cell?.show(top, newContent, metadata);
            }
            hideMarkupCell(id) {
                const cell = this.getExpectedMarkupCell(id);
                cell?.hide();
            }
            unhideMarkupCell(id) {
                const cell = this.getExpectedMarkupCell(id);
                cell?.unhide();
            }
            getExpectedMarkupCell(id) {
                const cell = this._markupCells.get(id);
                if (!cell) {
                    console.log(`Could not find markup cell '${id}'`);
                    return undefined;
                }
                return cell;
            }
            updateSelectedCells(selectedCellIds) {
                const selectedCellSet = new Set(selectedCellIds);
                for (const cell of this._markupCells.values()) {
                    cell.setSelected(selectedCellSet.has(cell.id));
                }
            }
            toggleDragDropEnabled(dragAndDropEnabled) {
                for (const cell of this._markupCells.values()) {
                    cell.toggleDragDropEnabled(dragAndDropEnabled);
                }
            }
            updateMarkupScrolls(markupCells) {
                for (const { id, top } of markupCells) {
                    const cell = this._markupCells.get(id);
                    if (cell) {
                        cell.element.style.top = `${top}px`;
                    }
                }
            }
            async renderOutputCell(data, signal) {
                const preloadErrors = await Promise.all(data.requiredPreloads.map(p => kernelPreloads.waitFor(p.uri).then(() => undefined, err => err)));
                if (signal.aborted) {
                    return;
                }
                const cellOutput = this.ensureOutputCell(data.cellId, data.cellTop, false);
                return cellOutput.renderOutputElement(data, preloadErrors, signal);
            }
            ensureOutputCell(cellId, cellTop, skipCellTopUpdateIfExist) {
                let cell = this._outputCells.get(cellId);
                const existed = !!cell;
                if (!cell) {
                    cell = new OutputCell(cellId);
                    this._outputCells.set(cellId, cell);
                }
                if (existed && skipCellTopUpdateIfExist) {
                    return cell;
                }
                cell.element.style.top = cellTop + 'px';
                return cell;
            }
            clearOutput(cellId, outputId, rendererId) {
                const cell = this._outputCells.get(cellId);
                cell?.clearOutput(outputId, rendererId);
            }
            showOutput(cellId, outputId, top) {
                const cell = this._outputCells.get(cellId);
                cell?.show(outputId, top);
            }
            updateAndRerender(cellId, outputId, content) {
                const cell = this._outputCells.get(cellId);
                cell?.updateContentAndRerender(outputId, content);
            }
            hideOutput(cellId) {
                const cell = this._outputCells.get(cellId);
                cell?.hide();
            }
            updateOutputHeight(cellId, outputId, height) {
                const cell = this._outputCells.get(cellId);
                cell?.updateOutputHeight(outputId, height);
            }
            updateOutputsScroll(updates) {
                for (const request of updates) {
                    const cell = this._outputCells.get(request.cellId);
                    cell?.updateScroll(request);
                }
            }
        }();
        class MarkdownCodeBlock {
            static { this.pendingCodeBlocksToHighlight = new Map(); }
            static highlightCodeBlock(id, html) {
                const el = MarkdownCodeBlock.pendingCodeBlocksToHighlight.get(id);
                if (!el) {
                    return;
                }
                const trustedHtml = ttPolicy?.createHTML(html) ?? html;
                el.innerHTML = trustedHtml; // CodeQL [SM03712] The rendered content comes from VS Code's tokenizer and is considered safe
                const root = el.getRootNode();
                if (root instanceof ShadowRoot) {
                    if (!root.adoptedStyleSheets.includes(tokenizationStyle)) {
                        root.adoptedStyleSheets.push(tokenizationStyle);
                    }
                }
            }
            static requestHighlightCodeBlock(root) {
                const codeBlocks = [];
                let i = 0;
                for (const el of root.querySelectorAll('.vscode-code-block')) {
                    const lang = el.getAttribute('data-vscode-code-block-lang');
                    if (el.textContent && lang) {
                        const id = `${Date.now()}-${i++}`;
                        codeBlocks.push({ value: el.textContent, lang: lang, id });
                        MarkdownCodeBlock.pendingCodeBlocksToHighlight.set(id, el);
                    }
                }
                return codeBlocks;
            }
        }
        class MarkupCell {
            constructor(id, mime, content, top, metadata) {
                this._isDisposed = false;
                const self = this;
                this.id = id;
                this._content = { value: content, version: 0, metadata: metadata };
                const { promise, resolve, reject } = promiseWithResolvers();
                this.ready = promise;
                let cachedData;
                this.outputItem = Object.freeze({
                    id,
                    mime,
                    get metadata() {
                        return self._content.metadata;
                    },
                    text: () => {
                        return this._content.value;
                    },
                    json: () => {
                        return undefined;
                    },
                    data: () => {
                        if (cachedData?.version === this._content.version) {
                            return cachedData.value;
                        }
                        const data = textEncoder.encode(this._content.value);
                        cachedData = { version: this._content.version, value: data };
                        return data;
                    },
                    blob() {
                        return new Blob([this.data()], { type: this.mime });
                    },
                    _allOutputItems: [{
                            mime,
                            getItem: async () => this.outputItem,
                        }]
                });
                const root = window.document.getElementById('container');
                const markupCell = document.createElement('div');
                markupCell.className = 'markup';
                markupCell.style.position = 'absolute';
                markupCell.style.width = '100%';
                this.element = document.createElement('div');
                this.element.id = this.id;
                this.element.classList.add('preview');
                this.element.style.position = 'absolute';
                this.element.style.top = top + 'px';
                this.toggleDragDropEnabled(currentOptions.dragAndDropEnabled);
                markupCell.appendChild(this.element);
                root.appendChild(markupCell);
                this.addEventListeners();
                this.updateContentAndRender(this._content.value, this._content.metadata).then(() => {
                    if (!this._isDisposed) {
                        resizeObserver.observe(this.element, this.id, false, this.id);
                    }
                    resolve();
                }, () => reject());
            }
            dispose() {
                this._isDisposed = true;
                this.renderTaskAbort?.abort();
                this.renderTaskAbort = undefined;
            }
            addEventListeners() {
                this.element.addEventListener('dblclick', () => {
                    postNotebookMessage('toggleMarkupPreview', { cellId: this.id });
                });
                this.element.addEventListener('click', e => {
                    postNotebookMessage('clickMarkupCell', {
                        cellId: this.id,
                        altKey: e.altKey,
                        ctrlKey: e.ctrlKey,
                        metaKey: e.metaKey,
                        shiftKey: e.shiftKey,
                    });
                });
                this.element.addEventListener('contextmenu', e => {
                    postNotebookMessage('contextMenuMarkupCell', {
                        cellId: this.id,
                        clientX: e.clientX,
                        clientY: e.clientY,
                    });
                });
                this.element.addEventListener('mouseenter', () => {
                    postNotebookMessage('mouseEnterMarkupCell', { cellId: this.id });
                });
                this.element.addEventListener('mouseleave', () => {
                    postNotebookMessage('mouseLeaveMarkupCell', { cellId: this.id });
                });
                this.element.addEventListener('dragstart', e => {
                    markupCellDragManager.startDrag(e, this.id);
                });
                this.element.addEventListener('drag', e => {
                    markupCellDragManager.updateDrag(e, this.id);
                });
                this.element.addEventListener('dragend', e => {
                    markupCellDragManager.endDrag(e, this.id);
                });
            }
            async updateContentAndRender(newContent, metadata) {
                this._content = { value: newContent, version: this._content.version + 1, metadata };
                this.renderTaskAbort?.abort();
                const controller = new AbortController();
                this.renderTaskAbort = controller;
                try {
                    await renderers.render(this.outputItem, undefined, this.element, this.renderTaskAbort.signal);
                }
                finally {
                    if (this.renderTaskAbort === controller) {
                        this.renderTaskAbort = undefined;
                    }
                }
                const root = (this.element.shadowRoot ?? this.element);
                const html = [];
                for (const child of root.children) {
                    switch (child.tagName) {
                        case 'LINK':
                        case 'SCRIPT':
                        case 'STYLE':
                            // not worth sending over since it will be stripped before rendering
                            break;
                        default:
                            html.push(child.outerHTML);
                            break;
                    }
                }
                const codeBlocks = MarkdownCodeBlock.requestHighlightCodeBlock(root);
                postNotebookMessage('renderedMarkup', {
                    cellId: this.id,
                    html: html.join(''),
                    codeBlocks
                });
                dimensionUpdater.updateHeight(this.id, this.element.offsetHeight, {
                    isOutput: false
                });
            }
            show(top, newContent, metadata) {
                this.element.style.visibility = '';
                this.element.style.top = `${top}px`;
                if (typeof newContent === 'string' || metadata) {
                    this.updateContentAndRender(newContent ?? this._content.value, metadata ?? this._content.metadata);
                }
                else {
                    this.updateMarkupDimensions();
                }
            }
            hide() {
                this.element.style.visibility = 'hidden';
            }
            unhide() {
                this.element.style.visibility = '';
                this.updateMarkupDimensions();
            }
            remove() {
                this.element.remove();
            }
            async updateMarkupDimensions() {
                dimensionUpdater.updateHeight(this.id, this.element.offsetHeight, {
                    isOutput: false
                });
            }
            setSelected(selected) {
                this.element.classList.toggle('selected', selected);
            }
            toggleDragDropEnabled(enabled) {
                if (enabled) {
                    this.element.classList.add('draggable');
                    this.element.setAttribute('draggable', 'true');
                }
                else {
                    this.element.classList.remove('draggable');
                    this.element.removeAttribute('draggable');
                }
            }
        }
        class OutputCell {
            constructor(cellId) {
                this.outputElements = new Map();
                const container = window.document.getElementById('container');
                const upperWrapperElement = createFocusSink(cellId);
                container.appendChild(upperWrapperElement);
                this.element = document.createElement('div');
                this.element.style.position = 'absolute';
                this.element.style.outline = '0';
                this.element.id = cellId;
                this.element.classList.add('cell_container');
                container.appendChild(this.element);
                this.element = this.element;
                const lowerWrapperElement = createFocusSink(cellId, true);
                container.appendChild(lowerWrapperElement);
            }
            dispose() {
                for (const output of this.outputElements.values()) {
                    output.dispose();
                }
                this.outputElements.clear();
            }
            createOutputElement(data) {
                let outputContainer = this.outputElements.get(data.outputId);
                if (!outputContainer) {
                    outputContainer = new OutputContainer(data.outputId);
                    this.element.appendChild(outputContainer.element);
                    this.outputElements.set(data.outputId, outputContainer);
                }
                return outputContainer.createOutputElement(data.outputId, data.outputOffset, data.left, data.cellId);
            }
            async renderOutputElement(data, preloadErrors, signal) {
                const startTime = Date.now();
                const outputElement /** outputNode */ = this.createOutputElement(data);
                await outputElement.render(data.content, data.rendererId, preloadErrors, signal);
                // don't hide until after this step so that the height is right
                outputElement /** outputNode */.element.style.visibility = data.initiallyHidden ? 'hidden' : '';
                if (!!data.executionId && !!data.rendererId) {
                    let outputSize = undefined;
                    let mimeType = undefined;
                    if (data.content.type === 1 /* extension */) {
                        outputSize = data.content.output.valueBytes.length;
                        mimeType = data.content.output.mime;
                    }
                    postNotebookMessage('notebookPerformanceMessage', {
                        cellId: data.cellId,
                        executionId: data.executionId,
                        duration: Date.now() - startTime,
                        rendererId: data.rendererId,
                        outputSize,
                        mimeType
                    });
                }
            }
            clearOutput(outputId, rendererId) {
                const output = this.outputElements.get(outputId);
                output?.clear(rendererId);
                output?.dispose();
                this.outputElements.delete(outputId);
            }
            show(outputId, top) {
                const outputContainer = this.outputElements.get(outputId);
                if (!outputContainer) {
                    return;
                }
                this.element.style.visibility = '';
                this.element.style.top = `${top}px`;
                dimensionUpdater.updateHeight(outputId, outputContainer.element.offsetHeight, {
                    isOutput: true,
                });
            }
            hide() {
                this.element.style.visibility = 'hidden';
            }
            updateContentAndRerender(outputId, content) {
                this.outputElements.get(outputId)?.updateContentAndRender(content);
            }
            updateOutputHeight(outputId, height) {
                this.outputElements.get(outputId)?.updateHeight(height);
            }
            updateScroll(request) {
                this.element.style.top = `${request.cellTop}px`;
                const outputElement = this.outputElements.get(request.outputId);
                if (outputElement) {
                    outputElement.updateScroll(request.outputOffset);
                    if (request.forceDisplay && outputElement.outputNode) {
                        // TODO @rebornix @mjbvz, there is a misalignment here.
                        // We set output visibility on cell container, other than output container or output node itself.
                        outputElement.outputNode.element.style.visibility = '';
                    }
                }
                if (request.forceDisplay) {
                    this.element.style.visibility = '';
                }
            }
        }
        class OutputContainer {
            get outputNode() {
                return this._outputNode;
            }
            constructor(outputId) {
                this.outputId = outputId;
                this.element = document.createElement('div');
                this.element.classList.add('output_container');
                this.element.setAttribute('data-vscode-context', JSON.stringify({ 'preventDefaultContextMenuItems': true }));
                this.element.style.position = 'absolute';
                this.element.style.overflow = 'hidden';
            }
            dispose() {
                this._outputNode?.dispose();
            }
            clear(rendererId) {
                if (rendererId) {
                    renderers.clearOutput(rendererId, this.outputId);
                }
                this.element.remove();
            }
            updateHeight(height) {
                this.element.style.maxHeight = `${height}px`;
                this.element.style.height = `${height}px`;
            }
            updateScroll(outputOffset) {
                this.element.style.top = `${outputOffset}px`;
            }
            createOutputElement(outputId, outputOffset, left, cellId) {
                this.element.innerText = '';
                this.element.style.maxHeight = '0px';
                this.element.style.top = `${outputOffset}px`;
                this._outputNode?.dispose();
                this._outputNode = new OutputElement(outputId, left, cellId);
                this.element.appendChild(this._outputNode.element);
                return this._outputNode;
            }
            updateContentAndRender(content) {
                this._outputNode?.updateAndRerender(content);
            }
        }
        vscode.postMessage({
            __vscode_notebook_message: true,
            type: 'initialized'
        });
        for (const preload of ctx.staticPreloadsData) {
            kernelPreloads.load(preload.entrypoint);
        }
        function postNotebookMessage(type, properties) {
            vscode.postMessage({
                __vscode_notebook_message: true,
                type,
                ...properties
            });
        }
        class OutputElement {
            constructor(outputId, left, cellId) {
                this.outputId = outputId;
                this.cellId = cellId;
                this.hasResizeObserver = false;
                this.element = document.createElement('div');
                this.element.id = outputId;
                this.element.classList.add('output');
                this.element.style.position = 'absolute';
                this.element.style.top = `0px`;
                this.element.style.left = left + 'px';
                this.element.style.padding = `${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodeLeftPadding}`;
                this.element.addEventListener('mouseenter', () => {
                    postNotebookMessage('mouseenter', { id: outputId });
                });
                this.element.addEventListener('mouseleave', () => {
                    postNotebookMessage('mouseleave', { id: outputId });
                });
            }
            dispose() {
                this.renderTaskAbort?.abort();
                this.renderTaskAbort = undefined;
            }
            async render(content, preferredRendererId, preloadErrors, signal) {
                this.renderTaskAbort?.abort();
                this.renderTaskAbort = undefined;
                this._content = { preferredRendererId, preloadErrors };
                if (content.type === 0 /* RenderOutputType.Html */) {
                    const trustedHtml = ttPolicy?.createHTML(content.htmlContent) ?? content.htmlContent;
                    this.element.innerHTML = trustedHtml; // CodeQL [SM03712] The content comes from renderer extensions, not from direct user input.
                }
                else if (preloadErrors.some(e => e instanceof Error)) {
                    const errors = preloadErrors.filter((e) => e instanceof Error);
                    showRenderError(`Error loading preloads`, this.element, errors);
                }
                else {
                    const item = createOutputItem(this.outputId, content.output.mime, content.metadata, content.output.valueBytes, content.allOutputs, content.output.appended);
                    const controller = new AbortController();
                    this.renderTaskAbort = controller;
                    // Abort rendering if caller aborts
                    signal?.addEventListener('abort', () => controller.abort());
                    try {
                        await renderers.render(item, preferredRendererId, this.element, controller.signal);
                    }
                    finally {
                        if (this.renderTaskAbort === controller) {
                            this.renderTaskAbort = undefined;
                        }
                    }
                }
                if (!this.hasResizeObserver) {
                    this.hasResizeObserver = true;
                    resizeObserver.observe(this.element, this.outputId, true, this.cellId);
                }
                const offsetHeight = this.element.offsetHeight;
                const cps = document.defaultView.getComputedStyle(this.element);
                if (offsetHeight !== 0 && cps.padding === '0px') {
                    // we set padding to zero if the output height is zero (then we can have a zero-height output DOM node)
                    // thus we need to ensure the padding is accounted when updating the init height of the output
                    dimensionUpdater.updateHeight(this.outputId, offsetHeight + ctx.style.outputNodePadding * 2, {
                        isOutput: true,
                        init: true,
                    });
                    this.element.style.padding = `${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodeLeftPadding}`;
                }
                else {
                    dimensionUpdater.updateHeight(this.outputId, this.element.offsetHeight, {
                        isOutput: true,
                        init: true,
                    });
                }
                const root = this.element.shadowRoot ?? this.element;
                const codeBlocks = MarkdownCodeBlock.requestHighlightCodeBlock(root);
                if (codeBlocks.length > 0) {
                    postNotebookMessage('renderedCellOutput', {
                        codeBlocks
                    });
                }
            }
            updateAndRerender(content) {
                if (this._content) {
                    this.render(content, this._content.preferredRendererId, this._content.preloadErrors);
                }
            }
        }
        const markupCellDragManager = new class MarkupCellDragManager {
            constructor() {
                window.document.addEventListener('dragover', e => {
                    // Allow dropping dragged markup cells
                    e.preventDefault();
                });
                window.document.addEventListener('drop', e => {
                    e.preventDefault();
                    const drag = this.currentDrag;
                    if (!drag) {
                        return;
                    }
                    this.currentDrag = undefined;
                    postNotebookMessage('cell-drop', {
                        cellId: drag.cellId,
                        ctrlKey: e.ctrlKey,
                        altKey: e.altKey,
                        dragOffsetY: e.clientY,
                    });
                });
            }
            startDrag(e, cellId) {
                if (!e.dataTransfer) {
                    return;
                }
                if (!currentOptions.dragAndDropEnabled) {
                    return;
                }
                this.currentDrag = { cellId, clientY: e.clientY };
                const overlayZIndex = 9999;
                if (!this.dragOverlay) {
                    this.dragOverlay = document.createElement('div');
                    this.dragOverlay.style.position = 'absolute';
                    this.dragOverlay.style.top = '0';
                    this.dragOverlay.style.left = '0';
                    this.dragOverlay.style.zIndex = `${overlayZIndex}`;
                    this.dragOverlay.style.width = '100%';
                    this.dragOverlay.style.height = '100%';
                    this.dragOverlay.style.background = 'transparent';
                    window.document.body.appendChild(this.dragOverlay);
                }
                e.target.style.zIndex = `${overlayZIndex + 1}`;
                e.target.classList.add('dragging');
                postNotebookMessage('cell-drag-start', {
                    cellId: cellId,
                    dragOffsetY: e.clientY,
                });
                // Continuously send updates while dragging instead of relying on `updateDrag`.
                // This lets us scroll the list based on drag position.
                const trySendDragUpdate = () => {
                    if (this.currentDrag?.cellId !== cellId) {
                        return;
                    }
                    postNotebookMessage('cell-drag', {
                        cellId: cellId,
                        dragOffsetY: this.currentDrag.clientY,
                    });
                    window.requestAnimationFrame(trySendDragUpdate);
                };
                window.requestAnimationFrame(trySendDragUpdate);
            }
            updateDrag(e, cellId) {
                if (cellId !== this.currentDrag?.cellId) {
                    this.currentDrag = undefined;
                }
                else {
                    this.currentDrag = { cellId, clientY: e.clientY };
                }
            }
            endDrag(e, cellId) {
                this.currentDrag = undefined;
                e.target.classList.remove('dragging');
                postNotebookMessage('cell-drag-end', {
                    cellId: cellId
                });
                if (this.dragOverlay) {
                    window.document.body.removeChild(this.dragOverlay);
                    this.dragOverlay = undefined;
                }
                e.target.style.zIndex = '';
            }
        }();
    }
    function preloadsScriptStr(styleValues, options, renderOptions, renderers, preloads, isWorkspaceTrusted, nonce) {
        const ctx = {
            style: styleValues,
            options,
            renderOptions,
            rendererData: renderers,
            staticPreloadsData: preloads,
            isWorkspaceTrusted,
            nonce,
        };
        // TS will try compiling `import()` in webviewPreloads, so use a helper function instead
        // of using `import(...)` directly
        return `
		const __import = (x) => import(x);
		(${webviewPreloads})(
			JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(ctx))}"))
		)\n//# sourceURL=notebookWebviewPreloads.js\n`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1ByZWxvYWRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L3JlbmRlcmVycy93ZWJ2aWV3UHJlbG9hZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtZ0doRyw4Q0FpQkM7SUE3N0ZELEtBQUssVUFBVSxlQUFlLENBQUMsR0FBbUI7UUFFakQsMENBQTBDO1FBRTFDLGtFQUFrRTtRQUNsRSxpRUFBaUU7UUFDakUsa0RBQWtEO1FBRWxELE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7UUFDdEMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7UUFDdEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUV0QyxTQUFTLG9CQUFvQjtZQUM1QixJQUFJLE9BQTRDLENBQUM7WUFDakQsSUFBSSxNQUE4QixDQUFDO1lBQ25DLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUMzQyxPQUFPLEdBQUcsR0FBRyxDQUFDO2dCQUNkLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQVEsRUFBRSxNQUFNLEVBQUUsTUFBTyxFQUFFLENBQUM7UUFDeEQsQ0FBQztRQUVELElBQUksY0FBYyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7UUFDakMsTUFBTSxrQkFBa0IsR0FBRyxHQUFHLENBQUMsa0JB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