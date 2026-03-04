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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/contrib/chatDynamicVariables", "vs/workbench/contrib/chat/common/chatParserTypes"], function (require, exports, arrays_1, errors_1, iterator_1, lifecycle_1, chat_1, chatDynamicVariables_1, chatParserTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatVariablesService = void 0;
    let ChatVariablesService = class ChatVariablesService {
        constructor(chatWidgetService) {
            this.chatWidgetService = chatWidgetService;
            this._resolver = new Map();
        }
        async resolveVariables(prompt, model, progress, token) {
            let resolvedVariables = [];
            const jobs = [];
            prompt.parts
                .forEach((part, i) => {
                if (part instanceof chatParserTypes_1.ChatRequestVariablePart) {
                    const data = this._resolver.get(part.variableName.toLowerCase());
                    if (data) {
                        const references = [];
                        const variableProgressCallback = (item) => {
                            if (item.kind === 'reference') {
                                references.push(item);
                                return;
                            }
                            progress(item);
                        };
                        jobs.push(data.resolver(prompt.text, part.variableArg, model, variableProgressCallback, token).then(values => {
                            resolvedVariables[i] = { name: part.variableName, range: part.range, values: values ?? [], references };
                        }).catch(errors_1.onUnexpectedExternalError));
                    }
                }
                else if (part instanceof chatParserTypes_1.ChatRequestDynamicVariablePart) {
                    resolvedVariables[i] = { name: part.referenceText, range: part.range, values: part.data };
                }
            });
            await Promise.allSettled(jobs);
            resolvedVariables = (0, arrays_1.coalesce)(resolvedVariables);
            // "reverse", high index first so that replacement is simple
            resolvedVariables.sort((a, b) => b.range.start - a.range.start);
            return {
                variables: resolvedVariables,
            };
        }
        async resolveVariable(variableName, promptText, model, progress, token) {
            const data = this._resolver.get(variableName.toLowerCase());
            if (!data) {
                return Promise.resolve([]);
            }
            return (await data.resolver(promptText, undefined, model, progress, token)) ?? [];
        }
        hasVariable(name) {
            return this._resolver.has(name.toLowerCase());
        }
        getVariable(name) {
            return this._resolver.get(name.toLowerCase())?.data;
        }
        getVariables() {
            const all = iterator_1.Iterable.map(this._resolver.values(), data => data.data);
            return iterator_1.Iterable.filter(all, data => !data.hidden);
        }
        getDynamicVariables(sessionId) {
            // This is slightly wrong... the parser pulls dynamic references from the input widget, but there is no guarantee that message came from the input here.
            // Need to ...
            // - Parser takes list of dynamic references (annoying)
            // - Or the parser is known to implicitly act on the input widget, and we need to call it before calling the chat service (maybe incompatible with the future, but easy)
            const widget = this.chatWidgetService.getWidgetBySessionId(sessionId);
            if (!widget || !widget.viewModel || !widget.supportsFileReferences) {
                return [];
            }
            const model = widget.getContrib(chatDynamicVariables_1.ChatDynamicVariableModel.ID);
            if (!model) {
                return [];
            }
            return model.variables;
        }
        registerVariable(data, resolver) {
            const key = data.name.toLowerCase();
            if (this._resolver.has(key)) {
                throw new Error(`A chat variable with the name '${data.name}' already exists.`);
            }
            this._resolver.set(key, { data, resolver });
            return (0, lifecycle_1.toDisposable)(() => {
                this._resolver.delete(key);
            });
        }
    };
    exports.ChatVariablesService = ChatVariablesService;
    exports.ChatVariablesService = ChatVariablesService = __decorate([
        __param(0, chat_1.IChatWidgetService)
    ], ChatVariablesService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFZhcmlhYmxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jaGF0VmFyaWFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7UUFLaEMsWUFDcUIsaUJBQXNEO1lBQXJDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFIbkUsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFxQixDQUFDO1FBS2pELENBQUM7UUFFRCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBMEIsRUFBRSxLQUFpQixFQUFFLFFBQXVELEVBQUUsS0FBd0I7WUFDdEosSUFBSSxpQkFBaUIsR0FBZ0MsRUFBRSxDQUFDO1lBQ3hELE1BQU0sSUFBSSxHQUFtQixFQUFFLENBQUM7WUFFaEMsTUFBTSxDQUFDLEtBQUs7aUJBQ1YsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNwQixJQUFJLElBQUksWUFBWSx5Q0FBdUIsRUFBRSxDQUFDO29CQUM3QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7b0JBQ2pFLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQ1YsTUFBTSxVQUFVLEdBQTRCLEVBQUUsQ0FBQzt3QkFDL0MsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLElBQW1DLEVBQUUsRUFBRTs0QkFDeEUsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dDQUMvQixVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dDQUN0QixPQUFP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