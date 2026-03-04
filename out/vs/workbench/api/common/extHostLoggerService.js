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
define(["require", "exports", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/base/common/uri", "vs/base/common/marshalling"], function (require, exports, log_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1, uri_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLoggerService = void 0;
    let ExtHostLoggerService = class ExtHostLoggerService extends log_1.AbstractLoggerService {
        constructor(rpc, initData) {
            super(initData.logLevel, initData.logsLocation, initData.loggers.map(logger => (0, marshalling_1.revive)(logger)));
            this._proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadLogger);
        }
        $setLogLevel(logLevel, resource) {
            if (resource) {
                this.setLogLevel(uri_1.URI.revive(resource), logLevel);
            }
            else {
                this.setLogLevel(logLevel);
            }
        }
        setVisibility(resource, visibility) {
            super.setVisibility(resource, visibility);
            this._proxy.$setVisibility(resource, visibility);
        }
        doCreateLogger(resource, logLevel, options) {
            return new Logger(this._proxy, resource, logLevel, options);
        }
    };
    exports.ExtHostLoggerService = ExtHostLoggerService;
    exports.ExtHostLoggerService = ExtHostLoggerService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostLoggerService);
    class Logger extends log_1.AbstractMessageLogger {
        constructor(proxy, file, logLevel, loggerOptions) {
            super(loggerOptions?.logLevel === 'always');
            this.proxy = proxy;
            this.file = file;
            this.isLoggerCreated = false;
            this.buffer = [];
            this.setLevel(logLevel);
            this.proxy.$createLogger(file, loggerOptions)
                .then(() => {
                this.doLog(this.buffer);
                this.isLoggerCreated = true;
            });
        }
        log(level, message) {
            const messages = [[level, message]];
            if (this.isLoggerCreated) {
                this.doLog(messages);
            }
            else {
                this.buffer.push(...messages);
            }
        }
        doLog(messages) {
            this.proxy.$log(this.file, messages);
        }
        flush() {
            this.proxy.$flush(this.file);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExvZ2dlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0TG9nZ2VyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSwyQkFBcUI7UUFLOUQsWUFDcUIsR0FBdUIsRUFDbEIsUUFBaUM7WUFFMUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEsb0JBQU0sRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEcsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsWUFBWSxDQUFDLFFBQWtCLEVBQUUsUUFBd0I7WUFDeEQsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDbEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFUSxhQUFhLENBQUMsUUFBYSxFQUFFLFVBQW1CO1lBQ3hELEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRVMsY0FBYyxDQUFDLFFBQWEsRUFBRSxRQUFrQixFQUFFLE9BQXdCO1lBQ25GLE9BQU8sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdELENBQUM7S0FDRCxDQUFBO0lBN0JZLG9EQUFvQjttQ0FBcEIsb0JBQW9CO1FBTTlCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxnREFBdUIsQ0FBQTtPQVBiLG9CQUFvQixDQTZCaEM7SUFFRCxNQUFNLE1BQU8sU0FBUSwyQkFBcUI7UUFLekMsWUFDa0IsS0FBNEIsRUFDNUIsSUFBUyxFQUMxQixRQUFrQixFQUNsQixhQUE4QjtZQUU5QixLQUFLLENBQUMsYUFBYSxFQUFFLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQztZQUwzQixVQUFLLEdBQUwsS0FBSyxDQUF1QjtZQUM1QixTQUFJLEdBQUosSUFBSSxDQUFLO1lBTG5CLG9CQUFlLEdBQVksS0FBSyxDQUFDO1lBQ2pDLFdBQU0sR0FBeUIsRUFBRSxDQUFDO1lBU3pDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQztpQkFDM0MsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRVMsR0FBRyxDQUFDLEtBQWUsRUFBRSxPQUFlO1lBQzdDLE1BQU0sUUFBUSxHQUF5QixDQUFDLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDMUQsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsUUFBOEI7WUFDM0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRVEsS0FBSztZQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDO0tBQ0QifQ==