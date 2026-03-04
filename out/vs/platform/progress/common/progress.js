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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, async_1, cancellation_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IEditorProgressService = exports.LongRunningOperation = exports.UnmanagedProgress = exports.AsyncProgress = exports.Progress = exports.emptyProgressRunner = exports.ProgressLocation = exports.IProgressService = void 0;
    exports.IProgressService = (0, instantiation_1.createDecorator)('progressService');
    var ProgressLocation;
    (function (ProgressLocation) {
        ProgressLocation[ProgressLocation["Explorer"] = 1] = "Explorer";
        ProgressLocation[ProgressLocation["Scm"] = 3] = "Scm";
        ProgressLocation[ProgressLocation["Extensions"] = 5] = "Extensions";
        ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
        ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
        ProgressLocation[ProgressLocation["Dialog"] = 20] = "Dialog";
    })(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
    exports.emptyProgressRunner = Object.freeze({
        total() { },
        worked() { },
        done() { }
    });
    class Progress {
        static { this.None = Object.freeze({ report() { } }); }
        get value() { return this._value; }
        constructor(callback) {
            this.callback = callback;
        }
        report(item) {
            this._value = item;
            this.callback(this._value);
        }
    }
    exports.Progress = Progress;
    class AsyncProgress {
        get value() { return this._value; }
        constructor(callback) {
            this.callback = callback;
        }
        report(item) {
            if (!this._asyncQueue) {
                this._asyncQueue = [item];
            }
            else {
                this._asyncQueue.push(item);
            }
            this._processAsyncQueue();
        }
        async _processAsyncQueue() {
            if (this._processingAsyncQueue) {
                return;
            }
            try {
                this._processingAsyncQueue = true;
                while (this._asyncQueue && this._asyncQueue.length) {
                    const item = this._asyncQueue.shift();
                    this._value = item;
                    await this.callback(this._value);
                }
            }
            finally {
                this._processingAsyncQueue = false;
                const drainListener = this._drainListener;
                this._drainListener = undefined;
                drainListener?.();
            }
        }
        drain() {
            if (this._processingAsyncQueue) {
                return new Promise(resolve => {
                    const prevListener = this._drainListener;
                    this._drainListener = () => {
                        prevListener?.();
                        resolve();
                    };
                });
            }
            return Promise.resolve();
        }
    }
    exports.AsyncProgress = AsyncProgress;
    /**
     * RAII-style progress instance that allows imperative reporting and hides
     * once `dispose()` is called.
     */
    let UnmanagedProgress = class UnmanagedProgress extends lifecycle_1.Disposable {
        constructor(options, progressService) {
            super();
            this.deferred = new async_1.DeferredPromise();
            progressService.withProgress(options, reporter => {
                this.reporter = reporter;
                if (this.lastStep) {
                    reporter.report(this.lastStep);
                }
                return this.deferred.p;
            });
            this._register((0, lifecycle_1.toDisposable)(() => this.deferred.complete()));
        }
        report(step) {
            if (this.reporter) {
                this.reporter.report(step);
            }
            else {
                this.lastStep = step;
            }
        }
    };
    exports.UnmanagedProgress = UnmanagedProgress;
    exports.UnmanagedProgress = UnmanagedProgress = __decorate([
        __param(1, exports.IProgressService)
    ], UnmanagedProgress);
    class LongRunningOperation extends lifecycle_1.Disposable {
        constructor(progressIndicator) {
            super();
            this.progressIndicator = progressIndicator;
            this.currentOperationId = 0;
            this.currentOperationDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        start(progressDelay) {
            // Stop any previous operation
            this.stop();
            // Start new
            const newOperationId = ++this.currentOperationId;
            const newOperationToken = new cancellation_1.CancellationTokenSource();
            this.currentProgressTimeout = setTimeout(() => {
                if (newOperationId === this.currentOperationId) {
                    this.currentProgressRunner = this.progressIndicator.show(true);
                }
            }, progressDelay);
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(this.currentProgressTimeout)));
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => newOperationToken.cancel()));
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => this.currentProgressRunner ? this.currentProgressRunner.done() : undefined));
            return {
                id: newOperationId,
                token: newOperationToken.token,
                stop: () => this.doStop(newOperationId),
                isCurrent: () => this.currentOperationId === newOperationId
            };
        }
        stop() {
            this.doStop(this.currentOperationId);
        }
        doStop(operationId) {
            if (this.currentOperationId === operationId) {
                this.currentOperationDisposables.clear();
            }
        }
    }
    exports.LongRunningOperation = LongRunningOperation;
    exports.IEditorProgressService = (0, instantiation_1.createDecorator)('editorProgressService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9wcm9ncmVzcy9jb21tb24vcHJvZ3Jlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU25GLFFBQUEsZ0JBQWdCLEdBQUcsSUFBQSwrQkFBZSxFQUFtQixpQkFBaUIsQ0FBQyxDQUFDO0lBK0JyRixJQUFrQixnQkFPakI7SUFQRCxXQUFrQixnQkFBZ0I7UUFDakMsK0RBQVksQ0FBQTtRQUNaLHFEQUFPLENBQUE7UUFDUCxtRUFBYyxDQUFBO1FBQ2QsNERBQVcsQ0FBQTtRQUNYLHdFQUFpQixDQUFBO1FBQ2pCLDREQUFXLENBQUE7SUFDWixDQUFDLEVBUGlCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBT2pDO0lBaURZLFFBQUEsbUJBQW1CLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBa0I7UUFDakUsS0FBSyxLQUFLLENBQUM7UUFDWCxNQUFNLEtBQUssQ0FBQztRQUNaLElBQUksS0FBSyxDQUFDO0tBQ1YsQ0FBQyxDQUFDO0lBTUgsTUFBYSxRQUFRO2lCQUVKLFNBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFxQixFQUFFLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRzNFLElBQUksS0FBSyxLQUFvQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRWxELFlBQW9CLFFBQThCO1lBQTlCLGFBQVEsR0FBUixRQUFRLENBQXNCO1FBQ2xELENBQUM7UUFFRCxNQUFNLENBQUMsSUFBTztZQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUM7O0lBYkYsNEJBY0M7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