/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, event_1, uri_1, extHostTypeConverters_1, extHostTypes_1, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookDocumentSaveParticipant = void 0;
    class ExtHostNotebookDocumentSaveParticipant {
        constructor(_logService, _notebooksAndEditors, _mainThreadBulkEdits, _thresholds = { timeout: 1500, errors: 3 }) {
            this._logService = _logService;
            this._notebooksAndEditors = _notebooksAndEditors;
            this._mainThreadBulkEdits = _mainThreadBulkEdits;
            this._thresholds = _thresholds;
            this._onWillSaveNotebookDocumentEvent = new event_1.AsyncEmitter();
        }
        dispose() {
        }
        getOnWillSaveNotebookDocumentEvent(extension) {
            return (listener, thisArg, disposables) => {
                const wrappedListener = function wrapped(e) { listener.call(thisArg, e); };
                wrappedListener.extension = extension;
                return this._onWillSaveNotebookDocumentEvent.event(wrappedListener, undefined, disposables);
            };
        }
        async $participateInSave(resource, reason, token) {
            const revivedUri = uri_1.URI.revive(resource);
            const document = this._notebooksAndEditors.getNotebookDocument(revivedUri);
            if (!document) {
                throw new Error('Unable to resolve notebook document');
            }
            const edits = [];
            await this._onWillSaveNotebookDocumentEvent.fireAsync({ notebook: document.apiNotebook, reason: extHostTypeConverters_1.TextDocumentSaveReason.to(reason) }, token, async (thenable, listener) => {
                const now = Date.now();
                const data = await await Promise.resolve(thenable);
                if (Date.now() - now > this._thresholds.timeout) {
                    this._logService.warn('onWillSaveNotebookDocument-listener from extension', listener.extension.identifier);
                }
                if (token.isCancellationRequested) {
                    return;
                }
                if (data) {
                    if (data instanceof extHostTypes_1.WorkspaceEdit) {
                        edits.push(data);
                    }
                    else {
                        // ignore invalid data
                        this._logService.warn('onWillSaveNotebookDocument-listener from extension', listener.extension.identifier, 'ignored due to invalid data');
                    }
                }
                return;
            });
            if (token.isCancellationRequested) {
                return false;
            }
            if (edits.length === 0) {
                return true;
            }
            const dto = { edits: [] };
            for (const edit of edits) {
                const { edits } = extHostTypeConverters_1.WorkspaceEdit.from(edit);
                dto.edits = dto.edits.concat(edits);
            }
            return this._mainThreadBulkEdits.$tryApplyWorkspaceEdit(new proxyIdentifier_1.SerializableObjectWithBuffers(dto));
        }
    }
    exports.ExtHostNotebookDocumentSaveParticipant = ExtHostNotebookDocumentSaveParticipant;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rRG9jdW1lbnRTYXZlUGFydGljaXBhbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Tm90ZWJvb2tEb2N1bWVudFNhdmVQYXJ0aWNpcGFudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQmhHLE1BQWEsc0NBQXNDO1FBSWxELFlBQ2tCLFdBQXdCLEVBQ3hCLG9CQUErQyxFQUMvQyxvQkFBOEMsRUFDOUMsY0FBbUQsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUU7WUFIL0UsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDeEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQUMvQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTBCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFvRTtZQU5oRixxQ0FBZ0MsR0FBRyxJQUFJLG9CQUFZLEVBQWlDLENBQUM7UUFRdEcsQ0FBQztRQUVELE9BQU87UUFDUCxDQUFDO1FBRUQsa0NBQWtDLENBQUMsU0FBZ0M7WUFDbEUsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEVBQUU7Z0JBQ3pDLE1BQU0sZUFBZSxHQUFzRCxTQUFTLE9BQU8sQ0FBQyxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlILGVBQWUsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2dCQUN0QyxPQUFPLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM3RixDQUFDLENBQUM7UUFDSCxDQUFDO1FBRUQs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