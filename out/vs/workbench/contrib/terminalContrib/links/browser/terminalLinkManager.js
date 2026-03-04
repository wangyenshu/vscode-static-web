/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/tunnel/common/tunnel", "vs/workbench/contrib/terminalContrib/links/browser/terminalExternalLinkDetector", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkDetectorAdapter", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkOpeners", "vs/workbench/contrib/terminalContrib/links/browser/terminalLocalLinkDetector", "vs/workbench/contrib/terminalContrib/links/browser/terminalUriLinkDetector", "vs/workbench/contrib/terminalContrib/links/browser/terminalWordLinkDetector", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/widgets/terminalHoverWidget", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/base/common/async", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminalContrib/links/browser/terminalMultiLineLinkDetector", "vs/platform/notification/common/notification"], function (require, exports, dom_1, htmlContent_1, lifecycle_1, platform_1, uri_1, nls, configuration_1, instantiation_1, tunnel_1, terminalExternalLinkDetector_1, terminalLinkDetectorAdapter_1, terminalLinkOpeners_1, terminalLocalLinkDetector_1, terminalUriLinkDetector_1, terminalWordLinkDetector_1, terminal_1, terminalHoverWidget_1, terminal_2, terminalLinkHelpers_1, async_1, terminal_3, terminalMultiLineLinkDetector_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkManager = void 0;
    /**
     * An object responsible for managing registration of link matchers and link providers.
     */
    let TerminalLinkManager = class TerminalLinkManager extends lifecycle_1.DisposableStore {
        constructor(_xterm, _processInfo, capabilities, _linkResolver, _configurationService, _terminalConfigurationService, _instantiationService, _notificationService, _logService, _tunnelService) {
            super();
            this._xterm = _xterm;
            this._processInfo = _processInfo;
            this._linkResolver = _linkResolver;
            this._configurationService = _configurationService;
            this._terminalConfigurationService = _terminalConfigurationService;
            this._instantiationService = _instantiationService;
            this._notificationService = _notificationService;
            this._logService = _logService;
            this._tunnelService = _tunnelService;
            this._standardLinkProviders = new Map();
            this._linkProvidersDisposables = [];
            this._externalLinkProviders = [];
            this._openers = new Map();
            let enableFileLinks = true;
            const enableFileLinksConfig = this._configurationService.getValue(terminal_2.TERMINAL_CONFIG_SECTION).enableFileLinks;
            switch (enableFileLinksConfig) {
                case 'off':
                case false: // legacy from v1.75
                    enableFileLinks = false;
                    break;
                case 'notRemote':
                    enableFileLinks = !this._processInfo.remoteAuthority;
                    break;
            }
            // Setup link detectors in their order of priority
            if (enableFileLinks) {
                this._setupLinkDetector(terminalMultiLineLinkDetector_1.TerminalMultiLineLinkDetector.id, this._instantiationService.createInstance(terminalMultiLineLinkDetector_1.TerminalMultiLineLinkDetector, this._xterm, this._processInfo, this._linkResolver));
                this._setupLinkDetector(terminalLocalLinkDetector_1.TerminalLocalLinkDetector.id, this._instantiationService.createInstance(terminalLocalLinkDetector_1.TerminalLocalLinkDetector, this._xterm, capabilities, this._processInfo, this._linkResolver));
            }
            this._setupLinkDetector(terminalUriLinkDetector_1.TerminalUriLinkDetector.id, this._instantiationService.createInstance(terminalUriLinkDetector_1.TerminalUriLinkDetector, this._xterm, this._processInfo, this._linkResolver));
            this._setupLinkDetector(terminalWordLinkDetector_1.TerminalWordLinkDetector.id, this.add(this._instantiationService.createInstance(terminalWordLinkDetector_1.TerminalWordLinkDetector, this._xterm)));
            // Setup link openers
            const localFileOpener = this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
            const localFolderInWorkspaceOpener = this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
            this._openers.set("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, localFileOpener);
            this._openers.set("LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */, localFolderInWorkspaceOpener);
            this._openers.set("LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */, this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderOutsideWorkspaceLinkOpener));
            this._openers.set("Search" /* TerminalBuiltinLinkType.Search */, this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalSearchLinkOpener, capabilities, this._processInfo.initialCwd, localFileOpener, localFolderInWorkspaceOpener, () => this._processInfo.os || platform_1.OS));
            this._openers.set("Url" /* TerminalBuiltinLinkType.Url */, this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalUrlLinkOpener, !!this._processInfo.remoteAuthority));
            this._registerStandardLinkProviders();
            let activeHoverDisposable;
            let activeTooltipScheduler;
            this.add((0, lifecycle_1.toDisposable)(() => {
                this._clearLinkProviders();
                (0, lifecycle_1.dispose)(this._externalLinkProviders);
                activeHoverDisposable?.dispose();
                activeTooltipScheduler?.dispose();
            }));
            this._xterm.options.linkHandler = {
                allowNonHttpProtocols: true,
                activate: (event, text) => {
                    if (!this._isLinkActivationModifierDown(event)) {
                        return;
                    }
                    const colonIndex = text.indexOf(':');
                    if (colonIndex === -1) {
                        throw new Error(`Could not find scheme in link "${text}"`);
                    }
                    const scheme = text.substring(0, colonIndex);
                    if (this._terminalConfigurationService.config.allowedLinkSchemes.indexOf(scheme) === -1) {
                        this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('scheme', 'Opening URIs can be insecure, do you want to allow opening links with the scheme {0}?', scheme), [
                            {
                                label: nls.localize('allow', 'Allow {0}', scheme),
                                run: () => {
                                    const allowedLinkSchemes = [
                                        ...this._terminalConfigurationService.config.allowedLinkSchemes,
                                        scheme
                                    ];
                                    this._configurationService.updateValue(`terminal.integrated.allowedLinkSchemes`, allowedLinkSchemes);
                                }
                            }
                        ]);
                    }
                    this._openers.get("Url" /* TerminalBuiltinLinkType.Url */)?.open({
                        type: "Url" /* TerminalBuiltinLinkType.Url */,
                        text,
                        bufferRange: null,
                        uri: uri_1.URI.parse(text)
                    });
                },
                hover: (e, text, range) => {
                    activeHoverDisposable?.dispose();
                    activeHoverDisposable = undefined;
                    activeTooltipScheduler?.dispose();
                    activeTooltipScheduler = new async_1.RunOnceScheduler(() => {
                        const core = this._xterm._core;
                        const cellDimensions = {
                            width: core._renderService.dimensions.css.cell.width,
                            height: core._renderService.dimensions.css.cell.height
                        };
                        const terminalDimensions = {
                            width: this._xterm.cols,
                            height: this._xterm.rows
                        };
                        activeHoverDisposable = this._showHover({
                            viewportRange: (0, terminalLinkHelpers_1.convertBufferRangeToViewport)(range, this._xterm.buffer.active.viewportY),
                            cellDimensions,
                            terminalDimensions
                        }, this._getLinkHoverString(text, text), undefined, (text) => this._xterm.options.linkHandler?.activate(e, text, range));
                        // Clear out scheduler until next hover event
                        activeTooltipScheduler?.dispose();
                        activeTooltipScheduler = undefined;
                    }, this._configurationService.getValue('workbench.hover.delay'));
                    activeTooltipScheduler.schedule();
                }
            };
        }
        _setupLinkDetector(id, detector, isExternal = false) {
            const detectorAdapter = this.add(this._instantiationService.createInstance(terminalLinkDetectorAdapter_1.TerminalLinkDetectorAdapter, detector));
            this.add(detectorAdapter.onDidActivateLink(e => {
                // Prevent default electron link handling so Alt+Click mode works normally
                e.event?.preventDefault();
                // Require correct modifier on click unless event is coming from linkQuickPick selection
                if (e.event && !(e.event instanceof terminal_1.TerminalLinkQuickPickEvent) && !this._isLinkActivationModifierDown(e.event)) {
                    return;
                }
                // Just call the handler if there is no before listener
                if (e.link.activate) {
                    // Custom activate call (external links only)
                    e.link.activate(e.link.text);
                }
                else {
                    this._openLink(e.link);
                }
            }));
            this.add(detectorAdapter.onDidShowHover(e => this._tooltipCallback(e.link, e.viewportRange, e.modifierDownCallback, e.modifierUpCallback)));
            if (!isExternal) {
                this._standardLinkProviders.set(id, detectorAdapter);
            }
            return detectorAdapter;
        }
        async _openLink(link) {
            this._logService.debug('Opening link', link);
            const opener = this._openers.get(link.type);
            if (!opener) {
                throw new Error(`No matching opener for link type "${link.type}"`);
            }
            await opener.open(link);
        }
        async openRecentLink(type) {
            let links;
            let i = this._xterm.buffer.active.length;
            while ((!links || links.length === 0) && i >= this._xterm.buffer.active.viewportY) {
                links = await this._getLinksForType(i, type);
                i--;
            }
            if (!links || links.length < 1) {
                return undefined;
            }
            const event = new terminal_1.TerminalLinkQuickPickEvent(dom_1.EventType.CLICK);
            links[0].activate(event, links[0].text);
            return links[0];
        }
        async getLinks() {
            // Fetch and await the viewport results
            const viewportLinksByLinePromises = [];
            for (let i = this._xterm.buffer.active.viewportY + this._xterm.rows - 1; i >= this._xterm.buffer.active.viewportY; i--) {
                viewportLinksByLinePromises.push(this._getLinksForLine(i));
            }
            const viewportLinksByLine = await Promise.all(viewportLinksByLinePromises);
            // Assemble viewport links
            const viewportLinks = {
                wordLinks: [],
                webLinks: [],
                fileLinks: [],
                folderLinks: [],
            };
            for (const links of viewportLinksByLine) {
                if (links) {
                    const { wordLinks, webLinks, fileLinks, folderLinks } = links;
                    if (wordLinks?.length) {
                        viewportLinks.wordLinks.push(...wordLinks.reverse());
                    }
                    if (webLinks?.length) {
                        viewportLinks.webLinks.push(...webLinks.reverse());
                    }
                    if (fileLinks?.length) {
                        viewportLinks.fileLinks.push(...fileLinks.reverse());
                    }
                    if (folderLinks?.length) {
                        viewportLinks.folderLinks.push(...folderLinks.reverse());
                    }
                }
            }
            // Fetch the remaining results async
            const aboveViewportLinksPromises = [];
            for (let i = this._xterm.buffer.active.viewportY - 1; i >= 0; i--) {
                aboveViewportLinksPromises.push(this._getLinksForLine(i));
            }
            const belowViewportLinksPromises = [];
            for (let i = this._xterm.buffer.active.length - 1; i >= this._xterm.buffer.active.viewportY + this._xterm.rows; i--) {
                belowViewportLinksPromises.push(this._getLinksForLine(i));
            }
            // Assemble all links in results
            const allLinks = Promise.all(aboveViewportLinksPromises).then(async (aboveViewportLinks) => {
                const belowViewportLinks = await Promise.all(belowViewportLinksPromises);
                const allResults = {
                    wordLinks: [...viewportLinks.wordLinks],
                    webLinks: [...viewportLinks.webLinks],
                    fileLinks: [...viewportLinks.fileLinks],
                    folderLinks: [...viewportLinks.folderLinks]
                };
                for (const links of [...belowViewportLinks, ...aboveViewportLinks]) {
                    if (links) {
                        const { wordLinks, webLinks, fileLinks, folderLinks } = links;
                        if (wordLinks?.length) {
                            allResults.wordLinks.push(...wordLinks.reverse());
                        }
                        if (webLinks?.length) {
                            allResults.webLinks.push(...webLinks.reverse());
                        }
                        if (fileLinks?.length) {
                            allResults.fileLinks.push(...fileLinks.reverse());
                        }
                        if (folderLinks?.length) {
                            allResults.folderLinks.push(...folderLinks.reverse());
                        }
                    }
                }
                return allResults;
            });
            return {
                viewport: viewportLinks,
                all: allLinks
            };
        }
        async _getLinksForLine(y) {
            const unfilteredWordLinks = await this._getLinksForType(y, 'word');
            const webLinks = await this._getLinksForType(y, 'url');
            const fileLinks = await this._getLinksForType(y, 'localFile');
            const folderLinks = await this._getLinksForType(y, 'localFolder');
            const words = new Set();
            let wordLinks;
            if (unfilteredWordLinks) {
                wordLinks = [];
                for (const link of unfilteredWordLinks) {
                    if (!words.has(link.text) && link.text.length > 1) {
                        wordLinks.push(link);
                        words.add(link.text);
                    }
                }
            }
            return { wordLinks, webLinks, fileLinks, folderLinks };
        }
        async _getLinksForType(y, type) {
            switch (type) {
                case 'word':
                    return (await new Promise(r => this._standardLinkProviders.get(terminalWordLinkDetector_1.TerminalWordLinkDetector.id)?.provideLinks(y, r)));
                case 'url':
                    return (await new Promise(r => this._standardLinkProviders.get(terminalUriLinkDetector_1.TerminalUriLinkDetector.id)?.provideLinks(y, r)));
                case 'localFile': {
                    const links = (await new Promise(r => this._standardLinkProviders.get(terminalLocalLinkDetector_1.TerminalLocalLinkDetector.id)?.provideLinks(y, r)));
                    return links?.filter(link => link.type === "LocalFile" /* TerminalBuiltinLinkType.LocalFile */);
                }
                case 'localFolder': {
                    const links = (await new Promise(r => this._standardLinkProviders.get(terminalLocalLinkDetector_1.TerminalLocalLinkDetector.id)?.provideLinks(y, r)));
                    return links?.filter(link => link.type === "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */);
                }
            }
        }
        _tooltipCallback(link, viewportRange, modifierDownCallback, modifierUpCallback) {
            if (!this._widgetManager) {
                return;
            }
            const core = this._xterm._core;
            const cellDimensions = {
                width: core._renderService.dimensions.css.cell.width,
                height: core._renderService.dimensions.css.cell.height
            };
            const terminalDimensions = {
                width: this._xterm.cols,
                height: this._xterm.rows
            };
            // Don't pass the mouse event as this avoids the modifier check
            this._showHover({
                viewportRange,
                cellDimensions,
                terminalDimensions,
                modifierDownCallback,
                modifierUpCallback
            }, this._getLinkHoverString(link.text, link.label), link.actions, (text) => link.activate(undefined, text), link);
        }
        _showHover(targetOptions, text, actions, linkHandler, link) {
            if (this._widgetManager) {
                const widget = this._instantiationService.createInstance(terminalHoverWidget_1.TerminalHover, targetOptions, text, actions, linkHandler);
                const attached = this._widgetManager.attachWidget(widget);
                if (attached) {
                    link?.onInvalidated(() => attached.dispose());
                }
                return attached;
            }
            return undefined;
        }
        setWidgetManager(widgetManager) {
            this._widgetManager = widgetManager;
        }
        _clearLinkProviders() {
            (0, lifecycle_1.dispose)(this._linkProvidersDisposables);
            this._linkProvidersDisposables.length = 0;
        }
        _registerStandardLinkProviders() {
            // Forward any external link provider requests to the registered provider if it exists. This
            // helps maintain the relative priority of the link providers as it's defined by the order
            // in which they're registered in xterm.js.
            //
            /**
             * There's a bit going on here but here's another view:
             * - {@link externalProvideLinksCb} The external callback that gives the links (eg. from
             *   exthost)
             * - {@link proxyLinkProvider} A proxy that forwards the call over to
             *   {@link externalProvideLinksCb}
             * - {@link wrappedLinkProvider} Wraps the above in an `TerminalLinkDetectorAdapter`
             */
            const proxyLinkProvider = async (bufferLineNumber) => {
                return this.externalProvideLinksCb?.(bufferLineNumber);
            };
            const detectorId = `extension-${this._externalLinkProviders.length}`;
            const wrappedLinkProvider = this._setupLinkDetector(detectorId, new terminalExternalLinkDetector_1.TerminalExternalLinkDetector(detectorId, this._xterm, proxyLinkProvider), true);
            this._linkProvidersDisposables.push(this._xterm.registerLinkProvider(wrappedLinkProvider));
            for (const p of this._standardLinkProviders.values()) {
                this._linkProvidersDisposables.push(this._xterm.registerLinkProvider(p));
            }
        }
        _isLinkActivationModifierDown(event) {
            const editorConf = this._configurationService.getValue('editor');
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                return !!event.altKey;
            }
            return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
        }
        _getLinkHoverString(uri, label) {
            const editorConf = this._configurationService.getValue('editor');
            let clickLabel = '';
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                if (platform_1.isMacintosh) {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkAlt.mac', "option + click");
                }
                else {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkAlt', "alt + click");
                }
            }
            else {
                if (platform_1.isMacintosh) {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkCmd', "cmd + click");
                }
                else {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkCtrl', "ctrl + click");
                }
            }
            let fallbackLabel = nls.localize('followLink', "Follow link");
            try {
                if (this._tunnelService.canTunnel(uri_1.URI.parse(uri))) {
                    fallbackLabel = nls.localize('followForwardedLink', "Follow link using forwarded port");
                }
            }
            catch {
                // No-op, already set to fallback
            }
            const markdown = new htmlContent_1.MarkdownString('', true);
            // Escapes markdown in label & uri
            if (label) {
                label = markdown.appendText(label).value;
                markdown.value = '';
            }
            if (uri) {
                uri = markdown.appendText(uri).value;
                markdown.value = '';
            }
            label = label || fallbackLabel;
            // Use the label when uri is '' so the link displays correctly
            uri = uri || label;
            // Although if there is a space in the uri, just replace it completely
            if (/(\s|&nbsp;)/.test(uri)) {
                uri = nls.localize('followLinkUrl', 'Link');
            }
            return markdown.appendLink(uri, label).appendMarkdown(` (${clickLabel})`);
        }
    };
    exports.TerminalLinkManager = TerminalLinkManager;
    exports.TerminalLinkManager = TerminalLinkManager = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, terminal_1.ITerminalConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, notification_1.INotificationService),
        __param(8, terminal_3.ITerminalLogService),
        __param(9, tunnel_1.ITunnelService)
    ], TerminalLinkManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9saW5rcy9icm93c2VyL3Rlcm1pbmFsTGlua01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUNoRzs7T0FFRztJQUNJLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsMkJBQWU7UUFTdkQsWUFDa0IsTUFBZ0IsRUFDaEIsWUFBa0MsRUFDbkQsWUFBc0MsRUFDckIsYUFBb0MsRUFDOUIscUJBQTZELEVBQ3JELDZCQUE2RSxFQUNyRixxQkFBNkQsRUFDOUQsb0JBQTJELEVBQzVELFdBQWlELEVBQ3RELGNBQStDO1lBRS9ELEtBQUssRUFBRSxDQUFDO1lBWFMsV0FBTSxHQUFOLE1BQU0sQ0FBVTtZQUNoQixpQkFBWSxHQUFaLFlBQVksQ0FBc0I7WUFFbEMsa0JBQWEsR0FBYixhQUFhLENBQXVCO1lBQ2IsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNwQyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQStCO1lBQ3BFLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDN0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUMzQyxnQkFBVyxHQUFYLFdBQVcsQ0FBcUI7WUFDckMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBakIvQywyQkFBc0IsR0FBK0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMvRCw4QkFBeUIsR0FBa0IsRUFBRSxDQUFDO1lBQzlDLDJCQUFzQixHQUFrQixFQUFFLENBQUM7WUFDM0MsYUFBUSxHQUErQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBa0JqRixJQUFJLGVBQWUsR0FBWSxJQUFJLENBQUM7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