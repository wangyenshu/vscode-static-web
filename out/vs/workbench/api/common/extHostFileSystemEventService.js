/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/uri", "./extHost.protocol", "./extHostTypeConverters", "./extHostTypes", "vs/base/common/lazy"], function (require, exports, event_1, glob_1, uri_1, extHost_protocol_1, typeConverter, extHostTypes_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostFileSystemEventService = void 0;
    class FileSystemWatcher {
        get ignoreCreateEvents() {
            return Boolean(this._config & 0b001);
        }
        get ignoreChangeEvents() {
            return Boolean(this._config & 0b010);
        }
        get ignoreDeleteEvents() {
            return Boolean(this._config & 0b100);
        }
        constructor(mainContext, workspace, extension, dispatcher, globPattern, options) {
            this.session = Math.random();
            this._onDidCreate = new event_1.Emitter();
            this._onDidChange = new event_1.Emitter();
            this._onDidDelete = new event_1.Emitter();
            this._config = 0;
            if (options?.ignoreCreateEvents) {
                this._config += 0b001;
            }
            if (options?.ignoreChangeEvents) {
                this._config += 0b010;
            }
            if (options?.ignoreDeleteEvents) {
                this._config += 0b100;
            }
            const parsedPattern = (0, glob_1.parse)(globPattern);
            // 1.64.x behaviour change: given the new support to watch any folder
            // we start to ignore events outside the workspace when only a string
            // pattern is provided to avoid sending events to extensions that are
            // unexpected.
            // https://github.com/microsoft/vscode/issues/3025
            const excludeOutOfWorkspaceEvents = typeof globPattern === 'string';
            // 1.84.x introduces new proposed API for a watcher to set exclude
            // rules. In these cases, we turn the file watcher into correlation
            // mode and ignore any event that does not match the correlation ID.
            const excludeUncorrelatedEvents = options?.correlate;
            const subscription = dispatcher(events => {
                if (typeof events.session === 'number' && events.session !== this.session) {
                    return; // ignore events from other file watchers that are in correlation mode
                }
                if (excludeUncorrelatedEvents && typeof events.session === 'undefined') {
                    return; // ignore events from other non-correlating file watcher when we are in correlation mode
                }
                if (!options?.ignoreCreateEvents) {
                    for (const created of events.created) {
                        const uri = uri_1.URI.revive(created);
                        if (parsedPattern(uri.fsPath) && (!excludeOutOfWorkspaceEvents || workspace.getWorkspaceFolder(uri))) {
                            this._onDidCreate.fire(uri);
                        }
                    }
                }
                if (!options?.ignoreChangeEvents) {
                    for (const changed of events.changed) {
                        const uri = uri_1.URI.revive(changed);
                        if (parsedPattern(uri.fsPath) && (!excludeOutOfWorkspaceEvents || workspace.getWorkspaceFolder(uri))) {
                            this._onDidChange.fire(uri);
                        }
                    }
                }
                if (!options?.ignoreDeleteEvents) {
                    for (const deleted of events.deleted) {
                        const uri = uri_1.URI.revive(deleted);
                        if (parsedPattern(uri.fsPath) && (!excludeOutOfWorkspaceEvents || workspace.getWorkspaceFolder(uri))) {
                            this._onDidDelete.fire(uri);
                        }
                    }
                }
            });
            this._disposable = extHostTypes_1.Disposable.from(this.ensureWatching(mainContext, extension, globPattern, options, options?.correlate), this._onDidCreate, this._onDidChange, this._onDidDelete, subscription);
        }
        ensureWatching(mainContext, extension, globPattern, options, correlate) {
            const disposable = extHostTypes_1.Disposable.from();
            if (typeof globPattern === 'string') {
                return disposable; // workspace is already watched by default, no need to watch again!
            }
            if (options?.ignoreChangeEvents && options?.ignoreCreateEvents && options?.ignoreDeleteEvents) {
                return disposable; // no need to watch if we ignore all events
            }
            const proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadFileSystemEventService);
            let recursive = false;
            if (globPattern.pattern.includes(glob_1.GLOBSTAR) || globPattern.pattern.includes(glob_1.GLOB_SPLIT)) {
                recursive = true; // only watch recursively if pattern indicates the need for it
            }
            let filter;
            if (correlate) {
                if (options?.ignoreChangeEvents || options?.ignoreCreateEvents || options?.ignoreDeleteEvents) {
                    filter = 2 /* FileChangeFilter.UPDATED */ | 4 /* FileChangeFilter.ADDED */ | 8 /* FileChangeFilter.DELETED */;
                    if (options?.ignoreChangeEvents) {
                        filter &= ~2 /* FileChangeFilter.UPDATED */;
                    }
                    if (options?.ignoreCreateEvents) {
                        filter &= ~4 /* FileChangeFilter.ADDED */;
                    }
                    if (options?.ignoreDeleteEvents) {
                        filter &= ~8 /* FileChangeFilter.DELETED */;
                    }
                }
            }
            proxy.$watch(extension.identifier.value, this.session, globPattern.baseUri, { recursive, excludes: options?.excludes ?? [], filter }, Boolean(correlate));
            return extHostTypes_1.Disposable.from({ dispose: () => proxy.$unwatch(this.session) });
        }
        dispose() {
            this._disposable.dispose();
        }
        get onDidCreate() {
            return this._onDidCreate.event;
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        get onDidDelete() {
            return this._onDidDelete.event;
        }
    }
    class LazyRevivedFileSystemEvents {
        constructor(_events) {
            this._events = _events;
            this.session = this._events.session;
            this._created = new lazy_1.Lazy(() => this._events.created.map(uri_1.URI.revive));
            this._changed = new lazy_1.Lazy(() => this._events.changed.map(uri_1.URI.revive));
            this._deleted = new lazy_1.Lazy(() => this._events.deleted.map(uri_1.URI.revive));
        }
        get created() { return this._created.value; }
        get changed() { return this._changed.value; }
        get deleted() { return this._deleted.value; }
    }
    class ExtHostFileSystemEventService {
        constructor(_mainContext, _logService, _extHostDocumentsAndEditors) {
            this._mainContext = _mainContext;
            this._logService = _logService;
            this._extHostDocumentsAndEditors = _extHostDocumentsAndEditors;
            this._onFileSystemEvent = new event_1.Emitter();
            this._onDidRenameFile = new event_1.Emitter();
            this._onDidCreateFile = new event_1.Emitter();
            this._onDidDeleteFile = new event_1.Emitter();
            this._onWillRenameFile = new event_1.AsyncEmitter();
            this._onWillCreateFile = new event_1.AsyncEmitter();
            this._onWillDeleteFile = new event_1.AsyncEmitter();
            this.onDidRenameFile = this._onDidRenameFile.event;
            this.onDidCreateFile = this._onDidCreateFile.event;
            this.onDidDeleteFile = this._onDidDeleteFile.event;
            //
        }
        //--- file events
        createFileSystemWatcher(workspace, extension, globPattern, options) {
            return new FileSystemWatcher(this._mainContext, workspace, extension, this._onFileSystemEvent.event, typeConverter.GlobPattern.from(globPattern), options);
        }
        $onFileEvent(events) {
            this._onFileSystemEvent.fire(new LazyRevivedFileSystemEvents(events));
        }
        //--- file operations
        $onDidRunFileOperation(operation, files) {
            switch (operation) {
                case 2 /* FileOperation.MOVE */:
                    this._onDidRenameFile.fire(Object.freeze({ files: files.map(f => ({ oldUri: uri_1.URI.revive(f.source), newUri: uri_1.URI.revive(f.target) })) }));
                    break;
                case 1 /* FileOperation.DELETE */:
                    this._onDidDeleteFile.fire(Object.freeze({ files: files.map(f => uri_1.URI.revive(f.target)) }));
                    break;
                case 0 /* FileOperation.CREATE */:
                case 3 /* FileOperation.COPY */:
                    this._onDidCreateFile.fire(Object.freeze({ files: files.map(f => uri_1.URI.revive(f.target)) }));
                    break;
                default:
                //ignore, dont send
            }
        }
        getOnWillRenameFileEvent(extension) {
            return this._createWillExecuteEvent(extension, this._onWillRenameFile);
        }
        getOnWillCreateFileEvent(extension) {
            return this._createWillExecuteEvent(extension, this._onWillCreateFile);
        }
        getOnWillDeleteFileEvent(extension) {
            return this._createWillExecuteEvent(extension, this._onWillDeleteFile);
        }
        _createWillExecuteEvent(extension, emitter) {
            return (listener, thisArg, disposables) => {
                const wrappedListener = function wrapped(e) { listener.call(thisArg, e); };
                wrappedListener.extension = extension;
                return emitter.event(wrappedListener, undefined, disposables);
            };
        }
        async $onWillRunFileOperation(operation, files, timeout, token) {
            switch (operation) {
                case 2 /* FileOperation.MOVE */:
                    return await this._fireWillEvent(this._onWillRenameFile, { files: files.map(f => ({ oldUri: uri_1.URI.revive(f.source), newUri: uri_1.URI.revive(f.target) })) }, timeout, token);
                case 1 /* FileOperation.DELETE */:
                    return await this._fireWillEvent(this._onWillDeleteFile, { files: files.map(f => uri_1.URI.revive(f.target)) }, timeout, token);
                case 0 /* FileOperation.CREATE */:
                case 3 /* FileOperation.COPY */:
                    return await this._fireWillEvent(this._onWillCreateFile, { files: files.map(f => uri_1.URI.revive(f.target)) }, timeout, token);
            }
            return undefined;
        }
        async _fireWillEvent(emitter, data, timeout, token) {
            const extensionNames = new Set();
            const edits = [];
            await emitter.fireAsync(data, token, async (thenable, listener) => {
                // ignore all results except for WorkspaceEdits. Those are stored in an array.
                const now = Date.now();
                const result = await Promise.resolve(thenable);
                if (result instanceof extHostTypes_1.WorkspaceEdit) {
                    edits.push([listener.extension, result]);
                    extensionNames.add(listener.extension.displayName ?? listener.extension.identifier.value);
                }
                if (Date.now() - now > timeout) {
                    this._logService.warn('SLOW file-participant', listener.extension.identifier);
                }
            });
            if (token.isCancellationRequested) {
                return undefined;
            }
            if (edits.length === 0) {
                return undefined;
            }
            // concat all WorkspaceEdits collected via waitUntil-call and send them over to the renderer
            const dto = { edits: [] };
            for (const [, edit] of edits) {
                const { edits } = typeConverter.WorkspaceEdit.from(edit, {
                    getTextDocumentVersion: uri => this._extHostDocumentsAndEditors.getDocument(uri)?.version,
                    getNotebookDocumentVersion: () => undefined,
                });
                dto.edits = dto.edits.concat(edits);
            }
            return { edit: dto, extensionNames: Array.from(extensionNames) };
        }
    }
    exports.ExtHostFileSystemEventService = ExtHostFileSystemEventService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEZpbGVTeXN0ZW1FdmVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0RmlsZVN5c3RlbUV2ZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyQmhHLE1BQU0saUJBQWlCO1FBV3RCLElBQUksa0JBQWtCO1lBQ3JCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELElBQUksa0JBQWtCO1lBQ3JCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELElBQUksa0JBQWtCO1lBQ3JCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELFlBQVksV0FBeUIsRUFBRSxTQUE0QixFQUFFLFNBQWdDLEVBQUUsVUFBbUMsRUFBRSxXQUF5QyxFQUFFLE9BQXdDO1lBckI5TSxZQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRXhCLGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQWMsQ0FBQztZQUN6QyxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFjLENBQUM7WUFDekMsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBYyxDQUFDO1lBa0J6RCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNqQixJQUFJLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQztZQUN2QixDQUFDO1lBQ0QsSUFBSSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztn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