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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/editors/textFileEditorTracker", "vs/workbench/contrib/files/browser/editors/textFileSaveErrorHandler", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/contrib/files/browser/editors/binaryFileEditor", "vs/platform/instantiation/common/descriptors", "vs/base/common/platform", "vs/workbench/contrib/files/browser/explorerViewlet", "vs/workbench/browser/editor", "vs/platform/label/common/label", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/files/browser/explorerService", "vs/workbench/services/textfile/common/encoding", "vs/base/common/network", "vs/workbench/contrib/files/browser/workspaceWatcher", "vs/editor/common/config/editorConfigurationSchema", "vs/workbench/contrib/files/common/dirtyFilesIndicator", "vs/editor/browser/editorExtensions", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/browser/editors/fileEditorHandler", "vs/editor/common/languages/modesRegistry", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/files/browser/editors/textFileEditor"], function (require, exports, nls, path_1, platform_1, configurationRegistry_1, contributions_1, editor_1, files_1, files_2, textFileEditorTracker_1, textFileSaveErrorHandler_1, fileEditorInput_1, binaryFileEditor_1, descriptors_1, platform_2, explorerViewlet_1, editor_2, label_1, extensions_1, explorerService_1, encoding_1, network_1, workspaceWatcher_1, editorConfigurationSchema_1, dirtyFilesIndicator_1, editorExtensions_1, undoRedo_1, files_3, fileEditorHandler_1, modesRegistry_1, configuration_1, textFileEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let FileUriLabelContribution = class FileUriLabelContribution {
        static { this.ID = 'workbench.contrib.fileUriLabel'; }
        constructor(labelService) {
            labelService.registerFormatter({
                scheme: network_1.Schemas.file,
                formatting: {
                    label: '${authority}${path}',
                    separator: path_1.sep,
                    tildify: !platform_2.isWindows,
                    normalizeDriveLetter: platform_2.isWindows,
                    authorityPrefix: path_1.sep + path_1.sep,
                    workspaceSuffix: ''
                }
            });
        }
    };
    FileUriLabelContribution = __decorate([
        __param(0, label_1.ILabelService)
    ], FileUriLabelContribution);
    (0, extensions_1.registerSingleton)(files_3.IExplorerService, explorerService_1.ExplorerService, 1 /* InstantiationType.Delayed */);
    // Register file editors
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(textFileEditor_1.TextFileEditor, textFileEditor_1.TextFileEditor.ID, nls.localize('textFileEditor', "Text File Editor")), [
        new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)
    ]);
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(binaryFileEditor_1.BinaryFileEditor, binaryFileEditor_1.BinaryFileEditor.ID, nls.localize('binaryFileEditor', "Binary File Editor")), [
        new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)
    ]);
    // Register default file input factory
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerFileEditorFactory({
        typeId: files_2.FILE_EDITOR_INPUT_ID,
        createFileEditor: (resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents, instantiationService) => {
            return instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents);
        },
        isFileEditor: (obj) => {
            return obj instanceof fileEditorInput_1.FileEditorInput;
        }
    });
    // Register Editor Input Serializer & Handler
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(files_2.FILE_EDITOR_INPUT_ID, fileEditorHandler_1.FileEditorInputSerializer);
    (0, contributions_1.registerWorkbenchContribution2)(fileEditorHandler_1.FileEditorWorkingCopyEditorHandler.ID, fileEditorHandler_1.FileEditorWorkingCopyEditorHandler, 2 /* WorkbenchPhase.BlockRestore */);
    // Register Explorer views
    (0, contributions_1.registerWorkbenchContribution2)(explorerViewlet_1.ExplorerViewletViewsContribution.ID, explorerViewlet_1.ExplorerViewletViewsContribution, 1 /* WorkbenchPhase.BlockStartup */);
    // Register Text File Editor Tracker
    (0, contributions_1.registerWorkbenchContribution2)(textFileEditorTracker_1.TextFileEditorTracker.ID, textFileEditorTracker_1.TextFileEditorTracker, 1 /* WorkbenchPhase.BlockStartup */);
    // Register Text File Save Error Handler
    (0, contributions_1.registerWorkbenchContribution2)(textFileSaveErrorHandler_1.TextFileSaveErrorHandler.ID, textFileSaveErrorHandler_1.TextFileSaveErrorHandler, 1 /* WorkbenchPhase.BlockStartup */);
    // Register uri display for file uris
    (0, contributions_1.registerWorkbenchContribution2)(FileUriLabelContribution.ID, FileUriLabelContribution, 1 /* WorkbenchPhase.BlockStartup */);
    // Register Workspace Watcher
    (0, contributions_1.registerWorkbenchContribution2)(workspaceWatcher_1.WorkspaceWatcher.ID, workspaceWatcher_1.WorkspaceWatcher, 3 /* WorkbenchPhase.AfterRestored */);
    // Register Dirty Files Indicator
    (0, contributions_1.registerWorkbenchContribution2)(dirtyFilesIndicator_1.DirtyFilesIndicator.ID, dirtyFilesIndicator_1.DirtyFilesIndicator, 1 /* WorkbenchPhase.BlockStartup */);
    // Configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const hotExitConfiguration = platform_2.isNative ?
        {
            'type': 'string',
            'scope': 1 /* ConfigurationScope.APPLICATION */,
            'enum': [files_1.HotExitConfiguration.OFF, files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE],
            'default': files_1.HotExitConfiguration.ON_EXIT,
            'markdownEnumDescriptions': [
                nls.localize('hotExit.off', 'Disable hot exit. A prompt will show when attempting to close a window with editors that have unsaved changes.'),
                nls.localize('hotExit.onExit', 'Hot exit will be triggered when the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu). All windows without folders opened will be restored upon next launch. A list of previously opened windows with unsaved files can be accessed via `File > Open Recent > More...`'),
                nls.localize('hotExit.onExitAndWindowClose', 'Hot exit will be triggered when the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu), and also for any window with a folder opened regardless of whether it\'s the last window. All windows without folders opened will be restored upon next launch. A list of previously opened windows with unsaved files can be accessed via `File > Open Recent > More...`')
            ],
            'markdownDescription': nls.localize('hotExit', "[Hot Exit](https://aka.ms/vscode-hot-exit) controls whether unsaved files are remembered between sessions, allowing the save prompt when exiting the editor to be skipped.", files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE)
        } : {
        'type': 'string',
        'scope': 1 /* ConfigurationScope.APPLICATION */,
        'enum': [files_1.HotExitConfiguration.OFF, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE],
        'default': files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE,
        'markdownEnumDescriptions': [
            nls.localize('hotExit.off', 'Disable hot exit. A prompt will show when attempting to close a window with editors that have unsaved changes.'),
            nls.localize('hotExit.onExitAndWindowCloseBrowser', 'Hot exit will be triggered when the browser quits or the window or tab is closed.')
        ],
        'markdownDescription': nls.localize('hotExit', "[Hot Exit](https://aka.ms/vscode-hot-exit) controls whether unsaved files are remembered between sessions, allowing the save prompt when exiting the editor to be skipped.", files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE)
    };
    configurationRegistry.registerConfiguration({
        'id': 'files',
        'order': 9,
        'title': nls.localize('filesConfigurationTitle', "Files"),
        'type': 'object',
        'properties': {
            [files_1.FILES_EXCLUDE_CONFIG]: {
                'type': 'object',
                'markdownDescription': nls.localize('exclude', "Configure [glob patterns](https://aka.ms/vscode-glob-patterns) for excluding files and folders. For example, the File Explorer decides which files and folders to show or hide based on this setting. Refer to the `#search.exclude#` setting to define search-specific excludes. Refer to the `#explorer.excludeGitIgnore#` setting for ignoring files based on your `.gitignore`."),
                'default': {
                    ...{ '**/.git': true, '**/.svn': true, '**/.hg': true, '**/CVS': true, '**/.DS_Store': true, '**/Thumbs.db': true },
                    ...(platform_2.isWeb ? { '**/*.crswap': true /* filter out swap files used for local file access */ } : undefined)
                },
                'scope': 4 /* ConfigurationScope.RESOURCE */,
                'additionalProperties': {
                    'anyOf': [
                        {
                            'type': 'boolean',
                            'enum': [true, false],
                            'enumDescriptions': [nls.localize('trueDescription', "Enable the pattern."), nls.localize('falseDescription', "Disable the pattern.")],
                            'description': nls.localize('files.exclude.boolean', "The glob pattern to match file paths against. Set to true or false to enable or disable the pattern."),
                        },
                        {
                            'type': 'object',
                            'properties': {
                                'when': {
                                    'type': 'string', // expression ({ "**/*.js": { "when": "$(basename).js" } })
                                    'pattern': '\\w*\\$\\(basename\\)\\w*',
                                    'default': '$(basename).ext',
                                    'markdownDescription': nls.localize({ key: 'files.exclude.when', comment: ['\\$(basename) should not be translated'] }, "Additional check on the siblings of a matching file. Use \\$(basename) as variable for the matching file name.")
                                }
                            }
                        }
                    ]
                }
            },
            [files_1.FILES_ASSOCIATIONS_CONFIG]: {
                'type': 'object',
                'markdownDescription': nls.localize('associations', "Configure [glob patterns](https://aka.ms/vscode-glob-patterns) of file associations to languages (for example `\"*.extension\": \"html\"`). Patterns will match on the absolute path of a file if they contain a path separator and will match on the name of the file otherwise. These have precedence over the default associations of the languages installed."),
                'additionalProperties': {
                    'type': 'string'
                }
            },
            'files.encoding': {
                'type': 'string',
                'enum': Object.keys(encoding_1.SUPPORTED_ENCODINGS),
                'default': 'utf8',
                'description': nls.localize('encoding', "The default character set encoding to use when reading and writing files. This setting can also be configured per language."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                'enumDescriptions': Object.keys(encoding_1.SUPPORTED_ENCODINGS).map(key => encoding_1.SUPPORTED_ENCODINGS[key].labelLong),
                'enumItemLabels': Object.keys(encoding_1.SUPPORTED_ENCODINGS).map(key => encoding_1.SUPPORTED_ENCODINGS[key].labelLong)
            },
            'files.autoGuessEncoding': {
                'type': 'boolean',
                'default': false,
                'markdownDescription': nls.localize('autoGuessEncoding', "When enabled, the editor will attempt to guess the character set encoding when opening files. This setting can also be configured per language. Note, this setting is not respected by text search. Only {0} is respected.", '`#files.encoding#`'),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.eol': {
                'type': 'string',
                'enum': [
                    '\n',
                    '\r\n',
                    'auto'
                ],
                'enumDescriptions': [
                    nls.localize('eol.LF', "LF"),
                    nls.localize('eol.CRLF', "CRLF"),
                    nls.localize('eol.auto', "Uses operating system specific end of line character.")
                ],
                'default': 'auto',
                'description': nls.localize('eol', "The default end of line character."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.enableTrash': {
                'type': 'boolean',
                'default': true,
                'description': nls.localize('useTrash', "Moves files/folders to the OS trash (recycle bin on Windows) when deleting. Disabling this will delete files/folders permanently.")
            },
            'files.trimTrailingWhitespace': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('trimTrailingWhitespace', "When enabled, will trim trailing whitespace when saving a file."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.trimTrailingWhitespaceInRegexAndStrings': {
                'type': 'boolean',
                'default': true,
                'description': nls.localize('trimTrailingWhitespaceInRegexAndStrings', "When enabled, trailing whitespace will be removed from multiline strings and regexes will be removed on save or when executing 'editor.action.trimTrailingWhitespace'. This can cause whitespace to not be trimmed from lines when there isn't up-to-date token information."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.insertFinalNewline': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('insertFinalNewline', "When enabled, insert a final new line at the end of the file when saving it."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.trimFinalNewlines': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('trimFinalNewlines', "When enabled, will trim all new lines after the final new line at the end of the file when saving it."),
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
            },
            'files.autoSave': {
                'type': 'string',
                'enum': [files_1.AutoSaveConfiguration.OFF, files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE],
                'markdownEnumDescriptions': [
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.off' }, "An editor with changes is never automatically saved."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.afterDelay' }, "An editor with changes is automatically saved after the configured `#files.autoSaveDelay#`."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.onFocusChange' }, "An editor with changes is automatically saved when the editor loses focus."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.onWindowChange' }, "An editor with changes is automatically saved when the window loses focus.")
                ],
                'default': platform_2.isWeb ? files_1.AutoSaveConfiguration.AFTER_DELAY : files_1.AutoSaveConfiguration.OFF,
                'markdownDescription': nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'autoSave' }, "Controls [auto save](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save) of editors that have unsaved changes.", files_1.AutoSaveConfiguration.OFF, files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE, files_1.AutoSaveConfiguration.AFTER_DELAY),
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.autoSaveDelay': {
                'type': 'number',
                'default': 1000,
                'minimum': 0,
                'markdownDescription': nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'autoSaveDelay' }, "Controls the delay in milliseconds after which an editor with unsaved changes is saved automatically. Only applies when `#files.autoSave#` is set to `{0}`.", files_1.AutoSaveConfiguration.AFTER_DELAY),
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.autoSaveWorkspaceFilesOnly': {
                'type': 'boolean',
                'default': false,
                'markdownDescription': nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'autoSaveWorkspaceFilesOnly' }, "When enabled, will limit [auto save](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save) of editors to files that are inside the opened workspace. Only applies when `#files.autoSave#` is enabled."),
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.autoSaveWhenNoErrors': {
                'type': 'boolean',
                'default': false,
                'markdownDescription': nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'autoSaveWhenNoErrors' }, "When enabled, will limit [auto save](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save) of editors to files that have no errors reported in them at the time the auto save is triggered. Only applies when `#files.autoSave#` is enabled."),
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.watcherExclude': {
                'type': 'object',
                'patternProperties': {
                    '.*': { 'type': 'boolean' }
                },
                'default': { '**/.git/objects/**': true, '**/.git/subtree-cache/**': true, '**/node_modules/*/**': true, '**/.hg/store/**': true },
                'markdownDescription': nls.localize('watcherExclude', "Configure paths or [glob patterns](https://aka.ms/vscode-glob-patterns) to exclude from file watching. Paths can either be relative to the watched folder or absolute. Glob patterns are matched relative from the watched folder. When you experience the file watcher process consuming a lot of CPU, make sure to exclude large folders that are of less interest (such as build output folders)."),
                'scope': 4 /* ConfigurationScope.RESOURCE */
            },
            'files.watcherInclude': {
                'type': 'array',
                'items': {
                    'type': 'string'
                },
                'default': [],
                'description': nls.localize('watcherInclude', "Configure extra paths to watch for changes inside the workspace. By default, all workspace folders will be watched recursively, except for folders that are symbolic links. You can explicitly add absolute or relative paths to support watching folders that are symbolic links. Relative paths will be resolved to an absolute path using the currently opened workspace."),
                'scope': 4 /* ConfigurationScope.RESOURCE */
            },
            'files.hotExit': hotExitConfiguration,
            'files.defaultLanguage': {
                'type': 'string',
                'markdownDescription': nls.localize('defaultLanguage', "The default language identifier that is assigned to new files. If configured to `${activeEditorLanguage}`, will use the language identifier of the currently active text editor if any.")
            },
            [files_1.FILES_READONLY_INCLUDE_CONFIG]: {
                'type': 'object',
                'patternProperties': {
                    '.*': { 'type': 'boolean' }
                },
                'default': {},
                'markdownDescription': nls.localize('filesReadonlyInclude', "Configure paths or [glob patterns](https://aka.ms/vscode-glob-patterns) to mark as read-only. Glob patterns are always evaluated relative to the path of the workspace folder unless they are absolute paths. You can exclude matching paths via the `#files.readonlyExclude#` setting. Files from readonly file system providers will always be read-only independent of this setting."),
                'scope': 4 /* ConfigurationScope.RESOURCE */
            },
            [files_1.FILES_READONLY_EXCLUDE_CONFIG]: {
                'type': 'object',
                'patternProperties': {
                    '.*': { 'type': 'boolean' }
                },
                'default': {},
                'markdownDescription': nls.localize('filesReadonlyExclude', "Configure paths or [glob patterns](https://aka.ms/vscode-glob-patterns) to exclude from being marked as read-only if they match as a result of the `#files.readonlyInclude#` setting. Glob patterns are always evaluated relative to the path of the workspace folder unless they are absolute paths. Files from readonly file system providers will always be read-only independent of this setting."),
                'scope': 4 /* ConfigurationScope.RESOURCE */
            },
            [files_1.FILES_READONLY_FROM_PERMISSIONS_CONFIG]: {
                'type': 'boolean',
                'markdownDescription': nls.localize('filesReadonlyFromPermissions', "Marks files as read-only when their file permissions indicate as such. This can be overridden via `#files.readonlyInclude#` and `#files.readonlyExclude#` settings."),
                'default': false
            },
            'files.restoreUndoStack': {
                'type': 'boolean',
                'description': nls.localize('files.restoreUndoStack', "Restore the undo stack when a file is reopened."),
                'default': true
            },
            'files.saveConflictResolution': {
                'type': 'string',
                'enum': [
                    'askUser',
                    'overwriteFileOnDisk'
                ],
                'enumDescriptions': [
                    nls.localize('askUser', "Will refuse to save and ask for resolving the save conflict manually."),
                    nls.localize('overwriteFileOnDisk', "Will resolve the save conflict by overwriting the file on disk with the changes in the editor.")
                ],
                'description': nls.localize('files.saveConflictResolution', "A save conflict can occur when a file is saved to disk that was changed by another program in the meantime. To prevent data loss, the user is asked to compare the changes in the editor with the version on disk. This setting should only be changed if you frequently encounter save conflict errors and may result in data loss if used without caution."),
                'default': 'askUser',
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.dialog.defaultPath': {
                'type': 'string',
                'pattern': '^((\\/|\\\\\\\\|[a-zA-Z]:\\\\).*)?$', // slash OR UNC-root OR drive-root OR undefined
                'patternErrorMessage': nls.localize('defaultPathErrorMessage', "Default path for file dialogs must be an absolute path (e.g. C:\\\\myFolder or /myFolder)."),
                'description': nls.localize('fileDialogDefaultPath', "Default path for file dialogs, overriding user's home path. Only used in the absence of a context-specific path, such as most recently opened file or folder."),
                'scope': 2 /* ConfigurationScope.MACHINE */
            },
            'files.simpleDialog.enable': {
                'type': 'boolean',
                'description': nls.localize('files.simpleDialog.enable', "Enables the simple file dialog for opening and saving files and folders. The simple file dialog replaces the system file dialog when enabled."),
                'default': false
            },
            'files.participants.timeout': {
                type: 'number',
                default: 60000,
                markdownDescription: nls.localize('files.participants.timeout', "Timeout in milliseconds after which file participants for create, rename, and delete are cancelled. Use `0` to disable participants."),
            }
        }
    });
    configurationRegistry.registerConfiguration({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            'editor.formatOnSave': {
                'type': 'boolean',
                'description': nls.localize('formatOnSave', "Format a file on save. A formatter must be available, the file must not be saved after delay, and the editor must not be shutting down."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
            },
            'editor.formatOnSaveMode': {
                'type': 'string',
                'default': 'file',
                'enum': [
                    'file',
                    'modifications',
                    'modificationsIfAvailable'
                ],
                'enumDescriptions': [
                    nls.localize({ key: 'everything', comment: ['This is the description of an option'] }, "Format the whole file."),
                    nls.localize({ key: 'modification', comment: ['This is the description of an option'] }, "Format modifications (requires source control)."),
                    nls.localize({ key: 'modificationIfAvailable', comment: ['This is the description of an option'] }, "Will attempt to format modifications only (requires source control). If source control can't be used, then the whole file will be formatted."),
                ],
                'markdownDescription': nls.localize('formatOnSaveMode', "Controls if format on save formats the whole file or only modifications. Only applies when `#editor.formatOnSave#` is enabled."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
            },
        }
    });
    configurationRegistry.registerConfiguration({
        'id': 'explorer',
        'order': 10,
        'title': nls.localize('explorerConfigurationTitle', "File Explorer"),
        'type': 'object',
        'properties': {
            'explorer.openEditors.visible': {
                'type': 'number',
                'description': nls.localize({ key: 'openEditorsVisible', comment: ['Open is an adjective'] }, "The initial maximum number of editors shown in the Open Editors pane. Exceeding this limit will show a scroll bar and allow resizing the pane to display more items."),
                'default': 9,
                'minimum': 1
            },
            'explorer.openEditors.minVisible': {
                'type': 'number',
                'description': nls.localize({ key: 'openEditorsVisibleMin', comment: ['Open is an adjective'] }, "The minimum number of editor slots pre-allocated in the Open Editors pane. If set to 0 the Open Editors pane will dynamically resize based on the number of editors."),
                'default': 0,
                'minimum': 0
            },
            'explorer.openEditors.sortOrder': {
                'type': 'string',
                'enum': ['editorOrder', 'alphabetical', 'fullPath'],
                'description': nls.localize({ key: 'openEditorsSortOrder', comment: ['Open is an adjective'] }, "Controls the sorting order of editors in the Open Editors pane."),
                'enumDescriptions': [
                    nls.localize('sortOrder.editorOrder', 'Editors are ordered in the same order editor tabs are shown.'),
                    nls.localize('sortOrder.alphabetical', 'Editors are ordered alphabetically by tab name inside each editor group.'),
                    nls.localize('sortOrder.fullPath', 'Editors are ordered alphabetically by full path inside each editor group.')
                ],
                'default': 'editorOrder'
            },
            'explorer.autoReveal': {
                'type': ['boolean', 'string'],
                'enum': [true, false, 'focusNoScroll'],
                'default': true,
                'enumDescriptions': [
                    nls.localize('autoReveal.on', 'Files will be revealed and selected.'),
                    nls.localize('autoReveal.off', 'Files will not be revealed and selected.'),
                    nls.localize('autoReveal.focusNoScroll', 'Files will not be scrolled into view, but will still be focused.'),
                ],
                'description': nls.localize('autoReveal', "Controls whether the Explorer should automatically reveal and select files when opening them.")
            },
            'explorer.autoRevealExclude': {
                'type': 'object',
                'markdownDescription': nls.localize('autoRevealExclude', "Configure paths or [glob patterns](https://aka.ms/vscode-glob-patterns) for excluding files and folders from being revealed and selected in the Explorer when they are opened. Glob patterns are always evaluated relative to the path of the workspace folder unless they are absolute paths."),
                'default': { '**/node_modules': true, '**/bower_components': true },
                'additionalProperties': {
                    'anyOf': [
                        {
                            'type': 'boolean',
                            'description': nls.localize('explorer.autoRevealExclude.boolean', "The glob pattern to match file paths against. Set to true or false to enable or disable the pattern."),
                        },
                        {
                            type: 'object',
                            properties: {
                                when: {
                                    type: 'string', // expression ({ "**/*.js": { "when": "$(basename).js" } })
                                    pattern: '\\w*\\$\\(basename\\)\\w*',
                                    default: '$(basename).ext',
                                    description: nls.localize('explorer.autoRevealExclude.when', 'Additional check on the siblings of a matching file. Use $(basename) as variable for the matching file name.')
                                }
                            }
                        }
                    ]
                }
            },
            'explorer.enableDragAndDrop': {
                'type': 'boolean',
                'description': nls.localize('enableDragAndDrop', "Controls whether the Explorer should allow to move files and folders via drag and drop. This setting only effects drag and drop from inside the Explorer."),
                'default': true
            },
            'explorer.confirmDragAndDrop': {
                'type': 'boolean',
                'description': nls.localize('confirmDragAndDrop', "Controls whether the Explorer should ask for confirmation to move files and folders via drag and drop."),
                'default': true
            },
            'explorer.confirmPasteNative': {
                'type': 'boolean',
                'description': nls.localize('confirmPasteNative', "Controls whether the Explorer should ask for confirmation when pasting native files and folders."),
                'default': true
            },
            'explorer.confirmDelete': {
                'type': 'boolean',
                'description': nls.localize('confirmDelete', "Controls whether the Explorer should ask for confirmation when deleting a file via the trash."),
                'default': true
            },
            'explorer.enableUndo': {
                'type': 'boolean',
                'description': nls.localize('enableUndo', "Controls whether the Explorer should support undoing file and folder operations."),
                'default': true
            },
            'explorer.confirmUndo': {
                'type': 'string',
                'enum': ["verbose" /* UndoConfirmLevel.Verbose */, "default" /* UndoConfirmLevel.Default */, "light" /* UndoConfirmLevel.Light */],
                'description': nls.localize('confirmUndo', "Controls whether the Explorer should ask for confirmation when undoing."),
                'default': "default" /* UndoConfirmLevel.Default */,
                'enumDescriptions': [
                    nls.localize('enableUndo.verbose', 'Explorer will prompt before all undo operations.'),
                    nls.localize('enableUndo.default', 'Explorer will prompt before destructive undo operations.'),
                    nls.localize('enableUndo.light', 'Explorer will not prompt before undo operations when focused.'),
                ],
            },
            'explorer.expandSingleFolderWorkspaces': {
                'type': 'boolean',
                'description': nls.localize('expandSingleFolderWorkspaces', "Controls whether the Explorer should expand multi-root workspaces containing only one folder during initialization"),
                'default': true
            },
            'explorer.sortOrder': {
                'type': 'string',
                'enum': ["default" /* SortOrder.Default */, "mixed" /* SortOrder.Mixed */, "filesFirst" /* SortOrder.FilesFirst */, "type" /* SortOrder.Type */, "modified" /* SortOrder.Modified */, "foldersNestsFiles" /* SortOrder.FoldersNestsFiles */],
                'default': "default" /* SortOrder.Default */,
                'enumDescriptions': [
                    nls.localize('sortOrder.default', 'Files and folders are sorted by their names. Folders are displayed before files.'),
                    nls.localize('sortOrder.mixed', 'Files and folders are sorted by their names. Files are interwoven with folders.'),
                    nls.localize('sortOrder.filesFirst', 'Files and folders are sorted by their names. Files are displayed before folders.'),
                    nls.localize('sortOrder.type', 'Files and folders are grouped by extension type then sorted by their names. Folders are displayed before files.'),
                    nls.localize('sortOrder.modified', 'Files and folders are sorted by last modified date in descending order. Folders are displayed before files.'),
                    nls.localize('sortOrder.foldersNestsFiles', 'Files and folders are sorted by their names. Folders are displayed before files. Files with nested children are displayed before other files.')
                ],
                'markdownDescription': nls.localize('sortOrder', "Controls the property-based sorting of files and folders in the Explorer. When `#explorer.fileNesting.enabled#` is enabled, also controls sorting of nested files.")
            },
            'explorer.sortOrderLexicographicOptions': {
                'type': 'string',
                'enum': ["default" /* LexicographicOptions.Default */, "upper" /* LexicographicOptions.Upper */, "lower" /* LexicographicOptions.Lower */, "unicode" /* LexicographicOptions.Unicode */],
                'default': "default" /* LexicographicOptions.Default */,
                'enumDescriptions': [
                    nls.localize('sortOrderLexicographicOptions.default', 'Uppercase and lowercase names are mixed together.'),
                    nls.localize('sortOrderLexicographicOptions.upper', 'Uppercase names are grouped together before lowercase names.'),
                    nls.localize('sortOrderLexicographicOptions.lower', 'Lowercase names are grouped together before uppercase names.'),
                    nls.localize('sortOrderLexicographicOptions.unicode', 'Names are sorted in Unicode order.')
                ],
                'description': nls.localize('sortOrderLexicographicOptions', "Controls the lexicographic sorting of file and folder names in the Explorer.")
            },
            'explorer.decorations.colors': {
                type: 'boolean',
                description: nls.localize('explorer.decorations.colors', "Controls whether file decorations should use colors."),
                default: true
            },
            'explorer.decorations.badges': {
                type: 'boolean',
                description: nls.localize('explorer.decorations.badges', "Controls whether file decorations should use badges."),
                default: true
            },
            'explorer.incrementalNaming': {
                'type': 'string',
                enum: ['simple', 'smart', 'disabled'],
                enumDescriptions: [
                    nls.localize('simple', "Appends the word \"copy\" at the end of the duplicated name potentially followed by a number."),
                    nls.localize('smart', "Adds a number at the end of the duplicated name. If some number is already part of the name, tries to increase that number."),
                    nls.localize('disabled', "Disables incremental naming. If two files with the same name exist you will be prompted to overwrite the existing file.")
                ],
                description: nls.localize('explorer.incrementalNaming', "Controls which naming strategy to use when giving a new name to a duplicated Explorer item on paste."),
                default: 'simple'
            },
            'explorer.compactFolders': {
                'type': 'boolean',
                'description': nls.localize('compressSingleChildFolders', "Controls whether the Explorer should render folders in a compact form. In such a form, single child folders will be compressed in a combined tree element. Useful for Java package structures, for example."),
                'default': true
            },
            'explorer.copyRelativePathSeparator': {
                'type': 'string',
                'enum': [
                    '/',
                    '\\',
                    'auto'
                ],
                'enumDescriptions': [
                    nls.localize('copyRelativePathSeparator.slash', "Use slash as path separation character."),
                    nls.localize('copyRelativePathSeparator.backslash', "Use backslash as path separation character."),
                    nls.localize('copyRelativePathSeparator.auto', "Uses operating system specific path separation character."),
                ],
                'description': nls.localize('copyRelativePathSeparator', "The path separation character used when copying relative file paths."),
                'default': 'auto'
            },
            'explorer.excludeGitIgnore': {
                type: 'boolean',
                markdownDescription: nls.localize('excludeGitignore', "Controls whether entries in .gitignore should be parsed and excluded from the Explorer. Similar to {0}.", '`#files.exclude#`'),
                default: false,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            'explorer.fileNesting.enabled': {
                'type': 'boolean',
                scope: 4 /* ConfigurationScope.RESOURCE */,
                'markdownDescription': nls.localize('fileNestingEnabled', "Controls whether file nesting is enabled in the Explorer. File nesting allows for related files in a directory to be visually grouped together under a single parent file."),
                'default': false,
            },
            'explorer.fileNesting.expand': {
                'type': 'boolean',
                'markdownDescription': nls.localize('fileNestingExpand', "Controls whether file nests are automatically expanded. {0} must be set for this to take effect.", '`#explorer.fileNesting.enabled#`'),
                'default': true,
            },
            'explorer.fileNesting.patterns': {
                'type': 'object',
                scope: 4 /* ConfigurationScope.RESOURCE */,
                'markdownDescription': nls.localize('fileNestingPatterns', "Controls nesting of files in the Explorer. {0} must be set for this to take effect. Each __Item__ represents a parent pattern and may contain a single `*` character that matches any string. Each __Value__ represents a comma separated list of the child patterns that should be shown nested under a given parent. Child patterns may contain several special tokens:\n- `${capture}`: Matches the resolved value of the `*` from the parent pattern\n- `${basename}`: Matches the parent file's basename, the `file` in `file.ts`\n- `${extname}`: Matches the parent file's extension, the `ts` in `file.ts`\n- `${dirname}`: Matches the parent file's directory name, the `src` in `src/file.ts`\n- `*`:  Matches any string, may only be used once per child pattern", '`#explorer.fileNesting.enabled#`'),
                patternProperties: {
                    '^[^*]*\\*?[^*]*$': {
                        markdownDescription: nls.localize('fileNesting.description', "Each key pattern may contain a single `*` character which will match any string."),
                        type: 'string',
                        pattern: '^([^,*]*\\*?[^,*]*)(, ?[^,*]*\\*?[^,*]*)*$',
                    }
                },
                additionalProperties: false,
                'default': {
                    '*.ts': '${capture}.js',
                    '*.js': '${capture}.js.map, ${capture}.min.js, ${capture}.d.ts',
                    '*.jsx': '${capture}.js',
                    '*.tsx': '${capture}.ts',
                    'tsconfig.json': 'tsconfig.*.json',
                    'package.json': 'package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb',
                }
            }
        }
    });
    editorExtensions_1.UndoCommand.addImplementation(110, 'explorer', (accessor) => {
        const undoRedoService = accessor.get(undoRedo_1.IUndoRedoService);
        const explorerService = accessor.get(files_3.IExplorerService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const explorerCanUndo = configurationService.getValue().explorer.enableUndo;
        if (explorerService.hasViewFocus() && undoRedoService.canUndo(explorerService_1.UNDO_REDO_SOURCE) && explorerCanUndo) {
            undoRedoService.undo(explorerService_1.UNDO_REDO_SOURCE);
            return true;
        }
        return false;
    });
    editorExtensions_1.RedoCommand.addImplementation(110, 'explorer', (accessor) => {
        const undoRedoService = accessor.get(undoRedo_1.IUndoRedoService);
        const explorerService = accessor.get(files_3.IExplorerService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const explorerCanUndo = configurationService.getValue().explorer.enableUndo;
        if (explorerService.hasViewFocus() && undoRedoService.canRedo(explorerService_1.UNDO_REDO_SOURCE) && explorerCanUndo) {
            undoRedoService.redo(explorerService_1.UNDO_REDO_SOURCE);
            return true;
        }
        return false;
    });
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: files_2.BINARY_TEXT_FILE_MODE,
        aliases: ['Binary'],
        mimetypes: ['text/x-code-binary']
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9maWxlcy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFtQ2hHLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXdCO2lCQUViLE9BQUUsR0FBRyxnQ0FBZ0MsQUFBbkMsQ0FBb0M7UUFFdEQsWUFBMkIsWUFBMkI7WUFDckQsWUFBWSxDQUFDLGlCQUFpQixDQUFDO2dCQUM5QixNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJO2dCQUNwQixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLHFCQUFxQjtvQkFDNUIsU0FBUyxFQUFFLFVBQUc7b0JBQ2QsT0FBTyxFQUFFLENBQUMsb0JBQVM7b0JBQ25CLG9CQUFvQixFQUFFLG9CQUFTO29CQUMvQixlQUFlLEVBQUUsVUFBRyxHQUFHLFVBQUc7b0JBQzFCLGVBQWUsRUFBRSxFQUFFO2lCQUNuQjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7O0lBaEJJLHdCQUF3QjtRQUloQixXQUFBLHFCQUFhLENBQUE7T0FKckIsd0JBQXdCLENBaUI3QjtJQUVELElBQUEsOEJBQWlCLEVBQUMsd0JBQWdCLEVBQUUsaUNBQWUsb0NBQTRCLENBQUM7SUFFaEYsd0JBQXdCO0lBRXhCLG1CQUFRLENBQUMsRUFBRSxDQUFzQix5QkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsQ0FDL0UsNkJBQW9CLENBQUMsTUFBTSxDQUMxQiwrQkFBYyxFQUNkLCtCQUFjLENBQUMsRUFBRSxFQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQ2xELEVBQ0Q7UUFDQyxJQUFJ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