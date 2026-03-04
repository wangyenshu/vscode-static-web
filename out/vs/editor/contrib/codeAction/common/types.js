/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/hierarchicalKind"], function (require, exports, errors_1, hierarchicalKind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionItem = exports.CodeActionCommandArgs = exports.CodeActionTriggerSource = exports.CodeActionAutoApply = exports.CodeActionKind = void 0;
    exports.mayIncludeActionsOfKind = mayIncludeActionsOfKind;
    exports.filtersAction = filtersAction;
    exports.CodeActionKind = new class {
        constructor() {
            this.QuickFix = new hierarchicalKind_1.HierarchicalKind('quickfix');
            this.Refactor = new hierarchicalKind_1.HierarchicalKind('refactor');
            this.RefactorExtract = this.Refactor.append('extract');
            this.RefactorInline = this.Refactor.append('inline');
            this.RefactorMove = this.Refactor.append('move');
            this.RefactorRewrite = this.Refactor.append('rewrite');
            this.Notebook = new hierarchicalKind_1.HierarchicalKind('notebook');
            this.Source = new hierarchicalKind_1.HierarchicalKind('source');
            this.SourceOrganizeImports = this.Source.append('organizeImports');
            this.SourceFixAll = this.Source.append('fixAll');
            this.SurroundWith = this.Refactor.append('surround');
        }
    };
    var CodeActionAutoApply;
    (function (CodeActionAutoApply) {
        CodeActionAutoApply["IfSingle"] = "ifSingle";
        CodeActionAutoApply["First"] = "first";
        CodeActionAutoApply["Never"] = "never";
    })(CodeActionAutoApply || (exports.CodeActionAutoApply = CodeActionAutoApply = {}));
    var CodeActionTriggerSource;
    (function (CodeActionTriggerSource) {
        CodeActionTriggerSource["Refactor"] = "refactor";
        CodeActionTriggerSource["RefactorPreview"] = "refactor preview";
        CodeActionTriggerSource["Lightbulb"] = "lightbulb";
        CodeActionTriggerSource["Default"] = "other (default)";
        CodeActionTriggerSource["SourceAction"] = "source action";
        CodeActionTriggerSource["QuickFix"] = "quick fix action";
        CodeActionTriggerSource["FixAll"] = "fix all";
        CodeActionTriggerSource["OrganizeImports"] = "organize imports";
        CodeActionTriggerSource["AutoFix"] = "auto fix";
        CodeActionTriggerSource["QuickFixHover"] = "quick fix hover window";
        CodeActionTriggerSource["OnSave"] = "save participants";
        CodeActionTriggerSource["ProblemsView"] = "problems view";
    })(CodeActionTriggerSource || (exports.CodeActionTriggerSource = CodeActionTriggerSource = {}));
    function mayIncludeActionsOfKind(filter, providedKind) {
        // A provided kind may be a subset or superset of our filtered kind.
        if (filter.include && !filter.include.intersects(providedKind)) {
            return false;
        }
        if (filter.excludes) {
            if (filter.excludes.some(exclude => excludesAction(providedKind, exclude, filter.include))) {
                return false;
            }
        }
        // Don't return source actions unless they are explicitly requested
        if (!filter.includeSourceActions && exports.CodeActionKind.Source.contains(providedKind)) {
            return false;
        }
        return true;
    }
    function filtersAction(filter, action) {
        const actionKind = action.kind ? new hierarchicalKind_1.HierarchicalKind(action.kind) : undefined;
        // Filter out actions by kind
        if (filter.include) {
            if (!actionKind || !filter.include.contains(actionKind)) {
                return false;
            }
        }
        if (filter.excludes) {
            if (actionKind && filter.excludes.some(exclude => excludesAction(actionKind, exclude, filter.include))) {
                return false;
            }
        }
        // Don't return source actions unless they are explicitly requested
        if (!filter.includeSourceActions) {
            if (actionKind && exports.CodeActionKind.Source.contains(actionKind)) {
                return false;
            }
        }
        if (filter.onlyIncludePreferredActions) {
            if (!action.isPreferred) {
                return false;
            }
        }
        return true;
    }
    function excludesAction(providedKind, exclude, include) {
        if (!exclude.contains(providedKind)) {
            return false;
        }
        if (include && exclude.contains(include)) {
            // The include is more specific, don't filter out
            return false;
        }
        return true;
    }
    class CodeActionCommandArgs {
        static fromUser(arg, defaults) {
            if (!arg || typeof arg !== 'object') {
                return new CodeActionCommandArgs(defaults.kind, defaults.apply, false);
            }
            return new CodeActionCommandArgs(CodeActionCommandArgs.getKindFromUser(arg, defaults.kind), CodeActionCommandArgs.getApplyFromUser(arg, defaults.apply), CodeActionCommandArgs.getPreferredUser(arg));
        }
        static getApplyFromUser(arg, defaultAutoApply) {
            switch (typeof arg.apply === 'string' ? arg.apply.toLowerCase() : '') {
                case 'first': return "first" /* CodeActionAutoApply.First */;
                case 'never': return "never" /* CodeActionAutoApply.Never */;
                case 'ifsingle': return "ifSingle" /* CodeActionAutoApply.IfSingle */;
                default: return defaultAutoApply;
            }
        }
        static getKindFromUser(arg, defaultKind) {
            return typeof arg.kind === 'string'
                ? new hierarchicalKind_1.HierarchicalKind(arg.kind)
                : defaultKind;
        }
        static getPreferredUser(arg) {
            return typeof arg.preferred === 'boolean'
                ? arg.preferred
                : false;
        }
        constructor(kind, apply, preferred) {
            this.kind = kind;
            this.apply = apply;
            this.preferred = preferred;
        }
    }
    exports.CodeActionCommandArgs = CodeActionCommandArgs;
    class CodeActionItem {
        constructor(action, provider, highlightRange) {
            this.action = action;
            this.provider = provider;
            this.highlightRange = highlightRange;
        }
        async resolve(token) {
            if (this.provider?.resolveCodeAction && !this.action.edit) {
                let action;
                try {
                    action = await this.provider.resolveCodeAction(this.action, token);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedExternalError)(err);
                }
                if (action) {
                    this.action.edit = action.edit;
                }
            }
            return this;
        }
    }
    exports.CodeActionItem = CodeActionItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2RlQWN0aW9uL2NvbW1vbi90eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzRGhHLDBEQWtCQztJQUVELHNDQThCQztJQS9GWSxRQUFBLGNBQWMsR0FBRyxJQUFJO1FBQUE7WUFDakIsYUFBUSxHQUFHLElBQUksbUNBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFNUMsYUFBUSxHQUFHLElBQUksbUNBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDNUMsb0JBQWUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRCxtQkFBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hELGlCQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsb0JBQWUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVsRCxhQUFRLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU1QyxXQUFNLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QywwQkFBcUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzlELGlCQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUMsaUJBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqRSxD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