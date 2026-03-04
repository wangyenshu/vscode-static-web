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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugContext", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, lifecycle_1, types_1, contextkey_1, extensions_1, instantiation_1, log_1, debug_1, debugContext_1, debugModel_1, extensions_2, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugVisualizerService = exports.DebugVisualizer = exports.IDebugVisualizerService = void 0;
    exports.IDebugVisualizerService = (0, instantiation_1.createDecorator)('debugVisualizerService');
    class DebugVisualizer {
        get name() {
            return this.viz.name;
        }
        get iconPath() {
            return this.viz.iconPath;
        }
        get iconClass() {
            return this.viz.iconClass;
        }
        constructor(handle, viz) {
            this.handle = handle;
            this.viz = viz;
        }
        async resolve(token) {
            return this.viz.visualization ??= await this.handle.resolveDebugVisualizer(this.viz, token);
        }
        async execute() {
            await this.handle.executeDebugVisualizerCommand(this.viz.id);
        }
    }
    exports.DebugVisualizer = DebugVisualizer;
    const emptyRef = { object: [], dispose: () => { } };
    let DebugVisualizerService = class DebugVisualizerService {
        constructor(contextKeyService, extensionService, logService) {
            this.contextKeyService = contextKeyService;
            this.extensionService = extensionService;
            this.logService = logService;
            this.handles = new Map();
            this.trees = new Map();
            this.didActivate = new Map();
            this.registrations = [];
            visualizersExtensionPoint.setHandler((_, { added, removed }) => {
                this.registrations = this.registrations.filter(r => !removed.some(e => extensions_1.ExtensionIdentifier.equals(e.description.identifier, r.extensionId)));
                added.forEach(e => this.processExtensionRegistration(e.description));
            });
        }
        /** @inheritdoc */
        async getApplicableFor(variable, token) {
            if (!(variable instanceof debugModel_1.Variable)) {
                return emptyRef;
            }
            const threadId = variable.getThreadId();
            if (threadId === undefined) { // an expression, not a variable
                return emptyRef;
            }
            const context = this.getVariableContext(threadId, variable);
            const overlay = (0, debugContext_1.getContextForVariable)(this.contextKeyService, variable, [
                [debug_1.CONTEXT_VARIABLE_NAME.key, variable.name],
                [debug_1.CONTEXT_VARIABLE_VALUE.key, variable.value],
                [debug_1.CONTEXT_VARIABLE_TYPE.key, variable.type],
            ]);
            const maybeVisualizers = await Promise.all(this.registrations.map(async (registration) => {
                if (!overlay.contextMatchesRules(registration.expr)) {
                    return;
                }
                let prom = this.didActivate.get(registration.id);
                if (!prom) {
                    prom = this.extensionService.activateByEvent(`onDebugVisualizer:${registration.id}`);
                    this.didActivate.set(registration.id, prom);
                }
                await prom;
                if (token.isCancellationRequested) {
                    return;
                }
                const handle = this.handles.get(toKey(registration.extensionId, registration.id));
                return handle && { handle, result: await handle.provideDebugVisualizers(context, token) };
            }));
            const ref = {
                object: maybeVisualizers.filter(types_1.isDefined).flatMap(v => v.result.map(r => new DebugVisualizer(v.handle, r))),
                dispose: () => {
                    for (const viz of maybeVisualizers) {
                        viz?.handle.disposeDebugVisualizers(viz.result.map(r => r.id));
                    }
                },
            };
            if (token.isCancellationRequested) {
                ref.dispose();
            }
            return ref;
        }
        /** @inheritdoc */
        register(handle) {
            const key = toKey(handle.extensionId, handle.id);
            this.handles.set(key, handle);
            return (0, lifecycle_1.toDisposable)(() => this.handles.delete(key));
        }
        /** @inheritdoc */
        registerTree(treeId, handle) {
            this.trees.set(treeId, handle);
            return (0, lifecycle_1.toDisposable)(() => this.trees.delete(treeId));
        }
        /** @inheritdoc */
        async getVisualizedNodeFor(treeId, expr) {
            if (!(expr instanceof debugModel_1.Variable)) {
                return;
            }
            const threadId = expr.getThreadId();
            if (threadId === undefined) {
                return;
            }
            const tree = this.trees.get(treeId);
            if (!tree) {
                return;
            }
            try {
                const treeItem = await tree.getTreeItem(this.getVariableContext(threadId, expr));
                if (!treeItem) {
                    return;
                }
                return new debugModel_1.VisualizedExpression(this, treeId, treeItem, expr);
            }
            catch (e) {
                this.logService.warn('Failed to get visualized node', e);
                return;
            }
        }
        /** @inheritdoc */
        async getVisualizedChildren(treeId, treeElementId) {
            const children = await this.trees.get(treeId)?.getChildren(treeElementId) || [];
            return children.map(c => new debugModel_1.VisualizedExpression(this, treeId, c, undefined));
        }
        /** @inheritdoc */
        async editTreeItem(treeId, treeItem, newValue) {
            const newItem = await this.trees.get(treeId)?.editItem?.(treeItem.id, newValue);
            if (newItem) {
                Object.assign(treeItem, newItem); // replace in-place so rerenders work
            }
        }
        getVariableContext(threadId, variable) {
            const context = {
                sessionId: variable.getSession()?.getId() || '',
                containerId: (variable.parent instanceof debugModel_1.Variable ? variable.reference : undefined),
                threadId,
                variable: {
                    name: variable.name,
                    value: variable.value,
                    type: variable.type,
                    evaluateName: variable.evaluateName,
                    variablesReference: variable.reference || 0,
                    indexedVariables: variable.indexedVariables,
                    memoryReference: variable.memoryReference,
                    namedVariables: variable.namedVariables,
                    presentationHint: variable.presentationHint,
                }
            };
            for (let p = variable; p instanceof debugModel_1.Variable; p = p.parent) {
                if (p.parent instanceof debugModel_1.Scope) {
                    context.frameId = p.parent.stackFrame.frameId;
                }
            }
            return context;
        }
        processExtensionRegistration(ext) {
            const viz = ext.contributes?.debugVisualizers;
            if (!(viz instanceof Array)) {
                return;
            }
            for (const { when, id } of viz) {
                try {
                    const expr = contextkey_1.ContextKeyExpr.deserialize(when);
                    if (expr) {
                        this.registrations.push({ expr, id, extensionId: ext.identifier });
                    }
                }
                catch (e) {
                    this.logService.error(`Error processing debug visualizer registration from extension '${ext.identifier.value}'`, e);
                }
            }
        }
    };
    exports.DebugVisualizerService = DebugVisualizerService;
    exports.DebugVisualizerService = DebugVisualizerService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, extensions_2.IExtensionService),
        __param(2, log_1.ILogService)
    ], DebugVisualizerService);
    const toKey = (extensionId, id) => `${extensions_1.ExtensionIdentifier.toKey(extensionId)}\0${id}`;
    const visualizersExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'debugVisualizers',
        jsonSchema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Name of the debug visualizer'
                    },
                    when: {
                        type: 'string',
                        description: 'Condition when the debug visualizer is applicable'
                    }
                },
                required: ['id', 'when']
            }
        },
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                if (contrib.id) {
                    result.push(`onDebugVisualizer:${contrib.id}`);
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdWaXN1YWxpemVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9kZWJ1Z1Zpc3VhbGl6ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWVuRixRQUFBLHVCQUF1QixHQUFHLElBQUEsK0JBQWUsRUFBMEIsd0JBQXdCLENBQUMsQ0FBQztJQWtCMUcsTUFBYSxlQUFlO1FBQzNCLElBQVcsSUFBSTtZQUNkLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQzFCLENBQUM7UUFFRCxJQUFXLFNBQVM7WUFDbkIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUMzQixDQUFDO1FBRUQsWUFBNkIsTUFBd0IsRUFBbUIsR0FBd0I7WUFBbkUsV0FBTSxHQUFOLE1BQU0sQ0FBa0I7WUFBbUIsUUFBRyxHQUFILEdBQUcsQ0FBcUI7UUFBSSxDQUFDO1FBRTlGLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBd0I7WUFDNUMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsS0FBSyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RixDQUFDO1FBRU0sS0FBSyxDQUFDLE9BQU87WUFDbkIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUQsQ0FBQztLQUNEO0lBdEJELDBDQXNCQztJQW9DRCxNQUFNLFFB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