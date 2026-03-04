/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostConfiguration", "vs/platform/configuration/common/configurationModels", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/test/common/mock", "vs/platform/workspace/common/workspace", "vs/platform/log/common/log", "vs/base/common/platform", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, extHostWorkspace_1, extHostConfiguration_1, configurationModels_1, testRPCProtocol_1, mock_1, workspace_1, log_1, platform_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostConfiguration', function () {
        class RecordingShape extends (0, mock_1.mock)() {
            $updateConfigurationOption(target, key, value) {
                this.lastArgs = [target, key, value];
                return Promise.resolve(undefined);
            }
        }
        function createExtHostWorkspace() {
            return new extHostWorkspace_1.ExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), new class extends (0, mock_1.mock)() {
            }, new class extends (0, mock_1.mock)() {
                getCapabilities() { return platform_1.isLinux ? 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */ : undefined; }
            }, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
            });
        }
        function createExtHostConfiguration(contents = Object.create(null), shape) {
            if (!shape) {
                shape = new class extends (0, mock_1.mock)() {
                };
            }
            return new extHostConfiguration_1.ExtHostConfigProvider(shape, createExtHostWorkspace(), createConfigurationData(contents), new log_1.NullLogService());
        }
        function createConfigurationData(contents) {
            return {
                defaults: new configurationModels_1.ConfigurationModel(contents, [], [], undefined, new log_1.NullLogService()),
                policy: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                application: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                user: new configurationModels_1.ConfigurationModel(contents, [], [], undefined, new log_1.NullLogService()),
                workspace: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                folders: [],
                configurationScopes: []
            };
        }
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getConfiguration fails regression test 1.7.1 -> 1.8 #15552', function () {
            const extHostConfig = createExtHostConfiguration({
                'search': {
                    'exclude': {
                        '**/node_modules': true
                    }
                }
            });
            assert.strictEqual(extHostConfig.getConfiguration('search.exclude')['**/node_modules'], true);
            assert.strictEqual(extHostConfig.getConfiguration('search.exclude').get('**/node_modules'), true);
            assert.strictEqual(extHostConfig.getConfiguration('search').get('exclude')['**/node_modules'], true);
            assert.strictEqual(extHostConfig.getConfiguration('search.exclude').has('**/node_modules'), true);
            assert.strictEqual(extHostConfig.getConfiguration('search').has('exclude.**/node_modules'), true);
        });
        test('has/get', () => {
            const all = createExtHostConfiguration({
                'farboo': {
                    'config0': true,
                    'nested': {
                        'config1': 42,
                        'config2': 'Das Pferd frisst kein Reis.'
                    },
                    'config4': ''
                }
            });
            const config = all.getConfiguration('farboo');
            assert.ok(config.has('config0'));
            assert.strictEqual(config.get('config0'), true);
            assert.strictEqual(config.get('config4'), '');
            assert.strictEqual(config['config0'], true);
            assert.strictEqual(config['config4'], '');
            assert.ok(config.has('nested.config1'));
            assert.strictEqual(config.get('nested.config1'), 42);
            assert.ok(config.has('nested.config2'));
            assert.strictEqual(config.get('nested.config2'), 'Das Pferd frisst kein Reis.');
            assert.ok(config.has('nested'));
            assert.deepStrictEqual(config.get('nested'), { config1: 42, config2: 'Das Pferd frisst kein Reis.' });
        });
        test('can modify the returned configuration', function () {
            const all = createExtHostConfiguration({
                'farboo': {
                    'config0': true,
                    'nested': {
                        'config1': 42,
                        'config2': 'Das Pferd frisst kein Reis.'
                    },
                    'config4': ''
                },
                'workbench': {
                    'colorCustomizations': {
                        'statusBar.foreground': 'somevalue'
                    }
                }
            });
            let testObject = all.getConfiguration();
            let actual = testObject.get('farboo');
            actual['nested']['config1'] = 41;
            assert.strictEqual(41, actual['nested']['config1']);
            actual['farboo1'] = 'newValue';
            assert.strictEqual('newValue', actual['farboo1']);
            testObject = all.getConfiguration();
            actual = testObject.get('farboo');
            assert.strictEqual(actual['nested']['config1'], 42);
            assert.strictEqual(actual['farboo1'], undefined);
            testObject = all.getConfiguration();
            actual = testObject.get('farboo');
            assert.strictEqual(actual['config0'], true);
            actual['config0'] = false;
            assert.strictEqual(actual['config0'], false);
            testObject = all.getConfiguration();
            actual = testObject.get('farboo');
            assert.strictEqual(actual['config0'], true);
            testObject = all.getConfiguration();
            actual = testObject.inspect('farboo');
            actual['value'] = 'effectiveValue';
            assert.strictEqual('effectiveValue', actual['value']);
            testObject = all.getConfiguration('workbench');
            actual = testObject.get('colorCustomizations');
            actual['statusBar.foreground'] = undefined;
            assert.strictEqual(actual['statusBar.foreground'], undefined);
            testObject = all.getConfiguration('workbench');
            actual = testObject.get('colorCustomizations');
            assert.strictEqual(actual['statusBar.foreground'], 'somevalue');
        });
        test('Stringify returned configuration', function () {
            const all = createExtHostConfiguration({
                'farboo': {
                    'config0': true,
                    'nested': {
                        'config1': 42,
                        'config2': 'Das Pferd frisst kein Reis.'
                    },
                    'config4': ''
                },
                'workbench': {
                    'colorCustomizations': {
                        'statusBar.foreground': 'somevalue'
                    },
                    'emptyobjectkey': {}
                }
            });
            const testObject = all.getConfiguration();
            let actual = testObject.get('farboo');
            assert.deepStrictEqual(JSON.stringify({
                'config0': true,
                'nested': {
                    'config1': 42,
                    'config2': 'Das Pferd frisst kein Reis.'
                },
                'config4': ''
            }), JSON.stringify(actual));
            assert.deepStrictEqual(undefined, JSON.stringify(testObject.get('unknownkey')));
            actual = testObject.get('farboo');
            actual['config0'] = false;
            assert.deepStrictEqual(JSON.stringify({
                'config0': false,
                'nested': {
                    'config1': 42,
                    'config2': 'Das Pferd frisst kein Reis.'
                },
                'config4': ''
            }), JSON.stringify(actual));
            actual = testObject.get('workbench')['colorCustomizations'];
            actual['statusBar.background'] = 'anothervalue';
            assert.deepStrictEqual(JSON.stringify({
                'statusBar.foreground': 'somevalue',
                'statusBar.background': 'anothervalue'
            }), JSON.stringify(actual));
            actual = testObject.get('workbench');
            actual['unknownkey'] = 'somevalue';
            assert.deepStrictEqual(JSON.stringify({
                'colorCustomizations': {
                    'statusBar.foreground': 'somevalue'
                },
                'emptyobjectkey': {},
                'unknownkey': 'somevalue'
            }), JSON.stringify(actual));
            actual = all.getConfiguration('workbench').get('emptyobjectkey');
            actual = {
                ...(actual || {}),
                'statusBar.background': `#0ff`,
                'statusBar.foreground': `#ff0`,
            };
            assert.deepStrictEqual(JSON.stringify({
                'statusBar.background': `#0ff`,
                'statusBar.foreground': `#ff0`,
            }), JSON.stringify(actual));
            actual = all.getConfiguration('workbench').get('unknownkey');
            actual = {
                ...(actual || {}),
                'statusBar.background': `#0ff`,
                'statusBar.foreground': `#ff0`,
            };
            assert.deepStrictEqual(JSON.stringify({
                'statusBar.background': `#0ff`,
                'statusBar.foreground': `#ff0`,
            }), JSON.stringify(actual));
        });
        test('cannot modify returned configuration', function () {
            const all = createExtHostConfiguration({
                'farboo': {
                    'config0': true,
                    'nested': {
                        'config1': 42,
                        'config2': 'Das Pferd frisst kein Reis.'
                    },
                    'config4': ''
                }
            });
            const testObject = all.getConfiguration();
            try {
                testObject['get'] = null;
                assert.fail('This should be readonly');
            }
            catch (e) {
            }
            try {
                testObject['farboo']['config0'] = false;
                assert.fail('This should be readonly');
            }
            catch (e) {
            }
            try {
                testObject['farboo']['farboo1'] = 'hello';
                assert.fail('This should be readonly');
            }
            catch (e) {
            }
        });
        test('inspect in no workspace context', function () {
            const testObject = new extHostConfiguration_1.ExtHostConfigProvider(new class extends (0, mock_1.mock)() {
            }, createExtHostWorkspace(), {
                defaults: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'off'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                policy: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                application: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                user: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'on'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                workspace: new configurationModels_1.ConfigurationModel({}, [], [], undefined, new log_1.NullLogService()),
                folders: [],
                configurationScopes: []
            }, new log_1.NullLogService());
            let actual = testObject.getConfiguration().inspect('editor.wordWrap');
            assert.strictEqual(actual.defaultValue, 'off');
            assert.strictEqual(actual.globalValue, 'on');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            actual = testObject.getConfiguration('editor').inspect('wordWrap');
            assert.strictEqual(actual.defaultValue, 'off');
            assert.strictEqual(actual.globalValue, 'on');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
        });
        test('inspect in single root context', function () {
            const workspaceUri = uri_1.URI.file('foo');
            const folders = [];
            const workspace = new configurationModels_1.ConfigurationModel({
                'editor': {
                    'wordWrap': 'bounded'
                }
            }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService());
            folders.push([workspaceUri, workspace]);
            const extHostWorkspace = createExtHostWorkspace();
            extHostWorkspace.$initializeWorkspace({
                'id': 'foo',
                'folders': [aWorkspaceFolder(uri_1.URI.file('foo'), 0)],
                'name': 'foo'
            }, true);
            const testObject = new extHostConfiguration_1.ExtHostConfigProvider(new class extends (0, mock_1.mock)() {
            }, extHostWorkspace, {
                defaults: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'off'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                policy: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                application: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                user: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'on'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                workspace,
                folders,
                configurationScopes: []
            }, new log_1.NullLogService());
            let actual1 = testObject.getConfiguration().inspect('editor.wordWrap');
            assert.strictEqual(actual1.defaultValue, 'off');
            assert.strictEqual(actual1.globalValue, 'on');
            assert.strictEqual(actual1.workspaceValue, 'bounded');
            assert.strictEqual(actual1.workspaceFolderValue, undefined);
            actual1 = testObject.getConfiguration('editor').inspect('wordWrap');
            assert.strictEqual(actual1.defaultValue, 'off');
            assert.strictEqual(actual1.globalValue, 'on');
            assert.strictEqual(actual1.workspaceValue, 'bounded');
            assert.strictEqual(actual1.workspaceFolderValue, undefined);
            let actual2 = testObject.getConfiguration(undefined, workspaceUri).inspect('editor.wordWrap');
            assert.strictEqual(actual2.defaultValue, 'off');
            assert.strictEqual(actual2.globalValue, 'on');
            assert.strictEqual(actual2.workspaceValue, 'bounded');
            assert.strictEqual(actual2.workspaceFolderValue, 'bounded');
            actual2 = testObject.getConfiguration('editor', workspaceUri).inspect('wordWrap');
            assert.strictEqual(actual2.defaultValue, 'off');
            assert.strictEqual(actual2.globalValue, 'on');
            assert.strictEqual(actual2.workspaceValue, 'bounded');
            assert.strictEqual(actual2.workspaceFolderValue, 'bounded');
        });
        test('inspect in multi root context', function () {
            const workspace = new configurationModels_1.ConfigurationModel({
                'editor': {
                    'wordWrap': 'bounded'
                }
            }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService());
            const firstRoot = uri_1.URI.file('foo1');
            const secondRoot = uri_1.URI.file('foo2');
            const thirdRoot = uri_1.URI.file('foo3');
            const folders = [];
            folders.push([firstRoot, new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'off',
                        'lineNumbers': 'relative'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService())]);
            folders.push([secondRoot, new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'on'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService())]);
            folders.push([thirdRoot, new configurationModels_1.ConfigurationModel({}, [], [], undefined, new log_1.NullLogService())]);
            const extHostWorkspace = createExtHostWorkspace();
            extHostWorkspace.$initializeWorkspace({
                'id': 'foo',
                'folders': [aWorkspaceFolder(firstRoot, 0), aWorkspaceFolder(secondRoot, 1)],
                'name': 'foo'
            }, true);
            const testObject = new extHostConfiguration_1.ExtHostConfigProvider(new class extends (0, mock_1.mock)() {
            }, extHostWorkspace, {
                defaults: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'off',
                        'lineNumbers': 'on'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                policy: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                application: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                user: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'on'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                workspace,
                folders,
                configurationScopes: []
            }, new log_1.NullLogService());
            let actual1 = testObject.getConfiguration().inspect('editor.wordWrap');
            assert.strictEqual(actual1.defaultValue, 'off');
            assert.strictEqual(actual1.globalValue, 'on');
            assert.strictEqual(actual1.workspaceValue, 'bounded');
            assert.strictEqual(actual1.workspaceFolderValue, undefined);
            actual1 = testObject.getConfiguration('editor').inspect('wordWrap');
            assert.strictEqual(actual1.defaultValue, 'off');
            assert.strictEqual(actual1.globalValue, 'on');
            assert.strictEqual(actual1.workspaceValue, 'bounded');
            assert.strictEqual(actual1.workspaceFolderValue, undefined);
            actual1 = testObject.getConfiguration('editor').inspect('lineNumbers');
            assert.strictEqual(actual1.defaultValue, 'on');
            assert.strictEqual(actual1.globalValue, undefined);
            assert.strictEqual(actual1.workspaceValue, undefined);
            assert.strictEqual(actual1.workspaceFolderValue, undefined);
            let actual2 = testObject.getConfiguration(undefined, firstRoot).inspect('editor.wordWrap');
            assert.strictEqual(actual2.defaultValue, 'off');
            assert.strictEqual(actual2.globalValue, 'on');
            assert.strictEqual(actual2.workspaceValue, 'bounded');
            assert.strictEqual(actual2.workspaceFolderValue, 'off');
            actual2 = testObject.getConfiguration('editor', firstRoot).inspect('wordWrap');
            assert.strictEqual(actual2.defaultValue, 'off');
            assert.strictEqual(actual2.globalValue, 'on');
            assert.strictEqual(actual2.workspaceValue, 'bounded');
            assert.strictEqual(actual2.workspaceFolderValue, 'off');
            actual2 = testObject.getConfiguration('editor', firstRoot).inspect('lineNumbers');
            assert.strictEqual(actual2.defaultValue, 'on');
            assert.strictEqual(actual2.globalValue, undefined);
            assert.strictEqual(actual2.workspaceValue, undefined);
            assert.strictEqual(actual2.workspaceFolderValue, 'relative');
            actual2 = testObject.getConfiguration(undefined, secondRoot).inspect('editor.wordWrap');
            assert.strictEqual(actual2.defaultValue, 'off');
            assert.strictEqual(actual2.globalValue, 'on');
            assert.strictEqual(actual2.workspaceValue, 'bounded');
            assert.strictEqual(actual2.workspaceFolderValue, 'on');
            actual2 = testObject.getConfiguration('editor', secondRoot).inspect('wordWrap');
            assert.strictEqual(actual2.defaultValue, 'off');
            assert.strictEqual(actual2.globalValue, 'on');
            assert.strictEqual(actual2.workspaceValue, 'bounded');
            assert.strictEqual(actual2.workspaceFolderValue, 'on');
            actual2 = testObject.getConfiguration(undefined, thirdRoot).inspect('editor.wordWrap');
            assert.strictEqual(actual2.defaultValue, 'off');
            assert.strictEqual(actual2.globalValue, 'on');
            assert.strictEqual(actual2.workspaceValue, 'bounded');
            assert.ok(Object.keys(actual2).indexOf('workspaceFolderValue') !== -1);
            assert.strictEqual(actual2.workspaceFolderValue, undefined);
            actual2 = testObject.getConfiguration('editor', thirdRoot).inspect('wordWrap');
            assert.strictEqual(actual2.defaultValue, 'off');
            assert.strictEqual(actual2.globalValue, 'on');
            assert.strictEqual(actual2.workspaceValue, 'bounded');
            assert.ok(Object.keys(actual2).indexOf('workspaceFolderValue') !== -1);
            assert.strictEqual(actual2.workspaceFolderValue, undefined);
        });
        test('inspect with language overrides', function () {
            const firstRoot = uri_1.URI.file('foo1');
            const secondRoot = uri_1.URI.file('foo2');
            const folders = [];
            folders.push([firstRoot, toConfigurationModel({
                    'editor.wordWrap': 'bounded',
                    '[typescript]': {
                        'editor.wordWrap': 'unbounded',
                    }
                })]);
            folders.push([secondRoot, toConfigurationModel({})]);
            const extHostWorkspace = createExtHostWorkspace();
            extHostWorkspace.$initializeWorkspace({
                'id': 'foo',
                'folders': [aWorkspaceFolder(firstRoot, 0), aWorkspaceFolder(secondRoot, 1)],
                'name': 'foo'
            }, true);
            const testObject = new extHostConfiguration_1.ExtHostConfigProvider(new class extends (0, mock_1.mock)() {
            }, extHostWorkspace, {
                defaults: toConfigurationModel({
                    'editor.wordWrap': 'off',
                    '[markdown]': {
                        'editor.wordWrap': 'bounded',
                    }
                }),
                policy: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                application: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                user: toConfigurationModel({
                    'editor.wordWrap': 'bounded',
                    '[typescript]': {
                        'editor.lineNumbers': 'off',
                    }
                }),
                workspace: toConfigurationModel({
                    '[typescript]': {
                        'editor.wordWrap': 'unbounded',
                        'editor.lineNumbers': 'off',
                    }
                }),
                folders,
                configurationScopes: []
            }, new log_1.NullLogService());
            let actual = testObject.getConfiguration(undefined, { uri: firstRoot, languageId: 'typescript' }).inspect('editor.wordWrap');
            assert.strictEqual(actual.defaultValue, 'off');
            assert.strictEqual(actual.globalValue, 'bounded');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, 'bounded');
            assert.strictEqual(actual.defaultLanguageValue, undefined);
            assert.strictEqual(actual.globalLanguageValue, undefined);
            assert.strictEqual(actual.workspaceLanguageValue, 'unbounded');
            assert.strictEqual(actual.workspaceFolderLanguageValue, 'unbounded');
            assert.deepStrictEqual(actual.languageIds, ['markdown', 'typescript']);
            actual = testObject.getConfiguration(undefined, { uri: secondRoot, languageId: 'typescript' }).inspect('editor.wordWrap');
            assert.strictEqual(actual.defaultValue, 'off');
            assert.strictEqual(actual.globalValue, 'bounded');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(actual.defaultLanguageValue, undefined);
            assert.strictEqual(actual.globalLanguageValue, undefined);
            assert.strictEqual(actual.workspaceLanguageValue, 'unbounded');
            assert.strictEqual(actual.workspaceFolderLanguageValue, undefined);
            assert.deepStrictEqual(actual.languageIds, ['markdown', 'typescript']);
        });
        test('application is not set in inspect', () => {
            const testObject = new extHostConfiguration_1.ExtHostConfigProvider(new class extends (0, mock_1.mock)() {
            }, createExtHostWorkspace(), {
                defaults: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'off',
                        'lineNumbers': 'on',
                        'fontSize': '12px'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                policy: configurationModels_1.ConfigurationModel.createEmptyModel(new log_1.NullLogService()),
                application: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'on'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                user: new configurationModels_1.ConfigurationModel({
                    'editor': {
                        'wordWrap': 'auto',
                        'lineNumbers': 'off'
                    }
                }, ['editor.wordWrap'], [], undefined, new log_1.NullLogService()),
                workspace: new configurationModels_1.ConfigurationModel({}, [], [], undefined, new log_1.NullLogService()),
                folders: [],
                configurationScopes: []
            }, new log_1.NullLogService());
            let actual = testObject.getConfiguration().inspect('editor.wordWrap');
            assert.strictEqual(actual.defaultValue, 'off');
            assert.strictEqual(actual.globalValue, 'auto');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(testObject.getConfiguration().get('editor.wordWrap'), 'auto');
            actual = testObject.getConfiguration().inspect('editor.lineNumbers');
            assert.strictEqual(actual.defaultValue, 'on');
            assert.strictEqual(actual.globalValue, 'off');
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(testObject.getConfiguration().get('editor.lineNumbers'), 'off');
            actual = testObject.getConfiguration().inspect('editor.fontSize');
            assert.strictEqual(actual.defaultValue, '12px');
            assert.strictEqual(actual.globalValue, undefined);
            assert.strictEqual(actual.workspaceValue, undefined);
            assert.strictEqual(actual.workspaceFolderValue, undefined);
            assert.strictEqual(testObject.getConfiguration().get('editor.fontSize'), '12px');
        });
        test('getConfiguration vs get', function () {
            const all = createExtHostConfiguration({
                'farboo': {
                    'config0': true,
                    'config4': 38
                }
            });
            let config = all.getConfiguration('farboo.config0');
            assert.strictEqual(config.get(''), undefined);
            assert.strictEqual(config.has(''), false);
            config = all.getConfiguration('farboo');
            assert.strictEqual(config.get('config0'), true);
            assert.strictEqual(config.has('config0'), true);
        });
        test('name vs property', function () {
            const all = createExtHostConfiguration({
                'farboo': {
                    'get': 'get-prop'
                }
            });
            const config = all.getConfiguration('farboo');
            assert.ok(config.has('get'));
            assert.strictEqual(config.get('get'), 'get-prop');
            assert.deepStrictEqual(config['get'], config.get);
            assert.throws(() => config['get'] = 'get-prop');
        });
        test('update: no target passes null', function () {
            const shape = new RecordingShape();
            const allConfig = createExtHostConfiguration({
                'foo': {
                    'bar': 1,
                    'far': 1
                }
            }, shape);
            const config = allConfig.getConfiguration('foo');
            config.update('bar', 42);
            assert.strictEqual(shape.lastArgs[0], null);
        });
        test('update/section to key', function () {
            const shape = new RecordingShape();
            const allConfig = createExtHostConfiguration({
                'foo': {
                    'bar': 1,
                    'far': 1
                }
            }, shape);
            let config = allConfig.getConfiguration('foo');
            config.update('bar', 42, true);
            assert.strictEqual(shape.lastArgs[0], 2 /* ConfigurationTarget.USER */);
            assert.strictEqual(shape.lastArgs[1], 'foo.bar');
            assert.strictEqual(shape.lastArgs[2], 42);
            config = allConfig.getConfiguration('');
            config.update('bar', 42, true);
            assert.strictEqual(shape.lastArgs[1], 'bar');
            config.update('foo.bar', 42, true);
            assert.strictEqual(shape.lastArgs[1], 'foo.bar');
        });
        test('update, what is #15834', function () {
            const shape = new RecordingShape();
            const allConfig = createExtHostConfiguration({
                'editor': {
                    'formatOnSave': true
                }
            }, shape);
            allConfig.getConfiguration('editor').update('formatOnSave', { extensions: ['ts'] });
            assert.strictEqual(shape.lastArgs[1], 'editor.formatOnSave');
            assert.deepStrictEqual(shape.lastArgs[2], { extensions: ['ts'] });
        });
        test('update/error-state not OK', function () {
            const shape = new class extends (0, mock_1.mock)() {
                $updateConfigurationOption(target, key, value) {
                    return Promise.reject(new Error('Unknown Key')); // something !== OK
                }
            };
            return createExtHostConfiguration({}, shape)
                .getConfiguration('')
                .update('', true, false)
                .then(() => assert.ok(false), err => { });
        });
        test('configuration change event', (done) => {
            const workspaceFolder = aWorkspaceFolder(uri_1.URI.file('folder1'), 0);
            const extHostWorkspace = createExtHostWorkspace();
            extHostWorkspace.$initializeWorkspace({
                'id': 'foo',
                'folders': [workspaceFolder],
                'name': 'foo'
            }, true);
            const testObject = new extHostConfiguration_1.ExtHostConfigProvider(new class extends (0, mock_1.mock)() {
            }, extHostWorkspace, createConfigurationData({
                'farboo': {
                    'config': false,
                    'updatedConfig': false
                }
            }), new log_1.NullLogService());
            const newConfigData = createConfigurationData({
                'farboo': {
                    'config': false,
                    'updatedConfig': true,
                    'newConfig': true,
                }
            });
            const configEventData = { keys: ['farboo.updatedConfig', 'farboo.newConfig'], overrides: [] };
            store.add(testObject.onDidChangeConfiguration(e => {
                assert.deepStrictEqual(testObject.getConfiguration().get('farboo'), {
                    'config': false,
                    'updatedConfig': true,
                    'newConfig': true,
                });
                assert.ok(e.affectsConfiguration('farboo'));
                assert.ok(e.affectsConfiguration('farboo', workspaceFolder.uri));
                assert.ok(e.affectsConfiguration('farboo', uri_1.URI.file('any')));
                assert.ok(e.affectsConfiguration('farboo.updatedConfig'));
                assert.ok(e.affectsConfiguration('farboo.updatedConfig', workspaceFolder.uri));
                assert.ok(e.affectsConfiguration('farboo.updatedConfig', uri_1.URI.file('any')));
                assert.ok(e.affectsConfiguration('farboo.newConfig'));
                assert.ok(e.affectsConfiguration('farboo.newConfig', workspaceFolder.uri));
                assert.ok(e.affectsConfiguration('farboo.newConfig', uri_1.URI.file('any')));
                assert.ok(!e.affectsConfiguration('farboo.config'));
                assert.ok(!e.affectsConfiguration('farboo.config', workspaceFolder.uri));
                assert.ok(!e.affectsConfiguration('farboo.config', uri_1.URI.file('any')));
                done();
            }));
            testObject.$acceptConfigurationChanged(newConfigData, configEventData);
        });
        test('get return instance of array value', function () {
            const testObject = createExtHostConfiguration({ 'far': { 'boo': [] } });
            const value = testObject.getConfiguration().get('far.boo', []);
            value.push('a');
            const actual = testObject.getConfiguration().get('far.boo', []);
            assert.deepStrictEqual(actual, []);
        });
        function aWorkspaceFolder(uri, index, name = '') {
            return new workspace_1.WorkspaceFolder({ uri, name, index });
        }
        function toConfigurationModel(obj) {
            const parser = new configurationModels_1.ConfigurationModelParser('test', new log_1.NullLogService());
            parser.parse(JSON.stringify(obj));
            return parser.configurationModel;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbmZpZ3VyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3RDb25maWd1cmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQmhHLEtBQUssQ0FBQyxzQkFBc0IsRUFBRTtRQUU3QixNQUFNLGNBQWUsU0FBUSxJQUFBLFdBQUksR0FBZ0M7WUFFdkQsMEJBQTBCLENBQUMsTUFBMkIsRUFBRSxHQUFXLEVBQUUsS0FBVTtnQkFDdkYsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuQyxDQUFDO1NBQ0Q7UUFFRCxTQUFTLHNCQUFzQjtZQUM5QixPQUFPLElBQUksbUNBQWdCLENBQUMsSUFBSSxpQ0FBZSxFQUFFLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQTJCO2FBQUksRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBMEI7Z0JBQVksZUFBZSxLQUFLLE9BQU8sa0JBQU8sQ0FBQyxDQUFDLDZEQUFrRCxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzthQUFFLEVBQUUsSUFBSSxvQkFBYyxFQUFFLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQTBCO2FBQUksQ0FBQyxDQUFDO1FBQzNWLENBQUM7UUFFRCxTQUFTLDBCQUEwQixDQUFDLFdBQWdCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBb0M7WUFDNUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLEtBQUssR0FBRyxJQUFJ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