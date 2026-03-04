/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/contributedStatusBarItemController", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, event_1, lifecycle_1, utils_1, contributedStatusBarItemController_1, notebookCellStatusBarService_1, notebookCommon_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Statusbar', () => {
        const testDisposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            testDisposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Calls item provider', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, _ds, accessor) => {
                const cellStatusbarSvc = accessor.get(notebookCellStatusBarService_1.INotebookCellStatusBarService);
                testDisposables.add(accessor.createInstance(contributedStatusBarItemController_1.ContributedStatusBarItemController, editor));
                const provider = testDisposables.add(new class extends lifecycle_1.Disposable {
                    constructor() {
                        super(...arguments);
                        this.provideCalls = 0;
                        this._onProvideCalled = this._register(new event_1.Emitter());
                        this.onProvideCalled = this._onProvideCalled.event;
                        this._onDidChangeStatusBarItems = this._register(new event_1.Emitter());
                        this.onDidChangeStatusBarItems = this._onDidChangeStatusBarItems.event;
                        this.viewType = editor.textModel.viewType;
                    }
                    async provideCellStatusBarItems(_uri, index, _token) {
                        if (index === 0) {
                            this.provideCalls++;
                            this._onProvideCalled.fire(this.provideCalls);
                        }
                        return { items: [] };
                    }
                });
                const providePromise1 = asPromise(provider.onProvideCalled, 'registering provider');
                testDisposables.add(cellStatusbarSvc.registerCellStatusBarItemProvider(provider));
                assert.strictEqual(await providePromise1, 1, 'should call provider on registration');
                const providePromise2 = asPromise(provider.onProvideCalled, 'updating metadata');
                const cell0 = editor.textModel.cells[0];
                cell0.metadata = { ...cell0.metadata, ...{ newMetadata: true } };
                assert.strictEqual(await providePromise2, 2, 'should call provider on updating metadata');
                const providePromise3 = asPromise(provider.onProvideCalled, 'changing cell language');
                cell0.language = 'newlanguage';
                assert.strictEqual(await providePromise3, 3, 'should call provider on changing language');
                const providePromise4 = asPromise(provider.onProvideCalled, 'manually firing change event');
                provider._onDidChangeStatusBarItems.fire();
                assert.strictEqual(await providePromise4, 4, 'should call provider on manually firing change event');
            });
        });
    });
    async function asPromise(event, message) {
        const error = new Error('asPromise TIMEOUT reached: ' + message);
        return new Promise((resolve, reject) => {
            const handle = setTimeout(() => {
                sub.dispose();
                reject(error);
            }, 1000);
            const sub = event(e => {
                clearTimeout(handle);
                sub.dispose();
                resolve(e);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0ZWRTdGF0dXNCYXJJdGVtQ29udHJvbGxlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL2NvbnRyaWIvY29udHJpYnV0ZWRTdGF0dXNCYXJJdGVtQ29udHJvbGxlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFDaEMsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFOUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN6QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsS0FBSztZQUNoQyxNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDMUMsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDREQUE2QixDQUFDLENBQUM7Z0JBQ3JFLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyx1RUFBa0MsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUV6RixNQUFNLFFB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