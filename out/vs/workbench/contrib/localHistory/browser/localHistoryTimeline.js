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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/timeline/common/timeline", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/base/common/uri", "vs/workbench/services/path/common/pathService", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/files/common/files", "vs/workbench/contrib/localHistory/browser/localHistoryFileSystemProvider", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/editor", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/localHistory/browser/localHistoryCommands", "vs/base/common/htmlContent", "vs/workbench/contrib/localHistory/browser/localHistory", "vs/base/common/network", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/virtualWorkspace"], function (require, exports, nls_1, event_1, lifecycle_1, timeline_1, workingCopyHistory_1, uri_1, pathService_1, editorCommands_1, files_1, localHistoryFileSystemProvider_1, environmentService_1, editor_1, configuration_1, localHistoryCommands_1, htmlContent_1, localHistory_1, network_1, workspace_1, virtualWorkspace_1) {
    "use strict";
    var LocalHistoryTimeline_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalHistoryTimeline = void 0;
    let LocalHistoryTimeline = class LocalHistoryTimeline extends lifecycle_1.Disposable {
        static { LocalHistoryTimeline_1 = this; }
        static { this.ID = 'workbench.contrib.localHistoryTimeline'; }
        static { this.LOCAL_HISTORY_ENABLED_SETTINGS_KEY = 'workbench.localHistory.enabled'; }
        constructor(timelineService, workingCopyHistoryService, pathService, fileService, environmentService, configurationService, contextService) {
            super();
            this.timelineService = timelineService;
            this.workingCopyHistoryService = workingCopyHistoryService;
            this.pathService = pathService;
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.id = 'timeline.localHistory';
            this.label = (0, nls_1.localize)('localHistory', "Local History");
            this.scheme = '*'; // we try to show local history for all schemes if possible
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.timelineProviderDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.registerComponents();
            this.registerListeners();
        }
        registerComponents() {
            // Timeline (if enabled)
            this.updateTimelineRegistration();
            // File Service Provider
            this._register(this.fileService.registerProvider(localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA, new localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider(this.fileService)));
        }
        updateTimelineRegistration() {
            if (this.configurationService.getValue(LocalHistoryTimeline_1.LOCAL_HISTORY_ENABLED_SETTINGS_KEY)) {
                this.timelineProviderDisposable.value = this.timelineService.registerTimelineProvider(this);
            }
            else {
                this.timelineProviderDisposable.clear();
            }
        }
        registerListeners() {
            // History changes
            this._register(this.workingCopyHistoryService.onDidAddEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidChangeEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidReplaceEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidRemoveEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidRemoveEntries(() => this.onDidChangeWorkingCopyHistoryEntry(undefined /* all entries */)));
            this._register(this.workingCopyHistoryService.onDidMoveEntries(() => this.onDidChangeWorkingCopyHistoryEntry(undefined /* all entries */)));
            // Configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(LocalHistoryTimeline_1.LOCAL_HISTORY_ENABLED_SETTINGS_KEY)) {
                    this.updateTimelineRegistration();
                }
            }));
        }
        onDidChangeWorkingCopyHistoryEntry(entry) {
            // Re-emit as timeline change event
            this._onDidChange.fire({
                id: this.id,
                uri: entry?.workingCopy.resource,
                reset: true // there is no other way to indicate that items might have been replaced/removed
            });
        }
        async provideTimeline(uri, options, token) {
            const items = [];
            // Try to convert the provided `uri` into a form that is likely
            // for the provider to find entries for so that we can ensure
            // the timeline is always providing local history entries
            let resource = undefined;
            if (uri.scheme === localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA) {
                // `vscode-local-history`: convert back to the associated resource
                resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(uri).associatedResource;
            }
            else if (uri.scheme === this.pathService.defaultUriScheme || uri.scheme === network_1.Schemas.vscodeUserData) {
                // default-scheme / settings: keep as is
                resource = uri;
            }
            else if (this.fileService.hasProvider(uri)) {
                // anything that is backed by a file system provider:
                // try best to convert the URI back into a form that is
                // likely to match the workspace URIs. That means:
                // - change to the default URI scheme
                // - change to the remote authority or virtual workspace authority
                // - preserve the path
                resource = uri_1.URI.from({
                    scheme: this.pathService.defaultUriScheme,
                    authority: this.environmentService.remoteAuthority ?? (0, virtualWorkspace_1.getVirtualWorkspaceAuthority)(this.contextService.getWorkspace()),
                    path: uri.path
                });
            }
            if (resource) {
                // Retrieve from working copy history
                const entries = await this.workingCopyHistoryService.getEntries(resource, token);
                // Convert to timeline items
                for (const entry of entries) {
                    items.push(this.toTimelineItem(entry));
                }
            }
            return {
                source: this.id,
                items
            };
        }
        toTimelineItem(entry) {
            return {
                handle: entry.id,
                label: editor_1.SaveSourceRegistry.getSourceLabel(entry.source),
                tooltip: new htmlContent_1.MarkdownString(`$(history) ${(0, localHistory_1.getLocalHistoryDateFormatter)().format(entry.timestamp)}\n\n${editor_1.SaveSourceRegistry.getSourceLabel(entry.source)}`, { supportThemeIcons: true }),
                source: this.id,
                timestamp: entry.timestamp,
                themeIcon: localHistory_1.LOCAL_HISTORY_ICON_ENTRY,
                contextValue: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_VALUE,
                command: {
                    id: editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID,
                    title: localHistoryCommands_1.COMPARE_WITH_FILE_LABEL.value,
                    arguments: (0, localHistoryCommands_1.toDiffEditorArguments)(entry, entry.workingCopy.resource)
                }
            };
        }
    };
    exports.LocalHistoryTimeline = LocalHistoryTimeline;
    exports.LocalHistoryTimeline = LocalHistoryTimeline = LocalHistoryTimeline_1 = __decorate([
        __param(0, timeline_1.ITimelineService),
        __param(1, workingCopyHistory_1.IWorkingCopyHistoryService),
        __param(2, pathService_1.IPathService),
        __param(3, files_1.IFileService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, workspace_1.IWorkspaceContextService)
    ], LocalHistoryTimeline);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5VGltZWxpbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sb2NhbEhpc3RvcnkvYnJvd3Nlci9sb2NhbEhpc3RvcnlUaW1lbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd0J6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVOztpQkFFbkMsT0FBRSxHQUFHLHdDQUF3QyxBQUEzQyxDQUE0QztpQkFFdEMsdUNBQWtDLEdBQUcsZ0NBQWdDLEFBQW5DLENBQW9DO1FBYTlGLFlBQ21CLGVBQWtELEVBQ3hDLHlCQUFzRSxFQUNwRixXQUEwQyxFQUMxQyxXQUEwQyxFQUMxQixrQkFBaUUsRUFDeEUsb0JBQTRELEVBQ3pELGNBQXlEO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBUjJCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUN2Qiw4QkFBeUIsR0FBekIseUJBQXlCLENBQTRCO1lBQ25FLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3pCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ1QsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUN2RCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3hDLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQWxCM0UsT0FBRSxHQUFHLHVCQUF1QixDQUFDO1lBRTdCLFVBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFbEQsV0FBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLDJEQUEyRDtZQUVqRSxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXVCLENBQUMsQ0FBQztZQUMxRSxnQkFBVyxHQUFHLElB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