/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/lifecycle", "vs/base/common/buffer", "vs/base/common/stream", "vs/base/common/cancellation"], function (require, exports, event_1, diskFileSystemProvider_1, lifecycle_1, buffer_1, stream_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractSessionFileWatcher = exports.AbstractDiskFileSystemProviderChannel = void 0;
    /**
     * A server implementation for a IPC based file system provider client.
     */
    class AbstractDiskFileSystemProviderChannel extends lifecycle_1.Disposable {
        constructor(provider, logService) {
            super();
            this.provider = provider;
            this.logService = logService;
            //#endregion
            //#region File Watching
            this.sessionToWatcher = new Map();
            this.watchRequests = new Map();
        }
        call(ctx, command, arg) {
            const uriTransformer = this.getUriTransformer(ctx);
            switch (command) {
                case 'stat': return this.stat(uriTransformer, arg[0]);
                case 'readdir': return this.readdir(uriTransformer, arg[0]);
                case 'open': return this.open(uriTransformer, arg[0], arg[1]);
                case 'close': return this.close(arg[0]);
                case 'read': return this.read(arg[0], arg[1], arg[2]);
                case 'readFile': return this.readFile(uriTransformer, arg[0], arg[1]);
                case 'write': return this.write(arg[0], arg[1], arg[2], arg[3], arg[4]);
                case 'writeFile': return this.writeFile(uriTransformer, arg[0], arg[1], arg[2]);
                case 'rename': return this.rename(uriTransformer, arg[0], arg[1], arg[2]);
                case 'copy': return this.copy(uriTransformer, arg[0], arg[1], arg[2]);
                case 'cloneFile': return this.cloneFile(uriTransformer, arg[0], arg[1]);
                case 'mkdir': return this.mkdir(uriTransformer, arg[0]);
                case 'delete': return this.delete(uriTransformer, arg[0], arg[1]);
                case 'watch': return this.watch(uriTransformer, arg[0], arg[1], arg[2], arg[3]);
                case 'unwatch': return this.unwatch(arg[0], arg[1]);
            }
            throw new Error(`IPC Command ${command} not found`);
        }
        listen(ctx, event, arg) {
            const uriTransformer = this.getUriTransformer(ctx);
            switch (event) {
                case 'fileChange': return this.onFileChange(uriTransformer, arg[0]);
                case 'readFileStream': return this.onReadFileStream(uriTransformer, arg[0], arg[1]);
            }
            throw new Error(`Unknown event ${event}`);
        }
        //#region File Metadata Resolving
        stat(uriTransformer, _resource) {
            const resource = this.transformIncoming(uriTransformer, _resource, true);
            return this.provider.stat(resource);
        }
        readdir(uriTransformer, _resource) {
            const resource = this.transformIncoming(uriTransformer, _resource);
            return this.provider.readdir(resource);
        }
        //#endregion
        //#region File Reading/Writing
        async readFile(uriTransformer, _resource, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource, true);
            const buffer = await this.provider.readFile(resource, opts);
            return buffer_1.VSBuffer.wrap(buffer);
        }
        onReadFileStream(uriTransformer, _resource, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource, true);
            const cts = new cancellation_1.CancellationTokenSource();
            const emitter = new event_1.Emitter({
                onDidRemoveLastListener: () => {
                    // Ensure to cancel the read operation when there is no more
                    // listener on the other side to prevent unneeded work.
                    cts.cancel();
                }
            });
            const fileStream = this.provider.readFileStream(resource, opts, cts.token);
            (0, stream_1.listenStream)(fileStream, {
                onData: chunk => emitter.fire(buffer_1.VSBuffer.wrap(chunk)),
                onError: error => emitter.fire(error),
                onEnd: () => {
                    // Forward event
                    emitter.fire('end');
                    // Cleanup
                    emitter.dispose();
                    cts.dispose();
                }
            });
            return emitter.event;
        }
        writeFile(uriTransformer, _resource, content, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource);
            return this.provider.writeFile(resource, content.buffer, opts);
        }
        open(uriTransformer, _resource, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource, true);
            return this.provider.open(resource, opts);
        }
        close(fd) {
            return this.provider.close(fd);
        }
        async read(fd, pos, length) {
            const buffer = buffer_1.VSBuffer.alloc(length);
            const bufferOffset = 0; // offset is 0 because we create a buffer to read into for each call
            const bytesRead = await this.provider.read(fd, pos, buffer.buffer, bufferOffset, length);
            return [buffer, bytesRead];
        }
        write(fd, pos, data, offset, length) {
            return this.provider.write(fd, pos, data.buffer, offset, length);
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        mkdir(uriTransformer, _resource) {
            const resource = this.transformIncoming(uriTransformer, _resource);
            return this.provider.mkdir(resource);
        }
        delete(uriTransformer, _resource, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource);
            return this.provider.delete(resource, opts);
        }
        rename(uriTransformer, _source, _target, opts) {
            const source = this.transformIncoming(uriTransformer, _source);
            const target = this.transformIncoming(uriTransformer, _target);
            return this.provider.rename(source, target, opts);
        }
        copy(uriTransformer, _source, _target, opts) {
            const source = this.transformIncoming(uriTransformer, _source);
            const target = this.transformIncoming(uriTransformer, _target);
            return this.provider.copy(source, target, opts);
        }
        //#endregion
        //#region Clone File
        cloneFile(uriTransformer, _source, _target) {
            const source = this.transformIncoming(uriTransformer, _source);
            const target = this.transformIncoming(uriTransformer, _target);
            return this.provider.cloneFile(source, target);
        }
        onFileChange(uriTransformer, sessionId) {
            // We want a specific emitter for the given session so that events
            // from the one session do not end up on the other session. As such
            // we create a `SessionFileWatcher` and a `Emitter` for that session.
            const emitter = new event_1.Emitter({
                onWillAddFirstListener: () => {
                    this.sessionToWatcher.set(sessionId, this.createSessionFileWatcher(uriTransformer, emitter));
                },
                onDidRemoveLastListener: () => {
                    (0, lifecycle_1.dispose)(this.sessionToWatcher.get(sessionId));
                    this.sessionToWatcher.delete(sessionId);
                }
            });
            return emitter.event;
        }
        async watch(uriTransformer, sessionId, req, _resource, opts) {
            const watcher = this.sessionToWatcher.get(sessionId);
            if (watcher) {
                const resource = this.transformIncoming(uriTransformer, _resource);
                const disposable = watcher.watch(req, resource, opts);
                this.watchRequests.set(sessionId + req, disposable);
            }
        }
        async unwatch(sessionId, req) {
            const id = sessionId + req;
            const disposable = this.watchRequests.get(id);
            if (disposable) {
                (0, lifecycle_1.dispose)(disposable);
                this.watchRequests.delete(id);
            }
        }
        //#endregion
        dispose() {
            super.dispose();
            for (const [, disposable] of this.watchRequests) {
                disposable.dispose();
            }
            this.watchRequests.clear();
            for (const [, disposable] of this.sessionToWatcher) {
                disposable.dispose();
            }
            this.sessionToWatcher.clear();
        }
    }
    exports.AbstractDiskFileSystemProviderChannel = AbstractDiskFileSystemProviderChannel;
    class AbstractSessionFileWatcher extends lifecycle_1.Disposable {
        constructor(uriTransformer, sessionEmitter, logService, environmentService) {
            super();
            this.uriTransformer = uriTransformer;
            this.logService = logService;
            this.environmentService = environmentService;
            this.watcherRequests = new Map();
            // To ensure we use one file watcher per session, we keep a
            // disk file system provider instantiated for this session.
            // The provider is cheap and only stateful when file watching
            // starts.
            //
            // This is important because we want to ensure that we only
            // forward events from the watched paths for this session and
            // not other clients that asked to watch other paths.
            this.fileWatcher = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(this.logService, { watcher: { recursive: this.getRecursiveWatcherOptions(this.environmentService) } }));
            this.registerListeners(sessionEmitter);
        }
        registerListeners(sessionEmitter) {
            const localChangeEmitter = this._register(new event_1.Emitter());
            this._register(localChangeEmitter.event((events) => {
                sessionEmitter.fire(events.map(e => ({
                    resource: this.uriTransformer.transformOutgoingURI(e.resource),
                    type: e.type,
                    cId: e.cId
                })));
            }));
            this._register(this.fileWatcher.onDidChangeFile(events => localChangeEmitter.fire(events)));
            this._register(this.fileWatcher.onDidWatchError(error => sessionEmitter.fire(error)));
        }
        getRecursiveWatcherOptions(environmentService) {
            return undefined; // subclasses can override
        }
        getExtraExcludes(environmentService) {
            return undefined; // subclasses can override
        }
        watch(req, resource, opts) {
            const extraExcludes = this.getExtraExcludes(this.environmentService);
            if (Array.isArray(extraExcludes)) {
                opts.excludes = [...opts.excludes, ...extraExcludes];
            }
            this.watcherRequests.set(req, this.fileWatcher.watch(resource, opts));
            return (0, lifecycle_1.toDisposable)(() => {
                (0, lifecycle_1.dispose)(this.watcherRequests.get(req));
                this.watcherRequests.delete(req);
            });
        }
        dispose() {
            for (const [, disposable] of this.watcherRequests) {
                disposable.dispose();
            }
            this.watcherRequests.clear();
            super.dispose();
        }
    }
    exports.AbstractSessionFileWatcher = AbstractSessionFileWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlclNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL25vZGUvZGlza0ZpbGVTeXN0ZW1Qcm92aWRlclNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQmhHOztPQUVHO0lBQ0gsTUFBc0IscUNBQXlDLFNBQVEsc0JBQVU7UUFFaEYsWUFDb0IsUUFBZ0MsRUFDaEMsVUFBdUI7WUFFMUMsS0FBSyxFQUFFLENBQUM7WUFIVyxhQUFRLEdBQVIsUUFBUSxDQUF3QjtZQUNoQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBeUszQyxZQUFZO1lBRVosdUJBQXVCO1lBRU4scUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQWdELENBQUM7WUFDM0Usa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBcUQsQ0FBQztRQTNLOUYsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFNLEVBQUUsT0FBZSxFQUFFLEdBQVM7WUFDdEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRW5ELFFBQVEsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLEtBQUssTUFBTSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEQsS0FBSyxTQUFTLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxLQUFLLE1BQU0sQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FB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