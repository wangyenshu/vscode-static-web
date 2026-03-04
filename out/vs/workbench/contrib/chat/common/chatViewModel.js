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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marked/marked", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/chat/common/annotations", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatWordCounter"], function (require, exports, event_1, lifecycle_1, marked_1, instantiation_1, log_1, annotations_1, chatModel_1, chatWordCounter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatResponseViewModel = exports.ChatRequestViewModel = exports.ChatViewModel = void 0;
    exports.isRequestVM = isRequestVM;
    exports.isResponseVM = isResponseVM;
    exports.isWelcomeVM = isWelcomeVM;
    function isRequestVM(item) {
        return !!item && typeof item === 'object' && 'message' in item;
    }
    function isResponseVM(item) {
        return !!item && typeof item.setVote !== 'undefined';
    }
    function isWelcomeVM(item) {
        return !!item && typeof item === 'object' && 'content' in item;
    }
    let ChatViewModel = class ChatViewModel extends lifecycle_1.Disposable {
        get inputPlaceholder() {
            return this._inputPlaceholder;
        }
        get model() {
            return this._model;
        }
        setInputPlaceholder(text) {
            this._inputPlaceholder = text;
            this._onDidChange.fire({ kind: 'changePlaceholder' });
        }
        resetInputPlaceholder() {
            this._inputPlaceholder = undefined;
            this._onDidChange.fire({ kind: 'changePlaceholder' });
        }
        get sessionId() {
            return this._model.sessionId;
        }
        get requestInProgress() {
            return this._model.requestInProgress;
        }
        get initState() {
            return this._model.initState;
        }
        constructor(_model, codeBlockModelCollection, instantiationService) {
            super();
            this._model = _model;
            this.codeBlockModelCollection = codeBlockModelCollection;
            this.instantiationService = instantiationService;
            this._onDidDisposeModel = this._register(new event_1.Emitter());
            this.onDidDisposeModel = this._onDidDisposeModel.event;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._items = [];
            this._inputPlaceholder = undefined;
            _model.getRequests().forEach((request, i) => {
                const requestModel = this.instantiationService.createInstance(ChatRequestViewModel, request);
                this._items.push(requestModel);
                this.updateCodeBlockTextModels(requestModel);
                if (request.response) {
                    this.onAddResponse(request.response);
                }
            });
            this._register(_model.onDidDispose(() => this._onDidDisposeModel.fire()));
            this._register(_model.onDidChange(e => {
                if (e.kind === 'addRequest') {
                    const requestModel = this.instantiationService.createInstance(ChatRequestViewModel, e.request);
                    this._items.push(requestModel);
                    this.updateCodeBlockTextModels(requestModel);
                    if (e.request.response) {
                        this.onAddResponse(e.request.response);
                    }
                }
                else if (e.kind === 'addResponse') {
                    this.onAddResponse(e.response);
                }
                else if (e.kind === 'removeRequest') {
                    const requestIdx = this._items.findIndex(item => isRequestVM(item) && item.id === e.requestId);
                    if (requestIdx >= 0) {
                        this._items.splice(requestIdx, 1);
                    }
                    const responseIdx = e.responseId && this._items.findIndex(item => isResponseVM(item) && item.id === e.responseId);
                    if (typeof responseIdx === 'number' && responseIdx >= 0) {
                        const items = this._items.splice(responseIdx, 1);
                        const item = items[0];
                        if (item instanceof ChatResponseViewModel) {
                            item.dispose();
                        }
                    }
                }
                const modelEventToVmEvent = e.kind === 'addRequest' ? { kind: 'addRequest' } :
                    e.kind === 'initialize' ? { kind: 'initialize' } :
                        null;
                this._onDidChange.fire(modelEventToVmEvent);
            }));
        }
        onAddResponse(responseModel) {
            const response = this.instantiationService.createInstance(ChatResponseViewModel, responseModel);
            this._register(response.onDidChange(() => {
                if (response.isComplete) {
                    this.updateCodeBlockTextModels(response);
                }
                return this._onDidChange.fire(null);
            }));
            this._items.push(response);
            this.updateCodeBlockTextModels(response);
        }
        getItems() {
            return [...(this._model.welcomeMessage ? [this._model.welcomeMessage] : []), ...this._items];
        }
        dispose() {
            super.dispose();
            this._items
                .filter((item) => item instanceof ChatResponseViewModel)
                .forEach((item) => item.dispose());
        }
        updateCodeBlockTextModels(model) {
            let content;
            if (isRequestVM(model)) {
                content = model.messageText;
            }
            else {
                content = (0, annotations_1.annotateVulnerabilitiesInText)(model.response.value).map(x => x.content.value).join('');
            }
            let codeBlockIndex = 0;
            const renderer = new marked_1.marked.Renderer();
            renderer.code = (value, languageId) => {
                languageId ??= '';
                const newText = this.fixCodeText(value, languageId);
                this.codeBlockModelCollection.update(this._model.sessionId, model, codeBlockIndex++, { text: newText, languageId });
                return '';
            };
            marked_1.marked.parse(this.ensureFencedCodeBlocksTerminated(content), { renderer });
        }
        fixCodeText(text, languageId) {
            if (languageId === 'php') {
                if (!text.trim().startsWith('<')) {
                    return `<?php\n${text}\n?>`;
                }
            }
            return text;
        }
        /**
         * Marked doesn't consistently render fenced code blocks that aren't terminated.
         *
         * Try to close them ourselves to workaround this.
         */
        ensureFencedCodeBlocksTerminated(content) {
            const lines = content.split('\n');
            let inCodeBlock = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                }
            }
            // If we're still in a code block at the end of the content, add a closing fence
            if (inCodeBlock) {
                lines.push('```');
            }
            return lines.join('\n');
        }
    };
    exports.ChatViewModel = ChatViewModel;
    exports.ChatViewModel = ChatViewModel = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], ChatViewModel);
    class ChatRequestViewModel {
        get id() {
            return this._model.id;
        }
        get dataId() {
            return this.id + `_${chatModel_1.ChatModelInitState[this._model.session.initState]}`;
        }
        get sessionId() {
            return this._model.session.sessionId;
        }
        get username() {
            return this._model.username;
        }
        get avatarIcon() {
            return this._model.avatarIconUri;
        }
        get message() {
            return this._model.message;
        }
        get messageText() {
            return this.message.text;
        }
        get attempt() {
            return this._model.attempt;
        }
        constructor(_model) {
            this._model = _model;
        }
    }
    exports.ChatRequestViewModel = ChatRequestViewModel;
    let ChatResponseViewModel = class ChatResponseViewModel extends lifecycle_1.Disposable {
        get id() {
            return this._model.id;
        }
        get dataId() {
            return this._model.id + `_${this._modelChangeCount}` + `_${chatModel_1.ChatModelInitState[this._model.session.initState]}`;
        }
        get sessionId() {
            return this._model.session.sessionId;
        }
        get username() {
            return this._model.username;
        }
        get avatarIcon() {
            return this._model.avatarIcon;
        }
        get agent() {
            return this._model.agent;
        }
        get slashCommand() {
            return this._model.slashCommand;
        }
        get agentOrSlashCommandDetected() {
            return this._model.agentOrSlashCommandDetected;
        }
        get response() {
            return this._model.response;
        }
        get usedContext() {
            return this._model.usedContext;
        }
        get contentReferences() {
            return this._model.contentReferences;
        }
        get progressMessages() {
            return this._model.progressMessages;
        }
        get isComplete() {
            return this._model.isComplete;
        }
        get isCanceled() {
            return this._model.isCanceled;
        }
        get replyFollowups() {
            return this._model.followups?.filter((f) => f.kind === 'reply');
        }
        get result() {
            return this._model.result;
        }
        get errorDetails() {
            return this.result?.errorDetails;
        }
        get vote() {
            return this._model.vote;
        }
        get requestId() {
            return this._model.requestId;
        }
        get isStale() {
            return this._model.isStale;
        }
        get usedReferencesExpanded() {
            if (typeof this._usedReferencesExpanded === 'boolean') {
                return this._usedReferencesExpanded;
            }
            return this.response.value.length === 0;
        }
        set usedReferencesExpanded(v) {
            this._usedReferencesExpanded = v;
        }
        get vulnerabilitiesListExpanded() {
            return this._vulnerabilitiesListExpanded;
        }
        set vulnerabilitiesListExpanded(v) {
            this._vulnerabilitiesListExpanded = v;
        }
        get contentUpdateTimings() {
            return this._contentUpdateTimings;
        }
        constructor(_model, logService) {
            super();
            this._model = _model;
            this.logService = logService;
            this._modelChangeCount = 0;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.renderData = undefined;
            this._vulnerabilitiesListExpanded = false;
            this._contentUpdateTimings = undefined;
            if (!_model.isComplete) {
                this._contentUpdateTimings = {
                    loadingStartTime: Date.now(),
                    lastUpdateTime: Date.now(),
                    impliedWordLoadRate: 0,
                    lastWordCount: 0
                };
            }
            this._register(_model.onDidChange(() => {
                if (this._contentUpdateTimings) {
                    // This should be true, if the model is changing
                    const now = Date.now();
                    const wordCount = (0, chatWordCounter_1.countWords)(_model.response.asString());
                    const timeDiff = now - this._contentUpdateTimings.loadingStartTime;
                    const impliedWordLoadRate = this._contentUpdateTimings.lastWordCount / (timeDiff / 1000);
                    this.trace('onDidChange', `Update- got ${this._contentUpdateTimings.lastWordCount} words over ${timeDiff}ms = ${impliedWordLoadRate} words/s. ${wordCount} words are now available.`);
                    this._contentUpdateTimings = {
                        loadingStartTime: this._contentUpdateTimings.loadingStartTime,
                        lastUpdateTime: now,
                        impliedWordLoadRate,
                        lastWordCount: wordCount
                    };
                }
                else {
                    this.logService.warn('ChatResponseViewModel#onDidChange: got model update but contentUpdateTimings is not initialized');
                }
                // new data -> new id, new content to render
                this._modelChangeCount++;
                this._onDidChange.fire();
            }));
        }
        trace(tag, message) {
            this.logService.trace(`ChatResponseViewModel#${tag}: ${message}`);
        }
        setVote(vote) {
            this._modelChangeCount++;
            this._model.setVote(vote);
        }
        setEditApplied(edit, editCount) {
            this._modelChangeCount++;
            this._model.setEditApplied(edit, editCount);
        }
    };
    exports.ChatResponseViewModel = ChatResponseViewModel;
    exports.ChatResponseViewModel = ChatResponseViewModel = __decorate([
        __param(1, log_1.ILogService)
    ], ChatResponseViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFZpZXdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvY29tbW9uL2NoYXRWaWV3TW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0JoRyxrQ0FFQztJQUVELG9DQUVDO0lBRUQsa0NBRUM7SUFWRCxTQUFnQixXQUFXLENBQUMsSUFBYTtRQUN4QyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUM7SUFDaEUsQ0FBQztJQUVELFNBQWdCLFlBQVksQ0FBQyxJQUFhO1FBQ3pDLE9BQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxPQUFRLElBQStCLENBQUMsT0FBTyxLQUFLLFdBQVcsQ0FBQztJQUNsRixDQUFDO0lBRUQsU0FBZ0IsV0FBVyxDQUFDLElBQWE7UUFDeEMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDO0lBQ2hFLENBQUM7SUErR00sSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLHNCQUFVO1FBVzVDLElBQUksZ0JBQWdCO1lBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELG1CQUFtQixDQUFDLElBQVk7WUFDL0IsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUM7UUFDdkQsQ0FBQztR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