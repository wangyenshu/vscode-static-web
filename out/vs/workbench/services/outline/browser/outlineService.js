/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/platform/instantiation/common/extensions", "vs/workbench/services/outline/browser/outline", "vs/base/common/event"], function (require, exports, lifecycle_1, linkedList_1, extensions_1, outline_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OutlineService {
        constructor() {
            this._factories = new linkedList_1.LinkedList();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        canCreateOutline(pane) {
            for (const factory of this._factories) {
                if (factory.matches(pane)) {
                    return true;
                }
            }
            return false;
        }
        async createOutline(pane, target, token) {
            for (const factory of this._factories) {
                if (factory.matches(pane)) {
                    return await factory.createOutline(pane, target, token);
                }
            }
            return undefined;
        }
        registerOutlineCreator(creator) {
            const rm = this._factories.push(creator);
            this._onDidChange.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                this._onDidChange.fire();
            });
        }
    }
    (0, extensions_1.registerSingleton)(outline_1.IOutlineService, OutlineService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvb3V0bGluZS9icm93c2VyL291dGxpbmVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLE1BQU0sY0FBYztRQUFwQjtZQUlrQixlQUFVLEdBQUcsSUFBSSx1QkFBVSxFQUE2QixDQUFDO1lBRXpELGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUMzQyxnQkFBVyxHQUFnQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQTRCN0QsQ0FBQztRQTFCQSxnQkFBZ0IsQ0FBQyxJQUFpQjtZQUNqQyxLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzNCLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFpQixFQUFFLE1BQXFCLEVBQUUsS0FBd0I7WUFDckYsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUMzQixPQUFPLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxPQUFrQztZQUN4RCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3pCLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsRUFBRSxFQUFFLENBQUM7Z0JBQ0wsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQUdELElBQUEsOEJBQWlCLEVBQUMseUJBQWUsRUFBRSxjQUFjLG9DQUE0QixDQUFDIn0=