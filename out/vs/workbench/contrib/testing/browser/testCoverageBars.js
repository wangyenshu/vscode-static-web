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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/common/assert", "vs/base/common/htmlContent", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/observable", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/hover/browser/hover", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/testCoverage", "vs/workbench/contrib/testing/common/testCoverageService"], function (require, exports, dom_1, hoverDelegateFactory_1, assert_1, htmlContent_1, lazy_1, lifecycle_1, numbers_1, observable_1, types_1, nls_1, configuration_1, hover_1, colorRegistry_1, configuration_2, testCoverage_1, testCoverageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerTestCoverageBars = exports.ManagedTestCoverageBars = void 0;
    let ManagedTestCoverageBars = class ManagedTestCoverageBars extends lifecycle_1.Disposable {
        /** Gets whether coverage is currently visible for the resource. */
        get visible() {
            return !!this._coverage;
        }
        constructor(options, configurationService, hoverService) {
            super();
            this.options = options;
            this.configurationService = configurationService;
            this.hoverService = hoverService;
            this.el = new lazy_1.Lazy(() => {
                if (this.options.compact) {
                    const el = (0, dom_1.h)('.test-coverage-bars.compact', [
                        (0, dom_1.h)('.tpc@overall'),
                        (0, dom_1.h)('.bar@tpcBar'),
                    ]);
                    this.attachHover(el.tpcBar, getOverallHoverText);
                    return el;
                }
                else {
                    const el = (0, dom_1.h)('.test-coverage-bars', [
                        (0, dom_1.h)('.tpc@overall'),
                        (0, dom_1.h)('.bar@statement'),
                        (0, dom_1.h)('.bar@function'),
                        (0, dom_1.h)('.bar@branch'),
                    ]);
                    this.attachHover(el.statement, stmtCoverageText);
                    this.attachHover(el.function, fnCoverageText);
                    this.attachHover(el.branch, branchCoverageText);
                    return el;
                }
            });
            this.visibleStore = this._register(new lifecycle_1.DisposableStore());
            this.customHovers = [];
        }
        attachHover(target, factory) {
            this._register(this.hoverService.setupUpdatableHover((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), target, () => this._coverage && factory(this._coverage)));
        }
        setCoverageInfo(coverage) {
            const ds = this.visibleStore;
            if (!coverage) {
                if (this._coverage) {
                    this._coverage = undefined;
                    this.customHovers.forEach(c => c.hide());
                    ds.clear();
                }
                return;
            }
            if (!this._coverage) {
                const root = this.el.value.root;
                ds.add((0, lifecycle_1.toDisposable)(() => this.options.container.removeChild(root)));
                this.options.container.appendChild(root);
                ds.add(this.configurationService.onDidChangeConfiguration(c => {
                    if (!this._coverage) {
                        return;
                    }
                    if (c.affectsConfiguration("testing.displayedCoveragePercent" /* TestingConfigKeys.CoveragePercent */) || c.affectsConfiguration("testing.coverageBarThresholds" /* TestingConfigKeys.CoverageBarThresholds */)) {
                        this.doRender(this._coverage);
                    }
                }));
            }
            this._coverage = coverage;
            this.doRender(coverage);
        }
        doRender(coverage) {
            const el = this.el.value;
            const precision = this.options.compact ? 0 : 2;
            const thresholds = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.coverageBarThresholds" /* TestingConfigKeys.CoverageBarThresholds */);
            const overallStat = calculateDisplayedStat(coverage, (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.displayedCoveragePercent" /* TestingConfigKeys.CoveragePercent */));
            el.overall.textContent = displayPercent(overallStat, precision);
            if ('tpcBar' in el) { // compact mode
                renderBar(el.tpcBar, overallStat, false, thresholds);
            }
            else {
                renderBar(el.statement, percent(coverage.statement), coverage.statement.total === 0, thresholds);
                renderBar(el.function, coverage.declaration && percent(coverage.declaration), coverage.declaration?.total === 0, thresholds);
                renderBar(el.branch, coverage.branch && percent(coverage.branch), coverage.branch?.total === 0, thresholds);
            }
        }
    };
    exports.ManagedTestCoverageBars = ManagedTestCoverageBars;
    exports.ManagedTestCoverageBars = ManagedTestCoverageBars = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, hover_1.IHoverService)
    ], ManagedTestCoverageBars);
    const percent = (cc) => (0, numbers_1.clamp)(cc.total === 0 ? 1 : cc.covered / cc.total, 0, 1);
    const epsilon = 10e-8;
    const barWidth = 16;
    const renderBar = (bar, pct, isZero, thresholds) => {
        if (pct === undefined) {
            bar.style.display = 'none';
            return;
        }
        bar.style.display = 'block';
        bar.style.width = `${barWidth}px`;
        // this is floored so the bar is only completely filled at 100% and not 99.9%
        bar.style.setProperty('--test-bar-width', `${Math.floor(pct * 16)}px`);
        if (isZero) {
            bar.style.color = 'currentColor';
            bar.style.opacity = '0.5';
            return;
        }
        let best = colorThresholds[0].color; //  red
        let distance = pct;
        for (const { key, color } of colorThresholds) {
            const t = thresholds[key] / 100;
            if (t && pct >= t && pct - t < distance) {
                best = color;
                distance = pct - t;
            }
        }
        bar.style.color = best;
        bar.style.opacity = '1';
    };
    const colorThresholds = [
        { color: `var(${(0, colorRegistry_1.asCssVariableName)(colorRegistry_1.chartsRed)})`, key: 'red' },
        { color: `var(${(0, colorRegistry_1.asCssVariableName)(colorRegistry_1.chartsYellow)})`, key: 'yellow' },
        { color: `var(${(0, colorRegistry_1.asCssVariableName)(colorRegistry_1.chartsGreen)})`, key: 'green' },
    ];
    const calculateDisplayedStat = (coverage, method) => {
        switch (method) {
            case "statement" /* TestingDisplayedCoveragePercent.Statement */:
                return percent(coverage.statement);
            case "minimum" /* TestingDisplayedCoveragePercent.Minimum */: {
                let value = percent(coverage.statement);
                if (coverage.branch) {
                    value = Math.min(value, percent(coverage.branch));
                }
                if (coverage.declaration) {
                    value = Math.min(value, percent(coverage.declaration));
                }
                return value;
            }
            case "totalCoverage" /* TestingDisplayedCoveragePercent.TotalCoverage */:
                return (0, testCoverage_1.getTotalCoveragePercent)(coverage.statement, coverage.branch, coverage.declaration);
            default:
                (0, assert_1.assertNever)(method);
        }
    };
    const displayPercent = (value, precision = 2) => {
        const display = (value * 100).toFixed(precision);
        // avoid showing 100% coverage if it just rounds up:
        if (value < 1 - epsilon && display === '100') {
            return `${100 - (10 ** -precision)}%`;
        }
        return `${display}%`;
    };
    const nf = new Intl.NumberFormat();
    const stmtCoverageText = (coverage) => (0, nls_1.localize)('statementCoverage', '{0}/{1} statements covered ({2})', nf.format(coverage.statement.covered), nf.format(coverage.statement.total), displayPercent(percent(coverage.statement)));
    const fnCoverageText = (coverage) => coverage.declaration && (0, nls_1.localize)('functionCoverage', '{0}/{1} functions covered ({2})', nf.format(coverage.declaration.covered), nf.format(coverage.declaration.total), displayPercent(percent(coverage.declaration)));
    const branchCoverageText = (coverage) => coverage.branch && (0, nls_1.localize)('branchCoverage', '{0}/{1} branches covered ({2})', nf.format(coverage.branch.covered), nf.format(coverage.branch.total), displayPercent(percent(coverage.branch)));
    const getOverallHoverText = (coverage) => {
        const str = [
            stmtCoverageText(coverage),
            fnCoverageText(coverage),
            branchCoverageText(coverage),
        ].filter(types_1.isDefined).join('\n\n');
        return {
            markdown: new htmlContent_1.MarkdownString().appendText(str),
            markdownNotSupportedFallback: str
        };
    };
    /**
     * Renders test coverage bars for a resource in the given container. It will
     * not render anything unless a test coverage report has been opened.
     */
    let ExplorerTestCoverageBars = class ExplorerTestCoverageBars extends ManagedTestCoverageBars {
        constructor(options, configurationService, hoverService, testCoverageService) {
            super(options, configurationService, hoverService);
            this.resource = (0, observable_1.observableValue)(this, undefined);
            const isEnabled = (0, configuration_2.observeTestingConfiguration)(configurationService, "testing.showCoverageInExplorer" /* TestingConfigKeys.ShowCoverageInExplorer */);
            this._register((0, observable_1.autorun)(async (reader) => {
                let info;
                const coverage = testCoverageService.selected.read(reader);
                if (coverage && isEnabled.read(reader)) {
                    const resource = this.resource.read(reader);
                    if (resource) {
                        info = coverage.getComputedForUri(resource);
                    }
                }
                this.setCoverageInfo(info);
            }));
        }
        /** @inheritdoc */
        setResource(resource, transaction) {
            this.resource.set(resource, transaction);
        }
        setCoverageInfo(coverage) {
            super.setCoverageInfo(coverage);
            this.options.container?.classList.toggle('explorer-item-with-test-coverage', this.visible);
        }
    };
    exports.ExplorerTestCoverageBars = ExplorerTestCoverageBars;
    exports.ExplorerTestCoverageBars = ExplorerTestCoverageBars = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, hover_1.IHoverService),
        __param(3, testCoverageService_1.ITestCoverageService)
    ], ExplorerTestCoverageBars);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvdmVyYWdlQmFycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvc3RhcmsvdnNjb2RlLXN0YXRpYy13ZWIvdGhpcmRfcGFydHkvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci90ZXN0Q292ZXJhZ2VCYXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNDekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQTJCdEQsbUVBQW1FO1FBQ25FLElBQVcsT0FBTztZQUNqQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxZQUNvQixPQUFnQyxFQUM1QixvQkFBNEQsRUFDcEUsWUFBNEM7WUFFM0QsS0FBSyxFQUFFLENBQUM7WUFKVyxZQUFPLEdBQVAsT0FBTyxDQUF5QjtZQUNYLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFqQzNDLE9BQUUsR0FBRyxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25DLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDMUIsTUFBTSxFQUFFLEdBQUcsSUFBQSxPQUFDLEVBQUMsNkJBQTZCLEVBQUU7d0JBQzNDLElBQUEsT0FBQyxFQUFDLGNBQWMsQ0FBQzt3QkFDakIsSUFBQSxPQUFDLEVBQUMsYUFBYSxDQUFDO3FCQUNoQixDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLG1CQUFtQixDQUFDLENBQUM7b0JBQ2pELE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLEVBQUUsR0FBRyxJQUFBLE9BQUMsRUFBQyxxQkFBcUIsRUFBRTt3QkFDbkMsSUFB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