/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./descriptors"], function (require, exports, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InstantiationType = void 0;
    exports.registerSingleton = registerSingleton;
    exports.getSingletonServiceDescriptors = getSingletonServiceDescriptors;
    const _registry = [];
    var InstantiationType;
    (function (InstantiationType) {
        /**
         * Instantiate this service as soon as a consumer depends on it. _Note_ that this
         * is more costly as some upfront work is done that is likely not needed
         */
        InstantiationType[InstantiationType["Eager"] = 0] = "Eager";
        /**
         * Instantiate this service as soon as a consumer uses it. This is the _better_
         * way of registering a service.
         */
        InstantiationType[InstantiationType["Delayed"] = 1] = "Delayed";
    })(InstantiationType || (exports.InstantiationType = InstantiationType = {}));
    function registerSingleton(id, ctorOrDescriptor, supportsDelayedInstantiation) {
        if (!(ctorOrDescriptor instanceof descriptors_1.SyncDescriptor)) {
            ctorOrDescriptor = new descriptors_1.SyncDescriptor(ctorOrDescriptor, [], Boolean(supportsDelayedInstantiation));
        }
        _registry.push([id, ctorOrDescriptor]);
    }
    function getSingletonServiceDescriptors() {
        return _registry;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2luc3RhbnRpYXRpb24vY29tbW9uL2V4dGVuc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUJoRyw4Q0FNQztJQUVELHdFQUVDO0lBNUJELE1BQU0sU0FBUyxHQUFvRCxFQUFFLENBQUM7SUFFdEUsSUFBa0IsaUJBWWpCO0lBWkQsV0FBa0IsaUJBQWlCO1FBQ2xDOzs7V0FHRztRQUNILDJEQUFTLENBQUE7UUFFVDs7O1dBR0c7UUFDSCwrREFBVyxDQUFBO0lBQ1osQ0FBQyxFQVppQixpQkFBaUIsaUNBQWpCLGlCQUFpQixRQVlsQztJQUlELFNBQWdCLGlCQUFpQixDQUF1QyxFQUF3QixFQUFFLGdCQUF5RSxFQUFFLDRCQUEwRDtRQUN0TyxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsWUFBWSw0QkFBYyxDQUFDLEVBQUUsQ0FBQztZQUNuRCxnQkFBZ0IsR0FBRyxJQUFJLDRCQUFjLENBQUksZ0JBQTZDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7UUFDcEksQ0FBQztRQUVELFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxTQUFnQiw4QkFBOEI7UUFDN0MsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQyJ9