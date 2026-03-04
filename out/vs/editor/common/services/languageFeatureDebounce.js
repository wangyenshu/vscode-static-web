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
define(["require", "exports", "vs/base/common/hash", "vs/base/common/map", "vs/base/common/numbers", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/base/common/network"], function (require, exports, hash_1, map_1, numbers_1, environment_1, extensions_1, instantiation_1, log_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageFeatureDebounceService = exports.ILanguageFeatureDebounceService = void 0;
    exports.ILanguageFeatureDebounceService = (0, instantiation_1.createDecorator)('ILanguageFeatureDebounceService');
    var IdentityHash;
    (function (IdentityHash) {
        const _hashes = new WeakMap();
        let pool = 0;
        function of(obj) {
            let value = _hashes.get(obj);
            if (value === undefined) {
                value = ++pool;
                _hashes.set(obj, value);
            }
            return value;
        }
        IdentityHash.of = of;
    })(IdentityHash || (IdentityHash = {}));
    class NullDebounceInformation {
        constructor(_default) {
            this._default = _default;
        }
        get(_model) {
            return this._default;
        }
        update(_model, _value) {
            return this._default;
        }
        default() {
            return this._default;
        }
    }
    class FeatureDebounceInformation {
        constructor(_logService, _name, _registry, _default, _min, _max) {
            this._logService = _logService;
            this._name = _name;
            this._registry = _registry;
            this._default = _default;
            this._min = _min;
            this._max = _max;
            this._cache = new map_1.LRUCache(50, 0.7);
        }
        _key(model) {
            return model.id + this._registry.all(model).reduce((hashVal, obj) => (0, hash_1.doHash)(IdentityHash.of(obj), hashVal), 0);
        }
        get(model) {
            const key = this._key(model);
            const avg = this._cache.get(key);
            return avg
                ? (0, numbers_1.clamp)(avg.value, this._min, this._max)
                : this.default();
        }
        update(model, value) {
            const key = this._key(model);
            let avg = this._cache.get(key);
            if (!avg) {
                avg = new numbers_1.SlidingWindowAverage(6);
                this._cache.set(key, avg);
            }
            const newValue = (0, numbers_1.clamp)(avg.update(value), this._min, this._max);
            if (!(0, network_1.matchesScheme)(model.uri, 'output')) {
                this._logService.trace(`[DEBOUNCE: ${this._name}] for ${model.uri.toString()} is ${newValue}ms`);
            }
            return newValue;
        }
        _overall() {
            const result = new numbers_1.MovingAverage();
            for (const [, avg] of this._cache) {
                result.update(avg.value);
            }
            return result.value;
        }
        default() {
            const value = (this._overall() | 0) || this._default;
            return (0, numbers_1.clamp)(value, this._min, this._max);
        }
    }
    let LanguageFeatureDebounceService = class LanguageFeatureDebounceService {
        constructor(_logService, envService) {
            this._logService = _logService;
            this._data = new Map();
            this._isDev = envService.isExtensionDevelopment || !envService.isBuilt;
        }
        for(feature, name, config) {
            const min = config?.min ?? 50;
            const max = config?.max ?? min ** 2;
            const extra = config?.key ?? undefined;
            const key = `${IdentityHash.of(feature)},${min}${extra ? ',' + extra : ''}`;
            let info = this._data.get(key);
            if (!info) {
                if (this._isDev) {
                    this._logService.debug(`[DEBOUNCE: ${name}] is disabled in developed mode`);
                    info = new NullDebounceInformation(min * 1.5);
                }
                else {
                    info = new FeatureDebounceInformation(this._logService, name, feature, (this._overallAverage() | 0) || (min * 1.5), // default is overall default or derived from min-value
                    min, max);
                }
                this._data.set(key, info);
            }
            return info;
        }
        _overallAverage() {
            // Average of all language features. Not a great value but an approximation
            const result = new numbers_1.MovingAverage();
            for (const info of this._data.values()) {
                result.update(info.default());
            }
            return result.value;
        }
    };
    exports.LanguageFeatureDebounceService = LanguageFeatureDebounceService;
    exports.LanguageFeatureDebounceService = LanguageFeatureDebounceService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environment_1.IEnvironmentService)
    ], LanguageFeatureDebounceService);
    (0, extensions_1.registerSingleton)(exports.ILanguageFeatureDebounceService, LanguageFeatureDebounceService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VGZWF0dXJlRGVib3VuY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL2xhbmd1YWdlRmVhdHVyZURlYm91bmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNuRixRQUFBLCtCQUErQixHQUFHLElBQUEsK0JBQWUsRUFBa0MsaUNBQWlDLENBQUMsQ0FBQztJQWVuSSxJQUFVLFlBQVksQ0FXckI7SUFYRCxXQUFVLFlBQVk7UUFDckIsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQWtCLENBQUM7UUFDOUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsU0FBZ0IsRUFBRSxDQUFDLEdBQVc7WUFDN0IsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDekIsS0FBSyxHQUFHLEVBQUUsSUFBSSxDQUFDO2dCQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFQZSxlQUFFLEtBT2pCLENBQUE7SUFDRixDQUFDLEVBWFMsWUFBWSxLQUFaLFlBQVksUUFXckI7SUFFRCxNQUFNLHVCQUF1QjtRQUU1QixZQUE2QixRQUFnQjtZQUFoQixhQUFRLEdBQVIsUUFBUSxDQUFRO1FBQUksQ0FBQztRQUVsRCxHQUFHLENBQUMsTUFBa0I7WUFDckIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFDRCxNQUFNLENBQUMsTUFBa0IsRUFBRSxNQUFjO1lBQ3hDLE9BQU8sSUFBSSxDQUFDLFFBQVEs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