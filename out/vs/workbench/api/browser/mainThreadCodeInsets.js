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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, dom_1, lifecycle_1, resources_1, uri_1, codeEditorService_1, mainThreadWebviews_1, extHost_protocol_1, webview_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadEditorInsets = void 0;
    // todo@jrieken move these things back into something like contrib/insets
    class EditorWebviewZone {
        // suppressMouseDown?: boolean | undefined;
        // heightInPx?: number | undefined;
        // minWidthInPx?: number | undefined;
        // marginDomNode?: HTMLElement | null | undefined;
        // onDomNodeTop?: ((top: number) => void) | undefined;
        // onComputedHeight?: ((height: number) => void) | undefined;
        constructor(editor, line, height, webview) {
            this.editor = editor;
            this.line = line;
            this.height = height;
            this.webview = webview;
            this.domNode = document.createElement('div');
            this.domNode.style.zIndex = '10'; // without this, the webview is not interactive
            this.afterLineNumber = line;
            this.afterColumn = 1;
            this.heightInLines = height;
            editor.changeViewZones(accessor => this._id = accessor.addZone(this));
            webview.mountTo(this.domNode, (0, dom_1.getWindow)(editor.getDomNode()));
        }
        dispose() {
            this.editor.changeViewZones(accessor => this._id && accessor.removeZone(this._id));
        }
    }
    let MainThreadEditorInsets = class MainThreadEditorInsets {
        constructor(context, _editorService, _webviewService) {
            this._editorService = _editorService;
            this._webviewService = _webviewService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._insets = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostEditorInsets);
        }
        dispose() {
            this._disposables.dispose();
        }
        async $createEditorInset(handle, id, uri, line, height, options, extensionId, extensionLocation) {
            let editor;
            id = id.substr(0, id.indexOf(',')); //todo@jrieken HACK
            for (const candidate of this._editorService.listCodeEditors()) {
                if (candidate.getId() === id && candidate.hasModel() && (0, resources_1.isEqual)(candidate.getModel().uri, uri_1.URI.revive(uri))) {
                    editor = candidate;
                    break;
                }
            }
            if (!editor) {
                setTimeout(() => this._proxy.$onDidDispose(handle));
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const webview = this._webviewService.createWebviewElement({
                title: undefined,
                options: {
                    enableFindWidget: false,
                },
                contentOptions: (0, mainThreadWebviews_1.reviveWebviewContentOptions)(options),
                extension: { id: extensionId, location: uri_1.URI.revive(extensionLocation) }
            });
            const webviewZone = new EditorWebviewZone(editor, line, height, webview);
            const remove = () => {
                disposables.dispose();
                this._proxy.$onDidDispose(handle);
                this._insets.delete(handle);
            };
            disposables.add(editor.onDidChangeModel(remove));
            disposables.add(editor.onDidDispose(remove));
            disposables.add(webviewZone);
            disposables.add(webview);
            disposables.add(webview.onMessage(msg => this._proxy.$onDidReceiveMessage(handle, msg.message)));
            this._insets.set(handle, webviewZone);
        }
        $disposeEditorInset(handle) {
            const inset = this.getInset(handle);
            this._insets.delete(handle);
            inset.dispose();
        }
        $setHtml(handle, value) {
            const inset = this.getInset(handle);
            inset.webview.setHtml(value);
        }
        $setOptions(handle, options) {
            const inset = this.getInset(handle);
            inset.webview.contentOptions = (0, mainThreadWebviews_1.reviveWebviewContentOptions)(options);
        }
        async $postMessage(handle, value) {
            const inset = this.getInset(handle);
            inset.webview.postMessage(value);
            return true;
        }
        getInset(handle) {
            const inset = this._insets.get(handle);
            if (!inset) {
                throw new Error('Unknown inset');
            }
            return inset;
        }
    };
    exports.MainThreadEditorInsets = MainThreadEditorInsets;
    exports.MainThreadEditorInsets = MainThreadEditorInsets = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadEditorInsets),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, webview_1.IWebviewService)
    ], MainThreadEditorInsets);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvZGVJbnNldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZENvZGVJbnNldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLHlFQUF5RTtJQUN6RSxNQUFNLGlCQUFpQjtRQVF0QiwyQ0FBMkM7UUFDM0MsbUNBQW1DO1FBQ25DLHFDQUFxQztRQUNyQyxrREFBa0Q7UUFDbEQsc0RBQXNEO1FBQ3RELDZEQUE2RDtRQUU3RCxZQUNVLE1BQXlCLEVBQ3pCLElBQVksRUFDWixNQUFjLEVBQ2QsT0FBd0I7WUFIeEIsV0FBTSxHQUFOLE1BQU0sQ0FBbUI7WUFDekIsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUNaLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxZQUFPLEdBQVAsT0FBTyxDQUFpQjtZQUVqQyxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLCtDQUErQztZQUNqRixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUM1QixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztZQUU1QixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUEsZUFBUyxFQUFD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