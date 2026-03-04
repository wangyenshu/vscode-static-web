/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/errors", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/linkedList", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, uri_1, errors_1, extHostTypes_1, extHostTypeConverters_1, linkedList_1, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocumentSaveParticipant = void 0;
    class ExtHostDocumentSaveParticipant {
        constructor(_logService, _documents, _mainThreadBulkEdits, _thresholds = { timeout: 1500, errors: 3 }) {
            this._logService = _logService;
            this._documents = _documents;
            this._mainThreadBulkEdits = _mainThreadBulkEdits;
            this._thresholds = _thresholds;
            this._callbacks = new linkedList_1.LinkedList();
            this._badListeners = new WeakMap();
            //
        }
        dispose() {
            this._callbacks.clear();
        }
        getOnWillSaveTextDocumentEvent(extension) {
            return (listener, thisArg, disposables) => {
                const remove = this._callbacks.push([listener, thisArg, extension]);
                const result = { dispose: remove };
                if (Array.isArray(disposables)) {
                    disposables.push(result);
                }
                return result;
            };
        }
        async $participateInSave(data, reason) {
            const resource = uri_1.URI.revive(data);
            let didTimeout = false;
            const didTimeoutHandle = setTimeout(() => didTimeout = true, this._thresholds.timeout);
            const results = [];
            try {
                for (const listener of [...this._callbacks]) { // copy to prevent concurrent modifications
                    if (didTimeout) {
                        // timeout - no more listeners
                        break;
                    }
                    const document = this._documents.getDocument(resource);
                    const success = await this._deliverEventAsyncAndBlameBadListeners(listener, { document, reason: extHostTypeConverters_1.TextDocumentSaveReason.to(reason) });
                    results.push(success);
                }
            }
            finally {
                clearTimeout(didTimeoutHandle);
            }
            return results;
        }
        _deliverEventAsyncAndBlameBadListeners([listener, thisArg, extension], stubEvent) {
            const errors = this._badListeners.get(listener);
            if (typeof errors === 'number' && errors > this._thresholds.errors) {
                // bad listener - ignore
                return Promise.resolve(false);
            }
            return this._deliverEventAsync(extension, listener, thisArg, stubEvent).then(() => {
                // don't send result across the wire
                return true;
            }, err => {
                this._logService.error(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' threw ERROR`);
                this._logService.error(err);
                if (!(err instanceof Error) || err.message !== 'concurrent_edits') {
                    const errors = this._badListeners.get(listener);
                    this._badListeners.set(listener, !errors ? 1 : errors + 1);
                    if (typeof errors === 'number' && errors > this._thresholds.errors) {
                        this._logService.info(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' will now be IGNORED because of timeouts and/or errors`);
                    }
                }
                return false;
            });
        }
        _deliverEventAsync(extension, listener, thisArg, stubEvent) {
            const promises = [];
            const t1 = Date.now();
            const { document, reason } = stubEvent;
            const { version } = document;
            const event = Object.freeze({
                document,
                reason,
                waitUntil(p) {
                    if (Object.isFrozen(promises)) {
                        throw (0, errors_1.illegalState)('waitUntil can not be called async');
                    }
                    promises.push(Promise.resolve(p));
                }
            });
            try {
                // fire event
                listener.apply(thisArg, [event]);
            }
            catch (err) {
                return Promise.reject(err);
            }
            // freeze promises after event call
            Object.freeze(promises);
            return new Promise((resolve, reject) => {
                // join on all listener promises, reject after timeout
                const handle = setTimeout(() => reject(new Error('timeout')), this._thresholds.timeout);
                return Promise.all(promises).then(edits => {
                    this._logService.debug(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' finished after ${(Date.now() - t1)}ms`);
                    clearTimeout(handle);
                    resolve(edits);
                }).catch(err => {
                    clearTimeout(handle);
                    reject(err);
                });
            }).then(values => {
                const dto = { edits: [] };
                for (const value of values) {
                    if (Array.isArray(value) && value.every(e => e instanceof extHostTypes_1.TextEdit)) {
                        for (const { newText, newEol, range } of value) {
                            dto.edits.push({
                                resource: document.uri,
                                versionId: undefined,
                                textEdit: {
                                    range: range && extHostTypeConverters_1.Range.from(range),
                                    text: newText,
                                    eol: newEol && extHostTypeConverters_1.EndOfLine.from(newEol),
                                }
                            });
                        }
                    }
                }
                // apply edits if any and if document
                // didn't change somehow in the meantime
                if (dto.edits.length === 0) {
                    return undefined;
                }
                if (version === document.version) {
                    return this._mainThreadBulkEdits.$tryApplyWorkspaceEdit(new proxyIdentifier_1.SerializableObjectWithBuffers(dto));
                }
                return Promise.reject(new Error('concurrent_edits'));
            });
        }
    }
    exports.ExtHostDocumentSaveParticipant = ExtHostDocumentSaveParticipant;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50U2F2ZVBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdERvY3VtZW50U2F2ZVBhcnRpY2lwYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBYSw4QkFBOEI7UUFLMUMsWUFDa0IsV0FBd0IsRUFDeEIsVUFBNEIsRUFDNUIsb0JBQThDLEVBQzlDLGNBQW1ELEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFO1lBSC9FLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ3hCLGVBQVUsR0FBVixVQUFVLENBQWtCO1lBQzVCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMEI7WUFDOUMsZ0JBQVcsR0FBWCxXQUFXLENBQW9FO1lBUGhGLGVBQVUsR0FBRyxJQUFJLHVCQUFVLEVBQVksQ0FBQztZQUN4QyxrQkFBYSxHQUFHLElBQUksT0FBTyxFQUFvQixDQUFDO1lBUWhFLEVBQUU7UUFDSCxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVELDhCQUE4QixDQUFDLFNBQWdDO1lBQzlELE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxFQUFFO2dCQUN6QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxNQUFNLEdBQUcsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUM7Z0JBQ25DLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMs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