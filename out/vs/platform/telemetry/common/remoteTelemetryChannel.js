/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ServerTelemetryChannel = void 0;
    class ServerTelemetryChannel extends lifecycle_1.Disposable {
        constructor(telemetryService, telemetryAppender) {
            super();
            this.telemetryService = telemetryService;
            this.telemetryAppender = telemetryAppender;
        }
        async call(_, command, arg) {
            switch (command) {
                case 'updateTelemetryLevel': {
                    const { telemetryLevel } = arg;
                    return this.telemetryService.updateInjectedTelemetryLevel(telemetryLevel);
                }
                case 'logTelemetry': {
                    const { eventName, data } = arg;
                    // Logging is done directly to the appender instead of through the telemetry service
                    // as the data sent from the client has already had common properties added to it and
                    // has already been sent to the telemetry output channel
                    if (this.telemetryAppender) {
                        return this.telemetryAppender.log(eventName, data);
                    }
                    return Promise.resolve();
                }
                case 'flushTelemetry': {
                    if (this.telemetryAppender) {
                        return this.telemetryAppender.flush();
                    }
                    return Promise.resolve();
                }
                case 'ping': {
                    return;
                }
            }
            // Command we cannot handle so we throw an error
            throw new Error(`IPC Command ${command} not found`);
        }
        listen(_, event, arg) {
            throw new Error('Not supported');
        }
        /**
         * Disposing the channel also disables the telemetryService as there is
         * no longer a way to control it
         */
        dispose() {
            this.telemetryService.updateInjectedTelemetryLevel(0 /* TelemetryLevel.NONE */);
            super.dispose();
        }
    }
    exports.ServerTelemetryChannel = ServerTelemetryChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVGVsZW1ldHJ5Q2hhbm5lbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9jb21tb24vcmVtb3RlVGVsZW1ldHJ5Q2hhbm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxzQkFBdUIsU0FBUSxzQkFBVTtRQUNyRCxZQUNrQixnQkFBeUMsRUFDekMsaUJBQTRDO1lBRTdELEtBQUssRUFBRSxDQUFDO1lBSFMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF5QjtZQUN6QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQTJCO1FBRzlELENBQUM7UUFHRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQU0sRUFBRSxPQUFlLEVBQUUsR0FBUztZQUM1QyxRQUFRLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixLQUFLLHNCQUFzQixDQUFDLENBQUMsQ0FBQztvQkFDN0IsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLEdBQUcsQ0FBQztvQkFDL0IsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsNEJBQTRCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzNFLENBQUM7Z0JBRUQsS0FBSyxjQUFjLENBQUMsQ0FBQyxDQUFDO29CQUNyQixNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQztvQkFDaEMsb0ZBQW9GO29CQUNwRixxRkFBcUY7b0JBQ3JGLHdEQUF3RDtvQkFDeEQsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDNUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDcEQsQ0FBQztvQkFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQztnQkFFRCxLQUFLLGdCQUFnQixDQUFDLENBQUMsQ0FBQztvQkFDdkIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDNUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3ZDLENBQUM7b0JBRUQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzFCLENBQUM7Z0JBRUQsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNiLE9BQU87Z0JBQ1IsQ0FBQztZQUNGLENBQUM7WUFDRCxnREFBZ0Q7WUFDaEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLE9BQU8sWUFBWSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELE1BQU0sQ0FBQyxDQUFNLEVBQUUsS0FBYSxFQUFFLEdBQVE7WUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQ7OztXQUdHO1FBQ2EsT0FBTztZQUN0QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsNEJBQTRCLDZCQUFxQixDQUFDO1lBQ3hFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUF4REQsd0RBd0RDIn0=