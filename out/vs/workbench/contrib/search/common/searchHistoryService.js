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
define(["require", "exports", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, storage_1, types_1, instantiation_1) {
    "use strict";
    var SearchHistoryService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchHistoryService = exports.ISearchHistoryService = void 0;
    exports.ISearchHistoryService = (0, instantiation_1.createDecorator)('searchHistoryService');
    let SearchHistoryService = class SearchHistoryService {
        static { SearchHistoryService_1 = this; }
        static { this.SEARCH_HISTORY_KEY = 'workbench.search.history'; }
        constructor(storageService) {
            this.storageService = storageService;
            this._onDidClearHistory = new event_1.Emitter();
            this.onDidClearHistory = this._onDidClearHistory.event;
        }
        clearHistory() {
            this.storageService.remove(SearchHistoryService_1.SEARCH_HISTORY_KEY, 1 /* StorageScope.WORKSPACE */);
            this._onDidClearHistory.fire();
        }
        load() {
            let result;
            const raw = this.storageService.get(SearchHistoryService_1.SEARCH_HISTORY_KEY, 1 /* StorageScope.WORKSPACE */);
            if (raw) {
                try {
                    result = JSON.parse(raw);
                }
                catch (e) {
                    // Invalid data
                }
            }
            return result || {};
        }
        save(history) {
            if ((0, types_1.isEmptyObject)(history)) {
                this.storageService.remove(SearchHistoryService_1.SEARCH_HISTORY_KEY, 1 /* StorageScope.WORKSPACE */);
            }
            else {
                this.storageService.store(SearchHistoryService_1.SEARCH_HISTORY_KEY, JSON.stringify(history), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            }
        }
    };
    exports.SearchHistoryService = SearchHistoryService;
    exports.SearchHistoryService = SearchHistoryService = SearchHistoryService_1 = __decorate([
        __param(0, storage_1.IStorageService)
    ], SearchHistoryService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoSGlzdG9yeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvY29tbW9uL3NlYXJjaEhpc3RvcnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFlbkYsUUFBQSxxQkFBcUIsR0FBRyxJQUFBLCtCQUFlLEVBQXdCLHNCQUFzQixDQUFDLENBQUM7SUFTN0YsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7O2lCQUdULHVCQUFrQixHQUFHLDBCQUEwQixBQUE3QixDQUE4QjtRQUt2RSxZQUNrQixjQUFnRDtZQUEvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFKakQsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNqRCxzQkFBaUIsR0FBZ0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztRQUlwRSxDQUFDO1FBRUwsWUFBWTtZQUNYLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLHNCQUFvQixDQUFDLGtCQUFrQixpQ0FBeUIsQ0FBQztZQUM1RixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVELElBQUk7WUFDSCxJQUFJLE1BQXdDLENBQUM7WUFDN0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsc0JBQW9CLENBQUMsa0JBQWtCLGlDQUF5QixDQUFDO1lBRXJHLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1QsSUFBSSxDQUFDO29CQUNKLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1osZUFBZTtnQkFDaEIsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVELElBQUksQ0FBQyxPQUE2QjtZQUNqQyxJQUFJLElBQUEscUJBQWEsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxzQkFBb0IsQ0FBQyxrQkFBa0IsaUNBQXlCLENBQUM7WUFDN0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLHNCQUFvQixDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLDZEQUE2QyxDQUFDO1lBQ3pJLENBQUM7UUFDRixDQUFDOztJQXRDVyxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQVM5QixXQUFBLHlCQUFlLENBQUE7T0FUTCxvQkFBb0IsQ0F1Q2hDIn0=