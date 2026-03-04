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
define(["require", "exports", "vs/base/common/errors", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol"], function (require, exports, errors_1, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadErrors = void 0;
    let MainThreadErrors = class MainThreadErrors {
        dispose() {
            //
        }
        $onUnexpectedError(err) {
            if (err && err.$isError) {
                const { name, message, stack } = err;
                err = err.noTelemetry ? new errors_1.ErrorNoTelemetry() : new Error();
                err.message = message;
                err.name = name;
                err.stack = stack;
            }
            (0, errors_1.onUnexpectedError)(err);
        }
    };
    exports.MainThreadErrors = MainThreadErrors;
    exports.MainThreadErrors = MainThreadErrors = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadErrors)
    ], MainThreadErrors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEVycm9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQU96RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtRQUU1QixPQUFPO1lBQ04sRUFBRTtRQUNILENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxHQUEwQjtZQUM1QyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLEdBQUcsQ0FBQztnQkFDckMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUkseUJBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDN0QsR0FBRyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7Z0JBQ3RCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO2dCQUNoQixHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBQSwwQkFBaUIsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUN4QixDQUFDO0tBQ0QsQ0FBQTtJQWhCWSw0Q0FBZ0I7K0JBQWhCLGdCQUFnQjtRQUQ1QixJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsZ0JBQWdCLENBQUM7T0FDdEMsZ0JBQWdCLENBZ0I1QiJ9