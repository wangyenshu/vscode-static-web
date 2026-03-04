/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, event_1, utils_1, authenticationAccessService_1, authenticationService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createSession() {
        return { id: 'session1', accessToken: 'token1', account: { id: 'account', label: 'Account' }, scopes: ['test'] };
    }
    function createProvider(overrides = {}) {
        return {
            supportsMultipleAccounts: false,
            onDidChangeSessions: new event_1.Emitter().event,
            id: 'test',
            label: 'Test',
            getSessions: async () => [],
            createSession: async () => createSession(),
            removeSession: async () => { },
            ...overrides
        };
    }
    suite('AuthenticationService', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let authenticationService;
        setup(() => {
            const storageService = disposables.add(new workbenchTestServices_1.TestStorageService());
            const authenticationAccessService = disposables.add(new authenticationAccessService_1.AuthenticationAccessService(storageService, workbenchTestServices_1.TestProductService));
            authenticationService = disposables.add(new authenticationService_1.AuthenticationService(new workbenchTestServices_1.TestExtensionService(), authenticationAccessService));
        });
        teardown(() => {
            // Dispose the authentication service after each test
            authenticationService.dispose();
        });
        suite('declaredAuthenticationProviders', () => {
            test('registerDeclaredAuthenticationProvider', async () => {
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeDeclaredProviders);
                const provider = {
                    id: 'github',
                    label: 'GitHub'
                };
                authenticationService.registerDeclaredAuthenticationProvider(provider);
                // Assert that the provider is added to the declaredProviders array and the event fires
                assert.equal(authenticationService.declaredProviders.length, 1);
                assert.deepEqual(authenticationService.declaredProviders[0], provider);
                await changed;
            });
            test('unregisterDeclaredAuthenticationProvider', async () => {
                const provider = {
                    id: 'github',
                    label: 'GitHub'
                };
                authenticationService.registerDeclaredAuthenticationProvider(provider);
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeDeclaredProviders);
                authenticationService.unregisterDeclaredAuthenticationProvider(provider.id);
                // Assert that the provider is removed from the declaredProviders array and the event fires
                assert.equal(authenticationService.declaredProviders.length, 0);
                await changed;
            });
        });
        suite('authenticationProviders', () => {
            test('isAuthenticationProviderRegistered', async () => {
                const registered = event_1.Event.toPromise(authenticationService.onDidRegisterAuthenticationProvider);
                const provider = createProvider();
                assert.equal(authenticationService.isAuthenticationProviderRegistered(provider.id), false);
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                assert.equal(authenticationService.isAuthenticationProviderRegistered(provider.id), true);
                const result = await registered;
                assert.deepEqual(result, { id: provider.id, label: provider.label });
            });
            test('unregisterAuthenticationProvider', async () => {
                const unregistered = event_1.Event.toPromise(authenticationService.onDidUnregisterAuthenticationProvider);
                const provider = createProvider();
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                assert.equal(authenticationService.isAuthenticationProviderRegistered(provider.id), true);
                authenticationService.unregisterAuthenticationProvider(provider.id);
                assert.equal(authenticationService.isAuthenticationProviderRegistered(provider.id), false);
                const result = await unregistered;
                assert.deepEqual(result, { id: provider.id, label: provider.label });
            });
            test('getProviderIds', () => {
                const provider1 = createProvider({
                    id: 'provider1',
                    label: 'Provider 1'
                });
                const provider2 = createProvider({
                    id: 'provider2',
                    label: 'Provider 2'
                });
                authenticationService.registerAuthenticationProvider(provider1.id, provider1);
                authenticationService.registerAuthenticationProvider(provider2.id, provider2);
                const providerIds = authenticationService.getProviderIds();
                // Assert that the providerIds array contains the registered provider ids
                assert.deepEqual(providerIds, [provider1.id, provider2.id]);
            });
            test('getProvider', () => {
                const provider = createProvider();
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                const retrievedProvider = authenticationService.getProvider(provider.id);
                // Assert that the retrieved provider is the same as the registered provider
                assert.deepEqual(retrievedProvider, provider);
            });
        });
        suite('authenticationSessions', () => {
            test('getSessions', async () => {
                let isCalled = false;
                const provider = createProvider({
                    getSessions: async () => {
                        isCalled = true;
                        return [createSession()];
                    },
                });
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                const sessions = await authenticationService.getSessions(provider.id);
                assert.equal(sessions.length, 1);
                assert.ok(isCalled);
            });
            test('createSession', async () => {
                const emitter = new event_1.Emitter();
                const provider = createProvider({
                    onDidChangeSessions: emitter.event,
                    createSession: async () => {
                        const session = createSession();
                        emitter.fire({ added: [session], removed: [], changed: [] });
                        return session;
                    },
                });
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeSessions);
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                const session = await authenticationService.createSession(provider.id, ['repo']);
                // Assert that the created session matches the expected session and the event fires
                assert.ok(session);
                const result = await changed;
                assert.deepEqual(result, {
                    providerId: provider.id,
                    label: provider.label,
                    event: { added: [session], removed: [], changed: [] }
                });
            });
            test('removeSession', async () => {
                const emitter = new event_1.Emitter();
                const session = createSession();
                const provider = createProvider({
                    onDidChangeSessions: emitter.event,
                    removeSession: async () => emitter.fire({ added: [], removed: [session], changed: [] })
                });
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeSessions);
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                await authenticationService.removeSession(provider.id, session.id);
                const result = await changed;
                assert.deepEqual(result, {
                    providerId: provider.id,
                    label: provider.label,
                    event: { added: [], removed: [session], changed: [] }
                });
            });
            test('onDidChangeSessions', async () => {
                const emitter = new event_1.Emitter();
                const provider = createProvider({
                    onDidChangeSessions: emitter.event,
                    getSessions: async () => []
                });
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeSessions);
                const session = createSession();
                emitter.fire({ added: [], removed: [], changed: [session] });
                const result = await changed;
                assert.deepEqual(result, {
                    providerId: provider.id,
                    label: provider.label,
                    event: { added: [], removed: [], changed: [session] }
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25TZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYXV0aGVudGljYXRpb24vdGVzdC9icm93c2VyL2F1dGhlbnRpY2F0aW9uU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLFNBQVMsYUFBYTtRQUNyQixPQUFPLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDbEgsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFDLFlBQThDLEVBQUU7UUFDdkUsT0FBTztZQUNOLHdCQUF3QixFQUFFLEtBQUs7WUFDL0IsbUJBQW1CLEVBQUUsSUFBSSxlQUFPLEVBQXFDLENBQUMsS0FBSztZQUMzRSxFQUFFLEVBQUUsTUFBTTtZQUNWLEtBQUssRUFBRSxNQUFNO1lBQ2IsV0FBVyxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsRUFBRTtZQUMzQixhQUFhLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxhQUFhLEVBQUU7WUFDMUMsYUFBYSxFQUFFLEtBQUssSUFBSSxFQUFFLEdBQUcsQ0FBQztZQUM5QixHQUFHLFNBQVM7U0FDWixDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFDbkMsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTlELElBQUkscUJBQTRDLENBQUM7UUFFakQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE1BQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUM7WUFDakUsTUFBTSwyQkFBMkIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUkseURBQTJCLENBQUMsY0FBYyxFQUFFLDBDQUFrQixDQUFDLENBQUMsQ0FBQztZQUN6SCxxQkFBcUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksNkNBQXFCLENBQUMsSUFBSSw0Q0FBb0IsRUFBRSxFQUFFLDJCQUEyQixDQUFDLENBQUMsQ0FBQztRQUM3SCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixxREFBcUQ7WUFDckQscUJBQXFCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1lBQzdDLElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDekQsTUFBTSxPQUFPLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO2dCQUNwRixNQUFNLFFBQVEsR0FBc0M7b0JBQ25ELEVBQUUsRUFBRSxRQUFRO29CQUNaLEtBQUssRUFBRSxRQUFRO2lCQUNmLENBQUM7Z0JBQ0YscUJBQXFCLENBQUMsc0NBQXNDLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRXZFLHVGQUF1RjtnQkFDdkYsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sT0FBTyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzNELE1BQU0sUUFBUSxHQUFzQztvQkFDbkQsRUFBRSxFQUFFLFFBQVE7b0JBQ1osS0FBSyxFQUFFLFFBQVE7aUJBQ2YsQ0FBQztnQkFDRixxQkFBcUIsQ0FBQyxzQ0FBc0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdkUsTUFBTSxPQUFPLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO2dCQUNwRixxQkFBcUIsQ0FBQyx3Q0FBd0MsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTVFLDJGQUEyRjtnQkFDM0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sT0FBTyxDQUFDO1lBQ2YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7WUFDckMsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNyRCxNQUFNLFVBQVUsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLG1DQUFtQyxDQUFDLENBQUM7Z0JBQzlGLE1BQU0sUUFBUSxHQUFHLGNBQWMsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLGtDQUFrQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDM0YscUJBQXFCLENBQUMsOEJBQThCLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxrQ0FBa0MsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzFGLE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDO2dCQUNoQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUN0RSxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDbkQsTUFBTSxZQUFZLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO2dCQUNsRyxNQUFNLFFBQVEsR0FBRyxjQUFjLEVBQUUsQ0FBQztnQkFDbEMscUJBQXFCLENBQUMsOEJBQThCLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxrQ0FBa0MsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzFGLHFCQUFxQixDQUFDLGdDQUFnQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxrQ0FBa0MsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNGLE1BQU0sTUFBTSxHQUFHLE1BQU0sWUFBWSxDQUFDO2dCQUNsQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUN0RSxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7Z0JBQzNCLE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQztvQkFDaEMsRUFBRSxFQUFFLFdBQVc7b0JBQ2YsS0FBSyxFQUFFLFlBQVk7aUJBQ25CLENBQUMsQ0FBQztnQkFDSCxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUM7b0JBQ2hDLEVBQUUsRUFBRSxXQUFXO29CQUNmLEtBQUssRUFBRSxZQUFZO2lCQUNuQixDQUFDLENBQUM7Z0JBRUgscUJBQXFCLENBQUMsOEJBQThCLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDOUUscUJBQXFCLENBQUMsOEJBQThCLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFOUUsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBRTNELHlFQUF5RTtnQkFDekUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7Z0JBQ3hCLE1BQU0sUUFBUSxHQUFHLGNBQWMsRUFBRSxDQUFDO2dCQUVsQyxxQkFBcUIsQ0FBQyw4QkFBOEIsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUU1RSxNQUFNLGlCQUFpQixHQUFHLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRXpFLDRFQUE0RTtnQkFDNUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMvQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtZQUNwQyxJQUFJLENBQUMsYUFBYSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUM5QixJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ3JCLE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQztvQkFDL0IsV0FBVyxFQUFFLEtBQUssSUFBSSxFQUFFO3dCQUN2QixRQUFRLEdBQUcsSUFBSSxDQUFDO3dCQUNoQixPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztpQkFDRCxDQUFDLENBQUM7Z0JBQ0gscUJBQXFCLENBQUMsOEJBQThCLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxRQUFRLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUV0RSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLGVBQU8sRUFBcUMsQ0FBQztnQkFDakUsTUFBTSxRQUFRLEdBQUcsY0FBYyxDQUFDO29CQUMvQixtQkFBbUIsRUFBRSxPQUFPLENBQUMsS0FBSztvQkFDbEMsYUFBYSxFQUFFLEtBQUssSUFBSSxFQUFFO3dCQUN6QixNQUFNLE9BQU8sR0FBRyxhQUFhLEVBQUUsQ0FBQzt3QkFDaEMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQzdELE9BQU8sT0FBTyxDQUFDO29CQUNoQixDQUFDO2lCQUNELENBQUMsQ0FBQztnQkFDSCxNQUFNLE9BQU8sR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQzNFLHFCQUFxQixDQUFDLDhCQUE4QixDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sT0FBTyxHQUFHLE1BQU0scUJBQXFCLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUVqRixtRkFBbUY7Z0JBQ25GLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ25CLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDO2dCQUM3QixNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtvQkFDeEIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUFFO29CQUN2QixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7b0JBQ3JCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtpQkFDckQsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLGVBQU8sRUFBcUMsQ0FBQztnQkFDakUsTUFBTSxPQUFPLEdBQUcsYUFBYSxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQztvQkFDL0IsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLEtBQUs7b0JBQ2xDLGFBQWEsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztpQkFDdkYsQ0FBQyxDQUFDO2dCQUNILE1BQU0sT0FBTyxHQUFHLGFBQUssQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDM0UscUJBQXFCLENBQUMsOEJBQThCLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRW5FLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDO2dCQUM3QixNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtvQkFDeEIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUFFO29CQUN2QixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7b0JBQ3JCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtpQkFDckQsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3RDLE1BQU0sT0FBTyxHQUFHLElBQUksZUFBTyxFQUFxQyxDQUFDO2dCQUNqRSxNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUM7b0JBQy9CLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxLQUFLO29CQUNsQyxXQUFXLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxFQUFFO2lCQUMzQixDQUFDLENBQUM7Z0JBQ0gscUJBQXFCLENBQUMsOEJBQThCLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFFNUUsTUFBTSxPQUFPLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLE9BQU8sR0FBRyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTdELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDO2dCQUM3QixNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtvQkFDeEIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxFQUFFO29CQUN2QixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7b0JBQ3JCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRTtpQkFDckQsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=