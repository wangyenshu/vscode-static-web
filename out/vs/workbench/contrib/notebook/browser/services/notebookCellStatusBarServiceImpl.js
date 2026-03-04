/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, errors_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellStatusBarService = void 0;
    class NotebookCellStatusBarService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeProviders = this._register(new event_1.Emitter());
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._onDidChangeItems = this._register(new event_1.Emitter());
            this.onDidChangeItems = this._onDidChangeItems.event;
            this._providers = [];
        }
        registerCellStatusBarItemProvider(provider) {
            this._providers.push(provider);
            let changeListener;
            if (provider.onDidChangeStatusBarItems) {
                changeListener = provider.onDidChangeStatusBarItems(() => this._onDidChangeItems.fire());
            }
            this._onDidChangeProviders.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                changeListener?.dispose();
                const idx = this._providers.findIndex(p => p === provider);
                this._providers.splice(idx, 1);
            });
        }
        async getStatusBarItemsForCell(docUri, cellIndex, viewType, token) {
            const providers = this._providers.filter(p => p.viewType === viewType || p.viewType === '*');
            return await Promise.all(providers.map(async (p) => {
                try {
                    return await p.provideCellStatusBarItems(docUri, cellIndex, token) ?? { items: [] };
                }
                catch (e) {
                    (0, errors_1.onUnexpectedExternalError)(e);
                    return { items: [] };
                }
            }));
        }
    }
    exports.NotebookCellStatusBarService = NotebookCellStatusBarService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsU3RhdHVzQmFyU2VydmljZUltcGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3NlcnZpY2VzL25vdGVib29rQ2VsbFN0YXR1c0JhclNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLDRCQUE2QixTQUFRLHNCQUFVO1FBQTVEOztZQUlrQiwwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNwRSx5QkFBb0IsR0FBZ0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQUU3RCxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNoRSxxQkFBZ0IsR0FBZ0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUVyRCxlQUFVLEdBQXlDLEVBQUUsQ0FBQztRQTZCeEUsQ0FBQztRQTNCQSxpQ0FBaUMsQ0FBQyxRQUE0QztZQUM3RSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixJQUFJLGNBQXVDLENBQUM7WUFDNUMsSUFBSSxRQUFRLENBQUMseUJBQXlCLEVBQUUsQ0FBQztnQkFDeEMsY0FBYyxHQUFHLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMxRixDQUFDO1lBRUQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO1lBRWxDLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsY0FBYyxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUMxQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxNQUFXLEVBQUUsU0FBaUIsRUFBRSxRQUFnQixFQUFFLEtBQXdCO1lBQ3hHLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUM3RixPQUFPLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsRUFBRTtnQkFDaEQsSUFBSSxDQUFDO29CQUNKLE9BQU8sTUFBTSxDQUFDLENBQUMseUJBQXlCLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDckYsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNaLElBQUEsa0NBQXlCLEVBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdCLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3RCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNEO0lBdkNELG9FQXVDQyJ9