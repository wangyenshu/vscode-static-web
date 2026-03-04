/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostNotebookEditor"], function (require, exports, event_1, extHost_protocol_1, extHostNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookRenderers = void 0;
    class ExtHostNotebookRenderers {
        constructor(mainContext, _extHostNotebook) {
            this._extHostNotebook = _extHostNotebook;
            this._rendererMessageEmitters = new Map();
            this.proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookRenderers);
        }
        $postRendererMessage(editorId, rendererId, message) {
            const editor = this._extHostNotebook.getEditorById(editorId);
            this._rendererMessageEmitters.get(rendererId)?.fire({ editor: editor.apiEditor, message });
        }
        createRendererMessaging(manifest, rendererId) {
            if (!manifest.contributes?.notebookRenderer?.some(r => r.id === rendererId)) {
                throw new Error(`Extensions may only call createRendererMessaging() for renderers they contribute (got ${rendererId})`);
            }
            const messaging = {
                onDidReceiveMessage: (listener, thisArg, disposables) => {
                    return this.getOrCreateEmitterFor(rendererId).event(listener, thisArg, disposables);
                },
                postMessage: (message, editorOrAlias) => {
                    if (extHostNotebookEditor_1.ExtHostNotebookEditor.apiEditorsToExtHost.has(message)) { // back compat for swapped args
                        [message, editorOrAlias] = [editorOrAlias, message];
                    }
                    const extHostEditor = editorOrAlias && extHostNotebookEditor_1.ExtHostNotebookEditor.apiEditorsToExtHost.get(editorOrAlias);
                    return this.proxy.$postMessage(extHostEditor?.id, rendererId, message);
                },
            };
            return messaging;
        }
        getOrCreateEmitterFor(rendererId) {
            let emitter = this._rendererMessageEmitters.get(rendererId);
            if (emitter) {
                return emitter;
            }
            emitter = new event_1.Emitter({
                onDidRemoveLastListener: () => {
                    emitter?.dispose();
                    this._rendererMessageEmitters.delete(rendererId);
                }
            });
            this._rendererMessageEmitters.set(rendererId, emitter);
            return emitter;
        }
    }
    exports.ExtHostNotebookRenderers = ExtHostNotebookRenderers;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rUmVuZGVyZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdE5vdGVib29rUmVuZGVyZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLHdCQUF3QjtRQUlwQyxZQUFZLFdBQXlCLEVBQW1CLGdCQUEyQztZQUEzQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQTJCO1lBSGxGLDZCQUF3QixHQUFHLElBQUksR0FBRyxFQUFxRixDQUFDO1lBSXhJLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUVNLG9CQUFvQixDQUFDLFFBQWdCLEVBQUUsVUFBa0IsRUFBRSxPQUFnQjtZQUNqRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM1RixDQUFDO1FBRU0sdUJBQXVCLENBQUMsUUFBK0IsRUFBRSxVQUFrQjtZQUNqRixJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzdFLE1BQU0sSUFBSSxLQUFLLENBQUMseUZBQXlGLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDekgsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFxQztnQkFDbkQsbUJBQW1CLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxFQUFFO29CQUN2RCxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDckYsQ0FBQztnQkFDRCxXQUFXLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLEVBQUU7b0JBQ3ZDLElBQUksNkNBQXFCLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQywrQkFBK0I7d0JBQzVGLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUNyRCxDQUFDO29CQUVELE1BQU0sYUFBYSxHQUFHLGFBQWEsSUFBSSw2Q0FBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQ3BHLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3hFLENBQUM7YUFDRCxDQUFDO1lBRUYsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLHFCQUFxQixDQUFDLFVBQWtCO1lBQy9DLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDNUQsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDO1lBRUQsT0FBTyxHQUFHLElBQUksZUFBTyxDQUFDO2dCQUNyQix1QkFBdUIsRUFBRSxHQUFHLEVBQUU7b0JBQzdCLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbEQsQ0FBQzthQUNELENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRXZELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7S0FDRDtJQXBERCw0REFvREMifQ==