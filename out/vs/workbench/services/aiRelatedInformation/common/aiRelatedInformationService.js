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
define(["require", "exports", "vs/base/common/async", "vs/platform/instantiation/common/extensions", "vs/base/common/stopwatch", "vs/platform/log/common/log", "vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation"], function (require, exports, async_1, extensions_1, stopwatch_1, log_1, aiRelatedInformation_1) {
    "use strict";
    var AiRelatedInformationService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AiRelatedInformationService = void 0;
    let AiRelatedInformationService = class AiRelatedInformationService {
        static { AiRelatedInformationService_1 = this; }
        static { this.DEFAULT_TIMEOUT = 1000 * 10; } // 10 seconds
        constructor(logService) {
            this.logService = logService;
            this._providers = new Map();
        }
        isEnabled() {
            return this._providers.size > 0;
        }
        registerAiRelatedInformationProvider(type, provider) {
            const providers = this._providers.get(type) ?? [];
            providers.push(provider);
            this._providers.set(type, providers);
            return {
                dispose: () => {
                    const providers = this._providers.get(type) ?? [];
                    const index = providers.indexOf(provider);
                    if (index !== -1) {
                        providers.splice(index, 1);
                    }
                    if (providers.length === 0) {
                        this._providers.delete(type);
                    }
                }
            };
        }
        async getRelatedInformation(query, types, token) {
            if (this._providers.size === 0) {
                throw new Error('No related information providers registered');
            }
            // get providers for each type
            const providers = [];
            for (const type of types) {
                const typeProviders = this._providers.get(type);
                if (typeProviders) {
                    providers.push(...typeProviders);
                }
            }
            if (providers.length === 0) {
                throw new Error('No related information providers registered for the given types');
            }
            const stopwatch = stopwatch_1.StopWatch.create();
            const cancellablePromises = providers.map((provider) => {
                return (0, async_1.createCancelablePromise)(async (t) => {
                    try {
                        const result = await provider.provideAiRelatedInformation(query, t);
                        // double filter just in case
                        return result.filter(r => types.includes(r.type));
                    }
                    catch (e) {
                        // logged in extension host
                    }
                    return [];
                });
            });
            try {
                const results = await (0, async_1.raceTimeout)(Promise.allSettled(cancellablePromises), AiRelatedInformationService_1.DEFAULT_TIMEOUT, () => {
                    cancellablePromises.forEach(p => p.cancel());
                    this.logService.warn('[AiRelatedInformationService]: Related information provider timed out');
                });
                if (!results) {
                    return [];
                }
                const result = results
                    .filter(r => r.status === 'fulfilled')
                    .flatMap(r => r.value);
                return result;
            }
            finally {
                stopwatch.stop();
                this.logService.trace(`[AiRelatedInformationService]: getRelatedInformation took ${stopwatch.elapsed()}ms`);
            }
        }
    };
    exports.AiRelatedInformationService = AiRelatedInformationService;
    exports.AiRelatedInformationService = AiRelatedInformationService = AiRelatedInformationService_1 = __decorate([
        __param(0, log_1.ILogService)
    ], AiRelatedInformationService);
    (0, extensions_1.registerSingleton)(aiRelatedInformation_1.IAiRelatedInformationService, AiRelatedInformationService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlSZWxhdGVkSW5mb3JtYXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2FpUmVsYXRlZEluZm9ybWF0aW9uL2NvbW1vbi9haVJlbGF0ZWRJbmZvcm1hdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUEyQjs7aUJBR3ZCLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQUUsQUFBWixDQUFhLEdBQUMsYUFBYTtRQUkxRCxZQUF5QixVQUF3QztZQUF2QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBRmhELGVBQVUsR0FBaUUsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVqQyxDQUFDO1FBRXRFLFNBQVM7WUFDUixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsb0NBQW9DLENBQUMsSUFBNEIsRUFBRSxRQUF1QztZQUN6RyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEQsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFHckMsT0FBTztnQkFDTixPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNiLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDbEQsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFR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