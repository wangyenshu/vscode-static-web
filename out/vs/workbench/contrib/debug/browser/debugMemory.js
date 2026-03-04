/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/assert", "vs/platform/files/common/files", "vs/workbench/contrib/debug/common/debug"], function (require, exports, buffer_1, event_1, lifecycle_1, numbers_1, assert_1, files_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugMemoryFileSystemProvider = void 0;
    const rangeRe = /range=([0-9]+):([0-9]+)/;
    class DebugMemoryFileSystemProvider {
        constructor(debugService) {
            this.debugService = debugService;
            this.memoryFdCounter = 0;
            this.fdMemory = new Map();
            this.changeEmitter = new event_1.Emitter();
            /** @inheritdoc */
            this.onDidChangeCapabilities = event_1.Event.None;
            /** @inheritdoc */
            this.onDidChangeFile = this.changeEmitter.event;
            /** @inheritdoc */
            this.capabilities = 0
                | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */
                | 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */;
            debugService.onDidEndSession(({ session }) => {
                for (const [fd, memory] of this.fdMemory) {
                    if (memory.session === session) {
                        this.close(fd);
                    }
                }
            });
        }
        watch(resource, opts) {
            if (opts.recursive) {
                return (0, lifecycle_1.toDisposable)(() => { });
            }
            const { session, memoryReference, offset } = this.parseUri(resource);
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add(session.onDidChangeState(() => {
                if (session.state === 3 /* State.Running */ || session.state === 0 /* State.Inactive */) {
                    this.changeEmitter.fire([{ type: 2 /* FileChangeType.DELETED */, resource }]);
                }
            }));
            disposable.add(session.onDidInvalidateMemory(e => {
                if (e.body.memoryReference !== memoryReference) {
                    return;
                }
                if (offset && (e.body.offset >= offset.toOffset || e.body.offset + e.body.count < offset.fromOffset)) {
                    return;
                }
                this.changeEmitter.fire([{ resource, type: 0 /* FileChangeType.UPDATED */ }]);
            }));
            return disposable;
        }
        /** @inheritdoc */
        stat(file) {
            const { readOnly } = this.parseUri(file);
            return Promise.resolve({
                type: files_1.FileType.File,
                mtime: 0,
                ctime: 0,
                size: 0,
                permissions: readOnly ? files_1.FilePermission.Readonly : undefined,
            });
        }
        /** @inheritdoc */
        mkdir() {
            throw (0, files_1.createFileSystemProviderError)(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        readdir() {
            throw (0, files_1.createFileSystemProviderError)(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        delete() {
            throw (0, files_1.createFileSystemProviderError)(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        rename() {
            throw (0, files_1.createFileSystemProviderError)(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        open(resource, _opts) {
            const { session, memoryReference, offset } = this.parseUri(resource);
            const fd = this.memoryFdCounter++;
            let region = session.getMemory(memoryReference);
            if (offset) {
                region = new MemoryRegionView(region, offset);
            }
            this.fdMemory.set(fd, { session, region });
            return Promise.resolve(fd);
        }
        /** @inheritdoc */
        close(fd) {
            this.fdMemory.get(fd)?.region.dispose();
            this.fdMemory.delete(fd);
            return Promise.resolve();
        }
        /** @inheritdoc */
        async writeFile(resource, content) {
            const { offset } = this.parseUri(resource);
            if (!offset) {
                throw (0, files_1.createFileSystemProviderError)(`Range must be present to read a file`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const fd = await this.open(resource, { create: false });
            try {
                await this.write(fd, offset.fromOffset, content, 0, content.length);
            }
            finally {
                this.close(fd);
            }
        }
        /** @inheritdoc */
        async readFile(resource) {
            const { offset } = this.parseUri(resource);
            if (!offset) {
                throw (0, files_1.createFileSystemProviderError)(`Range must be present to read a file`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const data = new Uint8Array(offset.toOffset - offset.fromOffset);
            const fd = await this.open(resource, { create: false });
            try {
                await this.read(fd, offset.fromOffset, data, 0, data.length);
                return data;
            }
            finally {
                this.close(fd);
            }
        }
        /** @inheritdoc */
        async read(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw (0, files_1.createFileSystemProviderError)(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            const ranges = await memory.region.read(pos, length);
            let readSoFar = 0;
            for (const range of ranges) {
                switch (range.type) {
                    case 1 /* MemoryRangeType.Unreadable */:
                        return readSoFar;
                    case 2 /* MemoryRangeType.Error */:
                        if (readSoFar > 0) {
                            return readSoFar;
                        }
                        else {
                            throw (0, files_1.createFileSystemProviderError)(range.error, files_1.FileSystemProviderErrorCode.Unknown);
                        }
                    case 0 /* MemoryRangeType.Valid */: {
                        const start = Math.max(0, pos - range.offset);
                        const toWrite = range.data.slice(start, Math.min(range.data.byteLength, start + (length - readSoFar)));
                        data.set(toWrite.buffer, offset + readSoFar);
                        readSoFar += toWrite.byteLength;
                        break;
                    }
                    default:
                        (0, assert_1.assertNever)(range);
                }
            }
            return readSoFar;
        }
        /** @inheritdoc */
        write(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw (0, files_1.createFileSystemProviderError)(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            return memory.region.write(pos, buffer_1.VSBuffer.wrap(data).slice(offset, offset + length));
        }
        parseUri(uri) {
            if (uri.scheme !== debug_1.DEBUG_MEMORY_SCHEME) {
                throw (0, files_1.createFileSystemProviderError)(`Cannot open file with scheme ${uri.scheme}`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const session = this.debugService.getModel().getSession(uri.authority);
            if (!session) {
                throw (0, files_1.createFileSystemProviderError)(`Debug session not found`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            let offset;
            const rangeMatch = rangeRe.exec(uri.query);
            if (rangeMatch) {
                offset = { fromOffset: Number(rangeMatch[1]), toOffset: Number(rangeMatch[2]) };
            }
            const [, memoryReference] = uri.path.split('/');
            return {
                session,
                offset,
                readOnly: !session.capabilities.supportsWriteMemoryRequest,
                sessionId: uri.authority,
                memoryReference: decodeURIComponent(memoryReference),
            };
        }
    }
    exports.DebugMemoryFileSystemProvider = DebugMemoryFileSystemProvider;
    /** A wrapper for a MemoryRegion that references a subset of data in another region. */
    class MemoryRegionView extends lifecycle_1.Disposable {
        constructor(parent, range) {
            super();
            this.parent = parent;
            this.range = range;
            this.invalidateEmitter = new event_1.Emitter();
            this.onDidInvalidate = this.invalidateEmitter.event;
            this.width = this.range.toOffset - this.range.fromOffset;
            this.writable = parent.writable;
            this._register(parent);
            this._register(parent.onDidInvalidate(e => {
                const fromOffset = (0, numbers_1.clamp)(e.fromOffset - range.fromOffset, 0, this.width);
                const toOffset = (0, numbers_1.clamp)(e.toOffset - range.fromOffset, 0, this.width);
                if (toOffset > fromOffset) {
                    this.invalidateEmitter.fire({ fromOffset, toOffset });
                }
            }));
        }
        read(fromOffset, toOffset) {
            if (fromOffset < 0) {
                throw new RangeError(`Invalid fromOffset: ${fromOffset}`);
            }
            return this.parent.read(this.range.fromOffset + fromOffset, this.range.fromOffset + Math.min(toOffset, this.width));
        }
        write(offset, data) {
            return this.parent.write(this.range.fromOffset + offset, data);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdNZW1vcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnTWVtb3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFNLE9BQU8sR0FBRyx5QkFBeUIsQ0FBQztJQUUxQyxNQUFhLDZCQUE2QjtRQWdCekMsWUFBNkIsWUFBMkI7WUFBM0IsaUJBQVksR0FBWixZQUFZLENBQWU7WUFmaEQsb0JBQWUsR0FBRyxDQUFDLENBQUM7WUFDWCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQTZELENBQUM7WUFDaEYsa0JBQWEsR0FBRyxJQUFJLGVBQU8sRUFBMEIsQ0FBQztZQUV2RSxrQkFBa0I7WUFDRiw0QkFBdUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBRXJELGtCQUFrQjtZQUNGLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUFFM0Qsa0JBQWtCO1lBQ0YsaUJBQVksR0FBRyxDQUFDOzZFQUNtQjsrRUFDSyxDQUFDO1lBR3hELFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQzVDLEtBQUssTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzFDLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxPQUFPLEVBQUUsQ0FBQzt3QkFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDaEIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sS0FBSyxDQUFDLFFBQWEsRUFBRSxJQUFtQjtZQUM5QyxJQUFJLElBQUksQ0FBQyxT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