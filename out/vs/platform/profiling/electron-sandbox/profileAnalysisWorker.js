/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/platform/profiling/common/profiling", "vs/platform/profiling/common/profilingModel"], function (require, exports, path_1, ternarySearchTree_1, uri_1, profiling_1, profilingModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = create;
    function create() {
        return new ProfileAnalysisWorker();
    }
    class ProfileAnalysisWorker {
        analyseBottomUp(profile) {
            if (!profiling_1.Utils.isValidProfile(profile)) {
                return { kind: 1 /* ProfilingOutput.Irrelevant */, samples: [] };
            }
            const model = (0, profilingModel_1.buildModel)(profile);
            const samples = bottomUp(model, 5)
                .filter(s => !s.isSpecial);
            if (samples.length === 0 || samples[0].percentage < 10) {
                // ignore this profile because 90% of the time is spent inside "special" frames
                // like idle, GC, or program
                return { kind: 1 /* ProfilingOutput.Irrelevant */, samples: [] };
            }
            return { kind: 2 /* ProfilingOutput.Interesting */, samples };
        }
        analyseByUrlCategory(profile, categories) {
            // build search tree
            const searchTree = ternarySearchTree_1.TernarySearchTree.forUris();
            searchTree.fill(categories);
            // cost by categories
            const model = (0, profilingModel_1.buildModel)(profile);
            const aggegrateByCategory = new Map();
            for (const node of model.nodes) {
                const loc = model.locations[node.locationId];
                let category;
                try {
                    category = searchTree.findSubstr(uri_1.URI.parse(loc.callFrame.url));
                }
                catch {
                    // ignore
                }
                if (!category) {
                    category = printCallFrameShort(loc.callFrame);
                }
                const value = aggegrateByCategory.get(category) ?? 0;
                const newValue = value + node.selfTime;
                aggegrateByCategory.set(category, newValue);
            }
            const result = [];
            for (const [key, value] of aggegrateByCategory) {
                result.push([key, value]);
            }
            return result;
        }
    }
    function isSpecial(call) {
        return call.functionName.startsWith('(') && call.functionName.endsWith(')');
    }
    function printCallFrameShort(frame) {
        let result = frame.functionName || '(anonymous)';
        if (frame.url) {
            result += '#';
            result += (0, path_1.basename)(frame.url);
            if (frame.lineNumber >= 0) {
                result += ':';
                result += frame.lineNumber + 1;
            }
            if (frame.columnNumber >= 0) {
                result += ':';
                result += frame.columnNumber + 1;
            }
        }
        return result;
    }
    function printCallFrameStackLike(frame) {
        let result = frame.functionName || '(anonymous)';
        if (frame.url) {
            result += ' (';
            result += frame.url;
            if (frame.lineNumber >= 0) {
                result += ':';
                result += frame.lineNumber + 1;
            }
            if (frame.columnNumber >= 0) {
                result += ':';
                result += frame.columnNumber + 1;
            }
            result += ')';
        }
        return result;
    }
    function getHeaviestLocationIds(model, topN) {
        const stackSelfTime = {};
        for (const node of model.nodes) {
            stackSelfTime[node.locationId] = (stackSelfTime[node.locationId] || 0) + node.selfTime;
        }
        const locationIds = Object.entries(stackSelfTime)
            .sort(([, a], [, b]) => b - a)
            .slice(0, topN)
            .map(([locationId]) => Number(locationId));
        return new Set(locationIds);
    }
    function bottomUp(model, topN) {
        const root = profilingModel_1.BottomUpNode.root();
        const locationIds = getHeaviestLocationIds(model, topN);
        for (const node of model.nodes) {
            if (locationIds.has(node.locationId)) {
                (0, profilingModel_1.processNode)(root, node, model);
                root.addNode(node);
            }
        }
        const result = Object.values(root.children)
            .sort((a, b) => b.selfTime - a.selfTime)
            .slice(0, topN);
        const samples = [];
        for (const node of result) {
            const sample = {
                selfTime: Math.round(node.selfTime / 1000),
                totalTime: Math.round(node.aggregateTime / 1000),
                location: printCallFrameShort(node.callFrame),
                absLocation: printCallFrameStackLike(node.callFrame),
                url: node.callFrame.url,
                caller: [],
                percentage: Math.round(node.selfTime / (model.duration / 100)),
                isSpecial: isSpecial(node.callFrame)
            };
            // follow the heaviest caller paths
            const stack = [node];
            while (stack.length) {
                const node = stack.pop();
                let top;
                for (const candidate of Object.values(node.children)) {
                    if (!top || top.selfTime < candidate.selfTime) {
                        top = candidate;
                    }
                }
                if (top) {
                    const percentage = Math.round(top.selfTime / (node.selfTime / 100));
                    sample.caller.push({
                        percentage,
                        location: printCallFrameShort(top.callFrame),
                        absLocation: printCallFrameStackLike(top.callFrame),
                    });
                    stack.push(top);
                }
            }
            samples.push(sample);
        }
        return samples;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZUFuYWx5c2lzV29ya2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcHJvZmlsaW5nL2VsZWN0cm9uLXNhbmRib3gvcHJvZmlsZUFuYWx5c2lzV29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLHdCQUVDO0lBRkQsU0FBZ0IsTUFBTTtRQUNyQixPQUFPLElBQUkscUJBQXFCLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBRUQsTUFBTSxxQkFBcUI7UUFJMUIsZUFBZSxDQUFDLE9BQW1CO1lBQ2xDLElBQUksQ0FBQyxpQkFBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNwQyxPQUFPLEVBQUUsSUFBSSxvQ0FBNEIsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDMUQsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUEsMkJBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQztZQUNsQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztpQkFDaEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFNUIsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUN4RCwrRUFBK0U7Z0JBQy9FLDRCQUE0QjtnQkFDNUIsT0FBTyxFQUFFLElBQUksb0NBQTRCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQzFELENBQUM7WUFFRCxPQUFPLEVBQUUsSUFBSSxxQ0FBNkIsRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUN2RCxDQUFDO1FBRUQs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