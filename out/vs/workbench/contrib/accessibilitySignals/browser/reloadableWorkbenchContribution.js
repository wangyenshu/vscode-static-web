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
define(["require", "exports", "vs/base/common/hotReload", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/utils", "vs/platform/instantiation/common/instantiation"], function (require, exports, hotReload_1, observable_1, utils_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wrapInReloadableClass = wrapInReloadableClass;
    /**
     * Wrap a class in a reloadable wrapper.
     * When the wrapper is created, the original class is created.
     * When the original class changes, the instance is re-created.
    */
    function wrapInReloadableClass(getClass) {
        if (!(0, hotReload_1.isHotReloadEnabled)()) {
            return getClass();
        }
        return class ReloadableWrapper extends BaseClass {
            constructor() {
                super(...arguments);
                this._autorun = undefined;
            }
            init() {
                this._autorun = (0, observable_1.autorunWithStore)((reader, store) => {
                    const clazz = (0, utils_1.readHotReloadableExport)(getClass(), reader);
                    store.add(this.instantiationService.createInstance(clazz));
                });
            }
            dispose() {
                this._autorun?.dispose();
            }
        };
    }
    let BaseClass = class BaseClass {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            this.init();
        }
        init() { }
    };
    BaseClass = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], BaseClass);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsb2FkYWJsZVdvcmtiZW5jaENvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHlTaWduYWxzL2Jyb3dzZXIvcmVsb2FkYWJsZVdvcmtiZW5jaENvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQWFoRyxzREFtQkM7SUF4QkQ7Ozs7TUFJRTtJQUNGLFNBQWdCLHFCQUFxQixDQUFDLFFBQTZDO1FBQ2xGLElBQUksQ0FBQyxJQUFBLDhCQUFrQixHQUFFLEVBQUUsQ0FBQztZQUMzQixPQUFPLFFBQVEsRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFFRCxPQUFPLE1BQU0saUJBQWtCLFNBQVEsU0FBUztZQUF6Qzs7Z0JBQ0UsYUFBUSxHQUE0QixTQUFTLENBQUM7WUFZdkQsQ0FBQztZQVZTLElBQUk7Z0JBQ1osSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLDZCQUFnQixFQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO29CQUNsRCxNQUFNLEtBQUssR0FBRyxJQUFBLCtCQUF1QixFQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUMxRCxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDNUQsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsT0FBTztnQkFDTixJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQztJQUVELElBQU0sU0FBUyxHQUFmLE1BQU0sU0FBUztRQUNkLFlBQzJDLG9CQUEyQztZQUEzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRXJGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFFRCxJQUFJLEtBQVcsQ0FBQztLQUNoQixDQUFBO0lBUkssU0FBUztRQUVaLFdBQUEscUNBQXFCLENBQUE7T0FGbEIsU0FBUyxDQVFkIn0=