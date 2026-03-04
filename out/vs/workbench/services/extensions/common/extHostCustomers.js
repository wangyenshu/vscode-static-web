/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostCustomersRegistry = void 0;
    exports.extHostNamedCustomer = extHostNamedCustomer;
    exports.extHostCustomer = extHostCustomer;
    function extHostNamedCustomer(id) {
        return function (ctor) {
            ExtHostCustomersRegistryImpl.INSTANCE.registerNamedCustomer(id, ctor);
        };
    }
    function extHostCustomer(ctor) {
        ExtHostCustomersRegistryImpl.INSTANCE.registerCustomer(ctor);
    }
    var ExtHostCustomersRegistry;
    (function (ExtHostCustomersRegistry) {
        function getNamedCustomers() {
            return ExtHostCustomersRegistryImpl.INSTANCE.getNamedCustomers();
        }
        ExtHostCustomersRegistry.getNamedCustomers = getNamedCustomers;
        function getCustomers() {
            return ExtHostCustomersRegistryImpl.INSTANCE.getCustomers();
        }
        ExtHostCustomersRegistry.getCustomers = getCustomers;
    })(ExtHostCustomersRegistry || (exports.ExtHostCustomersRegistry = ExtHostCustomersRegistry = {}));
    class ExtHostCustomersRegistryImpl {
        static { this.INSTANCE = new ExtHostCustomersRegistryImpl(); }
        constructor() {
            this._namedCustomers = [];
            this._customers = [];
        }
        registerNamedCustomer(id, ctor) {
            const entry = [id, ctor];
            this._namedCustomers.push(entry);
        }
        getNamedCustomers() {
            return this._namedCustomers;
        }
        registerCustomer(ctor) {
            this._customers.push(ctor);
        }
        getCustomers() {
            return this._customers;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEN1c3RvbWVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRIb3N0Q3VzdG9tZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsb0RBSUM7SUFFRCwwQ0FFQztJQVJELFNBQWdCLG9CQUFvQixDQUF3QixFQUFzQjtRQUNqRixPQUFPLFVBQTZDLElBQWlFO1lBQ3BILDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsSUFBK0IsQ0FBQyxDQUFDO1FBQ2xHLENBQUMsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFnQixlQUFlLENBQTJELElBQWlFO1FBQzFKLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUErQixDQUFDLENBQUM7SUFDekYsQ0FBQztJQUVELElBQWlCLHdCQUF3QixDQVN4QztJQVRELFdBQWlCLHdCQUF3QjtRQUV4QyxTQUFnQixpQkFBaUI7WUFDaEMsT0FBTyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNsRSxDQUFDO1FBRmUsMENBQWlCLG9CQUVoQyxDQUFBO1FBRUQsU0FBZ0IsWUFBWTtZQUMzQixPQUFPLDRCQUE0QixDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM3RCxDQUFDO1FBRmUscUNBQVksZUFFM0IsQ0FBQTtJQUNGLENBQUMsRUFUZ0Isd0JBQXdCLHdDQUF4Qix3QkFBd0IsUUFTeEM7SUFFRCxNQUFNLDRCQUE0QjtpQkFFVixhQUFRLEdBQUcsSUFBSSw0QkFBNEIsRUFBRSxDQUFDO1FBS3JFO1lBQ0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDdEIsQ0FBQztRQUVNLHFCQUFxQixDQUF3QixFQUFzQixFQUFFLElBQTZCO1lBQ3hHLE1BQU0sS0FBSyxHQUE2QixDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ00saUJBQWlCO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRU0sZ0JBQWdCLENBQXdCLElBQTZCO1lBQzNFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFDTSxZQUFZO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDIn0=