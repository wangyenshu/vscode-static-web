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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform"], function (require, exports, async_1, cancellation_1, event_1, lifecycle_1, instantiation_1, quickAccess_1, quickInput_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickAccessController = void 0;
    let QuickAccessController = class QuickAccessController extends lifecycle_1.Disposable {
        constructor(quickInputService, instantiationService) {
            super();
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.registry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
            this.mapProviderToDescriptor = new Map();
            this.lastAcceptedPickerValues = new Map();
            this.visibleQuickAccess = undefined;
        }
        pick(value = '', options) {
            return this.doShowOrPick(value, true, options);
        }
        show(value = '', options) {
            this.doShowOrPick(value, false, options);
        }
        doShowOrPick(value, pick, options) {
            // Find provider for the value to show
            const [provider, descriptor] = this.getOrInstantiateProvider(value);
            // Return early if quick access is already showing on that same prefix
            const visibleQuickAccess = this.visibleQuickAccess;
            const visibleDescriptor = visibleQuickAccess?.descriptor;
            if (visibleQuickAccess && descriptor && visibleDescriptor === descriptor) {
                // Apply value only if it is more specific than the prefix
                // from the provider and we are not instructed to preserve
                if (value !== descriptor.prefix && !options?.preserveValue) {
                    visibleQuickAccess.picker.value = value;
                }
                // Always adjust selection
                this.adjustValueSelection(visibleQuickAccess.picker, descriptor, options);
                return;
            }
            // Rewrite the filter value based on certain rules unless disabled
            if (descriptor && !options?.preserveValue) {
                let newValue = undefined;
                // If we have a visible provider with a value, take it's filter value but
                // rewrite to new provider prefix in case they differ
                if (visibleQuickAccess && visibleDescriptor && visibleDescriptor !== descriptor) {
                    const newValueCandidateWithoutPrefix = visibleQuickAccess.value.substr(visibleDescriptor.prefix.length);
                    if (newValueCandidateWithoutPrefix) {
                        newValue = `${descriptor.prefix}${newValueCandidateWithoutPrefix}`;
                    }
                }
                // Otherwise, take a default value as instructed
                if (!newValue) {
                    const defaultFilterValue = provider?.defaultFilterValue;
                    if (defaultFilterValue === quickAccess_1.DefaultQuickAccessFilterValue.LAST) {
                        newValue = this.lastAcceptedPickerValues.get(descriptor);
                    }
                    else if (typeof defaultFilterValue === 'string') {
                        newValue = `${descriptor.prefix}${defaultFilterValue}`;
                    }
                }
                if (typeof newValue === 'string') {
                    value = newValue;
                }
            }
            // Store the existing selection if there was one.
            const visibleSelection = visibleQuickAccess?.picker?.valueSelection;
            const visibleValue = visibleQuickAccess?.picker?.value;
            // Create a picker for the provider to use with the initial value
            // and adjust the filtering to exclude the prefix from filtering
            const disposables = new lifecycle_1.DisposableStore();
            const picker = disposables.add(this.quickInputService.createQuickPick());
            picker.value = value;
            this.adjustValueSelection(picker, descriptor, options);
            picker.placeholder = descriptor?.placeholder;
            picker.quickNavigate = options?.quickNavigateConfiguration;
            picker.hideInput = !!picker.quickNavigate && !visibleQuickAccess; // only hide input if there was no picker opened already
            if (typeof options?.itemActivation === 'number' || options?.quickNavigateConfiguration) {
                picker.itemActivation = options?.itemActivation ?? quickInput_1.ItemActivation.SECOND /* quick nav is always second */;
            }
            picker.contextKey = descriptor?.contextKey;
            picker.filterValue = (value) => value.substring(descriptor ? descriptor.prefix.length : 0);
            // Pick mode: setup a promise that can be resolved
            // with the selected items and prevent execution
            let pickPromise = undefined;
            if (pick) {
                pickPromise = new async_1.DeferredPromise();
                disposables.add(event_1.Event.once(picker.onWillAccept)(e => {
                    e.veto();
                    picker.hide();
                }));
            }
            // Register listeners
            disposables.add(this.registerPickerListeners(picker, provider, descriptor, value, options?.providerOptions));
            // Ask provider to fill the picker as needed if we have one
            // and pass over a cancellation token that will indicate when
            // the picker is hiding without a pick being made.
            const cts = disposables.add(new cancellation_1.CancellationTokenSource());
            if (provider) {
                disposables.add(provider.provide(picker, cts.token, options?.providerOptions));
            }
            // Finally, trigger disposal and cancellation when the picker
            // hides depending on items selected or not.
            event_1.Event.once(picker.onDidHide)(() => {
                if (picker.selectedItems.length === 0) {
                    cts.cancel();
                }
                // Start to dispose once picker hides
                disposables.dispose();
                // Resolve pick promise with selected items
                pickPromise?.complete(picker.selectedItems.slice(0));
            });
            // Finally, show the picker. This is important because a provider
            // may not call this and then our disposables would leak that rely
            // on the onDidHide event.
            picker.show();
            // If the previous picker had a selection and the value is unchanged, we should set that in the new picker.
            if (visibleSelection && visibleValue === value) {
                picker.valueSelection = visibleSelection;
            }
            // Pick mode: return with promise
            if (pick) {
                return pickPromise?.p;
            }
        }
        adjustValueSelection(picker, descriptor, options) {
            let valueSelection;
            // Preserve: just always put the cursor at the end
            if (options?.preserveValue) {
                valueSelection = [picker.value.length, picker.value.length];
            }
            // Otherwise: select the value up until the prefix
            else {
                valueSelection = [descriptor?.prefix.length ?? 0, picker.value.length];
            }
            picker.valueSelection = valueSelection;
        }
        registerPickerListeners(picker, provider, descriptor, value, providerOptions) {
            const disposables = new lifecycle_1.DisposableStore();
            // Remember as last visible picker and clean up once picker get's disposed
            const visibleQuickAccess = this.visibleQuickAccess = { picker, descriptor, value };
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                if (visibleQuickAccess === this.visibleQuickAccess) {
                    this.visibleQuickAccess = undefined;
                }
            }));
            // Whenever the value changes, check if the provider has
            // changed and if so - re-create the picker from the beginning
            disposables.add(picker.onDidChangeValue(value => {
                const [providerForValue] = this.getOrInstantiateProvider(value);
                if (providerForValue !== provider) {
                    this.show(value, {
                        // do not rewrite value from user typing!
                        preserveValue: true,
                        // persist the value of the providerOptions from the original showing
                        providerOptions
                    });
                }
                else {
                    visibleQuickAccess.value = value; // remember the value in our visible one
                }
            }));
            // Remember picker input for future use when accepting
            if (descriptor) {
                disposables.add(picker.onDidAccept(() => {
                    this.lastAcceptedPickerValues.set(descriptor, picker.value);
                }));
            }
            return disposables;
        }
        getOrInstantiateProvider(value) {
            const providerDescriptor = this.registry.getQuickAccessProvider(value);
            if (!providerDescriptor) {
                return [undefined, undefined];
            }
            let provider = this.mapProviderToDescriptor.get(providerDescriptor);
            if (!provider) {
                provider = this.instantiationService.createInstance(providerDescriptor.ctor);
                this.mapProviderToDescriptor.set(providerDescriptor, provider);
            }
            return [provider, providerDescriptor];
        }
    };
    exports.QuickAccessController = QuickAccessController;
    exports.QuickAccessController = QuickAccessController = __decorate([
        __param(0, quickInput_1.IQuickInputService),
        __param(1, instantiation_1.IInstantiationService)
    ], QuickAccessController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9xdWlja2lucHV0L2Jyb3dzZXIvcXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFhcEQsWUFDcUIsaUJBQXNELEVBQ25ELG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUg2QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2xDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFibkUsYUFBUSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF1Qix3QkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3JFLDRCQUF1QixHQUFHLElBQUksR0FBRyxFQUF3RCxDQUFDO1lBRTFGLDZCQUF3QixHQUFHLElBQUksR0FBRyxFQUEwQyxDQUFDO1lBRXRGLHVCQUFrQixHQUlWLFNBQVMsQ0FBQztRQU8xQixDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsT0FBNkI7WUFDN0MsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFLE9BQTZCO1lBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBSU8sWUFBWSxDQUFDLEtBQWEsRUFBRSxJQUFhLEVBQUUsT0FBNkI7WUFFL0Usc0NBQXNDO1lBQ3RDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLEdBQUcsSUFBSSxD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