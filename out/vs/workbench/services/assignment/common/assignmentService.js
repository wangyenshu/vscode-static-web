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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/memento", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/platform/assignment/common/assignmentService", "vs/workbench/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/environment/common/environment"], function (require, exports, nls_1, instantiation_1, memento_1, telemetry_1, storage_1, extensions_1, configuration_1, productService_1, platform_1, assignmentService_1, configuration_2, configurationRegistry_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchAssignmentService = exports.IWorkbenchAssignmentService = void 0;
    exports.IWorkbenchAssignmentService = (0, instantiation_1.createDecorator)('WorkbenchAssignmentService');
    class MementoKeyValueStorage {
        constructor(memento) {
            this.memento = memento;
            this.mementoObj = memento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        async getValue(key, defaultValue) {
            const value = await this.mementoObj[key];
            return value || defaultValue;
        }
        setValue(key, value) {
            this.mementoObj[key] = value;
            this.memento.saveMemento();
        }
    }
    class WorkbenchAssignmentServiceTelemetry {
        constructor(telemetryService, productService) {
            this.telemetryService = telemetryService;
            this.productService = productService;
        }
        get assignmentContext() {
            return this._lastAssignmentContext?.split(';');
        }
        // __GDPR__COMMON__ "abexp.assignmentcontext" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        setSharedProperty(name, value) {
            if (name === this.productService.tasConfig?.assignmentContextTelemetryPropertyName) {
                this._lastAssignmentContext = value;
            }
            this.telemetryService.setExperimentProperty(name, value);
        }
        postEvent(eventName, props) {
            const data = {};
            for (const [key, value] of props.entries()) {
                data[key] = value;
            }
            /* __GDPR__
                "query-expfeature" : {
                    "owner": "sbatten",
                    "comment": "Logs queries to the experiment service by feature for metric calculations",
                    "ABExp.queriedFeature": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "comment": "The experimental feature being queried" }
                }
            */
            this.telemetryService.publicLog(eventName, data);
        }
    }
    let WorkbenchAssignmentService = class WorkbenchAssignmentService extends assignmentService_1.BaseAssignmentService {
        constructor(telemetryService, storageService, configurationService, productService, environmentService) {
            super(telemetryService.machineId, configurationService, productService, environmentService, new WorkbenchAssignmentServiceTelemetry(telemetryService, productService), new MementoKeyValueStorage(new memento_1.Memento('experiment.service.memento', storageService)));
            this.telemetryService = telemetryService;
        }
        get experimentsEnabled() {
            return this.configurationService.getValue('workbench.enableExperiments') === true;
        }
        async getTreatment(name) {
            const result = await super.getTreatment(name);
            this.telemetryService.publicLog2('tasClientReadTreatmentComplete', { treatmentName: name, treatmentValue: JSON.stringify(result) });
            return result;
        }
        async getCurrentExperiments() {
            if (!this.tasClient) {
                return undefined;
            }
            if (!this.experimentsEnabled) {
                return undefined;
            }
            await this.tasClient;
            return this.telemetry?.assignmentContext;
        }
    };
    exports.WorkbenchAssignmentService = WorkbenchAssignmentService;
    exports.WorkbenchAssignmentService = WorkbenchAssignmentService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, productService_1.IProductService),
        __param(4, environment_1.IEnvironmentService)
    ], WorkbenchAssignmentService);
    (0, extensions_1.registerSingleton)(exports.IWorkbenchAssignmentService, WorkbenchAssignmentService, 1 /* InstantiationType.Delayed */);
    const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    registry.registerConfiguration({
        ...configuration_2.workbenchConfigurationNodeBase,
        'properties': {
            'workbench.enableExperiments': {
                'type': 'boolean',
                'description': (0, nls_1.localize)('workbench.enableExperiments', "Fetches experiments to run from a Microsoft online service."),
                'default': true,
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                'restricted': true,
                'tags': ['usesOnlineServices']
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzaWdubWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYXNzaWdubWVudC9jb21tb24vYXNzaWdubWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJuRixRQUFBLDJCQUEyQixHQUFHLElBQUEsK0JBQWUsRUFBOEIsNEJBQTRCLENBQUMsQ0FBQztJQU10SCxNQUFNLHNCQUFzQjtRQUUzQixZQUFvQixPQUFnQjtZQUFoQixZQUFPLEdBQVAsT0FBTyxDQUFTO1lBQ25DLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsa0VBQWlELENBQUM7UUFDdkYsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRLENBQUksR0FBVyxFQUFFLFlBQTRCO1lBQzFELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QyxPQUFPLEtBQUssSUFBSSxZQUFZLENBQUM7UUFDOUIsQ0FBQztRQUVELFFBQVEsQ0FBSSxHQUFXLEVBQUUsS0FBUTtZQUNoQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUM3QixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzVCLENBQUM7S0FDRDtJQUVELE1BQU0sbUNBQW1DO1FBRXhDLFlBQ1MsZ0JBQW1DLEVBQ25DLGNBQStCO1lBRC9CLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDbkMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBQ3BDLENBQUM7UUFFTCxJQUFJLGlCQUFpQjtZQUNwQixPQUFPLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENB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