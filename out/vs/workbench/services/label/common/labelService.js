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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/event", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/resources", "vs/base/common/labels", "vs/platform/label/common/label", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/glob", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/workbench/services/path/common/pathService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/platform", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/network", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/base/common/arrays"], function (require, exports, nls_1, uri_1, lifecycle_1, path_1, event_1, contributions_1, platform_1, environmentService_1, workspace_1, resources_1, labels_1, label_1, extensionsRegistry_1, glob_1, lifecycle_2, extensions_1, pathService_1, extensions_2, platform_2, remoteAgentService_1, network_1, storage_1, memento_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelService = void 0;
    const resourceLabelFormattersExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'resourceLabelFormatters',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters', 'Contributes resource label formatting rules.'),
            type: 'array',
            items: {
                type: 'object',
                required: ['scheme', 'formatting'],
                properties: {
                    scheme: {
                        type: 'string',
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.scheme', 'URI scheme on which to match the formatter on. For example "file". Simple glob patterns are supported.'),
                    },
                    authority: {
                        type: 'string',
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.authority', 'URI authority on which to match the formatter on. Simple glob patterns are supported.'),
                    },
                    formatting: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.formatting', "Rules for formatting uri resource labels."),
                        type: 'object',
                        properties: {
                            label: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.label', "Label rules to display. For example: myLabel:/${path}. ${path}, ${scheme}, ${authority} and ${authoritySuffix} are supported as variables.")
                            },
                            separator: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.separator', "Separator to be used in the uri label display. '/' or '\' as an example.")
                            },
                            stripPathStartingSeparator: {
                                type: 'boolean',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.stripPathStartingSeparator', "Controls whether `${path}` substitutions should have starting separator characters stripped.")
                            },
                            tildify: {
                                type: 'boolean',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.tildify', "Controls if the start of the uri label should be tildified when possible.")
                            },
                            workspaceSuffix: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.formatting.workspaceSuffix', "Suffix appended to the workspace label.")
                            }
                        }
                    }
                }
            }
        }
    });
    const sepRegexp = /\//g;
    const labelMatchingRegexp = /\$\{(scheme|authoritySuffix|authority|path|(query)\.(.+?))\}/g;
    function hasDriveLetterIgnorePlatform(path) {
        return !!(path && path[2] === ':');
    }
    let ResourceLabelFormattersHandler = class ResourceLabelFormattersHandler {
        constructor(labelService) {
            this.formattersDisposables = new Map();
            resourceLabelFormattersExtPoint.setHandler((extensions, delta) => {
                for (const added of delta.added) {
                    for (const untrustedFormatter of added.value) {
                        // We cannot trust that the formatter as it comes from an extension
                        // adheres to our interface, so for the required properties we fill
                        // in some defaults if missing.
                        const formatter = { ...untrustedFormatter };
                        if (typeof formatter.formatting.label !== 'string') {
                            formatter.formatting.label = '${authority}${path}';
                        }
                        if (typeof formatter.formatting.separator !== `string`) {
                            formatter.formatting.separator = path_1.sep;
                        }
                        if (!(0, extensions_2.isProposedApiEnabled)(added.description, 'contribLabelFormatterWorkspaceTooltip') && formatter.formatting.workspaceTooltip) {
                            formatter.formatting.workspaceTooltip = undefined; // workspaceTooltip is only proposed
                        }
                        this.formattersDisposables.set(formatter, labelService.registerFormatter(formatter));
                    }
                }
                for (const removed of delta.removed) {
                    for (const formatter of removed.value) {
                        (0, lifecycle_1.dispose)(this.formattersDisposables.get(formatter));
                    }
                }
            });
        }
    };
    ResourceLabelFormattersHandler = __decorate([
        __param(0, label_1.ILabelService)
    ], ResourceLabelFormattersHandler);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ResourceLabelFormattersHandler, 3 /* LifecyclePhase.Restored */);
    const FORMATTER_CACHE_SIZE = 50;
    let LabelService = class LabelService extends lifecycle_1.Disposable {
        constructor(environmentService, contextService, pathService, remoteAgentService, storageService, lifecycleService) {
            super();
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.pathService = pathService;
            this.remoteAgentService = remoteAgentService;
            this._onDidChangeFormatters = this._register(new event_1.Emitter({ leakWarningThreshold: 400 }));
            this.onDidChangeFormatters = this._onDidChangeFormatters.event;
            // Find some meaningful defaults until the remote environment
            // is resolved, by taking the current OS we are running in
            // and by taking the local `userHome` if we run on a local
            // file scheme.
            this.os = platform_2.OS;
            this.userHome = pathService.defaultUriScheme === network_1.Schemas.file ? this.pathService.userHome({ preferLocal: true }) : undefined;
            const memento = this.storedFormattersMemento = new memento_1.Memento('cachedResourceLabelFormatters2', storageService);
            this.storedFormatters = memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            this.formatters = this.storedFormatters?.formatters?.slice() || [];
            // Remote environment is potentially long running
            this.resolveRemoteEnvironment();
        }
        async resolveRemoteEnvironment() {
            // OS
            const env = await this.remoteAgentService.getEnvironment();
            this.os = env?.os ?? platform_2.OS;
            // User home
            this.userHome = await this.pathService.userHome();
        }
        findFormatting(resource) {
            let bestResult;
            for (const formatter of this.formatters) {
                if (formatter.scheme === resource.scheme) {
                    if (!formatter.authority && (!bestResult || formatter.priority)) {
                        bestResult = formatter;
                        continue;
                    }
                    if (!formatter.authority) {
                        continue;
                    }
                    if ((0, glob_1.match)(formatter.authority.toLowerCase(), resource.authority.toLowerCase()) &&
                        (!bestResult ||
                            !bestResult.authority ||
                            formatter.authority.length > bestResult.authority.length ||
                            ((formatter.authority.length === bestResult.authority.length) && formatter.priority))) {
                        bestResult = formatter;
                    }
                }
            }
            return bestResult ? bestResult.formatting : undefined;
        }
        getUriLabel(resource, options = {}) {
            let formatting = this.findFormatting(resource);
            if (formatting && options.separator) {
                // mixin separator if defined from the outside
                formatting = { ...formatting, separator: options.separator };
            }
            const label = this.doGetUriLabel(resource, formatting, options);
            // Without formatting we still need to support the separator
            // as provided in options (https://github.com/microsoft/vscode/issues/130019)
            if (!formatting && options.separator) {
                return label.replace(sepRegexp, options.separator);
            }
            return label;
        }
        doGetUriLabel(resource, formatting, options = {}) {
            if (!formatting) {
                return (0, labels_1.getPathLabel)(resource, {
                    os: this.os,
                    tildify: this.userHome ? { userHome: this.userHome } : undefined,
                    relative: options.relative ? {
                        noPrefix: options.noPrefix,
                        getWorkspace: () => this.contextService.getWorkspace(),
                        getWorkspaceFolder: resource => this.contextService.getWorkspaceFolder(resource)
                    } : undefined
                });
            }
            // Relative label
            if (options.relative && this.contextService) {
                let folder = this.contextService.getWorkspaceFolder(resource);
                if (!folder) {
                    // It is possible that the resource we want to resolve the
                    // workspace folder for is not using the same scheme as
                    // the folders in the workspace, so we help by trying again
                    // to resolve a workspace folder by trying again with a
                    // scheme that is workspace contained.
                    const workspace = this.contextService.getWorkspace();
                    const firstFolder = (0, arrays_1.firstOrDefault)(workspace.folders);
                    if (firstFolder && resource.scheme !== firstFolder.uri.scheme && resource.path.startsWith(path_1.posix.sep)) {
                        folder = this.contextService.getWorkspaceFolder(firstFolder.uri.with({ path: resource.path }));
                    }
                }
                if (folder) {
                    const folderLabel = this.formatUri(folder.uri, formatting, options.noPrefix);
                    let relativeLabel = this.formatUri(resource, formatting, options.noPrefix);
                    let overlap = 0;
                    while (relativeLabel[overlap] && relativeLabel[overlap] === folderLabel[overlap]) {
                        overlap++;
                    }
                    if (!relativeLabel[overlap] || relativeLabel[overlap] === formatting.separator) {
                        relativeLabel = relativeLabel.substring(1 + overlap);
                    }
                    else if (overlap === folderLabel.length && folder.uri.path === path_1.posix.sep) {
                        relativeLabel = relativeLabel.substring(overlap);
                    }
                    // always show root basename if there are multiple folders
                    const hasMultipleRoots = this.contextService.getWorkspace().folders.length > 1;
                    if (hasMultipleRoots && !options.noPrefix) {
                        const rootName = folder?.name ?? (0, resources_1.basenameOrAuthority)(folder.uri);
                        relativeLabel = relativeLabel ? `${rootName} • ${relativeLabel}` : rootName;
                    }
                    return relativeLabel;
                }
            }
            // Absolute label
            return this.formatUri(resource, formatting, options.noPrefix);
        }
        getUriBasenameLabel(resource) {
            const formatting = this.findFormatting(resource);
            const label = this.doGetUriLabel(resource, formatting);
            let pathLib;
            if (formatting?.separator === path_1.win32.sep) {
                pathLib = path_1.win32;
            }
            else if (formatting?.separator === path_1.posix.sep) {
                pathLib = path_1.posix;
            }
            else {
                pathLib = (this.os === 1 /* OperatingSystem.Windows */) ? path_1.win32 : path_1.posix;
            }
            return pathLib.basename(label);
        }
        getWorkspaceLabel(workspace, options) {
            if ((0, workspace_1.isWorkspace)(workspace)) {
                const identifier = (0, workspace_1.toWorkspaceIdentifier)(workspace);
                if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(identifier) || (0, workspace_1.isWorkspaceIdentifier)(identifier)) {
                    return this.getWorkspaceLabel(identifier, options);
                }
                return '';
            }
            // Workspace: Single Folder (as URI)
            if (uri_1.URI.isUri(workspace)) {
                return this.doGetSingleFolderWorkspaceLabel(workspace, options);
            }
            // Workspace: Single Folder (as workspace identifier)
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                return this.doGetSingleFolderWorkspaceLabel(workspace.uri, options);
            }
            // Workspace: Multi Root
            if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                return this.doGetWorkspaceLabel(workspace.configPath, options);
            }
            return '';
        }
        doGetWorkspaceLabel(workspaceUri, options) {
            // Workspace: Untitled
            if ((0, workspace_1.isUntitledWorkspace)(workspaceUri, this.environmentService)) {
                return (0, nls_1.localize)('untitledWorkspace', "Untitled (Workspace)");
            }
            // Workspace: Temporary
            if ((0, workspace_1.isTemporaryWorkspace)(workspaceUri)) {
                return (0, nls_1.localize)('temporaryWorkspace', "Workspace");
            }
            // Workspace: Saved
            let filename = (0, resources_1.basename)(workspaceUri);
            if (filename.endsWith(workspace_1.WORKSPACE_EXTENSION)) {
                filename = filename.substr(0, filename.length - workspace_1.WORKSPACE_EXTENSION.length - 1);
            }
            let label;
            switch (options?.verbose) {
                case 0 /* Verbosity.SHORT */:
                    label = filename; // skip suffix for short label
                    break;
                case 2 /* Verbosity.LONG */:
                    label = (0, nls_1.localize)('workspaceNameVerbose', "{0} (Workspace)", this.getUriLabel((0, resources_1.joinPath)((0, resources_1.dirname)(workspaceUri), filename)));
                    break;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    label = (0, nls_1.localize)('workspaceName', "{0} (Workspace)", filename);
                    break;
            }
            if (options?.verbose === 0 /* Verbosity.SHORT */) {
                return label; // skip suffix for short label
            }
            return this.appendWorkspaceSuffix(label, workspaceUri);
        }
        doGetSingleFolderWorkspaceLabel(folderUri, options) {
            let label;
            switch (options?.verbose) {
                case 2 /* Verbosity.LONG */:
                    label = this.getUriLabel(folderUri);
                    break;
                case 0 /* Verbosity.SHORT */:
                case 1 /* Verbosity.MEDIUM */:
                default:
                    label = (0, resources_1.basename)(folderUri) || path_1.posix.sep;
                    break;
            }
            if (options?.verbose === 0 /* Verbosity.SHORT */) {
                return label; // skip suffix for short label
            }
            return this.appendWorkspaceSuffix(label, folderUri);
        }
        getSeparator(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter?.separator || path_1.posix.sep;
        }
        getHostLabel(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter?.workspaceSuffix || authority || '';
        }
        getHostTooltip(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter?.workspaceTooltip;
        }
        registerCachedFormatter(formatter) {
            const list = this.storedFormatters.formatters ??= [];
            let replace = list.findIndex(f => f.scheme === formatter.scheme && f.authority === formatter.authority);
            if (replace === -1 && list.length >= FORMATTER_CACHE_SIZE) {
                replace = FORMATTER_CACHE_SIZE - 1; // at max capacity, replace the last element
            }
            if (replace === -1) {
                list.unshift(formatter);
            }
            else {
                for (let i = replace; i > 0; i--) {
                    list[i] = list[i - 1];
                }
                list[0] = formatter;
            }
            this.storedFormattersMemento.saveMemento();
            return this.registerFormatter(formatter);
        }
        registerFormatter(formatter) {
            this.formatters.push(formatter);
            this._onDidChangeFormatters.fire({ scheme: formatter.scheme });
            return {
                dispose: () => {
                    this.formatters = this.formatters.filter(f => f !== formatter);
                    this._onDidChangeFormatters.fire({ scheme: formatter.scheme });
                }
            };
        }
        formatUri(resource, formatting, forceNoTildify) {
            let label = formatting.label.replace(labelMatchingRegexp, (match, token, qsToken, qsValue) => {
                switch (token) {
                    case 'scheme': return resource.scheme;
                    case 'authority': return resource.authority;
                    case 'authoritySuffix': {
                        const i = resource.authority.indexOf('+');
                        return i === -1 ? resource.authority : resource.authority.slice(i + 1);
                    }
                    case 'path':
                        return formatting.stripPathStartingSeparator
                            ? resource.path.slice(resource.path[0] === formatting.separator ? 1 : 0)
                            : resource.path;
                    default: {
                        if (qsToken === 'query') {
                            const { query } = resource;
                            if (query && query[0] === '{' && query[query.length - 1] === '}') {
                                try {
                                    return JSON.parse(query)[qsValue] || '';
                                }
                                catch { }
                            }
                        }
                        return '';
                    }
                }
            });
            // convert \c:\something => C:\something
            if (formatting.normalizeDriveLetter && hasDriveLetterIgnorePlatform(label)) {
                label = label.charAt(1).toUpperCase() + label.substr(2);
            }
            if (formatting.tildify && !forceNoTildify) {
                if (this.userHome) {
                    label = (0, labels_1.tildify)(label, this.userHome.fsPath, this.os);
                }
            }
            if (formatting.authorityPrefix && resource.authority) {
                label = formatting.authorityPrefix + label;
            }
            return label.replace(sepRegexp, formatting.separator);
        }
        appendWorkspaceSuffix(label, uri) {
            const formatting = this.findFormatting(uri);
            const suffix = formatting && (typeof formatting.workspaceSuffix === 'string') ? formatting.workspaceSuffix : undefined;
            return suffix ? `${label} [${suffix}]` : label;
        }
    };
    exports.LabelService = LabelService;
    exports.LabelService = LabelService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, pathService_1.IPathService),
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, storage_1.IStorageService),
        __param(5, lifecycle_2.ILifecycleService)
    ], LabelService);
    (0, extensions_1.registerSingleton)(label_1.ILabelService, LabelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFiZWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xhYmVsL2NvbW1vbi9sYWJlbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJoRyxNQUFNLCtCQUErQixHQUFHLHVDQUFrQixDQUFDLHNCQUFzQixDQUEyQjtRQUMzRyxjQUFjLEVBQUUseUJBQXlCO1FBQ3pDLFVBQVUsRUFBRTtZQUNYLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxzREFBc0QsRUFBRSw4Q0FBOEMsQ0FBQztZQUM3SCxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDO2dCQUNsQyxVQUFVLEVBQUU7b0JBQ1gsTUFBTSxFQUFFO3dCQUNQLElBQUksRUFBRSxRQUFRO3dCQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw2REFBNkQsRUFBRSx3R0FBd0csQ0FBQztxQkFDOUw7b0JBQ0QsU0FBUyxFQUFFO3dCQUNWLElBQUksRUFBRSxRQUFRO3dCQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnRUFBZ0UsRUFBRSx1RkFBdUYsQ0FBQztxQkFDaEw7b0JBQ0QsVUFBVSxFQUFFO3dCQUNYLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpRUFBaUUsRUFBRSwyQ0FBMkMsQ0FBQzt3QkFDckksSUFBSSxFQUFFLFFBQVE7d0JBQ2QsVUFBVSxFQUFFOzRCQUNYLEtBQUssRUFBRTtnQ0FDTixJQUFJLEVBQUUsUUFBUTtnQ0FDZCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNERBQTRELEVBQUUsNElBQTRJLENBQUM7NkJBQ2pPOzRCQUNELFNB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