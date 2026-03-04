/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/async", "vs/base/common/performance", "vs/platform/log/common/log", "vs/platform/environment/common/environment", "vs/base/common/map", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorPaneService"], function (require, exports, instantiation_1, lifecycle_1, platform_1, async_1, performance_1, log_1, environment_1, map_1, lifecycle_2, editorPaneService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getWorkbenchContribution = exports.registerWorkbenchContribution2 = exports.WorkbenchContributionsRegistry = exports.WorkbenchPhase = exports.Extensions = void 0;
    var Extensions;
    (function (Extensions) {
        /**
         * @deprecated use `registerWorkbenchContribution2` instead.
         */
        Extensions.Workbench = 'workbench.contributions.kind';
    })(Extensions || (exports.Extensions = Extensions = {}));
    var WorkbenchPhase;
    (function (WorkbenchPhase) {
        /**
         * The first phase signals that we are about to startup getting ready.
         *
         * Note: doing work in this phase blocks an editor from showing to
         * the user, so please rather consider to use the other types, preferable
         * `Lazy` to only instantiate the contribution when really needed.
         */
        WorkbenchPhase[WorkbenchPhase["BlockStartup"] = 1] = "BlockStartup";
        /**
         * Services are ready and the window is about to restore its UI state.
         *
         * Note: doing work in this phase blocks an editor from showing to
         * the user, so please rather consider to use the other types, preferable
         * `Lazy` to only instantiate the contribution when really needed.
         */
        WorkbenchPhase[WorkbenchPhase["BlockRestore"] = 2] = "BlockRestore";
        /**
         * Views, panels and editors have restored. Editors are given a bit of
         * time to restore their contents.
         */
        WorkbenchPhase[WorkbenchPhase["AfterRestored"] = 3] = "AfterRestored";
        /**
         * The last phase after views, panels and editors have restored and
         * some time has passed (2-5 seconds).
         */
        WorkbenchPhase[WorkbenchPhase["Eventually"] = 4] = "Eventually";
    })(WorkbenchPhase || (exports.WorkbenchPhase = WorkbenchPhase = {}));
    function isOnEditorWorkbenchContributionInstantiation(obj) {
        const candidate = obj;
        return !!candidate && typeof candidate.editorTypeId === 'string';
    }
    function toWorkbenchPhase(phase) {
        switch (phase) {
            case 3 /* LifecyclePhase.Restored */:
                return 3 /* WorkbenchPhase.AfterRestored */;
            case 4 /* LifecyclePhase.Eventually */:
                return 4 /* WorkbenchPhase.Eventually */;
        }
    }
    function toLifecyclePhase(instantiation) {
        switch (instantiation) {
            case 1 /* WorkbenchPhase.BlockStartup */:
                return 1 /* LifecyclePhase.Starting */;
            case 2 /* WorkbenchPhase.BlockRestore */:
                return 2 /* LifecyclePhase.Ready */;
            case 3 /* WorkbenchPhase.AfterRestored */:
                return 3 /* LifecyclePhase.Restored */;
            case 4 /* WorkbenchPhase.Eventually */:
                return 4 /* LifecyclePhase.Eventually */;
        }
    }
    class WorkbenchContributionsRegistry extends lifecycle_2.Disposable {
        constructor() {
            super(...arguments);
            this.contributionsByPhase = new Map();
            this.contributionsByEditor = new Map();
            this.contributionsById = new Map();
            this.instancesById = new Map();
            this.timingsByPhase = new Map();
            this.pendingRestoredContributions = new async_1.DeferredPromise();
            this.whenRestored = this.pendingRestoredContributions.p;
        }
        static { this.INSTANCE = new WorkbenchContributionsRegistry(); }
        static { this.BLOCK_BEFORE_RESTORE_WARN_THRESHOLD = 20; }
        static { this.BLOCK_AFTER_RESTORE_WARN_THRESHOLD = 100; }
        get timings() { return this.timingsByPhase; }
        registerWorkbenchContribution2(id, ctor, instantiation) {
            const contribution = { id, ctor };
            // Instantiate directly if we already have a matching instantiation condition
            if (this.instantiationService && this.lifecycleService && this.logService && this.environmentService && this.editorPaneService &&
                ((typeof instantiation === 'number' && this.lifecycleService.phase >= instantiation) ||
                    (typeof id === 'string' && isOnEditorWorkbenchContributionInstantiation(instantiation) && this.editorPaneService.didInstantiateEditorPane(instantiation.editorTypeId)))) {
                this.safeCreateContribution(this.instantiationService, this.logService, this.environmentService, contribution, typeof instantiation === 'number' ? toLifecyclePhase(instantiation) : this.lifecycleService.phase);
            }
            // Otherwise keep contributions by instantiation kind for later instantiation
            else {
                // by phase
                if (typeof instantiation === 'number') {
                    (0, map_1.getOrSet)(this.contributionsByPhase, toLifecyclePhase(instantiation), []).push(contribution);
                }
                if (typeof id === 'string') {
                    // by id
                    if (!this.contributionsById.has(id)) {
                        this.contributionsById.set(id, contribution);
                    }
                    else {
                        console.error(`IWorkbenchContributionsRegistry#registerWorkbenchContribution(): Can't register multiple contributions with same id '${id}'`);
                    }
                    // by editor
                    if (isOnEditorWorkbenchContributionInstantiation(instantiation)) {
                        (0, map_1.getOrSet)(this.contributionsByEditor, instantiation.editorTypeId, []).push(contribution);
                    }
                }
            }
        }
        registerWorkbenchContribution(ctor, phase) {
            this.registerWorkbenchContribution2(undefined, ctor, toWorkbenchPhase(phase));
        }
        getWorkbenchContribution(id) {
            if (this.instancesById.has(id)) {
                return this.instancesById.get(id);
            }
            const instantiationService = this.instantiationService;
            const lifecycleService = this.lifecycleService;
            const logService = this.logService;
            const environmentService = this.environmentService;
            if (!instantiationService || !lifecycleService || !logService || !environmentService) {
                throw new Error(`IWorkbenchContributionsRegistry#getContribution('${id}'): cannot be called before registry started`);
            }
            const contribution = this.contributionsById.get(id);
            if (!contribution) {
                throw new Error(`IWorkbenchContributionsRegistry#getContribution('${id}'): contribution with that identifier is unknown.`);
            }
            if (lifecycleService.phase < 3 /* LifecyclePhase.Restored */) {
                logService.warn(`IWorkbenchContributionsRegistry#getContribution('${id}'): contribution instantiated before LifecyclePhase.Restored!`);
            }
            this.safeCreateContribution(instantiationService, logService, environmentService, contribution, lifecycleService.phase);
            const instance = this.instancesById.get(id);
            if (!instance) {
                throw new Error(`IWorkbenchContributionsRegistry#getContribution('${id}'): failed to create contribution.`);
            }
            return instance;
        }
        start(accessor) {
            const instantiationService = this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const lifecycleService = this.lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
            const logService = this.logService = accessor.get(log_1.ILogService);
            const environmentService = this.environmentService = accessor.get(environment_1.IEnvironmentService);
            const editorPaneService = this.editorPaneService = accessor.get(editorPaneService_1.IEditorPaneService);
            // Instantiate contributions by phase when they are ready
            for (const phase of [1 /* LifecyclePhase.Starting */, 2 /* LifecyclePhase.Ready */, 3 /* LifecyclePhase.Restored */, 4 /* LifecyclePhase.Eventually */]) {
                this.instantiateByPhase(instantiationService, lifecycleService, logService, environmentService, phase);
            }
            // Instantiate contributions by editor when they are created or have been
            for (const editorTypeId of this.contributionsByEditor.keys()) {
                if (editorPaneService.didInstantiateEditorPane(editorTypeId)) {
                    this.onEditor(editorTypeId, instantiationService, lifecycleService, logService, environmentService);
                }
            }
            this._register(editorPaneService.onWillInstantiateEditorPane(e => this.onEditor(e.typeId, instantiationService, lifecycleService, logService, environmentService)));
        }
        onEditor(editorTypeId, instantiationService, lifecycleService, logService, environmentService) {
            const contributions = this.contributionsByEditor.get(editorTypeId);
            if (contributions) {
                this.contributionsByEditor.delete(editorTypeId);
                for (const contribution of contributions) {
                    this.safeCreateContribution(instantiationService, logService, environmentService, contribution, lifecycleService.phase);
                }
            }
        }
        instantiateByPhase(instantiationService, lifecycleService, logService, environmentService, phase) {
            // Instantiate contributions directly when phase is already reached
            if (lifecycleService.phase >= phase) {
                this.doInstantiateByPhase(instantiationService, logService, environmentService, phase);
            }
            // Otherwise wait for phase to be reached
            else {
                lifecycleService.when(phase).then(() => this.doInstantiateByPhase(instantiationService, logService, environmentService, phase));
            }
        }
        async doInstantiateByPhase(instantiationService, logService, environmentService, phase) {
            const contributions = this.contributionsByPhase.get(phase);
            if (contributions) {
                this.contributionsByPhase.delete(phase);
                switch (phase) {
                    case 1 /* LifecyclePhase.Starting */:
                    case 2 /* LifecyclePhase.Ready */: {
                        // instantiate everything synchronously and blocking
                        // measure the time it takes as perf marks for diagnosis
                        (0, performance_1.mark)(`code/willCreateWorkbenchContributions/${phase}`);
                        for (const contribution of contributions) {
                            this.safeCreateContribution(instantiationService, logService, environmentService, contribution, phase);
                        }
                        (0, performance_1.mark)(`code/didCreateWorkbenchContributions/${phase}`);
                        break;
                    }
                    case 3 /* LifecyclePhase.Restored */:
                    case 4 /* LifecyclePhase.Eventually */: {
                        // for the Restored/Eventually-phase we instantiate contributions
                        // only when idle. this might take a few idle-busy-cycles but will
                        // finish within the timeouts
                        // given that, we must ensure to await the contributions from the
                        // Restored-phase before we instantiate the Eventually-phase
                        if (phase === 4 /* LifecyclePhase.Eventually */) {
                            await this.pendingRestoredContributions.p;
                        }
                        this.doInstantiateWhenIdle(contributions, instantiationService, logService, environmentService, phase);
                        break;
                    }
                }
            }
        }
        doInstantiateWhenIdle(contributions, instantiationService, logService, environmentService, phase) {
            (0, performance_1.mark)(`code/willCreateWorkbenchContributions/${phase}`);
            let i = 0;
            const forcedTimeout = phase === 4 /* LifecyclePhase.Eventually */ ? 3000 : 500;
            const instantiateSome = (idle) => {
                while (i < contributions.length) {
                    const contribution = contributions[i++];
                    this.safeCreateContribution(instantiationService, logService, environmentService, contribution, phase);
                    if (idle.timeRemaining() < 1) {
                        // time is up -> reschedule
                        (0, async_1.runWhenGlobalIdle)(instantiateSome, forcedTimeout);
                        break;
                    }
                }
                if (i === contributions.length) {
                    (0, performance_1.mark)(`code/didCreateWorkbenchContributions/${phase}`);
                    if (phase === 3 /* LifecyclePhase.Restored */) {
                        this.pendingRestoredContributions.complete();
                    }
                }
            };
            (0, async_1.runWhenGlobalIdle)(instantiateSome, forcedTimeout);
        }
        safeCreateContribution(instantiationService, logService, environmentService, contribution, phase) {
            if (typeof contribution.id === 'string' && this.instancesById.has(contribution.id)) {
                return;
            }
            const now = Date.now();
            try {
                if (typeof contribution.id === 'string') {
                    (0, performance_1.mark)(`code/willCreateWorkbenchContribution/${phase}/${contribution.id}`);
                }
                const instance = instantiationService.createInstance(contribution.ctor);
                if (typeof contribution.id === 'string') {
                    this.instancesById.set(contribution.id, instance);
                    this.contributionsById.delete(contribution.id);
                }
            }
            catch (error) {
                logService.error(`Unable to create workbench contribution '${contribution.id ?? contribution.ctor.name}'.`, error);
            }
            finally {
                if (typeof contribution.id === 'string') {
                    (0, performance_1.mark)(`code/didCreateWorkbenchContribution/${phase}/${contribution.id}`);
                }
            }
            if (typeof contribution.id === 'string' || !environmentService.isBuilt /* only log out of sources where we have good ctor names */) {
                const time = Date.now() - now;
                if (time > (phase < 3 /* LifecyclePhase.Restored */ ? WorkbenchContributionsRegistry.BLOCK_BEFORE_RESTORE_WARN_THRESHOLD : WorkbenchContributionsRegistry.BLOCK_AFTER_RESTORE_WARN_THRESHOLD)) {
                    logService.warn(`Creation of workbench contribution '${contribution.id ?? contribution.ctor.name}' took ${time}ms.`);
                }
                if (typeof contribution.id === 'string') {
                    let timingsForPhase = this.timingsByPhase.get(phase);
                    if (!timingsForPhase) {
                        timingsForPhase = [];
                        this.timingsByPhase.set(phase, timingsForPhase);
                    }
                    timingsForPhase.push([contribution.id, time]);
                }
            }
        }
    }
    exports.WorkbenchContributionsRegistry = WorkbenchContributionsRegistry;
    /**
     * Register a workbench contribution that will be instantiated
     * based on the `instantiation` property.
     */
    exports.registerWorkbenchContribution2 = WorkbenchContributionsRegistry.INSTANCE.registerWorkbenchContribution2.bind(WorkbenchContributionsRegistry.INSTANCE);
    /**
     * Provides access to a workbench contribution with a specific identifier.
     * The contribution is created if not yet done.
     *
     * Note: will throw an error if
     * - called too early before the registry has started
     * - no contribution is known for the given identifier
     */
    exports.getWorkbenchContribution = WorkbenchContributionsRegistry.INSTANCE.getWorkbenchContribution.bind(WorkbenchContributionsRegistry.INSTANCE);
    platform_1.Registry.add(Extensions.Workbench, WorkbenchContributionsRegistry.INSTANCE);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vY29udHJpYnV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQmhHLElBQWlCLFVBQVUsQ0FLMUI7SUFMRCxXQUFpQixVQUFVO1FBQzFCOztXQUVHO1FBQ1Usb0JBQVMsR0FBRyw4QkFBOEIsQ0FBQztJQUN6RCxDQUFDLEVBTGdCLFVBQVUsMEJBQVYsVUFBVSxRQUsxQjtJQUVELElBQWtCLGNBK0JqQjtJQS9CRCxXQUFrQixjQUFjO1FBRS9COzs7Ozs7V0FNRztRQUNILG1FQUFzQyxDQUFBO1FBRXRDOzs7Ozs7V0FNRztRQUNILG1FQUFtQyxDQUFBO1FBRW5DOzs7V0FHRztRQUNILHFFQUF1QyxDQUFBO1FBRXZDOzs7V0FHRztRQUNILCtEQUFzQyxDQUFBO0lBQ3ZDLENBQUMsRUEvQmlCLGNBQWMsOEJBQWQsY0FBYyxRQStCL0I7SUFrQkQsU0FBUyw0Q0FBNEMsQ0FBQyxHQUFZO1FBQ2pFLE1BQU0sU0FBUyxHQUFHLEdBQThELENBQUM7UUFDakYsT0FBTyxDQUFDLENBQUMsU0FBUyxJQUFJLE9BQU8sU0FBUyxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUM7SUFDbEUsQ0FBQztJQUlELFNBQVMsZ0JBQWdCLENBQUMsS0FBMEQ7UUFDbkYsUUFBUSxLQUFLLEVBQUUsQ0FBQztZQUNmO2dCQUNDLDRDQUFvQztZQUNyQztnQkFDQyx5Q0FBaUM7UUFDbkMsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFDLGFBQTZCO1FBQ3RELFFBQVEsYUFBYSxFQUFFLENBQUM7WUFDdkI7Z0JBQ0MsdUNBQStCO1lBQ2hDO2dCQUNDLG9DQUE0QjtZQUM3QjtnQkFDQyx1Q0FBK0I7WUFDaEM7Z0JBQ0Ms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