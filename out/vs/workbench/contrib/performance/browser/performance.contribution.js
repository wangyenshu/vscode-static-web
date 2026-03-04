/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/action/common/actionCommonCategories", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/performance/browser/perfviewEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiationService", "vs/base/common/event", "vs/workbench/contrib/performance/browser/inputLatencyContrib"], function (require, exports, nls_1, actions_1, instantiation_1, platform_1, actionCommonCategories_1, contributions_1, editor_1, perfviewEditor_1, editorService_1, instantiationService_1, event_1, inputLatencyContrib_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // -- startup performance view
    (0, contributions_1.registerWorkbenchContribution2)(perfviewEditor_1.PerfviewContrib.ID, perfviewEditor_1.PerfviewContrib, { lazy: true });
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(perfviewEditor_1.PerfviewInput.Id, class {
        canSerialize() {
            return true;
        }
        serialize() {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(perfviewEditor_1.PerfviewInput);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perfview.show',
                title: (0, nls_1.localize2)('show.label', 'Startup Performance'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const contrib = perfviewEditor_1.PerfviewContrib.get();
            return editorService.openEditor(contrib.getEditorInput(), { pinned: true });
        }
    });
    (0, actions_1.registerAction2)(class PrintServiceCycles extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perf.insta.printAsyncCycles',
                title: (0, nls_1.localize2)('cycles', 'Print Service Cycles'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            if (instaService instanceof instantiationService_1.InstantiationService) {
                const cycle = instaService._globalGraph?.findCycleSlow();
                if (cycle) {
                    console.warn(`CYCLE`, cycle);
                }
                else {
                    console.warn(`YEAH, no more cycles`);
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class PrintServiceTraces extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perf.insta.printTraces',
                title: (0, nls_1.localize2)('insta.trace', 'Print Service Traces'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run() {
            if (instantiationService_1.Trace.all.size === 0) {
                console.log('Enable via `instantiationService.ts#_enableAllTracing`');
                return;
            }
            for (const item of instantiationService_1.Trace.all) {
                console.log(item);
            }
        }
    });
    (0, actions_1.registerAction2)(class PrintEventProfiling extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perf.event.profiling',
                title: (0, nls_1.localize2)('emitter', 'Print Emitter Profiles'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run() {
            if (event_1.EventProfiling.all.size === 0) {
                console.log('USE `EmitterOptions._profName` to enable profiling');
                return;
            }
            for (const item of event_1.EventProfiling.all) {
                console.log(`${item.name}: ${item.invocationCount} invocations COST ${item.elapsedOverall}ms, ${item.listenerCount} listeners, avg cost is ${item.durations.reduce((a, b) => a + b, 0) / item.durations.length}ms`);
            }
        }
    });
    // -- input latency
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(inputLatencyContrib_1.InputLatencyContrib, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybWFuY2UuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcGVyZm9ybWFuY2UvYnJvd3Nlci9wZXJmb3JtYW5jZS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLDhCQUE4QjtJQUU5QixJQUFBLDhDQUE4QixFQUM3QixnQ0FBZSxDQUFDLEVBQUUsRUFDbEIsZ0NBQWUsRUFDZixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FDZCxDQUFDO0lBRUYsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLHlCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLHdCQUF3QixDQUMzRiw4QkFBYSxDQUFDLEVBQUUsRUFDaEI7UUFDQyxZQUFZO1lBQ1gsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsU0FBUztZQUNSLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUNELFdBQVcsQ0FBQyxvQkFBMkM7WUFDdEQsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsOEJBQWEsQ0FBQyxDQUFDO1FBQzNELENBQUM7S0FDRCxDQUNELENBQUM7SUFHRixJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBRXBDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxlQUFlO2dCQUNuQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsWUFBWSxFQUFFLHFCQUFxQixDQUFDO2dCQUNyRCxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEI7WUFDN0IsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFB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