/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/snippets/browser/commands/abstractSnippetsActions", "vs/workbench/contrib/snippets/browser/snippets", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, extpath_1, path_1, resources_1, uri_1, language_1, nls, actions_1, files_1, label_1, opener_1, quickInput_1, workspace_1, abstractSnippetsActions_1, snippets_1, textfiles_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigureSnippetsAction = void 0;
    var ISnippetPick;
    (function (ISnippetPick) {
        function is(thing) {
            return !!thing && uri_1.URI.isUri(thing.filepath);
        }
        ISnippetPick.is = is;
    })(ISnippetPick || (ISnippetPick = {}));
    async function computePicks(snippetService, userDataProfileService, languageService, labelService) {
        const existing = [];
        const future = [];
        const seen = new Set();
        const added = new Map();
        for (const file of await snippetService.getSnippetFiles()) {
            if (file.source === 3 /* SnippetSource.Extension */) {
                // skip extension snippets
                continue;
            }
            if (file.isGlobalSnippets) {
                await file.load();
                // list scopes for global snippets
                const names = new Set();
                let source;
                outer: for (const snippet of file.data) {
                    if (!source) {
                        source = snippet.source;
                    }
                    for (const scope of snippet.scopes) {
                        const name = languageService.getLanguageName(scope);
                        if (name) {
                            if (names.size >= 4) {
                                names.add(`${name}...`);
                                break outer;
                            }
                            else {
                                names.add(name);
                            }
                        }
                    }
                }
                const snippet = {
                    label: (0, resources_1.basename)(file.location),
                    filepath: file.location,
                    description: names.size === 0
                        ? nls.localize('global.scope', "(global)")
                        : nls.localize('global.1', "({0})", [...names].join(', '))
                };
                existing.push(snippet);
                if (!source) {
                    continue;
                }
                const detail = nls.localize('detail.label', "({0}) {1}", source, labelService.getUriLabel(file.location, { relative: true }));
                const lastItem = added.get((0, resources_1.basename)(file.location));
                if (lastItem) {
                    snippet.detail = detail;
                    lastItem.snippet.detail = lastItem.detail;
                }
                added.set((0, resources_1.basename)(file.location), { snippet, detail });
            }
            else {
                // language snippet
                const mode = (0, resources_1.basename)(file.location).replace(/\.json$/, '');
                existing.push({
                    label: (0, resources_1.basename)(file.location),
                    description: `(${languageService.getLanguageName(mode)})`,
                    filepath: file.location
                });
                seen.add(mode);
            }
        }
        const dir = userDataProfileService.currentProfile.snippetsHome;
        for (const languageId of languageService.getRegisteredLanguageIds()) {
            const label = languageService.getLanguageName(languageId);
            if (label && !seen.has(languageId)) {
                future.push({
                    label: languageId,
                    description: `(${label})`,
                    filepath: (0, resources_1.joinPath)(dir, `${languageId}.json`),
                    hint: true
                });
            }
        }
        existing.sort((a, b) => {
            const a_ext = (0, path_1.extname)(a.filepath.path);
            const b_ext = (0, path_1.extname)(b.filepath.path);
            if (a_ext === b_ext) {
                return a.label.localeCompare(b.label);
            }
            else if (a_ext === '.code-snippets') {
                return -1;
            }
            else {
                return 1;
            }
        });
        future.sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        return { existing, future };
    }
    async function createSnippetFile(scope, defaultPath, quickInputService, fileService, textFileService, opener) {
        function createSnippetUri(input) {
            const filename = (0, path_1.extname)(input) !== '.code-snippets'
                ? `${input}.code-snippets`
                : input;
            return (0, resources_1.joinPath)(defaultPath, filename);
        }
        await fileService.createFolder(defaultPath);
        const input = await quickInputService.input({
            placeHolder: nls.localize('name', "Type snippet file name"),
            async validateInput(input) {
                if (!input) {
                    return nls.localize('bad_name1', "Invalid file name");
                }
                if (!(0, extpath_1.isValidBasename)(input)) {
                    return nls.localize('bad_name2', "'{0}' is not a valid file name", input);
                }
                if (await fileService.exists(createSnippetUri(input))) {
                    return nls.localize('bad_name3', "'{0}' already exists", input);
                }
                return undefined;
            }
        });
        if (!input) {
            return undefined;
        }
        const resource = createSnippetUri(input);
        await textFileService.write(resource, [
            '{',
            '\t// Place your ' + scope + ' snippets here. Each snippet is defined under a snippet name and has a scope, prefix, body and ',
            '\t// description. Add comma separated ids of the languages where the snippet is applicable in the scope field. If scope ',
            '\t// is left empty or omitted, the snippet gets applied to all languages. The prefix is what is ',
            '\t// used to trigger the snippet and the body will be expanded and inserted. Possible variables are: ',
            '\t// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. ',
            '\t// Placeholders with the same ids are connected.',
            '\t// Example:',
            '\t// "Print to console": {',
            '\t// \t"scope": "javascript,typescript",',
            '\t// \t"prefix": "log",',
            '\t// \t"body": [',
            '\t// \t\t"console.log(\'$1\');",',
            '\t// \t\t"$2"',
            '\t// \t],',
            '\t// \t"description": "Log output to console"',
            '\t// }',
            '}'
        ].join('\n'));
        await opener.open(resource);
        return undefined;
    }
    async function createLanguageSnippetFile(pick, fileService, textFileService) {
        if (await fileService.exists(pick.filepath)) {
            return;
        }
        const contents = [
            '{',
            '\t// Place your snippets for ' + pick.label + ' here. Each snippet is defined under a snippet name and has a prefix, body and ',
            '\t// description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted. Possible variables are:',
            '\t// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. Placeholders with the ',
            '\t// same ids are connected.',
            '\t// Example:',
            '\t// "Print to console": {',
            '\t// \t"prefix": "log",',
            '\t// \t"body": [',
            '\t// \t\t"console.log(\'$1\');",',
            '\t// \t\t"$2"',
            '\t// \t],',
            '\t// \t"description": "Log output to console"',
            '\t// }',
            '}'
        ].join('\n');
        await textFileService.write(pick.filepath, contents);
    }
    class ConfigureSnippetsAction extends abstractSnippetsActions_1.SnippetsAction {
        constructor() {
            super({
                id: 'workbench.action.openSnippets',
                title: nls.localize2('openSnippet.label', "Configure User Snippets"),
                shortTitle: {
                    ...nls.localize2('userSnippets', "User Snippets"),
                    mnemonicTitle: nls.localize({ key: 'miOpenSnippets', comment: ['&& denotes a mnemonic'] }, "User &&Snippets"),
                },
                f1: true,
                menu: [
                    { id: actions_1.MenuId.MenubarPreferencesMenu, group: '2_configuration', order: 5 },
                    { id: actions_1.MenuId.GlobalActivity, group: '2_configuration', order: 5 },
                ]
            });
        }
        async run(accessor) {
            const snippetService = accessor.get(snippets_1.ISnippetsService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const opener = accessor.get(opener_1.IOpenerService);
            const languageService = accessor.get(language_1.ILanguageService);
            const userDataProfileService = accessor.get(userDataProfile_1.IUserDataProfileService);
            const workspaceService = accessor.get(workspace_1.IWorkspaceContextService);
            const fileService = accessor.get(files_1.IFileService);
            const textFileService = accessor.get(textfiles_1.ITextFileService);
            const labelService = accessor.get(label_1.ILabelService);
            const picks = await computePicks(snippetService, userDataProfileService, languageService, labelService);
            const existing = picks.existing;
            const globalSnippetPicks = [{
                    scope: nls.localize('new.global_scope', 'global'),
                    label: nls.localize('new.global', "New Global Snippets file..."),
                    uri: userDataProfileService.currentProfile.snippetsHome
                }];
            const workspaceSnippetPicks = [];
            for (const folder of workspaceService.getWorkspace().folders) {
                workspaceSnippetPicks.push({
                    scope: nls.localize('new.workspace_scope', "{0} workspace", folder.name),
                    label: nls.localize('new.folder', "New Snippets file for '{0}'...", folder.name),
                    uri: folder.toResource('.vscode')
                });
            }
            if (existing.length > 0) {
                existing.unshift({ type: 'separator', label: nls.localize('group.global', "Existing Snippets") });
                existing.push({ type: 'separator', label: nls.localize('new.global.sep', "New Snippets") });
            }
            else {
                existing.push({ type: 'separator', label: nls.localize('new.global.sep', "New Snippets") });
            }
            const pick = await quickInputService.pick([].concat(existing, globalSnippetPicks, workspaceSnippetPicks, picks.future), {
                placeHolder: nls.localize('openSnippet.pickLanguage', "Select Snippets File or Create Snippets"),
                matchOnDescription: true
            });
            if (globalSnippetPicks.indexOf(pick) >= 0) {
                return createSnippetFile(pick.scope, pick.uri, quickInputService, fileService, textFileService, opener);
            }
            else if (workspaceSnippetPicks.indexOf(pick) >= 0) {
                return createSnippetFile(pick.scope, pick.uri, quickInputService, fileService, textFileService, opener);
            }
            else if (ISnippetPick.is(pick)) {
                if (pick.hint) {
                    await createLanguageSnippetFile(pick, fileService, textFileService);
                }
                return opener.open(pick.filepath);
            }
        }
    }
    exports.ConfigureSnippetsAction = ConfigureSnippetsAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJlU25pcHBldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zbmlwcGV0cy9icm93c2VyL2NvbW1hbmRzL2NvbmZpZ3VyZVNuaXBwZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCaEcsSUFBVSxZQUFZLENBSXJCO0lBSkQsV0FBVSxZQUFZO1FBQ3JCLFNBQWdCLEVBQUUsQ0FBQyxLQUF5QjtZQUMzQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBZ0IsS0FBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFGZSxlQUFFLEtBRWpCLENBQUE7SUFDRixDQUFDLEVBSlMsWUFBWSxLQUFaLFlBQVksUUFJckI7SUFPRCxLQUFLLFVBQVUsWUFBWSxDQUFDLGNBQWdDLEVBQUUsc0JBQStDLEVBQUUsZUFBaUMsRUFBRSxZQUEyQjtRQUU1SyxNQUFNLFFBQVEsR0FBbUIsRUFBRSxDQUFDO1FBQ3BDLE1BQU0sTUFBTSxHQUFtQixFQUFFLENBQUM7UUFFbEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUMvQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBcUQsQ0FBQztRQUUzRSxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sY0FBYyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUM7WUFFM0QsSUFBSSxJQUFJLENBQUMsTUFBTSxvQ0FBNEIsRUFBRSxDQUFDO2dCQUM3QywwQkFBMEI7Z0JBQzFCLFNBQVM7WUFDVixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFFM0IsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRWxCLGtDQUFrQztnQkFDbEMs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