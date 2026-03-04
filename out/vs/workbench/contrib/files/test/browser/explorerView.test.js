/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/contrib/files/common/explorerModel", "vs/workbench/contrib/files/browser/views/explorerView", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/files/browser/views/explorerViewer", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/contrib/files/browser/views/explorerDecorationsProvider", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, event_1, utils_1, workbenchTestServices_1, explorerModel_1, explorerView_1, colorRegistry_1, explorerViewer_1, dom, lifecycle_1, explorerDecorationsProvider_1, testConfigurationService_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - ExplorerView', () => {
        const $ = dom.$;
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const fileService = new workbenchTestServices_1.TestFileService();
        const configService = new testConfigurationService_1.TestConfigurationService();
        function createStat(path, name, isFolder, hasChildren, size, mtime, isSymLink = false, isUnknown = false) {
            return new explorerModel_1.ExplorerItem(utils_1.toResource.call(this, path), fileService, configService, workbenchTestServices_2.NullFilesConfigurationService, undefined, isFolder, isSymLink, false, false, name, mtime, isUnknown);
        }
        test('getContext', async function () {
            const d = new Date().getTime();
            const s1 = createStat.call(this, '/', '/', true, false, 8096, d);
            const s2 = createStat.call(this, '/path', 'path', true, false, 8096, d);
            const s3 = createStat.call(this, '/path/to', 'to', true, false, 8096, d);
            const s4 = createStat.call(this, '/path/to/stat', 'stat', false, false, 8096, d);
            const noNavigationController = { getCompressedNavigationController: (stat) => undefined };
            assert.deepStrictEqual((0, explorerView_1.getContext)([s1], [s2, s3, s4], true, noNavigationController), [s2, s3, s4]);
            assert.deepStrictEqual((0, explorerView_1.getContext)([s1], [s1, s3, s4], true, noNavigationController), [s1, s3, s4]);
            assert.deepStrictEqual((0, explorerView_1.getContext)([s1], [s3, s1, s4], false, noNavigationController), [s1]);
            assert.deepStrictEqual((0, explorerView_1.getContext)([], [s3, s1, s4], false, noNavigationController), []);
            assert.deepStrictEqual((0, explorerView_1.getContext)([], [s3, s1, s4], true, noNavigationController), [s3, s1, s4]);
        });
        test('decoration provider', async function () {
            const d = new Date().getTime();
            const s1 = createStat.call(this, '/path', 'path', true, false, 8096, d);
            s1.error = new Error('A test error');
            const s2 = createStat.call(this, '/path/to', 'to', true, false, 8096, d, true);
            const s3 = createStat.call(this, '/path/to/stat', 'stat', false, false, 8096, d);
            assert.strictEqual((0, explorerDecorationsProvider_1.provideDecorations)(s3), undefined);
            assert.deepStrictEqual((0, explorerDecorationsProvider_1.provideDecorations)(s2), {
                tooltip: 'Symbolic Link',
                letter: '\u2937'
            });
            assert.deepStrictEqual((0, explorerDecorationsProvider_1.provideDecorations)(s1), {
                tooltip: 'Unable to resolve workspace folder (A test error)',
                letter: '!',
                color: colorRegistry_1.listInvalidItemForeground
            });
            const unknown = createStat.call(this, '/path/to/stat', 'stat', false, false, 8096, d, false, true);
            assert.deepStrictEqual((0, explorerDecorationsProvider_1.provideDecorations)(unknown), {
                tooltip: 'Unknown File Type',
                letter: '?'
            });
        });
        test('compressed navigation controller', async function () {
            const container = $('.file');
            const label = $('.label');
            const labelName1 = $('.label-name');
            const labelName2 = $('.label-name');
            const labelName3 = $('.label-name');
            const d = new Date().getTime();
            const s1 = createStat.call(this, '/path', 'path', true, false, 8096, d);
            const s2 = createStat.call(this, '/path/to', 'to', true, false, 8096, d);
            const s3 = createStat.call(this, '/path/to/stat', 'stat', false, false, 8096, d);
            dom.append(container, label);
            dom.append(label, labelName1);
            dom.append(label, labelName2);
            dom.append(label, labelName3);
            const emitter = new event_1.Emitter();
            const navigationController = new explorerViewer_1.CompressedNavigationController('id', [s1, s2, s3], {
                container,
                templateDisposables: ds.add(new lifecycle_1.DisposableStore()),
                elementDisposables: ds.add(new lifecycle_1.DisposableStore()),
                contribs: [],
                label: {
                    container: label,
                    onDidRender: emitter.event
                }
            }, 1, false);
            ds.add(navigationController);
            assert.strictEqual(navigationController.count, 3);
            assert.strictEqual(navigationController.index, 2);
            assert.strictEqual(navigationController.current, s3);
            navigationController.next();
            assert.strictEqual(navigationController.current, s3);
            navigationController.previous();
            assert.strictEqual(navigationController.current, s2);
            navigationController.previous();
            assert.strictEqual(navigationController.current, s1);
            navigationController.previous();
            assert.strictEqual(navigationController.current, s1);
            navigationController.last();
            assert.strictEqual(navigationController.current, s3);
            navigationController.first();
            assert.strictEqual(navigationController.current, s1);
            navigationController.setIndex(1);
            assert.strictEqual(navigationController.current, s2);
            navigationController.setIndex(44);
            assert.strictEqual(navigationController.current, s2);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJWaWV3LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy90ZXN0L2Jyb3dzZXIvZXhwbG9yZXJWaWV3LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFFbEMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUVoQixNQUFNLEVBQUUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFckQsTUFBTSxXQUFXLEdBQUcsSUFBSSx1Q0FBZSxFQUFFLENBQUM7UUFDMUMsTUFBTSxhQUFhLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1FBR3JELFNBQVMsVUFBVSxDQUFZLElBQVksRUFBRSxJQUFZLEVBQUUsUUFBaUIsRUFBRSxXQUFvQixFQUFFLElBQVksRUFBRSxLQUFhLEVBQUUsU0FBUyxHQUFHLEtBQUssRUFBRSxTQUFTLEdBQUcsS0FBSztZQUNwSyxPQUFPLElBQUksNEJBQVksQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxxREFBNkIsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdkwsQ0FBQztRQUVELElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSztZQUN2QixNQUFNLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQy9CLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdB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