/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.processNode = exports.BottomUpNode = exports.buildModel = void 0;
    /**
     * Recursive function that computes and caches the aggregate time for the
     * children of the computed now.
     */
    const computeAggregateTime = (index, nodes) => {
        const row = nodes[index];
        if (row.aggregateTime) {
            return row.aggregateTime;
        }
        let total = row.selfTime;
        for (const child of row.children) {
            total += computeAggregateTime(child, nodes);
        }
        return (row.aggregateTime = total);
    };
    const ensureSourceLocations = (profile) => {
        let locationIdCounter = 0;
        const locationsByRef = new Map();
        const getLocationIdFor = (callFrame) => {
            const ref = [
                callFrame.functionName,
                callFrame.url,
                callFrame.scriptId,
                callFrame.lineNumber,
                callFrame.columnNumber,
            ].join(':');
            const existing = locationsByRef.get(ref);
            if (existing) {
                return existing.id;
            }
            const id = locationIdCounter++;
            locationsByRef.set(ref, {
                id,
                callFrame,
                location: {
                    lineNumber: callFrame.lineNumber + 1,
                    columnNumber: callFrame.columnNumber + 1,
                    // source: {
                    // 	name: maybeFileUrlToPath(callFrame.url),
                    // 	path: maybeFileUrlToPath(callFrame.url),
                    // 	sourceReference: 0,
                    // },
                },
            });
            return id;
        };
        for (const node of profile.nodes) {
            node.locationId = getLocationIdFor(node.callFrame);
            node.positionTicks = node.positionTicks?.map(tick => ({
                ...tick,
                // weirdly, line numbers here are 1-based, not 0-based. The position tick
                // only gives line-level granularity, so 'mark' the entire range of source
                // code the tick refers to
                startLocationId: getLocationIdFor({
                    ...node.callFrame,
                    lineNumber: tick.line - 1,
                    columnNumber: 0,
                }),
                endLocationId: getLocationIdFor({
                    ...node.callFrame,
                    lineNumber: tick.line,
                    columnNumber: 0,
                }),
            }));
        }
        return [...locationsByRef.values()]
            .sort((a, b) => a.id - b.id)
            .map(l => ({ locations: [l.location], callFrame: l.callFrame }));
    };
    /**
     * Computes the model for the given profile.
     */
    const buildModel = (profile) => {
        if (!profile.timeDeltas || !profile.samples) {
            return {
                nodes: [],
                locations: [],
                samples: profile.samples || [],
                timeDeltas: profile.timeDeltas || [],
                // rootPath: profile.$vscode?.rootPath,
                duration: profile.endTime - profile.startTime,
            };
        }
        const { samples, timeDeltas } = profile;
        const sourceLocations = ensureSourceLocations(profile);
        const locations = sourceLocations.map((l, id) => {
            const src = l.locations[0]; //getBestLocation(profile, l.locations);
            return {
                id,
                selfTime: 0,
                aggregateTime: 0,
                ticks: 0,
                // category: categorize(l.callFrame, src),
                callFrame: l.callFrame,
                src,
            };
        });
        const idMap = new Map();
        const mapId = (nodeId) => {
            let id = idMap.get(nodeId);
            if (id === undefined) {
                id = idMap.size;
                idMap.set(nodeId, id);
            }
            return id;
        };
        // 1. Created a sorted list of nodes. It seems that the profile always has
        // incrementing IDs, although they are just not initially sorted.
        const nodes = new Array(profile.nodes.length);
        for (let i = 0; i < profile.nodes.length; i++) {
            const node = profile.nodes[i];
            // make them 0-based:
            const id = mapId(node.id);
            nodes[id] = {
                id,
                selfTime: 0,
                aggregateTime: 0,
                locationId: node.locationId,
                children: node.children?.map(mapId) || [],
            };
            for (const child of node.positionTicks || []) {
                if (child.startLocationId) {
                    locations[child.startLocationId].ticks += child.ticks;
                }
            }
        }
        for (const node of nodes) {
            for (const child of node.children) {
                nodes[child].parent = node.id;
            }
        }
        // 2. The profile samples are the 'bottom-most' node, the currently running
        // code. Sum of these in the self time.
        const duration = profile.endTime - profile.startTime;
        let lastNodeTime = duration - timeDeltas[0];
        for (let i = 0; i < timeDeltas.length - 1; i++) {
            const d = timeDeltas[i + 1];
            nodes[mapId(samples[i])].selfTime += d;
            lastNodeTime -= d;
        }
        // Add in an extra time delta for the last sample. `timeDeltas[0]` is the
        // time before the first sample, and the time of the last sample is only
        // derived (approximately) by the missing time in the sum of deltas. Save
        // some work by calculating it here.
        if (nodes.length) {
            nodes[mapId(samples[timeDeltas.length - 1])].selfTime += lastNodeTime;
            timeDeltas.push(lastNodeTime);
        }
        // 3. Add the aggregate times for all node children and locations
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const location = locations[node.locationId];
            location.aggregateTime += computeAggregateTime(i, nodes);
            location.selfTime += node.selfTime;
        }
        return {
            nodes,
            locations,
            samples: samples.map(mapId),
            timeDeltas,
            // rootPath: profile.$vscode?.rootPath,
            duration,
        };
    };
    exports.buildModel = buildModel;
    class BottomUpNode {
        static root() {
            return new BottomUpNode({
                id: -1,
                selfTime: 0,
                aggregateTime: 0,
                ticks: 0,
                callFrame: {
                    functionName: '(root)',
                    lineNumber: -1,
                    columnNumber: -1,
                    scriptId: '0',
                    url: '',
                },
            });
        }
        get id() {
            return this.location.id;
        }
        get callFrame() {
            return this.location.callFrame;
        }
        get src() {
            return this.location.src;
        }
        constructor(location, parent) {
            this.location = location;
            this.parent = parent;
            this.children = {};
            this.aggregateTime = 0;
            this.selfTime = 0;
            this.ticks = 0;
            this.childrenSize = 0;
        }
        addNode(node) {
            this.selfTime += node.selfTime;
            this.aggregateTime += node.aggregateTime;
        }
    }
    exports.BottomUpNode = BottomUpNode;
    const processNode = (aggregate, node, model, initialNode = node) => {
        let child = aggregate.children[node.locationId];
        if (!child) {
            child = new BottomUpNode(model.locations[node.locationId], aggregate);
            aggregate.childrenSize++;
            aggregate.children[node.locationId] = child;
        }
        child.addNode(initialNode);
        if (node.parent) {
            (0, exports.processNode)(child, model.nodes[node.parent], model, initialNode);
        }
    };
    exports.processNode = processNode;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9wcm9maWxpbmcvY29tbW9uL3Byb2ZpbGluZ01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTZFaEc7OztPQUdHO0lBQ0gsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLEtBQWEsRUFBRSxLQUFzQixFQUFVLEVBQUU7UUFDOUUsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLElBQUksR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQztRQUN6QixLQUFLLE1BQU0sS0FBSyxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxLQUFLLElBQUksb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDLENBQUM7SUFFRixNQUFNLHFCQUFxQixHQUFHLENBQUMsT0FBdUIsRUFBc0MsRUFBRTtRQUU3RixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztRQUMxQixNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBOEUsQ0FBQztRQUU3RyxNQUFNLGdCQUFnQixHQUFHLENBQUMsU0FBdUIsRUFBRSxFQUFFO1lBQ3BELE1BQU0sR0FBRyxHQUFHO2dCQUNYLFNBQVMsQ0FBQyxZQUFZO2dCQUN0QixTQUFTLENBQUMsR0FBRztnQkFDYixTQUFTLENBQUMsUUFBUTtnQkFDbEIsU0FBUyxDQUFDLFVBQVU7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QUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1osS0FBSyxHQUFHLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RFLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN6QixTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDN0MsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFM0IsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakIsSUFBQSxtQkFBVyxFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbEUsQ0FBQztJQUNGLENBQUMsQ0FBQztJQWJXLFFBQUEsV0FBVyxlQWF0QiJ9