/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/log/node/loggerService"], function (require, exports, map_1, event_1, instantiation_1, log_1, loggerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggerMainService = exports.ILoggerMainService = void 0;
    exports.ILoggerMainService = (0, instantiation_1.refineServiceDecorator)(log_1.ILoggerService);
    class LoggerMainService extends loggerService_1.LoggerService {
        constructor() {
            super(...arguments);
            this.loggerResourcesByWindow = new map_1.ResourceMap();
        }
        createLogger(idOrResource, options, windowId) {
            if (windowId !== undefined) {
                this.loggerResourcesByWindow.set(this.toResource(idOrResource), windowId);
            }
            try {
                return super.createLogger(idOrResource, options);
            }
            catch (error) {
                this.loggerResourcesByWindow.delete(this.toResource(idOrResource));
                throw error;
            }
        }
        registerLogger(resource, windowId) {
            if (windowId !== undefined) {
                this.loggerResourcesByWindow.set(resource.resource, windowId);
            }
            super.registerLogger(resource);
        }
        deregisterLogger(resource) {
            this.loggerResourcesByWindow.delete(resource);
            super.deregisterLogger(resource);
        }
        getRegisteredLoggers(windowId) {
            const resources = [];
            for (const resource of super.getRegisteredLoggers()) {
                if (windowId === this.loggerResourcesByWindow.get(resource.resource)) {
                    resources.push(resource);
                }
            }
            return resources;
        }
        getOnDidChangeLogLevelEvent(windowId) {
            return event_1.Event.filter(this.onDidChangeLogLevel, arg => (0, log_1.isLogLevel)(arg) || this.isInterestedLoggerResource(arg[0], windowId));
        }
        getOnDidChangeVisibilityEvent(windowId) {
            return event_1.Event.filter(this.onDidChangeVisibility, ([resource]) => this.isInterestedLoggerResource(resource, windowId));
        }
        getOnDidChangeLoggersEvent(windowId) {
            return event_1.Event.filter(event_1.Event.map(this.onDidChangeLoggers, e => {
                const r = {
                    added: [...e.added].filter(loggerResource => this.isInterestedLoggerResource(loggerResource.resource, windowId)),
                    removed: [...e.removed].filter(loggerResource => this.isInterestedLoggerResource(loggerResource.resource, windowId)),
                };
                return r;
            }), e => e.added.length > 0 || e.removed.length > 0);
        }
        deregisterLoggers(windowId) {
            for (const [resource, resourceWindow] of this.loggerResourcesByWindow) {
                if (resourceWindow === windowId) {
                    this.deregisterLogger(resource);
                }
            }
        }
        isInterestedLoggerResource(resource, windowId) {
            const loggerWindowId = this.loggerResourcesByWindow.get(resource);
            return loggerWindowId === undefined || loggerWindowId === windowId;
        }
        dispose() {
            super.dispose();
            this.loggerResourcesByWindow.clear();
        }
    }
    exports.LoggerMainService = LoggerMainService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2xvZy9lbGVjdHJvbi1tYWluL2xvZ2dlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU25GLFFBQUEsa0JBQWtCLEdBQUcsSUFBQSxzQ0FBc0IsRUFBcUMsb0JBQWMsQ0FBQyxDQUFDO0lBc0I3RyxNQUFhLGlCQUFrQixTQUFRLDZCQUFhO1FBQXBEOztZQUVrQiw0QkFBdUIsR0FBRyxJQUFJLGlCQUFXLEVBQVUsQ0FBQztRQXdFdEUsQ0FBQztRQXRFUyxZQUFZLENBQUMsWUFBMEIsRUFBRSxPQUF3QixFQUFFLFFBQWlCO1lBQzVGLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0UsQ0FBQztZQUNELElBQUksQ0FBQztnQkFDSixPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxLQUFLLENBQUM7WUFDYixDQUFDO1FBQ0YsQ0FBQztRQUVRLGNBQWMsQ0FBQyxRQUF5QixFQUFFLFFBQWlCO1lBQ25FLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDL0QsQ0FBQztZQUNELEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUVRLGdCQUFnQixDQUFDLFFBQWE7WUFDdEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5QyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVRLG9CQUFvQixDQUFDLFFBQWlCO1lBQzlDLE1BQU0sU0FBUyxHQUFzQixFQUFFLENBQUM7WUFDeEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDO2dCQUNyRCxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUN0RSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCwyQkFBMkIsQ0FBQyxRQUFnQjtZQUMzQyxPQUFPLGFBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSxnQkFBVSxFQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM1SCxDQUFDO1FBRUQsNkJBQTZCLENBQUMsUUFBZ0I7WUFDN0MsT0FBTyxhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN0SCxDQUFDO1FBRUQsMEJBQTBCLENBQUMsUUFBZ0I7WUFDMUMsT0FBTyxhQUFLLENBQUMsTUFBTSxDQUNsQixhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDdEMsTUFBTSxDQUFDLEdBQUc7b0JBQ1QsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ2hILE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUNwSCxDQUFDO2dCQUNGLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELGlCQUFpQixDQUFDLFFBQWdCO1lBQ2pDLEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsSUFBSSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDdkUsSUFBSSxjQUFjLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sMEJBQTBCLENBQUMsUUFBYSxFQUFFLFFBQTRCO1lBQzdFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEUsT0FBTyxjQUFjLEtBQUssU0FBUyxJQUFJLGNBQWMsS0FBSyxRQUFRLENBQUM7UUFDcEUsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3RDLENBQUM7S0FDRDtJQTFFRCw4Q0EwRUMifQ==