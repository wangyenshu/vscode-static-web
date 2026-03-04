/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/iterator", "vs/base/common/resources"], function (require, exports, glob, iterator_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookStaticPreloadInfo = exports.NotebookOutputRendererInfo = void 0;
    class DependencyList {
        constructor(value) {
            this.value = new Set(value);
            this.defined = this.value.size > 0;
        }
        /** Gets whether any of the 'available' dependencies match the ones in this list */
        matches(available) {
            // For now this is simple, but this may expand to support globs later
            // @see https://github.com/microsoft/vscode/issues/119899
            return available.some(v => this.value.has(v));
        }
    }
    class NotebookOutputRendererInfo {
        constructor(descriptor) {
            this.id = descriptor.id;
            this.extensionId = descriptor.extension.identifier;
            this.extensionLocation = descriptor.extension.extensionLocation;
            this.isBuiltin = descriptor.extension.isBuiltin;
            if (typeof descriptor.entrypoint === 'string') {
                this.entrypoint = {
                    extends: undefined,
                    path: (0, resources_1.joinPath)(this.extensionLocation, descriptor.entrypoint)
                };
            }
            else {
                this.entrypoint = {
                    extends: descriptor.entrypoint.extends,
                    path: (0, resources_1.joinPath)(this.extensionLocation, descriptor.entrypoint.path)
                };
            }
            this.displayName = descriptor.displayName;
            this.mimeTypes = descriptor.mimeTypes;
            this.mimeTypeGlobs = this.mimeTypes.map(pattern => glob.parse(pattern));
            this.hardDependencies = new DependencyList(descriptor.dependencies ?? iterator_1.Iterable.empty());
            this.optionalDependencies = new DependencyList(descriptor.optionalDependencies ?? iterator_1.Iterable.empty());
            this.messaging = descriptor.requiresMessaging ?? "never" /* RendererMessagingSpec.Never */;
        }
        matchesWithoutKernel(mimeType) {
            if (!this.matchesMimeTypeOnly(mimeType)) {
                return 3 /* NotebookRendererMatch.Never */;
            }
            if (this.hardDependencies.defined) {
                return 0 /* NotebookRendererMatch.WithHardKernelDependency */;
            }
            if (this.optionalDependencies.defined) {
                return 1 /* NotebookRendererMatch.WithOptionalKernelDependency */;
            }
            return 2 /* NotebookRendererMatch.Pure */;
        }
        matches(mimeType, kernelProvides) {
            if (!this.matchesMimeTypeOnly(mimeType)) {
                return 3 /* NotebookRendererMatch.Never */;
            }
            if (this.hardDependencies.defined) {
                return this.hardDependencies.matches(kernelProvides)
                    ? 0 /* NotebookRendererMatch.WithHardKernelDependency */
                    : 3 /* NotebookRendererMatch.Never */;
            }
            return this.optionalDependencies.matches(kernelProvides)
                ? 1 /* NotebookRendererMatch.WithOptionalKernelDependency */
                : 2 /* NotebookRendererMatch.Pure */;
        }
        matchesMimeTypeOnly(mimeType) {
            if (this.entrypoint.extends) { // We're extending another renderer
                return false;
            }
            return this.mimeTypeGlobs.some(pattern => pattern(mimeType)) || this.mimeTypes.some(pattern => pattern === mimeType);
        }
    }
    exports.NotebookOutputRendererInfo = NotebookOutputRendererInfo;
    class NotebookStaticPreloadInfo {
        constructor(descriptor) {
            this.type = descriptor.type;
            this.entrypoint = (0, resources_1.joinPath)(descriptor.extension.extensionLocation, descriptor.entrypoint);
            this.extensionLocation = descriptor.extension.extensionLocation;
            this.localResourceRoots = descriptor.localResourceRoots.map(root => (0, resources_1.joinPath)(descriptor.extension.extensionLocation, root));
        }
    }
    exports.NotebookStaticPreloadInfo = NotebookStaticPreloadInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRwdXRSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9ub3RlYm9va091dHB1dFJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFNLGNBQWM7UUFJbkIsWUFBWSxLQUF1QjtZQUNsQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxtRkFBbUY7UUFDNUUsT0FBTyxDQUFDLFNBQWdDO1lBQzlDLHFFQUFxRTtZQUNyRSx5REFBeUQ7WUFDekQsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQyxDQUFDO0tBQ0Q7SUFFRCxNQUFhLDBCQUEwQjtRQWdCdEMsWUFBWSxVQVNYO1lBQ0EsSUFBSSxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7WUFDbkQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUM7WUFDaEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUVoRCxJQUFJLE9BQU8sVUFBVSxDQUFDLFVBQVUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxD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