/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatCodeBlockContextProviderService = void 0;
    class ChatCodeBlockContextProviderService {
        constructor() {
            this._providers = new Map();
        }
        get providers() {
            return [...this._providers.values()];
        }
        registerProvider(provider, id) {
            this._providers.set(id, provider);
            return (0, lifecycle_1.toDisposable)(() => this._providers.delete(id));
        }
    }
    exports.ChatCodeBlockContextProviderService = ChatCodeBlockContextProviderService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUJsb2NrQ29udGV4dFByb3ZpZGVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jb2RlQmxvY2tDb250ZXh0UHJvdmlkZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLG1DQUFtQztRQUFoRDtZQUVrQixlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQTJDLENBQUM7UUFTbEYsQ0FBQztRQVBBLElBQUksU0FBUztZQUNaLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsZ0JBQWdCLENBQUMsUUFBeUMsRUFBRSxFQUFVO1lBQ3JFLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNsQyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7S0FDRDtJQVhELGtGQVdDIn0=