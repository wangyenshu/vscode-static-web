/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/webview/common/webview"], function (require, exports, event_1, lifecycle_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostEditorInsets = void 0;
    class ExtHostEditorInsets {
        constructor(_proxy, _editors, _remoteInfo) {
            this._proxy = _proxy;
            this._editors = _editors;
            this._remoteInfo = _remoteInfo;
            this._handlePool = 0;
            this._disposables = new lifecycle_1.DisposableStore();
            this._insets = new Map();
            // dispose editor inset whenever the hosting editor goes away
            this._disposables.add(_editors.onDidChangeVisibleTextEditors(() => {
                const visibleEditor = _editors.getVisibleTextEditors();
                for (const value of this._insets.values()) {
                    if (visibleEditor.indexOf(value.editor) < 0) {
                        value.inset.dispose(); // will remove from `this._insets`
                    }
                }
            }));
        }
        dispose() {
            this._insets.forEach(value => value.inset.dispose());
            this._disposables.dispose();
        }
        createWebviewEditorInset(editor, line, height, options, extension) {
            let apiEditor;
            for (const candidate of this._editors.getVisibleTextEditors(true)) {
                if (candidate.value === editor) {
                    apiEditor = candidate;
                    break;
                }
            }
            if (!apiEditor) {
                throw new Error('not a visible editor');
            }
            const that = this;
            const handle = this._handlePool++;
            const onDidReceiveMessage = new event_1.Emitter();
            const onDidDispose = new event_1.Emitter();
            const webview = new class {
                constructor() {
                    this._html = '';
                    this._options = Object.create(null);
                }
                asWebviewUri(resource) {
                    return (0, webview_1.asWebviewUri)(resource, that._remoteInfo);
                }
                get cspSource() {
                    return webview_1.webviewGenericCspSource;
                }
                set options(value) {
                    this._options = value;
                    that._proxy.$setOptions(handle, value);
                }
                get options() {
                    return this._options;
                }
                set html(value) {
                    this._html = value;
                    that._proxy.$setHtml(handle, value);
                }
                get html() {
                    return this._html;
                }
                get onDidReceiveMessage() {
                    return onDidReceiveMessage.event;
                }
                postMessage(message) {
                    return that._proxy.$postMessage(handle, message);
                }
            };
            const inset = new class {
                constructor() {
                    this.editor = editor;
                    this.line = line;
                    this.height = height;
                    this.webview = webview;
                    this.onDidDispose = onDidDispose.event;
                }
                dispose() {
                    if (that._insets.has(handle)) {
                        that._insets.delete(handle);
                        that._proxy.$disposeEditorInset(handle);
                        onDidDispose.fire();
                        // final cleanup
                        onDidDispose.dispose();
                        onDidReceiveMessage.dispose();
                    }
                }
            };
            this._proxy.$createEditorInset(handle, apiEditor.id, apiEditor.value.document.uri, line + 1, height, options || {}, extension.identifier, extension.extensionLocation);
            this._insets.set(handle, { editor, inset, onDidReceiveMessage });
            return inset;
        }
        $onDidDispose(handle) {
            const value = this._insets.get(handle);
            if (value) {
                value.inset.dispose();
            }
        }
        $onDidReceiveMessage(handle, message) {
            const value = this._insets.get(handle);
            value?.onDidReceiveMessage.fire(message);
        }
    }
    exports.ExtHostEditorInsets = ExtHostEditorInsets;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvZGVJbnNldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Q29kZUluc2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxtQkFBbUI7UUFNL0IsWUFDa0IsTUFBbUMsRUFDbkMsUUFBd0IsRUFDeEIsV0FBOEI7WUFGOUIsV0FBTSxHQUFOLE1BQU0sQ0FBNkI7WUFDbkMsYUFBUSxHQUFSLFFBQVEsQ0FBZ0I7WUFDeEIsZ0JBQVcsR0FBWCxXQUFXLENBQW1CO1lBUHhDLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ1AsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUM5QyxZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQThHLENBQUM7WUFRdkksNkRBQTZEO1lBQzdELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUN2RCxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztvQkFDM0MsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDN0MsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLGtDQUFrQztvQkFDMUQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVB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