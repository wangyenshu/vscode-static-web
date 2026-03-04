/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/stream", "vs/platform/files/common/files"], function (require, exports, buffer_1, event_1, lifecycle_1, resources, stream_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryFileSystemProvider = void 0;
    class File {
        constructor(name) {
            this.type = files_1.FileType.File;
            this.ctime = Date.now();
            this.mtime = Date.now();
            this.size = 0;
            this.name = name;
        }
    }
    class Directory {
        constructor(name) {
            this.type = files_1.FileType.Directory;
            this.ctime = Date.now();
            this.mtime = Date.now();
            this.size = 0;
            this.name = name;
            this.entries = new Map();
        }
    }
    class InMemoryFileSystemProvider extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.memoryFdCounter = 0;
            this.fdMemory = new Map();
            this._onDidChangeCapabilities = this._register(new event_1.Emitter());
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            this._capabilities = 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
            this.root = new Directory('');
            // --- manage file events
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._bufferedChanges = [];
        }
        get capabilities() { return this._capabilities; }
        setReadOnly(readonly) {
            const isReadonly = !!(this._capabilities & 2048 /* FileSystemProviderCapabilities.Readonly */);
            if (readonly !== isReadonly) {
                this._capabilities = readonly ? 2048 /* FileSystemProviderCapabilities.Readonly */ | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */ | 2 /* FileSystemProviderCapabilities.FileReadWrite */
                    : 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                this._onDidChangeCapabilities.fire();
            }
        }
        // --- manage file metadata
        async stat(resource) {
            return this._lookup(resource, false);
        }
        async readdir(resource) {
            const entry = this._lookupAsDirectory(resource, false);
            const result = [];
            entry.entries.forEach((child, name) => result.push([name, child.type]));
            return result;
        }
        // --- manage file contents
        async readFile(resource) {
            const data = this._lookupAsFile(resource, false).data;
            if (data) {
                return data;
            }
            throw (0, files_1.createFileSystemProviderError)('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
        }
        readFileStream(resource) {
            const data = this._lookupAsFile(resource, false).data;
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            stream.end(data);
            return stream;
        }
        async writeFile(resource, content, opts) {
            const basename = resources.basename(resource);
            const parent = this._lookupParentDirectory(resource);
            let entry = parent.entries.get(basename);
            if (entry instanceof Directory) {
                throw (0, files_1.createFileSystemProviderError)('file is directory', files_1.FileSystemProviderErrorCode.FileIsADirectory);
            }
            if (!entry && !opts.create) {
                throw (0, files_1.createFileSystemProviderError)('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            if (entry && opts.create && !opts.overwrite) {
                throw (0, files_1.createFileSystemProviderError)('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
            }
            if (!entry) {
                entry = new File(basename);
                parent.entries.set(basename, entry);
                this._fireSoon({ type: 1 /* FileChangeType.ADDED */, resource });
            }
            entry.mtime = Date.now();
            entry.size = content.byteLength;
            entry.data = content;
            this._fireSoon({ type: 0 /* FileChangeType.UPDATED */, resource });
        }
        // file open/read/write/close
        open(resource, opts) {
            const data = this._lookupAsFile(resource, false).data;
            if (data) {
                const fd = this.memoryFdCounter++;
                this.fdMemory.set(fd, data);
                return Promise.resolve(fd);
            }
            throw (0, files_1.createFileSystemProviderError)('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
        }
        close(fd) {
            this.fdMemory.delete(fd);
            return Promise.resolve();
        }
        read(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw (0, files_1.createFileSystemProviderError)(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            const toWrite = buffer_1.VSBuffer.wrap(memory).slice(pos, pos + length);
            data.set(toWrite.buffer, offset);
            return Promise.resolve(toWrite.byteLength);
        }
        write(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw (0, files_1.createFileSystemProviderError)(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            const toWrite = buffer_1.VSBuffer.wrap(data).slice(offset, offset + length);
            memory.set(toWrite.buffer, pos);
            return Promise.resolve(toWrite.byteLength);
        }
        // --- manage files/folders
        async rename(from, to, opts) {
            if (!opts.overwrite && this._lookup(to, true)) {
                throw (0, files_1.createFileSystemProviderError)('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
            }
            const entry = this._lookup(from, false);
            const oldParent = this._lookupParentDirectory(from);
            const newParent = this._lookupParentDirectory(to);
            const newName = resources.basename(to);
            oldParent.entries.delete(entry.name);
            entry.name = newName;
            newParent.entries.set(newName, entry);
            this._fireSoon({ type: 2 /* FileChangeType.DELETED */, resource: from }, { type: 1 /* FileChangeType.ADDED */, resource: to });
        }
        async delete(resource, opts) {
            const dirname = resources.dirname(resource);
            const basename = resources.basename(resource);
            const parent = this._lookupAsDirectory(dirname, false);
            if (parent.entries.has(basename)) {
                parent.entries.delete(basename);
                parent.mtime = Date.now();
                parent.size -= 1;
                this._fireSoon({ type: 0 /* FileChangeType.UPDATED */, resource: dirname }, { resource, type: 2 /* FileChangeType.DELETED */ });
            }
        }
        async mkdir(resource) {
            if (this._lookup(resource, true)) {
                throw (0, files_1.createFileSystemProviderError)('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
            }
            const basename = resources.basename(resource);
            const dirname = resources.dirname(resource);
            const parent = this._lookupAsDirectory(dirname, false);
            const entry = new Directory(basename);
            parent.entries.set(entry.name, entry);
            parent.mtime = Date.now();
            parent.size += 1;
            this._fireSoon({ type: 0 /* FileChangeType.UPDATED */, resource: dirname }, { type: 1 /* FileChangeType.ADDED */, resource });
        }
        _lookup(uri, silent) {
            const parts = uri.path.split('/');
            let entry = this.root;
            for (const part of parts) {
                if (!part) {
                    continue;
                }
                let child;
                if (entry instanceof Directory) {
                    child = entry.entries.get(part);
                }
                if (!child) {
                    if (!silent) {
                        throw (0, files_1.createFileSystemProviderError)('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    else {
                        return undefined;
                    }
                }
                entry = child;
            }
            return entry;
        }
        _lookupAsDirectory(uri, silent) {
            const entry = this._lookup(uri, silent);
            if (entry instanceof Directory) {
                return entry;
            }
            throw (0, files_1.createFileSystemProviderError)('file not a directory', files_1.FileSystemProviderErrorCode.FileNotADirectory);
        }
        _lookupAsFile(uri, silent) {
            const entry = this._lookup(uri, silent);
            if (entry instanceof File) {
                return entry;
            }
            throw (0, files_1.createFileSystemProviderError)('file is a directory', files_1.FileSystemProviderErrorCode.FileIsADirectory);
        }
        _lookupParentDirectory(uri) {
            const dirname = resources.dirname(uri);
            return this._lookupAsDirectory(dirname, false);
        }
        watch(resource, opts) {
            // ignore, fires for all changes...
            return lifecycle_1.Disposable.None;
        }
        _fireSoon(...changes) {
            this._bufferedChanges.push(...changes);
            if (this._fireSoonHandle) {
                clearTimeout(this._fireSoonHandle);
            }
            this._fireSoonHandle = setTimeout(() => {
                this._onDidChangeFile.fire(this._bufferedChanges);
                this._bufferedChanges.length = 0;
            }, 5);
        }
        dispose() {
            super.dispose();
            this.fdMemory.clear();
        }
    }
    exports.InMemoryFileSystemProvider = InMemoryFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5NZW1vcnlGaWxlc3lzdGVtUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9maWxlcy9jb21tb24vaW5NZW1vcnlGaWxlc3lzdGVtUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQU0sSUFBSTtRQVVULFlBQVksSUFBWTtZQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLGdCQUFRLENBQUMsSUFBSSxDQUFDO1lBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBRUQsTUFBTSxTQUFTO1FBVWQsWUFBWSxJQUFZO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQVEsQ0FBQyxTQUFTLENBQUM7WUFDL0IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7WUFDZCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUNEO0lBSUQsTUFBYSwwQkFBMkIsU0FBUSxzQkFBVTtRQUExRDs7WUFRUyxvQkFBZSxHQUFHLENBQUMsQ0FBQztZQUNYLGFBQVEsR0FBRyxJQUFJLEdB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