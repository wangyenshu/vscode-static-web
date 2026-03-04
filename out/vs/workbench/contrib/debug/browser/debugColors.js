/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/base/common/color", "vs/nls", "vs/workbench/contrib/debug/browser/debugIcons", "vs/platform/theme/common/theme"], function (require, exports, colorRegistry_1, themeService_1, themables_1, color_1, nls_1, icons, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.debugIconStartForeground = exports.debugToolBarBorder = exports.debugToolBarBackground = void 0;
    exports.registerColors = registerColors;
    exports.debugToolBarBackground = (0, colorRegistry_1.registerColor)('debugToolBar.background', {
        dark: '#333333',
        light: '#F3F3F3',
        hcDark: '#000000',
        hcLight: '#FFFFFF'
    }, (0, nls_1.localize)('debugToolBarBackground', "Debug toolbar background color."));
    exports.debugToolBarBorder = (0, colorRegistry_1.registerColor)('debugToolBar.border', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('debugToolBarBorder', "Debug toolbar border color."));
    exports.debugIconStartForeground = (0, colorRegistry_1.registerColor)('debugIcon.startForeground', {
        dark: '#89D185',
        light: '#388A34',
        hcDark: '#89D185',
        hcLight: '#388A34'
    }, (0, nls_1.localize)('debugIcon.startForeground', "Debug toolbar icon for start debugging."));
    function registerColors() {
        const debugTokenExpressionName = (0, colorRegistry_1.registerColor)('debugTokenExpression.name', { dark: '#c586c0', light: '#9b46b0', hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for the token names shown in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionValue = (0, colorRegistry_1.registerColor)('debugTokenExpression.value', { dark: '#cccccc99', light: '#6c6c6ccc', hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for the token values shown in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionString = (0, colorRegistry_1.registerColor)('debugTokenExpression.string', { dark: '#ce9178', light: '#a31515', hcDark: '#f48771', hcLight: '#a31515' }, 'Foreground color for strings in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionBoolean = (0, colorRegistry_1.registerColor)('debugTokenExpression.boolean', { dark: '#4e94ce', light: '#0000ff', hcDark: '#75bdfe', hcLight: '#0000ff' }, 'Foreground color for booleans in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionNumber = (0, colorRegistry_1.registerColor)('debugTokenExpression.number', { dark: '#b5cea8', light: '#098658', hcDark: '#89d185', hcLight: '#098658' }, 'Foreground color for numbers in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionError = (0, colorRegistry_1.registerColor)('debugTokenExpression.error', { dark: '#f48771', light: '#e51400', hcDark: '#f48771', hcLight: '#e51400' }, 'Foreground color for expression errors in the debug views (ie. the Variables or Watch view) and for error logs shown in the debug console.');
        const debugViewExceptionLabelForeground = (0, colorRegistry_1.registerColor)('debugView.exceptionLabelForeground', { dark: colorRegistry_1.foreground, light: '#FFF', hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for a label shown in the CALL STACK view when the debugger breaks on an exception.');
        const debugViewExceptionLabelBackground = (0, colorRegistry_1.registerColor)('debugView.exceptionLabelBackground', { dark: '#6C2022', light: '#A31515', hcDark: '#6C2022', hcLight: '#A31515' }, 'Background color for a label shown in the CALL STACK view when the debugger breaks on an exception.');
        const debugViewStateLabelForeground = (0, colorRegistry_1.registerColor)('debugView.stateLabelForeground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for a label in the CALL STACK view showing the current session\'s or thread\'s state.');
        const debugViewStateLabelBackground = (0, colorRegistry_1.registerColor)('debugView.stateLabelBackground', { dark: '#88888844', light: '#88888844', hcDark: '#88888844', hcLight: '#88888844' }, 'Background color for a label in the CALL STACK view showing the current session\'s or thread\'s state.');
        const debugViewValueChangedHighlight = (0, colorRegistry_1.registerColor)('debugView.valueChangedHighlight', { dark: '#569CD6', light: '#569CD6', hcDark: '#569CD6', hcLight: '#569CD6' }, 'Color used to highlight value changes in the debug views (ie. in the Variables view).');
        const debugConsoleInfoForeground = (0, colorRegistry_1.registerColor)('debugConsole.infoForeground', { dark: colorRegistry_1.editorInfoForeground, light: colorRegistry_1.editorInfoForeground, hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for info messages in debug REPL console.');
        const debugConsoleWarningForeground = (0, colorRegistry_1.registerColor)('debugConsole.warningForeground', { dark: colorRegistry_1.editorWarningForeground, light: colorRegistry_1.editorWarningForeground, hcDark: '#008000', hcLight: colorRegistry_1.editorWarningForeground }, 'Foreground color for warning messages in debug REPL console.');
        const debugConsoleErrorForeground = (0, colorRegistry_1.registerColor)('debugConsole.errorForeground', { dark: colorRegistry_1.errorForeground, light: colorRegistry_1.errorForeground, hcDark: colorRegistry_1.errorForeground, hcLight: colorRegistry_1.errorForeground }, 'Foreground color for error messages in debug REPL console.');
        const debugConsoleSourceForeground = (0, colorRegistry_1.registerColor)('debugConsole.sourceForeground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for source filenames in debug REPL console.');
        const debugConsoleInputIconForeground = (0, colorRegistry_1.registerColor)('debugConsoleInputIcon.foreground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for debug console input marker icon.');
        const debugIconPauseForeground = (0, colorRegistry_1.registerColor)('debugIcon.pauseForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.pauseForeground', "Debug toolbar icon for pause."));
        const debugIconStopForeground = (0, colorRegistry_1.registerColor)('debugIcon.stopForeground', {
            dark: '#F48771',
            light: '#A1260D',
            hcDark: '#F48771',
            hcLight: '#A1260D'
        }, (0, nls_1.localize)('debugIcon.stopForeground', "Debug toolbar icon for stop."));
        const debugIconDisconnectForeground = (0, colorRegistry_1.registerColor)('debugIcon.disconnectForeground', {
            dark: '#F48771',
            light: '#A1260D',
            hcDark: '#F48771',
            hcLight: '#A1260D'
        }, (0, nls_1.localize)('debugIcon.disconnectForeground', "Debug toolbar icon for disconnect."));
        const debugIconRestartForeground = (0, colorRegistry_1.registerColor)('debugIcon.restartForeground', {
            dark: '#89D185',
            light: '#388A34',
            hcDark: '#89D185',
            hcLight: '#388A34'
        }, (0, nls_1.localize)('debugIcon.restartForeground', "Debug toolbar icon for restart."));
        const debugIconStepOverForeground = (0, colorRegistry_1.registerColor)('debugIcon.stepOverForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.stepOverForeground', "Debug toolbar icon for step over."));
        const debugIconStepIntoForeground = (0, colorRegistry_1.registerColor)('debugIcon.stepIntoForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.stepIntoForeground', "Debug toolbar icon for step into."));
        const debugIconStepOutForeground = (0, colorRegistry_1.registerColor)('debugIcon.stepOutForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.stepOutForeground', "Debug toolbar icon for step over."));
        const debugIconContinueForeground = (0, colorRegistry_1.registerColor)('debugIcon.continueForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.continueForeground', "Debug toolbar icon for continue."));
        const debugIconStepBackForeground = (0, colorRegistry_1.registerColor)('debugIcon.stepBackForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.stepBackForeground', "Debug toolbar icon for step back."));
        (0, themeService_1.registerThemingParticipant)((theme, collector) => {
            // All these colours provide a default value so they will never be undefined, hence the `!`
            const badgeBackgroundColor = theme.getColor(colorRegistry_1.badgeBackground);
            const badgeForegroundColor = theme.getColor(colorRegistry_1.badgeForeground);
            const listDeemphasizedForegroundColor = theme.getColor(colorRegistry_1.listDeemphasizedForeground);
            const debugViewExceptionLabelForegroundColor = theme.getColor(debugViewExceptionLabelForeground);
            const debugViewExceptionLabelBackgroundColor = theme.getColor(debugViewExceptionLabelBackground);
            const debugViewStateLabelForegroundColor = theme.getColor(debugViewStateLabelForeground);
            const debugViewStateLabelBackgroundColor = theme.getColor(debugViewStateLabelBackground);
            const debugViewValueChangedHighlightColor = theme.getColor(debugViewValueChangedHighlight);
            const toolbarHoverBackgroundColor = theme.getColor(colorRegistry_1.toolbarHoverBackground);
            collector.addRule(`
			/* Text colour of the call stack row's filename */
			.debug-pane .debug-call-stack .monaco-list-row:not(.selected) .stack-frame > .file .file-name {
				color: ${listDeemphasizedForegroundColor}
			}

			/* Line & column number "badge" for selected call stack row */
			.debug-pane .monaco-list-row.selected .line-number {
				background-color: ${badgeBackgroundColor};
				color: ${badgeForegroundColor};
			}

			/* Line & column number "badge" for unselected call stack row (basically all other rows) */
			.debug-pane .line-number {
				background-color: ${badgeBackgroundColor.transparent(0.6)};
				color: ${badgeForegroundColor.transparent(0.6)};
			}

			/* State "badge" displaying the active session's current state.
			* Only visible when there are more active debug sessions/threads running.
			*/
			.debug-pane .debug-call-stack .thread > .state.label,
			.debug-pane .debug-call-stack .session > .state.label {
				background-color: ${debugViewStateLabelBackgroundColor};
				color: ${debugViewStateLabelForegroundColor};
			}

			/* State "badge" displaying the active session's current state.
			* Only visible when there are more active debug sessions/threads running
			* and thread paused due to a thrown exception.
			*/
			.debug-pane .debug-call-stack .thread > .state.label.exception,
			.debug-pane .debug-call-stack .session > .state.label.exception {
				background-color: ${debugViewExceptionLabelBackgroundColor};
				color: ${debugViewExceptionLabelForegroundColor};
			}

			/* Info "badge" shown when the debugger pauses due to a thrown exception. */
			.debug-pane .call-stack-state-message > .label.exception {
				background-color: ${debugViewExceptionLabelBackgroundColor};
				color: ${debugViewExceptionLabelForegroundColor};
			}

			/* Animation of changed values in Debug viewlet */
			@keyframes debugViewletValueChanged {
				0%   { background-color: ${debugViewValueChangedHighlightColor.transparent(0)} }
				5%   { background-color: ${debugViewValueChangedHighlightColor.transparent(0.9)} }
				100% { background-color: ${debugViewValueChangedHighlightColor.transparent(0.3)} }
			}

			.debug-pane .monaco-list-row .expression .value.changed {
				background-color: ${debugViewValueChangedHighlightColor.transparent(0.3)};
				animation-name: debugViewletValueChanged;
				animation-duration: 1s;
				animation-fill-mode: forwards;
			}

			.monaco-list-row .expression .lazy-button:hover {
				background-color: ${toolbarHoverBackgroundColor}
			}
		`);
            const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
            if (contrastBorderColor) {
                collector.addRule(`
			.debug-pane .line-number {
				border: 1px solid ${contrastBorderColor};
			}
			`);
            }
            // Use fully-opaque colors for line-number badges
            if ((0, theme_1.isHighContrast)(theme.type)) {
                collector.addRule(`
			.debug-pane .line-number {
				background-color: ${badgeBackgroundColor};
				color: ${badgeForegroundColor};
			}`);
            }
            const tokenNameColor = theme.getColor(debugTokenExpressionName);
            const tokenValueColor = theme.getColor(debugTokenExpressionValue);
            const tokenStringColor = theme.getColor(debugTokenExpressionString);
            const tokenBooleanColor = theme.getColor(debugTokenExpressionBoolean);
            const tokenErrorColor = theme.getColor(debugTokenExpressionError);
            const tokenNumberColor = theme.getColor(debugTokenExpressionNumber);
            collector.addRule(`
			.monaco-workbench .monaco-list-row .expression .name {
				color: ${tokenNameColor};
			}

			.monaco-workbench .monaco-list-row .expression .value,
			.monaco-workbench .debug-hover-widget .value {
				color: ${tokenValueColor};
			}

			.monaco-workbench .monaco-list-row .expression .value.string,
			.monaco-workbench .debug-hover-widget .value.string {
				color: ${tokenStringColor};
			}

			.monaco-workbench .monaco-list-row .expression .value.boolean,
			.monaco-workbench .debug-hover-widget .value.boolean {
				color: ${tokenBooleanColor};
			}

			.monaco-workbench .monaco-list-row .expression .error,
			.monaco-workbench .debug-hover-widget .error,
			.monaco-workbench .debug-pane .debug-variables .scope .error {
				color: ${tokenErrorColor};
			}

			.monaco-workbench .monaco-list-row .expression .value.number,
			.monaco-workbench .debug-hover-widget .value.number {
				color: ${tokenNumberColor};
			}
		`);
            const debugConsoleInputBorderColor = theme.getColor(colorRegistry_1.inputBorder) || color_1.Color.fromHex('#80808060');
            const debugConsoleInfoForegroundColor = theme.getColor(debugConsoleInfoForeground);
            const debugConsoleWarningForegroundColor = theme.getColor(debugConsoleWarningForeground);
            const debugConsoleErrorForegroundColor = theme.getColor(debugConsoleErrorForeground);
            const debugConsoleSourceForegroundColor = theme.getColor(debugConsoleSourceForeground);
            const debugConsoleInputIconForegroundColor = theme.getColor(debugConsoleInputIconForeground);
            collector.addRule(`
			.repl .repl-input-wrapper {
				border-top: 1px solid ${debugConsoleInputBorderColor};
			}

			.monaco-workbench .repl .repl-tree .output .expression .value.info {
				color: ${debugConsoleInfoForegroundColor};
			}

			.monaco-workbench .repl .repl-tree .output .expression .value.warn {
				color: ${debugConsoleWarningForegroundColor};
			}

			.monaco-workbench .repl .repl-tree .output .expression .value.error {
				color: ${debugConsoleErrorForegroundColor};
			}

			.monaco-workbench .repl .repl-tree .output .expression .source {
				color: ${debugConsoleSourceForegroundColor};
			}

			.monaco-workbench .repl .repl-tree .monaco-tl-contents .arrow {
				color: ${debugConsoleInputIconForegroundColor};
			}
		`);
            if (!theme.defines(debugConsoleInputIconForeground)) {
                collector.addRule(`
				.monaco-workbench.vs .repl .repl-tree .monaco-tl-contents .arrow {
					opacity: 0.25;
				}

				.monaco-workbench.vs-dark .repl .repl-tree .monaco-tl-contents .arrow {
					opacity: 0.4;
				}

				.monaco-workbench.hc-black .repl .repl-tree .monaco-tl-contents .arrow,
				.monaco-workbench.hc-light .repl .repl-tree .monaco-tl-contents .arrow {
					opacity: 1;
				}
			`);
            }
            const debugIconStartColor = theme.getColor(exports.debugIconStartForeground);
            if (debugIconStartColor) {
                collector.addRule(`.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStart)} { color: ${debugIconStartColor}; }`);
            }
            const debugIconPauseColor = theme.getColor(debugIconPauseForeground);
            if (debugIconPauseColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugPause)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugPause)} { color: ${debugIconPauseColor}; }`);
            }
            const debugIconStopColor = theme.getColor(debugIconStopForeground);
            if (debugIconStopColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStop)},.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStop)} { color: ${debugIconStopColor}; }`);
            }
            const debugIconDisconnectColor = theme.getColor(debugIconDisconnectForeground);
            if (debugIconDisconnectColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugDisconnect)},.monaco-workbench .debug-view-content ${themables_1.ThemeIcon.asCSSSelector(icons.debugDisconnect)}, .monaco-workbench .debug-toolbar ${themables_1.ThemeIcon.asCSSSelector(icons.debugDisconnect)}, .monaco-workbench .command-center-center ${themables_1.ThemeIcon.asCSSSelector(icons.debugDisconnect)} { color: ${debugIconDisconnectColor}; }`);
            }
            const debugIconRestartColor = theme.getColor(debugIconRestartForeground);
            if (debugIconRestartColor) {
                collector.addRule(`.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugRestart)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugRestartFrame)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugRestart)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugRestartFrame)} { color: ${debugIconRestartColor}; }`);
            }
            const debugIconStepOverColor = theme.getColor(debugIconStepOverForeground);
            if (debugIconStepOverColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOver)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOver)} { color: ${debugIconStepOverColor}; }`);
            }
            const debugIconStepIntoColor = theme.getColor(debugIconStepIntoForeground);
            if (debugIconStepIntoColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepInto)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepInto)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStepInto)} { color: ${debugIconStepIntoColor}; }`);
            }
            const debugIconStepOutColor = theme.getColor(debugIconStepOutForeground);
            if (debugIconStepOutColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOut)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOut)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOut)} { color: ${debugIconStepOutColor}; }`);
            }
            const debugIconContinueColor = theme.getColor(debugIconContinueForeground);
            if (debugIconContinueColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugContinue)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugContinue)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugReverseContinue)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugReverseContinue)} { color: ${debugIconContinueColor}; }`);
            }
            const debugIconStepBackColor = theme.getColor(debugIconStepBackForeground);
            if (debugIconStepBackColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepBack)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStepBack)} { color: ${debugIconStepBackColor}; }`);
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb2xvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3N0YXJrL3ZzY29kZS1zdGF0aWMtd2ViL3RoaXJkX3BhcnR5L3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnQ29sb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStCaEcsd0NBNFRDO0lBalZZLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLHlCQUF5QixFQUFFO1FBQzlFLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsTUFBTSxFQUFFLFNBQVM7UUFDakIsT0FBTyxFQUFFLFNBQVM7S0FDbEIsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDLENBQUM7SUFFN0QsUUFBQSxrQkFBa0IsR0FBRyxJQUFBLDZCQUFhLEVBQUMscUJBQXFCLEVBQUU7UUFDdEUsSUFBSSxFQUFFLElBQUk7UUFDVixLQUFLLEVBQUUsSUFBSTtRQUNYLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLElBQUk7S0FDYixFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDZCQUE2QixDQUFDLENBQUMsQ0FBQztJQUVyRCxRQUFBLHdCQUF3QixHQUFHLElBQUEsNkJBQWEsRUFBQywyQkFBMkIsRUFBRTtRQUNsRixJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxTQUFTO1FBQ2hCLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLE9BQU8sRUFBRSxTQUFTO0tBQ2xCLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUseUNBQXlDLENBQUMsQ0FBQyxDQUFDO0lBRXJGLFNBQWdCLGNBQWM7UUFFN0IsTUFBTSx3QkFBd0IsR0FBRyxJQUFBLDZCQUFhLEVBQUMsMkJBQTJCLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxF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