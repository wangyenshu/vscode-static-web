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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/dataTransfer", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/nls", "vs/platform/workspace/common/workspace"], function (require, exports, arrays_1, dataTransfer_1, hierarchicalKind_1, lifecycle_1, mime_1, network_1, resources_1, uri_1, languages_1, languageFeatures_1, nls_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultPasteProvidersFeature = exports.DefaultDropProvidersFeature = exports.DefaultTextPasteOrDropEditProvider = void 0;
    class SimplePasteAndDropProvider {
        async provideDocumentPasteEdits(_model, _ranges, dataTransfer, context, token) {
            const edit = await this.getEdit(dataTransfer, token);
            if (!edit) {
                return undefined;
            }
            return {
                dispose() { },
                edits: [{ insertText: edit.insertText, title: edit.title, kind: edit.kind, handledMimeType: edit.handledMimeType, yieldTo: edit.yieldTo }]
            };
        }
        async provideDocumentDropEdits(_model, _position, dataTransfer, token) {
            const edit = await this.getEdit(dataTransfer, token);
            return edit ? [{ insertText: edit.insertText, title: edit.title, kind: edit.kind, handledMimeType: edit.handledMimeType, yieldTo: edit.yieldTo }] : undefined;
        }
    }
    class DefaultTextPasteOrDropEditProvider extends SimplePasteAndDropProvider {
        constructor() {
            super(...arguments);
            this.id = DefaultTextPasteOrDropEditProvider.id;
            this.kind = DefaultTextPasteOrDropEditProvider.kind;
            this.dropMimeTypes = [mime_1.Mimes.text];
            this.pasteMimeTypes = [mime_1.Mimes.text];
        }
        static { this.id = 'text'; }
        static { this.kind = new hierarchicalKind_1.HierarchicalKind('text.plain'); }
        async getEdit(dataTransfer, _token) {
            const textEntry = dataTransfer.get(mime_1.Mimes.text);
            if (!textEntry) {
                return;
            }
            // Suppress if there's also a uriList entry.
            // Typically the uri-list contains the same text as the text entry so showing both is confusing.
            if (dataTransfer.has(mime_1.Mimes.uriList)) {
                return;
            }
            const insertText = await textEntry.asString();
            return {
                handledMimeType: mime_1.Mimes.text,
                title: (0, nls_1.localize)('text.label', "Insert Plain Text"),
                insertText,
                kind: this.kind,
            };
        }
    }
    exports.DefaultTextPasteOrDropEditProvider = DefaultTextPasteOrDropEditProvider;
    class PathProvider extends SimplePasteAndDropProvider {
        constructor() {
            super(...arguments);
            this.kind = new hierarchicalKind_1.HierarchicalKind('uri.absolute');
            this.dropMimeTypes = [mime_1.Mimes.uriList];
            this.pasteMimeTypes = [mime_1.Mimes.uriList];
        }
        async getEdit(dataTransfer, token) {
            const entries = await extractUriList(dataTransfer);
            if (!entries.length || token.isCancellationRequested) {
                return;
            }
            let uriCount = 0;
            const insertText = entries
                .map(({ uri, originalText }) => {
                if (uri.scheme === network_1.Schemas.file) {
                    return uri.fsPath;
                }
                else {
                    uriCount++;
                    return originalText;
                }
            })
                .join(' ');
            let label;
            if (uriCount > 0) {
                // Dropping at least one generic uri (such as https) so use most generic label
                label = entries.length > 1
                    ? (0, nls_1.localize)('defaultDropProvider.uriList.uris', "Insert Uris")
                    : (0, nls_1.localize)('defaultDropProvider.uriList.uri', "Insert Uri");
            }
            else {
                // All the paths are file paths
                label = entries.length > 1
                    ? (0, nls_1.localize)('defaultDropProvider.uriList.paths', "Insert Paths")
                    : (0, nls_1.localize)('defaultDropProvider.uriList.path', "Insert Path");
            }
            return {
                handledMimeType: mime_1.Mimes.uriList,
                insertText,
                title: label,
                kind: this.kind,
            };
        }
    }
    let RelativePathProvider = class RelativePathProvider extends SimplePasteAndDropProvider {
        constructor(_workspaceContextService) {
            super();
            this._workspaceContextService = _workspaceContextService;
            this.kind = new hierarchicalKind_1.HierarchicalKind('uri.relative');
            this.dropMimeTypes = [mime_1.Mimes.uriList];
            this.pasteMimeTypes = [mime_1.Mimes.uriList];
        }
        async getEdit(dataTransfer, token) {
            const entries = await extractUriList(dataTransfer);
            if (!entries.length || token.isCancellationRequested) {
                return;
            }
            const relativeUris = (0, arrays_1.coalesce)(entries.map(({ uri }) => {
                const root = this._workspaceContextService.getWorkspaceFolder(uri);
                return root ? (0, resources_1.relativePath)(root.uri, uri) : undefined;
            }));
            if (!relativeUris.length) {
                return;
            }
            return {
                handledMimeType: mime_1.Mimes.uriList,
                insertText: relativeUris.join(' '),
                title: entries.length > 1
                    ? (0, nls_1.localize)('defaultDropProvider.uriList.relativePaths', "Insert Relative Paths")
                    : (0, nls_1.localize)('defaultDropProvider.uriList.relativePath', "Insert Relative Path"),
                kind: this.kind,
            };
        }
    };
    RelativePathProvider = __decorate([
        __param(0, workspace_1.IWorkspaceContextService)
    ], RelativePathProvider);
    class PasteHtmlProvider {
        constructor() {
            this.kind = new hierarchicalKind_1.HierarchicalKind('html');
            this.pasteMimeTypes = ['text/html'];
            this._yieldTo = [{ mimeType: mime_1.Mimes.text }];
        }
        async provideDocumentPasteEdits(_model, _ranges, dataTransfer, context, token) {
            if (context.triggerKind !== languages_1.DocumentPasteTriggerKind.PasteAs && !context.only?.contains(this.kind)) {
                return;
            }
            const entry = dataTransfer.get('text/html');
            const htmlText = await entry?.asString();
            if (!htmlText || token.isCancellationRequested) {
                return;
            }
            return {
                dispose() { },
                edits: [{
                        insertText: htmlText,
                        yieldTo: this._yieldTo,
                        title: (0, nls_1.localize)('pasteHtmlLabel', 'Insert HTML'),
                        kind: this.kind,
                    }],
            };
        }
    }
    async function extractUriList(dataTransfer) {
        const urlListEntry = dataTransfer.get(mime_1.Mimes.uriList);
        if (!urlListEntry) {
            return [];
        }
        const strUriList = await urlListEntry.asString();
        const entries = [];
        for (const entry of dataTransfer_1.UriList.parse(strUriList)) {
            try {
                entries.push({ uri: uri_1.URI.parse(entry), originalText: entry });
            }
            catch {
                // noop
            }
        }
        return entries;
    }
    let DefaultDropProvidersFeature = class DefaultDropProvidersFeature extends lifecycle_1.Disposable {
        constructor(languageFeaturesService, workspaceContextService) {
            super();
            this._register(languageFeaturesService.documentDropEditProvider.register('*', new DefaultTextPasteOrDropEditProvider()));
            this._register(languageFeaturesService.documentDropEditProvider.register('*', new PathProvider()));
            this._register(languageFeaturesService.documentDropEditProvider.register('*', new RelativePathProvider(workspaceContextService)));
        }
    };
    exports.DefaultDropProvidersFeature = DefaultDropProvidersFeature;
    exports.DefaultDropProvidersFeature = DefaultDropProvidersFeature = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], DefaultDropProvidersFeature);
    let DefaultPasteProvidersFeature = class DefaultPasteProvidersFeature extends lifecycle_1.Disposable {
        constructor(languageFeaturesService, workspaceContextService) {
            super();
            this._register(languageFeaturesService.documentPasteEditProvider.register('*', new DefaultTextPasteOrDropEditProvider()));
            this._register(languageFeaturesService.documentPasteEditProvider.register('*', new PathProvider()));
            this._register(languageFeaturesService.documentPasteEditProvider.register('*', new RelativePathProvider(workspaceContextService)));
            this._register(languageFeaturesService.documentPasteEditProvider.register('*', new PasteHtmlProvider()));
        }
    };
    exports.DefaultPasteProvidersFeature = DefaultPasteProvidersFeature;
    exports.DefaultPasteProvidersFeature = DefaultPasteProvidersFeature = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], DefaultPasteProvidersFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdFByb3ZpZGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2Ryb3BPclBhc3RlSW50by9icm93c2VyL2RlZmF1bHRQcm92aWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxNQUFlLDBCQUEwQjtRQU14QyxLQUFLLENBQUMseUJBQXlCLENBQUMsTUFBa0IsRUFBRSxPQUEwQixFQUFFLFlBQXFDLEVBQUUsT0FBNkIsRUFBRSxLQUF3QjtZQUM3SyxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTztnQkFDTixPQUFPLEtBQUssQ0FBQztnQkFDYixLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDMUksQ0FBQztRQUNILENBQUM7UUFFRCxLQUFLLENBQUMsd0JBQXdCLENBQUMsTUFBa0IsRUFBRSxTQUFvQixFQUFFLFlBQXFDLEVBQUUsS0FBd0I7WUFDdkksTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRCxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQy9KLENBQUM7S0FHRDtJQUVELE1BQWEsa0NBQW1DLFNBQVEsMEJBQTBCO1FBQWxGOztZQUtVLE9BQUUsR0FBRyxrQ0FBa0MsQ0FBQyxFQUFFLENBQUM7WUFDM0MsU0FBSSxHQUFHLGtDQUFrQyxDQUFDLElBQUksQ0FBQztZQUMvQyxrQkFBYSxHQUFHLENBQUMsWUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdCLG1CQUFjLEdBQUcsQ0FBQyxZQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFzQnhDLENBQUM7aUJBNUJnQixPQUFFLEdBQUcsTUFBTSxBQUFULENBQVU7aUJBQ1osU0FBSSxHQUFHLElBQUksbUNBQWdCLENBQUMsWUFBWSxDQUFDLEFBQXJDLENBQXNDO1FBT2hELEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBcUMsRUFBRSxNQUF5QjtZQUN2RixNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLFlBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU87WUFDUixDQUFDO1lBRUQsNENBQTRDO1lBQzVDLGdHQUFnRztZQUNoRyxJQUFJLFlBQVksQ0FBQyxHQUFHLENBQUMsWUFBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDOUMsT0FBTztnQkFDTixlQUFlLEVBQUUsWUFBSyxDQUFDLElBQUk7Z0JBQzNCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsbUJBQW1CLENBQUM7Z0JBQ2xELFVBQVU7Z0JBQ1YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2FBQ2YsQ0FBQztRQUNILENBQUM7O0lBN0JGLGdGQThCQztJQUVELE1BQU0sWUFBYSxTQUFRLDBCQUEwQjtRQUFyRDs7WUFFVSxTQUFJLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM1QyxrQkFBYSxHQUFHLENBQUMsWUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLG1CQUFjLEdBQUcsQ0FBQyxZQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUF3QzNDLENBQUM7UUF0Q1UsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFxQyxFQUFFLEtBQXdCO1lBQ3RGLE1BQU0sT0FBTyxHQUFHLE1BQU0sY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUN0RCxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNqQixNQUFNLFVBQVUsR0FBRyxPQUFPO2lCQUN4QixHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFO2dCQUM5QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDakMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDO2dCQUNuQixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsUUFBUSxFQUFFLENBQUM7b0JBQ1gsT0FBTyxZQUFZLENBQUM7Z0JBQ3JCLENBQUM7WUFDRixDQUFDLENBQUM7aUJBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRVosSUFBSSxLQUFhLENBQUM7WUFDbEIsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xCLDhFQUE4RTtnQkFDOUUsS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztvQkFDekIsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLGFBQWEsQ0FBQztvQkFDN0QsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzlELENBQUM7aUJBQU0sQ0FBQztnQkFDUCwrQkFBK0I7Z0JBQy9CLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUM7b0JBQ3pCLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQ0FBbUMsRUFBRSxjQUFjLENBQUM7b0JBQy9ELENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxrQ0FBa0MsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNoRSxDQUFDO1lBRUQsT0FBTztnQkFDTixlQUFlLEVBQUUsWUFBSyxDQUFDLE9BQU87Z0JBQzlCLFVBQVU7Z0JBQ1YsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2FBQ2YsQ0FBQztRQUNILENBQUM7S0FDRDtJQUVELElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsMEJBQTBCO1FBTTVELFlBQzJCLHdCQUFtRTtZQUU3RixLQUFLLEVBQUUsQ0FBQztZQUZtQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBTHJGLFNBQUksR0FBRyxJQUFJLG1DQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzVDLGtCQUFhLEdBQUcsQ0FBQyxZQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDaEMsbUJBQWMsR0FBRyxDQUFDLFlBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQU0xQyxDQUFDO1FBRVMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFxQyxFQUFFLEtBQXdCO1lBQ3RGLE1BQU0sT0FBTyxHQUFHLE1BQU0sY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUN0RCxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLElBQUEsaUJBQVEsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFO2dCQUNyRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25FLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3ZELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixPQUFPO1lBQ1IsQ0FBQztZQUVELE9BQU87Z0JBQ04sZUFBZSxFQUFFLFlBQUssQ0FBQyxPQUFPO2dCQUM5QixVQUFVLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ2xDLEtBQUssRUFBRSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUM7b0JBQ3hCLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQywyQ0FBMkMsRUFBRSx1QkFBdUIsQ0FBQztvQkFDaEYsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLDBDQUEwQyxFQUFFLHNCQUFzQixDQUFDO2dCQUMvRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7YUFDZixDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUFwQ0ssb0JBQW9CO1FBT3ZCLFdBQUEsb0NBQXdCLENBQUE7T0FQckIsb0JBQW9CLENBb0N6QjtJQUVELE1BQU0saUJBQWlCO1FBQXZCO1lBRWlCLFNBQUksR0FBRyxJQUFJLG1DQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXBDLG1CQUFjLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUU5QixhQUFRLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQXVCeEQsQ0FBQztRQXJCQSxLQUFLLENBQUMseUJBQXlCLENBQUMsTUFBa0IsRUFBRSxPQUEwQixFQUFFLFlBQXFDLEVBQUUsT0FBNkIsRUFBRSxLQUF3QjtZQUM3SyxJQUFJLE9BQU8sQ0FBQyxXQUFXLEtBQUssb0NBQXdCLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3BHLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM1QyxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQztZQUN6QyxJQUFJLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNoRCxPQUFPO1lBQ1IsQ0FBQztZQUVELE9BQU87Z0JBQ04sT0FBTyxLQUFLLENBQUM7Z0JBQ2IsS0FBSyxFQUFFLENBQUM7d0JBQ1AsVUFBVSxFQUFFLFFBQVE7d0JBQ3BCLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUTt3QkFDdEIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQzt3QkFDaEQsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO3FCQUNmLENBQUM7YUFDRixDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBRUQsS0FBSyxVQUFVLGNBQWMsQ0FBQyxZQUFxQztRQUNsRSxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLFlBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbkIsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxPQUFPLEdBQTJELEVBQUUsQ0FBQztRQUMzRSxLQUFLLE1BQU0sS0FBSyxJQUFJLHNCQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDL0MsSUFBSSxDQUFDO2dCQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNSLE9BQU87WUFDUixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFTSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBQzFELFlBQzJCLHVCQUFpRCxFQUNqRCx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxrQ0FBa0MsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6SCxJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkcsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksb0JBQW9CLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkksQ0FBQztLQUNELENBQUE7SUFYWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQUVyQyxXQUFBLDJDQUF3QixDQUFBO1FBQ3hCLFdBQUEsb0NBQXdCLENBQUE7T0FIZCwyQkFBMkIsQ0FXdkM7SUFFTSxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVO1FBQzNELFlBQzJCLHVCQUFpRCxFQUNqRCx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxrQ0FBa0MsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxSCxJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEcsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksb0JBQW9CLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkksSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUcsQ0FBQztLQUNELENBQUE7SUFaWSxvRUFBNEI7MkNBQTVCLDRCQUE0QjtRQUV0QyxXQUFBLDJDQUF3QixDQUFBO1FBQ3hCLFdBQUEsb0NBQXdCLENBQUE7T0FIZCw0QkFBNEIsQ0FZeEMifQ==