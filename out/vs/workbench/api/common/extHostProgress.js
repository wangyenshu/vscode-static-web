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
define(["require", "exports", "./extHostTypeConverters", "vs/platform/progress/common/progress", "vs/base/common/cancellation", "vs/base/common/decorators", "vs/base/common/errors"], function (require, exports, extHostTypeConverters_1, progress_1, cancellation_1, decorators_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostProgress = void 0;
    class ExtHostProgress {
        constructor(proxy) {
            this._handles = 0;
            this._mapHandleToCancellationSource = new Map();
            this._proxy = proxy;
        }
        async withProgress(extension, options, task) {
            const handle = this._handles++;
            const { title, location, cancellable } = options;
            const source = { label: extension.displayName || extension.name, id: extension.identifier.value };
            this._proxy.$startProgress(handle, { location: extHostTypeConverters_1.ProgressLocation.from(location), title, source, cancellable }, !extension.isUnderDevelopment ? extension.identifier.value : undefined).catch(errors_1.onUnexpectedExternalError);
            return this._withProgress(handle, task, !!cancellable);
        }
        _withProgress(handle, task, cancellable) {
            let source;
            if (cancellable) {
                source = new cancellation_1.CancellationTokenSource();
                this._mapHandleToCancellationSource.set(handle, source);
            }
            const progressEnd = (handle) => {
                this._proxy.$progressEnd(handle);
                this._mapHandleToCancellationSource.delete(handle);
                source?.dispose();
            };
            let p;
            try {
                p = task(new ProgressCallback(this._proxy, handle), cancellable && source ? source.token : cancellation_1.CancellationToken.None);
            }
            catch (err) {
                progressEnd(handle);
                throw err;
            }
            p.then(result => progressEnd(handle), err => progressEnd(handle));
            return p;
        }
        $acceptProgressCanceled(handle) {
            const source = this._mapHandleToCancellationSource.get(handle);
            if (source) {
                source.cancel();
                this._mapHandleToCancellationSource.delete(handle);
            }
        }
    }
    exports.ExtHostProgress = ExtHostProgress;
    function mergeProgress(result, currentValue) {
        result.message = currentValue.message;
        if (typeof currentValue.increment === 'number') {
            if (typeof result.increment === 'number') {
                result.increment += currentValue.increment;
            }
            else {
                result.increment = currentValue.increment;
            }
        }
        return result;
    }
    class ProgressCallback extends progress_1.Progress {
        constructor(_proxy, _handle) {
            super(p => this.throttledReport(p));
            this._proxy = _proxy;
            this._handle = _handle;
        }
        throttledReport(p) {
            this._proxy.$progressReport(this._handle, p);
        }
    }
    __decorate([
        (0, decorators_1.throttle)(100, (result, currentValue) => mergeProgress(result, currentValue), () => Object.create(null))
    ], ProgressCallback.prototype, "throttledReport", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFByb2dyZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFByb2dyZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQVdoRyxNQUFhLGVBQWU7UUFNM0IsWUFBWSxLQUE4QjtZQUhsQyxhQUFRLEdBQVcsQ0FBQyxDQUFDO1lBQ3JCLG1DQUE4QixHQUF5QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBR3hGLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWSxDQUFJLFNBQWdDLEVBQUUsT0FBd0IsRUFBRSxJQUFrRjtZQUNuSyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDL0IsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBQ2pELE1BQU0sTUFBTSxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVsRyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsd0NBQWdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsa0NBQXlCLENBQUMsQ0FBQztZ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