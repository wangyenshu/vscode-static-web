/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/contrib/terminal/browser/terminalInstanceService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert_1, uri_1, utils_1, terminalInstanceService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - TerminalInstanceService', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let terminalInstanceService;
        setup(async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store);
            terminalInstanceService = store.add(instantiationService.createInstance(terminalInstanceService_1.TerminalInstanceService));
        });
        suite('convertProfileToShellLaunchConfig', () => {
            test('should return an empty shell launch config when undefined is provided', () => {
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig(), {});
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig(undefined), {});
            });
            test('should return the same shell launch config when provided', () => {
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({}), {});
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({ executable: '/foo' }), { executable: '/foo' });
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({ executable: '/foo', cwd: '/bar', args: ['a', 'b'] }), { executable: '/foo', cwd: '/bar', args: ['a', 'b'] });
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({ executable: '/foo' }, '/bar'), { executable: '/foo', cwd: '/bar' });
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({ executable: '/foo', cwd: '/bar' }, '/baz'), { executable: '/foo', cwd: '/baz' });
            });
            test('should convert a provided profile to a shell launch config', () => {
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({
                    profileName: 'abc',
                    path: '/foo',
                    isDefault: true
                }), {
                    args: undefined,
                    color: undefined,
                    cwd: undefined,
                    env: undefined,
                    executable: '/foo',
                    icon: undefined,
                    name: undefined
                });
                const icon = uri_1.URI.file('/icon');
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({
                    profileName: 'abc',
                    path: '/foo',
                    isDefault: true,
                    args: ['a', 'b'],
                    color: 'color',
                    env: { test: 'TEST' },
                    icon
                }, '/bar'), {
                    args: ['a', 'b'],
                    color: 'color',
                    cwd: '/bar',
                    env: { test: 'TEST' },
                    executable: '/foo',
                    icon,
                    name: undefined
                });
            });
            test('should respect overrideName in profile', () => {
                (0, assert_1.deepStrictEqual)(terminalInstanceService.convertProfileToShellLaunchConfig({
                    profileName: 'abc',
                    path: '/foo',
                    isDefault: true,
                    overrideName: true
                }), {
                    args: undefined,
                    color: undefined,
                    cwd: undefined,
                    env: undefined,
                    executable: '/foo',
                    icon: undefined,
                    name: 'abc'
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJbnN0YW5jZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci90ZXJtaW5hbEluc3RhbmNlU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7UUFDakQsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELElBQUksdUJBQWlELENBQUM7UUFFdEQsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0UsdUJBQXVCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaURBQXVCLENBQUMsQ0FBQyxDQUFDO1FBQ25HLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxJQUFJLENBQUMsdUVBQXVFLEVBQUUsR0FBRyxFQUFFO2dCQUNsRixJQUFBLHdCQUFlLEVBQUMsdUJBQXVCLENBQUMsaUNBQWlDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakYsSUFBQSx3QkFBZSxFQUFDLHVCQUF1QixDQUFDLGlDQUFpQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLDBEQUEwRCxFQUFFLEdBQUcsRUFBRTtnQkFDckUsSUFBQSx3QkFBZSxFQUNkLHVCQUF1QixDQUFDLGlDQUFpQyxDQUFDLEVBQUUsQ0FBQyxFQUM3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