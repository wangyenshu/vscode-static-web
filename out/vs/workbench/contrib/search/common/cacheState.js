/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/idGenerator", "vs/base/common/objects"], function (require, exports, idGenerator_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileQueryCacheState = void 0;
    var LoadingPhase;
    (function (LoadingPhase) {
        LoadingPhase[LoadingPhase["Created"] = 1] = "Created";
        LoadingPhase[LoadingPhase["Loading"] = 2] = "Loading";
        LoadingPhase[LoadingPhase["Loaded"] = 3] = "Loaded";
        LoadingPhase[LoadingPhase["Errored"] = 4] = "Errored";
        LoadingPhase[LoadingPhase["Disposed"] = 5] = "Disposed";
    })(LoadingPhase || (LoadingPhase = {}));
    class FileQueryCacheState {
        get cacheKey() {
            if (this.loadingPhase === LoadingPhase.Loaded || !this.previousCacheState) {
                return this._cacheKey;
            }
            return this.previousCacheState.cacheKey;
        }
        get isLoaded() {
            const isLoaded = this.loadingPhase === LoadingPhase.Loaded;
            return isLoaded || !this.previousCacheState ? isLoaded : this.previousCacheState.isLoaded;
        }
        get isUpdating() {
            const isUpdating = this.loadingPhase === LoadingPhase.Loading;
            return isUpdating || !this.previousCacheState ? isUpdating : this.previousCacheState.isUpdating;
        }
        constructor(cacheQuery, loadFn, disposeFn, previousCacheState) {
            this.cacheQuery = cacheQuery;
            this.loadFn = loadFn;
            this.disposeFn = disposeFn;
            this.previousCacheState = previousCacheState;
            this._cacheKey = idGenerator_1.defaultGenerator.nextId();
            this.query = this.cacheQuery(this._cacheKey);
            this.loadingPhase = LoadingPhase.Created;
            if (this.previousCacheState) {
                const current = Object.assign({}, this.query, { cacheKey: null });
                const previous = Object.assign({}, this.previousCacheState.query, { cacheKey: null });
                if (!(0, objects_1.equals)(current, previous)) {
                    this.previousCacheState.dispose();
                    this.previousCacheState = undefined;
                }
            }
        }
        load() {
            if (this.isUpdating) {
                return this;
            }
            this.loadingPhase = LoadingPhase.Loading;
            this.loadPromise = (async () => {
                try {
                    await this.loadFn(this.query);
                    this.loadingPhase = LoadingPhase.Loaded;
                    if (this.previousCacheState) {
                        this.previousCacheState.dispose();
                        this.previousCacheState = undefined;
                    }
                }
                catch (error) {
                    this.loadingPhase = LoadingPhase.Errored;
                    throw error;
                }
            })();
            return this;
        }
        dispose() {
            if (this.loadPromise) {
                (async () => {
                    try {
                        await this.loadPromise;
                    }
                    catch (error) {
                        // ignore
                    }
                    this.loadingPhase = LoadingPhase.Disposed;
                    this.disposeFn(this._cacheKey);
                })();
            }
            else {
                this.loadingPhase = LoadingPhase.Disposed;
            }
            if (this.previousCacheState) {
                this.previousCacheState.dispose();
                this.previousCacheState = undefined;
            }
        }
    }
    exports.FileQueryCacheState = FileQueryCacheState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9jb21tb24vY2FjaGVTdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsSUFBSyxZQU1KO0lBTkQsV0FBSyxZQUFZO1FBQ2hCLHFEQUFXLENBQUE7UUFDWCxxREFBVyxDQUFBO1FBQ1gsbURBQVUsQ0FBQTtRQUNWLHFEQUFXLENBQUE7UUFDWCx1REFBWSxDQUFBO0lBQ2IsQ0FBQyxFQU5JLFlBQVksS0FBWixZQUFZLFFBTWhCO0lBRUQsTUFBYSxtQkFBbUI7UUFHL0IsSUFBSSxRQUFRO1lBQ1gsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFlBQVksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDM0UsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3ZCLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7UUFDekMsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLEtBQUssWUFBWSxDQUFDLE1BQU0sQ0FBQztZQUUzRCxPQUFPLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDO1FBQzNGLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxLQUFLLFlBQVksQ0FBQyxPQUFPLENBQUM7WUFFOUQsT0FBTyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxD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