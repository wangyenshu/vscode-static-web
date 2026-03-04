/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/editor/common/languages/modesRegistry", "vs/platform/files/common/files"], function (require, exports, network_1, resources_1, modesRegistry_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIconClasses = getIconClasses;
    exports.getIconClassesForLanguageId = getIconClassesForLanguageId;
    const fileIconDirectoryRegex = /(?:\/|^)(?:([^\/]+)\/)?([^\/]+)$/;
    function getIconClasses(modelService, languageService, resource, fileKind, icon) {
        if (icon) {
            return [`codicon-${icon.id}`, 'predefined-file-icon'];
        }
        // we always set these base classes even if we do not have a path
        const classes = fileKind === files_1.FileKind.ROOT_FOLDER ? ['rootfolder-icon'] : fileKind === files_1.FileKind.FOLDER ? ['folder-icon'] : ['file-icon'];
        if (resource) {
            // Get the path and name of the resource. For data-URIs, we need to parse specially
            let name;
            if (resource.scheme === network_1.Schemas.data) {
                const metadata = resources_1.DataUri.parseMetaData(resource);
                name = metadata.get(resources_1.DataUri.META_DATA_LABEL);
            }
            else {
                const match = resource.path.match(fileIconDirectoryRegex);
                if (match) {
                    name = cssEscape(match[2].toLowerCase());
                    if (match[1]) {
                        classes.push(`${cssEscape(match[1].toLowerCase())}-name-dir-icon`); // parent directory
                    }
                }
                else {
                    name = cssEscape(resource.authority.toLowerCase());
                }
            }
            // Root Folders
            if (fileKind === files_1.FileKind.ROOT_FOLDER) {
                classes.push(`${name}-root-name-folder-icon`);
            }
            // Folders
            else if (fileKind === files_1.FileKind.FOLDER) {
                classes.push(`${name}-name-folder-icon`);
            }
            // Files
            else {
                // Name & Extension(s)
                if (name) {
                    classes.push(`${name}-name-file-icon`);
                    classes.push(`name-file-icon`); // extra segment to increase file-name score
                    // Avoid doing an explosive combination of extensions for very long filenames
                    // (most file systems do not allow files > 255 length) with lots of `.` characters
                    // https://github.com/microsoft/vscode/issues/116199
                    if (name.length <= 255) {
                        const dotSegments = name.split('.');
                        for (let i = 1; i < dotSegments.length; i++) {
                            classes.push(`${dotSegments.slice(i).join('.')}-ext-file-icon`); // add each combination of all found extensions if more than one
                        }
                    }
                    classes.push(`ext-file-icon`); // extra segment to increase file-ext score
                }
                // Detected Mode
                const detectedLanguageId = detectLanguageId(modelService, languageService, resource);
                if (detectedLanguageId) {
                    classes.push(`${cssEscape(detectedLanguageId)}-lang-file-icon`);
                }
            }
        }
        return classes;
    }
    function getIconClassesForLanguageId(languageId) {
        return ['file-icon', `${cssEscape(languageId)}-lang-file-icon`];
    }
    function detectLanguageId(modelService, languageService, resource) {
        if (!resource) {
            return null; // we need a resource at least
        }
        let languageId = null;
        // Data URI: check for encoded metadata
        if (resource.scheme === network_1.Schemas.data) {
            const metadata = resources_1.DataUri.parseMetaData(resource);
            const mime = metadata.get(resources_1.DataUri.META_DATA_MIME);
            if (mime) {
                languageId = languageService.getLanguageIdByMimeType(mime);
            }
        }
        // Any other URI: check for model if existing
        else {
            const model = modelService.getModel(resource);
            if (model) {
                languageId = model.getLanguageId();
            }
        }
        // only take if the language id is specific (aka no just plain text)
        if (languageId && languageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
            return languageId;
        }
        // otherwise fallback to path based detection
        return languageService.guessLanguageIdByFilepathOrFirstLine(resource);
    }
    function cssEscape(str) {
        return str.replace(/[\11\12\14\15\40]/g, '/'); // HTML class names can not contain certain whitespace characters, use / instead, which doesn't exist in file names.
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SWNvbkNsYXNzZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL2dldEljb25DbGFzc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLHdDQWdFQztJQUVELGtFQUVDO0lBdEVELE1BQU0sc0JBQXNCLEdBQUcsa0NBQWtDLENBQUM7SUFFbEUsU0FBZ0IsY0FBYyxDQUFDLFlBQTJCLEVBQUUsZUFBaUMsRUFBRSxRQUF5QixFQUFFLFFBQW1CLEVBQUUsSUFBZ0I7UUFDOUosSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNWLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxpRUFBaUU7UUFDakUsTUFBTSxPQUFPLEdBQUcsUUFBUSxLQUFLLGdCQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxnQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN6SSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBRWQsbUZBQW1GO1lBQ25GLElBQUksSUFBd0IsQ0FBQztZQUM3QixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxRQUFRLEdBQUcsbUJBQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pELElBQUksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1CQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDOUMsQ0FBQztpQkFBTSxDQUFD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