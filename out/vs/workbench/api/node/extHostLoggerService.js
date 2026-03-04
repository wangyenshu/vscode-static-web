/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHostLoggerService", "vs/base/common/network", "vs/platform/log/node/spdlogLog", "vs/base/common/uuid"], function (require, exports, extHostLoggerService_1, network_1, spdlogLog_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLoggerService = void 0;
    class ExtHostLoggerService extends extHostLoggerService_1.ExtHostLoggerService {
        doCreateLogger(resource, logLevel, options) {
            if (resource.scheme === network_1.Schemas.file) {
                /* Create the logger in the Extension Host process to prevent loggers (log, output channels...) traffic  over IPC */
                return new spdlogLog_1.SpdLogLogger(options?.name || (0, uuid_1.generateUuid)(), resource.fsPath, !options?.donotRotate, !!options?.donotUseFormatters, logLevel);
            }
            return super.doCreateLogger(resource, logLevel, options);
        }
        registerLogger(resource) {
            super.registerLogger(resource);
            this._proxy.$registerLogger(resource);
        }
        deregisterLogger(resource) {
            super.deregisterLogger(resource);
            this._proxy.$deregisterLogger(resource);
        }
    }
    exports.ExtHostLoggerService = ExtHostLoggerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExvZ2dlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL25vZGUvZXh0SG9zdExvZ2dlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsb0JBQXFCLFNBQVEsMkNBQXdCO1FBRTlDLGNBQWMsQ0FBQyxRQUFhLEVBQUUsUUFBa0IsRUFBRSxPQUF3QjtZQUM1RixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdEMsb0hBQW9IO2dCQUNwSCxPQUFPLElBQUksd0JBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0ksQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFUSxjQUFjLENBQUMsUUFBeUI7WUFDaEQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRVEsZ0JBQWdCLENBQUMsUUFBYTtZQUN0QyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QyxDQUFDO0tBRUQ7SUFwQkQsb0RBb0JDIn0=