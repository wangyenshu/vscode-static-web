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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/workbench/contrib/chat/common/chatViewModel", "./annotations"], function (require, exports, lifecycle_1, map_1, network_1, uri_1, range_1, language_1, resolverService_1, chatViewModel_1, annotations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeBlockModelCollection = void 0;
    let CodeBlockModelCollection = class CodeBlockModelCollection extends lifecycle_1.Disposable {
        constructor(languageService, textModelService) {
            super();
            this.languageService = languageService;
            this.textModelService = textModelService;
            this._models = new map_1.ResourceMap();
        }
        dispose() {
            super.dispose();
            this.clear();
        }
        get(sessionId, chat, codeBlockIndex) {
            const uri = this.getUri(sessionId, chat, codeBlockIndex);
            const entry = this._models.get(uri);
            if (!entry) {
                return;
            }
            return { model: entry.model.then(ref => ref.object), vulns: entry.vulns };
        }
        getOrCreate(sessionId, chat, codeBlockIndex) {
            const existing = this.get(sessionId, chat, codeBlockIndex);
            if (existing) {
                return existing;
            }
            const uri = this.getUri(sessionId, chat, codeBlockIndex);
            const ref = this.textModelService.createModelReference(uri);
            this._models.set(uri, { model: ref, vulns: [] });
            return { model: ref.then(ref => ref.object), vulns: [] };
        }
        clear() {
            this._models.forEach(async (entry) => (await entry.model).dispose());
            this._models.clear();
        }
        async update(sessionId, chat, codeBlockIndex, content) {
            const entry = this.getOrCreate(sessionId, chat, codeBlockIndex);
            const extractedVulns = (0, annotations_1.extractVulnerabilitiesFromText)(content.text);
            const newText = extractedVulns.newText;
            this.setVulns(sessionId, chat, codeBlockIndex, extractedVulns.vulnerabilities);
            const textModel = (await entry.model).textEditorModel;
            if (content.languageId) {
                const vscodeLanguageId = this.languageService.getLanguageIdByLanguageName(content.languageId);
                if (vscodeLanguageId && vscodeLanguageId !== textModel.getLanguageId()) {
                    textModel.setLanguage(vscodeLanguageId);
                }
            }
            const currentText = textModel.getValue(1 /* EndOfLinePreference.LF */);
            if (newText === currentText) {
                return;
            }
            if (newText.startsWith(currentText)) {
                const text = newText.slice(currentText.length);
                const lastLine = textModel.getLineCount();
                const lastCol = textModel.getLineMaxColumn(lastLine);
                textModel.applyEdits([{ range: new range_1.Range(lastLine, lastCol, lastLine, lastCol), text }]);
            }
            else {
                // console.log(`Failed to optimize setText`);
                textModel.setValue(newText);
            }
        }
        setVulns(sessionId, chat, codeBlockIndex, vulnerabilities) {
            const uri = this.getUri(sessionId, chat, codeBlockIndex);
            const entry = this._models.get(uri);
            if (entry) {
                entry.vulns = vulnerabilities;
            }
        }
        getUri(sessionId, chat, index) {
            const metadata = this.getUriMetaData(chat);
            return uri_1.URI.from({
                scheme: network_1.Schemas.vscodeChatCodeBlock,
                authority: sessionId,
                path: `/${chat.id}/${index}`,
                fragment: metadata ? JSON.stringify(metadata) : undefined,
            });
        }
        getUriMetaData(chat) {
            if (!(0, chatViewModel_1.isResponseVM)(chat)) {
                return undefined;
            }
            return {
                references: chat.contentReferences.map(ref => {
                    const uriOrLocation = 'variableName' in ref.reference ?
                        ref.reference.value :
                        ref.reference;
                    if (!uriOrLocation) {
                        return;
                    }
                    if (uri_1.URI.isUri(uriOrLocation)) {
                        return {
                            uri: uriOrLocation.toJSON()
                        };
                    }
                    return {
                        uri: uriOrLocation.uri.toJSON(),
                        range: uriOrLocation.range,
                    };
                })
            };
        }
    };
    exports.CodeBlockModelCollection = CodeBlockModelCollection;
    exports.CodeBlockModelCollection = CodeBlockModelCollection = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, resolverService_1.ITextModelService)
    ], CodeBlockModelCollection);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUJsb2NrTW9kZWxDb2xsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vY29kZUJsb2NrTW9kZWxDb2xsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO1FBT3ZELFlBQ21CLGVBQWtELEVBQ2pELGdCQUFvRDtZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQUgyQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVB2RCxZQUFPLEdBQUcsSUFBSSxpQkFBVyxFQUd0QyxDQUFDO1FBT0wsQ0FBQztRQUVlLE9BQU87WUFDdEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFFRCxHQUFHLENBQUMsU0FBaUIsRUFBRSxJQUFvRCxFQUFFLGNBQXNCO1lBQ2xHLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN6RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTztZQUNSLENBQUM7WUFDRCxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsS0FB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