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
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/languages/linkComputer", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/platform/terminal/common/terminal"], function (require, exports, network_1, uri_1, linkComputer_1, uriIdentity_1, workspace_1, terminalLinkHelpers_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalUriLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The maximum number of links in a line to resolve against the file system. This limit is put
         * in place to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinksInLine"] = 10] = "MaxResolvedLinksInLine";
    })(Constants || (Constants = {}));
    let TerminalUriLinkDetector = class TerminalUriLinkDetector {
        static { this.id = 'uri'; }
        constructor(xterm, _processManager, _linkResolver, _logService, _uriIdentityService, _workspaceContextService) {
            this.xterm = xterm;
            this._processManager = _processManager;
            this._linkResolver = _linkResolver;
            this._logService = _logService;
            this._uriIdentityService = _uriIdentityService;
            this._workspaceContextService = _workspaceContextService;
            // 2048 is the maximum URL length
            this.maxLinkLength = 2048;
        }
        async detect(lines, startLine, endLine) {
            const links = [];
            const linkComputerTarget = new TerminalLinkAdapter(this.xterm, startLine, endLine);
            const computedLinks = linkComputer_1.LinkComputer.computeLinks(linkComputerTarget);
            let resolvedLinkCount = 0;
            this._logService.trace('terminalUriLinkDetector#detect computedLinks', computedLinks);
            for (const computedLink of computedLinks) {
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, computedLink.range, startLine);
                // Check if the link is within the mouse position
                const uri = computedLink.url
                    ? (typeof computedLink.url === 'string' ? uri_1.URI.parse(this._excludeLineAndColSuffix(computedLink.url)) : computedLink.url)
                    : undefined;
                if (!uri) {
                    continue;
                }
                const text = computedLink.url?.toString() || '';
                // Don't try resolve any links of excessive length
                if (text.length > this.maxLinkLength) {
                    continue;
                }
                // Handle non-file scheme links
                if (uri.scheme !== network_1.Schemas.file) {
                    links.push({
                        text,
                        uri,
                        bufferRange,
                        type: "Url" /* TerminalBuiltinLinkType.Url */
                    });
                    continue;
                }
                // Filter out URI with unrecognized authorities
                if (uri.authority.length !== 2 && uri.authority.endsWith(':')) {
                    continue;
                }
                // As a fallback URI, treat the authority as local to the workspace. This is required
                // for `ls --hyperlink` support for example which includes the hostname in the URI like
                // `file://Some-Hostname/mnt/c/foo/bar`.
                const uriCandidates = [uri];
                if (uri.authority.length > 0) {
                    uriCandidates.push(uri_1.URI.from({ ...uri, authority: undefined }));
                }
                // Iterate over all candidates, pushing the candidate on the first that's verified
                this._logService.trace('terminalUriLinkDetector#detect uriCandidates', uriCandidates);
                for (const uriCandidate of uriCandidates) {
                    const linkStat = await this._linkResolver.resolveLink(this._processManager, text, uriCandidate);
                    // Create the link if validated
                    if (linkStat) {
                        let type;
                        if (linkStat.isDirectory) {
                            if (this._isDirectoryInsideWorkspace(uriCandidate)) {
                                type = "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */;
                            }
                            else {
                                type = "LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */;
                            }
                        }
                        else {
                            type = "LocalFile" /* TerminalBuiltinLinkType.LocalFile */;
                        }
                        const simpleLink = {
                            // Use computedLink.url if it's a string to retain the line/col suffix
                            text: typeof computedLink.url === 'string' ? computedLink.url : linkStat.link,
                            uri: uriCandidate,
                            bufferRange,
                            type
                        };
                        this._logService.trace('terminalUriLinkDetector#detect verified link', simpleLink);
                        links.push(simpleLink);
                        resolvedLinkCount++;
                        break;
                    }
                }
                // Stop early if too many links exist in the line
                if (++resolvedLinkCount >= 10 /* Constants.MaxResolvedLinksInLine */) {
                    break;
                }
            }
            return links;
        }
        _isDirectoryInsideWorkspace(uri) {
            const folders = this._workspaceContextService.getWorkspace().folders;
            for (let i = 0; i < folders.length; i++) {
                if (this._uriIdentityService.extUri.isEqualOrParent(uri, folders[i].uri)) {
                    return true;
                }
            }
            return false;
        }
        _excludeLineAndColSuffix(path) {
            return path.replace(/:\d+(:\d+)?$/, '');
        }
    };
    exports.TerminalUriLinkDetector = TerminalUriLinkDetector;
    exports.TerminalUriLinkDetector = TerminalUriLinkDetector = __decorate([
        __param(3, terminal_1.ITerminalLogService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], TerminalUriLinkDetector);
    class TerminalLinkAdapter {
        constructor(_xterm, _lineStart, _lineEnd) {
            this._xterm = _xterm;
            this._lineStart = _lineStart;
            this._lineEnd = _lineEnd;
        }
        getLineCount() {
            return 1;
        }
        getLineContent() {
            return (0, terminalLinkHelpers_1.getXtermLineContent)(this._xterm.buffer.active, this._lineStart, this._lineEnd, this._xterm.cols);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxVcmlMaW5rRGV0ZWN0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbFVyaUxpbmtEZXRlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhaEcsSUFBVyxTQU1WO0lBTkQsV0FBVyxTQUFTO1FBQ25COzs7V0FHRztRQUNILDhFQUEyQixDQUFBO0lBQzVCLENBQUMsRUFOVSxTQUFTLEtBQVQsU0FBUyxRQU1uQjtJQUVNLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO2lCQUM1QixPQUFFLEdBQUcsS0FBSyxBQUFSLENBQVM7UUFLbEIsWUFDVSxLQUFlLEVBQ1AsZUFBeUosRUFDekosYUFBb0MsRUFDaEMsV0FBaUQsRUFDakQsbUJBQXlELEVBQ3BELHdCQUFtRTtZQUxwRixVQUFLLEdBQUwsS0FBSyxDQUFVO1lBQ1Asb0JBQWUsR0FBZixlQUFlLENBQTBJO1lBQ3pKLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQUNmLGdCQUFXLEdBQVgsV0FBVyxDQUFxQjtZQUNoQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ25DLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFUOUYsaUNBQWlDO1lBQ3hCLGtCQUFhLEdBQUcsSUFBSSxDQUFDO1FBVTlCLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQW9CLEVBQUUsU0FBaUIsRUFBRSxPQUFlO1lBQ3BFLE1BQU0sS0FBSyxHQUEwQixFQUFFLENBQUM7WUFFeEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFD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