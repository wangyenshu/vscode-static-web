/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/progress/common/progress"], function (require, exports, event_1, lifecycle_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractProgressScope = exports.ScopedProgressIndicator = exports.EditorProgressIndicator = void 0;
    class EditorProgressIndicator extends lifecycle_1.Disposable {
        constructor(progressBar, group) {
            super();
            this.progressBar = progressBar;
            this.group = group;
            this.registerListeners();
        }
        registerListeners() {
            // Stop any running progress when the active editor changes or
            // the group becomes empty.
            // In contrast to the composite progress indicator, we do not
            // track active editor progress and replay it later (yet).
            this._register(this.group.onDidModelChange(e => {
                if (e.kind === 7 /* GroupModelChangeKind.EDITOR_ACTIVE */ ||
                    (e.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */ && this.group.isEmpty)) {
                    this.progressBar.stop().hide();
                }
            }));
        }
        show(infiniteOrTotal, delay) {
            // No editor open: ignore any progress reporting
            if (this.group.isEmpty) {
                return progress_1.emptyProgressRunner;
            }
            if (infiniteOrTotal === true) {
                return this.doShow(true, delay);
            }
            return this.doShow(infiniteOrTotal, delay);
        }
        doShow(infiniteOrTotal, delay) {
            if (typeof infiniteOrTotal === 'boolean') {
                this.progressBar.infinite().show(delay);
            }
            else {
                this.progressBar.total(infiniteOrTotal).show(delay);
            }
            return {
                total: (total) => {
                    this.progressBar.total(total);
                },
                worked: (worked) => {
                    if (this.progressBar.hasTotal()) {
                        this.progressBar.worked(worked);
                    }
                    else {
                        this.progressBar.infinite().show();
                    }
                },
                done: () => {
                    this.progressBar.stop().hide();
                }
            };
        }
        async showWhile(promise, delay) {
            // No editor open: ignore any progress reporting
            if (this.group.isEmpty) {
                try {
                    await promise;
                }
                catch (error) {
                    // ignore
                }
            }
            return this.doShowWhile(promise, delay);
        }
        async doShowWhile(promise, delay) {
            try {
                this.progressBar.infinite().show(delay);
                await promise;
            }
            catch (error) {
                // ignore
            }
            finally {
                this.progressBar.stop().hide();
            }
        }
    }
    exports.EditorProgressIndicator = EditorProgressIndicator;
    var ProgressIndicatorState;
    (function (ProgressIndicatorState) {
        let Type;
        (function (Type) {
            Type[Type["None"] = 0] = "None";
            Type[Type["Done"] = 1] = "Done";
            Type[Type["Infinite"] = 2] = "Infinite";
            Type[Type["While"] = 3] = "While";
            Type[Type["Work"] = 4] = "Work";
        })(Type = ProgressIndicatorState.Type || (ProgressIndicatorState.Type = {}));
        ProgressIndicatorState.None = { type: 0 /* Type.None */ };
        ProgressIndicatorState.Done = { type: 1 /* Type.Done */ };
        ProgressIndicatorState.Infinite = { type: 2 /* Type.Infinite */ };
        class While {
            constructor(whilePromise, whileStart, whileDelay) {
                this.whilePromise = whilePromise;
                this.whileStart = whileStart;
                this.whileDelay = whileDelay;
                this.type = 3 /* Type.While */;
            }
        }
        ProgressIndicatorState.While = While;
        class Work {
            constructor(total, worked) {
                this.total = total;
                this.worked = worked;
                this.type = 4 /* Type.Work */;
            }
        }
        ProgressIndicatorState.Work = Work;
    })(ProgressIndicatorState || (ProgressIndicatorState = {}));
    class ScopedProgressIndicator extends lifecycle_1.Disposable {
        constructor(progressBar, scope) {
            super();
            this.progressBar = progressBar;
            this.scope = scope;
            this.progressState = ProgressIndicatorState.None;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.scope.onDidChangeActive(() => {
                if (this.scope.isActive) {
                    this.onDidScopeActivate();
                }
                else {
                    this.onDidScopeDeactivate();
                }
            }));
        }
        onDidScopeActivate() {
            // Return early if progress state indicates that progress is done
            if (this.progressState.type === ProgressIndicatorState.Done.type) {
                return;
            }
            // Replay Infinite Progress from Promise
            if (this.progressState.type === 3 /* ProgressIndicatorState.Type.While */) {
                let delay;
                if (this.progressState.whileDelay > 0) {
                    const remainingDelay = this.progressState.whileDelay - (Date.now() - this.progressState.whileStart);
                    if (remainingDelay > 0) {
                        delay = remainingDelay;
                    }
                }
                this.doShowWhile(delay);
            }
            // Replay Infinite Progress
            else if (this.progressState.type === 2 /* ProgressIndicatorState.Type.Infinite */) {
                this.progressBar.infinite().show();
            }
            // Replay Finite Progress (Total & Worked)
            else if (this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */) {
                if (this.progressState.total) {
                    this.progressBar.total(this.progressState.total).show();
                }
                if (this.progressState.worked) {
                    this.progressBar.worked(this.progressState.worked).show();
                }
            }
        }
        onDidScopeDeactivate() {
            this.progressBar.stop().hide();
        }
        show(infiniteOrTotal, delay) {
            // Sort out Arguments
            if (typeof infiniteOrTotal === 'boolean') {
                this.progressState = ProgressIndicatorState.Infinite;
            }
            else {
                this.progressState = new ProgressIndicatorState.Work(infiniteOrTotal, undefined);
            }
            // Active: Show Progress
            if (this.scope.isActive) {
                // Infinite: Start Progressbar and Show after Delay
                if (this.progressState.type === 2 /* ProgressIndicatorState.Type.Infinite */) {
                    this.progressBar.infinite().show(delay);
                }
                // Finite: Start Progressbar and Show after Delay
                else if (this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ && typeof this.progressState.total === 'number') {
                    this.progressBar.total(this.progressState.total).show(delay);
                }
            }
            return {
                total: (total) => {
                    this.progressState = new ProgressIndicatorState.Work(total, this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ ? this.progressState.worked : undefined);
                    if (this.scope.isActive) {
                        this.progressBar.total(total);
                    }
                },
                worked: (worked) => {
                    // Verify first that we are either not active or the progressbar has a total set
                    if (!this.scope.isActive || this.progressBar.hasTotal()) {
                        this.progressState = new ProgressIndicatorState.Work(this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ ? this.progressState.total : undefined, this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ && typeof this.progressState.worked === 'number' ? this.progressState.worked + worked : worked);
                        if (this.scope.isActive) {
                            this.progressBar.worked(worked);
                        }
                    }
                    // Otherwise the progress bar does not support worked(), we fallback to infinite() progress
                    else {
                        this.progressState = ProgressIndicatorState.Infinite;
                        this.progressBar.infinite().show();
                    }
                },
                done: () => {
                    this.progressState = ProgressIndicatorState.Done;
                    if (this.scope.isActive) {
                        this.progressBar.stop().hide();
                    }
                }
            };
        }
        async showWhile(promise, delay) {
            // Join with existing running promise to ensure progress is accurate
            if (this.progressState.type === 3 /* ProgressIndicatorState.Type.While */) {
                promise = Promise.all([promise, this.progressState.whilePromise]);
            }
            // Keep Promise in State
            this.progressState = new ProgressIndicatorState.While(promise, delay || 0, Date.now());
            try {
                this.doShowWhile(delay);
                await promise;
            }
            catch (error) {
                // ignore
            }
            finally {
                // If this is not the last promise in the list of joined promises, skip this
                if (this.progressState.type !== 3 /* ProgressIndicatorState.Type.While */ || this.progressState.whilePromise === promise) {
                    // The while promise is either null or equal the promise we last hooked on
                    this.progressState = ProgressIndicatorState.None;
                    if (this.scope.isActive) {
                        this.progressBar.stop().hide();
                    }
                }
            }
        }
        doShowWhile(delay) {
            // Show Progress when active
            if (this.scope.isActive) {
                this.progressBar.infinite().show(delay);
            }
        }
    }
    exports.ScopedProgressIndicator = ScopedProgressIndicator;
    class AbstractProgressScope extends lifecycle_1.Disposable {
        get isActive() { return this._isActive; }
        constructor(scopeId, _isActive) {
            super();
            this.scopeId = scopeId;
            this._isActive = _isActive;
            this._onDidChangeActive = this._register(new event_1.Emitter());
            this.onDidChangeActive = this._onDidChangeActive.event;
        }
        onScopeOpened(scopeId) {
            if (scopeId === this.scopeId) {
                if (!this._isActive) {
                    this._isActive = true;
                    this._onDidChangeActive.fire();
                }
            }
        }
        onScopeClosed(scopeId) {
            if (scopeId === this.scopeId) {
                if (this._isActive) {
                    this._isActive = false;
                    this._onDidChangeActive.fire();
                }
            }
        }
    }
    exports.AbstractProgressScope = AbstractProgressScope;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NJbmRpY2F0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcHJvZ3Jlc3MvYnJvd3Nlci9wcm9ncmVzc0luZGljYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSx1QkFBd0IsU0FBUSxzQkFBVTtRQUV0RCxZQUNrQixXQUF3QixFQUN4QixLQUF1QjtZQUV4QyxLQUFLLEVBQUUsQ0FBQztZQUhTLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ3hCLFVBQUssR0FBTCxLQUFLLENBQWtCO1lBSXhDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFFeEIsOERBQThEO1lBQzlELDJCQUEyQjtZQUMzQiw2REFBNkQ7WUFDN0QsMERBQTBEO1lBQzFELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDOUMsSUFDQyxDQUFDLENBQUMsSUFBSSwrQ0FBdUM7b0JBQzdDLENBQUMsQ0FBQyxDQUFDLElBQUksOENBQXNDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFDbkUsQ0FBQztvQkFDRixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFJRCxJQUFJLENBQUMsZUFBOEIsRUFBRSxLQUFjO1lBRWxELGdEQUFnRDtZQUNoRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sOEJBQW1CLENBQUM7WUFDNUIsQ0FBQztZQUVELElBQUks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