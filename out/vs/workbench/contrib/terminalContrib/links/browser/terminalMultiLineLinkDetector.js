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
define(["require", "exports", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/platform/terminal/common/terminal"], function (require, exports, uriIdentity_1, workspace_1, terminalLinkHelpers_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalMultiLineLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
        /**
         * The maximum length of a link to resolve against the file system. This limit is put in place
         * to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinkLength"] = 1024] = "MaxResolvedLinkLength";
    })(Constants || (Constants = {}));
    const lineNumberPrefixMatchers = [
        // Ripgrep:
        //   /some/file
        //   16:searchresult
        //   16:    searchresult
        // Eslint:
        //   /some/file
        //     16:5  error ...
        /^ *(?<link>(?<line>\d+):(?<col>\d+)?)/
    ];
    const gitDiffMatchers = [
        // --- a/some/file
        // +++ b/some/file
        // @@ -8,11 +8,11 @@ file content...
        /^(?<link>@@ .+ \+(?<toFileLine>\d+),(?<toFileCount>\d+) @@)/
    ];
    let TerminalMultiLineLinkDetector = class TerminalMultiLineLinkDetector {
        static { this.id = 'multiline'; }
        constructor(xterm, _processManager, _linkResolver, _logService, _uriIdentityService, _workspaceContextService) {
            this.xterm = xterm;
            this._processManager = _processManager;
            this._linkResolver = _linkResolver;
            this._logService = _logService;
            this._uriIdentityService = _uriIdentityService;
            this._workspaceContextService = _workspaceContextService;
            // This was chosen as a reasonable maximum line length given the tradeoff between performance
            // and how likely it is to encounter such a large line length. Some useful reference points:
            // - Window old max length: 260 ($MAX_PATH)
            // - Linux max length: 4096 ($PATH_MAX)
            this.maxLinkLength = 500;
        }
        async detect(lines, startLine, endLine) {
            const links = [];
            // Get the text representation of the wrapped line
            const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
            if (text === '' || text.length > 2000 /* Constants.MaxLineLength */) {
                return [];
            }
            this._logService.trace('terminalMultiLineLinkDetector#detect text', text);
            // Match against the fallback matchers which are mainly designed to catch paths with spaces
            // that aren't possible using the regular mechanism.
            for (const matcher of lineNumberPrefixMatchers) {
                const match = text.match(matcher);
                const group = match?.groups;
                if (!group) {
                    continue;
                }
                const link = group?.link;
                const line = group?.line;
                const col = group?.col;
                if (!link || line === undefined) {
                    continue;
                }
                // Don't try resolve any links of excessive length
                if (link.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                    continue;
                }
                this._logService.trace('terminalMultiLineLinkDetector#detect candidate', link);
                // Scan up looking for the first line that could be a path
                let possiblePath;
                for (let index = startLine - 1; index >= 0; index--) {
                    // Ignore lines that aren't at the beginning of a wrapped line
                    if (this.xterm.buffer.active.getLine(index).isWrapped) {
                        continue;
                    }
                    const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, index, index, this.xterm.cols);
                    if (!text.match(/^\s*\d/)) {
                        possiblePath = text;
                        break;
                    }
                }
                if (!possiblePath) {
                    continue;
                }
                // Check if the first non-matching line is an absolute or relative link
                const linkStat = await this._linkResolver.resolveLink(this._processManager, possiblePath);
                if (linkStat) {
                    let type;
                    if (linkStat.isDirectory) {
                        if (this._isDirectoryInsideWorkspace(linkStat.uri)) {
                            type = "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */;
                        }
                        else {
                            type = "LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */;
                        }
                    }
                    else {
                        type = "LocalFile" /* TerminalBuiltinLinkType.LocalFile */;
                    }
                    // Convert the entire line's text string index into a wrapped buffer range
                    const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                        startColumn: 1,
                        startLineNumber: 1,
                        endColumn: 1 + text.length,
                        endLineNumber: 1
                    }, startLine);
                    const simpleLink = {
                        text: link,
                        uri: linkStat.uri,
                        selection: {
                            startLineNumber: parseInt(line),
                            startColumn: col ? parseInt(col) : 1
                        },
                        disableTrimColon: true,
                        bufferRange: bufferRange,
                        type
                    };
                    this._logService.trace('terminalMultiLineLinkDetector#detect verified link', simpleLink);
                    links.push(simpleLink);
                    // Break on the first match
                    break;
                }
            }
            if (links.length === 0) {
                for (const matcher of gitDiffMatchers) {
                    const match = text.match(matcher);
                    const group = match?.groups;
                    if (!group) {
                        continue;
                    }
                    const link = group?.link;
                    const toFileLine = group?.toFileLine;
                    const toFileCount = group?.toFileCount;
                    if (!link || toFileLine === undefined) {
                        continue;
                    }
                    // Don't try resolve any links of excessive length
                    if (link.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                        continue;
                    }
                    this._logService.trace('terminalMultiLineLinkDetector#detect candidate', link);
                    // Scan up looking for the first line that could be a path
                    let possiblePath;
                    for (let index = startLine - 1; index >= 0; index--) {
                        // Ignore lines that aren't at the beginning of a wrapped line
                        if (this.xterm.buffer.active.getLine(index).isWrapped) {
                            continue;
                        }
                        const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, index, index, this.xterm.cols);
                        const match = text.match(/\+\+\+ b\/(?<path>.+)/);
                        if (match) {
                            possiblePath = match.groups?.path;
                            break;
                        }
                    }
                    if (!possiblePath) {
                        continue;
                    }
                    // Check if the first non-matching line is an absolute or relative link
                    const linkStat = await this._linkResolver.resolveLink(this._processManager, possiblePath);
                    if (linkStat) {
                        let type;
                        if (linkStat.isDirectory) {
                            if (this._isDirectoryInsideWorkspace(linkStat.uri)) {
                                type = "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */;
                            }
                            else {
                                type = "LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */;
                            }
                        }
                        else {
                            type = "LocalFile" /* TerminalBuiltinLinkType.LocalFile */;
                        }
                        // Convert the link to the buffer range
                        const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                            startColumn: 1,
                            startLineNumber: 1,
                            endColumn: 1 + link.length,
                            endLineNumber: 1
                        }, startLine);
                        const simpleLink = {
                            text: link,
                            uri: linkStat.uri,
                            selection: {
                                startLineNumber: parseInt(toFileLine),
                                startColumn: 1,
                                endLineNumber: parseInt(toFileLine) + parseInt(toFileCount)
                            },
                            bufferRange: bufferRange,
                            type
                        };
                        this._logService.trace('terminalMultiLineLinkDetector#detect verified link', simpleLink);
                        links.push(simpleLink);
                        // Break on the first match
                        break;
                    }
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
    };
    exports.TerminalMultiLineLinkDetector = TerminalMultiLineLinkDetector;
    exports.TerminalMultiLineLinkDetector = TerminalMultiLineLinkDetector = __decorate([
        __param(3, terminal_1.ITerminalLogService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], TerminalMultiLineLinkDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxNdWx0aUxpbmVMaW5rRGV0ZWN0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbE11bHRpTGluZUxpbmtEZXRlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXaEcsSUFBVyxTQVdWO0lBWEQsV0FBVyxTQUFTO1FBQ25COztXQUVHO1FBQ0gsOERBQW9CLENBQUE7UUFFcEI7OztXQUdHO1FBQ0gsOEVBQTRCLENBQUE7SUFDN0IsQ0FBQyxFQVhVLFNBQVMsS0FBVCxTQUFTLFFBV25CO0lBRUQsTUFBTSx3QkFBd0IsR0FBRztRQUNoQyxXQUFXO1FBQ1gsZUFBZTtRQUNmLG9CQUFvQjtRQUNwQix3QkFBd0I7UUFDeEIsVUFBVTtRQUNWLGVBQWU7UUFDZixzQkFBc0I7UUFDdEIsdUNBQXVDO0tBQ3ZDLENBQUM7SUFFRixNQUFNLGVBQWUsR0FBRztRQUN2QixrQkFBa0I7UUFDbEIsa0JBQWtCO1FBQ2xCLG9DQUFvQztRQUNwQyw2REFBNkQ7S0FDN0QsQ0FBQztJQUVLLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQTZCO2lCQUNsQyxPQUFFLEdBQUcsV0FBVyxBQUFkLENBQWU7UUFReEIsWUFDVSxLQUFlLEVBQ1AsZUFBeUosRUFDekosYUFBb0MsRUFDaEMsV0FBaUQsRUFDakQsbUJBQXlELEVBQ3BELHdCQUFtRTtZQUxwRixVQUFLLEdBQUwsS0FBSyxDQUFVO1lBQ1Asb0JBQWUsR0FBZixlQUFlLENBQTBJO1lBQ3pKLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQUNmLGdCQUFXLEdBQVgsV0FBVyxDQUFxQjtZQUNoQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lB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