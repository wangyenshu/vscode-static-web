/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullFileSystemProvider = void 0;
    class NullFileSystemProvider {
        constructor(disposableFactory = () => lifecycle_1.Disposable.None) {
            this.disposableFactory = disposableFactory;
            this.capabilities = 2048 /* FileSystemProviderCapabilities.Readonly */;
            this._onDidChangeCapabilities = new event_1.Emitter();
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            this._onDidChangeFile = new event_1.Emitter();
            this.onDidChangeFile = this._onDidChangeFile.event;
        }
        emitFileChangeEvents(changes) {
            this._onDidChangeFile.fire(changes);
        }
        setCapabilities(capabilities) {
            this.capabilities = capabilities;
            this._onDidChangeCapabilities.fire();
        }
        watch(resource, opts) { return this.disposableFactory(); }
        async stat(resource) { return undefined; }
        async mkdir(resource) { return undefined; }
        async readdir(resource) { return undefined; }
        async delete(resource, opts) { return undefined; }
        async rename(from, to, opts) { return undefined; }
        async copy(from, to, opts) { return undefined; }
        async readFile(resource) { return undefined; }
        readFileStream(resource, opts, token) { return undefined; }
        async writeFile(resource, content, opts) { return undefined; }
        async open(resource, opts) { return undefined; }
        async close(fd) { return undefined; }
        async read(fd, pos, data, offset, length) { return undefined; }
        async write(fd, pos, data, offset, length) { return undefined; }
    }
    exports.NullFileSystemProvider = NullFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbEZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL3Rlc3QvY29tbW9uL251bGxGaWxlU3lzdGVtUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsc0JBQXNCO1FBVWxDLFlBQW9CLG9CQUF1QyxHQUFHLEVBQUUsQ0FBQyxzQkFBVSxDQUFDLElBQUk7WUFBNUQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUEyQztZQVJoRixpQkFBWSxzREFBMkU7WUFFdEUsNkJBQXdCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUN2RCw0QkFBdUIsR0FBZ0IsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztZQUVuRSxxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBMEIsQ0FBQztZQUNqRSxvQkFBZSxHQUFrQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1FBRUYsQ0FBQztRQUVyRixvQkFBb0IsQ0FBQyxPQUFzQjtZQUMxQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxlQUFlLENBQUMsWUFBNEM7WUFDM0QsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7WUFFakMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxLQUFLLENBQUMsUUFBYSxFQUFFLElBQW1CLElBQWlCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNGLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBYSxJQUFvQixPQUFPLFNBQVUsQ0FBQyxDQUFDLENBQUM7UUFDaEUsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFhLElBQW1CLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMvRCxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQWEsSUFBbUMsT0FBTyxTQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2xGLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBYSxFQUFFLElBQXdCLElBQW1CLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMxRixLQUFLLENBQUMsTUFBTSxDQUFDLElBQVMsRUFBRSxFQUFPLEVBQUUsSUFBMkIsSUFBbUIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBUyxFQUFFLEVBQU8sRUFBRSxJQUEyQixJQUFtQixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDaEcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFhLElBQXlCLE9BQU8sU0FBVSxDQUFDLENBQUMsQ0FBQztRQUN6RSxjQUFjLENBQUMsUUFBYSxFQUFFLElBQTRCLEVBQUUsS0FBd0IsSUFBc0MsT0FBTyxTQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzlJLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBYSxFQUFFLE9BQW1CLEVBQUUsSUFBdUIsSUFBbUIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2pILEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBYSxFQUFFLElBQXNCLElBQXFCLE9BQU8sU0FBVSxDQUFDLENBQUMsQ0FBQztRQUN6RixLQUFLLENBQUMsS0FBSyxDQUFDLEVBQVUsSUFBbUIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzVELEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBVSxFQUFFLEdBQVcsRUFBRSxJQUFnQixFQUFFLE1BQWMsRUFBRSxNQUFjLElBQXFCLE9BQU8sU0FBVSxDQUFDLENBQUMsQ0FBQztRQUM3SCxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQVUsRUFBRSxHQUFXLEVBQUUsSUFBZ0IsRUFBRSxNQUFjLEVBQUUsTUFBYyxJQUFxQixPQUFPLFNBQVUsQ0FBQyxDQUFDLENBQUM7S0FDOUg7SUFwQ0Qsd0RBb0NDIn0=