/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/async"], function (require, exports, instantiation_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.remoteConnectionLatencyMeasurer = exports.IRemoteAgentService = void 0;
    exports.IRemoteAgentService = (0, instantiation_1.createDecorator)('remoteAgentService');
    exports.remoteConnectionLatencyMeasurer = new class {
        constructor() {
            this.maxSampleCount = 5;
            this.sampleDelay = 2000;
            this.initial = [];
            this.maxInitialCount = 3;
            this.average = [];
            this.maxAverageCount = 100;
            this.highLatencyMultiple = 2;
            this.highLatencyMinThreshold = 500;
            this.highLatencyMaxThreshold = 1500;
            this.lastMeasurement = undefined;
        }
        get latency() { return this.lastMeasurement; }
        async measure(remoteAgentService) {
            let currentLatency = Infinity;
            // Measure up to samples count
            for (let i = 0; i < this.maxSampleCount; i++) {
                const rtt = await remoteAgentService.getRoundTripTime();
                if (rtt === undefined) {
                    return undefined;
                }
                currentLatency = Math.min(currentLatency, rtt / 2 /* we want just one way, not round trip time */);
                await (0, async_1.timeout)(this.sampleDelay);
            }
            // Keep track of average latency
            this.average.push(currentLatency);
            if (this.average.length > this.maxAverageCount) {
                this.average.shift();
            }
            // Keep track of initial latency
            let initialLatency = undefined;
            if (this.initial.length < this.maxInitialCount) {
                this.initial.push(currentLatency);
            }
            else {
                initialLatency = this.initial.reduce((sum, value) => sum + value, 0) / this.initial.length;
            }
            // Remember as last measurement
            this.lastMeasurement = {
                initial: initialLatency,
                current: currentLatency,
                average: this.average.reduce((sum, value) => sum + value, 0) / this.average.length,
                high: (() => {
                    // based on the initial, average and current latency, try to decide
                    // if the connection has high latency
                    // Some rules:
                    // - we require the initial latency to be computed
                    // - we only consider latency above highLatencyMinThreshold as potentially high
                    // - we require the current latency to be above the average latency by a factor of highLatencyMultiple
                    // - but not if the latency is actually above highLatencyMaxThreshold
                    if (typeof initialLatency === 'undefined') {
                        return false;
                    }
                    if (currentLatency > this.highLatencyMaxThreshold) {
                        return true;
                    }
                    if (currentLatency > this.highLatencyMinThreshold && currentLatency > initialLatency * this.highLatencyMultiple) {
                        return true;
                    }
                    return false;
                })()
            };
            return this.lastMeasurement;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3JlbW90ZS9jb21tb24vcmVtb3RlQWdlbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVduRixRQUFBLG1CQUFtQixHQUFHLElBQUEsK0JBQWUsRUFBc0Isb0JBQW9CLENBQUMsQ0FBQztJQTBEakYsUUFBQSwrQkFBK0IsR0FBRyxJQUFJO1FBQUE7WUFFekMsbUJBQWMsR0FBRyxDQUFDLENBQUM7WUFDbkIsZ0JBQVcsR0FBRyxJQUFJLENBQUM7WUFFbkIsWUFBTyxHQUFhLEVBQUUsQ0FBQztZQUN2QixvQkFBZSxHQUFHLENBQUMsQ0FBQztZQUVwQixZQUFPLEdBQWEsRUFBRSxDQUFDO1lBQ3ZCLG9CQUFlLEdBQUcsR0FBRyxDQUFDO1lBRXRCLHdCQUFtQixHQUFHLENBQUMsQ0FBQztZQUN4Qiw0QkFBdUIsR0FBRyxHQUFHLENBQUM7WUFDOUIsNEJBQXVCLEdBQUcsSUFBSSxDQUFDO1lBRXhDLG9CQUFlLEdBQW9ELFNBQVMsQ0FBQztRQWdFOUUsQ0FBQztRQS9EQSxJQUFJLE9BQU8sS0FBSyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBRTlDLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQXVDO1lBQ3BELElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQztZQUU5Qiw4QkFBOEI7WUFDOUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsTUFBTSxHQUFHLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4RCxJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDdkIsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBRUQsY0FBYyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsK0NBQStDLENBQUMsQ0FBQztnQkFDbkcsTUFBTSxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELGdDQUFnQztZQUNoQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNsQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN0QixDQUFDO1lBRUQsZ0NBQWdDO1lBQ2hDLElBQUksY0FBYyxHQUF1QixTQUFTLENBQUM7WUFDbkQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzVGLENBQUM7WUFFRCwrQkFBK0I7WUFDL0IsSUFBSSxDQUFDLGVBQWUsR0FBRztnQkFDdEIsT0FBTyxFQUFFLGNBQWM7Z0JBQ3ZCLE9BQU8sRUFBRSxjQUFjO2dCQUN2QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtnQkFDbEYsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFO29CQUVYLG1FQUFtRTtvQkFDbkUscUNBQXFDO29CQUNyQyxjQUFjO29CQUNkLGtEQUFrRDtvQkFDbEQsK0VBQStFO29CQUMvRSxzR0FBc0c7b0JBQ3RHLHFFQUFxRTtvQkFFckUsSUFBSSxPQUFPLGNBQWMsS0FBSyxXQUFXLEVBQUUsQ0FBQzt3QkFDM0MsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQztvQkFFRCxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQzt3QkFDbkQsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztvQkFFRCxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsdUJBQXVCLElBQUksY0FBYyxHQUFHLGNBQWMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzt3QkFDakgsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztvQkFFRCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDLENBQUMsRUFBRTthQUNKLENBQUM7WUFFRixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztLQUNELENBQUMifQ==