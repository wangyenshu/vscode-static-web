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
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/lazy", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/common/types", "vs/platform/keybinding/common/keybinding"], function (require, exports, hierarchicalKind_1, lazy_1, codeAction_1, types_1, keybinding_1) {
    "use strict";
    var CodeActionKeybindingResolver_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionKeybindingResolver = void 0;
    let CodeActionKeybindingResolver = class CodeActionKeybindingResolver {
        static { CodeActionKeybindingResolver_1 = this; }
        static { this.codeActionCommands = [
            codeAction_1.refactorCommandId,
            codeAction_1.codeActionCommandId,
            codeAction_1.sourceActionCommandId,
            codeAction_1.organizeImportsCommandId,
            codeAction_1.fixAllCommandId
        ]; }
        constructor(keybindingService) {
            this.keybindingService = keybindingService;
        }
        getResolver() {
            // Lazy since we may not actually ever read the value
            const allCodeActionBindings = new lazy_1.Lazy(() => this.keybindingService.getKeybindings()
                .filter(item => CodeActionKeybindingResolver_1.codeActionCommands.indexOf(item.command) >= 0)
                .filter(item => item.resolvedKeybinding)
                .map((item) => {
                // Special case these commands since they come built-in with VS Code and don't use 'commandArgs'
                let commandArgs = item.commandArgs;
                if (item.command === codeAction_1.organizeImportsCommandId) {
                    commandArgs = { kind: types_1.CodeActionKind.SourceOrganizeImports.value };
                }
                else if (item.command === codeAction_1.fixAllCommandId) {
                    commandArgs = { kind: types_1.CodeActionKind.SourceFixAll.value };
                }
                return {
                    resolvedKeybinding: item.resolvedKeybinding,
                    ...types_1.CodeActionCommandArgs.fromUser(commandArgs, {
                        kind: hierarchicalKind_1.HierarchicalKind.None,
                        apply: "never" /* CodeActionAutoApply.Never */
                    })
                };
            }));
            return (action) => {
                if (action.kind) {
                    const binding = this.bestKeybindingForCodeAction(action, allCodeActionBindings.value);
                    return binding?.resolvedKeybinding;
                }
                return undefined;
            };
        }
        bestKeybindingForCodeAction(action, candidates) {
            if (!action.kind) {
                return undefined;
            }
            const kind = new hierarchicalKind_1.HierarchicalKind(action.kind);
            return candidates
                .filter(candidate => candidate.kind.contains(kind))
                .filter(candidate => {
                if (candidate.preferred) {
                    // If the candidate keybinding only applies to preferred actions, the this action must also be preferred
                    return action.isPreferred;
                }
                return true;
            })
                .reduceRight((currentBest, candidate) => {
                if (!currentBest) {
                    return candidate;
                }
                // Select the more specific binding
                return currentBest.kind.contains(candidate.kind) ? candidate : currentBest;
            }, undefined);
        }
    };
    exports.CodeActionKeybindingResolver = CodeActionKeybindingResolver;
    exports.CodeActionKeybindingResolver = CodeActionKeybindingResolver = CodeActionKeybindingResolver_1 = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], CodeActionKeybindingResolver);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbktleWJpbmRpbmdSZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvZGVBY3Rpb24vYnJvd3Nlci9jb2RlQWN0aW9uS2V5YmluZGluZ1Jlc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTRCOztpQkFDaEIsdUJBQWtCLEdBQXNCO1lBQy9ELDhCQUFpQjtZQUNqQixnQ0FBbUI7WUFDbkIsa0NBQXFCO1lBQ3JCLHFDQUF3QjtZQUN4Qiw0QkFBZTtTQUNmLEFBTnlDLENBTXhDO1FBRUYsWUFDc0MsaUJBQXFDO1lBQXJDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7UUFDdkUsQ0FBQztRQUVFLFdBQVc7WUFDakIscURBQXFEO1lBQ3JELE1BQU0scUJBQXFCLEdBQUcsSUFBSSxXQUFJLENBQXlDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUU7aUJBQzFILE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLDhCQUE0QixDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUMzRixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUM7aUJBQ3ZDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBK0IsRUFBRTtnQkFDMUMsZ0dBQWdHO2dCQUNoRyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUNuQyxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUsscUNBQXdCLEVBQUUsQ0FBQztvQkFDL0MsV0FBVyxHQUFHLEVBQUUsSUFBSSxFQUFFLHNCQUFjLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3BFLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLDRCQUFlLEVBQUUsQ0FBQztvQkFDN0MsV0FBVyxHQUFHLEVBQUUsSUFBSSxFQUFFLHNCQUFjLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMzRCxDQUFDO2dCQUVELE9BQU87b0JBQ04sa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFtQjtvQkFDNUMsR0FBRyw2QkFBcUIsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO3dCQUM5QyxJQUFJLEVBQUUsbUNBQWdCLENBQUMsSUFBSTt3QkFDM0IsS0FBSyx5Q0FBMkI7cUJBQ2hDLENBQUM7aUJBQ0YsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFTCxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2pCLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNqQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsTUFBTSxFQUFFLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN0RixPQUFPLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQztnQkFDcEMsQ0FBQztnQkFDRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDLENBQUM7UUFDSCxDQUFDO1FBRU8sMkJBQTJCLENBQ2xDLE1BQWtCLEVBQ2xCLFVBQWtEO1lBRWxELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLG1DQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUvQyxPQUFPLFVBQVU7aUJBQ2YsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ2xELE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDbkIsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3pCLHdHQUF3RztvQkFDeEcsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDO2dCQUMzQixDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDO2lCQUNELFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNsQixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxtQ0FBbUM7Z0JBQ25DLE9BQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUM1RSxDQUFDLEVBQUUsU0FBb0QsQ0FBQyxDQUFDO1FBQzNELENBQUM7O0lBdEVXLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBVXRDLFdBQUEsK0JBQWtCLENBQUE7T0FWUiw0QkFBNEIsQ0F1RXhDIn0=