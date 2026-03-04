/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/telemetry/common/errorTelemetry"], function (require, exports, errors_1, errorTelemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorTelemetry extends errorTelemetry_1.default {
        installErrorListeners() {
            (0, errors_1.setUnexpectedErrorHandler)(err => console.error(err));
            // Print a console message when rejection isn't handled within N seconds. For details:
            // see https://nodejs.org/api/process.html#process_event_unhandledrejection
            // and https://nodejs.org/api/process.html#process_event_rejectionhandled
            const unhandledPromises = [];
            process.on('unhandledRejection', (reason, promise) => {
                unhandledPromises.push(promise);
                setTimeout(() => {
                    const idx = unhandledPromises.indexOf(promise);
                    if (idx >= 0) {
                        promise.catch(e => {
                            unhandledPromises.splice(idx, 1);
                            if (!(0, errors_1.isCancellationError)(e)) {
                                console.warn(`rejected promise not handled within 1 second: ${e}`);
                                if (e.stack) {
                                    console.warn(`stack trace: ${e.stack}`);
                                }
                                if (reason) {
                                    (0, errors_1.onUnexpectedError)(reason);
                                }
                            }
                        });
                    }
                }, 1000);
            });
            process.on('rejectionHandled', (promise) => {
                const idx = unhandledPromises.indexOf(promise);
                if (idx >= 0) {
                    unhandledPromises.splice(idx, 1);
                }
            });
            // Print a console message when an exception isn't handled.
            process.on('uncaughtException', (err) => {
                if ((0, errors_1.isSigPipeError)(err)) {
                    return;
                }
                (0, errors_1.onUnexpectedError)(err);
            });
        }
    }
    exports.default = ErrorTelemetry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JUZWxlbWV0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvbm9kZS9lcnJvclRlbGVtZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUtoRyxNQUFxQixjQUFlLFNBQVEsd0JBQWtCO1FBQzFDLHFCQUFxQjtZQUN2QyxJQUFBLGtDQUF5QixFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXJELHNGQUFzRjtZQUN0RiwyRUFBMkU7WUFDM0UseUVBQXlFO1lBQ3pFLE1BQU0saUJBQWlCLEdBQW1CLEVBQUUsQ0FBQztZQUM3QyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsTUFBVyxFQUFFLE9BQXFCLEVBQUUsRUFBRTtnQkFDdkUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNoQyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNmLE1BQU0sR0FBRyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDL0MsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTs0QkFDakIsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDakMsSUFBSSxDQUFDLElBQUEsNEJBQW1CLEVBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQ0FDN0IsT0FBTyxDQUFDLElBQUksQ0FBQyxpREFBaUQsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQ0FDbkUsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7b0NBQ2IsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Z0NBQ3pDLENBQUM7Z0NBQ0QsSUFBSSxNQUFNLEVBQUUsQ0FBQztvQ0FDWixJQUFBLDBCQUFpQixFQUFDLE1BQU0sQ0FBQyxDQUFDO2dDQUMzQixDQUFDOzRCQUNGLENBQUM7d0JBQ0YsQ0FBQyxDQUFDLENBQUM7b0JBQ0osQ0FBQztnQkFDRixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDVixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxPQUFxQixFQUFFLEVBQUU7Z0JBQ3hELE1BQU0sR0FBRyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ2QsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsMkRBQTJEO1lBQzNELE9BQU8sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxHQUFrQyxFQUFFLEVBQUU7Z0JBQ3RFLElBQUksSUFBQSx1QkFBYyxFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFBLDBCQUFpQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBN0NELGlDQTZDQyJ9