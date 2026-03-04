/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/buffer"], function (require, exports, event_1, lifecycle_1, uri_1, files_1, resources_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalHistoryFileSystemProvider = void 0;
    /**
     * A wrapper around a standard file system provider
     * that is entirely readonly.
     */
    class LocalHistoryFileSystemProvider {
        static { this.SCHEMA = 'vscode-local-history'; }
        static toLocalHistoryFileSystem(resource) {
            const serializedLocalHistoryResource = {
                location: resource.location.toString(true),
                associatedResource: resource.associatedResource.toString(true)
            };
            // Try to preserve the associated resource as much as possible
            // and only keep the `query` part dynamic. This enables other
            // components (e.g. other timeline providers) to continue
            // providing timeline entries even when our resource is active.
            return resource.associatedResource.with({
                scheme: LocalHistoryFileSystemProvider.SCHEMA,
                query: JSON.stringify(serializedLocalHistoryResource)
            });
        }
        static fromLocalHistoryFileSystem(resource) {
            const serializedLocalHistoryResource = JSON.parse(resource.query);
            return {
                location: uri_1.URI.parse(serializedLocalHistoryResource.location),
                associatedResource: uri_1.URI.parse(serializedLocalHistoryResource.associatedResource)
            };
        }
        static { this.EMPTY_RESOURCE = uri_1.URI.from({ scheme: LocalHistoryFileSystemProvider.SCHEMA, path: '/empty' }); }
        static { this.EMPTY = {
            location: LocalHistoryFileSystemProvider.EMPTY_RESOURCE,
            associatedResource: LocalHistoryFileSystemProvider.EMPTY_RESOURCE
        }; }
        get capabilities() {
            return 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 2048 /* FileSystemProviderCapabilities.Readonly */;
        }
        constructor(fileService) {
            this.fileService = fileService;
            this.mapSchemeToProvider = new Map();
            //#endregion
            //#region Unsupported File Operations
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
        }
        async withProvider(resource) {
            const scheme = resource.scheme;
            let providerPromise = this.mapSchemeToProvider.get(scheme);
            if (!providerPromise) {
                // Resolve early when provider already exists
                const provider = this.fileService.getProvider(scheme);
                if (provider) {
                    providerPromise = Promise.resolve(provider);
                }
                // Otherwise wait for registration
                else {
                    providerPromise = new Promise(resolve => {
                        const disposable = this.fileService.onDidChangeFileSystemProviderRegistrations(e => {
                            if (e.added && e.provider && e.scheme === scheme) {
                                disposable.dispose();
                                resolve(e.provider);
                            }
                        });
                    });
                }
                this.mapSchemeToProvider.set(scheme, providerPromise);
            }
            return providerPromise;
        }
        //#region Supported File Operations
        async stat(resource) {
            const location = LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(resource).location;
            // Special case: empty resource
            if ((0, resources_1.isEqual)(LocalHistoryFileSystemProvider.EMPTY_RESOURCE, location)) {
                return { type: files_1.FileType.File, ctime: 0, mtime: 0, size: 0 };
            }
            // Otherwise delegate to provider
            return (await this.withProvider(location)).stat(location);
        }
        async readFile(resource) {
            const location = LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(resource).location;
            // Special case: empty resource
            if ((0, resources_1.isEqual)(LocalHistoryFileSystemProvider.EMPTY_RESOURCE, location)) {
                return buffer_1.VSBuffer.fromString('').buffer;
            }
            // Otherwise delegate to provider
            const provider = await this.withProvider(location);
            if ((0, files_1.hasReadWriteCapability)(provider)) {
                return provider.readFile(location);
            }
            throw new Error('Unsupported');
        }
        async writeFile(resource, content, opts) { }
        async mkdir(resource) { }
        async readdir(resource) { return []; }
        async rename(from, to, opts) { }
        async delete(resource, opts) { }
        watch(resource, opts) { return lifecycle_1.Disposable.None; }
    }
    exports.LocalHistoryFileSystemProvider = LocalHistoryFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5RmlsZVN5c3RlbVByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbG9jYWxIaXN0b3J5L2Jyb3dzZXIvbG9jYWxIaXN0b3J5RmlsZVN5c3RlbVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJCaEc7OztPQUdHO0lBQ0gsTUFBYSw4QkFBOEI7aUJBRTFCLFdBQU0sR0FBRyxzQkFBc0IsQUFBekIsQ0FBMEI7UUFFaEQsTUFBTSxDQUFDLHdCQUF3QixDQUFDLFFBQStCO1lBQzlELE1BQU0sOEJBQThCLEdBQW9DO2dCQUN2RSxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUMxQyxrQkFBa0IsRUFBRSxRQUFRLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQzthQUM5RCxDQUFDO1lBRUYsOERBQThEO1lBQzlELDZEQUE2RDtZQUM3RCx5REFBeUQ7WUFDekQsK0RBQStEO1lBQy9ELE9BQU8sUUFBUSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQztnQkFDdkMsTUFBTSxFQUFFLDhCQUE4QixDQUFDLE1BQU07Z0JBQzdDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLDhCQUE4QixDQUFDO2FBQ3JELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxNQUFNLENBQUMsMEJBQTBCLENBQUMsUUFBYTtZQUM5QyxNQUFNLDhCQUE4QixHQUFvQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVuRyxPQUFPO2dCQUNOLFFBQVEsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLDhCQUE4QixDQUFDLFFBQVEsQ0FBQztnQkFDNUQsa0JB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