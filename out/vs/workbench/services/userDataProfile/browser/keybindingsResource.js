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
define(["require", "exports", "vs/base/common/buffer", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/platform", "vs/workbench/common/views", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, buffer_1, files_1, log_1, userDataProfile_1, platform_1, views_1, editorCommands_1, instantiation_1, nls_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsResourceTreeItem = exports.KeybindingsResource = exports.KeybindingsResourceInitializer = void 0;
    let KeybindingsResourceInitializer = class KeybindingsResourceInitializer {
        constructor(userDataProfileService, fileService, logService) {
            this.userDataProfileService = userDataProfileService;
            this.fileService = fileService;
            this.logService = logService;
        }
        async initialize(content) {
            const keybindingsContent = JSON.parse(content);
            if (keybindingsContent.keybindings === null) {
                this.logService.info(`Initializing Profile: No keybindings to apply...`);
                return;
            }
            await this.fileService.writeFile(this.userDataProfileService.currentProfile.keybindingsResource, buffer_1.VSBuffer.fromString(keybindingsContent.keybindings));
        }
    };
    exports.KeybindingsResourceInitializer = KeybindingsResourceInitializer;
    exports.KeybindingsResourceInitializer = KeybindingsResourceInitializer = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], KeybindingsResourceInitializer);
    let KeybindingsResource = class KeybindingsResource {
        constructor(fileService, logService) {
            this.fileService = fileService;
            this.logService = logService;
        }
        async getContent(profile) {
            const keybindingsContent = await this.getKeybindingsResourceContent(profile);
            return JSON.stringify(keybindingsContent);
        }
        async getKeybindingsResourceContent(profile) {
            const keybindings = await this.getKeybindingsContent(profile);
            return { keybindings, platform: platform_1.platform };
        }
        async apply(content, profile) {
            const keybindingsContent = JSON.parse(content);
            if (keybindingsContent.keybindings === null) {
                this.logService.info(`Importing Profile (${profile.name}): No keybindings to apply...`);
                return;
            }
            await this.fileService.writeFile(profile.keybindingsResource, buffer_1.VSBuffer.fromString(keybindingsContent.keybindings));
        }
        async getKeybindingsContent(profile) {
            try {
                const content = await this.fileService.readFile(profile.keybindingsResource);
                return content.value.toString();
            }
            catch (error) {
                // File not found
                if (error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return null;
                }
                else {
                    throw error;
                }
            }
        }
    };
    exports.KeybindingsResource = KeybindingsResource;
    exports.KeybindingsResource = KeybindingsResource = __decorate([
        __param(0, files_1.IFileService),
        __param(1, log_1.ILogService)
    ], KeybindingsResource);
    let KeybindingsResourceTreeItem = class KeybindingsResourceTreeItem {
        constructor(profile, uriIdentityService, instantiationService) {
            this.profile = profile;
            this.uriIdentityService = uriIdentityService;
            this.instantiationService = instantiationService;
            this.type = "keybindings" /* ProfileResourceType.Keybindings */;
            this.handle = "keybindings" /* ProfileResourceType.Keybindings */;
            this.label = { label: (0, nls_1.localize)('keybindings', "Keyboard Shortcuts") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.keybindings;
        }
        async getChildren() {
            return [{
                    handle: this.profile.keybindingsResource.toString(),
                    resourceUri: this.profile.keybindingsResource,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    parent: this,
                    accessibilityInformation: {
                        label: this.uriIdentityService.extUri.basename(this.profile.settingsResource)
                    },
                    command: {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [this.profile.keybindingsResource, undefined, undefined]
                    }
                }];
        }
        async hasContent() {
            const keybindingsContent = await this.instantiationService.createInstance(KeybindingsResource).getKeybindingsResourceContent(this.profile);
            return keybindingsContent.keybindings !== null;
        }
        async getContent() {
            return this.instantiationService.createInstance(KeybindingsResource).getContent(this.profile);
        }
    };
    exports.KeybindingsResourceTreeItem = KeybindingsResourceTreeItem;
    exports.KeybindingsResourceTreeItem = KeybindingsResourceTreeItem = __decorate([
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, instantiation_1.IInstantiationService)
    ], KeybindingsResourceTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NSZXNvdXJjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy91c2VyRGF0YVByb2ZpbGUvYnJvd3Nlci9rZXliaW5kaW5nc1Jlc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBOEI7UUFFMUMsWUFDMkMsc0JBQStDLEVBQzFELFdBQXlCLEVBQzFCLFVBQXVCO1lBRlgsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUMxRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUMxQixlQUFVLEdBQVYsVUFBVSxDQUFhO1FBRXRELENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQWU7WUFDL0IsTUFBTSxrQkFBa0IsR0FBZ0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1RSxJQUFJLGtCQUFrQixDQUFDLFdBQVcsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsa0RBQWtELENBQUMsQ0FBQztnQkFDekUsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN2SixDQUFDO0tBQ0QsQ0FBQTtJQWpCWSx3RUFBOEI7NkNBQTlCLDhCQUE4QjtRQUd4QyxXQUFBLHlDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtPQUxELDhC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