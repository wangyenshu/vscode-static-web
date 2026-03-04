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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/resources", "vs/base/common/uuid", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/common/memento"], function (require, exports, arrays_1, resources_1, uuid_1, contextkey_1, instantiation_1, storage_1, memento_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionKeyedWebviewOriginStore = exports.WebviewOriginStore = exports.WebviewContentPurpose = exports.IWebviewService = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = void 0;
    exports.areWebviewContentOptionsEqual = areWebviewContentOptionsEqual;
    /**
     * Set when the find widget in a webview in a webview is visible.
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('webviewFindWidgetVisible', false);
    /**
     * Set when the find widget in a webview is focused.
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('webviewFindWidgetFocused', false);
    /**
     * Set when the find widget in a webview is enabled in a webview
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED = new contextkey_1.RawContextKey('webviewFindWidgetEnabled', false);
    exports.IWebviewService = (0, instantiation_1.createDecorator)('webviewService');
    var WebviewContentPurpose;
    (function (WebviewContentPurpose) {
        WebviewContentPurpose["NotebookRenderer"] = "notebookRenderer";
        WebviewContentPurpose["CustomEditor"] = "customEditor";
        WebviewContentPurpose["WebviewView"] = "webviewView";
    })(WebviewContentPurpose || (exports.WebviewContentPurpose = WebviewContentPurpose = {}));
    /**
     * Check if two {@link WebviewContentOptions} are equal.
     */
    function areWebviewContentOptionsEqual(a, b) {
        return (a.allowMultipleAPIAcquire === b.allowMultipleAPIAcquire
            && a.allowScripts === b.allowScripts
            && a.allowForms === b.allowForms
            && (0, arrays_1.equals)(a.localResourceRoots, b.localResourceRoots, resources_1.isEqual)
            && (0, arrays_1.equals)(a.portMapping, b.portMapping, (a, b) => a.extensionHostPort === b.extensionHostPort && a.webviewPort === b.webviewPort)
            && areEnableCommandUrisEqual(a, b));
    }
    function areEnableCommandUrisEqual(a, b) {
        if (a.enableCommandUris === b.enableCommandUris) {
            return true;
        }
        if (Array.isArray(a.enableCommandUris) && Array.isArray(b.enableCommandUris)) {
            return (0, arrays_1.equals)(a.enableCommandUris, b.enableCommandUris);
        }
        return false;
    }
    /**
     * Stores the unique origins for a webview.
     *
     * These are randomly generated
     */
    let WebviewOriginStore = class WebviewOriginStore {
        constructor(rootStorageKey, storageService) {
            this._memento = new memento_1.Memento(rootStorageKey, storageService);
            this._state = this._memento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        getOrigin(viewType, additionalKey) {
            const key = this._getKey(viewType, additionalKey);
            const existing = this._state[key];
            if (existing && typeof existing === 'string') {
                return existing;
            }
            const newOrigin = (0, uuid_1.generateUuid)();
            this._state[key] = newOrigin;
            this._memento.saveMemento();
            return newOrigin;
        }
        _getKey(viewType, additionalKey) {
            return JSON.stringify({ viewType, key: additionalKey });
        }
    };
    exports.WebviewOriginStore = WebviewOriginStore;
    exports.WebviewOriginStore = WebviewOriginStore = __decorate([
        __param(1, storage_1.IStorageService)
    ], WebviewOriginStore);
    /**
     * Stores the unique origins for a webview.
     *
     * These are randomly generated, but keyed on extension and webview viewType.
     */
    let ExtensionKeyedWebviewOriginStore = class ExtensionKeyedWebviewOriginStore {
        constructor(rootStorageKey, storageService) {
            this._store = new WebviewOriginStore(rootStorageKey, storageService);
        }
        getOrigin(viewType, extId) {
            return this._store.getOrigin(viewType, extId.value);
        }
    };
    exports.ExtensionKeyedWebviewOriginStore = ExtensionKeyedWebviewOriginStore;
    exports.ExtensionKeyedWebviewOriginStore = ExtensionKeyedWebviewOriginStore = __decorate([
        __param(1, storage_1.IStorageService)
    ], ExtensionKeyedWebviewOriginStore);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvYnJvd3Nlci93ZWJ2aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThJaEcsc0VBU0M7SUFySUQ7O09BRUc7SUFDVSxRQUFBLDhDQUE4QyxHQUFHLElBQUksMEJBQWEsQ0FBVSwwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUU1SDs7T0FFRztJQUNVLFFBQUEsOENBQThDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTVIOztPQUVHO0lBQ1UsUUFBQSw4Q0FBOEMsR0FBRyxJQUFJLDBCQUFhLENBQVUsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFL0csUUFBQSxlQUFlLEdBQUcsSUFBQSwrQkFBZSxFQUFrQixnQkFBZ0IsQ0FBQyxDQUFDO0lBOENsRixJQUFrQixxQkFJakI7SUFKRCxXQUFrQixxQkFBcUI7UUFDdEMsOERBQXFDLENBQUE7UUFDckMsc0RBQTZCLENBQUE7UUFDN0Isb0RBQTJCLENBQUE7SUFDNUIsQ0FBQyxFQUppQixxQkFBcUIscUNBQXJCLHFCQUFxQixRQUl0QztJQXdERDs7T0FFRztJQUNILFNBQWdCLDZCQUE2QixDQUFDLENBQXdCLEVBQUUsQ0FBd0I7UUFDL0YsT0FBTyxDQUNOLENBQUMsQ0FBQyx1QkFBdUIsS0FBSyxDQUFDLENBQUMsdUJBQXVCO2VBQ3BELENBQUMsQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDLFlBQVk7ZUFDakMsQ0FBQyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsVUFBVTtlQUM3QixJQUFBLGVBQU0sRUFBQyxDQUFDLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLGtC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