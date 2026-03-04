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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/map", "vs/nls", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/common/views", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, buffer_1, map_1, nls_1, files_1, instantiation_1, uriIdentity_1, editorCommands_1, views_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetsResourceTreeItem = exports.SnippetsResource = exports.SnippetsResourceInitializer = void 0;
    let SnippetsResourceInitializer = class SnippetsResourceInitializer {
        constructor(userDataProfileService, fileService, uriIdentityService) {
            this.userDataProfileService = userDataProfileService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
        }
        async initialize(content) {
            const snippetsContent = JSON.parse(content);
            for (const key in snippetsContent.snippets) {
                const resource = this.uriIdentityService.extUri.joinPath(this.userDataProfileService.currentProfile.snippetsHome, key);
                await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(snippetsContent.snippets[key]));
            }
        }
    };
    exports.SnippetsResourceInitializer = SnippetsResourceInitializer;
    exports.SnippetsResourceInitializer = SnippetsResourceInitializer = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, files_1.IFileService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], SnippetsResourceInitializer);
    let SnippetsResource = class SnippetsResource {
        constructor(fileService, uriIdentityService) {
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
        }
        async getContent(profile, excluded) {
            const snippets = await this.getSnippets(profile, excluded);
            return JSON.stringify({ snippets });
        }
        async apply(content, profile) {
            const snippetsContent = JSON.parse(content);
            for (const key in snippetsContent.snippets) {
                const resource = this.uriIdentityService.extUri.joinPath(profile.snippetsHome, key);
                await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(snippetsContent.snippets[key]));
            }
        }
        async getSnippets(profile, excluded) {
            const snippets = {};
            const snippetsResources = await this.getSnippetsResources(profile, excluded);
            for (const resource of snippetsResources) {
                const key = this.uriIdentityService.extUri.relativePath(profile.snippetsHome, resource);
                const content = await this.fileService.readFile(resource);
                snippets[key] = content.value.toString();
            }
            return snippets;
        }
        async getSnippetsResources(profile, excluded) {
            const snippets = [];
            let stat;
            try {
                stat = await this.fileService.resolve(profile.snippetsHome);
            }
            catch (e) {
                // No snippets
                if (e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return snippets;
                }
                else {
                    throw e;
                }
            }
            for (const { resource } of stat.children || []) {
                if (excluded?.has(resource)) {
                    continue;
                }
                const extension = this.uriIdentityService.extUri.extname(resource);
                if (extension === '.json' || extension === '.code-snippets') {
                    snippets.push(resource);
                }
            }
            return snippets;
        }
    };
    exports.SnippetsResource = SnippetsResource;
    exports.SnippetsResource = SnippetsResource = __decorate([
        __param(0, files_1.IFileService),
        __param(1, uriIdentity_1.IUriIdentityService)
    ], SnippetsResource);
    let SnippetsResourceTreeItem = class SnippetsResourceTreeItem {
        constructor(profile, instantiationService, uriIdentityService) {
            this.profile = profile;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            this.type = "snippets" /* ProfileResourceType.Snippets */;
            this.handle = this.profile.snippetsHome.toString();
            this.label = { label: (0, nls_1.localize)('snippets', "Snippets") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Collapsed;
            this.excludedSnippets = new map_1.ResourceSet();
        }
        async getChildren() {
            const snippetsResources = await this.instantiationService.createInstance(SnippetsResource).getSnippetsResources(this.profile);
            const that = this;
            return snippetsResources.map(resource => ({
                handle: resource.toString(),
                parent: that,
                resourceUri: resource,
                collapsibleState: views_1.TreeItemCollapsibleState.None,
                accessibilityInformation: {
                    label: this.uriIdentityService.extUri.basename(resource),
                },
                checkbox: that.checkbox ? {
                    get isChecked() { return !that.excludedSnippets.has(resource); },
                    set isChecked(value) {
                        if (value) {
                            that.excludedSnippets.delete(resource);
                        }
                        else {
                            that.excludedSnippets.add(resource);
                        }
                    },
                    accessibilityInformation: {
                        label: (0, nls_1.localize)('exclude', "Select Snippet {0}", this.uriIdentityService.extUri.basename(resource)),
                    }
                } : undefined,
                command: {
                    id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                    title: '',
                    arguments: [resource, undefined, undefined]
                }
            }));
        }
        async hasContent() {
            const snippetsResources = await this.instantiationService.createInstance(SnippetsResource).getSnippetsResources(this.profile);
            return snippetsResources.length > 0;
        }
        async getContent() {
            return this.instantiationService.createInstance(SnippetsResource).getContent(this.profile, this.excludedSnippets);
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.snippets;
        }
    };
    exports.SnippetsResourceTreeItem = SnippetsResourceTreeItem;
    exports.SnippetsResourceTreeItem = SnippetsResourceTreeItem = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], SnippetsResourceTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNSZXNvdXJjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci9zbmlwcGV0c1Jlc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBMkI7UUFFdkMsWUFDMkMsc0JBQStDLEVBQzFELFdBQXlCLEVBQ2xCLGtCQUF1QztZQUZuQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQzFELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2xCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7UUFFOUUsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBZTtZQUMvQixNQUFNLGVBQWUsR0FBcUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RCxLQUFLLE1BQU0sR0FBRyxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZILE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQWhCWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQUdyQyxXQUFBLHlDQUF1QixDQUFBO1FBQ3ZCLFdBQUEs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