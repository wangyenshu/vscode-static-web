/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/languages", "vs/editor/common/services/semanticTokensDto", "vs/platform/contextkey/common/contextkey", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, arrays_1, network_1, uri_1, languages, semanticTokensDto_1, contextkey_1, extHostCommands_1, typeConverters, types) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostApiCommands = void 0;
    //#region --- NEW world
    const newCommands = [
        // -- document highlights
        new extHostCommands_1.ApiCommand('vscode.executeDocumentHighlights', '_executeDocumentHighlights', 'Execute document highlight provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of DocumentHighlight-instances.', tryMapWith(typeConverters.DocumentHighlight.to))),
        // -- document symbols
        new extHostCommands_1.ApiCommand('vscode.executeDocumentSymbolProvider', '_executeDocumentSymbolProvider', 'Execute document symbol provider.', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of SymbolInformation and DocumentSymbol instances.', (value, apiArgs) => {
            if ((0, arrays_1.isFalsyOrEmpty)(value)) {
                return undefined;
            }
            class MergedInfo extends types.SymbolInformation {
                static to(symbol) {
                    const res = new MergedInfo(symbol.name, typeConverters.SymbolKind.to(symbol.kind), symbol.containerName || '', new types.Location(apiArgs[0], typeConverters.Range.to(symbol.range)));
                    res.detail = symbol.detail;
                    res.range = res.location.range;
                    res.selectionRange = typeConverters.Range.to(symbol.selectionRange);
                    res.children = symbol.children ? symbol.children.map(MergedInfo.to) : [];
                    return res;
                }
            }
            return value.map(MergedInfo.to);
        })),
        // -- formatting
        new extHostCommands_1.ApiCommand('vscode.executeFormatDocumentProvider', '_executeFormatDocumentProvider', 'Execute document format provider.', [extHostCommands_1.ApiCommandArgument.Uri, new extHostCommands_1.ApiCommandArgument('options', 'Formatting options', _ => true, v => v)], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TextEdits.', tryMapWith(typeConverters.TextEdit.to))),
        new extHostCommands_1.ApiCommand('vscode.executeFormatRangeProvider', '_executeFormatRangeProvider', 'Execute range format provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Range, new extHostCommands_1.ApiCommandArgument('options', 'Formatting options', _ => true, v => v)], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TextEdits.', tryMapWith(typeConverters.TextEdit.to))),
        new extHostCommands_1.ApiCommand('vscode.executeFormatOnTypeProvider', '_executeFormatOnTypeProvider', 'Execute format on type provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position, new extHostCommands_1.ApiCommandArgument('ch', 'Trigger character', v => typeof v === 'string', v => v), new extHostCommands_1.ApiCommandArgument('options', 'Formatting options', _ => true, v => v)], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TextEdits.', tryMapWith(typeConverters.TextEdit.to))),
        // -- go to symbol (definition, type definition, declaration, impl, references)
        new extHostCommands_1.ApiCommand('vscode.executeDefinitionProvider', '_executeDefinitionProvider', 'Execute all definition providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location or LocationLink instances.', mapLocationOrLocationLink)),
        new extHostCommands_1.ApiCommand('vscode.executeTypeDefinitionProvider', '_executeTypeDefinitionProvider', 'Execute all type definition providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location or LocationLink instances.', mapLocationOrLocationLink)),
        new extHostCommands_1.ApiCommand('vscode.executeDeclarationProvider', '_executeDeclarationProvider', 'Execute all declaration providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location or LocationLink instances.', mapLocationOrLocationLink)),
        new extHostCommands_1.ApiCommand('vscode.executeImplementationProvider', '_executeImplementationProvider', 'Execute all implementation providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location or LocationLink instances.', mapLocationOrLocationLink)),
        new extHostCommands_1.ApiCommand('vscode.executeReferenceProvider', '_executeReferenceProvider', 'Execute all reference providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Location-instances.', tryMapWith(typeConverters.location.to))),
        // -- hover
        new extHostCommands_1.ApiCommand('vscode.executeHoverProvider', '_executeHoverProvider', 'Execute all hover providers.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Hover-instances.', tryMapWith(typeConverters.Hover.to))),
        // -- selection range
        new extHostCommands_1.ApiCommand('vscode.executeSelectionRangeProvider', '_executeSelectionRangeProvider', 'Execute selection range provider.', [extHostCommands_1.ApiCommandArgument.Uri, new extHostCommands_1.ApiCommandArgument('position', 'A position in a text document', v => Array.isArray(v) && v.every(v => types.Position.isPosition(v)), v => v.map(typeConverters.Position.from))], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of ranges.', result => {
            return result.map(ranges => {
                let node;
                for (const range of ranges.reverse()) {
                    node = new types.SelectionRange(typeConverters.Range.to(range), node);
                }
                return node;
            });
        })),
        // -- symbol search
        new extHostCommands_1.ApiCommand('vscode.executeWorkspaceSymbolProvider', '_executeWorkspaceSymbolProvider', 'Execute all workspace symbol providers.', [extHostCommands_1.ApiCommandArgument.String.with('query', 'Search string')], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of SymbolInformation-instances.', value => {
            return value.map(typeConverters.WorkspaceSymbol.to);
        })),
        // --- call hierarchy
        new extHostCommands_1.ApiCommand('vscode.prepareCallHierarchy', '_executePrepareCallHierarchy', 'Prepare call hierarchy at a position inside a document', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of CallHierarchyItem-instances', v => v.map(typeConverters.CallHierarchyItem.to))),
        new extHostCommands_1.ApiCommand('vscode.provideIncomingCalls', '_executeProvideIncomingCalls', 'Compute incoming calls for an item', [extHostCommands_1.ApiCommandArgument.CallHierarchyItem], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of CallHierarchyIncomingCall-instances', v => v.map(typeConverters.CallHierarchyIncomingCall.to))),
        new extHostCommands_1.ApiCommand('vscode.provideOutgoingCalls', '_executeProvideOutgoingCalls', 'Compute outgoing calls for an item', [extHostCommands_1.ApiCommandArgument.CallHierarchyItem], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of CallHierarchyOutgoingCall-instances', v => v.map(typeConverters.CallHierarchyOutgoingCall.to))),
        // --- rename
        new extHostCommands_1.ApiCommand('vscode.prepareRename', '_executePrepareRename', 'Execute the prepareRename of rename provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to a range and placeholder text.', value => {
            if (!value) {
                return undefined;
            }
            return {
                range: typeConverters.Range.to(value.range),
                placeholder: value.text
            };
        })),
        new extHostCommands_1.ApiCommand('vscode.executeDocumentRenameProvider', '_executeDocumentRenameProvider', 'Execute rename provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position, extHostCommands_1.ApiCommandArgument.String.with('newName', 'The new symbol name')], new extHostCommands_1.ApiCommandResult('A promise that resolves to a WorkspaceEdit.', value => {
            if (!value) {
                return undefined;
            }
            if (value.rejectReason) {
                throw new Error(value.rejectReason);
            }
            return typeConverters.WorkspaceEdit.to(value);
        })),
        // --- links
        new extHostCommands_1.ApiCommand('vscode.executeLinkProvider', '_executeLinkProvider', 'Execute document link provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Number.with('linkResolveCount', 'Number of links that should be resolved, only when links are unresolved.').optional()], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of DocumentLink-instances.', value => value.map(typeConverters.DocumentLink.to))),
        // --- semantic tokens
        new extHostCommands_1.ApiCommand('vscode.provideDocumentSemanticTokensLegend', '_provideDocumentSemanticTokensLegend', 'Provide semantic tokens legend for a document', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to SemanticTokensLegend.', value => {
            if (!value) {
                return undefined;
            }
            return new types.SemanticTokensLegend(value.tokenTypes, value.tokenModifiers);
        })),
        new extHostCommands_1.ApiCommand('vscode.provideDocumentSemanticTokens', '_provideDocumentSemanticTokens', 'Provide semantic tokens for a document', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to SemanticTokens.', value => {
            if (!value) {
                return undefined;
            }
            const semanticTokensDto = (0, semanticTokensDto_1.decodeSemanticTokensDto)(value);
            if (semanticTokensDto.type !== 'full') {
                // only accepting full semantic tokens from provideDocumentSemanticTokens
                return undefined;
            }
            return new types.SemanticTokens(semanticTokensDto.data, undefined);
        })),
        new extHostCommands_1.ApiCommand('vscode.provideDocumentRangeSemanticTokensLegend', '_provideDocumentRangeSemanticTokensLegend', 'Provide semantic tokens legend for a document range', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Range.optional()], new extHostCommands_1.ApiCommandResult('A promise that resolves to SemanticTokensLegend.', value => {
            if (!value) {
                return undefined;
            }
            return new types.SemanticTokensLegend(value.tokenTypes, value.tokenModifiers);
        })),
        new extHostCommands_1.ApiCommand('vscode.provideDocumentRangeSemanticTokens', '_provideDocumentRangeSemanticTokens', 'Provide semantic tokens for a document range', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Range], new extHostCommands_1.ApiCommandResult('A promise that resolves to SemanticTokens.', value => {
            if (!value) {
                return undefined;
            }
            const semanticTokensDto = (0, semanticTokensDto_1.decodeSemanticTokensDto)(value);
            if (semanticTokensDto.type !== 'full') {
                // only accepting full semantic tokens from provideDocumentRangeSemanticTokens
                return undefined;
            }
            return new types.SemanticTokens(semanticTokensDto.data, undefined);
        })),
        // --- completions
        new extHostCommands_1.ApiCommand('vscode.executeCompletionItemProvider', '_executeCompletionItemProvider', 'Execute completion item provider.', [
            extHostCommands_1.ApiCommandArgument.Uri,
            extHostCommands_1.ApiCommandArgument.Position,
            extHostCommands_1.ApiCommandArgument.String.with('triggerCharacter', 'Trigger completion when the user types the character, like `,` or `(`').optional(),
            extHostCommands_1.ApiCommandArgument.Number.with('itemResolveCount', 'Number of completions to resolve (too large numbers slow down completions)').optional()
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to a CompletionList-instance.', (value, _args, converter) => {
            if (!value) {
                return new types.CompletionList([]);
            }
            const items = value.suggestions.map(suggestion => typeConverters.CompletionItem.to(suggestion, converter));
            return new types.CompletionList(items, value.incomplete);
        })),
        // --- signature help
        new extHostCommands_1.ApiCommand('vscode.executeSignatureHelpProvider', '_executeSignatureHelpProvider', 'Execute signature help provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position, extHostCommands_1.ApiCommandArgument.String.with('triggerCharacter', 'Trigger signature help when the user types the character, like `,` or `(`').optional()], new extHostCommands_1.ApiCommandResult('A promise that resolves to SignatureHelp.', value => {
            if (value) {
                return typeConverters.SignatureHelp.to(value);
            }
            return undefined;
        })),
        // --- code lens
        new extHostCommands_1.ApiCommand('vscode.executeCodeLensProvider', '_executeCodeLensProvider', 'Execute code lens provider.', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Number.with('itemResolveCount', 'Number of lenses that should be resolved and returned. Will only return resolved lenses, will impact performance)').optional()], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of CodeLens-instances.', (value, _args, converter) => {
            return tryMapWith(item => {
                return new types.CodeLens(typeConverters.Range.to(item.range), item.command && converter.fromInternal(item.command));
            })(value);
        })),
        // --- code actions
        new extHostCommands_1.ApiCommand('vscode.executeCodeActionProvider', '_executeCodeActionProvider', 'Execute code action provider.', [
            extHostCommands_1.ApiCommandArgument.Uri,
            new extHostCommands_1.ApiCommandArgument('rangeOrSelection', 'Range in a text document. Some refactoring provider requires Selection object.', v => types.Range.isRange(v), v => types.Selection.isSelection(v) ? typeConverters.Selection.from(v) : typeConverters.Range.from(v)),
            extHostCommands_1.ApiCommandArgument.String.with('kind', 'Code action kind to return code actions for').optional(),
            extHostCommands_1.ApiCommandArgument.Number.with('itemResolveCount', 'Number of code actions to resolve (too large numbers slow down code actions)').optional()
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Command-instances.', (value, _args, converter) => {
            return tryMapWith((codeAction) => {
                if (codeAction._isSynthetic) {
                    if (!codeAction.command) {
                        throw new Error('Synthetic code actions must have a command');
                    }
                    return converter.fromInternal(codeAction.command);
                }
                else {
                    const ret = new types.CodeAction(codeAction.title, codeAction.kind ? new types.CodeActionKind(codeAction.kind) : undefined);
                    if (codeAction.edit) {
                        ret.edit = typeConverters.WorkspaceEdit.to(codeAction.edit);
                    }
                    if (codeAction.command) {
                        ret.command = converter.fromInternal(codeAction.command);
                    }
                    ret.isPreferred = codeAction.isPreferred;
                    return ret;
                }
            })(value);
        })),
        // --- colors
        new extHostCommands_1.ApiCommand('vscode.executeDocumentColorProvider', '_executeDocumentColorProvider', 'Execute document color provider.', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of ColorInformation objects.', result => {
            if (result) {
                return result.map(ci => new types.ColorInformation(typeConverters.Range.to(ci.range), typeConverters.Color.to(ci.color)));
            }
            return [];
        })),
        new extHostCommands_1.ApiCommand('vscode.executeColorPresentationProvider', '_executeColorPresentationProvider', 'Execute color presentation provider.', [
            new extHostCommands_1.ApiCommandArgument('color', 'The color to show and insert', v => v instanceof types.Color, typeConverters.Color.from),
            new extHostCommands_1.ApiCommandArgument('context', 'Context object with uri and range', _v => true, v => ({ uri: v.uri, range: typeConverters.Range.from(v.range) })),
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of ColorPresentation objects.', result => {
            if (result) {
                return result.map(typeConverters.ColorPresentation.to);
            }
            return [];
        })),
        // --- inline hints
        new extHostCommands_1.ApiCommand('vscode.executeInlayHintProvider', '_executeInlayHintProvider', 'Execute inlay hints provider', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Range], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of Inlay objects', (result, args, converter) => {
            return result.map(typeConverters.InlayHint.to.bind(undefined, converter));
        })),
        // --- folding
        new extHostCommands_1.ApiCommand('vscode.executeFoldingRangeProvider', '_executeFoldingRangeProvider', 'Execute folding range provider', [extHostCommands_1.ApiCommandArgument.Uri], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of FoldingRange objects', (result, args) => {
            if (result) {
                return result.map(typeConverters.FoldingRange.to);
            }
            return undefined;
        })),
        // --- notebooks
        new extHostCommands_1.ApiCommand('vscode.resolveNotebookContentProviders', '_resolveNotebookContentProvider', 'Resolve Notebook Content Providers', [
        // new ApiCommandArgument<string, string>('viewType', '', v => typeof v === 'string', v => v),
        // new ApiCommandArgument<string, string>('displayName', '', v => typeof v === 'string', v => v),
        // new ApiCommandArgument<object, object>('options', '', v => typeof v === 'object', v => v),
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of NotebookContentProvider static info objects.', tryMapWith(item => {
            return {
                viewType: item.viewType,
                displayName: item.displayName,
                options: {
                    transientOutputs: item.options.transientOutputs,
                    transientCellMetadata: item.options.transientCellMetadata,
                    transientDocumentMetadata: item.options.transientDocumentMetadata
                },
                filenamePattern: item.filenamePattern.map(pattern => typeConverters.NotebookExclusiveDocumentPattern.to(pattern))
            };
        }))),
        // --- debug support
        new extHostCommands_1.ApiCommand('vscode.executeInlineValueProvider', '_executeInlineValueProvider', 'Execute inline value provider', [
            extHostCommands_1.ApiCommandArgument.Uri,
            extHostCommands_1.ApiCommandArgument.Range,
            new extHostCommands_1.ApiCommandArgument('context', 'An InlineValueContext', v => v && typeof v.frameId === 'number' && v.stoppedLocation instanceof types.Range, v => typeConverters.InlineValueContext.from(v))
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of InlineValue objects', result => {
            return result.map(typeConverters.InlineValue.to);
        })),
        // --- open'ish commands
        new extHostCommands_1.ApiCommand('vscode.open', '_workbench.open', 'Opens the provided resource in the editor. Can be a text or binary file, or an http(s) URL. If you need more control over the options for opening a text file, use vscode.window.showTextDocument instead.', [
            new extHostCommands_1.ApiCommandArgument('uriOrString', 'Uri-instance or string (only http/https)', v => uri_1.URI.isUri(v) || (typeof v === 'string' && (0, network_1.matchesSomeScheme)(v, network_1.Schemas.http, network_1.Schemas.https)), v => v),
            new extHostCommands_1.ApiCommandArgument('columnOrOptions', 'Either the column in which to open or editor options, see vscode.TextDocumentShowOptions', v => v === undefined || typeof v === 'number' || typeof v === 'object', v => !v ? v : typeof v === 'number' ? [typeConverters.ViewColumn.from(v), undefined] : [typeConverters.ViewColumn.from(v.viewColumn), typeConverters.TextEditorOpenOptions.from(v)]).optional(),
            extHostCommands_1.ApiCommandArgument.String.with('label', '').optional()
        ], extHostCommands_1.ApiCommandResult.Void),
        new extHostCommands_1.ApiCommand('vscode.openWith', '_workbench.openWith', 'Opens the provided resource with a specific editor.', [
            extHostCommands_1.ApiCommandArgument.Uri.with('resource', 'Resource to open'),
            extHostCommands_1.ApiCommandArgument.String.with('viewId', 'Custom editor view id. This should be the viewType string for custom editors or the notebookType string for notebooks. Use \'default\' to use VS Code\'s default text editor'),
            new extHostCommands_1.ApiCommandArgument('columnOrOptions', 'Either the column in which to open or editor options, see vscode.TextDocumentShowOptions', v => v === undefined || typeof v === 'number' || typeof v === 'object', v => !v ? v : typeof v === 'number' ? [typeConverters.ViewColumn.from(v), undefined] : [typeConverters.ViewColumn.from(v.viewColumn), typeConverters.TextEditorOpenOptions.from(v)]).optional()
        ], extHostCommands_1.ApiCommandResult.Void),
        new extHostCommands_1.ApiCommand('vscode.diff', '_workbench.diff', 'Opens the provided resources in the diff editor to compare their contents.', [
            extHostCommands_1.ApiCommandArgument.Uri.with('left', 'Left-hand side resource of the diff editor'),
            extHostCommands_1.ApiCommandArgument.Uri.with('right', 'Right-hand side resource of the diff editor'),
            extHostCommands_1.ApiCommandArgument.String.with('title', 'Human readable title for the diff editor').optional(),
            new extHostCommands_1.ApiCommandArgument('columnOrOptions', 'Either the column in which to open or editor options, see vscode.TextDocumentShowOptions', v => v === undefined || typeof v === 'object', v => v && [typeConverters.ViewColumn.from(v.viewColumn), typeConverters.TextEditorOpenOptions.from(v)]).optional(),
        ], extHostCommands_1.ApiCommandResult.Void),
        new extHostCommands_1.ApiCommand('vscode.changes', '_workbench.changes', 'Opens a list of resources in the changes editor to compare their contents.', [
            extHostCommands_1.ApiCommandArgument.String.with('title', 'Human readable title for the changes editor'),
            new extHostCommands_1.ApiCommandArgument('resourceList', 'List of resources to compare', resources => {
                for (const resource of resources) {
                    if (resource.length !== 3) {
                        return false;
                    }
                    const [label, left, right] = resource;
                    if (!uri_1.URI.isUri(label) ||
                        (!uri_1.URI.isUri(left) && left !== undefined && left !== null) ||
                        (!uri_1.URI.isUri(right) && right !== undefined && right !== null)) {
                        return false;
                    }
                }
                return true;
            }, v => v)
        ], extHostCommands_1.ApiCommandResult.Void),
        // --- type hierarchy
        new extHostCommands_1.ApiCommand('vscode.prepareTypeHierarchy', '_executePrepareTypeHierarchy', 'Prepare type hierarchy at a position inside a document', [extHostCommands_1.ApiCommandArgument.Uri, extHostCommands_1.ApiCommandArgument.Position], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TypeHierarchyItem-instances', v => v.map(typeConverters.TypeHierarchyItem.to))),
        new extHostCommands_1.ApiCommand('vscode.provideSupertypes', '_executeProvideSupertypes', 'Compute supertypes for an item', [extHostCommands_1.ApiCommandArgument.TypeHierarchyItem], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TypeHierarchyItem-instances', v => v.map(typeConverters.TypeHierarchyItem.to))),
        new extHostCommands_1.ApiCommand('vscode.provideSubtypes', '_executeProvideSubtypes', 'Compute subtypes for an item', [extHostCommands_1.ApiCommandArgument.TypeHierarchyItem], new extHostCommands_1.ApiCommandResult('A promise that resolves to an array of TypeHierarchyItem-instances', v => v.map(typeConverters.TypeHierarchyItem.to))),
        // --- testing
        new extHostCommands_1.ApiCommand('vscode.revealTestInExplorer', '_revealTestInExplorer', 'Reveals a test instance in the explorer', [extHostCommands_1.ApiCommandArgument.TestItem], extHostCommands_1.ApiCommandResult.Void),
        // --- continue edit session
        new extHostCommands_1.ApiCommand('vscode.experimental.editSession.continue', '_workbench.editSessions.actions.continueEditSession', 'Continue the current edit session in a different workspace', [extHostCommands_1.ApiCommandArgument.Uri.with('workspaceUri', 'The target workspace to continue the current edit session in')], extHostCommands_1.ApiCommandResult.Void),
        // --- context keys
        new extHostCommands_1.ApiCommand('setContext', '_setContext', 'Set a custom context key value that can be used in when clauses.', [
            extHostCommands_1.ApiCommandArgument.String.with('name', 'The context key name'),
            new extHostCommands_1.ApiCommandArgument('value', 'The context key value', () => true, v => v),
        ], extHostCommands_1.ApiCommandResult.Void),
        // --- mapped edits
        new extHostCommands_1.ApiCommand('vscode.executeMappedEditsProvider', '_executeMappedEditsProvider', 'Execute Mapped Edits Provider', [
            extHostCommands_1.ApiCommandArgument.Uri,
            extHostCommands_1.ApiCommandArgument.StringArray,
            new extHostCommands_1.ApiCommandArgument('MappedEditsContext', 'Mapped Edits Context', (v) => typeConverters.MappedEditsContext.is(v), (v) => typeConverters.MappedEditsContext.from(v))
        ], new extHostCommands_1.ApiCommandResult('A promise that resolves to a workspace edit or null', (value) => {
            return value ? typeConverters.WorkspaceEdit.to(value) : null;
        })),
    ];
    //#endregion
    //#region OLD world
    class ExtHostApiCommands {
        static register(commands) {
            newCommands.forEach(commands.registerApiCommand, commands);
            this._registerValidateWhenClausesCommand(commands);
        }
        static _registerValidateWhenClausesCommand(commands) {
            commands.registerCommand(false, '_validateWhenClauses', contextkey_1.validateWhenClauses);
        }
    }
    exports.ExtHostApiCommands = ExtHostApiCommands;
    function tryMapWith(f) {
        return (value) => {
            if (Array.isArray(value)) {
                return value.map(f);
            }
            return undefined;
        };
    }
    function mapLocationOrLocationLink(values) {
        if (!Array.isArray(values)) {
            return undefined;
        }
        const result = [];
        for (const item of values) {
            if (languages.isLocationLink(item)) {
                result.push(typeConverters.DefinitionLink.to(item));
            }
            else {
                result.push(typeConverters.location.to(item));
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEFwaUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEFwaUNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFCaEcsdUJBQXVCO0lBRXZCLE1BQU0sV0FBVyxHQUFpQjtRQUNqQyx5QkFBeUI7UUFDekIsSUFBSSw0QkFBVSxDQUNiLGtDQUFrQyxFQUFFLDRCQUE0QixFQUFFLHNDQUFzQyxFQUN4RyxDQUFDLG9DQUFrQixDQUFDLEdBQUcsRUFBRSxvQ0FBa0IsQ0FBQyxRQUFRLENBQUMsRUFDckQsSUFBSSxrQ0FBZ0IsQ0FBdUUscUVBQXFFLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUNsTjtRQUNELHNCQUFzQjtRQUN0QixJQUFJLDRCQUFVLENBQ2Isc0NBQXNDLEVBQUUsZ0NBQWdDLEVBQUUsbUNBQW1DLEVBQzdHLENBQUMsb0NBQWtCLENBQUMsR0FBRyxDQUFDLEVBQ3hCLElBQUksa0NBQWdCLENBQXFFLHdGQUF3RixFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBRXJNLElBQUksSUFBQSx1QkFBYyxFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxNQUFNLFVBQVcsU0FBUSxLQUFLLENBQUMsaUJBQWlCO2dCQUMvQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQWdDO29CQUN6QyxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FDekIsTUFBTSxDQUFDLElBQUksRUFDWCxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQ3pDLE1BQU0s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