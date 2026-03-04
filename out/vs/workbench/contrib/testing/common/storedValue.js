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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/storage/common/storage"], function (require, exports, lifecycle_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StoredValue = void 0;
    const defaultSerialization = {
        deserialize: d => JSON.parse(d),
        serialize: d => JSON.stringify(d),
    };
    /**
     * todo@connor4312: is this worthy to be in common?
     */
    let StoredValue = class StoredValue extends lifecycle_1.Disposable {
        constructor(options, storage) {
            super();
            this.storage = storage;
            this.key = options.key;
            this.scope = options.scope;
            this.target = options.target;
            this.serialization = options.serialization ?? defaultSerialization;
            this.onDidChange = this.storage.onDidChangeValue(this.scope, this.key, this._register(new lifecycle_1.DisposableStore()));
        }
        get(defaultValue) {
            if (this.value === undefined) {
                const value = this.storage.get(this.key, this.scope);
                this.value = value === undefined ? defaultValue : this.serialization.deserialize(value);
            }
            return this.value;
        }
        /**
         * Persists changes to the value.
         * @param value
         */
        store(value) {
            this.value = value;
            this.storage.store(this.key, this.serialization.serialize(value), this.scope, this.target);
        }
        /**
         * Delete an element stored under the provided key from storage.
         */
        delete() {
            this.storage.remove(this.key, this.scope);
        }
    };
    exports.StoredValue = StoredValue;
    exports.StoredValue = StoredValue = __decorate([
        __param(1, storage_1.IStorageService)
    ], StoredValue);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVkVmFsdWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi9zdG9yZWRWYWx1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXaEcsTUFBTSxvQkFBb0IsR0FBbUM7UUFDNUQsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDL0IsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7S0FDakMsQ0FBQztJQVNGOztPQUVHO0lBQ0ksSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBZSxTQUFRLHNCQUFVO1FBWTdDLFlBQ0MsT0FBK0IsRUFDRyxPQUF3QjtZQUUxRCxLQUFLLEVBQUUsQ0FBQztZQUYwQixZQUFPLEdBQVAsT0FBTyxDQUFpQjtZQUkxRCxJQUFJLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDdkIsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLElBQUksb0JBQW9CLENBQUM7WUFDbkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRyxDQUFDO1FBWU0sR0FBRyxDQUFDLFlBQWdCO1lBQzFCLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6RixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFRDs7O1dBR0c7UUFDSSxLQUFLLENBQUMsS0FBUTtZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFFRDs7V0FFRztRQUNJLE1BQU07WUFDWixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDO0tBQ0QsQ0FBQTtJQTNEWSxrQ0FBVzswQkFBWCxXQUFXO1FBY3JCLFdBQUEseUJBQWUsQ0FBQTtPQWRMLFdBQVcsQ0EyRHZCIn0=