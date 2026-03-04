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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "./inlineChatSessionService", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, errors_1, lifecycle_1, network_1, resources_1, inlineChatController_1, inlineChatSessionService_1, notebookEditorService_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatNotebookContribution = void 0;
    let InlineChatNotebookContribution = class InlineChatNotebookContribution {
        constructor(sessionService, notebookEditorService) {
            this._store = new lifecycle_1.DisposableStore();
            this._store.add(sessionService.registerSessionKeyComputer(network_1.Schemas.vscodeNotebookCell, {
                getComparisonKey: (editor, uri) => {
                    const data = notebookCommon_1.CellUri.parse(uri);
                    if (!data) {
                        throw (0, errors_1.illegalState)('Expected notebook cell uri');
                    }
                    let fallback;
                    for (const notebookEditor of notebookEditorService.listNotebookEditors()) {
                        if (notebookEditor.hasModel() && (0, resources_1.isEqual)(notebookEditor.textModel.uri, data.notebook)) {
                            const candidate = `<notebook>${notebookEditor.getId()}#${uri}`;
                            if (!fallback) {
                                fallback = candidate;
                            }
                            // find the code editor in the list of cell-code editors
                            if (notebookEditor.codeEditors.find((tuple) => tuple[1] === editor)) {
                                return candidate;
                            }
                            // 	// reveal cell and try to find code editor again
                            // 	const cell = notebookEditor.getCellByHandle(data.handle);
                            // 	if (cell) {
                            // 		notebookEditor.revealInViewAtTop(cell);
                            // 		if (notebookEditor.codeEditors.find((tuple) => tuple[1] === editor)) {
                            // 			return candidate;
                            // 		}
                            // 	}
                        }
                    }
                    if (fallback) {
                        return fallback;
                    }
                    throw (0, errors_1.illegalState)('Expected notebook editor');
                }
            }));
            this._store.add(sessionService.onWillStartSession(newSessionEditor => {
                const candidate = notebookCommon_1.CellUri.parse(newSessionEditor.getModel().uri);
                if (!candidate) {
                    return;
                }
                for (const notebookEditor of notebookEditorService.listNotebookEditors()) {
                    if ((0, resources_1.isEqual)(notebookEditor.textModel?.uri, candidate.notebook)) {
                        let found = false;
                        const editors = [];
                        for (const [, codeEditor] of notebookEditor.codeEditors) {
                            editors.push(codeEditor);
                            found = codeEditor === newSessionEditor || found;
                        }
                        if (found) {
                            // found the this editor in the outer notebook editor -> make sure to
                            // cancel all sibling sessions
                            for (const editor of editors) {
                                if (editor !== newSessionEditor) {
                                    inlineChatController_1.InlineChatController.get(editor)?.finishExistingSession();
                                }
                            }
                            break;
                        }
                    }
                }
            }));
        }
        dispose() {
            this._store.dispose();
        }
    };
    exports.InlineChatNotebookContribution = InlineChatNotebookContribution;
    exports.InlineChatNotebookContribution = InlineChatNotebookContribution = __decorate([
        __param(0, inlineChatSessionService_1.IInlineChatSessionService),
        __param(1, notebookEditorService_1.INotebookEditorService)
    ], InlineChatNotebookContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdE5vdGVib29rLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC9icm93c2VyL2lubGluZUNoYXROb3RlYm9vay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBOEI7UUFJMUMsWUFDNEIsY0FBeUMsRUFDNUMscUJBQTZDO1lBSnJELFdBQU0sR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQU8vQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsMEJBQTBCLENBQUMsaUJBQU8sQ0FBQyxrQkFBa0IsRUFBRTtnQkFDckYsZ0JBQWdCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUU7b0JBQ2pDLE1BQU0sSUFBSSxHQUFHLHdCQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNoQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ1gsTUFBTSxJQUFBLHFCQUFZLEVBQUMsNEJBQTRCLENBQUMsQ0FBQztvQkFDbEQsQ0FBQztvQkFDRCxJQUFJLFFBQTRCLENBQUM7b0JBQ2pDLEtBQUssTUFBTSxjQUFjLElBQUkscUJBQXFCLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO3dCQUMxRSxJQUFJLGNBQWMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxJQUFBLG1CQUFPLEVBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7NEJBRXZGLE1BQU0sU0FBUyxHQUFHLGFBQWEsY0FBYyxDQUFDLEtBQUssRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDOzRCQUUvRCxJQUFJ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