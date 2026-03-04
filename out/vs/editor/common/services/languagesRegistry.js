/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/services/languagesAssociations", "vs/editor/common/languages/modesRegistry", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, event_1, lifecycle_1, strings_1, languagesAssociations_1, modesRegistry_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagesRegistry = exports.LanguageIdCodec = void 0;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const NULL_LANGUAGE_ID = 'vs.editor.nullLanguage';
    class LanguageIdCodec {
        constructor() {
            this._languageIdToLanguage = [];
            this._languageToLanguageId = new Map();
            this._register(NULL_LANGUAGE_ID, 0 /* LanguageId.Null */);
            this._register(modesRegistry_1.PLAINTEXT_LANGUAGE_ID, 1 /* LanguageId.PlainText */);
            this._nextLanguageId = 2;
        }
        _register(language, languageId) {
            this._languageIdToLanguage[languageId] = language;
            this._languageToLanguageId.set(language, languageId);
        }
        register(language) {
            if (this._languageToLanguageId.has(language)) {
                return;
            }
            const languageId = this._nextLanguageId++;
            this._register(language, languageId);
        }
        encodeLanguageId(languageId) {
            return this._languageToLanguageId.get(languageId) || 0 /* LanguageId.Null */;
        }
        decodeLanguageId(languageId) {
            return this._languageIdToLanguage[languageId] || NULL_LANGUAGE_ID;
        }
    }
    exports.LanguageIdCodec = LanguageIdCodec;
    class LanguagesRegistry extends lifecycle_1.Disposable {
        static { this.instanceCount = 0; }
        constructor(useModesRegistry = true, warnOnOverwrite = false) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            LanguagesRegistry.instanceCount++;
            this._warnOnOverwrite = warnOnOverwrite;
            this.languageIdCodec = new LanguageIdCodec();
            this._dynamicLanguages = [];
            this._languages = {};
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            if (useModesRegistry) {
                this._initializeFromRegistry();
                this._register(modesRegistry_1.ModesRegistry.onDidChangeLanguages((m) => {
                    this._initializeFromRegistry();
                }));
            }
        }
        dispose() {
            LanguagesRegistry.instanceCount--;
            super.dispose();
        }
        setDynamicLanguages(def) {
            this._dynamicLanguages = def;
            this._initializeFromRegistry();
        }
        _initializeFromRegistry() {
            this._languages = {};
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            (0, languagesAssociations_1.clearPlatformLanguageAssociations)();
            const desc = [].concat(modesRegistry_1.ModesRegistry.getLanguages()).concat(this._dynamicLanguages);
            this._registerLanguages(desc);
        }
        registerLanguage(desc) {
            return modesRegistry_1.ModesRegistry.registerLanguage(desc);
        }
        _registerLanguages(desc) {
            for (const d of desc) {
                this._registerLanguage(d);
            }
            // Rebuild fast path maps
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            Object.keys(this._languages).forEach((langId) => {
                const language = this._languages[langId];
                if (language.name) {
                    this._nameMap[language.name] = language.identifier;
                }
                language.aliases.forEach((alias) => {
                    this._lowercaseNameMap[alias.toLowerCase()] = language.identifier;
                });
                language.mimetypes.forEach((mimetype) => {
                    this._mimeTypesMap[mimetype] = language.identifier;
                });
            });
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerOverrideIdentifiers(this.getRegisteredLanguageIds());
            this._onDidChange.fire();
        }
        _registerLanguage(lang) {
            const langId = lang.id;
            let resolvedLanguage;
            if (hasOwnProperty.call(this._languages, langId)) {
                resolvedLanguage = this._languages[langId];
            }
            else {
                this.languageIdCodec.register(langId);
                resolvedLanguage = {
                    identifier: langId,
                    name: null,
                    mimetypes: [],
                    aliases: [],
                    extensions: [],
                    filenames: [],
                    configurationFiles: [],
                    icons: []
                };
                this._languages[langId] = resolvedLanguage;
            }
            this._mergeLanguage(resolvedLanguage, lang);
        }
        _mergeLanguage(resolvedLanguage, lang) {
            const langId = lang.id;
            let primaryMime = null;
            if (Array.isArray(lang.mimetypes) && lang.mimetypes.length > 0) {
                resolvedLanguage.mimetypes.push(...lang.mimetypes);
                primaryMime = lang.mimetypes[0];
            }
            if (!primaryMime) {
                primaryMime = `text/x-${langId}`;
                resolvedLanguage.mimetypes.push(primaryMime);
            }
            if (Array.isArray(lang.extensions)) {
                if (lang.configuration) {
                    // insert first as this appears to be the 'primary' language definition
                    resolvedLanguage.extensions = lang.extensions.concat(resolvedLanguage.extensions);
                }
                else {
                    resolvedLanguage.extensions = resolvedLanguage.extensions.concat(lang.extensions);
                }
                for (const extension of lang.extensions) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, extension: extension }, this._warnOnOverwrite);
                }
            }
            if (Array.isArray(lang.filenames)) {
                for (const filename of lang.filenames) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, filename: filename }, this._warnOnOverwrite);
                    resolvedLanguage.filenames.push(filename);
                }
            }
            if (Array.isArray(lang.filenamePatterns)) {
                for (const filenamePattern of lang.filenamePatterns) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, filepattern: filenamePattern }, this._warnOnOverwrite);
                }
            }
            if (typeof lang.firstLine === 'string' && lang.firstLine.length > 0) {
                let firstLineRegexStr = lang.firstLine;
                if (firstLineRegexStr.charAt(0) !== '^') {
                    firstLineRegexStr = '^' + firstLineRegexStr;
                }
                try {
                    const firstLineRegex = new RegExp(firstLineRegexStr);
                    if (!(0, strings_1.regExpLeadsToEndlessLoop)(firstLineRegex)) {
                        (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, firstline: firstLineRegex }, this._warnOnOverwrite);
                    }
                }
                catch (err) {
                    // Most likely, the regex was bad
                    console.warn(`[${lang.id}]: Invalid regular expression \`${firstLineRegexStr}\`: `, err);
                }
            }
            resolvedLanguage.aliases.push(langId);
            let langAliases = null;
            if (typeof lang.aliases !== 'undefined' && Array.isArray(lang.aliases)) {
                if (lang.aliases.length === 0) {
                    // signal that this language should not get a name
                    langAliases = [null];
                }
                else {
                    langAliases = lang.aliases;
                }
            }
            if (langAliases !== null) {
                for (const langAlias of langAliases) {
                    if (!langAlias || langAlias.length === 0) {
                        continue;
                    }
                    resolvedLanguage.aliases.push(langAlias);
                }
            }
            const containsAliases = (langAliases !== null && langAliases.length > 0);
            if (containsAliases && langAliases[0] === null) {
                // signal that this language should not get a name
            }
            else {
                const bestName = (containsAliases ? langAliases[0] : null) || langId;
                if (containsAliases || !resolvedLanguage.name) {
                    resolvedLanguage.name = bestName;
                }
            }
            if (lang.configuration) {
                resolvedLanguage.configurationFiles.push(lang.configuration);
            }
            if (lang.icon) {
                resolvedLanguage.icons.push(lang.icon);
            }
        }
        isRegisteredLanguageId(languageId) {
            if (!languageId) {
                return false;
            }
            return hasOwnProperty.call(this._languages, languageId);
        }
        getRegisteredLanguageIds() {
            return Object.keys(this._languages);
        }
        getSortedRegisteredLanguageNames() {
            const result = [];
            for (const languageName in this._nameMap) {
                if (hasOwnProperty.call(this._nameMap, languageName)) {
                    result.push({
                        languageName: languageName,
                        languageId: this._nameMap[languageName]
                    });
                }
            }
            result.sort((a, b) => (0, strings_1.compareIgnoreCase)(a.languageName, b.languageName));
            return result;
        }
        getLanguageName(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            return this._languages[languageId].name;
        }
        getMimeType(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            const language = this._languages[languageId];
            return (language.mimetypes[0] || null);
        }
        getExtensions(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].extensions;
        }
        getFilenames(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].filenames;
        }
        getIcon(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            const language = this._languages[languageId];
            return (language.icons[0] || null);
        }
        getConfigurationFiles(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].configurationFiles || [];
        }
        getLanguageIdByLanguageName(languageName) {
            const languageNameLower = languageName.toLowerCase();
            if (!hasOwnProperty.call(this._lowercaseNameMap, languageNameLower)) {
                return null;
            }
            return this._lowercaseNameMap[languageNameLower];
        }
        getLanguageIdByMimeType(mimeType) {
            if (!mimeType) {
                return null;
            }
            if (hasOwnProperty.call(this._mimeTypesMap, mimeType)) {
                return this._mimeTypesMap[mimeType];
            }
            return null;
        }
        guessLanguageIdByFilepathOrFirstLine(resource, firstLine) {
            if (!resource && !firstLine) {
                return [];
            }
            return (0, languagesAssociations_1.getLanguageIds)(resource, firstLine);
        }
    }
    exports.LanguagesRegistry = LanguagesRegistry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VzUmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL2xhbmd1YWdlc1JlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUN2RCxNQUFNLGdCQUFnQixHQUFHLHdCQUF3QixDQUFDO0lBYWxELE1BQWEsZUFBZTtRQU0zQjtZQUhpQiwwQkFBcUIsR0FBYSxFQUFFLENBQUM7WUFDckMsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFHbEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsMEJBQWtCLENBQUM7WUFDbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQ0FBcUIsK0JBQXVCLENBQUM7WUFDNUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVPLFNBQVMsQ0FBQyxRQUFnQixFQUFFLFVBQXNCO1lBQ3pELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsR0FBRyxRQUFRLENBQUM7WUFDbEQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVNLFFBQVEsQ0FBQyxRQUFnQjtZQUMvQixJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVNLGdCQUFnQixDQUFDLFVBQWtCO1lBQ3pDLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsMkJBQW1CLENBQUM7UUFDdEUsQ0FBQztRQUVNLGdCQUFnQixDQUFDLFVBQXNCO1lBQzdDLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO1FBQ25FLENBQUM7S0FDRDtJQWhDRCwwQ0FnQ0M7SUFFRCxNQUFhLGlCQUFrQixTQUFRLHNCQUFVO2lCQUV6QyxrQkFBYSxHQUFHLENBQUMsQUFBSixDQUFLO1FBYXpCLFlBQVksZ0JBQWdCLEdBQUcsSUFBSSxFQUFFLGVBQWUsR0FBRyxLQUFLO1lBQzNELEtBQUssRUFBRSxDQUFDO1lBWlEsaUJBQVksR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDbkUsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFZbEUsaUJBQWlCLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFbEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDO1lBRTVCLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsNkJBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO29CQUN2RCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO1FBRVEsT0FBTztZQUNmLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ2xDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRU0sbUJBQW1CLENBQUMsR0FBOEI7WUFDeEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQztZQUM3QixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRU8sdUJBQXVCO1lBQzlCLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7WUFFNUIsSUFBQSx5REFBaUMsR0FBRSxDQUFDO1lBQ3BDLE1BQU0sSUFBSSxHQUErQixFQUFHLENBQUMsTUFBTSxDQUFDLDZCQUFhLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDakgsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxJQUE2QjtZQUM3QyxPQUFPLDZCQUFhLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVELGtCQUFrQixDQUFDLElBQStCO1lBRWpELEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixDQUFDO1lBRUQseUJBQXlCO1lBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7WUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQy9DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3pDLElBQUksUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNuQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO2dCQUNwRCxDQUFDO2dCQUNELFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7b0JBQ2xDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO2dCQUNuRSxDQUFDLENBQUMsQ0FBQztnQkFDSCxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO29CQUN2QyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7Z0JBQ3BELENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBRTNILElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQixDQUFDLElBQTZCO1lBQ3RELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7WUFFdkIsSUFBSSxnQkFBbUMsQ0FBQztZQUN4QyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNsRCxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEMsZ0JBQWdCLEdBQUc7b0JBQ2xCLFVBQVUsRUFBRSxNQUFNO29CQUNsQixJQUFJLEVBQUUsSUFBSTtvQkFDVixTQUFTLEVBQUUsRUFBRTtvQkFDYixPQUFPLEVBQUUsRUFBRTtvQkFDWCxVQUFVLEVBQUUsRUFBRTtvQkFDZCxTQUFTLEVBQUUsRUFBRTtvQkFDYixrQkFBa0IsRUFBRSxFQUFFO29CQUN0QixLQUFLLEVBQUUsRUFBRTtpQkFDVCxDQUFDO2dCQUNGLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsZ0JBQWdCLENBQUM7WUFDNUMsQ0FBQztZQUVELElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVPLGNBQWMsQ0FBQyxnQkFBbUMsRUFBRSxJQUE2QjtZQUN4RixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBRXZCLElBQUksV0FBVyxHQUFrQixJQUFJLENBQUM7WUFFdEMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEUsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbkQsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsV0FBVyxHQUFHLFVBQVUsTUFBTSxFQUFFLENBQUM7Z0JBQ2pDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3hCLHVFQUF1RTtvQkFDdkUsZ0JBQWdCLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNuRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsZ0JBQWdCLENBQUMsVUFBVSxHQUFHLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNuRixDQUFDO2dCQUNELEtBQUssTUFBTSxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUN6QyxJQUFBLDJEQUFtQyxFQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDckgsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUN2QyxJQUFBLDJEQUFtQyxFQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDbEgsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0MsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDMUMsS0FBSyxNQUFNLGVBQWUsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDckQsSUFBQSwyREFBbUMsRUFBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQzdILENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxPQUFPLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyRSxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3ZDLElBQUksaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO29CQUN6QyxpQkFBaUIsR0FBRyxHQUFHLEdBQUcsaUJBQWlCLENBQUM7Z0JBQzdDLENBQUM7Z0JBQ0QsSUFBSSxDQUFDO29CQUNKLE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBQ3JELElBQUksQ0FBQyxJQUFBLGtDQUF3QixFQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7d0JBQy9DLElBQUEsMkRBQW1DLEVBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUMxSCxDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxpQ0FBaUM7b0JBQ2pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxtQ0FBbUMsaUJBQWlCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDMUYsQ0FBQztZQUNGLENBQUM7WUFFRCxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXRDLElBQUksV0FBVyxHQUFnQyxJQUFJLENBQUM7WUFDcEQsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssV0FBVyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3hFLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQy9CLGtEQUFrRDtvQkFDbEQsV0FBVyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDMUIsS0FBSyxNQUFNLFNBQVMsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUMxQyxTQUFTO29CQUNWLENBQUM7b0JBQ0QsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDMUMsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLGVBQWUsR0FBRyxDQUFDLFdBQVcsS0FBSyxJQUFJLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6RSxJQUFJLGVBQWUsSUFBSSxXQUFZLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ2pELGtEQUFrRDtZQUNuRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxRQUFRLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFdBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDO2dCQUN0RSxJQUFJLGVBQWUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUMvQyxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO2dCQUNsQyxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZixnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QyxDQUFDO1FBQ0YsQ0FBQztRQUVNLHNCQUFzQixDQUFDLFVBQXFDO1lBQ2xFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVNLHdCQUF3QjtZQUM5QixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFTSxnQ0FBZ0M7WUFDdEMsTUFBTSxNQUFNLEdBQTBCLEVBQUUsQ0FBQztZQUN6QyxLQUFLLE1BQU0sWUFBWSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLEVBQUUsQ0FBQztvQkFDdEQsTUFBTSxDQUFDLElBQUksQ0FBQzt3QkFDWCxZQUFZLEVBQUUsWUFBWTt3QkFDMUIsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO3FCQUN2QyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUM7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBQSwyQkFBaUIsRUFBQyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVNLGVBQWUsQ0FBQyxVQUFrQjtZQUN4QyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDekMsQ0FBQztRQUVNLFdBQVcsQ0FBQyxVQUFrQjtZQUNwQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0MsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVNLGFBQWEsQ0FBQyxVQUFrQjtZQUN0QyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFDL0MsQ0FBQztRQUVNLFlBQVksQ0FBQyxVQUFrQjtZQUNyQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDOUMsQ0FBQztRQUVNLE9BQU8sQ0FBQyxVQUFrQjtZQUNoQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0MsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVNLHFCQUFxQixDQUFDLFVBQWtCO1lBQzlDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDdkQsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsQ0FBQztRQUM3RCxDQUFDO1FBRU0sMkJBQTJCLENBQUMsWUFBb0I7WUFDdEQsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztnQkFDckUsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRU0sdUJBQXVCLENBQUMsUUFBbUM7WUFDakUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU0sb0NBQW9DLENBQUMsUUFBb0IsRUFBRSxTQUFrQjtZQUNuRixJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE9BQU8sSUFBQSxzQ0FBYyxFQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM1QyxDQUFDOztJQTVTRiw4Q0E2U0MifQ==