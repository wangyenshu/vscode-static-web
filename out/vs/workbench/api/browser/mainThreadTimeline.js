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
define(["require", "exports", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/timeline/common/timeline", "vs/base/common/marshalling"], function (require, exports, event_1, log_1, extHost_protocol_1, extHostCustomers_1, timeline_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTimeline = void 0;
    let MainThreadTimeline = class MainThreadTimeline {
        constructor(context, logService, _timelineService) {
            this.logService = logService;
            this._timelineService = _timelineService;
            this._providerEmitters = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTimeline);
        }
        $registerTimelineProvider(provider) {
            this.logService.trace(`MainThreadTimeline#registerTimelineProvider: id=${provider.id}`);
            const proxy = this._proxy;
            const emitters = this._providerEmitters;
            let onDidChange = emitters.get(provider.id);
            if (onDidChange === undefined) {
                onDidChange = new event_1.Emitter();
                emitters.set(provider.id, onDidChange);
            }
            this._timelineService.registerTimelineProvider({
                ...provider,
                onDidChange: onDidChange.event,
                async provideTimeline(uri, options, token) {
                    return (0, marshalling_1.revive)(await proxy.$getTimeline(provider.id, uri, options, token));
                },
                dispose() {
                    emitters.delete(provider.id);
                    onDidChange?.dispose();
                }
            });
        }
        $unregisterTimelineProvider(id) {
            this.logService.trace(`MainThreadTimeline#unregisterTimelineProvider: id=${id}`);
            this._timelineService.unregisterTimelineProvider(id);
        }
        $emitTimelineChangeEvent(e) {
            this.logService.trace(`MainThreadTimeline#emitChangeEvent: id=${e.id}, uri=${e.uri?.toString(true)}`);
            const emitter = this._providerEmitters.get(e.id);
            emitter?.fire(e);
        }
        dispose() {
            // noop
        }
    };
    exports.MainThreadTimeline = MainThreadTimeline;
    exports.MainThreadTimeline = MainThreadTimeline = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTimeline),
        __param(1, log_1.ILogService),
        __param(2, timeline_1.ITimelineService)
    ], MainThreadTimeline);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRpbWVsaW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRUaW1lbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7UUFJOUIsWUFDQyxPQUF3QixFQUNYLFVBQXdDLEVBQ25DLGdCQUFtRDtZQUR2QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2xCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFMckQsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQXdDLENBQUM7WUFPcEYsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELHlCQUF5QixDQUFDLFFBQW9DO1lBQzdELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLG1EQUFtRCxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV4RixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBRTFCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUN4QyxJQUFJLFdBQVcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1QyxJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDL0IsV0FBVyxHQUFHLElBQUksZUFBTyxFQUF1QixDQUFDO2dCQUNqRCxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyx3QkFBd0IsQ0FBQztnQkFDOUMsR0FBRyxRQUFRO2dCQUNYLFdBQVcsRUFBRSxXQUFXLENBQUMsS0FBSztnQkFDOUIsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFRLEVBQUUsT0FBd0IsRUFBRSxLQUF3QjtvQkFDakYsT0FBTyxJQUFBLG9CQUFNLEVBQVcsTUFBTSxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNyRixDQUFDO2dCQUNELE9BQU87b0JBQ04sUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzdCLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFDeEIsQ0FBQzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCwyQkFBMkIsQ0FBQyxFQUFVO1lBQ3JDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFEQUFxRCxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRWpGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsd0JBQXdCLENBQUMsQ0FBc0I7WUFDOUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXRHLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsQ0FBQztRQUVELE9BQU87WUFDTixPQUFPO1FBQ1IsQ0FBQztLQUNELENBQUE7SUFyRFksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFEOUIsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLGtCQUFrQixDQUFDO1FBT2xELFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsMkJBQWdCLENBQUE7T0FQTixrQkFBa0IsQ0FxRDlCIn0=