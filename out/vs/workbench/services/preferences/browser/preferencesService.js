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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/editor/browser/coreCommands", "vs/editor/browser/editorBrowser", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/browser/keybindingsEditorInput", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesEditorInput", "vs/workbench/services/preferences/common/preferencesModels", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/textfile/common/textEditorService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/types", "vs/editor/contrib/suggest/browser/suggestController", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, errors_1, event_1, json_1, lifecycle_1, network, uri_1, coreCommands_1, editorBrowser_1, model_1, language_1, resolverService_1, nls, configuration_1, configurationRegistry_1, extensions_1, instantiation_1, keybinding_1, label_1, notification_1, platform_1, workspace_1, editor_1, sideBySideEditorInput_1, textResourceEditorInput_1, jsonEditing_1, editorGroupsService_1, editorService_1, keybindingsEditorInput_1, preferences_1, preferencesEditorInput_1, preferencesModels_1, remoteAgentService_1, textEditorService_1, textfiles_1, types_1, suggestController_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreferencesService = void 0;
    const emptyEditableSettingsContent = '{\n}';
    let PreferencesService = class PreferencesService extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupService, textFileService, configurationService, notificationService, contextService, instantiationService, userDataProfileService, userDataProfilesService, textModelResolverService, keybindingService, modelService, jsonEditingService, languageService, labelService, remoteAgentService, textEditorService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.textModelResolverService = textModelResolverService;
            this.modelService = modelService;
            this.jsonEditingService = jsonEditingService;
            this.languageService = languageService;
            this.labelService = labelService;
            this.remoteAgentService = remoteAgentService;
            this.textEditorService = textEditorService;
            this._onDispose = this._register(new event_1.Emitter());
            this.defaultKeybindingsResource = uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: '/keybindings.json' });
            this.defaultSettingsRawResource = uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: '/defaultSettings.json' });
            // The default keybindings.json updates based on keyboard layouts, so here we make sure
            // if a model has been given out we update it accordingly.
            this._register(keybindingService.onDidUpdateKeybindings(() => {
                const model = modelService.getModel(this.defaultKeybindingsResource);
                if (!model) {
                    // model has not been given out => nothing to do
                    return;
                }
                modelService.updateModel(model, (0, preferencesModels_1.defaultKeybindingsContents)(keybindingService));
            }));
        }
        get userSettingsResource() {
            return this.userDataProfileService.currentProfile.settingsResource;
        }
        get workspaceSettingsResource() {
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return null;
            }
            const workspace = this.contextService.getWorkspace();
            return workspace.configuration || workspace.folders[0].toResource(preferences_1.FOLDER_SETTINGS_PATH);
        }
        createSettingsEditor2Input() {
            return new preferencesEditorInput_1.SettingsEditor2Input(this);
        }
        getFolderSettingsResource(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            return folder ? folder.toResource(preferences_1.FOLDER_SETTINGS_PATH) : null;
        }
        resolveModel(uri) {
            if (this.isDefaultSettingsResource(uri)) {
                // We opened a split json editor in this case,
                // and this half shows the default settings.
                const target = this.getConfigurationTargetFromDefaultSettingsResource(uri);
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel('', languageSelection, uri));
                let defaultSettings;
                this.configurationService.onDidChangeConfiguration(e => {
                    if (e.source === 7 /* ConfigurationTarget.DEFAULT */) {
                        const model = this.modelService.getModel(uri);
                        if (!model) {
                            // model has not been given out => nothing to do
                            return;
                        }
                        defaultSettings = this.getDefaultSettings(target);
                        this.modelService.updateModel(model, defaultSettings.getContentWithoutMostCommonlyUsed(true));
                        defaultSettings._onDidChange.fire();
                    }
                });
                // Check if Default settings is already created and updated in above promise
                if (!defaultSettings) {
                    defaultSettings = this.getDefaultSettings(target);
                    this.modelService.updateModel(model, defaultSettings.getContentWithoutMostCommonlyUsed(true));
                }
                return model;
            }
            if (this.defaultSettingsRawResource.toString() === uri.toString()) {
                const defaultRawSettingsEditorModel = this.instantiationService.createInstance(preferencesModels_1.DefaultRawSettingsEditorModel, this.getDefaultSettings(3 /* ConfigurationTarget.USER_LOCAL */));
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel(defaultRawSettingsEditorModel.content, languageSelection, uri));
                return model;
            }
            if (this.defaultKeybindingsResource.toString() === uri.toString()) {
                const defaultKeybindingsEditorModel = this.instantiationService.createInstance(preferencesModels_1.DefaultKeybindingsEditorModel, uri);
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel(defaultKeybindingsEditorModel.content, languageSelection, uri));
                return model;
            }
            return null;
        }
        async createPreferencesEditorModel(uri) {
            if (this.isDefaultSettingsResource(uri)) {
                return this.createDefaultSettingsEditorModel(uri);
            }
            if (this.userSettingsResource.toString() === uri.toString() || this.userDataProfilesService.defaultProfile.settingsResource.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(3 /* ConfigurationTarget.USER_LOCAL */, uri);
            }
            const workspaceSettingsUri = await this.getEditableSettingsURI(5 /* ConfigurationTarget.WORKSPACE */);
            if (workspaceSettingsUri && workspaceSettingsUri.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(5 /* ConfigurationTarget.WORKSPACE */, workspaceSettingsUri);
            }
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                const settingsUri = await this.getEditableSettingsURI(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, uri);
                if (settingsUri && settingsUri.toString() === uri.toString()) {
                    return this.createEditableSettingsEditorModel(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, uri);
                }
            }
            const remoteEnvironment = await this.remoteAgentService.getEnvironment();
            const remoteSettingsUri = remoteEnvironment ? remoteEnvironment.settingsPath : null;
            if (remoteSettingsUri && remoteSettingsUri.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(4 /* ConfigurationTarget.USER_REMOTE */, uri);
            }
            return null;
        }
        openRawDefaultSettings() {
            return this.editorService.openEditor({ resource: this.defaultSettingsRawResource });
        }
        openRawUserSettings() {
            return this.editorService.openEditor({ resource: this.userSettingsResource });
        }
        shouldOpenJsonByDefault() {
            return this.configurationService.getValue('workbench.settings.editor') === 'json';
        }
        openSettings(options = {}) {
            options = {
                ...options,
                target: 3 /* ConfigurationTarget.USER_LOCAL */,
            };
            if (options.query) {
                options.jsonEditor = false;
            }
            return this.open(this.userSettingsResource, options);
        }
        openLanguageSpecificSettings(languageId, options = {}) {
            if (this.shouldOpenJsonByDefault()) {
                options.query = undefined;
                options.revealSetting = { key: `[${languageId}]`, edit: true };
            }
            else {
                options.query = `@lang:${languageId}${options.query ? ` ${options.query}` : ''}`;
            }
            options.target = options.target ?? 3 /* ConfigurationTarget.USER_LOCAL */;
            return this.open(this.userSettingsResource, options);
        }
        open(settingsResource, options) {
            options = {
                ...options,
                jsonEditor: options.jsonEditor ?? this.shouldOpenJsonByDefault()
            };
            return options.jsonEditor ?
                this.openSettingsJson(settingsResource, options) :
                this.openSettings2(options);
        }
        async openSettings2(options) {
            const input = this.createSettingsEditor2Input();
            options = {
                ...options,
                focusSearch: true
            };
            await this.editorService.openEditor(input, (0, preferences_1.validateSettingsEditorOptions)(options), options.openToSide ? editorService_1.SIDE_GROUP : undefined);
            return this.editorGroupService.activeGroup.activeEditorPane;
        }
        openApplicationSettings(options = {}) {
            options = {
                ...options,
                target: 3 /* ConfigurationTarget.USER_LOCAL */,
            };
            return this.open(this.userDataProfilesService.defaultProfile.settingsResource, options);
        }
        openUserSettings(options = {}) {
            options = {
                ...options,
                target: 3 /* ConfigurationTarget.USER_LOCAL */,
            };
            return this.open(this.userSettingsResource, options);
        }
        async openRemoteSettings(options = {}) {
            const environment = await this.remoteAgentService.getEnvironment();
            if (environment) {
                options = {
                    ...options,
                    target: 4 /* ConfigurationTarget.USER_REMOTE */,
                };
                this.open(environment.settingsPath, options);
            }
            return undefined;
        }
        openWorkspaceSettings(options = {}) {
            if (!this.workspaceSettingsResource) {
                this.notificationService.info(nls.localize('openFolderFirst', "Open a folder or workspace first to create workspace or folder settings."));
                return Promise.reject(null);
            }
            options = {
                ...options,
                target: 5 /* ConfigurationTarget.WORKSPACE */
            };
            return this.open(this.workspaceSettingsResource, options);
        }
        async openFolderSettings(options = {}) {
            options = {
                ...options,
                target: 6 /* ConfigurationTarget.WORKSPACE_FOLDER */
            };
            if (!options.folderUri) {
                throw new Error(`Missing folder URI`);
            }
            const folderSettingsUri = await this.getEditableSettingsURI(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, options.folderUri);
            if (!folderSettingsUri) {
                throw new Error(`Invalid folder URI - ${options.folderUri.toString()}`);
            }
            return this.open(folderSettingsUri, options);
        }
        async openGlobalKeybindingSettings(textual, options) {
            options = { pinned: true, revealIfOpened: true, ...options };
            if (textual) {
                const emptyContents = '// ' + nls.localize('emptyKeybindingsHeader', "Place your key bindings in this file to override the defaults") + '\n[\n]';
                const editableKeybindings = this.userDataProfileService.currentProfile.keybindingsResource;
                const openDefaultKeybindings = !!this.configurationService.getValue('workbench.settings.openDefaultKeybindings');
                // Create as needed and open in editor
                await this.createIfNotExists(editableKeybindings, emptyContents);
                if (openDefaultKeybindings) {
                    const activeEditorGroup = this.editorGroupService.activeGroup;
                    const sideEditorGroup = this.editorGroupService.addGroup(activeEditorGroup.id, 3 /* GroupDirection.RIGHT */);
                    await Promise.all([
                        this.editorService.openEditor({ resource: this.defaultKeybindingsResource, options: { pinned: true, preserveFocus: true, revealIfOpened: true, override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }, label: nls.localize('defaultKeybindings', "Default Keybindings"), description: '' }),
                        this.editorService.openEditor({ resource: editableKeybindings, options }, sideEditorGroup.id)
                    ]);
                }
                else {
                    await this.editorService.openEditor({ resource: editableKeybindings, options });
                }
            }
            else {
                const editor = (await this.editorService.openEditor(this.instantiationService.createInstance(keybindingsEditorInput_1.KeybindingsEditorInput), { ...options }));
                if (options.query) {
                    editor.search(options.query);
                }
            }
        }
        openDefaultKeybindingsFile() {
            return this.editorService.openEditor({ resource: this.defaultKeybindingsResource, label: nls.localize('defaultKeybindings', "Default Keybindings") });
        }
        async openSettingsJson(resource, options) {
            const group = options?.openToSide ? editorService_1.SIDE_GROUP : undefined;
            const editor = await this.doOpenSettingsJson(resource, options, group);
            if (editor && options?.revealSetting) {
                await this.revealSetting(options.revealSetting.key, !!options.revealSetting.edit, editor, resource);
            }
            return editor;
        }
        async doOpenSettingsJson(resource, options, group) {
            const openSplitJSON = !!this.configurationService.getValue(preferences_1.USE_SPLIT_JSON_SETTING);
            const openDefaultSettings = !!this.configurationService.getValue(preferences_1.DEFAULT_SETTINGS_EDITOR_SETTING);
            if (openSplitJSON || openDefaultSettings) {
                return this.doOpenSplitJSON(resource, options, group);
            }
            const configurationTarget = options?.target ?? 2 /* ConfigurationTarget.USER */;
            const editableSettingsEditorInput = await this.getOrCreateEditableSettingsEditorInput(configurationTarget, resource);
            options = { ...options, pinned: true };
            return await this.editorService.openEditor(editableSettingsEditorInput, (0, preferences_1.validateSettingsEditorOptions)(options), group);
        }
        async doOpenSplitJSON(resource, options = {}, group) {
            const configurationTarget = options.target ?? 2 /* ConfigurationTarget.USER */;
            await this.createSettingsIfNotExists(configurationTarget, resource);
            const preferencesEditorInput = this.createSplitJsonEditorInput(configurationTarget, resource);
            options = { ...options, pinned: true };
            return this.editorService.openEditor(preferencesEditorInput, (0, preferences_1.validateSettingsEditorOptions)(options), group);
        }
        createSplitJsonEditorInput(configurationTarget, resource) {
            const editableSettingsEditorInput = this.textEditorService.createTextEditor({ resource });
            const defaultPreferencesEditorInput = this.instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, this.getDefaultSettingsResource(configurationTarget), undefined, undefined, undefined, undefined);
            return this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, editableSettingsEditorInput.getName(), undefined, defaultPreferencesEditorInput, editableSettingsEditorInput);
        }
        createSettings2EditorModel() {
            return this.instantiationService.createInstance(preferencesModels_1.Settings2EditorModel, this.getDefaultSettings(3 /* ConfigurationTarget.USER_LOCAL */));
        }
        getConfigurationTargetFromDefaultSettingsResource(uri) {
            return this.isDefaultWorkspaceSettingsResource(uri) ?
                5 /* ConfigurationTarget.WORKSPACE */ :
                this.isDefaultFolderSettingsResource(uri) ?
                    6 /* ConfigurationTarget.WORKSPACE_FOLDER */ :
                    3 /* ConfigurationTarget.USER_LOCAL */;
        }
        isDefaultSettingsResource(uri) {
            return this.isDefaultUserSettingsResource(uri) || this.isDefaultWorkspaceSettingsResource(uri) || this.isDefaultFolderSettingsResource(uri);
        }
        isDefaultUserSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?settings\.json$/);
        }
        isDefaultWorkspaceSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?workspaceSettings\.json$/);
        }
        isDefaultFolderSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?resourceSettings\.json$/);
        }
        getDefaultSettingsResource(configurationTarget) {
            switch (configurationTarget) {
                case 5 /* ConfigurationTarget.WORKSPACE */:
                    return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/workspaceSettings.json` });
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/resourceSettings.json` });
            }
            return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/settings.json` });
        }
        async getOrCreateEditableSettingsEditorInput(target, resource) {
            await this.createSettingsIfNotExists(target, resource);
            return this.textEditorService.createTextEditor({ resource });
        }
        async createEditableSettingsEditorModel(configurationTarget, settingsUri) {
            const workspace = this.contextService.getWorkspace();
            if (workspace.configuration && workspace.configuration.toString() === settingsUri.toString()) {
                const reference = await this.textModelResolverService.createModelReference(settingsUri);
                return this.instantiationService.createInstance(preferencesModels_1.WorkspaceConfigurationEditorModel, reference, configurationTarget);
            }
            const reference = await this.textModelResolverService.createModelReference(settingsUri);
            return this.instantiationService.createInstance(preferencesModels_1.SettingsEditorModel, reference, configurationTarget);
        }
        async createDefaultSettingsEditorModel(defaultSettingsUri) {
            const reference = await this.textModelResolverService.createModelReference(defaultSettingsUri);
            const target = this.getConfigurationTargetFromDefaultSettingsResource(defaultSettingsUri);
            return this.instantiationService.createInstance(preferencesModels_1.DefaultSettingsEditorModel, defaultSettingsUri, reference, this.getDefaultSettings(target));
        }
        getDefaultSettings(target) {
            if (target === 5 /* ConfigurationTarget.WORKSPACE */) {
                this._defaultWorkspaceSettingsContentModel ??= this._register(new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target));
                return this._defaultWorkspaceSettingsContentModel;
            }
            if (target === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                this._defaultFolderSettingsContentModel ??= this._register(new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target));
                return this._defaultFolderSettingsContentModel;
            }
            this._defaultUserSettingsContentModel ??= this._register(new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target));
            return this._defaultUserSettingsContentModel;
        }
        async getEditableSettingsURI(configurationTarget, resource) {
            switch (configurationTarget) {
                case 1 /* ConfigurationTarget.APPLICATION */:
                    return this.userDataProfilesService.defaultProfile.settingsResource;
                case 2 /* ConfigurationTarget.USER */:
                case 3 /* ConfigurationTarget.USER_LOCAL */:
                    return this.userSettingsResource;
                case 4 /* ConfigurationTarget.USER_REMOTE */: {
                    const remoteEnvironment = await this.remoteAgentService.getEnvironment();
                    return remoteEnvironment ? remoteEnvironment.settingsPath : null;
                }
                case 5 /* ConfigurationTarget.WORKSPACE */:
                    return this.workspaceSettingsResource;
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    if (resource) {
                        return this.getFolderSettingsResource(resource);
                    }
            }
            return null;
        }
        async createSettingsIfNotExists(target, resource) {
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ && target === 5 /* ConfigurationTarget.WORKSPACE */) {
                const workspaceConfig = this.contextService.getWorkspace().configuration;
                if (!workspaceConfig) {
                    return;
                }
                const content = await this.textFileService.read(workspaceConfig);
                if (Object.keys((0, json_1.parse)(content.value)).indexOf('settings') === -1) {
                    await this.jsonEditingService.write(resource, [{ path: ['settings'], value: {} }], true);
                }
                return undefined;
            }
            await this.createIfNotExists(resource, emptyEditableSettingsContent);
        }
        async createIfNotExists(resource, contents) {
            try {
                await this.textFileService.read(resource, { acceptTextOnly: true });
            }
            catch (error) {
                if (error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    try {
                        await this.textFileService.write(resource, contents);
                        return;
                    }
                    catch (error2) {
                        throw new Error(nls.localize('fail.createSettings', "Unable to create '{0}' ({1}).", this.labelService.getUriLabel(resource, { relative: true }), (0, errors_1.getErrorMessage)(error2)));
                    }
                }
                else {
                    throw error;
                }
            }
        }
        getMostCommonlyUsedSettings() {
            return [
                'files.autoSave',
                'editor.fontSize',
                'editor.fontFamily',
                'editor.tabSize',
                'editor.renderWhitespace',
                'editor.cursorStyle',
                'editor.multiCursorModifier',
                'editor.insertSpaces',
                'editor.wordWrap',
                'files.exclude',
                'files.associations',
                'workbench.editor.enablePreview'
            ];
        }
        async revealSetting(settingKey, edit, editor, settingsResource) {
            const codeEditor = editor ? (0, editorBrowser_1.getCodeEditor)(editor.getControl()) : null;
            if (!codeEditor) {
                return;
            }
            const settingsModel = await this.createPreferencesEditorModel(settingsResource);
            if (!settingsModel) {
                return;
            }
            const position = await this.getPositionToReveal(settingKey, edit, settingsModel, codeEditor);
            if (position) {
                codeEditor.setPosition(position);
                codeEditor.revealPositionNearTop(position);
                codeEditor.focus();
                if (edit) {
                    suggestController_1.SuggestController.get(codeEditor)?.triggerSuggest();
                }
            }
        }
        async getPositionToReveal(settingKey, edit, settingsModel, codeEditor) {
            const model = codeEditor.getModel();
            if (!model) {
                return null;
            }
            const schema = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties()[settingKey];
            const isOverrideProperty = configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(settingKey);
            if (!schema && !isOverrideProperty) {
                return null;
            }
            let position = null;
            const type = schema?.type ?? 'object' /* Type not defined or is an Override Identifier */;
            let setting = settingsModel.getPreference(settingKey);
            if (!setting && edit) {
                let defaultValue = (type === 'object' || type === 'array') ? this.configurationService.inspect(settingKey).defaultValue : (0, configurationRegistry_1.getDefaultValue)(type);
                defaultValue = defaultValue === undefined && isOverrideProperty ? {} : defaultValue;
                if (defaultValue !== undefined) {
                    const key = settingsModel instanceof preferencesModels_1.WorkspaceConfigurationEditorModel ? ['settings', settingKey] : [settingKey];
                    await this.jsonEditingService.write(settingsModel.uri, [{ path: key, value: defaultValue }], false);
                    setting = settingsModel.getPreference(settingKey);
                }
            }
            if (setting) {
                if (edit) {
                    if ((0, types_1.isObject)(setting.value) || Array.isArray(setting.value)) {
                        position = { lineNumber: setting.valueRange.startLineNumber, column: setting.valueRange.startColumn + 1 };
                        codeEditor.setPosition(position);
                        await coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, codeEditor, null);
                        position = { lineNumber: position.lineNumber + 1, column: model.getLineMaxColumn(position.lineNumber + 1) };
                        const firstNonWhiteSpaceColumn = model.getLineFirstNonWhitespaceColumn(position.lineNumber);
                        if (firstNonWhiteSpaceColumn) {
                            // Line has some text. Insert another new line.
                            codeEditor.setPosition({ lineNumber: position.lineNumber, column: firstNonWhiteSpaceColumn });
                            await coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, codeEditor, null);
                            position = { lineNumber: position.lineNumber, column: model.getLineMaxColumn(position.lineNumber) };
                        }
                    }
                    else {
                        position = { lineNumber: setting.valueRange.startLineNumber, column: setting.valueRange.endColumn };
                    }
                }
                else {
                    position = { lineNumber: setting.keyRange.startLineNumber, column: setting.keyRange.startColumn };
                }
            }
            return position;
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    };
    exports.PreferencesService = PreferencesService;
    exports.PreferencesService = PreferencesService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, notification_1.INotificationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, userDataProfile_1.IUserDataProfileService),
        __param(8, userDataProfile_2.IUserDataProfilesService),
        __param(9, resolverService_1.ITextModelService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, model_1.IModelService),
        __param(12, jsonEditing_1.IJSONEditingService),
        __param(13, language_1.ILanguageService),
        __param(14, label_1.ILabelService),
        __param(15, remoteAgentService_1.IRemoteAgentService),
        __param(16, textEditorService_1.ITextEditorService)
    ], PreferencesService);
    (0, extensions_1.registerSingleton)(preferences_1.IPreferencesService, PreferencesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3ByZWZlcmVuY2VzL2Jyb3dzZXIvcHJlZmVyZW5jZXNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZDaEcsTUFBTSw0QkFBNEIsR0FBRyxNQUFNLENBQUM7SUFFckMsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQVVqRCxZQUNpQixhQUE4QyxFQUN4QyxrQkFBeUQsRUFDN0QsZUFBa0QsRUFDN0Msb0JBQTRELEVBQzdELG1CQUEwRCxFQUN0RCxjQUF5RCxFQUM1RCxvQkFBNEQsRUFDMUQsc0JBQWdFLEVBQy9ELHVCQUFrRSxFQUN6RSx3QkFBNEQsRUFDM0QsaUJBQXFDLEVBQzFDLFlBQTRDLEVBQ3RDLGtCQUF3RCxFQUMzRCxlQUFrRCxFQUNyRCxZQUE0QyxFQUN0QyxrQkFBd0QsRUFDekQsaUJBQXNEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBbEJ5QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQUM1QyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDNUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM1Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3JDLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3pDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDOUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN4RCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQW1CO1lBRS9DLGlCQUFZLEdBQVosWUFB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