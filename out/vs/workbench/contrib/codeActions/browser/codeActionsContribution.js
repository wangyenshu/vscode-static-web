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
define(["require", "exports", "vs/base/common/event", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/common/types", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform"], function (require, exports, event_1, hierarchicalKind_1, lifecycle_1, editorConfigurationSchema_1, codeAction_1, types_1, nls, configurationRegistry_1, keybinding_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionsContribution = exports.editorConfiguration = void 0;
    const createCodeActionsAutoSave = (description) => {
        return {
            type: 'string',
            enum: ['always', 'explicit', 'never', true, false],
            enumDescriptions: [
                nls.localize('alwaysSave', 'Triggers Code Actions on explicit saves and auto saves triggered by window or focus changes.'),
                nls.localize('explicitSave', 'Triggers Code Actions only when explicitly saved'),
                nls.localize('neverSave', 'Never triggers Code Actions on save'),
                nls.localize('explicitSaveBoolean', 'Triggers Code Actions only when explicitly saved. This value will be deprecated in favor of "explicit".'),
                nls.localize('neverSaveBoolean', 'Never triggers Code Actions on save. This value will be deprecated in favor of "never".')
            ],
            default: 'explicit',
            description: description
        };
    };
    const codeActionsOnSaveDefaultProperties = Object.freeze({
        'source.fixAll': createCodeActionsAutoSave(nls.localize('codeActionsOnSave.fixAll', "Controls whether auto fix action should be run on file save.")),
    });
    const codeActionsOnSaveSchema = {
        oneOf: [
            {
                type: 'object',
                properties: codeActionsOnSaveDefaultProperties,
                additionalProperties: {
                    type: 'string'
                },
            },
            {
                type: 'array',
                items: { type: 'string' }
            }
        ],
        markdownDescription: nls.localize('editor.codeActionsOnSave', 'Run Code Actions for the editor on save. Code Actions must be specified and the editor must not be shutting down. Example: `"source.organizeImports": "explicit" `'),
        type: ['object', 'array'],
        additionalProperties: {
            type: 'string',
            enum: ['always', 'explicit', 'never', true, false],
        },
        default: {},
        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
    };
    exports.editorConfiguration = Object.freeze({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            'editor.codeActionsOnSave': codeActionsOnSaveSchema
        }
    });
    let CodeActionsContribution = class CodeActionsContribution extends lifecycle_1.Disposable {
        constructor(codeActionsExtensionPoint, keybindingService) {
            super();
            this._contributedCodeActions = [];
            this._onDidChangeContributions = this._register(new event_1.Emitter());
            codeActionsExtensionPoint.setHandler(extensionPoints => {
                this._contributedCodeActions = extensionPoints.flatMap(x => x.value).filter(x => Array.isArray(x.actions));
                this.updateConfigurationSchema(this._contributedCodeActions);
                this._onDidChangeContributions.fire();
            });
            keybindingService.registerSchemaContribution({
                getSchemaAdditions: () => this.getSchemaAdditions(),
                onDidChange: this._onDidChangeContributions.event,
            });
        }
        updateConfigurationSchema(codeActionContributions) {
            const newProperties = { ...codeActionsOnSaveDefaultProperties };
            for (const [sourceAction, props] of this.getSourceActions(codeActionContributions)) {
                newProperties[sourceAction] = createCodeActionsAutoSave(nls.localize('codeActionsOnSave.generic', "Controls whether '{0}' actions should be run on file save.", props.title));
            }
            codeActionsOnSaveSchema.properties = newProperties;
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                .notifyConfigurationSchemaUpdated(exports.editorConfiguration);
        }
        getSourceActions(contributions) {
            const defaultKinds = Object.keys(codeActionsOnSaveDefaultProperties).map(value => new hierarchicalKind_1.HierarchicalKind(value));
            const sourceActions = new Map();
            for (const contribution of contributions) {
                for (const action of contribution.actions) {
                    const kind = new hierarchicalKind_1.HierarchicalKind(action.kind);
                    if (types_1.CodeActionKind.Source.contains(kind)
                        // Exclude any we already included by default
                        && !defaultKinds.some(defaultKind => defaultKind.contains(kind))) {
                        sourceActions.set(kind.value, action);
                    }
                }
            }
            return sourceActions;
        }
        getSchemaAdditions() {
            const conditionalSchema = (command, actions) => {
                return {
                    if: {
                        required: ['command'],
                        properties: {
                            'command': { const: command }
                        }
                    },
                    then: {
                        properties: {
                            'args': {
                                required: ['kind'],
                                properties: {
                                    'kind': {
                                        anyOf: [
                                            {
                                                enum: actions.map(action => action.kind),
                                                enumDescriptions: actions.map(action => action.description ?? action.title),
                                            },
                                            { type: 'string' },
                                        ]
                                    }
                                }
                            }
                        }
                    }
                };
            };
            const getActions = (ofKind) => {
                const allActions = this._contributedCodeActions.flatMap(desc => desc.actions);
                const out = new Map();
                for (const action of allActions) {
                    if (!out.has(action.kind) && ofKind.contains(new hierarchicalKind_1.HierarchicalKind(action.kind))) {
                        out.set(action.kind, action);
                    }
                }
                return Array.from(out.values());
            };
            return [
                conditionalSchema(codeAction_1.codeActionCommandId, getActions(hierarchicalKind_1.HierarchicalKind.Empty)),
                conditionalSchema(codeAction_1.refactorCommandId, getActions(types_1.CodeActionKind.Refactor)),
                conditionalSchema(codeAction_1.sourceActionCommandId, getActions(types_1.CodeActionKind.Source)),
            ];
        }
    };
    exports.CodeActionsContribution = CodeActionsContribution;
    exports.CodeActionsContribution = CodeActionsContribution = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], CodeActionsContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbnNDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlQWN0aW9ucy9icm93c2VyL2NvZGVBY3Rpb25zQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCaEcsTUFBTSx5QkFBeUIsR0FBRyxDQUFDLFdBQW1CLEVBQWUsRUFBRTtRQUN0RSxPQUFPO1lBQ04sSUFBSSxFQUFFLFFBQVE7WUFDZCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDO1lBQ2xELGdCQUFnQixFQUFFO2dCQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSw4RkFBOEYsQ0FBQztnQkFDMUgsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsa0RBQWtELENBQUM7Z0JBQ2hGLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLHFDQUFxQyxDQUFDO2dCQUNoRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLHlHQUF5RyxDQUFDO2dCQUM5SSxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLHlGQUF5RixDQUFDO2FBQzNIO1lBQ0QsT0FBTyxFQUFFLFVBQVU7WUFDbkIsV0FBVyxFQUFFLFdBQVc7U0FDeEIsQ0FBQztJQUNILENBQUMsQ0FBQztJQUVGLE1BQU0sa0NBQWtDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBaUI7UUFDeEUsZUFBZSxFQUFFLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsOERBQThELENBQUMsQ0FBQztLQUNwSixDQUFDLENBQUM7SUFFSCxNQUFNLHVCQUF1QixHQUFp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