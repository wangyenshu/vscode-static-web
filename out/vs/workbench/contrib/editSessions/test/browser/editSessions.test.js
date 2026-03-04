/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/workbench/contrib/editSessions/browser/editSessions.contribution", "vs/workbench/services/progress/browser/progressService", "vs/platform/progress/common/progress", "vs/workbench/contrib/scm/common/scm", "vs/workbench/contrib/scm/common/scmService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/platform/workspace/common/workspace", "vs/base/test/common/mock", "sinon", "assert", "vs/workbench/contrib/editSessions/common/editSessions", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/environment/common/environment", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/common/views", "vs/editor/common/services/resolverService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/editor/common/editorService", "vs/base/common/cancellation", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/editSessions", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/services/workspaces/common/workspaceIdentityService"], function (require, exports, lifecycle_1, files_1, fileService_1, network_1, inMemoryFilesystemProvider_1, instantiationServiceMock_1, log_1, editSessions_contribution_1, progressService_1, progress_1, scm_1, scmService_1, testConfigurationService_1, configuration_1, workspace_1, mock_1, sinon, assert, editSessions_1, uri_1, resources_1, notification_1, testNotificationService_1, workbenchTestServices_1, environment_1, mockKeybindingService_1, contextkey_1, themeService_1, event_1, views_1, resolverService_1, lifecycle_2, dialogs_1, editorService_1, cancellation_1, telemetry_1, telemetryUtils_1, remoteAgentService_1, extensions_1, editSessions_2, userDataProfile_1, productService_1, storage_1, workbenchTestServices_2, uriIdentity_1, uriIdentityService_1, workspaceIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const folderName = 'test-folder';
    const folderUri = uri_1.URI.file(`/${folderName}`);
    suite('Edit session sync', () => {
        let instantiationService;
        let editSessionsContribution;
        let fileService;
        let sandbox;
        const disposables = new lifecycle_1.DisposableStore();
        suiteSetup(() => {
            sandbox = sinon.createSandbox();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            // Set up filesystem
            const logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(network_1.Schemas.file, fileSystemProvider);
            // Stub out all services
            instantiationService.stub(editSessions_1.IEditSessionsLogService, logService);
            instantiationService.stub(files_1.IFileService, fileService);
            instantiationService.stub(lifecycle_2.ILifecycleService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onWillShutdown = event_1.Event.None;
                }
            });
            instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
            instantiationService.stub(productService_1.IProductService, { 'editSessions.store': { url: 'https://test.com', canSwitch: true, authenticationProviders: {} } });
            instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_2.TestStorageService());
            instantiationService.stub(uriIdentity_1.IUriIdentityService, new uriIdentityService_1.UriIdentityService(fileService));
            instantiationService.stub(editSessions_1.IEditSessionsStorageService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidSignIn = event_1.Event.None;
                    this.onDidSignOut = event_1.Event.None;
                }
            });
            instantiationService.stub(extensions_1.IExtensionService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidChangeExtensions = event_1.Event.None;
                }
            });
            instantiationService.stub(progress_1.IProgressService, progressService_1.ProgressService);
            instantiationService.stub(scm_1.ISCMService, scmService_1.SCMService);
            instantiationService.stub(environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(dialogs_1.IDialogService, new class extends (0, mock_1.mock)() {
                async prompt(prompt) {
                    const result = prompt.buttons?.[0].run({ checkboxChecked: false });
                    return { result };
                }
                async confirm() {
                    return { confirmed: false };
                }
            });
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, new class extends (0, mock_1.mock)() {
                async getEnvironment() {
                    return null;
                }
            });
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService({ workbench: { experimental: { editSessions: { enabled: true } } } }));
            instantiationService.stub(workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                getWorkspace() {
                    return {
                        id: 'workspace-id',
                        folders: [{
                                uri: folderUri,
                                name: folderName,
                                index: 0,
                                toResource: (relativePath) => (0, resources_1.joinPath)(folderUri, relativePath)
                            }]
                    };
                }
                getWorkbenchState() {
                    return 2 /* WorkbenchState.FOLDER */;
                }
            });
            // Stub repositories
            instantiationService.stub(scm_1.ISCMService, '_repositories', new Map());
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(themeService_1.IThemeService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidColorThemeChange = event_1.Event.None;
                    this.onDidFileIconThemeChange = event_1.Event.None;
                }
            });
            instantiationService.stub(views_1.IViewDescriptorService, {
                onDidChangeLocation: event_1.Event.None
            });
            instantiationService.stub(resolverService_1.ITextModelService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.registerTextModelContentProvider = () => ({ dispose: () => { } });
                }
            });
            instantiationService.stub(editorService_1.IEditorService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.saveAll = async (_options) => { return { success: true, editors: [] }; };
                }
            });
            instantiationService.stub(editSessions_2.IEditSessionIdentityService, new class extends (0, mock_1.mock)() {
                async getEditSessionIdentifier() {
                    return 'test-identity';
                }
            });
            instantiationService.set(workspaceIdentityService_1.IWorkspaceIdentityService, instantiationService.createInstance(workspaceIdentityService_1.WorkspaceIdentityService));
            instantiationService.stub(userDataProfile_1.IUserDataProfilesService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.defaultProfile = {
                        id: 'default',
                        name: 'Default',
                        isDefault: true,
                        location: uri_1.URI.file('location'),
                        globalStorageHome: uri_1.URI.file('globalStorageHome'),
                        settingsResource: uri_1.URI.file('settingsResource'),
                        keybindingsResource: uri_1.URI.file('keybindingsResource'),
                        tasksResource: uri_1.URI.file('tasksResource'),
                        snippetsHome: uri_1.URI.file('snippetsHome'),
                        extensionsResource: uri_1.URI.file('extensionsResource'),
                        cacheHome: uri_1.URI.file('cacheHome'),
                    };
                }
            });
            editSessionsContribution = instantiationService.createInstance(editSessions_contribution_1.EditSessionsContribution);
        });
        teardown(() => {
            sinon.restore();
            disposables.clear();
        });
        test('Can apply edit session', async function () {
            const fileUri = (0, resources_1.joinPath)(folderUri, 'dir1', 'README.md');
            const fileContents = '# readme';
            const editSession = {
                version: 1,
                folders: [
                    {
                        name: folderName,
                        workingChanges: [
                            {
                                relativeFilePath: 'dir1/README.md',
                                fileType: editSessions_1.FileType.File,
                                contents: fileContents,
                                type: editSessions_1.ChangeType.Addition
                            }
                        ]
                    }
                ]
            };
            // Stub sync service to return edit session data
            const readStub = sandbox.stub().returns({ content: JSON.stringify(editSession), ref: '0' });
            instantiationService.stub(editSessions_1.IEditSessionsStorageService, 'read', readStub);
            // Create root folder
            await fileService.createFolder(folderUri);
            // Resume edit session
            await editSessionsContribution.resumeEditSession();
            // Verify edit session was correctly applied
            assert.equal((await fileService.readFile(fileUri)).value.toString(), fileContents);
        });
        test('Edit session not stored if there are no edits', async function () {
            const writeStub = sandbox.stub();
            instantiationService.stub(editSessions_1.IEditSessionsStorageService, 'write', writeStub);
            // Create root folder
            await fileService.createFolder(folderUri);
            await editSessionsContribution.storeEditSession(true, cancellation_1.CancellationToken.None);
            // Verify that we did not attempt to write the edit session
            assert.equal(writeStub.called, false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9lZGl0U2Vzc2lvbnMvdGVzdC9icm93c2VyL2VkaXRTZXNzaW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0RoRyxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUM7SUFDakMsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFN0MsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUMvQixJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksd0JBQWtELENBQUM7UUFDdkQsSUFBSSxXQUF3QixDQUFDO1FBQzdCLElBQUksT0FBMkIsQ0FBQztRQUVoQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ2YsT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUVoQyxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFFdEQsb0JBQW9CO1lBQ3BCLE1BQU0sVUFBVSxHQUFHLElBQUksb0JBQWMsRUFBRSxDQUFDO1lBQ3hDLFdBQVcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVEQUEwQixFQUFFLENBQUMsQ0FBQztZQUM3RSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUUvRCx3QkFBd0I7WUFDeEIsb0JB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