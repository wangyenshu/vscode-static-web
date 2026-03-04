/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/arrays", "vs/base/common/hash", "vs/base/common/resources", "vs/base/common/path", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/editor/test/common/testTextModel", "vs/base/common/network", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/workingCopy/electron-sandbox/workingCopyBackupService", "vs/platform/userData/common/fileUserDataProvider", "vs/base/common/buffer", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/cancellation", "vs/base/common/stream", "vs/workbench/test/common/workbenchTestServices", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/uuid", "vs/platform/product/common/product", "vs/base/test/common/utils", "vs/base/common/lifecycle", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentityService"], function (require, exports, assert, platform_1, arrays_1, hash_1, resources_1, path_1, uri_1, workingCopyBackupService_1, testTextModel_1, network_1, fileService_1, log_1, environmentService_1, textfiles_1, workingCopyBackupService_2, fileUserDataProvider_1, buffer_1, workbenchTestServices_1, cancellation_1, stream_1, workbenchTestServices_2, inMemoryFilesystemProvider_1, uuid_1, product_1, utils_1, lifecycle_1, userDataProfile_1, uriIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeTestWorkingCopyBackupService = exports.TestNativeWorkbenchEnvironmentService = void 0;
    const homeDir = uri_1.URI.file('home').with({ scheme: network_1.Schemas.inMemory });
    const tmpDir = uri_1.URI.file('tmp').with({ scheme: network_1.Schemas.inMemory });
    const NULL_PROFILE = {
        name: '',
        id: '',
        shortName: '',
        isDefault: false,
        location: homeDir,
        settingsResource: (0, resources_1.joinPath)(homeDir, 'settings.json'),
        globalStorageHome: (0, resources_1.joinPath)(homeDir, 'globalStorage'),
        keybindingsResource: (0, resources_1.joinPath)(homeDir, 'keybindings.json'),
        tasksResource: (0, resources_1.joinPath)(homeDir, 'tasks.json'),
        snippetsHome: (0, resources_1.joinPath)(homeDir, 'snippets'),
        extensionsResource: (0, resources_1.joinPath)(homeDir, 'extensions.json'),
        cacheHome: (0, resources_1.joinPath)(homeDir, 'cache')
    };
    const TestNativeWindowConfiguration = {
        windowId: 0,
        machineId: 'testMachineId',
        sqmId: 'testSqmId',
        logLevel: log_1.LogLevel.Error,
        loggers: { global: [], window: [] },
        mainPid: 0,
        appRoot: '',
        userEnv: {},
        execPath: process.execPath,
        perfMarks: [],
        colorScheme: { dark: true, highContrast: false },
        os: { release: 'unknown', hostname: 'unknown', arch: 'unknown' },
        product: product_1.default,
        homeDir: homeDir.fsPath,
        tmpDir: tmpDir.fsPath,
        userDataDir: (0, resources_1.joinPath)(homeDir, product_1.default.nameShort).fsPath,
        profiles: { profile: NULL_PROFILE, all: [NULL_PROFILE], home: homeDir },
        _: []
    };
    class TestNativeWorkbenchEnvironmentService extends environmentService_1.NativeWorkbenchEnvironmentService {
        constructor(testDir, backupPath) {
            super({ ...TestNativeWindowConfiguration, backupPath: backupPath.fsPath, 'user-data-dir': testDir.fsPath }, workbenchTestServices_2.TestProductService);
        }
    }
    exports.TestNativeWorkbenchEnvironmentService = TestNativeWorkbenchEnvironmentService;
    class NodeTestWorkingCopyBackupService extends workingCopyBackupService_2.NativeWorkingCopyBackupService {
        constructor(testDir, workspaceBackupPath) {
            const environmentService = new TestNativeWorkbenchEnvironmentService(testDir, workspaceBackupPath);
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            const lifecycleService = new workbenchTestServices_1.TestLifecycleService();
            super(environmentService, fileService, logService, lifecycleService);
            const fsp = new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider();
            fileService.registerProvider(network_1.Schemas.inMemory, fsp);
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            const userDataProfilesService = new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService);
            fileService.registerProvider(network_1.Schemas.vscodeUserData, new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, fsp, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, logService));
            this._fileService = fileService;
            this.backupResourceJoiners = [];
            this.discardBackupJoiners = [];
            this.discardedBackups = [];
            this.pendingBackupsArr = [];
            this.discardedAllBackups = false;
        }
        testGetFileService() {
            return this.fileService;
        }
        async waitForAllBackups() {
            await Promise.all(this.pendingBackupsArr);
        }
        joinBackupResource() {
            return new Promise(resolve => this.backupResourceJoiners.push(resolve));
        }
        async backup(identifier, content, versionId, meta, token) {
            const p = super.backup(identifier, content, versionId, meta, token);
            const removeFromPendingBackups = (0, arrays_1.insert)(this.pendingBackupsArr, p.then(undefined, undefined));
            try {
                await p;
            }
            finally {
                removeFromPendingBackups();
            }
            while (this.backupResourceJoiners.length) {
                this.backupResourceJoiners.pop()();
            }
        }
        joinDiscardBackup() {
            return new Promise(resolve => this.discardBackupJoiners.push(resolve));
        }
        async discardBackup(identifier) {
            await super.discardBackup(identifier);
            this.discardedBackups.push(identifier);
            while (this.discardBackupJoiners.length) {
                this.discardBackupJoiners.pop()();
            }
        }
        async discardBackups(filter) {
            this.discardedAllBackups = true;
            return super.discardBackups(filter);
        }
        async getBackupContents(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const fileContents = await this.fileService.readFile(backupResource);
            return fileContents.value.toString();
        }
    }
    exports.NodeTestWorkingCopyBackupService = NodeTestWorkingCopyBackupService;
    suite('WorkingCopyBackupService', () => {
        let testDir;
        let backupHome;
        let workspacesJsonPath;
        let workspaceBackupPath;
        let service;
        let fileService;
        const disposables = new lifecycle_1.DisposableStore();
        const workspaceResource = uri_1.URI.file(platform_1.isWindows ? 'c:\\workspace' : '/workspace');
        const fooFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo' : '/Foo');
        const customFile = uri_1.URI.parse('customScheme://some/path');
        const customFileWithFragment = uri_1.URI.parse('customScheme2://some/path#fragment');
        const barFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Bar' : '/Bar');
        const fooBarFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo Bar' : '/Foo Bar');
        const untitledFile = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
        setup(async () => {
            testDir = uri_1.URI.file((0, path_1.join)((0, uuid_1.generateUuid)(), 'vsctests', 'workingcopybackupservice')).with({ scheme: network_1.Schemas.inMemory });
            backupHome = (0, resources_1.joinPath)(testDir, 'Backups');
            workspacesJsonPath = (0, resources_1.joinPath)(backupHome, 'workspaces.json');
            workspaceBackupPath = (0, resources_1.joinPath)(backupHome, (0, hash_1.hash)(workspaceResource.fsPath).toString(16));
            service = disposables.add(new NodeTestWorkingCopyBackupService(testDir, workspaceBackupPath));
            fileService = service._fileService;
            await fileService.createFolder(backupHome);
            return fileService.writeFile(workspacesJsonPath, buffer_1.VSBuffer.fromString(''));
        });
        teardown(() => {
            disposables.clear();
        });
        suite('hashIdentifier', () => {
            test('should correctly hash the identifier for untitled scheme URIs', () => {
                const uri = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-7f9c1a2e');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.fsPath).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                if (platform_1.isWindows) {
                    assert.strictEqual(typedBackupHash, '-17c47cdc');
                }
                else {
                    assert.strictEqual(typedBackupHash, '-8ad5f4f');
                }
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should correctly hash the identifier for file scheme URIs', () => {
                const uri = uri_1.URI.file('/foo');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(uri));
                if (platform_1.isWindows) {
                    assert.strictEqual(untypedBackupHash, '20ffaa13');
                }
                else {
                    assert.strictEqual(untypedBackupHash, '20eb3560');
                }
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.fsPath).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                if (platform_1.isWindows) {
                    assert.strictEqual(typedBackupHash, '-55fc55db');
                }
                else {
                    assert.strictEqual(typedBackupHash, '51e56bf');
                }
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should correctly hash the identifier for custom scheme URIs', () => {
                const uri = uri_1.URI.from({
                    scheme: 'vscode-custom',
                    path: 'somePath'
                });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-44972d98');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.toString()).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                assert.strictEqual(typedBackupHash, '502149c7');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should not fail for URIs without path', () => {
                const uri = uri_1.URI.from({
                    scheme: 'vscode-fragment',
                    fragment: 'frag'
                });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-2f6b2f1b');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.toString()).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                assert.strictEqual(typedBackupHash, '6e82ca57');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
        });
        suite('getBackupResource', () => {
            test('should get the correct backup path for text files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = fooFile;
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, network_1.Schemas.file, filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, network_1.Schemas.file, filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
            test('should get the correct backup path for untitled files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, network_1.Schemas.untitled, filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, network_1.Schemas.untitled, filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
            test('should get the correct backup path for custom files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = uri_1.URI.from({ scheme: 'custom', path: 'custom/file.txt' });
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, 'custom', filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, 'custom', filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
        });
        suite('backup', () => {
            function toExpectedPreamble(identifier, content = '', meta) {
                return `${identifier.resource.toString()} ${JSON.stringify({ ...meta, typeId: identifier.typeId })}\n${content}`;
            }
            test('joining', async () => {
                let backupJoined = false;
                const joinBackupsPromise = service.joinBackups();
                joinBackupsPromise.then(() => backupJoined = true);
                await joinBackupsPromise;
                assert.strictEqual(backupJoined, true);
                backupJoined = false;
                service.joinBackups().then(() => backupJoined = true);
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const backupPromise = service.backup(identifier);
                assert.strictEqual(backupJoined, false);
                await backupPromise;
                assert.strictEqual(backupJoined, true);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('no text', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file (with version)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), 666);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(!service.hasBackupSync(identifier, 555));
                assert.ok(service.hasBackupSync(identifier, 666));
            });
            test('text file (with meta)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file with whitespace in name and type (with meta)', async () => {
                const fileWithSpace = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo \n Bar' : '/Foo \n Bar');
                const identifier = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fileWithSpace, ' test id \n');
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678 \n k', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file with unicode character in name and type (with meta)', async () => {
                const fileWithUnicode = uri_1.URI.file(platform_1.isWindows ? 'c:\\so𒀅meࠄ' : '/so𒀅meࠄ');
                const identifier = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fileWithUnicode, ' test so𒀅meࠄ id \n');
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678so𒀅meࠄ', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('untitled file', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file (readable)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const model = (0, testTextModel_1.createTextModel)('test');
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
                model.dispose();
            });
            test('untitled file (readable)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const model = (0, testTextModel_1.createTextModel)('test');
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                model.dispose();
            });
            test('text file (large file, stream)', () => {
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                return testLargeTextFile(largeString, (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(largeString)));
            });
            test('text file (large file, readable)', async () => {
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                const model = (0, testTextModel_1.createTextModel)(largeString);
                await testLargeTextFile(largeString, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                model.dispose();
            });
            async function testLargeTextFile(largeString, buffer) {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, buffer, undefined, { largeTest: true });
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, largeString, { largeTest: true }));
                assert.ok(service.hasBackupSync(identifier));
            }
            test('untitled file (large file, readable)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                const model = (0, testTextModel_1.createTextModel)(largeString);
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, largeString));
                assert.ok(service.hasBackupSync(identifier));
                model.dispose();
            });
            test('cancellation', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const cts = new cancellation_1.CancellationTokenSource();
                const promise = service.backup(identifier, undefined, undefined, undefined, cts.token);
                cts.cancel();
                await promise;
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('multiple', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await Promise.all([
                    service.backup(identifier),
                    service.backup(identifier),
                    service.backup(identifier),
                    service.backup(identifier)
                ]);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('multiple same resource, different type id', async () => {
                const backupId1 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type1');
                const backupId3 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type2');
                await Promise.all([
                    service.backup(backupId1),
                    service.backup(backupId2),
                    service.backup(backupId3)
                ]);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 3);
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const fooBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((await fileService.exists(fooBackupPath)), true);
                    assert.strictEqual((await fileService.readFile(fooBackupPath)).value.toString(), toExpectedPreamble(backupId));
                    assert.ok(service.hasBackupSync(backupId));
                }
            });
        });
        suite('discardBackup', () => {
            test('joining', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.ok(service.hasBackupSync(identifier));
                let backupJoined = false;
                service.joinBackups().then(() => backupJoined = true);
                const discardBackupPromise = service.discardBackup(identifier);
                assert.strictEqual(backupJoined, false);
                await discardBackupPromise;
                assert.strictEqual(backupJoined, true);
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 0);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('text file', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.ok(service.hasBackupSync(identifier));
                await service.discardBackup(identifier);
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 0);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('untitled file', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                await service.discardBackup(identifier);
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 0);
            });
            test('multiple same resource, different type id', async () => {
                const backupId1 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type1');
                const backupId3 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type2');
                await Promise.all([
                    service.backup(backupId1),
                    service.backup(backupId2),
                    service.backup(backupId3)
                ]);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 3);
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    await service.discardBackup(backupId);
                    assert.strictEqual((await fileService.exists(backupPath)), false);
                }
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 0);
            });
        });
        suite('discardBackups (all)', () => {
            test('text file', async () => {
                const backupId1 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(barFile);
                const backupId3 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(barFile);
                await service.backup(backupId1, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                await service.backup(backupId2, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 2);
                await service.backup(backupId3, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 3);
                await service.discardBackups();
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((await fileService.exists(backupPath)), false);
                }
                assert.strictEqual((await fileService.exists((0, resources_1.joinPath)(workspaceBackupPath, 'file'))), false);
            });
            test('untitled file', async () => {
                const backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                await service.backup(backupId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                await service.discardBackups();
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.strictEqual((await fileService.exists((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))), false);
            });
            test('can backup after discarding all', async () => {
                await service.discardBackups();
                await service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.exists(workspaceBackupPath)), true);
            });
        });
        suite('discardBackups (except some)', () => {
            test('text file', async () => {
                const backupId1 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(barFile);
                const backupId3 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(barFile);
                await service.backup(backupId1, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                await service.backup(backupId2, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 2);
                await service.backup(backupId3, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 3);
                await service.discardBackups({ except: [backupId2, backupId3] });
                let backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId1.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId1));
                assert.strictEqual((await fileService.exists(backupPath)), false);
                backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId2.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId2));
                assert.strictEqual((await fileService.exists(backupPath)), true);
                backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId3.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId3));
                assert.strictEqual((await fileService.exists(backupPath)), true);
                await service.discardBackups({ except: [backupId1] });
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((await fileService.exists(backupPath)), false);
                }
            });
            test('untitled file', async () => {
                const backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                await service.backup(backupId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                await service.discardBackups({ except: [backupId] });
                assert.strictEqual((await fileService.exists(backupPath)), true);
            });
        });
        suite('getBackups', () => {
            test('text file', async () => {
                await Promise.all([
                    service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test'))),
                    service.backup((0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type1'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test'))),
                    service.backup((0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type2'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')))
                ]);
                let backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                for (const backup of backups) {
                    if (backup.typeId === '') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else if (backup.typeId === 'type1') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else if (backup.typeId === 'type2') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else {
                        assert.fail('Unexpected backup');
                    }
                }
                await service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(barFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                backups = await service.getBackups();
                assert.strictEqual(backups.length, 4);
            });
            test('untitled file', async () => {
                await Promise.all([
                    service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test'))),
                    service.backup((0, workbenchTestServices_1.toTypedWorkingCopyId)(untitledFile, 'type1'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test'))),
                    service.backup((0, workbenchTestServices_1.toTypedWorkingCopyId)(untitledFile, 'type2'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')))
                ]);
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                for (const backup of backups) {
                    if (backup.typeId === '') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else if (backup.typeId === 'type1') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else if (backup.typeId === 'type2') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else {
                        assert.fail('Unexpected backup');
                    }
                }
            });
        });
        suite('resolve', () => {
            test('should restore the original contents (untitled file)', async () => {
                const contents = 'test\nand more stuff';
                await testResolveBackup(untitledFile, contents);
            });
            test('should restore the original contents (untitled file with metadata)', async () => {
                const contents = 'test\nand more stuff';
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (untitled file empty with metadata)', async () => {
                const contents = '';
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (untitled large file with metadata)', async () => {
                const contents = (new Array(30 * 1024)).join('Large String\n');
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (text file)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit'
                ].join('');
                await testResolveBackup(fooFile, contents);
            });
            test('should restore the original contents (text file - custom scheme)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit'
                ].join('');
                await testResolveBackup(customFile, contents);
            });
            test('should restore the original contents (text file with metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (empty text file with metadata)', async () => {
                const contents = '';
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (large text file with metadata)', async () => {
                const contents = (new Array(30 * 1024)).join('Large String\n');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (text file with metadata changed once)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
                // Change meta and test again
                meta.size = 999;
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (text file with metadata and fragment URI)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(customFileWithFragment, contents, meta);
            });
            test('should restore the original contents (text file with space in name with metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooBarFile, contents, meta);
            });
            test('should restore the original contents (text file with too large metadata to persist)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: (new Array(100 * 1024)).join('Large String'),
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta, true);
            });
            async function testResolveBackup(resource, contents, meta, expectNoMeta) {
                await doTestResolveBackup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(resource), contents, meta, expectNoMeta);
                await doTestResolveBackup((0, workbenchTestServices_1.toTypedWorkingCopyId)(resource), contents, meta, expectNoMeta);
            }
            async function doTestResolveBackup(identifier, contents, meta, expectNoMeta) {
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backup = await service.resolve(identifier);
                assert.ok(backup);
                assert.strictEqual(contents, (await (0, buffer_1.streamToBuffer)(backup.value)).toString());
                if (expectNoMeta || !meta) {
                    assert.strictEqual(backup.meta, undefined);
                }
                else {
                    assert.ok(backup.meta);
                    assert.strictEqual(backup.meta.etag, meta.etag);
                    assert.strictEqual(backup.meta.size, meta.size);
                    assert.strictEqual(backup.meta.mtime, meta.mtime);
                    assert.strictEqual(backup.meta.orphaned, meta.orphaned);
                    assert.strictEqual(Object.keys(meta).length, Object.keys(backup.meta).length);
                }
            }
            test('should restore the original contents (text file with broken metadata)', async () => {
                await testShouldRestoreOriginalContentsWithBrokenBackup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                await testShouldRestoreOriginalContentsWithBrokenBackup((0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile));
            });
            async function testShouldRestoreOriginalContentsWithBrokenBackup(identifier) {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const fileContents = (await fileService.readFile(backupPath)).value.toString();
                assert.strictEqual(fileContents.indexOf(identifier.resource.toString()), 0);
                const metaIndex = fileContents.indexOf('{');
                const newFileContents = fileContents.substring(0, metaIndex) + '{{' + fileContents.substr(metaIndex);
                await fileService.writeFile(backupPath, buffer_1.VSBuffer.fromString(newFileContents));
                const backup = await service.resolve(identifier);
                assert.ok(backup);
                assert.strictEqual(contents, (await (0, buffer_1.streamToBuffer)(backup.value)).toString());
                assert.strictEqual(backup.meta, undefined);
            }
            test('should update metadata from file into model when resolving', async () => {
                await testShouldUpdateMetaFromFileWhenResolving((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                await testShouldUpdateMetaFromFileWhenResolving((0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile));
            });
            async function testShouldUpdateMetaFromFileWhenResolving(identifier) {
                const contents = 'Foo Bar';
                const meta = {
                    etag: 'theEtagForThisMetadataTest',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                const updatedMeta = {
                    ...meta,
                    etag: meta.etag + meta.etag
                };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                // Simulate the condition of the backups model loading initially without
                // meta data information and then getting the meta data updated on the
                // first call to resolve the backup. We simulate this by explicitly changing
                // the meta data in the file and then verifying that the updated meta data
                // is persisted back into the model (verified via `hasBackupSync`).
                // This is not really something that would happen in real life because any
                // backup that is made via backup service will update the model accordingly.
                const originalFileContents = (await fileService.readFile(backupPath)).value.toString();
                await fileService.writeFile(backupPath, buffer_1.VSBuffer.fromString(originalFileContents.replace(meta.etag, updatedMeta.etag)));
                await service.resolve(identifier);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, meta), false);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, updatedMeta), true);
                await fileService.writeFile(backupPath, buffer_1.VSBuffer.fromString(originalFileContents));
                await service.getBackups();
                assert.strictEqual(service.hasBackupSync(identifier, undefined, meta), true);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, updatedMeta), false);
            }
            test('should ignore invalid backups (empty file)', async () => {
                const contents = 'test\nand more stuff';
                await service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1);
                let backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                await service.testGetFileService().writeFile(service.toBackupResource((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile)), buffer_1.VSBuffer.fromString(''));
                backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(!backup);
            });
            test('should ignore invalid backups (no preamble)', async () => {
                const contents = 'testand more stuff';
                await service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1);
                let backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                await service.testGetFileService().writeFile(service.toBackupResource((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile)), buffer_1.VSBuffer.fromString(contents));
                backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(!backup);
            });
            test('file with binary data', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const buffer = Uint8Array.from([
                    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 73, 0, 0, 0, 67, 8, 2, 0, 0, 0, 95, 138, 191, 237, 0, 0, 0, 1, 115, 82, 71, 66, 0, 174, 206, 28, 233, 0, 0, 0, 4, 103, 65, 77, 65, 0, 0, 177, 143, 11, 252, 97, 5, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0, 14, 195, 0, 0, 14, 195, 1, 199, 111, 168, 100, 0, 0, 0, 71, 116, 69, 88, 116, 83, 111, 117, 114, 99, 101, 0, 83, 104, 111, 116, 116, 121, 32, 118, 50, 46, 48, 46, 50, 46, 50, 49, 54, 32, 40, 67, 41, 32, 84, 104, 111, 109, 97, 115, 32, 66, 97, 117, 109, 97, 110, 110, 32, 45, 32, 104, 116, 116, 112, 58, 47, 47, 115, 104, 111, 116, 116, 121, 46, 100, 101, 118, 115, 45, 111, 110, 46, 110, 101, 116, 44, 132, 21, 213, 0, 0, 0, 84, 73, 68, 65, 84, 120, 218, 237, 207, 65, 17, 0, 0, 12, 2, 32, 211, 217, 63, 146, 37, 246, 218, 65, 3, 210, 191, 226, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 118, 100, 169, 4, 173, 8, 44, 248, 184, 40, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
                ]);
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.wrap(buffer)), undefined, { binaryTest: 'true' });
                const backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                const backupBuffer = await (0, stream_1.consumeStream)(backup.value, chunks => buffer_1.VSBuffer.concat(chunks));
                assert.strictEqual(backupBuffer.buffer.byteLength, buffer.byteLength);
            });
        });
        suite('WorkingCopyBackupsModel', () => {
            test('simple', async () => {
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(workspaceBackupPath, service.testGetFileService());
                const resource1 = uri_1.URI.file('test.html');
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), true);
                assert.strictEqual(model.has(resource1, 1), false);
                assert.strictEqual(model.has(resource1, 1, { foo: 'bar' }), false);
                model.remove(resource1);
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), true);
                assert.strictEqual(model.has(resource1, 1), false);
                model.clear();
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1, 1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), false);
                assert.strictEqual(model.has(resource1, 1), true);
                const resource2 = uri_1.URI.file('test1.html');
                const resource3 = uri_1.URI.file('test2.html');
                const resource4 = uri_1.URI.file('test3.html');
                model.add(resource2);
                model.add(resource3);
                model.add(resource4, undefined, { foo: 'bar' });
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource2), true);
                assert.strictEqual(model.has(resource3), true);
                assert.strictEqual(model.has(resource4), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'bar' }), true);
                assert.strictEqual(model.has(resource4, undefined, { bar: 'foo' }), false);
                model.update(resource4, { foo: 'nothing' });
                assert.strictEqual(model.has(resource4, undefined, { foo: 'nothing' }), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'bar' }), false);
                model.update(resource4);
                assert.strictEqual(model.has(resource4), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'nothing' }), false);
            });
            test('create', async () => {
                const fooBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile)));
                await fileService.createFolder((0, resources_1.dirname)(fooBackupPath));
                await fileService.writeFile(fooBackupPath, buffer_1.VSBuffer.fromString('foo'));
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(workspaceBackupPath, service.testGetFileService());
                assert.strictEqual(model.has(fooBackupPath), true);
            });
            test('get', async () => {
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(workspaceBackupPath, service.testGetFileService());
                assert.deepStrictEqual(model.get(), []);
                const file1 = uri_1.URI.file('/root/file/foo.html');
                const file2 = uri_1.URI.file('/root/file/bar.html');
                const untitled = uri_1.URI.file('/root/untitled/bar.html');
                model.add(file1);
                model.add(file2);
                model.add(untitled);
                assert.deepStrictEqual(model.get().map(f => f.fsPath), [file1.fsPath, file2.fsPath, untitled.fsPath]);
            });
        });
        suite('typeId migration', () => {
            test('works (when meta is missing)', async () => {
                const fooBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const untitledBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const customBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(customFile);
                const fooBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(fooBackupId));
                const untitledBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, untitledFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(untitledBackupId));
                const customFileBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, customFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(customBackupId));
                // Prepare backups of the old format without meta
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme));
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, untitledFile.scheme));
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, customFile.scheme));
                await fileService.writeFile(fooBackupPath, buffer_1.VSBuffer.fromString(`${fooFile.toString()}\ntest file`));
                await fileService.writeFile(untitledBackupPath, buffer_1.VSBuffer.fromString(`${untitledFile.toString()}\ntest untitled`));
                await fileService.writeFile(customFileBackupPath, buffer_1.VSBuffer.fromString(`${customFile.toString()}\ntest custom`));
                service.reinitialize(workspaceBackupPath);
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, fooFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, untitledFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, customFile)));
                assert.ok(backups.every(backup => backup.typeId === ''));
            });
            test('works (when typeId in meta is missing)', async () => {
                const fooBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const untitledBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const customBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(customFile);
                const fooBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(fooBackupId));
                const untitledBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, untitledFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(untitledBackupId));
                const customFileBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, customFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(customBackupId));
                // Prepare backups of the old format without meta
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme));
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, untitledFile.scheme));
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, customFile.scheme));
                await fileService.writeFile(fooBackupPath, buffer_1.VSBuffer.fromString(`${fooFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest file`));
                await fileService.writeFile(untitledBackupPath, buffer_1.VSBuffer.fromString(`${untitledFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest untitled`));
                await fileService.writeFile(customFileBackupPath, buffer_1.VSBuffer.fromString(`${customFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest custom`));
                service.reinitialize(workspaceBackupPath);
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, fooFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, untitledFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, customFile)));
                assert.ok(backups.every(backup => backup.typeId === ''));
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvdGVzdC9lbGVjdHJvbi1zYW5kYm94L3dvcmtpbmdDb3B5QmFja3VwU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtDaEcsTUFBTSxPQUFPLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3BFLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNsRSxNQUFNLFlBQVksR0FBRztRQUNwQixJQUFJLEVBQUUsRUFBRTtRQUNSLEVBQUUsRUFBRSxFQUFFO1FBQ04sU0FBUyxFQUFFLEVBQUU7UUFDYixTQUFTLEVBQUUsS0FBSztRQUNoQixRQUFRLEVBQUUsT0FBTztRQUNqQixnQkFBZ0IsRUFBRSxJQUFBLG9CQUFRLEVBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQztRQUNwRCxpQkFBaUIsRUFBRSxJQUFBLG9CQUFRLEVBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQztRQUNyRCxtQkFBbUIsRUFBRSxJQUFBLG9CQUFRLEVBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDO1FBQzFELGFBQWEsRUFBRSxJQUFBLG9CQUFRLEVBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztRQUM5QyxZQUFZLEVBQUUsSUFBQSxvQkFBUSxFQUFDLE9BQU8sRUFBRSxVQUFVLENBQUM7UUFDM0Msa0JB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RSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FB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RUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFbkQsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUVkLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFaEQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXhCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFbEQsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDekMsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDekMsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFFekMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDckIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDckIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRWhELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRS9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFM0UsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDOUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFM0UsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDekIsTUFBTSxhQUFhLEdBQUcsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBQSx5Q0FBYyxFQUFDLElBQUEsOENBQXNCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNySCxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBQSxtQkFBTyxFQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDdkUsTUFBTSxLQUFLLEdBQUcsTUFBTSxrREFBdUIsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztnQkFFdEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdEIsTUFBTSxLQUFLLEdBQUcsTUFBTSxrREFBdUIsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztnQkFFdEcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRXhDLE1BQU0sS0FBSyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxLQUFLLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7Z0JBRXJELEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pCLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pCLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRXBCLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN2RyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUU5QixJQUFJLENBQUMsOEJBQThCLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQy9DLE1BQU0sV0FBVyxHQUFHLElBQUEsOENBQXNCLEVBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSw4Q0FBc0IsRUFBQyxZQUFZLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBQSw4Q0FBc0IsRUFBQyxVQUFVLENBQUMsQ0FBQztnQkFFMUQsTUFBTSxhQUFhLEdBQUcsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBQSx5Q0FBYyxFQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pHLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBQSx5Q0FBYyxFQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztnQkFDaEgsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFBLHlDQUFjLEVBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFFOUcsaURBQWlEO2dCQUNqRCxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNuRixNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNqRixNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUNwRyxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxZQUFZLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDbEgsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO2dCQUVoSCxPQUFPLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBRTFDLE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEsbUJBQU8sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSxtQkFBTyxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLG1CQUFPLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hFLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDekQsTUFBTSxXQUFXLEdBQUcsSUFBQSw4Q0FBc0IsRUFBQyxPQUFPLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLDhDQUFzQixFQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLGNBQWMsR0FBRyxJQUFBLDhDQUFzQixFQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUUxRCxNQUFNLGFBQWEsR0FBRyxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFBLHlDQUFjLEVBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDakcsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFBLHlDQUFjLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO2dCQUNoSCxNQUFNLG9CQUFvQixHQUFHLElBQUEsb0JBQVEsRUFBQyxtQkFBbUIsRUFBRSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUEseUNBQWMsRUFBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUU5RyxpREFBaUQ7Z0JBQ2pELE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQzlFLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25GLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ2pGLE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUN0SSxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxZQUFZLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BKLE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7Z0JBRWxKLE9BQU8sQ0FBQyxZQUFZLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFFMUMsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSxtQkFBTyxFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLG1CQUFPLEVBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEsbUJBQU8sRUFBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==