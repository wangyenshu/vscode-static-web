/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportSample = reportSample;
    function reportSample(data, telemetryService, logService, sendAsErrorTelemtry) {
        const { sample, perfBaseline, source } = data;
        // send telemetry event
        telemetryService.publicLog2(`unresponsive.sample`, {
            perfBaseline,
            selfTime: sample.selfTime,
            totalTime: sample.totalTime,
            percentage: sample.percentage,
            functionName: sample.location,
            callers: sample.caller.map(c => c.location).join('<'),
            callersAnnotated: sample.caller.map(c => `${c.percentage}|${c.location}`).join('<'),
            source
        });
        // log a fake error with a clearer stack
        const fakeError = new PerformanceError(data);
        if (sendAsErrorTelemtry) {
            errors_1.errorHandler.onUnexpectedError(fakeError);
        }
        else {
            logService.error(fakeError);
        }
    }
    class PerformanceError extends Error {
        constructor(data) {
            super(`PerfSampleError: by ${data.source} in ${data.sample.location}`);
            this.name = 'PerfSampleError';
            this.selfTime = data.sample.selfTime;
            const trace = [data.sample.absLocation, ...data.sample.caller.map(c => c.absLocation)];
            this.stack = `\n\t at ${trace.join('\n\t at ')}`;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nVGVsZW1ldHJ5U3BlYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Byb2ZpbGluZy9jb21tb24vcHJvZmlsaW5nVGVsZW1ldHJ5U3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFDaEcsb0NBdUJDO0lBdkJELFNBQWdCLFlBQVksQ0FBQyxJQUFnQixFQUFFLGdCQUFtQyxFQUFFLFVBQXVCLEVBQUUsbUJBQTRCO1FBRXhJLE1BQU0sRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQztRQUU5Qyx1QkFBdUI7UUFDdkIsZ0JBQWdCLENBQUMsVUFBVSxDQUF5RCxxQkFBcUIsRUFBRTtZQUMxRyxZQUFZO1lBQ1osUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1lBQ3pCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztZQUMzQixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7WUFDN0IsWUFBWSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1lBQzdCLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3JELGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDbkYsTUFBTTtTQUNOLENBQUMsQ0FBQztRQUVILHdDQUF3QztRQUN4QyxNQUFNLFNBQVMsR0FBRyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdDLElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQUN6QixxQkFBWSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7YUFBTSxDQUFDO1lBQ1AsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM3QixDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQU0sZ0JBQWlCLFNBQVEsS0FBSztRQUduQyxZQUFZLElBQWdCO1lBQzNCLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLE1BQU0sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDdkUsSUFBSSxDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQztZQUM5QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBRXJDLE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN2RixJQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQ2xELENBQUM7S0FDRCJ9