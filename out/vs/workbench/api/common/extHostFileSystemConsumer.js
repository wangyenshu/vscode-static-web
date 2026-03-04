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
define(["require", "exports", "./extHost.protocol", "vs/platform/files/common/files", "vs/workbench/api/common/extHostTypes", "vs/base/common/buffer", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostFileSystemInfo", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/network"], function (require, exports, extHost_protocol_1, files, extHostTypes_1, buffer_1, instantiation_1, extHostRpcService_1, extHostFileSystemInfo_1, lifecycle_1, async_1, resources_1, network_1) {
    "use strict";
    var ExtHostConsumerFileSystem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostConsumerFileSystem = exports.ExtHostConsumerFileSystem = void 0;
    let ExtHostConsumerFileSystem = ExtHostConsumerFileSystem_1 = class ExtHostConsumerFileSystem {
        constructor(extHostRpc, fileSystemInfo) {
            this._fileSystemProvider = new Map();
            this._writeQueue = new async_1.ResourceQueue();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadFileSystem);
            const that = this;
            this.value = Object.freeze({
                async stat(uri) {
                    try {
                        let stat;
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            stat = await provider.impl.stat(uri);
                        }
                        else {
                            stat = await that._proxy.$stat(uri);
                        }
                        return {
                            type: stat.type,
                            ctime: stat.ctime,
                            mtime: stat.mtime,
                            size: stat.size,
                            permissions: stat.permissions === files.FilePermission.Readonly ? 1 : undefined
                        };
                    }
                    catch (err) {
                        ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async readDirectory(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return (await provider.impl.readDirectory(uri)).slice(); // safe-copy
                        }
                        else {
                            return await that._proxy.$readdir(uri);
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async createDirectory(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider && !provider.isReadonly) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return await that.mkdirp(provider.impl, provider.extUri, uri);
                        }
                        else {
                            return await that._proxy.$mkdir(uri);
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async readFile(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return (await provider.impl.readFile(uri)).slice(); // safe-copy
                        }
                        else {
                            const buff = await that._proxy.$readFile(uri);
                            return buff.buffer;
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async writeFile(uri, content) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider && !provider.isReadonly) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            await that.mkdirp(provider.impl, provider.extUri, provider.extUri.dirname(uri));
                            return await that._writeQueue.queueFor(uri, () => Promise.resolve(provider.impl.writeFile(uri, content, { create: true, overwrite: true })));
                        }
                        else {
                            return await that._proxy.$writeFile(uri, buffer_1.VSBuffer.wrap(content));
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async delete(uri, options) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider && !provider.isReadonly && !options?.useTrash /* no shortcut: use trash */) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return await provider.impl.delete(uri, { recursive: false, ...options });
                        }
                        else {
                            return await that._proxy.$delete(uri, { recursive: false, useTrash: false, atomic: false, ...options });
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async rename(oldUri, newUri, options) {
                    try {
                        // no shortcut: potentially involves different schemes, does mkdirp
                        return await that._proxy.$rename(oldUri, newUri, { ...{ overwrite: false }, ...options });
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async copy(source, destination, options) {
                    try {
                        // no shortcut: potentially involves different schemes, does mkdirp
                        return await that._proxy.$copy(source, destination, { ...{ overwrite: false }, ...options });
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                isWritableFileSystem(scheme) {
                    const capabilities = fileSystemInfo.getCapabilities(scheme);
                    if (typeof capabilities === 'number') {
                        return !(capabilities & 2048 /* files.FileSystemProviderCapabilities.Readonly */);
                    }
                    return undefined;
                }
            });
        }
        async mkdirp(provider, providerExtUri, directory) {
            const directoriesToCreate = [];
            while (!providerExtUri.isEqual(directory, providerExtUri.dirname(directory))) {
                try {
                    const stat = await provider.stat(directory);
                    if ((stat.type & files.FileType.Directory) === 0) {
                        throw extHostTypes_1.FileSystemError.FileExists(`Unable to create folder '${directory.scheme === network_1.Schemas.file ? directory.fsPath : directory.toString(true)}' that already exists but is not a directory`);
                    }
                    break; // we have hit a directory that exists -> good
                }
                catch (error) {
                    if (files.toFileSystemProviderErrorCode(error) !== files.FileSystemProviderErrorCode.FileNotFound) {
                        throw error;
                    }
                    // further go up and remember to create this directory
                    directoriesToCreate.push(providerExtUri.basename(directory));
                    directory = providerExtUri.dirname(directory);
                }
            }
            for (let i = directoriesToCreate.length - 1; i >= 0; i--) {
                directory = providerExtUri.joinPath(directory, directoriesToCreate[i]);
                try {
                    await provider.createDirectory(directory);
                }
                catch (error) {
                    if (files.toFileSystemProviderErrorCode(error) !== files.FileSystemProviderErrorCode.FileExists) {
                        // For mkdirp() we tolerate that the mkdir() call fails
                        // in case the folder already exists. This follows node.js
                        // own implementation of fs.mkdir({ recursive: true }) and
                        // reduces the chances of race conditions leading to errors
                        // if multiple calls try to create the same folders
                        // As such, we only throw an error here if it is other than
                        // the fact that the file already exists.
                        // (see also https://github.com/microsoft/vscode/issues/89834)
                        throw error;
                    }
                }
            }
        }
        static _handleError(err) {
            // desired error type
            if (err instanceof extHostTypes_1.FileSystemError) {
                throw err;
            }
            // file system provider error
            if (err instanceof files.FileSystemProviderError) {
                switch (err.code) {
                    case files.FileSystemProviderErrorCode.FileExists: throw extHostTypes_1.FileSystemError.FileExists(err.message);
                    case files.FileSystemProviderErrorCode.FileNotFound: throw extHostTypes_1.FileSystemError.FileNotFound(err.message);
                    case files.FileSystemProviderErrorCode.FileNotADirectory: throw extHostTypes_1.FileSystemError.FileNotADirectory(err.message);
                    case files.FileSystemProviderErrorCode.FileIsADirectory: throw extHostTypes_1.FileSystemError.FileIsADirectory(err.message);
                    case files.FileSystemProviderErrorCode.NoPermissions: throw extHostTypes_1.FileSystemError.NoPermissions(err.message);
                    case files.FileSystemProviderErrorCode.Unavailable: throw extHostTypes_1.FileSystemError.Unavailable(err.message);
                    default: throw new extHostTypes_1.FileSystemError(err.message, err.name);
                }
            }
            // generic error
            if (!(err instanceof Error)) {
                throw new extHostTypes_1.FileSystemError(String(err));
            }
            // no provider (unknown scheme) error
            if (err.name === 'ENOPRO' || err.message.includes('ENOPRO')) {
                throw extHostTypes_1.FileSystemError.Unavailable(err.message);
            }
            // file system error
            switch (err.name) {
                case files.FileSystemProviderErrorCode.FileExists: throw extHostTypes_1.FileSystemError.FileExists(err.message);
                case files.FileSystemProviderErrorCode.FileNotFound: throw extHostTypes_1.FileSystemError.FileNotFound(err.message);
                case files.FileSystemProviderErrorCode.FileNotADirectory: throw extHostTypes_1.FileSystemError.FileNotADirectory(err.message);
                case files.FileSystemProviderErrorCode.FileIsADirectory: throw extHostTypes_1.FileSystemError.FileIsADirectory(err.message);
                case files.FileSystemProviderErrorCode.NoPermissions: throw extHostTypes_1.FileSystemError.NoPermissions(err.message);
                case files.FileSystemProviderErrorCode.Unavailable: throw extHostTypes_1.FileSystemError.Unavailable(err.message);
                default: throw new extHostTypes_1.FileSystemError(err.message, err.name);
            }
        }
        // ---
        addFileSystemProvider(scheme, provider, options) {
            this._fileSystemProvider.set(scheme, { impl: provider, extUri: options?.isCaseSensitive ? resources_1.extUri : resources_1.extUriIgnorePathCase, isReadonly: !!options?.isReadonly });
            return (0, lifecycle_1.toDisposable)(() => this._fileSystemProvider.delete(scheme));
        }
        getFileSystemProviderExtUri(scheme) {
            return this._fileSystemProvider.get(scheme)?.extUri ?? resources_1.extUri;
        }
    };
    exports.ExtHostConsumerFileSystem = ExtHostConsumerFileSystem;
    exports.ExtHostConsumerFileSystem = ExtHostConsumerFileSystem = ExtHostConsumerFileSystem_1 = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostFileSystemInfo_1.IExtHostFileSystemInfo)
    ], ExtHostConsumerFileSystem);
    exports.IExtHostConsumerFileSystem = (0, instantiation_1.createDecorator)('IExtHostConsumerFileSystem');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEZpbGVTeXN0ZW1Db25zdW1lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RGaWxlU3lzdGVtQ29uc3VtZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSx5QkFBeUIsaUNBQS9CLE1BQU0seUJBQXlCO1FBV3JDLFlBQ3FCLFVBQThCLEVBQzFCLGNBQXNDO1lBTjlDLHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUFxRixDQUFDO1lBRW5ILGdCQUFXLEdBQUcsSUFBSSxxQkFBYSxFQUFFLENBQUM7WUFNbEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNwRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFFbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUMxQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQWU7b0JBQ3pCLElBQUksQ0FBQzt3QkFDSixJQUFJLElBQUksQ0FBQzt3QkFFVCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDMUQsSUFBSSxRQUFRLEVBQUUsQ0FBQzs0QkFDZCxlQUFlOzRCQUNmLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBQ2hELElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUN0QyxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsSUFBSSxHQUFH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