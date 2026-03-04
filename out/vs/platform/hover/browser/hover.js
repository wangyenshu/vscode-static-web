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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/browser/dom"], function (require, exports, instantiation_1, lifecycle_1, configuration_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nativeHoverDelegate = exports.WorkbenchHoverDelegate = exports.IHoverService = void 0;
    exports.IHoverService = (0, instantiation_1.createDecorator)('hoverService');
    let WorkbenchHoverDelegate = class WorkbenchHoverDelegate extends lifecycle_1.Disposable {
        get delay() {
            if (this.isInstantlyHovering()) {
                return 0; // show instantly when a hover was recently shown
            }
            return this._delay;
        }
        constructor(placement, instantHover, overrideOptions = {}, configurationService, hoverService) {
            super();
            this.placement = placement;
            this.instantHover = instantHover;
            this.overrideOptions = overrideOptions;
            this.configurationService = configurationService;
            this.hoverService = hoverService;
            this.lastHoverHideTime = 0;
            this.timeLimit = 200;
            this.hoverDisposables = this._register(new lifecycle_1.DisposableStore());
            this._delay = this.configurationService.getValue('workbench.hover.delay');
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.hover.delay')) {
                    this._delay = this.configurationService.getValue('workbench.hover.delay');
                }
            }));
        }
        showHover(options, focus) {
            const overrideOptions = typeof this.overrideOptions === 'function' ? this.overrideOptions(options, focus) : this.overrideOptions;
            // close hover on escape
            this.hoverDisposables.clear();
            const targets = options.target instanceof HTMLElement ? [options.target] : options.target.targetElements;
            for (const target of targets) {
                this.hoverDisposables.add((0, dom_1.addStandardDisposableListener)(target, 'keydown', (e) => {
                    if (e.equals(9 /* KeyCode.Escape */)) {
                        this.hoverService.hideHover();
                    }
                }));
            }
            const id = options.content instanceof HTMLElement ? undefined : options.content.toString();
            return this.hoverService.showHover({
                ...options,
                ...overrideOptions,
                persistence: {
                    hideOnKeyDown: true,
                    ...overrideOptions.persistence
                },
                id,
                appearance: {
                    ...options.appearance,
                    compact: true,
                    skipFadeInAnimation: this.isInstantlyHovering(),
                    ...overrideOptions.appearance
                }
            }, focus);
        }
        isInstantlyHovering() {
            return this.instantHover && Date.now() - this.lastHoverHideTime < this.timeLimit;
        }
        setInstantHoverTimeLimit(timeLimit) {
            if (!this.instantHover) {
                throw new Error('Instant hover is not enabled');
            }
            this.timeLimit = timeLimit;
        }
        onDidHideHover() {
            this.hoverDisposables.clear();
            if (this.instantHover) {
                this.lastHoverHideTime = Date.now();
            }
        }
    };
    exports.WorkbenchHoverDelegate = WorkbenchHoverDelegate;
    exports.WorkbenchHoverDelegate = WorkbenchHoverDelegate = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, exports.IHoverService)
    ], WorkbenchHoverDelegate);
    // TODO@benibenj remove this, only temp fix for contextviews
    exports.nativeHoverDelegate = {
        showHover: function () {
            throw new Error('Native hover function not implemented.');
        },
        delay: 0,
        showNativeHover: true
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9ob3Zlci9icm93c2VyL2hvdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVuRixRQUFBLGFBQWEsR0FBRyxJQUFBLCtCQUFlLEVBQWdCLGNBQWMsQ0FBQyxDQUFDO0lBTXJFLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7UUFNckQsSUFBSSxLQUFLO1lBQ1IsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGlEQUFpRDtZQUM1RCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFJRCxZQUNpQixTQUE4QixFQUM3QixZQUFxQixFQUM5QixrQkFBMEgsRUFBRSxFQUM3RyxvQkFBNEQsRUFDcEUsWUFBNEM7WUFFM0QsS0FBSyxFQUFFLENBQUM7WUFOUSxjQUFTLEdBQVQsU0FBUyxDQUFxQjtZQUM3QixpQkFBWSxHQUFaLFlBQVksQ0FBUztZQUM5QixvQkFBZSxHQUFmLGVBQWUsQ0FBNkc7WUFDNUYseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQWxCcEQsc0JBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLGNBQVMsR0FBRyxHQUFHLENBQUM7WUFVUCxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFXekUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFTLHVCQUF1QixDQUFDLENBQUM7WUFDbEYsSUFBSSxDQUFDLFNBQVMsQ0FB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