/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullDiagnosticsService = exports.IDiagnosticsService = exports.ID = void 0;
    exports.isRemoteDiagnosticError = isRemoteDiagnosticError;
    exports.ID = 'diagnosticsService';
    exports.IDiagnosticsService = (0, instantiation_1.createDecorator)(exports.ID);
    function isRemoteDiagnosticError(x) {
        return !!x.hostName && !!x.errorMessage;
    }
    class NullDiagnosticsService {
        async getPerformanceInfo(mainProcessInfo, remoteInfo) {
            return {};
        }
        async getSystemInfo(mainProcessInfo, remoteInfo) {
            return {
                processArgs: 'nullProcessArgs',
                gpuStatus: 'nullGpuStatus',
                screenReader: 'nullScreenReader',
                remoteData: [],
                os: 'nullOs',
                memory: 'nullMemory',
                vmHint: 'nullVmHint',
            };
        }
        async getDiagnostics(mainProcessInfo, remoteInfo) {
            return '';
        }
        async getWorkspaceFileExtensions(workspace) {
            return { extensions: [] };
        }
        async reportWorkspaceStats(workspace) { }
    }
    exports.NullDiagnosticsService = NullDiagnosticsService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9kaWFnbm9zdGljcy9jb21tb24vZGlhZ25vc3RpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkZoRywwREFFQztJQXJGWSxRQUFBLEVBQUUsR0FBRyxvQkFBb0IsQ0FBQztJQUMxQixRQUFBLG1CQUFtQixHQUFHLElBQUEsK0JBQWUsRUFBc0IsVUFBRSxDQUFDLENBQUM7SUFrRjVFLFNBQWdCLHVCQUF1QixDQUFDLENBQU07UUFDN0MsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztJQUN6QyxDQUFDO0lBRUQsTUFBYSxzQkFBc0I7UUFHbEMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLGVBQXdDLEVBQUUsVUFBOEQ7WUFDaEksT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxlQUF3QyxFQUFFLFVBQThEO1lBQzNILE9BQU87Z0JBQ04sV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsU0FBUyxFQUFFLGVBQWU7Z0JBQzFCLFlBQVksRUFBRSxrQkFBa0I7Z0JBQ2hDLFVBQVUsRUFBRSxFQUFFO2dCQUNkLEVBQUUsRUFBRSxRQUFRO2dCQUNaLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixNQUFNLEVBQUUsWUFBWTthQUNwQixDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBd0MsRUFBRSxVQUE4RDtZQUM1SCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxLQUFLLENBQUMsMEJBQTBCLENBQUMsU0FBcUI7WUFDckQsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFNBQWdDLElBQW1CLENBQUM7S0FFL0U7SUE3QkQsd0RBNkJDIn0=