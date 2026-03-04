/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/assignment/common/assignment", "vs/amdX"], function (require, exports, telemetryUtils_1, assignment_1, amdX_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseAssignmentService = void 0;
    class BaseAssignmentService {
        get experimentsEnabled() {
            return true;
        }
        constructor(machineId, configurationService, productService, environmentService, telemetry, keyValueStorage) {
            this.machineId = machineId;
            this.configurationService = configurationService;
            this.productService = productService;
            this.environmentService = environmentService;
            this.telemetry = telemetry;
            this.keyValueStorage = keyValueStorage;
            this.networkInitialized = false;
            const isTesting = environmentService.extensionTestsLocationURI !== undefined;
            if (!isTesting && productService.tasConfig && this.experimentsEnabled && (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService) === 3 /* TelemetryLevel.USAGE */) {
                this.tasClient = this.setupTASClient();
            }
            // For development purposes, configure the delay until tas local tas treatment ovverrides are available
            const overrideDelaySetting = this.configurationService.getValue('experiments.overrideDelay');
            const overrideDelay = typeof overrideDelaySetting === 'number' ? overrideDelaySetting : 0;
            this.overrideInitDelay = new Promise(resolve => setTimeout(resolve, overrideDelay));
        }
        async getTreatment(name) {
            // For development purposes, allow overriding tas assignments to test variants locally.
            await this.overrideInitDelay;
            const override = this.configurationService.getValue('experiments.override.' + name);
            if (override !== undefined) {
                return override;
            }
            if (!this.tasClient) {
                return undefined;
            }
            if (!this.experimentsEnabled) {
                return undefined;
            }
            let result;
            const client = await this.tasClient;
            // The TAS client is initialized but we need to check if the initial fetch has completed yet
            // If it is complete, return a cached value for the treatment
            // If not, use the async call with `checkCache: true`. This will allow the module to return a cached value if it is present.
            // Otherwise it will await the initial fetch to return the most up to date value.
            if (this.networkInitialized) {
                result = client.getTreatmentVariable('vscode', name);
            }
            else {
                result = await client.getTreatmentVariableAsync('vscode', name, true);
            }
            result = client.getTreatmentVariable('vscode', name);
            return result;
        }
        async setupTASClient() {
            const targetPopulation = this.productService.quality === 'stable' ?
                assignment_1.TargetPopulation.Public : (this.productService.quality === 'exploration' ?
                assignment_1.TargetPopulation.Exploration : assignment_1.TargetPopulation.Insiders);
            const filterProvider = new assignment_1.AssignmentFilterProvider(this.productService.version, this.productService.nameLong, this.machineId, targetPopulation);
            const tasConfig = this.productService.tasConfig;
            const tasClient = new (await (0, amdX_1.importAMDNodeModule)('tas-client-umd', 'lib/tas-client-umd.js')).ExperimentationService({
                filterProviders: [filterProvider],
                telemetry: this.telemetry,
                storageKey: assignment_1.ASSIGNMENT_STORAGE_KEY,
                keyValueStorage: this.keyValueStorage,
                assignmentContextTelemetryPropertyName: tasConfig.assignmentContextTelemetryPropertyName,
                telemetryEventName: tasConfig.telemetryEventName,
                endpoint: tasConfig.endpoint,
                refetchInterval: assignment_1.ASSIGNMENT_REFETCH_INTERVAL,
            });
            await tasClient.initializePromise;
            tasClient.initialFetch.then(() => this.networkInitialized = true);
            return tasClient;
        }
    }
    exports.BaseAssignmentService = BaseAssignmentService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzaWdubWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hc3NpZ25tZW50L2NvbW1vbi9hc3NpZ25tZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBc0IscUJBQXFCO1FBTTFDLElBQWMsa0JBQWtCO1lBQy9CLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELFlBQ2tCLFNBQWlCLEVBQ2Ysb0JBQTJDLEVBQzNDLGNBQStCLEVBQy9CLGtCQUF1QyxFQUNoRCxTQUFvQyxFQUN0QyxlQUFrQztZQUx6QixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2YseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDL0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNoRCxjQUFTLEdBQVQsU0FBUyxDQUEyQjtZQUN0QyxvQkFBZSxHQUFmLGVBQWUsQ0FBbUI7WUFibkMsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1lBZWxDLE1BQU0sU0FBUyxHQUFHLGtCQUFrQixDQUFDLHlCQUF5QixLQUFLLFNBQVMsQ0FBQztZQUM3RSxJQUFJLENBQUMsU0FBUyxJQUFJLGNBQWMsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLGtCQUFrQixJQUFJLElBQUEsa0NBQWlCLEVBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGlDQUF5QixFQUFFLENBQUM7Z0JBQ2hKLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3hDLENBQUM7WUFFRCx1R0FBdUc7WUFDdkcsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFD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