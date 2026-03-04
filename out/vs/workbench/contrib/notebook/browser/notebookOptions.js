/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/pixelRatio", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/browser/config/fontMeasurements", "vs/editor/common/config/fontInfo", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, pixelRatio_1, event_1, lifecycle_1, types_1, fontMeasurements_1, fontInfo_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOptions = exports.OutputInnerContainerTopPadding = void 0;
    const SCROLLABLE_ELEMENT_PADDING_TOP = 18;
    exports.OutputInnerContainerTopPadding = 4;
    const defaultConfigConstants = Object.freeze({
        codeCellLeftMargin: 28,
        cellRunGutter: 32,
        markdownCellTopMargin: 8,
        markdownCellBottomMargin: 8,
        markdownCellLeftMargin: 0,
        markdownCellGutter: 32,
        focusIndicatorLeftMargin: 4
    });
    const compactConfigConstants = Object.freeze({
        codeCellLeftMargin: 8,
        cellRunGutter: 36,
        markdownCellTopMargin: 6,
        markdownCellBottomMargin: 6,
        markdownCellLeftMargin: 8,
        markdownCellGutter: 36,
        focusIndicatorLeftMargin: 4
    });
    class NotebookOptions extends lifecycle_1.Disposable {
        constructor(targetWindow, configurationService, notebookExecutionStateService, codeEditorService, isReadonly, overrides) {
            super();
            this.targetWindow = targetWindow;
            this.configurationService = configurationService;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.codeEditorService = codeEditorService;
            this.isReadonly = isReadonly;
            this.overrides = overrides;
            this._onDidChangeOptions = this._register(new event_1.Emitter());
            this.onDidChangeOptions = this._onDidChangeOptions.event;
            this._editorTopPadding = 12;
            const showCellStatusBar = this.configurationService.getValue(notebookCommon_1.NotebookSetting.showCellStatusBar);
            const globalToolbar = overrides?.globalToolbar ?? this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbar) ?? true;
            const stickyScrollEnabled = overrides?.stickyScrollEnabled ?? this.configurationService.getValue(notebookCommon_1.NotebookSetting.stickyScrollEnabled) ?? false;
            const stickyScrollMode = this._computeStickyScrollModeOption();
            const consolidatedOutputButton = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedOutputButton) ?? true;
            const consolidatedRunButton = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedRunButton) ?? false;
            const dragAndDropEnabled = overrides?.dragAndDropEnabled ?? this.configurationService.getValue(notebookCommon_1.NotebookSetting.dragAndDropEnabled) ?? true;
            const cellToolbarLocation = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation) ?? { 'default': 'right' };
            const cellToolbarInteraction = overrides?.cellToolbarInteraction ?? this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            const compactView = this.configurationService.getValue(notebookCommon_1.NotebookSetting.compactView) ?? true;
            const focusIndicator = this._computeFocusIndicatorOption();
            const insertToolbarPosition = this._computeInsertToolbarPositionOption(this.isReadonly);
            const insertToolbarAlignment = this._computeInsertToolbarAlignmentOption();
            const showFoldingControls = this._computeShowFoldingControlsOption();
            // const { bottomToolbarGap, bottomToolbarHeight } = this._computeBottomToolbarDimensions(compactView, insertToolbarPosition, insertToolbarAlignment);
            const fontSize = this.configurationService.getValue('editor.fontSize');
            const markupFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.markupFontSize);
            let editorOptionsCustomizations = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations) ?? {};
            editorOptionsCustomizations = (0, types_1.isObject)(editorOptionsCustomizations) ? editorOptionsCustomizations : {};
            const interactiveWindowCollapseCodeCells = this.configurationService.getValue(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            // TOOD @rebornix remove after a few iterations of deprecated setting
            let outputLineHeightSettingValue;
            const deprecatedOutputLineHeightSetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputLineHeightDeprecated);
            if (deprecatedOutputLineHeightSetting !== undefined) {
                this._migrateDeprecatedSetting(notebookCommon_1.NotebookSetting.outputLineHeightDeprecated, notebookCommon_1.NotebookSetting.outputLineHeight);
                outputLineHeightSettingValue = deprecatedOutputLineHeightSetting;
            }
            else {
                outputLineHeightSettingValue = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputLineHeight);
            }
            let outputFontSize;
            const deprecatedOutputFontSizeSetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSizeDeprecated);
            if (deprecatedOutputFontSizeSetting !== undefined) {
                this._migrateDeprecatedSetting(notebookCommon_1.NotebookSetting.outputFontSizeDeprecated, notebookCommon_1.NotebookSetting.outputFontSize);
                outputFontSize = deprecatedOutputFontSizeSetting;
            }
            else {
                outputFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSize) || fontSize;
            }
            let outputFontFamily;
            const deprecatedOutputFontFamilySetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontFamilyDeprecated);
            if (deprecatedOutputFontFamilySetting !== undefined) {
                this._migrateDeprecatedSetting(notebookCommon_1.NotebookSetting.outputFontFamilyDeprecated, notebookCommon_1.NotebookSetting.outputFontFamily);
                outputFontFamily = deprecatedOutputFontFamilySetting;
            }
            else {
                outputFontFamily = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontFamily);
            }
            let outputScrolling;
            const deprecatedOutputScrollingSetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputScrollingDeprecated);
            if (deprecatedOutputScrollingSetting !== undefined) {
                this._migrateDeprecatedSetting(notebookCommon_1.NotebookSetting.outputScrollingDeprecated, notebookCommon_1.NotebookSetting.outputScrolling);
                outputScrolling = deprecatedOutputScrollingSetting;
            }
            else {
                outputScrolling = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputScrolling);
            }
            const outputLineHeight = this._computeOutputLineHeight(outputLineHeightSettingValue, outputFontSize);
            const outputWordWrap = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputWordWrap);
            const outputLineLimit = this.configurationService.getValue(notebookCommon_1.NotebookSetting.textOutputLineLimit) ?? 30;
            const linkifyFilePaths = this.configurationService.getValue(notebookCommon_1.NotebookSetting.LinkifyOutputFilePaths) ?? true;
            const minimalErrors = this.configurationService.getValue(notebookCommon_1.NotebookSetting.minimalErrorRendering);
            const editorTopPadding = this._computeEditorTopPadding();
            this._layoutConfiguration = {
                ...(compactView ? compactConfigConstants : defaultConfigConstants),
                cellTopMargin: 6,
                cellBottomMargin: 6,
                cellRightMargin: 16,
                cellStatusBarHeight: 22,
                cellOutputPadding: 8,
                markdownPreviewPadding: 8,
                // bottomToolbarHeight: bottomToolbarHeight,
                // bottomToolbarGap: bottomToolbarGap,
                editorToolbarHeight: 0,
                editorTopPadding: editorTopPadding,
                editorBottomPadding: 4,
                editorBottomPaddingWithoutStatusBar: 12,
                collapsedIndicatorHeight: 28,
                showCellStatusBar,
                globalToolbar,
                stickyScrollEnabled,
                stickyScrollMode,
                consolidatedOutputButton,
                consolidatedRunButton,
                dragAndDropEnabled,
                cellToolbarLocation,
                cellToolbarInteraction,
                compactView,
                focusIndicator,
                insertToolbarPosition,
                insertToolbarAlignment,
                showFoldingControls,
                fontSize,
                outputFontSize,
                outputFontFamily,
                outputLineHeight,
                markupFontSize,
                editorOptionsCustomizations,
                focusIndicatorGap: 3,
                interactiveWindowCollapseCodeCells,
                markdownFoldHintHeight: 22,
                outputScrolling: outputScrolling,
                outputWordWrap: outputWordWrap,
                outputLineLimit: outputLineLimit,
                outputLinkifyFilePaths: linkifyFilePaths,
                outputMinimalError: minimalErrors
            };
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                this._updateConfiguration(e);
            }));
        }
        updateOptions(isReadonly) {
            if (this.isReadonly !== isReadonly) {
                this.isReadonly = isReadonly;
                this._updateConfiguration({
                    affectsConfiguration(configuration) {
                        return configuration === notebookCommon_1.NotebookSetting.insertToolbarLocation;
                    },
                    source: 7 /* ConfigurationTarget.DEFAULT */,
                    affectedKeys: new Set([notebookCommon_1.NotebookSetting.insertToolbarLocation]),
                    change: { keys: [notebookCommon_1.NotebookSetting.insertToolbarLocation], overrides: [] },
                });
            }
        }
        _computeEditorTopPadding() {
            let decorationTriggeredAdjustment = false;
            const updateEditorTopPadding = (top) => {
                this._editorTopPadding = top;
                const configuration = Object.assign({}, this._layoutConfiguration);
                configuration.editorTopPadding = this._editorTopPadding;
                this._layoutConfiguration = configuration;
                this._onDidChangeOptions.fire({ editorTopPadding: true });
            };
            const decorationCheckSet = new Set();
            const onDidAddDecorationType = (e) => {
                if (decorationTriggeredAdjustment) {
                    return;
                }
                if (decorationCheckSet.has(e)) {
                    return;
                }
                try {
                    const options = this.codeEditorService.resolveDecorationOptions(e, true);
                    if (options.afterContentClassName || options.beforeContentClassName) {
                        const cssRules = this.codeEditorService.resolveDecorationCSSRules(e);
                        if (cssRules !== null) {
                            for (let i = 0; i < cssRules.length; i++) {
                                // The following ways to index into the list are equivalent
                                if ((cssRules[i].selectorText.endsWith('::after') || cssRules[i].selectorText.endsWith('::after'))
                                    && cssRules[i].cssText.indexOf('top:') > -1) {
                                    // there is a `::before` or `::after` text decoration whose position is above or below current line
                                    // we at least make sure that the editor top padding is at least one line
                                    const editorOptions = this.configurationService.getValue('editor');
                                    updateEditorTopPadding(fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(this.targetWindow).value).lineHeight + 2);
                                    decorationTriggeredAdjustment = true;
                                    break;
                                }
                            }
                        }
                    }
                    decorationCheckSet.add(e);
                }
                catch (_ex) {
                    // do not throw and break notebook
                }
            };
            this._register(this.codeEditorService.onDecorationTypeRegistered(onDidAddDecorationType));
            this.codeEditorService.listDecorationTypes().forEach(onDidAddDecorationType);
            return this._editorTopPadding;
        }
        _migrateDeprecatedSetting(deprecatedKey, key) {
            const deprecatedSetting = this.configurationService.inspect(deprecatedKey);
            if (deprecatedSetting.application !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 1 /* ConfigurationTarget.APPLICATION */);
                this.configurationService.updateValue(key, deprecatedSetting.application.value, 1 /* ConfigurationTarget.APPLICATION */);
            }
            if (deprecatedSetting.user !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 2 /* ConfigurationTarget.USER */);
                this.configurationService.updateValue(key, deprecatedSetting.user.value, 2 /* ConfigurationTarget.USER */);
            }
            if (deprecatedSetting.userLocal !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 3 /* ConfigurationTarget.USER_LOCAL */);
                this.configurationService.updateValue(key, deprecatedSetting.userLocal.value, 3 /* ConfigurationTarget.USER_LOCAL */);
            }
            if (deprecatedSetting.userRemote !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 4 /* ConfigurationTarget.USER_REMOTE */);
                this.configurationService.updateValue(key, deprecatedSetting.userRemote.value, 4 /* ConfigurationTarget.USER_REMOTE */);
            }
            if (deprecatedSetting.workspace !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 5 /* ConfigurationTarget.WORKSPACE */);
                this.configurationService.updateValue(key, deprecatedSetting.workspace.value, 5 /* ConfigurationTarget.WORKSPACE */);
            }
            if (deprecatedSetting.workspaceFolder !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
                this.configurationService.updateValue(key, deprecatedSetting.workspaceFolder.value, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            }
        }
        _computeOutputLineHeight(lineHeight, outputFontSize) {
            const minimumLineHeight = 9;
            if (lineHeight === 0) {
                // use editor line height
                const editorOptions = this.configurationService.getValue('editor');
                const fontInfo = fontMeasurements_1.FontMeasurements.readFontInfo(this.targetWindow, fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(this.targetWindow).value));
                lineHeight = fontInfo.lineHeight;
            }
            else if (lineHeight < minimumLineHeight) {
                // Values too small to be line heights in pixels are in ems.
                let fontSize = outputFontSize;
                if (fontSize === 0) {
                    fontSize = this.configurationService.getValue('editor.fontSize');
                }
                lineHeight = lineHeight * fontSize;
            }
            // Enforce integer, minimum constraints
            lineHeight = Math.round(lineHeight);
            if (lineHeight < minimumLineHeight) {
                lineHeight = minimumLineHeight;
            }
            return lineHeight;
        }
        _updateConfiguration(e) {
            const cellStatusBarVisibility = e.affectsConfiguration(notebookCommon_1.NotebookSetting.showCellStatusBar);
            const cellToolbarLocation = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellToolbarLocation);
            const cellToolbarInteraction = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            const compactView = e.affectsConfiguration(notebookCommon_1.NotebookSetting.compactView);
            const focusIndicator = e.affectsConfiguration(notebookCommon_1.NotebookSetting.focusIndicator);
            const insertToolbarPosition = e.affectsConfiguration(notebookCommon_1.NotebookSetting.insertToolbarLocation);
            const insertToolbarAlignment = e.affectsConfiguration(notebookCommon_1.NotebookSetting.experimentalInsertToolbarAlignment);
            const globalToolbar = e.affectsConfiguration(notebookCommon_1.NotebookSetting.globalToolbar);
            const stickyScrollEnabled = e.affectsConfiguration(notebookCommon_1.NotebookSetting.stickyScrollEnabled);
            const stickyScrollMode = e.affectsConfiguration(notebookCommon_1.NotebookSetting.stickyScrollMode);
            const consolidatedOutputButton = e.affectsConfiguration(notebookCommon_1.NotebookSetting.consolidatedOutputButton);
            const consolidatedRunButton = e.affectsConfiguration(notebookCommon_1.NotebookSetting.consolidatedRunButton);
            const showFoldingControls = e.affectsConfiguration(notebookCommon_1.NotebookSetting.showFoldingControls);
            const dragAndDropEnabled = e.affectsConfiguration(notebookCommon_1.NotebookSetting.dragAndDropEnabled);
            const fontSize = e.affectsConfiguration('editor.fontSize');
            const outputFontSize = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputFontSize);
            const markupFontSize = e.affectsConfiguration(notebookCommon_1.NotebookSetting.markupFontSize);
            const fontFamily = e.affectsConfiguration('editor.fontFamily');
            const outputFontFamily = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputFontFamily);
            const editorOptionsCustomizations = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
            const interactiveWindowCollapseCodeCells = e.affectsConfiguration(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            const outputLineHeight = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputLineHeight);
            const outputScrolling = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputScrolling);
            const outputWordWrap = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputWordWrap);
            const outputLinkifyFilePaths = e.affectsConfiguration(notebookCommon_1.NotebookSetting.LinkifyOutputFilePaths);
            const minimalError = e.affectsConfiguration(notebookCommon_1.NotebookSetting.minimalErrorRendering);
            if (!cellStatusBarVisibility
                && !cellToolbarLocation
                && !cellToolbarInteraction
                && !compactView
                && !focusIndicator
                && !insertToolbarPosition
                && !insertToolbarAlignment
                && !globalToolbar
                && !stickyScrollEnabled
                && !stickyScrollMode
                && !consolidatedOutputButton
                && !consolidatedRunButton
                && !showFoldingControls
                && !dragAndDropEnabled
                && !fontSize
                && !outputFontSize
                && !markupFontSize
                && !fontFamily
                && !outputFontFamily
                && !editorOptionsCustomizations
                && !interactiveWindowCollapseCodeCells
                && !outputLineHeight
                && !outputScrolling
                && !outputWordWrap
                && !outputLinkifyFilePaths
                && !minimalError) {
                return;
            }
            let configuration = Object.assign({}, this._layoutConfiguration);
            if (cellStatusBarVisibility) {
                configuration.showCellStatusBar = this.configurationService.getValue(notebookCommon_1.NotebookSetting.showCellStatusBar);
            }
            if (cellToolbarLocation) {
                configuration.cellToolbarLocation = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation) ?? { 'default': 'right' };
            }
            if (cellToolbarInteraction && !this.overrides?.cellToolbarInteraction) {
                configuration.cellToolbarInteraction = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            }
            if (focusIndicator) {
                configuration.focusIndicator = this._computeFocusIndicatorOption();
            }
            if (compactView) {
                const compactViewValue = this.configurationService.getValue(notebookCommon_1.NotebookSetting.compactView) ?? true;
                configuration = Object.assign(configuration, {
                    ...(compactViewValue ? compactConfigConstants : defaultConfigConstants),
                });
                configuration.compactView = compactViewValue;
            }
            if (insertToolbarAlignment) {
                configuration.insertToolbarAlignment = this._computeInsertToolbarAlignmentOption();
            }
            if (insertToolbarPosition) {
                configuration.insertToolbarPosition = this._computeInsertToolbarPositionOption(this.isReadonly);
            }
            if (globalToolbar && this.overrides?.globalToolbar === undefined) {
                configuration.globalToolbar = this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbar) ?? true;
            }
            if (stickyScrollEnabled && this.overrides?.stickyScrollEnabled === undefined) {
                configuration.stickyScrollEnabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.stickyScrollEnabled) ?? false;
            }
            if (stickyScrollMode) {
                configuration.stickyScrollMode = this.configurationService.getValue(notebookCommon_1.NotebookSetting.stickyScrollMode) ?? 'flat';
            }
            if (consolidatedOutputButton) {
                configuration.consolidatedOutputButton = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedOutputButton) ?? true;
            }
            if (consolidatedRunButton) {
                configuration.consolidatedRunButton = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedRunButton) ?? true;
            }
            if (showFoldingControls) {
                configuration.showFoldingControls = this._computeShowFoldingControlsOption();
            }
            if (dragAndDropEnabled) {
                configuration.dragAndDropEnabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.dragAndDropEnabled) ?? true;
            }
            if (fontSize) {
                configuration.fontSize = this.configurationService.getValue('editor.fontSize');
            }
            if (outputFontSize || fontSize) {
                configuration.outputFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSize) || configuration.fontSize;
            }
            if (markupFontSize) {
                configuration.markupFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.markupFontSize);
            }
            if (outputFontFamily) {
                configuration.outputFontFamily = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontFamily);
            }
            if (editorOptionsCustomizations) {
                configuration.editorOptionsCustomizations = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
            }
            if (interactiveWindowCollapseCodeCells) {
                configuration.interactiveWindowCollapseCodeCells = this.configurationService.getValue(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            }
            if (outputLineHeight || fontSize || outputFontSize) {
                const lineHeight = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputLineHeight);
                configuration.outputLineHeight = this._computeOutputLineHeight(lineHeight, configuration.outputFontSize);
            }
            if (outputWordWrap) {
                configuration.outputWordWrap = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputWordWrap);
            }
            if (outputScrolling) {
                configuration.outputScrolling = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputScrolling);
            }
            if (outputLinkifyFilePaths) {
                configuration.outputLinkifyFilePaths = this.configurationService.getValue(notebookCommon_1.NotebookSetting.LinkifyOutputFilePaths);
            }
            if (minimalError) {
                configuration.outputMinimalError = this.configurationService.getValue(notebookCommon_1.NotebookSetting.minimalErrorRendering);
            }
            this._layoutConfiguration = Object.freeze(configuration);
            // trigger event
            this._onDidChangeOptions.fire({
                cellStatusBarVisibility,
                cellToolbarLocation,
                cellToolbarInteraction,
                compactView,
                focusIndicator,
                insertToolbarPosition,
                insertToolbarAlignment,
                globalToolbar,
                stickyScrollEnabled,
                stickyScrollMode,
                showFoldingControls,
                consolidatedOutputButton,
                consolidatedRunButton,
                dragAndDropEnabled,
                fontSize,
                outputFontSize,
                markupFontSize,
                fontFamily,
                outputFontFamily,
                editorOptionsCustomizations,
                interactiveWindowCollapseCodeCells,
                outputLineHeight,
                outputScrolling,
                outputWordWrap,
                outputLinkifyFilePaths,
                minimalError
            });
        }
        _computeInsertToolbarPositionOption(isReadOnly) {
            return isReadOnly ? 'hidden' : this.configurationService.getValue(notebookCommon_1.NotebookSetting.insertToolbarLocation) ?? 'both';
        }
        _computeInsertToolbarAlignmentOption() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.experimentalInsertToolbarAlignment) ?? 'center';
        }
        _computeShowFoldingControlsOption() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.showFoldingControls) ?? 'mouseover';
        }
        _computeFocusIndicatorOption() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.focusIndicator) ?? 'gutter';
        }
        _computeStickyScrollModeOption() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.stickyScrollMode) ?? 'flat';
        }
        getCellCollapseDefault() {
            return this._layoutConfiguration.interactiveWindowCollapseCodeCells === 'never' ?
                {
                    codeCell: {
                        inputCollapsed: false
                    }
                } : {
                codeCell: {
                    inputCollapsed: true
                }
            };
        }
        getLayoutConfiguration() {
            return this._layoutConfiguration;
        }
        getDisplayOptions() {
            return this._layoutConfiguration;
        }
        getCellEditorContainerLeftMargin() {
            const { codeCellLeftMargin, cellRunGutter } = this._layoutConfiguration;
            return codeCellLeftMargin + cellRunGutter;
        }
        computeCollapsedMarkdownCellHeight(viewType) {
            const { bottomToolbarGap } = this.computeBottomToolbarDimensions(viewType);
            return this._layoutConfiguration.markdownCellTopMargin
                + this._layoutConfiguration.collapsedIndicatorHeight
                + bottomToolbarGap
                + this._layoutConfiguration.markdownCellBottomMargin;
        }
        computeBottomToolbarOffset(totalHeight, viewType) {
            const { bottomToolbarGap, bottomToolbarHeight } = this.computeBottomToolbarDimensions(viewType);
            return totalHeight
                - bottomToolbarGap
                - bottomToolbarHeight / 2;
        }
        computeCodeCellEditorWidth(outerWidth) {
            return outerWidth - (this._layoutConfiguration.codeCellLeftMargin
                + this._layoutConfiguration.cellRunGutter
                + this._layoutConfiguration.cellRightMargin);
        }
        computeMarkdownCellEditorWidth(outerWidth) {
            return outerWidth
                - this._layoutConfiguration.markdownCellGutter
                - this._layoutConfiguration.markdownCellLeftMargin
                - this._layoutConfiguration.cellRightMargin;
        }
        computeStatusBarHeight() {
            return this._layoutConfiguration.cellStatusBarHeight;
        }
        _computeBottomToolbarDimensions(compactView, insertToolbarPosition, insertToolbarAlignment, cellToolbar) {
            if (insertToolbarAlignment === 'left' || cellToolbar !== 'hidden') {
                return {
                    bottomToolbarGap: 18,
                    bottomToolbarHeight: 18
                };
            }
            if (insertToolbarPosition === 'betweenCells' || insertToolbarPosition === 'both') {
                return compactView ? {
                    bottomToolbarGap: 12,
                    bottomToolbarHeight: 20
                } : {
                    bottomToolbarGap: 20,
                    bottomToolbarHeight: 20
                };
            }
            else {
                return {
                    bottomToolbarGap: 0,
                    bottomToolbarHeight: 0
                };
            }
        }
        computeBottomToolbarDimensions(viewType) {
            const configuration = this._layoutConfiguration;
            const cellToolbarPosition = this.computeCellToolbarLocation(viewType);
            const { bottomToolbarGap, bottomToolbarHeight } = this._computeBottomToolbarDimensions(configuration.compactView, configuration.insertToolbarPosition, configuration.insertToolbarAlignment, cellToolbarPosition);
            return {
                bottomToolbarGap,
                bottomToolbarHeight
            };
        }
        computeCellToolbarLocation(viewType) {
            const cellToolbarLocation = this._layoutConfiguration.cellToolbarLocation;
            if (typeof cellToolbarLocation === 'string') {
                if (cellToolbarLocation === 'left' || cellToolbarLocation === 'right' || cellToolbarLocation === 'hidden') {
                    return cellToolbarLocation;
                }
            }
            else {
                if (viewType) {
                    const notebookSpecificSetting = cellToolbarLocation[viewType] ?? cellToolbarLocation['default'];
                    let cellToolbarLocationForCurrentView = 'right';
                    switch (notebookSpecificSetting) {
                        case 'left':
                            cellToolbarLocationForCurrentView = 'left';
                            break;
                        case 'right':
                            cellToolbarLocationForCurrentView = 'right';
                            break;
                        case 'hidden':
                            cellToolbarLocationForCurrentView = 'hidden';
                            break;
                        default:
                            cellToolbarLocationForCurrentView = 'right';
                            break;
                    }
                    return cellToolbarLocationForCurrentView;
                }
            }
            return 'right';
        }
        computeTopInsertToolbarHeight(viewType) {
            if (this._layoutConfiguration.insertToolbarPosition === 'betweenCells' || this._layoutConfiguration.insertToolbarPosition === 'both') {
                return SCROLLABLE_ELEMENT_PADDING_TOP;
            }
            const cellToolbarLocation = this.computeCellToolbarLocation(viewType);
            if (cellToolbarLocation === 'left' || cellToolbarLocation === 'right') {
                return SCROLLABLE_ELEMENT_PADDING_TOP;
            }
            return 0;
        }
        computeEditorPadding(internalMetadata, cellUri) {
            return {
                top: this._editorTopPadding,
                bottom: this.statusBarIsVisible(internalMetadata, cellUri)
                    ? this._layoutConfiguration.editorBottomPadding
                    : this._layoutConfiguration.editorBottomPaddingWithoutStatusBar
            };
        }
        computeEditorStatusbarHeight(internalMetadata, cellUri) {
            return this.statusBarIsVisible(internalMetadata, cellUri) ? this.computeStatusBarHeight() : 0;
        }
        statusBarIsVisible(internalMetadata, cellUri) {
            const exe = this.notebookExecutionStateService.getCellExecution(cellUri);
            if (this._layoutConfiguration.showCellStatusBar === 'visible') {
                return true;
            }
            else if (this._layoutConfiguration.showCellStatusBar === 'visibleAfterExecute') {
                return typeof internalMetadata.lastRunSuccess === 'boolean' || exe !== undefined;
            }
            else {
                return false;
            }
        }
        computeWebviewOptions() {
            return {
                outputNodePadding: this._layoutConfiguration.cellOutputPadding,
                outputNodeLeftPadding: this._layoutConfiguration.cellOutputPadding,
                previewNodePadding: this._layoutConfiguration.markdownPreviewPadding,
                markdownLeftMargin: this._layoutConfiguration.markdownCellGutter + this._layoutConfiguration.markdownCellLeftMargin,
                leftMargin: this._layoutConfiguration.codeCellLeftMargin,
                rightMargin: this._layoutConfiguration.cellRightMargin,
                runGutter: this._layoutConfiguration.cellRunGutter,
                dragAndDropEnabled: this._layoutConfiguration.dragAndDropEnabled,
                fontSize: this._layoutConfiguration.fontSize,
                outputFontSize: this._layoutConfiguration.outputFontSize,
                outputFontFamily: this._layoutConfiguration.outputFontFamily,
                markupFontSize: this._layoutConfiguration.markupFontSize,
                outputLineHeight: this._layoutConfiguration.outputLineHeight,
                outputScrolling: this._layoutConfiguration.outputScrolling,
                outputWordWrap: this._layoutConfiguration.outputWordWrap,
                outputLineLimit: this._layoutConfiguration.outputLineLimit,
                outputLinkifyFilePaths: this._layoutConfiguration.outputLinkifyFilePaths,
                minimalError: this._layoutConfiguration.outputMinimalError
            };
        }
        computeDiffWebviewOptions() {
            return {
                outputNodePadding: this._layoutConfiguration.cellOutputPadding,
                outputNodeLeftPadding: 0,
                previewNodePadding: this._layoutConfiguration.markdownPreviewPadding,
                markdownLeftMargin: 0,
                leftMargin: 32,
                rightMargin: 0,
                runGutter: 0,
                dragAndDropEnabled: false,
                fontSize: this._layoutConfiguration.fontSize,
                outputFontSize: this._layoutConfiguration.outputFontSize,
                outputFontFamily: this._layoutConfiguration.outputFontFamily,
                markupFontSize: this._layoutConfiguration.markupFontSize,
                outputLineHeight: this._layoutConfiguration.outputLineHeight,
                outputScrolling: this._layoutConfiguration.outputScrolling,
                outputWordWrap: this._layoutConfiguration.outputWordWrap,
                outputLineLimit: this._layoutConfiguration.outputLineLimit,
                outputLinkifyFilePaths: false,
                minimalError: false
            };
        }
        computeIndicatorPosition(totalHeight, foldHintHeight, viewType) {
            const { bottomToolbarGap } = this.computeBottomToolbarDimensions(viewType);
            return {
                bottomIndicatorTop: totalHeight - bottomToolbarGap - this._layoutConfiguration.cellBottomMargin - foldHintHeight,
                verticalIndicatorHeight: totalHeight - bottomToolbarGap - foldHintHeight
            };
        }
    }
    exports.NotebookOptions = NotebookOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPcHRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9zdGFyay92c2NvZGUtc3RhdGljLXdlYi90aGlyZF9wYXJ0eS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9ub3RlYm9va09wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyxNQUFNLDhCQUE4QixHQUFHLEVBQUUsQ0FBQztJQUU3QixRQUFBLDhCQUE4QixHQUFHLENBQUMsQ0FBQztJQXdGaEQsTUFBTSxzQkFBc0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzVDLGtCQUFrQixFQUFFLEVBQUU7UUFDdEIsYUFBYSxFQUFFLEVBQUU7UUFDakIscUJBQXFCLEVBQUUsQ0FBQztRQUN4Qix3QkFBd0IsRUFBRSxDQUFDO1FBQzNCLHNCQUFzQixFQUFFLENBQUM7UUFDekIsa0JBQWtCLEVBQUUsRUFBRTtRQUN0Qix3QkFBd0IsRUFBRSxDQUFDO0tBQzNCLENBQUMsQ0FBQztJQUVILE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM1QyxrQkFBa0IsRUFBRSxDQUFDO1FBQ3JCLGFBQWEsRUFBRSxFQUFFO1FBQ2pCLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsd0JBQXdCLEVBQUUsQ0FBQztRQUMzQixzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLGtCQUFrQixFQUFFLEVBQUU7UUFDdEIsd0JBQXdCLEVBQUUsQ0FBQztLQUMzQixDQUFDLENBQUM7SUFFSCxNQUFhLGVBQWdCLFNBQVEsc0JBQVU7UUFNOUMsWUFDVSxZQUF3QixFQUNoQixvQkFBMkMsRUFDM0MsNkJBQTZELEVBQzdELGlCQUFxQyxFQUM5QyxVQUFtQixFQUNWLFNBQWlJO1lBRWxKLEtBQUssRUFBRSxDQUFDO1lBUEMsaUJBQVksR0FBWixZQUFZLENBQVk7WUFDaEIseUJBQW9CLEdB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