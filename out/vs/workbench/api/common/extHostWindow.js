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
define(["require", "exports", "vs/base/common/event", "vs/base/common/network", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "./extHost.protocol"], function (require, exports, event_1, network_1, strings_1, uri_1, instantiation_1, extHostRpcService_1, extHost_protocol_1) {
    "use strict";
    var ExtHostWindow_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostWindow = exports.ExtHostWindow = void 0;
    let ExtHostWindow = class ExtHostWindow {
        static { ExtHostWindow_1 = this; }
        static { this.InitialState = {
            focused: true,
            active: true,
        }; }
        getState() {
            // todo@connor4312: this can be changed to just return this._state after proposed api is finalized
            const state = this._state;
            return {
                get focused() {
                    return state.focused;
                },
                get active() {
                    return state.active;
                },
            };
        }
        constructor(extHostRpc) {
            this._onDidChangeWindowState = new event_1.Emitter();
            this.onDidChangeWindowState = this._onDidChangeWindowState.event;
            this._state = ExtHostWindow_1.InitialState;
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadWindow);
            this._proxy.$getInitialState().then(({ isFocused, isActive }) => {
                this.onDidChangeWindowProperty('focused', isFocused);
                this.onDidChangeWindowProperty('active', isActive);
            });
        }
        $onDidChangeWindowFocus(value) {
            this.onDidChangeWindowProperty('focused', value);
        }
        $onDidChangeWindowActive(value) {
            this.onDidChangeWindowProperty('active', value);
        }
        onDidChangeWindowProperty(property, value) {
            if (value === this._state[property]) {
                return;
            }
            this._state = { ...this._state, [property]: value };
            this._onDidChangeWindowState.fire(this._state);
        }
        openUri(stringOrUri, options) {
            let uriAsString;
            if (typeof stringOrUri === 'string') {
                uriAsString = stringOrUri;
                try {
                    stringOrUri = uri_1.URI.parse(stringOrUri);
                }
                catch (e) {
                    return Promise.reject(`Invalid uri - '${stringOrUri}'`);
                }
            }
            if ((0, strings_1.isFalsyOrWhitespace)(stringOrUri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            else if (stringOrUri.scheme === network_1.Schemas.command) {
                return Promise.reject(`Invalid scheme '${stringOrUri.scheme}'`);
            }
            return this._proxy.$openUri(stringOrUri, uriAsString, options);
        }
        async asExternalUri(uri, options) {
            if ((0, strings_1.isFalsyOrWhitespace)(uri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            const result = await this._proxy.$asExternalUri(uri, options);
            return uri_1.URI.from(result);
        }
    };
    exports.ExtHostWindow = ExtHostWindow;
    exports.ExtHostWindow = ExtHostWindow = ExtHostWindow_1 = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostWindow);
    exports.IExtHostWindow = (0, instantiation_1.createDecorator)('IExtHostWindow');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdpbmRvdy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RXaW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFhOztpQkFFVixpQkFBWSxHQUFnQjtZQUMxQyxPQUFPLEVBQUUsSUFBSTtZQUNiLE1BQU0sRUFBRSxJQUFJO1NBQ1osQUFIMEIsQ0FHekI7UUFTRixRQUFRO1lBQ1Asa0dBQWtHO1lBQ2xHLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFMUIsT0FBTztnQkFDTixJQUFJLE9BQU87b0JBQ1YsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDO2dCQUN0QixDQUFDO2dCQUNELElBQUksTUFBTTtvQkFDVCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUM7Z0JBQ3JCLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELFlBQWdDLFVBQThCO1lBbkI3Qyw0QkFBdUIsR0FBRyxJQUFJLGVBQU8sRUFBZSxDQUFDO1lBQzdELDJCQUFzQixHQUF1QixJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBRWpGLFdBQU0sR0FBRyxlQUFhLENBQUMsWUFBWSxDQUFDO1lBaUIzQyxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFO2dCQUMvRCxJQUFJLENBQUMseUJBQXlCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FB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