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
define(["require", "exports", "assert", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/uri", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/browser/quickaccess", "vs/editor/common/core/range"], function (require, exports, assert, platform_1, quickAccess_1, quickInput_1, workbenchTestServices_1, lifecycle_1, async_1, pickerQuickAccess_1, uri_1, editorGroupsService_1, editorService_1, editorService_2, quickaccess_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('QuickAccess', () => {
        let disposables;
        let instantiationService;
        let accessor;
        let providerDefaultCalled = false;
        let providerDefaultCanceled = false;
        let providerDefaultDisposed = false;
        let provider1Called = false;
        let provider1Canceled = false;
        let provider1Disposed = false;
        let provider2Called = false;
        let provider2Canceled = false;
        let provider2Disposed = false;
        let provider3Called = false;
        let provider3Canceled = false;
        let provider3Disposed = false;
        let TestProviderDefault = class TestProviderDefault {
            constructor(quickInputService, disposables) {
                this.quickInputService = quickInputService;
            }
            provide(picker, token) {
                assert.ok(picker);
                providerDefaultCalled = true;
                token.onCancellationRequested(() => providerDefaultCanceled = true);
                // bring up provider #3
                setTimeout(() => this.quickInputService.quickAccess.show(providerDescriptor3.prefix));
                return (0, lifecycle_1.toDisposable)(() => providerDefaultDisposed = true);
            }
        };
        TestProviderDefault = __decorate([
            __param(0, quickInput_1.IQuickInputService)
        ], TestProviderDefault);
        class TestProvider1 {
            provide(picker, token) {
                assert.ok(picker);
                provider1Called = true;
                token.onCancellationRequested(() => provider1Canceled = true);
                return (0, lifecycle_1.toDisposable)(() => provider1Disposed = true);
            }
        }
        class TestProvider2 {
            provide(picker, token) {
                assert.ok(picker);
                provider2Called = true;
                token.onCancellationRequested(() => provider2Canceled = true);
                return (0, lifecycle_1.toDisposable)(() => provider2Disposed = true);
            }
        }
        class TestProvider3 {
            provide(picker, token) {
                assert.ok(picker);
                provider3Called = true;
                token.onCancellationRequested(() => provider3Canceled = true);
                // hide without picking
                setTimeout(() => picker.hide());
                return (0, lifecycle_1.toDisposable)(() => provider3Disposed = true);
            }
        }
        const providerDescriptorDefault = { ctor: TestProviderDefault, prefix: '', helpEntries: [] };
        const providerDescriptor1 = { ctor: TestProvider1, prefix: 'test', helpEntries: [] };
        const providerDescriptor2 = { ctor: TestProvider2, prefix: 'test something', helpEntries: [] };
        const providerDescriptor3 = { ctor: TestProvider3, prefix: 'changed', helpEntries: [] };
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('registry', () => {
            const registry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            const restore = registry.clear();
            assert.ok(!registry.getQuickAccessProvider('test'));
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registry.registerQuickAccessProvider(providerDescriptorDefault));
            assert(registry.getQuickAccessProvider('') === providerDescriptorDefault);
            assert(registry.getQuickAccessProvider('test') === providerDescriptorDefault);
            const disposable = disposables.add(registry.registerQuickAccessProvider(providerDescriptor1));
            assert(registry.getQuickAccessProvider('test') === providerDescriptor1);
            const providers = registry.getQuickAccessProviders();
            assert(providers.some(provider => provider.prefix === 'test'));
            disposable.dispose();
            assert(registry.getQuickAccessProvider('test') === providerDescriptorDefault);
            disposables.dispose();
            assert.ok(!registry.getQuickAccessProvider('test'));
            restore();
        });
        test('provider', async () => {
            const registry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            const restore = registry.clear();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registry.registerQuickAccessProvider(providerDescriptorDefault));
            disposables.add(registry.registerQuickAccessProvider(providerDescriptor1));
            disposables.add(registry.registerQuickAccessProvider(providerDescriptor2));
            disposables.add(registry.registerQuickAccessProvider(providerDescriptor3));
            accessor.quickInputService.quickAccess.show('test');
            assert.strictEqual(providerDefaultCalled, false);
            assert.strictEqual(provider1Called, true);
            assert.strictEqual(provider2Called, false);
            assert.strictEqual(provider3Called, false);
            assert.strictEqual(providerDefaultCanceled, false);
            assert.strictEqual(provider1Canceled, false);
            assert.strictEqual(provider2Canceled, false);
            assert.strictEqual(provider3Canceled, false);
            assert.strictEqual(providerDefaultDisposed, false);
            assert.strictEqual(provider1Disposed, false);
            assert.strictEqual(provider2Disposed, false);
            assert.strictEqual(provider3Disposed, false);
            provider1Called = false;
            accessor.quickInputService.quickAccess.show('test something');
            assert.strictEqual(providerDefaultCalled, false);
            assert.strictEqual(provider1Called, false);
            assert.strictEqual(provider2Called, true);
            assert.strictEqual(provider3Called, false);
            assert.strictEqual(providerDefaultCanceled, false);
            assert.strictEqual(provider1Canceled, true);
            assert.strictEqual(provider2Canceled, false);
            assert.strictEqual(provider3Canceled, false);
            assert.strictEqual(providerDefaultDisposed, false);
            assert.strictEqual(provider1Disposed, true);
            assert.strictEqual(provider2Disposed, false);
            assert.strictEqual(provider3Disposed, false);
            provider2Called = false;
            provider1Canceled = false;
            provider1Disposed = false;
            accessor.quickInputService.quickAccess.show('usedefault');
            assert.strictEqual(providerDefaultCalled, true);
            assert.strictEqual(provider1Called, false);
            assert.strictEqual(provider2Called, false);
            assert.strictEqual(provider3Called, false);
            assert.strictEqual(providerDefaultCanceled, false);
            assert.strictEqual(provider1Canceled, false);
            assert.strictEqual(provider2Canceled, true);
            assert.strictEqual(provider3Canceled, false);
            assert.strictEqual(providerDefaultDisposed, false);
            assert.strictEqual(provider1Disposed, false);
            assert.strictEqual(provider2Disposed, true);
            assert.strictEqual(provider3Disposed, false);
            await (0, async_1.timeout)(1);
            assert.strictEqual(providerDefaultCanceled, true);
            assert.strictEqual(providerDefaultDisposed, true);
            assert.strictEqual(provider3Called, true);
            await (0, async_1.timeout)(1);
            assert.strictEqual(provider3Canceled, true);
            assert.strictEqual(provider3Disposed, true);
            disposables.dispose();
            restore();
        });
        let fastProviderCalled = false;
        let slowProviderCalled = false;
        let fastAndSlowProviderCalled = false;
        let slowProviderCanceled = false;
        let fastAndSlowProviderCanceled = false;
        class FastTestQuickPickProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
            constructor() {
                super('fast');
            }
            _getPicks(filter, disposables, token) {
                fastProviderCalled = true;
                return [{ label: 'Fast Pick' }];
            }
        }
        class SlowTestQuickPickProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
            constructor() {
                super('slow');
            }
            async _getPicks(filter, disposables, token) {
                slowProviderCalled = true;
                await (0, async_1.timeout)(1);
                if (token.isCancellationRequested) {
                    slowProviderCanceled = true;
                }
                return [{ label: 'Slow Pick' }];
            }
        }
        class FastAndSlowTestQuickPickProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
            constructor() {
                super('bothFastAndSlow');
            }
            _getPicks(filter, disposables, token) {
                fastAndSlowProviderCalled = true;
                return {
                    picks: [{ label: 'Fast Pick' }],
                    additionalPicks: (async () => {
                        await (0, async_1.timeout)(1);
                        if (token.isCancellationRequested) {
                            fastAndSlowProviderCanceled = true;
                        }
                        return [{ label: 'Slow Pick' }];
                    })()
                };
            }
        }
        const fastProviderDescriptor = { ctor: FastTestQuickPickProvider, prefix: 'fast', helpEntries: [] };
        const slowProviderDescriptor = { ctor: SlowTestQuickPickProvider, prefix: 'slow', helpEntries: [] };
        const fastAndSlowProviderDescriptor = { ctor: FastAndSlowTestQuickPickProvider, prefix: 'bothFastAndSlow', helpEntries: [] };
        test('quick pick access - show()', async () => {
            const registry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            const restore = registry.clear();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registry.registerQuickAccessProvider(fastProviderDescriptor));
            disposables.add(registry.registerQuickAccessProvider(slowProviderDescriptor));
            disposables.add(registry.registerQuickAccessProvider(fastAndSlowProviderDescriptor));
            accessor.quickInputService.quickAccess.show('fast');
            assert.strictEqual(fastProviderCalled, true);
            assert.strictEqual(slowProviderCalled, false);
            assert.strictEqual(fastAndSlowProviderCalled, false);
            fastProviderCalled = false;
            accessor.quickInputService.quickAccess.show('slow');
            await (0, async_1.timeout)(2);
            assert.strictEqual(fastProviderCalled, false);
            assert.strictEqual(slowProviderCalled, true);
            assert.strictEqual(slowProviderCanceled, false);
            assert.strictEqual(fastAndSlowProviderCalled, false);
            slowProviderCalled = false;
            accessor.quickInputService.quickAccess.show('bothFastAndSlow');
            await (0, async_1.timeout)(2);
            assert.strictEqual(fastProviderCalled, false);
            assert.strictEqual(slowProviderCalled, false);
            assert.strictEqual(fastAndSlowProviderCalled, true);
            assert.strictEqual(fastAndSlowProviderCanceled, false);
            fastAndSlowProviderCalled = false;
            accessor.quickInputService.quickAccess.show('slow');
            accessor.quickInputService.quickAccess.show('bothFastAndSlow');
            accessor.quickInputService.quickAccess.show('fast');
            assert.strictEqual(fastProviderCalled, true);
            assert.strictEqual(slowProviderCalled, true);
            assert.strictEqual(fastAndSlowProviderCalled, true);
            await (0, async_1.timeout)(2);
            assert.strictEqual(slowProviderCanceled, true);
            assert.strictEqual(fastAndSlowProviderCanceled, true);
            disposables.dispose();
            restore();
        });
        test('quick pick access - pick()', async () => {
            const registry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            const restore = registry.clear();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registry.registerQuickAccessProvider(fastProviderDescriptor));
            const result = accessor.quickInputService.quickAccess.pick('fast');
            assert.strictEqual(fastProviderCalled, true);
            assert.ok(result instanceof Promise);
            disposables.dispose();
            restore();
        });
        test('PickerEditorState can properly restore editors', async () => {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            instantiationService.stub(editorService_1.IEditorService, editorService);
            const editorViewState = disposables.add(instantiationService.createInstance(quickaccess_1.PickerEditorState));
            disposables.add(part);
            disposables.add(editorService);
            const input1 = {
                resource: uri_1.URI.parse('foo://bar1'),
                options: {
                    pinned: true, preserveFocus: true, selection: new range_1.Range(1, 0, 1, 3)
                }
            };
            const input2 = {
                resource: uri_1.URI.parse('foo://bar2'),
                options: {
                    pinned: true, selection: new range_1.Range(1, 0, 1, 3)
                }
            };
            const input3 = {
                resource: uri_1.URI.parse('foo://bar3')
            };
            const input4 = {
                resource: uri_1.URI.parse('foo://bar4')
            };
            const editor = await editorService.openEditor(input1);
            assert.strictEqual(editor, editorService.activeEditorPane);
            editorViewState.set();
            await editorService.openEditor(input2);
            await editorViewState.openTransientEditor(input3);
            await editorViewState.openTransientEditor(input4);
            await editorViewState.restore();
            assert.strictEqual(part.activeGroup.activeEditor?.resource, input1.resource);
            assert.deepStrictEqual(part.activeGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).map(e => e.resource), [input1.resource, input2.resource]);
            if (part.activeGroup.activeEditorPane?.getSelection) {
                assert.deepStrictEqual(part.activeGroup.activeEditorPane?.getSelection(), input1.options.selection);
            }
            await part.activeGroup.closeAllEditors();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tBY2Nlc3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2Jyb3dzZXIvcXVpY2tBY2Nlc3MudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQW9CaEcsS0FBSyxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFFekIsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSxRQUE2QixDQUFDO1FBRWxDLElBQUkscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQ2xDLElBQUksdUJBQXVCLEdBQUcsS0FBSyxDQUFDO1FBQ3BDLElBQUksdUJBQXVCLEdBQUcsS0FBSyxDQUFDO1FBRXBDLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztRQUM1QixJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztRQUM5QixJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztRQUU5QixJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDNUIsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDOUIsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFFOUIsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzVCLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1FBQzlCLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1FBRTlCLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1lBRXhCLFlBQWlELGlCQUFxQyxFQUFFLFdBQTRCO2dCQUFuRSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQWtDLENBQUM7WUFFekgsT0FBTyxDQUFDLE1BQWtDLEVBQUUsS0FBd0I7Z0JBQ25FLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFD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