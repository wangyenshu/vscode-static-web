/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/base/common/types", "vs/platform/log/common/log", "vs/base/browser/dom"], function (require, exports, nls, uri_1, codeEditorService_1, position_1, model_1, resolverService_1, actions_1, commands_1, contextkey_1, instantiation_1, keybindingsRegistry_1, platform_1, telemetry_1, types_1, log_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectAllCommand = exports.RedoCommand = exports.UndoCommand = exports.EditorExtensionsRegistry = exports.EditorAction2 = exports.MultiEditorAction = exports.EditorAction = exports.EditorCommand = exports.ProxyCommand = exports.MultiCommand = exports.Command = exports.EditorContributionInstantiation = void 0;
    exports.registerModelAndPositionCommand = registerModelAndPositionCommand;
    exports.registerEditorCommand = registerEditorCommand;
    exports.registerEditorAction = registerEditorAction;
    exports.registerMultiEditorAction = registerMultiEditorAction;
    exports.registerInstantiatedEditorAction = registerInstantiatedEditorAction;
    exports.registerEditorContribution = registerEditorContribution;
    exports.registerDiffEditorContribution = registerDiffEditorContribution;
    var EditorContributionInstantiation;
    (function (EditorContributionInstantiation) {
        /**
         * The contribution is created eagerly when the {@linkcode ICodeEditor} is instantiated.
         * Only Eager contributions can participate in saving or restoring of view state.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["Eager"] = 0] = "Eager";
        /**
         * The contribution is created at the latest 50ms after the first render after attaching a text model.
         * If the contribution is explicitly requested via `getContribution`, it will be instantiated sooner.
         * If there is idle time available, it will be instantiated sooner.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["AfterFirstRender"] = 1] = "AfterFirstRender";
        /**
         * The contribution is created before the editor emits events produced by user interaction (mouse events, keyboard events).
         * If the contribution is explicitly requested via `getContribution`, it will be instantiated sooner.
         * If there is idle time available, it will be instantiated sooner.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["BeforeFirstInteraction"] = 2] = "BeforeFirstInteraction";
        /**
         * The contribution is created when there is idle time available, at the latest 5000ms after the editor creation.
         * If the contribution is explicitly requested via `getContribution`, it will be instantiated sooner.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["Eventually"] = 3] = "Eventually";
        /**
         * The contribution is created only when explicitly requested via `getContribution`.
         */
        EditorContributionInstantiation[EditorContributionInstantiation["Lazy"] = 4] = "Lazy";
    })(EditorContributionInstantiation || (exports.EditorContributionInstantiation = EditorContributionInstantiation = {}));
    class Command {
        constructor(opts) {
            this.id = opts.id;
            this.precondition = opts.precondition;
            this._kbOpts = opts.kbOpts;
            this._menuOpts = opts.menuOpts;
            this.metadata = opts.metadata;
        }
        register() {
            if (Array.isArray(this._menuOpts)) {
                this._menuOpts.forEach(this._registerMenuItem, this);
            }
            else if (this._menuOpts) {
                this._registerMenuItem(this._menuOpts);
            }
            if (this._kbOpts) {
                const kbOptsArr = Array.isArray(this._kbOpts) ? this._kbOpts : [this._kbOpts];
                for (const kbOpts of kbOptsArr) {
                    let kbWhen = kbOpts.kbExpr;
                    if (this.precondition) {
                        if (kbWhen) {
                            kbWhen = contextkey_1.ContextKeyExpr.and(kbWhen, this.precondition);
                        }
                        else {
                            kbWhen = this.precondition;
                        }
                    }
                    const desc = {
                        id: this.id,
                        weight: kbOpts.weight,
                        args: kbOpts.args,
                        when: kbWhen,
                        primary: kbOpts.primary,
                        secondary: kbOpts.secondary,
                        win: kbOpts.win,
                        linux: kbOpts.linux,
                        mac: kbOpts.mac,
                    };
                    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule(desc);
                }
            }
            commands_1.CommandsRegistry.registerCommand({
                id: this.id,
                handler: (accessor, args) => this.runCommand(accessor, args),
                metadata: this.metadata
            });
        }
        _registerMenuItem(item) {
            actions_1.MenuRegistry.appendMenuItem(item.menuId, {
                group: item.group,
                command: {
                    id: this.id,
                    title: item.title,
                    icon: item.icon,
                    precondition: this.precondition
                },
                when: item.when,
                order: item.order
            });
        }
    }
    exports.Command = Command;
    class MultiCommand extends Command {
        constructor() {
            super(...arguments);
            this._implementations = [];
        }
        /**
         * A higher priority gets to be looked at first
         */
        addImplementation(priority, name, implementation, when) {
            this._implementations.push({ priority, name, implementation, when });
            this._implementations.sort((a, b) => b.priority - a.priority);
            return {
                dispose: () => {
                    for (let i = 0; i < this._implementations.length; i++) {
                        if (this._implementations[i].implementation === implementation) {
                            this._implementations.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        runCommand(accessor, args) {
            const logService = accessor.get(log_1.ILogService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            logService.trace(`Executing Command '${this.id}' which has ${this._implementations.length} bound.`);
            for (const impl of this._implementations) {
                if (impl.when) {
                    const context = contextKeyService.getContext((0, dom_1.getActiveElement)());
                    const value = impl.when.evaluate(context);
                    if (!value) {
                        continue;
                    }
                }
                const result = impl.implementation(accessor, args);
                if (result) {
                    logService.trace(`Command '${this.id}' was handled by '${impl.name}'.`);
                    if (typeof result === 'boolean') {
                        return;
                    }
                    return result;
                }
            }
            logService.trace(`The Command '${this.id}' was not handled by any implementation.`);
        }
    }
    exports.MultiCommand = MultiCommand;
    //#endregion
    /**
     * A command that delegates to another command's implementation.
     *
     * This lets different commands be registered but share the same implementation
     */
    class ProxyCommand extends Command {
        constructor(command, opts) {
            super(opts);
            this.command = command;
        }
        runCommand(accessor, args) {
            return this.command.runCommand(accessor, args);
        }
    }
    exports.ProxyCommand = ProxyCommand;
    class EditorCommand extends Command {
        /**
         * Create a command class that is bound to a certain editor contribution.
         */
        static bindToContribution(controllerGetter) {
            return class EditorControllerCommandImpl extends EditorCommand {
                constructor(opts) {
                    super(opts);
                    this._callback = opts.handler;
                }
                runEditorCommand(accessor, editor, args) {
                    const controller = controllerGetter(editor);
                    if (controller) {
                        this._callback(controller, args);
                    }
                }
            };
        }
        static runEditorCommand(accessor, args, precondition, runner) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            // Find the editor with text focus or active
            const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
            if (!editor) {
                // well, at least we tried...
                return;
            }
            return editor.invokeWithinContext((editorAccessor) => {
                const kbService = editorAccessor.get(contextkey_1.IContextKeyService);
                if (!kbService.contextMatchesRules(precondition ?? undefined)) {
                    // precondition does not hold
                    return;
                }
                return runner(editorAccessor, editor, args);
            });
        }
        runCommand(accessor, args) {
            return EditorCommand.runEditorCommand(accessor, args, this.precondition, (accessor, editor, args) => this.runEditorCommand(accessor, editor, args));
        }
    }
    exports.EditorCommand = EditorCommand;
    class EditorAction extends EditorCommand {
        static convertOptions(opts) {
            let menuOpts;
            if (Array.isArray(opts.menuOpts)) {
                menuOpts = opts.menuOpts;
            }
            else if (opts.menuOpts) {
                menuOpts = [opts.menuOpts];
            }
            else {
                menuOpts = [];
            }
            function withDefaults(item) {
                if (!item.menuId) {
                    item.menuId = actions_1.MenuId.EditorContext;
                }
                if (!item.title) {
                    item.title = opts.label;
                }
                item.when = contextkey_1.ContextKeyExpr.and(opts.precondition, item.when);
                return item;
            }
            if (Array.isArray(opts.contextMenuOpts)) {
                menuOpts.push(...opts.contextMenuOpts.map(withDefaults));
            }
            else if (opts.contextMenuOpts) {
                menuOpts.push(withDefaults(opts.contextMenuOpts));
            }
            opts.menuOpts = menuOpts;
            return opts;
        }
        constructor(opts) {
            super(EditorAction.convertOptions(opts));
            this.label = opts.label;
            this.alias = opts.alias;
        }
        runEditorCommand(accessor, editor, args) {
            this.reportTelemetry(accessor, editor);
            return this.run(accessor, editor, args || {});
        }
        reportTelemetry(accessor, editor) {
            accessor.get(telemetry_1.ITelemetryService).publicLog2('editorActionInvoked', { name: this.label, id: this.id });
        }
    }
    exports.EditorAction = EditorAction;
    class MultiEditorAction extends EditorAction {
        constructor() {
            super(...arguments);
            this._implementations = [];
        }
        /**
         * A higher priority gets to be looked at first
         */
        addImplementation(priority, implementation) {
            this._implementations.push([priority, implementation]);
            this._implementations.sort((a, b) => b[0] - a[0]);
            return {
                dispose: () => {
                    for (let i = 0; i < this._implementations.length; i++) {
                        if (this._implementations[i][1] === implementation) {
                            this._implementations.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        run(accessor, editor, args) {
            for (const impl of this._implementations) {
                const result = impl[1](accessor, editor, args);
                if (result) {
                    if (typeof result === 'boolean') {
                        return;
                    }
                    return result;
                }
            }
        }
    }
    exports.MultiEditorAction = MultiEditorAction;
    //#endregion EditorAction
    //#region EditorAction2
    class EditorAction2 extends actions_1.Action2 {
        run(accessor, ...args) {
            // Find the editor with text focus or active
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
            if (!editor) {
                // well, at least we tried...
                return;
            }
            // precondition does hold
            return editor.invokeWithinContext((editorAccessor) => {
                const kbService = editorAccessor.get(contextkey_1.IContextKeyService);
                const logService = editorAccessor.get(log_1.ILogService);
                const enabled = kbService.contextMatchesRules(this.desc.precondition ?? undefined);
                if (!enabled) {
                    logService.debug(`[EditorAction2] NOT running command because its precondition is FALSE`, this.desc.id, this.desc.precondition?.serialize());
                    return;
                }
                return this.runEditorCommand(editorAccessor, editor, ...args);
            });
        }
    }
    exports.EditorAction2 = EditorAction2;
    //#endregion
    // --- Registration of commands and actions
    function registerModelAndPositionCommand(id, handler) {
        commands_1.CommandsRegistry.registerCommand(id, function (accessor, ...args) {
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const [resource, position] = args;
            (0, types_1.assertType)(uri_1.URI.isUri(resource));
            (0, types_1.assertType)(position_1.Position.isIPosition(position));
            const model = accessor.get(model_1.IModelService).getModel(resource);
            if (model) {
                const editorPosition = position_1.Position.lift(position);
                return instaService.invokeFunction(handler, model, editorPosition, ...args.slice(2));
            }
            return accessor.get(resolverService_1.ITextModelService).createModelReference(resource).then(reference => {
                return new Promise((resolve, reject) => {
                    try {
                        const result = instaService.invokeFunction(handler, reference.object.textEditorModel, position_1.Position.lift(position), args.slice(2));
                        resolve(result);
                    }
                    catch (err) {
                        reject(err);
                    }
                }).finally(() => {
                    reference.dispose();
                });
            });
        });
    }
    function registerEditorCommand(editorCommand) {
        EditorContributionRegistry.INSTANCE.registerEditorCommand(editorCommand);
        return editorCommand;
    }
    function registerEditorAction(ctor) {
        const action = new ctor();
        EditorContributionRegistry.INSTANCE.registerEditorAction(action);
        return action;
    }
    function registerMultiEditorAction(action) {
        EditorContributionRegistry.INSTANCE.registerEditorAction(action);
        return action;
    }
    function registerInstantiatedEditorAction(editorAction) {
        EditorContributionRegistry.INSTANCE.registerEditorAction(editorAction);
    }
    /**
     * Registers an editor contribution. Editor contributions have a lifecycle which is bound
     * to a specific code editor instance.
     */
    function registerEditorContribution(id, ctor, instantiation) {
        EditorContributionRegistry.INSTANCE.registerEditorContribution(id, ctor, instantiation);
    }
    /**
     * Registers a diff editor contribution. Diff editor contributions have a lifecycle which
     * is bound to a specific diff editor instance.
     */
    function registerDiffEditorContribution(id, ctor) {
        EditorContributionRegistry.INSTANCE.registerDiffEditorContribution(id, ctor);
    }
    var EditorExtensionsRegistry;
    (function (EditorExtensionsRegistry) {
        function getEditorCommand(commandId) {
            return EditorContributionRegistry.INSTANCE.getEditorCommand(commandId);
        }
        EditorExtensionsRegistry.getEditorCommand = getEditorCommand;
        function getEditorActions() {
            return EditorContributionRegistry.INSTANCE.getEditorActions();
        }
        EditorExtensionsRegistry.getEditorActions = getEditorActions;
        function getEditorContributions() {
            return EditorContributionRegistry.INSTANCE.getEditorContributions();
        }
        EditorExtensionsRegistry.getEditorContributions = getEditorContributions;
        function getSomeEditorContributions(ids) {
            return EditorContributionRegistry.INSTANCE.getEditorContributions().filter(c => ids.indexOf(c.id) >= 0);
        }
        EditorExtensionsRegistry.getSomeEditorContributions = getSomeEditorContributions;
        function getDiffEditorContributions() {
            return EditorContributionRegistry.INSTANCE.getDiffEditorContributions();
        }
        EditorExtensionsRegistry.getDiffEditorContributions = getDiffEditorContributions;
    })(EditorExtensionsRegistry || (exports.EditorExtensionsRegistry = EditorExtensionsRegistry = {}));
    // Editor extension points
    const Extensions = {
        EditorCommonContributions: 'editor.contributions'
    };
    class EditorContributionRegistry {
        static { this.INSTANCE = new EditorContributionRegistry(); }
        constructor() {
            this.editorContributions = [];
            this.diffEditorContributions = [];
            this.editorActions = [];
            this.editorCommands = Object.create(null);
        }
        registerEditorContribution(id, ctor, instantiation) {
            this.editorContributions.push({ id, ctor: ctor, instantiation });
        }
        getEditorContributions() {
            return this.editorContributions.slice(0);
        }
        registerDiffEditorContribution(id, ctor) {
            this.diffEditorContributions.push({ id, ctor: ctor });
        }
        getDiffEditorContributions() {
            return this.diffEditorContributions.slice(0);
        }
        registerEditorAction(action) {
            action.register();
            this.editorActions.push(action);
        }
        getEditorActions() {
            return this.editorActions;
        }
        registerEditorCommand(editorCommand) {
            editorCommand.register();
            this.editorCommands[editorCommand.id] = editorCommand;
        }
        getEditorCommand(commandId) {
            return (this.editorCommands[commandId] || null);
        }
    }
    platform_1.Registry.add(Extensions.EditorCommonContributions, EditorContributionRegistry.INSTANCE);
    function registerCommand(command) {
        command.register();
        return command;
    }
    exports.UndoCommand = registerCommand(new MultiCommand({
        id: 'undo',
        precondition: undefined,
        kbOpts: {
            weight: 0 /* KeybindingWeight.EditorCore */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */
        },
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '1_do',
                title: nls.localize({ key: 'miUndo', comment: ['&& denotes a mnemonic'] }, "&&Undo"),
                order: 1
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('undo', "Undo"),
                order: 1
            }]
    }));
    registerCommand(new ProxyCommand(exports.UndoCommand, { id: 'default:undo', precondition: undefined }));
    exports.RedoCommand = registerCommand(new MultiCommand({
        id: 'redo',
        precondition: undefined,
        kbOpts: {
            weight: 0 /* KeybindingWeight.EditorCore */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 56 /* KeyCode.KeyZ */],
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 56 /* KeyCode.KeyZ */ }
        },
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '1_do',
                title: nls.localize({ key: 'miRedo', comment: ['&& denotes a mnemonic'] }, "&&Redo"),
                order: 2
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('redo', "Redo"),
                order: 1
            }]
    }));
    registerCommand(new ProxyCommand(exports.RedoCommand, { id: 'default:redo', precondition: undefined }));
    exports.SelectAllCommand = registerCommand(new MultiCommand({
        id: 'editor.action.selectAll',
        precondition: undefined,
        kbOpts: {
            weight: 0 /* KeybindingWeight.EditorCore */,
            kbExpr: null,
            primary: 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */
        },
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarSelectionMenu,
                group: '1_basic',
                title: nls.localize({ key: 'miSelectAll', comment: ['&& denotes a mnemonic'] }, "&&Select All"),
                order: 1
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('selectAll', "Select All"),
                order: 1
            }]
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2VkaXRvckV4dGVuc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNmRoRywwRUE0QkM7SUFFRCxzREFHQztJQUVELG9EQUlDO0lBRUQsOERBR0M7SUFFRCw0RUFFQztJQU1ELGdFQUVDO0lBTUQsd0VBRUM7SUFoZ0JELElBQWtCLCtCQStCakI7SUEvQkQsV0FBa0IsK0JBQStCO1FBQ2hEOzs7V0FHRztRQUNILHVGQUFLLENBQUE7UUFFTDs7OztXQUlHO1FBQ0gsNkdBQWdCLENBQUE7UUFFaEI7Ozs7V0FJRztRQUNILHlIQUFzQixDQUFBO1FBRXRCOzs7V0FHRztRQUNILGlHQUFVLENBQUE7UUFFVjs7V0FFRztRQUNILHFGQUFJLENBQUE7SUFDTCxDQUFDLEVBL0JpQiwrQkFBK0IsK0NBQS9CLCtCQUErQixRQStCaEQ7SUFzQ0QsTUFBc0IsT0FBTztRQU81QixZQUFZLElBQXFCO1lBQ2hDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDdEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzNCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDL0IsQ0FBQztRQUVNLFFBQVE7WUFFZCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxD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