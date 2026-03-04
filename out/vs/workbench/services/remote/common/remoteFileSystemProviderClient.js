/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/files/common/diskFileSystemProviderClient"], function (require, exports, errors_1, lifecycle_1, network_1, diskFileSystemProviderClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteFileSystemProviderClient = exports.REMOTE_FILE_SYSTEM_CHANNEL_NAME = void 0;
    exports.REMOTE_FILE_SYSTEM_CHANNEL_NAME = 'remoteFilesystem';
    class RemoteFileSystemProviderClient extends diskFileSystemProviderClient_1.DiskFileSystemProviderClient {
        static register(remoteAgentService, fileService, logService) {
            const connection = remoteAgentService.getConnection();
            if (!connection) {
                return lifecycle_1.Disposable.None;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const environmentPromise = (async () => {
                try {
                    const environment = await remoteAgentService.getRawEnvironment();
                    if (environment) {
                        // Register remote fsp even before it is asked to activate
                        // because, some features (configuration) wait for its
                        // registration before making fs calls.
                        fileService.registerProvider(network_1.Schemas.vscodeRemote, disposables.add(new RemoteFileSystemProviderClient(environment, connection)));
                    }
                    else {
                        logService.error('Cannot register remote filesystem provider. Remote environment doesnot exist.');
                    }
                }
                catch (error) {
                    logService.error('Cannot register remote filesystem provider. Error while fetching remote environment.', (0, errors_1.getErrorMessage)(error));
                }
            })();
            disposables.add(fileService.onWillActivateFileSystemProvider(e => {
                if (e.scheme === network_1.Schemas.vscodeRemote) {
                    e.join(environmentPromise);
                }
            }));
            return disposables;
        }
        constructor(remoteAgentEnvironment, connection) {
            super(connection.getChannel(exports.REMOTE_FILE_SYSTEM_CHANNEL_NAME), { pathCaseSensitive: remoteAgentEnvironment.os === 3 /* OperatingSystem.Linux */ });
        }
    }
    exports.RemoteFileSystemProviderClient = RemoteFileSystemProviderClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRmlsZVN5c3RlbVByb3ZpZGVyQ2xpZW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3JlbW90ZS9jb21tb24vcmVtb3RlRmlsZVN5c3RlbVByb3ZpZGVyQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVluRixRQUFBLCtCQUErQixHQUFHLGtCQUFrQixDQUFDO0lBRWxFLE1BQWEsOEJBQStCLFNBQVEsMkRBQTRCO1FBRS9FLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXVDLEVBQUUsV0FBeUIsRUFBRSxVQUF1QjtZQUMxRyxNQUFNLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0RCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUM7WUFDeEIsQ0FBQztZQUVELE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDdEMsSUFBSSxDQUFDO29CQUNKLE1BQU0sV0FBVyxHQUFHLE1BQU0sa0JBQWtCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDakUsSUFBSSxXQUFXLEVBQUUsQ0FBQzt3QkFDakIsMERBQTBEO3dCQUMxRCxzREFBc0Q7d0JBQ3RELHVDQUF1Qzt3QkFDdkMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFPLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw4QkFBOEIsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsSSxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsVUFBVSxDQUFDLEtBQUssQ0FBQywrRUFBK0UsQ0FBQyxDQUFDO29CQUNuRyxDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsVUFBVSxDQUFDLEtBQUssQ0FBQyxzRkFBc0YsRUFBRSxJQUFBLHdCQUFlLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDbEksQ0FBQztZQUNGLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFFTCxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEUsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3ZDLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFdBQVcsQ0FBQztRQUNwQixDQUFDO1FBRUQsWUFBb0Isc0JBQStDLEVBQUUsVUFBa0M7WUFDdEcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsdUNBQStCLENBQUMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixDQUFDLEVBQUUsa0NBQTBCLEVBQUUsQ0FBQyxDQUFDO1FBQzNJLENBQUM7S0FDRDtJQXRDRCx3RUFzQ0MifQ==