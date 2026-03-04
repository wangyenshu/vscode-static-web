define(["require", "exports", "assert", "vs/platform/registry/common/platform", "vs/workbench/services/configuration/common/configurationModels", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/map", "vs/platform/workspace/common/workspace", "vs/base/common/uri", "vs/platform/workspace/test/common/testWorkspace", "vs/base/test/common/utils", "vs/platform/log/common/log"], function (require, exports, assert, platform_1, configurationModels_1, configurationModels_2, configurationRegistry_1, map_1, workspace_1, uri_1, testWorkspace_1, utils_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FolderSettingsModelParser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': 'FolderSettingsModelParser_1',
                'type': 'object',
                'properties': {
                    'FolderSettingsModelParser.window': {
                        'type': 'string',
                        'default': 'isSet'
                    },
                    'FolderSettingsModelParser.resource': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 4 /* ConfigurationScope.RESOURCE */,
                    },
                    'FolderSettingsModelParser.resourceLanguage': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                    },
                    'FolderSettingsModelParser.application': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'FolderSettingsModelParser.machine': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
        });
        test('parse all folder settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings', new log_1.NullLogService());
            testObject.parse(JSON.stringify({ 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' }), { scopes: [4 /* ConfigurationScope.RESOURCE */, 3 /* ConfigurationScope.WINDOW */] });
            const expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['window'] = 'window';
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
        });
        test('parse resource folder settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings', new log_1.NullLogService());
            testObject.parse(JSON.stringify({ 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' }), { scopes: [4 /* ConfigurationScope.RESOURCE */] });
            const expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
        });
        test('parse resource and resource language settings', () => {
            const testObject = new configurationModels_2.ConfigurationModelParser('settings', new log_1.NullLogService());
            testObject.parse(JSON.stringify({ '[json]': { 'FolderSettingsModelParser.window': 'window', 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.resourceLanguage': 'resourceLanguage', 'FolderSettingsModelParser.application': 'application', 'FolderSettingsModelParser.machine': 'executable' } }), { scopes: [4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */] });
            const expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            expected['FolderSettingsModelParser']['resourceLanguage'] = 'resourceLanguage';
            assert.deepStrictEqual(testObject.configurationModel.overrides, [{ 'contents': expected, 'identifiers': ['json'], 'keys': ['FolderSettingsModelParser.resource', 'FolderSettingsModelParser.resourceLanguage'] }]);
        });
        test('reparse folder settings excludes application and machine setting', () => {
            const parseOptions = { scopes: [4 /* ConfigurationScope.RESOURCE */, 3 /* ConfigurationScope.WINDOW */] };
            const testObject = new configurationModels_2.ConfigurationModelParser('settings', new log_1.NullLogService());
            testObject.parse(JSON.stringify({ 'FolderSettingsModelParser.resource': 'resource', 'FolderSettingsModelParser.anotherApplicationSetting': 'executable' }), parseOptions);
            let expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            expected['FolderSettingsModelParser']['anotherApplicationSetting'] = 'executable';
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                'id': 'FolderSettingsModelParser_2',
                'type': 'object',
                'properties': {
                    'FolderSettingsModelParser.anotherApplicationSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'FolderSettingsModelParser.anotherMachineSetting': {
                        'type': 'string',
                        'default': 'isSet',
                        scope: 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
            testObject.reparse(parseOptions);
            expected = Object.create(null);
            expected['FolderSettingsModelParser'] = Object.create(null);
            expected['FolderSettingsModelParser']['resource'] = 'resource';
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
        });
    });
    suite('StandaloneConfigurationModelParser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('parse tasks stand alone configuration model', () => {
            const testObject = new configurationModels_1.StandaloneConfigurationModelParser('tasks', 'tasks', new log_1.NullLogService());
            testObject.parse(JSON.stringify({ 'version': '1.1.1', 'tasks': [] }));
            const expected = Object.create(null);
            expected['tasks'] = Object.create(null);
            expected['tasks']['version'] = '1.1.1';
            expected['tasks']['tasks'] = [];
            assert.deepStrictEqual(testObject.configurationModel.contents, expected);
        });
    });
    suite('Workspace Configuration', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const defaultConfigurationModel = toConfigurationModel({
            'editor.lineNumbers': 'on',
            'editor.fontSize': 12,
            'window.zoomLevel': 1,
            '[markdown]': {
                'editor.wordWrap': 'off'
            },
            'window.title': 'custom',
            'workbench.enableTabs': false,
            'editor.insertSpaces': true
        });
        test('Test compare same configurations', () => {
            const workspace = new testWorkspace_1.Workspace('a', [new workspace_1.WorkspaceFolder({ index: 0, name: 'a', uri: uri_1.URI.file('folder1') }), new workspace_1.WorkspaceFolder({ index: 1, name: 'b', uri: uri_1.URI.file('folder2') }), new workspace_1.WorkspaceFolder({ index: 2, name: 'c', uri: uri_1.URI.file('folder3') })]);
            const configuration1 = new configurationModels_1.Configuration(configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), new map_1.ResourceMap(), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), new map_1.ResourceMap(), workspace, new log_1.NullLogService());
            configuration1.updateDefaultConfiguration(defaultConfigurationModel);
            configuration1.updateLocalUserConfiguration(toConfigurationModel({ 'window.title': 'native', '[typescript]': { 'editor.insertSpaces': false } }));
            configuration1.updateWorkspaceConfiguration(toConfigurationModel({ 'editor.lineNumbers': 'on' }));
            configuration1.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'editor.fontSize': 14 }));
            configuration1.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({ 'editor.wordWrap': 'on' }));
            const configuration2 = new configurationModels_1.Configuration(configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), new map_1.ResourceMap(), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), new map_1.ResourceMap(), workspace, new log_1.NullLogService());
            configuration2.updateDefaultConfiguration(defaultConfigurationModel);
            configuration2.updateLocalUserConfiguration(toConfigurationModel({ 'window.title': 'native', '[typescript]': { 'editor.insertSpaces': false } }));
            configuration2.updateWorkspaceConfiguration(toConfigurationModel({ 'editor.lineNumbers': 'on' }));
            configuration2.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'editor.fontSize': 14 }));
            configuration2.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({ 'editor.wordWrap': 'on' }));
            const actual = configuration2.compare(configuration1);
            assert.deepStrictEqual(actual, { keys: [], overrides: [] });
        });
        test('Test compare different configurations', () => {
            const workspace = new testWorkspace_1.Workspace('a', [new workspace_1.WorkspaceFolder({ index: 0, name: 'a', uri: uri_1.URI.file('folder1') }), new workspace_1.WorkspaceFolder({ index: 1, name: 'b', uri: uri_1.URI.file('folder2') }), new workspace_1.WorkspaceFolder({ index: 2, name: 'c', uri: uri_1.URI.file('folder3') })]);
            const configuration1 = new configurationModels_1.Configuration(configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), new map_1.ResourceMap(), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), new map_1.ResourceMap(), workspace, new log_1.NullLogService());
            configuration1.updateDefaultConfiguration(defaultConfigurationModel);
            configuration1.updateLocalUserConfiguration(toConfigurationModel({ 'window.title': 'native', '[typescript]': { 'editor.insertSpaces': false } }));
            configuration1.updateWorkspaceConfiguration(toConfigurationModel({ 'editor.lineNumbers': 'on' }));
            configuration1.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'editor.fontSize': 14 }));
            configuration1.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({ 'editor.wordWrap': 'on' }));
            const configuration2 = new configurationModels_1.Configuration(configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), new map_1.ResourceMap(), configurationModels_2.ConfigurationModel.createEmptyModel(new log_1.NullLogService()), new map_1.ResourceMap(), workspace, new log_1.NullLogService());
            configuration2.updateDefaultConfiguration(defaultConfigurationModel);
            configuration2.updateLocalUserConfiguration(toConfigurationModel({ 'workbench.enableTabs': true, '[typescript]': { 'editor.insertSpaces': true } }));
            configuration2.updateWorkspaceConfiguration(toConfigurationModel({ 'editor.fontSize': 11 }));
            configuration2.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'editor.insertSpaces': true }));
            configuration2.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({
                '[markdown]': {
                    'editor.wordWrap': 'on',
                    'editor.lineNumbers': 'relative'
                },
            }));
            const actual = configuration2.compare(configuration1);
            assert.deepStrictEqual(actual, { keys: ['editor.wordWrap', 'editor.fontSize', '[markdown]', 'window.title', 'workbench.enableTabs', '[typescript]'], overrides: [['markdown', ['editor.lineNumbers', 'editor.wordWrap']], ['typescript', ['editor.insertSpaces']]] });
        });
    });
    function toConfigurationModel(obj) {
        const parser = new configurationModels_2.ConfigurationModelParser('test', new log_1.NullLogService());
        parser.parse(JSON.stringify(obj));
        return parser.configurationModel;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbk1vZGVscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NvbmZpZ3VyYXRpb24vdGVzdC9jb21tb24vY29uZmlndXJhdGlvbk1vZGVscy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQWdCQSxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1FBRXZDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ2YsTUFBTSxxQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekcscUJBQXFCLENBQUMscUJBQXFCLENBQUM7Z0JBQzNDLElBQUksRUFBRSw2QkFBNkI7Z0JBQ25DLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixZQUFZLEVBQUU7b0JBQ2Isa0NBQWtDLEVBQUU7d0JBQ25DLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixTQUFTLEVBQUUsT0FBTztxQkFDbEI7b0JBQ0Qsb0NBQW9DLEVBQUU7d0JBQ3JDLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixTQUFTLEVBQUUsT0FBTzt3QkFDbEIsS0FBSyxxQ0FBNkI7cUJBQ2xDO29CQUNELDRDQUE0QyxFQUFFO3dCQUM3QyxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsU0FBUyxFQUFFLE9BQU87d0JBQ2xCLEtBQUssaURBQXlDO3FCQUM5QztvQkFDRCx1Q0FBdUMsRUFBRTt3QkFDeEMsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLFNBQVMsRUFBRSxPQUFPO3dCQUNsQixLQUFLLHdDQUFnQztxQkFDckM7b0JBQ0QsbUNBQW1DLEVBQUU7d0JBQ3BDLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixTQUFTLEVBQUUsT0FBTzt3QkFDbEIs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