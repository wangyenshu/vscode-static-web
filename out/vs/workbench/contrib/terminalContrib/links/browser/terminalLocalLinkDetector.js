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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing", "vs/platform/terminal/common/terminal"], function (require, exports, platform_1, uri_1, uriIdentity_1, workspace_1, terminalLinkHelpers_1, terminalLinkParsing_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLocalLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
        /**
         * The maximum number of links in a line to resolve against the file system. This limit is put
         * in place to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinksInLine"] = 10] = "MaxResolvedLinksInLine";
        /**
         * The maximum length of a link to resolve against the file system. This limit is put in place
         * to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinkLength"] = 1024] = "MaxResolvedLinkLength";
    })(Constants || (Constants = {}));
    const fallbackMatchers = [
        // Python style error: File "<path>", line <line>
        /^ *File (?<link>"(?<path>.+)"(, line (?<line>\d+))?)/,
        // Unknown tool #200166: FILE  <path>:<line>:<col>
        /^ +FILE +(?<link>(?<path>.+)(?::(?<line>\d+)(?::(?<col>\d+))?)?)/,
        // Some C++ compile error formats:
        // C:\foo\bar baz(339) : error ...
        // C:\foo\bar baz(339,12) : error ...
        // C:\foo\bar baz(339, 12) : error ...
        // C:\foo\bar baz(339): error ...       [#178584, Visual Studio CL/NVIDIA CUDA compiler]
        // C:\foo\bar baz(339,12): ...
        // C:\foo\bar baz(339, 12): ...
        /^(?<link>(?<path>.+)\((?<line>\d+)(?:, ?(?<col>\d+))?\)) ?:/,
        // C:\foo/bar baz:339 : error ...
        // C:\foo/bar baz:339:12 : error ...
        // C:\foo/bar baz:339: error ...
        // C:\foo/bar baz:339:12: error ...     [#178584, Clang]
        /^(?<link>(?<path>.+):(?<line>\d+)(?::(?<col>\d+))?) ?:/,
        // Cmd prompt
        /^(?<link>(?<path>.+))>/,
        // The whole line is the path
        /^ *(?<link>(?<path>.+))/
    ];
    let TerminalLocalLinkDetector = class TerminalLocalLinkDetector {
        static { this.id = 'local'; }
        constructor(xterm, _capabilities, _processManager, _linkResolver, _logService, _uriIdentityService, _workspaceContextService) {
            this.xterm = xterm;
            this._capabilities = _capabilities;
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
            let stringIndex = -1;
            let resolvedLinkCount = 0;
            const os = this._processManager.os || platform_1.OS;
            const parsedLinks = (0, terminalLinkParsing_1.detectLinks)(text, os);
            this._logService.trace('terminalLocalLinkDetector#detect text', text);
            this._logService.trace('terminalLocalLinkDetector#detect parsedLinks', parsedLinks);
            for (const parsedLink of parsedLinks) {
                // Don't try resolve any links of excessive length
                if (parsedLink.path.text.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                    continue;
                }
                // Convert the link text's string index into a wrapped buffer range
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                    startColumn: (parsedLink.prefix?.index ?? parsedLink.path.index) + 1,
                    startLineNumber: 1,
                    endColumn: parsedLink.path.index + parsedLink.path.text.length + (parsedLink.suffix?.suffix.text.length ?? 0) + 1,
                    endLineNumber: 1
                }, startLine);
                // Get a single link candidate if the cwd of the line is known
                const linkCandidates = [];
                const osPath = (0, terminalLinkHelpers_1.osPathModule)(os);
                const isUri = parsedLink.path.text.startsWith('file://');
                if (osPath.isAbsolute(parsedLink.path.text) || parsedLink.path.text.startsWith('~') || isUri) {
                    linkCandidates.push(parsedLink.path.text);
                }
                else {
                    if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                        const absolutePath = (0, terminalLinkHelpers_1.updateLinkWithRelativeCwd)(this._capabilities, bufferRange.start.y, parsedLink.path.text, osPath, this._logService);
                        // Only add a single exact link candidate if the cwd is available, this may cause
                        // the link to not be resolved but that should only occur when the actual file does
                        // not exist. Doing otherwise could cause unexpected results where handling via the
                        // word link detector is preferable.
                        if (absolutePath) {
                            linkCandidates.push(...absolutePath);
                        }
                    }
                    // Fallback to resolving against the initial cwd, removing any relative directory prefixes
                    if (linkCandidates.length === 0) {
                        linkCandidates.push(parsedLink.path.text);
                        if (parsedLink.path.text.match(/^(\.\.[\/\\])+/)) {
                            linkCandidates.push(parsedLink.path.text.replace(/^(\.\.[\/\\])+/, ''));
                        }
                    }
                }
                // If any candidates end with special characters that are likely to not be part of the
                // link, add a candidate excluding them.
                const specialEndCharRegex = /[\[\]"'\.]$/;
                const trimRangeMap = new Map();
                const specialEndLinkCandidates = [];
                for (const candidate of linkCandidates) {
                    let previous = candidate;
                    let removed = previous.replace(specialEndCharRegex, '');
                    let trimRange = 0;
                    while (removed !== previous) {
                        // Only trim the link if there is no suffix, otherwise the underline would be incorrect
                        if (!parsedLink.suffix) {
                            trimRange++;
                        }
                        specialEndLinkCandidates.push(removed);
                        trimRangeMap.set(removed, trimRange);
                        previous = removed;
                        removed = removed.replace(specialEndCharRegex, '');
                    }
                }
                linkCandidates.push(...specialEndLinkCandidates);
                this._logService.trace('terminalLocalLinkDetector#detect linkCandidates', linkCandidates);
                // Validate the path and convert to the outgoing type
                const simpleLink = await this._validateAndGetLink(undefined, bufferRange, linkCandidates, trimRangeMap);
                if (simpleLink) {
                    simpleLink.parsedLink = parsedLink;
                    simpleLink.text = text.substring(parsedLink.prefix?.index ?? parsedLink.path.index, parsedLink.suffix ? parsedLink.suffix.suffix.index + parsedLink.suffix.suffix.text.length : parsedLink.path.index + parsedLink.path.text.length);
                    this._logService.trace('terminalLocalLinkDetector#detect verified link', simpleLink);
                    links.push(simpleLink);
                }
                // Stop early if too many links exist in the line
                if (++resolvedLinkCount >= 10 /* Constants.MaxResolvedLinksInLine */) {
                    break;
                }
            }
            // Match against the fallback matchers which are mainly designed to catch paths with spaces
            // that aren't possible using the regular mechanism.
            if (links.length === 0) {
                for (const matcher of fallbackMatchers) {
                    const match = text.match(matcher);
                    const group = match?.groups;
                    if (!group) {
                        continue;
                    }
                    const link = group?.link;
                    const path = group?.path;
                    const line = group?.line;
                    const col = group?.col;
                    if (!link || !path) {
                        continue;
                    }
                    // Don't try resolve any links of excessive length
                    if (link.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                        continue;
                    }
                    // Convert the link text's string index into a wrapped buffer range
                    stringIndex = text.indexOf(link);
                    const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                        startColumn: stringIndex + 1,
                        startLineNumber: 1,
                        endColumn: stringIndex + link.length + 1,
                        endLineNumber: 1
                    }, startLine);
                    // Validate and add link
                    const suffix = line ? `:${line}${col ? `:${col}` : ''}` : '';
                    const simpleLink = await this._validateAndGetLink(`${path}${suffix}`, bufferRange, [path]);
                    if (simpleLink) {
                        links.push(simpleLink);
                    }
                    // Only match a single fallback matcher
                    break;
                }
            }
            // Sometimes links are styled specially in the terminal like underlined or bolded, try split
            // the line by attributes and test whether it matches a path
            if (links.length === 0) {
                const rangeCandidates = (0, terminalLinkHelpers_1.getXtermRangesByAttr)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
                for (const rangeCandidate of rangeCandidates) {
                    let text = '';
                    for (let y = rangeCandidate.start.y; y <= rangeCandidate.end.y; y++) {
                        const line = this.xterm.buffer.active.getLine(y);
                        if (!line) {
                            break;
                        }
                        const lineStartX = y === rangeCandidate.start.y ? rangeCandidate.start.x : 0;
                        const lineEndX = y === rangeCandidate.end.y ? rangeCandidate.end.x : this.xterm.cols - 1;
                        text += line.translateToString(false, lineStartX, lineEndX);
                    }
                    // HACK: Adjust to 1-based for link API
                    rangeCandidate.start.x++;
                    rangeCandidate.start.y++;
                    rangeCandidate.end.y++;
                    // Validate and add link
                    const simpleLink = await this._validateAndGetLink(text, rangeCandidate, [text]);
                    if (simpleLink) {
                        links.push(simpleLink);
                    }
                    // Stop early if too many links exist in the line
                    if (++resolvedLinkCount >= 10 /* Constants.MaxResolvedLinksInLine */) {
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
        async _validateLinkCandidates(linkCandidates) {
            for (const link of linkCandidates) {
                let uri;
                if (link.startsWith('file://')) {
                    uri = uri_1.URI.parse(link);
                }
                const result = await this._linkResolver.resolveLink(this._processManager, link, uri);
                if (result) {
                    return result;
                }
            }
            return undefined;
        }
        /**
         * Validates a set of link candidates and returns a link if validated.
         * @param linkText The link text, this should be undefined to use the link stat value
         * @param trimRangeMap A map of link candidates to the amount of buffer range they need trimmed.
         */
        async _validateAndGetLink(linkText, bufferRange, linkCandidates, trimRangeMap) {
            const linkStat = await this._validateLinkCandidates(linkCandidates);
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
                // Offset the buffer range if the link range was trimmed
                const trimRange = trimRangeMap?.get(linkStat.link);
                if (trimRange) {
                    bufferRange.end.x -= trimRange;
                    if (bufferRange.end.x < 0) {
                        bufferRange.end.y--;
                        bufferRange.end.x += this.xterm.cols;
                    }
                }
                return {
                    text: linkText ?? linkStat.link,
                    uri: linkStat.uri,
                    bufferRange: bufferRange,
                    type
                };
            }
            return undefined;
        }
    };
    exports.TerminalLocalLinkDetector = TerminalLocalLinkDetector;
    exports.TerminalLocalLinkDetector = TerminalLocalLinkDetector = __decorate([
        __param(4, terminal_1.ITerminalLogService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, workspace_1.IWorkspaceContextService)
    ], TerminalLocalLinkDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMb2NhbExpbmtEZXRlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9saW5rcy9icm93c2VyL3Rlcm1pbmFsTG9jYWxMaW5rRGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLElBQVcsU0FpQlY7SUFqQkQsV0FBVyxTQUFTO1FBQ25COztXQUVHO1FBQ0gsOERBQW9CLENBQUE7UUFFcEI7OztXQUdHO1FBQ0gsOEVBQTJCLENBQUE7UUFFM0I7OztXQUdHO1FBQ0gsOEVBQTRCLENBQUE7SUFDN0IsQ0FBQyxFQWpCVSxTQUFTLEtBQVQsU0FBUyxRQWlCbkI7SUFFRCxNQUFNLGdCQUFnQixHQUFhO1FBQ2xDLGlEQUFpRDtRQUNqRCxzREFBc0Q7UUFDdEQsa0RBQWtEO1FBQ2xELGtFQUFrRTtRQUNsRSxrQ0FBa0M7UUFDbEMsa0NBQWtDO1FBQ2xDLHFDQUFxQztRQUNyQyxzQ0FBc0M7UUFDdEMsd0ZBQXdGO1FBQ3hGLDhCQUE4QjtRQUM5QiwrQkFBK0I7UUFDL0IsNkRBQTZEO1FBQzdELGlDQUFpQztRQUNqQyxvQ0FBb0M7UUFDcEMsZ0NBQWdDO1FBQ2hDLHdEQUF3RDtRQUN4RCx3REFBd0Q7UUFDeEQsYUFBYTtRQUNiLHdCQUF3QjtRQUN4Qiw2QkFBNkI7UUFDN0IseUJBQXlCO0tBQ3pCLENBQUM7SUFFSyxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUF5QjtpQkFDOUIsT0FBRSxHQUFHLE9BQU8sQUFBVixDQUFXO1FBUXBCLFlBQ1UsS0FBZSxFQUNQLGFBQXVDLEVBQ3ZDLGVBQXlKLEVBQ3pKLGFBQW9DLEVBQ2hDLFdBQWlELEVBQ2pELG1CQUF5RCxFQUNwRCx3QkFBbUU7WUFOcEYsVUFB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