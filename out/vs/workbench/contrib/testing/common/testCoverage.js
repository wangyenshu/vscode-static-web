/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/observable", "vs/base/common/prefixTree", "vs/base/common/uri"], function (require, exports, cancellation_1, map_1, objects_1, observable_1, prefixTree_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileCoverage = exports.ComputedFileCoverage = exports.AbstractFileCoverage = exports.getTotalCoveragePercent = exports.TestCoverage = void 0;
    let incId = 0;
    /**
     * Class that exposese coverage information for a run.
     */
    class TestCoverage {
        constructor(fromTaskId, uriIdentityService, accessor) {
            this.fromTaskId = fromTaskId;
            this.uriIdentityService = uriIdentityService;
            this.accessor = accessor;
            this.fileCoverage = new map_1.ResourceMap();
            this.didAddCoverage = (0, observable_1.observableSignal)(this);
            this.tree = new prefixTree_1.WellDefinedPrefixTree();
            this.associatedData = new Map();
        }
        append(rawCoverage, tx) {
            const coverage = new FileCoverage(rawCoverage, this.accessor);
            const previous = this.getComputedForUri(coverage.uri);
            const applyDelta = (kind, node) => {
                if (!node[kind]) {
                    if (coverage[kind]) {
                        node[kind] = { ...coverage[kind] };
                    }
                }
                else {
                    node[kind].covered += (coverage[kind]?.covered || 0) - (previous?.[kind]?.covered || 0);
                    node[kind].total += (coverage[kind]?.total || 0) - (previous?.[kind]?.total || 0);
                }
            };
            // We insert using the non-canonical path to normalize for casing differences
            // between URIs, but when inserting an intermediate node always use 'a' canonical
            // version.
            const canonical = [...this.treePathForUri(coverage.uri, /* canonical = */ true)];
            const chain = [];
            this.tree.insert(this.treePathForUri(coverage.uri, /* canonical = */ false), coverage, node => {
                chain.push(node);
                if (chain.length === canonical.length) {
                    node.value = coverage;
                }
                else if (!node.value) {
                    // clone because later intersertions can modify the counts:
                    const intermediate = (0, objects_1.deepClone)(rawCoverage);
                    intermediate.id = String(incId++);
                    intermediate.uri = this.treePathToUri(canonical.slice(0, chain.length));
                    node.value = new ComputedFileCoverage(intermediate);
                }
                else {
                    applyDelta('statement', node.value);
                    applyDelta('branch', node.value);
                    applyDelta('declaration', node.value);
                    node.value.didChange.trigger(tx);
                }
            });
            this.fileCoverage.set(coverage.uri, coverage);
            if (chain) {
                this.didAddCoverage.trigger(tx, chain);
            }
        }
        /**
         * Gets coverage information for all files.
         */
        getAllFiles() {
            return this.fileCoverage;
        }
        /**
         * Gets coverage information for a specific file.
         */
        getUri(uri) {
            return this.fileCoverage.get(uri);
        }
        /**
         * Gets computed information for a file, including DFS-computed information
         * from child tests.
         */
        getComputedForUri(uri) {
            return this.tree.find(this.treePathForUri(uri, /* canonical = */ false));
        }
        *treePathForUri(uri, canconicalPath) {
            yield uri.scheme;
            yield uri.authority;
            const path = !canconicalPath && this.uriIdentityService.extUri.ignorePathCasing(uri) ? uri.path.toLowerCase() : uri.path;
            yield* path.split('/');
        }
        treePathToUri(path) {
            return uri_1.URI.from({ scheme: path[0], authority: path[1], path: path.slice(2).join('/') });
        }
    }
    exports.TestCoverage = TestCoverage;
    const getTotalCoveragePercent = (statement, branch, function_) => {
        let numerator = statement.covered;
        let denominator = statement.total;
        if (branch) {
            numerator += branch.covered;
            denominator += branch.total;
        }
        if (function_) {
            numerator += function_.covered;
            denominator += function_.total;
        }
        return denominator === 0 ? 1 : numerator / denominator;
    };
    exports.getTotalCoveragePercent = getTotalCoveragePercent;
    class AbstractFileCoverage {
        /**
         * Gets the total coverage percent based on information provided.
         * This is based on the Clover total coverage formula
         */
        get tpc() {
            return (0, exports.getTotalCoveragePercent)(this.statement, this.branch, this.declaration);
        }
        constructor(coverage) {
            this.didChange = (0, observable_1.observableSignal)(this);
            this.id = coverage.id;
            this.uri = coverage.uri;
            this.statement = coverage.statement;
            this.branch = coverage.branch;
            this.declaration = coverage.declaration;
        }
    }
    exports.AbstractFileCoverage = AbstractFileCoverage;
    /**
     * File coverage info computed from children in the tree, not provided by the
     * extension.
     */
    class ComputedFileCoverage extends AbstractFileCoverage {
    }
    exports.ComputedFileCoverage = ComputedFileCoverage;
    class FileCoverage extends AbstractFileCoverage {
        /** Gets whether details are synchronously available */
        get hasSynchronousDetails() {
            return this._details instanceof Array || this.resolved;
        }
        constructor(coverage, accessor) {
            super(coverage);
            this.accessor = accessor;
        }
        /**
         * Gets per-line coverage details.
         */
        async details(token = cancellation_1.CancellationToken.None) {
            this._details ??= this.accessor.getCoverageDetails(this.id, token);
            try {
                const d = await this._details;
                this.resolved = true;
                return d;
            }
            catch (e) {
                this._details = undefined;
                throw e;
            }
        }
    }
    exports.FileCoverage = FileCoverage;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvdmVyYWdlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdENvdmVyYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFFZDs7T0FFRztJQUNILE1BQWEsWUFBWTtRQU94QixZQUNpQixVQUFrQixFQUNqQixrQkFBdUMsRUFDdkMsUUFBMkI7WUFGNUIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNqQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZDLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBVDVCLGlCQUFZLEdBQUcsSUFBSSxpQkFBVyxFQUFnQixDQUFDO1lBQ2hELG1CQUFjLEdBQUcsSUFBQSw2QkFBZ0IsRUFBMEMsSUFBSSxDQUFDLENBQUM7WUFDakYsU0FBSSxHQUFHLElBQUksa0NBQXFCLEVBQXdCLENBQUM7WUFFekQsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQztRQU16RCxDQUFDO1FBRUUsTUFBTSxDQUFDLFdBQTBCLEVBQUUsRUFBNEI7WUFDckUsTUFBTSxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBNEMsRUFBRSxJQUEwQixFQUFFLEVBQUU7Z0JBQy9GLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDakIsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFD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