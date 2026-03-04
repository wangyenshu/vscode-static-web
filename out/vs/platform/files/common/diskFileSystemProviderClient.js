/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/uuid", "vs/platform/files/common/files", "vs/platform/files/common/watcher"], function (require, exports, buffer_1, errorMessage_1, errors_1, event_1, lifecycle_1, stream_1, uuid_1, files_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProviderClient = exports.LOCAL_FILE_SYSTEM_CHANNEL_NAME = void 0;
    exports.LOCAL_FILE_SYSTEM_CHANNEL_NAME = 'localFilesystem';
    /**
     * An implementation of a local disk file system provider
     * that is backed by a `IChannel` and thus implemented via
     * IPC on a different process.
     */
    class DiskFileSystemProviderClient extends lifecycle_1.Disposable {
        constructor(channel, extraCapabilities) {
            super();
            this.channel = channel;
            this.extraCapabilities = extraCapabilities;
            //#region File Capabilities
            this.onDidChangeCapabilities = event_1.Event.None;
            //#endregion
            //#region File Watching
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChange.event;
            this._onDidWatchError = this._register(new event_1.Emitter());
            this.onDidWatchError = this._onDidWatchError.event;
            // The contract for file watching via remote is to identify us
            // via a unique but readonly session ID. Since the remote is
            // managing potentially many watchers from different clients,
            // this helps the server to properly partition events to the right
            // clients.
            this.sessionId = (0, uuid_1.generateUuid)();
            this.registerFileChangeListeners();
        }
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */ |
                        8 /* FileSystemProviderCapabilities.FileFolderCopy */ |
                        8192 /* FileSystemProviderCapabilities.FileWriteUnlock */ |
                        16384 /* FileSystemProviderCapabilities.FileAtomicRead */ |
                        32768 /* FileSystemProviderCapabilities.FileAtomicWrite */ |
                        65536 /* FileSystemProviderCapabilities.FileAtomicDelete */ |
                        131072 /* FileSystemProviderCapabilities.FileClone */;
                if (this.extraCapabilities.pathCaseSensitive) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
                if (this.extraCapabilities.trash) {
                    this._capabilities |= 4096 /* FileSystemProviderCapabilities.Trash */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        //#region File Metadata Resolving
        stat(resource) {
            return this.channel.call('stat', [resource]);
        }
        readdir(resource) {
            return this.channel.call('readdir', [resource]);
        }
        //#endregion
        //#region File Reading/Writing
        async readFile(resource, opts) {
            const { buffer } = await this.channel.call('readFile', [resource, opts]);
            return buffer;
        }
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            const disposables = new lifecycle_1.DisposableStore();
            // Reading as file stream goes through an event to the remote side
            disposables.add(this.channel.listen('readFileStream', [resource, opts])(dataOrErrorOrEnd => {
                // data
                if (dataOrErrorOrEnd instanceof buffer_1.VSBuffer) {
                    stream.write(dataOrErrorOrEnd.buffer);
                }
                // end or error
                else {
                    if (dataOrErrorOrEnd === 'end') {
                        stream.end();
                    }
                    else {
                        let error;
                        // Take Error as is if type matches
                        if (dataOrErrorOrEnd instanceof Error) {
                            error = dataOrErrorOrEnd;
                        }
                        // Otherwise, try to deserialize into an error.
                        // Since we communicate via IPC, we cannot be sure
                        // that Error objects are properly serialized.
                        else {
                            const errorCandidate = dataOrErrorOrEnd;
                            error = (0, files_1.createFileSystemProviderError)(errorCandidate.message ?? (0, errorMessage_1.toErrorMessage)(errorCandidate), errorCandidate.code ?? files_1.FileSystemProviderErrorCode.Unknown);
                        }
                        stream.error(error);
                        stream.end();
                    }
                    // Signal to the remote side that we no longer listen
                    disposables.dispose();
                }
            }));
            // Support cancellation
            disposables.add(token.onCancellationRequested(() => {
                // Ensure to end the stream properly with an error
                // to indicate the cancellation.
                stream.error((0, errors_1.canceled)());
                stream.end();
                // Ensure to dispose the listener upon cancellation. This will
                // bubble through the remote side as event and allows to stop
                // reading the file.
                disposables.dispose();
            }));
            return stream;
        }
        writeFile(resource, content, opts) {
            return this.channel.call('writeFile', [resource, buffer_1.VSBuffer.wrap(content), opts]);
        }
        open(resource, opts) {
            return this.channel.call('open', [resource, opts]);
        }
        close(fd) {
            return this.channel.call('close', [fd]);
        }
        async read(fd, pos, data, offset, length) {
            const [bytes, bytesRead] = await this.channel.call('read', [fd, pos, length]);
            // copy back the data that was written into the buffer on the remote
            // side. we need to do this because buffers are not referenced by
            // pointer, but only by value and as such cannot be directly written
            // to from the other process.
            data.set(bytes.buffer.slice(0, bytesRead), offset);
            return bytesRead;
        }
        write(fd, pos, data, offset, length) {
            return this.channel.call('write', [fd, pos, buffer_1.VSBuffer.wrap(data), offset, length]);
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        mkdir(resource) {
            return this.channel.call('mkdir', [resource]);
        }
        delete(resource, opts) {
            return this.channel.call('delete', [resource, opts]);
        }
        rename(resource, target, opts) {
            return this.channel.call('rename', [resource, target, opts]);
        }
        copy(resource, target, opts) {
            return this.channel.call('copy', [resource, target, opts]);
        }
        //#endregion
        //#region Clone File
        cloneFile(resource, target) {
            return this.channel.call('cloneFile', [resource, target]);
        }
        registerFileChangeListeners() {
            // The contract for file changes is that there is one listener
            // for both events and errors from the watcher. So we need to
            // unwrap the event from the remote and emit through the proper
            // emitter.
            this._register(this.channel.listen('fileChange', [this.sessionId])(eventsOrError => {
                if (Array.isArray(eventsOrError)) {
                    const events = eventsOrError;
                    this._onDidChange.fire((0, watcher_1.reviveFileChanges)(events));
                }
                else {
                    const error = eventsOrError;
                    this._onDidWatchError.fire(error);
                }
            }));
        }
        watch(resource, opts) {
            // Generate a request UUID to correlate the watcher
            // back to us when we ask to dispose the watcher later.
            const req = (0, uuid_1.generateUuid)();
            this.channel.call('watch', [this.sessionId, req, resource, opts]);
            return (0, lifecycle_1.toDisposable)(() => this.channel.call('unwatch', [this.sessionId, req]));
        }
    }
    exports.DiskFileSystemProviderClient = DiskFileSystemProviderClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlckNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2NvbW1vbi9kaXNrRmlsZVN5c3RlbVByb3ZpZGVyQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVuRixRQUFBLDhCQUE4QixHQUFHLGlCQUFpQixDQUFDO0lBRWhFOzs7O09BSUc7SUFDSCxNQUFhLDRCQUE2QixTQUFRLHNCQUFVO1FBUTNELFlBQ2tCLE9BQWlCLEVBQ2pCLGlCQUFtRTtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQUhTLFlBQU8sR0FBUCxPQUFPLENBQVU7WUFDakIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrRDtZQU9yRiwyQkFBMkI7WUFFbEIsNEJBQXVCLEdBQWdCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFxSzNELFlBQVk7WUFFWix1QkFBdUI7WUFFTixpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTBCLENBQUMsQ0FBQztZQUM3RSxvQkFBZSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBRWxDLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQ2pFLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUV2RCw4REFBOEQ7WUFDOUQsNERBQTREO1lBQzVELDZEQUE2RDtZQUM3RCxrRUFBa0U7WUFDbEUsV0FBVztZQUNNLGNBQVMsR0FBRyxJQUFBLG1CQUFZLEdBQUUsQ0FBQztZQXpMM0MsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7UUFDcEMsQ0FBQztRQU9ELElBQUksWUFBWTtZQUNmLElBQUksQ0FBQyxJ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