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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/services/views/common/viewsService"], function (require, exports, cancellation_1, lifecycle_1, observable_1, contextkey_1, instantiation_1, testResultService_1, testingContextKeys_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestCoverageService = exports.ITestCoverageService = void 0;
    exports.ITestCoverageService = (0, instantiation_1.createDecorator)('testCoverageService');
    let TestCoverageService = class TestCoverageService extends lifecycle_1.Disposable {
        constructor(contextKeyService, resultService, viewsService) {
            super();
            this.viewsService = viewsService;
            this.lastOpenCts = this._register(new lifecycle_1.MutableDisposable());
            this.selected = (0, observable_1.observableValue)('testCoverage', undefined);
            this._isOpenKey = testingContextKeys_1.TestingContextKeys.isTestCoverageOpen.bindTo(contextKeyService);
            this._register(resultService.onResultsChanged(evt => {
                if ('completed' in evt) {
                    const coverage = evt.completed.tasks.find(t => t.coverage.get());
                    if (coverage) {
                        this.openCoverage(coverage, false);
                    }
                    else {
                        this.closeCoverage();
                    }
                }
                else if ('removed' in evt && this.selected.get()) {
                    const taskId = this.selected.get()?.fromTaskId;
                    if (evt.removed.some(e => e.tasks.some(t => t.id === taskId))) {
                        this.closeCoverage();
                    }
                }
            }));
        }
        /** @inheritdoc */
        async openCoverage(task, focus = true) {
            this.lastOpenCts.value?.cancel();
            const cts = this.lastOpenCts.value = new cancellation_1.CancellationTokenSource();
            const coverage = task.coverage.get();
            if (!coverage) {
                return;
            }
            this.selected.set(coverage, undefined);
            this._isOpenKey.set(true);
            if (focus && !cts.token.isCancellationRequested) {
                this.viewsService.openView("workbench.view.testCoverage" /* Testing.CoverageViewId */, true);
            }
        }
        /** @inheritdoc */
        closeCoverage() {
            this._isOpenKey.set(false);
            this.selected.set(undefined, undefined);
        }
    };
    exports.TestCoverageService = TestCoverageService;
    exports.TestCoverageService = TestCoverageService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, testResultService_1.ITestResultService),
        __param(2, viewsService_1.IViewsService)
    ], TestCoverageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvdmVyYWdlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RDb3ZlcmFnZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY25GLFFBQUEsb0JBQW9CLEdBQUcsSUFBQSwrQkFBZSxFQUF1QixxQkFBcUIsQ0FBQyxDQUFDO0lBc0IxRixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBT2xELFlBQ3FCLGlCQUFxQyxFQUNyQyxhQUFpQyxFQUN0QyxZQUE0QztZQUUzRCxLQUFLLEVBQUUsQ0FBQztZQUZ3QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQVAzQyxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBMkIsQ0FBQyxDQUFDO1lBRWhGLGFBQVEsR0FBRyxJQUFBLDRCQUFlLEVBQTJCLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQVEvRixJQUFJLENBQUMsVUFBVSxHQUFHLHVDQUFrQixDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRWxGLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNuRCxJQUFJLFdBQVcsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUNqRSxJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUNkLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNwQyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUN0QixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxTQUFTLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztvQkFDcEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxVQUFVLENBQUM7b0JBQy9DLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUMvRCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsa0JBQWtCO1FBQ1gsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUF5QixFQUFFLEtBQUssR0FBRyxJQUFJO1lBQ2hFLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQ2pDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztZQUNuRSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUxQixJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLDZEQUF5QixJQUFJLENBQUMsQ0FBQztZQUMxRCxDQUFDO1FBQ0YsQ0FBQztRQUVELGtCQUFrQjtRQUNYLGFBQWE7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRCxDQUFBO0lBdERZLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBUTdCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLDRCQUFhLENBQUE7T0FWSCxtQkFBbUIsQ0FzRC9CIn0=