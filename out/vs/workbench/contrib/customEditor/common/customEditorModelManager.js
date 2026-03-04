/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/functional"], function (require, exports, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorModelManager = void 0;
    class CustomEditorModelManager {
        constructor() {
            this._references = new Map();
        }
        async getAllModels(resource) {
            const keyStart = `${resource.toString()}@@@`;
            const models = [];
            for (const [key, entry] of this._references) {
                if (key.startsWith(keyStart) && entry.model) {
                    models.push(await entry.model);
                }
            }
            return models;
        }
        async get(resource, viewType) {
            const key = this.key(resource, viewType);
            const entry = this._references.get(key);
            return entry?.model;
        }
        tryRetain(resource, viewType) {
            const key = this.key(resource, viewType);
            const entry = this._references.get(key);
            if (!entry) {
                return undefined;
            }
            entry.counter++;
            return entry.model.then(model => {
                return {
                    object: model,
                    dispose: (0, functional_1.createSingleCallFunction)(() => {
                        if (--entry.counter <= 0) {
                            entry.model.then(x => x.dispose());
                            this._references.delete(key);
                        }
                    }),
                };
            });
        }
        add(resource, viewType, model) {
            const key = this.key(resource, viewType);
            const existing = this._references.get(key);
            if (existing) {
                throw new Error('Model already exists');
            }
            this._references.set(key, { viewType, model, counter: 0 });
            return this.tryRetain(resource, viewType);
        }
        disposeAllModelsForView(viewType) {
            for (const [key, value] of this._references) {
                if (value.viewType === viewType) {
                    value.model.then(x => x.dispose());
                    this._references.delete(key);
                }
            }
        }
        key(resource, viewType) {
            return `${resource.toString()}@@@${viewType}`;
        }
    }
    exports.CustomEditorModelManager = CustomEditorModelManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9yTW9kZWxNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY3VzdG9tRWRpdG9yL2NvbW1vbi9jdXN0b21FZGl0b3JNb2RlbE1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsd0JBQXdCO1FBQXJDO1lBRWtCLGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBSWxDLENBQUM7UUFnRU4sQ0FBQztRQTlETyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQWE7WUFDdEMsTUFBTSxRQUFRLEdBQUcsR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQztZQUM3QyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDbEIsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFDTSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQWEsRUFBRSxRQUFnQjtZQUMvQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN6QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4QyxPQUFPLEtBQUssRUFBRSxLQUFLLENBQUM7UUFD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