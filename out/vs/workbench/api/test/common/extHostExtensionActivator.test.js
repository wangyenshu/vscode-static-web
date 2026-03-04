/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHostExtensionActivator", "vs/workbench/services/extensions/common/extensionDescriptionRegistry"], function (require, exports, assert, async_1, uri_1, extensions_1, log_1, extHostExtensionActivator_1, extensionDescriptionRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsActivator', () => {
        const idA = new extensions_1.ExtensionIdentifier(`a`);
        const idB = new extensions_1.ExtensionIdentifier(`b`);
        const idC = new extensions_1.ExtensionIdentifier(`c`);
        test('calls activate only once with sequential activations', async () => {
            const host = new SimpleExtensionsActivatorHost();
            const activator = createActivator(host, [
                desc(idA)
            ]);
            await activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.activateCalls, [idA]);
            await activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.activateCalls, [idA]);
        });
        test('calls activate only once with parallel activations', async () => {
            const extActivation = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivation]
            ]);
            const activator = createActivator(host, [
                desc(idA, [], ['evt1', 'evt2'])
            ]);
            const activate1 = activator.activateByEvent('evt1', false);
            const activate2 = activator.activateByEvent('evt2', false);
            extActivation.resolve();
            await activate1;
            await activate2;
            assert.deepStrictEqual(host.activateCalls, [idA]);
        });
        test('activates dependencies first', async () => {
            const extActivationA = new ExtensionActivationPromiseSource();
            const extActivationB = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivationA],
                [idB, extActivationB]
            ]);
            const activator = createActivator(host, [
                desc(idA, [idB], ['evt1']),
                desc(idB, [], ['evt1']),
            ]);
            const activate = activator.activateByEvent('evt1', false);
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB]);
            extActivationB.resolve();
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB, idA]);
            extActivationA.resolve();
            await (0, async_1.timeout)(0);
            await activate;
            assert.deepStrictEqual(host.activateCalls, [idB, idA]);
        });
        test('Supports having resolved extensions', async () => {
            const host = new SimpleExtensionsActivatorHost();
            const bExt = desc(idB);
            delete bExt.main;
            delete bExt.browser;
            const activator = createActivator(host, [
                desc(idA, [idB])
            ], [bExt]);
            await activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.activateCalls, [idA]);
        });
        test('Supports having external extensions', async () => {
            const extActivationA = new ExtensionActivationPromiseSource();
            const extActivationB = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivationA],
                [idB, extActivationB]
            ]);
            const bExt = desc(idB);
            bExt.api = 'none';
            const activator = createActivator(host, [
                desc(idA, [idB])
            ], [bExt]);
            const activate = activator.activateByEvent('*', false);
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB]);
            extActivationB.resolve();
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB, idA]);
            extActivationA.resolve();
            await activate;
            assert.deepStrictEqual(host.activateCalls, [idB, idA]);
        });
        test('Error: activateById with missing extension', async () => {
            const host = new SimpleExtensionsActivatorHost();
            const activator = createActivator(host, [
                desc(idA),
                desc(idB),
            ]);
            let error = undefined;
            try {
                await activator.activateById(idC, { startup: false, extensionId: idC, activationEvent: 'none' });
            }
            catch (err) {
                error = err;
            }
            assert.strictEqual(typeof error === 'undefined', false);
        });
        test('Error: dependency missing', async () => {
            const host = new SimpleExtensionsActivatorHost();
            const activator = createActivator(host, [
                desc(idA, [idB]),
            ]);
            await activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.errors.length, 1);
            assert.deepStrictEqual(host.errors[0][0], idA);
        });
        test('Error: dependency activation failed', async () => {
            const extActivationA = new ExtensionActivationPromiseSource();
            const extActivationB = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivationA],
                [idB, extActivationB]
            ]);
            const activator = createActivator(host, [
                desc(idA, [idB]),
                desc(idB)
            ]);
            const activate = activator.activateByEvent('*', false);
            extActivationB.reject(new Error(`b fails!`));
            await activate;
            assert.deepStrictEqual(host.errors.length, 2);
            assert.deepStrictEqual(host.errors[0][0], idB);
            assert.deepStrictEqual(host.errors[1][0], idA);
        });
        test('issue #144518: Problem with git extension and vscode-icons', async () => {
            const extActivationA = new ExtensionActivationPromiseSource();
            const extActivationB = new ExtensionActivationPromiseSource();
            const extActivationC = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivationA],
                [idB, extActivationB],
                [idC, extActivationC]
            ]);
            const activator = createActivator(host, [
                desc(idA, [idB]),
                desc(idB),
                desc(idC),
            ]);
            activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.activateCalls, [idB, idC]);
            extActivationB.resolve();
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB, idC, idA]);
            extActivationA.resolve();
        });
        class SimpleExtensionsActivatorHost {
            constructor() {
                this.activateCalls = [];
                this.errors = [];
            }
            onExtensionActivationError(extensionId, error, missingExtensionDependency) {
                this.errors.push([extensionId, error, missingExtensionDependency]);
            }
            actualActivateExtension(extensionId, reason) {
                this.activateCalls.push(extensionId);
                return Promise.resolve(new extHostExtensionActivator_1.EmptyExtension(extHostExtensionActivator_1.ExtensionActivationTimes.NONE));
            }
        }
        class PromiseExtensionsActivatorHost extends SimpleExtensionsActivatorHost {
            constructor(_promises) {
                super();
                this._promises = _promises;
            }
            actualActivateExtension(extensionId, reason) {
                this.activateCalls.push(extensionId);
                for (const [id, promiseSource] of this._promises) {
                    if (id.value === extensionId.value) {
                        return promiseSource.promise;
                    }
                }
                throw new Error(`Unexpected!`);
            }
        }
        class ExtensionActivationPromiseSource {
            constructor() {
                ({ promise: this.promise, resolve: this._resolve, reject: this._reject } = (0, async_1.promiseWithResolvers)());
            }
            resolve() {
                this._resolve(new extHostExtensionActivator_1.EmptyExtension(extHostExtensionActivator_1.ExtensionActivationTimes.NONE));
            }
            reject(err) {
                this._reject(err);
            }
        }
        const basicActivationEventsReader = {
            readActivationEvents: (extensionDescription) => {
                return extensionDescription.activationEvents ?? [];
            }
        };
        function createActivator(host, extensionDescriptions, otherHostExtensionDescriptions = []) {
            const registry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(basicActivationEventsReader, extensionDescriptions);
            const globalRegistry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(basicActivationEventsReader, extensionDescriptions.concat(otherHostExtensionDescriptions));
            return new extHostExtensionActivator_1.ExtensionsActivator(registry, globalRegistry, host, new log_1.NullLogService());
        }
        function desc(id, deps = [], activationEvents = ['*']) {
            return {
                name: id.value,
                publisher: 'test',
                version: '0.0.0',
                engines: { vscode: '^1.0.0' },
                identifier: id,
                extensionLocation: uri_1.URI.parse(`nothing://nowhere`),
                isBuiltin: false,
                isUnderDevelopment: false,
                isUserBuiltin: false,
                activationEvents,
                main: 'index.js',
                targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
                extensionDependencies: deps.map(d => d.value)
            };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEV4dGVuc2lvbkFjdGl2YXRvci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2NvbW1vbi9leHRIb3N0RXh0ZW5zaW9uQWN0aXZhdG9yLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUVqQyxNQUFNLEdBQUcsR0FBRyxJQUFJLGdDQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sR0FBRyxHQUFHLElBQUksZ0NBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekMsTUFBTSxHQUFHLEdBQUcsSUFBSSxnQ0FBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV6QyxJQUFJLENBQUMsc0RBQXNELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdkUsTUFBTSxJQUFJLEdBQUcsSUFBSSw2QkFBNkIsRUFBRSxDQUFDO1lBQ2pELE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUM7YUFDVCxDQUFDLENBQUM7WUFFSCxNQUFNLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFbEQsTUFBTSxTQUFTLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JFLE1BQU0sYUFBYSxHQUFHLElBQUksZ0NBQWdDLEVBQUUsQ0FBQztZQUM3RCxNQUFNLElBQUksR0FBRyxJQUFJLDhCQUE4QixDQUFDO2dCQUMvQyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUM7YUFDcEIsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRTtnQkFDdkMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDL0IsQ0FBQyxDQUFDO1lBRUgsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0QsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFM0QsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXhCLE1BQU0sU0FBUyxDQUFDO1lBQ2hCLE1BQU0sU0FBUyxDQUFDO1lBRWhCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO1lBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksZ0NBQWdDLEVBQUUsQ0FBQztZQUM5RCxNQUFNLElBQUksR0FBRyxJQUFJLDhCQUE4QixDQUFDO2dCQUMvQyxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUM7Z0JBQ3JCLENBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQzthQUNyQixDQUFDLENBQUM7WUFDSCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFO2dCQUN2QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN2QixDQUFDLENBQUM7WUFFSCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUxRCxNQUFNLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEQsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXpCLE1BQU0sSUFBQSxlQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkQsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXpCLE1BQU0sSUFBQSxlQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxRQUFRLENBQUM7WUFFZixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0RCxNQUFNLElBQUksR0FBRyxJQUFJLDZCQUE2QixFQUFFLENBQUM7WUFDakQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLE9BQXNDLElBQUssQ0FBQyxJQUFJLENBQUM7WUFDakQsT0FBc0MsSUFBSyxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFO2dCQUN2QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDaEIsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFWCxNQUFNLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEQsTUFBTSxjQUFjLEdBQUcsSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO1lBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksZ0NBQWdDLEVBQUUsQ0FBQztZQUM5RCxNQUFNLElBQUksR0FBRyxJQUFJLDhCQUE4QixDQUFDO2dCQUMvQyxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUM7Z0JBQ3JCLENBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQzthQUNyQixDQUFDLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDUSxJQUFLLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQztZQUNsRCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFO2dCQUN2QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDaEIsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFWCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV2RCxNQUFNLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEQsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXpCLE1BQU0sSUFBQSxlQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkQsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXpCLE1BQU0sUUFBUSxDQUFDO1lBQ2YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNENBQTRDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0QsTUFBTSxJQUFJLEdBQUcsSUFBSSw2QkFBNkIsRUFBRSxDQUFDO1lBQ2pELE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ1QsSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUNULENBQUMsQ0FBQztZQUVILElBQUksS0FBSyxHQUFzQixTQUFTLENBQUM7WUFDekMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sU0FBUyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDbEcsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsS0FBSyxHQUFHLEdBQUcsQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sS0FBSyxLQUFLLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyQkFBMkIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1QyxNQUFNLElBQUksR0FBRyxJQUFJLDZCQUE2QixFQUFFLENBQUM7WUFDakQsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRTtnQkFDdkMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2hCLENBQUMsQ0FBQztZQUVILE1BQU0sU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEQsTUFBTSxjQUFjLEdBQUcsSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO1lBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksZ0NBQWdDLEVBQUUsQ0FBQztZQUM5RCxNQUFNLElBQUksR0FBRyxJQUFJLDhCQUE4QixDQUFDO2dCQUMvQyxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUM7Z0JBQ3JCLENBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQzthQUNyQixDQUFDLENBQUM7WUFDSCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFO2dCQUN2QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxHQUFHLENBQUM7YUFDVCxDQUFDLENBQUM7WUFFSCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RCxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFN0MsTUFBTSxRQUFRLENBQUM7WUFDZixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNERBQTRELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0UsTUFBTSxjQUFjLEdBQUcsSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO1lBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksZ0NBQWdDLEVBQUUsQ0FBQztZQUM5RCxNQUFNLGNBQWMsR0FBRyxJQUFJLGdDQUFnQyxFQUFFLENBQUM7WUFDOUQsTUFBTSxJQUFJLEdBQUcsSUFBSSw4QkFBOEIsQ0FBQztnQkFDL0MsQ0FBQyxHQUFHLEVBQUUsY0FBYyxDQUFDO2dCQUNyQixDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUM7Z0JBQ3JCLENBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQzthQUNyQixDQUFDLENBQUM7WUFDSCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFO2dCQUN2QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ1QsSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUNULENBQUMsQ0FBQztZQUVILFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXZELGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN6QixNQUFNLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpCLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1RCxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLDZCQUE2QjtZQUFuQztnQkFDaUIsa0JBQWEsR0FBMEIsRUFBRSxDQUFDO2dCQUMxQyxXQUFNLEdBQTZFLEVBQUUsQ0FBQztZQVV2RyxDQUFDO1lBUkEsMEJBQTBCLENBQUMsV0FBZ0MsRUFBRSxLQUFtQixFQUFFLDBCQUE2RDtnQkFDOUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLDBCQUEwQixDQUFDLENBQUMsQ0FBQztZQUNwRSxDQUFDO1lBRUQsdUJBQXVCLENBQUMsV0FBZ0MsRUFBRSxNQUFpQztnQkFDMUYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLDBDQUFjLENBQUMsb0RBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMzRSxDQUFDO1NBQ0Q7UUFFRCxNQUFNLDhCQUErQixTQUFRLDZCQUE2QjtZQUV6RSxZQUNrQixTQUFvRTtnQkFFckYsS0FBSyxFQUFFLENBQUM7Z0JBRlMsY0FBUyxHQUFULFNBQVMsQ0FBMkQ7WUFHdEYsQ0FBQztZQUVRLHVCQUF1QixDQUFDLFdBQWdDLEVBQUUsTUFBaUM7Z0JBQ25HLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNyQyxLQUFLLE1BQU0sQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNsRCxJQUFJLEVBQUUsQ0FBQyxLQUFLLEtBQUssV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNwQyxPQUFPLGFBQWEsQ0FBQyxPQUFPLENBQUM7b0JBQzlCLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxNQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7U0FDRDtRQUVELE1BQU0sZ0NBQWdDO1lBS3JDO2dCQUNDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUEsNEJBQW9CLEdBQXNCLENBQUMsQ0FBQztZQUN4SCxDQUFDO1lBRU0sT0FBTztnQkFDYixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksMENBQWMsQ0FBQyxvREFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFFTSxNQUFNLENBQUMsR0FBVTtnQkFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQixDQUFDO1NBQ0Q7UUFFRCxNQUFNLDJCQUEyQixHQUE0QjtZQUM1RCxvQkFBb0IsRUFBRSxDQUFDLG9CQUEyQyxFQUFZLEVBQUU7Z0JBQy9FLE9BQU8sb0JBQW9CLENBQUMsZ0JBQWdCLElBQUksRUFBRSxDQUFDO1lBQ3BELENBQUM7U0FDRCxDQUFDO1FBRUYsU0FBUyxlQUFlLENBQUMsSUFBOEIsRUFBRSxxQkFBOEMsRUFBRSxpQ0FBMEQsRUFBRTtZQUNwSyxNQUFNLFFBQVEsR0FBRyxJQUFJLDJEQUE0QixDQUFDLDJCQUEyQixFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFDdEcsTUFBTSxjQUFjLEdBQUcsSUFBSSwyREFBNEIsQ0FBQywyQkFBMkIsRUFBRSxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDO1lBQ25KLE9BQU8sSUFBSSwrQ0FBbUIsQ0FBQyxRQUFRLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFRCxTQUFTLElBQUksQ0FBQyxFQUF1QixFQUFFLE9BQThCLEVBQUUsRUFBRSxtQkFBNkIsQ0FBQyxHQUFHLENBQUM7WUFDMUcsT0FBTztnQkFDTixJQUFJLEVBQUUsRUFBRSxDQUFDLEtBQUs7Z0JBQ2QsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFO2dCQUM3QixVQUFVLEVBQUUsRUFBRTtnQkFDZCxpQkFBaUIsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDO2dCQUNqRCxTQUFTLEVBQUUsS0FBSztnQkFDaEIsa0JBQWtCLEVBQUUsS0FBSztnQkFDekIsYUFBYSxFQUFFLEtBQUs7Z0JBQ3BCLGdCQUFnQjtnQkFDaEIsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLGNBQWMsNENBQTBCO2dCQUN4QyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQzthQUM3QyxDQUFDO1FBQ0gsQ0FBQztJQUVGLENBQUMsQ0FBQyxDQUFDIn0=