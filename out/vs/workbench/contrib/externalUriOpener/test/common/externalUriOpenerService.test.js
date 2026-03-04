/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/languages", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService"], function (require, exports, assert, cancellation_1, lifecycle_1, uri_1, utils_1, languages_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, opener_1, quickInput_1, externalUriOpenerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MockQuickInputService {
        constructor(pickIndex) {
            this.pickIndex = pickIndex;
        }
        async pick(picks, options, token) {
            const resolvedPicks = await picks;
            const item = resolvedPicks[this.pickIndex];
            if (item.type === 'separator') {
                return undefined;
            }
            return item;
        }
    }
    suite('ExternalUriOpenerService', () => {
        let disposables;
        let instantiationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(opener_1.IOpenerService, {
                registerExternalOpener: () => { return lifecycle_1.Disposable.None; }
            });
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Should not open if there are no openers', async () => {
            const externalUriOpenerService = disposables.add(instantiationService.createInstance(externalUriOpenerService_1.ExternalUriOpenerService));
            externalUriOpenerService.registerExternalOpenerProvider(new class {
                async *getOpeners(_targetUri) {
                    // noop
                }
            });
            const uri = uri_1.URI.parse('http://contoso.com');
            const didOpen = await externalUriOpenerService.openExternal(uri.toString(), { sourceUri: uri }, cancellation_1.CancellationToken.None);
            assert.strictEqual(didOpen, false);
        });
        test('Should prompt if there is at least one enabled opener', async () => {
            instantiationService.stub(quickInput_1.IQuickInputService, new MockQuickInputService(0));
            const externalUriOpenerService = disposables.add(instantiationService.createInstance(externalUriOpenerService_1.ExternalUriOpenerService));
            let openedWithEnabled = false;
            externalUriOpenerService.registerExternalOpenerProvider(new class {
                async *getOpeners(_targetUri) {
                    yield {
                        id: 'disabled-id',
                        label: 'disabled',
                        canOpen: async () => languages_1.ExternalUriOpenerPriority.None,
                        openExternalUri: async () => true,
                    };
                    yield {
                        id: 'enabled-id',
                        label: 'enabled',
                        canOpen: async () => languages_1.ExternalUriOpenerPriority.Default,
                        openExternalUri: async () => {
                            openedWithEnabled = true;
                            return true;
                        }
                    };
                }
            });
            const uri = uri_1.URI.parse('http://contoso.com');
            const didOpen = await externalUriOpenerService.openExternal(uri.toString(), { sourceUri: uri }, cancellation_1.CancellationToken.None);
            assert.strictEqual(didOpen, true);
            assert.strictEqual(openedWithEnabled, true);
        });
        test('Should automatically pick single preferred opener without prompt', async () => {
            const externalUriOpenerService = disposables.add(instantiationService.createInstance(externalUriOpenerService_1.ExternalUriOpenerService));
            let openedWithPreferred = false;
            externalUriOpenerService.registerExternalOpenerProvider(new class {
                async *getOpeners(_targetUri) {
                    yield {
                        id: 'other-id',
                        label: 'other',
                        canOpen: async () => languages_1.ExternalUriOpenerPriority.Default,
                        openExternalUri: async () => {
                            return true;
                        }
                    };
                    yield {
                        id: 'preferred-id',
                        label: 'preferred',
                        canOpen: async () => languages_1.ExternalUriOpenerPriority.Preferred,
                        openExternalUri: async () => {
                            openedWithPreferred = true;
                            return true;
                        }
                    };
                }
            });
            const uri = uri_1.URI.parse('http://contoso.com');
            const didOpen = await externalUriOpenerService.openExternal(uri.toString(), { sourceUri: uri }, cancellation_1.CancellationToken.None);
            assert.strictEqual(didOpen, true);
            assert.strictEqual(openedWithPreferred, true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxVcmlPcGVuZXJTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlcm5hbFVyaU9wZW5lci90ZXN0L2NvbW1vbi9leHRlcm5hbFVyaU9wZW5lclNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsTUFBTSxxQkFBcUI7UUFFMUIsWUFDa0IsU0FBaUI7WUFBakIsY0FBUyxHQUFULFNBQVMsQ0FBUTtRQUMvQixDQUFDO1FBSUUsS0FBSyxDQUFDLElBQUksQ0FBMkIsS0FBeUQsRUFBRSxPQUE4QyxFQUFFLEtBQXlCO1lBQy9LLE1BQU0sYUFBYSxHQUFHLE1BQU0sS0FBSyxDQUFDO1lBQ2xDLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDM0MsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUMvQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBRUQ7SUFFRCxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBQ3RDLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLG9CQUE4QyxDQUFDO1FBRW5ELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsb0JBQW9CLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztZQUV2RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMscUNBQXFCLEVBQUUsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7WUFDakYsb0JBQW9CLENBQUMsSUFB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