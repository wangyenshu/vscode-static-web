/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/base/common/mime", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, nls, event_1, platform_1, mime_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PLAINTEXT_EXTENSION = exports.PLAINTEXT_LANGUAGE_ID = exports.ModesRegistry = exports.EditorModesRegistry = exports.Extensions = void 0;
    // Define extension point ids
    exports.Extensions = {
        ModesRegistry: 'editor.modesRegistry'
    };
    class EditorModesRegistry {
        constructor() {
            this._onDidChangeLanguages = new event_1.Emitter();
            this.onDidChangeLanguages = this._onDidChangeLanguages.event;
            this._languages = [];
        }
        registerLanguage(def) {
            this._languages.push(def);
            this._onDidChangeLanguages.fire(undefined);
            return {
                dispose: () => {
                    for (let i = 0, len = this._languages.length; i < len; i++) {
                        if (this._languages[i] === def) {
                            this._languages.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        getLanguages() {
            return this._languages;
        }
    }
    exports.EditorModesRegistry = EditorModesRegistry;
    exports.ModesRegistry = new EditorModesRegistry();
    platform_1.Registry.add(exports.Extensions.ModesRegistry, exports.ModesRegistry);
    exports.PLAINTEXT_LANGUAGE_ID = 'plaintext';
    exports.PLAINTEXT_EXTENSION = '.txt';
    exports.ModesRegistry.registerLanguage({
        id: exports.PLAINTEXT_LANGUAGE_ID,
        extensions: [exports.PLAINTEXT_EXTENSION],
        aliases: [nls.localize('plainText.alias', "Plain Text"), 'text'],
        mimetypes: [mime_1.Mimes.text]
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerDefaultConfigurations([{
            overrides: {
                '[plaintext]': {
                    'editor.unicodeHighlight.ambiguousCharacters': false,
                    'editor.unicodeHighlight.invisibleCharacters': false
                }
            }
        }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZXNSZWdpc3RyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL21vZGVzUmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLDZCQUE2QjtJQUNoQixRQUFBLFVBQVUsR0FBRztRQUN6QixhQUFhLEVBQUUsc0JBQXNCO0tBQ3JDLENBQUM7SUFFRixNQUFhLG1CQUFtQjtRQU8vQjtZQUhpQiwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQzdDLHlCQUFvQixHQUFnQixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBR3BGLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxHQUE0QjtZQUNuRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNDLE9BQU87Z0JBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUM1RCxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7NEJBQ2hDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDN0IsT0FBTzt3QkFDUixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO1FBRU0sWUFBWTtZQUNsQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBN0JELGtEQTZCQztJQUVZLFFBQUEsYUFBYSxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztJQUN2RCxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxrQkFBVSxDQUFDLGFBQWEsRUFBRSxxQkFBYSxDQUFDLENBQUM7SUFFekMsUUFBQSxxQkFBcUIsR0FBRyxXQUFXLENBQUM7SUFDcEMsUUFBQSxtQkFBbUIsR0FBRyxNQUFNLENBQUM7SUFFMUMscUJBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztRQUM5QixFQUFFLEVBQUUsNkJBQXFCO1FBQ3pCLFVBQVUsRUFBRSxDQUFDLDJCQUFtQixDQUFDO1FBQ2pDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLEVBQUUsTUFBTSxDQUFDO1FBQ2hFLFNBQVMsRUFBRSxDQUFDLFlBQUssQ0FBQyxJQUFJLENBQUM7S0FDdkIsQ0FBQyxDQUFDO0lBRUgsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUF1QixDQUFDLGFBQWEsQ0FBQztTQUN4RSw2QkFBNkIsQ0FBQyxDQUFDO1lBQy9CLFNBQVMsRUFBRTtnQkFDVixhQUFhLEVBQUU7b0JBQ2QsNkNBQTZDLEVBQUUsS0FBSztvQkFDcEQsNkNBQTZDLEVBQUUsS0FBSztpQkFDcEQ7YUFDRDtTQUNELENBQUMsQ0FBQyxDQUFDIn0=