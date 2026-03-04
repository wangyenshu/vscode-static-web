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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testingUri"], function (require, exports, buffer_1, lifecycle_1, strings_1, language_1, model_1, resolverService_1, nls_1, testResultService_1, testingUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingContentProvider = void 0;
    /**
     * A content provider that returns various outputs for tests. This is used
     * in the inline peek view.
     */
    let TestingContentProvider = class TestingContentProvider {
        constructor(textModelResolverService, languageService, modelService, resultService) {
            this.languageService = languageService;
            this.modelService = modelService;
            this.resultService = resultService;
            textModelResolverService.registerTextModelContentProvider(testingUri_1.TEST_DATA_SCHEME, this);
        }
        /**
         * @inheritdoc
         */
        async provideTextContent(resource) {
            const existing = this.modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            const parsed = (0, testingUri_1.parseTestUri)(resource);
            if (!parsed) {
                return null;
            }
            const result = this.resultService.getResult(parsed.resultId);
            if (!result) {
                return null;
            }
            if (parsed.type === 0 /* TestUriType.TaskOutput */) {
                const task = result.tasks[parsed.taskIndex];
                const model = this.modelService.createModel('', null, resource, false);
                const append = (text) => model.applyEdits([{
                        range: { startColumn: 1, endColumn: 1, startLineNumber: Infinity, endLineNumber: Infinity },
                        text,
                    }]);
                const init = buffer_1.VSBuffer.concat(task.output.buffers, task.output.length).toString();
                append((0, strings_1.removeAnsiEscapeCodes)(init));
                let hadContent = init.length > 0;
                const dispose = new lifecycle_1.DisposableStore();
                dispose.add(task.output.onDidWriteData(d => {
                    hadContent ||= d.byteLength > 0;
                    append((0, strings_1.removeAnsiEscapeCodes)(d.toString()));
                }));
                task.output.endPromise.then(() => {
                    if (dispose.isDisposed) {
                        return;
                    }
                    if (!hadContent) {
                        append((0, nls_1.localize)('runNoOutout', 'The test run did not record any output.'));
                        dispose.dispose();
                    }
                });
                model.onWillDispose(() => dispose.dispose());
                return model;
            }
            const test = result?.getStateById(parsed.testExtId);
            if (!test) {
                return null;
            }
            let text;
            let language = null;
            switch (parsed.type) {
                case 3 /* TestUriType.ResultActualOutput */: {
                    const message = test.tasks[parsed.taskIndex].messages[parsed.messageIndex];
                    if (message?.type === 0 /* TestMessageType.Error */) {
                        text = message.actual;
                    }
                    break;
                }
                case 1 /* TestUriType.TestOutput */: {
                    text = '';
                    const output = result.tasks[parsed.taskIndex].output;
                    for (const message of test.tasks[parsed.taskIndex].messages) {
                        if (message.type === 1 /* TestMessageType.Output */) {
                            text += (0, strings_1.removeAnsiEscapeCodes)(output.getRange(message.offset, message.length).toString());
                        }
                    }
                    break;
                }
                case 4 /* TestUriType.ResultExpectedOutput */: {
                    const message = test.tasks[parsed.taskIndex].messages[parsed.messageIndex];
                    if (message?.type === 0 /* TestMessageType.Error */) {
                        text = message.expected;
                    }
                    break;
                }
                case 2 /* TestUriType.ResultMessage */: {
                    const message = test.tasks[parsed.taskIndex].messages[parsed.messageIndex];
                    if (!message) {
                        break;
                    }
                    if (message.type === 1 /* TestMessageType.Output */) {
                        const content = result.tasks[parsed.taskIndex].output.getRange(message.offset, message.length);
                        text = (0, strings_1.removeAnsiEscapeCodes)(content.toString());
                    }
                    else if (typeof message.message === 'string') {
                        text = (0, strings_1.removeAnsiEscapeCodes)(message.message);
                    }
                    else {
                        text = message.message.value;
                        language = this.languageService.createById('markdown');
                    }
                }
            }
            if (text === undefined) {
                return null;
            }
            return this.modelService.createModel(text, language, resource, false);
        }
    };
    exports.TestingContentProvider = TestingContentProvider;
    exports.TestingContentProvider = TestingContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, testResultService_1.ITestResultService)
    ], TestingContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0NvbnRlbnRQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RpbmdDb250ZW50UHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0JoRzs7O09BR0c7SUFDSSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQUNsQyxZQUNvQix3QkFBMkMsRUFDM0IsZUFBaUMsRUFDcEMsWUFBMkIsRUFDdEIsYUFBaUM7WUFGbkMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3BDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3RCLGtCQUFhLEdBQWIsYUFBYSxDQUFvQjtZQUV0RSx3QkFBd0IsQ0FBQyxnQ0FBZ0MsQ0FBQyw2QkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRUQ7O1dBRUc7UUFDSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsUUFBYTtZQUM1QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RCxJQUFJLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLFFBQVEsQ0FBQztZQUNqQixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBQSx5QkFBWSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksTUFBTSxDQUFDLElBQUksbUNBQTJCLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNsRCxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFO3dCQUMzRixJQUFJO3FCQUNKLENBQUMsQ0FBQyxDQUFDO2dCQUVKLE1BQU0sSUFBSSxHQUFHLGlCQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2pGLE1BQU0sQ0FBQyxJQUFBLCtCQUFxQixFQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRXBDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLE9BQU8sR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDMUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO29CQUNoQyxNQUFNLENBQUMsSUFBQSwrQkFBcUIsRUFBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQ2hDLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUN4QixPQUFPO29CQUNSLENBQUM7b0JBQ0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUNqQixNQUFNLENBQUMsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLHlDQUF5QyxDQUFDLENBQUMsQ0FBQzt3QkFDM0UsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNuQixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUNILEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBRTdDLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLElBQXdCLENBQUM7WUFDN0IsSUFBSSxRQUFRLEdBQThCLElBQUksQ0FBQztZQUMvQyxRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckIsMkNBQW1DLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUMzRSxJQUFJLE9BQU8sRUFBRSxJQUFJLGtDQUEwQixFQUFFLENBQUM7d0JBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7b0JBQUMsQ0FBQztvQkFDdkUsTUFBTTtnQkFDUCxDQUFDO2dCQUNELG1DQUEyQixDQUFDLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDVixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUM7b0JBQ3JELEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQzdELElBQUksT0FBTyxDQUFDLElBQUksbUNBQTJCLEVBQUUsQ0FBQzs0QkFDN0MsSUFBSSxJQUFJLElBQUEsK0JBQXFCLEVBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO3dCQUMzRixDQUFDO29CQUNGLENBQUM7b0JBQ0QsTUFBTTtnQkFDUCxDQUFDO2dCQUNELDZDQUFxQyxDQUFDLENBQUMsQ0FBQztvQkFDdkMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDM0UsSUFBSSxPQUFPLEVBQUUsSUFBSSxrQ0FBMEIsRUFBRSxDQUFDO3dCQUFDLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO29CQUFDLENBQUM7b0JBQ3pFLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxzQ0FBOEIsQ0FBQyxDQUFDLENBQUM7b0JBQ2hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQzNFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDZCxNQUFNO29CQUNQLENBQUM7b0JBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxtQ0FBMkIsRUFBRSxDQUFDO3dCQUM3QyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUMvRixJQUFJLEdBQUcsSUFBQSwrQkFBcUIsRUFBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDbEQsQ0FBQzt5QkFBTSxJQUFJLE9BQU8sT0FBTyxDQUFDLE9BQU8sS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDaEQsSUFBSSxHQUFHLElBQUEsK0JBQXFCLEVBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvQyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO3dCQUM3QixRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ3hELENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2RSxDQUFDO0tBQ0QsQ0FBQTtJQWhIWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQUVoQyxXQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxzQ0FBa0IsQ0FBQTtPQUxSLHNCQUFzQixDQWdIbEMifQ==