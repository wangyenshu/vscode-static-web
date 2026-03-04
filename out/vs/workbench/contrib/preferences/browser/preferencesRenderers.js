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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/themables", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/platform/registry/common/platform", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/codeeditor", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/browser/preferencesWidgets", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, dom_1, actions_1, async_1, event_1, lifecycle_1, map_1, resources_1, themables_1, position_1, range_1, textModel_1, languageFeatures_1, types_1, nls, configuration_1, configurationRegistry_1, contextView_1, instantiation_1, markers_1, platform_1, uriIdentity_1, userDataProfile_1, workspace_1, workspaceTrust_1, codeeditor_1, preferencesIcons_1, preferencesWidgets_1, configuration_2, environmentService_1, preferences_1, preferencesModels_1, userDataProfile_2) {
    "use strict";
    var WorkspaceConfigurationRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceSettingsRenderer = exports.UserSettingsRenderer = void 0;
    let UserSettingsRenderer = class UserSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, preferencesModel, preferencesService, configurationService, instantiationService) {
            super();
            this.editor = editor;
            this.preferencesModel = preferencesModel;
            this.preferencesService = preferencesService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.modelChangeDelayer = new async_1.Delayer(200);
            this.settingHighlighter = this._register(instantiationService.createInstance(SettingHighlighter, editor));
            this.editSettingActionRenderer = this._register(this.instantiationService.createInstance(EditSettingRenderer, this.editor, this.preferencesModel, this.settingHighlighter));
            this._register(this.editSettingActionRenderer.onUpdateSetting(({ key, value, source }) => this.updatePreference(key, value, source)));
            this._register(this.editor.getModel().onDidChangeContent(() => this.modelChangeDelayer.trigger(() => this.onModelChanged())));
            this.unsupportedSettingsRenderer = this._register(instantiationService.createInstance(UnsupportedSettingsRenderer, editor, preferencesModel));
        }
        render() {
            this.editSettingActionRenderer.render(this.preferencesModel.settingsGroups, this.associatedPreferencesModel);
            this.unsupportedSettingsRenderer.render();
        }
        updatePreference(key, value, source) {
            const overrideIdentifiers = source.overrideOf ? (0, configurationRegistry_1.overrideIdentifiersFromKey)(source.overrideOf.key) : null;
            const resource = this.preferencesModel.uri;
            this.configurationService.updateValue(key, value, { overrideIdentifiers, resource }, this.preferencesModel.configurationTarget)
                .then(() => this.onSettingUpdated(source));
        }
        onModelChanged() {
            if (!this.editor.hasModel()) {
                // model could have been disposed during the delay
                return;
            }
            this.render();
        }
        onSettingUpdated(setting) {
            this.editor.focus();
            setting = this.getSetting(setting);
            if (setting) {
                // TODO:@sandy Selection range should be template range
                this.editor.setSelection(setting.valueRange);
                this.settingHighlighter.highlight(setting, true);
            }
        }
        getSetting(setting) {
            const { key, overrideOf } = setting;
            if (overrideOf) {
                const setting = this.getSetting(overrideOf);
                for (const override of setting.overrides) {
                    if (override.key === key) {
                        return override;
                    }
                }
                return undefined;
            }
            return this.preferencesModel.getPreference(key);
        }
        focusPreference(setting) {
            const s = this.getSetting(setting);
            if (s) {
                this.settingHighlighter.highlight(s, true);
                this.editor.setPosition({ lineNumber: s.keyRange.startLineNumber, column: s.keyRange.startColumn });
            }
            else {
                this.settingHighlighter.clear(true);
            }
        }
        clearFocus(setting) {
            this.settingHighlighter.clear(true);
        }
        editPreference(setting) {
            const editableSetting = this.getSetting(setting);
            return !!(editableSetting && this.editSettingActionRenderer.activateOnSetting(editableSetting));
        }
    };
    exports.UserSettingsRenderer = UserSettingsRenderer;
    exports.UserSettingsRenderer = UserSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], UserSettingsRenderer);
    let WorkspaceSettingsRenderer = class WorkspaceSettingsRenderer extends UserSettingsRenderer {
        constructor(editor, preferencesModel, preferencesService, configurationService, instantiationService) {
            super(editor, preferencesModel, preferencesService, configurationService, instantiationService);
            this.workspaceConfigurationRenderer = this._register(instantiationService.createInstance(WorkspaceConfigurationRenderer, editor, preferencesModel));
        }
        render() {
            super.render();
            this.workspaceConfigurationRenderer.render();
        }
    };
    exports.WorkspaceSettingsRenderer = WorkspaceSettingsRenderer;
    exports.WorkspaceSettingsRenderer = WorkspaceSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], WorkspaceSettingsRenderer);
    let EditSettingRenderer = class EditSettingRenderer extends lifecycle_1.Disposable {
        constructor(editor, primarySettingsModel, settingHighlighter, configurationService, instantiationService, contextMenuService) {
            super();
            this.editor = editor;
            this.primarySettingsModel = primarySettingsModel;
            this.settingHighlighter = settingHighlighter;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.settingsGroups = [];
            this._onUpdateSetting = new event_1.Emitter();
            this.onUpdateSetting = this._onUpdateSetting.event;
            this.editPreferenceWidgetForCursorPosition = this._register(this.instantiationService.createInstance(preferencesWidgets_1.EditPreferenceWidget, editor));
            this.editPreferenceWidgetForMouseMove = this._register(this.instantiationService.createInstance(preferencesWidgets_1.EditPreferenceWidget, editor));
            this.toggleEditPreferencesForMouseMoveDelayer = new async_1.Delayer(75);
            this._register(this.editPreferenceWidgetForCursorPosition.onClick(e => this.onEditSettingClicked(this.editPreferenceWidgetForCursorPosition, e)));
            this._register(this.editPreferenceWidgetForMouseMove.onClick(e => this.onEditSettingClicked(this.editPreferenceWidgetForMouseMove, e)));
            this._register(this.editor.onDidChangeCursorPosition(positionChangeEvent => this.onPositionChanged(positionChangeEvent)));
            this._register(this.editor.onMouseMove(mouseMoveEvent => this.onMouseMoved(mouseMoveEvent)));
            this._register(this.editor.onDidChangeConfiguration(() => this.onConfigurationChanged()));
        }
        render(settingsGroups, associatedPreferencesModel) {
            this.editPreferenceWidgetForCursorPosition.hide();
            this.editPreferenceWidgetForMouseMove.hide();
            this.settingsGroups = settingsGroups;
            this.associatedPreferencesModel = associatedPreferencesModel;
            const settings = this.getSettings(this.editor.getPosition().lineNumber);
            if (settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForCursorPosition, settings);
            }
        }
        isDefaultSettings() {
            return this.primarySettingsModel instanceof preferencesModels_1.DefaultSettingsEditorModel;
        }
        onConfigurationChanged() {
            if (!this.editor.getOption(57 /* EditorOption.glyphMargin */)) {
                this.editPreferenceWidgetForCursorPosition.hide();
                this.editPreferenceWidgetForMouseMove.hide();
            }
        }
        onPositionChanged(positionChangeEvent) {
            this.editPreferenceWidgetForMouseMove.hide();
            const settings = this.getSettings(positionChangeEvent.position.lineNumber);
            if (settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForCursorPosition, settings);
            }
            else {
                this.editPreferenceWidgetForCursorPosition.hide();
            }
        }
        onMouseMoved(mouseMoveEvent) {
            const editPreferenceWidget = this.getEditPreferenceWidgetUnderMouse(mouseMoveEvent);
            if (editPreferenceWidget) {
                this.onMouseOver(editPreferenceWidget);
                return;
            }
            this.settingHighlighter.clear();
            this.toggleEditPreferencesForMouseMoveDelayer.trigger(() => this.toggleEditPreferenceWidgetForMouseMove(mouseMoveEvent));
        }
        getEditPreferenceWidgetUnderMouse(mouseMoveEvent) {
            if (mouseMoveEvent.target.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */) {
                const line = mouseMoveEvent.target.position.lineNumber;
                if (this.editPreferenceWidgetForMouseMove.getLine() === line && this.editPreferenceWidgetForMouseMove.isVisible()) {
                    return this.editPreferenceWidgetForMouseMove;
                }
                if (this.editPreferenceWidgetForCursorPosition.getLine() === line && this.editPreferenceWidgetForCursorPosition.isVisible()) {
                    return this.editPreferenceWidgetForCursorPosition;
                }
            }
            return undefined;
        }
        toggleEditPreferenceWidgetForMouseMove(mouseMoveEvent) {
            const settings = mouseMoveEvent.target.position ? this.getSettings(mouseMoveEvent.target.position.lineNumber) : null;
            if (settings && settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForMouseMove, settings);
            }
            else {
                this.editPreferenceWidgetForMouseMove.hide();
            }
        }
        showEditPreferencesWidget(editPreferencesWidget, settings) {
            const line = settings[0].valueRange.startLineNumber;
            if (this.editor.getOption(57 /* EditorOption.glyphMargin */) && this.marginFreeFromOtherDecorations(line)) {
                editPreferencesWidget.show(line, nls.localize('editTtile', "Edit"), settings);
                const editPreferenceWidgetToHide = editPreferencesWidget === this.editPreferenceWidgetForCursorPosition ? this.editPreferenceWidgetForMouseMove : this.editPreferenceWidgetForCursorPosition;
                editPreferenceWidgetToHide.hide();
            }
        }
        marginFreeFromOtherDecorations(line) {
            const decorations = this.editor.getLineDecorations(line);
            if (decorations) {
                for (const { options } of decorations) {
                    if (options.glyphMarginClassName && options.glyphMarginClassName.indexOf(themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon)) === -1) {
                        return false;
                    }
                }
            }
            return true;
        }
        getSettings(lineNumber) {
            const configurationMap = this.getConfigurationsMap();
            return this.getSettingsAtLineNumber(lineNumber).filter(setting => {
                const configurationNode = configurationMap[setting.key];
                if (configurationNode) {
                    if (configurationNode.policy && this.configurationService.inspect(setting.key).policyValue !== undefined) {
                        return false;
                    }
                    if (this.isDefaultSettings()) {
                        if (setting.key === 'launch') {
                            // Do not show because of https://github.com/microsoft/vscode/issues/32593
                            return false;
                        }
                        return true;
                    }
                    if (configurationNode.type === 'boolean' || configurationNode.enum) {
                        if (this.primarySettingsModel.configurationTarget !== 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                            return true;
                        }
                        if (configurationNode.scope === 4 /* ConfigurationScope.RESOURCE */ || configurationNode.scope === 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }
        getSettingsAtLineNumber(lineNumber) {
            // index of setting, across all groups/sections
            let index = 0;
            const settings = [];
            for (const group of this.settingsGroups) {
                if (group.range.startLineNumber > lineNumber) {
                    break;
                }
                if (lineNumber >= group.range.startLineNumber && lineNumber <= group.range.endLineNumber) {
                    for (const section of group.sections) {
                        for (const setting of section.settings) {
                            if (setting.range.startLineNumber > lineNumber) {
                                break;
                            }
                            if (lineNumber >= setting.range.startLineNumber && lineNumber <= setting.range.endLineNumber) {
                                if (!this.isDefaultSettings() && setting.overrides.length) {
                                    // Only one level because override settings cannot have override settings
                                    for (const overrideSetting of setting.overrides) {
                                        if (lineNumber >= overrideSetting.range.startLineNumber && lineNumber <= overrideSetting.range.endLineNumber) {
                                            settings.push({ ...overrideSetting, index, groupId: group.id });
                                        }
                                    }
                                }
                                else {
                                    settings.push({ ...setting, index, groupId: group.id });
                                }
                            }
                            index++;
                        }
                    }
                }
            }
            return settings;
        }
        onMouseOver(editPreferenceWidget) {
            this.settingHighlighter.highlight(editPreferenceWidget.preferences[0]);
        }
        onEditSettingClicked(editPreferenceWidget, e) {
            dom_1.EventHelper.stop(e.event, true);
            const actions = this.getSettings(editPreferenceWidget.getLine()).length === 1 ? this.getActions(editPreferenceWidget.preferences[0], this.getConfigurationsMap()[editPreferenceWidget.preferences[0].key])
                : editPreferenceWidget.preferences.map(setting => new actions_1.SubmenuAction(`preferences.submenu.${setting.key}`, setting.key, this.getActions(setting, this.getConfigurationsMap()[setting.key])));
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.event,
                getActions: () => actions
            });
        }
        activateOnSetting(setting) {
            const startLine = setting.keyRange.startLineNumber;
            const settings = this.getSettings(startLine);
            if (!settings.length) {
                return false;
            }
            this.editPreferenceWidgetForMouseMove.show(startLine, '', settings);
            const actions = this.getActions(this.editPreferenceWidgetForMouseMove.preferences[0], this.getConfigurationsMap()[this.editPreferenceWidgetForMouseMove.preferences[0].key]);
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.toAbsoluteCoords(new position_1.Position(startLine, 1)),
                getActions: () => actions
            });
            return true;
        }
        toAbsoluteCoords(position) {
            const positionCoords = this.editor.getScrolledVisiblePosition(position);
            const editorCoords = (0, dom_1.getDomNodePagePosition)(this.editor.getDomNode());
            const x = editorCoords.left + positionCoords.left;
            const y = editorCoords.top + positionCoords.top + positionCoords.height;
            return { x, y: y + 10 };
        }
        getConfigurationsMap() {
            return platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        }
        getActions(setting, jsonSchema) {
            if (jsonSchema.type === 'boolean') {
                return [{
                        id: 'truthyValue',
                        label: 'true',
                        enabled: true,
                        run: () => this.updateSetting(setting.key, true, setting)
                    }, {
                        id: 'falsyValue',
                        label: 'false',
                        enabled: true,
                        run: () => this.updateSetting(setting.key, false, setting)
                    }];
            }
            if (jsonSchema.enum) {
                return jsonSchema.enum.map(value => {
                    return {
                        id: value,
                        label: JSON.stringify(value),
                        enabled: true,
                        run: () => this.updateSetting(setting.key, value, setting)
                    };
                });
            }
            return this.getDefaultActions(setting);
        }
        getDefaultActions(setting) {
            if (this.isDefaultSettings()) {
                const settingInOtherModel = this.associatedPreferencesModel.getPreference(setting.key);
                return [{
                        id: 'setDefaultValue',
                        label: settingInOtherModel ? nls.localize('replaceDefaultValue', "Replace in Settings") : nls.localize('copyDefaultValue', "Copy to Settings"),
                        enabled: true,
                        run: () => this.updateSetting(setting.key, setting.value, setting)
                    }];
            }
            return [];
        }
        updateSetting(key, value, source) {
            this._onUpdateSetting.fire({ key, value, source });
        }
    };
    EditSettingRenderer = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextView_1.IContextMenuService)
    ], EditSettingRenderer);
    let SettingHighlighter = class SettingHighlighter extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.fixedHighlighter = this._register(instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
            this.volatileHighlighter = this._register(instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
        }
        highlight(setting, fix = false) {
            this.volatileHighlighter.removeHighlightRange();
            this.fixedHighlighter.removeHighlightRange();
            const highlighter = fix ? this.fixedHighlighter : this.volatileHighlighter;
            highlighter.highlightRange({
                range: setting.valueRange,
                resource: this.editor.getModel().uri
            }, this.editor);
            this.editor.revealLineInCenterIfOutsideViewport(setting.valueRange.startLineNumber, 0 /* editorCommon.ScrollType.Smooth */);
        }
        clear(fix = false) {
            this.volatileHighlighter.removeHighlightRange();
            if (fix) {
                this.fixedHighlighter.removeHighlightRange();
            }
        }
    };
    SettingHighlighter = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], SettingHighlighter);
    let UnsupportedSettingsRenderer = class UnsupportedSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, settingsEditorModel, markerService, environmentService, configurationService, workspaceTrustManagementService, uriIdentityService, languageFeaturesService, userDataProfileService, userDataProfilesService) {
            super();
            this.editor = editor;
            this.settingsEditorModel = settingsEditorModel;
            this.markerService = markerService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.uriIdentityService = uriIdentityService;
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.renderingDelayer = new async_1.Delayer(200);
            this.codeActions = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            this._register(this.editor.getModel().onDidChangeContent(() => this.delayedRender()));
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.source === 7 /* ConfigurationTarget.DEFAULT */)(() => this.delayedRender()));
            this._register(languageFeaturesService.codeActionProvider.register({ pattern: settingsEditorModel.uri.path }, this));
        }
        delayedRender() {
            this.renderingDelayer.trigger(() => this.render());
        }
        render() {
            this.codeActions.clear();
            const markerData = this.generateMarkerData();
            if (markerData.length) {
                this.markerService.changeOne('UnsupportedSettingsRenderer', this.settingsEditorModel.uri, markerData);
            }
            else {
                this.markerService.remove('UnsupportedSettingsRenderer', [this.settingsEditorModel.uri]);
            }
        }
        async provideCodeActions(model, range, context, token) {
            const actions = [];
            const codeActionsByRange = this.codeActions.get(model.uri);
            if (codeActionsByRange) {
                for (const [codeActionsRange, codeActions] of codeActionsByRange) {
                    if (codeActionsRange.containsRange(range)) {
                        actions.push(...codeActions);
                    }
                }
            }
            return {
                actions,
                dispose: () => { }
            };
        }
        generateMarkerData() {
            const markerData = [];
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            for (const settingsGroup of this.settingsEditorModel.settingsGroups) {
                for (const section of settingsGroup.sections) {
                    for (const setting of section.settings) {
                        if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(setting.key)) {
                            if (setting.overrides) {
                                this.handleOverrides(setting.overrides, configurationRegistry, markerData);
                            }
                            continue;
                        }
                        const configuration = configurationRegistry[setting.key];
                        if (configuration) {
                            if (this.handlePolicyConfiguration(setting, configuration, markerData)) {
                                continue;
                            }
                            switch (this.settingsEditorModel.configurationTarget) {
                                case 3 /* ConfigurationTarget.USER_LOCAL */:
                                    this.handleLocalUserConfiguration(setting, configuration, markerData);
                                    break;
                                case 4 /* ConfigurationTarget.USER_REMOTE */:
                                    this.handleRemoteUserConfiguration(setting, configuration, markerData);
                                    break;
                                case 5 /* ConfigurationTarget.WORKSPACE */:
                                    this.handleWorkspaceConfiguration(setting, configuration, markerData);
                                    break;
                                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                                    this.handleWorkspaceFolderConfiguration(setting, configuration, markerData);
                                    break;
                            }
                        }
                        else {
                            markerData.push(this.gemerateUnknownConfigurationMarker(setting));
                        }
                    }
                }
            }
            return markerData;
        }
        handlePolicyConfiguration(setting, configuration, markerData) {
            if (!configuration.policy) {
                return false;
            }
            if (this.configurationService.inspect(setting.key).policyValue === undefined) {
                return false;
            }
            if (this.settingsEditorModel.configurationTarget === 7 /* ConfigurationTarget.DEFAULT */) {
                return false;
            }
            markerData.push({
                severity: markers_1.MarkerSeverity.Hint,
                tags: [1 /* MarkerTag.Unnecessary */],
                ...setting.range,
                message: nls.localize('unsupportedPolicySetting', "This setting cannot be applied because it is configured in the system policy.")
            });
            return true;
        }
        handleOverrides(overrides, configurationRegistry, markerData) {
            for (const setting of overrides || []) {
                const configuration = configurationRegistry[setting.key];
                if (configuration) {
                    if (configuration.scope !== 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */) {
                        markerData.push({
                            severity: markers_1.MarkerSeverity.Hint,
                            tags: [1 /* MarkerTag.Unnecessary */],
                            ...setting.range,
                            message: nls.localize('unsupportLanguageOverrideSetting', "This setting cannot be applied because it is not registered as language override setting.")
                        });
                    }
                }
                else {
                    markerData.push(this.gemerateUnknownConfigurationMarker(setting));
                }
            }
        }
        handleLocalUserConfiguration(setting, configuration, markerData) {
            if (!this.userDataProfileService.currentProfile.isDefault && !this.userDataProfileService.currentProfile.useDefaultFlags?.settings) {
                if ((0, resources_1.isEqual)(this.userDataProfilesService.defaultProfile.settingsResource, this.settingsEditorModel.uri) && !this.configurationService.isSettingAppliedForAllProfiles(setting.key)) {
                    // If we're in the default profile setting file, and the setting cannot be applied in all profiles
                    markerData.push({
                        severity: markers_1.MarkerSeverity.Hint,
                        tags: [1 /* MarkerTag.Unnecessary */],
                        ...setting.range,
                        message: nls.localize('defaultProfileSettingWhileNonDefaultActive', "This setting cannot be applied while a non-default profile is active. It will be applied when the default profile is active.")
                    });
                }
                else if ((0, resources_1.isEqual)(this.userDataProfileService.currentProfile.settingsResource, this.settingsEditorModel.uri)) {
                    if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                        // If we're in a profile setting file, and the setting is application-scoped, fade it out.
                        markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
                    }
                    else if (this.configurationService.isSettingAppliedForAllProfiles(setting.key)) {
                        // If we're in the non-default profile setting file, and the setting can be applied in all profiles, fade it out.
                        markerData.push({
                            severity: markers_1.MarkerSeverity.Hint,
                            tags: [1 /* MarkerTag.Unnecessary */],
                            ...setting.range,
                            message: nls.localize('allProfileSettingWhileInNonDefaultProfileSetting', "This setting cannot be applied because it is configured to be applied in all profiles using setting {0}. Value from the default profile will be used instead.", configuration_2.APPLY_ALL_PROFILES_SETTING)
                        });
                    }
                }
            }
            if (this.environmentService.remoteAuthority && (configuration.scope === 2 /* ConfigurationScope.MACHINE */ || configuration.scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */)) {
                markerData.push({
                    severity: markers_1.MarkerSeverity.Hint,
                    tags: [1 /* MarkerTag.Unnecessary */],
                    ...setting.range,
                    message: nls.localize('unsupportedRemoteMachineSetting', "This setting cannot be applied in this window. It will be applied when you open a local window.")
                });
            }
        }
        handleRemoteUserConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
        }
        handleWorkspaceConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
            if (configuration.scope === 2 /* ConfigurationScope.MACHINE */) {
                markerData.push(this.generateUnsupportedMachineSettingMarker(setting));
            }
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted() && configuration.restricted) {
                const marker = this.generateUntrustedSettingMarker(setting);
                markerData.push(marker);
                const codeActions = this.generateUntrustedSettingCodeActions([marker]);
                this.addCodeActions(marker, codeActions);
            }
        }
        handleWorkspaceFolderConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
            if (configuration.scope === 2 /* ConfigurationScope.MACHINE */) {
                markerData.push(this.generateUnsupportedMachineSettingMarker(setting));
            }
            if (configuration.scope === 3 /* ConfigurationScope.WINDOW */) {
                markerData.push({
                    severity: markers_1.MarkerSeverity.Hint,
                    tags: [1 /* MarkerTag.Unnecessary */],
                    ...setting.range,
                    message: nls.localize('unsupportedWindowSetting', "This setting cannot be applied in this workspace. It will be applied when you open the containing workspace folder directly.")
                });
            }
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted() && configuration.restricted) {
                const marker = this.generateUntrustedSettingMarker(setting);
                markerData.push(marker);
                const codeActions = this.generateUntrustedSettingCodeActions([marker]);
                this.addCodeActions(marker, codeActions);
            }
        }
        generateUnsupportedApplicationSettingMarker(setting) {
            return {
                severity: markers_1.MarkerSeverity.Hint,
                tags: [1 /* MarkerTag.Unnecessary */],
                ...setting.range,
                message: nls.localize('unsupportedApplicationSetting', "This setting has an application scope and can be set only in the user settings file.")
            };
        }
        generateUnsupportedMachineSettingMarker(setting) {
            return {
                severity: markers_1.MarkerSeverity.Hint,
                tags: [1 /* MarkerTag.Unnecessary */],
                ...setting.range,
                message: nls.localize('unsupportedMachineSetting', "This setting can only be applied in user settings in local window or in remote settings in remote window.")
            };
        }
        generateUntrustedSettingMarker(setting) {
            return {
                severity: markers_1.MarkerSeverity.Warning,
                ...setting.range,
                message: nls.localize('untrustedSetting', "This setting can only be applied in a trusted workspace.")
            };
        }
        gemerateUnknownConfigurationMarker(setting) {
            return {
                severity: markers_1.MarkerSeverity.Hint,
                tags: [1 /* MarkerTag.Unnecessary */],
                ...setting.range,
                message: nls.localize('unknown configuration setting', "Unknown Configuration Setting")
            };
        }
        generateUntrustedSettingCodeActions(diagnostics) {
            return [{
                    title: nls.localize('manage workspace trust', "Manage Workspace Trust"),
                    command: {
                        id: 'workbench.trust.manage',
                        title: nls.localize('manage workspace trust', "Manage Workspace Trust")
                    },
                    diagnostics,
                    kind: types_1.CodeActionKind.QuickFix.value
                }];
        }
        addCodeActions(range, codeActions) {
            let actions = this.codeActions.get(this.settingsEditorModel.uri);
            if (!actions) {
                actions = [];
                this.codeActions.set(this.settingsEditorModel.uri, actions);
            }
            actions.push([range_1.Range.lift(range), codeActions]);
        }
        dispose() {
            this.markerService.remove('UnsupportedSettingsRenderer', [this.settingsEditorModel.uri]);
            this.codeActions.clear();
            super.dispose();
        }
    };
    UnsupportedSettingsRenderer = __decorate([
        __param(2, markers_1.IMarkerService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, configuration_2.IWorkbenchConfigurationService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, languageFeatures_1.ILanguageFeaturesService),
        __param(8, userDataProfile_2.IUserDataProfileService),
        __param(9, userDataProfile_1.IUserDataProfilesService)
    ], UnsupportedSettingsRenderer);
    let WorkspaceConfigurationRenderer = class WorkspaceConfigurationRenderer extends lifecycle_1.Disposable {
        static { WorkspaceConfigurationRenderer_1 = this; }
        static { this.supportedKeys = ['folders', 'tasks', 'launch', 'extensions', 'settings', 'remoteAuthority', 'transient']; }
        constructor(editor, workspaceSettingsEditorModel, workspaceContextService, markerService) {
            super();
            this.editor = editor;
            this.workspaceSettingsEditorModel = workspaceSettingsEditorModel;
            this.workspaceContextService = workspaceContextService;
            this.markerService = markerService;
            this.decorations = this.editor.createDecorationsCollection();
            this.renderingDelayer = new async_1.Delayer(200);
            this._register(this.editor.getModel().onDidChangeContent(() => this.renderingDelayer.trigger(() => this.render())));
        }
        render() {
            const markerData = [];
            if (this.workspaceContextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ && this.workspaceSettingsEditorModel instanceof preferencesModels_1.WorkspaceConfigurationEditorModel) {
                const ranges = [];
                for (const settingsGroup of this.workspaceSettingsEditorModel.configurationGroups) {
                    for (const section of settingsGroup.sections) {
                        for (const setting of section.settings) {
                            if (!WorkspaceConfigurationRenderer_1.supportedKeys.includes(setting.key)) {
                                markerData.push({
                                    severity: markers_1.MarkerSeverity.Hint,
                                    tags: [1 /* MarkerTag.Unnecessary */],
                                    ...setting.range,
                                    message: nls.localize('unsupportedProperty', "Unsupported Property")
                                });
                            }
                        }
                    }
                }
                this.decorations.set(ranges.map(range => this.createDecoration(range)));
            }
            if (markerData.length) {
                this.markerService.changeOne('WorkspaceConfigurationRenderer', this.workspaceSettingsEditorModel.uri, markerData);
            }
            else {
                this.markerService.remove('WorkspaceConfigurationRenderer', [this.workspaceSettingsEditorModel.uri]);
            }
        }
        static { this._DIM_CONFIGURATION_ = textModel_1.ModelDecorationOptions.register({
            description: 'dim-configuration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            inlineClassName: 'dim-configuration'
        }); }
        createDecoration(range) {
            return {
                range,
                options: WorkspaceConfigurationRenderer_1._DIM_CONFIGURATION_
            };
        }
        dispose() {
            this.markerService.remove('WorkspaceConfigurationRenderer', [this.workspaceSettingsEditorModel.uri]);
            this.decorations.clear();
            super.dispose();
        }
    };
    WorkspaceConfigurationRenderer = WorkspaceConfigurationRenderer_1 = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, markers_1.IMarkerService)
    ], WorkspaceConfigurationRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNSZW5kZXJlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL3ByZWZlcmVuY2VzUmVuZGVyZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxRHpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFTbkQsWUFBc0IsTUFBbUIsRUFBVyxnQkFBcUMsRUFDbkUsa0JBQWlELEVBQy9DLG9CQUE0RCxFQUM1RCxvQkFBcUQ7WUFFNUUsS0FBSyxFQUFFLENBQUM7WUFMYSxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQVcscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFxQjtZQUN6RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzlCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQVJyRSx1QkFBa0IsR0FBa0IsSUFBSSxlQUFPLENBQU8sR0FBRyxDQUFDLENBQUM7WUFXbEUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDMUcsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQzVLLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHlCQUF5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