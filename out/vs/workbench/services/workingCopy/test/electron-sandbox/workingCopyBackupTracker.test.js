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
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/path", "vs/base/common/uri", "vs/base/common/hash", "vs/workbench/services/workingCopy/electron-sandbox/workingCopyBackupTracker", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/log/common/log", "vs/platform/files/common/files", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/platform/native/common/native", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/environment/common/environment", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/progress/common/progress", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/event", "vs/base/common/uuid", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/buffer", "vs/workbench/test/electron-sandbox/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentityService"], function (require, exports, assert, platform_1, path_1, uri_1, hash_1, workingCopyBackupTracker_1, editorService_1, editorGroupsService_1, editorService_2, workingCopyBackup_1, lifecycle_1, utils_1, filesConfigurationService_1, workingCopyService_1, log_1, files_1, lifecycle_2, dialogs_1, workspace_1, native_1, testConfigurationService_1, configuration_1, workbenchTestServices_1, mockKeybindingService_1, environment_1, testWorkspace_1, progress_1, workingCopyEditorService_1, workbenchTestServices_2, event_1, uuid_1, network_1, resources_1, buffer_1, workbenchTestServices_3, uriIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WorkingCopyBackupTracker (native)', function () {
        let TestWorkingCopyBackupTracker = class TestWorkingCopyBackupTracker extends workingCopyBackupTracker_1.NativeWorkingCopyBackupTracker {
            constructor(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, fileDialogService, dialogService, contextService, nativeHostService, logService, editorService, environmentService, progressService, workingCopyEditorService, editorGroupService) {
                super(workingCopyBackupService, filesConfigurationService, workingCopyService, lifecycleService, fileDialogService, dialogService, contextService, nativeHostService, logService, environmentService, progressService, workingCopyEditorService, editorService, editorGroupService);
                this._onDidResume = this._register(new event_1.Emitter());
                this.onDidResume = this._onDidResume.event;
                this._onDidSuspend = this._register(new event_1.Emitter());
                this.onDidSuspend = this._onDidSuspend.event;
            }
            getBackupScheduleDelay() {
                return 10; // Reduce timeout for tests
            }
            waitForReady() {
                return this.whenReady;
            }
            get pendingBackupOperationCount() { return this.pendingBackupOperations.size; }
            dispose() {
                super.dispose();
                for (const [_, pending] of this.pendingBackupOperations) {
                    pending.cancel();
                    pending.disposable.dispose();
                }
            }
            suspendBackupOperations() {
                const { resume } = super.suspendBackupOperations();
                this._onDidSuspend.fire();
                return {
                    resume: () => {
                        resume();
                        this._onDidResume.fire();
                    }
                };
            }
        };
        TestWorkingCopyBackupTracker = __decorate([
            __param(0, workingCopyBackup_1.IWorkingCopyBackupService),
            __param(1, filesConfigurationService_1.IFilesConfigurationService),
            __param(2, workingCopyService_1.IWorkingCopyService),
            __param(3, lifecycle_2.ILifecycleService),
            __param(4, dialogs_1.IFileDialogService),
            __param(5, dialogs_1.IDialogService),
            __param(6, workspace_1.IWorkspaceContextService),
            __param(7, native_1.INativeHostService),
            __param(8, log_1.ILogService),
            __param(9, editorService_1.IEditorService),
            __param(10, environment_1.IEnvironmentService),
            __param(11, progress_1.IProgressService),
            __param(12, workingCopyEditorService_1.IWorkingCopyEditorService),
            __param(13, editorGroupsService_1.IEditorGroupsService)
        ], TestWorkingCopyBackupTracker);
        let testDir;
        let backupHome;
        let workspaceBackupPath;
        let accessor;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async () => {
            testDir = uri_1.URI.file((0, path_1.join)((0, uuid_1.generateUuid)(), 'vsctests', 'workingcopybackuptracker')).with({ scheme: network_1.Schemas.inMemory });
            backupHome = (0, resources_1.joinPath)(testDir, 'Backups');
            const workspacesJsonPath = (0, resources_1.joinPath)(backupHome, 'workspaces.json');
            const workspaceResource = uri_1.URI.file(platform_1.isWindows ? 'c:\\workspace' : '/workspace').with({ scheme: network_1.Schemas.inMemory });
            workspaceBackupPath = (0, resources_1.joinPath)(backupHome, (0, hash_1.hash)(workspaceResource.toString()).toString(16));
            const instantiationService = (0, workbenchTestServices_3.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_3.TestServiceAccessor);
            disposables.add(accessor.textFileService.files);
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            await accessor.fileService.createFolder(backupHome);
            await accessor.fileService.createFolder(workspaceBackupPath);
            return accessor.fileService.writeFile(workspacesJsonPath, buffer_1.VSBuffer.fromString(''));
        });
        teardown(() => {
            disposables.clear();
        });
        async function createTracker(autoSaveEnabled = false) {
            const instantiationService = (0, workbenchTestServices_3.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            if (autoSaveEnabled) {
                configurationService.setUserConfiguration('files', { autoSave: 'afterDelay', autoSaveDelay: 1 });
            }
            else {
                configurationService.setUserConfiguration('files', { autoSave: 'off', autoSaveDelay: 1 });
            }
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(filesConfigurationService_1.IFilesConfigurationService, disposables.add(new workbenchTestServices_1.TestFilesConfigurationService(instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService), configurationService, new workbenchTestServices_2.TestContextService(testWorkspace_1.TestWorkspace), workbenchTestServices_1.TestEnvironmentService, disposables.add(new uriIdentityService_1.UriIdentityService(disposables.add(new workbenchTestServices_1.TestFileService()))), disposables.add(new workbenchTestServices_1.TestFileService()), new workbenchTestServices_2.TestMarkerService(), new workbenchTestServices_1.TestTextResourceConfigurationService(configurationService))));
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            instantiationService.stub(editorService_1.IEditorService, editorService);
            accessor = instantiationService.createInstance(workbenchTestServices_3.TestServiceAccessor);
            const tracker = instantiationService.createInstance(TestWorkingCopyBackupTracker);
            const cleanup = async () => {
                await accessor.workingCopyBackupService.waitForAllBackups(); // File changes could also schedule some backup operations so we need to wait for them before finishing the test
                await (0, workbenchTestServices_1.workbenchTeardown)(instantiationService);
                part.dispose();
                tracker.dispose();
            };
            return { accessor, part, tracker, instantiationService, cleanup };
        }
        test('Track backups (file, auto save off)', function () {
            return trackBackupsTest(utils_1.toResource.call(this, '/path/index.txt'), false);
        });
        test('Track backups (file, auto save on)', function () {
            return trackBackupsTest(utils_1.toResource.call(this, '/path/index.txt'), true);
        });
        async function trackBackupsTest(resource, autoSave) {
            const { accessor, cleanup } = await createTracker(autoSave);
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const fileModel = accessor.textFileService.files.get(resource);
            assert.ok(fileModel);
            fileModel.textEditorModel?.setValue('Super Good');
            await accessor.workingCopyBackupService.joinBackupResource();
            assert.strictEqual(accessor.workingCopyBackupService.hasBackupSync(fileModel), true);
            fileModel.dispose();
            await accessor.workingCopyBackupService.joinDiscardBackup();
            assert.strictEqual(accessor.workingCopyBackupService.hasBackupSync(fileModel), false);
            await cleanup();
        }
        test('onWillShutdown - no veto if no dirty files', async function () {
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            await cleanup();
        });
        test('onWillShutdown - veto if user cancels (hot.exit: off)', async function () {
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
            accessor.filesConfigurationService.testOnFilesConfigurationChange({ files: { hotExit: 'off' } });
            await model?.resolve();
            model?.textEditorModel?.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(veto);
            await cleanup();
        });
        test('onWillShutdown - no veto if auto save is on', async function () {
            const { accessor, cleanup } = await createTracker(true /* auto save enabled */);
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            await model?.resolve();
            model?.textEditorModel?.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 0);
            await cleanup();
        });
        test('onWillShutdown - no veto and backups cleaned up if user does not want to save (hot.exit: off)', async function () {
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            accessor.fileDialogService.setConfirmResult(1 /* ConfirmResult.DONT_SAVE */);
            accessor.filesConfigurationService.testOnFilesConfigurationChange({ files: { hotExit: 'off' } });
            await model?.resolve();
            model?.textEditorModel?.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(accessor.workingCopyBackupService.discardedBackups.length > 0);
            await cleanup();
        });
        test('onWillShutdown - no backups discarded when shutdown without dirty but tracker not ready', async function () {
            const { accessor, cleanup } = await createTracker();
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(!accessor.workingCopyBackupService.discardedAllBackups);
            await cleanup();
        });
        test('onWillShutdown - backups discarded when shutdown without dirty', async function () {
            const { accessor, tracker, cleanup } = await createTracker();
            await tracker.waitForReady();
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(accessor.workingCopyBackupService.discardedAllBackups);
            await cleanup();
        });
        test('onWillShutdown - save (hot.exit: off)', async function () {
            const { accessor, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            accessor.fileDialogService.setConfirmResult(0 /* ConfirmResult.SAVE */);
            accessor.filesConfigurationService.testOnFilesConfigurationChange({ files: { hotExit: 'off' } });
            await model?.resolve();
            model?.textEditorModel?.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(!veto);
            assert.ok(!model?.isDirty());
            await cleanup();
        });
        test('onWillShutdown - veto if backup fails', async function () {
            const { accessor, cleanup } = await createTracker();
            class TestBackupWorkingCopy extends workbenchTestServices_2.TestWorkingCopy {
                constructor(resource) {
                    super(resource);
                    this._register(accessor.workingCopyService.registerWorkingCopy(this));
                }
                async backup(token) {
                    throw new Error('unable to backup');
                }
            }
            const resource = utils_1.toResource.call(this, '/path/custom.txt');
            const customWorkingCopy = disposables.add(new TestBackupWorkingCopy(resource));
            customWorkingCopy.setDirty(true);
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            event.reason = 2 /* ShutdownReason.QUIT */;
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(veto);
            const finalVeto = await event.finalValue?.();
            assert.ok(finalVeto); // assert the tracker uses the internal finalVeto API
            await cleanup();
        });
        test('onWillShutdown - scratchpads - veto if backup fails', async function () {
            const { accessor, cleanup } = await createTracker();
            class TestBackupWorkingCopy extends workbenchTestServices_2.TestWorkingCopy {
                constructor(resource) {
                    super(resource);
                    this.capabilities = 2 /* WorkingCopyCapabilities.Untitled */ | 4 /* WorkingCopyCapabilities.Scratchpad */;
                    this._register(accessor.workingCopyService.registerWorkingCopy(this));
                }
                async backup(token) {
                    throw new Error('unable to backup');
                }
                isDirty() {
                    return false;
                }
                isModified() {
                    return true;
                }
            }
            const resource = utils_1.toResource.call(this, '/path/custom.txt');
            disposables.add(new TestBackupWorkingCopy(resource));
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            event.reason = 2 /* ShutdownReason.QUIT */;
            accessor.lifecycleService.fireBeforeShutdown(event);
            const veto = await event.value;
            assert.ok(veto);
            const finalVeto = await event.finalValue?.();
            assert.ok(finalVeto); // assert the tracker uses the internal finalVeto API
            await cleanup();
        });
        test('onWillShutdown - pending backup operations canceled and tracker suspended/resumsed', async function () {
            const { accessor, tracker, cleanup } = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { pinned: true } });
            const model = accessor.textFileService.files.get(resource);
            await model?.resolve();
            model?.textEditorModel?.setValue('foo');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            const onSuspend = event_1.Event.toPromise(tracker.onDidSuspend);
            const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
            event.reason = 2 /* ShutdownReason.QUIT */;
            accessor.lifecycleService.fireBeforeShutdown(event);
            await onSuspend;
            assert.strictEqual(tracker.pendingBackupOperationCount, 0);
            // Ops are suspended during shutdown!
            model?.textEditorModel?.setValue('bar');
            assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
            assert.strictEqual(tracker.pendingBackupOperationCount, 0);
            const onResume = event_1.Event.toPromise(tracker.onDidResume);
            await event.value;
            // Ops are resumed after shutdown!
            model?.textEditorModel?.setValue('foo');
            await onResume;
            assert.strictEqual(tracker.pendingBackupOperationCount, 1);
            await cleanup();
        });
        suite('Hot Exit', () => {
            suite('"onExit" setting', () => {
                test('should hot exit on non-Mac (reason: CLOSE, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, false, true, !!platform_1.isMacintosh);
                });
                test('should hot exit on non-Mac (reason: CLOSE, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, false, false, !!platform_1.isMacintosh);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, true, true, true);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, true, false, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, false, true, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, false, false, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, true, true, true);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, true, false, true);
                });
            });
            suite('"onExitAndWindowClose" setting', () => {
                test('should hot exit (reason: CLOSE, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, false, true, false);
                });
                test('should hot exit (reason: CLOSE, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, false, false, !!platform_1.isMacintosh);
                });
                test('should hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, true, true, false);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, true, false, false);
                });
                test('should hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, false, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, false, false, true);
                });
                test('should hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, true, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return hotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, true, false, true);
                });
            });
            suite('"onExit" setting - scratchpad', () => {
                test('should hot exit (reason: CLOSE, windows: single, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, false, true, false);
                });
                test('should hot exit (reason: CLOSE, windows: single, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, false, false, !!platform_1.isMacintosh);
                });
                test('should hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, true, true, false);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 1 /* ShutdownReason.CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 2 /* ShutdownReason.QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 3 /* ShutdownReason.RELOAD */, true, false, false);
                });
                test('should hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, false, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, false, false, true);
                });
                test('should hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, true, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT, 4 /* ShutdownReason.LOAD */, true, false, true);
                });
            });
            suite('"onExitAndWindowClose" setting - scratchpad', () => {
                test('should hot exit (reason: CLOSE, windows: single, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, false, true, false);
                });
                test('should hot exit (reason: CLOSE, windows: single, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, false, false, !!platform_1.isMacintosh);
                });
                test('should hot exit (reason: CLOSE, windows: multiple, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, true, true, false);
                });
                test('should NOT hot exit (reason: CLOSE, windows: multiple, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 1 /* ShutdownReason.CLOSE */, true, false, true);
                });
                test('should hot exit (reason: QUIT, windows: single, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, false, true, false);
                });
                test('should hot exit (reason: QUIT, windows: single, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, false, false, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, true, true, false);
                });
                test('should hot exit (reason: QUIT, windows: multiple, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 2 /* ShutdownReason.QUIT */, true, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, false, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: single, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, false, false, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, true, true, false);
                });
                test('should hot exit (reason: RELOAD, windows: multiple, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 3 /* ShutdownReason.RELOAD */, true, false, false);
                });
                test('should hot exit (reason: LOAD, windows: single, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, false, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: single, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, false, false, true);
                });
                test('should hot exit (reason: LOAD, windows: multiple, workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, true, true, false);
                });
                test('should NOT hot exit (reason: LOAD, windows: multiple, empty workspace)', function () {
                    return scratchpadHotExitTest.call(this, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE, 4 /* ShutdownReason.LOAD */, true, false, true);
                });
            });
            async function hotExitTest(setting, shutdownReason, multipleWindows, workspace, shouldVeto) {
                const { accessor, cleanup } = await createTracker();
                const resource = utils_1.toResource.call(this, '/path/index.txt');
                await accessor.editorService.openEditor({ resource, options: { pinned: true } });
                const model = accessor.textFileService.files.get(resource);
                // Set hot exit config
                accessor.filesConfigurationService.testOnFilesConfigurationChange({ files: { hotExit: setting } });
                // Set empty workspace if required
                if (!workspace) {
                    accessor.contextService.setWorkspace(new testWorkspace_1.Workspace('empty:1508317022751'));
                }
                // Set multiple windows if required
                if (multipleWindows) {
                    accessor.nativeHostService.windowCount = Promise.resolve(2);
                }
                // Set cancel to force a veto if hot exit does not trigger
                accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
                await model?.resolve();
                model?.textEditorModel?.setValue('foo');
                assert.strictEqual(accessor.workingCopyService.dirtyCount, 1);
                const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
                event.reason = shutdownReason;
                accessor.lifecycleService.fireBeforeShutdown(event);
                const veto = await event.value;
                assert.ok(typeof event.finalValue === 'function'); // assert the tracker uses the internal finalVeto API
                assert.strictEqual(accessor.workingCopyBackupService.discardedBackups.length, 0); // When hot exit is set, backups should never be cleaned since the confirm result is cancel
                assert.strictEqual(veto, shouldVeto);
                await cleanup();
            }
            async function scratchpadHotExitTest(setting, shutdownReason, multipleWindows, workspace, shouldVeto) {
                const { accessor, cleanup } = await createTracker();
                class TestBackupWorkingCopy extends workbenchTestServices_2.TestWorkingCopy {
                    constructor(resource) {
                        super(resource);
                        this.capabilities = 2 /* WorkingCopyCapabilities.Untitled */ | 4 /* WorkingCopyCapabilities.Scratchpad */;
                        this._register(accessor.workingCopyService.registerWorkingCopy(this));
                    }
                    isDirty() {
                        return false;
                    }
                    isModified() {
                        return true;
                    }
                }
                // Set hot exit config
                accessor.filesConfigurationService.testOnFilesConfigurationChange({ files: { hotExit: setting } });
                // Set empty workspace if required
                if (!workspace) {
                    accessor.contextService.setWorkspace(new testWorkspace_1.Workspace('empty:1508317022751'));
                }
                // Set multiple windows if required
                if (multipleWindows) {
                    accessor.nativeHostService.windowCount = Promise.resolve(2);
                }
                // Set cancel to force a veto if hot exit does not trigger
                accessor.fileDialogService.setConfirmResult(2 /* ConfirmResult.CANCEL */);
                const resource = utils_1.toResource.call(this, '/path/custom.txt');
                disposables.add(new TestBackupWorkingCopy(resource));
                const event = new workbenchTestServices_1.TestBeforeShutdownEvent();
                event.reason = shutdownReason;
                accessor.lifecycleService.fireBeforeShutdown(event);
                const veto = await event.value;
                assert.ok(typeof event.finalValue === 'function'); // assert the tracker uses the internal finalVeto API
                assert.strictEqual(accessor.workingCopyBackupService.discardedBackups.length, 0); // When hot exit is set, backups should never be cleaned since the confirm result is cancel
                assert.strictEqual(veto, shouldVeto);
                await cleanup();
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBUcmFja2VyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvdGVzdC9lbGVjdHJvbi1zYW5kYm94L3dvcmtpbmdDb3B5QmFja3VwVHJhY2tlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBNkNoRyxLQUFLLENBQUMsbUNBQW1DLEVBQUU7UUFFMUMsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNkIsU0FBUSx5REFBOEI7WUFFeEUsWUFDNEIsd0JBQW1ELEVBQ2xELHlCQUFxRCxFQUM1RCxrQkFBdUMsRUFDekMsZ0JBQW1DLEVBQ2xDLGlCQUFxQyxFQUN6QyxhQUE2QixFQUNuQixjQUF3QyxFQUM5QyxpQkFBcUMsRUFDNUMsVUFBdUIsRUFDcEIsYUFBNkIsRUFDeEIsa0JBQXVDLEVBQzFDLGVBQWlDLEVBQ3hCLHdCQUFtRCxFQUN4RCxrQkFBd0M7Z0JBRTlELEtBQUssQ0FBQyx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsd0JBQXdCLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixDQUFDLENBQUM7Z0JBc0JwUSxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO2dCQUMzRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO2dCQUU5QixrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO2dC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