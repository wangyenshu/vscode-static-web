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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/workbench/common/editor/editorModel", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/preferences/common/preferencesValidation"], function (require, exports, arrays_1, event_1, json_1, lifecycle_1, range_1, selection_1, nls, configuration_1, configurationRegistry_1, keybinding_1, platform_1, editorModel_1, preferences_1, configuration_2, preferencesValidation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultKeybindingsEditorModel = exports.DefaultRawSettingsEditorModel = exports.DefaultSettingsEditorModel = exports.DefaultSettings = exports.WorkspaceConfigurationEditorModel = exports.Settings2EditorModel = exports.SettingsEditorModel = exports.nullRange = void 0;
    exports.defaultKeybindingsContents = defaultKeybindingsContents;
    exports.nullRange = { startLineNumber: -1, startColumn: -1, endLineNumber: -1, endColumn: -1 };
    function isNullRange(range) { return range.startLineNumber === -1 && range.startColumn === -1 && range.endLineNumber === -1 && range.endColumn === -1; }
    class AbstractSettingsModel extends editorModel_1.EditorModel {
        constructor() {
            super(...arguments);
            this._currentResultGroups = new Map();
        }
        updateResultGroup(id, resultGroup) {
            if (resultGroup) {
                this._currentResultGroups.set(id, resultGroup);
            }
            else {
                this._currentResultGroups.delete(id);
            }
            this.removeDuplicateResults();
            return this.update();
        }
        /**
         * Remove duplicates between result groups, preferring results in earlier groups
         */
        removeDuplicateResults() {
            const settingKeys = new Set();
            [...this._currentResultGroups.keys()]
                .sort((a, b) => this._currentResultGroups.get(a).order - this._currentResultGroups.get(b).order)
                .forEach(groupId => {
                const group = this._currentResultGroups.get(groupId);
                group.result.filterMatches = group.result.filterMatches.filter(s => !settingKeys.has(s.setting.key));
                group.result.filterMatches.forEach(s => settingKeys.add(s.setting.key));
            });
        }
        filterSettings(filter, groupFilter, settingMatcher) {
            const allGroups = this.filterGroups;
            const filterMatches = [];
            for (const group of allGroups) {
                const groupMatched = groupFilter(group);
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        const settingMatchResult = settingMatcher(setting, group);
                        if (groupMatched || settingMatchResult) {
                            filterMatches.push({
                                setting,
                                matches: settingMatchResult && settingMatchResult.matches,
                                matchType: settingMatchResult?.matchType ?? preferences_1.SettingMatchType.None,
                                score: settingMatchResult?.score ?? 0
                            });
                        }
                    }
                }
            }
            return filterMatches;
        }
        getPreference(key) {
            for (const group of this.settingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        if (key === setting.key) {
                            return setting;
                        }
                    }
                }
            }
            return undefined;
        }
        collectMetadata(groups) {
            const metadata = Object.create(null);
            let hasMetadata = false;
            groups.forEach(g => {
                if (g.result.metadata) {
                    metadata[g.id] = g.result.metadata;
                    hasMetadata = true;
                }
            });
            return hasMetadata ? metadata : null;
        }
        get filterGroups() {
            return this.settingsGroups;
        }
    }
    class SettingsEditorModel extends AbstractSettingsModel {
        constructor(reference, _configurationTarget) {
            super();
            this._configurationTarget = _configurationTarget;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this.settingsModel = reference.object.textEditorModel;
            this._register(this.onWillDispose(() => reference.dispose()));
            this._register(this.settingsModel.onDidChangeContent(() => {
                this._settingsGroups = undefined;
                this._onDidChangeGroups.fire();
            }));
        }
        get uri() {
            return this.settingsModel.uri;
        }
        get configurationTarget() {
            return this._configurationTarget;
        }
        get settingsGroups() {
            if (!this._settingsGroups) {
                this.parse();
            }
            return this._settingsGroups;
        }
        get content() {
            return this.settingsModel.getValue();
        }
        findValueMatches(filter, setting) {
            return this.settingsModel.findMatches(filter, setting.valueRange, false, false, null, false).map(match => match.range);
        }
        isSettingsProperty(property, previousParents) {
            return previousParents.length === 0; // Settings is root
        }
        parse() {
            this._settingsGroups = parse(this.settingsModel, (property, previousParents) => this.isSettingsProperty(property, previousParents));
        }
        update() {
            const resultGroups = [...this._currentResultGroups.values()];
            if (!resultGroups.length) {
                return undefined;
            }
            // Transform resultGroups into IFilterResult - ISetting ranges are already correct here
            const filteredSettings = [];
            const matches = [];
            resultGroups.forEach(group => {
                group.result.filterMatches.forEach(filterMatch => {
                    filteredSettings.push(filterMatch.setting);
                    if (filterMatch.matches) {
                        matches.push(...filterMatch.matches);
                    }
                });
            });
            let filteredGroup;
            const modelGroup = this.settingsGroups[0]; // Editable model has one or zero groups
            if (modelGroup) {
                filteredGroup = {
                    id: modelGroup.id,
                    range: modelGroup.range,
                    sections: [{
                            settings: filteredSettings
                        }],
                    title: modelGroup.title,
                    titleRange: modelGroup.titleRange,
                    order: modelGroup.order,
                    extensionInfo: modelGroup.extensionInfo
                };
            }
            const metadata = this.collectMetadata(resultGroups);
            return {
                allGroups: this.settingsGroups,
                filteredGroups: filteredGroup ? [filteredGroup] : [],
                matches,
                metadata
            };
        }
    }
    exports.SettingsEditorModel = SettingsEditorModel;
    let Settings2EditorModel = class Settings2EditorModel extends AbstractSettingsModel {
        constructor(_defaultSettings, configurationService) {
            super();
            this._defaultSettings = _defaultSettings;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this.dirty = false;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.source === 7 /* ConfigurationTarget.DEFAULT */) {
                    this.dirty = true;
                    this._onDidChangeGroups.fire();
                }
            }));
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidSchemaChange(e => {
                this.dirty = true;
                this._onDidChangeGroups.fire();
            }));
        }
        /** Doesn't include the "Commonly Used" group */
        get filterGroups() {
            return this.settingsGroups.slice(1);
        }
        get settingsGroups() {
            const groups = this._defaultSettings.getSettingsGroups(this.dirty);
            if (this.additionalGroups?.length) {
                groups.push(...this.additionalGroups);
            }
            this.dirty = false;
            return groups;
        }
        /** For programmatically added groups outside of registered configurations */
        setAdditionalGroups(groups) {
            this.additionalGroups = groups;
        }
        findValueMatches(filter, setting) {
            // TODO @roblou
            return [];
        }
        update() {
            throw new Error('Not supported');
        }
    };
    exports.Settings2EditorModel = Settings2EditorModel;
    exports.Settings2EditorModel = Settings2EditorModel = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], Settings2EditorModel);
    function parse(model, isSettingsProperty) {
        const settings = [];
        let overrideSetting = null;
        let currentProperty = null;
        let currentParent = [];
        const previousParents = [];
        let settingsPropertyIndex = -1;
        const range = {
            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: 0,
            endColumn: 0
        };
        function onValue(value, offset, length) {
            if (Array.isArray(currentParent)) {
                currentParent.push(value);
            }
            else if (currentProperty) {
                currentParent[currentProperty] = value;
            }
            if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                // settings value started
                const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                if (setting) {
                    const valueStartPosition = model.getPositionAt(offset);
                    const valueEndPosition = model.getPositionAt(offset + length);
                    setting.value = value;
                    setting.valueRange = {
                        startLineNumber: valueStartPosition.lineNumber,
                        startColumn: valueStartPosition.column,
                        endLineNumber: valueEndPosition.lineNumber,
                        endColumn: valueEndPosition.column
                    };
                    setting.range = Object.assign(setting.range, {
                        endLineNumber: valueEndPosition.lineNumber,
                        endColumn: valueEndPosition.column
                    });
                }
            }
        }
        const visitor = {
            onObjectBegin: (offset, length) => {
                if (isSettingsProperty(currentProperty, previousParents)) {
                    // Settings started
                    settingsPropertyIndex = previousParents.length;
                    const position = model.getPositionAt(offset);
                    range.startLineNumber = position.lineNumber;
                    range.startColumn = position.column;
                }
                const object = {};
                onValue(object, offset, length);
                currentParent = object;
                currentProperty = null;
                previousParents.push(currentParent);
            },
            onObjectProperty: (name, offset, length) => {
                currentProperty = name;
                if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                    // setting started
                    const settingStartPosition = model.getPositionAt(offset);
                    const setting = {
                        description: [],
                        descriptionIsMarkdown: false,
                        key: name,
                        keyRange: {
                            startLineNumber: settingStartPosition.lineNumber,
                            startColumn: settingStartPosition.column + 1,
                            endLineNumber: settingStartPosition.lineNumber,
                            endColumn: settingStartPosition.column + length
                        },
                        range: {
                            startLineNumber: settingStartPosition.lineNumber,
                            startColumn: settingStartPosition.column,
                            endLineNumber: 0,
                            endColumn: 0
                        },
                        value: null,
                        valueRange: exports.nullRange,
                        descriptionRanges: [],
                        overrides: [],
                        overrideOf: overrideSetting ?? undefined,
                    };
                    if (previousParents.length === settingsPropertyIndex + 1) {
                        settings.push(setting);
                        if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(name)) {
                            overrideSetting = setting;
                        }
                    }
                    else {
                        overrideSetting.overrides.push(setting);
                    }
                }
            },
            onObjectEnd: (offset, length) => {
                currentParent = previousParents.pop();
                if (settingsPropertyIndex !== -1 && (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null))) {
                    // setting ended
                    const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                    if (setting) {
                        const valueEndPosition = model.getPositionAt(offset + length);
                        setting.valueRange = Object.assign(setting.valueRange, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                        setting.range = Object.assign(setting.range, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                    }
                    if (previousParents.length === settingsPropertyIndex + 1) {
                        overrideSetting = null;
                    }
                }
                if (previousParents.length === settingsPropertyIndex) {
                    // settings ended
                    const position = model.getPositionAt(offset);
                    range.endLineNumber = position.lineNumber;
                    range.endColumn = position.column;
                    settingsPropertyIndex = -1;
                }
            },
            onArrayBegin: (offset, length) => {
                const array = [];
                onValue(array, offset, length);
                previousParents.push(currentParent);
                currentParent = array;
                currentProperty = null;
            },
            onArrayEnd: (offset, length) => {
                currentParent = previousParents.pop();
                if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                    // setting value ended
                    const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                    if (setting) {
                        const valueEndPosition = model.getPositionAt(offset + length);
                        setting.valueRange = Object.assign(setting.valueRange, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                        setting.range = Object.assign(setting.range, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                    }
                }
            },
            onLiteralValue: onValue,
            onError: (error) => {
                const setting = settings[settings.length - 1];
                if (setting && (isNullRange(setting.range) || isNullRange(setting.keyRange) || isNullRange(setting.valueRange))) {
                    settings.pop();
                }
            }
        };
        if (!model.isDisposed()) {
            (0, json_1.visit)(model.getValue(), visitor);
        }
        return settings.length > 0 ? [{
                sections: [
                    {
                        settings
                    }
                ],
                title: '',
                titleRange: exports.nullRange,
                range
            }] : [];
    }
    class WorkspaceConfigurationEditorModel extends SettingsEditorModel {
        constructor() {
            super(...arguments);
            this._configurationGroups = [];
        }
        get configurationGroups() {
            return this._configurationGroups;
        }
        parse() {
            super.parse();
            this._configurationGroups = parse(this.settingsModel, (property, previousParents) => previousParents.length === 0);
        }
        isSettingsProperty(property, previousParents) {
            return property === 'settings' && previousParents.length === 1;
        }
    }
    exports.WorkspaceConfigurationEditorModel = WorkspaceConfigurationEditorModel;
    class DefaultSettings extends lifecycle_1.Disposable {
        constructor(_mostCommonlyUsedSettingsKeys, target) {
            super();
            this._mostCommonlyUsedSettingsKeys = _mostCommonlyUsedSettingsKeys;
            this.target = target;
            this._settingsByName = new Map();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
        }
        getContent(forceUpdate = false) {
            if (!this._content || forceUpdate) {
                this.initialize();
            }
            return this._content;
        }
        getContentWithoutMostCommonlyUsed(forceUpdate = false) {
            if (!this._contentWithoutMostCommonlyUsed || forceUpdate) {
                this.initialize();
            }
            return this._contentWithoutMostCommonlyUsed;
        }
        getSettingsGroups(forceUpdate = false) {
            if (!this._allSettingsGroups || forceUpdate) {
                this.initialize();
            }
            return this._allSettingsGroups;
        }
        initialize() {
            this._allSettingsGroups = this.parse();
            this._content = this.toContent(this._allSettingsGroups, 0);
            this._contentWithoutMostCommonlyUsed = this.toContent(this._allSettingsGroups, 1);
        }
        parse() {
            const settingsGroups = this.getRegisteredGroups();
            this.initAllSettingsMap(settingsGroups);
            const mostCommonlyUsed = this.getMostCommonlyUsedSettings(settingsGroups);
            return [mostCommonlyUsed, ...settingsGroups];
        }
        getRegisteredGroups() {
            const configurations = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurations().slice();
            const groups = this.removeEmptySettingsGroups(configurations.sort(this.compareConfigurationNodes)
                .reduce((result, config, index, array) => this.parseConfig(config, result, array), []));
            return this.sortGroups(groups);
        }
        sortGroups(groups) {
            groups.forEach(group => {
                group.sections.forEach(section => {
                    section.settings.sort((a, b) => a.key.localeCompare(b.key));
                });
            });
            return groups;
        }
        initAllSettingsMap(allSettingsGroups) {
            this._settingsByName = new Map();
            for (const group of allSettingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        this._settingsByName.set(setting.key, setting);
                    }
                }
            }
        }
        getMostCommonlyUsedSettings(allSettingsGroups) {
            const settings = (0, arrays_1.coalesce)(this._mostCommonlyUsedSettingsKeys.map(key => {
                const setting = this._settingsByName.get(key);
                if (setting) {
                    return {
                        description: setting.description,
                        key: setting.key,
                        value: setting.value,
                        keyRange: exports.nullRange,
                        range: exports.nullRange,
                        valueRange: exports.nullRange,
                        overrides: [],
                        scope: 4 /* ConfigurationScope.RESOURCE */,
                        type: setting.type,
                        enum: setting.enum,
                        enumDescriptions: setting.enumDescriptions,
                        descriptionRanges: []
                    };
                }
                return null;
            }));
            return {
                id: 'mostCommonlyUsed',
                range: exports.nullRange,
                title: nls.localize('commonlyUsed', "Commonly Used"),
                titleRange: exports.nullRange,
                sections: [
                    {
                        settings
                    }
                ]
            };
        }
        parseConfig(config, result, configurations, settingsGroup, seenSettings) {
            seenSettings = seenSettings ? seenSettings : {};
            let title = config.title;
            if (!title) {
                const configWithTitleAndSameId = configurations.find(c => (c.id === config.id) && c.title);
                if (configWithTitleAndSameId) {
                    title = configWithTitleAndSameId.title;
                }
            }
            if (title) {
                if (!settingsGroup) {
                    settingsGroup = result.find(g => g.title === title && g.extensionInfo?.id === config.extensionInfo?.id);
                    if (!settingsGroup) {
                        settingsGroup = { sections: [{ settings: [] }], id: config.id || '', title: title || '', titleRange: exports.nullRange, order: config.order, range: exports.nullRange, extensionInfo: config.extensionInfo };
                        result.push(settingsGroup);
                    }
                }
                else {
                    settingsGroup.sections[settingsGroup.sections.length - 1].title = title;
                }
            }
            if (config.properties) {
                if (!settingsGroup) {
                    settingsGroup = { sections: [{ settings: [] }], id: config.id || '', title: config.id || '', titleRange: exports.nullRange, order: config.order, range: exports.nullRange, extensionInfo: config.extensionInfo };
                    result.push(settingsGroup);
                }
                const configurationSettings = [];
                for (const setting of [...settingsGroup.sections[settingsGroup.sections.length - 1].settings, ...this.parseSettings(config)]) {
                    if (!seenSettings[setting.key]) {
                        configurationSettings.push(setting);
                        seenSettings[setting.key] = true;
                    }
                }
                if (configurationSettings.length) {
                    settingsGroup.sections[settingsGroup.sections.length - 1].settings = configurationSettings;
                }
            }
            config.allOf?.forEach(c => this.parseConfig(c, result, configurations, settingsGroup, seenSettings));
            return result;
        }
        removeEmptySettingsGroups(settingsGroups) {
            const result = [];
            for (const settingsGroup of settingsGroups) {
                settingsGroup.sections = settingsGroup.sections.filter(section => section.settings.length > 0);
                if (settingsGroup.sections.length) {
                    result.push(settingsGroup);
                }
            }
            return result;
        }
        parseSettings(config) {
            const result = [];
            const settingsObject = config.properties;
            const extensionInfo = config.extensionInfo;
            // Try using the title if the category id wasn't given
            // (in which case the category id is the same as the extension id)
            const categoryLabel = config.extensionInfo?.id === config.id ? config.title : config.id;
            for (const key in settingsObject) {
                const prop = settingsObject[key];
                if (this.matchesScope(prop)) {
                    const value = prop.default;
                    let description = (prop.markdownDescription || prop.description || '');
                    if (typeof description !== 'string') {
                        description = '';
                    }
                    const descriptionLines = description.split('\n');
                    const overrides = configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key) ? this.parseOverrideSettings(prop.default) : [];
                    let listItemType;
                    if (prop.type === 'array' && prop.items && !Array.isArray(prop.items) && prop.items.type) {
                        if (prop.items.enum) {
                            listItemType = 'enum';
                        }
                        else if (!Array.isArray(prop.items.type)) {
                            listItemType = prop.items.type;
                        }
                    }
                    const objectProperties = prop.type === 'object' ? prop.properties : undefined;
                    const objectPatternProperties = prop.type === 'object' ? prop.patternProperties : undefined;
                    const objectAdditionalProperties = prop.type === 'object' ? prop.additionalProperties : undefined;
                    let enumToUse = prop.enum;
                    let enumDescriptions = prop.markdownEnumDescriptions ?? prop.enumDescriptions;
                    let enumDescriptionsAreMarkdown = !!prop.markdownEnumDescriptions;
                    if (listItemType === 'enum' && !Array.isArray(prop.items)) {
                        enumToUse = prop.items.enum;
                        enumDescriptions = prop.items.markdownEnumDescriptions ?? prop.items.enumDescriptions;
                        enumDescriptionsAreMarkdown = !!prop.items.markdownEnumDescriptions;
                    }
                    let allKeysAreBoolean = false;
                    if (prop.type === 'object' && !prop.additionalProperties && prop.properties && Object.keys(prop.properties).length) {
                        allKeysAreBoolean = Object.keys(prop.properties).every(key => {
                            return prop.properties[key].type === 'boolean';
                        });
                    }
                    let isLanguageTagSetting = false;
                    if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        isLanguageTagSetting = true;
                    }
                    let defaultValueSource;
                    if (!isLanguageTagSetting) {
                        const registeredConfigurationProp = prop;
                        if (registeredConfigurationProp && registeredConfigurationProp.defaultValueSource) {
                            defaultValueSource = registeredConfigurationProp.defaultValueSource;
                        }
                    }
                    if (!enumToUse && (prop.enumItemLabels || enumDescriptions || enumDescriptionsAreMarkdown)) {
                        console.error(`The setting ${key} has enum-related fields, but doesn't have an enum field. This setting may render improperly in the Settings editor.`);
                    }
                    result.push({
                        key,
                        value,
                        description: descriptionLines,
                        descriptionIsMarkdown: !!prop.markdownDescription,
                        range: exports.nullRange,
                        keyRange: exports.nullRange,
                        valueRange: exports.nullRange,
                        descriptionRanges: [],
                        overrides,
                        scope: prop.scope,
                        type: prop.type,
                        arrayItemType: listItemType,
                        objectProperties,
                        objectPatternProperties,
                        objectAdditionalProperties,
                        enum: enumToUse,
                        enumDescriptions: enumDescriptions,
                        enumDescriptionsAreMarkdown: enumDescriptionsAreMarkdown,
                        enumItemLabels: prop.enumItemLabels,
                        uniqueItems: prop.uniqueItems,
                        tags: prop.tags,
                        disallowSyncIgnore: prop.disallowSyncIgnore,
                        restricted: prop.restricted,
                        extensionInfo: extensionInfo,
                        deprecationMessage: prop.markdownDeprecationMessage || prop.deprecationMessage,
                        deprecationMessageIsMarkdown: !!prop.markdownDeprecationMessage,
                        validator: (0, preferencesValidation_1.createValidator)(prop),
                        allKeysAreBoolean,
                        editPresentation: prop.editPresentation,
                        order: prop.order,
                        nonLanguageSpecificDefaultValueSource: defaultValueSource,
                        isLanguageTagSetting,
                        categoryLabel
                    });
                }
            }
            return result;
        }
        parseOverrideSettings(overrideSettings) {
            return Object.keys(overrideSettings).map((key) => ({
                key,
                value: overrideSettings[key],
                description: [],
                descriptionIsMarkdown: false,
                range: exports.nullRange,
                keyRange: exports.nullRange,
                valueRange: exports.nullRange,
                descriptionRanges: [],
                overrides: []
            }));
        }
        matchesScope(property) {
            if (!property.scope) {
                return true;
            }
            if (this.target === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                return configuration_2.FOLDER_SCOPES.indexOf(property.scope) !== -1;
            }
            if (this.target === 5 /* ConfigurationTarget.WORKSPACE */) {
                return configuration_2.WORKSPACE_SCOPES.indexOf(property.scope) !== -1;
            }
            return true;
        }
        compareConfigurationNodes(c1, c2) {
            if (typeof c1.order !== 'number') {
                return 1;
            }
            if (typeof c2.order !== 'number') {
                return -1;
            }
            if (c1.order === c2.order) {
                const title1 = c1.title || '';
                const title2 = c2.title || '';
                return title1.localeCompare(title2);
            }
            return c1.order - c2.order;
        }
        toContent(settingsGroups, startIndex) {
            const builder = new SettingsContentBuilder();
            for (let i = startIndex; i < settingsGroups.length; i++) {
                builder.pushGroup(settingsGroups[i], i === startIndex, i === settingsGroups.length - 1);
            }
            return builder.getContent();
        }
    }
    exports.DefaultSettings = DefaultSettings;
    class DefaultSettingsEditorModel extends AbstractSettingsModel {
        constructor(_uri, reference, defaultSettings) {
            super();
            this._uri = _uri;
            this.defaultSettings = defaultSettings;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this._register(defaultSettings.onDidChange(() => this._onDidChangeGroups.fire()));
            this._model = reference.object.textEditorModel;
            this._register(this.onWillDispose(() => reference.dispose()));
        }
        get uri() {
            return this._uri;
        }
        get target() {
            return this.defaultSettings.target;
        }
        get settingsGroups() {
            return this.defaultSettings.getSettingsGroups();
        }
        get filterGroups() {
            // Don't look at "commonly used" for filter
            return this.settingsGroups.slice(1);
        }
        update() {
            if (this._model.isDisposed()) {
                return undefined;
            }
            // Grab current result groups, only render non-empty groups
            const resultGroups = [...this._currentResultGroups.values()]
                .sort((a, b) => a.order - b.order);
            const nonEmptyResultGroups = resultGroups.filter(group => group.result.filterMatches.length);
            const startLine = (0, arrays_1.tail)(this.settingsGroups).range.endLineNumber + 2;
            const { settingsGroups: filteredGroups, matches } = this.writeResultGroups(nonEmptyResultGroups, startLine);
            const metadata = this.collectMetadata(resultGroups);
            return resultGroups.length ?
                {
                    allGroups: this.settingsGroups,
                    filteredGroups,
                    matches,
                    metadata
                } :
                undefined;
        }
        /**
         * Translate the ISearchResultGroups to text, and write it to the editor model
         */
        writeResultGroups(groups, startLine) {
            const contentBuilderOffset = startLine - 1;
            const builder = new SettingsContentBuilder(contentBuilderOffset);
            const settingsGroups = [];
            const matches = [];
            if (groups.length) {
                builder.pushLine(',');
                groups.forEach(resultGroup => {
                    const settingsGroup = this.getGroup(resultGroup);
                    settingsGroups.push(settingsGroup);
                    matches.push(...this.writeSettingsGroupToBuilder(builder, settingsGroup, resultGroup.result.filterMatches));
                });
            }
            // note: 1-indexed line numbers here
            const groupContent = builder.getContent() + '\n';
            const groupEndLine = this._model.getLineCount();
            const cursorPosition = new selection_1.Selection(startLine, 1, startLine, 1);
            const edit = {
                text: groupContent,
                forceMoveMarkers: true,
                range: new range_1.Range(startLine, 1, groupEndLine, 1)
            };
            this._model.pushEditOperations([cursorPosition], [edit], () => [cursorPosition]);
            // Force tokenization now - otherwise it may be slightly delayed, causing a flash of white text
            const tokenizeTo = Math.min(startLine + 60, this._model.getLineCount());
            this._model.tokenization.forceTokenization(tokenizeTo);
            return { matches, settingsGroups };
        }
        writeSettingsGroupToBuilder(builder, settingsGroup, filterMatches) {
            filterMatches = filterMatches
                .map(filteredMatch => {
                // Fix match ranges to offset from setting start line
                return {
                    setting: filteredMatch.setting,
                    score: filteredMatch.score,
                    matches: filteredMatch.matches && filteredMatch.matches.map(match => {
                        return new range_1.Range(match.startLineNumber - filteredMatch.setting.range.startLineNumber, match.startColumn, match.endLineNumber - filteredMatch.setting.range.startLineNumber, match.endColumn);
                    })
                };
            });
            builder.pushGroup(settingsGroup);
            // builder has rewritten settings ranges, fix match ranges
            const fixedMatches = (0, arrays_1.flatten)(filterMatches
                .map(m => m.matches || [])
                .map((settingMatches, i) => {
                const setting = settingsGroup.sections[0].settings[i];
                return settingMatches.map(range => {
                    return new range_1.Range(range.startLineNumber + setting.range.startLineNumber, range.startColumn, range.endLineNumber + setting.range.startLineNumber, range.endColumn);
                });
            }));
            return fixedMatches;
        }
        copySetting(setting) {
            return {
                description: setting.description,
                scope: setting.scope,
                type: setting.type,
                enum: setting.enum,
                enumDescriptions: setting.enumDescriptions,
                key: setting.key,
                value: setting.value,
                range: setting.range,
                overrides: [],
                overrideOf: setting.overrideOf,
                tags: setting.tags,
                deprecationMessage: setting.deprecationMessage,
                keyRange: exports.nullRange,
                valueRange: exports.nullRange,
                descriptionIsMarkdown: undefined,
                descriptionRanges: []
            };
        }
        findValueMatches(filter, setting) {
            return [];
        }
        getPreference(key) {
            for (const group of this.settingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        if (setting.key === key) {
                            return setting;
                        }
                    }
                }
            }
            return undefined;
        }
        getGroup(resultGroup) {
            return {
                id: resultGroup.id,
                range: exports.nullRange,
                title: resultGroup.label,
                titleRange: exports.nullRange,
                sections: [
                    {
                        settings: resultGroup.result.filterMatches.map(m => this.copySetting(m.setting))
                    }
                ]
            };
        }
    }
    exports.DefaultSettingsEditorModel = DefaultSettingsEditorModel;
    class SettingsContentBuilder {
        get lineCountWithOffset() {
            return this._contentByLines.length + this._rangeOffset;
        }
        get lastLine() {
            return this._contentByLines[this._contentByLines.length - 1] || '';
        }
        constructor(_rangeOffset = 0) {
            this._rangeOffset = _rangeOffset;
            this._contentByLines = [];
        }
        pushLine(...lineText) {
            this._contentByLines.push(...lineText);
        }
        pushGroup(settingsGroups, isFirst, isLast) {
            this._contentByLines.push(isFirst ? '[{' : '{');
            const lastSetting = this._pushGroup(settingsGroups, '  ');
            if (lastSetting) {
                // Strip the comma from the last setting
                const lineIdx = lastSetting.range.endLineNumber - this._rangeOffset;
                const content = this._contentByLines[lineIdx - 2];
                this._contentByLines[lineIdx - 2] = content.substring(0, content.length - 1);
            }
            this._contentByLines.push(isLast ? '}]' : '},');
        }
        _pushGroup(group, indent) {
            let lastSetting = null;
            const groupStart = this.lineCountWithOffset + 1;
            for (const section of group.sections) {
                if (section.title) {
                    const sectionTitleStart = this.lineCountWithOffset + 1;
                    this.addDescription([section.title], indent, this._contentByLines);
                    section.titleRange = { startLineNumber: sectionTitleStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
                }
                if (section.settings.length) {
                    for (const setting of section.settings) {
                        this.pushSetting(setting, indent);
                        lastSetting = setting;
                    }
                }
            }
            group.range = { startLineNumber: groupStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
            return lastSetting;
        }
        getContent() {
            return this._contentByLines.join('\n');
        }
        pushSetting(setting, indent) {
            const settingStart = this.lineCountWithOffset + 1;
            this.pushSettingDescription(setting, indent);
            let preValueContent = indent;
            const keyString = JSON.stringify(setting.key);
            preValueContent += keyString;
            setting.keyRange = { startLineNumber: this.lineCountWithOffset + 1, startColumn: preValueContent.indexOf(setting.key) + 1, endLineNumber: this.lineCountWithOffset + 1, endColumn: setting.key.length };
            preValueContent += ': ';
            const valueStart = this.lineCountWithOffset + 1;
            this.pushValue(setting, preValueContent, indent);
            setting.valueRange = { startLineNumber: valueStart, startColumn: preValueContent.length + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length + 1 };
            this._contentByLines[this._contentByLines.length - 1] += ',';
            this._contentByLines.push('');
            setting.range = { startLineNumber: settingStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
        }
        pushSettingDescription(setting, indent) {
            const fixSettingLink = (line) => line.replace(/`#(.*)#`/g, (match, settingName) => `\`${settingName}\``);
            setting.descriptionRanges = [];
            const descriptionPreValue = indent + '// ';
            const deprecationMessageLines = setting.deprecationMessage?.split(/\n/g) ?? [];
            for (let line of [...deprecationMessageLines, ...setting.description]) {
                line = fixSettingLink(line);
                this._contentByLines.push(descriptionPreValue + line);
                setting.descriptionRanges.push({ startLineNumber: this.lineCountWithOffset, startColumn: this.lastLine.indexOf(line) + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length });
            }
            if (setting.enum && setting.enumDescriptions?.some(desc => !!desc)) {
                setting.enumDescriptions.forEach((desc, i) => {
                    const displayEnum = escapeInvisibleChars(String(setting.enum[i]));
                    const line = desc ?
                        `${displayEnum}: ${fixSettingLink(desc)}` :
                        displayEnum;
                    const lines = line.split(/\n/g);
                    lines[0] = ' - ' + lines[0];
                    this._contentByLines.push(...lines.map(l => `${indent}// ${l}`));
                    setting.descriptionRanges.push({ startLineNumber: this.lineCountWithOffset, startColumn: this.lastLine.indexOf(line) + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length });
                });
            }
        }
        pushValue(setting, preValueConent, indent) {
            const valueString = JSON.stringify(setting.value, null, indent);
            if (valueString && (typeof setting.value === 'object')) {
                if (setting.overrides && setting.overrides.length) {
                    this._contentByLines.push(preValueConent + ' {');
                    for (const subSetting of setting.overrides) {
                        this.pushSetting(subSetting, indent + indent);
                        this._contentByLines.pop();
                    }
                    const lastSetting = setting.overrides[setting.overrides.length - 1];
                    const content = this._contentByLines[lastSetting.range.endLineNumber - 2];
                    this._contentByLines[lastSetting.range.endLineNumber - 2] = content.substring(0, content.length - 1);
                    this._contentByLines.push(indent + '}');
                }
                else {
                    const mulitLineValue = valueString.split('\n');
                    this._contentByLines.push(preValueConent + mulitLineValue[0]);
                    for (let i = 1; i < mulitLineValue.length; i++) {
                        this._contentByLines.push(indent + mulitLineValue[i]);
                    }
                }
            }
            else {
                this._contentByLines.push(preValueConent + valueString);
            }
        }
        addDescription(description, indent, result) {
            for (const line of description) {
                result.push(indent + '// ' + line);
            }
        }
    }
    class RawSettingsContentBuilder extends SettingsContentBuilder {
        constructor(indent = '\t') {
            super(0);
            this.indent = indent;
        }
        pushGroup(settingsGroups) {
            this._pushGroup(settingsGroups, this.indent);
        }
    }
    class DefaultRawSettingsEditorModel extends lifecycle_1.Disposable {
        constructor(defaultSettings) {
            super();
            this.defaultSettings = defaultSettings;
            this._content = null;
            this._register(defaultSettings.onDidChange(() => this._content = null));
        }
        get content() {
            if (this._content === null) {
                const builder = new RawSettingsContentBuilder();
                builder.pushLine('{');
                for (const settingsGroup of this.defaultSettings.getRegisteredGroups()) {
                    builder.pushGroup(settingsGroup);
                }
                builder.pushLine('}');
                this._content = builder.getContent();
            }
            return this._content;
        }
    }
    exports.DefaultRawSettingsEditorModel = DefaultRawSettingsEditorModel;
    function escapeInvisibleChars(enumValue) {
        return enumValue && enumValue
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
    function defaultKeybindingsContents(keybindingService) {
        const defaultsHeader = '// ' + nls.localize('defaultKeybindingsHeader', "Override key bindings by placing them into your key bindings file.");
        return defaultsHeader + '\n' + keybindingService.getDefaultKeybindingsContent();
    }
    let DefaultKeybindingsEditorModel = class DefaultKeybindingsEditorModel {
        constructor(_uri, keybindingService) {
            this._uri = _uri;
            this.keybindingService = keybindingService;
        }
        get uri() {
            return this._uri;
        }
        get content() {
            if (!this._content) {
                this._content = defaultKeybindingsContents(this.keybindingService);
            }
            return this._content;
        }
        getPreference() {
            return null;
        }
        dispose() {
            // Not disposable
        }
    };
    exports.DefaultKeybindingsEditorModel = DefaultKeybindingsEditorModel;
    exports.DefaultKeybindingsEditorModel = DefaultKeybindingsEditorModel = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], DefaultKeybindingsEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNNb2RlbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcHJlZmVyZW5jZXMvY29tbW9uL3ByZWZlcmVuY2VzTW9kZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThuQ2hHLGdFQUdDO0lBMW1DWSxRQUFBLFNBQVMsR0FBVyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzVHLFNBQVMsV0FBVyxDQUFDLEtBQWEsSUFBYSxPQUFPLEtBQUssQ0FBQyxlQUFlLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXpLLE1BQWUscUJBQXNCLFNBQVEseUJBQVc7UUFBeEQ7O1lBRVcseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7UUF5RnhFLENBQUM7UUF2RkEsaUJBQWlCLENBQUMsRUFBVSxFQUFFLFdBQTJDO1lBQ3hFLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxJQUFJLENBQUMsc0JBQXNCLEVBQUUs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