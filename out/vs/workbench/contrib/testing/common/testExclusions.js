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
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue"], function (require, exports, iterator_1, lifecycle_1, storage_1, observableValue_1, storedValue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestExclusions = void 0;
    let TestExclusions = class TestExclusions extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.excluded = this._register(observableValue_1.MutableObservableValue.stored(this._register(new storedValue_1.StoredValue({
                key: 'excludedTestItems',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */,
                serialization: {
                    deserialize: v => new Set(JSON.parse(v)),
                    serialize: v => JSON.stringify([...v])
                },
            }, this.storageService)), new Set()));
            /**
             * Event that fires when the excluded tests change.
             */
            this.onTestExclusionsChanged = this.excluded.onDidChange;
        }
        /**
         * Gets whether there's any excluded tests.
         */
        get hasAny() {
            return this.excluded.value.size > 0;
        }
        /**
         * Gets all excluded tests.
         */
        get all() {
            return this.excluded.value;
        }
        /**
         * Sets whether a test is excluded.
         */
        toggle(test, exclude) {
            if (exclude !== true && this.excluded.value.has(test.item.extId)) {
                this.excluded.value = new Set(iterator_1.Iterable.filter(this.excluded.value, e => e !== test.item.extId));
            }
            else if (exclude !== false && !this.excluded.value.has(test.item.extId)) {
                this.excluded.value = new Set([...this.excluded.value, test.item.extId]);
            }
        }
        /**
         * Gets whether a test is excluded.
         */
        contains(test) {
            return this.excluded.value.has(test.item.extId);
        }
        /**
         * Removes all test exclusions.
         */
        clear() {
            this.excluded.value = new Set();
        }
    };
    exports.TestExclusions = TestExclusions;
    exports.TestExclusions = TestExclusions = __decorate([
        __param(0, storage_1.IStorageService)
    ], TestExclusions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEV4Y2x1c2lvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0RXhjbHVzaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBYTdDLFlBQTZCLGNBQWdEO1lBQzVFLEtBQUssRUFBRSxDQUFDO1lBRHFDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQVo1RCxhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FDekMsd0NBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBVyxDQUFzQjtnQkFDakYsR0FBRyxFQUFFLG1CQUFtQjtnQkFDeEIsS0FBSyxnQ0FBd0I7Z0JBQzdCLE1BQU0sK0JBQXVCO2dCQUM3QixhQUFhLEVBQUU7b0JBQ2QsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDeEMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQ3RDO2FBQ0QsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQ3BDLENBQUM7WUFNRjs7ZUFFRztZQUNhLDRCQUF1QixHQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztRQUxwRixDQUFDO1FBT0Q7O1dBRUc7UUFDSCxJQUFXLE1BQU07WUFDaEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRDs7V0FFRztRQUNILElBQVcsR0FBRztZQUNiLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLElBQXNCLEVBQUUsT0FBaUI7WUFDdEQsSUFBSSxPQUFPLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLG1CQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNqRyxDQUFDO2lCQUFNLElBQUksT0FBTyxLQUFLLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzNFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDMUUsQ0FBQztRQUNGLENBQUM7UUFFRDs7V0FFRztRQUNJLFFBQVEsQ0FBQyxJQUFzQjtZQUNyQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFRDs7V0FFRztRQUNJLEtBQUs7WUFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2pDLENBQUM7S0FDRCxDQUFBO0lBNURZLHdDQUFjOzZCQUFkLGNBQWM7UUFhYixXQUFBLHlCQUFlLENBQUE7T0FiaEIsY0FBYyxDQTREMUIifQ==