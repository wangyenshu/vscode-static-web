/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/extensions/common/extensions"], function (require, exports, errors_1, lifecycle_1, extHost_protocol_1, typeConvert, extHostTypes, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostChatVariables = void 0;
    class ExtHostChatVariables {
        static { this._idPool = 0; }
        constructor(mainContext) {
            this._resolver = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadChatVariables);
        }
        async $resolveVariable(handle, requestId, messageText, token) {
            const item = this._resolver.get(handle);
            if (!item) {
                return undefined;
            }
            try {
                if (item.resolver.resolve2) {
                    (0, extensions_1.checkProposedApiEnabled)(item.extension, 'chatParticipantAdditions');
                    const stream = new ChatVariableResolverResponseStream(requestId, this._proxy);
                    const value = await item.resolver.resolve2(item.data.name, { prompt: messageText }, stream.apiObject, token);
                    if (value) {
                        return value.map(typeConvert.ChatVariable.from);
                    }
                }
                else {
                    const value = await item.resolver.resolve(item.data.name, { prompt: messageText }, token);
                    if (value) {
                        return value.map(typeConvert.ChatVariable.from);
                    }
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
            }
            return undefined;
        }
        registerVariableResolver(extension, name, description, resolver) {
            const handle = ExtHostChatVariables._idPool++;
            this._resolver.set(handle, { extension, data: { name, description }, resolver: resolver });
            this._proxy.$registerVariable(handle, { name, description });
            return (0, lifecycle_1.toDisposable)(() => {
                this._resolver.delete(handle);
                this._proxy.$unregisterVariable(handle);
            });
        }
    }
    exports.ExtHostChatVariables = ExtHostChatVariables;
    class ChatVariableResolverResponseStream {
        constructor(_requestId, _proxy) {
            this._requestId = _requestId;
            this._proxy = _proxy;
            this._isClosed = false;
        }
        close() {
            this._isClosed = true;
        }
        get apiObject() {
            if (!this._apiObject) {
                const that = this;
                function throwIfDone(source) {
                    if (that._isClosed) {
                        const err = new Error('Response stream has been closed');
                        Error.captureStackTrace(err, source);
                        throw err;
                    }
                }
                const _report = (progress) => {
                    this._proxy.$handleProgressChunk(this._requestId, progress);
                };
                this._apiObject = {
                    progress(value) {
                        throwIfDone(this.progress);
                        const part = new extHostTypes.ChatResponseProgressPart(value);
                        const dto = typeConvert.ChatResponseProgressPart.from(part);
                        _report(dto);
                        return this;
                    },
                    reference(value) {
                        throwIfDone(this.reference);
                        const part = new extHostTypes.ChatResponseReferencePart(value);
                        const dto = typeConvert.ChatResponseReferencePart.from(part);
                        _report(dto);
                        return this;
                    },
                    push(part) {
                        throwIfDone(this.push);
                        if (part instanceof extHostTypes.ChatResponseReferencePart) {
                            _report(typeConvert.ChatResponseReferencePart.from(part));
                        }
                        else if (part instanceof extHostTypes.ChatResponseProgressPart) {
                            _report(typeConvert.ChatResponseProgressPart.from(part));
                        }
                        return this;
                    }
                };
            }
            return this._apiObject;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENoYXRWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Q2hhdFZhcmlhYmxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSxvQkFBb0I7aUJBRWpCLFlBQU8sR0FBRyxDQUFDLEFBQUosQ0FBSztRQUszQixZQUFZLFdBQXlCO1lBSHBCLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBZ0gsQ0FBQztZQUlwSixJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBYyxFQUFFLFNBQWlCLEVBQUUsV0FBbUIsRUFBRSxLQUF3QjtZQUN0RyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELElBQUksQ0FBQztnQkFDSixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzVCLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO29CQUNwRSxNQUFNLE1BQU0sR0FBRyxJQUFJLGtDQUFrQyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzlFLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDN0csSUFBSSxLQUFLLEVBQUUsQ0FBQzt3QkFDWCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDakQsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDMUYsSUFBSSxLQUFLLEVBQUUsQ0FBQzt3QkFDWCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDakQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2QsSUFBQSxrQ0FBeUIsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELHdCQUF3QixDQUFDLFNBQWdDLEVBQUUsSUFBWSxFQUFFLFdBQW1CLEVBQUUsUUFBcUM7WUFDbEksTUFBTSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUMzRixJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBRTdELE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDOztJQTdDRixvREE4Q0M7SUFFRCxNQUFNLGtDQUFrQztRQUt2QyxZQUNrQixVQUFrQixFQUNsQixNQUFvQztZQURwQyxlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLFdBQU0sR0FBTixNQUFNLENBQThCO1lBTDlDLGNBQVMsR0FBWSxLQUFLLENBQUM7UUFNL0IsQ0FBQztRQUVMLEtBQUs7WUFDSixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN2QixDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO2dCQUVsQixTQUFTLFdBQVcsQ0FBQyxNQUE0QjtvQkFDaEQsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ3BCLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7d0JBQ3pELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBQ3JDLE1BQU0sR0FBRyxDQUFDO29CQUNYLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLFFBQTBDLEVBQUUsRUFBRTtvQkFDOUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDLENBQUM7Z0JBRUYsSUFBSSxDQUFDLFVBQVUsR0FBRztvQkFDakIsUUFBUSxDQUFDLEtBQUs7d0JBQ2IsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxZQUFZLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzlELE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDYixPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELFNBQVMsQ0FBQyxLQUFLO3dCQUNkLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMvRCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUM3RCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2IsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztvQkFDRCxJQUFJLENBQUMsSUFBSTt3QkFDUixXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUV2QixJQUFJLElBQUksWUFBWSxZQUFZLENBQUMseUJBQXlCLEVBQUUsQ0FBQzs0QkFDNUQsT0FBTyxDQUFDLFdBQVcsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDM0QsQ0FBQzs2QkFBTSxJQUFJLElBQUksWUFBWSxZQUFZLENBQUMsd0JBQXdCLEVBQUUsQ0FBQzs0QkFDbEUsT0FBTyxDQUFDLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDMUQsQ0FBQzt3QkFFRCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO2lCQUNELENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7S0FDRCJ9