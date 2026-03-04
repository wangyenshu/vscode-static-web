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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/resources", "vs/editor/common/services/editorWorker", "vs/base/common/event", "vs/base/common/async", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/workbench/services/output/common/output", "vs/base/common/errors"], function (require, exports, instantiation_1, resources, editorWorker_1, event_1, async_1, files_1, model_1, lifecycle_1, types_1, editOperation_1, position_1, range_1, buffer_1, log_1, cancellation_1, output_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DelegatedOutputChannelModel = exports.FileOutputChannelModel = void 0;
    class OutputFileListener extends lifecycle_1.Disposable {
        constructor(file, fileService, logService) {
            super();
            this.file = file;
            this.fileService = fileService;
            this.logService = logService;
            this._onDidContentChange = new event_1.Emitter();
            this.onDidContentChange = this._onDidContentChange.event;
            this.watching = false;
            this.syncDelayer = new async_1.ThrottledDelayer(500);
        }
        watch(eTag) {
            if (!this.watching) {
                this.etag = eTag;
                this.poll();
                this.logService.trace('Started polling', this.file.toString());
                this.watching = true;
            }
        }
        poll() {
            const loop = () => this.doWatch().then(() => this.poll());
            this.syncDelayer.trigger(loop).catch(error => {
                if (!(0, errors_1.isCancellationError)(error)) {
                    throw error;
                }
            });
        }
        async doWatch() {
            const stat = await this.fileService.stat(this.file);
            if (stat.etag !== this.etag) {
                this.etag = stat.etag;
                this._onDidContentChange.fire(stat.size);
            }
        }
        unwatch() {
            if (this.watching) {
                this.syncDelayer.cancel();
                this.watching = false;
                this.logService.trace('Stopped polling', this.file.toString());
            }
        }
        dispose() {
            this.unwatch();
            super.dispose();
        }
    }
    let FileOutputChannelModel = class FileOutputChannelModel extends lifecycle_1.Disposable {
        constructor(modelUri, language, file, fileService, modelService, logService, editorWorkerService) {
            super();
            this.modelUri = modelUri;
            this.language = language;
            this.file = file;
            this.fileService = fileService;
            this.modelService = modelService;
            this.editorWorkerService = editorWorkerService;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.etag = '';
            this.loadModelPromise = null;
            this.model = null;
            this.modelUpdateInProgress = false;
            this.modelUpdateCancellationSource = this._register(new lifecycle_1.MutableDisposable());
            this.appendThrottler = this._register(new async_1.ThrottledDelayer(300));
            this.startOffset = 0;
            this.endOffset = 0;
            this.fileHandler = this._register(new OutputFileListener(this.file, this.fileService, logService));
            this._register(this.fileHandler.onDidContentChange(size => this.onDidContentChange(size)));
            this._register((0, lifecycle_1.toDisposable)(() => this.fileHandler.unwatch()));
        }
        append(message) {
            throw new Error('Not supported');
        }
        replace(message) {
            throw new Error('Not supported');
        }
        clear() {
            this.update(output_1.OutputChannelUpdateMode.Clear, this.endOffset, true);
        }
        update(mode, till, immediate) {
            const loadModelPromise = this.loadModelPromise ? this.loadModelPromise : Promise.resolve();
            loadModelPromise.then(() => this.doUpdate(mode, till, immediate));
        }
        loadModel() {
            this.loadModelPromise = async_1.Promises.withAsyncBody(async (c, e) => {
                try {
                    let content = '';
                    if (await this.fileService.exists(this.file)) {
                        const fileContent = await this.fileService.readFile(this.file, { position: this.startOffset });
                        this.endOffset = this.startOffset + fileContent.value.byteLength;
                        this.etag = fileContent.etag;
                        content = fileContent.value.toString();
                    }
                    else {
                        this.startOffset = 0;
                        this.endOffset = 0;
                    }
                    c(this.createModel(content));
                }
                catch (error) {
                    e(error);
                }
            });
            return this.loadModelPromise;
        }
        createModel(content) {
            if (this.model) {
                this.model.setValue(content);
            }
            else {
                this.model = this.modelService.createModel(content, this.language, this.modelUri);
                this.fileHandler.watch(this.etag);
                const disposable = this.model.onWillDispose(() => {
                    this.cancelModelUpdate();
                    this.fileHandler.unwatch();
                    this.model = null;
                    (0, lifecycle_1.dispose)(disposable);
                });
            }
            return this.model;
        }
        doUpdate(mode, till, immediate) {
            if (mode === output_1.OutputChannelUpdateMode.Clear || mode === output_1.OutputChannelUpdateMode.Replace) {
                this.startOffset = this.endOffset = (0, types_1.isNumber)(till) ? till : this.endOffset;
                this.cancelModelUpdate();
            }
            if (!this.model) {
                return;
            }
            this.modelUpdateInProgress = true;
            if (!this.modelUpdateCancellationSource.value) {
                this.modelUpdateCancellationSource.value = new cancellation_1.CancellationTokenSource();
            }
            const token = this.modelUpdateCancellationSource.value.token;
            if (mode === output_1.OutputChannelUpdateMode.Clear) {
                this.clearContent(this.model);
            }
            else if (mode === output_1.OutputChannelUpdateMode.Replace) {
                this.replacePromise = this.replaceContent(this.model, token).finally(() => this.replacePromise = undefined);
            }
            else {
                this.appendContent(this.model, immediate, token);
            }
        }
        clearContent(model) {
            this.doUpdateModel(model, [editOperation_1.EditOperation.delete(model.getFullModelRange())], buffer_1.VSBuffer.fromString(''));
        }
        appendContent(model, immediate, token) {
            this.appendThrottler.trigger(async () => {
                /* Abort if operation is cancelled */
                if (token.isCancellationRequested) {
                    return;
                }
                /* Wait for replace to finish */
                if (this.replacePromise) {
                    try {
                        await this.replacePromise;
                    }
                    catch (e) { /* Ignore */ }
                    /* Abort if operation is cancelled */
                    if (token.isCancellationRequested) {
                        return;
                    }
                }
                /* Get content to append */
                const contentToAppend = await this.getContentToUpdate();
                /* Abort if operation is cancelled */
                if (token.isCancellationRequested) {
                    return;
                }
                /* Appned Content */
                const lastLine = model.getLineCount();
                const lastLineMaxColumn = model.getLineMaxColumn(lastLine);
                const edits = [editOperation_1.EditOperation.insert(new position_1.Position(lastLine, lastLineMaxColumn), contentToAppend.toString())];
                this.doUpdateModel(model, edits, contentToAppend);
            }, immediate ? 0 : undefined).catch(error => {
                if (!(0, errors_1.isCancellationError)(error)) {
                    throw error;
                }
            });
        }
        async replaceContent(model, token) {
            /* Get content to replace */
            const contentToReplace = await this.getContentToUpdate();
            /* Abort if operation is cancelled */
            if (token.isCancellationRequested) {
                return;
            }
            /* Compute Edits */
            const edits = await this.getReplaceEdits(model, contentToReplace.toString());
            /* Abort if operation is cancelled */
            if (token.isCancellationRequested) {
                return;
            }
            /* Apply Edits */
            this.doUpdateModel(model, edits, contentToReplace);
        }
        async getReplaceEdits(model, contentToReplace) {
            if (!contentToReplace) {
                return [editOperation_1.EditOperation.delete(model.getFullModelRange())];
            }
            if (contentToReplace !== model.getValue()) {
                const edits = await this.editorWorkerService.computeMoreMinimalEdits(model.uri, [{ text: contentToReplace.toString(), range: model.getFullModelRange() }]);
                if (edits?.length) {
                    return edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text));
                }
            }
            return [];
        }
        doUpdateModel(model, edits, content) {
            if (edits.length) {
                model.applyEdits(edits);
            }
            this.endOffset = this.endOffset + content.byteLength;
            this.modelUpdateInProgress = false;
        }
        cancelModelUpdate() {
            this.modelUpdateCancellationSource.value?.cancel();
            this.modelUpdateCancellationSource.value = undefined;
            this.appendThrottler.cancel();
            this.replacePromise = undefined;
            this.modelUpdateInProgress = false;
        }
        async getContentToUpdate() {
            const content = await this.fileService.readFile(this.file, { position: this.endOffset });
            this.etag = content.etag;
            return content.value;
        }
        onDidContentChange(size) {
            if (this.model) {
                if (!this.modelUpdateInProgress) {
                    if ((0, types_1.isNumber)(size) && this.endOffset > size) {
                        // Reset - Content is removed
                        this.update(output_1.OutputChannelUpdateMode.Clear, 0, true);
                    }
                }
                this.update(output_1.OutputChannelUpdateMode.Append, undefined, false /* Not needed to update immediately. Wait to collect more changes and update. */);
            }
        }
        isVisible() {
            return !!this.model;
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    };
    exports.FileOutputChannelModel = FileOutputChannelModel;
    exports.FileOutputChannelModel = FileOutputChannelModel = __decorate([
        __param(3, files_1.IFileService),
        __param(4, model_1.IModelService),
        __param(5, log_1.ILogService),
        __param(6, editorWorker_1.IEditorWorkerService)
    ], FileOutputChannelModel);
    let OutputChannelBackedByFile = class OutputChannelBackedByFile extends FileOutputChannelModel {
        constructor(id, modelUri, language, file, fileService, modelService, loggerService, logService, editorWorkerService) {
            super(modelUri, language, file, fileService, modelService, logService, editorWorkerService);
            // Donot rotate to check for the file reset
            this.logger = loggerService.createLogger(file, { logLevel: 'always', donotRotate: true, donotUseFormatters: true, hidden: true });
            this._offset = 0;
        }
        append(message) {
            this.write(message);
            this.update(output_1.OutputChannelUpdateMode.Append, undefined, this.isVisible());
        }
        replace(message) {
            const till = this._offset;
            this.write(message);
            this.update(output_1.OutputChannelUpdateMode.Replace, till, true);
        }
        write(content) {
            this._offset += buffer_1.VSBuffer.fromString(content).byteLength;
            this.logger.info(content);
            if (this.isVisible()) {
                this.logger.flush();
            }
        }
    };
    OutputChannelBackedByFile = __decorate([
        __param(4, files_1.IFileService),
        __param(5, model_1.IModelService),
        __param(6, log_1.ILoggerService),
        __param(7, log_1.ILogService),
        __param(8, editorWorker_1.IEditorWorkerService)
    ], OutputChannelBackedByFile);
    let DelegatedOutputChannelModel = class DelegatedOutputChannelModel extends lifecycle_1.Disposable {
        constructor(id, modelUri, language, outputDir, instantiationService, fileService) {
            super();
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.outputChannelModel = this.createOutputChannelModel(id, modelUri, language, outputDir);
        }
        async createOutputChannelModel(id, modelUri, language, outputDirPromise) {
            const outputDir = await outputDirPromise;
            const file = resources.joinPath(outputDir, `${id.replace(/[\\/:\*\?"<>\|]/g, '')}.log`);
            await this.fileService.createFile(file);
            const outputChannelModel = this._register(this.instantiationService.createInstance(OutputChannelBackedByFile, id, modelUri, language, file));
            this._register(outputChannelModel.onDispose(() => this._onDispose.fire()));
            return outputChannelModel;
        }
        append(output) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.append(output));
        }
        update(mode, till, immediate) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.update(mode, till, immediate));
        }
        loadModel() {
            return this.outputChannelModel.then(outputChannelModel => outputChannelModel.loadModel());
        }
        clear() {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.clear());
        }
        replace(value) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.replace(value));
        }
    };
    exports.DelegatedOutputChannelModel = DelegatedOutputChannelModel;
    exports.DelegatedOutputChannelModel = DelegatedOutputChannelModel = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, files_1.IFileService)
    ], DelegatedOutputChannelModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0Q2hhbm5lbE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvb3V0cHV0L2NvbW1vbi9vdXRwdXRDaGFubmVsTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0NoRyxNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBUzFDLFlBQ2tCLElBQVMsRUFDVCxXQUF5QixFQUN6QixVQUF1QjtZQUV4QyxLQUFLLEVBQUUsQ0FBQztZQUpTLFNBQUksR0FBSixJQUFJLENBQUs7WUFDVCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN6QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBVnhCLHdCQUFtQixHQUFHLElBQUksZUFBTyxFQUFzQixDQUFDO1lBQ2hFLHVCQUFrQixHQUE4QixJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1lBRWhGLGFBQVEsR0FBWSxLQUFLLENBQUM7WUFVakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLHdCQUFnQixDQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxLQUFLLENBQUMsSUFBd0I7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQy9ELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBRU8sSUFBSTtZQUNYLE1BQU0sSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM1QyxJQUFJLENBQUMsSUFBQSw0QkFBbUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNqQyxNQUFNLEtBQUssQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sS0FBSyxDQUFDLE9BQU87WUFDcEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEQsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUN0QixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQyxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNoRSxDQUFDO1FBQ0YsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztLQUNEO0lBRU0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQWtCckQsWUFDa0IsUUFBYSxFQUNiLFFBQTRCLEVBQzVCLElBQVMsRUFDWixXQUEwQyxFQUN6QyxZQUE0QyxFQUM5QyxVQUF1QixFQUNkLG1CQUEwRDtZQUVoRixLQUFLLEVBQUUsQ0FBQztZQVJTLGFBQVEsR0FBUixRQUFRLENBQUs7WUFDYixhQUFRLEdBQVIsUUFBUSxDQUFvQjtZQUM1QixTQUFJLEdBQUosSUFBSSxDQUFLO1lBQ0ssZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDeEIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFFcEIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQXZCaEUsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3pELGNBQVMsR0FBZ0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFHaEQsU0FBSSxHQUF1QixFQUFFLENBQUM7WUFFOUIscUJBQWdCLEdBQStCLElBQUksQ0FBQztZQUNwRCxVQUFLLEdBQXNCLElBQUksQ0FBQztZQUNoQywwQkFBcUIsR0FBWSxLQUFLLENBQUM7WUFDOUIsa0NBQTZCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUEyQixDQUFDLENBQUM7WUFDakcsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUdyRSxnQkFBVyxHQUFXLENBQUMsQ0FBQztZQUN4QixjQUFTLEdBQVcsQ0FBQyxDQUFDO1lBYTdCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ25HLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELE1BQU0sQ0FBQyxPQUFlO1lBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELE9BQU8sQ0FBQyxPQUFlO1lBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsTUFBTSxDQUFDLGdDQUF1QixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBNkIsRUFBRSxJQUF3QixFQUFFLFNBQWtCO1lBQ2pGLE1BQU0sZ0JBQWdCLEdBQWlCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDekcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxTQUFTO1lBQ1IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFRLENBQUMsYUFBYSxDQUFhLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pFLElBQUksQ0FBQztvQkFDSixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ2pCLElBQUksTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDOUMsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO3dCQUMvRixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7d0JBQ2pFLElBQUksQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQzt3QkFDN0IsT0FBTyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3hDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQzt3QkFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7b0JBQ3BCLENBQUM7b0JBQ0QsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNoQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ1YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQUVPLFdBQVcsQ0FBQyxPQUFlO1lBQ2xDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFO29CQUNoRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7b0JBQ2xCLElBQUEsbUJBQU8sRUFBQyxVQUFVLENBQUMsQ0FBQztnQkFDckIsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFTyxRQUFRLENBQUMsSUFBNkIsRUFBRSxJQUF3QixFQUFFLFNBQWtCO1lBQzNGLElBQUksSUFBSSxLQUFLLGdDQUF1QixDQUFDLEtBQUssSUFBSSxJQUFJLEtBQUssZ0NBQXVCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3hGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDM0UsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztZQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztZQUMxRSxDQUFDO1lBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFFN0QsSUFBSSxJQUFJLEtBQUssZ0NBQXVCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLENBQUM7aUJBRUksSUFBSSxJQUFJLEtBQUssZ0NBQXVCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25ELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQzdHLENBQUM7aUJBRUksQ0FBQztnQkFDTCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELENBQUM7UUFDRixDQUFDO1FBRU8sWUFBWSxDQUFDLEtBQWlCO1lBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUMsNkJBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkcsQ0FBQztRQUVPLGFBQWEsQ0FBQyxLQUFpQixFQUFFLFNBQWtCLEVBQUUsS0FBd0I7WUFDcEYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZDLHFDQUFxQztnQkFDckMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDbkMsT0FBTztnQkFDUixDQUFDO2dCQUVELGdDQUFnQztnQkFDaEMsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQzt3QkFBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUM7b0JBQUMsQ0FBQztvQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQzdELHFDQUFxQztvQkFDckMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQzt3QkFDbkMsT0FBTztvQkFDUixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsMkJBQTJCO2dCQUMzQixNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4RCxxQ0FBcUM7Z0JBQ3JDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7b0JBQ25DLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxvQkFBb0I7Z0JBQ3BCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNELE1BQU0sS0FBSyxHQUFHLENBQUMsNkJBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxtQkFBUSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztZQUNuRCxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLElBQUEsNEJBQW1CLEVBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDakMsTUFBTSxLQUFLLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBaUIsRUFBRSxLQUF3QjtZQUN2RSw0QkFBNEI7WUFDNUIsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQ3pELHFDQUFxQztZQUNyQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNuQyxPQUFPO1lBQ1IsQ0FBQztZQUVELG1CQUFtQjtZQUNuQixNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDN0UscUNBQXFDO1lBQ3JDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBRUQsaUJBQWlCO1lBQ2pCLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFTyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQWlCLEVBQUUsZ0JBQXdCO1lBQ3hFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN2QixPQUFPLENBQUMsNkJBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUM7WUFDRCxJQUFJLGdCQUFnQixLQUFLLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzSixJQUFJLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztvQkFDbkIsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsNkJBQWEsQ0FBQyxPQUFPLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3BGLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRU8sYUFBYSxDQUFDLEtBQWlCLEVBQUUsS0FBNkIsRUFBRSxPQUFpQjtZQUN4RixJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QixDQUFDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7WUFDckQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQztRQUNwQyxDQUFDO1FBRVMsaUJBQWlCO1lBQzFCLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDbkQsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDckQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztZQUNoQyxJQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQ3BDLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCO1lBQy9CLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDekIsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3RCLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxJQUF3QjtZQUNsRCxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUNqQyxJQUFJLElBQUEsZ0JBQVEsRUFBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksRUFBRSxDQUFDO3dCQUM3Qyw2QkFBNkI7d0JBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsZ0NBQXVCLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDckQsQ0FBQztnQkFDRixDQUFDO2dCQUNELElBQUksQ0FBQyxNQUFNLENBQUMsZ0NBQXVCLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsZ0ZBQWdGLENBQUMsQ0FBQztZQUNoSixDQUFDO1FBQ0YsQ0FBQztRQUVTLFNBQVM7WUFDbEIsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNyQixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdkIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRCxDQUFBO0lBck9ZLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBc0JoQyxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLG1DQUFvQixDQUFBO09BekJWLHNCQUFzQixDQXFPbEM7SUFFRCxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHNCQUFzQjtRQUs3RCxZQUNDLEVBQVUsRUFDVixRQUFhLEVBQ2IsUUFBNEIsRUFDNUIsSUFBUyxFQUNLLFdBQXlCLEVBQ3hCLFlBQTJCLEVBQzFCLGFBQTZCLEVBQ2hDLFVBQXVCLEVBQ2QsbUJBQXlDO1lBRS9ELEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRTVGLDJDQUEyQztZQUMzQyxJQUFJLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsSSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRVEsTUFBTSxDQUFDLE9BQWU7WUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLGdDQUF1QixDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVRLE9BQU8sQ0FBQyxPQUFlO1lBQy9CLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLGdDQUF1QixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVPLEtBQUssQ0FBQyxPQUFlO1lBQzVCLElBQUksQ0FBQyxPQUFPLElBQUksaUJBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDO1lBQ3hELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDckIsQ0FBQztRQUNGLENBQUM7S0FFRCxDQUFBO0lBMUNLLHlCQUF5QjtRQVU1QixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLG9CQUFjLENBQUE7UUFDZCxXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLG1DQUFvQixDQUFBO09BZGpCLHlCQUF5QixDQTBDOUI7SUFFTSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBTzFELFlBQ0MsRUFBVSxFQUNWLFFBQWEsRUFDYixRQUE0QixFQUM1QixTQUF1QixFQUNBLG9CQUE0RCxFQUNyRSxXQUEwQztZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQUhnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3BELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBWHhDLGVBQVUsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDeEUsY0FBUyxHQUFnQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQWF2RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFFTyxLQUFLLENBQUMsd0JBQXdCLENBQUMsRUFBVSxFQUFFLFFBQWEsRUFBRSxRQUE0QixFQUFFLGdCQUE4QjtZQUM3SCxNQUFNLFNBQVMsR0FBRyxNQUFNLGdCQUFnQixDQUFDO1lBQ3pDLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEYsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdJLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNFLE9BQU8sa0JBQWtCLENBQUM7UUFDM0IsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFjO1lBQ3BCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBNkIsRUFBRSxJQUF3QixFQUFFLFNBQWtCO1lBQ2pGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVELFNBQVM7WUFDUixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDM0YsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRCxPQUFPLENBQUMsS0FBYTtZQUNwQixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN2RixDQUFDO0tBQ0QsQ0FBQTtJQS9DWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQVlyQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsb0JBQVksQ0FBQTtPQWJGLDJCQUEyQixDQStDdkMifQ==