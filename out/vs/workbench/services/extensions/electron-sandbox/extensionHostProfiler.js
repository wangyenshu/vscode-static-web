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
define(["require", "exports", "vs/base/common/ternarySearchTree", "vs/workbench/services/extensions/common/extensions", "vs/base/common/network", "vs/base/common/uri", "vs/platform/profiling/common/profiling", "vs/base/common/functional"], function (require, exports, ternarySearchTree_1, extensions_1, network_1, uri_1, profiling_1, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostProfiler = void 0;
    let ExtensionHostProfiler = class ExtensionHostProfiler {
        constructor(_host, _port, _extensionService, _profilingService) {
            this._host = _host;
            this._port = _port;
            this._extensionService = _extensionService;
            this._profilingService = _profilingService;
        }
        async start() {
            const id = await this._profilingService.startProfiling({ host: this._host, port: this._port });
            return {
                stop: (0, functional_1.createSingleCallFunction)(async () => {
                    const profile = await this._profilingService.stopProfiling(id);
                    await this._extensionService.whenInstalledExtensionsRegistered();
                    const extensions = this._extensionService.extensions;
                    return this._distill(profile, extensions);
                })
            };
        }
        _distill(profile, extensions) {
            const searchTree = ternarySearchTree_1.TernarySearchTree.forUris();
            for (const extension of extensions) {
                if (extension.extensionLocation.scheme === network_1.Schemas.file) {
                    searchTree.set(uri_1.URI.file(extension.extensionLocation.fsPath), extension);
                }
            }
            const nodes = profile.nodes;
            const idsToNodes = new Map();
            const idsToSegmentId = new Map();
            for (const node of nodes) {
                idsToNodes.set(node.id, node);
            }
            function visit(node, segmentId) {
                if (!segmentId) {
                    switch (node.callFrame.functionName) {
                        case '(root)':
                            break;
                        case '(program)':
                            segmentId = 'program';
                            break;
                        case '(garbage collector)':
                            segmentId = 'gc';
                            break;
                        default:
                            segmentId = 'self';
                            break;
                    }
                }
                else if (segmentId === 'self' && node.callFrame.url) {
                    let extension;
                    try {
                        extension = searchTree.findSubstr(uri_1.URI.parse(node.callFrame.url));
                    }
                    catch {
                        // ignore
                    }
                    if (extension) {
                        segmentId = extension.identifier.value;
                    }
                }
                idsToSegmentId.set(node.id, segmentId);
                if (node.children) {
                    for (const child of node.children) {
                        const childNode = idsToNodes.get(child);
                        if (childNode) {
                            visit(childNode, segmentId);
                        }
                    }
                }
            }
            visit(nodes[0], null);
            const samples = profile.samples || [];
            const timeDeltas = profile.timeDeltas || [];
            const distilledDeltas = [];
            const distilledIds = [];
            let currSegmentTime = 0;
            let currSegmentId;
            for (let i = 0; i < samples.length; i++) {
                const id = samples[i];
                const segmentId = idsToSegmentId.get(id);
                if (segmentId !== currSegmentId) {
                    if (currSegmentId) {
                        distilledIds.push(currSegmentId);
                        distilledDeltas.push(currSegmentTime);
                    }
                    currSegmentId = segmentId ?? undefined;
                    currSegmentTime = 0;
                }
                currSegmentTime += timeDeltas[i];
            }
            if (currSegmentId) {
                distilledIds.push(currSegmentId);
                distilledDeltas.push(currSegmentTime);
            }
            return {
                startTime: profile.startTime,
                endTime: profile.endTime,
                deltas: distilledDeltas,
                ids: distilledIds,
                data: profile,
                getAggregatedTimes: () => {
                    const segmentsToTime = new Map();
                    for (let i = 0; i < distilledIds.length; i++) {
                        const id = distilledIds[i];
                        segmentsToTime.set(id, (segmentsToTime.get(id) || 0) + distilledDeltas[i]);
                    }
                    return segmentsToTime;
                }
            };
        }
    };
    exports.ExtensionHostProfiler = ExtensionHostProfiler;
    exports.ExtensionHostProfiler = ExtensionHostProfiler = __decorate([
        __param(2, extensions_1.IExtensionService),
        __param(3, profiling_1.IV8InspectProfilingService)
    ], ExtensionHostProfiler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFByb2ZpbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9leHRlbnNpb25Ib3N0UHJvZmlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO1FBRWpDLFlBQ2tCLEtBQWEsRUFDYixLQUFhLEVBQ00saUJBQW9DLEVBQzNCLGlCQUE2QztZQUh6RSxVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNNLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUE0QjtRQUUzRixDQUFDO1FBRU0sS0FBSyxDQUFDLEtBQUs7WUFFakIsTUFBTSxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBRS9GLE9BQU87Z0JBQ04sSUFBSSxFQUFFLElBQUEscUNBQXdCLEVBQUMsS0FBSyxJQUFJLEVBQUU7b0JBQ3pDLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDL0QsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztvQkFDakUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQztvQkFDckQsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9B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