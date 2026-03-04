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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/async", "vs/platform/instantiation/common/extensions", "vs/base/common/stopwatch", "vs/platform/log/common/log"], function (require, exports, instantiation_1, async_1, extensions_1, stopwatch_1, log_1) {
    "use strict";
    var AiEmbeddingVectorService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AiEmbeddingVectorService = exports.IAiEmbeddingVectorService = void 0;
    exports.IAiEmbeddingVectorService = (0, instantiation_1.createDecorator)('IAiEmbeddingVectorService');
    let AiEmbeddingVectorService = class AiEmbeddingVectorService {
        static { AiEmbeddingVectorService_1 = this; }
        static { this.DEFAULT_TIMEOUT = 1000 * 10; } // 10 seconds
        constructor(logService) {
            this.logService = logService;
            this._providers = [];
        }
        isEnabled() {
            return this._providers.length > 0;
        }
        registerAiEmbeddingVectorProvider(model, provider) {
            this._providers.push(provider);
            return {
                dispose: () => {
                    const index = this._providers.indexOf(provider);
                    if (index >= 0) {
                        this._providers.splice(index, 1);
                    }
                }
            };
        }
        async getEmbeddingVector(strings, token) {
            if (this._providers.length === 0) {
                throw new Error('No embedding vector providers registered');
            }
            const stopwatch = stopwatch_1.StopWatch.create();
            const cancellablePromises = [];
            const timer = (0, async_1.timeout)(AiEmbeddingVectorService_1.DEFAULT_TIMEOUT);
            const disposable = token.onCancellationRequested(() => {
                disposable.dispose();
                timer.cancel();
            });
            for (const provider of this._providers) {
                cancellablePromises.push((0, async_1.createCancelablePromise)(async (t) => {
                    try {
                        return await provider.provideAiEmbeddingVector(Array.isArray(strings) ? strings : [strings], t);
                    }
                    catch (e) {
                        // logged in extension host
                    }
                    // Wait for the timer to finish to allow for another provider to resolve.
                    // Alternatively, if something resolved, or we've timed out, this will throw
                    // as expected.
                    await timer;
                    throw new Error('Embedding vector provider timed out');
                }));
            }
            cancellablePromises.push((0, async_1.createCancelablePromise)(async (t) => {
                const disposable = t.onCancellationRequested(() => {
                    timer.cancel();
                    disposable.dispose();
                });
                await timer;
                throw new Error('Embedding vector provider timed out');
            }));
            try {
                const result = await (0, async_1.raceCancellablePromises)(cancellablePromises);
                // If we have a single result, return it directly, otherwise return an array.
                // This aligns with the API overloads.
                if (result.length === 1) {
                    return result[0];
                }
                return result;
            }
            finally {
                stopwatch.stop();
                this.logService.trace(`[AiEmbeddingVectorService]: getEmbeddingVector took ${stopwatch.elapsed()}ms`);
            }
        }
    };
    exports.AiEmbeddingVectorService = AiEmbeddingVectorService;
    exports.AiEmbeddingVectorService = AiEmbeddingVectorService = AiEmbeddingVectorService_1 = __decorate([
        __param(0, log_1.ILogService)
    ], AiEmbeddingVectorService);
    (0, extensions_1.registerSingleton)(exports.IAiEmbeddingVectorService, AiEmbeddingVectorService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlFbWJlZGRpbmdWZWN0b3JTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2FpRW1iZWRkaW5nVmVjdG9yL2NvbW1vbi9haUVtYmVkZGluZ1ZlY3RvclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVVuRixRQUFBLHlCQUF5QixHQUFHLElBQUEsK0JBQWUsRUFBNEIsMkJBQTJCLENBQUMsQ0FBQztJQWUxRyxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF3Qjs7aUJBR3BCLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQUUsQUFBWixDQUFhLEdBQUMsYUFBYTtRQUkxRCxZQUF5QixVQUF3QztZQUF2QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBRmhELGVBQVUsR0FBaUMsRUFBRSxDQUFDO1FBRU0sQ0FBQztRQUV0RSxTQUFTO1lBQ1IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELGlDQUFpQyxDQUFDLEtBQWEsRUFBRSxRQUFvQztZQUNwRixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQixPQUFPO2dCQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ2hELElBQUksS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO1FBSUQs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