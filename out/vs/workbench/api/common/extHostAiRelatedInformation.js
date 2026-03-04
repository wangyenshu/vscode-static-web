/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes"], function (require, exports, extHost_protocol_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostRelatedInformation = void 0;
    class ExtHostRelatedInformation {
        constructor(mainContext) {
            this._relatedInformationProviders = new Map();
            this._nextHandle = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadAiRelatedInformation);
        }
        async $provideAiRelatedInformation(handle, query, token) {
            if (this._relatedInformationProviders.size === 0) {
                throw new Error('No related information providers registered');
            }
            const provider = this._relatedInformationProviders.get(handle);
            if (!provider) {
                throw new Error('related information provider not found');
            }
            const result = await provider.provideRelatedInformation(query, token) ?? [];
            return result;
        }
        getRelatedInformation(extension, query, types) {
            return this._proxy.$getAiRelatedInformation(query, types);
        }
        registerRelatedInformationProvider(extension, type, provider) {
            const handle = this._nextHandle;
            this._nextHandle++;
            this._relatedInformationProviders.set(handle, provider);
            this._proxy.$registerAiRelatedInformationProvider(handle, type);
            return new extHostTypes_1.Disposable(() => {
                this._proxy.$unregisterAiRelatedInformationProvider(handle);
                this._relatedInformationProviders.delete(handle);
            });
        }
    }
    exports.ExtHostRelatedInformation = ExtHostRelatedInformation;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEFpUmVsYXRlZEluZm9ybWF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEFpUmVsYXRlZEluZm9ybWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLHlCQUF5QjtRQU1yQyxZQUFZLFdBQXlCO1lBTDdCLGlDQUE0QixHQUE0QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2xGLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1lBS3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxNQUFjLEVBQUUsS0FBYSxFQUFFLEtBQXdCO1lBQ3pGLElBQUksSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEQsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7WUFDM0QsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFDLHlCQUF5QixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUUsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQscUJBQXFCLENBQUMsU0FBZ0MsRUFBRSxLQUFhLEVBQUUsS0FBK0I7WUFDckcsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsa0NBQWtDLENBQUMsU0FBZ0MsRUFBRSxJQUE0QixFQUFFLFFBQW9DO1lBQ3RJLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELElBQUksQ0FBQyxNQUFNLENBQUMscUNBQXFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sSUFBSSx5QkFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1Q0FBdUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDNUQsSUFBSSxDQUFDLDRCQUE0QixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQXRDRCw4REFzQ0MifQ==