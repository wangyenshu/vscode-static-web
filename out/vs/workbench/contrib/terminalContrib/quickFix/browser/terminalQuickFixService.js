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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, event_1, lifecycle_1, nls_1, log_1, extensions_1, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalQuickFixService = void 0;
    let TerminalQuickFixService = class TerminalQuickFixService {
        get providers() { return this._providers; }
        constructor(_logService) {
            this._logService = _logService;
            this._selectors = new Map();
            this._providers = new Map();
            this._onDidRegisterProvider = new event_1.Emitter();
            this.onDidRegisterProvider = this._onDidRegisterProvider.event;
            this._onDidRegisterCommandSelector = new event_1.Emitter();
            this.onDidRegisterCommandSelector = this._onDidRegisterCommandSelector.event;
            this._onDidUnregisterProvider = new event_1.Emitter();
            this.onDidUnregisterProvider = this._onDidUnregisterProvider.event;
            this.extensionQuickFixes = new Promise((r) => quickFixExtensionPoint.setHandler(fixes => {
                r(fixes.filter(c => (0, extensions_1.isProposedApiEnabled)(c.description, 'terminalQuickFixProvider')).map(c => {
                    if (!c.value) {
                        return [];
                    }
                    return c.value.map(fix => { return { ...fix, extensionIdentifier: c.description.identifier.value }; });
                }).flat());
            }));
            this.extensionQuickFixes.then(selectors => {
                for (const selector of selectors) {
                    this.registerCommandSelector(selector);
                }
            });
        }
        registerCommandSelector(selector) {
            this._selectors.set(selector.id, selector);
            this._onDidRegisterCommandSelector.fire(selector);
        }
        registerQuickFixProvider(id, provider) {
            // This is more complicated than it looks like it should be because we need to return an
            // IDisposable synchronously but we must await ITerminalContributionService.quickFixes
            // asynchronously before actually registering the provider.
            let disposed = false;
            this.extensionQuickFixes.then(() => {
                if (disposed) {
                    return;
                }
                this._providers.set(id, provider);
                const selector = this._selectors.get(id);
                if (!selector) {
                    this._logService.error(`No registered selector for ID: ${id}`);
                    return;
                }
                this._onDidRegisterProvider.fire({ selector, provider });
            });
            return (0, lifecycle_1.toDisposable)(() => {
                disposed = true;
                this._providers.delete(id);
                const selector = this._selectors.get(id);
                if (selector) {
                    this._selectors.delete(id);
                    this._onDidUnregisterProvider.fire(selector.id);
                }
            });
        }
    };
    exports.TerminalQuickFixService = TerminalQuickFixService;
    exports.TerminalQuickFixService = TerminalQuickFixService = __decorate([
        __param(0, log_1.ILogService)
    ], TerminalQuickFixService);
    const quickFixExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'terminalQuickFixes',
        defaultExtensionKind: ['workspace'],
        activationEventsGenerator: (terminalQuickFixes, result) => {
            for (const quickFixContrib of terminalQuickFixes ?? []) {
                result.push(`onTerminalQuickFixRequest:${quickFixContrib.id}`);
            }
        },
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes', 'Contributes terminal quick fixes.'),
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'commandLineMatcher', 'outputMatcher', 'commandExitResult'],
                defaultSnippets: [{
                        body: {
                            id: '$1',
                            commandLineMatcher: '$2',
                            outputMatcher: '$3',
                            exitStatus: '$4'
                        }
                    }],
                properties: {
                    id: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.id', "The ID of the quick fix provider"),
                        type: 'string',
                    },
                    commandLineMatcher: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.commandLineMatcher', "A regular expression or string to test the command line against"),
                        type: 'string',
                    },
                    outputMatcher: {
                        markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.outputMatcher', "A regular expression or string to match a single line of the output against, which provides groups to be referenced in terminalCommand and uri.\n\nFor example:\n\n `lineMatcher: /git push --set-upstream origin (?<branchName>[^\s]+)/;`\n\n`terminalCommand: 'git push --set-upstream origin ${group:branchName}';`\n"),
                        type: 'object',
                        required: ['lineMatcher', 'anchor', 'offset', 'length'],
                        properties: {
                            lineMatcher: {
                                description: 'A regular expression or string to test the command line against',
                                type: 'string'
                            },
                            anchor: {
                                description: 'Where the search should begin in the buffer',
                                enum: ['top', 'bottom']
                            },
                            offset: {
                                description: 'The number of lines vertically from the anchor in the buffer to start matching against',
                                type: 'number'
                            },
                            length: {
                                description: 'The number of rows to match against, this should be as small as possible for performance reasons',
                                type: 'number'
                            }
                        }
                    },
                    commandExitResult: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.commandExitResult', "The command exit result to match on"),
                        enum: ['success', 'error'],
                        enumDescriptions: [
                            'The command exited with an exit code of zero.',
                            'The command exited with a non-zero exit code.'
                        ]
                    },
                    kind: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.terminalQuickFixes.kind', "The kind of the resulting quick fix. This changes how the quick fix is presented. Defaults to {0}.", '`"fix"`'),
                        enum: ['default', 'explain'],
                        enumDescriptions: [
                            'A high confidence quick fix.',
                            'An explanation of the problem.'
                        ]
                    }
                },
            }
        },
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxRdWlja0ZpeFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvcXVpY2tGaXgvYnJvd3Nlci90ZXJtaW5hbFF1aWNrRml4U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7UUFNbkMsSUFBSSxTQUFTLEtBQTZDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFXbkYsWUFDYyxXQUF5QztZQUF4QixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQWYvQyxlQUFVLEdBQTBDLElBQUksR0FBRyxFQUFFLENBQUM7WUFFOUQsZUFBVSxHQUEyQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBR3RELDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFxQyxDQUFDO1lBQ2xGLDBCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFDbEQsa0NBQTZCLEdBQUcsSUFBSSxlQUFPLEVBQTRCLENBQUM7WUFDaEYsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQztZQUNoRSw2QkFBd0IsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBQ3pELDRCQUF1QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUFPdEUsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZGLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxF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