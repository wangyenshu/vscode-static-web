/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/json", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/jsonErrorMessages", "vs/base/browser/dom", "vs/base/browser/window"], function (require, exports, nls, paths, resources, Json, workbenchThemeService_1, jsonErrorMessages_1, dom_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileIconThemeLoader = exports.FileIconThemeData = void 0;
    class FileIconThemeData {
        static { this.STORAGE_KEY = 'iconThemeData'; }
        constructor(id, label, settingsId) {
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
            this.hasFileIcons = false;
            this.hasFolderIcons = false;
            this.hidesExplorerArrows = false;
        }
        ensureLoaded(themeLoader) {
            return !this.isLoaded ? this.load(themeLoader) : Promise.resolve(this.styleSheetContent);
        }
        reload(themeLoader) {
            return this.load(themeLoader);
        }
        load(themeLoader) {
            return themeLoader.load(this);
        }
        static fromExtensionTheme(iconTheme, iconThemeLocation, extensionData) {
            const id = extensionData.extensionId + '-' + iconTheme.id;
            const label = iconTheme.label || paths.basename(iconTheme.path);
            const settingsId = iconTheme.id;
            const themeData = new FileIconThemeData(id, label, settingsId);
            themeData.description = iconTheme.description;
            themeData.location = iconThemeLocation;
            themeData.extensionData = extensionData;
            themeData.watch = iconTheme._watch;
            themeData.isLoaded = false;
            return themeData;
        }
        static { this._noIconTheme = null; }
        static get noIconTheme() {
            let themeData = FileIconThemeData._noIconTheme;
            if (!themeData) {
                themeData = FileIconThemeData._noIconTheme = new FileIconThemeData('', '', null);
                themeData.hasFileIcons = false;
                themeData.hasFolderIcons = false;
                themeData.hidesExplorerArrows = false;
                themeData.isLoaded = true;
                themeData.extensionData = undefined;
                themeData.watch = false;
            }
            return themeData;
        }
        static createUnloadedTheme(id) {
            const themeData = new FileIconThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.hasFileIcons = false;
            themeData.hasFolderIcons = false;
            themeData.hidesExplorerArrows = false;
            themeData.extensionData = undefined;
            themeData.watch = false;
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(FileIconThemeData.STORAGE_KEY, 0 /* StorageScope.PROFILE */);
            if (!input) {
                return undefined;
            }
            try {
                const data = JSON.parse(input);
                const theme = new FileIconThemeData('', '', null);
                for (const key in data) {
                    switch (key) {
                        case 'id':
                        case 'label':
                        case 'description':
                        case 'settingsId':
                        case 'styleSheetContent':
                        case 'hasFileIcons':
                        case 'hidesExplorerArrows':
                        case 'hasFolderIcons':
                        case 'watch':
                            theme[key] = data[key];
                            break;
                        case 'location':
                            // ignore, no longer restore
                            break;
                        case 'extensionData':
                            theme.extensionData = workbenchThemeService_1.ExtensionData.fromJSONObject(data.extensionData);
                            break;
                    }
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        toStorage(storageService) {
            const data = JSON.stringify({
                id: this.id,
                label: this.label,
                description: this.description,
                settingsId: this.settingsId,
                styleSheetContent: this.styleSheetContent,
                hasFileIcons: this.hasFileIcons,
                hasFolderIcons: this.hasFolderIcons,
                hidesExplorerArrows: this.hidesExplorerArrows,
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
                watch: this.watch
            });
            storageService.store(FileIconThemeData.STORAGE_KEY, data, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
    }
    exports.FileIconThemeData = FileIconThemeData;
    class FileIconThemeLoader {
        constructor(fileService, languageService) {
            this.fileService = fileService;
            this.languageService = languageService;
        }
        load(data) {
            if (!data.location) {
                return Promise.resolve(data.styleSheetContent);
            }
            return this.loadIconThemeDocument(data.location).then(iconThemeDocument => {
                const result = this.processIconThemeDocument(data.id, data.location, iconThemeDocument);
                data.styleSheetContent = result.content;
                data.hasFileIcons = result.hasFileIcons;
                data.hasFolderIcons = result.hasFolderIcons;
                data.hidesExplorerArrows = result.hidesExplorerArrows;
                data.isLoaded = true;
                return data.styleSheetContent;
            });
        }
        loadIconThemeDocument(location) {
            return this.fileService.readExtensionResource(location).then((content) => {
                const errors = [];
                const contentValue = Json.parse(content, errors);
                if (errors.length > 0) {
                    return Promise.reject(new Error(nls.localize('error.cannotparseicontheme', "Problems parsing file icons file: {0}", errors.map(e => (0, jsonErrorMessages_1.getParseErrorMessage)(e.error)).join(', '))));
                }
                else if (Json.getNodeType(contentValue) !== 'object') {
                    return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for file icons theme file: Object expected.")));
                }
                return Promise.resolve(contentValue);
            });
        }
        processIconThemeDocument(id, iconThemeDocumentLocation, iconThemeDocument) {
            const result = { content: '', hasFileIcons: false, hasFolderIcons: false, hidesExplorerArrows: !!iconThemeDocument.hidesExplorerArrows };
            let hasSpecificFileIcons = false;
            if (!iconThemeDocument.iconDefinitions) {
                return result;
            }
            const selectorByDefinitionId = {};
            const coveredLanguages = {};
            const iconThemeDocumentLocationDirname = resources.dirname(iconThemeDocumentLocation);
            function resolvePath(path) {
                return resources.joinPath(iconThemeDocumentLocationDirname, path);
            }
            function collectSelectors(associations, baseThemeClassName) {
                function addSelector(selector, defId) {
                    if (defId) {
                        let list = selectorByDefinitionId[defId];
                        if (!list) {
                            list = selectorByDefinitionId[defId] = [];
                        }
                        list.push(selector);
                    }
                }
                if (associations) {
                    let qualifier = '.show-file-icons';
                    if (baseThemeClassName) {
                        qualifier = baseThemeClassName + ' ' + qualifier;
                    }
                    const expanded = '.monaco-tl-twistie.collapsible:not(.collapsed) + .monaco-tl-contents';
                    if (associations.folder) {
                        addSelector(`${qualifier} .folder-icon::before`, associations.folder);
                        result.hasFolderIcons = true;
                    }
                    if (associations.folderExpanded) {
                        addSelector(`${qualifier} ${expanded} .folder-icon::before`, associations.folderExpanded);
                        result.hasFolderIcons = true;
                    }
                    const rootFolder = associations.rootFolder || associations.folder;
                    const rootFolderExpanded = associations.rootFolderExpanded || associations.folderExpanded;
                    if (rootFolder) {
                        addSelector(`${qualifier} .rootfolder-icon::before`, rootFolder);
                        result.hasFolderIcons = true;
                    }
                    if (rootFolderExpanded) {
                        addSelector(`${qualifier} ${expanded} .rootfolder-icon::before`, rootFolderExpanded);
                        result.hasFolderIcons = true;
                    }
                    if (associations.file) {
                        addSelector(`${qualifier} .file-icon::before`, associations.file);
                        result.hasFileIcons = true;
                    }
                    const folderNames = associations.folderNames;
                    if (folderNames) {
                        for (const key in folderNames) {
                            const selectors = [];
                            const name = handleParentFolder(key.toLowerCase(), selectors);
                            selectors.push(`.${escapeCSS(name)}-name-folder-icon`);
                            addSelector(`${qualifier} ${selectors.join('')}.folder-icon::before`, folderNames[key]);
                            result.hasFolderIcons = true;
                        }
                    }
                    const folderNamesExpanded = associations.folderNamesExpanded;
                    if (folderNamesExpanded) {
                        for (const key in folderNamesExpanded) {
                            const selectors = [];
                            const name = handleParentFolder(key.toLowerCase(), selectors);
                            selectors.push(`.${escapeCSS(name)}-name-folder-icon`);
                            addSelector(`${qualifier} ${expanded} ${selectors.join('')}.folder-icon::before`, folderNamesExpanded[key]);
                            result.hasFolderIcons = true;
                        }
                    }
                    const rootFolderNames = associations.rootFolderNames;
                    if (rootFolderNames) {
                        for (const key in rootFolderNames) {
                            const name = key.toLowerCase();
                            addSelector(`${qualifier} .${escapeCSS(name)}-root-name-folder-icon.rootfolder-icon::before`, rootFolderNames[key]);
                            result.hasFolderIcons = true;
                        }
                    }
                    const rootFolderNamesExpanded = associations.rootFolderNamesExpanded;
                    if (rootFolderNamesExpanded) {
                        for (const key in rootFolderNamesExpanded) {
                            const name = key.toLowerCase();
                            addSelector(`${qualifier} ${expanded} .${escapeCSS(name)}-root-name-folder-icon.rootfolder-icon::before`, rootFolderNamesExpanded[key]);
                            result.hasFolderIcons = true;
                        }
                    }
                    const languageIds = associations.languageIds;
                    if (languageIds) {
                        if (!languageIds.jsonc && languageIds.json) {
                            languageIds.jsonc = languageIds.json;
                        }
                        for (const languageId in languageIds) {
                            addSelector(`${qualifier} .${escapeCSS(languageId)}-lang-file-icon.file-icon::before`, languageIds[languageId]);
                            result.hasFileIcons = true;
                            hasSpecificFileIcons = true;
                            coveredLanguages[languageId] = true;
                        }
                    }
                    const fileExtensions = associations.fileExtensions;
                    if (fileExtensions) {
                        for (const key in fileExtensions) {
                            const selectors = [];
                            const name = handleParentFolder(key.toLowerCase(), selectors);
                            const segments = name.split('.');
                            if (segments.length) {
                                for (let i = 0; i < segments.length; i++) {
                                    selectors.push(`.${escapeCSS(segments.slice(i).join('.'))}-ext-file-icon`);
                                }
                                selectors.push('.ext-file-icon'); // extra segment to increase file-ext score
                            }
                            addSelector(`${qualifier} ${selectors.join('')}.file-icon::before`, fileExtensions[key]);
                            result.hasFileIcons = true;
                            hasSpecificFileIcons = true;
                        }
                    }
                    const fileNames = associations.fileNames;
                    if (fileNames) {
                        for (const key in fileNames) {
                            const selectors = [];
                            const fileName = handleParentFolder(key.toLowerCase(), selectors);
                            selectors.push(`.${escapeCSS(fileName)}-name-file-icon`);
                            selectors.push('.name-file-icon'); // extra segment to increase file-name score
                            const segments = fileName.split('.');
                            if (segments.length) {
                                for (let i = 1; i < segments.length; i++) {
                                    selectors.push(`.${escapeCSS(segments.slice(i).join('.'))}-ext-file-icon`);
                                }
                                selectors.push('.ext-file-icon'); // extra segment to increase file-ext score
                            }
                            addSelector(`${qualifier} ${selectors.join('')}.file-icon::before`, fileNames[key]);
                            result.hasFileIcons = true;
                            hasSpecificFileIcons = true;
                        }
                    }
                }
            }
            collectSelectors(iconThemeDocument);
            collectSelectors(iconThemeDocument.light, '.vs');
            collectSelectors(iconThemeDocument.highContrast, '.hc-black');
            collectSelectors(iconThemeDocument.highContrast, '.hc-light');
            if (!result.hasFileIcons && !result.hasFolderIcons) {
                return result;
            }
            const showLanguageModeIcons = iconThemeDocument.showLanguageModeIcons === true || (hasSpecificFileIcons && iconThemeDocument.showLanguageModeIcons !== false);
            const cssRules = [];
            const fonts = iconThemeDocument.fonts;
            const fontSizes = new Map();
            if (Array.isArray(fonts)) {
                const defaultFontSize = fonts[0].size || '150%';
                fonts.forEach(font => {
                    const src = font.src.map(l => `${(0, dom_1.asCSSUrl)(resolvePath(l.path))} format('${l.format}')`).join(', ');
                    cssRules.push(`@font-face { src: ${src}; font-family: '${font.id}'; font-weight: ${font.weight}; font-style: ${font.style}; font-display: block; }`);
                    if (font.size !== undefined && font.size !== defaultFontSize) {
                        fontSizes.set(font.id, font.size);
                    }
                });
                cssRules.push(`.show-file-icons .file-icon::before, .show-file-icons .folder-icon::before, .show-file-icons .rootfolder-icon::before { font-family: '${fonts[0].id}'; font-size: ${defaultFontSize}; }`);
            }
            for (const defId in selectorByDefinitionId) {
                const selectors = selectorByDefinitionId[defId];
                const definition = iconThemeDocument.iconDefinitions[defId];
                if (definition) {
                    if (definition.iconPath) {
                        cssRules.push(`${selectors.join(', ')} { content: ' '; background-image: ${(0, dom_1.asCSSUrl)(resolvePath(definition.iconPath))}; }`);
                    }
                    else if (definition.fontCharacter || definition.fontColor) {
                        const body = [];
                        if (definition.fontColor) {
                            body.push(`color: ${definition.fontColor};`);
                        }
                        if (definition.fontCharacter) {
                            body.push(`content: '${definition.fontCharacter}';`);
                        }
                        const fontSize = definition.fontSize ?? (definition.fontId ? fontSizes.get(definition.fontId) : undefined);
                        if (fontSize) {
                            body.push(`font-size: ${fontSize};`);
                        }
                        if (definition.fontId) {
                            body.push(`font-family: ${definition.fontId};`);
                        }
                        if (showLanguageModeIcons) {
                            body.push(`background-image: unset;`); // potentially set by the language default
                        }
                        cssRules.push(`${selectors.join(', ')} { ${body.join(' ')} }`);
                    }
                }
            }
            if (showLanguageModeIcons) {
                for (const languageId of this.languageService.getRegisteredLanguageIds()) {
                    if (!coveredLanguages[languageId]) {
                        const icon = this.languageService.getIcon(languageId);
                        if (icon) {
                            const selector = `.show-file-icons .${escapeCSS(languageId)}-lang-file-icon.file-icon::before`;
                            cssRules.push(`${selector} { content: ' '; background-image: ${(0, dom_1.asCSSUrl)(icon.dark)}; }`);
                            cssRules.push(`.vs ${selector} { content: ' '; background-image: ${(0, dom_1.asCSSUrl)(icon.light)}; }`);
                        }
                    }
                }
            }
            result.content = cssRules.join('\n');
            return result;
        }
    }
    exports.FileIconThemeLoader = FileIconThemeLoader;
    function handleParentFolder(key, selectors) {
        const lastIndexOfSlash = key.lastIndexOf('/');
        if (lastIndexOfSlash >= 0) {
            const parentFolder = key.substring(0, lastIndexOfSlash);
            selectors.push(`.${escapeCSS(parentFolder)}-name-dir-icon`);
            return key.substring(lastIndexOfSlash + 1);
        }
        return key;
    }
    function escapeCSS(str) {
        str = str.replace(/[\11\12\14\15\40]/g, '/'); // HTML class names can not contain certain whitespace characters, use / instead, which doesn't exist in file names.
        return window_1.mainWindow.CSS.escape(str);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUljb25UaGVtZURhdGEuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2Jyb3dzZXIvZmlsZUljb25UaGVtZURhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsaUJBQWlCO2lCQUViLGdCQUFXLEdBQUcsZUFBZSxDQUFDO1FBZ0I5QyxZQUFvQixFQUFVLEVBQUUsS0FBYSxFQUFFLFVBQXlCO1lBQ3ZFLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDdEIsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDMUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7WUFDNUIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEtBQUssQ0FBQztRQUNsQyxDQUFDO1FBRU0sWUFBWSxDQUFDLFdBQWdDO1lBQ25ELE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFTSxNQUFNLENBQUMsV0FBZ0M7WUFDN0MsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFTyxJQUFJLENBQUMsV0FBZ0M7WUFDNUMsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9C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