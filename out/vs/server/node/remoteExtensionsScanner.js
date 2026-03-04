/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/uri", "vs/base/common/performance", "vs/base/common/uriIpc", "vs/platform/contextkey/common/contextkey", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/workbench/services/extensions/common/extensionsUtil", "vs/base/common/network"], function (require, exports, path_1, platform, process_1, uri_1, performance, uriIpc_1, contextkey_1, extensionsScannerService_1, extensionsUtil_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionsScannerChannel = exports.RemoteExtensionsScannerService = void 0;
    class RemoteExtensionsScannerService {
        constructor(_extensionManagementCLI, environmentService, _userDataProfilesService, _extensionsScannerService, _logService, _extensionGalleryService, _languagePackService) {
            this._extensionManagementCLI = _extensionManagementCLI;
            this._userDataProfilesService = _userDataProfilesService;
            this._extensionsScannerService = _extensionsScannerService;
            this._logService = _logService;
            this._extensionGalleryService = _extensionGalleryService;
            this._languagePackService = _languagePackService;
            this._whenBuiltinExtensionsReady = Promise.resolve();
            this._whenExtensionsReady = Promise.resolve();
            const builtinExtensionsToInstall = environmentService.args['install-builtin-extension'];
            if (builtinExtensionsToInstall) {
                _logService.trace('Installing builtin extensions passed via args...');
                const installOptions = { isMachineScoped: !!environmentService.args['do-not-sync'], installPreReleaseVersion: !!environmentService.args['pre-release'] };
                performance.mark('code/server/willInstallBuiltinExtensions');
                this._whenExtensionsReady = this._whenBuiltinExtensionsReady = _extensionManagementCLI.installExtensions([], this._asExtensionIdOrVSIX(builtinExtensionsToInstall), installOptions, !!environmentService.args['force'])
                    .then(() => {
                    performance.mark('code/server/didInstallBuiltinExtensions');
                    _logService.trace('Finished installing builtin extensions');
                }, error => {
                    _logService.error(error);
                });
            }
            const extensionsToInstall = environmentService.args['install-extension'];
            if (extensionsToInstall) {
                _logService.trace('Installing extensions passed via args...');
                this._whenExtensionsReady = this._whenBuiltinExtensionsReady
                    .then(() => _extensionManagementCLI.installExtensions(this._asExtensionIdOrVSIX(extensionsToInstall), [], {
                    isMachineScoped: !!environmentService.args['do-not-sync'],
                    installPreReleaseVersion: !!environmentService.args['pre-release'],
                    isApplicationScoped: true // extensions installed during server startup are available to all profiles
                }, !!environmentService.args['force']))
                    .then(() => {
                    _logService.trace('Finished installing extensions');
                }, error => {
                    _logService.error(error);
                });
            }
        }
        _asExtensionIdOrVSIX(inputs) {
            return inputs.map(input => /\.vsix$/i.test(input) ? uri_1.URI.file((0, path_1.isAbsolute)(input) ? input : (0, path_1.join)((0, process_1.cwd)(), input)) : input);
        }
        whenExtensionsReady() {
            return this._whenExtensionsReady;
        }
        async scanExtensions(language, profileLocation, extensionDevelopmentLocations, languagePackId) {
            performance.mark('code/server/willScanExtensions');
            this._logService.trace(`Scanning extensions using UI language: ${language}`);
            await this._whenBuiltinExtensionsReady;
            const extensionDevelopmentPaths = extensionDevelopmentLocations ? extensionDevelopmentLocations.filter(url => url.scheme === network_1.Schemas.file).map(url => url.fsPath) : undefined;
            profileLocation = profileLocation ?? this._userDataProfilesService.defaultProfile.extensionsResource;
            const extensions = await this._scanExtensions(profileLocation, language ?? platform.language, extensionDevelopmentPaths, languagePackId);
            this._logService.trace('Scanned Extensions', extensions);
            this._massageWhenConditions(extensions);
            performance.mark('code/server/didScanExtensions');
            return extensions;
        }
        async scanSingleExtension(extensionLocation, isBuiltin, language) {
            await this._whenBuiltinExtensionsReady;
            const extensionPath = extensionLocation.scheme === network_1.Schemas.file ? extensionLocation.fsPath : null;
            if (!extensionPath) {
                return null;
            }
            const extension = await this._scanSingleExtension(extensionPath, isBuiltin, language ?? platform.language);
            if (!extension) {
                return null;
            }
            this._massageWhenConditions([extension]);
            return extension;
        }
        async _scanExtensions(profileLocation, language, extensionDevelopmentPath, languagePackId) {
            await this._ensureLanguagePackIsInstalled(language, languagePackId);
            const [builtinExtensions, installedExtensions, developedExtensions] = await Promise.all([
                this._scanBuiltinExtensions(language),
                this._scanInstalledExtensions(profileLocation, language),
                this._scanDevelopedExtensions(language, extensionDevelopmentPath)
            ]);
            return (0, extensionsUtil_1.dedupExtensions)(builtinExtensions, installedExtensions, developedExtensions, this._logService);
        }
        async _scanDevelopedExtensions(language, extensionDevelopmentPaths) {
            if (extensionDevelopmentPaths) {
                return (await Promise.all(extensionDevelopmentPaths.map(extensionDevelopmentPath => this._extensionsScannerService.scanOneOrMultipleExtensions(uri_1.URI.file((0, path_1.resolve)(extensionDevelopmentPath)), 1 /* ExtensionType.User */, { language }))))
                    .flat()
                    .map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, true));
            }
            return [];
        }
        async _scanBuiltinExtensions(language) {
            const scannedExtensions = await this._extensionsScannerService.scanSystemExtensions({ language, useCache: true });
            return scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false));
        }
        async _scanInstalledExtensions(profileLocation, language) {
            const scannedExtensions = await this._extensionsScannerService.scanUserExtensions({ profileLocation, language, useCache: true });
            return scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false));
        }
        async _scanSingleExtension(extensionPath, isBuiltin, language) {
            const extensionLocation = uri_1.URI.file((0, path_1.resolve)(extensionPath));
            const type = isBuiltin ? 0 /* ExtensionType.System */ : 1 /* ExtensionType.User */;
            const scannedExtension = await this._extensionsScannerService.scanExistingExtension(extensionLocation, type, { language });
            return scannedExtension ? (0, extensionsScannerService_1.toExtensionDescription)(scannedExtension, false) : null;
        }
        async _ensureLanguagePackIsInstalled(language, languagePackId) {
            if (
            // No need to install language packs for the default language
            language === platform.LANGUAGE_DEFAULT ||
                // The extension gallery service needs to be available
                !this._extensionGalleryService.isEnabled()) {
                return;
            }
            try {
                const installed = await this._languagePackService.getInstalledLanguages();
                if (installed.find(p => p.id === language)) {
                    this._logService.trace(`Language Pack ${language} is already installed. Skipping language pack installation.`);
                    return;
                }
            }
            catch (err) {
                // We tried to see what is installed but failed. We can try installing anyway.
                this._logService.error(err);
            }
            if (!languagePackId) {
                this._logService.trace(`No language pack id provided for language ${language}. Skipping language pack installation.`);
                return;
            }
            this._logService.trace(`Language Pack ${languagePackId} for language ${language} is not installed. It will be installed now.`);
            try {
                await this._extensionManagementCLI.installExtensions([languagePackId], [], { isMachineScoped: true }, true);
            }
            catch (err) {
                // We tried to install the language pack but failed. We can continue without it thus using the default language.
                this._logService.error(err);
            }
        }
        _massageWhenConditions(extensions) {
            // Massage "when" conditions which mention `resourceScheme`
            const _mapResourceSchemeValue = (value, isRegex) => {
                // console.log(`_mapResourceSchemeValue: ${value}, ${isRegex}`);
                return value.replace(/file/g, 'vscode-remote');
            };
            const _mapResourceRegExpValue = (value) => {
                let flags = '';
                flags += value.global ? 'g' : '';
                flags += value.ignoreCase ? 'i' : '';
                flags += value.multiline ? 'm' : '';
                return new RegExp(_mapResourceSchemeValue(value.source, true), flags);
            };
            const _exprKeyMapper = new class {
                mapDefined(key) {
                    return contextkey_1.ContextKeyDefinedExpr.create(key);
                }
                mapNot(key) {
                    return contextkey_1.ContextKeyNotExpr.create(key);
                }
                mapEquals(key, value) {
                    if (key === 'resourceScheme' && typeof value === 'string') {
                        return contextkey_1.ContextKeyEqualsExpr.create(key, _mapResourceSchemeValue(value, false));
                    }
                    else {
                        return contextkey_1.ContextKeyEqualsExpr.create(key, value);
                    }
                }
                mapNotEquals(key, value) {
                    if (key === 'resourceScheme' && typeof value === 'string') {
                        return contextkey_1.ContextKeyNotEqualsExpr.create(key, _mapResourceSchemeValue(value, false));
                    }
                    else {
                        return contextkey_1.ContextKeyNotEqualsExpr.create(key, value);
                    }
                }
                mapGreater(key, value) {
                    return contextkey_1.ContextKeyGreaterExpr.create(key, value);
                }
                mapGreaterEquals(key, value) {
                    return contextkey_1.ContextKeyGreaterEqualsExpr.create(key, value);
                }
                mapSmaller(key, value) {
                    return contextkey_1.ContextKeySmallerExpr.create(key, value);
                }
                mapSmallerEquals(key, value) {
                    return contextkey_1.ContextKeySmallerEqualsExpr.create(key, value);
                }
                mapRegex(key, regexp) {
                    if (key === 'resourceScheme' && regexp) {
                        return contextkey_1.ContextKeyRegexExpr.create(key, _mapResourceRegExpValue(regexp));
                    }
                    else {
                        return contextkey_1.ContextKeyRegexExpr.create(key, regexp);
                    }
                }
                mapIn(key, valueKey) {
                    return contextkey_1.ContextKeyInExpr.create(key, valueKey);
                }
                mapNotIn(key, valueKey) {
                    return contextkey_1.ContextKeyNotInExpr.create(key, valueKey);
                }
            };
            const _massageWhenUser = (element) => {
                if (!element || !element.when || !/resourceScheme/.test(element.when)) {
                    return;
                }
                const expr = contextkey_1.ContextKeyExpr.deserialize(element.when);
                if (!expr) {
                    return;
                }
                const massaged = expr.map(_exprKeyMapper);
                element.when = massaged.serialize();
            };
            const _massageWhenUserArr = (elements) => {
                if (Array.isArray(elements)) {
                    for (const element of elements) {
                        _massageWhenUser(element);
                    }
                }
                else {
                    _massageWhenUser(elements);
                }
            };
            const _massageLocWhenUser = (target) => {
                for (const loc in target) {
                    _massageWhenUserArr(target[loc]);
                }
            };
            extensions.forEach((extension) => {
                if (extension.contributes) {
                    if (extension.contributes.menus) {
                        _massageLocWhenUser(extension.contributes.menus);
                    }
                    if (extension.contributes.keybindings) {
                        _massageWhenUserArr(extension.contributes.keybindings);
                    }
                    if (extension.contributes.views) {
                        _massageLocWhenUser(extension.contributes.views);
                    }
                }
            });
        }
    }
    exports.RemoteExtensionsScannerService = RemoteExtensionsScannerService;
    class RemoteExtensionsScannerChannel {
        constructor(service, getUriTransformer) {
            this.service = service;
            this.getUriTransformer = getUriTransformer;
        }
        listen(context, event) {
            throw new Error('Invalid listen');
        }
        async call(context, command, args) {
            const uriTransformer = this.getUriTransformer(context);
            switch (command) {
                case 'whenExtensionsReady': return this.service.whenExtensionsReady();
                case 'scanExtensions': {
                    const language = args[0];
                    const profileLocation = args[1] ? uri_1.URI.revive(uriTransformer.transformIncoming(args[1])) : undefined;
                    const extensionDevelopmentPath = Array.isArray(args[2]) ? args[2].map(u => uri_1.URI.revive(uriTransformer.transformIncoming(u))) : undefined;
                    const languagePackId = args[3];
                    const extensions = await this.service.scanExtensions(language, profileLocation, extensionDevelopmentPath, languagePackId);
                    return extensions.map(extension => (0, uriIpc_1.transformOutgoingURIs)(extension, uriTransformer));
                }
                case 'scanSingleExtension': {
                    const extension = await this.service.scanSingleExtension(uri_1.URI.revive(uriTransformer.transformIncoming(args[0])), args[1], args[2]);
                    return extension ? (0, uriIpc_1.transformOutgoingURIs)(extension, uriTransformer) : null;
                }
            }
            throw new Error('Invalid call');
        }
    }
    exports.RemoteExtensionsScannerChannel = RemoteExtensionsScannerChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uc1NjYW5uZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9yZW1vdGVFeHRlbnNpb25zU2Nhbm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQWEsOEJBQThCO1FBTzFDLFlBQ2tCLHVCQUErQyxFQUNoRSxrQkFBNkMsRUFDNUIsd0JBQWtELEVBQ2xELHlCQUFvRCxFQUNwRCxXQUF3QixFQUN4Qix3QkFBa0QsRUFDbEQsb0JBQTBDO1lBTjFDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBd0I7WUFFL0MsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUNsRCw4QkFBeUIsR0FBekIseUJBQXlCLENBQTJCO1lBQ3BELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ3hCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDbEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQVYzQyxnQ0FBMkIsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEQseUJBQW9CLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBV3pELE1BQU0sMEJBQTBCLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDeEYsSUFBSSwwQkFBMEIsRUFBRSxDQUFDO2dCQUNoQyxXQUFXLENBQUMsS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7Z0JBQ3RFLE1BQU0sY0FBYyxHQUFtQixFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFDekss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