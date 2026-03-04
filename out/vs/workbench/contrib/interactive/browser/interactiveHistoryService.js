/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/history", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/instantiation/common/instantiation"], function (require, exports, history_1, lifecycle_1, map_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveHistoryService = exports.IInteractiveHistoryService = void 0;
    exports.IInteractiveHistoryService = (0, instantiation_1.createDecorator)('IInteractiveHistoryService');
    class InteractiveHistoryService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._history = new map_1.ResourceMap();
        }
        addToHistory(uri, value) {
            if (!this._history.has(uri)) {
                this._history.set(uri, new history_1.HistoryNavigator2([value], 50));
                return;
            }
            const history = this._history.get(uri);
            history.resetCursor();
            if (history?.current() !== value) {
                history?.add(value);
            }
        }
        getPreviousValue(uri) {
            const history = this._history.get(uri);
            return history?.previous() ?? null;
        }
        getNextValue(uri) {
            const history = this._history.get(uri);
            return history?.next() ?? null;
        }
        replaceLast(uri, value) {
            if (!this._history.has(uri)) {
                this._history.set(uri, new history_1.HistoryNavigator2([value], 50));
                return;
            }
            else {
                const history = this._history.get(uri);
                if (history?.current() !== value) {
                    history?.replaceLast(value);
                }
            }
        }
        clearHistory(uri) {
            this._history.delete(uri);
        }
        has(uri) {
            return this._history.has(uri) ? true : false;
        }
    }
    exports.InteractiveHistoryService = InteractiveHistoryService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmVIaXN0b3J5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ludGVyYWN0aXZlL2Jyb3dzZXIvaW50ZXJhY3RpdmVIaXN0b3J5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRbkYsUUFBQSwwQkFBMEIsR0FBRyxJQUFBLCtCQUFlLEVBQTZCLDRCQUE0QixDQUFDLENBQUM7SUFhcEgsTUFBYSx5QkFBMEIsU0FBUSxzQkFBVTtRQUl4RDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGlCQUFXLEVBQTZCLENBQUM7UUFDOUQsQ0FBQztRQUVELFlBQVksQ0FBQyxHQUFRLEVBQUUsS0FBYTtZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksMkJBQWlCLENBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDO1lBRXhDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN0QixJQUFJLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyQixDQUFDO1FBQ0YsQ0FBQztRQUNELGdCQUFnQixDQUFDLEdBQVE7WUFDeEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkMsT0FBTyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDO1FBQ3BDLENBQUM7UUFFRCxZQUFZLENBQUMsR0FBUTtZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUV2QyxPQUFPLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUM7UUFDaEMsQ0FBQztRQUVELFdBQVcsQ0FBQyxHQUFRLEVBQUUsS0FBYTtZQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksMkJBQWlCLENBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxPQUFPO1lBQ1IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDbEMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNGLENBQUM7UUFFRixDQUFDO1FBRUQsWUFBWSxDQUFDLEdBQVE7WUFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVELEdBQUcsQ0FBQyxHQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUMsQ0FBQztLQUVEO0lBdkRELDhEQXVEQyJ9