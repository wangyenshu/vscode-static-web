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
define(["require", "exports", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "./webviewEditorInput", "./webviewWorkbenchService"], function (require, exports, uri_1, extensions_1, webviewEditorInput_1, webviewWorkbenchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditorInputSerializer = void 0;
    exports.reviveWebviewExtensionDescription = reviveWebviewExtensionDescription;
    exports.restoreWebviewOptions = restoreWebviewOptions;
    exports.restoreWebviewContentOptions = restoreWebviewContentOptions;
    let WebviewEditorInputSerializer = class WebviewEditorInputSerializer {
        static { this.ID = webviewEditorInput_1.WebviewInput.typeId; }
        constructor(_webviewWorkbenchService) {
            this._webviewWorkbenchService = _webviewWorkbenchService;
        }
        canSerialize(input) {
            return this._webviewWorkbenchService.shouldPersist(input);
        }
        serialize(input) {
            if (!this.canSerialize(input)) {
                return undefined;
            }
            const data = this.toJson(input);
            try {
                return JSON.stringify(data);
            }
            catch {
                return undefined;
            }
        }
        deserialize(_instantiationService, serializedEditorInput) {
            const data = this.fromJson(JSON.parse(serializedEditorInput));
            return this._webviewWorkbenchService.openRevivedWebview({
                webviewInitInfo: {
                    providedViewType: data.providedId,
                    origin: data.origin,
                    title: data.title,
                    options: data.webviewOptions,
                    contentOptions: data.contentOptions,
                    extension: data.extension,
                },
                viewType: data.viewType,
                title: data.title,
                iconPath: data.iconPath,
                state: data.state,
                group: data.group
            });
        }
        fromJson(data) {
            return {
                ...data,
                extension: reviveWebviewExtensionDescription(data.extensionId, data.extensionLocation),
                iconPath: reviveIconPath(data.iconPath),
                state: reviveState(data.state),
                webviewOptions: restoreWebviewOptions(data.options),
                contentOptions: restoreWebviewContentOptions(data.options),
            };
        }
        toJson(input) {
            return {
                origin: input.webview.origin,
                viewType: input.viewType,
                providedId: input.providedId,
                title: input.getName(),
                options: { ...input.webview.options, ...input.webview.contentOptions },
                extensionLocation: input.extension?.location,
                extensionId: input.extension?.id.value,
                state: input.webview.state,
                iconPath: input.iconPath ? { light: input.iconPath.light, dark: input.iconPath.dark, } : undefined,
                group: input.group
            };
        }
    };
    exports.WebviewEditorInputSerializer = WebviewEditorInputSerializer;
    exports.WebviewEditorInputSerializer = WebviewEditorInputSerializer = __decorate([
        __param(0, webviewWorkbenchService_1.IWebviewWorkbenchService)
    ], WebviewEditorInputSerializer);
    function reviveWebviewExtensionDescription(extensionId, extensionLocation) {
        if (!extensionId) {
            return undefined;
        }
        const location = reviveUri(extensionLocation);
        if (!location) {
            return undefined;
        }
        return {
            id: new extensions_1.ExtensionIdentifier(extensionId),
            location,
        };
    }
    function reviveIconPath(data) {
        if (!data) {
            return undefined;
        }
        const light = reviveUri(data.light);
        const dark = reviveUri(data.dark);
        return light && dark ? { light, dark } : undefined;
    }
    function reviveUri(data) {
        if (!data) {
            return undefined;
        }
        try {
            if (typeof data === 'string') {
                return uri_1.URI.parse(data);
            }
            return uri_1.URI.from(data);
        }
        catch {
            return undefined;
        }
    }
    function reviveState(state) {
        return typeof state === 'string' ? state : undefined;
    }
    function restoreWebviewOptions(options) {
        return options;
    }
    function restoreWebviewContentOptions(options) {
        return {
            ...options,
            localResourceRoots: options.localResourceRoots?.map(uri => reviveUri(uri)),
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0VkaXRvcklucHV0U2VyaWFsaXplci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXdQYW5lbC9icm93c2VyL3dlYnZpZXdFZGl0b3JJbnB1dFNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0hoRyw4RUFpQkM7SUFpQ0Qsc0RBRUM7SUFFRCxvRUFLQztJQXJJTSxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE0QjtpQkFFakIsT0FBRSxHQUFHLGlDQUFZLENBQUMsTUFBTSxBQUF0QixDQUF1QjtRQUVoRCxZQUM0Qyx3QkFBa0Q7WUFBbEQsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtRQUMxRixDQUFDO1FBRUUsWUFBWSxDQUFDLEtBQW1CO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRU0sU0FBUyxDQUFDLEtBQW1CO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQztnQkFDSixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDUixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztRQUVNLFdBQVcsQ0FDakIscUJBQTRDLEVBQzVDLHFCQUE2QjtZQUU3QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMs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