/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/language/common/languageService", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/base/common/htmlContent"], function (require, exports, nls, languageService_1, extensionFeatures_1, lifecycle_1, descriptors_1, platform_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.codeActionsExtensionPointDescriptor = void 0;
    var CodeActionExtensionPointFields;
    (function (CodeActionExtensionPointFields) {
        CodeActionExtensionPointFields["languages"] = "languages";
        CodeActionExtensionPointFields["actions"] = "actions";
        CodeActionExtensionPointFields["kind"] = "kind";
        CodeActionExtensionPointFields["title"] = "title";
        CodeActionExtensionPointFields["description"] = "description";
    })(CodeActionExtensionPointFields || (CodeActionExtensionPointFields = {}));
    const codeActionsExtensionPointSchema = Object.freeze({
        type: 'array',
        markdownDescription: nls.localize('contributes.codeActions', "Configure which editor to use for a resource."),
        items: {
            type: 'object',
            required: [CodeActionExtensionPointFields.languages, CodeActionExtensionPointFields.actions],
            properties: {
                [CodeActionExtensionPointFields.languages]: {
                    type: 'array',
                    description: nls.localize('contributes.codeActions.languages', "Language modes that the code actions are enabled for."),
                    items: { type: 'string' }
                },
                [CodeActionExtensionPointFields.actions]: {
                    type: 'object',
                    required: [CodeActionExtensionPointFields.kind, CodeActionExtensionPointFields.title],
                    properties: {
                        [CodeActionExtensionPointFields.kind]: {
                            type: 'string',
                            markdownDescription: nls.localize('contributes.codeActions.kind', "`CodeActionKind` of the contributed code action."),
                        },
                        [CodeActionExtensionPointFields.title]: {
                            type: 'string',
                            description: nls.localize('contributes.codeActions.title', "Label for the code action used in the UI."),
                        },
                        [CodeActionExtensionPointFields.description]: {
                            type: 'string',
                            description: nls.localize('contributes.codeActions.description', "Description of what the code action does."),
                        },
                    }
                }
            }
        }
    });
    exports.codeActionsExtensionPointDescriptor = {
        extensionPoint: 'codeActions',
        deps: [languageService_1.languagesExtPoint],
        jsonSchema: codeActionsExtensionPointSchema
    };
    class CodeActionsTableRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.codeActions;
        }
        render(manifest) {
            const codeActions = manifest.contributes?.codeActions || [];
            if (!codeActions.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const flatActions = codeActions.map(contribution => contribution.actions.map(action => ({ ...action, languages: contribution.languages }))).flat();
            const headers = [
                nls.localize('codeActions.title', "Title"),
                nls.localize('codeActions.kind', "Kind"),
                nls.localize('codeActions.description', "Description"),
                nls.localize('codeActions.languages', "Languages")
            ];
            const rows = flatActions.sort((a, b) => a.title.localeCompare(b.title))
                .map(action => {
                return [
                    action.title,
                    new htmlContent_1.MarkdownString().appendMarkdown(`\`${action.kind}\``),
                    action.description ?? '',
                    new htmlContent_1.MarkdownString().appendMarkdown(`${action.languages.map(lang => `\`${lang}\``).join('&nbsp;')}`),
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'codeActions',
        label: nls.localize('codeactions', "Code Actions"),
        access: {
            canToggle: false,
        },
        renderer: new descriptors_1.SyncDescriptor(CodeActionsTableRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbnNFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVBY3Rpb25zL2NvbW1vbi9jb2RlQWN0aW9uc0V4dGVuc2lvblBvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxJQUFLLDhCQU1KO0lBTkQsV0FBSyw4QkFBOEI7UUFDbEMseURBQXVCLENBQUE7UUFDdkIscURBQW1CLENBQUE7UUFDbkIsK0NBQWEsQ0FBQTtRQUNiLGlEQUFlLENBQUE7UUFDZiw2REFBMkIsQ0FBQTtJQUM1QixDQUFDLEVBTkksOEJBQThCLEtBQTlCLDhCQUE4QixRQU1sQztJQWFELE1BQU0sK0JBQStCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBK0I7UUFDbkYsSUFBSSxFQUFFLE9BQU87UUFDYixtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLCtDQUErQyxDQUFDO1FBQzdHLEtBQUssRUFBRTtZQUNOLElBQUksRUFBRSxRQUFRO1lBQ2QsUUFBUSxFQUFFLENBQUMsOEJBQThCLENBQUMsU0FBUyxFQUFFLDhCQUE4QixDQUFDLE9BQU8sQ0FBQztZQUM1RixVQUFVLEVBQUU7Z0JBQ1gsQ0FBQyw4QkFBOEIsQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDM0MsSUFBSSxFQUFFLE9BQU87b0JBQ2IsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUNBQW1DLEVBQUUsdURBQXVELENBQUM7b0JBQ3ZILEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7aUJBQ3pCO2dCQUNELENBQUMsOEJBQThCLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ3pDLElBQUksRUFBRSxRQUFRO29CQUNkLFFBQVEsRUFBRSxD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