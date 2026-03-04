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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/base/common/date", "vs/base/common/resources", "vs/workbench/contrib/output/common/outputChannelModel"], function (require, exports, extensions_1, environmentService_1, instantiation_1, files_1, date_1, resources_1, outputChannelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputChannelModelService = exports.IOutputChannelModelService = void 0;
    exports.IOutputChannelModelService = (0, instantiation_1.createDecorator)('outputChannelModelService');
    let OutputChannelModelService = class OutputChannelModelService {
        constructor(fileService, instantiationService, environmentService) {
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this._outputDir = null;
            this.outputLocation = (0, resources_1.joinPath)(environmentService.windowLogsPath, `output_${(0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '')}`);
        }
        createOutputChannelModel(id, modelUri, language, file) {
            return file ? this.instantiationService.createInstance(outputChannelModel_1.FileOutputChannelModel, modelUri, language, file) : this.instantiationService.createInstance(outputChannelModel_1.DelegatedOutputChannelModel, id, modelUri, language, this.outputDir);
        }
        get outputDir() {
            if (!this._outputDir) {
                this._outputDir = this.fileService.createFolder(this.outputLocation).then(() => this.outputLocation);
            }
            return this._outputDir;
        }
    };
    exports.OutputChannelModelService = OutputChannelModelService;
    exports.OutputChannelModelService = OutputChannelModelService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], OutputChannelModelService);
    (0, extensions_1.registerSingleton)(exports.IOutputChannelModelService, OutputChannelModelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0Q2hhbm5lbE1vZGVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL291dHB1dC9jb21tb24vb3V0cHV0Q2hhbm5lbE1vZGVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZbkYsUUFBQSwwQkFBMEIsR0FBRyxJQUFBLCtCQUFlLEVBQTZCLDJCQUEyQixDQUFDLENBQUM7SUFTNUcsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBeUI7UUFNckMsWUFDZSxXQUEwQyxFQUNqQyxvQkFBNEQsRUFDckQsa0JBQWdEO1lBRi9DLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFVNUUsZUFBVSxHQUF3QixJQUFJLENBQUM7WUFQOUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFBLG9CQUFRLEVBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLFVBQVUsSUFBQSx1QkFBZ0IsRUFBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekksQ0FBQztRQUVELHdCQUF3QixDQUFDLEVBQVUsRUFBRSxRQUFhLEVBQUUsUUFBNEIsRUFBRSxJQUFVO1lBQzNGLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJDQUFzQixFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZ0RBQTJCLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFOLENBQUM7UUFHRCxJQUFZLFNBQVM7WUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN0RyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7S0FFRCxDQUFBO0lBMUJZLDhEQUF5Qjt3Q0FBekIseUJBQXlCO1FBT25DLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpREFBNEIsQ0FBQTtPQVRsQix5QkFBeUIsQ0EwQnJDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxrQ0FBMEIsRUFBRSx5QkFBeUIsb0NBQTRCLENBQUMifQ==