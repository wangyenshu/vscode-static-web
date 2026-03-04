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
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/host/browser/host", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/search/common/search", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing", "vs/platform/terminal/common/terminal"], function (require, exports, network_1, uri_1, commands_1, files_1, instantiation_1, opener_1, quickInput_1, workspace_1, terminalLinkHelpers_1, editorService_1, environmentService_1, host_1, queryBuilder_1, search_1, configuration_1, terminalLinkParsing_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalUrlLinkOpener = exports.TerminalSearchLinkOpener = exports.TerminalLocalFolderOutsideWorkspaceLinkOpener = exports.TerminalLocalFolderInWorkspaceLinkOpener = exports.TerminalLocalFileLinkOpener = void 0;
    let TerminalLocalFileLinkOpener = class TerminalLocalFileLinkOpener {
        constructor(_editorService) {
            this._editorService = _editorService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open file link without a resolved URI');
            }
            const linkSuffix = link.parsedLink ? link.parsedLink.suffix : (0, terminalLinkParsing_1.getLinkSuffix)(link.text);
            let selection = link.selection;
            if (!selection) {
                selection = linkSuffix?.row === undefined ? undefined : {
                    startLineNumber: linkSuffix.row ?? 1,
                    startColumn: linkSuffix.col ?? 1,
                    endLineNumber: linkSuffix.rowEnd,
                    endColumn: linkSuffix.colEnd
                };
            }
            await this._editorService.openEditor({
                resource: link.uri,
                options: { pinned: true, selection, revealIfOpened: true }
            });
        }
    };
    exports.TerminalLocalFileLinkOpener = TerminalLocalFileLinkOpener;
    exports.TerminalLocalFileLinkOpener = TerminalLocalFileLinkOpener = __decorate([
        __param(0, editorService_1.IEditorService)
    ], TerminalLocalFileLinkOpener);
    let TerminalLocalFolderInWorkspaceLinkOpener = class TerminalLocalFolderInWorkspaceLinkOpener {
        constructor(_commandService) {
            this._commandService = _commandService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open folder in workspace link without a resolved URI');
            }
            await this._commandService.executeCommand('revealInExplorer', link.uri);
        }
    };
    exports.TerminalLocalFolderInWorkspaceLinkOpener = TerminalLocalFolderInWorkspaceLinkOpener;
    exports.TerminalLocalFolderInWorkspaceLinkOpener = TerminalLocalFolderInWorkspaceLinkOpener = __decorate([
        __param(0, commands_1.ICommandService)
    ], TerminalLocalFolderInWorkspaceLinkOpener);
    let TerminalLocalFolderOutsideWorkspaceLinkOpener = class TerminalLocalFolderOutsideWorkspaceLinkOpener {
        constructor(_hostService) {
            this._hostService = _hostService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open folder in workspace link without a resolved URI');
            }
            this._hostService.openWindow([{ folderUri: link.uri }], { forceNewWindow: true });
        }
    };
    exports.TerminalLocalFolderOutsideWorkspaceLinkOpener = TerminalLocalFolderOutsideWorkspaceLinkOpener;
    exports.TerminalLocalFolderOutsideWorkspaceLinkOpener = TerminalLocalFolderOutsideWorkspaceLinkOpener = __decorate([
        __param(0, host_1.IHostService)
    ], TerminalLocalFolderOutsideWorkspaceLinkOpener);
    let TerminalSearchLinkOpener = class TerminalSearchLinkOpener {
        constructor(_capabilities, _initialCwd, _localFileOpener, _localFolderInWorkspaceOpener, _getOS, _fileService, _instantiationService, _logService, _quickInputService, _searchService, _workspaceContextService, _workbenchEnvironmentService) {
            this._capabilities = _capabilities;
            this._initialCwd = _initialCwd;
            this._localFileOpener = _localFileOpener;
            this._localFolderInWorkspaceOpener = _localFolderInWorkspaceOpener;
            this._getOS = _getOS;
            this._fileService = _fileService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._quickInputService = _quickInputService;
            this._searchService = _searchService;
            this._workspaceContextService = _workspaceContextService;
            this._workbenchEnvironmentService = _workbenchEnvironmentService;
            this._fileQueryBuilder = this._instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        }
        async open(link) {
            const osPath = (0, terminalLinkHelpers_1.osPathModule)(this._getOS());
            const pathSeparator = osPath.sep;
            // Remove file:/// and any leading ./ or ../ since quick access doesn't understand that format
            let text = link.text.replace(/^file:\/\/\/?/, '');
            text = osPath.normalize(text).replace(/^(\.+[\\/])+/, '');
            // Try extract any trailing line and column numbers by matching the text against parsed
            // links. This will give a search link `foo` on a line like `"foo", line 10` to open the
            // quick pick with `foo:10` as the contents.
            if (link.contextLine) {
                const parsedLinks = (0, terminalLinkParsing_1.detectLinks)(link.contextLine, this._getOS());
                const matchingParsedLink = parsedLinks.find(parsedLink => parsedLink.suffix && link.text === parsedLink.path.text);
                if (matchingParsedLink) {
                    if (matchingParsedLink.suffix?.row !== undefined) {
                        text += `:${matchingParsedLink.suffix.row}`;
                        if (matchingParsedLink.suffix?.col !== undefined) {
                            text += `:${matchingParsedLink.suffix.col}`;
                        }
                    }
                }
            }
            // Remove `:<one or more non number characters>` from the end of the link.
            // Examples:
            // - Ruby stack traces: <link>:in ...
            // - Grep output: <link>:<result line>
            // This only happens when the colon is _not_ followed by a forward- or back-slash as that
            // would break absolute Windows paths (eg. `C:/Users/...`).
            text = text.replace(/:[^\\/\d][^\d]*$/, '');
            // Remove any trailing periods after the line/column numbers, to prevent breaking the search feature, #200257
            // Examples:
            // "Check your code Test.tsx:12:45." -> Test.tsx:12:45
            // "Check your code Test.tsx:12." -> Test.tsx:12
            text = text.replace(/\.$/, '');
            // If any of the names of the folders in the workspace matches
            // a prefix of the link, remove that prefix and continue
            this._workspaceContextService.getWorkspace().folders.forEach((folder) => {
                if (text.substring(0, folder.name.length + 1) === folder.name + pathSeparator) {
                    text = text.substring(folder.name.length + 1);
                    return;
                }
            });
            let cwdResolvedText = text;
            if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                cwdResolvedText = (0, terminalLinkHelpers_1.updateLinkWithRelativeCwd)(this._capabilities, link.bufferRange.start.y, text, osPath, this._logService)?.[0] || text;
            }
            // Try open the cwd resolved link first
            if (await this._tryOpenExactLink(cwdResolvedText, link)) {
                return;
            }
            // If the cwd resolved text didn't match, try find the link without the cwd resolved, for
            // example when a command prints paths in a sub-directory of the current cwd
            if (text !== cwdResolvedText) {
                if (await this._tryOpenExactLink(text, link)) {
                    return;
                }
            }
            // Fallback to searching quick access
            return this._quickInputService.quickAccess.show(text);
        }
        async _getExactMatch(sanitizedLink) {
            // Make the link relative to the cwd if it isn't absolute
            const os = this._getOS();
            const pathModule = (0, terminalLinkHelpers_1.osPathModule)(os);
            const isAbsolute = pathModule.isAbsolute(sanitizedLink);
            let absolutePath = isAbsolute ? sanitizedLink : undefined;
            if (!isAbsolute && this._initialCwd.length > 0) {
                absolutePath = pathModule.join(this._initialCwd, sanitizedLink);
            }
            // Try open as an absolute link
            let resourceMatch;
            if (absolutePath) {
                let normalizedAbsolutePath = absolutePath;
                if (os === 1 /* OperatingSystem.Windows */) {
                    normalizedAbsolutePath = absolutePath.replace(/\\/g, '/');
                    if (normalizedAbsolutePath.match(/[a-z]:/i)) {
                        normalizedAbsolutePath = `/${normalizedAbsolutePath}`;
                    }
                }
                let uri;
                if (this._workbenchEnvironmentService.remoteAuthority) {
                    uri = uri_1.URI.from({
                        scheme: network_1.Schemas.vscodeRemote,
                        authority: this._workbenchEnvironmentService.remoteAuthority,
                        path: normalizedAbsolutePath
                    });
                }
                else {
                    uri = uri_1.URI.file(normalizedAbsolutePath);
                }
                try {
                    const fileStat = await this._fileService.stat(uri);
                    resourceMatch = { uri, isDirectory: fileStat.isDirectory };
                }
                catch {
                    // File or dir doesn't exist, continue on
                }
            }
            // Search the workspace if an exact match based on the absolute path was not found
            if (!resourceMatch) {
                const results = await this._searchService.fileSearch(this._fileQueryBuilder.file(this._workspaceContextService.getWorkspace().folders, {
                    filePattern: sanitizedLink,
                    maxResults: 2
                }));
                if (results.results.length > 0) {
                    if (results.results.length === 1) {
                        // If there's exactly 1 search result, return it regardless of whether it's
                        // exact or partial.
                        resourceMatch = { uri: results.results[0].resource };
                    }
                    else if (!isAbsolute) {
                        // For non-absolute links, exact link matching is allowed only if there is a single an exact
                        // file match. For example searching for `foo.txt` when there is no cwd information
                        // available (ie. only the initial cwd) should open the file directly only if there is a
                        // single file names `foo.txt` anywhere within the folder. These same rules apply to
                        // relative paths with folders such as `src/foo.txt`.
                        const results = await this._searchService.fileSearch(this._fileQueryBuilder.file(this._workspaceContextService.getWorkspace().folders, {
                            filePattern: `**/${sanitizedLink}`
                        }));
                        // Find an exact match if it exists
                        const exactMatches = results.results.filter(e => e.resource.toString().endsWith(sanitizedLink));
                        if (exactMatches.length === 1) {
                            resourceMatch = { uri: exactMatches[0].resource };
                        }
                    }
                }
            }
            return resourceMatch;
        }
        async _tryOpenExactLink(text, link) {
            const sanitizedLink = text.replace(/:\d+(:\d+)?$/, '');
            try {
                const result = await this._getExactMatch(sanitizedLink);
                if (result) {
                    const { uri, isDirectory } = result;
                    const linkToOpen = {
                        // Use the absolute URI's path here so the optional line/col get detected
                        text: result.uri.path + (text.match(/:\d+(:\d+)?$/)?.[0] || ''),
                        uri,
                        bufferRange: link.bufferRange,
                        type: link.type
                    };
                    if (uri) {
                        await (isDirectory ? this._localFolderInWorkspaceOpener.open(linkToOpen) : this._localFileOpener.open(linkToOpen));
                        return true;
                    }
                }
            }
            catch {
                return false;
            }
            return false;
        }
    };
    exports.TerminalSearchLinkOpener = TerminalSearchLinkOpener;
    exports.TerminalSearchLinkOpener = TerminalSearchLinkOpener = __decorate([
        __param(5, files_1.IFileService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, terminal_1.ITerminalLogService),
        __param(8, quickInput_1.IQuickInputService),
        __param(9, search_1.ISearchService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService)
    ], TerminalSearchLinkOpener);
    let TerminalUrlLinkOpener = class TerminalUrlLinkOpener {
        constructor(_isRemote, _openerService, _configurationService) {
            this._isRemote = _isRemote;
            this._openerService = _openerService;
            this._configurationService = _configurationService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open a url without a resolved URI');
            }
            // It's important to use the raw string value here to avoid converting pre-encoded values
            // from the URL like `%2B` -> `+`.
            this._openerService.open(link.text, {
                allowTunneling: this._isRemote && this._configurationService.getValue('remote.forwardOnOpen'),
                allowContributedOpeners: true,
                openExternal: true
            });
        }
    };
    exports.TerminalUrlLinkOpener = TerminalUrlLinkOpener;
    exports.TerminalUrlLinkOpener = TerminalUrlLinkOpener = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, configuration_1.IConfigurationService)
    ], TerminalUrlLinkOpener);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rT3BlbmVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9saW5rcy9icm93c2VyL3Rlcm1pbmFsTGlua09wZW5lcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0J6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUEyQjtRQUN2QyxZQUNrQyxjQUE4QjtZQUE5QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFFaEUsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBeUI7WUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7WUFDbkUsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFBLG1DQUFhLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZGLElBQUksU0FBUyxHQUFxQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsU0FBUyxHQUFHLFVBQVUsRUFBRSxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUN2RCxlQUFlLEVBQUUsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUNwQyxXQUFXLEVBQUUsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUNoQyxhQUFhLEVBQUUsVUFBVSxDQUFDLE1BQU07b0JBQ2hDLFNBQVMsRUFBRSxVQUFVLENB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